"use client";
import { Clock, Activity } from "lucide-react";

interface LogEntry {
  id: string;
  usuario_nome: string;
  acao: string;
  modulo: string;
  created_at: string;
}

interface ActivitiesLogProps {
  logs: LogEntry[];
}

export default function ActivitiesLog({ logs }: ActivitiesLogProps) {
  return (
    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col flex-1">
      <div className="p-8 border-b border-[var(--border)] flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black italic uppercase">Auditoria de Atividades</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Logs em tempo real de movimentações no sistema</p>
        </div>
        <Activity className="text-[var(--brand)] opacity-20" size={32} />
      </div>
      
      <div className="flex-1 overflow-auto p-8 space-y-4 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="p-20 text-center opacity-30 flex flex-col items-center">
            <Clock size={48} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Nenhuma atividade recente</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-center gap-6 p-5 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)] hover:border-[var(--brand)]/30 transition-all">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[var(--brand)] font-black text-xs shadow-sm">
                {log.modulo.substring(0,1).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-[var(--text-primary)] leading-tight">
                  <span className="text-[var(--brand)]">{log.usuario_nome}</span> {log.acao}
                </p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{log.modulo}</span>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
