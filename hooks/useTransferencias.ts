"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useTransferencias(user: any) {
  const [loading, setLoading] = useState(true);
  const [transferencias, setTransferencias] = useState<any[]>([]);

  const fetchTransferencias = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('transferencias').select('*').order('created_at', { ascending: false });
      
      // Filtros por nível se necessário, mas RLS já cuida disso. 
      // No entanto, para a UI, podemos querer filtrar por status dependendo de onde estamos.
      
      const { data, error } = await query;
      if (data) setTransferencias(data);
    } catch (err) {
      console.error("Erro ao buscar transferências:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransferencias();
  }, [fetchTransferencias]);

  const criarSolicitacao = async (dados: any) => {
    const { error } = await supabase.from('transferencias').insert({
      colaborador_id: dados.colaborador_id,
      colaborador_nome: dados.colaborador_nome,
      unidade_origem: dados.unidade_origem,
      unidade_destino_pretendida: dados.unidade_destino,
      motivo_solicitacao: dados.motivo,
      status: 'SOLICITADO',
      encarregado_id: user.id,
      encarregado_nome: user.nome || user.name
    });
    if (error) throw error;
    await fetchTransferencias();
  };

  const analisarEncarregado = async (id: string, decisao: 'ACEITO' | 'RECUSADO' | 'ARQUIVADO', justificativa: string) => {
    const status = decisao === 'ACEITO' ? 'ACEITO_ENCARREGADO' : 
                   decisao === 'RECUSADO' ? 'RECUSADO_ENCARREGADO' : 'ARQUIVADO';
    
    const { error } = await supabase.from('transferencias').update({
      status,
      justificativa_encarregado: justificativa,
      encarregado_id: user.id,
      encarregado_nome: user.nome,
      data_analise_encarregado: new Date().toISOString()
    }).eq('id', id);

    if (error) throw error;
    await fetchTransferencias();
  };

  const analisarGerencia = async (id: string, decisao: 'APROVADO' | 'RECUSADO' | 'ARQUIVADO', justificativa: string) => {
    const status = decisao === 'APROVADO' ? 'APROVADO_GERENCIA' : 
                   decisao === 'RECUSADO' ? 'RECUSADO_GERENCIA' : 'ARQUIVADO';
    
    const { error } = await supabase.from('transferencias').update({
      status,
      justificativa_gerente: justificativa,
      gerente_id: user.id,
      gerente_nome: user.nome,
      data_analise_gerente: new Date().toISOString()
    }).eq('id', id);

    if (error) throw error;
    await fetchTransferencias();
  };

  const finalizarRH = async (id: string, observacoes: string) => {
    const { error } = await supabase.from('transferencias').update({
      status: 'FINALIZADO_RH',
      rh_id: user.id,
      rh_nome: user.nome,
      data_finalizacao_rh: new Date().toISOString(),
      observacoes_rh: observacoes
    }).eq('id', id);

    if (error) throw error;
    await fetchTransferencias();
  };

  return {
    loading,
    transferencias,
    refresh: fetchTransferencias,
    criarSolicitacao,
    analisarEncarregado,
    analisarGerencia,
    finalizarRH
  };
}
