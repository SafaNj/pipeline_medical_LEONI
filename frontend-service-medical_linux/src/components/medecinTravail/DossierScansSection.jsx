import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DocumentScanFormModal from '../documents/DocumentScanFormModal';
import { TYPE_DOCUMENT_LABELS } from '../../api/documentsMedicauxScannesApi';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('fr-FR') : '—');

export default function DossierScansSection({ dossier, collab, onRefresh }) {
  const { user } = useAuth();
  const canAdd = user?.role === 'infirmier';
  const [modalOpen, setModalOpen] = useState(false);

  const scans = Array.isArray(dossier?.scans) ? dossier.scans : [];

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 15,
        border: '1px solid #e2e8f0',
        padding: '20px 22px',
        marginBottom: 14,
        boxShadow: '0 1px 4px rgba(15,23,42,.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#1e3a5f' }}>Documents archivés (scans)</span>
        </div>
        {canAdd && collab && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: '#059669',
              color: 'white',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Ajouter un scan
          </button>
        )}
      </div>

      {scans.length === 0 ? (
        <div style={{ fontSize: 13, color: '#64748b', padding: '8px 0' }}>Aucun document archivé pour ce dossier.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '8px 6px', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '8px 6px', fontWeight: 700 }}>Titre</th>
                <th style={{ padding: '8px 6px', fontWeight: 700 }}>Date doc.</th>
                <th style={{ padding: '8px 6px', fontWeight: 700 }}>Dépôt</th>
                <th style={{ padding: '8px 6px', fontWeight: 700 }}>Fichier</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 6px' }}>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        background: s.type_document === 'FICHE_MEDICALE' ? '#ede9fe' : '#ecfdf5',
                        color: s.type_document === 'FICHE_MEDICALE' ? '#5b21b6' : '#047857',
                      }}
                    >
                      {TYPE_DOCUMENT_LABELS[s.type_document] || s.type_document}
                    </span>
                  </td>
                  <td style={{ padding: '10px 6px', color: '#334155' }}>{s.titre || '—'}</td>
                  <td style={{ padding: '10px 6px' }}>{fmtDate(s.date_document)}</td>
                  <td style={{ padding: '10px 6px', color: '#64748b', fontSize: 11.5 }}>{fmtDateTime(s.date_depot)}</td>
                  <td style={{ padding: '10px 6px' }}>
                    {s.fichier_url ? (
                      <a href={s.fichier_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontWeight: 600 }}>
                        Ouvrir
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canAdd && (
        <DocumentScanFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={() => { onRefresh?.(); setModalOpen(false); }}
          initialDoc={null}
          defaultCollaborateurId={dossier?.collaborateur ?? collab?.id ?? null}
          defaultCollab={collab || null}
          defaultMatriculeRef=""
        />
      )}
    </div>
  );
}
