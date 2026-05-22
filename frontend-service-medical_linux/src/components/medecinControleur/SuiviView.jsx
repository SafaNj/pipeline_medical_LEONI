// src/components/medecinControleur/SuiviView.jsx
import { useState, useEffect } from 'react';
import { ouvrirDemandeExpertise } from './Demandeexpertise';
import { PopupExpertiseDirect } from './Demandeexpertise';
import { ModalConfirmDeleteCV, genPDFControle, ouvrirFichier, DrawerVoirCV, DrawerModifierCV, DrawerExpertise } from './SuiviDrawers';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import {
  supprimerContreVisite, getDemandesByContreVisite,
  creerDemandeExpertise, updateDemandeExpertise, searchCollaborateurs,
  getControleMedicalByContreVisite,
} from '../../api/Contrevisiteapi';
import { getReposInitial } from '../../utils/contreVisiteRepos';

const C = {
  primary:  '#0284c7', primary2: '#0369a1',
  dark:     '#0c4a6e', light:    '#e0f2fe',
  light2:   '#f0f9ff', border:   '#bae6fd',
  accent:   '#38bdf8', text:     '#0f172a',
  muted:    '#64748b',
};
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const today = () => new Date().toISOString().split('T')[0];

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
const IcoPencil    = ({ c='#0284c7', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash     = ({ c='#dc2626', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoEye       = ({ c='#0284c7', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoClose     = ({ c='white',   size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoSave      = ({ c='white',   size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoAlert     = ({ c='#d97706', size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;


const ouvrirDemandeExpertisePDF = ouvrirDemandeExpertise;


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
        <button key={p} onClick={() => onPageChange(p)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: p === currentPage ? `linear-gradient(135deg,${C.primary},${C.accent})` : C.light2, color: p === currentPage ? 'white' : C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{p}</button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: currentPage === totalPages ? C.light2 : 'white', color: currentPage === totalPages ? '#cbd5e1' : C.primary, fontWeight: 700, fontSize: 13, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
        Suiv.<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}

/* ════════════ VUE 3 : SUIVI ════════════ */
function medecinCellLabel(cv, medecinNom) {
  const raw = cv?.medecin_nom || cv?.medecin || medecinNom;
  if (!raw) return '—';
  const s = String(raw).trim();
  return /^dr\.?\s/i.test(s) ? s : `Dr. ${s}`;
}

function SuiviContreVisitesView({ suivi: suiviProp, loading, medecinNom, onDemandeExpertise, readOnly = false, searchQuery = '' }) {
  // Local copy so we can update/delete rows without refetching
  const [suivi, setSuivi] = useState(suiviProp);
  const { user } = useAuth();
  // Map cvId -> controle_medical (undefined=unknown, null=fetching, false=none, object=exists)
  const [controleMap, setControleMap] = useState({});
  useEffect(() => { setSuivi(suiviProp); setControleMap({}); }, [suiviProp]);

  const q = (searchQuery || '').trim().toLowerCase();
  const suiviFiltreRecherche = q
    ? suivi.filter((cv) =>
        (cv.nom_prenom || '').toLowerCase().includes(q) ||
        (cv.matricule || '').toLowerCase().includes(q) ||
        (cv.remarque || '').toLowerCase().includes(q)
      )
    : suivi;
  // Lazy-fetch contrôle médical via contre-visite detail (fallback si non inclus)
  const checkControle = async (cvId) => {
    if (controleMap[cvId] !== undefined) return;
    setControleMap(prev => ({ ...prev, [cvId]: null })); // loading
    try {
      // 1st try: dedicated endpoint
      const data = await getControleMedicalByContreVisite(cvId);
      const cm = Array.isArray(data) ? data[0] : (data?.id ? data : null);
      setControleMap(prev => ({ ...prev, [cvId]: cm || false }));
      if (cm) setSuivi(prev => prev.map(cv => cv.id === cvId ? { ...cv, controle_medical: cm } : cv));
    } catch (err) {
      // If backend returns 404 when there's no contrôle médical, treat it as "none"
      if (err?.response?.status === 404) {
        setControleMap(prev => ({ ...prev, [cvId]: false }));
        return;
      }
      // 2nd try: fetch contre-visite detail which may include controle_medical nested
      try {
        const res = await axiosInstance.get(`/control-visits/contre-visites/${cvId}/`);
        const d = res.data;
        const cm = d?.controle_medical;
        const cmObj = cm && typeof cm === 'object' && cm.id ? cm : null;
        setControleMap(prev => ({ ...prev, [cvId]: cmObj || false }));
        if (d && typeof d === 'object') {
          setSuivi((prev) =>
            prev.map((cv) =>
              cv.id === cvId
                ? { ...cv, ...d, controle_medical: cmObj || cv.controle_medical }
                : cv
            )
          );
        } else if (cmObj) {
          setSuivi((prev) => prev.map((cv) => (cv.id === cvId ? { ...cv, controle_medical: cmObj } : cv)));
        }
      } catch {
        setControleMap(prev => ({ ...prev, [cvId]: false }));
      }
    }
  };

  const [voirCV,     setVoirCV]     = useState(null);
  const [editCV,     setEditCV]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const handleSavedCV = (updated) => {
    setSuivi(prev => prev.map(cv => cv.id === updated.id ? { ...cv, ...updated } : cv));
    setEditCV(null);
  };
  const handleDeleteCV = async () => {
    if (!confirmDel) return;
    try {
      await supprimerContreVisite(confirmDel.id);
      setSuivi(prev => prev.filter(cv => cv.id !== confirmDel.id));
    } catch { /* silent */ }
    setConfirmDel(null);
  };
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
  const anneesDispos = [...new Set(suiviFiltreRecherche.map(cv => parseDate(cv.date).getFullYear()))].sort((a,b) => b-a);
  const filtered  = suiviFiltreRecherche.filter(cv => { const d = parseDate(cv.date); return d.getFullYear() === filtreAnnee && d.getMonth()+1 === filtreMois; });
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

  const cols = ['Date','Matricule','Collaborateur','Remarque','Médecin','À partir du','Repos initial','Durée','Contrôle','Actions'];
  return (
    <>
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
            const count  = suiviFiltreRecherche.filter(cv => { const d = parseDate(cv.date); return d.getFullYear() === filtreAnnee && d.getMonth()+1 === n; }).length;
            const active = filtreMois === n;
            return (
              <button key={n} onClick={() => { setFiltreMois(n); setCurrentPage(1); }} style={{ padding: '5px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, position: 'relative', background: active ? `linear-gradient(135deg,${C.primary},${C.accent})` : (count > 0 ? C.light : '#f8fafc'), color: active ? 'white' : (count > 0 ? C.primary : '#94a3b8'), boxShadow: active ? `0 2px 8px rgba(2,132,199,.3)` : 'none' }}>
                {lbl.slice(0,3)}
                {count > 0 && !active && <span style={{ position: 'absolute', top: -5, right: -5, background: C.primary, color: 'white', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>}
              </button>
            );
          })}
        </div>
        <span style={{ background: C.light, color: C.primary, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20 }}>{sorted.length} / {suiviFiltreRecherche.length}</span>
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
                    <td style={{ padding: '11px 16px', color: C.muted, maxWidth: 160 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:150 }} title={cv.remarque}>
                        {cv.remarque || <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#334155' }}>{medecinCellLabel(cv, medecinNom)}</td>
                    <td style={{ padding: '11px 16px', color: '#334155', whiteSpace: 'nowrap' }}>{cv.a_partir ? fmtDateShort(cv.a_partir) : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ padding: '11px 16px' }}>
                      {(() => {
                        const r0 = getReposInitial(cv);
                        return r0 !== null
                          ? <span style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 9px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{r0} j</span>
                          : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>;
                      })()}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {cv.duree_repos > 0
                        ? <span style={{ background: '#fff7ed', color: '#c2410c', padding: '3px 9px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{cv.duree_repos} j</span>
                        : <span style={{ color: '#cbd5e1', fontSize: 12 }}>0 j</span>}
                    </td>
                    {/* Colonne Contrôle */}
                    <td style={{ padding: '11px 16px' }}>
                      {(() => {
                        // Use embedded controle_medical or lazy-fetched one
                        const cm = cv.controle_medical || (controleMap[cv.id] && controleMap[cv.id] !== false ? controleMap[cv.id] : null);
                        if (!cm && controleMap[cv.id] === undefined) checkControle(cv.id);
                        if (cm) return (
                          <button onClick={() => ouvrirFichier(cm, cv, medecinNom, user)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', borderRadius: 7, background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: `0 2px 8px rgba(2,132,199,.25)`, transition: 'all .15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                            <IcoDownload /> Contrôle
                          </button>
                        );
                        if (controleMap[cv.id] === null) return <span style={{ fontSize: 11.5, color: '#94a3b8' }}>...</span>;
                        return <span style={{ fontSize: 11.5, color: '#cbd5e1', fontStyle: 'italic' }}>—</span>;
                      })()}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={() => setVoirCV(cv)} title="Voir"
                          style={{ display:'inline-flex', alignItems:'center', padding:'5px 9px', border:'1.5px solid #0284c7', background:'white', color:'#0284c7', borderRadius:6, cursor:'pointer', transition:'all .15s' }}>
                          <IcoEye />
                        </button>
                        {!readOnly && (
                          <>
                            <button onClick={() => setEditCV(cv)} title="Modifier"
                              style={{ display:'inline-flex', alignItems:'center', padding:'5px 9px', border:'1.5px solid #0369a1', background:'white', color:'#0369a1', borderRadius:6, cursor:'pointer', transition:'all .15s' }}>
                              <IcoPencil c="currentColor" />
                            </button>
                            <button onClick={() => setConfirmDel({ id: cv.id, titre: 'Supprimer la contre-visite', texte: 'Cette contre-visite et son controle medical seront definitivement supprimes.' })} title="Supprimer"
                              style={{ display:'inline-flex', alignItems:'center', padding:'5px 9px', border:'1.5px solid #dc2626', background:'white', color:'#dc2626', borderRadius:6, cursor:'pointer', transition:'all .15s' }}>
                              <IcoTrash />
                            </button>
                          </>
                        )}
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

    {/* Drawers overlay */}
    {voirCV && (
      <DrawerVoirCV
        cv={voirCV}
        medecinNom={medecinNom}
        readOnly={readOnly}
        onClose={() => setVoirCV(null)}
        onEdit={(cv) => { setVoirCV(null); setEditCV(cv); }}
      />
    )}
    {!readOnly && editCV && (
      <DrawerModifierCV cv={editCV} medecinNom={medecinNom} onClose={() => setEditCV(null)} onSaved={handleSavedCV} />
    )}
    {!readOnly && confirmDel && (
      <ModalConfirmDeleteCV titre={confirmDel.titre} texte={confirmDel.texte} onConfirm={handleDeleteCV} onClose={() => setConfirmDel(null)} />
    )}
    </>
  );
}


export default SuiviContreVisitesView;