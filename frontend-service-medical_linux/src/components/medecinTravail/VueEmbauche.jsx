// src/components/medecinTravail/VueEmbauche.jsx  — REDESIGN bleu ciel
import { useState, useEffect, useCallback, useRef, useMemo, createElement } from 'react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import {
  getDossierByMatricule, creerDossierMedical, modifierDossierMedical,
  creerFicheAptitude, getFicheAptitude, modifierFicheAptitude, patchFicheAptitude,
  rattacherFicheAuCandidat, ajouterObservationsCandidat,
  getListesEmbaucheAssignees, getCandidatsEmbauche,
  creerCertificat,
  modifierCertificat,
  getCertificatParFiche,
} from '../../api/Medicalworkapi';
import { notifierSmsJourJCandidatEmbauche } from '../../api/embaucheApi';
import { formatAxiosError } from '../../api/apiErrorUtils';
import {
  getListesVisitesPeriodiquesPourMedecin,
  getLignesListePeriodique,
  rattacherFicheLignePeriodique,
  filterListesPourMedecinJour,
} from '../../api/visitesPeriodiquesApi';
import {
  getListesSurveillanceSpeciale,
  getLignesSurveillanceSpeciale,
  getLigneSurveillanceSpecialeById,
  terminerTraitementLigneSurveillanceSpeciale,
  notifierJourJLigneSurveillanceSpeciale,
} from '../../api/surveillanceSpecialeApi';
import { enrichLigneVisitePeriodique, sortLignesVisitePeriodique } from '../../utils/ligneVisitePeriodique';
import { enrichLigneSurveillancePourMedecin } from '../../utils/ligneSurveillanceSpecialeMedecin';
import { isSmsJourJEnvoye, isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';
import { SmsVeilleBadge } from '../contreVisite/SmsContreVisiteBadges';
import { afficherReferenceListeVisitePeriodique } from '../../utils/referenceListeVisitePeriodique';
import PrintFicheAptitudeRouter from './PrintFicheAptitudeRouter';
import PrintFicheSurveillanceMateur from './PrintFicheSurveillanceMateur';
import TabBilan from './Tabbilan';
import TabExamen from './Tabexamen';
import TabCertificat from './Tabcertificat';
import TabOrdonnance from './TabOrdonnance';
import TabFicheLiaison from './TabFicheLiaison';
import TabFiche from './Tabfiche';
import TabCertificatMateur from './TabCertificatMateur';
import EmbaucheMateurEtape2 from './EmbaucheMateurEtape2';
import PrintCertificatRouter from './PrintCertificatRouter';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { pickCnssCollaborateur } from '../../utils/cnssEmbauche';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave, PRIMARY_ACTION_GRADIENT, PRIMARY_ACTION_SHADOW } from './primaryActionButtonStyle';
import { deriveMessadineCertificatChoice } from '../../utils/messadineAptitudeCert';
import { getSite } from '../../api/sitesApi';
import { getUserSiteId } from '../../utils/siteAccessControl';
import { getCollaborateurById as getCollaborateurRhById } from '../../api/actInfirmierApi';
import { signalVpPeriodiqueExamenRh } from '../../utils/vpAlertsRhFilter';
import { padMateurExamRows } from '../../utils/mateurExamUlterieurs';
import { makeEmptyEmbaucheMateurCert, buildMateurCertificatDescriptionForApi } from '../../utils/mateurEmbaucheCertPayload';

/* ─── Palette bleu ciel ───────────────────────────── */
const SKY = {
  50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd',
  300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9',
  600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e',
};

