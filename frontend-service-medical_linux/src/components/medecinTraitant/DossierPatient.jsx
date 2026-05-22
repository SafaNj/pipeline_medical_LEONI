// src/components/medecinTraitant/DossierPatient.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  creerConsultation,
  creerCertificat,
  getCertificatsAptitudeGeneraleByConsultation,
  getCertificatsBonneSanteByConsultation,
  getCertificatsExemptionByConsultation,
  getCertificatsPermisByConsultation,
  getCertificatsPrenuptialByConsultation,
  updateConsultation,
  updateCertificat,
  getConsultationsByCollaborateur,
} from '../../api/consultationsApi';
import { getSites } from '../../api/sitesApi';
import { getDossierByCollaborateur } from '../../api/medicalRecordsApi';
import { listDocumentsMedicauxScannes, TYPE_FICHE_MEDICALE, TYPE_DOSSIER_MEDICAL } from '../../api/documentsMedicauxScannesApi';
import TabOrdonnance from './Tabordonnance';
import TabCertificatsMedicaux from './TabCertificatsMedicaux';
import PrintCertificatMedical from './Printcertificatmedical';
import EnteteMaladiesChroniques, { resolveCollaborateurId as resolveCollabPourMc } from '../common/EnteteMaladiesChroniques';
import { useAuth } from '../../context/AuthContext';

/* ─── Helpers ─────────────────────────────────────────────── */
const getNom = (item) =>
  item?.collaborateur_nom ||
  (item?.collaborateur && typeof item.collaborateur === 'object'
    ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
    : `Patient #${item?.collaborateur}`);

const getCollaborateurId = (item) => {
  if (!item?.collaborateur) return null;
  if (typeof item.collaborateur === 'object') return item.collaborateur.id;
  return item.collaborateur;
};

// Champs pro du collaborateur (maintenant exposés par le serializer)
const getMatricule   = (item) => item?.collaborateur_matricule   || (typeof item?.collaborateur === 'object' ? item.collaborateur.matricule   : null);
const getDepartment  = (item) => item?.collaborateur_department  || (typeof item?.collaborateur === 'object' ? item.collaborateur.department  : null);
const getPoste       = (item) => item?.collaborateur_poste       || (typeof item?.collaborateur === 'object' ? item.collaborateur.poste       : null);

const getInitials = (nom) =>
  (nom || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const fmtDatetime = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';


/* ─── Icônes SVG ─────────────────────────────────────────── */
const SvgUser = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const SvgAlert = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const SvgClipboard = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const SvgShield = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const SvgStethoscope = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6h0a6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/>
  </svg>
);
const SvgPill = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M10.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v7"/><path d="M13 11l2 2"/><path d="M15 16l2 2"/><path d="M17 14l2 2"/><circle cx="18" cy="18" r="3"/>
  </svg>
);
const SvgDoc = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
);
const SvgClock = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SvgFolder = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);
const SvgCalendar = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SvgRefresh = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

/* ─── Tab Button ─────────────────────────────────────────── */
function TabBtn({ icon, label, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 16px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        borderBottom: active ? '3px solid #0284c7' : '3px solid transparent',
        background: 'none', fontWeight: active ? 700 : 600,
        color: active ? '#0284c7' : (disabled ? '#cbd5e1' : '#64748b'),
        fontSize: 13, transition: 'all .15s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.color = '#0284c7'; }}
      onMouseLeave={e => { if (!active && !disabled) e.currentTarget.style.color = '#64748b'; }}
    >
      {icon} {label}
    </button>
  );
}

/* ─── Error Box ──────────────────────────────────────────── */
function ErrorBox({ msg }) {
  return msg ? (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca',
      color: '#b91c1c', padding: '10px 14px',
      borderRadius: 10, fontSize: 13, marginBottom: 16,
    }}>
      {msg}
    </div>
  ) : null;
}

