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
      }

      const { data: reqData } = await query;
      if (reqData) setRequisicoesRaw(reqData);

      // 3. Detectar ASGs (Cota)
      if (user?.unidade_alocacao) {
         const { count } = await supabase
           .from('usuarios')
           .select('*', { count: 'exact', head: true })
           .eq('unidade_alocacao', user.unidade_alocacao)
           .eq('cargo', 'ASG')
           .eq('status', 'ATIVO');
         
         if (count !== null) setQtdAsg(count > 0 ? count : 1);
      }
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
