"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Target, Plus, Clock, CheckCircle2, AlertCircle, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function MissoesManager() {
  const [missoes, setMissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newMissao, setNewMissao] = useState({
    titulo: "",
    descricao: "",
    frequencia: "SEMANAL",
    checklist: [
      { task: "Conferência de EPI", type: "boolean" },
      { task: "Confirmação de Colaboradores", type: "boolean" }
    ]
  });

  useEffect(() => {
    fetchMissoes();
  }, []);

  async function fetchMissoes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('missoes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setMissoes(data || []);
    setLoading(false);
  }

  async function handleCreateMissao() {
    if (!newMissao.titulo) {
      toast.error("Título é obrigatório");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('missoes').insert([newMissao]);

    if (!error) {
      toast.success("Missão lançada com sucesso!");
      setIsModalOpen(false);
      fetchMissoes();
      setNewMissao({
        titulo: "",
        descricao: "",
        frequencia: "SEMANAL",
        checklist: [
          { task: "Conferência de EPI", type: "boolean" },
          { task: "Confirmação de Colaboradores", type: "boolean" }
        ]
      });
    } else {
      toast.error("Erro ao lançar missão: " + error.message);
    }
    setSaving(false);
  }

  async function toggleStatus(id: string, current: boolean) {
    const { error } = await supabase.from('missoes').update({ ativa: !current }).eq('id', id);
    if (!error) fetchMissoes();
  }

  async function deleteMissao(id: string) {
    if (!confirm("Excluir esta missão permanentemente?")) return;
    const { error } = await supabase.from('missoes').delete().eq('id', id);
    if (!error) fetchMissoes();
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Banner de Ação */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Trophy size={120} className="text-orange-500" />
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-black text-white italic tracking-tighter">Comando de Missões Ops</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">Engajamento e Auditoria de Campo Alicerce</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-14 px-10 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-orange-600/20 relative z-10"
        >
          <Plus size={20} /> Lançar Nova Missão
        </button>
      </div>

      {/* Grid de Missões Ativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full p-20 text-center opacity-30">Carregando missões...</div>
        ) : missoes.length === 0 ? (
          <div className="col-span-full bg-[var(--bg-card)] p-20 rounded-[3rem] border border-dashed border-[var(--border)] text-center opacity-40">
             <Target size={48} className="mx-auto mb-4" />
             <p className="text-xs font-black uppercase tracking-widest">Nenhuma missão ativa no radar</p>
          </div>
        ) : (
          missoes.map((missao) => (
            <div key={missao.id} className={`bg-[var(--bg-card)] p-8 rounded-[2.5rem] border ${missao.ativa ? "border-orange-500/30" : "border-[var(--border)]"} shadow-xl relative group`}>
               <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${missao.frequencia === 'SEMANAL' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                    {missao.frequencia}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(missao.id, missao.ativa)} className="p-2 hover:bg-[var(--bg-base)] rounded-lg transition-colors">
                      {missao.ativa ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-slate-400" />}
                    </button>
                    <button onClick={() => deleteMissao(missao.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500 opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
               </div>
               
               <h4 className="text-lg font-black text-[var(--text-primary)] italic leading-tight">{missao.titulo}</h4>
               <p className="text-xs font-medium text-[var(--text-muted)] mt-2 line-clamp-2">{missao.descricao}</p>
               
               <div className="mt-6 pt-6 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[var(--brand)]" />
                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Criada em {new Date(missao.created_at).toLocaleDateString()}</span>
                  </div>
                  <button className="text-[10px] font-black uppercase text-orange-600 hover:underline">Ver Status</button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Criação */}
      <AdaptiveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lançar Nova Missão de Elite" width="600px">
        <div className="p-10 space-y-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Título da Missão</label>
              <input 
                className="input-field w-full h-14 font-black text-lg" 
                placeholder="Ex: Operação EPI 100%" 
                value={newMissao.titulo}
                onChange={e => setNewMissao({...newMissao, titulo: e.target.value.toUpperCase()})}
              />
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Frequência</label>
                <select 
                  className="input-field w-full h-12 font-bold"
                  value={newMissao.frequencia}
                  onChange={e => setNewMissao({...newMissao, frequencia: e.target.value})}
                >
                  <option value="SEMANAL">SEMANAL (Foco Rápido)</option>
                  <option value="MENSAL">MENSAL (Auditoria)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Tipo</label>
                <select className="input-field w-full h-12 font-bold">
                  <option value="EPI">CONFERÊNCIA DE EPI</option>
                  <option value="UNIDADE">STATUS DE UNIDADE</option>
                  <option value="DADOS">ATUALIZAÇÃO DE DADOS</option>
                </select>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Instruções para o Encarregado</label>
              <textarea 
                className="input-field w-full p-4 h-32 font-bold" 
                placeholder="O que ele deve fazer em campo..."
                value={newMissao.descricao}
                onChange={e => setNewMissao({...newMissao, descricao: e.target.value})}
              />
           </div>

           <button 
             disabled={saving}
             onClick={handleCreateMissao}
             className="w-full h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
           >
             {saving ? "Lançando Missão..." : <><Send size={18}/> Disparar Missão para Encarregados</>}
           </button>
        </div>
      </AdaptiveModal>

    </div>
  );
}
