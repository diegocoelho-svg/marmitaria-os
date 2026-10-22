# 0027 — Autenticação por usuário e senha com sessão em cookie

- **Status:** Aceito
- **Data:** 2026-10-21

## Contexto

A API ficou aberta até aqui (0024, 0026). O piloto vai rodar exposto na internet por um
túnel, então qualquer pessoa com a URL conseguiria criar pedidos, mudar preços ou acompanhar
a fila. A equipe é pequena: quem administra cadastra cardápios e preços; o resto da equipe
registra e acompanha pedidos no balcão, no celular, no tablet ou na TV da cozinha (0003). A
tela da cozinha fica aberta o dia inteiro e o stream de eventos (0010) usa `EventSource`, que
não envia o cabeçalho `Authorization`.

## Decisão

**Usuário e senha por pessoa.** Tabela `users` com `username` único (minúsculo, de 3 a 32
caracteres entre letras, números, `.`, `_` e `-`), nome, papel, ativo e hash da senha. A
senha tem de 8 a 256 caracteres e é guardada com `scrypt` (`node:crypto`), com salt próprio
e comparação em tempo constante. O login responde igual para usuário inexistente, inativo
ou senha errada. Quando o usuário não existe, a senha é conferida contra um hash preparado
na subida da API, para o tempo de resposta não revelar quem tem conta.

**Dois papéis.**

| Papel | Pode |
|---|---|
| `admin` (Administrador) | Tudo, inclusive pratos, ajustes, preços, cardápios e cardápio do dia |
| `staff` (Equipe) | Ler o catálogo e o cardápio do dia, registrar e listar pedidos, mudar o status (inclusive cancelar) e receber os eventos |

Pode haver mais de um administrador; não existe a figura de "dono".

**Sessão no banco, token no cookie.** No login, a API gera 32 bytes aleatórios e grava em
`sessions` apenas o SHA-256 deles. O token vai no cookie `marmitaria_session`, com
`HttpOnly`, `SameSite=Strict`, `Path=/api` e `Secure` (desligável por
`SESSION_COOKIE_SECURE=false` para testar pela rede local sem HTTPS). Como web e API estão
no mesmo domínio (0020), o navegador envia o cookie também no `EventSource`.

A sessão vale 30 dias e é renovada com o uso, no máximo uma vez por dia, para não gravar no
banco a cada requisição. A renovação só grava se a validade ainda for a que foi lida, então
requisições simultâneas renovam uma vez só. O cookie renovado também sai na resposta do
stream de eventos. Assim a TV da cozinha não cai, e um aparelho esquecido por um mês
pede login de novo. Sessão vencida é apagada quando aparece. Usuário inativo perde o acesso
na hora, mesmo com sessão aberta.

**Rotas protegidas por padrão.** `@Route` ganhou a opção `access`: `'user'` (padrão),
`'admin'` ou `'public'`. Uma rota nova sem a opção exige login. São públicas só
`GET /health`, `POST /auth/login` e `POST /auth/logout`. Sem sessão a resposta é 401
(`auth.unauthenticated`) e com papel insuficiente, 403 (`auth.forbidden`).

**Escritas só do próprio site.** Além do `SameSite`, requisições `POST`, `PUT`, `PATCH` e
`DELETE` com `Origin` de outro site recebem 403 (`request.cross_site`). Com `PUBLIC_ORIGIN`
configurado, a origem precisa ser exatamente essa, com esquema e porta. Sem ele, como no
desenvolvimento, basta o host bater com o da requisição, já que atrás do túnel a API não
sabe se o navegador usou HTTPS.

**Primeiro administrador por comando.** `user:create-admin --username --name --password`
cria o usuário direto no banco. Nenhuma rota cria administradores sem login.

## Alternativas consideradas

- **JWT** — dispensa a consulta da sessão, mas não dá para revogar sem uma lista de bloqueio
  no banco, e guardado no navegador fica exposto a XSS.
- **Token no cabeçalho `Authorization`** — o `EventSource` não envia cabeçalhos, e o token
  teria que ir na URL do stream, aparecendo em log.
- **Aparelho autorizado em vez de pessoa** — mais rápido no balcão, mas não identifica quem
  fez o quê, e o login por pessoa já resolve o uso compartilhado.
- **PIN por pessoa sobre um aparelho autorizado** — bom para trocar de atendente rápido, mas
  exige cadastro de aparelhos e de PINs sem necessidade hoje.
- **Bloqueio após tentativas erradas** — atrás do túnel a API não vê o IP real, então o limite
  teria que ser por usuário, e qualquer pessoa conseguiria travar a conta de outra.

## Consequências

- Os testes de integração autenticam com uma sessão de administrador ou de equipe criada a
  cada teste.
- Não há limite de tentativas de login. Com o IP real do cliente disponível no deploy, entra
  um limite por IP.
- Um stream de eventos já aberto continua aberto se o usuário for desativado; ele perde o
  acesso na próxima conexão.
- Sessões vencidas que nunca voltam ficam na tabela até uma limpeza periódica.
- A gestão de usuários pelo administrador (criar, desativar, redefinir senha) e a troca da
  própria senha ficam para o próximo passo.
