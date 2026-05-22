import { printHTML } from '../../utils/printHelper';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave } from './primaryActionButtonStyle';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { SOUSSE_GMTGS_LOGO_PNG as SOUSSE_GMTGS_LOGO, SOUSSE_CERT_LOGO_JPG as SOUSSE_CERT_LOGO } from './soussePrintAssets';

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br/>');
}

function ageFromDate(dateValue) {
  if (!dateValue) return '';
  const born = new Date(dateValue);
  if (Number.isNaN(born.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 ? String(age) : '';
}

function buildMessageLines(text) {
  const raw = String(text || '').replace(/\r/g, '\n');
  const rows = raw.split('\n').filter((x) => x.trim() !== '');
  const out = [];
  for (let i = 0; i < 10; i += 1) {
    out.push(rows[i] || '');
  }
  return out;
}

function buildHtml(fiche, form, siteConfig) {
  const fi = fiche || {};
  const fiLiaison = fi.fiche_liaison || fi.fiches_liaison?.[0] || {};
  const fo = form || fiLiaison;
  const dateSource = fo.date_fiche || fo.date || fiLiaison.date_fiche || fiLiaison.date || fi.date_visite || new Date();
  const date = dateSource ? new Date(dateSource).toLocaleDateString('fr-FR') : '';
  const nomPatient = fo.nom_patient || fiLiaison.nom_patient || fi.collaborateur_nom || '';
  const age = fo.age || fiLiaison.age || fi.collaborateur_age || ageFromDate(fi.collaborateur_date_naissance);
  const employeur = fo.employeur || fiLiaison.employeur || fi.raison_sociale || siteConfig?.footerCompanySite || '';
  const matricule = fo.matricule || fiLiaison.matricule || fi.collaborateur_matricule || '';
  const message = buildMessageLines(fo.message || fo.contenu || fo.description || fiLiaison.message || fiLiaison.contenu || fiLiaison.description || '');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>FOR-AMT-08</title>
  <style>
  @page { size: A4 portrait; margin: 8mm 9mm 8mm 9mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; color: #000; font-size: 9.3pt; background: white; }
  .page { width: 100%; min-height: 281mm; display: flex; flex-direction: column; }

  /* ── EN-TÊTE : logo hors cadre ── */
  .header-wrap {
    display: flex;
    align-items: stretch;
    gap: 8px;
    margin-bottom: 10px;
  }

  .logo-col {
    width: 100px;
    padding: 4px 2px 0 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
  }
  .logo-img { width: 61px; height: auto; object-fit: contain; }
  .logo-iso { font-size: 7pt; font-weight: 700; margin-top: 2px; }

  .header-box {
    flex: 1;
    border: 1.4px solid #000;
    display: grid;
    grid-template-columns: 1fr 110px;
  }
  .header-box > div:first-child { border-right: 1.4px solid #000; }

  .title-col {
    padding: 8px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 2px;
  }
  .title-formulaire { font-size: 10pt; font-weight: 700; letter-spacing: 0; }
  .title-main { font-size: 11pt; font-weight: 700; letter-spacing: 0; }

  .ref-col {
    padding: 6px 7px;
    font-size: 8.6pt;
    font-weight: 700;
    line-height: 1.18;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0;
  }

  /* ── DATE alignée à droite ── */
  .date-line {
    text-align: right;
    font-size: 9.2pt;
    font-style: italic;
    font-weight: 400;
    margin-bottom: 22px;
  }
  .fill-date {
    display: inline-block;
    border-bottom: 1px dotted #000;
    min-width: 165px;
    padding: 0 2px;
    font-style: normal;
    font-weight: 400;
  }

  .main-content {
    width: 98%;
    margin: 0 auto;
  }

  /* ── CORPS ── */
  .cher { font-style: italic; font-weight: 400; margin-bottom: 7px; font-size: 9.6pt; }
  .info-line { margin: 3px 0; font-size: 9.6pt; line-height: 1.45; }
  .fill {
    display: inline-block;
    border-bottom: 1px dotted #000;
    min-width: 150px;
    padding: 0 2px;
    font-weight: 400;
  }

  /* ── ZONE MESSAGE (lignes pointillées) ── */
  .message-zone { margin: 8px 0 10px; }
  .dot-line {
    border-bottom: 1px dotted #000;
    min-height: 16px;
    margin: 0;
    font-size: 9.2pt;
    padding: 0 2px;
  }

  /* ── FORMULE DE POLITESSE ── */
  .politesse {
    font-style: italic;
    font-size: 9.2pt;
    margin-top: 8px;
    line-height: 1.3;
    text-align: center;
    font-weight: 700;
  }

  /* ── SIGNATURE ── */
  .signature {
    text-align: right;
    font-size: 9.8pt;
    font-weight: 700;
    text-decoration: underline;
    margin-top: 28px;
    margin-right: 3px;
    font-style: italic;
  }

  /* ── ENCADRÉ NB ── */
  .nb-box {
    border: 1.6px solid #000;
    padding: 7px 12px;
    text-align: center;
    font-size: 9.6pt;
    font-weight: 700;
    line-height: 1.28;
    display: inline-block;
    min-width: 340px;
  }
  .nb-wrap { text-align: left; margin-top: 20px; margin-left: 16px; }
  .nb-line { text-decoration: underline; }

  /* ── PIED DE PAGE ── */
  .footer {
    border-top: 1px solid #000;
    margin-top: auto;
    padding-top: 6px;
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .footer-cert { width: 54px; height: auto; object-fit: contain; }
  .footer-addr { flex: 1; text-align: center; font-size: 8.3pt; font-weight: 700; line-height: 1.13; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style></head><body>
  <div class="page">

    <!-- EN-TÊTE -->
    <div class="header-wrap">
      <div class="logo-col">
        <img class="logo-img" src="${SOUSSE_GMTGS_LOGO}" alt="Logo GMTGS"/>
        <div class="logo-iso">Certifié ISO 9001</div>
      </div>
      <div class="header-box">
        <div class="title-col">
          <div class="title-formulaire">FORMULAIRE</div>
          <div class="title-main">FICHE DE LIAISON</div>
        </div>
        <div class="ref-col">
          <div>FOR-AMT-08</div>
          <div>Edition : 02</div>
          <div>Page 1 sur 1</div>
        </div>
      </div>
    </div>

    <!-- DATE -->
    <div class="date-line">Sousse le : <span class="fill-date">${esc(date)}</span></div>

    <div class="main-content">

    <!-- CORPS -->
    <div class="cher">Cher confrère</div>
    <div class="info-line">Je vous adresse M : <span class="fill" style="min-width:350px;">${esc(nomPatient)}</span></div>
    <div class="info-line">
      Agé(e) de: <span class="fill" style="min-width:52px;">${esc(age)}</span> ans, employé(e) chez
      <span class="fill" style="min-width:225px;">${esc(employeur)}</span>
      Matricule <span class="fill" style="min-width:105px;">${esc(matricule)}</span>
    </div>

    <!-- ZONE MESSAGE (10 lignes pointillées) -->
    <div class="message-zone">
      ${message.map((line) => `<div class="dot-line">${esc(line)}</div>`).join('')}
    </div>

    <!-- FORMULE DE POLITESSE -->
    <div class="politesse">
      Avec nos remerciements, agréez cher confrère nos meilleures salutations.
    </div>

    <!-- SIGNATURE -->
    <div class="signature">Le Médecin du Travail du Groupement</div>

    <!-- NB -->
    <div class="nb-wrap">
      <div class="nb-box">
        <span class="nb-line"><strong>NB :</strong>&nbsp; Prière de nous communiquer</span><br/>
        <span class="nb-line">le resultat au verso</span>
      </div>
    </div>

    </div>

    <!-- PIED DE PAGE -->
    <div class="footer">
      <img class="footer-cert" src="${SOUSSE_CERT_LOGO}" alt="Certification ISO"/>
      <div class="footer-addr">
        Groupement de Médecine du travail du Gouvernorat de Sousse<br/>
        Rue Cap Vert Sahloul 1 Sousse 4054<br/>
        Tél.: 73 820 195 / 73 820 196 / 73 820 197- Fax: 73 820 194<br/>
        E-mail : gmtgs.technique@gmail.com
      </div>
    </div>

  </div>
  </body></html>`;
}

export default function PrintFicheLiaisonSousse({ fiche, form }) {
  function handlePrint() {
    const siteConfig = getSitePrintConfig(fiche, form);
    printHTML(buildHtml(fiche, form, siteConfig));
  }

  return (
    <button
      onClick={handlePrint}
      title="Imprimer fiche de liaison"
      style={primaryActionButtonStyle()}
      onMouseEnter={primaryActionBtnEnter}
      onMouseLeave={primaryActionBtnLeave}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Imprimer fiche de liaison
    </button>
  );
}