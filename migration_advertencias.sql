-- Criar a tabela padroes_advertencia
CREATE TABLE IF NOT EXISTS padroes_advertencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria VARCHAR NOT NULL,
    motivo_especifico VARCHAR NOT NULL,
    nivel_gravidade INT NOT NULL, -- 1=Advertência 1, 2=Advertência 2, 3=Suspensão
    embasamento_clt VARCHAR NOT NULL,
    texto_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar a tabela processos_disciplinares
ALTER TABLE processos_disciplinares 
ADD COLUMN IF NOT EXISTS padrao_advertencia_id UUID REFERENCES padroes_advertencia(id),
ADD COLUMN IF NOT EXISTS variaveis_adicionais JSONB DEFAULT '{}'::jsonb;

-- Inserir os templates fornecidos
INSERT INTO padroes_advertencia (categoria, motivo_especifico, nivel_gravidade, embasamento_clt, texto_template) VALUES 

-- FAMÍLIA 1: Falta Injustificada e Falta de Comunicação
(
  'Falta Injustificada',
  'Ausência injustificada',
  1,
  'Artigo 482, alínea "e", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR

Prezado(a) [NOME_COLABORADOR],

A presente tem por finalidade aplicar-lhe uma advertência disciplinar em virtude de sua ausência injustificada ao trabalho no dia [DATA_OCORRENCIA], no posto de serviço da unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

Ressaltamos que a falta de comunicação prévia e a ausência de justificativa legal (atestado médico válido) comprometem a escala de trabalho, sobrecarregam a equipe e prejudicam o atendimento na unidade alocada. Tal conduta configura ato de indisciplina e descumprimento das normas internas, passível de punição conforme o poder diretivo do empregador.

O que esperamos do seu comportamento:
Esperamos que o(a) senhor(a) retome o comprometimento com sua assiduidade e pontualidade. Em caso de imprevistos ou problemas de saúde, é obrigatório comunicar o encarregado de forma imediata ou prévia, apresentando a devida documentação comprobatória no prazo estabelecido pela empresa.

Solicitamos sua colaboração para que fatos como este não se repitam, alertando-o(a) de que a reincidência em faltas injustificadas poderá acarretar medidas disciplinares mais severas, como suspensão ou até mesmo rescisão do contrato de trabalho por justa causa (Desídia), nos termos do Artigo 482, alínea "e", da CLT.

Favor assinar a via deste documento confirmando a ciência.

Guarapari - ES, [DATA_ATUAL].'
),
(
  'Falta Injustificada',
  'Ausência injustificada',
  2,
  'Artigo 482, alínea "e", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR - REINCIDÊNCIA

Prezado(a) [NOME_COLABORADOR],

A presente tem por finalidade aplicar-lhe uma nova advertência disciplinar em virtude de mais uma ausência injustificada ao trabalho no dia [DATA_OCORRENCIA], no posto de serviço da unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

Constatamos em seu histórico que esta não é a primeira ocorrência desta natureza. O absenteísmo reiterado sem justificativa legal caracteriza negligência com suas obrigações contratuais, configurando ato de desídia, conforme previsto no Artigo 482, alínea "e", da Consolidação das Leis do Trabalho (CLT).

O que esperamos do seu comportamento:
Exigimos o cumprimento rigoroso da sua escala de trabalho. A comunicação de qualquer ausência deve ser feita estritamente de acordo com as normas da empresa. A sua falta recorrente desestrutura a operação perante o nosso cliente e não será mais tolerada.

Este é um alerta final em nível de advertência. Reiteramos que a persistência neste comportamento faltoso resultará na aplicação imediata de Suspensão Disciplinar, com desconto em folha, podendo evoluir para a rescisão contratual por justa causa.

Favor assinar a via deste documento confirmando a ciência.

Guarapari - ES, [DATA_ATUAL].'
),
(
  'Falta Injustificada',
  'Ausência injustificada',
  3,
  'Artigo 482, alínea "e", da CLT',
  'CARTA DE SUSPENSÃO DISCIPLINAR

Prezado(a) [NOME_COLABORADOR],

Pela presente, comunicamos a aplicação de SUSPENSÃO DISCIPLINAR de [QUANTIDADE_DIAS] dia(s), a ser cumprida no(s) dia(s) [DATAS_DA_SUSPENSAO], com o consequente desconto em sua remuneração e descanso semanal remunerado.

A referida medida está sendo aplicada em virtude de nova ausência injustificada ao trabalho no dia [DATA_OCORRENCIA], na unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

Tendo em vista que o(a) senhor(a) já foi advertido(a) anteriormente por condutas semelhantes e não demonstrou mudança de comportamento, a reiteração das faltas injustificadas agrava a situação de desídia, embasada no Artigo 482, alínea "e", da CLT.

O que esperamos após seu retorno:
Esperamos que este período de suspensão sirva para reflexão sobre a importância do seu comprometimento profissional. Ao retornar às suas atividades no dia [DATA_RETORNO], exigimos o cumprimento integral das suas obrigações e pontualidade.

Fica o(a) senhor(a) expressamente ciente de que novas infrações desta natureza esgotarão as medidas pedagógicas e disciplinares da empresa, resultando na rescisão do seu contrato de trabalho por JUSTA CAUSA.

Favor assinar a via deste documento confirmando a ciência.

Guarapari - ES, [DATA_ATUAL].'
),

