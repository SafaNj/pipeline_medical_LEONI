// src/components/medecinTravail/TableauBord.jsx — REDESIGN identique style infirmier
import { useState, useEffect } from 'react';
import { getFichesAptitude } from '../../api/Medicalworkapi';
import { getListesVisitesPeriodiquesPourMedecin } from '../../api/visitesPeriodiquesApi';
import { getDateVisitePourFiltreJour, isDateVisiteToday, isFicheMedecinFichesDuJour } from '../../utils/dateVisite';

const DoctorIllustration = () => (
  <svg width="150" height="185" viewBox="0 0 150 185" fill="none">
    <rect x="45" y="108" width="60" height="58" rx="14" fill="white" stroke="#bae6fd" strokeWidth="1.5"/>
    <rect x="68" y="108" width="14" height="30" rx="4" fill="#0284c7" opacity="0.15"/>
    <rect x="52" y="120" width="18" height="13" rx="3" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1"/>
    <rect x="59" y="124" width="4" height="2" rx="1" fill="#0284c7"/>
    <rect x="60" y="123" width="2" height="4" rx="1" fill="#0284c7"/>
    <rect x="67" y="96" width="16" height="16" rx="8" fill="#fcd9b6"/>
    <ellipse cx="75" cy="82" rx="21" ry="22" fill="#fcd9b6"/>
    <ellipse cx="75" cy="67" rx="21" ry="11" fill="#334155"/>
    <ellipse cx="55" cy="78" rx="6" ry="11" fill="#334155"/>
    <ellipse cx="95" cy="78" rx="6" ry="11" fill="#334155"/>
    <ellipse cx="68" cy="83" rx="2.5" ry="3" fill="white"/>
    <ellipse cx="82" cy="83" rx="2.5" ry="3" fill="white"/>
    <circle cx="68.5" cy="83.5" r="1.8" fill="#1e293b"/>
    <circle cx="82.5" cy="83.5" r="1.8" fill="#1e293b"/>
    <circle cx="69" cy="83" r="0.7" fill="white"/>
    <circle cx="83" cy="83" r="0.7" fill="white"/>
    <path d="M65 78 Q68 76 71 78" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M79 78 Q82 76 85 78" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M70 91 Q75 95 80 91" stroke="#e8825a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <ellipse cx="63" cy="88" rx="4.5" ry="2.5" fill="#fda4af" opacity="0.5"/>
    <ellipse cx="87" cy="88" rx="4.5" ry="2.5" fill="#fda4af" opacity="0.5"/>
    <circle cx="68" cy="83" r="5" fill="none" stroke="#475569" strokeWidth="1.5"/>
    <circle cx="82" cy="83" r="5" fill="none" stroke="#475569" strokeWidth="1.5"/>
    <path d="M73 83 L77 83" stroke="#475569" strokeWidth="1.5"/>
    <path d="M63 83 L61 81" stroke="#475569" strokeWidth="1.5"/>
    <path d="M87 83 L89 81" stroke="#475569" strokeWidth="1.5"/>
    <path d="M45 122 Q29 134 26 148" stroke="white" strokeWidth="13" strokeLinecap="round"/>
    <path d="M45 122 Q29 134 26 148" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <ellipse cx="24" cy="151" rx="7" ry="5.5" fill="#fcd9b6"/>
    <path d="M32 147 Q44 136 44 124" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="32" cy="149" r="4.5" fill="none" stroke="#475569" strokeWidth="2"/>
    <circle cx="32" cy="149" r="2" fill="#0284c7"/>
    <path d="M105 122 Q121 134 124 148" stroke="white" strokeWidth="13" strokeLinecap="round"/>
    <path d="M105 122 Q121 134 124 148" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <rect x="118" y="140" width="22" height="30" rx="3" fill="white" stroke="#93c5fd" strokeWidth="1.5"/>
    <rect x="124" y="138" width="10" height="5" rx="2" fill="#93c5fd"/>
    <line x1="121" y1="150" x2="137" y2="150" stroke="#bae6fd" strokeWidth="1.5"/>
    <line x1="121" y1="156" x2="137" y2="156" stroke="#bae6fd" strokeWidth="1.5"/>
    <line x1="121" y1="162" x2="134" y2="162" stroke="#bae6fd" strokeWidth="1.5"/>
    <rect x="57" y="158" width="14" height="26" rx="7" fill="#0284c7"/>
    <rect x="79" y="158" width="14" height="26" rx="7" fill="#0284c7"/>
    <ellipse cx="64" cy="185" rx="10" ry="4.5" fill="#1e293b"/>
    <ellipse cx="86" cy="185" rx="10" ry="4.5" fill="#1e293b"/>
  </svg>
);

