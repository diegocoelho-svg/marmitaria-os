# 0002 — Problema, escopo do MVP e fases

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Hoje o atendente anota os pedidos presenciais num bloco de papel, destaca a folha e grita
para a cozinha. Ao mesmo tempo responde o WhatsApp manualmente e repete o processo.
Problemas: ponto único de falha, pedidos perdidos ou ilegíveis, nenhuma ordem clara de
preparo e nenhum dado sobre vendas. Não há consumo no local.

## Decisão

**MVP — fila de pedidos**

- Cadastro de pratos, tamanhos e preços (ver 0012).
- Cardápio do dia, com planejamento antecipado opcional (ver 0013).
- Tela do balcão: prato + tamanho + ajustes/observação + identificação → enviar.
  Meta: **2–3 toques por pedido**, ou o papel volta.
- Tela da cozinha: fila em tempo real com status
  `received → preparing → ready → delivered` (e `cancelled`).
- Pedido registra a **origem** (`counter` | `whatsapp`), preenchida manualmente no início.
- Senha diária sequencial (001, 002…) reiniciada a cada dia (fuso `America/Sao_Paulo`).

**Fase 2 — gestão**: dashboard e relatórios (pedidos, faturamento, ticket médio, vendas por
prato/tamanho/hora, trocas mais comuns), tempo médio de preparo, "acabou o prato".

**Fase 3 — WhatsApp**: pedidos recebidos pelo WhatsApp entram no sistema para confirmação
do atendente; aviso automático de pedido pronto.

**Fora de escopo:** pagamento online, delivery, estoque.

## Consequências

- O MVP substitui o papel sem mudar o fluxo do atendente, o que reduz resistência à adoção.
- O campo de origem desde o MVP evita migração quando a fase 3 chegar.
- Em aberto: registrar forma de pagamento (Pix/dinheiro/cartão) para o dashboard — depende
  de validação com o dono.
