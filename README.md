# Innovae Digital

Gerador de orçamentos e consulta para clientes da Innovae Digital.

## O que o sistema faz

- Cria e edita orçamentos.
- Gera link de cliente.
- Permite status de projeto, incluindo `PAGO`.
- Salva usuários, orçamentos e materiais na nuvem via JSONBin.

## Estrutura

- `index.html` - painel principal e geração dos orçamentos.
- `cliente.html` - página pública de consulta do cliente.
- `server.js` - API local que conversa com o JSONBin.

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Configure o arquivo `.env` com:

```env
JSONBIN_BIN_ID=6a8c3f21da38895dfe0a8282
JSONBIN_MASTER_KEY=...
JSONBIN_ACCESS_KEY=...
PORT=3000
NODE_ENV=development
```

3. Inicie o servidor:

```bash
npm start
```

4. Abra:

- `http://localhost:3000`

## Deploy

- O projeto está pronto para publicar em GitHub e Vercel.
- Mantenha o `.env` fora do repositório.
- O backend depende apenas do JSONBin.

## Observação

- Não há mais ligação com MongoDB.
- Os dados importantes ficam na nuvem.
- O navegador guarda apenas preferências leves de sessão.