/* ─── Submit Button ──────────────────────────────────────── */
function SubmitBtn({ label, onClick, disabled, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '11px 28px', border: 'none', borderRadius: 10,
        background: disabled ? '#e2e8f0' : 'linear-gradient(135deg,#0369a1,#0ea5e9)',
        color: disabled ? '#94a3b8' : 'white',
        fontSize: 14, fontWeight: 700, cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all .2s', opacity: loading ? 0.75 : 1,
        boxShadow: disabled ? 'none' : '0 4px 14px rgba(2,132,199,.35)',
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      {loading ? 'Enregistrement…' : label}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 1 — NOUVELLE CONSULTATION
════════════════════════════════════════════════════════════ */
function TabConsultation({ item, onCreated, onUpdated }) {
  const { user } = useAuth();
  const [diagnostic, setDiagnostic] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const [isEditing,  setIsEditing]  = useState(false);
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  const prevConsultItemId = useRef(item?.id);
  if (prevConsultItemId.current !== item?.id) {
    prevConsultItemId.current = item?.id;
    setDiagnostic('');
    setError('');
    setSuccess(false);
    setIsEditing(false);
  }

  const alreadyDone  = item?.statut === 'EFFECTUEE';
  const consultation = item?.consultation;

  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      setLoadingSites(true);
      try {
        const data = await getSites();
        if (!cancelled) setSites(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSites([]);
      } finally {
        if (!cancelled) setLoadingSites(false);
      }
    };

    loadSites();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const consultationSite = consultation?.site?.id ?? consultation?.site?.site_id ?? consultation?.site;
    if (consultationSite !== null && consultationSite !== undefined && consultationSite !== '') {
      setSelectedSiteId(String(consultationSite));
      return;
    }
    if (user?.site_id) {
      setSelectedSiteId(String(user.site_id));
      return;
    }
    if (sites.length === 1) {
      const onlyId = sites[0]?.id ?? sites[0]?.site_id ?? sites[0]?.pk;
      if (onlyId !== null && onlyId !== undefined && onlyId !== '') {
        setSelectedSiteId(String(onlyId));
      }
    }
  }, [consultation, user, sites]);

  if (alreadyDone && consultation && !isEditing) {
    return (
      <div style={{
        background: '#e0f2fe', border: '1px solid #bae6fd',
        borderRadius: 12, padding: '18px 20px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0c4a6e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
           Consultation enregistrée — {fmtDatetime(consultation.date_consultation)}
        </div>
        <p style={{ fontSize: 14, color: '#0c4a6e', lineHeight: 1.7 }}>
          {consultation.diagnostic}
        </p>
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => {
              setDiagnostic(consultation.diagnostic || '');
              setIsEditing(true);
            }}
            style={{
              padding: '8px 14px', borderRadius: 8,
              border: '1.5px solid #0ea5e9', background: 'white',
              color: '#0284c7', fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Modifier consultation
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!diagnostic.trim()) { setError('Le diagnostic est obligatoire.'); return; }
    if (!selectedSiteId) { setError('Le champ site est obligatoire.'); return; }

    const sitePayload = Number.isNaN(Number(selectedSiteId)) ? selectedSiteId : Number(selectedSiteId);

    setError(''); setLoading(true);
    try {
      const c = isEditing && consultation?.id
        ? await updateConsultation(consultation.id, { diagnostic: diagnostic.trim(), site: sitePayload })
        : await creerConsultation({ item_passage: item.id, diagnostic: diagnostic.trim(), site: sitePayload });
      setSuccess(true);
      if (isEditing) {
        onUpdated(c);
        setIsEditing(false);
      } else {
        onCreated(c);
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || Object.values(data ?? {}).flat().join(' ') || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        background: '#e0f2fe', border: '1px solid #bae6fd',
        borderRadius: 12, padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}></div>
        <p style={{ fontWeight: 700, color: '#0c4a6e', fontSize: 15 }}>
          Consultation enregistrée avec succès !
        </p>
      </div>
    );
  }

  return (
    <div>
      <ErrorBox msg={error} />
      <div style={sectionStyle}>
        <div style={sectionTitle}>Diagnostic *</div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Motif de consultation</label>
          <input
            type="text"
            placeholder="Ex: Maux de tête, fièvre…"
            defaultValue={item?.motif || ''}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#0284c7'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Site *</label>
          <select
            value={selectedSiteId}
            onChange={e => setSelectedSiteId(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#0284c7'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            disabled={loadingSites || loading}
          >
            <option value="">{loadingSites ? 'Chargement des sites...' : 'Choisir un site'}</option>
            {sites.map((site) => {
              const id = site?.id ?? site?.site_id ?? site?.pk;
              const nom = site?.nom ?? site?.site_nom ?? site?.name ?? `Site #${id}`;
              return (
                <option key={String(id)} value={String(id)}>
                  {nom}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Diagnostic principal *</label>
          <textarea
            value={diagnostic}
            onChange={e => setDiagnostic(e.target.value)}
            placeholder="Description complète du diagnostic médical..."
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = '#0284c7'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
      </div>
      <SubmitBtn
        label={isEditing ? 'Enregistrer la modification' : 'Valider la consultation'}
        onClick={handleSubmit}
        disabled={!diagnostic.trim()}
        loading={loading}
      />
    </div>
  );
}

/* TabOrdonnance importé depuis ./TabOrdonnance.jsx */

/* ════════════════════════════════════════════════════════════
   TAB 3 — CERTIFICAT
════════════════════════════════════════════════════════════ */
function TabCertificat({ item, onCreated, onUpdated }) {
  const { user } = useAuth();
  const [jours,   setJours]   = useState('');
  const [debut,   setDebut]   = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [editingCertId, setEditingCertId] = useState(null);
  const [editingCertData, setEditingCertData] = useState(null);
  const consultation = item?.consultation;

  const prenomAr =
    user?.prenom_ar ||
    user?.first_name_ar ||
    user?.firstname_ar ||
    user?.firstNameAr ||
    user?.prenomAr ||
    '';

  const nomAr =
    user?.nom_ar ||
    user?.last_name_ar ||
    user?.lastname_ar ||
    user?.lastNameAr ||
    user?.nomAr ||
    '';

  const nomArabeComplet =
    user?.full_name_ar ||
    user?.fullNameAr ||
    user?.nom_arabe ||
    `${prenomAr} ${nomAr}`.trim();

  const medecin = {
    nom:        user?.full_name || user?.nom || `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    nom_ar:     nomAr,
    prenom_ar:  prenomAr,
    nom_arabe:  nomArabeComplet,
    titre:      user?.titre      || 'Docteur',
    specialite: user?.specialite || 'Médecine Générale',
    ville:      user?.ville      || 'Menzel Hayet',
  };

  const prevCertifItemId = useRef(item?.id);
  if (prevCertifItemId.current !== item?.id) {
    prevCertifItemId.current = item?.id;
    setJours('');
    setError('');
    setSuccess(false);
  }

  const dateFin = jours && debut
    ? new Date(new Date(debut).getTime() + (parseInt(jours) - 1) * 86400000)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (!consultation) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 20px',
        background: '#fff7ed', border: '1.5px dashed #fed7aa',
        borderRadius: 12, color: '#92400e',
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}></div>
        <p style={{ fontWeight: 700 }}>Consultation requise</p>
        <p style={{ fontSize: 13, marginTop: 6, color: '#b45309' }}>
          Créez d'abord une consultation pour ce patient avant d'ajouter un certificat.
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!jours || parseInt(jours) < 1) { setError('Nombre de jours invalide.'); return; }
    if (!debut) { setError('Date de début obligatoire.'); return; }
    setError(''); setLoading(true);
    try {
      const payload = {
        jours_repos: parseInt(jours),
        date_debut_repos: debut,
      };
      const c = editingCertId
        ? await updateCertificat(editingCertId, payload)
        : await creerCertificat({ consultation: consultation.id, ...payload });
      setSuccess(true);
      if (editingCertId) {
        setEditingCertData(c);
        setJours(String(c?.jours_repos ?? jours));
        setDebut(String(c?.date_debut_repos || debut).split('T')[0]);
        onUpdated(c);
        setEditingCertId(null);
      } else {
        // Conserver les valeurs saisies/après réponse backend pour l'impression immédiate.
        setEditingCertData(c);
        setJours(String(c?.jours_repos ?? jours));
        setDebut(String(c?.date_debut_repos || debut).split('T')[0]);
        onCreated(c);
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || Object.values(data ?? {}).flat().join(' ') || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{
        background: '#dbeafe', borderLeft: '4px solid #0ea5e9',
        padding: '10px 14px', borderRadius: 8, marginBottom: 20,
        fontSize: 13, color: '#0c4a6e',
      }}>
         <strong>Certificat médical</strong> — Les noms du médecin et du collaborateur seront remplis automatiquement.
      </div>
      <ErrorBox msg={error} />
      {success && (
        <div style={{
          background: '#e0f2fe', border: '1px solid #bae6fd',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          fontSize: 13, color: '#0c4a6e', fontWeight: 600,
        }}>
           Certificat créé avec succès !
        </div>
      )}
      {consultation.certificats?.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitle}> Certificats existants</div>
          {consultation.certificats.map(c => (
            <div key={c.id} style={{
              background: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: 8, padding: '10px 14px', marginBottom: 8,
              fontSize: 13, color: '#0369a1',
            }}>
               {c.jours_repos} jour{c.jours_repos > 1 ? 's' : ''} — du {fmtDate(c.date_debut_repos)}
              <div style={{ fontSize: 11, color: '#7dd3fc', marginTop: 4 }}>Dr. {c.nom_prenom_medecin}</div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => {
                    setEditingCertId(c.id);
                    setEditingCertData(c);
                    setJours(String(c.jours_repos || ''));
                    setDebut(String(c.date_debut_repos || '').split('T')[0]);
                    setSuccess(false);
                    setError('');
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 7,
                    border: '1.5px solid #7dd3fc', background: 'white',
                    color: '#0284c7', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={sectionStyle}>
        <div style={sectionTitle}>{editingCertId ? 'Modification certificat' : 'Arrêt de travail'}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Nombre de jours de repos *</label>
            <input
              type="number" min="1"
              value={jours} onChange={e => setJours(e.target.value)}
              placeholder="Ex: 3"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0284c7'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div>
            <label style={labelStyle}>Date de début *</label>
            <input
              type="date"
              value={debut} onChange={e => setDebut(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0284c7'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>
        {dateFin && (
          <div style={{
            background: '#e0f2fe', border: '1px solid #bae6fd',
            borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0c4a6e',
          }}>
             Repos du <strong>{new Date(debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</strong> au <strong>{dateFin}</strong>
            {' '}({jours} jour{parseInt(jours) > 1 ? 's' : ''})
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
        {/* Bouton Imprimer EN PREMIER */}
        <div>
          {(() => {
            const certs = consultation?.certificats || [];
            const dernierCertif = editingCertData || certs[certs.length - 1];
            const joursImpression  = Number(jours || dernierCertif?.jours_repos || 0);
            const debutImpression  = debut || String(dernierCertif?.date_debut_repos || '').split('T')[0];
            return (
              <PrintCertificatMedical
                medecin={medecin}
                data={{
                  patientNom: item?.collaborateur_nom || '',
                  patientCin: item?.collaborateur_cin || '',
                  jours:      joursImpression,
                  dateDebut:  debutImpression,
                }}
                siteConfig={consultation}
              />
            );
          })()}
        </div>

        {/* Bouton Créer EN DEUXIÈME */}
        <SubmitBtn
          label={editingCertId ? 'Enregistrer la modification' : 'Créer le certificat'}
          onClick={handleSubmit}
          disabled={!jours || !debut}
          loading={loading}
        />
      </div>
    </div>
  );
}

/* 
   TAB 4 — HISTORIQUE  (tout l'historique + mise à jour auto)
 */
function TabHistorique({ item, refreshTrigger }) {
  const [consultations, setConsultations] = useState([]);
  const [certifsMedicauxByConsultation, setCertifsMedicauxByConsultation] = useState({});
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const collaborateurId = getCollaborateurId(item);

  const loadHistorique = useCallback(async () => {
    if (!collaborateurId) return;
    setLoading(true); setError('');
    try {
      const data = await getConsultationsByCollaborateur(collaborateurId);
      // Trier du plus récent au plus ancien
      const sorted = [...data].sort(
        (a, b) => new Date(b.date_consultation) - new Date(a.date_consultation)
      );
      setConsultations(sorted);

      const certifsEntries = await Promise.all(
        sorted.map(async (c) => {
          try {
            const [aptitude, bonneSante, exemption, permis, prenuptial] = await Promise.all([
              getCertificatsAptitudeGeneraleByConsultation(c.id),
              getCertificatsBonneSanteByConsultation(c.id),
              getCertificatsExemptionByConsultation(c.id),
              getCertificatsPermisByConsultation(c.id),
              getCertificatsPrenuptialByConsultation(c.id),
            ]);

            return [c.id, {
              aptitude,
              bonneSante,
              exemption,
              permis,
              prenuptial,
            }];
          } catch {
            return [c.id, {
              aptitude: [],
              bonneSante: [],
              exemption: [],
              permis: [],
              prenuptial: [],
            }];
          }
        })
      );

      setCertifsMedicauxByConsultation(Object.fromEntries(certifsEntries));
    } catch {
      setError('Impossible de charger l\'historique.');
    } finally {
      setLoading(false);
    }
  }, [collaborateurId]);

  // Chargement initial + rechargement quand patient change ou nouvelle consultation créée
  useEffect(() => { loadHistorique(); }, [loadHistorique, refreshTrigger]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div style={{ paddingLeft: 36, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: '#e2e8f0' }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{
              position: 'absolute', left: -28, top: 6,
              width: 18, height: 18, borderRadius: '50%',
              background: '#e2e8f0',
            }} />
            <div style={{
              height: 110, borderRadius: 10,
              background: 'linear-gradient(90deg,#f8fafc 25%,#f1f5f9 50%,#f8fafc 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          </div>
        ))}
      </div>
    );
  }

  /* ── Erreur ── */
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#b91c1c' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}></div>
        <p style={{ fontWeight: 600 }}>{error}</p>
        <button
          onClick={loadHistorique}
          style={{
            marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none',
            background: '#0284c7', color: 'white', fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  /* ── Vide ── */
  if (consultations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}></div>
        <p style={{ fontWeight: 600, fontSize: 14 }}>Aucune consultation enregistrée</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>L'historique de ce patient est vide.</p>
      </div>
    );
  }

  /* ── Timeline ── */
  return (
    <div>
      {/* Compteur */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
           {consultations.length} consultation{consultations.length > 1 ? 's' : ''} au total
        </span>
        <button
          onClick={loadHistorique}
          title="Actualiser"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: 'white',
            color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#0284c7'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <SvgRefresh/>
          Actualiser
        </button>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 36 }}>
        {/* Ligne verticale */}
        <div style={{
          position: 'absolute', left: 8, top: 0, bottom: 0,
          width: 2, background: '#e2e8f0',
        }} />

        {consultations.map((c, idx) => {
          const meds = c.ordonnances?.length
            ? c.ordonnances
                .flatMap((o) => Array.isArray(o.lignes) ? o.lignes : (Array.isArray(o.lignes_ordonnance) ? o.lignes_ordonnance : []))
                .map((l) =>
                  l?.texte
                  || l?.medicament_info?.nom
                  || l?.medicament_info?.nom_commercial
                  || l?.medicament_nom
                  || l?.nom_medicament
                  || l?.medicament
                  || ''
                )
                .filter(Boolean)
                .join(', ')
            : null;
          const arret = c.certificats?.length
            ? `${c.certificats[0].jours_repos} jour${c.certificats[0].jours_repos > 1 ? 's' : ''}`
            : 'Aucun';
          const isToday = new Date(c.date_consultation).toDateString() === new Date().toDateString();
          const certifsMedicaux = certifsMedicauxByConsultation[c.id] || {
            aptitude: [],
            bonneSante: [],
            exemption: [],
            permis: [],
            prenuptial: [],
          };
          const hasCertifsMedicaux =
            certifsMedicaux.aptitude.length > 0 ||
            certifsMedicaux.bonneSante.length > 0 ||
            certifsMedicaux.exemption.length > 0 ||
            certifsMedicaux.permis.length > 0 ||
            certifsMedicaux.prenuptial.length > 0;

          return (
            <div key={c.id} style={{ position: 'relative', marginBottom: 16 }}>

              {/* Dot timeline */}
              <div style={{
                position: 'absolute', left: -28, top: 6,
                width: 18, height: 18, borderRadius: '50%',
                background: isToday ? '#0284c7' : '#94a3b8',
                border: '3px solid white',
                boxShadow: isToday
                  ? '0 2px 6px rgba(2,132,199,.4)'
                  : '0 1px 3px rgba(0,0,0,.1)',
              }} />

              {/* Card consultation */}
              <div style={{
                background: 'white',
                border: `1px solid ${isToday ? '#bae6fd' : '#e5e7eb'}`,
                borderRadius: 10, padding: '14px 18px',
                boxShadow: isToday
                  ? '0 2px 8px rgba(2,132,199,.1)'
                  : '0 1px 3px rgba(0,0,0,.04)',
              }}>

                {/* Badge "Aujourd'hui" */}
                {isToday && (
                  <span style={{
                    display: 'inline-block', marginBottom: 8,
                    padding: '2px 10px', borderRadius: 20,
                    background: '#e0f2fe', border: '1px solid #bae6fd',
                    color: '#0c4a6e', fontSize: 11, fontWeight: 700,
                  }}>
                    Aujourd'hui
                  </span>
                )}

                {/* Date */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontSize: 13, color: '#0284c7', fontWeight: 700, marginBottom: 6,
                }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8"  y1="2" x2="8"  y2="6" />
                    <line x1="3"  y1="10" x2="21" y2="10" />
                  </svg>
                  {fmtDate(c.date_consultation)}
                </div>

                {/* Titre */}
                <div style={{
                  fontSize: 14.5, fontWeight: 700, color: '#111827', marginBottom: 12,
                }}>
                  Consultation Générale
                </div>

                {/* Infos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <InfoLine label="Diagnostic"  value={c.diagnostic} />
                  <InfoLine label="Médicaments" value={meds || '—'} />
                  <InfoLine label="Médecin"     value={`Dr. ${c.medecin_nom || '—'}`} />
                  <InfoLine label="Arrêt"       value={arret} />
                </div>

                {/* Détail certificats */}
                {c.certificats?.length > 0 && (
                  <div style={{
                    marginTop: 12, paddingTop: 10,
                    borderTop: '1px dashed #e2e8f0',
                    display: 'flex', flexWrap: 'wrap', gap: 6,
                  }}>
                    {c.certificats.map(cert => (
                      <span key={cert.id} style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 12,
                        background: '#f0f9ff', border: '1px solid #bae6fd',
                        color: '#0369a1', fontWeight: 600,
                      }}>
                         {cert.jours_repos}j — {fmtDate(cert.date_debut_repos)}
                      </span>
                    ))}
                  </div>
                )}

                {hasCertifsMedicaux && (
                  <div style={{
                    marginTop: 10,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}>
                    {certifsMedicaux.aptitude.length > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: '#e0f2fe', border: '1px solid #7dd3fc', color: '#075985', fontWeight: 700 }}>
                        Aptitude ({certifsMedicaux.aptitude.length})
                      </span>
                    )}
                    {certifsMedicaux.bonneSante.length > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: '#ecfeff', border: '1px solid #67e8f9', color: '#0e7490', fontWeight: 700 }}>
                        Bonne santé ({certifsMedicaux.bonneSante.length})
                      </span>
                    )}
                    {certifsMedicaux.exemption.length > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', fontWeight: 700 }}>
                        Exemption ({certifsMedicaux.exemption.length})
                      </span>
                    )}
                    {certifsMedicaux.permis.length > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontWeight: 700 }}>
                        Permis ({certifsMedicaux.permis.length})
                      </span>
                    )}
                    {certifsMedicaux.prenuptial.length > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', fontWeight: 700 }}>
                        Prénuptial ({certifsMedicaux.prenuptial.length})
                      </span>
                    )}
                  </div>
                )}

                {/* Détail ordonnances (si >1) */}
                {c.ordonnances?.length > 1 && (
                  <div style={{
                    marginTop: 10, paddingTop: 10,
                    borderTop: '1px dashed #e2e8f0',
                    display: 'flex', flexDirection: 'column', gap: 5,
                  }}>
                    {c.ordonnances.map(o => (
                      <div key={o.id} style={{
                        fontSize: 12.5, color: '#1e3a8a',
                        background: '#e0f2fe', border: '1px solid #dbeafe',
                        borderRadius: 7, padding: '5px 10px',
                        whiteSpace: 'pre-line',
                      }}>
                        {Array.isArray(o.lignes) && o.lignes.length > 0
                          ? o.lignes.map(l => l?.texte).filter(Boolean).join(', ')
                          : '—'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
      <strong style={{ color: '#111827' }}>{label} :</strong>{' '}
      <span>{value || '—'}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 5 — DOSSIER MÉDICAL
════════════════════════════════════════════════════════════ */
function TabDossierMedical({ item }) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const collaborateurId = getCollaborateurId(item);

  useEffect(() => {
    if (!collaborateurId) return;
    setDossier(null); setError('');
    setLoading(true);
    getDossierByCollaborateur(collaborateurId)
      .then(data => setDossier(data))
      .catch(() => setError('Impossible de charger le dossier médical.'))
      .finally(() => setLoading(false));
  }, [collaborateurId]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[120, 90, 140, 100].map((h, i) => (
          <div key={i} style={{
            height: h, borderRadius: 12,
            background: 'linear-gradient(90deg,#f8fafc 25%,#e0f2fe 50%,#f8fafc 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
          }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 20px',
        background: '#fef2f2', border: '1.5px dashed #fca5a5',
        borderRadius: 12, color: '#b91c1c',
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}></div>
        <p style={{ fontWeight: 700 }}>Erreur de chargement</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>{error}</p>
      </div>
    );
  }

  if (!dossier) return null;

  const age = dossier.date_naissance
    ? Math.floor((new Date() - new Date(dossier.date_naissance)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div>

      {/* ══ SECTION IDENTITÉ ══ */}
      <DossierSection icon={<SvgUser/>} title="Identité" accent="#0284c7">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 12 }}>
          <InfoCard label="Nom complet"
            value={`${dossier.nom} ${dossier.prenom}`}
            icon={null} accent="#0284c7" />
          {age !== null && (
            <InfoCard label="Âge"
              value={`${age} ans`}
              sub={fmtDate(dossier.date_naissance)}
              icon={null} accent="#0284c7" />
          )}
          {dossier.lieu_naissance && (
            <InfoCard label="Lieu de naissance"
              value={dossier.lieu_naissance}
              icon={null} accent="#0891b2" />
          )}
          {dossier.groupe_sanguin && (
            <InfoCard label="Groupe sanguin"
              value={dossier.groupe_sanguin}
              icon={null} accent="#dc2626"
              highlight={{ bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }} />
          )}
        </div>
        {dossier.adresse && (
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '9px 13px',
            fontSize: 13, color: '#374151',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 14, marginTop: 1 }}></span>
            <span><strong style={{ color: '#0c4a6e' }}>Adresse :</strong> {dossier.adresse}</span>
          </div>
        )}
      </DossierSection>

      {/* ══ SECTION ALLERGIES & HABITUDES ══ */}
      <DossierSection icon={<SvgAlert/>} title="Allergies & Habitudes" accent="#dc2626">
        {dossier.allergies ? (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fecaca',
            borderRadius: 10, padding: '13px 16px', marginBottom: 14,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}></span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                Allergies connues
              </div>
              <div style={{ fontSize: 13.5, color: '#7f1d1d', lineHeight: 1.6 }}>
                {dossier.allergies}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#e0f2fe', border: '1px solid #bae6fd',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            fontSize: 13, color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Aucune allergie connue
          </div>
        )}

        {/* Badges habitudes */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <HabitBadge label="Tabac"          active={dossier.tabac}          color="#dc2626" />
          <HabitBadge label="Alcool"         active={dossier.alcool}         color="#d97706" />
          <HabitBadge label="Automédication" active={dossier.automedication} color="#0284c7" />
        </div>
      </DossierSection>

      {/* ══ SECTION ANTÉCÉDENTS ══ */}
      <DossierSection icon={<SvgClipboard/>} title="Antécédents médicaux" accent="#0891b2">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <AntecedentCard label="Médicaux"     value={dossier.antecedents_medicaux}      color="#0284c7" />
          <AntecedentCard label="Chirurgicaux" value={dossier.antecedents_chirurgicaux}  color="#0284c7" />
          <AntecedentCard label="Gynécologiques" value={dossier.antecedents_gyneco}      color="#db2777" />
          <AntecedentCard label="Familiaux"    value={dossier.antecedents_familiaux}     color="#0891b2" />
        </div>
      </DossierSection>

      {/* ══ SECTION VACCINATIONS ══ */}
      <DossierSection icon={<SvgShield/>} title="Vaccinations" accent="#0284c7">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <VaccinCard label="Tuberculose" date={dossier.vaccin_tuberculose} />
          <VaccinCard label="Tétanos"     date={dossier.vaccin_tetanos} />
          <VaccinCard label="Hépatite"    date={dossier.vaccin_hepatite} />
        </div>
        {dossier.autres_vaccins && (
          <div style={{
            marginTop: 10, background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '9px 13px', fontSize: 13, color: '#374151',
          }}>
            <strong style={{ color: '#0c4a6e' }}>Autres : </strong>{dossier.autres_vaccins}
          </div>
        )}
      </DossierSection>

      {/* Métadonnées */}
      <div style={{
        fontSize: 11.5, color: '#94a3b8', textAlign: 'right',
        padding: '4px 2px', marginTop: 4,
      }}>
        Dossier créé le {fmtDate(dossier.date_creation)}
        {dossier.date_modification !== dossier.date_creation && ` · Modifié le ${fmtDate(dossier.date_modification)}`}
      </div>
    </div>
  );
}

/* ─── Sous-composants dossier ─────────────────────────────── */

function DossierSection({ icon, title, accent, children }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      marginBottom: 14,
      overflow: 'hidden',
    }}>
      {/* Header de section */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '11px 16px',
        background: '#f8fafc',
        borderBottom: '1px solid #f1f5f9',
        borderLeft: `4px solid ${accent}`,
      }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0c4a6e', letterSpacing: '-0.2px' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {children}
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub, icon, accent, highlight }) {
  if (!value) return null;
  return (
    <div style={{
      background: highlight ? highlight.bg : 'white',
      border: `1px solid ${highlight ? highlight.border : '#e2e8f0'}`,
      borderRadius: 10, padding: '11px 14px',
      borderTop: `3px solid ${highlight ? highlight.color : accent}`,
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: highlight ? highlight.color : '#0c4a6e', lineHeight: 1.3 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function HabitBadge({ label, active, color, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 10,
      background: active ? `${color}10` : '#f8fafc',
      border: `1.5px solid ${active ? `${color}30` : '#e2e8f0'}`,
      minWidth: 120,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? color : '#94a3b8' }}>
          {label}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600,
          color: active ? color : '#cbd5e1',
        }}>
          {active ? '● Oui' : '○ Non'}
        </div>
      </div>
    </div>
  );
}

function AntecedentCard({ label, value, color }) {
  return (
    <div style={{
      background: value ? `${color}06` : '#f8fafc',
      border: `1px solid ${value ? `${color}20` : '#f1f5f9'}`,
      borderRadius: 10, padding: '11px 14px',
      borderLeft: `3px solid ${value ? color : '#e2e8f0'}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: value ? color : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, lineHeight: 1.6,
        color: value ? '#1e293b' : '#cbd5e1',
        fontStyle: value ? 'normal' : 'italic',
      }}>
        {value || 'Aucun antécédent'}
      </div>
    </div>
  );
}

function VaccinCard({ label, date }) {
  const done = !!date;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: done ? '#e0f2fe' : '#f8fafc',
      border: `1px solid ${done ? '#bae6fd' : '#e2e8f0'}`,
      borderRadius: 10, padding: '10px 14px',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: done ? '#0284c7' : '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        {done ? '' : ''}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: done ? '#0c4a6e' : '#64748b' }}>
          {label}
        </div>
        <div style={{ fontSize: 11.5, color: done ? '#0284c7' : '#94a3b8', marginTop: 2, fontWeight: done ? 600 : 400 }}>
          {done ? fmtDate(date) : 'Non renseigné'}
        </div>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   TAB 6 — FICHES SCANNÉES (PDF/Images uploadées par infirmier)
════════════════════════════════════════════════════════════ */
function TabFichesScannees({ item }) {
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [selected,   setSelected]   = useState(null);
  // blobUrl : { id, url, mimeType } — blob chargé via axios+token pour éviter le blocage iframe
  const [blobUrl,    setBlobUrl]    = useState(null);
  const [blobLoading,setBlobLoading]= useState(false);
  const [blobError,  setBlobError]  = useState('');
  const blobUrlRef = useRef(null); // pour révoquer l'ancien blob

  const collaborateurId = getCollaborateurId(item);
  const matricule       = getMatricule(item);

  /* ── Charger la liste des documents ── */
  const loadDocs = useCallback(async () => {
    if (!collaborateurId && !matricule) return;
    setLoading(true); setError('');
    try {
      const params = {};
      if (collaborateurId) params.collaborateur = collaborateurId;
      else if (matricule)  params.matricule_ref  = matricule;
      const res = await listDocumentsMedicauxScannes(params);
      const all = res.results || [];
      const filtered = all.filter(d =>
        d.type_document === TYPE_FICHE_MEDICALE || d.type_document === TYPE_DOSSIER_MEDICAL
      );
      setDocs(filtered);
      if (filtered.length > 0) setSelected(filtered[0]);
    } catch {
      setError('Impossible de charger les documents.');
    } finally {
      setLoading(false);
    }
  }, [collaborateurId, matricule]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  /* ── Charger le blob du document sélectionné (avec token JWT) ── */
  useEffect(() => {
    if (!selected) { setBlobUrl(null); return; }
    // Révoquer l'ancien blob URL pour éviter les fuites mémoire
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
    setBlobError('');
    setBlobLoading(true);

    const token = localStorage.getItem('token');
    // Construire l'URL absolue
    const fileUrl = selected.fichier.startsWith('http')
      ? selected.fichier
      : `http://localhost:8000${selected.fichier}`;

    fetch(fileUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        // Forcer le bon type MIME selon extension
        const ext = (selected.fichier.split('.').pop() || '').toLowerCase();
        const mimeMap = { pdf:'application/pdf', jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', webp:'image/webp' };
        const mime = mimeMap[ext] || blob.type || 'application/octet-stream';
        const typedBlob = new Blob([blob], { type: mime });
        const url = URL.createObjectURL(typedBlob);
        blobUrlRef.current = url;
        setBlobUrl({ id: selected.id, url, mimeType: mime });
      })
      .catch(e => setBlobError(`Impossible de charger le fichier : ${e.message}`))
      .finally(() => setBlobLoading(false));

    // Cleanup au démontage
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [selected?.id]);

  const isPdf = (doc) => doc?.fichier?.toLowerCase().endsWith('.pdf');
  const isImg = (doc) => /\.(jpg|jpeg|png|gif|webp)$/i.test(doc?.fichier || '');

  const typeLabel = (t) => t === TYPE_FICHE_MEDICALE ? 'Fiche médicale' : t === TYPE_DOSSIER_MEDICAL ? 'Dossier médical' : t;
  /** Toujours des tons bleus (pas de violet) */
  const typeColor = (t) => (t === TYPE_FICHE_MEDICALE ? '#0369a1' : '#0284c7');
  const typeBg = (t) => (t === TYPE_FICHE_MEDICALE ? '#e0f2fe' : '#dbeafe');

  /* ── Téléchargement forcé via blob ── */
  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl.url;
    a.download = selected?.titre || selected?.fichier?.split('/').pop() || 'document';
    a.click();
  };

  /** Ouvre le PDF/image dans un nouvel onglet (blob URL autorisé même avec JWT sur le fetch initial) */
  const handleOpenNewTab = () => {
    if (!blobUrl?.url) return;
    window.open(blobUrl.url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {[80,80,80].map((h,i)=>(
          <div key={i} style={{ height:h,borderRadius:10,background:'linear-gradient(90deg,#f8fafc 25%,#e0f2fe 50%,#f8fafc 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign:'center',padding:'40px 20px',background:'#fef2f2',border:'1.5px dashed #fca5a5',borderRadius:12,color:'#b91c1c' }}>
        <div style={{ fontSize:32,marginBottom:10 }}>⚠️</div>
        <p style={{ fontWeight:700 }}>Erreur de chargement</p>
        <p style={{ fontSize:13,marginTop:6 }}>{error}</p>
        <button onClick={loadDocs} style={{ marginTop:12,padding:'7px 18px',borderRadius:8,border:'none',background:'#0284c7',color:'white',fontWeight:700,fontSize:13,cursor:'pointer' }}>Réessayer</button>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div style={{ textAlign:'center',padding:'48px 24px',background:'#f0f9ff',border:'1.5px dashed #bae6fd',borderRadius:14,color:'#64748b' }}>
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round" style={{ marginBottom:12 }}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        <p style={{ fontWeight:700,fontSize:14,color:'#0c4a6e' }}>Aucun document scanné</p>
        <p style={{ fontSize:13,marginTop:6,color:'#64748b' }}>L'infirmier n'a pas encore uploadé de fiche médicale ou dossier pour ce collaborateur.</p>
      </div>
    );
  }

  return (
    <>
    {/* ════ VUE PRINCIPALE : le scroll est celui du panneau parent (overflow du dossier patient), pas une petite zone interne ════ */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Barre titre + bouton nouvel onglet ── */}
      {selected && (
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'10px 0 12px',flexShrink:0,
          borderBottom:'1px solid #e2e8f0',marginBottom:12,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {/* Icône PDF ou image */}
            {isPdf(selected)
              ? <div style={{ width:36,height:36,borderRadius:9,background:typeBg(selected.type_document),display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={typeColor(selected.type_document)} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
                </div>
              : <div style={{ width:36,height:36,borderRadius:9,background:typeBg(selected.type_document),display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={typeColor(selected.type_document)} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                </div>
            }
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:typeColor(selected.type_document),textTransform:'uppercase',letterSpacing:'.5px' }}>
                {typeLabel(selected.type_document)}
              </div>
              <div style={{ fontSize:13.5,fontWeight:700,color:'#0c4a6e',lineHeight:1.3 }}>
                {selected.titre || selected.fichier?.split('/').pop()}
              </div>
              {selected.date_document && (
                <div style={{ fontSize:11,color:'#94a3b8',marginTop:1 }}>
                  {new Date(selected.date_document).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            {/* Sélecteur si plusieurs docs */}
            {docs.length > 1 && (
              <select
                value={selected.id}
                onChange={e => setSelected(docs.find(d => d.id === Number(e.target.value)))}
                style={{ padding:'6px 10px',borderRadius:8,border:'1px solid #bae6fd',background:'#f0f9ff',color:'#0c4a6e',fontSize:12,fontWeight:600,cursor:'pointer',outline:'none' }}
              >
                {docs.map(d => (
                  <option key={d.id} value={d.id}>{typeLabel(d.type_document)} — {d.titre || d.fichier?.split('/').pop()}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleOpenNewTab}
              disabled={!blobUrl || blobLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 9,
                border: '1.5px solid #0284c7',
                background: '#0284c7',
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                cursor: (!blobUrl || blobLoading) ? 'not-allowed' : 'pointer',
                opacity: (!blobUrl || blobLoading) ? 0.5 : 1,
                transition: 'all .15s',
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Ouvrir dans un nouvel onglet
            </button>
          </div>
        </div>
      )}

      {/* ── Aperçu : grande hauteur, pas de mini-zone scrollable — le défilement = celui du dossier patient entier ── */}
      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          border: '1.5px solid #bae6fd',
          background: '#fff',
          boxShadow: '0 2px 12px rgba(2, 132, 199, 0.08)',
          overflow: 'hidden',
        }}
      >
        {blobLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 14, padding: 32, background: '#f8fafc' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #bae6fd', borderTop: '3px solid #0284c7', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <span style={{ fontSize: 13, color: '#0284c7', fontWeight: 600 }}>Chargement du document…</span>
          </div>
        )}

        {blobError && !blobLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#b91c1c', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>⚠️</div>
            <p style={{ fontWeight: 700 }}>Erreur d&apos;affichage</p>
            <p style={{ fontSize: 13 }}>{blobError}</p>
          </div>
        )}

        {!selected && !blobLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#94a3b8', padding: 40 }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Sélectionnez un document</p>
          </div>
        )}

        {!blobLoading && !blobError && blobUrl && isPdf(selected) && (
          <iframe
            key={blobUrl.id}
            src={`${blobUrl.url}#toolbar=1&navpanes=0&zoom=page-width`}
            style={{
              width: '100%',
              minHeight: '75vh',
              border: 'none',
              display: 'block',
              background: '#e2e8f0',
            }}
            title={selected.titre || 'Document PDF'}
          />
        )}

        {!blobLoading && !blobError && blobUrl && isImg(selected) && (
          <div style={{ padding: 16, background: '#f8fafc', textAlign: 'center' }}>
            <img
              src={blobUrl.url}
              alt={selected.titre || 'Document'}
              style={{ maxWidth: '100%', height: 'auto', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}
            />
          </div>
        )}

        {!blobLoading && !blobError && blobUrl && !isPdf(selected) && !isImg(selected) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#64748b', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>📎</div>
            <p style={{ fontWeight: 600, color: '#0c4a6e', fontSize: 14 }}>Aperçu non disponible pour ce format</p>
            <button type="button" onClick={handleDownload} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0284c7', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Télécharger le fichier
            </button>
          </div>
        )}
      </div>

      {/* ── Mini-liste si plusieurs docs ── */}
      {docs.length > 1 && (
        <div style={{ display:'flex',gap:8,marginTop:12,flexWrap:'wrap',flexShrink:0 }}>
          {docs.map(doc => {
            const isActive = selected?.id === doc.id;
            return (
              <button key={doc.id} onClick={() => setSelected(doc)} style={{
                display:'flex',alignItems:'center',gap:6,
                padding:'6px 12px',borderRadius:8,
                border:`1.5px solid ${isActive ? typeColor(doc.type_document) : '#e2e8f0'}`,
                background: isActive ? typeBg(doc.type_document) : 'white',
                cursor:'pointer',fontSize:12,fontWeight:isActive?700:600,
                color: isActive ? typeColor(doc.type_document) : '#475569',
                transition:'all .12s',
              }}>
                {isPdf(doc)
                  ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                }
                {doc.titre || doc.fichier?.split('/').pop()}
              </button>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL — DOSSIER PATIENT
════════════════════════════════════════════════════════════ */
export default function DossierPatient({ item, onUpdateItem }) {
  const [activeTab,      setActiveTab]      = useState('consult');
  const [refreshTrigger, setRefreshTrigger] = useState(0); // incrémenté après chaque nouvelle consultation

  const prevDossierItemId = useRef(item?.id);
  if (prevDossierItemId.current !== item?.id) {
    prevDossierItemId.current = item?.id;
    // Si patient déjà consulté → rester sur 'consult' pour voir la consultation
    // Si patient en attente → rester sur 'consult' pour créer
    setActiveTab('consult');
    setRefreshTrigger(0);
  }

  if (!item) {
    return (
      <div style={{
        height: '100%', background: 'white', borderRadius: 16,
        border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        color: '#94a3b8',
      }}>
        <svg width={56} height={56} viewBox="0 0 24 24" fill="none"
          stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round">
          <path d="M16 11c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z" />
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
        <p style={{ fontSize: 15, fontWeight: 600 }}>Sélectionnez un patient</p>
        <p style={{ fontSize: 13 }}>Cliquez sur un nom dans la file d'attente</p>
      </div>
    );
  }

  const nom          = getNom(item);
  const initials     = getInitials(nom);
  const isWaiting    = item.statut === 'EN_ATTENTE';
  const consultation = item.consultation;
  const matricule    = getMatricule(item);
  const department   = getDepartment(item);
  const poste        = getPoste(item);

  const handleConsultationCreated = (c) => {
    onUpdateItem({ ...item, statut: 'EFFECTUEE', consultation: c });
    setRefreshTrigger(t => t + 1);
    // Après création consultation → aller direct sur Ordonnance
    setActiveTab('ordonnance');
  };

  const handleOrdonnanceAdded = (o) => {
    const updatedConsult = {
      ...consultation,
      ordonnances: [...(consultation?.ordonnances || []), o],
    };
    onUpdateItem({ ...item, consultation: updatedConsult });
  };

  const handleConsultationUpdated = (c) => {
    onUpdateItem({
      ...item,
      consultation: {
        ...consultation,
        ...c,
      },
    });
  };

  const handleOrdonnanceUpdated = (o) => {
    const updatedConsult = {
      ...consultation,
      ordonnances: (consultation?.ordonnances || []).map((x) => (x.id === o.id ? { ...x, ...o } : x)),
    };
    onUpdateItem({ ...item, consultation: updatedConsult });
  };

  const handleCertificatAdded = (c) => {
    const updatedConsult = {
      ...consultation,
      certificats: [...(consultation?.certificats || []), c],
    };
    onUpdateItem({ ...item, consultation: updatedConsult });
  };

  const handleCertificatUpdated = (c) => {
    const updatedConsult = {
      ...consultation,
      certificats: (consultation?.certificats || []).map((x) => (x.id === c.id ? { ...x, ...c } : x)),
    };
    onUpdateItem({ ...item, consultation: updatedConsult });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: 'white', borderRadius: 16,
      border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      overflow: 'hidden',
    }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header patient ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0c4a6e 0%,#0ea5e9 100%)',
        padding: '20px 26px', flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Cercles décoratifs */}
        <div style={{
          position: 'absolute', right: -30, top: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,.06)',
        }} />
        <div style={{
          position: 'absolute', right: 40, bottom: -40,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,.04)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          {/* Avatar */}
          <div style={{
            width: 54, height: 54, borderRadius: 14, flexShrink: 0,
            background: 'rgba(255,255,255,.2)',
            border: '2px solid rgba(255,255,255,.3)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 20, fontWeight: 800,
          }}>
            {initials}
          </div>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Nom + icône dossier */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}></span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>
                Dossier Médical — {nom}
              </h2>
            </div>

            {/* Ligne info : matricule • département • poste */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 4,
              fontSize: 12.5, color: 'rgba(255,255,255,.85)',
            }}>
              {matricule && (
                <span style={{
                  background: 'rgba(255,255,255,.15)',
                  padding: '2px 8px', borderRadius: 6,
                  fontWeight: 600, letterSpacing: '0.3px',
                }}>
                  {matricule}
                </span>
              )}
              {matricule && department && (
                <span style={{ opacity: 0.5, alignSelf: 'center' }}>•</span>
              )}
              {department && (
                <span>Département: <strong style={{ color: 'white' }}>{department}</strong></span>
              )}
              {department && poste && (
                <span style={{ opacity: 0.5, alignSelf: 'center' }}>•</span>
              )}
              {poste && (
                <span>Poste: <strong style={{ color: 'white' }}>{poste}</strong></span>
              )}
            </div>
          </div>

          {/* Badge statut */}
          <span style={{
            flexShrink: 0,
            padding: '5px 14px', borderRadius: 20,
            background: isWaiting ? 'rgba(251,191,36,.2)' : 'rgba(255,255,255,.2)',
            color: isWaiting ? '#fde68a' : 'white',
            fontSize: 12, fontWeight: 700,
            border: `1px solid ${isWaiting ? 'rgba(251,191,36,.4)' : 'rgba(255,255,255,.3)'}`,
          }}>
            {isWaiting ? 'En attente' : 'Consulté'}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', borderBottom: '2px solid #f1f5f9',
        padding: '0 8px', flexShrink: 0, overflowX: 'auto',
        background: 'white',
      }}>
        <TabBtn icon={<SvgStethoscope/>} label="Consultation"
          active={activeTab === 'consult'}
          onClick={() => setActiveTab('consult')}
        />
        <TabBtn icon={<SvgPill/>} label="Ordonnance"
          active={activeTab === 'ordonnance'}
          onClick={() => setActiveTab('ordonnance')}
          disabled={!consultation}
        />
        <TabBtn icon={<SvgDoc/>} label="Certificat"
          active={activeTab === 'certificat'}
          onClick={() => setActiveTab('certificat')}
        />
        <TabBtn icon={<SvgShield/>} label="Certificats médicaux"
          active={activeTab === 'certif_medicaux'}
          onClick={() => setActiveTab('certif_medicaux')}
        />
        <TabBtn icon={<SvgClock/>} label="Fiche Médicale"
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        />
        {/* ← DOSSIER TAB */}
        <TabBtn icon={<SvgFolder/>} label="Dossier médical"
          active={activeTab === 'dossier'}
          onClick={() => setActiveTab('dossier')}
        />
        {/* ← SCANS INFIRMIER */}
        <TabBtn
          icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="8" y="13" width="8" height="2" rx="1"/><rect x="8" y="17" width="5" height="1.5" rx=".75"/></svg>}
          label="Fiches scannées"
          active={activeTab === 'scans'}
          onClick={() => setActiveTab('scans')}
        />
      </div>

      {/* ── Contenu tab ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px 28px' }}>
        {['consult', 'ordonnance', 'certificat', 'certif_medicaux'].includes(activeTab) && (
          <EnteteMaladiesChroniques collaborateurId={resolveCollabPourMc(item)} style={{ marginBottom: 16 }} />
        )}
        {activeTab === 'consult'    && <TabConsultation  item={item} onCreated={handleConsultationCreated} onUpdated={handleConsultationUpdated} />}
        {activeTab === 'ordonnance' && <TabOrdonnance    item={item} onCreated={handleOrdonnanceAdded} onUpdated={handleOrdonnanceUpdated} />}
        {activeTab === 'certificat' && <TabCertificat    item={item} onCreated={handleCertificatAdded} onUpdated={handleCertificatUpdated} />}
        {activeTab === 'certif_medicaux' && <TabCertificatsMedicaux item={item} />}
        {activeTab === 'history'    && <TabHistorique    item={item} refreshTrigger={refreshTrigger} />}
        {activeTab === 'dossier'    && <TabDossierMedical item={item} />}
        {activeTab === 'scans'      && <TabFichesScannees item={item} />}
      </div>
    </div>
  );
}

/* ─── Styles partagés ─────────────────────────────────────── */
const sectionStyle = {
  background: '#f8fafc', padding: '16px 18px',
  borderRadius: 12, marginBottom: 16,
};
const sectionTitle = {
  fontSize: 13.5, fontWeight: 700, color: '#0c4a6e',
  marginBottom: 14,
};
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#475569', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 7,
};
const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: 9,
  fontSize: 13.5, outline: 'none', color: '#0c4a6e',
  background: 'white', boxSizing: 'border-box',
  transition: 'border-color .15s',
};