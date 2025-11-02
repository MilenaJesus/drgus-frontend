import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DetalhesPacientes.css';
import Modal from '../componentes/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function DetalhesPacientes() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [paciente, setPaciente] = useState(null);
  const [anamnese, setAnamnese] = useState(null);
  const [orcamentos, setOrcamentos] = useState([]); 
  const [orcamentoExpandidoId, setOrcamentoExpandidoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAjudaOpen, setIsAjudaOpen] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) { throw new Error('Token de autenticação não encontrado.'); }
        const headers = { 'Authorization': `Bearer ${token}` };

        const pacienteResponse = await axios.get(`${API_BASE_URL}/api/pacientes/${id}/`, { headers });
        setPaciente(pacienteResponse.data);

        try {
          const anamneseResponse = await axios.get(`${API_BASE_URL}/api/anamneses/?paciente=${id}`, { headers });
          if (anamneseResponse.data && anamneseResponse.data.length > 0) {
            setAnamnese(anamneseResponse.data[0]);
          } else { setAnamnese(null); }
        } catch (anamneseError) { 
          console.warn("Nenhuma anamnese encontrada:", anamneseError); 
          setAnamnese(null); 
        }

        const orcamentosResponse = await axios.get(`${API_BASE_URL}/api/orcamentos/?paciente=${id}`, { headers });
        const orcamentosData = orcamentosResponse.data.results || orcamentosResponse.data || [];
        setOrcamentos(orcamentosData);
        
      } catch (err) {
        if (err.response && err.response.status === 401) { 
          alert('Sua sessão expirou...');
          navigate('/login'); 
        } else { 
          setError('Não foi possível carregar os detalhes do paciente.');
          console.error('Erro geral:', err); 
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [id, navigate]);
  
  const toggleDetalhesOrcamento = (orcamentoId) => {
    setOrcamentoExpandidoId(idAtual => 
      idAtual === orcamentoId ? null : orcamentoId
    );
  };
  
  const handleGoBack = () => { navigate(-1); };

  if (loading) { return <div>Carregando detalhes do paciente...</div>; }
  if (error) { return <div className="error-message">Erro: {error}</div>; }
  if (!paciente) { return <div className="no-data">Paciente não encontrado.</div>; }

  const renderBooleanFieldDetail = (label, value, description) => (
    <div className="form-group">
      <label>{label}</label>
      <input type="text" value={`${value ? 'Sim' : 'Não'}${value && description ? ` (${description})` : ''}`} readOnly />
    </div>
  );

  return (
    <div className="detalhes-paciente-container">
      <button 
        onClick={handleGoBack} 
        className="back-button"
        title="Voltar para a tela anterior."
      >
        Voltar
      </button>
      
      <div className="card-section">
        <h2>Dados pessoais</h2>
        <div className="dados-pessoais-grid">
            <div className="form-group"><label>Nome:</label><input type="text" value={paciente.nome || ''} readOnly /></div>
            <div className="form-group"><label>CPF:</label><input type="text" value={paciente.cpf || ''} readOnly /></div>
            <div className="form-group"><label>Data de Nascimento:</label><input type="text" value={formatDate(paciente.data_nasc)} readOnly /></div>
            <div className="form-group full-width"><label>Endereço:</label><input type="text" value={`${paciente.logradouro || '-'} - ${paciente.cidade?.nome_cidade || '-'} (${paciente.cidade?.uf?.sigla_uf || '-'})`} readOnly /></div>
            <div className="form-group"><label>Telefone:</label><input type="text" value={paciente.telefone || ''} readOnly /></div>
            <div className="form-group"><label>Email:</label><input type="text" value={paciente.email || ''} readOnly /></div>
        </div>
      </div>
      
      <div className="card-section">
        <h2>Histórico Clínico</h2>
        {anamnese ? (
            <div className="historico-clinico-grid">
                <div className="form-group full-width"><label>Motivo da consulta:</label><textarea value={anamnese.motivo_consulta || ''} readOnly /></div>
                <div className="form-group"><label>Último Tratamento:</label><input type="text" value={anamnese.ultimo_trat || '-'} readOnly /></div>
                {renderBooleanFieldDetail('Em tratamento médico?', anamnese.trat_medico, anamnese.trat_med_desc)}
                {renderBooleanFieldDetail('Faz uso de medicamento?', anamnese.medicamento, anamnese.medicamento_desc)}
                {renderBooleanFieldDetail('Teve reação à anestesia?', anamnese.reacao_anestesia, anamnese.reacao_anest_desc)}
                {renderBooleanFieldDetail('Tem sensibilidade nos dentes?', anamnese.sensi_dentes, anamnese.sensi_dentes_desc)}
                {renderBooleanFieldDetail('Range os dentes/apertamento?', anamnese.range_apertamento, anamnese.range_apert_desc)}
                {renderBooleanFieldDetail('Gengiva sangra facilmente?', anamnese.gengiva_sangra, anamnese.gengiva_sang_desc)}
                <div className="form-group"><label>Fumante?</label><input type="text" value={ `${anamnese.fuma ? 'Sim' : 'Não'}${anamnese.fuma && anamnese.fuma_desc ? ` (${anamnese.fuma_desc})` : ''}` } readOnly /></div>
                {renderBooleanFieldDetail('Diabético?', anamnese.diabetico, anamnese.diabetico_desc)}
                {renderBooleanFieldDetail('Quando se corta, sangra muito?', anamnese.corte_sangra, anamnese.corte_sang_desc)}
                {renderBooleanFieldDetail('Tem problema cardíaco?', anamnese.prob_cardiaco, anamnese.prob_card_desc)}
                {renderBooleanFieldDetail('Dores de cabeça?', anamnese.dores_cabeca, anamnese.dores_cabeca_desc)}
                {renderBooleanFieldDetail('Já teve desmaios ou ataques?', anamnese.desmaio_ataques, anamnese.desmaio_atq_desc)}
                {renderBooleanFieldDetail('Tem pressão arterial alterada?', anamnese.pressao_art, anamnese.pressao_art_desc)}
            </div>
        ) : (<p>Nenhum histórico clínico (anamnese) encontrado.</p>)}
      </div>

      <div className="card-section">
        <h2>Histórico de Orçamentos e Tratamentos</h2>
        
        {orcamentos.length > 0 ? (
          <div className="historico-tratamentos-tabela">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Valor Total (R$)</th>
                  <th>N° Parcelas</th>
                  <th>Status</th>
                  <th className="actions-header-cell"> </th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map((orc) => (
                  <React.Fragment key={orc.id_orcamento}>
                    <tr style={{backgroundColor: orcamentoExpandidoId === orc.id_orcamento ? '#f0f8ff' : '#fff'}}>
                      <td>{orc.id_orcamento}</td>
                      <td>{formatDate(orc.data_orcamento)}</td>
                      <td>{parseFloat(orc.valor_total || 0).toFixed(2)}</td>
                      <td>{orc.n_vezes || 'N/A'}</td>
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
                          onClick={() => toggleDetalhesOrcamento(orc.id_orcamento)}
                          style={{marginRight: '10px'}}
                          title="Ver/Ocultar os procedimentos detalhados deste orçamento."
                        >
                          {orcamentoExpandidoId === orc.id_orcamento ? 'Fechar' : 'Ver Itens'}
                        </button>
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Nenhum histórico de orçamentos e tratamentos encontrado.</p>
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
        titulo="Ajuda - Detalhes do Paciente"
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
        <p>Esta tela centraliza todas as informações de um paciente específico.</p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <strong>Dados Pessoais:</strong> Informações de cadastro do paciente.
          </li>
          <li>
            <strong>Histórico Clínico:</strong> Respostas da ficha de Anamnese preenchida no cadastro.
          </li>
          <li>
            <strong>Histórico de Orçamentos:</strong> Lista todos os orçamentos (Aguardando e Aprovados) deste paciente.
            <ul>
              <li><b>Ver Itens:</b> Expande a linha para mostrar os procedimentos detalhados do orçamento.</li>
              <li>Para aprovar um orçamento, vá para a tela de "Orçamentos" no menu principal.</li>
            </ul>
          </li>
        </ul>
      </Modal>

    </div>
  );
}

export default DetalhesPacientes;