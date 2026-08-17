import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração da string de conexão MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://innovaedigitalmedia_db_user:XuXjCSu4rypz6Jxx@cluster0.cuhm6bt.mongodb.net/?appName=Cluster0';
const DB_NAME = 'orcadores_innovae';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Variável global para o cliente MongoDB
let mongoClient;
let database;

// Função para conectar ao MongoDB
async function connectToDatabase() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    database = mongoClient.db(DB_NAME);
    console.log('✓ Conectado ao MongoDB com sucesso');
    return database;
  } catch (error) {
    console.error('✗ Erro ao conectar ao MongoDB:', error.message);
    throw error;
  }
}

// ROTAS DA API

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
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
