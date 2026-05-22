// src/components/rh/CollaborateursSansVisite.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCollaborateursSansVisitePeriodique } from '../../api/Medicalworkapi';
import { getVpAlertHorizonJours } from '../../constants/vpAlertsRh';
import { RH_VP_EXAM_PERIODIQUE_TERMINE } from '../../utils/vpAlertsRhFilter';
import { creerListeVisitePeriodiqueEtSoumettre } from '../../api/visitesPeriodiquesApi';
import { afficherReferenceListeVisitePeriodique } from '../../utils/referenceListeVisitePeriodique';
import { formatAxiosError } from '../../api/apiErrorUtils';

const C = {
  primary: '#0284c7',
  border: '#bae6fd',
  light: '#e0f2fe',
  light2: '#f0f9ff',
  dark: '#0c4a6e',
  muted: '#64748b',
};

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

export default function CollaborateursSansVisite({
  onListeCreee,
  onHasAlertsChange,
  excludeCollaborateurIds,
  embedded = false,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const excludeSet = useMemo(() => {
    const x = excludeCollaborateurIds;
    if (x instanceof Set) return x;
    if (Array.isArray(x)) return new Set(x.map((n) => Number(n)).filter((n) => !Number.isNaN(n)));
    return new Set();
  }, [excludeCollaborateurIds]);

  const visible = useMemo(() => {
    if (!excludeSet.size) return data;
    return data.filter((c) => {
      const pk = pickCollaborateurPk(c);
      if (pk == null) return true;
      return !excludeSet.has(pk);
    });
  }, [data, excludeSet]);

  const load = useCallback(() => {
    setLoading(true);
    getCollaborateursSansVisitePeriodique({ horizon_jours: getVpAlertHorizonJours() })
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onHz = () => load();
    window.addEventListener('rh-vp-horizon-changed', onHz);
    return () => window.removeEventListener('rh-vp-horizon-changed', onHz);
  }, [load]);

  useEffect(() => {
    const onExam = () => load();
    window.addEventListener(RH_VP_EXAM_PERIODIQUE_TERMINE, onExam);
    return () => window.removeEventListener(RH_VP_EXAM_PERIODIQUE_TERMINE, onExam);
  }, [load]);

  useEffect(() => {
    if (loading) {
      onHasAlertsChange?.(false);
      return;
    }
    onHasAlertsChange?.(visible.length > 0);
  }, [loading, visible, onHasAlertsChange]);

  useEffect(() => {
    setSelected((prev) => {
      const allowed = new Set(visible.map((c) => c.id));
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      return next.size === prev.size && [...next].every((id) => prev.has(id)) ? prev : next;
    });
  }, [visible]);

  const toggleAll = () => {
    if (selected.size === visible.length && visible.length > 0) setSelected(new Set());
    else setSelected(new Set(visible.map((c) => c.id)));
  };

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleCreer = async () => {
    if (selected.size === 0) {
      setError('Sélectionnez au moins un collaborateur.');
      return;
    }
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const selectedCollabs = visible.filter((c) => selected.has(c.id));
      const collaborateur_ids = selectedCollabs.map(pickCollaborateurPk).filter((id) => id != null);
      if (collaborateur_ids.length === 0) {
        setError('Identifiants collaborateurs manquants — vérifiez les données.');
        return;
      }
      const liste = await creerListeVisitePeriodiqueEtSoumettre({
        date_visite: today,
        collaborateur_ids,
      });
      setSuccess(
        `Liste créée (réf. ${liste ? afficherReferenceListeVisitePeriodique(liste) : '—'}) et envoyée à l'infirmier.`
      );
      setSelected(new Set());
      onListeCreee?.();
      load();
    } catch (e) {
      setError(formatAxiosError(e) || 'Erreur lors de la création de la liste.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div style={{ fontSize: 12, color: C.muted, padding: embedded ? '12px 16px' : '4px 0' }}>Chargement des alertes…</div>;
  }

  if (data.length === 0) {
    return null;
  }

  if (visible.length === 0) {
    return (
      <div style={{ fontSize: 12.5, color: C.muted, padding: embedded ? '12px 18px' : '8px 0', lineHeight: 1.45 }}>
        Les collaborateurs « sans visite depuis plus d&apos;un an » apparaissent déjà dans le tableau des échéances ci-dessus. Aucune ligne supplémentaire à traiter ici.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {!embedded && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#0369a1',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 3,
                height: 14,
                borderRadius: 3,
                background: 'linear-gradient(180deg,#0284c7,#38bdf8)',
              }}
            />
            Nouvelles alertes — sans visite depuis +1 an
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #e0f7ff 0%, #bae6fd 45%, #f0f9ff 100%)',
              border: '1.5px solid #7dd3fc',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              boxShadow: '0 4px 18px rgba(14,165,233,.12)',
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>
                {visible.length} collaborateur{visible.length !== 1 ? 's' : ''} sans visite depuis +1 an
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>
                Créez une liste dédiée : elle sera transmise à l&apos;infirmier pour organiser le passage.
              </div>
            </div>
            <button
              onClick={load}
              type="button"
              style={{
                padding: '6px 12px',
                border: `1px solid ${C.border}`,
                background: 'white',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                color: C.primary,
                fontFamily: 'inherit',
              }}
            >
              Actualiser
            </button>
          </div>
        </>
      )}
      {embedded && (
        <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>
            Autres absences prolongées
            <span style={{ fontWeight: 500, color: C.muted }}> — {visible.length} hors tableau ci-dessus</span>
          </div>
          <button
            onClick={load}
            type="button"
            style={{
              padding: '6px 12px',
              border: `1px solid ${C.border}`,
              background: 'white',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              color: C.primary,
              fontFamily: 'inherit',
            }}
          >
            Actualiser
          </button>
        </div>
      )}

      {success && (
        <div
          style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: '#15803d',
          }}
        >
          {success}
        </div>
      )}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: '#b91c1c',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={toggleAll}
          style={{
            padding: '7px 12px',
            border: `1px solid ${C.border}`,
            background: C.light2,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            color: C.dark,
            fontFamily: 'inherit',
          }}
        >
          {selected.size === data.length && data.length > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
        <button
          type="button"
          onClick={handleCreer}
          disabled={creating || selected.size === 0}
          style={{
            padding: '7px 14px',
            border: 'none',
            borderRadius: 8,
            background: selected.size === 0 ? '#e5e7eb' : 'linear-gradient(135deg,#0284c7,#38bdf8)',
            color: selected.size === 0 ? '#9ca3af' : 'white',
            fontSize: 12,
            fontWeight: 800,
            cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: selected.size > 0 ? '0 2px 8px rgba(2,132,199,.25)' : 'none',
          }}
        >
          {creating ? 'Création…' : `Créer liste (${selected.size})`}
        </button>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.light2, borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: 40 }}>
                <input
                  type="checkbox"
                  checked={selected.size === visible.length && visible.length > 0}
                  onChange={toggleAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              {['Nom & Prénom', 'Matricule', 'Département', 'Dernière visite', 'Ancienneté'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: 9,
                    fontWeight: 800,
                    color: C.dark,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((c, i) => (
              <tr
                key={c.id}
                onClick={() => toggle(c.id)}
                style={{
                  borderBottom: i < visible.length - 1 ? `1px solid ${C.light}` : 'none',
                  background: selected.has(c.id) ? C.light2 : 'white',
                  cursor: 'pointer',
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) => {
                  if (!selected.has(c.id)) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selected.has(c.id) ? C.light2 : 'white';
                }}
              >
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#111827' }}>
                  {c.nom} {c.prenom}
                </td>
                <td style={{ padding: '8px 10px', color: '#475569', fontFamily: 'monospace' }}>{c.matricule}</td>
                <td style={{ padding: '8px 10px', color: '#475569' }}>{c.departement || '—'}</td>
                <td style={{ padding: '8px 10px', color: '#475569' }}>{fmtDate(c.derniere_visite_date)}</td>
                <td style={{ padding: '8px 10px' }}>
                  <MoisBadge mois={c.mois_depuis_derniere_visite} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
