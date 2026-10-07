# 0017 — Infraestrutura agnóstica com Docker Compose

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

O sistema deve rodar igual em um servidor em casa, numa VPS ou numa nuvem, sem reescrita.
Também existe o risco de a internet da loja cair no horário de pico, o que faria o
atendente voltar para o papel.

## Decisão

- Aplicação **12-factor**: toda configuração por variáveis de ambiente, logs em stdout e
  processos sem estado.
- Imagens Docker para `api` e `web`. O **Docker Compose** orquestra:
  `caddy` (reverse proxy + HTTPS automático) · `web` · `api` · `postgres`.
- O mesmo `docker compose up` roda em:
  - **servidor caseiro / mini PC**, exposto via Cloudflare Tunnel ou Tailscale (sem abrir
    portas nem precisar de IP fixo);
  - **qualquer VPS** (Hetzner, DigitalOcean, Oracle, Magalu Cloud…);
  - **nuvem gerenciada**, trocando apenas variáveis (ex.: Postgres gerenciado).
- Backup diário do Postgres (`pg_dump`) para armazenamento externo.

## Em aberto

**Onde rodar a produção.** Um servidor **na própria loja** (rede local) mantém balcão e
cozinha funcionando mesmo sem internet, que só seria necessária para o WhatsApp. Já uma VPS
dispensa hardware local. A decisão será registrada em ADR próprio.

## Consequências

- Nenhuma dependência de provedor específico; o ambiente de dev é igual ao de produção.
- A operação (atualizações, backup, monitoramento) é responsabilidade nossa.
