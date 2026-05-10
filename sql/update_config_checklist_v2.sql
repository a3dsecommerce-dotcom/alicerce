-- Adicionar suporte a cores e ordenação no checklist dinâmico
ALTER TABLE config_checklist_rh ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE config_checklist_rh ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'transparent';

-- Inicializar ordem baseada no ID ou ordem de criação
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM config_checklist_rh
)
UPDATE config_checklist_rh
SET ordem = ordered.row_num
FROM ordered
WHERE config_checklist_rh.id = ordered.id;
