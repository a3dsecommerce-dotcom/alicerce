"use client";
import { useState } from "react";
import { Truck, Calendar, MapPin, User, FileText, Plus, X, Clock, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

interface VolantesEscalaProps {
  volantes: any[];
  refresh: () => void;
  user: any;
}

export default function VolantesEscala({ volantes, refresh, user }: VolantesEscalaProps) {
  const [modalNovo, setModalNovo] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    colaborador_id: "",
    colaborador_nome: "",
    data: format(new Date(), "yyyy-MM-dd"),
    observacoes: "",
    detalhes: [] as any[]
  });

  const [novoDetalhe, setNovoDetalhe] = useState({
    unidade: "",
    entrada: "",
    saida: "",
    motivo: ""
  });

  // Busca de colaboradores
  const [buscaColab, setBuscaColab] = useState("");
  const [colabsSugeridos, setColabsSugeridos] = useState<any[]>([]);

  const searchColabs = async (val: string) => {
    setBuscaColab(val);
    if (val.length > 1) {
      const { data } = await supabase.from('usuarios').select('*').ilike('nome', `%${val}%`).limit(5);
      if (data) setColabsSugeridos(data);
    } else {
      setColabsSugeridos([]);
    }
  };

  const addDetalhe = () => {
    if (!novoDetalhe.unidade || !novoDetalhe.entrada) return toast.error("Preencha unidade e entrada");
    setFormData({ ...formData, detalhes: [...formData.detalhes, novoDetalhe] });
    setNovoDetalhe({ unidade: "", entrada: "", saida: "", motivo: "" });
  };

  const removeDetalhe = (idx: number) => {
    setFormData({ ...formData, detalhes: formData.detalhes.filter((_, i) => i !== idx) });
  };

  const handleSalvar = async () => {
    if (!formData.colaborador_id || formData.detalhes.length === 0) return toast.error("Preencha o colaborador e ao menos uma unidade.");
    
    setLoading(true);
    const { error } = await supabase.from('escala_volantes').insert([{
      colaborador_id: formData.colaborador_id,
      colaborador_nome: formData.colaborador_nome,
      data: formData.data,
      detalhes_visitas: formData.detalhes,
      observacoes: formData.observacoes,
      criado_por_id: user.id,
      criado_por_nome: user.name || user.nome
    }]);

    if (!error) {
      toast.success("Escala registrada!");
      setModalNovo(false);
      setFormData({ colaborador_id: "", colaborador_nome: "", data: format(new Date(), "yyyy-MM-dd"), observacoes: "", detalhes: [] });
      refresh();
    } else {
      toast.error("Erro ao salvar escala.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-500/20">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)] uppercase italic">Escala de Volantes</h2>
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Controle de deslocamento e substituições diárias</p>
          </div>
        </div>
        <button onClick={() => setModalNovo(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-indigo-600/20">
          <Plus size={16} /> Registrar Escala
        </button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <tr>
              <th className="p-6">Data</th>
              <th className="p-6">Colaborador Volante</th>
              <th className="p-6">Roteiro do Dia (Unidades / Horários)</th>
              <th className="p-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {volantes.map((v, idx) => (
              <tr key={idx} className="hover:bg-[var(--bg-base)]/30 transition-colors group">
                <td className="p-6 w-40">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[var(--text-primary)]">{format(new Date(v.data), "dd/MM/yyyy")}</span>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase italic">Registro #{v.id.substring(0,6)}</span>
                  </div>
                </td>
                <td className="p-6 w-64">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-xs">
                      {v.colaborador_nome?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--text-primary)] uppercase">{v.colaborador_nome}</p>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">ID: {v.colaborador_id?.substring(0,8)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-wrap gap-3">
                    {v.detalhes_visitas?.map((d: any, i: number) => (
                      <div key={i} className="p-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl flex flex-col gap-1 min-w-[200px]">
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-1 mb-1">
                          <span className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1"><MapPin size={10} /> {d.unidade}</span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)]">{d.entrada} - {d.saida || '...'}</span>
                        </div>
                        <p className="text-[9px] font-medium text-[var(--text-secondary)] italic leading-tight">"{d.motivo || 'Motivo não informado'}"</p>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button className="p-3 text-[var(--text-muted)] hover:text-red-500 transition-colors"><FileText size={18} /></button>
                </td>
              </tr>
            ))}
            {volantes.length === 0 && (
              <tr>
                <td colSpan={4} className="p-20 text-center opacity-30">
                  <Truck size={48} className="mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhuma escala registrada.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdaptiveModal isOpen={modalNovo} onClose={() => setModalNovo(false)} title="Registrar Escala Diária - Volante">
        <div className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] italic">1. Selecione o Colaborador</label>
              <div className="relative">
                <input 
                  className="input-field !h-14 font-black" 
                  placeholder="DIGITE O NOME DO VOLANTE..." 
                  value={buscaColab}
                  onChange={(e) => searchColabs(e.target.value)}
                />
                {colabsSugeridos.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                    {colabsSugeridos.map(c => (
                      <button key={c.id} onClick={() => { setFormData({...formData, colaborador_id: c.id, colaborador_nome: c.nome}); setBuscaColab(c.nome); setColabsSugeridos([]); }} className="w-full p-4 text-left hover:bg-indigo-50 border-b border-[var(--border)] last:border-none">
                        <p className="text-[11px] font-black uppercase text-indigo-900">{c.nome}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{c.unidade_alocacao || 'VOLANTE'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] italic">2. Data da Escala</label>
              <input type="date" className="input-field !h-14 font-black" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-6">
            <h5 className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2">
              <MapPin size={14} /> Adicionar Unidade Atendida
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input className="input-field !h-12 text-[11px]" placeholder="UNIDADE" value={novoDetalhe.unidade} onChange={(e) => setNovoDetalhe({...novoDetalhe, unidade: e.target.value})} />
              <input className="input-field !h-12 text-[11px]" placeholder="H. ENTRADA" value={novoDetalhe.entrada} onChange={(e) => setNovoDetalhe({...novoDetalhe, entrada: e.target.value})} />
              <input className="input-field !h-12 text-[11px]" placeholder="H. SAÍDA" value={novoDetalhe.saida} onChange={(e) => setNovoDetalhe({...novoDetalhe, saida: e.target.value})} />
              <input className="input-field !h-12 text-[11px]" placeholder="MOTIVO / OBS" value={novoDetalhe.motivo} onChange={(e) => setNovoDetalhe({...novoDetalhe, motivo: e.target.value})} />
            </div>
            <button onClick={addDetalhe} className="w-full py-3 bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-200 transition-all">
              + Incluir esta Unidade no Roteiro
            </button>
          </div>

          {formData.detalhes.length > 0 && (
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase text-slate-900 italic">Roteiro Temporário:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.detalhes.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                    <div>
                      <p className="text-xs font-black text-slate-900">{d.unidade}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{d.entrada} às {d.saida || '...'}</p>
                    </div>
                    <button onClick={() => removeDetalhe(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-slate-200">
            <button onClick={handleSalvar} disabled={loading} className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition-all disabled:opacity-50">
              {loading ? 'Salvando...' : 'Finalizar Registro da Escala'}
            </button>
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}
