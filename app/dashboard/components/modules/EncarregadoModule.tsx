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
import FichaColaborador360 from "../FichaColaborador360";

export default function EncarregadoModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<"MY_UNITS" | "MY_COLABS" | "QUICK_ADMISSION" | "ATTENDANCE" | "TICKETS">(() => {
    if (!initialTab) return "MY_UNITS";
    const t = initialTab.toUpperCase();
    if (t === "VISAO" || t === "UNIDADES") return "MY_UNITS";
    if (t === "EQUIPE" || t === "COLABS") return "MY_COLABS";
    if (t === "ADMISSAO" || t === "CADASTRO") return "QUICK_ADMISSION";
    if (t === "PONTO") return "ATTENDANCE";
    if (t === "TICKETS" || t === "OCORRENCIAS") return "TICKETS";
    return "MY_UNITS";
  });
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [fullUnits, setFullUnits] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [myColabs, setMyColabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [admissao, setAdmissao] = useState<any>({ 
    nome: '', telefone: '', unidade: '', secretaria: '', cargo: '',
    insalubridade: 'N/A', carga_horaria: '44H', periodo: 'DIURNO',
    horario_entrada: '07:00', horario_saida: '17:00',
    escala_tipo: 'DIARIO', data_referencia: new Date().toISOString().split('T')[0],
    salario_base: 0, valor_alimentacao: 0, valor_vale_transporte: 0
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

      // 4. Buscar Cargos Mestres
      const { data: cargosDb } = await supabase.from('cargos').select('*').order('nome');
      if (cargosDb) setCargos(cargosDb);

    } catch (err) {
      console.error("Erro ao carregar dados do encarregado:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderMyUnits = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="kpi-card bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] overflow-hidden">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Minhas Unidades</p>
          <h4 className="text-4xl font-black text-[var(--text-primary)] px-1">{myUnits.length}</h4>
        </div>
        <div className="kpi-card bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] overflow-hidden">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Meus Colaboradores</p>
          <h4 className="text-4xl font-black text-[var(--text-primary)] px-1">{myColabs.length}</h4>
        </div>
        <div className="kpi-card bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] overflow-hidden">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Média p/ Rota</p>
          <h4 className="text-4xl font-black text-[var(--neon-blue)] px-1">{myUnits.length > 0 ? (myColabs.length / myUnits.length).toFixed(1) : 0}</h4>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1 italic">Povoamento Operacional</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Cadastre colaboradores diretamente nas suas unidades de rota</p>
        </div>
        <button 
          onClick={() => setActiveTab("QUICK_ADMISSION")}
          className="px-10 py-4 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[var(--brand)]/20 flex items-center gap-3"
        >
          <UserPlus size={18} /> Admissão Rápida
        </button>
      </div>

      <div className="card">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Unidades Sob Minha Responsabilidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myUnits.map((unit, i) => (
            <div 
              key={i} 
              className="p-8 bg-[var(--bg-base)] border border-[var(--border)] rounded-3xl flex flex-col gap-6 hover:border-[var(--brand)] transition-all group overflow-hidden"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white transition-all shrink-0">
                  <Building2 size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[var(--text-primary)] uppercase truncate mb-1">{unit}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">{myColabs.filter(c => c.unidade_alocacao === unit).length} Colaboradores</p>
                </div>
                <button 
                  onClick={() => { setFiltroUnidadeOcorrencia(unit); setActiveTab("TICKETS"); }}
                  className="p-3 bg-[var(--bg-card)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] hover:text-[var(--brand)] transition-all"
                >
                  <AlertTriangle size={18} />
                </button>
              </div>

              <div className="pt-6 border-t border-[var(--border)] flex gap-2">
                 <button 
                   onClick={() => {
                     const unitObj = fullUnits.find(u => u.nome === unit);
                     setAdmissao({ ...admissao, unidade: unit, secretaria: unitObj?.secretaria || 'SEMED' });
                     setActiveTab("QUICK_ADMISSION");
                   }}
                   className="flex-1 py-3 bg-[var(--brand)]/10 text-[var(--brand)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[var(--brand)] hover:text-white transition-all"
                 >
                    Vincular Colaborador
                 </button>
                 <button 
                   onClick={() => { setFiltroUnidadeOcorrencia(unit); setActiveTab("TICKETS"); }}
                   className="px-4 py-3 bg-[var(--bg-card)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] text-[9px] font-black uppercase hover:border-[var(--brand)] transition-all"
                 >
                    Chamados
                 </button>
              </div>
            </div>
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
          <div className="flex justify-between items-center mb-8 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                   <Users size={20} />
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Gestão de Equipe</h3>
                   <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Visualize e gerencie seus colaboradores de campo</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                   <input 
                     type="text" 
                     placeholder="BUSCAR NA EQUIPE..." 
                     className="input-field !h-10 !pl-10 !text-[10px] w-64" 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
                <button 
                   onClick={() => setActiveTab("QUICK_ADMISSION")}
                   className="h-10 px-6 bg-[var(--brand)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[var(--brand)]/20 flex items-center gap-2"
                >
                   <UserPlus size={14} /> Nova Admissão
                </button>
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
            <div key={i} className="card !p-0 overflow-hidden border-l-4 border-l-[var(--brand)] rounded-3xl">
              <div className="p-8 flex flex-col md:flex-row justify-between gap-6">
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
      salario_base: admissao.salario_base || 0,
      valor_alimentacao: admissao.valor_alimentacao || 0,
      valor_vale_transporte: admissao.valor_vale_transporte || 0,
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
              <select 
                className="input-field w-full !h-14 font-bold"
                value={admissao.cargo}
                onChange={e => {
                  const cargoNome = e.target.value;
                  const info = cargos.find(c => c.nome === cargoNome);
                  if (info) {
                    setAdmissao({
                      ...admissao,
                      cargo: cargoNome,
                      salario_base: info.salario_base,
                      valor_alimentacao: info.valor_alimentacao,
                      valor_vale_transporte: info.valor_vale_transporte,
                      insalubridade: info.insalubridade_padrao,
                      carga_horaria: info.carga_horaria_padrao,
                      periodo: info.periodo_padrao || 'DIURNO',
                      escala_tipo: info.escala_padrao || (info.carga_horaria_padrao === '44H' ? 'DIARIO' : 'IMPAR')
                    });
                  } else {
                    setAdmissao({...admissao, cargo: cargoNome});
                  }
                }}
              >
                <option value="">Selecione o Cargo...</option>
                {cargos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-[var(--bg-base)]/30 rounded-2xl border border-[var(--border)]">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Carga / Período</label>
              <div className="flex gap-2">
                <select 
                  className="input-field flex-1 !h-12 font-bold"
                  value={admissao.carga_horaria}
                  onChange={e => {
                    const val = e.target.value;
                    setAdmissao({...admissao, carga_horaria: val, escala_tipo: val === '44H' ? 'DIARIO' : admissao.escala_tipo});
                  }}
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
                  disabled={admissao.carga_horaria === '44H'}
                  onChange={e => setAdmissao({...admissao, escala_tipo: e.target.value})}
                >
                  {admissao.carga_horaria === '44H' ? (
                    <option value="DIARIO">DIARIO / FIXO</option>
                  ) : (
                    <>
                      <option value="PAR">ESCALA PAR</option>
                      <option value="IMPAR">ESCALA ÍMPAR</option>
                    </>
                  )}
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

          <div className="p-8 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)]">
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
      <div className="flex flex-wrap items-center gap-4 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border)] shadow-sm sticky top-0 z-30 backdrop-blur-md overflow-x-auto custom-scrollbar">
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
             className={`flex items-center gap-3 px-8 py-4 rounded-xl text-[0.7rem] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
           >
             <tab.icon size={18} />
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

      <FichaColaborador360 
        colabId={editandoColab?.id} 
        isOpen={!!editandoColab} 
        onClose={() => { setEditandoColab(null); setJustificativa(""); }} 
        canEdit={true}
        onUpdate={fetchEncarregadoData}
      />
    </div>
  );
}
