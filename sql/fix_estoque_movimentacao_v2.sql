-- ======================================================
-- FIX: CORREÇÃO DA LÓGICA DE MOVIMENTAÇÃO DE ESTOQUE (VERSÃO ROBUSTA)
-- Evita SQL Dinâmico para prevenir erros de nomes de colunas
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
    v_multiplicador INTEGER := -1; -- Default é saída (subtrair)
BEGIN
    -- 1. Busca a unidade de destino para decidir se é Entrada ou Saída
    SELECT unidade_destino INTO v_unidade_destino FROM public.requisicoes WHERE id = p_req_id;

    -- Se o destino for o Almoxarifado Central, é REPOSIÇÃO (Soma no estoque)
    IF v_unidade_destino = 'Almoxarifado Central' THEN
        v_multiplicador := 1;
    END IF;

    -- 2. Atualiza a Requisição
    UPDATE public.requisicoes 
    SET 
        status = p_status_final,
        quantidade_entregue = COALESCE(quantidade_entregue, 0) + p_quantidade_entregue,
        recebedor_nome = p_recebedor,
        data_entrega = NOW()
    WHERE id = p_req_id;

    -- 3. Atualiza o Estoque de forma estática (mais seguro)
    IF p_categoria = 'EPI' THEN
        UPDATE public.almox_epi SET quantidade = quantidade + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSIF p_categoria = 'SUPRIMENTO' THEN
        UPDATE public.almox_suprimentos SET quantidade = quantidade + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSIF p_categoria = 'ESCRITORIO' THEN
        UPDATE public.almox_escritorio SET quantidade = quantidade + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSE
        RAISE EXCEPTION 'Categoria de estoque inválida para movimentação: %', p_categoria;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
