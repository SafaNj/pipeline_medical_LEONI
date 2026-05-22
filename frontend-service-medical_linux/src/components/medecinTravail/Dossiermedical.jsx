// src/components/medecinTravail/DossierMedical.jsx
import { useState, useEffect, useRef } from 'react';
import { searchCollaborateurs } from '../../api/Medicalworkapi';
import {
  creerDossierDepuisMatricule,
  getDossierByCollaborateur,
  getDossierByMatricule,
  patchDossier,
} from '../../api/medicalRecordsApi';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave } from './primaryActionButtonStyle';
import DossierScansSection from './DossierScansSection';
import { useAuth } from '../../context/AuthContext';

/* ─── SVG Icons ───────────────────────────────────── */
const IcoSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoAntecedents = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoVaccin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const IcoAllergie = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18h20.36l-11.89-14.14z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoHabitudes = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcoMatricule = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="13" y2="14"/>
  </svg>
);
const IcoPoste = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IcoBatiment = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="12"/>
    <path d="M9 12h6"/>
    <line x1="9" y1="7" x2="9" y2="7"/><line x1="15" y1="7" x2="15" y2="7"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoDossierVide = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoWarning = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18h20.36l-11.89-14.14z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoWarningSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18h20.36l-11.89-14.14z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IcoPencilMode = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);
const IcoTabac = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 12h2a2 2 0 0 1 0 4h-2v-4z"/>
    <path d="M2 12h16v4H2z"/>
    <path d="M20 12c0-5.5-3.5-10-8-10"/>
  </svg>
);
const IcoAlcool = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 22h8"/><path d="M12 11v11"/>
    <path d="M7 3l1 8h8l1-8z"/><line x1="6" y1="6" x2="18" y2="6"/>
  </svg>
);
const IcoPill = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/>
    <circle cx="18" cy="18" r="4"/><path d="m15.5 15.5 5 5"/>
  </svg>
);

/* ─── Data ────────────────────────────────────────── */
const GROUPES_SANGUINS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#7c3aed,#6d28d9)',
  'linear-gradient(135deg,#059669,#047857)',
  'linear-gradient(135deg,#dc2626,#b91c1c)',
  'linear-gradient(135deg,#d97706,#b45309)',
  'linear-gradient(135deg,#0891b2,#0e7490)',
];
const ini = (n = '') => n.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

/* ─── mini composants ─────────────────────────────── */
function Lbl({ txt }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.55px', marginBottom: 5 }}>{txt}</div>;
}
function ValBox({ val }) {
  return <div style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: val ? '#334155' : '#cbd5e1', minHeight: 36 }}>{val || '—'}</div>;
}
function Inp({ val, onChange, placeholder, type = 'text' }) {
  return (
    <input type={type} value={val || ''} onChange={onChange} placeholder={placeholder || ''}
      style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .14s' }}
      onFocus={e => (e.target.style.borderColor = '#93c5fd')}
      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
    />
  );
}
function Txta({ val, onChange, placeholder, rows = 3 }) {
  return (
    <textarea rows={rows} value={val || ''} onChange={onChange} placeholder={placeholder || ''}
      style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color .14s' }}
      onFocus={e => (e.target.style.borderColor = '#93c5fd')}
      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
    />
  );
}
function Sec({ Icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.9px', paddingBottom: 9, borderBottom: '1.5px solid #e2e8f0', marginBottom: 15 }}>
      {Icon && <Icon />} {title}
    </div>
  );
}
function G2({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>; }
function G3({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>{children}</div>; }
function Fg({ lbl, children, span }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: span ? '1/-1' : undefined }}><Lbl txt={lbl} />{children}</div>;
}

