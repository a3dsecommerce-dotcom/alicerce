"use client";
import { useState, useEffect } from "react";
import { 
  Users, DollarSign, Activity, ShieldAlert, 
  TrendingUp, BarChart3, Zap, Bell, 
  ArrowUpRight, ArrowDownRight, Briefcase, 
  CheckCircle, Clock, Megaphone, Settings,
  PieChart, Globe, Cpu, Layout, Search, Filter,
  ShieldCheck, MessageSquare, AlertTriangle, FileText,
  Map as MapIcon, HardHat, UserPlus, ClipboardList
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import RHModule from "./RHModule";

type GerenciaTab = "OVERVIEW" | "INTEL_BI" | "COMMS" | "ETHICS" | "FINANCE" | "RH_FULL" | "OPERACIONAL";

export default function GerenciaModule({ initialTab }: { initialTab?: GerenciaTab }) {
  const [activeTab, setActiveTab] = useState<GerenciaTab>(initialTab || "OVERVIEW");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("crm_user");
    if (saved) setUser(JSON.parse(saved));
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 h-full px-4 lg:px-8">
      
      {/* 1. NAVEGAÇÃO DE TOPO UNIFICADA */}
      <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] shadow-sm sticky top-0 z-30 backdrop-blur-md overflow-x-auto custom-scrollbar">
         {[
           { id: "OVERVIEW", label: "Centro de Comando", icon: Layout },
           { id: "RH_FULL", label: "Recursos Humanos", icon: Users },
           { id: "OPERACIONAL", label: "Gestão de Campo", icon: HardHat },
           { id: "INTEL_BI", label: "Inteligência BI", icon: BarChart3 },
           { id: "COMMS", label: "Comunicados Master", icon: Megaphone },
           { id: "ETHICS", label: "Canal de Ética", icon: ShieldAlert },
           { id: "FINANCE", label: "Financeiro", icon: DollarSign },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as GerenciaTab)}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[0.7rem] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {/* 2. CONTEÚDO DINÂMICO */}
      <div className="flex-1 min-h-[700px]">
        
        {/* VIEW: CENTRO DE COMANDO (OVERVIEW) - AGORA EM LARGURA TOTAL */}
        {activeTab === "OVERVIEW" && (
          <div className="flex flex-col gap-10 animate-fade-in">
             
             {/* 📡 MONITOR DE EXPANSÃO (ONDAS V45.0) */}
             <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Cpu size={120} className="text-[var(--brand)]" />
                </div>
                
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-4">
                   <div>
                      <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tighter">
                         <Zap className="text-orange-500" fill="currentColor" /> Roadmap de Expansão Soberana V45.0
                      </h3>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Status de Implementação dos Módulos Estratégicos</p>
                   </div>
                   <div className="px-6 py-2 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-green-600 uppercase">Sistema Online & Operacional</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[
                      { id: 1, label: "ONDA 1: Ponto & Presença", status: "100%", desc: "Ponto Digital, Visão por Unidade, Volante Multi", color: "bg-green-500" },
                      { id: 2, label: "ONDA 2: Ciclo de Vida RH", status: "85%", desc: "Admissão, Demissão e Gestão de Documentos", color: "bg-blue-500" },
                      { id: 3, label: "ONDA 3: Suprimentos Pro", status: "60%", desc: "Requisições, Entregas parciais e Coeficientes", color: "bg-orange-500" },
                   ].map(onda => (
                      <div key={onda.id} className="p-6 bg-[var(--bg-base)]/40 rounded-3xl border border-[var(--border)] group/onda hover:border-[var(--brand)]/30 transition-all">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase text-[var(--brand)]">{onda.label}</span>
                            <span className="text-xs font-black">{onda.status}</span>
                         </div>
                         <div className="h-2 w-full bg-[var(--bg-base)] rounded-full mb-4 overflow-hidden border border-[var(--border)]">
                            <div className={`h-full ${onda.color} shadow-lg transition-all duration-1000`} style={{ width: onda.status }} />
                         </div>
                         <p className="text-[9px] text-[var(--text-muted)] font-medium leading-relaxed">{onda.desc}</p>
                      </div>
                   ))}
                </div>
             </div>
             
             {/* STATS SUPERIORES (INFO UNIDADE + APROVAÇÕES) */}
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  { label: "Performance", value: "94.2%", icon: Activity, color: "text-green-500", detail: "+2.1% este mês" },
                  { label: "Orçamento", value: "68%", icon: DollarSign, color: "text-orange-500", detail: "R$ 1.2M disponíveis" },
                  { label: "SLA Operacional", value: "96%", icon: ShieldCheck, color: "text-blue-500", detail: "Metas batidas" },
                  { label: "Suplementos", value: "03", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", detail: "Aprovações pendentes" },
                  { id: "tickets", label: "Novas Vagas", value: "05", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50", detail: "Triagem em andamento" },
                  { id: "security", label: "Denúncias", value: "02", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", detail: "Ethics Channel" },
                ].map((s, i) => (
                  <div key={i} className={`p-6 rounded-[2.5rem] border border-[var(--border)] shadow-sm ${s.bg || 'bg-[var(--bg-card)]'} group hover:scale-105 transition-all cursor-pointer relative overflow-hidden`}>
                     <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2 text-center tracking-widest">{s.label}</p>
                     <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-md ${s.color} group-hover:rotate-6 transition-transform`}><s.icon size={22} /></div>
                        <h4 className="text-2xl font-black tracking-tighter">{s.value}</h4>
                        <p className="text-[8px] font-bold opacity-60 uppercase">{s.detail}</p>
                     </div>
                  </div>
                ))}
             </div>

             {/* TABELA/MATRIZ EM LARGURA TOTAL */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* MATRIZ DE INTELIGÊNCIA */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-xl relative overflow-hidden">
                   <div className="flex justify-between items-center mb-10">
                      <h3 className="text-sm font-black uppercase flex items-center gap-2 tracking-widest"><Zap size={18} className="text-blue-500" /> Matriz de Inteligência de Pessoal</h3>
                      <button className="text-[10px] font-black uppercase text-[var(--brand)] hover:underline">Full Analytics</button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {[
                        { label: "Saúde (SEMSA)", val: 98, cor: "bg-green-500" },
                        { label: "Educação (SEMED)", val: 92, cor: "bg-blue-500" },
                        { label: "Administração", val: 85, cor: "bg-purple-500" },
                        { label: "Infraestrutura", val: 76, cor: "bg-orange-500" },
                      ].map((setor, i) => (
                        <div key={i} className="space-y-4 p-6 bg-[var(--bg-base)]/30 rounded-2xl border border-[var(--border)]/50">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                              <span>{setor.label}</span>
                              <span className="text-[var(--brand)]">{setor.val}%</span>
                           </div>
                           <div className="h-3 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)]">
                              <div className={`h-full ${setor.cor} shadow-lg`} style={{ width: `${setor.val}%` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* SWARM ACTIVITY (Ticker de Agentes IA) */}
                <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
                   <h3 className="text-xs font-black uppercase mb-8 flex items-center gap-2 tracking-widest">
                      <Activity size={16} className="text-green-500" /> Atividade do Swarm
                   </h3>
                   <div className="space-y-6">
                      {[
                         { agent: "RH Agent", task: "Triagem de 12 novos candidatos", time: "2m atrás", icon: Users, color: "text-blue-500" },
                         { agent: "Almox Agent", task: "Reposicionamento de estoque (Detergente)", time: "15m atrás", icon: Package, color: "text-orange-500" },
                         { agent: "Security Audit", task: "Verificação de inconsistência de ponto", time: "1h atrás", icon: ShieldCheck, color: "text-green-500" },
                         { agent: "Governance", task: "Relatório Mensal consolidado", time: "3h atrás", icon: FileText, color: "text-purple-500" },
                      ].map((item, idx) => (
                         <div key={idx} className="flex gap-4 items-start group">
                            <div className={`mt-1 p-2 rounded-lg bg-[var(--bg-base)] ${item.color} group-hover:scale-110 transition-transform`}>
                               <item.icon size={14} />
                            </div>
                            <div className="flex-1 border-b border-[var(--border)] pb-4 group-last:border-0">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">{item.agent}</span>
                                  <span className="text-[8px] text-[var(--text-muted)] font-bold">{item.time}</span>
                               </div>
                               <p className="text-[10px] text-[var(--text-secondary)] font-medium">{item.task}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: RECURSOS HUMANOS (MODO EXPANDIDO DIRETOR) */}
        {activeTab === "RH_FULL" && (
           <div className="animate-fade-in bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-2">
              <RHModule user={user} isDirectorView={true} />
           </div>
        )}

        {/* OUTROS MÓDULOS (OPERACIONAL) */}
        {activeTab === "OPERACIONAL" && (
          <div className="animate-fade-in bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] p-10">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black italic">Gestão de Campo Alicerce</h3>
                <button className="px-8 py-3 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--brand)]/20 hover:scale-105 transition-all flex items-center gap-2">
                   <UserPlus size={16} /> Escalar Encarregado
                </button>
             </div>
             
             {/* TABELA DE CAMPO EM LARGURA TOTAL */}
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-[var(--border)]">
                         <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Unidade / Posto</th>
                         <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Encarregado</th>
                         <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Última Visita</th>
                         <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                      {[
                        { posto: "UBS Central", enc: "Marcos Oliveira", data: "Hoje, 08:30", status: "NORMAL" },
                        { posto: "Escola V7", enc: "Sérgio Lima", data: "Ontem, 16:45", status: "ALERTA" },
                        { posto: "SEMAD Prédio A", enc: "Cláudio Ramos", data: "Hoje, 09:15", status: "NORMAL" },
                      ].map((v, i) => (
                        <tr key={i} className="hover:bg-[var(--bg-base)]/50 transition-colors">
                           <td className="p-6 font-black text-sm">{v.posto}</td>
                           <td className="p-6 text-xs font-bold text-[var(--text-secondary)]">{v.enc}</td>
                           <td className="p-6 text-xs font-medium text-[var(--text-muted)]">{v.data}</td>
                           <td className="p-6 text-right">
                              <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase ${v.status === 'NORMAL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {v.status}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
