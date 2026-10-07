# 0013 — Cardápio do dia com planejamento antecipado

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Os pratos variam ao longo da semana. Às vezes o dono define o cardápio pela manhã; outras
vezes já tem o planejamento da semana.

## Decisão

- **Dish** é um cadastro permanente (nome, descrição, ativo/inativo).
- **DailyMenu** associa uma **data** a um conjunto de pratos disponíveis.
- É possível criar cardápios para **datas futuras** (planejamento semanal) e **copiar** os
  de outra data ou semana.
- O balcão sempre mostra o cardápio da data corrente (`America/Sao_Paulo`). Se não houver
  cardápio, a tela orienta a montar um.
- Fase 2: marcar um prato como **esgotado** no dia, bloqueando-o no balcão.

## Consequências

- O mesmo modelo atende o uso diário e o planejado.
- Datas são tratadas como data local (sem hora), para evitar erros de virada de dia em UTC.
