"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useRHData(user: any) {
  const [loading, setLoading] = useState(true);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [gestaoPropria, setGestaoPropria] = useState<any[]>([]);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [vagas, setVagas] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [faltas, setFaltas] = useState<any[]>([]);
  const [volantes, setVolantes] = useState<any[]>([]);
  const [requisicoesVolantes, setRequisicoesVolantes] = useState<any[]>([]);
  const [configChecklist, setConfigChecklist] = useState<{id: string, label: string, color?: string, ordem?: number}[]>([]);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // 1. Fetch Usuarios (Colaboradores)
      const { data: users } = await supabase.from('usuarios').select('*').order('nome');
      if (users) {
        const mapped = users.map(u => ({
          ...u,
          id: u.id,
          nome: u.nome || "Sem Nome",
          cargo: u.cargo || "Não definido",
          unidade: u.unidade_alocacao || "Não alocado",
          status: u.status || "INATIVO",
          status_ciclo: u.status_ciclo || "ATIVO",
          avatar: (u.nome || "??").substring(0, 2).toUpperCase(),
          cpf: u.cpf || "---",
          telefone: u.telefone || "---",
          admissao: u.data_admissao || null,
          data_admissao: u.data_admissao || null,
          exp1_decisao: u.exp1_decisao || 'PENDENTE',
          exp2_decisao: u.exp2_decisao || 'PENDENTE',
          docs: {
            asu: u.doc_asu,
            vt: u.doc_vt,
            ticket: u.doc_ticket,
            contrato: u.doc_contrato,
            fardamento: u.doc_fardamento,
            rg_cpf: u.doc_rg_cpf,
            residencia: u.doc_residencia,
            escolaridade: u.doc_escolaridade,
            titulo_reservista: u.doc_titulo_reservista,
            certidoes: u.doc_certidoes,
            antecedentes: u.doc_antecedentes,
            ctps_pis: u.doc_ctps_pis,
            foto: u.doc_foto
          },
          checklist_extra: u.checklist_extra || {}
        }));

        // Separação: ALICERCE ou PMG vai para Gestão Própria
        const oficiais = mapped.filter(u => 
          !u.unidade.toUpperCase().includes('ALICERCE') && 
          !u.unidade.toUpperCase().includes('PMG')
        );
        const interna = mapped.filter(u => 
          u.unidade.toUpperCase().includes('ALICERCE') || 
          u.unidade.toUpperCase().includes('PMG')
        );

        setColaboradores(oficiais);
        setGestaoPropria(interna);
      }
