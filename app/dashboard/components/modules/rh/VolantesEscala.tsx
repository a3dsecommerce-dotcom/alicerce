"use client";
import { useState, useEffect } from "react";
import { Truck, Calendar, MapPin, User, FileText, Plus, Clock, Save, Trash2, TrendingUp, Building2, ClipboardList, Settings, Send, RefreshCw, Table2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface VolantesEscalaProps {
  volantes: any[];
  requisicoes: any[];
  refresh: () => void;
  user: any;
}

export default function VolantesEscala({ volantes, requisicoes = [], refresh, user }: VolantesEscalaProps) {
  const [modalNovo, setModalNovo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"escala" | "solicitacoes" | "volantes">("escala");
  const [filtroSolicitacao, setFiltroSolicitacao] = useState<"todas" | "pendentes" | "concluidas">("pendentes");
  const [modalSettings, setModalSettings] = useState(false);
  const [grupoJid, setGrupoJid] = useState("");
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [loadingOS, setLoadingOS] = useState<string | null>(null);
  const [loadingAmanha, setLoadingAmanha] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importResult, setImportResult] = useState<{imported: number; skipped: number; total_rows: number} | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [horariosDisparo, setHorariosDisparo] = useState("");

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .in('chave', ['WHATSAPP_GRUPO_VOLANTES_JID', 'N8N_ESCALA_AMANHA_WEBHOOK_URL', 'GOOGLE_SHEET_VOLANTES_URL', 'HORARIO_DISPARO_ESCALA']);
      if (data) {
        const jidConfig = data.find((c: any) => c.chave === 'WHATSAPP_GRUPO_VOLANTES_JID');
        if (jidConfig) setGrupoJid(jidConfig.valor);
        const webhookConfig = data.find((c: any) => c.chave === 'N8N_ESCALA_AMANHA_WEBHOOK_URL');
        if (webhookConfig) setN8nWebhookUrl(webhookConfig.valor);
        const sheetConfig = data.find((c: any) => c.chave === 'GOOGLE_SHEET_VOLANTES_URL');
        if (sheetConfig) setGoogleSheetUrl(sheetConfig.valor);
        const horariosConfig = data.find((c: any) => c.chave === 'HORARIO_DISPARO_ESCALA');
        if (horariosConfig) setHorariosDisparo(horariosConfig.valor);
      }
    };
    fetchConfigs();
  }, []);

  const handleSaveConfigs = async () => {
    setLoading(true);
    const { error: err1 } = await supabase
      .from('configuracoes_sistema')
      .upsert({
        chave: 'WHATSAPP_GRUPO_VOLANTES_JID',
        valor: grupoJid,
        updated_at: new Date().toISOString()
      }, { onConflict: 'chave' });

    const { error: err2 } = await supabase
      .from('configuracoes_sistema')
      .upsert({
        chave: 'N8N_ESCALA_AMANHA_WEBHOOK_URL',
        valor: n8nWebhookUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'chave' });

    const { error: err3 } = await supabase
      .from('configuracoes_sistema')
      .upsert({
        chave: 'GOOGLE_SHEET_VOLANTES_URL',
        valor: googleSheetUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'chave' });

    const { error: err4 } = await supabase
      .from('configuracoes_sistema')
      .upsert({
        chave: 'HORARIO_DISPARO_ESCALA',
        valor: horariosDisparo,
        updated_at: new Date().toISOString()
      }, { onConflict: 'chave' });

    if (!err1 && !err2 && !err3 && !err4) {
      toast.success("Configurações atualizadas!");
      setModalSettings(false);
    } else {
      toast.error("Erro ao salvar configurações.");
    }
    setLoading(false);
  };

  const handleDispararEscalaAmanha = async () => {
    setLoadingAmanha(true);
    try {
      const res = await fetch('/api/volantes/escala-amanha', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Escala de amanhã disparada com sucesso!");
      } else {
        toast.error(data.error || "Erro ao disparar escala de amanhã.");
      }
    } catch (err: any) {
      toast.error("Erro na comunicação com o servidor: " + err.message);
    }
    setLoadingAmanha(false);
  };

  const handleImportarPlanilha = async () => {
    setLoadingImport(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/volantes/importar-planilha', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult({ imported: data.imported, skipped: data.skipped, total_rows: data.total_rows });
        toast.success(`Importação concluída! ${data.imported} novas solicitações importadas. ${data.skipped} já existentes ignoradas.`);
        refresh();
      } else {
        toast.error(data.error || "Erro ao importar planilha.");
      }
    } catch (err: any) {
      toast.error("Erro na comunicação com o servidor: " + err.message);
    }
    setLoadingImport(false);
  };

  const [activeVolantesList, setActiveVolantesList] = useState<any[]>([]);
  const [loadingVolantesList, setLoadingVolantesList] = useState(false);
  const [modalAdmitir, setModalAdmitir] = useState(false);
  
  const [formAdmissao, setFormAdmissao] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    cargo: "ASG VOLANTE",
    unidade: "OPERAÇÃO",
    data_admissao: format(new Date(), "yyyy-MM-dd"),
    insalubridade: 20
  });

  const [buscaUnidadeBase, setBuscaUnidadeBase] = useState("OPERAÇÃO");
  const [unidadesBaseSugeridas, setUnidadesBaseSugeridas] = useState<any[]>([]);

  const [duplicateCheck, setDuplicateCheck] = useState<{
    exists: boolean;
    colaborador?: { nome: string; telefone: string; status: string } | null;
    loading: boolean;
  }>({ exists: false, colaborador: null, loading: false });

  useEffect(() => {
    const cleanNome = (formAdmissao.nome || "").trim().replace(/,/g, "");
    const cleanTelefone = (formAdmissao.telefone || "").trim().replace(/,/g, "");

    if (cleanNome.length < 3 && cleanTelefone.length < 8) {
      setDuplicateCheck({ exists: false, colaborador: null, loading: false });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setDuplicateCheck(prev => ({ ...prev, loading: true }));
      try {
        const filters = [];
        if (cleanNome.length >= 3) {
          filters.push(`nome.ilike.${cleanNome}`);
        }
        if (cleanTelefone.length >= 8) {
          filters.push(`telefone.eq.${cleanTelefone}`);
        }

        if (filters.length > 0) {
          const { data, error } = await supabase
            .from('usuarios')
            .select('nome, telefone, status')
            .or(filters.join(','))
            .limit(1);

          if (!error && data && data.length > 0) {
            setDuplicateCheck({
              exists: true,
              colaborador: data[0],
              loading: false
            });
          } else {
            setDuplicateCheck({ exists: false, colaborador: null, loading: false });
          }
        }
      } catch (err) {
        console.error("Erro na verificação de duplicados:", err);
        setDuplicateCheck({ exists: false, colaborador: null, loading: false });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formAdmissao.nome, formAdmissao.telefone]);

  const fetchActiveVolantes = async () => {
    setLoadingVolantesList(true);
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('cargo', '%volante%')
      .eq('status', 'ATIVO')
      .order('nome', { ascending: true });
    
    if (data) {
      setActiveVolantesList(data);
    }
    setLoadingVolantesList(false);
  };

  useEffect(() => {
    if (activeSubTab === "volantes") {
      fetchActiveVolantes();
    }
  }, [activeSubTab]);

  const searchUnidadesBase = async (val: string) => {
    setBuscaUnidadeBase(val);
    if (val.length > 1) {
      const { data } = await supabase.from('unidades').select('*').ilike('nome', `%${val}%`).limit(5);
      if (data) setUnidadesBaseSugeridas(data);
    } else {
      setUnidadesBaseSugeridas([]);
    }
  };

  const handleFinalizarAdmissao = async () => {
    if (!formAdmissao.nome || !formAdmissao.telefone) {
      return toast.error("Preencha Nome e Telefone.");
    }
    setLoading(true);
    
    const { error: insertError } = await supabase.from('usuarios').insert([{
      nome: formAdmissao.nome.toUpperCase(),
      telefone: formAdmissao.telefone,
      cpf: formAdmissao.cpf || "000.000.000-00",
      cargo: formAdmissao.cargo,
      unidade_alocacao: formAdmissao.unidade,
      status: 'ATIVO',
      data_admissao: formAdmissao.data_admissao,
      nivel_acesso: 1,
      insalubridade: formAdmissao.insalubridade || 0,
      created_at: new Date().toISOString()
    }]);

    if (insertError) {
      toast.error("Erro ao realizar admissão: " + insertError.message);
      setLoading(false);
      return;
    }

    await supabase.from('atividades').insert([{
      usuario_id: user.id,
      usuario_nome: user.nome || user.name,
      mensagem: `Realizou admissão do volante ${formAdmissao.nome.toUpperCase()}`,
      tipo: "RH",
      created_at: new Date().toISOString()
    }]);

    toast.success("Volante admitido com sucesso!");
    setModalAdmitir(false);
    setFormAdmissao({
      nome: "",
      telefone: "",
      cpf: "",
      cargo: "ASG VOLANTE",
      unidade: "OPERAÇÃO",
      data_admissao: format(new Date(), "yyyy-MM-dd"),
      insalubridade: 20
    });
    setBuscaUnidadeBase("OPERAÇÃO");
    setDuplicateCheck({ exists: false, colaborador: null, loading: false });
    fetchActiveVolantes();
    refresh();
    setLoading(false);
  };

  const handleEnviarOrdemServico = async (escala: any, targetUnidade?: string) => {
    if (!grupoJid) {
      return toast.error("Configure o ID do grupo do WhatsApp nas Configurações (ícone de engrenagem).");
    }
    const detalhes = escala.detalhes_visitas || [];
    if (detalhes.length === 0) {
      return toast.error("Esta escala não possui roteiro de visitas configurado.");
    }

    setLoadingOS(escala.id);
    let sucessos = 0;
    
    for (const d of detalhes) {
      if (targetUnidade && d.unidade !== targetUnidade) continue;

      let substituindo = "";
      const motivoUpper = (d.motivo || "").toUpperCase();
      if (motivoUpper.includes("SUBST:")) {
        substituindo = d.motivo.substring(motivoUpper.indexOf("SUBST:") + 6).trim();
      } else {
        substituindo = d.motivo || "";
      }

      let insalubridade = 0;
      if (motivoUpper.includes("20%")) insalubridade = 20;
      else if (motivoUpper.includes("40%")) insalubridade = 40;
      
      const payload = {
        volanteNome: escala.colaborador_nome,
        unidadeNome: d.unidade,
        substituindoNome: substituindo,
        horario: `${d.entrada} às ${d.saida || '17:00'}`,
        insalubridade: insalubridade || null,
        grupoJid: grupoJid
      };

      try {
        const res = await fetch('/api/volantes/os', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          sucessos++;
        } else {
          console.error(`Erro ao enviar OS para unidade ${d.unidade}:`, resData.error);
        }
      } catch (err: any) {
        console.error("Exceção ao enviar OS:", err.message);
      }
    }

    if (sucessos > 0) {
      toast.success(`Ordem de Serviço enviada (${sucessos} mensagens)!`);
    } else {
      toast.error("Falha ao enviar Ordem de Serviço. Verifique as configurações e tente novamente.");
    }
    setLoadingOS(null);
  };

  const canEdit = Number(user?.nivel || user?.nivel_acesso) >= 3 || 
                  user?.nivel === 3 || user?.nivel === '3' ||
                  user?.nivel_acesso === 3 || user?.nivel_acesso === '3' ||
                  user?.role?.toUpperCase().includes('GERENTE') || 
                  user?.role?.toUpperCase().includes('ADMIN') ||
                  user?.cargo?.toUpperCase().includes('GERENTE') ||
                  user?.cargo?.toUpperCase().includes('ADMIN') ||
                  user?.role?.toUpperCase().includes('MASTER');
  
  const [formData, setFormData] = useState({
    colaborador_id: "",
    colaborador_nome: "",
    data: format(new Date(), "yyyy-MM-dd"),
    observacoes: "",
    detalhes: [] as any[]
  });

  const [modalRequisicao, setModalRequisicao] = useState<any>(null);
  const [detalhesUnidade, setDetalhesUnidade] = useState<any>(null);
  const [loadingUnidade, setLoadingUnidade] = useState(false);
  const [selectedApproveDate, setSelectedApproveDate] = useState("");
  const [volanteAprovadoId, setVolanteAprovadoId] = useState("");
  const [volanteAprovadoNome, setVolanteAprovadoNome] = useState("");
  const [buscaVolanteAprovado, setBuscaVolanteAprovado] = useState("");
  const [volantesAprovadosSugeridos, setVolantesAprovadosSugeridos] = useState<any[]>([]);

  const handleVerRequisicao = (req: any) => {
    setModalRequisicao(req);
    setSelectedApproveDate(req.data_inicio);
    setVolanteAprovadoId("");
    setVolanteAprovadoNome("");
    setBuscaVolanteAprovado("");
    fetchUnitData(req.unidade_destino);
  };

  const fetchUnitData = async (unidadeNome: string) => {
    setLoadingUnidade(true);
    setDetalhesUnidade(null);
    const { data } = await supabase
      .from('unidades')
      .select('*')
      .eq('nome', unidadeNome)
      .single();
    if (data) setDetalhesUnidade(data);
    setLoadingUnidade(false);
  };

  const searchVolantesAprovados = async (val: string) => {
    setBuscaVolanteAprovado(val);
    let query = supabase
      .from('usuarios')
      .select('*')
      .ilike('cargo', '%volante%')
      .eq('status', 'ATIVO')
      .order('nome', { ascending: true });

    if (val.trim().length > 0) {
      query = query.ilike('nome', `%${val}%`);
    }

    const { data } = await query.limit(20);
    if (data) {
      setVolantesAprovadosSugeridos(data);
    } else {
      setVolantesAprovadosSugeridos([]);
    }
  };

  const handleAprovarDia = async () => {
    if (!volanteAprovadoId) return toast.error("Selecione um colaborador volante");
    if (!selectedApproveDate) return toast.error("Selecione a data de aprovação");

    setLoading(true);
    
    // 1. Criar Escala de Volante
    const { error: errEscala } = await supabase.from('escala_volantes').insert([{
      colaborador_id: volanteAprovadoId,
      colaborador_nome: volanteAprovadoNome,
      data: selectedApproveDate,
      detalhes_visitas: [{ 
        unidade: modalRequisicao.unidade_destino, 
        entrada: "07:00", 
        saida: "17:00", 
        motivo: (!modalRequisicao.colaborador_substituido_nome || 
                 modalRequisicao.colaborador_substituido_nome === 'NÃO INFORMADO' || 
                 modalRequisicao.colaborador_substituido_nome === 'VAGA ABERTA')
          ? `Vaga Aberta (${modalRequisicao.funcao_substituicao || '—'})`
          : `Subst: ${modalRequisicao.colaborador_substituido_nome} (${modalRequisicao.funcao_substituicao || '—'})` 
      }],
      observacoes: (!modalRequisicao.colaborador_substituido_nome || 
                    modalRequisicao.colaborador_substituido_nome === 'NÃO INFORMADO' || 
                    modalRequisicao.colaborador_substituido_nome === 'VAGA ABERTA')
        ? `Aprovado via Solicitação (Vaga Aberta).`
        : `Aprovado via Solicitação. Subst: ${modalRequisicao.colaborador_substituido_nome}. Atestado: ${modalRequisicao.is_atestado ? 'Sim' : 'Não'}`,
      criado_por_id: user.id,
      criado_por_nome: user.name || user.nome
    }]);

    if (errEscala) {
      toast.error("Erro ao gerar escala: " + errEscala.message);
      setLoading(false);
      return;
    }

    // 2. Atualizar requisição
    const alocados = modalRequisicao.colaboradores_alocados || [];
    const { error: errReq } = await supabase.from('requisicoes_volantes')
      .update({ 
        status: 'ATENDIDA', 
        colaboradores_alocados: [...alocados, volanteAprovadoId] 
       })
      .eq('id', modalRequisicao.id);

    if (!errReq) {
      toast.success("Dia aprovado e volante escalado com sucesso!");
      
      // Enviar Ordem de Serviço automatizada
      if (grupoJid) {
        const payloadOS = {
          volanteNome: volanteAprovadoNome,
          unidadeNome: modalRequisicao.unidade_destino,
          substituindoNome: modalRequisicao.colaborador_substituido_nome || "",
          horario: "07:00 às 17:00",
          insalubridade: modalRequisicao.asg_porcentagem || null,
          grupoJid: grupoJid
        };
        fetch('/api/volantes/os', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadOS)
        }).then(res => res.json()).then(resData => {
          if (resData.success) {
            toast.success("Ordem de Serviço enviada ao WhatsApp!");
          } else {
            console.error("Erro ao enviar OS automática:", resData.error);
          }
        }).catch(err => {
          console.error("Exceção ao enviar OS automática:", err.message);
        });
      }

      setModalRequisicao(null);
      refresh();
    } else {
      toast.error("Erro ao atualizar requisição.");
    }
    setLoading(false);
  };

  const handleFinalizarSemVolante = async () => {
    if (!modalRequisicao) return;
    setLoading(true);
    const { error } = await supabase
      .from('requisicoes_volantes')
      .update({
        status: 'NAO_ATENDIDA'
      })
      .eq('id', modalRequisicao.id);

    if (!error) {
      toast.success("Solicitação encerrada como vaga não preenchida.");
      setModalRequisicao(null);
      refresh();
    } else {
      toast.error("Erro ao atualizar solicitação: " + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (v: any) => {
    setEditingId(v.id);
    setFormData({
      colaborador_id: v.colaborador_id,
      colaborador_nome: v.colaborador_nome,
      data: v.data,
      observacoes: v.observacoes || "",
      detalhes: v.detalhes_visitas || []
    });
    setBuscaColab(v.colaborador_nome);
    setModalNovo(true);
  };

  const [novoDetalhe, setNovoDetalhe] = useState({
    unidade: "",
    entrada: "",
    saida: "",
    motivo: ""
  });

  // Busca de colaboradores
  const [buscaColab, setBuscaColab] = useState("");
  const [colabsSugeridos, setColabsSugeridos] = useState<any[]>([]);
  const searchColabs = async (val: string) => {
    setBuscaColab(val);
    let query = supabase
      .from('usuarios')
      .select('*')
      .ilike('cargo', '%volante%')
      .eq('status', 'ATIVO')
      .order('nome', { ascending: true });

    if (val.trim().length > 0) {
      query = query.ilike('nome', `%${val}%`);
    }

    const { data } = await query.limit(20);
    if (data) {
      setColabsSugeridos(data);
    } else {
      setColabsSugeridos([]);
    }
  };
  // Busca de unidades
  const [buscaUnidade, setBuscaUnidade] = useState("");
  const [unidadesSugeridas, setUnidadesSugeridas] = useState<any[]>([]);

  const searchUnidades = async (val: string) => {
    setBuscaUnidade(val);
    if (val.length > 1) {
      const { data } = await supabase.from('unidades').select('*').ilike('nome', `%${val}%`).limit(5);
      if (data) setUnidadesSugeridas(data);
    } else {
      setUnidadesSugeridas([]);
    }
  };

  const addDetalhe = () => {
    if (!novoDetalhe.unidade || !novoDetalhe.entrada) return toast.error("Preencha unidade e entrada");
    setFormData({ ...formData, detalhes: [...formData.detalhes, novoDetalhe] });
    setNovoDetalhe({ unidade: "", entrada: "", saida: "", motivo: "" });
    setBuscaUnidade("");
  };

  const removeDetalhe = (idx: number) => {
    setFormData({ ...formData, detalhes: formData.detalhes.filter((_, i) => i !== idx) });
  };

  const handleSalvar = async () => {
    if (!formData.colaborador_id || formData.detalhes.length === 0) return toast.error("Preencha o colaborador e ao menos uma unidade.");
    
    setLoading(true);
    
    const payload = {
      colaborador_id: formData.colaborador_id,
      colaborador_nome: formData.colaborador_nome,
      data: formData.data,
      detalhes_visitas: formData.detalhes,
      observacoes: formData.observacoes,
      updated_at: new Date()
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('escala_volantes').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('escala_volantes').insert([{
        ...payload,
        criado_por_id: user.id,
        criado_por_nome: user.name || user.nome
      }]);
      error = err;
    }

    if (!error) {
      toast.success(editingId ? "Escala atualizada!" : "Escala registrada!");
      
      // Se for um novo registro e houver grupoJid, enviar OS
      if (!editingId && grupoJid) {
        handleEnviarOrdemServico({
          colaborador_nome: formData.colaborador_nome,
          detalhes_visitas: formData.detalhes,
          id: "new"
        });
      }

      setModalNovo(false);
      setEditingId(null);
      setFormData({ colaborador_id: "", colaborador_nome: "", data: format(new Date(), "yyyy-MM-dd"), observacoes: "", detalhes: [] });
      setBuscaColab("");
      setBuscaUnidade("");
      refresh();
    } else {
      toast.error("Erro ao salvar escala.");
    }
    setLoading(false);
  };

  const handleGerarPDFMensal = () => {
    const doc = new jsPDF();
    const mesFormatado = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`ESCALA MENSAL DE VOLANTES - ${mesFormatado.toUpperCase()}`, 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    const filtrados = volantes.filter(v => {
      const d = new Date(v.data);
      return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
    });

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Colaborador', 'Unidade 1', 'Unidade 2']],
      body: filtrados.map(v => [
        format(new Date(v.data), "dd/MM/yyyy"),
        v.colaborador_nome,
        v.detalhes_visitas[0] ? `${v.detalhes_visitas[0].unidade} (${v.detalhes_visitas[0].entrada}-${v.detalhes_visitas[0].saida || '...'})` : '-',
        v.detalhes_visitas[1] ? `${v.detalhes_visitas[1].unidade} (${v.detalhes_visitas[1].entrada}-${v.detalhes_visitas[1].saida || '...'})` : '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      styles: { fontSize: 7, font: "helvetica" }
    });

    doc.save(`Escala_Volantes_${format(selectedMonth, "MM_yyyy")}.pdf`);
  };

  const todayVolantes = volantes.filter(v => v.data === format(new Date(), "yyyy-MM-dd"));
  // Contabilização de Conformidade
  const totalRequests = requisicoes.length;
  const atendidas = requisicoes.filter(r => r.status === 'ATENDIDA' || r.status === 'APROVADO').length;
  const naoAtendidas = requisicoes.filter(r => r.status === 'NAO_ATENDIDA' || r.status === 'NEGADO').length;
  const pendentes = requisicoes.filter(r => r.status === 'PENDENTE').length;
  const totalResolvidas = atendidas + naoAtendidas;
  const taxaPreenchimento = totalResolvidas > 0 ? Math.round((atendidas / totalResolvidas) * 100) : 0;

  const requisicoesFiltradas = requisicoes.filter(r => {
    if (filtroSolicitacao === "pendentes") return r.status === "PENDENTE";
    if (filtroSolicitacao === "concluidas") return r.status === "ATENDIDA" || r.status === "NAO_ATENDIDA" || r.status === "APROVADO" || r.status === "NEGADO";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-500/20 shadow-inner">
            <Truck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Escala de Volantes</h2>
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Logística de deslocamento e substituições</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
            <button onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><Calendar size={14} /></button>
            <span className="text-[10px] font-black uppercase px-4">{format(selectedMonth, "MMM yyyy", { locale: ptBR })}</span>
            <button onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><Calendar size={14} /></button>
          </div>
          <button onClick={handleGerarPDFMensal} className="h-12 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg">
             <FileText size={16} /> Escala Mensal PDF
          </button>
          {canEdit && (
            <>
              <button 
                onClick={() => setModalSettings(true)} 
                className="h-12 w-12 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl flex items-center justify-center hover:bg-[var(--bg-base)] transition-all shadow-sm cursor-pointer"
                title="Configurações do WhatsApp"
              >
                <Settings size={18} />
              </button>
              <button onClick={() => setModalNovo(true)} className="h-12 px-8 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-indigo-600/20">
                <Plus size={16} /> Novo Registro
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navegação por Sub-Abas */}
      <div className="flex border-b border-[var(--border)] gap-6">
        <button
          onClick={() => setActiveSubTab("escala")}
          className={`pb-4 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${activeSubTab === "escala" ? "border-indigo-600 text-indigo-600" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          <Calendar size={14} /> Escalas & Escala do Dia
        </button>
        <button
          onClick={() => setActiveSubTab("solicitacoes")}
          className={`pb-4 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${activeSubTab === "solicitacoes" ? "border-indigo-600 text-indigo-600" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          <ClipboardList size={14} /> Solicitações dos Diretores
          {pendentes > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[9px] font-black">
              {pendentes}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("volantes")}
          className={`pb-4 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${activeSubTab === "volantes" ? "border-indigo-600 text-indigo-600" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          <User size={14} /> Volantes Ativos
          {activeVolantesList.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black">
              {activeVolantesList.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "escala" ? (
        <div className="space-y-6">
          {/* QUADRO DE ESCALA DO DIA COMPACTO */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl shadow-sm">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border)] mb-4 gap-3">
                <div className="flex items-center gap-2">
                   <Calendar size={16} className="text-indigo-600" />
                   <span className="text-xs font-black uppercase text-[var(--text-primary)]">Escala do Dia</span>
                   <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">({format(new Date(), "dd 'de' MMMM", { locale: ptBR })})</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                   <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-[9px] font-black uppercase border border-indigo-200/20">
                      {todayVolantes.length} Volantes Ativos Hoje
                   </span>
                   {canEdit && (
                     <button
                       onClick={handleDispararEscalaAmanha}
                       disabled={loadingAmanha}
                       className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                       title="Enviar escala consolidada de amanhã via n8n"
                     >
                       {loadingAmanha ? (
                         <>
                           <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           Enviando...
                         </>
                       ) : (
                         <>
                           <Send size={12} /> Disparar Escala de Amanhã
                         </>
                       )}
                     </button>
                   )}
                </div>
             </div>
             
             {todayVolantes.length === 0 ? (
               <div className="py-6 text-center italic text-[10px] font-black uppercase text-[var(--text-muted)] opacity-60">
                 Nenhum volante escalado para hoje.
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {todayVolantes.map((v, i) => (
                    <div key={i} className="bg-[var(--bg-base)]/50 border border-[var(--border)] p-4 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-800 transition-all cursor-pointer group" onClick={() => handleEdit(v)}>
                       <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                             <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black text-white text-[10px] shadow-sm shrink-0">
                                {v.colaborador_nome?.charAt(0)}
                             </div>
                             <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-tight truncate text-[var(--text-primary)]">{v.colaborador_nome}</p>
                                <p className="text-[8px] font-bold text-indigo-500 uppercase truncate">Substituição Ativa</p>
                             </div>
                          </div>
                          {canEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnviarOrdemServico(v);
                              }}
                              disabled={loadingOS === v.id}
                              className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50 shrink-0 border border-emerald-200/50"
                              title="Enviar Ordem de Serviço via WhatsApp"
                            >
                              {loadingOS === v.id ? (
                                <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Send size={12} />
                              )}
                            </button>
                          )}
                       </div>
                      <div className="space-y-1">
                         {v.detalhes_visitas.map((d: any, idx: number) => (
                           <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-[var(--border)] rounded-xl text-[8px] font-black uppercase shadow-xs">
                              <span className="flex items-center gap-1.5 truncate max-w-[120px]"><MapPin size={8} className="text-indigo-500" /> {d.unidade}</span>
                              <span className="text-[8px] font-black text-indigo-600 shrink-0">{d.entrada}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

          {/* Tabela de Escalas do Mês */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] pl-8">Data / Registro</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Colaborador Volante</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Roteiro Diário (Máx 2 Unidades)</th>
                    {canEdit && <th className="p-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-right pr-8">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {volantes.filter(v => {
                    const d = new Date(v.data);
                    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
                  }).map((v, idx) => (
                    <tr key={idx} className="hover:bg-[var(--brand-alpha)] transition-all group">
                      <td className="p-6 pl-8 w-48">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[var(--text-primary)]">{format(new Date(v.data), "dd/MM/yyyy")}</span>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">ID-{v.id.substring(0,4)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 w-80">
                        <div 
                          className="flex items-center gap-4 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800 p-3 rounded-2xl transition-all border border-transparent hover:border-indigo-100"
                          onClick={() => handleEdit(v)}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-500/10 shadow-inner">
                            {v.colaborador_nome?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{v.colaborador_nome}</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-0.5">Base: {v.unidade_original || 'OPERAÇÃO'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-2">
                            {v.detalhes_visitas.map((d: any, i: number) => (
                              <div key={i} className="px-4 py-2 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center gap-3 shadow-sm hover:border-indigo-400 transition-all">
                                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                                    {i + 1}º
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-100 leading-none">{d.unidade}</p>
                                    <p className="text-[8px] font-bold text-indigo-500 uppercase mt-1">{d.entrada} - {d.saida || '...'}</p>
                                 </div>
                              </div>
                            ))}
                            {v.detalhes_visitas.length === 0 && (
                              <span className="text-[10px] font-black text-slate-400 uppercase italic">Nenhum roteiro definido</span>
                            )}
                        </div>
                      </td>
                      {canEdit && (
                        <td className="p-6 text-right pr-8">
                          <button
                            onClick={() => handleEnviarOrdemServico(v)}
                            disabled={loadingOS === v.id}
                            className="h-10 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/50 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
                            title="Disparar Ordem de Serviço no WhatsApp"
                          >
                            {loadingOS === v.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Send size={12} className="text-emerald-600" /> OS
                              </>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                   {volantes.filter(v => {
                    const d = new Date(v.data);
                    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
                  }).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center opacity-30">
                        <Truck size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhuma escala para este mês.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === "solicitacoes" ? (
        <div className="space-y-6">
          {/* Relatório de Conformidade */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
             <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
               <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Total Requisitado</span>
               <span className="text-2xl font-black text-[var(--text-primary)] mt-1">{totalRequests}</span>
             </div>
             <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
               <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Vagas Preenchidas</span>
               <span className="text-2xl font-black text-emerald-700 mt-1">{atendidas}</span>
             </div>
             <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl shadow-sm flex flex-col justify-between border-l-4 border-l-rose-500">
               <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider">Não Preenchidas</span>
               <span className="text-2xl font-black text-rose-700 mt-1">{naoAtendidas}</span>
             </div>
             <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
               <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Pendentes</span>
               <span className="text-2xl font-black text-[var(--text-primary)] mt-1">{pendentes}</span>
             </div>
             <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
               <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Conformidade Geral</span>
               <div className="flex items-center gap-3 mt-1">
                 <span className="text-2xl font-black text-[var(--text-primary)]">{taxaPreenchimento}%</span>
                 <div className="flex-1 bg-[var(--bg-base)] rounded-full h-2 overflow-hidden">
                   <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${taxaPreenchimento}%` }}></div>
                 </div>
               </div>
             </div>
          </div>

          {/* Filtros e Lista de Solicitações */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex flex-wrap gap-2">
              {(["pendentes", "concluidas", "todas"] as const).map((filtro) => (
                <button
                  key={filtro}
                  onClick={() => setFiltroSolicitacao(filtro)}
                  className={`h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${filtroSolicitacao === filtro ? "bg-indigo-600 text-white border-indigo-600" : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--bg-base)]"}`}
                >
                  {filtro === "pendentes" ? "Aguardando Atendimento" : filtro === "concluidas" ? "Histórico / Concluídas" : "Todas as Demandas"}
                </button>
              ))}
            </div>
            {canEdit && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImportarPlanilha}
                  disabled={loadingImport}
                  className="h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Sincronizar solicitações da planilha do Google Sheets"
                >
                  {loadingImport ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Table2 size={14} /> Sincronizar Planilha
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Resultado da última importação */}
          {importResult && (
            <div className="flex items-center gap-4 p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-2xl animate-fade-in">
              <RefreshCw size={18} className="text-teal-600 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-300">
                  Última Sincronização: {importResult.imported} novas solicitações importadas
                </p>
                <p className="text-[9px] font-bold text-teal-600/70 dark:text-teal-400/70 mt-0.5">
                  {importResult.total_rows} linhas processadas • {importResult.skipped} duplicatas ignoradas
                </p>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="text-teal-400 hover:text-teal-600 transition-colors text-[9px] font-black uppercase cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {requisicoesFiltradas.length === 0 ? (
            <div className="p-20 bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
               Nenhuma solicitação de volante nesta categoria.
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden">
               <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                     <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        <tr>
                           <th className="p-5 pl-8">Data / Autor</th>
                           <th className="p-5">Unidade Solicitante</th>
                           <th className="p-5">Colaborador Substituído</th>
                           <th className="p-5">Motivo Detalhado</th>
                           <th className="p-5">Status Vaga</th>
                           {canEdit && <th className="p-5 pr-8 text-right">Ações</th>}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border)] font-bold text-[var(--text-primary)]">
                        {requisicoesFiltradas.map((req) => (
                           <tr key={req.id} className="hover:bg-[var(--brand-alpha)] transition-all">
                              <td className="p-5 pl-8">
                                 <div className="flex flex-col">
                                    <span>{format(new Date(req.data_inicio + 'T00:00:00'), "dd/MM/yyyy")}</span>
                                    <span className="text-[8px] font-black uppercase text-[var(--text-muted)] mt-1">Cargo: {req.quem_requisitou || 'Diretoria'}</span>
                                 </div>
                              </td>
                              <td className="p-5 uppercase font-black">{req.unidade_destino}</td>
                              <td className="p-5">
                                 <div className="flex flex-col gap-1">
                                    {(!req.colaborador_substituido_nome || 
                                      req.colaborador_substituido_nome === 'NÃO INFORMADO' || 
                                      req.colaborador_substituido_nome === 'VAGA ABERTA') ? (
                                       <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 text-[9px] font-black uppercase w-fit">
                                          Vaga Aberta
                                       </span>
                                    ) : (
                                       <div className="flex flex-col">
                                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">Substituindo:</span>
                                          <span className="uppercase text-[11px] font-black text-[var(--text-primary)] leading-tight">{req.colaborador_substituido_nome}</span>
                                       </div>
                                    )}
                                    <span className="text-[8px] font-black text-indigo-600 uppercase mt-0.5">{req.funcao_substituicao || 'ASG'}</span>
                                 </div>
                              </td>
                              <td className="p-5 max-w-[200px] truncate uppercase">{req.motivo || '—'}</td>
                              <td className="p-5">
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${req.status === 'PENDENTE' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : req.status === 'ATENDIDA' || req.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-rose-50 text-rose-700 border border-rose-200/50'}`}>
                                    {req.status === 'PENDENTE' ? 'Pendente' : req.status === 'ATENDIDA' || req.status === 'APROVADO' ? 'Preenchida ✓' : 'Não Preenchida ❌'}
                                 </span>
                              </td>
                              {canEdit && (
                                 <td className="p-5 pr-8 text-right">
                                    <button
                                       onClick={() => handleVerRequisicao(req)}
                                       className="h-9 px-4 bg-slate-900 hover:bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-xs"
                                    >
                                       {req.status === 'PENDENTE' ? 'Atender Vaga' : 'Visualizar'}
                                    </button>
                                 </td>
                              )}
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      ) : null}

      {activeSubTab === "volantes" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header/Ações da Aba */}
          <div className="flex justify-between items-center gap-4 bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-3">
              <User size={18} className="text-indigo-600" />
              <div>
                <h3 className="text-xs font-black uppercase text-[var(--text-primary)]">Volantes Cadastrados</h3>
                <p className="text-[9px] text-[var(--text-muted)] font-black uppercase mt-0.5">
                  {activeVolantesList.length} {activeVolantesList.length === 1 ? "Volante Ativo" : "Volantes Ativos"} no sistema
                </p>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => setModalAdmitir(true)}
                className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus size={14} /> Admitir Novo Volante
              </button>
            )}
          </div>

          {/* Listagem/Tabela de Volantes */}
          {loadingVolantesList ? (
            <div className="p-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Carregando volantes ativos...</p>
            </div>
          ) : activeVolantesList.length === 0 ? (
            <div className="p-20 bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--text-muted)] font-black uppercase tracking-widest space-y-4">
              <User size={48} className="mx-auto mb-2 opacity-30 text-indigo-600" />
              <p>Nenhum volante ativo cadastrado no sistema.</p>
              {canEdit && (
                <button
                  onClick={() => setModalAdmitir(true)}
                  className="mx-auto h-10 px-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-indigo-200/50 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} /> Admitir Primeiro Volante
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    <tr>
                      <th className="p-5 pl-8">Colaborador</th>
                      <th className="p-5">CPF</th>
                      <th className="p-5">Cargo / Função</th>
                      <th className="p-5">Unidade Base</th>
                      <th className="p-5">Admissão</th>
                      <th className="p-5">Insalubridade</th>
                      <th className="p-5 pr-8 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-bold text-[var(--text-primary)]">
                    {activeVolantesList.map((volante) => (
                      <tr key={volante.id} className="hover:bg-[var(--brand-alpha)] transition-all">
                        <td className="p-5 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-500/10 shadow-inner">
                              {volante.nome?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black uppercase text-[11px] leading-none text-slate-800 dark:text-slate-100">{volante.nome}</p>
                              <p className="text-[9px] text-[var(--text-muted)] font-bold mt-1">{volante.telefone || "Sem telefone"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 font-mono text-[10px] tracking-tight">{volante.cpf || "000.000.000-00"}</td>
                        <td className="p-5">
                          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-[9px] font-black uppercase border border-indigo-200/20">
                            {volante.cargo || "VOLANTE"}
                          </span>
                        </td>
                        <td className="p-5 uppercase font-bold text-slate-600 dark:text-slate-300">{volante.unidade_alocacao || "OPERAÇÃO"}</td>
                        <td className="p-5">
                          {volante.data_admissao ? format(new Date(volante.data_admissao + "T00:00:00"), "dd/MM/yyyy") : "—"}
                        </td>
                        <td className="p-5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${volante.insalubridade > 0 ? "bg-red-50 text-red-700 border border-red-200/40" : "bg-slate-50 text-slate-500"}`}>
                            {volante.insalubridade > 0 ? `${volante.insalubridade}%` : "Não"}
                          </span>
                        </td>
                        <td className="p-5 pr-8 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full text-[8px] font-black uppercase">
                            {volante.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <AdaptiveModal isOpen={modalNovo} onClose={() => { setModalNovo(false); setEditingId(null); setFormData({ colaborador_id: "", colaborador_nome: "", data: format(new Date(), "yyyy-MM-dd"), observacoes: "", detalhes: [] }); setBuscaColab(""); }} title={editingId ? "Editar Escala Diária" : "Nova Escala Diária"}>
        <div className="p-6 md:p-10 space-y-10 max-h-[85vh] overflow-y-auto custom-scrollbar bg-[var(--bg-base)]/30">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                 <User size={14} className="text-indigo-600" /> Seleção do Colaborador
              </label>
              <div className="relative">
                <input 
                  className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 shadow-sm" 
                  placeholder="DIGITE O NOME PARA BUSCAR..." 
                  value={buscaColab}
                  onChange={(e) => searchColabs(e.target.value)}
                  onFocus={() => searchColabs(buscaColab)}
                />
                {colabsSugeridos.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-[var(--border)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                    {colabsSugeridos.map(c => (
                      <button key={c.id} onClick={() => { setFormData({...formData, colaborador_id: c.id, colaborador_nome: c.nome}); setBuscaColab(c.nome); setColabsSugeridos([]); }} className="w-full p-5 text-left hover:bg-indigo-50 border-b border-[var(--border)] last:border-none transition-colors">
                        <p className="text-xs font-black uppercase text-indigo-900">{c.nome}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{c.funcao || 'VOLANTE'} • {c.unidade_alocacao || 'OPERAÇÃO'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                 <Calendar size={14} className="text-indigo-600" /> Data da Escala
              </label>
              <input type="date" className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 shadow-sm" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
          </div>

            {(!editingId || canEdit) && (
              <div className="p-8 bg-white rounded-3xl border-2 border-indigo-100 shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                   <MapPin size={120} />
                </div>
                
                <h5 className="text-[11px] font-black uppercase text-indigo-600 flex items-center gap-3 italic">
                  <Plus size={18} className="bg-indigo-600 text-white rounded-lg p-0.5" /> Adicionar Roteiro de Visitas
                </h5>
    
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2 relative">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Unidade</p>
                    <input 
                      className="input-field !h-12 text-[11px] font-bold !bg-slate-50 border-transparent focus:!bg-white focus:border-indigo-200" 
                      placeholder="Buscar Escola..." 
                      value={buscaUnidade} 
                      onChange={(e) => searchUnidades(e.target.value)} 
                    />
                    {unidadesSugeridas.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border)] rounded-xl shadow-2xl z-[110] overflow-hidden">
                        {unidadesSugeridas.map(u => (
                          <button key={u.id} onClick={() => { setNovoDetalhe({...novoDetalhe, unidade: u.nome}); setBuscaUnidade(u.nome); setUnidadesSugeridas([]); }} className="w-full p-3 text-left hover:bg-indigo-50 border-b border-[var(--border)] last:border-none">
                            <p className="text-[10px] font-black uppercase text-indigo-900">{u.nome}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Entrada</p>
                    <input className="input-field !h-12 text-[11px] font-bold !bg-slate-50 border-transparent focus:!bg-white focus:border-indigo-200" placeholder="08:00" value={novoDetalhe.entrada} onChange={(e) => setNovoDetalhe({...novoDetalhe, entrada: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Saída</p>
                    <input className="input-field !h-12 text-[11px] font-bold !bg-slate-50 border-transparent focus:!bg-white focus:border-indigo-200" placeholder="12:00" value={novoDetalhe.saida} onChange={(e) => setNovoDetalhe({...novoDetalhe, saida: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Motivo</p>
                    <input className="input-field !h-12 text-[11px] font-bold !bg-slate-50 border-transparent focus:!bg-white focus:border-indigo-200" placeholder="Substituição" value={novoDetalhe.motivo} onChange={(e) => setNovoDetalhe({...novoDetalhe, motivo: e.target.value})} />
                  </div>
                </div>
    
                <button 
                  onClick={addDetalhe} 
                  className="w-full h-14 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  Confirmar Unidade no Roteiro
                </button>
              </div>
            )}

          {formData.detalhes.length > 0 && (
            <div className="space-y-6">
              <h5 className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div> Resumo do Roteiro Gerado
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formData.detalhes.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-white border-2 border-indigo-50 rounded-2xl shadow-sm hover:border-indigo-200 transition-all relative group">
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{d.unidade}</p>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1 flex items-center gap-1.5">
                         <Clock size={12} /> {d.entrada} às {d.saida || '...'}
                      </p>
                    </div>
                    {(!editingId || canEdit) && (
                      <button onClick={() => removeDetalhe(i)} className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-10">
            {canEdit ? (
              <button onClick={handleSalvar} disabled={loading} className="w-full h-20 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                {loading ? (
                  <> <div className="animate-spin rounded-full h-6 w-6 border-4 border-white/20 border-t-white"></div> PROCESSANDO... </>
                ) : (
                  <> <Save size={24} /> {editingId ? 'ATUALIZAR ESCALA' : 'SALVAR ESCALA DIÁRIA'} </>
                )}
              </button>
            ) : (
              <div className="p-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center gap-3">
                <TrendingUp size={32} className="text-amber-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 text-center leading-relaxed">
                  MODO DE CONSULTA: Seu nível de acesso permite apenas a consulta das escalas. <br/>
                  O registro e alterações são realizados exclusivamente pela Gerência ou Master (Nível 3+).
                </p>
              </div>
            )}
          </div>
        </div>
      </AdaptiveModal>

      {/* Modal Detalhado de Requisição e Aprovação Diária */}
      <AdaptiveModal
        isOpen={!!modalRequisicao}
        onClose={() => setModalRequisicao(null)}
        title="Detalhes da Solicitação de Volante"
        width="650px"
      >
        {modalRequisicao && (
          <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
            
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                {(modalRequisicao.quem_requisitou || 'DIRETORIA').toUpperCase()}
              </span>
              <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-xs">
                <Calendar size={14} /> 
                {format(new Date(modalRequisicao.data_inicio + 'T00:00:00'), "dd/MM/yyyy")} 
                {modalRequisicao.data_fim ? ` até ${format(new Date(modalRequisicao.data_fim + 'T00:00:00'), "dd/MM/yyyy")}` : ''}
              </div>
            </div>

            {/* School & Target info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Escola / Unidade</p>
                <p className="text-sm font-black uppercase text-[var(--text-primary)] flex items-center gap-1.5">
                  <Building2 size={14} className="text-indigo-600" /> {modalRequisicao.unidade_destino}
                </p>
              </div>

              <div className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Tipo de Vaga / Substituição</p>
                {(!modalRequisicao.colaborador_substituido_nome || 
                  modalRequisicao.colaborador_substituido_nome === 'NÃO INFORMADO' || 
                  modalRequisicao.colaborador_substituido_nome === 'VAGA ABERTA') ? (
                  <span className="px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 text-[9px] font-black uppercase w-fit block mt-1">
                     Vaga Aberta
                  </span>
                ) : (
                  <p className="text-sm font-black uppercase text-[var(--text-primary)] flex items-center gap-1.5 mt-1">
                    <User size={14} className="text-indigo-600" /> {modalRequisicao.colaborador_substituido_nome}
                  </p>
                )}
              </div>
            </div>

            {/* Atestado info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Motivo / Tipo</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${modalRequisicao.is_atestado ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {modalRequisicao.is_atestado ? 'Atestado Médico' : 'Falta comum / Outro'}
                </span>
              </div>

              <div className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Função / Cargo</p>
                <p className="text-xs font-black uppercase text-[var(--text-primary)]">
                  {modalRequisicao.funcao_substituicao || modalRequisicao.motivo || 'ASG'}
                </p>
              </div>
            </div>

            {/* MINI RELATÓRIO AUTOMÁTICO */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">📊 Mini Relatório Automático da Unidade</h4>
              
              {loadingUnidade ? (
                <div className="p-6 text-center text-xs font-bold text-[var(--text-muted)]">Carregando métricas da escola...</div>
              ) : detalhesUnidade ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-3xl">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Alunos Matriculados</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">{detalhesUnidade.quantidade_alunos || 0}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Regime Operacional</p>
                    <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                      {detalhesUnidade.is_integral ? 'Integral ☀️' : 'Parcial 🌤️'}
                    </p>
                  </div>

                  {/* Detalhes de ASG ou Cozinha */}
                  {(() => {
                    const func = (modalRequisicao.funcao_substituicao || "").toUpperCase();
                    if (func.includes("ASG")) {
                      return (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Grau Insalubridade</p>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-[9px] font-black uppercase">
                            {modalRequisicao.asg_porcentagem || 20}%
                          </span>
                        </div>
                      );
                    } else if (func.includes("COZINHA") || func.includes("COZINHEIRA")) {
                      const totalCoz = (detalhesUnidade.quantidade_cozinheiras || 0) + (detalhesUnidade.tem_cozinheira_efetiva ? 1 : 0);
                      const media = totalCoz > 0 ? Math.round(detalhesUnidade.quantidade_alunos / totalCoz) : detalhesUnidade.quantidade_alunos;
                      return (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Alunos por Cozinheira</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {media} / Cozinheira <span className="text-[8px] text-[var(--text-muted)]">({totalCoz} total)</span>
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Responsável</p>
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">{detalhesUnidade.responsavel_nome || '—'}</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-[10px] font-bold text-center">
                  Não foi possível obter dados operacionais automáticos da escola &quot;{modalRequisicao.unidade_destino}&quot;.
                </div>
              )}
            </div>

            {/* SEÇÃO DE APROVAÇÃO E ALOCAÇÃO DIÁRIA */}
            {modalRequisicao.status === 'PENDENTE' ? (
              <div className="border-t border-[var(--border)] pt-6 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">⚡ Aprovação e Escala Diária</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Selecionar Dia */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Selecionar Data a Aprovar</label>
                    <input 
                      type="date" 
                      className="input-field h-12 font-bold" 
                      value={selectedApproveDate}
                      min={modalRequisicao.data_inicio}
                      max={modalRequisicao.data_fim || modalRequisicao.data_inicio}
                      onChange={(e) => setSelectedApproveDate(e.target.value)} 
                    />
                    <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold mt-1">Os dias são dinâmicos para diversificar o envio de volantes.</p>
                  </div>

                  {/* Selecionar Volante */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Colaborador Volante</label>
                    <input 
                      className="input-field h-12 font-bold" 
                      placeholder="Digitar nome do volante..." 
                      value={buscaVolanteAprovado}
                      onChange={(e) => searchVolantesAprovados(e.target.value)}
                      onFocus={() => searchVolantesAprovados(buscaVolanteAprovado)}
                    />
                    {volantesAprovadosSugeridos.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border)] rounded-xl shadow-2xl z-[120] overflow-hidden">
                        {volantesAprovadosSugeridos.map(v => (
                          <button 
                            key={v.id} 
                            onClick={() => { 
                              setVolanteAprovadoId(v.id); 
                              setVolanteAprovadoNome(v.nome); 
                              setBuscaVolanteAprovado(v.nome); 
                              setVolantesAprovadosSugeridos([]); 
                            }} 
                            className="w-full p-3 text-left hover:bg-indigo-50 border-b border-[var(--border)] last:border-none"
                          >
                            <p className="text-[10px] font-black uppercase text-indigo-900">{v.nome}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">{v.cargo} • {v.unidade_alocacao || 'OPERAÇÃO'}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {volanteAprovadoNome && (
                      <p className="text-[9px] text-emerald-600 font-black uppercase mt-1">Selecionado: {volanteAprovadoNome}</p>
                    )}
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button className="flex-1 btn-ghost h-12 text-[9px] font-black uppercase" onClick={() => setModalRequisicao(null)}>
                    Voltar
                  </button>
                  <button 
                    className="flex-1 h-12 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg text-[9px] font-black uppercase border border-rose-200/50 transition-all shadow-xs"
                    onClick={handleFinalizarSemVolante}
                    disabled={loading}
                  >
                    Encerrar Sem Volante
                  </button>
                  <button 
                    className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase shadow-md transition-all disabled:opacity-50"
                    onClick={handleAprovarDia}
                    disabled={loading}
                  >
                    {loading ? 'Aprovando...' : 'Confirmar & Preencher Vaga'}
                  </button>
                </div>

              </div>
            ) : (
              <div className="border-t border-[var(--border)] pt-6 space-y-4">
                <div className={`p-6 rounded-2xl border text-center space-y-2 ${modalRequisicao.status === 'ATENDIDA' || modalRequisicao.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                  <h4 className="text-sm font-black uppercase">
                    {modalRequisicao.status === 'ATENDIDA' || modalRequisicao.status === 'APROVADO' ? '✓ Vaga Oficialmente Preenchida' : '❌ Vaga Encerrada Sem Preenchimento'}
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                    {modalRequisicao.status === 'ATENDIDA' || modalRequisicao.status === 'APROVADO' ? 'Esta solicitação foi atendida pela central e o volante foi alocado com sucesso.' : 'Esta solicitação foi finalizada sem volante disponível (contabilizada na conformidade).'}
                  </p>
                </div>
                <button className="w-full btn-ghost h-12 text-[9px] font-black uppercase" onClick={() => setModalRequisicao(null)}>
                  Fechar
                </button>
              </div>
            )}

          </div>
        )}
      </AdaptiveModal>

      {/* Modal de Configurações de Integração de Volantes */}
      <AdaptiveModal
        isOpen={modalSettings}
        onClose={() => setModalSettings(false)}
        title="Configurações de Integração de Volantes"
        width="450px"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
              <Settings size={14} className="text-indigo-600" /> ID do Grupo de Volantes (JID)
            </label>
            <input 
              type="text" 
              className="input-field h-12 font-bold" 
              placeholder="Ex: 120363023942039482@g.us" 
              value={grupoJid} 
              onChange={(e) => setGrupoJid(e.target.value)} 
            />
            <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold leading-normal">
              Insira o ID completo do grupo do WhatsApp de volantes obtido na Evolution API (JID terminado em @g.us).
              Você também pode inserir um número pessoal de teste (DDI + DDD + Número) para testar os disparos.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
              <Settings size={14} className="text-indigo-600" /> Webhook da Escala de Amanhã (n8n)
            </label>
            <input 
              type="text" 
              className="input-field h-12 font-bold" 
              placeholder="Ex: https://n8n.seuservidor.com/webhook/escala-amanha" 
              value={n8nWebhookUrl} 
              onChange={(e) => setN8nWebhookUrl(e.target.value)} 
            />
            <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold leading-normal">
              Insira a URL do webhook correspondente no n8n que receberá o payload consolidado com as escalas do dia seguinte.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
              <Table2 size={14} className="text-teal-600" /> URL da Planilha Google Sheets
            </label>
            <input 
              type="text" 
              className="input-field h-12 font-bold" 
              placeholder="Ex: https://docs.google.com/spreadsheets/d/.../edit?usp=sharing" 
              value={googleSheetUrl} 
              onChange={(e) => setGoogleSheetUrl(e.target.value)} 
            />
            <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold leading-normal">
              URL da planilha do Google Sheets com os pedidos de volantes dos diretores. A planilha deve estar compartilhada como &quot;Qualquer pessoa com o link&quot;.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
              <Clock size={14} className="text-indigo-600" /> Horários de Disparo Automático (Cron)
            </label>
            <input 
              type="text" 
              className="input-field h-12 font-bold" 
              placeholder="Ex: 20:00 ou 19:30, 20:30" 
              value={horariosDisparo} 
              onChange={(e) => setHorariosDisparo(e.target.value)} 
            />
            <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold leading-normal">
              Insira os horários em que a escala de amanhã será disparada automaticamente para o grupo, separados por vírgula. Ex: &quot;20:00&quot; ou &quot;19:30, 20:30&quot;.
            </p>
          </div>

          <button 
            onClick={handleSaveConfigs} 
            disabled={loading}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </AdaptiveModal>

      {/* Modal de Admissão de Volante */}
      <AdaptiveModal
        isOpen={modalAdmitir}
        onClose={() => {
          setModalAdmitir(false);
          setFormAdmissao({
            nome: "",
            telefone: "",
            cpf: "",
            cargo: "ASG VOLANTE",
            unidade: "OPERAÇÃO",
            data_admissao: format(new Date(), "yyyy-MM-dd"),
            insalubridade: 20
          });
          setBuscaUnidadeBase("OPERAÇÃO");
          setDuplicateCheck({ exists: false, colaborador: null, loading: false });
        }}
        title="Admissão de Colaborador Volante"
        width="600px"
      >
        <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {duplicateCheck.exists && duplicateCheck.colaborador && (
              <div className="col-span-2 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Atenção: Já existe um colaborador cadastrado com este Nome ou Telefone!
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                    Nome: <strong className="uppercase">{duplicateCheck.colaborador.nome}</strong> | Telefone: <strong>{duplicateCheck.colaborador.telefone}</strong> | Status: <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{duplicateCheck.colaborador.status}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Nome */}
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Nome Completo</label>
              <input
                type="text"
                className="input-field h-12 font-bold uppercase"
                placeholder="Ex: JOÃO DA SILVA"
                value={formAdmissao.nome}
                onChange={(e) => setFormAdmissao({ ...formAdmissao, nome: e.target.value })}
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Telefone / WhatsApp</label>
              <input
                type="text"
                className="input-field h-12 font-bold"
                placeholder="Ex: 27 99999-9999"
                value={formAdmissao.telefone}
                onChange={(e) => setFormAdmissao({ ...formAdmissao, telefone: e.target.value })}
              />
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">CPF</label>
              <input
                type="text"
                className="input-field h-12 font-bold"
                placeholder="Ex: 000.000.000-00"
                value={formAdmissao.cpf}
                onChange={(e) => setFormAdmissao({ ...formAdmissao, cpf: e.target.value })}
              />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Cargo / Função</label>
              <select
                className="w-full h-12 font-bold bg-white dark:bg-slate-900 border border-[var(--border)] rounded-xl px-3 text-xs"
                value={formAdmissao.cargo}
                onChange={(e) => setFormAdmissao({ ...formAdmissao, cargo: e.target.value })}
              >
                <option value="ASG VOLANTE">ASG VOLANTE</option>
                <option value="COZINHEIRA VOLANTE">COZINHEIRA VOLANTE</option>
                <option value="MOTORISTA VOLANTE">MOTORISTA VOLANTE</option>
                <option value="SERVIÇOS GERAIS VOLANTE">SERVIÇOS GERAIS VOLANTE</option>
              </select>
            </div>

            {/* Insalubridade */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Insalubridade</label>
              <select
                className="w-full h-12 font-bold bg-white dark:bg-slate-900 border border-[var(--border)] rounded-xl px-3 text-xs"
                value={formAdmissao.insalubridade}
                onChange={(e) => setFormAdmissao({ ...formAdmissao, insalubridade: Number(e.target.value) })}
              >
                <option value={20}>20% (Padrão ASG)</option>
                <option value={40}>40% (Máxima)</option>
                <option value={0}>Sem Insalubridade</option>
              </select>
            </div>

            {/* Data de Admissão */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Data de Admissão</label>
              <input
                type="date"
                className="input-field h-12 font-bold text-xs"
                value={formAdmissao.data_admissao}
                onChange={(e) => setFormAdmissao({ ...formAdmissao, data_admissao: e.target.value })}
              />
            </div>

            {/* Unidade Base (Autocomplete) */}
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Unidade Base (Alocação)</label>
              <input
                className="input-field h-12 font-bold"
                placeholder="Ex: OPERAÇÃO ou Buscar Escola..."
                value={buscaUnidadeBase}
                onChange={(e) => searchUnidadesBase(e.target.value)}
                onFocus={() => searchUnidadesBase(buscaUnidadeBase)}
              />
              {unidadesBaseSugeridas.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border)] rounded-xl shadow-2xl z-[130] overflow-hidden">
                  {unidadesBaseSugeridas.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setFormAdmissao({ ...formAdmissao, unidade: u.nome });
                        setBuscaUnidadeBase(u.nome);
                        setUnidadesBaseSugeridas([]);
                      }}
                      className="w-full p-3 text-left hover:bg-indigo-50 border-b border-[var(--border)] last:border-none"
                    >
                      <p className="text-[10px] font-black uppercase text-indigo-900">{u.nome}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
            <button
              className="flex-1 btn-ghost h-12 text-[9px] font-black uppercase"
              onClick={() => {
                setModalAdmitir(false);
                setFormAdmissao({
                  nome: "",
                  telefone: "",
                  cpf: "",
                  cargo: "ASG VOLANTE",
                  unidade: "OPERAÇÃO",
                  data_admissao: format(new Date(), "yyyy-MM-dd"),
                  insalubridade: 20
                });
                setBuscaUnidadeBase("OPERAÇÃO");
              }}
            >
              Cancelar
            </button>
            <button
              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase shadow-md transition-all disabled:opacity-50"
              onClick={handleFinalizarAdmissao}
              disabled={loading || duplicateCheck.exists}
            >
              {loading ? "Processando..." : duplicateCheck.exists ? "Cadastro Duplicado" : "Confirmar Admissão"}
            </button>
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}
