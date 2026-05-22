// src/components/infirmier/DonDirect.jsx
//
// UN SEUL FORMULAIRE — deux routes selon contexte :
//   Sans collaborateur : POST /stock/consommation-courante/  (consommationCourante)
//   Avec collaborateur : POST /stock/actes/ type_acte=DON    (creerActe)
//
// Les deux acceptent un motif libre.
// L'historique passe par getActesByCollaborateur (existant).

import { useState, useEffect, useRef } from 'react';
import { getMedicaments, consommationCourante, creerActe } from '../../api/stockApi';
import { getDossierByCollaborateur, parseAllergiesApiPayload } from '../../api/medicalRecordsApi';
import axiosInstance from '../../api/axios';

const searchCollaborateurs = async (q) => {
  const res = await axiosInstance.get('/employees/collaborateurs/', { params: { search: q } });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

/* Icones */
const IcoBox    = ({ c='#0369a1', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoCheck  = ({ c='#0d9488', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoWarn   = ({ c='#d97706', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoDanger = ({ c='#dc2626', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoShelf  = ({ c='#0284c7', size=15 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/></svg>;
const IcoUser   = ({ c='#0369a1', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoSearch = ({ c='#94a3b8', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

const UNITES = [
  { value:'comprime',     label:'Comprime'     },
  { value:'gelule',       label:'Gelule'       },
  { value:'ampoule',      label:'Ampoule'      },
  { value:'millilitre',   label:'Millilitre'   },
  { value:'sachet',       label:'Sachet'       },
  { value:'suppositoire', label:'Suppositoire' },
  { value:'patch',        label:'Patch'        },
  { value:'unite',        label:'Unite'        },
  { value:'autre',        label:'Autre'        },
];
const labelUnite = (val, perso) => {
  if (val === 'autre' && perso && String(perso).trim()) return String(perso).trim();
  return UNITES.find(u => u.value === val)?.label || val || 'unite';
};

const inputS = {
  width:'100%', border:'1.5px solid #e2e8f0', borderRadius:9,
  padding:'9px 11px', fontSize:13, outline:'none', background:'white',
  boxSizing:'border-box', fontFamily:'inherit', transition:'border-color .15s',
};
const labelS = {
  display:'block', fontSize:11, fontWeight:700, color:'#475569',
  textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5,
};


/* Indicateur stock */
function StockMini({ med, quantite }) {
  if (!med) return null;
  const stock   = med.stock_info?.quantite ?? 0;
  const seuil   = med.stock_info?.seuil_alerte ?? 0;
  const unite   = labelUnite(med.unite, med.unite_personnalise);
  const demande = Number(quantite) || 0;
  const apres   = stock - demande;
  const insuf   = demande > 0 && demande > stock;
  const st      = String(med.stock_info?.statut || '').toUpperCase();

  let bar, bc, bg, txt, ico;
  if (st === 'EPUISE' || stock === 0) {
    bar='#ef4444'; bc='#b91c1c'; bg='#fee2e2'; txt='Rupture'; ico=<IcoDanger c="#dc2626" size={11}/>;
  } else if (st === 'FAIBLE' || (seuil > 0 && stock <= seuil * 0.4)) {
    bar='#ef4444'; bc='#b91c1c'; bg='#fee2e2'; txt='Tres faible'; ico=<IcoDanger c="#dc2626" size={11}/>;
  } else if (seuil > 0 && stock <= seuil) {
    bar='#f59e0b'; bc='#b45309'; bg='#fef3c7'; txt='Faible'; ico=<IcoWarn c="#d97706" size={11}/>;
  } else {
    bar='#0d9488'; bc='#0f766e'; bg='#f0fdf9'; txt='Suffisant'; ico=<IcoCheck c="#0d9488" size={11}/>;
  }

  const mx     = Math.max(stock, seuil * 3, 1);
  const pS     = Math.min(100, Math.round(stock / mx * 100));
  const pSeuil = seuil > 0 ? Math.min(100, Math.round(seuil / mx * 100)) : null;

  return (
    <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#334155', display:'flex', alignItems:'center', gap:5 }}>
          <IcoBox c="#64748b" size={12}/> Stock etagere
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, background:bg, color:bc, padding:'2px 8px', borderRadius:20 }}>
          {ico} {txt}
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:6 }}>
        <span style={{ fontSize:24, fontWeight:800, color:bar, lineHeight:1 }}>{stock}</span>
        <span style={{ fontSize:12, color:'#64748b' }}>{unite}(s) disponibles</span>
        {demande > 0 && (
          <span style={{ fontSize:11, color:'#94a3b8', marginLeft:4 }}>
            apres sortie :{' '}
            <strong style={{ color: apres < 0 ? '#dc2626' : apres <= seuil ? '#f59e0b' : '#0d9488' }}>
              {Math.max(0, apres)} {unite}(s)
            </strong>
          </span>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, position:'relative', height:6, background:'#e2e8f0', borderRadius:3 }}>
          <div style={{ position:'absolute', left:0, top:0, height:'100%', borderRadius:3, width:`${pS}%`, background:bar, transition:'width .4s' }}/>
          {pSeuil !== null && (
            <div style={{ position:'absolute', top:-2, bottom:-2, width:2, left:`${pSeuil}%`, background:'#94a3b8', borderRadius:1 }}/>
          )}
        </div>
        {seuil > 0 && <span style={{ fontSize:10, color:'#94a3b8', flexShrink:0 }}>seuil {seuil}</span>}
      </div>
      {insuf && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:7, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, padding:'6px 10px', fontSize:11.5, color:'#b91c1c', fontWeight:600 }}>
          <IcoDanger c="#dc2626" size={11}/> Quantite ({demande}) superieure au stock ({stock})
        </div>
      )}
    </div>
  );
}

/* Autocomplete collaborateur */
function CollabSearch({ value, onSelect, onReset }) {
  const [query,    setQuery]    = useState('');
  const [suggest,  setSuggest]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const dropRef  = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { if (!value) setQuery(''); }, [value]);

  const handleChange = (val) => {
    setQuery(val);
    if (value) onReset();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setSuggest([]); setShowDrop(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const d = await searchCollaborateurs(val.trim());
        setSuggest(d.slice(0, 8));
        setShowDrop(true);
      } catch { setSuggest([]); }
      finally { setLoading(false); }
    }, 300);
  };

  const pick = (c) => {
    setQuery(`${c.matricule} — ${c.nom} ${c.prenom}`);
    setSuggest([]); setShowDrop(false);
    onSelect(c);
  };

  return (
    <div ref={dropRef} style={{ position:'relative' }}>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
          {loading ? <span style={{ fontSize:11, color:'#94a3b8' }}>...</span> : <IcoSearch c="#94a3b8" size={13}/>}
        </div>
        <input
          style={{ ...inputS, paddingLeft:32, borderColor:value?'#86efac':'#e2e8f0', background:value?'#f0fdf4':'white' }}
          placeholder="Saisir matricule ou nom du collaborateur..."
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggest.length > 0 && setShowDrop(true)}
          disabled={!!value}
        />
        {value && (
          <button
            onClick={() => { onReset(); setQuery(''); setSuggest([]); setShowDrop(false); }}
            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18, lineHeight:1 }}>
            x
          </button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {showDrop && suggest.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', border:'1.5px solid #e2e8f0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,.1)', zIndex:500, overflow:'hidden' }}>
          {suggest.map(c => (
            <div key={c.id} onClick={() => pick(c)}
              style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}
              onMouseEnter={e => e.currentTarget.style.background='#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background='white'}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <IcoUser c="#1d4ed8" size={15}/>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{c.nom} {c.prenom}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>
                  Matricule : <strong>{c.matricule}</strong> · {c.poste} · {c.department}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Carte collaborateur selectionne */}
      {value && (
        <div style={{ marginTop:8, background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <IcoUser c="#16a34a" size={16}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>{value.nom} {value.prenom}</div>
            <div style={{ fontSize:11, color:'#4ade80' }}>
              Matricule {value.matricule} · {value.poste} · {value.department}
            </div>
          </div>
          <IcoCheck c="#16a34a" size={16}/>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function DonDirect() {
  const [medicaments, setMedicaments] = useState([]);
  const [loadMeds,    setLoadMeds]    = useState(true);
  const [collab,      setCollab]      = useState(null);
  const [selectedMed, setSelectedMed] = useState('');
  const [quantite,    setQuantite]    = useState('');
  const [motif,       setMotif]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [allergiesCollaborateur, setAllergiesCollaborateur] = useState([]);
  const [allergiesAucuneEnregistree, setAllergiesAucuneEnregistree] = useState(false);
  const [loadingAllergies, setLoadingAllergies] = useState(false);

  useEffect(() => {
    getMedicaments()
      .then(d => setMedicaments(Array.isArray(d) ? d : []))
      .finally(() => setLoadMeds(false));
  }, []);

  // Charger les allergies du collaborateur quand il est sélectionné
  const handleSelectCollaborateur = async (collaborateur) => {
    setCollab(collaborateur);
    setAllergiesCollaborateur([]);
    setAllergiesAucuneEnregistree(false);
    setLoadingAllergies(true);
    try {
      const dossier = await getDossierByCollaborateur(collaborateur.id, collaborateur.matricule);
      const parsed = parseAllergiesApiPayload(dossier);
      setAllergiesCollaborateur(parsed.lignes);
      setAllergiesAucuneEnregistree(parsed.afficherAucuneEnregistree);
    } catch {
      setAllergiesCollaborateur([]);
      setAllergiesAucuneEnregistree(false);
    } finally {
      setLoadingAllergies(false);
    }
  };

  // Réinitialiser les allergies quand le collaborateur est désélectionné
  const handleResetCollaborateur = () => {
    setCollab(null);
    setAllergiesCollaborateur([]);
    setAllergiesAucuneEnregistree(false);
    setLoadingAllergies(false);
  };

  const medObj    = medicaments.find(m => m.id === Number(selectedMed));
  const stock     = medObj?.stock_info?.quantite ?? 0;
  const insuf     = Number(quantite) > 0 && Number(quantite) > stock;
  const canSubmit = selectedMed && quantite && !insuf && stock > 0;

  const handleSubmit = async () => {
    if (!selectedMed || !quantite) { setError('Medicament et quantite sont requis.'); return; }
    if (Number(quantite) <= 0)     { setError('La quantite doit etre superieure a 0.'); return; }
    if (Number(quantite) > stock)  { setError(`Stock insuffisant : seulement ${stock} disponible(s).`); return; }

    setError(''); setSuccess(''); setLoading(true);
    try {
      const unite = labelUnite(medObj?.unite, medObj?.unite_personnalise);

      if (collab) {
        // AVEC collaborateur → creerActe TYPE_DON
        // → stocke dans stock_acteinfirmier avec collaborateur_id
        // → getActesByCollaborateur(collab.id) le retrouvera dans l'historique
        await creerActe({
          type_acte:     'DON',
          collaborateur: collab.id,
          medicament:    Number(selectedMed),
          quantite:      Number(quantite),
          motif:         motif.trim() || undefined,
        });
        setSuccess(`${quantite} ${unite}(s) de ${medObj?.nom} donnes a ${collab.nom} ${collab.prenom}.`);
      } else {
        // SANS collaborateur → consommationCourante anonyme
        const res = await consommationCourante({
          medicament: Number(selectedMed),
          quantite:   Number(quantite),
          motif:      motif.trim() || undefined,
        });
        setSuccess(res?.message || `${quantite} ${unite}(s) de ${medObj?.nom} retires de l'etagere.`);
      }

      setCollab(null); setSelectedMed(''); setQuantite(''); setMotif(''); setAllergiesCollaborateur([]); setAllergiesAucuneEnregistree(false); setLoadingAllergies(false);
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.error || d?.detail || d?.collaborateur?.[0] || d?.medicament?.[0]
        || Object.values(d ?? {}).flat().join(' ');
      setError(msg || 'Erreur — verifier la console');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {collab ? <IcoUser c="#0369a1" size={16}/> : <IcoShelf c="#0284c7" size={16}/>}
        <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>
          {collab ? `Dispensation — ${collab.prenom} ${collab.nom}` : 'Consommation courante'}
        </span>
      </div>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:10, padding:'10px 12px', fontSize:13 }}>
          <IcoDanger c="#dc2626" size={14}/> {error}
        </div>
      )}
      {success && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f0fdf9', border:'1px solid #99f6e4', color:'#0f766e', borderRadius:10, padding:'10px 12px', fontSize:13 }}>
          <IcoCheck c="#0d9488" size={14}/> {success}
        </div>
      )}

      <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:12 }}>

        {/* Collaborateur (optionnel) */}
        <div>
          <label style={labelS}>
            Collaborateur{' '}
            <span style={{ fontWeight:400, textTransform:'none', color:'#94a3b8', fontSize:10 }}>
              (optionnel)
            </span>
          </label>
          <CollabSearch value={collab} onSelect={handleSelectCollaborateur} onReset={handleResetCollaborateur}/>
        </div>

        {/* Alerte allergies */}
        {loadingAllergies && collab && (
          <div style={{ background:'#fefce8', border:'1px solid #facc15', borderRadius:10, padding:'10px 14px', display:'flex', gap:10 }}>
            <div style={{ fontSize:18, lineHeight:1, flexShrink:0 }}>⌛</div>
            <div style={{ flex:1, fontSize:13, fontWeight:600, color:'#a16207' }}>Recherche des allergies du collaborateur...</div>
          </div>
        )}

        {collab && !loadingAllergies && allergiesCollaborateur.length > 0 && (
          <div style={{ background:'#fff7ed', border:'2px solid #fb923c', borderRadius:10, padding:'12px 14px', display:'flex', gap:10 }}>
            <div style={{ fontSize:24, lineHeight:1, flexShrink:0 }}>⚠</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#b45309', marginBottom:6 }}>Attention — Allergies connues :</div>
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {allergiesCollaborateur.map((allergie, idx) => (
                  <div key={idx} style={{ fontSize:12, color:'#92400e', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:4, height:4, background:'#ea580c', borderRadius:'50%', flexShrink:0 }}/>
                    {String(allergie).trim()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {collab && !loadingAllergies && allergiesAucuneEnregistree && allergiesCollaborateur.length === 0 && (
          <div
            style={{
              fontSize: 12.5,
              color: '#64748b',
              padding: '8px 10px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            Aucune allergie enregistrée
          </div>
        )}

        {/* Medicament */}
        <div>
          <label style={labelS}>Medicament *</label>
          <select
            style={{ ...inputS, color:selectedMed?'#0f172a':'#94a3b8', borderColor:selectedMed?'#7dd3fc':'#e2e8f0', cursor:'pointer' }}
            value={selectedMed}
            onChange={e => { setSelectedMed(e.target.value); setQuantite(''); }}
            disabled={loadMeds}>
            <option value="">{loadMeds ? 'Chargement...' : '— Selectionner un medicament —'}</option>
            {medicaments.map(m => {
              const s    = m.stock_info?.quantite ?? 0;
              const sl   = m.stock_info?.seuil_alerte ?? 0;
              const st   = String(m.stock_info?.statut || '').toUpperCase();
              const flag = (st==='EPUISE'||s===0) ? ' [!]' : (st==='FAIBLE'||(sl>0&&s<=sl)) ? ' [~]' : ' [OK]';
              return (
                <option key={m.id} value={m.id}>
                  {m.nom}{m.dosage ? ` ${m.dosage}` : ''}{flag} — {s} {labelUnite(m.unite, m.unite_personnalise)}(s)
                </option>
              );
            })}
          </select>
        </div>

        {/* Stock */}
        <StockMini med={medObj} quantite={quantite}/>

        {/* Quantite */}
        <div>
          <label style={labelS}>Quantite *</label>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button
              onClick={() => setQuantite(q => String(Math.max(1, Number(q||0) - 1)))}
              style={{ width:38, height:38, border:'1.5px solid #e2e8f0', borderRadius:8, background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20, fontWeight:700, color:'#475569' }}
              onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background='white'}>
              -
            </button>
            <input type="number" min="1"
              style={{ ...inputS, textAlign:'center', fontWeight:800, fontSize:16, borderColor:insuf?'#fca5a5':quantite?'#7dd3fc':'#e2e8f0', color:insuf?'#dc2626':'#0f172a' }}
              placeholder="0" value={quantite}
              onChange={e => setQuantite(e.target.value)}/>
            <button
              onClick={() => setQuantite(q => String(Number(q||0) + 1))}
              style={{ width:38, height:38, border:'none', borderRadius:8, background:'#0284c7', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20, fontWeight:700, color:'white', boxShadow:'0 2px 6px rgba(2,132,199,.3)' }}
              onMouseEnter={e => e.currentTarget.style.background='#0369a1'}
              onMouseLeave={e => e.currentTarget.style.background='#0284c7'}>
              +
            </button>
          </div>
          {medObj && quantite && !insuf && (
            <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
              Il restera{' '}
              <strong style={{ color:'#0d9488' }}>{Math.max(0, stock - Number(quantite))}</strong>
              {' '}{labelUnite(medObj.unite, medObj.unite_personnalise)}(s) en stock
            </div>
          )}
        </div>

        {/* Motif */}
        <div>
          <label style={labelS}>
            Motif{' '}
            <span style={{ fontWeight:400, textTransform:'none', color:'#94a3b8', fontSize:10 }}>(optionnel)</span>
          </label>
          <input
            style={inputS}
            placeholder="Ex: Douleur, Fievre, Accident de travail, Traitement..."
            value={motif}
            onChange={e => setMotif(e.target.value)}
            onFocus={e => e.target.style.borderColor='#0ea5e9'}
            onBlur={e  => e.target.style.borderColor='#e2e8f0'}
          />
        </div>

        {/* Bouton */}
        <button onClick={handleSubmit} disabled={loading || !canSubmit}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'11px 20px', border:'none', borderRadius:10, fontFamily:'inherit',
            background: canSubmit ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : '#e2e8f0',
            color:  canSubmit ? 'white' : '#94a3b8',
            fontSize:14, fontWeight:700,
            cursor: (loading||!canSubmit) ? 'not-allowed' : 'pointer',
            boxShadow: canSubmit ? '0 3px 12px rgba(14,165,233,.35)' : 'none',
            transition:'all .15s',
          }}>
          {collab
            ? <IcoUser  c={canSubmit?'white':'#94a3b8'} size={15}/>
            : <IcoShelf c={canSubmit?'white':'#94a3b8'} size={15}/>}
          {loading ? 'Enregistrement...'
            : collab ? `Dispenser a ${collab.prenom} ${collab.nom}`
            : 'Enregistrer la consommation'}
        </button>

      </div>
    </div>
  );
}