# 0004 — Monorepo com pnpm workspaces

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Front e back compartilham contratos (schemas de entrada/saída, enums de status, tipos).
Mantê-los em repositórios separados leva a divergências silenciosas.

## Decisão

Monorepo com **pnpm workspaces**:

```
apps/
  api/        Fastify (backend)
  web/        React (frontend)
packages/
  contracts/  schemas Zod e tipos compartilhados (ver 0009)
  config/     tsconfig/biome compartilhados
docs/adr/
```

Turborepo pode ser adicionado depois, se o tempo de build/CI justificar cache de tarefas.

## Alternativas consideradas

- **Repos separados** — contratos duplicados ou publicados como pacote; overhead alto.
- **npm/yarn workspaces** — funcionam, mas o pnpm é mais rápido e mais estrito com
  dependências fantasmas.
- **Nx** — poderoso, mas pesado para dois apps.

## Consequências

- Mudança de contrato quebra o typecheck dos dois lados no mesmo PR.
- O CI precisa rodar tarefas por pacote (filtros do pnpm).
