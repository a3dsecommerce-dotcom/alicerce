"use client";
import { useState, useEffect } from "react";
import { 
  Radio, Users, Send, History, CheckCircle2, AlertCircle, 
  Clock, Filter, Search, Plus, MessageSquare, ShieldCheck,
  ChevronRight, MoreVertical, LayoutGrid, List
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function ComunicacaoPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  const [newBroadcast, setNewBroadcast] = useState({
    titulo: "",
    mensagem: "",
    segmento: "TODOS",
    agendado: false,
    data_agendamento: ""
  });

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  async function fetchBroadcasts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notificacoes_broadcast')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setBroadcasts(data);
    setLoading(false);
  }

  const handleSend = async () => {
    setLoading(true);
    
    // 1. Log no Supabase
    const { data, error } = await supabase
      .from('notificacoes_broadcast')
      .insert([{
        titulo: newBroadcast.titulo,
        mensagem: newBroadcast.mensagem,
        segmento: newBroadcast.segmento,
        status_envio: newBroadcast.agendado ? 'AGENDADO' : 'PROCESSANDO',
        agendado_para: newBroadcast.agendado ? newBroadcast.data_agendamento : null
      }])
      .select();

    if (!error) {
      // 2. Disparo n8n (se não for agendado para o futuro distante via DB)
      if (!newBroadcast.agendado) {
        try {
          n8n.trigger('whatsapp-broadcast', {
            id: data[0].id,
            ...newBroadcast
          });
        } catch (e) {
          console.warn("n8n offline, log salvo.");
        }
      }
      
      alert(newBroadcast.agendado ? "Notificação agendada!" : "Disparo iniciado com sucesso!");
      setShowNew(false);
      fetchBroadcasts();
    }
    setLoading(false);
  };

  const stats = [
    { label: "Total Enviados", value: broadcasts.length, icon: Radio, color: "text-blue-600" },
    { label: "Sucesso Médio", value: "98.2%", icon: CheckCircle2, color: "text-green-600" },
    { label: "Agendados", value: broadcasts.filter(b => b.status_envio === 'AGENDADO').length, icon: Clock, color: "text-amber-600" },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Central de Comunicação</h1>
          <p className="text-[var(--text-muted)] font-medium">Painel de Broadcast e Notificações em Massa via WhatsApp.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            className="btn-brand !h-12 px-6 shadow-lg shadow-[var(--brand)]/20"
            onClick={() => setShowNew(true)}
          >
            <Plus size={18} className="mr-2" /> Novo Comunicado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border)] flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-opacity-10 ${s.color.replace('text', 'bg')}`}>
              <s.icon className={s.color} size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-[var(--text-primary)]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        
        {/* Left: History */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
              <History size={20} className="text-[var(--brand)]" /> Histórico de Disparos
            </h2>
            <div className="flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border)]">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--border)]">
              <div className="w-12 h-12 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[var(--text-muted)] font-bold">Carregando transmissões...</p>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--border)]">
              <MessageSquare size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
              <p className="text-[var(--text-muted)] font-bold text-center">Nenhum comunicado enviado ainda.<br/>Comece agora criando seu primeiro broadcast.</p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-3"}>
              {broadcasts.map((b) => (
                <div 
                  key={b.id} 
                  className="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border)] hover:border-[var(--brand)]/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${
                        b.status_envio === 'CONCLUIDO' ? 'bg-green-100 text-green-700' :
                        b.status_envio === 'PROCESSANDO' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status_envio}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">
                        {new Date(b.created_at).toLocaleDateString('pt-BR')} às {new Date(b.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-[var(--text-primary)] mb-2">{b.titulo}</h3>
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">{b.mensagem}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Users size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{b.segmento}</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-green-600 uppercase">Sucesso</p>
                        <p className="text-xs font-bold">{b.sucessos || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-red-600 uppercase">Falhas</p>
                        <p className="text-xs font-bold">{b.falhas || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Tips & Templates */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--brand)] text-white p-6 rounded-[2.5rem] shadow-xl shadow-[var(--brand)]/30 relative overflow-hidden">
            <div className="relative z-10">
              <ShieldCheck className="mb-4 opacity-80" size={32} />
              <h3 className="text-xl font-black mb-2 leading-tight">Dicas de Comunicação</h3>
              <p className="text-sm opacity-90 font-medium">Use tags como <span className="font-mono bg-white/20 px-1 rounded">{"{nome}"}</span> para personalizar as mensagens e aumentar o engajamento.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border)]">
            <h3 className="font-black text-[var(--text-primary)] uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
              <MessageSquare size={16} className="text-[var(--brand)]" /> Templates Rápidos
            </h3>
            <div className="flex flex-col gap-3">
              {[
                "Aviso de Feriado Coletivo",
                "Convocação para Exame Periódico",
                "Entrega de Novos Uniformes",
                "Comunicado Urgente de Segurança"
              ].map((t, i) => (
                <button 
                  key={i} 
                  className="w-full text-left p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] hover:border-[var(--brand)] transition-all flex items-center justify-between group"
                >
                  <span className="text-sm font-bold text-[var(--text-secondary)] group-hover:text-[var(--brand)]">{t}</span>
                  <ChevronRight size={14} className="text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Novo Broadcast */}
      <AdaptiveModal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        title="Novo Comunicado em Massa"
        width="600px"
      >
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <Radio className="text-blue-600 shrink-0" size={20} />
            <p className="text-xs text-blue-800 font-medium leading-relaxed">
              Esta mensagem será enviada instantaneamente para todos os contatos do segmento selecionado via WhatsApp oficial.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="label-sm">Título Interno (Para seu controle)</label>
              <input 
                className="input-field w-full" 
                placeholder="Ex: Comunicado 04/2024 - Uniformes"
                value={newBroadcast.titulo}
                onChange={e => setNewBroadcast({...newBroadcast, titulo: e.target.value})}
              />
            </div>

            <div>
              <label className="label-sm">Público Alvo (Segmento)</label>
              <select 
                className="input-field w-full"
                value={newBroadcast.segmento}
                onChange={e => setNewBroadcast({...newBroadcast, segmento: e.target.value})}
              >
                <option value="TODOS">Todos os Colaboradores</option>
                <option value="ENCARREGADOS">Apenas Encarregados</option>
                <option value="DIRETORES">Apenas Diretores (Secretarias)</option>
                <option value="RH_EXTERNO">Apenas RHs das Secretarias</option>
                <option value="CAMPO_OPERACIONAL">Apenas Nível 1 (Campo)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className="label-sm">Corpo da Mensagem (WhatsApp)</label>
                <span className="text-[10px] font-bold text-[var(--text-muted)]">{newBroadcast.mensagem.length} caracteres</span>
              </div>
              <textarea 
                className="input-field w-full min-h-[150px] py-4 leading-relaxed"
                placeholder="Olá {nome}, informamos que..."
                value={newBroadcast.mensagem}
                onChange={e => setNewBroadcast({...newBroadcast, mensagem: e.target.value})}
              />
              <p className="text-[9px] text-[var(--text-muted)] mt-2 italic">* Use {"{nome}"} para inserir o nome do colaborador automaticamente.</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded-lg border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]"
                checked={newBroadcast.agendado}
                onChange={e => setNewBroadcast({...newBroadcast, agendado: e.target.checked})}
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--text-primary)]">Agendar envio para depois?</p>
                <p className="text-[10px] text-[var(--text-muted)]">O n8n processará o disparo na data escolhida.</p>
              </div>
            </div>

            {newBroadcast.agendado && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="label-sm">Data e Hora do Disparo</label>
                <input 
                  type="datetime-local" 
                  className="input-field w-full"
                  value={newBroadcast.data_agendamento}
                  onChange={e => setNewBroadcast({...newBroadcast, data_agendamento: e.target.value})}
                />
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t border-[var(--border)] mt-4">
              <button className="flex-1 btn-ghost !h-14" onClick={() => setShowNew(false)}>Cancelar</button>
              <button 
                className="flex-[2] btn-brand !h-14 shadow-lg shadow-[var(--brand)]/20"
                onClick={handleSend}
                disabled={loading || !newBroadcast.mensagem || !newBroadcast.titulo}
              >
                {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                  <><Send size={18} className="mr-2" /> {newBroadcast.agendado ? "Agendar Disparo" : "Iniciar Transmissão"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}
