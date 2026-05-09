"use client";
import React from "react";
import StatsCards from "./StatsCards";
import ActivitiesLog from "./ActivitiesLog";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap, Users, Briefcase } from "lucide-react";

interface VisaoGeralProps {
  stats: any;
  logs: any[];
  asgPorSecretaria: { secretaria: string; total: number }[];
  cargos: { cargo: string; total: number }[];
}

export default function VisaoGeral({ stats, logs, asgPorSecretaria, cargos }: VisaoGeralProps) {
  const ticketsPendentes = stats?.ticketsAbertos ?? null;
  const vagas = stats?.totalVagas ?? null;
  const colaboradores = stats?.totalColaboradores ?? null;
  const ultimaAtualizacao = new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const statusCompliance = ticketsPendentes === 0 ? '100% Auditado' : `${ticketsPendentes} pend.`;

  const totalASG = asgPorSecretaria.reduce((acc, s) => acc + s.total, 0);
  const maxASG = asgPorSecretaria[0]?.total || 1;
  const maxCargo = cargos[0]?.total || 1;

  return (
    <div className="flex flex-col gap-10 animate-fade-in">

      {/* KPI Cards */}
      <StatsCards stats={stats} />

      {/* === PAINEL ASG POR SECRETARIA === */}
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
          <div className="text-right">
            <p className="text-4xl font-black text-[var(--brand)] tracking-tighter">{totalASG}</p>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">total ativos</p>
          </div>
        </div>

        <div className="p-8">
          {asgPorSecretaria.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest opacity-50">
              Nenhum ASG encontrado no sistema.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {asgPorSecretaria.map((item, idx) => {
                const pct = Math.round((item.total / maxASG) * 100);
                const isTop = idx === 0;
                return (
                  <div
                    key={item.secretaria}
                    className={`p-5 rounded-2xl border transition-all group hover:shadow-md ${isTop ? 'bg-orange-500/5 border-orange-500/20' : 'bg-[var(--bg-base)] border-[var(--border)]'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {isTop && (
                          <span className="text-[8px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                            TOP
                          </span>
                        )}
                        <span className={`text-[11px] font-black uppercase tracking-wide ${isTop ? 'text-orange-700' : 'text-[var(--text-primary)]'}`}>
                          {item.secretaria}
                        </span>
                      </div>
                      <span className={`text-2xl font-black tracking-tighter ${isTop ? 'text-orange-600' : 'text-[var(--text-primary)]'}`}>
                        {item.total}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--bg-base)] rounded-full h-1.5 overflow-hidden border border-[var(--border)]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isTop ? 'bg-orange-500' : 'bg-[var(--brand)]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1.5 text-right">{pct}% do maior grupo</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* === QUADRO: DISTRIBUIÇÃO POR CARGO === */}
      <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="px-10 pt-10 pb-6 border-b border-[var(--border)] flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
            <Briefcase size={24} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--text-primary)] italic tracking-tighter">Distribuição por Cargo</h3>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Efetivo ativo agrupado por função — Top 20</p>
          </div>
        </div>

        <div className="p-8">
          {cargos.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest opacity-50">
              Nenhum dado de cargo disponível.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cargos.map((item, idx) => {
                const pct = Math.round((item.total / maxCargo) * 100);
                const intensity = pct > 75 ? 'border-blue-400 bg-blue-500/10' : pct > 40 ? 'border-[var(--border)] bg-[var(--bg-base)]' : 'border-[var(--border)] bg-[var(--bg-base)] opacity-80';
                return (
                  <div key={item.cargo} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${intensity}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-[9px] font-black uppercase tracking-wide text-[var(--text-muted)] leading-tight line-clamp-2">{item.cargo}</p>
                      <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter shrink-0">{item.total}</span>
                    </div>
                    <div className="w-full bg-[var(--bg-card)] rounded-full h-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Linha inferior: Insights + Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-slate-900 text-white">
                  <ShieldCheck className="mb-4 text-orange-500" size={32} />
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status Compliance</h5>
                  <p className="text-2xl font-black mt-2 tracking-tighter">{statusCompliance}</p>
                </div>
                <div className="p-6 rounded-3xl bg-[var(--bg-base)] border border-[var(--border)]">
                  <Clock className="mb-4 text-blue-500" size={32} />
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Atualizado em</h5>
                  <p className="text-2xl font-black mt-2 tracking-tighter text-[var(--text-primary)]">Hoje, {ultimaAtualizacao}</p>
                </div>
                <div className="p-6 rounded-3xl bg-[var(--bg-base)] border border-[var(--border)]">
                  <Zap className="mb-4 text-green-500" size={32} />
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Vagas em Aberto</h5>
                  <p className="text-2xl font-black mt-2 tracking-tighter text-[var(--text-primary)]">{vagas !== null ? vagas : '---'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <ActivitiesLog logs={logs} />
        </div>
      </div>

    </div>
  );
}
