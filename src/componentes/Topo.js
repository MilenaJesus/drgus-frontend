import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios'; 
import './Topo.css';
import { useNotificacoes } from '../context/NotificacaoContext'; 
import { formatDistanceToNow } from 'date-fns'; 
import ptBR from 'date-fns/locale/pt-BR'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Mapeamento dos títulos das páginas (ajuste conforme suas rotas)
const pageTitles = {
    '/inicio': 'Início',
    '/pacientes': 'Pacientes',
    '/patients/new': 'Novo Paciente', // Ajustado para corresponder à rota
    '/patients/:id': 'Detalhes do Paciente', // Mantém o padrão genérico
    '/patients/:id/edit': 'Editar Paciente', // Adicionada rota de edição
    '/agenda': 'Agenda',
    '/orcamentos': 'Orçamentos',
    '/tratamentos': 'Tratamentos',
    '/procedimentos': 'Procedimentos',
    '/pagamentos': 'Pagamentos',
    '/notificacoes': 'Notificações',
    '/ajuda': 'Ajuda'
};

function Header() {
    const location = useLocation();
    // Pega dados e funções do Contexto de Notificações
    const { unreadCount, fetchUnreadCount, isLoadingCount } = useNotificacoes();

    // Estados locais para o dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [isLoadingDropdown, setIsLoadingDropdown] = useState(false);

    // Ref para o container do dropdown (para detectar cliques fora)
    const dropdownRef = useRef(null);

    // Função para buscar as notificações recentes NÃO LIDAS
    const fetchRecentNotifications = useCallback(async () => {
        // Não busca se não houver não lidas ou se já estiver buscando
        if (unreadCount === 0 || isLoadingDropdown) {
            setRecentNotifications([]);
            return;
        }
        setIsLoadingDropdown(true);
        const token = localStorage.getItem('access_token');
        if (!token) { setIsLoadingDropdown(false); return; }

        try {
            // Busca as X mais recentes não lidas (ex: limit=5)
            const response = await axios.get(`${API_BASE_URL}/api/notificacoes/?lida=false&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const notificationsData = response.data.results || (Array.isArray(response.data) ? response.data : []);
            setRecentNotifications(notificationsData);
        } catch (error) {
            console.error("Erro ao buscar notificações recentes:", error);
            setRecentNotifications([]); // Limpa em caso de erro
             // Tratar erro 401 (opcional aqui, já tratado no context)
        } finally {
            setIsLoadingDropdown(false);
        }
    }, [unreadCount, isLoadingDropdown]); // Adicionado isLoadingDropdown como dependência

    // Função para abrir/fechar o dropdown
    const toggleDropdown = () => {
        const nextState = !isDropdownOpen;
        setIsDropdownOpen(nextState);
        // Busca notificações ao abrir (se houver não lidas)
        if (nextState && unreadCount > 0) {
            fetchRecentNotifications();
        }
    };

    // Função para marcar todas como lidas
    const handleMarkAllRead = async () => {
        
        // Verifica se há algo para marcar
        if (unreadCount === 0) {
            setIsDropdownOpen(false); // Fecha o dropdown se já estiver vazio
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error("Token não encontrado");

            // Chama o novo endpoint do backend usando POST
            await axios.post(
                `${API_BASE_URL}/api/notificacoes/marcar-todas-como-lidas/`, 
                {}, // Corpo da requisição vazio, pois a ação não precisa de dados extras
                { headers: { 'Authorization': `Bearer ${token}` } }
            ); 
            
            // Após sucesso:
            fetchUnreadCount(); // Pede ao Contexto para atualizar a contagem global (deve ir para 0)
            setRecentNotifications([]); // Limpa a lista local no dropdown
            setIsDropdownOpen(false); // Fecha o dropdown

        } catch (error) {
            console.error("Erro ao marcar todas como lidas:", error.response?.data || error.message);
            alert("Erro ao marcar notificações como lidas. Verifique o console.");
            // Não fecha o dropdown em caso de erro para o usuário ver
        }
    };

     // Efeito para fechar dropdown ao clicar fora
     useEffect(() => {
         const handleClickOutside = (event) => {
             // Verifica se o clique foi fora do elemento referenciado pelo dropdownRef
             if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                 setIsDropdownOpen(false);
             }
         };
         if (isDropdownOpen) {
             document.addEventListener('mousedown', handleClickOutside);
         } else {
             document.removeEventListener('mousedown', handleClickOutside);
         }
         return () => { // Limpeza ao desmontar
             document.removeEventListener('mousedown', handleClickOutside);
         };
     }, [isDropdownOpen]);


    // Função para formatar tempo relativo
    const formatTempoAtras = (dateString) => {
         try {
             const date = new Date(dateString);
             return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
         } catch (e) {
             console.error("Erro formatando data:", dateString, e);
             return dateString;
         }
    };

    // Função para pegar o título da página (ajustada para rotas dinâmicas)
    const getPageTitle = () => {
        let title = 'DrGus'; // Título padrão
        // Verifica rotas exatas primeiro
        if (pageTitles[location.pathname]) {
            title = pageTitles[location.pathname];
        } else {
            // Verifica rotas com parâmetros (ex: /patients/:id)
            for (const path in pageTitles) {
                if (path.includes(':')) {
                    // Cria uma regex a partir do padrão da rota
                    // Ex: /patients/:id vira /patients/[^/]+
                    const regexPath = new RegExp(`^${path.replace(/:\w+/g, '[^/]+')}$`);
                    if (regexPath.test(location.pathname)) {
                        title = pageTitles[path];
                        break; // Encontrou, pode parar
                    }
                }
            }
        }
        return title;
    };
    const currentPageTitle = getPageTitle();

    return (
        <header className="app-header-common">
            <div className="page-title">{currentPageTitle}</div>

            {/* Ícone de Notificação agora como botão com dropdown */}
            <div className="notification-icon-wrapper" ref={dropdownRef}>
                <button type="button" className="notification-icon-button" onClick={toggleDropdown} aria-label="Abrir notificações" aria-haspopup="true" aria-expanded={isDropdownOpen}>
                    <i className='bx bxs-bell'></i> {/* Ícone do sino */}
                     {/* Badge (mostra se não estiver carregando e houver > 0) */}
                     {!isLoadingCount && unreadCount > 0 && (
                         <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                     )}
                </button>

                {/* O Dropdown */}
                {isDropdownOpen && (
                    <div className="notification-dropdown">
                        <div className="dropdown-header">
                            <span>Notificações Recentes</span>
                            {/* Mostra botão "Marcar todas" apenas se houver notificações listadas */}
                            {!isLoadingDropdown && recentNotifications.length > 0 && (
                                <button onClick={handleMarkAllRead} className="mark-all-read-button">
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>
                        <ul className="notification-list">
                            {isLoadingDropdown ? (
                                <li className="notification-item loading">Carregando...</li>
                            ) : recentNotifications.length > 0 ? (
                                recentNotifications.map(notif => (
                                    <li key={notif.id_notificacao} className="notification-item">
                                            <div className="notification-link"> {/* Div para manter estilo */}
                                                <p className="notification-message">{notif.mensagem}</p>
                                                <span className="notification-time">{formatTempoAtras(notif.data_criacao)}</span>
                                            </div>
                                    </li>
                                ))
                            ) : (
                                <li className="notification-item empty">Nenhuma notificação nova.</li>
                            )}
                        </ul>
                         <div className="dropdown-footer">
                             {/* Link para a página principal de notificações */}
                             <Link to="/notificacoes" onClick={() => setIsDropdownOpen(false)}>
                                 Ver todas as notificações
                             </Link>
                         </div>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;