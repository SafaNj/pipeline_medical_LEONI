import { isSmsJourJEnvoye, isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';

export function SmsVeilleBadge({ liste }) {
  if (!isSmsVeilleEnvoye(liste)) return <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 99,
        background: '#ecfdf5',
        color: '#15803d',
        border: '1px solid #bbf7d0',
        whiteSpace: 'nowrap',
      }}
      title="Rappel SMS veille (J−1) enregistré côté serveur"
    >
      SMS veille ✓
    </span>
  );
}

export function SmsLigneBadge({ ligne }) {
  if (!isSmsJourJEnvoye(ligne)) return <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 99,
        background: '#eff6ff',
        color: '#0369a1',
        border: '1px solid #bae6fd',
        whiteSpace: 'nowrap',
      }}
      title="SMS jour J / file — confirmé par le serveur (support)"
    >
      SMS ✓
    </span>
  );
}
