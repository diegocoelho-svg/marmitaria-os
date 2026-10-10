# 0020 — Rotas da API sob o prefixo `/api`

- **Status:** Aceito
- **Data:** 2026-10-10

## Contexto

Com o Docker Compose (0017), o Caddy passa a ser a única entrada: serve a web e repassa as
chamadas para a API no mesmo domínio. Ele precisa de um critério para separar as duas, e o
navegador ganha com front e API na mesma origem, sem CORS. Os ADRs 0010, 0016 e 0018 citam
rotas sem prefixo (`/orders`, `/events`, `/health`).

## Decisão

Todas as rotas HTTP da API ficam sob o prefixo **`/api`**, registrado na própria API
(`app.register(..., { prefix: '/api' })` na camada `infra/http`).

- O Caddy repassa `/api/*` para a API sem reescrever o caminho; o restante vai para a web.
- No desenvolvimento, o Vite repassa `/api` para a API, então o front usa os mesmos caminhos
  relativos nos dois ambientes.
- As rotas citadas nos ADRs anteriores passam a valer com o prefixo: `POST /api/orders`,
  `PATCH /api/orders/:id/status`, `GET /api/events` e `GET /api/health`. O restante desses
  ADRs segue válido.

## Alternativas consideradas

- **O Caddy remove o prefixo (`handle_path`)** — a API continua com `/orders`, mas os caminhos
  passam a ser diferentes com e sem o proxy, e o dev precisaria reproduzir a reescrita.
- **Subdomínio para a API (`api.exemplo.com`)** — exige CORS, um segundo certificado e
  configuração extra de DNS, sem ganho para um único cliente web.

## Consequências

- Os caminhos são idênticos no dev, no compose e em produção.
- O prefixo é detalhe de exposição HTTP: fica em `infra`, e domínio e casos de uso não o
  conhecem.
- Substitui os caminhos sem prefixo citados no 0010, 0016 e 0018.
