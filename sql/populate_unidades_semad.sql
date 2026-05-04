-- Inserção de Unidades da SEMAD (Administração)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unidades_nome_key') THEN
        ALTER TABLE unidades ADD CONSTRAINT unidades_nome_key UNIQUE (nome);
    END IF;
END $$;

BEGIN;

INSERT INTO unidades (nome, endereco, bairro, secretaria) VALUES
('SEMOB - Superintendência Executiva de Mobilidade Urbana', 'Av. Eng. Agrônomo Álvaro Ferreira', 'Cristo Redentor', 'SEMAD'),
('AEROPORTO', 'Av. Padre José de Anchieta, 3006', 'Aeroporto', 'SEMAD'),
('PREFEITURA DE GUARAPARI', 'R. Alencar Moraes de Resende, 100', 'Jardim Boa Vista', 'SEMAD'),
('SEMIC - Secretaria Municipal de Integração da Cidade', 'R. Josias Cerutti, 717', 'Praia do Morro', 'SEMAD'),
('SEMSET - CENTRO ADMINISTRATIVO', 'Av. Paris, 686', 'Praia do Morro', 'SEMAD'),
('FEIRA LIVRE / MERCADO RURAL', 'R. José Barcelos de Matos, 281', 'Centro', 'SEMAD'),
('CENTRO ADMINISTRATIVO BENEDITO LYRA', 'Av. Paris, 686', 'Praia do Morro', 'SEMAD'),
('SEMFA - PREFEITURA DE GUARAPARI', 'Rua Alencar Moraes de Rezende, 100', 'Jardim Boa Vista', 'SEMAD')
ON CONFLICT (nome) DO UPDATE SET 
    endereco = EXCLUDED.endereco, 
    bairro = EXCLUDED.bairro, 
    secretaria = EXCLUDED.secretaria;

COMMIT;
