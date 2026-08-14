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
  // Novas tabelas
  const [notas, setNotas] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [secretarias, setSecretarias] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [epiRes, supRes, escRes] = await Promise.all([
        supabase.from('almox_epi').select('*, preco_unitario, coeficiente, secretarias_permitidas'),
        supabase.from('almox_suprimentos').select('*, preco_unitario, coeficiente, secretarias_permitidas'),
        supabase.from('almox_escritorio').select('*, preco_unitario, coeficiente, secretarias_permitidas')
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

      // Notas fiscais
      const { data: notasData } = await supabase
        .from('almox_notas_requisicao')
        .select('*')
        .order('created_at', { ascending: false });
      if (notasData) setNotas(notasData);

      // Metas de redução
      const { data: metasData } = await supabase
        .from('almox_metas_reducao')
        .select('*')
        .order('ano', { ascending: false });
      if (metasData) setMetas(metasData);

      // Secretarias cadastradas
      const { data: secsData } = await supabase
        .from('almox_secretarias')
        .select('*')
        .eq('ativa', true)
        .order('sigla');
      if (secsData) setSecretarias(secsData);

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

  const estornarEntregaRPC = async (req_id: string) => {
    const { error } = await supabase.rpc('estornar_entrega_requisicao', {
      p_req_id: req_id
    });
    if (error) throw error;
    await fetchAll();
  };

  // Insere nova secretaria no cadastro livre
  const insertSecretaria = async (nome: string, sigla: string) => {
    const { error } = await supabase
      .from('almox_secretarias')
      .insert([{ nome, sigla: sigla.toUpperCase() }]);
    if (error) throw error;
    await fetchAll();
  };

  // Atualiza o número do Strato de todas as requisições sob um mesmo protocolo
  const atualizarNumeroStrato = async (protocolo: string, numero_strato: string) => {
    const { error } = await supabase
      .from('requisicoes')
      .update({ numero_strato: numero_strato || null })
      .eq('protocolo', protocolo);
    if (error) throw error;
    await fetchAll();
  };

  // Cancela um item específico de uma requisição
  // Se o item já havia sido entregue, devolvemos a quantidade entregue de volta ao estoque
  const cancelarItemRequisicao = async (req: any) => {
    const { id, status, item_id, quantidade_entregue, tipo_item } = req;
    
    // Se o item já estava entregue ou parcial, precisamos estornar o estoque
    if ((status === 'ENTREGUE' || status === 'PARCIAL') && (quantidade_entregue || 0) > 0) {
      const targetTable = tipo_item === 'EPI' ? 'almox_epi' : tipo_item === 'SUPRIMENTO' ? 'almox_suprimentos' : 'almox_escritorio';
      
      // Incrementa a quantidade no inventário
      const { error: stockErr } = await supabase.rpc('baixar_estoque_item', {
        p_item_id: item_id,
        p_quantidade: -quantidade_entregue, // número negativo no decremento = incremento
        p_categoria: tipo_item
      });
      if (stockErr) throw stockErr;
    }

    // Atualiza o status do item para CANCELADO
    const { error: reqErr } = await supabase
      .from('requisicoes')
      .update({ 
        status: 'CANCELADO',
        quantidade_entregue: 0
      })
      .eq('id', id);
      
    if (reqErr) throw reqErr;
    await fetchAll();
  };

  return {
    loading,
    estoque,
    requisicoes,
    usuarios,
    ocorrencias,
    cotasMap,
    notas,
    metas,
    secretarias,
    refresh: fetchAll,
    updateItem,
    insertItem,
    deleteItem,
    processarRequisicao,
    processarEntregaRPC,
    estornarEntregaRPC,
    arquivarRequisicao,
    arquivarProtocolo,
    insertSecretaria,
    atualizarNumeroStrato,
    cancelarItemRequisicao
  };
}
