"use client";
import { useState, useEffect } from "react";
import { 
  Search, Truck, Package, Megaphone, Activity, ShoppingBag, 
  AlertTriangle, CheckCircle2, Send, Calendar, Filter, 
  ArrowRight, Box, Clock, ChevronRight, TrendingDown, History as HistoryIcon,
  AlertCircle, FileText, UserCheck, Download, X, Eye
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function ComprasModule({ reducao }: { reducao: number }) {
  const [requisicoesRaw, setRequisicoesRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({});
  const [activeTab, setActiveTab] = useState<"CATALOGO" | "TRACKING">("CATALOGO");
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [volumesExtra, setVolumesExtra] = useState<Record<string, number>>({});
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().substring(0, 7));
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [qtdAsg, setQtdAsg] = useState<number>(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {}
    fetchDados();
  }, [filtroMes]);

  async function fetchDados() {
    setLoading(true);
    // 1. Fetch Catálogo
    const { data: catData } = await supabase.from('estoque_atual').select('*').eq('tipo_estoque', 'CATALOGO').order('item');
    if (catData) setCatalogo(catData);

    // 2. Fetch Requisições do usuário logado
    const { data: reqData } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false });
    if (reqData) setRequisicoesRaw(reqData);
    setLoading(false);
  }

  // Agrupar requisições por protocolo para a visão de Tracking
  const requisicoesAgrupadas = requisicoesRaw.reduce((acc: any[], current: any) => {
    const proto = current.protocolo || 'SEM-PROTOCOLO';
    let group = acc.find(g => g.protocolo === proto);
    if (!group) {
      group = { 
        protocolo: proto, 
        data: new Date(current.data_solicitacao).toLocaleDateString(),
        status_geral: current.status,
        itens: [] 
      };
      acc.push(group);
    }
    group.itens.push(current);
    // Lógica simples de status do grupo
    if (current.status === 'SOLICITADO' && group.status_geral !== 'SOLICITADO') group.status_geral = 'EM ANÁLISE';
    return acc;
  }, []);

  const handleFinalizarPedido = async () => {
    const todosItensId = Array.from(new Set([...Object.keys(volumes), ...Object.keys(volumesExtra)]));
    const itensParaPedir = todosItensId.filter(id => (volumes[id] || 0) > 0 || (volumesExtra[id] || 0) > 0);
    
    if (itensParaPedir.length === 0) return alert("Selecione volumes antes de finalizar.");
    setLoading(true);

    try {
      const protocoloUnico = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = itensParaPedir.map(id => {
        const item = catalogo.find(c => String(c.id) === id);
        const qtdNormal = volumes[id] || 0;
        const qtdExtra = volumesExtra[id] || 0;
        
        return {
          item_id: id,
          solicitante: user?.name || 'Comprador',
          unidade_destino: user?.email || 'Unidade',
          quantidade: qtdNormal,
          quantidade_extra: qtdExtra,
          status: 'SOLICITADO',
          item_nome: item?.item || 'Item',
          unidade_medida: item?.unidade_medida || 'UN',
          protocolo: protocoloUnico,
          data_solicitacao: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('requisicoes').insert(payload);
      if (error) throw error;

      setVolumes({});
      setVolumesExtra({});
      setActiveTab("TRACKING");
      fetchDados();
      alert(`✅ Pedido ${protocoloUnico} enviado para análise do Almoxarifado.`);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-32 max-w-full px-4">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] italic tracking-tight">
            Painel de Compras Operacionais
          </h2>
          <p className="text-[11px] font-black text-[var(--brand)] uppercase tracking-widest mt-1">
            Status: {requisicoesRaw.length} Requisições Geradas este mês
          </p>
        </div>

        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md">
          <button onClick={() => setActiveTab("CATALOGO")} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "CATALOGO" ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
            <ShoppingBag size={16} /> Catálogo
          </button>
          <button onClick={() => setActiveTab("TRACKING")} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "TRACKING" ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
            <Truck size={16} /> Acompanhamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 flex flex-col gap-8">
          
          {activeTab === "CATALOGO" ? (
            <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
                <div className="p-10 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-base)]/5">
                   <div>
                      <h3 className="text-xl font-black uppercase italic">Solicitação de Materiais</h3>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Selecione os itens e quantidades limitados pelo coeficiente</p>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="flex flex-col text-right">
                         <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Nº de Colaboradores ASG</label>
                         <input type="number" min="1" value={qtdAsg} onChange={e => setQtdAsg(Math.max(1, Number(e.target.value)))} className="input-field !h-10 !w-24 text-center font-black" />
                      </div>
                      <button onClick={handleFinalizarPedido} disabled={loading || (Object.values(volumes).every(v => v === 0) && Object.values(volumesExtra).every(v => v === 0))} className="h-14 px-10 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-30">
                         <Send size={18} /> Enviar Requisição
                      </button>
                   </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                        <tr>
                            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Registro</th>
                            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Descrição do Material</th>
                            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Unidade</th>
                            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Cota Máx.</th>
                            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Qtd. Cota</th>
                            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Extra (Análise)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {catalogo.map((prod) => {
                          const cotaMaxima = Math.floor(qtdAsg * (prod.coeficiente || 1.0));
                          const volAtual = volumes[prod.id] || 0;
                          const volExtra = volumesExtra[prod.id] || 0;
                          
                          return (
                            <tr key={prod.id} className="hover:bg-[var(--bg-base)]/40 transition-all">
                                <td className="p-8 text-center text-xs font-bold font-mono text-[var(--text-muted)]">{prod.codigo_registro || '---'}</td>
                                <td className="p-8 px-10">
                                  <div className="flex flex-col">
                                      <div className="text-sm font-black whitespace-normal max-w-[400px]">
                                         {prod.item}
                                      </div>
                                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 ml-1">{prod.categoria}</span>
                                  </div>
                                </td>
                                <td className="p-8 text-center text-xs font-black text-[var(--text-muted)]">{prod.unidade_medida}</td>
                                <td className="p-8 text-center">
                                  <span className="text-sm font-black text-blue-600">{cotaMaxima}</span>
                                </td>
                                <td className="p-8 px-5">
                                  <input type="number" min="0" max={cotaMaxima} value={volAtual || ''} onChange={(e) => {
                                    const val = Math.min(Number(e.target.value), cotaMaxima);
                                    setVolumes({...volumes, [prod.id]: val});
                                  }} className="w-24 h-12 px-2 mx-auto rounded-xl border-2 border-transparent bg-[var(--bg-base)] text-center text-sm font-black outline-none focus:border-blue-500 text-[var(--text-primary)] transition-all block" placeholder="0" />
                                </td>
                                <td className="p-8 px-5 border-l border-[var(--border)] bg-orange-50/30">
                                  <input type="number" min="0" value={volExtra || ''} onChange={(e) => {
                                    setVolumesExtra({...volumesExtra, [prod.id]: Number(e.target.value)});
                                  }} className="w-24 h-12 px-2 mx-auto rounded-xl border-2 border-orange-200 bg-white text-orange-600 text-center text-sm font-black outline-none focus:border-orange-500 transition-all block shadow-sm shadow-orange-500/10" placeholder="0" />
                                </td>
                            </tr>
                          );
                        })}
                      </tbody>
                  </table>
                </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
               <div className="p-10 border-b border-[var(--border)] bg-[var(--bg-base)]/5">
                  <h3 className="text-xl font-black uppercase italic">Evolução dos Pedidos</h3>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Acompanhe a análise do almoxarifado e o status de entrega</p>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                        <tr>
                           <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Protocolo</th>
                           <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Data</th>
                           <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Resumo</th>
                           <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
                           <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ação</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border)]">
                        {requisicoesAgrupadas.map((g, i) => (
                           <tr key={i} className="hover:bg-[var(--bg-base)]/30 transition-all">
                              <td className="p-8 text-center"><span className="text-sm font-black text-[var(--brand)]">{g.protocolo}</span></td>
                              <td className="p-8 text-center text-xs font-bold text-[var(--text-muted)]">{g.data}</td>
                              <td className="p-8"><div className="text-xs font-black">{g.itens.length} {g.itens.length === 1 ? 'Item Solicitado' : 'Itens Solicitados'}</div></td>
                              <td className="p-8 text-center">
                                 <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${g.status_geral === 'SOLICITADO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {g.status_geral}
                                 </span>
                              </td>
                              <td className="p-8 text-right">
                                 <button onClick={() => setSelectedProtocol(g)} className="p-3 bg-[var(--bg-base)] text-[var(--brand)] rounded-xl hover:bg-[var(--brand)] hover:text-white transition-all border border-[var(--border)]"><Eye size={16}/></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

        </div>

        {/* SIDEBAR */}
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl text-center">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 border-4 border-white shadow-lg">
                 <User size={40} />
              </div>
              <h4 className="text-lg font-black uppercase">{user.name || 'Setor Admin'}</h4>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{user.role || 'Colaborador'}</p>
           </div>
        </div>
      </div>

      <AdaptiveModal isOpen={!!selectedProtocol} onClose={() => setSelectedProtocol(null)} title="Detalhamento da Requisição">
         <div className="p-10 space-y-8">
            <div className="flex justify-between border-b border-[var(--border)] pb-8">
               <div><h4 className="text-2xl font-black italic">Protocolo {selectedProtocol?.protocolo}</h4><p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Solicitado em: {selectedProtocol?.data}</p></div>
               <div className="text-right text-[10px] font-black uppercase"><p className="text-[var(--text-muted)]">Status do Pedido</p><p className="text-orange-600 text-sm">{selectedProtocol?.status_geral}</p></div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-[var(--bg-base)]/50">
                     <tr>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Produto</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Pedido Base</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Extra (Análise)</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Aprovado</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                     {selectedProtocol?.itens.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[var(--bg-base)]/50">
                           <td className="p-6">
                              <p className="text-xs font-black">{it.item_nome}</p>
                              {it.data_entrega && <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mt-1">Entregue para: {it.recebedor_nome || 'Unidade'}</p>}
                           </td>
                           <td className="p-6 text-center text-xs font-bold text-[var(--text-muted)]">{it.quantidade}</td>
                           <td className="p-6 text-center text-xs font-black text-orange-500">{it.quantidade_extra > 0 ? `+${it.quantidade_extra}` : '---'}</td>
                           <td className="p-6 text-center text-xs font-black text-blue-600">{it.quantidade_aprovada ?? '---'}</td>
                           <td className="p-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${it.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}`}>{it.status}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </AdaptiveModal>
    </div>
  );
}
