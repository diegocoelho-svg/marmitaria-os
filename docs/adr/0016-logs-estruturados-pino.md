# 0016 — Logs estruturados com Pino

- **Status:** Proposto
- **Data:** 2026-10-06

## Contexto

Quando algo der errado na marmitaria ("o pedido 42 não apareceu na cozinha"), precisamos
reconstruir o que aconteceu. Logs em texto livre (`console.log`) não são filtráveis nem
correlacionáveis.

## Decisão

Usar o **Pino**, que já vem integrado ao Fastify:

- Em produção, cada log é uma linha JSON com `level`, `time`, `reqId`, `msg` e campos de
  contexto (`orderId`, `event`…).
- Em desenvolvimento, `pino-pretty` para leitura humana.
- `reqId` por requisição, propagado aos logs de casos de uso e eventos, para correlação.
- `redact` para dados sensíveis (telefone de cliente, tokens).
- Níveis: `error` (falha que exige ação), `warn` (anomalia tolerada), `info` (marcos de
  negócio), `debug` (só em dev).
- Endpoint `GET /health` para as checagens do Docker e do deploy.

## Consequências

- Logs consultáveis com `docker logs | jq` desde o primeiro dia.
- Caminho aberto para Grafana Loki/Promtail ou equivalente, sem mudar o código.
