# 0001 — Registrar decisões de arquitetura em ADRs

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

O projeto é ao mesmo tempo um sistema real (usado na marmitaria) e um projeto de portfólio.
O raciocínio por trás de cada escolha precisa ficar visível para quem avaliar o código, e
recuperável para nós mesmos daqui a alguns meses.

## Decisão

Toda decisão que afete arquitetura, stack, modelo de dados ou infraestrutura vira um ADR em
`docs/adr`, numerado sequencialmente, no formato de [`0000-template.md`](./0000-template.md).
ADRs não são editados depois de aceitos: uma mudança de ideia gera um novo ADR que
**substitui** o anterior.

Convenção de idioma: prosa em português; código, schema e rotas de API em inglês.

## Consequências

- Decisões ficam rastreáveis e revisáveis em PR.
- Exige disciplina de escrever o ADR junto com a mudança, não depois.
