// src/components/medecinTravail/NouvelleFiche.jsx  — REDESIGN bleu ciel
import { useEffect, useState } from 'react';
import SearchCollaborateur from './SearchCollaborateur';
import EnteteMaladiesChroniques from '../common/EnteteMaladiesChroniques';
import { creerCertificat, creerFicheAptitude, getFicheAptitude, rattacherFicheAuCandidat } from '../../api/Medicalworkapi';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { printHTML } from '../../utils/printHelper';
import { useAuth } from '../../context/AuthContext';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';
import { buildFichePayloadByTemplate, validateFicheByTemplate } from '../../utils/ficheTemplate';
import { buildFicheAptitudePrintHtml, resolveFichePrintTemplate } from '../../utils/fichePrintTemplate';
import { pickCnssCollaborateur } from '../../utils/cnssEmbauche';
import { pickDepartementCollaborateur, pickLieuNaissanceCollaborateur } from '../../utils/ficheCollaborateur';
import { getSite } from '../../api/sitesApi';
import { getUserSiteId } from '../../utils/siteAccessControl';
import { buildCertificatAptitudeMateurHTML } from './PrintCertificatAptitudeMateur';
import { buildFicheAptitudeMaturHTML, medecinDisplayNameFromUser } from './PrintFicheAptitudeMateur';

/* ─── Palette ─────────────────────────────────────── */
const SKY = {
  50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd',
  300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9',
  600: '#0284c7', 700: '#0369a1', 800: '#075985',
};

/* ─── SVG Icons ───────────────────────────────────── */
const IcoUser = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoCheck = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const StatusChip = ({ color, label }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:7, color:'#0f172a', fontWeight:600, fontSize:11 }}>
    <span style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }}/>
    {label}
  </span>
);
const IcoFlask = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 3h6m-5 0v6l-4 9a1 1 0 0 0 .9 1.45h10.2A1 1 0 0 0 18 18l-4-9V3"/>
  </svg>
);
const IcoSearch2 = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoNote = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoPlus = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoSave = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IcoInfo = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ─── Data ────────────────────────────────────────── */
const TYPES_VISITE = [
  { value: 'EMBAUCHE',   label: "Visite d'Embauche" },
  { value: 'PERIODIQUE', label: 'Visite Périodique' },
  { value: 'REPRISE',    label: 'Visite de Reprise' },
  { value: 'SPONTANEE',  label: 'Visite Spontanée' },
];

