"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useRHData(user: any) {
  const [loading, setLoading] = useState(true);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [vagas, setVagas] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [volantes, setVolantes] = useState<any[]>([]);
  const [requisicoesVolantes, setRequisicoesVolantes] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Usuarios (Colaboradores)
      const { data: users } = await supabase.from('usuarios').select('*').order('nome');
      if (users) {
        setColaboradores(users.map(u => ({
          ...u,
          id: u.id,
          nome: u.nome || "Sem Nome",
          cargo: u.cargo || "Não definido",
          unidade: u.unidade_alocacao || "Não alocado",
          status: u.status || "INATIVO",
          avatar: (u.nome || "??").substring(0, 2).toUpperCase(),
          cpf: u.cpf || "---",
          telefone: u.telefone || "---",
          admissao: u.data_admissao || "---"
        })));
      }

      // 2. Fetch Candidatos (Talentos)
      const { data: talentos } = await supabase.from('candidatos').select('*').order('created_at', { ascending: false });
      if (talentos) setCandidatos(talentos);

      // 3. Fetch Vagas
      const { data: vagasDb } = await supabase.from('vagas').select('*').order('created_at', { ascending: false });
      if (vagasDb) setVagas(vagasDb);

      // 4. Fetch CATs
      const { data: catsDb } = await supabase.from('investigacao_cat').select('*').order('created_at', { ascending: false });
      if (catsDb) setCats(catsDb);

      // 5. Fetch Extras
      const { data: extrasDb } = await supabase.from('informativos_operacionais').select('*').eq('tipo', 'EXTRA').order('data', { ascending: false });
      if (extrasDb) setExtras(extrasDb);

      // 6. Fetch Volantes
      const { data: volantesDb } = await supabase.from('escala_volantes').select('*').order('data', { ascending: false });
      if (volantesDb) setVolantes(volantesDb);

      // 7. Fetch Requisições de Volantes
      const { data: reqVolantesDb } = await supabase.from('requisicoes_volantes').select('*').order('created_at', { ascending: false });
      if (reqVolantesDb) setRequisicoesVolantes(reqVolantesDb);
    } catch (err) {
      console.error("Erro no carregamento do RH:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'DESLIGADO' && user.nivel < 3) {
      throw new Error("Demissões devem ser autorizadas pela Gerência Operacional.");
    }

    const { error } = await supabase.from('usuarios').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
    
    await fetchData();
  };

  const finalizarAdmissao = async (candidato: any, form: any) => {
    // 1. Criar Usuário
    const { error: userError } = await supabase.from('usuarios').insert({
      nome: candidato.nome,
      email: candidato.email || `${candidato.nome.toLowerCase().replace(/\s+/g, '.')}@alicerce.com`,
      status: 'ATIVO',
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
    
    await fetchData();
  };

  return {
    loading,
    colaboradores,
    candidatos,
    vagas,
    cats,
    extras,
    volantes,
    requisicoesVolantes,
    refresh: fetchData,
    updateStatus,
    finalizarAdmissao,
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
