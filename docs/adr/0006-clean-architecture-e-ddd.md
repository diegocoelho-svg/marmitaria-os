# 0006 — Clean Architecture + DDD, de forma pragmática

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

O domínio é pequeno, mas tem regras reais: transições de status do pedido, preço congelado
no momento da venda, cardápio por data e senha diária. Queremos demonstrar arquitetura sem
criar camadas que não carregam regra nenhuma.

## Decisão

Camadas em `apps/api/src`:

- `domain/` — entidades, value objects, agregados, eventos de domínio e interfaces (portas)
  de repositório. Sem dependências externas.
- `application/` — casos de uso (`CreateOrder`, `AdvanceOrderStatus`, `PublishDailyMenu`…),
  orquestrando domínio e portas.
- `infra/` — Drizzle, Fastify, SSE e adaptadores do event bus.
- `main/` — composição (injeção de dependências manual) e bootstrap.

Agregados iniciais:

- **Order** — itens, ajustes, observação, origem, senha, status e máquina de estados.
- **DailyMenu** — data e pratos disponíveis.
- **Dish** e **SizePrice** — catálogo e preços com vigência (ver 0012).

## Alternativas consideradas

- **MVC/transaction script** — mais rápido no início, mas espalharia as regras pelas rotas.
- **Hexagonal "completo"** com CQRS e event sourcing — complexidade sem retorno nesse domínio.

## Consequências

- O domínio é testável com testes unitários puros, sem banco nem HTTP.
- Regra de ouro: só criar uma abstração quando ela isola uma dependência real ou carrega regra.
