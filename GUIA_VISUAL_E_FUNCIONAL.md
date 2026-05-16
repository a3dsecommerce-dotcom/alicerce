# 🖼️ Guia Visual e Funcional — Alicerce Ops v753.8.56

Este guia descreve o que o usuário encontra em cada tela do sistema, detalhando os elementos visuais e as ações disponíveis.

---

## 🔑 1. Tela de Login

**O que você vê:** Fundo escuro (OLED black) com blob animado laranja, logo Alicerce, campos de telefone e senha.

- **Campo Telefone:** Aceita com ou sem DDD e prefixo 55 — o sistema normaliza automaticamente
- **Campo Senha:** Por padrão, os **4 últimos dígitos do telefone** (ex: telefone `92999991234` → senha `1234`)
- **Senha Customizada:** Administradores podem definir senha própria para colaboradores
- **Segurança:** Após 5 tentativas erradas, a conta é bloqueada por 10 minutos
- **"Trabalhe Conosco":** Abre formulário de candidatura com upload de currículo
- **Feedback:** Erros exibidos abaixo do formulário; sucesso redireciona ao dashboard

---

## 🏠 2. Dashboard (Navegação Geral)

**O que você vê:** Sidebar lateral com ícones dos módulos + área principal de conteúdo.

### Sidebar
- **Logo Alicerce** no topo
- Ícones dos módulos acessíveis pelo seu perfil (RBAC automático)
- **Theme Toggle:** Alterna entre Dark (OLED) e Light mode
- **Perfil do Usuário** no rodapé: nome + cargo

### Header Dinâmico
- Nome e ícone do módulo ativo
- Versão do sistema e botões de ação (logout, troca de módulo)

---

## 🏢 3. Módulo Gerência

### Aba: Visão Geral
- **4 KPI Cards:** Colaboradores Ativos · Requisições de Volante · Vagas Abertas · Tickets Pendentes
- **Feed de Atividades:** Lista cronológica em tempo real de ações de todos os usuários
- Cada item do feed mostra: usuário, ação, horário

### Aba: Fiscalização
- Tabela de unidades com status de compliance
- Indicadores de presença, ocorrências abertas e EPIs
- Clique em uma unidade → detalhes expandidos

### Aba: RH
- Visão agregada do ciclo de vida dos colaboradores
- Controle de admissões em andamento e offboardings
- Botão de aprovação de transferências com histórico

### Aba: Unidades
- Lista completa de escolas/postos com busca por nome
- Cadastro de nova unidade via botão "+"
- Edição inline de responsável e rota

### Aba: Missões
- Painel para criar desafios com checklist customizado
- Cards de missões ativas com progresso por encarregado
- Opções de desativar, editar ou excluir missão

---

## 👷 4. Módulo Encarregado

### Dashboard de Resumo
- **3 Cards de status:** Minhas Unidades · Minha Equipe · Ocorrências Ativas
- Números em laranja = atenção; vermelho = crítico

### Aba: Minhas Unidades
- Cards com nome, endereço e contador de colaboradores por escola
- Botão **"Imprimir Rota"** → abre modal de personalização do PDF
  - Checkboxes: Unidade, Colaboradores, Telefone, Insalubridade, Função, Horário
  - PDF gerado com grupos por unidade (sem quebra de página no meio da unidade)

### Aba: Equipe
- **Barra de busca:** Filtra por nome ou CPF em tempo real
- **Filtro por Unidade** e **Filtro por Cargo** (dropdowns)
- **Tabela de colaboradores:** Nome · Cargo / Unidade · Jornada · Insalubridade · Status
- Clique em qualquer linha → abre **Ficha 360°** do colaborador
  - Editar: Nome, Telefone/WhatsApp, Insalubridade, Horários, Função, etc.
  - Campo "Motivo da Alteração" obrigatório (auditoria)
  - Alterações salvas com toast de confirmação
- **Botão "Imprimir Equipe":**
  - Com filtro de unidade ativo → "Imprimir Unidade [Nome]"
  - Sem filtro → "Imprimir Equipe Completa"
  - PDF gerado sob demanda (não impacta o carregamento inicial)