const IcClip   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>;
const IcCheck  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcWarn   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcFolder = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>;
const IcPlus   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcUsers  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const IcCal    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcBell   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IcArrow  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;

const isThisWeek = d => { if(!d)return false; const t=new Date(d),n=new Date(); const s=new Date(n); s.setDate(n.getDate()-n.getDay()+1); s.setHours(0,0,0,0); return t>=s; };
const isThisMonth = d => { if(!d)return false; const t=new Date(d),n=new Date(); return t.getFullYear()===n.getFullYear()&&t.getMonth()===n.getMonth(); };

const MODULES = [
  { key:'nouvelle',   label:'Nouvelle fiche',      sub:'Créer une visite médicale', I:IcPlus,   c:'#0284c7', bg:'#e0f2fe', bd:'#bae6fd' },
  { key:'fiches',     label:'Fiches du jour',      sub:'Consultations d\'aujourd\'hui', I:IcClip, c:'#0369a1', bg:'#dbeafe', bd:'#93c5fd' },
  { key:'embauche',   label:'Visites d\'embauche', sub:'Listes assignées',          I:IcUsers,  c:'#0891b2', bg:'#cffafe', bd:'#a5f3fc' },
  { key:'visites-periodiques', label:'Visites périodiques', sub:'Listes du jour (hors embauche)', I:IcCal, c:'#d97706', bg:'#fffbeb', bd:'#fde68a' },
  { key:'dossier',    label:'Dossiers médicaux',   sub:'Rechercher & compléter',    I:IcFolder, c:'#7c3aed', bg:'#ede9fe', bd:'#c4b5fd' },
  { key:'historique', label:'Historique patients', sub:'Toutes les fiches',         I:IcSearch, c:'#059669', bg:'#d1fae5', bd:'#6ee7b7' },
];
const STATS_CFG = [
  { key:'today',  label:'Fiches aujourd\'hui', I:IcClip,   c:'#0284c7', bg:'#e0f2fe', bd:'#bae6fd' },
  { key:'aptes',  label:'Aptes au poste',      I:IcCheck,  c:'#059669', bg:'#d1fae5', bd:'#6ee7b7' },
  { key:'inaptes',label:'Inaptes',             I:IcWarn,   c:'#dc2626', bg:'#fee2e2', bd:'#fca5a5' },
  { key:'dos',    label:'Dossiers médicaux',   I:IcFolder, c:'#7c3aed', bg:'#ede9fe', bd:'#c4b5fd' },
];

