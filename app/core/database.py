from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Tenta carregar variáveis de ambiente (caso use arquivo .env)
load_dotenv()

# --- CONFIGURAÇÃO DO BANCO DE DADOS ---
# Se o seu usuário não for 'root', altere aqui.
DB_USER = "root"
# COLOQUE SUA SENHA ABAIXO ENTRE AS ASPAS
DB_PASSWORD = "1234" 
DB_HOST = "localhost"
DB_NAME = "audit_contabil_poc"

# String de conexão
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

# Cria a engine de conexão
engine = create_engine(SQLALCHEMY_DATABASE_URL,
pool_pre_ping=True,
pool_recycle=3600)

# Cria a sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependência para pegar o banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()