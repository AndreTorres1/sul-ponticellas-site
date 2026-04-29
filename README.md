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

O painel aceita o `ADMIN_TOKEN` principal e tokens individuais da equipa. Todas as alterações de eventos, pedidos e avaliações podem ficar registadas numa Google Sheet privada. Se a Google Sheet ainda não estiver configurada, o backend usa `data/activity-log.csv` como fallback privado.

Para definir tokens individuais sem expor segredos no GitHub, usa hashes SHA-256 em `TEAM_TOKEN_HASHES`:

```json
[
  { "name": "Paula", "role": "member", "hash": "hash_sha256_do_token" }
]
```

O token principal pode abrir o Google Sheets privado no painel admin quando `GOOGLE_SHEETS_PRIVATE_URL` estiver configurado. Tokens de equipa podem gerir eventos; pedidos e moderação de avaliações ficam reservados ao acesso principal.

### Google Sheets privado

1. Cria uma Google Sheet privada chamada `Sul Ponticellas - Registo de Alterações`.
2. Abre `Extensões > Apps Script`.
3. Cola o conteúdo de `google-apps-script/audit-webhook.gs`.
4. Em `Definições do projeto > Propriedades do script`, cria:
   - `SHEET_ID`: o ID da Google Sheet.
   - `AUDIT_SECRET`: uma frase secreta longa.
5. Publica em `Implementar > Nova implementação > App da Web`.
6. No Render, adiciona:
   - `GOOGLE_SHEETS_AUDIT_URL`: URL da App da Web.
   - `GOOGLE_SHEETS_AUDIT_SECRET`: o mesmo valor de `AUDIT_SECRET`.
   - `GOOGLE_SHEETS_PRIVATE_URL`: link privado da Sheet para abrir pelo admin.

## Deploy

Este projeto está preparado para Render com `render.yaml`.

Variáveis usadas em produção:

- `HOST=0.0.0.0`
- `ADMIN_TOKEN`: token secreto para entrar no painel admin.
- `TEAM_TOKEN_HASHES`: lista JSON opcional com tokens individuais em formato hash.
- `GOOGLE_SHEETS_AUDIT_URL`: URL da App da Web no Google Apps Script.
- `GOOGLE_SHEETS_AUDIT_SECRET`: segredo partilhado com o Apps Script.
- `GOOGLE_SHEETS_PRIVATE_URL`: link privado da Google Sheet.

As avaliações entram como pendentes e só ficam públicas quando forem aprovadas no admin.
