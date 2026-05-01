"use client";
import { useState, useEffect } from "react";
import { 
  Search, Truck, Package, Activity, ShoppingBag, ShieldCheck, ClipboardList,
  AlertTriangle, CheckCircle2, Send, Calendar, Filter, Plus,
  ArrowRight, Box, Clock, ChevronRight, TrendingDown, History as HistoryIcon,
  AlertCircle, FileText, UserCheck, Download, X, ListChecks
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function AlmoxarifadoPage() {
  // --- Estados Principais ---
  const [estoque, setEstoque] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({});
  
  // --- Tabs ---
  type TabType = "PAINEL" | "ESTOQUE_PROPRIO" | "ESTOQUE_CATALOGO" | "RECEBER_CARGA" | "ENTREGA_EPI";
  const [activeTab, setActiveTab] = useState<TabType>("PAINEL");
  
  // --- Filtros e Modais ---
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState<null | "cadastro" | "analise" | "recebimento" | "entrega">(null);
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  
  // --- Formulários ---
  const [formData, setFormData] = useState({ 
    item: "", categoria: "EPI", quantidade: 0, estoque_minimo: 5, 
    unidade_medida: "UN", ca: "", tipo_estoque: "PROPRIO" 
  });
  
  const [entregaData, setEntregaData] = useState({
    colaborador: "",
    itens: [] as any[]
  });

  const [recebimentoData, setRecebimentoData] = useState({
    requisicao_id: "",
    itens_recebidos: [] as any[]
  });

  // --- Fetch Inicial ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {}

    fetchTudo();
  }, []);

  async function fetchTudo() {
    setLoading(true);
    
    // 1. Estoque
    const { data: estData } = await supabase.from('estoque_atual').select('*').order('item');
    if (estData) setEstoque(estData);

    // 2. Requisições
    const { data: reqData } = await supabase.from('requisicoes')
      .select('*')
      .order('data_solicitacao', { ascending: false });
    if (reqData) setRequisicoes(reqData);

    // 3. Usuários (para entrega de EPI)
    const { data: usrData } = await supabase.from('usuarios').select('id, nome, cargo').order('nome');
    if (usrData) setUsuarios(usrData);

    setLoading(false);
  }

  // --- Handlers ---
  const handleSalvarEstoque = async () => {
    setLoading(true);
    const { error } = await supabase.from('estoque_atual').upsert([formData]);
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setModalAberto(null);
      fetchTudo();
    }
    setLoading(false);
  };

  const handleAprovarRequisicao = async (id: string, status: 'APROVADO' | 'REPROVADO') => {
    const { error } = await supabase.from('requisicoes').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else fetchTudo();
  };

  const handleBaixaEntrega = async () => {
    if (!entregaData.colaborador || entregaData.itens.length === 0) return alert("Selecione colaborador e itens.");
    
    setLoading(true);
    try {
      // Baixa no estoque
      for (const item of entregaData.itens) {
        const itemEstoque = estoque.find(e => e.id === item.id);
        if (itemEstoque) {
          const novaQtd = (itemEstoque.quantidade || 0) - item.qtd_entrega;
          await supabase.from('estoque_atual').update({ quantidade: novaQtd }).eq('id', item.id);
        }
      }

      // Histórico
      await supabase.from('historico_gestao').insert([{
        executor_tel: user.name || "Almoxarifado",
        tipo_acao: "BAIXA_EPI",
        motivo: `Entrega NR-06: ${entregaData.colaborador}`,
        para: entregaData.itens.map(i => `${i.qtd_entrega}x ${i.item}`).join(", ")
      }]);

      alert("Baixa realizada com sucesso! Preparando Ficha NR-06...");
      window.print(); // O CSS @media print cuidará de mostrar apenas o recibo
      setEntregaData({ colaborador: "", itens: [] });
      fetchTudo();
    } catch (err: any) {
      alert("Erro: " + err.message);
    }
    setLoading(false);
  };

  const itensCriticos = estoque.filter(i => (i.quantidade || 0) <= (i.estoque_minimo || 0));

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-32 max-w-full px-4 pt-6">
      
      {/* 1. HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Módulo de Almoxarifado
          </h2>
          <p className="text-[11px] font-black text-[var(--brand)] uppercase tracking-widest mt-1">
            {activeTab.replace("_", " ")} • Alicerce Serviços e Gestão
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-[var(--bg-card)] px-6 py-3 rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-3">
              <Activity size={18} className="text-green-500" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase text-[var(--text-muted)]">Status do Estoque</span>
                 <span className="text-sm font-black">{estoque.length} Itens Cadastrados</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 no-print">
        
        {/* COLUNA ESQUERDA - CONTEÚDO PRINCIPAL */}
        <div className="xl:col-span-3 flex flex-col gap-8">
          
          {/* TABS MENU */}
          <div className="flex overflow-x-auto gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md hide-scrollbar">
            {[
              { id: "PAINEL", label: "Painel", icon: Activity },
              { id: "ESTOQUE_PROPRIO", label: "Estoque EPI", icon: ShieldCheck },
              { id: "ESTOQUE_CATALOGO", label: "Catálogo", icon: Package },
              { id: "RECEBER_CARGA", label: "Receber Carga", icon: Truck },
              { id: "ENTREGA_EPI", label: "Entrega NR-06", icon: UserCheck },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          {/* VIEW: PAINEL (REQUISIÇÕES) */}
          {activeTab === "PAINEL" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden">
                <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-base)]/5 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <ClipboardList className="text-[var(--brand)]" size={20} /> Requisições Pendentes
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                      <tr>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Solicitante</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Item</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {requisicoes.filter(r => r.status === 'SOLICITADO').map(r => (
                        <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-all">
                          <td className="p-6">
                            <div className="text-sm font-black">{r.solicitante}</div>
                            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{r.unidade_destino}</div>
                          </td>
                          <td className="p-6">
                            <div className="text-sm font-bold">{r.item_nome || r.item}</div>
                            <div className="text-xs text-[var(--brand)] font-black">{r.quantidade} {r.unidade_medida}</div>
                          </td>
                          <td className="p-6 text-center">
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[9px] font-black uppercase tracking-widest">Pendente</span>
                          </td>
                          <td className="p-6 text-right space-x-2">
                            <button onClick={() => handleAprovarRequisicao(r.id, 'APROVADO')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all">Aprovar</button>
                            <button onClick={() => handleAprovarRequisicao(r.id, 'REPROVADO')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all">Recusar</button>
                          </td>
                        </tr>
                      ))}
                      {requisicoes.filter(r => r.status === 'SOLICITADO').length === 0 && (
                        <tr><td colSpan={4} className="p-10 text-center text-xs text-[var(--text-muted)]">Tudo em dia! Nenhuma requisição aguardando.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ESTOQUE (PROPRIO / EPI) */}
          {(activeTab === "ESTOQUE_PROPRIO" || activeTab === "ESTOQUE_CATALOGO") && (
            <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-base)]/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full md:w-96">
                   <div className="relative w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                      <input 
                        className="input-field !pl-10 !h-10 text-xs" 
                        placeholder="Buscar item..." 
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                      />
                   </div>
                </div>
                <button 
                  onClick={() => {
                    setFormData({ 
                      item: "", categoria: activeTab === "ESTOQUE_PROPRIO" ? "EPI" : "SUPRIMENTO", 
                      quantidade: 0, estoque_minimo: 5, unidade_medida: "UN", ca: "", 
                      tipo_estoque: activeTab === "ESTOQUE_PROPRIO" ? "PROPRIO" : "CATALOGO" 
                    });
                    setModalAberto("cadastro");
                  }}
                  className="h-10 px-6 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  <Plus size={14} /> Novo Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Item / Categoria</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Saldo</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Mínimo</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Und.</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {estoque
                      .filter(i => i.tipo_estoque === (activeTab === "ESTOQUE_PROPRIO" ? "PROPRIO" : "CATALOGO"))
                      .filter(i => i.item?.toLowerCase().includes(busca.toLowerCase()))
                      .map(item => (
                        <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all">
                          <td className="p-6">
                            <div className="text-sm font-black">{item.item}</div>
                            <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{item.categoria} {item.ca && `| CA: ${item.ca}`}</div>
                          </td>
                          <td className="p-6 text-center">
                            <span className={`text-base font-black ${item.quantidade <= item.estoque_minimo ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>
                              {item.quantidade || 0}
                            </span>
                          </td>
                          <td className="p-6 text-center text-xs font-bold text-[var(--text-muted)]">{item.estoque_minimo}</td>
                          <td className="p-6 text-center text-xs font-bold text-[var(--text-muted)]">{item.unidade_medida}</td>
                          <td className="p-6 text-right">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.quantidade <= item.estoque_minimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {item.quantidade <= item.estoque_minimo ? 'Crítico' : 'OK'}
                            </span>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: RECEBER CARGA (CROSS-DOCKING) */}
          {activeTab === "RECEBER_CARGA" && (
             <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl p-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-8">
                   <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600"><Truck size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black text-[var(--text-primary)]">Conferência de Carga</h3>
                      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Vincular entrada de NF com Requisições Aprovadas</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">1. Selecione a Requisição Aprovada</label>
                      <select 
                        className="input-field w-full"
                        onChange={(e) => {
                          const req = requisicoes.find(r => r.id === e.target.value);
                          setItemSelecionado(req);
                        }}
                      >
                         <option value="">Selecione uma requisição...</option>
                         {requisicoes.filter(r => r.status === 'APROVADO').map(r => (
                            <option key={r.id} value={r.id}>#{r.id.substring(0,6)} - {r.item_nome || r.item} ({r.solicitante})</option>
                         ))}
                      </select>

                      {itemSelecionado && (
                        <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Quantidade Esperada:</span>
                              <span className="text-lg font-black text-[var(--brand)]">{itemSelecionado.quantidade} {itemSelecionado.unidade_medida}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Unidade Destino:</span>
                              <span className="text-xs font-bold">{itemSelecionado.unidade_destino}</span>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">2. Informe o que chegou</label>
                      <input type="number" className="input-field w-full" placeholder="Qtd Recebida na NF" />
                      <button className="w-full btn-brand !h-14 text-sm font-black uppercase tracking-widest">
                         Confirmar Recebimento e Baixa
                      </button>
                      <p className="text-[9px] text-center text-[var(--text-muted)] uppercase font-bold tracking-widest italic mt-4">* O saldo será atualizado e a requisição passará para 'ENTREGUE'.</p>
                   </div>
                </div>
             </div>
          )}

          {/* VIEW: ENTREGA EPI (NR-06) */}
          {activeTab === "ENTREGA_EPI" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
               <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl p-8 flex flex-col gap-6">
                  <h3 className="text-xl font-black flex items-center gap-3"><UserCheck className="text-[var(--brand)]"/> 1. Identificar Colaborador</h3>
                  <select 
                    className="input-field w-full !h-14 font-black"
                    value={entregaData.colaborador}
                    onChange={e => setEntregaData({...entregaData, colaborador: e.target.value})}
                  >
                     <option value="">Selecione o Colaborador...</option>
                     {usuarios.map(u => (
                        <option key={u.id} value={u.nome}>{u.nome} ({u.cargo || 'Geral'})</option>
                     ))}
                  </select>
                  
                  <div className="relative mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input className="input-field !pl-12 !h-12 text-xs w-full" placeholder="Buscar EPI no estoque..." />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 mt-2 hide-scrollbar">
                     {estoque.filter(i => i.tipo_estoque === 'PROPRIO' && i.quantidade > 0).map(i => (
                        <div key={i.id} className="flex justify-between items-center p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] hover:border-[var(--brand)] cursor-pointer transition-all"
                             onClick={() => {
                               if(!entregaData.itens.find(it => it.id === i.id)) {
                                 setEntregaData({...entregaData, itens: [...entregaData.itens, {...i, qtd_entrega: 1}]});
                               }
                             }}>
                           <span className="text-xs font-bold">{i.item}</span>
                           <span className="text-[10px] font-black text-[var(--brand)] bg-white px-2 py-1 rounded-lg">Saldo: {i.quantidade}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl p-8 flex flex-col gap-6">
                  <h3 className="text-xl font-black flex items-center gap-3"><ShieldCheck className="text-[var(--brand)]"/> 2. Cesta de Entrega</h3>
                  
                  <div className="flex-1 space-y-4 border-2 border-dashed border-[var(--border)] rounded-2xl p-4 bg-[var(--bg-base)]/30 min-h-[200px]">
                     {entregaData.itens.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                           <div className="flex flex-col">
                              <span className="text-xs font-black">{item.item}</span>
                              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">CA: {item.ca || 'N/A'}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                className="w-12 h-8 text-center bg-[var(--bg-base)] rounded-lg text-xs font-black outline-none border border-[var(--border)]"
                                value={item.qtd_entrega}
                                onChange={e => {
                                  const newItens = [...entregaData.itens];
                                  newItens[idx].qtd_entrega = Number(e.target.value);
                                  setEntregaData({...entregaData, itens: newItens});
                                }}
                              />
                              <button onClick={() => setEntregaData({...entregaData, itens: entregaData.itens.filter((_, i) => i !== idx)})} className="text-red-500 hover:scale-110 transition-all"><X size={16}/></button>
                           </div>
                        </div>
                     ))}
                     {entregaData.itens.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50 gap-2">
                           <ShoppingBag size={32} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Cesta Vazia</span>
                        </div>
                     )}
                  </div>

                  <button 
                    disabled={loading || !entregaData.colaborador || entregaData.itens.length === 0}
                    onClick={handleBaixaEntrega}
                    className="w-full btn-brand !h-16 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-4 disabled:opacity-30"
                  >
                     <Send size={20} /> Finalizar e Imprimir Ficha
                  </button>
               </div>
            </div>
          )}

        </div>

        {/* COLUNA DIREITA - SIDEBAR */}
        <div className="xl:col-span-1 flex flex-col gap-6 no-print">
          
          {/* Identificação do Almoxarife */}
          <div className="bg-[var(--bg-card)] p-8 rounded-[1.5rem] border border-[var(--border)] shadow-xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-600 mb-4 border-2 border-[var(--border)] shadow-sm">
               <UserCheck size={32} />
            </div>
            <h3 className="font-black text-[var(--text-primary)] text-lg">{user.name || 'Setor Logístico'}</h3>
            <p className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest mt-1">Status: Logado</p>
          </div>

          {/* Estoque Crítico Alerta */}
          <div className="bg-gradient-to-br from-red-600 to-orange-500 p-8 rounded-[1.5rem] shadow-xl text-white relative overflow-hidden">
            <AlertTriangle className="absolute top-4 right-4 text-white/20" size={80} />
            <h4 className="relative z-10 font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
              <AlertTriangle size={14} /> Alerta de Reposição
            </h4>
            
            <div className="relative z-10 space-y-3">
               {itensCriticos.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="bg-black/20 p-3 rounded-xl border border-white/10 flex justify-between items-center shadow-inner">
                     <span className="text-[11px] font-bold truncate max-w-[140px]">{item.item}</span>
                     <span className="px-2 py-1 bg-white text-red-600 rounded-lg text-[10px] font-black">{item.quantidade} {item.unidade_medida}</span>
                  </div>
               ))}
               {itensCriticos.length === 0 && <p className="text-xs font-bold opacity-80 italic">Nenhum item abaixo do mínimo.</p>}
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="bg-[var(--bg-card)] p-6 rounded-[1.5rem] border border-[var(--border)] shadow-md flex flex-col gap-3">
             <button className="flex items-center gap-3 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] hover:border-[var(--brand)] transition-all text-left">
                <FileText size={16} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Norma NR-06</span>
             </button>
             <button className="flex items-center gap-3 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] hover:border-[var(--brand)] transition-all text-left">
                <ListChecks size={16} className="text-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Inventário Semanal</span>
             </button>
          </div>

        </div>

      </div>

      {/* --- MODAIS --- */}

      {/* MODAL: CADASTRO ITEM */}
      <AdaptiveModal isOpen={modalAberto === "cadastro"} onClose={() => setModalAberto(null)} title={formData.tipo_estoque === "PROPRIO" ? "Cadastrar Novo EPI / Uniforme" : "Novo Item para Catálogo"}>
         <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block ml-2">Nome do Item</label>
                  <input className="input-field" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} placeholder="Ex: Luva de Raspa G" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block ml-2">Categoria</label>
                  <input className="input-field" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} placeholder="Ex: Proteção das Mãos" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block ml-2">Saldo Inicial</label>
                  <input type="number" className="input-field" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} />
               </div>
               {formData.tipo_estoque === "PROPRIO" && (
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block ml-2">Certificado de Aprovação (CA)</label>
                    <input className="input-field" value={formData.ca} onChange={e => setFormData({...formData, ca: e.target.value})} placeholder="Nº do CA" />
                 </div>
               )}
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block ml-2">Estoque Mínimo</label>
                  <input type="number" className="input-field" value={formData.estoque_minimo} onChange={e => setFormData({...formData, estoque_minimo: Number(e.target.value)})} />
               </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
               <button onClick={handleSalvarEstoque} className="btn-brand px-12 !h-14 text-xs">Salvar Item no Estoque</button>
            </div>
         </div>
      </AdaptiveModal>

      {/* SEÇÃO OCULTA: FICHA NR-06 PARA IMPRESSÃO */}
      <div id="ficha-impressao" className="hidden print:block fixed inset-0 bg-white text-black p-12 font-serif z-[9999]">
         <div className="text-center border-b-2 border-black pb-6 mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter">ALICERCE SERVIÇOS E GESTÃO LTDA</h1>
            <p className="text-lg font-bold uppercase mt-2">Ficha de Controle de Entrega de EPI (NR-06)</p>
         </div>

         <div className="border border-black p-4 mb-8 text-sm space-y-2">
            <div><strong>COLABORADOR:</strong> <span className="uppercase">{entregaData.colaborador}</span></div>
            <div className="flex justify-between">
               <div><strong>DATA DE ENTREGA:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
               <div><strong>SETOR:</strong> Operacional</div>
            </div>
         </div>

         <table className="w-full text-left border-collapse border border-black mb-10">
            <thead>
               <tr className="bg-gray-100 text-[10px] uppercase">
                  <th className="p-2 border border-black">Equipamento (EPI)</th>
                  <th className="p-2 border border-black text-center">Qtd</th>
                  <th className="p-2 border border-black text-center">CA MTE</th>
                  <th className="p-2 border border-black text-center">Assinatura / Visto</th>
               </tr>
            </thead>
            <tbody>
               {entregaData.itens.map((item, i) => (
                  <tr key={i} className="text-xs">
                     <td className="p-2 border border-black uppercase font-bold">{item.item}</td>
                     <td className="p-2 border border-black text-center font-black">{item.qtd_entrega}</td>
                     <td className="p-2 border border-black text-center font-mono">{item.ca || '---'}</td>
                     <td className="p-2 border border-black w-32"></td>
                  </tr>
               ))}
               {[...Array(5 - entregaData.itens.length)].map((_, i) => (
                  <tr key={`empty-${i}`} className="h-8">
                     <td className="p-2 border border-black"></td>
                     <td className="p-2 border border-black"></td>
                     <td className="p-2 border border-black"></td>
                     <td className="p-2 border border-black"></td>
                  </tr>
               ))}
            </tbody>
         </table>

         <div className="text-[10px] text-justify space-y-4 mb-20 italic bg-gray-50 p-4 border border-gray-200">
            <p><strong>DECLARAÇÃO:</strong> Declaro para os devidos fins de direito, que recebi da empresa ALICERCE SERVIÇOS E GESTÃO LTDA, a título de empréstimo para meu uso exclusivo no trabalho, os equipamentos de proteção individual (EPIs) acima relacionados, em perfeitas condições de uso, obrigando-me a: </p>
            <p>1. Usá-los apenas para a finalidade a que se destinam; 2. Responsabilizar-me pela sua guarda e conservação; 3. Comunicar à empresa qualquer alteração que o torne impróprio para uso; 4. Devolvê-lo à empresa por ocasião da rescisão do contrato de trabalho ou quando solicitado.</p>
         </div>

         <div className="flex justify-around mt-10">
            <div className="w-64 border-t border-black text-center pt-2">
               <span className="text-[10px] font-bold uppercase">Assinatura da Empresa</span>
            </div>
            <div className="w-64 border-t border-black text-center pt-2">
               <span className="text-[10px] font-bold uppercase">Assinatura do Colaborador</span>
            </div>
         </div>
      </div>

    </div>
  );
}
