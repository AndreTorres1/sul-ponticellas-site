# Sul Ponticellas Site

Site bilingue PT/ES para Sul Ponticellas, com formulário de reserva, agenda, avaliações moderadas e painel admin com registo de alterações.

## Local

```bash
npm start
```

Depois abre:

- Site: `http://127.0.0.1:3010`
- Admin: `http://127.0.0.1:3010/admin.html`

O token admin local aparece no terminal ao iniciar o servidor.

## Admin

O painel aceita o `ADMIN_TOKEN` principal e tokens individuais da equipa. Todas as alterações de eventos, pedidos e avaliações ficam registadas em `data/activity-log.csv`, um ficheiro privado que abre no Excel e não é servido publicamente.

Para definir tokens individuais sem expor segredos no GitHub, usa hashes SHA-256 em `TEAM_TOKEN_HASHES`:

```json
[
  { "name": "Paula", "role": "member", "hash": "hash_sha256_do_token" }
]
```

O token principal pode descarregar o registo no painel admin. Tokens de equipa podem gerir eventos; pedidos e moderação de avaliações ficam reservados ao acesso principal.

## Deploy

Este projeto está preparado para Render com `render.yaml`.

Variáveis usadas em produção:

- `HOST=0.0.0.0`
- `ADMIN_TOKEN`: token secreto para entrar no painel admin.
- `TEAM_TOKEN_HASHES`: lista JSON opcional com tokens individuais em formato hash.

As avaliações entram como pendentes e só ficam públicas quando forem aprovadas no admin.
