# 0008 — TanStack Router e TanStack Query no frontend

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

O front tem rotas por papel (balcão, cozinha, admin) e um dashboard guiado por filtros
(período, prato, tamanho), que precisam viver na URL para serem compartilháveis e
sobreviver a um recarregamento. O estado é majoritariamente **estado do servidor**
(pedidos, cardápio), atualizado em tempo real.

## Decisão

- **TanStack Router** para o roteamento, com rotas baseadas em arquivo.
- **TanStack Query** para o estado do servidor.

Por quê:

- Rotas, params e **search params totalmente tipados**: link para rota inexistente é erro de
  compilação; filtros do dashboard são validados com os mesmos schemas Zod do projeto (0009).
- Loaders das rotas integram com o Query (`ensureQueryData`), evitando cascatas de requisições.
- O Query cuida de cache, loading/erro, retry, invalidação após mutações e **atualização
  otimista** (o pedido aparece no balcão antes da resposta). Eventos SSE (0010) atualizam
  ou invalidam o cache.

## Alternativas consideradas

- **React Router v7** — mais difundido e já conhecido, mas a tipagem de search params é
  manual (strings soltas).
- **SWR** — mais leve, com suporte mais fraco a mutações e atualização otimista.
- **RTK Query** — exige adotar Redux.
- **fetch + useEffect** — reimplementar cache, retry e deduplicação à mão.

## Consequências

- Curva de aprendizado do TanStack Router (codegen da árvore de rotas).
- O estado global de cliente fica mínimo; se surgir necessidade, avaliar Zustand.
