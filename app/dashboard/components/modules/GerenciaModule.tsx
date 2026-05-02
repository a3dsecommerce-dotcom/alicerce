"use client";
import { useState, useEffect } from "react";
import { 
  Users, DollarSign, Activity, ShieldAlert, 
  TrendingUp, BarChart3, Zap, 
  CheckCircle, Clock, Package,
  ShieldCheck, AlertTriangle, FileText,
  Truck, HardHat, Search, Filter, 
  ArrowUpRight, ArrowDownRight, MoreVertical,
  LogOut, LayoutDashboard, User, Map as MapIcon
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';
import { supabase } from "@/lib/supabase";

// --- DADOS SIMULADOS PARA GRÁFICOS (Baseados nos requisitos) ---
const trendData = [
  { name: 'Jan', ocorrencias: 45, resolucoes: 38 },
  { name: 'Fev', ocorrencias: 52, resolucoes: 48 },
  { name: 'Mar', ocorrencias: 48, resolucoes: 45 },
  { name: 'Abr', ocorrencias: 61, resolucoes: 55 },
  { name: 'Mai', ocorrencias: 55, resolucoes: 52 },
  { name: 'Jun', ocorrencias: 67, resolucoes: 60 },
  { name: 'Jul', ocorrencias: 72, resolucoes: 68 },
  { name: 'Ago', ocorrencias: 65, resolucoes: 62 },
  { name: 'Set', ocorrencias: 58, resolucoes: 55 },
  { name: 'Out', ocorrencias: 63, resolucoes: 60 },
  { name: 'Nov', ocorrencias: 70, resolucoes: 65 },
  { name: 'Dez', ocorrencias: 85, resolucoes: 80 },
];

const statusSecretariaData = [
  { name: 'Saúde', entregas: 850, pendentes: 120 },
  { name: 'Educação', entregas: 640, pendentes: 85 },
  { name: 'Obras', entregas: 420, pendentes: 150 },
  { name: 'ADM', entregas: 310, pendentes: 45 },
  { name: 'Social', entregas: 280, pendentes: 30 },
];

const distColabData = [
  { name: 'Saúde', value: 450, color: '#00d2ff' },
  { name: 'Educação', value: 380, color: '#00ff87' },
  { name: 'Obras', value: 220, color: '#ff9d00' },
  { name: 'Sede', value: 150, color: '#ff007a' },
];

const rhStatusData = [
  { name: 'Ativos', value: 1100, color: '#00ff87' },
  { name: 'Férias', value: 45, color: '#00d2ff' },
  { name: 'Afastados', value: 28, color: '#ff9d00' },
  { name: 'Faltas', value: 12, color: '#ff007a' },
];

const almoxarifadoValores = [
  { name: 'Saúde', value: 45000 },
  { name: 'Educação', value: 32000 },
  { name: 'Obras', value: 28000 },
  { name: 'ADM', value: 12000 },
];

const COLORS = ['#00d2ff', '#00ff87', '#ff9d00', '#ff007a', '#a855f7'];

export default function GerenciaModule({ user: propUser }: { user?: any }) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "OPERACIONAL" | "ALMOXARIFADO" | "RH" | "AUDITORIA">("OVERVIEW");
  const [user, setUser] = useState<any>(propUser || null);
  const [counts, setCounts] = useState({ colabs: 0, ativos: 0, afastados: 0, ocorrenciasMes: 0 });

  useEffect(() => {
    if (!propUser) {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    }
    fetchRealCounts();
  }, [propUser]);

  const fetchRealCounts = async () => {
    const { count: total } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
    const { count: ativos } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('status', 'ATIVO');
    const { count: afastados } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('status', 'AFASTADO');
    const { count: ocorrencias } = await supabase.from('tickets_sla').select('*', { count: 'exact', head: true });
    
    setCounts({ 
        colabs: total || 1200, 
        ativos: ativos || 1145, 
        afastados: afastados || 55, 
        ocorrenciasMes: ocorrencias || 142 
    });
  };

  // --- RENDERIZADORES DE ABA ---

  const renderOverview = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Colaboradores" value={counts.colabs.toString()} subValue={`${counts.ativos} Ativos / ${counts.afastados} Afast.`} icon={Users} trend="+2.4%" color="blue" />
        <KPICard title="Custo Requisições" value="R$ 142.5k" subValue="Média por Secretaria" icon={DollarSign} trend="+12%" color="orange" />
        <KPICard title="Tempo de Resposta" value="4.2h" subValue="Média Global (Ocorrências)" icon={Clock} trend="-15%" color="green" />
        <KPICard title="Ocorrências Mês" value={counts.ocorrenciasMes.toString()} subValue="Total acumulado" icon={AlertTriangle} trend="+5%" color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Tendência */}
        <div className="card h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Tendência de Ocorrências e Resoluções</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">ÚLTIMOS 12 MESES</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorOc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--neon-pink)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--neon-pink)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--neon-green)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--neon-green)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="ocorrencias" stroke="var(--neon-pink)" fillOpacity={1} fill="url(#colorOc)" strokeWidth={3} />
                <Area type="monotone" dataKey="resolucoes" stroke="var(--neon-green)" fillOpacity={1} fill="url(#colorRes)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Barras - Status Entrega */}
        <div className="card h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Status de Entrega por Secretaria</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">MENSAL</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusSecretariaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#1e1e2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="entregas" fill="var(--neon-blue)" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="pendentes" fill="var(--neon-orange)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribuição Colaboradores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="card md:col-span-1 h-[300px] flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-4">Distribuição por Setor</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={distColabData}
                            cx="50%" cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {distColabData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
         </div>
         <div className="card md:col-span-2 flex flex-col justify-center gap-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Atalhos Estratégicos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ShortcutBtn label="Relatório de Custos" icon={FileText} />
                <ShortcutBtn label="Escala de Volantes" icon={Truck} />
                <ShortcutBtn label="Mapa de Unidades" icon={MapIcon} />
                <ShortcutBtn label="Configurações RBAC" icon={Settings} />
            </div>
         </div>
      </div>
    </div>
  );

  const renderOperacional = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Funcionários / Rota" value="138" subValue="Média Ideal: 140" icon={Users} color="blue" />
          <KPICard title="Cobertura Total" value="98.2%" subValue="Unidades com Presença" icon={ShieldCheck} color="green" trend="+0.5%" />
          <KPICard title="Ocorrências Campo" value="24" subValue="Abertas hoje" icon={AlertTriangle} color="orange" trend="+12%" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card flex flex-col">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Top Encarregados p/ Ocorrências</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="text-[10px] font-black uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
                      <tr>
                         <th className="pb-4">Encarregado</th>
                         <th className="pb-4">Setor</th>
                         <th className="pb-4 text-center">Nº Ocorrências</th>
                         <th className="pb-4 text-right">T. Resposta</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                      {[
                        { nome: "Carlos Lima", setor: "Saúde Norte", total: 42, tempo: "1.5h" },
                        { nome: "Ana Paula", setor: "Educação Sul", total: 38, tempo: "2.1h" },
                        { nome: "Roberto Silva", setor: "Obras Centro", total: 29, tempo: "3.4h" },
                        { nome: "Julia Santos", setor: "Saúde Leste", total: 15, tempo: "1.2h" },
                      ].map((item, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                           <td className="py-4 text-sm font-bold text-[var(--text-primary)]">{item.nome}</td>
                           <td className="py-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-tighter">{item.setor}</td>
                           <td className="py-4 text-center text-sm font-black text-[var(--neon-pink)]">{item.total}</td>
                           <td className="py-4 text-right text-xs font-black text-[var(--neon-green)]">{item.tempo}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div className="card flex flex-col h-[400px]">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Tempo Médio de Resposta por Encarregado</h3>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                      { name: 'C. Lima', tempo: 1.5 },
                      { name: 'A. Paula', tempo: 2.1 },
                      { name: 'R. Silva', tempo: 3.4 },
                      { name: 'J. Santos', tempo: 1.2 },
                      { name: 'M. Alves', tempo: 2.8 },
                   ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} unit="h" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="tempo" fill="var(--neon-blue)" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );

  const renderAlmoxarifado = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard title="Resposta Almoxarifado" value="2.8h" subValue="Tempo médio de separação" icon={Package} color="blue" trend="-10%" />
          <KPICard title="Valor Total Entregue" value="R$ 842.000" subValue="EPIs e Uniformes (Ano)" icon={DollarSign} color="green" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card h-[400px] flex flex-col">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Valor de Requisições por Secretaria</h3>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={almoxarifadoValores}
                         cx="50%" cy="50%"
                         innerRadius={80}
                         outerRadius={110}
                         paddingAngle={5}
                         dataKey="value"
                      >
                         {almoxarifadoValores.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#1e1e2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="card flex flex-col">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Top 5 Materiais Mais Requisitados</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="text-[10px] font-black uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
                      <tr>
                         <th className="pb-4">Material</th>
                         <th className="pb-4 text-center">Quantidade</th>
                         <th className="pb-4 text-right">Valor Total</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                      {[
                        { nome: "Luva Nitrílica G", qtd: 1540, valor: "R$ 12.400" },
                        { nome: "Bota de Segurança", qtd: 850, valor: "R$ 42.500" },
                        { nome: "Uniforme Completo", qtd: 620, valor: "R$ 68.200" },
                        { nome: "Capa de Chuva PVC", qtd: 450, valor: "R$ 9.000" },
                        { nome: "Máscara PFF2", qtd: 2400, valor: "R$ 4.800" },
                      ].map((item, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                           <td className="py-4 text-sm font-bold text-[var(--text-primary)]">{item.nome}</td>
                           <td className="py-4 text-center text-sm font-black text-[var(--neon-blue)]">{item.qtd}</td>
                           <td className="py-4 text-right text-sm font-black text-[var(--neon-green)]">{item.valor}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </div>
  );

  const renderRH = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard title="Resposta RH" value="1.5 dias" subValue="Média p/ Solicitações" icon={Users} color="blue" trend="-0.5 dias" />
          <KPICard title="Novas Admissões" value="15" subValue="Este mês" icon={UserPlus} color="green" trend="+3" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card h-[400px] flex flex-col">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Status Geral do Quadro</h3>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={rhStatusData} cx="50%" cy="50%" outerRadius={100} label dataKey="value">
                         {rhStatusData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="card h-[400px] flex flex-col">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Taxa de Turnover por Secretaria</h3>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                      { name: 'Saúde', taxa: 2.1 },
                      { name: 'Educação', taxa: 1.5 },
                      { name: 'Obras', taxa: 4.8 },
                      { name: 'ADM', taxa: 0.8 },
                      { name: 'Social', taxa: 2.5 },
                   ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="taxa" fill="var(--neon-pink)" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );

  const renderAuditoria = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] flex items-center gap-6">
          <ShieldAlert className="text-red-500" size={48} />
          <div>
             <h2 className="text-xl font-black text-red-500 uppercase italic">Acesso Restrito a Gestores Autorizados</h2>
             <p className="text-xs font-bold text-red-500/70 uppercase tracking-widest mt-1">Todas as ações neste módulo são auditadas e vinculadas ao seu IP e Identificador Único.</p>
          </div>
       </div>

       <div className="card flex flex-col">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Log de Auditoria do Sistema</h3>
             <button className="btn-brand bg-[var(--neon-blue)] !shadow-[var(--neon-blue)]/20 text-[10px]"><FileText size={14} /> Exportar Log (CSV)</button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
                   <tr>
                      <th className="pb-4">Data / Hora</th>
                      <th className="pb-4">Usuário</th>
                      <th className="pb-4">Ação</th>
                      <th className="pb-4 text-right">Observação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                   {[
                     { data: "01/05/2026 14:22", user: "Diogo Silva", acao: "Alteração de Salário", obs: "Reajuste Anual - Unidade SEMED" },
                     { data: "01/05/2026 11:05", user: "Admin", acao: "Exclusão de Registro", obs: "Ticket duplicado removido" },
                     { data: "30/04/2026 18:45", user: "Gerente RH", acao: "Afastamento", obs: "Licença médica - Protocolo #152" },
                     { data: "30/04/2026 09:12", user: "Sistema", acao: "Sync n8n", obs: "Sincronização de 1240 colaboradores" },
                   ].map((log, i) => (
                     <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-mono text-[var(--text-muted)]">{log.data}</td>
                        <td className="py-4 font-black text-[var(--neon-blue)]">{log.user}</td>
                        <td className="py-4 font-bold text-[var(--text-primary)]">{log.acao}</td>
                        <td className="py-4 text-right text-[var(--text-muted)]">{log.obs}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 h-full px-4 lg:px-8">
      
      {/* 1. NAVEGAÇÃO DE TOPO PREMIUM (Dark Style) */}
      <div className="flex flex-wrap items-center gap-4 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border)] shadow-xl sticky top-0 z-30 backdrop-blur-md">
         {[
           { id: "OVERVIEW", label: "Visão Geral", icon: LayoutDashboard },
           { id: "OPERACIONAL", label: "Operacional", icon: HardHat },
           { id: "ALMOXARIFADO", label: "Almoxarifado", icon: Package },
           { id: "RH", label: "Recursos Humanos", icon: Users },
           { id: "AUDITORIA", label: "Auditoria", icon: ShieldAlert },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[0.7rem] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-[0_0_20px_rgba(255,106,0,0.4)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)] hover:text-white'}`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {/* 2. CONTEÚDO DINÂMICO */}
      <div className="flex-1">
         {activeTab === "OVERVIEW" && renderOverview()}
         {activeTab === "OPERACIONAL" && renderOperacional()}
         {activeTab === "ALMOXARIFADO" && renderAlmoxarifado()}
         {activeTab === "RH" && renderRH()}
         {activeTab === "AUDITORIA" && renderAuditoria()}
      </div>

    </div>
  );
}

// --- SUB-COMPONENTES AUXILIARES ---

function KPICard({ title, value, subValue, icon: Icon, trend, color }: any) {
    const colorClasses: any = {
        blue: 'text-[var(--neon-blue)] bg-[var(--neon-blue)]/10',
        green: 'text-[var(--neon-green)] bg-[var(--neon-green)]/10',
        orange: 'text-[var(--neon-orange)] bg-[var(--neon-orange)]/10',
        pink: 'text-[var(--neon-pink)] bg-[var(--neon-pink)]/10'
    };

    return (
        <div className="card-glow kpi-card flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-white/5'}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className={`text-[10px] font-black ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {trend} {trend.startsWith('+') ? <ArrowUpRight className="inline" size={10}/> : <ArrowDownRight className="inline" size={10}/>}
                    </span>
                )}
            </div>
            <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-3xl font-black text-[var(--text-primary)] italic tracking-tighter">{value}</h4>
                </div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] mt-2 uppercase">{subValue}</p>
            </div>
        </div>
    );
}

function ShortcutBtn({ label, icon: Icon }: any) {
    return (
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/5 transition-all group gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--brand)] group-hover:text-white transition-all">
                <Icon size={18} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-[var(--text-muted)] group-hover:text-white">{label}</span>
        </button>
    );
}
