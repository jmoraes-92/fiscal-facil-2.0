# 📄 Exemplos de XML para Teste

Este guia fornece exemplos de arquivos XML de notas fiscais para você testar a funcionalidade de upload e auditoria.

## 📋 Formato Esperado

O sistema espera XMLs de notas fiscais de serviço no formato da prefeitura com a seguinte estrutura:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tbnfd>
  <nfdok>
    <NewDataSet>
      <NOTA_FISCAL>
        <NumeroNota>123</NumeroNota>
        <DataEmissao>2024-12-11T10:30:00</DataEmissao>
        <Cae>08.02</Cae>
        <ValorTotalNota>1500.00</ValorTotalNota>
        <ChaveValidacao>ABC123XYZ</ChaveValidacao>
        <ClienteCNPJCPF>12345678901234</ClienteCNPJCPF>
      </NOTA_FISCAL>
    </NewDataSet>
  </nfdok>
</tbnfd>
```

## ✅ Exemplo 1: Nota Fiscal que será APROVADA

**Arquivo:** `nota_aprovada.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tbnfd>
  <nfdok>
    <NewDataSet>
      <NOTA_FISCAL>
        <NumeroNota>12345</NumeroNota>
        <DataEmissao>2024-12-11T10:30:00</DataEmissao>
        <Cae>08.02</Cae>
        <ValorTotalNota>2500.00</ValorTotalNota>
        <ChaveValidacao>ABC123XYZ789</ChaveValidacao>
        <ClienteCNPJCPF>12345678901234</ClienteCNPJCPF>
      </NOTA_FISCAL>
    </NewDataSet>
  </nfdok>
</tbnfd>
```

**Pré-requisito:** A empresa deve ter o código de serviço `08.02` cadastrado nos CNAEs permitidos.

**Resultado esperado:**
- ✅ Status: APROVADA
- Mensagem: "Nota fiscal em conformidade"
- Card verde no frontend

---

## ❌ Exemplo 2: Nota Fiscal com ERRO_CNAE

**Arquivo:** `nota_erro_cnae.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tbnfd>
  <nfdok>
    <NewDataSet>
      <NOTA_FISCAL>
        <NumeroNota>54321</NumeroNota>
        <DataEmissao>2024-12-11T14:00:00</DataEmissao>
        <Cae>07.05</Cae>
        <ValorTotalNota>1800.00</ValorTotalNota>
        <ChaveValidacao>XYZ789ABC123</ChaveValidacao>
        <ClienteCNPJCPF>98765432101234</ClienteCNPJCPF>
      </NOTA_FISCAL>
    </NewDataSet>
  </nfdok>
</tbnfd>
```

**Condição:** Use um código de serviço (`07.05`) que NÃO esteja cadastrado nos CNAEs permitidos da empresa.

**Resultado esperado:**
- ❌ Status: ERRO_CNAE
- Mensagem: "Código de serviço '07.05' não autorizado para este CNPJ"
- Card vermelho no frontend

---

## 📊 Exemplo 3: Nota Fiscal de Alto Valor

**Arquivo:** `nota_alto_valor.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tbnfd>
  <nfdok>
    <NewDataSet>
      <NOTA_FISCAL>
        <NumeroNota>99999</NumeroNota>
        <DataEmissao>2024-12-11T16:45:00</DataEmissao>
        <Cae>08.02</Cae>
        <ValorTotalNota>50000.00</ValorTotalNota>
        <ChaveValidacao>ALTO123VAL456</ChaveValidacao>
        <ClienteCNPJCPF>11223344556677</ClienteCNPJCPF>
      </NOTA_FISCAL>
    </NewDataSet>
  </nfdok>
