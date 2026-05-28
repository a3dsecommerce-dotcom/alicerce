ALTER TABLE public.investigacao_cat ADD COLUMN IF NOT EXISTS dados_especificos JSONB DEFAULT '{}'::jsonb;
