// src/components/infirmier/MaladiesChroniques.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  getMaladiesChroniques,
  creerMaladieChronique,
  modifierMaladieChronique,
  supprimerMaladieChronique,
  searchCollaborateurs,
} from '../../api/actInfirmierApi';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const todayStr = ()  => new Date().toISOString().slice(0, 10);

const MALADIE_CHOICES = [
  'Diabète',
  'Hypertension',
  'Asthme',
  'Insuffisance rénale',
  'Épilepsie',
  'Autre',
];

const EMPTY_FORM = {
  collaborateur: '',
  date_declaration: todayStr(),
  type_maladie: '',
  type_maladie_autre: '',
  commentaire: '',
};

/* ─── Icons ───────────────────────────────────────────────── */
const IcoPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoEdit   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IcoTrash  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoClose  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoSave   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoHeart  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;

/* ─── Styles ──────────────────────────────────────────────── */
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

/* ── Badge couleur par type maladie ── */
const BADGE_COLORS = {
  'Diabète':            { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe' },
  'Hypertension':       { bg:'#e0f2fe', color:'#0369a1', border:'#7dd3fc' },
  'Asthme':             { bg:'#f0f9ff', color:'#0c4a6e', border:'#bae6fd' },
  'Insuffisance rénale':{ bg:'#e0f2fe', color:'#075985', border:'#7dd3fc' },
  'Épilepsie':          { bg:'#ecfeff', color:'#0e7490', border:'#67e8f9' },
  'Autre':              { bg:'#f0f9ff', color:'#334155', border:'#cbd5e1' },
};
const TypeBadge = ({ type, autreDetail, onClick, title: titleProp }) => {
  const col = BADGE_COLORS[type] || BADGE_COLORS.Autre;
  const label =
    type === 'Autre' && String(autreDetail || '').trim()
      ? String(autreDetail).trim()
      : type;
  const short =
    label.length > 42 ? `${label.slice(0, 39)}…` : label;
  const title = titleProp ?? label;
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
      title={title}
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 99,
        background: col.bg,
        color: col.color,
        border: `1px solid ${col.border}`,
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-block',
        maxWidth: 220,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      {short}
    </span>
  );
};

/** Id collaborateur numérique ou chaîne (certaines API renvoient un objet minimal) */
function rawCollaborateurId(d) {
  let id = d?.collaborateur;
  if (id && typeof id === 'object' && id.id != null) id = id.id;
  if (id === undefined || id === null || String(id).trim() === '') return null;
  return id;
}

/** Clé stable pour regrouper les lignes API par collaborateur */
function collaborateurGroupKey(d) {
  const id = rawCollaborateurId(d);
  if (id != null) {
    return `id:${String(id)}`;
  }
  const mat = String(d.matricule || '').trim().toLowerCase();
  if (mat) return `mat:${mat}`;
  return `nom:${String(d.collaborateur_nom || '').trim().toLowerCase()}`;
}

function groupMaladiesByCollaborateur(rows) {
  const map = new Map();
  for (const d of rows) {
    const key = collaborateurGroupKey(d);
    if (!map.has(key)) {
      map.set(key, {
        key,
        collaborateurId: rawCollaborateurId(d),
        collaborateur_nom: d.collaborateur_nom,
        matricule: d.matricule,
        segment: d.segment,
        items: [],
      });
    }
    const g = map.get(key);
    g.items.push(d);
    const rid = rawCollaborateurId(d);
    if ((g.collaborateurId === null || g.collaborateurId === undefined || String(g.collaborateurId).trim() === '') && rid != null) {
      g.collaborateurId = rid;
    }
    if (!g.collaborateur_nom && d.collaborateur_nom) g.collaborateur_nom = d.collaborateur_nom;
    if (!g.matricule && d.matricule) g.matricule = d.matricule;
    if (!g.segment && d.segment) g.segment = d.segment;
  }
  for (const g of map.values()) {
    g.items.sort((a, b) => {
      const da = new Date(a.date_declaration || 0).getTime();
      const db = new Date(b.date_declaration || 0).getTime();
      return db - da;
    });
  }
  return Array.from(map.values()).sort((a, b) =>
    String(a.collaborateur_nom || '').localeCompare(String(b.collaborateur_nom || ''), 'fr', { sensitivity: 'base' }),
  );
}

