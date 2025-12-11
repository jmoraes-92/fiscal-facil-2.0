# 📊 Fiscal Fácil v2.0 - Sistema de Auditoria Fiscal

Sistema moderno e desacoplado para auditoria de notas fiscais, com backend FastAPI, MongoDB e frontend React.

## 🚀 Tecnologias

### Backend
- **FastAPI** - Framework web moderno e rápido
- **MongoDB** - Banco de dados NoSQL (local)
- **Motor** - Driver assíncrono do MongoDB
- **JWT** - Autenticação com tokens
- **bcrypt** - Criptografia de senhas

### Frontend
- **React 18** - Framework JavaScript moderno
- **React Router** - Navegação entre páginas
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Framework CSS utilitário
- **Context API** - Gerenciamento de estado

## 📁 Estrutura do Projeto

```
/app/
├── backend/
│   ├── server.py              # API FastAPI principal
│   ├── utils/
│   │   ├── auth.py            # Autenticação JWT
│   │   ├── brasil_api.py      # Consulta CNPJ
│   │   └── xml_parser.py      # Parser de XML
│   ├── requirements.txt       # Dependências Python
│   └── .env                   # Variáveis de ambiente
│
└── frontend/
    ├── src/
    │   ├── components/        # Componentes React
    │   │   ├── Login.js       # Tela de login/registro
    │   │   ├── Dashboard.js   # Painel principal
    │   │   ├── CadastroEmpresa.js
    │   │   ├── UploadXML.js
    │   │   └── ListaNotas.js
    │   ├── context/
    │   │   └── AuthContext.js # Contexto de autenticação
    │   ├── App.js             # Componente principal
    │   └── index.js           # Ponto de entrada
    ├── package.json           # Dependências Node.js
    └── .env                   # Variáveis de ambiente
```

## 🔧 Configuração

### Variáveis de Ambiente

**Backend** (`/app/backend/.env`):
```env
MONGO_URL=mongodb://localhost:27017
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend** (`/app/frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🎯 Funcionalidades

### ✅ Implementadas
- ✅ **Autenticação JWT** - Login e registro de usuários
- ✅ **Consulta CNPJ** - Integração com BrasilAPI
- ✅ **Cadastro de Empresas** - Com mapeamento de CNAEs
- ✅ **Upload de XML** - Importação de notas fiscais
- ✅ **Auditoria Automática** - Validação de códigos de serviço
- ✅ **Dashboard** - Visualização de notas e estatísticas
- ✅ **Banco de Dados Local** - MongoDB sem necessidade de instalação externa

### 🔒 Segurança
- Senhas criptografadas com bcrypt
- Autenticação JWT com tokens seguros
- Rotas protegidas no frontend e backend
- CORS configurado adequadamente

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/registro` - Criar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual

### Empresas
- `GET /api/empresas/consulta/{cnpj}` - Consultar CNPJ
- `POST /api/empresas` - Cadastrar empresa
- `GET /api/empresas` - Listar empresas do usuário
- `GET /api/empresas/{id}` - Obter detalhes da empresa

### Notas Fiscais
- `POST /api/notas/importar/{empresa_id}` - Importar XML
- `GET /api/notas/empresa/{empresa_id}` - Listar notas
- `GET /api/notas/estatisticas/{empresa_id}` - Estatísticas

### Sistema
- `GET /` - Status da API
- `GET /api/health` - Health check (verifica banco)

## 🎨 Interface

### Tela de Login/Registro
- Design moderno com gradiente
- Alternância entre login e registro
- Validação de formulários
- Feedback de erros

### Dashboard
- Listagem de empresas cadastradas
- Seleção de empresa ativa
- Upload de XML com drag-and-drop
- Visualização de notas fiscais
- Estatísticas em tempo real

## 🚀 Como Usar

### Serviços (já configurados no Supervisor)

**Verificar status:**
```bash
sudo supervisorctl status
```

**Reiniciar serviços:**
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart mongodb
```

**Ver logs:**
```bash
# Backend
tail -f /var/log/supervisor/backend.out.log

# Frontend
tail -f /var/log/supervisor/frontend.out.log

# MongoDB
tail -f /var/log/mongodb.out.log
```

### Acessar a Aplicação

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:8001
3. **Documentação API**: http://localhost:8001/docs

## 📊 Fluxo de Uso

1. **Registro/Login** - Criar conta ou entrar
2. **Cadastrar Empresa** - Consultar CNPJ e mapear CNAEs
3. **Upload de XML** - Importar nota fiscal
4. **Auditoria Automática** - Sistema valida os códigos
5. **Visualização** - Ver relatório de conformidade

## 🔄 Melhorias Implementadas

### Do Sistema Antigo para o Novo:

#### ❌ Sistema Antigo
- SQLAlchemy com banco local (SQLite/MySQL)
- Frontend Streamlit acoplado
- Sem autenticação
- Hardcoded localhost
- Estrutura monolítica

#### ✅ Sistema Novo
- MongoDB (NoSQL, mais flexível)
- React moderno e desacoplado
- Autenticação JWT completa
- Variáveis de ambiente
- Arquitetura modular
- API REST documentada
- Interface moderna com Tailwind CSS
- Validações robustas

## 🎓 Conceitos Aplicados

- **Arquitetura REST** - API bem estruturada
- **JWT Authentication** - Segurança moderna
- **NoSQL Database** - MongoDB para flexibilidade
- **React Hooks** - useState, useEffect, useContext
- **Context API** - Gerenciamento de estado global
- **Protected Routes** - Rotas autenticadas
- **Responsive Design** - Interface adaptativa
- **Form Validation** - Validação de dados
- **Error Handling** - Tratamento de erros robusto

## 📝 Observações

- O MongoDB roda localmente sem necessidade de instalação externa
- Hot reload ativo no frontend e backend
- CORS configurado para desenvolvimento
- Tokens JWT expiram em 30 minutos (configurável)
- Upload de XML suporta diferentes encodings (UTF-8 e ISO-8859-1)

## 🛠️ Comandos Úteis

```bash
# Testar endpoint de health
curl http://localhost:8001/api/health

# Testar registro de usuário
curl -X POST http://localhost:8001/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","email":"joao@email.com","senha":"senha123"}'

# Verificar processos
ps aux | grep -E 'uvicorn|mongod|yarn'

# Limpar banco de dados MongoDB
mongo fiscal_facil --eval "db.dropDatabase()"
```

## 🎯 Próximos Passos (Opcionais)

- [ ] Migrar MongoDB local para MongoDB Atlas (nuvem)
- [ ] Adicionar paginação nas listas
- [ ] Implementar filtros e busca
- [ ] Export de relatórios em PDF
- [ ] Dashboard com gráficos
- [ ] Notificações em tempo real
- [ ] Backup automático
- [ ] Deploy em produção

---

**Desenvolvido com ❤️ usando FastAPI, MongoDB e React**
