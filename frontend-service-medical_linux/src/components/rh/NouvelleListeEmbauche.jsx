// src/components/rh/NouvelleListeEmbauche.jsx
//
// FLUX CORRECT :
//   Excel  → uploadExcelPreview()  → backend crée la liste ET retourne liste_id
//          → uploadExcelConfirmer(liste_id, apercu)  → candidats ajoutés
//          → UNE SEULE liste créée
//
//   Manuel → creerListeManuelle(date, candidats)
//          → creerListe() + ajouterCandidatAPI() pour chaque candidat
//          → UNE SEULE liste créée
//
import { useState, useRef } from 'react';
import {
  uploadExcelPreview,
  uploadExcelConfirmer,
  creerListeManuelle,
  deleteListe,
  updateDateVisite,
  getListeDetail,
  getListes,
  rechercheIM,
} from '../../api/embaucheApi';
import { formatAxiosError } from '../../api/apiErrorUtils';

/* ── icônes ── */
const IcoBack   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoWarn   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoCheck  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoPlus   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
const IcoEdit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

const TODAY = new Date().toISOString().split('T')[0];
const inp = { width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'white', outline:'none', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.6, marginBottom:4 };

const normalizeIsoDate = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getCandidatesCount = (liste) => {
  if (!liste || typeof liste !== 'object') return 0;
  return Number(
    liste.nombre_candidats ??
    liste.nb_candidats ??
    liste.total_candidats ??
    liste.count_candidats ??
    0
  ) || 0;
};

const extractConfirmListeIds = (confirmResponse, fallbackId) => {
  const ids = [
    confirmResponse?.id,
    confirmResponse?.liste_id,
    confirmResponse?.liste?.id,
    confirmResponse?.liste?.liste_id,
    fallbackId,
  ];
  return [...new Set(ids.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0))];
};

const extractConfirmReference = (confirmResponse) => (
  confirmResponse?.reference ||
  confirmResponse?.liste?.reference ||
  confirmResponse?.liste_reference ||
  ''
);

// Objet vide complet — tous les champs du CandidatRHUpdateSerializer
const VIDE = {
  nom:'', prenom:'', matricule:'', cin:'', date_naissance:'', genre:'',
  telephone:'', gouvernorat:'', niveau:'', poste:'', department:'',
  projet:'', date_recrutement:'', centre_cout:'', source_information:'',
  formation:'', num_demande:'', ps:'',
};

/* ═══ FORMULAIRE CANDIDAT ═══ */
function FormCandidatRow({ c, index, onChange, onBatchChange, onDelete, isOnly }) {
  const set = (f) => (e) => onChange(index, f, e.target.value);
  const [imLoading, setImLoading] = useState(false);
  const [imMsg,     setImMsg]     = useState('');
  const [imWarn,    setImWarn]    = useState('');
  const [lastAutoMatricule, setLastAutoMatricule] = useState('');
  const normalizeGenre = (v) => {
    const g = String(v || '').toLowerCase();
    if (g === 'm' || g === 'male' || g === 'homme') return 'homme';
    if (g === 'f' || g === 'female' || g === 'femme') return 'femme';
    return '';
  };

  // Recherche dans le système RH (im_db) pour pré-remplir
  const handleRechercheIM = async (opts = {}) => {
    const { silent = false } = opts;
    if (!c.matricule.trim()) {
      if (!silent) setImMsg('Saisissez d\'abord le matricule.');
      return;
    }
    setImLoading(true); setImMsg(''); setImWarn('');
    try {
      const res = await rechercheIM(c.matricule.trim());
      if (res.warning) setImWarn(res.warning);
      if (res.data) {
        const d = res.data;
        // Pré-remplir les champs disponibles depuis im_db
        const patch = {};
        if (d.nom)                patch.nom               = d.nom;
        if (d.prenom)             patch.prenom            = d.prenom;
        if (d.cin)                patch.cin               = d.cin;
        if (d.date_naissance)     patch.date_naissance    = d.date_naissance;
        const genre = normalizeGenre(d.genre || d.sexe);
        if (genre)                patch.genre             = genre;
        if (d.telephone)          patch.telephone         = d.telephone;
        if (d.gouvernorat || d.gouvernerat) patch.gouvernorat = d.gouvernorat || d.gouvernerat;
        if (d.poste || d.fonction) patch.poste            = d.poste || d.fonction;
        if (d.department)         patch.department        = d.department;
        if (d.projet)             patch.projet            = d.projet;
        if (d.date_embauche)      patch.date_recrutement  = d.date_embauche;
        if (d.centre_cout)        patch.centre_cout       = d.centre_cout;
        if (d.niveau)             patch.niveau            = d.niveau;
        if (d.formation)          patch.formation         = d.formation;
        if (d.num_demande)        patch.num_demande       = d.num_demande;
        if (d.ps)                 patch.ps                = d.ps;
        if (d.source_information) patch.source_information = d.source_information;
        if (Object.keys(patch).length > 0) {
          if (onBatchChange) onBatchChange(index, patch);
          else Object.entries(patch).forEach(([f, v]) => onChange(index, f, v));
        }
        if (!silent && !res.warning) setImMsg('✓ Données pré-remplies depuis le système RH.');
      }
    } catch (e) {
      if (!silent) setImMsg(formatAxiosError(e));
    } finally { setImLoading(false); }
  };

  const handleMatriculeBlur = async () => {
    const mat = c.matricule.trim();
    if (!mat || mat.length < 5 || mat === lastAutoMatricule) return;
    await handleRechercheIM({ silent: true });
    setLastAutoMatricule(mat);
  };

  return (
    <div style={{ background:'#f8fafc', borderRadius:10, border:'1.5px solid #e2e8f0', padding:14, marginBottom:10 }}>
      {/* Header candidat */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
          Candidat #{index + 1}
          {c.nom && <span style={{ fontWeight:400, color:'#64748b', marginLeft:6 }}>— {c.nom} {c.prenom}</span>}
        </div>
        {!isOnly && (
          <button onClick={() => onDelete(index)}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:7, border:'1px solid #fecaca', background:'#fef2f2', color:'#b91c1c', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
            <IcoTrash /> Supprimer
          </button>
        )}
      </div>

      {/* Recherche IM */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:9 }}>
        <div style={{ flex:'0 0 260px' }}>
          <label style={lbl}>Matricule *</label>
          <input value={c.matricule} onChange={set('matricule')} onBlur={handleMatriculeBlur} placeholder="50234567890" style={inp} />
        </div>
        <button onClick={handleRechercheIM} disabled={imLoading}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:8, border:'1.5px solid #dbeafe', background:'#eff6ff', color:'#1d4ed8', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0 }}>
          <IcoSearch /> {imLoading ? 'Recherche…' : 'Vérifier dans le système RH'}
        </button>
      </div>
      {imWarn && (
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fff7ed', border:'1px solid #fed7aa', color:'#c2410c', padding:'7px 12px', borderRadius:8, marginBottom:9, fontSize:12 }}>
          <IcoWarn /> {imWarn}
        </div>
      )}
      {imMsg && !imWarn && (
        <div style={{ background: imMsg.startsWith('✓') ? '#f0fdf4' : '#fef2f2', border:`1px solid ${imMsg.startsWith('✓')?'#86efac':'#fecaca'}`, color: imMsg.startsWith('✓') ? '#15803d' : '#b91c1c', padding:'7px 12px', borderRadius:8, marginBottom:9, fontSize:12 }}>
          {imMsg}
        </div>
      )}

      {/* Identité */}
      <div style={{ fontSize:10, fontWeight:800, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:.8, marginBottom:7, paddingBottom:4, borderBottom:'1.5px solid #eff6ff' }}>Identité</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, marginBottom:9 }}>
        <div><label style={lbl}>Nom *</label><input value={c.nom} onChange={set('nom')} placeholder="AKERMI" style={inp} /></div>
        <div><label style={lbl}>Prénom *</label><input value={c.prenom} onChange={set('prenom')} placeholder="Houcem" style={inp} /></div>
        <div><label style={lbl}>CIN</label><input value={c.cin} onChange={set('cin')} placeholder="12345678" style={inp} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, marginBottom:9 }}>
        <div><label style={lbl}>Date naissance</label><input type="date" value={c.date_naissance} onChange={set('date_naissance')} style={inp} /></div>
        <div><label style={lbl}>Genre</label>
          <select value={c.genre} onChange={set('genre')} style={inp}>
            <option value="">—</option><option value="homme">Homme</option><option value="femme">Femme</option>
          </select>
        </div>
        <div><label style={lbl}>Téléphone</label><input value={c.telephone} onChange={set('telephone')} style={inp} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:12 }}>
        <div><label style={lbl}>Gouvernorat</label><input value={c.gouvernorat} onChange={set('gouvernorat')} style={inp} /></div>
        <div><label style={lbl}>Niveau</label><input value={c.niveau} onChange={set('niveau')} style={inp} /></div>
      </div>

      {/* RH */}
      <div style={{ fontSize:10, fontWeight:800, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:.8, marginBottom:7, paddingBottom:4, borderBottom:'1.5px solid #eff6ff' }}>Informations RH</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, marginBottom:9 }}>
        <div><label style={lbl}>Fonction</label><input value={c.poste} onChange={set('poste')} placeholder="Technicien" style={inp} /></div>
        <div><label style={lbl}>Département</label><input value={c.department} onChange={set('department')} style={inp} /></div>
        <div><label style={lbl}>Projet</label><input value={c.projet} onChange={set('projet')} style={inp} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, marginBottom:9 }}>
        <div><label style={lbl}>Date recrutement</label><input type="date" value={c.date_recrutement} onChange={set('date_recrutement')} style={inp} /></div>
        <div><label style={lbl}>Centre de coût</label><input value={c.centre_cout} onChange={set('centre_cout')} style={inp} /></div>
        <div><label style={lbl}>Num. demande</label><input value={c.num_demande} onChange={set('num_demande')} style={inp} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9 }}>
        <div><label style={lbl}>PS</label><input value={c.ps} onChange={set('ps')} style={inp} /></div>
        <div><label style={lbl}>Source information</label><input value={c.source_information} onChange={set('source_information')} style={inp} /></div>
        <div><label style={lbl}>Formation</label><input value={c.formation} onChange={set('formation')} style={inp} /></div>
      </div>
    </div>
  );
}

/* ═══ ÉTAPE 1 — CHOIX MODE ═══ */
function EtapeChoix({ onExcelPreviewDone, onManuelClick, onBack }) {
  const [date,    setDate]    = useState(TODAY);
  const [file,    setFile]    = useState(null);
  const [drag,    setDrag]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const ref = useRef();

  const pickFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) { setErr('Format .xlsx ou .xls uniquement.'); return; }
    setFile(f); setErr('');
  };

  const handleExcel = async () => {
    if (!date) { setErr('Date obligatoire.'); return; }
    if (!file) { setErr('Sélectionnez un fichier.'); return; }
    setLoading(true); setErr('');
    try {
      const previewData = await uploadExcelPreview(file);
      if (previewData.liste_id && date !== previewData.date_visite) {
        try { await updateDateVisite(previewData.liste_id, date); } catch { /* non bloquant */ }
      }
      onExcelPreviewDone({ listeId: previewData.liste_id, preview: previewData, date });
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur analyse fichier.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:13, fontFamily:'inherit' }}>
          <IcoBack /> Retour
        </button>
        <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0 }}>Nouvelle liste d'embauche</h2>
      </div>
      <div style={{ maxWidth:680 }}>
        <div style={{ background:'white', borderRadius:12, border:'1px solid #f1f5f9', padding:18, marginBottom:16 }}>
          <label style={lbl}>Date de la visite *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, fontSize:14, maxWidth:240 }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Excel */}
          <div style={{ background:'white', borderRadius:12, border:'1.5px solid #e2e8f0', padding:18, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:34, height:34, background:'#f0fdf4', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📊</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Import Excel</div>
                <div style={{ fontSize:11, color:'#64748b' }}>Recommandé 5+ candidats</div>
              </div>
            </div>
            <div onClick={() => ref.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
              style={{ border:`2px dashed ${file ? '#86efac' : drag ? '#93c5fd' : '#e2e8f0'}`, borderRadius:10, padding:20, textAlign:'center', cursor:'pointer', background: file ? '#f0fdf4' : drag ? '#eff6ff' : '#f8fafc' }}>
              <input ref={ref} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e => pickFile(e.target.files[0])} />
              {file ? (
                <div style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>
                  ✓ {file.name}<br/>
                  <span style={{ fontSize:11, fontWeight:400, color:'#64748b' }}>{(file.size/1024).toFixed(0)} KB</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:24, marginBottom:6 }}>📂</div>
                  <div style={{ fontSize:13, color:'#64748b' }}>Glisser ou cliquer</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>.xlsx / .xls</div>
                </div>
              )}
            </div>
            {err && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#b91c1c', background:'#fef2f2', padding:'7px 10px', borderRadius:8 }}><IcoWarn /> {err}</div>}
            <button onClick={handleExcel} disabled={loading || !file}
              style={{ padding:'10px', borderRadius:9, border:'none', background: !file || loading ? '#e2e8f0' : '#15803d', color: !file || loading ? '#94a3b8' : 'white', cursor: !file || loading ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>
              {loading ? 'Analyse…' : 'Analyser le fichier →'}
            </button>
          </div>
          {/* Manuel */}
          <div style={{ background:'white', borderRadius:12, border:'1.5px solid #e2e8f0', padding:18, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:34, height:34, background:'#eff6ff', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✏️</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Saisie manuelle</div>
                <div style={{ fontSize:11, color:'#64748b' }}>1 à 4 candidats</div>
              </div>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
              {['Ajouter un par un','Modifier avant confirmation','Vérifier dans le système RH'].map((t,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#475569' }}>
                  <div style={{ width:18, height:18, background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <IcoCheck />
                  </div>
                  {t}
                </div>
              ))}
            </div>
            <button onClick={() => { if (!date) { setErr('Date obligatoire.'); return; } onManuelClick({ date }); }}
              style={{ padding:'10px', borderRadius:9, border:'none', background:'#1d4ed8', color:'white', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>
              Saisie manuelle →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ ÉTAPE 2A — VALIDATION EXCEL ═══ */
function EtapeValidationExcel({ listeId, date, preview, onConfirm, onBack }) {
  const { apercu: apercuInit = [], erreurs = [] } = preview;
  const [candidats, setCandidats] = useState(apercuInit.map(c => ({ ...VIDE, ...c })));
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState('');
  const [editMode,  setEditMode]  = useState(false);

  const handleChange = (i, f, v) => setCandidats(prev => prev.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
  const handleDelete = (i) => setCandidats(prev => prev.filter((_, idx) => idx !== i));
  const handleAdd    = () => setCandidats(prev => [...prev, { ...VIDE, ligne_source: 999 }]);

  const handleBack = async () => {
    if (listeId) { try { await deleteListe(listeId); } catch { /* silent */ } }
    onBack();
  };

  const handleConfirm = async () => {
    if (candidats.length === 0) { setErr('Aucun candidat à importer.'); return; }
    setLoading(true); setErr('');
    try {
      const confirmResponse = await uploadExcelConfirmer(listeId, candidats);

      let listeDetail = null;
      const candidateIds = extractConfirmListeIds(confirmResponse, listeId);
      for (const id of candidateIds) {
        try {
          listeDetail = await getListeDetail(id);
          if (listeDetail?.id) break;
        } catch {
          // Essayer l'id suivant
        }
      }

      if (!listeDetail) {
        const listes = await getListes();
        const targetRef = extractConfirmReference(confirmResponse);
        const targetDate = normalizeIsoDate(date || preview?.date_visite);

        if (targetRef) {
          listeDetail = listes.find((l) => String(l?.reference || '').trim() === String(targetRef).trim()) || null;
        }

        if (!listeDetail && targetDate) {
          const sameDate = listes.filter((l) => normalizeIsoDate(l?.date_visite) === targetDate);
          if (sameDate.length) {
            const exactCount = sameDate.find((l) => getCandidatesCount(l) === candidats.length);
            const ordered = [...sameDate].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
            listeDetail = exactCount || ordered[0] || null;
          }
        }

        if (!listeDetail && Array.isArray(listes) && listes.length) {
          listeDetail = [...listes].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))[0];
        }

        if (listeDetail?.id) {
          try {
            listeDetail = await getListeDetail(listeDetail.id);
          } catch {
            // On conserve l'objet liste trouvé dans getListes()
          }
        }
      }

      if (!listeDetail?.id) {
        throw new Error('LISTE_CONFIRMEE_INTROUVABLE');
      }

      onConfirm(listeDetail);
    } catch (ex) {
      setErr(
        ex.response?.data?.error ||
        ex.response?.data?.detail ||
        'La confirmation est passée mais la liste créée est introuvable. Vérifiez le filtrage site côté backend.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={handleBack} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:13, fontFamily:'inherit' }}>
          <IcoBack /> Retour
        </button>
        <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0 }}>Validation du fichier</h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Lignes lues', val:candidats.length+erreurs.length, color:'#1d4ed8', bg:'#eff6ff' },
          { label:'Valides',     val:candidats.length,                 color:'#15803d', bg:'#f0fdf4' },
          { label:'Erreurs',     val:erreurs.length,                   color:'#b91c1c', bg:'#fef2f2' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'14px 18px' }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:'monospace' }}>{s.val}</div>
            <div style={{ fontSize:12, color:s.color, opacity:.8, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {erreurs.length > 0 && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', marginBottom:14, maxHeight:160, overflowY:'auto' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#b91c1c', marginBottom:6 }}>⚠ {erreurs.length} ligne(s) ignorée(s)</div>
          {erreurs.map((e, i) => (
            <div key={i} style={{ fontSize:12, color:'#7f1d1d', padding:'2px 0', borderBottom: i<erreurs.length-1?'1px solid #fecaca':'none' }}>
              Ligne {e.ligne} — {e.erreur}
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{candidats.length} candidat{candidats.length>1?'s':''}</div>
        <button onClick={() => setEditMode(m => !m)}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:12, fontWeight:600, color:'#475569', fontFamily:'inherit' }}>
          <IcoEdit /> {editMode ? 'Vue tableau' : 'Modifier les candidats'}
        </button>
      </div>
      {editMode ? (
        <div style={{ maxHeight:500, overflowY:'auto', marginBottom:14 }}>
          {candidats.map((c, i) => (
            <FormCandidatRow key={i} c={c} index={i} onChange={handleChange} onDelete={handleDelete} isOnly={candidats.length===1} />
          ))}
          <button onClick={handleAdd} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%', padding:'10px', borderRadius:10, border:'2px dashed #e2e8f0', background:'#f8fafc', color:'#475569', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
            <IcoPlus /> Ajouter un candidat
          </button>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:12, border:'1px solid #f1f5f9', overflow:'hidden', marginBottom:14 }}>
          <div style={{ overflowX:'auto', maxHeight:280, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ position:'sticky', top:0 }}>
                <tr style={{ background:'#f8fafc' }}>
                  {['#','Nom complet','Matricule','CIN','Fonction','Projet','Date recrutement'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidats.map((c, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}>
                    <td style={{ padding:'8px 12px', color:'#94a3b8', fontFamily:'monospace' }}>{c.ligne_source||i+1}</td>
                    <td style={{ padding:'8px 12px', fontWeight:600, color:'#0f172a' }}>{c.nom} {c.prenom}</td>
                    <td style={{ padding:'8px 12px', fontFamily:'monospace', color:'#475569' }}>{c.matricule}</td>
                    <td style={{ padding:'8px 12px', fontFamily:'monospace', color:'#475569' }}>{c.cin||'—'}</td>
                    <td style={{ padding:'8px 12px', color:'#475569' }}>{c.poste||'—'}</td>
                    <td style={{ padding:'8px 12px', color:'#475569' }}>{c.projet||'—'}</td>
                    <td style={{ padding:'8px 12px', color:'#475569' }}>{c.date_recrutement||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {err && <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 14px', borderRadius:10, fontSize:13, marginBottom:14 }}><IcoWarn /> {err}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={handleBack} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontWeight:600, fontSize:14, color:'#475569', fontFamily:'inherit' }}>
          ← Annuler
        </button>
        <button onClick={handleConfirm} disabled={loading || candidats.length===0}
          style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background: loading||candidats.length===0?'#93c5fd':'#1d4ed8', color:'white', cursor: candidats.length===0?'not-allowed':'pointer', fontWeight:700, fontSize:14, fontFamily:'inherit' }}>
          {loading ? 'Import…' : `Confirmer — ${candidats.length} candidat${candidats.length>1?'s':''}`}
        </button>
      </div>
    </div>
  );
}

/* ═══ ÉTAPE 2B — SAISIE MANUELLE ═══ */
function EtapeManuelle({ date, onConfirm, onBack }) {
  const [candidats, setCandidats] = useState([{ ...VIDE }]);
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState('');

  const handleChange = (i, f, v) => setCandidats(prev => prev.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
  const handleBatchChange = (i, patch) => setCandidats(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const handleAdd    = () => setCandidats(prev => [...prev, { ...VIDE }]);
  const handleDelete = (i) => setCandidats(prev => prev.filter((_, idx) => idx !== i));

  const validate = () => {
    for (let i = 0; i < candidats.length; i++) {
      const c = candidats[i];
      if (!c.nom.trim())       return `Candidat #${i+1} : nom obligatoire`;
      if (!c.prenom.trim())    return `Candidat #${i+1} : prénom obligatoire`;
      if (!c.matricule.trim()) return `Candidat #${i+1} : matricule obligatoire`;
    }
    const mats = candidats.map(c => c.matricule.trim());
    if (new Set(mats).size !== mats.length) return 'Deux candidats ont le même matricule';
    return null;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (e) { setErr(e); return; }
    setLoading(true); setErr('');
    try {
      const apercu = candidats.map((c, i) => ({
        ...c,
        ligne_source: i + 2,
        date_naissance: c.date_naissance || null,
        date_recrutement: c.date_recrutement || null,
      }));
      const liste = await creerListeManuelle(date, apercu);
      onConfirm(liste);
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Erreur lors de la création.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:13, fontFamily:'inherit' }}>
          <IcoBack /> Retour
        </button>
        <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0 }}>Saisie manuelle</h2>
        <span style={{ fontSize:11, color:'#64748b', background:'#f1f5f9', padding:'3px 10px', borderRadius:20 }}>
          {new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
        </span>
      </div>
      {candidats.map((c, i) => (
        <FormCandidatRow key={i} c={c} index={i} onChange={handleChange} onBatchChange={handleBatchChange} onDelete={handleDelete} isOnly={candidats.length===1} />
      ))}
      <button onClick={handleAdd} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%', padding:'10px', borderRadius:10, border:'2px dashed #e2e8f0', background:'#f8fafc', color:'#475569', cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:16, fontFamily:'inherit' }}>
        <IcoPlus /> Ajouter un candidat
      </button>
      {err && <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 14px', borderRadius:10, fontSize:13, marginBottom:14 }}><IcoWarn /> {err}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onBack} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontWeight:600, fontSize:14, color:'#475569', fontFamily:'inherit' }}>
          ← Annuler
        </button>
        <button onClick={handleSubmit} disabled={loading}
          style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background: loading?'#93c5fd':'#1d4ed8', color:'white', cursor:'pointer', fontWeight:700, fontSize:14, fontFamily:'inherit' }}>
          {loading ? 'Création…' : `Créer liste — ${candidats.length} candidat${candidats.length>1?'s':''}`}
        </button>
      </div>
    </div>
  );
}

/* ═══ SUCCÈS ═══ */
function Succes({ liste, onRetour, onVoirListe }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 20px' }}>
      <div style={{ width:64, height:64, background:'#f0fdf4', border:'2px solid #86efac', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:28 }}>✓</div>
      <div style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Liste créée !</div>
      <div style={{ fontSize:14, color:'#475569', marginBottom:4 }}>Référence : <strong style={{ color:'#1d4ed8' }}>{liste.reference}</strong></div>
      <div style={{ fontSize:13, color:'#94a3b8', marginBottom:28 }}>Statut <strong>Brouillon</strong> — soumettez-la pour que l'infirmier la reçoive.</div>
      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        <button onClick={onRetour} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontWeight:600, fontSize:13, color:'#475569', fontFamily:'inherit' }}>
          + Nouvelle liste
        </button>
        <button onClick={() => onVoirListe(liste)} style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'#1d4ed8', color:'white', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>
          Voir la liste →
        </button>
      </div>
    </div>
  );
}

/* ═══ COMPOSANT PRINCIPAL ═══ */
export default function NouvelleListeEmbauche({ onBack, onListeCreee }) {
  const [step, setStep] = useState('choix');
  const [data, setData] = useState({});

  if (step === 'succes')
    return <Succes liste={data.liste}
      onRetour={() => { setStep('choix'); setData({}); }}
      onVoirListe={onListeCreee} />;

  if (step === 'excel')
    return <EtapeValidationExcel
      listeId={data.listeId}
      date={data.date}
      preview={data.preview}
      onConfirm={(l) => { setData(d => ({...d, liste:l})); setStep('succes'); }}
      onBack={() => setStep('choix')} />;

  if (step === 'manuel')
    return <EtapeManuelle date={data.date}
      onConfirm={(l) => { setData(d => ({...d, liste:l})); setStep('succes'); }}
      onBack={() => setStep('choix')} />;

  return <EtapeChoix
    onExcelPreviewDone={(d) => { setData(d); setStep('excel'); }}
    onManuelClick={(d) => { setData(d); setStep('manuel'); }}
    onBack={onBack} />;
}