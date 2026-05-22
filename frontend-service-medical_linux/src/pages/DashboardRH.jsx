// src/pages/DashboardRH.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';
import SiteAssignmentWarning from '../components/common/SiteAssignmentWarning';
import { getListes } from '../api/embaucheApi';
import { fetchVpAlertsRh } from '../api/Medicalworkapi';
import { getListes as getListesContreVisitesRh } from '../api/Contrevisiteapi';
import { buildUserScopedStorageKey, getUserCacheIdentity } from '../utils/userSessionCache';

import ListesEmbauche        from '../components/rh/ListesEmbauche';
import NouvelleListeEmbauche from '../components/rh/NouvelleListeEmbauche';
import DetailListeEmbauche   from '../components/rh/DetailListeEmbauche';
import CertificatsControleur from '../components/rh/CertificatsControleur';
import FichesAptitudeRH from '../components/rh/FichesAptitudeRH';
import VisitesPeriodiquesRHPage from '../components/rh/VisitesPeriodiquesRHPage';
import ContreVisitesRH from '../components/rh/ContreVisitesRH';
import SurveillanceSpecialeRHPage from '../components/rh/SurveillanceSpecialeRHPage';
import { getCollaborateursSansVisitePeriodique } from '../api/Medicalworkapi';
import { getListesVisitesPeriodiques } from '../api/visitesPeriodiquesApi';
import { getListesSurveillanceSpeciale } from '../api/surveillanceSpecialeApi';
import { getVpAlertHorizonJours } from '../constants/vpAlertsRh';
import { getUserSiteId, getUserSiteName } from '../utils/siteAccessControl';
import { RH_VP_EXAM_PERIODIQUE_TERMINE } from '../utils/vpAlertsRhFilter';

/* ════════════════════════════════════════════
   ILLUSTRATION RH SVG
════════════════════════════════════════════ */
const RHIllustration = () => (
  <svg width="160" height="190" viewBox="0 0 160 190" fill="none">
    {/* Bureau */}
    <rect x="20" y="155" width="120" height="12" rx="6" fill="#bfdbfe"/>
    <rect x="35" y="167" width="8" height="22" rx="4" fill="#93c5fd"/>
    <rect x="117" y="167" width="8" height="22" rx="4" fill="#93c5fd"/>
    {/* Ordinateur portable */}
    <rect x="38" y="120" width="84" height="52" rx="8" fill="#1e40af"/>
    <rect x="42" y="124" width="76" height="44" rx="5" fill="#dbeafe"/>
    {/* Écran — données RH */}
    <rect x="48" y="130" width="30" height="4" rx="2" fill="#1d4ed8"/>
    <rect x="48" y="137" width="22" height="3" rx="1.5" fill="#93c5fd"/>
    <rect x="48" y="143" width="25" height="3" rx="1.5" fill="#93c5fd"/>
    <rect x="48" y="149" width="18" height="3" rx="1.5" fill="#bfdbfe"/>
    {/* Graphique barre */}
    <rect x="86" y="152" width="7" height="12" rx="2" fill="#1d4ed8"/>
    <rect x="96" y="144" width="7" height="20" rx="2" fill="#3b82f6"/>
    <rect x="106" y="148" width="7" height="16" rx="2" fill="#60a5fa"/>
    {/* Charnière */}
    <rect x="30" y="171" width="100" height="6" rx="3" fill="#3b82f6"/>
    {/* Personnage assis */}
    {/* Corps */}
    <rect x="58" y="90" width="44" height="38" rx="12" fill="white" stroke="#bfdbfe" strokeWidth="1.5"/>
    {/* Cravate / veste RH */}
    <path d="M78 90 L82 90 L84 118 L80 122 L76 118Z" fill="#1d4ed8" opacity="0.8"/>
    {/* Col */}
    <rect x="74" y="88" width="12" height="8" rx="4" fill="#fcd9b6"/>
    {/* Tête */}
    <ellipse cx="80" cy="72" rx="20" ry="22" fill="#fcd9b6"/>
    {/* Cheveux */}
    <ellipse cx="80" cy="57" rx="20" ry="12" fill="#1e293b"/>
    <ellipse cx="62" cy="66" rx="6" ry="12" fill="#1e293b"/>
    <ellipse cx="98" cy="66" rx="6" ry="12" fill="#1e293b"/>
    {/* Yeux */}
    <ellipse cx="73" cy="72" rx="3" ry="3.5" fill="white"/>
    <ellipse cx="87" cy="72" rx="3" ry="3.5" fill="white"/>
    <circle cx="73.5" cy="72.5" r="2" fill="#1e293b"/>
    <circle cx="87.5" cy="72.5" r="2" fill="#1e293b"/>
    <circle cx="74" cy="72" r="0.8" fill="white"/>
    <circle cx="88" cy="72" r="0.8" fill="white"/>
    {/* Lunettes */}
    <path d="M68 70 Q73 67 78 70" stroke="#475569" strokeWidth="1.5" fill="none"/>
    <path d="M82 70 Q87 67 92 70" stroke="#475569" strokeWidth="1.5" fill="none"/>
    <line x1="78" y1="70" x2="82" y2="70" stroke="#475569" strokeWidth="1.5"/>
    {/* Sourire */}
    <path d="M75 79 Q80 83 85 79" stroke="#e8825a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* Bras gauche — clavier */}
    <path d="M58 110 Q42 118 38 132" stroke="white" strokeWidth="14" strokeLinecap="round"/>
    <path d="M58 110 Q42 118 38 132" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <ellipse cx="36" cy="136" rx="8" ry="6" fill="#fcd9b6"/>
    {/* Bras droit — souris */}
    <path d="M102 110 Q118 118 122 132" stroke="white" strokeWidth="14" strokeLinecap="round"/>
    <path d="M102 110 Q118 118 122 132" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <ellipse cx="124" cy="136" rx="8" ry="6" fill="#fcd9b6"/>
    {/* Badge RH */}
    <rect x="64" y="95" width="18" height="12" rx="3" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
    <text x="66" y="104" fontSize="7" fill="#1d4ed8" fontWeight="bold" fontFamily="sans-serif">RH</text>
    {/* Jambes */}
    <rect x="64" y="128" width="12" height="26" rx="6" fill="#1d4ed8"/>
    <rect x="84" y="128" width="12" height="26" rx="6" fill="#1d4ed8"/>
    {/* Chaussures */}
    <ellipse cx="70" cy="156" rx="9" ry="5" fill="#1e293b"/>
    <ellipse cx="90" cy="156" rx="9" ry="5" fill="#1e293b"/>
  </svg>
);

/* ════════════════════════════════════════════
   ICÔNES
════════════════════════════════════════════ */
const Ic = {
  Dashboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Listes:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>,
  Plus:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Logout:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Users:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  Check:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Send:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Archive:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  Arrow:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Refresh:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  Star:      () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
};

/* ════════════════════════════════════════════
   ACCUEIL RH
════════════════════════════════════════════ */
const MODULES_RH = [
  { key:'listes',   label:"Listes d'embauche",  sub:'Actives · soumises',      I:Ic.Listes,  c:'#1d4ed8', bg:'#dbeafe', bd:'#93c5fd' },
  { key:'nouvelle', label:'Nouvelle liste',       sub:'Créer une liste',        I:Ic.Plus,    c:'#0891b2', bg:'#cffafe', bd:'#67e8f9' },
  { key:'archives', label:'Archives visites',     sub:'Visites clôturées',      I:Ic.Archive, c:'#6b7280', bg:'#f1f5f9', bd:'#e2e8f0' },
  { key:'certificats-ctrl',  label:'Certificats contrôleur',    sub:'Médecin contrôleur',   I:Ic.Check,   c:'#0891b2', bg:'#cffafe', bd:'#67e8f9' },
  { key:'fiches-aptitude-rh', label:'Visite de travail',         sub:'Médecin du travail',   I:Ic.Listes,  c:'#0284c7', bg:'#e0f2fe', bd:'#bae6fd' },
  { key:'visites-periodiques', label:'Visites périodiques', sub:'Alertes + suivi des listes', I:Ic.Archive, c:'#0284c7', bg:'#e0f2fe', bd:'#bae6fd' },
  { key:'contre-visites', label:'Contre-visites', sub:'Médecin contrôleur',   I:Ic.Check,   c:'#059669', bg:'#d1fae5', bd:'#6ee7b7' },
  { key:'surveillance-speciale', label:'Surveillance SMS', sub:'Listes surveillance médicale spéciale', I:Ic.Send, c:'#0284c7', bg:'#e0f2fe', bd:'#bae6fd' },
];

