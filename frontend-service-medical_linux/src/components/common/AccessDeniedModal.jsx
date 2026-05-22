/**
 * 📍 ACCESS DENIED ERROR MODAL
 * User-friendly modal for displaying 403 Forbidden errors
 * Used by components when site-based access is denied
 */
import { useState } from 'react';

const AccessDeniedModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          padding: '32px',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
          }}
        >
          🔒
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626', marginBottom: '12px' }}>
          Accès Refusé
        </h2>

        {/* Message */}
        <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
          {message ||
            "Vous n'avez pas les droits d'accéder à cette ressource. Assurez-vous que vous êtes connecté avec le bon compte et le bon site."}
        </p>

        {/* Additional Info */}
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            fontSize: '12px',
            color: '#7f1d1d',
          }}
        >
          <strong>💡 Conseil:</strong> Vérifiez que vous êtes connecté au site correct. Vous ne pouvez accéder qu'aux données
          de votre site assigné.
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#b91c1c')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

/**
 * 🪝 HOOK: useAccessDeniedModal
 * Manage 403 error modal state in any component
 * @returns {Object} - { isOpen, message, showError, closeError } 
 */
export function useAccessDeniedModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const showError = (errorMessage) => {
    setMessage(
      errorMessage ||
        "Vous n'avez pas accès à cette ressource. Vérifiez votre site et vos permissions."
    );
    setIsOpen(true);
  };

  const closeError = () => {
    setIsOpen(false);
    setMessage('');
  };

  return { isOpen, message, showError, closeError };
}

export default AccessDeniedModal;
