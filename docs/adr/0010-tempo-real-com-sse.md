# 0010 — Tempo real com Server-Sent Events (SSE)

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

A cozinha (e o balcão) precisam ver novos pedidos e mudanças de status sem recarregar a página.
No fluxo definido, **todas as ações do usuário são requisições REST**: o balcão cria o pedido
(`POST /orders`) e a cozinha avança o status (`PATCH /orders/:id/status`). O tempo real só
precisa ir **do servidor para as telas**. A tela da cozinha pode ser uma TV ligada o dia todo,
sujeita a quedas de Wi-Fi.

## Decisão

Usar **SSE**: endpoint `GET /events` com `text/event-stream`, consumido pelo `EventSource`
do navegador.

- Cada evento tem um `id` sequencial; ao reconectar, o navegador envia `Last-Event-ID` e o
  servidor reenvia o que foi perdido (ou o cliente refaz o fetch da fila).
- Heartbeat periódico (comentário SSE) para manter a conexão viva atrás de proxies.
- No front, os eventos atualizam ou invalidam o cache do TanStack Query (0008).
- Servido atrás do Caddy com HTTP/2, evitando o limite de 6 conexões por domínio do HTTP/1.1.

## Alternativas consideradas

- **Polling (ex.: a cada 5s)** — simples, mas com atraso perceptível e tráfego desnecessário.
- **WebSocket** — bidirecional, mas não há nada para o cliente enviar pela conexão. Exigiria
  protocolo próprio, lógica de reconexão manual e mais cuidado com proxies e túneis.

## Consequências

- HTTP puro: passa por Caddy e Cloudflare Tunnel sem configuração especial.
- Reconexão nativa do navegador, crucial para a tela fixa da cozinha.
- Com mais de uma instância da API, os eventos precisam ser distribuídos entre elas
  (ex.: `LISTEN/NOTIFY` do Postgres). Não é necessário com uma instância só.
- Se um dia surgir a necessidade de canal bidirecional, um novo ADR substitui este.
