// src/components/medecinTraitant/CreerOrdonnance.jsx
import { useState } from 'react';
import { creerOrdonnance, updateOrdonnance } from '../../api/consultationsApi';
import PrintOrdonnance from './Printordonnance';

import { useAuth } from '../../context/AuthContext';

export default function CreerOrdonnance({ consultation, onCreated, onClose, mode = 'create', initialOrdonnance = null }) {
  const { user } = useAuth();
  const isEdit = mode === 'edit';
  const [medicaments, setMedicaments] = useState(initialOrdonnance?.medicaments || '');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const prenomAr =
    user?.prenom_ar ||
    user?.first_name_ar ||
    user?.firstname_ar ||
    user?.firstNameAr ||
    user?.prenomAr ||
    '';

  const nomAr =
    user?.nom_ar ||
    user?.last_name_ar ||
    user?.lastname_ar ||
    user?.lastNameAr ||
    user?.nomAr ||
    '';

  const nomArabeComplet =
    user?.full_name_ar ||
    user?.fullNameAr ||
    user?.nom_arabe ||
    `${prenomAr} ${nomAr}`.trim();

  // ── Médecin depuis le user connecté ──
  // DEBUG: Log pour vérifier les données reçues
  console.log('DEBUG - user data:', {
    full_name: user?.full_name,
    nom: user?.nom,
    first_name: user?.first_name,
    last_name: user?.last_name,
  });

  const medecin = {
    nom:        user?.full_name || user?.nom || `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    first_name: user?.first_name || '',
    last_name:  user?.last_name || '',
    nom_ar:     nomAr,
    prenom_ar:  prenomAr,
    nom_arabe:  nomArabeComplet,
    titre:      user?.titre      || 'Docteur',
    specialite: user?.specialite || 'Médecine Générale',
    ville:      user?.ville      || 'Menzel Hayet',
  };

  // ── Lignes parsées depuis le textarea ──
  const getLignes = () =>
    medicaments
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(texte => ({ texte }));

  const handleSubmit = async () => {
    if (!medicaments.trim()) {
      setError('Veuillez saisir les médicaments.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const ordonnance = isEdit
        ? await updateOrdonnance(initialOrdonnance.id, { medicaments: medicaments.trim() })
        : await creerOrdonnance({ consultation: consultation.id, medicaments: medicaments.trim() });
      onCreated(ordonnance);
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
        Object.values(data ?? {}).flat().join(' ') ||
        "Erreur lors de la création."
      );
    } finally {
      setLoading(false);
    }
  };

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
              background: '#f0fdf4', border: '1.5px solid #bbf7d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                {isEdit ? 'Modifier ordonnance' : 'Nouvelle ordonnance'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                {consultation.collaborateur_nom} — {medecin.titre} {medecin.nom}
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

          <label style={labelStyle}>Médicaments *</label>
          <textarea
            value={medicaments}
            onChange={e => setMedicaments(e.target.value)}
            placeholder={`Ex:\n- Paracétamol 1g — 3x/jour pendant 5 jours\n- Ibuprofène 400mg — 2x/jour avec repas`}
            rows={6}
            style={textareaStyle}
            onFocus={e => e.target.style.borderColor = '#22c55e'}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
          />

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
            L'ordonnance sera signée par <strong style={{ marginLeft: 3 }}>{medecin.titre} {medecin.nom}</strong>
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

          {/* Bouton Imprimer — PrintOrdonnance */}
          <PrintOrdonnance
            medecin={medecin}
            data={{
              patientNom: consultation.collaborateur_nom || '',
              patientCin: consultation.collaborateur_cin  || '',
              lignes: getLignes(),
            }}
            siteConfig={consultation}
          />

          {/* Bouton Enregistrer */}
          <button
            onClick={handleSubmit}
            disabled={loading || !medicaments.trim()}
            style={{
              ...submitBtnStyle,
              background: medicaments.trim() ? '#16a34a' : '#e2e8f0',
              color:      medicaments.trim() ? 'white'   : '#94a3b8',
              cursor: (loading || !medicaments.trim()) ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Enregistrement…' : (isEdit ? '✓ Enregistrer modifications' : 'Créer l\'ordonnance')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Micro-composants
// ─────────────────────────────────────────────────────────────
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

// 
// Styles
// 
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#475569', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 8,
};
const textareaStyle = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  fontSize: 13.5, fontFamily: 'inherit',
  outline: 'none', color: '#0f172a', resize: 'vertical',
  boxSizing: 'border-box', lineHeight: 1.6,
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