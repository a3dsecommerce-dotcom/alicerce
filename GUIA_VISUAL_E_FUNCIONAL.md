# 🖼️ Guia Visual e Funcional: Tour pelo Alicerce Ops (V753.5)

Este guia descreve o que o usuário encontra em cada tela do sistema, detalhando os elementos visuais e as ações disponíveis em cada interface.

---

## 1. Sidebar (Menu Lateral de Navegação)
**O que você vê:** Uma barra lateral elegante no lado esquerdo com ícones modernos e o logo da Alicerce no topo.
- **Painel de Controle:** O ponto de partida. Muda dinamicamente conforme quem está logado (Gerente ou Encarregado).
- **Módulos Setoriais:** Atalhos diretos para Compras, RH, Almoxarifado e Ocorrências.
- **Perfil do Usuário:** No rodapé, mostra seu nome e seu cargo (Ex: ADMIN, GERENTE, ENCARREGADO).
- **Theme Toggle:** Botão para alternar entre o Modo Escuro (Elite Ops) e o Modo Claro.

---

## 2. Painel de Controle: Módulo Gerência (O Cockpit Executivo)
**O que você vê:** Um cabeçalho imponente escrito "Painel de Controle Central" e uma barra de abas logo abaixo.

### A. Aba: Visão Geral
- **Cards de Estatísticas:** 4 blocos coloridos no topo mostrando números vivos: Total de Colaboradores, Requisições de Volantes, Vagas Abertas e Tickets Pendentes.
- **Feed de Atividades:** Uma lista cronológica na lateral mostrando tudo o que aconteceu nas últimas horas (quem cadastrou quem, quem abriu qual chamado).

### B. Aba: Unidades (Gestão de Rotas)
- **Tabela de Escolas:** Uma lista organizada de todas as unidades, mostrando o nome, o endereço, a rota e quem é o encarregado responsável.
- **Botão "Cadastrar Unidade":** Abre um formulário flutuante (modal) para inserir novos postos de trabalho.
- **Busca Rápida:** Um campo no topo para filtrar unidades instantaneamente pelo nome ou bairro.

### C. Aba: Missões (Comando Operacional)
- **Painel de Lançamento:** Espaço para o gerente escrever o título e a descrição de um desafio para o campo.
- **Editor de Checklist:** Onde o gerente define os itens que o encarregado deve marcar (Ex: "Conferiu estoque de papel?", "EPIs estão em uso?").
- **Lista de Missões Ativas:** Cards que mostram quais missões estão rodando, se são semanais ou mensais, e permitem desativar ou excluir missões antigas.

---

## 3. Painel de Controle: Módulo Encarregado (O Radar de Campo)
**O que você vê:** Uma interface focada em cards grandes, otimizada para uso no celular.

### A. Dashboard de Resumo
- **Cards de Status:** Blocos com "Minhas Unidades", "Minha Equipe" e "Ocorrências Ativas". Se houver um problema, o número aparece em vermelho.

### B. Aba: Minhas Missões (Radar)
- **Cards de Desafios:** Blocos pretos e laranjas com ícones de troféu. Cada card mostra o título do desafio enviado pela gerência.
- **Botão "Aceitar Missão":** Ao clicar, abre uma tela com as instruções e o checklist que deve ser preenchido fisicamente no posto de trabalho.
- **Checklist Interativo:** Botões que mudam de "Pendente" (Cinza) para "OK" (Verde) conforme o encarregado conclui as tarefas.

### C. Aba: Admissão Rápida
- **Formulário de Campo:** Campos simplificados para coletar nome, telefone e cargo do novo funcionário. Ideal para contratações de emergência no local.

---
6. Módulo de RH (Gestão de Capital Humano)
**O que você vê:** Uma tabela de alta densidade com navegação horizontal suave.
- **Cockpit de Configuração (Engrenagem):** Ao passar o mouse no cabeçalho, um ícone de configurações permite renomear, colorir, reordenar ou excluir colunas dinamicamente.
- **Navegação Horizontal v2.1:** Controles dedicados ("Anterior" e "Próxima") para percorrer grandes volumes de colunas sem perder o foco no colaborador.
- **Atualizações Otimistas:** Mudanças de status, documentos e configurações ocorrem instantaneamente, com feedback visual em tempo real.
- **Status da Admissão:** Controle detalhado desde a entrevista até a integração final no Strato.

---

## 5. Módulo de Ocorrências e SST (Segurança)
**O que você vê:** Uma lista de chamados com níveis de prioridade.
- **Badge de Prioridade:** Tags coloridas indicando se o problema é Baixo (Azul), Médio (Amarelo) ou Urgente (Vermelho).
- **Formulário CAT:** Uma página dedicada para relatar acidentes, com campos para testemunhas, fotos e relato detalhado do ocorrido.

---

## 💡 Elementos Visuais Padrão (Design System)
- **Glassmorphism:** O sistema usa transparências suaves que dão um ar de "tecnologia de elite".
- **Animações:** Tudo o que você clica tem uma transição suave (fade-in), evitando que a tela "pisque".
- **Notificações (Toasts):** Pequenos alertas no canto da tela que confirmam ações (Ex: "Unidade cadastrada com sucesso!" em verde).

---
*Este guia ajuda na orientação rápida de novos usuários e na apresentação de recursos para investidores ou diretoria.*
