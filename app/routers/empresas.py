from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.empresa_schema import EmpresaResponse, EmpresaSalvar
from app.services.brasil_api_service import consultar_cnpj_brasilapi
from app.models.all_models import EmpresaCliente, CnaePermitido

router = APIRouter(
    prefix="/empresas",
    tags=["Empresas"]
)

# 1. Rota de Consulta (Já testada)
@router.get("/consulta/{cnpj}", response_model=EmpresaResponse)
def preencher_cadastro_via_cnpj(cnpj: str):
    return consultar_cnpj_brasilapi(cnpj)

# 2. Rota de Cadastro (Nova!)
@router.post("/", status_code=201)
def cadastrar_empresa(empresa: EmpresaSalvar, db: Session = Depends(get_db)):
    # Verifica se já existe
    cnpj_limpo = "".join([n for n in empresa.cnpj if n.isdigit()])
    existente = db.query(EmpresaCliente).filter(EmpresaCliente.cnpj == cnpj_limpo).first()
    if existente:
        raise HTTPException(status_code=400, detail="Empresa já cadastrada.")

    # Cria a Empresa
    nova_empresa = EmpresaCliente(
        escritorio_id=empresa.escritorio_id,
        cnpj=cnpj_limpo,
        razao_social=empresa.razao_social,
        nome_fantasia=empresa.nome_fantasia,
        regime_tributario=empresa.regime_tributario,
        data_abertura=empresa.data_abertura,
        # Define limite MEI automático se for o caso (regra simples)
        limite_faturamento_anual=81000.00 if empresa.regime_tributario == 'MEI' else 4800000.00
    )
    
    db.add(nova_empresa)
    db.commit()
    db.refresh(nova_empresa)

    # Cria os CNAEs permitidos (O De/Para)
    for cnae in empresa.cnaes_mapeados:
        novo_cnae = CnaePermitido(
            empresa_id=nova_empresa.id,
            cnae_codigo=cnae.cnae_codigo,
            codigo_servico_municipal=cnae.codigo_servico_municipal, # O CRÍTICO: 08.02
            descricao=cnae.descricao
        )
        db.add(novo_cnae)
    
    db.commit()

    return {"mensagem": "Empresa cadastrada com sucesso!", "id": nova_empresa.id}