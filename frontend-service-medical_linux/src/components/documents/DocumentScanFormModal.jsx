import { useState, useEffect, useRef } from 'react';
import { searchCollaborateurs } from '../../api/Medicalworkapi';
import {
  createDocumentMedicalScanne,
  updateDocumentMedicalScanne,
  TYPE_FICHE_MEDICALE,
  TYPE_DOSSIER_MEDICAL,
  TYPE_DOCUMENT_LABELS,
  validateScanFile,
  formatDocumentsApiError,
  MAX_SCAN_BYTES,
} from '../../api/documentsMedicauxScannesApi';

const ini = (n = '') =>
  n
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export default function DocumentScanFormModal({
  open,
  onClose,
  onSaved,
  initialDoc,
  defaultCollaborateurId,
  defaultCollab,
  defaultMatriculeRef = '',
}) {
  const [typeDocument, setTypeDocument] = useState(TYPE_DOSSIER_MEDICAL);
  const [titre, setTitre] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [dateDocument, setDateDocument] = useState('');
  const [matriculeRef, setMatriculeRef] = useState('');
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [file, setFile] = useState(null);
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [openDrop, setOpenDrop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dropRef = useRef(null);

  const isEdit = !!initialDoc?.id;

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpenDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError('');
    setFile(null);
    if (initialDoc) {
      setTypeDocument(initialDoc.type_document || TYPE_DOSSIER_MEDICAL);
      setTitre(initialDoc.titre || '');
      setCommentaire(initialDoc.commentaire || '');
      setDateDocument(initialDoc.date_document ? String(initialDoc.date_document).slice(0, 10) : '');
      setMatriculeRef(initialDoc.matricule_ref || '');
      if (initialDoc.collaborateur) {
        setSelectedCollab(
          defaultCollab && defaultCollab.id === initialDoc.collaborateur
            ? defaultCollab
            : {
                id: initialDoc.collaborateur,
                nom: '?',
                prenom: '',
                matricule: initialDoc.collaborateur_matricule || '',
              }
        );
      } else {
        setSelectedCollab(null);
      }
      setQ('');
      setList([]);
      setOpenDrop(false);
    } else {
      setTypeDocument(TYPE_DOSSIER_MEDICAL);
      setTitre('');
      setCommentaire('');
      setDateDocument('');
      setMatriculeRef(defaultMatriculeRef || '');
      if (defaultCollaborateurId && defaultCollab) {
        setSelectedCollab(defaultCollab);
        setQ(`${defaultCollab.nom} ${defaultCollab.prenom}`.trim());
      } else if (defaultCollaborateurId) {
        setSelectedCollab({
          id: defaultCollaborateurId,
          nom: '',
          prenom: '',
          matricule: '',
        });
        setQ('');
      } else {
        setSelectedCollab(null);
        setQ('');
      }
      setList([]);
      setOpenDrop(false);
    }
  }, [open, initialDoc, defaultCollaborateurId, defaultCollab, defaultMatriculeRef]);

  useEffect(() => {
    if (q.length < 2 || selectedCollab) {
      if (q.length < 2) setList([]);
      return;
    }
    const t = setTimeout(() => {
      searchCollaborateurs(q)
        .then((d) => {
          setList((d || []).slice(0, 8));
          setOpenDrop((d || []).length > 0);
        })
        .catch(() => {});
    }, 280);
    return () => clearTimeout(t);
  }, [q, selectedCollab]);

  const pickCollab = (c) => {
    setSelectedCollab(c);
    setQ(`${c.nom} ${c.prenom}`.trim());
    setOpenDrop(false);
    setList([]);
    setMatriculeRef('');
  };

  const clearCollab = () => {
    setSelectedCollab(null);
    setQ('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const collabId = selectedCollab?.id ?? null;
    const mat = (matriculeRef || '').trim();
    if (!collabId && !mat) {
      setError('Indiquez un salarié (recherche) ou un matricule (candidat).');
      return;
    }
    if (!isEdit) {
      const fe = validateScanFile(file);
      if (fe) {
        setError(fe);
        return;
      }
    } else if (file) {
      const fe = validateScanFile(file);
      if (fe) {
        setError(fe);
        return;
      }
    }

    setSaving(true);
    try {
      if (!isEdit) {
        const fd = new FormData();
        if (collabId) fd.append('collaborateur', String(collabId));
        fd.append('matricule_ref', mat);
        fd.append('type_document', typeDocument);
        fd.append('fichier', file);
        if (titre.trim()) fd.append('titre', titre.trim());
        if (commentaire.trim()) fd.append('commentaire', commentaire.trim());
        if (dateDocument) fd.append('date_document', dateDocument);
        await createDocumentMedicalScanne(fd);
      } else {
        const payload = {
          type_document: typeDocument,
          titre: titre.trim() || '',
          commentaire: commentaire.trim() || '',
          date_document: dateDocument || null,
          matricule_ref: mat,
          collaborateur: collabId,
        };
        await updateDocumentMedicalScanne(initialDoc.id, payload, file || undefined);
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(formatDocumentsApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'rgba(15,23,42,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          maxWidth: 520,
          width: '100%',
          maxHeight: '92vh',
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,.18)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #e2e8f0',
            fontSize: 17,
            fontWeight: 800,
            color: '#0c4a6e',
          }}
        >
          {isEdit ? 'Modifier le document' : 'Ajouter un scan'}
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px 22px' }}>
          <div ref={dropRef} style={{ marginBottom: 14, position: 'relative' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
              Salarié (recherche)
            </div>
            {!selectedCollab ? (
              <>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nom, prénom ou matricule…"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #e2e8f0',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
                {openDrop && list.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      marginTop: 4,
                      zIndex: 10,
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      maxHeight: 220,
                      overflowY: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,.1)',
                    }}
                  >
                    {list.map((c, i) => (
                      <div
                        key={c.id}
                        onClick={() => pickCollab(c)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: i < list.length - 1 ? '1px solid #f1f5f9' : undefined,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#e0f2fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            color: '#0369a1',
                          }}
                        >
                          {ini(`${c.nom} ${c.prenom}`)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {c.nom} {c.prenom}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{c.matricule}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e' }}>
                  {selectedCollab.nom} {selectedCollab.prenom}{' '}
                  <span style={{ color: '#64748b', fontWeight: 500 }}>({selectedCollab.matricule || '—'})</span>
                </span>
                <button type="button" onClick={clearCollab} style={{ border: 'none', background: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                  Changer
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
              Matricule (candidat / hors fiche)
            </div>
            <input
              value={matriculeRef}
              onChange={(e) => setMatriculeRef(e.target.value)}
              placeholder="Si pas de salarié sélectionné"
              disabled={!!selectedCollab}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 13,
                boxSizing: 'border-box',
                opacity: selectedCollab ? 0.6 : 1,
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
              Type de document *
            </div>
            <select
              value={typeDocument}
              onChange={(e) => setTypeDocument(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 13,
              }}
            >
              <option value={TYPE_FICHE_MEDICALE}>{TYPE_DOCUMENT_LABELS[TYPE_FICHE_MEDICALE]}</option>
              <option value={TYPE_DOSSIER_MEDICAL}>{TYPE_DOCUMENT_LABELS[TYPE_DOSSIER_MEDICAL]}</option>
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
              Fichier {!isEdit && '*'}
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ fontSize: 13 }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>PDF, JPG, PNG — max {MAX_SCAN_BYTES / (1024 * 1024)} Mo</div>
            {isEdit && initialDoc?.fichier_url && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <a href={initialDoc.fichier_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontWeight: 600 }}>
                  Fichier actuel — ouvrir
                </a>
                {file && <span style={{ color: '#059669', marginLeft: 10 }}>Nouveau fichier sélectionné</span>}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Titre</div>
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Commentaire</div>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 13,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Date du document</div>
            <input type="date" value={dateDocument} onChange={(e) => setDateDocument(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13 }} />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" disabled={saving} onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: saving ? '#94a3b8' : '#0284c7',
                color: 'white',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
