-- ======================================================
-- RPC PARA ESTORNAR ENTREGA DE REQUISIÇÃO (ALMOXARIFADO)
-- Esta função devolve a quantidade para o estoque e zera a entrega na requisição
-- ======================================================

CREATE OR REPLACE FUNCTION public.estornar_entrega_requisicao(
    p_req_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_item_id UUID;
    v_quantidade_entregue INTEGER;
    v_categoria TEXT;
    v_unidade_destino TEXT;
    v_multiplicador INTEGER := 1; -- Default é entrada (somar de volta ao estoque)
    v_cat_clean TEXT;
BEGIN
    -- 1. Busca os dados da requisição
    SELECT item_id, quantidade_entregue, tipo_item, unidade_destino 
    INTO v_item_id, v_quantidade_entregue, v_categoria, v_unidade_destino
    FROM public.requisicoes 
    WHERE id = p_req_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Requisição não encontrada.';
    END IF;

    IF v_quantidade_entregue IS NULL OR v_quantidade_entregue <= 0 THEN
        RAISE EXCEPTION 'A requisição não possui quantidade entregue para estornar.';
    END IF;

    -- 2. Normaliza a categoria
    v_cat_clean := TRIM(UPPER(v_categoria));

    -- Se for Almoxarifado Central devolvendo para Almoxarifado Central (não deveria acontecer), a lógica original de processar entrada/saída inverte.
    -- Originalmente, enviar para Almox Central somava, enviar pra outros subtraía.
    -- Então, o estorno inverte: estornar de Almox Central subtrai. Estornar de outros soma.
    IF v_unidade_destino = 'Almoxarifado Central' THEN
        v_multiplicador := -1;
    END IF;

    -- 3. Devolve a quantidade para o estoque correspondente
    IF v_cat_clean = 'EPI' THEN
        UPDATE public.almox_epi SET "quantidade" = "quantidade" + (v_quantidade_entregue * v_multiplicador) WHERE id = v_item_id;
    ELSIF v_cat_clean = 'SUPRIMENTO' OR v_cat_clean = 'SUPRIMENTOS' THEN
        UPDATE public.almox_suprimentos SET "quantidade" = "quantidade" + (v_quantidade_entregue * v_multiplicador) WHERE id = v_item_id;
    ELSIF v_cat_clean = 'ESCRITORIO' THEN
        UPDATE public.almox_escritorio SET "quantidade" = "quantidade" + (v_quantidade_entregue * v_multiplicador) WHERE id = v_item_id;
    ELSE
        RAISE EXCEPTION 'Categoria de estoque inválida na requisição: %.', v_categoria;
    END IF;

    -- 4. Zera a entrega e volta o status para APROVADO
    UPDATE public.requisicoes 
    SET 
        status = 'APROVADO',
        quantidade_entregue = 0,
        recebedor_nome = NULL,
        data_entrega = NULL
    WHERE id = p_req_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
