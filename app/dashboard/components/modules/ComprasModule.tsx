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
  const [user, setUser] = useState<any>({});
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
    try {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {}

    async function fetchPedidos() {
      setLoading(true);
      const { data } = await supabase
        .from('compras_processos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data && data.length > 0) {
        setPedidos(data);
      } else {
        setPedidos(acompanhamentoMock);
      }
      setLoading(false);
    }
    fetchPedidos();
  }, [filtroMes]);

  const handleVolumeChange = (id: number, val: string) => {
    const num = parseInt(val) || 0;
    setVolumes(prev => ({ ...prev, [id]: num }));
  };

  const handleFinalizarPedido = async () => {
    const itensParaPedir = Object.entries(volumes).filter(([_, vol]) => vol > 0);
    if (itensParaPedir.length === 0) return alert("Selecione volumes antes de finalizar.");
    setLoading(true);

    try {
      // Cria uma requisição no banco para CADA item selecionado
      const requisicoes = itensParaPedir.map(([idStr, qtd]) => {
        const id = parseInt(idStr);
        const item = catalogoMock.find(c => c.id === id);
        return {
          solicitante: user?.name || 'Portal de Compras',
          unidade_destino: user?.email || 'Não informado',
          quantidade: qtd,
          status: 'SOLICITADO',
          item_nome: item?.nome || `Item #${id}`,
          unidade_medida: item?.unidade || 'UN',
          data_solicitacao: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('requisicoes').insert(requisicoes);
      
      if (error) {
        console.error('Erro ao criar requisição:', error);
        alert('Erro ao salvar requisição. Tente novamente.');
      } else {
        setVolumes({});
        setActiveTab("TRACKING");
        alert(`✅ ${itensParaPedir.length} requisição(ões) criada(s) com sucesso! O Almoxarifado foi notificado.`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const saudacao = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  
  // Percentual Geral do Tracking
  const percentagemGeral = pedidos.length > 0 
    ? Math.round((pedidos.reduce((acc, p) => acc + ((p.chegou || 0) / (p.solicitado || 1)), 0) / pedidos.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-32 max-w-full px-4">
      
      {/* 1. HEADER E SAUDAÇÃO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {saudacao}, Sr(a). {user.name?.split(' ')[0] || 'Comprador'}!
          </h2>
          <p className="text-[11px] font-black text-[var(--brand)] uppercase tracking-widest mt-1">
            Bem-vindo ao canal de compras Alicerce
          </p>
        </div>

        {/* Filtro de Mês e Ano Superior */}
        <div className="flex items-center gap-4 bg-[var(--bg-card)] px-6 py-3 rounded-2xl border border-[var(--border)] shadow-sm">
          <Calendar size={18} className="text-[var(--brand)]" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Período:</span>
            <input 
              type="month" 
              value={filtroMes} 
              onChange={(e) => setFiltroMes(e.target.value)}
              className="bg-transparent border-none text-sm font-black uppercase outline-none cursor-pointer text-[var(--text-primary)] -mt-1 p-0"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* COLUNA ESQUERDA - CONTEÚDO PRINCIPAL (OCUPA 3 COLUNAS) */}
        <div className="xl:col-span-3 flex flex-col gap-8">
          
          {/* TABS E FINALIZAR */}
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

                {/* BOTÃO ENVIAR PEDIDO AO LADO DAS ABAS */}
                {activeTab === "CATALOGO" && (
                  <div className="hidden lg:flex items-center border-l border-[var(--border)] ml-2 pl-4">
                      <button 
                        onClick={handleFinalizarPedido}
                        disabled={loading || Object.values(volumes).every(v => v === 0)}
                        className="h-11 px-8 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-30"
                      >
                        <Send size={14} /> Enviar Pedido
                      </button>
                  </div>
                )}
            </div>

            {/* BOTÃO ENVIAR PEDIDO MOBILE */}
            {activeTab === "CATALOGO" && (
              <div className="lg:hidden w-full">
                <button 
                  onClick={handleFinalizarPedido}
                  className="w-full h-14 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3"
                >
                    <Send size={16} /> Enviar Pedido
                </button>
              </div>
            )}
          </div>

          {/* VIEW: CATÁLOGO */}
          {activeTab === "CATALOGO" && (
            <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
                <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-8 bg-[var(--bg-base)]/5">
                  <h3 className="text-sm font-black uppercase tracking-widest">Catálogo de Produtos</h3>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input className="input-field !pl-12 !h-12 text-sm" placeholder="O que você precisa?" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                        <tr>
                            <th className="p-6 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Material / Descrição</th>
                            <th className="p-6 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Und.</th>
                            <th className="p-6 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Cota Máxima</th>
                            <th className="p-6 text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Volume Desejado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {catalogoMock.map((prod) => {
                            const vol = volumes[prod.id] || 0;
                            const isExcedente = vol > prod.cota;
                            return (
                              <tr key={prod.id} className={`transition-all ${isExcedente ? 'bg-orange-50' : 'hover:bg-[var(--bg-base)]/40'}`}>
                                  <td className="p-6 px-10 min-w-[250px]">
                                    <div className="flex flex-col gap-1 text-center lg:text-left">
                                        <span className="text-sm font-black text-[var(--text-primary)] leading-relaxed whitespace-normal">{prod.nome}</span>
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{prod.categoria}</span>
                                    </div>
                                  </td>
                                  <td className="p-6 text-center">
                                    <span className="px-3 py-1 bg-[var(--bg-base)] rounded-lg text-[10px] font-black text-[var(--text-muted)] border border-[var(--border)]">{prod.unidade}</span>
                                  </td>
                                  <td className="p-6 text-center">
                                    <span className="text-base font-black text-[var(--text-primary)]">{prod.cota}</span>
                                  </td>
                                  <td className="p-6 px-10">
                                    <div className="relative max-w-[120px] mx-auto">
                                        <input 
                                          type="number" 
                                          value={vol || ''}
                                          onChange={(e) => handleVolumeChange(prod.id, e.target.value)}
                                          className={`w-full h-12 px-5 rounded-xl border-2 text-sm font-black outline-none transition-all ${isExcedente ? 'border-orange-500 bg-white text-orange-600 shadow-lg shadow-orange-500/20' : 'border-transparent bg-[var(--bg-base)] focus:border-[var(--brand)] focus:bg-[var(--bg-card)]'}`}
                                          placeholder="0"
                                        />
                                        {isExcedente && (
                                          <div className="absolute -top-6 right-0 animate-bounce">
                                              <span className="px-2 py-0.5 bg-orange-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md">Acima da Cota</span>
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
          )}

          {/* VIEW: ACOMPANHAMENTO E INDICADORES */}
          {activeTab === "TRACKING" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* Box de Indicador Radial e Relatórios */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Indicador Radial */}
                <div className="bg-[var(--bg-card)] p-8 rounded-[1.5rem] border border-[var(--border)] shadow-md flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">Progresso de Entregas</h4>
                    <p className="text-sm font-black text-[var(--text-primary)] mt-1">Status Geral do Mês</p>
                  </div>
                  <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-[var(--bg-base)] shadow-inner">
                    <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(var(--brand) ${percentagemGeral}%, transparent 0)` }}></div>
                    <div className="absolute inset-[4px] bg-[var(--bg-card)] rounded-full flex items-center justify-center">
                      <span className="text-sm font-black text-[var(--text-primary)]">{percentagemGeral}%</span>
                    </div>
                  </div>
                </div>

                {/* Filtros e Relatórios Avançados */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] p-6 rounded-[1.5rem] border border-[var(--border)] shadow-md flex flex-col justify-center gap-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Filter size={14}/> Relatórios Avançados</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <input type="text" placeholder="Nº da Requisição" className="input-field flex-1 !h-10 text-xs" />
                    <input type="date" className="input-field flex-1 !h-10 text-xs" />
                    <input type="date" className="input-field flex-1 !h-10 text-xs" />
                    <button className="h-10 px-6 bg-[var(--bg-base)] text-[var(--brand)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--brand)] hover:text-white transition-all shadow-sm">
                      Gerar Relatório
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de Acompanhamento */}
              <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-xl overflow-hidden">
                  <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-base)]/5 flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <HistoryIcon className="text-[var(--brand)]" size={20} /> Histórico de Cada Item
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                          <tr>
                              <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Data / NF</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Material e Recebedor</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status / Saldo</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Progresso</th>
                              <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Relatório</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {loading ? (
                              <tr><td colSpan={5} className="p-20 text-center text-xs italic text-[var(--text-muted)]">Sincronizando dados...</td></tr>
                          ) : pedidos.map((p) => {
                              const falta = p.solicitado - p.chegou;
                              const percent = Math.round((p.chegou / p.solicitado) * 100);
                              const emAberto = falta > 0;

                              return (
                                <tr key={p.id} className={`transition-all ${emAberto ? 'bg-blue-50/10' : 'hover:bg-[var(--bg-base)]/30'}`}>
                                    <td className="p-6 text-center min-w-[120px]">
                                      <div className="flex flex-col gap-1">
                                          <span className="text-[11px] font-black text-[var(--text-primary)]">{p.data}</span>
                                          <span className="text-[9px] font-bold text-[var(--brand)] uppercase tracking-widest">{p.nf}</span>
                                      </div>
                                    </td>
                                    <td className="p-6 px-10 min-w-[300px]">
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
                                    <td className="p-6 text-center min-w-[160px]">
                                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${emAberto ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                          {emAberto ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                          <span className="text-[10px] font-black uppercase tracking-widest">
                                            {emAberto ? `${falta} UN Faltando` : 'Concluído'}
                                          </span>
                                      </div>
                                    </td>
                                    <td className="p-6">
                                      <div className="flex items-center justify-center gap-4">
                                          <div className="w-20 h-2 bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
                                            <div className={`h-full rounded-full ${percent < 100 ? 'bg-blue-600' : 'bg-green-600'} shadow-lg`} style={{ width: `${percent}%` }} />
                                          </div>
                                          <span className="text-[10px] font-black text-[var(--text-primary)] w-8 text-right">{percent}%</span>
                                      </div>
                                    </td>
                                    <td className="p-6 text-right">
                                      <button 
                                        onClick={() => setSelectedReport(p)}
                                        className="p-3 bg-[var(--bg-base)] text-[var(--brand)] rounded-xl hover:bg-[var(--brand)] hover:text-white transition-all shadow-sm border border-[var(--border)]"
                                      >
                                          <FileText size={16} />
                                      </button>
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

        </div>

        {/* COLUNA DIREITA - SIDEBAR (OCUPA 1 COLUNA) */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Identificação do Comprador */}
          <div className="bg-[var(--bg-card)] p-8 rounded-[1.5rem] border border-[var(--border)] shadow-xl flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-orange-500/10 border-4 border-[var(--bg-card)] shadow-[0_0_0_2px_var(--border)] rounded-full flex items-center justify-center text-orange-600 mb-6 overflow-hidden">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Comprador')}&background=EA580C&color=fff&size=128`} 
                alt="Foto do Comprador" 
                className="w-full h-full object-cover" 
              />
            </div>
            <h3 className="font-black text-[var(--text-primary)] text-lg tracking-tight">{user.name || 'Diogo F.'}</h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 bg-[var(--bg-base)] px-3 py-1 rounded-full">{user.role || 'Comprador'}</p>
            
            <div className="w-full mt-6 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-left">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600"><UserCheck size={14}/></div>
                <div>
                  <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Secretaria</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[150px]">Sec. de Educação</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-left">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-600"><AlertTriangle size={14}/></div>
                <div>
                  <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Contato</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[150px]">{user.email || 'Não informado'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Informativo do Mês */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-[1.5rem] shadow-xl text-white relative overflow-hidden">
            <Megaphone className="absolute top-4 right-4 text-white/10" size={80} />
            <h4 className="relative z-10 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2 drop-shadow-md">
              <Megaphone size={16} /> Informativo do Mês
            </h4>
            
            <div className="relative z-10 space-y-4">
              <div className="bg-black/20 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-inner">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-200">Cota Adicional Permitida</p>
                <div className="flex items-center gap-3 mt-2 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg"><Box size={16} /></div>
                  <p className="text-sm font-black">Notebook Corporativo</p>
                </div>
                <div className="w-full h-px bg-white/20 my-3"></div>
                <p className="text-[11px] font-medium opacity-90 leading-relaxed italic">
                  "Liberado temporariamente 2 unidades extras por requisição devido à expansão da secretaria. Prazo até o final do mês."
                </p>
                <div className="mt-3 flex items-center gap-2 text-[9px] font-black text-orange-200 uppercase tracking-widest">
                  <CheckCircle2 size={12} /> Analista Logístico
                </div>
              </div>
            </div>
          </div>

        </div>

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

            <div className="flex justify-end gap-4">
               <button onClick={() => setSelectedReport(null)} className="h-14 px-12 bg-[var(--bg-base)] text-[var(--text-primary)] rounded-xl text-xs font-black uppercase tracking-widest border border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
                  Fechar Relatório
               </button>
            </div>
         </div>
      </AdaptiveModal>

    </div>
  );
}
