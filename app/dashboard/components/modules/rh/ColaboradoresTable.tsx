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
  admissao: string;
  insalubridade?: string;
  carga_horaria?: string;
  horario_entrada?: string;
  horario_saida?: string;
  escala_tipo?: string;
  periodo?: string;
}

interface ColaboradoresTableProps {
  colaboradores: Colaborador[];
  dpAba: string;
  onSelect: (c: Colaborador) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onGerarPDF: (c: Colaborador) => void;
}

export default function ColaboradoresTable({ 
  colaboradores, 
  dpAba, 
  onSelect, 
  onUpdateStatus, 
  onGerarPDF 
}: ColaboradoresTableProps) {
  return (
    <table className="w-full text-left">
      <thead className="border-b border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
        <tr>
          <th className="p-6">Colaborador</th>
          <th className="p-6">Cargo / Unidade</th>
          <th className="p-6">Jornada / Horário</th>
          <th className="p-6 text-center">Insalubridade</th>
          <th className="p-6 text-center">Status</th>
          <th className="p-6 text-right">Ações</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)]">
        {colaboradores.map(c => (
          <tr key={c.id} className="hover:bg-[var(--bg-base)]/50 transition-colors group cursor-pointer" onClick={() => onSelect(c)}>
            <td className="p-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center text-sm font-black">{c.avatar}</div>
                <span className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{c.nome}</span>
              </div>
            </td>
            <td className="p-6">
              <div className="text-xs font-black text-[var(--text-secondary)]">{c.cargo}</div>
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">{c.unidade}</div>
            </td>
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
               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${c.insalubridade === '40%' ? 'bg-red-100 text-red-700' : c.insalubridade === '20%' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                  {c.insalubridade || 'N/A'}
               </span>
            </td>
            <td className="p-6 text-center">
              <div className="flex flex-col gap-1 items-center">
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700' : c.status === 'AFASTADO' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
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
