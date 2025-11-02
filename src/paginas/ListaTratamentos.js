import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ListaTratamentos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Modal from '../componentes/Modal';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ListaTratamentos() {
    const [tratamentos, setTratamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [filtroPaciente, setFiltroPaciente] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Iniciado');

    const [isAjudaOpen, setIsAjudaOpen] = useState(false);
    const [itemExpandidoId, setItemExpandidoId] = useState(null);

    const [limit] = useState(10);
    const [offset, setOffset] = useState(0);
    const [totalTratamentos, setTotalTratamentos] = useState(0);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const dateOnly = dateString.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        return `${day}/${month}/${year}`;
    };

    const fetchTratamentos = useCallback(async () => {
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

        const response = await axios.get(`${API_BASE_URL}/api/tratamentos/`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: params
        });
        
        setTratamentos(response.data.results || []);
        setTotalTratamentos(response.data.count || 0);

        } catch (err) {
        if (err.response && err.response.status === 401) {
            alert('Sua sessão expirou.');
            navigate('/login');
        } else {
            setError('Não foi possível carregar os tratamentos.');
        }
        } finally {
        setLoading(false);
        }
    }, [navigate, filtroPaciente, filtroStatus, limit, offset]);

    useEffect(() => {
        fetchTratamentos();
    }, [fetchTratamentos]);
    
    const handleEncerrarTratamento = async (tratamentoId) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
        showToast('Sessão expirada. Faça login novamente.', 'error');
        return; 
        }

        try {
        await axios.post(`${API_BASE_URL}/api/tratamentos/${tratamentoId}/encerrar/`, 
            {}, 
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        showToast('Tratamento encerrado com sucesso!', 'success');
        
        fetchTratamentos(); 

        } catch (err) {
        console.error("Erro ao encerrar tratamento:", err);
        const erroMsg = err.response?.data?.error || 'Não foi possível encerrar o tratamento.';
        showToast(erroMsg, 'error');
        }
    };

    const toggleDetalhesTratamento = (tratamentoId) => {
        setItemExpandidoId(idAtual => 
        idAtual === tratamentoId ? null : tratamentoId
        );
    };

    const handleNextPage = () => {
        if (offset + limit < totalTratamentos) {
        setOffset(prevOffset => prevOffset + limit);
        }
    };

    const handlePrevPage = () => {
        setOffset(prevOffset => Math.max(0, prevOffset - limit));
    };

    const paginaAtual = Math.floor(offset / limit) + 1;
    const totalPaginas = Math.ceil(totalTratamentos / limit);

    return (
        <div className="tratamentos-lista-container">
        
            <div className="filtros-container">
                
                <div className="filtros-inputs">
                    <div className="filtro-grupo">
                        <input 
                            type="text"
                            id="filtro-paciente"
                            className="filtro-input" 
                            value={filtroPaciente}
                            onChange={(e) => setFiltroPaciente(e.target.value)}
                            placeholder="Digite o nome do paciente..."
                            title="Buscar tratamentos pelo nome do paciente."
                        />
                    </div>

                    <div className="filtro-grupo">
                        <select 
                            id="filtro-status" 
                            className="filtro-select"
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            title="Exibir tratamentos com o status selecionado."
                        >
                            <option value="Iniciado">Em Andamento (Iniciado)</option>
                            <option value="Concluído">Concluído</option>
                            <option value="">Todos os Status</option>
                        </select>
                    </div>
                </div>
            </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="tratamentos-tabela-wrapper">
            <table className="tratamentos-tabela">
            <thead>
                <tr>
                <th>ID Trat.</th>
                <th>Paciente</th>
                <th>Início</th>
                <th>Status</th>
                <th>Término</th>
                <th className="actions-header-cell"> </th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan="6" className="loading-message">Carregando tratamentos...</td></tr>
                ) : tratamentos.length > 0 ? (
                    tratamentos.map((trat) => (
                        <React.Fragment key={trat.id_tratamento}>
                        <tr style={{backgroundColor: itemExpandidoId === trat.id_tratamento ? '#f0f8ff' : '#fff'}}>
                            <td>{trat.id_tratamento}</td>
                            <td>
                                <Link 
                                    to={`/patients/${trat.orcamento.paciente.id_paciente}`} 
                                    className="paciente-link"
                                    title="Ver os detalhes completos deste paciente."
                                >
                                    {trat.orcamento.paciente.nome || 'Paciente não encontrado'}
                                </Link>
                            </td>
                            <td>{formatDate(trat.data_ini_trat)}</td>
                            <td>
                                <span 
                                    style={{fontWeight: 'bold', color: trat.status === 'Iniciado' ? '#004085' : '#155724'}}
                                    title={`Status atual: ${trat.status}`}
                                >
                                    {trat.status}
                                </span>
                            </td>
                            <td>{formatDate(trat.data_fim_trat)}</td>
                            <td className="actions-cell">
                                <button 
                                    className="action-button"
                                    title="Ver/Ocultar os procedimentos detalhados deste tratamento."
                                    onClick={() => toggleDetalhesTratamento(trat.id_tratamento)} 
                                >
                                    <FontAwesomeIcon icon={faEye} /> 
                                </button>
                                
                                {trat.status === "Iniciado" && (
                                    <button 
                                        className="action-button action-button-encerrar"
                                        title="Marcar este tratamento como concluído."
                                        onClick={() => handleEncerrarTratamento(trat.id_tratamento)}
                                        >
                                        Encerrar
                                    </button>
                                )}
                            </td>
                        </tr>
                        
                        {itemExpandidoId === trat.id_tratamento && (
                            <tr className="tratamento-itens-detalhe">
                                <td colSpan="6">
                                    <div style={{padding: '1rem', backgroundColor: '#fdfdfd'}}>
                                        <h5 style={{marginTop: 0, marginBottom: '0.5rem'}}>Itens do Orçamento (Base):</h5>
                                        <table style={{width: '100%'}}>
                                            <thead>
                                                <tr style={{backgroundColor: '#f9f9f9'}}>
                                                    <th>Procedimento</th>
                                                    <th>Dente / Face</th>
                                                    <th>Valor (R$)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trat.orcamento.itens.map(item => (
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
                <tr><td colSpan="6" className="no-data">Nenhum tratamento encontrado.</td></tr>
                )}
            </tbody>
            </table>
        </div>

        <div className="pagination-controls">
            <span>
            Mostrando {Math.min(offset + 1, totalTratamentos)} - {Math.min(offset + limit, totalTratamentos)} de {totalTratamentos}
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
                disabled={offset + limit >= totalTratamentos}
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
            titulo="Ajuda - Gerenciador de Tratamentos"
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
            <p>Esta tela centraliza todos os tratamentos clínicos em andamento ou concluídos.</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>
                <strong>Visão Geral:</strong> Por padrão, a tabela lista os tratamentos "Em Andamento".
            </li>
            <li>
                <strong>Filtros:</strong> Você pode filtrar a lista pelo <b>Nome do Paciente</b> ou pelo <b>Status</b> (Em Andamento ou Concluído).
            </li>
            <li>
                <strong>Ações:</strong>
                <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                <li><b>(Olho):</b> Expande a linha para mostrar os itens do orçamento original que deu origem a este tratamento.</li>
                <li><b>Encerrar:</b> Finaliza um tratamento "Em Andamento" e o move para "Concluído".</li>
                </ul>
            </li>
            </ul>
        </Modal>

    </div>
  );
}

export default ListaTratamentos;