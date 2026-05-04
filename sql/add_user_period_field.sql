-- Adiciona o campo de período (Diurno/Noturno)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS periodo TEXT DEFAULT 'DIURNO';

-- Comentário para suporte
COMMENT ON COLUMN usuarios.periodo IS 'Define se a jornada é DIURNO ou NOTURNO para fins de adicional e escala';

-- Sincroniza usuários existentes
UPDATE usuarios SET periodo = 'DIURNO' WHERE periodo IS NULL;
