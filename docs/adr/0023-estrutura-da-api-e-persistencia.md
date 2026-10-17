# 0023 — Estrutura da API no padrão sw-retina e persistência com Drizzle

- **Status:** Aceito
- **Data:** 2026-10-17

## Contexto

O 0006 definiu as camadas com `infra/` e `main/`, e o 0007 escolheu Drizzle. Ao ligar o
banco, a API passa a ter repositórios, schema, migrations e composição. Queremos seguir a
estrutura do `sw-retina-apis` (`apps/web-api`), já conhecida por quem mantém o projeto, mas
com Drizzle no lugar do Kysely e sem o container global de DI de lá, que guarda tudo como
`unknown` e devolve com cast.

## Decisão

Este ADR ajusta a organização de pastas do 0006; as camadas e os agregados continuam valendo.

**Pastas** em `apps/api/src`:

- `domain/` — como no 0022, mais as interfaces de repositório em `domain/repositories/`.
- `application/use-cases/<feature>` e `application/dtos/<feature>` — entram com os casos de
  uso.
- `infrastructure/http` (Fastify), `infrastructure/config` (env e logger),
  `infrastructure/database/postgresql` (schema, mappers e repositórios `Pg*`),
  `infrastructure/bootstrap` e `infrastructure/container`.
- `server.ts` e `migrate.ts` na raiz de `src`, como pontos de entrada.

Imports usam o alias `@/` (`@/domain/...`). Testes ficam ao lado do código: `*.spec.ts` são
unitários e rodam em `pnpm test`; `*.int.spec.ts` usam um Postgres real e rodam em
`pnpm test:integration`, em série, num banco cujo nome termina em `_test`.

**Composição.** `setupRepositories(executor)` devolve um objeto tipado com os repositórios, e
`createContainer` junta banco e repositórios. Não há registro global nem cast.

**Migrations.** Geradas pelo `drizzle-kit` em `apps/api/drizzle/` e aplicadas por um passo
separado (`node dist/migrate.js`), nunca no boot da API. No Compose, o serviço `migrate` roda
antes da API, que só sobe se ele terminar com sucesso, como prevê o deploy do 0018.

**Persistência.**

- Centavos, quantidade e senha são `bigint`, porque o domínio aceita qualquer inteiro seguro.
- Coleções do agregado (pratos do cardápio, itens e ajustes do pedido) são tabelas filhas
  com `position`, gravadas na mesma transação que o pai e lidas numa única consulta.
- As regras entre agregados do 0022 são constraints: nome de cardápio ativo único (pela
  chave normalizada do domínio), um cardápio por data, senha única por dia e vigências de
  preço sem sobreposição (`EXCLUDE` com `btree_gist`, numa migration escrita à mão).
- Gravações sobre um estado lido antes são condicionais: o pedido só muda se o status no
  banco ainda for o que foi lido, o cardápio só muda se ainda estiver ativo e o preço só
  fecha se ainda estiver aberto. Se nenhuma linha mudar, o repositório lança
  `StaleWriteError`, definido no domínio junto às portas.
- Busca sem resultado devolve `null`. Violação de constraint sobe como erro do driver; a
  tradução para erro de aplicação entra com os casos de uso. Linha que o domínio recusa ao
  reconstruir vira `CorruptedRecordError`, com o erro de domínio como causa.

## Alternativas consideradas

- **Manter `infra/` e `main/`** — funciona, mas diverge do padrão usado nos outros projetos.
- **Copiar o container do retina** — mesma ergonomia, ao custo de `unknown`, cast e estado
  global.
- **Migrations no boot da API** — impossível esquecer, mas uma migration quebrada derruba a
  API e várias instâncias disputariam a mesma migration.
- **Ajustes do item em `jsonb`** — menos tabelas, mas a unicidade por item e as outras
  garantias de estrutura exigiriam validação à parte; na tabela filha elas são chaves e
  constraints.
- **Coluna `version` em cada agregado** — detecta edições concorrentes mesmo sem mudança de
  status, mas exige carregar a versão lida nos contratos de leitura e gravação.

## Consequências

- A migration de vigências é escrita à mão e precisa ser revista quando `size_prices` mudar.
- Duas edições simultâneas de um cardápio ativo ainda ficam com a última gravação; uma
  coluna de versão entra se isso virar problema.
- Operações que envolvem mais de um repositório ainda não são atômicas; uma Unit of Work entra
  com o primeiro caso de uso que precisar.
- Os testes de integração criam o banco de teste se ele não existir, aplicam as migrations e
  limpam as tabelas antes de cada teste.