// ... (rest of fetch logic remains same)
      // 4. Fetch CATs
      const { data: catsDb } = await supabase.from('investigacao_cat').select('*').order('created_at', { ascending: false });
      if (catsDb) setCats(catsDb);

      // 5. Fetch Extras e Faltas
      const { data: informativos } = await supabase.from('informativos_operacionais').select('*').order('data', { ascending: false });
      
      // 6. Fetch Solicitações de Volante (Diretores) — faltas reportadas por diretores
      const { data: solicitacoesVolante } = await supabase
        .from('solicitacoes_volante')
        .select('*')
        .in('motivo', ['FALTA', 'ATESTADO'])
        .order('created_at', { ascending: false });

      if (informativos) {
        setExtras(informativos.filter(i => i.tipo === 'EXTRA'));
        
        // UNIFICAÇÃO DE FALTAS: 3 fontes convergem aqui
        const faltasDiretas = informativos
          .filter(i => i.tipo === 'FALTA')
          .map(f => ({ ...f, _origem: 'ENCARREGADO' as const }));
        
        const faltasDeExtras = informativos
          .filter(i => i.tipo === 'EXTRA' && i.colaborador_ausente_id)
          .map(e => ({
            id: e.id + '_ausente',
            _id_original: e.id,
            data: e.data,
            data_abertura: e.data_abertura || e.created_at,
            unidade: e.unidade,
            colaborador_ausente_id: e.colaborador_ausente_id,
            colaborador_ausente_nome: e.colaborador_ausente_nome,
            colaborador_substituto_nome: e.colaborador_substituto_nome,
            tem_atestado: false,
            justificada: false,
            sugestao_punicao: null,
            observacoes: `Substituído(a) por ${e.colaborador_substituto_nome || 'volante'}`,
            criado_por_nome: e.criado_por_nome,
            _origem: 'EXTRA' as const,
            _readonly: true,
          }));

        const faltasDeDiretores = (solicitacoesVolante || []).map(s => ({
          id: 'dir_' + s.id,
          _id_original: s.id,
          data: s.data_necessidade || s.created_at?.split('T')[0],
          data_abertura: s.created_at,
          unidade: s.unidade_nome,
          colaborador_ausente_id: null,
          colaborador_ausente_nome: s.colaborador_alvo || 'Não informado',
          tem_atestado: s.motivo === 'ATESTADO',
          dias_atestado: s.dias_afastamento,
          justificada: s.motivo === 'ATESTADO',
          sugestao_punicao: null,
          observacoes: `Volante solicitado pelo diretor — ${s.motivo}`,
          criado_por_nome: s.solicitante_nome,
          _origem: 'DIRETOR' as const,
          _readonly: true,
        }));

        setFaltas([...faltasDiretas, ...faltasDeExtras, ...faltasDeDiretores]
          .sort((a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime()));
      }

      // 7. Fetch Volantes
      const { data: volantesDb } = await supabase.from('escala_volantes').select('*').order('data', { ascending: false });
      if (volantesDb) setVolantes(volantesDb);

      // 8. Fetch Requisições de Volantes
      const { data: reqVolantesDb } = await supabase.from('requisicoes_volantes').select('*').order('created_at', { ascending: false });
      if (reqVolantesDb) setRequisicoesVolantes(reqVolantesDb);

      // 8. Fetch Config Checklist Dinâmico
      const { data: configDb } = await supabase.from('config_checklist_rh').select('*').order('ordem', { ascending: true });
      if (configDb) {
        setConfigChecklist(configDb);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'DESLIGADO' && user.nivel < 3) {
      throw new Error("Demissões devem ser autorizadas pela Gerência Operacional.");
    }

    const { data: colab } = await supabase.from('usuarios').select('nome').eq('id', id).single();
    const { error } = await supabase.from('usuarios').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
    
    // Log de Atividade
    await supabase.from('atividades').insert([{
      usuario_id: user.id,
      usuario_nome: user.nome || user.name,
      mensagem: `Alterou status de ${colab?.nome || 'Colaborador'} para ${newStatus}`,
      tipo: "RH",
      created_at: new Date().toISOString()
    }]);

    await fetchData();
  };

  const finalizarAdmissao = async (candidato: any, form: any) => {
    // 1. Criar Usuário
    const { error: userError } = await supabase.from('usuarios').insert({
      nome: candidato.nome,
      email: candidato.email || `${candidato.nome.toLowerCase().replace(/\s+/g, '.')}@alicerce.com`,
      status: 'EM_ADMISSAO',
      status_ciclo: 'ADMITIDO',
      nivel_acesso: 1,
      secretaria: form.secretaria,
      unidade_alocacao: form.unidade,
      cargo: form.cargo,
      data_admissao: form.data,
      cpf: candidato.cpf || "000.000.000-00",
      telefone: candidato.telefone || candidato.whatsapp || "---"
    });

    if (userError) throw userError;

    // 2. Atualizar Candidato
    await supabase.from('candidatos').update({ status_candidato: 'CONTRATADO' }).eq('id', candidato.id);
    
    // 3. Log de Atividade
    await supabase.from('atividades').insert([{
      usuario_id: user.id,
      usuario_nome: user.nome || user.name,
      mensagem: `Finalizou pré-admissão de ${candidato.nome} (${form.cargo})`,
      tipo: "RH",
      created_at: new Date().toISOString()
    }]);

    await fetchData();
  };

  const updateExpDecision = async (id: string, stage: 'exp1_decisao' | 'exp2_decisao', decision: string) => {
    const { data: colab } = await supabase.from('usuarios').select('nome').eq('id', id).single();
    const { error } = await supabase.from('usuarios').update({ [stage]: decision }).eq('id', id);
    if (error) throw error;

    // Log de Atividade
    await supabase.from('atividades').insert([{
      usuario_id: user.id,
      usuario_nome: user.nome || user.name,
      mensagem: `Decisão de Experiência (${stage === 'exp1_decisao' ? '30d' : '90d'}): ${decision} para ${colab?.nome}`,
      tipo: "RH",
      created_at: new Date().toISOString()
    }]);

    await fetchData();
  };

  const updateDocs = async (id: string, field: string, value: boolean) => {
    const { data: colab } = await supabase.from('usuarios').select('nome').eq('id', id).single();
    const { error } = await supabase.from('usuarios').update({ [field]: value }).eq('id', id);
    if (error) throw error;

    // Log de Atividade
    await supabase.from('atividades').insert([{
      usuario_id: user.id,
      usuario_nome: user.nome || user.name,
      mensagem: `Checklist de Documentos: ${field.replace('doc_', '').toUpperCase()} ${value ? 'OK' : 'PENDENTE'} para ${colab?.nome}`,
      tipo: "RH",
      created_at: new Date().toISOString()
    }]);

    await fetchData();
  };

  return {
    loading,
    colaboradores,
    gestaoPropria,
    candidatos,
    vagas,
    cats,
    extras,
    faltas,
    volantes,
    requisicoesVolantes,
    refresh: fetchData,
    counts: {
      totalOficiais: colaboradores.filter(c => c.status === 'ATIVO').length,
      totalAdmitidos: colaboradores.filter(c => c.status === 'EM_ADMISSAO').length + gestaoPropria.filter(c => c.status === 'EM_ADMISSAO').length,
      totalInterno: gestaoPropria.filter(c => c.status === 'ATIVO').length,
      catsPending: cats.filter(c => c.status === 'EM_ANALISE').length,
      extrasCycle: extras.length,
      faltasPending: faltas.length
    },
    updateStatus,
    finalizarAdmissao,
    updateExpDecision,
    updateDocs,
    updateOffboarding: async (id: string, field: string, value: any) => {
      const { data: colab } = await supabase.from('usuarios').select('nome').eq('id', id).single();
      const { error } = await supabase.from('usuarios').update({ [field]: value }).eq('id', id);
      if (error) throw error;

      // Log de Atividade
      await supabase.from('atividades').insert([{
        usuario_id: user.id,
        usuario_nome: user.nome || user.name,
        mensagem: `Atualizou campo ${field.replace('desligamento_', '').toUpperCase()} para ${value} de ${colab?.nome}`,
        tipo: "RH",
        created_at: new Date().toISOString()
      }]);

      await fetchData();
    },
    updateAdmission: async (id: string, field: string, value: any) => {
      const { data: colab } = await supabase.from('usuarios').select('nome').eq('id', id).single();
      const { error } = await supabase.from('usuarios').update({ [field]: value }).eq('id', id);
      if (error) throw error;

      // Log de Atividade
      await supabase.from('atividades').insert([{
        usuario_id: user.id,
        usuario_nome: user.nome || user.name,
        mensagem: `Pré-Admissão: Atualizou ${field.replace('adm_', '').toUpperCase()} de ${colab?.nome}`,
        tipo: "RH",
        created_at: new Date().toISOString()
      }]);

      await fetchData();
    },
    addChecklistColumn: async (label: string) => {
      const tempId = `temp-${Date.now()}`;
      // Optimistic add
      setConfigChecklist(prev => [...prev, { id: tempId, label, color: 'transparent', ordem: prev.length + 1 }]);

      const promise = supabase.from('config_checklist_rh').insert([{ label, ordem: configChecklist.length + 1 }]).select();
      
      toast.promise(promise, {
        loading: 'Criando coluna...',
        success: 'Coluna criada!',
        error: 'Erro ao criar'
      });

      const { error } = await promise;
      if (error) {
        await fetchData(); // Rollback
        throw error;
      }
      
      // Log de Atividade
      await supabase.from('atividades').insert([{
        usuario_id: user.id,
        usuario_nome: user.nome || user.name,
        mensagem: `Criou nova coluna de checklist: ${label}`,
        tipo: "RH",
        created_at: new Date().toISOString()
      }]);

      await fetchData(); // Get real ID
    },
    updateChecklistColumn: async (id: string, newLabel: string) => {
      // Optimistic update
      setConfigChecklist(prev => prev.map(c => c.id === id ? { ...c, label: newLabel } : c));

      const promise = supabase.from('config_checklist_rh').update({ label: newLabel }).eq('id', id).select();
      toast.promise(promise, {
        loading: 'Renomeando...',
        success: 'Renomeada!',
        error: 'Erro ao renomear'
      });
      const { error } = await promise;
      if (error) {
        await fetchData(); // Rollback
        throw error;
      }
    },
    deleteChecklistColumn: async (id: string) => {
      if (id.startsWith('temp-')) {
        toast.error("Aguarde a coluna terminar de ser criada...");
        return;
      }

      // Optimistic delete
      setConfigChecklist(prev => prev.filter(c => c.id !== id));

      const promise = supabase.from('config_checklist_rh').delete().eq('id', id);
      
      toast.promise(promise, {
        loading: 'Excluindo coluna...',
        success: 'Coluna removida!',
        error: 'Erro ao excluir'
      });

      const { error } = await promise;
      if (error) {
        await fetchData(); // Rollback
        throw error;
      }
    },
    updateExtraCheck: async (id: string, label: string, value: boolean) => {
      const { data: colab } = await supabase.from('usuarios').select('checklist_extra').eq('id', id).single();
      const currentExtra = colab?.checklist_extra || {};
      const newExtra = { ...currentExtra, [label]: value };
      
      const { error } = await supabase.from('usuarios').update({ checklist_extra: newExtra }).eq('id', id);
      if (error) throw error;
      await fetchData();
    },
    configChecklist,
    updateChecklistColor: async (id: string, color: string) => {
      // Optimistic update
      setConfigChecklist(prev => prev.map(c => c.id === id ? { ...c, color } : c));
      
      const promise = supabase.from('config_checklist_rh').update({ color }).eq('id', id).select();
      
      toast.promise(promise, {
        loading: 'Salvando cor...',
        success: 'Cor atualizada!',
        error: 'Erro ao salvar cor'
      });

      const { error } = await promise;
      if (error) {
        await fetchData(); // Rollback
        throw error;
      }
    },
    reorderChecklistColumn: async (id1: string, order1: number, id2: string, order2: number) => {
      // Optimistic update
      setConfigChecklist(prev => {
        const next = [...prev];
        const idx1 = next.findIndex(c => c.id === id1);
        const idx2 = next.findIndex(c => c.id === id2);
        if (idx1 !== -1 && idx2 !== -1) {
          const temp = { ...next[idx1], ordem: order2 };
          next[idx1] = { ...next[idx2], ordem: order1 };
          next[idx2] = temp;
        }
        return next.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      });

      const promise = Promise.all([
        supabase.from('config_checklist_rh').update({ ordem: order2 }).eq('id', id1),
        supabase.from('config_checklist_rh').update({ ordem: order1 }).eq('id', id2)
      ]);

      toast.promise(promise, {
        loading: 'Movendo coluna...',
        success: 'Posição atualizada!',
        error: 'Erro ao mover'
      });

      const results = await promise;
      if (results.some(r => r.error)) {
        await fetchData(); // Rollback
        throw new Error("Erro na reordenação");
      }
    },
    deleteExtra: async (id: string, justificativa: string) => {
      // 1. Buscar dados do item antes de excluir para o log
      const { data: item } = await supabase.from('informativos_operacionais').select('*').eq('id', id).single();
      
      // 2. Registrar no log de auditoria
      await supabase.from('logs_auditoria').insert({
        usuario_id: user.id,
        usuario_nome: user.nome,
        acao: 'EXCLUSAO',
        entidade: 'informativos_operacionais',
        entidade_id: id,
        justificativa: justificativa,
        detalhes: item
      });

      // 3. Excluir
      const { error } = await supabase.from('informativos_operacionais').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    }
  };
}
