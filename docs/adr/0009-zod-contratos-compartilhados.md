# 0009 — Zod para validação e contratos compartilhados

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Payloads do balcão, filtros do dashboard e respostas da API precisam de validação em tempo de
execução e de tipos em tempo de compilação, sem duplicação.

## Decisão

Schemas **Zod** em `packages/contracts`, usados:

- na API, para validar entrada e serializar saída nas rotas Fastify (via type provider);
- no front, para formulários e para os search params do TanStack Router;
- como fonte dos tipos TypeScript (`z.infer`).

O domínio **não** depende do Zod: invariantes de negócio ficam nas entidades e value objects.
O Zod valida só o formato na borda.

## Consequências

- Uma única fonte de verdade para os contratos.
- Possibilidade futura de gerar OpenAPI a partir dos schemas.
