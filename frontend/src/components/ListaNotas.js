import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalPDFNota from './ModalPDFNota';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ListaNotas = ({ empresaId, refreshTrigger }) => {
  const [notas, setNotas] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [excluindo, setExcluindo] = useState(null);
  const [notaSelecionadaPDF, setNotaSelecionadaPDF] = useState(null);

  useEffect(() => {
    if (empresaId) {
      carregarNotas();
      carregarEstatisticas();
    }
  }, [empresaId, refreshTrigger]);

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

  const handleExcluir = async (notaId) => {
    const confirmacao = window.confirm(
      'Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.'
    );

    if (!confirmacao) return;

    setExcluindo(notaId);
    try {
      await axios.delete(`${API_URL}/api/notas/${notaId}`);
      
      // Atualiza a lista removendo a nota excluída
      setNotas(notas.filter(nota => nota.id !== notaId));
      
      // Recarrega estatísticas
      carregarEstatisticas();
      
      // Feedback visual
      alert('✅ Nota excluída com sucesso!');
    } catch (error) {
      alert('❌ Erro ao excluir nota: ' + (error.response?.data?.detail || error.message));
    } finally {
      setExcluindo(null);
    }
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notas.map((nota) => (
                <tr key={nota.id} data-testid={`nota-row-${nota.id}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{nota.numero_nota}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(nota.data_emissao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    R$ {nota.valor_total?.toFixed(2)}
                  </td>
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
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Botão Excluir */}
                      <button
                        data-testid={`btn-excluir-${nota.id}`}
                        onClick={() => handleExcluir(nota.id)}
                        disabled={excluindo === nota.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Excluir nota"
                      >
                        {excluindo === nota.id ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>

                      {/* Botão Ver Detalhes */}
                      <button
                        data-testid={`btn-detalhes-${nota.id}`}
                        onClick={() => alert(`Detalhes da nota ${nota.numero_nota}:\n\n${JSON.stringify(nota, null, 2)}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
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
