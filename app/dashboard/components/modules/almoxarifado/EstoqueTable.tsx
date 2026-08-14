"use client";

interface ItemEstoque {
  id: string;
  codigo_registro: string;
  item: string;
  unidade_medida: string;
  categoria: string;
  quantidade: number;
  estoque_minimo: number;
  preco_unitario?: number;
  coeficiente?: number;
  secretarias_permitidas?: string[];
}

interface EstoqueTableProps {
  estoque: ItemEstoque[];
  busca: string;
  onEdit: (item: ItemEstoque) => void;
}

export default function EstoqueTable({ estoque, busca, onEdit }: EstoqueTableProps) {
  const filtrado = estoque.filter(i => i.item?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left">
        <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[100px]">Reg.</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-left">Descrição do Material</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Estoque</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-emerald-600 text-center w-[130px]">Preço Unit.</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-blue-600 text-center w-[110px]">Coeficiente</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[150px]">Categoria</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {filtrado.map(item => (
            <tr 
              key={item.id} 
              className="hover:bg-[var(--bg-base)]/30 transition-all cursor-pointer group" 
              onClick={() => onEdit(item)}
            >
              <td className="px-6 py-6 text-center font-mono text-[var(--text-muted)] text-[11px]">{item.codigo_registro || '---'}</td>
              <td className="px-6 py-6">
                <span className="text-[13px] font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{item.item}</span>
                {item.secretarias_permitidas && item.secretarias_permitidas.length > 0 && (
                  <span className="block text-[8px] font-black text-[var(--brand)]/50 uppercase tracking-widest mt-0.5">
                    {item.secretarias_permitidas.join(' · ')}
                  </span>
                )}
              </td>
              <td className="px-6 py-6 text-center">
                 <span className={`text-[11px] font-black ${item.quantidade <= (item.estoque_minimo || 0) ? 'text-red-600' : 'text-blue-600'}`}>
                    {item.quantidade || 0} {item.unidade_medida || 'UN'}
                 </span>
              </td>
              <td className="px-6 py-6 text-center">
                {item.preco_unitario && item.preco_unitario > 0 ? (
                  <span className="text-[11px] font-black text-emerald-600">
                    {item.preco_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300 font-bold">—</span>
                )}
              </td>
              <td className="px-6 py-6 text-center">
                {item.categoria === 'SUPRIMENTO' ? (
                  <span className={`text-[12px] font-black ${(item.coeficiente ?? 1) < 1 ? 'text-amber-600' : (item.coeficiente ?? 1) > 1 ? 'text-green-600' : 'text-slate-500'}`}>
                    {(item.coeficiente ?? 1).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300 font-bold">—</span>
                )}
              </td>
              <td className="px-6 py-6 text-center">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block min-w-[100px] ${
                  item.categoria === 'EPI' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                  item.categoria === 'SUPRIMENTO' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                  'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
                }`}>
                  {item.categoria}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
