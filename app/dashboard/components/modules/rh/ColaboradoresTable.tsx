"use client";
import { ChevronRight, FileText } from "lucide-react";

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  unidade: string;
  status: string;
  avatar: string;
  cpf: string;
  telefone: string;
  admissao: string | null;
  data_admissao?: string | null;
  insalubridade?: string;
  carga_horaria?: string;
  horario_entrada?: string;
  horario_saida?: string;
  escala_tipo?: string;
  periodo?: string;
  exp1_decisao?: string;
  exp2_decisao?: string;
  docs?: {
    asu: boolean;
    vt: boolean;
    ticket: boolean;
    contrato: boolean;
    fardamento: boolean;
  };
  // Offboarding fields
  data_demissao?: string;
  desligamento_formato?: string;
  desligamento_form_preenchido?: boolean;
  desligamento_email_formalizado?: boolean;
  desligamento_strato_docs?: boolean;
  desligamento_aviso_previo_fim?: string;
  desligamento_ponto_corrigido?: boolean;
  desligamento_exame_agendado?: boolean;
  desligamento_exame_feito?: boolean;
  desligamento_trct_email?: boolean;
  desligamento_trct_limite?: string;
  desligamento_trct_assinado?: boolean;
  desligamento_uniforme_devolvido?: boolean;
  desligamento_strato_final?: boolean;
}

interface ColaboradoresTableProps {
  colaboradores: Colaborador[];
  dpAba: string;
  onSelect: (c: Colaborador) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onGerarPDF: (c: Colaborador) => void;
  onUpdateDocs?: (id: string, field: string, value: boolean) => void;
  onUpdateExpDecision?: (id: string, stage: 'exp1_decisao' | 'exp2_decisao', decision: string) => void;
  onUpdateOffboarding?: (id: string, field: string, value: any) => void;
}

