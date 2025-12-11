# 🌐 Guia de Migração: MongoDB Local → MongoDB Atlas (Nuvem)

Este guia mostra como migrar de um banco MongoDB local para o MongoDB Atlas gratuito na nuvem.

## 🎯 Por que migrar para MongoDB Atlas?

✅ **Vantagens:**
- Sem necessidade de servidor MongoDB local
- Acesso de qualquer lugar
- Backup automático
- 512MB gratuito (suficiente para desenvolvimento)
- Maior confiabilidade
- Escalabilidade fácil

## 📋 Pré-requisitos

- Conta no MongoDB Atlas (gratuita)
- Aplicação já funcionando localmente

## 🚀 Passo a Passo

### 1. Criar Conta no MongoDB Atlas

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta gratuita
3. Escolha o plano **M0 Free** (512MB)
4. Selecione a região mais próxima (ex: AWS São Paulo)

### 2. Criar um Cluster

1. No dashboard, clique em "Build a Database"
2. Escolha "Free" (M0)
3. Selecione a região: **AWS / São Paulo (sa-east-1)**
4. Nome do cluster: `fiscal-facil-cluster`
5. Clique em "Create"

### 3. Configurar Acesso

#### 3.1 Criar Usuário do Banco

1. Clique em "Database Access" no menu lateral
2. Clique em "Add New Database User"
3. Método: **Password**
4. Username: `admin_fiscal`
5. Password: Gere uma senha forte (ex: `SuaSenhaSegura123!`)
6. Database User Privileges: **Atlas Admin**
7. Clique em "Add User"

#### 3.2 Liberar IP

1. Clique em "Network Access" no menu lateral
2. Clique em "Add IP Address"
3. Opções:
   - **Desenvolvimento**: Escolha "Allow Access from Anywhere" (0.0.0.0/0)
   - **Produção**: Adicione apenas o IP do servidor
4. Clique em "Confirm"

### 4. Obter String de Conexão

1. Volte para "Database" no menu lateral
2. Clique em "Connect" no seu cluster
3. Escolha "Connect your application"
4. Driver: **Python** / Version: **3.11 or later**
5. Copie a string de conexão, ela será algo como:

```
mongodb+srv://admin_fiscal:<password>@fiscal-facil-cluster.abc123.mongodb.net/?retryWrites=true&w=majority
```

6. Substitua `<password>` pela senha que você criou

**Exemplo completo:**
```
mongodb+srv://admin_fiscal:SuaSenhaSegura123!@fiscal-facil-cluster.abc123.mongodb.net/fiscal_facil?retryWrites=true&w=majority
```

### 5. Atualizar Configuração da Aplicação

#### 5.1 Atualizar `.env` do Backend

Edite o arquivo `/app/backend/.env`:

```env
# Substitua esta linha:
# MONGO_URL=mongodb://localhost:27017

# Por esta (com sua string de conexão):
MONGO_URL=mongodb+srv://admin_fiscal:SuaSenhaSegura123!@fiscal-facil-cluster.abc123.mongodb.net/fiscal_facil?retryWrites=true&w=majority

JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

⚠️ **Importante**: 
- Adicione o nome do banco `/fiscal_facil` na URL
- Mantenha o resto da configuração igual

### 6. Reiniciar Backend

```bash
sudo supervisorctl restart backend
```

### 7. Verificar Conexão

Teste se está conectado ao Atlas:

```bash
curl http://localhost:8001/api/health
```

Resposta esperada:
```json
{"status":"healthy","database":"connected"}
```

### 8. Parar MongoDB Local (Opcional)

Se tudo estiver funcionando com o Atlas, você pode desativar o MongoDB local:

```bash
# Parar MongoDB local
sudo supervisorctl stop mongodb

# Ou desabilitar completamente editando /etc/supervisor/conf.d/supervisord.conf
# Comente as linhas do [program:mongodb]
```

## 🔒 Segurança

### Dicas Importantes:

1. **Nunca comite o .env no Git**:
```bash
# Adicione no .gitignore
echo ".env" >> .gitignore
```

2. **Use variáveis de ambiente de produção**:
   - No servidor, configure variáveis de ambiente separadas
   - Use serviços como Railway, Heroku, ou AWS Secrets Manager

3. **Rotacione senhas periodicamente**:
   - Troque a senha do MongoDB a cada 3-6 meses
   - Atualize no .env após trocar

## 📊 Monitoramento no Atlas

1. Acesse o dashboard do MongoDB Atlas
2. Clique em "Metrics" para ver:
   - Conexões ativas
   - Uso de armazenamento
   - Operações por segundo
   - Latência

## 🔄 Backup e Restore

### Fazer Backup (MongoDB Local → Atlas)

Se você tem dados no MongoDB local e quer migrar:

```bash
# Exportar dados do MongoDB local
mongodump --db fiscal_facil --out /tmp/backup

# Importar para o Atlas
mongorestore --uri="mongodb+srv://admin_fiscal:senha@cluster.mongodb.net" /tmp/backup
```

### Backup Automático

O MongoDB Atlas M0 (free tier) **não inclui** backup automático contínuo, mas você pode:
1. Fazer backups manuais periodicamente
2. Upgrade para M2+ para backups automáticos

## 🐛 Troubleshooting

### Erro: "Authentication failed"
- Verifique se a senha está correta na string de conexão
- Caracteres especiais na senha devem ser URL-encoded

### Erro: "Connection timeout"
- Verifique se o IP está liberado no Network Access
- Use "0.0.0.0/0" para permitir qualquer IP (desenvolvimento)

### Erro: "Certificate verification failed"
- Adicione `&tlsAllowInvalidCertificates=true` na URL (apenas dev)

### Backend não conecta
```bash
# Ver logs de erro
tail -50 /var/log/supervisor/backend.err.log

# Testar conexão diretamente
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; asyncio.run(AsyncIOMotorClient('sua_url').admin.command('ping'))"
```

## 📈 Limites do Plano Gratuito

- **Armazenamento**: 512MB
- **RAM compartilhada**: Sim
- **Conexões simultâneas**: 500
- **Backup automático**: Não
- **Métricas**: Sim
- **Performance**: Adequado para desenvolvimento e projetos pequenos

## 🎯 Quando fazer Upgrade?

Considere upgrade para M2 ($9/mês) se:
- Ultrapassar 512MB de dados
- Precisar de backups automáticos
- Necessitar melhor performance
- Projeto em produção com usuários reais

## ✅ Checklist Final

- [ ] Conta criada no MongoDB Atlas
- [ ] Cluster criado (M0 Free)
- [ ] Usuário do banco configurado
- [ ] IP liberado no Network Access
- [ ] String de conexão obtida e testada
- [ ] `.env` atualizado com nova URL
- [ ] Backend reiniciado
- [ ] Health check passou
- [ ] Login e cadastro funcionando
- [ ] MongoDB local desabilitado (opcional)

---

**Pronto! Sua aplicação agora está usando MongoDB na nuvem! 🎉**

Qualquer dúvida, consulte a documentação oficial:
- https://docs.atlas.mongodb.com/
- https://www.mongodb.com/docs/drivers/motor/
