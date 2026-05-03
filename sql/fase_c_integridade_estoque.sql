-- ==========================================
-- FASE C: INTEGRIDADE DE ESTOQUE (RPC)
-- ==========================================

-- 1. FUNÇÃO PARA BAIXA ATÔMICA DE ESTOQUE
-- Esta função garante que o estoque seja decrementado corretamente
-- sem risco de race conditions.

CREATE OR REPLACE FUNCTION public.baixar_estoque_item(
    p_item_id UUID,
    p_quantidade INTEGER,
    p_categoria TEXT
)
RETURNS VOID AS $$
DECLARE
    v_tabela TEXT;
BEGIN
    -- Determina a tabela alvo baseada na categoria
    IF p_categoria = 'EPI' THEN v_tabela := 'almox_epi';
    ELSIF p_categoria = 'SUPRIMENTO' THEN v_tabela := 'almox_suprimentos';
    ELSIF p_categoria = 'ESCRITORIO' THEN v_tabela := 'almox_escritorio';
    ELSE RAISE EXCEPTION 'Categoria de estoque inválida: %', p_categoria;
    END IF;

    -- Executa o update atômico
    EXECUTE format('UPDATE public.%I SET quantidade = quantidade - %L WHERE id = %L', v_tabela, p_quantidade, p_item_id);
    
    -- Log opcional de movimentação (se existir tabela de logs)
    -- INSERT INTO logs_movimentacao (item_id, quantidade, tipo) VALUES (p_item_id, p_quantidade, 'SAIDA');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PARA PROCESSAR ENTREGA DE REQUISIÇÃO
-- Atualiza a requisição e dá baixa no estoque em uma única transação.

CREATE OR REPLACE FUNCTION public.processar_entrega_requisicao(
    p_req_id UUID,
    p_item_id UUID,
    p_quantidade_entregue INTEGER,
    p_categoria TEXT,
    p_recebedor TEXT,
    p_status_final TEXT
)
RETURNS VOID AS $$
BEGIN
    -- 1. Atualiza a Requisição
    UPDATE public.requisicoes 
    SET 
        status = p_status_final,
        quantidade_entregue = COALESCE(quantidade_entregue, 0) + p_quantidade_entregue,
        recebedor_nome = p_recebedor,
        data_entrega = NOW()
    WHERE id = p_req_id;

    -- 2. Dá baixa no estoque usando a função anterior
    PERFORM public.baixar_estoque_item(p_item_id, p_quantidade_entregue, p_categoria);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
