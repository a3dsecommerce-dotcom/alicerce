"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Building2, Users, Plus, Edit2, Trash2, Search, Filter, 
  ShieldAlert, Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function QuadroVagas() {
  const [loading, setLoading] = useState(true);
  const [quadro, setQuadro] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroSecretaria, setFiltroSecretaria] = useState("TODOS");
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
    insalubridade: false
  });

  const secretarias = ["TODOS", "SEMED", "SEMSA", "SEMTAC", "SEMOB", "ADMINISTRAÇÃO GERAL"];

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

  const openModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        unidade_nome: item.unidade_nome,
        secretaria: item.secretaria,
        cargo: item.cargo,
        vagas_totais: item.vagas_totais,
        turno: item.turno,
        horario: item.horario,
        insalubridade: item.insalubridade
      });
    } else {
      setEditingItem(null);
      setFormData({
        unidade_nome: "",
        secretaria: "",
        cargo: "",
        vagas_totais: 1,
        turno: "DIURNO",
        horario: "",
        insalubridade: false
      });
    }
    setIsModalOpen(true);
  };

  // Processar dados para exibição (Cálculo de ocupadas)
  const quadroProcessado = quadro.map(item => {
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

  const filtrados = quadroProcessado.filter(item => {
    const matchBusca = item.unidade_nome.toLowerCase().includes(busca.toLowerCase()) || 
                       item.cargo.toLowerCase().includes(busca.toLowerCase());
    const matchSec = filtroSecretaria === "TODOS" || item.secretaria === filtroSecretaria;
    return matchBusca && matchSec;
  });

  if (loading) return <div className="p-20 text-center opacity-50">Carregando quadro de vagas...</div>;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* HEADER & FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black italic text-[var(--text-primary)]">Quadro de Lotação</h3>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Controle de vagas permitidas vs ocupadas por unidade</p>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text"
              placeholder="Buscar unidade ou cargo..."
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl text-xs font-bold"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl text-xs font-black uppercase"
            value={filtroSecretaria}
            onChange={(e) => setFiltroSecretaria(e.target.value)}
          >
            {secretarias.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-[var(--brand)] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--brand)]/20 hover:scale-105 transition-all"
          >
            <Plus size={16} /> Cadastrar Vaga
          </button>
        </div>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((item) => (
          <div key={item.id} className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] p-8 shadow-xl relative overflow-hidden group">
            {/* Indicador visual de status */}
            <div className={`absolute top-0 right-0 w-2 h-full ${item.abertas > 0 ? 'bg-green-500' : item.excesso > 0 ? 'bg-red-500' : 'bg-blue-500'}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--bg-base)] rounded-xl flex items-center justify-center border border-[var(--border)] text-[var(--brand)]">
                  <Building2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[var(--text-primary)] leading-tight">{item.unidade_nome}</h4>
                  <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{item.secretaria}</p>
                </div>
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(item)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1">Cargo / Função</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{item.cargo}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--bg-base)] p-3 rounded-2xl text-center border border-[var(--border)]">
                <p className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">Total</p>
                <p className="text-xl font-black text-[var(--text-primary)]">{item.vagas_totais}</p>
              </div>
              <div className="bg-[var(--bg-base)] p-3 rounded-2xl text-center border border-[var(--border)]">
                <p className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">Ocup.</p>
                <p className="text-xl font-black text-blue-500">{item.ocupadas}</p>
              </div>
              <div className={`p-3 rounded-2xl text-center border ${item.abertas > 0 ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                <p className="text-[8px] font-black uppercase mb-1">Abertas</p>
                <p className="text-xl font-black">{item.abertas}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
              <span className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-base)] rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] border border-[var(--border)]">
                <Clock size={10} /> {item.turno} {item.horario && `(${item.horario})`}
              </span>
              {item.insalubridade && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded-lg text-[8px] font-black uppercase text-red-500 border border-red-500/20">
                  <ShieldAlert size={10} /> Insalubridade
                </span>
              )}
              {item.excesso > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase shadow-lg shadow-red-500/20">
                  <AlertTriangle size={10} /> Excesso: {item.excesso}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="p-40 text-center opacity-30 border-2 border-dashed border-[var(--border)] rounded-[3rem]">
          <Users size={48} className="mx-auto mb-4" />
          <p className="text-sm font-black uppercase tracking-widest">Nenhuma vaga cadastrada ou encontrada</p>
        </div>
      )}

      {/* MODAL CADASTRO/EDIÇÃO */}
      <AdaptiveModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Editar Vaga" : "Cadastrar Nova Vaga no Quadro"}
      >
        <form onSubmit={handleSave} className="p-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Unidade</label>
              <select 
                required
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                value={formData.unidade_nome}
                onChange={(e) => {
                  const u = unidades.find(un => un.nome === e.target.value);
                  setFormData({...formData, unidade_nome: e.target.value, secretaria: u?.secretaria || ""});
                }}
              >
                <option value="">Selecione a Unidade</option>
                {unidades.map(u => <option key={u.nome} value={u.nome}>{u.nome}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Secretaria</label>
              <input 
                readOnly
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-bold opacity-70"
                value={formData.secretaria}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Cargo / Função</label>
              <input 
                required
                type="text"
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                placeholder="Ex: ASG, Porteiro..."
                value={formData.cargo}
                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
              />
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
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Horário (Opcional)</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                placeholder="Ex: 07:00 as 17:00"
                value={formData.horario}
                onChange={(e) => setFormData({...formData, horario: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-[var(--border)] rounded-xl hover:bg-[var(--bg-base)] transition-all">
                <input 
                  type="checkbox"
                  className="w-5 h-5 accent-[var(--brand)]"
                  checked={formData.insalubridade}
                  onChange={(e) => setFormData({...formData, insalubridade: e.target.checked})}
                />
                <span className="text-[10px] font-black uppercase tracking-widest">Insalubridade</span>
              </label>
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
