"use client";
import { useState, useEffect } from "react";
import { 
  Users, Activity, ShieldCheck, AlertTriangle, 
  Clock, Package, MapPin, Search, Filter,
  CheckCircle, ArrowUpRight, Building2, User, UserPlus, Edit3,
  Settings, Save, Lock, LogOut
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function EncarregadoModule({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"MY_UNITS" | "MY_COLABS" | "QUICK_ADMISSION" | "ATTENDANCE" | "TICKETS">("MY_UNITS");
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [fullUnits, setFullUnits] = useState<any[]>([]);
  const [myColabs, setMyColabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [admissao, setAdmissao] = useState({ 
    nome: '', telefone: '', unidade: '', secretaria: '', cargo: 'AUXILIAR DE SERVIÇOS GERAIS',
    insalubridade: 'N/A', carga_horaria: '12X36', periodo: 'DIURNO',
    horario_entrada: '07:00', horario_saida: '19:00',
    escala_tipo: 'IMPAR', data_referencia: new Date().toISOString().split('T')[0]
  });
  const [editandoColab, setEditandoColab] = useState<any>(null);
  const [justificativa, setJustificativa] = useState("");
  const [filtroUnidadeOcorrencia, setFiltroUnidadeOcorrencia] = useState("");
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      fetchEncarregadoData();
    }
  }, [user]);

  const fetchEncarregadoData = async () => {
    setLoading(true);
    try {
      // 1. Buscar unidades sob responsabilidade deste encarregado
      const { data: units } = await supabase
        .from('unidades')
        .select('nome')
        .eq('encarregado_id', user.id);

      const unitNames = units?.map(u => u.nome) || [];
      setMyUnits(unitNames);

      // Buscar detalhes das unidades (incluindo secretaria)
      if (unitNames.length > 0) {
        const { data: unitsDetail } = await supabase.from('unidades').select('*').in('nome', unitNames);
        setFullUnits(unitsDetail || []);
      }

      // 2. Buscar colaboradores alocados nessas unidades
      if (unitNames.length > 0) {
        const { data: colabs } = await supabase
          .from('usuarios')
          .select('*')
          .in('unidade_alocacao', unitNames);
        setMyColabs(colabs || []);
      }

      // 3. Buscar ocorrências das minhas unidades
      if (unitNames.length > 0) {
        const { data: tickets } = await supabase
          .from('tickets_sla')
          .select('*')
          .in('unidade', unitNames)
          .order('criado_em', { ascending: false });
        setOcorrencias(tickets || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do encarregado:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderMyUnits = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="kpi-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Minhas Unidades</p>
          <h4 className="text-3xl font-black text-[var(--text-primary)]">{myUnits.length}</h4>
        </div>
        <div className="kpi-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Meus Colaboradores</p>
          <h4 className="text-3xl font-black text-[var(--text-primary)]">{myColabs.length}</h4>
        </div>
        <div className="kpi-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Média p/ Rota</p>
          <h4 className="text-3xl font-black text-[var(--neon-blue)]">{myUnits.length > 0 ? (myColabs.length / myUnits.length).toFixed(1) : 0}</h4>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Unidades Sob Minha Responsabilidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myUnits.map((unit, i) => (
            <button 
              key={i} 
              onClick={() => {
                setFiltroUnidadeOcorrencia(unit);
                setActiveTab("TICKETS");
              }}
              className="p-6 bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl flex items-center gap-4 hover:border-[var(--brand)] hover:scale-[1.02] active:scale-[0.98] transition-all text-left w-full group"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white transition-all">
                <Building2 size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-[var(--text-primary)] uppercase">{unit}</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{myColabs.filter(c => c.unidade_alocacao === unit).length} Colaboradores</p>
              </div>
              <ArrowUpRight size={18} className="text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-all" />
            </button>
          ))}
          {myUnits.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-50">
               <MapPin size={48} className="mx-auto mb-4" />
               <p className="text-xs font-black uppercase tracking-widest">Nenhuma unidade vinculada ao seu perfil.</p>
               <p className="text-[10px] font-bold mt-2 uppercase">Contate a gerência para definir suas rotas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMyColabs = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
       <div className="card">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Lista de Colaboradores (Minha Equipe)</h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                 <input 
                   type="text" 
                   placeholder="BUSCAR NA EQUIPE..." 
                   className="input-field !h-9 !pl-10 !text-[10px] w-64" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="border-b border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                   <tr>
                      <th className="p-6">Colaborador</th>
                      <th className="p-6">Cargo / Unidade</th>
                      <th className="p-6">Jornada / Escala</th>
                      <th className="p-6 text-center">Insalubridade</th>
                      <th className="p-6 text-center">Status</th>
                      <th className="p-6 text-right">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                   {myColabs
                    .filter(c => 
                      c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      c.cpf?.includes(searchTerm)
                    )
                    .map((colab, i) => (
                     <tr key={i} className="hover:bg-[var(--bg-base)]/50 transition-colors group cursor-pointer" onClick={() => setEditandoColab(colab)}>
                        <td className="p-6">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center text-sm font-black shadow-lg shadow-[var(--brand)]/20">
                                 {colab.nome?.charAt(0)}
                              </div>
                              <span className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{colab.nome}</span>
                           </div>
                        </td>
                        <td className="p-6">
                           <div className="text-xs font-black text-[var(--text-secondary)]">{colab.cargo || 'OPERACIONAL'}</div>
                           <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">{colab.unidade_alocacao}</div>
                        </td>
                        <td className="p-6">
                           <div className="text-xs font-bold text-[var(--text-primary)]">{colab.carga_horaria || '---'} ({colab.horario_entrada || '07:00'}-{colab.horario_saida || '19:00'})</div>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] text-blue-600 font-black uppercase">{colab.escala_tipo || 'DIARIO'}</span>
                              <span className={`text-[8px] font-black uppercase px-1.5 rounded ${colab.periodo === 'NOTURNO' ? 'bg-indigo-100 text-indigo-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                 {colab.periodo || 'DIURNO'}
                              </span>
                           </div>
                        </td>
                        <td className="p-6 text-center">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${colab.insalubridade === '40%' ? 'bg-red-100 text-red-700' : colab.insalubridade === '20%' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                              {colab.insalubridade || 'N/A'}
                           </span>
                        </td>
                        <td className="p-6 text-center">
                           <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${colab.status === 'ATIVO' ? 'bg-green-100 text-green-700' : colab.status === 'AFASTADO' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                              {colab.status}
                           </span>
                        </td>
                        <td className="p-6 text-right">
                           <button className="p-3 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-xl group-hover:text-[var(--brand)] group-hover:bg-white transition-all">
                             <Edit3 size={18} />
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const handleSalvarEdicao = async () => {
    if (!justificativa || justificativa.length < 10) {
      alert("Por favor, forneça uma justificativa detalhada (mínimo 10 caracteres).");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('usuarios').update({
      nome: editandoColab.nome,
      telefone: editandoColab.telefone,
      cpf: editandoColab.cpf,
      cargo: editandoColab.cargo,
      status: editandoColab.status,
      unidade_alocacao: editandoColab.unidade_alocacao,
      secretaria: fullUnits.find(u => u.nome === editandoColab.unidade_alocacao)?.secretaria || editandoColab.secretaria,
      insalubridade: editandoColab.insalubridade,
      carga_horaria: editandoColab.carga_horaria,
      periodo: editandoColab.periodo,
      horario_entrada: editandoColab.horario_entrada,
      horario_saida: editandoColab.horario_saida,
      escala_tipo: editandoColab.escala_tipo,
      data_referencia_escala: editandoColab.data_referencia_escala,
      justificativa_alteracao: justificativa,
      editado_por: user.nome,
      data_ultima_alteracao: new Date().toISOString()
    }).eq('id', editandoColab.id);

    if (!error) {
      alert("Cadastro atualizado com sucesso!");
      setEditandoColab(null);
      setJustificativa("");
      fetchEncarregadoData();
    } else {
      alert("Erro ao atualizar: " + error.message);
    }
    setSaving(false);
  };

  const renderTickets = () => {
    const filtered = filtroUnidadeOcorrencia 
      ? ocorrencias.filter(o => o.unidade === filtroUnidadeOcorrencia)
      : ocorrencias;

    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Gestão de Ocorrências</h3>
            {filtroUnidadeOcorrencia && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-[var(--brand)]/10 text-[var(--brand)] text-[9px] font-black uppercase rounded-lg">Filtro: {filtroUnidadeOcorrencia}</span>
                <button onClick={() => setFiltroUnidadeOcorrencia("")} className="text-[9px] font-bold text-red-500 hover:underline uppercase">Limpar Filtro</button>
              </div>
            )}
          </div>
          <div className="text-[10px] font-black text-[var(--text-muted)] uppercase bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border)]">
            Total: {filtered.length} Demandas
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filtered.map((ticket, i) => (
            <div key={i} className="card !p-0 overflow-hidden border-l-4 border-l-[var(--brand)]">
              <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ticket.prioridade === 'ALTA' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest">{ticket.protocolo}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ticket.status === 'ABERTO' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>{ticket.status}</span>
                    </div>
                    <h4 className="text-sm font-black text-[var(--text-primary)] uppercase">{ticket.assunto}</h4>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">{ticket.unidade} • {ticket.secretaria}</p>
                  </div>
                </div>
                <div className="flex flex-col md:items-end justify-between gap-2">
                  <div className="text-[10px] font-black text-[var(--text-muted)] uppercase">Aberto em: {new Date(ticket.criado_em).toLocaleDateString()}</div>
                  <button className="px-6 py-2 bg-[var(--bg-base)] hover:bg-[var(--brand)] hover:text-white rounded-xl text-[9px] font-black uppercase transition-all">Ver Detalhes</button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-20 text-center bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)]">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-20" />
              <p className="text-xs font-black uppercase text-[var(--text-muted)]">Nenhuma ocorrência encontrada para esta seleção.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSalvarAdmissao = async () => {
    if (!admissao.nome || !admissao.telefone || !admissao.unidade) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('usuarios').insert([{
      nome: admissao.nome,
      telefone: admissao.telefone,
      unidade_alocacao: admissao.unidade,
      secretaria: admissao.secretaria,
      status: 'ATIVO',
      role: 'COLABORADOR',
      cargo: admissao.cargo,
      nivel: 1,
      insalubridade: admissao.insalubridade,
      carga_horaria: admissao.carga_horaria,
      periodo: admissao.periodo,
      horario_entrada: admissao.horario_entrada,
      horario_saida: admissao.horario_saida,
      escala_tipo: admissao.escala_tipo,
      data_referencia_escala: admissao.data_referencia,
      criado_por: user.nome
    }]);

    if (!error) {
      alert("Colaborador cadastrado e ATIVO no sistema!");
      setAdmissao({ nome: '', telefone: '', unidade: '', secretaria: '' });
      fetchEncarregadoData();
      setActiveTab("MY_COLABS");
    } else {
      alert("Erro ao cadastrar: " + error.message);
    }
    setSaving(false);
  };

  const renderQuickAdmission = () => (
    <div className="flex flex-col gap-8 animate-fade-in max-w-2xl mx-auto">
      <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase italic">Admissão Rápida</h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Povoamento imediato da base operacional</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Nome Completo</label>
              <input 
                className="input-field w-full !h-14 font-bold" 
                placeholder="Ex: João da Silva Santos" 
                value={admissao.nome}
                onChange={e => setAdmissao({...admissao, nome: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Cargo / Função</label>
              <input 
                className="input-field w-full !h-14 font-bold" 
                placeholder="Ex: PORTEIRO" 
                value={admissao.cargo}
                onChange={e => setAdmissao({...admissao, cargo: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Telefone / WhatsApp</label>
              <input 
                className="input-field w-full !h-14 font-bold" 
                placeholder="(00) 00000-0000" 
                value={admissao.telefone}
                onChange={e => setAdmissao({...admissao, telefone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Unidade de Alocação</label>
              <select 
                className="input-field w-full !h-14 font-bold"
                value={admissao.unidade}
                onChange={e => {
                  const unit = fullUnits.find(u => u.nome === e.target.value);
                  setAdmissao({
                    ...admissao, 
                    unidade: e.target.value,
                    secretaria: unit?.secretaria || 'SEMED' 
                  });
                }}
              >
                <option value="">Selecione o Posto...</option>
                {myUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[var(--bg-base)]/30 rounded-2xl border border-[var(--border)]">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Carga / Período</label>
              <div className="flex gap-2">
                <select 
                  className="input-field flex-1 !h-12 font-bold"
                  value={admissao.carga_horaria}
                  onChange={e => setAdmissao({...admissao, carga_horaria: e.target.value})}
                >
                  <option value="12X36">12X36</option>
                  <option value="44H">44H (SEM)</option>
                </select>
                <select 
                  className="input-field flex-1 !h-12 font-bold"
                  value={admissao.periodo}
                  onChange={e => setAdmissao({...admissao, periodo: e.target.value})}
                >
                  <option value="DIURNO">DIURNO</option>
                  <option value="NOTURNO">NOTURNO</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Escala / Insalubridade</label>
              <div className="flex gap-2">
                <select 
                  className="input-field flex-1 !h-12 font-bold"
                  value={admissao.escala_tipo}
                  onChange={e => setAdmissao({...admissao, escala_tipo: e.target.value})}
                >
                  <option value="PAR">ESCALA PAR</option>
                  <option value="IMPAR">ESCALA ÍMPAR</option>
                </select>
                <select 
                  className="input-field flex-1 !h-12 font-bold"
                  value={admissao.insalubridade}
                  onChange={e => setAdmissao({...admissao, insalubridade: e.target.value})}
                >
                  <option value="N/A">N/A</option>
                  <option value="20%">20%</option>
                  <option value="40%">40%</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Secretaria Detectada</p>
                <p className="text-sm font-black text-[var(--brand)]">{admissao.secretaria || "Aguardando Unidade..."}</p>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Entrada / Saída</p>
                 <p className="text-sm font-black text-[var(--text-primary)]">{admissao.horario_entrada} às {admissao.horario_saida}</p>
              </div>
            </div>
            {admissao.carga_horaria === '12X36' && (
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                 <p className="text-[9px] font-black text-blue-600 uppercase">Cálculo de Alternância Ativo (Evita erro dia 31/01)</p>
                 <input 
                  type="date" 
                  className="bg-transparent text-[10px] font-black uppercase outline-none" 
                  value={admissao.data_referencia}
                  onChange={e => setAdmissao({...admissao, data_referencia: e.target.value})}
                />
              </div>
            )}
          </div>

          <button 
            className="btn-brand w-full !h-16 shadow-xl shadow-[var(--brand)]/20"
            onClick={handleSalvarAdmissao}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Finalizar Admissão e Ativar"}
          </button>
        </div>
      </div>

      <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
        <Activity className="text-blue-500 shrink-0" size={20} />
        <p className="text-[10px] font-bold text-blue-700/70 uppercase leading-relaxed">
          Atenção Encarregado: Este cadastro é simplificado para agilizar o povoamento. O RH será notificado para complementar a documentação técnica (CPF, RG, CTPS) posteriormente.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      
      {/* Navegação Superior do Encarregado */}
      <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] shadow-sm sticky top-0 z-30 backdrop-blur-md overflow-x-auto custom-scrollbar">
         {[
           { id: "MY_UNITS", label: "Minhas Unidades", icon: Building2 },
           { id: "MY_COLABS", label: "Minha Equipe", icon: Users },
           { id: "QUICK_ADMISSION", label: "Admissão Rápida", icon: UserPlus },
           { id: "ATTENDANCE", label: "Gestão de Ponto", icon: Clock },
           { id: "TICKETS", label: "Ocorrências", icon: AlertTriangle },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[0.7rem] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
           <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Carregando mapa operacional...</p>
        </div>
      ) : (
        <div className="flex-1">
           {activeTab === "MY_UNITS" && renderMyUnits()}
           {activeTab === "MY_COLABS" && renderMyColabs()}
           {activeTab === "QUICK_ADMISSION" && renderQuickAdmission()}
           {activeTab === "ATTENDANCE" && (
              <div className="card py-20 text-center">
                 <Clock size={48} className="mx-auto mb-4 opacity-20" />
                 <h3 className="text-lg font-black text-[var(--text-primary)] uppercase">Módulo de Ponto em Sincronização</h3>
                 <p className="text-xs font-medium text-[var(--text-muted)] mt-2">Aguardando espelhamento da base biométrica.</p>
              </div>
           )}
           {activeTab === "TICKETS" && renderTickets()}
        </div>
      )}

      {/* MODAL DE EDIÇÃO COM JUSTIFICATIVA */}
      <AdaptiveModal 
        isOpen={!!editandoColab} 
        onClose={() => { setEditandoColab(null); setJustificativa(""); }}
        title={`Alterar Cadastro: ${editandoColab?.nome}`}
        width="500px"
      >
        <div className="p-10 space-y-6">
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
            <ShieldCheck className="text-amber-600 shrink-0" size={24}/>
            <div>
              <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Alteração de Cadastro</p>
              <p className="text-[10px] font-bold text-amber-700 mt-1 uppercase">Toda alteração realizada pelo encarregado exige uma justificativa para auditoria do RH.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">CPF</label>
              <input 
                className="input-field w-full font-bold" 
                value={editandoColab?.cpf || ''} 
                onChange={e => setEditandoColab({...editandoColab, cpf: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Telefone</label>
              <input 
                className="input-field w-full font-bold" 
                value={editandoColab?.telefone || ''} 
                onChange={e => setEditandoColab({...editandoColab, telefone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Cargo</label>
              <input 
                className="input-field w-full font-bold" 
                value={editandoColab?.cargo || ''} 
                onChange={e => setEditandoColab({...editandoColab, cargo: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Status</label>
              <select 
                className="input-field w-full font-bold"
                value={editandoColab?.status || ''}
                onChange={e => setEditandoColab({...editandoColab, status: e.target.value})}
              >
                <option value="ATIVO">ATIVO</option>
                <option value="AFASTADO">AFASTADO</option>
                <option value="INATIVO">INATIVO</option>
                <option value="DESLIGADO">DESLIGADO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Carga / Horário</label>
              <select 
                className="input-field w-full font-bold mb-2 h-10"
                value={editandoColab?.carga_horaria || ''}
                onChange={e => setEditandoColab({...editandoColab, carga_horaria: e.target.value})}
              >
                <option value="12X36">12X36</option>
                <option value="44H">44H (SEMANAL)</option>
              </select>
              <div className="flex gap-2">
                <input type="time" className="input-field flex-1 !h-8 text-[10px]" value={editandoColab?.horario_entrada || ''} onChange={e => setEditandoColab({...editandoColab, horario_entrada: e.target.value})} />
                <input type="time" className="input-field flex-1 !h-8 text-[10px]" value={editandoColab?.horario_saida || ''} onChange={e => setEditandoColab({...editandoColab, horario_saida: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Escala / Período</label>
              <select 
                className="input-field w-full font-bold mb-2 h-10"
                value={editandoColab?.escala_tipo || ''}
                onChange={e => setEditandoColab({...editandoColab, escala_tipo: e.target.value})}
              >
                <option value="PAR">PAR</option>
                <option value="IMPAR">ÍMPAR</option>
                <option value="DIARIO">DIÁRIO</option>
              </select>
              <select 
                className="input-field w-full font-bold h-10"
                value={editandoColab?.periodo || 'DIURNO'}
                onChange={e => setEditandoColab({...editandoColab, periodo: e.target.value})}
              >
                <option value="DIURNO">DIURNO</option>
                <option value="NOTURNO">NOTURNO</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Insalubridade</label>
              <select 
                className="input-field w-full font-bold h-10"
                value={editandoColab?.insalubridade || ''}
                onChange={e => setEditandoColab({...editandoColab, insalubridade: e.target.value})}
              >
                <option value="N/A">SEM</option>
                <option value="20%">20%</option>
                <option value="40%">40%</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Unidade de Alocação</label>
              <select 
                className="input-field w-full font-bold"
                value={editandoColab?.unidade_alocacao || ''}
                onChange={e => setEditandoColab({...editandoColab, unidade_alocacao: e.target.value})}
              >
                {myUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {editandoColab?.carga_horaria === '12X36' && (
              <div>
                <label className="text-[10px] font-black uppercase text-blue-500 mb-2 block">Data de Referência (Cálculo Escala)</label>
                <input 
                  type="date" 
                  className="input-field w-full font-bold" 
                  value={editandoColab?.data_referencia_escala || ''}
                  onChange={e => setEditandoColab({...editandoColab, data_referencia_escala: e.target.value})}
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-black uppercase text-red-500 mb-2 block font-black">Justificativa da Alteração (Obrigatório)</label>
              <textarea 
                className="input-field w-full min-h-[100px] py-4 font-bold !text-xs" 
                placeholder="Ex: Erro de digitação no nome / Mudança de telefone / Transferência de posto autorizada..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleSalvarEdicao}
            className="w-full h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Confirmar Alteração"}
          </button>
        </div>
      </AdaptiveModal>

    </div>
  );
}
