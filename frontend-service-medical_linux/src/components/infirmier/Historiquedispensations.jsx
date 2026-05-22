// src/components/infirmier/HistoriqueDispensations.jsx
// Historique COMPLET des medicaments reçus par un collaborateur :
//   - Dispensations directes (type_acte = 'DON')
//   - Dispensations sur ordonnance (ligne_ordonnance != null)
// Source : GET /stock/actes/by_collaborateur/?collaborateur_id=X
// Pas de filtre sur type_acte → tout est inclus

import { useState, useEffect, useRef } from 'react';
import { getActesByCollaborateur } from '../../api/stockApi';
import axiosInstance from '../../api/axios';

const searchCollaborateurs = async (q) => {
  const res = await axiosInstance.get('/employees/collaborateurs/', { params: { search: q } });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

/* Icones */
const IcoPill   = ({ c='#0369a1', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v7"/><path d="M16 19h6"/><path d="M19 16v6"/></svg>;
const IcoCheck  = ({ c='#0d9488', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoDanger = ({ c='#dc2626', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoUser   = ({ c='#0369a1', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoHisto  = ({ c='#0284c7', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoSearch = ({ c='#94a3b8', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoOrdo   = ({ c='#0369a1', size=12 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;

const inputS = { width:'100%', border:'1.5px solid #e2e8f0', borderRadius:9, padding:'9px 11px', fontSize:13, outline:'none', background:'white', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color .15s' };
const labelS = { display:'block', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 };

/* Badge source */
function BadgeSource({ acte }) {
  const isOrdo = !!acte.ligne_ordonnance;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:3,
      fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20,
      background: isOrdo ? '#e0f2fe' : '#f0fdf4',
      color:      isOrdo ? '#0369a1' : '#15803d',
      whiteSpace:'nowrap',
    }}>
      {isOrdo ? <IcoOrdo c="#0369a1" size={10}/> : <IcoPill c="#15803d" size={10}/>}
      {isOrdo ? 'Ordonnance' : 'Direct'}
    </span>
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
          style={{ ...inputS, paddingLeft:32, borderColor:value?'#7dd3fc':'#e2e8f0', background:value?'#f0f9ff':'white' }}
          placeholder="Saisir matricule ou nom..."
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggest.length > 0 && setShowDrop(true)}
          disabled={!!value}
        />
        {value && (
          <button onClick={() => { onReset(); setQuery(''); setSuggest([]); setShowDrop(false); }}
            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18, lineHeight:1 }}>
            x
          </button>
        )}
      </div>

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

      {value && (
        <div style={{ marginTop:8, background:'#f0f9ff', border:'1.5px solid #7dd3fc', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <IcoUser c="#0369a1" size={16}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0369a1' }}>{value.nom} {value.prenom}</div>
            <div style={{ fontSize:11, color:'#7dd3fc' }}>
              Matricule {value.matricule} · {value.poste} · {value.department}
            </div>
          </div>
          <IcoCheck c="#0284c7" size={16}/>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function HistoriqueDispensations() {
  const [collab,  setCollab]  = useState(null);
  const [actes,   setActes]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSelect = async (c) => {
    setCollab(c); setLoading(true); setError(''); setActes([]);
    try {
      // getActesByCollaborateur retourne TOUS les actes (DON + ordonnances)
      // On NE filtre PAS sur type_acte → tout est inclus pour les stats complètes
      const data = await getActesByCollaborateur(c.id);
      setActes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du chargement de l'historique.");
    } finally { setLoading(false); }
  };

  const handleReset = () => { setCollab(null); setActes([]); setError(''); };

  // Cumuls par medicament (toutes sources confondues)
  const cumuls = Object.values(
    actes.reduce((acc, a) => {
      const key = a.medicament;
      if (!acc[key]) acc[key] = {
        id:    key,
        nom:   a.medicament_nom,
        total: 0,
        don:   0,   // direct infirmier
        ordo:  0,   // sur ordonnance
      };
      acc[key].total += a.quantite;
      if (a.ligne_ordonnance) acc[key].ordo += a.quantite;
      else                    acc[key].don  += a.quantite;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  // Compteurs
  const nbDon  = actes.filter(a => !a.ligne_ordonnance).length;
  const nbOrdo = actes.filter(a =>  a.ligne_ordonnance).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* En-tete */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <IcoHisto c="#0284c7" size={16}/>
        <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>
          Historique des dispensations
        </span>
      </div>

      {/* Recherche */}
      <div>
        <label style={labelS}>Rechercher un collaborateur</label>
        <CollabSearch value={collab} onSelect={handleSelect} onReset={handleReset}/>
      </div>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:10, padding:'10px 12px', fontSize:13 }}>
          <IcoDanger c="#dc2626" size={14}/> {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', color:'#94a3b8', fontSize:13, padding:'24px 0' }}>
          Chargement...
        </div>
      )}

      {collab && !loading && (
        <>
          {/* Carte identite + stats */}
          <div style={{ background:'white', border:'1.5px solid #bae6fd', borderRadius:12, padding:16, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#e0f2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <IcoUser c="#0284c7" size={22}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>
                {collab.nom} {collab.prenom}
              </div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                Matricule <strong>{collab.matricule}</strong> · {collab.poste} · {collab.department}
              </div>
            </div>
            {/* Stats rapides */}
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ textAlign:'center', background:'#f0fdf4', borderRadius:10, padding:'8px 12px' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#15803d', lineHeight:1 }}>{nbDon}</div>
                <div style={{ fontSize:9, color:'#16a34a', fontWeight:600, marginTop:2 }}>Direct</div>
              </div>
              <div style={{ textAlign:'center', background:'#e0f2fe', borderRadius:10, padding:'8px 12px' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#0284c7', lineHeight:1 }}>{nbOrdo}</div>
                <div style={{ fontSize:9, color:'#0369a1', fontWeight:600, marginTop:2 }}>Ordonnance</div>
              </div>
              <div style={{ textAlign:'center', background:'#f1f5f9', borderRadius:10, padding:'8px 12px' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#334155', lineHeight:1 }}>{actes.length}</div>
                <div style={{ fontSize:9, color:'#64748b', fontWeight:600, marginTop:2 }}>Total</div>
              </div>
            </div>
          </div>

          {/* Cumuls par medicament */}
          {cumuls.length > 0 && (
            <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9', fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.5px' }}>
                Cumul par medicament
              </div>
              {cumuls.map((c, i) => (
                <div key={c.id} style={{ padding:'11px 16px', borderBottom: i < cumuls.length - 1 ? '1px solid #f8fafc' : 'none', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:34, height:34, borderRadius:8, background:'#e0f2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <IcoPill c="#0284c7" size={15}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{c.nom}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
                      {c.don > 0 && <span style={{ marginRight:8 }}>Direct : {c.don}</span>}
                      {c.ordo > 0 && <span>Ordonnance : {c.ordo}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize:17, fontWeight:800, color:'#0284c7' }}>
                    {c.total}{' '}
                    <span style={{ fontWeight:400, color:'#94a3b8', fontSize:11 }}>unite(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tableau historique detaille */}
          {actes.length === 0 ? (
            <div style={{ textAlign:'center', color:'#94a3b8', fontSize:13, padding:'20px 0' }}>
              Aucune dispensation enregistree pour ce collaborateur.
            </div>
          ) : (
            <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9', fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.5px' }}>
                Detail chronologique
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['Date', 'Source', 'Medicament', 'Qte', 'Motif', 'Infirmier(e)'].map(h => (
                        <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.4px', whiteSpace:'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {actes.map((a, i) => (
                      <tr key={a.id} style={{ borderTop:'1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap', fontSize:12 }}>
                          {new Date(a.date_acte).toLocaleString('fr-FR', {
                            day:'2-digit', month:'2-digit', year:'numeric',
                            hour:'2-digit', minute:'2-digit',
                          })}
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <BadgeSource acte={a}/>
                        </td>
                        <td style={{ padding:'10px 14px', fontWeight:600, color:'#0f172a' }}>
                          {a.medicament_nom}
                        </td>
                        <td style={{ padding:'10px 14px', fontWeight:700, color:'#0284c7', whiteSpace:'nowrap' }}>
                          {a.quantite}
                        </td>
                        <td style={{ padding:'10px 14px', color:'#64748b', fontStyle: a.motif ? 'normal' : 'italic', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {a.motif || '—'}
                        </td>
                        <td style={{ padding:'10px 14px', color:'#475569', whiteSpace:'nowrap', fontSize:12, fontWeight:500 }}>
                          {a.infirmiere_nom || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!collab && !loading && (
        <div style={{ textAlign:'center', color:'#94a3b8', fontSize:13, padding:'40px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <IcoHisto c="#bae6fd" size={32}/>
          <span>Recherchez un collaborateur pour voir toutes ses dispensations</span>
        </div>
      )}
    </div>
  );
}