export default function ColaboradoresTable({ 
  colaboradores, 
  dpAba, 
  onSelect, 
  onUpdateStatus, 
  onGerarPDF,
  onUpdateDocs,
  onUpdateExpDecision,
  onUpdateOffboarding
}: ColaboradoresTableProps) {
  
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '---';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  const getFutureDate = (baseDate: string | null | undefined, days: number) => {
    if (!baseDate) return '---';
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };
  
  const getExperienceInfo = (dataAdmissao: string | null | undefined) => {
    if (!dataAdmissao) return null;
    const admissao = new Date(dataAdmissao);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - admissao.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) {
      const faltam = 30 - diffDays;
      return { 
        label: `${diffDays}d / Exp 30d`, 
        color: faltam <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-700',
        alert: faltam <= 5 ? `Vence em ${faltam} dias!` : null
      };
    }
    if (diffDays <= 90) {
      const faltam = 90 - diffDays;
      return { 
        label: `${diffDays}d / Exp 90d`, 
        color: faltam <= 5 ? 'bg-red-600 text-white animate-pulse' : 'bg-indigo-100 text-indigo-700',
        alert: faltam <= 5 ? `Vence em ${faltam} dias!` : null
      };
    }
    return { label: 'Efetivo', color: 'bg-slate-100 text-slate-500', alert: null };
  };

  const OffboardingCheckbox = ({ colabId, field, checked }: any) => (
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onUpdateOffboarding?.(colabId, field, e.target.checked)} 
      className="w-4 h-4 rounded border-[var(--border)] text-red-600 focus:ring-red-500" 
      onClick={e => e.stopPropagation()} 
    />
  );

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left table-auto border-separate border-spacing-0">
        <thead className="sticky top-0 bg-[var(--bg-card)] z-10 border-b border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <tr>
            <th className="p-6 sticky left-0 bg-[var(--bg-card)] shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-20">Colaborador</th>
            <th className="p-6">Cargo</th>
            {dpAba === 'desligamentos' ? (
              <>
                <th className="p-4 text-center">Data Demissão</th>
                <th className="p-4 text-center">Formato</th>
                <th className="p-4 text-center">Form. Preench?</th>
                <th className="p-4 text-center">Formal. Email?</th>
                <th className="p-4 text-center">Doc Strato?</th>
                <th className="p-4 text-center">Fim Aviso</th>
                <th className="p-4 text-center">Ponto OK?</th>
                <th className="p-4 text-center">Exame Agend?</th>
                <th className="p-4 text-center">Exame Feito?</th>
                <th className="p-4 text-center">TRCT Email?</th>
                <th className="p-4 text-center">Limite TRCT</th>
                <th className="p-4 text-center">Assinado?</th>
                <th className="p-4 text-center">Uniforme?</th>
                <th className="p-4 text-center">Doc Final?</th>
              </>
            ) : dpAba === 'arquivo' ? (
              <>
                <th className="p-4 text-center">ASU</th>
                <th className="p-4 text-center">VT</th>
                <th className="p-4 text-center">TICKET</th>
                <th className="p-4 text-center">CONTRATO</th>
                <th className="p-4 text-center">FARDA</th>
              </>
            ) : dpAba === 'contratacao' ? (
              <>
                <th className="p-4 text-center">Início</th>
                <th className="p-4 text-center">Término (30d)</th>
                <th className="p-4 text-center">Renovar?</th>
                <th className="p-4 text-center">Término (90d)</th>
                <th className="p-4 text-center">Efetivar?</th>
              </>
            ) : (
              <>
                <th className="p-6">Jornada / Horário</th>
                <th className="p-6 text-center">Experiência</th>
                <th className="p-6 text-center">Status</th>
              </>
            )}
            <th className="p-6 text-right sticky right-0 bg-[var(--bg-card)] shadow-[-2px_0_5px_rgba(0,0,0,0.05)] z-20">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {colaboradores.map(c => (
            <tr key={c.id} className="hover:bg-[var(--bg-base)]/50 transition-colors group cursor-pointer" onClick={() => onSelect(c)}>
              <td className="p-6 sticky left-0 bg-[var(--bg-card)] group-hover:bg-[var(--bg-base)] shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center text-[0.6rem] font-black flex-shrink-0">{c.avatar}</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate max-w-[150px]">{c.nome}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">{c.cpf}</span>
                  </div>
                </div>
              </td>
              <td className="p-6">
                <div className="text-xs font-black text-[var(--text-secondary)] truncate max-w-[120px]">{c.cargo}</div>
                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-tighter truncate max-w-[120px]">{c.unidade}</div>
              </td>

              {dpAba === 'desligamentos' ? (
                <>
                  <td className="p-4 text-center">
                    <input type="date" value={c.data_demissao || ''} onChange={(e) => onUpdateOffboarding?.(c.id, 'data_demissao', e.target.value)} className="text-[9px] font-black bg-transparent border-[var(--border)] rounded p-1" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <select value={c.desligamento_formato || ''} onChange={(e) => onUpdateOffboarding?.(c.id, 'desligamento_formato', e.target.value)} className="text-[9px] font-black bg-transparent border-[var(--border)] rounded p-1" onClick={e => e.stopPropagation()}>
                      <option value="">Selecione</option>
                      <option value="PEDIDO">Pedido</option>
                      <option value="SEM_JUSTA">Dispensa S/JC</option>
                      <option value="COM_JUSTA">Dispensa C/JC</option>
                      <option value="TERMINO">Término Contrato</option>
                    </select>
                  </td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_form_preenchido" checked={c.desligamento_form_preenchido} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_email_formalizado" checked={c.desligamento_email_formalizado} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_strato_docs" checked={c.desligamento_strato_docs} /></td>
                  <td className="p-4 text-center">
                    <input type="date" value={c.desligamento_aviso_previo_fim || ''} onChange={(e) => onUpdateOffboarding?.(c.id, 'desligamento_aviso_previo_fim', e.target.value)} className="text-[9px] font-black bg-transparent border-[var(--border)] rounded p-1" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_ponto_corrigido" checked={c.desligamento_ponto_corrigido} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_exame_agendado" checked={c.desligamento_exame_agendado} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_exame_feito" checked={c.desligamento_exame_feito} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_trct_email" checked={c.desligamento_trct_email} /></td>
                  <td className="p-4 text-center">
                    <input type="date" value={c.desligamento_trct_limite || ''} onChange={(e) => onUpdateOffboarding?.(c.id, 'desligamento_trct_limite', e.target.value)} className="text-[9px] font-black bg-transparent border-[var(--border)] rounded p-1" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_trct_assinado" checked={c.desligamento_trct_assinado} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_uniforme_devolvido" checked={c.desligamento_uniforme_devolvido} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_strato_final" checked={c.desligamento_strato_final} /></td>
                </>
              ) : dpAba === 'arquivo' ? (
                <>
                  <td className="p-4 text-center"><input type="checkbox" checked={c.docs?.asu} onChange={(e) => onUpdateDocs?.(c.id, 'doc_asu', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={c.docs?.vt} onChange={(e) => onUpdateDocs?.(c.id, 'doc_vt', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={c.docs?.ticket} onChange={(e) => onUpdateDocs?.(c.id, 'doc_ticket', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={c.docs?.contrato} onChange={(e) => onUpdateDocs?.(c.id, 'doc_contrato', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={c.docs?.fardamento} onChange={(e) => onUpdateDocs?.(c.id, 'doc_fardamento', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                </>
              ) : dpAba === 'contratacao' ? (
                <>
                  <td className="p-4 text-center text-[10px] font-black text-blue-600">{formatDate(c.data_admissao)}</td>
                  <td className="p-4 text-center text-[10px] font-bold text-[var(--text-primary)]">{formatDate(getFutureDate(c.data_admissao, 30))}</td>
                  <td className="p-4 text-center">
                     <select className={`text-[8px] font-black px-2 py-1 rounded border-2 transition-all cursor-pointer ${c.exp1_decisao === 'RENOVADO' ? 'bg-green-100 border-green-300 text-green-700' : c.exp1_decisao === 'DISPENSADO' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-slate-100 border-slate-300 text-slate-700'}`} value={c.exp1_decisao} onClick={e => e.stopPropagation()} onChange={e => onUpdateExpDecision?.(c.id, 'exp1_decisao', e.target.value)}>
                       <option value="PENDENTE">Aguardando</option>
                       <option value="RENOVADO">Sim, Renovar</option>
                       <option value="DISPENSADO">Não, Dispensar</option>
                     </select>
                  </td>
                  <td className="p-4 text-center text-[10px] font-bold text-[var(--text-primary)]">{formatDate(getFutureDate(c.data_admissao, 90))}</td>
                  <td className="p-4 text-center">
                     <select className={`text-[8px] font-black px-2 py-1 rounded border-2 transition-all cursor-pointer ${c.exp2_decisao === 'EFETIVADO' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : c.exp2_decisao === 'DISPENSADO' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-slate-100 border-slate-300 text-slate-700'}`} value={c.exp2_decisao} onClick={e => e.stopPropagation()} onChange={e => onUpdateExpDecision?.(c.id, 'exp2_decisao', e.target.value)}>
                       <option value="PENDENTE">Aguardando</option>
                       <option value="EFETIVADO">Efetivar</option>
                       <option value="DISPENSADO">Dispensar</option>
                     </select>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-6">
                    <div className="text-xs font-bold text-[var(--text-primary)]">{c.carga_horaria || '---'} ({c.horario_entrada || '07:00'}-{c.horario_saida || '19:00'})</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-blue-600 font-black uppercase">{c.escala_tipo || 'DIARIO'}</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 rounded ${c.periodo === 'NOTURNO' ? 'bg-indigo-100 text-indigo-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.periodo || 'DIURNO'}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                     {(() => {
                        const exp = getExperienceInfo(c.data_admissao);
                        if (!exp) return <span className="text-[10px] text-[var(--text-muted)] italic">N/A</span>;
                        return (
                          <div className="flex flex-col items-center gap-1">
                             <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${exp.color}`}>{exp.label}</span>
                             {exp.alert && <span className="text-[7px] font-black text-red-600 animate-bounce uppercase">{exp.alert}</span>}
                          </div>
                        );
                     })()}
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700' : c.status === 'EM_ADMISSAO' ? 'bg-blue-100 text-blue-700' : c.status === 'AFASTADO' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{c.status?.replace('_', ' ')}</span>
                      {dpAba === 'ativos' && (
                        <select className="text-[8px] font-black border-none bg-transparent text-[var(--text-muted)] focus:ring-0 cursor-pointer" value={c.status} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdateStatus(c.id, e.target.value)}>
                          <option value="ATIVO">Ativar</option>
                          <option value="AFASTADO">Afastar</option>
                          <option value="INATIVO">Inativar</option>
                          <option value="DESLIGADO">Demitir (REQ)</option>
                        </select>
                      )}
                    </div>
                  </td>
                </>
              )}
              <td className="p-6 text-right sticky right-0 bg-[var(--bg-card)] group-hover:bg-[var(--bg-base)] shadow-[-2px_0_5px_rgba(0,0,0,0.05)] z-10">
                <div className="flex justify-end gap-3">
                  {(dpAba === 'arquivo' || dpAba === 'desligamentos') && (
                    <button onClick={(e) => { e.stopPropagation(); onGerarPDF(c); }} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                      <FileText size={14} /> PDF
                    </button>
                  )}
                  <button className="p-3 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-xl group-hover:text-[var(--brand)] group-hover:bg-white transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
