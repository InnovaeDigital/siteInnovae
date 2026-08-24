import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || '6a8c3f21da38895dfe0a8282';
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('./'));

const emptyStore = () => ({ users: [], quotes: [], materials: [], config: {} });
let store = emptyStore();

function normalizeUser(user) {
  return {
    login: String(user?.login || '').trim(),
    password: String(user?.password || ''),
    updatedAt: user?.updatedAt || new Date().toISOString()
  };
}

function serializeQuote(quote) {
  if (!quote) return quote;
  const { _id, ...data } = quote;
  return { ...data, id: String(_id ?? quote.id ?? '') };
}

function normalizeQuote(quote) {
  if (!quote) return quote;
  const { id, _id, ...data } = quote;
  return {
    ...data,
    id: String(id || _id || ''),
    dataCriacao: quote.dataCriacao || new Date().toISOString(),
    dataAtualizacao: new Date().toISOString()
  };
}

function jsonbinHeaders() {
  if (!JSONBIN_MASTER_KEY) {
    throw new Error('Credencial principal do JSONBin não configurada.');
  }
  return {
    'Content-Type': 'application/json',
    'X-Master-Key': JSONBIN_MASTER_KEY
  };
}

async function jsonbinRequest(method, path, body) {
  const response = await fetch(`${JSONBIN_BASE_URL}${path}`, {
    method,
    headers: jsonbinHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `JSONBin respondeu ${response.status}`);
  }
  return payload;
}

async function loadStore() {
  const payload = await jsonbinRequest('GET', `/b/${JSONBIN_BIN_ID}/latest`);
  const record = payload?.record || payload || {};
  store = {
    users: Array.isArray(record.users) ? record.users.map(normalizeUser) : [],
    quotes: Array.isArray(record.quotes) ? record.quotes.map((quote) => ({ ...quote, id: String(quote.id || quote._id || '') })) : [],
    materials: Array.isArray(record.materials) ? record.materials : [],
    config: record.config && typeof record.config === 'object' ? record.config : {}
  };
  return store;
}

async function saveStore() {
  await jsonbinRequest('PUT', `/b/${JSONBIN_BIN_ID}`, store);
}

function buildQuoteLookup(id) {
  return String(id || '').trim();
}

