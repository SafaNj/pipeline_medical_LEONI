// src/components/infirmier/Accueil.jsx
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats } from '../../api/actInfirmierApi';
import { getAlertes } from '../../api/stockApi';

/* ── Illustration infirmière SVG ── */
const NurseIllustration = () => (
  <svg width="160" height="190" viewBox="0 0 160 190" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Corps / blouse blanche */}
    <ellipse cx="80" cy="155" rx="38" ry="30" fill="#e0f2fe"/>
    <rect x="52" y="115" width="56" height="55" rx="14" fill="white" stroke="#bae6fd" strokeWidth="1.5"/>
    {/* Croix médicale sur blouse */}
    <rect x="74" y="128" width="12" height="4" rx="2" fill="#0284c7"/>
    <rect x="78" y="124" width="4" height="12" rx="2" fill="#0284c7"/>
    {/* Cou */}
    <rect x="73" y="100" width="14" height="18" rx="7" fill="#fcd9b6"/>
    {/* Tête */}
    <ellipse cx="80" cy="88" rx="22" ry="24" fill="#fcd9b6"/>
    {/* Cheveux */}
    <ellipse cx="80" cy="72" rx="22" ry="14" fill="#1e293b"/>
    <ellipse cx="59" cy="82" rx="7" ry="14" fill="#1e293b"/>
    <ellipse cx="101" cy="82" rx="7" ry="14" fill="#1e293b"/>
    {/* Visage — yeux */}
    <ellipse cx="73" cy="88" rx="3" ry="3.5" fill="white"/>
    <ellipse cx="87" cy="88" rx="3" ry="3.5" fill="white"/>
    <circle cx="73.5" cy="88.5" r="2" fill="#1e293b"/>
    <circle cx="87.5" cy="88.5" r="2" fill="#1e293b"/>
    <circle cx="74" cy="88" r="0.8" fill="white"/>
    <circle cx="88" cy="88" r="0.8" fill="white"/>
    {/* Sourcils */}
    <path d="M70 83 Q73 81 76 83" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M84 83 Q87 81 90 83" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Sourire */}
    <path d="M75 95 Q80 99 85 95" stroke="#e8825a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* Joues roses */}
    <ellipse cx="68" cy="93" rx="5" ry="3" fill="#fda4af" opacity="0.5"/>
    <ellipse cx="92" cy="93" rx="5" ry="3" fill="#fda4af" opacity="0.5"/>
    {/* Bonnet infirmière */}
    <path d="M58 74 Q80 62 102 74 L100 80 Q80 70 60 80Z" fill="white" stroke="#bae6fd" strokeWidth="1"/>
    <rect x="74" y="64" width="12" height="4" rx="2" fill="#0284c7"/>
    <rect x="78" y="60" width="4" height="12" rx="2" fill="#0284c7"/>
    {/* Bras gauche */}
    <path d="M52 125 Q36 135 32 148" stroke="white" strokeWidth="14" strokeLinecap="round"/>
    <path d="M52 125 Q36 135 32 148" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Main gauche avec stéthoscope */}
    <ellipse cx="30" cy="152" rx="8" ry="6" fill="#fcd9b6"/>
    {/* Stéthoscope */}
    <path d="M38 148 Q50 138 50 128" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="38" cy="150" r="5" fill="none" stroke="#475569" strokeWidth="2"/>
    <circle cx="38" cy="150" r="2" fill="#0284c7"/>
    {/* Bras droit avec clipboard */}
    <path d="M108 125 Q124 135 128 148" stroke="white" strokeWidth="14" strokeLinecap="round"/>
    <path d="M108 125 Q124 135 128 148" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Clipboard */}
    <rect x="122" y="142" width="22" height="28" rx="3" fill="white" stroke="#93c5fd" strokeWidth="1.5"/>
    <rect x="128" y="140" width="10" height="5" rx="2" fill="#93c5fd"/>
    <line x1="125" y1="152" x2="141" y2="152" stroke="#bae6fd" strokeWidth="1.5"/>
    <line x1="125" y1="157" x2="141" y2="157" stroke="#bae6fd" strokeWidth="1.5"/>
    <line x1="125" y1="162" x2="138" y2="162" stroke="#bae6fd" strokeWidth="1.5"/>
    {/* Jambes */}
    <rect x="62" y="160" width="14" height="28" rx="7" fill="#0284c7"/>
    <rect x="84" y="160" width="14" height="28" rx="7" fill="#0284c7"/>
    {/* Chaussures */}
    <ellipse cx="69" cy="190" rx="10" ry="5" fill="#1e293b"/>
    <ellipse cx="91" cy="190" rx="10" ry="5" fill="#1e293b"/>
  </svg>
);

