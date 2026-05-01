"use client";
import { useState, useEffect } from "react";
import { 
  Search, Package, ShieldCheck, Plus, Filter, 
  TrendingDown, CheckCircle2, History, XCircle, Edit3, 
  FileText, Send, X, Ruler, ClipboardList, Info
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function AlmoxarifadoModule({ reducao, setReducao }: { reducao: number, setReducao: (v: number) => void }) {
  // --- Estados Principais ---
  const [estoque, setEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  // --- Tabs: Apenas EPI e Catálogo conforme solicitado ---
  type TabType = "ESTOQUE_EPI" | "CATALOGO";
  const [activeTab, setActiveTab] = useState<TabType>("ESTOQUE_EPI");
  
  // --- Modais ---
  const [modalCadastro, setModalCadastro] = useState(false);
  const [formData, setFormData] = useState({ 
    item: "", 
    categoria: "EPI", 
    unidade_medida: "UN", 
    tamanho: "", 
    ca: "", 
    quantidade: 0, 
    estoque_minimo: 5,
    tipo_estoque: "PROPRIO" 
  });

  // --- Fetch ---
  useEffect(() => {
    fetchEstoque();
  }, [activeTab]);

  async function fetchEstoque() {
    setLoading(true);
    const tipo = activeTab === "ESTOQUE_EPI" ? "PROPRIO" : "CATALOGO";
    const { data, error } = await supabase
      .from('estoque_atual')
      .select('*')
      .eq('tipo_estoque', tipo)
      .order('item');
    
    if (data) setEstoque(data);
    setLoading(false);
  }

  // --- Handlers ---
  const handleSalvar = async () => {
    if (!formData.item) return alert("A descrição é obrigatória.");
    
    setLoading(true);
    const payload = {
      ...formData,
      tipo_estoque: activeTab === "ESTOQUE_EPI" ? "PROPRIO" : "CATALOGO",
      categoria: activeTab === "ESTOQUE_EPI" ? "EPI" : "SUPRIMENTO"
    };

    const { error } = await supabase.from('estoque_atual').insert([payload]);
    
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setModalCadastro(false);
      setFormData({ item: "", categoria: "EPI", unidade_medida: "UN", tamanho: "", ca: "", quantidade: 0, estoque_minimo: 5, tipo_estoque: "PROPRIO" });
      fetchEstoque();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in h-full no-print">
      
      {/* 1. HEADER E FILTRO DE ECONOMIA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-200">
              <Package size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] italic">Gestão de Almoxarifado</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Controle de Estoque Interno e Catálogo de Secretarias</p>
           </div>
        </div>

        <div className="flex items-center gap-6 bg-[var(--bg-base)] p-4 rounded-2xl border border-[var(--border)] shadow-inner">
           <div className="flex items-center gap-3">
              <TrendingDown size={18} className="text-orange-500" />
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">Redução Estratégica</p>
                <input 
                  type="range" min="0" max="50" value={reducao} 
                  onChange={(e) => setReducao(Number(e.target.value))}
                  className="w-40 accent-orange-500 h-1 bg-orange-200 rounded-full appearance-none cursor-pointer" 
                />
              </div>
           </div>
           <div className="text-center min-w-[50px]">
              <span className="text-2xl font-black text-orange-500">{reducao}%</span>
           </div>
        </div>
      </div>

      {/* 2. SUB-NAVEGAÇÃO (ABAS) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md w-fit">
          {[
            { id: "ESTOQUE_EPI", label: "Estoque EPI / Uniformes", icon: ShieldCheck },
            { id: "CATALOGO", label: "Catálogo de Produtos", icon: ClipboardList },
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

        <button 
          onClick={() => setModalCadastro(true)}
          className="h-14 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-black/20"
        >
          <Plus size={16} /> Adicionar Novo Item
        </button>
      </div>

      {/* 3. TABELA DE DADOS */}
      <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] overflow-hidden shadow-xl flex flex-col flex-1 min-h-[500px]">
          <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6 bg-[var(--bg-base)]/5">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
               {activeTab === 'ESTOQUE_EPI' ? <ShieldCheck className="text-orange-600" size={20}/> : <ClipboardList className="text-blue-600" size={20}/>}
               {activeTab === 'ESTOQUE_EPI' ? 'Inventário de EPI e Uniformes' : 'Catálogo Disponível para Compradores'}
            </h3>
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                className="input-field !pl-12 !h-12 text-xs" 
                placeholder="Pesquisar por descrição..." 
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
               <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Descrição</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Und. Medida</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Tamanho</th>
                    {activeTab === "ESTOQUE_EPI" && (
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">CA (MTE)</th>
                    )}
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Saldo</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr><td colSpan={6} className="p-20 text-center text-xs italic font-bold text-[var(--text-muted)] uppercase tracking-widest animate-pulse">Sincronizando Banco de Dados...</td></tr>
                  ) : estoque.filter(i => i.item.toLowerCase().includes(busca.toLowerCase())).map(item => (
                    <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-colors group">
                      <td className="p-6">
                        <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{item.item}</span>
                        <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{item.categoria}</div>
                      </td>
                      <td className="p-6 text-center font-black text-xs text-[var(--text-muted)]">{item.unidade_medida}</td>
                      <td className="p-6 text-center font-black text-xs">
                        <span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg border border-[var(--border)]">{item.tamanho || 'N/A'}</span>
                      </td>
                      {activeTab === "ESTOQUE_EPI" && (
                        <td className="p-6 text-center">
                           <span className="font-mono text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">{item.ca || '---'}</span>
                        </td>
                      )}
                      <td className="p-6 text-center">
                        <span className="text-base font-black text-[var(--text-primary)]">{item.quantidade}</span>
                      </td>
                      <td className="p-6 text-right">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] shadow-sm ${item.quantidade <= (item.estoque_minimo || 0) ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                            {item.quantidade <= (item.estoque_minimo || 0) ? 'Crítico' : 'Estável'}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {estoque.length === 0 && !loading && (
                    <tr><td colSpan={6} className="p-20 text-center text-xs font-black text-[var(--text-muted)] uppercase tracking-widest opacity-30">Nenhum item cadastrado nesta categoria.</td></tr>
                  )}
               </tbody>
            </table>
          </div>
      </div>

      {/* MODAL: CADASTRO DE ITEM */}
      <AdaptiveModal isOpen={modalCadastro} onClose={() => setModalCadastro(false)} title={activeTab === "ESTOQUE_EPI" ? "Cadastrar Novo EPI / Uniforme" : "Adicionar Item ao Catálogo"}>
         <div className="p-10 space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block ml-2">Descrição Completa do Item</label>
                  <input 
                    className="input-field !h-14 font-bold" 
                    value={formData.item} 
                    onChange={e => setFormData({...formData, item: e.target.value})} 
                    placeholder="Ex: Luva de Raspa com Cano Curto" 
                  />
               </div>
               
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block ml-2">Unidade de Medida</label>
                  <select 
                    className="input-field !h-14 font-black" 
                    value={formData.unidade_medida} 
                    onChange={e => setFormData({...formData, unidade_medida: e.target.value})}
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="PAR">Par (PAR)</option>
                    <option value="CX">Caixa (CX)</option>
                    <option value="FD">Fardo (FD)</option>
                    <option value="KG">Quilo (KG)</option>
                    <option value="M">Metro (M)</option>
                  </select>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block ml-2">Tamanho / Especificação</label>
                  <input 
                    className="input-field !h-14 font-black" 
                    value={formData.tamanho} 
                    onChange={e => setFormData({...formData, tamanho: e.target.value})} 
                    placeholder="Ex: G, 42, 200ml" 
                  />
               </div>

               {activeTab === "ESTOQUE_EPI" && (
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block ml-2 text-orange-600">Certificado de Aprovação (CA)</label>
                    <div className="relative">
                       <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
                       <input 
                        className="input-field !h-14 !pl-12 font-black border-orange-200" 
                        value={formData.ca} 
                        onChange={e => setFormData({...formData, ca: e.target.value})} 
                        placeholder="Nº do CA MTE" 
                       />
                    </div>
                 </div>
               )}

               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block ml-2">Saldo Inicial em Estoque</label>
                  <input 
                    type="number" 
                    className="input-field !h-14 font-black" 
                    value={formData.quantidade} 
                    onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} 
                  />
               </div>
            </div>

            <div className="bg-[var(--bg-base)] p-6 rounded-3xl border border-[var(--border)] flex items-start gap-4">
               <Info className="text-[var(--brand)] shrink-0" size={20} />
               <p className="text-[10px] font-bold text-[var(--text-muted)] leading-relaxed uppercase tracking-wider">
                  Este item será listado no {activeTab === "ESTOQUE_EPI" ? "estoque interno para entregas NR-06" : "catálogo de suprimentos disponível para pedidos de secretarias"}. Certifique-se de que a descrição está correta antes de salvar.
               </p>
            </div>

            <div className="flex gap-4 pt-4">
               <button onClick={() => setModalCadastro(false)} className="flex-1 h-16 rounded-2xl border border-[var(--border)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-base)] transition-all">Cancelar</button>
               <button onClick={handleSalvar} className="flex-[2] h-16 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--brand)]/30 hover:scale-[1.02] transition-all">Salvar Item no Banco</button>
            </div>
         </div>
      </AdaptiveModal>

    </div>
  );
}
