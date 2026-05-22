// src/components/medecinControleur/DemandeExpertise.jsx
import { useState, useEffect } from 'react';
import { printHTML } from '../../utils/printHelper';
import {
  creerDemandeExpertise,
  getDemandesExpertise,
  updateDemandeExpertise,
  supprimerDemandeExpertise,
} from '../../api/Contrevisiteapi';
import { getSites } from '../../api/sitesApi';
import { searchCollaborateurs } from "../../api/Contrevisiteapi";
import { useAuth } from '../../context/AuthContext';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { uiAlert, uiConfirm } from '../../utils/uiAlert';
/* ─── Palette ───────────────────────────────────────────────── */
const C = {
  primary:  '#0284c7',
  primary2: '#0369a1',
  dark:     '#0c4a6e',
  light:    '#e0f2fe',
  light2:   '#f0f9ff',
  border:   '#bae6fd',
  accent:   '#38bdf8',
  text:     '#0f172a',
  muted:    '#64748b',
};

/* ─── Icônes SVG ────────────────────────────────────────────── */
const IcoDoc      = ({ c='#0284c7', size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>;
const IcoDownload = ({ c='white',   size=15 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoPlus     = ({ c='white',   size=15 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoArrow    = ({ c='#64748b', size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/></svg>;
const IcoCheck    = ({ c='#34d399', size=18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoEdit     = ({ c='#0284c7', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoSearch   = ({ c='white',   size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoSpin     = ({ c='white',   size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" style={{animation:'spin .7s linear infinite',display:'block'}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>;

/* ─── Styles réutilisables ──────────────────────────────────── */
const inputS = {
  width: '100%', padding: '9px 12px',
  border: `1.5px solid ${C.border}`, borderRadius: 9,
  fontSize: 13.5, outline: 'none', color: C.text,
  background: 'white', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color .15s',
};
const textareaS = { ...inputS, resize: 'vertical', minHeight: 70 };
const labelCss = {
  display: 'block', fontSize: 11.5, fontWeight: 700,
  color: C.muted, textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 6,
};
function Field({ label, children }) {
  return <div><label style={labelCss}>{label}</label>{children}</div>;
}

/* 
   GÉNÉRATION PDF
    */
export function ouvrirDemandeExpertise(de, medecinNom) {
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '…………';
  const siteCfg = getSitePrintConfig(de, de?.site, de?.contre_visite);
  const societeLabel = `SOCIETE ${String(siteCfg.footerCompanySite || 'Leoni').toUpperCase()} SARL`;
  const signatureSociete = siteCfg.footerCompanySite || 'Leoni';
  const medecinLabel = medecinNom ? `Dr. ${medecinNom}` : 'Le médecin contrôleur';

  const nomVal       = (de.collaborateur_nom||'').trim()       || '………………………………………………';
  const prenomVal    = (de.collaborateur_prenom||'').trim()    || '………………………………………………';
  const matriculeVal = (de.collaborateur_matricule||'').trim() || '………………………………………………';
  const piecesVal    = (de.pieces_jointes||'').trim()          || '…………………………………………………………………………………………………';
  const posteVal     = (de.poste||'').trim()                   || '…………………………………………………………………………………………………';
  const autresVal    = (de.autres_missions||'').trim()         || '';

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Demande d'Expertise Médicale</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { margin: 0; padding: 0; width: 210mm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; color: #000; background: white; }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 18mm 22mm 15mm 22mm;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* En-tête */
  .societe {
    text-align: center;
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 12mm;
  }
  .header-right {
    text-align: right;
    font-size: 11.5pt;
    margin-bottom: 5mm;
  }
  .titre-block {
    text-align: center;
    margin-bottom: 5mm;
  }
  .titre {
    font-size: 12pt;
    font-weight: bold;
    text-decoration: underline;
    text-transform: uppercase;
    display: inline;
  }

  /* DR — affiché à droite SANS ligne */
  .dr-block {
    text-align: right;
    font-size: 11.5pt;
    margin-bottom: 8mm;
  }

  /* Corps */
  .cher  { font-size: 11.5pt; margin-bottom: 3mm; }
  .intro { font-size: 11.5pt; margin-bottom: 4mm; }
  .identite { font-size: 11.5pt; margin-bottom: 5mm; line-height: 2; }

  /* Sections avec titre souligné */
  .s-titre {
    font-size: 11.5pt;
    font-weight: bold;
    text-decoration: underline;
    display: inline;
  }
  .pieces-zone { margin-bottom: 5mm; }
  .pieces-val  { font-size: 11.5pt; line-height: 1.7; }

  .missions-zone { margin-bottom: 5mm; }
  .mission-ul { list-style: none; padding-left: 7mm; margin: 3mm 0 0 0; }
  .mission-ul li {
    font-size: 11.5pt;
    line-height: 1.65;
    margin-bottom: 3mm;
    position: relative;
  }
  .mission-ul li::before {
    content: "■";
    position: absolute;
    left: -6mm;
    top: 1pt;
    font-size: 7pt;
  }

  /* Poste : valeur inline sans ligne */
  /* Autres missions : valeur sur ligne suivante sans ligne */

  .honoraires {
    font-size: 11.5pt;
    line-height: 1.7;
    text-align: justify;
    margin-bottom: 0;
  }

  /* Signature — poussée vers le bas */
  .flex-spacer { flex: 1; min-height: 4mm; }
  .salutation  { font-size: 11.5pt; text-align: center; margin-bottom: 2mm; }
  .signature   { font-size: 11.5pt; text-align: center; margin-bottom: 0; }

  /* NB — tout en bas, ancré */
  .nb-zone {
    position: absolute;
    bottom: 15mm;
    left: 22mm;
    right: 22mm;
    border-top: 1px solid #000;
    padding-top: 3mm;
    font-size: 10pt;
    font-weight: bold;
    font-style: italic;
  }
  /* Reserve space so content doesn't overlap NB */
  .nb-spacer { height: 18mm; flex-shrink: 0; }

  @media print {
    html, body { margin: 0; padding: 0; width: 100%; }
    @page { size: A4 portrait; margin: 0; }
    .page { width: 210mm; height: 297mm; padding: 18mm 22mm 15mm 22mm; }
  }
</style></head><body>
<div class="page">

  <div class="societe">${societeLabel}</div>

  <div class="header-right">……………..Le : ${fmtD(de.date_demande)}</div>

  <div class="titre-block">
    <span class="titre">DEMANDE D'EXPERTISE MEDICALE</span>
  </div>

  <!-- DR affiché à droite, sans ligne sous le titre -->
  <div class="dr-block">DR : ${(de.dr||'').trim() || '…………………………………………………………………'}</div>

  <div class="cher">Cher Confère</div>
  <div class="intro">J'ai l'honneur de vous adresser pour expertise médicale :</div>

  <div class="identite">
    Nom : ${nomVal}<br>
    Prénom : ${prenomVal}<br>
    Matricule Leoni : ${matriculeVal}
  </div>

  <div class="pieces-zone">
    <span class="s-titre">Piece jointes :</span><br>
    <div class="pieces-val">${piecesVal}</div>
  </div>

  <div class="missions-zone">
    <span class="s-titre">Mission objet de l'expertise :</span>
    <ul class="mission-ul">
      <li>Examiner L'intéressé (e) ;</li>
      <li>Préciser si le repos prescrit par son médecin traitant est justifié par son état de santé actuel el la date éventuelle de la reprise du travail.</li>
      <li>Préciser son aptitude médicale actuelle au poste de :&nbsp; ${posteVal}</li>
      <li>Autres missions :<br>&nbsp;&nbsp;${autresVal || '…………………………………………………………………………………………………'}</li>
    </ul>
  </div>

  <div class="honoraires">Afin de permettre le règlement de vos honoraires dans les meilleures conditions, nous vous prions de bien vouloir accompagner votre rapport par un mémoire de règlement d'honoraires établi en deux exemplaires selon le modèle ci-joint.</div>

  <div class="flex-spacer"></div>

  <div class="salutation">Bien confraternellement</div>
  <div class="signature">${medecinLabel} de la société ${signatureSociete}</div>

  <div class="flex-spacer"></div>
  <div class="nb-spacer"></div>

  <div class="nb-zone">NB : Prière de ne donner à la personne examinée aucune indication sur les chances de succès de sa demande.</div>

</div></body></html>`;

  printHTML(html);
}

/* 
   BLOC RECHERCHE PAR MATRICULE
   Utilise searchCollaborateurs (endpoint /employees/collaborateurs/?search=...)
   → récupère nom/prénom/matricule/poste directement depuis la base collaborateurs
    */
function RechercheMatricule({ onFound }) {
  const [matricule, setMatricule] = useState('');
  const [status,    setStatus]    = useState('idle'); // idle | loading | found | notfound

  const handleSearch = async () => {
    const needle = matricule.trim();
    if (!needle) return;
    setStatus('loading');
    try {
      const list = await searchCollaborateurs(needle);
      // Correspondance exacte obligatoire sur matricule
      const collab = list.find((c) => String(c?.matricule || '').trim() === needle);
      if (collab) {
        onFound({
          collaborateur_nom:       collab.nom       || '',
          collaborateur_prenom:    collab.prenom     || '',
          collaborateur_matricule: collab.matricule  || needle,
          poste:                   collab.poste      || '',
        });
        setStatus('found');
      } else {
        setStatus('notfound');
      }
    } catch {
      setStatus('notfound');
    }
  };

  return (
    <div style={{ background: C.light2, borderRadius: 12, border: `1px solid ${C.light}`, padding: '14px 16px' }}>
      <label style={labelCss}>Recherche rapide par matricule</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ ...inputS, flex: 1 }}
          placeholder="Ex: 12345"
          value={matricule}
          onChange={e => { setMatricule(e.target.value); setStatus('idle'); }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button
          onClick={handleSearch}
          disabled={status === 'loading' || !matricule.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', border: 'none', borderRadius: 9, flexShrink: 0,
            background: !matricule.trim() ? '#e2e8f0' : `linear-gradient(135deg,${C.primary},${C.accent})`,
            color: !matricule.trim() ? '#94a3b8' : 'white',
            fontSize: 13, fontWeight: 700, cursor: !matricule.trim() ? 'not-allowed' : 'pointer',
            transition: 'all .15s',
          }}>
          {status === 'loading' ? <IcoSpin /> : <IcoSearch />}
          {status === 'loading' ? 'Recherche…' : 'Rechercher'}
        </button>
      </div>
      {status === 'found' && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0f766e', background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: 8, padding: '8px 12px' }}>
          <IcoCheck c="#10b981" /> Correspondance exacte trouvée — champs remplis automatiquement
        </div>
      )}
      {status === 'notfound' && (
        <div style={{ marginTop: 10, fontSize: 13, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
          Aucun résultat pour ce matricule. Remplissez manuellement.
        </div>
      )}
    </div>
  );
}

/* 
   FORMULAIRE DEMANDE D'EXPERTISE (création + modification)
    */
const getInitialForm = (de) => ({
  dr: de?.dr || '',
  date_demande: de?.date_demande || new Date().toISOString().split('T')[0],
  collaborateur_nom: de?.collaborateur_nom || '',
  collaborateur_prenom: de?.collaborateur_prenom || '',
  collaborateur_matricule: de?.collaborateur_matricule || '',
  pieces_jointes: de?.pieces_jointes || '',
  poste: de?.poste || '',
  autres_missions: de?.autres_missions || '',
  site: de?.site_id || de?.site || '',
});

function DemandeExpertiseForm({ medecinNom, onClose, mode = 'create', initialDemande = null, onSaved }) {
  const { user } = useAuth();
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    ...getInitialForm(initialDemande),
  });
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(null);
  const [identiteAutoFilled, setIdentiteAutoFilled] = useState(false);

  useEffect(() => {
    setForm(getInitialForm(initialDemande));
    setSuccess(null);
    setError('');
    setIdentiteAutoFilled(false);
  }, [initialDemande, mode]);

  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      setLoadingSites(true);
      try {
        const data = await getSites();
        const list = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setSites(list);
          setForm((prev) => {
            if (prev.site) return prev;
            if (user?.site_id) return { ...prev, site: String(user.site_id) };
            if (list.length === 1) {
              const onlyId = list[0]?.id ?? list[0]?.site_id ?? list[0]?.pk;
              if (onlyId !== null && onlyId !== undefined) return { ...prev, site: String(onlyId) };
            }
            return prev;
          });
        }
      } catch {
        if (!cancelled) setSites([]);
      } finally {
        if (!cancelled) setLoadingSites(false);
      }
    };

    loadSites();
    return () => { cancelled = true; };
  }, [user]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const enrichWithSiteContext = (demande) => {
    const selectedSite = sites.find((site) => {
      const id = site?.id ?? site?.site_id ?? site?.pk;
      return String(id) === String(form.site);
    });

    if (!selectedSite) return demande;

    return {
      ...demande,
      site: demande?.site ?? (selectedSite?.id ?? selectedSite?.site_id ?? selectedSite?.pk),
      site_id: demande?.site_id ?? (selectedSite?.id ?? selectedSite?.site_id ?? selectedSite?.pk),
      site_nom: demande?.site_nom ?? selectedSite?.nom ?? selectedSite?.site_nom ?? selectedSite?.name,
      site_ville: demande?.site_ville ?? selectedSite?.ville ?? selectedSite?.site_ville,
      company_name: demande?.company_name ?? selectedSite?.company_name ?? selectedSite?.raison_sociale,
    };
  };

  const handleMatriculeFound = (data) => {
    setForm(p => ({
      ...p,
      collaborateur_nom:       data.collaborateur_nom       || p.collaborateur_nom,
      collaborateur_prenom:    data.collaborateur_prenom    || p.collaborateur_prenom,
      collaborateur_matricule: data.collaborateur_matricule || p.collaborateur_matricule,
      poste:                   data.poste                   || p.poste,
    }));
    setIdentiteAutoFilled(true);
  };

  const handleIdentityChange = (field, value) => {
    set(field, value);
    if (identiteAutoFilled && !value?.trim()) setIdentiteAutoFilled(false);
  };


  
  const isFormComplete = true;

  const handleSubmit = async () => {
    if (!String(form.site || '').trim()) {
      setError('Le champ site est obligatoire.');
      return;
    }

    const normalizedSite = Number.isNaN(Number(form.site)) ? form.site : Number(form.site);
    const payload = { ...form, site: normalizedSite };

    if (isEdit) {
      
      setError('');
      setLoading(true);
      let updated = { ...initialDemande, ...payload };
      try {
        if (initialDemande?.id) {
          const saved = await updateDemandeExpertise(initialDemande.id, payload);
          updated = { ...updated, ...saved };
        }
      } catch {

      } finally {
        setLoading(false);
      }

      const updatedWithSite = enrichWithSiteContext(updated);
      setForm(getInitialForm(updatedWithSite));
      onSaved?.(updatedWithSite);
      ouvrirDemandeExpertise(updatedWithSite, medecinNom);
      return;
    }

    
    setError(''); setLoading(true);
    try {
      const de = await creerDemandeExpertise({ ...payload, contre_visite: null });
      const deWithSite = enrichWithSiteContext(de);
      setSuccess(deWithSite);
      ouvrirDemandeExpertise(deWithSite, medecinNom);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.response?.data?.dr?.[0] || 'Erreur lors de la création.');
    } finally { setLoading(false); }
  };

  if (!isEdit && success) return (
    <div style={{ background: 'white', borderRadius: 18, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px rgba(2,132,199,.1)', padding: 36, textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf9', border: '2px solid #34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <IcoCheck c="#34d399" size={28} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 6 }}>Demande créée — PDF ouvert</h3>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>
        {success.collaborateur_prenom} {success.collaborateur_nom} · {new Date(success.date_demande).toLocaleDateString('fr-FR')}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={() => ouvrirDemandeExpertise(success, medecinNom)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', border: 'none', borderRadius: 9, background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 3px 10px rgba(2,132,199,.3)` }}>
          <IcoDownload /> Ré-imprimer
        </button>
        <button onClick={() => { onSaved && onSaved(success); onClose(); }} style={{ padding: '10px 22px', border: `1.5px solid ${C.border}`, borderRadius: 9, background: 'white', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
      </div>
    </div>
  );

  return (
    <div>
      {isEdit && (
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '8px 16px', border: `1.5px solid ${C.border}`, borderRadius: 9, background: 'white', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <IcoArrow /> Retour à la liste
        </button>
      )}

      <div style={{ background: 'white', borderRadius: 18, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px rgba(2,132,199,.1)', overflow: 'hidden' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.light}`, background: C.light2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C.primary},${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcoDoc c="white" /></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>Demande d'Expertise Médicale</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{isEdit ? 'Modification de demande' : 'Nouvelle demande'}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, border: `1.5px solid ${C.border}`, background: 'white', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 9, fontSize: 13 }}>{error}</div>}

        {/* DR + Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 14 }}>
          <Field label="DR — Docteur destinataire">
            <input style={inputS} placeholder="Nom complet du médecin expert" value={form.dr} onChange={e => set('dr', e.target.value)} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
          <Field label="Date">
            <input type="date" style={inputS} value={form.date_demande} onChange={e => set('date_demande', e.target.value)} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
        </div>

        <Field label="Site *">
          <select
            style={inputS}
            value={form.site}
            onChange={e => set('site', e.target.value)}
            disabled={loadingSites || loading}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border}
          >
            <option value="">{loadingSites ? 'Chargement des sites...' : 'Choisir un site'}</option>
            {sites.map((site) => {
              const id = site?.id ?? site?.site_id ?? site?.pk;
              const nomSite = site?.nom ?? site?.site_nom ?? site?.name ?? `Site #${id}`;
              return <option key={String(id)} value={String(id)}>{nomSite}</option>;
            })}
          </select>
        </Field>

        {/* Recherche matricule */}
        <RechercheMatricule onFound={handleMatriculeFound} />

        {/* Identité collaborateur */}
        <div style={{ background: identiteAutoFilled ? '#f0fdf9' : 'white', borderRadius: 12, border: `1px solid ${identiteAutoFilled ? '#99f6e4' : C.light}`, padding: '14px 16px', transition: 'all .3s' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: identiteAutoFilled ? '#0f766e' : C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
            {identiteAutoFilled && <IcoCheck c="#10b981" size={14} />} Identité du collaborateur
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 12 }}>
            <Field label="Nom"><input style={inputS} value={form.collaborateur_nom} onChange={e => handleIdentityChange('collaborateur_nom', e.target.value)} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} /></Field>
            <Field label="Prenom"><input style={inputS} value={form.collaborateur_prenom} onChange={e => handleIdentityChange('collaborateur_prenom', e.target.value)} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} /></Field>
            <Field label="Matricule"><input style={inputS} value={form.collaborateur_matricule} onChange={e => handleIdentityChange('collaborateur_matricule', e.target.value)} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} /></Field>
          </div>
        </div>

        {/* Pièces jointes */}
        <Field label="Pieces jointes">
          <textarea style={textareaS} placeholder="Liste des documents joints…" value={form.pieces_jointes} onChange={e => set('pieces_jointes', e.target.value)} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>

        {/* Poste + Autres missions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Poste de travail"><input style={inputS} placeholder="Ex: Opérateur câblage" value={form.poste} onChange={e => set('poste', e.target.value)} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} /></Field>
          <Field label="Autres missions"><input style={inputS} placeholder="Mission complémentaire…" value={form.autres_missions} onChange={e => set('autres_missions', e.target.value)} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} /></Field>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', border: `1.5px solid ${C.border}`, borderRadius: 9, background: 'white', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          {isFormComplete && (
            <button onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 26px', border: 'none', borderRadius: 9, background: loading ? '#94a3b8' : `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 3px 10px rgba(2,132,199,.3)`, transition: 'all .15s' }}>
              {loading ? <><IcoSpin /> Création…</> : isEdit ? <><IcoDownload /> Imprimer PDF modifié</> : <><IcoDoc c="white" /> Créer &amp; Générer PDF</>}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export function FormulaireDemandeExpertise({ medecinNom, onClose }) {
  return <DemandeExpertiseForm medecinNom={medecinNom} onClose={onClose} mode="create" />;
}

export function PopupExpertiseDirect({ cv, medecinNom, onClose, onSaved, initialDemande: existingDemande }) {
  const nomComplet = String(cv?.nom_prenom || '').trim();
  const parts = nomComplet ? nomComplet.split(/\s+/) : [];
  const nom = cv?.collaborateur_nom || parts[0] || '';
  const prenom = cv?.collaborateur_prenom || parts.slice(1).join(' ') || '';
  const matricule = cv?.matricule || cv?.collaborateur_matricule || '';
  const poste = cv?.poste || cv?.collaborateur_poste || '';

  // Si une demande existe deja => mode edit, sinon creation
  const isEdit = !!existingDemande?.id;
  const initialDemande = existingDemande || {
    dr: '',
    date_demande: new Date().toISOString().split('T')[0],
    collaborateur_nom: nom,
    collaborateur_prenom: prenom,
    collaborateur_matricule: matricule,
    pieces_jointes: '',
    poste,
    autres_missions: '',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.45)',
        zIndex: 90,
        padding: '30px 18px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{ maxWidth: 980, margin: '0 auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <DemandeExpertiseForm
          medecinNom={medecinNom}
          onClose={onClose}
          mode={isEdit ? "edit" : "create"}
          initialDemande={initialDemande}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}

/* 
   VUE LISTE — Toutes les demandes d'expertise
    */
export function DemandesExpertiseView({ medecinNom, onNouvelleExpertise }) {
  const [demandes, setDemandes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editDe,   setEditDe]   = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getDemandesExpertise();
        setDemandes(Array.isArray(data) ? data : (data.results || []));
      } catch { setDemandes([]); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {[1,2,3].map(i => <div key={i} style={{ height: 64, borderRadius: 10, marginBottom: 8, background: 'linear-gradient(90deg,#f0f9ff 25%,#e0f2fe 50%,#f0f9ff 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}/>)}
    </div>
  );

  /* ── Vue Modifier ── */
  if (editDe) {
    return (
      <DemandeExpertiseForm
        medecinNom={medecinNom}
        onClose={() => setEditDe(null)}
        mode="edit"
        initialDemande={editDe}
        onSaved={(updated) => {
          setDemandes((prev) => prev.map((de) => (de.id === updated.id ? { ...de, ...updated } : de)));
          setEditDe(updated);
        }}
      />
    );
  }

  /* ── Liste ── */
  return (
    <div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{demandes.length} demande{demandes.length !== 1 ? 's' : ''}</div>
        <button onClick={onNouvelleExpertise} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', border: 'none', borderRadius: 9, background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 3px 10px rgba(2,132,199,.3)` }}>
          <IcoPlus /> Nouvelle Demande
        </button>
      </div>

      {demandes.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: `1.5px dashed ${C.border}`, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>📋</div>
          <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Aucune demande d'expertise</p>
          <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>Cliquez sur "Nouvelle Demande" pour en créer une</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {demandes.map(de => (
            <div key={de.id} style={{ background: 'white', borderRadius: 14, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.primary}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow .15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px rgba(2,132,199,.12)`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.05)'}>

              <div style={{ width: 44, height: 44, borderRadius: 11, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IcoDoc />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{de.collaborateur_prenom} {de.collaborateur_nom}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: C.light, color: C.primary, padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11.5 }}>{de.collaborateur_matricule}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>DR : {de.dr}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{new Date(de.date_demande).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {/* MODIFIER */}
                <button onClick={() => setEditDe(de)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: `1.5px solid ${C.border}`, borderRadius: 7, background: 'white', color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.light}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <IcoEdit /> Voir / Modifier
                </button>
                {/* PDF */}
                <button onClick={() => ouvrirDemandeExpertise(de, medecinNom)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: 'none', borderRadius: 7, background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 6px rgba(2,132,199,.25)` }}>
                  <IcoDownload /> PDF
                </button>
                {/* SUPPRIMER */}
                <button onClick={async () => {
                  const ok = await uiConfirm({
                    title: 'Suppression',
                    text: "Supprimer définitivement cette demande d'expertise ?",
                    confirmButtonText: 'Supprimer',
                  });
                  if (!ok) return;
                  try {
                    await supprimerDemandeExpertise(de.id);
                    setDemandes(prev => prev.filter(d => d.id !== de.id));
                  } catch {
                    await uiAlert({ icon: 'error', title: 'Suppression', text: 'Erreur lors de la suppression.' });
                  }
                }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', border: '1.5px solid #dc2626', borderRadius: 7, background: 'white', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#dc2626'; }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}