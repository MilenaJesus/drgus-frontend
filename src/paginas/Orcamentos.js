import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Orcamentos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faCheck, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import Modal from '../componentes/Modal';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const dentesArcadaSuperior = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const dentesArcadaInferior = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const mockFaces = ['V', 'P', 'M', 'D', 'L'];
const mockParcelas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function Orcamentos() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const navigate = useNavigate();
  const [isAjudaOpen, setIsAjudaOpen] = useState(false);
  const [selectedDente, setSelectedDente] = useState(null);
  const [procedimentosDoOrcamento, setProcedimentosDoOrcamento] = useState([]);
  const [procedimentoData, setProcedimentoData] = useState({ dente: '', faces: [], servico: '', valor: '' });
  const [procedimentoAjuda, setProcedimentoAjuda] = useState("");
  const [orcamentoForm, setOrcamentoForm] = useState({
    paciente_id: '',
    data_orcamento: new Date().toISOString().split('T')[0],
    parcelas: '',
  });

  const pacientesFiltrados = pacientes.filter(paciente =>
    (paciente.nome || '').toLowerCase().includes((filtroPaciente || '').toLowerCase())
  );

  const handleSelecionarPaciente = (paciente) => {
    const id = paciente?.id_paciente ?? paciente?.id ?? paciente?.pk ?? paciente?._id ?? '';
    setFiltroPaciente(paciente.nome ?? '');
    setPacienteSelecionadoId(String(id));
    setOrcamentoForm(prev => ({ ...prev, paciente_id: String(id) }));
    setShowAutocomplete(false);
  };

  const handleFiltroChange = (e) => {
    const nome = e.target.value ?? '';
    setFiltroPaciente(nome);
    setShowAutocomplete(nome.length > 0);
    if (!pacientes.find(p => p.nome === nome)) {
      setPacienteSelecionadoId('');
      setOrcamentoForm(prev => ({ ...prev, paciente_id: '' }));
    }
  };

  const fetchServicos = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error("fetchServicos: Token não encontrado. Redirecionando para login.");
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/servicos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const services = response.data?.results ?? response.data ?? [];
      setServicos(Array.isArray(services) ? services : []);
    } catch (err) {
      if (err?.response?.status === 401) navigate('/login');
      else {
        setError('Erro ao carregar serviços.');
        console.error('Erro serv (API):', err.response || err);
      }
    }
  }, [navigate]);

  const fetchPacientes = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error("fetchPacientes: Token não encontrado. Redirecionando para login.");
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/pacientes/lookup/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const patients = response.data?.results ?? response.data ?? [];
      if (Array.isArray(patients)) {
        const pacientesCorrigidos = patients.map((p, idx) => ({
          ...p,
          id_paciente: String(p?.id_paciente ?? p?.id ?? p?.pk ?? p?._id ?? `no-id-${idx}`),
          nome: p?.nome ?? '',
          cpf: p?.cpf ?? '',
        }));
        setPacientes(pacientesCorrigidos);
      } else {
        setPacientes([]);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        console.error("fetchPacientes: Sessão expirada (401). Redirecionando.");
        navigate('/login');
      } else {
        setError('Erro ao carregar pacientes.');
        console.error('Erro pac (API):', err.response || err);
      }
    }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    const initData = async () => {
      await Promise.all([fetchServicos(), fetchPacientes()]);
      setLoading(false);
    };
    initData();
  }, [fetchServicos, fetchPacientes]);

  const handleOrcamentoFormChange = (e) => {
    const { name, value } = e.target;
    setOrcamentoForm(prev => ({ ...prev, [name]: value ?? '' }));
  };

  const handleDenteClick = (dente) => {
    const novoDente = selectedDente === dente ? null : dente;
    setSelectedDente(novoDente);
    setProcedimentoData(prevData => ({
      ...prevData,
      dente: novoDente ? String(novoDente) : '',
    }));
  };

  const handleFaceClick = (face) => {
    setProcedimentoData(prevData => {
      const newFaces = prevData.faces.includes(face)
        ? prevData.faces.filter(f => f !== face)
        : [...prevData.faces, face];
      return { ...prevData, faces: newFaces };
    });
  };

  const handleProcedimentoChange = (e) => {
    const servicold = e.target.value ?? '';
    const servicoSelecionado = servicos.find(s => String(s.id_servico) === String(servicold));
    const novoValor = servicoSelecionado ? (servicoSelecionado.valor_referencia ?? '') : '';
    setProcedimentoData(prevData => ({
      ...prevData,
      servico: servicold,
      valor: novoValor ?? '',
      dente: (servicoSelecionado && servicoSelecionado.exige_dente) ? prevData.dente : '',
      faces: (servicoSelecionado && servicoSelecionado.exige_face) ? prevData.faces : [],
    }));
    if (servicoSelecionado && !servicoSelecionado.exige_dente) setSelectedDente(null);

    if (servicoSelecionado) {
      if (servicoSelecionado.exige_dente && servicoSelecionado.exige_face) setProcedimentoAjuda("Este procedimento exige a seleção de Dente e Faces.");
      else if (servicoSelecionado.exige_dente) setProcedimentoAjuda("Este procedimento exige a seleção de Dente.");
      else if (servicoSelecionado.exige_face) setProcedimentoAjuda("Este procedimento exige a seleção de Faces.");
      else setProcedimentoAjuda("");
    } else setProcedimentoAjuda("");
  };

  const handleAdicionarProcedimento = () => {
    const servicoSelecionado = servicos.find(s => String(s.id_servico) === String(procedimentoData.servico));
    if (!servicoSelecionado) { showToast('Selecione um procedimento válido.'); return; }
    const exigeDente = servicoSelecionado.exige_dente;
    const exigeFace = servicoSelecionado.exige_face;
    const denteValido = !exigeDente || (procedimentoData.dente && procedimentoData.dente !== '');
    const faceValida = !exigeFace || (procedimentoData.faces && procedimentoData.faces.length > 0);
    if (denteValido && faceValida && procedimentoData.servico && (procedimentoData.valor !== undefined && procedimentoData.valor !== '')) {
      const novoProcedimento = {
        idTemporario: Date.now(),
        dente: procedimentoData.dente || null,
        faces: procedimentoData.faces.join(','),
        servico: procedimentoData.servico,
        valor: procedimentoData.valor,
        nomeServico: servicoSelecionado.desc_servico
      };
      setProcedimentosDoOrcamento(prev => [...prev, novoProcedimento]);
      setProcedimentoData({ dente: '', faces: [], servico: '', valor: '' });
      setSelectedDente(null);
      setProcedimentoAjuda("");
    } else {
      let errorMsg = 'Preencha todos os detalhes obrigatórios do procedimento.\n';
      if (exigeDente && !denteValido) errorMsg += '- Selecione um dente.\n';
      if (exigeFace && !faceValida) errorMsg += '- Selecione pelo menos uma face.\n';
      if (!procedimentoData.servico) errorMsg += '- Selecione um procedimento.\n';
      showToast(errorMsg);
    }
  };

  const handleRemoverProcedimento = (idTemporario) => {
    setProcedimentosDoOrcamento(procedimentosAtuais =>
      procedimentosAtuais.filter(p => p.idTemporario !== idTemporario)
    );
  };

  const calcularTotalEstimado = () => {
    return procedimentosDoOrcamento.reduce((total, item) => total + parseFloat(item.valor || 0), 0).toFixed(2);
  };

  const handleSaveOrcamento = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { throw new Error('Token de autenticação não encontrado.'); }
      if (!pacienteSelecionadoId) { showToast('Por favor, selecione um paciente.'); return; }
      if (procedimentosDoOrcamento.length === 0) { showToast('Adicione pelo menos um procedimento.'); return; }

      const orcamentoData = {
        paciente: parseInt(pacienteSelecionadoId),
        data_orcamento: orcamentoForm.data_orcamento,
        n_vezes: orcamentoForm.parcelas ? parseInt(orcamentoForm.parcelas) : null,
        itens_para_criar: procedimentosDoOrcamento.map(proc => ({
          servico: parseInt(proc.servico),
          data_execucao: new Date().toISOString().split('T')[0],
          valor: parseFloat(proc.valor),
          n_dente: proc.dente || null,
          face: proc.faces || null,
        })),
      };

      await axios.post(`${API_BASE_URL}/api/orcamentos/`, orcamentoData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      showToast('Orçamento salvo com sucesso! As parcelas foram geradas.');
      setProcedimentosDoOrcamento([]);
      setOrcamentoForm({ paciente_id: '', data_orcamento: new Date().toISOString().split('T')[0], parcelas: '' });
      setPacienteSelecionadoId('');
      setFiltroPaciente('');
    } catch (err) {
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      showToast(`Erro ao salvar o orçamento: ${errorMsg}`);
      console.error('Erro ao salvar orçamento:', err.response ? err.response.data : err);
    }
  };

  const servicoSelecionado = servicos.find(s => String(s.id_servico) === String(procedimentoData.servico));
  const exigeDente = servicoSelecionado?.exige_dente;
  const exigeFace = servicoSelecionado?.exige_face;

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="orcamento-container">
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSaveOrcamento}>
        <div className="orcamento-content-wrapper">
          <div className="orcamento-details-section">
            <h3 className="section-title">Orçamento:</h3>
            <div className="form-row-compact">
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="filtroPaciente">Paciente *</label>
                <input
                  autoComplete="off"
                  type="text"
                  id="filtroPaciente"
                  className="input-field"
                  placeholder="Digite o nome para buscar o paciente..."
                  value={filtroPaciente}
                  onChange={handleFiltroChange}
                  onFocus={() => setShowAutocomplete(filtroPaciente.length > 0)}
                  required
                  title="Busque pelo nome do paciente para quem o orçamento será criado."
                />

                {showAutocomplete && filtroPaciente.length > 0 && pacientesFiltrados.length > 0 && (
                  <ul className="paciente-autocomplete-list" role="listbox">
                    {pacientesFiltrados.slice(0, 8).map((paciente, idx) => {
                      const keySafe = paciente.id_paciente ?? paciente.cpf ?? `${paciente.nome}-${idx}`;
                      return (
                        
                        <li
                          key={keySafe}
                          onMouseDown={() => handleSelecionarPaciente(paciente)}
                          title={`Selecionar ${paciente.nome}`}
                          role="option"
                          aria-selected={pacienteSelecionadoId === String(paciente.id_paciente)}
                          tabIndex={0}
                        >
                          {paciente.nome} ({paciente.cpf ?? ''})
                        </li>
                      );
                    })}
                    {pacientesFiltrados.length > 8 && (
                      <li className="autocomplete-info">Mais resultados...</li>
                    )}
                  </ul>
                )}

                {/*Mensagem de erro se digitou e não achou*/}
                {showAutocomplete && pacientesFiltrados.length === 0 && filtroPaciente.length > 0 && (
                  <div className="autocomplete-info" style={{ color: '#dc3545' }}>
                    Nenhum paciente encontrado.
                  </div>
                )}

                {/*Campo oculto para submissão*/}
                <input type="hidden" name="paciente_id" value={pacienteSelecionadoId ?? ''} />
              </div>

              <div className="form-group">
                <label htmlFor="data">Data *</label>
                <input type="date" id="data" name="data_orcamento" value={orcamentoForm.data_orcamento}
                  onChange={handleOrcamentoFormChange} className="input-field" required
                  title="Data em que o orçamento está sendo criado."
                />
              </div>

              <div className="form-group">
                {/* Espaçador */}
              </div>

            </div>
          </div>

          <div className="top-section-wrapper">
            <div className="odontograma-vis-container">
              <h2 className="section-title">Odontograma</h2>
              <div className="odontograma-grid">
                <div className="arcada-numeros-superior">{dentesArcadaSuperior.map(d => <span key={d}>{d}</span>)}</div>
                <div className="arcada-superior">{dentesArcadaSuperior.map(d => (
                  <div
                    key={d}
                    className={`dente-box ${selectedDente === d ? 'selected' : ''}`}
                    onClick={() => exigeDente && handleDenteClick(d)}
                    title={exigeDente ? `Selecionar dente ${d}` : "Selecione um procedimento que exija dente."}
                  ></div>
                ))}</div>
                <div className="arcada-inferior">{dentesArcadaInferior.map(d => (
                  <div
                    key={d}
                    className={`dente-box ${selectedDente === d ? 'selected' : ''}`}
                    onClick={() => exigeDente && handleDenteClick(d)}
                    title={exigeDente ? `Selecionar dente ${d}` : "Selecione um procedimento que exija dente."}
                  ></div>
                ))}</div>
                <div className="arcada-numeros-inferior">{dentesArcadaInferior.map(d => <span key={d}>{d}</span>)}</div>
              </div>
            </div>
            <div className="procedimento-form-card">
              <div className="procedimento-header">
                <label className="dente-label">Dente</label>
                <span className="selected-dente">{procedimentoData.dente || 'Nenhum'}</span>
              </div>
              <div className="faces-container">
                {mockFaces.map(face => (
                  <button
                    type="button"
                    key={face}
                    disabled={!exigeFace}
                    className={`face-button ${procedimentoData.faces.includes(face) ? 'selected' : ''}`}
                    onClick={() => exigeFace && handleFaceClick(face)}
                    title={exigeFace ? `Selecionar face ${face}` : "Selecione um procedimento que exija faces."}
                  >
                    <div className="face-circle"><FontAwesomeIcon icon={faCheck} className="face-icon" /></div>
                    <span>{face}</span>
                  </button>
                ))}
              </div>
              <div className="procedimento-inputs stacked">
                <div className="form-group">
                  <label htmlFor="procedimento">Procedimento *</label>
                  <select
                    name="procedimento"
                    id="procedimento"
                    value={procedimentoData.servico}
                    onChange={handleProcedimentoChange}
                    className="select-field"
                    title="Escolha o serviço a ser realizado."
                  >
                    <option value="">Selecione</option>
                    {servicos.map(s => (<option key={String(s.id_servico)} value={String(s.id_servico)}>{s.desc_servico}</option>))}
                  </select>
                  {procedimentoAjuda && (
                    <p className="procedimento-ajuda-texto">{procedimentoAjuda}</p>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="valor">Valor (R$) *</label>
                  <input
                    type="text"
                    id="valor"
                    name="valor"
                    value={procedimentoData.valor ?? ''}
                    readOnly
                    className="input-field input-field-readonly"
                    title="O valor é preenchido automaticamente com base no procedimento selecionado."
                  />
                </div>
              </div>
              <button
                type="button"
                className="add-button"
                onClick={handleAdicionarProcedimento}
                title="Adicionar o procedimento selecionado à lista abaixo."
              >
                Adicionar ao orçamento
              </button>
            </div>
          </div>

          <div className="orcamento-details-section">
            {procedimentosDoOrcamento.length > 0 ? (
              <div className="tabela-procedimentos-wrapper">
                <h4>Procedimentos Adicionados</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Dente</th>
                      <th>Face</th>
                      <th>Procedimento</th>
                      <th>Valor (R$)</th>
                      <th>Remover</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedimentosDoOrcamento.map((item) => (
                      <tr key={item.idTemporario}>
                        <td>{item.dente || '-'}</td>
                        <td>{item.faces || '-'}</td>
                        <td>{item.nomeServico}</td>
                        <td>{(parseFloat(item.valor || 0)).toFixed(2)}</td>
                        <td>
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => handleRemoverProcedimento(item.idTemporario)}
                            title="Remover este procedimento da lista."
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='no-data-message' style={{textAlign: 'center'}}>Nenhum procedimento adicionado ainda.</p>
            )}

            <div className="orcamento-footer">
              <div className="form-row-compact total-row">
                <div className="form-group">
                  <label htmlFor="total">Total estimado: </label>
                  <input type="text" id="total" value={`R$ ${calcularTotalEstimado()}`} readOnly
                    className="input-field input-field-readonly"
                    title="Soma total dos procedimentos listados."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="parcelas">N° de parcelas</label>
                  <select
                    id="parcelas"
                    name="parcelas"
                    className="select-field"
                    value={orcamentoForm.parcelas}
                    onChange={handleOrcamentoFormChange}
                    title="Selecione o número de parcelas para gerar o financeiro deste orçamento (opcional)."
                  >
                    <option value="">Selecione (para gerar parcelas)</option>
                    {mockParcelas.map((num, index) => (
                      <option key={index} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                </div>
              </div>
              <button
                type="submit"
                className="button-save"
                title="Salvar este orçamento no histórico do paciente."
              >
                Salvar orçamento
              </button>
            </div>
          </div>
        </div>
      </form>

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
        titulo="Ajuda - Criar Orçamento"
        footer={
          <button
            className="modal-button modal-button-secondary"
            onClick={() => setIsAjudaOpen(false)}
          >
            Fechar
          </button>
        }
      >
        <p>Esta tela é usada para criar um novo orçamento para um paciente.</p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <strong>Paciente e Data:</strong> Selecione o paciente e a data do orçamento (obrigatórios).
          </li>
          <li>
            <strong>Odontograma e Procedimento:</strong>
            <ol style={{ paddingLeft: '20px', margin: '5px 0' }}>
              <li>Selecione um "Procedimento".</li>
              <li>Se o procedimento exigir, clique no "Dente" e nas "Faces" correspondentes.</li>
              <li>Clique em "Adicionar ao orçamento".</li>
            </ol>
          </li>
          <li>
            <strong>Lista de Procedimentos:</strong> Confira os itens adicionados na tabela inferior.
          </li>
          <li>
            <strong>Parcelas:</strong> (Opcional) Selecione um número de parcelas para que o sistema gere o financeiro automaticamente quando o orçamento for aprovado.
          </li>
          <li>
            <strong>Salvar Orçamento:</strong> Salva o orçamento no histórico do paciente.
          </li>
        </ul>
      </Modal>

    </div>
  );
}

export default Orcamentos;
