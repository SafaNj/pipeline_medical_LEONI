import { useState, useEffect } from 'react';

const getNom = (item) =>
  item?.collaborateur_nom ||
  (item?.collaborateur && typeof item.collaborateur === 'object'
    ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
    : `Patient #${item?.collaborateur}`);

const getInitials = (nom) =>
  (nom || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

export default function ListesDuJour({ items = [], selectedItem, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item =>
    getNom(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      style={{
        height: '100%',
        background: 'white',
        borderRadius: 16,
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#1e40af,#3b82f6)',
          color: 'white',
          padding: '20px 24px',
          borderRadius: '16px 16px 0 0',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: 12, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Contre-visites
        </p>
        <p style={{ fontSize: 18, fontWeight: 700 }}>Patients du jour</p>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <input
          type="text"
          placeholder="🔍 Chercher un patient..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 10,
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color .15s',
          }}
          onFocus={e => (e.target.style.borderColor = '#3b82f6')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>📋</p>
            <p style={{ fontWeight: 600 }}>Aucun patient trouvé</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const nom = getNom(item);
            const initials = getInitials(nom);
            const isSelected = selectedItem?.id === item?.id;

            return (
              <div
                key={item?.id || Math.random()}
                onClick={() => onSelect(item)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: isSelected ? '#eff6ff' : 'white',
                  borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#3b82f6,#1e40af)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                      {nom}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {item?.consultation ? '✓ Consultation faite' : '⏳ En attente'}
                    </div>
                  </div>

                  {/* Badge statut */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: item?.consultation ? '#d1fae5' : '#fef3c7',
                      color: item?.consultation ? '#065f46' : '#92400e',
                    }}
                  >
                    {item?.consultation ? '✓ Consulté' : 'En attente'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer stats */}
      <div
        style={{
          padding: '12px 16px',
          background: '#f9fafb',
          borderTop: '1px solid #f1f5f9',
          fontSize: 12,
          color: '#6b7280',
          flexShrink: 0,
        }}
      >
        Total: <strong>{filteredItems.length}</strong> patient{filteredItems.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
