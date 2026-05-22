import { useState, useEffect, useCallback } from 'react';
import { exportMedecinsActivite } from '../../api/hseeExportApi';
import { getMedecinsDisponibles } from '../../api/actInfirmierApi';
import { getMedecinsTravail } from '../../api/embaucheApi';

/** Options normalisées pour le select : { id, label } */
async function fetchMedecinOptions(typeMedecin) {
  const byId = new Map();

  const add = (id, label) => {
    if (id == null || id === '') return;
    const k = String(id);
    const t = String(label || '').trim() || `Médecin #${k}`;
    if (!byId.has(k)) byId.set(k, t);
  };

  if (typeMedecin === 'travail') {
    const raw = await getMedecinsTravail();
    const list = Array.isArray(raw) ? raw : [];
    list.forEach((m) =>
      add(m.id, m.nom_complet ? `Dr. ${m.nom_complet}${m.specialite ? ` — ${m.specialite}` : ''}` : null),
    );
    return Array.from(byId.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  }

  if (typeMedecin === 'traitant') {
    const list = await getMedecinsDisponibles('CONSULTATION');
    const arr = Array.isArray(list) ? list : [];
    arr.forEach((m) => add(m.id, m.nom_complet || m.username));
    return Array.from(byId.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  }

  if (typeMedecin === 'controleur') {
    const list = await getMedecinsDisponibles('CONTRE_VISITE');
    const arr = Array.isArray(list) ? list : [];
    arr.forEach((m) => add(m.id, m.nom_complet || m.username));
    return Array.from(byId.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  }

  // cas 'tous' (typeMedecin === '') : pas de liste individuelle
  return [];
}

const P = {
  blue900: '#0c4a6e',
  blue700: '#0369a1',
  blue600: '#0284c7',
  blue500: '#0ea5e9',
  blue50:  '#f0f9ff',
  red:     '#ef4444',
  redBg:   '#fef2f2',
  green:   '#22c55e',
  greenBg: '#f0fdf4',
  text:    '#0f172a',
  text2:   '#334155',
  muted:   '#94a3b8',
  border:  '#e2e8f0',
  white:   '#ffffff',
};

function pad2(n) { return String(n).padStart(2, '0'); }
function firstOfMonth(y, m) { return `${y}-${pad2(m)}-01`; }
function lastOfMonth(y, m) {
  const d = new Date(y, m, 0);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fileNameFromContentDisposition(header) {
  if (!header || typeof header !== 'string') return null;
  const star = /filename\*=UTF-8''([^;\n]+)/i.exec(header);
  if (star) return decodeURIComponent(star[1].trim());
  const fn = /filename="([^"]+)"/i.exec(header);
  if (fn) return fn[1];
  const fn2 = /filename=([^;\n]+)/i.exec(header);
  if (fn2) return fn2[1].trim().replace(/^"|"$/g, '');
  return null;
}

async function blobErrorMessage(blob) {
  try {
    const t = await blob.text();
    try { const j = JSON.parse(t); return j.detail || j.error || j.message || t; }
    catch { return t || 'Erreur serveur.'; }
  } catch { return 'Erreur serveur.'; }
}

// ─── Options du type de médecin ────────────────────────────────────────────
// value '' = "tous" → backend reçoit type_medecin absent → génère 5 onglets
const TYPES_MEDECIN = [
  { value: '',           label: '— Tous les médecins —' },
  { value: 'traitant',   label: 'Médecin traitant' },
  { value: 'travail',    label: 'Médecin du travail' },
  { value: 'controleur', label: 'Médecin contrôleur' },
];

export default function VueExtractionMedecins({ mois, annee }) {
  const [dateDebut, setDateDebut]           = useState(() => firstOfMonth(annee, mois));
  const [dateFin, setDateFin]               = useState(() => lastOfMonth(annee, mois));
  const [typeMedecin, setTypeMedecin]       = useState('');   // '' = tous par défaut
  const [medecinId, setMedecinId]           = useState('');
  const [medecinOptions, setMedecinOptions] = useState([]);
  const [loadMedecins, setLoadMedecins]     = useState(false);
  const [medecinsListErr, setMedecinsListErr] = useState(null);
  const [busy, setBusy]                     = useState(false);
  const [feedback, setFeedback]             = useState(null);

  // Le picker médecin individuel n'a de sens que pour un rôle précis
  const showMedecinPicker = typeMedecin !== '';

  useEffect(() => {
    setDateDebut(firstOfMonth(annee, mois));
    setDateFin(lastOfMonth(annee, mois));
  }, [mois, annee]);

  const loadOptions = useCallback(async () => {
    if (!showMedecinPicker) {
      setMedecinOptions([]);
      setMedecinsListErr(null);
      return;
    }
    setMedecinsListErr(null);
    setLoadMedecins(true);
    try {
      const opts = await fetchMedecinOptions(typeMedecin);
      setMedecinOptions(opts);
    } catch {
      setMedecinOptions([]);
      setMedecinsListErr(
        'Impossible de charger la liste des médecins. Vérifiez la connexion ou les droits HSEE sur les APIs infirmier / embauche.',
      );
    } finally {
      setLoadMedecins(false);
    }
  }, [typeMedecin, showMedecinPicker]);

  useEffect(() => {
    setMedecinId('');
    void loadOptions();
  }, [loadOptions]);

  const handleDownload = async () => {
    setFeedback(null);
    if (!dateDebut || !dateFin) {
      setFeedback({ type: 'error', text: 'Indiquez une date de début et une date de fin.' });
      return;
    }
    if (dateDebut > dateFin) {
      setFeedback({ type: 'error', text: 'La date de début doit être antérieure ou égale à la date de fin.' });
      return;
    }
    // typeMedecin vide = "tous" → valide ; sinon vérifier la valeur
    if (typeMedecin !== '' && !['traitant', 'travail', 'controleur'].includes(typeMedecin)) {
      setFeedback({ type: 'error', text: 'Type de médecin non reconnu.' });
      return;
    }

    setBusy(true);
    try {
      const res = await exportMedecinsActivite({
        date_debut:   dateDebut,
        date_fin:     dateFin,
        type_medecin: typeMedecin,      // '' → backend interprète comme "tous"
        medecin_id:   medecinId.trim(),
      });

      const blob = res.data;
      const cd   = res.headers?.['content-disposition'];
      let name   = fileNameFromContentDisposition(cd);
      const suffix = typeMedecin || 'Tous';
      if (!name || !/\.xlsx$/i.test(name)) {
        name = `HSEE_Export_${suffix}_${dateDebut}_${dateFin}.xlsx`;
      }

      const url = window.URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);

      setFeedback({ type: 'success', text: 'Fichier téléchargé.' });
    } catch (e) {
      const st   = e?.response?.status;
      const data = e?.response?.data;
      let text   = "Impossible de générer l'export.";
      if (st === 403) text = 'Accès refusé.';
      else if (st === 401) text = 'Session expirée.';
      else if (data instanceof Blob) { text = await blobErrorMessage(data); }
      else if (typeof data?.detail === 'string') { text = data.detail; }
      setFeedback({ type: 'error', text: typeof text === 'string' ? text : 'Erreur inconnue.' });
    } finally {
      setBusy(false);
    }
  };

  const inp = {
    width: '100%', padding: '10px 14px',
    border: `1.5px solid ${P.border}`, borderRadius: 9,
    fontSize: 13.5, outline: 'none', color: P.text,
    background: P.white, boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, color: P.muted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7,
  };

  return (
    <div style={{ maxWidth: 560 }}>

      <div style={{
        background: P.white, border: `1px solid ${P.border}`,
        borderRadius: 14, padding: '20px 22px',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: P.blue900, marginBottom: 18 }}>
          Paramètres d'extraction
        </div>

        {/* ── Dates ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Date début *</label>
            <input type="date" style={inp} value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Date fin *</label>
            <input type="date" style={inp} value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
          </div>
        </div>

        {/* ── Type de médecin ── */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Type de médecin *</label>
          <select style={inp} value={typeMedecin} onChange={(e) => setTypeMedecin(e.target.value)}>
            {TYPES_MEDECIN.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>
            {typeMedecin === ''
              ? 'Le fichier contiendra un onglet dédié par rôle, chacun avec ses colonnes propres.'
              : 'Le fichier généré ne contient que les actes de ce type avec la structure Excel prévue pour ce périmètre.'}
          </div>
        </div>

        {/* ── Médecin individuel — masqué si "tous" sélectionné ── */}
        {showMedecinPicker && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Médecin (optionnel)</label>
            {loadMedecins ? (
              <div style={{ ...inp, color: P.muted, fontSize: 13 }}>Chargement de la liste…</div>
            ) : (
              <select style={inp} value={medecinId} onChange={(e) => setMedecinId(e.target.value)}>
                <option value="">— Tous les médecins de ce type —</option>
                {medecinOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            )}
            {medecinsListErr && (
              <div style={{ fontSize: 12, color: P.red, marginTop: 8, lineHeight: 1.45 }}>{medecinsListErr}</div>
            )}
            <div style={{ fontSize: 11, color: P.muted, marginTop: 5 }}>
              Liste issue des APIs existantes (pointages / embauche / listes). Si un rôle HSEE n'y a pas accès,
              ajoutez un endpoint dédié côté backend (ex.{' '}
              <code style={{ fontSize: 10 }}>GET /api/hsee/medecins-export/</code>).
            </div>
          </div>
        )}

        {/* ── Feedback ── */}
        {feedback && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            background: feedback.type === 'success' ? P.greenBg : P.redBg,
            color:      feedback.type === 'success' ? P.green   : P.red,
            borderLeft: `3px solid ${feedback.type === 'success' ? P.green : P.red}`,
          }}>
            {feedback.text}
          </div>
        )}

        {/* ── Bouton ── */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          style={{
            width: '100%', padding: '12px 18px', borderRadius: 9, border: 'none',
            background: busy ? P.border : `linear-gradient(135deg,${P.blue600},${P.blue500})`,
            color: busy ? P.muted : 'white', fontWeight: 700, fontSize: 14,
            cursor: busy ? 'wait' : 'pointer',
            boxShadow: busy ? 'none' : `0 4px 14px ${P.blue500}44`,
            fontFamily: 'inherit',
          }}
        >
          {busy ? 'Génération en cours…' : "Télécharger l'Excel (.xlsx)"}
        </button>
      </div>
    </div>
  );
}
