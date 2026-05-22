// src/components/medecinControleur/FormulaireContreVisite.jsx
import { useState, useEffect, useCallback } from 'react';
import { printHTML } from '../../utils/printHelper';
import SiteSelectorModal from '../common/SiteSelectorModal';
import EnteteMaladiesChroniques, { resolveCollaborateurId } from '../common/EnteteMaladiesChroniques';
import { useAuth } from '../../context/AuthContext';
import {
  creerContreVisite,
  creerControleMedical,
  saisirVerdict,
  updateContreVisite,
  updateControleMedical,
  supprimerContreVisite,
  getContreVisitesByMatricule,
  getControleMedicalByContreVisite,
} from '../../api/Contrevisiteapi';
import { pickDepartementCollaborateur, displayDepartementControleMedical } from '../../utils/ficheCollaborateur';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { getReposInitial, payloadReposInitial, payloadDureeRepos } from '../../utils/contreVisiteRepos';
import axiosInstance from '../../api/axios';

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDateShort = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const today = () => new Date().toISOString().split('T')[0];
const getNom = (item) =>
  item?.collaborateur_nom ||
  (item?.collaborateur && typeof item.collaborateur === 'object'
    ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
    : '');

const getItemPassageId = (item) => {
  if (!item || typeof item !== 'object') return null;
  const candidates = [
    item.item_passage_id,
    item.item_passage, // sometimes backend returns a numeric FK directly
    item.itemPassageId,
    item.item_passage?.id,
    item.itemPassage?.id,
    item.passage_id,
    item.passageId,
    item.passage?.id,
  ].filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const InfoRow = ({ label, value }) => (
  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', border: '1px solid #e0f2fe' }}>
    <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0c4a6e', marginTop: 2 }}>{value || '—'}</div>
  </div>
);

const normalizeSite = (site) => {
  if (!site) return null;
  return {
    id: site.id ?? site.site_id ?? site.pk ?? null,
    nom: site.nom ?? site.site_nom ?? site.name ?? site.siteName ?? '',
    nom_ar: site.nom_ar ?? site.site_nom_ar ?? site.name_ar ?? '',
    adresse: site.adresse ?? site.site_adresse ?? site.address ?? '',
    telephone: site.telephone ?? site.phone ?? site.site_telephone ?? '',
    raw: site,
  };
};

/* ─── Icônes SVG ─────────────────────────────────────────── */
const Ico = {
  Check: ({ c = '#0284c7', size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Print: ({ c = 'white', size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Plus: ({ c = 'white', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Pencil: ({ c = '#0284c7', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: ({ c = '#dc2626', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  ),
  Eye: ({ c = '#0284c7', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Close: ({ c = 'white', size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Save: ({ c = 'white', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Alert: ({ c = '#d97706', size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  History: ({ c = '#0369a1', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  User: ({ c = 'white', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Calendar: ({ c = '#0369a1', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

/* ─── Styles ────────────────────────────────────────────────── */
const inp = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #bae6fd', borderRadius: 9,
  fontSize: 13, outline: 'none', color: '#0f172a',
  background: 'white', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color .15s',
};
const labelCss = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 5,
};
const Field = ({ label, children }) => (
  <div><label style={labelCss}>{label}</label>{children}</div>
);

/* ════════════════════════════════════════════════════════════
   MODAL CONFIRMATION SUPPRESSION
════════════════════════════════════════════════════════════ */
function ModalConfirmDelete({ titre, texte, onConfirm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 14, padding: '28px 28px 22px', maxWidth: 380, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico.Alert c="#dc2626" size={20} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0c4a6e', marginBottom: 5 }}>{titre}</div>
            <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>{texte}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: '1.5px solid #cbd5e1', background: 'white', color: '#64748b', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            <Ico.Close c="#64748b" /> Annuler
          </button>
          <button onClick={onConfirm} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: 'none', background: '#dc2626', color: 'white', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            <Ico.Trash c="white" /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   GÉNÉRATEUR PDF
════════════════════════════════════════════════════════════ */
function genererPDF(cm, cv, medecinNom, item, userContext, siteContext) {
  const dateEmission = fmtDateShort(cm.date_emission || cv.date || today());
  const collab = item?.collaborateur;
  // On privilégie le site du médecin connecté (userContext) pour le libellé du PDF
  const siteConfig = getSitePrintConfig(userContext, siteContext, cv, cm, item);
  const printVille = siteConfig.siteVille || siteConfig.siteNom || '—';
  const footerCompanySite = siteConfig.footerCompanySite || siteConfig.siteNom || '—';
  const footerService = siteConfig.medicalServiceName || 'Service Médical';
  const nom    = cm.nom || cm.nom_collaborateur || (collab && typeof collab === 'object' ? collab.nom   : item?.collaborateur_nom?.split(' ')[0])  || '';
  const prenom = cm.prenom || cm.prenom_collaborateur || (collab && typeof collab === 'object' ? collab.prenom : item?.collaborateur_nom?.split(' ')[1]) || '';
  const matricule_val = cm.matricule || (collab && typeof collab === 'object' ? collab.matricule : item?.collaborateur_matricule) || '';
  const repos  = cv.duree_repos || cm.repos_prescrit || '';

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Contrôle Médical</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; color: #000; background: white; }
  .page { width: 210mm; height: 297mm; padding: 18mm 24mm 0 24mm; position: relative; overflow: hidden; }
  .titre { text-align: center; font-size: 13.5pt; font-weight: bold; margin-bottom: 12mm; }
  .ligne { margin-bottom: 6mm; font-size: 11.5pt; line-height: 1.5; }
  .ligne-double { display: flex; gap: 18mm; font-size: 11.5pt; margin-bottom: 6mm; }
  .section-avis { margin-top: 10mm; }
  .avis-label { font-size: 11.5pt; margin-bottom: 5mm; }
  .avis-texte { font-size: 11.5pt; line-height: 1.8; white-space: pre-wrap; min-height: 18mm; padding-bottom: 4mm; }
  .cachet { position: absolute; bottom: 50mm; right: 24mm; text-align: right; font-size: 11pt; }
  .footer { position: absolute; bottom: 0; left: 0; right: 0; border-top: 1.5px solid #000; display: flex; justify-content: space-between; padding: 3mm 24mm; font-size: 10.5pt; font-weight: bold; }
  @media print { html,body{width:100%;height:100%;margin:0;padding:0;} .page{width:100%;height:100vh;padding:14mm 20mm 0;} *{-webkit-print-color-adjust:exact!important;} }
</style></head>
<body><div class="page">
  <div class="titre">Contrôle médical</div>
  <div class="ligne">${printVille}, le :&nbsp;&nbsp;${dateEmission}</div>
  <div class="ligne-double">
    <span>Matricule :&nbsp;&nbsp;${matricule_val}</span>
    <span>Segment :&nbsp;&nbsp;${displayDepartementControleMedical(cm) || ''}</span>
  </div>
  <div class="ligne">Nom :&nbsp;&nbsp;${nom}</div>
  <div class="ligne">Pr\u00e9nom :&nbsp;&nbsp;${prenom}</div>
  <div class="ligne">Repos prescrit :&nbsp;&nbsp;${repos} jour${Number(repos) > 1 ? 's' : ''}</div>
  <div class="section-avis">
    <div class="avis-label">Avis du médecin contrôleur :</div>
    <div class="avis-texte">${cm.avis_medecin_controleur || ''}</div>
  </div>
  <div class="cachet">Cachet et signature${medecinNom ? ` — Dr. ${medecinNom}` : ''}</div>
  <div class="footer">
    <span>${footerCompanySite}</span>
    <span>${footerService}</span>
  </div>
</div></body></html>`;

  printHTML(html);
}

/* ════════════════════════════════════════════════════════════
   DRAWER CONTRE-VISITE — créer / modifier
════════════════════════════════════════════════════════════ */
function DrawerContreVisite({ item, initial, medecinNom, onSaved, onClose }) {
  const isEdit    = !!initial?.id;
  const nomPrenom = getNom(item);
  const { user } = useAuth();
  const department = pickDepartementCollaborateur(
    item?.collaborateur && typeof item.collaborateur === 'object'
      ? item.collaborateur
      : { department: item?.collaborateur_departement, departement: item?.collaborateur_departement, im_data: item?.im_data },
  );

  const [form, setForm] = useState({
    repos_initial:           isEdit ? String(getReposInitial(initial) ?? initial.repos_initial ?? '') : '',
    duree_repos:             isEdit ? String(initial.duree_repos || '') : '',
    a_partir:               isEdit ? (initial.a_partir || today()) : today(),
    remarque:               isEdit ? (initial.remarque || '') : '',
    segment:                isEdit ? (displayDepartementControleMedical(initial.controle_medical) || department || '') : (department || ''),
    avis_medecin_controleur: isEdit ? (initial.controle_medical?.avis_medecin_controleur || '') : '',
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [savedCV, setSavedCV] = useState(null);
  const [savedCM, setSavedCM] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showSiteModal, setShowSiteModal] = useState(false);

  useEffect(() => {
    if (selectedSite) return;
    // Pour le médecin du travail : site fixe dans le JWT
    if (user?.site_id && user?.site_nom) {
      setSelectedSite({ id: user.site_id, nom: user.site_nom, nom_ar: '', adresse: '', telephone: '' });
      return;
    }
    const initialSite = initial?.site_details || initial?.site || item?.site;
    if (initialSite) {
      setSelectedSite(normalizeSite(initialSite));
    }
  }, [initial, item, user, selectedSite]);

  const [touched, setTouched] = useState({});
  const markTouched = (k) => setTouched(p => ({ ...p, [k]: true }));

  // Plus de champs obligatoires
  const errors = {};
  const hasErrors = false;

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); markTouched(k); };

  const getBorder = (field) => {
    if (touched[field] && errors[field]) return '#dc2626';
    if (touched[field] && !errors[field]) return '#0284c7';
    return '#bae6fd';
  };

  const handleSubmit = async () => {
    if (!selectedSite) {
      setError('Le site est obligatoire.');
      setShowSiteModal(true);
      return;
    }

    setError(''); setSaving(true);
    try {
      if (isEdit) {
        const updatedCV = await updateContreVisite(initial.id, {
          repos_initial: payloadReposInitial(form.repos_initial),
          duree_repos: payloadDureeRepos(form.duree_repos),
          a_partir: form.a_partir,
          remarque: form.remarque,
          site: selectedSite.id,
        });
        let updatedCM = initial.controle_medical;
        if (updatedCM?.id) {
          updatedCM = await updateControleMedical(updatedCM.id, {
            segment: form.segment || department || 'N/A',
            avis_medecin_controleur: form.avis_medecin_controleur,
          });
        }
        const full = { ...updatedCV, controle_medical: updatedCM };
        genererPDF(updatedCM || {}, updatedCV, medecinNom, item, user, selectedSite);
        onSaved(full, true);
      } else {
        const itemPassageId = getItemPassageId(item);
        let cv = null;
        if (itemPassageId) {
          cv = await creerContreVisite({
            item_passage: itemPassageId,
            repos_initial: payloadReposInitial(form.repos_initial),
            duree_repos: payloadDureeRepos(form.duree_repos),
            a_partir: form.a_partir,
            remarque: form.remarque,
            date: today(),
            site: selectedSite.id,
          });
        } else if (item?.id) {
          const verdictResult = await saisirVerdict(item.id, {
            duree_repos: payloadDureeRepos(form.duree_repos),
            a_partir: form.a_partir,
            remarque: form.remarque,
            refus_repos: false,
            repos_initial: payloadReposInitial(form.repos_initial),
            date: today(),
            site: selectedSite.id,
          });
          cv =
            verdictResult?.contre_visite ||
            verdictResult?.contreVisite ||
            (verdictResult?.id && verdictResult?.duree_repos !== undefined ? verdictResult : null);
        }
        if (!cv?.id) {
          setError("Impossible de créer la contre-visite (ID manquant). Vérifiez la réponse backend (item_passage ou saisir_verdict).");
          return;
        }
        const cm = await creerControleMedical({
          contre_visite: cv.id,
          segment: form.segment || department || 'N/A',
          avis_medecin_controleur: form.avis_medecin_controleur ||
            `Contre-visite effectuée le ${fmtDateShort(today())}. Arrêt de travail de ${form.duree_repos} jours validé à partir du ${fmtDateShort(form.a_partir)}.`,
        });
        const full = { ...cv, controle_medical: cm };
        setSavedCV(full);
        setSavedCM(cm);
        genererPDF(cm, cv, medecinNom, item, user, selectedSite);
        onSaved(full, false);
      }
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
        Object.entries(data || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') ||
        'Une erreur est survenue.'
      );
    } finally { setSaving(false); }
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 9000 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 540, background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,.15)', zIndex: 9001, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom: '1.5px solid #bae6fd', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
            <Ico.User />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0c4a6e' }}>
              {isEdit ? 'Modifier la contre-visite' : 'Nouvelle contre-visite'}
            </div>
            <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>{nomPrenom}</div>
          </div>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: 'none', background: 'rgba(220,38,38,.8)', color: 'white', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Ico.Close /> Fermer
          </button>
        </div>

        <div style={{ padding: '0 22px 12px', flexShrink: 0, borderBottom: '1px solid #fce7f3', background: 'white' }}>
          <EnteteMaladiesChroniques collaborateurId={resolveCollaborateurId(item)} style={{ marginBottom: 0 }} />
        </div>

        {/* Corps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico.Alert c="#b91c1c" /> {error}
            </div>
          )}

          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, border: '1px solid #bae6fd', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
                Site de contre-visite
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {selectedSite?.nom || 'Cliquez pour sélectionner le site'}
              </div>
              {selectedSite?.adresse && (
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  {selectedSite.adresse}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSiteModal(true)}
              style={{ padding: '9px 14px', border: '1px solid #0284c7', borderRadius: 10, background: 'white', color: '#0284c7', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
            >
              Sélectionner
            </button>
          </div>

          {/* Badge succès (création) */}
          {!isEdit && savedCV && (
            <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 9, padding: '12px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ico.Check c="#16a34a" size={16} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#15803d' }}>
                  Contre-visite #{savedCV.numero_ordre} enregistrée
                </span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => genererPDF(savedCM || {}, savedCV, medecinNom, item, user, selectedSite)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                  <Ico.Print /> Ré-imprimer
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: '1.5px solid #0284c7', background: 'white', color: '#0284c7', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                  <Ico.Pencil /> Modifier
                </button>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <Field label="Repos initial (medecin traitant)">
                  <input type="number" min="1" value={form.repos_initial} onChange={e => set('repos_initial', e.target.value)}
                    placeholder="Ex: 7" style={{ ...inp, borderColor: '#bae6fd' }} />
                </Field>
              </div>
              <div>
                <Field label="Duree de repos (jours)">
                  <input type="number" min="1" value={form.duree_repos} onChange={e => set('duree_repos', e.target.value)}
                    onBlur={() => markTouched('duree_repos')}
                    placeholder="Ex: 5" style={{ ...inp, borderColor: getBorder('duree_repos') }} />
                </Field>
                
              </div>
              <div>
                <Field label="Date de debut d'arret">
                  <input type="date" value={form.a_partir} onChange={e => set('a_partir', e.target.value)}
                    onBlur={() => markTouched('a_partir')}
                    style={{ ...inp, borderColor: getBorder('a_partir') }} />
                </Field>
                
              </div>
            </div>

            {form.duree_repos && form.a_partir && (
              <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: 9, padding: '9px 13px', marginBottom: 14, fontSize: 13, color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ico.Calendar />
                Arrêt de {form.duree_repos} jour{parseInt(form.duree_repos) > 1 ? 's' : ''} — du{' '}
                {new Date(form.a_partir).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au{' '}
                {new Date(new Date(form.a_partir).getTime() + (parseInt(form.duree_repos) - 1) * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <Field label="Département (RH / im_db)">
                <input type="text" value={form.segment} onChange={e => set('segment', e.target.value)}
                  placeholder="Ex: Production"
                  onBlur={() => markTouched('segment')}
                  style={{ ...inp, borderColor: getBorder('segment') }} />
              </Field>
              
            </div>
            <div style={{ marginBottom: 14 }}>
              <Field label="Avis du medecin controleur">
                <textarea value={form.avis_medecin_controleur} onChange={e => set('avis_medecin_controleur', e.target.value)}
                  onBlur={() => markTouched('avis_medecin_controleur')}
                  rows={4} placeholder="Avis médical, décision, recommandations…"
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.6, borderColor: getBorder('avis_medecin_controleur') }} />
                
              </Field>
            </div>
            <div>
              <Field label="Remarque">
                <textarea value={form.remarque} onChange={e => set('remarque', e.target.value)}
                  rows={2} placeholder="Remarque complémentaire…"
                  onBlur={() => markTouched('remarque')}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.6, borderColor: getBorder('remarque') }} />
              </Field>
              
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1.5px solid #e0f2fe', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#f8fafc', flexShrink: 0 }}>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: '1.5px solid #cbd5e1', background: 'white', color: '#64748b', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            <Ico.Close c="#64748b" /> Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 22px', border: 'none', background: hasErrors ? '#e2e8f0' : 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: hasErrors ? '#94a3b8' : 'white', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: (saving || hasErrors) ? 'not-allowed' : 'pointer', opacity: saving ? 0.65 : 1 }}>
            <Ico.Save />
            {saving ? 'Enregistrement…' : isEdit ? 'Modifier & Imprimer PDF' : 'Enregistrer & Imprimer PDF'}
          </button>
        </div>

        <SiteSelectorModal
          open={showSiteModal}
          initialSite={selectedSite}
          title="Sélection du site de contre-visite"
          confirmLabel="Fermer"
          onClose={() => setShowSiteModal(false)}
          onConfirm={(site) => {
            setSelectedSite(normalizeSite(site));
            setShowSiteModal(false);
            setError('');
          }}
        />
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   DRAWER VOIR — lecture seule
════════════════════════════════════════════════════════════ */
function DrawerVoir({ cv, medecinNom, item, onClose, onEdit }) {
  const cm = cv?.controle_medical || {};
  const { user } = useAuth();
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 9000 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,.15)', zIndex: 9001, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom: '1.5px solid #bae6fd', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
            <Ico.Eye c="white" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0c4a6e' }}>Contre-visite de {item ? (item.collaborateur_nom || (typeof item.collaborateur === 'object' ? `${item.collaborateur?.nom||''} ${item.collaborateur?.prenom||''}`.trim() : '')) : fmtDateShort(cv.date)}</div>
            <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>{cv.duree_repos} jour{cv.duree_repos > 1 ? 's' : ''} de repos</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => { onClose(); onEdit(cv); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', border: '1.5px solid #0284c7', background: 'white', color: '#0284c7', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Ico.Pencil /> Modifier
            </button>
            <button
              onClick={onClose}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', border: 'none', background: '#dc2626', color: 'white', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Ico.Close /> Fermer
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          <EnteteMaladiesChroniques collaborateurId={resolveCollaborateurId(item)} style={{ marginBottom: 14 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <InfoRow
              label="Repos initial (med. traitant)"
              value={(() => {
                const r0 = getReposInitial(cv);
                return r0 != null ? `${r0} jour${Number(r0) > 1 ? 's' : ''}` : '—';
              })()}
            />
            <InfoRow label="Durée repos"  value={`${cv.duree_repos} jour${cv.duree_repos > 1 ? 's' : ''}`} />
            <InfoRow label="À partir du"  value={fmtDateShort(cv.a_partir)} />
            <InfoRow label="Date"         value={fmtDateShort(cv.date)} />
            <InfoRow label="Département"      value={displayDepartementControleMedical(cm) || '—'} />
          </div>
          {cm.avis_medecin_controleur && (
            <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 9, padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Avis médecin contrôleur</div>
              <div style={{ fontSize: 12.5, color: '#0c4a6e', lineHeight: 1.6 }}>{cm.avis_medecin_controleur}</div>
            </div>
          )}
          {cv.remarque && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Remarque</div>
              <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>{cv.remarque}</div>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <button onClick={() => genererPDF(cm, cv, medecinNom, item, user, cv?.site_details || cv?.site)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg,#0c4a6e,#0284c7)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(2,132,199,.3)' }}>
              <Ico.Print /> Imprimer le document
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════ */
export default function FormulaireContreVisite({ item, onUpdateItem, medecinNom }) {
  const [historique, setHistorique] = useState([]);
  const [loadHisto,  setLoadHisto]  = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editCV,     setEditCV]     = useState(null);
  const [voirCV,     setVoirCV]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const { user } = useAuth();

  const matricule  = item?.collaborateur_matricule || item?.collaborateur?.matricule || '';
  const nomPrenom  = getNom(item);
  const dejaTraite = item?.statut === 'EFFECTUEE';

  const loadHistorique = useCallback(async () => {
    if (!matricule) return;
    setLoadHisto(true);
    try {
      const data = await getContreVisitesByMatricule(matricule);
      const rows = Array.isArray(data) ? data : [];
      const enriched = await Promise.all(
        rows.map(async (cv) => {
          let next = { ...cv };
          if (!next.controle_medical || typeof next.controle_medical !== 'object') {
            try {
              const cm = await getControleMedicalByContreVisite(cv.id);
              if (cm && typeof cm === 'object') next = { ...next, controle_medical: cm };
            } catch { /* keep */ }
          }
          if (getReposInitial(next) == null && cv.id != null) {
            try {
              const res = await axiosInstance.get(`/control-visits/contre-visites/${cv.id}/`);
              if (res.data && typeof res.data === 'object') {
                next = { ...next, ...res.data, controle_medical: next.controle_medical || res.data.controle_medical };
              }
            } catch { /* listes allégées : ok */ }
          }
          return next;
        })
      );
      setHistorique(enriched);
    } catch { /* silencieux */ }
    finally { setLoadHisto(false); }
  }, [matricule]);

  useEffect(() => {
    loadHistorique();
    setShowDrawer(false); setEditCV(null); setVoirCV(null);
  }, [item?.id, loadHistorique]);

  const handleSaved = (cvData, shouldClose) => {
    onUpdateItem && onUpdateItem({ ...item, statut: 'EFFECTUEE', contre_visite: cvData });
    loadHistorique();
    if (shouldClose) { setShowDrawer(false); setEditCV(null); }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDel) return;
    try {
      await supprimerContreVisite(confirmDel.id);
      setConfirmDel(null);
      loadHistorique();
    } catch { setConfirmDel(null); }
  };

  if (!item) {
    return (
      <div style={{ height: '100%', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#94a3b8' }}>
        <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <p style={{ fontSize: 15, fontWeight: 600 }}>Sélectionnez un patient</p>
        <p style={{ fontSize: 13 }}>Cliquez sur un nom dans la file d'attente</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Header patient */}
      <div style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom: '1.5px solid #bae6fd', padding: '18px 24px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(14,165,233,.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(14,165,233,.3)' }}>
            <Ico.User />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0c4a6e', marginBottom: 4 }}>{nomPrenom}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
              {matricule && <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{matricule}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '5px 14px', borderRadius: 20, background: dejaTraite ? '#f0fdf4' : '#fff7ed', color: dejaTraite ? '#16a34a' : '#c2410c', border: `1px solid ${dejaTraite ? '#bbf7d0' : '#fed7aa'}`, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {dejaTraite ? 'Traité' : 'En attente'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 22px 0', flexShrink: 0, background: '#f8fafc' }}>
        <EnteteMaladiesChroniques collaborateurId={resolveCollaborateurId(item)} style={{ marginBottom: 0 }} />
      </div>

      {/* Corps */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
        <div style={{ marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #e0f2fe', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '.6px' }}>
          <Ico.History />
          Historique des contre-visites
          {historique.length > 0 && (
            <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>
              {historique.length}
            </span>
          )}
        </div>

        {loadHisto && (
          <div style={{ height: 80, borderRadius: 12, background: 'linear-gradient(90deg,#f8fafc 25%,#e0f2fe 50%,#f8fafc 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        )}

        {!loadHisto && historique.length === 0 && (
          <div style={{ background: '#f0f9ff', border: '1.5px dashed #bae6fd', borderRadius: 12, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>Aucune contre-visite enregistrée</div>
            <div style={{ fontSize: 12, color: '#7dd3fc', marginTop: 4 }}>Cliquez sur "Nouvelle contre-visite" pour commencer</div>
          </div>
        )}

        {!loadHisto && historique.length > 0 && (
          <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #e0f2fe', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom: '2px solid #bae6fd' }}>
                    {['Date', 'Repos initial', 'Repos', 'À partir du', 'Département', 'Remarque', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historique.map((cv, idx) => (
                    <tr key={cv.id}
                      style={{ borderBottom: idx < historique.length - 1 ? '1px solid #f0f9ff' : 'none' }}>
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>{fmtDateShort(cv.date)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {(() => {
                          const r0 = getReposInitial(cv);
                          return r0 !== null
                            ? <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11.5 }}>{r0}j</span>
                            : <span style={{ color: '#cbd5e1', fontSize: 11.5 }}>—</span>;
                        })()}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11.5 }}>{cv.duree_repos}j</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{fmtDateShort(cv.a_partir)}</td>
                      <td style={{ padding: '10px 12px', color: '#0369a1', fontWeight: 600 }}>{displayDepartementControleMedical(cv.controle_medical) || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: 140 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }} title={cv.remarque}>
                          {cv.remarque || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {/* FIX: removed extra } before > on all three buttons below */}
                          <button onClick={() => setVoirCV(cv)} title="Consulter"
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 9px', border: '1.5px solid #0284c7', background: 'white', color: '#0284c7', borderRadius: 6, cursor: 'pointer', transition: 'all .15s' }}>
                            <Ico.Eye />
                          </button>
                          <button onClick={() => { setEditCV(cv); setShowDrawer(true); }} title="Modifier"
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 9px', border: '1.5px solid #0369a1', background: 'white', color: '#0369a1', borderRadius: 6, cursor: 'pointer', transition: 'all .15s' }}>
                            <Ico.Pencil c="currentColor" />
                          </button>
                          <button onClick={() => genererPDF(cv.controle_medical || {}, cv, medecinNom, item, user, cv?.site_details || cv?.site)} title="Imprimer PDF"
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 9px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', borderRadius: 6, cursor: 'pointer' }}>
                            <Ico.Print />
                          </button>
                          <button onClick={() => setConfirmDel({ id: cv.id, titre: 'Supprimer la contre-visite', texte: 'Cette contre-visite et son contrôle médical seront définitivement supprimés.' })} title="Supprimer"
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 9px', border: '1.5px solid #dc2626', background: 'white', color: '#dc2626', borderRadius: 6, cursor: 'pointer', transition: 'all .15s' }}>
                            <Ico.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showDrawer && (
        <DrawerContreVisite
          item={item}
          initial={editCV}
          medecinNom={medecinNom}
          onSaved={handleSaved}
          onClose={() => { setShowDrawer(false); setEditCV(null); }}
        />
      )}

      {voirCV && (
        <DrawerVoir
          cv={voirCV}
          medecinNom={medecinNom}
          item={item}
          onClose={() => setVoirCV(null)}
          onEdit={(cv) => { setEditCV(cv); setShowDrawer(true); }}
        />
      )}

      {confirmDel && (
        <ModalConfirmDelete
          titre={confirmDel.titre}
          texte={confirmDel.texte}
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}