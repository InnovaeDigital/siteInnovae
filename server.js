import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração da string de conexão MongoDB
// IMPORTANTE: Certifique-se de que a senha não contém caracteres especiais não codificados
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://innovaedigitalmedia_db_user:XuXjCSu4rypz6Jxx@cluster0.cuhm6bt.mongodb.net/orcadores_innovae?retryWrites=true&w=majority&authSource=admin';
const DB_NAME = 'orcadores_innovae';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Variável global para o cliente MongoDB
let mongoClient;
let database;

function normalizeUser(user) {
  return {
    login: String(user?.login || '').trim(),
    password: String(user?.password || ''),
    updatedAt: user?.updatedAt || new Date().toISOString()
  };
}

// Função para conectar ao MongoDB
async function connectToDatabase() {
  try {
    console.log('📡 Conectando ao MongoDB...');
    console.log('🔗 URI:', MONGODB_URI.replace(/(:\/\/.*:)(.*)(@)/, '$1****$3'));
    
    const mongoOptions = {
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      // TLS settings
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    };
    
    mongoClient = new MongoClient(MONGODB_URI, mongoOptions);
    console.log('🔐 Iniciando handshake SSL...');
    await mongoClient.connect();
    
    // Verificar conexão com ping
    await mongoClient.db('admin').command({ ping: 1 });
    
    database = mongoClient.db(DB_NAME);
    console.log('✓ Conectado ao MongoDB com sucesso!');
    console.log(`✓ Banco de dados: ${DB_NAME}`);
    return database;
  } catch (error) {
    console.error('✗ Erro ao conectar ao MongoDB:');
    console.error('  Mensagem:', error.message);
    console.error('  Código:', error.code);
    console.error('\n💡 Possíveis soluções:');
    console.error('  1. Verifique a string de conexão no .env');
    console.error('  2. Confirme que o IP está na IP Whitelist do MongoDB Atlas');
    console.error('  3. Verifique as credenciais de usuário');
    console.error('  4. Tente usar VPN ou rede diferente se SSL falhar');
    throw error;
  }
}

