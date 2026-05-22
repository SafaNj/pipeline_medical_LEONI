// src/components/infirmier/MaladieProfessionnelle.jsx
import { useState, useEffect, useRef } from 'react';
import {
  getMaladies, creerMaladie, modifierMaladie, supprimerMaladie,
  getStatsMaladies, searchCollaborateurs, getCollaborateurById,
} from '../../api/actInfirmierApi';
import { useAuth } from '../../context/AuthContext';
import { pickDepartementCollaborateur } from '../../utils/ficheCollaborateur';
import { uiAlert, uiConfirm } from '../../utils/uiAlert';

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const todayStr = ()  => new Date().toISOString().slice(0, 10);
const MOIS     = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const yearsSince = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1;
  return years >= 0 ? years : null;
};

const EMPTY_FORM = {
  collaborateur: '', plant_section: '', segment: '',
  mois: new Date().getMonth() + 1, date_debut_maladie: todayStr(),
  maladie: '', code_tableau_cnam: '', cause: '', nature_travail: '',
  changement_poste: false, ancien_poste: '', nouveau_poste: '',
  decision_medecin: '', repos_initial: 0, prolongation: 0, rechute: 0,
  reprise_medecin_traitant: false, reprise_medecin_travail: '',
  date_declaration_service_medical: todayStr(),
  date_sortie_declaration: '', chauffeur_sortie: '',
};

/* ─── Icons ──────────────────────────────────────────────── */
const IcoPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoEdit   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IcoTrash  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoVirus  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
const IcoClose  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoSave   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

