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
    salario: 0,
    escala: "44H",
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
        supabase.from('usuarios').select('unidade_alocacao, cargo, funcao, insalubridade, percentual_insalubridade').eq('status', 'ATIVO'),
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
        salario: item.salario || 0,
        escala: item.escala || "44H",
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
        salario: 0,
        escala: "44H",
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
    const normalize = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() : "";
    
    // Remove siglas comuns que os usuários podem digitar errado no cadastro do funcionário (incluindo com pontos)
    const removePrefixes = (s: string) => {
      let clean = s.replace(/[\.]/g, ""); // Remove pontos (ex: C.M.E.I)
      return clean.replace(/^(CEMEI|CMEI|CEMEITI|EMEF|EMEIEF|EMEIEFTI|EMPEF|EMPEIEF|EMUEF|ESCOLA|CRECHE|CENTRO|NAEE)\s+/i, "").trim();
    };

    return quadro.filter(q => q.unidade_nome === nomeUnidade).map(item => {
      const itemCargoUpper = normalize(item.cargo);
      const itemInsalubridade = normalize(item.insalubridade).replace(/\D/g, "");
      const unidadeVaga = normalize(item.unidade_nome);
      const unidadeVagaClean = removePrefixes(unidadeVaga);
      
      const ocupadas = colaboradores.filter(c => {
        const unidadeColab = normalize(c.unidade_alocacao);
        const unidadeColabClean = removePrefixes(unidadeColab);
        
        // Verifica se todas as palavras da vaga estão na unidade do colaborador ou vice versa
        const wordsVaga = unidadeVagaClean.split(" ").filter(w => w.length > 2);
        const wordsColab = unidadeColabClean.split(" ").filter(w => w.length > 2);
        
        const hasCommonWords = wordsVaga.length > 0 && wordsColab.length > 0 && 
                               (wordsVaga.every(w => unidadeColabClean.includes(w)) || 
                                wordsColab.every(w => unidadeVagaClean.includes(w)));
        
        const matchUnidade = unidadeColabClean === unidadeVagaClean || 
                             unidadeColabClean.includes(unidadeVagaClean) || 
                             unidadeVagaClean.includes(unidadeColabClean) ||
                             hasCommonWords;
                             
        if (!matchUnidade) return false;
        
        let colabCargo = normalize(c.cargo || c.funcao || "OUTROS");
        
        const cargoMatch = colabCargo === itemCargoUpper || colabCargo.includes(itemCargoUpper) || itemCargoUpper.includes(colabCargo);
        
        // Se a vaga exige uma insalubridade específica, valida se o colaborador a possui
        if (cargoMatch && itemInsalubridade !== "" && itemInsalubridade !== "N/A" && item.insalubridade !== "N/A") {
          let colabInsalubridade = normalize(String(c.percentual_insalubridade || c.insalubridade || "")).replace(/\D/g, "");
          
          // Fallback inteligente: se for ASG/Cozinheira e estiver vazio ou "NA" (virou ""), assume 20
          if (!colabInsalubridade && (colabCargo.includes("ASG") || colabCargo.includes("COZINHEIRA"))) {
            colabInsalubridade = "20";
          }
          
          return colabInsalubridade === itemInsalubridade;
        }
        
        return cargoMatch;
      }).length;
      
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
              <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-8 lg:p-10 border-b border-[var(--border)] bg-[var(--bg-base)]/30 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <p className="text-[10px] font-black text-[var(--brand)] uppercase tracking-[0.3em] mb-2 italic">Governança Local</p>
                        <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{unidadeSelecionada}</h3>
                    </div>
                    <button 
                        onClick={() => openModal(unidadeSelecionada)}
                        className="flex items-center gap-2 bg-[var(--brand)] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--brand)]/30 hover:scale-105 transition-all"
                    >
                        <Plus size={18} /> Adicionar Cargo à Unidade
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Cargo / Função</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Escala / Turno</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Quota (Vagas)</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Ocupação</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getQuadroUnidade(unidadeSelecionada).map(item => (
                                <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-base)]/30 transition-all group">
                                    <td className="px-8 py-6 cursor-pointer group/cell" onClick={() => openModal(unidadeSelecionada, item)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[var(--bg-base)] rounded-xl flex items-center justify-center text-[var(--brand)] border border-[var(--border)] group-hover/cell:bg-[var(--brand)] group-hover/cell:text-white transition-all">
                                                <Briefcase size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[11px] font-black text-[var(--text-primary)] uppercase group-hover/cell:text-[var(--brand)] transition-colors">{item.cargo}</p>
                                                    <Edit2 size={10} className="opacity-0 group-hover/cell:opacity-100 transition-opacity text-[var(--brand)]" />
                                                </div>
                                                {item.insalubridade && item.insalubridade !== 'N/A' && (
                                                    <p className="text-[8px] font-black text-red-500 uppercase mt-1 italic">Insal. {item.insalubridade}</p>
                                                )}
                                                {item.salario > 0 && (
                                                    <p className="text-[8px] font-black text-green-600 uppercase mt-0.5 italic">R$ {item.salario.toLocaleString('pt-BR')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-[var(--text-primary)] uppercase">{item.escala}</span>
                                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter italic">{item.turno}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex justify-center">
                                            <input 
                                                type="number"
                                                min="0"
                                                className="w-20 px-3 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-center text-sm font-black text-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 outline-none transition-all"
                                                value={item.vagas_totais}
                                                onChange={async (e) => {
                                                    const newVal = parseInt(e.target.value) || 0;
                                                    // Atualização rápida otimista
                                                    const updatedQuadro = quadro.map(q => q.id === item.id ? { ...q, vagas_totais: newVal } : q);
                                                    setQuadro(updatedQuadro);
                                                    
                                                    // Salva no banco
                                                    const { error } = await supabase.from('vagas_quadro').update({ vagas_totais: newVal }).eq('id', item.id);
                                                    if (error) toast.error("Erro ao atualizar quota");
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-sm font-black text-blue-600">{item.ocupadas}</p>
                                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase">Colaboradores</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        {item.abertas > 0 ? (
                                            <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-lg text-[9px] font-black uppercase border border-green-500/20">
                                                {item.abertas} VAGAS
                                            </span>
                                        ) : item.excesso > 0 ? (
                                            <span className="px-3 py-1 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase shadow-lg shadow-red-500/20">
                                                EXCESSO: {item.excesso}
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[9px] font-black uppercase border border-blue-500/20">
                                                COMPLETO
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openModal(unidadeSelecionada, item)} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {getQuadroUnidade(unidadeSelecionada).length === 0 && (
                  <div className="p-40 text-center opacity-30 bg-[var(--bg-base)]/10">
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
        closeOnOutsideClick={false}
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
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Vagas (Quota)</label>
              <input 
                required
                type="number"
                min="1"
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                value={formData.vagas_totais}
                onChange={(e) => setFormData({...formData, vagas_totais: parseInt(e.target.value)})}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Salário Base (R$)</label>
              <input 
                required
                type="number"
                step="0.01"
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                placeholder="Ex: 1500.00"
                value={formData.salario}
                onChange={(e) => setFormData({...formData, salario: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Escala</label>
              <select 
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                value={formData.escala}
                onChange={(e) => setFormData({...formData, escala: e.target.value})}
              >
                <option value="44H">44H (SEMANAL)</option>
                <option value="12X36">12X36</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Turno</label>
              <select 
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl text-xs font-bold focus:border-[var(--brand)] outline-none"
                value={formData.turno}
                onChange={(e) => setFormData({...formData, turno: e.target.value})}
              >
                <option value="DIURNO">DIURNO</option>
                <option value="NOTURNO">NOTURNO</option>
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
