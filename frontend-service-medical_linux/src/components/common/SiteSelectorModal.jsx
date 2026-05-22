import { useEffect, useMemo, useState } from 'react';
import { getSites } from '../../api/sitesApi';

const normalizeSite = (site) => ({
  id: site?.id ?? site?.site_id ?? site?.pk ?? null,
  nom: site?.nom ?? site?.site_nom ?? site?.name ?? site?.siteName ?? '',
  nom_ar: site?.nom_ar ?? site?.site_nom_ar ?? site?.name_ar ?? site?.siteNameAr ?? '',
  adresse: site?.adresse ?? site?.site_adresse ?? site?.address ?? site?.siteAddress ?? '',
  telephone: site?.telephone ?? site?.phone ?? site?.site_telephone ?? '',
  ville: site?.ville ?? site?.site_ville ?? '',
  raw: site,
});

export default function SiteSelectorModal({
  open,
  initialSite,
  title = 'Selection du site',
  onClose,
  onConfirm,
  confirmLabel = 'Fermer',
  loading = false,
}) {
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [error, setError] = useState('');

  const initialSiteId = useMemo(
    () => initialSite?.id ?? initialSite?.site_id ?? initialSite?.pk ?? null,
    [initialSite]
  );

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    const loadSites = async () => {
      setLoadingSites(true);
      setError('');
      try {
        const data = await getSites();
        if (cancelled) return;
        setSites((Array.isArray(data) ? data : []).map(normalizeSite));
      } catch (err) {
        if (cancelled) return;
        void err;
        setError('Impossible de charger la liste des sites.');
        setSites([]);
      } finally {
        if (!cancelled) setLoadingSites(false);
      }
    };

    loadSites();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const selectedInitialSite = initialSiteId != null
    ? sites.find((site) => String(site.id) === String(initialSiteId))
    : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 12000,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 430,
          maxWidth: '95vw',
          borderRadius: 14,
          background: 'white',
          boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{title}</div>
        </div>

        <div style={{ padding: 18 }}>
          {selectedInitialSite && (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0369a1', fontSize: 12.5, fontWeight: 700 }}>
              Site actuel: {selectedInitialSite.nom || '—'}
            </div>
          )}

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12.5,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: 10, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            Cliquez sur un site pour le sélectionner.
          </div>

          {loadingSites && (
            <div style={{ padding: '12px 10px', color: '#64748b', fontSize: 13 }}>
              Chargement des sites...
            </div>
          )}

          {!loadingSites && sites.length === 0 && (
            <div style={{ padding: '12px 10px', color: '#b91c1c', fontSize: 13 }}>
              Aucun site disponible.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {sites.map((site) => {
              const active = initialSiteId != null && String(site.id) === String(initialSiteId);
              return (
                <button
                  key={String(site.id)}
                  type="button"
                  onClick={() => onConfirm(site)}
                  style={{
                    textAlign: 'left',
                    borderRadius: 12,
                    border: active ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                    background: active ? '#f0f9ff' : 'white',
                    padding: '12px 12px 10px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 0 0 3px rgba(14,165,233,.08)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                    {site.nom || 'Site sans nom'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                    {site.nom_ar || ' '}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#0ea5e9', marginTop: 6, fontWeight: 700 }}>
                    {site.adresse || site.ville || 'Adresse non renseignée'}
                  </div>
                  {site.telephone && (
                    <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3 }}>
                      {site.telephone}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            padding: '12px 18px 16px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <button onClick={onClose} disabled={loading} style={cancelBtnStyle}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const cancelBtnStyle = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1.5px solid #cbd5e1',
  background: 'white',
  color: '#64748b',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
};
