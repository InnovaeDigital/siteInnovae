#!/usr/bin/env node

import { createConnection } from 'dns';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║       🔍 DIAGNÓSTICO RÁPIDO MONGODB - SEM TRAVAMENTOS     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Passo 1: Verificar DNS
console.log('1️⃣  Testando DNS (cluster0.cuhm6bt.mongodb.net)...');
try {
  const dns = await execAsync('nslookup cluster0.cuhm6bt.mongodb.net', { timeout: 5000 });
  if (dns.stdout.includes('cluster0')) {
    console.log('   ✅ DNS resolvido com sucesso\n');
  }
} catch (e) {
  console.log('   ❌ Falha ao resolver DNS');
  console.log('   Isso significa:');
  console.log('   • Sem conexão com internet');
  console.log('   • DNS não está funcionando\n');
}

// Passo 2: Verificar conectividade
console.log('2️⃣  Testando conectividade à porta 27017...');
try {
  await new Promise((resolve, reject) => {
    const socket = new (await import('net')).Socket();
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      console.log('   ✅ Porta 27017 acessível');
      socket.destroy();
      resolve();
    });
    
    socket.on('timeout', () => {
      console.log('   ⚠️  Timeout na porta 27017');
      console.log('   Possível bloqueio de firewall ou IP não autorizado\n');
      socket.destroy();
      resolve();
    });
    
    socket.on('error', (err) => {
      console.log('   ❌ Não conseguiu conectar à porta 27017');
      console.log('   Erro:', err.code);
      console.log('   Provável causa:');
      console.log('   • Firewall/antivírus bloqueando');
      console.log('   • IP não está na whitelist do MongoDB Atlas');
      console.log('   • Rede corporativa com restrições\n');
      resolve();
    });
    
    socket.connect(27017, 'cluster0.cuhm6bt.mongodb.net');
  });
} catch (e) {
  console.log('   ❌ Erro:', e.message, '\n');
}

// Passo 3: Informações de credenciais
console.log('3️⃣  Verificando credenciais MongoDB...');
const credenciais = {
  usuario: 'innovaedigitalmedia_db_user',
  banco: 'orcadores_innovae',
  cluster: 'cluster0.cuhm6bt.mongodb.net',
  authSource: 'admin'
};

console.log('   Usuário:', credenciais.usuario);
console.log('   Banco de dados:', credenciais.banco);
console.log('   Cluster:', credenciais.cluster);
console.log('   Auth Source:', credenciais.authSource);
console.log('   ℹ️  A senha NÃO é exibida por segurança\n');

// Passo 4: Verificar IP local
console.log('4️⃣  Seu IP local...');
try {
  const result = await execAsync('ipconfig', { timeout: 5000 });
  const ipv4Match = result.stdout.match(/IPv4[^:]*:\s*([\d.]+)/);
  if (ipv4Match) {
    console.log('   Seu IP (aproximado):', ipv4Match[1]);
    console.log('   ⚠️  IMPORTANTE: Adicione este IP na whitelist do MongoDB Atlas\n');
  }
} catch (e) {
  console.log('   ℹ️  Não foi possível determinar seu IP\n');
}

// Passo 5: Recomendações
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                  ✅ RECOMENDAÇÕES IMEDIATAS                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🔐 Para resolver o problema:\n');

console.log('1. Acesse https://www.mongodb.com/cloud/atlas');
console.log('   Faça login com suas credenciais\n');

console.log('2. Vá para seu Cluster0\n');

console.log('3. Clique em "Network Access" no menu lateral\n');

console.log('4. Clique em "Add IP Address"\n');

console.log('5. Escolha UMA das opções:\n');
console.log('   OPÇÃO A (Desenvolvimento rápido):');
console.log('   • Selecione "Allow access from anywhere" (0.0.0.0/0)');
console.log('   • Confirme\n');

console.log('   OPÇÃO B (Mais seguro):');
console.log('   • Copie seu IP local (visto acima)');
console.log('   • Cole no campo de IP');
console.log('   • Clique "Confirm"\n');

console.log('6. Aguarde 2-3 minutos para a whitelist ser atualizada\n');

console.log('7. Tente conectar novamente:\n');
console.log('   node test-mongodb.js\n');

console.log('💡 Se ainda não funcionar:\n');
console.log('   • Tente usar VPN');
console.log('   • Desligue firewall/antivírus temporariamente');
console.log('   • Tente com rede diferente (celular hotspot)\n');

console.log('📧 Suporte MongoDB Atlas:');
console.log('   https://www.mongodb.com/support\n');
