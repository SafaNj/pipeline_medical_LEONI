// src/components/medecinTravail/AptitudeBadge.jsx

const APTITUDE_CONFIG = {
  APTE_AU_POSTE: {
    label: 'Apte au poste',
    icon: '✓',
    bg: '#ecfdf5', color: '#059669', border: '#d1fae5',
  },
  APTE_AMENAGEMENT_POSTE: {
    label: 'Apte — Aménagement',
    icon: '⚠',
    bg: '#fffbeb', color: '#b45309', border: '#fde68a',
  },
  INAPTE_TEMPORAIRE: {
    label: 'Inapte temporaire',
    icon: '⏸',
    bg: '#fef2f2', color: '#dc2626', border: '#fecaca',
  },
  INAPTE_DEFINITIF_MEME_POSTE: {
    label: 'Inapte déf. (poste)',
    icon: '✕',
    bg: '#fef2f2', color: '#991b1b', border: '#fecaca',
  },
  INAPTE_DEFINITIF_ENTREPRISE: {
    label: 'Inapte déf. (entreprise)',
    icon: '✕',
    bg: '#fef2f2', color: '#7f1d1d', border: '#fecaca',
  },
};

export default function AptitudeBadge({ aptitude, size = 'sm' }) {
  const cfg = APTITUDE_CONFIG[aptitude] || {
    label: aptitude, icon: '?', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0',
  };

  const styles = {
    sm: { fontSize: 10.5, padding: '2px 8px', borderRadius: 20, fontWeight: 700 },
    md: { fontSize: 12.5, padding: '6px 14px', borderRadius: 30, fontWeight: 700 },
    lg: { fontSize: 13.5, padding: '9px 18px', borderRadius: 10, fontWeight: 700 },
  };

  return (
    <span style={{
      ...styles[size],
      background: cfg.bg,
      color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}