"use client";
import { useState, useEffect } from "react";
import { 
  Search, AlertTriangle, Clock, CheckCircle2, Plus, 
  MessageSquare, User, Calendar, Filter, ArrowRight,
  ShieldAlert, Send, Info, Save, Eye
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function OcorrenciasModule({ user }: { user: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  const [modalAberto, setModalAberto] = useState<null | "nova" | "detalhes" | "receber" | "resolver">(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    assunto: "", 
    descricao: "", 
    prioridade: "NORMAL", 
    prazo_estipulado_dias: 7, 
    setor_destino: "Gerência Operacional",
    funcao: "",
    responsavel_citado_id: "",
    responsavel_citado_nome: ""
  });
  const [receberData, setReceberData] = useState({ prazo_prometido: "" });
  const [resolverData, setResolverData] = useState({ solucao: "" });

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
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('nome', `%${buscaColab}%`)
      .limit(10);
    
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
    if (!formData.assunto || !formData.descricao) return alert("Preencha todos os campos.");
    setLoading(true);
    const { error } = await supabase.from('tickets_sla').insert([{
      ...formData,
      criado_por: user.name || user.nome || 'Setor Admin',
      representante_id: user.id,
      representante_nome: user.name || user.nome,
      status: 'PENDENTE'
    }]);
    if (error) alert(error.message);
    else { supabase.from("notificacoes").insert([{ setor_destino: formData.setor_destino, titulo: "Nova OcorrÃªncia", mensagem: "Demanda: " + formData.assunto, link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); }
    setLoading(false);
  };

  const handleMarcarRecebido = async () => {
    if (!receberData.prazo_prometido) return alert("Informe sua previsão de entrega.");
    setLoading(true);
    const { error } = await supabase.from('tickets_sla').update({
      status: 'EM ANALISE',
      data_recebimento: new Date().toISOString(),
      prazo_prometido: receberData.prazo_prometido,
      recebido_por_id: user.id,
      recebido_por_nome: user.name || user.nome
    }).eq('id', selectedTicket.id);
    if (error) alert(error.message);
    else { supabase.from("notificacoes").insert([{ user_id: selectedTicket.representante_id, titulo: "OcorrÃªncia Recebida", mensagem: "Sua demanda foi recebida.", link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); }
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
    else { supabase.from("notificacoes").insert([{ user_id: selectedTicket.representante_id, titulo: "OcorrÃªncia Resolvida", mensagem: "Sua demanda foi resolvida.", link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); }
    setLoading(false);
  };

  const getStatusInfo = (t: any) => {
    const agora = new Date();
    const abertura = new Date(t.data_abertura);
    
    // Prazo prometido pelo setor (se houver)
    const deadlineAcordado = t.prazo_prometido ? new Date(t.prazo_prometido) : null;
    
    // Prazo estipulado originalmente (em dias)
    const diffDiasSolicitado = Math.floor((agora.getTime() - abertura.getTime()) / (1000 * 60 * 60 * 24));
    const isAtrasadoSolicitado = diffDiasSolicitado >= (t.prazo_estipulado_dias || 1);

    if (t.status === 'RESOLVIDO') return { label: 'Resolvido', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
    
    if (t.status === 'RESOLVIDO_COM_ATRASO') {
      return { label: 'Resolvido (FORA DO PRAZO)', color: 'bg-amber-100 text-amber-700 border border-amber-300', icon: CheckCircle2 };
    }

    // Se estourou o prazo que o PRÓPRIO setor prometeu: FALIT
    if (deadlineAcordado && agora > deadlineAcordado && !t.status.startsWith('RESOLVIDO')) {
      return { label: 'FALIT (Não Cumprido)', color: 'bg-black text-white border-2 border-red-600 animate-pulse', icon: ShieldAlert };
    }

    if (isAtrasadoSolicitado && !t.status.startsWith('RESOLVIDO')) {
      return { label: 'URGENTE (Atrasado)', color: 'bg-red-600 text-white shadow-lg shadow-red-600/40', icon: ShieldAlert };
    }
    
    if (t.status === 'RECEBIDO' || t.status === 'EM ANALISE') {
      return { label: 'Em Atendimento', color: 'bg-blue-100 text-blue-700', icon: Clock };
    }
    
    return { label: 'Aguardando', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle };
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full w-full max-w-[1400px] mx-auto py-10 px-6 lg:px-20">
      
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

      {/* FILTROS */}
      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="input-field !pl-14 !h-12 text-xs" placeholder="Pesquisar por assunto ou solicitante..." value={busca} onChange={e => setBusca(e.target.value)} />
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
                  {tickets.filter(t => t.assunto?.toLowerCase().includes(busca.toLowerCase()) || t.criado_por?.toLowerCase().includes(busca.toLowerCase())).map(t => {
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
                              <div className="flex flex-col items-center justify-center">
                                 <span className="text-xs font-black text-blue-600">{t.prazo_estipulado_dias}d</span>
                                 {t.prazo_prometido && (
                                    <span className="text-[8px] font-black text-green-600 border-t border-[var(--border)] pt-1 mt-1">
                                       {new Date(t.prazo_prometido).toLocaleDateString()}
                                    </span>
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
         <div className="p-10 space-y-6">
            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Assunto da Demanda</label>
               <input className="input-field !h-14 font-black" value={formData.assunto} onChange={e => setFormData({...formData, assunto: e.target.value})} placeholder="Ex: Ar-condicionado parou de funcionar" />
            </div>
            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Setor Destino / Responsável</label>
               <select className="input-field !h-14 font-black" value={formData.setor_destino} onChange={e => setFormData({...formData, setor_destino: e.target.value})}>
                  <option value="Gerência Operacional">Gerência Operacional</option>
                  <option value="RH Recursos Humanos">RH Recursos Humanos</option>
                  <option value="Almoxarifado">Almoxarifado</option>
                  <option value="Encarregado">Encarregado</option>
                  <option value="Técnico Segurança">Técnico Segurança</option>
                  <option value="Gerência Regional">Gerência Regional</option>
               </select>
            </div>
            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Descrição Detalhada</label>
               <textarea className="input-field !h-32 p-4 text-xs font-bold" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Descreva o problema para que o setor possa resolver..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="relative">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block italic">Pesquisa Rápida de Colaborador (Interessado)</label>
                  <div className="relative">
                     <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                     <input 
                       className="input-field !pl-12 !h-14 font-black text-xs" 
                       placeholder="BUSCAR PELO NOME..." 
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
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {colabsSugeridos.map(c => (
                        <button 
                          key={c.id}
                          onClick={() => selecionarColab(c)}
                          className="w-full p-4 flex flex-col items-start gap-1 hover:bg-[var(--brand)]/10 border-b border-[var(--border)] last:border-none transition-colors"
                        >
                          <span className="text-[11px] font-black uppercase text-[var(--text-primary)]">{c.nome}</span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{c.unidade_alocacao || c.unidade || "S/ UNIDADE"} • {c.funcao || c.cargo || "COLABORADOR"}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    buscaColab.length > 1 && !buscando && campoBuscaAtivo === "interessado" && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 shadow-xl z-50 text-center">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">Nenhum colaborador encontrado</p>
                      </div>
                    )
                  )}
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Interessado Selecionado</label>
                  <div className="input-field !h-14 font-black flex items-center px-4 bg-[var(--bg-base)] text-[var(--brand)] border-dashed border-2">
                     {formData.interessado_nome || "NENHUM SELECIONADO"}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10">
               <div className="relative">
                  <label className="text-[10px] font-black uppercase text-amber-600 mb-2 block font-bold">Citar Responsável (Opcional)</label>
                  <div className="relative">
                     <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600" />
                     <input 
                       className="input-field !pl-12 !h-14 font-black text-xs border-amber-200 focus:border-amber-500" 
                       placeholder="BUSCAR RESPONSÁVEL..." 
                       value={campoBuscaAtivo === "citado" ? buscaColab : ""}
                       onChange={e => { setBuscaColab(e.target.value); setCampoBuscaAtivo("citado"); }}
                     />
                     {buscando && campoBuscaAtivo === "citado" && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
                        </div>
                     )}
                  </div>
                  {colabsSugeridos.length > 0 && campoBuscaAtivo === "citado" && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {colabsSugeridos.map(c => (
                        <button 
                          key={c.id}
                          onClick={() => selecionarColab(c)}
                          className="w-full p-4 flex flex-col items-start gap-1 hover:bg-amber-500/10 border-b border-[var(--border)] last:border-none transition-colors"
                        >
                          <span className="text-[11px] font-black uppercase text-amber-600">{c.nome}</span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{c.unidade_alocacao || "OPERAÇÃO"}</span>
                        </button>
                      ))}
                    </div>
                  )}
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Responsável Citado</label>
                  <div className="input-field !h-14 font-black flex items-center px-4 bg-white text-amber-600 border-dashed border-2 border-amber-200">
                     {formData.responsavel_citado_nome || "NINGUÉM CITADO"}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Unidade / Alocação</label>
                  <input className="input-field !h-12 !bg-[var(--bg-base)] text-xs font-bold" value={formData.unidade} disabled />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Secretaria</label>
                  <input className="input-field !h-12 !bg-[var(--bg-base)] text-xs font-bold" value={formData.secretaria} disabled />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Função</label>
                  <input className="input-field !h-12 !bg-[var(--bg-base)] text-xs font-bold" value={formData.funcao} disabled />
               </div>
            </div>

            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Prioridade & Prazo de SLA</label>
               <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'NORMAL', label: 'NORMAL (7 DIAS)', days: 7, color: 'hover:border-blue-500 text-blue-600' },
                    { id: 'MEDIO', label: 'MÉDIO (3 DIAS)', days: 3, color: 'hover:border-orange-500 text-orange-600' },
                    { id: 'CRITICO', label: 'CRÍTICO (24HS)', days: 1, color: 'hover:border-red-600 text-red-600' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setFormData({...formData, prioridade: p.id, prazo_estipulado_dias: p.days})}
                      className={`h-14 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${formData.prioridade === p.id ? 'border-current bg-[var(--bg-base)]' : 'border-[var(--border)] opacity-60'} ${p.color}`}
                    >
                      <span className="text-[10px] font-black tracking-tighter">{p.label}</span>
                    </button>
                  ))}
               </div>
            </div>
            <button onClick={handleNovaOcorrencia} className="w-full h-16 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/30 hover:scale-[1.02] transition-all">Registrar Ocorrência</button>
         </div>
      </AdaptiveModal>

      {/* MODAL DETALHES E AÇÃO */}
      <AdaptiveModal isOpen={modalAberto === "detalhes"} onClose={() => setModalAberto(null)} title="Visualização da Ocorrência">
         {selectedTicket && (
            <div className="p-10 space-y-8">
               <div className="border-b border-[var(--border)] pb-6">
                  <h4 className="text-xl font-black">{selectedTicket.assunto}</h4>
                  <p className="text-xs text-[var(--text-muted)] font-bold mt-2">{selectedTicket.descricao}</p>
               </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="p-5 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)]">Aberto em</p>
                      <p className="text-sm font-black">{new Date(selectedTicket.data_abertura).toLocaleDateString()}</p>
                   </div>
                   <div className="p-5 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)]">Prazo Solicitado</p>
                      <p className="text-sm font-black text-blue-600">{selectedTicket.prazo_estipulado_dias} Dias</p>
                   </div>
                   <div className="p-5 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)]">Prazo Acordado</p>
                      <p className={`text-sm font-black ${selectedTicket.prazo_prometido ? 'text-green-600' : 'text-[var(--text-muted)] italic'}`}>
                         {selectedTicket.prazo_prometido ? new Date(selectedTicket.prazo_prometido).toLocaleDateString() : 'Aguardando...'}
                      </p>
                   </div>
                   <div className="p-5 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)]">Setor Destino</p>
                      <p className="text-sm font-black truncate">{selectedTicket.setor_destino || 'Setor Geral'}</p>
                   </div>
                </div>

                <div className="p-6 bg-[var(--bg-base)] rounded-3xl border border-[var(--border)] flex justify-between items-center">
                   <div>
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1">Interessado (Colaborador)</p>
                      <p className="text-base font-black text-[var(--text-primary)]">{selectedTicket.interessado_nome || selectedTicket.criado_por}</p>
                      <p className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-tight">{selectedTicket.funcao || 'OPERACIONAL'}</p>
                   </div>
                   {selectedTicket.representante_nome && (
                      <div className="text-right">
                         <p className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1">Representante (Abertura)</p>
                         <p className="text-sm font-black text-[var(--text-secondary)]">{selectedTicket.representante_nome}</p>
                      </div>
                   )}
                </div>

                {(selectedTicket.recebido_por_nome || selectedTicket.resolvido_por_nome) && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTicket.recebido_por_nome && (
                         <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-[8px] font-black uppercase text-blue-600 mb-1">Recebido por</p>
                            <p className="text-xs font-black text-blue-900">{selectedTicket.recebido_por_nome}</p>
                         </div>
                      )}
                      {selectedTicket.resolvido_por_nome && (
                         <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                            <p className="text-[8px] font-black uppercase text-green-600 mb-1">Resolvido por</p>
                            <p className="text-xs font-black text-green-900">{selectedTicket.resolvido_por_nome}</p>
                         </div>
                      )}
                   </div>
                )}

               {selectedTicket.status === 'PENDENTE' && (
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                     <p className="text-[10px] font-black uppercase text-blue-700 mb-4">Você é o responsável por resolver? Marque como recebido.</p>
                     <div className="flex flex-col gap-4">
                        <div>
                           <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Informe seu Prazo de Entrega (Previsão)</label>
                           <input type="date" className="input-field" value={receberData.prazo_prometido} onChange={e => setReceberData({prazo_prometido: e.target.value})} />
                        </div>
                        <button onClick={handleMarcarRecebido} className="h-14 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Confirmar Recebimento</button>
                     </div>
                  </div>
               )}

               {(selectedTicket.status === 'RECEBIDO' || selectedTicket.status === 'EM ANALISE') && (
                  <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                     <p className="text-[10px] font-black uppercase text-green-700 mb-4">Finalizar Demanda</p>
                     <div className="flex flex-col gap-4">
                        <textarea className="input-field !h-24 p-3 text-xs" value={resolverData.solucao} onChange={e => setResolverData({solucao: e.target.value})} placeholder="Descreva a solução aplicada (Devolutiva)..." />
                        <button onClick={handleResolverOcorrencia} className="h-14 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Marcar como Resolvido</button>
                     </div>
                  </div>
               )}

               {selectedTicket.status === 'RESOLVIDO' && (
                  <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                     <p className="text-[10px] font-black uppercase text-green-700 mb-2">Devolutiva Técnica</p>
                     <p className="text-xs font-bold text-green-900 leading-relaxed italic">"{selectedTicket.solucao_descricao}"</p>
                     <div className="mt-4 text-[9px] font-black text-green-600 uppercase">Resolvido em: {new Date(selectedTicket.data_fechamento).toLocaleString()}</div>
                  </div>
               )}
            </div>
         )}
      </AdaptiveModal>
    </div>
  );
}
