# 🧪 Guia de Testes - Fiscal Fácil v2.0

Este guia ajuda você a testar todas as funcionalidades da aplicação.

## 📋 Pré-requisitos

Verifique se os serviços estão rodando:

```bash
sudo supervisorctl status
```

Todos devem estar **RUNNING**:
- ✅ backend
- ✅ frontend  
- ✅ mongodb

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

## 🧪 Testes Manuais - Interface Web

### 1. Teste de Registro de Usuário

1. Abra http://localhost:3000
2. Clique na aba "Registrar"
3. Preencha:
   - Nome: João Silva
   - Email: joao@teste.com
   - Senha: senha123
   - Telefone: (18) 99999-9999
4. Clique em "Criar Conta"

✅ **Resultado esperado**: 
- Redirecionamento automático para o dashboard
- Mensagem de boas-vindas com seu nome

### 2. Teste de Login

1. Faça logout clicando no botão "Sair"
2. Na tela de login, use:
   - Email: joao@teste.com
   - Senha: senha123
3. Clique em "Entrar"

✅ **Resultado esperado**: 
- Acesso ao dashboard

### 3. Teste de Consulta CNPJ

1. No dashboard, clique em "+ Nova Empresa"
2. Digite um CNPJ válido: `00000000000191` (Banco do Brasil)
3. Clique em "Consultar"

✅ **Resultado esperado**: 
- Dados da empresa preenchidos automaticamente
- Razão Social: BANCO DO BRASIL SA
- Município: BRASILIA

### 4. Teste de Cadastro de Empresa

1. Após consultar o CNPJ, preencha:
   - Regime Tributário: Simples Nacional
2. Clique em "+ Adicionar" (CNAEs)
3. Adicione um CNAE:
   - CNAE: 6201-5/00
   - Cód. Serviço: 08.02
   - Descrição: Desenvolvimento de software
4. Clique em "Cadastrar Empresa"

✅ **Resultado esperado**: 
- Empresa aparece na lista
- Card da empresa é exibido

### 5. Teste de Upload de XML (Nota Fiscal)

⚠️ **Nota**: Você precisa de um arquivo XML válido de nota fiscal.

Se não tiver um XML, você pode criar um arquivo de teste:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tbnfd>
  <nfdok>
    <NewDataSet>
      <NOTA_FISCAL>
        <NumeroNota>123</NumeroNota>
        <DataEmissao>2024-01-15T10:30:00</DataEmissao>
        <Cae>08.02</Cae>
        <ValorTotalNota>1500.00</ValorTotalNota>
        <ChaveValidacao>ABC123XYZ</ChaveValidacao>
        <ClienteCNPJCPF>12345678901234</ClienteCNPJCPF>
      </NOTA_FISCAL>
    </NewDataSet>
  </nfdok>
</tbnfd>
```

Salve como `nota_teste.xml`

**Teste:**
1. Selecione uma empresa na lista
2. Na seção "Importar Nota Fiscal (XML)", clique em "Escolher arquivo"
3. Selecione o XML
4. Clique em "Processar e Auditar"

✅ **Resultado esperado (código autorizado)**: 
- Card verde com "✅ Nota Aprovada"
- Status: APROVADA
- Detalhes da nota exibidos

✅ **Resultado esperado (código NÃO autorizado)**: 
- Card vermelho com "❌ Nota com Erros"
- Status: ERRO_CNAE
- Mensagem de erro explicando o problema

### 6. Teste de Listagem de Notas

1. Após importar uma nota, vá para "Notas Fiscais"
2. Clique em "🔄 Atualizar"

✅ **Resultado esperado**: 
- Estatísticas atualizadas (Total, Aprovadas, Com Erros)
- Tabela com todas as notas importadas
- Cores indicando status (verde = aprovada, vermelho = erro)

## 🔧 Testes via API (cURL)

### 1. Health Check

```bash
curl http://localhost:8001/api/health
```

Esperado:
```json
{"status":"healthy","database":"connected"}
```

### 2. Registro de Usuário

```bash
curl -X POST http://localhost:8001/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva",
    "email": "maria@teste.com",
    "senha": "senha123",
    "telefone": "18988887777"
  }'
