"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useComprasData(user: any) {
  const [loading, setLoading] = useState(true);
  const [requisicoesRaw, setRequisicoesRaw] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [qtdAsg, setQtdAsg] = useState<number>(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Catálogo (Suprimentos)
      const { data: catData } = await supabase.from('almox_suprimentos').select('*').order('item');
      if (catData) setCatalogo(catData);

      // 2. Fetch Requisições (Respeitando a hierarquia definida na Fase A)
      let query = supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false });
      
      if (user?.role === 'COMPRADOR' && user?.secretaria) {
        query = query.eq('secretaria_destino', user.secretaria);
      } else if (user?.unidade_alocacao) {
        query = query.eq('unidade_destino', user.unidade_alocacao);
      } else {
        // Se for um Comprador mas sem secretaria definida, por segurança, não filtramos por local
        // Isso evita que o painel fique em branco caso o cadastro esteja incompleto
        if (user?.role === 'COMPRADOR') {
           console.log("Comprador sem secretaria/unidade definida. Carregando dados globais.");
        }
      }

      const { data: reqData } = await query;
      if (reqData) setRequisicoesRaw(reqData);

      // 3. Detectar ASGs (Cota) via Novo Sistema Híbrido (Manual vs Automático)
      let cotaDefinida = 1;
      
      if (user?.secretaria) {
        try {
          const { data: configCota } = await supabase
            .from('config_cotas_secretaria')
            .select('*')
            .eq('secretaria', user.secretaria)
            .single();

          if (configCota && configCota.modo_calculo === 'MANUAL') {
            cotaDefinida = configCota.qtd_asg_manual;
          } else {
            // AUTOMÁTICO: Conta no banco de dados real
            const { count } = await supabase
              .from('usuarios')
              .select('*', { count: 'exact', head: true })
              .eq('secretaria', user.secretaria)
              .ilike('cargo', '%ASG%')
              .eq('status', 'ATIVO');
            
            if (count !== null && count > 0) cotaDefinida = count;
          }
        } catch (e) {
          console.error("Erro ao ler tabela de cotas, usando fallback", e);
        }
      } else if (user?.unidade_alocacao) {
        const { count } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('unidade_alocacao', user.unidade_alocacao)
          .ilike('cargo', '%ASG%')
          .eq('status', 'ATIVO');
         
        if (count !== null && count > 0) cotaDefinida = count;
      }
      
      setQtdAsg(cotaDefinida);
    } catch (err) {
      console.error("Erro no carregamento de Compras:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id, fetchData]);

  const enviarRequisicao = async (itens: any[]) => {
    const { error } = await supabase.from('requisicoes').insert(itens);
    if (error) throw error;
    await fetchData();
  };

  return {
    loading,
    catalogo,
    requisicoesRaw,
    qtdAsg,
    refresh: fetchData,
    enviarRequisicao
  };
}
