import xmltodict
from datetime import datetime
from decimal import Decimal # <--- IMPORTANTE: Importar Decimal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ler_xml_nota(conteudo_arquivo: bytes):
    try:
        try:
            xml_string = conteudo_arquivo.decode('utf-8')
        except UnicodeDecodeError:
            xml_string = conteudo_arquivo.decode('iso-8859-1')

        doc = xmltodict.parse(xml_string)
        
        try:
            nota_dict = doc['tbnfd']['nfdok']['NewDataSet']['NOTA_FISCAL']
        except KeyError:
            return {"erro": "Layout de XML desconhecido. Verifique se é um XML de nota fiscal de serviço."}

        # Tratamento de Data
        data_bruta = nota_dict['DataEmissao'] 
        data_limpa = data_bruta[:10] 
        data_formatada = datetime.strptime(data_limpa, '%Y-%m-%d')

        # --- CORREÇÃO AQUI ---
        # Convertendo direto para Decimal (como string), nunca como float
        valor_bruto = nota_dict.get('ValorTotalNota', '0')
        if not valor_bruto:
            valor_bruto = '0'
        
        valor_decimal = Decimal(valor_bruto)
        # ---------------------

        dados_nota = {
            "numero_nota": int(nota_dict['NumeroNota']),
            "data_emissao": data_formatada,
            "codigo_servico": nota_dict.get('Cae'),
            "valor_total": valor_decimal, # Passamos o Decimal limpo
            "chave_validacao": nota_dict.get('ChaveValidacao'),
            "cnpj_tomador": nota_dict.get('ClienteCNPJCPF'),
            "xml_bruto": xml_string
        }
        
        return dados_nota

    except Exception as e:
        logger.error(f"Erro crítico ao ler XML: {str(e)}")
        return {"erro": f"Falha técnica ao ler XML: {str(e)}"}