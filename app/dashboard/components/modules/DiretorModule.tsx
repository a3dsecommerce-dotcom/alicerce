"use client";
import React, { useState, useEffect } from "react";
import { 
  Users, AlertTriangle, ArrowRightLeft, Sparkles, Search, Clock, 
  CheckCircle, XCircle, Send, MoreHorizontal, UserCheck, UserX, 
  MessageSquare, Plus, ChevronRight, FileText, Info, Edit2, Zap, Building2, Truck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import TableSkeleton from "@/components/ui/TableSkeleton";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

type Tab = "EQUIPE" | "VOLANTE" | "DEMANDAS";

export default function DiretorModule({ user }: { user: any }) {
  const isManagement = user.nivel_acesso >= 3 || ["DEV", "ADMIN", "GERENTE", "GERENCIA"].includes(user.role);
  const [activeTab, setActiveTab] = useState<Tab>("EQUIPE");
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState<any>(null);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [quadroReferencia, setQuadroReferencia] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [solicitacoesVolante, setSolicitacoesVolante] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [selectedSec, setSelectedSec] = useState<string>("TODAS");

  // Modais
  const [modalHorario, setModalHorario] = useState<any>(null);
  const [modalInsalubridade, setModalInsalubridade] = useState<any>(null);
  const [modalOcorrencia, setModalOcorrencia] = useState<any>(null);
  
  // Estados para reatividade do formulário Volante
  const [volCargo, setVolCargo] = useState("");
  const [volColaborador, setVolColaborador] = useState("");
  const [volInsalubridade, setVolInsalubridade] = useState("");
  const [volHorario, setVolHorario] = useState("");

  const fetchData = React.useCallback(async (targetUnitId?: string) => {
    try {
      setLoading(true);

      const { data: listUnits } = await supabase.from('unidades').select('*').eq('status', 'ATIVO').order('nome');
      setAllUnits(listUnits || []);

      let unitData: any = null;
      const rawPhone = user.telefone || user.phone || "";
      const cleanPhone = rawPhone.replace(/\D/g, "");
      const phoneWithout55 = cleanPhone.startsWith("55") ? cleanPhone.slice(2) : cleanPhone;

      if (targetUnitId) {
        unitData = listUnits?.find(u => u.id === targetUnitId);
      } else {
        const unitByPhone = (cleanPhone.length > 5) ? listUnits?.find(u => 
          (u.telefone && (u.telefone.includes(cleanPhone) || u.telefone.includes(phoneWithout55))) || 
          (u.responsavel_telefone && (u.responsavel_telefone.includes(cleanPhone) || u.responsavel_telefone.includes(phoneWithout55)))
        ) : null;

        const unitByName = listUnits?.find(u => 
          (user.unidade_alocacao && u.nome.toLowerCase().includes(user.unidade_alocacao.toLowerCase())) ||
          (u.diretor && (user.nome || user.name || "").toLowerCase().includes(u.diretor.toLowerCase()))
        );

        unitData = unitByPhone || unitByName;
      }

      if (!unitData) {
        if (isManagement && listUnits && listUnits.length > 0) {
          unitData = listUnits[0];
        } else if (user.unidade_alocacao) {
          unitData = { nome: user.unidade_alocacao, id: "pending", is_placeholder: true };
        } else {
          setLoading(false);
          setUnidade(null);
          return;
        }
      }
      
      setUnidade(unitData);

      const currentUnitName = unitData.nome || "";
      const currentUnitId = unitData.id || "0";
      const cleanUnitName = currentUnitName.replace(/ESCOLA|MUNICIPAL|POSTO|CENTRO|EME|EMEF|MANAUS|AMAZONAS/gi, "").trim();
      
      const { data: colabs } = await supabase.from('usuarios')
        .select('*')
        .or(`unidade_alocacao.ilike.%${cleanUnitName}%,unidade_alocacao.ilike.%${currentUnitName}%`)
        .eq('status', 'ATIVO');

      const [feedsRes, quadroRes, volanteRes] = await Promise.all([
        supabase.from('feedback_diretor').select('*, colaborador:usuarios(nome)').eq('unidade_id', currentUnitId).order('created_at', { ascending: false }),
        supabase.from('vagas_quadro').select('*').ilike('unidade_nome', `%${cleanUnitName}%`),
        supabase.from('solicitacoes_volante').select('*').eq('unidade_id', currentUnitId).order('created_at', { ascending: false })
      ]);

      setColaboradores(colabs || []);
      setQuadroReferencia(quadroRes.data || []);
      setOcorrencias(feedsRes.data || []);
      setSolicitacoesVolante(volanteRes.data || []);

    } catch (err: any) {
      toast.error("Falha na sincronização dos dados.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateHorario = async (colabId: string, novoHorario: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ horario_trabalho: novoHorario })
        .eq('id', colabId);

      if (error) throw error;

      await supabase.from('atividades').insert({
        usuario_id: user.id,
        tipo: 'GERENCIAL',
        mensagem: `DIRETOR: Alterado horário de ${colaboradores.find(c => c.id === colabId)?.nome} para ${novoHorario} na unidade ${unidade.nome}.`
      });

      toast.success("Horário atualizado!");
      setModalHorario(null);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao atualizar horário.");
    }
  };

  const handleUpdateInsalubridade = async (colabId: string, novoPercentual: string) => {
    try {
      const colab = colaboradores.find(c => c.id === colabId);
      if (!colab) return;

      const insalubridadeAtual = colab.percentual_insalubridade || "N/A";
      
      const payload = {
        assunto: `SOLICITAÇÃO DE ALTERAÇÃO: INSALUBRIDADE - ${colab.nome}`,
        descricao: `[ALTERACAO_DADOS] ID: ${colabId} | Campo: percentual_insalubridade | Valor: ${novoPercentual} | Solicitado pelo Diretor para alterar de ${insalubridadeAtual} para ${novoPercentual}.`,
        unidade: unidade.nome,
        secretaria: unidade.secretaria || "SEMED",
        prioridade: "NORMAL",
        status: "PENDENTE",
        criado_por: user.nome || user.name || "Diretor",
        setor_destino: "Encarregado",
        responsavel_citado_id: unidade.encarregado_id || null,
        responsavel_citado_nome: unidade.encarregado_nome || "NÃO ATRIBUÍDO",
        interessado_id: colabId,
        interessado_nome: colab.nome,
        funcao: colab.cargo || colab.funcao || "OPERACIONAL",
        representante_id: user.id || null,
        representante_nome: user.nome || user.name,
        solicitante_tel: user.telefone || null
      };

      const { error } = await supabase.from('tickets_sla').insert([payload]);

      if (error) throw error;

      await supabase.from('atividades').insert({
        usuario_id: user.id,
        tipo: 'OPERACIONAL',
        mensagem: `DIRETOR: Solicitou alteração de insalubridade de ${colab.nome} para ${novoPercentual} na unidade ${unidade.nome}.`
      });

      toast.success("Solicitação enviada para o Encarregado!");
      setModalInsalubridade(null);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao solicitar alteração: " + err.message);
    }
  };

  const handleCriarOcorrencia = async (form: any) => {
    try {
      const { error } = await supabase.from('feedback_diretor').insert({
        unidade_id: unidade.id,
        diretor_id: user.id,
        colaborador_id: modalOcorrencia.id,
        tipo_feedback: form.tipo,
        descricao: form.descricao,
        urgencia: form.urgencia
      });

      if (error) throw error;

      toast.success("Ocorrência registrada!");
      setModalOcorrencia(null);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao registrar ocorrência.");
    }
  };

  const handlePedirVolante = async (form: any) => {
    try {
      const { error } = await supabase.from('solicitacoes_volante').insert({
        unidade_id: unidade.id,
        unidade_nome: unidade.nome,
        solicitante_id: user.id,
        solicitante_nome: user.nome || user.name,
        turno: form.turno,
        escala: form.escala,
        horario: form.horario,
        motivo: form.motivo,
        dias_afastamento: form.dias || 1,
        cargo_alvo: form.cargo,
        colaborador_alvo: form.colaborador,
        data_necessidade: form.data,
        insalubridade: form.insalubridade,
        meta_contexto: {
          alunos: unidade.quantidade_alunos,
          fluxo: unidade.fluxo_diario,
          cozinheiras_efetivas: unidade.tem_cozinheira_efetiva,
          qtd_cozinheiras: unidade.quantidade_cozinheiras
        },
        status: 'PENDENTE'
      });

      if (error) throw error;

      // Lançamento automático de falta/atestado
      const colabAusente = colaboradores.find(c => c.nome === form.colaborador);
      const isAtestado = form.motivo === 'ATESTADO';
      await supabase.from('informativos_operacionais').insert([{
        tipo: 'FALTA',
        unidade: unidade.nome,
        data: form.data,
        periodo: form.turno || 'DIURNO',
        horario: form.horario || '',
        colaborador_ausente_id: colabAusente?.id || null,
        colaborador_ausente_nome: form.colaborador,
        tem_atestado: isAtestado,
        dias_atestado: isAtestado ? parseInt(form.dias) || 1 : 0,
        justificada: isAtestado,
        observacoes: `LANÇAMENTO AUTOMÁTICO: Solicitado Volante em substituição a ${form.colaborador} (Motivo: ${form.motivo}).`,
        criado_por_id: user.id,
        criado_por_nome: user.nome || user.name
      }]);

      await supabase.from('atividades').insert({
        usuario_id: user.id,
        tipo: 'OPERACIONAL',
        mensagem: `DIRETOR: Solicitado VOLANTE e registrado FALTA para ${form.colaborador} na unidade ${unidade.nome}.`
      });

      toast.success("Pedido de volante e falta registrados!");
      setActiveTab("EQUIPE");
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao processar solicitação de volante.");
    }
  };

  const filteredUnits = selectedSec === "TODAS"
    ? allUnits
    : allUnits.filter(u => u.secretaria === selectedSec);

  if (loading) return <TableSkeleton />;
  
  if (!unidade) return (
    <div className="flex flex-col items-center justify-center p-20 text-center gap-4 bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)]">
      <AlertTriangle size={64} className="text-amber-500" />
      <h2 className="text-2xl font-black italic">ACESSO RESTRITO</h2>
      <p className="text-[var(--text-muted)] font-bold uppercase tracking-tight max-w-md">
        Nenhuma unidade foi vinculada ao seu perfil. Entre em contato com a Gerência da Alicerce para formalizar sua fiscalização.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20 max-w-[1600px] mx-auto w-full px-4 lg:px-6">
      
      {/* Hero */}
      <div className="group relative bg-slate-950 rounded-[3.5rem] p-1 lg:p-2 shadow-2xl overflow-hidden border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-950 to-emerald-500/5 opacity-50" />
        
        <div className="relative z-10 bg-black/40 backdrop-blur-xl rounded-[3rem] p-8 lg:p-12 border border-white/10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-5 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Fiscal do Contratante</span>
                </div>
                <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                  ID: {user.id}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-5xl lg:text-7xl font-black italic tracking-tighter text-white leading-[1.1]">
                  Portal do <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">Diretor</span>
                </h2>
              </div>

              <div className="flex flex-col gap-4 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm max-w-2xl">
                {isManagement && (
                  <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-400/20 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-300">
                      🔍 MODO VISUALIZAÇÃO GESTOR: Simulando visão do Diretor
                    </span>
                  </div>
                )}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Unidade Sob Supervisão</p>
                      <h3 className="text-xl font-black text-white uppercase italic leading-tight">{unidade.nome}</h3>
                    </div>
                  </div>
                  
                  {isManagement && (
                    <div className="flex flex-wrap items-center gap-2 ml-auto w-full md:w-auto">
                      <select 
                        className="bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase text-white px-3 py-2 outline-none cursor-pointer hover:bg-white/20 transition-all"
                        value={selectedSec}
                        onChange={(e) => {
                          const sec = e.target.value;
                          setSelectedSec(sec);
                          const filtered = sec === "TODAS" ? allUnits : allUnits.filter(u => u.secretaria === sec);
                          if (filtered.length > 0) {
                            fetchData(filtered[0].id);
                          }
                        }}
                      >
                        <option value="TODAS" className="bg-slate-900">TODAS SECRETARIAS</option>
                        <option value="SEMED" className="bg-slate-900">SEMED (Educação)</option>
                        <option value="SEMSA" className="bg-slate-900">SEMSA (Saúde)</option>
                        <option value="SEMAD" className="bg-slate-900">SEMAD (Administração)</option>
                        <option value="SEMAG" className="bg-slate-900">SEMAG</option>
                      </select>

                      <select 
                        className="bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase text-white px-3 py-2 outline-none cursor-pointer hover:bg-white/20 transition-all max-w-[200px]"
                        value={unidade.id}
                        onChange={(e) => fetchData(e.target.value)}
                      >
                        {filteredUnits.map(u => (
                          <option key={u.id} value={u.id} className="bg-slate-900">{u.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-auto">
              <button 
                onClick={() => toast.info("Em breve: Nova Solicitação Direta")}
                className="group relative px-12 py-6 bg-white text-slate-950 rounded-[2.5rem] text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3 overflow-hidden"
              >
                <Plus size={20} /> Nova Solicitação
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                  <span className="text-3xl font-black text-white">{colaboradores.length}</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">Equipe</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                  <span className="text-3xl font-black text-emerald-400">{ocorrencias.filter(o => o.status === 'PENDENTE').length}</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">Alertas</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-4">
        <div className="flex bg-[var(--bg-card)] p-2 rounded-[2.5rem] border border-[var(--border)] shadow-xl overflow-x-auto no-scrollbar max-w-full">
          {(["EQUIPE", "VOLANTE", "DEMANDAS"] as Tab[]).map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-10 py-5 rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === t ? "bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-xl scale-105" : "text-[var(--text-muted)] hover:bg-[var(--bg-base)]"}`}
            >
              {t === "EQUIPE" && <Users size={18} />}
              {t === "VOLANTE" && <Truck size={18} />}
              {t === "DEMANDAS" && <MessageSquare size={18} />}
              {t === "EQUIPE" ? "Efetivo da Unidade" : t === "VOLANTE" ? "Solicitar Volante" : "Minhas Demandas"}
            </button>
          ))}
        </div>

        {activeTab === "EQUIPE" && (
          <div className="relative w-full lg:w-[400px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
            <input 
              type="text" 
              placeholder="PESQUISAR NA EQUIPE..." 
              className="input-field w-full pl-14 pr-6 py-5 bg-[var(--bg-card)] border-[var(--border)] rounded-full text-xs font-black uppercase tracking-widest shadow-lg focus:ring-4 ring-indigo-500/10 transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === "EQUIPE" && (
          <div className="space-y-6">
            <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-2xl overflow-hidden overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-base)]/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Colaborador</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cargo</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Horário</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Insalubridade</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {colaboradores.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())).map((c) => (
                    <tr key={c.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-[var(--text-primary)] uppercase italic leading-tight">{c.nome}</span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{c.telefone}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 bg-slate-500/10 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-full">
                          {c.cargo}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => setModalHorario(c)}
                          className="flex items-center gap-2 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] hover:border-indigo-500/50 transition-all text-left"
                        >
                          <Clock size={14} className="text-indigo-500" />
                          <span className="text-[11px] font-black text-[var(--text-primary)] uppercase">{c.horario_trabalho || "07:00 - 17:00"}</span>
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => setModalInsalubridade(c)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-muted)]"
                        >
                          <Zap size={14} />
                          <span className="text-[10px] font-black uppercase">{c.percentual_insalubridade || (c.insalubridade ? `${c.insalubridade}%` : "N/A")}</span>
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${c.status === 'ATIVO' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">{c.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => setModalOcorrencia(c)}
                            className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-500/10"
                           >
                              <UserX size={16} />
                           </button>
                           <button 
                            className="p-3 bg-slate-500/10 text-slate-600 rounded-xl hover:bg-slate-600 hover:text-white transition-all shadow-sm border border-slate-500/10"
                           >
                              <ChevronRight size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "VOLANTE" && (
           <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-600/40">
                   <Truck size={40} />
                </div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">Solicitar Volante</h3>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Preencha os detalhes para substituição imediata ou programada</p>
              </div>

              <div className="bg-[var(--bg-card)] p-10 rounded-[3.5rem] border border-[var(--border)] shadow-2xl space-y-8 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Colaborador a ser Substituído</label>
                      <select 
                        id="volColaborador" 
                        className="input-field w-full rounded-2xl p-5 bg-[var(--bg-base)] border-[var(--border)] font-bold text-xs"
                        value={volColaborador}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVolColaborador(val);
                          const colab = colaboradores.find(c => c.nome === val);
                          if(colab) {
                            setVolCargo(colab.cargo || "");
                            setVolInsalubridade(colab.percentual_insalubridade || "");
                            setVolHorario(colab.horario_trabalho || "");
                          }
                        }}
                      >
                         <option value="">Selecione o colaborador...</option>
                         {colaboradores.map(c => (
                           <option key={c.id} value={c.nome}>{c.nome}</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Cargo</label>
                      <input 
                        id="volCargo" 
                        value={volCargo}
                        onChange={(e) => setVolCargo(e.target.value)}
                        className="input-field w-full rounded-2xl p-5 bg-[var(--bg-base)] border-[var(--border)] font-bold text-xs" 
                        placeholder="Ex: Auxiliar de Limpeza" 
                      />
                   </div>

                   {volCargo.toUpperCase().includes("LIMPEZA") && (
                     <div className="space-y-3 animate-in slide-in-from-left-4 duration-500">
                        <label className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-2">Insalubridade do Posto</label>
                        <select 
                          id="volInsalubridade" 
                          value={volInsalubridade}
                          onChange={(e) => setVolInsalubridade(e.target.value)}
                          className="input-field w-full rounded-2xl p-5 bg-amber-500/5 border-amber-500/20 font-black text-amber-700"
                        >
                           <option value="">Selecione...</option>
                           <option value="20%">20% (Mínima)</option>
                           <option value="30%">30% (Média)</option>
                           <option value="40%">40% (Máxima)</option>
                        </select>
                     </div>
                   )}

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Data da Substituição</label>
                      <input type="date" id="volData" className="input-field w-full rounded-2xl p-5 bg-[var(--bg-base)] border-[var(--border)] font-bold" defaultValue={new Date().toISOString().split('T')[0]} />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Turno</label>
                      <select id="volTurno" className="input-field w-full rounded-2xl p-5 bg-[var(--bg-base)] border-[var(--border)] font-bold">
                         <option value="DIURNO">Diurno</option>
                         <option value="NOTURNO">Noturno</option>
                      </select>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Escala</label>
                      <select id="volEscala" className="input-field w-full rounded-2xl p-5 bg-[var(--bg-base)] border-[var(--border)] font-bold">
                         <option value="12X36">12x36</option>
                         <option value="5X2">5x2</option>
                         <option value="6X1">6x1</option>
                         <option value="OUTRA">Outra</option>
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Horário Específico</label>
                      <input 
                        id="volHorario" 
                        value={volHorario}
                        onChange={(e) => setVolHorario(e.target.value)}
                        className="input-field w-full rounded-2xl p-5 bg-[var(--bg-base)] border-[var(--border)] font-bold text-xs" 
                        placeholder="Ex: 07:00 às 19:00" 
                      />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Motivo</label>
                      <select id="volMotivoSelect" className="input-field w-full rounded-2xl p-5 bg-[var(--bg-base)] border-[var(--border)] font-bold">
                         <option value="ATESTADO">Atestado Médico</option>
                         <option value="FALTA">Falta Não Justificada</option>
                         <option value="FERIAS">Férias</option>
                         <option value="TRANSFERENCIA">Transferência</option>
                         <option value="OUTRO">Outros Motivos</option>
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Quantos Dias? (Se Aplicável)</label>
                      <input type="number" id="volDias" className="input-field w-full rounded-2xl p-5 bg-[var(--bg-base)] border-[var(--border)] font-bold" defaultValue="1" />
                   </div>
                </div>

                {/* Dados de Contexto (SEMED / SEMSA) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-[var(--bg-base)] rounded-[2.5rem] border border-[var(--border)] relative overflow-hidden group/context">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/context:opacity-30 transition-opacity">
                      <Info size={40} className="text-indigo-500" />
                   </div>
                   
                   {unidade.nome?.toUpperCase().includes("SEMED") || unidade.nome?.toUpperCase().includes("ESCOLA") ? (
                     <>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Nº de Alunos</p>
                           <p className="text-2xl font-black italic">{unidade.quantidade_alunos || 0}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Cozinheiras (Total / Efetivas)</p>
                           <p className="text-2xl font-black italic">{unidade.quantidade_cozinheiras || 0} / {unidade.tem_cozinheira_efetiva ? "SIM" : "NÃO"}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Alunos por Cozinheira</p>
                           <p className="text-2xl font-black italic text-emerald-500">
                             {unidade.quantidade_cozinheiras > 0 ? Math.round(unidade.quantidade_alunos / unidade.quantidade_cozinheiras) : unidade.quantidade_alunos}
                           </p>
                        </div>
                     </>
                   ) : (
                     <>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Fluxo Diário de Pessoas</p>
                           <p className="text-2xl font-black italic">{unidade.fluxo_diario || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Tipo de Unidade</p>
                           <p className="text-xl font-black italic uppercase text-slate-500">Unidade de Saúde (SEMSA)</p>
                        </div>
                     </>
                   )}
                </div>

                <div className="pt-6 relative z-10">
                   <button 
                    onClick={() => {
                      const form = {
                        colaborador: volColaborador,
                        cargo: volCargo,
                        data: (document.getElementById('volData') as HTMLInputElement).value,
                        turno: (document.getElementById('volTurno') as HTMLSelectElement).value,
                        escala: (document.getElementById('volEscala') as HTMLSelectElement).value,
                        horario: volHorario,
                        motivo: (document.getElementById('volMotivoSelect') as HTMLSelectElement).value,
                        dias: (document.getElementById('volDias') as HTMLInputElement).value,
                        insalubridade: volInsalubridade
                      };
                      if(!form.colaborador) return toast.error("Selecione o colaborador.");
                      if(!form.cargo) return toast.error("Informe o cargo.");
                      handlePedirVolante(form);
                    }}
                    className="w-full py-8 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                   >
                     <Send size={20} /> Enviar Pedido para Central
                   </button>
                </div>
              </div>
           </div>
        )}

        {activeTab === "DEMANDAS" && (
          <div className="max-w-6xl mx-auto space-y-8 py-10 animate-in fade-in slide-in-from-bottom-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h3 className="text-3xl font-black italic tracking-tighter uppercase">Minhas Demandas</h3>
                   <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Acompanhe o status e as respostas da Central</p>
                </div>
                <div className="flex gap-4">
                   <div className="px-6 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                      <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Total Aberto</p>
                      <p className="text-xl font-black italic">{ocorrencias.length + solicitacoesVolante.length}</p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-6">
                {/* Ocorrências */}
                {ocorrencias.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em] ml-2">Ocorrências de Equipe</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {ocorrencias.map(o => (
                         <div key={o.id} className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border)] shadow-xl space-y-4 hover:border-red-500/30 transition-all">
                            <div className="flex justify-between items-start">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
                                     <AlertTriangle size={20} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{o.tipo_feedback}</p>
                                     <p className="text-sm font-black italic uppercase leading-none">{o.colaborador?.nome}</p>
                                  </div>
                               </div>
                               <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${o.status === 'CONCLUIDO' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600 animate-pulse'}`}>
                                  {o.status || 'PENDENTE'}
                               </span>
                            </div>
                            <p className="text-xs font-bold text-[var(--text-muted)] leading-relaxed italic border-l-4 border-slate-200 pl-4 py-2 bg-[var(--bg-base)]/50 rounded-r-xl">
                               "{o.descricao}"
                            </p>
                            {o.resposta_central ? (
                              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-2">
                                 <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2">
                                    <CheckCircle size={12} /> Resposta da Central
                                 </p>
                                 <p className="text-xs font-bold italic">{o.resposta_central}</p>
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-500/5 rounded-2xl border border-[var(--border)] border-dashed">
                                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Aguardando devolutiva...</p>
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Volantes */}
                {solicitacoesVolante.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] ml-2">Solicitações de Volante</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {solicitacoesVolante.map(v => (
                         <div key={v.id} className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border)] shadow-xl space-y-4 hover:border-indigo-500/30 transition-all">
                            <div className="flex justify-between items-start">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                     <Truck size={20} />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{v.data_necessidade} - {v.turno}</p>
                                     <p className="text-sm font-black italic uppercase leading-none">{v.cargo_alvo || 'Volante Geral'}</p>
                                  </div>
                               </div>
                               <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${v.status === 'APROVADO' ? 'bg-emerald-500/10 text-emerald-600' : v.status === 'NEGADO' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600 animate-pulse'}`}>
                                  {v.status || 'PENDENTE'}
                               </span>
                            </div>
                            <div className="flex gap-2">
                               <span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg text-[9px] font-bold uppercase">{v.motivo}</span>
                               {v.dias_afastamento && <span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg text-[9px] font-bold uppercase">{v.dias_afastamento} dias</span>}
                            </div>
                            {v.resposta_central ? (
                              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 space-y-2">
                                 <p className="text-[9px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                                    <Info size={12} /> Devolutiva Central
                                 </p>
                                 <p className="text-xs font-bold italic">{v.resposta_central}</p>
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-500/5 rounded-2xl border border-[var(--border)] border-dashed">
                                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Aguardando escalação...</p>
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {ocorrencias.length === 0 && solicitacoesVolante.length === 0 && (
                   <div className="p-20 text-center space-y-4 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)]">
                      <CheckCircle size={48} className="mx-auto text-emerald-500 opacity-20" />
                      <p className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest">Nenhuma demanda pendente na unidade.</p>
                   </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {modalInsalubridade && (() => {
        const currentVal = modalInsalubridade.percentual_insalubridade || (modalInsalubridade.insalubridade ? `${modalInsalubridade.insalubridade}%` : "N/A");
        return (
          <AdaptiveModal isOpen={!!modalInsalubridade} onClose={() => setModalInsalubridade(null)} title="Insalubridade" size="md">
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 {['N/A', '20%', '30%', '40%'].map(pct => (
                   <button
                    key={pct}
                    onClick={() => handleUpdateInsalubridade(modalInsalubridade.id, pct)}
                    className={`py-6 rounded-2xl font-black text-xl transition-all border-2 ${currentVal === pct ? 'bg-amber-600 border-amber-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400'}`}
                   >
                     {pct}
                   </button>
                 ))}
              </div>
            </div>
          </AdaptiveModal>
        );
      })()}

      {modalHorario && (
        <AdaptiveModal isOpen={!!modalHorario} onClose={() => setModalHorario(null)} title="Ajustar Horário" size="md">
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <input id="novoHorarioInput" defaultValue={modalHorario.horario_trabalho || "07:00 - 17:00"} className="input-field w-full p-6 text-2xl font-black italic rounded-3xl text-center" />
              <button 
                onClick={() => handleUpdateHorario(modalHorario.id, (document.getElementById('novoHorarioInput') as HTMLInputElement).value)}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        </AdaptiveModal>
      )}

      {modalOcorrencia && (
        <AdaptiveModal isOpen={!!modalOcorrencia} onClose={() => setModalOcorrencia(null)} title="Ocorrência" size="md">
          <div className="p-8 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)]">Tipo</label>
                    <select id="tipoOco" className="input-field w-full rounded-xl">
                       <option value="FALTA">Falta</option>
                       <option value="ATRASO">Atraso</option>
                       <option value="CONDUTA">Conduta</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)]">Urgência</label>
                    <select id="urgOco" className="input-field w-full rounded-xl">
                       <option value="NORMAL">Normal</option>
                       <option value="URGENTE">Urgente</option>
                    </select>
                 </div>
              </div>
              <textarea id="descOco" rows={4} className="input-field w-full rounded-2xl p-4 text-xs font-bold" placeholder="Descrição..."></textarea>
              <button 
                onClick={() => handleCriarOcorrencia({
                  tipo: (document.getElementById('tipoOco') as HTMLSelectElement).value,
                  urgencia: (document.getElementById('urgOco') as HTMLSelectElement).value,
                  descricao: (document.getElementById('descOco') as HTMLTextAreaElement).value
                })}
                className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl flex items-center justify-center gap-2"
              >
                <Send size={18} /> Enviar
              </button>
            </div>
          </div>
        </AdaptiveModal>
      )}
    </div>
  );
}
