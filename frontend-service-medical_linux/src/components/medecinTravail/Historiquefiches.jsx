// src/components/medecinTravail/HistoriqueFiches.jsx
import { useState, useEffect, useRef } from 'react';
import { searchCollaborateurs, getFichesParCollaborateur } from '../../api/Medicalworkapi';
import { getDossierByCollaborateur } from '../../api/medicalRecordsApi';
import AptitudeBadge from './Aptitudebadge';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave } from './primaryActionButtonStyle';

/* ─── SVG Icons ───────────────────────────────────── */
const IcoSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoClose = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoUser = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoEntreprise = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IcoBilan = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6m-5 0v6l-4 9a1 1 0 0 0 .9 1.45h10.2A1 1 0 0 0 18 18l-4-9V3"/>
  </svg>
);
const IcoExamen = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoCertif = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IcoDossier = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoWarning = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18h20.36l-11.89-14.14z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IcoEmpty = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IcoPointer = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);
const IcoSearchBig = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/* ─── Data ────────────────────────────────────────── */
const TYPE_LABEL = {
  EMBAUCHE: "Visite d'Embauche", PERIODIQUE: 'Visite Périodique',
  REPRISE:  'Visite de Reprise',  SPONTANEE: 'Visite Spontanée',
};
const TYPE_COLOR = {
  EMBAUCHE:   { bg: '#e0e7ff', color: '#3730a3' },
  PERIODIQUE: { bg: '#dbeafe', color: '#1d4ed8' },
  REPRISE:    { bg: '#d1fae5', color: '#065f46' },
  SPONTANEE:  { bg: '#f1f5f9', color: '#475569' },
};
const ANALYSES_LABELS = {
  glycemie: 'Glycémie', creatinine: 'Créatinine', nfs: 'NFS', vs: 'VS',
  transaminases: 'Transaminases', acide_urique: 'Acide urique',
  triglycerides: 'Triglycérides', cholesterol: 'Cholestérol',
  copro_parasitologique: 'Copro parasitologique',
};
const EXAMENS_LABELS = {
  visiotest: 'Visiotest', audiogramme: 'Audiogramme', ecg: 'ECG', efr: 'EFR',
};

function getInitials(nom = '') {
  return nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

/* ─── sub-composants ─────────────────────────────── */
function RoField({ label, value, mono, span }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: span ? '1/-1' : undefined }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: value ? '#334155' : '#cbd5e1', fontFamily: mono ? 'monospace' : 'inherit', minHeight: 34 }}>
        {value || '—'}
      </div>
    </div>
  );
}

function RoSection({ Icon, title }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.8px', paddingBottom: 7, borderBottom: '1.5px solid #e2e8f0', marginBottom: 12, marginTop: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
      {Icon && <Icon />}
      {title}
    </div>
  );
}

