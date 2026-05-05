-- Tabela de Informativos Operacionais (Extras e Faltas)
CREATE TABLE IF NOT EXISTS informativos_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('EXTRA', 'FALTA')),
    unidade TEXT,
    data DATE DEFAULT CURRENT_DATE,
    periodo TEXT, -- DIURNO / NOTURNO
    horario TEXT,
    
    -- Se for EXTRA
    colaborador_substituto_id UUID REFERENCES usuarios(id),
    colaborador_substituto_nome TEXT,
    colaborador_ausente_id UUID REFERENCES usuarios(id),
    colaborador_ausente_nome TEXT,
    
    -- Se for FALTA
    tem_atestado BOOLEAN DEFAULT FALSE,
    dias_atestado INTEGER,
    justificada BOOLEAN DEFAULT FALSE,
    sugestao_punicao TEXT, -- VERBAL, ESCRITA, SUSPENSAO, JUSTA_CAUSA
    
    observacoes TEXT,
    criado_por_id UUID REFERENCES usuarios(id),
    criado_por_nome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_informativos_data ON informativos_operacionais(data);
CREATE INDEX IF NOT EXISTS idx_informativos_tipo ON informativos_operacionais(tipo);
