import { randomUUID } from 'node:crypto';

const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || '6a8c3f21da38895dfe0a8282';
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';

const emptyStore = () => ({ users: [], quotes: [], materials: [], config: {} });
let store = emptyStore();

function normalizeUser(user) {
  return {
    login: String(user?.login || '').trim(),
    password: String(user?.password || ''),
    updatedAt: user?.updatedAt || new Date().toISOString()
  };
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

function serializeQuote(quote) {
  if (!quote) return quote;
  const { _id, ...data } = quote;
  return { ...data, id: String(_id ?? quote.id ?? '') };
}

function jsonbinHeaders() {
  if (!JSONBIN_MASTER_KEY) throw new Error('Credencial principal do JSONBin não configurada.');
  return { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_MASTER_KEY };
}

async function jsonbinRequest(method, path, body) {
  const response = await fetch(`${JSONBIN_BASE_URL}${path}`, {
    method,
    headers: jsonbinHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || payload?.error || `JSONBin respondeu ${response.status}`);
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

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  json(res, 404, { erro: 'Rota não encontrada' });
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/^\/api/, '') || '/';
    const method = req.method || 'GET';

    if (method === 'GET' && path === '/health') {
      await loadStore();
      return json(res, 200, {
        status: 'OK',
        storage: 'connected',
        timestamp: new Date().toISOString()
      });
    }

    if (method === 'GET' && path === '/stats') {
      await loadStore();
      const approxBytes = Buffer.byteLength(JSON.stringify(store), 'utf8');
      const usedMB = approxBytes / (1024 * 1024);
      return json(res, 200, {
        usedMB: Number(usedMB.toFixed(2)),
        totalMB: 1,
        percentage: Number(Math.min(100, usedMB * 100).toFixed(1)),
        updatedAt: new Date().toISOString()
      });
    }

    if (method === 'GET' && path === '/users') {
      await loadStore();
      return json(res, 200, store.users.map(normalizeUser));
    }

    if (method === 'POST' && path === '/users') {
      await loadStore();
      const body = await readJson(req);
      const user = normalizeUser(body);
      if (!user.login || !user.password) return json(res, 400, { erro: 'Login e senha são obrigatórios' });
      const index = store.users.findIndex((item) => item.login === user.login);
      if (index >= 0) store.users[index] = user;
      else store.users.push(user);
      await saveStore();
      return json(res, 201, user);
    }

    if (method === 'DELETE' && (path.startsWith('/users/') || path === '/users')) {
      await loadStore();
      const login = path === '/users'
        ? String(url.searchParams.get('login') || '')
        : decodeURIComponent(path.slice('/users/'.length));
      if (!login) return json(res, 400, { erro: 'Usuário não informado' });
      const before = store.users.length;
      store.users = store.users.filter((user) => user.login !== login);
      await saveStore();
      return json(res, 200, { deleted: store.users.length < before });
    }

    if (method === 'GET' && path === '/materials') {
      await loadStore();
      return json(res, 200, Array.isArray(store.materials) ? store.materials : []);
    }

    if (method === 'PUT' && path === '/materials') {
      await loadStore();
      const body = await readJson(req);
      store.materials = Array.isArray(body?.items) ? body.items : [];
      await saveStore();
      return json(res, 200, { items: store.materials });
    }

    const quoteIdFromQuery = String(url.searchParams.get('id') || '');

    if (method === 'GET' && path === '/orcamentos' && !quoteIdFromQuery) {
      await loadStore();
      return json(res, 200, store.quotes.map(serializeQuote));
    }

    if (method === 'POST' && path === '/orcamentos') {
      await loadStore();
      const body = normalizeQuote(await readJson(req));
      body.id = randomUUID();
      body.dataCriacao = new Date().toISOString();
      body.dataAtualizacao = body.dataCriacao;
      body.status = body.status || 'rascunho';
      store.quotes.unshift(body);
      await saveStore();
      return json(res, 201, { mensagem: 'Orçamento criado com sucesso', id: body.id });
    }

    if (path.startsWith('/orcamentos/') || (path === '/orcamentos' && quoteIdFromQuery)) {
      await loadStore();
      const id = quoteIdFromQuery || decodeURIComponent(path.slice('/orcamentos/'.length));
      const index = store.quotes.findIndex((item) => String(item.id) === id);

      if (method === 'GET') {
        if (index < 0) return json(res, 404, { erro: 'Orçamento não encontrado' });
        return json(res, 200, serializeQuote(store.quotes[index]));
      }

      if (method === 'PUT') {
        if (index < 0) return json(res, 404, { erro: 'Orçamento não encontrado' });
        const body = await readJson(req);
        const { _id, id: bodyId, ...payload } = body || {};
        store.quotes[index] = {
          ...store.quotes[index],
          ...payload,
          id: store.quotes[index].id,
          dataCriacao: store.quotes[index].dataCriacao,
          dataAtualizacao: new Date().toISOString()
        };
        await saveStore();
        return json(res, 200, { mensagem: 'Orçamento atualizado com sucesso' });
      }

      if (method === 'DELETE') {
        const before = store.quotes.length;
        store.quotes = store.quotes.filter((item) => String(item.id) !== id);
        await saveStore();
        return json(res, 200, { mensagem: 'Orçamento deletado com sucesso', deleted: store.quotes.length < before });
      }
    }

    if (method === 'POST' && path === '/migrate-from-localstorage') {
      await loadStore();
      const body = await readJson(req);
      const { quotes, materials, users } = body || {};
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
      return json(res, 200, { mensagem: 'Migração concluída com sucesso', dadosMigrados: migrated, total: migrated.quotes + migrated.materials + migrated.users });
    }

    if (method === 'GET' && path === '/export-all') {
      await loadStore();
      return json(res, 200, {
        timestamp: new Date().toISOString(),
        users: store.users,
        materials: store.materials,
        quotes: store.quotes,
        totalRecords: store.users.length + store.materials.length + store.quotes.length
      });
    }

    if (method === 'DELETE' && path === '/clear-all') {
      await loadStore();
      store = emptyStore();
      await saveStore();
      return json(res, 200, { message: 'Todos os dados foram removidos com sucesso', deleted: { orcamentos: true, materiais: true, usuarios: true } });
    }

    return notFound(res);
  } catch (error) {
    console.error(error);
    return json(res, 500, { erro: error.message });
  }
}

async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    const value = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
    try {
      return JSON.parse(value || '{}');
    } catch {
      return {};
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}
