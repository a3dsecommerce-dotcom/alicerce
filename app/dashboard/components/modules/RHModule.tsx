"use client";
import { useState, useEffect } from "react";
import { 
  Search, Plus, User, FileText, Package, ShieldCheck, 
  Loader, MoreVertical, MapPin, Calendar, ChevronRight, 
  Users, Activity, ShieldAlert, Clock, AlertTriangle, 
  Send, History, MessageSquare, Briefcase, DollarSign,
  FileSpreadsheet, UserPlus, CheckCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import FichaColaborador360 from "../FichaColaborador360";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import TicketHub from "../TicketHub";
import ColaboradoresSharedTable from "../ColaboradoresSharedTable";

type MasterTab = "DP" | "PONTO" | "DOCS" | "BENEFICIOS";

export default function RHModule({ user, isDirectorView = false }: { user: any, isDirectorView?: boolean }) {
  const [masterTab, setMasterTab] = useState<MasterTab>("DP");
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DP
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [dpAba, setDpAba] = useState<"ativos" | "talentos" | "vagas">("ativos");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [selecionado, setSelecionado] = useState<any>(null);
  const [showAdmitir, setShowAdmitir] = useState(false);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [vagas, setVagas] = useState<any[]>([
    { id: '1', unidade: 'SEMED', cargo: 'ASG', quantidade: 5, status: 'ABERTA' },
    { id: '2', unidade: 'SEMSA', cargo: 'Porteiro', quantidade: 2, status: 'ABERTA' }
  ]);

  // ESTADOS PONTO
  const [ajustesPonto, setAjustesPonto] = useState<any[]>([]);
  const [modalBulkPonto, setModalBulkPonto] = useState(false);
  const [listaNomesPonto, setListaNomesPonto] = useState("");

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch DP Data
      const { data: users } = await supabase.from('usuarios').select('*').order('nome');
      if (users) {
        setColaboradores(users.map(u => ({
          id: u.id,
          nome: u.nome || "Sem Nome",
          cargo: u.cargo || "Não definido",
          unidade: u.unidade_alocacao || "Não alocado",
          status: u.status || "INATIVO",
          avatar: (u.nome || "??").substring(0, 2).toUpperCase(),
          cpf: u.cpf || "---",
          telefone: u.telefone || "---",
          admissao: u.data_admissao || "---"
        })));
      }

      const { data: talentos } = await supabase.from('candidatos').select('*').order('created_at', { ascending: false });
      if (talentos) setCandidatos(talentos);

      // 2. Fetch Ponto Data
      const { data: pontos } = await supabase.from('ajustes_ponto')
        .select('*, usuarios(id, nome, telefone, cargo, unidade_alocacao)')
        .order('created_at', { ascending: false });
      if (pontos) setAjustesPonto(pontos);

      setLoading(false);
    }
    fetchData();
  }, []);

  // FILTROS DP
  const filtradosDP = colaboradores.filter(c =>
    (filtro === "TODOS" || c.status === filtro) &&
    (
      (c.nome || "").toLowerCase().includes((busca || "").toLowerCase()) || 
      (c.cargo || "").toLowerCase().includes((busca || "").toLowerCase()) || 
      (c.unidade || "").toLowerCase().includes((busca || "").toLowerCase())
    )
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      
      {/* 1. MASTER HEADER & NAVIGATION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">RH Master & Gestão Administrativa</h2>
          <div className="flex flex-wrap gap-8 mt-6 border-b border-[var(--border)] pb-4">
            {[
              { id: "DP", label: "Dep. Pessoal (DP)", icon: Briefcase },
              { id: "PONTO", label: "Controle de Pontos", icon: Clock },
              { id: "DOCS", label: "Documentos", icon: FileText },
              { id: "BENEFICIOS", label: "Benefícios", icon: DollarSign }
            ].map((t: any) => (
              <button 
                key={t.id}
                onClick={() => setMasterTab(t.id)} 
                className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] pb-3 transition-all relative ${masterTab === t.id ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <t.icon size={16} />
                {t.label}
                {masterTab === t.id && <div className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-[var(--brand)] rounded-full" />}
              </button>
            ))}
          </div>
        </div>
        
        {/* BOTÕES DE AÇÃO GLOBAL CONTEXTUAIS */}
        <div className="flex gap-4">
           {masterTab === "DP" && (
             <button className="h-14 px-10 bg-[var(--brand)] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[var(--brand)]/30 flex items-center gap-3" onClick={() => setShowAdmitir(true)}>
               <Plus size={20} /> Admitir Direto
             </button>
           )}
           {masterTab === "PONTO" && (
             <div className="flex gap-4">
                <button className="h-14 px-8 border-2 border-orange-500 text-orange-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center gap-3" onClick={() => alert("Encarregados notificados!")}>
                   <AlertTriangle size={18} /> Notificar Encarregados
                </button>
                <button className="h-14 px-8 bg-[var(--brand)] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[var(--brand)]/30 flex items-center gap-3" onClick={() => setModalBulkPonto(true)}>
                   <UserPlus size={18} /> Lançar em Massa
                </button>
             </div>
           )}
        </div>
      </div>

      {/* 2. CONTEÚDO DINÂMICO POR ABA MASTER */}
      <div className="flex-1 overflow-hidden flex flex-col gap-8">
        
        {/* VIEW: DP (DEPARTAMENTO PESSOAL) */}
        {masterTab === "DP" && (
          <div className="flex flex-col gap-8 flex-1 overflow-hidden animate-fade-in">
             {/* SUB-ABAS DP */}
             <div className="flex gap-10 bg-[var(--bg-base)]/50 p-2 rounded-2xl w-fit border border-[var(--border)]">
                {[
                  { id: "ativos", label: "Colaboradores Ativos", count: colaboradores.length },
                  { id: "talentos", label: "Banco de Talentos", count: candidatos.length },
                  { id: "vagas", label: "Quadro de Vagas", count: 5 }
                ].map((t: any) => (
                  <button 
                    key={t.id}
                    onClick={() => setDpAba(t.id)} 
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dpAba === t.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  >
                    {t.label} ({t.count})
                  </button>
                ))}
             </div>

             <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] shadow-2xl flex-1 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="relative flex-1 w-full max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <input className="input-field w-full pl-12" placeholder="Buscar no DP..." value={busca} onChange={e => setBusca(e.target.value)} />
                   </div>
                   <div className="flex gap-2 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                      {["TODOS", "ATIVO", "INATIVO"].map(f => (
                        <button key={f} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filtro === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)]'}`} onClick={() => setFiltro(f)}>{f}</button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-8">
                   {dpAba === "ativos" ? (
                     <table className="w-full text-left">
                        <thead className="border-b border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                           <tr>
                              <th className="p-6">Colaborador</th>
                              <th className="p-6">Cargo / Unidade</th>
                              <th className="p-6 text-center">CPF / Telefone</th>
                              <th className="p-6 text-center">Status</th>
                              <th className="p-6 text-right">Ações</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                           {filtradosDP.map(c => (
                             <tr key={c.id} className="hover:bg-[var(--bg-base)]/50 transition-colors group cursor-pointer" onClick={() => setSelecionado(c)}>
                                <td className="p-6">
                                   <div className="flex items-center gap-5">
                                      <div className="w-12 h-12 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center text-sm font-black">{c.avatar}</div>
                                      <span className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{c.nome}</span>
                                   </div>
                                </td>
                                <td className="p-6">
                                   <div className="text-xs font-black text-[var(--text-secondary)]">{c.cargo}</div>
                                   <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">{c.unidade}</div>
                                </td>
                                <td className="p-6 text-center">
                                   <div className="text-xs font-bold text-[var(--text-secondary)]">{c.cpf}</div>
                                   <div className="text-[10px] text-[var(--text-muted)]">{c.telefone}</div>
                                </td>
                                <td className="p-6 text-center">
                                   <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
                                </td>
                                <td className="p-6 text-right">
                                   <button className="p-3 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-xl group-hover:text-[var(--brand)] group-hover:bg-white transition-all"><ChevronRight size={18} /></button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                   ) : (
                     <div className="flex flex-col items-center justify-center p-20 opacity-50">
                        <FileText size={48} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">Módulo em Sincronização...</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* VIEW: PONTO (CONTROLE DE PONTOS E BOT) */}
        {masterTab === "PONTO" && (
           <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 flex-1 overflow-hidden animate-fade-in">
              <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">
                 <div className="p-10 border-b border-[var(--border)] bg-[var(--bg-base)]/5 flex justify-between items-center">
                    <h3 className="text-base font-black uppercase tracking-widest flex items-center gap-3"><Clock size={20} className="text-[var(--brand)]" /> Fila de Regularização (WhatsApp Bot)</h3>
                    <div className="flex gap-4">
                       <span className="badge badge-amber px-4 py-2 text-[10px] font-black">12 PENDENTES</span>
                       <span className="badge badge-green px-4 py-2 text-[10px] font-black">45 RESOLVIDOS</span>
                    </div>
                 </div>
                 <div className="flex-1 overflow-auto custom-scrollbar p-6">
                    <table className="w-full text-left">
                       <thead className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]">
                          <tr>
                             <th className="p-6">Colaborador</th>
                             <th className="p-6">Data Ref.</th>
                             <th className="p-6">Motivo</th>
                             <th className="p-6 text-center">Status Bot</th>
                             <th className="p-6 text-right">Ação</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--border)]">
                          {ajustesPonto.map((a, i) => (
                            <tr key={i} className="hover:bg-[var(--bg-base)]/50 transition-colors group">
                               <td className="p-6">
                                  <div className="text-sm font-black text-[var(--brand)]">{a.usuarios?.nome}</div>
                                  <div className="text-[10px] font-bold text-[var(--text-muted)]">{a.usuarios?.unidade_alocacao}</div>
                               </td>
                               <td className="p-6 text-xs font-bold">{a.data_referencia}</td>
                               <td className="p-6 text-xs text-[var(--text-secondary)]">{a.motivo || "Ajuste pendente"}</td>
                               <td className="p-6 text-center">
                                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black ${a.resolvido ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                     {a.resolvido ? 'RESOLVIDO ✓' : 'COBRANDO...'}
                                  </span>
                               </td>
                               <td className="p-6 text-right">
                                  {!a.resolvido && <button className="px-4 py-2 bg-[var(--bg-base)] text-[var(--brand)] rounded-xl text-[10px] font-black uppercase hover:bg-[var(--brand)] hover:text-white transition-all flex items-center gap-2 ml-auto"><Send size={12} /> Re-cobrar</button>}
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="flex flex-col gap-8">
                 <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-10 rounded-[2.5rem] border border-green-500/20 shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]" />
                       <h4 className="text-sm font-black uppercase tracking-widest text-green-700">Status do Agente (Bot)</h4>
                    </div>
                    <p className="text-xs font-medium text-green-800/80 leading-relaxed">
                       O Agente de Ponto está **Online**. Cobranças automáticas agendadas para **08:00, 14:00 e 18:00**.
                    </p>
                 </div>

                 <div className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-xl flex-1 flex flex-col">
                    <h3 className="text-sm font-black uppercase mb-10 flex items-center gap-3"><MessageSquare size={18} className="text-[var(--brand)]" /> Live Feed (WhatsApp)</h3>
                    <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
                       {ajustesPonto.slice(0, 5).map((a, i) => (
                         <div key={i} className="p-5 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)]/50">
                            <p className="text-[10px] font-black text-[var(--brand)] mb-1 uppercase">{a.usuarios?.nome}</p>
                            <p className="text-[11px] font-medium text-[var(--text-secondary)]">{a.resolvido ? "Confirmou ajuste no Marponto ✓" : "Recebeu notificação de pendência via Bot."}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* VIEW: DOCS & BENEFICIOS (PLACEHOLDERS PREMIUM) */}
        {(masterTab === "DOCS" || masterTab === "BENEFICIOS") && (
           <div className="flex flex-col items-center justify-center flex-1 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-xl border-dashed border-[var(--brand)]/20 animate-fade-in">
              <div className="w-24 h-24 bg-[var(--brand)]/5 rounded-full flex items-center justify-center mb-8">
                 {masterTab === "DOCS" ? <FileText size={48} className="text-[var(--brand)] opacity-40" /> : <DollarSign size={48} className="text-[var(--brand)] opacity-40" />}
              </div>
              <h3 className="text-xl font-black italic mb-2">Central de {masterTab === "DOCS" ? "Documentos" : "Benefícios"}</h3>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Sincronizando com a base de dados administrativa...</p>
           </div>
        )}

      </div>

      <FichaColaborador360 colabId={selecionado?.id} isOpen={!!selecionado} onClose={() => setSelecionado(null)} canEdit={true} />
      
      {/* MODAL ADMITIR MASTER (RESTAURADO) */}
      <AdaptiveModal title="Admissão Master Centralizada" isOpen={showAdmitir} onClose={() => setShowAdmitir(false)} width="1100px">
         <div className="p-10 flex flex-col gap-10">
            <div className="bg-[var(--brand)]/5 p-6 rounded-2xl border border-[var(--brand)]/20 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <ShieldCheck size={32} className="text-[var(--brand)]" />
                  <div>
                     <h4 className="text-sm font-black uppercase text-[var(--brand)]">Esteira de Admissão Digital</h4>
                     <p className="text-[10px] font-bold text-[var(--text-muted)]">O cadastro alimenta automaticamente o DP, Almoxarifado e Sistema de Ponto.</p>
                  </div>
               </div>
            </div>
            {/* ... Resto do Form Master simplificado para visualização ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Nome Completo</label>
                  <input className="input-field w-full h-14" placeholder="Nome Completo do Colaborador" />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">CPF</label>
                  <input className="input-field w-full h-14" placeholder="000.000.000-00" />
               </div>
            </div>
            <div className="flex gap-4 pt-10 border-t border-[var(--border)]">
               <button className="flex-1 h-16 text-[10px] font-black uppercase text-[var(--text-muted)]" onClick={() => setShowAdmitir(false)}>Cancelar</button>
               <button className="flex-[2] h-16 bg-[var(--brand)] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[var(--brand)]/30">Efetivar Admissão Master</button>
            </div>
         </div>
      </AdaptiveModal>

      {/* MODAL BULK PONTO */}
      {modalBulkPonto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000] p-6 animate-fade-in">
          <div className="bg-[var(--bg-card)] w-full max-w-2xl p-14 rounded-[3rem] border border-[var(--border)] shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4 flex items-center gap-4"><Clock size={28} className="text-[var(--brand)]" /> Lançar Ciclo de Cobrança</h2>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-10">Cole a lista do Marponto abaixo para iniciar as cobranças via Bot.</p>
            <textarea className="input-field w-full min-h-[250px] p-8 text-xs font-mono" placeholder="Ex: João Silva - Falta Saída 22/04..." value={listaNomesPonto} onChange={e => setListaNomesPonto(e.target.value)} />
            <div className="flex gap-6 pt-10 mt-10 border-t border-[var(--border)]">
               <button className="flex-1 h-14 text-[10px] font-black uppercase" onClick={() => setModalBulkPonto(false)}>Cancelar</button>
               <button className="flex-1 h-14 bg-[var(--brand)] text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-[var(--brand)]/30">Disparar Cobrança</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
