"use client";
import { Clock, Activity, ShieldCheck, Box, ShoppingCart, UserCheck, AlertTriangle } from "lucide-react";

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
  const getModuleIcon = (modulo: string) => {
    const m = modulo.toUpperCase();
    if (m.includes("RH")) return { icon: UserCheck, color: "text-blue-500", bg: "bg-blue-500/10" };
    if (m.includes("COMPRAS")) return { icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-500/10" };
    if (m.includes("ALMOX") || m.includes("UNIFORME")) return { icon: Box, color: "text-green-500", bg: "bg-green-500/10" };
    if (m.includes("DIRETOR") || m.includes("ADMIN")) return { icon: ShieldCheck, color: "text-slate-500", bg: "bg-slate-500/10" };
    return { icon: Activity, color: "text-[var(--brand)]", bg: "bg-[var(--brand)]/10" };
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col flex-1 max-h-[800px]">
      <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-white/5">
        <div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Trilha de Auditoria</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Monitoramento de Integridade Operacional</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-base)] flex items-center justify-center border border-[var(--border)] shadow-inner">
           <Activity className="text-[var(--brand)]" size={24} />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-8 space-y-4 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="p-20 text-center opacity-30 flex flex-col items-center">
            <Clock size={48} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Nenhum registro encontrado</p>
          </div>
        ) : (
          logs.map((log) => {
            const { icon: Icon, color, bg } = getModuleIcon(log.modulo);
            return (
              <div key={log.id} className="flex items-start gap-5 p-5 bg-[var(--bg-base)]/30 rounded-3xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-card)] transition-all group">
                <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-[13px] font-bold text-[var(--text-primary)] leading-snug">
                      <span className="font-black text-orange-600">{log.usuario_nome}</span> {log.acao}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`px-2 py-0.5 ${bg} ${color} text-[8px] font-black uppercase rounded-lg tracking-widest border border-current opacity-60`}>
                      {log.modulo}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] flex items-center gap-1">
                      <Clock size={10} /> {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-6 bg-[var(--bg-base)]/50 border-t border-[var(--border)] text-center">
         <button className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            Visualizar Relatório Completo de Auditoria
         </button>
      </div>
    </div>
  );
}
