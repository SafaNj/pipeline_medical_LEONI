// src/pages/DashboardMedecinControleur.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';
import {
  FormulaireDemandeExpertise,
  DemandesExpertiseView,
  PopupExpertiseDirect,
} from '../components/medecinControleur/Demandeexpertise';
import { getMesListesContreVisite, getContreVisites, getListes as getListesContreVisites } from '../api/Contrevisiteapi';
import SuiviContreVisitesView from '../components/medecinControleur/SuiviView';
import { FormulaireView, FileAttenteControleur, PanneauVide } from '../components/medecinControleur/ListeDuJour';
import Formulairecontrevisite from '../components/medecinControleur/Formulairecontrevisite';
import HistoriquePatient from '../components/medecinControleur/HistoriquePatient';
import DocumentsMedicauxScannesPage from '../components/documents/DocumentsMedicauxScannesPage';
import MaladiesChroniques from '../components/infirmier/MaladiesChroniques';
import { getUserSiteName } from '../utils/siteAccessControl';


const pickAssignedMedecinId = (liste) => {
  if (!liste || typeof liste !== 'object') return null;
  const candidates = [
    liste.medecin_controleur_id,
    liste.medecin_controleur,
    liste.medecin_controleur?.id,
    liste.medecin_controleur?.user_id,
    liste.medecin_controleur?.user?.id,
    liste.medecin_id,
    liste.medecin?.id,
    liste.medecin?.user_id,
    liste.medecin?.user?.id,
    liste.medecinControleurId,
    liste.medecinControleur?.id,
    liste.medecinControleur?.user_id,
    liste.medecinControleur?.user?.id,
  ].filter((v) => v !== null && v !== undefined && String(v).trim() !== '');

  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const nameLooselyMatches = (a, b) => {
  const A = normalizeName(a);
  const B = normalizeName(b);
  if (!A || !B) return false;
  if (A === B) return true;
  // allow substring match (e.g., "adam znayti" vs "adam.znayti")
  if (A.includes(B) || B.includes(A)) return true;

  // token match: require at least 2 meaningful tokens in common
  const tokens = (s) =>
    s
      .replace(/[._\-]+/g, ' ')
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);

  const ta = new Set(tokens(A));
  const tb = new Set(tokens(B));
  let common = 0;
  ta.forEach((t) => {
    if (tb.has(t)) common += 1;
  });
  return common >= 2 || (common >= 1 && (ta.size <= 1 || tb.size <= 1));
};

const normalizeCvItemStatut = (item) => {
  if (!item || typeof item !== 'object') return item;

  // Backend variants:
  // - Some APIs return `statut` directly: EN_ATTENTE / EFFECTUEE
  // - Listes-contre-visites lines usually expose `presence` + `verdict_saisi`
  const rawStatut = item.statut;
  if (rawStatut) return item;

  // Prefer explicit "treated" signals
  const cv = item.contre_visite || item.contreVisite;
  const hasControleMedical =
    Boolean(item.controle_medical) ||
    Boolean(item.controleMedical) ||
    Boolean(cv?.controle_medical) ||
    Boolean(cv?.controleMedical) ||
    Boolean(cv?.controle_medical_id) ||
    Boolean(cv?.controleMedicalId);
  const isDone = Boolean(item.verdict_saisi) || hasControleMedical;
  if (isDone) return { ...item, statut: 'EFFECTUEE' };

  // Fall back to presence (still considered "to do" unless explicitly done)
  if (item.presence) return { ...item, statut: 'EN_ATTENTE' };

  return { ...item, statut: 'EN_ATTENTE' };
};

const normalizeListe = (liste) => {
  if (!liste || typeof liste !== 'object') return liste;
  const items = Array.isArray(liste.items)
    ? liste.items
    : Array.isArray(liste.lignes)
      ? liste.lignes
      : Array.isArray(liste.collaborateurs)
        ? liste.collaborateurs
        : [];

  return {
    ...liste,
    items: items.map(normalizeCvItemStatut),
    nombre_collaborateurs: liste.nombre_collaborateurs ?? items.length,
  };
};

const isPresenceEligibleForControleur = (presence) => {
  // Infirmier sets presence: EN_ATTENTE / PRESENT / ABSENT / REPORTE
  // Médecin contrôleur must only treat "PRESENT".
  // If presence is missing (older APIs), keep the item visible.
  if (presence === null || presence === undefined || String(presence).trim() === '') return true;
  return String(presence).toUpperCase() === 'PRESENT';
};