/* ── Icons ── */
const Ic = {
  List:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Archive: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  Box:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Warn:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Shield:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  File:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Truck:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 17H3a1 1 0 01-1-1V6a1 1 0 011-1h11l4 4v7h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M14 5v4h4"/><line x1="6" y1="10" x2="10" y2="10"/><line x1="8" y1="8" x2="8" y2="12"/></svg>,
  Cal:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
  Clip:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  Clock:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Xc:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Bell:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Arrow:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Refresh: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  Star:    () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  Cnam:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
};

const MODULES = [
  { key:'listes',             label:'Listes de passage',        sub:'Consultations du jour',        I:Ic.List,    c:'#0284c7', bg:'#e0f2fe', bd:'#bae6fd' },
  { key:'documents-scans',    label:'Archives / scans',         sub:'Documents médicaux (PDF, images)', I:Ic.Clip, c:'#0369a1', bg:'#f0f9ff', bd:'#7dd3fc' },
  { key:'archive',            label:'Archive des visites',       sub:'Historique',                   I:Ic.Archive, c:'#7c3aed', bg:'#ede9fe', bd:'#c4b5fd' },
  { key:'stock',              label:'Gestion du stock',          sub:'Médicaments & consommables',   I:Ic.Box,     c:'#0891b2', bg:'#cffafe', bd:'#a5f3fc' },
  { key:'accidents',          label:'Accidents de travail',      sub:'Déclarations AT',              I:Ic.Warn,    c:'#d97706', bg:'#fef3c7', bd:'#fde68a' },
  { key:'maladies',           label:'Maladies professionnelles', sub:'Pathologies liées au travail', I:Ic.Shield,  c:'#059669', bg:'#d1fae5', bd:'#6ee7b7' },
  { key:'incidents-sans',     label:'Incidents sans bon a charge de LEONI',        sub:'Sans bon a charge de LEONI',           I:Ic.File,    c:'#0284c7', bg:'#dbeafe', bd:'#93c5fd' },
  { key:'incidents-avec',     label:'Incidents bon a charge de LEONI',        sub:'Bon a charge de LEONI',           I:Ic.File,    c:'#0369a1', bg:'#e0f2fe', bd:'#7dd3fc' },
  { key:'transferts-urgence', label:'Transferts urgences',       sub:'Transport & ordres',           I:Ic.Truck,   c:'#dc2626', bg:'#fee2e2', bd:'#fca5a5' },
  { key:'declarations-cnam',  label:'Déclarations CNAM',         sub:'Dossiers CNAM',                I:Ic.Cnam,    c:'#0e7490', bg:'#ecfeff', bd:'#67e8f9' },
  { key:'maladies-chroniques', label:'Maladies chroniques',       sub:'Suivi des pathologies chroniques',  I:Ic.Shield, c:'#be185d', bg:'#fdf2f8', bd:'#f9a8d4' },
  { key:'rdv-psychologue',     label:'RDV Psychologue du travail',sub:'Rendez-vous psychologue',           I:Ic.Cal,    c:'#7c3aed', bg:'#f5f3ff', bd:'#c4b5fd' },
  { key:'rdv-sagefemme',       label:'RDV Sage-femme',            sub:'Rendez-vous sage-femme',            I:Ic.Cal,    c:'#0891b2', bg:'#ecfeff', bd:'#a5f3fc' },
];

