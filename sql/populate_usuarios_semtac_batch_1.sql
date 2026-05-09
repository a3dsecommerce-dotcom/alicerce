-- SEMTAC Batch 1 — 30 colaboradores
-- Usa WHERE NOT EXISTS para ignorar registros já cadastrados (por nome)

DO $$
BEGIN

INSERT INTO usuarios (nome, unidade_alocacao, secretaria, carga_horaria, periodo, cargo, nivel_acesso, status, telefone)
SELECT nome, unidade_alocacao, secretaria, carga_horaria, periodo, cargo, 1, 'ATIVO', telefone
FROM (VALUES
  ('SIMONE SANTOS SOUZA',                     'CASA 1',               'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5001'),
  ('JOCILENE RODRIGUES',                      'CASA 1',               'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5002'),
  ('NUBIA SILVA DA COSTA',                    'CASA 1',               'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5003'),
  ('VIVIANI DUTRA FRANCA CORREA',             'CASA 1',               'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5004'),
  ('ROSANGELA MOREIRA DA SILVA',              'CASA 1',               'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5005'),
  ('NAIANE DOS SANTOS SALES',                 'CASA 1',               'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5006'),
  ('RAIMUNDA IVANEIDE DA SILVA QUEIROZ',      'CASA 1',               'SEMTAC', '12X36', 'NOTURNO', 'CUIDADOR SOCIAL',         'NÃO INFORMADO 5007'),
  ('ANDREA DUTRA MIRANDA',                    'CASA 1',               'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5008'),
  ('JOCIELE RIBEIRO DA SILVA',                'CASA 1',               'SEMTAC', '12X36', 'NOTURNO', 'CUIDADOR SOCIAL',         'NÃO INFORMADO 5009'),
  ('QUEILIANE DOS SANTOS REIS',               'CASA 1',               'SEMTAC', NULL,    'DIURNO',  'COZINHEIRO',              'NÃO INFORMADO 5010'),
  ('LUCINEIA MARIA DA SILVA',                 'CASA 2',               'SEMTAC', '12X36', 'NOTURNO', 'CUIDADOR SOCIAL',         'NÃO INFORMADO 5011'),
  ('MARILZA HONORIO VIEIRA',                  'CASA 2',               'SEMTAC', '12X36', 'NOTURNO', 'CUIDADOR SOCIAL',         'NÃO INFORMADO 5012'),
  ('ESTHEFANY FERNANDA R. NASCIMENTO',        'CASA 2',               'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5013'),
  ('LANA VENTURIN SEVERO',                    'RESIDENCIA INCLUSIVA',  'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5014'),
  ('LAZIMARA APARECIDA BRAMBATI MORAES',      'RESIDENCIA INCLUSIVA',  'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5015'),
  ('SANDRA LOPES RODRIGUES DE OLIVEIRA',      'RESIDENCIA INCLUSIVA',  'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5016'),
  ('MARIA DAS GRAÇAS OZORIO BEZERRA',         'RESIDENCIA INCLUSIVA',  'SEMTAC', '12X36', 'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5017'),
  ('ISRAEL MOREIRA DE ASSIS ALENCAR',         'RESIDENCIA INCLUSIVA',  'SEMTAC', '12X36', 'NOTURNO', 'CUIDADOR SOCIAL',         'NÃO INFORMADO 5018'),
  ('LUCIANA DUTRA DE OLIVEIRA',               'RESIDENCIA INCLUSIVA',  'SEMTAC', NULL,    'DIURNO',  'ENCARREGADO',             'NÃO INFORMADO 5019'),
  ('MARIA RAIMUNDA SOARES SANTOS',            'RESIDENCIA INCLUSIVA',  'SEMTAC', NULL,    'DIURNO',  'COZINHEIRO',              'NÃO INFORMADO 5020'),
  ('MARIA CLAUDIA CORREA BARBOSA',            'FAMILIA ACOLHEDORA',    'SEMTAC', NULL,    'DIURNO',  'ENCARREGADO',             'NÃO INFORMADO 5021'),
  ('HAIARA ALVES MIRANDA',                    'CENTRO DIA PCD',        'SEMTAC', '44H',   'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5022'),
  ('ANA LUIZA LIMA PINHEIRO',                 'CENTRO DIA PCD',        'SEMTAC', '44H',   'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5023'),
  ('JOCILENE PASSOS',                         'CENTRO DIA PCD',        'SEMTAC', '44H',   'DIURNO',  'CUIDADOR SOCIAL',         'NÃO INFORMADO 5024'),
  ('WELINTON PEREIRA DAMASCENO',              'CENTRO DIA PCD',        'SEMTAC', NULL,    'DIURNO',  'ENCARREGADO',             'NÃO INFORMADO 5025'),
  ('CONCEIÇÃO APARECIDA DUARTE SILVA',        'CADUNICO',              'SEMTAC', NULL,    'DIURNO',  'ASSISTENTE ADMINISTRATIVO I','NÃO INFORMADO 5026'),
  ('MARIANGEL COROMOTO BASTARDO HERNANDEZ',   'CRAS OLARIA',           'SEMTAC', NULL,    'DIURNO',  'ASSISTENTE ADMINISTRATIVO I','NÃO INFORMADO 5027'),
  ('ISABELLA DE FREITAS KUSTER SANTIN',       'CRAS SANTA MONICA',     'SEMTAC', NULL,    'DIURNO',  'ASSISTENTE ADMINISTRATIVO I','NÃO INFORMADO 5028'),
  ('RENATA AIME',                             'SEDE SEMTAC',           'SEMTAC', NULL,    'DIURNO',  'ASSISTENTE ADMINISTRATIVO I','NÃO INFORMADO 5029'),
  ('JEFERSON BARCELOS GOMES',                 'FROTA DE VEICULO',      'SEMTAC', NULL,    'DIURNO',  'ASSISTENTE ADMINISTRATIVO I','NÃO INFORMADO 5030')
) AS t(nome, unidade_alocacao, secretaria, carga_horaria, periodo, cargo, telefone)
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios u WHERE UPPER(u.nome) = UPPER(t.nome)
);

END $$;
