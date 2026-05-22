import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getDeclarationsCNAM,
  creerDeclarationCNAM,
  modifierDeclarationCNAM,
  supprimerDeclarationCNAM,
  getStatsDeclarationsCNAM,
  getDeclarationsEnRetard,
  searchCollaborateurs,
  getCollaborateurById,
} from '../../api/actInfirmierApi';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const todayStr = () => new Date().toISOString().slice(0, 10);

// Thème bleu ciel (aligné interfaces infirmier)
const SKY = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
};

const EMPTY_FORM = {
  collaborateur: '',
  type_accident: '',
  date_accident: todayStr(),
  chauffeur: '',
  date_collecte_chauffeur: '',
  date_cachet_cnam: '',
  date_limite_declaration: '',
  cause_retard: '',
  commentaire: '',
  actions: '',
  correction: '',
};

const inp = {
  padding: '8px 11px',
  border: `1.5px solid ${SKY[200]}`,
  borderRadius: 7,
  fontSize: 13,
  color: '#111827',
  background: 'white',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const Field = ({ label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 10.5, fontWeight: 700, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.6px' }}>
      {label}{required && <span style={{ color: SKY[600] }}> *</span>}
    </label>
    {children}
  </div>
);

const retardBadgeStyle = (v) => {
  const n = Number(v || 0);
  if (n > 0) {
    return { background: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
  }
  return { background: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
};

function RetardBadge({ value }) {
  const s = retardBadgeStyle(value);
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: s.background, color: s.color, border: `1px solid ${s.border}` }}>
      {value ?? 0} j
    </span>
  );
}

function FormulaireDeclaration({ initial, onSaved, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [query, setQuery] = useState(initial?.nom_prenom ?? initial?.collaborateur_nom ?? '');
  const [selectedLabel, setSelectedLabel] = useState(initial?.nom_prenom ?? initial?.collaborateur_nom ?? '');
  const [results, setResults] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [collabInfo, setCollabInfo] = useState(initial ? {
    matricule: initial.matricule ?? initial.collaborateur_matricule ?? '',
    department: initial.department ?? initial.collaborateur_department ?? '',
    poste: initial.poste ?? initial.collaborateur_poste ?? '',
  } : null);
  const debRef = useRef(null);

  useEffect(() => {
    setForm({ ...EMPTY_FORM, ...initial });
    setQuery(initial?.nom_prenom ?? initial?.collaborateur_nom ?? '');
    setSelectedLabel(initial?.nom_prenom ?? initial?.collaborateur_nom ?? '');
    setCollabInfo(initial ? {
      matricule: initial.matricule ?? initial.collaborateur_matricule ?? '',
      department: initial.department ?? initial.collaborateur_department ?? '',
      poste: initial.poste ?? initial.collaborateur_poste ?? '',
    } : null);
    setError('');
  }, [initial]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSearch = (value) => {
    setQuery(value);
    setSelectedLabel('');
    set('collaborateur', '');
    clearTimeout(debRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setLoadingCollab(true);
    debRef.current = setTimeout(async () => {
      try {
        setResults(await searchCollaborateurs(value));
      } catch {
        setResults([]);
      } finally {
        setLoadingCollab(false);
      }
    }, 250);
  };

  const selectCollab = async (c) => {
    set('collaborateur', c.id);
    setQuery(`${c.nom} ${c.prenom}`);
    setSelectedLabel(`${c.nom} ${c.prenom} — ${c.matricule}`);
    setResults([]);
    try {
      const d = await getCollaborateurById(c.id);
      setCollabInfo({
        matricule: d.matricule ?? '',
        department: d.department ?? '',
        poste: d.poste ?? '',
      });
    } catch {
      setCollabInfo(null);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.collaborateur) return setError('Veuillez sélectionner un collaborateur.');
    if (!form.type_accident.trim()) return setError('Le type d accident est obligatoire.');
    if (!form.date_accident) return setError('La date accident est obligatoire.');

    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const saved = isEdit
        ? await modifierDeclarationCNAM(initial.id, payload)
        : await creerDeclarationCNAM(payload);
      onSaved(saved);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.detail || Object.values(d ?? {}).flat().join(' ') || 'Erreur lors de l enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRadius: '0 14px 14px 0' }}>
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${SKY[100]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: SKY[50] }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: SKY[900] }}>{isEdit ? 'Modifier la déclaration CNAM' : 'Nouvelle déclaration CNAM'}</div>
          <div style={{ fontSize: 11, color: SKY[700], marginTop: 2 }}>Champs obligatoires marqués *</div>
        </div>
        <button onClick={onClose} style={{ border: '1.5px solid #e5e7eb', background: 'white', color: '#475569', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Fermer</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 9, padding: '10px 14px', fontSize: 12.5 }}>
            {error}
          </div>
        )}

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.8px', paddingBottom: 7, marginBottom: 14, borderBottom: `2px solid ${SKY[100]}` }}>
            Identification
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Collaborateur" required>
                <input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Nom, prenom ou matricule" style={{ ...inp, borderColor: form.collaborateur ? SKY[600] : SKY[200] }} />
                {selectedLabel && <div style={{ fontSize: 11.5, color: SKY[700], marginTop: 4, fontWeight: 600 }}>→ {selectedLabel}</div>}
                {loadingCollab && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Recherche en cours…</div>}
                {results.length > 0 && (
                  <div style={{ border: `1.5px solid ${SKY[200]}`, borderRadius: 9, overflow: 'hidden', marginTop: 4 }}>
                    {results.slice(0, 5).map((c, idx) => (
                      <button
                        key={c.id}
                        onMouseDown={() => selectCollab(c)}
                        style={{ width: '100%', textAlign: 'left', padding: '9px 13px', border: 'none', borderTop: idx > 0 ? `1px solid ${SKY[50]}` : 'none', background: 'white', cursor: 'pointer', fontSize: 12.5, display: 'flex', justifyContent: 'space-between' }}
                      >
                        <span style={{ fontWeight: 600, color: '#111827' }}>{c.nom} {c.prenom}</span>
                        <span style={{ color: SKY[700], fontSize: 11.5, fontWeight: 600 }}>{c.matricule}</span>
                      </button>
                    ))}
                  </div>
                )}
              </Field>
              {collabInfo && (
                <div style={{ background: SKY[50], border: `1.5px solid ${SKY[200]}`, borderRadius: 10, padding: '11px 14px', marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[['Matricule', collabInfo.matricule], ['Poste', collabInfo.poste], ['Département', collabInfo.department]].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.5px' }}>{k}</div>
                      <div style={{ fontSize: 12.5, color: SKY[900], fontWeight: 600, marginTop: 2 }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Field label="Type accident" required><input value={form.type_accident} onChange={(e) => set('type_accident', e.target.value)} style={inp} /></Field>
            <Field label="Date accident" required><input type="date" value={form.date_accident} onChange={(e) => set('date_accident', e.target.value)} style={inp} /></Field>
            <Field label="Chauffeur"><input value={form.chauffeur} onChange={(e) => set('chauffeur', e.target.value)} style={inp} /></Field>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.8px', paddingBottom: 7, marginBottom: 14, borderBottom: `2px solid ${SKY[100]}` }}>
            Suivi déclaration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Date collecte chauffeur"><input type="date" value={form.date_collecte_chauffeur} onChange={(e) => set('date_collecte_chauffeur', e.target.value)} style={inp} /></Field>
            <Field label="Date cachet CNAM"><input type="date" value={form.date_cachet_cnam} onChange={(e) => set('date_cachet_cnam', e.target.value)} style={inp} /></Field>
            <Field label="Date limite déclaration"><input type="date" value={form.date_limite_declaration} onChange={(e) => set('date_limite_declaration', e.target.value)} style={inp} /></Field>
            <Field label="Cause retard"><input value={form.cause_retard} onChange={(e) => set('cause_retard', e.target.value)} style={inp} /></Field>
            <Field label="Commentaire"><textarea rows={3} value={form.commentaire} onChange={(e) => set('commentaire', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></Field>
            <Field label="Actions"><textarea rows={3} value={form.actions} onChange={(e) => set('actions', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></Field>
            <Field label="Correction"><textarea rows={3} value={form.correction} onChange={(e) => set('correction', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></Field>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 24px', borderTop: `1px solid ${SKY[100]}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: SKY[50] }}>
        <button onClick={onClose} style={{ border: '2px solid #64748b', background: 'white', color: '#64748b', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Annuler</button>
        <button onClick={handleSubmit} disabled={saving} style={{ border: 'none', background: `linear-gradient(135deg,${SKY[500]},${SKY[600]})`, color: 'white', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.65 : 1 }}>
          {saving ? 'Enregistrement…' : (isEdit ? 'Modifier' : 'Enregistrer')}
        </button>
      </div>
    </div>
  );
}

function DetailDeclaration({ item, onEdit, onDelete, onClose }) {
  const collab = item.nom_prenom || item.collaborateur_nom || '—';
  const matriculeCnss = item.matricule_cnss || item.collaborateur_matricule_cnss || '—';

  const readOnlyRow = (label, value) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRadius: '0 14px 14px 0' }}>
      <div style={{ padding: '18px 24px', background: `linear-gradient(135deg,${SKY[300]} 0%,${SKY[500]} 55%,${SKY[600]} 100%)`, borderRadius: '0 14px 0 0' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{collab}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,.82)' }}>{matriculeCnss}</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,.18)', color: 'white' }}>
            {item.type_accident || 'Type non renseigné'}
          </span>
          <RetardBadge value={item.nb_jours_retard} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.8px', paddingBottom: 7, marginBottom: 14, borderBottom: `2px solid ${SKY[100]}` }}>
            Identification
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {readOnlyRow('Collaborateur', collab)}
            {readOnlyRow('Type accident', item.type_accident)}
            {readOnlyRow('Date accident', fmtDate(item.date_accident))}
            {readOnlyRow('Chauffeur', item.chauffeur)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.8px', paddingBottom: 7, marginBottom: 14, borderBottom: `2px solid ${SKY[100]}` }}>
            Suivi déclaration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {readOnlyRow('Date collecte chauffeur', fmtDate(item.date_collecte_chauffeur))}
            {readOnlyRow('Date cachet CNAM', fmtDate(item.date_cachet_cnam))}
            {readOnlyRow('Date limite déclaration', fmtDate(item.date_limite_declaration))}
            {readOnlyRow('Cause retard', item.cause_retard)}
            {readOnlyRow('Commentaire', item.commentaire)}
            {readOnlyRow('Actions', item.actions)}
            {readOnlyRow('Correction', item.correction)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.8px', paddingBottom: 7, marginBottom: 14, borderBottom: `2px solid ${SKY[100]}` }}>
            Champs calculés (lecture seule)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {readOnlyRow('Matricule CNSS', matriculeCnss)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>Nb jours retard</span>
              <div><RetardBadge value={item.nb_jours_retard} /></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 24px', borderTop: `1px solid ${SKY[100]}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: SKY[50] }}>
        <button onClick={onClose} style={{ border: '2px solid #64748b', background: 'white', color: '#64748b', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Fermer</button>
        <button onClick={() => onDelete(item)} style={{ border: '2px solid #dc2626', background: 'white', color: '#dc2626', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Supprimer</button>
        <button onClick={() => onEdit(item)} style={{ border: 'none', background: `linear-gradient(135deg,${SKY[500]},${SKY[600]})`, color: 'white', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Modifier</button>
      </div>
    </div>
  );
}

export default function DeclarationCNAM() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [retardItems, setRetardItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [panel, setPanel] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s, retards] = await Promise.all([
        getDeclarationsCNAM(),
        getStatsDeclarationsCNAM(annee),
        getDeclarationsEnRetard(),
      ]);
      setItems(data);
      setStats(s);
      setRetardItems(retards);
    } catch {
      setItems([]);
      setRetardItems([]);
    } finally {
      setLoading(false);
    }
  }, [annee]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (i.nom_prenom || i.collaborateur_nom || '').toLowerCase().includes(q)
      || (i.matricule_cnss || '').toLowerCase().includes(q)
      || (i.type_accident || '').toLowerCase().includes(q)
    );
  });

  const openDetail = (it) => {
    setSelected(it);
    setPanel('detail');
  };

  const openNew = () => {
    setEditTarget(null);
    setPanel('form');
  };

  const openEdit = (it) => {
    setEditTarget(it);
    setPanel('form');
  };

  const closePanel = () => {
    setPanel(null);
    setSelected(null);
    setEditTarget(null);
  };

  const handleSaved = (saved) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === saved.id);
      return idx >= 0 ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
    });
    setSelected(saved);
    setPanel('detail');
    load();
  };

  const handleDelete = async (it) => {
    try {
      await supprimerDeclarationCNAM(it.id);
      setItems((prev) => prev.filter((x) => x.id !== it.id));
      if (selected?.id === it.id) closePanel();
      setConfirmDel(null);
      load();
    } catch {
      // no-op: UI remains unchanged if suppression fails
    }
  };

  const showPanel = panel !== null;

  return (
    <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: showPanel ? '0 0 580px' : '1', minWidth: 0 }}>
        {stats && !showPanel && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
            {[{ label: 'Total déclarations', value: stats.total, accent: '#b91c1c', bg: '#fef2f2' }, { label: 'En retard', value: retardItems.length, accent: '#c2410c', bg: '#fff7ed' }, { label: 'A temps', value: Math.max((stats.total ?? 0) - retardItems.length, 0), accent: '#166534', bg: '#f0fdf4' }, { label: 'Année', value: annee, accent: '#1d4ed8', bg: '#eff6ff' }].map((x) => (
              <div key={x.label} style={{ background: x.bg, borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(0,0,0,.05)' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{x.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: x.accent, marginTop: 4 }}>{x.value ?? '—'}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher collaborateur, matricule CNSS, type..." style={{ ...inp, borderRadius: 10 }} />
          <select value={annee} onChange={(e) => setAnnee(+e.target.value)} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openNew} style={{ border: 'none', background: `linear-gradient(135deg,${SKY[500]},${SKY[600]})`, color: 'white', borderRadius: 10, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Nouvelle déclaration</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', border: `1.5px solid ${SKY[100]}`, borderRadius: 12, background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: SKY[50], color: SKY[700] }}>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Collaborateur</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Matricule CNSS</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Date accident</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Date cachet CNAM</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Jours retard</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ padding: 22, color: '#94a3b8', textAlign: 'center' }}>Chargement...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 22, color: '#94a3b8', textAlign: 'center' }}>Aucune déclaration CNAM trouvée</td></tr>
              )}
              {!loading && filtered.map((i) => (
                <tr key={i.id} onClick={() => openDetail(i)} style={{ cursor: 'pointer', borderTop: `1px solid ${SKY[50]}`, background: selected?.id === i.id ? SKY[50] : 'white' }}>
                  <td style={{ padding: '10px 12px', color: '#111827', fontWeight: 600 }}>{i.nom_prenom || i.collaborateur_nom || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#111827' }}>{i.matricule_cnss || i.collaborateur_matricule_cnss || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#111827' }}>{i.type_accident || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#111827' }}>{fmtDate(i.date_accident)}</td>
                  <td style={{ padding: '10px 12px', color: '#111827' }}>{fmtDate(i.date_cachet_cnam)}</td>
                  <td style={{ padding: '10px 12px' }}><RetardBadge value={i.nb_jours_retard} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPanel && (
        <div style={{ flex: 1, minWidth: 0, border: `1.5px solid ${SKY[200]}`, borderRadius: '0 14px 14px 0', overflow: 'hidden', background: 'white' }}>
          {panel === 'detail' && selected && (
            <DetailDeclaration item={selected} onEdit={openEdit} onDelete={setConfirmDel} onClose={closePanel} />
          )}
          {panel === 'form' && (
            <FormulaireDeclaration initial={editTarget} onSaved={handleSaved} onClose={closePanel} />
          )}
        </div>
      )}

      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setConfirmDel(null)}>
          <div style={{ background: 'white', borderRadius: 16, padding: '26px 30px', maxWidth: 440, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: SKY[900], marginBottom: 8 }}>Supprimer cette déclaration CNAM ?</div>
            <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24, lineHeight: 1.55 }}>
              Vous allez supprimer la déclaration de <strong style={{ color: SKY[900] }}>{confirmDel.nom_prenom || confirmDel.collaborateur_nom}</strong>.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDel(null)} style={{ border: '2px solid #64748b', background: 'white', color: '#64748b', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Annuler</button>
              <button onClick={() => handleDelete(confirmDel)} style={{ border: 'none', background: '#dc2626', color: 'white', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