/* ─── Styles ─────────────────────────────────────────────── */
const inp = {
  padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:7,
  fontSize:13, color:'#111827', background:'white', outline:'none',
  fontFamily:'inherit', width:'100%', boxSizing:'border-box',
};
const Field = ({ label, required, full, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, gridColumn: full ? '1/-1' : undefined }}>
    <label style={{ fontSize:10.5, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.5px' }}>
      {label}{required && <span style={{ color:'#0ea5e9' }}> *</span>}
    </label>
    {children}
  </div>
);
const SecTitle = ({ children }) => (
  <div style={{ fontSize:10.5, fontWeight:800, color:'#0ea5e9', textTransform:'uppercase', letterSpacing:'.8px', paddingBottom:6, marginBottom:12, borderBottom:'2px solid #e0f2fe' }}>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════
   PANNEAU DÉTAILS
══════════════════════════════════════════════════════════ */
function DetailMaladie({ maladie: m, onEdit, onClose }) {
  const { user } = useAuth();
  const reposTotal = m.repos_total ?? (m.repos_initial + m.prolongation + m.rechute);
  const ageCalc = m.age ?? yearsSince(m.collaborateur_date_naissance);
  const ancienneteCalc = m.anciennete_annees ?? yearsSince(m.collaborateur_date_embauche);
  const saisiePar = m.infirmiere_nom || (m.infirmiere === user?.user_id ? user?.username : '') || (m.infirmiere ? `#${m.infirmiere}` : '—');
  const Row = ({ label, value }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <span style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</span>
      <span style={{ fontSize:13, color:'#111827', fontWeight:500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderLeft:'1.5px solid #f3f4f6', borderRadius:'0 14px 14px 0' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', flexShrink:0, background:'linear-gradient(135deg,#f0f9ff,#f5f3ff)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, boxShadow:'0 4px 12px rgba(124,58,237,.3)' }}>
            <IcoVirus />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#111827' }}>{m.collaborateur_nom || '—'}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{m.collaborateur_matricule} · {m.collaborateur_poste || ''}</div>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'#e0f2fe', color:'#0369a1', border:'1px solid #7dd3fc' }}>
                Code {m.code_tableau_cnam}
              </span>
              <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#f3f4f6', color:'#374151' }}>
                {reposTotal} j repos total
              </span>
              {m.changement_poste && (
                <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#fff7ed', color:'#c2410c', border:'1px solid #fed7aa' }}>Poste changé</span>
              )}
              {m.reprise_medecin_traitant && (
                <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#f0fdf4', color:'#166534', border:'1px solid #bbf7d0' }}>Reprise MT</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ padding:'4px 10px', border:'1.5px solid #e5e7eb', background:'#f9fafb', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, color:'#6b7280', flexShrink:0, transition:'all .12s' }} onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.color='#dc2626';}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#6b7280';}}>Fermer</button>
        </div>
      </div>

      {/* Corps */}
      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>

        <div style={{ marginBottom:18 }}>
          <SecTitle>Maladie</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Mois" value={MOIS[m.mois]} />
            <Row label="Date début" value={fmtDate(m.date_debut_maladie)} />
            <Row label="Maladie / Diagnostic" value={m.maladie} />
            <Row label="Code tableau CNAM" value={m.code_tableau_cnam} />
            <Row label="Cause" value={m.cause} />
            <Row label="Nature du travail" value={m.nature_travail} />
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <SecTitle>Décision médicale & Repos</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <Row label="Décision médecin" value={m.decision_medecin} />
            <Row label="Repos initial" value={`${m.repos_initial} j`} />
            <Row label="Prolongation" value={`${m.prolongation} j`} />
            <Row label="Rechute" value={`${m.rechute} j`} />
            <Row label="Total repos" value={`${reposTotal} j`} />
            <Row label="Reprise médecin travail" value={fmtDate(m.reprise_medecin_travail)} />
          </div>
        </div>

        {m.changement_poste && (
          <div style={{ marginBottom:18 }}>
            <SecTitle>Changement de poste</SecTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Row label="Ancien poste" value={m.ancien_poste} />
              <Row label="Nouveau poste" value={m.nouveau_poste} />
            </div>
          </div>
        )}

        <div style={{ marginBottom:18 }}>
          <SecTitle>Informations collaborateur</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Plant section de collaborateur" value={m.plant_section} />
            <Row label="Département" value={m.segment} />
            <Row label="Âge" value={ageCalc != null ? `${ageCalc} ans` : '—'} />
            <Row label="Ancienneté" value={ancienneteCalc != null ? `${ancienneteCalc} ans` : '—'} />
            <Row label="Téléphone" value={m.collaborateur_telephone} />
            <Row label="Date embauche" value={fmtDate(m.collaborateur_date_embauche)} />
          </div>
        </div>

        <div>
          <SecTitle>Déclaration & Sortie</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Date déclaration SM" value={fmtDate(m.date_declaration_service_medical)} />
            <Row label="Date de sortie de la déclaration par le chauffeur" value={fmtDate(m.date_sortie_declaration)} />
            <Row label="Chauffeur / Transport" value={m.chauffeur_sortie} />
            <Row label="Saisie par" value={saisiePar} />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding:'12px 20px', borderTop:'1px solid #f3f4f6', flexShrink:0, display:'flex', justifyContent:'flex-end', gap:8, background:'#fafafa', borderRadius:'0 0 14px 0' }}>
        <button onClick={() => onEdit(m)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(124,58,237,.25)' }}>
          <IcoEdit /> Modifier cette déclaration
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PANNEAU FORMULAIRE
══════════════════════════════════════════════════════════ */
function FormulaireMaladie({ initial, onSaved, onClose }) {
  const { user } = useAuth();
  const isEdit = !!initial?.id;
  const [form,          setForm]          = useState({ ...EMPTY_FORM, ...initial });
  const [infirmierNom,  setInfirmierNom]  = useState(initial?.infirmiere_nom ?? user?.username ?? '');
  const [collabQuery,   setCollabQuery]   = useState(initial?.collaborateur_nom ?? '');
  const [collabNom,     setCollabNom]     = useState(initial?.collaborateur_nom ?? '');
  const [collabResults, setCollabResults] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const debRef = useRef(null);
  const [collabInfo, setCollabInfo] = useState(
    initial ? {
      matricule: initial.collaborateur_matricule ?? '',
      telephone: initial.collaborateur_telephone ?? '',
      poste: initial.collaborateur_poste ?? '',
      department: initial.collaborateur_department ?? '',
      date_embauche: initial.collaborateur_date_embauche ?? '',
      date_naissance: initial.collaborateur_date_naissance ?? '',
    } : null
  );
  const ageCollab = yearsSince(collabInfo?.date_naissance);
  const ancienneteCollab = yearsSince(collabInfo?.date_embauche);

  useEffect(() => {
    setForm({ ...EMPTY_FORM, ...initial });
    setInfirmierNom(initial?.infirmiere_nom ?? user?.username ?? '');
    setCollabQuery(initial?.collaborateur_nom ?? '');
    setCollabNom(initial?.collaborateur_nom ?? '');
    setCollabInfo(initial ? {
      matricule: initial.collaborateur_matricule ?? '',
      telephone: initial.collaborateur_telephone ?? '',
      poste: initial.collaborateur_poste ?? '',
      department: initial.collaborateur_department ?? '',
      date_embauche: initial.collaborateur_date_embauche ?? '',
      date_naissance: initial.collaborateur_date_naissance ?? '',
    } : null);
    setError('');
  }, [initial?.id, user?.username]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCollabSearch = (val) => {
    setCollabQuery(val); setCollabNom(''); set('collaborateur', '');
    set('plant_section', '');
    set('segment', '');
    clearTimeout(debRef.current);
    if (val.trim().length < 2) { setCollabResults([]); return; }
    debRef.current = setTimeout(async () => {
      setLoadingCollab(true);
      try { setCollabResults(await searchCollaborateurs(val.trim())); }
      catch { setCollabResults([]); }
      finally { setLoadingCollab(false); }
    }, 250);
  };

  const selectCollab = async (c) => {
    set('collaborateur', c.id);
    setCollabNom(`${c.nom} ${c.prenom} — ${c.matricule}`);
    setCollabQuery(`${c.nom} ${c.prenom}`);
    setCollabResults([]);
    try {
      const detail = await getCollaborateurById(c.id);
      const autoPlantSection = detail.plant_section ?? detail.plantSection ?? detail.section_atelier ?? '';
      const autoDept = pickDepartementCollaborateur(detail);
      setCollabInfo({
        matricule: detail.matricule ?? '',
        telephone: detail.telephone ?? '',
        poste: detail.poste ?? '',
        department: autoDept,
        date_embauche: detail.date_embauche ?? '',
        date_naissance: detail.date_naissance ?? '',
      });
      set('plant_section', autoPlantSection);
      set('segment', autoDept);
    } catch { setCollabInfo(null); }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.collaborateur)                    return setError('Sélectionnez un collaborateur.');
    if (!infirmierNom.trim())                   return setError('Le nom de l\'infirmier est requis.');
    if (!form.date_debut_maladie)               return setError('Date début maladie requise.');
    if (!form.maladie.trim())                   return setError('Maladie requise.');
    if (!form.code_tableau_cnam.trim())         return setError('Code CNAM requis.');
    if (!form.cause.trim())                     return setError('Cause requise.');
    if (!form.nature_travail.trim())            return setError('Nature du travail requise.');
    if (!form.decision_medecin.trim())          return setError('Décision médecin requise.');
    if (!form.date_declaration_service_medical) return setError('Date déclaration requise.');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isEdit && user?.user_id) payload.infirmiere = user.user_id;
      if (!payload.reprise_medecin_travail) delete payload.reprise_medecin_travail;
      const saved = isEdit
        ? await modifierMaladie(initial.id, payload)
        : await creerMaladie(payload);
      onSaved(saved);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.detail || Object.values(d ?? {}).flat().join(' ') || 'Erreur lors de l\'enregistrement.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderLeft:'1.5px solid #f3f4f6', borderRadius:'0 14px 14px 0' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
          <IcoVirus />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#111827' }}>{isEdit ? 'Modifier la déclaration' : 'Nouvelle déclaration MP'}</div>
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>Champs * obligatoires</div>
        </div>
        <button onClick={onClose} style={{ padding:'4px 10px', border:'1.5px solid #e5e7eb', background:'#f9fafb', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, color:'#6b7280', flexShrink:0, transition:'all .12s' }} onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.color='#dc2626';}} onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#6b7280';}}>Fermer</button>
      </div>

      {/* Corps */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {error && <div style={{ background:'#f0f9ff', border:'1px solid #7dd3fc', color:'#0284c7', borderRadius:8, padding:'9px 13px', fontSize:12.5, marginBottom:14 }}>{error}</div>}

        <div style={{ marginBottom:16 }}>
          <SecTitle>Collaborateur</SecTitle>
          <Field label="Rechercher" required>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}><IcoSearch /></div>
              <input value={collabQuery} onChange={e => handleCollabSearch(e.target.value)} placeholder="Nom, prénom, matricule…"
                style={{ ...inp, paddingLeft:30, borderColor: form.collaborateur ? '#0ea5e9' : '#e5e7eb' }} />
              {form.collaborateur && <span style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#0ea5e9', fontWeight:700 }}>✓</span>}
            </div>
            {collabNom && <div style={{ fontSize:11.5, color:'#0369a1', marginTop:3, fontWeight:600 }}>👤 {collabNom}</div>}
            {loadingCollab && <div style={{ fontSize:11.5, color:'#9ca3af', marginTop:3 }}>Recherche…</div>}
            {collabResults.length > 0 && (
              <div style={{ border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', marginTop:3, boxShadow:'0 4px 14px rgba(0,0,0,.1)' }}>
                {collabResults.slice(0,5).map((c,i) => (
                  <button key={c.id} onMouseDown={() => selectCollab(c)}
                    style={{ width:'100%', textAlign:'left', padding:'8px 11px', border:'none', borderTop: i>0?'1px solid #f3f4f6':'none', background:'white', cursor:'pointer', fontSize:12.5, display:'flex', justifyContent:'space-between' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}>
                    <span style={{ fontWeight:600 }}>{c.nom} {c.prenom}</span>
                    <span style={{ color:'#9ca3af', fontSize:11 }}>{c.matricule}</span>
                  </button>
                ))}
              </div>
            )}
          </Field>
          {/* Carte infos collaborateur */}
          {collabInfo && (
            <div style={{ background:'#e0f2fe', border:'1.5px solid #7dd3fc', borderRadius:10, padding:'10px 14px', marginTop:10, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                ['Matricule', collabInfo.matricule],
                ['Âge', ageCollab != null ? `${ageCollab} ans` : '—'],
                ['Ancienneté', ancienneteCollab != null ? `${ancienneteCollab} ans` : '—'],
                ['Téléphone', collabInfo.telephone],
                ['Poste / Fonction', collabInfo.poste],
                ['Département', collabInfo.department],
                ['Date embauche', collabInfo.date_embauche ? new Date(collabInfo.date_embauche).toLocaleDateString('fr-FR') : '—'],
                ['Date naissance', collabInfo.date_naissance ? new Date(collabInfo.date_naissance).toLocaleDateString('fr-FR') : '—'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  <span style={{ fontSize:9.5, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.4px' }}>{k}</span>
                  <span style={{ fontSize:12.5, color:'#111827', fontWeight:600 }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
            <Field label="Plant section de collaborateur"><input value={form.plant_section} readOnly placeholder="Auto depuis collaborateur" style={{ ...inp, background:'#f9fafb' }} /></Field>
            <Field label="Département" required><input value={form.segment} readOnly placeholder="Auto (RH / im_db)" style={{ ...inp, background:'#f9fafb' }} /></Field>
            <Field label="Infirmier qui remplit" required><input value={infirmierNom} onChange={e => setInfirmierNom(e.target.value)} placeholder="Nom de l'infirmier" style={inp} /></Field>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <SecTitle>Maladie</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Mois" required>
              <select value={form.mois} onChange={e => set('mois', parseInt(e.target.value))} style={inp}>
                {MOIS.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </Field>
            <Field label="Date début" required><input type="date" value={form.date_debut_maladie} onChange={e => set('date_debut_maladie', e.target.value)} style={inp} /></Field>
            <Field label="Maladie / Diagnostic" required full><input value={form.maladie} onChange={e => set('maladie', e.target.value)} placeholder="Ex: Lombalgies…" style={inp} /></Field>
            <Field label="Code tableau CNAM" required><input value={form.code_tableau_cnam} onChange={e => set('code_tableau_cnam', e.target.value)} placeholder="Ex: T57" style={inp} /></Field>
            <Field label="Cause" required><input value={form.cause} onChange={e => set('cause', e.target.value)} placeholder="Ex: Exposition…" style={inp} /></Field>
            <Field label="Nature du travail" required full><input value={form.nature_travail} onChange={e => set('nature_travail', e.target.value)} placeholder="Ex: Travail répétitif…" style={inp} /></Field>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <SecTitle>Poste de travail</SecTitle>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151', marginBottom:10 }}>
            <input type="checkbox" checked={form.changement_poste} onChange={e => set('changement_poste', e.target.checked)} style={{ width:15, height:15, accentColor:'#0ea5e9' }} />
            Changement de poste effectué
          </label>
          {form.changement_poste && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Ancien poste"><input value={form.ancien_poste} onChange={e => set('ancien_poste', e.target.value)} placeholder="Poste précédent" style={inp} /></Field>
              <Field label="Nouveau poste"><input value={form.nouveau_poste} onChange={e => set('nouveau_poste', e.target.value)} placeholder="Nouveau poste" style={inp} /></Field>
            </div>
          )}
        </div>

        <div style={{ marginBottom:16 }}>
          <SecTitle>Décision médicale & Repos</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Décision médecin" required full><input value={form.decision_medecin} onChange={e => set('decision_medecin', e.target.value)} placeholder="Ex: Arrêt de travail…" style={inp} /></Field>
            <Field label="Repos initial (j)"><input type="number" min="0" value={form.repos_initial} onChange={e => set('repos_initial', parseInt(e.target.value)||0)} style={inp} /></Field>
            <Field label="Prolongation (j)"><input type="number" min="0" value={form.prolongation} onChange={e => set('prolongation', parseInt(e.target.value)||0)} style={inp} /></Field>
            <Field label="Rechute (j)"><input type="number" min="0" value={form.rechute} onChange={e => set('rechute', parseInt(e.target.value)||0)} style={inp} /></Field>
            <Field label="Reprise médecin travail"><input type="date" value={form.reprise_medecin_travail} onChange={e => set('reprise_medecin_travail', e.target.value)} style={inp} /></Field>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
                <input type="checkbox" checked={form.reprise_medecin_traitant} onChange={e => set('reprise_medecin_traitant', e.target.checked)} style={{ width:15, height:15, accentColor:'#0ea5e9' }} />
                Reprise avec médecin traitant
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginBottom:8 }}>
          <SecTitle>Déclaration & Sortie</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Date déclaration SM" required><input type="date" value={form.date_declaration_service_medical} onChange={e => set('date_declaration_service_medical', e.target.value)} style={inp} /></Field>
            <Field label="Date de sortie de la déclaration par le chauffeur"><input type="date" value={form.date_sortie_declaration} onChange={e => set('date_sortie_declaration', e.target.value)} style={inp} /></Field>
            <Field label="Chauffeur"><input value={form.chauffeur_sortie} onChange={e => set('chauffeur_sortie', e.target.value)} placeholder="Nom du chauffeur" style={inp} /></Field>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'12px 20px', borderTop:'1px solid #f3f4f6', flexShrink:0, display:'flex', gap:8, justifyContent:'flex-end', background:'#fafafa', borderRadius:'0 0 14px 0' }}>
        <button onClick={onClose} style={{ padding:'8px 16px', border:'1.5px solid #e5e7eb', background:'white', color:'#374151', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
        <button onClick={handleSubmit} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 20px', border:'none', background: saving?'#7dd3fc':'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor: saving?'not-allowed':'pointer' }}>
          <IcoSave />{saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Déclarer'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function MaladieProfessionnelle() {
  const { user } = useAuth();
  const [maladies,  setMaladies]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [panel,     setPanel]     = useState(null); // null | 'detail' | 'new' | 'edit'
  const [selected,  setSelected]  = useState(null);
  const annee = new Date().getFullYear();

  const load = async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([getMaladies(), getStatsMaladies(annee)]);
      setMaladies(data); setStats(s);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = (m)    => { setSelected(m); setPanel('detail'); };
  const openEdit   = (m, e) => { e?.stopPropagation(); setSelected(m); setPanel('edit'); };
  const openNew    = ()     => { setSelected(null); setPanel('new'); };
  const closePanel = ()     => { setPanel(null); setSelected(null); };

  const handleSaved = (saved) => {
    setMaladies(prev => {
      const idx = prev.findIndex(m => m.id === saved.id);
      return idx >= 0 ? prev.map(m => m.id===saved.id ? saved : m) : [saved, ...prev];
    });
    setSelected(saved);
    setPanel('detail');
    load();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const ok = await uiConfirm({
      title: 'Suppression',
      text: 'Supprimer cette déclaration ?',
      confirmButtonText: 'Supprimer',
    });
    if (!ok) return;
    try {
      await supprimerMaladie(id);
      setMaladies(p => p.filter(m => m.id !== id));
      if (selected?.id === id) closePanel();
    } catch {
      await uiAlert({ icon: 'error', title: 'Suppression', text: 'Erreur lors de la suppression.' });
    }
  };

  const filtered = maladies.filter(m =>
    !search.trim() ||
    (m.collaborateur_nom||'').toLowerCase().includes(search.toLowerCase()) ||
    (m.maladie||'').toLowerCase().includes(search.toLowerCase()) ||
    (m.code_tableau_cnam||'').toLowerCase().includes(search.toLowerCase())
  );

  const showPanel = panel !== null;

  return (
    <div style={{ display:'flex', height:'100%', borderRadius:14, overflow:'hidden', border:'1.5px solid #f3f4f6', background:'white', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>

      {/* ══ GAUCHE — Liste ══ */}
      <div style={{ display:'flex', flexDirection:'column', width: showPanel ? '320px' : '100%', flexShrink:0, transition:'width .2s ease', borderRight: showPanel ? '1.5px solid #f3f4f6' : 'none' }}>

        <div style={{ padding:'14px 16px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          {stats && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
              {[
                { label:`Total ${annee}`, value: stats.total, color:'#0ea5e9', bg:'#f0f9ff' },
                { label:'Total repos (j)', value: stats.total_repos, color:'#0369a1', bg:'#e0f2fe' },
                { label:'Ce mois', value: maladies.filter(m => m.mois===new Date().getMonth()+1).length, color:'#059669', bg:'#f0fdf4' },
              ].map((s,i) => (
                <div key={i} style={{ background:s.bg, borderRadius:9, padding:'8px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:9.5, color:s.color, fontWeight:600, opacity:.8, marginTop:1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, position:'relative' }}>
              <div style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}><IcoSearch /></div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ ...inp, paddingLeft:30, fontSize:12.5 }} />
            </div>
            <button onClick={openNew}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 3px 10px rgba(124,58,237,.3)' }}>
              <IcoPlus /> Nouveau
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {loading && <div style={{ textAlign:'center', padding:40, color:'#9ca3af', fontSize:13 }}>Chargement…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:50, color:'#9ca3af' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🦠</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#374151' }}>Aucune maladie déclarée</div>
              <div style={{ fontSize:12, marginTop:4 }}>Cliquez sur "Nouveau" pour commencer</div>
            </div>
          )}
          {!loading && filtered.map(m => {
            const isActive = selected?.id === m.id;
            const reposTotal = m.repos_total ?? (m.repos_initial + m.prolongation + m.rechute);
            return (
              <div key={m.id} onClick={() => openDetail(m)}
                style={{ padding:'11px 14px', borderBottom:'1px solid #f9fafb', cursor:'pointer',
                  background: isActive ? '#f0f9ff' : 'white',
                  borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
                  transition:'background .12s' }}
                onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='#fafafa'; }}
                onMouseLeave={e => { if(!isActive) e.currentTarget.style.background='white'; }}
              >
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background: isActive?'#e0f2fe':'#f0f9ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#0ea5e9' }}>
                    <IcoVirus />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {m.collaborateur_nom || '—'}
                    </div>
                    <div style={{ fontSize:11.5, color:'#6b7280', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {MOIS[m.mois]} · {m.maladie}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'#e0f2fe', color:'#0369a1', border:'1px solid #7dd3fc' }}>Code {m.code_tableau_cnam}</span>
                      <span style={{ fontSize:10.5, color:'#9ca3af' }}>{reposTotal}j repos</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button onClick={e => openEdit(m, e)}
                      style={{ padding:'5px 12px', border:'1.5px solid #bfdbfe', background:'#eff6ff', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700, color:'#2563eb', transition:'all .12s', flexShrink:0, whiteSpace:'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#2563eb'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='#2563eb'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.color='#2563eb'; e.currentTarget.style.borderColor='#bfdbfe'; }}>
                      Modifier
                    </button>
                    <button onClick={e => handleDelete(m.id, e)}
                      style={{ padding:'5px 12px', border:'1.5px solid #fecaca', background:'#fef2f2', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700, color:'#dc2626', transition:'all .12s', flexShrink:0, whiteSpace:'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#dc2626'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='#dc2626'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='#fecaca'; }}>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ DROITE — Détail ou Formulaire ══ */}
      {panel === 'detail' && selected && (
        <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
          <DetailMaladie maladie={selected} onEdit={openEdit} onClose={closePanel} />
        </div>
      )}
      {(panel === 'new' || panel === 'edit') && (
        <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
          <FormulaireMaladie initial={panel === 'edit' ? selected : null} onSaved={handleSaved} onClose={() => selected ? setPanel('detail') : closePanel()} />
        </div>
      )}
    </div>
  );
}