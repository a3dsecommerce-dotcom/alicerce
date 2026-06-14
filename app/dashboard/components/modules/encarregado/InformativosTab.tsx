"use client";
import { Send, AlertTriangle } from "lucide-react";
interface InformativosTabProps {
  informativo: any;
  myUnits: string[];
  saving: boolean;
  historicoInformativos: any[];
  onInformativoChange: (data: any) => void;
  onSalvar: () => void;
  UserSearchInputComponent: React.ComponentType<any>;
}

export default function InformativosTab({
  informativo,
  myUnits,
  saving,
  historicoInformativos,
  onInformativoChange,
  onSalvar,
  UserSearchInputComponent,
}: InformativosTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)]">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1 italic">Informativos Operacionais</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Registre extras, faltas e atestados da sua equipe</p>
        </div>
        <div className="flex gap-2 bg-[var(--bg-base)] p-1 rounded-2xl border border-[var(--border)]">
          <button
            onClick={() => onInformativoChange({ ...informativo, tipo: 'EXTRA' })}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${informativo.tipo === 'EXTRA' ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'}`}
          >
            Extras / Subs.
          </button>
          <button
            onClick={() => onInformativoChange({ ...informativo, tipo: 'FALTA' })}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${informativo.tipo === 'FALTA' ? 'bg-red-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'}`}
          >
            Faltas / Atestados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Unidade Atendida</label>
              <select
                className="input-field w-full !h-14 font-black"
                value={informativo.unidade}
                onChange={e => onInformativoChange({ ...informativo, unidade: e.target.value })}
              >
                <option value="">Selecione a Unidade...</option>
                {myUnits.map((u, i) => <option key={i} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">
                Data da Ocorrência
                <span className="ml-2 text-[8px] font-bold text-slate-400 normal-case">(dia da falta, extra ou substituição)</span>
              </label>
              <input
                type="date"
                className="input-field w-full !h-14 font-black"
                value={informativo.data}
                onChange={e => onInformativoChange({ ...informativo, data: e.target.value })}
              />
            </div>
          </div>

          {informativo.tipo === 'EXTRA' ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Horário (Ex: 07:00 as 17:00)</label>
                  <input
                    className="input-field w-full !h-14"
                    value={informativo.horario}
                    onChange={e => onInformativoChange({ ...informativo, horario: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Período</label>
                  <select
                    className="input-field w-full !h-14 font-black"
                    value={informativo.periodo}
                    onChange={e => onInformativoChange({ ...informativo, periodo: e.target.value })}
                  >
                    <option value="DIURNO">DIURNO</option>
                    <option value="NOTURNO">NOTURNO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <UserSearchInputComponent
                    label="Colaborador que fez o Extra (Substituto)"
                    placeholder="Digite o nome completo..."
                    valueName={informativo.colaborador_substituto_nome}
                    className="text-blue-600"
                    onSelect={(u: any) => onInformativoChange({
                      ...informativo,
                      colaborador_substituto_id: u.id,
                      colaborador_substituto_nome: u.nome,
                    })}
                  />
                </div>
                <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                  <UserSearchInputComponent
                    label="Colaborador que Faltou (Ausente)"
                    placeholder="Digite o nome completo..."
                    valueName={informativo.colaborador_ausente_nome}
                    className="text-red-600"
                    onSelect={(u: any) => onInformativoChange({
                      ...informativo,
                      colaborador_ausente_id: u.id,
                      colaborador_ausente_nome: u.nome,
                    })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                <UserSearchInputComponent
                  label="Colaborador Ausente"
                  placeholder="Digite o nome completo..."
                  valueName={informativo.colaborador_ausente_nome}
                  className="text-[var(--text-muted)]"
                  onSelect={(u: any) => onInformativoChange({
                    ...informativo,
                    colaborador_ausente_id: u.id,
                    colaborador_ausente_nome: u.nome,
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[var(--text-primary)] italic">Tem Atestado?</span>
                  <button
                    onClick={() => onInformativoChange({ ...informativo, tem_atestado: !informativo.tem_atestado })}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${informativo.tem_atestado ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {informativo.tem_atestado ? 'SIM' : 'NÃO'}
                  </button>
                </div>
                {informativo.tem_atestado && (
                  <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] flex items-center justify-between animate-fade-in">
                    <span className="text-[10px] font-black uppercase text-[var(--text-primary)] italic">Dias</span>
                    <input
                      type="number"
                      className="w-20 p-2 bg-white border border-[var(--border)] rounded-lg text-center font-black"
                      value={informativo.dias_atestado}
                      onChange={e => onInformativoChange({ ...informativo, dias_atestado: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {!informativo.tem_atestado && (
                <div className="p-8 bg-amber-500/5 rounded-3xl border border-amber-500/20 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <span className="text-[10px] font-black uppercase text-amber-700 italic tracking-widest">Sugestão de Medida Disciplinar</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'VERBAL', label: 'Advertência Verbal' },
                      { id: 'ESCRITA', label: 'Advertência Escrita' },
                      { id: 'SUSPENSAO', label: 'Suspensão' },
                      { id: 'JUSTA_CAUSA', label: 'Justa Causa' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => onInformativoChange({ ...informativo, sugestao_punicao: m.id })}
                        className={`p-4 rounded-2xl text-[9px] font-black uppercase transition-all border ${informativo.sugestao_punicao === m.id ? 'bg-amber-500 text-white border-amber-600 shadow-lg' : 'bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-amber-400'}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Observações / Reforço Mensagem</label>
            <textarea
              className="input-field w-full !h-32 p-6"
              placeholder="Descreva detalhes importantes..."
              value={informativo.observacoes}
              onChange={e => onInformativoChange({ ...informativo, observacoes: e.target.value })}
            />
          </div>

          <button
            onClick={onSalvar}
            disabled={saving}
            className="w-full py-6 bg-[var(--brand)] text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-2xl shadow-[var(--brand)]/30"
          >
            {saving ? "Registrando Informativo..." : "Finalizar e Enviar Informativo"}
          </button>
        </div>

        {/* Histórico */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Últimos Registros</h4>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{historicoInformativos.length} informativo(s)</span>
          </div>

          {historicoInformativos.length === 0 ? (
            <div className="bg-[var(--bg-card)]/50 p-10 rounded-[3rem] border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
                <Send className="text-[var(--text-muted)] opacity-30" size={32} />
              </div>
              <p className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest leading-loose">
                Preencha as informações <br /> ao lado para enviar <br /> o informativo operacional
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-auto pr-1 scrollbar-thin">
              {historicoInformativos.map((inf: any) => {
                const dataAbertura = new Date(inf.data_abertura || inf.created_at);
                const dataOcorrencia = inf.data ? new Date(inf.data + 'T12:00:00') : null;
                const isExtra = inf.tipo === 'EXTRA';

                return (
                  <div
                    key={inf.id}
                    className={`p-5 rounded-2xl border-l-4 border ${isExtra ? 'border-l-[var(--brand)] border-[var(--border)] bg-[var(--bg-card)]' : 'border-l-red-500 border-red-100 bg-red-50/30'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isExtra ? 'bg-[var(--brand)]/10 text-[var(--brand)]' : 'bg-red-100 text-red-700'}`}>
                        {isExtra ? '⚡ Extra / Substituição' : '⛔ Falta / Atestado'}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{inf.unidade}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-[var(--bg-base)] rounded-xl p-3">
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">📋 Aberto em</p>
                        <p className="text-[10px] font-black text-slate-700">
                          {dataAbertura.toLocaleDateString('pt-BR')} às {dataAbertura.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`rounded-xl p-3 ${isExtra ? 'bg-[var(--brand)]/5' : 'bg-red-50'}`}>
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">📅 Data da Ocorrência</p>
                        <p className={`text-[10px] font-black ${isExtra ? 'text-[var(--brand)]' : 'text-red-700'}`}>
                          {dataOcorrencia ? dataOcorrencia.toLocaleDateString('pt-BR') : '—'}
                        </p>
                      </div>
                    </div>

                    {isExtra && (
                      <div className="text-[9px] font-bold text-slate-500 space-y-0.5">
                        {inf.colaborador_substituto_nome && <p>⚡ Substituto: <span className="font-black text-slate-700">{inf.colaborador_substituto_nome}</span></p>}
                        {inf.colaborador_ausente_nome && <p>👤 Ausente: <span className="font-black text-slate-700">{inf.colaborador_ausente_nome}</span></p>}
                        {inf.horario && <p>🕐 Horário: <span className="font-black">{inf.horario}</span></p>}
                      </div>
                    )}
                    {!isExtra && (
                      <div className="text-[9px] font-bold text-slate-500 space-y-0.5">
                        {inf.colaborador_ausente_nome && <p>👤 Faltante: <span className="font-black text-slate-700">{inf.colaborador_ausente_nome}</span></p>}
                        {inf.tem_atestado && <p className="text-blue-600 font-black">📄 Com atestado ({inf.dias_atestado}d)</p>}
                        {!inf.tem_atestado && inf.justificada === false && inf.sugestao_punicao && (
                          <p className="text-red-600 font-black">⚠ {inf.sugestao_punicao.replace(/_/g, ' ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
