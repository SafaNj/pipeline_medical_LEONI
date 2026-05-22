import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';
import SiteAssignmentWarning from '../components/common/SiteAssignmentWarning';

import DetailListe            from '../components/infirmier/DetailListe';
import ArchiveVisites         from '../components/infirmier/Archivevisites';
import GestionStock           from '../components/infirmier/GestionStock';
import AccidentTravail        from '../components/infirmier/Accidenttravail';
import MaladieProfessionnelle from '../components/infirmier/Maladieprofessionnelle';
import IncidentSansBon        from '../components/infirmier/Incidentsansbon';
import IncidentAvecBon        from '../components/infirmier/Incidentavecbon';
import Transferturgence       from '../components/infirmier/Transferturgence';
import Declarationcnam        from '../components/infirmier/Declarationcnam';
import PointageMedecin        from '../components/infirmier/Pointagemedecin';
import Accueil                from '../components/infirmier/Accueil';
import ListesEmbaucheInfirmier from '../components/infirmier/Listesembaucheinfirmier';
import SurveillanceSpecialeInfirmier from '../components/infirmier/SurveillanceSpecialeInfirmier';
import DossierMedical from '../components/medecinTravail/Dossiermedical';
import ListesVisitesPeriodiquesInfirmier from '../components/infirmier/ListesVisitesPeriodiquesInfirmier';
import ListesContreVisitesInfirmier from '../components/infirmier/ListesContreVisitesInfirmier';
import MaladiesChroniques from '../components/infirmier/MaladiesChroniques';
import RdvPsychologue     from '../components/infirmier/RdvPsychologue';
import RdvSagefemme       from '../components/infirmier/RdvSagefemme';

import {
  getListesDuJour,
  getDashboardStats,
  getListeDetail,
} from '../api/actInfirmierApi';

import { getListes as getListesEmbauche } from '../api/embaucheApi';
import { getListesVisitesPeriodiquesSoumises } from '../api/visitesPeriodiquesApi';
import { getListes as getListesContreVisites } from '../api/Contrevisiteapi';
import { getListesSurveillanceSpeciale } from '../api/surveillanceSpecialeApi';

import DashboardStats from '../components/infirmier/DashboardStats';
import ListesDuJour   from '../components/infirmier/ListesDuJour';
import CreerListe     from '../components/infirmier/CreerListe';
import FichesAptitudeInfirmier from '../components/infirmier/FichesAptitudeInfirmier';
import ContrevisitesConsultation from '../components/infirmier/ContrevisitesConsultation';
import DocumentsMedicauxScannesPage from '../components/documents/DocumentsMedicauxScannesPage';
import { buildUserScopedStorageKey, getUserCacheIdentity } from '../utils/userSessionCache';
import { getUserSiteId, getUserSiteName } from '../utils/siteAccessControl';

/*  SVG Icons  */
const IcoListes = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6"  x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6"  x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const IcoArchive = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);
/* Stock : icône boîte/médicaments bien définie */
const IcoStock = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
    <line x1="12" y1="12" x2="12" y2="6"/>
    <line x1="9" y1="9" x2="15" y2="9"/>
  </svg>
);
const IcoAccident = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoMaladie = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);
/* Incidents groupés — icône dossier */
const IcoIncidents = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);
const IcoIncidentSans = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoIncidentAvec = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="13" y1="17" x2="8" y2="17"/>
    <polyline points="12 17 14 19 17 15"/>
  </svg>
);
/* Ambulance — icône urgence professionnelle */
const IcoAmbulance = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17H3a1 1 0 01-1-1V6a1 1 0 011-1h11l4 4v7h-2"/>
    <circle cx="7.5" cy="17.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
    <path d="M14 5v4h4"/>
    <line x1="6" y1="10" x2="10" y2="10"/><line x1="8" y1="8" x2="8" y2="12"/>
  </svg>
);
const IcoCnam = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);
const IcoPointage = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
  </svg>
);
const IcoContreVisites = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const IcoLogout = ({ color = '#ffffff' }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoChevron = ({ open }) => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ transition:'transform .2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/* ─── Icône infirmerie (croix + stéthoscope) pour le logo ── */
const IcoInfirmerie = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    {/* Croix médicale */}
    <rect x="10" y="3" width="4" height="10" rx="1.5" fill="white"/>
    <rect x="5" y="8" width="14" height="4" rx="1.5" fill="white"/>
    {/* Arc stéthoscope */}
    <path d="M8 17 Q8 21 12 21 Q16 21 16 17" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <circle cx="12" cy="21" r="1.5" fill="white"/>
  </svg>
);

const PAGE_TITLES = {
  accueil:              'Tableau de bord',
  listes:               'Listes de passage',
  embauche:             "Listes d'embauche RH",
  archive:              'Archive des visites',
  stock:                'Gestion du stock',
  accidents:            'Accidents de travail',
  maladies:             'Maladies professionnelles',
  'maladies-chroniques': 'Maladies chroniques',
  'rdv-psychologue':     'RDV Psychologue du travail',
  'rdv-sagefemme':       'RDV Sage-femme',
  'incidents-sans':     'Incidents sans bon a charge de LEONI',
  'incidents-avec':     'Incidents bon a charge de LEONI',
  'transferts-urgence': 'Transferts aux urgences',
  'declarations-cnam':  'Déclarations CNAM',
  'pointage-medecins':  'Pointage des médecins',
  'fiches-aptitude':      "Fiches d'aptitude",
  dossier:               'Dossier médical',
  'contre-visites-ctrl':  'Contre-visites médecin contrôleur',
  'listes-cv':            'Listes contre-visites',
  'visites-periodiques-inf': 'Visites périodiques (listes RH)',
  'surveillance-sms':      'Surveillance médicale spéciale',
  'documents-scans':       'Archives / scans (documents)',
};

