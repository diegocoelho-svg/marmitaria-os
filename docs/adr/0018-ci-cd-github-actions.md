# 0018 — CI/CD com GitHub Actions e imagens no GHCR

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Queremos um pipeline completo que garanta qualidade em todo PR e entregue em produção de
forma repetível, independente de onde a produção esteja (0017).

## Decisão

**CI (todo pull request)**

1. Instalar dependências (pnpm, com cache).
2. Lint e formatação (Biome).
3. Typecheck de todos os pacotes.
4. Testes unitários.
5. Testes de integração e E2E de API, com Postgres como service container.
6. E2E Playwright nos quatro viewports, com o relatório publicado como artefato.
7. Build das imagens Docker (sem publicar).

**CD (merge na `main`)**

1. Build e push das imagens para o **GHCR**, com a tag do SHA do commit (+ `latest`).
2. Deploy no environment `staging`; em `production`, com **aprovação manual** (GitHub
   Environments).
3. O deploy executa as migrations e depois `docker compose pull && docker compose up -d`:
   - **VPS:** via SSH a partir do runner;
   - **servidor caseiro:** via **self-hosted runner** na própria máquina (sem expor SSH).
4. Smoke test em `GET /health`. Se falhar, rollback para a tag anterior.

A branch `main` é protegida: merge só via PR com CI verde.

## Consequências

- A imagem é o artefato de deploy; trocar de infraestrutura muda só o passo final.
- Os segredos (SSH, banco) ficam nos GitHub Environments, nunca no repositório.
