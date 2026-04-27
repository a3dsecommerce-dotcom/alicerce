# 🚀 Alicerce ERP Evolution & Principles

Este documento registra as decisões arquiteturais, princípios de design e evoluções do sistema para garantir continuidade e avanço tecnológico.

## 🏗️ Princípios de Design "Cockpit"

O sistema utiliza o padrão **Cockpit Layout**, projetado para alta densidade de informação e clareza operacional.

### 1. Estrutura de Grade (The 1fr 350px Rule)
Todas as páginas de portal seguem a estrutura:
- **Header**: QuickActions e KPIs.
- **Main Grid**: `grid-cols-[1fr_350px]`.
  - **Left Column (`flex-1`)**: Área de trabalho principal (tabelas, formulários).
  - **Right Column (`w-350px`)**: Contexto compartilhado (`ColaboradoresSharedTable`) e métricas locais.

### 2. Hierarquia de Modais & Adaptive UX
- **AdaptiveModal**: Componente híbrido que alterna entre Dialog (Desktop) e Drawer (Mobile). Substituiu o `DraggableModal` para permitir operação em campo.
- **Ficha360**: Visualização profunda de dados sem perder o contexto da lista.
- **Ajuste Modals**: Substituíram os `prompts` nativos para uma experiência premium e controle de notificações.

## 📈 Evolução Recente (V751.7)

### 🛠️ Hardening & Build Fixes
- **Structural Integrity (Mathematical Stabilization)**: Resolvidos erros críticos de `Unexpected token` e `Expected comma` via normalização de fechamento de `<div>` e uso estratégico de React Fragments (`<>`) em retornos complexos.
- **Turbopack Stabilization**: Otimização do parser para Next.js 16.2.4, eliminando ambiguidades em layouts de alta densidade.
- **Runtime Hotfix**: Corrigido `ReferenceError: FileText is not defined` no módulo Intel.

### 💎 Melhorias Funcionais
- **RH Prefeitura (PMG)**: 
  - Implementado modal de ajuste para Insalubridade e Horário.
  - Sincronismo automático com RH Geral e Encarregados via `n8n.trigger`.
  - Visão consolidada de todas as secretarias (SEMED, SEMSA, SEMAD, SEMOB).
- **Portal do Diretor (Unidade)**:
  - Melhoria na interface de ajuste de colaboradores.
  - Trava de segurança (RBAC) que permite visualização mas notifica a gerência para aprovação de alterações sensíveis.
- **Admissão Master**:
  - Unificação do cadastro civil e documental em fluxo único com validação em tempo real.
- **Intel BI Hub**:
  - Estabilização da interface de relatórios e exportação de dados.

## 🛡️ Protocolo de Segurança e Auditoria
- **SST Integration**: Cada entrega de EPI e treinamento NR gera um log de conformidade.
- **Ethics Channel**: Denúncias 100% anônimas com disparos criptografados para o comitê.

## 📈 Evolução Recente (V752.0 - O Salto Híbrido)
### 🛠️ UX Dual-View & Mobile Extrema
- **Migração de Componentes**: Remoção completa do `DraggableModal` e adoção do `AdaptiveModal` em todos os fluxos globais (Ocorrências, Admissão, Abono).
- **Fluxo EPI (NR-06)**: Implementação de interface step-by-step para entrega de equipamentos, otimizada para toque e conectada ao n8n para geração de PDFs.
- **Resiliência de Dados**: Implementação de fallbacks inteligentes (Mock Mode) para garantir estabilidade da UI durante períodos de sincronização ou instabilidade do backend hospedado.
- **Refatoração Responsiva**: Dashboard principal e tabelas críticas (Colaboradores) agora operam em grid dinâmico (mobile-first).

---
*Este ERP é um organismo vivo. Documentar é garantir a soberania operacional da Alicerce.*
