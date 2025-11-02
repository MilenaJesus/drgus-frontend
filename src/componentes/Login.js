import React, { useState } from 'react';
import './Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Modal from './Modal';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Função para decodificar o token JWT (sem alterações)
const decodeJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Erro ao decodificar o token:", e);
        return null;
    }
};

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isAjudaOpen, setIsAjudaOpen] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Requisita os tokens
            const tokenResponse = await axios.post(`${API_BASE_URL}/api/token/`, { username, password });
            const { access, refresh } = tokenResponse.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            //Decodifica o token para extrair o ID do usuário
            const decodedToken = decodeJwt(access);
            if (decodedToken && decodedToken.user_id) {
                localStorage.setItem('user_id', decodedToken.user_id); // Salva user_id
            } else {
                // Limpa tokens antigos se a decodificação falhar ou não tiver user_id
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_id');
                throw new Error('ID do usuário não encontrado no token.');
            }

            // Chama a função de sucesso passada pelo App.js
            if (onLoginSuccess) {
                onLoginSuccess();
            }
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Falha no login. Verifique suas credenciais.';
            setError(errorMessage);
            console.error("Erro no login:", err);
             // Limpa tokens em caso de erro de login (credenciais erradas, etc.)
             localStorage.removeItem('access_token');
             localStorage.removeItem('refresh_token');
             localStorage.removeItem('user_id');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <header className="login-header">
                <span className="login-header-text">DrGus</span>
            </header>
            <div className="login-container">
                <form className="login-form" onSubmit={handleSubmit}>
                    <FontAwesomeIcon icon={faUserCircle} className="login-user-icon" />
                    {error && <p className="error-message">{error}</p>}

                    {/* Campo Usuário com Asterisco */}
                    <div className="form-group">
                        <label htmlFor="username">Usuário *</label>
                        <input
                            type="text"
                            id="username"
                            className="login-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                            title="Digite seu nome de usuário (login)."
                        />
                    </div>

                    {/* Campo Senha com Asterisco */}
                    <div className="form-group">
                        <label htmlFor="password">Senha *</label>
                        <input
                            type="password"
                            id="password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            title="Digite sua senha."
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button" 
                        disabled={loading}
                        title="Clique para fazer login no sistema."
                    >
                        {loading? 'Entrando...': 'Entrar'}
                    </button>
                </form>
            </div>

            <button 
                className="floating-help-button" 
                onClick={() => setIsAjudaOpen(true)}
                title="Ajuda"
            >
                <FontAwesomeIcon icon={faQuestionCircle} />
            </button>

            <Modal
                isOpen={isAjudaOpen}
                onClose={() => setIsAjudaOpen(false)}
                titulo="Ajuda - Login"
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
                <p>Esta é a tela de acesso ao sistema.</p>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>
                    <strong>Usuário:</strong> Digite seu nome de usuário fornecido pelo administrador.
                </li>
                <li>
                    <strong>Senha:</strong> Digite sua senha pessoal.
                </li>
                <li>
                    Em caso de problemas para acessar, entre em contato com o suporte: <strong>drgusuepg2025@gmail.com</strong>
                </li>
                </ul>
            </Modal>
        </>
    );
}

export default Login;