"use client";
import { Building2, MapPin, Settings, AlertTriangle, Printer, UserPlus } from "lucide-react";

interface MyUnitsTabProps {
  myUnits: string[];
  fullUnits: any[];
  myColabs: any[];
  onPrintUnidades: () => void;
  onPrintRoute: () => void;
  onEditUnidade: (unit: string) => void;
  onGoToTickets: (unit: string) => void;
  onGoToAdmission: () => void;
}

export default function MyUnitsTab({
  myUnits,
  fullUnits,
  myColabs,
  onPrintUnidades,
  onPrintRoute,
  onEditUnidade,
  onGoToTickets,
  onGoToAdmission,
}: MyUnitsTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1 italic">Povoamento Operacional</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Cadastre colaboradores diretamente nas suas unidades de rota</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onPrintUnidades}
            className="px-8 py-4 bg-white text-[var(--text-primary)] border border-[var(--border)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
          >
            <Printer size={18} /> Detalhes das Unidades
          </button>
          <button
            onClick={onPrintRoute}
            className="px-8 py-4 bg-white text-[var(--text-primary)] border border-[var(--border)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
          >
            <Printer size={18} /> Imprimir Rota
          </button>
          <button
            onClick={onGoToAdmission}
            className="px-10 py-4 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[var(--brand)]/20 flex items-center gap-3"
          >
            <UserPlus size={18} /> Admissão Rápida
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Unidades Sob Minha Responsabilidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myUnits.map((unit, i) => (
            <div
              key={i}
              className="p-8 bg-[var(--bg-base)] border border-[var(--border)] rounded-3xl flex flex-col gap-6 hover:border-[var(--brand)] transition-all group overflow-hidden"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white transition-all shrink-0">
                  <Building2 size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[var(--text-primary)] uppercase truncate mb-1">{unit}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                    {myColabs.filter(c => c.unidade_alocacao === unit).length} Colaboradores
                  </p>
                </div>
                <button
                  onClick={() => onGoToTickets(unit)}
                  className="p-3 bg-[var(--bg-card)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] hover:text-[var(--brand)] transition-all"
                >
                  <AlertTriangle size={18} />
                </button>
              </div>

              <div className="pt-6 border-t border-[var(--border)] flex gap-2">
                <button
                  onClick={() => onEditUnidade(unit)}
                  className="flex-1 py-3 bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all flex items-center justify-center gap-2"
                >
                  <Settings size={14} /> Editar Unidade
                </button>
                <button
                  onClick={() => onGoToTickets(unit)}
                  className="px-4 py-3 bg-[var(--bg-card)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] text-[9px] font-black uppercase hover:border-[var(--brand)] transition-all"
                >
                  Chamados
                </button>
              </div>
            </div>
          ))}
          {myUnits.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-50">
              <MapPin size={48} className="mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhuma unidade vinculada ao seu perfil.</p>
              <p className="text-[10px] font-bold mt-2 uppercase">Contate a gerência para definir suas rotas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
