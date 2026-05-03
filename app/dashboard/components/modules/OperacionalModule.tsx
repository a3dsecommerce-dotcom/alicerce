"use client";
import { useState, useEffect } from "react";
import { 
  Activity, Building2, AlertTriangle, ShieldCheck, 
  MapPin, Users, Search, Plus, ArrowUpRight, Clock
} from "lucide-react";
import { useOperacionalData } from "./operacional/useOperacionalData";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function OperacionalModule({ user }: { user: any }) {
  const { loading, unidades, colaboradores, tickets, stats, refresh } = useOperacionalData(user);
  const [activeTab, setActiveTab] = useState<"VISAO" | "UNIDADES" | "EQUIPE" | "HISTORICO">("VISAO");
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [newUnit, setNewUnit] = useState({
    secretaria: "SEMED",
    nome: "",
    endereco: "",
    numero: "",
    bairro: "",
    diretor: "",
    telefone: "",
    atendidos_dia: "",
    status: "ATIVO",
    rota: "ROTA 1"
  });

  const [configRotas, setConfigRotas] = useState<any[]>([]);
  
  const isEncarregado = user?.role === 'ENCARREGADO';

  const resetForm = () => {
    setNewUnit({
      secretaria: "SEMED",
      nome: "",
      endereco: "",
      numero: "",
      bairro: "",
      diretor: "",
      telefone: "",
      atendidos_dia: "",
      status: "ATIVO",
      rota: "ROTA 1"
    });
    setEditingUnit(null);
  };

  const handleEdit = (u: any) => {
    setEditingUnit(u);
    setNewUnit({
      secretaria: u.secretaria || "SEMED",
      nome: u.nome || "",
      endereco: u.endereco || "",
      numero: u.numero || "",
      bairro: u.bairro || "",
      diretor: u.diretor || "",
      telefone: u.telefone || "",
      atendidos_dia: u.atendidos_dia?.toString() || "",
      status: u.status || "ATIVO",
      rota: u.rota || "ROTA 1"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Tem certeza que deseja excluir esta unidade?")) return;

    const { error } = await supabase.from('unidades').delete().eq('id', id);
    if (!error) {
      toast.success("Unidade excluída!");
      refresh();
    } else {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  useEffect(() => {
    if (activeTab === "UNIDADES") {
      fetchConfigRotas();
    }
  }, [activeTab]);

  const fetchConfigRotas = async () => {
    const { data } = await supabase.from('config_rotas').select('*');
    setConfigRotas(data || []);
  };

  const handleCreateUnit = async () => {
    if (!newUnit.nome || !newUnit.secretaria) {
      toast.error("Nome e Secretaria são obrigatórios");
      return;
    }

    setSaving(true);

    // Busca automática do encarregado baseado na rota escolhida
    const rotaConfig = configRotas.find(r => r.rota_nome === newUnit.rota);

    const payload = {
      ...newUnit,
      encarregado_id: rotaConfig?.encarregado_id || null,
      encarregado_nome: rotaConfig?.encarregado_nome || null,
      atendidos_dia: parseInt(newUnit.atendidos_dia) || 0,
      atualizado_em: new Date().toISOString()
    };

    let error;
    if (editingUnit) {
      const { error: err } = await supabase.from('unidades').update(payload).eq('id', editingUnit.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('unidades').insert([{
        ...payload,
        criado_em: new Date().toISOString()
      }]);
      error = err;
    }

    if (!error) {
      toast.success(editingUnit ? "Unidade atualizada!" : "Unidade cadastrada!");
      setIsModalOpen(false);
      resetForm();
      refresh();
    } else {
      toast.error("Erro ao salvar: " + error.message);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="p-20">
      <TableSkeleton rows={10} cols={5} />
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      
      {/* HEADER OPERACIONAL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--bg-card)] p-12 rounded-[3rem] border border-[var(--border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[80px] -mr-48 -mt-48 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
            <Activity size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[var(--text-primary)] italic tracking-tighter">Gerência Operacional</h2>
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-500" /> Controle de Campo & Performance
            </p>
          </div>
        </div>

        <div className="flex gap-2 p-1.5 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)] relative z-10">
          {[
            { id: "VISAO", label: isEncarregado ? "Painel de Rota" : "Visão Geral", icon: Activity },
            { id: "UNIDADES", label: isEncarregado ? "Minhas Unidades" : "Unidades / Postos", icon: Building2 },
            { id: "EQUIPE", label: isEncarregado ? "Minha Equipe" : "Efetivo Global", icon: Users },
            { id: "HISTORICO", label: "Logs de Campo", icon: Clock },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "VISAO" && (
        <div className="flex flex-col gap-10">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">{isEncarregado ? "Unidades na Rota" : "Unidades Ativas"}</p>
              <h3 className="text-4xl font-black text-[var(--text-primary)]">{stats.totalUnidades}</h3>
              <div className="mt-4 h-1.5 bg-[var(--bg-base)] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">{isEncarregado ? "Minhas Demandas" : "Tickets do Setor"}</p>
              <h3 className="text-4xl font-black text-orange-500">{stats.ticketsAtivos}</h3>
              <p className="text-[9px] font-bold text-[var(--text-muted)] mt-2 uppercase">Aguardando atendimento</p>
            </div>
            <div className="bg-red-600 p-8 rounded-[2.5rem] shadow-xl shadow-red-600/20 text-white">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Fora do SLA</p>
              <h3 className="text-4xl font-black">{stats.ticketsAtrasados}</h3>
              <p className="text-[9px] font-bold text-white/80 mt-2 uppercase flex items-center gap-1">
                <AlertTriangle size={10} /> Requer Atenção Imediata
              </p>
            </div>
            <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Efetivo Alocado</p>
              <h3 className="text-4xl font-black text-[var(--text-primary)]">{stats.efetivoTotal}</h3>
              <p className="text-[9px] font-bold text-green-500 mt-2 uppercase">100% Cobertura</p>
            </div>
          </div>

          {/* DASHBOARD CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden">
                <div className="p-10 border-b border-[var(--border)] flex justify-between items-center bg-slate-50/50">
                  <h4 className="text-sm font-black uppercase flex items-center gap-2">
                    <AlertTriangle size={18} className="text-orange-500" /> Ocorrências Ativas do Setor
                  </h4>
                  <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Todas</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {tickets.slice(0, 5).map(t => (
                    <div key={t.id} className="p-8 hover:bg-[var(--bg-base)]/30 transition-all flex justify-between items-center group">
                      <div className="flex gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.prioridade === 'CRITICA' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          <AlertTriangle size={24} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-[var(--text-primary)]">{t.assunto}</div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] font-black text-blue-600 uppercase">{t.unidade || 'Geral'}</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-medium">Aberto por {t.criado_por}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-3 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] group-hover:text-blue-600 group-hover:border-blue-600 transition-all">
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ))}
                  {tickets.length === 0 && (
                    <div className="p-20 text-center opacity-30">
                      <ShieldCheck size={48} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma ocorrência pendente no operacional</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                 <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full translate-y-20 translate-x-20 blur-3xl group-hover:bg-blue-500/20 transition-all" />
                 <h4 className="text-lg font-black uppercase italic tracking-tighter">Insights do Dia</h4>
                 <div className="mt-8 space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                       <MapPin size={20} className="text-blue-400 shrink-0" />
                       <div>
                          <p className="text-[10px] font-black uppercase text-blue-400">Ponto Focal</p>
                          <p className="text-xs font-bold mt-1 text-white/80">Concentração de demandas na região SEMED.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                       <Users size={20} className="text-green-400 shrink-0" />
                       <div>
                          <p className="text-[10px] font-black uppercase text-green-400">Efetivo</p>
                          <p className="text-xs font-bold mt-1 text-white/80">Ajuste de escala necessário para o posto UBS-10.</p>
                       </div>
                    </div>
                 </div>
                 <button className="w-full h-14 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mt-10 hover:scale-[1.02] transition-all">Gerar Relatório de Campo</button>
              </div>

              <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border)] shadow-xl">
                 <h4 className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-6 tracking-widest flex items-center gap-2">
                   <Clock size={16} /> Próximas Atribuições
                 </h4>
                 <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 group cursor-pointer">
                         <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-all" />
                         <div className="flex-1">
                            <p className="text-[11px] font-black text-[var(--text-primary)]">Vistoria Semanal Posto {i}</p>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-0.5">Prazo: Hoje as 17:00</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "UNIDADES" && (
        <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col flex-1">
           <div className="p-10 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative flex-1 w-full max-w-md">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                 <input className="input-field !pl-16 !h-14 font-bold" placeholder="Pesquisar posto ou unidade..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="h-14 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/20"
              >
                 <Plus size={18} /> Adicionar Unidade
              </button>
           </div>
            <UnidadesTable 
              unidades={unidades} 
              busca={busca} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
        </div>
      )}

      {activeTab === "EQUIPE" && (
        <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col flex-1">
           <div className="p-10 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
              <h4 className="text-sm font-black uppercase flex items-center gap-2">
                 <Users size={18} className="text-blue-500" /> {isEncarregado ? "Colaboradores da Minha Rota" : "Efetivo Global Operacional"}
              </h4>
              <div className="relative flex-1 w-full max-w-md">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                 <input className="input-field !pl-16 !h-14 font-bold" placeholder="Pesquisar por nome ou CPF..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                    <tr>
                       <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Colaborador</th>
                       <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Posto Alocado</th>
                       <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--border)]">
                    {colaboradores.filter(c => c.nome?.toLowerCase().includes(busca.toLowerCase())).map((c, i) => (
                      <tr key={c.id || i} className="hover:bg-[var(--bg-base)]/30 transition-all group">
                         <td className="p-8">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                                  <User size={18} />
                               </div>
                               <span className="text-sm font-black text-[var(--text-primary)]">{c.nome}</span>
                            </div>
                         </td>
                         <td className="p-8">
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase">{c.unidade_alocacao || 'Sem Posto'}</span>
                         </td>
                         <td className="p-8 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status === 'ATIVO' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                               {c.status}
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}


      {/* MODAL CADASTRO UNIDADE */}
      <AdaptiveModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForm(); }} 
        title={editingUnit ? "Editar Unidade" : "Novo Cadastro de Unidade"}
        width="600px"
      >
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><ShieldCheck size={12}/> Secretaria</label>
              <select 
                className="input-field w-full h-12 font-bold"
                value={newUnit.secretaria}
                onChange={e => setNewUnit({...newUnit, secretaria: e.target.value})}
              >
                <option value="SEMED">SEMED (Educação)</option>
                <option value="SEMSA">SEMSA (Saúde)</option>
                <option value="SEMAD">SEMAD (Administração)</option>
                <option value="SEMOSP">SEMOSP (Obras)</option>
                <option value="GABINETE">GABINETE</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><Building2 size={12}/> Nome da Unidade</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="Ex: Escola Municipal Alicerce"
                value={newUnit.nome}
                onChange={e => setNewUnit({...newUnit, nome: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><MapPin size={12}/> Endereço</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="Rua, Avenida..."
                value={newUnit.endereco}
                onChange={e => setNewUnit({...newUnit, endereco: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Número</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="S/N"
                value={newUnit.numero}
                onChange={e => setNewUnit({...newUnit, numero: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><MapPin size={12}/> Bairro</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="Bairro da Unidade"
                value={newUnit.bairro}
                onChange={e => setNewUnit({...newUnit, bairro: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><Users size={12}/> Atendidos/Dia</label>
              <input 
                type="number"
                className="input-field w-full h-12 font-bold"
                placeholder="Qtd. Pessoas"
                value={newUnit.atendidos_dia}
                onChange={e => setNewUnit({...newUnit, atendidos_dia: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><MapPin size={12}/> Rota / Responsavel</label>
              <select 
                className="input-field w-full h-12 font-bold"
                value={newUnit.rota}
                onChange={e => setNewUnit({...newUnit, rota: e.target.value})}
              >
                {configRotas.length > 0 ? (
                  configRotas.map(r => (
                    <option key={r.id} value={r.rota_nome}>
                      {r.rota_nome}: {r.encarregado_nome || "NÃO ATRIBUÍDO"}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ROTA 1">ROTA 1</option>
                    <option value="ROTA 2">ROTA 2</option>
                    <option value="ROTA 3">ROTA 3</option>
                    <option value="ROTA 4">ROTA 4</option>
                    <option value="ROTA 5">ROTA 5</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><ShieldCheck size={12}/> Status</label>
              <select 
                className="input-field w-full h-12 font-bold"
                value={newUnit.status}
                onChange={e => setNewUnit({...newUnit, status: e.target.value})}
              >
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>
          </div>

          <button 
            disabled={saving}
            onClick={handleCreateUnit}
            className="w-full h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? "Salvando..." : editingUnit ? "Salvar Alteracoes" : "Finalizar Cadastro de Unidade"}
          </button>
        </div>
      </AdaptiveModal>
    </div>
  );
}
