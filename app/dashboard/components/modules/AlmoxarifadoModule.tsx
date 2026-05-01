"use client";
import { useState, useEffect } from "react";
import { 
  Search, Package, ShieldCheck, Plus, Filter, 
  TrendingDown, CheckCircle2, History, XCircle, Edit3, 
  FileText, Send, X, Ruler, ClipboardList, Info,
  UserCheck, AlertCircle, Save, Clock, AlertTriangle, MessageSquare,
  Truck, User
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
  type TabType = "ESTOQUE_EPI" | "CATALOGO" | "REQUISICOES" | "OCORRENCIAS";
  const [activeTab, setActiveTab] = useState<TabType>("ESTOQUE_EPI");
  
  // --- Modais ---
  const [modalAberto, setModalAberto] = useState<null | "cadastro" | "entrega" | "editar_req" | "ocorrencia" | "confirmar_entrega">(null);
  
  // --- Formulários ---
  const [formData, setFormData] = useState<any>({ 
    id: "", item: "", codigo_registro: "", categoria: "EPI", unidade_medida: "UN", tamanho: "", ca: "", 
    quantidade: 0, estoque_minimo: 5, tipo_estoque: "PROPRIO",
    valor_unitario: 0, coeficiente: 1.0
  });

  const [entregaData, setEntregaData] = useState({ colaborador: "", itens: [] as any[] });
  const [reqEditando, setReqEditando] = useState<any>(null);
  const [ocorrenciaData, setOcorrenciaData] = useState({ reqId: "", desc: "", prioridade: "ALTA", dias_solucao: 1 });
  const [entregaConfirm, setEntregaConfirm] = useState({ recebedor: "" });

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
    return Math.floor(diff / (1000 * 60 * 60 * 24)) === 0 ? "Hoje" : `${Math.floor(diff / (1000 * 60 * 60 * 24))} dias`;
  };

  // --- Handlers ---
  const handleSalvarItem = async () => {
    if (!formData.item) return alert("A descrição é obrigatória.");
    setLoading(true);
    
    let error;
    if (formData.id) {
      const { id, ...updateData } = formData;
      const res = await supabase.from('estoque_atual').update(updateData).eq('id', id);
      error = res.error;
    } else {
      const { id, ...insertData } = formData;
      const res = await supabase.from('estoque_atual').insert([insertData]);
      error = res.error;
    }
    
    if (error) alert("Erro: " + error.message);
    else { setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  const handleProcessarReq = async (id: string, status: 'APROVADO' | 'REPROVADO', qtdAprovada?: number) => {
    setLoading(true);
    const updates: any = { status };
    if (qtdAprovada !== undefined) updates.quantidade_aprovada = qtdAprovada;
    
    const { error } = await supabase.from('requisicoes').update(updates).eq('id', id);
    if (error) alert(error.message);
    else { setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  const handleConfirmarEntregaTotal = async () => {
    if (!entregaConfirm.recebedor) return alert("Informe quem recebeu.");
    setLoading(true);
    const { error } = await supabase.from('requisicoes').update({ 
      status: 'ENTREGUE', 
      data_entrega: new Date().toISOString(),
      recebedor_nome: entregaConfirm.recebedor
    }).eq('id', reqEditando.id);
    
    if (error) alert(error.message);
    else { setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  const handleSalvarOcorrencia = async () => {
    if (!ocorrenciaData.desc) return alert("Descreva a ocorrência.");
    setLoading(true);
    const { error } = await supabase.from('tickets_sla').insert([{
      assunto: `Ocorrência na Req #${reqEditando?.protocolo || 'N/A'}`,
      descricao: ocorrenciaData.desc,
      prioridade: ocorrenciaData.prioridade,
      prazo_estipulado_dias: ocorrenciaData.dias_solucao,
      unidade: reqEditando?.unidade_destino,
      criado_por: user.name || 'Almoxarifado',
      status: 'PENDENTE'
    }]);
    if (error) alert(error.message);
    else { alert("Ocorrência registrada."); setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full no-print px-4 md:px-10 py-6 max-w-[1600px] mx-auto overflow-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--bg-card)] p-8 md:p-12 rounded-[3rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-[var(--brand)]/10 rounded-2xl flex items-center justify-center text-[var(--brand)] border border-[var(--brand)]/20">
              <Package size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] italic">Almoxarifado Central</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Controle de Fluxo: Pedido {'>'} Análise {'>'} Entrega</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => setModalAberto("entrega")} className="h-12 px-6 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-600/20">
             <UserCheck size={16} /> Entrega Direta (EPI)
           </button>
           <button onClick={() => { setFormData({ id: "", item: "", codigo_registro: "", categoria: "EPI", unidade_medida: "UN", tamanho: "", ca: "", quantidade: 0, estoque_minimo: 5, tipo_estoque: activeTab === "CATALOGO" ? "CATALOGO" : "PROPRIO", valor_unitario: 0, coeficiente: 1.0 }); setModalAberto("cadastro"); }} className="h-12 px-6 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg">
             <Plus size={16} /> Cadastrar Material
           </button>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md w-fit">
          {[
            { id: "ESTOQUE_EPI", label: "Estoque EPI", icon: ShieldCheck },
            { id: "CATALOGO", label: "Catálogo", icon: ClipboardList },
            { id: "REQUISICOES", label: "Análise de Pedidos", icon: FileText },
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

      {/* TABELA PRINCIPAL */}
      <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] overflow-hidden shadow-xl flex flex-col flex-1 min-h-[500px]">
          
          {activeTab === "REQUISICOES" ? (
            <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[700px] relative border-b border-[var(--border)] scrollbar-thin">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-[var(--bg-base)]/90 backdrop-blur-md sticky top-0 z-20 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[120px] sticky left-0 z-30 bg-[var(--bg-card)] border-b border-r border-[var(--border)]">Nº Req.</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest min-w-[300px] sticky left-[120px] z-30 bg-[var(--bg-card)] border-b border-r border-[var(--border)]">Descrição do Produto</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Pedido</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Aprovado</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Dias</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {requisicoes.filter(r => r.protocolo?.toLowerCase().includes(busca.toLowerCase()) || r.item_nome?.toLowerCase().includes(busca.toLowerCase())).map(r => (
                    <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-all group">
                      <td className="p-8 text-center sticky left-0 z-10 bg-[var(--bg-card)] group-hover:bg-[var(--bg-base)]/50 border-r border-[var(--border)] font-black text-[var(--brand)]">{r.protocolo || '---'}</td>
                      <td className="p-8 sticky left-[120px] z-10 bg-[var(--bg-card)] group-hover:bg-[var(--bg-base)]/50 border-r border-[var(--border)]">
                        <div className="text-sm font-black whitespace-normal max-w-[250px]">{r.item_nome || r.item}</div>
                        <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{r.unidade_destino} | {new Date(r.data_solicitacao).toLocaleDateString()}</div>
                      </td>
                      <td className="p-8 text-center">
                        <span className="text-sm font-bold text-[var(--text-muted)]">{r.quantidade} {r.unidade_medida}</span>
                      </td>
                      <td className="p-8 text-center">
                        <span className="text-base font-black text-blue-600">{r.quantidade_aprovada ?? '---'}</span>
                      </td>
                      <td className="p-8 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <Clock size={12} className="text-orange-500" />
                            <span className="text-[10px] font-black uppercase text-orange-600">{calcularDias(r.data_solicitacao)}</span>
                         </div>
                      </td>
                      <td className="p-8 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.status === 'SOLICITADO' ? 'bg-orange-100 text-orange-700' : r.status === 'APROVADO' ? 'bg-blue-100 text-blue-700' : r.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-8 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setReqEditando(r); setModalAberto("ocorrencia"); }} title="Ocorrência" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><AlertTriangle size={14}/></button>
                          
                          {r.status === 'SOLICITADO' && (
                            <button onClick={() => { setReqEditando({...r, quantidade_aprovada: r.quantidade + (r.quantidade_extra || 0)}); setModalAberto("editar_req"); }} className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase hover:scale-105 transition-all">Analisar</button>
                          )}
                          
                          {r.status === 'APROVADO' && (
                             <button onClick={() => { setReqEditando(r); setModalAberto("confirmar_entrega"); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase hover:scale-105 transition-all flex items-center gap-2"><Truck size={12}/> Entregar</button>
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
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center min-w-[100px]">Registro</th>
                    <th className="p-8 pl-10 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest min-w-[300px]">Descrição</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Unidade</th>
                    <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Tamanho</th>
                    {activeTab === "ESTOQUE_EPI" && <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">CA</th>}
                    {activeTab === "ESTOQUE_EPI" && <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Saldo</th>}
                    {activeTab === "CATALOGO" && <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Valor Ref.</th>}
                    {activeTab === "CATALOGO" && <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Coeficiente</th>}
                    {activeTab === "ESTOQUE_EPI" && <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Status</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {estoque.filter(i => i.tipo_estoque === (activeTab === "ESTOQUE_EPI" ? "PROPRIO" : "CATALOGO")).filter(i => i.item?.toLowerCase().includes(busca.toLowerCase())).map(item => (
                    <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all cursor-pointer" onClick={() => { setFormData(item); setModalAberto("cadastro"); }}>
                      <td className="p-8 text-center"><span className="text-xs font-black font-mono text-[var(--text-muted)]">{item.codigo_registro || '---'}</span></td>
                      <td className="p-8 pl-10">
                        <div className="text-sm font-black whitespace-normal max-w-[400px]">{item.item}</div>
                        <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{item.categoria}</div>
                      </td>
                      <td className="p-8 text-center"><span className="text-xs font-black text-[var(--text-muted)]">{item.unidade_medida || '---'}</span></td>
                      <td className="p-8 text-center"><span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg text-[10px] font-black">{item.tamanho || '---'}</span></td>
                      {activeTab === "ESTOQUE_EPI" && <td className="p-8 text-center"><span className="font-mono text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">{item.ca || '---'}</span></td>}
                      {activeTab === "ESTOQUE_EPI" && <td className="p-8 text-center"><span className={`text-base font-black ${item.quantidade <= (item.estoque_minimo || 0) ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>{item.quantidade}</span></td>}
                      {activeTab === "CATALOGO" && <td className="p-8 text-center"><span className="text-sm font-black text-green-600">{Number(item.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></td>}
                      {activeTab === "CATALOGO" && <td className="p-8 text-center"><span className="text-sm font-black text-blue-600">{item.coeficiente ? `${item.coeficiente} / ASG` : '---'}</span></td>}
                      {activeTab === "ESTOQUE_EPI" && <td className="p-8 text-right"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.quantidade <= (item.estoque_minimo || 0) ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>{item.quantidade <= (item.estoque_minimo || 0) ? 'Crítico' : 'OK'}</span></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* MODAL ANALISE/APROVAÇÃO */}
      <AdaptiveModal isOpen={modalAberto === "editar_req"} onClose={() => setModalAberto(null)} title="Análise Técnica de Requisição">
         {reqEditando && (
           <div className="p-10 space-y-8">
              <div className="bg-[var(--bg-base)] p-6 rounded-3xl border border-[var(--border)]">
                 <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2">Item Solicitado</p>
                 <h4 className="text-xl font-black text-[var(--text-primary)]">{reqEditando.item_nome || reqEditando.item}</h4>
                 <div className="flex gap-4 mt-4 text-[10px] font-bold uppercase tracking-widest text-orange-600">
                    <span>Solicitado: {reqEditando.quantidade} {reqEditando.unidade_medida}</span>
                    <span>|</span>
                    <span>Estoque Atual: {estoque.find(e => e.id === reqEditando.item_id)?.quantidade || 0}</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Quantidade Real Aprovada</label>
                    <input type="number" className="input-field !h-16 text-2xl font-black text-center border-blue-200 text-blue-600" value={reqEditando.quantidade_aprovada} onChange={e => setReqEditando({...reqEditando, quantidade_aprovada: Number(e.target.value)})} />
                    <p className="text-[9px] font-bold text-blue-400 mt-2 uppercase text-center italic">Você pode aumentar, diminuir ou manter conforme análise</p>
                 </div>
                 <div className="flex flex-col gap-3 justify-center">
                    <button onClick={() => handleProcessarReq(reqEditando.id, 'APROVADO', reqEditando.quantidade_aprovada)} className="h-16 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Aprovar com Ajustes</button>
                    <button onClick={() => handleProcessarReq(reqEditando.id, 'REPROVADO')} className="h-12 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">Reprovar Totalmente</button>
                 </div>
              </div>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL CONFIRMAR ENTREGA */}
      <AdaptiveModal isOpen={modalAberto === "confirmar_entrega"} onClose={() => setModalAberto(null)} title="Finalizar Entrega Logística">
         {reqEditando && (
           <div className="p-10 space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                 <Truck size={40} />
              </div>
              <h3 className="text-lg font-black uppercase">Confirmar Recebimento</h3>
              <p className="text-xs text-[var(--text-muted)] font-bold">O material já chegou na unidade ou foi retirado no balcão?</p>
              
              <div className="text-left mt-6">
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Nome de Quem Recebeu *</label>
                 <input className="input-field !h-14 font-black" value={entregaConfirm.recebedor} onChange={e => setEntregaConfirm({recebedor: e.target.value})} placeholder="Ex: Maria Silva (Secretária)" />
              </div>

              <button onClick={handleConfirmarEntregaTotal} className="w-full h-16 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl mt-4 hover:scale-[1.02] transition-all">Finalizar e Registrar Data</button>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL OCORRENCIA */}
      <AdaptiveModal isOpen={modalAberto === "ocorrencia"} onClose={() => setModalAberto(null)} title="Registrar Falha / Ocorrência Administrativa">
         {reqEditando && (
           <div className="p-10 space-y-6">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4">
                 <AlertTriangle className="text-red-600 shrink-0" size={24}/>
                 <div>
                    <p className="text-xs font-black text-red-900 uppercase">Gestão de SLA e Prazos</p>
                    <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed mt-1">Defina o prazo de solução. Se não cumprido, o status mudará para URGENTE com advertência automática.</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Descrição da Demanda / Problema</label>
                    <textarea className="input-field !h-32 p-4 text-xs font-bold" value={ocorrenciaData.desc} onChange={e => setOcorrenciaData({...ocorrenciaData, desc: e.target.value})} placeholder="O que precisa ser resolvido?" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Prazo de Solução (Dias)</label>
                    <select className="input-field !h-14 font-black" value={ocorrenciaData.dias_solucao} onChange={e => setOcorrenciaData({...ocorrenciaData, dias_solucao: Number(e.target.value)})}>
                       <option value={1}>24 Horas (1 dia)</option>
                       <option value={2}>2 Dias</option>
                       <option value={3}>3 Dias</option>
                       <option value={5}>5 Dias</option>
                       <option value={10}>10 Dias</option>
                    </select>
                 </div>
                 <div className="flex items-end">
                    <button onClick={handleSalvarOcorrencia} className="w-full h-14 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">Abrir Ticket</button>
                 </div>
              </div>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL NOVO/EDITAR ITEM */}
      <AdaptiveModal isOpen={modalAberto === "cadastro"} onClose={() => setModalAberto(null)} title={formData.id ? "Editar Material" : "Cadastrar Material"}>
         <div className="p-8 space-y-6">
            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Categoria do Material *</label>
               <select 
                 className="input-field w-full font-black text-blue-600" 
                 value={formData.categoria} 
                 onChange={e => {
                   const cat = e.target.value;
                   setFormData({
                     ...formData, 
                     categoria: cat, 
                     tipo_estoque: cat === 'EPI' ? 'PROPRIO' : 'CATALOGO',
                     quantidade: 0,
                     estoque_minimo: cat === 'EPI' ? 5 : 0,
                     ca: '',
                     tamanho: '',
                     coeficiente: cat === 'SUPRIMENTO' ? 1.0 : 0
                   });
                 }}
               >
                  <option value="EPI">Equipamento de Proteção (EPI)</option>
                  <option value="SUPRIMENTO">Suprimentos (Limpeza, Copa, etc)</option>
                  <option value="ESCRITORIO">Materiais de Escritório</option>
               </select>
               <p className="text-[9px] font-bold text-[var(--text-muted)] mt-2">
                 {formData.categoria === 'EPI' ? 'EPIs são mantidos em estoque próprio e requerem CA e controle rígido.' : 'Suprimentos e Escritório vão para o catálogo das Secretarias e têm valor de referência.'}
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Cód. Registro</label>
                 <input type="text" className="input-field uppercase font-mono" value={formData.codigo_registro} onChange={e => setFormData({...formData, codigo_registro: e.target.value})} placeholder="Ex: COD-123 (Opcional)" />
               </div>
               <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Descrição *</label>
                 <input type="text" className="input-field" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} placeholder="Ex: Luva de Raspa G / Resma A4" />
               </div>
               
               <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Und. Medida *</label>
                 <input type="text" className="input-field uppercase" value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})} placeholder="UN, PAR, CX" />
               </div>
               
               <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Tamanho</label>
                 <input type="text" className="input-field uppercase" value={formData.tamanho} onChange={e => setFormData({...formData, tamanho: e.target.value})} placeholder="G, 42, Único" />
               </div>

               {formData.categoria === 'EPI' && (
                 <>
                   <div>
                     <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">CA (Certificado)</label>
                     <input type="text" className="input-field" value={formData.ca} onChange={e => setFormData({...formData, ca: e.target.value})} placeholder="Número CA" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Estoque Mínimo</label>
                     <input type="number" className="input-field" value={formData.estoque_minimo} onChange={e => setFormData({...formData, estoque_minimo: Number(e.target.value)})} />
                   </div>
                 </>
               )}

               {formData.categoria !== 'EPI' && (
                 <>
                   <div>
                     <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Valor Unitário Ref. (R$)</label>
                     <input type="number" step="0.01" className="input-field" value={formData.valor_unitario} onChange={e => setFormData({...formData, valor_unitario: Number(e.target.value)})} placeholder="0.00" />
                   </div>
                   {formData.categoria === 'SUPRIMENTO' && (
                     <div>
                       <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Coeficiente / ASG</label>
                       <input type="number" step="0.1" className="input-field text-blue-600" value={formData.coeficiente} onChange={e => setFormData({...formData, coeficiente: Number(e.target.value)})} placeholder="Ex: 1.5" />
                     </div>
                   )}
                 </>
               )}
            </div>

            <button onClick={handleSalvarItem} className="h-14 w-full bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all mt-4">
              {formData.id ? "Atualizar Material" : "Salvar Material"}
            </button>
         </div>
      </AdaptiveModal>

      {/* MODAL ENTREGA DIRETA DE EPI */}
      <AdaptiveModal isOpen={modalAberto === "entrega"} onClose={() => setModalAberto(null)} title="Entrega de EPI (Ficha NR-06)">
         <div className="p-8 space-y-6">
            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Colaborador</label>
               <select className="input-field w-full font-black" value={entregaData.colaborador} onChange={e => setEntregaData({...entregaData, colaborador: e.target.value})}>
                  <option value="">Selecione na lista...</option>
                  {usuarios.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
               </select>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
               <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2">Selecione os EPIs (Estoque)</p>
               {estoque.filter(i => i.tipo_estoque === 'PROPRIO' && i.quantidade > 0).map(i => (
                  <div key={i.id} className="flex justify-between items-center p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] cursor-pointer hover:border-orange-500 transition-colors" onClick={() => { if(!entregaData.itens.find(it => it.id === i.id)) setEntregaData({...entregaData, itens: [...entregaData.itens, {...i, qtd_entrega: 1}]}); }}>
                     <span className="text-[11px] font-bold">{i.item} <span className="text-[9px] text-[var(--text-muted)]">({i.tamanho})</span></span>
                     <Plus size={14} className="text-[var(--brand)]"/>
                  </div>
               ))}
            </div>

            {entregaData.itens.length > 0 && (
              <div className="space-y-2 border-t border-[var(--border)] pt-4">
                 <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2">Itens para Entrega</p>
                 {entregaData.itens.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-100">
                       <span className="text-[11px] font-black text-orange-900">{it.item}</span>
                       <div className="flex items-center gap-3">
                          <input type="number" min="1" max={it.quantidade} className="w-16 h-8 text-center text-xs font-black rounded-md border border-orange-200" value={it.qtd_entrega} onChange={e => {
                             const newItens = [...entregaData.itens];
                             newItens[idx].qtd_entrega = Number(e.target.value);
                             setEntregaData({...entregaData, itens: newItens});
                          }}/>
                          <button onClick={() => setEntregaData({...entregaData, itens: entregaData.itens.filter((_, i) => i !== idx)})} className="text-red-500 hover:scale-110 transition-all"><X size={16}/></button>
                       </div>
                    </div>
                 ))}
                 <button onClick={() => {
                    alert("Função de baixa em massa via NR-06. (Simulação)");
                    setModalAberto(null);
                    setEntregaData({ colaborador: "", itens: [] });
                 }} className="h-14 w-full bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all mt-4">
                    Confirmar e Imprimir Recibo
                 </button>
              </div>
            )}
         </div>
      </AdaptiveModal>

      {/* MODAL ANALISAR REQUISIÇÃO */}
      <AdaptiveModal isOpen={modalAberto === "editar_req"} onClose={() => setModalAberto(null)} title="Analisar Requisição">
         <div className="p-8 space-y-6">
            <div className="bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border)]">
               <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1">Produto Requisitado</p>
               <p className="text-sm font-black text-[var(--text-primary)]">{reqEditando?.item_nome}</p>
               <div className="flex gap-6 mt-4">
                  <div>
                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Qtd Base</p>
                    <p className="text-base font-black text-orange-500">{reqEditando?.quantidade}</p>
                  </div>
                  {reqEditando?.quantidade_extra > 0 && (
                     <div>
                       <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Extra Pedido</p>
                       <p className="text-base font-black text-red-500">+{reqEditando?.quantidade_extra}</p>
                     </div>
                  )}
               </div>
            </div>

            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Quantidade Aprovada</label>
               <input type="number" min="0" className="input-field text-blue-500 font-black text-xl text-center" value={reqEditando?.quantidade_aprovada || 0} onChange={e => setReqEditando({...reqEditando, quantidade_aprovada: Number(e.target.value)})} />
               <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2 text-center">Ajuste a quantidade que será efetivamente entregue</p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
               <button onClick={() => handleProcessarReq(reqEditando.id, 'REPROVADO', 0)} className="flex-1 py-4 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Reprovar Total</button>
               <button onClick={() => handleProcessarReq(reqEditando.id, 'APROVADO', reqEditando.quantidade_aprovada)} className="flex-[2] py-4 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-lg shadow-green-600/20">Aprovar & Confirmar</button>
            </div>
         </div>
      </AdaptiveModal>
    </div>
  );
}
