// src/components/infirmier/FichesAptitudeInfirmier.jsx
// Consultation fiches d'aptitude — Infirmier
// Filtres : type visite, année, mois, matricule
// Liste : collaborateurs réels (endpoint infirmier) — pas les fiches embauche sans ressource RH/im_db
// Remarque + Ré-évaluation : PATCH API sauvegarder_remarque (plus localStorage comme secours d’affichage)
// Export Excel coloré

import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx-js-style/dist/xlsx.bundle.js';
import {
  getFichesAptitudeInfirmier,
  sauvegarderRemarqueInfirmier,
} from '../../api/Medicalworkapi';
import { uiAlert } from '../../utils/uiAlert';

/* ─── Constantes ─────────────────────────────────────────── */
const TYPE_LABELS = {
  EMBAUCHE:   'Embauche',
  PERIODIQUE: 'Périodique',
  REPRISE:    'Reprise',
  SPONTANEE:  'Spontanée',
};

const APTITUDE_LABELS = {
  APTE_AU_POSTE:                 'Apte au poste',
  APTE_AMENAGEMENT_POSTE:        'Apte (aménagement poste)',
  INAPTE_TEMPORAIRE:             'Inapte temporaire',
  INAPTE_DEFINITIF_MEME_POSTE:   'Inapte définitif (même poste)',
  INAPTE_DEFINITIF_ENTREPRISE:   'Inapte définitif (entreprise)',
};

const APTITUDE_COLORS = {
  APTE_AU_POSTE:               { bg:'#dcfce7', color:'#166534', border:'#bbf7d0' },
  APTE_AMENAGEMENT_POSTE:      { bg:'#fef9c3', color:'#854d0e', border:'#fde68a' },
  INAPTE_TEMPORAIRE:           { bg:'#ffedd5', color:'#9a3412', border:'#fed7aa' },
  INAPTE_DEFINITIF_MEME_POSTE: { bg:'#fee2e2', color:'#991b1b', border:'#fecaca' },
  INAPTE_DEFINITIF_ENTREPRISE: { bg:'#fee2e2', color:'#991b1b', border:'#fecaca' },
};

const TYPE_COLORS = {
  EMBAUCHE:   { bg:'#dbeafe', color:'#1e40af', border:'#bfdbfe' },
  PERIODIQUE: { bg:'#e0f2fe', color:'#075985', border:'#bae6fd' },
  REPRISE:    { bg:'#fae8ff', color:'#86198f', border:'#f0abfc' },
  SPONTANEE:  { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0' },
};

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const YEARS = (() => {
  const y = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => y - i);
})();

const LS_KEY = 'infirmier_fiches_notes';

/* ─── Remarques infirmier (API + ancien cache local) ─────── */
function loadNotesLegacy() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}

/**
 * Le backend peut renvoyer soit des chaînes, soit un objet imbriqué du type
 * { id, remarque, reevaluation, date_creation, date_modification }.
 * React ne peut afficher que des chaînes — on normalise toujours en string.
 */
function infirmierNotesFromFiche(f) {
  if (!f || typeof f !== 'object') return { remarque: '', reevaluation: '' };

  const nested =
    typeof f.remarque === 'object' && f.remarque !== null && 'remarque' in f.remarque
      ? f.remarque
      : typeof f.remarque_infirmier === 'object' && f.remarque_infirmier !== null && 'remarque' in f.remarque_infirmier
        ? f.remarque_infirmier
        : typeof f.remarque_infirmiere === 'object' && f.remarque_infirmiere !== null && 'remarque' in f.remarque_infirmiere
          ? f.remarque_infirmiere
          : null;

  if (nested) {
    return {
      remarque: String(nested.remarque ?? ''),
      reevaluation: String(nested.reevaluation ?? ''),
    };
  }

  const r = f.remarque_infirmier ?? f.remarque_infirmiere ?? f.remarque_infirmier_text ?? f.remarque;
  const e = f.reevaluation_infirmier ?? f.reevaluation ?? f.re_evaluation ?? f.reevaluation_text;
  return {
    remarque: typeof r === 'string' ? r : '',
    reevaluation: typeof e === 'string' ? e : '',
  };
}

