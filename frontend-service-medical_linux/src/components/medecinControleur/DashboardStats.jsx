import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FormulaireDemandeExpertise,
  DemandesExpertiseView,
  ouvrirDemandeExpertise,
} from '../components/medecinControleur/Demandeexpertise';
import FormulaireContreVisite from './Formulairecontrevisite';
import {
  getMesListesContreVisite,
  creerContreVisite,
  creerControleMedical,
  getContreVisites,
} from '../api/Contrevisiteapi';
import { getSites } from '../api/sitesApi';
import { pickDepartementCollaborateur, displayDepartementControleMedical } from '../../utils/ficheCollaborateur';
import { payloadDureeRepos } from '../../utils/contreVisiteRepos';
import { flatMapListesContreVisiteItemsOrdered } from '../../utils/contreVisiteOrdre';
import { getSitePrintConfig } from '../../utils/siteConfig';

/*  Helpers  */
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

const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const today = () => new Date().toISOString().split('T')[0];

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

/* ─── Palette bleu ciel médical ──────────────────────────── */
const C = {
  primary:  '#0284c7',
  primary2: '#0369a1',
  dark:     '#0c4a6e',
  light:    '#e0f2fe',
  light2:   '#f0f9ff',
  border:   '#bae6fd',
  accent:   '#38bdf8',
  text:     '#0f172a',
  muted:    '#64748b',
};

/* ─── Icônes SVG inline ───────────────────────────────────── */
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

/* ─── CSS commun ─────────────────────────────────────────── */
const inputCss = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: 9,
  fontSize: 13.5, outline: 'none', color: C.text,
  background: 'white', boxSizing: 'border-box',
  transition: 'border-color .15s', fontFamily: 'inherit',
};
const labelCss = {
  display: 'block', fontSize: 11.5, fontWeight: 700,
  color: C.muted, textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 6,
};
function Field({ label, children }) {
  return <div><label style={labelCss}>{label}</label>{children}</div>;
}

