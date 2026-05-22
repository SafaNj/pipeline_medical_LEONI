import { useEffect, useState } from 'react';
import { creerFicheLiaison, modifierFicheLiaison, getFicheAptitude, getFichesLiaisonParFiche } from '../../api/Medicalworkapi';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';
import PrintFicheLiaisonSousse from './PrintFicheLiaisonSousse';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave, PRIMARY_ACTION_GRADIENT, PRIMARY_ACTION_SHADOW } from './primaryActionButtonStyle';

const inputSx = {
  width: '100%',
  padding: '9px 12px',
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: 9,
  fontSize: 13,
  color: '#0f172a',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

function ageFromDate(dateValue) {
  if (!dateValue) return '';
  const born = new Date(dateValue);
  if (Number.isNaN(born.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 ? String(age) : '';
}

function pickFicheLiaison(fiche) {
  return fiche?.fiche_liaison || fiche?.fiches_liaison?.[0] || null;
}

function getDefaultForm(fiche, today) {
  const ex = pickFicheLiaison(fiche);
  return {
    fiche_aptitude: fiche?.id,
    date_fiche: ex?.date_fiche || ex?.date || fiche?.date_visite || today,
    nom_patient: ex?.nom_patient || fiche?.collaborateur_nom || '',
    age: ex?.age || fiche?.collaborateur_age || ageFromDate(fiche?.collaborateur_date_naissance),
    employeur: ex?.employeur || fiche?.raison_sociale || '',
    matricule: ex?.matricule || fiche?.collaborateur_matricule || '',
    message: ex?.message || ex?.contenu || ex?.description || '',
  };
}

function ficheLiaisonToForm(ficheLiaison, fiche, today) {
  const ex = ficheLiaison || {};
  return {
    fiche_aptitude: fiche?.id,
    date_fiche: ex.date_fiche || ex.date || fiche?.date_visite || today,
    nom_patient: ex.nom_patient || fiche?.collaborateur_nom || '',
    age: ex.age || fiche?.collaborateur_age || ageFromDate(fiche?.collaborateur_date_naissance),
    employeur: ex.employeur || fiche?.raison_sociale || '',
    matricule: ex.matricule || fiche?.collaborateur_matricule || '',
    message: ex.message || ex.contenu || ex.description || '',
  };
}

function buildFicheLiaisonPayload(form, fiche, today) {
  const ficheId = form?.fiche_aptitude || fiche?.id;
  const date = form?.date_fiche || today;
  const txt = String(form?.message || '').trim();
  return {
    fiche_aptitude: ficheId,
    date_liaison: date,
    // kept for compatibility with existing serializers that still expose date_fiche
    date_fiche: date,
    nom_patient: String(form?.nom_patient || '').trim(),
    age: String(form?.age || '').trim(),
    employeur: String(form?.employeur || '').trim(),
    matricule: String(form?.matricule || '').trim(),
    contenu: txt,
    message: txt,
    description: txt,
  };
}

function ReadonlyField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ padding: '9px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#475569' }}>
        {value || '—'}
      </div>
    </div>
  );
}

export default function TabFicheLiaison({ fiche, onFicheUpdated }) {
  const today = new Date().toISOString().split('T')[0];
  const isSousseTemplate = resolveSiteTemplateFromSources(fiche, fiche?.site_details) === SITE_TEMPLATE_BRANCH.MESSADINE;
  const existing = pickFicheLiaison(fiche);

  const [form, setForm] = useState(getDefaultForm(fiche, today));
  const [ficheLiaisonId, setFicheLiaisonId] = useState(existing?.id || null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setForm(getDefaultForm(fiche, today));
    setFicheLiaisonId(existing?.id || null);
    setError('');
    setSuccess('');

    async function hydrateFicheLiaison() {
      if (!fiche?.id) return;
      try {
        const list = await getFichesLiaisonParFiche(fiche.id);
        if (cancelled) return;
        const first = Array.isArray(list) ? list[0] : null;
        if (first?.id) {
          setFicheLiaisonId(first.id);
          setForm(ficheLiaisonToForm(first, fiche, today));
        }
      } catch {
        // no-op
      }
    }

    hydrateFicheLiaison();
    return () => {
      cancelled = true;
    };
  }, [fiche?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isSousseTemplate) return null;

  const handleSave = async () => {
    if (!String(form.message || '').trim()) {
      setError('Le message est requis.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = buildFicheLiaisonPayload(form, fiche, today);
      const saved = ficheLiaisonId
        ? await modifierFicheLiaison(ficheLiaisonId, payload)
        : await creerFicheLiaison(payload);
      if (saved?.id) setFicheLiaisonId(saved.id);

      setForm((prev) => ({
        ...prev,
        date_fiche: saved?.date_fiche || saved?.date || prev.date_fiche,
        message: saved?.message || saved?.contenu || saved?.description || prev.message,
      }));

      try {
        const fresh = await getFicheAptitude(fiche.id);
        if (onFicheUpdated) onFicheUpdated(fresh);
      } catch {
        // no-op
      }

      setSuccess('Fiche de liaison enregistrée');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      const d = e?.response?.data;
      const objectMessage =
        d && typeof d === 'object'
          ? Object.entries(d)
              .map(([k, v]) => {
                const vv = Array.isArray(v) ? v.join(' ') : String(v);
                return `${k}: ${vv}`;
              })
              .join(' | ')
          : null;
      const msg =
        (typeof d === 'string' && d) ||
        d?.detail ||
        objectMessage ||
        "Erreur lors de l'enregistrement.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.8px', paddingBottom: 7, borderBottom: '1.5px solid #e2e8f0', marginBottom: 12 }}>
          Fiche de liaison (FOR-AMT-08)
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
            Date
          </div>
          <input
            type="date"
            value={form.date_fiche || ''}
            onChange={(e) => setForm((f) => ({ ...f, date_fiche: e.target.value }))}
            style={inputSx}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <ReadonlyField label="Nom patient" value={form.nom_patient} />
          <ReadonlyField label="Âge" value={form.age} />
          <ReadonlyField label="Employeur" value={form.employeur} />
          <ReadonlyField label="Matricule" value={form.matricule} />
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
            Message libre
          </div>
          <textarea
            rows={11}
            value={form.message || ''}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="Message destiné au confrère..."
            style={{ ...inputSx, resize: 'vertical' }}
          />
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#059669', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <PrintFicheLiaisonSousse fiche={fiche} form={form} />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            ...primaryActionButtonStyle(),
            background: saving ? '#94a3b8' : PRIMARY_ACTION_GRADIENT,
            boxShadow: saving ? 'none' : PRIMARY_ACTION_SHADOW,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={primaryActionBtnEnter}
          onMouseLeave={primaryActionBtnLeave}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {saving ? 'Enregistrement…' : (ficheLiaisonId ? 'Modifier la fiche de liaison' : 'Enregistrer la fiche de liaison')}
        </button>
      </div>
    </div>
  );
}
