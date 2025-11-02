import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const NotificacaoContext = createContext();

export const useNotificacoes = () => useContext(NotificacaoContext);

export const NotificacaoProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingCount, setIsLoadingCount] = useState(true);
    const navigate = useNavigate(); 

    const fetchUnreadCount = useCallback(async () => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            setUnreadCount(0);
            setIsLoadingCount(false);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/api/notificacoes/?lida=false`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (Array.isArray(response.data)) {
                 setUnreadCount(response.data.length); 
            } else if (response.data && typeof response.data.count === 'number') {
                 setUnreadCount(response.data.count);
            } else {
                 setUnreadCount(0); 
            }

        } catch (err) {
            console.error('Erro detalhado em fetchUnreadCount:', err); 
             if (err.response && err.response.status === 401) {
                 localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); localStorage.removeItem('user_id'); setUnreadCount(0); navigate('/login', { replace: true }); 
             }
        } finally {
            setIsLoadingCount(false);
        }
    }, [navigate]);

    // Busca inicial
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]); 

    const decrementUnreadCount = useCallback(() => {
        setUnreadCount(prevCount => (prevCount > 0 ? prevCount - 1 : 0));
    }, []); 

    const value = {
        unreadCount,        
        isLoadingCount,    
        fetchUnreadCount,   
        decrementUnreadCount 
    };

    return (
        <NotificacaoContext.Provider value={value}>
            {children}
        </NotificacaoContext.Provider>
    );
};