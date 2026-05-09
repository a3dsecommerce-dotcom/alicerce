import { ChevronRight, FileText, Edit2, Trash2 } from "lucide-react";

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
    rg_cpf: boolean;
    residencia: boolean;
    escolaridade: boolean;
    titulo_reservista: boolean;
    certidoes: boolean;
    antecedentes: boolean;
    ctps_pis: boolean;
    foto: boolean;
  };
  // Admission fields
  adm_telefone?: string;
  adm_entrevista_data?: string;
  adm_compareceu?: boolean;
  adm_exame_encaminhamento?: string;
  adm_docs_entregues?: boolean;
  adm_docs_completos?: boolean;
  adm_aso_liberado?: boolean;
  adm_exame_liberacao_data?: string;
  adm_entrega_isadora_data?: string;
  adm_strato_cadastro?: boolean;
  adm_strato_numero?: string;
  adm_carta_banco?: boolean;
  adm_os_epi?: boolean;
  adm_contrato_liberado?: boolean;
  adm_ponto_cadastrado?: boolean;
  adm_boas_vindas_msg?: boolean;
  adm_assinatura_isadora?: boolean;
  adm_vt_enviado_dp?: boolean;
  adm_va_solicitado?: boolean;
  adm_plano_saude?: boolean;
  adm_conta_banco_aberta?: boolean;
  adm_conta_strato_email?: boolean;
  adm_docs_strato?: boolean;
  adm_exp1_vencimento?: string;
  adm_assinatura_encarregado?: boolean;
  adm_assinatura_2_strato?: boolean;
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
  onUpdateAdmission?: (id: string, field: string, value: any) => void;
  configChecklist?: {id: string, label: string}[];
  onUpdateExtraCheck?: (id: string, label: string, value: boolean) => void;
  onUpdateConfigChecklist?: (id: string, newLabel: string) => void;
  onDeleteConfigChecklist?: (id: string) => void;
}

