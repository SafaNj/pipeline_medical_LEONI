// src/components/infirmier/DashboardStats.jsx

export default function DashboardStats({ stats, loading }) {
  const cards = [
    {
      key:   'total_listes',
      label: 'Listes du jour',
      color: '#2563eb',
      bg:    '#eff6ff',
      icon: (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <line x1="8" y1="6"  x2="21" y2="6"  />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3" cy="6"  r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      key:   'total_items_en_attente',
      label: 'En attente',
      color: '#d97706',
      bg:    '#fffbeb',
      icon: (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key:   'total_effectues',
      label: 'Effectués',
      color: '#16a34a',
      bg:    '#f0fdf4',
      icon: (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
          strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      key:   'total_annules',
      label: 'Annulés',
      color: '#dc2626',
      bg:    '#fef2f2',
      icon: (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6"  x2="6"  y2="18" />
          <line x1="6"  y1="6"  x2="18" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginBottom: 28,
    }}>
      {cards.map(card => (
        <div key={card.key} style={{
          background: 'white',
          borderRadius: 14,
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04)',
          border: '1px solid #f1f5f9',
        }}>
          {/* Icône */}
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: card.bg, color: card.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {card.icon}
          </div>

          {/* Valeur + label */}
          <div>
            {loading ? (
              <div style={{
                width: 40, height: 26, borderRadius: 6,
                background: '#f1f5f9', marginBottom: 4,
              }} />
            ) : (
              <div style={{
                fontSize: 28, fontWeight: 800, lineHeight: 1.1,
                color: card.color, letterSpacing: '-0.5px',
              }}>
                {stats?.[card.key] ?? '—'}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}