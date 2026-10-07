# 0007 — PostgreSQL com Drizzle ORM

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Os dados são relacionais (pedido → itens → ajustes; prato → cardápio do dia) e precisam de
consistência transacional (pedido + evento outbox, ver 0011). Os relatórios são consultas
agregadas por período.

## Decisão

**PostgreSQL** como banco único, acessado com **Drizzle ORM** e migrations geradas pelo
`drizzle-kit`, versionadas no repositório.

## Alternativas consideradas

- **Prisma** — ótima DX, mas client gerado e pesado, e SQL menos explícito para relatórios.
- **Kysely/SQL puro** — mais controle, porém sem schema declarativo nem migrations integradas.

## Consequências

- Schema em TypeScript, próximo do SQL e fácil de otimizar em consultas de relatório.
- O Postgres também pode hospedar a fila de jobs (pg-boss, ver 0011), sem infraestrutura extra.
- Mapeamento explícito entre o modelo do Drizzle e as entidades de domínio nos repositórios.
