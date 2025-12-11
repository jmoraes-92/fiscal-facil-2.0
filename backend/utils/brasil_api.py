import requests
from fastapi import HTTPException
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def consultar_cnpj(cnpj: str):
    cnpj_limpo = "".join([n for n in cnpj if n.isdigit()])
    
    try:
        logger.info(f"Consultando CNPJ {cnpj_limpo} na BrasilAPI...")
        url = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            dados = response.json()
            cnae_principal = dados.get("cnae_fiscal_principal")
            cnae_codigo = cnae_principal.get("codigo") if cnae_principal else None
            
            cnaes_sec = []
            for c in dados.get("cnaes_secundarios", []):
                if isinstance(c, dict):
                    cnaes_sec.append(c.get("codigo", ""))
            
            return {
                "cnpj": cnpj_limpo,
                "razao_social": dados.get("razao_social"),
                "nome_fantasia": dados.get("nome_fantasia"),
                "logradouro": f"{dados.get('logradouro')}, {dados.get('numero')}",
                "bairro": dados.get("bairro"),
                "municipio": dados.get("municipio"),
                "uf": dados.get("uf"),
                "cnae_principal": cnae_codigo,
                "cnaes_secundarios": cnaes_sec
            }
        else:
            logger.warning(f"BrasilAPI retornou status {response.status_code}")
            raise HTTPException(status_code=404, detail="CNPJ não encontrado")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Erro ao consultar CNPJ: {str(e)}")
        raise HTTPException(status_code=503, detail="Serviço de consulta indisponível")