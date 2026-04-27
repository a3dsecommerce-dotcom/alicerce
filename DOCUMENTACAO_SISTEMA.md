# 📖 Documentação Técnica — Alicerce ERP V45.0

Este documento detalha a arquitetura e o funcionamento do **Portal Web Alicerce**, projetado para ser o Centro de Operações Soberano da empresa.

---

## 🏗️ 1. Arquitetura do Projeto

O sistema é construído sobre o framework **Next.js 15 (App Router)** e utiliza o **Supabase** como núcleo de dados e autenticação.

- **Frontend**: React 19 + TailwindCSS.
- **Ícones**: Lucide React.
- **Estética**: Glassmorphism (efeitos de transparência e sombras profundas).
- **Cores**: Identidade Alicerce (Branco, Cinza Escuro, Laranja Vibrante). **Proibido o uso de tons Roxos/Violetas.**

---

## 🔐 2. Sistema de Autenticação (Login)

O método de login foi simplificado para facilitar a interatividade durante a fase de construção:

- **Usuário**: Número de telefone cadastrado (ex: `559298844XXXX`).
- **Senha**: Os 4 últimos dígitos do telefone informado.
- **Fluxo**:
  1. O usuário informa o telefone.
  2. O sistema verifica no banco de dados (`usuarios`) se o telefone existe.
  3. Se existir e a senha (últimos 4 dígitos) estiver correta, o acesso é liberado.
  4. O nível de acesso (Admin, RH, Compras, etc.) define para qual dashboard o usuário será redirecionado.

---

## 📊 3. Dashboard Master (Cockpit)

O Dashboard (`app/dashboard/page.tsx`) é modular e se adapta ao cargo do usuário.

### Módulos Ativos (Ondas):
1.  **ONDA 1 (Operacional)**: Foco em Ponto Digital e Visão por Unidade.
2.  **ONDA 2 (RH)**: Ciclo de vida do colaborador (Admissão/Demissão).
3.  **ONDA 3 (Suprimentos)**: Gestão de estoque e requisições.

### Centro de Comando:
A tela inicial de Gerência (`GerenciaModule.tsx`) exibe o **Roadmap de Expansão**, mostrando o progresso de cada onda e a atividade em tempo real dos Agentes de IA (Swarm).

---

## 🛠️ 4. Como Adicionar Novos Módulos

Para adicionar uma nova funcionalidade:
1. Crie o componente em `app/dashboard/components/modules/NomeDoModulo.tsx`.
2. Registre o módulo no arquivo `app/dashboard/page.tsx` dentro do array `modules`.
3. Adicione a lógica de permissão (RBAC) no filtro de módulos.

---

## 📡 5. Sincronização e Deploy

- **GitHub**: O código é sincronizado automaticamente.
- **EasyPanel**: O deploy ocorre em tempo real assim que o código chega na branch `main`.

> **Nota para Manutenção**: Sempre utilize comentários em português no código e siga o padrão de design limpo e conciso.
