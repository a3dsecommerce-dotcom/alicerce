"use client";
import { useMemo } from "react";
import { Send } from "lucide-react";

interface NovaRequisicaoFormProps {
  estoque: any[];
  volumes: Record<string, number>;
  setVolumes: (v: any) => void;
  volumesExtra: Record<string, number>;
  setVolumesExtra: (v: any) => void;
  tipoPedidoGeral: "MENSAL" | "EMERGENCIAL";
  setTipoPedidoGeral: (v: "MENSAL" | "EMERGENCIAL") => void;
  observacao: string;
  setObservacao: (v: string) => void;
  onFinalizar: () => void;
  loading: boolean;
  secretariaUser?: string; // secretaria do solicitante (para filtrar itens)
}

export default function NovaRequisicaoForm({
  estoque,
  volumes, setVolumes,
  volumesExtra, setVolumesExtra,
  tipoPedidoGeral, setTipoPedidoGeral,
  observacao, setObservacao,
  onFinalizar,
  loading,
  secretariaUser,
}: NovaRequisicaoFormProps) {

  // Filtra itens: mostra apenas os que a secretaria pode ver
  // Se secretarias_permitidas for vazio ou nulo, o item é visível para todos
  const estoqueFiltrado = useMemo(() => {
    if (!secretariaUser) return estoque; // almoxarifado vê tudo
    return estoque.filter((item) => {
      const permitidas: string[] = item.secretarias_permitidas || [];
      return permitidas.length === 0 || permitidas.includes(secretariaUser.toUpperCase());
    });
  }, [estoque, secretariaUser]);

  return (
    <div className="flex flex-col flex-1">
        <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--bg-base)]/5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 w-full">
            <div>
              <h3 className="text-lg font-black uppercase italic">Gerador de Pedidos</h3>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-1 tracking-widest">Requisição Interna de Materiais</p>
            </div>
            
            <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-[var(--border)] shadow-sm">
               <button onClick={() => setTipoPedidoGeral("MENSAL")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoPedidoGeral === 'MENSAL' ? 'bg-blue-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-blue-50'}`}>Mensal</button>
               <button onClick={() => setTipoPedidoGeral("EMERGENCIAL")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoPedidoGeral === 'EMERGENCIAL' ? 'bg-red-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-red-50'}`}>Emergencial</button>
            </div>

            <div className="flex-1 w-full">
              <textarea 
                className="w-full h-12 px-4 py-3 rounded-xl border border-[var(--border)] bg-white text-[11px] font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                placeholder="Observações ou justificativa do pedido (opcional)..."
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
              />
            </div>
          </div>
          <button 
            onClick={onFinalizar} 
            disabled={loading || (Object.values(volumes).every(v => v === 0) && Object.values(volumesExtra).every(v => v === 0))} 
            className="h-12 px-10 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl disabled:opacity-30 whitespace-nowrap"
          >
            <Send size={16} /> Enviar Requisição
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
                <th className="px-6 py-4 text-[10px] font-black uppercase text-emerald-600 text-center w-[140px]">Custo Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {estoqueFiltrado.map(item => {
                 const qtd = volumes[item.id] || 0;
                 const coef = item.coeficiente ?? 1;
                 const preco = item.preco_unitario ?? 0;
                 const custoEstimado = qtd * preco * coef;
                 return (
                <tr key={item.id} className="hover:bg-[var(--bg-base)]/10">
                  <td className="px-6 py-4 text-center font-mono text-[var(--text-muted)] text-[10px]">{item.codigo_registro || '---'}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-[var(--text-primary)]">{item.item}</p>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{item.categoria}</span>
                    {item.secretarias_permitidas?.length > 0 && (
                      <span className="block text-[8px] font-black text-[var(--brand)]/60 uppercase tracking-widest mt-0.5">
                        {item.secretarias_permitidas.join(' · ')}
                      </span>
                    )}
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
                        setVolumes((prev: Record<string, number>) => ({...prev, [item.id]: val}));
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
                        setVolumesExtra((prev: Record<string, number>) => ({...prev, [item.id]: val}));
                      }} 
                      className="w-24 h-10 px-2 mx-auto rounded-lg border-2 border-orange-100 bg-orange-50/20 text-orange-600 text-center text-xs font-black outline-none focus:border-orange-500 block [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      placeholder="0" 
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {preco > 0 && qtd > 0 ? (
                      <span className="text-[11px] font-black text-emerald-600">
                        {custoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold">—</span>
                    )}
                  </td>
                </tr>
                 );
              })}
            </tbody>
         </table>
       </div>
    </div>
  );
}
