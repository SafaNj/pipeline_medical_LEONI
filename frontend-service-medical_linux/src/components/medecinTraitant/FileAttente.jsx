// src/components/medecinTraitant/FileAttente.jsx

const getNom = (item) =>
  item.collaborateur_nom ||
  (item.collaborateur && typeof item.collaborateur === 'object'
    ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
    : `Patient #${item.collaborateur}`);

const getInitials = (nom) =>
  nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const sessLabel = (s) =>
  ({ MATIN: 'Matin', MIDI: 'Midi', APRES_MIDI: 'Après-midi' }[s] || s);

function PatientCard({ item, isSelected, onClick }) {
  const nom = getNom(item);
  const initials = getInitials(nom);
  const isWaiting = item.statut === 'EN_ATTENTE';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        borderRadius: 12,
        marginBottom: 8,
        cursor: 'pointer',
        border: `2px solid ${isSelected ? '#0284c7' : 'transparent'}`,
        background: isSelected ? '#e0f2fe' : 'white',
        boxShadow: isSelected
          ? '0 0 0 1px #4f46e5, 0 4px 12px rgba(2,132,199,.12)'
          : '0 1px 3px rgba(0,0,0,.06)',
        transition: 'all .15s',
        opacity: isWaiting ? 1 : 0.6,
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#7dd3fc';
          e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,.09)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Numéro d'ordre */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: isWaiting
            ? 'linear-gradient(135deg,#0ea5e9,#0284c7)'
            : '#e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isWaiting ? 'white' : '#94a3b8',
          fontSize: 11, fontWeight: 800,
        }}>
          {item.ordre ?? '—'}
        </div>

        {/* Avatar initiales */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: isWaiting
            ? 'linear-gradient(135deg,#0ea5e9,#0284c7)'
            : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isWaiting ? 'white' : '#94a3b8',
          fontSize: 13, fontWeight: 800,
        }}>
          {isWaiting ? initials : ''}
        </div>

        {/* Nom + infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 700,
            color: isSelected ? '#0369a1' : '#0c4a6e',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {nom}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
            {item.motif || sessLabel(item._liste?.session || item.session || '')}
          </div>
        </div>

        {/* Badge statut */}
        <span style={{
          flexShrink: 0,
          padding: '3px 8px', borderRadius: 20,
          fontSize: 10.5, fontWeight: 700,
          background: isWaiting ? '#fff7ed' : '#e0f2fe',
          color: isWaiting ? '#c2410c' : '#0369a1',
        }}>
          {isWaiting ? '' : ''}
        </span>
      </div>
    </div>
  );
}

export default function FileAttente({ items, selectedItemId, onSelect, loading }) {
  const enAttente = items.filter(i => i.statut === 'EN_ATTENTE');
  const effectues = items.filter(i => i.statut === 'EFFECTUEE');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: 'white', borderRadius: 16,
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: '1px solid #f1f5f9', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0c4a6e' }}>
            File d'attente
          </span>
          <span style={{
            fontSize: 11.5, fontWeight: 700,
            background: enAttente.length > 0 ? '#fff7ed' : '#e0f2fe',
            color: enAttente.length > 0 ? '#c2410c' : '#0369a1',
            padding: '3px 9px', borderRadius: 20,
          }}>
            {enAttente.length} en attente
          </span>
        </div>
      </div>

      {/* Liste scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>

        {/* Skeletons */}
        {loading && [1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: 68, borderRadius: 12, marginBottom: 8,
            background: 'linear-gradient(90deg,#eef2ff 25%,#dcfce7 50%,#eef2ff 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        ))}

        {/* Vide */}
        {!loading && items.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 16px',
            background: '#f8fafc', borderRadius: 12,
            border: '1.5px dashed #e2e8f0', marginTop: 8,
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}></div>
            <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>
              Aucun patient aujourd'hui
            </p>
            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
              L'infirmier doit créer et activer une liste
            </p>
          </div>
        )}

        {/* Patients EN_ATTENTE */}
        {!loading && enAttente.length > 0 && (
          <>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: 8, paddingLeft: 4,
            }}>
              À consulter
            </div>
            {enAttente.map(item => (
              <PatientCard
                key={item.id}
                item={item}
                isSelected={item.id === selectedItemId}
                onClick={() => onSelect(item)}
              />
            ))}
          </>
        )}

        {/* Séparateur + patients EFFECTUEE */}
        {!loading && effectues.length > 0 && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: '12px 0 8px', padding: '0 4px',
            }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                Consultés ({effectues.length})
              </span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            {effectues.map(item => (
              <PatientCard
                key={item.id}
                item={item}
                isSelected={item.id === selectedItemId}
                onClick={() => onSelect(item)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}