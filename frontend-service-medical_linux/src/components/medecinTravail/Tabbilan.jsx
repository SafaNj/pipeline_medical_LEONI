// src/components/medecinTravail/TabBilan.jsx
import { useState, useEffect } from 'react';
import { creerDemandeBilan, modifierDemandeBilan, getFicheAptitude } from '../../api/Medicalworkapi';
import PrintBilanRouter from './PrintBilanRouter';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { useAuth } from '../../context/AuthContext';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave, PRIMARY_ACTION_GRADIENT, PRIMARY_ACTION_SHADOW } from './primaryActionButtonStyle';

const ANALYSES = [
  { key: 'glycemie',              label: 'Glycémie' },
  { key: 'creatinine',            label: 'Créatinine' },
  { key: 'nfs',                   label: 'NFS' },
  { key: 'vs',                    label: 'VS' },
  { key: 'transaminases',         label: 'Transaminases' },
  { key: 'acide_urique',          label: 'Acide urique' },
  { key: 'triglycerides',         label: 'Triglycérides' },
  { key: 'cholesterol',           label: 'Cholestérol' },
  { key: 'ldl_hdl_cholesterol',   label: 'LDL/HDL Cholestérol' },
  { key: 'copro_parasitologique', label: 'Copro parasitologique' },
];

const IconAnalyse = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4m0-5h6m0 0v5a2 2 0 0 0 2 2h2"/>
    <circle cx="16" cy="16" r="2"/>
  </svg>
);

const IconInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
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

function CheckItem({ label, checked, onChange }) {
  return (
    <div onClick={onChange}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        background: checked ? '#eff6ff' : '#f8fafc',
        border: `1.5px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`,
        borderRadius: 9, padding: '9px 12px', cursor: 'pointer', transition: 'all .14s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.borderColor = '#cbd5e1'; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, transition: 'all .14s',
        border: `1.5px solid ${checked ? '#3b82f6' : '#cbd5e1'}`,
        background: checked ? '#3b82f6' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && (
          <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: checked ? 700 : 500, color: checked ? '#0284c7' : '#64748b', transition: 'all .14s' }}>
        {label}
      </span>
    </div>
  );
}

const emptyForm = (ficheId, today) => ({
  fiche_aptitude: ficheId,
  date_demande: today,
  numero_labo: '',
  glycemie: false, creatinine: false, nfs: false, vs: false,
  transaminases: false, acide_urique: false, triglycerides: false,
  cholesterol: false, ldl_hdl_cholesterol: false, copro_parasitologique: false,
  // UI keeps a boolean checkbox `autre`; backend stores text in `autre_atcd`.
  autre_atcd: '',
  hta: false,
  anemie: false,
  hepatite: false,
  autre: false,
  diabete: false,
  dyslipidemie: false,
  goutte: false,
  anticoagulants_oui: false,
  anticoagulants_non: false,
  chimique: false,
  infectieux: false,
  chauffeur: false,
  travail_poste_nuit: false,
  autres_risques_autre: false,
  autres_risques: '',
  depistage: false,
  suivi_pathologies_chroniques: false,
  renseignements_cliniques: '',
});

const BILAN_API_KEYS = [
  'fiche_aptitude',
  'date_demande',
  'numero_labo',
  'glycemie',
  'creatinine',
  'nfs',
  'vs',
  'transaminases',
  'acide_urique',
  'triglycerides',
  'cholesterol',
  'ldl_hdl_cholesterol',
  'copro_parasitologique',
  'hta',
  'anemie',
  'hepatite',
  'autre',
  'autre_atcd',
  'diabete',
  'dyslipidemie',
  'goutte',
  'chimique',
  'infectieux',
  'chauffeur',
  'travail_poste_nuit',
  'autres_risques',
  'depistage',
  'suivi_pathologies_chroniques',
  'anticoagulants',
  'anticoagulants_oui',
  'anticoagulants_non',
  'renseignements_cliniques',
];

function buildBilanApiPayload(form) {
  const src = form || {};
  const out = {};
  BILAN_API_KEYS.forEach((k) => {
    if (src[k] !== undefined) out[k] = src[k];
  });

  // UI booleans -> single backend enum field
  if (src.anticoagulants_oui) {
    out.anticoagulants = 'OUI';
  } else if (src.anticoagulants_non) {
    out.anticoagulants = 'NON';
  } else {
    out.anticoagulants = '';
  }

  // UI checkbox -> backend CharField
  if (src.autre) {
    const t = String(src.autre_atcd || '').trim();
    // Permet de persister la case "Autre" même sans texte (Messadine).
    out.autre_atcd = t || 'OUI';
  } else {
    out.autre_atcd = '';
  }

  // UI checkbox + texte -> backend CharField
  out.autres_risques = src.autres_risques_autre
    ? String(src.autres_risques || '').trim()
    : '';

  delete out.autre;
  delete out.autres_risques_autre;
  delete out.anticoagulants_oui;
  delete out.anticoagulants_non;

  return out;
}

