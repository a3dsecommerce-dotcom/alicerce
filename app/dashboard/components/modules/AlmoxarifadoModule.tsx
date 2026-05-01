"use client";
import { useState, useEffect } from "react";
import { 
  Search, Package, ShieldCheck, Plus, Filter, 
  TrendingDown, CheckCircle2, History, XCircle, Edit3, 
  FileText, Send, X, Ruler, ClipboardList, Info,
  UserCheck, AlertCircle, Save
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
  const [modalAberto, setModalAberto] = useState<null | "cadastro" | "entrega" | "editar_req">(null);
  
  // --- Formulários ---
  const [formData, setFormData] = useState({ 
    item: "", categoria: "EPI", unidade_medida: "UN", tamanho: "", ca: "", 
    quantidade: 0, estoque_minimo: 5, tipo_estoque: "PROPRIO" 
  });

  const [entregaData, setEntregaData] = useState({
    colaborador: "",
    itens: [] as any[]
  });

  const [reqEditando, setReqEditando] = useState<any>(null);

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
    
    // Estoque
    const tipo = activeTab === "CATALOGO" ? "CATALOGO" : "PROPRIO";
    const { data: estData } = await supabase.from('estoque_atual').select('*').order('item');
    if (estData) setEstoque(estData);

    // Requisições
    const { data: reqData } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false });
    if (reqData) setRequisicoes(reqData);

    // Usuários (para Entrega)
    const { data: usrData } = await supabase.from('usuarios').select('id, nome, cargo').order('nome');
    if (usrData) setUsuarios(usrData);

    setLoading(false);
  }

  // --- Handlers ---
  const handleSalvarItem = async () => {
    if (!formData.item) return alert("A descrição é obrigatória.");
    setLoading(true);
    const payload = {
      ...formData,
      tipo_estoque: activeTab === "CATALOGO" ? "CATALOGO" : "PROPRIO",
      categoria: activeTab === "CATALOGO" ? "SUPRIMENTO" : "EPI"
    };
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

  const handleSalvarEdicaoReq = async () => {
    if (!reqEditando) return;
    setLoading(true);
    const { error } = await supabase.from('requisicoes').update({ 
      quantidade: reqEditando.quantidade,
      unidade_medida: reqEditando.unidade_medida
    }).eq('id', reqEditando.id);
    if (error) alert(error.message);
    else { setModalAberto(null); fetchTudo(); }
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
    <div className="flex flex-col gap-8 animate-fade-in h-full no-print">
      
      {/* 1. HEADER E AÇÕES RÁPIDAS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
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
           <button 
             onClick={() => setModalAberto("entrega")}
             className="h-12 px-6 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-600/20"
           >
             <UserCheck size={16} /> Entrega de EPI
           </button>
           <button 
             onClick={() => {
               setFormData({ item: "", categoria: activeTab === "CATALOGO" ? "SUPRIMENTO" : "EPI", unidade_medida: "UN", tamanho: "", ca: "", quantidade: 0, estoque_minimo: 5, tipo_estoque: activeTab === "CATALOGO" ? "CATALOGO" : "PROPRIO" });
               setModalAberto("cadastro");
             }}
             className="h-12 px-6 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
           >
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
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            className="input-field !pl-12 !h-12 text-xs" 
            placeholder="Pesquisar..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* 3. CONTEÚDO DINÂMICO */}
      <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] overflow-hidden shadow-xl flex flex-col flex-1 min-h-[500px]">
          
          {activeTab === "REQUISICOES" ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Solicitante / Unidade</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Item Solicitado</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Quantidade</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {requisicoes.filter(r => r.solicitante?.toLowerCase().includes(busca.toLowerCase()) || r.item_nome?.toLowerCase().includes(busca.toLowerCase())).map(r => (
                    <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-all">
                      <td className="p-6">
                        <div className="text-sm font-black">{r.solicitante}</div>
                        <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{r.unidade_destino}</div>
                      </td>
                      <td className="p-6 text-sm font-bold text-[var(--text-primary)]">{r.item_nome || r.item}</td>
                      <td className="p-6 text-center">
                        <span className="text-base font-black text-[var(--brand)]">{r.quantidade} {r.unidade_medida}</span>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.status === 'SOLICITADO' ? 'bg-orange-100 text-orange-700' : r.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-6 text-right space-x-2">
                        {r.status === 'SOLICITADO' && (
                          <>
                            <button onClick={() => { setReqEditando(r); setModalAberto("editar_req"); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14}/></button>
                            <button onClick={() => handleAprovarReq(r.id, 'APROVADO')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><CheckCircle2 size={14}/></button>
                            <button onClick={() => handleAprovarReq(r.id, 'REPROVADO')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><XCircle size={14}/></button>
                          </>
                        )}
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
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Descrição</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Unidade</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Tamanho</th>
                    {activeTab === "ESTOQUE_EPI" && <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">CA</th>}
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Saldo</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {estoque
                    .filter(i => i.tipo_estoque === (activeTab === "ESTOQUE_EPI" ? "PROPRIO" : "CATALOGO"))
                    .filter(i => i.item?.toLowerCase().includes(busca.toLowerCase()))
                    .map(item => (
                      <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all">
                        <td className="p-6">
                          <div className="text-sm font-black">{item.item}</div>
                          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{item.categoria}</div>
                        </td>
                        <td className="p-6 text-center text-xs font-black text-[var(--text-muted)]">{item.unidade_medida}</td>
                        <td className="p-6 text-center">
                          <span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg text-[10px] font-black">{item.tamanho || '---'}</span>
                        </td>
                        {activeTab === "ESTOQUE_EPI" && (
                          <td className="p-6 text-center">
                             <span className="font-mono text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">{item.ca || '---'}</span>
                          </td>
                        )}
                        <td className="p-6 text-center">
                          <span className={`text-base font-black ${item.quantidade <= (item.estoque_minimo || 0) ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>{item.quantidade}</span>
                        </td>
                        <td className="p-6 text-right">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.quantidade <= (item.estoque_minimo || 0) ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                              {item.quantidade <= (item.estoque_minimo || 0) ? 'Crítico' : 'OK'}
                           </span>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* --- MODAIS --- */}

      {/* 1. Modal Cadastro */}
      <AdaptiveModal isOpen={modalAberto === "cadastro"} onClose={() => setModalAberto(null)} title="Cadastrar Novo Item">
         <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Descrição</label>
                  <input className="input-field" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} placeholder="Ex: Luva de Raspa G" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Unidade</label>
                  <input className="input-field" value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})} placeholder="UN, PAR, etc" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Tamanho</label>
                  <input className="input-field" value={formData.tamanho} onChange={e => setFormData({...formData, tamanho: e.target.value})} placeholder="G, 42, etc" />
               </div>
               {activeTab === "ESTOQUE_EPI" && (
                 <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">CA</label>
                    <input className="input-field" value={formData.ca} onChange={e => setFormData({...formData, ca: e.target.value})} placeholder="CA Nº" />
                 </div>
               )}
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Qtd Inicial</label>
                  <input type="number" className="input-field" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} />
               </div>
            </div>
            <button onClick={handleSalvarItem} className="btn-brand w-full !h-14 font-black uppercase text-xs">Salvar no Sistema</button>
         </div>
      </AdaptiveModal>

      {/* 2. Modal Entrega EPI */}
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
                  <div key={i.id} className="flex justify-between items-center p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] cursor-pointer"
                       onClick={() => {
                         if(!entregaData.itens.find(it => it.id === i.id)) setEntregaData({...entregaData, itens: [...entregaData.itens, {...i, qtd_entrega: 1}]});
                       }}>
                     <span className="text-[11px] font-bold">{i.item}</span>
                     <Plus size={14} className="text-[var(--brand)]"/>
                  </div>
               ))}
            </div>
            {entregaData.itens.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                 {entregaData.itens.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] font-black">
                       <span>{it.item}</span>
                       <button onClick={() => setEntregaData({...entregaData, itens: entregaData.itens.filter((_, i) => i !== idx)})} className="text-red-500"><X size={12}/></button>
                    </div>
                 ))}
                 <button onClick={handleBaixaEntrega} className="btn-brand w-full !h-14 font-black uppercase text-xs mt-4">Finalizar e Imprimir Recibo</button>
              </div>
            )}
         </div>
      </AdaptiveModal>

      {/* 3. Modal Editar Requisição */}
      <AdaptiveModal isOpen={modalAberto === "editar_req"} onClose={() => setModalAberto(null)} title="Modificar Requisição">
         {reqEditando && (
           <div className="p-8 space-y-6">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3">
                 <AlertCircle className="text-orange-600" size={20}/>
                 <p className="text-[10px] font-bold text-orange-800 uppercase leading-tight">Você está modificando a quantidade solicitada pela unidade.</p>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Quantidade</label>
                 <input type="number" className="input-field !h-16 text-2xl font-black text-center" value={reqEditando.quantidade} onChange={e => setReqEditando({...reqEditando, quantidade: Number(e.target.value)})} />
              </div>
              <button onClick={handleSalvarEdicaoReq} className="w-full btn-brand !h-16 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3">
                 <Save size={18} /> Salvar Alteração
              </button>
           </div>
         )}
      </AdaptiveModal>

      {/* SEÇÃO DE IMPRESSÃO */}
      <div id="ficha-impressao" className="hidden print:block fixed inset-0 bg-white text-black p-12 font-serif z-[9999]">
         <h1 className="text-xl font-black text-center border-b-2 border-black pb-4 mb-8 uppercase">Recibo de Entrega de EPI (NR-06)</h1>
         <div className="mb-8"><strong>Colaborador:</strong> <span className="uppercase">{entregaData.colaborador}</span></div>
         <table className="w-full border-collapse border border-black mb-10 text-xs">
            <thead><tr className="bg-gray-100">
               <th className="border border-black p-2">Item</th>
               <th className="border border-black p-2 text-center">Qtd</th>
               <th className="border border-black p-2 text-center">CA</th>
               <th className="border border-black p-2">Assinatura</th>
            </tr></thead>
            <tbody>{entregaData.itens.map((it, i) => (
               <tr key={i}><td className="border border-black p-2">{it.item}</td><td className="border border-black p-2 text-center">{it.qtd_entrega}</td><td className="border border-black p-2 text-center">{it.ca || '---'}</td><td className="border border-black p-2"></td></tr>
            ))}</tbody>
         </table>
         <div className="flex justify-around mt-20 text-[10px] font-bold uppercase">
            <div className="border-t border-black w-48 text-center pt-2">Empresa</div>
            <div className="border-t border-black w-48 text-center pt-2">Colaborador</div>
         </div>
      </div>

    </div>
  );
}
