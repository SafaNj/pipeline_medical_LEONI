import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';
import { getUserSiteName } from '../utils/siteAccessControl';
import {
  getFichesAptitude,
  getListesEmbaucheAssignees,
  getCollaborateur,
} from '../api/Medicalworkapi';
import { getListesVisitesPeriodiquesPourMedecin } from '../api/visitesPeriodiquesApi';

import TableauBord      from '../components/medecinTravail/Tableaubord';
import ListeFiches      from '../components/medecinTravail/Listefiches';
import DetailFiche      from '../components/medecinTravail/Detailfiche';
import NouvelleFiche    from '../components/medecinTravail/Nouvellefiche';
import DossierMedical   from '../components/medecinTravail/Dossiermedical';
import HistoriquePatient from '../components/medecinControleur/HistoriquePatient';
import VueEmbauche, { VueVisitesPeriodiques, VueSurveillanceSpecialeMedecin } from '../components/medecinTravail/VueEmbauche';
import { getListesSurveillanceSpeciale } from '../api/surveillanceSpecialeApi';
import DocumentsMedicauxScannesPage from '../components/documents/DocumentsMedicauxScannesPage';
import MaladiesChroniques from '../components/infirmier/MaladiesChroniques';
import { buildUserScopedStorageKey, getUserCacheIdentity } from '../utils/userSessionCache';
import {
  getDateVisitePourFiltreJour,
  isDateVisiteToday,
  isFicheMedecinFichesDuJour,
  sortFichesDuJourMedecin,
} from '../utils/dateVisite';
import { getSitePrintConfig } from '../utils/siteConfig';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../utils/siteTemplateResolver';