function hydrateFormFromApi(apiData, ficheId, today) {
  const base = emptyForm(ficheId, today);
  const d = apiData || {};
  const autresRisquesText = (typeof d.autres_risques === 'string' ? d.autres_risques : (d.autres_risques === true ? '' : (d.autres_risques || '')));
  return {
    ...base,
    ...d,
    // Reconvertir anticoagulants -> booleans UI
    anticoagulants_oui: d.anticoagulants === 'OUI',
    anticoagulants_non: d.anticoagulants === 'NON',
    // Reconvertir autre_atcd -> boolean UI (si texte OU "OUI")
    autre: !!(d.autre_atcd && String(d.autre_atcd).trim() !== ''),
    // autres_risques : si le backend renvoie bool, on ne peut pas reconstruire le texte ; sinon on garde le texte.
    autres_risques_autre: !!(typeof autresRisquesText === 'string' && autresRisquesText.trim() !== '') || d.autres_risques === true,
    autres_risques: typeof autresRisquesText === 'string' ? autresRisquesText : '',
  };
}

export default function TabBilan({ fiche, onFicheUpdated }) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const existing = fiche?.demandes_bilan?.[0] || null;

  const [form, setForm] = useState(
    existing ? hydrateFormFromApi(existing, fiche?.id, today) : emptyForm(fiche?.id, today)
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Réinitialiser le formulaire quand la fiche change (ex: navigation depuis NouvelleFiche)
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!fiche?.id) {
        setForm(emptyForm(fiche?.id, today));
        return;
      }

      try {
        const fresh = await getFicheAptitude(fiche.id);
        if (cancelled) return;
        const ex = fresh?.demandes_bilan?.[0] || null;
        setForm(ex ? hydrateFormFromApi(ex, fresh.id, today) : emptyForm(fresh.id, today));
        if (onFicheUpdated) onFicheUpdated(fresh);
      } catch {
        if (cancelled) return;
        const ex = fiche?.demandes_bilan?.[0] || null;
        setForm(ex ? hydrateFormFromApi(ex, fiche?.id, today) : emptyForm(fiche?.id, today));
      }
    };

    hydrate();
    setError('');
    setSuccess('');
    return () => { cancelled = true; };
  }, [fiche?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key) => setForm(f => ({ ...f, [key]: !f[key] }));
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const hasAnyCheck = ANALYSES.some(a => form[a.key]);
  const siteConfig = getSitePrintConfig(user, fiche);
  const templateBranch = resolveSiteTemplateFromSources(fiche, fiche?.site_details, user, siteConfig);
  const isMessadineTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE;
  const isMaturTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MATEUR;

  const handleSave = async () => {
    if (!hasAnyCheck) { setError('Sélectionnez au moins une analyse.'); return; }
    if (isMessadineTemplate && form.autres_risques_autre && !String(form.autres_risques || '').trim()) {
      setError('Veuillez renseigner la valeur de "Autres risques".');
      return;
    }
    setError(''); setSaving(true);
    try {
      const payload = buildBilanApiPayload(form);
      if (existing?.id) {
        await modifierDemandeBilan(existing.id, payload);
      } else {
        await creerDemandeBilan(payload);
      }
      const fresh = await getFicheAptitude(fiche.id);
      if (onFicheUpdated) onFicheUpdated(fresh);
      const ex = fresh?.demandes_bilan?.[0] || null;
      setForm(ex ? hydrateFormFromApi(ex, fresh.id, today) : emptyForm(fresh.id, today));
      setSuccess('Demande de bilan enregistrée');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      const d = e?.response?.data;
      const msg =
        (typeof d === 'string' && d) ||
        d?.detail ||
        (d && typeof d === 'object' ? JSON.stringify(d) : null) ||
        "Erreur lors de l'enregistrement.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>

      {/* Analyses */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle icon={IconAnalyse}>Analyses à prescrire</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
          {ANALYSES.map(a => (
            <CheckItem key={a.key} label={a.label} checked={!!form[a.key]} onChange={() => toggle(a.key)} />
          ))}
        </div>
      </div>

      {/* Infos bilan */}
      {!isMessadineTemplate && (
        <div style={{ marginBottom: 20 }}>
          <SectionTitle icon={IconInfo}>Informations de la demande</SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
                Date de demande
              </div>
              <input type="date" value={form.date_demande}
                onChange={e => set('date_demande', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
                N° Laboratoire
              </div>
              <input type="text" value={form.numero_labo} placeholder="LAB-2026-xxx"
                onChange={e => set('numero_labo', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>CIN (auto)</div>
              <div style={{ padding: '8px 11px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                {fiche?.collaborateur_cin || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>Téléphone</div>
              <div style={{ padding: '8px 11px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                {fiche?.collaborateur_telephone || '—'}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
              Renseignements cliniques
            </div>
            <textarea rows={3} value={form.renseignements_cliniques}
              onChange={e => set('renseignements_cliniques', e.target.value)}
              placeholder="Motif de la demande, antécédents pertinents…"
              style={{ width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
        </div>
      )}

      {isMessadineTemplate && (
        <div style={{ marginBottom: 20 }}>
          <SectionTitle icon={IconInfo}>Section Sousse</SectionTitle>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
              ATCD médicaux
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
              <CheckItem label="HTA" checked={!!form.hta} onChange={() => toggle('hta')} />
              <CheckItem label="Anémie" checked={!!form.anemie} onChange={() => toggle('anemie')} />
              <CheckItem label="Hépatite" checked={!!form.hepatite} onChange={() => toggle('hepatite')} />
              <CheckItem label="Diabète" checked={!!form.diabete} onChange={() => toggle('diabete')} />
              <CheckItem label="Dyslipidémie" checked={!!form.dyslipidemie} onChange={() => toggle('dyslipidemie')} />
              <CheckItem label="Goutte" checked={!!form.goutte} onChange={() => toggle('goutte')} />
              <CheckItem
                label="Autre"
                checked={!!form.autre}
                onChange={() => setForm((f) => ({ ...f, autre: !f.autre, autre_atcd: f.autre ? '' : f.autre_atcd }))}
              />
            </div>
            {form.autre && (
              <input
                type="text"
                value={form.autre_atcd || ''}
                onChange={(e) => set('autre_atcd', e.target.value)}
                placeholder="Préciser l'ATCD autre..."
                style={{
                  marginTop: 8,
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
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
              Prise de médicaments anticoagulants
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, maxWidth: 320 }}>
              <CheckItem
                label="Oui"
                checked={!!form.anticoagulants_oui}
                onChange={() => setForm((f) => ({ ...f, anticoagulants_oui: !f.anticoagulants_oui, anticoagulants_non: false }))}
              />
              <CheckItem
                label="Non"
                checked={!!form.anticoagulants_non}
                onChange={() => setForm((f) => ({ ...f, anticoagulants_non: !f.anticoagulants_non, anticoagulants_oui: false }))}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
              Raison de la demande
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 8 }}>
              <CheckItem label="Chimique" checked={!!form.chimique} onChange={() => toggle('chimique')} />
              <CheckItem label="Infectieux" checked={!!form.infectieux} onChange={() => toggle('infectieux')} />
              <CheckItem label="Chauffeur" checked={!!form.chauffeur} onChange={() => toggle('chauffeur')} />
              <CheckItem label="Travail posté / Nuit" checked={!!form.travail_poste_nuit} onChange={() => toggle('travail_poste_nuit')} />
              <CheckItem label="Dépistage" checked={!!form.depistage} onChange={() => toggle('depistage')} />
              <CheckItem label="Suivi pathologies chroniques" checked={!!form.suivi_pathologies_chroniques} onChange={() => toggle('suivi_pathologies_chroniques')} />
              <CheckItem
                label="Autres risques"
                checked={!!form.autres_risques_autre}
                onChange={() => setForm((f) => ({ ...f, autres_risques_autre: !f.autres_risques_autre, autres_risques: f.autres_risques_autre ? '' : f.autres_risques }))}
              />
            </div>
            {form.autres_risques_autre && (
              <input
                type="text"
                value={form.autres_risques || ''}
                onChange={(e) => set('autres_risques', e.target.value)}
                placeholder="Préciser autre(s) risque(s)..."
                style={{ width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Feedback */}
      {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#059669', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <PrintBilanRouter
          fiche={fiche}
          form={form}
          label={isMessadineTemplate ? 'Imprimer analyses biologiques' : 'Imprimer demande bilan'}
          title={isMessadineTemplate ? 'Imprimer analyses biologiques' : 'Imprimer demande bilan'}
        />

        <button onClick={handleSave} disabled={saving} style={{
          ...primaryActionButtonStyle(),
          background: saving ? '#94a3b8' : PRIMARY_ACTION_GRADIENT,
          boxShadow: saving ? 'none' : PRIMARY_ACTION_SHADOW,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
          onMouseEnter={primaryActionBtnEnter}
          onMouseLeave={primaryActionBtnLeave}>
          <IconSave />
          {saving ? 'Enregistrement…' : (existing?.id ? 'Modifier le bilan' : 'Enregistrer le bilan')}
        </button>
      </div>

    </div>
  );
}