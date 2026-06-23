/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
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
  AlertCircle,
  Database,
  FileSpreadsheet,
  Clock,
  Plus,
  Printer,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  resposta_encarregado: string | null;
  data_resposta_encarregado: string | null;
  created_at: string;
  colaborador?: {
    id: string;
    nome: string;
    unidade_alocacao: string | null;
    telefone: string | null;
  } | null;
}

export default function GestaoPontoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [ocorrencias, setOcorrencias] = useState<AjustePonto[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "PENDENTES" | "COBRANDO" | "RESOLVIDOS">("PENDENTES");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [dataInicio, setDataInicio] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [dataFim, setDataFim] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  });
  
  // Parâmetros de Configuração
  const [sheetId, setSheetId] = useState("1xovtMOpwLF1HPgts-Yn5oHZsk0YIxU42JqGb8VWy8Qo");
  const [webhookUrl, setWebhookUrl] = useState("https://n8n-n8n.rvwwep.easypanel.host/webhook/cobranca-ponto");
  const [showConfig, setShowConfig] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  
  // Novos estados para Horários e Disparo
  const [horarios, setHorarios] = useState<string[]>([]);
  const [newHorario, setNewHorario] = useState("");
  const [loadingDisparo, setLoadingDisparo] = useState(false);

  // Estados para dados de unidades e rotas auxiliares
  const [unidadesList, setUnidadesList] = useState<any[]>([]);
  const [rotasList, setRotasList] = useState<any[]>([]);



  const fetchOcorrencias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ajustes_ponto")
        .select(`
          *,
          colaborador:usuarios(id, nome, unidade_alocacao, telefone)
        `)
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
        console.warn("Tabela configuracoes_sistema não encontrada. Execute a migração SQL.");
      } else if (data) {
        const urlConfig = data.find((c: any) => c.chave === "N8N_PONTO_WEBHOOK_URL");
        const sheetConfig = data.find((c: any) => c.chave === "GOOGLE_SHEETS_SPREADSHEET_ID");
        if (urlConfig) setWebhookUrl(urlConfig.valor);
        if (sheetConfig) setSheetId(sheetConfig.valor);
      }

      // Buscar horários cadastrados na tabela config_ponto
      const { data: hData, error: hError } = await supabase
        .from('config_ponto')
        .select('valor')
        .eq('chave', 'horarios_cobranca')
        .single();
      
      if (!hError && hData && Array.isArray(hData.valor)) {
        setHorarios(hData.valor);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
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

      // Salvar horários na tabela config_ponto
      const { error: hError } = await supabase
        .from('config_ponto')
        .upsert({
          chave: 'horarios_cobranca',
          valor: horarios,
          updated_at: new Date().toISOString()
        }, { onConflict: 'chave' });

      if (hError) throw hError;

      toast.success("Configurações e horários salvos com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar configurações: " + e.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleAddHorario = () => {
    if (!newHorario) return;
    if (horarios.includes(newHorario)) {
      toast.warning("Este horário já está cadastrado!");
      return;
    }
    setHorarios([...horarios, newHorario].sort());
    setNewHorario("");
  };

  const handleRemoveHorario = (hora: string) => {
    setHorarios(horarios.filter(h => h !== hora));
  };

  const handleDispararImediato = async () => {
    const totalAutorizados = ocorrencias.filter(o => o.autorizado && !o.resolvido).length;
    if (totalAutorizados === 0) {
      toast.info("Não há nenhuma cobrança autorizada e pendente na fila.");
      return;
    }

    const confirmar = window.confirm(`Deseja disparar as cobranças de ponto imediatamente para os ${totalAutorizados} colaboradores autorizados na fila? (O envio ocorrerá de forma espaçada a cada 30-50 segundos em segundo plano para proteção de banimento).`);
    if (!confirmar) return;

    setLoadingDisparo(true);
    try {
      const response = await fetch("/api/ponto/disparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual: true })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Erro desconhecido ao disparar cobranças");
      }

      const resData = await response.json();
      if (resData.disparados > 0) {
        toast.success(`Fila de disparo iniciada! ${resData.disparados} mensagens serão enviadas progressivamente.`);
      } else {
        toast.info("Nenhuma ocorrência elegível na fila para disparar (ou foram cobradas há menos de 5 min).");
      }
      
      setTimeout(fetchOcorrencias, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao disparar cobranças: " + err.message);
    } finally {
      setLoadingDisparo(false);
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

  const fetchDadosAuxiliares = async () => {
    try {
      const { data: uData } = await supabase
        .from('unidades')
        .select('nome, rota, encarregado_nome, encarregado_id');
      if (uData) setUnidadesList(uData);

      const { data: rData } = await supabase
        .from('config_rotas')
        .select('rota_nome, encarregado_nome, encarregado_id');
      if (rData) setRotasList(rData);
    } catch (e) {
      console.error("Erro ao buscar dados auxiliares de alocação:", e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOcorrencias();
    fetchConfiguracoes();
    fetchDadosAuxiliares();

    const saved = localStorage.getItem("crm_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao ler crm_user:", e);
      }
    }
  }, []);

  const obterAlocacaoColaborador = (unidadeAlocacao: string | null) => {
    if (!unidadeAlocacao) return { rota: "Sem Rota", encarregado: "Sem Encarregado", encarregado_id: null };

    const unidade = unidadesList.find(u => u.nome === unidadeAlocacao);
    if (!unidade) {
      return { rota: "Rota não mapeada", encarregado: "Não mapeado", encarregado_id: null };
    }

    const rota = unidade.rota || "Sem Rota";
    let encarregado = unidade.encarregado_nome || "Sem Encarregado";
    let encarregado_id = unidade.encarregado_id || null;

    if ((!encarregado || encarregado === "Sem Encarregado") && unidade.rota) {
      const rotaConfig = rotasList.find(r => r.rota_nome?.toLowerCase() === unidade.rota.toLowerCase());
      if (rotaConfig) {
        if (rotaConfig.encarregado_nome) encarregado = rotaConfig.encarregado_nome;
        if (rotaConfig.encarregado_id) encarregado_id = rotaConfig.encarregado_id;
      }
    }

    return { rota, encarregado, encarregado_id };
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
          data_ultima_cobranca: null, // Fica nulo até que ocorra o disparo manual ou automático
          updated_at: dataAgora
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success(`Cobrança de ${item.nome} autorizada! Ela aguardará o horário programado ou o disparo imediato.`);
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

  // Exportar Excel (CSV)
  const handleExportarExcel = () => {
    if (ocorrenciasFiltradas.length === 0) {
      return toast.info("Não há dados para exportar no período selecionado.");
    }

    const headers = [
      "Colaborador",
      "Telefone",
      "Rota",
      "Encarregado",
      "Data Ocorrencia",
      "Motivo",
      "Status",
      "Fase Cobranca",
      "Ultima Cobranca"
    ];

    const rows = ocorrenciasFiltradas.map(item => {
      const aloc = obterAlocacaoColaborador(item.colaborador?.unidade_alocacao || null);
      let statusText = "Aguardando Autorização";
      if (item.resolvido) statusText = "Resolvido";
      else if (item.autorizado) statusText = item.data_ultima_cobranca ? `Fase ${item.fase_cobranca}` : "Autorizado (Fila)";

      return [
        item.nome,
        item.telefone,
        aloc.rota,
        aloc.encarregado,
        formatarData(item.data_referencia),
        item.motivo || "Geral",
        statusText,
        item.fase_cobranca || 0,
        item.data_ultima_cobranca ? new Date(item.data_ultima_cobranca).toLocaleDateString("pt-BR") : "Nunca"
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_ponto_${dataInicio}_a_${dataFim}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel (CSV) exportado com sucesso!");
  };

  // Imprimir PDF
  const handleImprimirPDF = () => {
    if (ocorrenciasFiltradas.length === 0) {
      return toast.info("Não há dados para exportar no período selecionado.");
    }

    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ALICERCE CONSTRUTORA - GESTÃO DE PONTO", 14, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Período do Relatório: ${formatarData(dataInicio)} até ${formatarData(dataFim)}`, 14, 22);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 27);

    const tableData = ocorrenciasFiltradas.map(item => {
      const aloc = obterAlocacaoColaborador(item.colaborador?.unidade_alocacao || null);
      let statusText = "Aguardando Autorização";
      if (item.resolvido) statusText = "Resolvido";
      else if (item.autorizado) statusText = item.data_ultima_cobranca ? `Fase ${item.fase_cobranca}` : "Autorizado (Fila)";

      return [
        item.nome.toUpperCase(),
        item.colaborador?.unidade_alocacao || "OPERAÇÃO",
        formatarData(item.data_referencia),
        item.motivo || "Ajuste Geral",
        statusText
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [["Colaborador", "Unidade", "Data", "Motivo", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 45 },
        4: { cellWidth: 35 }
      }
    });

    doc.save(`relatorio_ponto_${dataInicio}_a_${dataFim}.pdf`);
    toast.success("Relatório PDF gerado com sucesso!");
  };

  const isManagerOrAdmin = useMemo(() => {
    if (!currentUser) return false;
    const safeRole = String(currentUser.role || '').toUpperCase();
    return (currentUser.nivel || 0) >= 3 || ["DEV", "ADMIN", "GERENTE", "GERENCIA"].includes(safeRole);
  }, [currentUser]);

  const supervisorRoutes = useMemo(() => {
    if (!currentUser) return [];
    const safeRole = String(currentUser.role || '').toUpperCase();
    const isManager = (currentUser.nivel || 0) >= 3 || ["DEV", "ADMIN", "GERENTE", "GERENCIA"].includes(safeRole);
    
    if (isManager) return null; // Admin pode ver tudo

    const myId = currentUser.id;
    const myName = String(currentUser.nome || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Busca rotas de unidades associadas ao supervisor
    const routesFromUnits = unidadesList
      .filter(u => {
        const matchId = u.encarregado_id === myId;
        const uName = String(u.encarregado_nome || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchName = myName && uName === myName;
        return (matchId || matchName) && u.rota;
      })
      .map(u => String(u.rota).trim().toLowerCase());

    // Busca rotas da tabela config_rotas associadas ao supervisor
    const routesFromConfig = rotasList
      .filter(r => {
        const matchId = r.encarregado_id === myId;
        const rName = String(r.encarregado_nome || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchName = myName && rName === myName;
        return (matchId || matchName) && r.rota_nome;
      })
      .map(r => String(r.rota_nome).trim().toLowerCase());

    return Array.from(new Set([...routesFromUnits, ...routesFromConfig]));
  }, [currentUser, unidadesList, rotasList]);

  // Filtragem dos dados
  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter(item => {
      // Filtro de Rota para Supervisor
      if (!isManagerOrAdmin && supervisorRoutes) {
        const aloc = obterAlocacaoColaborador(item.colaborador?.unidade_alocacao || null);
        const itemRotaNormalized = String(aloc.rota || '').trim().toLowerCase();
        const belongsToMyRoute = supervisorRoutes.includes(itemRotaNormalized) || 
                                 (currentUser?.id && aloc.encarregado_id === currentUser.id);
        if (!belongsToMyRoute) return false;
      }

      const matchBusca = item.nome.toLowerCase().includes(busca.toLowerCase()) || 
                         item.telefone.includes(busca) || 
                         (item.motivo && item.motivo.toLowerCase().includes(busca.toLowerCase()));
      
      if (!matchBusca) return false;

      const matchPeriodo = (!dataInicio || item.data_referencia >= dataInicio) &&
                           (!dataFim || item.data_referencia <= dataFim);
      if (!matchPeriodo) return false;

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
  }, [ocorrencias, busca, filtroStatus, dataInicio, dataFim, isManagerOrAdmin, supervisorRoutes, currentUser]);

  // Estatísticas/KPIs
  const stats = useMemo(() => {
    const periodData = ocorrencias.filter(item => {
      // Filtro de Rota para Supervisor
      if (!isManagerOrAdmin && supervisorRoutes) {
        const aloc = obterAlocacaoColaborador(item.colaborador?.unidade_alocacao || null);
        const itemRotaNormalized = String(aloc.rota || '').trim().toLowerCase();
        const belongsToMyRoute = supervisorRoutes.includes(itemRotaNormalized) || 
                                 (currentUser?.id && aloc.encarregado_id === currentUser.id);
        if (!belongsToMyRoute) return false;
      }

      return (!dataInicio || item.data_referencia >= dataInicio) &&
             (!dataFim || item.data_referencia <= dataFim);
    });
    return {
      total: periodData.length,
      pendentes: periodData.filter(i => !i.resolvido && !i.autorizado).length,
      cobrando: periodData.filter(i => !i.resolvido && i.autorizado).length,
      resolvidos: periodData.filter(i => i.resolvido).length,
      fase1: periodData.filter(i => !i.resolvido && i.fase_cobranca === 1).length,
      fase2: periodData.filter(i => !i.resolvido && i.fase_cobranca === 2).length,
      fase3: periodData.filter(i => !i.resolvido && i.fase_cobranca === 3).length,
    };
  }, [ocorrencias, dataInicio, dataFim, isManagerOrAdmin, supervisorRoutes, currentUser]);

  // Formatação de data
  const formatarData = (dataStr: string) => {
    if (!dataStr) return "N/A";
    try {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return new Date(dataStr).toLocaleDateString("pt-BR");
    } catch {
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
          {isManagerOrAdmin && (
            <>
              <button 
                onClick={handleDispararImediato}
                disabled={loadingDisparo}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-orange-600/10"
              >
                <Send size={14} className={loadingDisparo ? "animate-pulse" : ""} /> Disparar Imediato
              </button>
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
                <Settings size={14} /> Configurações
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtro de Período e Exportações */}
      <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--brand)]" />
            <span className="text-xs font-black uppercase text-[var(--text-primary)] tracking-wider">Período do Relatório:</span>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Data Início</label>
              <input 
                type="date" 
                className="input-field py-1 px-3 font-bold text-xs h-10 w-full md:w-40" 
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
              />
            </div>
            <span className="text-[var(--text-muted)] mt-4">até</span>
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Data Fim</label>
              <input 
                type="date" 
                className="input-field py-1 px-3 font-bold text-xs h-10 w-full md:w-40" 
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={handleExportarExcel}
            className="flex-1 md:flex-none px-5 h-12 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all"
          >
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>
          <button 
            onClick={handleImprimirPDF}
            className="flex-1 md:flex-none px-5 h-12 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-all"
          >
            <Printer size={16} /> Imprimir PDF
          </button>
        </div>
      </div>

      {/* Painel de Configurações */}
      {showConfig && isManagerOrAdmin && (
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-xl animate-fade-in space-y-6">
          <h3 className="text-xs font-black uppercase text-[var(--text-primary)] tracking-widest flex items-center gap-2">
            <Settings size={14} className="text-[var(--brand)]" /> Parâmetros de Automação e Horários de Disparo
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Configuração de Horários de Disparo */}
            <div className="border-t md:border-t-0 md:border-l border-[var(--border)] md:pl-6 pt-6 md:pt-0">
              <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1.5 block flex items-center gap-1">
                <Clock size={12} /> Horários de Cobrança Automática
              </label>
              
              <div className="flex gap-2 mb-3">
                <input 
                  type="time" 
                  className="input-field py-1 font-bold text-xs" 
                  value={newHorario}
                  onChange={e => setNewHorario(e.target.value)}
                />
                <button
                  onClick={handleAddHorario}
                  className="p-2 bg-[var(--brand)] text-white rounded-xl hover:scale-105 transition-all flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>

              {horarios.length === 0 ? (
                <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider">
                  Nenhum horário configurado! (Cobrança automática pausada).
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {horarios.map(hora => (
                    <span 
                      key={hora} 
                      className="px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[10px] font-black flex items-center gap-1.5 text-[var(--text-primary)] hover:border-red-300 transition-colors"
                    >
                      {hora}
                      <button 
                        onClick={() => handleRemoveHorario(hora)}
                        className="text-[var(--text-muted)] hover:text-red-600 transition-colors"
                      >
                        <XCircle size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[var(--border)]">
            <button 
              onClick={handleSalvarConfiguracoes}
              disabled={loadingConfig}
              className="px-8 py-3 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 shadow-md shadow-[var(--brand)]/10"
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
                    if (!item.data_ultima_cobranca) {
                      badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
                      badgeText = "Autorizado (Fila)";
                    } else if (item.fase_cobranca === 1) {
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
                            {/* Rota e Encarregado */}
                            {(() => {
                              const aloc = obterAlocacaoColaborador(item.colaborador?.unidade_alocacao || null);
                              const confirmado = !!item.resposta_encarregado;
                              return (
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1 flex-wrap">
                                  <span>📍 {aloc.rota}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className={confirmado ? "text-green-600 font-bold" : ""}>
                                    👤 {aloc.encarregado}{confirmado ? " ✓ (Confirmou)" : ""}
                                  </span>
                                </div>
                              );
                            })()}
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
                                 💬 Colab: &quot;{item.resposta_colaborador}&quot;
                               </span>
                               {item.data_resposta && (
                                 <span className="text-[7px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mt-0.5">
                                   Resp: {new Date(item.data_resposta).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                                 </span>
                               )}
                             </div>
                           )}
                           {item.resposta_encarregado && (
                             <div className="mt-1 bg-green-50 border border-green-100 rounded-xl p-2 max-w-[200px] shadow-sm text-left">
                               <span className="text-[10px] font-semibold text-green-800 block italic leading-normal">
                                 💬 Supervisor: &quot;{item.resposta_encarregado}&quot;
                               </span>
                               {item.data_resposta_encarregado && (
                                 <span className="text-[7px] text-green-600 font-bold uppercase tracking-wider block mt-0.5">
                                   Confirmou: {new Date(item.data_resposta_encarregado).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
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
