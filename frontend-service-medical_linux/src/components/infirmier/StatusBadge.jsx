import React from 'react';

const StatusBadge = ({ statut }) => {
  const cfg = {
    EN_PREPARATION: { label: 'En préparation', bg: '#f3f4f6', color: '#4b5563' },
    ACTIVE: { label: 'Active', bg: '#dbeafe', color: '#1d4ed8' },
    TERMINEE: { label: 'Terminée', bg: '#dcfce7', color: '#16a34a' },
    EN_ATTENTE: { label: 'En attente', bg: '#fff7ed', color: '#ea580c' },
    EFFECTUEE: { label: 'Effectuée', bg: '#dcfce7', color: '#16a34a' },
    ANNULEE: { label: 'Annulée', bg: '#fef2f2', color: '#dc2626' },
  }[statut] || { label: statut, bg: '#f3f4f6', color: '#4b5563' };
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 700,
        padding: '2px 9px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
