import os
import streamlit as st
import requests
import pandas as pd
from datetime import datetime

# Tenta pegar dos segredos do Streamlit, se não achar, usa local
if "API_URL" in st.secrets:
    API_URL = st.secrets["API_URL"]
else:
    API_URL = "http://127.0.0.1:8000"

# Configuração da Página
st.set_page_config(page_title="Audit Contábil POC", layout="wide", page_icon="📊")

# Endereço da sua API (Backend)
API_URL = "http://127.0.0.1:8000"

st.title("📊 Painel de Auditoria Fiscal - POC")
st.markdown("---")

# --- BARRA LATERAL (Simulando o login da Maria Neide) ---
st.sidebar.header("Configuração")
escritorio_id = st.sidebar.number_input("ID do Escritório", value=1)
empresa_id = st.sidebar.number_input("ID da Empresa Cliente", value=3)

# --- ABA 1: IMPORTAÇÃO ---
tab1, tab2 = st.tabs(["📂 Importar XML", "📋 Auditoria de Notas"])

with tab1:
    st.header("Upload de Notas Fiscais (Prefeitura)")
    uploaded_file = st.file_uploader("Arraste o XML da nota aqui", type=["xml"])
    
    if uploaded_file is not None:
        if st.button("Processar e Auditar"):
            with st.spinner("Lendo XML e validando regras..."):
                try:
                    # Envia para a API que criamos
                    files = {"file": (uploaded_file.name, uploaded_file, "text/xml")}
                    response = requests.post(f"{API_URL}/notas/importar/{empresa_id}", files=files)
                    
                    if response.status_code == 200:
                        dados = response.json()
                        st.success(f"✅ Nota {dados['numero_nota']} processada com sucesso!")
                        
                        # Mostra o Veredito
                        status = dados['status_auditoria']
                        if status == "APROVADA":
                            st.info("🟢 Status: APROVADA - Nenhum erro encontrado.")
                        elif status == "ERRO_CNAE":
                            st.error(f"🔴 Status: {status}")
                            st.warning(f"Motivo: {dados['mensagem_erro']}")
                        
                        st.json(dados) # Mostra os dados técnicos
                    else:
                        st.error(f"Erro na API: {response.text}")
                        
                except Exception as e:
                    st.error(f"Erro de conexão: {e}")

# --- ABA 2: RELATÓRIO ---
with tab2:
    st.header(f"Notas da Empresa ID {empresa_id}")
    
    if st.button("Atualizar Lista"):
        try:
            response = requests.get(f"{API_URL}/notas/empresa/{empresa_id}")
            if response.status_code == 200:
                notas = response.json()
                if notas:
                    # Cria um DataFrame para mostrar bonitinho
                    df = pd.DataFrame(notas)
                    
                    # Seleciona e renomeia colunas
                    df_view = df[['numero_nota', 'data_emissao', 'codigo_servico_utilizado', 'valor_total', 'status_auditoria', 'mensagem_erro']]
                    df_view.columns = ['Nota', 'Emissão', 'Cód. Serviço', 'Valor (R$)', 'Status', 'Detalhes']
                    
                    # Formatação Visual (Semáforo)
                    def color_status(val):
                        color = '#d4edda' if val == 'APROVADA' else '#f8d7da' # Verde ou Vermelho claro
                        return f'background-color: {color}'

                    st.dataframe(df_view.style.applymap(color_status, subset=['Status']), use_container_width=True)
                else:
                    st.info("Nenhuma nota importada para esta empresa ainda.")
            else:
                st.error("Erro ao buscar notas.")
        except Exception as e:
            st.error(f"Erro de conexão: {e}")