// src/components/medecinControleur/DetailListeControleur.jsx
// Combine file d'attente cliquable (gauche) + DetailListe (droite)
// Identique au layout medecin traitant

import { useState } from 'react';
import DetailListe from './DetailListe';

const getNom = (item) =>
  item?.collaborateur_nom ||
  (item?.collaborateur && typeof item.collaborateur === 'object'
    ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
    : `Patient #${item?.collaborateur}`);

const getMatricule = (item) =>
  item?.collaborateur_matricule || item?.collaborateur?.matricule || '';

const getInitials = (nom) =>
  (nom || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

/* ─── PatientCard ────────────────────────────────────────── */
function PatientCard({ item, isSelected, onClick }) {
  const nom      = getNom(item);
  const initials = getInitials(nom);
  const isWaiting = item.statut === 'EN_ATTENTE';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px', borderRadius: 12, marginBottom: 8,
        cursor: 'pointer',
        border: `2px solid ${isSelected ? '#0284c7' : 'transparent'}`,
        background: isSelected ? '#e0f2fe' : 'white',
        boxShadow: isSelected
          ? '0 0 0 1px #0284c7, 0 4px 12px rgba(2,132,199,.12)'
          : '0 1px 3px rgba(0,0,0,.06)',
        transition: 'all .15s',
        opacity: isWaiting ? 1 : 0.6,  /* grisé comme traitant */
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#7dd3fc';
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,.09)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.opacity = isWaiting ? '1' : '0.6';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Numéro ordre */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: isWaiting
            ? 'linear-gradient(135deg,#0ea5e9,#0284c7)'
            : '#e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isWaiting ? 'white' : '#94a3b8', fontSize: 11, fontWeight: 800,
        }}>
          {item.ordre ?? '—'}
        </div>

        {/* Avatar — initiales toujours visibles comme traitant */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: isWaiting
            ? 'linear-gradient(135deg,#0ea5e9,#0284c7)'
            : 'linear-gradient(135deg,#22c55e,#16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 13, fontWeight: 800,
        }}>
          {initials}
        </div>

        {/* Nom + matricule */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 700,
            color: isSelected ? '#0369a1' : '#0c4a6e',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {nom}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {getMatricule(item)}
          </div>
        </div>

        {/* Badge statut */}
        <span style={{
          flexShrink: 0, padding: '3px 8px', borderRadius: 20,
          fontSize: 10.5, fontWeight: 700,
          background: isWaiting ? '#fff7ed' : '#e0f2fe',
          color: isWaiting ? '#c2410c' : '#0369a1',
        }}>
          {isWaiting ? 'Attente' : '✓'}
        </span>
      </div>
    </div>
  );
}

/* ─── COMPOSANT PRINCIPAL ─────────────────────────────────── */
export default function DetailListeControleur({ items = [], loading = false, onUpdateItem, medecinNom }) {
  const [selectedItem, setSelectedItem] = useState(null);

  const enAttente = items.filter(i => i.statut === 'EN_ATTENTE');
  const traites   = items.filter(i => i.statut !== 'EN_ATTENTE');

  const handleUpdateItem = (updated) => {
    // Met à jour le selectedItem localement
    setSelectedItem(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
    onUpdateItem && onUpdateItem(updated);
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

      {/* ── Gauche : file d'attente ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
        background: 'white', borderRadius: 16,
        border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #e0f2fe', flexShrink: 0, background: '#f0f9ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0c4a6e' }}>Liste du jour</span>
            <span style={{
              fontSize: 11.5, fontWeight: 700,
              background: enAttente.length > 0 ? '#fff7ed' : '#e0f2fe',
              color: enAttente.length > 0 ? '#c2410c' : '#0369a1',
              padding: '3px 9px', borderRadius: 20,
            }}>
              {enAttente.length} en attente
            </span>
          </div>
        </div>

        {/* Liste scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
          {loading && [1,2,3].map(i => (
            <div key={i} style={{ height: 66, borderRadius: 12, marginBottom: 8, background: '#f0f9ff', animation: 'shimmer 1.4s infinite' }} />
          ))}

          {!loading && items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px', background: '#f8fafc', borderRadius: 12, border: '1.5px dashed #e2e8f0', marginTop: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
              <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Aucun patient aujourd'hui</p>
            </div>
          )}

          {/* EN_ATTENTE */}
          {!loading && enAttente.length > 0 && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, paddingLeft: 4 }}>
                À traiter
              </div>
              {enAttente.map(item => (
                <PatientCard
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedItem?.id}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </>
          )}

          {/* TRAITÉS */}
          {!loading && traites.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px', padding: '0 4px' }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700 }}>Traités ({traites.length})</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              {traites.map(item => (
                <PatientCard
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedItem?.id}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Droite : DetailListe (existant) ── */}
      <div style={{ minHeight: 0, overflow: 'hidden' }}>
        <DetailListe
          item={selectedItem}
          onUpdateItem={handleUpdateItem}
          medecinNom={medecinNom}
        />
      </div>

    </div>
  );
}