export default function TableauBord({ user, onNaviguer }) {
  const [fiches,setFiches]=useState([]);
  const [dossiers,setDossiers]=useState([]);
  const [vpAuj,setVpAuj]=useState(0);
  const [loading,setLoading]=useState(true);
  const [ready,setReady]=useState(false);
  const [time,setTime]=useState(new Date());

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{const t=setTimeout(()=>setReady(true),60);return()=>clearTimeout(t);},[]);
  useEffect(()=>{
    if (!user?.site_id) {
      setFiches([]);
      setDossiers([]);
      setVpAuj(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const filters={site_id:user?.site_id,medecin_user_id:user?.user_id};
    // NOTE: dossiers endpoint can return 500 for some sites; keep dashboard resilient by
    // skipping this call here and loading dossier data only from dedicated dossier screens.
    setDossiers([]);
    Promise.allSettled([getFichesAptitude(filters),getListesVisitesPeriodiquesPourMedecin()]).then(([r1,r2])=>{
      if(r1.status==='fulfilled'){
        const raw=Array.isArray(r1.value)?r1.value:(r1.value?.results||[]);
        setFiches(raw);
      }
      if(r2.status==='fulfilled'){
        const listes=Array.isArray(r2.value)?r2.value:(r2.value?.results||[]);
        const t=new Date().toISOString().split('T')[0];
        setVpAuj(listes.filter(l=>l.date_visite===t).length);
      }
      setLoading(false);
    });
  },[user?.site_id, user?.user_id]);

  const fTodayAll = fiches.filter((f) => isDateVisiteToday(getDateVisitePourFiltreJour(f)));
  const fAuj = fTodayAll.filter((f) => isFicheMedecinFichesDuJour(f));
  const fSem=fiches.filter(f=>isThisWeek(f.date_visite));
  const fMois=fiches.filter(f=>isThisMonth(f.date_visite));
  const aptes=fAuj.filter(f=>f.aptitude==='APTE_AU_POSTE').length;
  const inaptes=fAuj.filter(f=>f.aptitude?.startsWith('INAPTE')).length;
  const embMois=fMois.filter(f=>f.type_visite==='EMBAUCHE').length;
  const embAuj=fTodayAll.filter(f=>f.type_visite==='EMBAUCHE').length;
  const dosInc=dossiers.filter(d=>!d.groupe_sanguin).length;
  const sv={today:fAuj.length,aptes,inaptes,dos:dossiers.length};

  const p=n=>String(n).padStart(2,'0');
  const hh=p(time.getHours()),mm=p(time.getMinutes()),ss=p(time.getSeconds());
  const dl=time.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const dateLabel=dl.charAt(0).toUpperCase()+dl.slice(1);
  const userName=user?.first_name?`Dr. ${user.first_name} ${user.last_name||''}`:`Dr. ${user?.username||'Médecin'}`;

  const notifs=[
    vpAuj>0&&{key:'vp',col:'#d97706',bg:'#fffbeb',bd:'#fde68a',icon:<IcCal/>,title:`${vpAuj} liste${vpAuj>1?'s':''} de visites périodiques aujourd'hui`,desc:'Collaborateurs à examiner (hors embauche)',nav:'visites-periodiques'},
    embAuj>0&&{key:'emb',col:'#0284c7',bg:'#e0f2fe',bd:'#bae6fd',icon:<IcUsers/>,title:`${embAuj} liste${embAuj>1?'s':''} d'embauche aujourd'hui`,desc:'Des candidats attendent leur examen médical',nav:'embauche'},
    dosInc>0&&{key:'dos',col:'#d97706',bg:'#fef3c7',bd:'#fde68a',icon:<IcWarn/>,title:`${dosInc} dossier${dosInc>1?'s':''} incomplet${dosInc>1?'s':''}`,desc:'Groupe sanguin manquant — à compléter',nav:'dossier'},
    fAuj.length===0&&{key:'nof',col:'#64748b',bg:'#f1f5f9',bd:'#e2e8f0',icon:<IcCal/>,title:'Aucune visite aujourd\'hui',desc:'Créez une nouvelle fiche pour commencer',nav:'nouvelle'},
  ].filter(Boolean);

  if(!ready)return null;

  return (
    <div style={{flex:1,minHeight:0,overflowY:'auto',paddingBottom:32,fontFamily:"'Nunito','Segoe UI',sans-serif",opacity:ready?1:0,transform:ready?'none':'translateY(8px)',transition:'opacity .32s ease,transform .32s ease',background:'#f8fbff'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap');
        @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dot{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.9);opacity:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes skel{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .sk{background:linear-gradient(90deg,#dbeafe 25%,#bae6fd 50%,#dbeafe 75%);background-size:300% 100%;animation:skel 1.5s ease infinite;border-radius:8px;}
        .sc{transition:transform .16s,box-shadow .16s;}
        .sc:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,0,0,.1)!important;}
        .mb{transition:all .17s;cursor:pointer;text-align:left;}
        .mb:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(0,0,0,.1)!important;}
        .mb:hover .arr{opacity:1!important;transform:translateX(3px)!important;}
        .arr{opacity:0;transition:all .17s;}
        .doc-float{animation:float 4s ease-in-out infinite;}
        .notif-card{transition:all .15s;cursor:pointer;}
        .notif-card:hover{transform:translateX(4px);}
      `}</style>

      {/* HERO */}
      <div style={{background:'linear-gradient(125deg,#e0f2fe 0%,#bae6fd 40%,#e0f9ff 70%,#f0f9ff 100%)',borderRadius:24,marginBottom:16,display:'grid',gridTemplateColumns:'1fr auto',position:'relative',overflow:'hidden',boxShadow:'0 6px 32px rgba(56,189,248,.15)',animation:'up .45s ease both',border:'1.5px solid rgba(186,230,253,.8)'}}>
        <div style={{position:'absolute',right:180,top:-60,width:220,height:220,borderRadius:'50%',background:'rgba(255,255,255,.5)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',left:-40,bottom:-40,width:160,height:160,borderRadius:'50%',background:'rgba(186,230,253,.4)',pointerEvents:'none'}}/>
        <div style={{padding:'32px 36px',position:'relative'}}>
          <h1 style={{fontFamily:"'Nunito',sans-serif",fontSize:36,fontWeight:900,color:'#0c4a6e',lineHeight:1.05,letterSpacing:'-1px',marginBottom:8}}>
            Espace<br/><span style={{color:'#0284c7'}}>Médecin du Travail</span>
          </h1>
          <p style={{fontSize:13,color:'#0369a1',fontWeight:600,marginBottom:18,lineHeight:1.5}}>{userName} · Tableau de bord · Service Médical</p>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <div style={{background:'white',borderRadius:99,padding:'6px 16px',border:'1.5px solid #bae6fd',boxShadow:'0 2px 8px rgba(2,132,199,.1)'}}>
              <span style={{fontSize:12,fontWeight:700,color:'#0369a1'}}>{dateLabel}</span>
            </div>
            <div style={{background:'#0284c7',borderRadius:99,padding:'6px 16px',boxShadow:'0 2px 8px rgba(2,132,199,.25)'}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'white',letterSpacing:'1px'}}>{hh}:{mm}:{ss}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{position:'relative',width:8,height:8}}>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#22c55e',animation:'dot 2s ease infinite'}}/>
                <div style={{width:8,height:8,borderRadius:'50%',background:'#16a34a',position:'relative'}}/>
              </div>
              <span style={{fontSize:11.5,fontWeight:700,color:'#15803d'}}>Actif</span>
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:18}}>
            {[{val:fAuj.length,label:"Visites auj."},{val:fSem.length,label:"Cette semaine"},{val:embMois,label:"Embauches/mois"}].map((s,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,.7)',border:'1.5px solid rgba(186,230,253,.9)',borderRadius:12,padding:'8px 14px',textAlign:'center',backdropFilter:'blur(4px)'}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:'#0369a1',lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:10.5,color:'#0369a1',fontWeight:600,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',paddingRight:20,position:'relative'}}>
          <div style={{position:'absolute',bottom:0,right:10,width:170,height:170,borderRadius:'50%',background:'rgba(186,230,253,.5)',zIndex:0}}/>
          <div className="doc-float" style={{position:'relative',zIndex:1}}><DoctorIllustration/></div>
        </div>
      </div>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16,animation:'up .45s ease .08s both'}}>
        {STATS_CFG.map(c=>(
          <div key={c.key} className="sc" style={{background:'white',borderRadius:16,padding:'18px 16px',border:`1.5px solid ${c.bd}`,boxShadow:'0 2px 10px rgba(0,0,0,.05)',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={{width:38,height:38,borderRadius:11,background:c.bg,color:c.c,display:'flex',alignItems:'center',justifyContent:'center'}}><c.I/></div>
              <div style={{width:6,height:6,borderRadius:'50%',background:c.c,opacity:.3}}/>
            </div>
            {loading?<div className="sk" style={{height:40,width:50,marginBottom:6}}/>
              :<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:42,fontWeight:700,color:c.c,lineHeight:1,letterSpacing:'-2px',marginBottom:4}}>{sv[c.key]??0}</div>}
            <div style={{fontSize:11.5,fontWeight:600,color:'#64748b'}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* NOTIFICATIONS */}
      {notifs.length>0&&(
        <div style={{marginBottom:16,animation:'up .4s ease .12s both'}}>
          <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:10}}>
            <h2 style={{fontFamily:"'Nunito',sans-serif",fontSize:15,fontWeight:900,color:'#0c4a6e',margin:0,display:'flex',alignItems:'center',gap:7}}><IcBell/> Notifications du jour</h2>
            <span style={{background:'#0284c7',color:'white',fontSize:10,fontWeight:800,padding:'1px 8px',borderRadius:20}}>{notifs.length}</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {notifs.map(n=>(
              <div key={n.key} className="notif-card" onClick={()=>onNaviguer?.(n.nav)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:n.bg,border:`1.5px solid ${n.bd}`,borderRadius:14,boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'white',border:`1.5px solid ${n.bd}`,display:'flex',alignItems:'center',justifyContent:'center',color:n.col,flexShrink:0}}>{n.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,color:'#0c4a6e'}}>{n.title}</div>
                  <div style={{fontSize:11.5,color:'#475569',marginTop:2,fontWeight:600}}>{n.desc}</div>
                </div>
                <div style={{color:n.col}}><IcArrow/></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULES */}
      <div style={{animation:'up .4s ease .16s both'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:12}}>
          <h2 style={{fontFamily:"'Nunito',sans-serif",fontSize:17,fontWeight:900,color:'#0c4a6e',margin:0}}>Accès rapides</h2>
          <span style={{fontSize:12,color:'#94a3b8',fontWeight:500}}>{MODULES.length} modules disponibles</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {MODULES.map((mod,i)=>(
            <button key={mod.key} className="mb" onClick={()=>onNaviguer?.(mod.key)}
              style={{background:'white',border:`1.5px solid ${mod.bd}`,borderRadius:16,padding:'16px 13px 13px',display:'flex',flexDirection:'column',gap:9,boxShadow:'0 2px 8px rgba(0,0,0,.05)',animation:`up .35s ease ${i*.03+0.2}s both`,position:'relative',overflow:'hidden',fontFamily:'inherit'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${mod.c},${mod.bd})`,borderRadius:'16px 16px 0 0'}}/>
              <div style={{width:40,height:40,borderRadius:11,background:mod.bg,color:mod.c,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><mod.I/></div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:'#0f172a',lineHeight:1.3,marginBottom:3}}>{mod.label}</div>
                <div style={{fontSize:10.5,color:'#94a3b8'}}>{mod.sub}</div>
              </div>
              <div className="arr" style={{color:mod.c,alignSelf:'flex-end',display:'flex'}}><IcArrow/></div>
            </button>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{marginTop:16,background:'white',border:'1.5px solid #e0f2fe',borderRadius:13,padding:'10px 20px',display:'flex',alignItems:'center',gap:12,animation:'up .4s ease .44s both',boxShadow:'0 2px 8px rgba(56,189,248,.05)'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{position:'relative',width:7,height:7}}>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#4ade80',animation:'dot 2.5s ease infinite'}}/>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',position:'relative'}}/>
          </div>
          <span style={{fontSize:11.5,fontWeight:700,color:'#15803d'}}>En ligne</span>
        </div>
        <div style={{width:1,height:14,background:'#e2e8f0'}}/>
        <span style={{fontSize:11,color:'#94a3b8',flex:1,fontWeight:500}}>Médecine du travail · Service médical</span>
      </div>
    </div>
  );
}