CREATE TABLE IF NOT EXISTS config_cotas_secretaria (
    secretaria TEXT PRIMARY KEY,
    modo_calculo TEXT DEFAULT 'AUTOMATICO' CHECK (modo_calculo IN ('MANUAL', 'AUTOMATICO')),
    qtd_asg_manual INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir as secretarias padrao caso não existam
INSERT INTO config_cotas_secretaria (secretaria, modo_calculo, qtd_asg_manual) VALUES
('SEMED', 'MANUAL', 100),
('SEMSA', 'MANUAL', 50),
('SEMAD', 'MANUAL', 20),
('SEMOSP', 'MANUAL', 30),
('GABINETE', 'MANUAL', 10)
ON CONFLICT (secretaria) DO NOTHING;

-- Garantir acesso sem erro de RLS (já que o ERP usa anon key para operações de banco)
ALTER TABLE config_cotas_secretaria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON config_cotas_secretaria;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON config_cotas_secretaria;
DROP POLICY IF EXISTS "Enable all access" ON config_cotas_secretaria;

CREATE POLICY "Enable all access" ON config_cotas_secretaria FOR ALL USING (true) WITH CHECK (true);
