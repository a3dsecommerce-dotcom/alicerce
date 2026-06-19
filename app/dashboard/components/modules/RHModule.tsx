"use client";
import { useState, useEffect } from "react";
import { 
  Search, FileText, Loader, Briefcase, UserPlus, CheckCircle, ShieldCheck, Clock, Truck, Package, ArrowUpRight, Building2, Plus, Edit2, Trash2, ShieldAlert, Activity
} from "lucide-react";
import { useRHData } from "./rh/useRHData";
import ColaboradoresTable from "./rh/ColaboradoresTable";
import TalentosGrid from "./rh/TalentosGrid";
import CATSList from "./rh/CATSList";
import ExtrasList from "./rh/ExtrasList";
import FaltasList from "./rh/FaltasList";
import VolantesEscala from "./rh/VolantesEscala";
import RequisicoesRH from "./rh/RequisicoesRH";
import QuadroVagas from "./rh/QuadroVagas";
import AdmissaoModals from "./rh/AdmissaoModals";
import FichaColaborador360 from "../FichaColaborador360";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { useTransferencias } from "@/hooks/useTransferencias";
import TransferenciasList from "./encarregado/TransferenciasList";
import AdvertenciasList from "./rh/AdvertenciasList";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MasterTab = "DP" | "CATS" | "EXTRAS" | "FALTAS" | "VOLANTES" | "REQUISICOES" | "TRANSFERENCIAS" | "QUADRO" | "ADVERTENCIAS" | "ADMISSAO_RAPIDA" | "PONTO";

