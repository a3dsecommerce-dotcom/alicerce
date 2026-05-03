"use client";
import { UserPlus, ShieldAlert } from "lucide-react";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

interface AdmissaoModalsProps {
  modalAdmissao: any;
  setModalAdmissao: (v: any) => void;
  admissaoForm: any;
  setAdmissaoForm: (v: any) => void;
  onAdmissaoFinal: () => void;
  modalAfastamento: any;
  setModalAfastamento: (v: any) => void;
  afastamentoData: any;
  setAfastamentoData: (v: any) => void;
  onConfirmarAfastamento: () => void;
}

export default function AdmissaoModals({
  modalAdmissao, setModalAdmissao,
  admissaoForm, setAdmissaoForm,
  onAdmissaoFinal,
  modalAfastamento, setModalAfastamento,
  afastamentoData, setAfastamentoData,
  onConfirmarAfastamento
}: AdmissaoModalsProps) {
  return (
    <>
      {/* MODAL AFASTAMENTO */}
      <AdaptiveModal title="Registrar Afastamento / Licença" isOpen={!!modalAfastamento} onClose={() => setModalAfastamento(null)} width="500px">
        <div className="p-10 space-y-6">
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-start gap-4">
            <ShieldAlert className="text-orange-600 shrink-0" size={24}/>
            <div>
              <p className="text-xs font-black text-orange-900 uppercase tracking-widest">Controle de Absenteísmo</p>
              <p className="text-[10px] font-bold text-orange-700 mt-1 uppercase">O colaborador ficará em status de espera. Informe o motivo legal e o tempo previsto.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Motivo do Afastamento</label>
              <select className="input-field w-full font-bold" value={afastamentoData.motivo} onChange={e => setAfastamentoData({...afastamentoData, motivo: e.target.value})}>
                <option value="">Selecione o motivo...</option>
                <option value="MEDICO">Licença Médica (Atestado)</option>
                <option value="MATERNIDADE">Licença Maternidade</option>
                <option value="FERIAS">Férias</option>
                <option value="PARTICULAR">Assunto Particular</option>
                <option value="SUSPENSAO">Suspensão Disciplinar</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Tempo Previsto (Dias)</label>
              <input type="number" className="input-field w-full font-black" placeholder="Ex: 15" value={afastamentoData.tempo} onChange={e => setAfastamentoData({...afastamentoData, tempo: e.target.value})} />
            </div>
          </div>

          <button onClick={onConfirmarAfastamento} className="w-full h-14 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Confirmar Afastamento</button>
        </div>
      </AdaptiveModal>

      {/* MODAL DE ADMISSÃO FINAL */}
      <AdaptiveModal title={`Admissão: ${modalAdmissao?.nome}`} isOpen={!!modalAdmissao} onClose={() => setModalAdmissao(null)} width="500px">
        <div className="p-10 space-y-6">
          <div className="bg-[var(--brand)]/5 p-6 rounded-2xl border border-[var(--brand)]/10 flex items-start gap-4">
            <UserPlus className="text-[var(--brand)] shrink-0" size={24}/>
            <div>
              <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Configuração de Perfil Ativo</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase">Transforme o candidato em um colaborador oficial da Alicerce.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Secretaria Responsável</label>
              <select className="input-field w-full font-bold" value={admissaoForm.secretaria} onChange={e => setAdmissaoForm({...admissaoForm, secretaria: e.target.value, unidade: ""})}>
                <option value="">Selecione a Secretaria...</option>
                <option value="SEMED">SEMED (Educação)</option>
                <option value="SEMSA">SEMSA (Saúde)</option>
                <option value="SEMUSP">SEMUSP (Serviços Públicos)</option>
                <option value="SEMAS">SEMAS (Ação Social)</option>
                <option value="SEFIN">SEFIN (Finanças)</option>
                <option value="SEPLAN">SEPLAN (Planejamento)</option>
                <option value="GABINETE">GABINETE DO PREFEITO</option>
                <option value="ALMOXARIFADO">ALMOXARIFADO CENTRAL</option>
                <option value="SEDE">SEDE ADMINISTRATIVA</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Unidade de Alocação</label>
              <select className="input-field w-full font-bold" value={admissaoForm.unidade} onChange={e => setAdmissaoForm({...admissaoForm, unidade: e.target.value})}>
                <option value="">Selecione a Unidade...</option>
                {admissaoForm.secretaria === "SEMED" && (
                  <>
                    <option value="Escola Jorge Boueri">Escola Jorge Boueri</option>
                    <option value="Escola Maria de Nazaré">Escola Maria de Nazaré</option>
                    <option value="Centro Infantil">Centro Infantil</option>
                  </>
                )}
                {admissaoForm.secretaria === "SEMSA" && (
                  <>
                    <option value="UPA - Unidade de Pronto Atendimento">UPA - Unidade de Pronto Atendimento</option>
                    <option value="UBS Central">UBS Central</option>
                    <option value="Vigilância Sanitária">Vigilância Sanitária</option>
                  </>
                )}
                <option value="OUTRA">OUTRA UNIDADE...</option>
              </select>
            </div>

            {admissaoForm.unidade === "OUTRA" && (
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Nome da Unidade (Manual)</label>
                <input type="text" className="input-field w-full font-black" placeholder="Digite o nome da unidade..." onBlur={e => setAdmissaoForm({...admissaoForm, unidade: e.target.value})} />
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Cargo Oficial</label>
              <input type="text" className="input-field w-full font-black" placeholder="Ex: ASG, Porteiro, Assistente..." value={admissaoForm.cargo} onChange={e => setAdmissaoForm({...admissaoForm, cargo: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Data de Admissão</label>
              <input type="date" className="input-field w-full font-black" value={admissaoForm.data} onChange={e => setAdmissaoForm({...admissaoForm, data: e.target.value})} />
            </div>
          </div>

          <button onClick={onAdmissaoFinal} className="w-full h-14 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--brand)]/30">Finalizar Contratação</button>
        </div>
      </AdaptiveModal>
    </>
  );
}
