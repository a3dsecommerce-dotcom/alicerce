"use client";
import { useState, useEffect } from "react";
import { 
  Users, AlertTriangle, Package, TrendingUp, TrendingDown, Clock, 
  CheckCircle2, Activity, Cpu, MessageSquare, Briefcase, 
  Zap, Loader, Navigation, UserPlus, ShieldCheck, AlertOctagon, 
  UserX, Truck, FileText, ChevronRight, User, Calendar, Plus, MapPin
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { supabase } from "@/lib/supabase";
import ColaboradoresSharedTable from "../ColaboradoresSharedTable";

// ── Mock Data para Gráficos ──────────────────
const ocorrenciasSemanais = [
  { sem: "S1", total: 12 }, { sem: "S2", total: 18 }, { sem: "S3", total: 9 },
  { sem: "S4", total: 24 }, { sem: "S5", total: 15 }, { sem: "S6", total: 21 },
  { sem: "S7", total: 11 }, { sem: "S8", total: 17 },
];

function KPICard({ title, value, sub, icon: Icon, color, trend, trendUp, loading }: any) {
  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:border-[var(--brand)] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-opacity-10 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${color}20`, color }}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-2">
        {loading ? <Loader className="animate-spin text-[var(--text-muted)]" size={24} /> : value}
      </div>
      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{title}</p>
      {sub && <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

export default function CommandModule({ stats, loading }: { stats: any, loading: boolean }) {
  const [setorAtivo, setSetorAtivo] = useState("OPERACIONAL");
  
  const configSetores: any = {
    OPERACIONAL: {
      kpis: [
        { title: "Ocorrências Campo", value: stats.ocorrenciasAtivas, sub: `${stats.pendentes} urgentes`, icon: AlertOctagon, color: "#EF4444", trend: "Crítico", trendUp: false },
        { title: "Rotas Ativas", value: "12", sub: "Monitoramento GPS", icon: Navigation, color: "#3B82F6", trend: "100%", trendUp: true },
        { title: "Evolução Missão", value: "78%", sub: "Meta da semana", icon: TrendingUp, color: "#10B981", trend: "5%", trendUp: true },
      ]
    },
    ALMOXARIFADO: {
      kpis: [
        { title: "EPIs em Estoque", value: "1.420", sub: `${stats.itensCriticos} críticos`, icon: Package, color: "#3B82F6", trend: "Normal" },
        { title: "Eficiência Entrega", value: "94%", sub: "Req. vs Entregas", icon: Truck, color: "#10B981", trend: "2%", trendUp: true },
        { title: "Pendências Unidade", value: "45", sub: "Aguardando baixa", icon: FileText, color: "#F59E0B", trend: "Sinc", trendUp: true },
      ]
    },
    RH: [
      { title: "Admissões Mês", value: stats.vagasCandidatos, sub: "Funil ativo", icon: UserPlus, color: "#10B981", trend: "Ativo", trendUp: true },
      { title: "Compliance Doc", value: "82%", sub: "% Documentos faltantes", icon: ShieldCheck, color: "#3B82F6", trend: "Alerta", trendUp: false },
      { title: "Advertências", value: "04", sub: "Últimos 30 dias", icon: AlertTriangle, color: "#EF4444", trend: "Audit" },
    ]
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {configSetores[setorAtivo].kpis ? (
          configSetores[setorAtivo].kpis.map((kpi: any) => (
            <KPICard key={kpi.title} {...kpi} loading={loading} />
          ))
        ) : (
          configSetores[setorAtivo].map((kpi: any) => (
            <KPICard key={kpi.title} {...kpi} loading={loading} />
          ))
        )}
        <KPICard title="Latência Ops" value="0.6s" sub="Sync n8n ativo" icon={Zap} color="#00d2ff" trend="OK" trendUp loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="flex flex-col gap-8">
          <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)]">
             <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-6">Volume de Eventos Semanais</h3>
             <ResponsiveContainer width="100%" height={300}>
               <AreaChart data={ocorrenciasSemanais}>
                 <defs>
                   <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="sem" tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                 <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                 <Tooltip />
                 <Area type="monotone" dataKey="total" stroke="var(--brand)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-8">
           <ColaboradoresSharedTable />
        </div>
      </div>
    </div>
  );
}
