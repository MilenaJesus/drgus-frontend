import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Inicio.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faBell, faArrowRight, faPlus, faCreditCard, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { format, startOfMonth, endOfMonth, formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Modal from '../componentes/Modal';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Inicio() {
    const [consultasHoje, setConsultasHoje] = useState([]);
    const [pagamentosResumo, setPagamentosResumo] = useState({ totalPrevisto: 0, pendente: 0, vencido: 0 });
    const [notificacoesRecentes, setNotificacoesRecentes] = useState([]);
    const [loadingConsultas, setLoadingConsultas] = useState(true);
    const [loadingPagamentos, setLoadingPagamentos] = useState(true);
    const [loadingNotificacoes, setLoadingNotificacoes] = useState(true);
    const [error, setError] = useState(null); 
    const navigate = useNavigate();
    const [isAjudaOpen, setIsAjudaOpen] = useState(false);

    const fetchPacientesMap = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Token não encontrado.');
            const response = await axios.get(`${API_BASE_URL}/api/pacientes/`, { headers: { 'Authorization': `Bearer ${token}` } });
            const pacientesData = response.data.results || response.data || [];
            const map = pacientesData.reduce((acc, paciente) => {
                acc[paciente.id_paciente] = paciente.nome;
                return acc;
            }, {});
            return map; 
        } catch (err) {
            console.error('Erro ao buscar pacientes:', err);
             if (err.response && err.response.status === 401) { navigate('/login'); }
             return {}; 
        }
    }, [navigate]);

    const fetchConsultasHoje = useCallback(async (pacMap) => {
        setLoadingConsultas(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Token não encontrado.');
            
            const hoje = format(new Date(), 'yyyy-MM-dd');
            const response = await axios.get(`${API_BASE_URL}/api/agendamentos/?data_consulta=${hoje}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const consultas = response.data.results || response.data || [];
            
            const consultasComNomes = consultas.map(consulta => ({
                 ...consulta,
                 nome_paciente: pacMap[consulta.paciente] || `ID: ${consulta.paciente}` 
            }));

            consultasComNomes.sort((a, b) => (a.horario_consulta || "").localeCompare(b.horario_consulta || ""));
            setConsultasHoje(consultasComNomes);
        } catch (err) {
            console.error('Erro ao buscar consultas de hoje:', err);
            setError('Falha ao carregar consultas.');
            if (err.response && err.response.status === 401) { navigate('/login'); }
        } finally {
            setLoadingConsultas(false);
        }
    }, [navigate]);

    const fetchResumoPagamentos = useCallback(async () => {
        setLoadingPagamentos(true);
        setError(null);
        try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Token não encontrado.');
        
        const hoje = new Date();
        const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd');
        const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd');
        const responseMes = await axios.get(
            `${API_BASE_URL}/api/parcelas/?data_vencimento_after=${inicioMes}&data_vencimento_before=${fimMes}`, 
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        const responseAtrasadas = await axios.get(
            `${API_BASE_URL}/api/parcelas/?status=Atrasado`, 
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        const parcelasMes = responseMes.data.results || responseMes.data || [];
        const parcelasAtrasadas = responseAtrasadas.data.results || responseAtrasadas.data || [];

        let totalPrevisto = 0;
        let pendente = 0;
        let vencido = 0; 

        parcelasMes.forEach(p => {
            const valor = parseFloat(p.valor_parcela || 0);
            totalPrevisto += valor;
            if (p.status === 'Pendente' || p.status === 'Atrasado') {
            pendente += valor;
            }
        });

        parcelasAtrasadas.forEach(p => {
            vencido += parseFloat(p.valor_parcela || 0);
        });

        setPagamentosResumo({ totalPrevisto, pendente, vencido });

        } catch (err) {
        console.error('Erro ao buscar resumo de pagamentos:', err);
        if (err.response && err.response.status === 401) { navigate('/login'); }
        else { setError('Erro ao carregar pagamentos.'); }
        } finally {
        setLoadingPagamentos(false);
        }
    }, [navigate]);

    const fetchNotificacoesRecentes = useCallback(async () => {
        setLoadingNotificacoes(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Token não encontrado.');
            const response = await axios.get(`${API_BASE_URL}/api/notificacoes/?lida=false&limit=4`, { headers: { 'Authorization': `Bearer ${token}` } });
            setNotificacoesRecentes(response.data.results || response.data || []);
        } catch (err) {
            console.error('Erro ao buscar notificações recentes:', err);
            if (err.response && err.response.status === 401) { navigate('/login'); }
        } finally {
            setLoadingNotificacoes(false);
        }
    }, [navigate]);

    useEffect(() => {
        const carregarDashboard = async () => {
        setLoadingConsultas(true); setLoadingPagamentos(true); setLoadingNotificacoes(true);
        const pacMap = await fetchPacientesMap(); 
        
        await Promise.all([
            fetchConsultasHoje(pacMap),
            fetchResumoPagamentos(),
            fetchNotificacoesRecentes()
        ]);
        };
        carregarDashboard();
    }, [fetchPacientesMap, fetchConsultasHoje, fetchResumoPagamentos, fetchNotificacoesRecentes]); 

    const formatTempoAtras = (dateString) => {
         try {
             const date = new Date(dateString);
             return formatDistanceToNow(date, { addSuffix: true, locale: ptBR }); 
         } catch (e) { 
            console.error("Erro formatando data:", dateString, e);
            return dateString; 
         }
    };

    return (
    <div className="dashboard-container">
        {error && <p className="error-message" style={{textAlign: 'center', marginBottom: '1rem'}}>{error}</p>}
        
        <div className="dashboard-wrapper">
            
            {/* Linha de cima: Consultas e Pagamentos */}
            <div className="flex-row-container">
            
            {/* Seção Consultas */}
            <div className="dashboard-section consultations-section">
                <div className="section-header">
                <FontAwesomeIcon icon={faCalendarDays} />
                <h2>Consultas do Dia</h2>
                </div>
                {loadingConsultas ? ( <p>Carregando consultas...</p> )
                : consultasHoje.length > 0 ? (
                <table className="dashboard-table">
                    <thead><tr><th>Horário</th><th>Paciente</th><th>Status</th></tr></thead>
                    <tbody>
                    {consultasHoje.map(consulta => (
                        <tr key={consulta.id_consulta}>
                        <td>{consulta.horario_consulta.substring(0, 5)}</td>
                        <td>{consulta.nome_paciente}</td>
                        <td>{consulta.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                ) : (
                
                <p className="no-data-message">Nenhuma consulta agendada para hoje.</p>
                
                )}

                <Link 
                to="/agenda" 
                className="dashboard-link-button"
                title="Ir para a tela de Agenda completa" 
                >
                Ver agenda completa <FontAwesomeIcon icon={faArrowRight} />
                </Link>
            </div>
            
            {/* Seção Pagamentos */}
            <div className="dashboard-section payments-section">
                <div className="section-header">
                    <FontAwesomeIcon icon={faCreditCard} style={{ color: '#000000' }} />
                    <h2>Pagamentos do Mês</h2>
                    </div>
                    {loadingPagamentos ? ( <p>Carregando resumo...</p> )
                    : ( <>
                    <div className="payment-item" title="Soma de todas as parcelas com vencimento neste mês."><span>Total previsto:</span><strong>R$ {pagamentosResumo.totalPrevisto.toFixed(2)}</strong></div>
                    <div className="payment-item" title="Soma das parcelas 'Pendentes' ou 'Atrasadas' deste mês."><span>Pendentes:</span><strong>R$ {pagamentosResumo.pendente.toFixed(2)}</strong></div>
                    <div className="payment-item" title="Soma de TODAS as parcelas com status 'Atrasado' (de qualquer mês)."><span>Vencido:</span><strong>R$ {pagamentosResumo.vencido.toFixed(2)}</strong></div>
                    </> )}
                    <Link 
                        to="/pagamentos" 
                        className="dashboard-link-button"
                        title="Ir para a tela de Pagamentos para ver detalhes e registrar baixas." 
                    >
                        Ver pagamentos <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>
            </div>
            
            {/* Linha de baixo: Notificações e Acessos Rápidos */}
            <div className="flex-row-container">
            
            {/* Seção Notificações */}
            <div className="dashboard-section notifications-section">
                <div className="section-header">
                <FontAwesomeIcon icon={faBell} />
                <h2>Notificações</h2>
                </div>
                {loadingNotificacoes ? ( <p>Carregando notificações...</p> ) 
                : notificacoesRecentes.length > 0 ? (
                <div className="notification-list-simple">
                    {notificacoesRecentes.map(notif => (
                    <div key={notif.id_notificacao} className="notification-item-inicio">
                    <p className="notification-message-inicio">{notif.mensagem}</p>
                    <span className="notification-time-inicio">
                        {formatTempoAtras(notif.data_criacao)}
                    </span>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="no-data-message">Nenhuma notificação nova.</p>
                )}
                
                <Link 
                to="/notificacoes" 
                className="dashboard-link-button"
                title="Ir para a tela de Notificações para ver o histórico completo." 
                >
                Ver todas as notificações <FontAwesomeIcon icon={faArrowRight} />
                </Link>
            </div>
            
            {/* Seção Acessos Rápidos */}
            <div className="dashboard-section acessos-rapidos-section">
                <div className="acessos-rapidos-header"><h3>Acessos rápidos</h3></div>
                <div className="quick-access-buttons">
                <Link 
                    to="/patients/new" 
                    className="quick-access-button"
                    title="Abrir o formulário de cadastro para um novo paciente." 
                >
                    <FontAwesomeIcon icon={faPlus} /> Novo paciente
                </Link>
                <Link 
                    to="/agenda" 
                    state={{ openNewModal: true }} 
                    className="quick-access-button"
                    title="Ir para a Agenda e abrir o modal de nova consulta." 
                >
                    <FontAwesomeIcon icon={faPlus} /> Nova consulta
                </Link>
                <Link 
                    to="/orcamentos/novo" 
                    state={{ openNewModal: true }} 
                    className="quick-access-button"
                    title="Abrir a tela de criação de um novo orçamento." 
                >
                    <FontAwesomeIcon icon={faPlus} /> Novo orçamento
                </Link>
                </div>
            </div>
            </div>
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
            titulo="Ajuda - Dashboard Inicial"
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
            <p>Esta é a sua tela principal (Dashboard), ela fornece um resumo rápido da clínica.</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>
                <strong>Consultas do Dia:</strong> Mostra os agendamentos marcados para hoje.
            </li>
            <li>
                <strong>Pagamentos do Mês:</strong> Exibe um resumo financeiro das parcelas com vencimento no mês atual. O campo "Vencido" mostra o valor total de TODAS as parcelas atrasadas, de qualquer mês.
            </li>
            <li>
                <strong>Notificações:</strong> Lista as 4 alertas mais recentes (como orçamentos pendentes, parcelas vencendo, etc.).
            </li>
            <li>
                <strong>Acessos rápidos:</strong> Atalhos para as ações mais comuns do dia a dia.
            </li>
            </ul>
        </Modal>
    </div>
  );
}

export default Inicio;