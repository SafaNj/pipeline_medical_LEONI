// src/components/infirmier/IncidentSansBon.jsx
import { useState, useEffect, useRef } from 'react';
import {
  getIncidentsSansBon, creerIncidentSansBon, modifierIncidentSansBon, supprimerIncidentSansBon,
  getStatsIncidentsSansBon, searchCollaborateurs, getCollaborateurById,
} from '../../api/actInfirmierApi';
import { useAuth } from '../../context/AuthContext';
import { pickDepartementCollaborateur } from '../../utils/ficheCollaborateur';

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const todayStr = ()  => new Date().toISOString().slice(0, 10);
const nowTime  = ()  => new Date().toTimeString().slice(0, 5);
const EMPTY_FORM = {
  collaborateur:'', plant_section:'', segment:'',
  date_incident:todayStr(), heure_incident:nowTime(),
  mode_lesion:'', agent_causal:'', remarque:'',
};

/* ─── Icônes professionnelles (style médical sobre) ────── */
const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);
const IcoSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IcoClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoIncidentSans = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

/* ─── Styles de base ─────────────────────────────────── */
const inp = {
  padding:'8px 11px', border:'1.5px solid #bae6fd', borderRadius:7,
  fontSize:13, color:'#0c4a6e', background:'white', outline:'none',
  fontFamily:'inherit', width:'100%', boxSizing:'border-box',
  transition:'border-color .15s',
};
const Field = ({ label, required, full, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, gridColumn: full ? '1/-1' : undefined }}>
    <label style={{ fontSize:10.5, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.6px' }}>
      {label}{required && <span style={{ color:'#0284c7' }}> *</span>}
    </label>
    {children}
  </div>
);
const SecTitle = ({ children }) => (
  <div style={{ fontSize:10.5, fontWeight:800, color:'#0284c7', textTransform:'uppercase', letterSpacing:'.8px', paddingBottom:7, marginBottom:14, borderBottom:'2px solid #e0f2fe' }}>
    {children}
  </div>
);

/* ─── 3 boutons visibles avec texte ─────────────────── */
const BtnModifier = ({ onClick }) => (
  <button onClick={onClick}
    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', border:'2px solid #0284c7', background:'white', color:'#0284c7', borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap' }}
    onMouseEnter={e=>{e.currentTarget.style.background='#0284c7';e.currentTarget.style.color='white';}}
    onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#0284c7';}}>
    <IcoPencil /> Modifier
  </button>
);
const BtnSupprimer = ({ onClick }) => (
  <button onClick={onClick}
    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', border:'2px solid #dc2626', background:'white', color:'#dc2626', borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap' }}
    onMouseEnter={e=>{e.currentTarget.style.background='#dc2626';e.currentTarget.style.color='white';}}
    onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#dc2626';}}>
    <IcoTrash /> Supprimer
  </button>
);
const BtnFermer = ({ onClick }) => (
  <button onClick={onClick}
    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', border:'2px solid #64748b', background:'white', color:'#64748b', borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap' }}
    onMouseEnter={e=>{e.currentTarget.style.background='#f1f5f9';}}
    onMouseLeave={e=>{e.currentTarget.style.background='white';}}>
    <IcoClose /> Fermer
  </button>
);

const InfoRow = ({ label, value }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
    <span style={{ fontSize:10, fontWeight:700, color:'#7dd3fc', textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</span>
    <span style={{ fontSize:13, color:'#f0f9ff', fontWeight:500 }}>{value || '—'}</span>
  </div>
);
const DataRow = ({ label, value }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
    <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</span>
    <span style={{ fontSize:13, color:'#0c4a6e', fontWeight:500 }}>{value || '—'}</span>
  </div>
);

/* ══════════════════════════════════════════════════════
   PANNEAU DÉTAILS
══════════════════════════════════════════════════════ */
function DetailSansBon({ incident: i, onEdit, onDelete, onClose }) {
  const { user } = useAuth();
  const saisiePar = i.infirmiere_nom
    || (i.infirmiere === user?.user_id ? user?.username : '')
    || (i.infirmiere ? `#${i.infirmiere}` : '—');

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderRadius:'0 14px 14px 0' }}>

      {/* ── En-tête dégradé bleu ── */}
      <div style={{ padding:'20px 24px', flexShrink:0, background:'linear-gradient(135deg,#0ea5e9 0%,#0284c7 60%,#0369a1 100%)', borderRadius:'0 14px 0 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,.18)', border:'1.5px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
            <IcoIncidentSans />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:800, color:'white', letterSpacing:-.3 }}>{i.nom_prenom || '—'}</div>
            <div style={{ fontSize:12, color:'#bae6fd', marginTop:3 }}>{i.matricule}{i.poste ? ' · ' + i.poste : ''}</div>
            <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 11px', borderRadius:99, background:'rgba(255,255,255,.18)', color:'white', border:'1px solid rgba(255,255,255,.28)' }}>
                Incident sans bon a charge de LEONI
              </span>
              <span style={{ fontSize:11, fontWeight:600, padding:'3px 11px', borderRadius:99, background:'rgba(255,255,255,.12)', color:'#e0f2fe' }}>
                {fmtDate(i.date_incident)}{i.heure_incident ? ' · ' + i.heure_incident : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
        <div style={{ marginBottom:20 }}>
          <SecTitle>Détails de l'incident</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DataRow label="Date" value={fmtDate(i.date_incident)} />
            <DataRow label="Heure d'arrivée" value={i.heure_incident || '—'} />
            <DataRow label="Agent causal" value={i.agent_causal} />
            <DataRow label="Mode de lésion" value={i.mode_lesion} />
          </div>
          {i.remarque && (
            <div style={{ marginTop:14, background:'#f0f9ff', borderRadius:10, padding:'11px 14px', border:'1.5px solid #e0f2fe' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Remarque / Soin effectué</div>
              <div style={{ fontSize:13, color:'#0c4a6e', lineHeight:1.65 }}>{i.remarque}</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom:20 }}>
          <SecTitle>Informations collaborateur</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DataRow label="Plant / Section" value={i.plant_section} />
            <DataRow label="Département" value={i.segment || i.department} />
            <DataRow label="Téléphone" value={i.telephone} />
            <DataRow label="Département" value={i.department} />
          </div>
        </div>

        <div>
          <SecTitle>Saisie</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <DataRow label="Saisi par" value={saisiePar} />
            <DataRow label="Date de création" value={fmtDate(i.date_creation)} />
          </div>
        </div>
      </div>

      {/* ── Pied de page ── */}
      <div style={{ padding:'14px 24px', borderTop:'1.5px solid #e0f2fe', flexShrink:0, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:10, background:'#f8fafc', borderRadius:'0 0 14px 0' }}>
        <BtnFermer onClick={onClose} />
        <BtnSupprimer onClick={() => onDelete(i)} />
        <button onClick={() => onEdit(i)}
          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 12px rgba(14,165,233,.35)', whiteSpace:'nowrap' }}>
          <IcoPencil /> Modifier
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PANNEAU FORMULAIRE
══════════════════════════════════════════════════════ */
function FormulaireSansBon({ initial, onSaved, onClose }) {
  const { user } = useAuth();
  const isEdit = !!initial?.id;
  const [form,          setForm]          = useState({ ...EMPTY_FORM, ...initial });
  const [collabQuery,   setCollabQuery]   = useState(initial?.nom_prenom ?? '');
  const [collabNom,     setCollabNom]     = useState(initial?.nom_prenom ?? '');
  const [collabResults, setCollabResults] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const debRef = useRef(null);
  const [collabInfo, setCollabInfo] = useState(
    initial ? { matricule:initial.matricule??'', telephone:initial.telephone??'', poste:initial.poste??'', department:initial.department??'' } : null
  );

  useEffect(() => {
    setForm({ ...EMPTY_FORM, ...initial });
    setCollabQuery(initial?.nom_prenom ?? '');
    setCollabNom(initial?.nom_prenom ?? '');
    setCollabInfo(initial ? { matricule:initial.matricule??'', telephone:initial.telephone??'', poste:initial.poste??'', department:initial.department??'' } : null);
    setError('');
  }, [initial?.id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCollabSearch = (val) => {
    setCollabQuery(val); setCollabNom(''); set('collaborateur', '');
    clearTimeout(debRef.current);
    if (!val.trim()) { setCollabResults([]); return; }
    setLoadingCollab(true);
    debRef.current = setTimeout(async () => {
      try { setCollabResults(await searchCollaborateurs(val)); }
      catch { setCollabResults([]); }
      finally { setLoadingCollab(false); }
    }, 300);
  };

  const selectCollab = async (c) => {
    set('collaborateur', c.id);
    setCollabNom(`${c.nom} ${c.prenom} — ${c.matricule}`);
    setCollabQuery(`${c.nom} ${c.prenom}`);
    setCollabResults([]);
    try {
      const d = await getCollaborateurById(c.id);
      const dept = pickDepartementCollaborateur(d);
      setCollabInfo({ matricule:d.matricule??'', telephone:d.telephone??'', poste:d.poste??'', department:dept });
      set('plant_section', d.plant_section ?? d.plantSection ?? d.section_atelier ?? '');
      set('segment', dept);
    } catch { setCollabInfo(null); }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.collaborateur)       return setError('Veuillez sélectionner un collaborateur.');
    if (!form.date_incident)       return setError("Date de l'incident requise.");
    if (!form.heure_incident)      return setError("Heure d'arrivée requise.");
    if (!form.mode_lesion.trim())  return setError('Mode de lésion requis.');
    if (!form.agent_causal.trim()) return setError('Agent causal requis.');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isEdit && user?.user_id) payload.infirmiere = user.user_id;
      const saved = isEdit
        ? await modifierIncidentSansBon(initial.id, payload)
        : await creerIncidentSansBon(payload);
      onSaved(saved);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.detail || Object.values(d ?? {}).flat().join(' ') || "Erreur lors de l'enregistrement.");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderRadius:'0 14px 14px 0' }}>

      {/* ── En-tête ── */}
      <div style={{ padding:'16px 24px', borderBottom:'1.5px solid #e0f2fe', flexShrink:0, display:'flex', alignItems:'center', gap:12, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderRadius:'0 14px 0 0' }}>
        <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', boxShadow:'0 3px 10px rgba(14,165,233,.3)' }}>
          <IcoIncidentSans />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>{isEdit ? "Modifier l'incident" : 'Nouvel incident sans bon a charge de LEONI'}</div>
          <div style={{ fontSize:11, color:'#0369a1', marginTop:1 }}>Les champs * sont obligatoires</div>
        </div>
        <BtnFermer onClick={onClose} />
      </div>

      {/* ── Corps ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'18px 24px' }}>
        {error && (
          <div style={{ background:'#eff6ff', border:'1.5px solid #bae6fd', color:'#0369a1', borderRadius:9, padding:'10px 14px', fontSize:12.5, marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* Collaborateur */}
        <div style={{ marginBottom:18 }}>
          <SecTitle>Collaborateur</SecTitle>
          <Field label="Rechercher un collaborateur" required>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#7dd3fc' }}><IcoSearch /></div>
              <input value={collabQuery} onChange={e => handleCollabSearch(e.target.value)}
                placeholder="Nom, prénom ou matricule…"
                style={{ ...inp, paddingLeft:32, borderColor: form.collaborateur ? '#0ea5e9' : '#bae6fd' }} />
              {form.collaborateur && (
                <span style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#0ea5e9', fontWeight:800 }}>✓</span>
              )}
            </div>
            {collabNom && <div style={{ fontSize:11.5, color:'#0369a1', marginTop:4, fontWeight:600 }}>→ {collabNom}</div>}
            {loadingCollab && <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:4 }}>Recherche en cours…</div>}
            {collabResults.length > 0 && (
              <div style={{ border:'1.5px solid #bae6fd', borderRadius:9, overflow:'hidden', marginTop:4, boxShadow:'0 6px 18px rgba(14,165,233,.12)' }}>
                {collabResults.slice(0,5).map((c,idx) => (
                  <button key={c.id} onMouseDown={() => selectCollab(c)}
                    style={{ width:'100%', textAlign:'left', padding:'9px 13px', border:'none', borderTop:idx>0?'1px solid #f0f9ff':'none', background:'white', cursor:'pointer', fontSize:12.5, display:'flex', justifyContent:'space-between', alignItems:'center' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f0f9ff'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <span style={{ fontWeight:600, color:'#0c4a6e' }}>{c.nom} {c.prenom}</span>
                    <span style={{ color:'#7dd3fc', fontSize:11.5, fontWeight:600 }}>{c.matricule}</span>
                  </button>
                ))}
              </div>
            )}
          </Field>
          {collabInfo && (
            <div style={{ background:'#f0f9ff', border:'1.5px solid #bae6fd', borderRadius:10, padding:'11px 14px', marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Matricule',collabInfo.matricule],['Téléphone',collabInfo.telephone],['Poste',collabInfo.poste],['Département',collabInfo.department]].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:9.5, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.5px' }}>{k}</div>
                  <div style={{ fontSize:12.5, color:'#0c4a6e', fontWeight:600, marginTop:2 }}>{v||'—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incident */}
        <div>
          <SecTitle>Détails de l'incident</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="Date de l'incident" required>
              <input type="date" value={form.date_incident} onChange={e=>set('date_incident',e.target.value)} style={inp} />
            </Field>
            <Field label="Heure d'arrivée" required>
              <input type="time" value={form.heure_incident} onChange={e=>set('heure_incident',e.target.value)} style={inp} />
            </Field>
            <Field label="Agent causal" required full>
              <input value={form.agent_causal} onChange={e=>set('agent_causal',e.target.value)}
                placeholder="Machine, chute, produit chimique…" style={inp} />
            </Field>
            <Field label="Mode de lésion" required full>
              <textarea value={form.mode_lesion} onChange={e=>set('mode_lesion',e.target.value)} rows={3}
                placeholder="Description de la lésion…" style={{ ...inp, resize:'vertical', lineHeight:1.55 }} />
            </Field>
            <Field label="Remarque / Soin effectué" full>
              <textarea value={form.remarque} onChange={e=>set('remarque',e.target.value)} rows={3}
                placeholder="Soins réalisés à l'infirmerie…" style={{ ...inp, resize:'vertical', lineHeight:1.55 }} />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Pied de page ── */}
      <div style={{ padding:'14px 24px', borderTop:'1.5px solid #e0f2fe', flexShrink:0, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:10, background:'#f8fafc' }}>
        <BtnFermer onClick={onClose} />
        <button onClick={handleSubmit} disabled={saving}
          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 22px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 12px rgba(14,165,233,.35)', opacity:saving?0.65:1, whiteSpace:'nowrap' }}>
          <IcoSave /> {saving ? 'Enregistrement…' : (isEdit ? 'Modifier' : 'Enregistrer')}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
export default function IncidentSansBon() {
  const [incidents,  setIncidents]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [panneau,    setPanneau]    = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [search,     setSearch]     = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [annee,      setAnnee]      = useState(new Date().getFullYear());

  const load = async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([getIncidentsSansBon(), getStatsIncidentsSansBon(annee)]);
      setIncidents(data); setStats(s);
    } catch { setIncidents([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [annee]);

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase();
    return !q
      || (i.nom_prenom||'').toLowerCase().includes(q)
      || (i.matricule||'').toLowerCase().includes(q)
      || (i.agent_causal||'').toLowerCase().includes(q);
  });

  const handleSelect = (i) => { setSelected(i); setPanneau('detail'); };
  const handleNew    = ()   => { setEditTarget(null); setPanneau('form'); };
  const handleEdit   = (i)  => { setEditTarget(i); setPanneau('form'); };
  const handleClose  = ()   => { setPanneau(null); setSelected(null); setEditTarget(null); };
  const handleSaved  = (saved) => {
    setIncidents(prev => prev.find(x=>x.id===saved.id) ? prev.map(x=>x.id===saved.id?saved:x) : [saved,...prev]);
    setSelected(saved); setPanneau('detail'); load();
  };
  const handleDelete = async (i) => {
    try {
      await supprimerIncidentSansBon(i.id);
      setIncidents(prev => prev.filter(x => x.id !== i.id));
      if (selected?.id === i.id) handleClose();
      setConfirmDel(null); load();
    } catch {}
  };

  const hasPanneau = panneau !== null;

  return (
    <div style={{ display:'flex', gap:20, flex:1, minHeight:0, height:'100%' }}>

      {/* ══ Colonne liste ══ */}
      <div style={{ display:'flex', flexDirection:'column', flex: hasPanneau ? '0 0 460px' : '1', minWidth:0 }}>

        {/* Stats */}
        {stats && !hasPanneau && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20, flexShrink:0 }}>
            {[
              { label:'Total incidents', value:stats.total, accent:'#0284c7' },
              { label:'Départements touchés', value:stats.par_segment?.length, accent:'#0369a1' },
              { label:'Année', value:annee, accent:'#0ea5e9' },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ background:'white', borderRadius:12, padding:'14px 18px', border:'1.5px solid #e0f2fe', boxShadow:'0 2px 8px rgba(14,165,233,.06)' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</div>
                <div style={{ fontSize:24, fontWeight:900, color:accent, marginTop:4 }}>{value ?? '—'}</div>
              </div>
            ))}
          </div>
        )}

        {/* Barre d'outils */}
        <div style={{ display:'flex', gap:10, marginBottom:14, flexShrink:0, alignItems:'center' }}>
          <div style={{ position:'relative', flex:1 }}>
            <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#7dd3fc' }}><IcoSearch /></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par nom, matricule, agent causal…"
              style={{ ...inp, paddingLeft:34, borderRadius:10, background:'white' }} />
          </div>
          <select value={annee} onChange={e=>setAnnee(+e.target.value)}
            style={{ ...inp, width:'auto', cursor:'pointer' }}>
            {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleNew}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0, boxShadow:'0 3px 12px rgba(14,165,233,.35)', whiteSpace:'nowrap' }}>
            <IcoPlus /> Nouvel incident
          </button>
        </div>

        {/* Liste */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {loading ? (
            Array(4).fill(0).map((_,i) => (
              <div key={i} style={{ height:72, borderRadius:12, background:'linear-gradient(90deg,#f0f9ff 25%,#e0f2fe 50%,#f0f9ff 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
            ))
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 0', color:'#94a3b8' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🩺</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Aucun incident trouvé</div>
              <div style={{ fontSize:12, marginTop:4 }}>Modifiez votre recherche ou créez un nouvel incident</div>
            </div>
          ) : filtered.map(i => (
            <div key={i.id} onClick={() => handleSelect(i)}
              style={{ background:'white', borderRadius:12, padding:'13px 16px', border:`1.5px solid ${selected?.id===i.id ? '#0ea5e9' : '#e0f2fe'}`, cursor:'pointer', transition:'all .14s', boxShadow:selected?.id===i.id ? '0 0 0 3px rgba(14,165,233,.13)' : '0 1px 4px rgba(14,165,233,.06)' }}
              onMouseEnter={e=>{ if(selected?.id!==i.id) e.currentTarget.style.borderColor='#7dd3fc'; }}
              onMouseLeave={e=>{ if(selected?.id!==i.id) e.currentTarget.style.borderColor='#e0f2fe'; }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#0c4a6e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{i.nom_prenom || '—'}</div>
                  <div style={{ fontSize:11.5, color:'#0369a1', fontWeight:600, marginTop:3 }}>{i.matricule}{i.department ? ' · ' + i.department : ''}</div>
                  <div style={{ fontSize:11.5, color:'#7dd3fc', marginTop:3 }}>
                    {fmtDate(i.date_incident)}{i.heure_incident ? ' · ' + i.heure_incident : ''}{i.agent_causal ? ' · ' + i.agent_causal : ''}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                  <BtnModifier onClick={() => handleEdit(i)} />
                  <BtnSupprimer onClick={() => setConfirmDel(i)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Panneau droite ══ */}
      {hasPanneau && (
        <div style={{ flex:1, minWidth:0, borderRadius:'0 14px 14px 0', overflow:'hidden', border:'1.5px solid #bae6fd', background:'white' }}>
          {panneau==='detail' && selected && (
            <DetailSansBon incident={selected} onEdit={handleEdit} onDelete={setConfirmDel} onClose={handleClose} />
          )}
          {panneau==='form' && (
            <FormulaireSansBon initial={editTarget} onSaved={handleSaved} onClose={handleClose} />
          )}
        </div>
      )}

      {/* ══ Modal suppression ══ */}
      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }} onClick={() => setConfirmDel(null)}>
          <div style={{ background:'white', borderRadius:16, padding:'30px 34px', maxWidth:420, width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ width:44, height:44, borderRadius:12, background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', marginBottom:14 }}>
              <IcoTrash />
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:'#0c4a6e', marginBottom:8 }}>Supprimer cet incident ?</div>
            <div style={{ fontSize:13.5, color:'#64748b', marginBottom:26, lineHeight:1.55 }}>
              Vous allez supprimer l'incident de <strong style={{ color:'#0c4a6e' }}>{confirmDel.nom_prenom}</strong> du {fmtDate(confirmDel.date_incident)}.<br/>
              Cette action est irréversible.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <BtnFermer onClick={() => setConfirmDel(null)} />
              <button onClick={() => handleDelete(confirmDel)}
                style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', border:'none', background:'#dc2626', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                <IcoTrash /> Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}