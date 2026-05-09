# 🏛️ Alicerce ERP - Gestão Cognitiva e Soberana

![Alicerce Banner](https://img.shields.io/badge/Version-752.5-blue?style=for-the-badge&logo=rocket)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![n8n](https://img.shields.io/badge/n8n-Automation-red?style=for-the-badge&logo=n8n)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)

O **Alicerce ERP** é uma plataforma de gestão avançada desenvolvida para centralizar operações complexas em ambientes B2G (Business to Government) e corporativos de alta demanda. Com foco em inteligência operacional e automação via bots, o sistema oferece controle total sobre Recursos Humanos, Suprimentos e Gestão de Unidades.

## 🚀 Módulos Principais

### 👥 Recursos Humanos (RH Master)
*   **DP (Departamento Pessoal)**: Gestão completa de colaboradores, admissão master unificada (32 etapas) e quadro de vagas.
*   **Checklist Dinâmico**: Motor de verificação documental flexível com criação/edição de colunas em tempo real via JSONB.
*   **Offboarding Estruturado**: Fluxo de desligamento de 16 etapas com auditoria de devolução de ativos e acerto documental.
*   **Controle de Pontos**: Orquestração de batidas de ponto com integração via Bot de WhatsApp para regularização automática.
*   **Gestão de Benefícios**: Controle centralizado de VT, VA e convênios.
*   **Documentação Central**: Repositório seguro para holerites, contratos e atestados.

### 📦 Portal de Suprimentos
*   **Cotação Inteligente**: Gestão de volumes com cálculo automático de cota máxima e sinalização de excedentes.
*   **Acompanhamento Logístico**: Rastreamento de pedidos em tempo real com indicador de "% Faltante" e abate automático via NF.
*   **Relatórios Comparativos**: Visão detalhada de "Pedido vs Entregue" por requisição.

### 🏢 Portal do Diretor (Unidade)
*   **Cockpit Full-Width**: Interface de 100% de largura otimizada para visualização massiva de dados.
*   **Identificação via WhatsApp**: Login e autenticação vinculados ao contato direto do gestor.
*   **Gestão de Campo**: Controle de visitas, ocorrências e solicitações de volante emergencial.

## 🛠️ Stack Tecnológica

*   **Frontend**: Next.js 15, Tailwind CSS, Lucide Icons.
*   **Backend**: Supabase (PostgreSQL), Next API Routes.
*   **Automação**: n8n (Orquestração de Bots e Workflows).
*   **Design**: Glassmorphism, Dark Mode nativo, Layouts Adaptativos.

## 📦 Instalação e Execução

1.  **Clonar o repositório**:
    ```bash
    git clone https://github.com/a3dsecommerce-dotcom/alicerce.git
    ```

2.  **Instalar dependências**:
    ```bash
    npm install
    ```

3.  **Configurar variáveis de ambiente**:
    Crie um arquivo `.env.local` com suas credenciais do Supabase e n8n.

4.  **Rodar o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

## 🔒 Segurança e Soberania
O Alicerce ERP foi construído seguindo princípios de **Sovereign Control**, onde todos os dados são auditáveis e as comunicações são protegidas por camadas de validação hierárquica.

---
Desenvolvido por **A3DS Ecommerce** & **Antigravity AI**.
Versão Atual: **800.0 (Checklist Evolution)**
