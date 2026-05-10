"use client";
import React, { useState, useEffect } from "react";
import { 
  Users, AlertTriangle, ArrowRightLeft, Sparkles, Search, Clock, 
  CheckCircle, XCircle, Send, MoreHorizontal, UserCheck, UserX, 
  MessageSquare, Plus, ChevronRight, FileText, Info, Edit2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import TableSkeleton from "@/components/ui/TableSkeleton";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

type Tab = "EQUIPE" | "OCORRENCIAS" | "TRANSFERENCIAS" | "SOLICITACOES";

export default function DiretorModule({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<Tab>("EQUIPE");
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState<any>(null);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  // Modais
  const [modalHorario, setModalHorario] = useState<any>(null);
  const [modalOcorrencia, setModalOcorrencia] = useState<any>(null);
  const [modalTransferencia, setModalTransferencia] = useState<any>(null);
  const [modalSolicitacao, setModalSolicitacao] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    try {
      setLoading(true);
      // 1. Buscar Unidade vinculada ao Diretor
      const { data: unitData, error: unitError } = await supabase
        .from('unidades')
        .select('*')
        .eq('diretor_id', user.id)
        .single();

      if (unitError) throw new Error("Unidade não vinculada ou erro de acesso.");
      setUnidade(unitData);

      // 2. Buscar Colaboradores da Unidade
      const { data: colabs, error: colabsError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('unidade_alocacao', unitData.nome)
        .eq('status', 'ATIVO');

      if (colabsError) throw colabsError;
      setColaboradores(colabs || []);

      // 3. Buscar Ocorrências/Feedbacks
      const { data: feedData } = await supabase
        .from('feedback_diretor')
        .select('*, colaborador:usuarios(nome)')
        .eq('unidade_id', unitData.id);
      
      setOcorrencias(feedData || []);

      // 4. Buscar Transferências
      const { data: transfData } = await supabase
        .from('transferencias')
        .select('*')
        .eq('unidade_origem', unitData.nome);
      
      setTransferencias(transfData || []);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateHorario = async (colabId: string, novoHorario: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ horario_trabalho: novoHorario })
        .eq('id', colabId);

      if (error) throw error;

      // Logar Atividade para RH e Encarregado
      await supabase.from('atividades').insert({
        usuario_id: user.id,
        tipo: 'GERENCIAL',
        mensagem: `DIRETOR: Alterado horário de ${colaboradores.find(c => c.id === colabId)?.nome} para ${novoHorario} na unidade ${unidade.nome}.`
      });

      toast.success("Horário atualizado! O RH e Encarregado foram notificados.");
      setModalHorario(null);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao atualizar horário.");
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

      toast.success("Ocorrência registrada com sucesso!");
      setModalOcorrencia(null);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao registrar ocorrência.");
    }
  };

  const handlePedirTransferencia = async (form: any) => {
    try {
      const { error } = await supabase.from('transferencias').insert({
        colaborador_id: modalTransferencia.id,
        colaborador_nome: modalTransferencia.nome,
        unidade_origem: unidade.nome,
        motivo_solicitacao: `SOLICITADO POR DIRETOR: ${form.motivo}`,
        status: 'SOLICITADO'
      });

      if (error) throw error;

      toast.success("Pedido de transferência enviado!");
      setModalTransferencia(null);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao processar transferência.");
    }
  };

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
    <div className="flex flex-col gap-10 animate-fade-in pb-20 max-w-[1500px] mx-auto w-full px-4 lg:px-0">
      
      {/* Hero Diretor */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-10 lg:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden text-white border border-white/5">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] -ml-40 -mb-40" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white">
                Fiscal do Contratante
              </div>
              <div className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">
                Unidade: {unidade.nome}
              </div>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter mb-6 leading-tight">
              Portal do <span className="text-indigo-400">Diretor</span>
            </h2>
            <p className="text-lg font-medium text-slate-300 max-w-2xl leading-relaxed">
              Bem-vindo, {user.nome}. Este é o seu cockpit de fiscalização. Monitore horários, informe ocorrências e gerencie o capital humano do Alicerce na sua unidade em tempo real.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full lg:w-auto">
             <button 
              onClick={() => setModalSolicitacao(true)}
              className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2"
             >
                <Plus size={18} /> Nova Solicitação / Vontade
             </button>
             <div className="flex items-center gap-3 justify-center">
                <div className="flex flex-col items-center p-4 bg-white/5 rounded-3xl border border-white/10 min-w-[100px]">
                  <span className="text-2xl font-black">{colaboradores.length}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Equipe</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-white/5 rounded-3xl border border-white/10 min-w-[100px]">
                  <span className="text-2xl font-black">{ocorrencias.filter(o => o.status === 'PENDENTE').length}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Ocorrências</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center justify-center lg:justify-start">
        <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-card)] p-2 rounded-[2rem] border border-[var(--border)] shadow-xl overflow-x-auto no-scrollbar">
          {(["EQUIPE", "OCORRENCIAS", "TRANSFERENCIAS", "SOLICITACOES"] as Tab[]).map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105" : "text-[var(--text-muted)] hover:bg-[var(--bg-base)]"}`}
            >
              {t === "EQUIPE" && <Users size={16} />}
              {t === "OCORRENCIAS" && <AlertTriangle size={16} />}
              {t === "TRANSFERENCIAS" && <ArrowRightLeft size={16} />}
              {t === "SOLICITACOES" && <Sparkles size={16} />}
              {t === "EQUIPE" ? "Minha Equipe" : t === "OCORRENCIAS" ? "Gestão de Ocorrências" : t === "TRANSFERENCIAS" ? "Pedidos de Transferência" : "Vontades & Pedidos"}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === "EQUIPE" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar colaborador na minha unidade..." 
                  className="input-field w-full pl-12 py-4 bg-[var(--bg-card)] border-[var(--border)] rounded-[1.5rem] text-[11px] font-bold uppercase"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-[var(--bg-card)] px-4 py-2 rounded-2xl border border-[var(--border)] shadow-sm">
                <Info size={14} className="text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Alterações de horário notificam o RH imediatamente</span>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-2xl overflow-hidden overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-base)]/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Colaborador</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cargo / Função</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Horário de Trabalho</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Ações de Fiscalização</th>
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
                        <span className="px-4 py-1.5 bg-slate-500/10 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-full border border-slate-500/10">
                          {c.cargo}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => setModalHorario(c)}
                          className="flex items-center gap-2 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] hover:border-indigo-500/50 transition-all text-left group-hover:scale-105"
                        >
                          <Clock size={14} className="text-indigo-500" />
                          <span className="text-[11px] font-black text-[var(--text-primary)] uppercase">{c.horario_trabalho || "07:00 - 17:00"}</span>
                          <Edit2 size={10} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100" />
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
                            title="Informar Falta ou Conduta"
                            className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-500/10"
                           >
                              <UserX size={16} />
                           </button>
                           <button 
                            onClick={() => setModalTransferencia(c)}
                            title="Solicitar Transferência"
                            className="p-3 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-500/10"
                           >
                              <ArrowRightLeft size={16} />
                           </button>
                           <button 
                            title="Ver Perfil 360"
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

        {activeTab === "OCORRENCIAS" && (
           <div className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-[0.3em] flex items-center gap-3 italic">
                  <AlertTriangle className="text-red-500" size={18} /> Feedback Direto à Gerência
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ocorrencias.map((o) => (
                  <div key={o.id} className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl relative overflow-hidden group">
                     <div className={`absolute top-0 right-0 w-24 h-24 ${o.urgencia === 'CRITICO' ? 'bg-red-500/10' : 'bg-indigo-500/10'} rounded-full -mr-12 -mt-12 blur-2xl`} />
                     
                     <div className="flex items-center justify-between mb-6">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${o.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {o.status}
                        </span>
                        <span className="text-[9px] font-bold text-[var(--text-muted)]">{new Date(o.created_at).toLocaleDateString()}</span>
                     </div>

                     <h5 className="text-sm font-black text-[var(--text-primary)] uppercase italic mb-2">Colaborador: {o.colaborador?.nome}</h5>
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Tipo: {o.tipo_feedback}</p>
                     
                     <p className="text-[11px] font-bold text-[var(--text-secondary)] leading-relaxed mb-6 italic">
                        "{o.descricao}"
                     </p>

                     <div className="flex items-center justify-between mt-auto pt-6 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${o.urgencia === 'CRITICO' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                           <span className="text-[8px] font-black uppercase text-[var(--text-muted)]">Prioridade {o.urgencia}</span>
                        </div>
                        <button className="text-[9px] font-black text-indigo-500 hover:underline uppercase">Ver Detalhes</button>
                     </div>
                  </div>
                ))}
                {ocorrencias.length === 0 && (
                   <div className="col-span-full py-20 bg-[var(--bg-card)] rounded-[2.5rem] border border-dashed border-[var(--border)] text-center text-[var(--text-muted)] font-black uppercase italic tracking-widest">
                      Nenhuma ocorrência registrada para esta unidade.
                   </div>
                )}
              </div>
           </div>
        )}

        {/* Outras abas (Transferências e Solicitações) seguindo o mesmo estilo premium */}
      </div>

      {/* Modais Customizados */}
      {modalHorario && (
        <AdaptiveModal isOpen={!!modalHorario} onClose={() => setModalHorario(null)} title="Ajustar Horário de Trabalho" size="md">
          <div className="p-8 space-y-6">
            <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20">
               <h4 className="text-sm font-black uppercase text-indigo-600 mb-2">{modalHorario.nome}</h4>
               <p className="text-[11px] font-bold text-slate-500 uppercase">Ajuste o horário conforme a necessidade local. O RH será alertado para recalcular o SLA.</p>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Novo Horário (Ex: 08:00 - 18:00)</label>
              <input 
                id="novoHorarioInput"
                defaultValue={modalHorario.horario_trabalho || "07:00 - 17:00"}
                className="input-field w-full p-6 text-2xl font-black italic rounded-3xl text-center border-2 border-indigo-100 focus:border-indigo-600 transition-all"
              />
              <button 
                onClick={() => handleUpdateHorario(modalHorario.id, (document.getElementById('novoHorarioInput') as HTMLInputElement).value)}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all"
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </AdaptiveModal>
      )}

      {modalOcorrencia && (
        <AdaptiveModal isOpen={!!modalOcorrencia} onClose={() => setModalOcorrencia(null)} title="Registrar Ocorrência / Falta" size="md">
          <div className="p-8 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-500/5 rounded-2xl">
                 <Users size={20} className="text-slate-400" />
                 <div>
                    <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Colaborador Alvo</p>
                    <p className="text-[14px] font-black uppercase italic">{modalOcorrencia.nome}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)]">Tipo de Ocorrência</label>
                    <select id="tipoOco" className="input-field w-full rounded-xl">
                       <option value="FALTA">Falta Não Justificada</option>
                       <option value="ATRASO">Atraso Recorrente</option>
                       <option value="CONDUTA">Má Conduta / Indisciplina</option>
                       <option value="UNIFORME">Falta de Uniforme / EPI</option>
                       <option value="OUTROS">Outros Assuntos</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)]">Urgência</label>
                    <select id="urgOco" className="input-field w-full rounded-xl">
                       <option value="NORMAL">Normal</option>
                       <option value="URGENTE">Urgente</option>
                       <option value="CRITICO">Crítico (Imediato)</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-[var(--text-muted)]">Detalhamento para o RH</label>
                 <textarea id="descOco" rows={4} className="input-field w-full rounded-2xl p-4 text-xs font-bold" placeholder="Descreva o que aconteceu..."></textarea>
              </div>

              <button 
                onClick={() => handleCriarOcorrencia({
                  tipo: (document.getElementById('tipoOco') as HTMLSelectElement).value,
                  urgencia: (document.getElementById('urgOco') as HTMLSelectElement).value,
                  descricao: (document.getElementById('descOco') as HTMLTextAreaElement).value
                })}
                className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} /> Enviar para o RH Alicerce
              </button>
            </div>
          </div>
        </AdaptiveModal>
      )}

      {/* Outros modais seguindo o mesmo padrão... */}

    </div>
  );
}
