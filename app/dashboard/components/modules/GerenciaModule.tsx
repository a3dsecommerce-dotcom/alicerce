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
             
             {/* STATS SUPERIORES (INFO UNIDADE + APROVAÇÕES) */}
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  { label: "Performance", value: "94.2%", icon: Activity, color: "text-green-500" },
                  { label: "Orçamento", value: "68%", icon: DollarSign, color: "text-orange-500" },
                  { label: "SLA Operacional", value: "96%", icon: ShieldCheck, color: "text-purple-500" },
                  // APROVAÇÕES MOVIDAS PARA O TOPO COMO QUADRADOS DE STATUS
                  { label: "Suplementos", value: "03", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
                  { label: "Novas Vagas", value: "05", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Denúncias", value: "02", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
                ].map((s, i) => (
                  <div key={i} className={`p-6 rounded-[2rem] border border-[var(--border)] shadow-sm ${s.bg || 'bg-[var(--bg-card)]'} group hover:scale-105 transition-all`}>
                     <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2 text-center">{s.label}</p>
                     <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm ${s.color}`}><s.icon size={18} /></div>
                        <h4 className="text-xl font-black">{s.value}</h4>
                     </div>
                  </div>
                ))}
             </div>

             {/* TABELA/MATRIZ EM LARGURA TOTAL */}
             <div className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-sm font-black uppercase flex items-center gap-2 tracking-widest"><Zap size={18} className="text-blue-500" /> Matriz de Inteligência de Pessoal Alicerce</h3>
                   <button className="text-[10px] font-black uppercase text-[var(--brand)] hover:underline">Ver Relatório Completo</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                   {[
                     { label: "Saúde (SEMSA)", val: 98, cor: "bg-green-500" },
                     { label: "Educação (SEMED)", val: 92, cor: "bg-blue-500" },
                     { label: "Administração (SEMAD)", val: 85, cor: "bg-purple-500" },
                     { label: "Infraestrutura", val: 76, cor: "bg-orange-500" },
                     { label: "Social (SEMAS)", val: 94, cor: "bg-emerald-500" },
                     { label: "Meio Ambiente", val: 89, cor: "bg-teal-500" }
                   ].map((setor, i) => (
                     <div key={i} className="space-y-4 p-6 bg-[var(--bg-base)]/30 rounded-2xl border border-[var(--border)]/50">
                        <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
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