function SectionLabel({ label }) {
  return (
    <div style={{ fontSize:9, fontWeight:800, color:'#0369a1', letterSpacing:1.6, textTransform:'uppercase', opacity:.65, padding:'10px 10px 4px' }}>
      {label}
    </div>
  );
}

function NavBtn({ activeVue, onSetVue, navKey, label, icon, indent = false }) {
  const active = activeVue === navKey;

  return (
    <button onClick={() => onSetVue(navKey)}
      style={{
        display:'flex', alignItems:'center', gap:10, width:'100%',
        padding: indent ? '7px 12px 7px 20px' : '9px 12px',
        borderRadius:11,
        background: active ? '#0284c7' : 'transparent',
        color: active ? '#ffffff' : '#0c4a6e',
        fontSize: indent ? 12 : 12.5,
        fontWeight: active ? 700 : 600,
        border:'none',
        boxShadow: active ? '0 3px 10px rgba(2,132,199,.3)' : 'none',
        cursor:'pointer', textAlign:'left', fontFamily:'inherit',
        transition:'all .16s', letterSpacing:-.1,
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(2,132,199,.1)'; e.currentTarget.style.color='#0284c7'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#0c4a6e'; }}}>
      <div style={{
        width: indent ? 26 : 30, height: indent ? 26 : 30,
        borderRadius:8, flexShrink:0,
        background: active ? 'rgba(255,255,255,.2)' : 'rgba(2,132,199,.08)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color: active ? 'white' : '#0284c7', transition:'all .16s',
      }}>
        {icon}
      </div>
      <span style={{ flex:1 }}>{label}</span>
      {active && <div style={{ width:6, height:6, borderRadius:99, background:'rgba(255,255,255,.65)', flexShrink:0 }} />}
    </button>
  );
}

/* 
   COMPOSANT SIDEBAR  séparé pour gérer l'état incidents
 */
function Sidebar({ vue, onSetVue, user, onLogout, nouvellesListesCount, nouvellesVpCount, nouvellesCvCount, nouvellesSmsCount, siteName }) {
  const [incidentsOpen, setIncidentsOpen] = useState(
    vue === 'incidents-sans' || vue === 'incidents-avec'
  );

  const isIncidentActive = vue === 'incidents-sans' || vue === 'incidents-avec';

  return (
    <aside style={{
      width:256, minWidth:256,
      background:'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 40%, #7dd3fc 78%, #38bdf8 100%)',
      display:'flex', flexDirection:'column',
      height:'100vh', borderRight:'1px solid #7dd3fc',
      boxShadow:'4px 0 20px rgba(14,165,233,.13)',
      position:'relative', zIndex:10, overflow:'hidden',
    }}>
      {/* Cercles décoratifs */}
      <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.16)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:30, left:-50, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.1)', pointerEvents:'none' }} />

      {/* ── Logo avec icône infirmerie + logo LEONI ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 18px 14px', borderBottom:'1px solid rgba(2,132,199,.18)', position:'relative', flexShrink:0 }}>
        <div style={{
          width:44, height:44, borderRadius:13, flexShrink:0,
          background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 14px rgba(14,165,233,.4)',
        }}>
          <IcoInfirmerie />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:800, color:'#0c4a6e', letterSpacing:-.3, lineHeight:1.2 }}>Service Médical </div>
          <div style={{
            marginTop: 2,
            fontSize: 10.5,
            color: '#0284c7',
            fontWeight: 600,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {siteName || 'Non assigné'}
          </div>
        </div>
        {/* Logo LEONI texte */}
        <div style={{ flexShrink:0 }}>
          <img
            src="https://i.imgur.com/P8t9SW7.png"
            alt="LEONI"
            style={{ height:22, width:'auto', objectFit:'contain', filter:'drop-shadow(0 1px 2px rgba(0,0,0,.15))' }}
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span style={{
            display:'none', fontSize:13, fontWeight:900, color:'#0c4a6e',
            letterSpacing:'1px', fontFamily:'Arial Black, sans-serif',
          }}>LEONI</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'6px 10px 6px' }}>

        {/* Accueil */}
        <div style={{ marginBottom:6 }}>
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="accueil" label="Accueil" icon={(
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          )} />
        </div>

        {/* Consultations */}
        <SectionLabel label="Consultations" />
        <div style={{ display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="listes"  label="Listes de passage"  icon={<IcoListes />}  />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="archive" label="Archive des visites" icon={<IcoArchive />} />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="documents-scans" label="Archives / scans" icon={(
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          )} />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="fiches-aptitude" label="Fiches d'aptitude" icon={(
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
              <path d='M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2'/>
              <rect x='8' y='2' width='8' height='4' rx='1' ry='1'/>
              <line x1='8' y1='13' x2='16' y2='13'/><line x1='8' y1='17' x2='16' y2='17'/>
            </svg>
          )} />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="contre-visites-ctrl" label="Contre-visites contrôleur" icon={(
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          )} />
          <button
            type="button"
            onClick={() => onSetVue('listes-cv')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 11,
              background: vue === 'listes-cv' ? '#0284c7' : 'transparent',
              color: vue === 'listes-cv' ? '#ffffff' : '#0c4a6e',
              fontSize: 12.5,
              fontWeight: vue === 'listes-cv' ? 700 : 600,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'all .16s',
              letterSpacing: -0.1,
              boxShadow: vue === 'listes-cv' ? '0 3px 10px rgba(2,132,199,.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (vue !== 'listes-cv') {
                e.currentTarget.style.background = 'rgba(2,132,199,.1)';
                e.currentTarget.style.color = '#0284c7';
              }
            }}
            onMouseLeave={(e) => {
              if (vue !== 'listes-cv') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#0c4a6e';
              }
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                flexShrink: 0,
                background: vue === 'listes-cv' ? 'rgba(255,255,255,.2)' : 'rgba(2,132,199,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: vue === 'listes-cv' ? 'white' : '#0284c7',
                transition: 'all .16s',
                position: 'relative',
              }}
            >
              <IcoContreVisites />
              {nouvellesCvCount > 0 && vue !== 'listes-cv' && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 0 0 2px rgba(239,68,68,.3)',
                  }}
                >
                  {nouvellesCvCount > 9 ? '9+' : nouvellesCvCount}
                </span>
              )}
            </div>
            <span style={{ flex: 1 }}>Listes contre-visites</span>
            {nouvellesCvCount > 0 && vue !== 'listes-cv' && (
              <span
                style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 99,
                  flexShrink: 0,
                }}
              >
                {nouvellesCvCount}
              </span>
            )}
            {vue === 'listes-cv' && <div style={{ width: 6, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.65)', flexShrink: 0 }} />}
          </button>
        </div>

        {/* Visites d'embauche */}
        <SectionLabel label="Visites d'embauche" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
          <button onClick={() => onSetVue('embauche')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 12px', borderRadius: 11,
              background: vue === 'embauche' ? '#0284c7' : 'transparent',
              color: vue === 'embauche' ? '#ffffff' : '#0c4a6e',
              fontSize: 12.5, fontWeight: vue === 'embauche' ? 700 : 600,
              border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              transition: 'all .16s', letterSpacing: -.1,
              boxShadow: vue === 'embauche' ? '0 3px 10px rgba(2,132,199,.3)' : 'none',
            }}
            onMouseEnter={e => { if (vue !== 'embauche') { e.currentTarget.style.background = 'rgba(2,132,199,.1)'; e.currentTarget.style.color = '#0284c7'; } }}
            onMouseLeave={e => { if (vue !== 'embauche') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0c4a6e'; } }}>
            {/* Icône groupe personnes */}
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: vue === 'embauche' ? 'rgba(255,255,255,.2)' : 'rgba(2,132,199,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: vue === 'embauche' ? 'white' : '#0284c7', transition: 'all .16s',
              position: 'relative',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              {/* Badge rouge sur l'icône si nouvelles listes */}
              {nouvellesListesCount > 0 && vue !== 'embauche' && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#ef4444', color: 'white',
                  fontSize: 9, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 0 0 2px rgba(239,68,68,.3)',
                  animation: 'sidebarPulse 2s infinite',
                }}>
                  {nouvellesListesCount > 9 ? '9+' : nouvellesListesCount}
                </span>
              )}
            </div>
            <span style={{ flex: 1 }}>Listes RH reçues</span>
            {/* Badge compteur en bout de ligne */}
            {nouvellesListesCount > 0 && vue !== 'embauche' && (
              <span style={{
                background: '#ef4444', color: 'white',
                fontSize: 10, fontWeight: 800,
                padding: '2px 7px', borderRadius: 99,
                flexShrink: 0, animation: 'sidebarPulse 2s infinite',
              }}>
                {nouvellesListesCount}
              </span>
            )}
            {vue === 'embauche' && <div style={{ width: 6, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.65)', flexShrink: 0 }} />}
          </button>
        </div>

        <SectionLabel label="Surveillance SMS" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
          <button
            type="button"
            onClick={() => onSetVue('surveillance-sms')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 11,
              background: vue === 'surveillance-sms' ? '#0284c7' : 'transparent',
              color: vue === 'surveillance-sms' ? '#ffffff' : '#0c4a6e',
              fontSize: 12.5, fontWeight: vue === 'surveillance-sms' ? 700 : 600, border: 'none', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit', transition: 'all .16s', letterSpacing: -0.1,
              boxShadow: vue === 'surveillance-sms' ? '0 3px 10px rgba(2,132,199,.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (vue !== 'surveillance-sms') {
                e.currentTarget.style.background = 'rgba(2,132,199,.1)';
                e.currentTarget.style.color = '#0284c7';
              }
            }}
            onMouseLeave={(e) => {
              if (vue !== 'surveillance-sms') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#0c4a6e';
              }
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: vue === 'surveillance-sms' ? 'rgba(255,255,255,.2)' : 'rgba(2,132,199,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: vue === 'surveillance-sms' ? 'white' : '#0284c7', transition: 'all .16s',
              position: 'relative',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4L22 2z" />
              </svg>
              {nouvellesSmsCount > 0 && vue !== 'surveillance-sms' && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 0 0 2px rgba(239,68,68,.3)',
                  }}
                >
                  {nouvellesSmsCount > 9 ? '9+' : nouvellesSmsCount}
                </span>
              )}
            </div>
            <span style={{ flex: 1 }}>Listes surveillance spéciale</span>
            {nouvellesSmsCount > 0 && vue !== 'surveillance-sms' && (
              <span
                style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 99,
                  flexShrink: 0,
                }}
              >
                {nouvellesSmsCount}
              </span>
            )}
            {vue === 'surveillance-sms' && <div style={{ width: 6, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.65)', flexShrink: 0 }} />}
          </button>
        </div>

        {/* Visites périodiques — flux séparé de l'embauche */}
        <SectionLabel label="Visites périodiques" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
          <button
            type="button"
            onClick={() => onSetVue('visites-periodiques-inf')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 11,
              background: vue === 'visites-periodiques-inf' ? '#0ea5e9' : 'transparent',
              color: vue === 'visites-periodiques-inf' ? '#ffffff' : '#0c4a6e',
              fontSize: 12.5,
              fontWeight: vue === 'visites-periodiques-inf' ? 700 : 600,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'all .16s',
              letterSpacing: -0.1,
              boxShadow: vue === 'visites-periodiques-inf' ? '0 3px 10px rgba(14,165,233,.35)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (vue !== 'visites-periodiques-inf') {
                e.currentTarget.style.background = 'rgba(14,165,233,.12)';
                e.currentTarget.style.color = '#0369a1';
              }
            }}
            onMouseLeave={(e) => {
              if (vue !== 'visites-periodiques-inf') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#0c4a6e';
              }
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                flexShrink: 0,
                background:
                  vue === 'visites-periodiques-inf'
                    ? 'rgba(255,255,255,.25)'
                    : 'rgba(14,165,233,.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: vue === 'visites-periodiques-inf' ? 'white' : '#0ea5e9',
                transition: 'all .16s',
                position: 'relative',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              {nouvellesVpCount > 0 && vue !== 'visites-periodiques-inf' && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 0 0 2px rgba(239,68,68,.3)',
                    animation: 'sidebarPulse 2s infinite',
                  }}
                >
                  {nouvellesVpCount > 9 ? '9+' : nouvellesVpCount}
                </span>
              )}
            </div>
            <span style={{ flex: 1 }}>Listes visites périodiques</span>
            {nouvellesVpCount > 0 && vue !== 'visites-periodiques-inf' && (
              <span
                style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 99,
                  flexShrink: 0,
                  animation: 'sidebarPulse 2s infinite',
                }}
              >
                {nouvellesVpCount}
              </span>
            )}
            {vue === 'visites-periodiques-inf' && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: 'rgba(255,255,255,.65)',
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        </div>

        {/* Gestion */}
        <SectionLabel label="Gestion" />
        <div style={{ display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="stock" label="Gestion du stock" icon={<IcoStock />} />
        </div>

        {/* Incidents & Accidents */}
        <SectionLabel label="Incidents & Accidents" />
        <div style={{ display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="accidents" label="Accidents de travail"      icon={<IcoAccident />} />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="maladies"  label="Maladies professionnelles" icon={<IcoMaladie />}  />

          {/* ── Groupe "Déclaration des incidents" (accordéon) ── */}
          <button
            onClick={() => setIncidentsOpen(o => !o)}
            style={{
              display:'flex', alignItems:'center', gap:10, width:'100%',
              padding:'9px 12px', borderRadius:11,
              background: isIncidentActive
                ? 'rgba(2,132,199,.15)'
                : incidentsOpen ? 'rgba(2,132,199,.08)' : 'transparent',
              color: isIncidentActive ? '#0284c7' : '#0c4a6e',
              fontSize:12.5, fontWeight: isIncidentActive ? 700 : 600,
              border:'none', cursor:'pointer', textAlign:'left',
              fontFamily:'inherit', transition:'all .16s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(2,132,199,.1)'; e.currentTarget.style.color='#0284c7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isIncidentActive ? 'rgba(2,132,199,.15)' : incidentsOpen ? 'rgba(2,132,199,.08)' : 'transparent'; e.currentTarget.style.color = isIncidentActive ? '#0284c7' : '#0c4a6e'; }}>
            <div style={{
              width:30, height:30, borderRadius:8, flexShrink:0,
              background: isIncidentActive ? 'rgba(2,132,199,.2)' : 'rgba(2,132,199,.08)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color: isIncidentActive ? '#0284c7' : '#0284c7',
            }}>
              <IcoIncidents />
            </div>
            <span style={{ flex:1 }}>Déclaration incidents</span>
            <IcoChevron open={incidentsOpen} />
          </button>

          {/* Sous-items incidents (slide down) */}
          <div style={{
            overflow:'hidden',
            maxHeight: incidentsOpen ? 120 : 0,
            transition:'max-height .25s ease',
          }}>
            <div style={{ paddingTop:2, display:'flex', flexDirection:'column', gap:1 }}>
              <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="incidents-sans" label="Sans bon a charge de LEONI" icon={<IcoIncidentSans />} indent />
              <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="incidents-avec" label="Bon a charge de LEONI" icon={<IcoIncidentAvec />} indent />
            </div>
          </div>
        </div>

        {/* Suivi médical */}
        <SectionLabel label="Suivi médical" />
        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="maladies-chroniques" label="Maladies chroniques" icon={(
            <svg width="16" height="16" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              {/* Fond bleu comme les autres icônes */}
              <rect x="4" y="4" width="56" height="56" rx="12" fill="rgba(2,132,199,.10)" />
              {/* Coeur bleu */}
              <path
                d="M32 52s-15-8.6-21.2-18.2C5.8 25.6 10.6 16 21 16c6.3 0 9.8 3.6 11 6 1.2-2.4 4.7-6 11-6 10.4 0 15.2 9.6 10.2 17.8C47 43.4 32 52 32 52z"
                fill="#0284c7"
              />
              {/* ECG blanc */}
              <path
                d="M14 34h12l4-8 6 16 4-8h10"
                fill="none"
                stroke="#ffffff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )} />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="rdv-psychologue" label="RDV Psychologue" icon={(
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
              <line x1="12" y1="14" x2="12" y2="18"/>
              <line x1="10" y1="16" x2="14" y2="16"/>
            </svg>
          )} />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="rdv-sagefemme" label="RDV Sage-femme" icon={(
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
            </svg>
          )} />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="transferts-urgence" label="Transferts urgences" icon={<IcoAmbulance />} />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="declarations-cnam"  label="Déclarations CNAM"  icon={<IcoCnam />}      />
          <NavBtn activeVue={vue} onSetVue={onSetVue} navKey="pointage-medecins"  label="Pointage médecins"  icon={<IcoPointage />}  />
        </div>
      </div>

      {/* Carte utilisateur */}
      <div style={{
        margin:'0 10px 14px',
        background:'rgba(255,255,255,.55)',
        backdropFilter:'blur(10px)',
        border:'1px solid rgba(2,132,199,.22)',
        borderRadius:14, padding:'11px 12px',
        display:'flex', alignItems:'center', gap:10,
        flexShrink:0,
      }}>
        <div style={{
          width:36, height:36, borderRadius:10, flexShrink:0,
          background:'linear-gradient(135deg,#0ea5e9,#0369a1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontSize:15, fontWeight:800,
          boxShadow:'0 2px 8px rgba(14,165,233,.28)',
        }}>
          {user?.username?.[0]?.toUpperCase() || 'I'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0c4a6e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {user?.username}
          </div>
          <div style={{ fontSize:11, color:'#0284c7', fontWeight:600, marginTop:1 }}>Infirmier(e)</div>
        </div>
        <LogoutButton onClick={onLogout} />
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
══════════════════════════════════════════════════════ */
export default function DashboardInfirmier() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userCacheIdentity = getUserCacheIdentity(user);
  const siteId = getUserSiteId();
  const siteName = getUserSiteName();
  const hasSite = siteId !== null && siteId !== undefined && String(siteId).trim() !== '';

  const [vue,         setVue]         = useState('accueil');
  const [dossierCollab, setDossierCollab] = useState(null);
  const [listes,      setListes]      = useState([]);
  const [stats,       setStats]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [loadListes,  setLoadListes]  = useState(true);
  const [loadStats,   setLoadStats]   = useState(true);
  const [globalError, setGlobalError] = useState('');

  // ── Polling nouvelles listes d'embauche ──────────────────────────────────
  // On stocke le dernier count connu dans localStorage pour détecter les nouvelles listes
  const LS_EMBAUCHE_COUNT = buildUserScopedStorageKey('infirmier_embauche_last_count', user);
  const LS_VP_COUNT = buildUserScopedStorageKey('infirmier_vp_last_count', user);
  const LS_CV_COUNT = buildUserScopedStorageKey('infirmier_cv_last_count', user);
  const LS_SMS_COUNT = buildUserScopedStorageKey('infirmier_sms_soumises_last_count', user);
  const [nouvellesListes,     setNouvellesListes]     = useState([]); // listes SOUMISES
  const [nouvellesListesCount, setNouvellesListesCount] = useState(0); // badge
  const [embaucheAlert,       setEmbaucheAlert]       = useState(false); // alerte accueil
  const [nouvellesVpCount, setNouvellesVpCount] = useState(0);
  const [nouvellesCvCount, setNouvellesCvCount] = useState(0);
  const [cvAlert, setCvAlert] = useState(false);
  const [cvJourJ, setCvJourJ] = useState([]); // listes CV dont date_visite = aujourd'hui
  const [nouvellesSmsListes, setNouvellesSmsListes] = useState([]);
  const [nouvellesSmsCount, setNouvellesSmsCount] = useState(0);
  const [smsAlert, setSmsAlert] = useState(false);

  const fetchNouvellesListes = useCallback(async () => {
    if (!hasSite) return;
    try {
      const all = await getListesEmbauche();
      // "Nouvelles" = listes SOUMISES (transmises depuis RH, pas encore prises en charge)
      const soumises = all.filter(l => l.statut === 'SOUMISE');
      const lastCount = parseInt(localStorage.getItem(LS_EMBAUCHE_COUNT) || '0', 10);
      const currentCount = soumises.length;

      setNouvellesListes(soumises);
      setNouvellesListesCount(currentCount);

      // Si plus de listes soumises qu'avant → nouvelle(s) arrivée(s)
      if (currentCount > lastCount) {
        setEmbaucheAlert(true);
        // On met à jour la référence seulement si on a vu la notification
        // (le count se remet à jour quand l'infirmier visite l'onglet embauche)
      }
    } catch {
      // silently ignore
    }
  }, [LS_EMBAUCHE_COUNT, hasSite]);

  const fetchNouvellesVp = useCallback(async () => {
    if (!hasSite) return;
    try {
      const soumises = await getListesVisitesPeriodiquesSoumises();
      const currentCount = soumises.length;
      setNouvellesVpCount(currentCount);
    } catch {
      /* endpoint backend pas encore prêt */
    }
  }, [LS_VP_COUNT, hasSite]);

  const fetchNouvellesCv = useCallback(async () => {
    if (!hasSite) return;
    try {
      const all = await getListesContreVisites();
      const list = Array.isArray(all) ? all : [];
      // côté infirmier, on s'intéresse surtout aux listes SOUMISE/EN_TRAITEMENT
      const actives = list.filter((l) => ['SOUMISE', 'EN_TRAITEMENT'].includes(l.statut));
      const currentCount = actives.length;
      const lastCount = parseInt(localStorage.getItem(LS_CV_COUNT) || '0', 10);

      setNouvellesCvCount(currentCount);

      // Jour J : date_visite = today
      const todayStr = new Date().toISOString().slice(0, 10);
      setCvJourJ(actives.filter((l) => (l.date_visite || '').slice(0, 10) === todayStr));

      if (currentCount > lastCount) {
        setCvAlert(true);
      }
    } catch {
      // ignore
    }
  }, [LS_CV_COUNT, hasSite]);

  const fetchNouvellesSms = useCallback(async () => {
    if (!hasSite) return;
    try {
      const all = await getListesSurveillanceSpeciale();
      const soumises = (Array.isArray(all) ? all : []).filter((l) => l.statut === 'SOUMISE');
      const lastCount = parseInt(localStorage.getItem(LS_SMS_COUNT) || '0', 10);
      const currentCount = soumises.length;
      setNouvellesSmsListes(soumises);
      setNouvellesSmsCount(currentCount);
      if (currentCount > lastCount) {
        setSmsAlert(true);
      }
    } catch {
      /* ignore */
    }
  }, [LS_SMS_COUNT, hasSite]);

  // Quand l'infirmier visite la page embauche → reset le badge
  const handleSetVue = (key) => {
    if (!hasSite) return;
    setVue(key);
    if (key === 'listes') fetchAll();
    if (key === 'embauche') {
      // L'infirmier a vu les nouvelles listes → on remet le compteur de référence
      setNouvellesListesCount(0);
      setEmbaucheAlert(false);
      localStorage.setItem(LS_EMBAUCHE_COUNT, String(nouvellesListes.length));
    }
    if (key === 'visites-periodiques-inf') {
      setNouvellesVpCount(0);
      getListesVisitesPeriodiquesSoumises()
        .then((list) => localStorage.setItem(LS_VP_COUNT, String(list.length)))
        .catch(() => {});
    }
    if (key === 'listes-cv') {
      setNouvellesCvCount(0);
      setCvAlert(false);
      // marquer comme "vu" (référence)
      fetchNouvellesCv().finally(() => {
        // après refresh, on écrase la référence sur le dernier état connu
        // (sinon le badge peut revenir immédiatement)
        localStorage.setItem(LS_CV_COUNT, String(nouvellesCvCount));
      });
    }
    if (key === 'surveillance-sms') {
      setNouvellesSmsCount(0);
      setSmsAlert(false);
      getListesSurveillanceSpeciale()
        .then((all) => {
          const n = (Array.isArray(all) ? all : []).filter((l) => l.statut === 'SOUMISE').length;
          localStorage.setItem(LS_SMS_COUNT, String(n));
        })
        .catch(() => {});
    }
  };

  const fetchAll = useCallback(async () => {
    if (!hasSite) {
      setListes([]);
      setStats(null);
      setSelected(null);
      setLoadListes(false);
      setLoadStats(false);
      setGlobalError('');
      return;
    }
    setGlobalError('');
    setLoadListes(true);
    setLoadStats(true);
    try {
      const [listesResult, statsResult] = await Promise.allSettled([
        getListesDuJour(),
        getDashboardStats(),
      ]);

      if (listesResult.status === 'fulfilled') {
        const listesData = Array.isArray(listesResult.value) ? listesResult.value : [];
        setListes(listesData);
        if (listesData.length > 0) {
          const currentSelectedId = selected?.id ?? null;
          const nextSelected = currentSelectedId
            ? listesData.find((liste) => liste.id === currentSelectedId) || listesData[0]
            : listesData[0];
          setSelected(nextSelected);
        } else {
          setSelected(null);
        }
      } else {
        throw listesResult.reason;
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }
    } catch {
      setGlobalError('Impossible de charger les données. Vérifiez votre connexion.');
    } finally {
      setLoadListes(false);
      setLoadStats(false);
    }
  }, [hasSite, selected?.id]);

  useEffect(() => {
    setListes([]);
    setStats(null);
    setSelected(null);
    setNouvellesListes([]);
    setNouvellesListesCount(0);
    setNouvellesVpCount(0);
    setEmbaucheAlert(false);
    setNouvellesCvCount(0);
    setCvAlert(false);
    setCvJourJ([]);
    setNouvellesSmsListes([]);
    setNouvellesSmsCount(0);
    setSmsAlert(false);
  }, [userCacheIdentity]);

  useEffect(() => {
    if (!hasSite) return;
    fetchAll();
  }, [fetchAll, hasSite]);

  // Polling nouvelles listes (embauche + visites périodiques) toutes les 60 secondes
  useEffect(() => {
    if (!hasSite) return undefined;
    fetchNouvellesListes();
    fetchNouvellesVp();
    fetchNouvellesCv();
    fetchNouvellesSms();
    const iv = setInterval(() => {
      fetchNouvellesListes();
      fetchNouvellesVp();
      fetchNouvellesCv();
      fetchNouvellesSms();
    }, 60_000);
    return () => clearInterval(iv);
  }, [fetchNouvellesListes, fetchNouvellesVp, fetchNouvellesCv, fetchNouvellesSms, userCacheIdentity, hasSite]);

  const refreshStats = async () => {
    try { setStats(await getDashboardStats()); } catch { /* ignore refresh errors */ }
  };

  const handleSelect = async (liste) => {
    if (!liste.items) {
      try {
        const detail = await getListeDetail(liste.id);
        setSelected(detail);
        setListes(prev => prev.map(l => l.id === detail.id ? detail : l));
      } catch { setSelected(liste); }
    } else {
      setSelected(liste);
    }
  };

  const handleCreated = async (newListe) => {
    setShowModal(false);
    if (!newListe) return;
    setVue('listes');
    setListes((prev) => {
      const next = Array.isArray(prev) ? prev.slice() : [];
      const newId = newListe.id ?? null;
      if (newId && next.some((liste) => liste.id === newId)) {
        return next.map((liste) => (liste.id === newId ? { ...liste, ...newListe } : liste));
      }
      return [newListe, ...next];
    });
    setSelected(newListe);
    await fetchAll();
  };

  const handleUpdate = async (updatedListe) => {
    let target = updatedListe;
    try { target = await getListeDetail(updatedListe.id); } catch { target = updatedListe; }
    setListes(prev => prev.map(l => l.id === target.id ? target : l));
    setSelected(target);
    refreshStats();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div style={{
      display:'flex', height:'100vh', overflow:'hidden',
      fontFamily:"'DM Sans', 'Segoe UI', sans-serif",
      background:'#f0f9ff',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button, input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar        { width: 5px; }
        ::-webkit-scrollbar-thumb  { background: #bae6fd; border-radius: 4px; }
        ::-webkit-scrollbar-track  { background: transparent; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes modalIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pageFade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sidebarPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 70%{box-shadow:0 0 0 5px rgba(239,68,68,0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <Sidebar
        vue={vue}
        onSetVue={handleSetVue}
        user={user}
        onLogout={handleLogout}
        nouvellesListesCount={nouvellesListesCount}
        nouvellesVpCount={nouvellesVpCount}
        nouvellesCvCount={nouvellesCvCount}
        nouvellesSmsCount={nouvellesSmsCount}
        siteName={siteName}
      />

      {/* ═══════════════════ MAIN ═══════════════════ */}
      <main style={{
        flex:1, overflow:'hidden',
        display:'flex', flexDirection:'column',
        padding:'28px 32px 24px',
        background:'#f0f9ff',
        animation:'pageFade .25s ease',
      }}>
        {/* Top bar */}
        <div style={{ marginBottom:24, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <div style={{ width:4, height:24, borderRadius:99, background:'linear-gradient(180deg,#0ea5e9,#0369a1)', flexShrink:0 }} />
            <h1 style={{ fontSize:22, fontWeight:800, color:'#0c4a6e', letterSpacing:-.5 }}>
              {PAGE_TITLES[vue]}
            </h1>
          </div>
          <p style={{ fontSize:13, color:'#0369a1', fontWeight:500, textTransform:'capitalize', paddingLeft:14 }}>
            {today}
          </p>
        </div>

        {/* Erreur globale */}
        {hasSite && globalError && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'12px 16px', borderRadius:12, fontSize:13.5, marginBottom:20, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {globalError}
            <button onClick={fetchAll} style={{ padding:'5px 14px', background:'#b91c1c', color:'white', border:'none', borderRadius:7, fontSize:12.5, fontWeight:700, cursor:'pointer' }}>Réessayer</button>
          </div>
        )}

        {!hasSite ? (
          <SiteAssignmentWarning />
        ) : (
          <>

        {/* ── Accueil ── */}
        {vue === 'accueil' && (
          <>
            {/* Alerte nouvelles listes contre-visites */}
            {(cvAlert || cvJourJ.length > 0) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#fff7ed',
                  border: '2px solid #fed7aa',
                  borderRadius: 14,
                  padding: '14px 20px',
                  marginBottom: 16,
                  boxShadow: '0 2px 12px rgba(234,88,12,.08)',
                  animation: 'slideDown .3s ease',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'white',
                  }}
                >
                  <IcoContreVisites />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#9a3412', marginBottom: 3 }}>
                    {cvJourJ.length > 0
                      ? `📅 Jour J : ${cvJourJ.length} liste${cvJourJ.length > 1 ? 's' : ''} de contre-visite aujourd'hui`
                      : `🆕 Nouvelle liste de contre-visite reçue`}
                  </div>
                  <div style={{ fontSize: 13, color: '#9a3412' }}>
                    {cvJourJ.length > 0
                      ? cvJourJ.slice(0, 3).map((l) => (
                          <span
                            key={l.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'white',
                              border: '1.5px solid #fed7aa',
                              borderRadius: 8,
                              padding: '2px 10px',
                              marginRight: 6,
                              marginTop: 3,
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {l.reference || `CV-${l.id}`}
                          </span>
                        ))
                      : `Veuillez consulter “Listes contre-visites”.`}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleSetVue('listes-cv')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 9,
                      border: 'none',
                      background: '#ea580c',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 900,
                      fontSize: 12,
                      fontFamily: 'inherit',
                    }}
                  >
                    Ouvrir →
                  </button>
                  <button
                    onClick={() => setCvAlert(false)}
                    style={{
                      padding: '5px 16px',
                      borderRadius: 9,
                      border: '1px solid #fed7aa',
                      background: 'transparent',
                      color: '#9a3412',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 11,
                      fontFamily: 'inherit',
                    }}
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            )}
            {/* Alerte nouvelles listes d'embauche — même style que l'alerte stock */}
            {embaucheAlert && nouvellesListes.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#eff6ff', border: '2px solid #93c5fd',
                borderRadius: 14, padding: '14px 20px', marginBottom: 16,
                boxShadow: '0 2px 12px rgba(29,78,216,.1)',
                animation: 'slideDown .3s ease', flexShrink: 0,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#1d4ed8', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, color: 'white',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#1d4ed8', marginBottom: 3 }}>
                    🆕 {nouvellesListes.length} nouvelle{nouvellesListes.length > 1 ? 's' : ''} liste{nouvellesListes.length > 1 ? 's' : ''} d'embauche reçue{nouvellesListes.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#1e40af' }}>
                    {nouvellesListes.map(l => (
                      <span key={l.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'white', border: '1.5px solid #bfdbfe',
                        borderRadius: 8, padding: '2px 10px', marginRight: 6, marginTop: 3,
                        fontSize: 12, fontWeight: 700,
                      }}>
                        📋 {l.reference}
                        {l.date_visite && (
                          <span style={{ fontWeight: 500, color: '#3b82f6' }}>
                            · {new Date(l.date_visite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleSetVue('embauche')}
                    style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#1d4ed8', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: 'inherit' }}
                  >
                    Voir les listes →
                  </button>
                  <button onClick={() => setEmbaucheAlert(false)}
                    style={{ padding: '5px 16px', borderRadius: 9, border: '1px solid #bfdbfe', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: 'inherit' }}>
                    Ignorer
                  </button>
                </div>
              </div>
            )}
            {smsAlert && nouvellesSmsListes.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#f0f9ff', border: '2px solid #7dd3fc',
                borderRadius: 14, padding: '14px 20px', marginBottom: 16,
                boxShadow: '0 2px 12px rgba(2,132,199,.12)', flexShrink: 0,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#0284c7', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, color: 'white',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4L22 2z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0369a1', marginBottom: 3 }}>
                    Nouvelle{nouvellesSmsListes.length > 1 ? 's' : ''} liste{nouvellesSmsListes.length > 1 ? 's' : ''} surveillance SMS
                  </div>
                  <div style={{ fontSize: 13, color: '#0c4a6e' }}>
                    {nouvellesSmsListes.map((l) => (
                      <span key={l.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'white', border: '1.5px solid #bae6fd',
                        borderRadius: 8, padding: '2px 10px', marginRight: 6, marginTop: 3,
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {l.reference || `#${l.id}`}
                        {l.date_visite && (
                          <span style={{ fontWeight: 500, color: '#0284c7' }}>
                            · {new Date(l.date_visite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleSetVue('surveillance-sms')}
                    style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#0284c7', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: 'inherit' }}
                  >
                    Voir les listes →
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsAlert(false)}
                    style={{ padding: '5px 16px', borderRadius: 9, border: '1px solid #bae6fd', background: 'transparent', color: '#0369a1', cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: 'inherit' }}
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            )}
            <Accueil onNavigate={handleSetVue} />
          </>
        )}

        {/* ── Listes de passage ── */}
        {vue === 'listes' && (
          <>
            <DashboardStats stats={stats} loading={loadStats} />
            <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, flex:1, overflow:'hidden', minHeight:0 }}>
              <ListesDuJour listes={listes} selectedId={selected?.id ?? null} onSelect={handleSelect} onCreerClick={() => setShowModal(true)} loading={loadListes} />
              <DetailListe liste={selected} onUpdate={handleUpdate} />
            </div>
          </>
        )}

        {vue === 'archive' && <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}><ArchiveVisites /></div>}
        {vue === 'documents-scans' && (
          <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <DocumentsMedicauxScannesPage canEdit />
          </div>
        )}
        {vue === 'embauche' && <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}><ListesEmbaucheInfirmier onNaviguerDossier={(c) => { setDossierCollab(c); setVue('dossier'); }} /></div>}
        {vue === 'surveillance-sms' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SurveillanceSpecialeInfirmier />
          </div>
        )}
        {vue === 'visites-periodiques-inf' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ListesVisitesPeriodiquesInfirmier />
          </div>
        )}
        {vue === 'stock'   && <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}><GestionStock /></div>}
        {vue === 'accidents'      && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><AccidentTravail /></div>}
        {vue === 'maladies'       && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><MaladieProfessionnelle /></div>}
        {vue === 'maladies-chroniques' && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><MaladiesChroniques /></div>}
        {vue === 'dossier' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <DossierMedical
              initialCollab={dossierCollab}
              canEditOverride={true}
              onBack={() => {
                setVue('embauche');
              }}
            />
          </div>
        )}
        {vue === 'rdv-psychologue'     && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><RdvPsychologue /></div>}
        {vue === 'rdv-sagefemme'       && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><RdvSagefemme /></div>}
        {vue === 'incidents-sans' && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><IncidentSansBon /></div>}
        {vue === 'incidents-avec' && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><IncidentAvecBon /></div>}
        {vue === 'transferts-urgence' && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><Transferturgence /></div>}
        {vue === 'declarations-cnam'  && <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}><Declarationcnam /></div>}
        {vue === 'pointage-medecins'  && <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}><PointageMedecin /></div>}
        {vue === 'fiches-aptitude'   && <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}><FichesAptitudeInfirmier /></div>}
        {vue === 'contre-visites-ctrl' && (
          <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <ContrevisitesConsultation />
          </div>
        )}
        {vue === 'listes-cv' && (
          <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <ListesContreVisitesInfirmier />
          </div>
        )}
          </>
        )}
      </main>

      {showModal && <CreerListe onClose={handleCreated} />}
    </div>
  );
}