-- FAMÍLIA 4: Mau Comportamento / Atrito
(
  'Mau Comportamento / Atrito', 
  'Atrito e falta de decoro no ambiente', 
  1, 
  'Artigo 482, alíneas "b" e "j", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR - CONDUTA INADEQUADA

Prezado(a) [NOME_COLABORADOR],

A presente tem por finalidade aplicar-lhe uma advertência disciplinar em virtude de conduta inadequada e falta de decoro no ambiente de trabalho, ocorrida no dia [DATA_OCORRENCIA], na unidade [UNIDADE_ALOCACAO], envolvendo [PESSOA_ENVOLVIDA].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

O ambiente de trabalho exige respeito mútuo, cordialidade e urbanidade, pilares essenciais para a boa prestação dos nossos serviços. Atitudes de desrespeito, agressividade verbal ou discussões configuram ato lesivo da honra e da boa fama, bem como mau procedimento, infrações previstas no Artigo 482, alíneas "b" e "j", da CLT.

O que esperamos do seu comportamento:
Esperamos que o(a) senhor(a) mantenha uma postura estritamente profissional e respeitosa com todos ao seu redor. Quaisquer divergências devem ser reportadas ao seu encarregado de forma pacífica, e nunca resolvidas por meio de atritos diretos no posto de serviço.

Fica advertido(a) de que a repetição de comportamentos inadequados resultará em medidas disciplinares mais rígidas.

Guarapari - ES, [DATA_ATUAL].'
),
(
  'Mau Comportamento / Atrito', 
  'Atrito e falta de decoro no ambiente', 
  3, 
  'Artigo 482, alíneas "b" e "j", da CLT',
  'CARTA DE SUSPENSÃO DISCIPLINAR

Prezado(a) [NOME_COLABORADOR],

Pela presente, comunicamos a aplicação de SUSPENSÃO DISCIPLINAR de [QUANTIDADE_DIAS] dia(s), a ser cumprida no(s) dia(s) [DATAS_DA_SUSPENSAO], com o consequente desconto em sua remuneração e descanso semanal remunerado.

A medida deve-se ao fato de o(a) senhor(a) reincidir em (ou cometer ato grave de) mau comportamento e falta de respeito no ambiente de trabalho no dia [DATA_OCORRENCIA], envolvendo [PESSOA_ENVOLVIDA] na unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

Atitudes desta natureza são incompatíveis com as diretrizes da empresa e quebram irreparavelmente a confiança necessária para a manutenção do vínculo empregatício, agravando o enquadramento no Artigo 482, alíneas "b" e "j", da CLT.

O que esperamos após seu retorno:
Exigimos que retorne às suas atividades no dia [DATA_RETORNO] com postura adequada e irrepreensível. Fica expressamente ciente de que nova infração desta natureza resultará na sua imediata dispensa por JUSTA CAUSA.

Guarapari - ES, [DATA_ATUAL].'
),

