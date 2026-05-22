// src/components/common/EnteteMaladiesChroniques.jsx
// Bandeau maladies chroniques (API infirmier) pour les formulaires médicaux.
import { useEffect, useState } from 'react';
import { getMaladiesChroniques } from '../../api/actInfirmierApi';

const BADGE_COLORS = {
  Diabète: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Hypertension: { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  Asthme: { bg: '#f0f9ff', color: '#0c4a6e', border: '#bae6fd' },
  'Insuffisance rénale': { bg: '#e0f2fe', color: '#075985', border: '#7dd3fc' },
  Épilepsie: { bg: '#ecfeff', color: '#0e7490', border: '#67e8f9' },
  Autre: { bg: '#f8fafc', color: '#334155', border: '#cbd5e1' },
};

function badgeLabel(row) {
  if (row?.type_maladie === 'Autre' && String(row?.type_maladie_autre || '').trim()) {
    return String(row.type_maladie_autre).trim();
  }
  return row?.type_maladie || '—';
}

/** Extrait l’id collaborateur depuis un item de passage, une fiche, etc. */
export function resolveCollaborateurId(item) {
  if (!item || typeof item !== 'object') return null;
  const direct = item.collaborateur_id ?? item.collaborateurId;
  if (direct != null && String(direct).trim() !== '') return direct;
  const c = item.collaborateur;
  if (c == null || c === '') return null;
  if (typeof c === 'object') return c.id ?? c.pk ?? null;
  return c;
}

function fmtDateShort(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function EnteteMaladiesChroniques({ collaborateurId, style: styleProp }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const cid =
    collaborateurId != null && String(collaborateurId).trim() !== ''
      ? collaborateurId
      : null;

  useEffect(() => {
    if (cid == null) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMaladiesChroniques({ collaborateur: cid })
      .then((rows) => {
        if (cancelled) return;
        setItems(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cid]);

  if (cid == null) return null;

  const shell = {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #f9a8d4',
    background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)',
    boxSizing: 'border-box',
    ...styleProp,
  };

  return (
    <div style={shell}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#9d174d',
          textTransform: 'uppercase',
          letterSpacing: '0.55px',
          marginBottom: 6,
        }}
      >
        Maladies chroniques déclarées
      </div>
      {loading && (
        <div style={{ fontSize: 12.5, color: '#be185d', fontWeight: 600 }}>Chargement…</div>
      )}
      {!loading && items.length === 0 && (
        <div style={{ fontSize: 12.5, color: '#9f1239', fontWeight: 500, opacity: 0.92 }}>
          Aucune maladie chronique enregistrée pour ce collaborateur.
        </div>
      )}
      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {items.map((row) => {
            const type = row?.type_maladie || 'Autre';
            const col = BADGE_COLORS[type] || BADGE_COLORS.Autre;
            const label = badgeLabel(row);
            const short = label.length > 48 ? `${label.slice(0, 45)}…` : label;
            const title = [label, fmtDateShort(row?.date_declaration) && `Déclaré le ${fmtDateShort(row.date_declaration)}`]
              .filter(Boolean)
              .join(' — ');
            return (
              <span
                key={row.id ?? `${type}-${label}`}
                title={title}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: col.bg,
                  color: col.color,
                  border: `1px solid ${col.border}`,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {short}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
