import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const UploadXML = ({ empresaId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.xml')) {
      setFile(selectedFile);
      setError('');
      setResultado(null);
    } else {
      setError('Por favor, selecione um arquivo XML válido');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecione um arquivo primeiro');
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${API_URL}/api/notas/importar/${empresaId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setResultado(response.data);
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao processar XML');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">📄 Importar Nota Fiscal (XML)</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione o arquivo XML da nota fiscal
        </label>
        <input
          id="file-input"
          data-testid="input-xml-file"
          type="file"
          accept=".xml"
          onChange={handleFileChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        data-testid="btn-upload-xml"
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processando...' : 'Processar e Auditar'}
      </button>

      {error && (
        <div data-testid="upload-error" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {resultado && (
        <div data-testid="upload-result" className="mt-4 p-4 border rounded-lg ${
          resultado.status_auditoria === 'APROVADA' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">
              {resultado.status_auditoria === 'APROVADA' ? '✅ Nota Aprovada' : '❌ Nota com Erros'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              resultado.status_auditoria === 'APROVADA' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}>
              {resultado.status_auditoria}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <p><strong>Número da Nota:</strong> {resultado.numero_nota}</p>
            <p><strong>Data de Emissão:</strong> {new Date(resultado.data_emissao).toLocaleDateString('pt-BR')}</p>
            <p><strong>Código de Serviço:</strong> {resultado.codigo_servico_utilizado}</p>
            <p><strong>Valor Total:</strong> R$ {resultado.valor_total?.toFixed(2)}</p>
            {resultado.mensagem_erro && (
              <p className="mt-2 p-2 bg-white rounded border">
                <strong>Mensagem:</strong> {resultado.mensagem_erro}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadXML;