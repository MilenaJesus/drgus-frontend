import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus, faCheckCircle, faTimesCircle , faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../context/ToastContext'; 
import './Procedimentos.css';
import Modal from '../componentes/Modal';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_SERVICOS_URL = `${API_BASE_URL}/api/servicos/`;

function ProcedimentosTeste() {
    const { showToast } = useToast();
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editandoId, setEditandoId] = useState(null);
    const [novoServico, setNovoServico] = useState({
        desc_servico: '',
        valor_referencia: '',
        exige_dente: false,
        exige_face: false,
    });
    const [editData, setEditData] = useState({});
    const [isAjudaOpen, setIsAjudaOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [servicoParaExcluirId, setServicoParaExcluirId] = useState(null);

    const fetchServicos = useCallback(async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('access_token');
        
            // CORREÇÃO: Usamos o filtro na URL
            const urlComFiltro = `${API_SERVICOS_URL}?ativo=true`;
            
            const response = await axios.get(urlComFiltro, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Aqui, a resposta só deve conter serviços com ativo: true
            setServicos(response.data.results || response.data || []); 
            
        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
            showToast('Falha ao carregar a lista de procedimentos.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchServicos();
    }, [fetchServicos]);

    const abrirModalConfirmacao = (id) => {
        setServicoParaExcluirId(id);
        setIsConfirmModalOpen(true);
    };

    const handleAdicionarServico = async (e) => {
        e.preventDefault();
        if (!novoServico.desc_servico || !novoServico.valor_referencia) {
            showToast('Preencha a descrição e o valor.', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            await axios.post(API_SERVICOS_URL, novoServico, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Procedimento adicionado com sucesso.', 'success');
            setNovoServico({ desc_servico: '', valor_referencia: '', exige_dente: false, exige_face: false });
            fetchServicos();
        } catch (error) {
            console.error("Erro ao adicionar serviço:", error);
            showToast('Erro ao adicionar procedimento. Verifique o console.', 'error');
        }
    };

    const handleSalvarEdicao = async (id) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.patch(`${API_SERVICOS_URL}${id}/`, editData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Procedimento atualizado.', 'success');
            setEditandoId(null);
            fetchServicos();
        } catch (error) {
            console.error("Erro ao salvar edição:", error);
            showToast('Erro ao atualizar procedimento.', 'error');
        }
    };

    const executarExclusao = async () => {
        const id = servicoParaExcluirId;
        if (!id) return;

        try {
            const token = localStorage.getItem('access_token');
            await axios.patch(`${API_SERVICOS_URL}${id}/`, { ativo: false }, {
            headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Procedimento desativado com sucesso.', 'success');
            fetchServicos();
        } catch (error) {
            console.error("Erro ao desativar serviço:", error.response || error);
            showToast('Erro ao desativar procedimento.', 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setServicoParaExcluirId(null);
        }
    };

    const iniciarEdicao = (servico) => {
        setEditandoId(servico.id_servico);
        setEditData({ ...servico });
    };

    if (loading) return <div className="loading-message">Carregando procedimentos...</div>;

    return (
        <div className="admin-procedimentos-container">
                <div className="card-form-adicao">
                <h3> Adicionar Novo</h3>
                <form onSubmit={handleAdicionarServico}>
                    <div className="form-row-simple">
                        <input
                            type="text"
                            placeholder="Descrição do Procedimento (Ex: Restauração Resina)"
                            value={novoServico.desc_servico}
                            onChange={(e) => setNovoServico({ ...novoServico, desc_servico: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Valor Ref. (R$)"
                            value={novoServico.valor_referencia}
                            onChange={(e) => setNovoServico({ ...novoServico, valor_referencia: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={novoServico.exige_dente}
                                onChange={(e) => setNovoServico({ ...novoServico, exige_dente: e.target.checked })}
                            />
                            Exige Dente
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={novoServico.exige_face}
                                onChange={(e) => setNovoServico({ ...novoServico, exige_face: e.target.checked })}
                            />
                            Exige Face
                        </label>
                    </div>
                    <button type="submit" className="button-primary">
                        <FontAwesomeIcon icon={faPlus} /> Adicionar Procedimento
                    </button>
                </form>
            </div>

            {/* Tabela de Procedimentos */}
            <div className="tabela-servicos-wrapper">
                <table className="tabela-servicos">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Descrição</th>
                            <th>Valor (R$)</th>
                            <th>Exige Dente?</th>
                            <th>Exige Face?</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servicos.length === 0 ? (
                            <tr><td colSpan="6" className="no-data">Nenhum procedimento cadastrado.</td></tr>
                        ) : (
                            servicos.map((servico) => (
                                <tr key={servico.id_servico}>
                                    <td>{servico.id_servico}</td>
                                    {editandoId === servico.id_servico ? (
                                        <>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={editData.desc_servico || ''}
                                                    onChange={(e) => setEditData({ ...editData, desc_servico: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editData.valor_referencia || ''}
                                                    onChange={(e) => setEditData({ ...editData, valor_referencia: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={editData.exige_dente || false}
                                                    onChange={(e) => setEditData({ ...editData, exige_dente: e.target.checked })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={editData.exige_face || false}
                                                    onChange={(e) => setEditData({ ...editData, exige_face: e.target.checked })}
                                                />
                                            </td>
                                            <td className="acao-celula">
                                                <button onClick={() => handleSalvarEdicao(servico.id_servico)} title="Salvar Alterações">
                                                    <FontAwesomeIcon icon={faCheckCircle} />
                                                </button>
                                                <button onClick={() => setEditandoId(null)} title="Cancelar Edição" className="cancelar-btn">
                                                    <FontAwesomeIcon icon={faTimesCircle} />
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{servico.desc_servico}</td>
                                            <td>{parseFloat(servico.valor_referencia).toFixed(2)}</td>
                                            <td>{servico.exige_dente ? 'Sim' : 'Não'}</td>
                                            <td>{servico.exige_face ? 'Sim' : 'Não'}</td>
                                            <td className="acao-celula">
                                                <button onClick={() => iniciarEdicao(servico)} title="Editar">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button onClick={() => abrirModalConfirmacao(servico.id_servico)} title="Excluir" className="excluir-btn">
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <button 
                className="floating-help-button" 
                onClick={() => setIsAjudaOpen(true)}
                title="Ajuda sobre esta página"
            >
                <FontAwesomeIcon icon={faQuestionCircle} />
            </button>

            {/*MODAL DE AJUDA*/}
            <Modal
                isOpen={isAjudaOpen}
                onClose={() => setIsAjudaOpen(false)}
                titulo="Ajuda - Gerenciamento de Procedimentos"
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
                <p>Esta tela permite o controle total sobre a lista de serviços oferecidos pelo consultório.</p>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>
                        <b>Adicionar Novo:</b> Cadastre novos serviços, defina o valor de referência e as regras clínicas.
                    </li>
                    <li>
                        <b>Regras (Dente/Face):</b> Marcar "Exige Dente" ou "Exige Face" garante que este procedimento <b>só poderá ser adicionado</b> em um Orçamento se o dentista selecionar a localização no Odontograma.
                    </li>
                    <li>
                        <b>Edição:</b> Use o ícone de lápis para alterar o preço ou as regras de um serviço.
                    </li>
                    <li>
                        <b>Exclusão:</b> Um procedimento <b>não pode ser excluído</b> se já tiver sido usado em qualquer Orçamento, preservando o histórico financeiro e clínico.
                    </li>
                </ul>
            </Modal>

            {/* NOVO MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                titulo="Confirmar Exclusão"
                footer={
                <>
                <button 
                className="modal-button modal-button-secondary" 
                onClick={() => setIsConfirmModalOpen(false)}
                title="Manter o procedimento ativo."
                >
                Cancelar
                </button>
                <button 
                className="modal-button modal-button-danger"
                onClick={executarExclusao}
                title="Confirmar a desativação do procedimento."
                _ >
                    Sim, Excluir
                </button>
                </>
                }
                >
                    <p>Tem certeza que deseja desativar este procedimento?</p>
                    <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
                    O procedimento não poderá ser usado em novos orçamentos, mas
                    permanecerá visível no histórico de pacientes antigos.
                    </p>
            </Modal>

        </div>
    );
}

export default ProcedimentosTeste;