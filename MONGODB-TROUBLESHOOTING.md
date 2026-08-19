# 🔧 Guia de Resolução - Erro de Conexão MongoDB

## ❌ Problema Encontrado

Ao tentar conectar no MongoDB Atlas, você está recebendo este erro:

```
SSL routines:ssl3_read_bytes:tlsv1 alert internal error
MongoServerSelectionError: D0300000:error:0A000438
```

Este erro indica um problema com o handshake SSL/TLS entre seu cliente e o servidor MongoDB.

---

## ✅ Soluções (Tente na ordem)

### **1️⃣ Verificar IP Whitelist no MongoDB Atlas (SOLUÇÃO MAIS COMUM)**

Este é o problema mais frequente! Seu IP não está autorizado a conectar.

#### Passos:

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Faça login com: **innovaedigitalmedia_db_user**
3. Vá para seu cluster **Cluster0**
4. No menu esquerdo, clique em **"Network Access"** ou **"IP Whitelist"**
5. Clique em **"Add IP Address"**
6. Selecione **"Allow access from anywhere"** (0.0.0.0/0) para desenvolvimento
   - OU adicione seu IP específico consultando em: https://whatismyipaddress.com/
7. Clique em **"Confirm"**

#### Para Produção (Mais seguro):
- Adicione apenas os IPs específicos de suas máquinas
- Nunca use 0.0.0.0/0 em produção

---

### **2️⃣ Atualizar a Versão do Node.js**

Se estiver usando Node.js muito antigo, pode ter problemas com SSL.

#### Verificar versão:
```powershell
node --version
```

#### Recomendado:
- **Node.js 18.x** ou superior
- [Baixar aqui](https://nodejs.org/)

#### Após instalar:
```powershell
npm install
```

---

### **3️⃣ Restaurar Pacotes (node_modules)**

Às vezes o problema está em dependências corrompidas.

#### Solução:
```powershell
# Remove a pasta node_modules
Remove-Item -Recurse -Force node_modules

# Remove package-lock.json
Remove-Item package-lock.json

# Reinstala tudo
npm install
```

---

### **4️⃣ Testar Conexão com Ferramentas Oficiais**

Antes de rodar o servidor, teste a string de conexão com MongoDB Compass.

#### Passos:

1. Baixe [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Abra a aplicação
3. Cole sua string de conexão:
   ```
   mongodb+srv://innovaedigitalmedia_db_user:XuXjCSu4rypz6Jxx@cluster0.cuhm6bt.mongodb.net/orcadores_innovae?retryWrites=true&w=majority&authSource=admin
   ```
4. Clique em "Connect"
5. Se conectar, o problema é do servidor Node.js local
6. Se não conectar, é um problema de rede/IP

---

### **5️⃣ Verificar Credenciais do Banco**

A senha pode ter caracteres especiais não codificados.

#### Verificar no MongoDB Atlas:

1. Vá para **Security** → **Database Access**
2. Encontre o usuário **innovaedigitalmedia_db_user**
3. Se necessário, clique em **"Edit"** e redefina a senha
4. A nova senha aparecerá em um popup - **copie exatamente como mostrado**
5. Atualize o arquivo `.env`:

```env
MONGODB_URI=mongodb+srv://innovaedigitalmedia_db_user:SUA_SENHA_AQUI@cluster0.cuhm6bt.mongodb.net/orcadores_innovae?retryWrites=true&w=majority&authSource=admin
```

---

### **6️⃣ Testar com Porta Diferente ou VPN**

Se está atrás de firewall corporativo/escolar que bloqueia porta 27017:

#### Opção A: Use VPN
- Conecte-se a uma VPN pública
- Execute o servidor novamente

#### Opção B: Use Proxy
- Edite o `.env` para adicionar configuração de proxy

---

### **7️⃣ Reiniciar Docker/Servidor MongoDB (Se local)**

Se estiver usando MongoDB local em vez de Atlas:

```powershell
# Windows com MongoDB instalado
net stop MongoDB

# Aguarde e reinicie
net start MongoDB

# Teste novamente
node server.js
```

---

## 🧪 Teste de Conectividade

Cole este script em um arquivo chamado `test-connection.js`:

```javascript
import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://innovaedigitalmedia_db_user:XuXjCSu4rypz6Jxx@cluster0.cuhm6bt.mongodb.net/orcadores_innovae?retryWrites=true&w=majority&authSource=admin';

async function test() {
  try {
    console.log('🔄 Testando conexão...');
    const client = new MongoClient(URI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    const db = client.db('orcadores_innovae');
    const result = await db.admin().command({ ping: 1 });
    console.log('✅ Ping bem-sucedido:', result);
    
    await client.close();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();
```

Depois execute:
```powershell
node test-connection.js
```

---

## 📋 Checklist de Resolução

- [ ] Verifiquei meu IP no MongoDB Atlas Network Access
- [ ] Meu Node.js está na versão 18+ (`node --version`)
- [ ] Reinstalei os pacotes com `npm install`
- [ ] Testei com MongoDB Compass e consegui conectar
- [ ] Verifiquei as credenciais no MongoDB Atlas
- [ ] Executei o script de teste (`test-connection.js`)
- [ ] Meu arquivo `.env` está correto
- [ ] Removi NODE_TLS_REJECT_UNAUTHORIZED do `.env` após resolver

---

## 🚀 Depois de Resolver

Quando conseguir conectar com sucesso, você verá no terminal:

```
📡 Conectando ao MongoDB...
🔗 URI: mongodb+srv://innovaedigitalmedia_db_user:****@...
🔐 Iniciando handshake SSL...
✓ Conectado ao MongoDB com sucesso!
✓ Banco de dados: orcadores_innovae
🚀 Servidor rodando em http://localhost:3000
```

---

## 💬 Contato de Suporte

Se ainda assim não conseguir:

1. Execute o teste e **copie o erro completo**
2. Faça print do MongoDB Atlas → Network Access
3. Verifique se há Firewall/Antivírus bloqueando a porta 27017
4. Tente com uma rede diferente (celular hotspot)

---

## 🔒 Segurança

**IMPORTANTE**: Nunca compartilhe sua string de conexão real em:
- GitHub (use `.env`)
- Chat
- Fóruns públicos
- Emails

Sempre use variáveis de ambiente!
