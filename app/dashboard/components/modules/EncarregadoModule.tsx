"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Activity, ShieldCheck, AlertTriangle, 
  Clock, Package, MapPin, Search, Filter, Trash2,
  CheckCircle, ArrowUpRight, Building2, User, UserPlus, Edit3,
  Settings, Save, Lock, LogOut, Send, Archive, Plus, Trophy, ShieldAlert, Printer,
  BriefcaseBusiness, CalendarX, UserX, Bell
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getBusinessHoursElapsed } from "@/utils/dateUtils";
// jsPDF e autoTable carregados sob-demanda (lazy) para reduzir bundle inicial em ~800KB
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import UserSearchInput from "@/components/ui/UserSearchInput";
import FichaColaborador360 from "../FichaColaborador360";
import DisciplinaPanel from "./encarregado/DisciplinaPanel";
import TransferenciasList from "./encarregado/TransferenciasList";
import { useTransferencias } from "@/hooks/useTransferencias";
import {
  MyUnitsTab,
  MyColabsTab,
  QuickAdmissionTab,
  InformativosTab,
  MyMissionsTab,
} from "./encarregado";

export default function EncarregadoModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"MY_UNITS" | "MY_COLABS" | "QUICK_ADMISSION" | "TICKETS" | "REPORTS" | "CAT" | "EPI" | "MY_MISSIONS" | "DISCIPLINA" | "TRANSFERENCIAS" | "AVISO_EXP">(() => {
    if (!initialTab) return "MY_UNITS";
    const t = initialTab.toUpperCase();
    if (t === "VISAO" || t === "UNIDADES") return "MY_UNITS";
    if (t === "EQUIPE" || t === "COLABS") return "MY_COLABS";
    if (t === "ADMISSAO" || t === "CADASTRO") return "QUICK_ADMISSION";
    if (t === "TICKETS" || t === "OCORRENCIAS") return "TICKETS";
    if (t === "INFORMATIVOS" || t === "REPORTS") return "REPORTS";
    if (t === "CAT" || t === "ACIDENTE") return "CAT";
    if (t === "EPI" || t === "ENTREGA") return "EPI";
    if (t === "MISSOES" || t === "MISSIONS") return "MY_MISSIONS";
    if (t === "DISCIPLINA" || t === "ADVERTENCIAS") return "DISCIPLINA";
    if (t === "TRANSFERENCIAS" || t === "TRANSFERENCIAS") return "TRANSFERENCIAS";
    if (t === "AVISO_EXP" || t === "AVISO") return "AVISO_EXP";
    return "MY_UNITS";
  });
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [fullUnits, setFullUnits] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [myColabs, setMyColabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { transferencias, analisarEncarregado, criarSolicitacao, refresh: refreshTransf } = useTransferencias(user);

  const [admissao, setAdmissao] = useState<any>({ 
    nome: '', telefone: '', unidade: '', secretaria: '', funcao: '',
    insalubridade: 'N/A', carga_horaria: '44H', periodo: 'DIURNO',
    horario_entrada: '07:00', horario_saida: '17:00',
    escala_tipo: 'DIARIO', data_referencia: new Date().toISOString().split('T')[0],
    salario_base: 0, valor_alimentacao: 0, valor_vale_transporte: 0
  });
  const [editandoColab, setEditandoColab] = useState<any>(null);
  const [justificativa, setJustificativa] = useState("");
  const [selectedTransferColabId, setSelectedTransferColabId] = useState("");
  const [destinationUnitName, setDestinationUnitName] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [filtroUnidadeOcorrencia, setFiltroUnidadeOcorrencia] = useState("");
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [advertencias, setAdvertencias] = useState<any[]>([]);
  const [historicoInformativos, setHistoricoInformativos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalUnidade, setModalUnidade] = useState<any>(null);
  const [unidadeEditando, setUnidadeEditando] = useState<any>(null);
  const [informativo, setInformativo] = useState<any>({
    tipo: 'EXTRA',
    unidade: '',
    data: new Date().toISOString().split('T')[0],
    periodo: 'DIURNO',
    horario: '',
    colaborador_substituto_id: '',
    colaborador_substituto_nome: '',
    colaborador_ausente_id: '',
    colaborador_ausente_nome: '',
    tem_atestado: false,
    dias_atestado: 0,
     justificada: false,
     sugestao_punicao: '',
     observacoes: ''
   });

   const [catForm, setCatForm] = useState<any>({
    colaborador_id: '', colaborador_nome: '', colaborador_cpf: '', colaborador_cargo: '', unidade_alocada: '',
    insalubridade: '', horario_trabalho: '',
    data_ocorrido: new Date().toISOString().split('T')[0],
    horario_ocorrido: '08:00',
    local_ocorrido: '',
    descricao_local: '',
    tipo_acidente: 'TIPICO',
    descricao_ocorrido: '',
    relato_pessoal: '',
    tem_testemunha: false,
    testemunhas_detalhes: '',
    acoes_tomadas: '',
    agente_causador: '',
    parte_corpo_atingida: '',
    acompanhamento_medico: '',
    real_motivo: '',
    solucoes_propostas: '',
    endereco_acidente: '',
    sentido_trajeto: 'CASA_TRABALHO',
    meio_transporte: '',
    comprovacao_rota: '',
    houve_terceiros: false,
    cnh_boletim: '',
    condicoes_via: '',
    atividade_momento: '',
    epis_usados: [],
    condicao_insegura_ou_ato: '',
    data_inicio_sintomas: '',
    medico_avaliador: ''
  });
  const [historicoCats, setHistoricoCats] = useState<any[]>([]);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
   const [epiData, setEpiData] = useState<any>({
     colaborador_nome: '',
     unidade: '',
     itens: [] as any[]
   });
   const [estoqueEpi, setEstoqueEpi] = useState<any[]>([]);
   const [entregasEpi, setEntregasEpi] = useState<any[]>([]);

   const [buscaColab, setBuscaColab] = useState("");
   const [colabsSugeridos, setColabsSugeridos] = useState<any[]>([]);
   const [campoBuscaAtivo, setCampoBuscaAtivo] = useState<"interessado" | "citado" | "substituto" | "ausente" | "acidentado" | "epi_recebedor" | "cat_colaborador" | "">("interessado");

   const [entregaConfirmadaData, setEntregaConfirmadaData] = useState<any>(null);

   const [filtroUnidadeColab, setFiltroUnidadeColab] = useState("");
   const [filtroCargoColab, setFiltroCargoColab] = useState("");

   // Pedidos de transferência enviados pelos colaboradores
   const [pedidosColab, setPedidosColab] = useState<any[]>([]);
   const [analisandoPedido, setAnalisandoPedido] = useState<any>(null);
   const [respostaPedidoText, setRespostaPedidoText] = useState("");

   // MISSIONS STATE (Top level to avoid Error #310)
   const [missoesAtivas, setMissoesAtivas] = useState<any[]>([]);
   const [selectedMissao, setSelectedMissao] = useState<any>(null);
   const [respostasMissao, setRespostasMissao] = useState<any>({});
   const [submittingMissao, setSubmittingMissao] = useState(false);
   
   // PRINT ROUTE STATE
   const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
   const [printFields, setPrintFields] = useState({
     unidade: true,
     colaboradores: true,
     telefone: true,
     insalubridade: true,
     funcao: true,
     horario: true
   });

   const [selectedTicket, setSelectedTicket] = useState<any>(null);
   const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
   const [setorDestino, setSetorDestino] = useState("RH Recursos Humanos");
   const [motivoRejeicao, setMotivoRejeicao] = useState("");
   const [showRejeitarForm, setShowRejeitarForm] = useState(false);
   const [showEncaminharForm, setShowEncaminharForm] = useState(false);

   const handleRecusarTicket = async () => {
     if (!motivoRejeicao) { toast.warning("Por favor, informe o motivo do cancelamento."); return; }
     setSaving(true);
     try {
       const { error } = await supabase
         .from('tickets_sla')
         .update({
           status: 'REJEITADO',
           solucao_descricao: `REJEITADO PELO ENCARREGADO: ${motivoRejeicao}`,
           resolvido_por_id: user.id,
           resolvido_por_nome: user.nome || user.name,
           data_fechamento: new Date().toISOString()
         })
         .eq('id', selectedTicket.id);

       if (error) throw error;

       await supabase.from('atividades').insert({
         usuario_id: user.id,
         usuario_nome: user.nome || user.name,
         mensagem: `Encarregado rejeitou chamado #${selectedTicket.id.slice(0, 8)}: ${motivoRejeicao}`,
         tipo: "OCORRENCIA"
       });

       toast.success("Ocorrência rejeitada!");
       setIsTicketModalOpen(false);
       setSelectedTicket(null);
       setMotivoRejeicao("");
       setShowRejeitarForm(false);
       fetchEncarregadoData();
     } catch (e: any) {
       toast.error("Erro ao processar: " + e.message);
     } finally {
       setSaving(false);
     }
   };

   const handleEncaminharTicket = async () => {
     if (!setorDestino) { toast.warning("Selecione o setor de destino."); return; }
     setSaving(true);
     try {
       const { error } = await supabase
         .from('tickets_sla')
         .update({
           setor_destino: setorDestino,
           status: 'PENDENTE',
           justificativa_solucao: `Aprovado pelo Encarregado ${user.nome || user.name} e encaminhado para ${setorDestino}.`
         })
         .eq('id', selectedTicket.id);

       if (error) throw error;

       await supabase.from('atividades').insert({
         usuario_id: user.id,
         usuario_nome: user.nome || user.name,
         mensagem: `Encarregado aprovou e encaminhou chamado #${selectedTicket.id.slice(0, 8)} para ${setorDestino}`,
         tipo: "OCORRENCIA"
       });

       toast.success(`Ocorrência encaminhada para ${setorDestino}!`);
       setIsTicketModalOpen(false);
       setSelectedTicket(null);
       setShowEncaminharForm(false);
       fetchEncarregadoData();
     } catch (e: any) {
       toast.error("Erro ao encaminhar: " + e.message);
     } finally {
       setSaving(false);
     }
   };

   // MEMOIZAÇÃO: Filtros da aba Equipe — evita re-cálculo a cada render do componente pai
   const colabsFiltrados = useMemo(() =>
     myColabs.filter(c =>
       ((c.nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
       (c.cpf || "").includes(searchTerm)) &&
       (filtroUnidadeColab === "" || c.unidade_alocacao === filtroUnidadeColab) &&
       (filtroCargoColab === "" || (c.funcao || c.cargo || 'OPERACIONAL') === filtroCargoColab)
     ),
     [myColabs, searchTerm, filtroUnidadeColab, filtroCargoColab]
   );

   const selecionarColab = (colab: any) => {
     if (campoBuscaAtivo === "substituto") {
       setInformativo({
         ...informativo,
         colaborador_substituto_id: colab.id,
         colaborador_substituto_nome: colab.nome
       });
     } else if (campoBuscaAtivo === "ausente") {
       setInformativo({
         ...informativo,
         colaborador_ausente_id: colab.id,
         colaborador_ausente_nome: colab.nome
       });
     } else if (campoBuscaAtivo === "acidentado") {
       setCatForm({
         ...catForm,
         colaborador_id: colab.id,
         colaborador_nome: colab.nome,
         colaborador_cpf: colab.cpf || "",
         colaborador_cargo: colab.cargo || colab.funcao || "",
         unidade_alocada: colab.unidade_alocacao || ""
       });
     } else if (campoBuscaAtivo === "epi_recebedor") {
       setEpiData({
         ...epiData,
         colaborador_nome: colab.nome,
         unidade: colab.unidade_alocacao || epiData.unidade
       });
     }
     setBuscaColab("");
     setColabsSugeridos([]);
   };

  useEffect(() => {
    if (user) {
      fetchEncarregadoData();
    }
  }, [user]);

  const fetchEncarregadoData = async () => {
    setLoading(true);
    try {
      // Fix #3: queries paralelas para reduzir tempo de carregamento no campo (4G)
      const [unitsRes, cargosRes, episRes, entregasRes, allUnitsRes] = await Promise.all([
        supabase.from('unidades').select('*').eq('encarregado_id', user.id),
        supabase.from('cargos').select('*').order('nome'),
        supabase.from('almox_epi').select('*').gt('quantidade', 0).order('item'),
        supabase.from('requisicoes').select('*').eq('tipo_item', 'EPI').eq('status', 'ENTREGUE')
          .order('data_solicitacao', { ascending: false }).limit(20),
        supabase.from('unidades').select('*').order('nome')
      ]);

      const units = unitsRes.data || [];
      const unitNames = units.map((u: any) => u.nome);

      setMyUnits(unitNames);
      setFullUnits(units);
      setAllUnits(allUnitsRes.data || []);
      if (cargosRes.data) setCargos(cargosRes.data);
      setEstoqueEpi(episRes.data || []);
      setEntregasEpi(entregasRes.data || []);

      // Queries dependentes de unitNames
      let activeColabIds: string[] = [];
      if (unitNames.length > 0) {
        const [colabsRes, ticketsRes, advRes] = await Promise.all([
          supabase.from('usuarios').select('*').in('unidade_alocacao', unitNames),
          supabase.from('tickets_sla').select('*')
            .or(`unidade.in.(${unitNames.map((u: string) => `"${u}"`).join(',')}),responsavel_citado_id.eq.${user.id},setor_destino.eq.${user.secretaria}`)
            .order('data_abertura', { ascending: false }),
          supabase.from('processos_disciplinares').select('*')
            .in('unidade_alocada', unitNames)
        ]);
        const colabList = colabsRes.data || [];
        setMyColabs(colabList);
        activeColabIds = colabList.map((c: any) => c.id);
        setOcorrencias(ticketsRes.data || []);
        setAdvertencias(advRes.data || []);
      } else {
        // Sem unidades: busca só tickets pessoais
        const { data: tickets } = await supabase
          .from('tickets_sla').select('*')
          .or(`responsavel_citado_id.eq.${user.id},setor_destino.eq.${user.secretaria}`)
          .order('data_abertura', { ascending: false });
        setOcorrencias(tickets || []);
      }

      // Busca informativos do encarregado logado
      const [infoDataRes, catDataRes, pedidosRes] = await Promise.all([
        supabase
          .from('informativos_operacionais')
          .select('*')
          .eq('criado_por_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('investigacao_cat')
          .select('*')
          .eq('encarregado_responsavel_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('pedidos_transferencia_colaborador')
          .select('*')
          .order('created_at', { ascending: false })
      ]);
      setHistoricoInformativos(infoDataRes.data || []);
      setHistoricoCats(catDataRes.data || []);
      
      if (activeColabIds.length > 0) {
        const filtered = (pedidosRes.data || []).filter((p: any) => activeColabIds.includes(p.colaborador_id));
        setPedidosColab(filtered);
      } else {
        setPedidosColab([]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do encarregado:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintRoute = async () => {
    // Lazy load do jsPDF — carregado apenas quando necessário (~800KB)
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(22);
    doc.text("ROTEIRO OPERACIONAL - ALICERCE", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Encarregado: ${user.nome} | Data: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });
    
    const tableData: any[] = [];
    const headers: string[] = [];
    
    // Unidade agora é um cabeçalho de seção, não uma coluna
    if (printFields.colaboradores) headers.push("COLABORADOR");
    if (printFields.funcao) headers.push("FUNÇÃO");
    if (printFields.telefone) headers.push("TELEFONE");
    if (printFields.insalubridade) headers.push("INSAL.");
    if (printFields.horario) headers.push("HORÁRIO");

    const unitsToPrint = activeTab === "MY_COLABS" && filtroUnidadeColab ? [filtroUnidadeColab] : myUnits;

    unitsToPrint.forEach(unitName => {
      const unitColabs = myColabs.filter(c => c.unidade_alocacao === unitName);
      
      // Linha de Seção da Unidade
      tableData.push([
        { 
          content: `UNIDADE: ${unitName.toUpperCase()}`, 
          colSpan: headers.length, 
          styles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10, cellPadding: 3 } 
        }
      ]);

      if (unitColabs.length === 0) {
        tableData.push([
          { content: "NENHUM COLABORADOR CADASTRADO NESTA UNIDADE", colSpan: headers.length, styles: { halign: 'center', italic: true, textColor: [150, 150, 150], fontSize: 8 } }
        ]);
      } else {
        unitColabs.forEach((c) => {
          const row: any[] = [];
          if (printFields.colaboradores) row.push(c.nome);
          if (printFields.funcao) row.push(c.funcao || c.cargo || "---");
          if (printFields.telefone) row.push(c.telefone || "---");
          if (printFields.insalubridade) row.push(c.percentual_insalubridade || c.insalubridade || "---");
          if (printFields.horario) row.push(`${c.horario_entrada || "---"} - ${c.horario_saida || "---"}`);
          tableData.push(row);
        });
      }
      
      // Espaço entre unidades
      tableData.push([{ content: "", colSpan: headers.length, styles: { cellPadding: 1 } }]);
    });

    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' } // Nome do colaborador ganha mais espaço
      },
      margin: { top: 35 },
      pageBreak: 'auto',
      rowPageBreak: 'avoid' // Tenta evitar quebrar uma linha no meio
    });

    doc.save(`ROTA_${user.nome.replace(/\s+/g, '_')}.pdf`);
    toast.success("Roteiro gerado com sucesso!");
    setIsPrintModalOpen(false);
  };

  const getStatusInfo = (t: any) => {
    const agora = new Date();
    const abertura = new Date(t.data_abertura);
    
    // SLA Útil baseado em Horário Comercial (Seg-Sex, 07:00-17:00)
    const horasUteisDecorridas = getBusinessHoursElapsed(abertura, agora);
    const prazoEmHoras = (t.prazo_estipulado_dias || 1) * 24; 
    const isAtrasadoSolicitado = horasUteisDecorridas >= prazoEmHoras;

    const deadlineAcordado = t.prazo_prometido ? new Date(t.prazo_prometido) : null;

    if (t.status === 'RESOLVIDO') return { label: 'Resolvido', color: 'bg-green-100 text-green-700', icon: CheckCircle, horas: horasUteisDecorridas };
    if (t.status === 'RESOLVIDO_COM_ATRASO') return { label: 'Resolvido (Atraso)', color: 'bg-amber-100 text-amber-700 border border-amber-300', icon: CheckCircle, horas: horasUteisDecorridas };
    
    if (deadlineAcordado && agora > deadlineAcordado && !t.status?.startsWith('RESOLVIDO')) {
      return { label: 'FALIT (Não Cumprido)', color: 'bg-black text-white border-2 border-red-600 animate-pulse', icon: ShieldCheck, horas: horasUteisDecorridas };
    }
    if (isAtrasadoSolicitado && !t.status?.startsWith('RESOLVIDO')) {
      return { label: 'URGENTE (Atrasado)', color: 'bg-red-600 text-white', icon: AlertTriangle, horas: horasUteisDecorridas };
    }
    if (t.status === 'RECEBIDO' || t.status === 'EM ANALISE') return { label: 'Em Atendimento', color: 'bg-blue-100 text-blue-700', icon: Clock, horas: horasUteisDecorridas };
    return { label: 'Aguardando', color: 'bg-orange-100 text-orange-700', icon: Clock, horas: horasUteisDecorridas };
  };

  const stats = useMemo(() => {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    const totalOcorrencias = ocorrencias.length;
    const emAberto = ocorrencias.filter(o => !o.status?.startsWith('RESOLVIDO')).length;
    const citadas = ocorrencias.filter(o => o.responsavel_citado_id === user.id).length;
    const falit = ocorrencias.filter(o => {
      if (o.atrasado_na_entrega) return true;
      const deadline = o.prazo_prometido ? new Date(o.prazo_prometido) : null;
      return deadline && agora > deadline && !o.status?.startsWith('RESOLVIDO');
    }).length;

    // Vagas em aberto: unidades com quantidade de vagas ou quadro funcional previsto vs alocados
    const vagasEmAberto = fullUnits.reduce((total, u) => {
      const vagasPrevistas = parseInt(u.quantidade_funcionarios_previsto || u.vagas_previstas || '0') || 0;
      if (vagasPrevistas > 0) {
        const alocados = myColabs.filter(c => c.unidade_alocacao === u.nome && c.status === 'ATIVO').length;
        return total + Math.max(0, vagasPrevistas - alocados);
      }
      return total;
    }, 0);

    // Faltas no período (mês atual): informativos do tipo FALTA
    const faltasNoPeriodo = historicoInformativos.filter(inf => {
      if (inf.tipo !== 'FALTA') return false;
      const dataInf = new Date(inf.data || inf.created_at);
      return dataInf.getMonth() === mesAtual && dataInf.getFullYear() === anoAtual;
    }).length;

    // Colaboradores afastados
    const colabsAfastados = myColabs.filter(c => {
      const st = (c.status || '').toUpperCase();
      return st === 'AFASTADO' || st === 'AFASTAMENTO' || st === 'LICENCA' || st === 'LICENÇA' || st === 'INSS';
    }).length;

    // Colaboradores de aviso (prévio)
    const colabsAviso = myColabs.filter(c => {
      const st = (c.status || '').toUpperCase();
      return st === 'AVISO' || st === 'AVISO PRÉVIO' || st === 'AVISO PREVIO' || st === 'EM AVISO' || st === 'DEMISSAO' || st === 'DEMISSÃO';
    }).length;

    return { totalOcorrencias, emAberto, citadas, falit, vagasEmAberto, faltasNoPeriodo, colabsAfastados, colabsAviso };
  }, [ocorrencias, user.id, myColabs, fullUnits, historicoInformativos]);

  const handleSaveUnidade = async () => {
    if (!unidadeEditando) return;
    setSaving(true);
    const { error } = await supabase
      .from('unidades')
      .update({
        secretaria: unidadeEditando.secretaria,
        endereco: unidadeEditando.endereco,
        responsavel_nome: unidadeEditando.responsavel_nome,
        responsavel_telefone: unidadeEditando.responsavel_telefone,
        quantidade_alunos: parseInt(unidadeEditando.quantidade_alunos) || 0,
        is_integral: unidadeEditando.is_integral,
        horario_funcionamento: unidadeEditando.horario_funcionamento,
        tem_cozinheira_efetiva: unidadeEditando.tem_cozinheira_efetiva,
        quantidade_cozinheiras: parseInt(unidadeEditando.quantidade_cozinheiras) || 0
      })
      .eq('id', unidadeEditando.id);

    if (!error) {
      toast.success("Dados da unidade atualizados!");
      setModalUnidade(null);
      fetchEncarregadoData();
    } else {
      toast.error("Erro ao salvar: " + error.message);
    }
    setSaving(false);
  };

  const generateCATPDF = async (data: any) => {
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
    doc.text(`INVESTIGACAO DE ACIDENTE DE TRABALHO (${data.tipo_acidente})`, pageWidth / 2, 25, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("DOCUMENTO INTERNO PARA CONTROLE DE SEGURANCA E SAUDE DO TRABALHO", pageWidth / 2, 32, { align: "center" });
    doc.line(15, 38, pageWidth - 15, 38);

    // 1. Identificação
    autoTable(doc, {
      startY: 45,
      head: [['1. IDENTIFICACAO DO ACIDENTADO', '']],
      body: [
        ['NOME COMPLETO:', data.colaborador_nome],
        ['CPF:', data.colaborador_cpf || 'NAO INFORMADO'],
        ['CARGO:', data.colaborador_cargo],
        ['UNIDADE ATENDIDA:', data.unidade_alocada],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // 2. Ocorrência (Variavel)
    const ocorrenciaBody = [
      ['DATA DO ACIDENTE:', data.data_ocorrido],
    ];
    if (data.tipo_acidente !== 'DOENCA') {
      ocorrenciaBody.push(
        ['HORARIO:', data.horario_ocorrido],
        ['LOCAL EXATO:', data.local_ocorrido],
        ['DESCRICAO DO LOCAL:', data.descricao_local],
        ['ENDERECO DO ACIDENTE:', data.dados_especificos?.endereco_acidente || 'NAO INFORMADO']
      );
    } else {
      ocorrenciaBody.push(
        ['DATA INICIO SINTOMAS:', data.dados_especificos?.data_inicio_sintomas || 'NAO INFORMADO'],
        ['MEDICO AVALIADOR:', data.dados_especificos?.medico_avaliador || 'NAO INFORMADO']
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
    if (data.tipo_acidente === 'TIPICO') {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['3. ANALISE DE SEGURANCA (ACIDENTE TIPICO)', '']],
        body: [
          ['ATIVIDADE NO MOMENTO:', data.dados_especificos?.atividade_momento || 'NAO INFORMADO'],
          ['EPIs UTILIZADOS:', (data.dados_especificos?.epis_usados || []).join(', ') || 'NENHUM'],
          ['CONDICAO/ATO INSEGURO:', data.dados_especificos?.condicao_insegura_ou_ato || 'NAO INFORMADO'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    } else if (data.tipo_acidente === 'TRAJETO') {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['3. ANALISE DE DESLOCAMENTO (TRAJETO)', '']],
        body: [
          ['SENTIDO DO TRAJETO:', data.dados_especificos?.sentido_trajeto || 'NAO INFORMADO'],
          ['MEIO DE TRANSPORTE:', data.dados_especificos?.meio_transporte || 'NAO INFORMADO'],
          ['COMPROVACAO DE ROTA:', data.dados_especificos?.comprovacao_rota || 'NAO INFORMADO'],
          ['CONDICOES DA VIA:', data.dados_especificos?.condicoes_via || 'NAO INFORMADO'],
          ['HOUVE TERCEIROS?:', data.dados_especificos?.houve_terceiros ? 'SIM' : 'NAO'],
          ['CNH / B.O.:', data.dados_especificos?.cnh_boletim || 'NAO INFORMADO'],
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
        [{ content: data.descricao_ocorrido, styles: { halign: 'justify' } }],
        [{ content: 'ACOES TOMADAS DURANTE A OCORRENCIA:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: data.acoes_tomadas || 'NAO INFORMADO', styles: { halign: 'justify' } }],
        [{ content: 'RELATO PESSOAL DO ACIDENTADO:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: data.relato_pessoal || 'NAO INFORMADO', styles: { halign: 'justify' } }],
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
        ['AGENTE CAUSADOR:', data.agente_causador],
        ['PARTE DO CORPO ATINGIDA:', data.parte_corpo_atingida],
        ['ACOMPANHAMENTO ATUAL:', data.acompanhamento_medico],
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
        [{ content: data.real_motivo, styles: { halign: 'justify' } }],
        [{ content: 'SOLUCOES PROPOSTAS PARA EVITAR RECORRENCIA:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: data.solucoes_propostas, styles: { halign: 'justify' } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY + 35;
    
    doc.line(20, finalY, 90, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(data.colaborador_nome.toUpperCase(), 55, finalY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(`CPF: ${data.colaborador_cpf || '__________'}`, 55, finalY + 10, { align: "center" });
    
    doc.line(120, finalY, 190, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(user.nome.toUpperCase(), 155, finalY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("ENCARREGADO RESPONSAVEL", 155, finalY + 10, { align: "center" });

    // Date of report
    doc.setFontSize(7);
    doc.text(`Relatorio gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 285);

    doc.save(`CAT_${data.colaborador_nome.replace(/\s+/g, '_')}_${data.data_ocorrido}.pdf`);
  };

  const handleSaveInformativo = async () => {
    if (!informativo.unidade || !informativo.data) {
      toast.warning("Por favor, preencha a unidade e a data.");
      return;
    }

    if (informativo.tipo === 'EXTRA' && !informativo.colaborador_substituto_nome) {
      toast.warning("Para informativos do tipo EXTRA, é obrigatório informar o Colaborador (Substituto).");
      return;
    }

    // Validação de data futura: previne erro de digitação (ex: 06/12 ao invés de 12/06)
    const dataInformada = new Date(informativo.data + 'T00:00:00');
    const hoje = new Date();
    const diffDias = Math.floor((dataInformada.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias > 30) {
      const confirmar = confirm(`⚠️ ATENÇÃO: A data informada (${informativo.data.split('-').reverse().join('/')}) está ${diffDias} dias no futuro. Tem certeza que a data está correta?`);
      if (!confirmar) return;
    }

    setSaving(true);
    
    const agora = new Date().toISOString();
    const payload = {
      ...informativo,
      colaborador_substituto_id: informativo.colaborador_substituto_id || null,
      colaborador_ausente_id: informativo.colaborador_ausente_id || null,
      data_abertura: agora,   // data/hora em que o informativo foi aberto/registrado
      criado_por_id: user.id,
      criado_por_nome: user.nome
    };

    const { error } = await supabase
      .from('informativos_operacionais')
      .insert([payload]);

    if (!error) {
      toast.success("Informativo registrado com sucesso!");
      setInformativo({
        tipo: 'EXTRA',
        unidade: '',
        data: new Date().toISOString().split('T')[0],
        periodo: 'DIURNO',
        horario: '',
        colaborador_substituto_id: '',
        colaborador_substituto_nome: '',
        colaborador_ausente_id: '',
        colaborador_ausente_nome: '',
        tem_atestado: false,
        dias_atestado: 0,
        justificada: false,
        sugestao_punicao: '',
        observacoes: ''
      });
      // Atualiza histórico sem recarregar tudo
      const { data: infoAtual } = await supabase
        .from('informativos_operacionais')
        .select('*')
        .eq('criado_por_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      setHistoricoInformativos(infoAtual || []);
      setActiveTab("MY_UNITS");
    } else {
      toast.error("Erro ao salvar: " + error.message);
    }
    setSaving(false);
  };

  const handleSaveCAT = async () => {
    if (!catForm.colaborador_nome || !catForm.descricao_ocorrido || (catForm.tipo_acidente !== 'DOENCA' && !catForm.endereco_acidente)) {
      toast.warning("Por favor, preencha o colaborador (nome), endereço e descrição do ocorrido.");
      return;
    }
    setSaving(true);

    const dados_especificos = {
      endereco_acidente: catForm.endereco_acidente,
      insalubridade: catForm.insalubridade,
      horario_trabalho: catForm.horario_trabalho,
      ...(catForm.tipo_acidente === 'TRAJETO' && {
        sentido_trajeto: catForm.sentido_trajeto,
        meio_transporte: catForm.meio_transporte,
        comprovacao_rota: catForm.comprovacao_rota,
        houve_terceiros: catForm.houve_terceiros,
        cnh_boletim: catForm.cnh_boletim,
        condicoes_via: catForm.condicoes_via,
      }),
      ...(catForm.tipo_acidente === 'TIPICO' && {
        atividade_momento: catForm.atividade_momento,
        epis_usados: catForm.epis_usados,
        condicao_insegura_ou_ato: catForm.condicao_insegura_ou_ato,
      }),
      ...(catForm.tipo_acidente === 'DOENCA' && {
        data_inicio_sintomas: catForm.data_inicio_sintomas,
        medico_avaliador: catForm.medico_avaliador,
      })
    };

    const payload = {
      colaborador_id: catForm.colaborador_id || null,
      colaborador_nome: catForm.colaborador_nome,
      colaborador_cpf: catForm.colaborador_cpf,
      colaborador_cargo: catForm.colaborador_cargo,
      unidade_alocada: catForm.unidade_alocada,
      data_ocorrido: catForm.data_ocorrido,
      horario_ocorrido: catForm.horario_ocorrido,
      local_ocorrido: catForm.local_ocorrido,
      descricao_local: catForm.descricao_local,
      tipo_acidente: catForm.tipo_acidente,
      descricao_ocorrido: catForm.descricao_ocorrido,
      relato_pessoal: catForm.relato_pessoal,
      tem_testemunha: catForm.tem_testemunha,
      testemunhas_detalhes: catForm.testemunhas_detalhes,
      acoes_tomadas: catForm.acoes_tomadas,
      agente_causador: catForm.agente_causador,
      parte_corpo_atingida: catForm.parte_corpo_atingida,
      acompanhamento_medico: catForm.acompanhamento_medico,
      real_motivo: catForm.real_motivo,
      solucoes_propostas: catForm.solucoes_propostas,
      encarregado_responsavel_id: user.id,
      dados_especificos: dados_especificos
    };

    const query = editingCatId
      ? supabase.from('investigacao_cat').update(payload).eq('id', editingCatId)
      : supabase.from('investigacao_cat').insert([payload]);

    const { error } = await query;

    if (!error) {
      toast.success(editingCatId ? "Investigação de CAT atualizada com sucesso!" : "Investigação de CAT registrada com sucesso! O SESMT/RH foi notificado.");
      generateCATPDF({ ...payload, dados_especificos });
      setEditingCatId(null);
      setCatForm({
        colaborador_id: '', colaborador_nome: '', colaborador_cpf: '', colaborador_cargo: '', unidade_alocada: '',
        insalubridade: '', horario_trabalho: '',
        data_ocorrido: new Date().toISOString().split('T')[0],
        horario_ocorrido: '08:00',
        local_ocorrido: '',
        descricao_local: '',
        tipo_acidente: 'TIPICO',
        descricao_ocorrido: '',
        relato_pessoal: '',
        tem_testemunha: false,
        testemunhas_detalhes: '',
        acoes_tomadas: '',
        agente_causador: '',
        parte_corpo_atingida: '',
        acompanhamento_medico: '',
        real_motivo: '',
        solucoes_propostas: '',
        endereco_acidente: '',
        sentido_trajeto: 'CASA_TRABALHO',
        meio_transporte: '',
        comprovacao_rota: '',
        houve_terceiros: false,
        cnh_boletim: '',
        condicoes_via: '',
        atividade_momento: '',
        epis_usados: [],
        condicao_insegura_ou_ato: '',
        data_inicio_sintomas: '',
        medico_avaliador: ''
      });
      fetchEncarregadoData();
      setActiveTab("MY_UNITS");
    } else toast.error("Erro ao salvar CAT: " + error.message);
    setSaving(false);
  };

  const handleSaveEntregaEPI = async () => {
    if (!epiData.colaborador_nome || epiData.itens.length === 0) {
      toast.warning("Informe o colaborador e selecione pelo menos um item.");
      return;
    }
    setSaving(true);
    try {
      for (const item of epiData.itens) {
        const { data: req, error: reqErr } = await supabase.from('requisicoes').insert([{
          item_id: item.id,
          item_nome: item.item,
          quantidade: item.qtd_entrega,
          solicitante: epiData.colaborador_nome,
          status: 'PENDENTE',
          tipo_item: 'EPI',
          unidade_destino: epiData.unidade || 'Entrega via Encarregado',
          protocolo: `EPI-ENC-${Math.floor(1000 + Math.random() * 9000)}`,
          data_solicitacao: new Date().toISOString()
        }]).select().single();
        if (reqErr) throw reqErr;

        const { error: rpcErr } = await supabase.rpc('processar_entrega_requisicao', {
          p_req_id: req.id,
          p_item_id: item.id,
          p_quantidade_entregue: item.qtd_entrega,
          p_categoria: 'EPI',
          p_recebedor: epiData.colaborador_nome,
          p_status_final: 'ENTREGUE'
        });
        if (rpcErr) throw rpcErr;
      }
      toast.success("Entrega de EPI registrada e estoque atualizado com sucesso!");
      
      // Salva os dados para exibir o recibo de impressão
      setEntregaConfirmadaData({
         colaborador: epiData.colaborador_nome,
         itens: [...epiData.itens]
      });

      setEpiData({ colaborador_nome: '', unidade: '', itens: [] });
      fetchEncarregadoData();
    } catch (e: any) {
      toast.error("Erro ao processar entrega: " + e.message);
    }
    setSaving(false);
  };

  const handleImprimirRecibo = () => {
    const printContent = document.getElementById('print-recibo-content');
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <he${""}ad>
          <title>Ficha de EPI - ${entregaConfirmadaData?.colaborador}</title>
          <style>
            @page { size: landscape; margin: 0.5cm; }
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              margin: 0; 
              padding: 10px; 
              color: black; 
              overflow: hidden;
            }
            .ficha-container { 
              width: 277mm;
              height: 190mm;
              border: 2px solid black; 
              padding: 25px; 
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
            }
            .header { border: 4px solid black; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .header-left h2 { margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; font-style: italic; }
            .header-right { text-align: right; border-left: 2px solid black; padding-left: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 2px solid black; margin-bottom: 15px; background: #f9f9f9; }
            .info-item { padding: 10px; border-right: 2px solid black; }
            .info-item:last-child { border-right: none; }
            .info-label { font-size: 7px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 3px; }
            .info-value { font-size: 11px; font-weight: 900; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; border: 2px solid black; margin-bottom: 15px; }
            th { background: black; color: white; padding: 10px; font-size: 8px; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
            td { padding: 8px; border: 1px solid black; font-size: 9px; font-weight: bold; text-transform: uppercase; }
            .termo { border: 2px solid black; padding: 15px; background: #f9f9f9; margin-bottom: 20px; }
            .termo h4 { margin: 0 0 8px 0; font-size: 9px; text-transform: uppercase; text-decoration: underline; }
            .termo p { margin: 0; font-size: 8px; line-height: 1.4; text-align: justify; font-weight: bold; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: auto; padding-bottom: 20px; }
            .sig-box { text-align: center; }
            .sig-line { border-bottom: 2px solid black; margin-bottom: 5px; height: 50px; }
            .sig-label { font-size: 9px; font-weight: 900; text-transform: uppercase; }
            .footer { border-top: 1px solid #eee; padding-top: 8px; display: flex; justify-content: space-between; font-size: 7px; color: #999; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="ficha-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handlePrintUnidadesInfo = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(22);
    doc.text("INFORMAÇÕES DAS UNIDADES - ALICERCE", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Encarregado: ${user.nome} | Data: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });
    
    const headers = [
      "UNIDADE",
      "SECRETARIA",
      "RESPONSÁVEL",
      "TELEFONE RESP.",
      "ALUNOS",
      "INTEGRAL?",
      "COZ. EFETIVA?",
      "HORÁRIO",
      "TOTAL COLAB.",
      "QUADRO DE FUNÇÕES"
    ];

    const tableData = fullUnits.map(u => {
      const unitColabs = myColabs.filter(c => c.unidade_alocacao === u.nome);
      const totalColabs = unitColabs.length;
      
      const cargosMap: Record<string, number> = {};
      unitColabs.forEach(c => {
        let cargo = c.cargo || c.funcao || "OUTROS";
        if (cargo.toUpperCase().includes("ASG") || cargo.toUpperCase().includes("SERVIÇOS GERAIS")) {
          const insalubridade = c.percentual_insalubridade || c.insalubridade || 20;
          cargo = `ASG (${String(insalubridade).replace(/\D/g, "")}%)`;
        }
        cargosMap[cargo] = (cargosMap[cargo] || 0) + 1;
      });
      
      const quadroFuncoes = Object.entries(cargosMap)
        .map(([cargo, qtd]) => `${qtd}x ${cargo}`)
        .join('\n');

      return [
        u.nome || "-",
        u.secretaria || "-",
        u.responsavel_nome || "-",
        u.responsavel_telefone || "-",
        u.quantidade_alunos?.toString() || "-",
        u.is_integral ? "SIM" : "NÃO",
        u.tem_cozinheira_efetiva ? `SIM (${u.quantidade_cozinheiras_efetivas || 1})` : "NÃO",
        u.horario_funcionamento || "-",
        totalColabs.toString(),
        quadroFuncoes || "-"
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [255, 106, 0], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    doc.save(`Unidades_Info_${user.nome.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
  };

  const renderMyUnits = () => (
    <div className="flex flex-col gap-8 animate-fade-in">

      <div className="flex justify-between items-center bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1 italic">Povoamento Operacional</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Cadastre colaboradores diretamente nas suas unidades de rota</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePrintUnidadesInfo}
            className="px-8 py-4 bg-white text-[var(--text-primary)] border border-[var(--border)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
          >
            <Printer size={18} /> Detalhes das Unidades
          </button>
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            className="px-8 py-4 bg-white text-[var(--text-primary)] border border-[var(--border)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
          >
            <Printer size={18} /> Imprimir Rota
          </button>
          <button 
            onClick={() => setActiveTab("QUICK_ADMISSION")}
            className="px-10 py-4 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[var(--brand)]/20 flex items-center gap-3"
          >
            <UserPlus size={18} /> Admissão Rápida
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6">Unidades Sob Minha Responsabilidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myUnits.map((unit, i) => (
            <div 
              key={i} 
              className="p-8 bg-[var(--bg-base)] border border-[var(--border)] rounded-3xl flex flex-col gap-6 hover:border-[var(--brand)] transition-all group overflow-hidden"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white transition-all shrink-0">
                  <Building2 size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[var(--text-primary)] uppercase truncate mb-1">{unit}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">{myColabs.filter(c => c.unidade_alocacao === unit).length} Colaboradores</p>
                </div>
                <button 
                  onClick={() => { setFiltroUnidadeOcorrencia(unit); setActiveTab("TICKETS"); }}
                  className="p-3 bg-[var(--bg-card)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] hover:text-[var(--brand)] transition-all"
                >
                  <AlertTriangle size={18} />
                </button>
              </div>

              <div className="pt-6 border-t border-[var(--border)] flex gap-2">
                 <button 
                    onClick={() => {
                      const unitObj = fullUnits.find(u => u.nome === unit);
                      setUnidadeEditando(unitObj || { nome: unit });
                      setModalUnidade(true);
                    }}
                    className="flex-1 py-3 bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all flex items-center justify-center gap-2"
                  >
                     <Settings size={14} /> Editar Unidade
                  </button>
                  <button 
                    onClick={() => { setFiltroUnidadeOcorrencia(unit); setActiveTab("TICKETS"); }}
                    className="px-4 py-3 bg-[var(--bg-card)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] text-[9px] font-black uppercase hover:border-[var(--brand)] transition-all"
                  >
                     Chamados
                  </button>
              </div>
            </div>
          ))}
          {myUnits.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-50">
               <MapPin size={48} className="mx-auto mb-4" />
               <p className="text-xs font-black uppercase tracking-widest">Nenhuma unidade vinculada ao seu perfil.</p>
               <p className="text-[10px] font-bold mt-2 uppercase">Contate a gerência para definir suas rotas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMyColabs = () => (
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
                       onChange={e => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <button 
                     onClick={() => setIsPrintModalOpen(true)}
                     className="h-10 px-4 bg-white text-[var(--text-primary)] border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                     <Printer size={14} /> Imprimir {filtroUnidadeColab ? "Unidade" : "Equipe"}
                  </button>
                  <button 
                     onClick={() => setActiveTab("QUICK_ADMISSION")}
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
                 onChange={e => setFiltroUnidadeColab(e.target.value)}
               >
                 <option value="">TODAS AS UNIDADES</option>
                 {myUnits.map((u, i) => (
                   <option key={i} value={u}>{u}</option>
                 ))}
               </select>
               <select 
                 className="input-field !h-10 !text-[10px] bg-[var(--bg-base)] flex-1 min-w-[200px]"
                 value={filtroCargoColab}
                 onChange={e => setFiltroCargoColab(e.target.value)}
               >
                 <option value="">TODOS OS CARGOS</option>
                 {Array.from(new Set(myColabs.map(c => c.funcao || c.cargo || 'OPERACIONAL'))).map((cargo: any, i) => (
                   <option key={i} value={cargo}>{cargo}</option>
                 ))}
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
                     <tr key={i} className="hover:bg-[var(--bg-base)]/50 transition-colors group cursor-pointer" onClick={() => setEditandoColab(colab)}>
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

  const handleEditCAT = (cat: any) => {
    const de = cat.dados_especificos || {};
    setCatForm({
      colaborador_id: cat.colaborador_id || '',
      colaborador_nome: cat.colaborador_nome || '',
      colaborador_cpf: cat.colaborador_cpf || '',
      colaborador_cargo: cat.colaborador_cargo || '',
      unidade_alocada: cat.unidade_alocada || '',
      insalubridade: de.insalubridade || '',
      horario_trabalho: de.horario_trabalho || '',
      data_ocorrido: cat.data_ocorrido || '',
      horario_ocorrido: cat.horario_ocorrido || '',
      local_ocorrido: cat.local_ocorrido || '',
      descricao_local: cat.descricao_local || '',
      tipo_acidente: cat.tipo_acidente || 'TIPICO',
      descricao_ocorrido: cat.descricao_ocorrido || '',
      relato_pessoal: cat.relato_pessoal || '',
      tem_testemunha: !!cat.tem_testemunha,
      testemunhas_detalhes: cat.testemunhas_detalhes || '',
      acoes_tomadas: cat.acoes_tomadas || '',
      agente_causador: cat.agente_causador || '',
      parte_corpo_atingida: cat.parte_corpo_atingida || '',
      acompanhamento_medico: cat.acompanhamento_medico || '',
      real_motivo: cat.real_motivo || '',
      solucoes_propostas: cat.solucoes_propostas || '',
      endereco_acidente: de.endereco_acidente || '',
      sentido_trajeto: de.sentido_trajeto || 'CASA_TRABALHO',
      meio_transporte: de.meio_transporte || '',
      comprovacao_rota: de.comprovacao_rota || '',
      houve_terceiros: !!de.houve_terceiros,
      cnh_boletim: de.cnh_boletim || '',
      condicoes_via: de.condicoes_via || '',
      atividade_momento: de.atividade_momento || '',
      epis_usados: de.epis_usados || [],
      condicao_insegura_ou_ato: de.condicao_insegura_ou_ato || '',
      data_inicio_sintomas: de.data_inicio_sintomas || '',
      medico_avaliador: de.medico_avaliador || ''
    });
    setEditingCatId(cat.id);
    toast.info("Dados da CAT carregados para alteração.");
  };

  const renderCAT = () => (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 max-w-[1200px] mx-auto w-full">
      <div className="bg-[var(--bg-card)] p-12 rounded-[3.5rem] border border-[var(--border)] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        
        <div className="flex justify-between items-start mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-600 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">Investigação de CAT</h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">Protocolo de Segurança e Saúde do Trabalho (SST)</p>
            </div>
          </div>
          <div className="bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
            Prazo Crítico: 24 Horas
          </div>
        </div>

        {editingCatId && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between relative z-10 animate-fade-in">
            <div className="flex items-center gap-3 text-amber-700 font-black text-[10px] uppercase">
              <AlertTriangle size={18} />
              <span>Editando Registro de CAT Existente</span>
            </div>
            <button 
              onClick={() => {
                setEditingCatId(null);
                setCatForm({
                  colaborador_id: '', colaborador_nome: '', colaborador_cpf: '', colaborador_cargo: '', unidade_alocada: '',
                  insalubridade: '', horario_trabalho: '',
                  data_ocorrido: new Date().toISOString().split('T')[0],
                  horario_ocorrido: '08:00',
                  local_ocorrido: '',
                  descricao_local: '',
                  tipo_acidente: 'TIPICO',
                  descricao_ocorrido: '',
                  relato_pessoal: '',
                  tem_testemunha: false,
                  testemunhas_detalhes: '',
                  acoes_tomadas: '',
                  agente_causador: '',
                  parte_corpo_atingida: '',
                  acompanhamento_medico: '',
                  real_motivo: '',
                  solucoes_propostas: '',
                  endereco_acidente: '',
                  sentido_trajeto: 'CASA_TRABALHO',
                  meio_transporte: '',
                  comprovacao_rota: '',
                  houve_terceiros: false,
                  cnh_boletim: '',
                  condicoes_via: '',
                  atividade_momento: '',
                  epis_usados: [],
                  condicao_insegura_ou_ato: '',
                  data_inicio_sintomas: '',
                  medico_avaliador: ''
                });
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black uppercase rounded-xl transition-all"
            >
              Cancelar Edição
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-red-600 flex items-center gap-2 italic">
                  <Users size={14} /> 1. Identificação do Acidentado
               </p>
               <div className="p-8 bg-white rounded-[2rem] border border-[var(--border)] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Nome do Acidentado</label>
                    <input 
                      className="input-field w-full !h-14 font-black" 
                      placeholder="Comece a digitar o nome..."
                      value={catForm.colaborador_nome}
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setCampoBuscaAtivo("cat_colaborador");
                        setCatForm({
                          ...catForm,
                          colaborador_nome: val,
                          colaborador_id: ''
                        });
                        if (val.length > 1) {
                          setColabsSugeridos(myColabs.filter(c => c.nome.toUpperCase().includes(val) || c.cpf?.includes(val)));
                        } else {
                          setColabsSugeridos([]);
                        }
                      }}
                      onFocus={() => {
                        setCampoBuscaAtivo("cat_colaborador");
                        setColabsSugeridos(myColabs);
                      }}
                    />
                    {campoBuscaAtivo === "cat_colaborador" && colabsSugeridos.length > 0 && (
                      <div className="absolute z-[120] left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                         {colabsSugeridos.map((c, i) => (
                           <button 
                             key={i}
                             type="button"
                             onClick={() => {
                               setCatForm({
                                 ...catForm,
                                 colaborador_id: c.id,
                                 colaborador_nome: c.nome,
                                 colaborador_cpf: c.cpf || '',
                                 colaborador_cargo: c.cargo || c.funcao || 'OPERACIONAL',
                                 unidade_alocada: c.unidade_alocacao || '',
                                 insalubridade: c.insalubridade ? `${c.insalubridade}%` : (c.percentual_insalubridade || 'N/A'),
                                 horario_trabalho: c.horario_trabalho || `${c.horario_entrada || '07:00'} às ${c.horario_saida || '17:00'}`
                               });
                               setColabsSugeridos([]);
                               setCampoBuscaAtivo("");
                             }}
                             className="w-full p-4 flex items-center gap-4 hover:bg-[var(--bg-base)] transition-colors border-b border-[var(--border)] last:border-0 text-left"
                           >
                              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 font-black text-xs">
                                 {c.nome.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-[var(--text-primary)]">{c.nome}</p>
                                 <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{c.funcao || c.cargo} • {c.unidade_alocacao}</p>
                              </div>
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">CPF</label>
                    <input 
                      className="input-field w-full !h-14 font-black" 
                      placeholder="000.000.000-00"
                      value={catForm.colaborador_cpf}
                      onChange={e => setCatForm({...catForm, colaborador_cpf: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Cargo / Função</label>
                    <input 
                      className="input-field w-full !h-14 font-black" 
                      placeholder="Ex: Auxiliar de Serviços..."
                      value={catForm.colaborador_cargo}
                      onChange={e => setCatForm({...catForm, colaborador_cargo: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Unidade Alocada</label>
                    <input 
                      className="input-field w-full !h-14 font-black" 
                      placeholder="Nome da Escola/Unidade..."
                      value={catForm.unidade_alocada}
                      onChange={e => setCatForm({...catForm, unidade_alocada: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Insalubridade do Posto</label>
                    <input 
                      className="input-field w-full !h-14 font-black bg-slate-100" 
                      readOnly
                      placeholder="Insalubridade..."
                      value={catForm.insalubridade}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Horário de Trabalho</label>
                    <input 
                      className="input-field w-full !h-14 font-black bg-slate-100" 
                      readOnly
                      placeholder="Horário..."
                      value={catForm.horario_trabalho}
                    />
                  </div>
               </div>
            </div>

            {/* BLOCO 2: OCORRÊNCIA E CONDICIONAIS */}
            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-red-600 flex items-center gap-2 italic">
                  <Clock size={14} /> 2. Detalhes da Ocorrência
               </p>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Data do Ocorrido</label>
                    <input type="date" className="input-field w-full !h-14 font-black" value={catForm.data_ocorrido} onChange={e => setCatForm({...catForm, data_ocorrido: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Horário</label>
                    <input type="time" className="input-field w-full !h-14 font-black" value={catForm.horario_ocorrido} onChange={e => setCatForm({...catForm, horario_ocorrido: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Tipo de Acidente</label>
                    <select className="input-field w-full !h-14 font-black" value={catForm.tipo_acidente} onChange={e => setCatForm({...catForm, tipo_acidente: e.target.value})}>
                      <option value="TIPICO">TÍPICO (NA UNIDADE)</option>
                      <option value="TRAJETO">TRAJETO (CASA-TRABALHO)</option>
                      <option value="DOENCA">DOENÇA OCUPACIONAL</option>
                    </select>
                  </div>
               </div>

               {/* Campos Globais (Exceto Doença) */}
               {catForm.tipo_acidente !== 'DOENCA' && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Local (Unidade/Posto)</label>
                      <input className="input-field w-full !h-14 font-black" placeholder="Onde exatamente?" value={catForm.local_ocorrido} onChange={e => setCatForm({...catForm, local_ocorrido: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Descrição do Local</label>
                      <input className="input-field w-full !h-14 font-black" placeholder="Ex: Cozinha, Pátio, Escada Norte" value={catForm.descricao_local} onChange={e => setCatForm({...catForm, descricao_local: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-red-500 mb-2 block">* Endereço da Ocorrência</label>
                      <input className="input-field w-full !h-14 font-black border-red-200 focus:border-red-500" placeholder="Rua, Número, Bairro, Cidade..." value={catForm.endereco_acidente} onChange={e => setCatForm({...catForm, endereco_acidente: e.target.value.toUpperCase()})} />
                    </div>
                 </div>
               )}

               {/* Condicionais por Tipo */}
               {catForm.tipo_acidente === 'TRAJETO' && (
                 <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6 mt-6">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 italic mb-4">Informações Específicas: Acidente de Trajeto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Sentido do Trajeto</label>
                          <select className="input-field w-full !h-12 font-black" value={catForm.sentido_trajeto} onChange={e => setCatForm({...catForm, sentido_trajeto: e.target.value})}>
                            <option value="CASA_TRABALHO">CASA &rarr; TRABALHO</option>
                            <option value="TRABALHO_CASA">TRABALHO &rarr; CASA</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Meio de Transporte</label>
                          <input className="input-field w-full !h-12 font-black" placeholder="Ônibus, Moto, Carro, A Pé..." value={catForm.meio_transporte} onChange={e => setCatForm({...catForm, meio_transporte: e.target.value.toUpperCase()})} />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Estava na rota habitual?</label>
                          <select className="input-field w-full !h-12 font-black" value={catForm.comprovacao_rota} onChange={e => setCatForm({...catForm, comprovacao_rota: e.target.value})}>
                            <option value="">Selecione...</option>
                            <option value="SIM">SIM, ROTA PADRÃO</option>
                            <option value="NAO_DESVIO">NÃO, FEZ DESVIO (Motivo Pessoal)</option>
                            <option value="NAO_FORCA_MAIOR">NÃO, DESVIO POR FORÇA MAIOR (Trânsito, Obra)</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Condições da Via / Clima</label>
                          <input className="input-field w-full !h-12 font-black" placeholder="Ex: Chovendo, buraco, pista escorregadia" value={catForm.condicoes_via} onChange={e => setCatForm({...catForm, condicoes_via: e.target.value.toUpperCase()})} />
                       </div>
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Houve envolvimento de terceiros?</label>
                          <button 
                            onClick={() => setCatForm({...catForm, houve_terceiros: !catForm.houve_terceiros})}
                            className={`w-32 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${catForm.houve_terceiros ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}
                          >
                            {catForm.houve_terceiros ? 'SIM (COLISÃO)' : 'NÃO'}
                          </button>
                       </div>
                       {catForm.houve_terceiros && (
                         <div>
                            <label className="text-[10px] font-black uppercase text-orange-600 mb-2 block">Número B.O. / CNH Envolvido</label>
                            <input className="input-field w-full !h-12 font-black border-orange-200" placeholder="Dados do B.O. ou do outro condutor..." value={catForm.cnh_boletim} onChange={e => setCatForm({...catForm, cnh_boletim: e.target.value.toUpperCase()})} />
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {catForm.tipo_acidente === 'TIPICO' && (
                 <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6 mt-6">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 italic mb-4">Informações Específicas: Acidente Típico</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Atividade sendo executada no momento</label>
                          <input className="input-field w-full !h-12 font-black" placeholder="Ex: Limpeza de vidros, corte de carne, descarregando caminhão..." value={catForm.atividade_momento} onChange={e => setCatForm({...catForm, atividade_momento: e.target.value.toUpperCase()})} />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">EPIs Sendo Utilizados (Dinâmico)</label>
                          <div className="relative">
                            <select 
                              className="input-field w-full !h-12 font-black" 
                              onChange={e => {
                                if (e.target.value && !catForm.epis_usados.includes(e.target.value)) {
                                  setCatForm({...catForm, epis_usados: [...catForm.epis_usados, e.target.value]});
                                }
                                e.target.value = "";
                              }}
                            >
                              <option value="">+ Selecionar EPI do Almoxarifado</option>
                              {estoqueEpi.map((item: any) => (
                                <option key={item.id} value={item.item}>{item.item}</option>
                              ))}
                              <option value="NENHUM">NENHUM EPI UTILIZADO</option>
                            </select>
                          </div>
                          {catForm.epis_usados.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {catForm.epis_usados.map((epi: string, idx: number) => (
                                <div key={idx} className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-2">
                                  {epi}
                                  <button onClick={() => setCatForm({...catForm, epis_usados: catForm.epis_usados.filter((_: any, i: number) => i !== idx)})} className="hover:text-red-500">&times;</button>
                                </div>
                              ))}
                            </div>
                          )}
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Condição Insegura ou Ato Inseguro?</label>
                          <select className="input-field w-full !h-12 font-black" value={catForm.condicao_insegura_ou_ato} onChange={e => setCatForm({...catForm, condicao_insegura_ou_ato: e.target.value})}>
                            <option value="">Selecione a análise preliminar...</option>
                            <option value="ATO_INSEGURO">ATO INSEGURO (Falha do Colaborador)</option>
                            <option value="CONDICAO_INSEGURA">CONDIÇÃO INSEGURA (Falha do Ambiente/Equipamento)</option>
                            <option value="AMBOS">AMBOS (Ato + Condição)</option>
                            <option value="FATALIDADE_IMPREVISIVEL">FATALIDADE IMPREVISÍVEL</option>
                          </select>
                       </div>
                    </div>
                 </div>
               )}

               {catForm.tipo_acidente === 'DOENCA' && (
                 <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6 mt-6">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 italic mb-4">Informações Específicas: Doença Ocupacional</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Data de Início dos Sintomas (Aproximada)</label>
                          <input type="date" className="input-field w-full !h-12 font-black" value={catForm.data_inicio_sintomas} onChange={e => setCatForm({...catForm, data_inicio_sintomas: e.target.value})} />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Médico / Clínica que realizou a avaliação inicial</label>
                          <input className="input-field w-full !h-12 font-black" placeholder="Nome do Médico ou Hospital..." value={catForm.medico_avaliador} onChange={e => setCatForm({...catForm, medico_avaliador: e.target.value.toUpperCase()})} />
                       </div>
                    </div>
                 </div>
               )}
            </div>

            {/* BLOCO 3: NARRATIVA E TESTEMUNHAS */}
            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-red-600 flex items-center gap-2 italic">
                  <Activity size={14} /> 3. Narrativa da Investigação
               </p>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Descrição Detalhada do Ocorrido</label>
                  <textarea className="input-field w-full !h-40 p-6 font-medium" placeholder="Como aconteceu? Quais ferramentas estavam envolvidas?..." value={catForm.descricao_ocorrido} onChange={e => setCatForm({...catForm, descricao_ocorrido: e.target.value})}></textarea>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Ações Tomadas Durante a Ocorrência</label>
                  <textarea className="input-field w-full !h-32 p-6 font-medium" placeholder="Primeiros socorros, isolamento da área, etc..." value={catForm.acoes_tomadas} onChange={e => setCatForm({...catForm, acoes_tomadas: e.target.value})}></textarea>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black uppercase text-[var(--text-primary)] italic">Há Testemunhas?</span>
                       <button 
                         onClick={() => setCatForm({...catForm, tem_testemunha: !catForm.tem_testemunha})}
                         className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${catForm.tem_testemunha ? 'bg-green-500 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}
                       >
                         {catForm.tem_testemunha ? 'SIM' : 'NÃO'}
                       </button>
                    </div>
                    {catForm.tem_testemunha && (
                      <textarea className="input-field w-full !h-24 !text-[10px] p-4 bg-white" placeholder="Nome/Telefone e depoimento das testemunhas..." value={catForm.testemunhas_detalhes} onChange={e => setCatForm({...catForm, testemunhas_detalhes: e.target.value})}></textarea>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Relato Pessoal do Acidentado</label>
                    <textarea className="input-field w-full !h-32 p-6 font-medium" placeholder="O que o colaborador diz sobre o acidente..." value={catForm.relato_pessoal} onChange={e => setCatForm({...catForm, relato_pessoal: e.target.value})}></textarea>
                  </div>
               </div>
            </div>

            {/* BLOCO 4: ANÁLISE TÉCNICA */}
            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-red-600 flex items-center gap-2 italic">
                  <Settings size={14} /> 4. Análise e Acompanhamento
               </p>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Agente Causador</label>
                    <input className="input-field w-full !h-14 font-black" placeholder="Ex: Piso Escorregadio" value={catForm.agente_causador} onChange={e => setCatForm({...catForm, agente_causador: e.target.value.toUpperCase()})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Parte do Corpo Atingida</label>
                    <input className="input-field w-full !h-14 font-black" placeholder="Ex: Mão Direita" value={catForm.parte_corpo_atingida} onChange={e => setCatForm({...catForm, parte_corpo_atingida: e.target.value.toUpperCase()})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Acompanhamento Atual</label>
                    <input className="input-field w-full !h-14 font-black" placeholder="Ex: Hospital X / Em casa" value={catForm.acompanhamento_medico} onChange={e => setCatForm({...catForm, acompanhamento_medico: e.target.value.toUpperCase()})} />
                  </div>
               </div>
            </div>

            {/* BLOCO 5: CONCLUSÃO */}
            <div className="space-y-6 p-8 bg-amber-500/5 rounded-[2.5rem] border border-amber-500/10">
               <p className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-2 italic mb-4">
                  <AlertTriangle size={14} /> 5. Conclusão da Investigação
               </p>
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-amber-700 mb-3 block italic">Qual foi o Real Motivo? (Causa Raiz)</label>
                    <textarea className="input-field w-full !h-32 p-6 font-bold bg-white" placeholder="Sua visão profissional sobre o motivo real..." value={catForm.real_motivo} onChange={e => setCatForm({...catForm, real_motivo: e.target.value})}></textarea>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-amber-700 mb-3 block italic">Soluções para Evitar Recorrência</label>
                    <textarea className="input-field w-full !h-32 p-6 font-bold bg-white" placeholder="O que deve ser feito para não acontecer novamente?..." value={catForm.solucoes_propostas} onChange={e => setCatForm({...catForm, solucoes_propostas: e.target.value})}></textarea>
                  </div>
               </div>
            </div>

            <button 
              onClick={handleSaveCAT}
              disabled={saving}
              className="w-full py-8 bg-red-600 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] hover:scale-[1.01] transition-all shadow-2xl shadow-red-500/40"
            >
               {saving ? "Registrando Protocolo Crítico..." : editingCatId ? "Salvar Alterações da CAT" : "Finalizar e Enviar Investigação de CAT"}
            </button>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border)] shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-8 flex items-center gap-2 italic">
                   <ShieldCheck size={14} /> Registros Recentes (CAT)
                </h4>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                   {historicoCats.map((reg, idx) => (
                     <div key={idx} className="p-5 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)] group hover:border-red-500/50 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                             <div>
                                <span className="text-[8px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase tracking-widest">{reg.tipo_acidente}</span>
                                <p className="text-xs font-black uppercase text-[var(--text-primary)] mt-2">{reg.colaborador_nome}</p>
                             </div>
                             <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">
                               {reg.data_ocorrido ? new Date(reg.data_ocorrido + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                             </span>
                          </div>
                          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-2">Unidade: {reg.unidade_alocada}</p>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                          <button
                            onClick={() => handleEditCAT(reg)}
                            className="flex-1 py-2 bg-[var(--brand)] text-white text-[9px] font-black uppercase rounded-lg hover:scale-105 transition-all text-center"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => generateCATPDF(reg)}
                            className="px-3 py-2 bg-slate-200 text-slate-700 text-[9px] font-black uppercase rounded-lg hover:scale-105 transition-all flex items-center justify-center gap-1"
                          >
                            <Printer size={12} /> PDF
                          </button>
                        </div>
                     </div>
                   ))}
                   {historicoCats.length === 0 && (
                     <div className="py-20 text-center opacity-30">
                        <ShieldCheck size={48} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase">Nenhum registro de CAT localizado.</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="bg-amber-600 p-8 rounded-[2.5rem] text-white shadow-xl">
                <h4 className="text-xs font-black uppercase mb-4 italic flex items-center gap-2">
                   <Activity size={18} /> Importante
                </h4>
                <p className="text-[9px] font-bold uppercase leading-relaxed opacity-90">
                   A emissão da CAT é obrigatória mesmo que não haja afastamento. O preenchimento correto deste relatório protege a empresa e o colaborador, evitando multas e garantindo o nexo causal correto.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEPI = () => (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
       <div className="flex justify-between items-center bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)]">
          <div>
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1 italic">Entrega de EPI Individual</h3>
             <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Registro de entrega direta com baixa automática no estoque central</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 border border-orange-500/20">
                <Package size={24} />
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
             <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="relative">
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Colaborador Recebedor</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input 
                          className="input-field w-full !h-14 font-black !pl-12"
                          placeholder="Pesquisar colaborador..."
                          value={epiData.colaborador_nome}
                          onChange={e => {
                            const val = e.target.value.toUpperCase();
                            setCampoBuscaAtivo("epi_recebedor");
                            setBuscaColab(val);
                            setEpiData({...epiData, colaborador_nome: val});
                            if (val.length > 2) {
                              setColabsSugeridos(myColabs.filter(c => c.nome.includes(val) || c.cpf?.includes(val)));
                            } else {
                              setColabsSugeridos([]);
                            }
                          }}
                        />
                      </div>
                      
                      {campoBuscaAtivo === "epi_recebedor" && colabsSugeridos.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                           {colabsSugeridos.map((c, i) => (
                             <button 
                               key={i}
                               onClick={() => selecionarColab(c)}
                               className="w-full p-4 flex items-center gap-4 hover:bg-[var(--bg-base)] transition-colors border-b border-[var(--border)] last:border-0 text-left"
                             >
                                <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] font-black text-xs">
                                   {c.nome.charAt(0)}
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase text-[var(--text-primary)]">{c.nome}</p>
                                   <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{c.funcao || c.cargo} • {c.unidade_alocacao}</p>
                                </div>
                             </button>
                           ))}
                        </div>
                      )}
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Unidade de Entrega</label>
                      <select 
                        className="input-field w-full !h-14 font-black"
                        value={epiData.unidade}
                        onChange={e => setEpiData({...epiData, unidade: e.target.value})}
                      >
                        <option value="">Selecione a Unidade...</option>
                        {myUnits.map((u, i) => <option key={i} value={u}>{u}</option>)}
                      </select>
                   </div>
                </div>

                <div className="pt-8 border-t border-[var(--border)]">
                   <p className="text-[10px] font-black uppercase text-[var(--brand)] mb-6 flex items-center gap-2 italic">
                      <Plus size={14} /> Adicionar Itens à Entrega
                   </p>
                   <div className="grid grid-cols-1 gap-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {estoqueEpi.filter((i: any) => !epiData.itens.find((ei: any) => ei.id === i.id)).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)] group hover:border-[var(--brand)] transition-all">
                           <div>
                              <p className="text-xs font-black uppercase">{item.item}</p>
                              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Estoque: {item.quantidade} {item.unidade_medida}</p>
                           </div>
                           <button 
                             onClick={() => {
                               setEpiData({
                                 ...epiData,
                                 itens: [...epiData.itens, { ...item, qtd_entrega: 1 }]
                               });
                             }}
                             className="h-10 px-4 bg-white text-[var(--text-primary)] rounded-xl border border-[var(--border)] text-[9px] font-black uppercase hover:bg-[var(--brand)] hover:text-white transition-all shadow-sm"
                           >
                              Adicionar
                           </button>
                        </div>
                      ))}
                   </div>

                   {epiData.itens.length > 0 && (
                     <div className="space-y-4 animate-fade-in">
                        <p className="text-[10px] font-black uppercase text-slate-400">Itens Selecionados</p>
                        {epiData.itens.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-5 bg-[var(--brand)]/5 rounded-2xl border border-[var(--brand)]/20 shadow-sm">
                             <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center text-[10px] font-black">
                                   {idx + 1}
                                </div>
                                <span className="text-xs font-black uppercase">{item.item}</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-white rounded-xl border border-[var(--border)] p-1">
                                   <button 
                                     onClick={() => {
                                       const newItens = [...epiData.itens];
                                       if (newItens[idx].qtd_entrega > 1) {
                                         newItens[idx].qtd_entrega--;
                                         setEpiData({...epiData, itens: newItens});
                                       }
                                     }}
                                     className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                                   >
                                      -
                                   </button>
                                   <span className="w-10 text-center text-xs font-black">{item.qtd_entrega}</span>
                                   <button 
                                     onClick={() => {
                                       const newItens = [...epiData.itens];
                                       if (newItens[idx].qtd_entrega < item.quantidade) {
                                         newItens[idx].qtd_entrega++;
                                         setEpiData({...epiData, itens: newItens});
                                       }
                                     }}
                                     className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                                   >
                                      +
                                   </button>
                                </div>
                                <button 
                                  onClick={() => {
                                    setEpiData({
                                      ...epiData,
                                      itens: epiData.itens.filter((_: any, i: number) => i !== idx)
                                    });
                                  }}
                                  className="text-red-500 hover:bg-red-50 text-xs font-black p-2 rounded-lg"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </div>
                        ))}
                        
                        <button 
                          onClick={handleSaveEntregaEPI}
                          disabled={saving}
                          className="w-full py-6 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.01] transition-all shadow-xl shadow-orange-600/20 mt-6"
                        >
                           {saving ? "Processando Entrega..." : "Confirmar Entrega de Itens"}
                        </button>
                     </div>
                   )}
                </div>
             </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
             <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border)] shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-8 flex items-center gap-2 italic">
                   <Archive size={14} /> Entregas Recentes (SST)
                </h4>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                   {entregasEpi.map((reg, idx) => (
                     <div key={idx} className="p-5 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)] group hover:border-orange-500/50 transition-all">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{reg.protocolo}</p>
                              <p className="text-xs font-black uppercase text-[var(--text-primary)] mt-1">{reg.solicitante}</p>
                           </div>
                           <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">{new Date(reg.data_solicitacao).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                           <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">{reg.item_nome}</span>
                           <span className="text-[10px] font-black text-[var(--text-primary)]">Qtd: {reg.quantidade}</span>
                        </div>
                     </div>
                   ))}
                   {entregasEpi.length === 0 && (
                     <div className="py-20 text-center opacity-30">
                        <Package size={48} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase">Nenhuma entrega registrada.</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="bg-orange-600 p-8 rounded-[2.5rem] text-white shadow-xl">
                <h4 className="text-xs font-black uppercase mb-4 italic flex items-center gap-2">
                   <ShieldCheck size={18} /> Compliance SST
                </h4>
                <p className="text-[9px] font-bold uppercase leading-relaxed opacity-90">
                   Todas as entregas de EPI realizadas via módulo encarregado são registradas no histórico de SST para fins de fiscalização e proteção jurídica. O desconto no estoque central é automático.
                </p>
             </div>
          </div>
       </div>
    </div>
  );

  const handleSalvarEdicao = async () => {
    if (!justificativa || justificativa.length < 10) {
      alert("Por favor, forneça uma justificativa detalhada (mínimo 10 caracteres).");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('usuarios').update({
      nome: editandoColab.nome,
      telefone: editandoColab.telefone,
      cpf: editandoColab.cpf,
      cargo: editandoColab.funcao || editandoColab.cargo,
      status: editandoColab.status,
      unidade_alocacao: editandoColab.unidade_alocacao,
      secretaria: fullUnits.find(u => u.nome === editandoColab.unidade_alocacao)?.secretaria || editandoColab.secretaria,
      insalubridade: parseInt(String(editandoColab.insalubridade).replace(/\D/g, "")) || 0,
      carga_horaria: editandoColab.carga_horaria,
      periodo: editandoColab.periodo,
      horario_entrada: editandoColab.horario_entrada,
      horario_saida: editandoColab.horario_saida,
      escala_tipo: editandoColab.escala_tipo,
      data_referencia_escala: editandoColab.data_referencia_escala,
      justificativa_alteracao: justificativa,
      editado_por: user.nome,
      data_ultima_alteracao: new Date().toISOString()
    }).eq('id', editandoColab.id);

    if (!error) {
      alert("Cadastro atualizado com sucesso!");
      setEditandoColab(null);
      setJustificativa("");
      fetchEncarregadoData();
    } else {
      alert("Erro ao atualizar: " + error.message);
    }
    setSaving(false);
  };

  const renderTickets = () => {
    const filtered = filtroUnidadeOcorrencia 
      ? ocorrencias.filter(o => o.unidade === filtroUnidadeOcorrencia)
      : ocorrencias;

    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1">Central de Atendimento</h3>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Gestão de chamados e ocorrências das suas rotas</p>
          </div>
          <div className="flex gap-4">
             <div className="text-[10px] font-black text-blue-600 uppercase bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
               {ocorrencias.filter(o => o.responsavel_citado_id === user.id).length} Citado
             </div>
             <div className="text-[10px] font-black text-red-600 uppercase bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 animate-pulse">
               {ocorrencias.filter(o => o.status?.startsWith('FALIT') || stats.falit > 0).length} Falit
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filtered.map((ticket, i) => {
            const s = getStatusInfo(ticket);
            return (
              <div key={i} className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] overflow-hidden hover:border-[var(--brand)] transition-all group shadow-sm">
                <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${ticket.prioridade === 'ALTA' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                       <AlertTriangle size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest">{ticket.protocolo || `#${ticket.id.slice(0,8)}`}</span>
                          <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${s.color}`}>
                             <s.icon size={10} /> {s.label}
                          </div>
                       </div>
                       <h4 className="text-base font-black text-[var(--text-primary)] uppercase truncate pr-4">{ticket.assunto}</h4>
                       <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] font-bold text-red-600 uppercase italic">Unidade: {ticket.unidade}</span>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Solic: {ticket.interessado_nome || ticket.criado_por}</span>
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                             SLA Útil: {Math.round(s.horas)}h
                          </span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pr-4">
                     <div className="text-right">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Abertura</p>
                        <p className="text-xs font-black text-[var(--text-primary)]">{new Date(ticket.data_abertura).toLocaleDateString()}</p>
                     </div>
                     <button 
                       onClick={() => { setSelectedTicket(ticket); setIsTicketModalOpen(true); }}
                       className="p-4 bg-[var(--bg-base)] hover:bg-[var(--brand)] hover:text-white rounded-2xl text-[var(--brand)] transition-all shadow-sm group-hover:scale-105"
                     >
                        <ArrowUpRight size={20} />
                     </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-20 text-center bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)]">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-20" />
              <p className="text-xs font-black uppercase text-[var(--text-muted)]">Nenhuma ocorrência encontrada.</p>
            </div>
          )}
        </div>

        {/* MODAL DETALHES DO TICKET */}
        <AdaptiveModal 
          isOpen={isTicketModalOpen} 
          onClose={() => { 
            setIsTicketModalOpen(false); 
            setSelectedTicket(null); 
            setShowRejeitarForm(false); 
            setShowEncaminharForm(false); 
            setMotivoRejeicao("");
          }} 
          title="Central de Atendimento - Detalhes da Ocorrência"
        >
          {selectedTicket && (
            <div className="p-8 space-y-6">
              <div className="border-b border-[var(--border)] pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest">{selectedTicket.protocolo || `#${selectedTicket.id.slice(0,8)}`}</span>
                  <span className="text-xs text-[var(--text-muted)]">• {new Date(selectedTicket.data_abertura).toLocaleString()}</span>
                </div>
                <h4 className="text-xl font-black text-[var(--text-primary)] uppercase">{selectedTicket.assunto}</h4>
                <p className="text-sm font-bold text-slate-500 mt-2">Unidade: {selectedTicket.unidade}</p>
                <p className="text-xs text-[var(--text-muted)] font-semibold mt-1">Interessado: {selectedTicket.interessado_nome} ({selectedTicket.funcao})</p>
                <p className="text-xs text-[var(--text-muted)] font-semibold">Solicitado por: {selectedTicket.representante_nome || selectedTicket.criado_por}</p>
              </div>

              <div className="bg-[var(--bg-base)] p-6 rounded-2xl border border-[var(--border)]">
                <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider mb-2">Descrição do Chamado</p>
                <p className="text-sm font-semibold text-[var(--text-secondary)] leading-relaxed">{selectedTicket.descricao}</p>
              </div>

              {selectedTicket.solucao_descricao && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-800">
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1">Status Final / Resolução</p>
                  <p className="text-sm font-semibold italic">"{selectedTicket.solucao_descricao}"</p>
                </div>
              )}

              {selectedTicket.justificativa_solucao && (
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl text-blue-800">
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1">Nota de Encaminhamento</p>
                  <p className="text-sm font-semibold italic">"{selectedTicket.justificativa_solucao}"</p>
                </div>
              )}

              {selectedTicket.status === 'PENDENTE' && selectedTicket.setor_destino === 'Encarregado' && (
                <div className="bg-[var(--bg-base)] p-6 rounded-2xl border border-[var(--border)] flex flex-col gap-4">
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Ações do Encarregado</p>
                  
                  {!showRejeitarForm && !showEncaminharForm && (
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setShowEncaminharForm(true)} 
                        className="h-12 bg-[var(--brand)] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-opacity-90 shadow-md transition-all"
                      >
                        Aprovar e Encaminhar
                      </button>
                      <button 
                        onClick={() => setShowRejeitarForm(true)} 
                        className="h-12 bg-transparent text-red-600 border-2 border-red-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-50 transition-all"
                      >
                        Recusar
                      </button>
                    </div>
                  )}

                  {showRejeitarForm && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-red-700 block">Motivo da Recusa/Cancelamento</label>
                      <textarea 
                        className="input-field w-full h-24 p-3 text-xs font-medium resize-none border-red-200 focus:border-red-500" 
                        value={motivoRejeicao} 
                        onChange={e => setMotivoRejeicao(e.target.value)} 
                        placeholder="Informe o motivo pelo qual esta solicitação foi recusada..."
                      />
                      <div className="flex gap-4">
                        <button onClick={() => setShowRejeitarForm(false)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Voltar</button>
                        <button onClick={handleRecusarTicket} disabled={saving} className="flex-1 px-5 py-2 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-wider">Confirmar Recusa</button>
                      </div>
                    </div>
                  )}

                  {showEncaminharForm && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-700 block">Selecione o Setor Responsável para Encaminhamento</label>
                      <select 
                        className="input-field w-full h-12 text-xs font-bold" 
                        value={setorDestino} 
                        onChange={e => setSetorDestino(e.target.value)}
                      >
                        <option value="RH Recursos Humanos">RH Recursos Humanos</option>
                        <option value="Gerência Operacional">Gerência Operacional</option>
                        <option value="Almoxarifado">Almoxarifado</option>
                        <option value="Técnico Segurança">Técnico Segurança</option>
                        <option value="Gerência Regional">Gerência Regional</option>
                      </select>
                      <div className="flex gap-4">
                        <button onClick={() => setShowEncaminharForm(false)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Voltar</button>
                        <button onClick={handleEncaminharTicket} disabled={saving} className="flex-1 px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-wider">Aprovar e Encaminhar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </AdaptiveModal>
      </div>
    );
  };

  const renderReports = () => (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)]">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1 italic">Informativos Operacionais</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Registre extras, faltas e atestados da sua equipe</p>
        </div>
        <div className="flex gap-2 bg-[var(--bg-base)] p-1 rounded-2xl border border-[var(--border)]">
          <button 
            onClick={() => setInformativo({...informativo, tipo: 'EXTRA'})}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${informativo.tipo === 'EXTRA' ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'}`}
          >
            Extras / Subs.
          </button>
          <button 
            onClick={() => setInformativo({...informativo, tipo: 'FALTA'})}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${informativo.tipo === 'FALTA' ? 'bg-red-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'}`}
          >
            Faltas / Atestados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LADO ESQUERDO: FORMULÁRIO */}
        <div className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Unidade Atendida</label>
              <select 
                className="input-field w-full !h-14 font-black"
                value={informativo.unidade}
                onChange={e => setInformativo({...informativo, unidade: e.target.value})}
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
                onChange={e => setInformativo({...informativo, data: e.target.value})}
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
                    onChange={e => setInformativo({...informativo, horario: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Período</label>
                  <select 
                    className="input-field w-full !h-14 font-black"
                    value={informativo.periodo}
                    onChange={e => setInformativo({...informativo, periodo: e.target.value})}
                  >
                    <option value="DIURNO">DIURNO</option>
                    <option value="NOTURNO">NOTURNO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <UserSearchInput 
                    label="Colaborador que fez o Extra (Substituto)"
                    placeholder="Digite o nome completo..."
                    valueName={informativo.colaborador_substituto_nome}
                    className="text-blue-600"
                    onSelect={(user) => setInformativo({
                      ...informativo, 
                      colaborador_substituto_id: user.id,
                      colaborador_substituto_nome: user.nome
                    })}
                  />
                </div>

                <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                  <UserSearchInput 
                    label="Colaborador que Faltou (Ausente)"
                    placeholder="Digite o nome completo..."
                    valueName={informativo.colaborador_ausente_nome}
                    className="text-red-600"
                    onSelect={(user) => setInformativo({
                      ...informativo, 
                      colaborador_ausente_id: user.id,
                      colaborador_ausente_nome: user.nome
                    })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                <UserSearchInput 
                  label="Colaborador Ausente"
                  placeholder="Digite o nome completo..."
                  valueName={informativo.colaborador_ausente_nome}
                  className="text-[var(--text-muted)]"
                  onSelect={(user) => setInformativo({
                    ...informativo, 
                    colaborador_ausente_id: user.id,
                    colaborador_ausente_nome: user.nome
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[var(--text-primary)] italic">Tem Atestado?</span>
                    <button 
                      onClick={() => setInformativo({...informativo, tem_atestado: !informativo.tem_atestado})}
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
                        onChange={e => setInformativo({...informativo, dias_atestado: e.target.value})}
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
                        { id: 'JUSTA_CAUSA', label: 'Justa Causa' }
                      ].map(m => (
                        <button 
                          key={m.id}
                          onClick={() => setInformativo({...informativo, sugestao_punicao: m.id})}
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
               onChange={e => setInformativo({...informativo, observacoes: e.target.value})}
             />
          </div>

          <button 
             onClick={handleSaveInformativo}
             disabled={saving}
             className="w-full py-6 bg-[var(--brand)] text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-2xl shadow-[var(--brand)]/30"
          >
             {saving ? "Registrando Informativo..." : "Finalizar e Enviar Informativo"}
          </button>
        </div>

        {/* LADO DIREITO: HISTÓRICO DE INFORMATIVOS */}
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
                    className={`p-5 rounded-2xl border-l-4 border ${
                      isExtra
                        ? 'border-l-[var(--brand)] border-[var(--border)] bg-[var(--bg-card)]'
                        : 'border-l-red-500 border-red-100 bg-red-50/30'
                    }`}
                  >
                    {/* Tipo + Unidade */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isExtra ? 'bg-[var(--brand)]/10 text-[var(--brand)]' : 'bg-red-100 text-red-700'
                      }`}>
                        {isExtra ? '⚡ Extra / Substituição' : '⛔ Falta / Atestado'}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{inf.unidade}</span>
                    </div>

                    {/* Datas separadas — informação central do pedido */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-[var(--bg-base)] rounded-xl p-3">
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">📋 Aberto em</p>
                        <p className="text-[10px] font-black text-slate-700">
                          {dataAbertura.toLocaleDateString('pt-BR')} às {dataAbertura.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`rounded-xl p-3 ${
                        isExtra ? 'bg-[var(--brand)]/5' : 'bg-red-50'
                      }`}>
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">📅 Data da Ocorrência</p>
                        <p className={`text-[10px] font-black ${
                          isExtra ? 'text-[var(--brand)]' : 'text-red-700'
                        }`}>
                          {dataOcorrencia ? dataOcorrencia.toLocaleDateString('pt-BR') : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Colaboradores envolvidos */}
                    {isExtra && (
                      <div className="text-[9px] font-bold text-slate-500 space-y-0.5">
                        {inf.colaborador_substituto_nome && (
                          <p>⚡ Substituto: <span className="font-black text-slate-700">{inf.colaborador_substituto_nome}</span></p>
                        )}
                        {inf.colaborador_ausente_nome && (
                          <p>👤 Ausente: <span className="font-black text-slate-700">{inf.colaborador_ausente_nome}</span></p>
                        )}
                        {inf.horario && <p>🕐 Horário: <span className="font-black">{inf.horario}</span></p>}
                      </div>
                    )}
                    {!isExtra && (
                      <div className="text-[9px] font-bold text-slate-500 space-y-0.5">
                        {inf.colaborador_ausente_nome && (
                          <p>👤 Faltante: <span className="font-black text-slate-700">{inf.colaborador_ausente_nome}</span></p>
                        )}
                        {inf.tem_atestado && <p className="text-blue-600 font-black">📄 Com atestado ({inf.dias_atestado}d)</p>}
                        {!inf.tem_atestado && inf.justificada === false && inf.sugestao_punicao && (
                          <p className="text-red-600 font-black">⚠ {inf.sugestao_punicao.replace(/_/g,' ')}</p>
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

  const handleSalvarAdmissao = async () => {
    if (!admissao.nome || !admissao.telefone || !admissao.unidade) {
      toast.warning("Por favor, preencha todos os campos.");
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
      criado_por: user.nome
    }]);

    if (!error) {
      toast.success("Colaborador cadastrado e ATIVO no sistema!");
      setAdmissao({ nome: '', telefone: '', unidade: '', secretaria: '' });
      fetchEncarregadoData();
      setActiveTab("MY_COLABS");
    } else {
      toast.error("Erro ao cadastrar: " + error.message);
    }
    setSaving(false);
  };

  const renderQuickAdmission = () => (
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
                      escala_tipo: info.escala_padrao || (info.carga_horaria_padrao === '44H' ? 'DIARIO' : 'IMPAR')
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
                  const unit = fullUnits.find(u => u.nome === e.target.value);
                  setAdmissao({
                    ...admissao, 
                    unidade: e.target.value,
                    secretaria: unit?.secretaria || 'SEMED' 
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
          Atenção Encarregado: Este cadastro é simplificado para agilizar o povoamento. O RH será notificado para complementar a documentação técnica (CPF, RG, CTPS) posteriormente.
        </p>
      </div>
    </div>
  );

  const fetchMissions = async () => {
    const { data: activeMissoes } = await supabase.from('missoes').select('*').eq('ativa', true).order('created_at', { ascending: false });
    const { data: myAnswers } = await supabase.from('missoes_respostas').select('*').eq('usuario_id', user.id);
    
    const combined = activeMissoes?.map((m: any) => ({
      ...m,
      concluida: myAnswers?.some((ans: any) => ans.missao_id === m.id && ans.status === 'CONCLUIDO')
    })) || [];

    setMissoesAtivas(combined);
  };

  useEffect(() => {
    if (activeTab === "MY_MISSIONS") {
      fetchMissions();
    }
  }, [activeTab]);

  const renderMyMissions = () => {
    const handleAnswer = async () => {
      if (!selectedMissao) return;
      setSubmittingMissao(true);
      
      const { error } = await supabase.from('missoes_respostas').upsert([{
        missao_id: selectedMissao.id,
        usuario_id: user.id,
        respostas: respostasMissao,
        status: 'CONCLUIDO',
        updated_at: new Date().toISOString()
      }], { onConflict: 'missao_id,usuario_id' });

      if (!error) {
        toast.success("Missão cumprida! Parabéns!");
        setSelectedMissao(null);
        fetchMissions();
      } else {
        toast.error("Erro ao enviar: " + error.message);
      }
      setSubmittingMissao(false);
    };

    return (
      <div className="flex flex-col gap-8 animate-fade-in pb-20">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
           <Trophy className="absolute top-0 right-0 p-10 opacity-10" size={140} />
           <div className="relative z-10">
              <h3 className="text-3xl font-black italic tracking-tighter">Radar de Missões Operacionais</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">Complete os desafios semanais para garantir a excelência da sua rota</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {missoesAtivas.map(m => (
             <div key={m.id} className={`bg-[var(--bg-card)] p-8 rounded-[2.5rem] border ${m.concluida ? 'border-green-500/20' : 'border-[var(--border)]'} shadow-xl flex flex-col justify-between group`}>
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${m.frequencia === 'SEMANAL' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {m.frequencia}
                    </div>
                    {m.concluida && <CheckCircle className="text-green-500" size={20} />}
                  </div>
                  <h4 className="text-lg font-black text-[var(--text-primary)] italic leading-tight">{m.titulo}</h4>
                  <p className="text-xs font-medium text-[var(--text-muted)] mt-2 line-clamp-2">{m.descricao}</p>
                </div>

                <button 
                  disabled={m.concluida}
                  onClick={() => { setSelectedMissao(m); setRespostasMissao({}); }}
                  className={`w-full mt-8 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${m.concluida ? 'bg-green-500/10 text-green-600 cursor-default' : 'bg-orange-600 text-white shadow-xl shadow-orange-600/20 hover:scale-[1.02]'}`}
                >
                  {m.concluida ? "Missão Cumprida" : <><Trophy size={16}/> Aceitar Missão</>}
                </button>
             </div>
           ))}
        </div>

        {selectedMissao && (
          <AdaptiveModal isOpen={!!selectedMissao} onClose={() => setSelectedMissao(null)} title={selectedMissao.titulo}>
            <div className="p-10 space-y-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Objetivo da Missão</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedMissao.descricao}</p>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase text-[var(--brand)]">Checklist de Campo</p>
                {selectedMissao.checklist?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                    <span className="text-xs font-black uppercase">{item.task}</span>
                    <button 
                      onClick={() => setRespostasMissao({...respostasMissao, [item.task]: !respostasMissao[item.task]})}
                      className={`w-14 h-8 rounded-lg flex items-center justify-center transition-all ${respostasMissao[item.task] ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                    >
                      {respostasMissao[item.task] ? 'OK' : 'Pendente'}
                    </button>
                  </div>
                ))}
              </div>

              <button 
                disabled={submittingMissao}
                onClick={handleAnswer}
                className="w-full h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3"
              >
                {submittingMissao ? "Sincronizando..." : "Concluir Missão e Enviar Evidências"}
              </button>
            </div>
          </AdaptiveModal>
        )}
      </div>
    );
  };


  const renderAvisoExp = () => {
    const agora = new Date();
    
    // 1. Experiência: Admissão (ou created_at) até 90 dias
    const colabsEmExperiencia = myColabs.filter(c => {
      const dataInicioStr = c.data_admissao || c.created_at;
      if (!dataInicioStr) return false;
      const dataInicio = new Date(dataInicioStr);
      const diffMs = agora.getTime() - dataInicio.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDias >= 0 && diffDias <= 90;
    }).map(c => {
      const dataInicio = new Date(c.data_admissao || c.created_at);
      const diffDias = Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
      const temAdvertencia = advertencias.some(a => a.colaborador_id === c.id);
      return { ...c, diasExperiencia: diffDias, temAdvertencia, dataInicio };
    }).sort((a, b) => b.diasExperiencia - a.diasExperiencia);

    // 2. Aviso Prévio: status === AVISO
    const colabsEmAviso = myColabs.filter(c => {
      const st = (c.status || '').toUpperCase();
      return st === 'AVISO' || st === 'AVISO PRÉVIO' || st === 'AVISO PREVIO' || st === 'EM AVISO' || st === 'DEMISSAO' || st === 'DEMISSÃO';
    });

    const handleRegistrarAviso = async (colabId: string, tipoDias: 30 | 27) => {
      setSaving(true);
      try {
        const dataAviso = new Date().toISOString();
        const { error } = await supabase.from('usuarios').update({
          data_aviso: dataAviso,
          tipo_aviso: tipoDias
        }).eq('id', colabId);
        
        if (error) throw error;
        toast.success("Aviso registrado com sucesso!");
        fetchEncarregadoData();
      } catch (e: any) {
        toast.error("Erro ao registrar: " + e.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="flex flex-col gap-10 animate-fade-in pb-20 max-w-[1400px] mx-auto w-full">
        <div className="bg-[var(--bg-card)] p-10 rounded-[2rem] border border-[var(--border)] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[var(--brand)] opacity-20" />
          <h3 className="text-xl font-black text-[var(--text-primary)] uppercase italic flex items-center gap-3">
            <Activity size={24} className="text-[var(--brand)]" />
            Experiência e Aviso Prévio
          </h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2">
            Acompanhe o período de experiência (90 dias) e aviso dos colaboradores
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* COLUNA: EM EXPERIÊNCIA */}
          <div className="flex flex-col gap-6">
            <h4 className="text-sm font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                {colabsEmExperiencia.length}
              </span>
              Em Experiência (até 90 dias)
            </h4>

            {colabsEmExperiencia.length === 0 ? (
               <div className="p-8 text-center text-[var(--text-muted)] font-bold text-[10px] uppercase border border-dashed rounded-2xl">
                 Nenhum colaborador em experiência
               </div>
            ) : (
              colabsEmExperiencia.map(c => (
                <div key={c.id} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm relative overflow-hidden group">
                  {c.temAdvertencia && (
                    <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-lg shadow-lg animate-pulse flex items-center gap-1">
                      <ShieldAlert size={10} />
                      Advertência no Período
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-[var(--text-primary)] truncate max-w-[200px]">{c.nome}</p>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{c.cargo || c.funcao}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-600 leading-none">{c.diasExperiencia}</p>
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">dias</p>
                    </div>
                  </div>

                  <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${c.diasExperiencia <= 30 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (c.diasExperiencia / 90) * 100)}%` }}
                    />
                    <div className="absolute top-0 bottom-0 left-[33.33%] w-0.5 bg-white opacity-50 z-10" title="Fim dos 30 dias" />
                  </div>
                  <div className="flex justify-between mt-2 text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    <span>Admissão: {c.dataInicio.toLocaleDateString('pt-BR')}</span>
                    <span>Meta: 90 dias</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* COLUNA: EM AVISO */}
          <div className="flex flex-col gap-6">
            <h4 className="text-sm font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                {colabsEmAviso.length}
              </span>
              Em Aviso Prévio
            </h4>

            {colabsEmAviso.length === 0 ? (
               <div className="p-8 text-center text-[var(--text-muted)] font-bold text-[10px] uppercase border border-dashed rounded-2xl">
                 Nenhum colaborador em aviso
               </div>
            ) : (
              colabsEmAviso.map(c => {
                let diasPassados = 0;
                let diasTotais = c.tipo_aviso || 30;
                let isRegistrado = !!c.data_aviso;

                if (isRegistrado) {
                  const dInicio = new Date(c.data_aviso);
                  diasPassados = Math.floor((agora.getTime() - dInicio.getTime()) / (1000 * 60 * 60 * 24));
                }

                const diasRestantes = Math.max(0, diasTotais - diasPassados);
                const perc = isRegistrado ? Math.min(100, (diasPassados / diasTotais) * 100) : 0;

                return (
                  <div key={c.id} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-[var(--text-primary)] truncate max-w-[200px]">{c.nome}</p>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{c.cargo || c.funcao}</p>
                      </div>
                      <div className="text-right">
                        {isRegistrado ? (
                          <>
                            <p className="text-2xl font-black text-orange-600 leading-none">{diasRestantes}</p>
                            <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">restantes</p>
                          </>
                        ) : (
                          <span className="text-[8px] bg-red-100 text-red-600 px-2 py-1 rounded font-black uppercase">Pendente Data</span>
                        )}
                      </div>
                    </div>

                    {!isRegistrado ? (
                      <div className="mt-4 p-4 border border-dashed border-red-200 bg-red-50 rounded-xl flex flex-col gap-2">
                        <p className="text-[9px] font-bold text-red-600 uppercase text-center">Registrar Início do Aviso</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleRegistrarAviso(c.id, 30)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase py-2 rounded-lg transition-all">30 Dias (Jornada)</button>
                          <button onClick={() => handleRegistrarAviso(c.id, 27)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase py-2 rounded-lg transition-all">27 Dias (Dias)</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 bg-orange-500"
                            style={{ width: `${perc}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          <span>Início: {new Date(c.data_aviso).toLocaleDateString('pt-BR')}</span>
                          <span>Fim: {new Date(new Date(c.data_aviso).getTime() + (diasTotais * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleResponderPedidoTransf = async (pedidoId: string, acao: 'Aprovado' | 'Recusado', resposta: string) => {
    if (!resposta.trim()) {
      toast.warning("Escreva uma resposta/justificativa para o colaborador.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pedidos_transferencia_colaborador")
        .update({
          status: acao === 'Aprovado' ? 'Aprovado pelo Encarregado' : 'Recusado pelo Encarregado',
          resposta_encarregado: resposta,
          encarregado_id: user.id,
          encarregado_nome: user.nome || user.name,
          updated_at: new Date().toISOString()
        })
        .eq("id", pedidoId);

      if (!error) {
        toast.success(`Pedido ${acao.toLowerCase()} com sucesso!`);
        
        // Registrar na atividade
        await supabase.from('atividades').insert({
          usuario_id: user.id,
          usuario_nome: user.nome || user.name,
          mensagem: `Encarregado respondeu pedido de transferência de colaborador: ${acao}`,
          tipo: "RH"
        });

        setAnalisandoPedido(null);
        setRespostaPedidoText("");
        fetchEncarregadoData();
      } else {
        toast.error("Erro ao responder pedido: " + error.message);
      }
    } catch (err) {
      toast.error("Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const renderTransferencias = () => {

    const selectedColab = myColabs.find(c => c.id === selectedTransferColabId);
    const colabSecretaria = selectedColab?.secretaria || selectedColab?.secretaria_destino || "";
    
    // Mostra TODAS as unidades disponíveis (exceto a atual do colaborador)
    const availableUnits = allUnits.filter(u => u.nome !== selectedColab?.unidade_alocacao);
    
    // Agrupa por secretaria para facilitar navegação
    const unitsBySecretaria = availableUnits.reduce((acc: Record<string, any[]>, u: any) => {
      const sec = u.secretaria || 'Sem Secretaria';
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(u);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Ordena para que a secretaria do colaborador venha primeiro
    const sortedSecretarias = Object.keys(unitsBySecretaria).sort((a, b) => {
      if (a === colabSecretaria) return -1;
      if (b === colabSecretaria) return 1;
      return a.localeCompare(b);
    });

    const handleTransferir = async () => {
      if (!selectedTransferColabId || !destinationUnitName || !transferReason) {
        toast.warning("Preencha todos os campos!");
        return;
      }
      setSaving(true);
      try {
        const colab = myColabs.find(c => c.id === selectedTransferColabId);
        if (!colab) return;

        // 1. Criar solicitação na tabela de transferências
        await criarSolicitacao({
          colaborador_id: colab.id,
          colaborador_nome: colab.nome,
          unidade_origem: colab.unidade_alocacao,
          unidade_destino: destinationUnitName,
          motivo: transferReason
        });

        // 2. Atualizar a unidade do usuário diretamente no banco
        const { error: userUpdateError } = await supabase
          .from('usuarios')
          .update({ unidade_alocacao: destinationUnitName })
          .eq('id', colab.id);

        if (userUpdateError) throw userUpdateError;

        // 3. Registrar atividade
        await supabase.from('atividades').insert({
          usuario_id: user.id,
          usuario_nome: user.nome || user.name,
          mensagem: `Encarregado transferiu ${colab.nome} de ${colab.unidade_alocacao} para ${destinationUnitName}`,
          tipo: "RH"
        });

        toast.success("Colaborador transferido com sucesso!");
        setSelectedTransferColabId("");
        setDestinationUnitName("");
        setTransferReason("");
        fetchEncarregadoData();
      } catch (e: any) {
        toast.error("Erro ao transferir: " + e.message);
      } finally {
        setSaving(false);
      }
    };

    const myRecentTransfers = transferencias.filter(t => t.encarregado_id === user.id);

    return (
      <div className="flex flex-col gap-10 animate-fade-in">
        <div className="bg-[var(--bg-card)] p-10 rounded-[2rem] border border-[var(--border)] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[var(--brand)] opacity-20" />
          <h3 className="text-xl font-black text-[var(--text-primary)] uppercase italic flex items-center gap-3">
            <ArrowUpRight size={24} className="text-[var(--brand)]" />
            Transferência de Colaborador
          </h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2">
            Mova colaboradores entre postos de trabalho
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-1 bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border)] shadow-xl flex flex-col gap-6">
            <h4 className="text-sm font-black uppercase text-[var(--text-primary)]">Nova Transferência</h4>
            
            <div className="space-y-2">
              <UserSearchInput 
                label="Selecione o Colaborador"
                placeholder="Digite o nome do colaborador..."
                valueName={selectedColab?.nome || ""}
                onSelect={(selected) => {
                  setSelectedTransferColabId(selected.id);
                  setDestinationUnitName("");
                }}
              />
            </div>

            {selectedColab && (
              <div className="p-4 bg-[var(--bg-base)]/50 rounded-xl border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider space-y-1">
                <p><span className="text-[var(--text-muted)]">Unidade Atual:</span> {selectedColab.unidade_alocacao || "Nenhuma"}</p>
                <p><span className="text-[var(--text-muted)]">Secretaria:</span> <span className="text-[var(--brand)]">{colabSecretaria}</span></p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Unidade de Destino</label>
              <select 
                className="input-field w-full h-12 font-bold" 
                value={destinationUnitName} 
                onChange={e => setDestinationUnitName(e.target.value)}
                disabled={!selectedTransferColabId}
              >
                <option value="">Selecione o Destino...</option>
                {sortedSecretarias.map(sec => (
                  <optgroup key={sec} label={sec === colabSecretaria ? `★ ${sec} (Mesma Secretaria)` : sec}>
                    {unitsBySecretaria[sec].map((u: any) => (
                      <option key={u.id} value={u.nome}>{u.nome}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedTransferColabId && availableUnits.length === 0 && (
                <p className="text-[9px] text-orange-600 font-bold uppercase">Nenhuma unidade disponível para transferência</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Motivo / Justificativa</label>
              <textarea 
                className="input-field w-full min-h-[100px] p-4 text-xs font-bold" 
                placeholder="Descreva o motivo da transferência..."
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
              />
            </div>

            <button 
              disabled={saving || !selectedTransferColabId || !destinationUnitName || !transferReason}
              onClick={handleTransferir}
              className="w-full h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-black transition-all shadow-xl"
            >
              {saving ? "Processando..." : "Confirmar Transferência"}
            </button>
          </div>

          {/* Histórico Recente do Encarregado */}
          <div className="lg:col-span-2 bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border)] shadow-xl flex flex-col gap-6">
            <h4 className="text-sm font-black uppercase text-[var(--text-primary)]">Histórico de Transferências Enviadas</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="pb-4">Colaborador</th>
                    <th className="pb-4">Origem → Destino</th>
                    <th className="pb-4">Motivo</th>
                    <th className="pb-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {myRecentTransfers.map((t: any) => (
                    <tr key={t.id} className="text-xs font-bold">
                      <td className="py-4 uppercase text-[var(--text-primary)]">{t.colaborador_nome}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-muted)]">{t.unidade_origem}</span>
                          <ArrowUpRight size={12} className="text-[var(--brand)]" />
                          <span className="text-[10px] text-[var(--text-primary)]">{t.unidade_destino_pretendida}</span>
                        </div>
                      </td>
                      <td className="py-4 text-[var(--text-muted)] italic max-w-xs truncate" title={t.motivo_solicitacao}>
                        "{t.motivo_solicitacao}"
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                          t.status === 'FINALIZADO_RH' ? 'bg-green-100 text-green-700' :
                          t.status === 'SOLICITADO' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {t.status === 'FINALIZADO_RH' ? 'Ciente (RH)' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {myRecentTransfers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-30 italic">
                        Nenhuma transferência registrada por você.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Seção: Pedidos de Transferência Recebidos dos Colaboradores */}
        <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border)] shadow-xl flex flex-col gap-6 mt-8">
          <div>
            <h4 className="text-sm font-black uppercase text-[var(--text-primary)]">Pedidos de Transferência de Colaboradores (Recebidos)</h4>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Solicitações enviadas diretamente pelos funcionários via portal celular</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="pb-4">Colaborador</th>
                  <th className="pb-4">Tipo de Transferência</th>
                  <th className="pb-4">Justificativa / Detalhes</th>
                  <th className="pb-4 text-center">Status</th>
                  <th className="pb-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pedidosColab.map((p: any) => (
                  <tr key={p.id} className="text-xs font-bold">
                    <td className="py-4 uppercase text-[var(--text-primary)]">
                      <div>
                        <p>{p.colaborador_nome}</p>
                        <p className="text-[8px] text-[var(--text-muted)]">{p.colaborador_telefone}</p>
                      </div>
                    </td>
                    <td className="py-4 text-[var(--text-primary)]">{p.tipo_transferencia}</td>
                    <td className="py-4 text-[var(--text-muted)] italic max-w-md truncate" title={p.detalhes}>
                      "{p.detalhes}"
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase ${
                        p.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                        p.status.includes('Aprovado') ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {p.status === 'Pendente' ? (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => {
                              const resp = prompt("Digite uma resposta/observação para o colaborador:");
                              if (resp) handleResponderPedidoTransf(p.id, 'Aprovado', resp);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all font-bold text-[9px] uppercase"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => {
                              const resp = prompt("Digite o motivo da recusa para o colaborador:");
                              if (resp) handleResponderPedidoTransf(p.id, 'Recusado', resp);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all font-bold text-[9px] uppercase"
                          >
                            Recusar
                          </button>
                        </div>
                      ) : (
                        <div className="text-[9px] text-[var(--text-muted)] font-black uppercase">
                          Respondido por: {p.encarregado_nome || 'Supervisor'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {pedidosColab.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-30 italic">
                      Nenhuma solicitação de transferência recebida dos seus colaboradores.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 max-w-[1400px] mx-auto w-full">
      
      {/* DASHBOARD DE ESTATÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
         {[
           { label: 'Minhas Unidades', val: myUnits.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-500/10' },
           { label: 'Meus Colaboradores', val: myColabs.length, icon: Users, color: 'text-green-600', bg: 'bg-green-500/10' },
           { label: 'Citado em Ocorrências', val: stats.citadas, icon: User, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
           { label: 'Ocorrências Ativas', val: stats.emAberto, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10' },
           { label: 'Vagas em Aberto', val: stats.vagasEmAberto, icon: BriefcaseBusiness, color: 'text-amber-600', bg: 'bg-amber-500/10' },
           { label: 'Faltas no Período', val: stats.faltasNoPeriodo, icon: CalendarX, color: 'text-rose-600', bg: 'bg-rose-500/10' },
           { label: 'Colaborador Afastado', val: stats.colabsAfastados, icon: UserX, color: 'text-orange-600', bg: 'bg-orange-500/10' },
           { label: 'Colaborador de Aviso', val: stats.colabsAviso, icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
         ].map((s, idx) => (
            <div key={idx} className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] flex items-center justify-between group hover:scale-[1.02] transition-all cursor-default shadow-sm">
               <div>
                  <p className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-wider mb-1">{s.label}</p>
                  <h3 className={`text-2xl font-black ${s.color}`}>{s.val}</h3>
               </div>
               <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                  <s.icon size={18} />
               </div>
            </div>
         ))}
      </div>
      {/* Navegação Superior do Encarregado — Fix #8 e #9: mobile-first com scroll */}
      <div className="flex items-center gap-2 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] shadow-sm sticky top-0 z-30 backdrop-blur-md overflow-x-auto custom-scrollbar">
         {[
           { id: "MY_UNITS", label: "Unidades", icon: Building2 },
           { id: "MY_COLABS", label: "Equipe", icon: Users },
           { id: "QUICK_ADMISSION", label: "Admissão", icon: UserPlus },
           { id: "PONTO", label: "Gestão de Ponto", icon: Clock, href: "/dashboard/rh/ponto" },
           { id: "REPORTS", label: "Informativos", icon: Send },
           { id: "EPI", label: "EPIs", icon: Package },
           { id: "CAT", label: "CAT", icon: ShieldCheck },
           { id: "MY_MISSIONS", label: "Missões", icon: Trophy },
           { id: "DISCIPLINA", label: "Advertências", icon: ShieldAlert },
           { id: "AVISO_EXP", label: "Aviso & Exp", icon: Activity },
           { id: "TRANSFERENCIAS", label: "Transferências", icon: ArrowUpRight },
           { id: "TICKETS", label: "Ocorrências", icon: AlertTriangle },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => {
               if (tab.href) {
                 router.push(tab.href);
               } else {
                 setActiveTab(tab.id as any);
               }
             }}
             className={`flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
           >
             <tab.icon size={15} />
             <span className="hidden sm:inline">{tab.label}</span>
           </button>
         ))}
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
           <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Carregando mapa operacional...</p>
        </div>
      ) : (
        <div className="flex-1">
           {activeTab === "MY_UNITS" && (
             <MyUnitsTab
               myUnits={myUnits}
               fullUnits={fullUnits}
               myColabs={myColabs}
               onPrintUnidades={handlePrintUnidadesInfo}
               onPrintRoute={() => setIsPrintModalOpen(true)}
               onEditUnidade={(unit) => {
                 const unitObj = fullUnits.find(u => u.nome === unit);
                 setUnidadeEditando(unitObj || { nome: unit });
                 setModalUnidade(true);
               }}
               onGoToTickets={(unit) => { setFiltroUnidadeOcorrencia(unit); setActiveTab("TICKETS"); }}
               onGoToAdmission={() => setActiveTab("QUICK_ADMISSION")}
             />
           )}
           {activeTab === "MY_COLABS" && (
             <MyColabsTab
               myColabs={myColabs}
               myUnits={myUnits}
               colabsFiltrados={colabsFiltrados}
               searchTerm={searchTerm}
               filtroUnidadeColab={filtroUnidadeColab}
               filtroCargoColab={filtroCargoColab}
               onSearchChange={setSearchTerm}
               onFiltroUnidadeChange={setFiltroUnidadeColab}
               onFiltroCargoChange={setFiltroCargoColab}
               onEditColab={setEditandoColab}
               onPrintRoute={() => setIsPrintModalOpen(true)}
               onGoToAdmission={() => setActiveTab("QUICK_ADMISSION")}
             />
           )}
           {activeTab === "QUICK_ADMISSION" && (
             <QuickAdmissionTab
               admissao={admissao}
               cargos={cargos}
               myUnits={myUnits}
               fullUnits={fullUnits}
               saving={saving}
               onAdmissaoChange={(field, value) => setAdmissao((prev: any) => ({ ...prev, [field]: value }))}
               onAdmissaoFull={setAdmissao}
               onSalvar={handleSalvarAdmissao}
             />
           )}
           {activeTab === "TICKETS" && renderTickets()}
           {activeTab === "REPORTS" && (
             <InformativosTab
               informativo={informativo}
               myUnits={myUnits}
               saving={saving}
               historicoInformativos={historicoInformativos}
               onInformativoChange={setInformativo}
               onSalvar={handleSaveInformativo}
               UserSearchInputComponent={UserSearchInput}
             />
           )}
           {activeTab === "EPI" && renderEPI()}
           {activeTab === "CAT" && renderCAT()}
           {activeTab === "MY_MISSIONS" && (
             <MyMissionsTab
               missoesAtivas={missoesAtivas}
               selectedMissao={selectedMissao}
               respostasMissao={respostasMissao}
               submittingMissao={submittingMissao}
               onSelectMissao={(m) => { setSelectedMissao(m); setRespostasMissao({}); }}
               onCloseMissao={() => setSelectedMissao(null)}
               onRespostaChange={(task, value) => setRespostasMissao((prev: any) => ({ ...prev, [task]: value }))}
               onAnswer={async () => {
                 if (!selectedMissao) return;
                 setSubmittingMissao(true);
                 const { error } = await supabase.from('missoes_respostas').upsert([{
                   missao_id: selectedMissao.id,
                   usuario_id: user.id,
                   respostas: respostasMissao,
                   status: 'CONCLUIDO',
                   updated_at: new Date().toISOString()
                 }], { onConflict: 'missao_id,usuario_id' });
                 if (!error) {
                   toast.success("Missão cumprida! Parabéns!");
                   setSelectedMissao(null);
                   fetchMissions();
                 } else {
                   toast.error("Erro ao enviar: " + error.message);
                 }
                 setSubmittingMissao(false);
               }}
             />
           )}
           {activeTab === "DISCIPLINA" && <DisciplinaPanel user={user} myColabs={myColabs} />}
           {activeTab === "TRANSFERENCIAS" && renderTransferencias()}
        </div>
      )}

       <FichaColaborador360 
         colabId={editandoColab?.id} 
         isOpen={!!editandoColab} 
         onClose={() => { setEditandoColab(null); setJustificativa(""); }} 
         canEdit={true}
         onUpdate={fetchEncarregadoData}
       />

       <AdaptiveModal isOpen={!!modalUnidade} onClose={() => setModalUnidade(null)} title="Editar Unidade">
          <div className="p-8">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                   <Settings size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-black text-[var(--text-primary)] uppercase">Editar Unidade</h3>
                   <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{unidadeEditando?.nome}</p>
                </div>
             </div>

             <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Secretaria / Órgão</label>
                      <input 
                         className="input-field w-full" 
                         value={unidadeEditando?.secretaria || ""} 
                         onChange={e => setUnidadeEditando({...unidadeEditando, secretaria: e.target.value.toUpperCase()})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Horário de Funcionamento</label>
                      <input 
                         className="input-field w-full" 
                         placeholder="Ex: 07:00 as 17:00"
                         value={unidadeEditando?.horario_funcionamento || ""} 
                         onChange={e => setUnidadeEditando({...unidadeEditando, horario_funcionamento: e.target.value.toUpperCase()})}
                      />
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Endereço Completo</label>
                   <input 
                      className="input-field w-full" 
                      value={unidadeEditando?.endereco || ""} 
                      onChange={e => setUnidadeEditando({...unidadeEditando, endereco: e.target.value.toUpperCase()})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Responsável Unidade</label>
                      <input 
                         className="input-field w-full" 
                         value={unidadeEditando?.responsavel_nome || unidadeEditando?.contato_nome || ""} 
                         onChange={e => setUnidadeEditando({...unidadeEditando, responsavel_nome: e.target.value.toUpperCase()})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Telefone Responsável</label>
                      <input 
                         className="input-field w-full" 
                         value={unidadeEditando?.responsavel_telefone || unidadeEditando?.contato_telefone || ""} 
                         onChange={e => setUnidadeEditando({...unidadeEditando, responsavel_telefone: e.target.value})}
                      />
                   </div>
                </div>

                <div className="p-6 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)]">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">Quantidade de Alunos</span>
                            <input 
                               type="number"
                               className="w-20 p-2 bg-white border border-[var(--border)] rounded-lg text-xs font-black text-center"
                               value={unidadeEditando?.quantidade_alunos || 0}
                               onChange={e => setUnidadeEditando({...unidadeEditando, quantidade_alunos: e.target.value})}
                            />
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">Ensino Integral?</span>
                            <button 
                               onClick={() => setUnidadeEditando({...unidadeEditando, is_integral: !unidadeEditando?.is_integral})}
                               className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${unidadeEditando?.is_integral ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                            >
                               {unidadeEditando?.is_integral ? 'SIM' : 'NÃO'}
                            </button>
                         </div>
                      </div>

                      <div className="space-y-4 border-l border-[var(--border)] pl-8">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">Tem Cozinheira Efetiva?</span>
                            <button 
                               onClick={() => setUnidadeEditando({...unidadeEditando, tem_cozinheira_efetiva: !unidadeEditando?.tem_cozinheira_efetiva})}
                               className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${unidadeEditando?.tem_cozinheira_efetiva ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                            >
                               {unidadeEditando?.tem_cozinheira_efetiva ? 'SIM' : 'NÃO'}
                            </button>
                         </div>
                         {unidadeEditando?.tem_cozinheira_efetiva && (
                            <div className="flex items-center justify-between animate-fade-in">
                               <span className="text-[10px] font-black uppercase text-[var(--text-primary)]">Qtd. Cozinheiras</span>
                               <input 
                                  type="number"
                                  className="w-20 p-2 bg-white border border-[var(--border)] rounded-lg text-xs font-black text-center"
                                  value={unidadeEditando?.quantidade_cozinheiras || 0}
                                  onChange={e => setUnidadeEditando({...unidadeEditando, quantidade_cozinheiras: e.target.value})}
                               />
                            </div>
                         )}
                      </div>
                   </div>
                </div>

                <button 
                   onClick={handleSaveUnidade}
                   disabled={saving}
                   className="w-full py-5 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] transition-all shadow-xl shadow-[var(--brand)]/20"
                >
                   {saving ? "Salvando Informações..." : "Atualizar Cadastro da Unidade"}
                </button>
             </div>
          </div>
       </AdaptiveModal>

      {/* MODAL IMPRIMIR ROTA */}
      <AdaptiveModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Personalizar Impressão de Rota"
        width="450px"
      >
        <div className="p-8 space-y-8">
           <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <Printer className="text-indigo-600" size={24} />
              <p className="text-[11px] font-bold text-indigo-900 leading-tight">Escolha quais informações você deseja incluir no seu roteiro impresso.</p>
           </div>

           <div className="grid grid-cols-1 gap-3">
              {Object.entries(printFields).map(([field, enabled]) => (
                <button
                  key={field}
                  onClick={() => setPrintFields({...printFields, [field]: !enabled})}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${enabled ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                   <span className="text-[10px] font-black uppercase tracking-widest">{field}</span>
                   {enabled ? <CheckCircle size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200" />}
                </button>
              ))}
           </div>

           <button
              onClick={handlePrintRoute}
              className="w-full h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
           >
              <Printer size={18} /> Gerar PDF do Roteiro
           </button>
        </div>
      </AdaptiveModal>

      {/* MODAL RECIBO DE ENTREGA (VISUALIZAÇÃO NO DASHBOARD - ENCARREGADO) */}
      <AdaptiveModal isOpen={!!entregaConfirmadaData} onClose={() => setEntregaConfirmadaData(null)} title="Ficha de Entrega de EPI (NR-06)" width="1200px">
         {entregaConfirmadaData && (
         <div className="p-10 space-y-8 bg-slate-100 min-h-screen overflow-y-auto">
            <div className="bg-white p-12 shadow-2xl rounded-sm w-full max-w-[1100px] border border-slate-300 mx-auto" id="print-recibo-content">
               
               {/* CABEÇALHO SST */}
               <div className="border-[4px] border-black p-4 mb-8 flex justify-between items-center" style={{borderColor: 'black'}}>
                  <div className="space-y-1">
                     <h2 className="text-2xl font-black uppercase tracking-tighter italic" style={{margin: 0, fontSize: '24px', fontWeight: '900', fontStyle: 'italic'}}>Alicerce ERP</h2>
                     <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500" style={{fontSize: '9px', fontWeight: 'bold', color: '#666', marginTop: '5px'}}>Sistema de Gestão Logística e Segurança</p>
                  </div>
                  <div className="text-right border-l-2 border-black pl-8" style={{borderLeft: '2px solid black', paddingLeft: '30px', textAlign: 'right'}}>
                     <h3 className="text-xl font-black uppercase tracking-tight" style={{fontSize: '20px', fontWeight: '900', margin: 0}}>Ficha de Entrega de EPI</h3>
                     <p className="text-[10px] font-black uppercase text-slate-600" style={{fontSize: '10px', fontWeight: '900', color: '#666', marginTop: '5px'}}>Equipamento de Proteção Individual - NR-06</p>
                  </div>
               </div>

               {/* DADOS DO COLABORADOR */}
               <div className="grid grid-cols-3 gap-0 border-x-2 border-t-2 border-black mb-8 bg-slate-50/50" style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '2px solid black', marginBottom: '30px', background: '#f9f9f9'}}>
                  <div className="p-4 border-r-2 border-black" style={{padding: '15px', borderRight: '2px solid black'}}>
                     <label className="text-[8px] font-black uppercase text-slate-500 block mb-1" style={{fontSize: '8px', fontWeight: '900', color: '#666', marginBottom: '5px'}}>Nome do Colaborador / Funcionário</label>
                     <p className="text-xs font-black uppercase" style={{fontSize: '12px', fontWeight: '900'}}>{entregaConfirmadaData.colaborador}</p>
                  </div>
                  <div className="p-4 border-r-2 border-black" style={{padding: '15px', borderRight: '2px solid black'}}>
                     <label className="text-[8px] font-black uppercase text-slate-500 block mb-1" style={{fontSize: '8px', fontWeight: '900', color: '#666', marginBottom: '5px'}}>Responsável</label>
                     <p className="text-xs font-black uppercase" style={{fontSize: '12px', fontWeight: '900'}}>{user.nome}</p>
                  </div>
                  <div className="p-4" style={{padding: '15px'}}>
                     <label className="text-[8px] font-black uppercase text-slate-500 block mb-1" style={{fontSize: '8px', fontWeight: '900', color: '#666', marginBottom: '5px'}}>Data da Entrega</label>
                     <p className="text-xs font-black uppercase" style={{fontSize: '12px', fontWeight: '900'}}>{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
               </div>

               {/* TABELA DE ITENS */}
               <div className="border-2 border-black rounded-none mb-8 overflow-hidden" style={{border: '2px solid black', marginBottom: '30px'}}>
                  <table className="w-full text-left border-collapse" style={{width: '100%', borderCollapse: 'collapse'}}>
                     <thead>
                        <tr className="bg-black text-white text-[9px] font-black uppercase tracking-widest" style={{background: 'black', color: 'white'}}>
                           <th className="p-3 border-r border-white/20 w-[45%]" style={{padding: '12px', fontSize: '9px', fontWeight: '900', textAlign: 'left'}}>Descrição do Item (EPI/EPC)</th>
                           <th className="p-3 text-center border-r border-white/20" style={{padding: '12px', textAlign: 'center', fontSize: '9px', fontWeight: '900'}}>C.A.</th>
                           <th className="p-3 text-center border-r border-white/20" style={{padding: '12px', textAlign: 'center', fontSize: '9px', fontWeight: '900'}}>Tam</th>
                           <th className="p-3 text-center border-r border-white/20" style={{padding: '12px', textAlign: 'center', fontSize: '9px', fontWeight: '900'}}>U.M.</th>
                           <th className="p-3 text-center" style={{padding: '12px', textAlign: 'center', fontSize: '9px', fontWeight: '900'}}>Qtd</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-black">
                        {entregaConfirmadaData.itens.map((item: any) => (
                           <tr key={item.id} className="text-[10px] font-bold uppercase" style={{fontSize: '10px', fontWeight: 'bold'}}>
                              <td className="p-3 border-r border-black" style={{padding: '12px', border: '1px solid black'}}>{item.item}</td>
                              <td className="p-3 text-center border-r border-black font-black text-blue-800" style={{padding: '12px', textAlign: 'center', border: '1px solid black', fontWeight: '900', color: '#1e40af'}}>{item.ca || 'N/A'}</td>
                              <td className="p-3 text-center border-r border-black" style={{padding: '12px', textAlign: 'center', border: '1px solid black'}}>{item.tamanho || 'UN'}</td>
                              <td className="p-3 text-center border-r border-black" style={{padding: '12px', textAlign: 'center', border: '1px solid black'}}>{item.unidade_medida || 'UN'}</td>
                              <td className="p-3 text-center font-black bg-slate-50 text-sm" style={{padding: '12px', textAlign: 'center', border: '1px solid black', fontSize: '14px', background: '#f9f9f9', fontWeight: '900'}}>{item.qtd_entrega}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* TERMO DE RESPONSABILIDADE */}
               <div className="border-2 border-black p-6 bg-slate-50 mb-10" style={{border: '2px solid black', padding: '20px', background: '#f9f9f9', marginBottom: '40px'}}>
                  <h4 className="text-[10px] font-black uppercase mb-4 underline decoration-2" style={{margin: '0 0 10px 0', fontSize: '10px', fontWeight: '900', textDecoration: 'underline'}}>Termo de Responsabilidade e Ciência (NR-06 / CLT)</h4>
                  <p className="text-[9px] font-bold text-justify leading-relaxed uppercase" style={{margin: 0, fontSize: '9px', lineHeight: '1.6', textAlign: 'justify', fontWeight: 'bold'}}>
                     Declaro ter recebido os equipamentos de proteção individual (EPIs) constantes desta ficha, os quais são de uso obrigatório nas minhas atividades, estando em perfeito estado de conservação e uso. Comprometo-me a utilizá-los apenas para a finalidade a que se destinam, responsabilizando-me pela sua guarda e conservação, observando as normas de segurança da empresa e as diretrizes da NR-06. Estou ciente de que o não uso dos mesmos constitui falta grave, passível de punições disciplinares conforme a CLT, bem como autorizo o desconto em folha de pagamento em caso de extravio ou dano por uso inadequado, conforme Artigo 462 da CLT.
                  </p>
               </div>

               {/* ASSINATURAS */}
               <div className="grid grid-cols-2 gap-20 pt-10" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', marginTop: '60px'}}>
                  <div className="flex flex-col items-center" style={{textAlign: 'center'}}>
                     <div className="w-full border-b-2 border-black mb-2" style={{borderBottom: '2px solid black', marginBottom: '10px', height: '60px'}}></div>
                     <p className="text-[9px] font-black uppercase" style={{fontSize: '10px', fontWeight: '900'}}>Assinatura do Colaborador</p>
                     <p className="text-[7px] text-slate-500 mt-1 uppercase" style={{fontSize: '7px', color: '#999', marginTop: '5px'}}>Ciente em: {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex flex-col items-center" style={{textAlign: 'center'}}>
                     <div className="w-full border-b-2 border-black mb-2" style={{borderBottom: '2px solid black', marginBottom: '10px', height: '60px'}}></div>
                     <p className="text-[9px] font-black uppercase" style={{fontSize: '10px', fontWeight: '900'}}>Encarregado / Responsável</p>
                     <p className="text-[7px] text-slate-500 mt-1 uppercase" style={{fontSize: '7px', color: '#999', marginTop: '5px'}}>{user.nome}</p>
                  </div>
               </div>

               {/* RODAPÉ TÉCNICO */}
               <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between items-center text-[7px] font-bold text-slate-400 uppercase" style={{marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#999', fontWeight: 'bold'}}>
                  <span>Documento gerado eletronicamente pelo Alicerce ERP</span>
                  <span>Encarregado: {user.nome} • Via Única</span>
               </div>

            </div>

            <div className="flex gap-4 justify-center mt-8">
               <button 
                  onClick={() => setEntregaConfirmadaData(null)}
                  className="px-8 py-4 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
               >
                  Fechar
               </button>
               <button 
                  onClick={handleImprimirRecibo}
                  className="px-8 py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3"
               >
                  <Printer size={18} /> Imprimir Recibo
               </button>
            </div>
         </div>
         )}
      </AdaptiveModal>

    </div>
  );
}
