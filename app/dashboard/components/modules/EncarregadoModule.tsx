"use client";
import { useState, useEffect } from "react";
import { 
  Users, Activity, ShieldCheck, AlertTriangle, 
  Clock, Package, MapPin, Search, Filter,
  CheckCircle, ArrowUpRight, Building2, User
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EncarregadoModule({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"MY_UNITS" | "MY_COLABS" | "ATTENDANCE" | "TICKETS">("MY_UNITS");
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [myColabs, setMyColabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEncarregadoData();
    }
  }, [user]);

  const fetchEncarregadoData = async () => {
    setLoading(true);
    try {
      // 1. Buscar unidades sob responsabilidade deste encarregado
      const { data: unitsMapping } = await supabase
        .from('gestao_rotas')
        .select('unidade_nome')
        .eq('encarregado_id', user.id);

      const unitNames = unitsMapping?.map(u => u.unidade_nome) || [];
      setMyUnits(unitNames);

      // 2. Buscar colaboradores alocados nessas unidades
      if (unitNames.length > 0) {
        const { data: colabs } = await supabase
          .from('usuarios')
          .select('*')
          .in('unidade_alocacao', unitNames);
        setMyColabs(colabs || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do encarregado:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderMyUnits = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="kpi-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Minhas Unidades</p>
          <h4 className="text-3xl font-black text-[var(--text-primary)]">{myUnits.length}</h4>
        </div>
        <div className="kpi-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Meus Colaboradores</p>
          <h4 className="text-3xl font-black text-[var(--text-primary)]">{myColabs.length}</h4>
        </div>
        <div className="kpi-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Média p/ Rota</p>
          <h4 className="text-3xl font-black text-[var(--neon-blue)]">{myUnits.length > 0 ? (myColabs.length / myUnits.length).toFixed(1) : 0}</h4>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Unidades Sob Minha Responsabilidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myUnits.map((unit, i) => (
            <div key={i} className="p-6 bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl flex items-center gap-4 hover:border-[var(--brand)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-primary)] uppercase">{unit}</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{myColabs.filter(c => c.unidade_alocacao === unit).length} Colaboradores</p>
              </div>
            </div>
          ))}
          {myUnits.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-50">
               <MapPin size={48} className="mx-auto mb-4" />
               <p className="text-xs font-black uppercase tracking-widest">Nenhuma unidade vinculada ao seu perfil.</p>
               <p className="text-[10px] font-bold mt-2 uppercase">Contate a gerência para definir suas rotas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMyColabs = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="card">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Lista de Colaboradores (Minha Equipe)</h3>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                <input type="text" placeholder="BUSCAR NA EQUIPE..." className="input-field !h-9 !pl-10 !text-[10px] w-64" />
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
                   <tr>
                      <th className="pb-4">Colaborador</th>
                      <th className="pb-4">Unidade</th>
                      <th className="pb-4">Cargo</th>
                      <th className="pb-4 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                   {myColabs.map((colab, i) => (
                     <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center">
                                 <User size={14} className="text-[var(--text-muted)]" />
                              </div>
                              <span className="text-sm font-bold text-[var(--text-primary)]">{colab.nome}</span>
                           </div>
                        </td>
                        <td className="py-4 text-xs font-bold text-[var(--text-muted)] uppercase">{colab.unidade_alocacao}</td>
                        <td className="py-4 text-xs font-medium text-[var(--text-muted)]">{colab.cargo || 'OPERACIONAL'}</td>
                        <td className="py-4 text-right">
                           <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${colab.status === 'ATIVO' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {colab.status}
                           </span>
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
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      
      {/* Navegação Superior do Encarregado */}
      <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] shadow-sm sticky top-0 z-30 backdrop-blur-md overflow-x-auto custom-scrollbar">
         {[
           { id: "MY_UNITS", label: "Minhas Unidades", icon: Building2 },
           { id: "MY_COLABS", label: "Minha Equipe", icon: Users },
           { id: "ATTENDANCE", label: "Gestão de Ponto", icon: Clock },
           { id: "TICKETS", label: "Ocorrências", icon: AlertTriangle },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[0.7rem] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
           <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Carregando mapa operacional...</p>
        </div>
      ) : (
        <div className="flex-1">
           {activeTab === "MY_UNITS" && renderMyUnits()}
           {activeTab === "MY_COLABS" && renderMyColabs()}
           {activeTab === "ATTENDANCE" && (
              <div className="card py-20 text-center">
                 <Clock size={48} className="mx-auto mb-4 opacity-20" />
                 <h3 className="text-lg font-black text-[var(--text-primary)] uppercase">Módulo de Ponto em Sincronização</h3>
                 <p className="text-xs font-medium text-[var(--text-muted)] mt-2">Aguardando espelhamento da base biométrica.</p>
              </div>
           )}
           {activeTab === "TICKETS" && (
              <div className="card py-20 text-center">
                 <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
                 <h3 className="text-lg font-black text-[var(--text-primary)] uppercase">Minhas Demandas</h3>
                 <p className="text-xs font-medium text-[var(--text-muted)] mt-2">Filtre por suas unidades na Central de Ocorrências.</p>
              </div>
           )}
        </div>
      )}

    </div>
  );
}
