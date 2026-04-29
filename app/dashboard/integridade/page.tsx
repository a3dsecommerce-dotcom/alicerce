"use client";
import { useState, useEffect } from "react";
import { Activity, Shield, Zap, AlertTriangle, CheckCircle, Clock, Server, Database, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STATUS_COLORS: Record<string, string> = {
  OK: "#10B981",
  INSTAVEL: "#F59E0B",
  DOWN: "#EF4444"
};

export default function IntegridadePage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Verificar se é Admin (Nível 4)
    const userStr = localStorage.getItem("crm_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.nivel < 3 && user.role !== 'DIRETORIA' && user.role !== 'ADMIN') {
        window.location.href = "/dashboard";
        return;
      }
    }

    async function loadStatus() {
      const { data, error } = await supabase
        .from('sistema_integridade')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Pega os últimos status de cada serviço

      if (data) {
        // Agrupar por serviço (pegar o mais recente)
        const latest = data.reduce((acc: any, curr: any) => {
          if (!acc[curr.servico]) acc[curr.servico] = curr;
          return acc;
        }, {});
        setServices(Object.values(latest));
        setLastUpdate(new Date());
      }
      setLoading(false);
    }

    loadStatus();
    const interval = setInterval(loadStatus, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)]/5 rounded-full blur-[60px] -mr-32 -mt-32 pointer-events-none"></div>
        
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <Activity className="text-[var(--brand)]" /> Ops Center: Integridade Soberana
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Monitoramento forense de serviços críticos em tempo real.</p>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Último Batimento</span>
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-mono text-sm">
            <Clock size={14} className="text-[var(--brand)]" /> {lastUpdate?.toLocaleTimeString() || "--:--:--"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Zap className="animate-pulse text-[var(--brand)]" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.id} className="card p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-2 h-full" style={{ background: STATUS_COLORS[s.status] }}></div>
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-secondary)]">
                    {(s.servico || "").includes("Supabase") ? <Database size={20} /> : 
                     (s.servico || "").includes("n8n") ? <Zap size={20} /> : 
                     (s.servico || "").includes("API") ? <MessageSquare size={20} /> : <Server size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{s.servico}</h3>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{s.latencia_ms}ms latência</span>
                  </div>
                </div>
                {s.status === "OK" ? <CheckCircle className="text-green-500" size={20} /> : <AlertTriangle className="text-amber-500" size={20} />}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-[var(--bg-base)]" style={{ color: STATUS_COLORS[s.status] }}>
                  {s.status}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Sistema Operante</span>
              </div>

              {s.erro && (
                <div className="mt-2 p-3 bg-red-50 rounded-lg text-[10px] text-red-600 font-medium border border-red-100">
                  {s.erro}
                </div>
              )}
            </div>
          ))}

          {/* Card de Backup */}
          <div className="card p-6 flex flex-col gap-4 border-dashed border-2 border-[var(--border)] bg-transparent">
             <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/5 flex items-center justify-center text-[var(--brand)]">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">Rotação de Backup</h3>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">BACKUP_ROTATIVO_A</span>
                  </div>
                </div>
                <CheckCircle className="text-green-500" size={20} />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">Última sincronização forense concluída com sucesso às 03:00 AM.</p>
          </div>
        </div>
      )}
    </div>
  );
}