-- FAMÍLIA 5: Atrasos Recorrentes / Saídas Antecipadas
(
  'Atrasos Recorrentes / Saídas Antecipadas', 
  'Descumprimento da jornada / Pontualidade', 
  1, 
  'Artigo 482, alínea "e", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR - ASSIDUIDADE E PONTUALIDADE

Prezado(a) [NOME_COLABORADOR],

A presente tem por finalidade aplicar-lhe advertência disciplinar em virtude de constantes descumprimentos do seu horário de trabalho (atrasos ou saídas antecipadas não autorizadas), com destaque para o ocorrido no dia [DATA_OCORRENCIA], na unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

O cumprimento integral da sua jornada de trabalho é uma obrigação contratual primária. A falta de pontualidade prejudica a distribuição das tarefas, sobrecarrega os demais colegas e compromete a qualidade do serviço entregue. Tal prática repetitiva configura ato de desídia no desempenho das respectivas funções (Artigo 482, alínea "e", da CLT).

O que esperamos do seu comportamento:
Esperamos a normalização imediata dos seus horários de entrada, pausas e saída. Imprevistos excepcionais devem ser comunicados ao encarregado no momento do ocorrido, cabendo à empresa avaliar a justificativa.

Solicitamos sua colaboração, alertando-o(a) de que a reincidência acarretará em medidas disciplinares mais severas.

Guarapari - ES, [DATA_ATUAL].'
),