</tbnfd>
```

---

## 🔧 Como Testar

### Opção 1: Via Interface Web

1. **Acesse:** https://3ed59a27-aeea-41bb-b1e0-3cb93167cfe4.preview.emergentagent.com

2. **Faça login** ou registre-se

3. **Cadastre uma empresa:**
   - Clique em "+ Nova Empresa"
   - Consulte um CNPJ válido
   - Adicione um CNAE com código de serviço `08.02`
   - Cadastre a empresa

4. **Prepare o XML:**
   - Copie um dos exemplos acima
   - Cole em um editor de texto (Notepad, VS Code, etc)
   - Salve como `nota_teste.xml`

5. **Faça o upload:**
   - Selecione a empresa cadastrada
   - Na seção "Importar Nota Fiscal (XML)", clique em "Escolher arquivo"
   - Selecione o arquivo `nota_teste.xml`
   - Clique em "Processar e Auditar"

6. **Verifique o resultado:**
   - ✅ Verde = Aprovada
   - ❌ Vermelho = Erro

### Opção 2: Via API (cURL)

```bash
# 1. Faça login e obtenha o token
TOKEN=$(curl -s -X POST https://3ed59a27-aeea-41bb-b1e0-3cb93167cfe4.preview.emergentagent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","senha":"suasenha"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 2. Obtenha o ID da empresa
curl -X GET https://3ed59a27-aeea-41bb-b1e0-3cb93167cfe4.preview.emergentagent.com/api/empresas \
  -H "Authorization: Bearer $TOKEN"

# 3. Faça o upload do XML (substitua EMPRESA_ID)
curl -X POST "https://3ed59a27-aeea-41bb-b1e0-3cb93167cfe4.preview.emergentagent.com/api/notas/importar/EMPRESA_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@nota_teste.xml"
```

---

## 📝 Campos do XML

| Campo | Descrição | Obrigatório | Exemplo |
|-------|-----------|-------------|---------|
| `NumeroNota` | Número da nota fiscal | Sim | `12345` |
| `DataEmissao` | Data de emissão (ISO) | Sim | `2024-12-11T10:30:00` |
| `Cae` | Código de serviço municipal | Sim | `08.02` |
| `ValorTotalNota` | Valor total da nota | Sim | `2500.00` |
| `ChaveValidacao` | Chave de validação | Não | `ABC123XYZ789` |
| `ClienteCNPJCPF` | CNPJ/CPF do tomador | Não | `12345678901234` |

---

## 🎯 Códigos de Serviço Comuns

| Código | Descrição |
|--------|-----------|
| `01.01` | Análise e desenvolvimento de sistemas |
| `01.02` | Programação |
| `01.03` | Processamento de dados |
| `08.02` | Desenho técnico |
| `10.01` | Agenciamento, corretagem ou intermediação |
| `17.01` | Assessoria ou consultoria |

**Importante:** Para a nota ser aprovada, o código de serviço usado no XML **deve estar** cadastrado nos CNAEs permitidos da empresa.

---

## 🐛 Troubleshooting

### Erro: "Layout de XML desconhecido"

**Causa:** O XML não está no formato esperado.

**Solução:** Certifique-se de que o XML segue a estrutura:
```
<tbnfd>
  <nfdok>
    <NewDataSet>
      <NOTA_FISCAL>
        ...
      </NOTA_FISCAL>
    </NewDataSet>
  </nfdok>
</tbnfd>
```

### Erro: "Código de serviço não autorizado"

**Causa:** O código `Cae` do XML não está nos CNAEs permitidos da empresa.

**Solução:** 
1. Edite a empresa e adicione o código de serviço
2. Ou use um código que já esteja cadastrado (ex: `08.02`)

### Erro: "Falha ao processar XML"

**Causa:** XML malformado ou com encoding incorreto.

**Solução:**
1. Valide o XML em um validador online
2. Certifique-se de que está usando UTF-8 ou ISO-8859-1
3. Verifique se não há caracteres especiais problemáticos

---

## 📚 Próximos Passos

Após testar os exemplos:
1. Use XMLs reais de notas fiscais da sua prefeitura
2. Configure os CNAEs corretos para cada empresa cliente
3. Monitore as estatísticas no dashboard
4. Exporte relatórios de conformidade

---

**Exemplos testados e funcionando! 🎉**

Para criar seus próprios XMLs de teste, basta seguir a estrutura acima e ajustar os valores conforme necessário.
