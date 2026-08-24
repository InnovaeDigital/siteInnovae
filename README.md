# Innovae Digital

Sistema de orçamentos, usuários e acompanhamento de cliente.

## O que está pronto

- Cadastro e login de usuários.
- Criação e edição de orçamentos.
- Link público do cliente.
- Status de projeto, incluindo `PAGO`.
- Persistência única na nuvem via JSONBin.

## Estrutura principal

- `index.html` - painel interno.
- `cliente.html` - página pública do cliente.
- `api/[...path].js` - API serverless para produção.
- `server.js` - API local para desenvolvimento.

## Como publicar no GitHub

1. Faça o push destes arquivos:
- `index.html`
- `cliente.html`
- `api/[...path].js`
- `server.js`
- `package.json`
- `package-lock.json`
- `vercel.json`
- `README.md`
- `.gitignore`
- `manifest.webmanifest`
- `app-icon.svg`
- `logo-innovae.png`
- `logo-innovae (1).png`

2. Não envie:
- `node_modules/`
- `.env`
- arquivos de diagnóstico antigos já removidos

## Como publicar na Vercel

1. Importe o repositório no Vercel.
2. Configure as variáveis de ambiente:

```env
JSONBIN_BIN_ID=6a8c3f21da38895dfe0a8282
JSONBIN_MASTER_KEY=...
```

3. Faça deploy.
4. Abra a URL publicada.

## Teste rápido

- Acesse `https://sua-url.vercel.app/api/health`
- Se responder `OK`, a API está no ar.
- Depois teste:
  - criar usuário
  - salvar orçamento
  - abrir link do cliente

## Rodando localmente

```bash
npm install
npm start
```

Depois abra:

- `http://localhost:3000`

## Observação

- O sistema não usa mais MongoDB.
- Os dados importantes ficam somente na nuvem.
- O navegador guarda apenas preferências leves de sessão.
