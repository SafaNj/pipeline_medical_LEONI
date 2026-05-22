
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—';

const sessLabel = (s) =>
  ({ MATIN: ' Matin', MIDI: ' Midi', APRES_MIDI: ' Après-midi' }[s] || s);

function StatusBadge({ statut }) {
  const cfg = {
    EN_PREPARATION: { bg: '#f1f5f9', color: '#475569', text: 'En préparation' },
    ACTIVE:         { bg: '#dbeafe', color: '#1d4ed8', text: 'Active'         },
    TERMINEE:       { bg: '#dcfce7', color: '#15803d', text: 'Terminée'       },
  }[statut] || { bg: '#f1f5f9', color: '#475569', text: statut };

  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
      padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {cfg.text}
    </span>
  );
}

function ListeCard({ liste, isSelected, onClick }) {
  const items      = liste.items || [];
  const total      = items.length;
  const enAttente  = items.filter(i => i.statut === 'EN_ATTENTE').length;
  const effectues  = items.filter(i => i.statut === 'EFFECTUEE').length;
  const pct        = total ? Math.round(effectues / total * 100) : 0;

  return (
    <div
      onClick={onClick}
      style={{
        background:   isSelected ? '#eff6ff' : 'white',
        borderRadius: 14,
        padding:      '14px 16px',
        border:       `2px solid ${isSelected ? '#2563eb' : 'transparent'}`,
        boxShadow:    '0 1px 3px rgba(0,0,0,.06)',
        cursor:       'pointer',
        transition:   'all .15s',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#bfdbfe';
          e.currentTarget.style.boxShadow   = '0 3px 12px rgba(0,0,0,.09)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.boxShadow   = '0 1px 3px rgba(0,0,0,.06)';
        }
      }}
    >
      {/* Type + statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{
          fontSize: 12, fontWeight: 700,
          background: '#eff6ff', color: '#1d4ed8',
          padding: '3px 9px', borderRadius: 7,
        }}>
          🩺 Consultation
        </span>
        <StatusBadge statut={liste.statut} />
      </div>

      {/* Date */}
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 5 }}>
        {fmtDate(liste.date)}
      </div>

      {/* Session + patients */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: '#94a3b8',
        marginBottom: enAttente > 0 ? 8 : 0,
      }}>
        <span>{sessLabel(liste.session)}</span>
        <span>{total} patient{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Compteur en attente */}
      {enAttente > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: '#fff7ed', color: '#c2410c',
          fontSize: 11.5, fontWeight: 700,
          padding: '3px 9px', borderRadius: 7, marginBottom: total > 0 ? 8 : 0,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#f97316', display: 'inline-block',
          }} />
          {enAttente} en attente
        </div>
      )}

      {/* Barre progression */}
      {total > 0 && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10.5, color: '#94a3b8', marginBottom: 4,
          }}>
            <span>{effectues} consulté{effectues !== 1 ? 's' : ''}</span>
            <span style={{ fontWeight: 700, color: pct === 100 ? '#16a34a' : '#475569' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width:      `${pct}%`,
              height:     '100%',
              borderRadius: 3,
              background: pct === 100 ? '#22c55e' : '#3b82f6',
              transition: 'width .4s',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListesDuJour({ listes, selectedId, onSelect, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12, flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
          Mes listes du jour
        </span>
        <span style={{
          fontSize: 11.5, color: '#3b82f6', fontWeight: 600,
          background: '#eff6ff', padding: '3px 9px', borderRadius: 7,
        }}>
          {listes.length} liste{listes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Contenu scrollable */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 10,
        paddingRight: 2,
      }}>

        {/* Skeletons */}
        {loading && [1, 2].map(i => (
          <div key={i} style={{
            height: 100, borderRadius: 14,
            background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        ))}

        {/* Vide */}
        {!loading && listes.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '36px 16px',
            background: 'white', borderRadius: 14,
            border: '1.5px dashed #e2e8f0',
          }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none"
              stroke="#cbd5e1" strokeWidth="1.4" strokeLinecap="round"
              style={{ display: 'block', margin: '0 auto' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="8" y1="9"  x2="16" y2="9"  />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="11" y2="17" />
            </svg>
            <p style={{ color: '#94a3b8', fontSize: 13.5, marginTop: 10 }}>
              Aucune liste aujourd'hui
            </p>
            <p style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>
              L'infirmier doit créer et activer une liste
            </p>
          </div>
        )}

        {/* Cartes */}
        {!loading && listes.map(l => (
          <ListeCard
            key={l.id}
            liste={l}
            isSelected={l.id === selectedId}
            onClick={() => onSelect(l)}
          />
        ))}
      </div>
    </div>
  );
}