// ROTAS DA API

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/api/config/invoice-number', async (req, res) => {
  try {
    const configCollection = database.collection('config');
    const entry = await configCollection.findOne({ _id: 'nextInvoiceNumber' });
    res.json({ value: entry?.value || '208-2026' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.put('/api/config/invoice-number', async (req, res) => {
  try {
    const value = String(req.body?.value || '').trim();
    if (!value) return res.status(400).json({ erro: 'Valor inválido' });
    const configCollection = database.collection('config');
    await configCollection.updateOne(
      { _id: 'nextInvoiceNumber' },
      { $set: { value, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ value });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await database.collection('usuarios').find({}).toArray();
    res.json(users.map(normalizeUser));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = normalizeUser(req.body);
    if (!user.login || !user.password) return res.status(400).json({ erro: 'Login e senha são obrigatórios' });
    await database.collection('usuarios').updateOne(
      { login: user.login },
      { $set: user },
      { upsert: true }
    );
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.delete('/api/users/:login', async (req, res) => {
  try {
    const result = await database.collection('usuarios').deleteOne({ login: req.params.login });
    res.json({ deleted: result.deletedCount > 0 });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const doc = await database.collection('config').findOne({ _id: 'materials' });
    res.json(Array.isArray(doc?.items) ? doc.items : []);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.put('/api/materials', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    await database.collection('config').updateOne(
      { _id: 'materials' },
      { $set: { items, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ items });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Criar novo orçamento
app.post('/api/orcamentos', async (req, res) => {
  try {
    const orcamento = req.body;
    const collection = database.collection('orcamentos');
    const result = await collection.insertOne({
      ...orcamento,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      status: 'rascunho'
    });
    
    res.status(201).json({
      mensagem: 'Orçamento criado com sucesso',
      id: result.insertedId
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Obter todos os orçamentos
app.get('/api/orcamentos', async (req, res) => {
  try {
    const collection = database.collection('orcamentos');
    const orcamentos = await collection.find({}).toArray();
    res.json(orcamentos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Obter orçamento por ID
app.get('/api/orcamentos/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const collection = database.collection('orcamentos');
    const orcamento = await collection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!orcamento) {
      return res.status(404).json({ erro: 'Orçamento não encontrado' });
    }
    
    res.json(orcamento);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Atualizar orçamento
app.put('/api/orcamentos/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const collection = database.collection('orcamentos');
    const resultado = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: {
          ...req.body,
          dataAtualizacao: new Date()
        }
      }
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ erro: 'Orçamento não encontrado' });
    }
    
    res.json({ mensagem: 'Orçamento atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Deletar orçamento
app.delete('/api/orcamentos/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const collection = database.collection('orcamentos');
    const resultado = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ erro: 'Orçamento não encontrado' });
    }
    
    res.json({ mensagem: 'Orçamento deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ===== ENDPOINTS DE MIGRAÇÃO =====

// Importar dados do localStorage (migração do banco antigo)
app.post('/api/migrate-from-localstorage', async (req, res) => {
  try {
    const { quotes, materials, users, invoiceNumber } = req.body;
    
    console.log('📦 Iniciando migração de dados...');
    
    let migrated = {
      quotes: 0,
      materials: 0,
      users: 0
    };
    
    // Importar orçamentos
    if (quotes && Array.isArray(quotes) && quotes.length > 0) {
      const quotesCollection = database.collection('orcamentos');
      const result = await quotesCollection.insertMany(
        quotes.map(q => ({
          ...q,
          dataCriacao: new Date(q.dataCriacao || Date.now()),
          dataAtualizacao: new Date(q.dataAtualizacao || Date.now()),
          status: q.status || 'rascunho',
          migratedFrom: 'localStorage'
        }))
      );
      migrated.quotes = result.insertedIds.length;
      console.log(`✓ ${migrated.quotes} orçamentos importados`);
    }
    
    // Importar materiais/presets
    if (materials && Array.isArray(materials) && materials.length > 0) {
      const materialsCollection = database.collection('materiais');
      const result = await materialsCollection.insertMany(
        materials.map(m => ({
          ...m,
          dataCriacao: new Date(),
          migratedFrom: 'localStorage'
        }))
      );
      migrated.materials = result.insertedIds.length;
      console.log(`✓ ${migrated.materials} materiais importados`);
    }
    
    // Importar usuários
    if (users && Array.isArray(users) && users.length > 0) {
      const usersCollection = database.collection('usuarios');
      const result = await usersCollection.insertMany(
        users.map(u => ({
          ...u,
          dataCriacao: new Date(),
          migratedFrom: 'localStorage'
        }))
      );
      migrated.users = result.insertedIds.length;
      console.log(`✓ ${migrated.users} usuários importados`);
    }
    
    // Salvar número do próximo invoice
    if (invoiceNumber) {
      const configCollection = database.collection('config');
      await configCollection.updateOne(
        { _id: 'nextInvoiceNumber' },
        { $set: { value: invoiceNumber } },
        { upsert: true }
      );
      console.log(`✓ Próximo número de invoice: ${invoiceNumber}`);
    }
    
    res.json({
      mensagem: 'Migração concluída com sucesso',
      dadosMigrados: migrated,
      total: migrated.quotes + migrated.materials + migrated.users
    });
  } catch (error) {
    res.status(500).json({ 
      erro: error.message,
      detalhes: 'Erro durante a migração dos dados'
    });
  }
});

// Exportar dados para backup (antes de limpar)
app.get('/api/export-all', async (req, res) => {
  try {
    const quotesCollection = database.collection('orcamentos');
    const materialsCollection = database.collection('materiais');
    const usersCollection = database.collection('usuarios');
    
    const [quotes, materials, users] = await Promise.all([
      quotesCollection.find({}).toArray(),
      materialsCollection.find({}).toArray(),
      usersCollection.find({}).toArray()
    ]);
    
    res.json({
      timestamp: new Date(),
      data: {
        quotes,
        materials,
        users,
        totalRecords: quotes.length + materials.length + users.length
      }
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Limpar todos os dados (após migração)
app.post('/api/clear-all', async (req, res) => {
  try {
    const quotesCollection = database.collection('orcamentos');
    const materialsCollection = database.collection('materiais');
    const usersCollection = database.collection('usuarios');
    
    const [quotesResult, materialsResult, usersResult] = await Promise.all([
      quotesCollection.deleteMany({}),
      materialsCollection.deleteMany({}),
      usersCollection.deleteMany({})
    ]);
    
    res.json({
      mensagem: 'Todos os dados foram deletados',
      deletados: {
        orcamentos: quotesResult.deletedCount,
        materiais: materialsResult.deletedCount,
        usuarios: usersResult.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Iniciar servidor
async function iniciarServidor() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor...');
  if (mongoClient) {
    await mongoClient.close();
    console.log('Conexão com MongoDB fechada');
  }
  process.exit(0);
});

iniciarServidor();
