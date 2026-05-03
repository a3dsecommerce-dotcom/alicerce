-- ======================================================
-- FIX: GARANTE COLUNAS DE ESTOQUE EM TODAS AS TABELAS
-- ======================================================

-- 1. Garante que almox_suprimentos tenha colunas de quantidade (estava faltando no catálogo)
ALTER TABLE public.almox_suprimentos ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 0;
ALTER TABLE public.almox_suprimentos ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER DEFAULT 5;

-- 2. Garante que almox_escritorio tenha colunas corretas
ALTER TABLE public.almox_escritorio ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 0;
ALTER TABLE public.almox_escritorio ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER DEFAULT 5;

-- 3. Garante que almox_epi tenha colunas corretas
ALTER TABLE public.almox_epi ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 0;
ALTER TABLE public.almox_epi ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER DEFAULT 5;

-- 4. RPC VERSÃO FINAL (ROBUSTA E COM LOGS DE CATEGORIA)
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
    v_multiplicador INTEGER := -1; -- Saída
    v_cat_clean TEXT;
BEGIN
    -- 1. Normalização da Categoria
    v_cat_clean := TRIM(UPPER(p_categoria));

    -- 2. Busca unidade de destino para lógica de reposição vs entrega
    SELECT unidade_destino INTO v_unidade_destino FROM public.requisicoes WHERE id = p_req_id;

    IF v_unidade_destino = 'Almoxarifado Central' THEN
        v_multiplicador := 1; -- Entrada (Reposição)
    END IF;

    -- 3. Atualiza Requisição
    UPDATE public.requisicoes 
    SET 
        status = p_status_final,
        quantidade_entregue = COALESCE(quantidade_entregue, 0) + p_quantidade_entregue,
        recebedor_nome = p_recebedor,
        data_entrega = NOW()
    WHERE id = p_req_id;

    -- 4. Atualiza Estoque na tabela correspondente
    -- Usamos aspas duplas para evitar conflitos de nomes reservados
    IF v_cat_clean = 'EPI' THEN
        UPDATE public.almox_epi SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSIF v_cat_clean = 'SUPRIMENTO' OR v_cat_clean = 'SUPRIMENTOS' THEN
        UPDATE public.almox_suprimentos SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSIF v_cat_clean = 'ESCRITORIO' THEN
        UPDATE public.almox_escritorio SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
    ELSE
        -- Fallback: Se a categoria for desconhecida, tenta procurar pelo ID em todas as tabelas
        -- Isso resolve casos onde a categoria na requisição está errada
        UPDATE public.almox_epi SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
        IF NOT FOUND THEN
            UPDATE public.almox_suprimentos SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
        END IF;
        IF NOT FOUND THEN
            UPDATE public.almox_escritorio SET "quantidade" = "quantidade" + (p_quantidade_entregue * v_multiplicador) WHERE id = p_item_id;
        END IF;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
