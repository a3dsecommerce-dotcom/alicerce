"use client";
import { Clock, User, Package } from "lucide-react";

interface EntregasEPITableProps {
  requisicoes: any[];
  busca: string;
  calcularDias: (d: string) => string;
}

export default function EntregasEPITable({ requisicoes, busca, calcularDias }: EntregasEPITableProps) {
  // Filtra apenas entregas de EPI que já foram concluídas
  const entregas = requisicoes.filter(r => 
    r.tipo_item === 'EPI' && 
    r.status === 'ENTREGUE' &&
    (r.protocolo?.toLowerCase().includes(busca.toLowerCase()) || 
     r.item_nome?.toLowerCase().includes(busca.toLowerCase()) ||
     r.solicitante?.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="overflow-x-auto flex-1 scrollbar-thin">
      <table className="w-full text-left">
        <thead className="bg-[var(--bg-base)]/90 border-b border-[var(--border)]">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[120px]">Data</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-left">Colaborador / Item</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Qtd</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[150px]">Protocolo</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[120px]">Recebedor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {entregas.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">Nenhuma entrega de EPI registrada</td>
            </tr>
          ) : (
            entregas.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-600">{new Date(e.data_entrega || e.data_solicitacao).toLocaleDateString('pt-BR')}</span>
                    <span className="text-[8px] font-bold text-orange-500 uppercase">{calcularDias(e.data_solicitacao)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><User size={14}/></div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{e.solicitante}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><Package size={10}/> {e.item_nome}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs font-black text-blue-600">{e.quantidade_entregue || e.quantidade} {e.unidade_medida || 'UN'}</span>
                </td>
                <td className="px-6 py-4 text-center font-mono text-[10px] font-black text-slate-400">{e.protocolo}</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-[10px] font-black uppercase text-green-600">{e.recebedor_nome || 'Auto-Assinado'}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
