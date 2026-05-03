"use client";
import { Send } from "lucide-react";

interface NovaRequisicaoFormProps {
  estoque: any[];
  volumes: Record<string, number>;
  setVolumes: (v: any) => void;
  volumesExtra: Record<string, number>;
  setVolumesExtra: (v: any) => void;
  tipoPedidoGeral: "MENSAL" | "EMERGENCIAL";
  setTipoPedidoGeral: (v: "MENSAL" | "EMERGENCIAL") => void;
  onFinalizar: () => void;
  loading: boolean;
}

export default function NovaRequisicaoForm({
  estoque,
  volumes, setVolumes,
  volumesExtra, setVolumesExtra,
  tipoPedidoGeral, setTipoPedidoGeral,
  onFinalizar,
  loading
}: NovaRequisicaoFormProps) {
  return (
    <div className="flex flex-col flex-1">
       <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-base)]/5">
          <div className="flex items-center gap-8">
            <div>
              <h3 className="text-lg font-black uppercase">Gerador de Pedidos Almoxarifado</h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-1">Crie requisições internas de qualquer material para reposição ou uso</p>
            </div>
            
            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-[var(--border)] shadow-sm">
               <button onClick={() => setTipoPedidoGeral("MENSAL")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoPedidoGeral === 'MENSAL' ? 'bg-blue-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-blue-50'}`}>Mensal</button>
               <button onClick={() => setTipoPedidoGeral("EMERGENCIAL")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoPedidoGeral === 'EMERGENCIAL' ? 'bg-red-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-red-50'}`}>Emergencial</button>
            </div>
          </div>
          <button 
            onClick={onFinalizar} 
            disabled={loading || (Object.values(volumes).every(v => v === 0) && Object.values(volumesExtra).every(v => v === 0))} 
            className="h-14 px-10 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-30"
          >
            <Send size={18} /> Finalizar Pedido
          </button>
       </div>
       
       <div className="flex-1 overflow-x-auto">
         <table className="w-full text-left">
            <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Reg.</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-left">Descrição do Material</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Estoque</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[150px]">Qtd. Pedir</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[150px]">Extra/Obs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {estoque.map(item => (
                <tr key={item.id} className="hover:bg-[var(--bg-base)]/10">
                  <td className="px-6 py-4 text-center font-mono text-[var(--text-muted)] text-[10px]">{item.codigo_registro || '---'}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-[var(--text-primary)]">{item.item}</p>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{item.categoria}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[11px] font-black ${item.quantidade <= (item.estoque_minimo || 0) ? 'text-red-600' : 'text-blue-600'}`}>{item.quantidade || 0} {item.unidade_medida}</span>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      min="0" 
                      value={volumes[item.id] || ''} 
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setVolumes(prev => ({...prev, [item.id]: val}));
                      }} 
                      className="w-24 h-10 px-2 mx-auto rounded-lg border-2 border-transparent bg-slate-100 text-center text-xs font-black outline-none focus:border-blue-500 block [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      placeholder="0" 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      min="0" 
                      value={volumesExtra[item.id] || ''} 
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setVolumesExtra(prev => ({...prev, [item.id]: val}));
                      }} 
                      className="w-24 h-10 px-2 mx-auto rounded-lg border-2 border-orange-100 bg-orange-50/20 text-orange-600 text-center text-xs font-black outline-none focus:border-orange-500 block [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      placeholder="0" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
       </div>
    </div>
  );
}
