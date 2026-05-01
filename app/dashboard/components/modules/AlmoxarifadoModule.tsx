"use client";
import { useState, useEffect } from "react";
import { 
  Search, Package, ShieldCheck, Plus, Filter, 
  TrendingDown, CheckCircle2, History, XCircle, Edit3, 
  FileText, Send, X, Ruler, ClipboardList, Info,
  UserCheck, AlertCircle, Save, Clock, AlertTriangle, MessageSquare
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function AlmoxarifadoModule({ reducao, setReducao }: { reducao: number, setReducao: (v: number) => void }) {
  // --- Estados Principais ---
  const [estoque, setEstoque] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [user, setUser] = useState<any>({});
  
  // --- Tabs ---
  type TabType = "ESTOQUE_EPI" | "CATALOGO" | "REQUISICOES";
  const [activeTab, setActiveTab] = useState<TabType>("ESTOQUE_EPI");
  
  // --- Modais ---
  const [modalAberto, setModalAberto] = useState<null | "cadastro" | "entrega" | "editar_req" | "ocorrencia">(null);
  
  // --- Formulários ---
  const [formData, setFormData] = useState({ 
    item: "", categoria: "EPI", unidade_medida: "UN", tamanho: "", ca: "", 
    quantidade: 0, estoque_minimo: 5, tipo_estoque: "PROPRIO" 
  });

  const [entregaData, setEntregaData] = useState({ colaborador: "", itens: [] as any[] });
  const [reqEditando, setReqEditando] = useState<any>(null);
  const [ocorrenciaData, setOcorrenciaData] = useState({ reqId: "", desc: "", prioridade: "ALTA" });

  // --- Fetch ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {}
    fetchTudo();
  }, [activeTab]);

  async function fetchTudo() {
    setLoading(true);
    const { data: estData } = await supabase.from('estoque_atual').select('*').order('item');
    if (estData) setEstoque(estData);

    const { data: reqData } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false });
    if (reqData) setRequisicoes(reqData);

    const { data: usrData } = await supabase.from('usuarios').select('id, nome, cargo').order('nome');
    if (usrData) setUsuarios(usrData);
    setLoading(false);
  }

  // --- Funções Auxiliares ---
  const calcularDias = (dataIso: string) => {
    const inicio = new Date(dataIso);
    const hoje = new Date();
    const diff = hoje.getTime() - inicio.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dias === 0 ? "Hoje" : `${dias} dias`;
  };

  // --- Handlers ---
  const handleSalvarItem = async () => {
    if (!formData.item) return alert("A descrição é obrigatória.");
    setLoading(true);
    const payload = { ...formData, tipo_estoque: activeTab === "CATALOGO" ? "CATALOGO" : "PROPRIO", categoria: activeTab === "CATALOGO" ? "SUPRIMENTO" : "EPI" };
    const { error } = await supabase.from('estoque_atual').insert([payload]);
    if (error) alert("Erro: " + error.message);
    else { setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  const handleAprovarReq = async (id: string, status: 'APROVADO' | 'REPROVADO') => {
    setLoading(true);
    const { error } = await supabase.from('requisicoes').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else fetchTudo();
    setLoading(false);
  };

  const handleSalvarOcorrencia = async () => {
    if (!ocorrenciaData.desc) return alert("Descreva a ocorrência.");
    setLoading(true);
    const { error } = await supabase.from('tickets_sla').insert([{
      assunto: `Ocorrência na Req #${reqEditando?.protocolo || 'N/A'}`,
      descricao: ocorrenciaData.desc,
      prioridade: ocorrenciaData.prioridade,
      unidade: reqEditando?.unidade_destino,
      criado_por: user.name || 'Almoxarifado',
      status: 'PENDENTE'
    }]);
    if (error) alert(error.message);
    else { alert("Ocorrência registrada e encaminhada ao Gestor."); setModalAberto(null); setOcorrenciaData({ reqId: "", desc: "", prioridade: "ALTA" }); }
    setLoading(false);
  };

  const handleBaixaEntrega = async () => {
    if (!entregaData.colaborador || entregaData.itens.length === 0) return alert("Selecione colaborador e itens.");
    setLoading(true);
    try {
      for (const item of entregaData.itens) {
        const itemEstoque = estoque.find(e => e.id === item.id);
        if (itemEstoque) {
          const novaQtd = (itemEstoque.quantidade || 0) - item.qtd_entrega;
          await supabase.from('estoque_atual').update({ quantidade: novaQtd }).eq('id', item.id);
        }
      }
      alert("Entrega realizada com sucesso! Gerando recibo...");
      window.print();
      setModalAberto(null);
      setEntregaData({ colaborador: "", itens: [] });
      fetchTudo();
    } catch (err: any) { alert("Erro: " + err.message); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full no-print px-4 md:px-10 py-6 max-w-[1600px] mx-auto overflow-hidden">
      
      {/* 1. HEADER E AÇÕES RÁPIDAS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--bg-card)] p-8 md:p-12 rounded-[3rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-[var(--brand)]/10 rounded-2xl flex items-center justify-center text-[var(--brand)] border border-[var(--brand)]/20">
              <Package size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] italic">Almoxarifado Central</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Gestão de Estoque e Requisições Operacionais</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => setModalAberto("entrega")} className="h-12 px-6 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-600/20">
             <UserCheck size={16} /> Entrega de EPI
           </button>
           <button onClick={() => { setFormData({ item: "", categoria: "EPI", unidade_medida: "UN", tamanho: "", ca: "", quantidade: 0, estoque_minimo: 5, tipo_estoque: activeTab === "CATALOGO" ? "CATALOGO" : "PROPRIO" }); setModalAberto("cadastro"); }} className="h-12 px-6 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg">
             <Plus size={16} /> Novo Item
           </button>
        </div>
      </div>

      {/* 2. SUB-NAVEGAÇÃO (ABAS) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md w-fit">
          {[
            { id: "ESTOQUE_EPI", label: "Estoque EPI", icon: ShieldCheck },
            { id: "CATALOGO", label: "Catálogo", icon: ClipboardList },
            { id: "REQUISICOES", label: "Requisições", icon: FileText },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="input-field !pl-12 !h-12 text-xs" placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      {/* 3. CONTEÚDO DINÂMICO */}
      <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] overflow-hidden shadow-xl flex flex-col flex-1 min-h-[500px]">
          
          {activeTab === "REQUISICOES" ? (
            <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[700px] relative border-b border-[var(--border)] scrollbar-thin scrollbar-thumb-[var(--brand)]">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-[var(--bg-base)]/90 backdrop-blur-md sticky top-0 z-20 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[120px] sticky left-0 z-30 bg-[var(--bg-card)] border-b border-r border-[var(--border)]">Nº Requisição</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest min-w-[300px] sticky left-[120px] z-30 bg-[var(--bg-card)] border-b border-r border-[var(--border)]">Descrição / Unidade</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center min-w-[120px]">Data</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center min-w-[120px]">Contador</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center min-w-[100px]">Qtd</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center min-w-[140px]">Status</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right min-w-[160px]">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {requisicoes.filter(r => r.solicitante?.toLowerCase().includes(busca.toLowerCase()) || r.item_nome?.toLowerCase().includes(busca.toLowerCase()) || r.protocolo?.toLowerCase().includes(busca.toLowerCase())).map(r => (
                    <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-all group">
                      <td className="p-8 text-center sticky left-0 z-10 bg-[var(--bg-card)] group-hover:bg-[var(--bg-base)]/50 border-r border-[var(--border)] transition-colors">
                        <span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg text-[10px] font-black text-[var(--brand)] border border-[var(--brand)]/20 shadow-sm">{r.protocolo || '---'}</span>
                      </td>
                      <td className="p-8 sticky left-[120px] z-10 bg-[var(--bg-card)] group-hover:bg-[var(--bg-base)]/50 border-r border-[var(--border)] transition-colors">
                        <div className="text-sm font-black whitespace-normal max-w-[250px]">{r.item_nome || r.item}</div>
                        <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Solic: {r.solicitante} ({r.unidade_destino})</div>
                      </td>
                      <td className="p-8 text-center text-[10px] font-bold text-[var(--text-muted)]">
                        {new Date(r.data_solicitacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-8 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <Clock size={12} className="text-orange-500" />
                            <span className="text-[10px] font-black uppercase text-orange-600">{calcularDias(r.data_solicitacao)}</span>
                         </div>
                      </td>
                      <td className="p-8 text-center">
                        <span className="text-base font-black text-[var(--brand)]">{r.quantidade} {r.unidade_medida}</span>
                      </td>
                      <td className="p-8 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.status === 'SOLICITADO' ? 'bg-orange-100 text-orange-700' : r.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-8 text-right space-x-2">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setReqEditando(r); setModalAberto("ocorrencia"); }} title="Registrar Ocorrência" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><AlertTriangle size={14}/></button>
                          {r.status === 'SOLICITADO' && (
                            <>
                              <button onClick={() => { setReqEditando(r); setModalAberto("editar_req"); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14}/></button>
                              <button onClick={() => handleAprovarReq(r.id, 'APROVADO')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><CheckCircle2 size={14}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest min-w-[200px]">Descrição</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Unidade</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Tamanho</th>
                    {activeTab === "ESTOQUE_EPI" && <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">CA</th>}
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Saldo</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {estoque.filter(i => i.tipo_estoque === (activeTab === "ESTOQUE_EPI" ? "PROPRIO" : "CATALOGO")).filter(i => i.item?.toLowerCase().includes(busca.toLowerCase())).map(item => (
                    <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all">
                      <td className="p-8">
                        <div className="text-sm font-black whitespace-normal max-w-[300px]">{item.item}</div>
                        <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{item.categoria}</div>
                      </td>
                      <td className="p-8 text-center text-xs font-black text-[var(--text-muted)]">{item.unidade_medida}</td>
                      <td className="p-8 text-center">
                        <span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg text-[10px] font-black">{item.tamanho || '---'}</span>
                      </td>
                      {activeTab === "ESTOQUE_EPI" && <td className="p-8 text-center"><span className="font-mono text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">{item.ca || '---'}</span></td>}
                      <td className="p-8 text-center"><span className={`text-base font-black ${item.quantidade <= (item.estoque_minimo || 0) ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>{item.quantidade}</span></td>
                      <td className="p-8 text-right"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.quantidade <= (item.estoque_minimo || 0) ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>{item.quantidade <= (item.estoque_minimo || 0) ? 'Crítico' : 'OK'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* --- MODAIS --- */}

      <AdaptiveModal isOpen={modalAberto === "ocorrencia"} onClose={() => setModalAberto(null)} title="Registrar Ocorrência na Entrega">
         {reqEditando && (
           <div className="p-10 space-y-6">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4">
                 <AlertTriangle className="text-red-600 shrink-0" size={24}/>
                 <div>
                    <p className="text-xs font-black text-red-900 uppercase">Atenção</p>
                    <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed mt-1">Este registro será enviado imediatamente para a Diretoria e Logística como um Ticket de falha na entrega do protocolo {reqEditando.protocolo}.</p>
                 </div>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block ml-2">Descreva o Problema</label>
                 <textarea className="input-field !h-32 p-4 text-xs font-bold" value={ocorrenciaData.desc} onChange={e => setOcorrenciaData({...ocorrenciaData, desc: e.target.value})} placeholder="Ex: Produto veio com defeito, quantidade divergente da nota, etc..." />
              </div>
              <button onClick={handleSalvarOcorrencia} className="w-full h-16 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                 <MessageSquare size={18} /> Encaminhar Ocorrência
              </button>
           </div>
         )}
      </AdaptiveModal>

      <AdaptiveModal isOpen={modalAberto === "cadastro"} onClose={() => setModalAberto(null)} title="Cadastrar Novo Item">
         <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">{field("Descrição", "item", "Ex: Luva de Raspa G", "text", formData, setFormData)}</div>
               <div>{field("Unidade", "unidade_medida", "UN, PAR, etc", "text", formData, setFormData)}</div>
               <div>{field("Tamanho", "tamanho", "G, 42, etc", "text", formData, setFormData)}</div>
               {activeTab === "ESTOQUE_EPI" && <div>{field("CA", "ca", "CA Nº", "text", formData, setFormData)}</div>}
               <div>{field("Qtd Inicial", "quantidade", "0", "number", formData, setFormData)}</div>
            </div>
            <button onClick={handleSalvarItem} className="btn-brand w-full !h-14 font-black uppercase text-xs">Salvar no Sistema</button>
         </div>
      </AdaptiveModal>

      <AdaptiveModal isOpen={modalAberto === "entrega"} onClose={() => setModalAberto(null)} title="Entrega de EPI (Ficha NR-06)">
         <div className="p-8 space-y-6">
            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Colaborador</label>
               <select className="input-field w-full" value={entregaData.colaborador} onChange={e => setEntregaData({...entregaData, colaborador: e.target.value})}>
                  <option value="">Selecione...</option>
                  {usuarios.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
               </select>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
               {estoque.filter(i => i.tipo_estoque === 'PROPRIO' && i.quantidade > 0).map(i => (
                  <div key={i.id} className="flex justify-between items-center p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] cursor-pointer" onClick={() => { if(!entregaData.itens.find(it => it.id === i.id)) setEntregaData({...entregaData, itens: [...entregaData.itens, {...i, qtd_entrega: 1}]}); }}>
                     <span className="text-[11px] font-bold">{i.item}</span>
                     <Plus size={14} className="text-[var(--brand)]"/>
                  </div>
               ))}
            </div>
            {entregaData.itens.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                 {entregaData.itens.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] font-black"><span>{it.item}</span><button onClick={() => setEntregaData({...entregaData, itens: entregaData.itens.filter((_, i) => i !== idx)})} className="text-red-500"><X size={12}/></button></div>
                 ))}
                 <button onClick={handleBaixaEntrega} className="btn-brand w-full !h-14 font-black uppercase text-xs mt-4">Finalizar e Imprimir Recibo</button>
              </div>
            )}
         </div>
      </AdaptiveModal>

      <AdaptiveModal isOpen={modalAberto === "editar_req"} onClose={() => setModalAberto(null)} title="Modificar Requisição">
         {reqEditando && (
           <div className="p-8 space-y-6">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3"><AlertCircle className="text-orange-600" size={20}/><p className="text-[10px] font-bold text-orange-800 uppercase leading-tight">Modificando quantidade solicitada.</p></div>
              <div><label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Quantidade</label><input type="number" className="input-field !h-16 text-2xl font-black text-center" value={reqEditando.quantidade} onChange={e => setReqEditando({...reqEditando, quantidade: Number(e.target.value)})} /></div>
              <button onClick={() => { setLoading(true); supabase.from('requisicoes').update({ quantidade: reqEditando.quantidade }).eq('id', reqEditando.id).then(() => { setModalAberto(null); fetchTudo(); }); }} className="w-full btn-brand !h-16 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3"><Save size={18} /> Salvar Alteração</button>
           </div>
         )}
      </AdaptiveModal>

      <div id="ficha-impressao" className="hidden print:block fixed inset-0 bg-white text-black p-12 font-serif z-[9999]">
         <h1 className="text-xl font-black text-center border-b-2 border-black pb-4 mb-8 uppercase">Recibo de Entrega de EPI (NR-06)</h1>
         <div className="mb-8"><strong>Colaborador:</strong> <span className="uppercase">{entregaData.colaborador}</span></div>
         <table className="w-full border-collapse border border-black mb-10 text-xs">
            <thead><tr className="bg-gray-100"><th className="border border-black p-2">Item</th><th className="border border-black p-2 text-center">Qtd</th><th className="border border-black p-2 text-center">CA</th><th className="border border-black p-2">Assinatura</th></tr></thead>
            <tbody>{entregaData.itens.map((it, i) => (<tr key={i}><td className="border border-black p-2">{it.item}</td><td className="border border-black p-2 text-center">{it.qtd_entrega}</td><td className="border border-black p-2 text-center">{it.ca || '---'}</td><td className="border border-black p-2"></td></tr>))}</tbody>
         </table>
      </div>

    </div>
  );
}

function field(label: string, key: string, placeholder: string, type: string, state: any, setState: any) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">{label}</label>
      <input type={type} className="input-field" value={state[key]} onChange={e => setState({...state, [key]: type === 'number' ? Number(e.target.value) : e.target.value})} placeholder={placeholder} />
    </div>
  );
}