function unwrapNestedRemarque(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && typeof v.remarque === 'string') return v.remarque;
  return '';
}
function unwrapNestedReeval(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && typeof v.reevaluation === 'string') return v.reevaluation;
  return '';
}

function mergeNotesFromServer(fiches, legacyById) {
  const out = {};
  for (const f of fiches) {
    const fromApi = infirmierNotesFromFiche(f);
    const leg = legacyById[f.id] || {};
    out[f.id] = {
      remarque: fromApi.remarque || unwrapNestedRemarque(leg.remarque) || '',
      reevaluation: fromApi.reevaluation || unwrapNestedReeval(leg.reevaluation) || '',
    };
  }
  return out;
}

/* ─── Format ─────────────────────────────────────────────── */
const fmt = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

/* ─── Icônes ─────────────────────────────────────────────── */
const IcoSearch = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoExcel = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
);
const IcoRefresh = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IcoClose = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoClipboard = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
);
const IcoSave = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

/* ─── Badges ─────────────────────────────────────────────── */
function AptitudeBadge({ val }) {
  const s = APTITUDE_COLORS[val] || { bg:'#f1f5f9', color:'#475569', border:'#e2e8f0' };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {APTITUDE_LABELS[val] || val || '—'}
    </span>
  );
}
function TypeBadge({ val }) {
  const s = TYPE_COLORS[val] || { bg:'#f1f5f9', color:'#475569', border:'#e2e8f0' };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
    }}>
      {TYPE_LABELS[val] || val || '—'}
    </span>
  );
}

