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
               <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Progresso</th>
               <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {requisicoesAgrupadas.map((g, i) => {
               const totalPedido = g.itens.reduce((acc: number, it: any) => acc + (it.quantidade || 0) + (it.quantidade_extra || 0), 0);
               const totalEntregue = g.itens.reduce((acc: number, it: any) => acc + (it.quantidade_entregue || 0), 0);
               const percentual = totalPedido > 0 ? Math.min(100, Math.round((totalEntregue / totalPedido) * 100)) : 0;

               return (
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
                    <td className="p-8">
                       <div className="flex flex-col gap-2 min-w-[120px]">
                         <div className="flex justify-between items-center px-1">
                           <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-tighter">{percentual}% Entregue</span>
                           <span className="text-[9px] font-bold text-[var(--text-primary)]">{totalEntregue}/{totalPedido}</span>
                         </div>
                         <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-[var(--border)]">
                           <div 
                             className={`h-full transition-all duration-1000 ${percentual === 100 ? 'bg-green-500' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'}`} 
                             style={{ width: `${percentual}%` }}
                           />
                         </div>
                       </div>
                    </td>
                    <td className="p-8 text-right flex items-center justify-end gap-2">
                       <button onClick={() => onSelect(g)} className="p-3 bg-[var(--bg-base)] text-[var(--brand)] rounded-xl hover:bg-[var(--brand)] hover:text-white transition-all border border-[var(--border)]" title="Ver Detalhes"><Eye size={16}/></button>
                    </td>
                 </tr>
               );
            })}
          </tbody>
      </table>
    </div>
  );
}
