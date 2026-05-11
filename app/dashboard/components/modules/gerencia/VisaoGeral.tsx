"use client";
import React, { useState } from "react";
import StatsCards from "./StatsCards";
import { 
  Users, Briefcase, LayoutDashboard, Package, Shield, 
  Clock, AlertTriangle, CheckCircle2, TrendingUp,
  MapPin, UserCheck, ClipboardList, Zap, Search
} from "lucide-react";

interface VisaoGeralProps {
  stats: any;
  logs: any[];
  asgPorSecretaria: { secretaria: string; total: number }[];
  cargos: { cargo: string; total: number }[];
  volantes: any[];
  requisicoesVolantes: any[];
  usuariosOnline: any[];
  selectedSecretaria: string;
  setSelectedSecretaria: (s: string) => void;
  selectedUnidade: string;
  setSelectedUnidade: (u: string) => void;
  unidadesList: any[];
}

type Sector = "GERAL" | "ALMOX" | "ENCARREGADO" | "RH" | "FISCAL";

export default function VisaoGeral({ 
  stats, logs, asgPorSecretaria, cargos, volantes, requisicoesVolantes, usuariosOnline,
  selectedSecretaria, setSelectedSecretaria, selectedUnidade, setSelectedUnidade, unidadesList
}: VisaoGeralProps) {
  const [activeSector, setActiveSector] = useState<Sector>("GERAL");

  const totalASG = asgPorSecretaria.reduce((acc, s) => acc + s.total, 0);
  
  // Extrai secretarias únicas da lista de colaboradores para o filtro
  const secretarias = Array.from(new Set(asgPorSecretaria.map(s => s.secretaria))).sort();

  const sectors = [
    { id: "GERAL", label: "Visão Geral", icon: LayoutDashboard, color: "var(--brand)" },
    { id: "ALMOX", label: "Almoxarifado", icon: Package, color: "#f59e0b" },
    { id: "ENCARREGADO", label: "Encarregado", icon: Shield, color: "#10b981" },
    { id: "RH", label: "RH & Pessoal", icon: Users, color: "#3b82f6" },
    { id: "FISCAL", label: "Fiscalização", icon: UserCheck, color: "#8b5cf6" },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">

      {/* FILTROS GLOBAIS DE GESTÃO */}
      <div className="flex flex-wrap items-center gap-6 p-6 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-20 -mt-20" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
            <Search size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Filtros de Contexto</h3>
            <p className="text-[9px] font-bold text-indigo-200 uppercase opacity-60">Recorte Global da Operação</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 flex-1 relative z-10">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[9px] font-black text-indigo-300 uppercase mb-1.5 block ml-1">Por Secretaria</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white p-3 outline-none hover:bg-white/10 transition-all cursor-pointer"
              value={selectedSecretaria}
              onChange={(e) => setSelectedSecretaria(e.target.value)}
            >
              <option value="" className="bg-slate-900">TODAS AS SECRETARIAS</option>
              {secretarias.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-[9px] font-black text-indigo-300 uppercase mb-1.5 block ml-1">Por Unidade</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white p-3 outline-none hover:bg-white/10 transition-all cursor-pointer"
              value={selectedUnidade}
              onChange={(e) => setSelectedUnidade(e.target.value)}
            >
              <option value="" className="bg-slate-900">TODAS AS UNIDADES</option>
              {unidadesList.map(u => <option key={u.id} value={u.nome} className="bg-slate-900">{u.nome}</option>)}
            </select>
          </div>

          {(selectedSecretaria || selectedUnidade) && (
            <button 
              onClick={() => { setSelectedSecretaria(""); setSelectedUnidade(""); }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-[10px] font-black uppercase transition-all mt-5"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>
      
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

      {activeSector === "FISCAL" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <KPICard label="Diretores Ativos" value={stats.diretoresAtivos} icon={UserCheck} color="bg-purple-600" />
           <KPICard label="Vontades / Pedidos" value={stats.solicitacoesDiretor} icon={Sparkles} color="bg-indigo-500" />
           <KPICard label="Alterações Hoje" value={logs.filter(l => l.mensagem.includes('DIRETOR:')).length} icon={RefreshCw} color="bg-blue-600" />
           <KPICard label="Unidades Sem Fiscal" value={42 - stats.diretoresAtivos} icon={Building2} color="bg-slate-500" />
        </div>
      )}

      {/* CONTEÚDO ESPECÍFICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Distribuição e Listas */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {activeSector === "GERAL" && (
            <div className="flex flex-col gap-8 animate-in slide-in-from-left duration-500">
               {/* SAÚDE DOS PROCESSOS */}
               <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden p-10">
                  <div className="flex items-center gap-6 mb-10">
                    <div className="w-16 h-16 bg-[var(--brand)]/10 rounded-[2rem] flex items-center justify-center text-[var(--brand)]">
                      <LayoutDashboard size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[var(--text-primary)] italic tracking-tighter">Status dos Processos</h3>
                      <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Visão macro de eficiência operacional</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ProcessStat label="Auditoria de Escala" status="EM DIA" pct={98} color="bg-green-500" />
                    <ProcessStat label="Atendimento SLA" status="ALERTA" pct={72} color="bg-orange-500" />
                    <ProcessStat label="Entregas Almox" status="EFICIENTE" pct={94} color="bg-blue-500" />
                    <ProcessStat label="Cobertura de Vagas" status="CRÍTICO" pct={45} color="bg-red-500" />
                    <ProcessStat label="Fiscalização Direta" status={stats.diretoresAtivos > 10 ? "ATIVO" : "INICIAL"} pct={Math.round((stats.diretoresAtivos / 42) * 100)} color="bg-purple-500" />
                  </div>
               </div>

               {/* ATIVIDADE DO SISTEMA (VISITAS/LOGS) */}
               <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <Zap size={24} className="text-yellow-500" />
                      <h3 className="text-xl font-black text-[var(--text-primary)] italic tracking-tighter">Atividade do Sistema</h3>
                    </div>
                    <span className="px-4 py-1.5 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                      Sistema Estável
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-[var(--bg-base)] rounded-[2rem] border border-[var(--border)] text-center">
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Acessos Hoje</p>
                      <h4 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{stats.acessosHoje}</h4>
                    </div>
                    <div className="p-6 bg-[var(--bg-base)] rounded-[2rem] border border-[var(--border)] text-center">
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Usuários Online</p>
                      <h4 className="text-3xl font-black text-green-500 tracking-tighter">{usuariosOnline.length}</h4>
                    </div>
                    <div className="p-6 bg-[var(--bg-base)] rounded-[2rem] border border-[var(--border)] text-center">
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Interações/Min</p>
                      <h4 className="text-3xl font-black text-blue-500 tracking-tighter">{stats.interacoesPorMinuto}</h4>
                    </div>
                  </div>

                  {/* TABELA DE USUÁRIOS ONLINE */}
                  <div className="mt-10 bg-[var(--bg-base)] rounded-[2rem] border border-[var(--border)] overflow-hidden">
                    <div className="px-8 py-4 border-b border-[var(--border)] bg-[var(--bg-card)]/50">
                       <p className="text-[10px] font-black uppercase text-[var(--text-primary)] tracking-widest">Colaboradores em Atividade</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                       {usuariosOnline.length === 0 ? (
                         <p className="text-center py-10 text-[10px] font-black text-[var(--text-muted)] uppercase opacity-50">Ninguém online no momento</p>
                       ) : (
                         <table className="w-full text-left">
                            <thead className="bg-[var(--bg-base)] text-[9px] font-black text-[var(--text-muted)] uppercase border-b border-[var(--border)]">
                               <tr>
                                  <th className="px-8 py-3">Usuário</th>
                                  <th className="px-8 py-3">Última Ação</th>
                                  <th className="px-8 py-3 text-right">Status</th>
                               </tr>
                            </thead>
                            <tbody>
                               {usuariosOnline.map((user, idx) => (
                                 <tr key={idx} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--brand)]/5 transition-all">
                                    <td className="px-8 py-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] font-black text-xs">
                                             {user.usuario_nome?.charAt(0)}
                                          </div>
                                          <p className="text-[11px] font-black text-[var(--text-primary)] uppercase">{user.usuario_nome}</p>
                                       </div>
                                    </td>
                                    <td className="px-8 py-4">
                                       <p className="text-[10px] font-bold text-[var(--text-muted)]">
                                          {new Date(user.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                       </p>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[8px] font-black uppercase">
                                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                          Ativo
                                       </span>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                       )}
                    </div>
                  </div>
               </div>
            </div>
          )}
          
          {activeSector === "RH" && (
            <div className="flex flex-col gap-8 animate-in slide-in-from-left duration-500">
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
            </div>
          )}

          {activeSector === "FISCAL" && (
            <div className="flex flex-col gap-8 animate-in slide-in-from-left duration-500">
               <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden p-10">
                  <div className="flex items-center gap-4 mb-8">
                     <Sparkles size={24} className="text-indigo-500" />
                     <h3 className="text-xl font-black text-[var(--text-primary)] italic tracking-tighter">Solicitações do Contratante</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                     {logs.filter(l => l.mensagem.includes('DIRETOR:')).slice(0, 5).map((log, idx) => (
                        <div key={idx} className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                 <RefreshCw size={18} className="group-hover:rotate-180 transition-all duration-700" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{log.mensagem}</p>
                                 <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
                                    {new Date(log.created_at).toLocaleDateString()} • {log.usuario_nome}
                                 </p>
                              </div>
                           </div>
                           <button className="px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Analisar</button>
                        </div>
                     ))}
                     {logs.filter(l => l.mensagem.includes('DIRETOR:')).length === 0 && (
                        <p className="text-center py-10 text-[10px] font-black text-[var(--text-muted)] uppercase opacity-50 italic">Nenhuma interação de fiscalização detectada hoje.</p>
                     )}
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

// Subcomponente de Status de Processo
function ProcessStat({ label, status, pct, color }: any) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-[9px] font-black px-2 py-0.5 rounded-md inline-block ${status === 'EM DIA' ? 'bg-green-500/10 text-green-600' : status === 'CRÍTICO' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'}`}>
            {status}
          </p>
        </div>
        <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter">{pct}%</span>
      </div>
      <div className="w-full bg-[var(--bg-base)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
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
