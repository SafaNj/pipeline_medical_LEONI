// src/components/infirmier/AjouterItem.jsx
import { useState, useEffect, useRef } from 'react';
import { ajouterItem }          from '../../api/actInfirmierApi';
import { searchCollaborateurs } from '../../api/planningApi';

export default function AjouterItem({ listeId, onAdded, itemsExistants = [] }) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [picked,   setPicked]   = useState(null);
  const [motif,    setMotif]    = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const dropRef = useRef(null);

  // IDs des collabs déjà dans la liste (hors annulés)
  const dejaDansListe = new Set(
    itemsExistants
      .filter(i => i.statut !== 'ANNULEE')
      .map(i => i.collaborateur?.id ?? i.collaborateur)
  );

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recherche debounced : déclenche après 300ms, min 2 caractères
  useEffect(() => {
    if (query.length < 2 || picked) {
      setResults([]);
      setShowDrop(false);
      return;
    }
    const timer = setTimeout(() => {
      searchCollaborateurs(query)
        .then(data => {
          setResults(data.slice(0, 8));
          setShowDrop(data.length > 0);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query, picked]);

  const pickCollab = (c) => {
    // Bloquer si déjà dans la liste
    if (dejaDansListe.has(c.id)) return;
    setPicked(c);
    setQuery(`${c.nom} ${c.prenom}`);
    setShowDrop(false);
    setError('');
  };

  const clearCollab = () => {
    setPicked(null);
    setQuery('');
    setResults([]);
  };

  const handleSubmit = async () => {
    if (!picked) {
      setError('Veuillez sélectionner un collaborateur.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const newItem = await ajouterItem(listeId, {
        collaborateur: picked.id,
        motif: motif.trim() || null,
      });
      onAdded(newItem);
      clearCollab();
      setMotif('');
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.error   ||
        data?.detail  ||
        Object.values(data ?? {}).flat().join(' ') ||
        "Erreur lors de l'ajout."
      );
    } finally {
      setLoading(false);
    }
  };

  const initials = (c) =>
    `${c.nom?.[0] || ''}${c.prenom?.[0] || ''}`.toUpperCase();

  return (
    <div style={{
      padding: '14px 22px',
      background: '#f8fafc',
      borderBottom: '1px solid #f1f5f9',
      flexShrink: 0,
    }}>
      <p style={{
        fontSize: 11.5, fontWeight: 700, color: '#64748b',
        textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10,
      }}>
        Ajouter un patient
      </p>

      {/* Erreur */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          color: '#b91c1c', padding: '8px 12px',
          borderRadius: 8, fontSize: 13, marginBottom: 10,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>

        {/* ── Autocomplete collaborateur ── */}
        <div ref={dropRef} style={{ flex: '1.5', position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPicked(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Nom, prénom, matricule…"
            style={{
              ...inputStyle,
              borderColor: picked ? '#bbf7d0' : '#e2e8f0',
              paddingRight: picked ? 34 : 13,
            }}
          />

          {/* Bouton reset */}
          {picked && (
            <button
              onClick={clearCollab}
              title="Changer de collaborateur"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6"  y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {/* Dropdown résultats */}
          {showDrop && results.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: 'white', border: '1.5px solid #e2e8f0',
              borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
              zIndex: 200, maxHeight: 230, overflowY: 'auto',
            }}>
              {results.map(c => {
                const dejaAjoute = dejaDansListe.has(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => pickCollab(c)}
                    title={dejaAjoute ? 'Déjà dans la liste' : ''}
                    style={{
                      padding: '10px 14px',
                      cursor: dejaAjoute ? 'not-allowed' : 'pointer',
                      borderBottom: '1px solid #f8fafc',
                      display: 'flex', alignItems: 'center', gap: 10,
                      opacity: dejaAjoute ? 0.45 : 1,
                      background: dejaAjoute ? '#f8fafc' : 'white',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => {
                      if (!dejaAjoute) e.currentTarget.style.background = '#f0f7ff';
                    }}
                    onMouseLeave={e => {
                      if (!dejaAjoute) e.currentTarget.style.background = 'white';
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: dejaAjoute
                        ? '#e2e8f0'
                        : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: dejaAjoute ? '#94a3b8' : 'white',
                      fontSize: 11, fontWeight: 800,
                    }}>
                      {initials(c)}
                    </div>

                    {/* Nom + poste */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: dejaAjoute ? '#94a3b8' : '#0f172a',
                      }}>
                        {c.nom} {c.prenom}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>
                        {dejaAjoute
                          ? '✓ Déjà dans la liste'
                          : `${c.poste} — ${c.department}`
                        }
                      </div>
                    </div>

                    {/* Matricule */}
                    <span style={{
                      fontSize: 11, color: '#94a3b8',
                      fontFamily: 'monospace', flexShrink: 0,
                    }}>
                      {c.matricule}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Motif ── */}
        <input
          type="text"
          value={motif}
          onChange={e => setMotif(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Motif (optionnel)"
          style={{ ...inputStyle, flex: 1 }}
        />

        {/* ── Bouton Ajouter ── */}
        <button
          onClick={handleSubmit}
          disabled={loading || !picked}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', border: 'none', borderRadius: 10,
            fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
            flexShrink: 0, transition: 'background .15s',
            background: picked ? '#2563eb' : '#e2e8f0',
            color:      picked ? 'white'   : '#94a3b8',
            cursor:     picked ? 'pointer' : 'not-allowed',
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5"  y1="12" x2="19" y2="12" />
          </svg>
          {loading ? 'Ajout…' : 'Ajouter'}
        </button>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 13px',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  fontSize: 13.5, fontFamily: 'inherit',
  outline: 'none', color: '#0f172a', background: 'white',
  boxSizing: 'border-box', transition: 'border-color .15s',
};