```

Esperado:
```json
{
  "mensagem": "Usuário cadastrado com sucesso",
  "access_token": "eyJ...",
  "token_type": "bearer",
  "usuario": {
    "id": "...",
    "nome": "Maria Silva",
    "email": "maria@teste.com"
  }
}
```

### 3. Login

```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@teste.com",
    "senha": "senha123"
  }'
```

### 4. Consultar CNPJ (com autenticação)

```bash
# Salve o token do login anterior
TOKEN="cole_o_token_aqui"

curl -X GET "http://localhost:8001/api/empresas/consulta/00000000000191" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Cadastrar Empresa

```bash
curl -X POST http://localhost:8001/api/empresas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cnpj": "00000000000191",
    "razao_social": "Empresa Teste Ltda",
    "nome_fantasia": "Teste",
    "regime_tributario": "Simples Nacional",
    "data_abertura": null,
    "cnaes_permitidos": [
      {
        "cnae_codigo": "6201-5/00",
        "codigo_servico_municipal": "08.02",
        "descricao": "Desenvolvimento de software"
      }
    ]
  }'
```

### 6. Listar Empresas

```bash
curl -X GET http://localhost:8001/api/empresas \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Upload de XML

```bash
curl -X POST "http://localhost:8001/api/notas/importar/EMPRESA_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@nota_teste.xml"
```

## 🐛 Troubleshooting

### Frontend não carrega

```bash
# Verificar logs
tail -f /var/log/supervisor/frontend.out.log

# Reiniciar
sudo supervisorctl restart frontend
```

### Backend não responde

```bash
# Verificar logs
tail -f /var/log/supervisor/backend.err.log

# Reiniciar
sudo supervisorctl restart backend
```

### MongoDB não conecta

```bash
# Verificar se está rodando
sudo supervisorctl status mongodb

# Ver logs
tail -f /var/log/mongodb.err.log

# Reiniciar
sudo supervisorctl restart mongodb
```

### Token expirado

Se receber erro "Token inválido ou expirado":
1. Faça login novamente
2. Os tokens expiram em 30 minutos

### Erro de CORS

Se receber erro de CORS no navegador:
1. Verifique se o backend está rodando
2. Verifique se a URL no `.env` do frontend está correta
3. Limpe o cache do navegador

## ✅ Checklist de Testes Completo

### Backend
- [ ] Health check funcionando
- [ ] Registro de usuário
- [ ] Login de usuário
- [ ] Token JWT sendo gerado
- [ ] Rotas protegidas funcionando
- [ ] Consulta CNPJ (BrasilAPI)
- [ ] Cadastro de empresa
- [ ] Upload de XML
- [ ] Auditoria de notas
- [ ] Listagem de notas
- [ ] Estatísticas

### Frontend
- [ ] Página carrega sem erros
- [ ] Formulário de registro funciona
- [ ] Formulário de login funciona
- [ ] Redirecionamento após login
- [ ] Dashboard carrega empresas
- [ ] Consulta CNPJ funciona
- [ ] Cadastro de empresa funciona
- [ ] Upload de XML funciona
- [ ] Lista de notas atualiza
- [ ] Estatísticas são exibidas
- [ ] Logout funciona
- [ ] Rotas protegidas (redirect para login)

### Integração
- [ ] Autenticação E2E (registro → login → dashboard)
- [ ] Fluxo completo de empresa (consulta → cadastro → listagem)
- [ ] Fluxo completo de notas (upload → auditoria → listagem)
- [ ] Sincronização entre frontend e backend
- [ ] Mensagens de erro apropriadas

### Performance
- [ ] Backend responde em < 1s
- [ ] Frontend carrega em < 3s
- [ ] Upload de XML processa em < 2s
- [ ] Consulta CNPJ retorna em < 5s

## 📊 Métricas de Sucesso

✅ **Aplicação está funcionando corretamente se:**

1. Todos os serviços estão RUNNING
2. Health check retorna "healthy"
3. Login/registro funcionam
4. Consulta CNPJ retorna dados
5. Upload de XML é processado
6. Notas são listadas corretamente
7. Auditoria identifica erros de CNAE

## 🎯 Próximos Testes Avançados

- [ ] Teste de carga (múltiplos usuários simultâneos)
- [ ] Teste de segurança (injeção SQL, XSS)
- [ ] Teste de performance (500+ notas)
- [ ] Teste de resiliência (banco cai e volta)
- [ ] Teste de migração (local → Atlas)

---

**Se todos os testes passarem, sua aplicação está pronta! 🎉**
