-- Inserção de Unidades da SEMTAC (Assistência Social) - CORRIGIDO
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unidades_nome_key') THEN
        ALTER TABLE unidades ADD CONSTRAINT unidades_nome_key UNIQUE (nome);
    END IF;
END $$;

BEGIN;

INSERT INTO unidades (nome, endereco, bairro, secretaria) VALUES
('CASA 1', NULL, 'Centro', 'SEMTAC'),
('CASA 2', NULL, 'Centro', 'SEMTAC'),
('RESIDENCIA INCLUSIVA', NULL, 'Ipiranga', 'SEMTAC'),
('FAMILIA ACOLHEDORA', NULL, 'Muquiçaba', 'SEMTAC'),
('CENTRO DIA PCD', NULL, 'Muquiçaba', 'SEMTAC'),
('CADUNICO', NULL, 'Centro', 'SEMTAC'),
('CRAS OLARIA', NULL, 'Olaria', 'SEMTAC'),
('CRAS SANTA MONICA', NULL, 'Santa Mônica', 'SEMTAC'),
('SEDE SEMTAC', NULL, 'Muquiçaba', 'SEMTAC'),
('FROTA DE VEICULO', NULL, 'ALMOXARIFADO', 'SEMTAC')
ON CONFLICT (nome) DO UPDATE SET endereco = EXCLUDED.endereco, bairro = EXCLUDED.bairro, secretaria = EXCLUDED.secretaria;

COMMIT;