export default function RHModule({ user }: { user: any }) {
  const { loading, colaboradores, gestaoPropria, candidatos, cats, extras, faltas, counts, volantes, requisicoesVolantes, updateStatus, finalizarAdmissao, updateExpDecision, updateDocs, updateOffboarding, updateAdmission, addChecklistColumn, updateChecklistColumn, deleteChecklistColumn, updateChecklistColor, reorderChecklistColumn, updateExtraCheck, configChecklist, deleteExtra, refresh } = useRHData(user);
  const { transferencias, finalizarRH } = useTransferencias(user);

  const [unidades, setUnidades] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [admissao, setAdmissao] = useState({
    nome: '',
    telefone: '',
    unidade: '',
    secretaria: '',
    funcao: '',
    insalubridade: 'N/A',
    carga_horaria: '12X36',
    periodo: 'DIURNO',
    escala_tipo: 'IMPAR',
    data_referencia: new Date().toISOString().split('T')[0],
    salario_base: 0,
    valor_alimentacao: 0,
    valor_vale_transporte: 0,
    horario_entrada: '07:00',
    horario_saida: '19:00'
  });

  useEffect(() => {
    const fetchAdmissaoData = async () => {
      const { data: units } = await supabase.from('unidades').select('*').eq('status', 'ATIVO').order('nome');
      if (units) setUnidades(units);
      const { data: crgs } = await supabase.from('cargos').select('*').order('nome');
      if (crgs) setCargos(crgs);
    };
    fetchAdmissaoData();
  }, []);

  const handleSalvarAdmissao = async () => {
    if (!admissao.nome || !admissao.telefone || !admissao.unidade) {
      toast.error("Por favor, preencha todos os campos obrigatórios (Nome, Telefone e Unidade).");
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
      cargo: admissao.funcao,
      nivel: 1,
      insalubridade: parseInt(String(admissao.insalubridade).replace(/\D/g, "")) || 0,
      carga_horaria: admissao.carga_horaria,
      periodo: admissao.periodo,
      horario_entrada: admissao.horario_entrada,
      horario_saida: admissao.horario_saida,
      escala_tipo: admissao.escala_tipo,
      data_referencia_escala: admissao.data_referencia,
      salario_base: admissao.salario_base || 0,
      valor_alimentacao: admissao.valor_alimentacao || 0,
      valor_vale_transporte: admissao.valor_vale_transporte || 0,
      criado_por: user.nome || user.name || "RH"
    }]);

    if (!error) {
      toast.success("Colaborador cadastrado e ATIVO no sistema!");
      setAdmissao({
        nome: '',
        telefone: '',
        unidade: '',
        secretaria: '',
        funcao: '',
        insalubridade: 'N/A',
        carga_horaria: '12X36',
        periodo: 'DIURNO',
        escala_tipo: 'IMPAR',
        data_referencia: new Date().toISOString().split('T')[0],
        salario_base: 0,
        valor_alimentacao: 0,
        valor_vale_transporte: 0,
        horario_entrada: '07:00',
        horario_saida: '19:00'
      });
      refresh();
      setMasterTab("DP");
    } else {
      toast.error("Erro ao cadastrar: " + error.message);
    }
    setSaving(false);
  };

  const renderQuickAdmission = () => (
    <div className="flex flex-col gap-8 animate-fade-in max-w-2xl mx-auto w-full">
      <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase italic">Admissão Rápida</h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Cadastro imediato e ativo de colaborador pelo RH</p>
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
                value={admissao.funcao}
                onChange={e => {
                  const cargoNome = e.target.value;
                  const info = cargos.find(c => c.nome === cargoNome);
                  if (info) {
                    setAdmissao({
                      ...admissao,
                      funcao: cargoNome,
                      salario_base: info.salario_base,
                      valor_alimentacao: info.valor_alimentacao,
                      valor_vale_transporte: info.valor_vale_transporte,
                      insalubridade: info.insalubridade_padrao,
                      carga_horaria: info.carga_horaria_padrao,
                      periodo: info.periodo_padrao || 'DIURNO',
                      escala_tipo: info.escala_padrao || (info.carga_horaria_padrao === '44H' ? 'DIARIO' : 'IMPAR'),
                      horario_entrada: info.horario_entrada_padrao || '07:00',
                      horario_saida: info.horario_saida_padrao || '19:00'
                    });
                  } else {
                    setAdmissao({...admissao, funcao: cargoNome});
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
                  const unit = unidades.find(u => u.nome === e.target.value);
                  setAdmissao({
                    ...admissao, 
                    unidade: e.target.value,
                    secretaria: unit?.secretaria || 'SEMED' 
                  });
                }}
              >
                <option value="">Selecione o Posto...</option>
                {unidades.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
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
            <div className="flex justify-between items-center">
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
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between mt-4">
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
          Atenção: Este formulário de Admissão Rápida registra o colaborador como ATIVO imediatamente, sem passar pela esteira prévia de envio de documentos de contratação.
        </p>
      </div>
    </div>
  );
  
  
  const [masterTab, setMasterTab] = useState<MasterTab>("DP");
  const [dpAba, setDpAba] = useState<"ativos" | "talentos" | "contratacao" | "arquivo" | "desligamentos">("ativos");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [selecionado, setSelecionado] = useState<any>(null);
  const [selecionadaCAT, setSelecionadaCAT] = useState<any>(null);
  
  // Estados de Modais (Passados para subcomponentes)
  const [modalAdmissao, setModalAdmissao] = useState<any>(null);
  const [admissaoForm, setAdmissaoForm] = useState({ secretaria: "", unidade: "", cargo: "", data: new Date().toISOString().split('T')[0] });
  const [modalAfastamento, setModalAfastamento] = useState<any>(null);
  const [afastamentoData, setAfastamentoData] = useState({ motivo: "", tempo: "" });
  const [modalGerenciarColunas, setModalGerenciarColunas] = useState(false);

  const [expOnly, setExpOnly] = useState(false);

  const filtradosDP = colaboradores.filter(c => {
    if (dpAba === "arquivo") return true; 
    if (dpAba === "talentos") return false; 
    if (dpAba === "contratacao") return c.status === "EM_ADMISSAO";
    if (dpAba === "desligamentos") return c.status === "DESLIGADO";
    if (dpAba === "ativos") return c.status === "ATIVO";
    return true;
  }).filter(c => {
    if (expOnly && c.data_admissao) {
      const diff = Math.abs(new Date().getTime() - new Date(c.data_admissao).getTime());
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days <= 90;
    }
    return true;
  }).filter(c =>
    (filtro === "TODOS" || c.status === filtro) &&
    (
      (c.nome || "").toLowerCase().includes((busca || "").toLowerCase()) || 
      (c.cargo || "").toLowerCase().includes((busca || "").toLowerCase()) || 
      (c.unidade || "").toLowerCase().includes((busca || "").toLowerCase())
    )
  );

  const handleGerarPDFHistorico = async (colab: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.text("Relatório Histórico", 14, 22);
    autoTable(doc, {
      startY: 40,
      head: [['Campo', 'Informação']],
      body: [
        ['Nome', colab.nome], ['CPF', colab.cpf], ['Cargo', colab.cargo],
        ['Unidade', colab.unidade], ['Status', colab.status], ['Admissão', colab.admissao]
      ],
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] }
    });
    doc.save(`historico_${colab.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const handleUpdateStatusWrapper = async (id: string, status: string) => {
    try {
      if (status === 'AFASTADO') {
        setModalAfastamento({ id, status });
      } else {
        await updateStatus(id, status);
        toast.success("Status atualizado com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAdmissaoWrapper = async () => {
    try {
      await finalizarAdmissao(modalAdmissao, admissaoForm);
      setModalAdmissao(null);
      setDpAba("ativos");
      toast.success("Colaborador admitido oficialmente!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleConfirmarAfastamento = async () => {
    const { error } = await supabase.from('usuarios').update({ 
       status: 'AFASTADO',
       metadados: { motivo_afastamento: afastamentoData.motivo, tempo_afastamento: afastamentoData.tempo, data_afastamento: new Date().toISOString() }
    }).eq('id', modalAfastamento.id);
     if (!error) {
        setModalAfastamento(null);
        refresh();
        toast.warning("Afastamento registrado no sistema.");
     }
  };

  const handleUpdateCATStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('investigacao_cat').update({ status }).eq('id', id);
    if (!error) {
      toast.success("Status da CAT atualizado!");
      setSelecionadaCAT(null);
      refresh();
    } else {
      toast.error("Erro ao atualizar status da CAT");
    }
  };

  const handleUpdateExpDecisionWrapper = async (id: string, stage: 'exp1_decisao' | 'exp2_decisao', decision: string) => {
    try {
      await updateExpDecision(id, stage, decision);
      toast.success("Decisão registrada!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateDocs = async (id: string, field: string, value: boolean) => {
    try {
      await updateDocs(id, field, value);
      toast.success("Checklist atualizado!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleGerarPDFCAT = async (cat: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header - Clean for B&W
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ALICERCE", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text(`INVESTIGACAO DE ACIDENTE DE TRABALHO (${cat.tipo_acidente})`, pageWidth / 2, 25, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("DOCUMENTO INTERNO PARA CONTROLE DE SEGURANCA E SAUDE DO TRABALHO", pageWidth / 2, 32, { align: "center" });
    doc.line(15, 38, pageWidth - 15, 38);

    // 1. Identificação
    autoTable(doc, {
      startY: 45,
      head: [['1. IDENTIFICACAO DO ACIDENTADO', '']],
      body: [
        ['NOME COMPLETO:', cat.colaborador_nome],
        ['CPF:', cat.colaborador_cpf || 'NAO INFORMADO'],
        ['CARGO:', cat.colaborador_cargo],
        ['UNIDADE ATENDIDA:', cat.unidade_alocada],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // 2. Ocorrência (Variavel)
    const ocorrenciaBody = [
      ['DATA DO ACIDENTE:', cat.data_ocorrido],
    ];
    if (cat.tipo_acidente !== 'DOENCA') {
      ocorrenciaBody.push(
        ['HORARIO:', cat.horario_ocorrido],
        ['LOCAL EXATO:', cat.local_ocorrido],
        ['DESCRICAO DO LOCAL:', cat.descricao_local],
        ['ENDERECO DO ACIDENTE:', cat.dados_especificos?.endereco_acidente || 'NAO INFORMADO']
      );
    } else {
      ocorrenciaBody.push(
        ['DATA INICIO SINTOMAS:', cat.dados_especificos?.data_inicio_sintomas || 'NAO INFORMADO'],
        ['MEDICO AVALIADOR:', cat.dados_especificos?.medico_avaliador || 'NAO INFORMADO']
      );
    }

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['2. DETALHES DA OCORRENCIA', '']],
      body: ocorrenciaBody,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // Bloco Condicional de Segurança
    if (cat.tipo_acidente === 'TIPICO') {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['3. ANALISE DE SEGURANCA (ACIDENTE TIPICO)', '']],
        body: [
          ['ATIVIDADE NO MOMENTO:', cat.dados_especificos?.atividade_momento || 'NAO INFORMADO'],
          ['EPIs UTILIZADOS:', (cat.dados_especificos?.epis_usados || []).join(', ') || 'NENHUM'],
          ['CONDICAO/ATO INSEGURO:', cat.dados_especificos?.condicao_insegura_ou_ato || 'NAO INFORMADO'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    } else if (cat.tipo_acidente === 'TRAJETO') {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['3. ANALISE DE DESLOCAMENTO (TRAJETO)', '']],
        body: [
          ['SENTIDO DO TRAJETO:', cat.dados_especificos?.sentido_trajeto || 'NAO INFORMADO'],
          ['MEIO DE TRANSPORTE:', cat.dados_especificos?.meio_transporte || 'NAO INFORMADO'],
          ['COMPROVACAO DE ROTA:', cat.dados_especificos?.comprovacao_rota || 'NAO INFORMADO'],
          ['CONDICOES DA VIA:', cat.dados_especificos?.condicoes_via || 'NAO INFORMADO'],
          ['HOUVE TERCEIROS?:', cat.dados_especificos?.houve_terceiros ? 'SIM' : 'NAO'],
          ['CNH / B.O.:', cat.dados_especificos?.cnh_boletim || 'NAO INFORMADO'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    }

    // Narrativa
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['NARRATIVA DA INVESTIGACAO']],
      body: [
        [{ content: 'DESCRICAO DETALHADA DO OCORRIDO:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: cat.descricao_ocorrido, styles: { halign: 'justify' } }],
        [{ content: 'ACOES TOMADAS DURANTE A OCORRENCIA:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: cat.acoes_tomadas || 'NAO INFORMADO', styles: { halign: 'justify' } }],
        [{ content: 'RELATO PESSOAL DO ACIDENTADO:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: cat.relato_pessoal || 'NAO INFORMADO', styles: { halign: 'justify' } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Analise Tecnica
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['ANALISE TECNICA E ACOMPANHAMENTO', '']],
      body: [
        ['AGENTE CAUSADOR:', cat.agente_causador || 'NAO INFORMADO'],
        ['PARTE DO CORPO ATINGIDA:', cat.parte_corpo_atingida || 'NAO INFORMADO'],
        ['ACOMPANHAMENTO ATUAL:', cat.acompanhamento_medico || 'NAO INFORMADO'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // Conclusao
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['CONCLUSAO E MEDIDAS PREVENTIVAS']],
      body: [
        [{ content: 'REAL MOTIVO (CAUSA RAIZ):', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: cat.real_motivo || 'NAO INFORMADO', styles: { halign: 'justify' } }],
        [{ content: 'SOLUCOES PROPOSTAS PARA EVITAR RECORRENCIA:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: cat.solucoes_propostas || 'NAO INFORMADO', styles: { halign: 'justify' } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    doc.save(`CAT_${cat.colaborador_nome.replace(/\s+/g, '_')}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ANALISE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FINALIZADO': return 'bg-green-100 text-green-700 border-green-200';
      case 'ENVIADO_RH': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) return (
    <div className="p-20">
      <TableSkeleton rows={8} cols={5} />
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      <div className="flex flex-col gap-6">
        <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">RH Master & Gestão Administrativa</h2>
        <div className="flex flex-wrap gap-8 border-b border-[var(--border)] pb-4">
          {[
            { id: "DP", label: "Dep. Pessoal (DP)", icon: Briefcase },
            { id: "CATS", label: "CATs", icon: ShieldCheck, badge: counts.catsPending },
            { id: "EXTRAS", label: "Extras", icon: Clock, badge: counts.extrasCycle },
            { id: "FALTAS", label: "Faltas", icon: Clock, badge: counts.faltasPending },
            { id: "VOLANTES", label: "Escala Volantes", icon: Truck },
            { id: "REQUISICOES", label: "Requisições", icon: Package },
            { id: "TRANSFERENCIAS", label: "Transferências", icon: ArrowUpRight, badge: transferencias.filter(t => t.status === 'SOLICITADO').length },
            { id: "QUADRO", label: "Quadro de Vagas", icon: Building2 },
            { id: "ADVERTENCIAS", label: "Advertências", icon: ShieldAlert },
            { id: "ADMISSAO_RAPIDA", label: "Admissão Rápida", icon: UserPlus },
            { id: "PONTO", label: "Gestão de Ponto", icon: Clock }
          ].map((t: any) => (
            <button key={t.id} onClick={() => {
              if (t.id === "PONTO") {
                window.location.href = "/dashboard/rh/ponto";
              } else {
                setMasterTab(t.id as any);
              }
            }} className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] pb-3 transition-all relative ${masterTab === t.id ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
              <t.icon size={16} /> 
              {t.label}
              {t.badge > 0 && (
                <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-1 animate-pulse">
                  {t.badge}
                </span>
              )}
              {masterTab === t.id && <div className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-[var(--brand)] rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-8">
        {masterTab === "DP" && (
          <div className="flex flex-col gap-8 flex-1 overflow-hidden animate-fade-in">
             <div className="flex gap-6 bg-[var(--bg-base)]/30 p-1.5 rounded-2xl w-fit border border-[var(--border)]/50">
                 {[
                   { id: "talentos", label: "Talentos", count: candidatos.filter(c => c.status_candidato !== 'CONTRATADO').length },
                   { id: "contratacao", label: "Admitidos (Pré)", count: counts.totalAdmitidos },
                   { id: "ativos", label: "Colab. Ativos", count: counts.totalOficiais },
                   { id: "desligamentos", label: "Desligamentos", count: colaboradores.filter(c => c.status === 'DESLIGADO').length },
                   { id: "arquivo", label: "Checklist Documentos", count: colaboradores.length }
                 ].map((t: any) => (
                   <button key={t.id} onClick={() => { setDpAba(t.id); setExpOnly(false); }} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dpAba === t.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>{t.label} ({t.count})</button>
                 ))}
             </div>

             <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-2xl flex-1 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="relative flex-1 w-full max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <input className="input-field w-full pl-12" placeholder="Buscar no DP..." value={busca} onChange={e => setBusca(e.target.value)} />
                   </div>
                   <div className="flex gap-2 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                      {dpAba === 'arquivo' && (
                        <div className="flex gap-2">
                          <button 
                            className="px-6 py-2 rounded-lg text-[9px] font-black uppercase bg-green-600 text-white hover:bg-green-700 transition-all flex items-center gap-2"
                            onClick={() => {
                              const label = prompt("Nome da nova coluna de checklist:");
                              if (label) addChecklistColumn(label);
                            }}
                          >
                            <Plus size={14} /> Adicionar
                          </button>
                          <button 
                            className="px-6 py-2 rounded-lg text-[9px] font-black uppercase bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
                            onClick={() => setModalGerenciarColunas(true)}
                          >
                            <FileText size={14} /> Gerenciar Colunas
                          </button>
                        </div>
                      )}
                      {dpAba === 'ativos' && (
                        <button className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${expOnly ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)]'}`} onClick={() => setExpOnly(!expOnly)}>Em Experiência</button>
                      )}
                      {["TODOS", "ATIVO", "AFASTADO", "INATIVO", "DESLIGADO"].map(f => (
                        <button key={f} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filtro === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)]'}`} onClick={() => setFiltro(f)}>{f}</button>
                      ))}
                   </div>
                </div>

                 <div className="flex-1 overflow-auto custom-scrollbar p-8">
                    {dpAba === 'talentos' ? (
                       <TalentosGrid candidatos={candidatos.filter(c => c.status_candidato !== 'CONTRATADO')} onAdmitir={(c) => { setAdmissaoForm({...admissaoForm, cargo: c.cargo_pretendido || c.cargo || ""}); setModalAdmissao(c); }} />
                    ) : (
                       <ColaboradoresTable 
                         colaboradores={filtradosDP} 
                         dpAba={dpAba}
                         onSelect={setSelecionado} 
                         onUpdateStatus={handleUpdateStatusWrapper} 
                         onGerarPDF={handleGerarPDFHistorico}
                         onUpdateDocs={handleUpdateDocs}
                         onUpdateExpDecision={handleUpdateExpDecisionWrapper}
                         onUpdateOffboarding={updateOffboarding}
                         onUpdateAdmission={updateAdmission}
                         configChecklist={configChecklist}
                         onUpdateExtraCheck={updateExtraCheck}
                         onUpdateConfigChecklist={updateChecklistColumn}
                         onDeleteConfigChecklist={deleteChecklistColumn}
                         onUpdateConfigColor={updateChecklistColor}
                         onReorderConfig={reorderChecklistColumn}
                         user={user}
                       />
                    )}
                 </div>
             </div>
          </div>
        )}

        {masterTab === "CATS" && (
           <CATSList cats={cats} onSelect={setSelecionadaCAT} />
        )}

        {masterTab === "EXTRAS" && (
           <ExtrasList extras={extras} onDelete={async (id) => {
              const justificativa = prompt("JUSTIFICATIVA DE AUDITORIA: Por que este registro está sendo excluído?");
              if (justificativa) {
                 try {
                    await deleteExtra(id, justificativa);
                    toast.success("Registro excluído e auditado.");
                 } catch (e: any) {
                    toast.error("Erro ao excluir: " + e.message);
                 }
              }
           }} />
        )}

        {masterTab === "FALTAS" && (
           <FaltasList faltas={faltas} onDelete={async (id) => {
              const justificativa = prompt("JUSTIFICATIVA DE AUDITORIA: Por que este registro de FALTA está sendo excluído?");
              if (justificativa) {
                 try {
                    await deleteExtra(id, justificativa); // Reutilizamos a função de deletar informativos
                    toast.success("Falta excluída e auditada.");
                 } catch (e: any) {
                    toast.error("Erro ao excluir: " + e.message);
                 }
              }
           }} />
        )}

        {masterTab === "VOLANTES" && (
           <VolantesEscala volantes={volantes} requisicoes={requisicoesVolantes} refresh={refresh} user={user} />
        )}

        {masterTab === "REQUISICOES" && (
           <RequisicoesRH user={user} />
        )}

        {masterTab === "TRANSFERENCIAS" && (
           <TransferenciasList 
             transferencias={transferencias} 
             onAction={async (id, decisao, justificativa) => {
                try {
                  await finalizarRH(id, justificativa);
                  toast.success("Transferência aceita (RH ciente)!");
                } catch(e: any) {
                  toast.error("Erro: " + e.message);
                }
             }}
           />
        )}

        {masterTab === "QUADRO" && (
          <QuadroVagas />
        )}

        {masterTab === "ADVERTENCIAS" && (
          <AdvertenciasList user={user} />
        )}

        {masterTab === "ADMISSAO_RAPIDA" && (
          renderQuickAdmission()
        )}
      </div>

      <AdmissaoModals 
        modalAdmissao={modalAdmissao} setModalAdmissao={setModalAdmissao} 
        admissaoForm={admissaoForm} setAdmissaoForm={setAdmissaoForm} onAdmissaoFinal={handleAdmissaoWrapper}
        modalAfastamento={modalAfastamento} setModalAfastamento={setModalAfastamento}
        afastamentoData={afastamentoData} setAfastamentoData={setAfastamentoData} onConfirmarAfastamento={handleConfirmarAfastamento}
      />

      <FichaColaborador360 colabId={selecionado?.id} isOpen={!!selecionado} onClose={() => setSelecionado(null)} canEdit={true} restrictLevel={user.nivel < 3} />

      {/* Modal de Detalhes da CAT */}
      <AdaptiveModal isOpen={!!selecionadaCAT} onClose={() => setSelecionadaCAT(null)} title="Investigação de Acidente (CAT)">
         <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-6 p-6 bg-red-50 rounded-2xl border border-red-100">
               <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <h4 className="text-base font-black text-red-900 uppercase">{selecionadaCAT?.colaborador_nome}</h4>
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest">{selecionadaCAT?.colaborador_cargo} • {selecionadaCAT?.unidade_alocada}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Data/Hora</p>
                  <p className="text-xs font-black uppercase text-[var(--text-primary)]">
                    {selecionadaCAT?.data_ocorrido && format(new Date(selecionadaCAT.data_ocorrido), "dd/MM/yyyy")} às {selecionadaCAT?.horario_ocorrido}
                  </p>
               </div>
               <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Tipo de Acidente</p>
                  <p className="text-xs font-black uppercase text-red-600 italic">{selecionadaCAT?.tipo_acidente}</p>
               </div>
               <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Status Atual</p>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusColor(selecionadaCAT?.status)}`}>
                     {selecionadaCAT?.status?.replace('_', ' ')}
                  </span>
               </div>
            </div>

            {/* Detalhes Específicos do Acidente */}
            <div className="space-y-4">
               <h5 className="text-[10px] font-black uppercase text-[var(--brand)] italic">Detalhes Específicos</h5>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl">
                  {selecionadaCAT?.dados_especificos?.endereco_acidente && (
                     <div className="md:col-span-2">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Endereço da Ocorrência</p>
                        <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos.endereco_acidente}</p>
                     </div>
                  )}
                  
                  {selecionadaCAT?.tipo_acidente === 'TRAJETO' && (
                     <>
                        <div>
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Sentido / Transporte</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos?.sentido_trajeto} • {selecionadaCAT.dados_especificos?.meio_transporte}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Rota Habitual?</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos?.comprovacao_rota}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Condições da Via</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos?.condicoes_via || 'NÃO INFORMADO'}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Terceiros Envolvidos?</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos?.houve_terceiros ? `SIM (${selecionadaCAT.dados_especificos?.cnh_boletim})` : 'NÃO'}</p>
                        </div>
                     </>
                  )}

                  {selecionadaCAT?.tipo_acidente === 'TIPICO' && (
                     <>
                        <div className="md:col-span-2">
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Atividade no Momento</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos?.atividade_momento || 'NÃO INFORMADO'}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">EPIs Utilizados</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{(selecionadaCAT.dados_especificos?.epis_usados || []).join(", ") || "NENHUM"}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Ato / Condição Insegura</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos?.condicao_insegura_ou_ato?.replace(/_/g, ' ') || 'NÃO INFORMADO'}</p>
                        </div>
                     </>
                  )}

                  {selecionadaCAT?.tipo_acidente === 'DOENCA' && (
                     <>
                        <div>
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Início dos Sintomas</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos?.data_inicio_sintomas ? format(new Date(selecionadaCAT.dados_especificos.data_inicio_sintomas), "dd/MM/yyyy") : 'NÃO INFORMADO'}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Médico Avaliador</p>
                           <p className="text-[11px] font-bold text-[var(--text-primary)]">{selecionadaCAT.dados_especificos?.medico_avaliador || 'NÃO INFORMADO'}</p>
                        </div>
                     </>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <h5 className="text-[10px] font-black uppercase text-[var(--brand)] flex items-center gap-2 italic">
                  <FileText size={14} /> Narrativa da Ocorrência
               </h5>
               <div className="p-6 bg-white border border-[var(--border)] rounded-2xl">
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">{selecionadaCAT?.descricao_ocorrido}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-[var(--brand)] italic">Ações Tomadas</h5>
                  <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] min-h-[80px]">
                     <p className="text-[11px] font-medium text-[var(--text-secondary)]">{selecionadaCAT?.acoes_tomadas || "Nenhuma ação registrada."}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-[var(--brand)] italic">Parte do Corpo Atingida</h5>
                  <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] min-h-[80px]">
                     <p className="text-[11px] font-medium text-[var(--text-secondary)]">{selecionadaCAT?.parte_corpo_atingida || "Não informado."}</p>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-[var(--border)] flex flex-wrap gap-4">
               <button 
                  onClick={() => handleUpdateCATStatus(selecionadaCAT.id, 'FINALIZADO')}
                  className="flex-1 py-4 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2"
               >
                  <CheckCircle size={16} /> Finalizar Processo
               </button>
               <button 
                  onClick={() => handleGerarPDFCAT(selecionadaCAT)}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
               >
                  <FileText size={16} /> Gerar PDF Investigação
               </button>
            </div>
         </div>
      </AdaptiveModal>

         {/* Modal Gerenciar Colunas */}
         <AdaptiveModal isOpen={modalGerenciarColunas} onClose={() => setModalGerenciarColunas(false)} title="Gerenciar Colunas do Checklist">
            <div className="p-6">
               <p className="text-xs text-[var(--text-muted)] mb-6 font-medium text-center">Lista de todas as colunas personalizadas criadas para o checklist de documentos.</p>
               
               <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {configChecklist.length === 0 ? (
                     <div className="text-center py-8 text-[var(--text-muted)] italic text-xs">Nenhuma coluna personalizada criada.</div>
                  ) : (
                     configChecklist.map(col => (
                        <div key={col.id} className="flex items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl group hover:border-[var(--brand)] transition-all">
                           <span className="text-xs font-black uppercase tracking-tight">{col.label}</span>
                           <div className="flex gap-2">
                              <button 
                                 onClick={() => {
                                    const novo = prompt("Novo nome para a coluna:", col.label);
                                    if (novo && novo !== col.label) updateChecklistColumn(col.id, novo);
                                 }}
                                 className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                 title="Renomear"
                              >
                                 <Edit2 size={16} />
                              </button>
                              <button 
                                 onClick={() => {
                                    if (confirm(`EXCLUIR COLUNA "${col.label.toUpperCase()}"?\nTodos os checks feitos nesta coluna serão apagados.`)) {
                                       deleteChecklistColumn(col.id);
                                    }
                                 }}
                                 className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                 title="Excluir"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>

               <button 
                  onClick={() => setModalGerenciarColunas(false)}
                  className="w-full mt-8 py-4 bg-[var(--brand)] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
               >
                  Fechar Gerenciamento
               </button>
            </div>
         </AdaptiveModal>
    </div>
  );
}
