"use client";
import { useState, useEffect } from "react";
import { 
  Search, Truck, Package, Megaphone, Activity, ShoppingBag, 
  AlertTriangle, CheckCircle2, Send, Calendar, Filter, 
  ArrowRight, Box, Clock, ChevronRight, TrendingDown, History as HistoryIcon,
  AlertCircle, FileText, UserCheck, Download, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function ComprasModule({ reducao }: { reducao: number }) {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"CATALOGO" | "TRACKING">("CATALOGO");
  const [volumes, setVolumes] = useState<Record<number, number>>({});
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().substring(0, 7));
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  const catalogoMock = [
    { id: 1, nome: "Papel A4 (Resma)", unidade: "UN", cota: 42, categoria: "Escritório" },
    { id: 2, nome: "Copo Descartável 200ml", unidade: "CX", cota: 8, categoria: "Copa" },
    { id: 3, nome: "Caneta Esferográfica Azul", unidade: "CX", cota: 4, categoria: "Escritório" },
    { id: 4, nome: "Papel Higiênico (Fardo)", unidade: "FD", cota: 15, categoria: "Limpeza" },
    { id: 5, nome: "Detergente Líquido 500ml", unidade: "FR", cota: 24, categoria: "Limpeza" },
    { id: 6, nome: "Saco de Lixo 100L (Fardo)", unidade: "FD", cota: 10, categoria: "Limpeza" },
    { id: 7, nome: "Água Mineral 500ml", unidade: "FD", cota: 12, categoria: "Copa" },
  ];

  const acompanhamentoMock = [
    { id: 101, data: "26/04/2026", nf: "NF-8821", desc: "Kit de Materiais de Escritório Mensal", solicitado: 120, chegou: 45, status: "EM_ROTA", recebedor: "Carlos Silva (Almox. 01)" },
    { id: 102, data: "24/04/2026", nf: "NF-8790", desc: "Suprimentos de Limpeza Completo", solicitado: 200, chegou: 180, status: "PENDENTE", recebedor: "Mariana Costa (Almox. 02)" },
    { id: 103, data: "22/04/2026", nf: "NF-8655", desc: "Copo Descartável e Insumos de Copa", solicitado: 50, chegou: 50, status: "CONCLUIDO", recebedor: "Carlos Silva (Almox. 01)" },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPedidos(acompanhamentoMock);
      setLoading(false);
    }, 800);
  }, [filtroMes]);

  const handleVolumeChange = (id: number, val: string) => {
    const num = parseInt(val) || 0;
    setVolumes(prev => ({ ...prev, [id]: num }));
  };

  const handleFinalizarPedido = async () => {
    const itensParaPedir = Object.entries(volumes).filter(([_, vol]) => vol > 0);
    if (itensParaPedir.length === 0) return alert("Selecione volumes antes de finalizar.");
    setLoading(true);
    setTimeout(() => {
      setVolumes({});
      setActiveTab("TRACKING");
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-32 max-w-full px-4">
      
      {/* 1. HEADER */}
      <div className="relative group bg-gradient-to-br from-[var(--brand)] to-blue-800 p-12 rounded-[1.5rem] shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
           <div className="space-y-4 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                 <Box size={14} /> Logística Soberana
              </div>
              <h2 className="text-5xl font-black tracking-tighter italic leading-tight">Portal de Suprimentos</h2>
              <p className="text-sm md:text-base font-medium opacity-90 leading-relaxed">
                 Gestão de cotas operacionais e acompanhamento detalhado de remessas.
              </p>
           </div>
           
           <div className="flex flex-wrap justify-center gap-4">
              <button className="h-16 px-10 bg-white text-[var(--brand)] rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/20 flex items-center gap-3">
                 <AlertTriangle size={20} /> Gerar Ocorrência
              </button>
           </div>
        </div>
      </div>

      {/* 2. TABS E FINALIZAR (UNIFICADOS NO TOPO) */}
      <div className="flex flex-wrap justify-between items-center gap-8 px-2">
         <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md flex-1 lg:flex-none">
            <button 
              onClick={() => setActiveTab("CATALOGO")}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "CATALOGO" ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <ShoppingBag size={16} /> Fazer Pedido
            </button>
            <button 
              onClick={() => setActiveTab("TRACKING")}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "TRACKING" ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <Truck size={16} /> Acompanhamento
            </button>

            {/* BOTÃO FINALIZAR AGORA AO LADO DAS ABAS */}
            {activeTab === "CATALOGO" && (
              <div className="hidden lg:flex items-center border-l border-[var(--border)] ml-2 pl-4">
                 <button 
                   onClick={handleFinalizarPedido}
                   disabled={loading || Object.values(volumes).every(v => v === 0)}
                   className="h-11 px-8 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-600/20 disabled:opacity-30"
                 >
                    <Send size={14} /> Finalizar Pedido
                 </button>
              </div>
            )}
         </div>

         {/* BOTÃO FINALIZAR MOBILE / ADICIONAL */}
         {activeTab === "CATALOGO" && (
           <div className="lg:hidden w-full">
             <button 
               onClick={handleFinalizarPedido}
               className="w-full h-14 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3"
             >
                <Send size={16} /> Finalizar Pedido
             </button>
           </div>
         )}

         <div className="flex items-center gap-4 bg-[var(--bg-card)] p-2 px-6 rounded-2xl border border-[var(--border)] shadow-md">
            <Calendar size={18} className="text-[var(--brand)]" />
            <input 
              type="month" 
              value={filtroMes} 
              onChange={(e) => setFiltroMes(e.target.value)}
              className="bg-transparent border-none text-xs font-black uppercase outline-none cursor-pointer text-[var(--text-primary)]"
            />
         </div>
      </div>

      {/* 3. CONTEÚDO DINÂMICO */}
      <div className="flex-1 animate-fade-in">
         
         {/* VIEW: CATÁLOGO */}
         {activeTab === "CATALOGO" && (
            <div className="flex flex-col gap-8">
               <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden">
                  <div className="p-10 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-8 bg-[var(--bg-base)]/5">
                     <h3 className="text-sm font-black uppercase tracking-widest">Catálogo de Produtos</h3>
                     <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input className="input-field !pl-12 !h-14 text-sm" placeholder="O que você precisa?" />
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                           <tr>
                              <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Material / Descrição</th>
                              <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Und.</th>
                              <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Cota Máxima</th>
                              <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Volume Desejado</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                           {catalogoMock.map((prod) => {
                              const vol = volumes[prod.id] || 0;
                              const isExcedente = vol > prod.cota;
                              return (
                                 <tr key={prod.id} className={`transition-all ${isExcedente ? 'bg-orange-50' : 'hover:bg-blue-50/20'}`}>
                                    <td className="p-8 px-12 min-w-[300px]">
                                       <div className="flex flex-col gap-1 text-center lg:text-left">
                                          <span className="text-sm font-black text-[var(--text-primary)] leading-relaxed whitespace-normal">{prod.nome}</span>
                                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{prod.categoria}</span>
                                       </div>
                                    </td>
                                    <td className="p-8 text-center">
                                       <span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg text-[10px] font-black text-[var(--text-muted)]">{prod.unidade}</span>
                                    </td>
                                    <td className="p-8 text-center">
                                       <span className="text-base font-black text-[var(--text-primary)]">{prod.cota}</span>
                                    </td>
                                    <td className="p-8 px-12">
                                       <div className="relative max-w-[150px] mx-auto">
                                          <input 
                                             type="number" 
                                             value={vol || ''}
                                             onChange={(e) => handleVolumeChange(prod.id, e.target.value)}
                                             className={`w-full h-12 px-5 rounded-xl border-2 text-sm font-black outline-none transition-all ${isExcedente ? 'border-orange-500 bg-white text-orange-600 shadow-lg shadow-orange-500/20' : 'border-transparent bg-[var(--bg-base)] focus:border-[var(--brand)] focus:bg-white'}`}
                                             placeholder="0"
                                          />
                                          {isExcedente && (
                                             <div className="absolute -top-7 right-0 animate-bounce">
                                                <span className="px-2 py-0.5 bg-orange-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md">Sob Análise</span>
                                             </div>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* VIEW: ACOMPANHAMENTO */}
         {activeTab === "TRACKING" && (
            <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-fade-in">
               <div className="p-10 border-b border-[var(--border)] bg-[var(--bg-base)]/5 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                     <HistoryIcon className="text-[var(--brand)]" size={20} /> Histórico Logístico Detalhado
                  </h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                        <tr>
                           <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Data / NF</th>
                           <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Material e Recebedor</th>
                           <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status / Saldo</th>
                           <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Progresso</th>
                           <th className="p-8 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Relatório</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border)]">
                        {loading ? (
                           <tr><td colSpan={5} className="p-20 text-center text-xs italic">Sincronizando dados...</td></tr>
                        ) : pedidos.map((p) => {
                           const falta = p.solicitado - p.chegou;
                           const percent = Math.round((p.chegou / p.solicitado) * 100);
                           const emAberto = falta > 0;

                           return (
                              <tr key={p.id} className={`transition-all ${emAberto ? 'bg-blue-50/50' : 'hover:bg-blue-50/10'}`}>
                                 <td className="p-8 text-center min-w-[120px]">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[11px] font-black text-[var(--text-primary)]">{p.data}</span>
                                       <span className="text-[9px] font-bold text-[var(--brand)] uppercase tracking-widest">{p.nf}</span>
                                    </div>
                                 </td>
                                 <td className="p-8 px-12 min-w-[350px]">
                                    <div className="flex flex-col gap-2">
                                       <div className="flex items-center gap-3">
                                          {emAberto && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shrink-0 shadow-lg shadow-blue-500/50" />}
                                          <span className="text-sm font-black text-[var(--text-primary)] leading-tight">{p.desc}</span>
                                       </div>
                                       <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                          <UserCheck size={12} className="text-green-600" />
                                          <span className="text-[9px] font-bold uppercase tracking-widest">Recebido por: {p.recebedor}</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-8 text-center min-w-[180px]">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${emAberto ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                       {emAberto ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                       <span className="text-[10px] font-black uppercase tracking-widest">
                                          {emAberto ? `${falta} UN Faltando` : 'Concluído'}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="p-8">
                                    <div className="flex items-center justify-center gap-4">
                                       <div className="w-24 h-2.5 bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
                                          <div className={`h-full rounded-full ${percent < 100 ? 'bg-blue-600' : 'bg-green-600'} shadow-lg`} style={{ width: `${percent}%` }} />
                                       </div>
                                       <span className="text-xs font-black text-[var(--text-primary)] w-8 text-right">{percent}%</span>
                                    </div>
                                 </td>
                                 <td className="p-8 text-right">
                                    <button 
                                      onClick={() => setSelectedReport(p)}
                                      className="p-3 bg-[var(--bg-base)] text-[var(--brand)] rounded-xl hover:bg-[var(--brand)] hover:text-white transition-all shadow-sm border border-[var(--border)]"
                                    >
                                       <FileText size={18} />
                                    </button>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

      </div>

      <AdaptiveModal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Relatório de Entrega da Requisição">
         <div className="p-10 space-y-8">
            <div className="flex justify-between items-start border-b border-[var(--border)] pb-8">
               <div>
                  <h4 className="text-2xl font-black text-[var(--text-primary)] italic">Relatório de Conferência</h4>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">Protocolo: {selectedReport?.nf || '---'}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Data da Solicitação</p>
                  <p className="text-sm font-black">{selectedReport?.data}</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-3 p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                  <UserCheck className="text-green-600" size={20} />
                  <div>
                     <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Responsável pelo Recebimento</p>
                     <p className="text-xs font-black">{selectedReport?.recebedor}</p>
                  </div>
               </div>

               <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-[var(--bg-base)]/50">
                        <tr>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Material Solicitado</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">Pedido</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">Entregue</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Saldo</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border)]">
                        <tr>
                           <td className="p-4 text-xs font-bold">{selectedReport?.desc}</td>
                           <td className="p-4 text-center font-black text-xs">{selectedReport?.solicitado}</td>
                           <td className="p-4 text-center font-black text-xs text-green-600">{selectedReport?.chegou}</td>
                           <td className="p-4 text-right font-black text-xs text-red-500">{selectedReport?.solicitado - (selectedReport?.chegou || 0)}</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="flex gap-4">
               <button className="flex-1 h-14 bg-[var(--brand)] text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg">
                  <Download size={18} /> Baixar PDF
               </button>
               <button onClick={() => setSelectedReport(null)} className="h-14 px-8 bg-[var(--bg-base)] text-[var(--text-primary)] rounded-xl text-xs font-black uppercase tracking-widest border border-[var(--border)]">
                  Fechar
               </button>
            </div>
         </div>
      </AdaptiveModal>

    </div>
  );
}
