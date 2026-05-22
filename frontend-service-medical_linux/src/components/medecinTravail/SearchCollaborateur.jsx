// src/components/medecinTravail/SearchCollaborateur.jsx
import { useState, useEffect, useRef } from 'react';
import { searchCollaborateurs, getCandidatsAExaminer, getCollaborateur } from '../../api/Medicalworkapi';
import { pickCnssCollaborateur } from '../../utils/cnssEmbauche';
import { pickDepartementCollaborateur, pickLieuNaissanceCollaborateur } from '../../utils/ficheCollaborateur';
import { useAuth } from '../../context/AuthContext';
import { getImSiteMisconfiguredMessage } from '../../utils/imSiteAccess';

function matchesQuery(c, qRaw) {
  const q = String(qRaw || '').trim().toLowerCase();
  if (!q) return false;
  const nom = String(c.nom || '').toLowerCase();
  const prenom = String(c.prenom || '').toLowerCase();
  const mat = String(c.matricule || '').toLowerCase();
  return nom.includes(q) || prenom.includes(q) || mat.includes(q) || `${nom} ${prenom}`.trim().includes(q);
}

export default function SearchCollaborateur({ value, onChange, onSelect, placeholder = 'Nom, prénom ou matricule…' }) {
  const { user } = useAuth();
  const [query,    setQuery]    = useState(value || '');
  const [results,  setResults]  = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [picked,   setPicked]   = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const dropRef = useRef(null);

  // Fermer dropdown si clic dehors
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounce recherche : collaborateurs + candidats embauche (filtrés côté client)
  useEffect(() => {
    if (query.length < 2 || picked) {
      const clearId = setTimeout(() => {
        setResults([]);
        setShowDrop(false);
      }, 0);
      return () => clearTimeout(clearId);
    }
    let cancelled = false;
    const t = setTimeout(() => {
      const filters = { site_id: user?.site_id };
      Promise.all([
        searchCollaborateurs(query, filters).catch(() => []),
        getCandidatsAExaminer(filters).catch(() => []),
      ])
        .then(([collabs, candidats]) => {
          if (cancelled) return;
          // On évite ici tout filtrage frontend "scope" qui peut masquer des lignes valides.
          // Le backend applique déjà le filtre site_id.
          const scopedCollabs = collabs || [];
          const scopedCandidats = candidats || [];

          const collabRows = scopedCollabs
            .filter((c) => matchesQuery(c, query))
            .map((c) => ({
            ...c,
            _selectionSource: 'collaborateur',
            _rowKey: `collab-${c.id}`,
            lieu_naissance: pickLieuNaissanceCollaborateur(c) || c.lieu_naissance || c.im_data?.lieu_naissance || '',
            department: pickDepartementCollaborateur(c) || c.department || '',
            numero_cnss: pickCnssCollaborateur(c) || c.numero_cnss || '',
            poste: c.poste || c.fonction || c.im_data?.fonction || c.im_data?.poste || '',
          }));
          const candFiltered = scopedCandidats.filter((c) => matchesQuery(c, query));
          const candRows = candFiltered.map((c) => ({
            ...c,
            _selectionSource: 'candidat_embauche',
            _rowKey: `candidat-${c.id}`,
            lieu_naissance: pickLieuNaissanceCollaborateur(c) || c.im_data?.lieu_naissance || c.lieu_naissance || '',
            poste: c.poste || c.im_data?.fonction || c.fonction || '',
            department: pickDepartementCollaborateur(c) || c.department || c.gouvernorat || '',
            numero_cnss: pickCnssCollaborateur(c) || c.numero_cnss || c.cnss || '',
          }));
          const merged = [...collabRows, ...candRows].slice(0, 10);
          setResults(merged);
          setShowDrop(merged.length > 0);
        })
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(t);
      cancelled = true;
    };
  }, [query, picked, user]);

  const handlePick = async (row) => {
    const nom = `${row.nom} ${row.prenom}`.trim();
    setQuery(nom);
    setShowDrop(false);

    // Liste /search : souvent champs réduits — le détail GET a département, CNSS, lieu, etc.
    if (row._selectionSource === 'candidat_embauche') {
      setPicked(row);
      if (onSelect) onSelect(row);
      if (onChange) onChange(nom);
      return;
    }

    if (!row?.id) {
      setPicked(row);
      if (onSelect) onSelect(row);
      if (onChange) onChange(nom);
      return;
    }

    setLoadingDetail(true);
    try {
      const detail = await getCollaborateur(row.id);

      // On filtre les clés de detail dont la valeur est null/undefined/''
      // pour ne pas écraser les champs déjà normalisés dans row
      const detailNonVide = Object.fromEntries(
        Object.entries(detail || {}).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );

      const merged = {
        ...row,
        ...detailNonVide,
        // Re-normalise les champs calculés avec les données les plus complètes disponibles
        poste:         detailNonVide.poste        || detailNonVide.fonction       || detailNonVide.im_data?.fonction || detailNonVide.im_data?.poste || row.poste        || '',
        department:    pickDepartementCollaborateur({ ...row, ...detailNonVide })  || row.department    || '',
        lieu_naissance: pickLieuNaissanceCollaborateur({ ...row, ...detailNonVide }) || row.lieu_naissance || '',
        numero_cnss:   pickCnssCollaborateur({ ...row, ...detailNonVide })         || row.numero_cnss   || '',
        _selectionSource: 'collaborateur',
        _rowKey: row._rowKey,
      };
      setPicked(merged);
      if (onSelect) onSelect(merged);
    } catch {
      setPicked(row);
      if (onSelect) onSelect(row);
    } finally {
      setLoadingDetail(false);
    }
    if (onChange) onChange(nom);
  };

  const handleClear = () => {
    setPicked(null);
    setLoadingDetail(false);
    setQuery('');
    setResults([]);
    if (onSelect) onSelect(null);
    if (onChange) onChange('');
  };

  const initials = (c) => `${c.nom?.[0] || ''}${c.prenom?.[0] || ''}`.toUpperCase();

  const imSiteWarning = getImSiteMisconfiguredMessage(user);

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {imSiteWarning && (
        <div
          role="status"
          style={{
            fontSize: 11,
            color: '#9a3412',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 8,
            lineHeight: 1.35,
          }}
        >
          {imSiteWarning}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPicked(null); if (onChange) onChange(e.target.value); }}
          placeholder={placeholder}
          style={{
            width: '100%', padding: picked ? '9px 36px 9px 12px' : '9px 12px',
            background: '#f8fafc',
            border: `1.5px solid ${picked ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius: 9, fontSize: 13, color: '#0f172a',
            fontFamily: 'inherit', outline: 'none',
            transition: 'border-color .15s', boxSizing: 'border-box',
          }}
          onFocus={e => { if (!picked) e.target.style.borderColor = '#93c5fd'; }}
          onBlur={e => { if (!picked) e.target.style.borderColor = '#e2e8f0'; }}
        />
        {picked && (
          <button onClick={handleClear} title="Effacer" style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            width: 28, height: 28, border: 'none', background: '#fee2e2',
            borderRadius: 7, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#dc2626', fontSize: 15, fontWeight: 800,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fecaca')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fee2e2')}
          >
            ✕
          </button>
        )}
      </div>

      {loadingDetail && (
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Chargement des informations collaborateur…</div>
      )}

      {showDrop && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
          background: 'white', border: '1.5px solid #e2e8f0',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.1)',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {results.map(c => (
            <div key={c._rowKey || c.id} onClick={() => handlePick(c)}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'background .1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: c._selectionSource === 'candidat_embauche'
                  ? 'linear-gradient(135deg,#059669,#047857)'
                  : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 11, fontWeight: 800,
              }}>
                {initials(c)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  {c.nom} {c.prenom}
                  {c._selectionSource === 'candidat_embauche' && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Candidat embauche</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
                  {(c.poste || '—')} · {(pickDepartementCollaborateur(c) || '—')}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
                {c.matricule}
              </span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, marginBottom: 0, lineHeight: 1.35 }}>
        Résultats limités aux collaborateurs de votre site (données RH / IM).
      </p>
    </div>
  );
}