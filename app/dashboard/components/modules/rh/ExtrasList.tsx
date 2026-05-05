"use client";
import { useState } from "react";
import { Clock, Calendar, MapPin, User, FileText, Download, TrendingUp } from "lucide-react";
import { format, isAfter, isBefore, startOfMonth, addMonths, subMonths, setDate } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExtrasListProps {
  extras: any[];
}

export default function ExtrasList({ extras }: ExtrasListProps) {
  const [selectedCycle, setSelectedCycle] = useState(new Date());

  // Lógica de Ciclo: 23 do mês anterior até 22 do mês atual
  const getCycleRange = (date: Date) => {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    
    // Início: dia 23 do mês anterior (ou do próprio mês se quisermos o ciclo que fecha no próximo 22)
    // O usuário disse: "fechamento de ponto é até o dia 22 de cada mes"
    // Então o ciclo de MAIO fecha dia 22 de MAIO e começa dia 23 de ABRIL.
    
    const end = setDate(new Date(currentYear, currentMonth), 22);
    const start = setDate(subMonths(new Date(currentYear, currentMonth), 1), 23);
    
    return { start, end };
  };

  const { start, end } = getCycleRange(selectedCycle);

  const filtrados = extras.filter(e => {
    const dataExtra = new Date(e.data);
    return (isAfter(dataExtra, start) || dataExtra.getTime() === start.getTime()) && 
           (isBefore(dataExtra, end) || dataExtra.getTime() === end.getTime());
  });

  const totalHoras = filtrados.length; // Cada registro é uma extra (simplificação ou contagem)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
          <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-1">Ciclo de Fechamento</p>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-[var(--text-primary)]">
              {format(start, "dd/MM")} à {format(end, "dd/MM/yyyy")}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setSelectedCycle(subMonths(selectedCycle, 1))} className="p-2 hover:bg-[var(--bg-base)] rounded-lg transition-all border border-[var(--border)]"><Calendar size={14} /></button>
              <button onClick={() => setSelectedCycle(addMonths(selectedCycle, 1))} className="p-2 hover:bg-[var(--bg-base)] rounded-lg transition-all border border-[var(--border)]"><Calendar size={14} /></button>
            </div>
          </div>
        </div>

        <div className="bg-green-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-green-600/20">
          <p className="text-[10px] font-black uppercase opacity-80 mb-1 tracking-widest">Total de Extras no Ciclo</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black">{totalHoras}</h3>
            <TrendingUp size={32} className="opacity-40" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm flex items-center justify-center">
           <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">
              <Download size={16} /> Exportar para Folha
           </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <tr>
              <th className="p-6">Data</th>
              <th className="p-6">Colaborador (Substituto)</th>
              <th className="p-6">Unidade / Período</th>
              <th className="p-6">Motivo (Ausente)</th>
              <th className="p-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtrados.map((e, idx) => (
              <tr key={idx} className="hover:bg-[var(--bg-base)]/30 transition-colors group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[var(--text-primary)]">{format(new Date(e.data), "dd/MM/yyyy")}</span>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase italic">{e.horario}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 font-black text-xs">
                      {e.colaborador_substituto_nome?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--text-primary)] uppercase">{e.colaborador_substituto_nome}</p>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">ID: {e.colaborador_substituto_id?.substring(0,8)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1"><MapPin size={12} className="text-blue-500" /> {e.unidade}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit mt-1 ${e.periodo === 'NOTURNO' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                      {e.periodo}
                    </span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-[8px] font-black text-red-700 uppercase mb-0.5 tracking-tighter italic">Substituindo Ausência de:</p>
                    <p className="text-[10px] font-black text-red-900 uppercase">{e.colaborador_ausente_nome || "CARGA EXTRA / APOIO"}</p>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button className="p-3 text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"><FileText size={18} /></button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="p-20 text-center opacity-30">
                  <Clock size={48} className="mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhuma hora extra registrada neste ciclo.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