function CheckHabitude({ lbl, Icon, checked, editMode, onToggle }) {
  if (!editMode) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: checked ? '#ecfdf5' : '#f8fafc', border: `1px solid ${checked ? '#d1fae5' : '#e2e8f0'}`, borderRadius: 9 }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: checked ? '#059669' : '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      {Icon && <span style={{ color: checked ? '#059669' : '#94a3b8' }}><Icon /></span>}
      <span style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? '#065f46' : '#64748b' }}>{lbl}</span>
    </div>
  );
  return (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: checked ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 9, cursor: 'pointer', userSelect: 'none', transition: 'all .14s' }}>
      <div style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${checked ? '#3b82f6' : '#cbd5e1'}`, background: checked ? '#3b82f6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .14s' }}>
        {checked && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      {Icon && <span style={{ color: checked ? '#3b82f6' : '#94a3b8' }}><Icon /></span>}
      <span style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? '#1d4ed8' : '#64748b', transition: 'color .14s' }}>{lbl}</span>
    </div>
  );
}

/* ── Autocomplete collaborateur ── */
function SearchCollab({ onSelect, initialCollab }) {
  const { user } = useAuth();
  const [q, setQ] = useState(initialCollab ? `${initialCollab.nom} ${initialCollab.prenom}`.trim() : '');
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (q.length < 2) { setList([]); setOpen(false); return; }
    const t = setTimeout(() => {
      searchCollaborateurs(q, { site_id: user?.site_id })
        .then((d) => {
          const scoped = d || [];
          setList(scoped.slice(0, 8));
          setOpen(scoped.length > 0);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [q, user]);

  const pick = c => { onSelect(c); setQ(`${c.nom} ${c.prenom}`.trim()); setOpen(false); setList([]); };
  const handleSearch = () => {
    if (q.trim().length < 2) return;
    setSearching(true);
    searchCollaborateurs(q.trim(), { site_id: user?.site_id })
      .then((d) => {
        const scoped = d || [];
        setList(scoped.slice(0, 8));
        setOpen(scoped.length > 0);
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  };

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
          <IcoSearch />
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} placeholder="Rechercher un collaborateur (nom, prénom ou matricule)…"
          style={{ width: '100%', padding: '11px 14px 11px 42px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13.5, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(15,23,42,.06)', transition: 'border-color .14s' }}
          onFocus={e => (e.target.style.borderColor = '#93c5fd')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
      </div>
      <button
        onClick={handleSearch}
        disabled={searching}
        style={{ padding: '10px 18px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
        {searching ? 'Recherche...' : 'Rechercher'}
      </button>
      {open && list.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 400, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 13, boxShadow: '0 12px 32px rgba(0,0,0,.12)', maxHeight: 260, overflowY: 'auto' }}>
          {list.map((c, i) => (
            <div key={c.id} onClick={() => pick(c)}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < list.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: GRADIENTS[i % GRADIENTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800 }}>
                {ini(`${c.nom} ${c.prenom}`)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{c.nom} {c.prenom}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>{c.poste} · {c.department}</div>
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>{c.matricule}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Écran : dossier introuvable ── */
function PasDeDossier({ collab, onCreerFiche }) {
  const avatarBg = GRADIENTS[(collab.id || 0) % GRADIENTS.length];
  return (
    <div style={{ flex: 1, background: 'white', borderRadius: 15, border: '1.5px dashed #fde68a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 800, boxShadow: '0 4px 14px rgba(30,58,95,.18)' }}>
        {ini(`${collab.nom} ${collab.prenom}`)}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e3a5f', marginBottom: 5 }}>{collab.nom} {collab.prenom}</div>
        <div style={{ fontSize: 12.5, color: '#64748b' }}>{collab.poste} · {collab.department} · <span style={{ fontFamily: 'monospace' }}>{collab.matricule}</span></div>
      </div>
      <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 13, padding: '18px 24px', maxWidth: 420, textAlign: 'center' }}>
        <IcoWarning />
        <div style={{ fontSize: 14, fontWeight: 800, color: '#b45309', marginBottom: 8, marginTop: 10 }}>Aucun dossier médical trouvé</div>
        <div style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.7 }}>
          Le dossier médical est créé automatiquement lors de la <strong>première visite d'embauche</strong>.<br />
          Ce collaborateur n'a pas encore eu de visite de type <strong>EMBAUCHE</strong>.
        </div>
      </div>
      <button onClick={onCreerFiche}
        style={primaryActionButtonStyle()}
        onMouseEnter={primaryActionBtnEnter}
        onMouseLeave={primaryActionBtnLeave}>
        <IcoPlus /> Créer une fiche d'aptitude (Embauche)
      </button>
      <div style={{ fontSize: 11.5, color: '#94a3b8', textAlign: 'center' }}>
        Le dossier sera créé automatiquement après validation de la visite d'embauche
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════ */
export default function DossierMedical({ onNaviguerNouvellesFiches, initialCollab, onBack, canEditOverride }) {
  const [collab,  setCollab]  = useState(null);
  const [dossier, setDossier] = useState(null);
  const [form,    setForm]    = useState(null);
  const [etat,    setEtat]    = useState('vide');
  const [editMode,setEditMode]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const canEdit =
    typeof canEditOverride === 'boolean'
      ? canEditOverride
      : true;

  const displayNom = String(collab?.nom || '').trim() || String(dossier?.nom || '').trim() || '—';
  const displayPrenom = String(collab?.prenom || '').trim() || String(dossier?.prenom || '').trim() || '—';
  const openedMatricule = String(collab?.matricule || collab?.matricule_ref || '').trim();

  const looksLikeEmbauche =
    Boolean(openedMatricule) &&
    (collab?.presence || collab?.etat_embauche || collab?.liste || collab?._selectionSource === 'candidat_embauche');

  const dossierNom = String(dossier?.nom || '').trim();
  const dossierPrenom = String(dossier?.prenom || '').trim();
  const mismatchIdentite =
    looksLikeEmbauche &&
    dossierNom &&
    dossierPrenom &&
    (`${dossierNom} ${dossierPrenom}`.toLowerCase() !== `${displayNom} ${displayPrenom}`.toLowerCase());

  const loadOrCreateByMatricule = async (matricule) => {
    const m = String(matricule || '').trim();
    if (!m) throw new Error('Matricule manquant');

    try {
      const data = await getDossierByMatricule(m);
      // Cas 1: dossier existe déjà
      if (data?.id) return { dossier: data, preInfo: data };

      // Cas 2: source embauche / im_db -> on crée automatiquement
      const src = String(data?.source || '').toLowerCase();
      if (src === 'embauche' || src === 'im_db') {
        const created = await creerDossierDepuisMatricule(m);
        return { dossier: created, preInfo: data };
      }

      // Par défaut, tenter la création si l'objet ne contient pas d'ID
      const created = await creerDossierDepuisMatricule(m);
      return { dossier: created, preInfo: data };
    } catch (e) {
      // 404 -> créer
      if (e?.response?.status === 404) {
        const created = await creerDossierDepuisMatricule(m);
        return { dossier: created, preInfo: null };
      }
      // GET échoue -> ne pas boucler : remonter l'erreur
      throw e;
    }
  };

  const charger = async c => {
    setCollab(c); setDossier(null); setForm(null);
    setEditMode(false); setError(''); setSuccess('');
    setEtat('loading');
    try {
      const m = String(c?.matricule || c?.matricule_ref || '').trim();

      // Priorité : embauche infirmier → on travaille par matricule (candidat != collaborateur)
      if (m) {
        const { dossier: d, preInfo } = await loadOrCreateByMatricule(m);
        const merged = (d && typeof d === 'object')
          ? { ...(preInfo && typeof preInfo === 'object' ? preInfo : {}), ...d }
          : d;
        setDossier(merged);
        setForm({ ...(merged || {}) });
        setEtat('ok');
        return;
      }

      // Fallback : collaborateur "normal" (recherche RH / médecin du travail)
      const d = await getDossierByCollaborateur(c.id, c.matricule);
      setDossier(d);
      setForm({ ...d });
      setEtat('ok');
    } catch (e) {
      if (e?.response?.status === 404) setEtat('introuvable');
      else {
        setEtat('erreur');
        const msg = e?.response?.data?.detail || e?.response?.data?.error || e?.message;
        setError(msg || 'Erreur lors du chargement du dossier.');
      }
    }
  };

  useEffect(() => {
    if (initialCollab) charger(initialCollab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sauvegarder = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        groupe_sanguin: form.groupe_sanguin || null,
        date_naissance: form.date_naissance || null,
        lieu_naissance: form.lieu_naissance || '',
        adresse: form.adresse || '',
        antecedents_medicaux: form.antecedents_medicaux || '',
        antecedents_chirurgicaux: form.antecedents_chirurgicaux || '',
        antecedents_gyneco: form.antecedents_gyneco || '',
        antecedents_familiaux: form.antecedents_familiaux || '',
        vaccin_tuberculose: form.vaccin_tuberculose || null,
        vaccin_tetanos: form.vaccin_tetanos || null,
        vaccin_hepatite: form.vaccin_hepatite || null,
        autres_vaccins: form.autres_vaccins || '',
        allergies: form.allergies || '',
        tabac: !!form.tabac,
        alcool: !!form.alcool,
        automedication: !!form.automedication,
      };
      const updated = await patchDossier(dossier.id, payload);
      setDossier(updated); setForm({ ...updated });
      setEditMode(false);
      setSuccess('Dossier médical mis à jour');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      if (e?.response?.status === 403) {
        setEditMode(false);
        setError("Modification non autorisée.");
        return;
      }
      const d = e?.response?.data;
      setError(d && typeof d === 'object'
        ? Object.entries(d).map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  const annuler = () => { setForm({ ...dossier }); setEditMode(false); setError(''); };
  const avatarBg = GRADIENTS[(collab?.id || 0) % GRADIENTS.length];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 13, overflow: 'hidden' }}>

      {/* ── Barre recherche + boutons ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => (typeof onBack === 'function' ? onBack() : window.history.back())}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1.5px solid #e2e8f0',
            background: 'white',
            cursor: 'pointer',
            fontWeight: 800,
            color: '#0f172a',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'inherit',
            boxShadow: '0 1px 4px rgba(15,23,42,.06)',
          }}
          title="Retour"
        >
          ← Retour
        </button>
        <SearchCollab onSelect={charger} initialCollab={initialCollab} />
        {etat === 'ok' && !editMode && canEdit && (
          <button onClick={() => setEditMode(true)}
            style={{ ...primaryActionButtonStyle(), whiteSpace: 'nowrap' }}
            onMouseEnter={primaryActionBtnEnter}
            onMouseLeave={primaryActionBtnLeave}>
            <IcoEdit /> Modifier le dossier
          </button>
        )}
        {editMode && (
          <>
            <button onClick={sauvegarder} disabled={saving}
              style={{ padding: '10px 20px', background: saving ? '#94a3b8' : '#059669', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 10px rgba(5,150,105,.22)' }}>
              <IcoSave /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
            <button onClick={annuler}
              style={{ padding: '10px 18px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .14s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
              Annuler
            </button>
          </>
        )}
      </div>

      {/* ── Alertes ── */}
      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#059669', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcoSave /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 16px', borderRadius: 10, fontSize: 13, flexShrink: 0 }}>{error}</div>
      )}

      {/* ── État vide ── */}
      {etat === 'vide' && (
        <div style={{ flex: 1, background: 'white', borderRadius: 15, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 13, color: '#94a3b8' }}>
          <IcoDossierVide />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>Consulter un dossier médical</div>
          <div style={{ fontSize: 13 }}>Recherchez un collaborateur pour accéder à son dossier</div>
          <div style={{ padding: '9px 18px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 9, fontSize: 12.5, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 7 }}>
            <IcoInfo /> Le dossier est créé automatiquement lors de la première visite d'embauche
          </div>
        </div>
      )}

      {/* ── Chargement ── */}
      {etat === 'loading' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 13, color: '#94a3b8' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: 13 }}>Chargement du dossier…</div>
        </div>
      )}

      {etat === 'introuvable' && collab && (
        <PasDeDossier collab={collab} onCreerFiche={onNaviguerNouvellesFiches} />
      )}

      {etat === 'erreur' && (
        <div style={{ flex: 1, background: 'white', borderRadius: 15, border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#dc2626', fontSize: 13 }}>
          <IcoAllergie />
          <div style={{ fontWeight: 700 }}>Erreur lors du chargement</div>
          <button
            onClick={() => {
              if (collab) charger(collab);
            }}
            style={{ padding: '8px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: collab ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: collab ? 1 : 0.6 }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ══ DOSSIER TROUVÉ ══ */}
      {etat === 'ok' && dossier && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {mismatchIdentite && (
            <div
              style={{
                background: '#fff7ed',
                border: '1.5px solid #fed7aa',
                color: '#9a3412',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚠️ Attention: le dossier trouvé en base semble appartenir à <strong>{dossierNom} {dossierPrenom}</strong> mais vous avez ouvert le dossier pour <strong>{displayNom} {displayPrenom}</strong> (matricule {openedMatricule || '—'}).
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: '#c2410c' }}>
                Vérifiez le matricule dans la liste d'embauche ou corrigez le dossier côté base de données.
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{ background: 'white', borderRadius: 15, border: `1.5px solid ${editMode ? '#fde68a' : '#e2e8f0'}`, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, boxShadow: '0 1px 4px rgba(15,23,42,.05)', transition: 'border-color .2s' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 14px rgba(30,58,95,.18)' }}>
              {ini(`${displayNom} ${displayPrenom}`)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#1e3a5f', letterSpacing: '-.3px' }}>{displayNom} {displayPrenom}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                {[
                  { Icon: IcoMatricule, v: collab?.matricule },
                  { Icon: IcoPoste,     v: collab?.poste },
                  { Icon: IcoBatiment,  v: collab?.department },
                  { Icon: IcoCalendar,  v: `Créé le ${fmtDate(dossier.date_creation)}` },
                ].filter(m => m.v).map((m, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <m.Icon /> {m.v}
                  </span>
                ))}
              </div>
            </div>

            {editMode ? (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Groupe sanguin</div>
                <select value={form.groupe_sanguin || ''} onChange={e => set('groupe_sanguin', e.target.value)}
                  style={{ padding: '8px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', outline: 'none', cursor: 'pointer' }}>
                  {GROUPES_SANGUINS.map(g => <option key={g} value={g}>{g || '— Choisir —'}</option>)}
                </select>
              </div>
            ) : dossier.groupe_sanguin ? (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.5px' }}>Groupe</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', fontFamily: 'monospace' }}>{dossier.groupe_sanguin}</div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: '#94a3b8' }}>Groupe sanguin</div>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic', marginTop: 2 }}>Non renseigné</div>
              </div>
            )}

            {editMode && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <IcoPencilMode /> Mode édition
              </div>
            )}
          </div>

          <DossierScansSection dossier={dossier} collab={collab} onRefresh={() => charger(collab)} />

          {/* Corps du dossier */}
          <div style={{ background: 'white', borderRadius: 15, border: '1px solid #e2e8f0', padding: '24px 28px', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>

            <div style={{ marginBottom: 26 }}>
              <Sec Icon={IcoUser} title="Identification" />
              <G2>
                <Fg lbl="Nom"><ValBox val={displayNom} /></Fg>
                <Fg lbl="Prénom"><ValBox val={displayPrenom} /></Fg>
                <Fg lbl="Date de naissance">{editMode ? <Inp type="date" val={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} /> : <ValBox val={fmtDate(dossier.date_naissance)} />}</Fg>
                <Fg lbl="Lieu de naissance">{editMode ? <Inp val={form.lieu_naissance} onChange={e => set('lieu_naissance', e.target.value)} placeholder="Ville…" /> : <ValBox val={dossier.lieu_naissance} />}</Fg>
                <Fg lbl="Adresse" span>{editMode ? <Txta val={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Adresse complète…" rows={2} /> : <ValBox val={dossier.adresse} />}</Fg>
              </G2>
            </div>

            <div style={{ marginBottom: 26 }}>
              <Sec Icon={IcoAntecedents} title="Antécédents médicaux" />
              <G2>
                {[
                  { k: 'antecedents_medicaux',     l: 'Antécédents médicaux' },
                  { k: 'antecedents_chirurgicaux', l: 'Antécédents chirurgicaux' },
                  { k: 'antecedents_gyneco',       l: 'Antécédents gynécologiques' },
                  { k: 'antecedents_familiaux',    l: 'Antécédents familiaux' },
                ].map(({ k, l }) => (
                  <Fg key={k} lbl={l}>{editMode ? <Txta val={form[k]} onChange={e => set(k, e.target.value)} placeholder={`${l}…`} /> : <ValBox val={dossier[k]} />}</Fg>
                ))}
              </G2>
            </div>

            <div style={{ marginBottom: 26 }}>
              <Sec Icon={IcoVaccin} title="Vaccinations" />
              <G3>
                {[{ k: 'vaccin_tuberculose', l: 'Tuberculose' }, { k: 'vaccin_tetanos', l: 'Tétanos' }, { k: 'vaccin_hepatite', l: 'Hépatite' }].map(({ k, l }) => (
                  <Fg key={k} lbl={l}>{editMode ? <Inp type="date" val={form[k]} onChange={e => set(k, e.target.value)} /> : <ValBox val={fmtDate(dossier[k])} />}</Fg>
                ))}
              </G3>
              <div style={{ marginTop: 10 }}>
                <Lbl txt="Autres vaccins" />
                {editMode ? <Txta val={form.autres_vaccins} onChange={e => set('autres_vaccins', e.target.value)} placeholder="Autres vaccinations…" rows={2} /> : <ValBox val={dossier.autres_vaccins} />}
              </div>
            </div>

            <div style={{ marginBottom: 26 }}>
              <Sec Icon={IcoAllergie} title="Allergies" />
              {editMode ? <Txta val={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Médicaments, aliments, environnement…" rows={3} /> : <ValBox val={dossier.allergies} />}
            </div>

            <div>
              <Sec Icon={IcoHabitudes} title="Habitudes de vie" />
              <G3>
                <CheckHabitude lbl="Tabac"         Icon={IcoTabac}  checked={editMode ? !!form.tabac         : !!dossier.tabac}         editMode={editMode} onToggle={() => set('tabac',         !form.tabac)} />
                <CheckHabitude lbl="Alcool"        Icon={IcoAlcool} checked={editMode ? !!form.alcool        : !!dossier.alcool}        editMode={editMode} onToggle={() => set('alcool',        !form.alcool)} />
                <CheckHabitude lbl="Automédication" Icon={IcoPill}  checked={editMode ? !!form.automedication : !!dossier.automedication} editMode={editMode} onToggle={() => set('automedication', !form.automedication)} />
              </G3>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', paddingBottom: 8, flexShrink: 0 }}>
            <span>Dossier #{dossier.id}</span>
            <span>Dernière modification : {fmtDate(dossier.date_modification)}</span>
          </div>
        </div>
      )}
    </div>
  );
}