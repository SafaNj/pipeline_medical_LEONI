import { useEffect, useState } from 'react';
import { creerOrdonnance, modifierOrdonnance, getFicheAptitude, getOrdonnancesParFiche } from '../../api/Medicalworkapi';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';
import PrintOrdonnanceSousse from './PrintOrdonnanceSousse';
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

function pickOrdonnance(fiche) {
  return fiche?.ordonnance || fiche?.ordonnances?.[0] || null;
}

function getDefaultForm(fiche, today) {
  const ex = pickOrdonnance(fiche);
  return {
    fiche_aptitude: fiche?.id,
    date_ordonnance: ex?.date_ordonnance || ex?.date || fiche?.date_visite || today,
    prescription: ex?.prescription || ex?.medicaments || ex?.contenu || ex?.description || '',
  };
}

function ordonnanceToForm(ordonnance, fiche, today) {
  const ex = ordonnance || {};
  return {
    fiche_aptitude: fiche?.id,
    date_ordonnance: ex.date_ordonnance || ex.date || fiche?.date_visite || today,
    prescription: ex.prescription || ex.medicaments || ex.contenu || ex.description || '',
  };
}

function buildOrdonnancePayloadVariants(form) {
  const ficheId = form?.fiche_aptitude;
  const date = form?.date_ordonnance;
  const txt = String(form?.prescription || '').trim();
  const variants = [
    { fiche_aptitude: ficheId, date_ordonnance: date, prescription: txt },
    { fiche_aptitude: ficheId, date_ordonnance: date, medicaments: txt },
    { fiche_aptitude: ficheId, date_ordonnance: date, contenu: txt },
    { fiche_aptitude: ficheId, date_ordonnance: date, description: txt },
    { fiche: ficheId, date_ordonnance: date, prescription: txt },
    { fiche: ficheId, date_ordonnance: date, medicaments: txt },
    { fiche: ficheId, date: date, prescription: txt },
    { fiche: ficheId, date: date, contenu: txt },
  ];
  const seen = new Set();
  return variants.filter((v) => {
    const k = JSON.stringify(v);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function saveOrdonnanceWithFallback(existingId, form) {
  const variants = buildOrdonnancePayloadVariants(form);
  let lastError = null;
  for (let i = 0; i < variants.length; i += 1) {
    const payload = variants[i];
    try {
      if (existingId) return await modifierOrdonnance(existingId, payload);
      return await creerOrdonnance(payload);
    } catch (e) {
      lastError = e;
      const status = e?.response?.status;
      if (status !== 400) throw e;
    }
  }
  throw lastError;
}

export default function TabOrdonnance({ fiche, onFicheUpdated }) {
  const today = new Date().toISOString().split('T')[0];
  const isSousseTemplate = resolveSiteTemplateFromSources(fiche, fiche?.site_details) === SITE_TEMPLATE_BRANCH.MESSADINE;
  const existing = pickOrdonnance(fiche);

  const [form, setForm] = useState(getDefaultForm(fiche, today));
  const [ordonnanceId, setOrdonnanceId] = useState(existing?.id || null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setForm(getDefaultForm(fiche, today));
    setOrdonnanceId(existing?.id || null);
    setError('');
    setSuccess('');

    async function hydrateOrdonnance() {
      if (!fiche?.id) return;
      try {
        const list = await getOrdonnancesParFiche(fiche.id);
        if (cancelled) return;
        const first = Array.isArray(list) ? list[0] : null;
        if (first?.id) {
          setOrdonnanceId(first.id);
          setForm(ordonnanceToForm(first, fiche, today));
        }
      } catch {
        // no-op
      }
    }

    hydrateOrdonnance();
    return () => {
      cancelled = true;
    };
  }, [fiche?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isSousseTemplate) return null;

  const handleSave = async () => {
    if (!String(form.prescription || '').trim()) {
      setError('La prescription est requise.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const saved = await saveOrdonnanceWithFallback(ordonnanceId, form);
      if (saved?.id) setOrdonnanceId(saved.id);

      setForm((prev) => ({
        ...prev,
        date_ordonnance: saved?.date_ordonnance || saved?.date || prev.date_ordonnance,
        prescription: saved?.prescription || saved?.medicaments || saved?.contenu || saved?.description || prev.prescription,
      }));

      try {
        const fresh = await getFicheAptitude(fiche.id);
        if (onFicheUpdated) onFicheUpdated(fresh);
      } catch {
        // no-op
      }

      setSuccess('Ordonnance enregistrée');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      const d = e?.response?.data;
      const msg =
        (typeof d === 'string' && d) ||
        d?.detail ||
        (d && typeof d === 'object' ? Object.values(d).flat().join(' ') : null) ||
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
          Ordonnance (FOR-AMT-09)
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
            Date
          </div>
          <input
            type="date"
            value={form.date_ordonnance || ''}
            onChange={(e) => setForm((f) => ({ ...f, date_ordonnance: e.target.value }))}
            style={inputSx}
          />
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
            Prescription
          </div>
          <textarea
            rows={10}
            value={form.prescription || ''}
            onChange={(e) => setForm((f) => ({ ...f, prescription: e.target.value }))}
            placeholder="Texte libre de prescription..."
            style={{ ...inputSx, resize: 'vertical' }}
          />
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#059669', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <PrintOrdonnanceSousse fiche={fiche} form={form} />
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
          {saving ? 'Enregistrement…' : (ordonnanceId ? "Modifier l'ordonnance" : "Enregistrer l'ordonnance")}
        </button>
      </div>
    </div>
  );
}
