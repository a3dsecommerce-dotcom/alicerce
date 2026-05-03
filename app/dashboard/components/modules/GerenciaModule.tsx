"use client";
import { useState } from "react";
import { 
  Activity, Shield, Settings, Database, Loader, LayoutDashboard
} from "lucide-react";
import { useGerenciaData } from "./gerencia/useGerenciaData";
import StatsCards from "./gerencia/StatsCards";
import ActivitiesLog from "./gerencia/ActivitiesLog";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";

export default function GerenciaModule() {
  const { loading, logs, stats } = useGerenciaData();
  const [activeTab, setActiveTab] = useState<"VISAO" | "CONFIG" | "DB">("VISAO");

  if (loading) return (
    <div className="p-20">
      <TableSkeleton rows={12} cols={4} />
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      
      {/* HEADER GESTÃO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">Painel de Controle Central</h2>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Shield size={16} className="text-[var(--brand)]" /> Governança & Auditoria Alicerce ERP
          </p>
        </div>

        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-md overflow-x-auto w-full lg:w-auto">
          {[
            { id: "VISAO", label: "Visão Geral", icon: LayoutDashboard },
            { id: "CONFIG", label: "Configurações", icon: Settings },
            { id: "DB", label: "Banco de Dados", icon: Database }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-10 overflow-hidden">
        {activeTab === "VISAO" ? (
          <>
            <StatsCards stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 overflow-hidden min-h-[600px]">
              <div className="lg:col-span-2 flex flex-col">
                <ActivitiesLog logs={logs} />
              </div>

              <div className="space-y-8 flex flex-col">
                {/* CARD INSIGHTS RÁPIDOS */}
                <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
                  <h4 className="text-lg font-black uppercase italic relative z-10">Status do Sistema</h4>
                  <div className="mt-8 space-y-6 relative z-10">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-[10px] font-bold text-white/50 uppercase">Uptime VPS</span>
                      <span className="text-xs font-black text-green-400 uppercase">99.8%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-[10px] font-bold text-white/50 uppercase">Integridade DB</span>
                      <span className="text-xs font-black text-blue-400 uppercase">Excelente</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/50 uppercase">Segurança RLS</span>
                      <span className="text-xs font-black text-orange-400 uppercase">Ativo</span>
                    </div>
                  </div>
                  <button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-10">Relatório Forense</button>
                </div>

                <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl flex-1">
                   <h4 className="text-sm font-black uppercase mb-6 flex items-center gap-2">
                     <Activity size={18} className="text-blue-500" /> Alocação de Recursos
                   </h4>
                   <div className="space-y-6">
                      {/* Placeholders for resource allocation visualization */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--text-muted)]">
                          <span>SEMED</span>
                          <span>42%</span>
                        </div>
                        <div className="h-2 bg-[var(--bg-base)] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: '42%' }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--text-muted)]">
                          <span>SEMSA</span>
                          <span>28%</span>
                        </div>
                        <div className="h-2 bg-[var(--bg-base)] rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '28%' }}></div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-20 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)] opacity-40">
            <div className="text-center">
              <Settings size={64} className="mx-auto mb-6 text-[var(--brand)] animate-pulse" />
              <h3 className="text-xl font-black uppercase italic">Módulo em Desenvolvimento</h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2">As configurações de sistema estão sendo migradas para a nova arquitetura.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
