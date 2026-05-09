"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Building2, Users, Plus, Edit2, Trash2, Search, Filter, 
  ShieldAlert, Clock, CheckCircle, AlertTriangle, ChevronRight,
  MapPin, Briefcase
} from "lucide-react";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function QuadroVagas() {
  const [loading, setLoading] = useState(true);
  const [quadro, setQuadro] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroSecretaria, setFiltroSecretaria] = useState("SEMED");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    unidade_nome: "",
    secretaria: "",
    cargo: "",
    vagas_totais: 1,
    turno: "DIURNO",
    horario: "",
    insalubridade: "N/A"
  });

  // Sugestões de cargos baseadas no que já existe no sistema
  const sugestoesCargos = Array.from(new Set([
    ...colaboradores.map(c => (c.cargo || "").toUpperCase().trim()),
    ...quadro.map(q => (q.cargo || "").toUpperCase().trim())
  ])).filter(Boolean).sort();

  const secretarias = ["SEMED", "SEMSA", "SEMTAC", "SEMOB", "ADMINISTRAÇÃO GERAL"];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quadroRes, colabsRes, unidadesRes] = await Promise.all([
        supabase.from('vagas_quadro').select('*').order('unidade_nome'),
        supabase.from('usuarios').select('unidade_alocacao, cargo').eq('status', 'ATIVO'),
        supabase.from('unidades').select('nome, secretaria').order('nome')
      ]);

      if (quadroRes.error) throw quadroRes.error;
      
      setQuadro(quadroRes.data || []);
      setColaboradores(colabsRes.data || []);
      setUnidades(unidadesRes.data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (editingItem) {
        const { error } = await supabase
          .from('vagas_quadro')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success("Vaga atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from('vagas_quadro')
          .insert([payload]);
        if (error) throw error;
        toast.success("Vaga cadastrada com sucesso!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta configuração de vaga?")) return;
    try {
      const { error } = await supabase.from('vagas_quadro').delete().eq('id', id);
      if (error) throw error;
      toast.success("Vaga excluída!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const openModal = (unidade?: string, item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        unidade_nome: item.unidade_nome,
        secretaria: item.secretaria,
        cargo: item.cargo,
        vagas_totais: item.vagas_totais,
        turno: item.turno,
        horario: item.horario,
        insalubridade: item.insalubridade || "N/A"
      });
    } else {
      setEditingItem(null);
      setFormData({
        unidade_nome: unidade || "",
        secretaria: filtroSecretaria,
        cargo: "",
        vagas_totais: 1,
        turno: "DIURNO",
        horario: "",
        insalubridade: "N/A"
      });
    }
    setIsModalOpen(true);
  };

  // Filtragem de Unidades baseada na Secretaria selecionada
  const unidadesFiltradas = unidades.filter(u => u.secretaria === filtroSecretaria && u.nome.toLowerCase().includes(busca.toLowerCase()));

  // Quadro processado com ocupação
  const getQuadroUnidade = (nomeUnidade: string) => {
    return quadro.filter(q => q.unidade_nome === nomeUnidade).map(item => {
      const ocupadas = colaboradores.filter(c => 
        c.unidade_alocacao === item.unidade_nome && 
        (c.cargo || "").toUpperCase() === (item.cargo || "").toUpperCase()
      ).length;
      
      return {
        ...item,
        ocupadas,
        abertas: Math.max(0, item.vagas_totais - ocupadas),
        excesso: Math.max(0, ocupadas - item.vagas_totais)
      };
    });
  };

  if (loading) return <div className="p-20 text-center opacity-50 font-black uppercase tracking-widest italic animate-pulse">Carregando Governança de Vagas...</div>;

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      
      {/* SELETOR DE SECRETARIA - TABS ESTILO ERP PRO */}
      <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-card)] p-4 rounded-[2rem] border border-[var(--border)] shadow-sm">
        <div className="px-6 py-2 border-r border-[var(--border)] mr-2 hidden lg:block">
            <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Secretaria</p>
        </div>
        {secretarias.map(s => (
          <button
            key={s}
            onClick={() => { setFiltroSecretaria(s); setUnidadeSelecionada(null); }}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroSecretaria === s ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LISTA DE UNIDADES (SIDEBAR) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden shadow-xl">
            <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-base)]/50">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                    <input 
                        type="text"
                        placeholder="Filtrar unidade..."
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {unidadesFiltradas.map(u => {
                const quotas = quadro.filter(q => q.unidade_nome === u.nome).length;
                return (
                  <button
                    key={u.nome}
                    onClick={() => setUnidadeSelecionada(u.nome)}
                    className={`w-full p-6 flex items-center justify-between border-b border-[var(--border)] transition-all hover:bg-[var(--bg-base)] group ${unidadeSelecionada === u.nome ? 'bg-[var(--bg-base)] border-r-4 border-r-[var(--brand)]' : ''}`}
                  >
                    <div className="flex items-center gap-4 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${unidadeSelecionada === u.nome ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-base)] text-[var(--text-muted)]'}`}>
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-[var(--text-primary)] uppercase leading-tight">{u.nome}</h4>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 italic">{quotas} cargos definidos</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className={`transition-transform ${unidadeSelecionada === u.nome ? 'translate-x-1 text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
                  </button>
                );
              })}
              {unidadesFiltradas.length === 0 && (
                <div className="p-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest italic">Nenhuma unidade nesta secretaria</div>
              )}
            </div>
          </div>
        </div>

        {/* DETALHES DO QUADRO DA UNIDADE */}
        <div className="lg:col-span-8">
          {unidadeSelecionada ? (
            <div className="flex flex-col gap-8 animate-slide-up">
              <div className="flex justify-between items-center bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Building2 size={120} />
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-[var(--brand)] uppercase tracking-[0.3em] mb-2 italic">Unidade Selecionada</p>
                    <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{unidadeSelecionada}</h3>
                </div>
                <button 
                  onClick={() => openModal(unidadeSelecionada)}
                  className="relative z-10 flex items-center gap-2 bg-[var(--brand)] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--brand)]/30 hover:scale-105 transition-all"
                >
                  <Plus size={18} /> Acrescentar Cargo
                </button>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {getQuadroUnidade(unidadeSelecionada).map(item => (
                  <div key={item.id} className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] p-10 md:p-12 shadow-xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden group hover:border-[var(--brand)]/30 transition-all">
                     {/* Indicador visual lateral */}
                    <div className={`absolute left-0 top-0 h-full w-2 ${item.abertas > 0 ? 'bg-green-500' : item.excesso > 0 ? 'bg-red-500' : 'bg-blue-500'}`} />
                    
                    <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                        <div className="w-14 h-14 bg-[var(--bg-base)] rounded-2xl flex items-center justify-center text-[var(--brand)] border border-[var(--border)]">
                            <Briefcase size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">{item.cargo}</h4>
                                {item.insalubridade && <ShieldAlert size={14} className="text-red-500" />}
                            </div>
                            <div className="flex gap-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">
                                <span className="flex items-center gap-1"><Clock size={12} /> {item.turno}</span>
                                {item.horario && <span className="flex items-center gap-1">• {item.horario}</span>}
                                {item.insalubridade && item.insalubridade !== 'N/A' && (
                                  <span className="flex items-center gap-1 text-red-500">• INSAL. {item.insalubridade}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end px-6 py-4 bg-[var(--bg-base)] rounded-[1.5rem] border border-[var(--border)]">
                        <div className="text-center min-w-[60px]">
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">Total</p>
                            <p className="text-xl font-black text-[var(--text-primary)]">{item.vagas_totais}</p>
                        </div>
                        <div className="text-center min-w-[60px]">
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">Ocup.</p>
                            <p className="text-xl font-black text-blue-500">{item.ocupadas}</p>
                        </div>
                        <div className={`text-center min-w-[60px] ${item.abertas > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                            <p className="text-[8px] font-black uppercase mb-1">Vagas</p>
                            <p className="text-xl font-black">{item.abertas}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => openModal(unidadeSelecionada, item)} className="w-10 h-10 flex items-center justify-center bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {getQuadroUnidade(unidadeSelecionada).length === 0 && (
                  <div className="p-40 text-center opacity-30 border-2 border-dashed border-[var(--border)] rounded-[4rem]">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-orange-500" />
                    <p className="text-sm font-black uppercase tracking-widest">Nenhum cargo configurado para esta unidade</p>
                    <button onClick={() => openModal(unidadeSelecionada)} className="mt-6 text-[10px] font-black text-[var(--brand)] underline uppercase tracking-widest">Configurar Agora</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-20 bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border)] border-dashed opacity-50">
              <MapPin size={64} className="text-[var(--text-muted)] mb-6 animate-bounce" />
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-widest">Selecione uma Unidade</h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] mt-2 italic text-center max-w-xs">Selecione uma unidade na lista lateral para gerenciar suas quotas de pessoal.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CADASTRO/EDIÇÃO */}
      <AdaptiveModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Editar Configuração de Vaga" : `Nova Vaga: ${formData.unidade_nome}`}
      >
        <form onSubmit={handleSave} className="p-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Unidade</label>
              <input readOnly value={formData.unidade_nome} className="w-full px-4 py-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-black opacity-60" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Secretaria</label>
              <input readOnly value={formData.secretaria} className="w-full px-4 py-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-black opacity-60" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Cargo / Função</label>
              <input 
                required
                type="text"
                list="cargos-list"
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                placeholder="Ex: ASG, Porteiro..."
                value={formData.cargo}
                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
              />
              <p className="text-[8px] font-bold text-[var(--text-muted)] italic">Você pode selecionar da lista ou digitar um novo cargo inexistente.</p>
              <datalist id="cargos-list">
                {sugestoesCargos.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Total de Vagas (Quota)</label>
              <input 
                required
                type="number"
                min="1"
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                value={formData.vagas_totais}
                onChange={(e) => setFormData({...formData, vagas_totais: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Turno</label>
              <select 
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                value={formData.turno}
                onChange={(e) => setFormData({...formData, turno: e.target.value})}
              >
                <option value="DIURNO">DIURNO</option>
                <option value="NOTURNO">NOTURNO</option>
                <option value="12X36">12X36</option>
                <option value="44H">44H</option>
                <option value="COMERCIAL">COMERCIAL</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Horário</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                placeholder="Ex: 07:00 as 17:00"
                value={formData.horario}
                onChange={(e) => setFormData({...formData, horario: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Insalubridade</label>
              <select 
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                value={formData.insalubridade}
                onChange={(e) => setFormData({...formData, insalubridade: e.target.value})}
              >
                <option value="N/A">N/A (NÃO TEM)</option>
                <option value="20%">20% (GRAU MÉDIO)</option>
                <option value="40%">40% (GRAU MÁXIMO)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-[var(--border)]">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--brand)]/20 hover:scale-105 disabled:opacity-50 transition-all"
            >
              {saving ? "Salvando..." : editingItem ? "Atualizar Quadro" : "Confirmar Cadastro"}
            </button>
          </div>
        </form>
      </AdaptiveModal>

    </div>
  );
}
