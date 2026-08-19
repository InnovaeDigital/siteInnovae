# Integração MongoDB - Guia de Uso

## 📋 Requisitos

- Node.js 6.7 ou superior
- MongoDB conta e cluster configurados

## 🚀 Instalação

1. Instale as dependências:
```bash
npm install
```

2. As dependências instaladas são:
   - **express**: Framework web para Node.js
   - **mongodb**: Driver oficial do MongoDB para Node.js
   - **cors**: Middleware para CORS (requisições cross-origin)
   - **dotenv**: Gerenciamento de variáveis de ambiente

## 🔧 Configuração

A string de conexão já está configurada no arquivo `.env`:
```
MONGODB_URI=mongodb+srv://innovaedigitalmedia_db_user:XuXjCSu4rypz6Jxx@cluster0.cuhm6bt.mongodb.net/?appName=Cluster0
```

O usuário `innovaedigitalmedia_db_user` foi configurado como credencial principal de conexão.

## ▶️ Iniciar o Servidor

Para modo de desenvolvimento com auto-reload:
```bash
npm run dev
```

Para modo de produção:
```bash
npm start
```

O servidor iniciará em `http://localhost:3000`

## 📡 API Endpoints

### Health Check
- **GET** `/api/health`
  - Verifica se o servidor está rodando
  - Resposta: `{ status: 'OK', timestamp: '...' }`

### Orçamentos

#### Criar novo orçamento
- **POST** `/api/orcamentos`
- Body (JSON):
```json
{
  "cliente": "Nome do cliente",
  "descricao": "Descrição dos serviços",
  "valor": 1000.00,
  "servicos": ["design", "desenvolvimento"]
}
```

#### Obter todos os orçamentos
- **GET** `/api/orcamentos`
- Retorna array de todos os orçamentos

#### Obter um orçamento específico
- **GET** `/api/orcamentos/:id`
- Parâmetro: ID do orçamento (MongoDB ObjectId)

#### Atualizar orçamento
- **PUT** `/api/orcamentos/:id`
- Body: Campos a serem atualizados

#### Deletar orçamento
- **DELETE** `/api/orcamentos/:id`

## 📊 Estrutura do Documento no MongoDB

Cada orçamento armazenado terá:
```json
{
  "_id": "ObjectId",
  "cliente": "string",
  "descricao": "string",
  "valor": "number",
  "servicos": ["array de strings"],
  "dataCriacao": "ISO Date",
  "dataAtualizacao": "ISO Date",
  "status": "rascunho|enviado|aceito|rejeitado"
}
```

## 🔐 Segurança

- As credenciais estão no `.env` (não commitar no Git)
- CORS está habilitado para desenvolvimento
- Altere as credenciais em produção

## 📝 Exemplo de Uso com Fetch (Frontend)

```javascript
// Criar orçamento
async function criarOrcamento(dados) {
  const response = await fetch('http://localhost:3000/api/orcamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return await response.json();
}

// Obter orçamentos
async function obterOrcamentos() {
  const response = await fetch('http://localhost:3000/api/orcamentos');
  return await response.json();
}

// Atualizar orçamento
async function atualizarOrcamento(id, dados) {
  const response = await fetch(`http://localhost:3000/api/orcamentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return await response.json();
}

// Deletar orçamento
async function deletarOrcamento(id) {
  const response = await fetch(`http://localhost:3000/api/orcamentos/${id}`, {
    method: 'DELETE'
  });
  return await response.json();
}
```

## 🐛 Troubleshooting

- **Erro de conexão**: Verifique a string de conexão no `.env`
- **Porta já em uso**: Altere a variável `PORT` no `.env`
- **Módulo não encontrado**: Execute `npm install` novamente
