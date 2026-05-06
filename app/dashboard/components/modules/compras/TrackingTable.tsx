"use client";
import { Clock, Eye, Printer } from "lucide-react";

interface TrackingTableProps {
  requisicoesAgrupadas: any[];
  getMesReferencia: (d: string) => string;
  getTempoAberto: (d: string) => string;
  onSelect: (g: any) => void;
}

export default function TrackingTable({ 
  requisicoesAgrupadas, getMesReferencia, getTempoAberto, onSelect 
}: TrackingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
          <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
            <tr>
               <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Protocolo</th>
               <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Referência</th>
               <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Resumo</th>
               <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Prioridade</th>
               <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
               <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {requisicoesAgrupadas.map((g, i) => (
               <tr key={i} className="hover:bg-[var(--bg-base)]/30 transition-all">
                  <td className="p-8 text-center">
                     <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-[var(--brand)]">{g.protocolo}</span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-orange-500 uppercase mt-1">
                           <Clock size={10} /> {getTempoAberto(g.data_raw)}
                        </div>
                     </div>
                  </td>
                  <td className="p-8 text-center">
                     <div className="text-xs font-black text-[var(--text-primary)]">
                        {g.tipo_pedido === 'MENSAL' ? getMesReferencia(g.data_raw) : '---'}
                     </div>
                     <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{g.data}</div>
                  </td>
                  <td className="p-8">
                     <div className="text-xs font-black">{g.itens.length} {g.itens.length === 1 ? 'Item' : 'Itens'}</div>
                     <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase truncate max-w-[150px]">{g.itens.map((it:any) => it.item_nome).join(", ")}</div>
                  </td>
                  <td className="p-8 text-center">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${g.tipo_pedido === 'EMERGENCIAL' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-50 text-blue-600'}`}>
                        {g.tipo_pedido}
                     </span>
                  </td>
                  <td className="p-8 text-center">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${g.status_geral === 'SOLICITADO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {g.status_geral}
                     </span>
                  </td>
                  <td className="p-8 text-right flex items-center justify-end gap-2">
                     <button 
                        onClick={() => {
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
                                    @media print {
                                      .no-print { display: none; }
                                    }
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
                                      // window.close();
                                    };
                                  </script>
                                </body>
                              </html>
                            `;
                            printWindow.document.write(html);
                            printWindow.document.close();
                          }
                        }}
                        className="p-3 bg-[var(--bg-base)] text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-[var(--border)]"
                        title="Imprimir Requisição"
                     >
                        <Printer size={16}/>
                     </button>
                     <button onClick={() => onSelect(g)} className="p-3 bg-[var(--bg-base)] text-[var(--brand)] rounded-xl hover:bg-[var(--brand)] hover:text-white transition-all border border-[var(--border)]" title="Ver Detalhes"><Eye size={16}/></button>
                  </td>
               </tr>
            ))}
          </tbody>
      </table>
    </div>
  );
}
