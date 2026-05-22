// src/components/medecinTravail/DetailFiche.jsx — REDESIGN bleu ciel style infirmier
import { useState, useEffect, createElement } from 'react';
import AptitudeBadge  from './Aptitudebadge';
import TabFiche       from './Tabfiche';
import TabBilan       from './Tabbilan';
import TabExamen      from './Tabexamen';
import TabCertificat  from './Tabcertificat';
import TabCertificatMateur from './TabCertificatMateur';
import TabOrdonnance  from './TabOrdonnance';
import TabFicheLiaison from './TabFicheLiaison';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { useAuth } from '../../context/AuthContext';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';

const SKY = { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985' };

/** Identique à la sidebar médecin (DashboardMedecinTravail BLUE_BG) */
const HEADER_SKY_BG = 'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 40%, #7dd3fc 78%, #38bdf8 100%)';

const IcFiche = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcBilan = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5a2 2 0 00-2 2v3a2 2 0 002 2h4m0-5h6m0 0v5a2 2 0 002 2h2"/>
    <circle cx="16" cy="16" r="2"/>
  </svg>
);
const IcExam = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcCert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IcMat = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg>;
const IcPos = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
const IcDat = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

const IcOrd = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="13" y2="17"/>
  </svg>
);
const IcLiaison = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="17 2 22 7 12 17 7 17 7 12 17 2"/>
  </svg>
);
const BASE_TABS = [
  { id:'fiche',      label:'Fiche',                   Icon:IcFiche },
  { id:'bilan',      label:'Bilan biologique',        Icon:IcBilan },
  { id:'examen',     label:'Examens complémentaires', Icon:IcExam  },
];

const CERTIFICAT_TAB = { id:'certificat', label:"Certificat d'aptitude", Icon:IcCert };

function getInitials(nom=''){return nom.split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2);}

export default function DetailFiche({ fiche, onFicheUpdated, initialTab, onInitialTabConsumed }) {
  const { user } = useAuth();
  const [activeTab,setActiveTab]=useState('fiche');
  const siteConfig = getSitePrintConfig(user, fiche);
  const templateBranch = resolveSiteTemplateFromSources(fiche, fiche?.site_details, user, siteConfig);
  const isMessadineTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE;
  const isMaturTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MATEUR;
  const tabs = isMessadineTemplate
    ? [
        ...BASE_TABS,
        { id: 'ordonnance', label: 'Ordonnance', Icon: IcOrd },
        { id: 'liaison', label: 'Fiche de liaison', Icon: IcLiaison },
      ]
    : (
        isMaturTemplate
          ? [
              BASE_TABS[0], // fiche
              CERTIFICAT_TAB,
            ]
          : [...BASE_TABS, CERTIFICAT_TAB]
      );

  useEffect(() => {
    if (!tabs.some((t) => t.id === activeTab)) {
      setActiveTab('fiche');
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    if (!initialTab) return;
    if (tabs.some((t) => t.id === initialTab)) {
      setActiveTab(initialTab);
      if (onInitialTabConsumed) onInitialTabConsumed();
    }
  }, [initialTab, tabs, onInitialTabConsumed]);

  if(!fiche){
    return (
      <div style={{flex:1,background:'white',borderRadius:16,border:`1.5px solid ${SKY[100]}`,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14}}>
        <div style={{width:70,height:70,borderRadius:20,background:SKY[50],border:`2px solid ${SKY[100]}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={SKY[300]} strokeWidth="1.5" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:15,fontWeight:800,color:SKY[800]}}>Sélectionnez une fiche</div>
          <div style={{fontSize:13,color:'#94a3b8',marginTop:4}}>Cliquez sur une fiche dans la liste</div>
        </div>
      </div>
    );
  }

  const nom=fiche.collaborateur_nom||`Collaborateur #${fiche.collaborateur}`;
  const initials=getInitials(nom);

  return (
    <div style={{flex:1,background:'white',borderRadius:16,border:`1.5px solid ${SKY[100]}`,boxShadow:`0 4px 16px ${SKY[100]}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Header — même dégradé bleu ciel que la sidebar */}
      <div style={{flexShrink:0}}>
        <div style={{
          background: HEADER_SKY_BG,
          padding: '18px 22px 14px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(125, 211, 252, 0.85)',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.28)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.14)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 13, flexShrink: 0,
              background: 'rgba(255,255,255,.72)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255,255,255,.95)',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: SKY[800], fontSize: 15, fontWeight: 800,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0c4a6e', letterSpacing: '-.3px' }}>{nom}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><IcMat/>{fiche.collaborateur_matricule||'—'}</span>
                <span style={{ fontSize: 11.5, color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><IcPos/>{fiche.collaborateur_poste||'—'}</span>
                <span style={{ fontSize: 11.5, color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><IcDat/>{fiche.date_visite?new Date(fiche.date_visite).toLocaleDateString('fr-FR'):'—'}</span>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <AptitudeBadge aptitude={fiche.aptitude} size="md"/>
            </div>
          </div>
        </div>

        {/* Tabs — style infirmier avec bottom border */}
        <div style={{display:'flex',borderBottom:`2px solid ${SKY[100]}`,background:'white',padding:'0 6px'}}>
          {tabs.map(({id,label,Icon})=>{
            const active=activeTab===id;
            return (
              <button key={id} onClick={()=>setActiveTab(id)}
                style={{
                  display:'flex',alignItems:'center',gap:6,
                  padding:'11px 16px',
                  border:'none',borderBottom:`3px solid ${active?SKY[500]:'transparent'}`,
                  marginBottom:-2,
                  borderRadius:0,
                  cursor:'pointer',fontFamily:'inherit',
                  fontSize:12.5,fontWeight:active?800:500,
                  background:'transparent',
                  color:active?SKY[700]:'#94a3b8',
                  transition:'all .13s',
                }}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.color=SKY[600];}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.color='#94a3b8';}}>
                <span style={{opacity:active?1:0.6}}>{createElement(Icon)}</span>
                {label}
                {id==='certificat'&&fiche?.certificat?.id&&(
                  <span style={{marginLeft:3,background:'#059669',color:'white',fontSize:9,fontWeight:800,padding:'1px 5px',borderRadius:20}}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        {activeTab==='fiche'      && <TabFiche      fiche={fiche} onFicheUpdated={onFicheUpdated}/>}
        {activeTab==='bilan'      && <TabBilan      fiche={fiche}/>}
        {activeTab==='examen'     && <TabExamen     fiche={fiche} onFicheUpdated={onFicheUpdated}/>}
        {activeTab==='certificat' && (
          isMaturTemplate
            ? <TabCertificatMateur fiche={fiche} onFicheUpdated={onFicheUpdated} />
            : <TabCertificat fiche={fiche} onFicheUpdated={onFicheUpdated}/>
        )}
        {activeTab==='ordonnance' && <TabOrdonnance fiche={fiche} onFicheUpdated={onFicheUpdated}/>}
        {activeTab==='liaison'    && <TabFicheLiaison fiche={fiche} onFicheUpdated={onFicheUpdated}/>}
      </div>
    </div>
  );
}