# 0012 — Preço por tamanho, com vigência e congelado no pedido

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Hoje o preço é definido **pelo tamanho** (P, M, G), não pelo prato. O dashboard precisa
mostrar o faturamento, e uma mudança de preço (ex.: G de R$ 20 para R$ 22) deve valer
**somente daquele momento em diante**, sem alterar pedidos e relatórios passados.

## Decisão

- **Dinheiro sempre em centavos (inteiro)**, nunca `float`. Value object `Money`.
- Tabela `size_prices` com vigência: `(size, price_cents, valid_from, valid_to)`.
  Mudar o preço **encerra** o registro vigente e **cria** um novo; nada é sobrescrito.
- **Snapshot no pedido:** cada `order_item` grava `unit_price_cents`, `size` e o nome do
  prato no momento da venda. Relatórios somam o snapshot e nunca consultam a tabela atual.
- O modelo permite, no futuro, preço específico por prato sem quebrar os pedidos antigos.

## Alternativas consideradas

- **Só o preço atual na tabela de tamanhos** — perderia o histórico e corromperia relatórios
  passados.
- **Apenas o snapshot, sem vigência** — os pedidos ficariam corretos, mas sem histórico
  auditável de quando o preço mudou.

## Consequências

- Relatórios são historicamente corretos por construção.
- Pedidos cancelados não entram no faturamento.
- Em aberto: forma de pagamento (Pix/dinheiro/cartão) no pedido, a validar com o dono.