/* ─── SVG Icons  */
const IcoDashboard = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IcoFiches = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoPlus = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoDossier = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoScans = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IcoHistorique = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoHeart = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcoHospital = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
    <line x1="12" y1="7" x2="12" y2="11"/>
    <line x1="10" y1="9" x2="14" y2="9"/>
  </svg>
);
const IcoLogout = ({ size = 14, color = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
// Icône embauche (liste RH reçues)
const IcoEmbauche = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

// Icône paramètres
const IcoSettings = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>
  </svg>
);

/* ─── helpers  */
const todayLabel = () =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// Couleurs bleues — style infirmier ciel clair (identique DashboardInfirmier)
const BLUE = '#0284c7';
const BLUE_DARK = '#0c4a6e';
// Sidebar : dégradé ciel clair exactement comme infirmier
const BLUE_BG = 'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 40%, #7dd3fc 78%, #38bdf8 100%)';
const BLUE_ACTIVE = '#0284c7';          // fond bouton actif = bleu solide
const BLUE_ACTIVE_BORDER = '#0284c7';
const BLUE_ACTIVE_COLOR = '#ffffff';    // texte blanc sur actif

/* ─── config navigation ───────────────────────────── */
const NAV = [
  {
    section: 'Accueil',
    items: [
      { id: 'accueil',    label: 'Tableau de bord',      Icon: IcoDashboard },
    ],
  },
  {
    section: "Fiches d'aptitude",
    items: [
      { id: 'fiches',     label: 'Fiches du jour',        Icon: IcoFiches, showBadge: true },
      { id: 'nouvelle',   label: 'Nouvelle fiche',        Icon: IcoPlus },
    ],
  },
  {
    section: 'Dossiers médicaux',
    items: [
      { id: 'dossier',    label: 'Consulter / Compléter', Icon: IcoDossier },
      { id: 'documents-scans', label: 'Archives / scans', Icon: IcoScans },
    ],
  },
  {
    section: 'Recherche',
    items: [
      { id: 'historique', label: 'Historique patients',   Icon: IcoHistorique },
    ],
  },
  // ── SECTION EMBAUCHE ──
  {
    section: "Visites d'embauche",
    items: [
      { id: 'embauche',   label: 'Listes du jour',        Icon: IcoEmbauche, showBadgeEmbauche: true },
    ],
  },
  {
    section: 'Visites périodiques',
    items: [
      { id: 'visites-periodiques', label: 'Listes du jour', Icon: IcoEmbauche, showBadgeVp: true },
    ],
  },
  {
    section: 'Surveillance SMS',
    items: [
      { id: 'surveillance-speciale', label: 'Surveillance spéciale', Icon: IcoEmbauche, showBadgeSurv: true },
    ],
  },
  {
    section: 'Paramètres',
    items: [
      // supprimé: la configuration site doit venir de la base (admin), pas d'un écran "common"
    ],
  },
];

const TITLES = {
  accueil:    'Tableau de bord',
  fiches:     'Fiches du jour',
  nouvelle:   "Nouvelle fiche d'aptitude",
  dossier:    'Dossiers médicaux',
  'documents-scans': 'Archives / scans (documents)',
  historique: 'Historique patients',
  embauche:   "Visites d'embauche",
  'visites-periodiques': 'Visites périodiques (listes du jour)',
  'surveillance-speciale': 'Surveillance médicale spéciale',
};

/* 
   PAGE PRINCIPALE
 */
export default function DashboardMedecinTravail() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userCacheIdentity = getUserCacheIdentity(user);

  const [vue,          setVue]          = useState('accueil');
  const [collabDossier,setCollabDossier]= useState(null);
  const [fiches,       setFiches]       = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [nbEmbauche,   setNbEmbauche]   = useState(0);
  const [nbVp,         setNbVp]         = useState(0);
  const [nbSurv,       setNbSurv]       = useState(0);
  const [embaucheNotifDelta, setEmbaucheNotifDelta] = useState(0);
  const [vpNotifDelta, setVpNotifDelta] = useState(0);
  const [smsNotifDelta, setSmsNotifDelta] = useState(0);
  const [embaucheNotifLoaded, setEmbaucheNotifLoaded] = useState(false);
  const [vpNotifLoaded, setVpNotifLoaded] = useState(false);
  const [smsNotifLoaded, setSmsNotifLoaded] = useState(false);
  const lastVueRef = useRef(vue);
  const LS_MT_EMBAUCHE_COUNT = buildUserScopedStorageKey('medecin_travail_embauche_last_count', user);
  const LS_MT_VP_COUNT = buildUserScopedStorageKey('medecin_travail_vp_last_count', user);
  const LS_MT_SMS_COUNT = buildUserScopedStorageKey('medecin_travail_sms_last_count', user);

  const loadFiches = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const all = await getFichesAptitude({
        site_id: user?.site_id,
      });
      const isMessadine = (() => {
        const cfg = getSitePrintConfig(user);
        return resolveSiteTemplateFromSources(user, cfg) === SITE_TEMPLATE_BRANCH.MESSADINE;
      })();
      // Fiches du jour (médecin) : uniquement les consultations "hors listes"
      // (créées via Nouvelle fiche / consultation normale).
      // On exclut explicitement : Embauche (candidat RH), SMS, VP.
      const today = (all || []).filter((f) => {
        if (!isFicheMedecinFichesDuJour(f)) return false;
        // Messadine : ne jamais afficher dans "Fiches du jour" les fiches traitées via
        // les modules Embauche / Périodique / SMS (elles ont leurs écrans dédiés).
        if (isMessadine) {
          const tv = String(f?.type_visite || '').trim().toUpperCase();
          if (tv === 'EMBAUCHE' || tv === 'PERIODIQUE' || tv === 'SURVEILLANCE_SPECIALE') return false;
          if (tv.includes('SURVEILLANCE') && (tv.includes('SPEC') || tv.includes('SPECIAL') || tv.includes('SMS'))) return false;
        }
        const dv = getDateVisitePourFiltreJour(f);
        return isDateVisiteToday(dv);
      });

      // Enrichir avec le nom du collaborateur si absent
      const enriched = await Promise.all(
        today.map(async (f) => {
          if (!f.collaborateur_nom && f.collaborateur) {
            try {
              const collab = await getCollaborateur(f.collaborateur);
              return {
                ...f,
                collaborateur_nom: collab.nom_complet || `${collab.prenom || ''} ${collab.nom || ''}`.trim() || collab.username || `#${f.collaborateur}`,
                collaborateur_matricule: f.collaborateur_matricule || collab.matricule || '',
                collaborateur_poste: f.collaborateur_poste || collab.poste || '',
              };
            } catch {
              return f;
            }
          }
          return f;
        })
      );
      const sorted = sortFichesDuJourMedecin(enriched);
      setFiches(sorted);
      setSelected((prev) => {
        if (sorted.length === 0) return null;
        if (!prev) return sorted[0];
        const still = sorted.find((x) => String(x.id) === String(prev.id));
        return still ?? sorted[0];
      });
    } catch {
      setError('Impossible de charger les fiches.');
    } finally {
      setLoading(false);
    }
  }, [user, user?.site_id]);

  useEffect(() => {
    setFiches([]);
    setSelected(null);
    setNbEmbauche(0);
    setNbVp(0);
    setNbSurv(0);
    setEmbaucheNotifDelta(0);
    setVpNotifDelta(0);
    setSmsNotifDelta(0);
    setEmbaucheNotifLoaded(false);
    setVpNotifLoaded(false);
    setSmsNotifLoaded(false);
    setLoading(true);
    setError('');
  }, [userCacheIdentity]);

  // Charger le nombre de listes embauche assignées pour le badge
  useEffect(() => {
    let cancelled = false;
    setNbEmbauche(0);
    setEmbaucheNotifLoaded(false);
    getListesEmbaucheAssignees()
      .then((l) => {
        if (cancelled) return;
        const currentCount = Array.isArray(l) ? l.length : 0;
        setNbEmbauche(currentCount);
        const raw = localStorage.getItem(LS_MT_EMBAUCHE_COUNT);
        if (raw === null || raw === '') {
          localStorage.setItem(LS_MT_EMBAUCHE_COUNT, String(currentCount));
          setEmbaucheNotifDelta(0);
          setEmbaucheNotifLoaded(true);
          return;
        }
        const last = parseInt(raw, 10);
        if (Number.isNaN(last) || last < 0) {
          localStorage.setItem(LS_MT_EMBAUCHE_COUNT, String(currentCount));
          setEmbaucheNotifDelta(0);
          setEmbaucheNotifLoaded(true);
          return;
        }
        setEmbaucheNotifDelta(Math.max(currentCount - last, 0));
        if (currentCount < last) {
          localStorage.setItem(LS_MT_EMBAUCHE_COUNT, String(currentCount));
        }
        setEmbaucheNotifLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setEmbaucheNotifLoaded(true);
      });
    return () => { cancelled = true; };
  }, [LS_MT_EMBAUCHE_COUNT, userCacheIdentity]);

  useEffect(() => {
    let cancelled = false;
    setNbVp(0);
    setVpNotifLoaded(false);
    getListesVisitesPeriodiquesPourMedecin()
      .then((l) => {
        if (cancelled) return;
        const currentCount = Array.isArray(l) ? l.length : 0;
        setNbVp(currentCount);
        const raw = localStorage.getItem(LS_MT_VP_COUNT);
        if (raw === null || raw === '') {
          localStorage.setItem(LS_MT_VP_COUNT, String(currentCount));
          setVpNotifDelta(0);
          setVpNotifLoaded(true);
          return;
        }
        const last = parseInt(raw, 10);
        if (Number.isNaN(last) || last < 0) {
          localStorage.setItem(LS_MT_VP_COUNT, String(currentCount));
          setVpNotifDelta(0);
          setVpNotifLoaded(true);
          return;
        }
        setVpNotifDelta(Math.max(currentCount - last, 0));
        if (currentCount < last) {
          localStorage.setItem(LS_MT_VP_COUNT, String(currentCount));
        }
        setVpNotifLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setVpNotifLoaded(true);
      });
    return () => { cancelled = true; };
  }, [LS_MT_VP_COUNT, userCacheIdentity]);

  useEffect(() => {
    let cancelled = false;
    setNbSurv(0);
    setSmsNotifLoaded(false);
    getListesSurveillanceSpeciale()
      .then((l) => {
        if (cancelled) return;
        const enTraitement = (Array.isArray(l) ? l : []).filter(
          (x) => String(x?.statut || '').toUpperCase() === 'EN_TRAITEMENT',
        );
        const currentCount = enTraitement.length;
        setNbSurv(currentCount);
        const raw = localStorage.getItem(LS_MT_SMS_COUNT);
        if (raw === null || raw === '') {
          localStorage.setItem(LS_MT_SMS_COUNT, String(currentCount));
          setSmsNotifDelta(0);
          setSmsNotifLoaded(true);
          return;
        }
        const last = parseInt(raw, 10);
        if (Number.isNaN(last) || last < 0) {
          localStorage.setItem(LS_MT_SMS_COUNT, String(currentCount));
          setSmsNotifDelta(0);
          setSmsNotifLoaded(true);
          return;
        }
        setSmsNotifDelta(Math.max(currentCount - last, 0));
        if (currentCount < last) {
          localStorage.setItem(LS_MT_SMS_COUNT, String(currentCount));
        }
        setSmsNotifLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setSmsNotifLoaded(true);
      });
    return () => { cancelled = true; };
  }, [LS_MT_SMS_COUNT, userCacheIdentity]);

  useEffect(() => { loadFiches(); }, [loadFiches]);

  /* En revenant sur « Fiches du jour », éviter un panneau détail « fantôme » si la fiche n’est plus dans la liste filtrée. */
  useEffect(() => {
    const entered = vue === 'fiches' && lastVueRef.current !== 'fiches';
    lastVueRef.current = vue;
    if (!entered) return;
    setSelected((sel) => {
      if (fiches.length === 0) return null;
      if (!sel) return fiches[0];
      const ok = fiches.find((x) => String(x.id) === String(sel.id));
      return ok ?? fiches[0];
    });
  }, [vue, fiches]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      loadFiches();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [loadFiches]);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const isMedecinMessadine = useMemo(() => {
    const cfg = getSitePrintConfig(user);
    return resolveSiteTemplateFromSources(user, cfg) === SITE_TEMPLATE_BRANCH.MESSADINE;
  }, [user]);
  const isMedecinMateur = useMemo(() => {
    const cfg = getSitePrintConfig(user);
    return resolveSiteTemplateFromSources(user, cfg) === SITE_TEMPLATE_BRANCH.MATEUR;
  }, [user]);

  const handleNaviguerDepuisTB = (vueTarget, ficheTarget = null) => {
    if (ficheTarget) setSelected(ficheTarget);
    setVue(vueTarget);
  };

  const [postCreateOpenTab, setPostCreateOpenTab] = useState(null);

  const loginNotificationsReady = embaucheNotifLoaded && vpNotifLoaded && smsNotifLoaded;
  const loginNotificationsTotal = embaucheNotifDelta + vpNotifDelta + smsNotifDelta;
  const loginNotificationParts = [];
  if (embaucheNotifDelta > 0) loginNotificationParts.push(`${embaucheNotifDelta} embauche`);
  if (vpNotifDelta > 0) loginNotificationParts.push(`${vpNotifDelta} periodique${vpNotifDelta > 1 ? 's' : ''}`);
  if (smsNotifDelta > 0) loginNotificationParts.push(`${smsNotifDelta} SMS`);
  const loginNotificationText = loginNotificationParts.join(' , ');

  const handleVoirListesNotif = () => {
    localStorage.setItem(LS_MT_EMBAUCHE_COUNT, String(nbEmbauche));
    localStorage.setItem(LS_MT_VP_COUNT, String(nbVp));
    localStorage.setItem(LS_MT_SMS_COUNT, String(nbSurv));
    setEmbaucheNotifDelta(0);
    setVpNotifDelta(0);
    setSmsNotifDelta(0);
    if (embaucheNotifDelta > 0) {
      setVue('embauche');
      return;
    }
    if (vpNotifDelta > 0) {
      setVue('visites-periodiques');
      return;
    }
    if (smsNotifDelta > 0) {
      setVue('surveillance-speciale');
    }
  };

  const stats = {
    total:  fiches.length,
    apte:   fiches.filter(f => f.aptitude === 'APTE_AU_POSTE').length,
    inapte: fiches.filter(f => f.aptitude?.startsWith('INAPTE')).length,
  };

  const userName = user?.first_name && user?.last_name
    ? `Dr. ${user.first_name} ${user.last_name}`
    : `Dr. ${user?.username || 'Médecin'}`;
  const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#f0f9ff', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button, input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pageFade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sidebarPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 70%{box-shadow:0 0 0 5px rgba(239,68,68,0)} }
      `}</style>

      {/* ══════ SIDEBAR — bleu ciel clair style infirmier ══════ */}
      <aside style={{ width: 256, minWidth: 256, background: BLUE_BG, display: 'flex', flexDirection: 'column', height: '100vh', borderRight:'1px solid #7dd3fc', boxShadow:'4px 0 20px rgba(14,165,233,.13)', position:'relative', zIndex:10, overflow:'hidden' }}>
        {/* Cercles décoratifs comme infirmier */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.16)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:30, left:-50, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.1)', pointerEvents:'none' }} />

        {/* Logo — style infirmier */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(2,132,199,.18)', display: 'flex', alignItems: 'center', gap: 11, position:'relative', flexShrink:0 }}>
          <div style={{ width:44, height:44, borderRadius:13, flexShrink:0, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', boxShadow:'0 4px 14px rgba(14,165,233,.4)' }}>
            <IcoHospital size={22} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0c4a6e', letterSpacing: '-.2px', lineHeight:1.2 }}>Service Médical</div>
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 600, marginTop: 2, letterSpacing:.3 }}>{getUserSiteName() || 'Non assigné'}</div>
          </div>
          {/* Logo LEONI */}
          <div style={{ flexShrink:0 }}>
            <img src="https://i.imgur.com/P8t9SW7.png" alt="LEONI"
              style={{ height:22, width:'auto', objectFit:'contain', filter:'drop-shadow(0 1px 2px rgba(0,0,0,.15))' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
            />
            <span style={{ display:'none', fontSize:13, fontWeight:900, color:'#0c4a6e', letterSpacing:'1px', fontFamily:'Arial Black, sans-serif' }}>LEONI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '6px 10px', flex: 1, overflowY: 'auto' }}>
          {NAV.map(group => (
            <div key={group.section}>
              <div style={{ fontSize:9, fontWeight:800, color:'#0369a1', letterSpacing:1.6, textTransform:'uppercase', opacity:.65, padding:'10px 10px 4px' }}>
                {group.section}
              </div>
              {group.items.map(item => (
                <NavBtn key={item.id} active={vue === item.id} Icon={item.Icon}
                  badge={item.showBadge ? fiches.length : item.showBadgeEmbauche ? nbEmbauche : item.showBadgeVp ? nbVp : item.showBadgeSurv ? nbSurv : null}
                  onClick={() => setVue(item.id)}>
                  {item.label}
                </NavBtn>
              ))}
            </div>
          ))}
        </nav>

        {/* Stats widget — style infirmier clair */}
        <div style={{ margin:'0 10px 10px', background:'rgba(255,255,255,.55)', backdropFilter:'blur(10px)', border:'1px solid rgba(2,132,199,.22)', borderRadius:14, padding:11 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#0369a1', textTransform:'uppercase', letterSpacing:1.6, opacity:.65, marginBottom:9 }}>Aujourd'hui</div>
          <div style={{ display:'flex', gap:6 }}>
            {[
              { n: stats.total,  l: 'Fiches',  c: '#0284c7' },
              { n: stats.apte,   l: 'Aptes',   c: '#059669' },
              { n: stats.inapte, l: 'Inaptes', c: '#dc2626' },
            ].map(s => (
              <div key={s.l} style={{ flex:1, textAlign:'center', padding:'8px 4px', background:'rgba(255,255,255,.6)', borderRadius:8, border:'1px solid rgba(2,132,199,.12)' }}>
                <div style={{ fontSize:20, fontWeight:800, fontFamily:'monospace', color:s.c }}>{s.n}</div>
                <div style={{ fontSize:9.5, color:'#0369a1', marginTop:1, fontWeight:700, opacity:.7 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Carte utilisateur — style infirmier */}
        <div style={{ margin:'0 10px 14px', background:'rgba(255,255,255,.55)', backdropFilter:'blur(10px)', border:'1px solid rgba(2,132,199,.22)', borderRadius:14, padding:'11px 12px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#0ea5e9,#0369a1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11.5, fontWeight:800, boxShadow:'0 2px 8px rgba(14,165,233,.28)' }}>
            {initials(userName)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#0c4a6e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{userName}</div>
            <div style={{ fontSize:10, color:'#0284c7', fontWeight:600, marginTop:1 }}>Médecin du travail</div>
          </div>
          <LogoutButton onClick={handleLogout} />
        </div>
      </aside>

      {/* ══════ MAIN ══════ */}
      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', padding:'28px 32px 24px', background:'#f0f9ff', animation:'pageFade .25s ease' }}>
        <div style={{ marginBottom:24, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <div style={{ width:4, height:24, borderRadius:99, background:'linear-gradient(180deg,#0ea5e9,#0369a1)', flexShrink:0 }} />
            <div style={{ fontSize:22, fontWeight:800, color:BLUE_DARK, letterSpacing:'-.5px' }}>{TITLES[vue]}</div>
          </div>
          <div style={{ fontSize:13, color:'#0369a1', fontWeight:500, textTransform:'capitalize', paddingLeft:14 }}>{todayLabel()}</div>
        </div>

        {loginNotificationsReady && loginNotificationsTotal > 0 && (
          <div
            style={{
              marginBottom: 14,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              boxShadow: '0 10px 24px rgba(220,38,38,.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: '#ef4444',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 2 }}>
                  {loginNotificationsTotal} notification{loginNotificationsTotal > 1 ? 's' : ''} en attente
                </div>
                <div style={{ fontSize: 12.5, color: '#b91c1c' }}>
                  {loginNotificationText} necessitent un traitement.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleVoirListesNotif}
              style={{
                border: 'none',
                background: '#ef4444',
                color: 'white',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 18px rgba(239,68,68,.22)',
              }}
            >
              Voir les listes
            </button>
          </div>
        )}

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'9px 14px', borderRadius:9, fontSize:13, marginBottom:14, flexShrink:0 }}>
            {error}
            <button onClick={loadFiches} style={{ marginLeft:10, fontWeight:700, cursor:'pointer', background:'none', border:'none', color:'#dc2626', textDecoration:'underline', fontFamily:'inherit' }}>Réessayer</button>
          </div>
        )}

        {vue === 'accueil'    && <TableauBord user={user} onNaviguer={handleNaviguerDepuisTB} />}
        {vue === 'fiches'     && (
          <div style={{ display:'flex', flex:1, gap:14, minHeight:0, overflow:'hidden' }}>
            {loading
              ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:14 }}>Chargement des fiches…</div>
              : <><ListeFiches fiches={fiches} selected={selected} onSelect={(f) => { setSelected(f); setPostCreateOpenTab(null); }} onNouvelle={() => setVue('nouvelle')} periodeLabel="aujourd'hui" /><DetailFiche fiche={selected} initialTab={postCreateOpenTab} onInitialTabConsumed={() => setPostCreateOpenTab(null)} onFicheUpdated={(updated) => { setSelected(updated); setFiches((prev) => sortFichesDuJourMedecin(prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))); }} /></>
            }
          </div>
        )}
        {vue === 'nouvelle'   && (
          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <NouvelleFiche
              hideBilanExamenOptionnels={isMedecinMessadine}
              initialDocumentMode={isMedecinMateur ? 'MATEUR_CHOICE' : undefined}
              onSuccess={async (fiche, noRedirect, opts) => {
                await loadFiches();
                setFiches((prev) => {
                  if (prev.some((x) => x.id === fiche.id)) return sortFichesDuJourMedecin(prev);
                  if (
                    !isFicheMedecinFichesDuJour(fiche)
                    || !isDateVisiteToday(getDateVisitePourFiltreJour(fiche))
                  ) {
                    return prev;
                  }
                  return sortFichesDuJourMedecin([fiche, ...prev]);
                });
                if (!noRedirect) {
                  setSelected(fiche);
                  setPostCreateOpenTab(opts?.openTab || null);
                  setVue('fiches');
                }
              }}
              onNaviguerDossier={(collab) => { setCollabDossier(collab || null); setVue('dossier'); }}
            />
          </div>
        )}
        {vue === 'dossier'    && (
          <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>
            <DossierMedical onNaviguerNouvellesFiches={() => setVue('nouvelle')} initialCollab={collabDossier} />
          </div>
        )}
        {vue === 'maladies-chroniques' && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <MaladiesChroniques readOnly />
          </div>
        )}
        {vue === 'documents-scans' && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <DocumentsMedicauxScannesPage canEdit={false} />
          </div>
        )}
        {vue === 'historique' && (
          <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
            <HistoriquePatient />
          </div>
        )}
        {vue === 'embauche'   && (
          <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>
            <VueEmbauche key={`embauche-${userCacheIdentity}`} sessionUserKey={userCacheIdentity} />
          </div>
        )}
        {vue === 'visites-periodiques' && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <VueVisitesPeriodiques key={`vp-${userCacheIdentity}`} sessionUserKey={userCacheIdentity} />
          </div>
        )}
        {vue === 'surveillance-speciale' && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <VueSurveillanceSpecialeMedecin key={`surv-${userCacheIdentity}`} sessionUserKey={userCacheIdentity} />
          </div>
        )}
      </main>
    </div>
  );
}

/* ── NavBtn — style infirmier bleu ciel clair ── */
function NavBtn({ children, active, Icon, badge, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:10, width:'100%',
        padding:'9px 12px', borderRadius:11, marginBottom:2,
        border:'none', cursor:'pointer', fontFamily:'inherit',
        fontSize:12.5, fontWeight: active ? 700 : 600,
        background: active ? '#0284c7' : 'transparent',
        color: active ? '#ffffff' : '#0c4a6e',
        boxShadow: active ? '0 3px 10px rgba(2,132,199,.3)' : 'none',
        transition:'all .16s', textAlign:'left', letterSpacing:-.1,
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(2,132,199,.1)'; e.currentTarget.style.color='#0284c7'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#0c4a6e'; }}}>
      <div style={{
        width:30, height:30, borderRadius:8, flexShrink:0,
        background: active ? 'rgba(255,255,255,.2)' : 'rgba(2,132,199,.08)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color: active ? 'white' : '#0284c7', transition:'all .16s',
      }}>
        {Icon && <Icon size={15} />}
      </div>
      <span style={{ flex:1 }}>{children}</span>
      {active && <div style={{ width:6, height:6, borderRadius:99, background:'rgba(255,255,255,.65)', flexShrink:0 }} />}
      {badge != null && badge > 0 && !active && (
        <span style={{
          background:'#ef4444',
          color:'white',
          fontSize:10,
          fontWeight:800,
          padding:'1px 7px',
          borderRadius:20,
          flexShrink:0,
          animation:'sidebarPulse 2s infinite',
        }}>{badge}</span>
      )}
    </button>
  );
}