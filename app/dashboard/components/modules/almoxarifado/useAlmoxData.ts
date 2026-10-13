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
  const [reducaoGlobal, setReducaoGlobal] = useState<number>(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [epiRes, supRes, escRes, configRes] = await Promise.all([
        supabase.from('almox_epi').select('*'),
        supabase.from('almox_suprimentos').select('*'),
        supabase.from('almox_escritorio').select('*'),
        supabase.from('almox_configuracao').select('percentual_reducao').eq('id', 'config_global').single()
      ]);

      if (epiRes.error) console.error("Erro ao carregar almox_epi:", epiRes.error.message);
      if (supRes.error) console.error("Erro ao carregar almox_suprimentos:", supRes.error.message);
      if (escRes.error) console.error("Erro ao carregar almox_escritorio:", escRes.error.message);

      const combined = [
        ...(epiRes.data || []).map((i: any) => ({ ...i, categoria: i.categoria || 'EPI' })),
        ...(supRes.data || []).map((i: any) => ({ ...i, categoria: i.categoria || 'SUPRIMENTO' })),
        ...(escRes.data || []).map((i: any) => ({ ...i, categoria: i.categoria || 'ESCRITORIO' }))
      ].sort((a, b) => (a.item || '').localeCompare(b.item || ''));

      setEstoque(combined);

      if (configRes.data) {
        setReducaoGlobal(Number(configRes.data.percentual_reducao) || 0);
      }

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

  function sanitizePayloadForTable(table: string, raw: any) {
    const base: any = {
      item: String(raw.item || '').trim(),
      categoria: raw.categoria || (table === 'almox_epi' ? 'EPI' : table === 'almox_suprimentos' ? 'SUPRIMENTO' : 'ESCRITORIO'),
      unidade_medida: raw.unidade_medida || 'UN',
      quantidade: Number(raw.quantidade) || 0,
      estoque_minimo: Number(raw.estoque_minimo) || 0,
    };

    if (raw.codigo_registro !== undefined) {
      base.codigo_registro = raw.codigo_registro ? String(raw.codigo_registro).trim() : null;
    }
    if (raw.tamanho !== undefined) {
      base.tamanho = raw.tamanho ? String(raw.tamanho).trim() : null;
    }
    if (raw.preco_unitario !== undefined) {
      base.preco_unitario = (raw.preco_unitario === '' || raw.preco_unitario === null) ? 0 : Number(raw.preco_unitario);
    }
    if (raw.secretarias_permitidas !== undefined) {
      base.secretarias_permitidas = Array.isArray(raw.secretarias_permitidas) ? raw.secretarias_permitidas : [];
    }

    if (table === 'almox_epi') {
      if (raw.ca !== undefined) {
        base.ca = raw.ca ? String(raw.ca).trim() : null;
      }
      return base;
    }

    if (table === 'almox_suprimentos') {
      if (raw.coeficiente !== undefined) {
        base.coeficiente = (raw.coeficiente === '' || raw.coeficiente === null) ? 1.00 : Number(raw.coeficiente);
      }
      return base;
    }

    return base;
  }

  const updateItem = async (targetTable: string, id: string, payload: any) => {
    const cleanPayload = sanitizePayloadForTable(targetTable, payload);
    const { error } = await supabase.from(targetTable).update(cleanPayload).eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const insertItem = async (targetTable: string, payload: any) => {
    const cleanPayload = sanitizePayloadForTable(targetTable, payload);
    const { error } = await supabase.from(targetTable).insert([cleanPayload]);
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

  // Salva o percentual de redução global ativa
  const salvarReducaoGlobal = async (percentual: number) => {
    const user = JSON.parse(localStorage.getItem("crm_user") || "{}");
    const { error } = await supabase
      .from('almox_configuracao')
      .upsert({
        id: 'config_global',
        percentual_reducao: percentual,
        atualizado_em: new Date().toISOString(),
        atualizado_por: user?.nome || "Almoxarifado"
      });
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
    notas,
    metas,
    secretarias,
    reducaoGlobal,
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
    cancelarItemRequisicao,
    salvarReducaoGlobal
  };
}
