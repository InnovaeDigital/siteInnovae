#!/usr/bin/env node

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const URI = process.env.MONGODB_URI;

async function testQuick() {
  console.log('\n🧪 Teste Rápido MongoDB - 10 segundos máximo\n');
  
  let client;
  const timer = setTimeout(() => {
    console.log('⏱️  Timeout! A conexão está demorando demais.');
    console.log('\n❌ DIAGNÓSTICO:');
    console.log('   Seu IP provavelmente NÃO está na whitelist do MongoDB Atlas');
    console.log('\n✅ SOLUÇÃO:');
    console.log('   Abra: https://www.mongodb.com/cloud/atlas');
    console.log('   → Cluster0 → Network Access → Add IP Address');
    console.log('   → Selecione "Allow access from anywhere"');
    console.log('   → Aguarde 2-3 minutos');
    console.log('   → Tente novamente\n');
    console.log('📖 Leia: SOLUCAO-MONGODB-PASSO-A-PASSO.md\n');
    process.exit(1);
  }, 10000);
  
  try {
    console.log('Conectando...');
    
    client = new MongoClient(URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 8000,
    });
    
    await client.connect();
    clearTimeout(timer);
    
    console.log('✅ CONEXÃO BEM-SUCEDIDA!\n');
    
    const adminDb = client.db('admin');
    await adminDb.command({ ping: 1 });
    
    console.log('✅ Banco de dados respondendo');
    console.log('✅ Autenticação OK');
    console.log('✅ Tudo funcionando!\n');
    
    console.log('🚀 Seu MongoDB está pronto para usar!\n');
    
    await client.close();
    process.exit(0);
    
  } catch (error) {
    clearTimeout(timer);
    console.log('\n❌ ERRO:', error.message);
    console.log('\n🔍 POSSÍVEIS CAUSAS:');
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('   • DNS não está resolvendo');
      console.log('   • Sem conexão com internet\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   • Porta 27017 está bloqueada');
      console.log('   • Firewall/antivírus bloqueando\n');
    } else if (error.message.includes('authentication')) {
      console.log('   • Senha ou usuário incorreto');
      console.log('   • Acesse: MongoDB Atlas → Security → Database Access\n');
    } else {
      console.log('   • IP não está na whitelist do MongoDB Atlas\n');
    }
    
    console.log('✅ SOLUÇÃO RÁPIDA:');
    console.log('   1. Acesse: https://www.mongodb.com/cloud/atlas');
    console.log('   2. Vá para: Cluster0 → Network Access');
    console.log('   3. Clique: Add IP Address');
    console.log('   4. Selecione: "Allow access from anywhere"');
    console.log('   5. Aguarde 2-3 minutos');
    console.log('   6. Tente novamente\n');
    console.log('📖 Leia: SOLUCAO-MONGODB-PASSO-A-PASSO.md\n');
    
    process.exit(1);
  }
}

testQuick();
