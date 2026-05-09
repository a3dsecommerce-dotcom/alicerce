"use client";
import { useState, useEffect } from "react";
import { 
  Search, AlertTriangle, Clock, CheckCircle2, Plus, 
  MessageSquare, User, Calendar, Filter, ArrowRight,
  ShieldAlert, Send, Info, Save, Eye, TrendingUp, AlertOctagon, Activity, Archive
} from "lucide-react";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import { getBusinessHoursElapsed } from "@/utils/dateUtils";

export default function OcorrenciasModule({ user }: { user: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("TODOS");
  const [viewMode, setViewMode] = useState<"ATIVAS" | "ARQUIVO">("ATIVAS");
  
  const [modalAberto, setModalAberto] = useState<null | "nova" | "detalhes" | "receber" | "resolver">(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    assunto: "", 
    descricao: "", 
    prioridade: "NORMAL", 
    prazo_estipulado_dias: 7, 
    setor_destino: "Gerência Operacional",
    funcao: "",
    interessado_id: null,
    interessado_nome: "",
    unidade: "",
    secretaria: "",
    responsavel_citado_id: null,
    responsavel_citado_nome: ""
  });
  const [cancelarData, setCancelarData] = useState({ motivo: "", showForm: false });
  const [resolverData, setResolverData] = useState({ solucao: "", showForm: false });

  // Busca de colaboradores
  const [buscaColab, setBuscaColab] = useState("");
  const [colabsSugeridos, setColabsSugeridos] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (buscaColab.length > 1) {
      searchColabs();
    } else {
      setColabsSugeridos([]);
    }
  }, [buscaColab]);

  async function searchColabs() {
    setBuscando(true);
    let query = supabase.from('usuarios').select('*');
    
    // Se for busca para "citado", só permitimos Nível 2 ou superior (Encarregados, Gerentes, etc) E da unidade Alicerce
    if (campoBuscaAtivo === "citado") {
       // Força buscar apenas Nível >= 2 E Unidade Alicerce
       query = query.gte('nivel_acesso', 2).ilike('unidade_alocacao', '%alicerce%');
       
       if (buscaColab.length < 2) {
         const term = formData.setor_destino.split(" ")[0]; // Pega a primeira palavra chave
         query = query.or(`funcao.ilike.%${term}%,cargo.ilike.%${term}%`);
       } else {
         query = query.ilike('nome', `%${buscaColab}%`);
       }
    } else {
       // Para outras buscas (ex: Interessado), pode ser qualquer nível
       query = query.ilike('nome', `%${buscaColab}%`);
    }

    const { data, error } = await query.limit(10);
    
    if (error) console.error("Erro busca:", error);
    if (data) setColabsSugeridos(data);
    setBuscando(false);
  }

  // Controle de qual campo está sendo buscado
  const [campoBuscaAtivo, setCampoBuscaAtivo] = useState<"interessado" | "citado">("interessado");

  const selecionarColab = (colab: any) => {
    if (campoBuscaAtivo === "interessado") {
      setFormData({
        ...formData,
        interessado_id: colab.id,
        interessado_nome: colab.nome,
        unidade: colab.unidade_alocacao || colab.unidade || "",
        secretaria: colab.secretaria || "",
        funcao: colab.funcao || colab.cargo || colab.função || "OPERACIONAL"
      });
    } else {
      setFormData({
        ...formData,
        responsavel_citado_id: colab.id,
        responsavel_citado_nome: colab.nome
      });
    }
    setBuscaColab("");
    setColabsSugeridos([]);
  };

  // Removido o efeito de auto-sugestão ao abrir o modal para evitar dropdown persistente sem ação do usuário.

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    const { data } = await supabase.from('tickets_sla').select('*').order('data_abertura', { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  }

  const handleNovaOcorrencia = async () => {
    if (!formData.assunto || !formData.descricao) return alert("Preencha o assunto e a descrição.");
    if (!formData.responsavel_citado_id) return alert("ERRO: É obrigatório definir o Responsável (Citar Alguém) para prosseguir com o ticket. Se o sistema não sugeriu ninguém, busque pelo nome e selecione.");
    
    setLoading(true);
    const payload = {
      ...formData,
      interessado_id: formData.interessado_id || null,
      responsavel_citado_id: formData.responsavel_citado_id || null,
      criado_por: user.name || user.nome || 'Setor Admin',
      representante_id: user.id || null,
      representante_nome: user.name || user.nome,
      status: 'PENDENTE'
    };

    const { error } = await supabase.from('tickets_sla').insert([payload]);
    if (error) alert(error.message);
    else { 
      // Log de Atividade
      await supabase.from('atividades').insert([{
        usuario_id: user.id,
        usuario_nome: user.name || user.nome,
        mensagem: `Abriu nova ocorrência: ${formData.assunto} (Destino: ${formData.setor_destino})`,
        tipo: "OCORRENCIA",
        created_at: new Date().toISOString()
      }]);
      
      supabase.from("notificacoes").insert([{ setor_destino: formData.setor_destino, titulo: "Nova Ocorrência", mensagem: "Demanda: " + formData.assunto, link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); 
    }
    setLoading(false);
  };

  const handleLimparArquivo = async (ticketsAntigos: any[]) => {
    if (!confirm(`Tem certeza que deseja autorizar a limpeza de ${ticketsAntigos.length} ocorrência(s)? Elas sumirão da tela mas os dados estatísticos serão mantidos no sistema.`)) return;
    
    setLoading(true);
    const ids = ticketsAntigos.map(t => t.id);
    const { error } = await supabase.from('tickets_sla').update({ status: 'ARQUIVADO_FINAL' }).in('id', ids);
    
    if (error) alert(error.message);
    else fetchTickets();
    
    setLoading(false);
  };

  const handleCancelarOcorrencia = async () => {
    if (!cancelarData.motivo) return alert("Descreva o motivo do cancelamento/rejeição.");
    setLoading(true);
    const { error } = await supabase.from('tickets_sla').update({
      status: 'REJEITADO',
      solucao_descricao: "MOTIVO DO CANCELAMENTO: " + cancelarData.motivo,
      resolvido_por_id: user.id,
      resolvido_por_nome: user.name || user.nome,
      data_fechamento: new Date().toISOString()
    }).eq('id', selectedTicket.id);
    if (error) alert(error.message);
    else { 
      // Log de Atividade
      await supabase.from('atividades').insert([{
        usuario_id: user.id,
        usuario_nome: user.name || user.nome,
        mensagem: `Cancelou/Rejeitou ocorrência #${selectedTicket.id.substring(0,8)}: ${cancelarData.motivo}`,
        tipo: "OCORRENCIA",
        created_at: new Date().toISOString()
      }]);
      
      supabase.from("notificacoes").insert([{ user_id: selectedTicket.representante_id, titulo: "Ocorrência Rejeitada", mensagem: "Sua demanda foi cancelada.", link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); 
    }
    setLoading(false);
  };

  const handleResolverOcorrencia = async () => {
    if (!resolverData.solucao) return alert("Descreva a solução aplicada.");
    setLoading(true);
    const agora = new Date();
    const deadlineAcordado = selectedTicket.prazo_prometido ? new Date(selectedTicket.prazo_prometido) : null;
    const isFalit = deadlineAcordado && agora > deadlineAcordado;

    const { error } = await supabase.from('tickets_sla').update({
      status: isFalit ? 'RESOLVIDO_COM_ATRASO' : 'RESOLVIDO',
      data_fechamento: agora.toISOString(),
      solucao_descricao: resolverData.solucao,
      resolvido_por_id: user.id,
      resolvido_por_nome: user.name || user.nome,
      atrasado_na_entrega: isFalit // Campo extra opcional para auditoria
    }).eq('id', selectedTicket.id);
    if (error) alert(error.message);
    else { 
      // Log de Atividade
      await supabase.from('atividades').insert([{
        usuario_id: user.id,
        usuario_nome: user.name || user.nome,
        mensagem: `Resolveu ocorrência #${selectedTicket.id.substring(0,8)}${isFalit ? ' (COM ATRASO)' : ''}`,
        tipo: "OCORRENCIA",
        created_at: new Date().toISOString()
      }]);
      
      supabase.from("notificacoes").insert([{ user_id: selectedTicket.representante_id, titulo: "Ocorrência Resolvida", mensagem: "Sua demanda foi resolvida.", link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); 
    }
    setLoading(false);
  };

  const getStatusInfo = (t: any) => {
    if (t.status === 'ARQUIVADO_FINAL') return { label: 'Arquivado', color: 'bg-slate-100 text-slate-500', icon: Archive, percent: 0, textHour: '-' };
    if (t.status === 'REJEITADO' || t.status === 'CANCELADO') return { label: 'Cancelado', color: 'bg-gray-800 text-white', icon: ShieldAlert, percent: 0, textHour: 'X' };

    const abertura = new Date(t.data_abertura);
    const horaFim = t.data_fechamento ? new Date(t.data_fechamento) : new Date();
    
    // SLA baseado em Horário Comercial (Seg-Sex, 07:00-17:00)
    const horasDecorridas = getBusinessHoursElapsed(abertura, horaFim);
    const horasSLA = (t.prazo_estipulado_dias || 1) * 24;
    const porcentagem = (horasDecorridas / horasSLA) * 100;
    
    const isResolvido = t.status?.startsWith('RESOLVIDO');
    
    let color = 'bg-green-100 text-green-700 border-transparent';
    let icon = Clock;
    
    if (porcentagem > 100) {
      color = isResolvido ? 'bg-red-100 text-red-700 border-red-300' : 'bg-red-600 text-white border-red-800 animate-pulse shadow-lg shadow-red-600/50';
      icon = AlertOctagon;
    } else if (porcentagem > 80) {
      color = isResolvido ? 'bg-orange-100 text-orange-700 border-transparent' : 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/40';
      icon = AlertTriangle;
    } else if (porcentagem > 50) {
      color = 'bg-yellow-100 text-yellow-800 border-transparent';
    }

    if (isResolvido) {
       return { 
         label: porcentagem > 100 ? 'Resolvido (Atrasado)' : 'Resolvido', 
         color: porcentagem > 100 ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-green-100 text-green-700', 
         icon: CheckCircle2, 
         percent: porcentagem, 
         textHour: `${Math.floor(horasDecorridas)}h` 
       };
    }

    return { 
      label: porcentagem > 100 ? 'FALIT (Estourado)' : 'Pendente', 
      color, 
      icon, 
      percent: Math.min(porcentagem, 100), 
      textHour: `${Math.floor(horasDecorridas)}h / ${horasSLA}h` 
    };
  };
  
  const stats = useMemo(() => {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    const ocorrenciasMes = tickets.filter(t => {
      const data = new Date(t.data_abertura);
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    }).length;

    const resolvidasMes = tickets.filter(t => {
      if (!t.status?.startsWith('RESOLVIDO') && t.status !== 'ARQUIVADO_FINAL') return false;
      const data = new Date(t.data_fechamento || t.updated_at);
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    }).length;

    const emAberto = tickets.filter(t => 
      ['PENDENTE', 'RECEBIDO', 'EM ANALISE'].includes(t.status)
    ).length;

    const falit = tickets.filter(t => {
      if (t.atrasado_na_entrega) return true;
      const abertura = new Date(t.data_abertura);
      const horasSLA = (t.prazo_estipulado_dias || 1) * 24;
      const horasDecorridas = getBusinessHoursElapsed(abertura, t.data_fechamento ? new Date(t.data_fechamento) : agora);
      return horasDecorridas > horasSLA && !t.status?.startsWith('RESOLVIDO');
    }).length;

    return { ocorrenciasMes, resolvidasMes, emAberto, falit };
  }, [tickets]);

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full w-full max-w-[1400px] mx-auto py-10 px-6 lg:px-20">
      
      {/* ESTATÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Ocorrências no Mês', val: stats.ocorrenciasMes, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
           { label: 'Resolvidas no Mês', val: stats.resolvidasMes, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20' },
           { label: 'Demandas em Aberto', val: stats.emAberto, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
           { label: 'Nível Falit (Atraso)', val: stats.falit, icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' },
         ].map((s, idx) => (
            <div key={idx} className={`flex items-center justify-between p-6 bg-[var(--bg-card)] rounded-2xl border ${s.border} shadow-sm group hover:scale-[1.02] transition-all`}>
               <div>
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider mb-1">{s.label}</p>
                  <h3 className={`text-3xl font-black ${s.color}`}>{s.val}</h3>
               </div>
               <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                  <s.icon size={24} />
               </div>
            </div>
         ))}
      </div>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600 border border-red-500/20">
              <MessageSquare size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] italic">Ocorrências & Demandas</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Gestão de SLA: Registro, Recebimento e Devolutiva Técnica</p>
           </div>
        </div>

        <button onClick={() => setModalAberto("nova")} className="h-12 px-8 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-red-600/20">
          <Plus size={16} /> Nova Ocorrência
        </button>
      </div>

      {/* FILTROS E ABAS */}
      <div className="flex flex-col gap-6">
        <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-1 w-full md:w-max mx-auto shadow-sm">
           <button 
             onClick={() => setViewMode("ATIVAS")} 
             className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "ATIVAS" ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
           >
             Demandas Ativas
           </button>
           <button 
             onClick={() => setViewMode("ARQUIVO")} 
             className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "ARQUIVO" ? 'bg-slate-800 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
           >
             Arquivo (Resolvidas)
           </button>
        </div>

        {viewMode === "ARQUIVO" && (() => {
          const noventaDiasAtras = new Date();
          noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);
          
          const ticketsAntigos = tickets.filter(t => 
             t.status?.startsWith('RESOLVIDO') && 
             t.data_fechamento && 
             new Date(t.data_fechamento) < noventaDiasAtras
          );

          if (ticketsAntigos.length > 0) {
            return (
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl animate-fade-in shadow-sm">
                 <div className="flex items-center gap-3">
                    <ShieldAlert className="text-red-600" />
                    <div>
                       <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">Alerta de Limpeza de Arquivo</p>
                       <p className="text-xs font-bold text-red-900 mt-1">Existem {ticketsAntigos.length} ocorrência(s) resolvida(s) há mais de 90 dias ocupando espaço visual.</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => handleLimparArquivo(ticketsAntigos)}
                   className="px-6 py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                 >
                   Autorizar Exclusão Lógica
                 </button>
              </div>
            );
          }
          return null;
        })()}

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-2 p-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-x-auto custom-scrollbar w-full md:w-auto">
            {["TODOS", "Gerência", "RH Recursos Humanos", "Almoxarifado", "Técnico Segurança", "Encarregado"].map(s => (
              <button 
                key={s} 
                onClick={() => setFiltroSetor(s)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${filtroSetor === s ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                {s.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input className="input-field !pl-14 !h-12 text-xs" placeholder="Pesquisar por assunto ou solicitante..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {/* TABELA DE OCORRÊNCIAS - DESIGN PREMIUM CENTRADO */}
      <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border)] overflow-hidden shadow-2xl flex flex-col flex-1">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left table-fixed border-separate border-spacing-0">
               <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
                  <tr>
                     <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest pl-8 w-[25%]">Identificação / Assunto</th>
                     <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest w-[25%]">Setor / Citado</th>
                     <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[20%]">Prazos</th>
                     <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[20%]">Status</th>
                     <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right pr-8 w-[10%]">Gestão</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[var(--border)]">
                  {tickets
                    .filter(t => {
                      if (viewMode === "ATIVAS") return !t.status?.startsWith('RESOLVIDO') && t.status !== 'ARQUIVADO_FINAL';
                      if (viewMode === "ARQUIVO") return t.status?.startsWith('RESOLVIDO');
                      return true;
                    })
                    .filter(t => {
                      if (filtroSetor === "TODOS") return true;
                      if (filtroSetor === "Gerência") return t.setor_destino?.startsWith("Gerência");
                      return t.setor_destino === filtroSetor;
                    })
                    .filter(t => t.assunto?.toLowerCase().includes(busca.toLowerCase()) || t.criado_por?.toLowerCase().includes(busca.toLowerCase()))
                    .map(t => {
                     const s = getStatusInfo(t);
                     return (
                        <tr key={t.id} className="hover:bg-[var(--brand-alpha)] transition-all group">
                           <td className="p-4 pl-8">
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">{new Date(t.data_abertura).toLocaleDateString()}</span>
                                 <div className="text-xs font-black text-[var(--text-primary)] truncate pr-4" title={t.assunto}>{t.assunto}</div>
                                 <span className="text-[8px] font-bold text-blue-600 mt-1 uppercase truncate opacity-70">Solic: {t.interessado_nome || t.criado_por}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-red-600 uppercase tracking-tight truncate">{t.setor_destino || 'Setor Geral'}</span>
                                 <span className="text-[9px] font-bold text-[var(--text-muted)] truncate mt-0.5">
                                    {t.responsavel_citado_nome ? `Citado: ${t.responsavel_citado_nome}` : '--'}
                                 </span>
                              </div>
                           </td>
                           <td className="p-4 text-center">
                              <div className="flex flex-col items-center justify-center w-full px-2">
                                 <span className="text-[10px] font-black text-[var(--text-primary)] mb-1">{s.textHour}</span>
                                 {t.status !== 'ARQUIVADO_FINAL' && t.status !== 'REJEITADO' && (
                                   <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden flex">
                                     <div 
                                       className={`h-full ${s.percent > 100 ? 'bg-red-600' : s.percent > 80 ? 'bg-orange-500' : s.percent > 50 ? 'bg-yellow-500' : 'bg-green-500'} transition-all`} 
                                       style={{ width: `${Math.min(s.percent, 100)}%` }}
                                     />
                                   </div>
                                 )}
                              </div>
                           </td>
                           <td className="p-4 text-center">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${s.color}`}>
                                 <s.icon size={10} /> {s.label}
                              </div>
                           </td>
                           <td className="p-4 text-right pr-8">
                              <button 
                                 onClick={() => { setSelectedTicket(t); setModalAberto("detalhes"); }} 
                                 className="p-2.5 bg-[var(--bg-base)] text-[var(--brand)] rounded-xl border border-[var(--border)] hover:bg-[var(--brand)] hover:text-white hover:border-transparent transition-all shadow-sm group-hover:scale-110"
                              >
                                 <Eye size={14}/>
                              </button>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* MODAL NOVA OCORRÊNCIA */}
      <AdaptiveModal isOpen={modalAberto === "nova"} onClose={() => setModalAberto(null)} title="Abrir Nova Ocorrência / Demanda">
         <div className="p-8 space-y-6">
            <div>
               <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Assunto da Demanda</label>
               <input className="input-field !h-12 font-medium text-sm w-full" value={formData.assunto} onChange={e => setFormData({...formData, assunto: e.target.value})} placeholder="Ex: Ar-condicionado parou de funcionar" />
            </div>
            <div>
               <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Setor Destino / Responsável</label>
               <select className="input-field !h-12 font-medium text-sm w-full" value={formData.setor_destino} onChange={e => setFormData({...formData, setor_destino: e.target.value})}>
                  <option value="Gerência Operacional">Gerência Operacional</option>
                  <option value="RH Recursos Humanos">RH Recursos Humanos</option>
                  <option value="Almoxarifado">Almoxarifado</option>
                  <option value="Encarregado">Encarregado</option>
                  <option value="Técnico Segurança">Técnico Segurança</option>
                  <option value="Gerência Regional">Gerência Regional</option>
               </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="relative">
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Pesquisa de Colaborador (Solicitante)</label>
                  <div className="relative">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                     <input 
                       className="input-field !pl-12 !h-12 font-medium text-sm w-full" 
                       placeholder="Buscar pelo nome..." 
                       value={buscaColab}
                       onChange={e => { setBuscaColab(e.target.value); setCampoBuscaAtivo("interessado"); }}
                     />
                     {buscando && campoBuscaAtivo === "interessado" && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--brand)] border-t-transparent"></div>
                        </div>
                     )}
                  </div>
                  {colabsSugeridos.length > 0 && campoBuscaAtivo === "interessado" ? (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {colabsSugeridos.map(c => (
                        <button 
                          key={c.id}
                          onClick={() => selecionarColab(c)}
                          className="w-full p-3 flex flex-col items-start gap-1 hover:bg-[var(--bg-base)] border-b border-[var(--border)] last:border-none transition-colors text-left"
                        >
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{c.nome}</span>
                          <span className="text-xs text-[var(--text-muted)]">{c.unidade_alocacao || c.unidade || "Sem unidade"} • {c.funcao || c.cargo || "Colaborador"}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    buscaColab.length > 1 && !buscando && campoBuscaAtivo === "interessado" && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 shadow-xl z-50 text-center">
                        <p className="text-xs text-[var(--text-muted)]">Nenhum colaborador encontrado</p>
                      </div>
                    )
                  )}
               </div>
               <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Solicitante Selecionado</label>
                  <div className="input-field !h-12 font-medium text-sm flex items-center px-4 bg-[var(--bg-base)] text-[var(--brand)] border-dashed border-2">
                     {formData.interessado_nome || "Selecione um solicitante"}
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/30">
               <div className="relative">
                  <label className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 block flex items-center gap-2">
                    <AlertOctagon size={14}/> Responsável para Executar (Obrigatório)
                  </label>
                  <div className="relative">
                     <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                     <input 
                       className="input-field !pl-12 !h-12 font-medium text-sm w-full border-red-200 dark:border-red-900/50 focus:border-red-500" 
                       placeholder="Buscar responsável pelo nome..." 
                       value={campoBuscaAtivo === "citado" ? buscaColab : ""}
                       onChange={e => { setBuscaColab(e.target.value); setCampoBuscaAtivo("citado"); }}
                       onClick={() => { setCampoBuscaAtivo("citado"); searchColabs(); }}
                     />
                     {buscando && campoBuscaAtivo === "citado" && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        </div>
                     )}
                  </div>
                  {colabsSugeridos.length > 0 && campoBuscaAtivo === "citado" && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                      <div className="px-4 py-2 bg-[var(--bg-base)] border-b border-[var(--border)]">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Sugeridos do Sistema</span>
                      </div>
                      {colabsSugeridos.map(c => (
                        <button 
                          key={c.id}
                          onClick={() => selecionarColab(c)}
                          className="w-full p-3 flex flex-col items-start gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 border-b border-[var(--border)] last:border-none transition-colors text-left"
                        >
                          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{c.nome}</span>
                          <span className="text-xs text-[var(--text-muted)]">{c.funcao || c.nivel_acesso || "Operação"}</span>
                        </button>
                      ))}
                    </div>
                  )}
               </div>
               <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Responsável Designado</label>
                  <div className={`input-field !h-12 font-medium text-sm flex items-center px-4 border-dashed border-2 ${formData.responsavel_citado_nome ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800' : 'bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border)]'}`}>
                     {formData.responsavel_citado_nome || "Clique na busca para selecionar"}
                  </div>
               </div>
            </div>

            <div>
               <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Descrição Detalhada do Problema</label>
               <textarea className="input-field !h-28 p-4 text-sm font-medium w-full resize-none" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Descreva o problema de forma clara para que o setor possa resolver..." />
            </div>

            <div>
               <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Prioridade & Prazo de SLA</label>
               <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'NORMAL', label: 'Normal (7 Dias)', days: 7, color: 'hover:border-blue-500 text-blue-600' },
                    { id: 'MEDIO', label: 'Médio (3 Dias)', days: 3, color: 'hover:border-orange-500 text-orange-600' },
                    { id: 'CRITICO', label: 'Crítico (24hs)', days: 1, color: 'hover:border-red-600 text-red-600' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setFormData({...formData, prioridade: p.id, prazo_estipulado_dias: p.days})}
                      className={`h-12 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${formData.prioridade === p.id ? 'border-current bg-[var(--bg-base)] shadow-sm' : 'border-[var(--border)] opacity-60 hover:opacity-100'} ${p.color}`}
                    >
                      <span className="text-sm font-semibold tracking-tight">{p.label}</span>
                    </button>
                  ))}
               </div>
            </div>
            <button onClick={handleNovaOcorrencia} className="w-full h-14 bg-red-600 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-red-600/30 hover:bg-red-700 transition-all">
               Registrar Ocorrência
            </button>
         </div>
      </AdaptiveModal>

      {/* MODAL DETALHES E AÇÃO */}
      <AdaptiveModal isOpen={modalAberto === "detalhes"} onClose={() => setModalAberto(null)} title="Visualização da Ocorrência">
         {selectedTicket && (
            <div className="p-8 space-y-6">
               <div className="border-b border-[var(--border)] pb-6">
                  <h4 className="text-xl font-bold text-[var(--text-primary)]">{selectedTicket.assunto}</h4>
                  <p className="text-sm text-[var(--text-secondary)] font-medium mt-3 leading-relaxed">{selectedTicket.descricao}</p>
               </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] flex flex-col justify-center">
                      <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider mb-1">Aberto em</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{new Date(selectedTicket.data_abertura).toLocaleDateString()}</p>
                   </div>
                   <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] flex flex-col justify-center">
                      <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider mb-1">Prazo Solicitado</p>
                      <p className="text-sm font-semibold text-blue-600">{selectedTicket.prazo_estipulado_dias} Dias</p>
                   </div>
                   <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] flex flex-col justify-center">
                      <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider mb-1">Prazo Acordado</p>
                      <p className={`text-sm font-semibold ${selectedTicket.prazo_prometido ? 'text-green-600' : 'text-[var(--text-muted)] italic'}`}>
                         {selectedTicket.prazo_prometido ? new Date(selectedTicket.prazo_prometido).toLocaleDateString() : 'Aguardando...'}
                      </p>
                   </div>
                   <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] flex flex-col justify-center">
                      <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider mb-1">Setor Destino</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{selectedTicket.setor_destino || 'Setor Geral'}</p>
                   </div>
                </div>

                <div className="p-5 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] flex justify-between items-center">
                   <div>
                      <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider mb-1">Interessado (Colaborador)</p>
                      <p className="text-base font-bold text-[var(--text-primary)]">{selectedTicket.interessado_nome || selectedTicket.criado_por}</p>
                      <p className="text-xs font-semibold text-[var(--brand)]">{selectedTicket.funcao || 'Operacional'}</p>
                   </div>
                   {selectedTicket.representante_nome && (
                      <div className="text-right">
                         <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider mb-1">Representante (Abertura)</p>
                         <p className="text-sm font-semibold text-[var(--text-secondary)]">{selectedTicket.representante_nome}</p>
                      </div>
                   )}
                </div>

                {['PENDENTE', 'RECEBIDO', 'EM ANALISE'].includes(selectedTicket.status) && (
                   <div className="bg-[var(--bg-base)] p-6 rounded-2xl border border-[var(--border)] flex flex-col gap-5 shadow-sm">
                      <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Ações de Gestão do Ticket</p>
                      
                      {!resolverData.showForm && !cancelarData.showForm && (
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={() => setResolverData({...resolverData, showForm: true})} className="h-12 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all shadow-sm">Aceitar e Resolver</button>
                           <button onClick={() => setCancelarData({...cancelarData, showForm: true})} className="h-12 bg-transparent text-red-600 border-2 border-red-200 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-900/50 transition-all">Recusar / Cancelar</button>
                        </div>
                      )}

                      {resolverData.showForm && (
                         <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-semibold text-green-700 dark:text-green-500 mb-1 block">Devolutiva Técnica (Solução Aplicada)</label>
                            <textarea className="input-field !h-28 p-4 text-sm border-green-200 focus:border-green-500 dark:border-green-900/50 resize-none" value={resolverData.solucao} onChange={e => setResolverData({...resolverData, solucao: e.target.value})} placeholder="Descreva claramente como o problema foi resolvido..." />
                            <div className="flex gap-4">
                              <button onClick={() => setResolverData({...resolverData, showForm: false})} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Voltar</button>
                              <button onClick={handleResolverOcorrencia} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">Confirmar Resolução</button>
                            </div>
                         </div>
                      )}

                      {cancelarData.showForm && (
                         <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 block">Motivo da Recusa / Cancelamento</label>
                            <textarea className="input-field !h-28 p-4 text-sm border-red-200 focus:border-red-500 dark:border-red-900/50 resize-none" value={cancelarData.motivo} onChange={e => setCancelarData({...cancelarData, motivo: e.target.value})} placeholder="Descreva detalhadamente o porquê desta ocorrência não poder ser atendida..." />
                            <div className="flex gap-4">
                              <button onClick={() => setCancelarData({...cancelarData, showForm: false})} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Voltar</button>
                              <button onClick={handleCancelarOcorrencia} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">Confirmar Recusa</button>
                            </div>
                         </div>
                      )}
                   </div>
                )}

                {selectedTicket.status?.startsWith('RESOLVIDO') && (
                   <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-2xl border border-green-200 dark:border-green-900/30">
                      <p className="text-[11px] font-bold uppercase text-green-700 dark:text-green-500 mb-3 tracking-wider">Devolutiva Técnica</p>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 leading-relaxed italic border-l-2 border-green-300 dark:border-green-700 pl-4 py-1">&quot;{selectedTicket.solucao_descricao}&quot;</p>
                      <div className="mt-6 flex items-center justify-between">
                         <div className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Resolvido em: {new Date(selectedTicket.data_fechamento).toLocaleString()}</div>
                         <div className="text-[10px] font-bold text-green-800 dark:text-green-100 uppercase bg-green-200 dark:bg-green-800 px-3 py-1.5 rounded-full">{selectedTicket.resolvido_por_nome}</div>
                      </div>
                   </div>
                )}

                {(selectedTicket.status === 'REJEITADO' || selectedTicket.status === 'CANCELADO') && (
                   <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-200 dark:border-red-900/30">
                      <p className="text-[11px] font-bold uppercase text-red-700 dark:text-red-400 mb-3 tracking-wider">Ocorrência Recusada / Cancelada</p>
                      <p className="text-sm font-medium text-red-900 dark:text-red-100 leading-relaxed italic border-l-2 border-red-300 dark:border-red-700 pl-4 py-1">&quot;{selectedTicket.solucao_descricao}&quot;</p>
                      <div className="mt-6 flex items-center justify-between">
                         <div className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Em: {new Date(selectedTicket.data_fechamento).toLocaleString()}</div>
                         <div className="text-[10px] font-bold text-red-800 dark:text-red-100 uppercase bg-red-200 dark:bg-red-800 px-3 py-1.5 rounded-full">{selectedTicket.resolvido_por_nome}</div>
                      </div>
                   </div>
                )}
             </div>
         )}
      </AdaptiveModal>
    </div>
  );
}
