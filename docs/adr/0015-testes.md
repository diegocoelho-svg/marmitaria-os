# 0015 — Estratégia de testes: Vitest + Playwright

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

As regras de domínio (transições de status, preço, senha diária) precisam de testes rápidos.
A integração com o banco precisa de testes reais. E o sistema precisa funcionar em quatro
tipos de dispositivo (0003).

## Decisão

- **Unitários (Vitest):** domínio e casos de uso, com repositórios em memória.
- **Integração (Vitest):** repositórios Drizzle e rotas Fastify (`app.inject`) contra um
  Postgres real (Docker local, service container no CI).
- **E2E de API (Vitest):** fluxos completos via HTTP (criar pedido → avançar status →
  relatório).
- **E2E de interface (Playwright):** fluxos do balcão e da cozinha em quatro projetos de
  viewport: desktop, mobile, tablet e TV (1920×1080). Inclui o recebimento do pedido via
  SSE na tela da cozinha.

## Consequências

- Pirâmide clara: muitos testes unitários, menos de integração, poucos E2E críticos.
- Todos rodam no CI (0018). O E2E é o passo mais lento e roda em paralelo.
