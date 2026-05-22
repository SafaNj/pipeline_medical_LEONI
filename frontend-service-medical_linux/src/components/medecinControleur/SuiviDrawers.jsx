// src/components/medecinControleur/SuiviDrawers.jsx
import { useState, useEffect } from 'react';
import { printHTML } from '../../utils/printHelper';
import { useAuth } from '../../context/AuthContext';
import {
  updateContreVisite, updateControleMedical, supprimerContreVisite,
  getDemandesByContreVisite, creerDemandeExpertise, updateDemandeExpertise,
  searchCollaborateurs,
} from '../../api/Contrevisiteapi';
import { ouvrirDemandeExpertise as ouvrirDemandeExpertisePDF } from './Demandeexpertise';
import { displayDepartementControleMedical } from '../../utils/ficheCollaborateur';
import { getReposInitial, payloadReposInitial, payloadDureeRepos } from '../../utils/contreVisiteRepos';
import { getSitePrintConfig } from '../../utils/siteConfig';

const C = {
  primary:  '#0284c7', primary2: '#0369a1',
  dark:     '#0c4a6e', light:    '#e0f2fe',
  light2:   '#f0f9ff', border:   '#bae6fd',
  accent:   '#38bdf8', text:     '#0f172a',
  muted:    '#64748b',
};
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const today = () => new Date().toISOString().split('T')[0];

