import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Notificacoes.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Modal from '../componentes/Modal';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Notificacoes() {
    const { showToast } = useToast();
    const [notificacoes, setNotificacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [isAjudaOpen, setIsAjudaOpen] = useState(false);

    const fetchNotificacoes = useCallback(async () => {
        setError(null); 
        setLoading(true); 
        try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Token de autenticação não encontrado.');
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/notificacoes/?lida=false`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setNotificacoes(response.data.results || response.data || []);
        } catch (err) {
        if (err.response && err.response.status === 401) {
            showToast('Sua sessão expirou. Por favor, faça o login novamente.');
            navigate('/login');
        } else {
            setError('Não foi possível carregar as notificações.');
        }
        console.error('Erro ao buscar notificações:', err);
        } finally {
        setLoading(false);
        }
    }, [navigate, showToast]);

    useEffect(() => {
        fetchNotificacoes();
    }, [fetchNotificacoes]);

    const handleMarcarComoLida = async (id) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Token não encontrado.');

            await axios.patch(
                `${API_BASE_URL}/api/notificacoes/${id}/`,
                { lida: true },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setNotificacoes(prevNotificacoes => 
                prevNotificacoes.filter(notif => notif.id_notificacao !== id)
            );

        } catch (err) {
            console.error('Erro ao marcar notificação como lida:', err);
            showToast('Não foi possível marcar a notificação como lida.');
             if (err.response && err.response.status === 401) {
                 showToast('Sessão expirada. Faça login novamente.');
                 navigate('/login');
             }
        }
    };

     const formatTempoAtras = (dateString) => {
         try {
             return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
         } catch (e) {
             return dateString;
         }
     };

    if (loading) return <div className="loading-message">Carregando notificações...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="notificacoes-container">

            <div className="notificacoes-list">
                {notificacoes.length > 0 ? (
                    notificacoes.map(notificacao => (
                        <div key={notificacao.id_notificacao} className={`notificacao-card ${notificacao.lida ? 'lida' : ''}`}>
                            <div className="notificacao-content">
                                {/* Usa ícone diferente se já lida */}
                                <FontAwesomeIcon 
                                    icon={notificacao.lida ? faCheckCircle : faBell} 
                                    className="notificacao-icon" 
                                />
                                <div className="notificacao-text-wrapper">
                                    <span className="notificacao-text">{notificacao.mensagem}</span>
                                    {/* Exibe o tempo relativo */}
                                    <span className="notificacao-tempo">{formatTempoAtras(notificacao.data_criacao)}</span>
                                </div>
                            </div>
                            {/* Só mostra o botão se a notificação NÃO foi lida */}
                            {!notificacao.lida && (
                                <button 
                                    className="notificacao-button" 
                                    onClick={() => handleMarcarComoLida(notificacao.id_notificacao)}
                                    title="Marcar esta notificação como lida e removê-la da lista."
                                >
                                    <span>OK</span>
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="no-data">Nenhuma notificação encontrada.</div>
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
                titulo="Ajuda - Notificações"
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
                <p>Esta tela mostra o histórico de todas as suas notificações não lidas.</p>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>
                    As notificações são geradas automaticamente pelo sistema para avisar sobre pendências (consultas, pagamentos, orçamentos, etc.).
                </li>
                <li>
                    Clicar em "OK" em uma notificação irá marcá-la como "lida" e ela desaparecerá desta lista.
                </li>
                <li>
                    O ícone de sino no topo da página também mostrará apenas as notificações não lidas.
                </li>
                </ul>
            </Modal>

        </div>
    );
}

export default Notificacoes;