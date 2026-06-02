"use client";
import { useState } from "react";
import { Calendar, MapPin, FileText, AlertCircle, Trash2, ShieldAlert, Printer, ArrowUpRight, Eye } from "lucide-react";
import { format, isAfter, isBefore, subMonths, setDate } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

interface FaltasListProps {
  faltas: any[];
  onDelete?: (id: string) => void;
}

const ORIGEM_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  ENCARREGADO: { label: "Encarregado", color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-800", icon: "👷" },
  EXTRA:       { label: "Extra/Substituição", color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800", icon: "🔄" },
  DIRETOR:     { label: "Pedido Volante", color: "text-indigo-700", bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-200 dark:border-indigo-800", icon: "🏫" },
};

export default function FaltasList({ faltas, onDelete }: FaltasListProps) {
  const [selectedCycle, setSelectedCycle] = useState(new Date());
  const [filtroOrigem, setFiltroOrigem] = useState<string>("");
  const [selecionada, setSelecionada] = useState<any>(null);

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
    const inCycle = (isAfter(dataFalta, start) || dataFalta.getTime() === start.getTime()) && 
           (isBefore(dataFalta, end) || dataFalta.getTime() === end.getTime());
    const matchOrigem = !filtroOrigem || e._origem === filtroOrigem;
    return inCycle && matchOrigem;
  });

  // Contadores por origem
  const countEncarregado = filtrados.filter(f => f._origem === 'ENCARREGADO').length;
  const countExtra = filtrados.filter(f => f._origem === 'EXTRA').length;
  const countDiretor = filtrados.filter(f => f._origem === 'DIRETOR').length;

  const handleGerarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE ABSENTEÍSMO (FALTAS)", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${format(start, "dd/MM/yyyy")} até ${format(end, "dd/MM/yyyy")}`, 14, 28);
    doc.text(`Total de Registros: ${filtrados.length} (Encarregado: ${countEncarregado} | Extra: ${countExtra} | Diretor: ${countDiretor})`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Colaborador', 'Unidade', 'Origem', 'Justificada', 'Atestado', 'Observações']],
      body: filtrados.map(e => [
        format(new Date(e.data), "dd/MM/yyyy"),
        e.colaborador_ausente_nome || "NÃO INFORMADO",
        e.unidade || "—",
        ORIGEM_CONFIG[e._origem]?.label || e._origem || "—",
        e.justificada ? "SIM" : "NÃO",
        e.tem_atestado ? "SIM" : "NÃO",
        e.observacoes || e.sugestao_punicao || "—"
      ]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 8 },
    });

    doc.save(`Relatorio_Faltas_${format(start, "MM_yyyy")}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-red-600 p-6 rounded-3xl text-white shadow-xl shadow-red-600/20">
          <p className="text-[10px] font-black uppercase opacity-80 mb-1 tracking-widest">Total no Ciclo</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black">{filtrados.length}</h3>
            <ShieldAlert size={28} className="opacity-40" />
          </div>
        </div>

        <button 
          onClick={() => setFiltroOrigem(filtroOrigem === 'ENCARREGADO' ? '' : 'ENCARREGADO')}
          className={`p-6 rounded-3xl border shadow-sm text-left transition-all ${filtroOrigem === 'ENCARREGADO' ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950 border-orange-300' : 'bg-[var(--bg-card)] border-[var(--border)]'}`}
        >
          <p className="text-[10px] font-black uppercase text-orange-600 mb-1 tracking-widest">👷 Encarregado</p>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{countEncarregado}</h3>
        </button>

        <button
          onClick={() => setFiltroOrigem(filtroOrigem === 'EXTRA' ? '' : 'EXTRA')}
          className={`p-6 rounded-3xl border shadow-sm text-left transition-all ${filtroOrigem === 'EXTRA' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950 border-blue-300' : 'bg-[var(--bg-card)] border-[var(--border)]'}`}
        >
          <p className="text-[10px] font-black uppercase text-blue-600 mb-1 tracking-widest">🔄 Extra/Subst.</p>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{countExtra}</h3>
        </button>

        <button
          onClick={() => setFiltroOrigem(filtroOrigem === 'DIRETOR' ? '' : 'DIRETOR')}
          className={`p-6 rounded-3xl border shadow-sm text-left transition-all ${filtroOrigem === 'DIRETOR' ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950 border-indigo-300' : 'bg-[var(--bg-card)] border-[var(--border)]'}`}
        >
          <p className="text-[10px] font-black uppercase text-indigo-600 mb-1 tracking-widest">🏫 Ped. Volante</p>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{countDiretor}</h3>
        </button>

        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm flex flex-col items-center justify-center gap-2">
          <button onClick={handleGerarPDF} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">
            <Printer size={16} /> Exportar PDF
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedCycle(subMonths(selectedCycle, 1))} className="p-1.5 hover:bg-[var(--bg-base)] rounded-lg border border-[var(--border)] transition-all text-[var(--text-muted)]">
              <Calendar size={12}/>
            </button>
            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">
              {format(start, "dd/MM")} — {format(end, "dd/MM")}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela Unificada */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <tr>
                <th className="p-6 pl-8">Data</th>
                <th className="p-6">Origem</th>
                <th className="p-6">Colaborador Ausente</th>
                <th className="p-6">Unidade</th>
                <th className="p-6">Justificativa / Atestado</th>
                <th className="p-6">Detalhes</th>
                <th className="p-6 text-right pr-8">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtrados.map((e, idx) => {
                const origemCfg = ORIGEM_CONFIG[e._origem] || ORIGEM_CONFIG.ENCARREGADO;
                return (
                  <tr 
                    key={e.id || idx} 
                    className="hover:bg-[var(--bg-base)]/30 transition-colors cursor-pointer group"
                    onClick={() => setSelecionada(e)}
                  >
                    <td className="p-6 pl-8">
                      <span className="text-sm font-black text-[var(--text-primary)]">
                        {e.data ? format(new Date(e.data), "dd/MM/yyyy") : "—"}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${origemCfg.bg} ${origemCfg.color} ${origemCfg.border}`}>
                        <span>{origemCfg.icon}</span> {origemCfg.label}
                      </span>
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="text-sm font-black text-[var(--text-primary)] uppercase">{e.colaborador_ausente_nome || "NÃO INFORMADO"}</p>
                        {e.criado_por_nome && (
                          <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1">
                            Informado por: {e.criado_por_nome}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                        <MapPin size={12}/> {e.unidade || "—"}
                      </p>
                    </td>
                    <td className="p-6">
                       <div className="flex flex-wrap gap-2">
                         {e._origem === 'ENCARREGADO' && (
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${e.justificada ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {e.justificada ? 'Justificada' : 'Não Justificada'}
                           </span>
                         )}
                         {e.tem_atestado && (
                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                               <FileText size={10}/> Atestado {e.dias_atestado ? `(${e.dias_atestado}d)` : ''}
                            </span>
                         )}
                         {e._origem === 'EXTRA' && (
                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                              <ArrowUpRight size={10}/> Subst: {e.colaborador_substituto_nome || '—'}
                            </span>
                         )}
                         {e._origem === 'DIRETOR' && e.justificada && (
                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Atestado via Diretor
                            </span>
                         )}
                       </div>
                    </td>
                    <td className="p-6">
                      {e.sugestao_punicao ? (
                        <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          {e.sugestao_punicao}
                        </span>
                      ) : e.observacoes ? (
                        <span className="text-[9px] font-bold text-[var(--text-muted)] max-w-[200px] truncate block">{e.observacoes}</span>
                      ) : (
                        <span className="text-[9px] text-[var(--text-muted)] opacity-40">—</span>
                      )}
                    </td>
                    <td className="p-6 text-right pr-8">
                      <div className="flex gap-2 justify-end items-center">
                        <button
                          onClick={(evt) => { evt.stopPropagation(); setSelecionada(e); }}
                          className="w-10 h-10 rounded-xl bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-alpha)] border border-[var(--border)] transition-all inline-flex items-center justify-center shadow-sm"
                          title="Ver Detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        {!e._readonly && onDelete ? (
                          <button 
                            onClick={(evt) => { evt.stopPropagation(); onDelete(e.id); }}
                            className="w-10 h-10 rounded-xl bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border border-[var(--border)] transition-all inline-flex items-center justify-center shadow-sm"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center opacity-30">
                    <AlertCircle size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum registro de falta neste ciclo.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-[var(--bg-base)]/50 border-t border-[var(--border)] flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            {filtrados.length} registro(s) {filtroOrigem ? `— Filtro: ${ORIGEM_CONFIG[filtroOrigem]?.label}` : '— Todas as fontes'}
          </span>
          {filtroOrigem && (
            <button onClick={() => setFiltroOrigem('')} className="text-[9px] font-black uppercase text-[var(--brand)] hover:underline">
              Limpar Filtro
            </button>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Falta */}
      <AdaptiveModal 
        isOpen={!!selecionada} 
        onClose={() => setSelecionada(null)} 
        title="Detalhes do Registro de Falta"
        width="600px"
      >
        {selecionada && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              {(() => {
                const orig = ORIGEM_CONFIG[selecionada._origem] || ORIGEM_CONFIG.ENCARREGADO;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${orig.bg} ${orig.color} ${orig.border}`}>
                    <span>{orig.icon}</span> {orig.label}
                  </span>
                );
              })()}
              <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-xs">
                <Calendar size={14} /> {selecionada.data ? format(new Date(selecionada.data), "dd/MM/yyyy") : "—"}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">Colaborador Ausente</label>
              <div className="flex items-center gap-3 p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black text-sm">
                  {selecionada.colaborador_ausente_nome?.substring(0, 2).toUpperCase() || "CF"}
                </div>
                <div>
                  <h4 className="text-sm font-black text-[var(--text-primary)] uppercase">{selecionada.colaborador_ausente_nome || "NÃO INFORMADO"}</h4>
                  {selecionada.criado_por_nome && (
                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-0.5">
                      Informado por: {selecionada.criado_por_nome}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-white/50 dark:bg-black/20">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 block">Localização / Unidade</label>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                  <MapPin size={16} className="text-red-500" /> {selecionada.unidade || "—"}
                </div>
              </div>
              
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-white/50 dark:bg-black/20">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 block">Status de Justificativa</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selecionada._origem === 'ENCARREGADO' && (
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${selecionada.justificada ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selecionada.justificada ? 'Justificada' : 'Não Justificada'}
                    </span>
                  )}
                  {selecionada.tem_atestado && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-blue-100 text-blue-700 flex items-center gap-1">
                      <FileText size={10}/> Atestado {selecionada.dias_atestado ? `(${selecionada.dias_atestado}d)` : ''}
                    </span>
                  )}
                  {selecionada._origem === 'EXTRA' && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-blue-100 text-blue-700 flex items-center gap-1">
                      Substituição Ativa
                    </span>
                  )}
                  {selecionada._origem === 'DIRETOR' && selecionada.justificada && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-amber-100 text-amber-700">
                      Diretoria
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selecionada._origem === 'EXTRA' && selecionada.colaborador_substituto_nome && (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl">
                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1 block">Colaborador Substituto (Extra)</label>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-2">
                  <ArrowUpRight size={14} /> {selecionada.colaborador_substituto_nome}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Detalhamento / Observações</label>
              <div className="p-5 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] text-[0.88rem] text-[var(--text-secondary)] leading-relaxed shadow-inner">
                {selecionada.observacoes || "Nenhuma observação adicional registrada."}
              </div>
            </div>

            {selecionada.sugestao_punicao && (
              <div>
                <label className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase mb-2 block tracking-widest">Medida Disciplinar / Punição Sugerida</label>
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-100 dark:border-red-900 text-xs font-black text-red-900 dark:text-red-400 flex items-center gap-2">
                  <ShieldAlert size={16} /> {selecionada.sugestao_punicao}
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-4">
              <button className="w-full btn-brand py-4 font-black uppercase tracking-wider" onClick={() => setSelecionada(null)}>
                Fechar Detalhes
              </button>
            </div>
          </div>
        )}
      </AdaptiveModal>
    </div>
  );
}
