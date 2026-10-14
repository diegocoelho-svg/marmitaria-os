# 0021 — Cardápios cadastráveis, copiados para o cardápio do dia

- **Status:** Aceito
- **Data:** 2026-10-10

## Contexto

O 0013 previa montar o cardápio de cada data prato a prato, com cópia entre datas. Na
prática, a marmitaria repete poucas combinações de pratos ao longo das semanas. Montar o dia
do zero, ou procurar a data certa para copiar, é mais lento do que escolher uma combinação
conhecida.

## Decisão

- **Menu** é um cadastro permanente e ilimitado de cardápios ("Cardápio A", "Feijoada de
  sexta"…), com nome e pratos. O nome é único entre os cardápios ativos, sem diferenciar
  maiúsculas de minúsculas.
- **DailyMenu** associa uma **data** a uma **cópia** dos pratos do cardápio escolhido e guarda
  a origem (`sourceMenuId`, o último cardápio aplicado). Há no máximo um cardápio por data, e
  ele sempre parte de um cardápio cadastrado.
- Ajustar os pratos do dia não altera o cardápio de origem. Editar o cardápio de origem não
  altera os dias já definidos. Aplicar um cardápio de novo ao mesmo dia substitui a cópia,
  descartando ajustes locais.
- Cardápios não são excluídos, são **arquivados**: deixam de poder ser escolhidos e editados,
  mas os dias que vieram deles continuam válidos. Não há desarquivamento.
- O cardápio do dia guarda os ids dos pratos; nomes históricos de venda ficam no snapshot do
  pedido (0012).
- Seguem valendo do 0013: planejamento para datas futuras; datas tratadas como data local
  (`America/Sao_Paulo`), sem hora; o balcão mostra o cardápio da data corrente e orienta a
  definir um quando não houver; cardápio de data passada não pode ser criado nem alterado;
  "esgotado" no dia fica para a fase 2.

## Alternativas consideradas

- **O dia apenas referencia o cardápio** — editar o cardápio reescreveria os dias passados e
  impediria ajustes só do dia.
- **Versionar os cardápios** — rastreabilidade exata da origem, com custo de versionamento e
  persistência sem necessidade no escopo atual.

## Consequências

- Escolher o cardápio do dia vira um toque; o histórico de cada dia fica protegido pela cópia.
- Unicidade de nome e de cardápio por data são regras entre agregados: verificadas nos casos
  de uso e garantidas por constraints no banco.
- Substitui o 0013.
