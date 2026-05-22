// src/components/infirmier/Transferturgence.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { printHTML } from '../../utils/printHelper';
import {
  creerTransfertUrgence,
  modifierTransfertUrgence,
  supprimerTransfertUrgence,
  creerOrdreTransport,
  modifierOrdreTransport,
  supprimerOrdreTransport,
  searchCollaborateurs,
  getCollaborateurById,
  getMedecins,
} from '../../api/actInfirmierApi';
import axiosInstance from '../../api/axios';
import { isSmsChauffeurEnvoye } from '../../utils/transfertUrgenceSms';

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const todayStr = ()  => new Date().toISOString().slice(0, 10);
const nowTime  = ()  => new Date().toTimeString().slice(0, 5);
const MOIS_LABELS = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                     'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const EMPTY_TRANSFERT = {
  collaborateur: '', date: todayStr(), heure: nowTime(),
  chauffeur: '', telephone_chauffeur: '', depart: '', destination: '',
  plant: '', frais_deplacement: '0.00', cost_center: '',
};

/** Valeurs enregistrées en base / PDF (une seule chaîne `moyen_transport`) */
const MOYEN_VOITURE = 'Voiture';
const MOYEN_AMBULANCE = 'Ambulance';

/** @returns {{ type: 'voiture'|'ambulance'|'autre'|'', detail: string }} */
function parseMoyenTransport(str) {
  const s = (str == null ? '' : String(str)).trim();
  if (!s) return { type: '', detail: '' };
  const lower = s.toLowerCase();
  if (lower === 'voiture') return { type: 'voiture', detail: '' };
  if (lower === 'ambulance') return { type: 'ambulance', detail: '' };
  return { type: 'autre', detail: s };
}

function buildMoyenTransport(type, autreDetail) {
  if (type === 'voiture') return MOYEN_VOITURE;
  if (type === 'ambulance') return MOYEN_AMBULANCE;
  if (type === 'autre') return (autreDetail || '').trim();
  return '';
}

/* ─── Icônes SVG professionnelles ─── */
const Ico = {
  Plus: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Pencil: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Close: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Save: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Truck: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/>
      <path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  FileText: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Search: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Print: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Eye: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  ClipboardList: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Building: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  ),
};

/* ─── Styles communs ─── */
const inp = {
  padding:'7px 10px', border:'1.5px solid #bae6fd', borderRadius:7,
  fontSize:12.5, color:'#0c4a6e', background:'white', outline:'none',
  fontFamily:'inherit', width:'100%', boxSizing:'border-box',
};

