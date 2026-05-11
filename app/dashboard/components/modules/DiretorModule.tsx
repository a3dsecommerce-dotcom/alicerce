"use client";
import React, { useState, useEffect } from "react";
import { 
  Users, AlertTriangle, ArrowRightLeft, Sparkles, Search, Clock, 
  CheckCircle, XCircle, Send, MoreHorizontal, UserCheck, UserX, 
  MessageSquare, Plus, ChevronRight, FileText, Info, Edit2, Zap
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
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [quadroReferencia, setQuadroReferencia] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  // Modais
  const [modalHorario, setModalHorario] = useState<any>(null);
  const [modalInsalubridade, setModalInsalubridade] = useState<any>(null);
  const [modalOcorrencia, setModalOcorrencia] = useState<any>(null);
  const fetchData = React.useCallback(async (targetUnitId?: string) => {
    try {
      setLoading(true);
      console.log("🚀 PORTAL DIRETOR: Iniciando sincronização...");
      
      const isManagement = user.nivel_acesso >= 3 || ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA'].includes(user.role);

      // 1. Buscar Unidades para o Seletor (Apenas Gestão ou para fallback do Diretor)
      const { data: listUnits } = await supabase.from('unidades').select('*').eq('status', 'ATIVO').order('nome');
      setAllUnits(listUnits || []);

      // 2. Definir Unidade Alvo
      let unitData: any = null;
      const rawPhone = user.telefone || user.phone || "";
      const cleanPhone = rawPhone.replace(/\D/g, "");
      const phoneWith55 = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
      const phoneWithout55 = cleanPhone.startsWith("55") ? cleanPhone.slice(2) : cleanPhone;

      if (targetUnitId) {
        unitData = listUnits?.find(u => u.id === targetUnitId);
      } else {
        // Tenta vincular automaticamente (EXIGE telefone válido para evitar match vazio)
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

      if (!unitData && !isManagement) {
        // Se não achou, mas o usuário tem unidade_alocacao, tenta forçar uma unidade "falsa" para não bloquear a tela
        if (user.unidade_alocacao) {
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

      // 3. Buscar Dados da Unidade (Busca ULTRA-FLEXÍVEL por Colaboradores)
      const cleanUnitName = currentUnitName.replace(/ESCOLA|MUNICIPAL|POSTO|CENTRO|EME|EMEF|MANAUS|AMAZONAS/gi, "").trim();
      
      // Busca principal por unidade_alocacao
      const { data: colabs } = await supabase.from('usuarios')
        .select('*')
        .or(`unidade_alocacao.ilike.%${cleanUnitName}%,unidade_alocacao.ilike.%${currentUnitName}%`)
        .eq('status', 'ATIVO');

      const [feedsRes, transfsRes, quadroRes] = await Promise.all([
        supabase.from('feedback_diretor').select('*, colaborador:usuarios(nome)').eq('unidade_id', currentUnitId),
        supabase.from('transferencias').select('*').ilike('unidade_origem', `%${cleanUnitName}%`),
        supabase.from('vagas_quadro').select('*').ilike('unidade_nome', `%${cleanUnitName}%`)
      ]);

      setColaboradores(colabs || []);
      setQuadroReferencia(quadroRes.data || []);
      setOcorrencias(feedsRes.data || []);
      setTransferencias(transfsRes.data || []);

    } catch (err: any) {
      console.error("❌ ERRO NO PORTAL DIRETOR:", err);
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

  const handleUpdateInsalubridade = async (colabId: string, novoPercentual: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ insalubridade: novoPercentual })
        .eq('id', colabId);

      if (error) throw error;

      // Logar Atividade
      await supabase.from('atividades').insert({
        usuario_id: user.id,
        tipo: 'GERENCIAL',
        mensagem: `DIRETOR: Alterado percentual de insalubridade de ${colaboradores.find(c => c.id === colabId)?.nome} para ${novoPercentual}.`
      });

      toast.success("Insalubridade atualizada!");
      setModalInsalubridade(null);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao atualizar insalubridade.");
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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20 max-w-[1600px] mx-auto w-full px-4 lg:px-6">
      
      {/* Hero Diretor - Design Pro Max */}
      <div className="group relative bg-slate-950 rounded-[3.5rem] p-1 lg:p-2 shadow-2xl overflow-hidden border border-white/5 transition-all duration-700 hover:shadow-indigo-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-950 to-emerald-500/5 opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
        
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[140px] -mr-40 -mt-40 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -ml-40 -mb-40" />

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
                <div className="flex items-center gap-4">
                  <div className="h-[2px] w-12 bg-indigo-500/50" />
                  <p className="text-lg font-medium text-slate-400 uppercase tracking-[0.3em]">Gestão & Fiscalização</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm max-w-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
                    <Building2 size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Unidade Sob Supervisão</p>
                    <h3 className="text-xl font-black text-white uppercase italic">{unidade.nome}</h3>
                  </div>
                  
                  {(user.nivel_acesso >= 3 || user.role === 'DEV') && (
                    <div className="ml-auto">
                      <select 
                        className="bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase text-white px-4 py-2 outline-none hover:bg-white/20 transition-all cursor-pointer ring-offset-2 focus:ring-2 ring-indigo-500"
                        value={unidade.id}
                        onChange={(e) => fetchData(e.target.value)}
                      >
                        {allUnits.map(u => (
                          <option key={u.id} value={u.id} className="bg-slate-900">{u.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <Clock size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Rota: {unidade.rota || "Interna"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase">{unidade.telefone || "Sem Contato"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-auto">
              <button 
                onClick={() => setModalSolicitacao(true)}
                className="group relative px-12 py-6 bg-white text-slate-950 rounded-[2.5rem] text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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

      {/* Dash de Métricas Rápidas (Efeito Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Efetivo Total", val: colaboradores.length, sub: "ATIVOS", icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
          { label: "Ocorrências", val: ocorrencias.length, sub: "REGISTROS", icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          { label: "Vagas no Quadro", val: quadroReferencia.length, sub: "DISPONÍVEIS", icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "SLA Médio", val: "94%", sub: "EFICIÊNCIA", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" }
        ].map((item, i) => (
          <div key={i} className={`p-8 bg-[var(--bg-card)] rounded-[2.8rem] border ${item.border} shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center ${item.color}`}>
                <item.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{item.label}</p>
                <h4 className="text-3xl font-black text-[var(--text-primary)] italic tracking-tighter">
                  {item.val} <span className="text-[11px] font-bold not-italic text-[var(--text-muted)]">{item.sub}</span>
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Menu - Alinhamento Premium */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-4">
        <div className="flex bg-[var(--bg-card)] p-2 rounded-[2.5rem] border border-[var(--border)] shadow-xl overflow-x-auto no-scrollbar max-w-full">
          {(["EQUIPE", "OCORRENCIAS", "TRANSFERENCIAS", "SOLICITACOES"] as Tab[]).map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-10 py-5 rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === t ? "bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-2xl shadow-indigo-600/40 scale-105" : "text-[var(--text-muted)] hover:bg-[var(--bg-base)]"}`}
            >
              {t === "EQUIPE" && <Users size={18} />}
              {t === "OCORRENCIAS" && <AlertTriangle size={18} />}
              {t === "TRANSFERENCIAS" && <ArrowRightLeft size={18} />}
              {t === "SOLICITACOES" && <Sparkles size={18} />}
              {t === "EQUIPE" ? "Efetivo da Unidade" : t === "OCORRENCIAS" ? "Fiscalização de Conduta" : t === "TRANSFERENCIAS" ? "Trocas de Posto" : "Pedidos & Demandas"}
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
            <div className="flex flex-col md:flex-row items-center justify-end gap-4 px-2">
              <div className="flex items-center gap-2 bg-[var(--bg-card)] px-4 py-3 rounded-2xl border border-[var(--border)] shadow-sm">
                <Info size={14} className="text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] italic">Alterações de horário notificam o RH imediatamente</span>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-2xl overflow-hidden overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-base)]/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Colaborador</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cargo / Função</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Horário</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Insalubridade</th>
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
                        {(() => {
                          const ref = quadroReferencia.find(q => (q.cargo || "").toUpperCase() === (c.cargo || "").toUpperCase())?.insalubridade || 'N/A';
                          return (
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => setModalInsalubridade(c)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-105 w-fit ${
                                  c.insalubridade === '40%' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                                  c.insalubridade === '30%' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' :
                                  c.insalubridade === '20%' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                                  'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-muted)]'
                                }`}
                              >
                                <Zap size={14} className={c.insalubridade ? 'text-current' : 'text-slate-400'} />
                                <span className="text-[10px] font-black uppercase">{c.insalubridade || "DEFINIR"}</span>
                              </button>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ref. Quadro: {ref}</span>
                            </div>
                          );
                        })()}
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
      {modalInsalubridade && (
        <AdaptiveModal isOpen={!!modalInsalubridade} onClose={() => setModalInsalubridade(null)} title="Definir Percentual de Insalubridade" size="md">
          <div className="p-8 space-y-6">
            <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20">
               <h4 className="text-sm font-black uppercase text-amber-600 mb-2">{modalInsalubridade.nome}</h4>
               <p className="text-[11px] font-bold text-slate-500 uppercase">
                 Defina o percentual de acordo com o risco da atividade. 
                 <br/><br/>
                 <span className="text-amber-700">Atenção: Cozinha é fixo em 20%. Auxiliares de limpeza variam entre 20% e 40% dependendo do setor.</span>
               </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {['N/A', '20%', '30%', '40%'].map(pct => (
                 <button
                  key={pct}
                  onClick={() => handleUpdateInsalubridade(modalInsalubridade.id, pct)}
                  className={`py-6 rounded-2xl font-black text-xl transition-all border-2 ${
                    modalInsalubridade.insalubridade === pct 
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xl scale-105' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-amber-300'
                  }`}
                 >
                   {pct}
                 </button>
               ))}
            </div>
          </div>
        </AdaptiveModal>
      )}

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
