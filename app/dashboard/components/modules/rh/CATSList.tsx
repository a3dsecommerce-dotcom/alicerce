"use client";
import { useState } from "react";
import { ShieldCheck, Calendar, MapPin, User, FileText, ChevronRight, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CATSListProps {
  cats: any[];
  onSelect: (cat: any) => void;
}

export default function CATSList({ cats, onSelect }: CATSListProps) {
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const filtrados = cats.filter(c => 
    filtroStatus === "TODOS" || c.status === filtroStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ANALISE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FINALIZADO': return 'bg-green-100 text-green-700 border-green-200';
      case 'ENVIADO_RH': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Relatórios de Investigação (CAT)</h3>
          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Comunicações de Acidentes de Trabalho enviadas pelos Encarregados</p>
        </div>
        <div className="flex gap-2 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
          {["TODOS", "EM_ANALISE", "ENVIADO_RH", "FINALIZADO"].map(s => (
            <button 
              key={s} 
              onClick={() => setFiltroStatus(s)}
              className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filtroStatus === s ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtrados.map((cat) => (
          <div 
            key={cat.id} 
            onClick={() => onSelect(cat)}
            className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--brand)] transition-all cursor-pointer group shadow-sm hover:shadow-xl"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-base font-black text-[var(--text-primary)] uppercase">{cat.colaborador_nome}</h4>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${getStatusColor(cat.status)}`}>
                      {cat.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase italic">
                    <span className="flex items-center gap-1.5"><User size={12} /> {cat.colaborador_cargo}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {cat.unidade_alocada}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {format(new Date(cat.data_ocorrido), "dd 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 pr-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1 tracking-widest">Tipo de Acidente</p>
                  <p className="text-xs font-black text-red-600 uppercase italic">{cat.tipo_acidente}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--brand)] group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="py-20 text-center bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)] opacity-50">
            <FileText size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-xs font-black uppercase tracking-widest">Nenhuma CAT encontrada para este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
}
