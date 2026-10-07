# 0005 — Backend em Node.js + TypeScript + Fastify

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

O backend precisa de uma API HTTP, de um canal de tempo real (ver 0010) e de boa integração
com validação por schema e logs estruturados.

## Decisão

Node.js (LTS) + TypeScript + **Fastify**.

## Alternativas consideradas

- **Express** — ecossistema enorme, mas sem validação por schema, tipagem fraca e menos
  performático.
- **NestJS** — impõe a própria arquitetura, que conflitaria com a Clean Architecture
  explícita que queremos demonstrar (0006).

## Consequências

- Logger Pino embutido (ver 0016), sistema de plugins com encapsulamento e boa performance.
- O Fastify fica restrito à camada de infraestrutura; domínio e casos de uso não importam
  nada dele.