/* ── Panneau détail ── */
function DetailPanel({ fiche, onClose, hasDossier, onNaviguerDossier, collab }) {
  const bilan       = fiche.demandes_bilan?.[0];
  const examen      = fiche.demandes_examen?.[0];
  const cert        = fiche.certificat;
  const bilanItems  = bilan  ? Object.entries(ANALYSES_LABELS).filter(([k]) => bilan[k])  : [];
  const examenItems = examen ? Object.entries(EXAMENS_LABELS).filter(([k])  => examen[k]) : [];

  return (
    <div style={{ flex: 1, minWidth: 0, background: 'white', borderRadius: 15, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
          {getInitials(fiche.collaborateur_nom || '')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e3a5f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fiche.collaborateur_nom || '—'}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
            {fmt(fiche.date_visite)} · <span style={{ fontWeight: 600 }}>{TYPE_LABEL[fiche.type_visite] || fiche.type_visite}</span>
          </div>
        </div>
        <button onClick={onClose} title="Fermer"
          style={{ width: 34, height: 34, border: 'none', background: '#fee2e2', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fecaca')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fee2e2')}>
          <IcoClose size={14} />
        </button>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{ marginBottom: 14 }}>
          <AptitudeBadge aptitude={fiche.aptitude} size="md" />
        </div>

        {/* Alerte dossier manquant */}
        {fiche.type_visite === 'EMBAUCHE' && hasDossier === false && onNaviguerDossier && (
          <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 11, padding: '12px 15px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <IcoWarning />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>Aucun dossier médical</div>
              <div style={{ fontSize: 11.5, color: '#b45309', marginTop: 1 }}>Cette visite d'embauche n'a pas encore de dossier associé.</div>
            </div>
            <button onClick={() => { onNaviguerDossier(collab); onClose(); }}
              style={primaryActionButtonStyle({ minWidth: 'auto', flexShrink: 0, whiteSpace: 'nowrap' })}
              onMouseEnter={primaryActionBtnEnter}
              onMouseLeave={primaryActionBtnLeave}>
              <IcoDossier /> Créer le dossier
            </button>
          </div>
        )}

        <RoSection Icon={IcoUser} title="Collaborateur" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <RoField label="Nom complet"    value={fiche.collaborateur_nom}               span />
          <RoField label="Matricule"      value={fiche.collaborateur_matricule}         mono />
          <RoField label="Poste"          value={fiche.collaborateur_poste} />
          <RoField label="CIN"            value={fiche.collaborateur_cin}               mono />
          <RoField label="Date naissance" value={fmt(fiche.collaborateur_date_naissance)} />
        </div>

        <RoSection Icon={IcoCalendar} title="Visite médicale" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <RoField label="Type de visite" value={TYPE_LABEL[fiche.type_visite] || fiche.type_visite} />
          <RoField label="Date de visite" value={fmt(fiche.date_visite)} />
        </div>

        <RoSection Icon={IcoEntreprise} title="Entreprise" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <RoField label="Raison sociale"     value={fiche.raison_sociale} />
          <RoField label="Nature d'activité"  value={fiche.nature_activite} />
          <RoField label="N° CNSS entreprise" value={fiche.numero_cnss_entreprise} mono />
          <RoField label="Adresse entreprise" value={fiche.adresse_entreprise}     span />
          <RoField label="Qualifications"     value={fiche.qualifications}         span />
        </div>

        {bilan && (
          <div>
            <RoSection Icon={IcoBilan} title="Bilan biologique" />
            {bilanItems.length > 0
              ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {bilanItems.map(([k, lbl]) => (
                    <span key={k} style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{lbl}</span>
                  ))}
                </div>
              : <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Aucune analyse prescrite</div>
            }
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {bilan.numero_labo && <RoField label="N° Laboratoire" value={bilan.numero_labo} mono />}
              <RoField label="Date demande" value={fmt(bilan.date_demande)} />
            </div>
          </div>
        )}

        {examen && (
          <div>
            <RoSection Icon={IcoExamen} title="Examens complémentaires" />
            {examenItems.length > 0
              ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {examenItems.map(([k, lbl]) => (
                    <span key={k} style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>{lbl}</span>
                  ))}
                </div>
              : <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Aucun examen prescrit</div>
            }
            <RoField label="Date demande" value={fmt(examen.date_demande)} />
          </div>
        )}

        {cert && (
          <div>
            <RoSection Icon={IcoCertif} title="Certificat d'aptitude" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <RoField label="Date émission" value={fmt(cert.date_emission)} />
              <RoField label="N° Certificat" value={`CERT-${cert.id?.toString().padStart(4, '0')}`} mono />
              <RoField label="Description"   value={cert.description} span />
            </div>
          </div>
        )}

        {/* Médecin */}
        <div style={{ marginTop: 18, padding: '11px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
            {fiche.medecin_nom?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'MD'}
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Médecin du travail</div>
            <div style={{ fontSize: 13, color: '#1e3a5f', fontWeight: 700 }}>{fiche.medecin_nom || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
export default function HistoriqueFiches({ onNaviguerDossier }) {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [showDrop,   setShowDrop]   = useState(false);
  const [collab,     setCollab]     = useState(null);
  const [fiches,     setFiches]     = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [hasDossier, setHasDossier] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (query.length < 2 || collab) { setResults([]); setShowDrop(false); return; }
    const t = setTimeout(() => {
      searchCollaborateurs(query)
        .then(d => { setResults(d.slice(0, 8)); setShowDrop(d.length > 0); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query, collab]);

  const pickCollab = async (c) => {
    setCollab(c); setSelected(null);
    setQuery(`${c.nom} ${c.prenom}`.trim());
    setShowDrop(false); setLoading(true); setHasDossier(null);
    try {
      const f = await getFichesParCollaborateur(c.id).catch(() => []);
      setFiches(Array.isArray(f) ? f : []);
      try { await getDossierByCollaborateur(c.id); setHasDossier(true); }
      catch { setHasDossier(false); }
    } finally { setLoading(false); }
  };

  const clearCollab = () => {
    setCollab(null); setQuery(''); setFiches([]);
    setSelected(null); setHasDossier(null);
  };

  const stats = {
    total:  fiches.length,
    inapte: fiches.filter(f => f.aptitude?.startsWith('INAPTE')).length,
    amenag: fiches.filter(f => f.aptitude === 'APTE_AMENAGEMENT_POSTE').length,
  };
  const aVisiteEmbauche = fiches.some(f => f.type_visite === 'EMBAUCHE');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>

      {/* ── Barre recherche ── */}
      <div ref={dropRef} style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 1 }}>
          <IcoSearch />
        </div>
        <input type="text" value={query}
          onChange={e => { setQuery(e.target.value); setCollab(null); }}
          placeholder="Rechercher un collaborateur (nom, prénom, matricule)…"
          style={{ width: '100%', padding: '11px 50px 11px 42px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13.5, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxShadow: '0 1px 3px rgba(15,23,42,.06)', boxSizing: 'border-box' }}
        />
        {(collab || query) && (
          <button onClick={clearCollab} title="Effacer"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 'none', background: '#fee2e2', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fecaca')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fee2e2')}>
            <IcoClose size={13} />
          </button>
        )}

        {showDrop && results.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.1)', maxHeight: 240, overflowY: 'auto' }}>
            {results.map(c => (
              <div key={c.id} onClick={() => pickCollab(c)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  {getInitials(c.nom + ' ' + c.prenom)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{c.nom} {c.prenom}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>{c.poste} · {c.department}</div>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{c.matricule}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── État vide ── */}
      {!collab && !loading && (
        <div style={{ flex: 1, background: 'white', borderRadius: 15, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#94a3b8' }}>
          <IcoSearchBig />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Recherchez un collaborateur</div>
          <div style={{ fontSize: 13 }}>Tapez au moins 2 caractères pour commencer</div>
        </div>
      )}

      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94a3b8', fontSize: 13 }}>
          <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin .9s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Chargement…
        </div>
      )}

      {/* ── Résultats ── */}
      {collab && !loading && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

          {/* Bannière dossier absent */}
          {hasDossier === false && (
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <IcoWarning />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>Aucun dossier médical</div>
                <div style={{ fontSize: 11.5, color: '#b45309' }}>
                  {aVisiteEmbauche
                    ? "Visite d'embauche trouvée — le dossier peut être créé."
                    : "Aucune visite d'embauche. Le dossier sera créé automatiquement à la première visite d'embauche."}
                </div>
              </div>
              {aVisiteEmbauche && onNaviguerDossier && (
                <button onClick={() => onNaviguerDossier(collab)}
                  style={primaryActionButtonStyle({ minWidth: 'auto', flexShrink: 0 })}
                  onMouseEnter={primaryActionBtnEnter}
                  onMouseLeave={primaryActionBtnLeave}>
                  <IcoDossier /> Créer le dossier
                </button>
              )}
            </div>
          )}

          {/* Bannière dossier présent */}
          {hasDossier === true && onNaviguerDossier && (
            <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <IcoCheckCircle />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#065f46' }}>Dossier médical présent</span>
              <button onClick={() => onNaviguerDossier(collab)}
                style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 11px', background: 'white', border: '1px solid #a7f3d0', borderRadius: 7, fontSize: 11.5, fontWeight: 600, color: '#059669', cursor: 'pointer', fontFamily: 'inherit' }}>
                Voir le dossier <IcoChevronRight />
              </button>
            </div>
          )}

          {/* ── Liste + détail ── */}
          <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden' }}>

            {/* Liste */}
            <div style={{ flex: selected ? '0 0 42%' : 1, minWidth: 0, background: 'white', borderRadius: 15, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Header collab */}
              <div style={{ padding: '13px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                  {getInitials(collab.nom + ' ' + collab.prenom)}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1e3a5f' }}>{collab.nom} {collab.prenom}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                    <span style={{ fontFamily: 'monospace' }}>{collab.matricule}</span> · {collab.poste}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8' }}>{stats.total} fiche{stats.total > 1 ? 's' : ''}</span>
                  {stats.inapte > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fecaca', color: '#991b1b' }}>{stats.inapte} inapte{stats.inapte > 1 ? 's' : ''}</span>}
                  {stats.amenag > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fde68a', color: '#78350f' }}>{stats.amenag} aménag.</span>}
                </div>
              </div>

              {/* Entêtes colonnes */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '7px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                <div style={{ width: 95,  fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>Date</div>
                <div style={{ width: 130, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>Type</div>
                <div style={{ flex: 1,    fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>Aptitude</div>
                <div style={{             fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>Médecin</div>
              </div>

              {/* Lignes */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {fiches.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <IcoEmpty />
                    <div style={{ fontSize: 13 }}>Aucune fiche pour ce collaborateur</div>
                  </div>
                ) : fiches.map((f, i) => {
                  const tc = TYPE_COLOR[f.type_visite] || { bg: '#f1f5f9', color: '#475569' };
                  const isSel = selected?.id === f.id;
                  return (
                    <div key={f.id}
                      onClick={() => setSelected(isSel ? null : f)}
                      style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: i < fiches.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', background: isSel ? '#eff6ff' : 'white', borderLeft: isSel ? '3px solid #3b82f6' : '3px solid transparent', transition: 'all .12s' }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'white'; }}
                    >
                      <div style={{ width: 95, fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                        {f.date_visite ? new Date(f.date_visite).toLocaleDateString('fr-FR') : '—'}
                      </div>
                      <div style={{ width: 130 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: tc.bg, color: tc.color }}>
                          {TYPE_LABEL[f.type_visite] || f.type_visite}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <AptitudeBadge aptitude={f.aptitude} size="sm" />
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{f.medecin_nom || '—'}</div>
                    </div>
                  );
                })}
              </div>

              {fiches.length > 0 && !selected && (
                <div style={{ padding: '7px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IcoPointer /> Cliquez sur une ligne pour consulter les détails
                </div>
              )}
            </div>

            {/* Panneau détail */}
            {selected && (
              <DetailPanel fiche={selected} onClose={() => setSelected(null)} hasDossier={hasDossier} onNaviguerDossier={onNaviguerDossier} collab={collab} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}