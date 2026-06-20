"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ClipboardList, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Smartphone, 
  Calendar, 
  CheckSquare, 
  Settings, 
  ArrowLeft,
  XCircle,
  HelpCircle,
  AlertCircle,
  Database,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AjustePonto {
  id: string;
  colaborador_id: string | null;
  nome: string;
  telefone: string;
  data_referencia: string;
  motivo: string | null;
  resolvido: boolean;
  autorizado: boolean;
  fase_cobranca: number;
  data_ultima_cobranca: string | null;
  resposta_colaborador: string | null;
  data_resposta: string | null;
  created_at: string;
}

export default function GestaoPontoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [ocorrencias, setOcorrencias] = useState<AjustePonto[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "PENDENTES" | "COBRANDO" | "RESOLVIDOS">("PENDENTES");
  
  // Parâmetros de Configuração
  const [sheetId, setSheetId] = useState("1xovtMOpwLF1HPgts-Yn5oHZsk0YIxU42JqGb8VWy8Qo");
  const [webhookUrl, setWebhookUrl] = useState("https://n8n-n8n.rvwwep.easypanel.host/webhook/cobranca-ponto");
  const [showConfig, setShowConfig] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  useEffect(() => {
    fetchOcorrencias();
    fetchConfiguracoes();
  }, []);

  const fetchOcorrencias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ajustes_ponto")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOcorrencias(data || []);
    } catch (e: any) {
      toast.error("Erro ao buscar ocorrências: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfiguracoes = async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from("configuracoes_sistema")
        .select("*");

      if (error) {
        // Se a tabela não existir ainda, falha silenciosamente esperando a migração SQL
        console.warn("Tabela configuracoes_sistema não encontrada. Execute a migração SQL.");
        return;
      }

      if (data) {
        const urlConfig = data.find((c: any) => c.chave === "N8N_PONTO_WEBHOOK_URL");
        const sheetConfig = data.find((c: any) => c.chave === "GOOGLE_SHEETS_SPREADSHEET_ID");
        if (urlConfig) setWebhookUrl(urlConfig.valor);
        if (sheetConfig) setSheetId(sheetConfig.valor);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
    }
  };
  const handleSincronizar = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ponto/sync");
      if (!response.ok) {
        throw new Error("Erro na requisição ao servidor");
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      toast.success(`Sincronização com a Planilha concluída com sucesso! ${data.count || 0} registros analisados.`);
    } catch (e: any) {
      toast.error("Erro ao sincronizar planilha: " + e.message);
    } finally {
      fetchOcorrencias();
    }
  };

  const handleSalvarConfiguracoes = async () => {
    setLoadingConfig(true);
    try {
      const updates = [
        { chave: "N8N_PONTO_WEBHOOK_URL", valor: webhookUrl },
        { chave: "GOOGLE_SHEETS_SPREADSHEET_ID", valor: sheetId }
      ];

      const { error } = await supabase
        .from("configuracoes_sistema")
        .upsert(updates, { onConflict: "chave" });

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar configurações: " + e.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Envia requisição para o n8n informando o início ou avanço de cobrança
  const dispararWebhookCobranca = async (ocorrencia: AjustePonto, fase: number) => {
    try {
      const payload = {
        id: ocorrencia.id,
        nome: ocorrencia.nome,
        telefone: ocorrencia.telefone,
        data_referencia: ocorrencia.data_referencia,
        motivo: ocorrencia.motivo || "Ajuste Geral de Ponto",
        fase_cobranca: fase,
        spreadsheet_id: sheetId,
        timestamp: new Date().toISOString()
      };

      const response = await fetch("/api/cobranca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl, ...payload })
      });

      if (!response.ok) {
        throw new Error(`Servidor n8n respondeu com status: ${response.status}`);
      }
      return true;
    } catch (e: any) {
      console.error("Erro ao disparar webhook n8n:", e);
      toast.warning("Cobrança salva no BD, mas falhou ao notificar o n8n: " + e.message);
      return false;
    }
  };

  // Ação: Autorizar primeira cobrança (Fase 1)
  const handleAutorizarCobranca = async (item: AjustePonto) => {
    setSaving(item.id);
    const dataAgora = new Date().toISOString();
    try {
      const { error } = await supabase
        .from("ajustes_ponto")
        .update({
          autorizado: true,
          fase_cobranca: 1,
          data_ultima_cobranca: dataAgora,
          updated_at: dataAgora
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success(`Cobrança de ${item.nome} autorizada!`);
      
      // Dispara o fluxo no n8n
      await dispararWebhookCobranca({
        ...item,
        autorizado: true,
        fase_cobranca: 1,
        data_ultima_cobranca: dataAgora
      }, 1);

      fetchOcorrencias();
    } catch (e: any) {
      toast.error("Erro ao autorizar: " + e.message);
    } finally {
      setSaving(null);
    }
  };

  // Ação: Incrementar/Forçar recobrança (Fase 2 ou 3)
  const handleForcarRecobranca = async (item: AjustePonto) => {
    if (item.fase_cobranca >= 3) {
      toast.info("Este colaborador já recebeu a cobrança final (3ª fase).");
      return;
    }

    const novaFase = item.fase_cobranca + 1;
    setSaving(item.id);
    const dataAgora = new Date().toISOString();
    try {
      const { error } = await supabase
        .from("ajustes_ponto")
        .update({
          fase_cobranca: novaFase,
          data_ultima_cobranca: dataAgora,
          updated_at: dataAgora
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success(`Mensagem de cobrança da ${novaFase}ª Fase disparada para ${item.nome}!`);
      
      await dispararWebhookCobranca({
        ...item,
        fase_cobranca: novaFase,
        data_ultima_cobranca: dataAgora
      }, novaFase);

      fetchOcorrencias();
    } catch (e: any) {
      toast.error("Erro ao disparar recobrança: " + e.message);
    } finally {
      setSaving(null);
    }
  };

  // Ação: Resolver manualmente (Status Resolvido)
  const handleResolverManualmente = async (item: AjustePonto) => {
    setSaving(item.id);
    const dataAgora = new Date().toISOString();
    try {
      const { error } = await supabase
        .from("ajustes_ponto")
        .update({
          resolvido: true,
          updated_at: dataAgora
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success(`Caso de ${item.nome} marcado como RESOLVIDO!`);
      fetchOcorrencias();
    } catch (e: any) {
      toast.error("Erro ao finalizar ocorrência: " + e.message);
    } finally {
      setSaving(null);
    }
  };

  // Filtragem dos dados
  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter(item => {
      const matchBusca = item.nome.toLowerCase().includes(busca.toLowerCase()) || 
                         item.telefone.includes(busca) || 
                         (item.motivo && item.motivo.toLowerCase().includes(busca.toLowerCase()));
      
      if (!matchBusca) return false;

      if (filtroStatus === "PENDENTES") {
        return !item.resolvido && !item.autorizado;
      }
      if (filtroStatus === "COBRANDO") {
        return !item.resolvido && item.autorizado;
      }
      if (filtroStatus === "RESOLVIDOS") {
        return item.resolvido;
      }
      return true;
    });
  }, [ocorrencias, busca, filtroStatus]);

  // Estatísticas/KPIs
  const stats = useMemo(() => {
    return {
      total: ocorrencias.length,
      pendentes: ocorrencias.filter(i => !i.resolvido && !i.autorizado).length,
      cobrando: ocorrencias.filter(i => !i.resolvido && i.autorizado).length,
      resolvidos: ocorrencias.filter(i => i.resolvido).length,
      fase1: ocorrencias.filter(i => !i.resolvido && i.fase_cobranca === 1).length,
      fase2: ocorrencias.filter(i => !i.resolvido && i.fase_cobranca === 2).length,
      fase3: ocorrencias.filter(i => !i.resolvido && i.fase_cobranca === 3).length,
    };
  }, [ocorrencias]);

  // Formatação de data
  const formatarData = (dataStr: string) => {
    if (!dataStr) return "N/A";
    try {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return new Date(dataStr).toLocaleDateString("pt-BR");
    } catch (e) {
      return dataStr;
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in px-4 lg:px-20 py-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard/rh")}
            className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--brand)]/40 hover:bg-[var(--bg-card-hover)] transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">Gestão de Ponto</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Cobrança e Monitoramento Automatizado de Ajustes no MarqPonto</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSincronizar}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--bg-card-hover)] transition-all text-[var(--text-primary)]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sincronizar
          </button>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--bg-card-hover)] transition-all text-[var(--text-primary)]"
          >
            <Settings size={14} /> Configuração Planilha/Webhook
          </button>
        </div>
      </div>

      {/* Painel de Configurações */}
      {showConfig && (
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-xl animate-fade-in space-y-6">
          <h3 className="text-xs font-black uppercase text-[var(--text-primary)] tracking-widest flex items-center gap-2">
            <Settings size={14} className="text-[var(--brand)]" /> Parâmetros de Automação (Google Sheets & n8n)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1.5 block flex items-center gap-1">
                <FileSpreadsheet size={12} /> Link / ID da Planilha Google (Google Sheets)
              </label>
              <input 
                type="text" 
                className="input-field w-full font-bold text-xs" 
                placeholder="Ex: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ" 
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
              />
              <p className="text-[8px] text-[var(--text-muted)] font-medium mt-1 leading-relaxed uppercase">
                Insira o ID de planilha copiado da URL da planilha (código entre /d/ e /edit).
              </p>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1.5 block flex items-center gap-1">
                <Database size={12} /> URL do Webhook de Cobrança (n8n)
              </label>
              <input 
                type="text" 
                className="input-field w-full font-bold text-xs" 
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
              />
              <p className="text-[8px] text-[var(--text-muted)] font-medium mt-1 leading-relaxed uppercase">
                A URL do gatilho de webhook criado no seu workflow n8n.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSalvarConfiguracoes}
              disabled={loadingConfig}
              className="px-8 py-3 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loadingConfig ? "Gravando..." : "Salvar Configurações no Banco"}
            </button>
          </div>
        </div>
      )}

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ocorrências Abertas", val: stats.pendentes, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: AlertTriangle },
          { label: "Cobranças Ativas", val: stats.cobrando, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Send },
          { label: "Casos Resolvidos", val: stats.resolvidos, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle },
          { label: "Cobranças Fase 3", val: stats.fase3, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertCircle },
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-[var(--bg-card)] p-6 rounded-3xl border ${kpi.border} shadow-sm flex items-center justify-between`}>
            <div>
              <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{kpi.label}</p>
              <p className={`text-3xl font-black mt-2 leading-none ${kpi.color}`}>{kpi.val}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
              <kpi.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Filtros e Busca */}
      <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 bg-[var(--bg-base)]/40 p-1 rounded-xl border border-[var(--border)] w-full md:w-auto overflow-x-auto">
          {[
            { id: "PENDENTES", label: "Aguardando Autorização", count: stats.pendentes },
            { id: "COBRANDO", label: "Em Cobrança Ativa", count: stats.cobrando },
            { id: "RESOLVIDOS", label: "Resolvidos", count: stats.resolvidos },
            { id: "TODOS", label: "Todos", count: stats.total }
          ].map(opt => (
            <button 
              key={opt.id}
              onClick={() => setFiltroStatus(opt.id as any)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${filtroStatus === opt.id ? 'bg-[var(--brand)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              {opt.label} <span className={`text-[8px] px-1 rounded-full ${filtroStatus === opt.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{opt.count}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input 
            type="text" 
            className="input-field w-full pl-12 font-bold text-xs" 
            placeholder="Buscar por colaborador ou motivo..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-base)]/20 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
                <th className="p-5 w-[25%]">Colaborador / Contato</th>
                <th className="p-5 w-[15%]">Data Ocorrência</th>
                <th className="p-5 w-[20%]">Motivo do Ajuste</th>
                <th className="p-5 w-[18%]">Status da Cobrança</th>
                <th className="p-5 text-center w-[22%]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest animate-pulse">Carregando Dados...</div>
                  </td>
                </tr>
              ) : ocorrenciasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest italic border border-dashed border-[var(--border)] max-w-md mx-auto py-10 rounded-2xl">
                      Nenhuma ocorrência encontrada nesta categoria
                    </div>
                  </td>
                </tr>
              ) : (
                ocorrenciasFiltradas.map((item) => {
                  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                  let badgeText = "Aguardando Autorização";
                  
                  if (item.resolvido) {
                    badgeClass = "bg-green-100 text-green-700 border-green-200";
                    badgeText = "Resolvido";
                  } else if (item.autorizado) {
                    if (item.fase_cobranca === 1) {
                      badgeClass = "bg-blue-100 text-blue-700 border-blue-200 animate-pulse";
                      badgeText = "1ª Fase (Cobrado)";
                    } else if (item.fase_cobranca === 2) {
                      badgeClass = "bg-orange-100 text-orange-700 border-orange-200";
                      badgeText = "2ª Fase (Cobrança Forte)";
                    } else if (item.fase_cobranca === 3) {
                      badgeClass = "bg-red-100 text-red-700 border-red-200";
                      badgeText = "3ª Fase (Último Alerta)";
                    }
                  }

                  return (
                    <tr key={item.id} className="hover:bg-[var(--bg-card-hover)] transition-all">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[var(--brand-alpha)] text-[var(--brand)] flex items-center justify-center font-black text-xs uppercase">
                            {item.nome.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-xs font-black text-[var(--text-primary)]">{item.nome}</div>
                            <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <Smartphone size={10} /> {item.telefone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-[var(--text-muted)]" />
                          <span className="text-xs font-bold text-[var(--text-primary)]">{formatarData(item.data_referencia)}</span>
                        </div>
                      </td>

                      <td className="p-5">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">{item.motivo || "Não especificado"}</span>
                      </td>

                      <td className="p-5">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border w-fit ${badgeClass}`}>
                            {badgeText}
                          </span>
                          {item.resposta_colaborador && (
                            <div className="mt-1 bg-slate-50 border border-slate-100 rounded-xl p-2 max-w-[200px] shadow-sm text-left">
                              <span className="text-[10px] font-semibold text-slate-700 block italic leading-normal">
                                💬 "{item.resposta_colaborador}"
                              </span>
                              {item.data_resposta && (
                                <span className="text-[7px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mt-0.5">
                                  Resp: {new Date(item.data_resposta).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                                </span>
                              )}
                            </div>
                          )}
                          {item.data_ultima_cobranca && (
                            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">
                              U.C: {new Date(item.data_ultima_cobranca).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-5 text-center">
                        <div className="flex justify-center gap-2">
                          {!item.resolvido && !item.autorizado && (
                            <button
                              onClick={() => handleAutorizarCobranca(item)}
                              disabled={saving === item.id}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                              {saving === item.id ? "Enviando..." : "Autorizar Cobrança"}
                            </button>
                          )}

                          {!item.resolvido && item.autorizado && item.fase_cobranca < 3 && (
                            <button
                              onClick={() => handleForcarRecobranca(item)}
                              disabled={saving === item.id}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                              <RefreshCw size={10} className={saving === item.id ? "animate-spin" : ""} />
                              Cobrar Fase {item.fase_cobranca + 1}
                            </button>
                          )}

                          {!item.resolvido && (
                            <button
                              onClick={() => handleResolverManualmente(item)}
                              disabled={saving === item.id}
                              className="px-3 py-1.5 border border-green-600 text-green-600 hover:bg-green-500/10 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                              <CheckSquare size={10} /> Resolvido
                            </button>
                          )}

                          {item.resolvido && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-green-700 flex items-center gap-1 py-1 px-2.5 bg-green-50 rounded-lg">
                              <CheckCircle size={12} /> Concluído
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
