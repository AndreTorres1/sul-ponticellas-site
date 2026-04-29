# Sul Ponticellas Site

Site bilingue PT/ES para Sul Ponticellas, com formulário de reserva, agenda, avaliações moderadas e painel admin.

## Local

```bash
npm start
```

Depois abre:

- Site: `http://127.0.0.1:3010`
- Admin: `http://127.0.0.1:3010/admin.html`

O token admin local aparece no terminal ao iniciar o servidor.

## Deploy

Este projeto está preparado para Render com `render.yaml`.

Variáveis usadas em produção:

- `HOST=0.0.0.0`
- `ADMIN_TOKEN`: token secreto para entrar no painel admin.

As avaliações entram como pendentes e só ficam públicas quando forem aprovadas no admin.
