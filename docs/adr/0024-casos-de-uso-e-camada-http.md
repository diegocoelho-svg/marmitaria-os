# 0024 — Casos de uso, camada HTTP e erros da API

- **Status:** Aceito
- **Data:** 2026-10-19

## Contexto

Com a persistência pronta (0023), a API passa a expor os cadastros: pratos, ajustes rápidos,
preços por tamanho, cardápios e cardápio do dia. Falta decidir como os casos de uso recebem
suas dependências, como as rotas HTTP são declaradas, como erros viram respostas e como
operações com mais de uma gravação ficam atômicas. O 0014 prevê ajustes cadastrados pelo
dono, mas o domínio só tinha o snapshot gravado no pedido.

## Decisão

**Casos de uso.** Uma classe por caso de uso em `application/use-cases/<feature>`, com um
único método `execute`. Entradas e saídas ficam em `application/dtos/<feature>`; a saída é
montada por `XOutput.from(entidade)`, com instantes em ISO 8601. O caso de uso recebe pelo
construtor só o que usa.

**Portas da aplicação** (`application/ports`):

- `Clock` e `IdGenerator`, para que o relógio e os ids continuem fora do domínio e os casos
  de uso sejam testáveis;
- `UnitOfWork.run(repos => ...)`, implementada com `db.transaction` e
  `setupRepositories(tx)`. Usada quando um caso de uso grava mais de uma vez, como trocar o
  preço de um tamanho (fecha o vigente e abre o novo);
- `EventBus.publish(eventos)`, com implementação em memória (0011). Os eventos são
  publicados depois da gravação, e a falha de um assinante é registrada sem afetar a
  resposta.

**Ajustes rápidos.** `AdjustmentEntity` (rótulo de 1 a 60 caracteres e ativo/inativo), com
lista única para todos os pratos. A observação livre continua no item do pedido.

**Rotas.** Controllers são classes com os decorators `@Controller(prefixo)` e
`@Route(método, caminho, schema)`, registradas por `registerControllers` sob `/api` (0020).
O schema usa os contratos Zod de `@marmitaria/contracts` (0009) via
`fastify-type-provider-zod`: a entrada é validada, a saída é serializada pelo schema da
resposta, e o decorator confere em tempo de compilação se a assinatura do método bate com o
schema. Os decorators usam `experimentalDecorators`, porque os decorators do padrão TC39 não
rodam no Vitest; não há `reflect-metadata` nem cast.

**Erros.** O corpo é sempre `{ code, message }`.

| Situação | Status |
|---|---|
| Formato inválido (schema) | 400 |
| Registro do caminho inexistente (`NotFoundError`) | 404 |
| Conflito (`ConflictError`, `StaleWriteError`) | 409 |
| Regra violada (`DomainError`, `BusinessRuleError`) | 422 |
| Qualquer outro erro | 500, com log e mensagem genérica |

Os erros da aplicação ficam em `application/errors`, um arquivo por erro, estendendo
`NotFoundError`, `ConflictError` ou `BusinessRuleError`. As regras entre agregados são
verificadas no caso de uso e, numa corrida, o repositório traduz a violação da constraint
para o mesmo erro: nome de cardápio ativo repetido vira `MenuNameTakenError` e data repetida
vira `DailyMenuDateTakenError`. Isso ajusta o 0023, que deixava toda violação subir como
erro do driver.

**Testes.** Casos de uso com repositórios em memória (`test/fakes`), que guardam cópias das
entidades, como o banco. Rotas com `app.inject` contra o Postgres real.

## Alternativas consideradas

- **Plugins de rota com handlers inline** — tipagem direta do Fastify, mas cada feature
  monta suas rotas de um jeito e os casos de uso ficam espalhados em closures.
- **Decorators TC39** — padrão da linguagem, mas o Vitest (oxc) não os transforma.
- **Mocks com `vi.fn` nos testes de caso de uso** — menos código, mas os testes passam a
  descrever chamadas em vez de estado.
- **Ajustes por prato** — mais preciso, com uma tabela de vínculo e mais um passo no
  cadastro sem necessidade hoje.

## Consequências

- Uma rota nova é um método com `@Route` e um schema em `contracts`; o compilador acusa
  divergência entre os dois.
- A API continua sem autenticação; o tema terá decisão própria.
- O cardápio do dia ainda aceita a última gravação entre edições simultâneas.
