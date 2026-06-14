"use client";
import { Users, Search, Edit3, Printer, UserPlus } from "lucide-react";

interface MyColabsTabProps {
  myColabs: any[];
  myUnits: string[];
  colabsFiltrados: any[];
  searchTerm: string;
  filtroUnidadeColab: string;
  filtroCargoColab: string;
  onSearchChange: (v: string) => void;
  onFiltroUnidadeChange: (v: string) => void;
  onFiltroCargoChange: (v: string) => void;
  onEditColab: (colab: any) => void;
  onPrintRoute: () => void;
  onGoToAdmission: () => void;
}

export default function MyColabsTab({
  myColabs,
  myUnits,
  colabsFiltrados,
  searchTerm,
  filtroUnidadeColab,
  filtroCargoColab,
  onSearchChange,
  onFiltroUnidadeChange,
  onFiltroCargoChange,
  onEditColab,
  onPrintRoute,
  onGoToAdmission,
}: MyColabsTabProps) {
  const uniqueCargos = Array.from(new Set(myColabs.map(c => c.funcao || c.cargo || 'OPERACIONAL')));

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="card">
        <div className="mb-8 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] flex flex-col gap-6">
          <div className="flex justify-between items-center">
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
                  onChange={e => onSearchChange(e.target.value)}
                />
              </div>
              <button
                onClick={onPrintRoute}
                className="h-10 px-4 bg-white text-[var(--text-primary)] border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Printer size={14} /> Imprimir {filtroUnidadeColab ? "Unidade" : "Equipe"}
              </button>
              <button
                onClick={onGoToAdmission}
                className="h-10 px-6 bg-[var(--brand)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[var(--brand)]/20 flex items-center gap-2"
              >
                <UserPlus size={14} /> Nova Admissão
              </button>
            </div>
          </div>

          <div className="w-full flex flex-col md:flex-row items-center gap-4 mt-6">
            <select
              className="input-field !h-10 !text-[10px] bg-[var(--bg-base)] flex-1 min-w-[200px]"
              value={filtroUnidadeColab}
              onChange={e => onFiltroUnidadeChange(e.target.value)}
            >
              <option value="">TODAS AS UNIDADES</option>
              {myUnits.map((u, i) => <option key={i} value={u}>{u}</option>)}
            </select>
            <select
              className="input-field !h-10 !text-[10px] bg-[var(--bg-base)] flex-1 min-w-[200px]"
              value={filtroCargoColab}
              onChange={e => onFiltroCargoChange(e.target.value)}
            >
              <option value="">TODOS OS CARGOS</option>
              {uniqueCargos.map((cargo: any, i) => <option key={i} value={cargo}>{cargo}</option>)}
            </select>
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
              {colabsFiltrados.map((colab, i) => (
                <tr
                  key={i}
                  className="hover:bg-[var(--bg-base)]/50 transition-colors group cursor-pointer"
                  onClick={() => onEditColab(colab)}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center text-sm font-black shadow-lg shadow-[var(--brand)]/20">
                        {colab.nome?.charAt(0)}
                      </div>
                      <span className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{colab.nome}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-xs font-black text-[var(--text-secondary)]">{colab.funcao || colab.cargo || 'OPERACIONAL'}</div>
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
}
