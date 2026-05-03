"use client";
import { Clock, Truck } from "lucide-react";

interface RequisicoesTableProps {
  requisicoes: any[];
  busca: string;
  onAnalisar: (r: any) => void;
  onGerenciar: (r: any) => void;
  calcularDias: (d: string) => string;
}

export default function RequisicoesTable({ requisicoes, busca, onAnalisar, onGerenciar, calcularDias }: RequisicoesTableProps) {
  const filtradas = requisicoes.filter(r => 
    r.protocolo?.toLowerCase().includes(busca.toLowerCase()) || 
    r.item_nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="overflow-x-auto flex-1 scrollbar-thin">
      <table className="w-full text-left">
        <thead className="bg-[var(--bg-base)]/90 border-b border-[var(--border)]">
          <tr>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[80px]">Nº Req.</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-left w-[150px]">Descrição</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[60px]">Ped.</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[60px]">Apr.</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[80px]">Tipo</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-left w-[120px]">Solicitante</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-center w-[40px]">D.</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-center w-[90px]">Status</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-center w-[120px]">Ação</th>
            <th className="px-3 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-center w-[100px]">Progresso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {filtradas.map(r => (
            <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-all group">
              <td className="px-3 py-4 text-center font-black text-[var(--brand)] text-[10px]">{r.protocolo || '---'}</td>
              <td className="px-3 py-4">
                <div className="text-[11px] font-black whitespace-normal w-[150px] leading-tight line-clamp-2">{r.item_nome || r.item}</div>
                <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5 opacity-70 truncate w-[150px]">
                  {r.secretaria_destino ? (
                    <span className="text-orange-600">{r.secretaria_destino} • </span>
                  ) : (
                    <span className="text-red-500 font-black">S/ SEC • </span>
                  )}
                  {r.unidade_destino}
                </div>
              </td>
              <td className="px-3 py-4 text-center text-[10px] font-bold text-[var(--text-muted)]">{r.quantidade} {r.unidade_medida}</td>
              <td className="px-3 py-4 text-center text-xs font-black text-blue-600">{r.quantidade_aprovada ?? '---'}</td>
              <td className="px-3 py-4 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${r.tipo_pedido === 'EMERGENCIAL' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-50 text-blue-600'}`}>
                  {r.tipo_pedido || 'MENSAL'}
                </span>
              </td>
              <td className="px-3 py-4">
                <div className="text-[10px] font-black text-slate-700 truncate w-[120px]">{r.solicitante}</div>
                <div className="text-[7px] font-bold text-slate-400 uppercase">{r.secretaria_origem || '---'}</div>
              </td>
              <td className="px-3 py-4 text-center">
                 <div className="flex flex-col items-center gap-0.5">
                    <Clock size={10} className="text-orange-500" />
                    <span className="text-[9px] font-black uppercase text-orange-600">{calcularDias(r.data_solicitacao)}</span>
                 </div>
              </td>
              <td className="px-3 py-4 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${r.status === 'SOLICITADO' ? 'bg-orange-100 text-orange-700' : r.status === 'APROVADO' ? 'bg-blue-100 text-blue-700' : r.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {r.status}
                </span>
              </td>
              <td className="px-3 py-4 text-center">
                <div className="flex justify-center gap-2">
                  {r.status === 'SOLICITADO' ? (
                    <button onClick={() => onAnalisar(r)} className="px-4 py-1.5 bg-black text-white rounded-lg text-[9px] font-black uppercase hover:scale-105 transition-all">Analisar</button>
                  ) : (
                    <button onClick={() => onGerenciar(r)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase hover:scale-105 transition-all flex items-center gap-2 ${r.status === 'ENTREGUE' ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white'}`} disabled={r.status === 'ENTREGUE'}>
                       <Truck size={12}/> Gerenciar
                    </button>
                  )}
                </div>
              </td>
              <td className="px-3 py-4 text-center">
                 <div className="flex flex-col items-center gap-0.5">
                    <div className="text-[9px] font-black text-[var(--text-primary)]">
                       {r.quantidade_entregue || 0}/{r.quantidade_aprovada || r.quantidade}
                    </div>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <div className={`h-full transition-all ${r.tem_ocorrencia ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, ((r.quantidade_entregue || 0) / (r.quantidade_aprovada || r.quantidade)) * 100)}%` }}></div>
                    </div>
                 </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
