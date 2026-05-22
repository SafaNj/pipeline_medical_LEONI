// src/components/infirmier/EnqueteModal.jsx — Enquête accident du travail
import { useState, useEffect, useCallback } from 'react';
import {
  getEnquete,
  creerEnquete,
  modifierEnquete,
} from '../../api/actInfirmierApi';
import { printHTML } from '../../utils/printHelper';
import { buildEnqueteHtml } from './PrintEnquete';
import { useAuth } from '../../context/AuthContext';

const EMPTY_TEMOIN = { nom: '', matricule: '', cin: '', telephone: '' };

const defaultForm = () => ({
  telephone_victime: '',
  appartenance: '',
  horaire_travail: '',
  circonstances: '',
  lieu_transport: '',
  temoins: [{ ...EMPTY_TEMOIN }],
});

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const inp = {
  padding: '8px 11px',
  border: '1.5px solid #e5e7eb',
  borderRadius: 7,
  fontSize: 13,
  color: '#111827',
  background: 'white',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const IcoDoc = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IcoClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function EnqueteModal({ accident, onClose, onSaved, readOnly = false }) {
  const { user } = useAuth();
  const [enquete, setEnquete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState(defaultForm);

  const infirmierNom =
    accident?.infirmiere_nom ||
    (accident?.infirmiere === user?.user_id ? user?.username : '') ||
    user?.username ||
    '—';

  const handlePrintPdf = () => {
    if (!accident || enquete?.id == null) return;
    const dataForPdf = {
      ...enquete,
      telephone_victime: form.telephone_victime,
      appartenance: form.appartenance,
      horaire_travail: form.horaire_travail,
      circonstances: form.circonstances,
      lieu_transport: form.lieu_transport,
      temoins: form.temoins,
    };
    printHTML(buildEnqueteHtml(accident, dataForPdf, infirmierNom));
  };

  const loadEnquete = useCallback(async () => {
    if (!accident?.id) return;
    setLoading(true);
    setErr('');
    try {
      const data = await getEnquete(accident.id);
      const eid = data?.id ?? data?.pk;
      if (data && eid != null) {
        setEnquete({ ...data, id: eid });
        const tm = data.temoins;
        setForm({
          telephone_victime: data.telephone_victime ?? '',
          appartenance: data.appartenance ?? '',
          horaire_travail: data.horaire_travail ?? '',
          circonstances: data.circonstances ?? '',
          lieu_transport: data.lieu_transport ?? '',
          temoins:
            Array.isArray(tm) && tm.length > 0
              ? tm.map((t) => ({
                  nom: t.nom ?? '',
                  matricule: t.matricule ?? '',
                  cin: t.cin ?? '',
                  telephone: t.telephone ?? '',
                }))
              : [{ ...EMPTY_TEMOIN }],
        });
      } else {
        setEnquete(null);
        setForm(defaultForm());
      }
    } catch {
      setEnquete(null);
      setForm(defaultForm());
    } finally {
      setLoading(false);
    }
  }, [accident?.id]);

  useEffect(() => {
    loadEnquete();
  }, [loadEnquete]);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleTemoin = (index, field, value) => {
    setForm((p) => {
      const next = [...p.temoins];
      next[index] = { ...next[index], [field]: value };
      return { ...p, temoins: next };
    });
  };

  const addTemoin = () => {
    setForm((p) => ({ ...p, temoins: [...p.temoins, { ...EMPTY_TEMOIN }] }));
  };

  const removeTemoin = (index) => {
    setForm((p) => ({
      ...p,
      temoins: p.temoins.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!accident?.id) return;
    setSaving(true);
    setErr('');
    const payload = {
      telephone_victime: form.telephone_victime,
      appartenance: form.appartenance,
      horaire_travail: form.horaire_travail,
      circonstances: form.circonstances,
      lieu_transport: form.lieu_transport,
      temoins: form.temoins,
    };
    try {
      if (enquete?.id != null) {
        await modifierEnquete(accident.id, payload);
      } else {
        await creerEnquete(accident.id, payload);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      const d = e?.response?.data;
      setErr(
        typeof d === 'string'
          ? d
          : d?.detail || d?.error || JSON.stringify(d || {}) || 'Erreur enregistrement'
      );
    } finally {
      setSaving(false);
    }
  };

  const a = accident;
  const readOnlyBox = {
    background: '#f3f4f6',
    borderRadius: 9,
    padding: '10px 13px',
    fontSize: 13,
    color: '#374151',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 25px 50px rgba(0,0,0,.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            flexShrink: 0,
            background: 'linear-gradient(135deg,#fef2f2,#fff5f5)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg,#dc2626,#991b1b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <IcoDoc />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>Enquête Accident du Travail</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: readOnly ? '#0369a1' : '#9ca3af', marginTop: 2 }}>
              {readOnly ? 'Consultation' : 'Saisie'}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {a?.collaborateur_nom || '—'} · {a?.collaborateur_matricule || '—'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: 8,
              border: '1.5px solid #e5e7eb',
              background: 'white',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            <IcoClose />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Chargement de l’enquête…</div>
          ) : readOnly && !enquete?.id ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: 14 }}>
              Aucune enquête enregistrée pour cet accident.
            </div>
          ) : (
            <>
              {err && (
                <div
                  style={{
                    background: '#fef2f2',
                    color: '#991b1b',
                    padding: '10px 12px',
                    borderRadius: 8,
                    marginBottom: 14,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {err}
                </div>
              )}

              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                Victime (lecture seule)
              </div>
              <div style={{ ...readOnlyBox, marginBottom: 18 }}>
                <div>
                  <strong>Nom :</strong> {a?.collaborateur_nom || '—'}
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Matricule :</strong> {a?.collaborateur_matricule || '—'}
                </div>
              </div>

              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                Complément victime
              </div>
              <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
                  Téléphone victime
                  <input
                    readOnly={readOnly}
                    value={form.telephone_victime}
                    onChange={(e) => handleChange('telephone_victime', e.target.value)}
                    style={{
                      ...inp,
                      marginTop: 4,
                      background: readOnly ? '#f9fafb' : 'white',
                      cursor: readOnly ? 'default' : 'text',
                    }}
                  />
                </label>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
                  Appartenance (service / département)
                  <input
                    readOnly={readOnly}
                    value={form.appartenance}
                    onChange={(e) => handleChange('appartenance', e.target.value)}
                    style={{
                      ...inp,
                      marginTop: 4,
                      background: readOnly ? '#f9fafb' : 'white',
                      cursor: readOnly ? 'default' : 'text',
                    }}
                  />
                </label>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
                  Horaire de travail (ex. 06h–14h)
                  <input
                    readOnly={readOnly}
                    value={form.horaire_travail}
                    onChange={(e) => handleChange('horaire_travail', e.target.value)}
                    style={{
                      ...inp,
                      marginTop: 4,
                      background: readOnly ? '#f9fafb' : 'white',
                      cursor: readOnly ? 'default' : 'text',
                    }}
                  />
                </label>
              </div>

              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                Accident (lecture seule)
              </div>
              <div style={{ ...readOnlyBox, marginBottom: 18, display: 'grid', gap: 8 }}>
                <div>
                  <strong>Date :</strong> {fmtDate(a?.date_accident)}
                </div>
                <div>
                  <strong>Heure :</strong> {a?.heure_accident || '—'}
                </div>
                <div>
                  <strong>Lieu :</strong> {a?.lieu_accident || '—'}
                </div>
                <div>
                  <strong>Siège lésion :</strong> {a?.siege_lesion || '—'}
                </div>
                <div>
                  <strong>Nature lésion :</strong> {a?.nature_lesion || '—'}
                </div>
              </div>

              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                Circonstances
              </div>
              <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
                  Circonstances de l’accident
                  <textarea
                    readOnly={readOnly}
                    value={form.circonstances}
                    onChange={(e) => handleChange('circonstances', e.target.value)}
                    rows={4}
                    style={{
                      ...inp,
                      marginTop: 4,
                      resize: readOnly ? 'none' : 'vertical',
                      lineHeight: 1.5,
                      background: readOnly ? '#f9fafb' : 'white',
                      cursor: readOnly ? 'default' : 'text',
                    }}
                  />
                </label>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
                  Lieu où la victime a été transportée
                  <input
                    readOnly={readOnly}
                    value={form.lieu_transport}
                    onChange={(e) => handleChange('lieu_transport', e.target.value)}
                    style={{
                      ...inp,
                      marginTop: 4,
                      background: readOnly ? '#f9fafb' : 'white',
                      cursor: readOnly ? 'default' : 'text',
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Témoins
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={addTemoin}
                    style={{
                      padding: '6px 12px',
                      border: '1.5px solid #fecaca',
                      background: '#fff7ed',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#c2410c',
                      cursor: 'pointer',
                    }}
                  >
                    + Ajouter un témoin
                  </button>
                )}
              </div>

              {form.temoins.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 13, background: '#fafafa', borderRadius: 9 }}>
                  Aucun témoin ajouté
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {form.temoins.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: readOnly ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr auto',
                        gap: 8,
                        alignItems: 'end',
                        padding: 10,
                        background: '#fafafa',
                        borderRadius: 9,
                        border: '1px solid #f3f4f6',
                      }}
                    >
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>
                        Nom
                        <input
                          readOnly={readOnly}
                          value={t.nom}
                          onChange={(e) => handleTemoin(idx, 'nom', e.target.value)}
                          style={{
                            ...inp,
                            marginTop: 4,
                            background: readOnly ? '#f9fafb' : 'white',
                          }}
                        />
                      </label>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>
                        Matricule
                        <input
                          readOnly={readOnly}
                          value={t.matricule}
                          onChange={(e) => handleTemoin(idx, 'matricule', e.target.value)}
                          style={{
                            ...inp,
                            marginTop: 4,
                            background: readOnly ? '#f9fafb' : 'white',
                          }}
                        />
                      </label>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>
                        CIN
                        <input
                          readOnly={readOnly}
                          value={t.cin}
                          onChange={(e) => handleTemoin(idx, 'cin', e.target.value)}
                          style={{
                            ...inp,
                            marginTop: 4,
                            background: readOnly ? '#f9fafb' : 'white',
                          }}
                        />
                      </label>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>
                        Téléphone
                        <input
                          readOnly={readOnly}
                          value={t.telephone}
                          onChange={(e) => handleTemoin(idx, 'telephone', e.target.value)}
                          style={{
                            ...inp,
                            marginTop: 4,
                            background: readOnly ? '#f9fafb' : 'white',
                          }}
                        />
                      </label>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => removeTemoin(idx)}
                          title="Retirer ce témoin"
                          style={{
                            padding: '8px 10px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: 7,
                            cursor: 'pointer',
                            fontWeight: 800,
                            height: 38,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
            background: '#fafafa',
            flexWrap: 'wrap',
          }}
        >
          {readOnly ? (
            <>
              {enquete?.id != null && (
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 18px',
                    border: '1.5px solid #d1d5db',
                    background: '#f3f4f6',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Imprimer PDF
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 20px',
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                Fermer
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 18px',
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                Annuler
              </button>
              {enquete?.id != null && (
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 14px',
                    border: '1.5px solid #d1d5db',
                    background: '#f9fafb',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  Aperçu PDF
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                style={{
                  padding: '9px 20px',
                  border: 'none',
                  background: saving || loading ? '#fca5a5' : 'linear-gradient(135deg,#dc2626,#991b1b)',
                  color: 'white',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving || loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(220,38,38,.25)',
                }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer l’enquête'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