const APTITUDES = [
  { value: 'APTE_AU_POSTE',               label: 'Apte au poste',               cls: 'g',
    icon: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
  { value: 'APTE_AMENAGEMENT_POSTE',      label: 'Apte — Aménagement',          cls: 'a',
    icon: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18h20.36l-11.89-14.14z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { value: 'INAPTE_TEMPORAIRE',           label: 'Inapte temporaire',            cls: 'r',
    icon: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg> },
  { value: 'INAPTE_DEFINITIF_MEME_POSTE', label: 'Inapte déf. (poste)',         cls: 'r',
    icon: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  { value: 'INAPTE_DEFINITIF_ENTREPRISE', label: 'Inapte déf. (entreprise)',     cls: 'r',
    icon: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
];

const APTITUDES_CERT_MATEUR = [
  { value: 'APTE_AU_POSTE', label: 'APTE au poste mentionné / Peut reprendre son poste de travail', cls: 'g' },
  { value: 'INAPTE_TEMPORAIRE', label: 'INAPTE temporaire au poste mentionné', cls: 'r' },
  { value: 'INAPTE_DEFINITIF_MEME_POSTE', label: 'INAPTE définitif au poste mentionné', cls: 'r' },
];

const APT_STYLE = {
  g: { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0', selBg: '#dcfce7', selBorder: '#6ee7b7', dot: '#10b981' },
  a: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', selBg: '#fef3c7', selBorder: '#fbbf24', dot: '#f59e0b' },
  r: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', selBg: '#fee2e2', selBorder: '#f87171', dot: '#f87171' },
};

// Bilan / examens optionnels : supprimés de "Nouvelle fiche" (demande utilisateur).

const today = () => new Date().toISOString().split('T')[0];

/* ─── Styles de base ──────────────────────────────── */
const inputSx = {
  width: '100%', padding: '9px 13px',
  background: 'white',
  border: `1.5px solid ${SKY[200]}`,
  borderRadius: 10, fontSize: 13, color: '#0f172a',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .15s, box-shadow .15s',
};
const roSx = {
  ...inputSx,
  background: SKY[50],
  color: '#475569',
  border: `1.5px solid ${SKY[100]}`,
  cursor: 'default',
};

/* ─── Sub-composants  */
function FieldLabel({ children, required }) {
  return (
    <label style={{ fontSize: 10.5, fontWeight: 700, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 5 }}>
      {children}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
    </label>
  );
}

function FocusInput({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...style, borderColor: focused ? SKY[400] : (style?.borderColor || SKY[200]), boxShadow: focused ? `0 0 0 3px ${SKY[100]}` : 'none' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function FocusSelect({ style, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{ ...style, borderColor: focused ? SKY[400] : SKY[200], boxShadow: focused ? `0 0 0 3px ${SKY[100]}` : 'none' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

function FocusTextarea({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{ ...style, borderColor: focused ? SKY[400] : SKY[200], boxShadow: focused ? `0 0 0 3px ${SKY[100]}` : 'none' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Section({ icon: Icon, title, children, accent }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 16, paddingBottom: 10,
        borderBottom: `2px solid ${SKY[100]}`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: accent || SKY[50],
          border: `1.5px solid ${SKY[200]}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: SKY[600], flexShrink: 0,
        }}>
          {Icon && <Icon />}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.7px' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function CheckBox({ label, checked, onChange }) {
  return (
    <div onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      background: checked ? SKY[50] : '#f8fafc',
      border: `1.5px solid ${checked ? SKY[300] : '#e2e8f0'}`,
      borderRadius: 10, padding: '8px 12px', cursor: 'pointer', userSelect: 'none',
      transition: 'all .13s',
      boxShadow: checked ? `0 2px 8px ${SKY[100]}` : 'none',
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? SKY[500] : '#cbd5e1'}`,
        background: checked ? SKY[500] : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .13s',
      }}>
        {checked && <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: checked ? 700 : 500, color: checked ? SKY[700] : '#64748b' }}>{label}</span>
    </div>
  );
}

function InfoField({ label, value, mono }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ ...roSx, fontFamily: mono ? 'monospace' : 'inherit', display: 'flex', alignItems: 'center', minHeight: 38 }}>
        <span style={{ color: value ? '#334155' : '#94a3b8' }}>{value || '—'}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════ */
export default function NouvelleFiche({ onSuccess, hideBilanExamenOptionnels = false, initialDocumentMode }) {
  const { user } = useAuth();
  const [collab,     setCollab]   = useState(null);
  const [typeVisite, setType]     = useState('');
  const [aptitude,   setApt]      = useState('');
  const [sousseAptitudeChoice, setSousseAptitudeChoice] = useState('');
  const [dateVisite, setDate]     = useState(today());
  const [precision,  setPrec]     = useState('');
  /** Messadine — Aptitude : texte libre « et ce pour une durée de » (API : duree_aptitude). */
  const [dureeAptitudeDate, setDureeAptitudeDate] = useState('');
  const [raisonSoc,  setRaison]   = useState('');
  const [natActivite,setNat]      = useState('');
  const [adresseEnt, setAdr]      = useState('');
  const [noCnss,     setNoCnss]   = useState('');
  const [qualifs,    setQualifs]  = useState('');

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [savedFiche, setSavedFiche] = useState(null);
  const [savedCertForm, setSavedCertForm] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const siteConfig = getSitePrintConfig(user);
  const templateBranch = resolveSiteTemplateFromSources(user, siteConfig);
  const isMessadineTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE;
  const isMaturTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MATEUR;
  const hideEntrepriseFields = isMessadineTemplate;

  const shouldShowMateurDocChoice = Boolean(isMaturTemplate && initialDocumentMode === 'MATEUR_CHOICE');
  const [mateurDocType, setMateurDocType] = useState('FICHE'); // 'FICHE' | 'CERTIFICAT'
  const [maturExamRows, setMaturExamRows] = useState(() =>
    Array.from({ length: 9 }).map(() => ({ p: false, r: false, s: false, date_nature: '', conclusion: '', medecin: '' }))
  );
  const [maturExamVisibleCount, setMaturExamVisibleCount] = useState(1);

  // Mateur : si des lignes (au-delà de la 1ère) contiennent déjà des données, afficher jusqu'à la dernière remplie.
  useEffect(() => {
    if (!shouldShowMateurDocChoice || mateurDocType !== 'FICHE') return;
    const rows = Array.isArray(maturExamRows) ? maturExamRows : [];
    let lastFilledIdx = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r) continue;
      const filled = Boolean(
        String(r.date_nature || '').trim()
        || String(r.conclusion || '').trim()
        || String(r.medecin || '').trim()
        || r.p || r.r || r.s
      );
      if (filled) lastFilledIdx = i;
    }
    const needed = Math.max(1, lastFilledIdx + 1);
    setMaturExamVisibleCount((prev) => (prev < needed ? needed : prev));
  }, [shouldShowMateurDocChoice, mateurDocType, maturExamRows]);

  useEffect(() => {
    if (!(shouldShowMateurDocChoice && mateurDocType === 'FICHE')) return;
    // Champ "type de visite" supprimé pour la fiche Mateur (valeur interne conservée pour l'API).
    // IMPORTANT: ne pas utiliser "EMBAUCHE" ici, sinon la fiche est filtrée hors "Fiches du jour"
    // (les embauches ont leur écran dédié). Pour une consultation depuis "Nouvelle fiche", on
    // considère une visite "SPONTANEE" par défaut.
    if (!typeVisite) setType('SPONTANEE');
  }, [shouldShowMateurDocChoice, mateurDocType, typeVisite]);
  // ---- Certificat Mateur (champs exacts du PDF)
  const [certAvisEtatGeneral, setCertAvisEtatGeneral] = useState('');
  const [certAvisDebout, setCertAvisDebout] = useState('');
  const [certAvisAssis, setCertAvisAssis] = useState('');
  const [certAvisCharge4, setCertAvisCharge4] = useState('');
  const [certAvisPoignetBrasEpaule, setCertAvisPoignetBrasEpaule] = useState('');
  const [certAvisCou, setCertAvisCou] = useState('');
  const [certAvisEffortPrecision, setCertAvisEffortPrecision] = useState('');
  const [certAvisRotationEquipe, setCertAvisRotationEquipe] = useState('');
  const [certApcMaladiePro, setCertApcMaladiePro] = useState('');
  const [certApcAccident, setCertApcAccident] = useState('');
  const [certApcMaladiesChroniques, setCertApcMaladiesChroniques] = useState('');
  const [certHeaderCertificatMedical, setCertHeaderCertificatMedical] = useState(true);
  const [certHeaderReprisePoste, setCertHeaderReprisePoste] = useState(false);

  const [certZoneCoupeCoupe, setCertZoneCoupeCoupe] = useState('');
  const [certZoneCoupeSertissage, setCertZoneCoupeSertissage] = useState('');
  const [certZoneCoupeAutres, setCertZoneCoupeAutres] = useState('');

  const [certZonePrepEpissure, setCertZonePrepEpissure] = useState('');
  const [certZonePrepRetreint, setCertZonePrepRetreint] = useState('');
  const [certZonePrepTorsadage, setCertZonePrepTorsadage] = useState('');
  const [certZonePrepEiamage, setCertZonePrepEiamage] = useState('');
  const [certZonePrepKabatec, setCertZonePrepKabatec] = useState('');
  const [certZonePrepLovage, setCertZonePrepLovage] = useState('');
  const [certZonePrepAutres, setCertZonePrepAutres] = useState('');

  const [certZoneMontageSousElement, setCertZoneMontageSousElement] = useState('');
  const [certZoneMontageLAD, setCertZoneMontageLAD] = useState('');
  const [certZoneMontagePU, setCertZoneMontagePU] = useState('');
  const [certZoneMontageAgrafs, setCertZoneMontageAgrafs] = useState('');
  const [certZoneMontageVissage, setCertZoneMontageVissage] = useState('');
  const [certZoneMontageGoulotte, setCertZoneMontageGoulotte] = useState('');
  const [certZoneMontageBOL, setCertZoneMontageBOL] = useState('');
  const [certZoneMontageCFinal, setCertZoneMontageCFinal] = useState('');
  const [certZoneMontageAutrePostes, setCertZoneMontageAutrePostes] = useState('');
  const [certAutresRemarques, setCertAutresRemarques] = useState('');
  const [certOpenZones, setCertOpenZones] = useState({ coupe: false, preparation: false, montage: false });

  // (Certificat Mateur) Les champs "Avis service" sont saisis en texte libre (pas Oui/Non)

  useEffect(() => {
    const coupeHas = !!(certZoneCoupeCoupe || certZoneCoupeSertissage || certZoneCoupeAutres);
    const prepHas = !!(certZonePrepEpissure || certZonePrepRetreint || certZonePrepTorsadage || certZonePrepEiamage || certZonePrepKabatec || certZonePrepLovage || certZonePrepAutres);
    const montageHas = !!(certZoneMontageSousElement || certZoneMontageLAD || certZoneMontagePU || certZoneMontageAgrafs || certZoneMontageVissage || certZoneMontageGoulotte || certZoneMontageBOL || certZoneMontageCFinal || certZoneMontageAutrePostes);
    setCertOpenZones((prev) => ({
      coupe: prev.coupe || coupeHas,
      preparation: prev.preparation || prepHas,
      montage: prev.montage || montageHas,
    }));
  }, [
    certZoneCoupeCoupe, certZoneCoupeSertissage, certZoneCoupeAutres,
    certZonePrepEpissure, certZonePrepRetreint, certZonePrepTorsadage, certZonePrepEiamage, certZonePrepKabatec, certZonePrepLovage, certZonePrepAutres,
    certZoneMontageSousElement, certZoneMontageLAD, certZoneMontagePU, certZoneMontageAgrafs, certZoneMontageVissage, certZoneMontageGoulotte, certZoneMontageBOL, certZoneMontageCFinal, certZoneMontageAutrePostes,
  ]);

  // Bilan / examen optionnels : fonctionnalité retirée (éviter setters inexistants)

  // Auto-remplir "Informations entreprise" selon le site (saisie dans admin)
  useEffect(() => {
    let cancelled = false;
    const siteId = getUserSiteId();
    if (!siteId) return undefined;

    (async () => {
      try {
        const s = await getSite(siteId);
        if (cancelled || !s) return;

        const raison = s.raison_sociale ?? s.company_name ?? s.companyName ?? '';
        const nat = s.nature_activite ?? s.natureActivite ?? s.activity ?? '';
        const cnss = s.numero_cnss_entreprise ?? s.numeroCnssEntreprise ?? s.cnss_entreprise ?? '';
        const adr = s.adresse_entreprise ?? s.adresseEntreprise ?? s.address ?? s.adresse ?? '';
        const qual = s.qualifications ?? s.qualificationsSite ?? s.qualifications_site ?? '';

        setRaison(String(raison || ''));
        setNat(String(nat || ''));
        setNoCnss(String(cnss || ''));
        setAdr(String(adr || ''));
        setQualifs(String(qual || ''));
      } catch {
        // keep manual inputs if backend not ready
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const goToFichesDuJour = () => {
    if (onSuccess && savedFiche) {
      const openTab =
        isMaturTemplate && shouldShowMateurDocChoice
          ? (mateurDocType === 'CERTIFICAT' ? 'certificat' : 'fiche')
          : undefined;
      onSuccess(savedFiche, false, { openTab });
    }
  };

  const handlePrintFicheAndGo = () => {
    if (!savedFiche) return;
    const printCfg = getSitePrintConfig(savedFiche, user);
    const html =
      isMaturTemplate && shouldShowMateurDocChoice && mateurDocType === 'FICHE'
        ? buildFicheAptitudeMaturHTML(savedFiche, printCfg, {
            examens_ulterieurs: maturExamRows,
            medecin_connecte_nom: medecinDisplayNameFromUser(user),
          })
        : buildFicheAptitudePrintHtml(savedFiche, printCfg, user);
    printHTML(html);
    goToFichesDuJour();
  };

  const handlePrintCertificatAndGo = () => {
    if (!savedFiche || !savedCertForm) return;
    const html = buildCertificatAptitudeMateurHTML(savedFiche, savedCertForm, siteConfig);
    printHTML(html);
    goToFichesDuJour();
  };

  // Bilan / Examens optionnels supprimés

  const handleSave = async () => {
    const aptitudeToSend = isMessadineTemplate
      ? (sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE' ? 'INAPTE_TEMPORAIRE' : 'APTE_AU_POSTE')
      : aptitude;

    const validationError = validateFicheByTemplate({
      templateBranch,
      collab,
      typeVisite,
      aptitude: aptitudeToSend,
    });
    if (validationError) return setError(validationError);

    setError(''); setSaving(true);
    const isCandidatEmbauche = collab._selectionSource === 'candidat_embauche';
    let dureeAptitudeMessadine = undefined;
    if (isMessadineTemplate) {
      if (sousseAptitudeChoice === 'APTITUDE') dureeAptitudeMessadine = String(dureeAptitudeDate || '').trim();
      else dureeAptitudeMessadine = '';
    }

    const baseFiche = {
      ...buildFichePayloadByTemplate({
        templateBranch,
        date_visite: dateVisite, type_visite: typeVisite,
        aptitude: aptitudeToSend,
        precision_aptitude: precision,
        numero_cnss: String(pickCnssCollaborateur(collab)).trim(),
        raison_sociale: raisonSoc,
        nature_activite: natActivite,
        adresse_entreprise: adresseEnt,
        numero_cnss_entreprise: noCnss,
        qualifications: qualifs,
        collaborateur: isCandidatEmbauche ? null : collab.id,
        matricule: isCandidatEmbauche ? (collab.matricule || '') : '',
      }),
      ...(isMessadineTemplate && dureeAptitudeMessadine !== undefined ? { duree_aptitude: dureeAptitudeMessadine } : {}),
      ...(isMaturTemplate && shouldShowMateurDocChoice && mateurDocType === 'FICHE'
        ? { examens_ulterieurs: maturExamRows }
        : {}),
    };
    try {
      setSavedFiche(null);
      setSavedCertForm(null);

      let fiche;
      if (isCandidatEmbauche) {
        fiche = await creerFicheAptitude(baseFiche);
        await rattacherFicheAuCandidat(collab.id, fiche.id);
      } else {
        fiche = await creerFicheAptitude(baseFiche);
      }

      // MATEUR: si l'utilisateur a choisi "Certificat", on crée aussi le certificat (backend: description)
      if (isMaturTemplate && shouldShowMateurDocChoice && mateurDocType === 'CERTIFICAT') {
        const certPayload = {
          __mateur_cert_v1: {
            version: 1,
            type_visite: typeVisite, // SPONTANEE = situation d'urgence
            aptitude: aptitudeToSend,
            precision_aptitude: precision,
            entete: {
              certificat_medical_aptitude: !!certHeaderCertificatMedical,
              reprise_au_poste: !!certHeaderReprisePoste,
            },
            avis: {
              etat_general_efficience: certAvisEtatGeneral,
              debout_prolonge: certAvisDebout,
              assis_prolonge: certAvisAssis,
              charge_sup_4kg: certAvisCharge4,
              poignet_bras_epaule: certAvisPoignetBrasEpaule,
              cou: certAvisCou,
              effort_precision_concentration: certAvisEffortPrecision,
              rotation_equipe_possible: certAvisRotationEquipe,
              a_prendre_en_consideration: {
                maladie_professionnelle: certApcMaladiePro,
                accident_travail_sequelles: certApcAccident,
                maladies_chroniques: certApcMaladiesChroniques,
              },
            },
            zones: {
              coupe: {
                coupe: certZoneCoupeCoupe,
                sertissage_manuel: certZoneCoupeSertissage,
                autres_remarques: certZoneCoupeAutres,
              },
              preparation: {
                epissure: certZonePrepEpissure,
                retreint: certZonePrepRetreint,
                torsadage: certZonePrepTorsadage,
                eiamage: certZonePrepEiamage,
                kabatec: certZonePrepKabatec,
                lovage: certZonePrepLovage,
                autres_remarques: certZonePrepAutres,
              },
              montage: {
                sous_element: certZoneMontageSousElement,
                montage_lad: certZoneMontageLAD,
                pu: certZoneMontagePU,
                c_agrafs: certZoneMontageAgrafs,
                vissage: certZoneMontageVissage,
                montage_goulotte: certZoneMontageGoulotte,
                bol: certZoneMontageBOL,
                c_final: certZoneMontageCFinal,
                autre_postes_montage: certZoneMontageAutrePostes,
              },
            },
            autres_remarques: certAutresRemarques,
          },
        };
        const certForm = {
          fiche_aptitude: fiche.id,
          date_emission: dateVisite,
          description: JSON.stringify(certPayload),
        };
        await creerCertificat(certForm);
        setSavedCertForm(certForm);
      }

      const ficheComplete = await getFicheAptitude(fiche.id);
      setSavedFiche(ficheComplete);
      setShowSuccessModal(true);
      if (onSuccess) onSuccess(ficheComplete, true);
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : 'Erreur lors de la création.';
      setError(msg);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <style>{`
        .nf-input:focus { border-color: ${SKY[400]} !important; box-shadow: 0 0 0 3px ${SKY[100]} !important; outline: none; }
        .nf-btn-toggle:hover { transform: translateY(-1px); }
      `}</style>

      <div style={{
        background: 'white', borderRadius: 18,
        border: `1.5px solid ${SKY[100]}`,
        boxShadow: `0 4px 24px ${SKY[100]}`,
        padding: '28px 32px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Top gradient bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, ${SKY[400]}, ${SKY[600]}, ${SKY[400]})`,
        }} />

        {/* ── Collaborateur ── */}
        <Section icon={IcoUser} title="Collaborateur">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            <div>
              <FieldLabel required>Rechercher un collaborateur ou un candidat (embauche)</FieldLabel>
              <SearchCollaborateur onSelect={setCollab} placeholder="Nom, prénom ou matricule…" />
            </div>

            {collab && (
              <div style={{
                background: SKY[50], border: `1.5px solid ${SKY[200]}`,
                borderRadius: 14, padding: '16px 18px',
                animation: 'fadeIn .25s ease',
              }}>
                <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${SKY[100]}` }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: `linear-gradient(135deg, ${SKY[600]}, ${SKY[800]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 14, fontWeight: 800,
                    boxShadow: `0 4px 12px ${SKY[200]}`,
                  }}>
                    {(collab.nom?.[0] || '?').toUpperCase()}{(collab.prenom?.[0] || '').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: SKY[800] }}>{collab.nom} {collab.prenom}</div>
                    <div style={{ fontSize: 11.5, color: SKY[500], marginTop: 1 }}>
                      {collab._selectionSource === 'candidat_embauche' ?
                        <StatusChip color='#16a34a' label='Candidat embauche' /> :
                        <StatusChip color='#0284c7' label='Collaborateur' />
                      }
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <InfoField label="Matricule" value={collab.matricule} mono />
                  <InfoField label="Poste" value={collab.poste} />
                  <InfoField label="Département" value={pickDepartementCollaborateur(collab)} />
                  <InfoField label="N° CNSS" value={pickCnssCollaborateur(collab)} mono />
                  <div style={{ gridColumn: '2 / -1' }}>
                    <InfoField label="Lieu de naissance" value={pickLieuNaissanceCollaborateur(collab)} />
                  </div>
                </div>
                {collab.id != null && String(collab.id).trim() !== '' && (
                  <EnteteMaladiesChroniques collaborateurId={collab.id} style={{ marginTop: 14, marginBottom: 0 }} />
                )}
              </div>
            )}
          </div>
        </Section>

        {shouldShowMateurDocChoice && (
          <Section icon={IcoNote} title="Document à délivrer (Mateur)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 10 }}>
              <div
                onClick={() => setMateurDocType('FICHE')}
                style={{
                  cursor: 'pointer',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `2px solid ${mateurDocType === 'FICHE' ? SKY[400] : SKY[100]}`,
                  background: mateurDocType === 'FICHE' ? SKY[50] : 'white',
                  color: '#0f172a',
                  fontWeight: 800,
                }}
              >
                Fiche d'aptitude (Annexe n°3)
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 4 }}>
                  Formulaire + impression sur 2 pages.
                </div>
              </div>
              <div
                onClick={() => setMateurDocType('CERTIFICAT')}
                style={{
                  cursor: 'pointer',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `2px solid ${mateurDocType === 'CERTIFICAT' ? SKY[400] : SKY[100]}`,
                  background: mateurDocType === 'CERTIFICAT' ? SKY[50] : 'white',
                  color: '#0f172a',
                  fontWeight: 800,
                }}
              >
                Certificat d'aptitude
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 4 }}>
                  Saisie des zones (travail/circulation/protection/message).
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ── Visite ── */}
        {!(shouldShowMateurDocChoice && mateurDocType === 'CERTIFICAT') && (
        <Section icon={IcoCalendar} title="Informations visite">
          <div style={{ display: 'grid', gridTemplateColumns: isMessadineTemplate ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 12 }}>
            {!(shouldShowMateurDocChoice && mateurDocType === 'FICHE') && (
              <div>
                <FieldLabel required>Type de visite</FieldLabel>
                <FocusSelect value={typeVisite} onChange={e => setType(e.target.value)}
                  style={{ ...inputSx, cursor: 'pointer', appearance: 'none' }}>
                  <option value="">Sélectionner…</option>
                  {TYPES_VISITE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </FocusSelect>
              </div>
            )}
            <div>
              <FieldLabel required>Date de visite</FieldLabel>
              <FocusInput type="date" value={dateVisite} onChange={e => setDate(e.target.value)} style={inputSx} />
            </div>
            {!hideEntrepriseFields && (
              <>
                <div>
                  <FieldLabel>Raison sociale</FieldLabel>
                  <FocusInput type="text" value={raisonSoc} readOnly style={{ ...inputSx, background: '#f8fafc' }} />
                </div>
                <div>
                  <FieldLabel>Nature d'activité</FieldLabel>
                  <FocusInput type="text" value={natActivite} readOnly style={{ ...inputSx, background: '#f8fafc' }} />
                </div>
                <div>
                  <FieldLabel>N° CNSS entreprise</FieldLabel>
                  <FocusInput type="text" value={noCnss} readOnly style={{ ...inputSx, background: '#f8fafc', fontFamily: 'monospace' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <FieldLabel>Adresse entreprise</FieldLabel>
                  <FocusInput type="text" value={adresseEnt} readOnly style={{ ...inputSx, background: '#f8fafc' }} />
                </div>
                <div>
                  <FieldLabel>Qualifications</FieldLabel>
                  <FocusInput type="text" value={qualifs} readOnly style={{ ...inputSx, background: '#f8fafc' }} />
                </div>
              </>
            )}
          </div>
        </Section>
        )}

        {/* ── Aptitude ── */}
        <Section icon={IcoCheck} title="Résultat d'aptitude">
          {isMessadineTemplate ? (
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
                    onClick={() => {
                      setSousseAptitudeChoice(a.key);
                      setApt(a.key === 'APTITUDE_TEMPORAIRE' ? 'INAPTE_TEMPORAIRE' : 'APTE_AU_POSTE');
                      if (a.key === 'REPRISE_MO_AT') setType('REPRISE');
                      if (a.key === 'APTITUDE' || a.key === 'REPRISE_MO_AT' || a.key === 'APTITUDE_TEMPORAIRE') {
                        setDureeAptitudeDate('');
                      }
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
          ) : shouldShowMateurDocChoice && mateurDocType === 'CERTIFICAT' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {APTITUDES_CERT_MATEUR.map((a) => {
                const s = APT_STYLE[a.cls];
                const sel = aptitude === a.value;
                return (
                  <div key={a.value} onClick={() => setApt(a.value)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 13px', borderRadius: 11, cursor: 'pointer',
                    border: `2px solid ${sel ? s.selBorder : '#e2e8f0'}`,
                    background: sel ? s.selBg : '#f8fafc',
                    color: sel ? s.color : '#64748b',
                    fontSize: 12.5, fontWeight: sel ? 700 : 500,
                    transition: 'all .15s cubic-bezier(.4,0,.2,1)',
                    boxShadow: sel ? `0 4px 14px ${s.dot}25` : 'none',
                    transform: sel ? 'translateY(-1px)' : 'none',
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: sel ? s.dot : '#e2e8f0',
                      flexShrink: 0, transition: 'background .15s',
                    }} />
                    {a.label}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
              {APTITUDES.map(a => {
                const s = APT_STYLE[a.cls];
                const sel = aptitude === a.value;
                return (
                  <div key={a.value} onClick={() => setApt(a.value)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 13px', borderRadius: 11, cursor: 'pointer',
                    border: `2px solid ${sel ? s.selBorder : '#e2e8f0'}`,
                    background: sel ? s.selBg : '#f8fafc',
                    color: sel ? s.color : '#64748b',
                    fontSize: 12.5, fontWeight: sel ? 700 : 500,
                    transition: 'all .15s cubic-bezier(.4,0,.2,1)',
                    boxShadow: sel ? `0 4px 14px ${s.dot}25` : 'none',
                    transform: sel ? 'translateY(-1px)' : 'none',
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: sel ? s.dot : '#e2e8f0',
                      flexShrink: 0, transition: 'background .15s',
                    }} />
                    {a.label}
                  </div>
                );
              })}
            </div>
          )}

          {(isMessadineTemplate ? !!sousseAptitudeChoice : !!aptitude) && (
            <div style={{
              padding: '14px 16px',
              background: `linear-gradient(135deg, ${SKY[50]}, #f0f9ff)`,
              border: `1.5px solid ${SKY[200]}`,
              borderRadius: 12,
              animation: 'fadeIn .2s ease',
            }}>
              {!isMessadineTemplate && !(shouldShowMateurDocChoice && mateurDocType === 'CERTIFICAT') && (
                <div>
                  <FieldLabel><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IcoNote /> Précision aptitude</span></FieldLabel>
                  <FocusInput type="text" value={precision} onChange={e => setPrec(e.target.value)}
                    placeholder="Ex : poste compatible avec restrictions, remarques..."
                    style={{ ...inputSx, background: 'white', borderColor: SKY[200] }} />
                </div>
              )}

              {sousseAptitudeChoice === 'APTITUDE' && (
                <>
                  <div style={{ fontSize: 12.5, color: SKY[800], fontWeight: 800, lineHeight: 1.45, marginBottom: 6 }}>
                    {collab?.im_data?.fonction || collab?.poste || '—'}
                  </div>
                  <div>
                    <FieldLabel><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IcoNote /> 1) Est apte/inapte pour le poste de</span></FieldLabel>
                    <FocusInput type="text" value={precision} onChange={e => setPrec(e.target.value)}
                      placeholder="Précision médicale…"
                      style={{ ...inputSx, background: 'white', borderColor: SKY[200] }} />
                  </div>
                  <div>
                    <FieldLabel><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IcoCalendar /> et ce pour une durée de</span></FieldLabel>
                    <FocusInput type="text" value={dureeAptitudeDate} onChange={e => setDureeAptitudeDate(e.target.value)}
                      style={{ ...inputSx, background: 'white', borderColor: SKY[200] }} />
                  </div>
                </>
              )}

              {sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE' && (
                <div>
                  <FieldLabel><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IcoInfo /> 2) Est apte Temporairement pour une période de</span></FieldLabel>
                  <FocusInput type="text" value={precision} onChange={e => setPrec(e.target.value)}
                    placeholder="Ex : 3 mois"
                    style={{ ...inputSx, background: 'white', borderColor: SKY[200] }} />
                </div>
              )}

              {sousseAptitudeChoice === 'REPRISE_MO_AT' && (
                <div>
                  <FieldLabel><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IcoCalendar /> 3) Peut reprendre son travail à dater du</span></FieldLabel>
                  <FocusInput type="text" value={precision} onChange={e => setPrec(e.target.value)}
                    style={{ ...inputSx, background: 'white', borderColor: SKY[200] }} />
                </div>
              )}
            </div>
          )}
        </Section>

        {shouldShowMateurDocChoice && mateurDocType === 'FICHE' && (
          <Section icon={IcoNote} title="4 — Examens médicaux ultérieurs (Mateur)">
            <div style={{ border: `1.5px solid ${SKY[200]}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', background: SKY[50], borderBottom: `1.5px solid ${SKY[200]}` }}>
                <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Date et Nature de l’examen (P/R/S)</div>
                <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Conclusions en matière d’aptitude au travail (à préciser)</div>
                <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Nom, prénom et Signature du médecin</div>
              </div>

              {maturExamRows.slice(0, maturExamVisibleCount).map((row, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', borderBottom: idx === (maturExamVisibleCount - 1) ? 'none' : `1px solid ${SKY[100]}` }}>
                  <div style={{ padding: 10 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <CheckBox label="P" checked={!!row.p} onChange={() => setMaturExamRows((prev) => prev.map((r, i) => i !== idx ? r : ({ ...r, p: !r.p, r: false, s: false })))} />
                      <CheckBox label="R" checked={!!row.r} onChange={() => setMaturExamRows((prev) => prev.map((r, i) => i !== idx ? r : ({ ...r, r: !r.r, p: false, s: false })))} />
                      <CheckBox label="S" checked={!!row.s} onChange={() => setMaturExamRows((prev) => prev.map((r, i) => i !== idx ? r : ({ ...r, s: !r.s, p: false, r: false })))} />
                    </div>
                    <FocusTextarea
                      rows={3}
                      value={row.date_nature}
                      onChange={(e) => setMaturExamRows((prev) => prev.map((r, i) => i !== idx ? r : ({ ...r, date_nature: e.target.value })))}
                      placeholder="Date + nature de l’examen…"
                      style={{ ...inputSx, resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ padding: 10 }}>
                    <FocusTextarea
                      rows={4}
                      value={row.conclusion}
                      onChange={(e) => setMaturExamRows((prev) => prev.map((r, i) => i !== idx ? r : ({ ...r, conclusion: e.target.value })))}
                      style={{ ...inputSx, resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ padding: 10 }}>
                    <FocusTextarea
                      rows={4}
                      value={row.medecin}
                      onChange={(e) => setMaturExamRows((prev) => prev.map((r, i) => i !== idx ? r : ({ ...r, medecin: e.target.value })))}
                      placeholder="Nom, prénom + signature…"
                      style={{ ...inputSx, resize: 'vertical' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {maturExamVisibleCount < maturExamRows.length && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setMaturExamVisibleCount((c) => Math.min(maturExamRows.length, c + 1))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg,#0ea5e9,#0369a1)',
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
          </Section>
        )}

        {shouldShowMateurDocChoice && mateurDocType === 'CERTIFICAT' && (
          <Section icon={IcoNote} title="Contenu du certificat (Mateur)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
              <div style={{ padding: '12px 14px', background: SKY[50], border: `1.5px solid ${SKY[200]}`, borderRadius: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: SKY[800], marginBottom: 6 }}>
                  Avis Service médecine de travail concernant état de santé général et contre-indication au poste de travail
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <FieldLabel required>Visite</FieldLabel>
                    <FocusSelect value={typeVisite} onChange={(e) => setType(e.target.value)} style={{ ...inputSx, cursor: 'pointer' }}>
                      <option value="">Sélectionner…</option>
                      <option value="EMBAUCHE">Embauche</option>
                      <option value="PERIODIQUE">Périodique</option>
                      <option value="SPONTANEE">Situation d'urgence</option>
                      <option value="REPRISE">Reprise</option>
                    </FocusSelect>
                  </div>
                  <div>
                    <FieldLabel required>Date de visite</FieldLabel>
                    <FocusInput type="date" value={dateVisite} onChange={e => setDate(e.target.value)} style={inputSx} />
                  </div>
                </div>

                <div style={{ height: 10 }} />

                <div style={{ padding: '10px 12px', border: `1.5px solid ${SKY[100]}`, borderRadius: 12, background: 'white', marginBottom: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 8 }}>En-tête du certificat</div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                      <input type="checkbox" checked={certHeaderCertificatMedical} onChange={(e) => setCertHeaderCertificatMedical(e.target.checked)} />
                      Certificat médicale d&apos;aptitude
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                      <input type="checkbox" checked={certHeaderReprisePoste} onChange={(e) => setCertHeaderReprisePoste(e.target.checked)} />
                      Reprise au poste de travail
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div>
                    <FieldLabel>État général efficience</FieldLabel>
                    <FocusTextarea rows={2} value={certAvisEtatGeneral} onChange={(e) => setCertAvisEtatGeneral(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                  </div>
                  <div>
                    <FieldLabel>Debout prolongé</FieldLabel>
                    <FocusTextarea rows={2} value={certAvisDebout} onChange={(e) => setCertAvisDebout(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                  </div>
                  <div>
                    <FieldLabel>Assis prolongé</FieldLabel>
                    <FocusTextarea rows={2} value={certAvisAssis} onChange={(e) => setCertAvisAssis(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                  </div>
                  <div>
                    <FieldLabel>Charge &gt; 4 kgr</FieldLabel>
                    <FocusTextarea rows={2} value={certAvisCharge4} onChange={(e) => setCertAvisCharge4(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                  </div>

                  <div>
                    <FieldLabel>Poignet / Bras / Épaule</FieldLabel>
                    <FocusTextarea rows={2} value={certAvisPoignetBrasEpaule} onChange={(e) => setCertAvisPoignetBrasEpaule(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                  </div>
                  <div>
                    <FieldLabel>Cou</FieldLabel>
                    <FocusTextarea rows={2} value={certAvisCou} onChange={(e) => setCertAvisCou(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                  </div>
                  <div>
                    <FieldLabel>Effort / précision / concentration</FieldLabel>
                    <FocusTextarea rows={2} value={certAvisEffortPrecision} onChange={(e) => setCertAvisEffortPrecision(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                  </div>
                  <div>
                    <FieldLabel>Rotation équipe possible</FieldLabel>
                    <FocusTextarea rows={2} value={certAvisRotationEquipe} onChange={(e) => setCertAvisRotationEquipe(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <FieldLabel>À prendre en considération</FieldLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div>
                      <FieldLabel>Maladie professionnelle</FieldLabel>
                      <FocusTextarea rows={2} value={certApcMaladiePro} onChange={(e) => setCertApcMaladiePro(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                    </div>
                    <div>
                      <FieldLabel>Accident de travail avec séquelles</FieldLabel>
                      <FocusTextarea rows={2} value={certApcAccident} onChange={(e) => setCertApcAccident(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                    </div>
                    <div>
                      <FieldLabel>Maladies chroniques</FieldLabel>
                      <FocusTextarea rows={2} value={certApcMaladiesChroniques} onChange={(e) => setCertApcMaladiesChroniques(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 14px', border: `1.5px solid ${SKY[200]}`, borderRadius: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>Zones</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <button type="button" onClick={() => setCertOpenZones((p) => ({ ...p, coupe: !p.coupe }))}
                      style={{ padding: '6px 10px', borderRadius: 10, border: `1.5px solid ${certOpenZones.coupe ? SKY[400] : SKY[100]}`, background: certOpenZones.coupe ? SKY[50] : 'white', cursor: 'pointer', fontWeight: 900, fontSize: 11.5, color: certOpenZones.coupe ? SKY[800] : '#475569', textAlign: 'left', width: 'fit-content' }}>
                      Zone Coupe
                    </button>
                    {certOpenZones.coupe && (
                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <div><FieldLabel>Coupe</FieldLabel><FocusTextarea rows={4} value={certZoneCoupeCoupe} onChange={(e) => setCertZoneCoupeCoupe(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Sertissage manuel</FieldLabel><FocusTextarea rows={4} value={certZoneCoupeSertissage} onChange={(e) => setCertZoneCoupeSertissage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Autres remarques</FieldLabel><FocusTextarea rows={4} value={certZoneCoupeAutres} onChange={(e) => setCertZoneCoupeAutres(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                      </div>
                    )}
                  </div>

                  <div>
                    <button type="button" onClick={() => setCertOpenZones((p) => ({ ...p, preparation: !p.preparation }))}
                      style={{ padding: '6px 10px', borderRadius: 10, border: `1.5px solid ${certOpenZones.preparation ? SKY[400] : SKY[100]}`, background: certOpenZones.preparation ? SKY[50] : 'white', cursor: 'pointer', fontWeight: 900, fontSize: 11.5, color: certOpenZones.preparation ? SKY[800] : '#475569', textAlign: 'left', width: 'fit-content' }}>
                      Zone Préparation
                    </button>
                    {certOpenZones.preparation && (
                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        <div><FieldLabel>Epissure</FieldLabel><FocusTextarea rows={3} value={certZonePrepEpissure} onChange={(e) => setCertZonePrepEpissure(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Retreint</FieldLabel><FocusTextarea rows={3} value={certZonePrepRetreint} onChange={(e) => setCertZonePrepRetreint(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Torsadage</FieldLabel><FocusTextarea rows={3} value={certZonePrepTorsadage} onChange={(e) => setCertZonePrepTorsadage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Eiamage</FieldLabel><FocusTextarea rows={3} value={certZonePrepEiamage} onChange={(e) => setCertZonePrepEiamage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Kabatec</FieldLabel><FocusTextarea rows={3} value={certZonePrepKabatec} onChange={(e) => setCertZonePrepKabatec(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Lovage</FieldLabel><FocusTextarea rows={3} value={certZonePrepLovage} onChange={(e) => setCertZonePrepLovage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div style={{ gridColumn: 'span 2' }}><FieldLabel>Autres remarques</FieldLabel><FocusTextarea rows={3} value={certZonePrepAutres} onChange={(e) => setCertZonePrepAutres(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                      </div>
                    )}
                  </div>

                  <div>
                    <button type="button" onClick={() => setCertOpenZones((p) => ({ ...p, montage: !p.montage }))}
                      style={{ padding: '6px 10px', borderRadius: 10, border: `1.5px solid ${certOpenZones.montage ? SKY[400] : SKY[100]}`, background: certOpenZones.montage ? SKY[50] : 'white', cursor: 'pointer', fontWeight: 900, fontSize: 11.5, color: certOpenZones.montage ? SKY[800] : '#475569', textAlign: 'left', width: 'fit-content' }}>
                      Zone Montage
                    </button>
                    {certOpenZones.montage && (
                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        <div><FieldLabel>Sous élément</FieldLabel><FocusTextarea rows={3} value={certZoneMontageSousElement} onChange={(e) => setCertZoneMontageSousElement(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Montage LAD</FieldLabel><FocusTextarea rows={3} value={certZoneMontageLAD} onChange={(e) => setCertZoneMontageLAD(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>PU</FieldLabel><FocusTextarea rows={3} value={certZoneMontagePU} onChange={(e) => setCertZoneMontagePU(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>C. Agrafs</FieldLabel><FocusTextarea rows={3} value={certZoneMontageAgrafs} onChange={(e) => setCertZoneMontageAgrafs(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Vissage</FieldLabel><FocusTextarea rows={3} value={certZoneMontageVissage} onChange={(e) => setCertZoneMontageVissage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>Montage goulotte</FieldLabel><FocusTextarea rows={3} value={certZoneMontageGoulotte} onChange={(e) => setCertZoneMontageGoulotte(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>BOL</FieldLabel><FocusTextarea rows={3} value={certZoneMontageBOL} onChange={(e) => setCertZoneMontageBOL(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div><FieldLabel>C. Final</FieldLabel><FocusTextarea rows={3} value={certZoneMontageCFinal} onChange={(e) => setCertZoneMontageCFinal(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                        <div style={{ gridColumn: 'span 4' }}><FieldLabel>Autre postes Montage</FieldLabel><FocusTextarea rows={3} value={certZoneMontageAutrePostes} onChange={(e) => setCertZoneMontageAutrePostes(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel>Autres remarques</FieldLabel>
                <FocusTextarea rows={4} value={certAutresRemarques} onChange={(e) => setCertAutresRemarques(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
              </div>
            </div>
          </Section>
        )}

        {/* Bilan / Examens optionnels supprimés de "Nouvelle fiche" */}

        {/* ── Erreur ── */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626',
            padding: '11px 14px', borderRadius: 11, fontSize: 13, marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        {showSuccessModal && savedFiche && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 80,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 'min(760px, 100%)',
                background: 'white',
                borderRadius: 18,
                border: `1.5px solid ${SKY[100]}`,
                boxShadow: '0 18px 50px rgba(15, 23, 42, 0.2)',
                overflow: 'hidden',
              }}
            >
              <div style={{ background: `linear-gradient(90deg, ${SKY[600]}, ${SKY[500]})`, color: 'white', padding: '16px 20px' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Fiche créée avec succès</div>
                <div style={{ fontSize: 13, opacity: 0.92, marginTop: 4 }}>
                  Choisis l’action à faire, puis tu reviendras automatiquement à la fiche du jour.
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {(!shouldShowMateurDocChoice || mateurDocType === 'FICHE') && (
                    <ActionButton onClick={handlePrintFicheAndGo}>Imprimer fiche aptitude</ActionButton>
                  )}
                  {shouldShowMateurDocChoice && mateurDocType === 'CERTIFICAT' && (
                    <ActionButton onClick={handlePrintCertificatAndGo}>Imprimer certificat</ActionButton>
                  )}
                  {!hideBilanExamenOptionnels && (
                    <ActionButton onClick={goToFichesDuJour}>Ajouter un bilan</ActionButton>
                  )}
                  <ActionButton onClick={goToFichesDuJour}>Certificat d'aptitude</ActionButton>
                  {resolveFichePrintTemplate(savedFiche) === 'MESSADINE' && (
                    <ActionButton onClick={goToFichesDuJour}>Ordonnance</ActionButton>
                  )}
                  {resolveFichePrintTemplate(savedFiche) === 'MESSADINE' && (
                    <ActionButton onClick={goToFichesDuJour}>Fiche de liaison</ActionButton>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                  <button
                    onClick={goToFichesDuJour}
                    style={{
                      border: 'none',
                      background: `linear-gradient(135deg, ${SKY[500]}, ${SKY[700]})`,
                      color: 'white',
                      borderRadius: 10,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    Aller à la fiche du jour
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <button onClick={handleSave} disabled={saving} style={{
          display: 'inline-flex', alignItems: 'center', gap: 9,
          padding: '12px 28px',
          background: saving ? '#94a3b8' : `linear-gradient(135deg, ${SKY[500]}, ${SKY[700]})`,
          color: 'white', border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: saving ? 'none' : `0 6px 20px ${SKY[300]}`,
          transition: 'all .2s',
          transform: saving ? 'none' : undefined,
        }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <IcoSave />
          {saving ? 'Enregistrement en cours…' : 'Enregistrer la fiche'}
        </button>
      </div>
    </div>
  );
}

function ActionButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: '1.5px solid #cfe8fb',
        background: '#f8fbff',
        color: '#075985',
        borderRadius: 12,
        padding: '12px 14px',
        fontWeight: 700,
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: 54,
      }}
    >
      {children}
    </button>
  );
}