export default function ColaboradoresTable({ 
  colaboradores, 
  dpAba, 
  onSelect, 
  onUpdateStatus, 
  onGerarPDF,
  onUpdateDocs,
  onUpdateExpDecision,
  onUpdateOffboarding,
  onUpdateAdmission,
  configChecklist = [],
  onUpdateExtraCheck,
  onUpdateConfigChecklist,
  onDeleteConfigChecklist
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
      checked={!!checked} 
      onChange={(e) => onUpdateOffboarding?.(colabId, field, e.target.checked)} 
      className="w-4 h-4 rounded border-[var(--border)] text-red-600 focus:ring-red-500" 
      onClick={e => e.stopPropagation()} 
    />
  );

  return (
    <div className="overflow-x-auto custom-scrollbar w-full">
      <table 
        className="w-full text-left table-auto border-separate border-spacing-0"
        style={{ minWidth: dpAba === 'arquivo' ? `${1200 + (configChecklist.length * 140)}px` : dpAba === 'contratacao' ? '2800px' : dpAba === 'desligamentos' ? '1800px' : '100% '}}
      >
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
                <th className="p-4 text-center">FOTO</th>
                {/* As colunas de documentos agora são 100% dinâmicas e gerenciáveis */}
                {configChecklist.map(col => (
                  <th key={col.id} className="p-4 text-center min-w-[160px] bg-[var(--bg-card)] border-x border-[var(--border)] shadow-sm">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">{col.label}</span>
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const novo = prompt("Renomear coluna:", col.label);
                            if (novo && novo !== col.label) onUpdateConfigChecklist?.(col.id, novo);
                          }}
                          className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
                          title="Editar Nome"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`DESEJA EXCLUIR DEFINITIVAMENTE A COLUNA "${col.label.toUpperCase()}"?\n\nIsso apagará todas as marcações de todos os colaboradores para este documento.`)) {
                              onDeleteConfigChecklist?.(col.id);
                            }
                          }}
                          className="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95"
                          title="Excluir Coluna"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </>
            ) : dpAba === 'contratacao' ? (
              <>
                <th className="p-4 text-center">STATUS</th>
                <th className="p-4 text-left">TELEFONE</th>
                <th className="p-4 text-center">ENTREVISTA</th>
                <th className="p-4 text-center">COMPARECEU?</th>
                <th className="p-4 text-center">ENCAM. EXAME</th>
                <th className="p-4 text-center">TROUXE DOCS?</th>
                <th className="p-4 text-center">DOCS COMPLE.?</th>
                <th className="p-4 text-center">ASO LIBERADO?</th>
                <th className="p-4 text-center">DATA LIB. ASO</th>
                <th className="p-4 text-center">ENTREGA ISADORA</th>
                <th className="p-4 text-center">STRATO CAD.</th>
                <th className="p-4 text-center">Nº STRATO</th>
                <th className="p-4 text-center">ADMISSÃO</th>
                <th className="p-4 text-center">CARTA BANCO</th>
                <th className="p-4 text-center">OS/EPI</th>
                <th className="p-4 text-center">CONTRATO LIB.</th>
                <th className="p-4 text-center">PONTO CAD.</th>
                <th className="p-4 text-center">BOAS VINDAS</th>
                <th className="p-4 text-center">ASSIN. ISADORA</th>
                <th className="p-4 text-center">VT → DP</th>
                <th className="p-4 text-center">SOLIC. VA</th>
                <th className="p-4 text-center">PLANO SAÚDE</th>
                <th className="p-4 text-center">ABRIU CONTA?</th>
                <th className="p-4 text-center">CONTA STRATO/EMAIL</th>
                <th className="p-4 text-center">DOCS NO STRATO</th>
                <th className="p-4 text-center">VENC. 1ª EXP</th>
                <th className="p-4 text-center">ASSIN. ENCARREGADO</th>
                <th className="p-4 text-center">2ª ASSIN. STRATO</th>
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
                  {/* As colunas de documentos agora são 100% dinâmicas e gerenciáveis */}
                  {configChecklist.map(col => (
                    <td key={col.id} className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={!!(c.checklist_extra?.[col.label])} 
                        onChange={(e) => onUpdateExtraCheck?.(c.id, col.label, e.target.checked)} 
                        className="w-4 h-4 rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500" 
                        onClick={e => e.stopPropagation()} 
                      />
                    </td>
                  ))}
                </>
              ) : dpAba === 'contratacao' ? (
                <>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{c.status}</span>
                  </td>
                  <td className="p-4">
                    <input type="text" value={c.adm_telefone || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_telefone', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px] font-black" placeholder="(00) 00000-0000" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4">
                    <input type="date" value={c.adm_entrevista_data || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_entrevista_data', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_compareceu} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_compareceu', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4">
                    <input type="date" value={c.adm_exame_encaminhamento || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_exame_encaminhamento', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_docs_entregues} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_docs_entregues', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_docs_completos} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_docs_completos', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_aso_liberado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_aso_liberado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4">
                    <input type="date" value={c.adm_exame_liberacao_data || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_exame_liberacao_data', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4">
                    <input type="date" value={c.adm_entrega_isadora_data || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_entrega_isadora_data', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_strato_cadastro} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_strato_cadastro', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4">
                    <input type="text" value={c.adm_strato_numero || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_strato_numero', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px] font-black" placeholder="Nº Strato" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center text-[10px] font-black text-blue-600">
                    {formatDate(c.data_admissao)}
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_carta_banco} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_carta_banco', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_os_epi} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_os_epi', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_contrato_liberado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_contrato_liberado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_ponto_cadastrado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_ponto_cadastrado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_boas_vindas_msg} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_boas_vindas_msg', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_assinatura_isadora} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_assinatura_isadora', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_vt_enviado_dp} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_vt_enviado_dp', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_va_solicitado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_va_solicitado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_plano_saude} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_plano_saude', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_conta_banco_aberta} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_conta_banco_aberta', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_conta_strato_email} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_conta_strato_email', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_docs_strato} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_docs_strato', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4">
                    <input type="date" value={c.adm_exp1_vencimento || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_exp1_vencimento', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_assinatura_encarregado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_assinatura_encarregado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={!!c.adm_assinatura_2_strato} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_assinatura_2_strato', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]" onClick={e => e.stopPropagation()} />
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
