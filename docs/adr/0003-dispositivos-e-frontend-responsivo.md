# 0003 — Uma única SPA React responsiva (PWA) para todos os dispositivos

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

O sistema precisa funcionar sem erros em quatro tipos de dispositivo, nesta prioridade:
**web (desktop) → mobile → tablet → TV**. A TV ainda não existe na cozinha; é uma
possibilidade futura (qualquer navegador fixo na parede).

| Dispositivo | Papel principal | Requisitos |
|---|---|---|
| Web | Balcão e administração | Atalhos de teclado |
| Mobile | Balcão (celular do atendente) | Uso com uma mão, alvos de toque grandes |
| Tablet | Balcão ou cozinha | Layout intermediário |
| TV | Cozinha (somente leitura) | Fonte grande, alto contraste, sem interação, reconexão automática |

## Decisão

- **Uma aplicação** React + TypeScript (Vite), com rotas por papel: `/balcao`, `/cozinha`,
  `/admin`. Sem apps separados por dispositivo.
- Layout responsivo mobile-first, com breakpoints que incluem uma faixa específica para TV
  (telas ≥ 1920px vistas à distância, sem hover nem foco por teclado).
- Distribuída como **PWA**: instalável no celular e no tablet sem loja de aplicativos.
- A tela da cozinha funciona em **modo kiosk**: sem ações obrigatórias, mantém a tela ativa
  (Wake Lock API quando disponível) e se recupera sozinha de quedas de rede (ver 0010).
- Cada viewport é coberto por testes E2E (ver 0015).

## Alternativas consideradas

- **Apps nativos / React Native** — custo de manter duas bases e publicar em lojas, sem
  ganho real para o caso de uso.
- **Apps web separados por papel** — duplicaria componentes, autenticação e build.

## Consequências

- Um só deploy atende todos os dispositivos.
- Exige disciplina de testar cada tela nos quatro viewports.
- Alternativa futura para a cozinha: impressora térmica de tickets, integrável como mais um
  consumidor dos eventos de pedido.
