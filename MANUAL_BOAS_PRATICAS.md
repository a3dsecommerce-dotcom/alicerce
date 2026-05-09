# 📜 Manual de Boas Práticas - Alicerce ERP

Este documento estabelece os padrões de desenvolvimento, design e operação para garantir a longevidade e soberania do sistema.

## 1. Princípios de Desenvolvimento
*   **Código Limpo (Clean Code)**: Funções pequenas, nomes descritivos e sem lógica desnecessária.
*   **Atomic Commits**: Cada commit deve representar uma única alteração funcional. Commits como "fix" sem contexto são proibidos.
*   **Segurança em Primeiro Lugar**: Todas as interações com o Supabase devem respeitar o RLS (Row Level Security) e nunca expor credenciais em commits.
*   **Documentação Viva**: Qualquer nova funcionalidade de banco (SQL) ou módulo de interface deve ser refletida na `DOCUMENTACAO_SISTEMA_ALICERCE.md`.

## 2. Design e UI (High-End UX)
*   **Proibição de Cores Simples**: Evitar `bg-red-500` puro. Usar a paleta harmonizada do Alicerce baseada em HSL e tons de cinza premium.
*   **Feedback Visual**: Todas as ações críticas (salvar, excluir) devem emitir um Toast de sucesso/erro e, se possível, um log de auditoria na tabela `atividades`.
*   **Otimização Mobile**: O sistema deve ser 100% funcional em smartphones, utilizando drawers e grids adaptativos.

## 3. Fluxo de Trabalho (Workflow)
1.  **Planejamento**: Antes de codar, valide a regra de negócio com o usuário.
2.  **Migração SQL**: Crie scripts versionados na pasta `/sql`.
3.  **Implementação**: Desenvolva com foco em componentes reutilizáveis.
4.  **Auditoria**: Garanta que as ações administrativas gerem registros de logs.
5.  **Deploy**: Após o push, verifique sempre o status do build no Easypanel.

## 4. Gestão de Dados
*   **Flexibilidade**: Use campos `JSONB` (`checklist_extra`, `config_extra`) para dados que mudam frequentemente, evitando migrações de esquema constantes.
*   **Integridade**: Nunca apague dados definitivos sem confirmação dupla (`confirm()`) e registro de motivo de exclusão.

---
*Assinado: Equipe Antigravity & A3DS Ecommerce*
