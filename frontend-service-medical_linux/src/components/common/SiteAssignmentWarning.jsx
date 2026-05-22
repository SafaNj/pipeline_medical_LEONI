import { getUserSiteId } from '../../utils/siteAccessControl';

const SiteAssignmentWarning = () => {
  const siteId = getUserSiteId();
  const hasSite = siteId !== null && siteId !== undefined && String(siteId).trim() !== '';

  if (hasSite) {
    return null;
  }

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1px solid #fbbf24',
        borderLeft: '4px solid #f59e0b',
        color: '#92400e',
        borderRadius: '12px',
        padding: '14px 16px',
        margin: '0 0 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,.04)',
        fontSize: '13px',
        lineHeight: 1.5,
        fontWeight: 600,
      }}
      role="alert"
      aria-live="polite"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span>Votre compte n'est pas encore assigné à un site, contactez l'administrateur.</span>
    </div>
  );
};

export default SiteAssignmentWarning;