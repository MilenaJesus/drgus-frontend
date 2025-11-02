import React from 'react';
import { useToast } from '../context/ToastContext';
import './Toast.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

function Toast() {
    const { toast } = useToast();
    if (!toast) {
        return null;
    }

    const { message, type } = toast;
    const icon = type === 'success' ? faCheckCircle : faTimesCircle;

    return (
        <div className={`toast-container show ${type}`}>
            <FontAwesomeIcon icon={icon} className="toast-icon" />
            <span className="toast-message">{message}</span>
        </div>
    );
}

export default Toast;