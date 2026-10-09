# Architecture Decision Records

Decisões de arquitetura do marmitaria-os. Formato: [`0000-template.md`](./0000-template.md).

| # | Decisão | Status |
|---|---|---|
| [0001](./0001-registrar-decisoes-em-adr.md) | Registrar decisões em ADRs | Aceito |
| [0002](./0002-escopo-e-fases.md) | Problema, escopo do MVP e fases | Aceito |
| [0003](./0003-dispositivos-e-frontend-responsivo.md) | SPA React responsiva (PWA) para web, mobile, tablet e TV | Aceito |
| [0004](./0004-monorepo-pnpm.md) | Monorepo com pnpm workspaces | Aceito |
| [0005](./0005-backend-node-fastify.md) | Backend Node.js + TypeScript + Fastify | Aceito |
| [0006](./0006-clean-architecture-e-ddd.md) | Clean Architecture + DDD pragmático | Aceito |
| [0007](./0007-postgresql-e-drizzle.md) | PostgreSQL com Drizzle | Aceito |
| [0008](./0008-tanstack-router-e-query.md) | TanStack Router e TanStack Query | Aceito |
| [0009](./0009-zod-contratos-compartilhados.md) | Zod e contratos compartilhados | Aceito |
| [0010](./0010-tempo-real-com-sse.md) | Tempo real com SSE | Aceito |
| [0011](./0011-eventos-de-dominio.md) | Eventos de domínio: em memória → outbox + pg-boss | Proposto |
| [0012](./0012-modelo-de-preco.md) | Preço por tamanho, com vigência e snapshot | Aceito |
| [0013](./0013-cardapio-do-dia.md) | Cardápio do dia com planejamento antecipado | Aceito |
| [0014](./0014-ajustes-e-observacoes.md) | Ajustes rápidos + observação livre | Proposto |
| [0015](./0015-testes.md) | Testes com Vitest e Playwright | Aceito |
| [0016](./0016-logs-estruturados-pino.md) | Logs estruturados com Pino | Proposto |
| [0017](./0017-infraestrutura-agnostica-docker.md) | Infraestrutura agnóstica com Docker Compose | Aceito |
| [0018](./0018-ci-cd-github-actions.md) | CI/CD com GitHub Actions e GHCR | Aceito |
| [0019](./0019-eslint-e-prettier.md) | Lint e formatação com ESLint + Prettier | Aceito |

## Em aberto

- Forma de pagamento no pedido (Pix/dinheiro/cartão) para o dashboard — validar com o dono.
- Onde rodar a produção: servidor na loja (funciona sem internet) ou VPS — ver 0017.
