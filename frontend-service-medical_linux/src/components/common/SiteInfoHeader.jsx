/**
 * 📍 SITE INFO HEADER COMPONENT
 * Displays current site and user information in a prominent banner
 */
import { getUserSiteId, getUserSiteName } from '../../utils/siteAccessControl';

const SiteInfoHeader = () => {
  const siteId = getUserSiteId();
  const siteName = getUserSiteName();

  // If user is not logged in, don't show header
  if (!siteId || !siteName) {
    return null;
  }

  return (
    <div
      className="site-info-header"
      style={{
        backgroundColor: '#065f46',
        color: '#fff',
        padding: '10px 16px',
        borderBottom: '3px solid #10b981',
        fontSize: '13px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Location Pin Icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        style={{ flexShrink: 0 }}
      >
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z" />
        <circle cx="12" cy="10" r="2.5" fill="currentColor" />
      </svg>

      {/* Site Info Text */}
      <span>
        <strong>Site actuel:</strong> {siteName}
        <span style={{ opacity: 0.7, marginLeft: '8px' }}>
          (ID: {siteId})
        </span>
      </span>

      {/* Lock Icon (indicating no site switching) */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        style={{ marginLeft: 'auto', opacity: 0.7 }}
        title="Vous ne pouvez pas changer de site"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
  );
};

export default SiteInfoHeader;
