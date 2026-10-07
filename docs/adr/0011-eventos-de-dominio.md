# 0011 — Eventos de domínio: event bus em memória, evoluindo para outbox + pg-boss

- **Status:** Proposto
- **Data:** 2026-10-06

## Contexto

Ações do domínio disparam efeitos colaterais: notificar telas (SSE) e, no futuro, avisar o
cliente pelo WhatsApp e atualizar projeções de relatório. O RabbitMQ chegou a ser cogitado,
mas no MVP não há nenhum consumidor fora do processo da API.

## Decisão

1. **MVP:** porta `EventBus` na camada de aplicação, com implementação **em memória**
   (tipada e assíncrona, ex.: `emittery` ou um dispatcher próprio). Os agregados registram
   eventos (`OrderCreated`, `OrderStarted`, `OrderReady`, `OrderDelivered`, `OrderCancelled`,
   `DailyMenuPublished`), que são publicados **após o commit** da transação.
2. **Quando houver trabalho assíncrono que não pode se perder** (fase 3, WhatsApp):
   - **Transactional Outbox:** o evento é gravado numa tabela `outbox` na mesma transação
     do pedido;
   - **pg-boss** (fila sobre o próprio Postgres) processa os jobs, com retry e backoff.
3. RabbitMQ/NATS só entram se surgir necessidade de múltiplos serviços. Trocá-los significa
   escrever um novo adaptador para a mesma porta.

## Alternativas consideradas

- **RabbitMQ desde o início** — infraestrutura extra (operar, monitorar, fazer backup) sem
  consumidor que justifique. Descartado para o MVP.
- **BullMQ** — exige Redis só para isso.

## Consequências

- Zero infraestrutura extra no MVP; o domínio já nasce orientado a eventos.
- Eventos em memória se perdem se o processo cair entre o commit e o handler. Isso é
  aceitável para notificação de tela (o cliente refaz o fetch), mas não para WhatsApp,
  daí o outbox.