### Aba: Admissão Rápida
- Formulário mobile-friendly para cadastro emergencial
- Campos: Nome, Telefone, Unidade, Função, Insalubridade, Horário de entrada/saída
- Submissão cria colaborador com `status: EM_ADMISSAO`

### Aba: Ocorrências / Tickets
- Lista de ocorrências abertas por unidade
- Botão para criar nova ocorrência com prioridade e setor destino
- Modal de resolução exige justificativa (registro de auditoria)

### Aba: CAT (Acidente de Trabalho)
- Campo de busca com autocomplete de colaboradores
- Formulário: Tipo de Acidente, Data, Hora, Descrição, Testemunhas
- Submissão dispara notificação para Técnico de Segurança

### Aba: EPI
- Seleção de colaborador + itens de EPI disponíveis em estoque
- Registro de entrega com data
- Histórico de entregas por unidade

### Aba: Disciplina
- Registro de advertências com categoria (verbal, escrita, suspensão)
- Associação a colaborador e data de ocorrência
- Histórico consultável

### Aba: Transferências
- Solicitação de movimentação entre unidades
- Campos: Colaborador, Unidade de Destino, Motivo, Data Desejada
- Status: Pendente → Aprovado pela Gerência → Executado

### Aba: Missões (Radar)
- Cards laranjas com ícone de troféu para cada missão ativa
- Botão "Aceitar" → abre checklist interativo
- Itens alternam entre Pendente (cinza) → OK (verde)
- Submit registra respostas na base de dados em tempo real

---

## 👥 5. Módulo RH e DP

**O que você vê:** Tabela de alta densidade com navegação horizontal suave.

### Cockpit de Configuração (Engrenagem no Cabeçalho)
- Ícone aparece no hover de qualquer coluna dinâmica
- Opções: Renomear · Colorir · Mover Esquerda/Direita · Excluir
- Todas as mudanças são instantâneas (Optimistic Updates)

### Tabela de Colaboradores
- Colunas fixas: Nome, CPF, Cargo, Unidade, Status, Experiência
- Colunas dinâmicas: checklist de documentos configurável
- Scroll horizontal com controles "← Anterior" / "Próxima →"
- Clique em linha → FichaColaborador360 completa

### Offboarding
- Botão por colaborador com status `DESLIGADO`
- Checklist de 16 etapas: Exame demissional, TRCT, Devolução de ativos, etc.

---

## 🔐 6. Central de Ocorrências

**O que você vê:** Tabela de tickets com badges de prioridade coloridos.

- **BAIXA** (verde) · **NORMAL** (cinza) · **ALTA** (amarelo) · **CRÍTICA** (vermelho)
- Colunas: ID · Título · Urgência · Atribuição · Unidade · Tempo Aberto · Status
- Filtro automático por aba (Minhas Demandas / Minhas Solicitações)
- **SLA monitorado:** Tickets com >24h exibem "VENCIDO" em vermelho pulsante
- Botão "Nova Ocorrência" → modal com setor destino e prioridade
- Clique no ticket → detalhes completos + botão "Confirmar Resolução"

---

## 💡 7. Elementos Visuais Padrão (Design System)

| Elemento | Descrição |
|---|---|
| **Dark Mode OLED** | Fundo `#000000` puro — economia de bateria em smartphones |
| **Brand Color** | `#ff6a00` (laranja) para ações primárias |
| **Cards** | Glassmorphism com `border` sutil e `shadow-sm` |
| **Animações** | `animate-fade-in` em toda transição de tela |
| **Toasts** | Notificações no canto — verde (sucesso), vermelho (erro), cinza (info) |
| **Modais Adaptativos** | Drawer no mobile, modal centralizado no desktop |
| **Bordas** | `border-radius` de 12px (cards) a 24px (modais) |
| **Tipografia** | Inter (Google Fonts), escala 8px-24px, `font-black` em títulos |

### Toasts (Substituição do alert() nativo)
```
✅ toast.success("Dados salvos com sucesso!")     → verde, canto superior direito
❌ toast.error("Erro ao conectar ao banco")        → vermelho, com descrição
⏳ toast.loading("Salvando...")                    → cinza animado
```

---

*Guia atualizado em: 16/05/2026 — v753.8.56*
*Destinado a: novos usuários, diretoria, equipe de campo e desenvolvimento*
