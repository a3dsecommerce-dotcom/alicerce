"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  UserX, Search, Archive, AlertTriangle, Calendar, FileText,
  User, Building2, Filter, ChevronDown, X, Check, Clock, Shield,
  RefreshCw, Download
} from "lucide-react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import { toast } from "sonner";

type StatusColaborador = "ATIVO" | "AFASTADO_INSS" | "ATESTADO" | "FERIAS" | "DEMITIDO" | "ARQUIVO_MORTO";
type MotivoDemissao = "JUSTA_CAUSA" | "SEM_JUSTA_CAUSA" | "PEDIDO" | "ACORDO_MUTUO" | "TERMINO_CONTRATO" | "FALECIMENTO";

const STATUS_CONFIG: Record<StatusColaborador, { label: string; color: string; bg: string; border: string }> = {
  ATIVO:         { label: "Ativo",          color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  AFASTADO_INSS: { label: "Afastado INSS",  color: "text-amber-600",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  ATESTADO:      { label: "Atestado",       color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  FERIAS:        { label: "Férias",         color: "text-cyan-600",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
  DEMITIDO:      { label: "Demitido",       color: "text-red-600",     bg: "bg-red-500/10",     border: "border-red-500/20" },
  ARQUIVO_MORTO: { label: "Arquivo Morto",  color: "text-slate-500",   bg: "bg-slate-500/10",   border: "border-slate-500/20" },
};

const MOTIVOS_DEMISSAO: Record<MotivoDemissao, string> = {
  JUSTA_CAUSA:      "Justa Causa",
  SEM_JUSTA_CAUSA:  "Sem Justa Causa",
  PEDIDO:           "Pedido do Colaborador",
  ACORDO_MUTUO:     "Acordo Mútuo",
  TERMINO_CONTRATO: "Término de Contrato",
  FALECIMENTO:      "Falecimento",
};

export default function DemissoesManager({ user }: { user: any }) {
  const [view, setView] = useState<"COLABORADORES" | "DEMITIDOS" | "ARQUIVO">("COLABORADORES");
  const [loading, setLoading] = useState(true);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroUnidade, setFiltroUnidade] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedColab, setSelectedColab] = useState<any>(null);
  const [demissaoData, setDemissaoData] = useState({
    data_demissao: new Date().toISOString().split("T")[0],
    motivo: "SEM_JUSTA_CAUSA" as MotivoDemissao,
    observacoes: "",
    autorizado_por: user?.nome || "",
  });
  const [saving, setSaving] = useState(false);

  const fetchColaboradores = async () => {
    setLoading(true);
    try {
      let query = supabase.from("usuarios").select("*").order("nome");

      if (view === "COLABORADORES") {
        query = query.in("status", ["ATIVO", "AFASTADO_INSS", "ATESTADO", "FERIAS"]);
      } else if (view === "DEMITIDOS") {
        query = query.eq("status", "DEMITIDO");
      } else {
        query = query.eq("status", "ARQUIVO_MORTO");
      }

      const { data, error } = await query;
      if (error) throw error;
      setColaboradores(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, [view]);

  const openDemissaoModal = (colab: any) => {
    setSelectedColab(colab);
    setDemissaoData({
      data_demissao: new Date().toISOString().split("T")[0],
      motivo: "SEM_JUSTA_CAUSA",
      observacoes: "",
      autorizado_por: user?.nome || "",
    });
    setShowModal(true);
  };

  const handleDemitir = async () => {
    if (!selectedColab) return;
    if (!demissaoData.data_demissao) {
      toast.error("Data de demissão é obrigatória");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          status: "DEMITIDO",
          dados_demissao: {
            data_demissao: demissaoData.data_demissao,
            motivo: demissaoData.motivo,
            motivo_label: MOTIVOS_DEMISSAO[demissaoData.motivo],
            observacoes: demissaoData.observacoes,
            autorizado_por: demissaoData.autorizado_por,
            executado_por: user?.nome || "Sistema",
            executado_em: new Date().toISOString(),
          },
        })
        .eq("id", selectedColab.id);

      if (error) throw error;

      // Log de atividade
      await supabase.from("atividades").insert([
        {
          usuario_id: user.id,
          usuario_nome: user.nome || user.name,
          mensagem: `Registrou demissão de ${selectedColab.nome} — ${MOTIVOS_DEMISSAO[demissaoData.motivo]}`,
          tipo: "RH",
          created_at: new Date().toISOString(),
        },
      ]);

      toast.success(`${selectedColab.nome} foi demitido(a) com sucesso`);
      setShowModal(false);
      setSelectedColab(null);
      fetchColaboradores();
    } catch (err: any) {
      toast.error("Erro ao processar demissão: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArquivoMorto = async (colab: any) => {
    if (!confirm(`Enviar ${colab.nome} para o Arquivo Morto? O registro será preservado mas ficará oculto do sistema ativo.`)) return;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          status: "ARQUIVO_MORTO",
          dados_demissao: {
            ...(colab.dados_demissao || {}),
            arquivado_em: new Date().toISOString(),
            arquivado_por: user?.nome || "Sistema",
          },
        })
        .eq("id", colab.id);

      if (error) throw error;

      await supabase.from("atividades").insert([
        {
          usuario_id: user.id,
          usuario_nome: user.nome || user.name,
          mensagem: `Enviou ${colab.nome} para Arquivo Morto`,
          tipo: "RH",
          created_at: new Date().toISOString(),
        },
      ]);

      toast.success(`${colab.nome} enviado para Arquivo Morto`);
      fetchColaboradores();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const handleAlterarStatus = async (colab: any, novoStatus: StatusColaborador) => {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ status: novoStatus })
        .eq("id", colab.id);

      if (error) throw error;

      await supabase.from("atividades").insert([
        {
          usuario_id: user.id,
          usuario_nome: user.nome || user.name,
          mensagem: `Alterou status de ${colab.nome} para ${STATUS_CONFIG[novoStatus].label}`,
          tipo: "RH",
          created_at: new Date().toISOString(),
        },
      ]);

      toast.success(`Status de ${colab.nome} alterado para ${STATUS_CONFIG[novoStatus].label}`);
      fetchColaboradores();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  // Filtros
  const unidades = useMemo(() => Array.from(new Set(colaboradores.map((c) => c.unidade_alocacao).filter(Boolean))).sort(), [colaboradores]);

  const filteredColabs = useMemo(() => {
    return colaboradores.filter((c) => {
      const matchBusca = !busca || c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.cargo?.toLowerCase().includes(busca.toLowerCase());
      const matchUnidade = !filtroUnidade || c.unidade_alocacao === filtroUnidade;
      const matchMotivo = !filtroMotivo || c.dados_demissao?.motivo === filtroMotivo;
      const matchPeriodo = !filtroPeriodo || (() => {
        const dataDem = c.dados_demissao?.data_demissao;
        if (!dataDem) return false;
        const demDate = new Date(dataDem);
        const now = new Date();
        if (filtroPeriodo === "7d") return (now.getTime() - demDate.getTime()) <= 7 * 86400000;
        if (filtroPeriodo === "30d") return (now.getTime() - demDate.getTime()) <= 30 * 86400000;
        if (filtroPeriodo === "90d") return (now.getTime() - demDate.getTime()) <= 90 * 86400000;
        if (filtroPeriodo === "365d") return (now.getTime() - demDate.getTime()) <= 365 * 86400000;
        return true;
      })();
      return matchBusca && matchUnidade && matchMotivo && matchPeriodo;
    });
  }, [colaboradores, busca, filtroUnidade, filtroMotivo, filtroPeriodo]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border)] shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
              <UserX className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">
                Gestão de Desligamentos
              </h3>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                Demissões, Afastamentos e Arquivo Morto
              </p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 bg-[var(--bg-base)] p-2 rounded-2xl border border-[var(--border)]">
            <button
              onClick={() => setView("COLABORADORES")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === "COLABORADORES" ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"}`}
            >
              <User size={14} /> Colaboradores
            </button>
            <button
              onClick={() => setView("DEMITIDOS")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === "DEMITIDOS" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"}`}
            >
              <UserX size={14} /> Demitidos
              {view !== "DEMITIDOS" && colaboradores.length > 0 && view === "COLABORADORES" && null}
            </button>
            <button
              onClick={() => setView("ARQUIVO")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === "ARQUIVO" ? "bg-slate-700 text-white shadow-lg shadow-slate-700/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"}`}
            >
              <Archive size={14} /> Arquivo Morto
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="input-field w-full pl-11 !h-12 text-[10px] font-black uppercase"
            placeholder="Buscar por nome ou cargo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="input-field !h-12 text-[10px] font-black uppercase min-w-[160px]"
          value={filtroUnidade}
          onChange={(e) => setFiltroUnidade(e.target.value)}
        >
          <option value="">Todas Unidades</option>
          {unidades.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        {(view === "DEMITIDOS" || view === "ARQUIVO") && (
          <>
            <select
              className="input-field !h-12 text-[10px] font-black uppercase min-w-[160px]"
              value={filtroMotivo}
              onChange={(e) => setFiltroMotivo(e.target.value)}
            >
              <option value="">Todos os Motivos</option>
              {Object.entries(MOTIVOS_DEMISSAO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              className="input-field !h-12 text-[10px] font-black uppercase min-w-[140px]"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
            >
              <option value="">Todo Período</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="365d">Último ano</option>
            </select>
          </>
        )}
        <button
          onClick={fetchColaboradores}
          className="h-12 px-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] hover:bg-[var(--brand)] hover:text-white transition-all"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Contadores */}
      {view === "COLABORADORES" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["ATIVO", "AFASTADO_INSS", "ATESTADO", "FERIAS"] as StatusColaborador[]).map((s) => {
            const count = colaboradores.filter((c) => c.status === s).length;
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className={`p-5 rounded-[2rem] border ${cfg.border} ${cfg.bg} flex flex-col items-center gap-1`}>
                <span className={`text-3xl font-black ${cfg.color}`}>{count}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : filteredColabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)]">
          <UserX size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest">
            {view === "COLABORADORES" ? "Nenhum colaborador encontrado" : view === "DEMITIDOS" ? "Nenhum desligamento registrado" : "Arquivo morto vazio"}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-2xl overflow-hidden overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-base)]/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Colaborador</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cargo</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Unidade</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                {(view === "DEMITIDOS" || view === "ARQUIVO") && (
                  <>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Motivo</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Data Demissão</th>
                  </>
                )}
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredColabs.map((c) => {
                const statusCfg = STATUS_CONFIG[c.status as StatusColaborador] || STATUS_CONFIG.ATIVO;
                return (
                  <tr key={c.id} className="hover:bg-[var(--brand)]/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-[var(--text-primary)] uppercase italic leading-tight">{c.nome}</span>
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{c.telefone || c.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-4 py-1.5 bg-slate-500/10 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-full border border-slate-500/10">
                        {c.cargo || "—"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">{c.unidade_alocacao || "—"}</span>
                    </td>
                    <td className="px-8 py-5">
                      {view === "COLABORADORES" ? (
                        <select
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} outline-none cursor-pointer`}
                          value={c.status}
                          onChange={(e) => handleAlterarStatus(c, e.target.value as StatusColaborador)}
                        >
                          <option value="ATIVO">Ativo</option>
                          <option value="AFASTADO_INSS">Afastado INSS</option>
                          <option value="ATESTADO">Atestado</option>
                          <option value="FERIAS">Férias</option>
                        </select>
                      ) : (
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusCfg.bg} ${statusCfg.border} border`}>
                          <div className={`w-2 h-2 rounded-full ${c.status === "DEMITIDO" ? "bg-red-500" : "bg-slate-500"}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${statusCfg.color}`}>{statusCfg.label}</span>
                        </div>
                      )}
                    </td>
                    {(view === "DEMITIDOS" || view === "ARQUIVO") && (
                      <>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">
                            {c.dados_demissao?.motivo_label || "—"}
                          </span>
                          {c.dados_demissao?.observacoes && (
                            <p className="text-[8px] font-bold text-[var(--text-muted)] mt-1 max-w-[200px] truncate">{c.dados_demissao.observacoes}</p>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[var(--text-primary)]">
                              {c.dados_demissao?.data_demissao ? new Date(c.dados_demissao.data_demissao + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                            </span>
                            <span className="text-[8px] font-bold text-[var(--text-muted)]">
                              por {c.dados_demissao?.autorizado_por || "—"}
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {view === "COLABORADORES" && (
                          <button
                            onClick={() => openDemissaoModal(c)}
                            className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all border border-red-500/10 flex items-center gap-2"
                          >
                            <UserX size={12} /> Demitir
                          </button>
                        )}
                        {view === "DEMITIDOS" && (
                          <button
                            onClick={() => handleArquivoMorto(c)}
                            className="px-4 py-2 bg-slate-500/10 text-slate-600 rounded-lg text-[9px] font-black uppercase hover:bg-slate-600 hover:text-white transition-all border border-slate-500/10 flex items-center gap-2"
                          >
                            <Archive size={12} /> Arquivo Morto
                          </button>
                        )}
                        {view === "ARQUIVO" && (
                          <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            Arquivado em {c.dados_demissao?.arquivado_em ? new Date(c.dados_demissao.arquivado_em).toLocaleDateString("pt-BR") : "—"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-8 py-4 bg-[var(--bg-base)]/50 border-t border-[var(--border)] flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              {filteredColabs.length} registro(s) encontrado(s)
            </span>
          </div>
        </div>
      )}

      {/* Modal de Demissão */}
      <AdaptiveModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedColab(null); }}
        title="Registrar Demissão"
        width="550px"
      >
        <div className="p-8 space-y-6">
          {/* Info do colaborador */}
          {selectedColab && (
            <div className="flex items-center gap-4 p-5 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-[12px] font-black text-red-700 dark:text-red-400 uppercase italic">{selectedColab.nome}</p>
                <p className="text-[10px] font-bold text-red-600/70 dark:text-red-400/70">
                  {selectedColab.cargo || "Sem cargo"} — {selectedColab.unidade_alocacao || "Sem unidade"}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
              <Calendar size={12} /> Data da Demissão
            </label>
            <input
              type="date"
              className="input-field w-full h-12 font-bold"
              value={demissaoData.data_demissao}
              onChange={(e) => setDemissaoData({ ...demissaoData, data_demissao: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
              <FileText size={12} /> Motivo
            </label>
            <select
              className="input-field w-full h-12 font-bold"
              value={demissaoData.motivo}
              onChange={(e) => setDemissaoData({ ...demissaoData, motivo: e.target.value as MotivoDemissao })}
            >
              {Object.entries(MOTIVOS_DEMISSAO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
              <Shield size={12} /> Autorizado por
            </label>
            <input
              className="input-field w-full h-12 font-bold"
              placeholder="Nome de quem autorizou a demissão"
              value={demissaoData.autorizado_por}
              onChange={(e) => setDemissaoData({ ...demissaoData, autorizado_por: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
              <FileText size={12} /> Observações
            </label>
            <textarea
              className="input-field w-full font-bold min-h-[100px] resize-none"
              placeholder="Detalhes adicionais sobre a demissão..."
              value={demissaoData.observacoes}
              onChange={(e) => setDemissaoData({ ...demissaoData, observacoes: e.target.value })}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => { setShowModal(false); setSelectedColab(null); }}
              className="flex-1 h-14 bg-[var(--bg-base)] text-[var(--text-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              onClick={handleDemitir}
              className="flex-1 h-14 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? "Processando..." : (<><UserX size={14} /> Confirmar Demissão</>)}
            </button>
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}
