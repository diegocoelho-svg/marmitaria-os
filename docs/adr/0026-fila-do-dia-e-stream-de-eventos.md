# 0026 — Fila do dia e stream de eventos

- **Status:** Aceito
- **Data:** 2026-10-20

## Contexto

O 0010 escolheu SSE para levar pedidos e mudanças de status às telas, com `id` sequencial e
reenvio pelo `Last-Event-ID`. Faltava decidir o que cada evento carrega, até onde o servidor
consegue reenviar, o que acontece quando não consegue e como uma tela monta o estado
inicial. Os eventos saem depois da gravação e podem se perder entre as duas (0011), então o
estado precisa sempre poder ser refeito por consulta.

## Decisão

**Fila por consulta.** `GET /api/orders?date&status` lista os pedidos de um dia de operação
por senha. Sem `date`, usa o dia corrente em `America/Sao_Paulo`; `status` aceita vários
valores separados por vírgula (`received,preparing,ready` para a cozinha).

**Eventos enxutos.** `GET /api/events` envia os eventos da aplicação como estão no domínio:
tipo, id do agregado, instante e o snapshot curto (senha e dia para pedidos; data, cardápio
de origem e pratos para o cardápio do dia). A tela usa o evento para atualizar ou invalidar
a consulta (0008), sem depender de o evento trazer o pedido inteiro. Os formatos estão em
`packages/contracts/src/events.ts`.

**Cursor.** Cada mensagem tem `id: <boot>:<sequência>`. O `boot` é gerado na subida da API,
então um cursor de antes de um restart nunca é confundido com um atual.

**Reenvio.** O servidor guarda as últimas 500 mensagens em memória. Ao conectar:

- sem `Last-Event-ID`: recebe `event: ready` com o cursor atual e busca o estado pela API;
- com cursor dentro do buffer: recebe as mensagens perdidas, em ordem;
- com cursor de outro boot, malformado, futuro ou mais antigo que o buffer: recebe
  `event: reset` com o cursor atual e refaz as consultas.

`ready` e `reset` trazem `data: {}` e o `id`, para o navegador já reconectar com um cursor
válido.

**Conexão.** Comentário `: ping` a cada 15 s enquanto houver tela conectada, cabeçalhos
`cache-control: no-cache, no-transform` e `x-accel-buffering: no`. No desligamento, o hook
`preClose` encerra os streams para o servidor não esperar conexões que não terminam.

## Alternativas consideradas

- **Evento com o pedido completo** — economiza uma consulta por evento, mas duplica o
  contrato do pedido no stream e deixa a tela errada se um evento se perder.
- **Reenvio a partir do banco (outbox)** — sobrevive a restart, mas pede tabela e limpeza
  própria. O `reset` cobre o restart com uma consulta; a outbox fica para quando os eventos
  forem para fora do processo (0011).
- **Sequência sem boot** — mais curta, mas depois de um restart um cursor antigo pareceria
  válido e a tela perderia eventos sem saber.

## Consequências

- Uma tela que volta depois de mais de 500 eventos, ou depois de um restart, refaz as
  consultas, que são baratas para o volume de um dia.
- O buffer é por processo; com mais de uma instância da API, os eventos precisam ser
  distribuídos entre elas, como o 0010 já prevê.
- As rotas continuam abertas até a decisão sobre autenticação.