const Field = ({ label, required, full, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:3, gridColumn: full ? '1/-1' : undefined }}>
    <label style={{ fontSize:10, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.6px' }}>
      {label}
    </label>
    {children}
  </div>
);

const SecTitle = ({ icon, children }) => (
  <div style={{ fontSize:10.5, fontWeight:800, color:'#0284c7', textTransform:'uppercase',
    letterSpacing:'.7px', marginBottom:10, paddingBottom:6, borderBottom:'2px solid #e0f2fe',
    marginTop:4, display:'flex', alignItems:'center', gap:7 }}>
    <span style={{ color:'#0284c7', display:'flex', alignItems:'center' }}>{icon}</span>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════
   MODAL CONFIRMATION SUPPRESSION (réutilisable)
══════════════════════════════════════════════════════ */
function ModalConfirmDelete({ titre, texte, onConfirm, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999 }}
      onClick={onClose}>
      <div style={{ background:'white', borderRadius:14, padding:'28px 28px 22px',
        maxWidth:380, width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,.22)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:18 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#fef2f2', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
            <Ico.AlertTriangle />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0c4a6e', marginBottom:5 }}>
              {titre || 'Confirmer la suppression'}
            </div>
            <div style={{ fontSize:12.5, color:'#64748b', lineHeight:1.6 }}>{texte}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:14,
          borderTop:'1px solid #f1f5f9' }}>
          <button onClick={onClose}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px',
              border:'1.5px solid #cbd5e1', background:'white', color:'#64748b',
              borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
            <Ico.Close /> Annuler
          </button>
          <button onClick={onConfirm}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px',
              border:'none', background:'#dc2626', color:'white',
              borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
            <Ico.Trash /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AUTOCOMPLETE COLLABORATEUR
══════════════════════════════════════════════════════ */
function CollabSearch({ value, nomAffiche, onSelect }) {
  const [query,   setQuery]   = useState(nomAffiche || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [info,    setInfo]    = useState(null);
  const debRef = useRef(null);

  useEffect(() => { if (nomAffiche) setQuery(nomAffiche); }, [nomAffiche]);

  const handleSearch = (val) => {
    setQuery(val); onSelect(null, null); setInfo(null);
    clearTimeout(debRef.current);
    if (!val.trim()) { setResults([]); return; }
    setLoading(true);
    debRef.current = setTimeout(async () => {
      try { setResults(await searchCollaborateurs(val)); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  };

  const handleSelect = async (c) => {
    setQuery(`${c.nom} ${c.prenom}`); setResults([]);
    try {
      const d = await getCollaborateurById(c.id);
      setInfo({ matricule: d.matricule||'', telephone: d.telephone||'', plant: d.plant_section||d.plantSection||'' });
      onSelect(c.id, d);
    } catch { onSelect(c.id, null); }
  };

  return (
    <div>
      <Field label="Collaborateur (malade)">
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#7dd3fc', display:'flex' }}>
            <Ico.Search />
          </span>
          <input value={query} onChange={e => handleSearch(e.target.value)}
            placeholder="Nom, prénom ou matricule…"
            style={{ ...inp, paddingLeft:30, borderColor: value ? '#0ea5e9' : '#bae6fd' }} />
          {value && (
            <span style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', color:'#0ea5e9', display:'flex' }}>
              <Ico.Check />
            </span>
          )}
        </div>
        {loading && <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:4 }}>Recherche en cours…</div>}
        {results.length > 0 && (
          <div style={{ border:'1.5px solid #bae6fd', borderRadius:9, overflow:'hidden', marginTop:4,
            boxShadow:'0 6px 18px rgba(14,165,233,.12)', background:'white', zIndex:10, position:'relative' }}>
            {results.slice(0,5).map((c, idx) => (
              <button key={c.id} onMouseDown={() => handleSelect(c)}
                style={{ width:'100%', textAlign:'left', padding:'9px 13px', border:'none',
                  borderTop: idx > 0 ? '1px solid #f0f9ff' : 'none', background:'white',
                  cursor:'pointer', fontSize:12.5, display:'flex', justifyContent:'space-between', alignItems:'center' }}
                onMouseEnter={e => e.currentTarget.style.background='#f0f9ff'}
                onMouseLeave={e => e.currentTarget.style.background='white'}>
                <span style={{ fontWeight:600, color:'#0c4a6e' }}>{c.nom} {c.prenom}</span>
                <span style={{ color:'#7dd3fc', fontSize:11.5, fontWeight:600 }}>{c.matricule}</span>
              </button>
            ))}
          </div>
        )}
      </Field>
      {info && (
        <div style={{ background:'#f0f9ff', border:'1.5px solid #bae6fd', borderRadius:10,
          padding:'10px 14px', marginTop:8, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[['Matricule', info.matricule], ['Téléphone', info.telephone], ['Plant', info.plant]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize:9.5, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.5px' }}>{k}</div>
              <div style={{ fontSize:12.5, color:'#0c4a6e', fontWeight:600, marginTop:2 }}>{v || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   GÉNÉRATEUR PDF
══════════════════════════════════════════════════════ */
function genererPdfOrdre(transfert, ordre) {
  const numOrdre = String(transfert.num_ordre || '').padStart(6, '0');
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Ordre de Transport N° ${numOrdre}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
      @page { size: A4 landscape; margin: 10mm; }
    }
    .no-print {
      position: fixed; top: 16px; right: 16px;
      padding: 10px 20px; background: #0284c7; color: white;
      border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 700;
    }
    .page {
      width: 297mm; min-height: 180mm; padding: 14mm 14mm;
      display: flex; flex-direction: column;
    }
    .header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10mm;
    }
    .title { font-size: 22pt; font-weight: bold; }
    .num { font-size: 16pt; color: #111; font-weight: bold; }
    .logo {
      font-size: 28pt; font-weight: 900; letter-spacing: 2px;
      color: #111; border: 3px solid #111; padding: 4px 14px;
    }
    table.main {
      width: 100%; border-collapse: collapse; flex: 1;
    }
    table.main td, table.main th {
      border: 1.5px solid #222; padding: 5px 8px; vertical-align: top; font-size: 10pt;
    }
    .label-col { font-weight: bold; background: #f5f5f5; width: 120px; white-space: nowrap; }
    .value-col { min-width: 80px; }
    .sign-row td { height: 22mm; }
    .montant-box { background: #fff9c4; }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Imprimer / Enregistrer PDF</button>
  <div class="page">
    <div class="header">
      <div>
        <div class="title">Ordre de Transport</div>
        <div class="num">N° ${numOrdre}</div>
      </div>
      <div class="logo">LEONI</div>
    </div>
    <table class="main">
      <tbody>
        <tr>
          <td class="label-col">Nom Chauffeur</td>
          <td class="value-col">${transfert.chauffeur || ''}</td>
          <td class="label-col">Moyen de Transport</td>
          <td class="value-col">${ordre.moyen_transport || ''}</td>
          <td rowspan="2" class="label-col" style="text-align:center;vertical-align:middle;font-weight:bold;">Montant Prime</td>
          <td rowspan="2" class="montant-box" style="font-size:13pt;font-weight:bold;text-align:center;vertical-align:middle;">${transfert.frais_deplacement ? parseFloat(transfert.frais_deplacement).toFixed(2) + ' DT' : ''}</td>
        </tr>
        <tr>
          <td class="label-col">Date</td>
          <td>${fmtDate(transfert.date)}</td>
          <td class="label-col">Heure</td>
          <td>${transfert.heure || ''}</td>
        </tr>
        <tr>
          <td class="label-col">Médecin</td>
          <td colspan="3">${ordre.medecin_nom || ''}</td>
          <td class="label-col">Infirmier</td>
          <td>${ordre.infirmier_nom || ''}</td>
        </tr>
        <tr>
          <td class="label-col">Nom Malade</td>
          <td colspan="3">${transfert.nom_prenom || ''}</td>
          <td class="label-col">N° Téléphone</td>
          <td>${transfert.telephone || ''}</td>
        </tr>
        <tr>
          <td class="label-col">Matricule</td>
          <td colspan="3">${transfert.matricule || ''}</td>
          <td class="label-col">Service/Plant</td>
          <td>${transfert.plant || ''}</td>
        </tr>
        <tr>
          <td class="label-col">Motif</td>
          <td colspan="5" style="min-height:16mm;">${ordre.motif || ''}</td>
        </tr>
        <tr>
          <td class="label-col">Hôpital</td>
          <td colspan="3">${transfert.destination || ''}</td>
          <td class="label-col">Accompagnant</td>
          <td>${ordre.accompagnant || ''}</td>
        </tr>
        <tr>
          <td colspan="6" style="text-align:center;font-weight:bold;height:8mm;vertical-align:middle;">Signature</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align:center;font-weight:bold;height:10mm;vertical-align:middle;">Chauffeur</td>
          <td colspan="3" style="text-align:center;font-weight:bold;height:10mm;vertical-align:middle;">Responsable Médical</td>
        </tr>
        <tr class="sign-row">
          <td colspan="3" style="height:18mm;"></td>
          <td colspan="3" style="height:18mm;"></td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  // Import dynamique pour ne pas bloquer le focus de l'app
  printHTML(html);
}

/* ══════════════════════════════════════════════════════
   SECTION ORDRE DE TRANSPORT — réutilisable
   • transfertSaved=false → formulaire grisé + alerte
   • transfertSaved=true  → formulaire actif
══════════════════════════════════════════════════════ */
function OrdreSection({ transfert, transfertSaved, medecins, ordreData, onOrdreSaved, onOrdreDeleted }) {
  const [ordreForm,     setOrdreForm]     = useState({ medecin:'', accompagnant:'', moyen_transport:'', motif:'' });
  const [moyenType,    setMoyenType]    = useState('');
  const [moyenAutre,   setMoyenAutre]   = useState('');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [localOrdre,    setLocalOrdre]    = useState(ordreData || null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (ordreData) {
      setLocalOrdre(ordreData);
      const mt = ordreData.moyen_transport ?? '';
      const parsed = parseMoyenTransport(mt);
      setMoyenType(parsed.type);
      setMoyenAutre(parsed.detail);
      setOrdreForm({
        medecin:         ordreData.medecin         ?? '',
        accompagnant:    ordreData.accompagnant    ?? '',
        moyen_transport: mt,
        motif:           ordreData.motif           ?? '',
      });
    } else {
      setMoyenType('');
      setMoyenAutre('');
    }
  }, [ordreData]);

  const setF = (k, v) => setOrdreForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!transfertSaved) return;
    if (!moyenType) {
      setError('Sélectionnez un moyen de transport.');
      return;
    }
    if (moyenType === 'autre' && !String(moyenAutre || '').trim()) {
      setError('Précisez le moyen de transport lorsque vous choisissez « Autre ».');
      return;
    }
    const moyen_transport = buildMoyenTransport(moyenType, moyenAutre);
    setError(''); setSaving(true);
    try {
      const payload = { ...ordreForm, moyen_transport, transfert: transfert.id };
      if (!payload.medecin) delete payload.medecin;
      const saved = localOrdre?.id
        ? await modifierOrdreTransport(localOrdre.id, payload)
        : await creerOrdreTransport(payload);

      setLocalOrdre(saved);
      const savedMt = saved.moyen_transport ?? '';
      const pSaved = parseMoyenTransport(savedMt);
      setMoyenType(pSaved.type);
      setMoyenAutre(pSaved.detail);
      setOrdreForm({
        medecin:         saved.medecin         ?? '',
        accompagnant:    saved.accompagnant    ?? '',
        moyen_transport: savedMt,
        motif:           saved.motif           ?? '',
      });
      const medecinNom = medecins.find(m => String(m.id) === String(saved.medecin))?.medecin_nom || saved.medecin_nom || '';
      genererPdfOrdre(transfert, { ...saved, medecin_nom: medecinNom });
      onOrdreSaved && onOrdreSaved(saved);
    } catch (err) {
      const d = err?.response?.data;
      const msg = JSON.stringify(d ?? '');
      if (msg.includes('already exists') || msg.includes('unique') || msg.includes('déjà')) {
        try {
          const res = await axiosInstance.get(`/act-infirmier/transferts-urgence/${transfert.id}/`);
          const existing = res.data?.ordre_transport;
          if (existing?.id) {
            setLocalOrdre(existing);
            const exMt = existing.moyen_transport ?? '';
            const pEx = parseMoyenTransport(exMt);
            setMoyenType(pEx.type);
            setMoyenAutre(pEx.detail);
            setOrdreForm({ medecin: existing.medecin??'', accompagnant: existing.accompagnant??'', moyen_transport: exMt, motif: existing.motif??'' });
            onOrdreSaved && onOrdreSaved(existing);
            return;
          }
        } catch {}
        setError("Un ordre existe déjà. Rechargez si le problème persiste.");
      } else {
        setError(d?.detail || Object.values(d ?? {}).flat().join(' ') || 'Erreur lors de la sauvegarde.');
      }
    } finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    setConfirmDelete(false);
    if (!localOrdre?.id) return;
    try {
      const deletedId = localOrdre.id;
      await supprimerOrdreTransport(deletedId);
      setLocalOrdre(null);
      setMoyenType('');
      setMoyenAutre('');
      setOrdreForm({ medecin:'', accompagnant:'', moyen_transport:'', motif:'' });
      onOrdreDeleted && onOrdreDeleted(deletedId);
    } catch {}
  };

  const handleImprimer = () => {
    const medecinId  = ordreForm?.medecin || localOrdre?.medecin;
    const medecinNom = medecins.find(m => String(m.id) === String(medecinId))?.medecin_nom || localOrdre?.medecin_nom || '';
    const moyen_transport = (moyenType ? buildMoyenTransport(moyenType, moyenAutre) : '') || ordreForm?.moyen_transport || localOrdre?.moyen_transport || '';
    genererPdfOrdre(transfert, { ...(localOrdre||{}), ...(ordreForm||{}), moyen_transport, medecin_nom: medecinNom });
  };

  const disabled = !transfertSaved;

  return (
    <div>
      {confirmDelete && (
        <ModalConfirmDelete
          titre="Supprimer l'ordre de transport"
          texte="Cette action est irréversible. L'ordre de transport sera définitivement supprimé."
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}

      {/* Titre section */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:12, paddingBottom:8, borderBottom:'2px solid #e0f2fe' }}>
        <div style={{ fontSize:10.5, fontWeight:800, color:'#0284c7', textTransform:'uppercase',
          letterSpacing:'.7px', display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ color:'#0284c7', display:'flex', alignItems:'center' }}><Ico.ClipboardList /></span>
          Ordre de transport
        </div>
        {localOrdre && transfertSaved && (
          <button onClick={handleImprimer}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px',
              border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
              color:'white', borderRadius:7, fontSize:11.5, fontWeight:700, cursor:'pointer' }}>
            <Ico.Print /> Imprimer PDF
          </button>
        )}
      </div>

      {/* Alerte si transfert non enregistré */}
      {disabled && (
        <div style={{ background:'#fffbeb', border:'1.5px solid #fcd34d', borderRadius:9,
          padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:'#d97706', flexShrink:0, display:'flex', alignItems:'center' }}>
            <Ico.AlertTriangle />
          </span>
          <div style={{ fontSize:12, color:'#92400e', fontWeight:500 }}>
            <strong>Enregistrez d'abord le transfert</strong> pour pouvoir créer l'ordre de transport.
          </div>
        </div>
      )}

      {/* Badge ordre existant */}
      {localOrdre && transfertSaved && (
        <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:8,
          padding:'9px 12px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:'#16a34a', display:'flex', alignItems:'center' }}><Ico.Check /></span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#15803d' }}>Ordre de transport créé</div>
            <div style={{ fontSize:11, color:'#16a34a' }}>
              {medecins.find(m => String(m.id) === String(localOrdre.medecin))?.medecin_nom || '—'}
              {localOrdre.moyen_transport ? ` · ${localOrdre.moyen_transport}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire — toujours affiché, grisé si transfert non sauvegardé */}
      <div style={{
        background: disabled ? '#f8fafc' : '#f0f9ff',
        border:`1.5px solid ${disabled ? '#e2e8f0' : '#bae6fd'}`,
        borderRadius:12, padding:'16px',
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition:'all .25s',
      }}>
        {error && (
          <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', color:'#b91c1c',
            borderRadius:8, padding:'7px 12px', fontSize:12, marginBottom:12,
            display:'flex', alignItems:'center', gap:7 }}>
            <Ico.AlertTriangle /> {error}
          </div>
        )}

        {/* Données auto du transfert */}
        {transfertSaved && (
          <div style={{ background:'white', border:'1px solid #bae6fd', borderRadius:8,
            padding:'10px 12px', marginBottom:14 }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:'#0284c7', textTransform:'uppercase',
              letterSpacing:'.6px', marginBottom:7 }}>Données du transfert</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, fontSize:11.5 }}>
              {[
                ['Malade',    transfert.nom_prenom],
                ['Matricule', transfert.matricule],
                ['Chauffeur', transfert.chauffeur],
                ['Tél. chauffeur (SMS)', transfert.telephone_chauffeur],
                ['Date',      fmtDate(transfert.date)],
                ['Heure',     transfert.heure],
                ['Hôpital',   transfert.destination],
                ['Frais',     `${parseFloat(transfert.frais_deplacement||0).toFixed(2)} DT`],
                ['Plant',     transfert.plant],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ color:'#0369a1', fontWeight:700 }}>{k} : </span>
                  <span style={{ color:'#0c4a6e' }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Champs modifiables */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:3, gridColumn:'1/-1' }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.6px' }}>
              Médecin prescripteur
            </label>
            <select value={ordreForm.medecin || ''} onChange={e => setF('medecin', e.target.value)}
              style={{ ...inp, cursor:'pointer' }}>
              <option value="">— Aucun médecin —</option>
              {medecins.map(m => (
                <option key={m.id} value={m.id}>{m.medecin_nom || `Médecin #${m.id}`}</option>
              ))}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.6px' }}>
              Accompagnant
            </label>
            <input type="text" value={ordreForm.accompagnant || ''}
              onChange={e => setF('accompagnant', e.target.value)}
              placeholder="Nom accompagnant" style={inp} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.6px' }}>
              Moyen de transport
            </label>
            <select
              value={moyenType}
              onChange={(e) => {
                const v = e.target.value;
                setMoyenType(v);
                if (v !== 'autre') setMoyenAutre('');
              }}
              style={{ ...inp, cursor:'pointer' }}>
              <option value="">— Sélectionner —</option>
              <option value="voiture">{MOYEN_VOITURE}</option>
              <option value="ambulance">{MOYEN_AMBULANCE}</option>
              <option value="autre">Autre</option>
            </select>
            {moyenType === 'autre' && (
              <input
                type="text"
                value={moyenAutre}
                onChange={(e) => setMoyenAutre(e.target.value)}
                placeholder="Précisez le moyen (ex. minibus, taxi…)"
                style={inp}
              />
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:3, gridColumn:'1/-1' }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.6px' }}>
              Motif
            </label>
            <textarea value={ordreForm.motif || ''} onChange={e => setF('motif', e.target.value)} rows={2}
              placeholder="Motif du transfert…" style={{ ...inp, resize:'vertical' }} />
          </div>
        </div>

        {/* Boutons action */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
          {localOrdre ? (
            <button onClick={() => setConfirmDelete(true)}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px',
                border:'1.5px solid #dc2626', background:'white', color:'#dc2626',
                borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#dc2626';e.currentTarget.style.color='white';}}
              onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#dc2626';}}>
              <Ico.Trash /> Supprimer l'ordre
            </button>
          ) : <div />}
          <button onClick={handleSave} disabled={saving || disabled}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 20px',
              border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white',
              borderRadius:8, fontSize:12.5, fontWeight:700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: (saving || disabled) ? 0.55 : 1 }}>
            <Ico.Save />
            {saving ? 'Enregistrement…' : localOrdre ? "Modifier l'ordre" : "Créer l'ordre"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DRAWER TRANSFERT — créer / modifier
   Section ordre TOUJOURS VISIBLE dès l'ouverture
   Grisée tant que transfert non enregistré
══════════════════════════════════════════════════════ */
function DrawerTransfert({ initial, medecins, onSaved, onClose }) {
  const isEdit = !!initial?.id;
  const [form,           setForm]           = useState({ ...EMPTY_TRANSFERT, ...(initial || {}) });
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  // Création uniquement : on garde le transfert sauvegardé pour activer l'ordre
  const [savedTransfert, setSavedTransfert] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const nomInitial = initial ? `${initial.nom_prenom || ''}` : '';

  const handleCollabSelect = (id, detail) => {
    set('collaborateur', id || '');
    if (detail?.plant_section) set('plant', detail.plant_section);
  };

  const submit = async () => {
    setError('');
    if (!form.collaborateur) return setError('Sélectionnez un collaborateur.');
    if (!form.date)          return setError('La date est requise.');
    if (!form.heure)         return setError("L'heure est requise.");
    if (!form.chauffeur)     return setError('Le nom du chauffeur est requis.');
    setSaving(true);
    try {
      const saved = isEdit
        ? await modifierTransfertUrgence(initial.id, { ...form })
        : await creerTransfertUrgence({ ...form });
      const smsOk = isSmsChauffeurEnvoye(saved);
      if (isEdit) {
        onSaved(saved, true, { smsChauffeurEnvoye: smsOk });
      } else {
        setSavedTransfert(saved);
        setForm((p) => ({
          ...p,
          telephone_chauffeur: saved.telephone_chauffeur !== undefined && saved.telephone_chauffeur !== null
            ? String(saved.telephone_chauffeur)
            : p.telephone_chauffeur,
        }));
        /* SMS chauffeur : côté serveur après POST ordre-transport (ou PATCH transfert tardif) — pas de flash ici */
        onSaved(saved, false, {});
      }
    } catch (err) {
      const d = err.response?.data;
      if (JSON.stringify(d ?? {}).includes('unique')) setError("Ce numéro d'ordre existe déjà.");
      else setError(d?.detail || Object.values(d ?? {}).flat().join(' ') || 'Erreur.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.25)', zIndex:9000 }} onClick={onClose} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:560,
        background:'white', boxShadow:'-8px 0 40px rgba(0,0,0,.15)',
        zIndex:9001, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px', background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
          borderBottom:'1.5px solid #bae6fd', flexShrink:0,
          display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:11, background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
            <Ico.Truck />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>
              {isEdit ? 'Modifier le transfert' : "Nouveau transfert d'urgence"}
            </div>
            <div style={{ fontSize:10.5, color:'#0369a1' }}>
              
            </div>
          </div>
          <button onClick={onClose}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px',
              border:'none', background:'#dc2626', color:'white',
              borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#b91c1c';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#dc2626';}}>
            <Ico.Close /> Fermer
          </button>
        </div>

        {/* Corps scrollable */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>

          {/* Erreur */}
          {error && (
            <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', color:'#b91c1c',
              borderRadius:8, padding:'8px 12px', fontSize:12, marginBottom:14,
              display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ flexShrink:0, display:'flex' }}><Ico.AlertTriangle /></span> {error}
            </div>
          )}

          {/* ── Formulaire transfert ── */}
          <SecTitle icon={<Ico.User />}>Collaborateur &amp; Dates</SecTitle>
          <CollabSearch value={form.collaborateur} nomAffiche={nomInitial} onSelect={handleCollabSelect} />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12, marginBottom:18 }}>
            <Field label="Date">
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp} />
            </Field>
            <Field label="Heure">
              <input type="time" value={form.heure} onChange={e => set('heure', e.target.value)} style={inp} />
            </Field>
          </div>

          <SecTitle icon={<Ico.Truck />}>Transport</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
            <Field label="Chauffeur">
              <input type="text" value={form.chauffeur} onChange={e => set('chauffeur', e.target.value)}
                placeholder="Nom & Prénom" style={inp} />
            </Field>
            <Field label="Téléphone chauffeur (SMS)">
              <input type="tel" inputMode="tel" autoComplete="tel"
                value={form.telephone_chauffeur}
                onChange={e => set('telephone_chauffeur', e.target.value)}
                placeholder="Ex. +216 XX XXX XXX — notification transfert urgence"
                style={inp} />
            </Field>
            <Field label="Départ">
              <input type="text" value={form.depart} onChange={e => set('depart', e.target.value)}
                placeholder="Lieu de départ" style={inp} />
            </Field>
            <Field label="Destination">
              <input type="text" value={form.destination} onChange={e => set('destination', e.target.value)}
                placeholder="Hôpital / destination" style={inp} />
            </Field>
            <Field label="Frais déplacement (DT)">
              <input type="number" step="0.01" value={form.frais_deplacement}
                onChange={e => set('frais_deplacement', e.target.value)} style={inp} />
            </Field>
          </div>

          <SecTitle icon={<Ico.Building />}>Administratif</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            <Field label="Plant / Section">
              <input type="text" value={form.plant} onChange={e => set('plant', e.target.value)}
                placeholder="Ex: Plant A" style={inp} />
            </Field>
            <Field label="Cost Center">
              <input type="text" value={form.cost_center} onChange={e => set('cost_center', e.target.value)}
                placeholder="Ex: CC-001" style={inp} />
            </Field>
          </div>

          {/* ── Bouton enregistrer transfert (création uniquement, avant sauvegarde) ── */}
          {!isEdit && !savedTransfert && (
            <button onClick={submit} disabled={saving}
              style={{ width:'100%', display:'inline-flex', alignItems:'center', justifyContent:'center',
                gap:8, padding:'11px 20px', border:'none',
                background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white',
                borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer',
                marginBottom:22, opacity:saving?0.65:1,
                boxShadow:'0 4px 14px rgba(14,165,233,.3)' }}>
              <Ico.Save />
              {saving ? 'Enregistrement en cours…' : 'Enregistrer le transfert'}
            </button>
          )}

          {/* ── Badge succès + bouton re-modifier (création après sauvegarde) ── */}
          {!isEdit && savedTransfert && (
            <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:9,
              padding:'9px 14px', marginBottom:22, display:'flex', alignItems:'center',
              justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:'#16a34a', display:'flex' }}><Ico.Check /></span>
                  <span style={{ fontSize:12.5, fontWeight:700, color:'#15803d' }}>
                    Transfert #{savedTransfert.num_ordre} enregistré
                  </span>
                </div>
                <span style={{ fontSize:11.5, fontWeight:600, color:'#0369a1', paddingLeft:26, lineHeight:1.45 }}>
                  Étape suivante : enregistrez l&apos;ordre de transport ci-dessous. Le SMS au chauffeur est envoyé par le serveur
                  après validation de l&apos;ordre (si un numéro chauffeur est renseigné sur ce transfert).
                </span>
              </div>
              <button onClick={submit} disabled={saving}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px',
                  border:'1.5px solid #0284c7', background:'white', color:'#0284c7',
                  borderRadius:7, fontSize:11.5, fontWeight:700, cursor:'pointer', opacity:saving?0.65:1 }}>
                <Ico.Pencil /> Modifier
              </button>
            </div>
          )}

          {/* ── Section Ordre — visible UNIQUEMENT en création, grisée avant sauvegarde ── */}
          {!isEdit && (
            <div style={{ borderTop:'2px dashed #bae6fd', paddingTop:20 }}>
              <OrdreSection
                transfert={savedTransfert || { ...form, id: null, nom_prenom:'', matricule:'', telephone:'' }}
                transfertSaved={!!savedTransfert}
                medecins={medecins}
                ordreData={null}
                onOrdreSaved={async () => {
                  if (!savedTransfert?.id) return;
                  try {
                    const res = await axiosInstance.get(`/act-infirmier/transferts-urgence/${savedTransfert.id}/`);
                    const refreshed = res.data;
                    setSavedTransfert(refreshed);
                    onSaved(refreshed, false, {
                      ordreTransportSaved: true,
                      smsChauffeurEnvoye: isSmsChauffeurEnvoye(refreshed),
                    });
                  } catch {
                    onSaved(savedTransfert, false, { ordreTransportSaved: true, smsChauffeurEnvoye: false });
                  }
                }}
                onOrdreDeleted={() => onSaved(savedTransfert, false)}
              />
            </div>
          )}

        </div>

        {/* Footer — modification uniquement */}
        {isEdit && (
        <div style={{ padding:'12px 22px', borderTop:'1.5px solid #e0f2fe',
          display:'flex', justifyContent:'flex-end', gap:8, background:'#f8fafc', flexShrink:0 }}>
          <button onClick={onClose}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px',
              border:'1.5px solid #cbd5e1', background:'white', color:'#64748b',
              borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
            <Ico.Close /> Annuler
          </button>
          <button onClick={submit} disabled={saving}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 22px',
              border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white',
              borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
              opacity:saving?0.65:1, boxShadow:'0 4px 14px rgba(14,165,233,.25)' }}>
            <Ico.Save />
            {saving ? 'Enregistrement…' : 'Modifier le transfert'}
          </button>
        </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   DRAWER ORDRE SEULEMENT — depuis "Voir / Modifier"
══════════════════════════════════════════════════════ */
function DrawerOrdreOnly({ transfert, medecins, onClose, onOrdreSaved, onOrdreDeleted }) {
  const [ordreData, setOrdreData] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    axiosInstance.get(`/act-infirmier/transferts-urgence/${transfert.id}/`)
      .then(res => {
        if (cancelled) return;
        const o = res.data?.ordre_transport;
        setOrdreData((o && o.id) ? o : null);
      })
      .catch(() => { if (!cancelled) setLoadError("Impossible de charger l'ordre."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [transfert.id]);

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.25)', zIndex:9000 }} onClick={onClose} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:520,
        background:'white', boxShadow:'-8px 0 40px rgba(0,0,0,.15)',
        zIndex:9001, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px', background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
          borderBottom:'1.5px solid #bae6fd', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
              <Ico.FileText />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>
                Ordre de transport — N°{transfert.num_ordre}
              </div>
              <div style={{ fontSize:11, color:'#0369a1', marginTop:2 }}>
                {transfert.nom_prenom} · {fmtDate(transfert.date)} à {transfert.heure}
              </div>
            </div>
            <button onClick={onClose}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px',
                border:'none', background:'#dc2626', color:'white',
                borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#b91c1c';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#dc2626';}}>
              <Ico.Close /> Fermer
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {[
              { label:'Plant',     val: transfert.plant||'—',                                    color:'#0284c7', bg:'#eff6ff', border:'#bae6fd' },
              { label:'Frais',     val: `${parseFloat(transfert.frais_deplacement||0).toFixed(2)} DT`, color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
              { label:'Chauffeur', val: transfert.chauffeur||'—',                                color:'#0369a1', bg:'#f8fafc', border:'#e0f2fe' },
            ].map(({ label, val, color, bg, border }) => (
              <div key={label} style={{ textAlign:'center', padding:'6px 4px',
                borderRadius:8, background:bg, border:`1.5px solid ${border}` }}>
                <div style={{ fontSize:11.5, fontWeight:800, color }}>{val}</div>
                <div style={{ fontSize:9, fontWeight:700, color, textTransform:'uppercase', marginTop:1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Corps */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'40px', color:'#0284c7', fontSize:13, fontWeight:600 }}>
              Chargement de l'ordre…
            </div>
          )}
          {loadError && (
            <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', color:'#b91c1c',
              borderRadius:8, padding:'10px 14px', fontSize:12,
              display:'flex', alignItems:'center', gap:8 }}>
              <Ico.AlertTriangle /> {loadError}
            </div>
          )}
          {!loading && !loadError && (
            <OrdreSection
              transfert={transfert}
              transfertSaved={true}
              medecins={medecins}
              ordreData={ordreData}
              onOrdreSaved={(saved) => { setOrdreData(saved); onOrdreSaved && onOrdreSaved(saved); }}
              onOrdreDeleted={(id)  => { setOrdreData(null);  onOrdreDeleted && onOrdreDeleted(id); }}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   DRAWER CONSULTATION — lecture seule
   Transfert + Ordre associé, aucune action d'édition
══════════════════════════════════════════════════════ */
function DrawerConsult({ transfert, medecins, onClose, onEdit }) {
  const [ordreData, setOrdreData] = useState(null);
  const [detail,    setDetail]    = useState(transfert);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    setDetail(transfert);
    setLoading(true);
    axiosInstance.get(`/act-infirmier/transferts-urgence/${transfert.id}/`)
      .then(res => {
        if (cancelled || !res.data) return;
        const d = res.data;
        setDetail(d);
        const o = d?.ordre_transport;
        setOrdreData((o && o.id) ? o : null);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [transfert.id]);

  const medecinNom = ordreData
    ? medecins.find(m => String(m.id) === String(ordreData.medecin))?.medecin_nom || ordreData.medecin_nom || '—'
    : null;

  const InfoRow = ({ label, value }) => (
    <div style={{ background:'#f8fafc', borderRadius:8, padding:'8px 12px', border:'1px solid #e0f2fe' }}>
      <div style={{ fontSize:9.5, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</div>
      <div style={{ fontSize:12.5, fontWeight:600, color:'#0c4a6e', marginTop:2 }}>{value || '—'}</div>
    </div>
  );

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.25)', zIndex:9000 }} onClick={onClose} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:500,
        background:'white', boxShadow:'-8px 0 40px rgba(0,0,0,.15)',
        zIndex:9001, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px', background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
          borderBottom:'1.5px solid #bae6fd', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
              <Ico.Eye />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>
                Consulter le transfert N°{detail.num_ordre ?? transfert.num_ordre}
              </div>
              <div style={{ fontSize:11, color:'#0369a1', marginTop:2 }}>
                {detail.nom_prenom ?? transfert.nom_prenom} · {fmtDate(detail.date ?? transfert.date)} à {detail.heure ?? transfert.heure}
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => { onClose(); onEdit(transfert); }}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 13px',
                  border:'1.5px solid #0284c7', background:'white', color:'#0284c7',
                  borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#0284c7';e.currentTarget.style.color='white';}}
                onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#0284c7';}}>
                <Ico.Pencil /> Modifier
              </button>
              <button onClick={onClose}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 13px',
                  border:'none', background:'#dc2626', color:'white',
                  borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#b91c1c';}}
                onMouseLeave={e=>{e.currentTarget.style.background='#dc2626';}}>
                <Ico.Close /> Fermer
              </button>
            </div>
          </div>

          {/* Badges statut */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {[
              { label:'Plant',  val: detail.plant||'—',  color:'#0284c7', bg:'#eff6ff', border:'#bae6fd' },
              { label:'Frais',  val: `${parseFloat(detail.frais_deplacement||0).toFixed(2)} DT`, color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
              { label:'Ordre',  val: ordreData ? 'Créé' : 'En attente',
                color: ordreData ? '#16a34a' : '#ea580c',
                bg:    ordreData ? '#f0fdf4' : '#fff7ed',
                border:ordreData ? '#bbf7d0' : '#fed7aa' },
            ].map(({ label, val, color, bg, border }) => (
              <div key={label} style={{ textAlign:'center', padding:'7px 4px',
                borderRadius:8, background:bg, border:`1.5px solid ${border}` }}>
                <div style={{ fontSize:11.5, fontWeight:800, color }}>{val}</div>
                <div style={{ fontSize:9, fontWeight:700, color, textTransform:'uppercase', marginTop:1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Corps */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>

          {/* ── Détails transfert ── */}
          <div style={{ fontSize:10.5, fontWeight:800, color:'#0284c7', textTransform:'uppercase',
            letterSpacing:'.7px', marginBottom:10, paddingBottom:6, borderBottom:'2px solid #e0f2fe',
            display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ color:'#0284c7', display:'flex' }}><Ico.Truck /></span>
            Détails du transfert
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:22 }}>
            <InfoRow label="Collaborateur"  value={detail.nom_prenom} />
            <InfoRow label="Matricule"      value={detail.matricule} />
            <InfoRow label="Téléphone (collaborateur)" value={detail.telephone} />
            <InfoRow label="Date"           value={fmtDate(detail.date)} />
            <InfoRow label="Heure"          value={detail.heure} />
            <InfoRow label="Chauffeur"      value={detail.chauffeur} />
            <InfoRow label="Téléphone chauffeur (SMS)" value={detail.telephone_chauffeur} />
            <InfoRow label="Départ"         value={detail.depart} />
            <InfoRow label="Destination"    value={detail.destination} />
            <InfoRow label="Plant"          value={detail.plant} />
            <InfoRow label="Cost Center"    value={detail.cost_center} />
            <InfoRow label="Frais"          value={`${parseFloat(detail.frais_deplacement||0).toFixed(2)} DT`} />
          </div>
          {isSmsChauffeurEnvoye(detail) && (
            <div style={{
              marginBottom:18, marginTop:4, padding:'8px 12px', borderRadius:8,
              background:'#ecfdf5', border:'1px solid #bbf7d0', fontSize:11.5, fontWeight:700, color:'#15803d',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <Ico.Check /> Notification SMS chauffeur enregistrée (envoi accepté par le serveur).
            </div>
          )}

          {/* ── Ordre de transport ── */}
          <div style={{ fontSize:10.5, fontWeight:800, color:'#0284c7', textTransform:'uppercase',
            letterSpacing:'.7px', marginBottom:10, paddingBottom:6, borderBottom:'2px solid #e0f2fe',
            display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ color:'#0284c7', display:'flex' }}><Ico.ClipboardList /></span>
            Ordre de transport
          </div>

          {loading && (
            <div style={{ textAlign:'center', padding:'24px', color:'#0284c7', fontSize:13, fontWeight:600 }}>
              Chargement…
            </div>
          )}

          {!loading && !ordreData && (
            <div style={{ background:'#f0f9ff', border:'1.5px dashed #bae6fd', borderRadius:10,
              padding:'20px', textAlign:'center' }}>
              <div style={{ display:'flex', justifyContent:'center', color:'#bae6fd', marginBottom:8, transform:'scale(1.8)' }}>
                <Ico.FileText />
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:'#0369a1', marginTop:10 }}>Aucun ordre de transport</div>
              <div style={{ fontSize:11.5, color:'#7dd3fc', marginTop:4 }}>
                Cliquez "Créer" dans le tableau pour en créer un
              </div>
            </div>
          )}

          {!loading && ordreData && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <InfoRow label="Médecin"         value={medecinNom} />
              <InfoRow label="Accompagnant"    value={ordreData.accompagnant} />
              <InfoRow label="Moyen transport" value={ordreData.moyen_transport} />
              <InfoRow label="Motif" value={ordreData.motif} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
export default function Transferturgence() {
  const now = new Date();
  const [mois,           setMois]           = useState(now.getMonth() + 1);
  const [annee,          setAnnee]          = useState(now.getFullYear());
  const [transferts,     setTransferts]     = useState([]);
  const [medecins,       setMedecins]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [search,         setSearch]         = useState('');

  const [showTransfert,  setShowTransfert]  = useState(false);
  const [editTransfert,  setEditTransfert]  = useState(null);
  const [consultItem,    setConsultItem]    = useState(null);
  const [ordreDrawerItem,setOrdreDrawerItem]= useState(null);
  const [confirmDel,     setConfirmDel]     = useState(null);
  const [smsFlash,       setSmsFlash]        = useState('');

  const load = useCallback(async (m, a) => {
    setLoading(true); setError('');
    try {
      const [tsRes, meds] = await Promise.all([
        axiosInstance.get('/act-infirmier/transferts-urgence/by_mois/', { params: { mois: m, annee: a } }),
        getMedecins(),
      ]);
      const ts = tsRes.data;
      setTransferts(Array.isArray(ts) ? ts : ts.results ?? []);
      setMedecins(Array.isArray(meds) ? meds : meds.results ?? []);
    } catch { setError('Impossible de charger les données.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(mois, annee); }, [mois, annee, load]);
  const reload = () => load(mois, annee);

  const ordreDrawerTransfert = ordreDrawerItem
    ? transferts.find(t => t.id === ordreDrawerItem) ?? null
    : null;

  const consultTransfert = consultItem
    ? transferts.find(t => t.id === consultItem) ?? null
    : null;

  const filtered = transferts.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.nom_prenom  || '').toLowerCase().includes(q) ||
      (t.matricule   || '').toLowerCase().includes(q) ||
      (t.chauffeur   || '').toLowerCase().includes(q) ||
      (t.destination || '').toLowerCase().includes(q) ||
      String(t.telephone_chauffeur || '').toLowerCase().includes(q) ||
      String(t.num_ordre).includes(q)
    );
  });

  const totalFrais = transferts.reduce((s, t) => s + parseFloat(t.frais_deplacement || 0), 0);
  const avecOrdre  = transferts.filter(t => t.ordre_transport).length;
  const sansOrdre  = transferts.length - avecOrdre;

  const handleSavedTransfert = (saved, shouldClose = true, meta = {}) => {
    reload();
    if (meta?.ordreTransportSaved) {
      const msg = meta.smsChauffeurEnvoye
        ? 'Ordre enregistré. Notification SMS au chauffeur enregistrée (envoi accepté par le serveur).'
        : 'Ordre enregistré. Une notification SMS sera envoyée au chauffeur si un numéro a été indiqué sur le transfert.';
      setSmsFlash(msg);
      window.setTimeout(() => setSmsFlash(''), 10000);
    } else if (meta?.smsChauffeurEnvoye && shouldClose) {
      setSmsFlash('Notification SMS envoyée au chauffeur.');
      window.setTimeout(() => setSmsFlash(''), 8000);
    }
    if (shouldClose) { setShowTransfert(false); setEditTransfert(null); }
  };

  const handleOrdreSavedFromDrawer = async (transfertId) => {
    reload();
    if (!transfertId) return;
    try {
      const res = await axiosInstance.get(`/act-infirmier/transferts-urgence/${transfertId}/`);
      const t = res.data;
      const msg = isSmsChauffeurEnvoye(t)
        ? 'Ordre enregistré. Notification SMS au chauffeur enregistrée (envoi accepté par le serveur).'
        : 'Ordre enregistré. Une notification SMS sera envoyée au chauffeur si un numéro a été indiqué sur le transfert.';
      setSmsFlash(msg);
      window.setTimeout(() => setSmsFlash(''), 10000);
    } catch {
      setSmsFlash('Ordre enregistré. Une notification SMS sera envoyée au chauffeur si un numéro a été indiqué sur le transfert.');
      window.setTimeout(() => setSmsFlash(''), 10000);
    }
  };

  const handleDeleteTransfert = (id) =>
    setConfirmDel({ id, titre:'Supprimer le transfert', texte:'Ce transfert et son ordre associé seront définitivement supprimés.', type:'transfert' });

  const handleConfirmDel = async () => {
    if (!confirmDel) return;
    try {
      if (confirmDel.type === 'transfert') await supprimerTransfertUrgence(confirmDel.id);
      else await supprimerOrdreTransport(confirmDel.id);
      setConfirmDel(null); reload();
    } catch { setConfirmDel(null); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, gap:14 }}>

      {smsFlash && (
        <div style={{
          background:'#ecfdf5', border:'1.5px solid #86efac', borderRadius:10,
          padding:'10px 14px', fontSize:12.5, fontWeight:700, color:'#166534',
          flexShrink:0, display:'flex', alignItems:'center', gap:8,
        }}>
          <span style={{ display:'flex', color:'#16a34a' }}><Ico.Check /></span>
          {smsFlash}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, flexShrink:0 }}>
        {[
          { label:'Transferts ce mois', value: transferts.length,     color:'#0284c7', bg:'#f0f9ff', border:'#bae6fd' },
          { label:'Total frais (DT)',   value: totalFrais.toFixed(2), color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
          { label:'Ordres créés',       value: avecOrdre,             color:'#0369a1', bg:'#eff6ff', border:'#bae6fd' },
          { label:'Sans ordre',         value: sansOrdre,             color:'#ea580c', bg:'#fff7ed', border:'#fed7aa' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} style={{ background:bg, borderRadius:10, padding:'12px 16px', border:`1.5px solid ${border}` }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</div>
            <div style={{ fontSize:24, fontWeight:900, color, marginTop:3, lineHeight:1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
        <select value={mois} onChange={e => setMois(+e.target.value)} style={{ ...inp, width:'auto', cursor:'pointer' }}>
          {MOIS_LABELS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={annee} onChange={e => setAnnee(+e.target.value)} style={{ ...inp, width:'auto', cursor:'pointer' }}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', display:'flex' }}>
            <Ico.Search />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom, matricule, chauffeur, destination…"
            style={{ ...inp, paddingLeft:30 }} />
        </div>
        <button onClick={() => { setEditTransfert(null); setShowTransfert(true); }}
          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 18px',
            border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
            color:'white', borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer',
            boxShadow:'0 3px 10px rgba(14,165,233,.3)', whiteSpace:'nowrap' }}>
          <Ico.Plus /> Nouveau transfert
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', color:'#b91c1c',
          borderRadius:8, padding:'10px 14px', fontSize:12.5, flexShrink:0,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ display:'flex', alignItems:'center', gap:8 }}><Ico.AlertTriangle /> {error}</span>
          <button onClick={reload} style={{ padding:'4px 12px', background:'#b91c1c',
            color:'white', border:'none', borderRadius:6, fontSize:11.5, fontWeight:700, cursor:'pointer' }}>
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau */}
      <div style={{ flex:1, background:'white', borderRadius:12, border:'1.5px solid #e0f2fe',
        boxShadow:'0 2px 10px rgba(14,165,233,.06)', overflow:'hidden', minHeight:0 }}>
        {loading ? (
          <div style={{ padding:'20px 16px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height:50, marginBottom:6, borderRadius:8,
                background:'linear-gradient(90deg,#f0f9ff 25%,#e0f2fe 50%,#f0f9ff 75%)',
                backgroundSize:'200% 100%' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'60px 0', textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', color:'#cbd5e1', marginBottom:10, transform:'scale(2.5)' }}>
              <Ico.Truck />
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:'#64748b', marginTop:14 }}>
              {search ? 'Aucun résultat pour cette recherche' : `Aucun transfert pour ${MOIS_LABELS[mois]} ${annee}`}
            </div>
          </div>
        ) : (
          <div style={{ overflowY:'auto', maxHeight:'100%' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ position:'sticky', top:0, zIndex:1 }}>
                <tr style={{ background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom:'2px solid #bae6fd' }}>
                  {['N°','Date / Heure','Collaborateur','Chauffeur','Trajet','Plant','Frais','Ordre','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10.5,
                      fontWeight:800, color:'#0369a1', textTransform:'uppercase',
                      letterSpacing:'.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id}
                    style={{ borderBottom: i < filtered.length-1 ? '1px solid #f0f9ff' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f8fbff'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ background:'#eff6ff', color:'#0284c7', padding:'3px 9px',
                        borderRadius:99, fontSize:12, fontWeight:800 }}>#{t.num_ordre}</span>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:12.5, fontWeight:600, color:'#0c4a6e' }}>{fmtDate(t.date)}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{t.heure || '—'}</div>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:12.5, fontWeight:700, color:'#0c4a6e' }}>{t.nom_prenom || '—'}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{t.matricule || ''}</div>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:12.5, color:'#475569' }}>{t.chauffeur || '—'}</div>
                      {t.telephone_chauffeur && (
                        <div style={{ fontSize:10.5, color:'#64748b', marginTop:2 }}>{t.telephone_chauffeur}</div>
                      )}
                      {isSmsChauffeurEnvoye(t) && (
                        <span style={{
                          display:'inline-block', marginTop:4, fontSize:10, fontWeight:800,
                          padding:'2px 8px', borderRadius:99, background:'#ecfdf5', color:'#15803d',
                          border:'1px solid #bbf7d0',
                        }}>SMS envoyé</span>
                      )}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
                        <span style={{ color:'#64748b', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.depart}</span>
                        <span style={{ color:'#0284c7', flexShrink:0, display:'flex', alignItems:'center' }}><Ico.Arrow /></span>
                        <span style={{ color:'#0c4a6e', fontWeight:600, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.destination}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontSize:12, color:'#0369a1', fontWeight:600 }}>{t.plant || '—'}</span>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ background:'#f0fdf4', color:'#15803d', padding:'2px 8px',
                        borderRadius:99, fontSize:12, fontWeight:700 }}>
                        {parseFloat(t.frais_deplacement || 0).toFixed(2)} DT
                      </span>
                    </td>

                    {/* Colonne Ordre */}
                    <td style={{ padding:'10px 12px' }}>
                      {t.ordre_transport ? (
                        <button onClick={() => setOrdreDrawerItem(t.id)}
                          style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px',
                            border:'1.5px solid #16a34a', background:'#f0fdf4', color:'#16a34a',
                            borderRadius:99, fontSize:11.5, fontWeight:700, cursor:'pointer' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#16a34a';e.currentTarget.style.color='white';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#f0fdf4';e.currentTarget.style.color='#16a34a';}}>
                          <Ico.Pencil /> Voir / Modifier
                        </button>
                      ) : (
                        <button onClick={() => setOrdreDrawerItem(t.id)}
                          style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px',
                            border:'1.5px solid #bae6fd', background:'#f0f9ff', color:'#0284c7',
                            borderRadius:99, fontSize:11.5, fontWeight:700, cursor:'pointer' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#0284c7';e.currentTarget.style.color='white';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#f0f9ff';e.currentTarget.style.color='#0284c7';}}>
                          <Ico.Plus /> Créer
                        </button>
                      )}
                    </td>

                    {/* Actions : Voir · Modifier · Supprimer */}
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        {/* Voir */}
                        <button onClick={() => setConsultItem(t.id)}
                          title="Consulter"
                          style={{ display:'inline-flex', alignItems:'center', padding:'5px 10px',
                            border:'1.5px solid #0284c7', background:'white', color:'#0284c7',
                            borderRadius:6, cursor:'pointer' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#0284c7';e.currentTarget.style.color='white';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#0284c7';}}>
                          <Ico.Eye />
                        </button>
                        {/* Modifier */}
                        <button onClick={() => { setEditTransfert(t); setShowTransfert(true); }}
                          title="Modifier le transfert"
                          style={{ display:'inline-flex', alignItems:'center', padding:'5px 10px',
                            border:'1.5px solid #0369a1', background:'white', color:'#0369a1',
                            borderRadius:6, cursor:'pointer' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#0369a1';e.currentTarget.style.color='white';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#0369a1';}}>
                          <Ico.Pencil />
                        </button>
                        {/* Supprimer */}
                        <button onClick={() => handleDeleteTransfert(t.id)}
                          title="Supprimer le transfert"
                          style={{ display:'inline-flex', alignItems:'center', padding:'5px 10px',
                            border:'1.5px solid #dc2626', background:'white', color:'#dc2626',
                            borderRadius:6, cursor:'pointer' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#dc2626';e.currentTarget.style.color='white';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#dc2626';}}>
                          <Ico.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawers & Modals */}
      {showTransfert && (
        <DrawerTransfert
          initial={editTransfert}
          medecins={medecins}
          onSaved={handleSavedTransfert}
          onClose={() => { setShowTransfert(false); setEditTransfert(null); }}
        />
      )}

      {consultTransfert && (
        <DrawerConsult
          transfert={consultTransfert}
          medecins={medecins}
          onClose={() => setConsultItem(null)}
          onEdit={(t) => { setEditTransfert(t); setShowTransfert(true); }}
        />
      )}

      {ordreDrawerTransfert && (
        <DrawerOrdreOnly
          transfert={ordreDrawerTransfert}
          medecins={medecins}
          onClose={() => { setOrdreDrawerItem(null); reload(); }}
          onOrdreSaved={() => handleOrdreSavedFromDrawer(ordreDrawerItem)}
          onOrdreDeleted={() => reload()}
        />
      )}

      {confirmDel && (
        <ModalConfirmDelete
          titre={confirmDel.titre}
          texte={confirmDel.texte}
          onConfirm={handleConfirmDel}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}