/* ════════════ GÉNÉRATION PDF — document physique ════════ */
function ouvrirFichier(cm, cv, medecinNom, userContext) {
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const dateEmission  = fmtD(cm.date_emission || cv?.date);
  const repos         = cv?.duree_repos || cm.repos_prescrit || '';
  const nom           = cm.nom    || '';
  const prenom        = cm.prenom || '';
  const matricule_val = cm.matricule || '';
  const siteConfig = getSitePrintConfig(userContext, cv?.site_details || cv?.site, cv, cm);
  const footerLeft = siteConfig.footerCompanySite || 'Leoni Menzel Hayet';
  const footerRight = siteConfig.medicalServiceName || 'Service Médical';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrôle Médical</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 210mm; height: 297mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; color: #000; background: white; }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 15mm 22mm 0mm 22mm;
      position: relative;
      overflow: hidden;
    }

    .titre {
      text-align: center;
      font-size: 13.5pt;
      font-weight: bold;
      margin-bottom: 10mm;
    }

    .ligne {
      font-size: 11.5pt;
      margin-bottom: 5mm;
      line-height: 1.4;
    }
    .ligne-double {
      display: flex;
      gap: 15mm;
      font-size: 11.5pt;
      margin-bottom: 5mm;
    }

    .section-avis {
      margin-top: 8mm;
    }
    .avis-label {
      font-size: 11.5pt;
      margin-bottom: 4mm;
    }
    .avis-texte {
      font-size: 11.5pt;
      line-height: 1.7;
      white-space: pre-wrap;
      min-height: 22mm;
    }

    .cachet-zone {
      margin-top: 14mm;
      text-align: right;
      font-size: 11pt;
      padding-right: 8mm;
    }

    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      border-top: 1.5px solid #000;
      display: flex;
      justify-content: space-between;
      padding: 3mm 22mm;
      font-size: 10.5pt;
      font-weight: bold;
    }

    @media print {
      html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
      .page { width: 100%; height: 100vh; padding: 14mm 20mm 0mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="titre">Contrôle médical</div>

  <div class="ligne">Le :&nbsp;&nbsp;${dateEmission}</div>
  <div class="ligne-double">
    <span>Matricule :&nbsp;&nbsp;${matricule_val}</span>
    <span>Segment :&nbsp;&nbsp;${displayDepartementControleMedical(cm) || ''}</span>
  </div>
  <div class="ligne">Nom :&nbsp;&nbsp;${nom}</div>
  <div class="ligne">Prénom :&nbsp;&nbsp;${prenom}</div>
  <div class="ligne">Repos prescrit :&nbsp;&nbsp;${repos} jour${Number(repos) > 1 ? 's' : ''}</div>

  <div class="section-avis">
    <div class="avis-label">Avis du médecin contrôleur :</div>
    <div class="avis-texte">${cm.avis_medecin_controleur || ''}</div>
  </div>

  <div class="cachet-zone">Cachet et signature</div>

  <div class="footer">
    <span>${footerLeft}</span>
    <span>${footerRight}</span>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const w    = window.open(url, '_blank');
  if (w) { w.onload = () => { setTimeout(() => { w.print(); }, 400); }; }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ════════════ GÉNÉRATION PDF — Demande d'Expertise ════════ */


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
          <SectionLabel titre="Complétés" count={traites.length} couleur="#0d9488" />
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
  const [avis,    setAvis]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async () => {
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
      <div style={{ background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <IcoCheck c="#0d9488"/>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f766e' }}>Contre-visite enregistrée avec succès</div>
          <div style={{ fontSize: 12, color: '#0d9488', marginTop: 2 }}>Complétez le contrôle médical à envoyer au RH</div>
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
              <textarea value={avis} onChange={e => setAvis(e.target.value)}
                placeholder="Ex: Patient examiné à domicile. L'arrêt de travail est médicalement justifié..."
                rows={5} style={{ ...inputCss, resize: 'vertical', lineHeight: 1.7 }}
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </Field>
          </div>
          <button onClick={handleSubmit} disabled={!avis.trim() || loading} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 11, background: avis.trim() ? `linear-gradient(135deg,${C.dark},${C.primary})` : '#e2e8f0', color: avis.trim() ? 'white' : '#94a3b8', fontSize: 14, fontWeight: 700, cursor: avis.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'all .2s', boxShadow: avis.trim() ? `0 4px 14px rgba(2,132,199,.3)` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
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
  const [form,    setForm]    = useState({ date: today(), duree_repos: '', a_partir: today(), remarque: '' });
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const hc = (field, val) => setForm(f => ({ ...f, [field]: val }));

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

  const handleSubmitCV = async () => {
    if (!selectedSiteId) { setError('Le champ site est obligatoire.'); return; }
    if (!form.duree_repos || parseInt(form.duree_repos) < 0) { setError("La durée de repos est obligatoire."); return; }
    setError(''); setLoading(true);
    try {
      const sitePayload = Number.isNaN(Number(selectedSiteId)) ? selectedSiteId : Number(selectedSiteId);
      const itemPassageId = getItemPassageId(item);
      if (!itemPassageId) {
        setError("Impossible d'identifier le passage (item_passage). Rafraîchissez la page ou contactez l'administrateur.");
        return;
      }
      const cv = await creerContreVisite({
        item_passage: itemPassageId,
        duree_repos: payloadDureeRepos(form.duree_repos),
        a_partir: form.a_partir,
        remarque: form.remarque,
        date: form.date,
        site: sitePayload,
      });
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

  const canSubmit = form.duree_repos !== '' && !loading;
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
      <div style={{ background: `linear-gradient(135deg,${C.dark},${C.primary})`, borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: `0 4px 20px rgba(2,132,199,.25)` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Collaborateur Sélectionné</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[{ lbl: 'Matricule', val: matricule || '—' }, { lbl: 'Nom Complet', val: nom || '—' }, { lbl: 'Département', val: dept || '—' }].map(({ lbl, val }) => (
            <div key={lbl}><div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginBottom: 4 }}>{lbl}</div><div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{val}</div></div>
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
            <Field label="Date de la contre-visite *">
              <input type="date" value={form.date} onChange={e => hc('date', e.target.value)} style={inputCss}
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Field label="Durée de repos (jours) *">
              <input type="number" min="0" value={form.duree_repos} onChange={e => hc('duree_repos', e.target.value)} placeholder="Ex: 5" style={inputCss}
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </Field>
            <Field label="À partir du *">
              <input type="date" value={form.a_partir} onChange={e => hc('a_partir', e.target.value)} style={inputCss}
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </Field>
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
              <textarea value={form.remarque} onChange={e => hc('remarque', e.target.value)} placeholder="Remarque complémentaire (optionnel)..." rows={3}
                style={{ ...inputCss, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </Field>
          </div>
          <button onClick={handleSubmitCV} disabled={!canSubmit} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 11, background: canSubmit ? `linear-gradient(135deg,${C.dark},${C.primary})` : '#e2e8f0', color: canSubmit ? 'white' : '#94a3b8', fontSize: 14, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'all .2s', boxShadow: canSubmit ? `0 4px 14px rgba(2,132,199,.35)` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
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

/* ════════════ VUE 3 : SUIVI ════════════ */
function SuiviContreVisitesView({ suivi, loading, medecinNom, onDemandeExpertise }) {
  const now = new Date();
  const [filtreAnnee, setFiltreAnnee] = useState(now.getFullYear());
  const [filtreMois,  setFiltreMois]  = useState(now.getMonth() + 1);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const MOIS = [
    {n:1,lbl:'Janvier'},{n:2,lbl:'Février'},{n:3,lbl:'Mars'},{n:4,lbl:'Avril'},
    {n:5,lbl:'Mai'},{n:6,lbl:'Juin'},{n:7,lbl:'Juillet'},{n:8,lbl:'Août'},
    {n:9,lbl:'Septembre'},{n:10,lbl:'Octobre'},{n:11,lbl:'Novembre'},{n:12,lbl:'Décembre'},
  ];
  const parseDate = (str) => { if (!str) return new Date(0); const p = str.split('-'); return new Date(Number(p[0]), Number(p[1])-1, Number(p[2])); };
  const anneesDispos = [...new Set(suivi.map(cv => parseDate(cv.date).getFullYear()))].sort((a,b) => b-a);
  const filtered  = suivi.filter(cv => { const d = parseDate(cv.date); return d.getFullYear() === filtreAnnee && d.getMonth()+1 === filtreMois; });
  const sorted    = [...filtered].sort((a,b) => b.id - a.id);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const safePage   = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const pageData   = sorted.slice((safePage-1)*PAGE_SIZE, safePage*PAGE_SIZE);
  const moisLabel  = MOIS.find(m => m.n === filtreMois)?.lbl || '';

  if (loading) return (
    <div>{[1,2,3,4].map(i => (
      <div key={i} style={{ height: 52, borderRadius: 10, marginBottom: 8, background: `linear-gradient(90deg,${C.light2} 25%,${C.light} 50%,${C.light2} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}/>
    ))}</div>
  );

  const cols = ['Date','Matricule','Collaborateur','Département','Médecin','À partir du','Durée','Documents'];
  return (
    <div>
      {/* Filtres */}
      <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${C.light}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcoCalendar /><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Filtrer :</span>
        </div>
        <select value={filtreAnnee} onChange={e => { setFiltreAnnee(Number(e.target.value)); setCurrentPage(1); }}
          style={{ border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, color: C.text, background: 'white', cursor: 'pointer' }}>
          {(anneesDispos.length ? anneesDispos : [now.getFullYear()]).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {MOIS.map(({ n, lbl }) => {
            const count  = suivi.filter(cv => { const d = parseDate(cv.date); return d.getFullYear() === filtreAnnee && d.getMonth()+1 === n; }).length;
            const active = filtreMois === n;
            return (
              <button key={n} onClick={() => { setFiltreMois(n); setCurrentPage(1); }} style={{ padding: '5px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, position: 'relative', background: active ? `linear-gradient(135deg,${C.primary},${C.accent})` : (count > 0 ? C.light : '#f8fafc'), color: active ? 'white' : (count > 0 ? C.primary : '#94a3b8'), boxShadow: active ? `0 2px 8px rgba(2,132,199,.3)` : 'none' }}>
                {lbl.slice(0,3)}
                {count > 0 && !active && <span style={{ position: 'absolute', top: -5, right: -5, background: C.primary, color: 'white', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>}
              </button>
            );
          })}
        </div>
        <span style={{ background: C.light, color: C.primary, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20 }}>{sorted.length} / {suivi.length}</span>
      </div>
      {/* Tableau */}
      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ padding: '13px 18px', background: C.light2, borderBottom: `1px solid ${C.light}`, borderLeft: `4px solid ${C.primary}`, borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 9 }}>
          <IcoHistory /><span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{moisLabel} {filtreAnnee}</span>
          <span style={{ marginLeft: 'auto', background: C.light, color: C.primary, fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>{sorted.length} enreg.</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.light2 }}>
                {cols.map(h => <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `1px solid ${C.light}`, whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pageData.map((cv, idx) => {
                const rowBg = idx % 2 === 0 ? 'white' : C.light2;
                return (
                  <tr key={cv.id} style={{ background: rowBg, borderBottom: `1px solid ${C.light}`, transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.light}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                    <td style={{ padding: '11px 16px', color: '#334155', whiteSpace: 'nowrap' }}>{fmtDateShort(cv.date)}</td>
                    <td style={{ padding: '11px 16px' }}><span style={{ background: C.light, color: C.primary, padding: '2px 9px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{cv.matricule || '—'}</span></td>
                    <td style={{ padding: '11px 16px', color: C.text, fontWeight: 600 }}>{cv.nom_prenom || '—'}</td>
                    <td style={{ padding: '11px 16px', color: C.muted }}>{displayDepartementControleMedical(cv.controle_medical) || '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#334155' }}>{medecinNom ? `Dr. ${medecinNom}` : '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#334155', whiteSpace: 'nowrap' }}>{cv.a_partir ? fmtDateShort(cv.a_partir) : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ padding: '11px 16px' }}>
                      {cv.duree_repos > 0
                        ? <span style={{ background: '#fff7ed', color: '#c2410c', padding: '3px 9px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{cv.duree_repos} j</span>
                        : <span style={{ color: '#cbd5e1', fontSize: 12 }}>0 j</span>}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {cv.controle_medical ? (
                          <button onClick={() => ouvrirFichier(cv.controle_medical, cv, medecinNom, user)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', borderRadius: 7, background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: `0 2px 8px rgba(2,132,199,.25)`, transition: 'all .15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                            <IcoDownload /> Contrôle
                          </button>
                        ) : <span style={{ fontSize: 11.5, color: '#cbd5e1', fontStyle: 'italic' }}>Non généré</span>}
                        <button onClick={() => onDemandeExpertise && onDemandeExpertise(cv)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: `1.5px solid ${C.border}`, borderRadius: 7, background: 'white', color: C.primary, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.light; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                          <IcoDoc /> Expertise
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>🗓️</div>
            <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Aucune contre-visite en {moisLabel} {filtreAnnee}</p>
          </div>
        )}
        <Pagination total={sorted.length} pageSize={PAGE_SIZE} currentPage={safePage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

/* ════════════ FILE D'ATTENTE ════════════ */
function FileAttenteControleur({ items, selectedItemId, onSelect, onCreerContreVisite, loading }) {
  const enAttente   = items.filter(i => i.statut === 'EN_ATTENTE');
  const traites     = items.filter(i => i.statut === 'EFFECTUEE');
  const getInitials = (nom) => (nom || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'white', borderRadius: 16, border: `1px solid ${C.light}`, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.light}`, flexShrink: 0, background: C.light2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>Liste du jour</span>
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
                    <button onClick={() => onCreerContreVisite(item)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', border: 'none', borderRadius: 8, background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 6px rgba(2,132,199,.3)`, transition: 'all .15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                      <IcoPlus /> Créer Contre-Visite
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
                <div key={item.id} onClick={() => onSelect(item)} style={{ padding: '10px 12px', borderRadius: 12, marginBottom: 6, cursor: 'pointer', background: C.light2, border: `1px solid ${C.light}`, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 9, transition: 'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, fontSize: 13 }}>✓</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>{getMatricule(item)}</div>
                  </div>
                  <span style={{ fontSize: 10, background: '#f0fdf9', color: '#0d9488', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>✓</span>
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

/* ════════════ DASHBOARD PRINCIPAL ════════════ */
export default function DashboardMedecinControleur() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [vue,              setVue]              = useState('liste');
  const [showExpertise,    setShowExpertise]    = useState(false);
  const [listes,      setListes]      = useState([]);
  const [itemSel,     setItemSel]     = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [loadListes,  setLoadListes]  = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [suivi,       setSuivi]       = useState([]);
  const [loadSuivi,   setLoadSuivi]   = useState(false);

  const medecinNom = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}` : user?.username || '';

  const fetchListes = useCallback(async () => {
    setGlobalError(''); setLoadListes(true);
    try { const data = await getMesListesContreVisite(); setListes(data); }
    catch { setGlobalError('Impossible de charger les listes.'); }
    finally { setLoadListes(false); }
  }, []);

  const fetchSuivi = useCallback(async () => {
    setLoadSuivi(true);
    try { const data = await getContreVisites(); setSuivi(Array.isArray(data) ? data : (data.results || [])); }
    catch { setSuivi([]); }
    finally { setLoadSuivi(false); }
  }, []);

  useEffect(() => { fetchListes(); }, [fetchListes]);
  useEffect(() => { if (vue === 'suivi') fetchSuivi(); }, [vue, fetchSuivi]);

  const allItems       = flatMapListesContreVisiteItemsOrdered(listes);
  const totalEnAttente = allItems.filter(i => i.statut === 'EN_ATTENTE').length;
  const totalTraites   = allItems.filter(i => i.statut === 'EFFECTUEE').length;

  const handleCreer   = (item) => { setItemSel(item); setShowForm(true); setVue('liste'); };
  const handleSelect  = (item) => { setItemSel(item); setShowForm(false); };
  const handleUpdateItem = (updatedItem) => {
    if (!updatedItem?.id) return;
    setItemSel(updatedItem);
    setListes((prev) => prev.map((l) => ({
      ...l,
      items: (l.items || []).map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i)),
    })));
  };
  const handleSuccess = ({ cv, cm, item: updatedItem, partial }) => {
    setListes(prev => prev.map(l => ({ ...l, items: (l.items||[]).map(i => i.id === updatedItem.id ? { ...i, statut: 'EFFECTUEE', contre_visite: cv } : i) })));
    if (!partial && cm) { setSuivi(prev => [{ ...cv, controle_medical: cm }, ...prev]); setShowForm(false); setVue('suivi'); }
  };

  const today_label  = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: C.light2 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button, input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* ── SIDEBAR bleu ciel ── */}
      <aside style={{ width: 256, minWidth: 256, background: `linear-gradient(180deg,${C.dark} 0%,#075985 100%)`, display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid rgba(255,255,255,.08)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '22px 18px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoClipboard c="white"/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>MedDigital</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>Médecin Contrôleur</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 10px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10, paddingLeft: 10 }}>Navigation</div>
          {[
            { key: 'liste',     label: 'Ma Liste du Jour',       ico: <IcoClipboard c={vue==='liste'?'white':'rgba(255,255,255,.45)'}/> },
            { key: 'suivi',     label: 'Suivi Contre-Visites',  ico: <IcoChart     c={vue==='suivi'?'white':'rgba(255,255,255,.45)'}/> },
            { key: 'expertise', label: "Demandes d'Expertise",  ico: <IcoExpertise c={vue==='expertise'?'white':'rgba(255,255,255,.45)'}/> },
          ].map(({ key, label, ico }) => {
            const isActive = vue === key;
            return (
              <button key={key} onClick={() => { setVue(key); setShowForm(false); }} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 13px', borderRadius: 11, marginBottom: 4, background: isActive ? 'rgba(255,255,255,.15)' : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,.45)', fontSize: 13.5, fontWeight: 700, border: isActive ? '1px solid rgba(255,255,255,.2)' : '1px solid transparent', cursor: 'pointer', transition: 'all .15s', textAlign: 'left' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'white'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.45)'; }}}>
                {ico}{label}
              </button>
            );
          })}
        </nav>

        {/* Stats */}
        <div style={{ padding: '14px', margin: '0 10px 10px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Aujourd'hui</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {[{ val: allItems.length, lbl: 'Total', color: 'rgba(255,255,255,.7)' }, { val: totalEnAttente, lbl: 'Attente', color: '#fbbf24' }, { val: totalTraites, lbl: 'Traités', color: '#34d399' }].map(s => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actualiser */}
        <div style={{ padding: '0 10px 10px' }}>
          <button onClick={fetchListes} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: 'rgba(255,255,255,.45)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.45)'; }}>
            <IcoRefresh c="rgba(255,255,255,.45)"/> Actualiser
          </button>
        </div>

        {/* User */}
        <div style={{ padding: '12px 14px 18px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoUser c="white"/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dr. {medecinNom || user?.username}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Médecin Contrôleur</div>
          </div>
          <button onClick={handleLogout} title="Déconnexion" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; }}>
            <IcoLogout c="rgba(255,255,255,.4)"/>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '28px 32px 24px' }}>
        <div style={{ marginBottom: 22, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, letterSpacing: -0.4 }}>
              {vue === 'suivi' ? 'Suivi Contre-Visites' : vue === 'expertise' ? "Demandes d'Expertise" : 'Contre-Visites du jour'}
            </h1>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 3, textTransform: 'capitalize' }}>{today_label}</p>
          </div>
          {vue === 'liste' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ background: totalEnAttente > 0 ? '#fff7ed' : C.light, color: totalEnAttente > 0 ? '#c2410c' : C.primary, border: `1px solid ${totalEnAttente > 0 ? '#fed7aa' : C.border}`, fontSize: 12.5, fontWeight: 700, padding: '6px 14px', borderRadius: 20 }}>
                {totalEnAttente} en attente
              </span>
              <span style={{ background: '#f0fdf9', color: '#0d9488', border: '1px solid #99f6e4', fontSize: 12.5, fontWeight: 700, padding: '6px 14px', borderRadius: 20 }}>
                {totalTraites} traités
              </span>
            </div>
          )}
        </div>

        {globalError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 12, fontSize: 13.5, marginBottom: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {globalError}
            <button onClick={fetchListes} style={{ padding: '5px 14px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Réessayer</button>
          </div>
        )}

        {vue === 'suivi' && (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <SuiviContreVisitesView suivi={suivi} loading={loadSuivi} medecinNom={medecinNom}
              onDemandeExpertise={(cv) => { const parts=(cv.nom_prenom||'').trim().split(' '); ouvrirDemandeExpertise({ dr:'', date_demande: cv.date||new Date().toISOString().split('T')[0], collaborateur_nom: parts.slice(1).join(' '), collaborateur_prenom: parts[0]||'', collaborateur_matricule: cv.matricule||'', pieces_jointes:'', poste: displayDepartementControleMedical(cv.controle_medical)||'', autres_missions:'' }, medecinNom); }}/>
          </div>
        )}

        {vue === 'expertise' && (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {showExpertise ? (
              <FormulaireDemandeExpertise medecinNom={medecinNom}
                onClose={() => setShowExpertise(false)}/>
            ) : (
              <DemandesExpertiseView medecinNom={medecinNom}
                onNouvelleExpertise={() => setShowExpertise(true)}/>
            )}
          </div>
        )}


        {vue === 'liste' && (
          <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 20, flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <FileAttenteControleur items={allItems} selectedItemId={itemSel?.id ?? null} onSelect={handleSelect} onCreerContreVisite={handleCreer} loading={loadListes} />
            <div style={{ overflowY: 'auto', minHeight: 0 }}>
              {showForm && itemSel
                ? <FormulaireView item={itemSel} medecinNom={medecinNom} onRetour={() => setShowForm(false)} onSuccess={handleSuccess} />
                : itemSel
                  ? <FormulaireContreVisite item={itemSel} onUpdateItem={handleUpdateItem} medecinNom={medecinNom} />
                  : <PanneauVide />
              }
            </div>
          </div>
        )}
      </main>
    </div>
  );
}