"use client";
import { useState, useEffect } from "react";
import { 
  Map, Users, AlertTriangle, Plus, CheckCircle, 
  Car, Clock, ArrowRightLeft, Printer, 
  ShieldAlert, FileText, Loader2, Search
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import QuickActions from "../components/QuickActions";
import ColaboradoresSharedTable from "../components/ColaboradoresSharedTable";

export default function RotaPage() {
  const [loading, setLoading] = useState(true);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  
  const [rotaSelecionada, setRotaSelecionada] = useState<number>(1);
  const [busca, setBusca] = useState("");
  
  const [modalVolante, setModalVolante] = useState(false);
  const [modalTransfer, setModalTransfer] = useState(false);
  const [modalAtestado, setModalAtestado] = useState(false);
  const [modalAdvertencia, setModalAdvertencia] = useState(false);
  const [modalPonto, setModalPonto] = useState(false);
  
  const [transferData, setTransferData] = useState({ colaborador: "", destino: "", motivo: "" });
  const [dadosAtestado, setDadosAtestado] = useState({ colaborador: "", tipo: "FALTA", motivo: "", data: "" });
  const [dadosAdvertencia, setDadosAdvertencia] = useState({ colaborador: "", motivo: "", gravidade: "LEVE" });

  // Missões Semanais (Simulação)
  const missoes = [
    { id: 1, titulo: "Auditoria de Fardamento", status: "PENDENTE", prioridade: "ALTA" },
    { id: 2, titulo: "Verificar Validade Extintores", status: "CONCLUIDO", prioridade: "NORMAL" },
    { id: 3, titulo: "Recolher Assinaturas de Ficha EPI", status: "EM ANDAMENTO", prioridade: "URGENTE" }
  ];

  // Mapeamento de Supervisores por Rota (Pode ser dinâmico no futuro)
  const supervisores = [
    { id: 1, nome: "Ricardo", label: "Ricardo (Rota 1)" },
    { id: 2, nome: "Marcos", label: "Marcos (Rota 2)" },
    { id: 3, nome: "Felipe", label: "Felipe (Rota 3)" },
    { id: 4, nome: "Sandra", label: "Sandra (Rota 4)" },
    { id: 5, nome: "Julio", label: "Julio (Rota 5)" }
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Carregar Unidades
      const { data: unidadesData } = await supabase.from('unidades').select('*');
      setUnidades(unidadesData || []);

      // 2. Carregar Usuários (Colaboradores)
      const { data: usuariosData } = await supabase.from('usuarios').select('*');
      setColaboradores(usuariosData || []);

      // 3. Carregar Tickets
      const { data: ticketsData } = await supabase.from('tickets_sla').select('*').limit(50);
      setTickets(ticketsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados da rota:", error);
    }
    setLoading(false);
  }

  // Filtragem Lógica: Uma unidade pertence à rota se o encarregado_nome for o supervisor da rota
  const supervisorAtual = supervisores.find(s => s.id === rotaSelecionada)?.nome;
  
  const unidadesNaRota = unidades.filter(u => 
    (u.encarregado_nome || "").toLowerCase().includes((supervisorAtual || "").toLowerCase())
  );

  const unidadesIdsNaRota = unidadesNaRota.map(u => u.nome); // Usando nome para vincular por enquanto

  const equipeNaRota = colaboradores.filter(c => 
    (unidadesIdsNaRota || []).includes(c.unidade_alocacao) &&
    (busca === "" || 
     (c.nome || "").toLowerCase().includes((busca || "").toLowerCase()) || 
     (c.cargo || "").toLowerCase().includes((busca || "").toLowerCase()))
  );

  const contagemFuncoes = equipeNaRota.reduce((acc: any, cur: any) => {
    acc[cur.cargo] = (acc[cur.cargo] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="animate-spin text-[var(--brand)]" size={40} />
        <p className="text-[var(--text-muted)] font-bold">Sincronizando inteligência de rota...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "calc(100vh - 120px)" }}>
      {/* Command Center: Ações Rápidas */}
      <div className="no-print">
        <QuickActions user={{ role: 'ENCARREGADO', nivel: 3 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem", flex: 1, overflow: "hidden" }} className="no-print">
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
      {/* Route Selector - Top Bar */}
      <div className="no-print flex gap-2 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] overflow-x-auto">
        {supervisores.map(s => (
          <button 
            key={s.id}
            onClick={() => setRotaSelecionada(s.id)}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-[11px] font-black transition-all uppercase tracking-wider ${rotaSelecionada === s.id ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
          >
            ROTA {s.id}: {s.nome}
          </button>
        ))}
      </div>

      {/* Control Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-3">
            <Map className="text-[var(--brand)]" /> {supervisores.find(s => s.id === rotaSelecionada)?.label}
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium mt-1">
            {unidadesNaRota.length} Unidades | {equipeNaRota.length} Colaboradores em Campo
          </p>
        </div>

        <div className="no-print flex flex-wrap gap-2 relative z-10">
          <button className="btn-ghost text-[10px] h-9 px-3" onClick={() => window.print()}>
            <Printer size={14} /> Imprimir Rota
          </button>
          <button className="btn-brand text-[10px] h-9 px-3 !bg-orange-500 shadow-orange-500/20" onClick={() => setModalPonto(true)}>
            <Clock size={14} /> Ocorrência Ponto
          </button>
          <button className="btn-brand text-[10px] h-9 px-3 !bg-red-600 shadow-red-600/20" onClick={() => setModalAdvertencia(true)}>
            <ShieldAlert size={14} /> Advertência
          </button>
          <button className="btn-brand text-[10px] h-9 px-3" onClick={() => setModalTransfer(true)}>
            <ArrowRightLeft size={14} /> Transferir
          </button>
          <button className="btn-brand text-[10px] h-9 px-3" onClick={() => setModalVolante(true)}>
            <Car size={14} /> Volante
          </button>
        </div>
      </div>

      {/* Operational Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* KPIs */}
        {[
          { label: "Unidades", value: unidadesNaRota.length, icon: Map, color: "blue" },
          { label: "Efetivo", value: equipeNaRota.length, icon: Users, color: "green" },
          { label: "Alertas", value: tickets.filter(t => t.status === 'PENDENTE').length, icon: AlertTriangle, color: "amber" },
          { label: "Faltas", value: 0, icon: ShieldAlert, color: "red" },
        ].map((k, i) => (
          <div key={i} className="card p-6 flex items-center gap-5">
            <div className={`p-4 rounded-2xl bg-${k.color}-500/10 text-${k.color}-500`}>
              <k.icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{k.value}</div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MISSÕES SEMANAIS DA GERÊNCIA */}
      <div className="card p-6 bg-[var(--brand)]/5 border-[var(--brand)]/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle size={18} className="text-[var(--brand)]" /> Missões Semanais da Gerência
          </h2>
          <span className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest">Ordem Superior</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {missoes.map(m => (
            <div key={m.id} className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] flex items-center justify-between group hover:border-[var(--brand)] transition-all">
              <div>
                <div className="text-[11px] font-bold text-[var(--text-primary)]">{m.titulo}</div>
                <div className={`text-[9px] font-black uppercase mt-1 ${m.status === 'CONCLUIDO' ? 'text-green-500' : 'text-orange-500'}`}>{m.status}</div>
              </div>
              <div className={`text-[8px] px-2 py-1 rounded-full font-black ${m.prioridade === 'URGENTE' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--brand)]/10 text-[var(--brand)]'}`}>
                {m.prioridade}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main View: Units & Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="card flex flex-col overflow-hidden h-fit">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)]">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Users size={18} className="text-[var(--brand)]" /> Fiscalização de Efetivo e Unidades
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input 
                    placeholder="Filtrar colaboradores..." 
                    className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-[11px] outline-none w-64"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-6">
              {unidadesNaRota.map((unidade) => {
                const membros = equipeNaRota.filter(c => c.unidade_alocacao === unidade.nome);
                return (
                  <div key={unidade.id} className="group border-b border-[var(--border-light)] pb-6 last:border-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <div>
                        <h3 className="font-black text-base text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{unidade.nome}</h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium">Responsável Unidade: {unidade.diretor_nome || "Diretor(a) SEMED"} | Local: {unidade.endereco || "Manaus, AM"}</p>
                      </div>
                      <div className="flex gap-2">
                         <button className="btn-ghost !h-8 !text-[10px]" onClick={() => { setDadosAtestado({...dadosAtestado, motivo: `Falta na unidade ${unidade.nome}`}); setModalAtestado(true); }}>Relatar Falta</button>
                         <span className="badge badge-blue">{membros.length} colaboradores</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {membros.map((m, idx) => (
                        <div key={idx} className="bg-[var(--bg-base)] p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--brand)] transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] font-black text-xs">{m.nome.charAt(0)}</div>
                              <div>
                                <div className="text-[13px] font-black text-[var(--text-primary)]">{m.nome}</div>
                                <div className="text-[10px] text-[var(--brand)] font-bold">{m.cargo}</div>
                              </div>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${m.status === 'ATIVO' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{m.status}</span>
                          </div>
                          
                          <div className="space-y-2 border-t border-[var(--border)] pt-3">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[var(--text-muted)] font-bold uppercase">Telefone:</span>
                              <span className="text-[var(--info)] font-black">{m.telefone || "(92) 99111-0000"}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[var(--text-muted)] font-bold uppercase">Insalubridade:</span>
                              <span className="text-[var(--danger)] font-black">{m.insalubridade || "20%"}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[var(--text-muted)] font-bold uppercase">Horário:</span>
                              <span className="text-[var(--text-primary)] font-black">{m.horario || "07:00 - 16:00"}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <button className="btn-ghost !h-8 !text-[9px]" onClick={() => { setDadosAdvertencia({...dadosAdvertencia, colaborador: m.nome}); setModalAdvertencia(true); }}>Advertir</button>
                            <button className="btn-ghost !h-8 !text-[9px]" onClick={() => setModalTransfer(true)}>Remanejar</button>
                          </div>
                        </div>
                      ))}
                      {membros.length === 0 && (
                        <div className="col-span-full p-8 text-center bg-gray-500/5 rounded-3xl border border-dashed border-[var(--border)]">
                          <p className="text-xs text-[var(--text-muted)] italic font-bold">Nenhum colaborador alocado nesta unidade no momento.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>

        {/* Lado Direito: Efetivo compartilhado pelo RH */}
        <div className="flex flex-col gap-6 overflow-hidden">
           <ColaboradoresSharedTable />
           
           {/* Sidebar: Tickets & Actions */}
           <div className="card p-6">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" /> Ocorrências Recentes
            </h3>
            <div className="space-y-3">
              {tickets.slice(0, 5).map((t, idx) => (
                <div key={idx} className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-[10px]">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-[var(--text-primary)]">{t.assunto}</span>
                    <span className={`badge ${t.status === 'RESOLVIDO' ? 'badge-green' : 'badge-amber'} scale-75 origin-right`}>{t.status}</span>
                  </div>
                  <div className="text-[var(--text-muted)] line-clamp-2">{t.descricao}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE REPORT - COMPACT & PROFESSIONAL */}
      <div id="print-report" className="hidden print:block fixed inset-0 z-[1000] bg-white p-0 m-0 text-black font-sans">
        <div className="p-8">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-xl font-black uppercase">Alicerce Serviços e Gestão LTDA</h1>
              <p className="text-[10px] font-bold">RELATÓRIO OPERACIONAL DE ROTA - DOCUMENTO DE CAMPO</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase">Supervisor: {supervisores.find(s => s.id === rotaSelecionada)?.label}</p>
              <p className="text-[9px]">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Table Header Description */}
          <div className="grid grid-cols-5 gap-2 bg-black text-white px-2 py-1.5 text-[8px] font-black uppercase mb-4">
            <div className="col-span-2">Unidade / Endereço / Diretor</div>
            <div>Colaborador</div>
            <div>Função</div>
            <div>Insal. | Telefone</div>
          </div>

          {/* List Content */}
          <div className="space-y-6">
            {unidadesNaRota.map((unidade) => {
              const membros = equipeNaRota.filter(c => c.unidade_alocacao === unidade.nome);
              return (
                <div key={unidade.id} className="break-inside-avoid border-b border-black/10 pb-4">
                  {/* Unit Info Row */}
                  <div className="grid grid-cols-5 gap-2 mb-2 items-start">
                    <div className="col-span-2">
                      <div className="text-[10px] font-black uppercase">{unidade.nome}</div>
                      <div className="text-[7px] text-gray-600 font-medium">END: {unidade.endereco || 'Manaus - AM'}</div>
                      <div className="text-[7px] font-bold">DIR: {unidade.diretor_nome || '—'} | TEL: {unidade.diretor_tel || '—'}</div>
                    </div>
                    
                    {/* Collaborators for this unit - One line each */}
                    <div className="col-span-3 space-y-1">
                      {membros.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-2 border-l border-black/20 pl-2">
                          <div className="text-[9px] font-bold truncate">{m.nome.toUpperCase()}</div>
                          <div className="text-[8px] font-medium">{m.cargo}</div>
                          <div className="text-[8px] font-medium">{m.insalubridade || "20%"} | {m.telefone}</div>
                        </div>
                      ))}
                      {membros.length === 0 && (
                        <div className="text-[7px] italic text-gray-400 pl-2">Sem colaboradores alocados</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-3 gap-8">
            <div>
              <h4 className="text-[8px] font-black uppercase mb-2">Resumo de Cargos</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(contagemFuncoes).map(([cargo, qtd]: [any, any]) => (
                  <div key={cargo} className="text-[7px] font-bold">{cargo}: <span className="font-black">{qtd}</span></div>
                ))}
              </div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="text-center mt-4">
                <div className="h-10 border-b border-black"></div>
                <p className="text-[7px] font-bold mt-1 uppercase">Assinatura do Supervisor</p>
                <p className="text-[6px] text-gray-500">{supervisores.find(s => s.id === rotaSelecionada)?.nome}</p>
              </div>
              <div className="text-center mt-4">
                <div className="h-10 border-b border-black"></div>
                <p className="text-[7px] font-bold mt-1 uppercase">Coordenação Operacional</p>
                <p className="text-[6px] text-gray-500">Alicerce Serviços</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Style for Print and Transitions */}
      <style>{`
        @media screen {
          #print-report { display: none; }
        }
        @media print {
          @page { size: portrait; margin: 0; }
          body * { visibility: hidden; }
          #print-report, #print-report * { visibility: visible !important; display: block !important; }
          #print-report { 
            position: fixed; 
            left: 0; 
            top: 0; 
            width: 100vw; 
            height: 100vh; 
            background: white !important; 
            overflow: visible !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* MODALS */}
      <AdaptiveModal title="Comunicar Ausência / Falta" isOpen={modalAtestado} onClose={() => setModalAtestado(false)} width="450px">
        <div className="flex flex-col gap-4">
          <select className="input-field w-full" value={dadosAtestado.colaborador} onChange={e => setDadosAtestado({...dadosAtestado, colaborador: e.target.value})}>
            <option value="">Selecione o Colaborador...</option>
            {equipeNaRota.map((c, i) => <option key={i} value={c.nome}>{c.nome}</option>)}
          </select>
          <select className="input-field w-full" value={dadosAtestado.tipo} onChange={e => setDadosAtestado({...dadosAtestado, tipo: e.target.value})}>
            <option value="FALTA">Falta Injustificada</option>
            <option value="ATESTADO">Atestado Médico</option>
          </select>
          <textarea className="input-field w-full" placeholder="Observações da fiscalização..." value={dadosAtestado.motivo} onChange={e => setDadosAtestado({...dadosAtestado, motivo: e.target.value})} />
          <button className="btn-brand w-full" onClick={async () => { 
            const colab = equipeNaRota.find(c => c.nome === dadosAtestado.colaborador);
            if (!colab) return alert("Selecione o colaborador");
            await supabase.from('tickets_sla').insert({
              assunto: `FALTA: ${colab.nome}`,
              descricao: `Unidade: ${colab.unidade_alocacao || "Rota"} | Tipo: ${dadosAtestado.tipo} | Obs: ${dadosAtestado.motivo}`,
              prioridade: 'ALTA', status: 'PENDENTE',
              setor_destino: 'RH Recursos Humanos',
              responsavel_citado: colab.nome,
              criado_por: supervisorAtual || "Supervisor Mobile"
            });
            n8n.trigger('comunicar-ausencia', dadosAtestado);
            setModalAtestado(false); alert("Falta registrada e enviada para o painel do RH!"); 
          }}>Registrar Falta</button>
        </div>
      </AdaptiveModal>

      <AdaptiveModal title="Requisitar Volante (Apoio)" isOpen={modalVolante} onClose={() => setModalVolante(false)} width="400px">
        <div className="flex flex-col gap-4">
          <select className="input-field w-full" id="selVolanteUnd"><option value="">Selecione a Unidade</option>{unidadesNaRota.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}</select>
          <select className="input-field w-full" id="selVolanteUrg"><option value="IMEDIATA">Imediata</option><option value="TURNO_SEGUINTE">Turno Seguinte</option></select>
          <button className="btn-brand w-full" onClick={async () => { 
            const und = (document.getElementById('selVolanteUnd') as HTMLSelectElement).value;
            const urg = (document.getElementById('selVolanteUrg') as HTMLSelectElement).value;
            await supabase.from('tickets_sla').insert({
              assunto: `PEDIDO DE VOLANTE: ${und || "Não informada"}`,
              descricao: `Solicitação de cobertura de posto. Unidade: ${und}. Urgência: ${urg}`,
              prioridade: urg === 'IMEDIATA' ? 'ALTA' : 'NORMAL',
              status: 'PENDENTE', setor_destino: 'Gerência Operacional',
              criado_por: supervisorAtual || "Supervisor Mobile"
            });
            alert("Volante requisitado e salvo na fila da Gerência!"); setModalVolante(false); 
          }}>Confirmar Pedido</button>
        </div>
      </AdaptiveModal>

      <AdaptiveModal title="Pedir Advertência / Punição" isOpen={modalAdvertencia} onClose={() => setModalAdvertencia(false)} width="450px">
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-[10px] text-red-600 font-bold uppercase">Este pedido será auditado pelo RH antes da emissão formal.</div>
          <input className="input-field w-full" value={dadosAdvertencia.colaborador} disabled />
          <select className="input-field w-full" value={dadosAdvertencia.gravidade} onChange={e => setDadosAdvertencia({...dadosAdvertencia, gravidade: e.target.value})}>
            <option value="LEVE">Advertência Verbal (Registrada)</option>
            <option value="MEDIA">Advertência Escrita</option>
            <option value="GRAVE">Suspensão (Sugerida)</option>
          </select>
          <textarea className="input-field w-full" placeholder="Descreva o motivo da punição..." value={dadosAdvertencia.motivo} onChange={e => setDadosAdvertencia({...dadosAdvertencia, motivo: e.target.value})} />
          <button className="btn-brand w-full !bg-red-600" onClick={async () => { 
            const colab = equipeNaRota.find(c => c.nome === dadosAdvertencia.colaborador);
            await supabase.from('tickets_sla').insert({
              assunto: `ADVERTÊNCIA (${dadosAdvertencia.gravidade}): ${dadosAdvertencia.colaborador}`,
              descricao: `Solicitação de Punição Formal. Unidade: ${colab?.unidade_alocacao || "Rota"}. Motivo: ${dadosAdvertencia.motivo}`,
              prioridade: 'NORMAL', status: 'PENDENTE',
              setor_destino: 'RH Recursos Humanos', responsavel_citado: dadosAdvertencia.colaborador,
              criado_por: supervisorAtual || "Supervisor Mobile"
            });
            alert("Pedido de advertência aberto no painel do RH!"); setModalAdvertencia(false); 
          }}>Enviar para o RH</button>
        </div>
      </AdaptiveModal>

      <AdaptiveModal title="Ocorrência de Ponto / Horário" isOpen={modalPonto} onClose={() => setModalPonto(false)} width="450px">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--text-muted)]">Solicite correção de batida de ponto ou ajuste de jornada.</p>
          <select className="input-field w-full" id="selPontoColab"><option value="">Selecione o Colaborador...</option>{equipeNaRota.map((c, i) => <option key={i} value={c.nome}>{c.nome}</option>)}</select>
          <select className="input-field w-full" id="selPontoTipo"><option value="ESQUECEU">Esqueceu de bater</option><option value="AJUSTE">Ajuste de Horário</option><option value="SAIDA_ANTECIPADA">Saída Antecipada Autorizada</option></select>
          <textarea className="input-field w-full" placeholder="Justificativa do Encarregado..." id="txtPontoJust" />
          <button className="btn-brand w-full !bg-orange-500" onClick={async () => { 
            const nome = (document.getElementById('selPontoColab') as HTMLSelectElement).value;
            const tipo = (document.getElementById('selPontoTipo') as HTMLSelectElement).value;
            const just = (document.getElementById('txtPontoJust') as HTMLTextAreaElement).value;
            const colab = equipeNaRota.find(c => c.nome === nome);
            await supabase.from('tickets_sla').insert({
              assunto: `AJUSTE DE PONTO: ${nome}`,
              descricao: `Unidade: ${colab?.unidade_alocacao || "Rota"} | Tipo: ${tipo} | Justificativa: ${just}`,
              prioridade: 'NORMAL', status: 'PENDENTE',
              setor_destino: 'RH Recursos Humanos', responsavel_citado: nome,
              criado_por: supervisorAtual || "Supervisor Mobile"
            });
            alert("Ocorrência de ponto registrada como Ticket de RH!"); setModalPonto(false); 
          }}>Solicitar Solução</button>
        </div>
      </AdaptiveModal>

      <AdaptiveModal title="Remanejamento / Transferência" isOpen={modalTransfer} onClose={() => setModalTransfer(false)} width="450px">
        <div className="flex flex-col gap-4">
          <select className="input-field w-full" id="selTransfColab"><option value="">Colaborador a transferir...</option>{equipeNaRota.map((c, i) => <option key={i} value={c.nome}>{c.nome}</option>)}</select>
          <select className="input-field w-full" id="selTransfDest"><option value="">Nova Unidade Destino...</option>{unidades.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}</select>
          <textarea className="input-field w-full" placeholder="Motivo da transferência..." id="txtTransfMotivo" />
          <button className="btn-brand w-full" onClick={async () => { 
            const nome = (document.getElementById('selTransfColab') as HTMLSelectElement).value;
            const dest = (document.getElementById('selTransfDest') as HTMLSelectElement).value;
            const just = (document.getElementById('txtTransfMotivo') as HTMLTextAreaElement).value;
            const colab = equipeNaRota.find(c => c.nome === nome);
            await supabase.from('tickets_sla').insert({
              assunto: `TRANSFERÊNCIA DE POSTO: ${nome}`,
              descricao: `Origem: ${colab?.unidade_alocacao || "Rota"} | Destino Solicitado: ${dest} | Motivo: ${just}`,
              prioridade: 'NORMAL', status: 'PENDENTE',
              setor_destino: 'RH Recursos Humanos', responsavel_citado: nome,
              criado_por: supervisorAtual || "Supervisor Mobile"
            });
            alert("Transferência aberta como solicitação no portal do RH!"); setModalTransfer(false); 
          }}>Confirmar Remanejamento</button>
        </div>
      </AdaptiveModal>
    </div>

  );
}
