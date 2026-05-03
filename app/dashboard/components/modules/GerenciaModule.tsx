"use client";
import { useState, useEffect } from "react";
import { 
  Users, DollarSign, Activity, ShieldAlert, 
  TrendingUp, BarChart3, Zap, 
  CheckCircle, Clock, Package,
  ShieldCheck, AlertTriangle, FileText,
  Truck, HardHat, Search, Filter, 
  ArrowUpRight, ArrowDownRight, MoreVertical,
  LogOut, LayoutDashboard, User, Map as MapIcon,
  Settings, UserPlus, MapPin, Building2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';
import { supabase } from "@/lib/supabase";

// --- DADOS SIMULADOS PARA GRÁFICOS ---
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

export default function GerenciaModule({ user: propUser, initialTab }: { user?: any, initialTab?: "OVERVIEW" | "OPERACIONAL" | "ALMOXARIFADO" | "RH" | "AUDITORIA" | "ROTAS" }) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "OPERACIONAL" | "ALMOXARIFADO" | "RH" | "AUDITORIA" | "ROTAS">(initialTab || "OVERVIEW");
  const [user, setUser] = useState<any>(propUser || null);
  const [counts, setCounts] = useState({ colabs: 0, ativos: 0, afastados: 0, ocorrenciasMes: 0, custoTotal: 0 });
  const [rotas, setRotas] = useState<any[]>([]);
  const [encarregados, setEncarregados] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<string[]>([]);
  const [chartData, setChartData] = useState({
    trend: [] as any[],
    secretarias: [] as any[],
    rhDist: [] as any[],
    rhStatus: [] as any[]
  });
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!propUser) {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    }
    fetchDashboardData();
    fetchRotasData();
  }, [propUser]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchDashboardData = async () => {
    // 1. Contagens Básicas
    const { count: total } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
    const { count: ativos } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('status', 'ATIVO');
    const { count: afastados } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('status', 'AFASTADO');
    const { count: ocorrencias } = await supabase.from('tickets_sla').select('*', { count: 'exact', head: true });
    
    // 2. Cálculo de Custo e Gráfico de Secretarias
    const { data: reqs } = await supabase.from('requisicoes').select('item_id, quantidade, unidade_destino, status, data_solicitacao, solicitante, item_nome');
    const { data: epi } = await supabase.from('almox_epi').select('id, valor_unitario');
    const { data: sup } = await supabase.from('almox_suprimentos').select('id, valor_unitario');
    const { data: esc } = await supabase.from('almox_escritorio').select('id, valor_unitario');
    
    const inventory = [...(epi || []), ...(sup || []), ...(esc || [])];
    let totalCusto = 0;
    const costsByUnit: Record<string, { entregas: number, pendentes: number }> = {};

    reqs?.forEach(r => {
        const item = inventory.find(i => String(i.id) === String(r.item_id));
        const cost = (r.quantidade || 0) * (item?.valor_unitario || 0);
        totalCusto += cost;

        const unit = r.unidade_destino || "OUTROS";
        if (!costsByUnit[unit]) costsByUnit[unit] = { entregas: 0, pendentes: 0 };
        if (r.status === 'ENTREGUE') costsByUnit[unit].entregas += 1;
        else costsByUnit[unit].pendentes += 1;
    });

    setCounts({ 
        colabs: total || 0, 
        ativos: ativos || 0, 
        afastados: afastados || 0, 
        ocorrenciasMes: ocorrencias || 0,
        custoTotal: totalCusto
    });

    // 3. Dados para Gráficos
    const { data: tickets } = await supabase.from('tickets_sla').select('created_at, status, criado_por, assunto');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const trend: any[] = months.map(m => ({ name: m, ocorrencias: 0, resolucoes: 0 }));
    
    tickets?.forEach(t => {
        const date = new Date(t.created_at);
        const mIdx = date.getMonth();
        trend[mIdx].ocorrencias += 1;
        if (t.status === 'RESOLVIDO' || t.status === 'FECHADO') trend[mIdx].resolucoes += 1;
    });

    const { data: colabsRaw } = await supabase.from('usuarios').select('unidade_alocacao, status');
    const distMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    
    colabsRaw?.forEach(c => {
        const u = c.unidade_alocacao || "NÃO ALOCADO";
        distMap[u] = (distMap[u] || 0) + 1;
        statusMap[c.status] = (statusMap[c.status] || 0) + 1;
    });

    setChartData({
        trend,
        secretarias: Object.entries(costsByUnit).map(([name, data]) => ({ name, ...data })).slice(0, 5),
        rhDist: Object.entries(distMap).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] })),
        rhStatus: Object.entries(statusMap).map(([name, value], i) => ({ name, value, color: COLORS[(i+2) % COLORS.length] }))
    });

    // 4. Logs Reais
    const combinedLogs = [
        ...(tickets || []).map(t => ({
            data: new Date(t.created_at).toLocaleString(),
            user: t.criado_por || "Sistema",
            acao: `Ocorrência: ${t.assunto}`,
            obs: `Status: ${t.status}`
        })),
        ...(reqs || []).map(r => ({
            data: new Date(r.data_solicitacao).toLocaleString(),
            user: r.solicitante || "Sistema",
            acao: `Requisição: ${r.item_nome}`,
            obs: `Status: ${r.status}`
        }))
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    setLogs(combinedLogs.slice(0, 15));
  };

  const fetchRotasData = async () => {
    const { data: encs } = await supabase.from('usuarios').select('id, nome').eq('role', 'ENCARREGADO');
    setEncarregados(encs || []);

    const { data: users } = await supabase.from('usuarios').select('unidade_alocacao');
    const uniqueUnits = Array.from(new Set(users?.map(u => u.unidade_alocacao).filter(Boolean)));
    setUnidades(uniqueUnits as string[]);

    const { data: routeData } = await supabase.from('gestao_rotas').select('*');
    
    const finalRotas = await Promise.all((uniqueUnits as string[]).map(async (unit) => {
        const mapping = routeData?.find(r => r.unidade_nome === unit);
        const { count } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('unidade_alocacao', unit);
        return {
            unidade: unit,
            encarregadoId: mapping?.encarregado_id || "",
            encarregadoNome: mapping?.encarregado_nome || "NÃO ATRIBUÍDO",
            totalColabs: count || 0
        };
    }));
    setRotas(finalRotas);
  };

  const handleSaveRota = async (unidade: string, encId: string) => {
    const enc = encarregados.find(e => e.id === encId);
    if (!enc) return;

    const { error } = await supabase.from('gestao_rotas').upsert({
        unidade_nome: unidade,
        encarregado_id: encId,
        encarregado_nome: enc.nome,
        updated_at: new Date().toISOString()
    }, { onConflict: 'unidade_nome' });

    if (!error) fetchRotasData();
  };

  const renderOverview = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Colaboradores" value={counts.colabs.toString()} subValue={`${counts.ativos} Ativos / ${counts.afastados} Afast.`} icon={Users} trend="+2.4%" color="blue" />
        <KPICard title="Custo Requisições" value={`R$ ${(counts as any).custoTotal ? ((counts as any).custoTotal / 1000).toFixed(1) : '0'}k`} subValue="Acumulado Real" icon={DollarSign} trend="+12%" color="orange" />
        <KPICard title="Tempo de Resposta" value="4.2h" subValue="Média Global (Ocorrências)" icon={Clock} trend="-15%" color="green" />
        <KPICard title="Ocorrências Mês" value={counts.ocorrenciasMes.toString()} subValue="Total acumulado" icon={AlertTriangle} trend="+5%" color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Tendência de Ocorrências e Resoluções</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">DADOS REAIS</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.trend}>
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

        <div className="card h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Status de Entrega por Secretaria</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">REAL TIME</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.secretarias} layout="vertical">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Distribuição de Colaboradores</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">POR UNIDADE</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.rhDist} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.rhDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Status de Recursos Humanos</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">VISÃO GERAL</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.rhStatus} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.rhStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperacional = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Funcionários Ativos" value={counts.ativos.toString()} subValue="Em campo agora" icon={Users} color="blue" />
          <KPICard title="Cobertura Operacional" value={`${((counts.ativos / (counts.colabs || 1)) * 100).toFixed(1)}%`} subValue="Percentual de Presença" icon={ShieldCheck} color="green" />
          <KPICard title="Ocorrências Campo" value={counts.ocorrenciasMes.toString()} subValue="Abertas no período" icon={AlertTriangle} color="orange" trend="+12%" />
       </div>
    </div>
  );

  const renderAlmoxarifado = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard title="Custo em Suprimentos" value={`R$ ${(counts as any).custoTotal ? ((counts as any).custoTotal / 1000).toFixed(1) : '0'}k`} subValue="Total em Requisições" icon={Package} color="blue" trend="-10%" />
          <KPICard title="Itens Movimentados" value={chartData.secretarias.reduce((acc, curr) => acc + (curr.entregas || 0) + (curr.pendentes || 0), 0).toString()} subValue="Total de Solicitações" icon={DollarSign} color="green" />
       </div>
    </div>
  );

  const renderRH = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard title="Total do Quadro" value={counts.colabs.toString()} subValue="Colaboradores Base" icon={Users} color="blue" />
          <KPICard title="Afastamentos" value={counts.afastados.toString()} subValue="Férias / Licenças" icon={UserPlus} color="green" trend="+3" />
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
                    {logs.map((log, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                         <td className="py-4 font-mono text-[var(--text-muted)]">{log.data}</td>
                         <td className="py-4 font-black text-[var(--neon-blue)]">{log.user}</td>
                         <td className="py-4 font-bold text-[var(--text-primary)]">{log.acao}</td>
                         <td className="py-4 text-right text-[var(--text-muted)]">{log.obs}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-10 text-center text-[var(--text-muted)] uppercase font-black text-[10px]">Nenhuma atividade registrada</td>
                        </tr>
                    )}
                 </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const renderRotas = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="card flex flex-col">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Gestão Estratégica de Rotas</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Vínculo de Unidades, Encarregados e Contingente</p>
             </div>
             <button onClick={fetchRotasData} className="btn-ghost !h-10 text-[9px] font-black uppercase"><Clock size={14} /> Atualizar Dados</button>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
                   <tr>
                      <th className="p-6">Unidade Operacional</th>
                      <th className="p-6">Encarregado Responsável</th>
                      <th className="p-6 text-center">Colaboradores Alocados</th>
                      <th className="p-6 text-right">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                   {rotas.map((r, i) => (
                     <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                                 <Building2 size={18} />
                              </div>
                              <div>
                                 <div className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">{r.unidade}</div>
                                 <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Unidade Atendida</div>
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <select 
                              className="input-field !h-10 !py-0 !text-xs font-black uppercase tracking-tighter max-w-[250px]"
                              value={r.encarregadoId}
                              onChange={(e) => handleSaveRota(r.unidade, e.target.value)}
                           >
                              <option value="">SELECIONAR ENCARREGADO</option>
                              {encarregados.map(e => (
                                 <option key={e.id} value={e.id}>{e.nome}</option>
                              ))}
                           </select>
                        </td>
                        <td className="p-6 text-center">
                           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] border border-[var(--neon-blue)]/20">
                              <Users size={12} />
                              <span className="text-xs font-black">{r.totalColabs}</span>
                           </div>
                        </td>
                        <td className="p-6 text-right">
                           <span className="text-[10px] font-black uppercase text-[var(--text-muted)] italic">Vínculo Automático Ativo</span>
                        </td>
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
           { id: "ROTAS", label: "Gestão de Rotas", icon: MapPin },
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
         {activeTab === "ROTAS" && renderRotas()}
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
