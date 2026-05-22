// src/components/medecinTravail/TabExamen.jsx
import { useState, useEffect } from 'react';
import PrintExamenRouter from './PrintExamenRouter';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { useAuth } from '../../context/AuthContext';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave, PRIMARY_ACTION_GRADIENT, PRIMARY_ACTION_SHADOW } from './primaryActionButtonStyle';
import { creerDemandeExamen, modifierDemandeExamen, getFicheAptitude } from '../../api/Medicalworkapi';

const EXAMENS = [
  { key: 'visiotest',   label: 'Visiotest',   desc: 'Examen de la vision' },
  { key: 'audiogramme', label: 'Audiogramme', desc: 'Test audiométrique' },
  { key: 'ecg',         label: 'ECG',         desc: 'Électrocardiogramme' },
  { key: 'efr',         label: 'EFR',         desc: 'Exploration fonctionnelle respiratoire' },
];

const IconExamen = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

function CheckCard({ label, desc, checked, onChange }) {
  return (
    <div onClick={onChange}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: checked ? '#eff6ff' : '#f8fafc',
        border: `1.5px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`,
        borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
        transition: 'all .14s', userSelect: 'none',
      }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.borderColor = '#cbd5e1'; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `1.5px solid ${checked ? '#3b82f6' : '#cbd5e1'}`,
        background: checked ? '#3b82f6' : 'white', transition: 'all .14s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && (
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: checked ? 700 : 600, color: checked ? '#0284c7' : '#334155' }}>
          {label}
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

const emptyForm = (ficheId, today) => ({
  fiche_aptitude: ficheId,
  date_demande: today,
  visiotest: false, audiogramme: false, ecg: false, efr: false,
  risque_physique: false,
  risque_chimique: false,
  risque_infectieux: false,
  risque_chauffeur: false,
  spirometrie: false,
  microfilm: false,
  renseignements_cliniques: '',
});

export default function TabExamen({ fiche, onFicheUpdated }) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const existing = fiche?.demandes_examen?.[0] || null;

  const [form, setForm] = useState(
    existing ? { ...emptyForm(fiche?.id, today), ...existing } : emptyForm(fiche?.id, today),
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
        const ex = fresh?.demandes_examen?.[0] || null;
        setForm(ex ? { ...emptyForm(fresh.id, today), ...ex } : emptyForm(fresh.id, today));
        if (onFicheUpdated) onFicheUpdated(fresh);
      } catch {
        if (cancelled) return;
        const ex = fiche?.demandes_examen?.[0] || null;
        setForm(ex ? { ...emptyForm(fiche?.id, today), ...ex } : emptyForm(fiche?.id, today));
      }
    };

    hydrate();
    setError('');
    setSuccess('');
    return () => { cancelled = true; };
  }, [fiche?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key) => setForm(f => ({ ...f, [key]: !f[key] }));
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const hasAny = EXAMENS.some(e => form[e.key]);
  const siteConfig = getSitePrintConfig(user, fiche);
  const templateBranch = resolveSiteTemplateFromSources(fiche, fiche?.site_details, user, siteConfig);
  const isMessadineTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE;
  const isMaturTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MATEUR;

  const handleSave = async () => {
    if (!hasAny) { setError('Sélectionnez au moins un examen.'); return; }
    setError(''); setSaving(true);
    try {
      if (existing?.id) {
        await modifierDemandeExamen(existing.id, form);
      } else {
        await creerDemandeExamen(form);
      }
      const fresh = await getFicheAptitude(fiche.id);
      if (onFicheUpdated) onFicheUpdated(fresh);
      const ex = fresh?.demandes_examen?.[0] || null;
      setForm(ex ? { ...emptyForm(fresh.id, today), ...ex } : emptyForm(fresh.id, today));
      setSuccess("Demande d'examen enregistrée");
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>

      {/* Examens */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle icon={IconExamen}>Examens complémentaires</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {EXAMENS.map(e => (
            <CheckCard key={e.key} label={e.label} desc={e.desc}
              checked={!!form[e.key]} onChange={() => toggle(e.key)} />
          ))}
        </div>
      </div>

      {/* Infos */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle icon={IconInfo}>Informations de la demande</SectionTitle>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
            Date de demande
          </div>
          <input type="date" value={form.date_demande}
            onChange={e => set('date_demande', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {existing?.numero_examen && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
              N° Examen (auto-généré)
            </div>
            <div style={{ padding: '8px 11px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12.5, color: '#0284c7', fontFamily: 'monospace', fontWeight: 700 }}>
              {existing.numero_examen}
            </div>
          </div>
        )}

        {!isMessadineTemplate && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5 }}>
              Renseignements cliniques
            </div>
            <textarea
              rows={4}
              value={form.renseignements_cliniques || ''}
              onChange={e => set('renseignements_cliniques', e.target.value)}
              placeholder="Motif de la demande, antécédents pertinents…"
              style={{
                width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

      </div>

      {isMessadineTemplate && (
        <div style={{ marginBottom: 20 }}>
          <SectionTitle icon={IconInfo}>Section Sousse</SectionTitle>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
              Risques
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              <CheckCard label="Physique" desc="Risque physique" checked={!!form.risque_physique} onChange={() => toggle('risque_physique')} />
              <CheckCard label="Chimique" desc="Risque chimique" checked={!!form.risque_chimique} onChange={() => toggle('risque_chimique')} />
              <CheckCard label="Infectieux" desc="Risque infectieux" checked={!!form.risque_infectieux} onChange={() => toggle('risque_infectieux')} />
              <CheckCard label="Chauffeur" desc="Poste de conduite" checked={!!form.risque_chauffeur} onChange={() => toggle('risque_chauffeur')} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
              Examens supplémentaires
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              <CheckCard label="Spirographie" desc="Spirométrie" checked={!!form.spirometrie} onChange={() => toggle('spirometrie')} />
              <CheckCard label="Microfilm" desc="Examen radiologique" checked={!!form.microfilm} onChange={() => toggle('microfilm')} />
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#059669', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <PrintExamenRouter fiche={fiche} form={form} />

        <button type="button" onClick={handleSave} disabled={saving} style={{
          ...primaryActionButtonStyle(),
          background: saving ? '#94a3b8' : PRIMARY_ACTION_GRADIENT,
          boxShadow: saving ? 'none' : PRIMARY_ACTION_SHADOW,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
          onMouseEnter={primaryActionBtnEnter}
          onMouseLeave={primaryActionBtnLeave}>
          <IconSave />
          {saving ? 'Enregistrement…' : (existing?.id ? 'Modifier la demande d\'examens' : 'Enregistrer la demande d\'examens')}
        </button>
      </div>

    </div>
  );
}