app.get('/api/health', async (req, res) => {
  try {
    await loadStore();
    res.json({
      status: 'OK',
      storage: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', storage: 'disconnected', erro: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    await loadStore();
    const approxBytes = Buffer.byteLength(JSON.stringify(store), 'utf8');
    const usedMB = approxBytes / (1024 * 1024);
    res.json({
      usedMB: Number(usedMB.toFixed(2)),
      totalMB: 1,
      percentage: Number(Math.min(100, usedMB * 100).toFixed(1)),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    await loadStore();
    res.json(store.users.map(normalizeUser));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    await loadStore();
    const user = normalizeUser(req.body);
    if (!user.login || !user.password) return res.status(400).json({ erro: 'Login e senha são obrigatórios' });
    const index = store.users.findIndex((item) => item.login === user.login);
    if (index >= 0) store.users[index] = user;
    else store.users.push(user);
    await saveStore();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.delete('/api/users/:login', async (req, res) => {
  try {
    await loadStore();
    const before = store.users.length;
    store.users = store.users.filter((user) => user.login !== req.params.login);
    await saveStore();
    res.json({ deleted: store.users.length < before });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    await loadStore();
    res.json(Array.isArray(store.materials) ? store.materials : []);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.put('/api/materials', async (req, res) => {
  try {
    await loadStore();
    store.materials = Array.isArray(req.body?.items) ? req.body.items : [];
    await saveStore();
    res.json({ items: store.materials });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post('/api/orcamentos', async (req, res) => {
  try {
    await loadStore();
    const quote = normalizeQuote(req.body);
    quote.id = randomUUID();
    quote.dataCriacao = new Date().toISOString();
    quote.dataAtualizacao = quote.dataCriacao;
    quote.status = quote.status || 'rascunho';
    store.quotes.unshift(quote);
    await saveStore();
    res.status(201).json({ mensagem: 'Orçamento criado com sucesso', id: quote.id });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/orcamentos', async (req, res) => {
  try {
    await loadStore();
    res.json(store.quotes.map(serializeQuote));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/orcamentos/:id', async (req, res) => {
  try {
    await loadStore();
    const quote = store.quotes.find((item) => String(item.id) === buildQuoteLookup(req.params.id));
    if (!quote) return res.status(404).json({ erro: 'Orçamento não encontrado' });
    res.json(serializeQuote(quote));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.put('/api/orcamentos/:id', async (req, res) => {
  try {
    await loadStore();
    const idx = store.quotes.findIndex((item) => String(item.id) === buildQuoteLookup(req.params.id));
    if (idx < 0) return res.status(404).json({ erro: 'Orçamento não encontrado' });
    const { _id, id, ...payload } = req.body || {};
    store.quotes[idx] = {
      ...store.quotes[idx],
      ...payload,
      id: store.quotes[idx].id,
      dataCriacao: store.quotes[idx].dataCriacao,
      dataAtualizacao: new Date().toISOString()
    };
    await saveStore();
    res.json({ mensagem: 'Orçamento atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.delete('/api/orcamentos/:id', async (req, res) => {
  try {
    await loadStore();
    const before = store.quotes.length;
    store.quotes = store.quotes.filter((item) => String(item.id) !== buildQuoteLookup(req.params.id));
    await saveStore();
    res.json({ mensagem: 'Orçamento deletado com sucesso', deleted: store.quotes.length < before });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post('/api/migrate-from-localstorage', async (req, res) => {
  try {
    await loadStore();
    const { quotes, materials, users } = req.body || {};
    const migrated = { quotes: 0, materials: 0, users: 0 };

    if (Array.isArray(quotes) && quotes.length) {
      const normalized = quotes.map((q) => ({
        ...q,
        id: String(q.id || randomUUID()),
        dataCriacao: q.dataCriacao || new Date().toISOString(),
        dataAtualizacao: q.dataAtualizacao || new Date().toISOString()
      }));
      store.quotes.push(...normalized);
      migrated.quotes = normalized.length;
    }

    if (Array.isArray(materials) && materials.length) {
      store.materials = [...new Set([...(store.materials || []), ...materials].map((item) => String(item).trim()).filter(Boolean))];
      migrated.materials = materials.length;
    }

    if (Array.isArray(users) && users.length) {
      const normalizedUsers = users.map(normalizeUser).filter((user) => user.login && user.password);
      for (const user of normalizedUsers) {
        const idx = store.users.findIndex((item) => item.login === user.login);
        if (idx >= 0) store.users[idx] = user;
        else store.users.push(user);
      }
      migrated.users = normalizedUsers.length;
    }

    await saveStore();
    res.json({ mensagem: 'Migração concluída com sucesso', dadosMigrados: migrated, total: migrated.quotes + migrated.materials + migrated.users });
  } catch (error) {
    res.status(500).json({ erro: error.message, detalhes: 'Erro durante a migração dos dados' });
  }
});

app.get('/api/export-all', async (req, res) => {
  try {
    await loadStore();
    res.json({
      timestamp: new Date().toISOString(),
      users: store.users,
      materials: store.materials,
      quotes: store.quotes,
      totalRecords: store.users.length + store.materials.length + store.quotes.length
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.delete('/api/clear-all', async (req, res) => {
  try {
    await loadStore();
    store = emptyStore();
    await saveStore();
    res.json({ message: 'Todos os dados foram removidos com sucesso', deleted: { orcamentos: true, materiais: true, usuarios: true } });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

export { app };

async function startServer() {
  try {
    await loadStore();
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`JSONBin ativo no bin ${JSONBIN_BIN_ID}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => process.exit(0));

if (process.env.VERCEL !== '1') {
  startServer();
}
