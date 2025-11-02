import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ListaOrcamentos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import Modal from '../componentes/Modal';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ListaOrcamentos() {
  const { showToast } = useToast();
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const [isAjudaOpen, setIsAjudaOpen] = useState(false);
  const [orcamentoExpandidoId, setOrcamentoExpandidoId] = useState(null);

  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalOrcamentos, setTotalOrcamentos] = useState(0);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  };

  const fetchOrcamentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token de autenticação não encontrado.');

      let params = {
        limit: limit,
        offset: offset,
      };
      
      if (filtroPaciente) {
        params.paciente_nome = filtroPaciente; 
      }
      if (filtroStatus) {
         params.status = filtroStatus; 
      }

      const response = await axios.get(`${API_BASE_URL}/api/orcamentos/`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: params
      });
      
      setOrcamentos(response.data.results || []);
      setTotalOrcamentos(response.data.count || 0);

    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Sua sessão expirou.');
        navigate('/login');
      } else {
        setError('Não foi possível carregar os orçamentos.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, filtroPaciente, filtroStatus, limit, offset]);

  useEffect(() => {
    fetchOrcamentos();
  }, [fetchOrcamentos]);
  
  const handleAprovarOrcamento = async (orcamentoId) => {
    const token = localStorage.getItem('access_token');
    const hoje = new Date().toISOString().split('T')[0];
    try {
      await axios.patch(`${API_BASE_URL}/api/orcamentos/${orcamentoId}/`, 
        { data_aprovacao: hoje },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      showToast('Orçamento aprovado com sucesso!', 'success');
      
      setOrcamentos(orcamentosAtuais =>
        orcamentosAtuais.map(orc =>
          orc.id_orcamento === orcamentoId
            ? { ...orc, data_aprovacao: hoje, status_tratamento: 'Aprovado' } // Atualiza o item
            : orc 
        )
      );
    
      fetchOrcamentos(); 

    } catch (err) {
      showToast('Erro ao aprovar o orçamento.', 'error');
    }
  };

  const toggleDetalhesOrcamento = (orcamentoId) => {
    setOrcamentoExpandidoId(idAtual => 
      idAtual === orcamentoId ? null : orcamentoId
    );
  };

  const handleNextPage = () => {
    if (offset + limit < totalOrcamentos) {
      setOffset(prevOffset => prevOffset + limit);
    }
  };

  const handlePrevPage = () => {
    setOffset(prevOffset => Math.max(0, prevOffset - limit));
  };

  const paginaAtual = Math.floor(offset / limit) + 1;
  const totalPaginas = Math.ceil(totalOrcamentos / limit);

  return (
    <div className="orcamentos-lista-container">
      
      <div className="filtros-container">
        
        <div className="filtros-inputs">
          <div className="filtro-grupo">
            <label htmlFor='filtro-status'></label>
            <input 
              type="text"
              id="filtro-paciente"
              className="filtro-input" 
              value={filtroPaciente}
              onChange={(e) => setFiltroPaciente(e.target.value)}
              placeholder="Buscar por nome do paciente..."
              title="Buscar orçamentos pelo nome do paciente."
            />
          </div>

          <div className="filtro-grupo">
            <select 
              id="filtro-status" 
              className="filtro-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              title="Exibir orçamentos com o status selecionado."
            >
              <option value="">Todos os Status</option>
              <option value="Aguardando Aprovação">Aguardando Aprovação</option>
              <option value="Aprovado">Aprovado</option>
            </select>
          </div>
        </div>

        <div className="filtros-actions">
          <Link 
            to="/orcamentos/novo" 
            className="novo-orcamento-button"
            title="Ir para a tela de criação de um novo orçamento."
          >
            <FontAwesomeIcon icon={faPlus} /> Novo Orçamento
          </Link>
        </div>
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="orcamentos-tabela-wrapper">
        <table className="orcamentos-tabela">
          <thead>
            <tr>
              <th>ID</th>
              <th>Paciente</th>
              <th>Data</th>
              <th>Valor Total (R$)</th>
              <th>Status</th>
              <th className="actions-header-cell"> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="loading-message">Carregando orçamentos...</td></tr>
            ) : orcamentos.length > 0 ? (
              orcamentos.map((orc) => (
                <React.Fragment key={orc.id_orcamento}>
                  <tr style={{backgroundColor: orcamentoExpandidoId === orc.id_orcamento ? '#f0f8ff' : '#fff'}}>
                    <td>{orc.id_orcamento}</td>
                    <td>
                      <Link 
                        to={`/patients/${orc.paciente_details.id_paciente}`} 
                        className="paciente-link"
                        title="Ver os detalhes completos deste paciente."
                      >
                        {orc.paciente_details.nome || 'Paciente não encontrado'}
                      </Link>
                    </td>
                    <td>{formatDate(orc.data_orcamento)}</td>
                    <td>{parseFloat(orc.valor_total || 0).toFixed(2)}</td>
                    <td>
                      <span 
                        style={{fontWeight: 'bold', color: orc.data_aprovacao ? 'green' : '#a88532'}}
                        title={`Status atual: ${orc.status_tratamento}`}
                      >
                        {orc.status_tratamento}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="action-button"
                        title="Ver/Ocultar os procedimentos detalhados deste orçamento."
                        onClick={() => toggleDetalhesOrcamento(orc.id_orcamento)} 
                      >
                        <FontAwesomeIcon icon={faEye} /> 
                      </button>
                      
                      {!orc.data_aprovacao && orc.status_tratamento === "Aguardando Aprovação" && (
                        <button 
                          className="action-button action-button-aprovar"
                          title="Marcar este orçamento como aprovado."
                          onClick={() => handleAprovarOrcamento(orc.id_orcamento)}
                        >
                          Aprovar
                        </button>
                      )}
                    </td>
                  </tr>
                  
                  {orcamentoExpandidoId === orc.id_orcamento && (
                    <tr className="orcamento-itens-detalhe">
                      <td colSpan="6">
                        <div style={{padding: '1rem', backgroundColor: '#fdfdfd'}}>
                          <h5 style={{marginTop: 0, marginBottom: '0.5rem'}}>Itens do Orçamento {orc.id_orcamento}:</h5>
                          <table style={{width: '100%'}}>
                            <thead>
                              <tr style={{backgroundColor: '#f9f9f9'}}>
                                <th>Procedimento</th>
                                <th>Dente / Face</th>
                                <th>Valor (R$)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orc.itens.map(item => (
                                <tr key={item.id_item}>
                                  <td>{item.servico_details?.desc_servico || 'Serviço não encontrado'}</td>
                                  <td>{`${item.n_dente || '-'}/${item.face || '-'}`}</td>
                                  <td>{parseFloat(item.valor || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr><td colSpan="6" className="no-data">Nenhum orçamento encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <span>
          Mostrando {Math.min(offset + 1, totalOrcamentos)} - {Math.min(offset + limit, totalOrcamentos)} de {totalOrcamentos}
        </span>
        
        {totalPaginas > 1 && (
          <div>
            <button 
              onClick={handlePrevPage} 
              disabled={offset === 0}
              className="pagination-button"
            >
              Anterior
            </button>
            <span className="pagination-info">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button 
              onClick={handleNextPage} 
              disabled={offset + limit >= totalOrcamentos}
              className="pagination-button"
            >
              Próximo
            </button>
          </div>
        )}
      </div>  
    
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
        titulo="Ajuda - Gerenciador de Orçamentos"
        footer={
          <button 
            className="modal-button modal-button-secondary" 
            onClick={() => setIsAjudaOpen(false)}
            title="Fechar esta janela."
          >
            Fechar
          </button>
        }
      >
        <p>Esta tela centraliza todos os orçamentos do sistema para gerenciamento.</p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <strong>Visão Geral:</strong> A tabela lista todos os orçamentos criados, 10 por página.
          </li>
          <li>
            <strong>Filtros:</strong> Você pode filtrar a lista digitando o <b>Nome do Paciente</b> ou selecionando um <b>Status</b>.
          </li>
          <li>
            <strong>Novo Orçamento:</strong> O botão no topo leva à tela de criação de um novo orçamento.
          </li>
          <li>
            <strong>Ações:</strong>
            <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
              <li><b>(Ícone do Olho):</b> Expande a linha para mostrar os itens detalhados daquele orçamento.</li>
              <li><b>Aprovar:</b> Confirma o orçamento e gera as parcelas financeiras.</li>
            </ul>
          </li>
          <li>
            <strong>Paginação:</strong> Use os botões "Anterior" e "Próximo" para navegar pelas páginas.
          </li>
        </ul>
      </Modal>

    </div>
  );
}

export default ListaOrcamentos;