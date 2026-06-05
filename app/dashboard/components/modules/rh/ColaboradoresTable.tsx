import { ChevronLeft, ChevronRight, FileText, Edit2, Trash2, Palette, ArrowLeftRight, Settings, X, Check } from "lucide-react";
import { useRef, useState } from "react";

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
  checklist_extra?: Record<string, boolean>;
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
  onUpdateConfigColor?: (id: string, color: string) => void;
  onReorderConfig?: (id1: string, order1: number, id2: string, order2: number) => void;
  onEdit: (c: Colaborador) => void;
  onDelete: (id: string) => void;
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
  onDeleteConfigChecklist,
  onUpdateConfigColor,
  onReorderConfig,
  onEdit,
  onDelete
}: ColaboradoresTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [modalConfig, setModalConfig] = useState<any>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
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
        color: faltam <= 5 ? 'bg-red-600 text-white animate-pulse' : 'bg-cyan-100 text-cyan-700',
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
    <div className="flex flex-col gap-2">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--bg-base);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--brand);
          border-radius: 10px;
          border: 2px solid var(--bg-base);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4338ca;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-fade { animation: fadeIn 0.2s ease-out forwards; }
        .animate-modal-scale { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
      {/* Scroll Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Navegação Horizontal v753.5</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => scroll('left')}
            className="p-2 bg-[var(--bg-base)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--brand)] hover:text-white transition-all shadow-sm flex items-center gap-1 text-[10px] font-black"
          >
            <ChevronLeft size={14} /> ANTERIOR
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 bg-[var(--bg-base)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--brand)] hover:text-white transition-all shadow-sm flex items-center gap-1 text-[10px] font-black"
          >
            PRÓXIMA <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="overflow-x-auto custom-scrollbar w-full border border-[var(--border)] rounded-xl bg-[var(--bg-card)]"
        style={{
          scrollbarWidth: 'thick',
          scrollbarColor: 'var(--brand) transparent'
        }}
      >
        <table 
          className={`w-full text-left border-separate border-spacing-0 ${dpAba === 'arquivo' ? 'table-fixed' : 'table-auto'}`}
          style={{ minWidth: dpAba === 'arquivo' ? `${600 + (configChecklist.length * 70)}px` : dpAba === 'contratacao' ? '2800px' : dpAba === 'desligamentos' ? '1800px' : '100%'}}
        >
        <thead className="sticky top-0 bg-[var(--bg-card)] z-10 border-b border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <tr>
            <th className="p-6 sticky left-0 bg-[var(--bg-card)] shadow-[4px_0_8px_rgba(0,0,0,0.1)] z-20 w-[250px] min-w-[250px]">Colaborador</th>
            
            {dpAba === 'ativos' ? (
              <>
                <th className="p-4 text-center">Unidade</th>
                <th className="p-4 text-center">Cargo</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Admissão</th>
                <th className="p-4 text-center">Expiração Exp.</th>
              </>
            ) : dpAba === 'arquivo' ? (
              <>
                <th className="p-4 text-center w-[150px] min-w-[150px]">Unidade</th>
                {configChecklist.map(col => (
                  <th 
                    key={col.id} 
                    draggable 
                    onDragStart={(e) => e.dataTransfer.setData("columnId", col.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const sourceId = e.dataTransfer.getData("columnId");
                      if (sourceId && sourceId !== col.id) {
                        const source = configChecklist.find(c => c.id === sourceId);
                        if (source) onReorderConfig?.(sourceId, source.ordem || 0, col.id, col.ordem || 0);
                      }
                    }}
                    className={`p-2 text-center w-[70px] min-w-[70px] border-x border-[var(--border)] shadow-sm group/header cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] ${(!col.color || col.color === 'transparent') ? 'bg-[var(--bg-card)]' : ''}`} 
                    style={{ backgroundColor: (col.color && col.color !== 'transparent') ? col.color : undefined }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none h-4 overflow-hidden text-ellipsis whitespace-nowrap w-full" title={col.label}>{col.label}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalConfig(col);
                        }}
                        className="opacity-0 group-hover/header:opacity-100 transition-all p-1 bg-white/50 hover:bg-white text-slate-600 rounded-md shadow-sm"
                      >
                        <Settings size={10} />
                      </button>
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
                <th className="p-4 text-center">ASSINAR ISADORA</th>
                <th className="p-4 text-center">ENVIO VT DP</th>
                <th className="p-4 text-center">LIBERAÇÃO VA</th>
                <th className="p-4 text-center">PLANO SAÚDE</th>
                <th className="p-4 text-center">ABRIU CONTA?</th>
                <th className="p-4 text-center">CONTA STRATO</th>
                <th className="p-4 text-center">DOC STRATO</th>
                <th className="p-4 text-center">VENC. 1ª EXP</th>
                <th className="p-4 text-center">PEGAR ASSINAT.</th>
                <th className="p-4 text-center">2ª ASSIN. STRATO</th>
              </>
            ) : dpAba === 'desligamentos' ? (
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
            ) : null}

            <th className="p-6 text-right sticky right-0 bg-[var(--bg-card)] shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-20 w-[100px] min-w-[100px]">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {colaboradores.map(c => (
            <tr key={c.id} className="hover:bg-[var(--bg-base)]/50 transition-colors group cursor-pointer" onClick={() => onSelect(c)}>
              <td className="p-6 sticky left-0 bg-[var(--bg-card)] group-hover:bg-[var(--bg-base)] shadow-[4px_0_8px_rgba(0,0,0,0.1)] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center text-[0.6rem] font-black flex-shrink-0">{c.avatar}</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate max-w-[150px]">{c.nome}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">{c.cpf}</span>
                  </div>
                </div>
              </td>

              {dpAba === 'ativos' ? (
                <>
                  <td className="p-4 text-[10px] font-black text-center">{c.unidade}</td>
                  <td className="p-4 text-[10px] font-black text-center">{c.cargo}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
                  </td>
                  <td className="p-4 text-[10px] font-black text-center">{formatDate(c.data_admissao)}</td>
                  <td className="p-4 text-[10px] font-black text-center text-orange-600">{formatDate(getFutureDate(c.data_admissao, 90))}</td>
                </>
              ) : dpAba === 'arquivo' ? (
                <>
                  <td className="p-4 text-[10px] font-black text-center">{c.unidade}</td>
                  {configChecklist.map(col => (
                    <td key={col.id} className="p-4 text-center border-x border-[var(--border)]/10" style={{ backgroundColor: (col.color && col.color !== 'transparent') ? `${col.color}15` : 'transparent' }}>
                      <input 
                        type="checkbox" 
                        checked={!!(c.checklist_extra?.[col.label])} 
                        onChange={(e) => onUpdateExtraCheck?.(c.id, col.label, e.target.checked)} 
                        className="w-4 h-4 rounded border-[var(--border)] text-cyan-600 focus:ring-cyan-500" 
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
                  <td className="p-4"><input type="text" value={c.adm_telefone || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_telefone', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px] font-black" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4"><input type="date" value={c.adm_entrevista_data || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_entrevista_data', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_compareceu} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_compareceu', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4"><input type="date" value={c.adm_exame_encaminhamento || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_exame_encaminhamento', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_docs_entregues} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_docs_entregues', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_docs_completos} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_docs_completos', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_aso_liberado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_aso_liberado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4"><input type="date" value={c.adm_exame_liberacao_data || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_exame_liberacao_data', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4"><input type="date" value={c.adm_entrega_isadora_data || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_entrega_isadora_data', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_strato_cadastro} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_strato_cadastro', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4"><input type="text" value={c.adm_strato_numero || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_strato_numero', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px] font-black" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center text-[10px] font-black text-blue-600">{formatDate(c.data_admissao)}</td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_carta_banco} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_carta_banco', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_os_epi} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_os_epi', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_contrato_liberado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_contrato_liberado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_ponto_cadastrado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_ponto_cadastrado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_boas_vindas_msg} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_boas_vindas_msg', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_assinatura_isadora} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_assinatura_isadora', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_vt_enviado_dp} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_vt_enviado_dp', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_va_solicitado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_va_solicitado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_plano_saude} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_plano_saude', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_conta_banco_aberta} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_conta_banco_aberta', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_conta_strato_email} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_conta_strato_email', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_docs_strato} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_docs_strato', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4"><input type="date" value={c.adm_exp1_vencimento || ""} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_exp1_vencimento', e.target.value)} className="bg-transparent border-none p-0 w-full focus:ring-0 text-[11px]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_assinatura_encarregado} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_assinatura_encarregado', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><input type="checkbox" checked={!!c.adm_assinatura_2_strato} onChange={(e) => onUpdateAdmission?.(c.id, 'adm_assinatura_2_strato', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)]" onClick={e => e.stopPropagation()} /></td>
                </>
              ) : dpAba === 'desligamentos' ? (
                <>
                  <td className="p-4 text-center"><input type="date" value={c.data_demissao || ''} onChange={(e) => onUpdateOffboarding?.(c.id, 'data_demissao', e.target.value)} className="text-[9px] font-black bg-transparent border-[var(--border)] rounded p-1" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><select value={c.desligamento_formato || ''} onChange={(e) => onUpdateOffboarding?.(c.id, 'desligamento_formato', e.target.value)} className="text-[9px] font-black bg-transparent border-none p-1 focus:ring-0" onClick={e => e.stopPropagation()}><option value="">Selecione</option><option value="PEDIDO">Pedido</option><option value="SEM_JUSTA">Dispensa S/JC</option><option value="COM_JUSTA">Dispensa C/JC</option><option value="TERMINO">Término Contrato</option></select></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_form_preenchido" checked={c.desligamento_form_preenchido} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_email_formalizado" checked={c.desligamento_email_formalizado} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_strato_docs" checked={c.desligamento_strato_docs} /></td>
                  <td className="p-4 text-center"><input type="date" value={c.desligamento_aviso_previo_fim || ''} onChange={(e) => onUpdateOffboarding?.(c.id, 'desligamento_aviso_previo_fim', e.target.value)} className="text-[9px] font-black bg-transparent border-none p-1 focus:ring-0" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_ponto_corrigido" checked={c.desligamento_ponto_corrigido} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_exame_agendado" checked={c.desligamento_exame_agendado} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_exame_feito" checked={c.desligamento_exame_feito} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_trct_email" checked={c.desligamento_trct_email} /></td>
                  <td className="p-4 text-center"><input type="date" value={c.desligamento_trct_limite || ''} onChange={(e) => onUpdateOffboarding?.(c.id, 'desligamento_trct_limite', e.target.value)} className="text-[9px] font-black bg-transparent border-none p-1 focus:ring-0" onClick={e => e.stopPropagation()} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_trct_assinado" checked={c.desligamento_trct_assinado} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_uniforme_devolvido" checked={c.desligamento_uniforme_devolvido} /></td>
                  <td className="p-4 text-center"><OffboardingCheckbox colabId={c.id} field="desligamento_strato_final" checked={c.desligamento_strato_final} /></td>
                </>
              ) : null}

              <td className="p-6 text-right sticky right-0 bg-[var(--bg-card)] group-hover:bg-[var(--bg-base)] shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-10 w-[100px] min-w-[100px]">
                <div className="flex items-center justify-end gap-2">
                  {(dpAba === 'arquivo' || dpAba === 'desligamentos') && (
                    <button onClick={(e) => { e.stopPropagation(); onGerarPDF(c); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="PDF"><FileText size={16} /></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} className="p-2 text-[var(--brand)] hover:bg-[var(--brand)]/10 rounded-lg transition-colors" title="Editar"><Edit2 size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Modal de Configuração de Coluna */}
      {modalConfig && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-modal-fade" onClick={() => setModalConfig(null)}>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-modal-scale" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 leading-none">Ajustar Coluna</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{modalConfig.label}</p>
                </div>
              </div>
              <button onClick={() => setModalConfig(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-8">
              {/* Nome */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome da Coluna</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    defaultValue={modalConfig.label} 
                    id="newLabel"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  />
                  <button 
                    onClick={() => {
                      const val = (document.getElementById('newLabel') as HTMLInputElement).value;
                      if (val && val !== modalConfig.label) {
                        onUpdateConfigChecklist?.(modalConfig.id, val);
                        setModalConfig(null);
                      }
                    }}
                    className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg transition-all"
                  >
                    <Check size={20} />
                  </button>
                </div>
              </div>

              {/* Cores */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor de Identificação</label>
                <div className="grid grid-cols-6 gap-3">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#00d2ff', 'transparent'].map(color => (
                    <button 
                      key={color}
                      onClick={() => {
                        onUpdateConfigColor?.(modalConfig.id, color);
                        setModalConfig(null);
                      }}
                      className={`h-10 rounded-xl border-2 transition-all hover:scale-110 ${modalConfig.color === color ? 'border-cyan-600 shadow-inner' : 'border-slate-100 shadow-sm'}`}
                      style={{ backgroundColor: color === 'transparent' ? '#f8fafc' : color }}
                      title={color}
                    >
                      {color === 'transparent' && <span className="text-[8px] font-black opacity-30 uppercase">None</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Posição */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reordenar Posição</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const idx = configChecklist.findIndex(c => c.id === modalConfig.id);
                      if (idx > 0) {
                        const prev = configChecklist[idx - 1];
                        onReorderConfig?.(modalConfig.id, modalConfig.ordem || 0, prev.id, prev.ordem || 0);
                        setModalConfig(null);
                      }
                    }}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} /> Mover p/ Esquerda
                  </button>
                  <button 
                    onClick={() => {
                      const idx = configChecklist.findIndex(c => c.id === modalConfig.id);
                      if (idx < configChecklist.length - 1) {
                        const next = configChecklist[idx + 1];
                        onReorderConfig?.(modalConfig.id, modalConfig.ordem || 0, next.id, next.ordem || 0);
                        setModalConfig(null);
                      }
                    }}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    Mover p/ Direita <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Excluir */}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    if (confirm(`EXCLUIR DEFINITIVAMENTE A COLUNA "${modalConfig.label.toUpperCase()}"?\n\nAtenção: Todos os registros feitos nesta coluna serão perdidos.`)) {
                      onDeleteConfigChecklist?.(modalConfig.id);
                      setModalConfig(null);
                    }
                  }}
                  className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Excluir Coluna
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
