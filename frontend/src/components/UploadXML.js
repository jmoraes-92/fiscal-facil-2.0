import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const UploadXML = ({ empresaId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const xmlFiles = selectedFiles.filter(f => f.name.endsWith('.xml'));
    
    if (xmlFiles.length === 0) {
      setError('Por favor, selecione apenas arquivos XML válidos');
      setFiles([]);
      return;
    }
    
    if (xmlFiles.length > 100) {
      setError('Máximo de 100 arquivos por upload');
      setFiles([]);
      return;
    }
    
    setFiles(xmlFiles);
    setError('');
    setResultado(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Selecione pelo menos um arquivo');
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);
    setProgresso({ atual: 0, total: files.length });

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      let endpoint = `${API_URL}/api/notas/importar/${empresaId}`;
      
      // Se múltiplos arquivos, usa endpoint de lote
      if (files.length > 1) {
        endpoint = `${API_URL}/api/notas/importar-lote/${empresaId}`;
      } else {
        // Upload único - usa endpoint antigo
        formData.delete('files');
        formData.append('file', files[0]);
      }

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResultado(files.length > 1 ? response.data : { 
        total_arquivos: 1, 
        sucesso: 1, 
        falhas: 0, 
        nota: response.data 
      });
      
      setFiles([]);
      document.getElementById('file-input').value = '';
      
      // Callback para atualizar a lista de notas
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao processar arquivos');
    } finally {
      setLoading(false);
      setProgresso(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        📄 Importar Nota(s) Fiscal(is) (XML)
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione um ou mais arquivos XML
        </label>
        <input
          id="file-input"
          data-testid="input-xml-file"
          type="file"
          accept=".xml"
          multiple
          onChange={handleFileChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {files.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            📎 {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <button
        data-testid="btn-upload-xml"
        onClick={handleUpload}
        disabled={files.length === 0 || loading}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando {files.length > 1 ? `${files.length} arquivos` : 'arquivo'}...
          </span>
        ) : (
          `🚀 ${files.length > 1 ? 'Processar em Lote' : 'Processar e Auditar'}`
        )}
      </button>

      {error && (
        <div data-testid="upload-error" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {resultado && (
        <div data-testid="upload-result" className="mt-4">
          {/* Resumo do Upload em Lote */}
          {resultado.total_arquivos > 1 ? (
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-lg mb-3 text-blue-900">
                📊 Resumo do Processamento em Lote
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{resultado.total_arquivos}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                  <p className="text-sm text-green-700">✅ Sucesso</p>
                  <p className="text-2xl font-bold text-green-700">{resultado.sucesso}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
                  <p className="text-sm text-red-700">❌ Falhas</p>
                  <p className="text-2xl font-bold text-red-700">{resultado.falhas}</p>
                </div>
              </div>

              {resultado.falhas > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="font-semibold text-red-900 mb-2">Arquivos com Erro:</p>
                  <ul className="space-y-1">
                    {resultado.detalhes_falhas.map((falha, idx) => (
                      <li key={idx} className="text-sm text-red-700">
                        <strong>{falha.arquivo}:</strong> {falha.erro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  ✅ <strong>{resultado.sucesso}</strong> nota{resultado.sucesso !== 1 ? 's' : ''} 
                  importada{resultado.sucesso !== 1 ? 's' : ''} e auditada{resultado.sucesso !== 1 ? 's' : ''} com sucesso!
                </p>
              </div>
            </div>
          ) : (
            /* Resultado de Upload Único */
            resultado.nota && (
              <div className={`p-4 border rounded-lg ${
                resultado.nota.status_auditoria === 'APROVADA' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {resultado.nota.status_auditoria === 'APROVADA' ? '✅ Nota Aprovada' : '❌ Nota com Erros'}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    resultado.nota.status_auditoria === 'APROVADA' 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {resultado.nota.status_auditoria}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Número da Nota:</strong> {resultado.nota.numero_nota}</p>
                  <p><strong>Data de Emissão:</strong> {new Date(resultado.nota.data_emissao).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Código de Serviço:</strong> {resultado.nota.codigo_servico_utilizado}</p>
                  <p><strong>Valor Total:</strong> R$ {resultado.nota.valor_total?.toFixed(2)}</p>
                  {resultado.nota.mensagem_erro && (
                    <p className="mt-2 p-2 bg-white rounded border">
                      <strong>Mensagem:</strong> {resultado.nota.mensagem_erro}
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default UploadXML;
