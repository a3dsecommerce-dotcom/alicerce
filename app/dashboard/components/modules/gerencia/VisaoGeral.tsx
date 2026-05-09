"use client";
import React, { useState } from "react";
import StatsCards from "./StatsCards";
import { 
  Users, Briefcase, LayoutDashboard, Package, Shield, 
  Clock, AlertTriangle, CheckCircle2, TrendingUp,
  MapPin, UserCheck, ClipboardList, Zap
} from "lucide-react";

interface VisaoGeralProps {
  stats: any;
  logs: any[];
  asgPorSecretaria: { secretaria: string; total: number }[];
  cargos: { cargo: string; total: number }[];
  volantes: any[];
  requisicoesVolantes: any[];
}

type Sector = "GERAL" | "ALMOX" | "ENCARREGADO" | "RH";

export default function VisaoGeral({ stats, logs, asgPorSecretaria, cargos, volantes, requisicoesVolantes }: VisaoGeralProps) {
  const [activeSector, setActiveSector] = useState<Sector>("GERAL");

  const totalASG = asgPorSecretaria.reduce((acc, s) => acc + s.total, 0);
  const maxASG = asgPorSecretaria[0]?.total || 1;
  const maxCargo = cargos[0]?.total || 1;

  const sectors = [
    { id: "GERAL", label: "Visão Geral", icon: LayoutDashboard, color: "var(--brand)" },
    { id: "ALMOX", label: "Almoxarifado", icon: Package, color: "#f59e0b" },
    { id: "ENCARREGADO", label: "Encarregado", icon: Shield, color: "#10b981" },
    { id: "RH", label: "RH & Pessoal", icon: Users, color: "#3b82f6" },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* SUB-NAVEGAÇÃO SETORIAL */}
      <div className="flex flex-wrap gap-4 p-2 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] shadow-sm">
        {sectors.map((s) => {
          const isActive = activeSector === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSector(s.id as Sector)}
              className={`
                flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${isActive 
                  ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" 
                  : "bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border)]"
                }
              `}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* KPI CARDS DINÂMICOS */}
      {activeSector === "GERAL" && <StatsCards stats={stats} />}
      
      {activeSector === "ALMOX" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <KPICard label="Requisições Hoje" value={stats.totalRequisicoes} icon={ClipboardList} color="bg-orange-500" />
           <KPICard label="Estoque Baixo" value="12" icon={AlertTriangle} color="bg-red-500" />
           <KPICard label="Saídas (Mês)" value="R$ 4.2k" icon={TrendingUp} color="bg-blue-500" />
           <KPICard label="Status Entrega" value="98%" icon={CheckCircle2} color="bg-green-500" />
        </div>
      )}

      {activeSector === "ENCARREGADO" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <KPICard label="Tickets Abertos" value={stats.ticketsAbertos} icon={AlertTriangle} color="bg-red-500" />
           <KPICard label="Vistoria Hoje" value="08" icon={Zap} color="bg-yellow-500" />
           <KPICard label="Transferências" value="05" icon={MapPin} color="bg-blue-500" />
           <KPICard label="SLA Atendimento" value="4h" icon={Clock} color="bg-purple-500" />
        </div>
      )}

      {activeSector === "RH" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <KPICard label="Efetivo Ativo" value={stats.totalColaboradores} icon={Users} color="bg-blue-500" />
           <KPICard label="Vagas Abertas" value={stats.totalVagas} icon={Briefcase} color="bg-green-500" />
           <KPICard label="Faltas Hoje" value="02" icon={AlertTriangle} color="bg-red-500" />
           <KPICard label="ASGs Totais" value={totalASG} icon={UserCheck} color="bg-orange-500" />
        </div>
      )}

      {/* CONTEÚDO ESPECÍFICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Distribuição e Listas */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {(activeSector === "GERAL" || activeSector === "RH") && (
            <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden">
              <div className="px-10 pt-10 pb-6 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                    <Users size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] italic tracking-tighter">ASGs por Secretaria</h3>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Distribuição do efetivo operacional</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {asgPorSecretaria.map((item, idx) => {
                    const pct = Math.round((item.total / maxASG) * 100);
                    return (
                      <div key={item.secretaria} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wide text-[var(--text-primary)]">{item.secretaria}</span>
                          <span className="text-xl font-black text-[var(--text-primary)]">{item.total}</span>
                        </div>
                        <div className="w-full bg-[var(--bg-card)] rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {(activeSector === "GERAL" || activeSector === "RH") && (
            <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden">
              <div className="px-10 pt-10 pb-6 border-b border-[var(--border)] flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Briefcase size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] italic tracking-tighter">Distribuição por Cargo</h3>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Top 20 funções ativas</p>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cargos.map((item) => {
                    const pct = Math.round((item.total / maxCargo) * 100);
                    return (
                      <div key={item.cargo} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)]">
                        <p className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 truncate">{item.cargo}</p>
                        <span className="text-xl font-black text-[var(--text-primary)]">{item.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {(activeSector === "ENCARREGADO") && (
             <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl p-10 flex items-center justify-center min-h-[400px] opacity-50 border-dashed">
                <div className="text-center">
                  <Zap size={48} className="mx-auto mb-4 text-yellow-500" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Dash do Encarregado</h4>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] max-w-xs mt-2 italic">Módulo de monitoramento de campo em fase de integração de dados em tempo real.</p>
                </div>
             </div>
          )}

          {(activeSector === "ALMOX") && (
             <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl p-10 flex items-center justify-center min-h-[400px] opacity-50 border-dashed">
                <div className="text-center">
                  <Package size={48} className="mx-auto mb-4 text-orange-500" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Dash do Almoxarifado</h4>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] max-w-xs mt-2 italic">Módulo de controle de suprimentos e inventário — Carregando métricas de estoque.</p>
                </div>
             </div>
          )}

        </div>

        {/* Lado Direito: Feed de Atividades */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden sticky top-8">
            <div className="px-8 pt-8 pb-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-black text-[var(--text-primary)] italic tracking-tighter">Atividades Recentes</h3>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Logs de sistema em tempo real</p>
            </div>
            <div className="p-6 flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-center text-[10px] font-bold text-[var(--text-muted)] py-10 uppercase tracking-widest opacity-50">Sem atividades recentes</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex gap-4 group p-3 rounded-2xl hover:bg-[var(--bg-base)] transition-all">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand)] mt-2 shrink-0 group-hover:scale-125 transition-all" />
                    <div>
                      <p className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{log.mensagem}</p>
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {log.usuario_nome || 'Sistema'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Subcomponente de KPI para facilitar
function KPICard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">{label}</p>
        <h4 className="text-3xl font-black text-[var(--text-primary)] mt-1 tracking-tighter">{value}</h4>
      </div>
    </div>
  );
}
