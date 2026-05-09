"use client";
import { useState } from "react";
import { Clock, Calendar, MapPin, User, FileText, Download, AlertCircle, Trash2, ShieldAlert } from "lucide-react";
import { format, isAfter, isBefore, subMonths, setDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface FaltasListProps {
  faltas: any[];
  onDelete?: (id: string) => void;
}

export default function FaltasList({ faltas, onDelete }: FaltasListProps) {
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

  const filtrados = faltas.filter(e => {
    const dataFalta = new Date(e.data);
    return (isAfter(dataFalta, start) || dataFalta.getTime() === start.getTime()) && 
           (isBefore(dataFalta, end) || dataFalta.getTime() === end.getTime());
  });

  const handleGerarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE ABSENTEÍSMO (FALTAS)", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${format(start, "dd/MM/yyyy")} até ${format(end, "dd/MM/yyyy")}`, 14, 28);
    doc.text(`Total de Registros: ${filtrados.length}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Colaborador', 'Unidade', 'Justificada', 'Atestado', 'Sugestão Punição']],
      body: filtrados.map(e => [
        format(new Date(e.data), "dd/MM/yyyy"),
        e.colaborador_ausente_nome || "NÃO INFORMADO",
        e.unidade,
        e.justificada ? "SIM" : "NÃO",
        e.tem_atestado ? "SIM" : "NÃO",
        e.sugestao_punicao || "N/A"
      ]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }, // Red 600
    });

    doc.save(`Relatorio_Faltas_${format(start, "MM_yyyy")}.pdf`);
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
               <button onClick={() => setSelectedCycle(subMonths(selectedCycle, 1))} className="p-2 hover:bg-[var(--bg-base)] rounded-lg border border-[var(--border)] transition-all"><Calendar size={14}/></button>
            </div>
          </div>
        </div>

        <div className="bg-red-600 p-8 rounded-3xl text-white shadow-xl shadow-red-600/20">
          <p className="text-[11px] font-black uppercase opacity-80 mb-1 tracking-widest">Faltas no Ciclo</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black">{filtrados.length}</h3>
            <ShieldAlert size={32} className="opacity-40" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm flex items-center justify-center">
           <button onClick={handleGerarPDF} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">
              <Printer size={18} /> Exportar Relatório Faltas
           </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <tr>
                <th className="p-8 pl-10">Data</th>
                <th className="p-8">Colaborador Ausente</th>
                <th className="p-8">Justificativa / Atestado</th>
                <th className="p-8">Sugestão / Medida</th>
                <th className="p-8 text-right pr-10">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtrados.map((e, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-base)]/30 transition-colors group">
                  <td className="p-8 pl-10">
                    <span className="text-sm font-black text-[var(--text-primary)]">{format(new Date(e.data), "dd/MM/yyyy")}</span>
                  </td>
                  <td className="p-8">
                    <div>
                      <p className="text-sm font-black text-[var(--text-primary)] uppercase">{e.colaborador_ausente_nome || "NÃO INFORMADO"}</p>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-1 flex items-center gap-2"><MapPin size={12}/> {e.unidade}</p>
                    </div>
                  </td>
                  <td className="p-8">
                     <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${e.justificada ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {e.justificada ? 'Justificada' : 'Não Justificada'}
                        </span>
                        {e.tem_atestado && (
                           <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-blue-100 text-blue-700 flex items-center gap-1">
                              <FileText size={10}/> Atestado
                           </span>
                        )}
                     </div>
                  </td>
                  <td className="p-8">
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
                       {e.sugestao_punicao || "SEM SUGESTÃO"}
                    </span>
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
                    <AlertCircle size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum registro de falta neste ciclo.</p>
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

import { Printer } from "lucide-react";