-- FAMÍLIA 2: Falta de Uso de EPI
(
  'Falta de Uso de EPI',
  'Não utilização de equipamento obrigatório',
  1,
  'Artigo 158, Parágrafo Único, alínea "b", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR - SEGURANÇA DO TRABALHO

Prezado(a) [NOME_COLABORADOR],

A presente tem por finalidade aplicar-lhe uma advertência disciplinar por ter sido flagrado(a) no dia [DATA_OCORRENCIA], no posto de serviço da unidade [UNIDADE_ALOCACAO], exercendo suas funções sem a utilização do(s) seguinte(s) Equipamento(s) de Proteção Individual (EPI): [EPI_NAO_UTILIZADO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

A recusa injustificada ou a negligência no uso dos EPIs fornecidos gratuitamente pela empresa coloca em risco a sua própria integridade física e a segurança do ambiente de trabalho. Tal atitude constitui falta grave, nos termos do Artigo 158, Parágrafo Único, alínea "b", da CLT.

O que esperamos do seu comportamento:
Esperamos que o(a) senhor(a) passe a utilizar todos os EPIs obrigatórios para a sua função durante todo o expediente. A segurança é inegociável. Caso o seu EPI apresente algum defeito ou desgaste, é sua obrigação solicitar a troca imediata ao seu encarregado.

Alertamos que a reincidência nesta infração acarretará medidas mais severas, incluindo suspensão e possível rescisão por justa causa (Ato de Indisciplina, Art. 482, "h", CLT).

Guarapari - ES, [DATA_ATUAL].'
),
(
  'Falta de Uso de EPI',
  'Não utilização de equipamento obrigatório',
  2,
  'Artigo 482, alínea "h", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR - REINCIDÊNCIA EPI

Prezado(a) [NOME_COLABORADOR],

Aplicamos a presente nova advertência disciplinar pois, mesmo após orientação e advertência anterior, o(a) senhor(a) foi novamente flagrado(a) no dia [DATA_OCORRENCIA] trabalhando na unidade [UNIDADE_ALOCACAO] sem o uso de [EPI_NAO_UTILIZADO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

A insistência em burlar as normas de Segurança do Trabalho e descumprir as ordens da empresa configura ato de indisciplina reiterado (Artigo 482, alínea "h", da CLT).

O que esperamos do seu comportamento:
Exigimos a adequação imediata e incondicional às normas de segurança da Alicerce. O uso do EPI não é opcional, é obrigatório por lei.

Este é o último aviso em nível de advertência. A próxima ocorrência gerará Suspensão Disciplinar com desconto em folha.

Guarapari - ES, [DATA_ATUAL].'
),
(
  'Falta de Uso de EPI',
  'Não utilização de equipamento obrigatório',
  3,
  'Artigo 482, alínea "h", da CLT',
  'CARTA DE SUSPENSÃO DISCIPLINAR

Prezado(a) [NOME_COLABORADOR],

Pela presente, comunicamos a aplicação de SUSPENSÃO DISCIPLINAR de [QUANTIDADE_DIAS] dia(s), a ser cumprida no(s) dia(s) [DATAS_DA_SUSPENSAO], com o consequente desconto em sua remuneração e descanso semanal remunerado.

A referida suspensão ocorre pela reincidência contínua na recusa do uso de EPIs [EPI_NAO_UTILIZADO], configurando ato de indisciplina gravíssimo e risco iminente de acidente de trabalho. A medida ocorre em virtude de fatos observados no dia [DATA_OCORRENCIA], na unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

Atitudes desta natureza são incompatíveis com as diretrizes da empresa e quebram irreparavelmente a confiança necessária para a manutenção do vínculo empregatício.

O que esperamos após seu retorno:
Exigimos que retorne às suas atividades no dia [DATA_RETORNO] com postura adequada e irrepreensível, utilizando todos os EPIs. Fica expressamente ciente de que nova infração desta natureza resultará na sua imediata dispensa por JUSTA CAUSA.

Guarapari - ES, [DATA_ATUAL].'
),

-- FAMÍLIA 3: Insubordinação ou Indisciplina
(
  'Insubordinação ou Indisciplina',
  'Descumprimento de ordens ou normas',
  1,
  'Artigo 482, alínea "h", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR

Prezado(a) [NOME_COLABORADOR],

A presente tem por finalidade aplicar-lhe uma advertência disciplinar devido à sua conduta inadequada no dia [DATA_OCORRENCIA], nas dependências da unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

O fato descrito acima caracteriza descumprimento de normas internas e recusa em seguir orientações diretas da sua liderança em relação a [ORDEM_DESCUMPRIDA]. Tal atitude quebra a relação de confiança necessária e configura ato de indisciplina/insubordinação, previsto no Artigo 482, alínea "h", da CLT.

O que esperamos do seu comportamento:
Esperamos que o(a) senhor(a) mantenha uma postura profissional, respeitando a hierarquia da empresa, as rotinas estabelecidas para o seu posto e as orientações do seu encarregado. O bom andamento do serviço depende da colaboração de todos.

Reiteramos que novas ocorrências desta natureza não serão toleradas e resultarão em medidas disciplinares mais rígidas.

Guarapari - ES, [DATA_ATUAL].'
),
(
  'Insubordinação ou Indisciplina',
  'Descumprimento de ordens ou normas',
  2,
  'Artigo 482, alínea "h", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR - REINCIDÊNCIA

Prezado(a) [NOME_COLABORADOR],

Aplicamos-lhe nova advertência disciplinar em virtude de reincidência em comportamento inadequado no dia [DATA_OCORRENCIA], na unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

Constatamos que o(a) senhor(a) continua apresentando resistência no cumprimento de suas obrigações ([ORDEM_DESCUMPRIDA]), mesmo após já ter sido advertido(a) anteriormente. A repetição de atos de insubordinação ou indisciplina agrava severamente a quebra contratual (Art. 482, "h", CLT).

O que esperamos do seu comportamento:
Exigimos mudança imediata de postura, com alinhamento total às diretrizes operacionais da empresa e respeito às determinações da chefia.

Fica advertido(a) de que a persistência em atitudes semelhantes acarretará Suspensão Disciplinar ou o desligamento por Justa Causa.

Guarapari - ES, [DATA_ATUAL].'
),

-- FAMÍLIA 6: Uso Indevido de Aparelho Celular
(
  'Uso Indevido de Aparelho Celular',
  'Uso pessoal durante o expediente',
  1,
  'Artigo 482, alínea "h", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR - NORMAS INTERNAS (USO DE CELULAR)

Prezado(a) [NOME_COLABORADOR],

A presente tem por finalidade aplicar-lhe uma advertência disciplinar em virtude do descumprimento de normas internas no dia [DATA_OCORRENCIA], durante o seu turno de trabalho na unidade [UNIDADE_ALOCACAO].

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

O uso de aparelho celular particular para fins não profissionais durante o horário de expediente, fora dos períodos de intervalo, desvia a atenção das atividades laborais, prejudica a produtividade e contraria expressamente as diretrizes operacionais da empresa. Tal conduta configura ato de indisciplina, passível de punição conforme o Artigo 482, alínea "h", da CLT.

O que esperamos do seu comportamento:
Esperamos que o(a) senhor(a) mantenha o foco total em suas atribuições durante a jornada de trabalho. O uso do aparelho celular deve ser restrito exclusivamente aos horários de pausa ou intervalo para refeição. Casos de urgência familiar devem ser tratados com o conhecimento e autorização prévia do seu encarregado.

Alertamos que a reincidência nesta infração acarretará medidas disciplinares mais severas.

Guarapari - ES, [DATA_ATUAL].'
),
(
  'Uso Indevido de Aparelho Celular',
  'Uso pessoal durante o expediente',
  2,
  'Artigo 482, alínea "h", da CLT',
  'TERMO DE ADVERTÊNCIA DISCIPLINAR - REINCIDÊNCIA (USO DE CELULAR)

Prezado(a) [NOME_COLABORADOR],

Aplicamos a presente nova advertência disciplinar pois o(a) senhor(a) foi novamente flagrado(a) no dia [DATA_OCORRENCIA], na unidade [UNIDADE_ALOCACAO], utilizando o aparelho celular para fins particulares durante o horário de trabalho.

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

Constatamos que, mesmo após ter sido formalmente orientado(a) e advertido(a) anteriormente pelo mesmo motivo, o(a) senhor(a) continua a ignorar as regras da empresa. A insistência no descumprimento de normas internas agrava a quebra de confiança e caracteriza ato de indisciplina reiterado (Artigo 482, alínea "h", da CLT).

O que esperamos do seu comportamento:
Exigimos o cumprimento imediato da norma que proíbe o uso do celular no posto de serviço. Este é o seu último aviso em nível de advertência.

Fica expressamente ciente de que a próxima ocorrência resultará na aplicação de Suspensão Disciplinar, com os devidos descontos legais.

Guarapari - ES, [DATA_ATUAL].'
),
(
  'Uso Indevido de Aparelho Celular',
  'Uso pessoal durante o expediente',
  3,
  'Artigo 482, alínea "h", da CLT',
  'CARTA DE SUSPENSÃO DISCIPLINAR

Prezado(a) [NOME_COLABORADOR],

Pela presente, comunicamos a aplicação de SUSPENSÃO DISCIPLINAR de [QUANTIDADE_DIAS] dia(s), a ser cumprida no(s) dia(s) [DATAS_DA_SUSPENSAO], com o consequente desconto em sua remuneração e descanso semanal remunerado.

A medida está sendo aplicada devido à nova infração ocorrida no dia [DATA_OCORRENCIA], na unidade [UNIDADE_ALOCACAO], onde o(a) senhor(a) foi novamente flagrado(a) utilizando o celular de forma indevida.

Relato da Chefia Imediata:
[NARRATIVA_ENCARREGADO]

Tendo em vista as advertências anteriores já aplicadas pelo mesmo motivo, a reiteração desta conduta configura indisciplina grave e insubordinação às ordens diretas da chefia (Artigo 482, alínea "h", da CLT).

O que esperamos após seu retorno:
Exigimos que retorne às suas atividades no dia [DATA_RETORNO] cumprindo integralmente as normativas da empresa. Fica o(a) senhor(a) ciente de que o esgotamento das medidas pedagógicas e disciplinares resultará na rescisão do contrato de trabalho por JUSTA CAUSA.

Guarapari - ES, [DATA_ATUAL].'
);
