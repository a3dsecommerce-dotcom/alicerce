"use client";
import React from "react";
import StatsCards from "./StatsCards";
import ActivitiesLog from "./ActivitiesLog";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap } from "lucide-react";

interface VisaoGeralProps {
  stats: any;
  logs: any[];
}

export default function VisaoGeral({ stats, logs }: VisaoGeralProps) {
  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      
      {/* KPI Section */}
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Analysis & Insights */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          
          <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
               <TrendingUp size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-600">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] italic">Insights da Diretoria</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-[var(--bg-base)] border border-[var(--border)] hover:border-orange-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Performance de RH</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <ArrowUpRight size={10} /> +12%
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] leading-relaxed">
                    A taxa de preenchimento de vagas aumentou em relação ao mês anterior. Foco atual em <span className="text-orange-600">Almoxarifado</span>.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[var(--bg-base)] border border-[var(--border)] hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Fluxo de Compras</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <ArrowDownRight size={10} /> -4h
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] leading-relaxed">
                    Tempo médio de aprovação reduzido. Eficiência operacional em <span className="text-blue-600">92%</span> de conformidade SLA.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-xl text-white">
               <ShieldCheck className="mb-4 text-orange-500" size={32} />
               <h5 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status Compliance</h5>
               <p className="text-2xl font-black mt-2 tracking-tighter">100% Auditado</p>
            </div>
            <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
               <Clock className="mb-4 text-blue-500" size={32} />
               <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Último Snapshot</h5>
               <p className="text-2xl font-black mt-2 tracking-tighter text-[var(--text-primary)]">Hoje, 03:00</p>
            </div>
            <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
               <Zap className="mb-4 text-green-500" size={32} />
               <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Saúde do Sistema</h5>
               <p className="text-2xl font-black mt-2 tracking-tighter text-[var(--text-primary)]">Excelente</p>
            </div>
          </div>

        </div>

        {/* Right Column: Activity Log */}
        <div className="flex flex-col gap-6">
           <ActivitiesLog logs={logs} />
        </div>

      </div>

    </div>
  );
}
