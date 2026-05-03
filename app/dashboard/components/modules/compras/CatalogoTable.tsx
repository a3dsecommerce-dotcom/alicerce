"use client";

interface ItemCatalogo {
  id: string;
  item: string;
  categoria: string;
  unidade_medida: string;
  codigo_registro: string;
  coeficiente: number;
}

interface CatalogoTableProps {
  catalogo: ItemCatalogo[];
  qtdAsg: number;
  volumes: Record<string, number>;
  setVolumes: (v: any) => void;
  volumesExtra: Record<string, number>;
  setVolumesExtra: (v: any) => void;
}

export default function CatalogoTable({ 
  catalogo, qtdAsg, volumes, setVolumes, volumesExtra, setVolumesExtra 
}: CatalogoTableProps) {
  return (
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
                          <div className="text-sm font-black whitespace-normal max-w-[400px]">{prod.item}</div>
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
  );
}