/* ══════════════════════════════════════════════════════════
   PANNEAU DÉTAILS
══════════════════════════════════════════════════════════ */
function DetailMaladieChronique({ item: m, onEdit, onClose, onRequestDelete, readOnly = false }) {
  const { user } = useAuth();
  const [infirmierNameMap, setInfirmierNameMap] = useState({});

  const pickInfirmierId = (item) => {
    if (!item || typeof item !== 'object') return null;
    const id =
      item.infirmiere_id ??
      item.infirmier_id ??
      item.infirmiere ??
      item.infirmier ??
      item.created_by ??
      item.createdBy ??
      null;
    if (id === null || id === undefined || String(id).trim() === '') return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  };

  const fetchUserLabelById = async (id) => {
    const userId = Number(id);
    if (!Number.isFinite(userId)) return null;

    const urls = [
      `/account/users/${userId}/`,
      `/account/utilisateurs/${userId}/`,
      `/account/infirmiers/${userId}/`,
      `/account/infirmieres/${userId}/`,
      `/account/profils/${userId}/`,
    ];

    for (const url of urls) {
      try {
        const r = await axiosInstance.get(url);
        const data = r?.data;
        if (!data || typeof data !== 'object') continue;
        const full =
          data.nom_complet ??
          data.nomComplet ??
          data.full_name ??
          data.fullName ??
          data.username ??
          null;
        if (full && String(full).trim()) return String(full).trim();
        const nom = String(data.nom || data.last_name || data.lastName || '').trim();
        const prenom = String(data.prenom || data.first_name || data.firstName || '').trim();
        const joined = `${nom} ${prenom}`.trim();
        if (joined) return joined;
      } catch (e) {
        const st = e?.response?.status;
        if (st === 404 || st === 405) continue;
      }
    }
    return null;
  };

  const pickSaisiePar = (item) => {
    if (!item || typeof item !== 'object') return '—';

    const direct =
      item.infirmiere_nom ??
      item.infirmier_nom ??
      item.infirmiereName ??
      item.infirmierName ??
      item.created_by_name ??
      item.createdByName ??
      null;
    if (direct && String(direct).trim()) return String(direct).trim();

    const obj =
      (item.infirmiere && typeof item.infirmiere === 'object' ? item.infirmiere : null) ||
      (item.infirmier && typeof item.infirmier === 'object' ? item.infirmier : null) ||
      item.infirmiere_detail ||
      item.infirmier_detail ||
      item.infirmiereDetails ||
      item.infirmierDetails ||
      null;
    if (obj && typeof obj === 'object') {
      const full =
        obj.nom_complet ??
        obj.nomComplet ??
        obj.full_name ??
        obj.fullName ??
        obj.username ??
        null;
      if (full && String(full).trim()) return String(full).trim();

      const nom = String(obj.nom || obj.last_name || obj.lastName || '').trim();
      const prenom = String(obj.prenom || obj.first_name || obj.firstName || '').trim();
      const joined = `${nom} ${prenom}`.trim();
      if (joined) return joined;
    }

    // Fallback sur l'ID infirmier (ne jamais utiliser le user connecté ici)
    const id = pickInfirmierId(item);
    if (id != null) {
      const cached = infirmierNameMap[id];
      if (cached) return cached;
      return `Infirmier #${id}`;
    }

    return '—';
  };

  // Si le backend ne renvoie que l'ID, on résout le nom via API user detail.
  useEffect(() => {
    const id = pickInfirmierId(m);
    if (id == null) return;
    if (infirmierNameMap[id]) return;

    let cancelled = false;
    fetchUserLabelById(id)
      .then((label) => {
        if (cancelled) return;
        if (!label) return;
        setInfirmierNameMap((prev) => ({ ...prev, [id]: label }));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [m, infirmierNameMap]);

  const saisiePar = pickSaisiePar(m);
  const Row = ({ label, value }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <span style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</span>
      <span style={{ fontSize:13, color:'#111827', fontWeight:500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderLeft:'1.5px solid #f3f4f6', borderRadius:'0 14px 14px 0' }}>
      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', flexShrink:0, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#0ea5e9,#0369a1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, boxShadow:'0 4px 12px rgba(14,165,233,.3)' }}>
            <IcoHeart />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#111827' }}>{m.collaborateur_nom || '—'}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{m.matricule}</div>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <TypeBadge type={m.type_maladie} autreDetail={m.type_maladie_autre} />
              {m.segment && (
                <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#f3f4f6', color:'#374151' }}>
                  {m.segment}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ padding:'4px 10px', border:'1.5px solid #e5e7eb', background:'#f9fafb', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, color:'#6b7280', flexShrink:0 }}
            onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.color='#dc2626';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f9fafb';e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#6b7280';}}>
            Fermer
          </button>
        </div>
      </div>

      {/* Corps */}
      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
        <div style={{ marginBottom:18 }}>
          <SecTitle>Maladie chronique</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Date de déclaration" value={fmtDate(m.date_declaration)} />
            <Row label="Type de maladie" value={m.type_maladie} />
            {m.type_maladie === 'Autre' && (
              <Row label="Précision (autre)" value={m.type_maladie_autre} />
            )}
            <Row label="Numéro de téléphone" value={m.num_tel} />
          </div>
        </div>

        {m.commentaire && (
          <div style={{ marginBottom:18 }}>
            <SecTitle>Commentaire</SecTitle>
            <p style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{m.commentaire}</p>
          </div>
        )}

        <div>
          <SecTitle>Informations collaborateur</SecTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Row label="Segment" value={m.segment} />
            <Row label="Saisie par" value={saisiePar} />
            <Row label="Date de création" value={fmtDate(m.date_creation)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      {!readOnly && (
        <div style={{ padding:'12px 20px', borderTop:'1px solid #f3f4f6', flexShrink:0, display:'flex', justifyContent:'flex-end', gap:8, background:'#fafafa', borderRadius:'0 0 14px 0' }}>
          {typeof onRequestDelete === 'function' && (
            <button
              type="button"
              onClick={() => onRequestDelete(m)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 16px',
                border: '1.5px solid #fecaca',
                background: '#fff5f5',
                color: '#b91c1c',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <IcoTrash /> Supprimer
            </button>
          )}
          <button onClick={() => onEdit(m)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0369a1)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <IcoEdit /> Modifier
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORMULAIRE
══════════════════════════════════════════════════════════ */
function FormulaireMaladieChronique({ initial, lockedCollaborateur = null, onSaved, onClose }) {
  const isEdit = !!initial?.id;
  const [form,          setForm]          = useState({ ...EMPTY_FORM, ...initial });
  const [collabQuery,   setCollabQuery]   = useState(initial?.collaborateur_nom ?? '');
  const [collabNom,     setCollabNom]     = useState(initial?.collaborateur_nom ?? '');
  const [collabResults, setCollabResults] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [fieldErrors,   setFieldErrors]   = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const collabVerrouille = !isEdit && lockedCollaborateur != null && lockedCollaborateur.id != null;

  useEffect(() => {
    if (isEdit || !lockedCollaborateur?.id) return;
    setForm({
      ...EMPTY_FORM,
      collaborateur: lockedCollaborateur.id,
      date_declaration: todayStr(),
      type_maladie: '',
      type_maladie_autre: '',
      commentaire: '',
    });
    const label = `${lockedCollaborateur.nom || '—'}${lockedCollaborateur.matricule ? ` (${lockedCollaborateur.matricule})` : ''}`;
    setCollabNom(label);
    setCollabQuery(label);
    setCollabResults([]);
    setFieldErrors({});
    setError('');
  }, [isEdit, lockedCollaborateur]);

  const handleTypeMaladieChange = (value) => {
    set('type_maladie', value);
    setFieldErrors(prev => ({ ...prev, type_maladie: '', type_maladie_autre: '' }));
    if (value !== 'Autre') {
      set('type_maladie_autre', '');
    }
  };

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
    const nextErrors = {};
    if (!form.collaborateur) nextErrors.collaborateur = 'Veuillez sélectionner un collaborateur.';
    if (!form.date_declaration) nextErrors.date_declaration = 'La date de déclaration est requise.';
    if (!form.type_maladie) nextErrors.type_maladie = 'Le type de maladie est requis.';
    if (form.type_maladie === 'Autre' && !form.type_maladie_autre.trim()) {
      nextErrors.type_maladie_autre = 'Veuillez préciser la maladie.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError(nextErrors.type_maladie_autre || 'Veuillez corriger les champs obligatoires.');
      return;
    }

    setSaving(true); setError('');
    try {
      const payload = {
        collaborateur:      form.collaborateur,
        date_declaration:   form.date_declaration,
        type_maladie:       form.type_maladie,
        commentaire:        form.commentaire,
      };
      if (form.type_maladie === 'Autre') {
        payload.type_maladie_autre = form.type_maladie_autre.trim();
      }
      const saved = isEdit
        ? await modifierMaladieChronique(form.id, payload)
        : await creerMaladieChronique(payload);
      onSaved(saved);
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'white', borderRadius:16, width:'min(680px,96vw)', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.22)', animation:'modalIn .2s ease' }}>
        {/* Header modal */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderRadius:'16px 16px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#0ea5e9,#0369a1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}><IcoHeart /></div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'#111827' }}>{isEdit ? 'Modifier' : 'Nouvelle'} maladie chronique</div>
              <div style={{ fontSize:11.5, color:'#6b7280' }}>{isEdit ? `Modification de l'enregistrement` : 'Enregistrement d\'une nouvelle déclaration'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}><IcoClose /></button>
        </div>

        {/* Corps */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 22px' }}>
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 14px', borderRadius:9, fontSize:13, marginBottom:16 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom:20 }}>
            <SecTitle>Collaborateur</SecTitle>
            {collabVerrouille ? (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #bbf7d0',
                  background: '#f0fdf4',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#166534',
                }}
              >
                ✓ {collabNom}
                <div style={{ fontSize: 11.5, fontWeight: 500, color: '#15803d', marginTop: 4 }}>
                  Collaborateur fixé pour cette déclaration (ajout rapide depuis la liste).
                </div>
              </div>
            ) : (
              <div style={{ position:'relative' }}>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}><IcoSearch /></span>
                  <input
                    value={collabQuery}
                    onChange={e => handleCollabInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCollabSearch(); }}
                    placeholder="Rechercher par nom ou matricule…"
                    style={{ ...inp, paddingLeft:32, paddingRight:106 }}
                  />
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
                        onMouseEnter={e => e.currentTarget.style.background='#f0f9ff'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <span style={{ fontWeight:700 }}>{c.nom} {c.prenom}</span>
                        <span style={{ color:'#6b7280', marginLeft:8, fontSize:12 }}>
                          {[c.matricule, c.department || c.segment].filter(Boolean).join(' - ')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {collabNom && !collabVerrouille && (
                  <div style={{ marginTop:6, fontSize:12.5, color:'#059669', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                    ✓ {collabNom}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
            <SecTitle style={{ gridColumn:'1/-1' }}>Déclaration</SecTitle>

            <Field label="Date de déclaration" required>
              <input type="date" value={form.date_declaration} onChange={e => { set('date_declaration', e.target.value); setFieldErrors(prev => ({ ...prev, date_declaration: '' })); }} style={inp} />
              {fieldErrors.date_declaration && <span style={{ fontSize:12, color:'#dc2626' }}>{fieldErrors.date_declaration}</span>}
            </Field>

            <Field label="Type de maladie" required>
              <select value={form.type_maladie} onChange={e => handleTypeMaladieChange(e.target.value)} style={inp}>
                <option value="">-- Sélectionner --</option>
                {MALADIE_CHOICES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {fieldErrors.type_maladie && <span style={{ fontSize:12, color:'#dc2626' }}>{fieldErrors.type_maladie}</span>}
            </Field>

            {form.type_maladie === 'Autre' && (
              <Field label="Préciser le type" required full>
                <input value={form.type_maladie_autre} onChange={e => { set('type_maladie_autre', e.target.value); setFieldErrors(prev => ({ ...prev, type_maladie_autre: '' })); }} placeholder="Décrire la maladie…" style={inp} />
                {fieldErrors.type_maladie_autre && <span style={{ fontSize:12, color:'#dc2626' }}>{fieldErrors.type_maladie_autre}</span>}
              </Field>
            )}

            <Field label="Commentaire" full>
              <textarea value={form.commentaire} onChange={e => set('commentaire', e.target.value)} rows={3} placeholder="Observations supplémentaires…" style={{ ...inp, resize:'vertical', lineHeight:1.5 }} />
            </Field>
          </div>

          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:9, padding:'10px 14px', fontSize:12.5, color:'#166534' }}>
            ℹ️ Le segment et le numéro de téléphone sont automatiquement récupérés depuis le dossier du collaborateur.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px', borderTop:'1px solid #f3f4f6', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'9px 20px', border:'1.5px solid #e5e7eb', background:'white', borderRadius:8, fontSize:13, fontWeight:700, color:'#374151', cursor:'pointer', fontFamily:'inherit' }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 22px', border:'none', background: saving ? '#9ca3af' : 'linear-gradient(135deg,#0ea5e9,#0369a1)', color:'white', borderRadius:8, fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
            <IcoSave /> {saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer les modifications' : 'Créer la déclaration')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function MaladiesChroniques({ readOnly = false }) {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [quickAddLocked, setQuickAddLocked] = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setData(await getMaladiesChroniques()); } catch { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredRaw = useMemo(() => data.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (d.collaborateur_nom || '').toLowerCase().includes(q)
      || (d.matricule || '').toLowerCase().includes(q)
      || (d.segment || '').toLowerCase().includes(q);
    const matchType = !filterType || d.type_maladie === filterType;
    return matchSearch && matchType;
  }), [data, search, filterType]);

  const grouped = useMemo(() => groupMaladiesByCollaborateur(filteredRaw), [filteredRaw]);

  const handleSaved = (saved) => {
    setShowForm(false);
    setEditItem(null);
    setQuickAddLocked(null);
    load();
    setSelected(saved);
  };

  const handleDelete = async (id) => {
    if (readOnly) return;
    try { await supprimerMaladieChronique(id); setConfirmDel(null); if (selected?.id === id) setSelected(null); load(); } catch {}
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:0 }}>
      <style>{`@keyframes modalIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Barre d'actions */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, flexShrink:0, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 220px' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}><IcoSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, matricule, segment…"
            style={{ padding:'9px 12px 9px 32px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, width:'100%', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, background:'white', cursor:'pointer', fontFamily:'inherit' }}>
          <option value="">Tous les types</option>
          {MALADIE_CHOICES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {!readOnly && (
          <button onClick={() => { setEditItem(null); setQuickAddLocked(null); setShowForm(true); }}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0369a1)', color:'white', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            <IcoPlus /> Nouvelle déclaration
          </button>
        )}
      </div>

      {/* Contenu : liste + détail */}
      <div style={{ flex:1, minHeight:0, display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:16 }}>

        {/* Tableau */}
        <div style={{ background:'white', borderRadius:14, border:'1.5px solid #f3f4f6', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'#f0f9ff' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#0ea5e9,#0369a1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}><IcoHeart /></div>
              <div style={{ fontSize:14, fontWeight:800, color:'#111827' }}>Maladies chroniques</div>
            </div>
            <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'#e0f2fe', color:'#0369a1' }}>
              {grouped.length} collaborateur{grouped.length !== 1 ? 's' : ''}
              <span style={{ fontWeight:600, opacity:0.92 }}>{' · '}{filteredRaw.length} déclaration{filteredRaw.length !== 1 ? 's' : ''}</span>
            </span>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? (
              <div style={{ padding:40, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Chargement…</div>
            ) : grouped.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Aucune déclaration trouvée.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {(readOnly
                      ? ['Collaborateur', 'Pathologies chroniques', 'Dernière déclaration', 'Segment']
                      : ['Collaborateur', 'Pathologies chroniques', 'Dernière déclaration', 'Segment', 'Actions']
                    ).map((h) => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10.5, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid #f3f4f6', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((g) => {
                    const recent = g.items[0];
                    const selectedInGroup = selected && g.items.some((i) => i.id === selected.id);
                    return (
                      <tr
                        key={g.key}
                        onClick={() => setSelected(recent)}
                        style={{
                          cursor: 'pointer',
                          transition: 'background .12s',
                          background: selectedInGroup ? '#f0f9ff' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedInGroup) e.currentTarget.style.background = '#f0f9ff';
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedInGroup) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb', fontWeight:600, verticalAlign:'top' }}>
                          {g.collaborateur_nom || '—'}
                          <br />
                          <span style={{ fontSize:11, color:'#6b7280', fontWeight:400 }}>{g.matricule || '—'}</span>
                        </td>
                        <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb', verticalAlign:'top' }}>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', maxWidth:420 }}>
                            {g.items.map((it) => (
                              <TypeBadge
                                key={it.id}
                                type={it.type_maladie}
                                autreDetail={it.type_maladie_autre}
                                title={`Voir le détail — déclaré le ${fmtDate(it.date_declaration)}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected(it);
                                }}
                              />
                            ))}
                          </div>
                        </td>
                        <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb', color:'#374151', verticalAlign:'top' }}>
                          <div>{fmtDate(recent?.date_declaration)}</div>
                          {g.items.length > 1 && (
                            <div style={{ fontSize:10.5, color:'#9ca3af', marginTop:4, fontWeight:600 }}>
                              {g.items.length} pathologies en suivi
                            </div>
                          )}
                        </td>
                        <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb', color:'#6b7280', fontSize:12, verticalAlign:'top' }}>{g.segment || '—'}</td>
                        {!readOnly && (
                          <td style={{ padding:'10px 14px', borderBottom:'1px solid #f9fafb', verticalAlign:'top' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Ajouter une pathologie pour ce collaborateur"
                              onClick={() => {
                                setEditItem(null);
                                if (g.collaborateurId != null && String(g.collaborateurId).trim() !== '') {
                                  setQuickAddLocked({
                                    id: g.collaborateurId,
                                    nom: g.collaborateur_nom || '—',
                                    matricule: g.matricule || '',
                                  });
                                } else {
                                  setQuickAddLocked(null);
                                }
                                setShowForm(true);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 12px',
                                borderRadius: 8,
                                border: '1.5px solid #7dd3fc',
                                background: 'linear-gradient(135deg,#e0f2fe,#f0f9ff)',
                                color: '#0369a1',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <IcoPlus />
                              Pathologie
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Détail */}
        {selected && (
          <DetailMaladieChronique
            item={selected}
            onEdit={(item) => { setEditItem(item); setQuickAddLocked(null); setShowForm(true); }}
            onClose={() => setSelected(null)}
            onRequestDelete={readOnly ? undefined : () => setConfirmDel(selected.id)}
            readOnly={readOnly}
          />
        )}
      </div>

      {/* Modal formulaire */}
      {!readOnly && showForm && (
        <FormulaireMaladieChronique
          key={editItem?.id ? `edit-${editItem.id}` : quickAddLocked ? `quick-${quickAddLocked.id}` : 'new'}
          initial={editItem}
          lockedCollaborateur={!editItem ? quickAddLocked : null}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditItem(null); setQuickAddLocked(null); }}
        />
      )}

      {/* Confirm suppression */}
      {!readOnly && confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001 }}>
          <div style={{ background:'white', borderRadius:14, padding:'28px 32px', maxWidth:400, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.22)' }}>
            <div style={{ fontSize:38, marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#111827', marginBottom:8 }}>Confirmer la suppression</div>
            <div style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>Cette déclaration sera supprimée définitivement.</div>
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