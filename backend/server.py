from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from utils.auth import verify_password, get_password_hash, create_access_token, decode_token
from utils.brasil_api import consultar_cnpj
from utils.xml_parser import parse_xml_nota

load_dotenv()

# Configuração MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.fiscal_facil

# FastAPI App
app = FastAPI(title="Fiscal Fácil API", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== SCHEMAS ====================
class UsuarioRegistro(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    telefone: Optional[str] = None

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

class CnaePermitido(BaseModel):
    cnae_codigo: str
    codigo_servico_municipal: str
    descricao: Optional[str] = None

class EmpresaCadastro(BaseModel):
    cnpj: str
    razao_social: str
    nome_fantasia: Optional[str] = None
    regime_tributario: str
    data_abertura: Optional[str] = None
    cnaes_permitidos: List[CnaePermitido]

# ==================== AUTH MIDDLEWARE ====================
async def get_current_user(authorization: Optional[str] = Header(None)):
    from bson import ObjectId
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token não fornecido")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    try:
        user = await db.usuarios.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return user

# ==================== ROTAS DE AUTENTICAÇÃO ====================
@app.post("/api/auth/registro")
async def registrar_usuario(usuario: UsuarioRegistro):
    # Verifica se o email já existe
    existe = await db.usuarios.find_one({"email": usuario.email})
    if existe:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Cria o usuário
    usuario_doc = {
        "nome": usuario.nome,
        "email": usuario.email,
        "senha_hash": get_password_hash(usuario.senha),
        "telefone": usuario.telefone,
        "data_criacao": datetime.utcnow().isoformat()
    }
    
    result = await db.usuarios.insert_one(usuario_doc)
    usuario_id = str(result.inserted_id)
    
    # Gera token
    access_token = create_access_token(data={"sub": usuario_id})
    
    return {
        "mensagem": "Usuário cadastrado com sucesso",
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario_id,
            "nome": usuario.nome,
            "email": usuario.email
        }
    }

@app.post("/api/auth/login")
async def login(credenciais: UsuarioLogin):
    # Busca usuário
    usuario = await db.usuarios.find_one({"email": credenciais.email})
    if not usuario:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Verifica senha
    if not verify_password(credenciais.senha, usuario["senha_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Gera token
    usuario_id = str(usuario["_id"])
    access_token = create_access_token(data={"sub": usuario_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario_id,
            "nome": usuario["nome"],
            "email": usuario["email"]
        }
    }

@app.get("/api/auth/me")
async def obter_usuario_atual(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "nome": current_user["nome"],
        "email": current_user["email"],
        "telefone": current_user.get("telefone")
    }

# ==================== ROTAS DE EMPRESAS ====================
@app.get("/api/empresas/consulta/{cnpj}")
async def consultar_cnpj_endpoint(cnpj: str, current_user: dict = Depends(get_current_user)):
    return consultar_cnpj(cnpj)

@app.post("/api/empresas")
async def cadastrar_empresa(empresa: EmpresaCadastro, current_user: dict = Depends(get_current_user)):
    usuario_id = str(current_user["_id"])
    cnpj_limpo = "".join([n for n in empresa.cnpj if n.isdigit()])
    
    # Verifica se já existe
    existe = await db.empresas.find_one({"cnpj": cnpj_limpo})
    if existe:
        raise HTTPException(status_code=400, detail="Empresa já cadastrada")
    
    # Cria a empresa
    empresa_doc = {
        "usuario_id": usuario_id,
        "cnpj": cnpj_limpo,
        "razao_social": empresa.razao_social,
        "nome_fantasia": empresa.nome_fantasia,
        "regime_tributario": empresa.regime_tributario,
        "data_abertura": empresa.data_abertura,
        "cnaes_permitidos": [cnae.dict() for cnae in empresa.cnaes_permitidos],
        "data_cadastro": datetime.utcnow().isoformat()
    }
    
    result = await db.empresas.insert_one(empresa_doc)
    
    return {
        "mensagem": "Empresa cadastrada com sucesso",
        "id": str(result.inserted_id)
    }

@app.get("/api/empresas")
async def listar_empresas(current_user: dict = Depends(get_current_user)):
    usuario_id = str(current_user["_id"])
    empresas = []
    
    async for empresa in db.empresas.find({"usuario_id": usuario_id}):
        empresas.append({
            "id": str(empresa["_id"]),
            "cnpj": empresa["cnpj"],
            "razao_social": empresa["razao_social"],
            "nome_fantasia": empresa.get("nome_fantasia"),
            "regime_tributario": empresa["regime_tributario"]
        })
    
    return empresas

@app.get("/api/empresas/{empresa_id}")
async def obter_empresa(empresa_id: str, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    
    try:
        empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    if str(empresa.get("usuario_id")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    empresa["id"] = str(empresa.pop("_id"))
    return empresa

# ==================== ROTAS DE NOTAS FISCAIS ====================
@app.post("/api/notas/importar/{empresa_id}")
async def importar_nota_xml(
    empresa_id: str, 
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    from bson import ObjectId
    
    # Verifica se a empresa existe e pertence ao usuário
    try:
        empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    if str(empresa.get("usuario_id")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Lê o XML
    conteudo = await file.read()
    dados_xml = parse_xml_nota(conteudo)
    
    if "erro" in dados_xml:
        raise HTTPException(status_code=400, detail=dados_xml["erro"])
    
    # Auditoria: Verifica se o código de serviço está permitido
    codigo_servico = dados_xml['codigo_servico']
    cnaes_permitidos = empresa.get("cnaes_permitidos", [])
    
    cnae_encontrado = None
    for cnae in cnaes_permitidos:
        if cnae.get("codigo_servico_municipal") == codigo_servico:
            cnae_encontrado = cnae
            break
    
    status = "APROVADA"
    mensagem = "Nota fiscal em conformidade"
    
    if not cnae_encontrado:
        status = "ERRO_CNAE"
        mensagem = f"Código de serviço '{codigo_servico}' não autorizado para este CNPJ"
    
    # Salva a nota
    nota_doc = {
        "empresa_id": empresa_id,
        "numero_nota": dados_xml['numero_nota'],
        "data_emissao": dados_xml['data_emissao'],
        "chave_validacao": dados_xml.get('chave_validacao'),
        "cnpj_tomador": dados_xml.get('cnpj_tomador'),
        "codigo_servico_utilizado": codigo_servico,
        "valor_total": dados_xml['valor_total'],
        "status_auditoria": status,
        "mensagem_erro": mensagem,
        "data_importacao": datetime.utcnow().isoformat()
    }
    
    result = await db.notas_fiscais.insert_one(nota_doc)
    
    # Retorna a nota sem o _id do MongoDB
    return {
        "id": str(result.inserted_id),
        "numero_nota": nota_doc["numero_nota"],
        "data_emissao": nota_doc["data_emissao"],
        "codigo_servico_utilizado": nota_doc["codigo_servico_utilizado"],
        "valor_total": nota_doc["valor_total"],
        "status_auditoria": nota_doc["status_auditoria"],
        "mensagem_erro": nota_doc["mensagem_erro"],
        "chave_validacao": nota_doc.get("chave_validacao"),
        "cnpj_tomador": nota_doc.get("cnpj_tomador"),
        "data_importacao": nota_doc["data_importacao"]
    }

@app.get("/api/notas/empresa/{empresa_id}")
async def listar_notas_empresa(empresa_id: str, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    
    # Verifica se a empresa pertence ao usuário
    try:
        empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    if str(empresa.get("usuario_id")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Lista as notas
    notas = []
    async for nota in db.notas_fiscais.find({"empresa_id": empresa_id}):
        notas.append({
            "id": str(nota["_id"]),
            "numero_nota": nota["numero_nota"],
            "data_emissao": nota["data_emissao"],
            "codigo_servico_utilizado": nota["codigo_servico_utilizado"],
            "valor_total": nota["valor_total"],
            "status_auditoria": nota["status_auditoria"],
            "mensagem_erro": nota.get("mensagem_erro"),
            "data_importacao": nota["data_importacao"]
        })
    
    return notas

@app.get("/api/notas/estatisticas/{empresa_id}")
async def obter_estatisticas(empresa_id: str, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    
    # Verifica acesso
    try:
        empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if not empresa or str(empresa.get("usuario_id")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Estatísticas
    total = await db.notas_fiscais.count_documents({"empresa_id": empresa_id})
    aprovadas = await db.notas_fiscais.count_documents({"empresa_id": empresa_id, "status_auditoria": "APROVADA"})
    erros = await db.notas_fiscais.count_documents({"empresa_id": empresa_id, "status_auditoria": {"$ne": "APROVADA"}})
    
    # Valor total
    pipeline = [
        {"$match": {"empresa_id": empresa_id}},
        {"$group": {"_id": None, "total": {"$sum": "$valor_total"}}}
    ]
    
    resultado = await db.notas_fiscais.aggregate(pipeline).to_list(1)
    valor_total = resultado[0]["total"] if resultado else 0
    
    return {
        "total_notas": total,
        "aprovadas": aprovadas,
        "com_erros": erros,
        "valor_total": valor_total
    }

# ==================== ROTA HOME ====================
@app.get("/")
async def home():
    return {
        "mensagem": "Fiscal Fácil API v2.0 - Sistema de Auditoria Fiscal 🚀",
        "status": "online"
    }

@app.get("/api/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")
