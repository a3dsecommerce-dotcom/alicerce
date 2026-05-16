"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useAlmoxData() {
  const [loading, setLoading] = useState(true);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  // Map de secretaria → qtdAsg (mesma lógica do módulo Compras)
  const [cotasMap, setCotasMap] = useState<Record<string, number>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [epiRes, supRes, escRes] = await Promise.all([
        supabase.from('almox_epi').select('*'),
        supabase.from('almox_suprimentos').select('*'),
        supabase.from('almox_escritorio').select('*')
      ]);

      const combined = [
        ...(epiRes.data || []),
        ...(supRes.data || []),
        ...(escRes.data || [])
      ].sort((a, b) => a.item.localeCompare(b.item));

      setEstoque(combined);

      const { data: reqData } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false });
      if (reqData) setRequisicoes(reqData);

      const { data: usrData } = await supabase.from('usuarios').select('id, nome, cargo').order('nome');
      if (usrData) setUsuarios(usrData);

      const { data: ocData } = await supabase.from('tickets_sla').select('*').order('created_at', { ascending: false });
      if (ocData) setOcorrencias(ocData);

      // Calcula qtdAsg por secretaria (mesma lógica do módulo Compras)
      // 1. Lê configurações manuais
      const { data: configCotas } = await supabase
        .from('config_cotas_secretaria')
        .select('secretaria, modo_calculo, qtd_asg_manual');

      // 2. Conta ASGs reais por secretaria para as que são AUTOMÁTICO
      const { data: asgData } = await supabase
        .from('usuarios')
        .select('secretaria')
        .ilike('cargo', '%ASG%')
        .eq('status', 'ATIVO');

      const asgPorSecretaria: Record<string, number> = {};
      (asgData || []).forEach((u: any) => {
        if (u.secretaria) asgPorSecretaria[u.secretaria] = (asgPorSecretaria[u.secretaria] || 0) + 1;
      });

      const mapa: Record<string, number> = {};
      // Aplica configurações manuais primeiro
      (configCotas || []).forEach((c: any) => {
        if (c.modo_calculo === 'MANUAL') {
          mapa[c.secretaria] = c.qtd_asg_manual;
        } else {
          mapa[c.secretaria] = asgPorSecretaria[c.secretaria] || 1;
        }
      });
      // Preenche secretarias sem config manual com contagem real
      Object.entries(asgPorSecretaria).forEach(([sec, count]) => {
        if (!mapa[sec]) mapa[sec] = count;
      });
      setCotasMap(mapa);
    } catch (err) {
      console.error("Erro no carregamento do Almoxarifado:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateItem = async (targetTable: string, id: string, payload: any) => {
    const { error } = await supabase.from(targetTable).update(payload).eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const insertItem = async (targetTable: string, payload: any) => {
    const { error } = await supabase.from(targetTable).insert([payload]);
    if (error) throw error;
    await fetchAll();
  };

  const deleteItem = async (targetTable: string, id: string) => {
    const { error } = await supabase.from(targetTable).delete().eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const processarRequisicao = async (id: string, updates: any) => {
    const { error } = await supabase.from('requisicoes').update(updates).eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const processarEntregaRPC = async (params: {
    req_id: string,
    item_id: string,
    quantidade_entregue: number,
    categoria: string,
    recebedor: string,
    status_final: string
  }) => {
    const { error } = await supabase.rpc('processar_entrega_requisicao', {
      p_req_id: params.req_id,
      p_item_id: params.item_id,
      p_quantidade_entregue: params.quantidade_entregue,
      p_categoria: params.categoria,
      p_recebedor: params.recebedor,
      p_status_final: params.status_final
    });
    
    if (error) throw error;
    await fetchAll();
  };

  const arquivarRequisicao = async (id: string) => {
    const { error } = await supabase.from('requisicoes').update({ arquivado: true }).eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const arquivarProtocolo = async (protocolo: string) => {
    const { error } = await supabase.from('requisicoes').update({ arquivado: true }).eq('protocolo', protocolo);
    if (error) throw error;
    await fetchAll();
  };

  return {
    loading,
    estoque,
    requisicoes,
    usuarios,
    ocorrencias,
    cotasMap,
    refresh: fetchAll,
    updateItem,
    insertItem,
    deleteItem,
    processarRequisicao,
    processarEntregaRPC,
    arquivarRequisicao,
    arquivarProtocolo
  };
}
