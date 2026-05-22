import { useState, useEffect, useCallback, useRef } from 'react';
import { searchCollaborateurs } from '../../api/Medicalworkapi';
import {
  listDocumentsMedicauxScannes,
  deleteDocumentMedicalScanne,
  TYPE_DOCUMENT_LABELS,
  formatDocumentsApiError,
} from '../../api/documentsMedicauxScannesApi';
import DocumentScanFormModal from './DocumentScanFormModal';
import { uiAlert, uiConfirm } from '../../utils/uiAlert';

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('fr-FR') : '—');

export default function DocumentsMedicauxScannesPage({ canEdit = false }) {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matInput, setMatInput] = useState('');
  const [matFilter, setMatFilter] = useState('');
  const [collabFilter, setCollabFilter] = useState(null);
  const [qCollab, setQCollab] = useState('');
  const [listCollab, setListCollab] = useState([]);
  const [openDrop, setOpenDrop] = useState(false);
  const dropRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setMatFilter(matInput.trim()), 400);
    return () => clearTimeout(t);
  }, [matInput]);

  useEffect(() => {
    setPage(1);
  }, [matFilter, collabFilter]);

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpenDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (qCollab.length < 2 || collabFilter) {
      if (qCollab.length < 2) setListCollab([]);
      return;
    }
    const t = setTimeout(() => {
      searchCollaborateurs(qCollab)
        .then((d) => {
          setListCollab((d || []).slice(0, 8));
          setOpenDrop((d || []).length > 0);
        })
        .catch(() => {});
    }, 280);
    return () => clearTimeout(t);
  }, [qCollab, collabFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (collabFilter?.id) params.collaborateur = collabFilter.id;
      else if (matFilter.trim()) params.matricule_ref = matFilter.trim();
      const data = await listDocumentsMedicauxScannes(params);
      setRows(data.results);
      setCount(data.count);
      setNextUrl(data.next);
      setPrevUrl(data.previous);
    } catch (e) {
      setError(formatDocumentsApiError(e, 'Impossible de charger les documents.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, collabFilter, matFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const resetFilters = () => {
    setMatInput('');
    setMatFilter('');
    setCollabFilter(null);
    setQCollab('');
    setPage(1);
  };

  const pickCollabFilter = (c) => {
    setCollabFilter(c);
    setMatInput('');
    setQCollab(`${c.nom} ${c.prenom}`.trim());
    setOpenDrop(false);
    setPage(1);
  };

  const openCreate = () => {
    setEditDoc(null);
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setModalOpen(true);
  };

  const handleDelete = async (doc) => {
    const ok = await uiConfirm({
      title: 'Suppression',
      text: 'Supprimer ce document ?',
      confirmButtonText: 'Supprimer',
    });
    if (!ok) return;
    try {
      await deleteDocumentMedicalScanne(doc.id);
      fetchList();
    } catch (e) {
      await uiAlert({
        icon: 'error',
        title: 'Suppression',
        text: formatDocumentsApiError(e),
      });
    }
  };

  const salarieLabel = (doc) => {
    if (doc.collaborateur && doc.collaborateur_matricule) {
      return doc.collaborateur_matricule;
    }
    return doc.matricule_ref || '—';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 16, flexShrink: 0 }}>
        <div ref={dropRef} style={{ position: 'relative', minWidth: 220, flex: '1 1 200px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Filtrer par salarié</div>
          {!collabFilter ? (
            <input
              value={qCollab}
              onChange={(e) => setQCollab(e.target.value)}
              placeholder="Recherche nom / matricule…"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #bae6fd',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f0f9ff', borderRadius: 10, border: '1.5px solid #7dd3fc' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {collabFilter.nom} {collabFilter.prenom}
              </span>
              <button type="button" onClick={() => { setCollabFilter(null); setQCollab(''); setPage(1); }} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                Effacer
              </button>
            </div>
          )}
          {openDrop && !collabFilter && listCollab.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 20,
                marginTop: 4,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                maxHeight: 200,
                overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,.1)',
              }}
            >
              {listCollab.map((c) => (
                <div
                  key={c.id}
                  onClick={() => pickCollabFilter(c)}
                  style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f8fafc' }}
                >
                  {c.nom} {c.prenom} <span style={{ color: '#94a3b8' }}>{c.matricule}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ minWidth: 140, flex: '0 1 140px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Matricule</div>
          <input
            value={matInput}
            onChange={(e) => setMatInput(e.target.value)}
            disabled={!!collabFilter}
            placeholder="ex. M123"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1.5px solid #bae6fd',
              fontSize: 13,
              boxSizing: 'border-box',
              opacity: collabFilter ? 0.5 : 1,
            }}
          />
        </div>
        <button
          type="button"
          onClick={resetFilters}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: '1.5px solid #e2e8f0',
            background: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#475569',
          }}
        >
          Réinitialiser les filtres
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: '#059669',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            + Ajouter un scan
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: 'white', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Aucun document pour ces critères.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#64748b' }}>Dépôt</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#64748b' }}>Type</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#64748b' }}>Matricule / ref.</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#64748b' }}>Titre</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#64748b' }}>Document</th>
                {canEdit && <th style={{ padding: '12px 14px', fontWeight: 700, color: '#64748b' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>{fmtDateTime(doc.date_depot)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: doc.type_document === 'FICHE_MEDICALE' ? '#ede9fe' : '#ecfdf5',
                        color: doc.type_document === 'FICHE_MEDICALE' ? '#5b21b6' : '#047857',
                      }}
                    >
                      {TYPE_DOCUMENT_LABELS[doc.type_document] || doc.type_document}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12 }}>{salarieLabel(doc)}</td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>{doc.titre || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {doc.fichier_url ? (
                      <a href={doc.fichier_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontWeight: 600 }}>
                        Ouvrir
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  {canEdit && (
                    <td style={{ padding: '12px 14px' }}>
                      <button type="button" onClick={() => openEdit(doc)} style={{ border: 'none', background: 'none', color: '#0284c7', fontWeight: 600, cursor: 'pointer', marginRight: 10 }}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => handleDelete(doc)} style={{ border: 'none', background: 'none', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>
                        Supprimer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && count > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexShrink: 0, fontSize: 13, color: '#64748b' }}>
          <span>
            {rows.length} affiché(s) · {count} au total
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled={!prevUrl}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: prevUrl ? 'white' : '#f1f5f9',
                cursor: prevUrl ? 'pointer' : 'not-allowed',
              }}
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={!nextUrl}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: nextUrl ? 'white' : '#f1f5f9',
                cursor: nextUrl ? 'pointer' : 'not-allowed',
              }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      <DocumentScanFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditDoc(null); }}
        onSaved={fetchList}
        initialDoc={editDoc}
        defaultCollaborateurId={null}
        defaultCollab={null}
        defaultMatriculeRef=""
      />
    </div>
  );
}
