"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Clock, CheckCircle, Trash2, MessageSquare, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function DenunciasManager() {
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDenuncias();
  }, []);

  const fetchDenuncias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('denuncias_anonimas')
      .select('*')
      .order('criado_at', { ascending: false });
    
    if (!error) setDenuncias(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('denuncias_anonimas')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) {
      toast.success("Status atualizado!");
      fetchDenuncias();
    }
  };

  const deleteDenuncia = async (id: string) => {
    if (!confirm("Excluir registro permanentemente?")) return;
    const { error } = await supabase.from('denuncias_anonimas').delete().eq('id', id);
    if (!error) {
      toast.success("Denúncia removida.");
      fetchDenuncias();
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="bg-red-600 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
        <ShieldAlert className="absolute top-0 right-0 p-10 opacity-10" size={140} />
        <div className="relative z-10">
          <h2 className="text-3xl font-black italic tracking-tighter">Canal de Ética & Ouvidoria</h2>
          <p className="text-[10px] font-black uppercase text-red-200 tracking-[0.3em] mt-2">Gestão de relatos anônimos e conformidade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 text-center uppercase font-black text-[var(--text-muted)] animate-pulse">Sincronizando Relatos...</div>
        ) : denuncias.length === 0 ? (
          <div className="p-20 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)] text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500 opacity-20" size={48} />
            <p className="text-xs font-black uppercase text-[var(--text-muted)]">Nenhuma denúncia pendente no radar.</p>
          </div>
        ) : (
          denuncias.map((d) => (
            <div key={d.id} className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl group transition-all hover:border-[var(--danger)]/30">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-red-500/10 text-red-600 text-[8px] font-black uppercase rounded-lg border border-red-500/20">
                      {d.natureza}
                    </span>
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} /> {new Date(d.criado_em).toLocaleDateString()} - {d.protocolo}
                    </span>
                    <div className={`ml-auto px-4 py-1 rounded-full text-[8px] font-black uppercase ${
                      d.status === 'PENDENTE' ? 'bg-orange-500/10 text-orange-600' :
                      d.status === 'EM_ANALISE' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-green-500/10 text-green-600'
                    }`}>
                      {d.status}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] leading-relaxed bg-[var(--bg-base)] p-6 rounded-2xl border border-[var(--border)]">
                    {d.detalhamento}
                  </h4>
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => updateStatus(d.id, 'EM_ANALISE')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={14} /> Analisar
                  </button>
                  <button 
                    onClick={() => updateStatus(d.id, 'CONCLUIDO')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={14} /> Concluir
                  </button>
                  <button 
                    onClick={() => deleteDenuncia(d.id)}
                    className="flex-1 px-4 py-2 bg-red-600/10 text-red-600 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
