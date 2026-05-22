import { printHTML } from '../../utils/printHelper';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave } from './primaryActionButtonStyle';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { getNextPrintSequence } from './printSequence';
import { SOUSSE_GMTGS_LOGO_PNG as SOUSSE_GMTGS_LOGO, SOUSSE_CERT_LOGO_JPG as SOUSSE_CERT_LOGO } from './soussePrintAssets';

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br/>');
}

function fmtDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
}

function pickValue(...values) {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === null || value === undefined) continue;
    if (String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function buildHtml(fiche, form, siteConfig) {
  const fi  = fiche || {};
  const ex  = form  || {};
  const cfg = siteConfig || getSitePrintConfig(fi, ex);

  /* ── séquence ── */
  const directSequence = pickValue(ex.numero_examen, ex.numero, ex.sequence);
  const numericDirectSequence = /^\d+$/.test(directSequence)
    ? directSequence
    : (String(directSequence || '').match(/-(\d+)\s*$/)?.[1] || '');
  const fallbackSequence = getNextPrintSequence({
    formCode:    'FOR-AMT-06',
    templateKey: cfg.templateKey,
    siteId:      fi.site_id || cfg.site_id,
    prefix:      'FOR-AMT-06',
  });
  const sequence      = numericDirectSequence || fallbackSequence;
  const sequenceDigits = String(sequence || '').match(/(\d+)\s*$/)?.[1] || '';
  const sequenceLabel  = sequenceDigits ? sequenceDigits.slice(-6).padStart(6, '0') : '';

  /* ── données ── */
  const nom            = pickValue(fi.collaborateur_nom,           fi.nom,          ex.nom,               ex.nom_prenom);
  const prenom         = pickValue(fi.collaborateur_prenom,        fi.prenom,       ex.prenom);
  const nomComplet     = pickValue(`${nom} ${prenom}`.trim(),      fi.collaborateur_nom, ex.nom_prenom,    nom);
  const dateNaissance  = pickValue(fi.collaborateur_date_naissance, ex.date_naissance, ex.date_naissance_collaborateur);
  const profession     = pickValue(fi.collaborateur_poste,         fi.poste,        ex.profession,        ex.poste);
  const matricule      = pickValue(fi.collaborateur_matricule,     fi.matricule,    ex.matricule);
  const entreprise     = pickValue(fi.raison_sociale,              fi.entreprise,   ex.entreprise,        cfg.footerCompanySite);
  const medecinDemandeur = pickValue(fi.medecin_nom,               ex.medecin_demandeur, ex.medecin,      ex.nom_medecin);
  const dateDemande    = pickValue(ex.date_demande,                ex.date_visite,  fi.date_visite,       new Date());
  const dateRealise    = pickValue(ex.date_realise,                ex.date_realisation, fi.date_visite);

  const risquePhysique  = !!ex.risque_physique;
  const risqueChimique  = !!ex.risque_chimique;
  const risqueInfectieux = !!ex.risque_infectieux;
  const risqueChauffeur = !!ex.risque_chauffeur;

  const ecg        = !!ex.ecg;
  const spirometrie = !!ex.spirometrie;
  const audiogramme = !!ex.audiogramme;
  const visiotest  = !!ex.visiotest;
  const microfilm  = !!ex.microfilm;

  /* ── helpers HTML ── */
  const cb = (checked) =>
    `<span style="display:inline-flex;align-items:center;justify-content:center;` +
    `width:11px;height:11px;border:1.2px solid #000;font-size:8pt;font-weight:900;` +
    `flex-shrink:0;">${checked ? 'X' : '&nbsp;'}</span>`;

  /* zone extensible : si valeur → affiche valeur, sinon trait pointillé */
  const field = (value) =>
    `<span class="field-zone"><span class="field-val">${value ? esc(value) : ''}</span></span>`;

  const fieldShort = (value, w = '110px') =>
    `<span class="field-zone" style="width:${w};flex:none;"><span class="field-val">${value ? esc(value) : ''}</span></span>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>FOR-AMT-06</title>
<style>
@page { size: A4 portrait; margin: 9mm 10mm 10mm 10mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; color: #000; font-size: 10pt; background: white; }
.page { width: 100%; min-height: 274mm; display: flex; flex-direction: column; }

/* ── EN-TÊTE ── */
.header-wrap {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 6px;
}
.logo-col {
  width: 82px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  padding-top: 2px;
  flex-shrink: 0;
}
.logo-img  { width: 64px; height: auto; object-fit: contain; }
.logo-iso  { font-size: 7pt; font-weight: 700; margin-top: 3px; white-space: nowrap; }

.header-box {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 112px;
  border: 1.5px solid #000;
}
.header-box > .title-col { border-right: 1.5px solid #000; }

.title-col {
  padding: 5px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 2px;
}
.title-star       { font-size: 9pt; font-weight: 900; line-height: 1; }
.title-formulaire { font-size: 8pt; font-weight: 900; letter-spacing: 0.4px; }
.title-main       { font-size: 9pt; font-weight: 900; line-height: 1.35; }

.ref-col {
  padding: 5px 8px;
  font-size: 7.5pt;
  font-weight: 800;
  line-height: 1.65;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* ── N° SÉQUENCE ── */
.seq-line {
  text-align: right;
  font-size: 15pt;
  font-weight: 900;
  margin: 10px 0 14px;
  letter-spacing: 2px;
}

/* ── CORPS ── */
.main-content { flex: 1; display: flex; flex-direction: column; }

/* ── champ : label + zone pointillée extensible ── */
.info-line {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  margin: 6px 0;
}
.lbl { font-weight: 700; white-space: nowrap; font-size: 10pt; flex-shrink: 0; }

/* La zone s'étend et affiche soit la valeur soit une ligne pointillée */
.field-zone {
  flex: 1;
  border-bottom: 1px dotted #444;
  min-height: 15px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 1px;
  overflow: hidden;
}
.field-val {
  font-size: 10pt;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ── RISQUES ── */
.risk-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0;
  flex-wrap: wrap;
}
.risk-item { display: flex; align-items: center; gap: 4px; font-size: 10pt; }

/* ── EXAMENS ── */
.exam-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 10px 0 12px;
}
.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 5px 0;
  font-size: 10pt;
}

/* ── SIGNATURE ── */
.sign-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 16px;
  font-size: 10pt;
  font-weight: 700;
}
.sign-right { font-style: italic; font-weight: 700; text-decoration: underline; }

/* ── SÉPARATEUR TIRETS ── */
.dash-sep {
  border: none;
  border-top: 2px dashed #000;
  margin: 22px 0 14px;
}

/* ── TALON ── */
.talon-seq {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 15pt;
  font-weight: 900;
  margin-bottom: 14px;
  justify-content: flex-end;
  letter-spacing: 2px;
}
.talon-logo-img { width: 14px; height: auto; vertical-align: middle; }

/* ── PIED DE PAGE ── */
.footer {
  border-top: 1.5px solid #000;
  margin-top: auto;
  padding-top: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.footer-cert { width: 54px; height: auto; object-fit: contain; flex-shrink: 0; }
.footer-addr {
  flex: 1;
  text-align: center;
  font-size: 8pt;
  font-weight: 700;
  line-height: 1.55;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style></head><body>
<div class="page">

  <!-- ══════ EN-TÊTE ══════ -->
  <div class="header-wrap">
    <div class="logo-col">
      <img class="logo-img" src="${SOUSSE_GMTGS_LOGO}" alt="Logo GMTGS"/>
      <div class="logo-iso">Certifi&eacute; ISO 9001</div>
    </div>
    <div class="header-box">
      <div class="title-col">
        <div class="title-star">*</div>
        <div class="title-formulaire">FORMULAIRE</div>
        <div class="title-main">DEMANDE D &lsquo;EXPLORATION FONCTIONNELLE<br/>ET DEMANDE D &lsquo;EXAMEN RADIOLOGIQUE</div>
      </div>
      <div class="ref-col">
        <div>FOR-AMT-06</div>
        <div>Edition : 04</div>
        <div>Mai 2024</div>
        <div>Page 1 sur 1</div>
      </div>
    </div>
  </div>

  <div class="main-content">

    <!-- N° SÉQUENCE -->
    <div class="seq-line">&#8470;&nbsp; ${esc(sequenceLabel)}</div>

    <!-- NOM ET PRÉNOM -->
    <div class="info-line">
      <span class="lbl">- Nom et Pr&eacute;nom:</span>
      ${field(nomComplet)}
    </div>

    <!-- DATE DE NAISSANCE -->
    <div class="info-line">
      <span class="lbl">- Date de naissance:</span>
      ${field(fmtDate(dateNaissance))}
    </div>

    <!-- PROFESSION + MATRICULE -->
    <div class="info-line">
      <span class="lbl">- Profession:</span>
      ${field(profession)}
      <span class="lbl" style="margin-left:8px;">Mle:</span>
      ${fieldShort(matricule, '110px')}
    </div>

    <!-- RISQUES -->
    <div class="risk-line">
      <span class="lbl">- Risques:</span>
      <div class="risk-item">${cb(risquePhysique)}&nbsp;<span>Physique</span></div>
      <div class="risk-item">${cb(risqueChimique)}&nbsp;<span>Chimique</span></div>
      <div class="risk-item">${cb(risqueInfectieux)}&nbsp;<span>Infectieux</span></div>
      <div class="risk-item">${cb(risqueChauffeur)}&nbsp;<span>Chauffeur</span></div>
    </div>

    <!-- ENTREPRISE (largeur limitée comme l'original) -->
    <div class="info-line">
      <span class="lbl">- Entreprise:</span>
      <span class="field-zone" style="max-width:270px;">
        <span class="field-val">${entreprise ? esc(entreprise) : ''}</span>
      </span>
    </div>

    <!-- EXAMENS 2 COLONNES -->
    <div class="exam-grid">
      <div>
        <div class="check-item">${cb(ecg)}<span>- E.C.G</span></div>
        <div class="check-item">${cb(spirometrie)}<span>- Spirographie</span></div>
        <div class="check-item">${cb(audiogramme)}<span>- Audiogramme</span></div>
      </div>
      <div>
        <div class="check-item">${cb(visiotest)}<span>- Visiotest</span></div>
        <div class="check-item">${cb(microfilm)}<span>- Microfilm</span></div>
      </div>
    </div>

    <!-- DATE + SIGNATURE -->
    <div class="sign-row">
      <div>Sousse le :&nbsp;
        <span style="letter-spacing:1px;">${dateDemande ? esc(fmtDate(dateDemande)) : '........./......../............'}</span>
      </div>
      <div class="sign-right">Cachet &amp; signature du M&eacute;decin</div>
    </div>

    <!-- SÉPARATEUR TIRETS -->
    <hr class="dash-sep"/>

    <!-- ══════ TALON ══════ -->
    <div class="talon-seq">
      <img class="talon-logo-img" src="${SOUSSE_GMTGS_LOGO}" alt=""/>
      &#8470;&nbsp; ${esc(sequenceLabel)}
    </div>

    <div class="info-line">
      <span class="lbl">- Nom et Pr&eacute;nom:</span>
      <span class="field-zone" style="max-width:190px;">
        <span class="field-val">${nomComplet ? esc(nomComplet) : ''}</span>
      </span>
      <span class="lbl" style="margin-left:8px;">Mle:</span>
      ${fieldShort(matricule, '120px')}
    </div>

    <div class="info-line">
      <span class="lbl">- Entreprise:</span>
      ${field(entreprise)}
    </div>

    <div class="info-line">
      <span class="lbl">- M&eacute;decin demandeur:</span>
      ${field(medecinDemandeur)}
    </div>

    <div class="info-line">
      <span class="lbl">- Examem r&eacute;alis&eacute; le :</span>
      ${field(fmtDate(dateRealise || dateDemande))}
    </div>

    <div class="sign-row" style="margin-top:22px;">
      <div></div>
      <div class="sign-right">Cachet &amp; signature du M&eacute;decin</div>
    </div>

  </div>

  <!-- ══════ PIED DE PAGE ══════ -->
  <div class="footer">
    <img class="footer-cert" src="${SOUSSE_CERT_LOGO}" alt="Certification ISO"/>
    <div class="footer-addr">
      Groupement de M&eacute;decine du travail du Gouvernorat de Sousse<br/>
      Route de ceinture, en face de EPI School - Kalaa Seghira 4021<br/>
      T&eacute;l: 73 820 195 / 73 820 196 / 73 820 197 - Fax: 73 820 194<br/>
      E-mail : gmtgs.technique@gmail.com
    </div>
  </div>

</div>
</body></html>`;
}

export default function PrintDemandeExamenComplementaireSousse({ fiche, form }) {
  function handlePrint() {
    const siteConfig = getSitePrintConfig(fiche, form);
    const html = buildHtml(fiche, form, siteConfig);
    printHTML(html);
  }

  return (
    <button
      onClick={handlePrint}
      title="Imprimer la demande d'examens"
      style={primaryActionButtonStyle()}
      onMouseEnter={primaryActionBtnEnter}
      onMouseLeave={primaryActionBtnLeave}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Imprimer la demande d&apos;examens
    </button>
  );
}