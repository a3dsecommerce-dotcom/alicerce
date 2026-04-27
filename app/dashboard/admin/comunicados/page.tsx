"use client";
import { useState, useEffect } from "react";
import { Megaphone, Send, Users, ShieldAlert, History, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";

export default function ComunicadosPage() {
  const [target, setTarget] = useState("TODOS"); // TODOS, ENCARREGADOS, RH, ESPECIFICO
  const [mensagem, setMensagem] = useState("");
  const [prioridade, setPrioridade] = useState("NORMAL"); // NORMAL, ALTA, URGENTE
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, encarregados: 0 });

  useEffect(() => {
    async function loadStats() {
      const { count: total } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
      const { count: enc } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('cargo', 'ENCARREGADO');
      setStats({ totalUsers: total || 0, encarregados: enc || 0 });
    }
    loadStats();
  }, []);

  const handleDisparar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Confirmar envio de comunicado em massa para ${target}? Esta ação não pode ser desfeita.`)) return;
    
    setLoading(true);
    try {
      await n8n.trigger('comunicado-massa', {
        target,
        mensagem,
        prioridade,
        data_envio: new Date().toISOString(),
        enviado_por: "Diretoria/Admin"
      });
      
      setSuccess(true);
      setMensagem("");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert("Erro ao disparar comunicado via n8n.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-400 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Megaphone size={28} /> Central de Comunicados em Massa
          </h1>
          <p className="opacity-90 mt-2 max-w-2xl">
            Envie avisos, atualizações de normas ou alertas de segurança diretamente para o WhatsApp de toda a força de trabalho ou grupos específicos.
          </p>
        </div>
        <Megaphone className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12" size={200} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Disparo */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
          <form onSubmit={handleDisparar} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Público Alvo</label>
                <select 
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-orange-500 outline-none transition-all"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                >
                  <option value="TODOS">Todos os Colaboradores ({stats.totalUsers})</option>
                  <option value="ENCARREGADOS">Apenas Encarregados ({stats.encarregados})</option>
                  <option value="GERENCIA">Gerência e RH</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Nível de Prioridade</label>
                <select 
                  className={`w-full border rounded-xl px-4 py-3 outline-none transition-all font-bold ${prioridade === 'URGENTE' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-primary)]'}`}
                  value={prioridade}
                  onChange={e => setPrioridade(e.target.value)}
                >
                  <option value="NORMAL">Normal (Informativo)</option>
                  <option value="ALTA">Alta (Importante)</option>
                  <option value="URGENTE">Urgente (Ação Necessária)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">Corpo da Mensagem (WhatsApp)</label>
              <textarea 
                required
                rows={6}
                placeholder="Escreva aqui a mensagem que será enviada..."
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-orange-500 outline-none transition-all resize-none"
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-2">Dica: Use *texto* para negrito e _texto_ para itálico no WhatsApp.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading || !mensagem}
              className="bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg shadow-lg shadow-orange-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? "Processando Envio em Massa..." : <><Send size={20} /> Disparar Comunicado</>}
            </button>

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3 text-green-500 animate-fade-in">
                <CheckCircle2 size={20} /> Fila de disparo criada com sucesso! O n8n processará o envio em lotes.
              </div>
            )}
          </form>
        </div>

        {/* Info e Histórico */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <ShieldAlert size={16} className="text-orange-500" /> Regras de Uso
            </h2>
            <ul className="text-xs text-[var(--text-secondary)] space-y-3">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                Evite disparos fora do horário comercial para mensagens não urgentes.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                Mensagens urgentes ignoram o "Modo Silencioso" dos colaboradores.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                O n8n limita o envio a 20 mensagens por minuto para evitar spam.
              </li>
            </ul>
          </div>

          <div className="bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border)] flex-1">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <History size={16} className="text-[var(--text-muted)]" /> Últimos Disparos
            </h2>
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                  <span>Ontem, 14:00</span>
                  <span className="text-green-500 font-bold">CONCLUÍDO</span>
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] mb-1">Novo Procedimento EPI</div>
                <div className="text-[10px] text-[var(--text-muted)]">Alvo: Encarregados</div>
              </div>
              <div className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                  <span>22 Abr, 09:30</span>
                  <span className="text-green-500 font-bold">CONCLUÍDO</span>
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] mb-1">Feliz Aniversário Alicerce</div>
                <div className="text-[10px] text-[var(--text-muted)]">Alvo: Todos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
