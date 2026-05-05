"use client";
import { useState, useEffect, useMemo } from "react";
import { 
  Users, Activity, ShieldCheck, AlertTriangle, 
  Clock, Package, MapPin, Search, Filter,
  CheckCircle, ArrowUpRight, Building2, User, UserPlus, Edit3,
  Settings, Save, Lock, LogOut, Send
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import FichaColaborador360 from "../FichaColaborador360";

export default function EncarregadoModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<"MY_UNITS" | "MY_COLABS" | "QUICK_ADMISSION" | "TICKETS" | "REPORTS" | "CAT">(() => {
    if (!initialTab) return "MY_UNITS";
    const t = initialTab.toUpperCase();
    if (t === "VISAO" || t === "UNIDADES") return "MY_UNITS";
    if (t === "EQUIPE" || t === "COLABS") return "MY_COLABS";
    if (t === "ADMISSAO" || t === "CADASTRO") return "QUICK_ADMISSION";
    if (t === "TICKETS" || t === "OCORRENCIAS") return "TICKETS";
    if (t === "INFORMATIVOS" || t === "REPORTS") return "REPORTS";
    if (t === "CAT" || t === "ACIDENTE") return "CAT";
    return "MY_UNITS";
  });
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [fullUnits, setFullUnits] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [myColabs, setMyColabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [admissao, setAdmissao] = useState<any>({ 
    nome: '', telefone: '', unidade: '', secretaria: '', funcao: '',
    insalubridade: 'N/A', carga_horaria: '44H', periodo: 'DIURNO',
    horario_entrada: '07:00', horario_saida: '17:00',
    escala_tipo: 'DIARIO', data_referencia: new Date().toISOString().split('T')[0],
    salario_base: 0, valor_alimentacao: 0, valor_vale_transporte: 0
  });
  const [editandoColab, setEditandoColab] = useState<any>(null);
  const [justificativa, setJustificativa] = useState("");
  const [filtroUnidadeOcorrencia, setFiltroUnidadeOcorrencia] = useState("");
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
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
    solucoes_propostas: ''
  });
   const [buscaColab, setBuscaColab] = useState("");
   const [colabsSugeridos, setColabsSugeridos] = useState<any[]>([]);
   const [campoBuscaAtivo, setCampoBuscaAtivo] = useState<"interessado" | "citado" | "substituto" | "ausente" | "acidentado">("interessado");

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
      // 1. Buscar unidades sob responsabilidade deste encarregado
      const { data: units } = await supabase
        .from('unidades')
        .select('nome')
        .eq('encarregado_id', user.id);

      const unitNames = units?.map(u => u.nome) || [];
      setMyUnits(unitNames);

      // Buscar detalhes das unidades (incluindo secretaria)
      if (unitNames.length > 0) {
        const { data: unitsDetail } = await supabase.from('unidades').select('*').in('nome', unitNames);
        setFullUnits(unitsDetail || []);
      }

      // 2. Buscar colaboradores alocados nessas unidades
      if (unitNames.length > 0) {
        const { data: colabs } = await supabase
          .from('usuarios')
          .select('*')
          .in('unidade_alocacao', unitNames);
        setMyColabs(colabs || []);
      }

      // 3. Buscar ocorrências (Minhas Unidades + Onde fui citado + Meu Setor)
      const orFilter = unitNames.length > 0 
        ? `unidade.in.(${unitNames.map(u => `"${u}"`).join(',')}),responsavel_citado_id.eq.${user.id},setor_destino.eq.${user.secretaria}`
        : `responsavel_citado_id.eq.${user.id},setor_destino.eq.${user.secretaria}`;

      const { data: tickets } = await supabase
        .from('tickets_sla')
        .select('*')
        .or(orFilter)
        .order('data_abertura', { ascending: false });
      
      setOcorrencias(tickets || []);

      // 4. Buscar Cargos Mestres
      const { data: cargosDb } = await supabase.from('cargos').select('*').order('nome');
      if (cargosDb) setCargos(cargosDb);

    } catch (err) {
      console.error("Erro ao carregar dados do encarregado:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (t: any) => {
    const agora = new Date();
    const abertura = new Date(t.data_abertura);
    const deadlineAcordado = t.prazo_prometido ? new Date(t.prazo_prometido) : null;
    const diffDiasSolicitado = Math.floor((agora.getTime() - abertura.getTime()) / (1000 * 60 * 60 * 24));
    const isAtrasadoSolicitado = diffDiasSolicitado >= (t.prazo_estipulado_dias || 1);

    if (t.status === 'RESOLVIDO') return { label: 'Resolvido', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    if (t.status === 'RESOLVIDO_COM_ATRASO') return { label: 'Resolvido (Atraso)', color: 'bg-amber-100 text-amber-700 border border-amber-300', icon: CheckCircle };
    
    if (deadlineAcordado && agora > deadlineAcordado && !t.status?.startsWith('RESOLVIDO')) {
      return { label: 'FALIT (Não Cumprido)', color: 'bg-black text-white border-2 border-red-600 animate-pulse', icon: ShieldCheck };
    }
    if (isAtrasadoSolicitado && !t.status?.startsWith('RESOLVIDO')) {
      return { label: 'URGENTE (Atrasado)', color: 'bg-red-600 text-white', icon: AlertTriangle };
    }
    if (t.status === 'RECEBIDO' || t.status === 'EM ANALISE') return { label: 'Em Atendimento', color: 'bg-blue-100 text-blue-700', icon: Clock };
    return { label: 'Aguardando', color: 'bg-orange-100 text-orange-700', icon: Clock };
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

    return { totalOcorrencias, emAberto, citadas, falit };
  }, [ocorrencias, user.id]);

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
      alert("Dados da unidade atualizados!");
      setModalUnidade(null);
      fetchEncarregadoData();
    } else {
      alert("Erro ao salvar: " + error.message);
    }
    setSaving(false);
  };

  const generateCATPDF = (data: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header - Clean for B&W
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ALICERCE", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text("INVESTIGACAO DE ACIDENTE DE TRABALHO (CAT)", pageWidth / 2, 25, { align: "center" });
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
      showHead: 'firstPage',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // 2. Ocorrência
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['2. DETALHES DA OCORRENCIA', '']],
      body: [
        ['DATA DO ACIDENTE:', data.data_ocorrido],
        ['HORARIO:', data.horario_ocorrido],
        ['TIPO:', data.tipo_acidente],
        ['LOCAL EXATO:', data.local_ocorrido],
        ['DESCRICAO DO LOCAL:', data.descricao_local],
      ],
      theme: 'grid',
      showHead: 'firstPage',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // 3. Narrativa - Justified Text
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['3. NARRATIVA DA INVESTIGACAO']],
      body: [
        [{ content: 'DESCRICAO DETALHADA DO OCORRIDO:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: data.descricao_ocorrido, styles: { halign: 'justify' } }],
        [{ content: 'ACOES TOMADAS DURANTE A OCORRENCIA:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: data.acoes_tomadas || 'NAO INFORMADO', styles: { halign: 'justify' } }],
        [{ content: 'RELATO PESSOAL DO ACIDENTADO:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: data.relato_pessoal || 'NAO INFORMADO', styles: { halign: 'justify' } }],
      ],
      theme: 'grid',
      showHead: 'firstPage',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // 4. Analise Tecnica
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['4. ANALISE TECNICA E ACOMPANHAMENTO', '']],
      body: [
        ['AGENTE CAUSADOR:', data.agente_causador],
        ['PARTE DO CORPO ATINGIDA:', data.parte_corpo_atingida],
        ['ACOMPANHAMENTO ATUAL:', data.acompanhamento_medico],
      ],
      theme: 'grid',
      showHead: 'firstPage',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // 5. Conclusao - Justified Text
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['5. CONCLUSAO E MEDIDAS PREVENTIVAS']],
      body: [
        [{ content: 'REAL MOTIVO (CAUSA RAIZ):', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: data.real_motivo, styles: { halign: 'justify' } }],
        [{ content: 'SOLUCOES PROPOSTAS PARA EVITAR RECORRENCIA:', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }],
        [{ content: data.solucoes_propostas, styles: { halign: 'justify' } }],
      ],
      theme: 'grid',
      showHead: 'firstPage',
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
    setSaving(true);
    const { error } = await supabase
      .from('informativos_operacionais')
      .insert([{
        ...informativo,
        criado_por_id: user.id,
        criado_por_nome: user.nome
      }]);

    if (!error) {
      alert("Informativo registrado com sucesso!");
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
      setActiveTab("MY_UNITS");
    } else {
      alert("Erro ao salvar: " + error.message);
    }
    setSaving(false);
  };

  const handleSaveCAT = async () => {
    if (!catForm.colaborador_id || !catForm.descricao_ocorrido) {
      alert("Por favor, selecione o colaborador e descreva o ocorrido.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('investigacao_cat').insert([{
      ...catForm,
      encarregado_responsavel_id: user.id
    }]);
    if (!error) {
      alert("Investigação de CAT registrada com sucesso! O SESMT/RH foi notificado.");
      generateCATPDF(catForm);
      setCatForm({
        colaborador_id: '', colaborador_nome: '', colaborador_cpf: '', colaborador_cargo: '', unidade_alocada: '',
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
        solucoes_propostas: ''
      });
      setActiveTab("MY_UNITS");
    } else alert("Erro ao salvar CAT: " + error.message);
    setSaving(false);
  };

  const renderMyUnits = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="kpi-card bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] overflow-hidden">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Minhas Unidades</p>
          <h4 className="text-4xl font-black text-[var(--text-primary)] px-1">{myUnits.length}</h4>
        </div>
        <div className="kpi-card bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] overflow-hidden">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Meus Colaboradores</p>
          <h4 className="text-4xl font-black text-[var(--text-primary)] px-1">{myColabs.length}</h4>
        </div>
        <div className="kpi-card bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] overflow-hidden">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Média p/ Rota</p>
          <h4 className="text-4xl font-black text-[var(--neon-blue)] px-1">{myUnits.length > 0 ? (myColabs.length / myUnits.length).toFixed(1) : 0}</h4>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1 italic">Povoamento Operacional</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Cadastre colaboradores diretamente nas suas unidades de rota</p>
        </div>
        <button 
          onClick={() => setActiveTab("QUICK_ADMISSION")}
          className="px-10 py-4 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[var(--brand)]/20 flex items-center gap-3"
        >
          <UserPlus size={18} /> Admissão Rápida
        </button>
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
          <div className="flex justify-between items-center mb-8 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]">
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
                   onClick={() => setActiveTab("QUICK_ADMISSION")}
                   className="h-10 px-6 bg-[var(--brand)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[var(--brand)]/20 flex items-center gap-2"
                >
                   <UserPlus size={14} /> Nova Admissão
                </button>
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
                   {myColabs
                    .filter(c => 
                      c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      c.cpf?.includes(searchTerm)
                    )
                    .map((colab, i) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          <div className="lg:col-span-8 space-y-10">
            {/* BLOCO 1: IDENTIFICAÇÃO */}
            <div className="space-y-6">
               <p className="text-[10px] font-black uppercase text-red-600 flex items-center gap-2 italic">
                  <Users size={14} /> 1. Identificação do Acidentado
               </p>
               <div className="p-8 bg-[var(--bg-base)] rounded-[2rem] border border-[var(--border)] group transition-all hover:border-red-400">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-4 block">Pesquisar Colaborador</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                    <input 
                      className="input-field w-full !pl-14 !h-16 !bg-white border-none shadow-sm"
                      placeholder="Busque por nome..."
                      onChange={e => {
                        const term = e.target.value.toLowerCase();
                        if (term.length > 2) {
                          const suggested = myColabs.filter(c => c.nome.toLowerCase().includes(term));
                          setColabsSugeridos(suggested.slice(0, 5));
                          setCampoBuscaAtivo("acidentado");
                        } else setColabsSugeridos([]);
                      }}
                    />
                  </div>
                  {catForm.colaborador_nome && (
                    <div className="mt-6 grid grid-cols-2 gap-4 p-5 bg-white rounded-2xl border border-red-100 animate-fade-in">
                       <div>
                          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">Colaborador</p>
                          <p className="text-xs font-black text-[var(--text-primary)] uppercase">{catForm.colaborador_nome}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">CPF</p>
                          <p className="text-xs font-black text-[var(--text-primary)]">{catForm.colaborador_cpf || 'Não Informado'}</p>
                       </div>
                       <div className="mt-2">
                          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">Cargo</p>
                          <p className="text-xs font-black text-[var(--text-primary)] uppercase">{catForm.colaborador_cargo}</p>
                       </div>
                       <div className="mt-2">
                          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">Unidade</p>
                          <p className="text-xs font-black text-[var(--text-primary)] uppercase">{catForm.unidade_alocada}</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* BLOCO 2: OCORRÊNCIA */}
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Local (Unidade/Posto)</label>
                    <input className="input-field w-full !h-14 font-black" placeholder="Onde exatamente?" value={catForm.local_ocorrido} onChange={e => setCatForm({...catForm, local_ocorrido: e.target.value.toUpperCase()})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Descrição do Local</label>
                    <input className="input-field w-full !h-14 font-black" placeholder="Ex: Cozinha, Pátio, Escada Norte" value={catForm.descricao_local} onChange={e => setCatForm({...catForm, descricao_local: e.target.value.toUpperCase()})} />
                  </div>
               </div>
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
                      <textarea className="input-field w-full !h-24 !text-[10px] p-4 bg-white" placeholder="Nome/Telefone e breve depoimento das testemunhas..." value={catForm.testemunhas_detalhes} onChange={e => setCatForm({...catForm, testemunhas_detalhes: e.target.value})}></textarea>
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
               {saving ? "Registrando Protocolo Crítico..." : "Finalizar e Enviar Investigação de CAT"}
            </button>
          </div>

          <div className="lg:col-span-4 space-y-8">
             {colabsSugeridos.length > 0 ? (
               <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] animate-fade-in shadow-xl">
                  <p className="text-[10px] font-black uppercase text-red-600 mb-6 flex items-center gap-2 italic">
                     <Search size={14} /> Selecionar Acidentado
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                     {colabsSugeridos.map((c, idx) => (
                       <button 
                         key={idx}
                         onClick={() => selecionarColab(c)}
                         className="p-5 bg-[var(--bg-base)] hover:bg-red-600 hover:text-white rounded-2xl border border-[var(--border)] transition-all text-left group"
                       >
                          <p className="text-xs font-black uppercase">{c.nome}</p>
                          <p className="text-[9px] font-bold opacity-60 uppercase">{c.unidade_alocacao || 'Sem Unidade'}</p>
                       </button>
                     ))}
                  </div>
               </div>
             ) : (
               <div className="bg-red-500/5 p-10 rounded-[3rem] border border-dashed border-red-500/20 text-center py-20">
                  <ShieldCheck className="text-red-500 mx-auto mb-6 opacity-30" size={48} />
                  <p className="text-[11px] font-black uppercase text-red-700 tracking-widest leading-loose">
                     A investigação de acidente <br /> é um dever legal <br /> (Lei 8.213/91)
                  </p>
               </div>
             )}

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
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pr-4">
                     <div className="text-right">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Abertura</p>
                        <p className="text-xs font-black text-[var(--text-primary)]">{new Date(ticket.data_abertura).toLocaleDateString()}</p>
                     </div>
                     <button className="p-4 bg-[var(--bg-base)] hover:bg-[var(--brand)] hover:text-white rounded-2xl text-[var(--brand)] transition-all shadow-sm group-hover:scale-105">
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
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Data da Ocorrência</label>
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
                  <label className="text-[10px] font-black uppercase text-blue-600 mb-3 block italic">Colaborador que fez o Extra (Substituto)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                    <input 
                      className="input-field w-full !pl-12 !h-14 bg-white"
                      placeholder="Pesquisar por nome..."
                      onChange={e => {
                        const term = e.target.value.toLowerCase();
                        if (term.length > 2) {
                          const suggested = myColabs.filter(c => c.nome.toLowerCase().includes(term));
                          setColabsSugeridos(suggested.slice(0, 5));
                          setCampoBuscaAtivo("substituto");
                        } else setColabsSugeridos([]);
                      }}
                    />
                    {informativo.colaborador_substituto_nome && (
                      <div className="mt-3 text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
                        <CheckCircle size={14} /> Selecionado: {informativo.colaborador_substituto_nome}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                  <label className="text-[10px] font-black uppercase text-red-600 mb-3 block italic">Colaborador que Faltou (Ausente)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={18} />
                    <input 
                      className="input-field w-full !pl-12 !h-14 bg-white"
                      placeholder="Pesquisar por nome..."
                      onChange={e => {
                        const term = e.target.value.toLowerCase();
                        if (term.length > 2) {
                          const suggested = myColabs.filter(c => c.nome.toLowerCase().includes(term));
                          setColabsSugeridos(suggested.slice(0, 5));
                          setCampoBuscaAtivo("ausente");
                        } else setColabsSugeridos([]);
                      }}
                    />
                    {informativo.colaborador_ausente_nome && (
                      <div className="mt-3 text-[10px] font-black text-red-600 uppercase flex items-center gap-2">
                        <CheckCircle size={14} /> Selecionado: {informativo.colaborador_ausente_nome}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block italic">Colaborador Ausente</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input 
                    className="input-field w-full !pl-12 !h-14"
                    placeholder="Pesquisar por nome..."
                    onChange={e => {
                      const term = e.target.value.toLowerCase();
                      if (term.length > 2) {
                        const suggested = myColabs.filter(c => c.nome.toLowerCase().includes(term));
                        setColabsSugeridos(suggested.slice(0, 5));
                        setCampoBuscaAtivo("ausente");
                      } else setColabsSugeridos([]);
                    }}
                  />
                  {informativo.colaborador_ausente_nome && (
                    <div className="mt-3 text-[10px] font-black text-[var(--brand)] uppercase flex items-center gap-2">
                      <CheckCircle size={14} /> Selecionado: {informativo.colaborador_ausente_nome}
                    </div>
                  )}
                </div>
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

        {/* LADO DIREITO: SUGESTÕES DE COLAB (SE ESTIVER BUSCANDO) */}
        <div className="space-y-6">
           {colabsSugeridos.length > 0 ? (
             <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] animate-fade-in shadow-xl">
                <p className="text-[10px] font-black uppercase text-[var(--brand)] mb-6 flex items-center gap-2 italic">
                   <Search size={14} /> Selecionar {campoBuscaAtivo === 'substituto' ? 'Substituto' : 'Ausente'}
                </p>
                <div className="grid grid-cols-1 gap-3">
                   {colabsSugeridos.map((c, idx) => (
                     <button 
                       key={idx}
                       onClick={() => selecionarColab(c)}
                       className="p-5 bg-[var(--bg-base)] hover:bg-[var(--brand)] hover:text-white rounded-2xl border border-[var(--border)] transition-all text-left group"
                     >
                        <p className="text-xs font-black uppercase">{c.nome}</p>
                        <p className="text-[9px] font-bold opacity-60 uppercase">{c.unidade_alocacao || 'Sem Unidade'}</p>
                     </button>
                   ))}
                </div>
             </div>
           ) : (
             <div className="bg-[var(--bg-card)]/50 p-10 rounded-[3rem] border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
                   <Users className="text-[var(--text-muted)] opacity-30" size={32} />
                </div>
                <p className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest leading-loose">
                   Utilize o campo de busca <br /> para selecionar os colaboradores
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );

  const handleSalvarAdmissao = async () => {
    if (!admissao.nome || !admissao.telefone || !admissao.unidade) {
      alert("Por favor, preencha todos os campos.");
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
      alert("Colaborador cadastrado e ATIVO no sistema!");
      setAdmissao({ nome: '', telefone: '', unidade: '', secretaria: '' });
      fetchEncarregadoData();
      setActiveTab("MY_COLABS");
    } else {
      alert("Erro ao cadastrar: " + error.message);
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

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 max-w-[1400px] mx-auto w-full">
      
      {/* DASHBOARD DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Minhas Unidades', val: myUnits.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-500/10' },
           { label: 'Meus Colaboradores', val: myColabs.length, icon: Users, color: 'text-green-600', bg: 'bg-green-500/10' },
           { label: 'Citado em Ocorrências', val: stats.citadas, icon: User, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
           { label: 'Ocorrências Ativas', val: stats.emAberto, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10' },
         ].map((s, idx) => (
            <div key={idx} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] flex items-center justify-between group hover:scale-[1.02] transition-all cursor-default shadow-sm">
               <div>
                  <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider mb-1">{s.label}</p>
                  <h3 className={`text-3xl font-black ${s.color}`}>{s.val}</h3>
               </div>
               <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                  <s.icon size={22} />
               </div>
            </div>
         ))}
      </div>
      {/* Navegação Superior do Encarregado */}
      <div className="flex flex-wrap items-center gap-4 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border)] shadow-sm sticky top-0 z-30 backdrop-blur-md overflow-x-auto custom-scrollbar">
         {[
           { id: "MY_UNITS", label: "Minhas Unidades", icon: Building2 },
           { id: "MY_COLABS", label: "Minha Equipe", icon: Users },
           { id: "QUICK_ADMISSION", label: "Admissão Rápida", icon: UserPlus },
           { id: "REPORTS", label: "Informativos", icon: Send },
           { id: "CAT", label: "Investigação CAT", icon: ShieldCheck },
           { id: "TICKETS", label: "Ocorrências", icon: AlertTriangle },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-3 px-8 py-4 rounded-xl text-[0.7rem] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
           >
             <tab.icon size={18} />
             {tab.label}
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
           {activeTab === "MY_UNITS" && renderMyUnits()}
           {activeTab === "MY_COLABS" && renderMyColabs()}
           {activeTab === "QUICK_ADMISSION" && renderQuickAdmission()}
           {activeTab === "TICKETS" && renderTickets()}
           {activeTab === "REPORTS" && renderReports()}
           {activeTab === "CAT" && renderCAT()}
        </div>
      )}

       <FichaColaborador360 
         colabId={editandoColab?.id} 
         isOpen={!!editandoColab} 
         onClose={() => { setEditandoColab(null); setJustificativa(""); }} 
         canEdit={true}
         onUpdate={fetchEncarregadoData}
       />

       <AdaptiveModal isOpen={!!modalUnidade} onClose={() => setModalUnidade(null)}>
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
    </div>
  );
}
