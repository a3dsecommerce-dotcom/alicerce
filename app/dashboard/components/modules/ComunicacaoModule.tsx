"use client";
import { useState, useEffect } from "react";
import { Radio, Users, Send, History, CheckCircle2, Clock, Plus, MessageSquare, ShieldCheck, ChevronRight, MoreVertical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function ComunicacaoModule() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({ titulo: "", mensagem: "", segmento: "TODOS", agendado: false, data_agendamento: "" });

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  async function fetchBroadcasts() {
    setLoading(true);
    const { data } = await supabase.from('notificacoes_broadcast').select('*').order('created_at', { ascending: false });
    if (data) setBroadcasts(data);
    setLoading(false);
  }

  const handleSend = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('notificacoes_broadcast').insert([{
      titulo: newBroadcast.titulo, mensagem: newBroadcast.mensagem, segmento: newBroadcast.segmento,
      status_envio: newBroadcast.agendado ? 'AGENDADO' : 'PROCESSANDO',
      agendado_para: newBroadcast.agendado ? newBroadcast.data_agendamento : null
    }]).select();

    if (!error) {
      if (!newBroadcast.agendado) n8n.trigger('whatsapp-broadcast', { id: data[0].id, ...newBroadcast });
      setShowNew(false);
      fetchBroadcasts();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-[var(--text-primary)]">Central de Comunicação Master</h2>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Disparos WhatsApp e Notificações</p>
        </div>
        <button className="btn-brand !h-10" onClick={() => setShowNew(true)}>
          <Plus size={16} className="mr-2" /> Novo Comunicado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-base)]/50">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <History size={14} /> Histórico de Transmissões
            </h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-6">
            <div className="flex flex-col gap-4">
              {broadcasts.map(b => (
                <div key={b.id} className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] hover:border-[var(--brand)] transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black px-2 py-1 rounded bg-blue-100 text-blue-700 uppercase">{b.status_envio}</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{b.titulo}</h4>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{b.mensagem}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-[var(--brand)] text-white p-6 rounded-[2.5rem] shadow-xl shadow-[var(--brand)]/20">
            <ShieldCheck className="mb-4 opacity-80" size={24} />
            <h3 className="text-lg font-black mb-1">Dica Pro</h3>
            <p className="text-[10px] opacity-90 font-medium leading-relaxed">Personalize com {"{nome}"} para aumentar a taxa de leitura em até 40%.</p>
          </div>
        </div>
      </div>

      <AdaptiveModal isOpen={showNew} onClose={() => setShowNew(false)} title="Novo Broadcast" width="600px">
         {/* ... (Same modal content as before) ... */}
         <div className="flex flex-col gap-4">
            <input className="input-field" placeholder="Título" value={newBroadcast.titulo} onChange={e => setNewBroadcast({...newBroadcast, titulo: e.target.value})} />
            <textarea className="input-field min-h-[120px]" placeholder="Mensagem..." value={newBroadcast.mensagem} onChange={e => setNewBroadcast({...newBroadcast, mensagem: e.target.value})} />
            <button className="btn-brand !h-12" onClick={handleSend} disabled={loading}>Enviar Agora</button>
         </div>
      </AdaptiveModal>
    </div>
  );
}
