"use client";
import { UserPlus, Activity } from "lucide-react";

interface QuickAdmissionTabProps {
  admissao: any;
  cargos: any[];
  myUnits: string[];
  fullUnits: any[];
  saving: boolean;
  onAdmissaoChange: (field: string, value: any) => void;
  onAdmissaoFull: (data: any) => void;
  onSalvar: () => void;
}

export default function QuickAdmissionTab({
  admissao,
  cargos,
  myUnits,
  fullUnits,
  saving,
  onAdmissaoChange,
  onAdmissaoFull,
  onSalvar,
}: QuickAdmissionTabProps) {
  return (
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
                onChange={e => onAdmissaoChange('nome', e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Cargo / Função</label>
              <select
                className="input-field w-full !h-14 font-bold"
                value={admissao.funcao}
                onChange={e => {
                  const cargoNome = e.target.value;
                  const info = cargos.find((c: any) => c.nome === cargoNome);
                  if (info) {
                    onAdmissaoFull({
                      ...admissao,
                      funcao: cargoNome,
                      salario_base: info.salario_base,
                      valor_alimentacao: info.valor_alimentacao,
                      valor_vale_transporte: info.valor_vale_transporte,
                      insalubridade: info.insalubridade_padrao,
                      carga_horaria: info.carga_horaria_padrao,
                      periodo: info.periodo_padrao || 'DIURNO',
                      escala_tipo: info.escala_padrao || (info.carga_horaria_padrao === '44H' ? 'DIARIO' : 'IMPAR'),
                    });
                  } else {
                    onAdmissaoChange('funcao', cargoNome);
                  }
                }}
              >
                <option value="">Selecione o Cargo...</option>
                {cargos.map((c: any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
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
                onChange={e => onAdmissaoChange('telefone', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Unidade de Alocação</label>
              <select
                className="input-field w-full !h-14 font-bold"
                value={admissao.unidade}
                onChange={e => {
                  const unit = fullUnits.find((u: any) => u.nome === e.target.value);
                  onAdmissaoFull({
                    ...admissao,
                    unidade: e.target.value,
                    secretaria: unit?.secretaria || 'SEMED',
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
                    onAdmissaoFull({ ...admissao, carga_horaria: val, escala_tipo: val === '44H' ? 'DIARIO' : admissao.escala_tipo });
                  }}
                >
                  <option value="12X36">12X36</option>
                  <option value="44H">44H (SEM)</option>
                </select>
                <select
                  className="input-field flex-1 !h-12 font-bold"
                  value={admissao.periodo}
                  onChange={e => onAdmissaoChange('periodo', e.target.value)}
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
                  onChange={e => onAdmissaoChange('escala_tipo', e.target.value)}
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
                  onChange={e => onAdmissaoChange('insalubridade', e.target.value)}
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
                  onChange={e => onAdmissaoChange('data_referencia', e.target.value)}
                />
              </div>
            )}
          </div>

          <button
            className="btn-brand w-full !h-16 shadow-xl shadow-[var(--brand)]/20"
            onClick={onSalvar}
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
}
