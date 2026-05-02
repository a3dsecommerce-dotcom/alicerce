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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type MasterTab = "DP" | "DOCS";

export default function RHModule({ user, isDirectorView = false }: { user: any, isDirectorView?: boolean }) {
  const [masterTab, setMasterTab] = useState<MasterTab>("DP");
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DP
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [dpAba, setDpAba] = useState<"ativos" | "talentos" | "vagas" | "arquivo">("ativos");
  const [modalAfastamento, setModalAfastamento] = useState<any>(null);
  const [afastamentoData, setAfastamentoData] = useState({ motivo: "", tempo: "" });
  const [modalOcorrenciaGeral, setModalOcorrenciaGeral] = useState(false);
  const [modalSuprimentos, setModalSuprimentos] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [selecionado, setSelecionado] = useState<any>(null);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [vagas, setVagas] = useState<any[]>([
    { id: '1', unidade: 'SEMED', cargo: 'ASG', quantidade: 5, status: 'ABERTA' },
    { id: '2', unidade: 'SEMSA', cargo: 'Porteiro', quantidade: 2, status: 'ABERTA' }
  ]);



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



      setLoading(false);
    }
    fetchData();
  }, []);

  // FILTROS DP
  const filtradosDP = colaboradores.filter(c => {
    if (dpAba === "arquivo") return c.status === "DESLIGADO";
    if (dpAba === "ativos") return c.status !== "DESLIGADO";
    return true;
  }).filter(c =>
    (filtro === "TODOS" || c.status === filtro) &&
    (
      (c.nome || "").toLowerCase().includes((busca || "").toLowerCase()) || 
      (c.cargo || "").toLowerCase().includes((busca || "").toLowerCase()) || 
      (c.unidade || "").toLowerCase().includes((busca || "").toLowerCase())
    )
  );

  const handleGerarPDFHistorico = (colab: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Relatório Histórico de Colaborador", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Soberano ERP - Arquivo Morto`, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [['Campo', 'Informação']],
      body: [
        ['Nome', colab.nome],
        ['CPF', colab.cpf],
        ['Cargo', colab.cargo],
        ['Unidade', colab.unidade],
        ['Status', colab.status],
        ['Admissão', colab.admissao],
        ['Data do Relatório', new Date().toLocaleDateString()]
      ],
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] }
    });

    doc.save(`historico_${colab.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'DESLIGADO' && user.nivel < 3) {
      alert("Demissões devem ser autorizadas pela Gerência Operacional.");
      return;
    }

    if (newStatus === 'AFASTADO') {
      setModalAfastamento({ id, status: newStatus });
      return;
    }

    const { error } = await supabase.from('usuarios').update({ status: newStatus }).eq('id', id);
    if (!error) {
      loadData();
      alert(`Status atualizado para ${newStatus}`);
    }
  };

  const loadData = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      
      {/* 1. MASTER HEADER & NAVIGATION */}
      <div className="flex flex-col gap-6">
        <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">RH Master & Gestão Administrativa</h2>
        {user?.role !== 'GERENTE' && (
          <div className="flex flex-wrap gap-8 border-b border-[var(--border)] pb-4">
            {[
              { id: "DP", label: "Dep. Pessoal (DP)", icon: Briefcase },
              { id: "DOCS", label: "Documentos", icon: FileText }
            ].map((t: any) => (
              <button 
                key={t.id}
                onClick={() => setMasterTab(t.id as any)} 
                className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] pb-3 transition-all relative ${masterTab === t.id ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <t.icon size={16} />
                {t.label}
                {masterTab === t.id && <div className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-[var(--brand)] rounded-full" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. CONTEÚDO DINÂMICO POR ABA MASTER */}
      <div className="flex-1 overflow-hidden flex flex-col gap-8">
        
        {/* VIEW: DP (DEPARTAMENTO PESSOAL) */}
        {masterTab === "DP" && (
          <div className="flex flex-col gap-8 flex-1 overflow-hidden animate-fade-in">
             {/* SUB-ABAS DP - INTEGRALIZADAS ABAIXO DO TÍTULO */}
             {user?.role !== 'GERENTE' && (
                 <div className="flex flex-col gap-6">
                     <div className="flex gap-6 bg-[var(--bg-base)]/30 p-1.5 rounded-2xl w-fit border border-[var(--border)]/50">
                        {[
                          { id: "ativos", label: "Colaboradores Ativos", count: colaboradores.filter(c => c.status !== 'DESLIGADO').length },
                          { id: "talentos", label: "Banco de Talentos", count: candidatos.length },
                          { id: "vagas", label: "Quadro de Vagas", count: 5 },
                          { id: "arquivo", label: "Arquivo Morto", count: colaboradores.filter(c => c.status === 'DESLIGADO').length }
                        ].map((t: any) => (
                          <button 
                            key={t.id}
                            onClick={() => setDpAba(t.id)} 
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dpAba === t.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                          >
                            {t.label} ({t.count})
                          </button>
                        ))}
                     </div>
                 </div>
              )}

             <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] shadow-2xl flex-1 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="relative flex-1 w-full max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <input className="input-field w-full pl-12" placeholder="Buscar no DP..." value={busca} onChange={e => setBusca(e.target.value)} />
                   </div>
                   <div className="flex gap-2 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                      {["TODOS", "ATIVO", "AFASTADO", "INATIVO"].map(f => (
                        <button key={f} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filtro === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)]'}`} onClick={() => setFiltro(f)}>{f}</button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-8">
                   {dpAba === "ativos" || dpAba === "arquivo" ? (
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
                                  <div className="flex flex-col gap-1 items-center">
                                     <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700' : c.status === 'AFASTADO' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
                                     {dpAba === 'ativos' && (
                                        <select className="text-[8px] font-black border-none bg-transparent text-[var(--text-muted)] focus:ring-0 cursor-pointer" value={c.status} onChange={(e) => handleUpdateStatus(c.id, e.target.value)}>
                                           <option value="ATIVO">Ativar</option>
                                           <option value="AFASTADO">Afastar</option>
                                           <option value="INATIVO">Inativar</option>
                                           <option value="DESLIGADO">Demitir (REQ)</option>
                                        </select>
                                     )}
                                  </div>
                                </td>
                                <td className="p-6 text-right">
                                   <div className="flex justify-end gap-3">
                                      {dpAba === 'arquivo' && (
                                         <button onClick={() => handleGerarPDFHistorico(c)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase"><FileText size={14} /> PDF</button>
                                      )}
                                      <button className="p-3 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-xl group-hover:text-[var(--brand)] group-hover:bg-white transition-all"><ChevronRight size={18} /></button>
                                   </div>
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

        {/* VIEW: DOCS (PLACEHOLDER PREMIUM) */}
        {masterTab === "DOCS" && (
           <div className="flex flex-col items-center justify-center flex-1 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-xl border-dashed border-[var(--brand)]/20 animate-fade-in">
              <div className="w-24 h-24 bg-[var(--brand)]/5 rounded-full flex items-center justify-center mb-8">
                 <FileText size={48} className="text-[var(--brand)] opacity-40" />
              </div>
              <h3 className="text-xl font-black italic mb-2">Central de Documentos</h3>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Sincronizando com a base de dados administrativa...</p>
           </div>
        )}

      </div>

      <FichaColaborador360 colabId={selecionado?.id} isOpen={!!selecionado} onClose={() => setSelecionado(null)} canEdit={true} restrictLevel={user.nivel < 4} />
      
       {/* MODAL AFASTAMENTO */}
       <AdaptiveModal title="Registrar Afastamento / Licença" isOpen={!!modalAfastamento} onClose={() => setModalAfastamento(null)} width="500px">
          <div className="p-10 space-y-6">
             <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-start gap-4">
                <ShieldAlert className="text-orange-600 shrink-0" size={24}/>
                <div>
                   <p className="text-xs font-black text-orange-900 uppercase tracking-widest">Controle de Absenteísmo</p>
                   <p className="text-[10px] font-bold text-orange-700 mt-1 uppercase">O colaborador ficará em status de espera. Informe o motivo legal e o tempo previsto.</p>
                </div>
             </div>

             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Motivo do Afastamento</label>
                   <select className="input-field w-full font-bold" value={afastamentoData.motivo} onChange={e => setAfastamentoData({...afastamentoData, motivo: e.target.value})}>
                      <option value="">Selecione o motivo...</option>
                      <option value="MEDICO">Licença Médica (Atestado)</option>
                      <option value="MATERNIDADE">Licença Maternidade</option>
                      <option value="FERIAS">Férias</option>
                      <option value="PARTICULAR">Assunto Particular</option>
                      <option value="SUSPENSAO">Suspensão Disciplinar</option>
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Tempo Previsto (Dias)</label>
                   <input type="number" className="input-field w-full font-black" placeholder="Ex: 15" value={afastamentoData.tempo} onChange={e => setAfastamentoData({...afastamentoData, tempo: e.target.value})} />
                </div>
             </div>

             <button onClick={async () => {
                const { error } = await supabase.from('usuarios').update({ 
                   status: 'AFASTADO',
                   metadados: { motivo_afastamento: afastamentoData.motivo, tempo_afastamento: afastamentoData.tempo, data_afastamento: new Date().toISOString() }
                }).eq('id', modalAfastamento.id);
                if (!error) {
                   setModalAfastamento(null);
                   loadData();
                   alert("Afastamento registrado com sucesso.");
                }
             }} className="w-full h-14 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Confirmar Afastamento</button>
          </div>
       </AdaptiveModal>

       {/* MODAL OCORRENCIA GERAL */}
       <AdaptiveModal title="Ocorrência para Gerência Operacional" isOpen={modalOcorrenciaGeral} onClose={() => setModalOcorrenciaGeral(false)} width="500px">
          <div className="p-10 space-y-6">
             <textarea className="input-field !h-40 p-4 text-sm font-bold" placeholder="Descreva a demanda ou falha operacional para a gerência..." />
             <button className="w-full h-14 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Enviar p/ Gerência</button>
          </div>
       </AdaptiveModal>

       {/* MODAL SUPRIMENTOS */}
       <AdaptiveModal title="Requisição de Materiais de Escritório" isOpen={modalSuprimentos} onClose={() => setModalSuprimentos(false)} width="550px">
          <div className="p-10 space-y-6">
             <div className="grid grid-cols-1 gap-4">
                {['Canetas (Azul/Preta)', 'Papel A4', 'Grampeador', 'Clips', 'Pasta Suspensa'].map(item => (
                   <div key={item} className="flex justify-between items-center p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                      <span className="text-xs font-black uppercase">{item}</span>
                      <button className="px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-[10px] font-black uppercase">Adicionar</button>
                   </div>
                ))}
             </div>
             <button className="w-full h-14 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest mt-6 shadow-xl shadow-[var(--brand)]/30">Enviar Requisição ao Compras</button>
          </div>
       </AdaptiveModal>
      

     </div>
  );
}
