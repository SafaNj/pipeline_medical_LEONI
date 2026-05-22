// src/components/medecinControleur/DetailListe.jsx
import { useState } from 'react';
import Formulairecontrevisite from './Formulairecontrevisite';
import { PopupExpertiseDirect, ouvrirDemandeExpertise } from './Demandeexpertise';

const getNom = (item) =>
  item?.collaborateur_nom ||
  (item?.collaborateur && typeof item.collaborateur === 'object'
    ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
    : `Patient #${item?.collaborateur}`);

const getMatricule = (item) => item?.collaborateur_matricule || (typeof item?.collaborateur === 'object' ? item.collaborateur.matricule : null);
const getDepartment = (item) => item?.collaborateur_departement || (typeof item?.collaborateur === 'object' ? item.collaborateur.departement : null);
const getPoste = (item) => item?.collaborateur_poste || (typeof item?.collaborateur === 'object' ? item.collaborateur.poste : null);

const IcoExpertise = ({ c = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
);
const IcoEye = ({ c = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoPencil = ({ c = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export default function DetailListe({ item, onUpdateItem, medecinNom }) {
  const [showExpertise, setShowExpertise] = useState(false);
  const [expertiseSaved, setExpertiseSaved] = useState(null);

  const nom        = getNom(item);
  const matricule  = getMatricule(item);
  const department = getDepartment(item);
  const poste      = getPoste(item);
  const isWaiting  = item?.statut === 'EN_ATTENTE';

  if (!item) {
    return (
      <div style={{ height: '100%', background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94a3b8' }}>
        <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round">
          <path d="M16 11c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z" />
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
        <p style={{ fontSize: 15, fontWeight: 600 }}>Selectionnez un patient</p>
        <p style={{ fontSize: 13 }}>Cliquez sur un nom dans la liste</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Card Info Patient */}
      <div style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', color: 'white', padding: '20px 24px', borderRadius: 16, boxShadow: '0 4px 12px rgba(30,64,175,.2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0, border: '2px solid rgba(255,255,255,.4)' }}>
            {(nom || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{nom}</p>
            <div style={{ fontSize: 13, opacity: 0.9, display: 'flex', gap: 16 }}>
              {matricule  && <span>{matricule}</span>}
              {department && <span>{department}</span>}
              {poste      && <span>{poste}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: isWaiting ? 'rgba(255,255,255,.2)' : 'rgba(34,197,94,.3)', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,.3)' }}>
              {isWaiting ? 'En attente' : 'Consulte'}
            </div>
            {/* Bouton Expertise : devient Voir/Modifier apres creation */}
            {expertiseSaved ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => ouvrirDemandeExpertise(expertiseSaved, medecinNom)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.25)', color: '#86efac', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,.4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,.25)'}>
                  <IcoEye c="#86efac" /> Voir PDF
                </button>
                <button
                  onClick={() => setShowExpertise(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.15)', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.15)'}>
                  <IcoPencil c="white" /> Modifier
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowExpertise(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.15)', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.15)'}>
                <IcoExpertise c="white" /> Expertise
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire de contre-visite */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Formulairecontrevisite
          item={item}
          onUpdateItem={onUpdateItem}
          medecinNom={medecinNom}
        />
      </div>

      {/* Popup Expertise */}
      {showExpertise && (
        <PopupExpertiseDirect
          cv={item}
          medecinNom={medecinNom}
          initialDemande={expertiseSaved}
          onClose={() => setShowExpertise(false)}
          onSaved={(de) => {
            setExpertiseSaved(de);
            setShowExpertise(false);
          }}
        />
      )}
    </div>
  );
}