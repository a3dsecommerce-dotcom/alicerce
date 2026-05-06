"use client";
import { useState, useEffect } from "react";
import { 
  ShoppingBag, Truck, Package, User, Send, Box, Activity, Clock, Printer
} from "lucide-react";
import { useComprasData } from "./compras/useComprasData";
import CatalogoTable from "./compras/CatalogoTable";
import TrackingTable from "./compras/TrackingTable";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";

export default function ComprasModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const { loading, catalogo, requisicoesRaw, qtdAsg, enviarRequisicao } = useComprasData(user);
  const [activeTab, setActiveTab] = useState<"CATALOGO" | "TRACKING">((initialTab?.toUpperCase() as any) || "CATALOGO");
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab.toUpperCase() as any);
    }
  }, [initialTab]);

  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [volumesExtra, setVolumesExtra] = useState<Record<string, number>>({});
  const [tipoPedido, setTipoPedido] = useState<"MENSAL" | "EMERGENCIAL">("MENSAL");
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);

  // Guard para evitar quebra caso o usuário demore a sincronizar
  if (!user) return (
    <div className="flex items-center justify-center p-20 text-[var(--text-muted)] font-bold">
      Aguardando sincronização de perfil...
    </div>
  );

  if (loading) return (
    <div className="p-20">
      <TableSkeleton rows={10} cols={5} />
    </div>
  );

  // Agrupamento para Tracking com segurança contra dados nulos
  const requisicoesAgrupadas = (requisicoesRaw || []).reduce((acc: any[], current: any) => {
    if (!current) return acc;
    const proto = current.protocolo || 'SEM-PROTOCOLO';
    let group = acc.find(g => g.protocolo === proto);
    if (!group) {
      group = { 
        protocolo: proto, 
        data: current.data_solicitacao ? new Date(current.data_solicitacao).toLocaleDateString() : '---',
        data_raw: current.data_solicitacao,
        status_geral: current.status || 'PENDENTE',
        tipo_pedido: current.tipo_pedido || 'MENSAL',
        itens: [] 
      };
      acc.push(group);
    }
    group.itens.push(current);
    return acc;
  }, []);

  const getMesReferencia = (dataStr: string) => {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const d = new Date(dataStr);
    d.setMonth(d.getMonth() + 1);
    return `${meses[d.getMonth()]}/${d.getFullYear()}`;
  };

  const getTempoAberto = (dataStr: string) => {
    const d = new Date(dataStr);
    const diff = new Date().getTime() - d.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dias === 0 ? "Hoje" : `${dias}d`;
  };

  const handleFinalizar = async () => {
    const todosItensId = Array.from(new Set([...Object.keys(volumes), ...Object.keys(volumesExtra)]));
    const itensParaPedir = todosItensId.filter(id => (volumes[id] || 0) > 0 || (volumesExtra[id] || 0) > 0);
    
    if (itensParaPedir.length === 0) return toast.warning("Selecione quantidades antes de enviar.");
    
    const batchProtocol = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const payload = itensParaPedir.map(id => {
      const item = catalogo.find(c => String(c.id) === id);
      return {
        item_id: id,
        solicitante: user?.nome || user?.name || 'Comprador',
        unidade_destino: user?.unidade_alocacao || 'Unidade',
        secretaria_destino: user?.secretaria || 'SEMED',
        quantidade: volumes[id] || 0,
        quantidade_extra: volumesExtra[id] || 0,
        status: 'SOLICITADO',
        item_nome: item?.item || 'Item',
        unidade_medida: item?.unidade_medida || 'UN',
        protocolo: batchProtocol,
        tipo_item: item?.categoria || 'SUPRIMENTO',
        tipo_pedido: tipoPedido,
        data_solicitacao: new Date().toISOString(),
      };
    });

    try {
      await enviarRequisicao(payload);
      setVolumes({});
      setVolumesExtra({});
      setActiveTab("TRACKING");
      toast.success("Sua requisição foi enviada com sucesso!");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-32 max-w-full px-4 lg:px-20 py-10">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-200 shadow-inner"><User size={32} /></div>
           <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] italic tracking-tight flex items-center gap-3">
                {user.name || user.nome || 'Setor Admin'} 
                <span className="text-[10px] not-italic font-black bg-[var(--brand)] text-white px-3 py-1 rounded-full uppercase tracking-widest">
                  {user.secretaria || user.unidade_alocacao || 'Unidade'}
                </span>
              </h2>
              <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                <Package size={14} className="text-[var(--brand)]" /> {requisicoesRaw.length} Requisições Visíveis
              </p>
           </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegação interna removida em favor da Sidebar lateral para evitar redundância */}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {activeTab === "CATALOGO" ? (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
              <div className="p-10 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-base)]/5">
                 <div>
                    <h3 className="text-xl font-black uppercase italic">Solicitação de Materiais</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Selecione os itens e quantidades limitados pelo coeficiente</p>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex gap-2 p-1 bg-white rounded-2xl border border-[var(--border)] shadow-sm">
                       <button onClick={() => setTipoPedido("MENSAL")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoPedido === 'MENSAL' ? 'bg-blue-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-blue-50'}`}>Mensal</button>
                       <button onClick={() => setTipoPedido("EMERGENCIAL")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoPedido === 'EMERGENCIAL' ? 'bg-red-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-red-50'}`}>Emergencial</button>
                    </div>
                    <button onClick={handleFinalizar} disabled={loading} className="h-14 px-10 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-orange-600/30">
                       <Send size={18} /> Enviar Requisição
                    </button>
                 </div>
              </div>
              <CatalogoTable catalogo={catalogo} qtdAsg={qtdAsg} volumes={volumes} setVolumes={setVolumes} volumesExtra={volumesExtra} setVolumesExtra={setVolumesExtra} />
          </div>
        ) : (
          <TrackingTable requisicoesAgrupadas={requisicoesAgrupadas} getMesReferencia={getMesReferencia} getTempoAberto={getTempoAberto} onSelect={setSelectedProtocol} />
        )}
      </div>

      <AdaptiveModal isOpen={!!selectedProtocol} onClose={() => setSelectedProtocol(null)} title="Detalhamento da Requisição" width="1200px">
          {/* Modal content from original ComprasModule */}
          <div className="p-10 space-y-8">
             <div className="flex justify-between border-b border-[var(--border)] pb-8 items-center">
                <div>
                   <h4 className="text-2xl font-black italic">Protocolo {selectedProtocol?.protocolo}</h4>
                   <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Solicitado em: {selectedProtocol?.data}</p>
                </div>
                <button 
                  onClick={() => {
                    const g = selectedProtocol;
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const html = `
                        <html>
                          <head>
                            <title>Requisição ${g.protocolo}</title>
                            <style>
                              body { font-family: sans-serif; padding: 40px; color: #333; }
                              .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                              .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
                              .title { text-align: center; text-transform: uppercase; font-weight: 900; margin-bottom: 40px; }
                              .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
                              .info-item { font-size: 12px; }
                              .info-label { font-weight: bold; text-transform: uppercase; color: #666; font-size: 10px; }
                              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                              th { background: #f5f5f5; text-align: left; padding: 12px; font-size: 10px; text-transform: uppercase; border: 1px solid #ddd; }
                              td { padding: 12px; font-size: 11px; border: 1px solid #ddd; }
                              .footer { margin-top: 60px; display: flex; justify-content: space-between; border-top: 1px solid #eee; pt: 20px; font-size: 10px; color: #999; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div class="logo">ALICERCE <span style="color: #ea580c">ERP</span></div>
                              <div style="text-align: right">
                                <div style="font-weight: bold; font-size: 14px;">PROT: ${g.protocolo}</div>
                                <div style="font-size: 10px; color: #666;">EMITIDO EM: ${new Date().toLocaleString()}</div>
                              </div>
                            </div>

                            <div class="title">Requisição de Materiais (${g.tipo_pedido})</div>

                            <div class="info-grid">
                              <div class="info-item">
                                <div class="info-label">Unidade de Destino</div>
                                <div style="font-size: 14px; font-weight: bold;">${g.itens[0]?.unidade_destino || 'UNIDADE NÃO INFORMADA'}</div>
                              </div>
                              <div class="info-item">
                                <div class="info-label">Secretaria</div>
                                <div style="font-size: 14px; font-weight: bold;">${g.itens[0]?.secretaria_destino || 'SEMED'}</div>
                              </div>
                              <div class="info-item">
                                <div class="info-label">Solicitante</div>
                                <div style="font-size: 14px; font-weight: bold;">${g.itens[0]?.solicitante || 'COORDENADOR'}</div>
                              </div>
                              <div class="info-item">
                                <div class="info-label">Data da Solicitação</div>
                                <div style="font-size: 14px; font-weight: bold;">${g.data}</div>
                              </div>
                            </div>

                            <table>
                              <thead>
                                <tr>
                                  <th>Item / Descrição</th>
                                  <th style="text-align: center; width: 80px;">Qtd</th>
                                  <th style="text-align: center; width: 60px;">UND</th>
                                  <th style="text-align: center; width: 100px;">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${g.itens.map((it:any) => `
                                  <tr>
                                    <td style="font-weight: bold;">${it.item_nome}</td>
                                    <td style="text-align: center; font-weight: bold;">${(it.quantidade || 0) + (it.quantidade_extra || 0)}</td>
                                    <td style="text-align: center;">${it.unidade_medida || 'UN'}</td>
                                    <td style="text-align: center; font-size: 9px; font-weight: bold; color: #ea580c;">${it.status}</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>

                            <div style="margin-top: 50px; border: 1px dashed #ccc; padding: 20px; font-size: 10px; color: #666;">
                              <strong>OBSERVAÇÕES:</strong><br>
                              Esta requisição foi gerada eletronicamente pelo Sistema Alicerce ERP. A entrega dos materiais está sujeita à disponibilidade em estoque e conferência da equipe de logística.
                            </div>

                            <div class="footer">
                              <div>Página 1 de 1</div>
                              <div>Alicerce ERP - Módulo de Gestão de Compras</div>
                            </div>

                            <script>
                              window.onload = () => {
                                window.print();
                              };
                            </script>
                          </body>
                        </html>
                      `;
                      printWindow.document.write(html);
                      printWindow.document.close();
                    }
                  }}
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-orange-600/30"
                >
                  <Printer size={16} /> Imprimir Requisição
                </button>
             </div>
             <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                   <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
                      <tr>
                         <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Produto</th>
                         <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Solicitado</th>
                         <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                      {selectedProtocol?.itens.map((it: any, idx: number) => (
                         <tr key={idx} className="hover:bg-[var(--bg-base)]/30 transition-all">
                            <td className="px-10 py-8 text-xs font-black">{it.item_nome}</td>
                            <td className="px-10 py-8 text-center text-xs font-black">{(it.quantidade || 0) + (it.quantidade_extra || 0)}</td>
                            <td className="px-10 py-8 text-center"><span className="px-4 py-1.5 rounded-full text-[8px] font-black uppercase bg-orange-50 text-orange-600">{it.status}</span></td>
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