function AccueilRH({ onNavigate, nbVpEcheances = 0, vpAnticipationJours = 30 }) {
  const [listes,  setListes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [time,    setTime]    = useState(new Date());
  const [ready,   setReady]   = useState(false);
  const [spinning,setSpinning]= useState(false);
  const [nbEnRetard, setNbEnRetard] = useState(0);

  useEffect(() => {
    getCollaborateursSansVisitePeriodique()
      .then((d) => setNbEnRetard(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, []);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  const fetchListes = useCallback(async () => {
    setLoading(true);
    try { setListes(await getListes()); }
    catch { setListes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchListes(); }, [fetchListes]);

  const p  = n => String(n).padStart(2,'0');
  const hh = p(time.getHours()), mm = p(time.getMinutes()), ss = p(time.getSeconds());
  const dl = time.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const dateLabel = dl.charAt(0).toUpperCase() + dl.slice(1);

  const isReportee   = (l) => l.statut === 'BROUILLON' && !l.date_visite;
  const brouillons   = listes.filter(l => l.statut === 'BROUILLON' && !isReportee(l)).length;
  const soumises     = listes.filter(l => l.statut === 'SOUMISE').length;
  const enTraitement = listes.filter(l => l.statut === 'EN_TRAITEMENT').length;
  const cloturees    = listes.filter(l => l.statut === 'CLOTUREE').length;
  const reportees    = listes.filter(isReportee);
  const nbReportees  = reportees.length;
  const nbCandidatsReportes = reportees.reduce((s,l)=>s+(l.nombre_candidats||0),0);
  const totalCandidats = listes.reduce((s,l) => s+(l.nombre_candidats||0), 0);
  const totalAptes     = listes.reduce((s,l) => s+(l.nombre_aptes||0), 0);

  const STATS = [
    { label:'Total candidats',  val:totalCandidats, c:'#1d4ed8', bg:'#dbeafe', bd:'#93c5fd',  I:Ic.Users  },
    { label:'Aptes (total)',     val:totalAptes,     c:'#059669', bg:'#d1fae5', bd:'#6ee7b7',  I:Ic.Check  },
    { label:'Listes soumises',   val:soumises,       c:'#d97706', bg:'#fef3c7', bd:'#fde68a',  I:Ic.Send   },
    { label:'Candidats reportés', val:nbCandidatsReportes, c:'#dc2626', bg:'#fef2f2', bd:'#fca5a5',  I:Ic.Archive},
  ];

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';
  const STATUT_CFG = {
    BROUILLON:     { bg:'#f1f5f9', color:'#475569', text:'Brouillon' },
    SOUMISE:       { bg:'#dbeafe', color:'#1d4ed8', text:'Soumise' },
    EN_TRAITEMENT: { bg:'#fef9c3', color:'#a16207', text:'En traitement' },
    CLOTUREE:      { bg:'#dcfce7', color:'#15803d', text:'Clôturée' },
  };
  const recent = [...listes].sort((a,b) => new Date(b.date_creation)-new Date(a.date_creation)).slice(0,5);

  return (
    <div style={{ flex:1, minHeight:0, overflowY:'auto', paddingBottom:32,
      opacity: ready?1:0, transform: ready?'none':'translateY(8px)',
      transition:'opacity .32s ease, transform .32s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap');
        @keyframes up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pop   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes dot   { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.9);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes glow  { 0%,100%{box-shadow:0 6px 28px rgba(29,78,216,.2)} 50%{box-shadow:0 6px 40px rgba(29,78,216,.5),0 0 0 5px rgba(29,78,216,.1)} }
        @keyframes starR { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
        .sc-rh { transition:transform .16s,box-shadow .16s; }
        .sc-rh:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(0,0,0,.1)!important; }
        .mb-rh { transition:all .17s; cursor:pointer; text-align:left; }
        .mb-rh:hover { transform:translateY(-4px); box-shadow:0 14px 36px rgba(0,0,0,.1)!important; }
        .mb-rh:hover .arr-rh { opacity:1!important; transform:translateX(3px)!important; }
        .arr-rh { opacity:0; transition:all .17s; }
        .ptg-rh { animation:glow 3s ease infinite; transition:transform .18s; cursor:pointer; }
        .ptg-rh:hover { transform:translateY(-3px) scale(1.02); }
        .rh-float { animation:float 4s ease-in-out infinite; }
      `}</style>

      {/* ══ HERO CARD ══ */}
      <div style={{ background:'linear-gradient(125deg, #dbeafe 0%, #bfdbfe 40%, #e0e7ff 70%, #f0f9ff 100%)',
        borderRadius:24, marginBottom:16,
        display:'grid', gridTemplateColumns:'1fr auto',
        position:'relative', overflow:'hidden',
        boxShadow:'0 6px 32px rgba(29,78,216,.15)',
        animation:'up .45s ease both',
        border:'1.5px solid rgba(191,219,254,.8)' }}>
        {/* Cercles déco */}
        <div style={{ position:'absolute', right:180, top:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.5)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', left:-40, bottom:-40, width:160, height:160, borderRadius:'50%', background:'rgba(191,219,254,.4)', pointerEvents:'none' }}/>

        {/* Contenu gauche */}
        <div style={{ padding:'32px 36px', position:'relative' }}>
          {/* Logo LEONI */}
          <div style={{ marginBottom:20 }}>
            <img src="https://i.imgur.com/P8t9SW7.png" alt="LEONI"
              style={{ height:36, objectFit:'contain', filter:'drop-shadow(0 2px 6px rgba(29,78,216,.2))' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
            <div style={{ display:'none', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#1d4ed8' }}/>
              <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:22, fontWeight:900, color:'#1e3a8a', letterSpacing:'3px' }}>LEONI</span>
            </div>
          </div>

          <h1 style={{ fontFamily:"'Nunito',sans-serif", fontSize:38, fontWeight:900, color:'#1e3a8a', lineHeight:1.05, letterSpacing:'-1px', marginBottom:10 }}>
            Espace<br/>
            <span style={{ color:'#1d4ed8' }}>Ressources Humaines</span>
          </h1>
          <p style={{ fontSize:13.5, color:'#1d4ed8', fontWeight:600, marginBottom:20, lineHeight:1.5 }}>
            Tableau de bord · Gestion des visites d'embauche
          </p>

          {/* Date + heure */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ background:'white', borderRadius:99, padding:'6px 16px', border:'1.5px solid #bfdbfe', boxShadow:'0 2px 8px rgba(29,78,216,.1)' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#1d4ed8' }}>{dateLabel}</span>
            </div>
            <div style={{ background:'#1d4ed8', borderRadius:99, padding:'6px 16px', boxShadow:'0 2px 8px rgba(29,78,216,.25)' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:'white', letterSpacing:'1px' }}>{hh}:{mm}:{ss}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ position:'relative', width:8, height:8 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e', animation:'dot 2s ease infinite' }}/>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a', position:'relative' }}/>
              </div>
              <span style={{ fontSize:11.5, fontWeight:700, color:'#15803d' }}>Actif</span>
            </div>
          </div>
        </div>

        {/* Illustration */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', paddingRight:24, paddingBottom:0, position:'relative' }}>
          <div style={{ position:'absolute', bottom:0, right:10, width:180, height:180, borderRadius:'50%', background:'rgba(191,219,254,.5)', zIndex:0 }}/>
          <div className="rh-float" style={{ position:'relative', zIndex:1 }}>
            <RHIllustration/>
          </div>
        </div>
      </div>

      {/* ══ ALERTE REPORTÉS ══ */}
      {nbReportees > 0 && (
        <div style={{
          display:'flex', alignItems:'center', gap:14,
          background:'#fef2f2', border:'2px solid #fca5a5',
          borderRadius:16, padding:'16px 22px', marginBottom:16,
          boxShadow:'0 4px 20px rgba(220,38,38,.15)',
          animation:'up .35s ease both',
        }}>
          <div style={{ width:48, height:48, borderRadius:13, background:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:24 }}>
            ⚠
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:16, fontWeight:900, color:'#dc2626', marginBottom:4 }}>
              {nbReportees} liste{nbReportees>1?'s':''} de candidats reportés en attente !
            </div>
            <div style={{ fontSize:13, color:'#7f1d1d', fontWeight:600 }}>
              {nbCandidatsReportes} candidat{nbCandidatsReportes>1?'s':''} n'ont pas pu être examiné{nbCandidatsReportes>1?'s':''} lors de la dernière visite. Une nouvelle date doit être planifiée.
            </div>
          </div>
          <button onClick={() => onNavigate('listes')}
            style={{ padding:'11px 20px', borderRadius:11, border:'none', background:'#dc2626', color:'white', cursor:'pointer', fontWeight:900, fontSize:13, fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0, boxShadow:'0 4px 12px rgba(220,38,38,.4)' }}>
            Gérer les reportés →
          </button>
        </div>
      )}

      {(nbVpEcheances > 0 || nbEnRetard > 0) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: '#fffbeb',
            border: '2px solid #fbbf24',
            borderRadius: 16,
            padding: '16px 22px',
            marginBottom: 16,
            boxShadow: '0 4px 20px rgba(245,158,11,.15)',
          }}
        >
          <div style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>🔔</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#92400e', marginBottom: 6 }}>
              Visites périodiques — action à prévoir
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#78350f', fontWeight: 600, lineHeight: 1.5 }}>
              {nbVpEcheances > 0 && (
                <li>
                  {nbVpEcheances} collaborateur{nbVpEcheances > 1 ? 's' : ''} avec échéance ou retard (fenêtre d’alerte ~J-{vpAnticipationJours}).
                </li>
              )}
              {nbEnRetard > 0 && (
                <li>
                  {nbEnRetard} collaborateur{nbEnRetard > 1 ? 's' : ''} sans visite médicale depuis plus d’un an — visite obligatoire à planifier.
                </li>
              )}
            </ul>
            {nbVpEcheances > 0 && nbEnRetard > 0 && (
              <div style={{ fontSize: 12, color: '#a16207', marginTop: 8, fontWeight: 500 }}>
                La page dédiée regroupe le détail ; un même collaborateur peut apparaître dans les deux indicateurs côté serveur.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('visites-periodiques')}
            style={{
              padding: '11px 20px',
              borderRadius: 11,
              border: 'none',
              background: '#d97706',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 900,
              fontSize: 13,
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            Ouvrir →
          </button>
        </div>
      )}

      {/* ══ STATS ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 220px', gap:12, marginBottom:16, animation:'up .45s ease .08s both' }}>
        {STATS.map((c,i) => (
          <div key={i} className="sc-rh" style={{ background:'white', borderRadius:16, padding:'18px 16px',
            border:`1.5px solid ${c.bd}`, boxShadow:'0 2px 10px rgba(0,0,0,.05)',
            display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:c.bg, color:c.c, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <c.I/>
              </div>
              <div style={{ width:6, height:6, borderRadius:'50%', background:c.c, opacity:.3 }}/>
            </div>
            {loading
              ? <div style={{ height:40, width:50, marginBottom:6, background:'linear-gradient(90deg,#dbeafe 25%,#bfdbfe 50%,#dbeafe 75%)', backgroundSize:'300% 100%', animation:'spin 1.5s ease infinite', borderRadius:8 }}/>
              : <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:42, fontWeight:700, color:c.c, lineHeight:1, letterSpacing:'-2px', marginBottom:4 }}>{c.val}</div>
            }
            <div style={{ fontSize:11.5, fontWeight:600, color:'#64748b' }}>{c.label}</div>
          </div>
        ))}

        {/* Vedette — Nouvelle liste */}
        <div className="ptg-rh" onClick={() => onNavigate('nouvelle')}
          style={{ background:'linear-gradient(145deg, #1e40af 0%, #1d4ed8 55%, #3b82f6 100%)',
            borderRadius:16, padding:'16px 14px',
            border:'2px solid rgba(147,197,253,.5)',
            display:'flex', flexDirection:'column', gap:10,
            position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-18, bottom:-18, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,.12)', pointerEvents:'none' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.2)', borderRadius:99, padding:'3px 10px', alignSelf:'flex-start' }}>
            <span style={{ display:'inline-flex', color:'#fde047', animation:'starR 4s linear infinite' }}><Ic.Star/></span>
            <span style={{ fontSize:9.5, fontWeight:800, color:'white', textTransform:'uppercase', letterSpacing:'1px' }}>Action rapide</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
              <Ic.Plus/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:900, color:'white', lineHeight:1.2, fontFamily:"'Nunito',sans-serif" }}>Nouvelle liste</div>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,.7)', marginTop:1 }}>Créer + importer Excel</div>
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,.18)', borderRadius:10, padding:'7px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:800, color:'white' }}>Créer →</span>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#fde047', boxShadow:'0 0 0 3px rgba(253,224,71,.3)' }}/>
          </div>
        </div>
      </div>

      {/* ══ STATUTS LISTES ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16, animation:'up .45s ease .12s both' }}>
        {[
          { label:'Brouillons',    val:brouillons,   color:'#475569', bg:'#f1f5f9', bd:'#e2e8f0' },
          { label:'Soumises',      val:soumises,      color:'#1d4ed8', bg:'#dbeafe', bd:'#93c5fd' },
          { label:'En traitement', val:enTraitement,  color:'#a16207', bg:'#fef9c3', bd:'#fde68a' },
          { label:'Clôturées',     val:cloturees,     color:'#15803d', bg:'#dcfce7', bd:'#86efac' },
        ].map(s => (
          <div key={s.label} className="sc-rh" style={{ background:s.bg, borderRadius:12, padding:'12px 16px',
            border:`1.5px solid ${s.bd}`, boxShadow:'0 2px 8px rgba(0,0,0,.04)', textAlign:'center' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:28, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:11, color:s.color, opacity:.8, marginTop:4, fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ══ DERNIÈRES LISTES ══ */}
      {recent.length > 0 && (
        <div style={{ animation:'up .45s ease .16s both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:17, fontWeight:900, color:'#1e3a8a', margin:0 }}>
              Dernières listes
            </h2>
            <button onClick={() => onNavigate('listes')}
              style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#1d4ed8', fontSize:13, fontWeight:700, fontFamily:'inherit' }}>
              Voir toutes <Ic.Arrow/>
            </button>
          </div>
          <div style={{ background:'white', borderRadius:16, border:'1.5px solid #dbeafe', overflow:'hidden', boxShadow:'0 2px 12px rgba(29,78,216,.06)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f0f9ff', borderBottom:'1px solid #dbeafe' }}>
                  {['Référence','Date visite','Candidats','Aptes','Statut'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'11px 16px', fontSize:10,
                      fontWeight:800, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:.6 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((l,i) => {
                  const cfg = STATUT_CFG[l.statut] || STATUT_CFG.BROUILLON;
                  return (
                    <tr key={l.id} style={{ borderBottom: i<recent.length-1?'1px solid #f0f9ff':'none' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f8fbff'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'12px 16px', fontWeight:800, color:'#1d4ed8', fontFamily:"'Nunito',sans-serif" }}>{l.reference}</td>
                      <td style={{ padding:'12px 16px', color:'#475569' }}>{fmtDate(l.date_visite)}</td>
                      <td style={{ padding:'12px 16px', fontWeight:700, color:'#0f172a', fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>{l.nombre_candidats??'—'}</td>
                      <td style={{ padding:'12px 16px', fontWeight:700, color:'#15803d', fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>{l.nombre_aptes??'—'}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{cfg.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ MODULES ══ */}
      <div style={{ animation:'up .45s ease .2s both', marginTop:16 }}>
        <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:17, fontWeight:900, color:'#1e3a8a', marginBottom:12 }}>
          Modules <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{MODULES_RH.length} disponibles</span>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, maxWidth:500 }}>
          {MODULES_RH.map((mod, i) => (
            <button key={mod.key} className="mb-rh" onClick={() => onNavigate(mod.key)}
              style={{ background:'white', border:`1.5px solid ${mod.bd}`, borderRadius:16,
                padding:'16px 13px 13px', display:'flex', flexDirection:'column', gap:9,
                boxShadow:'0 2px 8px rgba(0,0,0,.05)', animation:`up .35s ease ${i*.03+0.2}s both`,
                position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${mod.c},${mod.bd})`, borderRadius:'16px 16px 0 0' }}/>
              <div style={{ width:40, height:40, borderRadius:11, background:mod.bg, color:mod.c, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <mod.I/>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:3 }}>{mod.label}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>{mod.sub}</div>
              </div>
              <div className="arr-rh" style={{ color:mod.c, alignSelf:'flex-end', display:'flex' }}><Ic.Arrow/></div>
            </button>
          ))}
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{ marginTop:16, background:'white', border:'1.5px solid #dbeafe', borderRadius:13,
        padding:'10px 20px', display:'flex', alignItems:'center', gap:12,
        animation:'up .4s ease .44s both', boxShadow:'0 2px 8px rgba(29,78,216,.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ position:'relative', width:7, height:7 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#4ade80', animation:'dot 2.5s ease infinite' }}/>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', position:'relative' }}/>
          </div>
          <span style={{ fontSize:11.5, fontWeight:700, color:'#15803d' }}>En ligne</span>
        </div>
        <div style={{ width:1, height:14, background:'#e2e8f0' }}/>
        <span style={{ fontSize:11, color:'#94a3b8', flex:1 }}>
          {listes.length} liste{listes.length!==1?'s':''} · {totalCandidats} candidat{totalCandidats!==1?'s':''}
        </span>
        <button onClick={async()=>{ setSpinning(true); await fetchListes(); setSpinning(false); }}
          style={{ display:'flex', alignItems:'center', gap:5, background:'#f0f9ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'4px 12px', cursor:'pointer', color:'#1d4ed8', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
          <span style={{ display:'flex', animation:spinning?'spin 1s linear infinite':'none' }}><Ic.Refresh/></span>
          Actualiser
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════ */
function Sidebar({ view, onSetView, user, onLogout, nbListes, nbReportes, nbAlertesVP, nbCvClotureNouvelles, nbVpClotureNouvelles, nbSmsClotureNouvelles, nbEmbClotureNouvelles, siteName }) {
  const NAV = [
    { section:'Accueil', items:[
      { id:'accueil',  label:'Tableau de bord', Icon:Ic.Dashboard },
    ]},
    { section:"Visites d'embauche", items:[
      { id:'listes',   label:"Listes d'embauche", Icon:Ic.Listes, badge:true },
      { id:'nouvelle', label:'Nouvelle liste',     Icon:Ic.Plus },
      { id:'archives', label:'Archives visites',   Icon:Ic.Archive },
    ]},
    { section:'Médecin Contrôleur', items:[
      { id:'certificats-ctrl', label:'Certificats contrôleur', Icon:Ic.Check },
    ]},
    { section:'Contre-visites', items:[
      { id:'contre-visites', label:'Listes contre-visites', Icon:Ic.Check },
    ]},
    { section:'Surveillance SMS', items:[
      { id:'surveillance-speciale', label:'Surveillance médicale spéciale', Icon:Ic.Send },
    ]},
    { section:'Médecin du Travail', items:[
      { id:'fiches-aptitude-rh', label:'Visite de travail', Icon:Ic.Listes },
      { id:'visites-periodiques', label:'Visites périodiques', Icon:Ic.Archive, badge:true },
    ]},
  ];

  return (
    <aside style={{ width:248, flexShrink:0, display:'flex', flexDirection:'column',
      height:'100vh', borderRight:'1px solid #dbeafe',
      background:'linear-gradient(175deg, #eff6ff 0%, #dbeafe 40%, #bfdbfe 78%, #93c5fd 100%)',
      boxShadow:'4px 0 20px rgba(29,78,216,.12)',
      position:'relative', zIndex:10, overflow:'hidden' }}>
      {/* Cercles déco */}
      <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.2)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:30, left:-50, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.12)', pointerEvents:'none' }}/>

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 18px 14px',
        borderBottom:'1px solid rgba(29,78,216,.18)', position:'relative', flexShrink:0 }}>
        <div style={{ width:44, height:44, borderRadius:13, flexShrink:0,
          background:'linear-gradient(135deg,#1d4ed8,#1e40af)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 14px rgba(29,78,216,.4)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 3.13a4 4 0 010 7.75" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:800, color:'#1e3a8a', letterSpacing:-.3, lineHeight:1.2, fontFamily:"'Nunito',sans-serif" }}>
            Service Médical
          </div>
          <div style={{ fontSize:10.5, color:'#1d4ed8', fontWeight:600, letterSpacing:.3, marginTop:2 }}>
            {siteName || 'Non assigné'}
          </div>
        </div>
        <img src="https://i.imgur.com/P8t9SW7.png" alt="LEONI"
          style={{ height:22, width:'auto', objectFit:'contain', flexShrink:0,
            filter:'drop-shadow(0 1px 2px rgba(0,0,0,.15))' }}
          onError={e => { e.target.style.display='none'; }} />
      </div>

      {/* Navigation */}
      <div style={{ flex:1, overflowY:'auto', padding:'6px 10px' }}>
        {NAV.map(group => (
          <div key={group.section}>
            <div style={{ fontSize:9, fontWeight:800, color:'#1d4ed8', letterSpacing:1.6,
              textTransform:'uppercase', opacity:.7, padding:'10px 10px 4px' }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = view === item.id || (item.id==='listes' && view==='detail');
              return (
                <button key={item.id} onClick={() => onSetView(item.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                    padding:'9px 12px', borderRadius:11, fontFamily:'inherit',
                    background: active ? '#1d4ed8' : 'transparent',
                    color: active ? '#ffffff' : '#1e3a8a',
                    fontSize:12.5, fontWeight: active ? 700 : 600,
                    border:'none', boxShadow: active ? '0 3px 10px rgba(29,78,216,.3)' : 'none',
                    cursor:'pointer', textAlign:'left', transition:'all .16s', letterSpacing:-.1, marginBottom:2 }}
                  onMouseEnter={e => { if(!active) { e.currentTarget.style.background='rgba(29,78,216,.12)'; e.currentTarget.style.color='#1d4ed8'; }}}
                  onMouseLeave={e => { if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#1e3a8a'; }}}>
                  <div style={{ width:30, height:30, borderRadius:8, flexShrink:0,
                    background: active ? 'rgba(255,255,255,.2)' : 'rgba(29,78,216,.1)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: active ? 'white' : '#1d4ed8', transition:'all .16s' }}>
                    <item.Icon/>
                  </div>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {item.badge && item.id === 'listes' && nbListes > 0 && (
                    <span style={{ background: active ? 'rgba(255,255,255,.25)' : '#1d4ed8',
                      color:'white', fontSize:10, fontWeight:700,
                      padding:'1px 7px', borderRadius:20, fontFamily:"'JetBrains Mono',monospace" }}>
                      {nbListes}
                    </span>
                  )}
                  {item.id === 'listes' && nbReportes > 0 && (
                    <span style={{ background:'#fef3c7', color:'#d97706',
                      border:'1px solid #fde68a', fontSize:10, fontWeight:800,
                      padding:'1px 7px', borderRadius:20 }}>
                      {nbReportes}
                    </span>
                  )}
                  {item.id === 'listes' && nbEmbClotureNouvelles > 0 && (
                    <span style={{ background:'#059669', color:'white',
                      border:'1px solid #6ee7b7', fontSize:10, fontWeight:800,
                      padding:'1px 7px', borderRadius:20 }}>
                      {nbEmbClotureNouvelles}
                    </span>
                  )}
                  {item.id === 'visites-periodiques' && nbAlertesVP > 0 && (
                    <span style={{ background:'#dc2626', color:'white',
                      border:'1px solid #fecaca', fontSize:10, fontWeight:800,
                      padding:'1px 7px', borderRadius:20 }}>
                      {nbAlertesVP}
                    </span>
                  )}
                  {item.id === 'visites-periodiques' && nbVpClotureNouvelles > 0 && (
                    <span style={{ background:'#059669', color:'white',
                      border:'1px solid #6ee7b7', fontSize:10, fontWeight:800,
                      padding:'1px 7px', borderRadius:20 }}>
                      {nbVpClotureNouvelles}
                    </span>
                  )}
                  {item.id === 'contre-visites' && nbCvClotureNouvelles > 0 && (
                    <span style={{ background:'#059669', color:'white',
                      border:'1px solid #6ee7b7', fontSize:10, fontWeight:800,
                      padding:'1px 7px', borderRadius:20 }}>
                      {nbCvClotureNouvelles}
                    </span>
                  )}
                  {item.id === 'surveillance-speciale' && nbSmsClotureNouvelles > 0 && (
                    <span style={{ background:'#059669', color:'white',
                      border:'1px solid #6ee7b7', fontSize:10, fontWeight:800,
                      padding:'1px 7px', borderRadius:20 }}>
                      {nbSmsClotureNouvelles}
                    </span>
                  )}
                  {active && <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,.65)', flexShrink:0 }}/>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User card */}
      <div style={{ margin:'0 10px 14px', background:'rgba(255,255,255,.55)',
        backdropFilter:'blur(10px)', border:'1px solid rgba(29,78,216,.22)',
        borderRadius:14, padding:'11px 12px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
          background:'linear-gradient(135deg,#1d4ed8,#1e40af)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontSize:15, fontWeight:800,
          boxShadow:'0 2px 8px rgba(29,78,216,.28)', fontFamily:"'Nunito',sans-serif" }}>
          {user?.username?.[0]?.toUpperCase() || 'R'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1e3a8a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:"'Nunito',sans-serif" }}>
            {user?.username}
          </div>
          <div style={{ fontSize:11, color:'#1d4ed8', fontWeight:600, marginTop:1 }}>Responsable RH</div>
        </div>
        <LogoutButton onClick={onLogout} />
      </div>
    </aside>
  );
}

/* ════════════════════════════════════════════
   TOPBAR
════════════════════════════════════════════ */
const PAGE_TITLES = {
  accueil:  'Tableau de bord',
  listes:   "Listes d'embauche",
  nouvelle: 'Nouvelle liste',
  detail:   'Détail liste',
  archives: 'Archives des visites',
  'certificats-ctrl': 'Certificats médecin contrôleur',
  'fiches-aptitude-rh': 'Visite de travail',
  'visites-periodiques': 'Visites périodiques',
  'contre-visites': 'Contre-visites',
  'surveillance-speciale': 'Surveillance médicale spéciale',
};

/** Compte les listes VP au statut clôturé (API peut renvoyer une casse différente). */
function countListesVpClotureesRh(list) {
  return (Array.isArray(list) ? list : []).filter((l) => String(l?.statut || '').toUpperCase() === 'CLOTUREE').length;
}

function countListesSmsClotureesRh(list) {
  return (Array.isArray(list) ? list : []).filter((l) => String(l?.statut || '').toUpperCase() === 'CLOTUREE').length;
}

function countListesEmbaucheClotureesRh(list) {
  return (Array.isArray(list) ? list : []).filter((l) => String(l?.statut || '').toUpperCase() === 'CLOTUREE').length;
}

/* ════════════════════════════════════════════
   DASHBOARD PRINCIPAL
════════════════════════════════════════════ */
const DashboardRH = () => {
  const { user, logout } = useAuth();
  /** Ré-exécute les effets « site » quand le contexte auth devient disponible après login. */
  const siteIdFromAuth = user?.site_id ?? user?.site?.id ?? null;
  const navigate         = useNavigate();
  const siteId = getUserSiteId();
  const siteName = getUserSiteName();
  const hasSite = siteId !== null && siteId !== undefined && String(siteId).trim() !== '';
  const [view,     setView]     = useState('accueil');
  const [liste,    setListe]    = useState(null);
  const [nbListes, setNbListes] = useState(0);
  const [nbReportes, setNbReportes] = useState(0);
  const [reportNotif, setReportNotif] = useState(null);
  const [alertesVP, setAlertsVP] = useState({
    count: 0,
    results: [],
    horizon_jours: undefined,
    anticipation_echeance_utilisee_jours: undefined,
    count_api: undefined,
  });
  const lastReportesRef = useRef(null);

  /** Comme l’infirmier (listes CV) : détecter les nouvelles listes clôturées à consulter par le RH. */
  const userCacheIdentity = getUserCacheIdentity(user);
  const LS_RH_CV_CLOTURE = buildUserScopedStorageKey('rh_cv_cloture_last_count', user);
  const LS_RH_VP_CLOTURE = buildUserScopedStorageKey('rh_vp_cloture_last_count', user);
  const LS_RH_SMS_CLOTURE = buildUserScopedStorageKey('rh_sms_cloture_last_count', user);
  const LS_RH_EMB_CLOTURE = buildUserScopedStorageKey('rh_embauche_cloture_last_count', user);
  const [cvClotureAlert, setCvClotureAlert] = useState(false);
  const [nbCvClotureNouvelles, setNbCvClotureNouvelles] = useState(0);
  const [vpClotureAlert, setVpClotureAlert] = useState(false);
  const [nbVpClotureNouvelles, setNbVpClotureNouvelles] = useState(0);
  const [smsClotureAlert, setSmsClotureAlert] = useState(false);
  const [nbSmsClotureNouvelles, setNbSmsClotureNouvelles] = useState(0);
  const [embClotureAlert, setEmbClotureAlert] = useState(false);
  const [nbEmbClotureNouvelles, setNbEmbClotureNouvelles] = useState(0);

  useEffect(() => {
    setCvClotureAlert(false);
    setNbCvClotureNouvelles(0);
    setVpClotureAlert(false);
    setNbVpClotureNouvelles(0);
    setSmsClotureAlert(false);
    setNbSmsClotureNouvelles(0);
    setEmbClotureAlert(false);
    setNbEmbClotureNouvelles(0);
  }, [userCacheIdentity]);

  const refreshCounts = useCallback(() => {
    if (!hasSite) return;
    getListes().then(l => {
      setNbListes(l.length);
      const reportes = l.filter(x => x.statut === 'BROUILLON' && !x.date_visite).length;
      setNbReportes(reportes);

      if (lastReportesRef.current === null) {
        lastReportesRef.current = reportes;
        return;
      }
      if (reportes > lastReportesRef.current) {
        const delta = reportes - lastReportesRef.current;
        setReportNotif({ delta, total: reportes });
      }
      lastReportesRef.current = reportes;
    }).catch(()=>{});
  }, [hasSite]);

  useEffect(() => {
    if (!hasSite) return;
    refreshCounts();
  }, [view, refreshCounts, hasSite]);

  useEffect(() => {
    if (!hasSite) return undefined;
    const t = setInterval(() => refreshCounts(), 15000);
    return () => clearInterval(t);
  }, [refreshCounts, hasSite]);

  const refreshVpAlerts = useCallback(async () => {
    if (!hasSite) return;
    const hzDays = getVpAlertHorizonJours();
    try {
      const res = await fetchVpAlertsRh({ horizon_jours: hzDays });
      const hz =
        typeof res?.horizon_jours === 'number'
          ? res.horizon_jours
          : (res?.horizon_jours != null && String(res.horizon_jours).trim() !== ''
              ? parseInt(String(res.horizon_jours), 10)
              : undefined);
      const cnt = typeof res?.count === 'number' ? res.count : (Array.isArray(res?.results) ? res.results.length : 0);
      const cntApi = typeof res?.count_api === 'number' ? res.count_api : cnt;
      const ant =
        typeof res?.anticipation_echeance_utilisee_jours === 'number' && Number.isFinite(res.anticipation_echeance_utilisee_jours)
          ? res.anticipation_echeance_utilisee_jours
          : (res?.anticipation_echeance_utilisee_jours != null && String(res.anticipation_echeance_utilisee_jours).trim() !== ''
              ? parseInt(String(res.anticipation_echeance_utilisee_jours), 10)
              : undefined);
      setAlertsVP({
        count: cnt,
        count_api: cntApi,
        results: Array.isArray(res?.results) ? res.results : [],
        horizon_jours: Number.isFinite(hz) ? hz : undefined,
        anticipation_echeance_utilisee_jours: Number.isFinite(ant) ? ant : undefined,
      });
    } catch {
      setAlertsVP({
        count: 0,
        count_api: 0,
        results: [],
        horizon_jours: undefined,
        anticipation_echeance_utilisee_jours: undefined,
      });
    }
  }, [hasSite]);

  const vpAlerteAnticipationAffichee = useMemo(
    () =>
      alertesVP.anticipation_echeance_utilisee_jours ??
      alertesVP.horizon_jours ??
      getVpAlertHorizonJours(),
    [alertesVP.anticipation_echeance_utilisee_jours, alertesVP.horizon_jours],
  );

  // Charger les alertes RH (VP à planifier, fenêtre horizon_jours) + polling (5 min)
  useEffect(() => {
    if (!hasSite) return undefined;
    refreshVpAlerts();
    const t = setInterval(() => refreshVpAlerts(), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [hasSite, refreshVpAlerts, siteIdFromAuth]);

  useEffect(() => {
    if (!hasSite) return undefined;
    const onHorizon = () => refreshVpAlerts();
    window.addEventListener('rh-vp-horizon-changed', onHorizon);
    return () => window.removeEventListener('rh-vp-horizon-changed', onHorizon);
  }, [hasSite, refreshVpAlerts]);

  useEffect(() => {
    if (!hasSite) return undefined;
    const onExamVp = () => refreshVpAlerts();
    window.addEventListener(RH_VP_EXAM_PERIODIQUE_TERMINE, onExamVp);
    return () => window.removeEventListener(RH_VP_EXAM_PERIODIQUE_TERMINE, onExamVp);
  }, [hasSite, refreshVpAlerts]);


  const ackCvClotureBaseline = useCallback(async () => {
    try {
      const all = await getListesContreVisitesRh();
      const list = Array.isArray(all) ? all : [];
      const n = list.filter((l) => l.statut === 'CLOTUREE').length;
      localStorage.setItem(LS_RH_CV_CLOTURE, String(n));
      setCvClotureAlert(false);
      setNbCvClotureNouvelles(0);
    } catch {
      /* ignore */
    }
  }, [LS_RH_CV_CLOTURE]);

  const fetchCvClotureNotifications = useCallback(async () => {
    if (!hasSite) return;
    try {
      const all = await getListesContreVisitesRh();
      const list = Array.isArray(all) ? all : [];
      const clotureCount = list.filter((l) => l.statut === 'CLOTUREE').length;
      const raw = localStorage.getItem(LS_RH_CV_CLOTURE);
      if (raw === null || raw === '') {
        localStorage.setItem(LS_RH_CV_CLOTURE, String(clotureCount));
        setNbCvClotureNouvelles(0);
        setCvClotureAlert(false);
        return;
      }
      const last = parseInt(raw, 10);
      const delta = clotureCount - last;
      if (delta > 0) {
        setCvClotureAlert(true);
        setNbCvClotureNouvelles(delta);
      } else {
        setNbCvClotureNouvelles(0);
      }
    } catch {
      /* ignore */
    }
  }, [hasSite, LS_RH_CV_CLOTURE]);

  useEffect(() => {
    if (!hasSite) return undefined;
    fetchCvClotureNotifications();
    const iv = setInterval(() => fetchCvClotureNotifications(), 60_000);
    return () => clearInterval(iv);
  }, [hasSite, fetchCvClotureNotifications]);

  const ackVpClotureBaseline = useCallback(async () => {
    try {
      const all = await getListesVisitesPeriodiques();
      const list = Array.isArray(all) ? all : [];
      const n = countListesVpClotureesRh(list);
      localStorage.setItem(LS_RH_VP_CLOTURE, String(n));
      setVpClotureAlert(false);
      setNbVpClotureNouvelles(0);
    } catch {
      /* ignore */
    }
  }, [LS_RH_VP_CLOTURE]);

  const fetchVpClotureNotifications = useCallback(async () => {
    if (!hasSite) return;
    try {
      const all = await getListesVisitesPeriodiques();
      const list = Array.isArray(all) ? all : [];
      const clotureCount = countListesVpClotureesRh(list);
      const raw = localStorage.getItem(LS_RH_VP_CLOTURE);
      if (raw === null || raw === '') {
        localStorage.setItem(LS_RH_VP_CLOTURE, String(clotureCount));
        setNbVpClotureNouvelles(0);
        setVpClotureAlert(false);
        return;
      }
      let last = parseInt(raw, 10);
      if (Number.isNaN(last) || last < 0) {
        last = clotureCount;
        localStorage.setItem(LS_RH_VP_CLOTURE, String(clotureCount));
        setNbVpClotureNouvelles(0);
        setVpClotureAlert(false);
        return;
      }
      const delta = clotureCount - last;
      if (delta > 0) {
        setVpClotureAlert(true);
        setNbVpClotureNouvelles(delta);
      } else {
        setNbVpClotureNouvelles(0);
        if (clotureCount < last) {
          localStorage.setItem(LS_RH_VP_CLOTURE, String(clotureCount));
        }
      }
    } catch {
      /* ignore */
    }
  }, [hasSite, LS_RH_VP_CLOTURE]);

  useEffect(() => {
    if (!hasSite) return undefined;
    fetchVpClotureNotifications();
    const iv = setInterval(() => fetchVpClotureNotifications(), 60_000);
    return () => clearInterval(iv);
  }, [hasSite, fetchVpClotureNotifications]);

  const ackSmsClotureBaseline = useCallback(async () => {
    try {
      const all = await getListesSurveillanceSpeciale();
      const list = Array.isArray(all) ? all : [];
      const n = countListesSmsClotureesRh(list);
      localStorage.setItem(LS_RH_SMS_CLOTURE, String(n));
      setSmsClotureAlert(false);
      setNbSmsClotureNouvelles(0);
    } catch {
      /* ignore */
    }
  }, [LS_RH_SMS_CLOTURE]);

  const fetchSmsClotureNotifications = useCallback(async () => {
    if (!hasSite) return;
    try {
      const all = await getListesSurveillanceSpeciale();
      const list = Array.isArray(all) ? all : [];
      const clotureCount = countListesSmsClotureesRh(list);
      const raw = localStorage.getItem(LS_RH_SMS_CLOTURE);
      if (raw === null || raw === '') {
        localStorage.setItem(LS_RH_SMS_CLOTURE, String(clotureCount));
        setNbSmsClotureNouvelles(0);
        setSmsClotureAlert(false);
        return;
      }
      let last = parseInt(raw, 10);
      if (Number.isNaN(last) || last < 0) {
        last = clotureCount;
        localStorage.setItem(LS_RH_SMS_CLOTURE, String(clotureCount));
        setNbSmsClotureNouvelles(0);
        setSmsClotureAlert(false);
        return;
      }
      const delta = clotureCount - last;
      if (delta > 0) {
        setSmsClotureAlert(true);
        setNbSmsClotureNouvelles(delta);
      } else {
        setNbSmsClotureNouvelles(0);
        if (clotureCount < last) {
          localStorage.setItem(LS_RH_SMS_CLOTURE, String(clotureCount));
        }
      }
    } catch {
      /* ignore */
    }
  }, [hasSite, LS_RH_SMS_CLOTURE]);

  useEffect(() => {
    if (!hasSite) return undefined;
    fetchSmsClotureNotifications();
    const iv = setInterval(() => fetchSmsClotureNotifications(), 60_000);
    return () => clearInterval(iv);
  }, [hasSite, fetchSmsClotureNotifications]);

  const ackEmbClotureBaseline = useCallback(async () => {
    try {
      const all = await getListes();
      const list = Array.isArray(all) ? all : [];
      const n = countListesEmbaucheClotureesRh(list);
      localStorage.setItem(LS_RH_EMB_CLOTURE, String(n));
      setEmbClotureAlert(false);
      setNbEmbClotureNouvelles(0);
    } catch {
      /* ignore */
    }
  }, [LS_RH_EMB_CLOTURE]);

  const fetchEmbClotureNotifications = useCallback(async () => {
    if (!hasSite) return;
    try {
      const all = await getListes();
      const list = Array.isArray(all) ? all : [];
      const clotureCount = countListesEmbaucheClotureesRh(list);
      const raw = localStorage.getItem(LS_RH_EMB_CLOTURE);
      if (raw === null || raw === '') {
        localStorage.setItem(LS_RH_EMB_CLOTURE, String(clotureCount));
        setNbEmbClotureNouvelles(0);
        setEmbClotureAlert(false);
        return;
      }
      let last = parseInt(raw, 10);
      if (Number.isNaN(last) || last < 0) {
        last = clotureCount;
        localStorage.setItem(LS_RH_EMB_CLOTURE, String(clotureCount));
        setNbEmbClotureNouvelles(0);
        setEmbClotureAlert(false);
        return;
      }
      const delta = clotureCount - last;
      if (delta > 0) {
        setEmbClotureAlert(true);
        setNbEmbClotureNouvelles(delta);
      } else {
        setNbEmbClotureNouvelles(0);
        if (clotureCount < last) {
          localStorage.setItem(LS_RH_EMB_CLOTURE, String(clotureCount));
        }
      }
    } catch {
      /* ignore */
    }
  }, [hasSite, LS_RH_EMB_CLOTURE]);

  useEffect(() => {
    if (!hasSite) return undefined;
    fetchEmbClotureNotifications();
    const iv = setInterval(() => fetchEmbClotureNotifications(), 60_000);
    return () => clearInterval(iv);
  }, [hasSite, fetchEmbClotureNotifications]);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const goTo  = (v) => {
    if (!hasSite) return;
    setListe(null);
    setView(v);
    if (v === 'listes') {
      void ackEmbClotureBaseline();
    }
    if (v === 'contre-visites') {
      void ackCvClotureBaseline();
    }
    if (v === 'visites-periodiques') {
      void ackVpClotureBaseline();
    }
    if (v === 'surveillance-speciale') {
      void ackSmsClotureBaseline();
    }
  };
  const goDetail = (l) => { if (!hasSite) return; setListe(l); setView('detail'); };
  // Navigation vers une liste par son ID (ex: depuis le bouton "Voir liste reportée")
  const goDetailById = async (id) => {
    try {
      const { getListeDetail } = await import('../api/embaucheApi');
      const l = await getListeDetail(id);
      setListe(l); setView('detail');
    } catch { /* silent */ }
  };

  const title = view === 'detail' ? (liste?.reference || 'Détail') : (PAGE_TITLES[view] || '');

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden',
      fontFamily:"'Nunito','Segoe UI',system-ui,sans-serif",
      background:'#f8fbff' }}>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        button, input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#bfdbfe; border-radius:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      <Sidebar view={view} onSetView={goTo} user={user} onLogout={handleLogout} nbListes={nbListes} nbReportes={nbReportes} nbAlertesVP={alertesVP.count} nbCvClotureNouvelles={nbCvClotureNouvelles} nbVpClotureNouvelles={nbVpClotureNouvelles} nbSmsClotureNouvelles={nbSmsClotureNouvelles} nbEmbClotureNouvelles={nbEmbClotureNouvelles} siteName={siteName} />

      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column',
        padding:'28px 32px 24px', background:'#f8fbff' }}>
        {/* Topbar */}
        <div style={{ marginBottom:20, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ width:4, height:24, borderRadius:99,
              background:'linear-gradient(180deg,#1d4ed8,#1e40af)', flexShrink:0 }}/>
            <h1 style={{ fontSize:22, fontWeight:900, color:'#1e3a8a', letterSpacing:-.5, margin:0, fontFamily:"'Nunito',sans-serif" }}>
              {title}
            </h1>
            <span style={{ background:'#dbeafe', color:'#1d4ed8', fontSize:11,
              fontWeight:700, padding:'3px 10px', borderRadius:20, marginLeft:4 }}>RH</span>
          </div>
        </div>

        {hasSite && cvClotureAlert && view !== 'contre-visites' && view !== 'accueil' && (
          <div style={{
            marginBottom: 14,
            background: '#ecfdf5',
            border: '1.5px solid #6ee7b7',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 22 }}>📋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#047857' }}>
                Liste de contre-visites clôturée par l&apos;infirmier
              </div>
              <div style={{ fontSize: 12, color: '#065f46' }}>
                {nbCvClotureNouvelles === 1
                  ? 'Une liste est prête : vous pouvez consulter les détails et les certificats (PDF).'
                  : `${nbCvClotureNouvelles} nouvelles listes clôturées — consultez « Listes contre-visites ».`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => goTo('contre-visites')}
              style={{ padding:'8px 14px', borderRadius:10, border:'none', background:'#059669', color:'white', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Consulter
            </button>
            <button
              type="button"
              onClick={() => { setCvClotureAlert(false); void ackCvClotureBaseline(); }}
              style={{ padding:'8px 10px', borderRadius:10, border:'1.5px solid #6ee7b7', background:'white', color:'#047857', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Ignorer
            </button>
          </div>
        )}

        {hasSite && vpClotureAlert && view !== 'visites-periodiques' && view !== 'accueil' && (
          <div style={{
            marginBottom: 14,
            background: '#ecfdf5',
            border: '1.5px solid #6ee7b7',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 22 }}>✅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#047857' }}>
                Visites périodiques : liste clôturée par l&apos;infirmier
              </div>
              <div style={{ fontSize: 12, color: '#065f46' }}>
                {nbVpClotureNouvelles === 1
                  ? 'Une liste est prête : consultez l’onglet « Visites périodiques » (suivi des listes).'
                  : `${nbVpClotureNouvelles} nouvelles listes clôturées — ouvrez « Visites périodiques ».`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => goTo('visites-periodiques')}
              style={{ padding:'8px 14px', borderRadius:10, border:'none', background:'#059669', color:'white', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Consulter
            </button>
            <button
              type="button"
              onClick={() => { setVpClotureAlert(false); void ackVpClotureBaseline(); }}
              style={{ padding:'8px 10px', borderRadius:10, border:'1.5px solid #6ee7b7', background:'white', color:'#047857', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Ignorer
            </button>
          </div>
        )}

        {hasSite && smsClotureAlert && view !== 'surveillance-speciale' && view !== 'accueil' && (
          <div style={{
            marginBottom: 14,
            background: '#ecfdf5',
            border: '1.5px solid #6ee7b7',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 22 }}>✅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#047857' }}>
                Surveillance SMS : liste clôturée par l&apos;infirmier
              </div>
              <div style={{ fontSize: 12, color: '#065f46' }}>
                {nbSmsClotureNouvelles === 1
                  ? 'Une liste est prête : ouvrez « Surveillance médicale spéciale » pour le suivi.'
                  : `${nbSmsClotureNouvelles} nouvelles listes clôturées — ouvrez « Surveillance médicale spéciale ».`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => goTo('surveillance-speciale')}
              style={{ padding:'8px 14px', borderRadius:10, border:'none', background:'#059669', color:'white', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Consulter
            </button>
            <button
              type="button"
              onClick={() => { setSmsClotureAlert(false); void ackSmsClotureBaseline(); }}
              style={{ padding:'8px 10px', borderRadius:10, border:'1.5px solid #6ee7b7', background:'white', color:'#047857', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Ignorer
            </button>
          </div>
        )}

        {hasSite && embClotureAlert && view !== 'listes' && view !== 'detail' && view !== 'accueil' && (
          <div style={{
            marginBottom: 14,
            background: '#ecfdf5',
            border: '1.5px solid #6ee7b7',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 22 }}>✅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#047857' }}>
                Visites d&apos;embauche : liste clôturée par l&apos;infirmier
              </div>
              <div style={{ fontSize: 12, color: '#065f46' }}>
                {nbEmbClotureNouvelles === 1
                  ? 'Une liste est prête : consultez « Listes d&apos;embauche » (onglet Clôturées).'
                  : `${nbEmbClotureNouvelles} nouvelles listes clôturées — ouvrez « Listes d&apos;embauche ».`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => goTo('listes')}
              style={{ padding:'8px 14px', borderRadius:10, border:'none', background:'#059669', color:'white', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Consulter
            </button>
            <button
              type="button"
              onClick={() => { setEmbClotureAlert(false); void ackEmbClotureBaseline(); }}
              style={{ padding:'8px 10px', borderRadius:10, border:'1.5px solid #6ee7b7', background:'white', color:'#047857', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Ignorer
            </button>
          </div>
        )}

        {hasSite && reportNotif && (
          <div style={{
            marginBottom: 14,
            background: '#fff7ed',
            border: '1.5px solid #fed7aa',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 20 }}>🔔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#c2410c' }}>
                Nouvelle liste reportée générée automatiquement
              </div>
              <div style={{ fontSize: 12, color: '#92400e' }}>
                +{reportNotif.delta} nouvelle{reportNotif.delta > 1 ? 's' : ''} liste{reportNotif.delta > 1 ? 's' : ''}. Total reportées : {reportNotif.total}.
              </div>
            </div>
            <button
              onClick={() => { setReportNotif(null); setView('listes'); }}
              style={{ padding:'8px 14px', borderRadius:10, border:'none', background:'#c2410c', color:'white', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Voir les listes
            </button>
            <button
              onClick={() => setReportNotif(null)}
              style={{ padding:'8px 10px', borderRadius:10, border:'1.5px solid #fed7aa', background:'white', color:'#c2410c', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit' }}
            >
              Fermer
            </button>
          </div>
        )}

        {/* Contenu */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
          {!hasSite ? (
            <SiteAssignmentWarning />
          ) : (
            <>
          {view === 'detail' && liste && (
            <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
              <DetailListeEmbauche listeInit={liste} onBack={() => goTo('listes')} onGoToListe={goDetailById} />
            </div>
          )}
          {view === 'nouvelle' && (
            <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
              <NouvelleListeEmbauche onBack={() => goTo('listes')} onListeCreee={goDetail} />
            </div>
          )}
          {view === 'listes' && (
            <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
              <ListesEmbauche onNouvelleClick={() => goTo('nouvelle')} onDetailClick={goDetail} />
            </div>
          )}
          {view === 'archives' && (
            <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
              <ListesEmbauche archivesOnly onDetailClick={goDetail} />
            </div>
          )}
          {view === 'accueil' && (
            <>
              {cvClotureAlert && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#ecfdf5',
                  border: '2px solid #6ee7b7',
                  borderRadius: 14,
                  padding: '14px 18px',
                  marginBottom: 16,
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 28 }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#047857', marginBottom: 4 }}>
                      Contre-visites : liste clôturée
                    </div>
                    <div style={{ fontSize: 12.5, color: '#065f46' }}>
                      L&apos;infirmier a clôturé {nbCvClotureNouvelles === 1 ? 'une liste' : `${nbCvClotureNouvelles} listes`}. Ouvrez « Listes contre-visites » pour voir les détails et les certificats.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo('contre-visites')}
                    style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    Ouvrir
                  </button>
                </div>
              )}
              {vpClotureAlert && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#ecfdf5',
                  border: '2px solid #6ee7b7',
                  borderRadius: 14,
                  padding: '14px 18px',
                  marginBottom: 16,
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 28 }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#047857', marginBottom: 4 }}>
                      Visites périodiques : liste clôturée
                    </div>
                    <div style={{ fontSize: 12.5, color: '#065f46' }}>
                      L&apos;infirmier a clôturé {nbVpClotureNouvelles === 1 ? 'une liste' : `${nbVpClotureNouvelles} listes`}. Consultez « Visites périodiques » pour le suivi (onglet Clôturées).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo('visites-periodiques')}
                    style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    Ouvrir
                  </button>
                </div>
              )}
              {smsClotureAlert && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#ecfdf5',
                  border: '2px solid #6ee7b7',
                  borderRadius: 14,
                  padding: '14px 18px',
                  marginBottom: 16,
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 28 }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#047857', marginBottom: 4 }}>
                      Surveillance SMS : liste clôturée
                    </div>
                    <div style={{ fontSize: 12.5, color: '#065f46' }}>
                      L&apos;infirmier a clôturé {nbSmsClotureNouvelles === 1 ? 'une liste' : `${nbSmsClotureNouvelles} listes`}. Consultez « Surveillance médicale spéciale » pour le suivi (listes clôturées).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo('surveillance-speciale')}
                    style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    Ouvrir
                  </button>
                </div>
              )}
              {embClotureAlert && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#ecfdf5',
                  border: '2px solid #6ee7b7',
                  borderRadius: 14,
                  padding: '14px 18px',
                  marginBottom: 16,
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 28 }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#047857', marginBottom: 4 }}>
                      Visites d&apos;embauche : liste clôturée
                    </div>
                    <div style={{ fontSize: 12.5, color: '#065f46' }}>
                      L&apos;infirmier a clôturé {nbEmbClotureNouvelles === 1 ? 'une liste' : `${nbEmbClotureNouvelles} listes`}. Ouvrez « Listes d&apos;embauche » pour consulter l&apos;onglet Clôturées (archivage, export).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo('listes')}
                    style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    Ouvrir
                  </button>
                </div>
              )}
              <AccueilRH
                onNavigate={goTo}
                nbVpEcheances={alertesVP.count}
                vpAnticipationJours={vpAlerteAnticipationAffichee}
              />
            </>
          )}
          {view === 'certificats-ctrl' && (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <CertificatsControleur />
            </div>
          )}
          {view === 'fiches-aptitude-rh' && (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <FichesAptitudeRH />
            </div>
          )}
          {view === 'visites-periodiques' && (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <VisitesPeriodiquesRHPage
                onOpenFiche={(payload) => {
                  const ficheId = payload?.fiche_aptitude_id ?? payload?.derniere_fiche_id ?? payload?.derniereFicheId ?? payload?.fiche_id ?? payload?.id;
                  if (ficheId == null || ficheId === '') return;
                  try {
                    localStorage.setItem('rh_open_fiche_id', String(ficheId));
                  } catch {
                    /* ignore */
                  }
                  goTo('fiches-aptitude-rh');
                }}
              />
            </div>
          )}
          {view === 'contre-visites' && (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ContreVisitesRH />
            </div>
          )}
          {view === 'surveillance-speciale' && (
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <SurveillanceSpecialeRHPage />
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardRH;