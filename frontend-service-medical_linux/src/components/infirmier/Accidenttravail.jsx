// src/components/infirmier/AccidentTravail.jsx
import { useState, useEffect, useRef } from 'react';
import PrintEnquete from './PrintEnquete';
import EnqueteModal from './EnqueteModal';
import {
  getAccidents, creerAccident, modifierAccident, supprimerAccident,
  getStatsAccidents, searchCollaborateurs,
  getCollaborateurById,
} from '../../api/actInfirmierApi';
import { useAuth } from '../../context/AuthContext';
import { pickDepartementCollaborateur } from '../../utils/ficheCollaborateur';
import { uiAlert, uiConfirm } from '../../utils/uiAlert';

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const todayStr = ()  => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  collaborateur: '', num_cnam: '', plant_section: '',
  date_accident: todayStr(), heure_accident: '',
  categorie_accident: 'TRAVAIL',
  type_accident: '', lieu_accident: '', description: '',
  siege_lesion: '', nature_lesion: '', cause_accident: '',
  agent_materiel: '', temoins: '',
  repos_initial: 0, prolongation: 0, criticite: '',
  reprise_medecin_travail: '',
  date_declaration_service_medical: todayStr(),
  date_sortie_declaration: '', chauffeur_sortie: '',
  reporting_interne: false, reporting_wsd: false,
};

/** Codes = CRITICITE_CHOICES Django ; libellés affichés en français. */
const CRITICITE_LABELS = {
  FAIBLE: 'Faible',
  MODEREE: 'Modérée',
  GRAVE: 'Grave',
  TRES_GRAVE: 'Très grave',
};

const CRITICITE_STYLE_MAP = {
  TRES_GRAVE: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  GRAVE: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  MODEREE: { bg: '#fefce8', color: '#854d0e', border: '#fde68a' },
  FAIBLE: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
};

/** Anciennes données (libellés FR) → codes API. */
const CRITICITE_LEGACY_TO_CODE = {
  Faible: 'FAIBLE',
  'Modérée': 'MODEREE',
  Modérée: 'MODEREE',
  Grave: 'GRAVE',
  'Très grave': 'TRES_GRAVE',
};

function normalizeCriticiteCode(v) {
  if (v == null || v === '') return '';
  const s = String(v).trim();
  if (CRITICITE_LABELS[s]) return s;
  return CRITICITE_LEGACY_TO_CODE[s] ?? s;
}

function criticiteStyles(code) {
  const key = normalizeCriticiteCode(code) || code;
  return CRITICITE_STYLE_MAP[key] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
}

function criticiteLabel(code) {
  const key = normalizeCriticiteCode(code);
  return (key && CRITICITE_LABELS[key]) || code || '—';
}

/* ─── Icons ──────────────────────────────────────────────── */
const IcoPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoEdit   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IcoTrash  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoAlert  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoClose  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoSave   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoEnquete = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

/* ─── Styles ─────────────────────────────────────────────── */
const inp = {
  padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:7,
  fontSize:13, color:'#111827', background:'white', outline:'none',
  fontFamily:'inherit', width:'100%', boxSizing:'border-box',
};
const Field = ({ label, required, full, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, gridColumn: full ? '1/-1' : undefined }}>
    <label style={{ fontSize:10.5, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.5px' }}>
      {label}{required && <span style={{ color:'#ef4444' }}> *</span>}
    </label>
    {children}
  </div>
);
const SecTitle = ({ children }) => (
  <div style={{ fontSize:10.5, fontWeight:800, color:'#dc2626', textTransform:'uppercase',
    letterSpacing:'.8px', paddingBottom:6, marginBottom:12, borderBottom:'2px solid #fee2e2' }}>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════
   PANNEAU DÉTAILS (lecture seule)
══════════════════════════════════════════════════════════ */
function DetailAccident({ accident, onEdit, onClose, onEnqueteSaved }) {
  const { user } = useAuth();
  const [showEnquete, setShowEnquete] = useState(false);
  const [enqueteModalReadOnly, setEnqueteModalReadOnly] = useState(false);
  const a = accident;
  const hasEnquete =
    a?.enquete_existe === true ||
    !!(a?.enquete &&
      (typeof a.enquete === 'object' ? a.enquete?.id != null || a.enquete?.pk != null : a.enquete));
  const cs = criticiteStyles(a.criticite);
  const saisiePar = a.infirmiere_nom || (a.infirmiere === user?.user_id ? user?.username : '') || (a.infirmiere ? `#${a.infirmiere}` : '—');

  const Row = ({ label, value }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <span style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</span>
      <span style={{ fontSize:13, color:'#111827', fontWeight:500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderLeft:'1.5px solid #f3f4f6', borderRadius:'0 14px 14px 0' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', flexShrink:0, background:'linear-gradient(135deg,#fef2f2,#fff5f5)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#ef4444,#b91c1c)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, boxShadow:'0 4px 12px rgba(239,68,68,.3)' }}>
            <IcoAlert />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#111827' }}>{a.collaborateur_nom || '—'}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{a.collaborateur_matricule} · {a.collaborateur_poste || ''}</div>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              {a.criticite && (
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:cs.bg, color:cs.color, border:`1px solid ${cs.border}` }}>{criticiteLabel(a.criticite)}</span>
              )}
              <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#f3f4f6', color:'#374151' }}>
                {a.total_jours_perdus} jours perdus
              </span>
              {a.reporting_interne && <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#eff6ff', color:'#1d4ed8' }}>Reporting interne</span>}
              {a.reporting_wsd && <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#faf5ff', color:'#7c3aed' }}>Reporting WSD</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ padding:'4px 10px', border:'1.5px solid #e5e7eb', background:'#f9fafb', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, color:'#6b7280', flexShrink:0, transition:'all .12s' }} onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.color='#dc2626';}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#6b7280';}}>Fermer</button>
        </div>
      </div>

      {/* Corps */}
      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>

        <div style={{ marginBottom:18 }}>
          <SecTitle>Accident</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Date" value={fmtDate(a.date_accident)} />
            <Row label="Heure" value={a.heure_accident || '—'} />
            <Row
              label="Catégorie"
              value={a.categorie_accident === 'TRAVAIL' ? 'Accident de travail' : 'Accident de trajet'}
            />
            <Row label="Type / Description de l'accident" value={a.type_accident} />
            <Row label="Lieu" value={a.lieu_accident} />
            <Row label="Agent matériel" value={a.agent_materiel} />
            <Row label="Témoins" value={a.temoins} />
          </div>
          {a.description && (
            <div style={{ marginTop:12, background:'#fafafa', borderRadius:9, padding:'10px 13px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:5 }}>Description</div>
              <div style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{a.description}</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom:18 }}>
          <SecTitle>Lésion & Cause</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Siège de la lésion" value={a.siege_lesion} />
            <Row label="Nature de la lésion" value={a.nature_lesion} />
            <Row label="Cause" value={a.cause_accident} />
            <Row label="Criticité" value={criticiteLabel(a.criticite)} />
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <SecTitle>Repos & Suivi</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <Row label="Repos initial" value={`${a.repos_initial} j`} />
            <Row label="Prolongation" value={`${a.prolongation} j`} />
            <Row label="Total jours perdus" value={`${a.total_jours_perdus} j`} />
            <Row label="Reprise médecin travail" value={fmtDate(a.reprise_medecin_travail)} />
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <SecTitle>Informations collaborateur</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="N°01" value={a.num_cnam} />
            <Row label="Plant section de collaborateur" value={a.plant_section} />
            <Row label="Sexe" value={a.collaborateur_sexe} />
            <Row label="Téléphone" value={a.collaborateur_telephone} />
            <Row label="Date embauche" value={fmtDate(a.collaborateur_date_embauche)} />
            <Row label="Département" value={a.collaborateur_department} />
          </div>
        </div>

        <div>
          <SecTitle>Déclaration & Sortie</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Date déclaration SM" value={fmtDate(a.date_declaration_service_medical)} />
            <Row label="Date sortie déclaration" value={fmtDate(a.date_sortie_declaration)} />
            <Row label="Chauffeur / Transport" value={a.chauffeur_sortie} />
            <Row label="Saisie par" value={saisiePar} />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding:'12px 20px', borderTop:'1px solid #f3f4f6', flexShrink:0, display:'flex', justifyContent:'flex-end', gap:8, flexWrap:'wrap', background:'#fafafa', borderRadius:'0 0 14px 0' }}>
        {hasEnquete && <PrintEnquete accident={accident} infirmiereNom={saisiePar} currentUser={user} />}
        {hasEnquete && (
          <button
            type="button"
            onClick={() => { setEnqueteModalReadOnly(true); setShowEnquete(true); }}
            style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
              border:'1.5px solid #bfdbfe',
              background:'linear-gradient(135deg,#eff6ff,#dbeafe)',
              color:'#1d4ed8',
              borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
              boxShadow:'0 2px 8px rgba(37,99,235,.12)',
            }}
          >
            <IcoEnquete /> Voir l&apos;enquête
          </button>
        )}
        {hasEnquete ? (
          <button
            type="button"
            onClick={() => { setEnqueteModalReadOnly(false); setShowEnquete(true); }}
            style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
              border:'1.5px solid #86efac',
              background:'linear-gradient(135deg,#22c55e,#16a34a)',
              color:'white',
              borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
              boxShadow:'0 3px 10px rgba(34,197,94,.25)',
            }}
          >
            <IcoEdit /> Modifier l&apos;enquête
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setEnqueteModalReadOnly(false); setShowEnquete(true); }}
            style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
              border:'1.5px solid #fecaca',
              background:'linear-gradient(135deg,#fff7ed,#ffedd5)',
              color:'#9a3412',
              borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
              boxShadow:'0 2px 8px rgba(0,0,0,.06)',
            }}
          >
            <IcoEnquete /> Élaborer l&apos;enquête
          </button>
        )}
        <button onClick={() => onEdit(accident)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(239,68,68,.25)' }}>
          <IcoEdit /> Modifier cette déclaration
        </button>
      </div>

      {showEnquete && (
        <EnqueteModal
          accident={accident}
          readOnly={enqueteModalReadOnly}
          onClose={() => { setShowEnquete(false); setEnqueteModalReadOnly(false); }}
          onSaved={onEnqueteSaved}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PANNEAU FORMULAIRE
══════════════════════════════════════════════════════════ */
function FormulaireAccident({ initial, onSaved, onClose }) {
  const { user } = useAuth();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(() => {
    const base = { ...EMPTY_FORM, ...initial };
    if (initial) base.criticite = normalizeCriticiteCode(initial.criticite);
    return base;
  });
  const [infirmierNom,  setInfirmierNom]  = useState(initial?.infirmiere_nom ?? user?.username ?? '');
  const [collabDepartement, setCollabDepartement] = useState(initial?.collaborateur_department ?? '');
  const [collabQuery,   setCollabQuery]   = useState(initial?.collaborateur_nom ?? '');
  const [collabNom,     setCollabNom]     = useState(initial?.collaborateur_nom ?? '');
  const [collabResults, setCollabResults] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const debRef = useRef(null);
  const [collabInfo, setCollabInfo] = useState(initial ? { matricule: initial.collaborateur_matricule, sexe: initial.collaborateur_sexe, telephone: initial.collaborateur_telephone, poste: initial.collaborateur_poste, department: initial.collaborateur_department, date_embauche: initial.collaborateur_date_embauche } : null);

  useEffect(() => {
    const merged = { ...EMPTY_FORM, ...initial };
    if (initial) merged.criticite = normalizeCriticiteCode(initial.criticite);
    setForm(merged);
    setInfirmierNom(initial?.infirmiere_nom ?? user?.username ?? '');
    setCollabDepartement(initial?.collaborateur_department ?? '');
    setCollabQuery(initial?.collaborateur_nom ?? '');
    setCollabNom(initial?.collaborateur_nom ?? '');
    setCollabInfo(initial ? {
      matricule: initial.collaborateur_matricule ?? '',
      sexe: initial.collaborateur_sexe ?? '',
      telephone: initial.collaborateur_telephone ?? '',
      poste: initial.collaborateur_poste ?? '',
      department: initial.collaborateur_department ?? '',
      date_embauche: initial.collaborateur_date_embauche ?? '',
    } : null);
    setError('');
  }, [initial?.id, user?.username]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCollabSearch = (val) => {
    setCollabQuery(val); setCollabNom(''); set('collaborateur', '');
    set('plant_section', '');
    setCollabDepartement('');
    clearTimeout(debRef.current);
    if (val.trim().length < 2) { setCollabResults([]); return; }
    debRef.current = setTimeout(async () => {
      setLoadingCollab(true);
      try { setCollabResults(await searchCollaborateurs(val.trim())); }
      catch { setCollabResults([]); }
      finally { setLoadingCollab(false); }
    }, 250);
  };

  const selectCollab = async (c) => {
    set('collaborateur', c.id);
    setCollabNom(`${c.nom} ${c.prenom} — ${c.matricule}`);
    setCollabQuery(`${c.nom} ${c.prenom}`);
    setCollabResults([]);
    try {
      const detail = await getCollaborateurById(c.id);
      const autoPlantSection = detail.plant_section ?? detail.plantSection ?? detail.section_atelier ?? '';
      const autoDept = pickDepartementCollaborateur(detail);
      setCollabInfo({
        matricule: detail.matricule ?? '',
        sexe: detail.sexe ?? '',
        telephone: detail.telephone ?? '',
        poste: detail.poste ?? '',
        department: autoDept,
        date_embauche: detail.date_embauche ?? '',
      });
      set('plant_section', autoPlantSection);
      setCollabDepartement(autoDept);
    } catch { setCollabInfo(null); }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.collaborateur)                    return setError('Sélectionnez un collaborateur.');
    if (!infirmierNom.trim())                   return setError('Le nom de l\'infirmier est requis.');
    if (!form.date_accident)                    return setError('Date accident requise.');
    if (!form.type_accident.trim())             return setError('Type accident requis.');
    if (!form.lieu_accident)                    return setError('Lieu de l\'accident requis.');
    if (!form.description.trim())               return setError('Description requise.');
    if (!form.siege_lesion.trim())              return setError('Siège lésion requis.');
    if (!form.nature_lesion.trim())             return setError('Nature lésion requise.');
    if (!form.cause_accident.trim())            return setError('Cause accident requise.');
    if (!form.date_declaration_service_medical) return setError('Date déclaration requise.');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isEdit && user?.user_id) payload.infirmiere = user.user_id;
      if (!payload.heure_accident)          delete payload.heure_accident;
      if (!payload.reprise_medecin_travail) delete payload.reprise_medecin_travail;
      if (!payload.date_sortie_declaration) delete payload.date_sortie_declaration;
      const saved = isEdit
        ? await modifierAccident(initial.id, payload)
        : await creerAccident(payload);
      onSaved(saved);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.detail || Object.values(d ?? {}).flat().join(' ') || 'Erreur lors de l\'enregistrement.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderLeft:'1.5px solid #f3f4f6', borderRadius:'0 14px 14px 0' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#ef4444,#b91c1c)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
          <IcoAlert />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#111827' }}>{isEdit ? 'Modifier la déclaration' : 'Nouvelle déclaration AT'}</div>
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>Champs * obligatoires</div>
        </div>
        <button onClick={onClose} style={{ padding:'4px 10px', border:'1.5px solid #e5e7eb', background:'#f9fafb', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, color:'#6b7280', flexShrink:0, transition:'all .12s' }} onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.color='#dc2626';}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#6b7280';}}>Fermer</button>
      </div>

      {/* Corps */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:8, padding:'9px 13px', fontSize:12.5, marginBottom:14 }}>{error}</div>}

        {/* Collaborateur */}
        <div style={{ marginBottom:16 }}>
          <SecTitle>Collaborateur</SecTitle>
          <Field label="Rechercher" required>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}><IcoSearch /></div>
              <input value={collabQuery} onChange={e => handleCollabSearch(e.target.value)} placeholder="Nom, prénom, matricule…"
                style={{ ...inp, paddingLeft:30, borderColor: form.collaborateur ? '#0284c7' : '#e5e7eb' }} />
              {form.collaborateur && <span style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#0284c7', fontWeight:700 }}>✓</span>}
            </div>
            {collabNom && <div style={{ fontSize:11.5, color:'#0369a1', marginTop:3, fontWeight:600 }}>👤 {collabNom}</div>}
            {loadingCollab && <div style={{ fontSize:11.5, color:'#9ca3af', marginTop:3 }}>Recherche…</div>}
            {collabResults.length > 0 && (
              <div style={{ border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', marginTop:3, boxShadow:'0 4px 14px rgba(0,0,0,.1)' }}>
                {collabResults.slice(0,5).map((c,i) => (
                  <button key={c.id} onMouseDown={() => selectCollab(c)}
                    style={{ width:'100%', textAlign:'left', padding:'8px 11px', border:'none', borderTop: i>0?'1px solid #f3f4f6':'none', background:'white', cursor:'pointer', fontSize:12.5, display:'flex', justifyContent:'space-between' }}
                    onMouseEnter={e => e.currentTarget.style.background='#e0f2fe'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}>
                    <span style={{ fontWeight:600 }}>{c.nom} {c.prenom}</span>
                    <span style={{ color:'#9ca3af', fontSize:11 }}>{c.matricule}</span>
                  </button>
                ))}
              </div>
            )}
          </Field>
          {/* Carte infos collaborateur */}
          {collabInfo && (
            <div style={{ background:'#e0f2fe', border:'1.5px solid #7dd3fc', borderRadius:10, padding:'10px 14px', marginTop:10, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                ['Matricule', collabInfo.matricule],
                ['Sexe', collabInfo.sexe],
                ['Téléphone', collabInfo.telephone],
                ['Poste / Fonction', collabInfo.poste],
                ['Département', collabInfo.department],
                ['Date embauche', collabInfo.date_embauche ? new Date(collabInfo.date_embauche).toLocaleDateString('fr-FR') : '—'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  <span style={{ fontSize:9.5, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.4px' }}>{k}</span>
                  <span style={{ fontSize:12.5, color:'#111827', fontWeight:600 }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
            <Field label="N°01"><input value={form.num_cnam} onChange={e => set('num_cnam', e.target.value)} placeholder="Ex: 12345678" style={inp} /></Field>
            <Field label="Plant / Site">
              <select value={form.plant_section} onChange={e => set('plant_section', e.target.value)} style={inp}>
                <option value="">-- Sélectionner un site --</option>
                <option value="LTN1-2-4">LTN1-2-4</option>
                <option value="LTN3">LTN3</option>
                <option value="LTN5">LTN5</option>
                <option value="Mateur sud">Mateur Sud</option>
                <option value="Mateur Nord">Mateur Nord</option>
                <option value="Menzel Hayet">Menzel Hayet</option>
              </select>
            </Field>
            <Field label="Département"><input value={collabDepartement} readOnly placeholder="Auto (RH / im_db)" style={{ ...inp, background:'#f9fafb' }} /></Field>
            <Field label="Infirmier qui remplit" required><input value={infirmierNom} onChange={e => setInfirmierNom(e.target.value)} placeholder="Nom de l'infirmier" style={inp} /></Field>
          </div>
        </div>

        {/* Accident */}
        <div style={{ marginBottom:16 }}>
          <SecTitle>Accident</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Date" required><input type="date" value={form.date_accident} onChange={e => set('date_accident', e.target.value)} style={inp} /></Field>
            <Field label="Heure"><input type="time" value={form.heure_accident} onChange={e => set('heure_accident', e.target.value)} style={inp} /></Field>
            <Field label="Catégorie d'accident" required>
              <select value={form.categorie_accident} onChange={e => set('categorie_accident', e.target.value)} style={inp}>
                <option value="TRAVAIL">Accident de travail</option>
                <option value="TRAJET">Accident de trajet</option>
              </select>
            </Field>
            <Field label="Type / Description de l'accident" required><input value={form.type_accident} onChange={e => set('type_accident', e.target.value)} placeholder="Ex: Chute, Coupure…" style={inp} /></Field>
            <Field label="Lieu de l'accident" required>
              <select value={form.lieu_accident} onChange={e => set('lieu_accident', e.target.value)} style={inp}>
                <option value="">-- Sélectionner un lieu --</option>
                <option value="Production">Production</option>
                <option value="Locaux sanitaires">Locaux sanitaires</option>
                <option value="Cantines">Cantines</option>
                <option value="Périphérie">Périphérie</option>
                <option value="MMC">MMC</option>
                <option value="Zone des déchets">Zone des déchets</option>
                <option value="Parking">Parking</option>
                <option value="Administration">Administration</option>
                <option value="Locaux techniques">Locaux techniques</option>
                <option value="Zone fumeurs">Zone fumeurs</option>
                <option value="Autres">Autres</option>
              </select>
            </Field>
            <Field label="Description" required full>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Circonstances…" style={{ ...inp, resize:'vertical' }} />
            </Field>
            <Field label="Témoins"><input value={form.temoins} onChange={e => set('temoins', e.target.value)} placeholder="Noms des témoins" style={inp} /></Field>
            <Field label="Agent matériel"><input value={form.agent_materiel} onChange={e => set('agent_materiel', e.target.value)} placeholder="Ex: Machine…" style={inp} /></Field>
          </div>
        </div>

        {/* Lésion */}
        <div style={{ marginBottom:16 }}>
          <SecTitle>Lésion & Cause</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Siège de la lésion" required><input value={form.siege_lesion} onChange={e => set('siege_lesion', e.target.value)} placeholder="Ex: Main droite…" style={inp} /></Field>
            <Field label="Nature de la lésion" required><input value={form.nature_lesion} onChange={e => set('nature_lesion', e.target.value)} placeholder="Ex: Fracture…" style={inp} /></Field>
            <Field label="Cause" required><input value={form.cause_accident} onChange={e => set('cause_accident', e.target.value)} placeholder="Ex: Sol glissant…" style={inp} /></Field>
            <Field label="Criticité">
              <select value={form.criticite} onChange={(e) => set('criticite', e.target.value)} style={inp}>
                <option value="">-- Sélectionner --</option>
                <option value="FAIBLE">Faible</option>
                <option value="MODEREE">Modérée</option>
                <option value="GRAVE">Grave</option>
                <option value="TRES_GRAVE">Très grave</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Repos */}
        <div style={{ marginBottom:16 }}>
          <SecTitle>Repos & Suivi</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <Field label="Repos initial (j)"><input type="number" min="0" value={form.repos_initial} onChange={e => set('repos_initial', parseInt(e.target.value)||0)} style={inp} /></Field>
            <Field label="Prolongation (j)"><input type="number" min="0" value={form.prolongation} onChange={e => set('prolongation', parseInt(e.target.value)||0)} style={inp} /></Field>
            <Field label="Reprise médecin travail"><input type="date" value={form.reprise_medecin_travail} onChange={e => set('reprise_medecin_travail', e.target.value)} style={inp} /></Field>
          </div>
        </div>

        {/* Déclaration */}
        <div style={{ marginBottom:16 }}>
          <SecTitle>Déclaration & Sortie</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Date déclaration SM" required><input type="date" value={form.date_declaration_service_medical} onChange={e => set('date_declaration_service_medical', e.target.value)} style={inp} /></Field>
            <Field label="Date sortie déclaration"><input type="date" value={form.date_sortie_declaration} onChange={e => set('date_sortie_declaration', e.target.value)} style={inp} /></Field>
            <Field label="Chauffeur / Transport"><input value={form.chauffeur_sortie} onChange={e => set('chauffeur_sortie', e.target.value)} placeholder="Nom du chauffeur" style={inp} /></Field>
          </div>
        </div>

        <div style={{ display:'flex', gap:20, paddingBottom:8 }}>
          {[['reporting_interne','Reporting interne'],['reporting_wsd','Reporting WSD']].map(([k,label]) => (
            <label key={k} style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
              <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} style={{ width:15, height:15, accentColor:'#dc2626' }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'12px 20px', borderTop:'1px solid #f3f4f6', flexShrink:0, display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa', borderRadius:'0 0 14px 0' }}>
        <button onClick={onClose} style={{ padding:'8px 16px', border:'1.5px solid #e5e7eb', background:'white', color:'#374151', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
        <button onClick={handleSubmit} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 20px', border:'none', background: saving?'#fca5a5':'linear-gradient(135deg,#ef4444,#b91c1c)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor: saving?'not-allowed':'pointer' }}>
          <IcoSave />{saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Déclarer'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function AccidentTravail() {
  const { user } = useAuth();
  const [accidents, setAccidents] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  // panel: null | 'detail' | 'new' | 'edit'
  const [panel,     setPanel]     = useState(null);
  const [selected,  setSelected]  = useState(null);
  const annee = new Date().getFullYear();

  const load = async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([getAccidents(), getStatsAccidents(annee)]);
      setAccidents(data); setStats(s);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = (a)    => { setSelected(a); setPanel('detail'); };
  const openEdit   = (a, e) => { e?.stopPropagation(); setSelected(a); setPanel('edit'); };
  const openNew    = ()     => { setSelected(null); setPanel('new'); };
  const closePanel = ()     => { setPanel(null); setSelected(null); };

  const handleSaved = (saved) => {
    setAccidents(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      return idx >= 0 ? prev.map(a => a.id===saved.id ? saved : a) : [saved, ...prev];
    });
    // Après sauvegarde → afficher les détails de l'enregistrement
    setSelected(saved);
    setPanel('detail');
    load();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const ok = await uiConfirm({
      title: 'Suppression',
      text: 'Supprimer cette déclaration ?',
      confirmButtonText: 'Supprimer',
    });
    if (!ok) return;
    try {
      await supprimerAccident(id);
      setAccidents(p => p.filter(a => a.id !== id));
      if (selected?.id === id) closePanel();
    } catch {
      await uiAlert({ icon: 'error', title: 'Suppression', text: 'Erreur lors de la suppression.' });
    }
  };

  const refreshAfterEnquete = async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([getAccidents(), getStatsAccidents(annee)]);
      setAccidents(data);
      setStats(s);
      setSelected((sel) => (sel?.id ? data.find((x) => x.id === sel.id) ?? sel : sel));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const filtered = accidents.filter(a =>
    !search.trim() ||
    (a.collaborateur_nom||'').toLowerCase().includes(search.toLowerCase()) ||
    (a.lieu_accident||'').toLowerCase().includes(search.toLowerCase()) ||
    (a.type_accident||'').toLowerCase().includes(search.toLowerCase())
  );

  const criticiteChip = (c) => {
    if (!c) return null;
    const s = criticiteStyles(c);
    return (
      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:s.bg, color:s.color, border:`1px solid ${s.border}`, flexShrink:0 }}>
        {criticiteLabel(c)}
      </span>
    );
  };

  const showPanel = panel !== null;

  return (
    <div style={{ display:'flex', height:'100%', borderRadius:14, overflow:'hidden', border:'1.5px solid #f3f4f6', background:'white', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>

      {/* ══ GAUCHE — Liste ══ */}
      <div style={{ display:'flex', flexDirection:'column', width: showPanel ? '320px' : '100%', flexShrink:0, transition:'width .2s ease', borderRight: showPanel ? '1.5px solid #f3f4f6' : 'none' }}>

        {/* Header */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          {stats && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
              {[
                { label:`Total ${annee}`, value: stats.total, color:'#dc2626', bg:'#fef2f2' },
                { label:'Jours perdus', value: stats.total_jours_perdus, color:'#d97706', bg:'#fff7ed' },
                { label:'Ce mois', value: accidents.filter(a => new Date(a.date_accident).getMonth()===new Date().getMonth()).length, color:'#0369a1', bg:'#e0f2fe' },
              ].map((s,i) => (
                <div key={i} style={{ background:s.bg, borderRadius:9, padding:'8px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:9.5, color:s.color, fontWeight:600, opacity:.8, marginTop:1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, position:'relative' }}>
              <div style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}><IcoSearch /></div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ ...inp, paddingLeft:30, fontSize:12.5 }} />
            </div>
            <button onClick={openNew}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'white', borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 3px 10px rgba(239,68,68,.3)' }}>
              <IcoPlus /> Nouveau
            </button>
          </div>
        </div>

        {/* Lignes */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading && <div style={{ textAlign:'center', padding:40, color:'#9ca3af', fontSize:13 }}>Chargement…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:50, color:'#9ca3af' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🚨</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#374151' }}>Aucun accident déclaré</div>
              <div style={{ fontSize:12, marginTop:4 }}>Cliquez sur "Nouveau" pour commencer</div>
            </div>
          )}
          {!loading && filtered.map(a => {
            const isActive = selected?.id === a.id;
            return (
              <div key={a.id} onClick={() => openDetail(a)}
                style={{ padding:'11px 14px', borderBottom:'1px solid #f9fafb', cursor:'pointer',
                  background: isActive ? '#fef2f2' : 'white',
                  borderLeft: isActive ? '3px solid #dc2626' : '3px solid transparent',
                  transition:'background .12s' }}
                onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='#fafafa'; }}
                onMouseLeave={e => { if(!isActive) e.currentTarget.style.background='white'; }}
              >
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background: isActive?'#fecaca':'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#dc2626' }}>
                    <IcoAlert />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {a.collaborateur_nom || '—'}
                    </div>
                    <div style={{ fontSize:11.5, color:'#6b7280', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {fmtDate(a.date_accident)} · {a.lieu_accident}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, flexWrap:'wrap' }}>
                      {criticiteChip(a.criticite)}
                      <span style={{ fontSize:10.5, color:'#9ca3af' }}>{a.total_jours_perdus}j perdus</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <PrintEnquete accident={a} infirmiereNom={a.infirmiere_nom || ''} currentUser={user} />
                    <button onClick={e => openEdit(a, e)}
                      style={{ padding:'5px 12px', border:'1.5px solid #bfdbfe', background:'#eff6ff', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700, color:'#2563eb', transition:'all .12s', flexShrink:0, whiteSpace:'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#2563eb'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='#2563eb'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.color='#2563eb'; e.currentTarget.style.borderColor='#bfdbfe'; }}>
                      Modifier
                    </button>
                    <button onClick={e => handleDelete(a.id, e)}
                      style={{ padding:'5px 12px', border:'1.5px solid #fecaca', background:'#fef2f2', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700, color:'#dc2626', transition:'all .12s', flexShrink:0, whiteSpace:'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#dc2626'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='#dc2626'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='#fecaca'; }}>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ DROITE — Détail ou Formulaire ══ */}
      {panel === 'detail' && selected && (
        <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
          <DetailAccident accident={selected} onEdit={openEdit} onClose={closePanel} onEnqueteSaved={refreshAfterEnquete} />
        </div>
      )}
      {(panel === 'new' || panel === 'edit') && (
        <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
          <FormulaireAccident initial={panel === 'edit' ? selected : null} onSaved={handleSaved} onClose={() => selected ? setPanel('detail') : closePanel()} />
        </div>
      )}
    </div>
  );
}