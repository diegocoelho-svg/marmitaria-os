# 0019 — Lint e formatação com ESLint + Prettier

- **Status:** Aceito
- **Data:** 2026-10-08

## Contexto

O 0004 previa o **Biome** para lint e formatação. Ao montar o esqueleto do monorepo, o
binário nativo do Biome foi bloqueado pelo Controle de Aplicativo do Windows (Smart App
Control), por não ser assinado. Liberá-lo exigiria desativar essa proteção na máquina de
desenvolvimento, o que não compensa só por causa de uma ferramenta de lint.

## Decisão

Substituir o Biome por **ESLint** (flat config) + **typescript-eslint** para lint e
**Prettier** para formatação, com `eslint-config-prettier` desligando as regras de estilo
que conflitam com o formatador.

- Configuração na raiz do monorepo (`eslint.config.js` e `.prettierrc.json`), valendo para
  todos os pacotes.
- O TypeScript fica na **6.0**, a maior versão suportada hoje pelo typescript-eslint.

## Alternativas consideradas

- **Manter o Biome via WSL ou Docker** — funciona, mas tira o lint do fluxo normal do editor.
- **Manter o Biome e desativar o Smart App Control** — reduz a segurança da máquina.

## Consequências

- Ferramentas em JavaScript puro, que rodam em qualquer sistema sem binários nativos.
- Ecossistema maior de plugins (React Hooks, TanStack Query).
- Lint e formatação ficam mais lentos que com o Biome, o que é irrelevante neste tamanho de
  projeto.
- Substitui as menções ao Biome no 0004 e no 0018; o restante desses ADRs segue válido.
