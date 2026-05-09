"use client";
import { Clock, Truck, Package, Archive, CheckCircle2, FileText } from "lucide-react";

interface RequisicoesTableProps {
  requisicoes: any[];
  busca: string;
  onAnalisar: (r: any) => void;
  onGerenciar: (r: any) => void;
  onArquivar?: (id: string) => void;
  mostrarArquivados?: boolean;
  calcularDias: (d: string) => string;
}

export default function RequisicoesTable({ 
  requisicoes, busca, onAnalisar, onGerenciar, onArquivar, mostrarArquivados, calcularDias 
}: RequisicoesTableProps) {
  const filtradas = requisicoes.filter(r => {
    // Filtro de Arquivamento
    if (!mostrarArquivados && r.arquivado) return false;
    if (mostrarArquivados && !r.arquivado) return false;

    return (
      r.protocolo?.toLowerCase().includes(busca.toLowerCase()) || 
      r.solicitante?.toLowerCase().includes(busca.toLowerCase()) ||
      r.unidade_destino?.toLowerCase().includes(busca.toLowerCase()) ||
      r.itens?.some((it:any) => it.item_nome?.toLowerCase().includes(busca.toLowerCase()))
    );
  });

  return (
    <div className="overflow-x-auto flex-1 scrollbar-thin">
      <table className="w-full text-left">
        <thead className="bg-[var(--bg-base)]/90 border-b border-[var(--border)]">
          <tr>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[120px]">Protocolo</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-[var(--text-muted)] text-left">Solicitante / Unidade</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Itens</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Tipo</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-muted tracking-widest text-center w-[60px]">Aberto</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-muted tracking-widest text-center w-[100px]">Status</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-muted tracking-widest text-center w-[150px]">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {filtradas.map(group => {
            const totalItens = group.itens?.length || 0;
            const itensEntregues = group.itens?.filter((it:any) => it.status === 'ENTREGUE').length || 0;
            const progressoGeral = Math.round((itensEntregues / totalItens) * 100);

            return (
              <tr key={group.protocolo} className="hover:bg-[var(--bg-base)]/30 transition-all group">
                <td className="px-6 py-6 text-center">
                  <div className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-black text-[11px] border border-orange-100 shadow-sm">
                    {group.protocolo}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{group.solicitante}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {group.secretaria_destino && (
                        <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">{group.secretaria_destino}</span>
                      )}
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{group.unidade_destino}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                   <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-600">
                        <FileText size={14} className="text-blue-500" />
                        {totalItens} <span className="text-[9px] text-slate-400 font-bold uppercase">Materiais</span>
                      </div>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${progressoGeral}%` }}></div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${group.tipo_pedido === 'EMERGENCIAL' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                    {group.tipo_pedido || 'MENSAL'}
                  </span>
                </td>
                <td className="px-6 py-6 text-center">
                   <div className="flex flex-col items-center gap-0.5">
                      <Clock size={12} className="text-orange-500" />
                      <span className="text-[10px] font-black uppercase text-orange-600">{calcularDias(group.data)}</span>
                   </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    group.status_geral === 'SOLICITADO' ? 'bg-orange-100 text-orange-700' : 
                    group.status_geral === 'APROVADO' ? 'bg-blue-100 text-blue-700' : 
                    group.status_geral === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {group.status_geral}
                  </span>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="flex justify-center gap-3">
                    {group.status_geral === 'SOLICITADO' ? (
                      <button 
                        onClick={() => onAnalisar(group)} 
                        className="h-10 px-6 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                      >
                        Analisar Pedido
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 w-full">
                        <button 
                          onClick={() => onGerenciar(group)} 
                          className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 ${
                            group.status_geral === 'ENTREGUE' ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                          }`} 
                          disabled={group.status_geral === 'ENTREGUE'}
                        >
                          <Truck size={14}/> Gerenciar Entrega
                        </button>
                        {group.status_geral === 'ENTREGUE' && !group.arquivado && (
                          <button 
                            onClick={() => onArquivar?.(group.protocolo)} 
                            className="h-8 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
                          >
                            <Archive size={12}/> Arquivar Protocolo
                          </button>
                        )}
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
  );
}
