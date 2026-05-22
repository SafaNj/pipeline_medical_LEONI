import { useState, useEffect, useRef } from 'react';
import { searchCollaborateurs, getConsultationsByCollaborateur } from '../../api/consultationsApi';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : '—';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 13, marginBottom: 5 }}>
      <span style={{ color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>{label} :</span>
      <span style={{ color: '#1e293b', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ConsultationHistorique({ consultation }) {
  const medicaments = (consultation.ordonnances || [])
    .flatMap(o => (o.medicaments || '').split('\n').map(m => m.trim()).filter(Boolean));

  const certificat = consultation.certificats?.[0];
  const arret = certificat
    ? `${certificat.jours_repos} jour${certificat.jours_repos > 1 ? 's' : ''}`
    : null;

  return (
    <div style={{
      background: 'white', borderRadius: 12,
      border: '1px solid #e2e8f0', marginBottom: 10,
      padding: '14px 16px',
    }}>
      {/* Type + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 13,
        }}>🩺</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
          {consultation.motif || 'Consultation Générale'}
        </div>
        <span style={{
          marginLeft: 'auto', fontSize: 11.5, color: '#64748b',
          background: '#f1f5f9', padding: '2px 9px', borderRadius: 20, fontWeight: 600,
        }}>
          {fmtDate(consultation.date_consultation)}
        </span>
      </div>

      {/* Infos principales */}
      <Row label="Diagnostic"   value={consultation.diagnostic} />
      {medicaments.length > 0 && (
        <div style={{ display: 'flex', gap: 6, fontSize: 13, marginBottom: 5 }}>
          <span style={{ color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>Médicaments :</span>
          <span style={{ color: '#1e293b', fontWeight: 500 }}>
            {medicaments.join(' • ')}
          </span>
        </div>
      )}
      <Row label="Médecin"      value={consultation.medecin_nom ? `Dr. ${consultation.medecin_nom}` : null} />
      {arret && <Row label="Arrêt"  value={arret} />}
    </div>
  );
}

export default function HistoriqueCollab() {
  const [query,          setQuery]          = useState('');
  const [results,        setResults]        = useState([]);
  const [showDrop,       setShowDrop]       = useState(false);
  const [pickedCollab,   setPickedCollab]   = useState(null);
  const [consultations,  setConsultations]  = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const dropRef = useRef(null);

  // Fermer dropdown si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recherche collaborateur debounced
  useEffect(() => {
    if (query.length < 2 || pickedCollab) { setResults([]); setShowDrop(false); return; }
    const t = setTimeout(() => {
      searchCollaborateurs(query)
        .then(data => { setResults(data.slice(0, 8)); setShowDrop(data.length > 0); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query, pickedCollab]);

  const pickCollab = async (c) => {
    setPickedCollab(c);
    setQuery(`${c.nom} ${c.prenom}`);
    setShowDrop(false);
    setError('');
    setLoading(true);
    try {
      const data = await getConsultationsByCollaborateur(c.id);
      setConsultations(data);
    } catch {
      setError('Erreur lors du chargement de l\'historique.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPickedCollab(null);
    setQuery('');
    setConsultations([]);
    setResults([]);
  };

  const initials = (c) =>
    `${c.nom?.[0] || ''}${c.prenom?.[0] || ''}`.toUpperCase();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: 'white', borderRadius: 16,
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden',
    }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '20px 22px 16px',
          borderBottom: '1px solid #f1f5f9', flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: '#eff6ff', border: '1.5px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            🔍
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
            Historique collaborateur
          </div>
        </div>

        {/* Recherche */}
        <div style={{ padding: '16px 22px', flexShrink: 0 }}>
          <div ref={dropRef} style={{ position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPickedCollab(null); setConsultations([]); }}
              placeholder="Rechercher un collaborateur (nom, prénom, matricule)…"
              style={{
                width: '100%', padding: '10px 36px 10px 13px',
                border: `1.5px solid ${pickedCollab ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
                outline: 'none', color: '#0f172a', boxSizing: 'border-box',
              }}
            />
            {pickedCollab && (
              <button
                onClick={reset}
                style={{
                  position: 'absolute', right: 9, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 20, height: 20, border: 'none',
                  background: '#f1f5f9', borderRadius: 5,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#64748b',
                }}
              >
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}

            {/* Dropdown */}
            {showDrop && results.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: 'white', border: '1.5px solid #e2e8f0',
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                zIndex: 200, maxHeight: 200, overflowY: 'auto',
              }}>
                {results.map(c => (
                  <div
                    key={c.id}
                    onClick={() => pickCollab(c)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid #f8fafc',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                      background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 11, fontWeight: 800,
                    }}>
                      {initials(c)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {c.nom} {c.prenom}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>
                        {c.poste} — {c.department}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {c.matricule}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Résultats */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 22px' }}>
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#b91c1c', padding: '10px 14px',
              borderRadius: 10, fontSize: 13, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: 14 }}>
              Chargement de l'historique…
            </div>
          )}

          {!loading && pickedCollab && consultations.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '30px 16px',
              background: '#f8fafc', borderRadius: 12,
              border: '1.5px dashed #e2e8f0',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>
                Aucune consultation pour <strong>{pickedCollab.nom} {pickedCollab.prenom}</strong>
              </p>
            </div>
          )}

          {!loading && consultations.length > 0 && (
            <>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: 10,
              }}>
                {consultations.length} consultation{consultations.length > 1 ? 's' : ''} — {pickedCollab.nom} {pickedCollab.prenom}
              </div>
              {consultations.map(c => (
                <ConsultationHistorique key={c.id} consultation={c} />
              ))}
            </>
          )}

          {!pickedCollab && !loading && (
            <div style={{
              textAlign: 'center', padding: '30px 16px',
              color: '#94a3b8', fontSize: 14,
            }}>
              Recherchez un collaborateur pour voir son historique médical
            </div>
          )}
        </div>
    </div>
  );
}