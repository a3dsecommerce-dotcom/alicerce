-- ======================================================
-- FIX: VERSÃO 3 - BLINDADA CONTRA ERROS DE COLUNA
-- Remove qualquer ambiguidade e adiciona suporte a variações
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
    v_cat_clean TEXT;
BEGIN
    -- 1. Normaliza a categoria
    v_cat_clean := TRIM(UPPER(p_categoria));

    -- 2. Busca a unidade de destino
    SELECT unidade_destino INTO v_unidade_destino FROM public.requisicoes WHERE id = p_req_id;

    -- Se for Almoxarifado Central, é Entrada (Soma)
    IF v_unidade_destino = 'Almoxarifado Central' THEN
        v_multiplicador := 1;
    END IF;

    -- 3. Atualiza a Requisição
    -- Usamos apenas colunas que temos certeza que existem
    UPDATE public.requisicoes 
    SET 
        status = p_status_final,
        quantidade_entregue = COALESCE(quantidade_entregue, 0) + p_quantidade_entregue,
        recebedor_nome = p_recebedor,
        data_entrega = NOW()
    WHERE id = p_req_id;

    -- 4. Atualiza o Estoque (Uso de aspas duplas para garantir precisão)
    IF v_cat_clean = 'EPI' THEN
        UPDATE public.almox_epi SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSIF v_cat_clean = 'SUPRIMENTO' OR v_cat_clean = 'SUPRIMENTOS' THEN
        UPDATE public.almox_suprimentos SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSIF v_cat_clean = 'ESCRITORIO' THEN
        UPDATE public.almox_escritorio SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSE
        RAISE EXCEPTION 'Categoria de estoque inválida: %. Verifique se é EPI, SUPRIMENTO ou ESCRITORIO.', p_categoria;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