/* ─── Choices aptitude ───────────────────────────────── */
const APTITUDE_CHOICES = [
  { val: 'APTE_AU_POSTE',               label: 'Apte au poste',               color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  { val: 'APTE_AMENAGEMENT_POSTE',      label: 'Apte avec aménagement',        color: SKY[700],  bg: SKY[50],  border: SKY[200] },
  { val: 'INAPTE_TEMPORAIRE',           label: 'Inapte temporaire',            color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { val: 'INAPTE_DEFINITIF_MEME_POSTE', label: 'Inapte définitif même poste',  color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  { val: 'INAPTE_DEFINITIF_ENTREPRISE', label: 'Inapte définitif entreprise',  color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' },
];

const ETAT_CFG = {
  EN_ATTENTE: { bg: SKY[50], color: SKY[500], text: 'En attente' },
  APTE:       { bg: '#dcfce7', color: '#15803d', text: 'Apte ✓' },
  INAPTE:     { bg: '#fef2f2', color: '#b91c1c', text: 'Inapte' },
};

const MESSADINE_APT_RESUME = {
  APTITUDE: { label: 'Aptitude', bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  REPRISE_MO_AT: { label: 'Reprise MO-AT', bg: '#fffbeb', color: '#a16207', border: '#fde68a' },
  APTITUDE_TEMPORAIRE: { label: 'Aptitude temporaire', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

/** Aligné sur Nouvellefiche.jsx — styles des cartes Messadine */
const APT_STYLE = {
  g: { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0', selBg: '#dcfce7', selBorder: '#6ee7b7', dot: '#10b981' },
  a: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', selBg: '#fef3c7', selBorder: '#fbbf24', dot: '#f59e0b' },
  r: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', selBg: '#fee2e2', selBorder: '#f87171', dot: '#f87171' },
};

function precisionAptitudeFromFiche(fiche) {
  const p = fiche?.precision_aptitude;
  if (p != null && String(p).trim() !== '') return String(p).trim();
  const dr = fiche?.date_reprise;
  if (!dr) return '';
  try {
    const d = new Date(dr);
    if (Number.isNaN(d.getTime())) return String(dr).trim();
    return d.toISOString().split('T')[0];
  } catch {
    return String(dr).trim();
  }
}

/** Texte « précision » Messadine (certificat ligne sous le poste) — sans mélanger la date de durée Aptitude. */
function messadinePrecisionTextFromFicheForForm(fiche) {
  const p = fiche?.precision_aptitude;
  if (p != null && String(p).trim() !== '') return String(p).trim();
  if (deriveMessadineCertificatChoice(fiche) === 'REPRISE_MO_AT') {
    const dr = fiche?.date_reprise;
    if (!dr) return '';
    return String(dr).trim();
  }
  return '';
}

/** Messadine : « et ce pour une durée de » (Aptitude seule) — stockée en `duree_aptitude` côté API. */
function messadineDureeAptitudeDateFromFiche(fiche) {
  if (deriveMessadineCertificatChoice(fiche) !== 'APTITUDE') return '';
  const v = fiche?.duree_aptitude != null ? String(fiche.duree_aptitude).trim() : '';
  return v;
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const TODAY_STR = new Date().toISOString().split('T')[0];

/** Aligné sur les pastilles liste : SMS peut marquer « examiné » via traitement_termine sans nested fiche_aptitude. */
function isLigneExamineePourMedecin(c, listVariant) {
  if (listVariant === 'surveillance-speciale') {
    return !!(
      c.fiche_aptitude
      || c.traitement_termine === true
      || c.traitement_fini === true
      || c.traitement_termine === 'true'
      || c.traitement_fini === 'true'
    );
  }
  return !!c.fiche_aptitude;
}

function embaucheListePermetSmsJourJManuel(statut) {
  return ['SOUMISE', 'EN_TRAITEMENT', 'CLOTUREE'].includes(statut);
}

/* ─── Styles ──────────────────────────────────────── */
const inpSx = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: `1.5px solid ${SKY[200]}`, fontSize: 13, color: '#0f172a',
  background: 'white', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color .15s, box-shadow .15s',
};
const roInpSx = { ...inpSx, background: SKY[50], color: '#475569', border: `1.5px solid ${SKY[100]}`, cursor: 'default' };
const lblSx = { display: 'block', fontSize: 10.5, fontWeight: 700, color: SKY[700], textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 };

function FocusInput({ style, ...props }) {
  const [f, setF] = useState(false);
  return <input {...props} style={{ ...style, borderColor: f ? SKY[400] : style?.borderColor, boxShadow: f ? `0 0 0 3px ${SKY[100]}` : 'none' }} onFocus={() => setF(true)} onBlur={() => setF(false)} />;
}
function FocusSelect({ style, children, ...props }) {
  const [f, setF] = useState(false);
  return <select {...props} style={{ ...style, borderColor: f ? SKY[400] : style?.borderColor, boxShadow: f ? `0 0 0 3px ${SKY[100]}` : 'none' }} onFocus={() => setF(true)} onBlur={() => setF(false)}>{children}</select>;
}
function FocusTextarea({ style, ...props }) {
  const [f, setF] = useState(false);
  return <textarea {...props} style={{ ...style, borderColor: f ? SKY[400] : style?.borderColor, boxShadow: f ? `0 0 0 3px ${SKY[100]}` : 'none' }} onFocus={() => setF(true)} onBlur={() => setF(false)} />;
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, color: SKY[700],
      textTransform: 'uppercase', letterSpacing: .8,
      marginBottom: 10, paddingBottom: 7,
      borderBottom: `2px solid ${SKY[100]}`,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 3, height: 14, borderRadius: 3, background: `linear-gradient(${SKY[400]}, ${SKY[700]})` }} />
      {children}
    </div>
  );
}

/* Icônes onglets — même jeu que Detailfiche (Messadine, listes du jour) */
const VeIcoFiche = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const VeIcoBilan = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5a2 2 0 00-2 2v3a2 2 0 002 2h4m0-5h6m0 0v5a2 2 0 002 2h2" />
    <circle cx="16" cy="16" r="2" />
  </svg>
);
const VeIcoExam = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const VeIcoOrd = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);
const VeIcoLiaison = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="17 2 22 7 12 17 7 17 7 12 17 2" />
  </svg>
);
const VeIcoCert = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const MESSADINE_LISTE_JOUR_ONGLETS = [
  { id: 'fiche', label: 'Fiche', Icon: VeIcoFiche },
  { id: 'bilan', label: 'Bilan biologique', Icon: VeIcoBilan },
  { id: 'examen', label: 'Examens complémentaires', Icon: VeIcoExam },
  { id: 'ordonnance', label: 'Ordonnance', Icon: VeIcoOrd },
  { id: 'liaison', label: 'Fiche de liaison', Icon: VeIcoLiaison },
];

const MENZEL_LISTE_JOUR_ONGLETS = [
  { id: 'fiche', label: 'Fiche', Icon: VeIcoFiche },
  { id: 'bilan', label: 'Bilan biologique', Icon: VeIcoBilan },
  { id: 'examen', label: 'Examens complémentaires', Icon: VeIcoExam },
  { id: 'certificat', label: "Certificat d'aptitude", Icon: VeIcoCert },
];

function CheckBoxItem({ label, checked, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 11px', borderRadius: 9, cursor: 'pointer', userSelect: 'none',
      background: checked ? SKY[50] : '#f8fafc',
      border: `1.5px solid ${checked ? SKY[300] : '#e2e8f0'}`,
      transition: 'all .13s',
    }}>
      <div style={{
        width: 15, height: 15, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? SKY[500] : '#cbd5e1'}`,
        background: checked ? SKY[500] : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
      </div>
      <span style={{ fontSize: 12.5, color: checked ? SKY[700] : '#64748b', fontWeight: checked ? 700 : 500 }}>{label}</span>
    </div>
  );
}

/* ── Badges ──────────────────────────────────────────── */
function PresenceBadge({ presence }) {
  const cfg = presence === 'PRESENT' ? { bg: '#dcfce7', color: '#15803d', text: 'Présent' }
    : presence === 'ABSENT' ? { bg: '#fee2e2', color: '#b91c1c', text: 'Absent' }
    : { bg: SKY[50], color: SKY[600], text: 'En attente' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
      {cfg.text}
    </span>
  );
}

/* ══ Colonne gauche : liste candidats ══════════════════ */
function ListeCandidats({
  listes, selectedListe, onSelectListe, candidats, selectedCandidat, onSelectCandidat, loadCands, loading,
  listVariant = 'embauche',
  onSmsJourJEmbauche,
  smsJourJBusyId,
  onSmsJourJSurveillance,
  smsSurveillanceBusyId,
}) {
  const isPeriodique = listVariant === 'periodique';
  const isSurveillance = listVariant === 'surveillance-speciale';
  const isVpLike = isPeriodique || isSurveillance;
  const today = new Date().toISOString().split('T')[0];

  const refListe = (l) => {
    if (!l) return '';
    if (isSurveillance) return l.reference || `Liste #${l.id}`;
    return afficherReferenceListeVisitePeriodique(l);
  };

  const getInitials = c => `${c.nom?.[0] || ''}${c.prenom?.[0] || ''}`.toUpperCase();

  if (loading) {
    return (
      <div style={{ width: 280, minWidth: 280, background: 'white', borderRadius: 16, border: `1.5px solid ${SKY[100]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 28, height: 28, border: `3px solid ${SKY[100]}`, borderTopColor: SKY[500], borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <div style={{ fontSize: 12, color: SKY[400] }}>Chargement…</div>
      </div>
    );
  }

  if (!selectedListe) {
    return (
      <div style={{ width: 280, minWidth: 280, background: 'white', borderRadius: 16, border: `1.5px solid ${SKY[100]}`, boxShadow: `0 4px 16px ${SKY[100]}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header — dégradé ciel clair comme sidebar */}
        <div style={{
          padding: '0 0 0',
          background: 'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 50%, #7dd3fc 100%)',
          borderRadius: '16px 16px 0 0', flexShrink: 0,
          borderBottom: '1px solid #bae6fd', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.25)', pointerEvents: 'none' }} />
          <div style={{ padding: '16px 16px 14px', position: 'relative' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0c4a6e' }}>{isSurveillance ? 'Surveillance médicale spéciale' : isPeriodique ? 'Visites périodiques' : "Listes d'embauche"}</div>
            <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 600, marginTop: 2 }}>{listes.length} liste(s) {isSurveillance ? 'assignée(s)' : isPeriodique ? 'assignée(s) (hors embauche)' : 'assignée(s)'}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {listes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Aucune liste assignée
            </div>
          ) : listes.map(l => {
            const isToday = l.date_visite === today;
            return (
              <div key={l.id} onClick={() => onSelectListe(l)}
                style={{
                  background: isToday ? SKY[50] : '#f8fafc',
                  border: `1.5px solid ${isToday ? SKY[300] : '#e2e8f0'}`,
                  borderRadius: 12, padding: '12px 13px', cursor: 'pointer', transition: 'all .15s',
                  boxShadow: isToday ? `0 2px 8px ${SKY[100]}` : 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = SKY[300]; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isToday ? SKY[300] : '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: SKY[800] }}>
                    {refListe(l)}
                  </div>
                  {isToday && <span style={{ background: SKY[500], color: 'white', fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Aujourd'hui</span>}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {fmtDate(l.date_visite)} · {l.nombre_lignes ?? l.nombre_candidats ?? 0} {isVpLike ? 'collaborateur(s)' : 'candidat(s)'}
                  {isSmsVeilleEnvoye(l) && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#ecfdf5', color: '#15803d', border: '1px solid #bbf7d0' }} title="Rappel SMS veille (J−1)">SMS veille</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const done = candidats.filter((c) => isLigneExamineePourMedecin(c, listVariant)).length;
  const progress = candidats.length > 0 ? Math.round(done / candidats.length * 100) : 0;

  return (
    <div style={{ width: 280, minWidth: 280, background: 'white', borderRadius: 16, border: `1.5px solid ${SKY[100]}`, boxShadow: `0 4px 16px ${SKY[100]}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header liste sélectionnée — dégradé ciel clair */}
      <div style={{
        background: 'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 50%, #7dd3fc 100%)',
        borderRadius: '16px 16px 0 0', flexShrink: 0, padding: '14px 15px 12px',
        borderBottom: '1px solid #bae6fd', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.3)', pointerEvents: 'none' }} />
        <button onClick={() => onSelectListe(null)}
          style={{ background: 'rgba(2,132,199,.12)', border: '1px solid rgba(2,132,199,.25)', cursor: 'pointer', color: '#0369a1', fontSize: 11.5, fontFamily: 'inherit', padding: '3px 10px', borderRadius: 8, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
          ← Retour
        </button>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0c4a6e' }}>
          {refListe(selectedListe)}
        </div>
        <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 600, marginTop: 2 }}>
          {candidats.length} {isVpLike ? `collaborateur${candidats.length !== 1 ? 's' : ''}` : `candidat${candidats.length !== 1 ? 's' : ''}`} · {fmtDate(selectedListe.date_visite)}
        </div>
        <div style={{ marginTop: 8 }}>
          <SmsVeilleBadge liste={selectedListe} />
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, color: '#0369a1', fontWeight: 600 }}>Progression</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0c4a6e' }}>{done}/{candidats.length} examinés</span>
          </div>
          <div style={{ height: 5, background: 'rgba(2,132,199,.15)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#0284c7)', borderRadius: 4, transition: 'width .4s ease' }} />
          </div>
        </div>
      </div>

      {/* Liste candidats */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 9, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {loadCands ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, flexDirection: 'column', gap: 10 }}>
            <div style={{ width: 24, height: 24, border: `3px solid ${SKY[100]}`, borderTopColor: SKY[500], borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <div style={{ fontSize: 12, color: SKY[400] }}>{isVpLike ? 'Chargement collaborateurs…' : 'Chargement candidats…'}</div>
          </div>
        ) : candidats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
            {isVpLike ? 'Aucun collaborateur' : 'Aucun candidat'}
          </div>
        ) : candidats.map((c, idx) => {
          const isSelected = selectedCandidat?.id === c.id;
          const isDone = isLigneExamineePourMedecin(c, listVariant);
          const isAbsent = c.presence === 'ABSENT';
          const etatCfg = ETAT_CFG[c.etat_embauche] || ETAT_CFG.EN_ATTENTE;
          const AVATAR_COLORS = [
            `linear-gradient(135deg,${SKY[500]},${SKY[700]})`,
            `linear-gradient(135deg,${SKY[400]},${SKY[600]})`,
            `linear-gradient(135deg,#0ea5e9,#0284c7)`,
            `linear-gradient(135deg,${SKY[600]},${SKY[800]})`,
            `linear-gradient(135deg,#38bdf8,#0369a1)`,
          ];
          const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];

          return (
            <div key={c.id} onClick={() => !isAbsent && onSelectCandidat(c)}
              style={{
                background: isSelected ? SKY[50] : isAbsent ? '#fafafa' : '#f8fafc',
                border: `1.5px solid ${isSelected ? SKY[300] : '#e2e8f0'}`,
                borderRadius: 12, padding: '10px 12px',
                cursor: isAbsent ? 'not-allowed' : 'pointer',
                transition: 'all .15s', opacity: isAbsent ? .6 : 1,
                boxShadow: isSelected ? `0 0 0 3px ${SKY[100]}` : 'none',
              }}
              onMouseEnter={e => { if (!isSelected && !isAbsent) { e.currentTarget.style.borderColor = SKY[200]; e.currentTarget.style.background = 'white'; }}}
              onMouseLeave={e => { if (!isSelected && !isAbsent) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: avatarBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 11, fontWeight: 800,
                  position: 'relative',
                }}>
                  {`${c.nom?.[0] || ''}${c.prenom?.[0] || ''}`.toUpperCase()}
                  {isDone && (
                    <div style={{
                      position: 'absolute', bottom: -3, right: -3, width: 13, height: 13,
                      borderRadius: '50%', background: '#10b981', border: '2px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width={7} height={7} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? SKY[800] : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.nom} {c.prenom}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>{c.matricule || '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <PresenceBadge presence={c.presence} />
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isDone ? '#dcfce7' : etatCfg.bg, color: isDone ? '#15803d' : etatCfg.color }}>
                  {isDone ? '✓ Examiné' : etatCfg.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Brouillon panneau examen (même onglet / autre page) — clé par mode + id ligne */
const PANEL_DRAFT_STORAGE = 'pfe-ve-panneau-draft-v1';
function panelDraftStorageKey(mode, candidatId) {
  return `${PANEL_DRAFT_STORAGE}:${mode}:${candidatId}`;
}

/** Clé stable : Embauche peut recharger des lignes avec id différent → utiliser matricule si possible. */
function panelDraftKeyForCandidat(mode, candidat) {
  if (!candidat) return null;
  if (mode === 'embauche') {
    const m = String(candidat.matricule || '').trim();
    if (m) return `matricule:${m}`;
  }
  return String(candidat.id);
}

// SMS Mateur: brouillon dédié (en plus du snapshot global) pour éviter toute perte de saisie
// si l'hydratation async n'est pas terminée ou si le snapshot est invalidé.
const SMS_MATEUR_DRAFT_STORAGE = 'pfe-sms-mateur-form-v1';
function smsMateurDraftStorageKey(mode, candidatId) {
  return `${SMS_MATEUR_DRAFT_STORAGE}:${mode}:${candidatId}`;
}

/** Si absent en localStorage, copie depuis l'ancien sessionStorage (migration ponctuelle). */
function readLocalOrMigrateSession(key) {
  try {
    let raw = localStorage.getItem(key);
    if (raw) return raw;
    const legacy = sessionStorage.getItem(key);
    if (!legacy) return null;
    localStorage.setItem(key, legacy);
    sessionStorage.removeItem(key);
    return legacy;
  } catch {
    return null;
  }
}
function isUsablePanelDraft(payload, candidat, mode) {
  if (!payload || payload.version !== 1) return false;
  // Ne pas utiliser Number() : certaines lignes (VP/SMS) peuvent avoir un id non numérique (UUID) → NaN.
  if (payload.mode !== mode || String(payload.candidatId) !== String(candidat.id)) return false;
  // Embauche : le matricule est stable (candidat RH) → garde-fou utile.
  // VP/SMS : le matricule peut être absent / enrichi après coup / formaté différemment → ne pas invalider le brouillon.
  if (mode === 'embauche') {
    const pm = String(payload.matricule || '').trim();
    const cm = String(candidat.matricule || '').trim();
    if (pm && cm && pm !== cm) return false;
  }
  return true;
}

function tryParseJson(value) {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Extrait le bloc `__sms_mateur_v1` depuis observations_complementaires (chaîne JSON ou objet API). */
function parseSmsMateurPayloadFromObservations(raw) {
  if (raw == null || raw === '') return null;
  let obj = null;
  if (typeof raw === 'string') {
    obj = tryParseJson(raw);
    if (typeof obj === 'string') obj = tryParseJson(obj);
  } else if (typeof raw === 'object') {
    obj = raw;
  }
  if (!obj || typeof obj !== 'object') return null;
  const sms = obj.__sms_mateur_v1;
  if (!sms || typeof sms !== 'object') return null;
  return sms;
}

/** Données formulaire SMS Mateur : `__sms_mateur_v1` dans observations ou champ serializer `sms_mateur_payload`. */
function pickSmsMateurPayloadFromFiche(fiche) {
  const fromObs = parseSmsMateurPayloadFromObservations(fiche?.observations_complementaires);
  if (fromObs && typeof fromObs === 'object') return fromObs;
  const raw = fiche?.sms_mateur_payload;
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    const p = tryParseJson(raw);
    return p && typeof p === 'object' ? p : null;
  }
  return null;
}

function makeEmptySmsMateurForm() {
  return {
    motifs: {
      moins18: false,
      enceinte_allaitante: false,
      handicape: false,
      travaux_risques_accidents: false,
      maladie_chronique: false,
      travaux_maladies_professionnelles: false,
    },
    poste_caracteristiques: '',
    poste_ergonomie: '',
    tache_habituelle: '',
    risques_accidents: '',
    tableaux_mp_et_agents: '',
    evaluation_exposition: '',
    surveillance_rows: Array.from({ length: 8 }).map(() => ({
      date_examen: '',
      nature_examen: '',
      resultats: '',
      medecin_signature: '',
    })),
    mesures_prevention: '',
  };
}

/** Persistance sélection (liste + ligne) quand on navigue ailleurs puis on revient. */
const PANEL_SELECTION_STORAGE = 'pfe-ve-panneau-selection-v1';
function panelSelectionStorageKey(mode) {
  return `${PANEL_SELECTION_STORAGE}:${mode}`;
}
function readPanelSelection(mode) {
  try {
    const raw = sessionStorage.getItem(panelSelectionStorageKey(mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || parsed.mode !== mode) return null;
    return parsed;
  } catch {
    return null;
  }
}
function writePanelSelection(mode, { selectedListeId, selectedCandidatId } = {}) {
  try {
    sessionStorage.setItem(
      panelSelectionStorageKey(mode),
      JSON.stringify({
        version: 1,
        mode,
        selectedListeId: selectedListeId ?? null,
        selectedCandidatId: selectedCandidatId ?? null,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    /* ignore */
  }
}

/* ══ Panneau droit ════════════════════════════════════ */
function PanneauExamen({ candidat, onDone, mode = 'embauche' }) {
  const { user } = useAuth();
  const isPeriodique = mode === 'periodique';
  const isSurveillanceSpeciale = mode === 'surveillance-speciale';
  const isVpFlow = isPeriodique || isSurveillanceSpeciale;
  const siteConfigMedecin = getSitePrintConfig(user);
  const templateBranch = resolveSiteTemplateFromSources(user, siteConfigMedecin);
  const isMessadineTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE;
  const isMaturTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MATEUR;
  const isMenzelTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MENZEL;
  // SMS Mateur : après sauvegarde du formulaire SMS, on ajoute une étape de choix
  // (fiche d'aptitude vs certificat) avant la finalisation.
  const isSmsDocChoiceFlow = isSurveillanceSpeciale && isMaturTemplate;
  /** VP périodique + site Mateur : même parcours 4 étapes que la liste SMS (Fiche SMS → Choix document → Finalisation). */
  const isVpMateurDocChoiceFlow = isPeriodique && isMaturTemplate;
  const isMateurDocChoiceFlow = isSmsDocChoiceFlow || isVpMateurDocChoiceFlow;
  // SMS Messadine : ajouter une étape "Documents" (ordonnance / liaison / bilan / examen) avant finalisation.
  const isSmsMessadineDocsFlow = isSurveillanceSpeciale && isMessadineTemplate && !isMaturTemplate;
  // Embauche Messadine : ajouter une étape "Documents" (bilan / examen / ordonnance / liaison) avant finalisation.
  const isEmbaucheMessadineDocsFlow = mode === 'embauche' && isMessadineTemplate && !isMaturTemplate && !isVpFlow;
  // Embauche Menzel : ajouter une étape "Documents" (bilan / examen / certificat) avant finalisation.
  const isEmbaucheMenzelDocsFlow = mode === 'embauche' && isMenzelTemplate && !isMessadineTemplate && !isMaturTemplate && !isVpFlow;
  /** Liste d'embauche — même parcours Mateur que « Nouvelle fiche » (document + grille / certificat). */
  const isEmbaucheMateurFlow = isMaturTemplate && mode === 'embauche' && !isVpFlow;
  // Embauche Mateur : étape 3 = choix (créer certificat ou non), étape 4 = finalisation.
  const isEmbaucheDocChoiceFlow = isEmbaucheMateurFlow;
  // VP (SMS + Périodique) — Menzel Hayet : ajouter une étape "Documents" avant finalisation.
  const isVpMenzelDocsFlow = isVpFlow && isMenzelTemplate && !isMessadineTemplate && !isMaturTemplate;
  /** VP périodique Messadine : même étape Documents (bilan, examens, ordonnance, liaison) que la liste SMS. */
  const isVpMessadineDocsFlow = isPeriodique && isMessadineTemplate && !isMaturTemplate;
  const finalEtape = isMateurDocChoiceFlow ? 4
    : isEmbaucheDocChoiceFlow ? 4
      : isSmsMessadineDocsFlow ? 4
        : isEmbaucheMessadineDocsFlow ? 4
          : isEmbaucheMenzelDocsFlow ? 4
            : isVpMenzelDocsFlow ? 4
              : isVpMessadineDocsFlow ? 4
                : 3;
  const hideEntrepriseBlockMessadine = isMessadineTemplate;
  const [etape, setEtape] = useState(1);
  const [embaucheWantsCert, setEmbaucheWantsCert] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [ficheCreee, setFicheCreee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDossier, setLoadingDossier] = useState(true);
  const [err, setErr] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [modeModif, setModeModif] = useState(false);
  const dossierCacheRef = useRef({});
  const panelDraftsRef = useRef({});
  /** Quand égal à `${mode}:${id}`, les données affichées correspondent à cette ligne — autorise la sauvegarde brouillon */
  const panelHydratedKeyRef = useRef('');
  /** Après restauration brouillon VP/SMS : un tour sans réinitialiser collabDb ni refaire le fetch RH */
  const suppressVpCollabFetchOnceRef = useRef(false);
  const [collabDb, setCollabDb] = useState(null);
  const [collabDbLoading, setCollabDbLoading] = useState(false);
  const [collabDbErr, setCollabDbErr] = useState('');

  const [dForm, setDForm] = useState({
    nom: '', prenom: '', matricule_ref: '',
    date_naissance: '', lieu_naissance: '', adresse: '', groupe_sanguin: '',
    antecedents_medicaux: '', antecedents_chirurgicaux: '',
    antecedents_gyneco: '', antecedents_familiaux: '',
    vaccin_tuberculose: '', vaccin_tetanos: '', vaccin_hepatite: '',
    autres_vaccins: '', allergies: '',
    tabac: false, alcool: false, automedication: false,
  });

  const [fForm, setFForm] = useState({
    date_visite: TODAY_STR, type_visite: 'EMBAUCHE',
    aptitude: '', precision_aptitude: '', duree_aptitude_date: '',
    raison_sociale: '', adresse_entreprise: '', nature_activite: '', numero_cnss_entreprise: '',
    qualifications: '', collaborateur_lieu_naissance: '', collaborateur_adresse: '',
    collaborateur_cnss: '', collaborateur_date_recrutement: '',     collaborateur_poste: '',
  });
  const [sousseAptitudeChoice, setSousseAptitudeChoice] = useState('');
  const [obs, setObs] = useState('');
  const [dataSource, setDataSource] = useState('embauche');
  /** Messadine — mêmes onglets que « Fiches du jour » (bilan, examens, ordonnance, liaison) */
  const [listeJourMessadineTab, setListeJourMessadineTab] = useState('fiche');

  // Messadine (SMS/Embauche) + Menzel (VP/Embauche) : étape "Documents" = onglets. Garder l'onglet "fiche" sur l'étape Fiche d'aptitude.
  // IMPORTANT: ce hook doit rester avant tout `return` conditionnel (règles des hooks).
  useEffect(() => {
    const isDocsFlow =
      isSmsMessadineDocsFlow
      || isEmbaucheMessadineDocsFlow
      || isVpMessadineDocsFlow
      || isVpMenzelDocsFlow
      || isEmbaucheMenzelDocsFlow;
    if (!isDocsFlow) return;
    if (etape === 2 && listeJourMessadineTab !== 'fiche') setListeJourMessadineTab('fiche');
    if (etape === 3 && listeJourMessadineTab === 'fiche') setListeJourMessadineTab('bilan');
  }, [isSmsMessadineDocsFlow, isEmbaucheMessadineDocsFlow, isVpMessadineDocsFlow, isVpMenzelDocsFlow, isEmbaucheMenzelDocsFlow, etape, listeJourMessadineTab]);
  const [smsMateurOnglet, setSmsMateurOnglet] = useState('sms'); // sms | fiche | certificat
  const [smsMateurDocChoisi, setSmsMateurDocChoisi] = useState(''); // '' | 'fiche' | 'certificat'
  const [smsSurvVisibleCount, setSmsSurvVisibleCount] = useState(1);
  const ficheCreeeIdRef = useRef(null);
  useEffect(() => {
    ficheCreeeIdRef.current = ficheCreee?.id || null;
  }, [ficheCreee?.id]);

  // Étape "Choix document" : ne pas rester sur l'onglet SMS (on n'affiche que Fiche/Certificat).
  useEffect(() => {
    if (!isMateurDocChoiceFlow || etape !== 3) return;
    if (smsMateurOnglet === 'sms') {
      const next = smsMateurDocChoisi || 'fiche';
      setSmsMateurOnglet(next);
    }
  }, [isMateurDocChoiceFlow, etape, smsMateurOnglet, smsMateurDocChoisi]);

  // Si l'utilisateur navigue via les onglets (sans cliquer les boutons de choix),
  // garder smsMateurDocChoisi cohérent afin d'afficher le bouton d'impression en finalisation.
  useEffect(() => {
    if (!isMateurDocChoiceFlow) return;
    if (smsMateurOnglet !== 'fiche' && smsMateurOnglet !== 'certificat') return;
    if (smsMateurDocChoisi === smsMateurOnglet) return;
    setSmsMateurDocChoisi(smsMateurOnglet);
  }, [isMateurDocChoiceFlow, smsMateurOnglet, smsMateurDocChoisi]);

  // SMS Mateur : si l'utilisateur choisit "certificat" et que la fiche n'a pas de certificat,
  // essayer de le recharger depuis l'API (même logique que l'embauche).
  useEffect(() => {
    const wantsCert =
      smsMateurOnglet === 'certificat'
      || smsMateurDocChoisi === 'certificat';
    if (!isMateurDocChoiceFlow || !(etape === 3 || etape === 4) || !wantsCert || !ficheCreee?.id) return undefined;
    const d = ficheCreee?.certificat?.description;
    if (d != null && String(d).trim() !== '') return undefined;
    let cancelled = false;
    const fid = ficheCreee.id;
    getCertificatParFiche(fid)
      .then((rows) => {
        if (cancelled || !rows?.length) return;
        const c = rows[0];
        if (!c) return;
        setFicheCreee((prev) => (prev && Number(prev.id) === Number(fid)
          ? { ...prev, certificat: { ...(prev.certificat || {}), ...c } }
          : prev));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isMateurDocChoiceFlow, etape, smsMateurOnglet, smsMateurDocChoisi, ficheCreee?.id, ficheCreee?.certificat?.description]);

  // SMS (Surveillance médicale spéciale) — formulaire spécifique Mateur (2 pages PDF)
  const [smsMateurForm, setSmsMateurForm] = useState(() => makeEmptySmsMateurForm());

  // Certificat Mateur : brouillon local pour l'impression (si l'API ne renvoie pas description)
  const smsCertDraft = useMemo(() => {
    try {
      const fid = ficheCreee?.id;
      if (!fid) return null;
      const raw = sessionStorage.getItem(`pfe-mateur-cert-draft-v1:${fid}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || String(parsed.ficheId) !== String(fid)) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [ficheCreee?.id]);

  // Fiche aptitude : brouillon local (TabFiche) pour savoir si la fiche a été réellement remplie.
  const smsFicheDraft = useMemo(() => {
    try {
      const fid = ficheCreee?.id;
      if (!fid) return null;
      const raw = sessionStorage.getItem(`pfe-tabfiche-draft-v1:${fid}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || String(parsed.ficheId) !== String(fid)) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [ficheCreee?.id]);

  // SMS Mateur : afficher 1 ligne au début, mais ouvrir automatiquement jusqu'à la dernière ligne remplie.
  useEffect(() => {
    if (!isMateurDocChoiceFlow) return;
    const rows = Array.isArray(smsMateurForm?.surveillance_rows) ? smsMateurForm.surveillance_rows : [];
    let lastFilledIdx = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r) continue;
      const filled = Boolean(
        String(r.date_examen || '').trim()
        || String(r.nature_examen || '').trim()
        || String(r.resultats || '').trim()
        || String(r.medecin_signature || '').trim()
      );
      if (filled) lastFilledIdx = i;
    }
    const needed = Math.max(1, lastFilledIdx + 1);
    setSmsSurvVisibleCount((prev) => (prev < needed ? needed : prev));
  }, [isMateurDocChoiceFlow, smsMateurForm]);

  /** Liste d'embauche — template Mateur : aligné Nouvellefiche (Fiche Annexe 3 vs Certificat). */
  const [embaucheMateurDocType, setEmbaucheMateurDocType] = useState('FICHE'); // FICHE | CERTIFICAT
  const [embaucheMaturExamRows, setEmbaucheMaturExamRows] = useState(() => padMateurExamRows([]));
  const [embaucheMateurCert, setEmbaucheMateurCert] = useState(() => makeEmptyEmbaucheMateurCert());

  const [siteEntreprise, setSiteEntreprise] = useState({
    raison_sociale: '',
    nature_activite: '',
    numero_cnss_entreprise: '',
    adresse_entreprise: '',
    qualifications: '',
  });

  useEffect(() => {
    const siteId = getUserSiteId();
    if (!siteId) return;
    let cancelled = false;
    getSite(siteId)
      .then((s) => {
        if (cancelled) return;
        const rs = s?.raison_sociale ?? s?.raisonSociale ?? s?.company_name ?? s?.companyName ?? s?.nom_entreprise ?? '';
        const na = s?.nature_activite ?? s?.natureActivite ?? s?.activite ?? s?.activity ?? '';
        const cnss = s?.numero_cnss_entreprise ?? s?.numeroCnssEntreprise ?? s?.cnss_entreprise ?? s?.cnssEntreprise ?? s?.cnss ?? '';
        const adr = s?.adresse_entreprise ?? s?.adresseEntreprise ?? s?.address ?? s?.adresse ?? '';
        const q = s?.qualifications ?? s?.qualification ?? '';
        setSiteEntreprise({
          raison_sociale: String(rs || '').trim(),
          nature_activite: String(na || '').trim(),
          numero_cnss_entreprise: String(cnss || '').trim(),
          adresse_entreprise: String(adr || '').trim(),
          qualifications: String(q || '').trim(),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const enterpriseReadOnly = Boolean(
    String(siteEntreprise.raison_sociale || '').trim()
      || String(siteEntreprise.nature_activite || '').trim()
      || String(siteEntreprise.numero_cnss_entreprise || '').trim()
      || String(siteEntreprise.adresse_entreprise || '').trim()
      || String(siteEntreprise.qualifications || '').trim()
  );

  /** Impression liste embauche Mateur : la même chaîne que le POST (état local), sans dépendre du GET certificat. */
  const embaucheCertFormForPrint = useMemo(() => {
    if (!isEmbaucheMateurFlow || embaucheMateurDocType !== 'CERTIFICAT') return null;
    const descObj = buildMateurCertificatDescriptionForApi(embaucheMateurCert, {
      type_visite: fForm.type_visite,
      aptitude: fForm.aptitude,
      precision_aptitude: fForm.precision_aptitude,
    });
    const base = ficheCreee?.certificat || {};
    return {
      ...base,
      description: JSON.stringify(descObj),
      date_emission: base.date_emission || fForm.date_visite || ficheCreee?.date_visite || '',
    };
  }, [
    isEmbaucheMateurFlow,
    embaucheMateurDocType,
    embaucheMateurCert,
    fForm.type_visite,
    fForm.aptitude,
    fForm.precision_aptitude,
    fForm.date_visite,
    ficheCreee?.certificat,
    ficheCreee?.date_visite,
  ]);

  const setD = f => e => setDForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setF = f => e => setFForm(p => ({ ...p, [f]: e.target.value }));

  const buildAdresseFromIm = (im) => {
    if (!im) return '';
    const direct = String(im.adresse || '').trim();
    if (direct) return direct;
    return [String(im.adr_ville || '').trim(), String(im.adr_gouv || '').trim()].filter(Boolean).join(' - ');
  };
  const toIsoDate = v => {
    if (!v) return '';
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return s;
  };

  const pickStrAny = (obj, keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };

  const normalizeCollaborateurDb = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const nested =
      raw.collaborateur_detail ||
      (raw.collaborateur && typeof raw.collaborateur === 'object' ? raw.collaborateur : null);
    const POSTE_KEYS = ['poste', 'fonction', 'job_title', 'collaborateur_poste', 'intitule_poste', 'job', 'role', 'position'];
    const nom = pickStrAny(raw, ['nom', 'last_name', 'lastname']) || (nested ? pickStrAny(nested, ['nom', 'last_name', 'lastname']) : '');
    const prenom = pickStrAny(raw, ['prenom', 'first_name', 'firstname']) || (nested ? pickStrAny(nested, ['prenom', 'first_name', 'firstname']) : '');
    const matricule = pickStrAny(raw, ['matricule', 'matricule_ref', 'collaborateur_matricule']) || (nested ? pickStrAny(nested, ['matricule', 'matricule_ref']) : '');
    const poste = pickStrAny(raw, POSTE_KEYS) || (nested ? pickStrAny(nested, POSTE_KEYS) : '');
    const cnss = pickStrAny(raw, ['cnss', 'numero_cnss', 'numero_cnss_collaborateur', 'collaborateur_cnss']);
    const lieuNaissance = pickStrAny(raw, ['lieu_naissance', 'collaborateur_lieu_naissance']);
    const adresse = pickStrAny(raw, ['adresse', 'collaborateur_adresse']);
    const dateNaissance = pickStrAny(raw, ['date_naissance', 'birth_date', 'dn', 'collaborateur_date_naissance']);
    const dateRecrutement = pickStrAny(raw, ['date_recrutement', 'date_embauche', 'hire_date', 'collaborateur_date_recrutement']);
    return {
      nom,
      prenom,
      matricule,
      poste,
      cnss,
      lieuNaissance,
      adresse,
      dateNaissance: toIsoDate(dateNaissance),
      dateRecrutement: toIsoDate(dateRecrutement),
    };
  };
  const enrichFromImData = (base, cRef) => {
    const im = cRef?.im_data;
    if (!im) return base;
    return { ...base, lieu_naissance: String(im.lieu_naissance || '').trim() || base.lieu_naissance || '', adresse: buildAdresseFromIm(im) || base.adresse || '', date_naissance: base.date_naissance || toIsoDate(im.date_naissance || im.dn || im.birth_date || '') || '' };
  };
  const mappedAptitudeFromEtat = e => e === 'APTE' ? 'APTE_AU_POSTE' : e === 'INAPTE' ? 'INAPTE_DEFINITIF_ENTREPRISE' : '';
  const fillDFormFromDossier = (d, cRef) => {
    setDForm(enrichFromImData({
      nom: d.nom || cRef?.nom || '', prenom: d.prenom || cRef?.prenom || '',
      matricule_ref: d.matricule_ref || cRef?.matricule || '',
      date_naissance: d.date_naissance || cRef?.date_naissance || '',
      lieu_naissance: d.lieu_naissance || '', adresse: d.adresse || d.gouvernorat || cRef?.gouvernorat || '',
      groupe_sanguin: d.groupe_sanguin || '', antecedents_medicaux: d.antecedents_medicaux || '',
      antecedents_chirurgicaux: d.antecedents_chirurgicaux || '', antecedents_gyneco: d.antecedents_gyneco || '',
      antecedents_familiaux: d.antecedents_familiaux || '', vaccin_tuberculose: d.vaccin_tuberculose || '',
      vaccin_tetanos: d.vaccin_tetanos || '', vaccin_hepatite: d.vaccin_hepatite || '',
      autres_vaccins: d.autres_vaccins || '', allergies: d.allergies || '',
      tabac: !!d.tabac, alcool: !!d.alcool, automedication: !!d.automedication,
    }, cRef));
  };

  useEffect(() => {
    if (!candidat) return;
    const stableKey = panelDraftKeyForCandidat(mode, candidat);
    const draftKey = `${mode}:${stableKey}`;
    panelHydratedKeyRef.current = '';

    let saved = panelDraftsRef.current[draftKey];
    if (!saved) {
      try {
        const raw = readLocalOrMigrateSession(panelDraftStorageKey(mode, stableKey));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (isUsablePanelDraft(parsed, candidat, mode)) saved = parsed;
        }
      } catch { /* no-op */ }
    }

    if (saved) {
      if (isVpFlow) suppressVpCollabFetchOnceRef.current = true;
      setErr('');
      setInfoMsg('');
      setDossier(saved.dossier ?? null);
      if (saved.dossier) dossierCacheRef.current[candidat.id] = saved.dossier;
      setFicheCreee(saved.ficheCreee ?? null);
      setModeModif(!!saved.modeModif);
      setEtape(typeof saved.etape === 'number' ? saved.etape : (isVpFlow ? 2 : 1));
      setDForm(saved.dForm && typeof saved.dForm === 'object' ? saved.dForm : {});
      setFForm(saved.fForm && typeof saved.fForm === 'object' ? saved.fForm : {});
      // Restaurer le formulaire SMS Mateur depuis le snapshot, puis fallback depuis brouillon dédié.
      if (saved.smsMateurForm && typeof saved.smsMateurForm === 'object') setSmsMateurForm(saved.smsMateurForm);
      if (saved.smsMateurOnglet === 'sms' || saved.smsMateurOnglet === 'fiche' || saved.smsMateurOnglet === 'certificat') {
        setSmsMateurOnglet(saved.smsMateurOnglet);
      }
      if (saved.embaucheMateurDocType === 'FICHE' || saved.embaucheMateurDocType === 'CERTIFICAT') {
        setEmbaucheMateurDocType(saved.embaucheMateurDocType);
      }
      if (Array.isArray(saved.embaucheMaturExamRows)) {
        setEmbaucheMaturExamRows(padMateurExamRows(saved.embaucheMaturExamRows));
      }
      if (saved.embaucheMateurCert && typeof saved.embaucheMateurCert === 'object') {
        setEmbaucheMateurCert({ ...makeEmptyEmbaucheMateurCert(), ...saved.embaucheMateurCert });
      }
      setObs(saved.obs != null ? String(saved.obs) : '');
      setSousseAptitudeChoice(saved.sousseAptitudeChoice != null ? String(saved.sousseAptitudeChoice) : '');
      setDataSource(saved.dataSource || (isVpFlow ? 'im_db' : 'embauche'));
      setCollabDb(saved.collabDb ?? null);
      setCollabDbLoading(!!saved.collabDbLoading);
      setCollabDbErr(saved.collabDbErr != null ? String(saved.collabDbErr) : '');
      setListeJourMessadineTab(saved.listeJourMessadineTab === 'bilan' || saved.listeJourMessadineTab === 'examen' || saved.listeJourMessadineTab === 'ordonnance' || saved.listeJourMessadineTab === 'liaison' ? saved.listeJourMessadineTab : 'fiche');
      setLoadingDossier(false);
      panelHydratedKeyRef.current = draftKey;
      return;
    }

    // Fallback: brouillon SMS Mateur (même si pas de snapshot global)
    if (isMateurDocChoiceFlow) {
      try {
        const rawSms = readLocalOrMigrateSession(smsMateurDraftStorageKey(mode, candidat.id));
        if (rawSms) {
          const parsed = JSON.parse(rawSms);
          if (parsed && parsed.version === 1 && String(parsed.candidatId) === String(candidat.id) && parsed.form) {
            setSmsMateurForm(parsed.form);
          }
        }
      } catch { /* ignore */ }
    }

    suppressVpCollabFetchOnceRef.current = false;
    setLoadingDossier(true); setErr(''); setInfoMsg(''); setDossier(null); setFicheCreee(null); setModeModif(false);
    /* VP : le dossier existe déjà côté RH — aller directement à la fiche d'aptitude. */
    setEtape(isVpFlow ? 2 : 1);
    setObs(''); setDataSource(isVpFlow ? 'im_db' : 'embauche');
    setDForm(enrichFromImData({ nom: candidat.nom || '', prenom: candidat.prenom || '', matricule_ref: candidat.matricule || '', date_naissance: candidat.date_naissance || '', lieu_naissance: '', adresse: '', groupe_sanguin: '', antecedents_medicaux: '', antecedents_chirurgicaux: '', antecedents_gyneco: '', antecedents_familiaux: '', vaccin_tuberculose: '', vaccin_tetanos: '', vaccin_hepatite: '', autres_vaccins: '', allergies: '', tabac: false, alcool: false, automedication: false }, candidat));
    const cachedDossier = dossierCacheRef.current[candidat.id];
    if (cachedDossier) { setDossier(cachedDossier); fillDFormFromDossier(cachedDossier, candidat); setDataSource('dossier'); }
    setFForm({
      date_visite: (candidat.date_visite_liste && toIsoDate(String(candidat.date_visite_liste))) || TODAY_STR,
      type_visite: isSurveillanceSpeciale
        ? 'SURVEILLANCE_SPECIALE'
        : isPeriodique
          ? 'PERIODIQUE'
          : 'EMBAUCHE',
      aptitude: '',
      precision_aptitude: '',
      duree_aptitude_date: '',
      raison_sociale: siteEntreprise.raison_sociale || '',
      adresse_entreprise: siteEntreprise.adresse_entreprise || '',
      nature_activite: siteEntreprise.nature_activite || '',
      numero_cnss_entreprise: siteEntreprise.numero_cnss_entreprise || '',
      qualifications: siteEntreprise.qualifications || candidat?.formation || '',
      collaborateur_lieu_naissance: candidat?.im_data?.lieu_naissance || '',
      collaborateur_adresse: buildAdresseFromIm(candidat?.im_data) || candidat?.gouvernorat || '',
      collaborateur_cnss: pickCnssCollaborateur(candidat),
      collaborateur_date_recrutement: candidat?.date_recrutement || '',
      collaborateur_poste: candidat?.im_data?.fonction || candidat?.poste || '',
    });
    setSousseAptitudeChoice('');
    setObs(candidat.observations_medecin || '');
    if (isMateurDocChoiceFlow) {
      setSmsMateurForm(makeEmptySmsMateurForm());
      setSmsMateurOnglet('sms');
    }
    if (isEmbaucheMateurFlow) {
      setEmbaucheMateurDocType('FICHE');
      setEmbaucheMaturExamRows(padMateurExamRows([]));
      setEmbaucheMateurCert(makeEmptyEmbaucheMateurCert());
      setEmbaucheWantsCert(false);
    }

    const hydrateExistingFiche = async (hasDossier) => {
      const pickFicheRef = (row) => {
        if (!row || typeof row !== 'object') return null;
        return (
          row.fiche_aptitude
          ?? row.fiche_aptitude_id
          ?? row.derniere_fiche_id
          ?? row.fiche_id
          ?? row.fiche
          ?? row.derniere_fiche
          ?? row.resultat_fiche_aptitude
          ?? null
        );
      };

      let rawFiche = pickFicheRef(candidat);

      // Liste SMS : la réponse « liste » peut omettre `fiche_aptitude` alors que le GET détail
      // le fournit — indispensable pour réhydrater le formulaire après navigation / refresh.
      if (!rawFiche && isSurveillanceSpeciale && candidat?.id != null) {
        try {
          const ligneDetail = await getLigneSurveillanceSpecialeById(candidat.id);
          rawFiche = pickFicheRef(ligneDetail);
        } catch {
          /* ignore */
        }
      }

      if (!rawFiche) return;
      const extractFichePk = (v) => {
        if (v == null || v === '') return null;
        if (typeof v === 'object') {
          const id = v.id ?? v.pk ?? v.fiche_aptitude_id ?? v.fiche_id;
          return id != null && id !== '' ? id : null;
        }
        const s = String(v).trim();
        if (!s) return null;
        const tail = s.match(/\/(\d+)\/?$/);
        if (tail) return tail[1];
        return s;
      };
      const ficheId = extractFichePk(rawFiche);
      if (!ficheId) return;
      try {
        const fiche = await getFicheAptitude(ficheId);
        const im = candidat?.im_data || {};
        const imAdresse = buildAdresseFromIm(im);
        setFicheCreee({ ...fiche, collaborateur_nom: candidat ? `${candidat.nom || ''} ${candidat.prenom || ''}`.trim() : (fiche.collaborateur_nom || ''), collaborateur_matricule: candidat?.matricule || fiche.collaborateur_matricule || '', collaborateur_date_naissance: fiche.collaborateur_date_naissance || im.date_naissance || candidat?.date_naissance || '', collaborateur_lieu_naissance: fiche?.collaborateur_lieu_naissance || im.lieu_naissance || '', collaborateur_adresse: fiche?.collaborateur_adresse || imAdresse || candidat?.gouvernorat || '', collaborateur_cnss: pickCnssCollaborateur(candidat, fiche), collaborateur_cin: candidat?.cin || fiche?.collaborateur_cin || '', collaborateur_date_recrutement: fiche?.collaborateur_date_recrutement || im.date_embauche || candidat?.date_recrutement || '', collaborateur_poste: fiche?.collaborateur_poste || im.fonction || candidat?.poste || '', qualifications: fiche?.qualifications || candidat?.formation || '' });
        // SMS Mateur : JSON dans observations_complementaires ou champ serializer sms_mateur_payload
        if (isMateurDocChoiceFlow) {
          const smsPayload = pickSmsMateurPayloadFromFiche(fiche);
          if (smsPayload && typeof smsPayload === 'object') {
            const {
              version: _v,
              observations_libres: _ol,
              collaborateur: _c,
              medecin_travail: _m,
              ...rest
            } = smsPayload;
            setSmsMateurForm({
              ...makeEmptySmsMateurForm(),
              ...rest,
            });
          }
        }
        setFForm({
          date_visite: fiche.date_visite || TODAY_STR,
          type_visite:
            fiche.type_visite
            || (isSurveillanceSpeciale ? 'SURVEILLANCE_SPECIALE' : isPeriodique ? 'PERIODIQUE' : 'EMBAUCHE'),
          aptitude: fiche.aptitude || mappedAptitudeFromEtat(candidat.etat_embauche),
          precision_aptitude: isMessadineTemplate ? messadinePrecisionTextFromFicheForForm(fiche) : precisionAptitudeFromFiche(fiche),
          duree_aptitude_date: isMessadineTemplate ? messadineDureeAptitudeDateFromFiche(fiche) : '',
          raison_sociale: fiche.raison_sociale || siteEntreprise.raison_sociale || '',
          adresse_entreprise: fiche.adresse_entreprise || siteEntreprise.adresse_entreprise || '',
          nature_activite: fiche.nature_activite || siteEntreprise.nature_activite || '',
          numero_cnss_entreprise: fiche.numero_cnss_entreprise || siteEntreprise.numero_cnss_entreprise || '',
          qualifications: fiche.qualifications || siteEntreprise.qualifications || candidat?.formation || '',
          collaborateur_lieu_naissance: fiche?.collaborateur_lieu_naissance || im.lieu_naissance || '',
          collaborateur_adresse: fiche?.collaborateur_adresse || imAdresse || candidat?.gouvernorat || '',
          collaborateur_cnss: pickCnssCollaborateur(candidat, fiche),
          collaborateur_date_recrutement: fiche?.collaborateur_date_recrutement || candidat?.date_recrutement || '',
          collaborateur_poste: fiche?.collaborateur_poste || candidat?.poste || '',
        });
        if (mode === 'embauche' && !isVpFlow && !isSurveillanceSpeciale && isMaturTemplate) {
          setEmbaucheMaturExamRows(padMateurExamRows(fiche.examens_ulterieurs));
        }
        setSousseAptitudeChoice(
          isMessadineTemplate
            ? deriveMessadineCertificatChoice({
                type_visite: fiche.type_visite,
                aptitude: fiche.aptitude || mappedAptitudeFromEtat(candidat.etat_embauche),
                precision_aptitude: fiche.precision_aptitude,
                date_reprise: fiche.date_reprise,
              })
            : '',
        );
        if (isVpFlow) {
          if (isMateurDocChoiceFlow) {
            const smsObs = pickSmsMateurPayloadFromFiche(fiche);
            const lib = smsObs && typeof smsObs.observations_libres === 'string'
              ? smsObs.observations_libres.trim()
              : '';
            setObs(lib || (candidat.observations_medecin || ''));
          } else {
            const oc = fiche.observations_complementaires ?? fiche.observations_medecin ?? fiche.observations_complementaire;
            setObs(oc != null && String(oc).trim() !== '' ? String(oc) : (candidat.observations_medecin || ''));
          }
        }
      } catch {
        setFicheCreee({ id: ficheId, ...(typeof rawFiche === 'object' ? rawFiche : {}) });
        setFForm({
          date_visite: TODAY_STR,
          type_visite:
            (typeof rawFiche === 'object' && rawFiche.type_visite)
            || (isSurveillanceSpeciale ? 'SURVEILLANCE_SPECIALE' : isPeriodique ? 'PERIODIQUE' : 'EMBAUCHE'),
          aptitude: mappedAptitudeFromEtat(candidat.etat_embauche),
          precision_aptitude: '',
          duree_aptitude_date: '',
          raison_sociale: siteEntreprise.raison_sociale || '',
          adresse_entreprise: siteEntreprise.adresse_entreprise || '',
          nature_activite: siteEntreprise.nature_activite || '',
          numero_cnss_entreprise: siteEntreprise.numero_cnss_entreprise || '',
          qualifications: siteEntreprise.qualifications || candidat?.formation || '',
          collaborateur_lieu_naissance: candidat?.im_data?.lieu_naissance || '',
          collaborateur_adresse: buildAdresseFromIm(candidat?.im_data) || candidat?.gouvernorat || '',
          collaborateur_cnss: pickCnssCollaborateur(candidat),
          collaborateur_date_recrutement: candidat?.date_recrutement || '',
          collaborateur_poste: candidat?.im_data?.fonction || candidat?.poste || '',
        });
        setSousseAptitudeChoice('');
      }
      setModeModif(true);
      if (isVpFlow) setEtape(3);
      else setEtape(hasDossier ? 3 : 1);
    };

    const loadData = async () => {
      let hasDossier = !!cachedDossier;
      try {
        const d = await getDossierByMatricule(candidat.matricule);
        if (d) {
          if (d.source === 'im_db') { fillDFormFromDossier(d, candidat); setDataSource('im_db'); setInfoMsg('ℹ Données pré-remplies depuis la base RH (im_db) — vérifiez et complétez.'); }
          else if (d.source === 'embauche') { fillDFormFromDossier(d, candidat); setDataSource('embauche'); setInfoMsg("⚠ Candidat non trouvé dans im_db — données issues de la liste d'embauche RH."); }
          else { hasDossier = true; setDossier(d); setDataSource('dossier'); setInfoMsg('✓ Dossier médical existant trouvé — vérifiez et complétez si nécessaire.'); fillDFormFromDossier(d, candidat); dossierCacheRef.current[candidat.id] = d; }
        }
      } catch { /* no-op */ }
      if (!hasDossier) { const embedded = [candidat.dossier_medical, candidat.dossier].find(x => x && typeof x === 'object'); if (embedded) { hasDossier = true; setDossier(embedded); setDataSource('dossier'); setInfoMsg('✓ Dossier médical existant trouvé.'); fillDFormFromDossier(embedded, candidat); dossierCacheRef.current[candidat.id] = embedded; } }
      await hydrateExistingFiche(hasDossier);
    };
    loadData().catch(() => {}).finally(() => {
      setLoadingDossier(false);
      panelHydratedKeyRef.current = draftKey;
    });
    /* Ne pas dépendre de l’objet `candidat` : après « Terminer », le parent rafraîchit la liste (nouvelle ref, même id)
     * — sinon cet effet relance tout le flux (étape 1/2) pour les listes SMS / VP. */
    /* Ne pas dépendre de siteEntreprise : le merge entreprise (effet dédié) suffit ; sinon rechargement efface les saisies. */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rechargement si autre ligne (candidat?.id), mode ou template
  }, [candidat?.id, mode, isMessadineTemplate, isMaturTemplate]);

  useEffect(() => {
    let cancelled = false;
    if (suppressVpCollabFetchOnceRef.current) {
      suppressVpCollabFetchOnceRef.current = false;
      return () => { cancelled = true; };
    }
    setCollabDb(null);
    setCollabDbErr('');
    if (!candidat || !isVpFlow) return () => { cancelled = true; };

    const collabId = candidat?.collaborateurPk ?? candidat?.collaborateur_id ?? candidat?.collaborateur;
    if (collabId == null || collabId === '') return () => { cancelled = true; };

    setCollabDbLoading(true);
    (async () => {
      try {
        const raw = await getCollaborateurRhById(collabId);
        const norm = normalizeCollaborateurDb(raw);
        if (cancelled) return;
        setCollabDb(norm);

        if (norm) {
          setDForm((p) => ({
            ...p,
            nom: norm.nom || p.nom,
            prenom: norm.prenom || p.prenom,
            matricule_ref: norm.matricule || p.matricule_ref,
            date_naissance: norm.dateNaissance || p.date_naissance,
            lieu_naissance: norm.lieuNaissance || p.lieu_naissance,
            adresse: norm.adresse || p.adresse,
          }));
          setFForm((p) => ({
            ...p,
            collaborateur_adresse: norm.adresse || p.collaborateur_adresse,
            collaborateur_lieu_naissance: norm.lieuNaissance || p.collaborateur_lieu_naissance,
            collaborateur_cnss: norm.cnss || p.collaborateur_cnss,
            collaborateur_date_recrutement: norm.dateRecrutement || p.collaborateur_date_recrutement,
            collaborateur_poste: norm.poste || p.collaborateur_poste,
          }));
        }
      } catch {
        if (cancelled) return;
        setCollabDbErr("Impossible de récupérer automatiquement les informations du collaborateur.");
      } finally {
        if (!cancelled) setCollabDbLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id stable : éviter re-fetch si seule la ref candidat change
  }, [candidat?.id, isVpFlow]);

  // Si les infos entreprise arrivent après, compléter sans écraser les valeurs déjà saisies / existantes.
  useEffect(() => {
    if (!enterpriseReadOnly) return;
    setFForm((prev) => {
      if (!prev || typeof prev !== 'object') return prev;
      const next = { ...prev };
      if (!String(next.raison_sociale || '').trim()) next.raison_sociale = siteEntreprise.raison_sociale || '';
      if (!String(next.nature_activite || '').trim()) next.nature_activite = siteEntreprise.nature_activite || '';
      if (!String(next.numero_cnss_entreprise || '').trim()) next.numero_cnss_entreprise = siteEntreprise.numero_cnss_entreprise || '';
      if (!String(next.adresse_entreprise || '').trim()) next.adresse_entreprise = siteEntreprise.adresse_entreprise || '';
      if (!String(next.qualifications || '').trim()) next.qualifications = siteEntreprise.qualifications || next.qualifications || '';
      return next;
    });
  }, [enterpriseReadOnly, siteEntreprise]);

  useEffect(() => {
    setListeJourMessadineTab('fiche');
  }, [ficheCreee?.id]);

  useEffect(() => {
    setSmsMateurOnglet('sms');
  }, [ficheCreee?.id]);

  useEffect(() => {
    if (!candidat || loadingDossier) return;
    const stableKey = panelDraftKeyForCandidat(mode, candidat);
    const draftKey = `${mode}:${stableKey}`;
    // IMPORTANT (SMS/VP): on persiste le brouillon même si l'hydratation async n'est pas finie,
    // sinon l'utilisateur peut saisir puis naviguer avant la fin du loadData() et perdre la saisie.
    // Le garde-fou `isUsablePanelDraft` protège la restauration.
    if (!panelHydratedKeyRef.current) {
      panelHydratedKeyRef.current = draftKey;
    }
    if (panelHydratedKeyRef.current !== draftKey) return;
    const snapshot = {
      version: 1,
      mode,
      candidatId: candidat.id,
      matricule: candidat.matricule,
      dForm,
      fForm,
      etape,
      obs,
      sousseAptitudeChoice,
      dataSource,
      modeModif,
      dossier,
      ficheCreee,
      listeJourMessadineTab,
      smsMateurForm,
      smsMateurOnglet,
      embaucheMateurDocType,
      embaucheMaturExamRows,
      embaucheMateurCert,
      collabDb,
      collabDbLoading,
      collabDbErr,
    };
    const t = setTimeout(() => {
      panelDraftsRef.current[draftKey] = snapshot;
      try {
        const stableKey = panelDraftKeyForCandidat(mode, candidat);
        localStorage.setItem(panelDraftStorageKey(mode, stableKey), JSON.stringify(snapshot));
      } catch { /* quota ou stringify */ }
    }, 200);
    return () => clearTimeout(t);
  }, [
    candidat?.id,
    mode,
    loadingDossier,
    dForm,
    fForm,
    etape,
    obs,
    sousseAptitudeChoice,
    dataSource,
    modeModif,
    dossier,
    ficheCreee,
    listeJourMessadineTab,
    smsMateurForm,
    smsMateurOnglet,
    embaucheMateurDocType,
    embaucheMaturExamRows,
    embaucheMateurCert,
    collabDb,
    collabDbLoading,
    collabDbErr,
  ]);

  // Brouillon dédié SMS Mateur (persiste même si le snapshot global n'est pas stable)
  useEffect(() => {
    if (!candidat || !isMateurDocChoiceFlow) return undefined;
    // Auto-save backend dès qu'une fiche existe :
    // garantit que les données restent après navigation/reload et remplit la table backend via sync.
    const ficheId = ficheCreeeIdRef.current;
    if (ficheId) {
      const t2 = setTimeout(() => {
        const payload = {
          __sms_mateur_v1: {
            version: 1,
            ...smsMateurForm,
          },
        };
        patchFicheAptitude(ficheId, { observations_complementaires: JSON.stringify(payload) })
          .catch(() => {});
      }, 600);
      return () => clearTimeout(t2);
    }
    const key = smsMateurDraftStorageKey(mode, candidat.id);
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            mode,
            candidatId: candidat.id,
            form: smsMateurForm,
            savedAt: new Date().toISOString(),
          })
        );
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [candidat?.id, mode, isMateurDocChoiceFlow, smsMateurForm]);

  // Liste embauche + certificat Mateur : le PDF lit `certificat.description` ; recharge si absent (ex. retour brouillon).
  useEffect(() => {
    if (!isEmbaucheMateurFlow || embaucheMateurDocType !== 'CERTIFICAT' || etape !== 3 || !ficheCreee?.id) return undefined;
    const d = ficheCreee?.certificat?.description;
    if (d != null && String(d).trim() !== '') return undefined;
    let cancelled = false;
    const fid = ficheCreee.id;
    getCertificatParFiche(fid)
      .then((rows) => {
        if (cancelled || !rows?.length) return;
        const c = rows[0];
        if (!c || c.description == null || String(c.description).trim() === '') return;
        setFicheCreee((prev) => (prev && Number(prev.id) === Number(fid)
          ? { ...prev, certificat: { ...(prev.certificat || {}), ...c } }
          : prev));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isEmbaucheMateurFlow, embaucheMateurDocType, etape, ficheCreee?.id, ficheCreee?.certificat?.description]);

  const handleFicheUpdatedListeJourMessadine = useCallback(async () => {
    const id = ficheCreee?.id;
    if (!id) return;
    try {
      const fiche = await getFicheAptitude(id);
      const im = candidat?.im_data || {};
      const imAdresse = buildAdresseFromIm(im);
      setFicheCreee({
        ...fiche,
        collaborateur_nom: candidat ? `${candidat.nom || ''} ${candidat.prenom || ''}`.trim() : (fiche.collaborateur_nom || ''),
        collaborateur_matricule: candidat?.matricule || fiche.collaborateur_matricule || '',
        collaborateur_date_naissance: fiche.collaborateur_date_naissance || im.date_naissance || candidat?.date_naissance || dForm?.date_naissance || '',
        collaborateur_lieu_naissance: fForm.collaborateur_lieu_naissance || fiche.collaborateur_lieu_naissance || im.lieu_naissance || dForm?.lieu_naissance || '',
        collaborateur_adresse: fForm.collaborateur_adresse || fiche.collaborateur_adresse || imAdresse || dForm?.adresse || candidat?.gouvernorat || '',
        collaborateur_cnss: fForm.collaborateur_cnss || pickCnssCollaborateur(candidat, fiche),
        collaborateur_cin: candidat?.cin || dForm?.cin || '',
        collaborateur_date_recrutement: fForm.collaborateur_date_recrutement || fiche.collaborateur_date_recrutement || im.date_embauche || candidat?.date_recrutement || '',
        collaborateur_poste: fForm.collaborateur_poste || fiche.collaborateur_poste || im.fonction || candidat?.poste || '',
        qualifications: fForm.qualifications || fiche.qualifications || candidat?.formation || '',
      });
    } catch { /* no-op */ }
  }, [ficheCreee?.id, candidat, dForm?.date_naissance, dForm?.adresse, dForm?.lieu_naissance, dForm?.cin, fForm]);

  const handleEtape1 = async () => {
    if (!dForm.nom.trim() || !dForm.prenom.trim()) { setErr('Nom et prénom obligatoires.'); return; }
    setLoading(true); setErr(''); setInfoMsg('');
    try {
      const dateFields = ['date_naissance', 'vaccin_tuberculose', 'vaccin_tetanos', 'vaccin_hepatite'];
      const payload = {
        collaborateur: isVpFlow
          ? (dossier?.collaborateur ?? candidat.collaborateurPk ?? candidat.collaborateur_id ?? null)
          : (dossier?.collaborateur ?? null),
      };
      Object.entries(dForm).forEach(([k, v]) => {
        if (dateFields.includes(k)) { payload[k] = v && String(v).trim() ? v : null; }
        else if (typeof v === 'boolean') { payload[k] = v; }
        else if (typeof v === 'string' && !v.trim() && !['nom', 'prenom', 'matricule_ref'].includes(k)) { /* skip */ }
        else { payload[k] = v; }
      });
      if (dossier) { const d = await modifierDossierMedical(dossier.id, payload); setDossier(d); dossierCacheRef.current[candidat.id] = d; }
      else { const d = await creerDossierMedical(payload); setDossier(d); dossierCacheRef.current[candidat.id] = d; }
      setEtape(2);
    } catch (e) {
      const errData = e.response?.data;
      let msg = 'Erreur dossier médical.';
      if (errData) { if (typeof errData === 'string') msg = errData; else if (errData.detail) msg = errData.detail; else if (errData.error) msg = errData.error; else msg = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '); }
      setErr(msg);
    } finally { setLoading(false); }
  };

  const handleEtape2 = async () => {
    if (isMessadineTemplate) {
      if (!sousseAptitudeChoice) { setErr("Sélectionnez un résultat d'aptitude."); return; }
    } else if (!fForm.aptitude && !isMateurDocChoiceFlow) {
      setErr('Sélectionnez une aptitude.');
      return;
    }
    if (isEmbaucheMateurFlow && embaucheMateurDocType === 'CERTIFICAT' && !String(fForm.type_visite || '').trim()) {
      setErr('Choisissez le type de visite pour le certificat Mateur.');
      return;
    }
    setLoading(true); setErr(''); setInfoMsg('');
    try {
      const collabPk = isVpFlow ? (candidat.collaborateurPk || candidat.collaborateur_id || null) : null;
      let typeVisiteOut = isSurveillanceSpeciale
        ? 'SURVEILLANCE_SPECIALE'
        : isPeriodique
          ? 'PERIODIQUE'
          : fForm.type_visite;
      let aptitudeOut = fForm.aptitude;
      // SMS Mateur: champ aptitude masqué dans l'UI, mais requis par l'API.
      if (isMateurDocChoiceFlow && !aptitudeOut) {
        aptitudeOut = 'APTE_AU_POSTE';
      }
      if (isMessadineTemplate) {
        aptitudeOut = sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE' ? 'INAPTE_TEMPORAIRE' : 'APTE_AU_POSTE';
        // Messadine : si le médecin choisit « Reprise MO-AT », on persiste type_visite=REPRISE
        // même en VP/SMS (la ligne reste rattachée via ligne_* et continue d'apparaître dans sa liste).
        if (sousseAptitudeChoice === 'REPRISE_MO_AT') {
          typeVisiteOut = 'REPRISE';
        }
      }
      const fichePayload = {
        collaborateur: collabPk,
        matricule: candidat?.matricule || '',
        date_visite: fForm.date_visite,
        type_visite: typeVisiteOut,
        aptitude: aptitudeOut,
        raison_sociale: fForm.raison_sociale || '',
        adresse_entreprise: fForm.adresse_entreprise || '',
        nature_activite: fForm.nature_activite || '',
        numero_cnss_entreprise: fForm.numero_cnss_entreprise || '',
        qualifications: fForm.qualifications || '',
        collaborateur_cnss: (fForm.collaborateur_cnss || '').trim(),
        numero_cnss: (fForm.collaborateur_cnss || '').trim(),
      };
      const pr = String(fForm.precision_aptitude || '').trim();
      // IMPORTANT: sur PUT/DRF, omettre le champ => l'ancienne valeur reste.
      // Toujours envoyer la précision (vide) pour éviter de garder une valeur d'un ancien mode.
      fichePayload.precision_aptitude = pr || '';
      if (isEmbaucheMateurFlow && embaucheMateurDocType === 'FICHE') {
        fichePayload.examens_ulterieurs = embaucheMaturExamRows;
      }
      if (isEmbaucheMateurFlow && embaucheMateurDocType === 'CERTIFICAT') {
        fichePayload.examens_ulterieurs = [];
      }
      if (isMessadineTemplate && sousseAptitudeChoice === 'APTITUDE') {
        fichePayload.duree_aptitude = String(fForm.duree_aptitude_date || '').trim();
      } else if (isMessadineTemplate && sousseAptitudeChoice === 'REPRISE_MO_AT') {
        fichePayload.duree_aptitude = '';
      } else if (isMessadineTemplate && sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE') {
        fichePayload.duree_aptitude = '';
      }
      /* VP : lier la ligne dès le POST si le serializer expose ligne_visite_periodique (évite un 2e appel). */
      if (isPeriodique && candidat?.id != null && !modeModif) {
        fichePayload.ligne_visite_periodique = candidat.id;
      }
      if (isSurveillanceSpeciale && candidat?.id != null && !modeModif) {
        fichePayload.ligne_surveillance_speciale = candidat.id;
      }
      let fiche;
      if (modeModif && ficheCreee?.id) { fiche = await modifierFicheAptitude(ficheCreee.id, fichePayload); }
      else {
        fiche = await creerFicheAptitude(fichePayload);
        if (isPeriodique) {
          const rawL = fiche?.ligne_visite_periodique;
          const dejaLie =
            Number(fiche?.ligne_visite_periodique_id ?? (typeof rawL === 'object' && rawL ? rawL.id : rawL)) ===
            Number(candidat.id);
          if (!dejaLie) {
            try {
              await rattacherFicheLignePeriodique(candidat.id, fiche.id, {
                listeId: candidat.liste_id ?? candidat.liste_visite_periodique,
              });
            } catch (e) {
              const reread = await getFicheAptitude(fiche.id).catch(() => null);
              const rL = reread?.ligne_visite_periodique;
              const ok =
                Number(reread?.ligne_visite_periodique_id ?? (typeof rL === 'object' && rL ? rL.id : rL)) ===
                Number(candidat.id);
              if (!ok) throw e;
            }
          }
        } else if (!isSurveillanceSpeciale) {
          await rattacherFicheAuCandidat(candidat.id, fiche.id);
        }
      }
      /* SMS Mateur : enregistrer tout de suite le formulaire annexe (évite perte si navigation avant le debounce). */
      if (isMateurDocChoiceFlow && fiche?.id) {
        try {
          await patchFicheAptitude(fiche.id, {
            observations_complementaires: JSON.stringify({
              __sms_mateur_v1: { version: 1, ...smsMateurForm },
            }),
          });
        } catch {
          /* l'effet auto-save réessaiera */
        }
      }
      let certificatLie = null;
      if (isEmbaucheMateurFlow && embaucheMateurDocType === 'CERTIFICAT') {
        const descObj = buildMateurCertificatDescriptionForApi(embaucheMateurCert, {
          type_visite: typeVisiteOut,
          aptitude: aptitudeOut,
          precision_aptitude: fForm.precision_aptitude,
        });
        const descStr = JSON.stringify(descObj);
        const existingCertId =
          fiche?.certificat?.id
          ?? ficheCreee?.certificat?.id
          ?? (typeof fiche?.certificat === 'number' ? fiche.certificat : null);
        if (existingCertId != null) {
          certificatLie = await modifierCertificat(existingCertId, {
            fiche_aptitude: fiche.id,
            date_emission: fForm.date_visite,
            description: descStr,
          });
        } else {
          certificatLie = await creerCertificat({
            fiche_aptitude: fiche.id,
            date_emission: fForm.date_visite,
            description: descStr,
          });
        }
        // Impression : buildCertificatAptitudeMateurHTML lit `form.description` ; si l’API ne renvoie pas la chaîne, on la garde côté client.
        if (certificatLie && (certificatLie.description == null || String(certificatLie.description).trim() === '')) {
          certificatLie = { ...certificatLie, description: descStr };
        }
      }
      const im = candidat?.im_data || {};
      const imAdresse = buildAdresseFromIm(im);
      setFicheCreee((prev) => {
        const mergedCert = certificatLie || fiche.certificat || prev?.certificat;
        return {
          ...fiche,
          ...(mergedCert ? { certificat: mergedCert } : {}),
          collaborateur_nom: candidat ? `${candidat.nom || ''} ${candidat.prenom || ''}`.trim() : (fiche.collaborateur_nom || ''),
          collaborateur_matricule: candidat?.matricule || fiche.collaborateur_matricule || '',
          collaborateur_date_naissance: fiche.collaborateur_date_naissance || im.date_naissance || candidat?.date_naissance || dForm?.date_naissance || '',
          collaborateur_lieu_naissance: fForm.collaborateur_lieu_naissance || fiche.collaborateur_lieu_naissance || im.lieu_naissance || dForm?.lieu_naissance || '',
          collaborateur_adresse: fForm.collaborateur_adresse || fiche.collaborateur_adresse || imAdresse || dForm?.adresse || candidat?.gouvernorat || '',
          collaborateur_cnss: fForm.collaborateur_cnss || pickCnssCollaborateur(candidat, fiche),
          collaborateur_cin: candidat?.cin || dForm?.cin || '',
          collaborateur_date_recrutement: fForm.collaborateur_date_recrutement || fiche.collaborateur_date_recrutement || im.date_embauche || candidat?.date_recrutement || '',
          collaborateur_poste: fForm.collaborateur_poste || fiche.collaborateur_poste || im.fonction || candidat?.poste || '',
          qualifications: fForm.qualifications || fiche.qualifications || candidat?.formation || '',
        };
      });
      if (isPeriodique && collabPk != null) {
        const syncPk = Number(collabPk);
        if (Number.isFinite(syncPk)) signalVpPeriodiqueExamenRh(syncPk);
      }
      setFForm((p) => ({
        ...p,
        aptitude: aptitudeOut,
        ...(!isVpFlow ? { type_visite: typeVisiteOut } : {}),
      }));
      if (isMateurDocChoiceFlow) {
        setEtape(3);
      } else if (isEmbaucheDocChoiceFlow) {
        setEtape((prev) => (prev === 3 ? 4 : 3));
      } else if (isEmbaucheMessadineDocsFlow) {
        setEtape(3);
      } else if (isEmbaucheMenzelDocsFlow) {
        setEtape(3);
      } else if (isVpMenzelDocsFlow || isVpMessadineDocsFlow) {
        setEtape(3);
      } else {
        setEtape(3);
      }
    } catch (e) { setErr(e.response?.data?.error || "Erreur fiche d'aptitude."); }
    finally { setLoading(false); }
  };

  const handleTerminer = async () => {
    // Confirmation finale (liste SMS / VP périodique Mateur) avant marquer "terminé"
    if (isMateurDocChoiceFlow && etape === 4) {
      const fullName = `${candidat?.nom || ''} ${candidat?.prenom || ''}`.trim() || 'Collaborateur';
      const matricule = candidat?.matricule ? String(candidat.matricule) : '—';
      const visitePhrase = isSurveillanceSpeciale
        ? 'surveillance médicale spéciale'
        : 'visite périodique';
      const res = await Swal.fire({
        icon: 'question',
        title: 'Finaliser le traitement ?',
        html: `<div style="text-align:left;line-height:1.5">
          <div><strong>${fullName}</strong></div>
          <div>Matricule : <strong>${matricule}</strong></div>
          <div style="margin-top:10px">
            Confirmez-vous que la <strong>${visitePhrase}</strong> est bien examinée et finalisée ?
          </div>
        </div>`,
        showCancelButton: true,
        confirmButtonText: 'Oui, terminer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#0284c7',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
      });
      if (!res.isConfirmed) return;
    }

    // Confirmation finale (SMS Messadine) avant marquer "terminé"
    if (isSmsMessadineDocsFlow && etape === 4) {
      const fullName = `${candidat?.nom || ''} ${candidat?.prenom || ''}`.trim() || 'Collaborateur';
      const matricule = candidat?.matricule ? String(candidat.matricule) : '—';
      const res = await Swal.fire({
        icon: 'question',
        title: 'Finaliser le traitement ?',
        html: `<div style="text-align:left;line-height:1.5">
          <div><strong>${fullName}</strong></div>
          <div>Matricule : <strong>${matricule}</strong></div>
          <div style="margin-top:10px">
            Confirmez-vous que la visite de <strong>surveillance médicale spéciale</strong> est bien examinée et finalisée ?
          </div>
        </div>`,
        showCancelButton: true,
        confirmButtonText: 'Oui, terminer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#0284c7',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
      });
      if (!res.isConfirmed) return;
    }

    // Confirmation finale (VP Menzel ou VP Messadine « Documents ») avant marquer "terminé"
    if ((isVpMenzelDocsFlow || isVpMessadineDocsFlow) && etape === 4) {
      const fullName = `${candidat?.nom || ''} ${candidat?.prenom || ''}`.trim() || 'Collaborateur';
      const matricule = candidat?.matricule ? String(candidat.matricule) : '—';
      const visiteLabel = isSurveillanceSpeciale ? 'surveillance médicale spéciale' : 'visite périodique';
      const res = await Swal.fire({
        icon: 'question',
        title: 'Finaliser le traitement ?',
        html: `<div style="text-align:left;line-height:1.5">
          <div><strong>${fullName}</strong></div>
          <div>Matricule : <strong>${matricule}</strong></div>
          <div style="margin-top:10px">
            Confirmez-vous que la <strong>${visiteLabel}</strong> est bien examinée et finalisée ?
          </div>
        </div>`,
        showCancelButton: true,
        confirmButtonText: 'Oui, terminer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#0284c7',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
      });
      if (!res.isConfirmed) return;
    }

    // Confirmation finale (Embauche) avant marquer "terminé"
    if ((isEmbaucheDocChoiceFlow || isEmbaucheMessadineDocsFlow || isEmbaucheMenzelDocsFlow) && etape === 4) {
      const fullName = `${candidat?.nom || ''} ${candidat?.prenom || ''}`.trim() || 'Collaborateur';
      const matricule = candidat?.matricule ? String(candidat.matricule) : '—';
      const res = await Swal.fire({
        icon: 'question',
        title: 'Finaliser le traitement ?',
        html: `<div style="text-align:left;line-height:1.5">
          <div><strong>${fullName}</strong></div>
          <div>Matricule : <strong>${matricule}</strong></div>
          <div style="margin-top:10px">
            Confirmez-vous que la visite d'<strong>embauche</strong> est bien examinée et finalisée ?
          </div>
        </div>`,
        showCancelButton: true,
        confirmButtonText: 'Oui, terminer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#0284c7',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
      });
      if (!res.isConfirmed) return;
    }

    setLoading(true);
    try {
      if (!isVpFlow && obs.trim()) {
        await ajouterObservationsCandidat(candidat.id, obs);
      } else if (isVpFlow && ficheCreee?.id) {
        const trimmed = obs.trim();
        let smsJsonSaved = false;
        // SMS Mateur : persister le formulaire spécifique dans observations_complementaires (JSON),
        // sans impacter les autres sites / flux.
        if (isMateurDocChoiceFlow) {
          const smsPayload = {
            __sms_mateur_v1: {
              version: 1,
              ...smsMateurForm,
              observations_libres: trimmed || '',
            },
          };
          try {
            await patchFicheAptitude(ficheCreee.id, { observations_complementaires: JSON.stringify(smsPayload) });
            // IMPORTANT: ne pas écraser ensuite observations_complementaires par du texte simple,
            // sinon le backend ne peut plus synchroniser la table SMS Mateur.
            smsJsonSaved = true;
          } catch {
            // fallback sera géré par le flux existant (PUT) si nécessaire
          }
        }
        let persisted = false;
        const attempts = smsJsonSaved
          ? [
              // Ne pas toucher observations_complementaires (JSON SMS)
              { observations_medecin: trimmed || null },
            ]
          : [
              { observations_complementaires: trimmed || null },
              { observations_medecin: trimmed || null },
            ];
        for (const body of attempts) {
          try {
            await patchFicheAptitude(ficheCreee.id, body);
            persisted = true;
            break;
          } catch {
            /* essai suivant ou fallback PUT */
          }
        }
        if (!persisted) {
          const fresh = await getFicheAptitude(ficheCreee.id);
          const collabPk = candidat.collaborateurPk || candidat.collaborateur_id || fresh.collaborateur;
          let aptitudeVp = fForm.aptitude;
          if (isMessadineTemplate) {
            aptitudeVp = sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE' ? 'INAPTE_TEMPORAIRE' : 'APTE_AU_POSTE';
          }
          let typeVisiteVp = isSurveillanceSpeciale ? 'SURVEILLANCE_SPECIALE' : 'PERIODIQUE';
          if (isMessadineTemplate && sousseAptitudeChoice === 'REPRISE_MO_AT') typeVisiteVp = 'REPRISE';
          const fichePayload = {
            collaborateur: collabPk,
            matricule: candidat?.matricule || fresh.matricule || '',
            date_visite: fForm.date_visite,
            type_visite: typeVisiteVp,
            aptitude: aptitudeVp,
            raison_sociale: fForm.raison_sociale || fresh.raison_sociale || '',
            adresse_entreprise: fForm.adresse_entreprise || fresh.adresse_entreprise || '',
            nature_activite: fForm.nature_activite || fresh.nature_activite || '',
            numero_cnss_entreprise: fForm.numero_cnss_entreprise || fresh.numero_cnss_entreprise || '',
            qualifications: fForm.qualifications || fresh.qualifications || '',
            collaborateur_cnss: (fForm.collaborateur_cnss || '').trim(),
            numero_cnss: (fForm.collaborateur_cnss || '').trim(),
            observations_complementaires: trimmed || null,
          };
          const pr2 = String(fForm.precision_aptitude || '').trim();
          fichePayload.precision_aptitude = pr2 || '';
          if (isMessadineTemplate && sousseAptitudeChoice === 'APTITUDE') {
            fichePayload.duree_aptitude = String(fForm.duree_aptitude_date || '').trim();
          } else if (isMessadineTemplate && (sousseAptitudeChoice === 'REPRISE_MO_AT' || sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE')) {
            fichePayload.duree_aptitude = '';
          }
          await modifierFicheAptitude(ficheCreee.id, fichePayload);
        }
      }
    } catch {
      /* no-op */
    }
    if (isPeriodique) {
      const syncPk = Number(candidat?.collaborateurPk ?? candidat?.collaborateur_id);
      if (Number.isFinite(syncPk)) signalVpPeriodiqueExamenRh(syncPk);
    }
    if (isSurveillanceSpeciale && ficheCreee?.id && candidat?.id != null) {
      try {
        const rem = obs.trim();
        await terminerTraitementLigneSurveillanceSpeciale(
          candidat.id,
          rem ? { remarque_medecin: rem } : {},
        );
      } catch {
        /* la fiche est enregistrée ; l’infirmier pourra reclôturer côté liste si besoin */
      }
    }
    setLoading(false);
    try {
      const stableKey = panelDraftKeyForCandidat(mode, candidat);
      const dk = `${mode}:${stableKey}`;
      const pk = panelDraftStorageKey(mode, stableKey);
      const sk = smsMateurDraftStorageKey(mode, candidat.id);
      delete panelDraftsRef.current[dk];
      localStorage.removeItem(pk);
      localStorage.removeItem(sk);
      sessionStorage.removeItem(pk);
      sessionStorage.removeItem(sk);
    } catch { /* no-op */ }
    panelHydratedKeyRef.current = '';
    onDone();
  };

  const etape2CanSubmitAptitude = isMessadineTemplate
    ? !!sousseAptitudeChoice
    : (isMateurDocChoiceFlow
      ? true
      : isEmbaucheDocChoiceFlow
        ? !!fForm.aptitude
        : isEmbaucheMateurFlow && embaucheMateurDocType === 'CERTIFICAT'
          ? (!!fForm.aptitude && !!String(fForm.type_visite || '').trim())
          : !!fForm.aptitude);
  const APTE_CHOISIE = isMessadineTemplate && sousseAptitudeChoice && MESSADINE_APT_RESUME[sousseAptitudeChoice]
    ? MESSADINE_APT_RESUME[sousseAptitudeChoice]
    : APTITUDE_CHOICES.find(a => a.val === fForm.aptitude);

  const postePourResume =
    [ficheCreee?.collaborateur_poste, fForm.collaborateur_poste, collabDb?.poste, candidat?.poste, candidat?.im_data?.fonction, candidat?.fonction]
      .map((x) => (x == null || x === '' ? '' : String(x).trim()))
      .find(Boolean) || '—';

  if (!candidat) {
    return (
      <div style={{ flex: 1, background: 'white', borderRadius: 16, border: `1.5px solid ${SKY[100]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: SKY[50], border: `2px solid ${SKY[100]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={SKY[300]} strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: SKY[800] }}>{isVpFlow ? 'Sélectionnez un collaborateur' : 'Sélectionnez un candidat'}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{isSurveillanceSpeciale ? 'Cliquez sur une ligne de la liste SMS pour créer la fiche d’aptitude' : isPeriodique ? "Cliquez sur une ligne de la liste périodique pour commencer l'examen" : 'Cliquez sur un candidat dans la liste pour commencer'}</div>
        </div>
      </div>
    );
  }

  if (loadingDossier) {
    return (
      <div style={{ flex: 1, background: 'white', borderRadius: 16, border: `1.5px solid ${SKY[100]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: SKY[500], fontSize: 14, fontWeight: 600 }}>
        <div style={{ width: 24, height: 24, border: `3px solid ${SKY[100]}`, borderTopColor: SKY[500], borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        Chargement dossier…
      </div>
    );
  }

  const showMessadineOngletsListeJour =
    (isMessadineTemplate || isVpMenzelDocsFlow || isEmbaucheMenzelDocsFlow)
    && !!ficheCreee?.id
    && ((isSmsMessadineDocsFlow || isEmbaucheMessadineDocsFlow || isVpMessadineDocsFlow || isVpMenzelDocsFlow || isEmbaucheMenzelDocsFlow) ? etape === 3 : etape >= 2);
  const masquerFooterActionsListeJour = showMessadineOngletsListeJour && listeJourMessadineTab !== 'fiche';

  const BtnOutline = ({ onClick, children }) => {
    const [hov, setHov] = useState(false);
    return (
      <button onClick={onClick}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ padding: '9px 16px', borderRadius: 11, border: `1.5px solid ${hov ? SKY[300] : '#e2e8f0'}`, background: hov ? SKY[50] : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: hov ? SKY[700] : '#475569', fontFamily: 'inherit', transition: 'all .15s' }}>
        {children}
      </button>
    );
  };

  return (
    <div style={{ flex: 1, background: 'white', borderRadius: 16, border: `1.5px solid ${SKY[100]}`, boxShadow: `0 4px 16px ${SKY[100]}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header candidat — dégradé ciel clair ── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ background: 'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 45%, #7dd3fc 100%)', padding: '16px 22px 14px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid #bae6fd' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, flexShrink: 0, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', border: '2px solid rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 14px rgba(2,132,199,.3)' }}>
              {(candidat.nom?.[0] || '?').toUpperCase()}{(candidat.prenom?.[0] || '').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0c4a6e' }}>{candidat.nom} {candidat.prenom}</div>
              <div style={{ fontSize: 11.5, color: '#0369a1', fontWeight: 600, marginTop: 3, display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: 'monospace' }}>{candidat.matricule || '—'}</span>
                {candidat.poste && <span>📌 {candidat.poste}</span>}
              </div>
            </div>
            {modeModif && (
              <span style={{ background: 'rgba(2,132,199,.15)', border: '1px solid rgba(2,132,199,.3)', color: '#0369a1', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                ✓ Déjà examiné
              </span>
            )}
          </div>
        </div>

        {/* Stepper — VP : seulement fiche + finalisation (dossier via « Modifier le dossier ») */}
        <div style={{ display: 'flex', borderBottom: `1.5px solid ${SKY[100]}`, background: 'white', flexDirection: 'column' }}>
          {isVpFlow && etape === 1 && (
            <div style={{ padding: '8px 14px', fontSize: 11.5, fontWeight: 700, color: SKY[700], background: SKY[50], borderBottom: `1px solid ${SKY[100]}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span>Dossier médical (consultation)</span>
              <button type="button" onClick={() => { setErr(''); setEtape(2); }} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${SKY[200]}`, background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: SKY[700], fontFamily: 'inherit' }}>
                ← Fiche d&apos;aptitude
              </button>
            </div>
          )}
          <div style={{ display: 'flex' }}>
            {(() => {
              const steps = isVpFlow
                ? (isMateurDocChoiceFlow
                  ? [{ n: 2, label: 'Fiche SMS', k: 'a' }, { n: 3, label: 'Choix document', k: 'b' }, { n: 4, label: 'Finalisation', k: 'c' }]
                  : ((isSmsMessadineDocsFlow || isVpMessadineDocsFlow)
                    ? [{ n: 2, label: "Fiche d'aptitude", k: 'a' }, { n: 3, label: 'Documents', k: 'b' }, { n: 4, label: 'Finalisation', k: 'c' }]
                    : (isVpMenzelDocsFlow
                      ? [{ n: 2, label: "Fiche d'aptitude", k: 'a' }, { n: 3, label: 'Documents', k: 'b' }, { n: 4, label: 'Finalisation', k: 'c' }]
                      : [{ n: 2, label: "Fiche d'aptitude", k: 'a' }, { n: 3, label: 'Finalisation', k: 'b' }])))
                : (isEmbaucheDocChoiceFlow
                  ? [{ n: 1, label: 'Dossier médical', k: '1' }, { n: 2, label: "Fiche d'aptitude", k: '2' }, { n: 3, label: 'Choix document', k: '3' }, { n: 4, label: 'Finalisation', k: '4' }]
                  : (isEmbaucheMessadineDocsFlow
                    ? [{ n: 1, label: 'Dossier médical', k: '1' }, { n: 2, label: "Fiche d'aptitude", k: '2' }, { n: 3, label: 'Documents', k: '3' }, { n: 4, label: 'Finalisation', k: '4' }]
                    : (isEmbaucheMenzelDocsFlow
                      ? [{ n: 1, label: 'Dossier médical', k: '1' }, { n: 2, label: "Fiche d'aptitude", k: '2' }, { n: 3, label: 'Documents', k: '3' }, { n: 4, label: 'Finalisation', k: '4' }]
                      : [{ n: 1, label: 'Dossier médical', k: '1' }, { n: 2, label: "Fiche d'aptitude", k: '2' }, { n: 3, label: 'Finalisation', k: '3' }])));

              return steps.map((s) => (
              <button
                key={s.k}
                type="button"
                onClick={() => {
                  // Stepper cliquable :
                  // - SMS Mateur : (2..4) après création
                  // - Embauche / Périodique / Fiches du jour : navigation libre vers 1/2, et vers Finalisation uniquement si une fiche existe
                  if (isMateurDocChoiceFlow) {
                    if (s.n <= 2) { setEtape(2); return; }
                    if (!ficheCreee?.id) return;
                    setEtape(s.n);
                    return;
                  }
                  // VP / Surveillance spéciale (hors SMS Mateur) : étapes 2..3 uniquement
                  if (isVpFlow) {
                    if (s.n === 2) { setEtape(2); return; }
                    if (s.n === 3) {
                      if (!ficheCreee?.id) return;
                      setEtape(3);
                    }
                    if (s.n === 4 && (isSmsMessadineDocsFlow || isVpMessadineDocsFlow || isVpMenzelDocsFlow || isEmbaucheMessadineDocsFlow || isEmbaucheMenzelDocsFlow)) {
                      if (!ficheCreee?.id) return;
                      setEtape(4);
                    }
                    return;
                  }
                  if (s.n === 1) { setEtape(1); return; }
                  if (s.n === 2) { setEtape(2); return; }
                  if (s.n === 3) {
                    if (!ficheCreee?.id) return;
                    setEtape(3);
                  }
                  if (s.n === 4) {
                    if (!ficheCreee?.id) return;
                    setEtape(4);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: (isMateurDocChoiceFlow && (s.n <= 2 || !!ficheCreee?.id))
                    || (isVpFlow && (s.n === 2 || (s.n === 3 && !!ficheCreee?.id) || ((isSmsMessadineDocsFlow || isVpMessadineDocsFlow || isVpMenzelDocsFlow || isMateurDocChoiceFlow) && s.n === 4 && !!ficheCreee?.id)))
                    || (!isVpFlow && (s.n < 3 || !!ficheCreee?.id))
                    ? 'pointer'
                    : 'default',
                  borderBottom: `3px solid ${etape === s.n ? SKY[500] : etape > s.n ? SKY[200] : 'transparent'}`,
                  marginBottom: -1.5,
                  fontFamily: 'inherit',
                }}
                title={
                  isMateurDocChoiceFlow || !isVpFlow
                    ? 'Aller à cette étape'
                    : undefined
                }
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: etape > s.n ? SKY[500] : etape === s.n ? SKY[50] : '#f1f5f9', color: etape > s.n ? 'white' : etape === s.n ? SKY[600] : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, border: `2px solid ${etape >= s.n ? SKY[400] : '#e2e8f0'}` }}>
                  {isVpFlow
                    ? (etape > s.n
                      ? '✓'
                      : (isMateurDocChoiceFlow
                        ? (s.n === 2 ? '1' : s.n === 3 ? '2' : '3')
                        : ((isSmsMessadineDocsFlow || isVpMessadineDocsFlow)
                          ? (s.n === 2 ? '1' : s.n === 3 ? '2' : '3')
                          : (isVpMenzelDocsFlow
                            ? (s.n === 2 ? '1' : s.n === 3 ? '2' : '3')
                            : (s.n === 2 ? '1' : '2')))))
                    : (etape > s.n ? '✓' : s.n)}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: etape === s.n ? SKY[700] : etape > s.n ? '#475569' : '#94a3b8' }}>{s.label}</span>
              </button>
              ));
            })()}
          </div>
        </div>

        {/* Messadine — onglets alignés sur Detailfiche (Fiches du jour) : embauche, VP, SMS */}
        {showMessadineOngletsListeJour && (
          <div style={{ display: 'flex', borderBottom: `2px solid ${SKY[100]}`, background: 'white', padding: '0 6px' }}>
            {(() => {
              const baseTabs = (isVpMenzelDocsFlow || isEmbaucheMenzelDocsFlow) ? MENZEL_LISTE_JOUR_ONGLETS : MESSADINE_LISTE_JOUR_ONGLETS;
              const hideFicheOnDocsStep = (isSmsMessadineDocsFlow || isEmbaucheMessadineDocsFlow || isVpMessadineDocsFlow || isVpMenzelDocsFlow || isEmbaucheMenzelDocsFlow) && etape === 3;
              const tabs = hideFicheOnDocsStep ? baseTabs.filter((t) => t.id !== 'fiche') : baseTabs;
              return tabs;
            })().map(({ id, label, Icon }) => {
              const active = listeJourMessadineTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setListeJourMessadineTab(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '11px 16px',
                    border: 'none',
                    borderBottom: `3px solid ${active ? SKY[500] : 'transparent'}`,
                    marginBottom: -2,
                    borderRadius: 0,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                    fontWeight: active ? 800 : 500,
                    background: 'transparent',
                    color: active ? SKY[700] : '#94a3b8',
                    transition: 'all .13s',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = SKY[600]; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <span style={{ opacity: active ? 1 : 0.6 }}>{createElement(Icon)}</span>
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
        <style>{`.ve-inp:focus{border-color:${SKY[400]}!important;box-shadow:0 0 0 3px ${SKY[100]}!important;outline:none}`}</style>

        {showMessadineOngletsListeJour && listeJourMessadineTab !== 'fiche' ? (
          <div style={{ minHeight: 360, display: 'flex', flexDirection: 'column' }}>
            {listeJourMessadineTab === 'bilan' && <TabBilan fiche={ficheCreee} />}
            {listeJourMessadineTab === 'examen' && <TabExamen fiche={ficheCreee} onFicheUpdated={handleFicheUpdatedListeJourMessadine} />}
            {listeJourMessadineTab === 'ordonnance' && <TabOrdonnance fiche={ficheCreee} onFicheUpdated={handleFicheUpdatedListeJourMessadine} />}
            {listeJourMessadineTab === 'liaison' && <TabFicheLiaison fiche={ficheCreee} onFicheUpdated={handleFicheUpdatedListeJourMessadine} />}
            {listeJourMessadineTab === 'certificat' && <TabCertificat fiche={ficheCreee} onFicheUpdated={handleFicheUpdatedListeJourMessadine} />}
          </div>
        ) : (
        <>
        {err && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', padding: '10px 13px', borderRadius: 11, fontSize: 12.5, marginBottom: 14 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {err}
            <button onClick={() => setErr('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 18, marginLeft: 'auto', lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* ── Étape 1 : Dossier ── */}
        {etape === 1 && (
          <div>
            {(isSurveillanceSpeciale || isPeriodique) && (
              <div style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, marginBottom: 14, background: dataSource === 'dossier' ? '#f0fdf4' : dataSource === 'im_db' ? SKY[50] : '#fffbeb', border: `1.5px solid ${dataSource === 'dossier' ? '#86efac' : dataSource === 'im_db' ? SKY[200] : '#fde68a'}`, color: dataSource === 'dossier' ? '#15803d' : dataSource === 'im_db' ? SKY[700] : '#a16207', display: 'flex', alignItems: 'center', gap: 7 }}>
                <strong>Source :</strong>
                {dataSource === 'dossier' ? '✓ Dossier médical existant' : dataSource === 'im_db' ? (isSurveillanceSpeciale ? 'ℹ Données RH — surveillance médicale spéciale' : isPeriodique ? 'ℹ Données RH — visite périodique (consultation optionnelle)' : 'ℹ RH (im_db) — à vérifier') : isSurveillanceSpeciale ? 'Surveillance médicale spéciale' : isPeriodique ? 'Visite périodique' : '⚠ Liste embauche — à compléter'}
              </div>
            )}

            <SectionTitle>Identification</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 14 }}>
              <div><label style={lblSx}>Nom *</label><input className="ve-inp" value={dForm.nom} onChange={setD('nom')} style={inpSx} /></div>
              <div><label style={lblSx}>Prénom *</label><input className="ve-inp" value={dForm.prenom} onChange={setD('prenom')} style={inpSx} /></div>
              <div><label style={lblSx}>Matricule</label><input value={dForm.matricule_ref} style={roInpSx} readOnly /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 14 }}>
              <div><label style={lblSx}>Date naissance</label><input className="ve-inp" type="date" value={dForm.date_naissance} onChange={setD('date_naissance')} style={inpSx} /></div>
              <div><label style={lblSx}>Lieu de naissance</label><input className="ve-inp" value={dForm.lieu_naissance} onChange={setD('lieu_naissance')} placeholder="Ville…" style={inpSx} /></div>
              <div>
                <label style={lblSx}>Groupe sanguin</label>
                <select className="ve-inp" value={dForm.groupe_sanguin} onChange={setD('groupe_sanguin')} style={{ ...inpSx, cursor: 'pointer' }}>
                  <option value="">—</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lblSx}>Adresse</label>
              <textarea className="ve-inp" value={dForm.adresse} onChange={setD('adresse')} rows={2} placeholder="Adresse complète…" style={{ ...inpSx, resize: 'vertical' }} />
            </div>

            <SectionTitle>Antécédents</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 14 }}>
              <div><label style={lblSx}>Médicaux</label><textarea className="ve-inp" value={dForm.antecedents_medicaux} onChange={setD('antecedents_medicaux')} rows={3} placeholder="HTA, diabète…" style={{ ...inpSx, resize: 'vertical' }} /></div>
              <div><label style={lblSx}>Chirurgicaux</label><textarea className="ve-inp" value={dForm.antecedents_chirurgicaux} onChange={setD('antecedents_chirurgicaux')} rows={3} style={{ ...inpSx, resize: 'vertical' }} /></div>
              <div><label style={lblSx}>Gynécologiques</label><textarea className="ve-inp" value={dForm.antecedents_gyneco} onChange={setD('antecedents_gyneco')} rows={3} style={{ ...inpSx, resize: 'vertical' }} /></div>
              <div><label style={lblSx}>Familiaux</label><textarea className="ve-inp" value={dForm.antecedents_familiaux} onChange={setD('antecedents_familiaux')} rows={3} style={{ ...inpSx, resize: 'vertical' }} /></div>
            </div>

            <SectionTitle>Allergies</SectionTitle>
            <div style={{ marginBottom: 14 }}>
              <textarea className="ve-inp" value={dForm.allergies} onChange={setD('allergies')} rows={2} placeholder="Médicaments, aliments…" style={{ ...inpSx, resize: 'vertical' }} />
            </div>

            <SectionTitle>Vaccinations</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 14 }}>
              <div><label style={lblSx}>Tuberculose</label><input className="ve-inp" type="date" value={dForm.vaccin_tuberculose} onChange={setD('vaccin_tuberculose')} style={inpSx} /></div>
              <div><label style={lblSx}>Tétanos</label><input className="ve-inp" type="date" value={dForm.vaccin_tetanos} onChange={setD('vaccin_tetanos')} style={inpSx} /></div>
              <div><label style={lblSx}>Hépatite</label><input className="ve-inp" type="date" value={dForm.vaccin_hepatite} onChange={setD('vaccin_hepatite')} style={inpSx} /></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lblSx}>Autres vaccins</label>
              <textarea className="ve-inp" value={dForm.autres_vaccins} onChange={setD('autres_vaccins')} rows={2} style={{ ...inpSx, resize: 'vertical' }} />
            </div>

            <SectionTitle>Habitudes de vie</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
              {[{ key: 'tabac', label: 'Tabac' }, { key: 'alcool', label: 'Alcool' }, { key: 'automedication', label: 'Automédication' }].map(h => (
                <CheckBoxItem key={h.key} label={h.label} checked={dForm[h.key]} onToggle={() => setDForm(p => ({ ...p, [h.key]: !p[h.key] }))} />
              ))}
            </div>
          </div>
        )}

        {/* ── Étape 2 : Fiche aptitude ── */}
        {etape === 2 && (
          <div>
            {modeModif && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', color: '#a16207', padding: '9px 12px', borderRadius: 11, fontSize: 12.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                ✏️ Modification de la fiche existante
              </div>
            )}
            {isEmbaucheMateurFlow ? (
              <EmbaucheMateurEtape2
                SKY={SKY}
                inpSx={inpSx}
                lblSx={lblSx}
                APT_STYLE={APT_STYLE}
                aptitudeChoices={APTITUDE_CHOICES}
                fForm={fForm}
                setFForm={setFForm}
                enterpriseReadOnly={enterpriseReadOnly}
                embaucheMateurDocType={'FICHE'}
                setEmbaucheMateurDocType={() => {}}
                embaucheMaturExamRows={embaucheMaturExamRows}
                setEmbaucheMaturExamRows={setEmbaucheMaturExamRows}
                embaucheMateurCert={embaucheMateurCert}
                setEmbaucheMateurCert={setEmbaucheMateurCert}
                hideDocChoice
              />
            ) : (
              <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div><label style={lblSx}>Date de visite *</label><input className="ve-inp" type="date" value={fForm.date_visite} onChange={setF('date_visite')} style={inpSx} /></div>
              <div><label style={lblSx}>Type de visite</label><input value={isSurveillanceSpeciale ? 'Surveillance médicale spéciale' : isPeriodique ? 'Visite périodique' : "Visite d'embauche"} style={roInpSx} readOnly /></div>
            </div>

            {!isMateurDocChoiceFlow && !hideEntrepriseBlockMessadine && (
              <>
                <SectionTitle>1 — L'Entreprise</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
                  <div><label style={lblSx}>Raison sociale</label><input className="ve-inp" value={fForm.raison_sociale} onChange={setF('raison_sociale')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : inpSx.background, cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} /></div>
                  <div><label style={lblSx}>Adresse</label><input className="ve-inp" value={fForm.adresse_entreprise} onChange={setF('adresse_entreprise')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : inpSx.background, cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} /></div>
                  <div><label style={lblSx}>Nature d'activité</label><input className="ve-inp" value={fForm.nature_activite} onChange={setF('nature_activite')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : inpSx.background, cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} /></div>
                  <div><label style={lblSx}>N° CNSS</label><input className="ve-inp" value={fForm.numero_cnss_entreprise} onChange={setF('numero_cnss_entreprise')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : inpSx.background, cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} /></div>
                </div>
              </>
            )}

            {/* Menzel : bloc travailleur complet. Messadine : aligné sur Nouvelle fiche — pas de section formulaire travailleur (données toujours hydratées pour l’API). */}
            {!isMateurDocChoiceFlow && !isMessadineTemplate && (
              <>
                <SectionTitle>{hideEntrepriseBlockMessadine ? '1 — Le Travailleur' : '2 — Le Travailleur'}</SectionTitle>
                {(isVpFlow || collabDbLoading || collabDbErr) && (
                  <div
                    style={{
                      margin: '0 0 10px',
                      padding: '8px 12px',
                      borderRadius: 11,
                      background: collabDbErr ? '#fef2f2' : '#eff6ff',
                      border: `1.5px solid ${collabDbErr ? '#fecaca' : '#bfdbfe'}`,
                      color: collabDbErr ? '#b91c1c' : '#1d4ed8',
                      fontSize: 12.5,
                      fontWeight: 650,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span aria-hidden style={{ opacity: 0.9 }}>
                      {collabDbErr ? '⚠️' : collabDbLoading ? '⏳' : 'ℹ️'}
                    </span>
                    <span>
                      {collabDbErr
                        ? collabDbErr
                        : collabDbLoading
                          ? 'Récupération automatique des informations du collaborateur…'
                          : 'Informations du collaborateur récupérées automatiquement depuis la base (lecture seule).'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
                  <div><label style={lblSx}>Nom et prénom</label><input value={`${candidat?.nom || ''} ${candidat?.prenom || ''}`.trim()} style={roInpSx} readOnly /></div>
                  <div><label style={lblSx}>Date et lieu de naissance</label><input value={`${dForm?.date_naissance || ''}${fForm.collaborateur_lieu_naissance ? ` à ${fForm.collaborateur_lieu_naissance}` : ''}`} style={roInpSx} readOnly /></div>
                  <div><label style={lblSx}>Adresse</label><input className="ve-inp" value={fForm.collaborateur_adresse} onChange={setF('collaborateur_adresse')} readOnly={isVpFlow} style={{ ...inpSx, background: isVpFlow ? '#f8fafc' : inpSx.background, cursor: isVpFlow ? 'not-allowed' : 'text' }} /></div>
                  <div><label style={lblSx}>Lieu de naissance</label><input className="ve-inp" value={fForm.collaborateur_lieu_naissance} onChange={setF('collaborateur_lieu_naissance')} readOnly={isVpFlow} style={{ ...inpSx, background: isVpFlow ? '#f8fafc' : inpSx.background, cursor: isVpFlow ? 'not-allowed' : 'text' }} /></div>
                  <div><label style={lblSx}>N° CNSS</label><input className="ve-inp" value={fForm.collaborateur_cnss} onChange={setF('collaborateur_cnss')} placeholder={isVpFlow ? '' : 'Saisir si absent…'} readOnly={isVpFlow} style={{ ...inpSx, fontFamily: 'monospace', background: isVpFlow ? '#f8fafc' : inpSx.background, cursor: isVpFlow ? 'not-allowed' : 'text' }} /></div>
                  <div><label style={lblSx}>Qualifications</label><input className="ve-inp" value={fForm.qualifications} onChange={setF('qualifications')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : inpSx.background, cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} /></div>
                  <div><label style={lblSx}>Date recrutement</label><input className="ve-inp" type="date" value={fForm.collaborateur_date_recrutement} onChange={setF('collaborateur_date_recrutement')} readOnly={isVpFlow} style={{ ...inpSx, background: isVpFlow ? '#f8fafc' : inpSx.background, cursor: isVpFlow ? 'not-allowed' : 'text' }} /></div>
                  <div><label style={lblSx}>Poste de travail</label><input className="ve-inp" value={fForm.collaborateur_poste} onChange={setF('collaborateur_poste')} readOnly={isVpFlow} style={{ ...inpSx, background: isVpFlow ? '#f8fafc' : inpSx.background, cursor: isVpFlow ? 'not-allowed' : 'text' }} /></div>
                </div>
              </>
            )}

            {!isMateurDocChoiceFlow && (
              <>
              <SectionTitle>{isMessadineTemplate ? "Résultat d'aptitude *" : 'Conclusion médicale *'}</SectionTitle>
              {isMessadineTemplate ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  {[
                    { key: 'APTITUDE', label: 'Aptitude', cls: 'g' },
                    { key: 'REPRISE_MO_AT', label: 'Reprise MO-AT', cls: 'a' },
                    { key: 'APTITUDE_TEMPORAIRE', label: 'Aptitude temporaire', cls: 'r' },
                  ].map((a) => {
                    const s = APT_STYLE[a.cls];
                    const sel = sousseAptitudeChoice === a.key;
                    return (
                      <div
                        key={a.key}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
                        onClick={() => {
                          setSousseAptitudeChoice(a.key);
                          setFForm((p) => {
                            const next = {
                              ...p,
                              aptitude: a.key === 'APTITUDE_TEMPORAIRE' ? 'INAPTE_TEMPORAIRE' : 'APTE_AU_POSTE',
                            };
                            if (!isVpFlow) {
                              if (a.key === 'REPRISE_MO_AT') next.type_visite = 'REPRISE';
                              else next.type_visite = isSurveillanceSpeciale ? 'SURVEILLANCE_SPECIALE' : isPeriodique ? 'PERIODIQUE' : 'EMBAUCHE';
                            }
                            // Reset champs entre modes (évite résidus qui faussent l'impression et deriveMessadineCertificatChoice).
                            if (a.key !== 'APTITUDE') next.duree_aptitude_date = '';
                            if (a.key !== 'REPRISE_MO_AT') {
                              // En reprise on saisit un texte/date libre; sinon on vide pour éviter confusion.
                              next.precision_aptitude = '';
                            }
                            return next;
                          });
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '11px 13px', borderRadius: 11, cursor: 'pointer',
                          border: `2px solid ${sel ? s.selBorder : '#e2e8f0'}`,
                          background: sel ? s.selBg : '#f8fafc',
                          color: sel ? s.color : '#64748b',
                          fontSize: 12.5, fontWeight: sel ? 700 : 500,
                          transition: 'all .15s cubic-bezier(.4,0,.2,1)',
                          boxShadow: sel ? `0 4px 14px ${s.dot}25` : 'none',
                          transform: sel ? 'translateY(-1px)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: sel ? s.dot : '#e2e8f0',
                            flexShrink: 0, transition: 'background .15s',
                          }}
                        />
                        {a.label}
                      </div>
                    );
                  })}
                </div>
                {(!!sousseAptitudeChoice) && (
                  <div style={{
                    padding: '14px 16px',
                    marginBottom: 16,
                    background: `linear-gradient(135deg, ${SKY[50]}, #f0f9ff)`,
                    border: `1.5px solid ${SKY[200]}`,
                    borderRadius: 12,
                  }}
                  >
                    {sousseAptitudeChoice === 'APTITUDE' && (
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                          <label style={lblSx}>1) Est apte/inapte pour le poste de</label>
                          <div style={{ fontSize: 12.5, color: '#0c4a6e', fontWeight: 800, marginTop: 6, lineHeight: 1.45 }}>
                            {String(fForm.collaborateur_poste || candidat?.poste || candidat?.im_data?.fonction || '—').trim() || '—'}
                          </div>
                          <input className="ve-inp" type="text" value={fForm.precision_aptitude} onChange={setF('precision_aptitude')} placeholder="Précision médicale, restrictions, etc." style={{ ...inpSx, marginTop: 6, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={lblSx}>et ce pour une durée de</label>
                          <input className="ve-inp" type="text" value={fForm.duree_aptitude_date || ''} onChange={setF('duree_aptitude_date')} placeholder="Ex. : 6 mois / jusqu’au …" style={{ ...inpSx, marginTop: 6, maxWidth: 420 }} />
                        </div>
                      </div>
                    )}
                    {sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE' && (
                      <div>
                        <label style={lblSx}>2) Est apte temporairement pour une période de</label>
                        <input className="ve-inp" type="text" value={fForm.precision_aptitude} onChange={setF('precision_aptitude')} placeholder="Ex. : 3 mois" style={{ ...inpSx, marginTop: 6, width: '100%', boxSizing: 'border-box' }} />
                      </div>
                    )}
                    {sousseAptitudeChoice === 'REPRISE_MO_AT' && (
                      <div>
                        <label style={lblSx}>3) Peut reprendre son travail à dater du</label>
                        <input className="ve-inp" type="text" value={fForm.precision_aptitude} onChange={setF('precision_aptitude')} placeholder="Ex. : à compter du … / dès réception …" style={{ ...inpSx, marginTop: 6, width: '100%', boxSizing: 'border-box' }} />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
                  {APTITUDE_CHOICES.map(a => (
                    <button key={a.val} type="button" onClick={() => setFForm(p => ({ ...p, aptitude: a.val }))}
                      style={{ padding: '11px 13px', borderRadius: 11, cursor: 'pointer', textAlign: 'left', border: `2px solid ${fForm.aptitude === a.val ? a.color : '#e2e8f0'}`, background: fForm.aptitude === a.val ? a.bg : 'white', fontFamily: 'inherit', transition: 'all .15s', boxShadow: fForm.aptitude === a.val ? `0 4px 12px ${a.color}25` : 'none', transform: fForm.aptitude === a.val ? 'translateY(-1px)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: fForm.aptitude === a.val ? a.color : '#e2e8f0', transition: 'background .15s' }} />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: fForm.aptitude === a.val ? a.color : '#475569' }}>{a.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lblSx}>Précision / restrictions</label>
                  <textarea className="ve-inp" value={fForm.precision_aptitude} onChange={setF('precision_aptitude')} rows={3} placeholder="Restrictions éventuelles…" style={{ ...inpSx, resize: 'vertical' }} />
                </div>
              </>
            )}
            </>
            )}
              </>
            )}

            {isMateurDocChoiceFlow && (
              <>
                <SectionTitle>{isSurveillanceSpeciale ? 'Surveillance médicale spéciale — Formulaire Mateur' : 'Visite périodique — Formulaire SMS Mateur'}</SectionTitle>

                <div style={{ marginBottom: 14, padding: '12px 14px', background: SKY[50], border: `1.5px solid ${SKY[200]}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>
                    2 — Motif de la surveillance médicale spéciale
                  </div>
                  {[
                    { k: 'moins18', label: "Travailleur âgé de moins de 18 ans" },
                    { k: 'enceinte_allaitante', label: 'Femme enceinte ou allaitante' },
                    { k: 'handicape', label: 'Travailleur handicapé' },
                    { k: 'travaux_risques_accidents', label: "Travaux particuliers exposant aux risques d'accidents de travail" },
                    { k: 'maladie_chronique', label: "Travailleur atteint d'une maladie chronique" },
                    { k: 'travaux_maladies_professionnelles', label: 'Travaux exposant aux risques des maladies professionnelles' },
                  ].map((it) => (
                    <label key={it.k} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0', fontSize: 13, color: '#0f172a' }}>
                      <input
                        type="checkbox"
                        checked={!!smsMateurForm.motifs[it.k]}
                        onChange={(e) => setSmsMateurForm((p) => ({ ...p, motifs: { ...p.motifs, [it.k]: e.target.checked } }))}
                      />
                      {it.label}
                    </label>
                  ))}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 8 }}>
                    3 — Étude du poste du travail et description de la tâche habituelle
                  </div>
                  <label style={lblSx}>3-1-1 Caractéristiques du poste</label>
                  <textarea className="ve-inp" value={smsMateurForm.poste_caracteristiques} onChange={(e) => setSmsMateurForm((p) => ({ ...p, poste_caracteristiques: e.target.value }))} rows={4} style={{ ...inpSx, resize: 'vertical', marginBottom: 10 }} />
                  <label style={lblSx}>3-1-2 Étude ergonomique des facteurs d'ambiance</label>
                  <textarea className="ve-inp" value={smsMateurForm.poste_ergonomie} onChange={(e) => setSmsMateurForm((p) => ({ ...p, poste_ergonomie: e.target.value }))} rows={4} style={{ ...inpSx, resize: 'vertical', marginBottom: 10 }} />
                  <label style={lblSx}>3-2 Description de la tâche habituelle</label>
                  <textarea className="ve-inp" value={smsMateurForm.tache_habituelle} onChange={(e) => setSmsMateurForm((p) => ({ ...p, tache_habituelle: e.target.value }))} rows={3} style={{ ...inpSx, resize: 'vertical' }} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 8 }}>
                    4 — Description et évaluation du risque professionnel
                  </div>
                  <label style={lblSx}>4-1 Description des principaux risques d’accidents de travail</label>
                  <textarea className="ve-inp" value={smsMateurForm.risques_accidents} onChange={(e) => setSmsMateurForm((p) => ({ ...p, risques_accidents: e.target.value }))} rows={3} style={{ ...inpSx, resize: 'vertical', marginBottom: 10 }} />
                  <label style={lblSx}>4-2 Désignation du (ou des) tableau(x) des maladies professionnelles et des agents responsables</label>
                  <textarea className="ve-inp" value={smsMateurForm.tableaux_mp_et_agents} onChange={(e) => setSmsMateurForm((p) => ({ ...p, tableaux_mp_et_agents: e.target.value }))} rows={3} style={{ ...inpSx, resize: 'vertical', marginBottom: 10 }} />
                  <label style={lblSx}>4-3 Évaluation de l’exposition au(x) risque(s) (date prélèvement/analyse si besoin)</label>
                  <textarea className="ve-inp" value={smsMateurForm.evaluation_exposition} onChange={(e) => setSmsMateurForm((p) => ({ ...p, evaluation_exposition: e.target.value }))} rows={3} style={{ ...inpSx, resize: 'vertical' }} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 8 }}>
                    5 — Surveillance médicale spéciale du travailleur
                  </div>
                  <div style={{ border: `1.5px solid ${SKY[200]}`, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 220px', background: SKY[50], borderBottom: `1.5px solid ${SKY[200]}` }}>
                      {['Date de l’examen', "Nature de l'examen", "Résultats de l'examen", 'Nom, prénom et signature'].map((h) => (
                        <div key={h} style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>{h}</div>
                      ))}
                    </div>
                    {smsMateurForm.surveillance_rows.slice(0, smsSurvVisibleCount).map((row, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 220px', borderBottom: idx === (smsSurvVisibleCount - 1) ? 'none' : `1px solid ${SKY[100]}` }}>
                        <div style={{ padding: 8 }}><input className="ve-inp" type="date" value={row.date_examen} onChange={(e) => setSmsMateurForm((p) => ({ ...p, surveillance_rows: p.surveillance_rows.map((r, i) => (i === idx ? { ...r, date_examen: e.target.value } : r)) }))} style={inpSx} /></div>
                        <div style={{ padding: 8 }}><textarea className="ve-inp" rows={2} value={row.nature_examen} onChange={(e) => setSmsMateurForm((p) => ({ ...p, surveillance_rows: p.surveillance_rows.map((r, i) => (i === idx ? { ...r, nature_examen: e.target.value } : r)) }))} style={{ ...inpSx, resize: 'vertical' }} /></div>
                        <div style={{ padding: 8 }}><textarea className="ve-inp" rows={2} value={row.resultats} onChange={(e) => setSmsMateurForm((p) => ({ ...p, surveillance_rows: p.surveillance_rows.map((r, i) => (i === idx ? { ...r, resultats: e.target.value } : r)) }))} style={{ ...inpSx, resize: 'vertical' }} /></div>
                        <div style={{ padding: 8 }}><textarea className="ve-inp" rows={2} value={row.medecin_signature} onChange={(e) => setSmsMateurForm((p) => ({ ...p, surveillance_rows: p.surveillance_rows.map((r, i) => (i === idx ? { ...r, medecin_signature: e.target.value } : r)) }))} style={{ ...inpSx, resize: 'vertical' }} /></div>
                      </div>
                    ))}
                  </div>
                  {smsSurvVisibleCount < smsMateurForm.surveillance_rows.length && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setSmsSurvVisibleCount((c) => Math.min(smsMateurForm.surveillance_rows.length, c + 1))}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: 'none',
                          background: `linear-gradient(135deg, ${SKY[400]}, ${SKY[700]})`,
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: 12.5,
                          fontFamily: 'inherit',
                          boxShadow: '0 3px 12px rgba(14,165,233,.28)',
                        }}
                      >
                        + Ajouter
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 8 }}>
                    6 — Mesures prises dans le domaine de la prévention
                  </div>
                  <textarea className="ve-inp" value={smsMateurForm.mesures_prevention} onChange={(e) => setSmsMateurForm((p) => ({ ...p, mesures_prevention: e.target.value }))} rows={3} style={{ ...inpSx, resize: 'vertical' }} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Étape 3 (SMS Mateur) : Choix document + affichage + impression ── */}
        {isMateurDocChoiceFlow && etape === 3 && (
          <div>
            <div style={{ background: 'white', border: `1.5px solid ${SKY[200]}`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>
                Choix document
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 14, lineHeight: 1.45 }}>
                Choisissez le document, puis vous pouvez <strong>voir le contenu</strong> et <strong>imprimer</strong> avant d’aller à la finalisation.
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setSmsMateurDocChoisi('fiche'); setSmsMateurOnglet('fiche'); }}
                  style={{ padding: '9px 14px', borderRadius: 12, border: `1.5px solid ${SKY[300]}`, background: smsMateurDocChoisi === 'fiche' ? SKY[100] : SKY[50], color: SKY[800], cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}
                >
                  Fiche d&apos;aptitude
                </button>
                <button
                  type="button"
                  onClick={() => { setSmsMateurDocChoisi('certificat'); setSmsMateurOnglet('certificat'); }}
                  style={{ padding: '9px 14px', borderRadius: 12, border: `1.5px solid ${SKY[300]}`, background: smsMateurDocChoisi === 'certificat' ? SKY[100] : SKY[50], color: SKY[800], cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}
                >
                  Certificat d&apos;aptitude
                </button>
              </div>
            </div>

            {/* Onglets cliquables (contenu) */}
            <div style={{ marginBottom: 14, display: 'flex', borderBottom: `2px solid ${SKY[100]}`, background: 'white', padding: '0 6px' }}>
              {[
                { id: 'fiche', label: "Fiche d'aptitude" },
                { id: 'certificat', label: "Certificat d'aptitude" },
              ].map((t) => {
                const active = smsMateurOnglet === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setSmsMateurOnglet(t.id); setSmsMateurDocChoisi(t.id); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '11px 16px',
                      border: 'none',
                      borderBottom: `3px solid ${active ? SKY[500] : 'transparent'}`,
                      marginBottom: -2,
                      borderRadius: 0,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 12.5,
                      fontWeight: active ? 800 : 500,
                      background: 'transparent',
                      color: active ? SKY[700] : '#94a3b8',
                      transition: 'all .13s',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = SKY[600]; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Contenu */}
            {ficheCreee && smsMateurOnglet === 'fiche' && (
              <div style={{ position: 'relative', zIndex: 2, marginBottom: 12 }}>
                <TabFiche key={`sms-mateur-tabfiche:${ficheCreee.id}`} fiche={ficheCreee} onFicheUpdated={setFicheCreee} entrepriseEditable />
              </div>
            )}

            {ficheCreee && smsMateurOnglet === 'certificat' && (
              <div style={{ position: 'relative', zIndex: 2, marginBottom: 12 }}>
                <TabCertificatMateur fiche={ficheCreee} onFicheUpdated={setFicheCreee} />
              </div>
            )}
          </div>
        )}

        {/* ── Étape 3 (Embauche Mateur) : Choix = créer certificat ou non ── */}
        {isEmbaucheDocChoiceFlow && etape === 3 && (
          <div>
            <div style={{ background: 'white', border: `1.5px solid ${SKY[200]}`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>
                Choix document
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 14, lineHeight: 1.45 }}>
                Souhaitez-vous créer aussi un <strong>certificat d&apos;aptitude</strong> pour cette embauche ?
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setEmbaucheWantsCert(true); setEmbaucheMateurDocType('CERTIFICAT'); }}
                  style={{ padding: '9px 14px', borderRadius: 12, border: `1.5px solid ${SKY[300]}`, background: embaucheWantsCert ? SKY[100] : SKY[50], color: SKY[800], cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}
                >
                  Créer certificat d&apos;aptitude
                </button>
              </div>
            </div>

            {embaucheWantsCert && (
              <div style={{ position: 'relative', zIndex: 2, marginBottom: 12 }}>
                <EmbaucheMateurEtape2
                  SKY={SKY}
                  inpSx={inpSx}
                  lblSx={lblSx}
                  APT_STYLE={APT_STYLE}
                  aptitudeChoices={APTITUDE_CHOICES}
                  fForm={fForm}
                  setFForm={setFForm}
                  enterpriseReadOnly={enterpriseReadOnly}
                  embaucheMateurDocType={'CERTIFICAT'}
                  setEmbaucheMateurDocType={() => {}}
                  embaucheMaturExamRows={embaucheMaturExamRows}
                  setEmbaucheMaturExamRows={setEmbaucheMaturExamRows}
                  embaucheMateurCert={embaucheMateurCert}
                  setEmbaucheMateurCert={setEmbaucheMateurCert}
                  hideDocChoice
                />
              </div>
            )}
          </div>
        )}

        {/* ── Étape finale (SMS Mateur) : Finalisation = Observations + impressions ── */}
        {isMateurDocChoiceFlow && etape === 4 && (
          <div>
            <div style={{ background: 'white', border: `1.5px solid ${SKY[200]}`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>
                Finalisation
              </div>
              <div style={{ background: SKY[50], border: `1.5px solid ${SKY[200]}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>
                  Informations collaborateur traité
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '7px 16px', fontSize: 13 }}>
                  <span style={{ color: '#475569', fontWeight: 700 }}>Nom :</span>
                  <span style={{ fontWeight: 900, color: SKY[800] }}>{candidat?.nom || '—'} {candidat?.prenom || ''}</span>
                  <span style={{ color: '#475569', fontWeight: 700 }}>Matricule :</span>
                  <span style={{ fontWeight: 800, fontFamily: 'monospace', color: SKY[600] }}>{candidat?.matricule || '—'}</span>
                  <span style={{ color: '#475569', fontWeight: 700 }}>Poste :</span>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{String(candidat?.poste || candidat?.im_data?.fonction || fForm?.collaborateur_poste || '—')}</span>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lblSx}>Observations complémentaires (optionnel)</label>
                <textarea className="ve-inp" value={obs} onChange={e => setObs(e.target.value)} rows={4} placeholder="Observations pour l'infirmier et la RH…" style={{ ...inpSx, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* Toujours : impression fiche SMS */}
                {ficheCreee && (
                  <PrintFicheSurveillanceMateur fiche={ficheCreee} collaborateur={candidat} siteConfig={siteConfigMedecin} form={smsMateurForm} />
                )}
                {/* Impression fiche d'aptitude */}
                {(() => {
                  // IMPORTANT (SMS): l'aptitude peut être pré-remplie automatiquement (état embauche),
                  // mais la fiche reste vide tant que le médecin n'a pas réellement saisi/édité la fiche d'aptitude.
                  const draftForm = smsFicheDraft?.form && typeof smsFicheDraft.form === 'object' ? smsFicheDraft.form : null;
                  const aptDraft = String(
                    draftForm?.aptitude
                    ?? draftForm?.avis_aptitude
                    ?? draftForm?.avisAptitude
                    ?? ''
                  ).trim();
                  const aptSaved = String(
                    ficheCreee?.aptitude
                    ?? ficheCreee?.avis_aptitude
                    ?? ficheCreee?.avisAptitude
                    ?? ficheCreee?.avis_aptitude_travail
                    ?? ''
                  ).trim();
                  const hasEditedFiche =
                    !!draftForm
                    || !!String(ficheCreee?.precision_aptitude || '').trim()
                    || !!String(ficheCreee?.date_reprise || '').trim();
                  const ready = Boolean((aptDraft || aptSaved) && hasEditedFiche);

                  if (ficheCreee && ready) {
                    return (
                      <PrintFicheAptitudeRouter
                        fiche={ficheCreee}
                        collaborateur={candidat}
                        siteConfig={siteConfigMedecin}
                        {...(draftForm ? { form: draftForm } : {})}
                      />
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        await Swal.fire({
                          icon: 'info',
                          title: "Fiche d'aptitude",
                          text: "La fiche d'aptitude n'est pas encore créée/saisie. Ouvrez « Choix document », puis remplissez la fiche d'aptitude.",
                        });
                      }}
                      style={{ padding: '10px 14px', borderRadius: 11, border: '1.5px solid #e2e8f0', background: 'white', color: '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'inherit' }}
                      title="Fiche d'aptitude non prête"
                    >
                      Imprimer fiche d&apos;aptitude
                    </button>
                  );
                })()}
                {/* Impression certificat d'aptitude */}
                {((smsCertDraft && smsCertDraft.description) || ficheCreee?.certificat) ? (
                  <PrintCertificatRouter
                    fiche={ficheCreee}
                    collaborateur={candidat}
                    siteConfig={siteConfigMedecin}
                    form={(smsCertDraft && smsCertDraft.description) ? smsCertDraft : ficheCreee?.certificat}
                    label="Imprimer certificat d'aptitude"
                    title="Imprimer certificat d'aptitude"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await Swal.fire({
                        icon: 'info',
                        title: "Certificat d'aptitude",
                        text: "Aucun certificat n'est encore créé pour cette fiche.",
                      });
                    }}
                    style={{ padding: '10px 14px', borderRadius: 11, border: '1.5px solid #e2e8f0', background: 'white', color: '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'inherit' }}
                    title="Aucun certificat créé"
                  >
                    Imprimer certificat d&apos;aptitude
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Étape finale (hors SMS choix doc) : Résumé ── */}
        {!isMateurDocChoiceFlow && etape === finalEtape && (
          <div>
            {(!isSurveillanceSpeciale || !isMaturTemplate || !ficheCreee || smsMateurOnglet === 'sms') && (
              <div style={{ background: SKY[50], border: `1.5px solid ${SKY[200]}`, borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: SKY[800], marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  {modeModif ? 'Fiche modifiée avec succès' : 'Examen enregistré avec succès'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '7px 16px', fontSize: 13 }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Candidat :</span>
                  <span style={{ fontWeight: 800, color: SKY[800] }}>{candidat.nom} {candidat.prenom}</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Matricule :</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: SKY[600] }}>{candidat.matricule}</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Poste :</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{postePourResume}</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Conclusion :</span>
                  <span>{APTE_CHOISIE && <span style={{ background: APTE_CHOISIE.bg, color: APTE_CHOISIE.color, border: `1.5px solid ${APTE_CHOISIE.border}`, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{APTE_CHOISIE.label}</span>}</span>
                </div>
              </div>
            )}

            {ficheCreee && (
              <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {isEmbaucheDocChoiceFlow ? (
                  <>
                    <PrintFicheAptitudeRouter
                      fiche={ficheCreee}
                      collaborateur={candidat}
                      siteConfig={siteConfigMedecin}
                      form={{ examens_ulterieurs: embaucheMaturExamRows }}
                    />
                    {ficheCreee?.certificat ? (
                      <PrintCertificatRouter
                        fiche={ficheCreee}
                        collaborateur={candidat}
                        siteConfig={siteConfigMedecin}
                        form={embaucheCertFormForPrint ?? ficheCreee?.certificat}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          await Swal.fire({
                            icon: 'info',
                            title: "Certificat d'aptitude",
                            text: "Aucun certificat n'est encore créé pour cette fiche.",
                          });
                        }}
                        style={{ padding: '10px 14px', borderRadius: 11, border: '1.5px solid #e2e8f0', background: 'white', color: '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'inherit' }}
                        title="Aucun certificat créé"
                      >
                        Imprimer certificat d&apos;aptitude
                      </button>
                    )}
                  </>
                ) : isMaturTemplate && isEmbaucheMateurFlow && embaucheMateurDocType === 'CERTIFICAT' ? (
                  <PrintCertificatRouter
                    fiche={ficheCreee}
                    collaborateur={candidat}
                    siteConfig={siteConfigMedecin}
                    form={embaucheCertFormForPrint ?? ficheCreee?.certificat}
                  />
                ) : (
                  <PrintFicheAptitudeRouter
                    fiche={ficheCreee}
                    collaborateur={candidat}
                    siteConfig={siteConfigMedecin}
                    {...(isEmbaucheMateurFlow && embaucheMateurDocType === 'FICHE'
                      ? { form: { examens_ulterieurs: embaucheMaturExamRows } }
                      : {})}
                  />
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={lblSx}>Observations complémentaires (optionnel)</label>
              <textarea className="ve-inp" value={obs} onChange={e => setObs(e.target.value)} rows={4} placeholder="Observations pour l'infirmier et la RH…" style={{ ...inpSx, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <button onClick={() => { setModeModif(true); setEtape(2); }}
                style={{ padding: '9px 16px', borderRadius: 11, border: `1.5px solid ${SKY[300]}`, background: SKY[50], color: SKY[700], cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = SKY[100]; }}
                onMouseLeave={e => { e.currentTarget.style.background = SKY[50]; }}>
                ✏️ {isSurveillanceSpeciale ? 'Modifier fiche SMS' : "Modifier la fiche d'aptitude"}
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '13px 22px', borderTop: `1.5px solid ${SKY[100]}`, display: 'flex', gap: 9, justifyContent: 'flex-end', background: SKY[50], flexShrink: 0 }}>
        {etape > 1 && etape < finalEtape && !(isVpFlow && etape === 2) && !masquerFooterActionsListeJour && (
          <button onClick={() => { setEtape(e => e - 1); setErr(''); }}
            style={{ padding: '9px 16px', borderRadius: 11, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#475569', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = SKY[200]; e.currentTarget.style.color = SKY[700]; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}>
            ← Retour
          </button>
        )}
        {etape === 1 && (
          <button onClick={handleEtape1} disabled={loading}
            style={{
              ...primaryActionButtonStyle({ minWidth: 'auto' }),
              background: loading ? '#94a3b8' : PRIMARY_ACTION_GRADIENT,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(14, 165, 233, 0.35)',
              cursor: loading ? 'wait' : 'pointer',
            }}
            onMouseEnter={primaryActionBtnEnter}
            onMouseLeave={primaryActionBtnLeave}>
            {loading ? 'Chargement…' : dossier ? 'Mettre à jour →' : 'Créer le dossier →'}
          </button>
        )}
        {etape === 2 && !masquerFooterActionsListeJour && (
          <button onClick={handleEtape2} disabled={loading || !etape2CanSubmitAptitude}
            style={{
              ...primaryActionButtonStyle({ minWidth: 'auto' }),
              background: !etape2CanSubmitAptitude || loading ? '#94a3b8' : PRIMARY_ACTION_GRADIENT,
              boxShadow: !etape2CanSubmitAptitude || loading ? 'none' : PRIMARY_ACTION_SHADOW,
              cursor: !etape2CanSubmitAptitude ? 'not-allowed' : loading ? 'wait' : 'pointer',
            }}
            onMouseEnter={primaryActionBtnEnter}
            onMouseLeave={primaryActionBtnLeave}>
            {loading ? 'Enregistrement…' : modeModif ? 'Sauvegarder →' : 'Valider la fiche →'}
          </button>
        )}
        {isEmbaucheDocChoiceFlow && etape === 3 && !masquerFooterActionsListeJour && (
          <>
            {embaucheWantsCert ? (
              <button
                type="button"
                onClick={handleEtape2}
                disabled={loading || !fForm.aptitude || !String(fForm.type_visite || '').trim()}
                style={{
                  ...primaryActionButtonStyle({ minWidth: 'auto' }),
                  background: (loading || !fForm.aptitude || !String(fForm.type_visite || '').trim()) ? '#94a3b8' : PRIMARY_ACTION_GRADIENT,
                  boxShadow: (loading || !fForm.aptitude || !String(fForm.type_visite || '').trim()) ? 'none' : PRIMARY_ACTION_SHADOW,
                  cursor: (loading || !fForm.aptitude || !String(fForm.type_visite || '').trim()) ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={primaryActionBtnEnter}
                onMouseLeave={primaryActionBtnLeave}
              >
                {loading ? 'Enregistrement…' : 'Sauvegarder certificat →'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setEtape(4); setErr(''); }}
                style={{
                  ...primaryActionButtonStyle({ minWidth: 'auto' }),
                  background: PRIMARY_ACTION_GRADIENT,
                  boxShadow: PRIMARY_ACTION_SHADOW,
                  cursor: 'pointer',
                }}
                onMouseEnter={primaryActionBtnEnter}
                onMouseLeave={primaryActionBtnLeave}
              >
                Aller à la finalisation →
              </button>
            )}
          </>
        )}
        {isMateurDocChoiceFlow && etape === 3 && !masquerFooterActionsListeJour && (
          <button
            type="button"
            onClick={() => { setEtape(4); setErr(''); }}
            style={{
              ...primaryActionButtonStyle({ minWidth: 'auto' }),
              background: PRIMARY_ACTION_GRADIENT,
              boxShadow: PRIMARY_ACTION_SHADOW,
              cursor: 'pointer',
            }}
            onMouseEnter={primaryActionBtnEnter}
            onMouseLeave={primaryActionBtnLeave}
          >
            Aller à la finalisation →
          </button>
        )}
        {(isSmsMessadineDocsFlow || isEmbaucheMessadineDocsFlow || isVpMessadineDocsFlow || isVpMenzelDocsFlow || isEmbaucheMenzelDocsFlow) && etape === 3 && !masquerFooterActionsListeJour && (
          <button
            type="button"
            onClick={() => { setEtape(4); setErr(''); }}
            style={{
              ...primaryActionButtonStyle({ minWidth: 'auto' }),
              background: PRIMARY_ACTION_GRADIENT,
              boxShadow: PRIMARY_ACTION_SHADOW,
              cursor: 'pointer',
            }}
            onMouseEnter={primaryActionBtnEnter}
            onMouseLeave={primaryActionBtnLeave}
          >
            Aller à la finalisation →
          </button>
        )}
        {etape === finalEtape && !masquerFooterActionsListeJour && (
          <button onClick={handleTerminer} disabled={loading}
            style={{ padding: '9px 22px', borderRadius: 11, border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: 'white', cursor: loading ? 'wait' : 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 14px #a7f3d0', transition: 'all .15s' }}>
            {loading ? '…' : '✓ Terminer'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══ Composant principal ══════════════════════════════ */
export default function VueEmbauche({ sessionUserKey = 'anonymous' }) {
  const [listes, setListes]                         = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [selectedListe, setSelectedListe]           = useState(null);
  const [candidats, setCandidats]                   = useState([]);
  const [loadCands, setLoadCands]                   = useState(false);
  const [selectedCandidat, setSelectedCandidat]     = useState(null);
  const [smsJourJBusyId, setSmsJourJBusyId]         = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const loadListes = useCallback(async () => {
    setLoading(true);
    setListes([]);
    setSelectedListe(null);
    setCandidats([]);
    setSelectedCandidat(null);
    try {
      const all = await getListesEmbaucheAssignees();
      setListes(all);
      const remembered = readPanelSelection('embauche');
      const rememberedListeId = remembered?.selectedListeId;
      const rememberedCandId = remembered?.selectedCandidatId;
      const listeAujourdHui = all.find(l => l.date_visite === today);
      const preferred =
        (rememberedListeId != null ? all.find((l) => Number(l.id) === Number(rememberedListeId)) : null)
        || listeAujourdHui
        || all[0]
        || null;
      if (preferred) {
        setSelectedListe(preferred);
        setLoadCands(true);
        try {
          const rows = await getCandidatsEmbauche(preferred.id);
          setCandidats(rows);
          if (rememberedCandId != null) {
            const found = (rows || []).find((x) => Number(x.id) === Number(rememberedCandId));
            if (found) setSelectedCandidat(found);
          }
        } catch {
          setCandidats([]);
        } finally {
          setLoadCands(false);
        }
      }
    } catch { setListes([]); }
    finally { setLoading(false); }
  }, [today, sessionUserKey]);

  useEffect(() => {
    loadListes();
  }, [loadListes, sessionUserKey]);

  const handleSelectListe = async (l) => {
    setSelectedListe(l); setSelectedCandidat(null);
    writePanelSelection('embauche', { selectedListeId: l?.id ?? null, selectedCandidatId: null });
    if (!l) return;
    setLoadCands(true);
    try { setCandidats(await getCandidatsEmbauche(l.id)); }
    catch { setCandidats([]); }
    finally { setLoadCands(false); }
  };

  useEffect(() => {
    if (selectedCandidat) {
      writePanelSelection('embauche', { selectedListeId: selectedListe?.id ?? null, selectedCandidatId: selectedCandidat.id });
    }
  }, [selectedCandidat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = async () => {
    if (selectedListe) {
      setLoadCands(true);
      try {
        const updated = await getCandidatsEmbauche(selectedListe.id);
        setCandidats(updated);
        if (selectedCandidat) { const c = updated.find(x => x.id === selectedCandidat.id); if (c) setSelectedCandidat(c); }
      } catch {}
      finally { setLoadCands(false); }
    }
  };

  const handleSmsJourJEmbauche = async (candidatId) => {
    setSmsJourJBusyId(candidatId);
    try {
      await notifierSmsJourJCandidatEmbauche(candidatId);
      await handleDone();
      await Swal.fire({
        icon: 'success',
        title: 'SMS jour J',
        text: 'Notification traitée.',
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'SMS jour J',
        text: formatAxiosError(e) || e?.message || 'Échec.',
      });
    } finally {
      setSmsJourJBusyId(null);
    }
  };

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display: 'flex', flex: 1, gap: 14, minHeight: 0, overflow: 'hidden' }}>
        <ListeCandidats
          listes={listes} selectedListe={selectedListe} onSelectListe={handleSelectListe}
          candidats={candidats} selectedCandidat={selectedCandidat} onSelectCandidat={setSelectedCandidat}
          loadCands={loadCands} loading={loading}
          onSmsJourJEmbauche={handleSmsJourJEmbauche}
          smsJourJBusyId={smsJourJBusyId}
        />
        <PanneauExamen candidat={selectedCandidat} onDone={handleDone} mode="embauche" />
      </div>
    </>
  );
}

/** Listes du jour — visites périodiques (hors embauche), même ergonomie que l’embauche. */
export function VueVisitesPeriodiques({ sessionUserKey = 'anonymous' }) {
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListe, setSelectedListe] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [loadCands, setLoadCands] = useState(false);
  const [selectedCandidat, setSelectedCandidat] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const loadListes = useCallback(async () => {
    setLoading(true);
    setListes([]);
    setSelectedListe(null);
    setCandidats([]);
    setSelectedCandidat(null);
    try {
      const all = await getListesVisitesPeriodiquesPourMedecin();
      const onlyVp = filterListesPourMedecinJour(Array.isArray(all) ? all : []);
      setListes(onlyVp);
      const remembered = readPanelSelection('periodique');
      const rememberedListeId = remembered?.selectedListeId;
      const rememberedCandId = remembered?.selectedCandidatId;
      const listeAujourdHui = onlyVp.find((l) => l.date_visite === today);
      const preferred =
        (rememberedListeId != null ? onlyVp.find((l) => Number(l.id) === Number(rememberedListeId)) : null)
        || listeAujourdHui
        || onlyVp[0]
        || null;
      if (preferred) {
        setSelectedListe(preferred);
        setLoadCands(true);
        try {
          const L = await getLignesListePeriodique(preferred.id);
          const updated = sortLignesVisitePeriodique(
            (Array.isArray(L) ? L : []).map((row) => enrichLigneVisitePeriodique(row)),
          );
          setCandidats(updated);
          if (rememberedCandId != null) {
            const found = updated.find((x) => Number(x.id) === Number(rememberedCandId));
            if (found) setSelectedCandidat(found);
          }
        } catch {
          setCandidats([]);
        } finally {
          setLoadCands(false);
        }
      }
    } catch {
      setListes([]);
    } finally {
      setLoading(false);
    }
  }, [today, sessionUserKey]);

  useEffect(() => {
    loadListes();
  }, [loadListes, sessionUserKey]);

  const handleSelectListe = async (l) => {
    setSelectedListe(l);
    setSelectedCandidat(null);
    writePanelSelection('periodique', { selectedListeId: l?.id ?? null, selectedCandidatId: null });
    if (!l) return;
    setLoadCands(true);
    try {
      const L = await getLignesListePeriodique(l.id);
      const mapped = (Array.isArray(L) ? L : []).map((row) => enrichLigneVisitePeriodique(row));
      setCandidats(sortLignesVisitePeriodique(mapped));
    } catch {
      setCandidats([]);
    } finally {
      setLoadCands(false);
    }
  };

  useEffect(() => {
    if (selectedCandidat) {
      writePanelSelection('periodique', { selectedListeId: selectedListe?.id ?? null, selectedCandidatId: selectedCandidat.id });
    }
  }, [selectedCandidat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = async () => {
    if (selectedListe) {
      setLoadCands(true);
      try {
        const L = await getLignesListePeriodique(selectedListe.id);
        const updated = sortLignesVisitePeriodique(
          (Array.isArray(L) ? L : []).map((row) => enrichLigneVisitePeriodique(row)),
        );
        setCandidats(updated);
        if (selectedCandidat) {
          const c = updated.find((x) => x.id === selectedCandidat.id);
          if (c) setSelectedCandidat(c);
        }
      } catch {
        /* no-op */
      } finally {
        setLoadCands(false);
      }
    }
  };

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display: 'flex', flex: 1, gap: 14, minHeight: 0, overflow: 'hidden' }}>
        <ListeCandidats
          listes={listes}
          selectedListe={selectedListe}
          onSelectListe={handleSelectListe}
          candidats={candidats}
          selectedCandidat={selectedCandidat}
          onSelectCandidat={setSelectedCandidat}
          loadCands={loadCands}
          loading={loading}
          listVariant="periodique"
        />
        <PanneauExamen candidat={selectedCandidat} onDone={handleDone} mode="periodique" />
      </div>
    </>
  );
}

/** Surveillance médicale spéciale (SMS) — même ergonomie que les visites périodiques : liste + sélection + fiche d’aptitude. */
export function VueSurveillanceSpecialeMedecin({ sessionUserKey = 'anonymous' }) {
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListe, setSelectedListe] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [loadCands, setLoadCands] = useState(false);
  const [selectedCandidat, setSelectedCandidat] = useState(null);
  const [smsSurvBusyId, setSmsSurvBusyId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSelectListe = useCallback(async (l, opts = {}) => {
    setSelectedListe(l);
    setSelectedCandidat(null);
    const restoreCandId =
      opts && (opts.restoreCandId ?? null) != null
        ? opts.restoreCandId
        : (readPanelSelection('surveillance-speciale')?.selectedCandidatId ?? null);
    // Ne pas écraser tout de suite le candidat mémorisé : on l'utilise pour rétablir la sélection après chargement.
    writePanelSelection('surveillance-speciale', { selectedListeId: l?.id ?? null, selectedCandidatId: restoreCandId ?? null });
    if (!l) {
      setCandidats([]);
      return;
    }
    setLoadCands(true);
    try {
      const L = await getLignesSurveillanceSpeciale(l.id);
      const mapped = (Array.isArray(L) ? L : []).map((row) =>
        enrichLigneSurveillancePourMedecin(row, l.id, l.date_visite),
      );
      const next = sortLignesVisitePeriodique(mapped);
      setCandidats(next);
      if (restoreCandId != null) {
        const found = next.find((x) => String(x.id) === String(restoreCandId));
        if (found) setSelectedCandidat(found);
      }
    } catch {
      setCandidats([]);
    } finally {
      setLoadCands(false);
    }
  }, []);

  const loadListes = useCallback(async () => {
    setLoading(true);
    setListes([]);
    setSelectedListe(null);
    setCandidats([]);
    setSelectedCandidat(null);
    try {
      const all = await getListesSurveillanceSpeciale();
      const arr = (Array.isArray(all) ? all : []).filter(
        (x) => String(x?.statut || '').toUpperCase() === 'EN_TRAITEMENT',
      );
      setListes(arr);
      const remembered = readPanelSelection('surveillance-speciale');
      const rememberedListeId = remembered?.selectedListeId;
      const rememberedCandId = remembered?.selectedCandidatId;
      const listeAujourdHui = arr.find((x) => x.date_visite === today);
      const preferred =
        (rememberedListeId != null ? arr.find((l) => Number(l.id) === Number(rememberedListeId)) : null)
        || listeAujourdHui
        || arr[0]
        || null;
      if (preferred) {
        await handleSelectListe(preferred, { restoreCandId: rememberedCandId });
      }
    } catch {
      setListes([]);
    } finally {
      setLoading(false);
    }
  }, [today, handleSelectListe, sessionUserKey]);

  useEffect(() => {
    loadListes();
  }, [loadListes]);

  useEffect(() => {
    if (selectedCandidat) {
      writePanelSelection('surveillance-speciale', { selectedListeId: selectedListe?.id ?? null, selectedCandidatId: selectedCandidat.id });
    }
  }, [selectedCandidat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = async () => {
    if (!selectedListe) return;
    setLoadCands(true);
    try {
      const L = await getLignesSurveillanceSpeciale(selectedListe.id);
      const mapped = (Array.isArray(L) ? L : []).map((row) =>
        enrichLigneSurveillancePourMedecin(row, selectedListe.id, selectedListe.date_visite),
      );
      const updated = sortLignesVisitePeriodique(mapped);
      setCandidats(updated);
      if (selectedCandidat) {
        const c = updated.find((x) => x.id === selectedCandidat.id);
        if (c) setSelectedCandidat(c);
      }
    } catch {
      /* no-op */
    } finally {
      setLoadCands(false);
    }
  };

  const handleSmsSurv = async (ligneId) => {
    setSmsSurvBusyId(ligneId);
    try {
      await notifierJourJLigneSurveillanceSpeciale(ligneId);
      await handleDone();
      await Swal.fire({ icon: 'success', title: 'SMS jour J', timer: 1800, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'SMS jour J', text: formatAxiosError(e) || 'Erreur.' });
    } finally {
      setSmsSurvBusyId(null);
    }
  };

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display: 'flex', flex: 1, gap: 14, minHeight: 0, overflow: 'hidden' }}>
        <ListeCandidats
          listes={listes}
          selectedListe={selectedListe}
          onSelectListe={handleSelectListe}
          candidats={candidats}
          selectedCandidat={selectedCandidat}
          onSelectCandidat={setSelectedCandidat}
          loadCands={loadCands}
          loading={loading}
          listVariant="surveillance-speciale"
          onSmsJourJSurveillance={handleSmsSurv}
          smsSurveillanceBusyId={smsSurvBusyId}
        />
        <PanneauExamen candidat={selectedCandidat} onDone={handleDone} mode="surveillance-speciale" />
      </div>
    </>
  );
}