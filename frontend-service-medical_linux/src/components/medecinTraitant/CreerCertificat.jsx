// src/components/medecinTraitant/CreerCertificat.jsx
import { useState } from 'react';
import { creerCertificat, updateCertificat } from '../../api/consultationsApi';
import PrintCertificatMedical from './Printcertificatmedical';

import { useAuth } from '../../context/AuthContext';

export default function CreerCertificat({ consultation, onCreated, onClose, mode = 'create', initialCertificat = null }) {
  const { user } = useAuth();
  const isEdit = mode === 'edit';

  const [jours,      setJours]      = useState(String(initialCertificat?.jours_repos || ''));
  const [dateDebut,  setDateDebut]  = useState(
    initialCertificat?.date_debut_repos
      ? fromIsoDate(initialCertificat.date_debut_repos)
      : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  );
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  // Sauvegarde les données juste avant onCreated (qui ferme le modal)
  // pour que le bouton Imprimer fonctionne même après enregistrement
  const [snapshotData, setSnapshotData] = useState(null);

  const medecin = {
    nom:        user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.nom || user?.username || 'Médecin',
    first_name: user?.first_name || '',
    last_name:  user?.last_name || '',
    full_name:  user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '',
    username:   user?.username || '',
    titre:      user?.titre      || 'Docteur',
    specialite: user?.specialite || 'Médecine Générale',
    ville:      user?.ville      || 'Menzel Hayet',
  };

  const patientNom = consultation?.collaborateur_nom || '';

  const validate = () => {
    if (!jours || isNaN(Number(jours)) || Number(jours) < 1) {
      setError('Veuillez saisir un nombre de jours valide.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setError('');
    setLoading(true);
    try {
      const payload = {
        jours_repos: Number(jours),
        date_debut_repos: toInputDate(dateDebut),
      };
      const certif = isEdit
        ? await updateCertificat(initialCertificat.id, payload)
        : await creerCertificat({ consultation: consultation.id, ...payload });
      // ← Capturer AVANT onCreated qui peut fermer le modal et détruire les states
      setSnapshotData({ jours: Number(jours), dateDebut });
      onCreated(certif);
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
        Object.values(data ?? {}).flat().join(' ') ||
        'Erreur lors de la création.'
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !!jours && Number(jours) >= 1;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(5px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 18,
          width: 480, maxWidth: '95vw',
          boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          animation: 'modalIn .2s ease',
        }}
      >
        <style>{`@keyframes modalIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '22px 22px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: '#eff6ff', border: '1.5px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              📋
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                {isEdit ? 'Modifier certificat médical' : 'Nouveau certificat médical'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                {patientNom} — {medecin.titre} {medecin.nom}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 22px' }}>
          {error && <ErrorBox msg={error} onClose={() => setError('')} />}

          {/* Patient (lecture seule) */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Patient</label>
            <div style={{
              padding: '10px 14px', background: '#f8fafc',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: 13.5, color: '#374151', fontWeight: 600,
            }}>
              {patientNom || '—'}
            </div>
          </div>

          {/* Nombre de jours */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nombre de jours de repos *</label>
            <input
              type="number"
              min="1"
              value={jours}
              onChange={e => setJours(e.target.value)}
              placeholder="Ex : 3"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Date début */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>À partir du</label>
            <input
              type="date"
              value={toInputDate(dateDebut)}
              onChange={e => setDateDebut(fromInputDate(e.target.value))}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Aperçu texte */}
          {canSubmit && (
            <div style={{
              padding: '10px 14px', background: '#f0fdf4',
              border: '1px solid #bbf7d0', borderRadius: 10,
              fontSize: 12.5, color: '#15803d', lineHeight: 1.7,
            }}>
              <strong>Aperçu :</strong><br />
              Je soussigné, Docteur <strong>{medecin.nom}</strong>, certifie avoir reçu et examiné
              aujourd'hui M <strong>{patientNom}</strong> et que son état de santé nécessite (<strong>{jours}</strong>) jour(s)
              de repos à partir du <strong>{dateDebut}</strong> sauf complications ultérieures.
            </div>
          )}

          {/* Info médecin auto */}
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 8, fontSize: 12, color: '#1d4ed8',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Signé par <strong style={{ marginLeft: 3 }}>{medecin.titre} {medecin.nom}</strong>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 22px 22px',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          borderTop: '1px solid #f1f5f9', flexWrap: 'wrap',
        }}>
          <button onClick={onClose} disabled={loading} style={cancelBtnStyle}>
            Annuler
          </button>

          {/* Bouton Imprimer — PrintCertificatMedical */}
          <PrintCertificatMedical
            medecin={medecin}
            data={{
              patientNom,
              patientCin: consultation.collaborateur_cin || '',
              // Priorité : snapshot après enregistrement → sinon valeurs actuelles du formulaire
              jours:     snapshotData ? snapshotData.jours    : Number(jours || 0),
              dateDebut: snapshotData ? snapshotData.dateDebut : dateDebut,
            }}
            siteConfig={consultation}
          />

          {/* Bouton Enregistrer */}
          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            style={{
              ...submitBtnStyle,
              background: canSubmit ? '#2563eb' : '#e2e8f0',
              color:      canSubmit ? 'white'   : '#94a3b8',
              cursor: (loading || !canSubmit) ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Enregistrement…' : (isEdit ? '✓ Enregistrer modifications' : '✓ Créer le certificat')}
          </button>
        </div>
      </div>
    </div>
  );
}


// Micro-composants

function ErrorBox({ msg, onClose }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca',
      color: '#b91c1c', padding: '10px 14px',
      borderRadius: 10, fontSize: 13, marginBottom: 16,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
    }}>
      {msg}
      {onClose && (
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b91c1c', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}


// Helpers date

function toInputDate(fr) {
  if (!fr) return '';
  const p = fr.split('/');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : fr;
}
function fromInputDate(iso) {
  if (!iso) return '';
  const p = iso.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

function fromIsoDate(iso) {
  if (!iso) return '';
  const dateOnly = String(iso).split('T')[0];
  return fromInputDate(dateOnly);
}


// Styles

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#475569', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 8,
};
const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  fontSize: 13.5, fontFamily: 'inherit',
  outline: 'none', color: '#0f172a',
  boxSizing: 'border-box',
  transition: 'border-color .15s',
};
const closeBtnStyle = {
  width: 32, height: 32, border: 'none',
  background: '#f1f5f9', borderRadius: 8,
  cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: '#64748b',
};
const cancelBtnStyle = {
  padding: '10px 20px', background: 'white',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit', color: '#475569',
};
const submitBtnStyle = {
  padding: '10px 22px', border: 'none', borderRadius: 10,
  fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
  transition: 'all .15s',
};