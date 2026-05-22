// src/components/medecinControleur/ListeDuJour.jsx
import { useEffect, useState } from 'react';
import { creerContreVisite, creerControleMedical, saisirVerdict } from '../../api/Contrevisiteapi';
import { getSites } from '../../api/sitesApi';
import { pickDepartementCollaborateur } from '../../utils/ficheCollaborateur';
import { payloadReposInitial, payloadDureeRepos } from '../../utils/contreVisiteRepos';
import { flatMapListesContreVisiteItemsOrdered } from '../../utils/contreVisiteOrdre';
import { useAuth } from '../../context/AuthContext';

const C = {
  primary:  '#0284c7', primary2: '#0369a1',
  dark:     '#0c4a6e', light:    '#e0f2fe',
  light2:   '#f0f9ff', border:   '#bae6fd',
  accent:   '#38bdf8', text:     '#0f172a',
  muted:    '#64748b',
};
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const today = () => new Date().toISOString().split('T')[0];

const IcoLogout    = ({ c='#94a3b8'  }) => <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoRefresh   = ({ c='#0284c7' }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
const IcoArrow     = ({ c='#0284c7' }) => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/></svg>;
const IcoCheck     = ({ c='white'   }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoPlus      = ({ c='white'   }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoDoc       = ({ c='#0284c7' }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>;
const IcoHistory   = ({ c='#0284c7' }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoDownload  = ({ c='white'   }) => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoCalendar  = ({ c='#0284c7' }) => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoUser      = ({ c='white'   }) => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoClipboard = ({ c='white'   }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>;
const IcoChart     = ({ c='white'   }) => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoExpertise = ({ c='white'   }) => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>;
const IcoPencil    = ({ c='#0284c7', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash     = ({ c='#dc2626', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoEye       = ({ c='#0284c7', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoClose     = ({ c='white',   size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoSave      = ({ c='white',   size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoAlert     = ({ c='#d97706', size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;


/* ─── Helpers ─────────────────────────────────────────────── */
const getNom = (item) =>
  item?.collaborateur_nom ||
  (item?.collaborateur && typeof item.collaborateur === 'object'
    ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
    : `#${item?.collaborateur}`);

const getMatricule = (item) =>
  item?.collaborateur_matricule || item?.collaborateur?.matricule || '';

const getDept = (item) =>
  pickDepartementCollaborateur(
    item?.collaborateur && typeof item.collaborateur === 'object'
      ? item.collaborateur
      : { department: item?.collaborateur_departement, departement: item?.collaborateur_departement },
  );

const getPoste = (item) =>
  item?.collaborateur?.poste || item?.collaborateur_poste || '';

const getItemPassageId = (item) => {
  if (!item || typeof item !== 'object') return null;
  const candidates = [
    item.item_passage_id,
    item.item_passage, // sometimes backend returns a numeric FK directly
    item.itemPassageId,
    item.item_passage?.id,
    item.itemPassage?.id,
    item.passage_id,
    item.passageId,
    item.passage?.id,
  ].filter((v) => v !== null && v !== undefined && String(v).trim() !== '');

  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const inputCss = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: 9,
  fontSize: 13.5, outline: 'none', color: '#0f172a',
  background: 'white', boxSizing: 'border-box',
  transition: 'border-color .15s', fontFamily: 'inherit',
};
const labelCss = {
  display: 'block', fontSize: 11.5, fontWeight: 700,
  color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 6,
};
function Field({ label, children }) {
  return <div><label style={labelCss}>{label}</label>{children}</div>;
}

/* ════════════ SOUS-COMPOSANTS ════════════ */
function ListeSkeleton() {
  return (
    <div style={{ padding: '16px 0' }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 76, borderRadius: 14, marginBottom: 10,
          background: `linear-gradient(90deg,${C.light2} 25%,${C.light} 50%,${C.light2} 75%)`,
          backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}/>
      ))}
    </div>
  );
}

function ListeEmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: `1.5px dashed ${C.border}` }}>
      <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="1.2" strokeLinecap="round" style={{ display: 'block', margin: '0 auto' }}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <p style={{ color: '#94a3b8', fontSize: 15, marginTop: 14, fontWeight: 600 }}>Aucun patient aujourd'hui</p>
      <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>Aucune liste de contre-visite active</p>
    </div>
  );
}

function SectionLabel({ titre, count, couleur }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{titre}</span>
      <span style={{ background: couleur + '22', color: couleur, border: `1px solid ${couleur}44`, fontSize: 11.5, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: C.light }} />
    </div>
  );
}

function ItemRow({ item, idx, dejaTraite, onCreerContreVisite }) {
  const nom       = getNom(item);
  const matricule = getMatricule(item);
  const dept      = getDept(item);
  const initials  = (nom || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0,2);
  const ordreAffiche =
    item?.ordre != null && String(item.ordre).trim() !== '' && Number.isFinite(Number(item.ordre)) && Number(item.ordre) >= 1
      ? Number(item.ordre)
      : idx + 1;

  return (
    <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${C.light}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: dejaTraite ? 0.72 : 1, transition: 'box-shadow .15s', marginBottom: 8 }}
      onMouseEnter={e => { if (!dejaTraite) e.currentTarget.style.boxShadow = `0 4px 16px rgba(2,132,199,.12)`; }}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.05)'}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: dejaTraite ? '#f1f5f9' : `linear-gradient(135deg,${C.primary},${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dejaTraite ? '#94a3b8' : 'white', fontSize: 11, fontWeight: 800 }}>
        {dejaTraite ? '✓' : ordreAffiche}
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: dejaTraite ? '#f1f5f9' : C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dejaTraite ? '#94a3b8' : C.primary, fontSize: 14, fontWeight: 800 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 3 }}>{nom}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {matricule && <span style={{ background: C.light, color: C.primary, padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11.5 }}>{matricule}</span>}
          {dept && <span style={{ fontSize: 12, color: C.muted }}>{dept}</span>}
        </div>
      </div>
      <div style={{ padding: '5px 13px', borderRadius: 20, flexShrink: 0, background: dejaTraite ? '#f0fdf4' : '#fff7ed', color: dejaTraite ? '#15803d' : '#c2410c', border: `1px solid ${dejaTraite ? '#bbf7d0' : '#fed7aa'}`, fontSize: 12, fontWeight: 700 }}>
        {dejaTraite ? '✓ Complété' : 'En attente'}
      </div>
      {dejaTraite ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
          <IcoCheck c="#94a3b8"/> Complété
        </div>
      ) : (
        <button onClick={() => onCreerContreVisite(item)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 9, background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: `0 3px 10px rgba(2,132,199,.3)`, transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <IcoPlus /> Créer Contre-Visite
        </button>
      )}
    </div>
  );
}

/* ════════════ VUE 1 : LISTE ════════════ */
function ListePassageView({ listes, loading, onCreerContreVisite }) {
  const allItems  = flatMapListesContreVisiteItemsOrdered(listes);
  const enAttente = allItems.filter(i => i.statut === 'EN_ATTENTE');
  const traites   = allItems.filter(i => i.statut === 'EFFECTUEE');
  if (loading) return <ListeSkeleton />;
  if (allItems.length === 0) return <ListeEmptyState />;
  return (
    <div>
      {enAttente.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel titre="En attente" count={enAttente.length} couleur="#f97316" />
          {enAttente.map((item, idx) => <ItemRow key={item.id} item={item} idx={idx} dejaTraite={false} onCreerContreVisite={onCreerContreVisite} />)}
        </div>
      )}
      {traites.length > 0 && (
        <div>
          <SectionLabel titre="Complétés" count={traites.length} couleur="#0284c7" />
          {traites.map((item, idx) => <ItemRow key={item.id} item={item} idx={idx} dejaTraite={true} onCreerContreVisite={onCreerContreVisite} />)}
        </div>
      )}
    </div>
  );
}

/* ════════════ FORMULAIRE CONTRÔLE MÉDICAL (étape 2) ════════ */
function FormulaireControleMedical({ cv, item, medecinNom, onRetour, onSuccess }) {
  const nom       = getNom(item);
  const matricule = getMatricule(item);
  const dept      = getDept(item);
  const reposPrescrit = cv.duree_repos > 0 ? `${cv.duree_repos} jours à partir du ${fmtDateShort(cv.a_partir)}` : 'Aucun repos prescrit';
  const dateEmission  = fmtDateShort(cv.date || today());
  const [avis,       setAvis]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [avisTouch,  setAvisTouch]  = useState(false);

  const avisBorder = avisTouch ? (!avis.trim() ? '#dc2626' : '#0284c7') : '#e2e8f0';

  const handleSubmit = async () => {
    setAvisTouch(true);
    if (!avis.trim()) { setError("L'avis du médecin contrôleur est obligatoire."); return; }
    setError(''); setLoading(true);
    try {
      const cm = await creerControleMedical({ contre_visite: cv.id, segment: dept || 'N/A', avis_medecin_controleur: avis.trim() });
      onSuccess({ cv: { ...cv, controle_medical: cm }, cm });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || Object.entries(data || {}).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') || 'Erreur survenue.');
    } finally { setLoading(false); }
  };

  const ReadField = ({ label, value }) => (
    <div><label style={labelCss}>{label}</label>
      <div style={{ ...inputCss, background: C.light2, color: '#475569', border: `1.5px solid ${C.light}`, fontWeight: 600, display: 'flex', alignItems: 'center' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <button onClick={onRetour} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.primary, fontSize: 13.5, fontWeight: 700, marginBottom: 22, padding: '6px 0' }}>
        <IcoArrow /> Retour à la contre-visite
      </button>
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <IcoCheck c="#0284c7"/>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0369a1' }}>Contre-visite enregistrée avec succès</div>
          <div style={{ fontSize: 12, color: '#0284c7', marginTop: 2 }}>Complétez le contrôle médical à envoyer au RH</div>
        </div>
      </div>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20 }}>{error}</div>}
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${C.light}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', background: C.light2, borderBottom: `1px solid ${C.light}`, borderLeft: `4px solid ${C.primary}`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <IcoDoc /><span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>Contrôle Médical</span>
          <span style={{ marginLeft: 'auto', background: C.light, color: C.primary, border: `1px solid ${C.border}`, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>Document RH</span>
        </div>
        <div style={{ padding: '22px 24px 26px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: C.light }} />Informations auto<div style={{ flex: 1, height: 1, background: C.light }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <ReadField label="Date d'émission" value={dateEmission} />
              <ReadField label="Matricule"        value={matricule || '—'} />
              <ReadField label="Nom & Prénom"     value={nom || '—'} />
              <ReadField label="Département"          value={dept || '—'} />
            </div>
            <div style={{ marginTop: 14 }}><ReadField label="Repos prescrit" value={reposPrescrit} /></div>
            {medecinNom && <div style={{ marginTop: 14 }}><ReadField label="Médecin contrôleur" value={`Dr. ${medecinNom}`} /></div>}
          </div>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: C.light }} />À compléter<div style={{ flex: 1, height: 1, background: C.light }} />
            </div>
            <Field label="Avis du médecin contrôleur *">
              <textarea value={avis} onChange={e => { setAvis(e.target.value); setAvisTouch(true); }}
                placeholder="Ex: Patient examiné à domicile. L'arrêt de travail est médicalement justifié..."
                rows={5} style={{ ...inputCss, resize: 'vertical', lineHeight: 1.7, borderColor: avisBorder }}
                onBlur={() => setAvisTouch(true)} />
              {avisTouch && !avis.trim() && (
                <div style={{ fontSize:11, color:'#dc2626', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  L'avis est obligatoire
                </div>
              )}
            </Field>
          </div>
          <button onClick={handleSubmit} disabled={!avis.trim() || loading} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 11, background: avis.trim() ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : '#e2e8f0', color: avis.trim() ? 'white' : '#94a3b8', fontSize: 14, fontWeight: 700, cursor: avis.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'all .2s', boxShadow: avis.trim() ? `0 4px 14px rgba(2,132,199,.3)` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
            onMouseEnter={e => { if (avis.trim() && !loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {loading ? 'Création...' : <><IcoCheck /> Créer le Contrôle Médical</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════ VUE 2 : FORMULAIRE CONTRE-VISITE ════════════ */
function FormulaireView({ item, medecinNom, onRetour, onSuccess }) {
  const { user } = useAuth();
  const dept = getDept(item);
  const [etape,   setEtape]   = useState('cv');
  const [cvCree,  setCvCree]  = useState(null);
  const [form,    setForm]    = useState({ date: today(), repos_initial: '', duree_repos: '', a_partir: today(), remarque: '' });
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [touchedF, setTouchedF] = useState({});
  const markF = (k) => setTouchedF(p => ({ ...p, [k]: true }));
  const hc = (field, val) => { setForm(f => ({ ...f, [field]: val })); markF(field); };

  const errorsF = {};
  const hasErrF = false;
  const getBF = (field) => {
    if (touchedF[field] && errorsF[field]) return '#dc2626';
    if (touchedF[field] && !errorsF[field]) return '#0284c7';
    return '#e2e8f0';
  };
  const ErrF = ({ field }) => touchedF[field] && errorsF[field] ? (
    <div style={{ fontSize:11, color:'#dc2626', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {errorsF[field]}
    </div>
  ) : null;

  useEffect(() => {
    let cancelled = false;
    const loadSites = async () => {
      setLoadingSites(true);
      try {
        const data = await getSites();
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setSites(list);
          if (user?.site_id) {
            setSelectedSiteId(String(user.site_id));
          } else if (list.length === 1) {
            const onlyId = list[0]?.id ?? list[0]?.site_id ?? list[0]?.pk;
            if (onlyId !== null && onlyId !== undefined) setSelectedSiteId(String(onlyId));
          }
        }
      } catch {
        if (!cancelled) setSites([]);
      } finally {
        if (!cancelled) setLoadingSites(false);
      }
    };

    loadSites();
    return () => { cancelled = true; };
  }, [user]);

  // If a contre-visite already exists (created earlier) but contrôle médical not yet done,
  // jump directly to step 2 so the doctor can complete the "Contrôle" action.
  useEffect(() => {
    const existingCv = item?.contre_visite || item?.contreVisite || null;
    const hasExistingCv = Boolean(existingCv?.id);
    const hasCm =
      Boolean(existingCv?.controle_medical) ||
      Boolean(existingCv?.controleMedical) ||
      Boolean(existingCv?.controle_medical_id) ||
      Boolean(existingCv?.controleMedicalId);
    if (hasExistingCv && !hasCm) {
      setCvCree(existingCv);
      setEtape('cm');
    }
  }, [item]);

  const handleSubmitCV = async () => {
    if (!selectedSiteId) { setError('Le champ site est obligatoire.'); return; }

    setError(''); setLoading(true);
    try {
      const sitePayload = Number.isNaN(Number(selectedSiteId)) ? selectedSiteId : Number(selectedSiteId);
      const itemPassageId = getItemPassageId(item);
      let cv = null;

      if (itemPassageId) {
        cv = await creerContreVisite({
          item_passage: itemPassageId,
          repos_initial: payloadReposInitial(form.repos_initial),
          duree_repos: payloadDureeRepos(form.duree_repos),
          a_partir: form.a_partir,
          remarque: form.remarque,
          date: form.date,
          site: sitePayload,
        });
      } else if (item?.id) {
        // New workflow: when items are "lignes-contre-visites" (assigned list lines),
        // backend may not expose item_passage. In that case, we send verdict on the line.
        const verdictResult = await saisirVerdict(item.id, {
          duree_repos: payloadDureeRepos(form.duree_repos),
          a_partir: form.a_partir,
          remarque: form.remarque,
          refus_repos: false,
          repos_initial: payloadReposInitial(form.repos_initial),
          date: form.date,
          site: sitePayload,
        });
        cv =
          verdictResult?.contre_visite ||
          verdictResult?.contreVisite ||
          (verdictResult?.id && verdictResult?.duree_repos !== undefined ? verdictResult : null);
      }

      if (!cv?.id) {
        setError("Impossible de créer la contre-visite (ID manquant). Vérifiez la réponse backend (l'item doit exposer item_passage ou supporter saisir_verdict).");
        return;
      }
      onSuccess({ cv, item, partial: true });
      setCvCree(cv); setEtape('cm');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || Object.entries(data || {}).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') || 'Erreur survenue.');
    } finally { setLoading(false); }
  };

  if (etape === 'cm' && cvCree) {
    return <FormulaireControleMedical cv={cvCree} item={item} medecinNom={medecinNom} onRetour={() => setEtape('cv')}
      onSuccess={({ cv: cvFull, cm }) => onSuccess({ cv: cvFull, cm, item, partial: false })} />;
  }

  const canSubmit = !hasErrF;
  const nom = getNom(item); const matricule = getMatricule(item);

  return (
    <div style={{ width: '100%' }}>
      <button onClick={onRetour} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.primary, fontSize: 13.5, fontWeight: 700, marginBottom: 22, padding: '6px 0' }}>
        <IcoArrow /> Retour à la liste
      </button>
      {/* Étapes */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        {[{ n: 1, lbl: 'Contre-Visite' }, { n: 2, lbl: 'Contrôle Médical' }].map(({ n, lbl }, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i === 0 ? 'none' : 1 }}>
            {i > 0 && <div style={{ flex: 1, height: 2, background: C.light, margin: '0 8px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: n === 1 ? `linear-gradient(135deg,${C.primary},${C.accent})` : '#e2e8f0', color: n === 1 ? 'white' : '#94a3b8' }}>{n}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: n === 1 ? C.primary : '#94a3b8' }}>{lbl}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Carte collaborateur */}
      <div style={{ background: 'linear-gradient(135deg,#e0f7ff,#bae6fd,#7dd3fc)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 4px 20px rgba(14,165,233,.18)', border: '1.5px solid #7dd3fc' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Collaborateur Sélectionné</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[{ lbl: 'Matricule', val: matricule || '—' }, { lbl: 'Nom Complet', val: nom || '—' }, { lbl: 'Département', val: dept || '—' }].map(({ lbl, val }) => (
            <div key={lbl}><div style={{ fontSize: 11, color: '#0369a1', marginBottom: 4 }}>{lbl}</div><div style={{ fontSize: 15, fontWeight: 800, color: '#0c4a6e' }}>{val}</div></div>
          ))}
        </div>
      </div>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20 }}>{error}</div>}
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${C.light}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', background: C.light2, borderBottom: `1px solid ${C.light}`, borderLeft: `4px solid ${C.primary}`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <IcoDoc /><span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>Contre-Visite</span>
        </div>
        <div style={{ padding: '22px 24px 26px' }}>
          <div style={{ marginBottom: 16 }}>
            <Field label="Date de la contre-visite">
              <input type="date" value={form.date} onChange={e => hc('date', e.target.value)}
                onBlur={() => markF('date')}
                style={{ ...inputCss, borderColor: getBF('date') }} />
            </Field>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Field label="Site *">
              <select
                value={selectedSiteId}
                onChange={e => setSelectedSiteId(e.target.value)}
                style={inputCss}
                disabled={loadingSites || loading}
              >
                <option value="">{loadingSites ? 'Chargement des sites...' : 'Choisir un site'}</option>
                {sites.map((site) => {
                  const id = site?.id ?? site?.site_id ?? site?.pk;
                  const nomSite = site?.nom ?? site?.site_nom ?? site?.name ?? `Site #${id}`;
                  return <option key={String(id)} value={String(id)}>{nomSite}</option>;
                })}
              </select>
            </Field>
          </div>
          {/* Repos prescrit par le medecin traitant — visible avant de saisir */}
          {(() => {
            const certif = item?.consultation?.certificats?.[0];
            if (!certif) return null;
            return (
              <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                <span style={{ fontSize:12, fontWeight:700, color:'#15803d' }}>
                  Repos prescrit par le medecin traitant :&nbsp;
                  <strong>{certif.jours_repos} jour{certif.jours_repos > 1 ? 's' : ''}</strong>
                  {certif.date_debut_repos ? ` a partir du ${new Date(certif.date_debut_repos).toLocaleDateString('fr-FR')}` : ''}
                </span>
              </div>
            );
          })()}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <Field label="Repos initial">
                <input type="number" min="0" value={form.repos_initial} onChange={e => hc('repos_initial', e.target.value)}
                  placeholder="Ex: 7"
                  style={{ ...inputCss, borderColor: '#bae6fd' }} />
              </Field>
            </div>
            <div>
              <Field label="Duree de repos (jours)">
                <input type="number" min="0" value={form.duree_repos} onChange={e => hc('duree_repos', e.target.value)}
                  onBlur={() => markF('duree_repos')} placeholder="Ex: 5 "
                  style={{ ...inputCss, borderColor: getBF('duree_repos') }} />
              </Field>
            </div>
            <div>
              <Field label="A partir du">
                <input type="date" value={form.a_partir} onChange={e => hc('a_partir', e.target.value)}
                  onBlur={() => markF('a_partir')}
                  style={{ ...inputCss, borderColor: getBF('a_partir') }} />
              </Field>
            </div>
          </div>
          {form.duree_repos && parseInt(form.duree_repos) > 0 && form.a_partir && (
            <div style={{ background: C.light, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 13px', marginBottom: 16, fontSize: 13, color: C.primary2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IcoCalendar />
              Repos de {form.duree_repos} jour{parseInt(form.duree_repos) > 1 ? 's' : ''} — du {new Date(form.a_partir).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              {' '}au {new Date(new Date(form.a_partir).getTime() + (parseInt(form.duree_repos) - 1) * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          <div style={{ marginBottom: 26 }}>
            <Field label="Remarque">
              <textarea value={form.remarque} onChange={e => hc('remarque', e.target.value)} placeholder="Remarque (optionnelle)..." rows={3}
                onBlur={() => markF('remarque')}
                style={{ ...inputCss, resize: 'vertical', lineHeight: 1.6, borderColor: getBF('remarque') }} />
            </Field>
          </div>
          <button onClick={handleSubmitCV} disabled={loading}
            style={{ width:'100%', padding:'13px', border:'none', borderRadius:11, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', transition:'all .2s', boxShadow:'0 4px 14px rgba(2,132,199,.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
            {loading ? 'Enregistrement...' : <><IcoCheck /> Valider → Contrôle Médical</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════ PAGINATION ════════════ */
function Pagination({ total, pageSize, currentPage, onPageChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '16px 20px', borderTop: `1px solid ${C.light}`, background: C.light2, borderRadius: '0 0 16px 16px' }}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: currentPage === 1 ? C.light2 : 'white', color: currentPage === 1 ? '#cbd5e1' : C.primary, fontWeight: 700, fontSize: 13, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>Préc.
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onPageChange(p)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: p === currentPage ? `linear-gradient(135deg,${C.primary},${C.accent})` : C.light2, color: p === currentPage ? 'white' : C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: p === currentPage ? `0 2px 8px rgba(2,132,199,.35)` : 'none' }}>{p}</button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: currentPage === totalPages ? C.light2 : 'white', color: currentPage === totalPages ? '#cbd5e1' : C.primary, fontWeight: 700, fontSize: 13, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
        Suiv.<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Page {currentPage} / {totalPages} — {total} enreg.</span>
    </div>
  );
}


/* ════════════ FILE D'ATTENTE ════════════ */
function FileAttenteControleur({ items, selectedItemId, onSelect, onCreerContreVisite, loading, onRefresh }) {
  const enAttente   = items.filter(i => i.statut === 'EN_ATTENTE');
  const traites     = items.filter(i => i.statut === 'EFFECTUEE');
  const getInitials = (nom) => (nom || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0,2);
  const hasPendingControle = (item) => {
    const cv = item?.contre_visite || item?.contreVisite;
    if (!cv) return false;
    const hasCm =
      Boolean(cv?.controle_medical) ||
      Boolean(cv?.controleMedical) ||
      Boolean(cv?.controle_medical_id) ||
      Boolean(cv?.controleMedicalId);
    return Boolean(cv?.id) && !hasCm;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'white', borderRadius: 16, border: `1px solid ${C.light}`, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.light}`, flexShrink: 0, background: C.light2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>Liste du jour</span>
            {typeof onRefresh === 'function' && (
              <button onClick={onRefresh} title="Rafraîchir" style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <IcoRefresh c={C.primary} />
              </button>
            )}
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: enAttente.length > 0 ? '#fff7ed' : C.light, color: enAttente.length > 0 ? '#c2410c' : C.primary }}>
            {enAttente.length} en attente
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 16px' }}>
        {loading && [1,2,3].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 12, marginBottom: 8, background: `linear-gradient(90deg,${C.light2} 25%,${C.light} 50%,${C.light2} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        ))}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 12px', background: C.light2, borderRadius: 12, border: `1.5px dashed ${C.border}`, marginTop: 8 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
            <p style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>Aucun patient</p>
          </div>
        )}
        {!loading && enAttente.length > 0 && (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, paddingLeft: 4 }}>À traiter</div>
            {enAttente.map(item => {
              const nom        = getNom(item);
              const isSelected = item.id === selectedItemId;
              const showControle = hasPendingControle(item);
              return (
                <div key={item.id} style={{ borderRadius: 12, marginBottom: 8, overflow: 'hidden', border: `2px solid ${isSelected ? C.primary : 'transparent'}`, background: isSelected ? C.light : 'white', boxShadow: isSelected ? `0 0 0 1px ${C.primary}, 0 4px 12px rgba(2,132,199,.12)` : '0 1px 3px rgba(0,0,0,.06)', transition: 'all .15s' }}>
                  <div onClick={() => onSelect(item)} style={{ padding: '11px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: `linear-gradient(135deg,${C.primary},${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800 }}>{getInitials(nom)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.dark : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {getMatricule(item) && <span style={{ background: C.light, color: C.primary, padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 10.5 }}>{getMatricule(item)}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, background: '#fff7ed', color: '#c2410c', padding: '2px 7px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>Attente</span>
                  </div>
                  <div style={{ padding: '0 12px 11px' }}>
                    <button onClick={() => onCreerContreVisite(item)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', border: 'none', borderRadius: 8, background: showControle ? 'linear-gradient(135deg,#0c4a6e,#0284c7)' : `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 6px rgba(2,132,199,.3)`, transition: 'all .15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                      {showControle ? <IcoCheck /> : <IcoPlus />}
                      {showControle ? 'Contrôle' : 'Créer Contre-Visite'}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {!loading && traites.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px', padding: '0 4px' }}>
              <div style={{ flex: 1, height: 1, background: C.light }} />
              <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700 }}>Traités ({traites.length})</span>
              <div style={{ flex: 1, height: 1, background: C.light }} />
            </div>
            {traites.map(item => {
              const nom = getNom(item);
              return (
                <div key={item.id}
                  style={{ borderRadius: 12, marginBottom: 8, overflow: 'hidden', border: `1.5px solid ${C.border}`, background: 'white', opacity: 0.75, transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = '#0284c7'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.borderColor = C.border; }}>
                  <div onClick={() => onSelect(item)} style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#0284c7,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800 }}>
                      {(nom||'').split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>{getMatricule(item)}</div>
                    </div>
                    <span style={{ fontSize: 10, background: '#f0fdfa', color: '#0284c7', padding: '2px 8px', borderRadius: 20, fontWeight: 700, border: '1px solid #bae6fd', flexShrink: 0 }}>Traité</span>
                  </div>
                  <div style={{ padding: '0 10px 10px' }}>
                    <button onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px', border: '1.5px solid #0284c7', borderRadius: 8, background: 'white', color: '#0284c7', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
>
                      <IcoPencil c="currentColor" size={12}/> Modifier la contre-visite
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function PanneauVide() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 16, border: `1.5px dashed ${C.border}` }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.4" strokeLinecap="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.muted }}>Sélectionnez un patient</p>
      <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 6 }}>ou cliquez sur "Créer Contre-Visite"</p>
    </div>
  );
}


export { ListePassageView, FormulaireView, FileAttenteControleur, PanneauVide };  