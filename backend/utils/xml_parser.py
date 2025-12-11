import xmltodict
from datetime import datetime
from decimal import Decimal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_xml_nota(conteudo_arquivo: bytes):
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

        data_bruta = nota_dict['DataEmissao'] 
        data_limpa = data_bruta[:10] 
        data_formatada = datetime.strptime(data_limpa, '%Y-%m-%d')

        valor_bruto = nota_dict.get('ValorTotalNota', '0')
        if not valor_bruto:
            valor_bruto = '0'
        
        valor_decimal = float(Decimal(valor_bruto))

        dados_nota = {
            "numero_nota": int(nota_dict['NumeroNota']),
            "data_emissao": data_formatada.isoformat(),
            "codigo_servico": nota_dict.get('Cae'),
            "valor_total": valor_decimal,
            "chave_validacao": nota_dict.get('ChaveValidacao'),
            "cnpj_tomador": nota_dict.get('ClienteCNPJCPF'),
            "xml_bruto": xml_string
        }
        
        return dados_nota

    except Exception as e:
        logger.error(f"Erro ao ler XML: {str(e)}")
        return {"erro": f"Falha ao processar XML: {str(e)}"}