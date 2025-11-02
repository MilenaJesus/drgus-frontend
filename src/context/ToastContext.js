import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    
    const toastTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []); 

    const showToast = useCallback((message, type = 'success') => {
        
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        setToast({ message, type });

        toastTimerRef.current = setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null; // Limpa o ref
        }, 3000); // 3 segundos
    }, []); 

    const value = {
        showToast,
        toast
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};