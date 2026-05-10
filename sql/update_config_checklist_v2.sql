-- 1. Adicionar colunas de suporte se não existirem
ALTER TABLE config_checklist_rh ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE config_checklist_rh ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'transparent';

-- 2. Habilitar RLS e criar política de acesso total para usuários autenticados
-- Isso resolve bloqueios silenciosos de permissão no Supabase
ALTER TABLE config_checklist_rh ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON config_checklist_rh;
CREATE POLICY "Allow all for authenticated users" ON config_checklist_rh 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Inicializar ordem baseada no histórico de criação (apenas para quem está com ordem 0)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM config_checklist_rh
)
UPDATE config_checklist_rh
SET ordem = ordered.row_num
FROM ordered
WHERE config_checklist_rh.id = ordered.id AND (config_checklist_rh.ordem IS NULL OR config_checklist_rh.ordem = 0);
