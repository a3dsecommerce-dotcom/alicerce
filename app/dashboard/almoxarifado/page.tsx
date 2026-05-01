"use client";
import { useState, useEffect } from "react";
import { 
  Search, Truck, Package, Activity, ShoppingBag, 
  AlertTriangle, CheckCircle2, Send, Calendar, Filter, 
  ArrowRight, Box, Clock, ChevronRight, TrendingDown, History as HistoryIcon,
  AlertCircle, FileText, UserCheck, Download, X, Plus, ClipboardList, ShieldCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function AlmoxarifadoPage() {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Tabs Array
  const TABS = [
    { id: "PAINEL", label: "Painel & Requisições", icon: Activity },
    { id: "ESTOQUE_PROPRIO", label: "Estoque Próprio (EPI)", icon: ShieldCheck },
    { id: "ESTOQUE_CATALOGO", label: "Catálogo (Suplementos)", icon: Package },
    { id: "RECEBER_CARGA", label: "Receber Carga", icon: Truck },
    { id: "ENTREGA_EPI", label: "Entrega NR-06", icon: UserCheck },
  ];
  
  const [activeTab, setActiveTab] = useState("PAINEL");
  const [mounted, setMounted] = useState(false);
  const [busca, setBusca] = useState("");
  
  // Modals state
  const [modalAberto, setModalAberto] = useState<null | "cadastro" | "analise" | "recibo">(null);
  
  // Forms and Interactivity
  const [formData, setFormData] = useState<any>({ item: "", categoria: "", quantidade: 0, estoque_minimo: 0, unidade_medida: "un", tipo: "PRODUTO" });
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState("Selecione...");
  const [buscaColab, setBuscaColab] = useState("");
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [epiCesta, setEpiCesta] = useState<{item: string, qtd: number}[]>([]);
  const [recebimentoPasso, setRecebimentoPasso] = useState<number>(1);
  const [recebimentoReq, setRecebimentoReq] = useState<any>(null);
  const [recebimentoItens, setRecebimentoItens] = useState<any[]>([]);
  const [recebItemForm, setRecebItemForm] = useState({ produto: '', qtd: '', valor: '' });
  
  const [user, setUser] = useState<any>({});
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {}

    async function fetchData() {
      const { data: estoqueData } = await supabase.from('estoque_atual').select('*').order('item');
      if (estoqueData) setEstoque(estoqueData);

      const { data: reqData } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false }).limit(50);
      if (reqData) setRequisicoes(reqData);

      const { data: users } = await supabase.from('usuarios').select('*').order('nome');
      if (users) setColaboradores(users);

      const { data: histData } = await supabase.from('historico_gestao')
        .select('*')
        .or('tipo_acao.eq.BAIXA_EPI,tipo_acao.eq.ENTRADA_ESTOQUE,tipo_acao.eq.APROVACAO_TECNICA')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (histData) {
        setLogsAuditoria(histData.map(h => ({
          id: h.id, data: h.created_at, usuario: h.executor_tel, acao: h.tipo_acao,
          colaborador: h.motivo, itens: h.para, status: "REGISTRADO"
        })));
      }

      setLoading(false);
    }
    fetchData();
    setMounted(true);
  }, []);

  const saudacao = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const handleSalvarItem = async () => {
    setLoading(true);
    try {
      const payload: any = {
        item: formData.item,
        categoria: formData.categoria,
        quantidade: formData.quantidade || 0,
        estoque_minimo: formData.estoque_minimo || 0,
        unidade_medida: formData.unidade_medida || 'un',
        tipo_estoque: formData.tipo_estoque || ((formData.tipo === "EPI" || formData.categoria === "UNIFORME") ? "PROPRIO" : "CATALOGO"),
        ca: formData.ca || null,
        coeficiente: formData.coeficiente || 1
      };
      if (formData.id) payload.id = formData.id;

      const { error } = await supabase.from('estoque_atual').upsert([payload]);
      if (error) throw error;
      
      const { data } = await supabase.from('estoque_atual').select('*').order('item');
      if (data) setEstoque(data);
      setModalAberto(null);
      alert("Item salvo com sucesso!");
    } catch (e: any) {
      alert("ERRO AO SALVAR: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBaixaEPI = async () => {
    if (epiCesta.length === 0 || colaboradorSelecionado === "Selecione...") return alert("Preencha colaborador e itens.");
    setLoading(true);
    try {
      for (const cestaItem of epiCesta) {
        const itemObj = estoque.find(i => i.item === cestaItem.item);
        if (itemObj) {
          const novaQtd = (itemObj.quantidade || 0) - cestaItem.qtd;
          await supabase.from('estoque_atual').update({ quantidade: novaQtd }).eq('id', itemObj.id);
        }
      }
      const acaoItems = epiCesta.map(i => `${i.qtd}x ${i.item}`).join(", ");
      await supabase.from('historico_gestao').insert([{
        executor_tel: user?.name || "ALMOXARIFE",
        tipo_acao: "BAIXA_EPI",
        motivo: `Entrega de EPI: ${colaboradorSelecionado}`,
        para: acaoItems
      }]);
      n8n.trigger('baixa-estoque-epi', { colaborador: colaboradorSelecionado, itens: epiCesta });
      alert("Ficha NR-06 pronta para impressão!");
      window.print();
      setEpiCesta([]);
    } catch (err: any) {
      alert("Erro ao realizar baixa: " + err.message);
    } finally {
      setLoading(false);
      const { data } = await supabase.from('estoque_atual').select('*').order('item');
      if (data) setEstoque(data);
    }
  };

  const handleFinalizarRecebimento = async () => {
    setLoading(true);
    try {
      const statusFinal = (document.getElementById('rec-status') as HTMLSelectElement).value;
      await supabase.from('requisicoes').update({ status: statusFinal }).eq('id', recebimentoReq.id);
      await supabase.from('historico_gestao').insert([{
        executor_tel: user?.name || "ALMOXARIFE",
        tipo_acao: "ENTRADA_ESTOQUE",
        motivo: `Recebimento REQ #${recebimentoReq.id.substring(0,8)}`,
        para: recebimentoItens.map(i => `${i.qtd}x ${i.produto}`).join(', ')
      }]);
      alert("Carga recebida com sucesso!");
      setRecebimentoPasso(1);
      setRecebimentoReq(null);
      setRecebimentoItens([]);
      const { data } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false }).limit(50);
      if (data) setRequisicoes(data);
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAprovarRequisicao = async (qtdAprovada: number, justificativa: string) => {
    setLoading(true);
    try {
      await supabase.from('requisicoes').update({ 
        status: 'APROVADO', 
        quantidade_aprovada: qtdAprovada,
        justificativa_ajuste: justificativa,
        analisado_por: user?.name || "Almoxarife"
      }).eq('id', itemSelecionado.id);
      alert("Requisição Aprovada!");
      setModalAberto(null);
      const { data } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false }).limit(50);
      if (data) setRequisicoes(data);
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const itensCriticos = estoque.filter(i => i.quantidade <= i.estoque_minimo);

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-32 max-w-full px-4 pt-6">
      
      {/* 1. HEADER E SAUDAÇÃO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {saudacao}, Gestão de Almoxarifado
          </h2>
          <p className="text-[11px] font-black text-[var(--brand)] uppercase tracking-widest mt-1">
            Controle Central de Suprimentos e EPIs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 no-print">
        
        {/* COLUNA ESQUERDA - CONTEÚDO PRINCIPAL (OCUPA 3 COLUNAS) */}
        <div className="xl:col-span-3 flex flex-col gap-8">
          
          {/* TABS MENU */}
          <div className="flex overflow-x-auto gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md hide-scrollbar">
            {TABS.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          {/* VIEW: PAINEL */}
          {activeTab === "PAINEL" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden">
                <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-base)]/5 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                      <ClipboardList className="text-[var(--brand)]" size={20} /> Requisições Pendentes
                  </h3>
                  <button className="btn-ghost !h-8 !text-[10px] uppercase tracking-widest">↻ Atualizar</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                      <tr>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">REQ #</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Solicitação</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
                        <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {requisicoes.filter(r => r.status !== 'ENTREGUE').length === 0 && (
                        <tr><td colSpan={4} className="p-10 text-center text-xs text-[var(--text-muted)]">Nenhuma requisição pendente no momento.</td></tr>
                      )}
                      {requisicoes.filter(r => r.status !== 'ENTREGUE').map(r => (
                        <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-all">
                          <td className="p-6 text-[11px] font-black text-[var(--text-muted)]">#{r.id.substring(0,8).toUpperCase()}</td>
                          <td className="p-6">
                            <div className="text-sm font-black">{r.item_nome || r.item}</div>
                            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Solicitante: {r.solicitante || '—'} / {r.unidade_destino || '—'}</div>
                            <div className="text-[10px] font-bold text-[var(--brand)] mt-1">Qtd Solicitada: {r.quantidade} {r.unidade_medida || 'UN'}</div>
                          </td>
                          <td className="p-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.status === 'APROVADO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {r.status || 'PENDENTE'}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <button 
                              onClick={() => { setItemSelecionado(r); setModalAberto("analise"); }}
                              className="px-4 py-2 bg-[var(--bg-base)] text-[var(--brand)] border border-[var(--border)] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[var(--brand)] hover:text-white transition-all shadow-sm"
                            >
                              Analisar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ESTOQUE PRÓPRIO */}
          {activeTab === "ESTOQUE_PROPRIO" && (
            <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-base)]/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <ShieldCheck className="text-[var(--brand)]" size={20} /> EPIs e Uniformes
                </h3>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input className="input-field !pl-10 !h-10 text-xs w-full" placeholder="Buscar EPI..." value={busca} onChange={e => setBusca(e.target.value)} />
                  </div>
                  <button 
                    onClick={() => { setFormData({ tipo: "EPI", item: "", categoria: "EPI", quantidade: 0, estoque_minimo: 10, unidade_medida: "un", ca: "", coeficiente: 1, tipo_estoque: "PROPRIO" }); setModalAberto("cadastro"); }}
                    className="h-10 px-6 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-md whitespace-nowrap"
                  >
                    <Plus size={14} /> Novo EPI
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Item / Descrição</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">CA/Ref</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Saldo Atual</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Mínimo</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {estoque.filter(i => i.tipo_estoque === "PROPRIO" && (i.item || "").toLowerCase().includes(busca.toLowerCase())).map(item => (
                      <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all">
                        <td className="p-6">
                          <div className="text-sm font-black">{item.item}</div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{item.categoria}</div>
                        </td>
                        <td className="p-6 text-center text-xs font-bold text-[var(--text-muted)]">{item.ca || "-"}</td>
                        <td className="p-6 text-center text-base font-black text-[var(--text-primary)]">{item.quantidade} <span className="text-[10px] text-[var(--text-muted)]">{item.unidade_medida}</span></td>
                        <td className="p-6 text-center text-xs font-bold text-[var(--text-muted)]">{item.estoque_minimo}</td>
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.quantidade <= item.estoque_minimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {item.quantidade <= item.estoque_minimo ? 'ALERTA REPOSIÇÃO' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: ESTOQUE CATÁLOGO */}
          {activeTab === "ESTOQUE_CATALOGO" && (
            <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
              <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-base)]/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Package className="text-[var(--brand)]" size={20} /> Suplementos (Secretarias)
                </h3>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input className="input-field !pl-10 !h-10 text-xs w-full" placeholder="Buscar Suplemento..." value={busca} onChange={e => setBusca(e.target.value)} />
                  </div>
                  <button 
                    onClick={() => { setFormData({ tipo: "PRODUTO", item: "", categoria: "Higiene", quantidade: 0, estoque_minimo: 10, unidade_medida: "un", ca: "", coeficiente: 1, tipo_estoque: "CATALOGO" }); setModalAberto("cadastro"); }}
                    className="h-10 px-6 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-md whitespace-nowrap"
                  >
                    <Plus size={14} /> Novo Suplemento
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Suplemento / Descrição</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Und.</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Controle</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Visibilidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {estoque.filter(i => i.tipo_estoque === "CATALOGO" && (i.item || "").toLowerCase().includes(busca.toLowerCase())).map(item => (
                      <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all">
                        <td className="p-6">
                          <div className="text-sm font-black">{item.item}</div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{item.categoria}</div>
                        </td>
                        <td className="p-6 text-center text-xs font-bold text-[var(--text-muted)]">{item.unidade_medida}</td>
                        <td className="p-6 text-center">
                          <span className="px-3 py-1 bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border)] rounded-md text-[9px] font-black uppercase tracking-widest">Fluxo Direto (Cross-docking)</span>
                        </td>
                        <td className="p-6 text-center">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase tracking-widest">ATIVO P/ COMPRADOR</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: RECEBER CARGA */}
          {activeTab === "RECEBER_CARGA" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden p-8">
                <div className="flex justify-between items-center mb-8 border-b border-[var(--border)] pb-6">
                  <div>
                    <h3 className="text-xl font-black text-[var(--text-primary)]">Receber Carga (Logística)</h3>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Conferência e Anexação de NF</p>
                  </div>
                  {recebimentoPasso > 1 && (
                    <button className="btn-ghost" onClick={() => { setRecebimentoPasso(1); setRecebimentoReq(null); setRecebimentoItens([]); }}>← Voltar para Lista</button>
                  )}
                </div>

                {recebimentoPasso === 1 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-[var(--border)] rounded-xl overflow-hidden">
                      <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                        <tr>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">REQ #</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">SOLICITANTE</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">STATUS</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">AÇÃO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {requisicoes.filter(r => r.status !== 'ENTREGUE').map(r => (
                          <tr key={r.id} className="hover:bg-[var(--bg-base)]/30">
                            <td className="p-4 text-xs font-black">#{r.id.substring(0,8).toUpperCase()}</td>
                            <td className="p-4">
                              <div className="text-sm font-bold">{r.item_nome || r.item}</div>
                              <div className="text-[10px] text-[var(--text-muted)] uppercase mt-1">{r.unidade_destino || r.unidade}</div>
                            </td>
                            <td className="p-4 text-center"><span className="badge badge-orange">{r.status}</span></td>
                            <td className="p-4 text-right">
                              <button className="btn-brand !h-8 !px-4 !text-[10px]" onClick={() => { setRecebimentoReq(r); setRecebimentoPasso(2); }}>Dar Entrada</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {recebimentoPasso === 2 && (
                  <div className="flex flex-col gap-6">
                    <div className="p-6 bg-[var(--brand)] text-white rounded-2xl">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Requisição Vinculada</div>
                      <div className="text-lg font-black">{recebimentoReq.item_nome || recebimentoReq.item}</div>
                      <div className="text-sm font-bold opacity-90 mt-1">Destino: {recebimentoReq.unidade_destino || recebimentoReq.unidade}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-[var(--bg-base)]/50 p-6 rounded-2xl border border-[var(--border)]">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Produto Constante na NF</label>
                        <input className="input-field" placeholder="Ex: Caderno 10 Matérias" value={recebItemForm.produto} onChange={e => setRecebItemForm({...recebItemForm, produto: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Qtd</label>
                        <input type="number" className="input-field" placeholder="0" value={recebItemForm.qtd} onChange={e => setRecebItemForm({...recebItemForm, qtd: e.target.value})} />
                      </div>
                      <button className="btn-brand !h-12 w-full" onClick={() => {
                        if(!recebItemForm.produto || !recebItemForm.qtd) return;
                        setRecebimentoItens([...recebimentoItens, { produto: recebItemForm.produto, qtd: Number(recebItemForm.qtd) }]);
                        setRecebItemForm({ produto: '', qtd: '', valor: '' });
                      }}>+ Adicionar</button>
                    </div>

                    <table className="w-full text-left border border-[var(--border)] rounded-xl overflow-hidden">
                      <thead className="bg-[var(--bg-base)]">
                        <tr>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Produto Conferido</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">Quantidade</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {recebimentoItens.map((i, idx) => (
                          <tr key={idx}>
                            <td className="p-4 text-sm font-bold">{i.produto}</td>
                            <td className="p-4 text-center font-black text-lg text-[var(--brand)]">{i.qtd}</td>
                            <td className="p-4 text-right"><button className="text-[var(--danger)] text-xs font-bold uppercase" onClick={() => setRecebimentoItens(recebimentoItens.filter((_, index) => index !== idx))}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Status Final da Requisição</label>
                        <select id="rec-status" className="input-field border-2 border-[var(--brand)] text-[var(--brand)] font-black">
                          <option value="ANDAMENTO">Parcial (Manter em Andamento)</option>
                          <option value="ENTREGUE">Total (Finalizar Requisição)</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button className="btn-brand w-full !h-12 text-sm" disabled={recebimentoItens.length === 0} onClick={handleFinalizarRecebimento}>Gravar Recebimento e NF</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: ENTREGA EPI (NR-06) */}
          {activeTab === "ENTREGA_EPI" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl p-8 flex flex-col gap-6">
                <h3 className="text-xl font-black flex items-center gap-3"><UserCheck className="text-[var(--brand)]"/> 1. Identificar Colaborador</h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input className="input-field !pl-12 !h-14 font-bold" placeholder="Digite o nome do colaborador..." value={buscaColab} onChange={(e) => { setBuscaColab(e.target.value); setShowSugestoes(true); }} onFocus={() => setShowSugestoes(true)} />
                  {showSugestoes && buscaColab.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl mt-2 shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                      {colaboradores.filter(c => (c.nome || "").toLowerCase().includes(buscaColab.toLowerCase())).map(c => (
                        <div key={c.id} onClick={() => { setColaboradorSelecionado(c.nome); setBuscaColab(c.nome); setShowSugestoes(false); }} className="p-4 border-b border-[var(--border)] hover:bg-[var(--bg-base)] cursor-pointer">
                          <div className="text-sm font-bold">{c.nome}</div>
                          <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-widest mt-1">{c.cargo}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {colaboradorSelecionado !== "Selecione..." && (
                  <div className="p-6 bg-[var(--bg-base)] rounded-xl border border-[var(--brand)]/30 text-center">
                    <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2">Colaborador Selecionado</div>
                    <div className="text-lg font-black text-[var(--brand)]">{colaboradorSelecionado}</div>
                  </div>
                )}
              </div>

              <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl p-8 flex flex-col gap-6">
                <h3 className="text-xl font-black flex items-center gap-3"><ShieldCheck className="text-[var(--brand)]"/> 2. Adicionar EPIs da Cesta</h3>
                <div className="flex gap-2">
                  <select id="epi-sel" className="input-field flex-1 font-bold">
                    {estoque.filter(i => i.tipo_estoque === 'PROPRIO').map(i => <option key={i.id} value={i.item}>{i.item} (Saldo: {i.quantidade})</option>)}
                  </select>
                  <button className="btn-brand !h-12 !px-6" onClick={() => { const i = (document.getElementById('epi-sel') as HTMLSelectElement).value; setEpiCesta([...epiCesta, { item: i, qtd: 1 }]); }}>+</button>
                </div>
                <div className="border border-[var(--border)] rounded-xl p-4 min-h-[150px] bg-[var(--bg-base)]/30">
                  {epiCesta.map((e, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-[var(--border)] last:border-0 bg-white rounded-lg mb-2 shadow-sm">
                      <span className="text-xs font-bold">{e.item}</span>
                      <span className="px-3 py-1 bg-[var(--brand)]/10 text-[var(--brand)] rounded-full text-xs font-black">{e.qtd} un</span>
                    </div>
                  ))}
                  {epiCesta.length === 0 && <div className="h-full flex items-center justify-center text-xs font-bold text-[var(--text-muted)] opacity-50">Cesta Vazia</div>}
                </div>
                <button className="btn-brand w-full !h-14 text-sm" disabled={epiCesta.length === 0 || colaboradorSelecionado === "Selecione..."} onClick={handleBaixaEPI}>Gerar Ficha NR-06 & Baixar Estoque</button>
              </div>
            </div>
          )}

        </div>

        {/* COLUNA DIREITA - SIDEBAR DE ALARMES */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-red-600 to-orange-500 p-8 rounded-[1.5rem] shadow-xl text-white relative overflow-hidden">
            <AlertTriangle className="absolute top-4 right-4 text-white/20" size={80} />
            <h4 className="relative z-10 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2 drop-shadow-md">
              <AlertTriangle size={16} /> Estoque Crítico
            </h4>
            <div className="relative z-10 flex flex-col gap-3">
              {itensCriticos.slice(0,4).map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <span className="text-[11px] font-bold leading-tight max-w-[120px]">{item.item}</span>
                  <span className="px-2 py-1 bg-white text-red-600 rounded-md text-[10px] font-black">{item.quantidade} {item.unidade_medida}</span>
                </div>
              ))}
              {itensCriticos.length === 0 && <p className="text-xs font-bold opacity-80">Nenhum item em nível crítico.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CADASTRO */}
      <AdaptiveModal isOpen={modalAberto === "cadastro"} onClose={() => setModalAberto(null)} title={formData.tipo_estoque === "PROPRIO" ? "Novo EPI / Uniforme" : "Novo Suplemento (Catálogo)"}>
        <div className="p-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Nome / Descrição</label>
              <input type="text" className="input-field font-bold" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} placeholder="Ex: Papel A4" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Categoria</label>
              <input type="text" className="input-field" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Und. Medida</label>
              <select className="input-field" value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})}>
                <option value="un">Unidade</option><option value="cx">Caixa</option><option value="fd">Fardo</option><option value="par">Par</option>
              </select>
            </div>
            {formData.tipo_estoque === "PROPRIO" && (
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--brand)] mb-2 block">C.A. (MTE) - Apenas EPI</label>
                <input type="text" className="input-field border-[var(--brand)]" value={formData.ca || ''} onChange={e => setFormData({...formData, ca: e.target.value})} placeholder="Numeração do CA" />
              </div>
            )}
            <div className="col-span-2 mt-4 flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setModalAberto(null)}>Cancelar</button>
              <button className="btn-brand px-8" onClick={handleSalvarItem} disabled={loading}>{loading ? 'Salvando...' : 'Salvar no Banco'}</button>
            </div>
          </div>
        </div>
      </AdaptiveModal>

      {/* MODAL: ANÁLISE DE REQUISIÇÃO */}
      <AdaptiveModal isOpen={modalAberto === "analise"} onClose={() => setModalAberto(null)} title="Aprovação Técnica de Requisição">
        <div className="p-8 flex flex-col gap-6">
          <div className="p-4 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl">
            <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Solicitado</div>
            <div className="text-lg font-black text-[var(--text-primary)]">{itemSelecionado?.item_nome || itemSelecionado?.item}</div>
            <div className="text-xs font-bold text-[var(--brand)] mt-1">{itemSelecionado?.quantidade} {itemSelecionado?.unidade_medida}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Aprovar Quantidade</label>
              <input id="input-qtd-aprovada" type="number" className="input-field text-lg font-black border-2 border-[var(--brand)]" defaultValue={itemSelecionado?.quantidade || 0} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Justificativa de Ajuste (Se alterar Qtd)</label>
              <textarea id="justificativa-ajuste" className="input-field min-h-[80px]" placeholder="Motivo do corte ou ajuste..." />
            </div>
            <div className="col-span-2 flex justify-end gap-3 mt-4">
              <button className="btn-ghost" onClick={() => setModalAberto(null)}>Cancelar</button>
              <button className="btn-brand px-8" onClick={() => {
                handleAprovarRequisicao(Number((document.getElementById('input-qtd-aprovada') as HTMLInputElement).value), (document.getElementById('justificativa-ajuste') as HTMLTextAreaElement).value);
              }} disabled={loading}>Autorizar Pedido</button>
            </div>
          </div>
        </div>
      </AdaptiveModal>

      {/* IMPRESSÃO DA FICHA NR-06 */}
      <div id="documento-oficial" className="hidden print:block bg-white text-black absolute top-0 left-0 w-full h-full p-8 font-sans">
        <div className="text-center border-b-2 border-black pb-4 mb-8">
          <h1 className="text-2xl font-black uppercase">ALICERCE SERVIÇOS E GESTÃO LTDA</h1>
          <p className="text-lg font-bold uppercase mt-2">Ficha de Controle de Entrega de EPI (NR-06)</p>
        </div>
        <div className="border border-black p-4 mb-8 text-sm">
          <div className="mb-2"><strong>COLABORADOR:</strong> <span className="uppercase">{colaboradorSelecionado}</span></div>
          <div><strong>DATA:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
        </div>
        <table className="w-full text-left border-collapse border border-black mb-8">
          <thead>
            <tr className="bg-black text-white text-xs uppercase">
              <th className="p-2 border border-black">EPI / Descrição</th>
              <th className="p-2 border border-black text-center">Qtd</th>
              <th className="p-2 border border-black text-center">C.A. MTE</th>
            </tr>
          </thead>
          <tbody>
            {epiCesta.map((e, i) => (
              <tr key={i}>
                <td className="p-2 border border-black text-sm uppercase">{e.item}</td>
                <td className="p-2 border border-black text-center font-bold text-sm">{e.qtd}</td>
                <td className="p-2 border border-black text-center text-sm">Validar no CA</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-justify bg-gray-100 p-4 border border-gray-300 mb-16">
          <strong>DECLARAÇÃO:</strong> Declaro ter recebido da ALICERCE SERVIÇOS E GESTÃO LTDA os EPIs acima, em perfeito estado, obrigando-me a usá-los conforme NR-06.
        </div>
        <div className="flex justify-between px-10">
          <div className="text-center border-t-2 border-black pt-2 w-64">
            <strong>ALICERCE (EMISSOR)</strong>
          </div>
          <div className="text-center border-t-2 border-black pt-2 w-64">
            <strong>{colaboradorSelecionado.toUpperCase()}</strong>
          </div>
        </div>
      </div>
      
    </div>
  );
}
