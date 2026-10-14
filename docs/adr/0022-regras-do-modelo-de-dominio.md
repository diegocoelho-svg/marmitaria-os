# 0022 — Regras do modelo de domínio

- **Status:** Aceito
- **Data:** 2026-10-10

## Contexto

O 0006 define as camadas e os agregados, mas deixa em aberto como o domínio representa
tempo, erros, estados e reconstrução a partir do banco. Essas escolhas afetam todos os casos
de uso e adaptadores que vêm depois.

## Decisão

**Organização.** `apps/api/src/domain` é organizado por tipo: `entities/`, `value-objects/`,
`events/`, `errors/` e `shared/`. Nenhum arquivo do domínio importa application, infra, main
ou bibliotecas externas. Classes e arquivos levam o tipo no nome: `OrderEntity`
(`order-entity.ts`), `MoneyVO` (`money-vo.ts`), `OrderEmptyError` (`order-empty.error.ts`).

**Construção.** Entidades estendem `Entity<Props>` (ou `AggregateRoot<Props, Event>`, quando
registram eventos), guardam o estado em `props` protegido e o expõem por getters. Têm
construtor privado e duas fábricas:

- `create` aplica as regras da operação (ex.: data não pode ser passada) e registra eventos;
- `restore` reconstrói o estado persistido, valida apenas sua coerência e nunca registra
  eventos.

**Tempo e identidade.** O domínio nunca lê o relógio nem gera ids: `now` e `id` chegam por
parâmetro. Datas de negócio são `LocalDateVO` derivadas de `now` no fuso `America/Sao_Paulo`.

**Erros.** Cada regra tem sua classe de erro, um arquivo por erro, estendendo `DomainError`
com um `code` estável (ex.: `OrderInvalidTransitionError`, `order.invalid_transition`), sem
conhecimento de HTTP. A infra traduz o código.

**Imutabilidade.** Value objects são congelados na construção. Coleções e datas são copiadas
na entrada e na saída; o estado só muda pelos métodos das entidades. A proteção de `props` é a
do TypeScript (`protected`), sem casts no código de produção. Operações inválidas não
alteram estado nem registram eventos.

**Pedido.**

- Status `received → preparing → ready → delivered`; `cancelled` é possível a partir de
  `received`, `preparing` ou `ready`. `delivered` e `cancelled` são finais.
- Cada transição grava seu instante (`startedAt`, `readyAt`, `deliveredAt`, `cancelledAt`),
  sempre igual ou posterior ao anterior. Tempo de preparo é `readyAt - startedAt`.
- A senha pertence a um dia: o pedido guarda `businessDate`, que deve ser a data local da
  criação. A senha é única por `businessDate`.
- O item guarda snapshot de prato, tamanho, preço unitário, quantidade (≥ 1), ajustes e
  observação. O total do pedido é a soma dos itens; cancelados ficam fora do faturamento, mas
  mantêm seu total.

**Dinheiro e preço.** `MoneyVO` aceita apenas inteiros seguros em centavos, inclusive no
resultado das operações. Preço por tamanho e preço de item são sempre maiores que zero.

## Alternativas consideradas

- **Organização por agregado** (`order/`, `menu/`…) — mais coesa por assunto, mas esconde a
  distinção entre entidade e value object.
- **Campos privados nativos (`#campo`)** — protegem também em runtime, mas espalham um campo
  por atributo e fogem do padrão `Entity<Props>` usado nos outros projetos.
- **Um único `DomainError` diferenciado por `code`** — menos arquivos, mas o tipo do erro não
  aparece no código nem nos testes.
- **`Result<T, E>` em vez de exceções** — falhas explícitas no tipo, com cerimônia de
  propagação em toda operação.
- **Um único `advance()` para o status** — mais curto, mas esconde a intenção e representa mal
  o cancelamento.

## Consequências

- O domínio é testável sem banco, relógio ou HTTP.
- Regras entre agregados (cardápio por data, senha por dia, vigências sem sobreposição, prato
  ativo e presente no cardápio do dia) ficam nos casos de uso e em constraints do banco.
