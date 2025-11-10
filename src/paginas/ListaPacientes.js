import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ListaPacientes.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Modal from '../componentes/Modal';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ListaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [setIsAjudaOpen] = useState(false);

  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalPacientes, setTotalPacientes] = useState(0);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState(null);

  const { showToast } = useToast();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  };

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }
      
      let params = {
        limit: limit,
        offset: offset,
        search: searchTerm,
      };

      const response = await axios.get(`${API_BASE_URL}/api/pacientes/`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: params
      });
      
      const pacientesData = response.data.results;
      if (Array.isArray(pacientesData)) {
        setPacientes(pacientesData);
        setTotalPacientes(response.data.count || 0);
      } else {
        setPacientes([]);
        setError('Formato de dados inesperado da API.');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        showToast('Sua sessão expirou. Por favor, faça o login novamente.');
        navigate('/login');
      } else {
        setError('Não foi possível carregar os pacientes.');
        console.error('Erro ao buscar pacientes:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, limit, offset, searchTerm, showToast]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const handleDeletePaciente = (paciente) => {
    setPacienteParaExcluir(paciente);
    setIsDeleteModalOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!pacienteParaExcluir) return;
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token não encontrado.');
      await axios.delete(`${API_BASE_URL}/api/pacientes/${pacienteParaExcluir.id_paciente}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
        showToast('Paciente excluído com sucesso!', 'success');
        fetchPacientes(); 
      } catch (err) {
        console.error("Erro ao excluir paciente:", err);
       showToast('Não foi possível excluir o paciente.', 'error');
     } finally {
      setIsDeleteModalOpen(false);
      setPacienteParaExcluir(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setOffset(0); 
    fetchPacientes();
  };

  const handleNextPage = () => {
    if (offset + limit < totalPacientes) {
      setOffset(prevOffset => prevOffset + limit);
    }
  };

  const handlePrevPage = () => {
    setOffset(prevOffset => Math.max(0, prevOffset - limit));
  };

  const paginaAtual = Math.floor(offset / limit) + 1;
  const totalPaginas = Math.ceil(totalPacientes / limit);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="pacientes-container">
      <div className="pacientes-header">
        <form className="pacientes-header-actions" onSubmit={handleSearchSubmit}>
          <div className="filtro-grupo">
            <input
              type="text"
              id="search-paciente"
              className="filtro-input"
              placeholder="Digite o nome ou CPF"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              title="Buscar paciente por nome ou CPF."
            />
          </div>
          
          <Link 
            to="/patients/new" 
            className="novo-paciente-button"
            title="Abrir o formulário de cadastro para um novo paciente."
          >
            <FontAwesomeIcon icon={faPlus} /> Novo paciente
          </Link>
        </form>
      </div>
      
      <div className="pacientes-tabela-wrapper">
        <table className="pacientes-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Data de nascimento</th>
              <th>Endereço</th>
              <th className="actions-header-cell">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="loading-message">Carregando pacientes...</td></tr>
            ) : pacientes.length > 0 ? (
              pacientes.map(paciente => (
                <tr key={paciente.id_paciente}>
                  <td>
                    <Link 
                      to={`/patients/${paciente.id_paciente}`} 
                      className="paciente-link"
                      title="Ver detalhes, histórico e orçamentos deste paciente."
                    >
                      {paciente.nome}
                    </Link>
                  </td>
                  <td>{paciente.cpf}</td>
                  <td>{paciente.telefone || '-'}</td>
                  <td>{formatDate(paciente.data_nasc)}</td>
                  <td>{`${paciente.logradouro || '-'} - ${paciente.cidade?.nome_cidade || 'N/A'}`}</td>
                  
                  <td className="actions-cell">
                    <button 
                      className="action-button edit-button" 
                      onClick={() => navigate(`/patients/${paciente.id_paciente}/edit`)}
                      title="Editar dados cadastrais do paciente."
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className="action-button delete-button" 
                      onClick={() => handleDeletePaciente(paciente)}
                      title="Excluir este paciente."
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">Nenhum paciente encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <span>
          Mostrando {Math.min(offset + 1, totalPacientes)} - {Math.min(offset + limit, totalPacientes)} de {totalPacientes}
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
              disabled={offset + limit >= totalPacientes}
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
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        titulo="Confirmar Exclusão"
        footer={
          <>
            <button 
              className="modal-button modal-button-secondary" 
              onClick={() => setIsDeleteModalOpen(false)}
              title="Cancelar e fechar."
            >
              Cancelar
            </button>
            <button 
              className="modal-button modal-button-danger" 
              onClick={confirmarExclusao}
              title="Confirmar a exclusão."
            >
              Sim, Excluir
            </button>
          </>
        }
      >
        <p>Tem certeza que deseja excluir o paciente:</p>
        <p style={{fontWeight: 'bold', fontSize: '1.1rem', color: '#000000', textAlign: 'center'}}>
          {pacienteParaExcluir?.nome}
        </p>
        <p style={{fontSize: '0.9rem', color: '#666'}}>Esta ação não pode ser desfeita.</p>
      </Modal>

    </div>
  );
}

export default ListaPacientes;