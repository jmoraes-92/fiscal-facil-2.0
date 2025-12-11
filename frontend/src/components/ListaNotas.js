import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ListaNotas = ({ empresaId }) => {
  const [notas, setNotas] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarNotas();
    carregarEstatisticas();
  }, [empresaId]);

  const carregarNotas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notas/empresa/${empresaId}`);
      setNotas(response.data);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notas/estatisticas/${empresaId}`);
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const atualizarLista = () => {
    carregarNotas();
    carregarEstatisticas();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">Carregando notas...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">📋 Notas Fiscais</h2>
        <button
          data-testid="btn-atualizar-notas"
          onClick={atualizarLista}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {estatisticas && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total de Notas</p>
            <p className="text-2xl font-bold text-blue-600">{estatisticas.total_notas}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Aprovadas</p>
            <p className="text-2xl font-bold text-green-600">{estatisticas.aprovadas}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Com Erros</p>
            <p className="text-2xl font-bold text-red-600">{estatisticas.com_erros}</p>
          </div>
        </div>
      )}

      {notas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">📄 Nenhuma nota importada</p>
          <p className="text-sm">Faça o upload de um arquivo XML para começar</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notas.map((nota) => (
                <tr key={nota.id} data-testid={`nota-row-${nota.id}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{nota.numero_nota}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(nota.data_emissao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm">R$ {nota.valor_total?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        nota.status_auditoria === 'APROVADA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {nota.status_auditoria === 'APROVADA' ? '✅ Aprovada' : '❌ Erro'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListaNotas;