"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Search, Building2, MapPin, Shield, CheckCircle2, XCircle, Clock, Info, RefreshCw } from "lucide-react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";

export default function EquipesPorUnidade({ unidadesList }: { unidadesList: any[] }) {
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [quadroReferencia, setQuadroReferencia] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  const fetchEquipe = async (unit: any) => {
    setSelectedUnit(unit);
    setLoading(true);
    try {
      const [colabsRes, quadroRes] = await Promise.all([
        supabase.from('usuarios').select('*').eq('unidade_alocacao', unit.nome).eq('status', 'ATIVO').order('nome'),
        supabase.from('vagas_quadro').select('*').eq('unidade_nome', unit.nome)
      ]);
      
      if (colabsRes.error) throw colabsRes.error;
      setColaboradores(colabsRes.data || []);
      setQuadroReferencia(quadroRes.data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar equipe: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUnit) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-xl">
           <div className="flex items-center justify-between gap-4 mb-8">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                 <Building2 className="text-indigo-600" size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">Seletor de Equipes Operacionais</h3>
                 <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Selecione uma unidade para auditar o quadro de funcionários</p>
               </div>
             </div>
             {unidadesList.length === 0 && (
               <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:scale-105 transition-all"
               >
                 <RefreshCw size={14} /> Sincronizar Unidades
               </button>
             )}
           </div>

           {unidadesList.length === 0 ? (
             <div className="py-20 text-center border-2 border-dashed border-[var(--border)] rounded-[2rem]">
                <Info size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-20" />
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)] tracking-widest">Nenhuma unidade carregada. Clique em sincronizar ou verifique sua conexão.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
               {unidadesList.map((u) => (
                 <button 
                  key={u.id}
                  onClick={() => fetchEquipe(u)}
                  className="flex flex-col p-6 bg-[var(--bg-base)] border border-[var(--border)] rounded-[2rem] hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left group relative overflow-hidden"
                 >
                   <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-all" />
                   <span className="text-[10px] font-black text-indigo-500 uppercase mb-2">{u.secretaria}</span>
                   <h4 className="text-[13px] font-black text-[var(--text-primary)] uppercase leading-tight mb-4 group-hover:text-indigo-600 transition-colors">{u.nome}</h4>
                   <div className="flex items-center gap-2 mt-auto">
                      <Users size={14} className="text-[var(--text-muted)]" />
                      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase">Ver Quadro</span>
                   </div>
                 </button>
               ))}
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      {/* Header Auditoria */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setSelectedUnit(null)}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group"
              >
                <XCircle size={24} className="group-hover:scale-110 transition-transform" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest">{selectedUnit.secretaria}</span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Auditando Agora</span>
                </div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{selectedUnit.nome}</h3>
                <p className="text-[11px] font-medium text-slate-300 mt-2 flex items-center gap-2">
                  <MapPin size={14} /> {selectedUnit.endereco}, {selectedUnit.bairro}
                </p>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex flex-col items-center p-6 bg-white/5 rounded-[2rem] border border-white/10 min-w-[120px]">
                 <span className="text-3xl font-black">{colaboradores.length}</span>
                 <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Colaboradores</span>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/5 rounded-[2rem] border border-white/10 min-w-[120px]">
                 <span className="text-3xl font-black">{selectedUnit.diretor ? "SIM" : "NÃO"}</span>
                 <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Diretor Vinculado</span>
              </div>
           </div>
        </div>
      </div>

      {/* Tabela de Equipe (Igual ao Diretor) */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador no quadro..." 
              className="input-field w-full pl-12 py-4 bg-[var(--bg-card)] border-[var(--border)] rounded-[1.5rem] text-[11px] font-bold uppercase"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-[var(--bg-card)] px-4 py-2 rounded-2xl border border-[var(--border)] shadow-sm">
            <Info size={14} className="text-indigo-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Visão de Espelho: Você vê exatamente o que o fiscal vê</span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : (
          <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-2xl overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-base)]/50">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Colaborador</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cargo / Função</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Horário</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Insalubridade</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {colaboradores.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())).map((c) => (
                  <tr key={c.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-[var(--text-primary)] uppercase italic leading-tight">{c.nome}</span>
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{c.telefone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-4 py-1.5 bg-slate-500/10 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-full border border-slate-500/10">
                        {c.cargo}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] w-fit">
                        <Clock size={14} className="text-indigo-500" />
                        <span className="text-[11px] font-black text-[var(--text-primary)] uppercase">{c.horario_trabalho || "07:00 - 17:00"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       {(() => {
                         const ref = quadroReferencia.find(q => (q.cargo || "").toUpperCase() === (c.cargo || "").toUpperCase())?.insalubridade || 'N/A';
                         return (
                            <div className="flex flex-col gap-1">
                               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border w-fit ${
                                 c.percentual_insalubridade === '40%' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                 c.percentual_insalubridade === '30%' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                                 c.percentual_insalubridade === '20%' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                               }`}>
                                  {c.percentual_insalubridade || 'N/A'}
                               </span>
                               <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quadro: {ref}</span>
                            </div>
                         );
                       })()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${c.status === 'ATIVO' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">{c.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/10">
                          Ver Histórico
                       </button>
                    </td>
                  </tr>
                ))}
                {colaboradores.length === 0 && (
                   <tr>
                      <td colSpan={5} className="py-20 text-center text-[var(--text-muted)] font-black uppercase italic tracking-widest opacity-40">
                         Nenhum colaborador alocado nesta unidade.
                      </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
