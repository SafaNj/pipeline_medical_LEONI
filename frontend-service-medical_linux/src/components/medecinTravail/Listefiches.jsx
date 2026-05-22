// src/components/medecinTravail/ListeFiches.jsx
import AptitudeBadge from './Aptitudebadge';
import { getFicheCollaborateurNomComplet } from '../../utils/ficheCollaborateur';

const TYPE_LABEL = {
  EMBAUCHE:   "Embauche",
  PERIODIQUE: "Périodique",
  SURVEILLANCE_SPECIALE: "Surveillance SMS",
  REPRISE:    "Reprise",
  SPONTANEE:  "Spontanée",
};

const TYPE_COLOR = {
  EMBAUCHE:   { bg: '#e0e7ff', color: '#3730a3' },
  PERIODIQUE: { bg: '#dbeafe', color: '#1d4ed8' },
  REPRISE:    { bg: '#d1fae5', color: '#065f46' },
  SPONTANEE:  { bg: '#f1f5f9', color: '#475569' },
};

function getInitials(nom = '') {
  return nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#0ea5e9,#0284c7)',
  'linear-gradient(135deg,#38bdf8,#0369a1)',
  'linear-gradient(135deg,#7dd3fc,#0284c7)',
  'linear-gradient(135deg,#0284c7,#075985)',
  'linear-gradient(135deg,#0ea5e9,#0369a1)',
  'linear-gradient(135deg,#38bdf8,#0284c7)',
];

/** Aligné sur la sidebar — dégradé bleu ciel */
const LIST_ROW_BG = 'linear-gradient(168deg, #f5fbff 0%, #e8f4fc 48%, #def2fb 100%)';
const LIST_ROW_HOVER = 'linear-gradient(168deg, #eef9ff 0%, #dff0fa 52%, #d0ebf9 100%)';
const LIST_ROW_SELECTED = 'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 42%, #93d5fa 92%)';

export default function ListeFiches({ fiches, selected, onSelect, onNouvelle, periodeLabel = "aujourd'hui" }) {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div style={{
      width: 272, minWidth: 272, background: 'white',
      borderRadius: 15, border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(15,23,42,.06)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header — dégradé ciel clair */}
      <div style={{
        padding: '13px 15px 11px',
        background: 'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 55%, #7dd3fc 100%)',
        borderBottom: '1px solid #bae6fd',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -25, right: -25, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.25)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0c4a6e' }}>
            {fiches.length} fiche{fiches.length > 1 ? 's' : ''} · {periodeLabel}
          </div>
          <div style={{ fontSize: 10.5, color: '#0369a1', fontWeight: 500, marginTop: 1, textTransform: 'capitalize' }}>
            {today}
          </div>
        </div>
        <button onClick={onNouvelle} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '7px 14px', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white',
          border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 3px 10px rgba(2,132,199,.3)', transition: 'all .15s',
          position: 'relative',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0369a1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#0ea5e9,#0284c7)'; e.currentTarget.style.transform = 'none'; }}
        >
          + Nouvelle
        </button>
      </div>

      {/* Liste — cartes en dégradé bleu ciel (cohérent avec sidebar) */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 9, display: 'flex', flexDirection: 'column', gap: 6,
        background: 'linear-gradient(180deg, #f0f9ff 0%, #e8f4fc 100%)',
      }}>
        {fiches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            Aucune fiche aujourd'hui
          </div>
        )}
        {fiches.map((f, idx) => {
          const nom = getFicheCollaborateurNomComplet(f);
          const initials = getInitials(nom);
          const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const typeStyle = TYPE_COLOR[f.type_visite] || { bg: '#f1f5f9', color: '#475569' };
          const isSelected = selected?.id === f.id;

          return (
            <div key={f.id}
              onClick={() => onSelect(f)}
              style={{
                background: isSelected ? LIST_ROW_SELECTED : LIST_ROW_BG,
                borderRadius: 11, padding: '11px 12px',
                border: isSelected ? '1.5px solid #0284c7' : '1px solid rgba(125, 211, 252, 0.65)',
                cursor: 'pointer', transition: 'all .16s',
                boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.2)' : '0 1px 3px rgba(14, 165, 233, 0.08)',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#7dd3fc';
                  e.currentTarget.style.background = LIST_ROW_HOVER;
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(125, 211, 252, 0.65)';
                  e.currentTarget.style.background = LIST_ROW_BG;
                }
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: avatarBg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0c4a6e',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {nom}
                  </div>
                  <div style={{ fontSize: 10, color: '#0369a1', fontFamily: 'monospace', marginTop: 1, opacity: 0.85 }}>
                    {f.collaborateur_matricule || '—'}
                  </div>
                </div>
              </div>
              {/* Tags */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: typeStyle.bg, color: typeStyle.color,
                }}>
                  {TYPE_LABEL[f.type_visite] || f.type_visite}
                </span>
                <AptitudeBadge aptitude={f.aptitude} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}