const IcoLogout    = ({ c='#94a3b8'  }) => <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoRefresh   = ({ c='#0284c7' }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
const IcoArrow     = ({ c='#0284c7' }) => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/></svg>;
const IcoCheck     = ({ c='white'   }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoPlus      = ({ c='white'   }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoDoc       = ({ c='#0284c7' }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>;
const IcoHistory   = ({ c='#0284c7' }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoDownload  = ({ c='white'   }) => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoCalendar  = ({ c='#0284c7' }) => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoUser      = ({ c='white'   }) => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoClipboard = ({ c='white'   }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>;
const IcoChart     = ({ c='white'   }) => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoExpertise = ({ c='white'   }) => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>;
const IcoPencil    = ({ c='#0284c7', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash     = ({ c='#dc2626', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoEye       = ({ c='#0284c7', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoClose     = ({ c='white',   size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoSave      = ({ c='white',   size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoAlert     = ({ c='#d97706', size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;


/* ════════════ MODAL SUPPRESSION ════════════ */
function ModalConfirmDeleteCV({ titre, texte, onConfirm, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:14, padding:'28px 28px 22px', maxWidth:380, width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,.22)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:18 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#fef2f2', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <IcoAlert c="#dc2626" />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0c4a6e', marginBottom:5 }}>{titre}</div>
            <div style={{ fontSize:12.5, color:'#64748b', lineHeight:1.6 }}>{texte}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', border:'1.5px solid #cbd5e1', background:'white', color:'#64748b', borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
            <IcoClose c="#64748b" /> Annuler
          </button>
          <button onClick={onConfirm} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', border:'none', background:'#dc2626', color:'white', borderRadius:8, fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
            <IcoTrash c="white" /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/*  PDF CONTROLE MEDICAL  */
function genPDFControle(cm, cv, medecinNom, userContext) {
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const dateEmission = fmtD(cm?.date_emission || cv?.date);
  const repos = cv?.duree_repos || cm?.repos_prescrit || '';
  const parts = (cv?.nom_prenom || '').trim().split(/\s+/);
  const nom    = cm?.nom    || parts[0] || '';
  const prenom = cm?.prenom || parts.slice(1).join(' ') || '';
  const matricule_val = cm?.matricule || cv?.matricule || '';
  const medecinLabel  = medecinNom ? `Dr. ${medecinNom}` : 'Le médecin contrôleur';
  const deptPdf = displayDepartementControleMedical(cm);
  const siteConfig = getSitePrintConfig(userContext, cv?.site_details || cv?.site, cv, cm);
  const footerLeft = siteConfig.footerCompanySite || 'Leoni Menzel Hayet';
  const footerRight = siteConfig.medicalServiceName || 'Service Médical';

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Contrôle Médical</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; background: white; }
  @media print {
    @page { size: A4 portrait; margin: 25mm 25mm 25mm 25mm; }
    html, body { margin: 0; padding: 0; }
  }
  .page { max-width: 160mm; margin: 0 auto; padding: 0; position: relative; min-height: 247mm; }
  .titre { text-align: center; font-size: 15pt; font-weight: bold; margin-bottom: 15mm; }
  .ligne { margin-bottom: 8mm; font-size: 12pt; line-height: 1.5; }
  .avis-section { margin-top: 10mm; }
  .avis-label { font-size: 12pt; margin-bottom: 5mm; }
  .avis-texte { font-size: 12pt; line-height: 1.8; white-space: pre-wrap; min-height: 20mm; }
  .cachet {
    position: absolute; bottom: 30mm; right: 0;
    text-align: center; font-size: 11pt; width: 55mm;
  }
  .footer {
    position: absolute; bottom: 0; left: 0; right: 0;
    border-top: 1.5px solid #000; padding-top: 3mm;
    display: flex; justify-content: space-between; font-size: 10.5pt; font-weight: bold;
  }
</style></head>
<body><div class="page">
  <div class="titre">Contrôle médical</div>
  <div class="ligne">Le :&nbsp;&nbsp;${dateEmission}</div>
  <div class="ligne">Matricule :&nbsp;&nbsp;${matricule_val}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Segment :&nbsp;&nbsp;${deptPdf || ''}</div>
  <div class="ligne">Nom :&nbsp;&nbsp;${nom}</div>
  <div class="ligne">Prénom :&nbsp;&nbsp;${prenom}</div>
  <div class="ligne">Repos prescrit :&nbsp;&nbsp;${repos} jour${Number(repos) > 1 ? 's' : ''}</div>
  <div class="avis-section">
    <div class="avis-label">Avis du médecin contrôleur :</div>
    <div class="avis-texte">${cm?.avis_medecin_controleur || ''}</div>
  </div>
  <div class="cachet">Cachet et signature</div>
  <div class="footer">
    <span>${footerLeft}</span>
    <span>${footerRight}${medecinNom ? ' — ' + medecinLabel : ''}</span>
  </div>
</div></body></html>`;
  printHTML(html);
}

/*  DRAWER VOIR CV  */
function medecinAfficheDrawer(cv, medecinNom) {
  const raw = cv?.medecin_nom || cv?.medecin || medecinNom;
  if (!raw) return '—';
  const s = String(raw).trim();
  return /^dr\.?\s/i.test(s) ? s : `Dr. ${s}`;
}
function medecinNomPourPdf(cv, medecinNom) {
  const raw = cv?.medecin_nom || cv?.medecin || medecinNom;
  if (!raw) return '';
  return String(raw).replace(/^dr\.?\s*/i, '').trim();
}

function DrawerVoirCV({ cv, medecinNom, onClose, onEdit, readOnly = false }) {
  const cm = cv?.controle_medical || {};
  const { user } = useAuth();
  const InfoRow = ({ label, value }) => (
    <div style={{ background:'#f8fafc', borderRadius:8, padding:'8px 12px', border:'1px solid #e0f2fe' }}>
      <div style={{ fontSize:9.5, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</div>
      <div style={{ fontSize:12.5, fontWeight:600, color:'#0c4a6e', marginTop:2 }}>{value || '—'}</div>
    </div>
  );
  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.3)', zIndex:9000 }} onClick={onClose} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:480, background:'white', boxShadow:'-8px 0 40px rgba(0,0,0,.18)', zIndex:9001, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom:'1.5px solid #bae6fd', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:42, height:42, borderRadius:11, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
            <IcoEye c="white" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>{cv.nom_prenom}</div>
            <div style={{ fontSize:11, color:'#0369a1', marginTop:2 }}>{fmtDateShort(cv.date)} · {cv.duree_repos}j repos · {cv.matricule}</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {!readOnly && (
              <button
                onClick={() => { onClose(); onEdit(cv); }}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 13px', border:'1.5px solid #0284c7', background:'white', color:'#0284c7', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                <IcoPencil /> Modifier
              </button>
            )}
            <button
              onClick={onClose}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 13px', border:'none', background:'#dc2626', color:'white', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <IcoClose /> Fermer
            </button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            <InfoRow
              label="Repos initial (med. traitant)"
              value={(() => {
                const r0 = getReposInitial(cv);
                return r0 != null ? `${r0} jour${Number(r0) > 1 ? 's' : ''}` : '—';
              })()}
            />
            <InfoRow label="Duree repos"   value={`${cv.duree_repos} jour${cv.duree_repos > 1 ? 's' : ''}`} />
            <InfoRow label="A partir du"   value={fmtDateShort(cv.a_partir)} />
            <InfoRow label="Date"          value={fmtDateShort(cv.date)} />
            <InfoRow label="Segment"       value={displayDepartementControleMedical(cm) || '—'} />
            <InfoRow label="Matricule"     value={cv.matricule} />
            <InfoRow label="Medecin"       value={medecinAfficheDrawer(cv, medecinNom)} />
          </div>
          {cm.avis_medecin_controleur && (
            <div style={{ background:'#f0f9ff', border:'1.5px solid #bae6fd', borderRadius:9, padding:'12px 14px', marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Avis medecin controleur</div>
              <div style={{ fontSize:12.5, color:'#0c4a6e', lineHeight:1.6 }}>{cm.avis_medecin_controleur}</div>
            </div>
          )}
          {cv.remarque && (
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 14px', marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>Remarque</div>
              <div style={{ fontSize:12.5, color:'#475569', lineHeight:1.6 }}>{cv.remarque}</div>
            </div>
          )}
          {cv.controle_medical && (
            <div style={{ marginTop:16 }}>
              <button onClick={() => genPDFControle(cv.controle_medical, cv, medecinNomPourPdf(cv, medecinNom), user)}
                style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', border:'none', borderRadius:9, background:'linear-gradient(135deg,#0c4a6e,#0284c7)', color:'white', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(2,132,199,.3)' }}>
                <IcoDownload /> Imprimer le document
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
/*  DRAWER MODIFIER CV  */
function DrawerModifierCV({ cv, medecinNom, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    repos_initial: String(getReposInitial(cv) ?? cv.repos_initial ?? ''),
    duree_repos: String(cv.duree_repos || ''),
    a_partir: cv.a_partir || '',
    remarque: cv.remarque || '',
    segment: displayDepartementControleMedical(cv.controle_medical) || '',
    avis_medecin_controleur: cv.controle_medical?.avis_medecin_controleur || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [touchedM, setTouchedM] = useState({});
  const markM = (k) => setTouchedM(p => ({ ...p, [k]: true }));
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); markM(k); };

  const errorsM = {};
  const hasErrorsM = false;

  const getBM = (field) => {
    if (touchedM[field] && errorsM[field]) return '#dc2626';
    if (touchedM[field] && !errorsM[field]) return '#0284c7';
    return '#bae6fd';
  };
  const ErrM = ({ field }) => touchedM[field] && errorsM[field] ? (
    <div style={{ fontSize:11, color:'#dc2626', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {errorsM[field]}
    </div>
  ) : null;

  const handleSave = async () => {

    setError(''); setSaving(true);
    try {
      const updatedCV = await updateContreVisite(cv.id, {
        repos_initial: payloadReposInitial(form.repos_initial),
        duree_repos: payloadDureeRepos(form.duree_repos),
        a_partir: form.a_partir,
        remarque: form.remarque,
      });
      let updatedCM = cv.controle_medical;
      if (updatedCM?.id) {
        updatedCM = await updateControleMedical(updatedCM.id, {
          segment: form.segment || 'N/A',
          avis_medecin_controleur: form.avis_medecin_controleur,
        });
      }
      const full = { ...updatedCV, controle_medical: updatedCM, nom_prenom: cv.nom_prenom, matricule: cv.matricule };
      genPDFControle(updatedCM || {}, full, medecinNom, user);
      onSaved(full);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.detail || Object.entries(d || {}).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') || 'Erreur.');
    } finally { setSaving(false); }
  };

  const inp2 = { width:'100%', padding:'9px 12px', border:'1.5px solid #bae6fd', borderRadius:9, fontSize:13, outline:'none', color:'#0f172a', background:'white', boxSizing:'border-box', fontFamily:'inherit' };
  const Lbl = ({ children }) => <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>{children}</label>;

  const SectionTitle = ({ color, bg, border, icon, children }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:bg, border:`1.5px solid ${border}`, borderRadius:9, marginBottom:14 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={{ fontSize:12, fontWeight:800, color, textTransform:'uppercase', letterSpacing:'.6px' }}>{children}</span>
    </div>
  );

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.3)', zIndex:9000 }} onClick={onClose} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:480, background:'white', boxShadow:'-8px 0 40px rgba(0,0,0,.18)', zIndex:9001, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px', background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom:'1.5px solid #bae6fd', flexShrink:0, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>Modifier la contre-visite</div>
            <div style={{ fontSize:11, color:'#0369a1', marginTop:2 }}>{cv.nom_prenom} · {cv.matricule}</div>
          </div>
          <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', border:'none', background:'rgba(220,38,38,.8)', color:'white', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <IcoClose /> Fermer
          </button>
        </div>

        {/* Corps */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 22px' }}>
          {error && <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', color:'#b91c1c', borderRadius:8, padding:'8px 12px', fontSize:12.5, marginBottom:14 }}>{error}</div>}

          {/* ── SECTION 1 : Contre-visite (données tableau) ── */}
          <SectionTitle color="#0369a1" bg="#f0f9ff" border="#bae6fd" icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
          }>
            Contre-visite — données du tableau
          </SectionTitle>
          <div style={{ background:'#f8fafc', border:'1.5px solid #e0f2fe', borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <Lbl>Repos initial (med. traitant)</Lbl>
                <input type="number" min="0" value={form.repos_initial} onChange={e=>set('repos_initial',e.target.value)} style={{ ...inp2, borderColor:'#bae6fd' }} placeholder="Ex: 7" />
              </div>
              <div>
                <Lbl>Duree de repos (jours)</Lbl>
                <input type="number" min="0" value={form.duree_repos} onChange={e=>set('duree_repos',e.target.value)} onBlur={()=>markM('duree_repos')} style={{ ...inp2, borderColor: getBM('duree_repos') }} />
              </div>
              <div>
                <Lbl>Date debut arret</Lbl>
                <input type="date" value={form.a_partir} onChange={e=>set('a_partir',e.target.value)} onBlur={()=>markM('a_partir')} style={{ ...inp2, borderColor: getBM('a_partir') }} />
              </div>
            </div>
            {form.duree_repos && form.a_partir && (
              <div style={{ background:'#e0f2fe', border:'1px solid #7dd3fc', borderRadius:9, padding:'9px 13px', marginBottom:14, fontSize:13, color:'#0369a1', fontWeight:600 }}>
                Arrêt de {form.duree_repos} jour{parseInt(form.duree_repos)>1?'s':''} — du{' '}
                {new Date(form.a_partir).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})} au{' '}
                {new Date(new Date(form.a_partir).getTime()+(parseInt(form.duree_repos)-1)*86400000).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
              </div>
            )}
            <div>
              <Lbl>Remarque</Lbl>
              <textarea value={form.remarque} onChange={e=>set('remarque',e.target.value)} onBlur={()=>markM('remarque')} rows={2} style={{ ...inp2, resize:'vertical', lineHeight:1.6, borderColor: getBM('remarque') }} placeholder="Ex: arrêt justifié, visite non justifiée…" />
            </div>
          </div>

          {/* ── SECTION 2 : Contrôle médical (certificat PDF) ── */}
          <SectionTitle color="#0284c7" bg="#e0f2fe" border="#7dd3fc" icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          }>
            Contrôle médical — document PDF
          </SectionTitle>
          <div style={{ background:'#f0f9ff', border:'1.5px solid #7dd3fc', borderRadius:12, padding:16 }}>
            <div style={{ marginBottom:14 }}>
              <Lbl>Département (RH / im_db)</Lbl>
              <input type="text" value={form.segment} onChange={e=>set('segment',e.target.value)} onBlur={()=>markM('segment')} style={{ ...inp2, borderColor: getBM('segment') }} />
            </div>
            <div>
              <Lbl>Avis du medecin controleur</Lbl>
              <textarea value={form.avis_medecin_controleur} onChange={e=>set('avis_medecin_controleur',e.target.value)} onBlur={()=>markM('avis_medecin_controleur')} rows={4} style={{ ...inp2, resize:'vertical', lineHeight:1.6, borderColor: getBM('avis_medecin_controleur') }} placeholder="Avis médical, décision, recommandations…" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 22px', borderTop:'1.5px solid #e0f2fe', display:'flex', justifyContent:'flex-end', gap:8, background:'#f8fafc', flexShrink:0 }}>
          <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', border:'1.5px solid #cbd5e1', background:'white', color:'#64748b', borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
            <IcoClose c="#64748b" /> Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 22px', border:'none', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', borderRadius:8, fontSize:13, fontWeight:700, cursor: saving ?'not-allowed':'pointer', opacity:saving?0.65:1 }}>
            <IcoSave /> {saving ? 'Enregistrement...' : 'Modifier & Imprimer PDF'}
          </button>
        </div>
      </div>
    </>
  );
}

/*  DRAWER EXPERTISE — Voir / Modifier  */
function DrawerExpertise({ cvId, cvData, medecinNom, onClose, onSaved }) {
  const [demande,  setDemande]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [form,     setForm]     = useState({
    dr: '', date_demande: new Date().toISOString().split('T')[0],
    collaborateur_nom: '', collaborateur_prenom: '', collaborateur_matricule: '',
    pieces_jointes: '', poste: '', autres_missions: '',
  });

  useEffect(() => {
    let cancelled = false;
    getDemandesByContreVisite(cvId)
      .then(data => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data.results || []);
        const de = list[0] || null;
        setDemande(de);
        if (de) {
          setForm({
            dr: de.dr || '',
            date_demande: de.date_demande || new Date().toISOString().split('T')[0],
            collaborateur_nom: de.collaborateur_nom || '',
            collaborateur_prenom: de.collaborateur_prenom || '',
            collaborateur_matricule: de.collaborateur_matricule || '',
            pieces_jointes: de.pieces_jointes || '',
            poste: de.poste || '',
            autres_missions: de.autres_missions || '',
          });
        } else {
          const parts = (cvData?.nom_prenom || '').trim().split(' ');
          const mat = cvData?.matricule || '';
          setForm(f => ({
            ...f,
            collaborateur_nom: parts[0] || '',
            collaborateur_prenom: parts.slice(1).join(' ') || '',
            collaborateur_matricule: mat,
          }));
          if (mat) {
            searchCollaborateurs(mat).then(list => {
              const found = list.find(c => String(c?.matricule || '').trim() === mat.trim());
              if (found?.poste) {
                setForm(f => ({ ...f, poste: found.poste }));
              }
            }).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cvId]);

  const [touched2, setTouched2] = useState({});
  const markTouched2 = (k) => setTouched2(p => ({ ...p, [k]: true }));

  const errorsExp = {};
  const hasErrorsExp = false;

  const getBorder2 = (field) => {
    if (touched2[field] && errorsExp[field]) return '#dc2626';
    if (touched2[field] && !errorsExp[field]) return '#0284c7';
    return C.border;
  };

  const ErrMsg = ({ field }) => touched2[field] && errorsExp[field] ? (
    <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {errorsExp[field]}
    </div>
  ) : null;

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); markTouched2(k); };

  const handleSave = async () => {

    setError(''); setSaving(true);
    try {
      let saved;
      if (demande?.id) {
        saved = await updateDemandeExpertise(demande.id, form);
      } else {
        saved = await creerDemandeExpertise({ ...form, contre_visite: cvId });
      }
      setDemande(saved);
      ouvrirDemandeExpertisePDF(saved, medecinNom);
      onSaved && onSaved(saved);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.detail || Object.entries(d || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') || 'Erreur.');
    } finally { setSaving(false); }
  };

  const inp2 = { width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:13, outline:'none', color:C.text, background:'white', boxSizing:'border-box', fontFamily:'inherit' };
  const Lbl = ({ children }) => <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>{children}</label>;

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.3)', zIndex:9000 }} onClick={onClose} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:520, background:'white', boxShadow:'-8px 0 40px rgba(0,0,0,.18)', zIndex:9001, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'18px 22px', background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom:'1.5px solid #bae6fd', flexShrink:0, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:42, height:42, borderRadius:11, flexShrink:0, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(14,165,233,.3)' }}>
          <IcoDoc c="white" size={18}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>
            {demande ? "Voir / Modifier l'expertise" : "Nouvelle demande d'expertise"}
          </div>
          <div style={{ fontSize:11, color:'#0369a1', marginTop:2 }}>
            {cvData?.nom_prenom} · {cvData?.matricule}
          </div>
        </div>
        {demande && (
          /* FIX: removed extra } before > */
          <button
            onClick={() => ouvrirDemandeExpertisePDF(demande, medecinNom)}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 13px', border:'1.5px solid #0284c7', background:'white', color:'#0284c7', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
            <IcoDownload c="currentColor" /> PDF
          </button>
        )}
        <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', border:'none', background:'#dc2626', color:'white', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}>
          <IcoClose /> Fermer
        </button>
      </div>
      {/* Corps */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 22px' }}>
        {loading && <div style={{ textAlign:'center', padding:'40px', color:C.primary, fontSize:13, fontWeight:600 }}>Chargement...</div>}
        {!loading && (
          <>
            {error && <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', color:'#b91c1c', borderRadius:8, padding:'8px 12px', fontSize:12.5, marginBottom:14 }}>{error}</div>}
            {demande && (
              <div style={{ background:'#f0f9ff', border:'1.5px solid #bbf7d0', borderRadius:9, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <IcoCheck c="#16a34a" />
                <span style={{ fontSize:12.5, fontWeight:700, color:'#15803d' }}>Expertise enregistree — DR : {demande.dr}</span>
              </div>
            )}
            <div style={{ background:'#f0f9ff', border:`1.5px solid ${C.border}`, borderRadius:12, padding:18, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 180px', gap:14 }}>
                <div>
                  <Lbl>DR — Docteur destinataire</Lbl>
                  <input style={{ ...inp2, borderColor: getBorder2('dr') }} placeholder="Nom complet du medecin expert" value={form.dr}
                    onChange={e => set('dr', e.target.value)}
                    onBlur={() => markTouched2('dr')} />
                </div>
                <div>
                  <Lbl>Date</Lbl>
                  <input type="date" style={{ ...inp2, borderColor: getBorder2('date_demande') }} value={form.date_demande}
                    onChange={e => set('date_demande', e.target.value)}
                    onBlur={() => markTouched2('date_demande')} />
                </div>
              </div>
              <div style={{ background:'white', borderRadius:10, border:`1px solid ${C.border}`, padding:'12px 14px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Identite du collaborateur *</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 160px', gap:12 }}>
                  <div>
                    <Lbl>Nom</Lbl>
                    <input style={{ ...inp2, borderColor: getBorder2('collaborateur_nom') }} value={form.collaborateur_nom}
                      onChange={e => set('collaborateur_nom', e.target.value)}
                      onBlur={() => markTouched2('collaborateur_nom')} />
                  </div>
                  <div>
                    <Lbl>Prenom</Lbl>
                    <input style={{ ...inp2, borderColor: getBorder2('collaborateur_prenom') }} value={form.collaborateur_prenom}
                      onChange={e => set('collaborateur_prenom', e.target.value)}
                      onBlur={() => markTouched2('collaborateur_prenom')} />
                  </div>
                  <div>
                    <Lbl>Matricule</Lbl>
                    <input style={{ ...inp2, borderColor: getBorder2('collaborateur_matricule') }} value={form.collaborateur_matricule}
                      onChange={e => set('collaborateur_matricule', e.target.value)}
                      onBlur={async (e) => {
                        markTouched2('collaborateur_matricule');
                        const mat = e.target.value.trim();
                        if (!mat) return;
                        try {
                          const list = await searchCollaborateurs(mat);
                          const found = list.find(c => String(c?.matricule || '').trim() === mat);
                          if (found) {
                            setForm(f => ({
                              ...f,
                              collaborateur_nom: found.nom || f.collaborateur_nom,
                              collaborateur_prenom: found.prenom || f.collaborateur_prenom,
                              poste: found.poste || f.poste,
                            }));
                          }
                        } catch { /* silencieux */ }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Lbl>Pieces jointes</Lbl>
                <textarea style={{ ...inp2, resize:'vertical', minHeight:60, lineHeight:1.6, borderColor: getBorder2('pieces_jointes') }}
                  placeholder="Liste des documents joints..."
                  value={form.pieces_jointes}
                  onChange={e => set('pieces_jointes', e.target.value)}
                  onBlur={() => markTouched2('pieces_jointes')} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <Lbl>Poste de travail</Lbl>
                  <input style={{ ...inp2, borderColor: getBorder2('poste') }}
                    placeholder="Ex: Operateur cablage"
                    value={form.poste}
                    onChange={e => set('poste', e.target.value)}
                    onBlur={() => markTouched2('poste')} />
                </div>
                <div>
                  <Lbl>Autres missions</Lbl>
                  <input style={{ ...inp2, borderColor: getBorder2('autres_missions') }}
                    placeholder="Mission complementaire..."
                    value={form.autres_missions}
                    onChange={e => set('autres_missions', e.target.value)}
                    onBlur={() => markTouched2('autres_missions')} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Footer */}
      <div style={{ padding:'12px 22px', borderTop:'1.5px solid #e0f2fe', display:'flex', justifyContent:'flex-end', gap:8, background:'#f8fafc', flexShrink:0 }}>
        <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', border:'1.5px solid #cbd5e1', background:'white', color:'#64748b', borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
          <IcoClose c="#64748b" /> Annuler
        </button>
        <button onClick={handleSave} disabled={saving || loading}
          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 22px', border:'none', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', borderRadius:8, fontSize:13, fontWeight:700, cursor: (saving || loading) ?'not-allowed':'pointer', opacity:saving?0.65:1, boxShadow:'0 4px 14px rgba(2,132,199,.25)' }}>
          <IcoSave /> {saving ? 'Enregistrement...' : demande ? 'Modifier & Imprimer PDF' : 'Creer & Imprimer PDF'}
        </button>
      </div>
      </div>
    </>
  );
}


/*  GÉNÉRATION PDF — document physique  */
function ouvrirFichier(cm, cv, medecinNom, userContext) {
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const dateEmission  = fmtD(cm.date_emission || cv?.date);
  const repos         = cv?.duree_repos || cm.repos_prescrit || '';
  const nom           = cm.nom    || '';
  const prenom        = cm.prenom || '';
  const matricule_val = cm.matricule || '';
  const deptPdf = displayDepartementControleMedical(cm);
  const siteConfig = getSitePrintConfig(userContext, cv?.site_details || cv?.site, cv, cm);
  const footerLeft = siteConfig.footerCompanySite || 'Leoni Menzel Hayet';
  const footerRight = siteConfig.medicalServiceName || 'Service Médical';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrôle Médical</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 210mm; height: 297mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; color: #000; background: white; }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 15mm 22mm 0mm 22mm;
      position: relative;
      overflow: hidden;
    }

    .titre {
      text-align: center;
      font-size: 13.5pt;
      font-weight: bold;
      margin-bottom: 10mm;
    }

    .ligne {
      font-size: 11.5pt;
      margin-bottom: 5mm;
      line-height: 1.4;
    }
    .ligne-double {
      display: flex;
      gap: 15mm;
      font-size: 11.5pt;
      margin-bottom: 5mm;
    }

    .section-avis {
      margin-top: 8mm;
    }
    .avis-label {
      font-size: 11.5pt;
      margin-bottom: 4mm;
    }
    .avis-texte {
      font-size: 11.5pt;
      line-height: 1.7;
      white-space: pre-wrap;
      min-height: 22mm;
    }

    .cachet-zone {
      margin-top: 14mm;
      text-align: right;
      font-size: 11pt;
      padding-right: 8mm;
    }

    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      border-top: 1.5px solid #000;
      display: flex;
      justify-content: space-between;
      padding: 3mm 22mm;
      font-size: 10.5pt;
      font-weight: bold;
    }

    @media print {
      html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
      .page { width: 100%; height: 100vh; padding: 14mm 20mm 0mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="titre">Contrôle médical</div>

  <div class="ligne">Le :&nbsp;&nbsp;${dateEmission}</div>
  <div class="ligne-double">
    <span>Matricule :&nbsp;&nbsp;${matricule_val}</span>
    <span>Segment :&nbsp;&nbsp;${deptPdf || ''}</span>
  </div>
  <div class="ligne">Nom :&nbsp;&nbsp;${nom}</div>
  <div class="ligne">Prénom :&nbsp;&nbsp;${prenom}</div>
  <div class="ligne">Repos prescrit :&nbsp;&nbsp;${repos} jour${Number(repos) > 1 ? 's' : ''}</div>

  <div class="section-avis">
    <div class="avis-label">Avis du médecin contrôleur :</div>
    <div class="avis-texte">${cm.avis_medecin_controleur || ''}</div>
  </div>

  <div class="cachet-zone">Cachet et signature</div>

  <div class="footer">
    <span>${footerLeft}</span>
    <span>${footerRight}</span>
  </div>

</div>
</body>
</html>`;

  printHTML(html);
}

export { ModalConfirmDeleteCV, genPDFControle, ouvrirFichier, DrawerVoirCV, DrawerModifierCV, DrawerExpertise };