const normalizeListesResponse = (data) => {
  const listArray = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : data
        ? [data]
        : [];
  return listArray.map(normalizeListe);
};

/* ─── SVG Icons ── */
const IcoHome = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoListe = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/><line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
);
const IcoSuivi = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoExpertise = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 12l2 2 4-4"/>
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
  </svg>
);
const IcoLogout = ({ color = '#ffffff' }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoHistorique = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <path d="M16 3.13a4 4 0 010 7.75" opacity=".5"/>
  </svg>
);
const IcoScans = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IcoMedecin = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="3" width="6" height="4" rx="1.5" fill="white"/>
    <rect x="5" y="7" width="14" height="4" rx="1.5" fill="white"/>
    <path d="M8 15 Q8 20 12 20 Q16 20 16 15" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <circle cx="12" cy="20" r="1.5" fill="white"/>
    <circle cx="7" cy="15" r="1.2" fill="white"/>
    <circle cx="17" cy="15" r="1.2" fill="white"/>
  </svg>
);

/* ─── Accueil component ── */
function AccueilControleur({ totalPatients, enAttente, traites, medecinNom, onNavigate }) {
  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const StatCard = ({ label, value, color, bg, border, icon }) => (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 13, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${color}55` }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0c4a6e', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );

  const ActionCard = ({ title, desc, icon, onClick, color }) => (
    <button onClick={onClick} style={{ background: 'white', border: '1.5px solid #e0f2fe', borderRadius: 16, padding: '20px', textAlign: 'left', cursor: 'pointer', transition: 'all .18s', display: 'flex', alignItems: 'flex-start', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(2,132,199,.12)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0f2fe'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'; }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0c4a6e', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </button>
  );

  return (
    <div style={{ animation: 'pageFade .25s ease' }}>
      {/* Hero section */}
      <div style={{ background: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 50%, #0ea5e9 100%)', borderRadius: 20, padding: '32px 36px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 32px rgba(14,165,233,.2)' }}>
        <div style={{ position:'absolute', top:-40, right:180, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.07)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-30, right:80, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }}/>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', fontWeight:600, textTransform: 'capitalize', marginBottom: 8 }}>{today}</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0c4a6e', marginBottom: 8, letterSpacing: -0.5 }}>
            Bonjour, Dr. {medecinNom || 'Médecin Contrôleur'}
          </h2>
          <p style={{ fontSize: 14, color: '#0369a1', lineHeight: 1.6, maxWidth: 400 }}>
            Bienvenue dans votre espace de contrôle médical.<br/>
            Gérez vos contre-visites, suivis et expertises médicales.
          </p>
        </div>
        {/* Illustration médicale SVG */}
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}>
          <circle cx="70" cy="70" r="60" fill="rgba(255,255,255,.25)" stroke="rgba(255,255,255,.5)" strokeWidth="1"/>
          <path d="M45 40 L45 72 Q45 90 62 90 Q79 90 79 72 L79 65" stroke="rgba(2,132,199,.9)" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <circle cx="79" cy="58" r="10" fill="none" stroke="rgba(2,132,199,.9)" strokeWidth="5"/>
          <circle cx="79" cy="58" r="4" fill="rgba(2,132,199,.9)"/>
          <circle cx="36" cy="40" r="6" fill="none" stroke="rgba(3,105,161,.7)" strokeWidth="3"/>
          <circle cx="54" cy="40" r="6" fill="none" stroke="rgba(3,105,161,.7)" strokeWidth="3"/>
          <rect x="90" y="85" width="24" height="8" rx="3" fill="rgba(255,255,255,.5)"/>
          <rect x="97" y="78" width="8" height="24" rx="3" fill="rgba(255,255,255,.5)"/>
          <rect x="28" y="95" width="32" height="28" rx="4" fill="rgba(255,255,255,.35)" stroke="rgba(255,255,255,.6)" strokeWidth="1.5"/>
          <rect x="34" y="91" width="20" height="7" rx="3" fill="rgba(255,255,255,.4)"/>
          <line x1="32" y1="108" x2="56" y2="108" stroke="rgba(2,132,199,.5)" strokeWidth="2"/>
          <line x1="32" y1="114" x2="52" y2="114" stroke="rgba(2,132,199,.5)" strokeWidth="2"/>
        </svg>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Patients aujourd'hui" value={totalPatients} color="#0284c7" bg="#f0f9ff" border="#bae6fd"
          icon={<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
        />
        <StatCard label="En attente" value={enAttente} color="#f59e0b" bg="#fffbeb" border="#fde68a"
          icon={<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard label="Traités" value={traites} color="#0d9488" bg="#f0fdfa" border="#99f6e4"
          icon={<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
        />
      </div>

      {/* Actions rapides */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', letterSpacing: 1.6, textTransform: 'uppercase', opacity: .65, marginBottom: 14 }}>
          Accès rapide
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <ActionCard
            title="Liste du jour"
            desc="Gérer les contre-visites du jour en cours"
            color="#0284c7"
            onClick={() => onNavigate('liste')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>}
          />
          <ActionCard
            title="Suivi contre-visites"
            desc="Consulter l'historique et les documents"
            color="#0369a1"
            onClick={() => onNavigate('suivi')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <ActionCard
            title="Demandes d'expertise"
            desc="Créer et consulter les expertises médicales"
            color="#0891b2"
            onClick={() => onNavigate('expertise')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>}
          />
          <ActionCard
            title="Historique patient"
            desc="Consulter le dossier complet par matricule"
            color="#7c3aed"
            onClick={() => onNavigate('historique')}
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ── */
function Sidebar({ vue, onSetVue, user, onLogout, medecinNom, siteName }) {
  const NavBtn = ({ navKey, label, Icon }) => {
    const active = vue === navKey;
    return (
      <button onClick={() => onSetVue(navKey)}
        style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', borderRadius:11, background: active ? '#0284c7' : 'transparent', color: active ? '#ffffff' : '#0c4a6e', fontSize:12.5, fontWeight: active ? 700 : 600, border:'none', boxShadow: active ? '0 3px 10px rgba(2,132,199,.3)' : 'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all .16s', letterSpacing:-.1 }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(2,132,199,.1)'; e.currentTarget.style.color='#0284c7'; }}}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#0c4a6e'; }}}>
        <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, background: active ? 'rgba(255,255,255,.2)' : 'rgba(2,132,199,.08)', display:'flex', alignItems:'center', justifyContent:'center', color: active ? 'white' : '#0284c7', transition:'all .16s' }}>
          <Icon />
        </div>
        <span style={{ flex:1 }}>{label}</span>
        {active && <div style={{ width:6, height:6, borderRadius:99, background:'rgba(255,255,255,.65)', flexShrink:0 }} />}
      </button>
    );
  };

  const SectionLabel = ({ label }) => (
    <div style={{ fontSize:9, fontWeight:800, color:'#0369a1', letterSpacing:1.6, textTransform:'uppercase', opacity:.65, padding:'10px 10px 4px' }}>
      {label}
    </div>
  );

  return (
    <aside style={{ width:256, minWidth:256, background:'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 40%, #7dd3fc 78%, #38bdf8 100%)', display:'flex', flexDirection:'column', height:'100vh', borderRight:'1px solid #7dd3fc', boxShadow:'4px 0 20px rgba(14,165,233,.13)', position:'relative', zIndex:10, overflow:'hidden' }}>
      {/* Cercles décoratifs */}
      <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.16)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:30, left:-50, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.1)', pointerEvents:'none' }} />

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 18px 14px', borderBottom:'1px solid rgba(2,132,199,.18)', position:'relative', flexShrink:0 }}>
        <div style={{ width:44, height:44, borderRadius:13, flexShrink:0, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(14,165,233,.4)' }}>
          <IcoMedecin />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:800, color:'#0c4a6e', letterSpacing:-.3, lineHeight:1.2 }}>Service Médical</div>
          <div style={{ fontSize:10.5, color:'#0284c7', fontWeight:600, letterSpacing:.3, marginTop:2 }}>{siteName || 'Non assigné'}</div>
        </div>
        <div style={{ flexShrink:0 }}>
          <img src="https://i.imgur.com/P8t9SW7.png" alt="LEONI" style={{ height:22, width:'auto', objectFit:'contain', filter:'drop-shadow(0 1px 2px rgba(0,0,0,.15))' }}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}/>
          <span style={{ display:'none', fontSize:13, fontWeight:900, color:'#0c4a6e', letterSpacing:'1px', fontFamily:'Arial Black, sans-serif' }}>LEONI</span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex:1, overflowY:'auto', padding:'6px 10px 6px' }}>
        <div style={{ marginBottom:6 }}>
          <NavBtn navKey="accueil" label="Accueil" Icon={IcoHome} />
        </div>
        <SectionLabel label="Contre-visites" />
        <div style={{ display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
          <NavBtn navKey="liste"     label="Ma liste du jour"      Icon={IcoListe}    />
          <NavBtn navKey="suivi"     label="Suivi contre-visites"  Icon={IcoSuivi}    />
        </div>
        <SectionLabel label="Documents" />
        <div style={{ display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
          <NavBtn navKey="expertise" label="Demandes d'expertise"  Icon={IcoExpertise} />
          <NavBtn navKey="documents-scans" label="Archives / scans" Icon={IcoScans} />
        </div>
        <SectionLabel label="Dossiers" />
        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
          <NavBtn navKey="historique" label="Historique patient" Icon={IcoHistorique} />
        </div>
      </div>

      {/* Carte utilisateur */}
      <div style={{ margin:'0 10px 14px', background:'rgba(255,255,255,.55)', backdropFilter:'blur(10px)', border:'1px solid rgba(2,132,199,.22)', borderRadius:14, padding:'11px 12px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#0ea5e9,#0369a1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:15, fontWeight:800, boxShadow:'0 2px 8px rgba(14,165,233,.28)' }}>
          {(medecinNom || user?.username || 'M')[0].toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0c4a6e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            Dr. {medecinNom || user?.username}
          </div>
          <div style={{ fontSize:11, color:'#0284c7', fontWeight:600, marginTop:1 }}>Médecin Contrôleur</div>
        </div>
        <LogoutButton onClick={onLogout} />
      </div>
    </aside>
  );
}

const PAGE_TITLES = {
  accueil:    'Tableau de bord',
  liste:      'Contre-visites du jour',
  suivi:      'Suivi Contre-Visites',
  expertise:  "Demandes d'Expertise",
  historique: 'Historique Patient',
  'documents-scans': 'Archives / scans (documents)',
  'maladies-chroniques': 'Maladies chroniques',
};

/* ─── Dashboard principal ── */
export default function DashboardMedecinControleur() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const siteName = getUserSiteName();

  const [vue,              setVue]              = useState('accueil');
  const [showExpertise,    setShowExpertise]    = useState(false);
  const [popupExpertiseCv, setPopupExpertiseCv] = useState(null);
  const [listes,           setListes]           = useState([]);
  const [refreshMsg, setRefreshMsg] = useState('');
  const [itemSel,          setItemSel]          = useState(null);
  const [showForm,         setShowForm]         = useState(false);
  const [loadListes,       setLoadListes]       = useState(true);
  const [globalError,      setGlobalError]      = useState('');
  const [suivi,            setSuivi]            = useState([]);
  const [loadSuivi,        setLoadSuivi]        = useState(false);
  const lastListesCountRef = useRef(0);

  const medecinId = Number(user?.user_id ?? user?.id ?? user?.medecin_id ?? NaN);
  const medecinNom = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}` : user?.username || '';
  const medecinNomNorm = normalizeName(medecinNom);
  const usernameNorm = normalizeName(user?.username);

  const fetchListes = useCallback(async () => {
    setGlobalError(''); setLoadListes(true);
    try {
      const data = await getMesListesContreVisite();
      let normalized = normalizeListesResponse(data);
      console.log('[DashboardMedecinControleur] mes_listes_du_jour:', {
        medecinId,
        medecinNomNorm,
        usernameNorm,
        count: normalized.length,
        raw: data,
      });

      // Fallback: some backends don't populate /contre-visites/mes_listes_du_jour/ for assigned lists,
      // but the assignment exists on /listes-contre-visites/. In that case, derive the controller view from there.
      if (normalized.length === 0) {
        const all = await getListesContreVisites();
        const allNormalized = normalizeListesResponse(all).filter(
          (l) => String(l?.statut || '').toUpperCase() !== 'ARCHIVEE',
        );
        const first = allNormalized[0];
        const firstAssignedId = pickAssignedMedecinId(first);
        const firstBackendNameRaw = first?.medecin_nom ?? first?.medecinName ?? first?.medecin_name ?? first?.medecin;
        const firstBackendNameNorm = normalizeName(firstBackendNameRaw);
        console.log('[DashboardMedecinControleur] listes-contre-visites:', {
          medecinId,
          medecinNomNorm,
          usernameNorm,
          count: allNormalized.length,
          sample: allNormalized.slice(0, 3),
          first: first || null,
          firstAssignedId: firstAssignedId ?? null,
          firstBackendNameRaw: firstBackendNameRaw ?? null,
          firstBackendNameNorm: firstBackendNameNorm || null,
        });
        const assigned = allNormalized.filter((l) => {
          const assignedId = pickAssignedMedecinId(l);
          const matchById =
            Number.isFinite(medecinId) &&
            assignedId !== null &&
            Number(assignedId) === Number(medecinId);

          // Fallback when backend only returns the assigned doctor's name (e.g. `medecin_nom`)
          const backendNameRaw = l?.medecin_nom ?? l?.medecinName ?? l?.medecin_name ?? l?.medecin;
          const backendName = normalizeName(backendNameRaw);
          const matchByName = backendName
            ? (nameLooselyMatches(backendName, medecinNomNorm) || nameLooselyMatches(backendName, usernameNorm))
            : false;

          // Some backends return an assignedId that doesn't match the auth user id,
          // while still exposing the correct assigned doctor's name. Accept either signal.
          return matchById || matchByName;
        });
        console.log('[DashboardMedecinControleur] assigned lists:', {
          medecinId,
          count: assigned.length,
          assignedSample: assigned.slice(0, 3),
        });
        // Prefer active lists first
        normalized = assigned.sort((a, b) => {
          const aActive = a?.statut === 'EN_TRAITEMENT' ? 0 : 1;
          const bActive = b?.statut === 'EN_TRAITEMENT' ? 0 : 1;
          if (aActive !== bActive) return aActive - bActive;
          return (b?.id ?? 0) - (a?.id ?? 0);
        });
      }

      console.log('[DashboardMedecinControleur] fetchListes ->', normalized.length, normalized);
      const prevCount = lastListesCountRef.current;
      setListes(normalized);
      lastListesCountRef.current = normalized.length;
      const newCount = normalized.length;
      if (newCount > prevCount) {
        setRefreshMsg(`Nouvelle(s) liste(s) assignée(s) : ${newCount - prevCount}`);
        setTimeout(() => setRefreshMsg(''), 5000);
      }
    } catch (e) { console.error('[DashboardMedecinControleur] fetchListes error', e); setGlobalError('Impossible de charger les listes.'); }
    finally { setLoadListes(false); }
  }, [medecinId, medecinNomNorm, usernameNorm]);

  const fetchSuivi = useCallback(async () => {
    setLoadSuivi(true);
    try { const data = await getContreVisites(); setSuivi(Array.isArray(data) ? data : (data.results || [])); }
    catch { setSuivi([]); }
    finally { setLoadSuivi(false); }
  }, []);

  useEffect(() => { fetchListes(); }, [fetchListes]);
  // Poll listes periodically when controller is on "liste" view so newly assigned lists appear
  useEffect(() => {
    let t = null;
    if (vue === 'liste') {
      t = setInterval(() => { fetchListes(); }, 15000);
    }
    return () => { if (t) clearInterval(t); };
  }, [vue, fetchListes]);
  useEffect(() => { if (vue === 'suivi') fetchSuivi(); }, [vue, fetchSuivi]);

  const allItems = listes
    .flatMap((l) => (l.items || []).map((i) => ({ ...i, _liste: l })))
    .filter((i) => isPresenceEligibleForControleur(i.presence));
  const totalEnAttente = allItems.filter(i => i.statut === 'EN_ATTENTE').length;
  const totalTraites   = allItems.filter(i => i.statut === 'EFFECTUEE').length;

  const handleCreer  = (item) => { setItemSel(item); setShowForm(true); };
  const handleSelect = (item) => { setItemSel(item); setShowForm(false); };
  const handleSuccess = ({ cv, cm, item: updatedItem, partial }) => {
    setListes(prev => prev.map(l => ({
      ...l,
      items: (l.items || []).map(i => {
        if (i.id !== updatedItem.id) return i;
        // Important: do NOT mark as EFFECTUEE until the contrôle médical exists (step 2 done).
        return {
          ...i,
          statut: partial ? 'EN_ATTENTE' : 'EFFECTUEE',
          contre_visite: cv,
        };
      }),
    })));
    if (!partial && cm) { setSuivi(prev => [{ ...cv, controle_medical: cm }, ...prev]); setShowForm(false); setVue('suivi'); }
  };

  const handleSetVue = (key) => {
    setVue(key);
    setShowForm(false);
    if (key === 'liste') fetchListes();
  };

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'DM Sans','Segoe UI',sans-serif", background:'#f0f9ff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        button,input,select,textarea{font-family:inherit;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#bae6fd;border-radius:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pageFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <Sidebar vue={vue} onSetVue={handleSetVue} user={user} onLogout={handleLogout} medecinNom={medecinNom} siteName={siteName} />

      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', padding:'28px 32px 24px', background:'#f0f9ff', animation:'pageFade .25s ease' }}>
        {/* Top bar */}
        <div style={{ marginBottom:24, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <div style={{ width:4, height:24, borderRadius:99, background:'linear-gradient(180deg,#0ea5e9,#0369a1)', flexShrink:0 }} />
            <h1 style={{ fontSize:22, fontWeight:800, color:'#0c4a6e', letterSpacing:-.5 }}>
              {PAGE_TITLES[vue]}
            </h1>
          </div>
          {refreshMsg && (
            <div style={{ marginLeft: 14, marginBottom: 8, fontSize: 12.5, color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {refreshMsg}
            </div>
          )}
          {vue !== 'accueil' && (
            <p style={{ fontSize:13, color:'#0369a1', fontWeight:500, textTransform:'capitalize', paddingLeft:14 }}>{today}</p>
          )}
        </div>

        {globalError && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'12px 16px', borderRadius:12, fontSize:13.5, marginBottom:20, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {globalError}
            <button onClick={fetchListes} style={{ padding:'5px 14px', background:'#b91c1c', color:'white', border:'none', borderRadius:7, fontSize:12.5, fontWeight:700, cursor:'pointer' }}>Réessayer</button>
          </div>
        )}

        {/* ACCUEIL */}
        {vue === 'accueil' && (
          <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
            <AccueilControleur
              totalPatients={allItems.length}
              enAttente={totalEnAttente}
              traites={totalTraites}
              medecinNom={medecinNom}
              onNavigate={handleSetVue}
            />
          </div>
        )}

        {/* SUIVI */}
        {vue === 'suivi' && (
          <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
            <SuiviContreVisitesView suivi={suivi} loading={loadSuivi} medecinNom={medecinNom}
              onDemandeExpertise={(cv) => setPopupExpertiseCv(cv)}/>
          </div>
        )}

        {/* EXPERTISE */}
        {vue === 'expertise' && (
          <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
            {showExpertise
              ? <FormulaireDemandeExpertise medecinNom={medecinNom} onClose={() => setShowExpertise(false)}/>
              : <DemandesExpertiseView medecinNom={medecinNom} onNouvelleExpertise={() => setShowExpertise(true)}/>
            }
          </div>
        )}

        {popupExpertiseCv && (
          <PopupExpertiseDirect cv={popupExpertiseCv} medecinNom={medecinNom} onClose={() => setPopupExpertiseCv(null)}/>
        )}

        {/* HISTORIQUE PATIENT */}
        {vue === 'historique' && (
          <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
            <HistoriquePatient />
          </div>
        )}

        {/* MALADIES CHRONIQUES */}
        {vue === 'maladies-chroniques' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <MaladiesChroniques readOnly />
          </div>
        )}

        {vue === 'documents-scans' && (
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <DocumentsMedicauxScannesPage canEdit={false} />
          </div>
        )}

        {/* LISTE DU JOUR */}
        {vue === 'liste' && (
          <div style={{ display:'grid', gridTemplateColumns:'290px 1fr', gap:20, flex:1, overflow:'hidden', minHeight:0 }}>
            <FileAttenteControleur items={allItems} selectedItemId={itemSel?.id ?? null} onSelect={handleSelect} onCreerContreVisite={handleCreer} loading={loadListes} onRefresh={fetchListes} />
            <div style={{ overflowY:'auto', minHeight:0 }}>
              {showForm && itemSel ? (
                <FormulaireView item={itemSel} medecinNom={medecinNom} onRetour={() => setShowForm(false)} onSuccess={handleSuccess}/>
              ) : itemSel ? (
                <Formulairecontrevisite key={itemSel.id} item={itemSel} medecinNom={medecinNom}
                  onUpdateItem={(updated) => setListes(prev => prev.map(l => ({ ...l, items:(l.items||[]).map(i => i.id===updated.id ? {...i,...updated} : i) })))} />
              ) : (
                <PanneauVide />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}