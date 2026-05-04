"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useRHData(user: any) {
  const [loading, setLoading] = useState(true);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [vagas, setVagas] = useState<any[]>([]);

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
    refresh: fetchData,
    updateStatus,
    finalizarAdmissao
  };
}
