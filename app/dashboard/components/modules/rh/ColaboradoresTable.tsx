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
  docs?: {
    asu: boolean;
    vt: boolean;
    ticket: boolean;
    contrato: boolean;
    fardamento: boolean;
  };
}

interface ColaboradoresTableProps {
  colaboradores: Colaborador[];
  dpAba: string;
  onSelect: (c: Colaborador) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onGerarPDF: (c: Colaborador) => void;
  onUpdateDocs?: (id: string, field: string, value: boolean) => void;
}

export default function ColaboradoresTable({ 
  colaboradores, 
  dpAba, 
  onSelect, 
  onUpdateStatus, 
  onGerarPDF,
  onUpdateDocs
}: ColaboradoresTableProps) {
  
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
  return (
    <table className="w-full text-left">
      <thead className="border-b border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
        <tr>
          <th className="p-6">Colaborador</th>
          <th className="p-6">Cargo / Unidade</th>
          {dpAba === 'arquivo' ? (
            <>
              <th className="p-4 text-center">ASU</th>
              <th className="p-4 text-center">VT</th>
              <th className="p-4 text-center">TICKET</th>
              <th className="p-4 text-center">CONTRATO</th>
              <th className="p-4 text-center">FARDA</th>
            </>
          ) : (
            <>
              <th className="p-6">Jornada / Horário</th>
              <th className="p-6 text-center">Experiência</th>
              <th className="p-6 text-center">Status</th>
            </>
          )}
          <th className="p-6 text-right">Ações</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)]">
        {colaboradores.map(c => (
          <tr key={c.id} className="hover:bg-[var(--bg-base)]/50 transition-colors group cursor-pointer" onClick={() => onSelect(c)}>
            <td className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center text-[0.6rem] font-black flex-shrink-0">{c.avatar}</div>
                <span className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{c.nome}</span>
              </div>
            </td>
            <td className="p-6">
              <div className="text-xs font-black text-[var(--text-secondary)]">{c.cargo}</div>
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">{c.unidade}</div>
            </td>
            {dpAba === 'arquivo' ? (
              <>
                <td className="p-4 text-center">
                   <input type="checkbox" checked={c.docs?.asu} onChange={(e) => onUpdateDocs?.(c.id, 'doc_asu', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                </td>
                <td className="p-4 text-center">
                   <input type="checkbox" checked={c.docs?.vt} onChange={(e) => onUpdateDocs?.(c.id, 'doc_vt', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                </td>
                <td className="p-4 text-center">
                   <input type="checkbox" checked={c.docs?.ticket} onChange={(e) => onUpdateDocs?.(c.id, 'doc_ticket', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                </td>
                <td className="p-4 text-center">
                   <input type="checkbox" checked={c.docs?.contrato} onChange={(e) => onUpdateDocs?.(c.id, 'doc_contrato', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                </td>
                <td className="p-4 text-center">
                   <input type="checkbox" checked={c.docs?.fardamento} onChange={(e) => onUpdateDocs?.(c.id, 'doc_fardamento', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                </td>
              </>
            ) : (
              <>
                <td className="p-6">
                  <div className="text-xs font-bold text-[var(--text-primary)]">{c.carga_horaria || '---'} ({c.horario_entrada || '07:00'}-{c.horario_saida || '19:00'})</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-blue-600 font-black uppercase">{c.escala_tipo || 'DIARIO'}</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 rounded ${c.periodo === 'NOTURNO' ? 'bg-indigo-100 text-indigo-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.periodo || 'DIURNO'}
                    </span>
                  </div>
                </td>
                <td className="p-6 text-center">
                   {(() => {
                      const exp = getExperienceInfo(c.data_admissao);
                      if (!exp) return <span className="text-[10px] text-[var(--text-muted)] italic">N/A</span>;
                      return (
                        <div className="flex flex-col items-center gap-1">
                           <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${exp.color}`}>
                              {exp.label}
                           </span>
                           {exp.alert && <span className="text-[7px] font-black text-red-600 animate-bounce uppercase">{exp.alert}</span>}
                        </div>
                      );
                   })()}
                </td>
                <td className="p-6 text-center">
                  <div className="flex flex-col gap-1 items-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700' : c.status === 'EM_ADMISSAO' ? 'bg-blue-100 text-blue-700' : c.status === 'AFASTADO' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{c.status?.replace('_', ' ')}</span>
                    {dpAba === 'ativos' && (
                      <select 
                        className="text-[8px] font-black border-none bg-transparent text-[var(--text-muted)] focus:ring-0 cursor-pointer" 
                        value={c.status} 
                        onClick={(e) => e.stopPropagation()} 
                        onChange={(e) => onUpdateStatus(c.id, e.target.value)}
                      >
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
            <td className="p-6 text-right">
              <div className="flex justify-end gap-3">
                {dpAba === 'arquivo' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onGerarPDF(c); }} 
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase"
                  >
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
  );
}
