CREATE TABLE IF NOT EXISTS ferias_colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  colaborador_nome text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  created_at timestamp with zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE ferias_colaboradores ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso simplificadas
CREATE POLICY "Acesso total de leitura para usuarios autenticados_ferias" 
  ON ferias_colaboradores FOR SELECT USING (true);

CREATE POLICY "Acesso total de escrita para usuarios autenticados_ferias" 
  ON ferias_colaboradores FOR ALL USING (true);
