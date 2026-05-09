"use client";
import { useState } from "react";
import { Clock, Calendar, MapPin, User, FileText, Download, TrendingUp, Trash2 } from "lucide-react";
import { format, isAfter, isBefore, startOfMonth, addMonths, subMonths, setDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExtrasListProps {
  extras: any[];
  onDelete?: (id: string) => void;
}

export default function ExtrasList({ extras, onDelete }: ExtrasListProps) {
  const [selectedCycle, setSelectedCycle] = useState(new Date());

  // Lógica de Ciclo: 23 do mês anterior até 22 do mês atual
  const getCycleRange = (date: Date) => {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    
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

  const totalHoras = filtrados.length;

  const handleGerarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE HORAS EXTRAS - OPERACIONAL", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${format(start, "dd/MM/yyyy")} até ${format(end, "dd/MM/yyyy")}`, 14, 28);
    doc.text(`Total de Registros: ${totalHoras}`, 14, 34);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [['Data', 'Colaborador', 'Unidade', 'Período', 'Motivo (Substituído)']],
      body: filtrados.map(e => [
        format(new Date(e.data), "dd/MM/yyyy"),
        e.colaborador_substituto_nome,
        e.unidade,
        e.periodo,
        e.colaborador_ausente_nome || "APOIO / CARGA EXTRA"
      ]),
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }, // Green 600
      styles: { fontSize: 8, font: "helvetica" }
    });

    doc.save(`Relatorio_Extras_${format(start, "MM_yyyy")}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">Ciclo de Fechamento</p>
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

        <div className="bg-green-600 p-8 rounded-3xl text-white shadow-xl shadow-green-600/20">
          <p className="text-[11px] font-black uppercase opacity-80 mb-1 tracking-widest">Total de Extras no Ciclo</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black">{totalHoras}</h3>
            <TrendingUp size={32} className="opacity-40" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm flex items-center justify-center">
           <button 
            onClick={handleGerarPDF}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
           >
              <FileText size={18} /> Gerar PDF para Impressão
           </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <tr>
                <th className="p-8 pl-10">Data</th>
                <th className="p-8">Colaborador (Substituto)</th>
                <th className="p-8">Unidade / Período</th>
                <th className="p-8">Motivo (Ausente)</th>
                <th className="p-8 text-right pr-10">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtrados.map((e, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-base)]/30 transition-colors group">
                  <td className="p-8 pl-10">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[var(--text-primary)]">{format(new Date(e.data), "dd/MM/yyyy")}</span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase italic mt-0.5">{e.horario}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 font-black text-sm border border-green-500/10 shadow-inner">
                        {e.colaborador_substituto_nome?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--text-primary)] uppercase leading-tight">{e.colaborador_substituto_nome}</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-1">ID: {e.colaborador_substituto_id?.substring(0,8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> {e.unidade}</span>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg w-fit mt-2 ${e.periodo === 'NOTURNO' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                        {e.periodo}
                      </span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                      <p className="text-[9px] font-black text-red-700 uppercase mb-1 tracking-tighter italic opacity-70">Substituindo Ausência de:</p>
                      <p className="text-[11px] font-black text-red-900 uppercase tracking-tight">{e.colaborador_ausente_nome || "CARGA EXTRA / APOIO"}</p>
                    </div>
                  </td>
                  <td className="p-8 text-right pr-10">
                    <button 
                      onClick={() => onDelete && onDelete(e.id)}
                      className="w-12 h-12 rounded-xl bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 border border-[var(--border)] transition-all inline-flex items-center justify-center shadow-sm"
                    >
                      <Trash2 size={20} />
                    </button>
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
    </div>
  );
}