export default function Accueil({ onNavigate }) {
  const [stats,     setStats]     = useState(null);
  const [loadStats, setLoadStats] = useState(true);
  const [alertes,   setAlertes]   = useState([]);
  const [loadStock, setLoadStock] = useState(true);
  const [time,      setTime]      = useState(new Date());
  const [ready,     setReady]     = useState(false);
  const [spinning,  setSpinning]  = useState(false);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  const fetchStats = useCallback(async () => {
    setLoadStats(true);
    try { setStats(await getDashboardStats()); } catch { setStats(null); }
    finally { setLoadStats(false); }
  }, []);

  const fetchAlertes = useCallback(async () => {
    setLoadStock(true);
    try {
      const data = await getAlertes();
      setAlertes(data.filter(i => i.statut === 'EPUISE' || i.statut === 'FAIBLE'));
    } catch { setAlertes([]); }
    finally { setLoadStock(false); }
  }, []);

  useEffect(() => {
    fetchStats(); fetchAlertes();
    const iv = setInterval(fetchAlertes, 60000);
    return () => clearInterval(iv);
  }, [fetchStats, fetchAlertes]);

  const p  = n => String(n).padStart(2,'0');
  const hh = p(time.getHours()), mm = p(time.getMinutes()), ss = p(time.getSeconds());
  const dl = time.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const dateLabel = dl.charAt(0).toUpperCase() + dl.slice(1);

  const epuises = alertes.filter(a => a.statut === 'EPUISE');
  const faibles  = alertes.filter(a => a.statut === 'FAIBLE');

  const STATS = [
    { key:'total_listes',           label:'Listes du jour', I:Ic.Clip,  c:'#0284c7', bg:'#e0f2fe', bd:'#bae6fd' },
    { key:'total_items_en_attente', label:'En attente',     I:Ic.Clock, c:'#d97706', bg:'#fef3c7', bd:'#fde68a' },
    { key:'total_effectues',        label:'Effectués',      I:Ic.Check, c:'#059669', bg:'#d1fae5', bd:'#6ee7b7' },
    { key:'total_annules',          label:'Annulés',        I:Ic.Xc,    c:'#dc2626', bg:'#fee2e2', bd:'#fca5a5' },
  ];

  return (
    <div style={{
      flex:1, minHeight:0, overflowY:'auto', paddingBottom:32,
      fontFamily:"'Nunito','Segoe UI',sans-serif",
      opacity: ready ? 1 : 0, transform: ready ? 'none' : 'translateY(8px)',
      transition:'opacity .32s ease, transform .32s ease',
      background:'#f8fbff',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap');

        @keyframes up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pop   { from{opacity:0;transform:scale(.92)}        to{opacity:1;transform:scale(1)}     }
        @keyframes dot   { 0%,100%{transform:scale(1);opacity:.8}  50%{transform:scale(1.9);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)}         50%{transform:translateY(-8px)}    }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes skel  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes glow  { 0%,100%{box-shadow:0 6px 28px rgba(56,189,248,.2)} 50%{box-shadow:0 6px 40px rgba(56,189,248,.5),0 0 0 5px rgba(56,189,248,.1)} }
        @keyframes starR { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }

        .sk { background:linear-gradient(90deg,#dbeafe 25%,#bae6fd 50%,#dbeafe 75%); background-size:300% 100%; animation:skel 1.5s ease infinite; border-radius:8px; }
        .sc { transition:transform .16s,box-shadow .16s; }
        .sc:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(0,0,0,.1)!important; }
        .mb { transition:all .17s; cursor:pointer; text-align:left; }
        .mb:hover { transform:translateY(-4px); box-shadow:0 14px 36px rgba(0,0,0,.1)!important; }
        .mb:hover .arr { opacity:1!important; transform:translateX(3px)!important; }
        .arr { opacity:0; transition:all .17s; }
        .ptg { animation:glow 3s ease infinite; transition:transform .18s; cursor:pointer; }
        .ptg:hover { transform:translateY(-3px) scale(1.02); }
        .nurse { animation:float 4s ease-in-out infinite; }
        .tg { animation:pop .2s ease both; }
      `}</style>

      {/* ══════════════════════════════════════════════
          HERO CARD — illustration + logo LEONI grand
      ══════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(125deg, #e0f2fe 0%, #bae6fd 40%, #e0f9ff 70%, #f0f9ff 100%)',
        borderRadius:24, marginBottom:16,
        display:'grid', gridTemplateColumns:'1fr auto',
        position:'relative', overflow:'hidden',
        boxShadow:'0 6px 32px rgba(56,189,248,.15)',
        animation:'up .45s ease both',
        border:'1.5px solid rgba(186,230,253,.8)',
      }}>
        {/* Cercles déco */}
        <div style={{ position:'absolute', right:180, top:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.5)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', left:-40, bottom:-40, width:160, height:160, borderRadius:'50%', background:'rgba(186,230,253,.4)', pointerEvents:'none' }}/>

        {/* Contenu gauche */}
        <div style={{ padding:'32px 36px', position:'relative' }}>

          {/* Logo LEONI — grand et visible */}
          <div style={{ marginBottom:20 }}>
            <img src="https://i.imgur.com/P8t9SW7.png" alt="LEONI"
              style={{ height:36, objectFit:'contain', filter:'drop-shadow(0 2px 6px rgba(2,132,199,.2))' }}
              onError={e => {
                e.target.style.display='none';
                e.target.nextSibling.style.display='flex';
              }}
            />
            {/* Fallback logo texte */}
            <div style={{ display:'none', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#0284c7' }}/>
              <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:22, fontWeight:900, color:'#0c4a6e', letterSpacing:'3px' }}>LEONI</span>
            </div>
          </div>

          {/* Titre */}
          <h1 style={{ fontFamily:"'Nunito',sans-serif", fontSize:38, fontWeight:900, color:'#0c4a6e', lineHeight:1.05, letterSpacing:'-1px', marginBottom:10 }}>
            Espace<br/>
            <span style={{ color:'#0284c7' }}>Infirmier</span>
          </h1>

          <p style={{ fontSize:13.5, color:'#0369a1', fontWeight:600, marginBottom:20, lineHeight:1.5 }}>
            Tableau de bord · Service Médical
          </p>

          {/* Date + heure */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ background:'white', borderRadius:99, padding:'6px 16px', border:'1.5px solid #bae6fd', boxShadow:'0 2px 8px rgba(2,132,199,.1)' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#0369a1' }}>{dateLabel}</span>
            </div>
            <div style={{ background:'#0284c7', borderRadius:99, padding:'6px 16px', boxShadow:'0 2px 8px rgba(2,132,199,.25)' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:'white', letterSpacing:'1px' }}>{hh}:{mm}:{ss}</span>
            </div>
            {/* Indicateur live */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ position:'relative', width:8, height:8 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e', animation:'dot 2s ease infinite' }}/>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a', position:'relative' }}/>
              </div>
              <span style={{ fontSize:11.5, fontWeight:700, color:'#15803d' }}>Actif</span>
            </div>
          </div>
        </div>

        {/* Illustration infirmière */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', paddingRight:24, paddingBottom:0, position:'relative' }}>
          {/* Cercle de fond derrière l'infirmière */}
          <div style={{ position:'absolute', bottom:0, right:10, width:180, height:180, borderRadius:'50%', background:'rgba(186,230,253,.5)', zIndex:0 }}/>
          <div className="nurse" style={{ position:'relative', zIndex:1 }}>
            <NurseIllustration/>
          </div>
        </div>
      </div>

      {/* ══ LIGNE : STATS (3) + POINTAGE VEDETTE ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 220px', gap:12, marginBottom:16, animation:'up .45s ease .08s both' }}>
        {STATS.map(c => (
          <div key={c.key} className="sc" style={{
            background:'white', borderRadius:16, padding:'18px 16px',
            border:`1.5px solid ${c.bd}`,
            boxShadow:'0 2px 10px rgba(0,0,0,.05)',
            display:'flex', flexDirection:'column',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:c.bg, color:c.c, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <c.I/>
              </div>
              <div style={{ width:6, height:6, borderRadius:'50%', background:c.c, opacity:.3 }}/>
            </div>
            {loadStats
              ? <div className="sk" style={{ height:40, width:50, marginBottom:6 }}/>
              : <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:42, fontWeight:700, color:c.c, lineHeight:1, letterSpacing:'-2px', marginBottom:4 }}>
                  {stats?.[c.key] ?? 0}
                </div>
            }
            <div style={{ fontSize:11.5, fontWeight:600, color:'#64748b' }}>{c.label}</div>
          </div>
        ))}

        {/* ── POINTAGE MÉDECINS VEDETTE ── */}
        <div className="ptg"
          onClick={() => onNavigate?.('pointage-medecins')}
          style={{
            background:'linear-gradient(145deg, #0369a1 0%, #0284c7 55%, #38bdf8 100%)',
            borderRadius:16, padding:'16px 14px',
            border:'2px solid rgba(125,211,252,.5)',
            display:'flex', flexDirection:'column', gap:10,
            position:'relative', overflow:'hidden',
          }}>
          <div style={{ position:'absolute', right:-18, bottom:-18, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,.12)', pointerEvents:'none' }}/>

          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.2)', borderRadius:99, padding:'3px 10px', alignSelf:'flex-start' }}>
            <span style={{ display:'inline-flex', color:'#fde047', animation:'starR 4s linear infinite' }}><Ic.Star/></span>
            <span style={{ fontSize:9.5, fontWeight:800, color:'white', textTransform:'uppercase', letterSpacing:'1px' }}>Priorité</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
              <Ic.Cal/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:900, color:'white', lineHeight:1.2, fontFamily:"'Nunito',sans-serif" }}>Pointage médecins</div>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,.7)', marginTop:1 }}>Présences & absences</div>
            </div>
          </div>

          <div style={{ background:'rgba(255,255,255,.18)', borderRadius:10, padding:'7px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:800, color:'white' }}>Accéder →</span>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#fde047', boxShadow:'0 0 0 3px rgba(253,224,71,.3)' }}/>
          </div>
        </div>
      </div>

      {/* ══ ALERTE STOCK ══ */}
      {loadStock ? (
        <div className="sk" style={{ height:52, marginBottom:14, borderRadius:14 }}/>
      ) : alertes.length > 0 ? (
        <div style={{
          marginBottom:14, borderRadius:18, overflow:'hidden',
          background:'#fff8f8', border:'2px solid #fecdd3',
          boxShadow:'0 4px 20px rgba(239,68,68,.09)',
          animation:'up .4s ease .1s both',
        }}>
          <div style={{
            background:'linear-gradient(90deg, #fee2e2, #fecdd3)',
            padding:'10px 18px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid #fecdd3',
          }}>
            <div style={{ width:30, height:30, borderRadius:9, background:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, boxShadow:'0 3px 10px rgba(239,68,68,.3)' }}>
              <Ic.Bell/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#991b1b' }}>Alerte stock médicaments</div>
              <div style={{ fontSize:11, color:'#b91c1c', marginTop:1, fontWeight:600 }}>
                {epuises.length > 0 && `${epuises.length} en rupture`}{epuises.length > 0 && faibles.length > 0 && ' · '}{faibles.length > 0 && `${faibles.length} sous seuil`} · actualisé auto
              </div>
            </div>
            <button onClick={() => onNavigate?.('stock')}
              style={{ background:'#ef4444', color:'white', border:'none', borderRadius:9, padding:'6px 16px', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(239,68,68,.25)' }}>
              Gérer →
            </button>
          </div>
          <div style={{ padding:'11px 16px', display:'flex', flexWrap:'wrap', gap:7 }}>
            {alertes.slice(0,12).map((item, i) => {
              const isEp = item.statut === 'EPUISE';
              return (
                <div key={item.id ?? i} className="tg" style={{
                  animationDelay:`${i*.04}s`,
                  display:'flex', alignItems:'center', gap:8,
                  background:'white', border:`1.5px solid ${isEp?'#fca5a5':'#fed7d7'}`,
                  borderRadius:10, padding:'5px 12px',
                  boxShadow:'0 2px 8px rgba(239,68,68,.06)',
                }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:isEp?'#ef4444':'#f87171', boxShadow:isEp?'0 0 0 3px rgba(239,68,68,.2)':'0 0 0 3px rgba(248,113,113,.18)' }}/>
                  <span style={{ fontSize:12.5, fontWeight:700, color:'#7f1d1d' }}>{item.medicament_nom ?? `#${item.id}`}</span>
                  <span style={{ fontSize:10.5, fontWeight:800, padding:'2px 8px', borderRadius:6, background:isEp?'#fef2f2':'#fff1f2', color:isEp?'#dc2626':'#e11d48', border:`1px solid ${isEp?'#fca5a5':'#fda4af'}` }}>
                    {isEp ? 'RUPTURE' : `${item.quantite} / ${item.seuil_alerte}`}
                  </span>
                </div>
              );
            })}
            {alertes.length > 12 && <span style={{ fontSize:12, color:'#94a3b8', padding:'5px 8px' }}>+{alertes.length-12} autre(s)</span>}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom:14, display:'flex', alignItems:'center', gap:10, background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:14, padding:'10px 18px', animation:'up .4s ease .1s both' }}>
          <div style={{ width:28, height:28, borderRadius:9, background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}><Ic.Check/></div>
          <span style={{ fontSize:13, fontWeight:700, color:'#14532d', flex:1 }}>Stock OK — tous les articles sont au-dessus du seuil d'alerte</span>
          <button onClick={async()=>{setSpinning(true);await fetchAlertes();setSpinning(false);}}
            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:'#16a34a', animation:spinning?'spin 1s linear infinite':'none' }}>
            <Ic.Refresh/>
          </button>
        </div>
      )}

      {/* ══ MODULES — 9 cartes colorées 5+4 ══ */}
      <div style={{ animation:'up .4s ease .16s both' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:12 }}>
          <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:17, fontWeight:900, color:'#0c4a6e', margin:0 }}>Modules</h2>
          <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{MODULES.length} disponibles</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {MODULES.map((mod, i) => (
            <button key={mod.key} className="mb"
              onClick={() => onNavigate?.(mod.key)}
              style={{
                background:'white', border:`1.5px solid ${mod.bd}`,
                borderRadius:16, padding:'16px 13px 13px',
                display:'flex', flexDirection:'column', gap:9,
                boxShadow:'0 2px 8px rgba(0,0,0,.05)',
                animation:`up .35s ease ${i*.03+0.2}s both`,
                position:'relative', overflow:'hidden',
              }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${mod.c},${mod.bd})`, borderRadius:'16px 16px 0 0' }}/>
              <div style={{ width:40, height:40, borderRadius:11, background:mod.bg, color:mod.c, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <mod.I/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', lineHeight:1.3, marginBottom:3 }}>{mod.label}</div>
                <div style={{ fontSize:10.5, color:'#94a3b8' }}>{mod.sub}</div>
              </div>
              <div className="arr" style={{ color:mod.c, alignSelf:'flex-end', display:'flex' }}><Ic.Arrow/></div>
            </button>
          ))}
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{ marginTop:16, background:'white', border:'1.5px solid #e0f2fe', borderRadius:13, padding:'10px 20px', display:'flex', alignItems:'center', gap:12, animation:'up .4s ease .44s both', boxShadow:'0 2px 8px rgba(56,189,248,.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ position:'relative', width:7, height:7 }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#4ade80', animation:'dot 2.5s ease infinite' }}/>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', position:'relative' }}/>
          </div>
          <span style={{ fontSize:11.5, fontWeight:700, color:'#15803d' }}>En ligne</span>
        </div>
        <div style={{ width:1, height:14, background:'#e2e8f0' }}/>
        <span style={{ fontSize:11, color:'#94a3b8', flex:1 }}>Stock actualisé automatiquement toutes les 60s</span>
        {alertes.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'#fff1f2', border:'1px solid #fda4af', borderRadius:99, padding:'3px 11px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#ef4444' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:'#be123c' }}>{alertes.length} alerte(s)</span>
          </div>
        )}
        <button onClick={async()=>{setSpinning(true);await Promise.all([fetchStats(),fetchAlertes()]);setSpinning(false);}}
          style={{ display:'flex', alignItems:'center', gap:5, background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:8, padding:'4px 12px', cursor:'pointer', color:'#0284c7', fontSize:11, fontWeight:700, fontFamily:'inherit' }}>
          <span style={{ display:'flex', animation:spinning?'spin 1s linear infinite':'none' }}><Ic.Refresh/></span>
          Actualiser
        </button>
      </div>
    </div>
  );
}