-- ======================================================
-- FIX: CORREÇÃO DA LÓGICA DE MOVIMENTAÇÃO DE ESTOQUE
-- Diferencia Entrada (Reposição) de Saída (Entrega)
-- ======================================================

CREATE OR REPLACE FUNCTION public.processar_entrega_requisicao(
    p_req_id UUID,
    p_item_id UUID,
    p_quantidade_entregue INTEGER,
    p_categoria TEXT,
    p_recebedor TEXT,
    p_status_final TEXT
)
RETURNS VOID AS $$
DECLARE
    v_unidade_destino TEXT;
    v_operacao TEXT := '-'; -- Default é saída (subtrair)
    v_tabela TEXT;
BEGIN
    -- 1. Busca a unidade de destino da requisição para decidir se é Entrada ou Saída
    SELECT unidade_destino INTO v_unidade_destino FROM public.requisicoes WHERE id = p_req_id;

    -- Se o destino for o próprio Almoxarifado Central, trata-se de REPOSIÇÃO (Soma no estoque)
    IF v_unidade_destino = 'Almoxarifado Central' THEN
        v_operacao := '+';
    END IF;

    -- 2. Determina a tabela alvo baseada na categoria
    IF p_categoria = 'EPI' THEN v_tabela := 'almox_epi';
    ELSIF p_categoria = 'SUPRIMENTO' THEN v_tabela := 'almox_suprimentos';
    ELSIF p_categoria = 'ESCRITORIO' THEN v_tabela := 'almox_escritorio';
    ELSE RAISE EXCEPTION 'Categoria de estoque inválida: %', p_categoria;
    END IF;

    -- 3. Atualiza a Requisição
    UPDATE public.requisicoes 
    SET 
        status = p_status_final,
        quantidade_entregue = COALESCE(quantidade_entregue, 0) + p_quantidade_entregue,
        recebedor_nome = p_recebedor,
        data_entrega = NOW()
    WHERE id = p_req_id;

    -- 4. Executa o update atômico no estoque (Soma ou Subtrai)
    EXECUTE format('UPDATE public.%I SET quantidade = quantidade %s %L WHERE id = %L', v_tabela, v_operacao, p_quantidade_entregue, p_item_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
