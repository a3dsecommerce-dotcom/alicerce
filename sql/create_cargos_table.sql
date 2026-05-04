-- Tabela de Cargos e Remunerações
CREATE TABLE IF NOT EXISTS cargos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    salario_base DECIMAL(10,2) DEFAULT 0,
    valor_alimentacao DECIMAL(10,2) DEFAULT 0,
    valor_vale_transporte DECIMAL(10,2) DEFAULT 0,
    insalubridade_padrao TEXT DEFAULT 'N/A',
    carga_horaria_padrao TEXT DEFAULT '44H',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserção de Cargos Iniciais (Exemplos)
INSERT INTO cargos (nome, salario_base, valor_alimentacao, valor_vale_transporte, insalubridade_padrao, carga_horaria_padrao)
VALUES 
('AUXILIAR DE SERVIÇOS GERAIS', 1412.00, 600.00, 200.00, '20%', '44H'),
('PORTEIRO', 1800.00, 650.00, 220.00, 'N/A', '12X36'),
('ZELADOR', 1600.00, 600.00, 200.00, '20%', '44H'),
('RECEPCIONISTA', 1500.00, 600.00, 200.00, 'N/A', '44H'),
('ENCARREGADO', 2500.00, 700.00, 250.00, 'N/A', '44H'),
('VIGILANTE', 2200.00, 700.00, 250.00, '40%', '12X36')
ON CONFLICT (nome) DO NOTHING;

-- Comentários para suporte
COMMENT ON TABLE cargos IS 'Tabela mestra de cargos e suas remunerações padrão para automação de cadastro';
