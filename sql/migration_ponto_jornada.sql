-- Adicionar colunas de controle para a automação de cobranças de ponto
ALTER TABLE ajustes_ponto 
ADD COLUMN IF NOT EXISTS autorizado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fase_cobranca INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_ultima_cobranca TIMESTAMPTZ;

-- Criar política de acesso universal para que o ERP possa ler e atualizar
DROP POLICY IF EXISTS "Enable all access" ON ajustes_ponto;
CREATE POLICY "Enable all access" ON ajustes_ponto FOR ALL USING (true) WITH CHECK (true);

-- Criar tabela de configurações gerais do sistema (ex: ID da Planilha, URL do Webhook)
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir chaves de configuração padrões
INSERT INTO configuracoes_sistema (chave, valor) VALUES 
('GOOGLE_SHEETS_SPREADSHEET_ID', ''),
('N8N_PONTO_WEBHOOK_URL', 'https://n8n.alicerce.cloud/webhook/cobranca-ponto')
ON CONFLICT (chave) DO NOTHING;

-- Habilitar RLS e políticas para as configurações
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access" ON configuracoes_sistema;
CREATE POLICY "Enable all access" ON configuracoes_sistema FOR ALL USING (true) WITH CHECK (true);
