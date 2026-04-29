"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, X, Save, AlertTriangle, Loader2, Calendar, Clock, Video, MapPin, Users, Search, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import { 
  GestaoHeader, 
  ControleRotas, 
  ListaMissoes, 
  FeedCampo 
} from "./components";

export default function GestaoEstrategicaPage() {
  const [rotas, setRotas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [missoes, setMissoes] = useState<any[]>([]);
  const [buscaMissoes, setBuscaMissoes] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalTarefa, setModalTarefa] = useState(false);
  const [modalRota, setModalRota] = useState(false);
  const [modalReuniao, setModalReuniao] = useState(false);
  const [rotaEditando, setRotaEditando] = useState<any>(null);
  const [buscaParticipante, setBuscaParticipante] = useState("");
  
  const [agendamento, setAgendamento] = useState({
    titulo: "",
    data: "",
    hora: "",
    tipo: "PRESENCIAL", 
    local: "",
    participantes: [] as string[],
    pauta: ""
  });
  
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: "",
    descricao: "",
    tipo: "OUTROS",
    status: "PENDENTE",
    data_limite: "",
    encarregado_id: ""
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [unidadesRes, usersRes, missionsRes] = await Promise.all([
        supabase.from('unidades').select('*'),
        supabase.from('usuarios').select('id, nome, cargo, telefone'),
        supabase.from('missoes_semanais').select('*, usuarios(nome)')
      ]);

      setRotas(unidadesRes.data || []);
      setUsuarios(usersRes.data || []);
      setMissoes(missionsRes.data || []);
    } catch (error) {
      console.error("Erro ao sincronizar dados operacionais:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Otimização: Lista de missões filtrada com useMemo
  const missoesFiltradas = useMemo(() => {
    return missoes.filter(m => 
      (m.titulo || "").toLowerCase().includes((buscaMissoes || "").toLowerCase()) || 
      (m.usuarios?.nome || "").toLowerCase().includes((buscaMissoes || "").toLowerCase()) ||
      (m.descricao || "").toLowerCase().includes((buscaMissoes || "").toLowerCase())
    );
  }, [missoes, buscaMissoes]);

  const handleCriarTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: inserted, error } = await supabase.from('missoes_semanais').insert([novaTarefa]).select();
    
    if (error) {
      alert("Falha no registro da missão: " + error.message);
    } else {
      const responsavel = usuarios.find(u => u.id === novaTarefa.encarregado_id);
      if (responsavel?.telefone) {
        await n8n.trigger('nova-missao-campo', {
          missao_id: inserted[0].id,
          titulo: novaTarefa.titulo,
          telefone: responsavel.telefone
        });
      }
      setModalTarefa(false);
      loadData();
      alert("Missão enviada com sucesso ao campo.");
    }
    setLoading(false);
  };
  const handleAgendarReuniao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const detalhesParticipantes = usuarios.filter(u => agendamento.participantes.includes(u.id));
    try {
      await n8n.trigger('agendamento-reuniao', {
        ...agendamento,
        participantes_info: detalhesParticipantes.map(p => ({ nome: p.nome, telefone: p.telefone }))
      });
      alert("Reunião agendada com sucesso via n8n.");
      setModalReuniao(false);
      setAgendamento({ titulo: "", data: "", hora: "", tipo: "PRESENCIAL", local: "", participantes: [], pauta: "" });
    } catch (err) {
      alert("Erro ao processar agendamento.");
    }
    setLoading(false);
  };

  if (loading && missoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[var(--brand)]" size={40} />
        <p className="text-[var(--text-muted)] font-black uppercase text-[10px] tracking-widest">Sincronizando Inteligência Estratégica...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 animate-fade-in">
      <GestaoHeader 
        onNewTask={() => setModalTarefa(true)} 
        onNewMeeting={() => setModalReuniao(true)} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 flex flex-col gap-12">
          <ControleRotas 
            rotas={rotas} 
            onEdit={(rota) => { setRotaEditando({...rota, novo_id: ""}); setModalRota(true); }} 
          />
          
          <ListaMissoes 
            missoes={missoesFiltradas} 
            busca={buscaMissoes} 
            onBusca={setBuscaMissoes} 
          />
        </div>

        <div className="flex flex-col h-full gap-12">
          <FeedCampo />
        </div>
      </div>

      {/* Modal: Nova Missão */}
      {modalTarefa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="card w-full max-w-lg p-8 shadow-2xl animate-fade-in border-t-4 border-t-[var(--brand)]">
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Lançar Missão Operacional</h2>
            <form onSubmit={handleCriarTarefa} className="flex flex-col gap-5">
              <div>
                <label className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-2 block">Título da Missão</label>
                <input required className="input-field w-full" placeholder="Ex: Auditoria de EPIs" value={novaTarefa.titulo} onChange={e => setNovaTarefa({...novaTarefa, titulo: e.target.value})} />
              </div>
              <div>
                <label className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-2 block">Diretrizes</label>
                <textarea className="input-field w-full min-h-[100px] resize-none" placeholder="Detalhes para o executor..." value={novaTarefa.descricao} onChange={e => setNovaTarefa({...novaTarefa, descricao: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-2 block">Data Limite</label>
                  <input type="date" required className="input-field w-full" value={novaTarefa.data_limite} onChange={e => setNovaTarefa({...novaTarefa, data_limite: e.target.value})} />
                </div>
                <div>
                  <label className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-2 block">Responsável</label>
                  <select required className="input-field w-full" value={novaTarefa.encarregado_id} onChange={e => setNovaTarefa({...novaTarefa, encarregado_id: e.target.value})}>
                    <option value="">Selecionar...</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" className="flex-1 btn-ghost" onClick={() => setModalTarefa(false)}>Cancelar</button>
                <button type="submit" className="flex-1 btn-brand" disabled={loading}>{loading ? "Registrando..." : "Confirmar Envio"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Troca de Encarregado */}
      {modalRota && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="card w-full max-w-md p-8 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Reatribuir Rota</h2>
            <p className="text-[0.8rem] font-medium text-[var(--text-muted)] mb-6">Alterando supervisão da unidade: <span className="text-[var(--brand)] font-black">{rotaEditando?.nome}</span></p>
            <div className="space-y-4">
              <select className="input-field w-full" value={rotaEditando?.novo_id} onChange={e => setRotaEditando({...rotaEditando, novo_id: e.target.value})}>
                <option value="">Selecione o Novo Supervisor...</option>
                {usuarios.filter(u => u.cargo === 'ENCARREGADO' || u.cargo === 'GERENTE').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <div className="flex gap-4 mt-6">
                <button className="flex-1 btn-ghost" onClick={() => setModalRota(false)}>Cancelar</button>
                <button className="flex-1 btn-brand" onClick={async () => {
                  const resp = usuarios.find(u => u.id === rotaEditando.novo_id);
                  if (!resp) return;
                  await supabase.from('unidades').update({ encarregado_nome: resp.nome }).eq('id', rotaEditando.id);
                  loadData();
                  setModalRota(false);
                }}>Confirmar Troca</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Agendar Reunião (Migrado) */}
      {modalReuniao && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col !p-0 shadow-2xl animate-scale-in">
            <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card-hover)]/10">
              <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-widest">
                <Calendar className="text-[var(--brand)]" /> Central de Agendamento
              </h2>
              <button onClick={() => setModalReuniao(false)} className="p-2 hover:bg-[var(--bg-base)] rounded-xl transition-colors"><X /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <form id="form-reuniao" onSubmit={handleAgendarReuniao} className="flex flex-col gap-6">
                <div>
                  <label className="label-sm">Título / Assunto</label>
                  <input required className="input-field" value={agendamento.titulo} onChange={e => setAgendamento({...agendamento, titulo: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-sm">Data</label>
                    <input type="date" required className="input-field" value={agendamento.data} onChange={e => setAgendamento({...agendamento, data: e.target.value})} />
                  </div>
                  <div>
                    <label className="label-sm">Hora</label>
                    <input type="time" required className="input-field" value={agendamento.hora} onChange={e => setAgendamento({...agendamento, hora: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-sm">Tipo</label>
                    <select className="input-field" value={agendamento.tipo} onChange={e => setAgendamento({...agendamento, tipo: e.target.value})}>
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="ONLINE">On-line</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-sm">Local / Link</label>
                    <input className="input-field" value={agendamento.local} disabled={agendamento.tipo === 'ONLINE'} onChange={e => setAgendamento({...agendamento, local: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="label-sm">Pauta</label>
                  <textarea rows={3} className="input-field" value={agendamento.pauta} onChange={e => setAgendamento({...agendamento, pauta: e.target.value})} />
                </div>
              </form>

              <div className="flex flex-col gap-4">
                <label className="label-sm">Convidar Participantes</label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input placeholder="Buscar..." className="input-field !pl-12 !h-10 !text-xs" value={buscaParticipante} onChange={e => setBuscaParticipante(e.target.value)} />
                </div>
                <div className="flex-1 overflow-y-auto max-h-[300px] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-2 custom-scrollbar">
                  {usuarios.filter(u => (u.nome || "").toLowerCase().includes((buscaParticipante || "").toLowerCase())).map(u => (
                    <label key={u.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${agendamento.participantes.includes(u.id) ? 'bg-[var(--brand)]/10 border-[var(--brand)]' : 'bg-[var(--bg-base)] border-[var(--border)]'}`}>
                      <input type="checkbox" className="hidden" checked={agendamento.participantes.includes(u.id)} onChange={e => {
                        setAgendamento({...agendamento, participantes: e.target.checked ? [...agendamento.participantes, u.id] : agendamento.participantes.filter(id => id !== u.id)});
                      }} />
                      <div className="text-xs font-bold flex-1">{u.nome}</div>
                      {agendamento.participantes.includes(u.id) && <CheckCircle2 size={14} className="text-[var(--brand)]" />}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-[var(--border)] flex justify-end gap-4 bg-[var(--bg-base)]/50">
              <button className="btn-ghost" onClick={() => setModalReuniao(false)}>Cancelar</button>
              <button form="form-reuniao" className="btn-brand !px-12" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Agendar Agora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
