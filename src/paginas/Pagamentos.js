import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Pagamentos.css';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Modal from '../componentes/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const mockFormasPagamento = ['Cartão de Crédito', 'Débito', 'Pix', 'Dinheiro'];

function Pagamentos() {
  //Estados
  const [pacientes, setPacientes] = useState([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingParcelas, setLoadingParcelas] = useState(true); 
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('registrar'); 
  const [modoDeExibicao, setModoDeExibicao] = useState('lista'); 
  const [isAjudaOpen, setIsAjudaOpen] = useState(false); 
  const [parcelasPendentes, setParcelasPendentes] = useState([]);
  const [parcelasPagas, setParcelasPagas] = useState([]); 
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [recebimentoData, setRecebimentoData] = useState({
    data_recebimento: '',
    valor_recebido: '',
    tipo: '',
  });

  //Funções de Busca
  const fetchPacientes = useCallback(async () => {
    setLoadingPacientes(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token de autenticação não encontrado.');
      const response = await axios.get(`${API_BASE_URL}/api/pacientes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPacientes(response.data.results || response.data || []);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
      setError('Falha ao carregar pacientes.');
      if (err.response && err.response.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
        navigate('/login');
      }
    } finally {
      setLoadingPacientes(false);
    }
  }, [navigate]);

  const fetchParcelas = useCallback(async (pacienteId) => {
    setLoadingParcelas(true);
    setError(null);
    setSelectedParcela(null);
    setModoDeExibicao('lista');

    let url = `${API_BASE_URL}/api/parcelas/`;
    let params = {};

    if (pacienteId) {
      // Se um paciente é selecionado, buscamos TUDO dele
      params = { paciente_id: pacienteId };
    } else {
      // Se NENHUM paciente (visão geral), buscamos SÓ o que está pendente/atrasado de TODOS
      params = { status: ['Pendente', 'Atrasado'] };
      setParcelasPagas([]); // Limpa o histórico
      setAbaAtiva('registrar'); // Força a aba de registro
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token não encontrado.');

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: params,
        paramsSerializer: {
          serialize: (params) => {
            const parts = [];
            for (const key in params) {
              const value = params[key];
              if (Array.isArray(value)) {
                value.forEach(val => {
                  parts.push(`${key}=${encodeURIComponent(val)}`);
                });
              } else {
                parts.push(`${key}=${encodeURIComponent(value)}`);
              }
            }
            return parts.join('&');
          }
        }
      });

      const todasParcelas = response.data.results || response.data || [];

      if (pacienteId) {
        // Se filtramos por paciente, separamos pagos e pendentes
        const pendentes = todasParcelas.filter(p => p.status === 'Pendente' || p.status === 'Atrasado');
        const pagas = todasParcelas.filter(p => p.status === 'Pago');
        setParcelasPendentes(pendentes);
        setParcelasPagas(pagas);
      } else {
        // Se não filtramos (visão geral), todos são pendentes
        setParcelasPendentes(todasParcelas);
        setParcelasPagas([]); // Garante que o histórico está vazio
      }

    } catch (err) {
      console.error('Erro ao buscar parcelas:', err);
      setError('Falha ao carregar parcelas.');
      setParcelasPendentes([]);
      setParcelasPagas([]);
      if (err.response && err.response.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
        navigate('/login');
      }
    } finally {
      setLoadingParcelas(false);
    }
  }, [navigate]);
  
  useEffect(() => {
    fetchPacientes();
    fetchParcelas(null); 
  }, [fetchPacientes, fetchParcelas]); 

  const handlePacienteChange = (e) => {
    const pacienteId = e.target.value;
    setSelectedPacienteId(pacienteId);
    fetchParcelas(pacienteId || null);
  };

  const handleParcelaSelect = (parcela) => {
    setSelectedParcela(parcela);
    setRecebimentoData({
      valor_recebido: parseFloat(parcela.valor_parcela).toFixed(2),
      data_recebimento: format(new Date(), 'yyyy-MM-dd'),
      tipo: '',
    });
    setModoDeExibicao('formulario');
  };
  
  const handleRecebimentoInputChange = (e) => {
    const { name, value } = e.target;
    setRecebimentoData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSaveRecebimento = async (e) => {
    e.preventDefault();
    if (!selectedParcela) { alert('Selecione uma parcela...'); return; }
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id');
    if (!token || !userId) { alert('Erro de autenticação...'); navigate('/'); return; }
    if (!recebimentoData.data_recebimento || !recebimentoData.valor_recebido || !recebimentoData.tipo) { alert('Preencha todos os campos...'); return; }
    try {
      const dataParaBackend = {
        parcela: selectedParcela.id_parcela,
        usuario: parseInt(userId),
        data_recebimento: recebimentoData.data_recebimento,
        valor_recebido: parseFloat(recebimentoData.valor_recebido),
        tipo: recebimentoData.tipo,
      };
      await axios.post(`${API_BASE_URL}/api/recebimentos/`, dataParaBackend, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Recebimento registrado com sucesso!');
      
      fetchParcelas(selectedPacienteId || null); 

      setSelectedParcela(null);
      setRecebimentoData({ data_recebimento: '', valor_recebido: '', tipo: '' });
      setModoDeExibicao('lista'); 
    } catch (err) {
      let errorMessage = "Erro desconhecido.";
      if (err.response && err.response.data) {
          const responseData = err.response.data;
          console.error('Erro backend:', responseData);
          if (responseData.non_field_errors) { errorMessage = responseData.non_field_errors.join(' ');
          } else if (responseData.detail) { errorMessage = responseData.detail;
          } else { errorMessage = JSON.stringify(responseData); }
      } else { errorMessage = err.message; }
      alert(`Erro ao registrar recebimento: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handleCancelarSelecao = () => {
    setModoDeExibicao('lista');
    setSelectedParcela(null);
    setRecebimentoData({ data_recebimento: '', valor_recebido: '', tipo: '' });
    setError(null);
  };

  const formatDateBR = (dateString) => {
    // ... (código mantido) ...
    if (!dateString) return '-';
    try {
      return format(new Date(dateString + 'T00:00:00'), 'dd/MM/yyyy');
    } catch (e) { console.error("Erro formatando data:", dateString, e); return dateString; }
  };

  return (
    <div className="pagamentos-container">
      {/* 1. Seleção do Paciente / Filtro */}
      <div className="card-section">

        {/* --- CORREÇÃO: Título com espaçamento (sem botão) --- */}
        <h2 style={{marginTop: 0, marginBottom: '1.5rem'}}>Controle de Pagamentos</h2>

        {error && <p className="error-message">{error}</p>}

        {/* --- CORREÇÃO: Espaçamento (form-group já tem margin-bottom) --- */}
        <div className="form-group">
          <label 
            htmlFor="paciente"
            title="Filtre por um paciente específico ou veja as pendências de todos."
          >
            Filtrar por Paciente:
          </label>
          <select 
            id="paciente" 
            name="paciente" 
            value={selectedPacienteId} 
            onChange={handlePacienteChange} 
            className="select-field"
            title="Filtre por um paciente específico ou veja as pendências de todos."
          >
            <option value="">Todos os Pacientes (Visão Geral)</option>
            {loadingPacientes ? (
              <option disabled>Carregando pacientes...</option>
            ) : (
              pacientes.map(p => (<option key={p.id_paciente} value={p.id_paciente}>{p.nome}</option>))
            )}
          </select>
        </div>
      </div>

      {/* 2. Container das Abas */}
      <>
        {/* --- CORREÇÃO: Adicionado espaçamento (style) --- */}
        <div className="pagamentos-tabs-container" style={{marginTop: '1.5rem'}}>
          <button 
            className={`tab-button ${abaAtiva === 'registrar' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('registrar')}
            title="Clique aqui para ver as parcelas pendentes ou atrasadas."
          >
            {selectedPacienteId ? 'Pendentes do Paciente' : 'Visão Geral (Pendentes)'}
          </button>
          
          {selectedPacienteId && (
            <button 
              className={`tab-button ${abaAtiva === 'historico' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('historico')}
              title="Clique aqui para ver todas as parcelas que já foram pagas."
            >
              Histórico (Pagos)
            </button>
          )}
        </div>

        {loadingParcelas && <div className="loading-message">Buscando parcelas...</div>}

        {/* Aba 1: Registrar (Pendentes) */}
        <div style={{ display: abaAtiva === 'registrar' ? 'block' : 'none' }}>
          {modoDeExibicao === 'lista' && !loadingParcelas && (
            <div className="card-section">
              <h3>Parcelas Pendentes / Atrasadas</h3>
              <div className="parcelas-tabela-wrapper">
                <table className="parcelas-tabela">
                  <thead>
                    <tr>
                      <th>Selecionar</th>
                      {!selectedPacienteId && (<th>Paciente</th>)}
                      <th>ID Parcela</th>
                      <th>Vencimento</th>
                      <th>Valor (R$)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelasPendentes.length > 0 ? (
                      parcelasPendentes.map(parcela => (
                        <tr key={parcela.id_parcela}>
                          <td>
                            <button 
                              onClick={() => handleParcelaSelect(parcela)} 
                              className="button-select-parcela"
                              title="Clique para abrir o formulário de registro de pagamento para esta parcela."
                            >
                              Pagar
                            </button>
                          </td>
                          {!selectedPacienteId && (
                            <td>{parcela.orcamento?.paciente?.nome || 'Paciente não encontrado'}</td>
                          )}
                          <td>{parcela.id_parcela}</td>
                          <td>{formatDateBR(parcela.data_vencimento)}</td>
                          <td>{parseFloat(parcela.valor_parcela).toFixed(2)}</td>
                          <td>{parcela.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={!selectedPacienteId ? 7 : 6} style={{ textAlign: 'center' }}>
                          Nenhuma parcela pendente encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Formulário de Pagamento */}
          {modoDeExibicao === 'formulario' && selectedParcela && (
            <div className="card-section">
              <h3>Registrar Pagamento da Parcela</h3>
              <p style={{marginTop: '-1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#555'}}>
                   Vencimento: {formatDateBR(selectedParcela.data_vencimento)} 
                   {' - '}
                   Valor: R$ {parseFloat(selectedParcela.valor_parcela).toFixed(2)}
                </p>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor da Parcela:</label>
                  <input type="text" value={`R$ ${parseFloat(selectedParcela.valor_parcela).toFixed(2)}`} className="input-field-readonly" readOnly />
                </div>
                <div className="form-group">
                  <label>Data de Vencimento:</label>
                  <input type="text" value={formatDateBR(selectedParcela.data_vencimento)} className="input-field-readonly" readOnly />
                </div>
              </div>
              <form onSubmit={handleSaveRecebimento} className="pagamentos-form-simple">
                <div className="form-row">
                  <div className="form-group">
                    <label 
                      htmlFor="data_recebimento"
                      title="A data em que o pagamento foi efetivamente recebido."
                    >
                      Data do Pagamento: *
                    </label>
                    <input 
                      type="date" 
                      id="data_recebimento" 
                      name="data_recebimento" 
                      value={recebimentoData.data_recebimento} 
                      onChange={handleRecebimentoInputChange} 
                      required 
                      className="input-field"
                      title="A data em que o pagamento foi efetivamente recebido."
                    />
                  </div>
                  <div className="form-group">
                    <label 
                      htmlFor="valor_recebido"
                      title="Insira o valor exato recebido. Pode ser um valor parcial ou o total da parcela."
                    >
                      Valor Recebido (R$): *
                    </label>
                    <input 
                      type="number" 
                      id="valor_recebido" 
                      name="valor_recebido" 
                      value={recebimentoData.valor_recebido} 
                      onChange={handleRecebimentoInputChange} 
                      step="0.01" 
                      required 
                      className="input-field"
                      title="Insira o valor exato recebido. Pode ser um valor parcial ou o total da parcela."
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label 
                      htmlFor="tipo"
                      title="Selecione o método que o paciente usou para pagar (Pix, Dinheiro, Cartão, etc.)."
                    >
                      Forma de Pagamento: *
                    </label>
                    <select 
                      id="tipo" 
                      name="tipo" 
                      value={recebimentoData.tipo} 
                      onChange={handleRecebimentoInputChange} 
                      required 
                      className="select-field"
                      title="Selecione o método que o paciente usou para pagar (Pix, Dinheiro, Cartão, etc.)."
                    >
                      <option value="">Selecione</option>
                      {mockFormasPagamento.map((forma, index) => (<option key={index} value={forma}>{forma}</option>))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}></div>
                </div>
                <div className="form-actions-pagamento" style={{ justifyContent: 'space-between' }}>
                  <button 
                    type="button" 
                    className="button-secondary" 
                    onClick={handleCancelarSelecao}
                    title="Clique para fechar este formulário e voltar para a lista de parcelas."
                  >
                    Cancelar Seleção
                  </button>
                  <button 
                    type="submit" 
                    className="button-primary"
                    title="Clique para salvar este pagamento e marcar a parcela como 'Paga'."
                  >
                    Confirmar Recebimento
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Aba 2: Histórico (Pagos) */}
        {selectedPacienteId && (
          <div style={{ display: abaAtiva === 'historico' ? 'block' : 'none' }}>
            {!loadingParcelas && (
              <div className="card-section">
                <h3>Histórico de Parcelas Pagas</h3>
                <div className="parcelas-tabela-wrapper">
                  <table className="parcelas-tabela">
                    <thead>
                      <tr>
                        <th>ID Parcela</th>
                        <th>Vencimento</th>
                        <th>Valor (R$)</th>
                        <th>Status</th>
                        <th>Data Pagamento</th>
                        <th>Forma Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelasPagas.length > 0 ? (
                        parcelasPagas.map(parcela => {
                          const recebimento = (parcela.recebimentos && parcela.recebimentos[0])
                            ? parcela.recebimentos[0]
                            : {};
                          return (
                            <tr key={parcela.id_parcela}>
                              <td>{parcela.id_parcela}</td>
                              <td>{formatDateBR(parcela.data_vencimento)}</td>
                              <td>{parseFloat(parcela.valor_parcela).toFixed(2)}</td>
                              <td>{parcela.status}</td>
                              <td>{formatDateBR(recebimento.data_recebimento)}</td>
                              <td>{recebimento.tipo || '-'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center' }}>Nenhum pagamento registrado para este paciente.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </>

      {/* --- CORREÇÃO: BOTÃO FLUTUANTE + TEXTO DO MODAL ATUALIZADO --- */}
      <button 
        className="floating-help-button" 
        onClick={() => setIsAjudaOpen(true)}
        title="Ajuda sobre esta página"
      >
        <FontAwesomeIcon icon={faQuestionCircle} />
      </button>

      <Modal
        isOpen={isAjudaOpen}
        onClose={() => setIsAjudaOpen(false)}
        titulo="Ajuda - Controle de Pagamentos"
        footer={
          <button 
            className="modal-button modal-button-secondary" 
            onClick={() => setIsAjudaOpen(false)}
            title="Fechar esta janela de ajuda."
          >
            Fechar
          </button>
        }
      >
        <p>Esta tela permite gerenciar todas as parcelas de pagamentos dos pacientes.</p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <strong>Visão Geral:</strong> Por padrão, a tela carrega todas as parcelas "Pendentes" e "Atrasadas" de todos os pacientes.
          </li>
          <li>
            <strong>Filtrar por Paciente:</strong> Use o seletor para focar em um paciente específico. Isso mostrará as parcelas pendentes e habilitará a aba "Histórico (Pagos)" apenas para ele.
          </li>
          <li>
            <strong>Registrar Pagamento:</strong> Na aba de pendências, clique em "Pagar" para abrir o formulário de registro de pagamento.
          </li>
        </ul>
      </Modal>

    </div>
  );
}

export default Pagamentos;