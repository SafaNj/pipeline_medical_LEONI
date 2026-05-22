import { useEffect, useState } from 'react';
import { creerConsultation, updateConsultation } from '../../api/consultationsApi';
import SiteSelectorModal from '../common/SiteSelectorModal';
import EnteteMaladiesChroniques, { resolveCollaborateurId } from '../common/EnteteMaladiesChroniques';
import { useAuth } from '../../context/AuthContext';

const normalizeSite = (site) => {
  if (!site) return null;
  return {
    id: site.id ?? site.site_id ?? site.pk ?? null,
    nom: site.nom ?? site.site_nom ?? site.name ?? site.siteName ?? '',
    nom_ar: site.nom_ar ?? site.site_nom_ar ?? site.name_ar ?? '',
    adresse: site.adresse ?? site.site_adresse ?? site.address ?? '',
    telephone: site.telephone ?? site.phone ?? site.site_telephone ?? '',
    raw: site,
  };
};

export default function CreerConsultation({ item, onCreated, onClose, mode = 'create', initialConsultation = null }) {
  const isEdit = mode === 'edit';
  const [diagnostic, setDiagnostic] = useState(initialConsultation?.diagnostic || '');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (selectedSite) return;
    // Pour le médecin du travail : site fixe dans le JWT
    if (user?.site_id && user?.site_nom) {
      setSelectedSite({ id: user.site_id, nom: user.site_nom, nom_ar: '', adresse: '', telephone: '' });
      return;
    }
    // Pour édition : site déjà enregistré dans la consultation
    const initialSite = initialConsultation?.site_details || initialConsultation?.site || item?.site;
    if (initialSite) {
      setSelectedSite(normalizeSite(initialSite));
    }
  }, [initialConsultation, item, user, selectedSite]);

  const nom = item.collaborateur_nom ||
    (item.collaborateur && typeof item.collaborateur === 'object'
      ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
      : `Collaborateur #${item.collaborateur}`);

  const initials = nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const collaborateurMcId = resolveCollaborateurId(item);

  const handleSubmit = async () => {
    if (!diagnostic.trim()) {
      setError('Le diagnostic est obligatoire.');
      return;
    }
    if (!selectedSite) {
      setError('Le site est obligatoire.');
      setShowSiteModal(true);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const consultation = isEdit
        ? await updateConsultation(initialConsultation.id, { diagnostic: diagnostic.trim(), site: selectedSite.id })
        : await creerConsultation({ item_passage: item.id, diagnostic: diagnostic.trim(), site: selectedSite.id });
      onCreated(consultation); // remonte la consultation créée
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
        data?.non_field_errors?.[0] ||
        Object.values(data ?? {}).flat().join(' ') ||
        'Erreur lors de la création.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(5px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 18,
          width: 500, maxWidth: '95vw',
          boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          animation: 'modalIn .2s ease',
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '22px 22px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 14,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                {isEdit ? 'Modifier la consultation' : 'Nouvelle consultation'}
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 1 }}>
                {nom} {item.motif && `— ${item.motif}`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, border: 'none',
              background: '#f1f5f9', borderRadius: 8,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#64748b',
            }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '0 22px 14px' }}>
          <EnteteMaladiesChroniques collaborateurId={collaborateurMcId} style={{ marginBottom: 0 }} />
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px' }}>
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#b91c1c', padding: '10px 14px',
              borderRadius: 10, fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #bae6fd',
            background: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
                Site de consultation
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {selectedSite?.nom || 'Cliquez pour sélectionner le site'}
              </div>
              {selectedSite?.adresse && (
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  {selectedSite.adresse}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSiteModal(true)}
              style={{
                padding: '9px 14px',
                border: '1px solid #0284c7',
                borderRadius: 10,
                background: 'white',
                color: '#0284c7',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              Sélectionner
            </button>
          </div>

          <label style={labelStyle}>Diagnostic *</label>
          <textarea
            value={diagnostic}
            onChange={e => setDiagnostic(e.target.value)}
            placeholder="Saisissez le diagnostic médical…"
            rows={5}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit',
              outline: 'none', color: '#0f172a', resize: 'vertical',
              boxSizing: 'border-box', lineHeight: 1.6,
              transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />

          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, fontSize: 12.5, color: '#15803d',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Le passage sera automatiquement marqué <strong>Effectué</strong> après la consultation.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px 22px',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px', background: 'white',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', color: '#475569',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !diagnostic.trim()}
            style={{
              padding: '10px 22px',
              background: diagnostic.trim() ? '#2563eb' : '#e2e8f0',
              color: diagnostic.trim() ? 'white' : '#94a3b8',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: (loading || !diagnostic.trim()) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
              transition: 'all .15s',
            }}
          >
            {loading ? 'Enregistrement…' : (isEdit ? '✓ Enregistrer les modifications' : '✓ Créer la consultation')}
          </button>
        </div>

        <SiteSelectorModal
          open={showSiteModal}
          initialSite={selectedSite}
          title="Sélection du site de consultation"
          confirmLabel="Fermer"
          onClose={() => setShowSiteModal(false)}
          onConfirm={(site) => {
            setSelectedSite(normalizeSite(site));
            setShowSiteModal(false);
            setError('');
          }}
        />
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#475569', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 8,
};