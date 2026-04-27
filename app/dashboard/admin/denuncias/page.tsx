"use client";
import { useState, useEffect } from "react";
import { ShieldAlert, Eye, Archive, MessageSquare, Filter, Clock, AlertTriangle, Loader } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";

export default function DenunciasAdminPage() {
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDenuncias() {
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .eq('sigiloso', true)
        .order('data_hora', { ascending: false });
      
      if (!error && data) {
        setDenuncias(data);
      }
      setLoading(false);
    }
    loadDenuncias();
  }, []);

  const handleAction = async (id: string, action: string, info: any) => {
    setLoading(true);
    let newStatus = '';
    if (action === 'investigar') newStatus = 'EM_ANALISE';
    if (action === 'arquivar') newStatus = 'ARQUIVADO';

    const { error } = await supabase
      .from('ocorrencias')
      .update({ status: newStatus || undefined })
      .eq('id', id);

    if (!error) {
      await n8n.trigger('acao-denuncia', {
        acao: action,
        denuncia_id: id,
        tipo: info.tipo,
        detalhes: info.descricao
      });
      alert(`Ação "${action}" registrada e n8n notificado para auditoria.`);
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border)] backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} /> Canal de Ética <span className="text-[var(--text-muted)] opacity-20 ml-2">|</span> <span className="text-xs font-normal text-[var(--text-muted)] uppercase tracking-widest ml-2">Privado Gerência</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Visualização restrita de denúncias e relatos anônimos auditados por IA.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-xs">
            <Filter size={14} /> Filtrar por Tipo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20 text-[var(--text-muted)] animate-pulse">Consultando base segura...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {denuncias.length === 0 ? (
            <div className="card p-10 text-center text-[var(--text-muted)]">Nenhum relato sigiloso registrado.</div>
          ) : denuncias.map((d, index) => (
            <div 
              key={d.id} 
              className="card card-glow p-6 relative overflow-hidden group transition-all hover:scale-[1.01]"
              style={{ 
                borderLeft: `4px solid ${d.status === 'ABERTO' ? '#EF4444' : d.status === 'EM_ANALISE' ? '#3B82F6' : 'var(--border)'}` 
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <span className={`badge ${d.status === 'ABERTO' ? 'badge-red' : d.status === 'EM_ANALISE' ? 'badge-blue' : 'badge-ghost'}`}>
                    {d.status}
                  </span>
                  <h3 className="font-bold text-[var(--text-primary)] tracking-tight">{d.tipo}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Clock size={12} /> {new Date(d.data_hora).toLocaleString('pt-BR')}
                </div>
              </div>
              
              <div className="bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border)] mb-6 group-hover:border-[var(--border-light)] transition-colors">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                  "{d.descricao}"
                </p>
                <div className="mt-3 text-[10px] text-[var(--text-muted)] uppercase font-bold">
                  Origem: {d.unidade || "Anônimo"} • Ticket: #{d.id.substring(0,8)}
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-[var(--border)] pt-4">
                <button className="btn-ghost h-9 text-xs px-4" onClick={() => handleAction(d.id, 'arquivar', d)}>
                  <Archive size={14} /> Arquivar
                </button>
                <button 
                  className="btn-ghost h-9 text-xs px-4 text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                  onClick={() => handleAction(d.id, 'notificar_rh', d)}
                >
                  <MessageSquare size={14} /> Notificar RH
                </button>
                <button className="btn-brand h-9 text-xs px-4" onClick={() => handleAction(d.id, 'investigar', d)}>
                  <Eye size={14} /> Iniciar Investigação
                </button>
              </div>
              
              {d.status === 'ABERTO' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl -z-10 pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
