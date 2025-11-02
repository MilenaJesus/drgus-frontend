import React from 'react';
import './Modal.css'; 

function Modal({ isOpen, onClose, titulo, children, footer }) {
  if (!isOpen) {
    return null;
  }

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        
        <div className="modal-header">
          <h3 className="modal-title">{titulo}</h3>
          <button onClick={onClose} className="modal-close-button" aria-label="Fechar">
            &times; 
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}

      </div>
    </div>
  );
}

export default Modal;