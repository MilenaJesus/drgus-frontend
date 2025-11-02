import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Menu.css'; 
import { useNotificacoes } from '../context/NotificacaoContext'; // Importe o hook do contexto

function Sidebar({ onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadCount } = useNotificacoes();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isMenuOpen, setIsMenuOpen] = useState(!isMobile); // Começa aberto em desktop, fechado em mobile

    // Efeito para lidar com redimensionamento da tela
    useEffect(() => {
        const handleResize = () => {
            const mobileCheck = window.innerWidth <= 768;
            setIsMobile(mobileCheck);
            // Se passar para desktop, garante que o menu esteja aberto
            if (!mobileCheck) {
                setIsMenuOpen(true);
            } else {
                 // Se passar para mobile, fecha o menu 
                 setIsMenuOpen(false); // Fecha ao virar mobile
            }
        };

        window.addEventListener('resize', handleResize);
        // Chama uma vez no início para definir o estado inicial corretamente
        handleResize(); 
        // Limpa o listener ao desmontar
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Roda apenas uma vez ao montar

    // Função de Logout
    const handleLogout = () => {
        onLogout(); // Chama a função passada pelo App.js (que limpa o state e localStorage)
        navigate('/'); // Redireciona para a página inicial/login
    };

    // Função para abrir/fechar o menu no mobile
    const toggleMenu = () => {
        if (isMobile) { // Só permite fechar se for mobile
             setIsMenuOpen(!isMenuOpen);
        }
    };

    // Verifica se um link está ativo (para estilização)
    const isLinkActive = (path) => {
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Botão de abrir/fechar menu (só aparece em mobile) */}
            {isMobile && (
                <button className="menu-toggle-button" onClick={toggleMenu} aria-label={isMenuOpen ? 'Fechar Menu' : 'Abrir Menu'} aria-expanded={isMenuOpen}>
                    {isMenuOpen ? 'Fechar Menu' : 'Abrir Menu'}
                </button>
            )}

            <aside className={`sidebar ${isMenuOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
                <div className="sidebar-header">
                    <h3>DrGus</h3>
                    {isMobile && isMenuOpen && (
                         <button onClick={toggleMenu} className="close-menu-button" aria-label="Fechar menu">&times;</button>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <Link to="/inicio" onClick={isMobile ? toggleMenu : null} className={isLinkActive('/inicio') ? 'active' : ''}>
                                <i className='bx bx-home-alt'></i>
                                <span>Início</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/pacientes" onClick={isMobile ? toggleMenu : null} className={isLinkActive('/pacientes') ? 'active' : ''}>
                                <i className='bx bx-user'></i>
                                <span>Pacientes</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/agenda" onClick={isMobile ? toggleMenu : null} className={isLinkActive('/agenda') ? 'active' : ''}>
                                <i className='bx bx-calendar' ></i>
                                <span>Agenda</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/orcamentos" onClick={isMobile ? toggleMenu : null} className={isLinkActive('/orcamentos') ? 'active' : ''}>
                                <i className='bx bx-dollar'></i>
                                <span>Orçamentos</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/tratamentos" onClick={isMobile? toggleMenu: null}
                            className={isLinkActive('/tratamentos')? 'active' : ""}>
                            <i className='bx bx-clipboard'></i>
                            <span>Tratamentos</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/pagamentos" onClick={isMobile ? toggleMenu : null} className={isLinkActive('/pagamentos') ? 'active' : ''}>
                                <i className='bx bxs-credit-card-alt'></i>
                                <span>Pagamentos</span>
                            </Link>
                        </li>
                        <li>
                            {/* Link de Notificações com o indicador (badge) */}
                            <Link to="/notificacoes" onClick={isMobile ? toggleMenu : null} className={isLinkActive('/notificacoes') ? 'active' : ''}>
                                <i className='bx bxs-bell'></i>
                                {unreadCount > 0 && ( 
                                    <span className="menu-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                                <span>Notificações</span>
                                {/* Mostra o badge se houver notificações não lidas */}
                                {unreadCount > 0 && (
                                    <span className="menu-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </Link>
                        </li>
                        <li>
                            <Link to="/ajuda" onClick={isMobile? toggleMenu: null}
                                className={isLinkActive('/ajuda')? 'active' : ""}>
                                
                                {/* A correção é esta linha 'style' abaixo: */}
                                <i className='bx bx-help-circle' ></i>
                                
                                <span>Ajuda</span>
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-button">Sair</button>
                </div>
            </aside>
            {isMobile && isMenuOpen && <div className="sidebar-overlay" onClick={toggleMenu}></div>}
        </>
    );
}

export default Sidebar;