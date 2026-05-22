import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { printHTML } from '../../utils/printHelper';
import { getSitePrintConfig } from '../../utils/siteConfig';
import {
  creerOrdonnance,
  updateOrdonnance,
  creerLigneOrdonnance,
  updateLigneOrdonnance,
  supprimerLigneOrdonnance_byId,
  suggestMedicaments,
  suggestPosologies,
} from '../../api/consultationsApi';

/*  Helpers  */
const fmtDate = (d) => d
  ? new Date(d).toLocaleString('fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '—';

function statutMeta(s) {
  if (s === 'DONNEE')     return { label:'Donnée ✓',  bg:'#f0fdf4', color:'#166534', border:'#bbf7d0' };
  return null; // Ne rien afficher pour EN_ATTENTE et IGNORE
}

function newLigne() {
  return {
    ligneId:       null, // ID de la LigneOrdonnance en base (null = nouvelle ligne)
    value:         '',
    medicament_id: null,
    nomMed:        '',
    dosageMed:     '',
    unite:         '',
    stock:         null,
    prefixLen:     0,
  };
}

function getOrdonnanceLignes(ordonnance) {
  if (!ordonnance || typeof ordonnance !== 'object') return [];
  if (Array.isArray(ordonnance.lignes)) return ordonnance.lignes;
  if (Array.isArray(ordonnance.lignes_ordonnance)) return ordonnance.lignes_ordonnance;
  if (Array.isArray(ordonnance.lignesOrdonnance)) return ordonnance.lignesOrdonnance;
  return [];
}

function getOrdonnancePrintableLines(ordonnance) {
  if (!ordonnance || typeof ordonnance !== 'object') return [];

  const fromText = String(ordonnance.medicaments || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const fromLignes = getOrdonnanceLignes(ordonnance)
    .map((l) => String(l?.texte || '').trim())
    .filter(Boolean);

  if (fromText.length >= fromLignes.length && fromText.length > 0) return fromText;
  if (fromLignes.length > 0) return fromLignes;
  return fromText;
}

function ligneMedicamentId(ligne) {
  const m = ligne?.medicament;
  if (m != null && typeof m === 'object' && m.id != null) return Number(m.id);
  if (ligne?.medicament_id != null && ligne.medicament_id !== '') return Number(ligne.medicament_id);
  if (Number.isFinite(Number(m))) return Number(m);
  return null;
}

/** Extrait la partie posologie d'une ligne d'ordonnance déjà enregistrée (même médicament). */
function extractPosologieFromLigne(ligne, targetMedId) {
  const tid = Number(targetMedId);
  const lid = ligneMedicamentId(ligne);
  if (lid == null || lid !== tid) return null;
  const texte = String(ligne?.texte || '').trim();
  if (!texte) return null;
  const medInfo = ligne?.medicament_info || ligne?.medicamentInfo || ligne?.medicament_detail;
  if (medInfo?.nom) {
    const nomMed = String(medInfo.nom || '').trim();
    const dosage = String(medInfo.dosage || '').trim();
    const prefix = dosage ? `${nomMed} ${dosage} ` : `${nomMed} `;
    if (texte.toLowerCase().startsWith(prefix.toLowerCase())) {
      const pos = texte.slice(prefix.length).trim();
      return pos || null;
    }
  }
  return texte;
}

/** Posologies distinctes déjà présentes dans les ordonnances chargées (historique patient, BDD via données déjà reçues). */
function collectLocalPosologieHistory(ordonnances, medicamentId, q) {
  const counts = new Map();
  const needle = String(q || '').trim().toLowerCase();
  for (const o of Array.isArray(ordonnances) ? ordonnances : []) {
    for (const ligne of getOrdonnanceLignes(o)) {
      const pos = extractPosologieFromLigne(ligne, medicamentId);
      if (!pos) continue;
      if (needle && !pos.toLowerCase().includes(needle)) continue;
      counts.set(pos, (counts.get(pos) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([texte, count]) => ({
      texte,
      posologie: texte,
      source: 'historique',
      count,
    }));
}

function posologieSuggestionKey(row) {
  return String(row?.posologie ?? row?.texte ?? '').trim().toLowerCase();
}

/** Fusionne historique patient (ordonnances en mémoire) et suggestions API, sans doublons. */
function mergePosologieSuggestions(patientRows, apiRows) {
  const map = new Map();
  const push = (row) => {
    const k = posologieSuggestionKey(row);
    if (!k) return;
    const ex = map.get(k);
    if (!ex) {
      map.set(k, { ...row });
      return;
    }
    const c = Number(row.count) || 0;
    const ec = Number(ex.count) || 0;
    ex.count = Math.max(ec, c) || ex.count;
    if (row.source === 'historique') ex.source = 'historique';
  };
  for (const row of patientRows) push(row);
  for (const row of apiRows) push(row);
  return [...map.values()].sort((a, b) => {
    const sa = a.source === 'historique' ? 1 : 0;
    const sb = b.source === 'historique' ? 1 : 0;
    if (sb !== sa) return sb - sa;
    return (Number(b.count) || 0) - (Number(a.count) || 0);
  });
}

/** POST ligne — essaie `ordonnance` puis `ordonnance_id` (DRF / serializers variables). */
async function creerLigneOrdonnanceResilient(ordonnanceId, texte, medicamentId) {
  const t = String(texte || '').trim();
  if (!t) throw new Error('Ligne sans texte.');
  const bodyPrimary = { ordonnance: ordonnanceId, texte: t };
  const bodyAlt = { ordonnance_id: ordonnanceId, texte: t };
  if (medicamentId != null && Number.isFinite(Number(medicamentId))) {
    const mid = Number(medicamentId);
    bodyPrimary.medicament = mid;
    bodyAlt.medicament_id = mid;
  }
  try {
    return await creerLigneOrdonnance(bodyPrimary);
  } catch (e1) {
    if (e1?.response?.status !== 400) throw e1;
    return await creerLigneOrdonnance(bodyAlt);
  }
}

/**
 * Persiste chaque ligne saisie en base (`/consultations/lignes/`), en plus du champ texte `medicaments` sur l’ordonnance.
 * À la modification : met à jour les lignes existantes, crée les nouvelles, supprime les lignes retirées de l’UI.
 */
async function syncOrdonnanceLignesVersApi(ordonnanceId, toutesLignes, previousLignes) {
  const prevList = Array.isArray(previousLignes) ? previousLignes.filter((x) => x?.id != null) : [];
  const keptIds = new Set();
  const savedLignes = [];

  for (const ligne of toutesLignes) {
    const texte = String(ligne?.value || '').trim();
    if (!texte) continue;
    const midRaw = ligne?.medicament_id;
    const medicamentId =
      midRaw != null && midRaw !== '' && Number.isFinite(Number(midRaw)) ? Number(midRaw) : null;

    if (ligne?.ligneId) {
      const patch = { texte };
      if (medicamentId != null) patch.medicament = medicamentId;
      let upd;
      try {
        upd = await updateLigneOrdonnance(ligne.ligneId, patch);
      } catch (e) {
        if (e?.response?.status !== 400) throw e;
        const patch2 = { texte };
        if (medicamentId != null) patch2.medicament_id = medicamentId;
        upd = await updateLigneOrdonnance(ligne.ligneId, patch2);
      }
      savedLignes.push(upd && typeof upd === 'object' ? upd : { id: ligne.ligneId, texte, medicament: medicamentId });
      keptIds.add(ligne.ligneId);
    } else {
      const created = await creerLigneOrdonnanceResilient(ordonnanceId, texte, medicamentId);
      if (created?.id != null) keptIds.add(created.id);
      savedLignes.push(created);
    }
  }

  for (const pl of prevList) {
    const pid = pl.id;
    if (keptIds.has(pid)) continue;
    try {
      await supprimerLigneOrdonnance_byId(pid);
    } catch {
      /* ignore */
    }
  }

  return savedLignes;
}

/*  Icons  */
const IcoX    = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoPlus = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoChk  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoPill = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v7"/><circle cx="18" cy="18" r="3"/><path d="m15.5 15.5 5 5"/></svg>;
const IcoDoc  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoStar = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IcoClock= () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

/* 
   IMPRESSION PDF
 */
function printOrdonnance(nomMedecin, nomMedecinAr, patientNom, lignes, siteConfigInput) {
  const siteConfig = getSitePrintConfig(siteConfigInput);
  var today = new Date().toLocaleDateString('fr-FR');
  var villeOrd = siteConfig.siteVille || 'Menzel Hayet';
  var footerLeft = siteConfig.footerCompanySite || 'Leoni Menzel Hayet';
  var footerRight = siteConfig.medicalServiceName || 'Service Médical';

  // Lignes médicaments — style simple, tout en noir
  var lignesHTML = lignes.map(function(l, i) {
    return '<p style="margin:0 0 14px 0;font-size:11pt;line-height:1.8;padding-left:18px;text-indent:-18px;">' +
      '<strong>' + (i + 1) + ')</strong> ' + l + '</p>';
  }).join('');

  var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Ordonnance</title><style>' +
    '@page{size:A4 portrait;margin:15mm 18mm 15mm 18mm;}' +
    '*{box-sizing:border-box;margin:0;padding:0;}' +
    'body{font-family:"Times New Roman",Times,serif;font-size:11pt;color:#000;background:white;}' +
    /* En-tête */
    '.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm;}' +
    '.hdr-left{font-style:italic;line-height:1.7;}' +
    '.hdr-left .nom{font-size:12pt;font-weight:bold;}' +
    '.hdr-right{text-align:right;direction:rtl;font-size:11pt;line-height:1.7;}' +
    /* Ligne date */
    '.date-line{margin-bottom:14mm;font-size:11pt;}' +
    '.date-line span{border-bottom:1px dotted #000;display:inline-block;width:80mm;}' +
    /* Corps */
    '.body{flex:1;min-height:160mm;padding-top:4mm;}' +
    /* Pied de page */
    '.footer{position:fixed;bottom:15mm;left:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #000;padding-top:4px;font-size:10pt;}' +
    'print-color-adjust:exact;-webkit-print-color-adjust:exact;' +
    '</style></head><body>' +

    /* ── EN-TÊTE ── */
    '<div class="hdr">' +
      '<div class="hdr-left">' +
        'Docteur<br/>' +
        '<span class="nom">' + nomMedecin + '</span><br/>' +
        'Médecine Générale' +
      '</div>' +
      '<div class="hdr-right">' +
        'الدكتور<br/>' +
        '<span style="font-weight:bold;">' + nomMedecinAr + '</span><br/>' +
        'طـب عـام' +
      '</div>' +
    '</div>' +

    /* ── DATE ── */
    '<div class="date-line">' + villeOrd + ', le <span>' + today + '</span></div>' +

    /* ── CORPS : médicaments ── */
    '<div class="body">' +
      (patientNom ? '<p style="margin-bottom:10mm;font-size:11pt;">Patient : <strong>' + patientNom + '</strong></p>' : '') +
      lignesHTML +
    '</div>' +

    /* ── PIED DE PAGE ── */
    '<div class="footer">' +
      '<span>' + footerLeft + '</span>' +
      '<span>' + footerRight + '</span>' +
    '</div>' +

    '</body></html>';

  printHTML(html);
}

/* 
   COMPOSANT PRINCIPAL
 */
export default function TabOrdonnance({ item, onCreated, onUpdated }) {
  const { user } = useAuth();
  const nomMedecin =
    user?.full_name ||
    user?.nom ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    'Médecin';
  const prenomAr =
    user?.prenom_ar ||
    user?.first_name_ar ||
    user?.firstname_ar ||
    user?.firstNameAr ||
    user?.prenomAr ||
    '';
  const nomAr =
    user?.nom_ar ||
    user?.last_name_ar ||
    user?.lastname_ar ||
    user?.lastNameAr ||
    user?.nomAr ||
    '';
  const nomMedecinAr =
    user?.full_name_ar ||
    user?.fullNameAr ||
    user?.nom_arabe ||
    `${prenomAr} ${nomAr}`.trim() ||
    'الطبيب';
  const patientNom = item?.collaborateur_nom || `Patient #${item?.collaborateur}` || '';
  const [lignes,      setLignes]     = useState([newLigne()]);
  const [activeIdx,   setActiveIdx]  = useState(null);   // ligne avec dropdown ouvert
  const [dropMode,    setDropMode]   = useState(null);   // 'med' | 'pos'
  const [medSugg,     setMedSugg]    = useState([]);
  const [posSugg,     setPosSugg]    = useState([]);
  const [loadingMed,  setLoadingMed] = useState(false);
  const [loadingPos,  setLoadingPos] = useState(false);
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState('');
  const [success,     setSuccess]    = useState(false);
  const [editingOrdId,setEditingOrdId]= useState(null);
  const [editingOrdData, setEditingOrdData] = useState(null);
  // Garde les lignes après submit pour que l'impression reste correcte
  const [dernierLignesImpression, setDernierLignesImpression] = useState([]);

  const debMed   = useRef(null);
  const debPos   = useRef(null);
  const inputRefs= useRef([]);
  const consultation = item?.consultation;
  const siteConfig = getSitePrintConfig(consultation, item, user);
  const collaborateurIdPourApi =
    item?.collaborateur != null && typeof item.collaborateur === 'object'
      ? item.collaborateur.id
      : item?.collaborateur ?? item?.collaborateur_id;

  useEffect(() => {
    setLignes([newLigne()]); setActiveIdx(null); setDropMode(null);
    setMedSugg([]); setPosSugg([]);
    setError(''); setSuccess(false);
    setDernierLignesImpression([]);
  }, [item?.id]);

  /* ── fetchPosologies déclaré AVANT tout return conditionnel (règle des Hooks) ── */
  const fetchPosologies = useCallback(
    (idx, q, medicamentIdOverride) => {
      const l = lignes[idx];
      const midRaw = medicamentIdOverride != null && medicamentIdOverride !== '' ? medicamentIdOverride : l?.medicament_id;
      const mid = midRaw != null && Number.isFinite(Number(midRaw)) ? Number(midRaw) : NaN;
      if (!Number.isFinite(mid)) return;
      clearTimeout(debPos.current);
      setLoadingPos(true);
      debPos.current = setTimeout(async () => {
        try {
          const local = collectLocalPosologieHistory(consultation?.ordonnances, mid, q);
          const api = await suggestPosologies(mid, q, {
            collaborateur_id: collaborateurIdPourApi,
          });
          setPosSugg(mergePosologieSuggestions(local, api));
        } catch {
          setPosSugg([]);
        } finally {
          setLoadingPos(false);
        }
      }, 180);
    },
    [lignes, consultation?.ordonnances, collaborateurIdPourApi],
  );

  if (!consultation) return (
    <div style={{ textAlign:'center', padding:'48px 24px', background:'#fafafa', border:'1.5px dashed #e2e8f0', borderRadius:12 }}>
      <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
      <div style={{ fontSize:14, fontWeight:700, color:'#374151' }}>Consultation requise</div>
      <div style={{ fontSize:13, color:'#9ca3af', marginTop:6 }}>Créez d'abord une consultation pour ce patient.</div>
    </div>
  );

  /*  Changement valeur champ  */
  const handleChange = (idx, val) => {
    const l = lignes[idx];

    if (l.medicament_id) {
      // Médicament lié — partie posologie modifiable
      if (val.length < l.prefixLen) {
        // Efface dans le préfixe → reset complet
        setLignes(p => p.map((x,i) => i!==idx ? x : { ...newLigne(), value: val }));
        setActiveIdx(null); setDropMode(null); setMedSugg([]); setPosSugg([]);
        return;
      }
      setLignes(p => p.map((x,i) => i!==idx ? x : { ...x, value: val }));
      // Fetch posologies avec la partie après le préfixe
      const posQ = val.slice(l.prefixLen).trimStart();
      setActiveIdx(idx); setDropMode('pos');
      fetchPosologies(idx, posQ);
      return;
    }

    // Pas encore lié → recherche médicament
    setLignes(p => p.map((x,i) => i!==idx ? x : { ...x, value: val }));
    setPosSugg([]);
    clearTimeout(debMed.current);
    if (val.trim().length < 2) { setMedSugg([]); setActiveIdx(null); setDropMode(null); return; }
    setActiveIdx(idx); setDropMode('med'); setLoadingMed(true);
    debMed.current = setTimeout(async () => {
      try { const r = await suggestMedicaments(val.trim()); setMedSugg(r); }
      catch { setMedSugg([]); }
      finally { setLoadingMed(false); }
    }, 280);
  };

  /* ── Focus sur champ déjà lié → fetch posologies tout de suite ── */
  const handleFocus = (idx) => {
    const l = lignes[idx];
    if (!l.medicament_id) return;
    const posQ = l.value.slice(l.prefixLen).trimStart();
    setActiveIdx(idx); setDropMode('pos');
    fetchPosologies(idx, posQ);
  };

  /* ── Sélection médicament ── */
  const selectMed = (idx, sug) => {
    const prefix = `${sug.nom}${sug.dosage ? ' ' + sug.dosage : ''} `;
    setLignes(p => p.map((x,i) => i!==idx ? x : {
      value: prefix, medicament_id: sug.medicament_id,
      nomMed: sug.nom, dosageMed: sug.dosage || '',
      unite: sug.unite || '', stock: sug.stock_info || null,
      prefixLen: prefix.length,
    }));
    setMedSugg([]); setDropMode('pos'); setActiveIdx(idx);
    // Fetch posologies tout de suite avec l’ID médicament (évite closure sur l’ancien état `lignes`)
    fetchPosologies(idx, '', sug.medicament_id);
    setTimeout(() => {
      const inp = inputRefs.current[idx];
      if (inp) {
        inp.focus();
        inp.setSelectionRange(prefix.length, prefix.length);
      }
    }, 30);
  };

  /* ── Sélection posologie ── */
  const selectPos = (idx, item) => {
    const l = lignes[idx];
    // Pour l'historique : item.texte = texte complet "Doliprane 500mg 3 fois/jour"
    // On insère seulement la posologie après le préfixe médicament déjà dans le champ
    // Pour le standard : item.texte = item.posologie = juste la posologie
    const posologie = item.posologie || item.texte;
    const newVal = l.value.slice(0, l.prefixLen) + posologie;
    setLignes(p => p.map((x,i) => i!==idx ? x : { ...x, value: newVal }));
    setPosSugg([]); setActiveIdx(null); setDropMode(null);
    setTimeout(() => {
      const inp = inputRefs.current[idx];
      if (inp) { inp.focus(); inp.setSelectionRange(newVal.length, newVal.length); }
    }, 20);
  };

  const closeDropdown = () => setTimeout(() => { setActiveIdx(null); setDropMode(null); setMedSugg([]); setPosSugg([]); }, 180);

  const addLigne    = () => setLignes(p => [...p, newLigne()]);
  const removeLigne = (idx) => { if (lignes.length > 1) setLignes(p => p.filter((_,i) => i!==idx)); };

  const toutesLignes   = lignes.filter(l => l.value.trim());
  const canSubmit      = toutesLignes.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(''); setLoading(true);
    try {
      const medicamentsTexte = toutesLignes.map((l) => l.value.trim()).filter(Boolean).join('\n');
      const lignesPourImpression = medicamentsTexte ? medicamentsTexte.split('\n') : [];

      if (editingOrdId) {
        const ordonnanceMaj = await updateOrdonnance(editingOrdId, {
          medicaments: medicamentsTexte,
        });
        const prevLignes = getOrdonnanceLignes(editingOrdData);
        const savedLignes = await syncOrdonnanceLignesVersApi(editingOrdId, toutesLignes, prevLignes);

        setDernierLignesImpression(lignesPourImpression);
        setSuccess(true);
        setEditingOrdId(null);
        setEditingOrdData(null);
        setLignes([newLigne()]);
        if (onUpdated) {
          onUpdated({
            ...(editingOrdData || {}),
            ...(ordonnanceMaj || {}),
            id: editingOrdId,
            medicaments: medicamentsTexte,
            lignes: savedLignes.length ? savedLignes : getOrdonnanceLignes({ ...editingOrdData, medicaments: medicamentsTexte }),
          });
        }
      } else {
        const o = await creerOrdonnance({
          consultation: consultation.id,
          medicaments: medicamentsTexte,
        });
        const ordId = o?.id;
        if (ordId == null) {
          throw new Error('Réponse serveur : ordonnance sans identifiant.');
        }
        const savedLignes = await syncOrdonnanceLignesVersApi(ordId, toutesLignes, []);
        const ordonnanceLocal = {
          ...o,
          lignes:
            savedLignes.length > 0
              ? savedLignes
              : lignesPourImpression.map((texte, index) => ({ id: index + 1, texte })),
          medicaments: medicamentsTexte,
        };
        setDernierLignesImpression(lignesPourImpression);
        setSuccess(true);
        setLignes([newLigne()]);
        onCreated(ordonnanceLocal);
      }
    } catch (err) {
      const d = err.response?.data;
      setError(
        d?.detail
          || (typeof d === 'object' && d != null ? Object.values(d).flat().join(' ') : '')
          || err?.message
          || 'Erreur.',
      );
    } finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily:'inherit' }}>
      <style>{`
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dropIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Bandeau consultation */}
      <div style={{ display:'flex', alignItems:'center', gap:8, background:'#e0f2fe', border:'1px solid #bae6fd', borderRadius:9, padding:'9px 14px', marginBottom:16, fontSize:12.5, color:'#0c4a6e' }}>
        <IcoDoc /> <strong>Ordonnance</strong> — Consultation du {fmtDate(consultation.date_consultation)}
      </div>

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:9, padding:'10px 14px', fontSize:13, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
          {error}<button onClick={() => setError('')} style={{ border:'none', background:'none', cursor:'pointer', color:'#b91c1c', padding:0, display:'flex' }}><IcoX /></button>
        </div>
      )}
      {success && (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', borderRadius:9, padding:'10px 14px', fontSize:13, marginBottom:12, fontWeight:600 }}>
          ✓ Ordonnance créée avec succès !
        </div>
      )}

      {/* Prescriptions existantes */}
      {consultation.ordonnances?.length > 0 && (
        <div style={{ background:'white', border:'1px solid #e8edf5', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#0ea5e9', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <IcoPill /> Prescriptions existantes
          </div>
          {[...consultation.ordonnances].reverse().map(o => (
            <div key={o.id} style={{ background:'#fafafa', border:'1px solid #f0f0f0', borderRadius:9, padding:'9px 12px', marginBottom:7 }}>
              <div style={{ fontSize:11, color:'#7dd3fc', marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
                <IcoDoc />{fmtDate(o.date_emission)}
                <span style={{ marginLeft:'auto', background:'#e0f2fe', color:'#0284c7', borderRadius:99, padding:'1px 8px', fontSize:10.5, fontWeight:700 }}>{getOrdonnanceLignes(o).length||0} ligne{(getOrdonnanceLignes(o).length||0)>1?'s':''}</span>
              </div>
              {getOrdonnanceLignes(o).map((ligne, i) => {
                const ligneStatut = statutMeta(ligne?.statut);
                return (
                  <div key={ligne?.id ?? i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, fontSize:13, padding:'4px 0', borderTop: i>0?'1px solid #f5f5f5':'none' }}>
                    <span style={{ color:'#374151', display:'flex', alignItems:'center', gap:6 }}><IcoPill />{ligne?.texte||'—'}</span>
                    {ligneStatut && (
                      <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:99, background:ligneStatut.bg, color:ligneStatut.color, border:`1px solid ${ligneStatut.border}`, whiteSpace:'nowrap' }}>{ligneStatut.label}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => {
                    // Reconstruire les lignes avec toutes les métadonnées médicament
                    const fromLignes = getOrdonnanceLignes(o).map((l) => {
                      const texte   = l?.texte || '';
                      // Le backend retourne medicament_info (objet) et medicament (id entier)
                      const medInfo = l?.medicament_info || l?.medicamentInfo || l?.medicament_detail || null;
                      if (medInfo?.id) {
                        const nomMed = medInfo.nom    || '';
                        const dosage = medInfo.dosage || '';
                        const prefix = dosage ? `${nomMed} ${dosage} ` : `${nomMed} `;
                        return {
                          ...newLigne(),
                          ligneId:       l.id       || null,
                          value:         texte,
                          medicament_id: medInfo.id,
                          nomMed,
                          dosageMed:     dosage,
                          unite:         medInfo.unite || '',
                          prefixLen:     prefix.length,
                        };
                      }
                      return { ...newLigne(), ligneId: l.id || null, value: texte };
                    });
                    const fromTexte = String(o.medicaments || '').split('\n')
                      .map((t) => t.trim()).filter(Boolean)
                      .map((t) => ({ ...newLigne(), value: t }));
                    const vals = fromLignes.length ? fromLignes : fromTexte;
                    setLignes(vals.length ? vals : [newLigne()]);
                    setEditingOrdId(o.id);
                    setEditingOrdData(o);
                    setSuccess(false);
                    setError('');
                  }}
                  style={{
                    padding:'6px 12px', borderRadius:7, border:'1.5px solid #0ea5e9',
                    background:'white', color:'#0284c7', fontSize:12, fontWeight:700, cursor:'pointer'
                  }}
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nouvelle prescription */}
      <div style={{ background:'white', border:'1px solid #e8edf5', borderRadius:12, padding:'16px 18px', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#0ea5e9', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
          <IcoPill /> {editingOrdId ? 'Modification prescription' : 'Nouvelle prescription'}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {lignes.map((ligne, idx) => (
            <LigneInput
              key={idx} idx={idx} ligne={ligne}
              showMedDrop={activeIdx===idx && dropMode==='med'}
              showPosDrop={activeIdx===idx && dropMode==='pos'}
              medSugg={medSugg} posSugg={posSugg}
              loadingMed={loadingMed} loadingPos={loadingPos}
              canRemove={lignes.length > 1}
              inputRef={el => inputRefs.current[idx] = el}
              onChange={handleChange}
              onFocus={handleFocus}
              onSelectMed={selectMed}
              onSelectPos={selectPos}
              onRemove={removeLigne}
              onBlur={closeDropdown}
            />
          ))}
        </div>

        <button onClick={addLigne}
          style={{ marginTop:12, display:'flex', alignItems:'center', gap:6, border:'1px dashed #bae6fd', background:'#e0f2fe', color:'#0284c7', borderRadius:8, padding:'8px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background='#dbeafe'}
          onMouseLeave={e => e.currentTarget.style.background='#e0f2fe'}
        ><IcoPlus /> Ajouter un médicament</button>
      </div>

      {/* Résumé */}
      {toutesLignes.length > 0 && (
        <div style={{ background:'#f8fafc', border:'1px solid #e8edf5', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>
            Résumé — {toutesLignes.length} médicament{toutesLignes.length>1?'s':''}
          </div>
          {toutesLignes.map((l, i) => {
            const posologie = l.medicament_id ? l.value.slice(l.prefixLen).trim() : '';
            return (
              <div key={i} style={{ display:'flex', alignItems:'baseline', gap:8, fontSize:13, padding:'4px 0', borderTop: i>0?'1px solid #f5f5f5':'none' }}>
                <span style={{ color: l.medicament_id ? '#16a34a' : '#f59e0b', flexShrink:0, marginTop:1 }}>
                  {l.medicament_id ? <IcoChk /> : '→'}
                </span>
                <span style={{ color:'#0f172a', fontWeight:700 }}>
                  {l.medicament_id ? `${l.nomMed}${l.dosageMed ? ' '+l.dosageMed : ''}` : l.value.trim()}
                </span>
                {posologie && <span style={{ color:'#64748b', fontSize:12.5 }}>{posologie}</span>}

              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        {/* Bouton Imprimer EN PREMIER */}
        <button
          onClick={() => {
            let lignesTexte = toutesLignes.length > 0
              ? toutesLignes.map(l => l.value.trim())
              : [];
            if (lignesTexte.length === 0) {
              const ords = consultation.ordonnances || [];
              const derniereOrd = ords[ords.length - 1];
              lignesTexte = getOrdonnancePrintableLines(derniereOrd);
            }
            if (lignesTexte.length === 0) {
              lignesTexte = dernierLignesImpression;
            }
            printOrdonnance(nomMedecin, nomMedecinAr, patientNom, lignesTexte, siteConfig);
          }}
          style={{
            display:'flex', alignItems:'center', gap:7,
            padding:'11px 22px',
            background:'linear-gradient(135deg,#0369a1,#0ea5e9)',
            color:'white', border:'none', borderRadius:10,
            cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'inherit',
            boxShadow:'0 4px 14px rgba(2,132,199,.3)', transition:'all .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform='none'}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimer l'ordonnance
        </button>

        {/* Bouton Créer EN DEUXIÈME */}
        <button onClick={handleSubmit} disabled={!canSubmit || loading}
          style={{ padding:'11px 28px', border:'none', borderRadius:10, background: canSubmit?'linear-gradient(135deg,#0369a1,#0ea5e9)':'#e2e8f0', color: canSubmit?'white':'#94a3b8', fontSize:14, fontWeight:700, cursor: canSubmit&&!loading?'pointer':'not-allowed', opacity: loading?0.75:1, boxShadow: canSubmit?'0 4px 14px rgba(2,132,199,.3)':'none', transition:'all .2s' }}
          onMouseEnter={e => { if(canSubmit&&!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; }}
        >{loading ? 'Enregistrement…' : (editingOrdId ? 'Enregistrer la modification' : 'Créer l\'ordonnance')}</button>
      </div>
    </div>
  );
}

/* 
   LIGNE INPUT
 */
function LigneInput({ idx, ligne, showMedDrop, showPosDrop, medSugg, posSugg, loadingMed, loadingPos, canRemove, inputRef, onChange, onFocus, onSelectMed, onSelectPos, onRemove, onBlur }) {
  const isLinked = !!ligne.medicament_id;

  return (
    <div style={{ position:'relative' }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>

        {/* Numéro */}
        <div style={{ width:28, height:42, borderRadius:8, background: isLinked?'#dcfce7':'#e0f2fe', color: isLinked?'#16a34a':'#0ea5e9', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {isLinked ? <IcoChk /> : idx+1}
        </div>

        {/* Champ texte */}
        <div style={{ flex:1, position:'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={ligne.value}
            onChange={e => onChange(idx, e.target.value)}
            onFocus={() => onFocus(idx)}
            onBlur={onBlur}
            placeholder={isLinked
              ? `Posologie pour ${ligne.nomMed}${ligne.dosageMed ? ' '+ligne.dosageMed : ''}…`
              : 'Médicament — tapez pour rechercher dans le catalogue…'}
            style={{
              width:'100%', boxSizing:'border-box',
              padding: isLinked ? '10px 12px 10px 14px' : '10px 12px',
              border:`1.5px solid ${isLinked ? '#22c55e' : '#e2e8f0'}`,
              borderRadius:9, fontSize:13.5, outline:'none',
              color:'#0c4a6e',
              background: isLinked ? '#fafffe' : 'white',
              fontFamily:'inherit', transition:'border-color .15s',
            }}
            onFocusCapture={e => { if(!isLinked) e.target.style.borderColor='#38bdf8'; }}
          />

          {/* Indicateur vert subtil dans le champ si lié */}
          {isLinked && (
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:'#22c55e', borderRadius:'9px 0 0 9px' }} />
          )}

          {/* ── DROPDOWN MÉDICAMENTS ── */}
          {showMedDrop && (
            <Dropdown>
              {loadingMed && <DropLoading label="Recherche dans le catalogue…" />}
              {!loadingMed && medSugg.length === 0 && ligne.value.trim().length >= 2 && (
                <div style={{ padding:'12px 16px', fontSize:12.5, color:'#94a3b8' }}>Aucun médicament trouvé</div>
              )}
              {!loadingMed && medSugg.map((sug, i) => {
                return (
                  <DropItem key={sug.medicament_id??i} first={i===0} onMouseDown={() => onSelectMed(idx, sug)}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'#e0f2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#0ea5e9' }}><IcoPill /></div>
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:700, color:'#1e293b' }}>{sug.nom}</div>
                        {sug.dosage && <div style={{ fontSize:11.5, color:'#64748b', marginTop:1 }}>{sug.dosage}</div>}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                      {sug.dosage && <span style={{ fontSize:11.5, color:'#64748b' }}>{sug.dosage}</span>}
                    </div>
                  </DropItem>
                );
              })}
            </Dropdown>
          )}

          {/* ── DROPDOWN POSOLOGIES ── (toujours visible en mode posologie pour éviter l’impression « rien ne marche ») */}
          {showPosDrop && (
            <Dropdown accent="#bae6fd">
              <div style={{ padding:'8px 14px 6px', fontSize:10.5, fontWeight:700, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid #f0f9ff', display:'flex', alignItems:'center', gap:5 }}>
                <span>Posologies suggérées</span>
              </div>
              {loadingPos && <DropLoading label="Chargement des suggestions…" />}

              {!loadingPos && posSugg.length === 0 && (
                <div style={{ padding:'12px 16px', fontSize:12.5, color:'#94a3b8' }}>Aucune suggestion pour cette recherche — saisie libre.</div>
              )}

              {!loadingPos && posSugg.map((item, i) => (
                <DropItem key={i} first={i===0} accent onMouseDown={() => onSelectPos(idx, item)}>
                  <span style={{ fontSize:13, color:'#374151' }}>{item.posologie || item.texte}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                    {item.source === 'historique' ? (
                      <span style={{ fontSize:10.5, background:'#fef3c7', color:'#92400e', borderRadius:99, padding:'2px 8px', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                        <IcoClock /> {item.count}×
                      </span>
                    ) : (
                      <span style={{ fontSize:10.5, background:'#e0f2fe', color:'#0369a1', borderRadius:99, padding:'2px 8px', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                        <IcoStar /> Standard
                      </span>
                    )}
                  </div>
                </DropItem>
              ))}
            </Dropdown>
          )}
        </div>



        {/* Supprimer */}
        <button type="button" onClick={() => onRemove(idx)} disabled={!canRemove}
  style={{ width:34, height:42, border:'1.5px solid #fca5a5', background:'#fef2f2', borderRadius:8, cursor: canRemove?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
  onMouseEnter={e => { if(canRemove){ e.currentTarget.style.background='#dc2626'; e.currentTarget.style.borderColor='#dc2626'; }}}
  onMouseLeave={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.borderColor='#fca5a5'; }}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
</button>
      </div>
    </div>
  );
}

/* ─── Micro-composants dropdown ───────────────────────────── */
function Dropdown({ children, accent = '#e2e8f0' }) {
  return (
    <div style={{ position:'absolute', zIndex:400, left:0, right:0, top:'calc(100% + 4px)', background:'white', border:`1px solid ${accent}`, borderRadius:11, boxShadow:'0 10px 36px rgba(15,23,42,.13)', overflow:'hidden', animation:'dropIn .15s ease' }}>
      {children}
    </div>
  );
}

function DropItem({ children, first, accent, onMouseDown }) {
  return (
    <button type="button" onMouseDown={onMouseDown}
      style={{ width:'100%', textAlign:'left', border:'none', borderTop: first?'none':'1px solid #f8f7ff', background:'white', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, cursor:'pointer', transition:'background .1s' }}
      onMouseEnter={e => e.currentTarget.style.background = accent ? '#f0f9ff' : '#f0fdf4'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}
    >{children}</button>
  );
}

function DropLoading({ label }) {
  return (
    <div style={{ padding:'12px 16px', fontSize:12.5, color:'#64748b', display:'flex', alignItems:'center', gap:7 }}>
      <span style={{ display:'inline-block', animation:'spin .8s linear infinite' }}>⟳</span> {label}
    </div>
  );
}