// src/components/infirmier/RdvSagefemme.jsx
import { useState, useEffect } from 'react';
import {
  getRdvSagefemme,
  creerRdvSagefemme,
  modifierRdvSagefemme,
  supprimerRdvSagefemme,
  searchCollaborateurs,
} from '../../api/actInfirmierApi';
import { useAuth } from '../../context/AuthContext';

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const todayStr = ()  => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = { collaborateur: '', date_rdv: todayStr(), commentaire: '' };

/* ─── Icons ───────────────────────────────────────────────── */
const IcoPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoEdit   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IcoTrash  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoClose  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoSave   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoSage   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M12 14v6M9 17h6"/></svg>;

/* ─── Styles ──────────────────────────────────────────────── */
const inp = {
  padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:7,
  fontSize:13, color:'#111827', background:'white', outline:'none',
  fontFamily:'inherit', width:'100%', boxSizing:'border-box',
};
const Field = ({ label, required, full, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, gridColumn: full ? '1/-1' : undefined }}>
    <label style={{ fontSize:10.5, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.5px' }}>
      {label}{required && <span style={{ color:'#0284c7' }}> *</span>}
    </label>
    {children}
  </div>
);
const SecTitle = ({ children }) => (
  <div style={{ fontSize:10.5, fontWeight:800, color:'#0284c7', textTransform:'uppercase', letterSpacing:'.8px', paddingBottom:6, marginBottom:12, borderBottom:'2px solid #e0f2fe' }}>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════
   PANNEAU DÉTAILS
══════════════════════════════════════════════════════════ */
function DetailRdvSagefemme({ item: m, onEdit, onClose }) {
  const { user } = useAuth();
  const saisiePar = m.infirmiere_nom || (m.infirmiere === user?.user_id ? user?.username : '') || (m.infirmiere ? `#${m.infirmiere}` : '—');
  const Row = ({ label, value }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <span style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</span>
      <span style={{ fontSize:13, color:'#111827', fontWeight:500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderLeft:'1.5px solid #f3f4f6', borderRadius:'0 14px 14px 0' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', flexShrink:0, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, boxShadow:'0 4px 12px rgba(14,165,233,.3)' }}>
            <IcoSage />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#111827' }}>{m.collaborateur_nom || '—'}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{m.segment} · {m.site}</div>
            <div style={{ display:'flex', gap:6, marginTop:8 }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'#e0f2fe', color:'#0369a1', border:'1px solid #7dd3fc' }}>
                📅 RDV {fmtDate(m.date_rdv)}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ padding:'4px 10px', border:'1.5px solid #e5e7eb', background:'#f9fafb', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, color:'#6b7280', flexShrink:0 }}
            onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.color='#dc2626';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#6b7280';}}>
            Fermer
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
        <div style={{ marginBottom:18 }}>
          <SecTitle>Rendez-vous</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Date du RDV" value={fmtDate(m.date_rdv)} />
            <Row label="Site" value={m.site} />
            <Row label="Numéro de téléphone" value={m.num_tel} />
            <Row label="Segment" value={m.segment} />
          </div>
        </div>

        {m.commentaire && (
          <div style={{ marginBottom:18 }}>
            <SecTitle>Commentaire</SecTitle>
            <p style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{m.commentaire}</p>
          </div>
        )}

        <div>
          <SecTitle>Informations administratives</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Saisie par" value={saisiePar} />
            <Row label="Date de création" value={fmtDate(m.date_creation)} />
          </div>
        </div>
      </div>

      <div style={{ padding:'12px 20px', borderTop:'1px solid #f3f4f6', flexShrink:0, display:'flex', justifyContent:'flex-end', gap:8, background:'#fafafa', borderRadius:'0 0 14px 0' }}>
        <button onClick={() => onEdit(m)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          <IcoEdit /> Modifier
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORMULAIRE
══════════════════════════════════════════════════════════ */
function FormulaireRdvSagefemme({ initial, onSaved, onClose }) {
  const isEdit = !!initial?.id;
  const [form,          setForm]          = useState({ ...EMPTY_FORM, ...initial });
  const [collabQuery,   setCollabQuery]   = useState(initial?.collaborateur_nom ?? '');
  const [collabNom,     setCollabNom]     = useState(initial?.collaborateur_nom ?? '');
  const [collabResults, setCollabResults] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCollabSearch = async () => {
    const q = collabQuery.trim();
    setCollabNom('');
    set('collaborateur', '');
    if (!q) {
      setCollabResults([]);
      return;
    }
    setLoadingCollab(true);
    try {
      const results = await searchCollaborateurs(q);
      if (results.length === 1) {
        selectCollab(results[0]);
      } else {
        setCollabResults(results);
      }
    } catch {
      setCollabResults([]);
    } finally {
      setLoadingCollab(false);
    }
  };

  const handleCollabInput = (v) => {
    setCollabQuery(v);
    if (!v.trim()) {
      setCollabNom('');
      set('collaborateur', '');
      setCollabResults([]);
    }
  };

  const selectCollab = (c) => {
    set('collaborateur', c.id);
    setCollabNom(`${c.nom} ${c.prenom ?? ''} (${c.matricule})`);
    setCollabQuery(`${c.nom} ${c.prenom ?? ''} (${c.matricule})`);
    setCollabResults([]);
  };

  const handleSubmit = async () => {
    if (!form.collaborateur) { setError('Veuillez sélectionner un collaborateur.'); return; }
    if (!form.date_rdv) { setError('La date du rendez-vous est requise.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { collaborateur: form.collaborateur, date_rdv: form.date_rdv, commentaire: form.commentaire };
      const saved = isEdit
        ? await modifierRdvSagefemme(form.id, payload)
        : await creerRdvSagefemme(payload);
      onSaved(saved);
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'white', borderRadius:16, width:'min(580px,96vw)', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.22)', animation:'modalIn .2s ease' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderRadius:'16px 16px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}><IcoSage /></div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'#111827' }}>{isEdit ? 'Modifier le RDV' : 'Nouveau RDV Sage-femme'}</div>
              <div style={{ fontSize:11.5, color:'#6b7280' }}>Sage-femme</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}><IcoClose /></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 22px' }}>
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 14px', borderRadius:9, fontSize:13, marginBottom:16 }}>{error}</div>
          )}

          <div style={{ marginBottom:20 }}>
            <SecTitle>Collaboratrice</SecTitle>
            <div style={{ position:'relative' }}>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}><IcoSearch /></span>
                <input value={collabQuery} onChange={e => handleCollabInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCollabSearch(); }} placeholder="Rechercher par nom ou matricule…" style={{ ...inp, paddingLeft:32, paddingRight:106 }} />
                <button
                  type="button"
                  onClick={handleCollabSearch}
                  style={{ position:'absolute', right:6, top:6, height:30, padding:'0 12px', border:'none', borderRadius:7, background:'#0284c7', color:'white', fontSize:12, fontWeight:700, cursor:'pointer' }}
                >
                  Rechercher
                </button>
              </div>
              {loadingCollab && <div style={{ fontSize:12, color:'#6b7280', padding:'4px 0' }}>Recherche…</div>}
              {collabResults.length > 0 && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1.5px solid #e5e7eb', borderRadius:9, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:50, maxHeight:200, overflowY:'auto' }}>
                  {collabResults.map(c => (
                    <button key={c.id} onClick={() => selectCollab(c)}
                      style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 14px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, color:'#111827', borderBottom:'1px solid #f3f4f6', fontFamily:'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.background='#ecfeff'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <span style={{ fontWeight:700 }}>{c.nom} {c.prenom}</span>
                      <span style={{ color:'#6b7280', marginLeft:8, fontSize:12 }}>
                        {[c.matricule, c.department || c.segment].filter(Boolean).join(' - ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {collabNom && (
              <div style={{ marginTop:6, fontSize:12.5, color:'#059669', fontWeight:600 }}>✓ {collabNom}</div>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, marginBottom:20 }}>
            <SecTitle>Rendez-vous</SecTitle>
            <Field label="Date du RDV" required>
              <input type="date" value={form.date_rdv} onChange={e => set('date_rdv', e.target.value)} style={inp} />
            </Field>
            <Field label="Commentaire" full>
              <textarea value={form.commentaire} onChange={e => set('commentaire', e.target.value)} rows={3} placeholder="Observations…" style={{ ...inp, resize:'vertical', lineHeight:1.5 }} />
            </Field>
          </div>

          <div style={{ background:'#f0f9ff', border:'1px solid #7dd3fc', borderRadius:9, padding:'10px 14px', fontSize:12.5, color:'#075985' }}>
            ℹ️ Le segment, le site et le numéro de téléphone sont automatiquement récupérés depuis le dossier du collaborateur.
          </div>
        </div>

        <div style={{ padding:'14px 22px', borderTop:'1px solid #f3f4f6', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'9px 20px', border:'1.5px solid #e5e7eb', background:'white', borderRadius:8, fontSize:13, fontWeight:700, color:'#374151', cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 22px', border:'none', background: saving ? '#9ca3af' : 'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
            <IcoSave /> {saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Créer le RDV')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function RdvSagefemme() {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setData(await getRdvSagefemme()); } catch { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(d => {
    const q = search.toLowerCase();
    return !q || (d.collaborateur_nom||'').toLowerCase().includes(q) || (d.segment||'').toLowerCase().includes(q) || (d.site||'').toLowerCase().includes(q);
  });

  const handleSaved = (saved) => { setShowForm(false); setEditItem(null); load(); setSelected(saved); };

  const handleDelete = async (id) => {
    try { await supprimerRdvSagefemme(id); setConfirmDel(null); if (selected?.id === id) setSelected(null); load(); } catch {}
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:0 }}>
      <style>{`@keyframes modalIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, flexShrink:0, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 220px' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}><IcoSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, segment, site…"
            style={{ padding:'9px 12px 9px 32px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, width:'100%', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
          <IcoPlus /> Nouveau RDV
        </button>
      </div>

      <div style={{ flex:1, minHeight:0, display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:16 }}>
        <div style={{ background:'white', borderRadius:14, border:'1.5px solid #f3f4f6', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'#f0f9ff' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}><IcoSage /></div>
              <div style={{ fontSize:14, fontWeight:800, color:'#111827' }}>RDV Sage-femme</div>
            </div>
            <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'#e0f2fe', color:'#0369a1' }}>{filtered.length} RDV</span>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? (
              <div style={{ padding:40, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Chargement…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Aucun rendez-vous trouvé.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['Collaboratrice','Date RDV','Site','Segment','Actions'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10.5, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid #f3f4f6', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id} onClick={() => setSelected(d)}
                      style={{ cursor:'pointer', transition:'background .12s', background: selected?.id === d.id ? '#ecfeff' : 'transparent' }}
                      onMouseEnter={e => { if (selected?.id !== d.id) e.currentTarget.style.background='#ecfeff'; }}
                      onMouseLeave={e => { if (selected?.id !== d.id) e.currentTarget.style.background='transparent'; }}>
                      <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb', fontWeight:600 }}>{d.collaborateur_nom || '—'}</td>
                      <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'#cffafe', color:'#0e7490', border:'1px solid #a5f3fc' }}>
                          {fmtDate(d.date_rdv)}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb', color:'#374151' }}>{d.site || '—'}</td>
                      <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb', color:'#6b7280', fontSize:12 }}>{d.segment || '—'}</td>
                      <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb' }}>
                        <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setEditItem(d); setShowForm(true); }}
                            style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#0891b2' }} title="Modifier">
                            <IcoEdit />
                          </button>
                          <button onClick={() => setConfirmDel(d.id)}
                            style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fecaca', background:'#fff5f5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }} title="Supprimer">
                            <IcoTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selected && (
          <DetailRdvSagefemme
            item={selected}
            onEdit={item => { setEditItem(item); setShowForm(true); }}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {showForm && (
        <FormulaireRdvSagefemme
          initial={editItem}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001 }}>
          <div style={{ background:'white', borderRadius:14, padding:'28px 32px', maxWidth:400, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.22)' }}>
            <div style={{ fontSize:38, marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#111827', marginBottom:8 }}>Confirmer la suppression</div>
            <div style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>Ce rendez-vous sera supprimé définitivement.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setConfirmDel(null)} style={{ padding:'9px 22px', border:'1.5px solid #e5e7eb', background:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
              <button onClick={() => handleDelete(confirmDel)} style={{ padding:'9px 22px', border:'none', background:'#dc2626', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}