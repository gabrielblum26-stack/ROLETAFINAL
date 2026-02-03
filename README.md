# Roleta (Sistema + Admin) — pronto para Vercel (Opção 1)

Este projeto roda **100% no Vercel** usando:
- **Next.js (App Router)**
- **API Routes Serverless** em `/app/api/*`
- **Postgres** (Neon/Supabase/etc) via `DATABASE_URL`

## 1) Rodar localmente

### Requisitos
- Node 18+
- Um Postgres (pode ser Neon/Supabase)

### Configurar env
```bash
cp .env.example .env.local
```

Edite `.env.local` e coloque:
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` (seed do admin)

### Instalar e rodar
```bash
npm i
npm run dev
```

Acesse: http://localhost:3000

> Na primeira chamada de API, o sistema cria a tabela `users` e faz seed do admin se não existir.

## 2) Subir no Vercel

1. Suba este repositório no GitHub
2. Import no Vercel
3. Em **Project Settings → Environment Variables**, crie:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
4. Deploy

## Rotas
- `/login` login único
- `/app` sistema (roleta)
- `/profile` perfil do usuário
- `/admin/users` CRUD usuários (somente admin)

## Observação
- Não usa SQLite (Vercel não suporta persistência local).
- Banco é Postgres via `DATABASE_URL`.


## Novidades
- Cadastro público em /register (não libera acesso automaticamente)
- Admin pode liberar Teste 2 dias ou +1 mês no painel /admin/users
- Expirado o acesso (trial/sub), o usuário é bloqueado automaticamente.
