// src/components/rh/AlerteVisitesPeriodiques.jsx
// NOTE: This file has been superseded — the component was renamed to CollaborateursSansVisite.jsx
// Keep file as a small compatibility wrapper that re-exports the renamed component.
import CollaborateursSansVisite from './CollaborateursSansVisite';

export default CollaborateursSansVisite;

const C = {
  primary: '#0284c7',
  border: '#bae6fd',
  light: '#e0f2fe',
  light2: '#f0f9ff',
  dark: '#0c4a6e',
  muted: '#64748b',
};

/** PK collaborateur : l'API alerte peut exposer id, collaborateur_id ou collaborateur. */
function pickCollaborateurPk(c) {
  if (c == null) return null;
  const v = c.collaborateur_id ?? c.collaborateur ?? c.id;
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  return Number.isNaN(n) ? null : n;
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : 'Jamais');

function MoisBadge({ mois }) {
  const bg = mois > 18 ? '#fef2f2' : '#fff7ed';
  const color = mois > 18 ? '#b91c1c' : '#c2410c';
  const bd = mois > 18 ? '#fecaca' : '#fed7aa';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 99,
        background: bg,
        color,
        border: `1px solid ${bd}`,
      }}
    >
      {mois} mois
    </span>
  );
}

// legacy wrapper: re-exported by './CollaborateursSansVisite'
