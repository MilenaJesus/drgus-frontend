import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './componentes/Login';
import Menu from './componentes/Menu';
import Topo from './componentes/Topo';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Inicio from './paginas/Inicio';
import ListaPacientes from './paginas/ListaPacientes';
import DetalhesPacientes from './paginas/DetalhesPacientes';
import RegistroPacientes from './paginas/RegistroPacientes';
import EditarPaciente from './paginas/EditarPaciente';
import Agenda from './paginas/Agenda';
import Orcamentos from './paginas/Orcamentos';
import ListaOrcamentos from './paginas/ListaOrcamentos';
import Pagamentos from './paginas/Pagamentos';
import Notificacoes from './paginas/Notificacoes';
import { NotificacaoProvider } from './context/NotificacaoContext';
import AjudaGeral from './paginas/AjudaGeral';
import ListaTratamentos from './paginas/ListaTratamentos';
import Procedimentos from './paginas/Procedimentos';
import { ToastProvider } from './context/ToastContext';
import Toast from './componentes/Toast';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
  };

  const MainLayout = () => {
        if (!isLoggedIn) {
            // Se não estiver logado, redireciona para a página de login
            return <Navigate to="/" replace />;
        }
        return (
            <div className="app-main-layout">
                <Menu onLogout={handleLogout} />
                <div className="content-area">
                    <Topo />
                    {/* Outlet renderiza o componente da rota filha */}
                    <Outlet /> 
                </div>
            </div>
        );
    };

    return (
        <ToastProvider>
            <Router>
            <NotificacaoProvider>
                <Toast />
                <Routes>
                    {/* Rota de Login (pública) */}
                    <Route 
                        path="/" 
                        element={isLoggedIn ? <Navigate to="/inicio" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} 
                    />

                    {/* Rotas Protegidas (dentro do MainLayout) */}
                    <Route element={<MainLayout />}> {/* Usar element={} para layout */}
                        <Route path="inicio" element={<Inicio />} />
                        <Route path="pacientes" element={<ListaPacientes />} />
                        <Route path="patients/new" element={<RegistroPacientes />} />
                        <Route path="patients/:id" element={<DetalhesPacientes />} />
                        <Route path="patients/:id/edit" element={<EditarPaciente />} />
                        <Route path="agenda" element={<Agenda />} />3
                        <Route path="orcamentos" element={<ListaOrcamentos />} />
                        <Route path="orcamentos/novo" element={<Orcamentos />} />
                        <Route path="tratamentos" element={<ListaTratamentos />} />
                        <Route path="/procedimentos" element={<Procedimentos />} />
                        <Route path="pagamentos" element={<Pagamentos />} />
                        <Route path="notificacoes" element={<Notificacoes />} />
                        <Route path="ajuda" element={<AjudaGeral />} />
                    </Route>

                    {/* Rota Catch-all (opcional, redireciona para login se não encontrar) */}
                    <Route path="*" element={<Navigate to="/" replace />} /> 
                </Routes>
            </NotificacaoProvider>
        </Router>
        </ToastProvider>
        
    );
}

export default App;