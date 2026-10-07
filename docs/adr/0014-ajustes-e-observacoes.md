# 0014 — Ajustes rápidos + observação livre nos itens do pedido

- **Status:** Proposto
- **Data:** 2026-10-06

## Contexto

Quase todo pedido tem uma troca ou comentário (ex.: farofa por salada). A ideia inicial era
um campo de comentários. No celular, porém, digitar a mesma frase em todo pedido é lento e
gera textos inconsistentes ("s/ farofa", "sem farofa", "tirar farofa").

## Decisão

Cada item do pedido terá:

- **Ajustes rápidos**: opções cadastradas pelo dono (ex.: "Sem farofa", "Farofa → Salada",
  "Sem feijão"), exibidas como botões de liga/desliga. Um toque cada.
- **Observação livre** opcional, para o que fugir do padrão.

Os ajustes são gravados como snapshot no item (como o preço, ver 0012) e aparecem em
destaque no ticket da cozinha.

## Alternativas consideradas

- **Só texto livre** — mais simples, porém mais lento e sem dados estruturados.

## Consequências

- Pedidos mais rápidos no balcão e mais legíveis na cozinha.
- O dashboard pode mostrar as trocas mais frequentes.
- Os ajustes são gratuitos no MVP. Ajustes com custo adicional exigiriam um novo ADR.
