"use client";
import { useState, useEffect } from "react";
import { Plus, Clock, AlertOctagon, CheckCircle, Loader, User, MapPin, MessageCircle, Search, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";

import AdaptiveModal from "@/components/ui/AdaptiveModal";

const cols = [
  { id: "PENDENTE", label: "Pendentes", icon: Clock, cor: "#F59E0B" },
  { id: "EM_ANDAMENTO", label: "Em Andamento", icon: Loader, cor: "#3B82F6" },
  { id: "RESOLVIDO", label: "Resolvidos", icon: CheckCircle, cor: "#10B981" },
];

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
  const [vista, setVista] = useState<"kanban" | "lista">("kanban");
  const [modalNova, setModalNova] = useState(false);
  const [ticketSelecionado, setTicketSelecionado] = useState<any>(null);
  
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    assunto: "",
    unidade_id: "",
    prioridade: "NORMAL",
    descricao: "",
    setores: [] as string[],
    responsavel_id: ""
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
    const { data: ticketData } = await supabase.from('tickets_sla').select('*').order('data_abertura', { ascending: false });
    if (ticketData) {
      setTickets(ticketData.map(t => ({
        ...t,
        id: `#${t.sequencial || t.id.substring(0, 4)}`,
        realId: t.id,
        titulo: t.assunto || "Sem assunto",
        abertura: new Date(t.data_abertura).toLocaleString('pt-BR'),
        sla: (t.status !== 'RESOLVIDO' && (new Date().getTime() - new Date(t.data_abertura).getTime()) / (1000 * 60 * 60) > 24) ? "VENCIDO" : "OK"
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
  }, []);

  const handleToggleSetor = (id: string) => {
    setNovaOcorrencia(prev => ({
      ...prev,
      setores: prev.setores.includes(id) 
        ? prev.setores.filter(r => r !== id)
        : [...prev.setores, id]
    }));
  };

  const handleSalvarOcorrencia = async () => {
    if (!novaOcorrencia.assunto || (novaOcorrencia.setores.length === 0 && !novaOcorrencia.responsavel_id)) {
      alert("Informe o assunto e selecione ao menos um setor ou responsável.");
      return;
    }

    setLoading(true);
    
    const unidadeObj = unidades.find(u => u.id === novaOcorrencia.unidade_id);
    const responsavelObj = usuarios.find(u => u.id === novaOcorrencia.responsavel_id);
    
    // Identificar telefone para notificação WhatsApp
    let telefonesNotificar: string[] = [];
    if (responsavelObj?.telefone) telefonesNotificar.push(responsavelObj.telefone);
    
    if (novaOcorrencia.setores.includes("ENCARREGADOS") && unidadeObj) {
      const encarregadoObj = usuarios.find(u => u.nome === unidadeObj.encarregado_nome);
      if (encarregadoObj?.telefone) telefonesNotificar.push(encarregadoObj.telefone);
    }

    const setoresNomes = novaOcorrencia.setores.map(s => departamentos.find(d => d.id === s)?.label).filter(Boolean);
    const atribuicaoFinal = [...setoresNomes, responsavelObj?.nome].filter(Boolean).join(', ');

    const ticketInsert = {
      assunto: novaOcorrencia.assunto,
      unidade: unidadeObj?.nome || "Geral",
      prioridade: novaOcorrencia.prioridade,
      descricao: novaOcorrencia.descricao,
      atribuido_a: atribuicaoFinal,
      status: 'PENDENTE',
      metadados: {
        telefones_whatsapp: telefonesNotificar,
        unidade_id: novaOcorrencia.unidade_id
      }
    };

    const { data: inserted, error } = await supabase.from('tickets_sla').insert([ticketInsert]).select();

    if (!error && inserted) {
      try {
        if (telefonesNotificar.length > 0) {
          await n8n.trigger('notificacao-ocorrencia', {
            tipo: 'RECEBIDO',
            ticket_id: inserted[0].id,
            assunto: novaOcorrencia.assunto,
            descricao: novaOcorrencia.descricao,
            telefones: telefonesNotificar
          });
        }
      } catch (n8nError) {
        console.error("Falha ao notificar n8n, mas ticket foi criado:", n8nError);
      }

      setModalNova(false);
      loadData(); // Atualiza sem reload
    } else {
      alert("Erro ao salvar: " + error.message);
    }
    setLoading(false);
  };

  const handleResolver = async (ticket: any) => {
    if (!confirm("Confirmar resolução desta ocorrência?")) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('tickets_sla')
      .update({ status: 'RESOLVIDO' })
      .eq('id', ticket.realId);

    if (!error) {
      const telefones = ticket.metadados?.telefones_whatsapp || [];
      if (telefones.length > 0) {
        await n8n.trigger('notificacao-ocorrencia', {
          tipo: 'RESOLVIDO',
          ticket_id: ticket.id,
          assunto: ticket.titulo,
          telefones: telefones
        });
      }
      setTicketSelecionado(null);
      loadData(); // Atualiza sem reload
    } else {
      alert("Erro ao resolver: " + error.message);
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
          
          <div className="flex bg-[var(--bg-base)] p-1 rounded-2xl border border-[var(--border)]">
            <button 
              className={`px-5 py-2 rounded-xl text-[0.7rem] font-black uppercase transition-all ${vista === "kanban" ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)]"}`} 
              onClick={() => setVista("kanban")}
            >
              Kanban
            </button>
            <button 
              className={`px-5 py-2 rounded-xl text-[0.7rem] font-black uppercase transition-all ${vista === "lista" ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)]"}`} 
              onClick={() => setVista("lista")}
            >
              Lista
            </button>
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

          <div>
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2 block">Setores Notificados</label>
            <div className="grid grid-cols-2 gap-2">
              {departamentos.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => handleToggleSetor(dept.id)}
                  className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all ${novaOcorrencia.setores.includes(dept.id) ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-muted)]"}`}
                >
                  {novaOcorrencia.setores.includes(dept.id) ? "✓ " : ""}{dept.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">Responsável Direto</label>
            <select className="input-field" value={novaOcorrencia.responsavel_id} onChange={e => setNovaOcorrencia({...novaOcorrencia, responsavel_id: e.target.value})}>
              <option value="">Nenhum específico</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>)}
            </select>
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

            {ticketSelecionado.status !== 'RESOLVIDO' && (
              <div className="mt-4 flex gap-4">
                <button className="flex-1 btn-ghost" onClick={() => setTicketSelecionado(null)}>Voltar</button>
                <button 
                  className="flex-[2] btn-brand !bg-green-600 hover:!bg-green-700 shadow-lg shadow-green-600/20 !h-14 font-black uppercase tracking-wider"
                  onClick={() => handleResolver(ticketSelecionado)}
                >
                  Confirmar Resolução <CheckCircle className="ml-2" size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </AdaptiveModal>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-40 text-[var(--text-muted)] gap-4">
          <Loader className="animate-spin text-[var(--brand)]" size={40} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Sincronizando Base de Dados...</span>
        </div>
      ) : vista === "kanban" ? (
        <div className="flex gap-8 overflow-x-auto pb-8 snap-x">
          {cols.map(col => {
            const colTickets = tickets.filter(t => t.status === col.id);
            const Icon = col.icon;
            return (
              <div key={col.id} className="flex-shrink-0 w-[380px] bg-[var(--bg-card)]/40 rounded-[2.5rem] border border-[var(--border)] p-6 snap-start backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${col.cor}15`, color: col.cor }}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-sm text-[var(--text-primary)] uppercase tracking-tight">{col.label}</span>
                  </div>
                  <span className="bg-white/50 text-[var(--text-primary)] text-[11px] font-black px-3 py-1 rounded-full border border-[var(--border)] shadow-sm">
                    {colTickets.length}
                  </span>
                </div>

                <div className="flex flex-col gap-5">
                  {colTickets.map(t => (
                    <div 
                      key={t.id} 
                      className="group relative bg-white rounded-[1.75rem] border border-[var(--border)] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--brand)]/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
                      onClick={() => setTicketSelecionado(t)}
                    >
                      {/* Priority Strip */}
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: priorStyles[t.prioridade].text }}></div>

                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-tighter opacity-50">{t.id}</span>
                        <div 
                          className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider"
                          style={{ 
                            background: priorStyles[t.prioridade].bg,
                            color: priorStyles[t.prioridade].text,
                            border: `1px solid ${priorStyles[t.prioridade].border}`
                          }}
                        >
                          {t.prioridade}
                        </div>
                      </div>

                      <h4 className="text-[0.95rem] font-black text-[var(--text-primary)] leading-[1.3] mb-4 group-hover:text-[var(--brand)] transition-colors line-clamp-2">
                        {t.titulo}
                      </h4>

                      <div className="flex flex-col gap-2.5 mb-5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
                          <MapPin size={12} className="text-[var(--brand)]" /> {t.unidade}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
                          <User size={12} className="text-[var(--brand)]" /> <span className="truncate">{t.atribuido_a}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-[var(--bg-base)]">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--text-muted)] uppercase">
                          <Clock size={12} /> {t.abertura.split(',')[0]}
                        </div>
                        {t.sla === "VENCIDO" && (
                          <div className="px-2 py-0.5 rounded-md bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-100">
                            SLA Expirado
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {colTickets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[var(--border)] rounded-[2rem] opacity-30">
                      <CheckCircle size={32} />
                      <span className="text-[10px] font-bold uppercase mt-4">Nenhum Registro</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
                    <td className="p-6 text-xs font-bold text-[var(--text-secondary)]">{t.atribuido_a}</td>
                    <td className="p-6 text-xs font-bold text-[var(--text-secondary)]">{t.unidade}</td>
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
