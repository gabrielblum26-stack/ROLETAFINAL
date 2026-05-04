# 🚀 Guia de Deployment - Roleta Atualizada

## ✅ O que foi feito

1. **App Atualizado** - Integrada a versão mais recente do app (Roleta-Atualizada-2026)
2. **Sistema de Proteção** - Mantido o sistema de login/autenticação com JWT
3. **CSS Redesenhado** - Aplicado o novo layout moderno do app atualizado
4. **Banco de Dados** - Configurado com Neon PostgreSQL
5. **Admin Único** - Criado usuário administrador único

## 📋 Credenciais

- **Usuário:** cleber
- **Senha:** padraofifa
- **Role:** admin

## 🔧 Configuração Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente já estão em .env.local
# DATABASE_URL: postgresql://neondb_owner:npg_n7KBqfc5uTHl@ep-ancient-poetry-ahwyd85d-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
# JWT_SECRET: roleta-super-secret-key-2026-cleber-admin
# ADMIN_USERNAME: cleber
# ADMIN_PASSWORD: padraofifa

# 3. Rodar localmente
npm run dev
```

Acesse: http://localhost:3000

## 🌐 Deploy no Vercel

### Passo 1: Preparar o repositório
```bash
git add .
git commit -m "Roleta atualizada com novo app e proteção"
git push origin main
```

### Passo 2: Importar no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione o repositório GitHub
4. Configure as variáveis de ambiente:

```
DATABASE_URL=postgresql://neondb_owner:npg_n7KBqfc5uTHl@ep-ancient-poetry-ahwyd85d-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=roleta-super-secret-key-2026-cleber-admin
ADMIN_USERNAME=cleber
ADMIN_PASSWORD=padraofifa
NEXT_PUBLIC_API_BASE=
```

5. Clique em "Deploy"

## 📁 Estrutura do Projeto

```
ROLETAFINAL/
├── app/
│   ├── api/                    # APIs serverless
│   ├── admin/                  # Painel administrativo
│   ├── app/                    # App principal (roleta)
│   ├── login/                  # Página de login
│   ├── register/               # Página de registro
│   ├── profile/                # Perfil do usuário
│   ├── contador/               # Contador
│   ├── estrategias/            # Estratégias
│   ├── keyboard/               # Teclado
│   ├── state/                  # AuthProvider
│   ├── lib/                    # Utilitários
│   ├── components/             # Componentes React
│   ├── globals.css             # Estilos globais (redesenhado)
│   └── layout.tsx              # Layout raiz com AuthProvider
├── public/                     # Arquivos estáticos
├── scripts/
│   └── init-db.js             # Script de inicialização do BD
├── .env.local                  # Variáveis de ambiente
├── package.json
└── tsconfig.json
```

## 🔐 Segurança

- ✅ Autenticação JWT com 12h de expiração
- ✅ Senhas com hash bcryptjs (10 rounds)
- ✅ Sessão única por usuário
- ✅ Bloqueio automático de usuários expirados
- ✅ Proteção de rotas com middleware de autenticação

## 🎨 Novo Design

O CSS foi completamente redesenhado com:
- Tema escuro moderno (#121212)
- Painel com bordas arredondadas (18px)
- Cores vibrantes para seleção (15 cores primárias)
- Animações suaves
- Layout responsivo

## 📞 Suporte

Para mais informações sobre o app, consulte o README.md original.

---

**Última atualização:** 04/05/2026
**Versão:** 2.2.0
