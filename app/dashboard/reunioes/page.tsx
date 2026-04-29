"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, Users, Video, MapPin, Send, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";

export default function ReunioesPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [agendamento, setAgendamento] = useState({
    titulo: "",
    data: "",
    hora: "",
    tipo: "PRESENCIAL", 
    local: "",
    participantes: [] as string[],
    pauta: ""
  });
  const [buscaParticipante, setBuscaParticipante] = useState("");
  const [reunioesProximas, setReunioesProximas] = useState<any[]>([
    { id: 1, titulo: "Alinhamento Mensal", data: "2026-04-28", hora: "09:00", local: "Sala VIP", status: "CONFIRMADO" },
    { id: 2, titulo: "Treinamento NR-35", data: "2026-04-29", hora: "14:00", local: "Google Meet", status: "PENDENTE" },
  ]);

  useEffect(() => {
    async function loadUsers() {
      const { data } = await supabase.from('usuarios').select('id, nome, cargo, telefone');
      setUsuarios(data || []);
    }
    loadUsers();
  }, []);

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Obter detalhes dos participantes (nomes e telefones para n8n)
    const detalhesParticipantes = usuarios.filter(u => agendamento.participantes.includes(u.id));
    
    try {
      // Disparar gatilho n8n para agendamento (Calendário + WhatsApp)
      await n8n.trigger('agendamento-reuniao', {
        ...agendamento,
        participantes_info: detalhesParticipantes.map(p => ({ nome: p.nome, telefone: p.telefone }))
      });

      setSuccess(true);
      setAgendamento({
        titulo: "",
        data: "",
        hora: "",
        tipo: "PRESENCIAL",
        local: "",
        participantes: [],
        pauta: ""
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert("Erro ao processar agendamento via n8n.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border)] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Calendar className="text-[var(--brand)]" /> Agendamento de Reuniões e Treinamentos
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 max-w-2xl">
            Organize briefings, treinamentos NR ou reuniões de diretoria. O sistema notificará automaticamente todos os participantes via WhatsApp e integrará ao Google Calendar da Alicerce.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)] opacity-5 blur-3xl -mr-32 -mt-32 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-3 bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border)]">
          <form onSubmit={handleAgendar} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Título da Reunião / Assunto</label>
                <input 
                  required
                  placeholder="Ex: Alinhamento Semanal - Unidade SEMSA"
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--brand)] outline-none transition-all"
                  value={agendamento.titulo}
                  onChange={e => setAgendamento({...agendamento, titulo: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Data</label>
                <input 
                  type="date"
                  required
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--brand)] outline-none transition-all"
                  value={agendamento.data}
                  onChange={e => setAgendamento({...agendamento, data: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Horário</label>
                <input 
                  type="time"
                  required
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--brand)] outline-none transition-all"
                  value={agendamento.hora}
                  onChange={e => setAgendamento({...agendamento, hora: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Tipo</label>
                <select 
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--brand)] outline-none transition-all"
                  value={agendamento.tipo}
                  onChange={e => setAgendamento({...agendamento, tipo: e.target.value})}
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="ONLINE">On-line (Google Meet)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Local / Link</label>
                <div className="relative">
                  {agendamento.tipo === 'PRESENCIAL' ? <MapPin size={16} className="absolute left-4 top-4 text-[var(--text-muted)]" /> : <Video size={16} className="absolute left-4 top-4 text-[var(--text-muted)]" />}
                  <input 
                    placeholder={agendamento.tipo === 'PRESENCIAL' ? "Ex: Sala de Reuniões 1" : "Será gerado automaticamente"}
                    disabled={agendamento.tipo === 'ONLINE'}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-12 py-3 text-[var(--text-primary)] focus:border-[var(--brand)] outline-none transition-all disabled:opacity-50"
                    value={agendamento.local}
                    onChange={e => setAgendamento({...agendamento, local: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Pauta e Objetivos</label>
              <textarea 
                rows={4}
                placeholder="Descreva o que será discutido..."
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--brand)] outline-none transition-all resize-none"
                value={agendamento.pauta}
                onChange={e => setAgendamento({...agendamento, pauta: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-brand py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg shadow-lg shadow-[var(--brand)]/20"
            >
              {loading ? "Processando Agendamento..." : <><Send size={20} /> Agendar Reunião</>}
            </button>

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3 text-green-500 animate-bounce">
                <CheckCircle2 size={20} /> Reunião agendada! O n8n está disparando os convites agora.
              </div>
            )}
          </form>
        </div>

        {/* Seleção de Participantes */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border)] flex flex-col">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-widest">
              <Users size={18} className="text-[var(--brand)]" /> Participantes
            </h2>
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                placeholder="Buscar por nome ou cargo..."
                className="input-field !pl-12 !h-12 !text-xs"
                value={buscaParticipante}
                onChange={e => setBuscaParticipante(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{agendamento.participantes.length} selecionados</span>
              <button className="text-[10px] font-bold text-[var(--brand)] uppercase" onClick={() => setAgendamento({...agendamento, participantes: []})}>Limpar tudo</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 max-h-[400px] custom-scrollbar">
            {usuarios.filter(u => 
              ((u.nome || "").toLowerCase().includes((buscaParticipante || "").toLowerCase()) || 
               (u.cargo || "").toLowerCase().includes((buscaParticipante || "").toLowerCase()))
            ).map(u => (
              <label 
                key={u.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${agendamento.participantes.includes(u.id) ? 'bg-[var(--brand)]/10 border-[var(--brand)]' : 'bg-[var(--bg-base)] border-[var(--border)] hover:border-[var(--text-muted)]'}`}
              >
                <input 
                  type="checkbox"
                  className="hidden"
                  checked={agendamento.participantes.includes(u.id)}
                  onChange={e => {
                    if (e.target.checked) {
                      setAgendamento({...agendamento, participantes: [...agendamento.participantes, u.id]});
                    } else {
                      setAgendamento({...agendamento, participantes: agendamento.participantes.filter(id => id !== u.id)});
                    }
                  }}
                />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${agendamento.participantes.includes(u.id) ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}>
                  {u.nome.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{u.nome}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">{u.cargo}</div>
                </div>
                {agendamento.participantes.includes(u.id) && <CheckCircle2 size={16} className="text-[var(--brand)]" />}
              </label>
            ))}
          </div>

          {/* Próximas Reuniões - Dashboard rápido */}
          <div className="mt-8 pt-8 border-t border-[var(--border)]">
            <h3 className="text-[0.65rem] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">Agenda da Semana</h3>
            <div className="flex flex-col gap-3">
              {reunioesProximas.map(r => (
                <div key={r.id} className="p-4 bg-[var(--bg-card-hover)]/10 rounded-2xl border border-[var(--border)] flex justify-between items-center group hover:border-[var(--brand)]/30 transition-all">
                  <div>
                    <div className="text-xs font-black text-[var(--text-primary)]">{r.titulo}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold">{r.data} • {r.hora} • {r.local}</div>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-lg ${r.status === 'CONFIRMADO' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
