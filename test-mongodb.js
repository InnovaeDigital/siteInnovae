import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb+srv://innovaedigitalmedia_db_user:XuXjCSu4rypz6Jxx@cluster0.cuhm6bt.mongodb.net/orcadores_innovae?retryWrites=true&w=majority&authSource=admin';

async function testConnection() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        🧪 TESTE DE CONEXÃO MONGODB - DIAGNÓSTICO          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  let client;
  
  try {
    console.log('📡 1. Testando conexão básica...');
    console.log('   URI mascarada:', URI.replace(/(:\/\/.*:)(.*)(@)/, '$1****$3'));
    
    client = new MongoClient(URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });
    
    console.log('   ⏳ Conectando...\n');
    await client.connect();
    console.log('   ✅ Conexão estabelecida com sucesso!\n');
    
    // Teste 1: Ping
    console.log('📍 2. Enviando ping ao servidor...');
    const adminDb = client.db('admin');
    const pingResult = await adminDb.command({ ping: 1 });
    console.log('   ✅ Ping bem-sucedido:', pingResult, '\n');
    
    // Teste 2: Listar databases
    console.log('📚 3. Listando bancos de dados...');
    const databases = await adminDb.admin().listDatabases();
    console.log('   ✅ Bancos encontrados:');
    databases.databases.forEach(db => {
      console.log(`      • ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log();
    
    // Teste 3: Conectar ao banco específico
    console.log('🔍 4. Acessando banco "orcadores_innovae"...');
    const orcamentosDb = client.db('orcadores_innovae');
    const collections = await orcamentosDb.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   ℹ️  Banco existe mas sem coleções ainda (normal para novo banco)\n');
    } else {
      console.log('   ✅ Coleções encontradas:');
      for (const col of collections) {
        const count = await orcamentosDb.collection(col.name).countDocuments();
        console.log(`      • ${col.name} (${count} documentos)`);
      }
      console.log();
    }
    
    // Teste 4: Verificar permissões - criar documento teste
    console.log('✏️  5. Testando permissão de escrita...');
    const testCollection = orcamentosDb.collection('_test_connection');
    const testDoc = {
      _id: `test_${Date.now()}`,
      timestamp: new Date(),
      message: 'Teste de conexão',
      status: 'ok'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('   ✅ Documento inserido com ID:', insertResult.insertedId, '\n');
    
    // Teste 5: Verificar leitura
    console.log('📖 6. Testando permissão de leitura...');
    const readDoc = await testCollection.findOne({ _id: testDoc._id });
    if (readDoc) {
      console.log('   ✅ Documento lido com sucesso:', readDoc, '\n');
    }
    
    // Teste 6: Limpar teste
    console.log('🧹 7. Limpando dados de teste...');
    await testCollection.deleteOne({ _id: testDoc._id });
    console.log('   ✅ Documento de teste removido\n');
    
    // Teste 7: Informações do usuário
    console.log('👤 8. Informações do usuário conectado...');
    const userInfo = await adminDb.command({ connectionStatus: 1 });
    console.log('   ✅ Autenticado como:', userInfo.authInfo.authenticatedUsers?.[0]?.user || 'innovaedigitalmedia_db_user');
    console.log('   ✅ Banco de autenticação:', userInfo.authInfo.authenticatedUsers?.[0]?.db || 'admin\n');
    
    // Resumo final
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ TUDO FUNCIONANDO!                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 RESUMO:');
    console.log('   ✅ Conexão SSL/TLS: OK');
    console.log('   ✅ Autenticação: OK');
    console.log('   ✅ Acesso ao banco: OK');
    console.log('   ✅ Permissões de escrita: OK');
    console.log('   ✅ Permissões de leitura: OK');
    console.log('\n🚀 Seu MongoDB está pronto para usar!\n');
    
  } catch (error) {
    console.log('❌ ERRO ENCONTRADO:\n');
    console.log('   Tipo:', error.name);
    console.log('   Mensagem:', error.message);
    console.log('   Código:', error.code, '\n');
    
    // Diagnóstico baseado no tipo de erro
    console.log('🔍 DIAGNÓSTICO:\n');
    
    if (error.message.includes('ssl') || error.message.includes('SSL') || error.message.includes('tls')) {
      console.log('   ⚠️  Problema de SSL/TLS detectado:');
      console.log('   • Verifique se seu IP está na whitelist do MongoDB Atlas');
      console.log('   • Acesse: https://cloud.mongodb.com/');
      console.log('   • Cluster > Network Access > Add IP Address');
      console.log('   • Ou selecione "Allow from anywhere" para desenvolvimento\n');
    }
    
    if (error.message.includes('authentication') || error.message.includes('auth')) {
      console.log('   ⚠️  Problema de autenticação detectado:');
      console.log('   • Verifique o usuário: innovaedigitalmedia_db_user');
      console.log('   • Verifique a senha');
      console.log('   • Verifique o parâmetro authSource=admin na URL\n');
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
      console.log('   ⚠️  Problema de conexão detectado:');
      console.log('   • Verifique sua conexão com a internet');
      console.log('   • Verifique se o MongoDB Atlas está operacional');
      console.log('   • Tente usar uma VPN se em rede corporativa\n');
    }
    
    if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      console.log('   ⚠️  Timeout na conexão detectado:');
      console.log('   • Seu IP pode estar bloqueado');
      console.log('   • Pode haver firewall/antivírus bloqueando porta 27017');
      console.log('   • Tente conectar com VPN\n');
    }
    
    console.log('💡 SUGESTÕES:');
    console.log('   1. Consulte MONGODB-TROUBLESHOOTING.md');
    console.log('   2. Use MongoDB Compass para testar:\n');
    console.log('      ' + URI.replace(/(:\/\/.*:)(.*)(@)/, '$1****$3'));
    console.log('   3. Verifique https://status.mongodb.com/\n');
    
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexão fechada\n');
    }
  }
}

// Executar teste
testConnection().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
