"use client";
import { useState, useEffect } from "react";
import { Plus, Clock, AlertOctagon, CheckCircle, Loader, User, MapPin, MessageCircle, Search, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";

import AdaptiveModal from "@/components/ui/AdaptiveModal";

// Categorias de status para referência
const statusMap: Record<string, string> = {
  "PENDENTE": "Pendentes",
  "EM_ANDAMENTO": "Em Andamento",
  "RESOLVIDO": "Resolvidos",
};

const priorStyles: Record<string, { bg: string, text: string, border: string }> = { 
  CRITICA: { bg: "rgba(239, 68, 68, 0.1)", text: "#EF4444", border: "rgba(239, 68, 68, 0.2)" }, 
  ALTA: { bg: "rgba(245, 158, 11, 0.1)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.2)" }, 
  MEDIA: { bg: "rgba(59, 130, 246, 0.1)", text: "#3B82F6", border: "rgba(59, 130, 246, 0.2)" }, 
  BAIXA: { bg: "rgba(16, 185, 129, 0.1)", text: "#10B981", border: "rgba(16, 185, 129, 0.2)" }, 
  NORMAL: { bg: "rgba(148, 163, 184, 0.1)", text: "#64748B", border: "rgba(148, 163, 184, 0.2)" } 
};
export default function OcorrenciasPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"lista">("lista");
  const [modalNova, setModalNova] = useState(false);
  const [modalResolucao, setModalResolucao] = useState(false);
  const [ticketSelecionado, setTicketSelecionado] = useState<any>(null);
  const [solucaoTexto, setSolucaoTexto] = useState("");
  
  const [user, setUser] = useState<any>(null);
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    assunto: "",
    unidade_id: "",
    prioridade: "NORMAL",
    descricao: "",
    setor_destino: "OPERACIONAL",
    responsavel_citado: ""
  });

  const departamentos = [
    { id: "GERENCIA", label: "Gerência" },
    { id: "RH_PESSOAL", label: "RH Pessoal" },
    { id: "RH_BENEFICIOS", label: "RH Benefícios e Doc" },
    { id: "RH_PONTO", label: "RH Controle de Ponto" },
    { id: "ENCARREGADOS", label: "Encarregado da Rota" },
  ];

  const loadData = async () => {
    setLoading(true);
    // Tickets
    let query = supabase.from('tickets_sla').select('*');
    
    // Filtro por Setor (Hierarquia Operacional)
    const savedUser = localStorage.getItem("crm_user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      
      const role = u.role || "";
      const isSetorial = ["RH", "ALMOXARIFE", "TI", "FINANCEIRO", "ENCARREGADO", "DIRETOR"].some(r => role.startsWith(r));
      
      if (isSetorial && role !== "ADMIN" && role !== "DIRETORIA") {
        let setor = "OPERACIONAL";
        if (role.startsWith("RH")) setor = "RH";
        else if (role === "ALMOXARIFE") setor = "ALMOXARIFADO";
        else if (role === "TI") setor = "TI";
        else if (role === "FINANCEIRO") setor = "FINANCEIRO";
        
        // Regra de Ouro: Vejo o que é do meu setor OU o que EU criei OU onde fui citado
        query = query.or(`setor_destino.eq.${setor},criado_por.eq.${u.nome},responsavel_citado.ilike.%${u.nome}%`);
      }
      // ADMIN e DIRETORIA vêem tudo (sem filtro adicional)
    }

    const { data: ticketData } = await query.order('data_abertura', { ascending: false });
    if (ticketData) {
      setTickets(ticketData.map(t => ({
        ...t,
        id: `#${t.sequencial || t.id.substring(0, 4)}`,
        realId: t.id,
        titulo: t.assunto || "Sem assunto",
        abertura: new Date(t.data_abertura).toLocaleString('pt-BR'),
        sla: (t.status !== 'RESOLVIDO' && (new Date().getTime() - new Date(t.data_abertura).getTime()) / (1000 * 60 * 60) > 24) ? "VENCIDO" : "OK",
        tempoAberto: t.status === 'RESOLVIDO' ? 'RESOLVIDO' : calcularTempoAberto(t.data_abertura)
      })));
    }

    // Usuários
    const { data: userData } = await supabase.from('usuarios').select('id, nome, cargo, telefone');
    setUsuarios(userData || []);

    // Unidades (Rotas)
    const { data: unitData } = await supabase.from('unidades').select('*');
    setUnidades(unitData || []);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 60000); // Auto-refresh a cada 1 min
    return () => clearInterval(timer);
  }, []);

  const calcularTempoAberto = (dataIso: string) => {
    const inicio = new Date(dataIso);
    const agora = new Date();
    const diffMs = agora.getTime() - inicio.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 24) {
      const dias = Math.floor(diffHrs / 24);
      return `${dias}d ${diffHrs % 24}h`;
    }
    return `${diffHrs}h ${diffMin}m`;
  };

  const handleToggleSetor = (id: string) => {
    setNovaOcorrencia(prev => ({
      ...prev,
      setores: prev.setores.includes(id) 
        ? prev.setores.filter(r => r !== id)
        : [...prev.setores, id]
    }));
  };

  const handleSalvarOcorrencia = async () => {
    if (!novaOcorrencia.assunto || !novaOcorrencia.setor_destino) {
      alert("Informe o assunto e o setor responsável.");
      return;
    }

    setLoading(true);
    
    const unidadeObj = unidades.find(u => u.id === novaOcorrencia.unidade_id);
    
    const ticketInsert = {
      assunto: novaOcorrencia.assunto,
      unidade: unidadeObj?.nome || "Geral",
      prioridade: novaOcorrencia.prioridade,
      descricao: novaOcorrencia.descricao,
      setor_destino: novaOcorrencia.setor_destino,
      responsavel_citado: novaOcorrencia.responsavel_citado,
      atribuido_a: novaOcorrencia.setor_destino + (novaOcorrencia.responsavel_citado ? ` (${novaOcorrencia.responsavel_citado})` : ""),
      status: 'PENDENTE',
      criado_por: user?.nome || "Usuário Portal"
    };

    const { data: inserted, error } = await supabase.from('tickets_sla').insert([ticketInsert]).select();

    if (!error && inserted) {
      try {
        await n8n.trigger('notificacao-ocorrencia', {
          tipo: 'NOVA_OCORRENCIA_SETORIAL',
          ticket_id: inserted[0].id,
          setor: novaOcorrencia.setor_destino,
          assunto: novaOcorrencia.assunto,
          solicitante: user?.nome
        });
      } catch (n8nError) {
        console.warn("Falha n8n");
      }

      setModalNova(false);
      setNovaOcorrencia({ assunto: "", unidade_id: "", prioridade: "NORMAL", descricao: "", setor_destino: "OPERACIONAL", responsavel_citado: "" });
      loadData();
      alert("Ocorrência aberta e direcionada ao setor com sucesso!");
    } else {
      alert("Erro ao salvar: " + error.message);
    }
    setLoading(false);
  };

  const handleFinalizarResolucao = async () => {
    if (!solucaoTexto) return alert("Por favor, explique a solução para registro.");
    
    setLoading(true);
    const { error } = await supabase
      .from('tickets_sla')
      .update({ 
        status: 'RESOLVIDO',
        justificativa_solucao: solucaoTexto,
        data_fechamento: new Date().toISOString()
      })
      .eq('id', ticketSelecionado.realId);

    if (!error) {
      try {
        await n8n.trigger('notificacao-ocorrencia', {
          tipo: 'OCORRENCIA_FINALIZADA',
          ticket_id: ticketSelecionado.id,
          solicitante: ticketSelecionado.criado_por,
          justificativa: solucaoTexto
        });
      } catch (e) { console.warn("n8n off"); }

      // Registrar no histórico de gestão para auditoria
      await supabase.from('historico_gestao').insert([{
         executor_tel: user?.telefone || 'SISTEMA',
         tipo_acao: 'RESOLUCAO_OCORRENCIA',
         motivo: `Ticket ${ticketSelecionado.id} resolvido: ${solucaoTexto}`,
         para: JSON.stringify({ ticket_id: ticketSelecionado.realId, status: 'RESOLVIDO' })
      }]);

      setModalResolucao(false);
      setTicketSelecionado(null);
      setSolucaoTexto("");
      loadData();
      alert("✅ Ocorrência resolvida e registrada no log com sucesso.");
    } else {
      alert("Erro ao salvar resolução: " + error.message);
    }
    setLoading(false);
  };

  const slaVencidosCount = tickets.filter(t => t.sla === "VENCIDO").length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in" style={{ minHeight: "100%", paddingBottom: "5rem" }}>
      {/* Upper Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand)]/5 rounded-full blur-[80px] -mr-48 -mt-48 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
              <AlertOctagon size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Intelligence Ops: Central de Ocorrências</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Activity size={12} className="text-[var(--brand)]" /> {tickets.length} monitorados
                </span>
                <span className="text-[var(--border-light)]">•</span>
                {slaVencidosCount > 0 ? (
                  <span className="text-red-500 text-[0.7rem] font-black uppercase flex items-center gap-1.5 animate-pulse">
                    <Clock size={12} /> {slaVencidosCount} Incidentes fora do SLA
                  </span>
                ) : (
                  <span className="text-green-500 text-[0.7rem] font-black uppercase flex items-center gap-1.5">
                    <CheckCircle size={12} /> Operação em conformidade
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto relative z-10">
          <div className="flex-1 lg:w-64 relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand)] transition-colors" />
            <input 
              className="input-field w-full pl-11 !bg-[var(--bg-base)] border-transparent focus:border-[var(--brand)]/30" 
              placeholder="Localizar evento..." 
            />
          </div>

          <button className="btn-brand !h-12 px-6 shadow-lg shadow-[var(--brand)]/20" onClick={() => setModalNova(true)}>
            <Plus size={18} strokeWidth={3} /> Nova Ocorrência
          </button>
        </div>
      </div>

      {/* Modal Nova Ocorrência Arrastável */}
      <AdaptiveModal 
        title="Lançar Novo Evento Operacional" 
        isOpen={modalNova} 
        onClose={() => setModalNova(false)}
        width="550px"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest bg-[var(--bg-base)] p-2 rounded-lg">
            Sincronismo: Notificações WhatsApp Externas Ativas
          </p>
          
          <div>
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">Assunto / Título</label>
            <input className="input-field" placeholder="Ex: Falta de material na unidade..." value={novaOcorrencia.assunto} onChange={e => setNovaOcorrencia({...novaOcorrencia, assunto: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">Unidade / Rota</label>
              <select className="input-field" value={novaOcorrencia.unidade_id} onChange={e => setNovaOcorrencia({...novaOcorrencia, unidade_id: e.target.value})}>
                <option value="">Selecione...</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">Gravidade</label>
              <select className="input-field" value={novaOcorrencia.prioridade} onChange={e => setNovaOcorrencia({...novaOcorrencia, prioridade: e.target.value})}>
                <option value="BAIXA">BAIXA</option>
                <option value="NORMAL">NORMAL</option>
                <option value="ALTA">ALTA</option>
                <option value="CRITICA">CRÍTICA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">Setor Destino</label>
              <select className="input-field" value={novaOcorrencia.setor_destino} onChange={e => setNovaOcorrencia({...novaOcorrencia, setor_destino: e.target.value})}>
                <option value="OPERACIONAL">Operacional</option>
                <option value="RH">Recursos Humanos (RH)</option>
                <option value="TI">TI / Sistemas</option>
                <option value="ALMOXARIFADO">Almoxarifado</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="DIRETORIA">Diretoria</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">Responsável Citado (Se houver)</label>
              <input className="input-field" placeholder="Nome do colaborador..." value={novaOcorrencia.responsavel_citado} onChange={e => setNovaOcorrencia({...novaOcorrencia, responsavel_citado: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">Detalhamento da Ocorrência</label>
            <textarea className="input-field min-h-[100px]" placeholder="Descreva o que precisa ser feito..." value={novaOcorrencia.descricao} onChange={e => setNovaOcorrencia({...novaOcorrencia, descricao: e.target.value})} />
          </div>

          <div className="flex gap-3 mt-2">
            <button className="btn-ghost flex-1" onClick={() => setModalNova(false)}>Cancelar</button>
            <button className="btn-brand flex-1 py-4" onClick={handleSalvarOcorrencia} disabled={loading}>
              {loading ? <Loader className="animate-spin inline mr-2" size={16} /> : <MessageCircle className="inline mr-2" size={16} />}
              Lançar e Notificar Campo
            </button>
          </div>
        </div>
      </AdaptiveModal>

      {/* Modal Detalhes Arrastável */}
      <AdaptiveModal 
        title={`Detalhamento: Ocorrência ${ticketSelecionado?.id}`} 
        isOpen={!!ticketSelecionado} 
        onClose={() => setTicketSelecionado(null)}
        width="600px"
      >
        {ticketSelecionado && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <div 
                className="px-3 py-1 rounded-lg text-[0.65rem] font-black uppercase tracking-widest"
                style={{ 
                  background: priorStyles[ticketSelecionado.prioridade].bg,
                  color: priorStyles[ticketSelecionado.prioridade].text,
                  border: `1px solid ${priorStyles[ticketSelecionado.prioridade].border}`
                }}
              >
                {ticketSelecionado.prioridade}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-xs">
                <Clock size={14} /> {ticketSelecionado.abertura}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-[var(--text-primary)] leading-tight mb-4">{ticketSelecionado.titulo}</h2>
              <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] text-[0.9rem] text-[var(--text-secondary)] leading-relaxed shadow-inner">
                {ticketSelecionado.descricao || "Nenhuma descrição adicional fornecida."}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-white/50">
                <label className="label-sm">Localização</label>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                  <MapPin size={16} className="text-[var(--brand)]" /> {ticketSelecionado.unidade}
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-white/50">
                <label className="label-sm">Encarregado / Setor</label>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                  <User size={16} className="text-[var(--brand)]" /> {ticketSelecionado.atribuido_a}
                </div>
              </div>
            </div>

            {ticketSelecionado.status === 'RESOLVIDO' && ticketSelecionado.justificativa_solucao && (
               <div className="mt-4">
                  <label className="text-[10px] font-black text-green-600 uppercase mb-2 block tracking-widest">Solução Justificada</label>
                  <div className="p-5 bg-green-50 rounded-2xl border border-green-100 text-sm font-bold text-green-900 leading-relaxed">
                     {ticketSelecionado.justificativa_solucao}
                     <div className="mt-3 text-[10px] opacity-60">Resolvido em: {new Date(ticketSelecionado.data_fechamento).toLocaleString()}</div>
                  </div>
               </div>
            )}

            {ticketSelecionado.status !== 'RESOLVIDO' && (
              <div className="mt-4 flex gap-4">
                <button className="flex-1 btn-ghost" onClick={() => setTicketSelecionado(null)}>Voltar</button>
                <button 
                  className="flex-[2] btn-brand !bg-green-600 hover:!bg-green-700 shadow-lg shadow-green-600/20 !h-14 font-black uppercase tracking-wider"
                  onClick={() => setModalResolucao(true)}
                >
                  Confirmar Resolução <CheckCircle className="ml-2" size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </AdaptiveModal>

      {/* Modal de Explicação da Solução */}
      <AdaptiveModal
        title="Relatório de Resolução"
        isOpen={modalResolucao}
        onClose={() => setModalResolucao(false)}
        width="500px"
      >
         <div className="flex flex-col gap-6">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
               <Activity size={20} className="text-blue-600 shrink-0" />
               <p className="text-[10px] font-bold text-blue-800 uppercase leading-tight">Para encerrar este evento, descreva as ações tomadas. Isso gera um registro permanente de auditoria.</p>
            </div>

            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Descrição da Solução *</label>
               <textarea 
                  className="input-field !h-40 p-4 font-bold text-sm leading-relaxed" 
                  placeholder="Explique detalhadamente o que foi feito..."
                  value={solucaoTexto}
                  onChange={e => setSolucaoTexto(e.target.value)}
               />
            </div>

            <div className="flex gap-4">
               <button className="flex-1 btn-ghost" onClick={() => setModalResolucao(false)}>Cancelar</button>
               <button className="flex-[2] btn-brand !bg-green-600" onClick={handleFinalizarResolucao}>Salvar e Finalizar</button>
            </div>
         </div>
      </AdaptiveModal>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-40 text-[var(--text-muted)] gap-4">
          <Loader className="animate-spin text-[var(--brand)]" size={40} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Sincronizando Base de Dados...</span>
        </div>
      ) : (
        <div className="card overflow-hidden !rounded-[2rem] border-[var(--border)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[var(--text-primary)] text-[11px] font-black uppercase tracking-widest">
                  <th className="p-6">Identificador</th>
                  <th className="p-6">Título do Evento</th>
                  <th className="p-6">Urgência</th>
                  <th className="p-6">Atribuição</th>
                  <th className="p-6">Unidade</th>
                  <th className="p-6">Tempo Aberto</th>
                  <th className="p-6">Monitoramento</th>
                  <th className="p-6">Status Operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {tickets.map(t => (
                  <tr 
                    key={t.id} 
                    className="hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer group"
                    onClick={() => setTicketSelecionado(t)}
                  >
                    <td className="p-6 text-[10px] font-black text-[var(--text-muted)] font-mono">{t.id}</td>
                    <td className="p-6">
                      <div className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{t.titulo}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">{t.descricao?.substring(0, 40)}...</div>
                    </td>
                    <td className="p-6">
                      <span 
                        className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider"
                        style={{ 
                          background: priorStyles[t.prioridade].bg,
                          color: priorStyles[t.prioridade].text,
                          border: `1px solid ${priorStyles[t.prioridade].border}`
                        }}
                      >
                        {t.prioridade}
                      </span>
                    </td>
                    <td className="p-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-[var(--text-primary)]">{t.atribuido_a?.split(',')[0]}</span>
                          <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Responsável</span>
                       </div>
                    </td>
                    <td className="p-6 text-xs font-bold text-[var(--text-secondary)]">{t.unidade}</td>
                    <td className="p-6">
                       <div className="flex items-center gap-2">
                          <Clock size={12} className={t.status === 'RESOLVIDO' ? 'text-green-500' : 'text-orange-500'} />
                          <span className={`text-[10px] font-black ${t.status === 'RESOLVIDO' ? 'text-green-600' : 'text-orange-600'}`}>{t.tempoAberto}</span>
                       </div>
                    </td>
                    <td className="p-6 text-[10px] font-black text-[var(--text-muted)] uppercase">{t.abertura}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${t.status === "RESOLVIDO" ? "bg-green-100 text-green-700" : t.status === "EM_ANDAMENTO" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
