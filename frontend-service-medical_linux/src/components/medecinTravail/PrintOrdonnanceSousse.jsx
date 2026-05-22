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

function buildHtml(fiche, form, siteConfig) {
  const fi = fiche || {};
  const fiOrd = fi.ordonnance || fi.ordonnances?.[0] || {};
  const fo = form || fiOrd;
  const dateSource = fo.date_ordonnance || fo.date || fiOrd.date_ordonnance || fiOrd.date || fi.date_visite || new Date();
  const date = dateSource ? new Date(dateSource).toLocaleDateString('fr-FR') : '';
  const prescription = esc(
    fo.prescription || fo.medicaments || fo.contenu || fo.description ||
    fiOrd.prescription || fiOrd.medicaments || fiOrd.contenu || fiOrd.description || ''
  );

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>FOR-AMT-09</title>
  <style>
  @page { size: A4 portrait; margin: 12mm 12mm 12mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: #000; font-size: 10pt; background: white; }
  .page { width: 100%; min-height: 273mm; display: flex; flex-direction: column; }

  /* ── EN-TÊTE : logo seul à gauche + encadré à droite ── */
  .header {
    display: flex;
    align-items: stretch;
    margin-bottom: 14px;
  }
  .logo-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-right: 12px;
    text-align: center;
    min-width: 100px;
  }
  .logo-img { width: 65px; height: auto; object-fit: contain; }
  .logo-iso { font-size: 7pt; font-weight: 700; margin-top: 4px; }

  .header-right {
    flex: 1;
    border: 1.5px solid #000;
    display: grid;
    grid-template-columns: 1fr 120px;
  }
  .header-right > div { border-right: 1.5px solid #000; }
  .header-right > div:last-child { border-right: none; }

  .title-col {
    padding: 7px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 2px;
  }
  .title-formulaire { font-size: 8.5pt; font-weight: 900; }
  .title-main { font-size: 10pt; font-weight: 900; text-transform: uppercase; }

  .ref-col {
    padding: 6px 8px;
    font-size: 8.5pt;
    font-weight: 800;
    line-height: 1.7;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* ── DATE ── */
  .date-line {
    text-align: right;
    font-size: 10pt;
    font-style: italic;
    font-weight: 700;
    margin-bottom: 14px;
  }
  .fill-date {
    display: inline-block;
    border-bottom: 1px dotted #000;
    min-width: 160px;
    padding: 0 2px;
  }

  /* ── ZONE PRESCRIPTION (grande zone vide) ── */
  .rx-zone {
    flex: 1;
    font-size: 11pt;
    line-height: 1.8;
    padding: 4px 0;
    white-space: pre-wrap;
    min-height: 150mm;
  }

  /* ── SIGNATURE ── */
  .signature-space {
    height: 16mm;
  }
  .signature {
    text-align: right;
    font-size: 14pt;
    font-style: italic;
    font-family: "Times New Roman", serif;
    margin-top: 0;
    margin-bottom: 6px;
  }

  /* ── PIED DE PAGE ── */
  .footer {
    border-top: 1.5px solid #000;
    margin-top: auto;
    padding-top: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .footer-cert { width: 60px; height: auto; object-fit: contain; }
  .footer-addr { flex: 1; text-align: center; font-size: 8.2pt; font-weight: 700; line-height: 1.25; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style></head><body>
  <div class="page">

    <!-- EN-TÊTE -->
    <div class="header">
      <div class="logo-col">
        <img class="logo-img" src="${SOUSSE_GMTGS_LOGO}" alt="Logo GMTGS"/>
        <div class="logo-iso">Certifié ISO 9001:2000</div>
      </div>
      <div class="header-right">
        <div class="title-col">
          <div class="title-formulaire">FORMULAIRE</div>
          <div class="title-main">ORDONNANCE MÉDICALE</div>
        </div>
        <div class="ref-col">
          <div>FOR-AMT-09</div>
          <div>Edition : 01</div>
          <div>Page 1 sur 1</div>
        </div>
      </div>
    </div>

    <!-- DATE -->
    <div class="date-line">Sousse, le : <span class="fill-date">${esc(date)}</span></div>

    <!-- ZONE PRESCRIPTION VIDE (grande zone blanche) -->
    <div class="rx-zone">${prescription}</div>

    <!-- SIGNATURE + ESPACE EN DESSOUS -->
    <div class="signature">Le Médecin du Travail</div>
    <div class="signature-space"></div>

    <!-- PIED DE PAGE -->
    <div class="footer">
      <img class="footer-cert" src="${SOUSSE_CERT_LOGO}" alt="TUV Certification"/>
      <div class="footer-addr">
        Groupement de Médecine du Travail du Gouvernorat de Sousse<br/>
        Rue Cap Vert Sahloul 1 Sousse 4054<br/>
        Tél. : 73 820 195 / 73 820 196 / 73 820 197 - Fax : 73 820 194<br/>
        E-mail : gmtgs.technique@gmail.com
      </div>
    </div>

  </div>
  </body></html>`;
}

export default function PrintOrdonnanceSousse({ fiche, form }) {
  function handlePrint() {
    const siteConfig = getSitePrintConfig(fiche, form);
    printHTML(buildHtml(fiche, form, siteConfig));
  }

  return (
    <button
      onClick={handlePrint}
      title="Imprimer ordonnance"
      style={primaryActionButtonStyle()}
      onMouseEnter={primaryActionBtnEnter}
      onMouseLeave={primaryActionBtnLeave}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Imprimer ordonnance
    </button>
  );
}