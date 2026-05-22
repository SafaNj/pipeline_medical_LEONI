// src/components/rh/ContreVisitesRH.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  getListes,
  getListeDetail,
  creerListe,
  updateListe,
  deleteListe,
  soumettreListe,
  ajouterLigne,
  supprimerLigne,
  getControleMedicalByContreVisite,
  notifierSmsVeilleListeContreVisite,
  archiverListeContreVisite,
} from '../../api/Contrevisiteapi';
import axiosInstance from '../../api/axios';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { ouvrirFichier, DrawerVoirCV } from '../medecinControleur/SuiviDrawers';
import { getReposInitial } from '../../utils/contreVisiteRepos';
import { isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';
import { SmsLigneBadge } from '../contreVisite/SmsContreVisiteBadges';
import { nextOrdrePourNouvelleLigne, sortLignesByOrdre } from '../../utils/contreVisiteOrdre';
import { uiConfirm } from '../../utils/uiAlert';

/* ─── Icons ─────────────────────────────────────────────────── */
const Ico = {
  Plus:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Left:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Search:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Calendar:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Alert:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Users:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Send:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Edit:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  User:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  List:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Eye:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Archive:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
};

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtDateShort = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const todayStr = () => new Date().toISOString().slice(0, 10);

const RH_C = { primary: '#0284c7', accent: '#38bdf8', light: '#e0f2fe', light2: '#f0f9ff', border: '#bae6fd', text: '#0f172a', muted: '#64748b' };

const MOIS_FILTRE = [
  { n: 1, lbl: 'Janvier' }, { n: 2, lbl: 'Février' }, { n: 3, lbl: 'Mars' }, { n: 4, lbl: 'Avril' },
  { n: 5, lbl: 'Mai' }, { n: 6, lbl: 'Juin' }, { n: 7, lbl: 'Juillet' }, { n: 8, lbl: 'Août' },
  { n: 9, lbl: 'Septembre' }, { n: 10, lbl: 'Octobre' }, { n: 11, lbl: 'Novembre' }, { n: 12, lbl: 'Décembre' },
];

function archiveListeMatchesDate(l, annee, mois) {
  const a = annee === '' || annee == null ? null : Number(annee);
  const m = mois === '' || mois == null ? null : Number(mois);
  if (a == null && m == null) return true;
  if (!l.date_visite) return false;
  const d = new Date(l.date_visite);
  if (Number.isNaN(d.getTime())) return false;
  if (a != null && d.getFullYear() !== a) return false;
  if (m != null && d.getMonth() + 1 !== m) return false;
  return true;
}

const ANNEE_MIN_ARCHIVES_RH = 2026;

function visiteArchiveRHAffichable(l) {
  if (!l.date_visite) return true;
  const d = new Date(l.date_visite);
  if (Number.isNaN(d.getTime())) return true;
  return d.getFullYear() >= ANNEE_MIN_ARCHIVES_RH;
}

function medecinCellLabelRh(cv, fallbackListe) {
  const raw = cv?.medecin_nom || cv?.medecin || fallbackListe;
  if (!raw) return '—';
  const s = String(raw).trim();
  return /^dr\.?\s/i.test(s) ? s : `Dr. ${s}`;
}

/** Construit un objet « contre-visite » pour affichage / PDF à partir d'une ligne de liste RH. */
function cvDepuisLigneListeRh(ligne, dateListe) {
  const nested = ligne.contre_visite;
  const cv = nested && typeof nested === 'object' ? { ...nested } : {};
  const cvId =
    cv.id ??
    (typeof nested === 'number' ? nested : null) ??
    ligne.contre_visite_id ??
    ligne.contre_visite ??
    null;

  return {
    ...cv,
    id: cvId,
    date: cv.date || cv.date_contre_visite || ligne.date_contre_visite || dateListe,
    matricule: cv.matricule || ligne.collaborateur_matricule,
    nom_prenom:
      cv.nom_prenom ||
      ligne.collaborateur_nom ||
      [ligne.nom, ligne.prenom].filter(Boolean).join(' ').trim() ||
      '—',
    remarque: cv.remarque ?? ligne.remarque,
    medecin_nom: cv.medecin_nom ?? ligne.medecin_nom ?? ligne.medecin_controleur_nom,
    a_partir: cv.a_partir ?? ligne.a_partir,
    duree_repos: cv.duree_repos ?? ligne.duree_repos,
    repos_initial: cv.repos_initial ?? ligne.repos_initial,
    controle_medical: cv.controle_medical ?? ligne.controle_medical,
  };
}

/* ─── Statuts config ─────────────────────────────────────── */
const STATUTS = {
  BROUILLON:     { label:'Brouillon',     bg:'#f1f5f9', color:'#475569', border:'#cbd5e1', dot:'#94a3b8' },
  SOUMISE:       { label:'Soumise',       bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe', dot:'#3b82f6' },
  EN_TRAITEMENT: { label:'En traitement', bg:'#fffbeb', color:'#b45309', border:'#fde68a', dot:'#f59e0b' },
  CLOTUREE:      { label:'Clôturée',      bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0', dot:'#22c55e' },
  ARCHIVEE:      { label:'Archivée',      bg:'#ede9fe', color:'#6d28d9', border:'#c4b5fd', dot:'#8b5cf6' },
};

const StatutBadge = ({ statut }) => {
  const s = STATUTS[statut] || STATUTS.BROUILLON;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  );
};

/* ─── Base styles ─────────────────────────────────────────── */
const inp = { padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, color:'#0f172a', background:'white', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', transition:'border-color .15s' };
const lbl = { display:'block', fontSize:10.5, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:6 };
const btn = { padding:'9px 16px', fontSize:13, fontWeight:700, borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all .15s', display:'inline-flex', alignItems:'center', gap:6 };

/* ─── Recherche collaborateur ─────────────────────────────── */
const searchCollaborateurs = async (q) => {
  const res = await axiosInstance.get('/employees/collaborateurs/', { params: { search: q } });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

function CollaborateurSearch({ onSelect, resetKey = 0 }) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showDrop, setShowDrop]     = useState(false);

  useEffect(() => {
    setQuery('');
    setSuggestions([]);
    setShowDrop(false);
  }, [resetKey]);

  const handleChange = async (val) => {
    setQuery(val);
    if (val.trim().length < 2) { setSuggestions([]); setShowDrop(false); return; }
    setLoading(true);
    try {
      const data = await searchCollaborateurs(val.trim());
      setSuggestions(data.slice(0, 8));
      setShowDrop(true);
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const pick = (c) => {
    setQuery(`${c.nom} ${c.prenom}  ·  ${c.matricule}`);
    setSuggestions([]);
    setShowDrop(false);
    onSelect(c);
  };

  return (
    <div style={{ position:'relative' }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}><Ico.Search /></span>
        <input
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Rechercher par nom, prénom ou matricule…"
          style={{ ...inp, paddingLeft:34, background:query ? '#fafafa' : 'white' }}
        />
        {loading && <span style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#94a3b8' }}>…</span>}
      </div>

      {showDrop && suggestions.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', border:'1.5px solid #e2e8f0', borderRadius:10, maxHeight:220, overflowY:'auto', zIndex:200, boxShadow:'0 12px 32px rgba(0,0,0,.14)' }}>
          {suggestions.map(c => (
            <button
              key={c.id}
              onClick={() => pick(c)}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', textAlign:'left', padding:'10px 12px', border:'none', background:'transparent', cursor:'pointer', borderBottom:'1px solid #f8fafc', fontFamily:'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background='#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#dbeafe,#bfdbfe)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Ico.User />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{c.nom} {c.prenom}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>Matricule {c.matricule}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VUE LISTE — tableau des listes
══════════════════════════════════════════════════════════════ */
function VueListe({ listes, loading, filterStatut, onFilterChange, onNewListe, onOpenListe, onArchiver, archivingId }) {
  const filtered = filterStatut ? listes.filter((l) => l.statut === filterStatut) : listes;
  const [veilleBusyId, setVeilleBusyId] = useState(null);
  const [smsVeilleSentLocal, setSmsVeilleSentLocal] = useState(() => ({}));

  const counts = {};
  listes.forEach((l) => { counts[l.statut] = (counts[l.statut] || 0) + 1; });

  const handleNotifierVeille = async (liste) => {
    if (!liste?.id) return;
    if (veilleBusyId === liste.id) return;
    if (isSmsVeilleEnvoye(liste) || smsVeilleSentLocal[liste.id]) return;
    setVeilleBusyId(liste.id);
    try {
      const result = await notifierSmsVeilleListeContreVisite(liste.id);
      const extra = result != null && typeof result === 'object' && result.sms_count != null
        ? ` (${result.sms_count} SMS)`
        : '';
      await Swal.fire({
        icon: 'success',
        title: 'SMS veille (J−1)',
        text: `Demande traitée par le serveur.${extra}`,
        timer: 2200,
        showConfirmButton: false,
      });
      setSmsVeilleSentLocal((prev) => ({ ...prev, [liste.id]: true }));
      // Le backend met à jour `sms_veille_envoye` ; le refresh global se fait via rechargement naturel des listes.
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'SMS veille',
        text: formatAxiosError(e) || e?.message || 'Échec.',
      });
    } finally {
      setVeilleBusyId(null);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:16 }}>

      {/* Header actions */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button onClick={onNewListe} style={{ ...btn, background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'white', boxShadow:'0 4px 14px rgba(29,78,216,.3)', paddingLeft:14 }}>
          <Ico.Plus /> Nouvelle liste
        </button>

        <div style={{ display:'flex', gap:6, flex:1, minWidth:0, overflowX:'auto' }}>
          {[null, 'BROUILLON', 'SOUMISE', 'EN_TRAITEMENT', 'CLOTUREE'].map(s => {
            const active = filterStatut === s;
            const cfg    = s ? STATUTS[s] : null;
            const count  = s ? (counts[s] || 0) : listes.length;
            return (
              <button
                key={s}
                onClick={() => onFilterChange(s)}
                style={{
                  ...btn,
                  padding:'7px 13px',
                  background: active ? (cfg?.bg || '#eff6ff') : '#f8fafc',
                  color:      active ? (cfg?.color || '#1d4ed8') : '#64748b',
                  border:     active ? `1.5px solid ${cfg?.border || '#bfdbfe'}` : '1.5px solid #e2e8f0',
                  fontSize:   12,
                  whiteSpace: 'nowrap',
                }}
              >
                {s ? cfg.label : 'Toutes'} {count > 0 && <span style={{ background: active ? cfg?.color : '#e2e8f0', color: active ? 'white' : '#64748b', borderRadius:99, padding:'1px 7px', fontSize:10, fontWeight:800, marginLeft:2 }}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table card */}
      <div style={{ flex:1, minHeight:0, background:'white', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
              Chargement…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ textAlign:'center', color:'#94a3b8' }}>
              <Ico.List />
              <div style={{ fontSize:14, fontWeight:600, marginTop:12, color:'#cbd5e1' }}>Aucune liste</div>
              <div style={{ fontSize:12, marginTop:4, color:'#e2e8f0' }}>Créez votre première liste de contre-visites</div>
            </div>
          </div>
        ) : (
          <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                <tr style={{ background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0' }}>
                  {['Référence','Date visite','Statut','SMS veille','Collaborateurs','Actions'].map(h => (
                    <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((liste, i) => (
                  <tr key={liste.id} style={{ borderBottom:'1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafcff' }}>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ fontWeight:800, color:'#1d4ed8', fontSize:13, letterSpacing:'.3px' }}>{liste.reference || `CV-${liste.id}`}</span>
                    </td>
                    <td style={{ padding:'13px 16px', color:'#64748b', fontSize:12.5 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Ico.Calendar />
                        {fmtDate(liste.date_visite)}
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}><StatutBadge statut={liste.statut} /></td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        {(isSmsVeilleEnvoye(liste) || smsVeilleSentLocal[liste.id]) ? (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#ecfdf5', color: '#15803d', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                            SMS veille ✓
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>
                        )}
                        {!(isSmsVeilleEnvoye(liste) || smsVeilleSentLocal[liste.id]) && (
                          <button
                            type="button"
                            onClick={() => handleNotifierVeille(liste)}
                            disabled={veilleBusyId === liste.id}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              border: '1px solid #bae6fd',
                              background: veilleBusyId === liste.id ? '#f1f5f9' : 'white',
                              color: '#0369a1',
                              fontSize: 11,
                              fontWeight: 800,
                              fontFamily: 'inherit',
                              cursor: veilleBusyId === liste.id ? 'wait' : 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                            title="Notifier tous les collaborateurs de la liste (SMS veille J−1)"
                          >
                            {veilleBusyId === liste.id ? '…' : 'Envoyer'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, color:'#64748b', fontSize:12.5 }}>
                        <Ico.Users />
                        <strong style={{ color:'#0f172a' }}>{liste.nombre_collaborateurs || 0}</strong> collab.
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                        <button
                          onClick={() => onOpenListe(liste)}
                          style={{ ...btn, background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', padding:'6px 14px', fontSize:12 }}
                          onMouseEnter={e => { e.currentTarget.style.background='#dbeafe'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='#eff6ff'; }}
                        >
                          Ouvrir →
                        </button>
                        {liste.statut === 'CLOTUREE' && onArchiver && (
                          <button
                            type="button"
                            disabled={archivingId != null}
                            onClick={() => onArchiver(liste)}
                            style={{
                              ...btn,
                              background: archivingId != null ? '#f1f5f9' : '#eef2ff',
                              color: archivingId != null ? '#94a3b8' : '#4338ca',
                              border: '1px solid #c7d2fe',
                              padding: '6px 14px',
                              fontSize: 12,
                              cursor: archivingId != null ? 'wait' : 'pointer',
                            }}
                          >
                            <Ico.Archive /> {archivingId === liste.id ? '…' : 'Archiver'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VUE CRÉATION
══════════════════════════════════════════════════════════════ */
function VueCreation({ onCreated, onCancel }) {
  const [form, setForm] = useState({ date_visite: todayStr() });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleSubmit = async () => {
    if (!form.date_visite) { setErr('La date de visite est obligatoire.'); return; }
    setSaving(true);
    setErr('');
    try {
      const liste = await creerListe(form);
      onCreated(liste);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth:520 }}>
      {/* Back */}
      <button onClick={onCancel} style={{ ...btn, background:'transparent', color:'#64748b', padding:'6px 0', marginBottom:20, border:'none' }}>
        <Ico.Left /> Retour
      </button>

      <div style={{ background:'white', borderRadius:16, border:'1px solid #e2e8f0', padding:28, boxShadow:'0 4px 24px rgba(0,0,0,.06)' }}>
        {/* Title */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#dbeafe,#bfdbfe)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Ico.List />
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>Nouvelle liste de contre-visites</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Définissez la date de passage du médecin contrôleur</div>
          </div>
        </div>

        {err && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 14px', borderRadius:9, fontSize:13, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <Ico.Alert /> {err}
          </div>
        )}

        <div style={{ marginBottom:20 }}>
          <label style={lbl}><Ico.Calendar /> Date de visite *</label>
          <input type="date" value={form.date_visite} onChange={e => setForm(f => ({ ...f, date_visite: e.target.value }))} style={inp} />
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>Vous pourrez ajouter les collaborateurs après la création.</div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ ...btn, background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving} style={{ ...btn, background: saving ? '#93c5fd' : 'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'white', boxShadow: saving ? 'none' : '0 4px 14px rgba(29,78,216,.3)', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Création…' : <><Ico.Plus /> Créer la liste</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VUE DÉTAIL
══════════════════════════════════════════════════════════════ */
function VueDetail({ liste, onBack, onUpdated, onArchiver, archivingId }) {
  const [detail, setDetail]               = useState(liste);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [addingLigne, setAddingLigne]     = useState(false);
  const [editingDate, setEditingDate]     = useState(false);
  const [newDate, setNewDate]             = useState(liste.date_visite || todayStr());
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [collabSearchKey, setCollabSearchKey]     = useState(0);
  const [controleMap, setControleMap]             = useState({});
  const [voirCV, setVoirCV]                       = useState(null);

  const isBrouillon = detail.statut === 'BROUILLON';
  const lignes      = detail.lignes || [];
  const lignesOrdonnees = useMemo(() => sortLignesByOrdre(lignes), [lignes]);
  const hasCollabs  = lignes.length > 0;

  const medecinListeRh =
    detail.medecin_controleur_nom ||
    detail.medecin_nom ||
    (typeof detail.medecin_controleur === 'object' && detail.medecin_controleur
      ? [detail.medecin_controleur.nom, detail.medecin_controleur.prenom].filter(Boolean).join(' ').trim()
      : '') ||
    '';

  const cvRows = useMemo(
    () => lignesOrdonnees.map((l) => cvDepuisLigneListeRh(l, detail.date_visite)),
    [lignesOrdonnees, detail.date_visite]
  );

  useEffect(() => {
    setControleMap({});
    setVoirCV(null);
  }, [detail.id, detail.statut, lignes.length]);

  const checkControle = async (cvId) => {
    if (cvId == null || cvId === '') return;
    if (controleMap[cvId] !== undefined) return;
    setControleMap((prev) => ({ ...prev, [cvId]: null }));
    try {
      const data = await getControleMedicalByContreVisite(cvId);
      const cm = Array.isArray(data) ? data[0] : (data?.id ? data : null);
      setControleMap((prev) => ({ ...prev, [cvId]: cm || false }));
    } catch (err) {
      if (err?.response?.status === 404) {
        setControleMap((prev) => ({ ...prev, [cvId]: false }));
        return;
      }
      try {
        const res = await axiosInstance.get(`/control-visits/contre-visites/${cvId}/`);
        const cm = res.data?.controle_medical;
        const cmObj = cm && typeof cm === 'object' && cm.id ? cm : null;
        setControleMap((prev) => ({ ...prev, [cvId]: cmObj || false }));
      } catch {
        setControleMap((prev) => ({ ...prev, [cvId]: false }));
      }
    }
  };

  const AddCollaborateur = () => {
    if (!isBrouillon) return null;
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'visible', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 26, height: 26, borderRadius: 9, background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>＋</span>
            Ajouter un collaborateur
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>Avant soumission</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <CollaborateurSearch onSelect={setSelectedCollab} resetKey={collabSearchKey} />
              {selectedCollab && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                  <Ico.Check />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#15803d' }}>
                    {selectedCollab.nom} {selectedCollab.prenom} · {selectedCollab.matricule}
                  </span>
                  <button onClick={() => { setSelectedCollab(null); setCollabSearchKey(k => k + 1); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto', fontWeight: 900, fontSize: 14 }}>✕</button>
                </div>
              )}
            </div>
            <button
              onClick={handleAddLigne}
              disabled={!selectedCollab || addingLigne}
              style={{
                ...btn,
                padding: '10px 16px',
                background: selectedCollab && !addingLigne ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : '#e2e8f0',
                color: selectedCollab && !addingLigne ? 'white' : '#94a3b8',
                cursor: selectedCollab && !addingLigne ? 'pointer' : 'not-allowed',
                boxShadow: selectedCollab && !addingLigne ? '0 8px 18px rgba(29,78,216,.18)' : 'none',
                whiteSpace: 'nowrap',
                alignSelf: 'flex-start',
              }}
            >
              {addingLigne ? 'Ajout…' : <><Ico.Plus /> Ajouter</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const refreshDetail = async () => {
    setLoadingDetail(true);
    try {
      const updated = await getListeDetail(detail.id);
      setDetail(updated);
    } catch {
      setError('Impossible de rafraîchir.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  /* Ajouter un collaborateur */
  const handleAddLigne = async () => {
    if (!selectedCollab) return;
    const toAdd = selectedCollab;
    setAddingLigne(true);
    setError('');
    try {
      await ajouterLigne({
        liste: detail.id,
        collaborateur: toAdd.id,
        ordre: nextOrdrePourNouvelleLigne(detail.lignes),
      });
      setSelectedCollab(null);
      setCollabSearchKey(k => k + 1);
      await refreshDetail();
      showSuccess(`${toAdd.nom} ${toAdd.prenom} ajouté(e) avec succès.`);
    } catch (e) {
      setError(e?.response?.data?.detail || "Erreur lors de l'ajout.");
    } finally {
      setAddingLigne(false);
    }
  };

  /* Supprimer une ligne */
  const handleDeleteLigne = async (ligneId, nom) => {
    const ok = await uiConfirm({
      title: 'Suppression',
      text: `Retirer ${nom || 'ce collaborateur'} de la liste ?`,
      confirmButtonText: 'Retirer',
    });
    if (!ok) return;
    try {
      await supprimerLigne(ligneId);
      await refreshDetail();
    } catch {
      setError('Erreur lors de la suppression.');
    }
  };

  /* Modifier la date */
  const handleUpdateDate = async () => {
    if (!newDate) return;
    try {
      const updated = await updateListe(detail.id, { date_visite: newDate });
      setDetail(updated);
      setEditingDate(false);
      showSuccess('Date mise à jour.');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erreur lors de la mise à jour.');
    }
  };

  /* Soumettre */
  const handleSubmit = async () => {
    try {
      const updated = await soumettreListe(detail.id);
      setDetail(updated);
      setShowConfirmSubmit(false);
      onUpdated(updated);
      showSuccess('Liste soumise à l\'infirmier !');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erreur lors de la soumission.');
    }
  };

  /* Supprimer la liste */
  const handleDelete = async () => {
    try {
      await deleteListe(detail.id);
      setShowConfirmDelete(false);
      onBack();
    } catch {
      setError('Erreur lors de la suppression.');
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:14 }}>

      {/* ── En-tête ── */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #e2e8f0', padding:'16px 20px', flexShrink:0, boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>

        {/* Ligne titre */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <button onClick={onBack} style={{ ...btn, background:'#f1f5f9', color:'#475569', padding:'7px 12px', border:'1px solid #e2e8f0' }}>
            <Ico.Left /> Retour
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:900, color:'#1d4ed8', letterSpacing:'.3px' }}>
              {detail.reference || `CV-${detail.id}`}
            </div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:2, display:'flex', alignItems:'center', gap:5 }}>
              <Ico.Calendar /> Date : {fmtDate(detail.date_visite)}
              {isBrouillon && (
                <button onClick={() => setEditingDate(e => !e)} style={{ background:'none', border:'none', color:'#1d4ed8', cursor:'pointer', padding:'0 4px', fontSize:11, fontWeight:600 }}>
                  <Ico.Edit /> Modifier
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            <StatutBadge statut={detail.statut} />
            {detail.statut === 'CLOTUREE' && onArchiver && (
              <button
                type="button"
                disabled={archivingId != null}
                onClick={() => onArchiver(detail)}
                style={{
                  ...btn,
                  background: archivingId != null ? '#f1f5f9' : '#eef2ff',
                  color: archivingId != null ? '#94a3b8' : '#4338ca',
                  border: '1px solid #c7d2fe',
                  padding: '7px 14px',
                  fontSize: 12,
                  cursor: archivingId != null ? 'wait' : 'pointer',
                }}
              >
                <Ico.Archive /> {archivingId === detail.id ? '…' : 'Archiver'}
              </button>
            )}
          </div>
        </div>

        {/* Modifier date inline */}
        {editingDate && isBrouillon && (
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12, padding:'10px 14px', background:'#f0f9ff', borderRadius:9, border:'1px solid #bae6fd' }}>
            <Ico.Calendar />
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ ...inp, flex:1, maxWidth:180, padding:'6px 10px' }} />
            <button onClick={handleUpdateDate} style={{ ...btn, background:'#0284c7', color:'white', padding:'6px 14px' }}>Confirmer</button>
            <button onClick={() => { setEditingDate(false); setNewDate(detail.date_visite); }} style={{ ...btn, background:'#f1f5f9', color:'#64748b', padding:'6px 12px' }}>✕</button>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'9px 14px', borderRadius:9, fontSize:12.5, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ display:'flex', alignItems:'center', gap:7 }}><Ico.Alert /> {error}</span>
            <button onClick={() => setError('')} style={{ background:'none', border:'none', color:'#b91c1c', cursor:'pointer', fontWeight:700 }}>✕</button>
          </div>
        )}
        {success && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d', padding:'9px 14px', borderRadius:9, fontSize:12.5, marginBottom:10, display:'flex', alignItems:'center', gap:7 }}>
            <Ico.Check /> {success}
          </div>
        )}
        {!isBrouillon && isSmsVeilleEnvoye(detail) && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d', padding:'9px 14px', borderRadius:9, fontSize:12.5, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontWeight:800 }}>Rappel SMS veille (J−1)</span>
            <span style={{ fontWeight:600, opacity:0.95 }}>enregistré comme envoyé côté serveur.</span>
          </div>
        )}

        {/* Boutons d'action principaux */}
        {isBrouillon && (
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {hasCollabs && detail.date_visite && (
              <button onClick={() => setShowConfirmSubmit(true)} style={{ ...btn, background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', boxShadow:'0 4px 14px rgba(21,128,61,.25)' }}>
                <Ico.Send /> Soumettre à l'infirmier
              </button>
            )}
            {!hasCollabs && (
              <button onClick={() => setShowConfirmDelete(true)} style={{ ...btn, background:'#fef2f2', color:'#b91c1c', border:'1px solid #fecaca' }}>
                <Ico.Trash /> Supprimer la liste
              </button>
            )}
            {hasCollabs && (
              <span style={{ fontSize:12, color:'#94a3b8', alignSelf:'center' }}>
                {!detail.date_visite ? '⚠ Définissez une date avant de soumettre' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Ajouter collaborateur (en haut) ── */}
      <AddCollaborateur />

      {/* ── Section collaborateurs ── */}
      <div style={{ flex:1, minHeight:0, background:'white', borderRadius:14, border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>

        {/* Header section */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <Ico.Users />
            <span style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>Collaborateurs</span>
            <span style={{ background:'#eff6ff', color:'#1d4ed8', fontSize:11, fontWeight:800, padding:'2px 9px', borderRadius:99, border:'1px solid #bfdbfe' }}>
              {lignes.length}
            </span>
            {!isBrouillon && (
              <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>
                Détails des contre-visites et certificat (PDF)
              </span>
            )}
          </div>
          {loadingDetail && <span style={{ fontSize:11, color:'#94a3b8' }}>Mise à jour…</span>}
        </div>

        {/* Tableau */}
        <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
          {lignes.length === 0 ? (
            <div style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>👥</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#cbd5e1' }}>Aucun collaborateur</div>
              <div style={{ fontSize:12, color:'#e2e8f0', marginTop:4 }}>Utilisez le formulaire ci-dessous pour en ajouter</div>
            </div>
          ) : isBrouillon ? (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead style={{ position:'sticky', top:0, zIndex:5 }}>
                <tr style={{ background:'#f8fafc', borderBottom:'1.5px solid #f1f5f9' }}>
                  {['N°', 'Collaborateur', 'Matricule', 'Département', ''].map((h, i) => (
                    <th key={h || 'act'} style={{ padding:'10px 16px', textAlign:i === 4 ? 'right' : 'left', fontWeight:700, color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignesOrdonnees.map((ligne, idx) => (
                  <tr key={ligne.id} style={{ borderBottom:'1px solid #f8fafc' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#fafcff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
                  >
                    <td style={{ padding:'12px 16px', color:'#94a3b8', fontWeight:600, fontSize:12 }}>{idx + 1}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#dbeafe,#bfdbfe)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:800, color:'#1d4ed8' }}>
                          {(ligne.collaborateur_nom || '?')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight:600, color:'#0f172a' }}>{ligne.collaborateur_nom || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', color:'#64748b', fontFamily:'monospace', fontSize:12 }}>{ligne.collaborateur_matricule || '—'}</td>
                    <td style={{ padding:'12px 16px', color:'#64748b', fontSize:12 }}>{ligne.collaborateur_departement || '—'}</td>
                    <td style={{ padding:'12px 16px', textAlign:'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteLigne(ligne.id, ligne.collaborateur_nom)}
                        title="Retirer ce collaborateur"
                        style={{ ...btn, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'5px 10px', fontSize:12 }}
                        onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#fef2f2'; }}
                      >
                        <Ico.Trash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5, minWidth:1040 }}>
                <thead style={{ position:'sticky', top:0, zIndex:5 }}>
                  <tr style={{ background: RH_C.light2, borderBottom:`1px solid ${RH_C.border}` }}>
                    {['Date', 'Matricule', 'Collaborateur', 'Remarque', 'Médecin', 'À partir du', 'Repos initial', 'Durée', 'SMS jour J', 'Contrôle', 'Actions'].map((h) => (
                      <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:RH_C.muted, textTransform:'uppercase', letterSpacing:0.4, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cvRows.map((cv, idx) => {
                    const rowBg = idx % 2 === 0 ? 'white' : RH_C.light2;
                    const cvId = cv.id;
                    const cm =
                      cv.controle_medical ||
                      (cvId != null && controleMap[cvId] && controleMap[cvId] !== false ? controleMap[cvId] : null);
                    const cvAffiche = cm ? { ...cv, controle_medical: cm } : cv;
                    const r0 = getReposInitial(cvAffiche);

                    return (
                      <tr
                        key={lignesOrdonnees[idx]?.id ?? idx}
                        style={{ background: rowBg, borderBottom:`1px solid ${RH_C.light}` }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = RH_C.light; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}
                      >
                        <td style={{ padding:'10px 12px', color:'#334155', whiteSpace:'nowrap' }}>{fmtDateShort(cv.date)}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ background: RH_C.light, color: RH_C.primary, padding:'2px 8px', borderRadius:6, fontWeight:700, fontSize:11 }}>{cv.matricule || '—'}</span>
                        </td>
                        <td style={{ padding:'10px 12px', color: RH_C.text, fontWeight:600 }}>{cv.nom_prenom || '—'}</td>
                        <td style={{ padding:'10px 12px', color: RH_C.muted, maxWidth:140 }}>
                          <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={cv.remarque}>
                            {cv.remarque || <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding:'10px 12px', color:'#334155' }}>{medecinCellLabelRh(cv, medecinListeRh)}</td>
                        <td style={{ padding:'10px 12px', whiteSpace:'nowrap' }}>{cv.a_partir ? fmtDateShort(cv.a_partir) : <span style={{ color:'#cbd5e1' }}>—</span>}</td>
                        <td style={{ padding:'10px 12px' }}>
                          {r0 !== null ? (
                            <span style={{ background:'#f0fdf4', color:'#15803d', padding:'3px 8px', borderRadius:6, fontWeight:700, fontSize:11 }}>{r0} j</span>
                          ) : (
                            <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          {cv.duree_repos > 0 ? (
                            <span style={{ background:'#fff7ed', color:'#c2410c', padding:'3px 8px', borderRadius:6, fontWeight:700, fontSize:11 }}>{cv.duree_repos} j</span>
                          ) : (
                            <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding:'10px 12px' }}><SmsLigneBadge ligne={lignesOrdonnees[idx]} /></td>
                        <td style={{ padding:'10px 12px' }}>
                          {(() => {
                            if (!cvId) {
                              return <span style={{ fontSize:11.5, color:'#cbd5e1', fontStyle:'italic' }}>—</span>;
                            }
                            const cmFinal = cvAffiche.controle_medical;
                            if (!cmFinal && controleMap[cvId] === undefined) checkControle(cvId);
                            if (cmFinal) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => ouvrirFichier(cmFinal, cvAffiche, medecinListeRh)}
                                  style={{
                                    display:'inline-flex',
                                    alignItems:'center',
                                    gap:5,
                                    padding:'6px 11px',
                                    border:'none',
                                    borderRadius:7,
                                    background:`linear-gradient(135deg,${RH_C.primary},${RH_C.accent})`,
                                    color:'white',
                                    fontSize:11,
                                    fontWeight:700,
                                    cursor:'pointer',
                                    whiteSpace:'nowrap',
                                    boxShadow:'0 2px 8px rgba(2,132,199,.25)',
                                    fontFamily:'inherit',
                                  }}
                                >
                                  <Ico.Download /> Contrôle
                                </button>
                              );
                            }
                            if (controleMap[cvId] === null) return <span style={{ fontSize:11.5, color:'#94a3b8' }}>…</span>;
                            return <span style={{ fontSize:11.5, color:'#cbd5e1', fontStyle:'italic' }}>—</span>;
                          })()}
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <button
                            type="button"
                            title="Voir le détail"
                            disabled={!cvId}
                            onClick={() => cvId && setVoirCV(cvAffiche)}
                            style={{
                              display:'inline-flex',
                              alignItems:'center',
                              padding:'5px 9px',
                              border:`1.5px solid ${RH_C.primary}`,
                              background:'white',
                              color: RH_C.primary,
                              borderRadius:6,
                              cursor: cvId ? 'pointer' : 'not-allowed',
                              opacity: cvId ? 1 : 0.45,
                              fontFamily:'inherit',
                            }}
                          >
                            <Ico.Eye />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {voirCV && (
        <DrawerVoirCV
          cv={voirCV}
          medecinNom={medecinListeRh}
          readOnly
          onClose={() => setVoirCV(null)}
          onEdit={() => {}}
        />
      )}

      {/* ── Modales ── */}
      {showConfirmSubmit && (
        <Modal onClose={() => setShowConfirmSubmit(false)}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Soumettre la liste ?</div>
          <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>
            La liste <strong>{detail.reference}</strong> avec <strong>{lignes.length}</strong> collaborateur(s) sera envoyée à l'infirmier pour assignation d'un médecin contrôleur.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setShowConfirmSubmit(false)} style={{ ...btn, background:'#f1f5f9', color:'#64748b' }}>Annuler</button>
            <button onClick={handleSubmit} style={{ ...btn, background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', boxShadow:'0 4px 12px rgba(21,128,61,.25)' }}>
              <Ico.Send /> Soumettre
            </button>
          </div>
        </Modal>
      )}

      {showConfirmDelete && (
        <Modal onClose={() => setShowConfirmDelete(false)}>
          <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Supprimer cette liste ?</div>
          <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Cette action est irréversible.</div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setShowConfirmDelete(false)} style={{ ...btn, background:'#f1f5f9', color:'#64748b' }}>Annuler</button>
            <button onClick={handleDelete} style={{ ...btn, background:'#dc2626', color:'white' }}><Ico.Trash /> Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VUE ARCHIVES RH (filtres année / mois — même logique embauche / SMS)
══════════════════════════════════════════════════════════════ */
function VueArchivesRh({
  listesArchivees,
  listesArchiveesFiltrees,
  filtresArchivesActifs,
  filtreArchiveAnnee,
  setFiltreArchiveAnnee,
  filtreArchiveMois,
  setFiltreArchiveMois,
  anneesPourFiltreArchive,
  onResetFiltres,
  onOpenListe,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4338ca', flexWrap: 'wrap' }}>
        <Ico.Archive />
        <span style={{ fontSize: 14, fontWeight: 800 }}>Archives contre-visites</span>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          — {listesArchiveesFiltrees.length} liste{listesArchiveesFiltrees.length !== 1 ? 's' : ''}
          {filtresArchivesActifs
            ? ` affichée${listesArchiveesFiltrees.length !== 1 ? 's' : ''} sur ${listesArchivees.length}`
            : ''}{' '}
          (statut Archivée · visites à partir de {ANNEE_MIN_ARCHIVES_RH})
        </span>
      </div>
      <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: '#4338ca', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ico.Archive />
        Listes au statut <strong>Archivée</strong> dont la date de visite est en {ANNEE_MIN_ARCHIVES_RH} ou après (ou sans date renseignée).
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 12,
          padding: '12px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="rh-cv-arch-annee" style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Année</label>
          <select
            id="rh-cv-arch-annee"
            value={filtreArchiveAnnee}
            onChange={(e) => setFiltreArchiveAnnee(e.target.value)}
            style={{
              minWidth: 120,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontFamily: 'inherit',
              color: '#0f172a',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="">Toutes les années</option>
            {anneesPourFiltreArchive.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="rh-cv-arch-mois" style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Mois</label>
          <select
            id="rh-cv-arch-mois"
            value={filtreArchiveMois}
            onChange={(e) => setFiltreArchiveMois(e.target.value)}
            style={{
              minWidth: 160,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontFamily: 'inherit',
              color: '#0f172a',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="">Tous les mois</option>
            {MOIS_FILTRE.map(({ n, lbl }) => (
              <option key={n} value={String(n)}>{lbl}</option>
            ))}
          </select>
        </div>
        {filtresArchivesActifs && (
          <button
            type="button"
            onClick={onResetFiltres}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #c7d2fe',
              background: 'white',
              color: '#4338ca',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              alignSelf: 'flex-end',
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Référence', 'Date visite', 'Statut', 'SMS veille', 'Collaborateurs', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listesArchiveesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    {listesArchivees.length === 0
                      ? 'Aucune liste archivée. Une liste clôturée peut être archivée depuis l’onglet Listes actives ou depuis le détail.'
                      : 'Aucune liste ne correspond aux filtres année / mois.'}
                  </td>
                </tr>
              ) : (
                listesArchiveesFiltrees.map((liste, i) => (
                  <tr key={liste.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafcff' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 13, letterSpacing: '.3px' }}>{liste.reference || `CV-${liste.id}`}</span>
                    </td>
                    <td style={{ padding: '13px 16px', color: '#64748b', fontSize: 12.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Ico.Calendar />
                        {fmtDate(liste.date_visite)}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}><StatutBadge statut={liste.statut} /></td>
                    <td style={{ padding:'13px 16px' }}>
                      {isSmsVeilleEnvoye(liste) ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#ecfdf5', color: '#15803d', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                          SMS veille ✓
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12.5 }}>
                        <Ico.Users />
                        <strong style={{ color: '#0f172a' }}>{liste.nombre_collaborateurs || 0}</strong> collab.
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        type="button"
                        onClick={() => onOpenListe(liste)}
                        style={{ ...btn, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 14px', fontSize: 12 }}
                      >
                        Ouvrir →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal wrapper ─────────────────────────────────────── */
function Modal({ children, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:16, padding:28, maxWidth:420, width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,.25)', textAlign:'center' }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function ContreVisitesRH() {
  const [listes, setListes]                     = useState([]);
  const [listesArchivees, setListesArchivees]   = useState([]);
  const [rhCvTab, setRhCvTab]                   = useState('actives');
  const [filtreArchiveAnnee, setFiltreArchiveAnnee] = useState('');
  const [filtreArchiveMois, setFiltreArchiveMois] = useState('');
  const [archivingId, setArchivingId]           = useState(null);
  const [listeSelectionnee, setListeSelectionnee] = useState(null);
  const [vueCourante, setVueCourante]           = useState('liste');
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [filterStatut, setFilterStatut]         = useState(null);

  const loadListes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getListes();
      const arr = Array.isArray(data) ? data : [];
      setListes(arr.filter((l) => String(l.statut || '').toUpperCase() !== 'ARCHIVEE'));
      try {
        const arRaw = await getListes({ archived: true });
        const ar = Array.isArray(arRaw) ? arRaw : [];
        setListesArchivees(ar.filter((l) => l.statut === 'ARCHIVEE').filter(visiteArchiveRHAffichable));
      } catch {
        setListesArchivees([]);
      }
    } catch {
      setError('Impossible de charger les listes.');
      setListes([]);
      setListesArchivees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const anneesPourFiltreArchive = useMemo(() => {
    const ys = new Set();
    const y0 = new Date().getFullYear();
    for (let y = Math.max(y0, ANNEE_MIN_ARCHIVES_RH); y >= ANNEE_MIN_ARCHIVES_RH; y -= 1) ys.add(y);
    listesArchivees.forEach((l) => {
      if (!l?.date_visite) return;
      const d = new Date(l.date_visite);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() >= ANNEE_MIN_ARCHIVES_RH) ys.add(d.getFullYear());
    });
    return Array.from(ys).sort((a, b) => b - a);
  }, [listesArchivees]);

  const listesArchiveesFiltrees = useMemo(
    () => listesArchivees.filter((l) => archiveListeMatchesDate(l, filtreArchiveAnnee, filtreArchiveMois)),
    [listesArchivees, filtreArchiveAnnee, filtreArchiveMois],
  );

  const filtresArchivesActifs = !!(filtreArchiveAnnee || filtreArchiveMois);

  useEffect(() => { loadListes(); }, [loadListes]);

  const handleArchiver = async (l) => {
    if (!l?.id || l.statut !== 'CLOTUREE') return;
    const refTxt = String(l.reference || `CV-${l.id}`).trim();
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Archiver cette liste ?',
      html:
        `<p style="text-align:left;margin:0">La liste <strong>${refTxt}</strong> passera en statut <strong>Archivée</strong>.</p>`
        + '<p style="text-align:left;margin:12px 0 0;font-size:13px;color:#64748b">Elle n’apparaîtra plus dans les listes actives (infirmier / médecin contrôleur) et sera consultable sous l’onglet <strong>Archives</strong>.</p>',
      showCancelButton: true,
      confirmButtonText: 'Archiver',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#4338ca',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setArchivingId(l.id);
    try {
      await archiverListeContreVisite(l.id);
      await loadListes();
      setRhCvTab('archives');
      if (listeSelectionnee && String(listeSelectionnee.id) === String(l.id)) {
        setListeSelectionnee(null);
        setVueCourante('liste');
      }
      await Swal.fire({ icon: 'success', title: 'Liste archivée', text: `La liste ${refTxt} a été archivée.`, timer: 2200, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'Archivage',
        text: formatAxiosError(e) || String(e.response?.data?.detail || e.response?.data?.error || e.message || 'Erreur lors de l’archivage.'),
      });
    } finally {
      setArchivingId(null);
    }
  };

  const handleOpenListe = async (liste) => {
    try {
      const detail = await getListeDetail(liste.id);
      setListeSelectionnee(detail);
      setVueCourante('detail');
    } catch {
      setError('Impossible d\'ouvrir cette liste.');
    }
  };

  const handleBack = () => {
    setListeSelectionnee(null);
    setVueCourante('liste');
    loadListes();
  };

  const handleUpdated = (updatedListe) => {
    setListes((prev) => prev.map((x) => (x.id === updatedListe.id ? updatedListe : x)));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'16px 20px', gap:0 }}>
      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 16px', borderRadius:9, marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13, flexShrink:0 }}>
          <span style={{ display:'flex', alignItems:'center', gap:7 }}><Ico.Alert /> {error}</span>
          <button onClick={() => setError('')} style={{ background:'none', border:'none', color:'#b91c1c', cursor:'pointer', fontWeight:700, fontSize:15 }}>✕</button>
        </div>
      )}

      <div style={{ flex:1, minHeight:0 }}>
        {vueCourante === 'liste' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setRhCvTab('actives')}
                style={{
                  ...btn,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: rhCvTab === 'actives' ? '1.5px solid #1d4ed8' : '1px solid #e2e8f0',
                  background: rhCvTab === 'actives' ? '#eff6ff' : 'white',
                  color: rhCvTab === 'actives' ? '#1d4ed8' : '#64748b',
                  fontSize: 13,
                }}
              >
                Listes actives
              </button>
              <button
                type="button"
                onClick={() => setRhCvTab('archives')}
                style={{
                  ...btn,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: rhCvTab === 'archives' ? '1.5px solid #4338ca' : '1px solid #e2e8f0',
                  background: rhCvTab === 'archives' ? '#eef2ff' : 'white',
                  color: rhCvTab === 'archives' ? '#4338ca' : '#64748b',
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ico.Archive />
                Archives
                <span style={{ fontSize: 11, opacity: 0.85 }}>({listesArchivees.length})</span>
              </button>
            </div>
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                  Chargement…
                </div>
              </div>
            ) : rhCvTab === 'actives' ? (
              <VueListe
                listes={listes}
                loading={false}
                filterStatut={filterStatut}
                onFilterChange={setFilterStatut}
                onNewListe={() => { setRhCvTab('actives'); setVueCourante('nouvelle'); }}
                onOpenListe={handleOpenListe}
                onArchiver={handleArchiver}
                archivingId={archivingId}
              />
            ) : (
              <VueArchivesRh
                listesArchivees={listesArchivees}
                listesArchiveesFiltrees={listesArchiveesFiltrees}
                filtresArchivesActifs={filtresArchivesActifs}
                filtreArchiveAnnee={filtreArchiveAnnee}
                setFiltreArchiveAnnee={setFiltreArchiveAnnee}
                filtreArchiveMois={filtreArchiveMois}
                setFiltreArchiveMois={setFiltreArchiveMois}
                anneesPourFiltreArchive={anneesPourFiltreArchive}
                onResetFiltres={() => { setFiltreArchiveAnnee(''); setFiltreArchiveMois(''); }}
                onOpenListe={handleOpenListe}
              />
            )}
          </div>
        )}
        {vueCourante === 'nouvelle' && <VueCreation onCreated={liste => { setListes(p => [liste, ...p]); setListeSelectionnee(liste); setVueCourante('detail'); setRhCvTab('actives'); }} onCancel={() => setVueCourante('liste')} />}
        {vueCourante === 'detail' && listeSelectionnee && (
          <VueDetail
            liste={listeSelectionnee}
            onBack={handleBack}
            onUpdated={handleUpdated}
            onArchiver={handleArchiver}
            archivingId={archivingId}
          />
        )}
      </div>
    </div>
  );
}