/* ─── Cellule éditable inline ────────────────────────────── */
function EditableCell({ field, value, placeholder, onPersist }) {
  const safeValue = field === 'remarque' ? unwrapNestedRemarque(value) : unwrapNestedReeval(value);
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(safeValue);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setLocal(safeValue); }, [safeValue]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const handleSave = async () => {
    setErr('');
    setSaving(true);
    try {
      await onPersist(field, local);
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (e) {
      const d = e?.response?.data;
      const msg =
        (typeof d === 'string' && d) ||
        d?.detail ||
        d?.error ||
        (d && typeof d === 'object' ? JSON.stringify(d) : null) ||
        e?.message ||
        'Erreur enregistrement';
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setLocal(safeValue); setEditing(false); setErr(''); }
  };

  if (editing) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:140 }}>
        <textarea
          ref={inputRef}
          value={local}
          onChange={e => setLocal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={saving}
          style={{
            width:'100%', padding:'5px 8px', borderRadius:7,
            border:'1.5px solid #38bdf8', outline:'none', resize:'vertical',
            fontSize:12, fontFamily:'inherit', color:'#1e293b',
            background:'#f0f9ff', boxSizing:'border-box',
            boxShadow:'0 0 0 3px rgba(56,189,248,.15)',
            opacity: saving ? 0.7 : 1,
          }}
        />
        {err && (
          <div style={{ fontSize:10, color:'#b91c1c', fontWeight:600 }}>{err}</div>
        )}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          <button type="button" onClick={handleSave} disabled={saving} style={{
            display:'flex', alignItems:'center', gap:4,
            background: saving ? '#94a3b8' : 'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white',
            border:'none', borderRadius:6, padding:'4px 10px',
            fontSize:11, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            <IcoSave /> {saving ? '…' : 'Enregistrer'}
          </button>
          <button type="button" disabled={saving} onClick={() => { setLocal(safeValue); setEditing(false); setErr(''); }} style={{
            background:'#f1f5f9', color:'#64748b', border:'none',
            borderRadius:6, padding:'4px 8px', fontSize:11, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            <IcoClose />
          </button>
        </div>
      </div>
    );
  }

  const display = safeValue;
  return (
    <div
      onClick={() => !saving && setEditing(true)}
      title="Cliquer pour modifier"
      style={{
        minHeight: 32, minWidth: 120, padding:'5px 8px', borderRadius:7,
        border: '1.5px dashed ' + (display ? '#7dd3fc' : '#cbd5e1'),
        background: display ? '#f0f9ff' : 'transparent',
        cursor:'text', fontSize:12, color: display ? '#0369a1' : '#94a3b8',
        fontStyle: display ? 'normal' : 'italic',
        transition:'all .15s',
        display:'flex', alignItems:'flex-start', gap:6,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#38bdf8'; e.currentTarget.style.background='#f0f9ff'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = display ? '#7dd3fc' : '#cbd5e1'; e.currentTarget.style.background = display ? '#f0f9ff' : 'transparent'; }}
    >
      {savedFlash ? (
        <span style={{ color:'#16a34a', fontSize:11, fontWeight:700 }}>✓ Enregistré</span>
      ) : (
        <>
          <span style={{ flex:1, whiteSpace:'pre-wrap', wordBreak:'break-word', lineHeight:1.4 }}>
            {display || placeholder}
          </span>
          <span style={{ opacity:.35, fontSize:10, flexShrink:0, marginTop:2 }}>✏</span>
        </>
      )}
    </div>
  );
}

/* ─── Export Excel (xlsx-js-style = en-têtes / couleurs réellement écrits dans le .xlsx) ─ */
function exportToExcel(fiches, notes, filters) {
  const rows = fiches.map((f, idx) => ({
    'N°':            idx + 1,
    'Matricule':     f.collaborateur_matricule || f.matricule || '',
    'Nom & Prénom':  f.collaborateur_nom || '',
    'Poste':         f.collaborateur_poste || '',
    'Date Visite':   f.date_visite || '',
    'Type Visite':   TYPE_LABELS[f.type_visite] || f.type_visite || '',
    'Aptitude':      APTITUDE_LABELS[f.aptitude] || f.aptitude || '',
    'Médecin':       f.medecin_nom || '',
    'Remarque':      unwrapNestedRemarque(notes[f.id]?.remarque) || '',
    'Ré-évaluation': unwrapNestedReeval(notes[f.id]?.reevaluation) || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    {wch:5},{wch:14},{wch:26},{wch:22},{wch:14},
    {wch:14},{wch:28},{wch:22},{wch:32},{wch:32},
  ];

  /** En-têtes : bleu uniforme (ARGB pour Excel), texte blanc */
  const HEADER_BLUE = 'FF2E75B6';
  const HEADER_BORDER = 'FF1D4ED8';
  const HEADER_FONT = 'FFFFFFFF';

  const headers = Object.keys(rows[0] || {});
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  headers.forEach((h, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) return;
    ws[addr].s = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: HEADER_BLUE },
      },
      font: { bold: true, color: { rgb: HEADER_FONT }, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top:    { style: 'thin', color: { rgb: HEADER_BORDER } },
        bottom: { style: 'thin', color: { rgb: HEADER_BORDER } },
        left:   { style: 'thin', color: { rgb: HEADER_BORDER } },
        right:  { style: 'thin', color: { rgb: HEADER_BORDER } },
      },
    };
  });

  /* Pas de style sur les lignes de données — uniquement les titres ci-dessus */
  ws['!rows'] = [{ hpt: 22 }, ...Array(range.e.r).fill({ hpt: 18 })];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fiches Aptitude');

  const parts = ['Fiches_Aptitude'];
  if (filters.typeVisite) parts.push(TYPE_LABELS[filters.typeVisite] || filters.typeVisite);
  if (filters.annee)      parts.push(String(filters.annee));
  if (filters.mois)       parts.push(`M${String(filters.mois).padStart(2,'0')}`);
  if (filters.search)     parts.push(`Mat-${filters.search}`);

  XLSX.writeFile(wb, parts.join('_') + '.xlsx');
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function FichesAptitudeInfirmier() {
  const [allFiches,  setAllFiches]  = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [exporting,  setExporting]  = useState(false);
  const [notes,      setNotes]      = useState({});

  const [typeVisite,  setTypeVisite]  = useState('');
  const [annee,       setAnnee]       = useState('');
  const [mois,        setMois]        = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const searchTimer = useRef(null);
  const notesRef = useRef({});

  useEffect(() => { notesRef.current = notes; }, [notes]);

  /* Chargement : liste infirmier uniquement (collaborateurs réels côté API) */
  const loadFiches = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getFichesAptitudeInfirmier();
      const arr = Array.isArray(data) ? data : [];
      setAllFiches(arr);
      setNotes(mergeNotesFromServer(arr, loadNotesLegacy()));
    } catch {
      setError("Impossible de charger les fiches d'aptitude.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFiches(); }, [loadFiches]);

  const persistInfirmierNotes = useCallback(async (ficheId, field, newText) => {
    const cur = notesRef.current[ficheId] || { remarque: '', reevaluation: '' };
    const remarque = field === 'remarque' ? newText : unwrapNestedRemarque(cur.remarque);
    const reevaluation = field === 'reevaluation' ? newText : unwrapNestedReeval(cur.reevaluation);
    const data = await sauvegarderRemarqueInfirmier(ficheId, { remarque, reevaluation });
    const next = { remarque, reevaluation };
    setNotes((prev) => ({ ...prev, [ficheId]: next }));
    setAllFiches((prev) =>
      prev.map((f) => {
        if (f.id !== ficheId) return f;
        const merged = { ...f, ...(data && typeof data === 'object' ? data : {}) };
        const flat = infirmierNotesFromFiche(merged);
        return { ...merged, remarque: flat.remarque, reevaluation: flat.reevaluation };
      })
    );
  }, []);

  /* Filtrage client (matricule sur la liste infirmier) */
  useEffect(() => {
    let res = [...allFiches];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      res = res.filter((f) => {
        const m = String(f.collaborateur_matricule || f.matricule || '').toLowerCase();
        return m.includes(q);
      });
    }
    if (typeVisite) res = res.filter(f => f.type_visite === typeVisite);
    if (annee)      res = res.filter(f => f.date_visite && new Date(f.date_visite).getFullYear() === Number(annee));
    if (mois)       res = res.filter(f => f.date_visite && new Date(f.date_visite).getMonth() + 1 === Number(mois));
    setFiltered(res);
  }, [allFiches, typeVisite, annee, mois, search]);

  /* Debounce recherche */
  const handleSearchChange = (v) => {
    setSearchInput(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 500);
  };

  const resetFilters = () => {
    setTypeVisite(''); setAnnee(''); setMois('');
    setSearch(''); setSearchInput('');
  };

  const hasFilters = typeVisite || annee || mois || search;

  const handleExport = () => {
    if (!filtered.length) return;
    setExporting(true);
    try {
      exportToExcel(filtered, notes, { typeVisite, annee, mois, search });
    } catch {
      uiAlert({ icon: 'error', title: 'Export', text: "Erreur lors de l'export Excel." });
    } finally {
      setExporting(false);
    }
  };

  const sel = {
    padding: '7px 10px', borderRadius: 8, border: '1.5px solid #bae6fd',
    fontSize: 12.5, color: '#0c4a6e', background: 'white',
    cursor: 'pointer', outline: 'none', fontFamily: 'inherit', fontWeight: 600,
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100%',
      fontFamily:"'Inter','Segoe UI',sans-serif",
      background: '#f0f9ff',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)',
        borderBottom: '1.5px solid #bae6fd',
        padding: '18px 22px', flexShrink: 0,
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:46, height:46, borderRadius:12, flexShrink:0,
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', boxShadow:'0 4px 12px rgba(14,165,233,.3)',
          }}>
            <IcoClipboard />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:'#0c4a6e', letterSpacing:-.3 }}>
              Fiches d'aptitude
            </div>
            <div style={{ fontSize:12, color:'#0369a1', marginTop:1 }}>
              {loading ? 'Chargement…' : (
                <>
                  <b style={{color:'#0284c7'}}>{filtered.length}</b>
                  {allFiches.length !== filtered.length && ` / ${allFiches.length}`}
                  {' '}fiche{filtered.length !== 1 ? 's' : ''} — lecture et saisie infirmier
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:9 }}>
          <button onClick={loadFiches} disabled={loading} style={{
            display:'flex', alignItems:'center', gap:7,
            background:'white', color:'#0284c7', border:'1.5px solid #bae6fd',
            borderRadius:9, padding:'8px 14px', fontSize:12.5, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow:'0 2px 6px rgba(14,165,233,.1)',
          }}>
            <IcoRefresh /> Actualiser
          </button>
          <button onClick={handleExport} disabled={exporting || !filtered.length} style={{
            display:'flex', alignItems:'center', gap:7,
            background: filtered.length ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e2e8f0',
            color: filtered.length ? 'white' : '#94a3b8',
            border:'none', borderRadius:9, padding:'8px 18px',
            fontSize:12.5, fontWeight:700,
            cursor: filtered.length ? 'pointer' : 'not-allowed',
            boxShadow: filtered.length ? '0 4px 12px rgba(34,197,94,.28)' : 'none',
          }}>
            <IcoExcel />
            {exporting ? 'Export…' : `Exporter Excel (${filtered.length})`}
          </button>
        </div>
      </div>

      {/* ── BARRE FILTRES ── */}
      <div style={{
        padding: '12px 22px', background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
        borderBottom: '1.5px solid #bae6fd', flexShrink: 0,
        display:'flex', flexWrap:'wrap', gap:10, alignItems:'center',
      }}>

        {/* Recherche matricule */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'white', border:'1.5px solid #bae6fd',
          borderRadius:9, padding:'7px 12px',
          flex:'1', minWidth:180, maxWidth:240,
          boxShadow:'0 1px 4px rgba(14,165,233,.08)',
        }}>
          <span style={{color:'#38bdf8'}}><IcoSearch /></span>
          <input
            type="text"
            placeholder="Matricule collaborateur…"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            style={{
              border:'none', outline:'none', background:'transparent',
              fontSize:12.5, color:'#0c4a6e', width:'100%',
              fontFamily:'inherit', fontWeight:500,
            }}
          />
        </div>

        <div style={{ width:1, height:28, background:'#bae6fd', flexShrink:0 }} />

        {/* Type visite */}
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:12, color:'#0369a1', fontWeight:700 }}>Type</span>
          <select value={typeVisite} onChange={e => setTypeVisite(e.target.value)} style={sel}>
            <option value="">Tous</option>
            {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Année */}
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:12, color:'#0369a1', fontWeight:700 }}>Année</span>
          <select value={annee} onChange={e => setAnnee(e.target.value)} style={sel}>
            <option value="">Toutes</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Mois */}
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:12, color:'#0369a1', fontWeight:700 }}>Mois</span>
          <select value={mois} onChange={e => setMois(e.target.value)} style={sel}>
            <option value="">Tous</option>
            {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>

        {/* Reset */}
        {hasFilters && (
          <button onClick={resetFilters} style={{
            display:'flex', alignItems:'center', gap:5,
            background:'#fee2e2', color:'#dc2626',
            border:'1px solid #fecaca', borderRadius:8,
            padding:'7px 12px', fontSize:12, fontWeight:700, cursor:'pointer',
          }}>
            <IcoClose /> Réinitialiser
          </button>
        )}
      </div>

      {/* ── TABLEAU ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>

        {error && (
          <div style={{
            background:'#fee2e2', color:'#991b1b', border:'1px solid #fecaca',
            borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:13, fontWeight:600,
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#0369a1' }}>
            <div style={{ fontSize:30, marginBottom:10 }}>⏳</div>
            <div style={{ fontWeight:600, fontSize:14 }}>Chargement des fiches…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign:'center', padding:60,
            background:'white', borderRadius:16,
            border:'1.5px dashed #bae6fd',
          }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:15, color:'#0369a1', marginBottom:6 }}>
              Aucune fiche trouvée
            </div>
            {hasFilters && (
              <button onClick={resetFilters} style={{
                color:'#0284c7', background:'none', border:'none',
                cursor:'pointer', fontWeight:700, fontSize:13,
                textDecoration:'underline',
              }}>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div style={{
            background:'white', borderRadius:14,
            border:'1.5px solid #bae6fd',
            overflow:'hidden',
            boxShadow:'0 2px 12px rgba(14,165,233,.1)',
          }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead>
                  <tr style={{
                    background:'linear-gradient(135deg,#e0f2fe,#bae6fd)',
                    borderBottom:'2px solid #7dd3fc',
                  }}>
                    {[
                      { label:'#', note:false },
                      { label:'Matricule', note:false },
                      { label:'Nom & Prénom', note:false },
                      { label:'Poste', note:false },
                      { label:'Date Visite', note:false },
                      { label:'Type Visite', note:false },
                      { label:'Aptitude', note:false },
                      { label:'Médecin', note:false },
                      { label:'Remarque', note:true },
                      { label:'Ré-évaluation', note:true },
                    ].map(({ label, note }) => (
                      <th key={label} style={{
                        padding:'10px 14px', textAlign:'left',
                        fontWeight:800, color:'#0c4a6e',
                        fontSize:11.5, letterSpacing:.3,
                        textTransform:'uppercase', whiteSpace:'nowrap',
                      }}>
                        {note ? (
                          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                            {label}
                            <span style={{
                              background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
                              color:'white', fontSize:9, fontWeight:700,
                              padding:'1px 6px', borderRadius:4,
                              letterSpacing:0, textTransform:'none',
                            }}>
                              SAISIE
                            </span>
                          </span>
                        ) : label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((fiche, idx) => (
                    <tr key={fiche.id}
                      style={{
                        borderBottom:'1px solid #e0f2fe',
                        background: idx % 2 === 0 ? 'white' : '#f8fcff',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f8fcff'}
                    >
                      <td style={{ padding:'10px 14px', color:'#94a3b8', fontSize:12, width:36 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{
                          fontFamily:'monospace', fontWeight:700, color:'#0369a1',
                          fontSize:12.5, background:'#e0f2fe', padding:'2px 8px', borderRadius:6,
                        }}>
                          {fiche.collaborateur_matricule || fiche.matricule || '—'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px', fontWeight:600, color:'#1e293b' }}>
                        {fiche.collaborateur_nom || '—'}
                      </td>
                      <td style={{ padding:'10px 14px', color:'#475569', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {fiche.collaborateur_poste || '—'}
                      </td>
                      <td style={{ padding:'10px 14px', color:'#0369a1', fontWeight:600, whiteSpace:'nowrap' }}>
                        {fmt(fiche.date_visite)}
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <TypeBadge val={fiche.type_visite} />
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <AptitudeBadge val={fiche.aptitude} />
                      </td>
                      <td style={{ padding:'10px 14px', color:'#475569' }}>
                        {fiche.medecin_nom || '—'}
                      </td>
                      <td style={{ padding:'8px 10px', minWidth:150, maxWidth:210 }}>
                        <EditableCell
                          field="remarque"
                          value={notes[fiche.id]?.remarque}
                          placeholder="Ajouter remarque…"
                          onPersist={(fld, txt) => persistInfirmierNotes(fiche.id, fld, txt)}
                        />
                      </td>
                      <td style={{ padding:'8px 10px', minWidth:150, maxWidth:210 }}>
                        <EditableCell
                          field="reevaluation"
                          value={notes[fiche.id]?.reevaluation}
                          placeholder="Ré-évaluation…"
                          onPersist={(fld, txt) => persistInfirmierNotes(fiche.id, fld, txt)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{
              padding:'10px 16px',
              background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
              borderTop:'1.5px solid #bae6fd', fontSize:12, color:'#0369a1',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <span style={{ fontWeight:600 }}>
                {filtered.length} fiche{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
                {allFiches.length !== filtered.length && ` (sur ${allFiches.length} au total)`}
              </span>
              <span style={{ fontSize:11, color:'#7dd3fc', fontStyle:'italic' }}>
                💡 Saisie puis Enregistrer — enregistrement serveur (base)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}