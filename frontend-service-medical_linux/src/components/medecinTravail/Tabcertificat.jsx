// src/components/medecinTravail/TabCertificat.jsx
import PrintCertificatRouter from './PrintCertificatRouter';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave, PRIMARY_ACTION_GRADIENT, PRIMARY_ACTION_SHADOW } from './primaryActionButtonStyle';
import { useState, useEffect } from 'react';
import { creerCertificat, modifierCertificat, getFicheAptitude } from '../../api/Medicalworkapi';

const APTITUDE_LABEL = {
  APTE_AU_POSTE:               'Apte au poste',
  APTE_AMENAGEMENT_POSTE:      'Apte — Aménagement de poste',
  INAPTE_TEMPORAIRE:           'Inapte temporaire',
  INAPTE_DEFINITIF_MEME_POSTE: 'Inapte définitif (même poste)',
  INAPTE_DEFINITIF_ENTREPRISE: 'Inapte définitif (entreprise)',
};

const APTITUDE_CFG = {
  APTE_AU_POSTE:               { color: '#059669', bg: '#ecfdf5', border: '#d1fae5' },
  APTE_AMENAGEMENT_POSTE:      { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  INAPTE_TEMPORAIRE:           { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  INAPTE_DEFINITIF_MEME_POSTE: { color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
  INAPTE_DEFINITIF_ENTREPRISE: { color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
};

const IconCertificat = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const IconContenu = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconEmettre = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconInfo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 10, fontWeight: 800, color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '.8px',
      paddingBottom: 7, borderBottom: '1.5px solid #e2e8f0',
      marginBottom: 12,
    }}>
      {Icon && <Icon />}
      {children}
    </div>
  );
}

function InfoReadOnly({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px' }}>
        {label}
      </div>
      <div style={{
        padding: '8px 11px', background: '#f1f5f9', border: '1px solid #e2e8f0',
        borderRadius: 8, fontSize: 12, color: '#64748b', minHeight: 34,
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>
        {value || <span style={{ color: '#cbd5e1' }}>—</span>}
      </div>
    </div>
  );
}

const inputSx = {
  width: '100%', padding: '9px 12px', background: '#f8fafc',
  border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13,
  color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

export default function TabCertificat({ fiche, onFicheUpdated }) {
  const today = new Date().toISOString().split('T')[0];
  const existing = fiche?.certificat || null;

  const [form, setForm] = useState({
    fiche_aptitude: fiche?.id,
    date_emission:  existing?.date_emission || today,
    description:    existing?.description   || '',
  });

  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  // Réinitialiser le formulaire quand la fiche change
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!fiche?.id) {
        setForm({ fiche_aptitude: fiche?.id, date_emission: today, description: '' });
        return;
      }

      try {
        const fresh = await getFicheAptitude(fiche.id);
        if (cancelled) return;
        const ex = fresh?.certificat || null;
        setForm({
          fiche_aptitude: fresh?.id,
          date_emission:  ex?.date_emission || today,
          description:    ex?.description   || '',
        });
        if (onFicheUpdated) onFicheUpdated(fresh);
      } catch {
        if (cancelled) return;
        const ex = fiche?.certificat || null;
        setForm({
          fiche_aptitude: fiche?.id,
          date_emission:  ex?.date_emission || today,
          description:    ex?.description   || '',
        });
      }
    };

    hydrate();
    setError('');
    setSuccess('');
    return () => { cancelled = true; };
  }, [fiche?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cfg = APTITUDE_CFG[fiche?.aptitude] || { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };

  const handleSave = async () => {
    if (!form.description.trim()) { setError('La description est requise.'); return; }
    setError(''); setSaving(true);
    try {
      if (existing?.id) {
        await modifierCertificat(existing.id, form);
      } else {
        await creerCertificat(form);
      }
      const fresh = await getFicheAptitude(fiche.id);
      if (onFicheUpdated) onFicheUpdated(fresh);
      const ex = fresh?.certificat || null;
      setForm({
        fiche_aptitude: fresh?.id,
        date_emission:  ex?.date_emission || today,
        description:    ex?.description   || '',
      });
      setSuccess('Certificat enregistré');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      const d = e?.response?.data;
      setError(
        d && typeof d === 'object'
          ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
          : "Erreur lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>

      {/* Certificat d'aptitude */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle icon={IconCertificat}>Certificat d'aptitude</SectionTitle>

        <div style={{
          padding: '12px 16px', background: cfg.bg,
          border: `1.5px solid ${cfg.border}`, borderRadius: 11,
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>
              Résultat d'aptitude
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color }}>
              {APTITUDE_LABEL[fiche?.aptitude] || fiche?.aptitude || '—'}
            </div>
          </div>
          {existing?.id && (
            <div style={{ padding: '4px 10px', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#059669' }}>
              Certificat émis
            </div>
          )}
        </div>

        {/* Infos collaborateur */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <InfoReadOnly label="Collaborateur" value={fiche?.collaborateur_nom} />
          <InfoReadOnly label="Matricule"     value={fiche?.collaborateur_matricule} mono />
          <InfoReadOnly label="Poste"         value={fiche?.collaborateur_poste} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <InfoReadOnly label="CIN"            value={fiche?.collaborateur_cin} mono />
          <InfoReadOnly label="Date de visite" value={fiche?.date_visite ? new Date(fiche.date_visite).toLocaleDateString('fr-FR') : '—'} />
          <InfoReadOnly label="Médecin"        value={fiche?.medecin_nom} />
        </div>
      </div>

      {/* Formulaire certificat */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle icon={IconContenu}>Contenu du certificat</SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
              Date d'émission *
            </div>
            <input type="date" value={form.date_emission}
              onChange={e => set('date_emission', e.target.value)}
              style={inputSx} />
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
              N° Certificat (auto)
            </div>
            <div style={{ padding: '9px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: existing?.id ? '#0284c7' : '#cbd5e1', fontFamily: 'monospace', fontWeight: existing?.id ? 700 : 400 }}>
              {existing?.id ? `CERT-${existing.id.toString().padStart(4, '0')}` : 'Généré à la création'}
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
            Description / Observations *
          </div>
          <textarea rows={5} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder={`Ex : ${APTITUDE_LABEL[fiche?.aptitude] || 'Résultat'} — Aucune contre-indication médicale au poste de ${fiche?.collaborateur_poste || 'travail'}.`}
            style={{ ...inputSx, resize: 'vertical' }} />
        </div>

        <div style={{ marginTop: 10, padding: '9px 13px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 9, fontSize: 12, color: '#0369a1', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
          <IconInfo />
          <span>
            {existing?.id
              ? 'Ce certificat existe déjà. Vos modifications seront sauvegardées.'
              : "Un seul certificat peut être émis par fiche d'aptitude."}
          </span>
        </div>
      </div>

      {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#059669', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <PrintCertificatRouter fiche={fiche} form={form} />

        <button onClick={handleSave} disabled={saving} style={{
          ...primaryActionButtonStyle(),
          background: saving ? '#94a3b8' : PRIMARY_ACTION_GRADIENT,
          boxShadow: saving ? 'none' : PRIMARY_ACTION_SHADOW,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
          onMouseEnter={primaryActionBtnEnter}
          onMouseLeave={primaryActionBtnLeave}>
          {existing?.id ? <IconSave /> : <IconEmettre />}
          {saving ? 'Enregistrement…' : (existing?.id ? 'Modifier le certificat' : 'Émettre le certificat')}
        </button>
      </div>

    </div>
  );
}