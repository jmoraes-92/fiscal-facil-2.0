from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import NotaFiscal, CnaePermitido, EmpresaCliente
from app.schemas.nota_schema import NotaFiscalResponse
from app.services.xml_service import ler_xml_nota
from typing import List

router = APIRouter(
    prefix="/notas",
    tags=["Notas Fiscais"]
)

@router.get("/empresa/{empresa_id}", response_model=List[NotaFiscalResponse])
def listar_notas_empresa(empresa_id: int, db: Session = Depends(get_db)):
    """
    Lista todas as notas fiscais importadas de uma empresa específica.
    Usado para preencher o Grid/Tabela do painel.
    """
    notas = db.query(NotaFiscal).filter(NotaFiscal.empresa_id == empresa_id).all()
    return notas

@router.post("/importar/{empresa_id}", response_model=NotaFiscalResponse)
async def importar_nota_xml(empresa_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Verifica se a empresa existe
    empresa = db.query(EmpresaCliente).filter(EmpresaCliente.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    # 2. Lê o arquivo XML
    conteudo = await file.read()
    dados_xml = ler_xml_nota(conteudo)
    
    if "erro" in dados_xml:
        raise HTTPException(status_code=400, detail=dados_xml["erro"])

    # 3. AUDITORIA: Verifica se o código de serviço (Ex: 08.02) está na lista de permitidos
    cnae_permitido = db.query(CnaePermitido).filter(
        CnaePermitido.empresa_id == empresa_id,
        CnaePermitido.codigo_servico_municipal == dados_xml['codigo_servico']
    ).first()

    status = "APROVADA"
    mensagem = "Nota fiscal em conformidade."

    if not cnae_permitido:
        status = "ERRO_CNAE"
        mensagem = f"Código de serviço '{dados_xml['codigo_servico']}' não autorizado para este CNPJ."

    # 4. Salva no Banco
    nova_nota = NotaFiscal(
        empresa_id=empresa_id,
        numero_nota=dados_xml['numero_nota'],
        data_emissao=dados_xml['data_emissao'],
        chave_validacao=dados_xml['chave_validacao'],
        cnpj_tomador=dados_xml['cnpj_tomador'],
        codigo_servico_utilizado=dados_xml['codigo_servico'],
        valor_total=dados_xml['valor_total'],
        status_auditoria=status,
        mensagem_erro=mensagem,
        xml_bruto=str(conteudo) # Simplificado para salvar
    )

    db.add(nova_nota)
    db.commit()
    db.refresh(nova_nota)

    return nova_nota