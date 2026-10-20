# 0025 — Pedidos e senha diária

- **Status:** Aceito
- **Data:** 2026-10-19

## Contexto

O pedido é o centro do MVP (0002): o balcão e o WhatsApp registram, a cozinha acompanha e o
cliente é chamado pela senha. A senha é sequencial e reinicia a cada dia de operação, no
fuso `America/Sao_Paulo`, e é única por `businessDate` (0022). Falta decidir como gerar a
senha sem repetir nem pular números quando dois pedidos chegam juntos, e como o pedido
congela o catálogo do momento (0012, 0014).

## Decisão

**Senha.** Tabela `daily_ticket_counters` com uma linha por dia (`business_date`,
`last_ticket`). A próxima senha sai de um único comando:

```sql
INSERT INTO daily_ticket_counters (business_date, last_ticket) VALUES ($1, 1)
ON CONFLICT (business_date) DO UPDATE SET last_ticket = daily_ticket_counters.last_ticket + 1
RETURNING last_ticket
```

O Postgres trava a linha do dia até o fim da transação, então pedidos simultâneos recebem
senhas distintas e em sequência. O contador roda na mesma `UnitOfWork` que grava o pedido:
se o pedido for recusado depois de reservar a senha, o rollback devolve o número e não fica
buraco na sequência. A constraint de senha única por dia (0023) continua como garantia.

**Criação.** `CreateOrderUseCase` calcula o dia de operação pelo `Clock` e, dentro da
`UnitOfWork`:

- exige cardápio do dia publicado para a data;
- aceita só pratos ativos que estão no cardápio do dia;
- aceita só ajustes ativos e grava o rótulo do momento;
- usa o preço vigente de cada tamanho.

Prato, preço e ajuste ficam congelados no item, e mudanças posteriores no catálogo não
alteram pedidos já feitos. `order_item_adjustments.adjustment_id` passa a referenciar
`adjustments`.

**Status.** `PATCH /orders/:id/status` aplica a transição pelo agregado e grava só se o
status no banco ainda for o lido (0023). Quem perde a corrida recebe 409.

**Eventos.** `order.created` e os de transição são publicados depois da gravação, para a
fila da cozinha e o SSE (0010, 0011).

## Alternativas consideradas

- **Sequence do Postgres** — não reinicia por dia sem job agendado, e um número consumido
  por transação desfeita não volta.
- **`MAX(ticket) + 1` em `orders`** — corre entre pedidos simultâneos e dependeria de
  repetir a gravação ao bater na constraint.
- **Advisory lock por dia** — funciona, mas espalha a regra entre o lock e a consulta.

## Consequências

- A tabela de contadores cresce uma linha por dia de operação.
- Pedidos simultâneos do mesmo dia são serializados na linha do contador; para o volume de
  uma marmitaria isso não pesa.
- Pedidos recusados não consomem senha.
