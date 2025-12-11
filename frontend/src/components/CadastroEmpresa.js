import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const CadastroEmpresa = ({ onEmpresaCadastrada }) => {
  const [step, setStep] = useState(1);
  const [cnpj, setCnpj] = useState('');
  const [dadosReceita, setDadosReceita] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    regime_tributario: 'Simples Nacional',
    cnaes_permitidos: []
  });

  // Função para aplicar máscara de CNPJ
  const aplicarMascaraCNPJ = (valor) => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, '');
    
    // Aplica a máscara progressivamente
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 5) {
      return numeros.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    } else if (numeros.length <= 8) {
      return numeros.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (numeros.length <= 12) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    }
  };

  // Remove máscara do CNPJ (apenas números)
  const limparCNPJ = (valor) => {
    return valor.replace(/\D/g, '');
  };

  // Handler para mudança no campo CNPJ
  const handleCnpjChange = (e) => {
    const valorDigitado = e.target.value;
    const valorFormatado = aplicarMascaraCNPJ(valorDigitado);
    setCnpj(valorFormatado);
  };

  const consultarCNPJ = async () => {
    setError('');
    setLoading(true);
    
    // Remove a máscara antes de enviar
    const cnpjLimpo = limparCNPJ(cnpj);
    
    // Validação básica
    if (cnpjLimpo.length !== 14) {
      setError('CNPJ inválido. Digite 14 números.');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/empresas/consulta/${cnpjLimpo}`);
      setDadosReceita(response.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao consultar CNPJ');
    } finally {
      setLoading(false);
    }
  };

  const adicionarCNAE = () => {
    setFormData({
      ...formData,
      cnaes_permitidos: [
        ...formData.cnaes_permitidos,
        { cnae_codigo: '', codigo_servico_municipal: '', descricao: '' }
      ]
    });
  };

  const removerCNAE = (index) => {
    const novosCAEs = formData.cnaes_permitidos.filter((_, i) => i !== index);
    setFormData({ ...formData, cnaes_permitidos: novosCAEs });
  };

  const atualizarCNAE = (index, campo, valor) => {
    const novosCAEs = [...formData.cnaes_permitidos];
    novosCAEs[index][campo] = valor;
    setFormData({ ...formData, cnaes_permitidos: novosCAEs });
  };

  const cadastrarEmpresa = async () => {
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/empresas`, {
        cnpj: dadosReceita.cnpj,
        razao_social: dadosReceita.razao_social,
        nome_fantasia: dadosReceita.nome_fantasia,
        regime_tributario: formData.regime_tributario,
        data_abertura: null,
        cnaes_permitidos: formData.cnaes_permitidos
      });
      onEmpresaCadastrada();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao cadastrar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-6">
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Consultar CNPJ</h3>
          <div className="flex gap-3">
            <input
              data-testid="input-cnpj"
              type="text"
              value={cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00"
              maxLength="18"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              data-testid="btn-consultar-cnpj"
              onClick={consultarCNPJ}
              disabled={loading || !cnpj}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}

      {step === 2 && dadosReceita && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Dados da Empresa</h3>
          <div className="bg-white p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Razão Social:</strong> {dadosReceita.razao_social}</p>
            <p className="mb-2"><strong>Nome Fantasia:</strong> {dadosReceita.nome_fantasia || 'N/A'}</p>
            <p className="mb-2"><strong>CNPJ:</strong> {dadosReceita.cnpj}</p>
            <p className="mb-2"><strong>CNAE Principal:</strong> {dadosReceita.cnae_principal}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Regime Tributário</label>
            <select
              data-testid="select-regime"
              value={formData.regime_tributario}
              onChange={(e) => setFormData({ ...formData, regime_tributario: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="MEI">MEI</option>
              <option value="Simples Nacional">Simples Nacional</option>
              <option value="Lucro Presumido">Lucro Presumido</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">CNAEs Permitidos (Códigos de Serviço)</label>
              <button
                data-testid="btn-adicionar-cnae"
                onClick={adicionarCNAE}
                className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                + Adicionar
              </button>
            </div>

            {formData.cnaes_permitidos.map((cnae, index) => (
              <div key={index} className="bg-white p-3 rounded-lg mb-2 border">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    data-testid={`input-cnae-codigo-${index}`}
                    type="text"
                    placeholder="CNAE (ex: 6201-5/00)"
                    value={cnae.cnae_codigo}
                    onChange={(e) => atualizarCNAE(index, 'cnae_codigo', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    data-testid={`input-codigo-servico-${index}`}
                    type="text"
                    placeholder="Cód. Serviço (ex: 08.02)"
                    value={cnae.codigo_servico_municipal}
                    onChange={(e) => atualizarCNAE(index, 'codigo_servico_municipal', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    data-testid={`btn-remover-cnae-${index}`}
                    onClick={() => removerCNAE(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Remover
                  </button>
                </div>
                <input
                  data-testid={`input-descricao-${index}`}
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={cnae.descricao}
                  onChange={(e) => atualizarCNAE(index, 'descricao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}

            {formData.cnaes_permitidos.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum CNAE adicionado. Clique em "+ Adicionar"</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              data-testid="btn-voltar"
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Voltar
            </button>
            <button
              data-testid="btn-cadastrar"
              onClick={cadastrarEmpresa}
              disabled={loading || formData.cnaes_permitidos.length === 0}
              className="flex-1 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Empresa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastroEmpresa;