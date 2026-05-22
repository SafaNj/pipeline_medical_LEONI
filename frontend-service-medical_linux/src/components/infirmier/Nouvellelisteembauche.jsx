// src/components/rh/NouvelleListeEmbauche.jsx
import { useState, useRef } from 'react';
import { creerListe, uploadExcelPreview, uploadExcelConfirmer, rechercheIM } from '../../api/embaucheApi';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { uiAlert } from '../../utils/uiAlert';

/* ── icônes ── */
const IcoUpload  = ({ c='#1d4ed8' }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcoFile    = ({ c='#15803d' }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoCheck   = ({ c='#15803d' }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoWarn    = ({ c='#b91c1c' }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoBack    = ({ c='#64748b' }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoPlus    = ({ c='#fff' })    => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoTrash   = ({ c='#b91c1c' }) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
const IcoExcel   = ({ c='#15803d' }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
const IcoEdit    = ({ c='#1d4ed8' }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const TODAY = new Date().toISOString().split('T')[0];

const inputStyle = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a',
  background: 'white', outline: 'none', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
  textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5,
};

const CANDIDAT_VIDE = {
  nom: '', prenom: '', matricule: '', cin: '', date_naissance: '',
  genre: '', telephone: '', gouvernorat: '', niveau: '', num_demande: '',
  ps: '', projet: '', date_recrutement: '', centre_cout: '', poste: '',
  department: '', source_information: '', formation: '',
};

/* ─── ÉTAPE 1 : choix mode + date ─── */
function Etape1({ onExcelReady, onManuelClick, onBack }) {
  const [dateVisite, setDateVisite] = useState(TODAY);
  const [file, setFile]             = useState(null);
  const [dragging, setDragging]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setErr('Format accepté : .xlsx ou .xls uniquement.'); return;
    }
    setFile(f); setErr('');
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleExcelSubmit = async () => {
    if (!dateVisite) { setErr('La date de visite est obligatoire.'); return; }
    if (!file)       { setErr('Veuillez sélectionner un fichier Excel.'); return; }
    setLoading(true); setErr('');
    try {
      const liste   = await creerListe({ date_visite: dateVisite });
      const preview = await uploadExcelPreview(file);
      onExcelReady({ liste, preview });
    } catch (e) {
      const d = e.response?.data;
      setErr(d ? (d.error || JSON.stringify(d)) : 'Erreur réseau.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', gap:4, color:'#64748b', fontSize:13 }}>
          <IcoBack /> Retour
        </button>
        <div style={{ fontSize:19, fontWeight:800, color:'#0f172a' }}>Nouvelle liste d'embauche</div>
      </div>

      <div style={{ maxWidth:640 }}>
        {/* Date */}
        <div style={{ background:'white', borderRadius:14, border:'1px solid #f1f5f9',
          padding:20, marginBottom:16 }}>
          <label style={labelStyle}>Date de la visite *</label>
          <input type="date" value={dateVisite} onChange={e => setDateVisite(e.target.value)}
            style={{ ...inputStyle, fontSize:14 }} />
        </div>

        {/* Deux modes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>

          {/* Mode Excel */}
          <div style={{ background:'white', borderRadius:14, border:'1.5px solid #e2e8f0',
            padding:20, display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:36, height:36, background:'#f0fdf4', borderRadius:10,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <IcoExcel />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Import Excel</div>
                <div style={{ fontSize:11, color:'#64748b' }}>Recommandé pour 5+ candidats</div>
              </div>
            </div>

            <div onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{ border:`2px dashed ${file ? '#86efac' : dragging ? '#93c5fd' : '#e2e8f0'}`,
                borderRadius:10, padding:20, textAlign:'center', cursor:'pointer',
                background: file ? '#f0fdf4' : dragging ? '#eff6ff' : '#f8fafc',
                marginBottom:12, flex:1 }}>
              <input ref={inputRef} type="file" accept=".xlsx,.xls"
                style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <IcoFile />
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>{file.name}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{(file.size/1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom:6, display:'flex', justifyContent:'center' }}>
                    <IcoUpload c="#94a3b8" />
                  </div>
                  <div style={{ fontSize:12, color:'#64748b' }}>Glisser ou cliquer</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>.xlsx / .xls</div>
                </div>
              )}
            </div>

            {err && (
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fef2f2',
                border:'1px solid #fecaca', color:'#b91c1c', padding:'8px 12px',
                borderRadius:8, fontSize:12, marginBottom:10 }}>
                <IcoWarn /> {err}
              </div>
            )}

            <button onClick={handleExcelSubmit} disabled={loading || !file}
              style={{ padding:'10px', borderRadius:10, border:'none',
                background: (!file || loading) ? '#e2e8f0' : '#15803d',
                color: (!file || loading) ? '#94a3b8' : 'white',
                cursor: (!file || loading) ? 'not-allowed' : 'pointer',
                fontWeight:700, fontSize:13 }}>
              {loading ? 'Analyse…' : 'Analyser le fichier →'}
            </button>
          </div>

          {/* Mode Manuel */}
          <div style={{ background:'white', borderRadius:14, border:'1.5px solid #e2e8f0',
            padding:20, display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:36, height:36, background:'#eff6ff', borderRadius:10,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <IcoEdit />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Saisie manuelle</div>
                <div style={{ fontSize:11, color:'#64748b' }}>Pour 1 à 4 candidats</div>
              </div>
            </div>

            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
              gap:8, padding:'12px 0' }}>
              {['Ajouter candidat par candidat', 'Modifier avant confirmation', 'Supprimer si erreur'].map((t,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#475569' }}>
                  <div style={{ width:18, height:18, background:'#eff6ff', borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <IcoCheck c="#1d4ed8" />
                  </div>
                  {t}
                </div>
              ))}
            </div>

            <button onClick={() => onManuelClick(dateVisite)}
              style={{ padding:'10px', borderRadius:10, border:'none',
                background:'#1d4ed8', color:'white',
                cursor:'pointer', fontWeight:700, fontSize:13, marginTop:12 }}>
              Saisie manuelle →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SAISIE MANUELLE ─── */
function FormCandidatManuel({ candidat, index, onChange, onDelete, isOnly }) {
  const set = (field) => (e) => onChange(index, field, e.target.value);
  const normalizeGenre = (v) => {
    const g = String(v || '').toLowerCase();
    if (g === 'm' || g === 'male' || g === 'homme') return 'homme';
    if (g === 'f' || g === 'female' || g === 'femme') return 'femme';
    return '';
  };

  const handleMatriculeBlur = async () => {
    const mat = candidat.matricule.trim();
    if (!mat || mat.length < 5) return;
    try {
      const res = await rechercheIM(mat);
      if (res?.data) {
        const d = res.data;
        const genre = normalizeGenre(d.genre || d.sexe);
        const patch = {
          nom: d.nom || candidat.nom,
          prenom: d.prenom || candidat.prenom,
          cin: d.cin || candidat.cin,
          date_naissance: d.date_naissance || candidat.date_naissance,
          genre: genre || candidat.genre,
          telephone: d.telephone || candidat.telephone,
          gouvernorat: d.adr_gouv || d.gouvernorat || d.gouvernerat || candidat.gouvernorat,
          poste: d.poste || d.fonction || candidat.poste,
          department: d.department || candidat.department,
        };
        Object.entries(patch).forEach(([f, v]) => onChange(index, f, v));
      }
      if (res?.warning) {
        await uiAlert({ icon: 'warning', title: 'Avertissement', text: `⚠ ${res.warning}` });
      }
    } catch (e) {
      const st = e.response?.status;
      // Sur blur auto : seulement bloquer si le compte ne peut pas utiliser la recherche IM (403/401).
      if (st === 403 || st === 401) {
        await uiAlert({
          icon: 'warning',
          title: 'Recherche système RH',
          text: formatAxiosError(e),
        });
      }
      // 404 / autres : pas d’alerte au blur (pré-remplissage silencieux impossible)
    }
  };

  return (
    <div style={{ background:'white', borderRadius:12, border:'1.5px solid #e2e8f0',
      padding:16, marginBottom:12, position:'relative' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>
          Candidat #{index + 1}
          {candidat.nom && candidat.prenom && (
            <span style={{ fontSize:11, color:'#64748b', fontWeight:400, marginLeft:8 }}>
              — {candidat.nom} {candidat.prenom}
            </span>
          )}
        </div>
        {!isOnly && (
          <button onClick={() => onDelete(index)}
            style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7,
              padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center', gap:4,
              fontSize:11, color:'#b91c1c', fontFamily:'inherit' }}>
            <IcoTrash /> Supprimer
          </button>
        )}
      </div>

      {/* Ligne 1 : Identité */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={labelStyle}>Nom *</label>
          <input value={candidat.nom} onChange={set('nom')} placeholder="ex: AKERMI"
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Prénom *</label>
          <input value={candidat.prenom} onChange={set('prenom')} placeholder="ex: Houcem"
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Matricule *</label>
          <input value={candidat.matricule} onChange={set('matricule')} onBlur={handleMatriculeBlur} placeholder="ex: 50234567890"
            style={inputStyle} />
        </div>
      </div>

      {/* Ligne 2 : CIN / Date naissance / Genre */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={labelStyle}>CIN</label>
          <input value={candidat.cin} onChange={set('cin')} placeholder="12345678"
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Date naissance</label>
          <input type="date" value={candidat.date_naissance} onChange={set('date_naissance')}
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Genre</label>
          <select value={candidat.genre} onChange={set('genre')} style={inputStyle}>
            <option value="">—</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
          </select>
        </div>
      </div>

      {/* Ligne 3 : Poste / Département / Projet */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={labelStyle}>Fonction *</label>
          <input value={candidat.poste} onChange={set('poste')} placeholder="ex: Technicien"
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Département</label>
          <input value={candidat.department} onChange={set('department')} placeholder="ex: Production"
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Projet</label>
          <input value={candidat.projet} onChange={set('projet')} placeholder="ex: Projet Alpha"
            style={inputStyle} />
        </div>
      </div>

      {/* Ligne 4 : Date recrutement / Gouvernorat / Téléphone */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        <div>
          <label style={labelStyle}>Date recrutement</label>
          <input type="date" value={candidat.date_recrutement} onChange={set('date_recrutement')}
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Gouvernorat</label>
          <input value={candidat.gouvernorat} onChange={set('gouvernorat')} placeholder="ex: Monastir"
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Téléphone</label>
          <input value={candidat.telephone} onChange={set('telephone')} placeholder="ex: 55123456"
            style={inputStyle} />
        </div>
      </div>
    </div>
  );
}

function SaisieManuelle({ dateVisite, onConfirm, onBack }) {
  const [candidats, setCandidats] = useState([{ ...CANDIDAT_VIDE }]);
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState('');

  const handleChange = (index, field, value) => {
    setCandidats(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };
  const handleAdd    = () => setCandidats(prev => [...prev, { ...CANDIDAT_VIDE }]);
  const handleDelete = (index) => setCandidats(prev => prev.filter((_, i) => i !== index));

  const validate = () => {
    for (let i = 0; i < candidats.length; i++) {
      const c = candidats[i];
      if (!c.nom.trim())       return `Candidat #${i+1} : le nom est obligatoire.`;
      if (!c.prenom.trim())    return `Candidat #${i+1} : le prénom est obligatoire.`;
      if (!c.matricule.trim()) return `Candidat #${i+1} : le matricule est obligatoire.`;
    }
    const mats = candidats.map(c => c.matricule.trim());
    if (new Set(mats).size !== mats.length) return 'Deux candidats ont le même matricule.';
    return null;
  };

  const handleSubmit = async () => {
    const errMsg = validate();
    if (errMsg) { setErr(errMsg); return; }
    setLoading(true); setErr('');
    try {
      const liste = await creerListe({ date_visite: dateVisite });
      const apercu = candidats.map((c, i) => ({
        ...c, ligne_source: i + 2,
        date_naissance: c.date_naissance || null,
        date_recrutement: c.date_recrutement || null,
      }));
      await uploadExcelConfirmer(liste.id, apercu);
      onConfirm(liste);
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur lors de la création.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', gap:4, color:'#64748b', fontSize:13 }}>
          <IcoBack /> Retour
        </button>
        <div style={{ fontSize:19, fontWeight:800, color:'#0f172a' }}>Saisie manuelle</div>
        <div style={{ fontSize:12, color:'#64748b', background:'#f1f5f9',
          padding:'3px 10px', borderRadius:20 }}>
          Visite : {new Date(dateVisite).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}
        </div>
      </div>

      {candidats.map((c, i) => (
        <FormCandidatManuel
          key={i} candidat={c} index={i}
          onChange={handleChange}
          onDelete={handleDelete}
          isOnly={candidats.length === 1}
        />
      ))}

      <button onClick={handleAdd}
        style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px',
          borderRadius:10, border:'2px dashed #e2e8f0', background:'#f8fafc',
          cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569',
          width:'100%', justifyContent:'center', marginBottom:20 }}>
        <IcoPlus c="#475569" /> Ajouter un candidat
      </button>

      {err && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef2f2',
          border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 14px',
          borderRadius:10, fontSize:13, marginBottom:14 }}>
          <IcoWarn /> {err}
        </div>
      )}

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onBack}
          style={{ flex:1, padding:'12px', borderRadius:12, border:'1.5px solid #e2e8f0',
            background:'white', cursor:'pointer', fontWeight:600, fontSize:14, color:'#475569' }}>
          ← Annuler
        </button>
        <button onClick={handleSubmit} disabled={loading}
          style={{ flex:2, padding:'12px', borderRadius:12, border:'none',
            background: loading ? '#93c5fd' : '#1d4ed8', color:'white',
            cursor:'pointer', fontWeight:700, fontSize:14 }}>
          {loading ? 'Création en cours…' : `Créer la liste — ${candidats.length} candidat${candidats.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

/* ─── ÉTAPE 2 : validation Excel ─── */
function EtapeValidation({ liste, preview, onConfirm, onBack }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const { apercu = [], erreurs = [] } = preview;
  const valides   = apercu.length;
  const nbErreurs = erreurs.length;

  const handleConfirm = async () => {
    if (valides === 0) { setErr('Aucun candidat valide à importer.'); return; }
    setLoading(true); setErr('');
    try {
      await uploadExcelConfirmer(liste.id, apercu);
      onConfirm(liste);
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur lors de la confirmation.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', gap:4, color:'#64748b', fontSize:13 }}>
          <IcoBack /> Retour
        </button>
        <div style={{ fontSize:19, fontWeight:800, color:'#0f172a' }}>Validation du fichier</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Lignes lues', val:valides+nbErreurs, color:'#1d4ed8', bg:'#eff6ff' },
          { label:'Valides',     val:valides,            color:'#15803d', bg:'#f0fdf4' },
          { label:'Erreurs',     val:nbErreurs,          color:'#b91c1c', bg:'#fef2f2' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'16px 18px' }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:'monospace' }}>{s.val}</div>
            <div style={{ fontSize:12, color:s.color, opacity:.8, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {erreurs.length > 0 && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10,
          padding:'12px 16px', marginBottom:16, maxHeight:200, overflowY:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8,
            color:'#b91c1c', fontWeight:700, fontSize:13 }}>
            <IcoWarn /> {erreurs.length} ligne(s) ignorée(s)
          </div>
          {erreurs.map((e, i) => (
            <div key={i} style={{ fontSize:12, color:'#7f1d1d', padding:'3px 0',
              borderBottom: i < erreurs.length-1 ? '1px solid #fecaca' : 'none' }}>
              Ligne {e.ligne} — {e.erreur}
            </div>
          ))}
        </div>
      )}

      {apercu.length > 0 && (
        <div style={{ background:'white', borderRadius:12, border:'1px solid #f1f5f9',
          overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'12px 16px', fontSize:13, fontWeight:700,
            borderBottom:'1px solid #f1f5f9', background:'#f8fafc' }}>
            Aperçu — {valides} candidat{valides > 1 ? 's' : ''} à importer
          </div>
          <div style={{ overflowX:'auto', maxHeight:280, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ position:'sticky', top:0 }}>
                <tr style={{ background:'#f8fafc' }}>
                  {['#','Nom complet','Matricule','CIN','Fonction','Projet','Date recrutement'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:10,
                      fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                      borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apercu.map((c, i) => (
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

      {err && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef2f2',
          border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 14px',
          borderRadius:10, fontSize:13, marginBottom:14 }}>
          <IcoWarn /> {err}
        </div>
      )}

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onBack}
          style={{ flex:1, padding:'12px', borderRadius:12, border:'1.5px solid #e2e8f0',
            background:'white', cursor:'pointer', fontWeight:600, fontSize:14, color:'#475569' }}>
          ← Modifier le fichier
        </button>
        <button onClick={handleConfirm} disabled={loading || valides===0}
          style={{ flex:2, padding:'12px', borderRadius:12, border:'none',
            background: loading||valides===0 ? '#93c5fd' : '#1d4ed8',
            color:'white', cursor: valides===0 ? 'not-allowed' : 'pointer',
            fontWeight:700, fontSize:14 }}>
          {loading ? 'Import en cours…' : `Confirmer — ${valides} candidat${valides>1?'s':''}`}
        </button>
      </div>
    </div>
  );
}

/* ─── SUCCÈS ─── */
function Succes({ liste, onRetour, onVoirListe }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 20px' }}>
      <div style={{ width:68, height:68, background:'#f0fdf4', border:'2px solid #86efac',
        borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
        margin:'0 auto 20px' }}>
        <IcoCheck c="#15803d" />
      </div>
      <div style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>
        Liste créée avec succès !
      </div>
      <div style={{ fontSize:14, color:'#475569', marginBottom:4 }}>
        Référence : <strong style={{ color:'#1d4ed8' }}>{liste.reference}</strong>
      </div>
      <div style={{ fontSize:13, color:'#94a3b8', marginBottom:28 }}>
        Statut : <strong>Brouillon</strong> — Assignez un médecin puis soumettez à l'infirmier.
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        <button onClick={onRetour}
          style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0',
            background:'white', cursor:'pointer', fontWeight:600, fontSize:13, color:'#475569' }}>
          + Nouvelle liste
        </button>
        <button onClick={() => onVoirListe(liste)}
          style={{ padding:'10px 22px', borderRadius:10, border:'none',
            background:'#1d4ed8', color:'white', cursor:'pointer', fontWeight:700, fontSize:13 }}>
          Voir la liste →
        </button>
      </div>
    </div>
  );
}

/* ─── COMPOSANT PRINCIPAL ─── */
export default function NouvelleListeEmbauche({ onBack, onListeCreee }) {
  const [step, setStep]       = useState('choix');      // choix | excel | manuel | succes
  const [stepData, setStepData] = useState({});

  if (step === 'succes')
    return <Succes liste={stepData.liste}
      onRetour={() => { setStep('choix'); setStepData({}); }}
      onVoirListe={onListeCreee} />;

  if (step === 'excel')
    return <EtapeValidation liste={stepData.liste} preview={stepData.preview}
      onConfirm={(l) => { setStepData(s => ({...s, liste:l})); setStep('succes'); }}
      onBack={() => setStep('choix')} />;

  if (step === 'manuel')
    return <SaisieManuelle dateVisite={stepData.dateVisite}
      onConfirm={(l) => { setStepData(s => ({...s, liste:l})); setStep('succes'); }}
      onBack={() => setStep('choix')} />;

  return <Etape1
    onExcelReady={(data) => { setStepData(data); setStep('excel'); }}
    onManuelClick={(date) => { setStepData({ dateVisite: date }); setStep('manuel'); }}
    onBack={onBack} />;
}