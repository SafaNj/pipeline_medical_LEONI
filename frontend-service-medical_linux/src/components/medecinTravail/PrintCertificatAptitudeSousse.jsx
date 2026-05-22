import { printHTML } from '../../utils/printHelper';
import { deriveMessadineCertificatChoice } from '../../utils/messadineAptitudeCert';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave } from './primaryActionButtonStyle';
import { SOUSSE_GMTGS_LOGO_PNG, SOUSSE_CERT_LOGO_JPG } from './soussePrintAssets';

const SOUSSE_GMTGS_LOGO = SOUSSE_GMTGS_LOGO_PNG;
const SOUSSE_CERT_LOGO = SOUSSE_CERT_LOGO_JPG;

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br/>');
}

function fmtDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR');
}

/** Affichage date ou texte pour les lignes du certificat (ISO ou chaîne libre). */
function fmtLineDateOuTexte(value) {
  if (value == null || String(value).trim() === '') return '';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    try {
      return new Date(s.slice(0, 10)).toLocaleDateString('fr-FR');
    } catch {
      return s;
    }
  }
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('fr-FR');
  } catch {
    /* ignore */
  }
  return s;
}

function ageFromDate(dateValue) {
  if (!dateValue) return '';
  const born = new Date(dateValue);
  if (Number.isNaN(born.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age > 0 ? String(age) : '';
}

function pickValue(...values) {
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v === null || v === undefined) continue;
    if (String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function check(checked) {
  return checked ? '&#x2611;' : '&#x2610;';
}

export function buildCertificatAptitudeSousseHTML(fiche, form, externalSiteConfig) {
  const fi = fiche || {};
  const cert = form || {};
  const cfg = getSitePrintConfig(fi, cert, externalSiteConfig);

  const employeNom = pickValue(fi.collaborateur_nom, cert.nom);
  const employePrenom = pickValue(fi.collaborateur_prenom, cert.prenom);
  const employeComplet = pickValue(`${employeNom} ${employePrenom}`.trim(), fi.collaborateur_nom, cert.nom);
  const matricule = pickValue(fi.collaborateur_matricule, fi.matricule, cert.matricule);
  const poste = pickValue(fi.collaborateur_poste, fi.poste, cert.poste);
  const entreprise = pickValue(fi.raison_sociale, cert.raison_sociale, cfg.footerCompanySite);
  const medecin = pickValue(fi.medecin_nom, cert.medecin_nom);
  const dateVisite = pickValue(fi.date_visite, cert.date_visite, cert.date_demande, cert.date_emission) || new Date();
  const age = pickValue(fi.collaborateur_age, cert.age, ageFromDate(fi.collaborateur_date_naissance));
  const precision = pickValue(fi.precision_aptitude, cert.precision_aptitude, cert.description);
  const dateRepriseRaw = pickValue(fi.date_reprise, cert.date_reprise);
  const dureeAptitudeRaw = pickValue(fi.duree_aptitude, cert.duree_aptitude);

  const certMode = deriveMessadineCertificatChoice(fi);
  const isAptitudeChk = certMode === 'APTITUDE';
  const isRepriseChk = certMode === 'REPRISE_MO_AT';
  const isTemporaireChk = certMode === 'APTITUDE_TEMPORAIRE';

  const posteLibelle = pickValue(poste, fi.collaborateur_poste, cert.collaborateur_poste);
  let line1Poste = '';
  let line1bPrecisionMed = '';
  let lineDureeDate = '';
  let line2Temporaire = '';
  let line3Reprise = '';
  if (certMode === 'APTITUDE') {
    line1Poste = posteLibelle;
    line1bPrecisionMed = precision;
    lineDureeDate = fmtLineDateOuTexte(dureeAptitudeRaw || dateRepriseRaw);
  } else if (certMode === 'APTITUDE_TEMPORAIRE') {
    line2Temporaire = precision;
  } else if (certMode === 'REPRISE_MO_AT') {
    line3Reprise = pickValue(precision, dateRepriseRaw);
  }
  const ville = 'Sousse';

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>FOR-AMT-10 - Certificat Medical</title>
  <style>
    @page{size:A4 landscape;margin:9mm 10mm 9mm 10mm;}
    *{box-sizing:border-box;}
    body{font-family:Arial,sans-serif;color:#111;font-size:10pt;margin:0;padding:0;}
    .page{min-height:190mm;display:flex;flex-direction:column;}
    .top{display:grid;grid-template-columns:170px 1fr;gap:10px;align-items:start;margin-bottom:4px;}
    .left-logo{padding-top:2px;text-align:left;}
    .logo-img{width:122px;height:auto;object-fit:contain;display:block;}
    .logo-sub{font-size:9pt;font-weight:700;line-height:1.1;margin-top:1px;}
    .right-head{display:grid;grid-template-columns:1fr 130px;gap:0;align-items:stretch;height:32mm;}
    .form-main{border:1px solid #111;padding:4px 8px 3px;text-align:center;line-height:1.16;display:flex;flex-direction:column;justify-content:flex-start;}
    .form-main .t1{font-size:12.5pt;font-weight:800;letter-spacing:.2px;margin-bottom:2px;}
    .form-main .t2{font-size:10.5pt;font-weight:800;}
    .form-side{border:1px solid #111;border-left:none;padding:4px 7px;font-size:11pt;font-weight:700;line-height:1.1;text-align:left;}
    .title-row{display:grid;grid-template-columns:1fr 210px;gap:0;align-items:stretch;margin-bottom:5px;}
    .main-title{font-size:18pt;font-weight:800;text-align:center;letter-spacing:.2px;padding:7px 0 8px;}
    .type-box{border-left:1px solid #111;padding:4px 0 2px 18px;}
    .check-row{display:grid;grid-template-columns:1fr 16px;gap:6px;align-items:center;font-size:11pt;font-weight:700;line-height:1.15;margin:2px 0;}
    .box{border:1px solid #111;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;line-height:1;}
    .content{font-size:11pt;line-height:1.28;}
    .line{margin:0 0 3px;}
    .field{display:inline-block;border-bottom:1px dotted #333;height:15px;vertical-align:bottom;padding:0 2px;font-weight:700;}
    .field.full{display:block;width:100%;}
    .small-gap{height:7px;}
    .under{font-weight:700;text-decoration:underline;}
    .sign-row{display:grid;grid-template-columns:62% 38%;align-items:end;margin-top:16px;font-size:11pt;font-weight:700;}
    .sign-right{justify-self:end;width:280px;text-align:left;line-height:1.12;}
    .sign-date{display:flex;align-items:flex-end;margin-bottom:2px;}
    .sign-date .label{white-space:nowrap;}
    .sign-date .dots{display:inline-block;flex:none;width:58px;height:14px;border-bottom:1px dotted #333;margin:0 3px 2px 3px;}
    .sign-date .date{white-space:nowrap;}
    .sign-text{margin-top:0;}
    .note{font-size:11pt;font-weight:700;line-height:1.15;}
    .note .label{text-decoration:underline;}
    .footer-line{border-top:2px solid #111;margin-top:auto;padding-top:9px;}
    .footer{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center;}
    .footer-cert-img{width:122px;height:auto;object-fit:contain;display:block;margin:0 auto;}
    .footer-text{text-align:center;font-size:11pt;font-weight:800;line-height:1.2;}
    .footer-text .small{font-size:10pt;}
  </style></head><body>
  <div class="page">
    <div class="top">
      <div class="left-logo">
        <img class="logo-img" src="${SOUSSE_GMTGS_LOGO}" alt="Logo GMTGS Sousse" />
        <div class="logo-sub">Certifié ISO 9001:2008</div>
      </div>
      <div class="right-head">
        <div class="form-main">
          <div class="t1">FORMULAIRE</div>
          <div class="t2">CERTIFICAT MÉDICAL D'APTITUDE</div>
        </div>
        <div class="form-side">
          <div>FOR-AMT-10</div>
          <div>Edition : 04</div>
          <div>Décembre 2015</div>
          <div>Page 1 sur 1</div>
        </div>
      </div>
    </div>

    <div class="title-row">
      <div class="main-title">CERTIFICAT MÉDICAL</div>
      <div class="type-box">
        <div class="check-row"><span>Aptitude</span><span class="box">${isAptitudeChk ? 'X' : ''}</span></div>
        <div class="check-row"><span>Reprise MO - AT</span><span class="box">${isRepriseChk ? 'X' : ''}</span></div>
        <div class="check-row"><span>Aptitude temporaire</span><span class="box">${isTemporaireChk ? 'X' : ''}</span></div>
      </div>
    </div>

    <div class="content">
      <div class="line">Je Soussigné Docteur : <span class="field" style="width:640px;">${esc(medecin)}</span> déclare avoir</div>
      <div class="line">Examiné ce jour <span class="field" style="width:580px;">${esc(fmtDate(dateVisite))}</span> âgé (e) de <span class="field" style="width:56px;">${esc(age)}</span> ans,</div>
      <div class="line">Employé (e) chez <span class="field" style="width:450px;">${esc(entreprise)}</span> Matricule N° <span class="field" style="width:120px;">${esc(matricule)}</span> et certifie qu'il ou elle :</div>
      <div class="small-gap"></div>
      <div class="line">1) Est apte inapte pour le poste de <span class="field" style="width:98%;">${esc(line1Poste)}</span></div>
      <div class="line"><span class="field full" style="min-height:16px;">${esc(line1bPrecisionMed)}</span></div>
      <div class="line">et ce pour une durée de <span class="field" style="width:520px;">${esc(lineDureeDate)}</span></div>
      <div class="line">2) Est apte <em><strong>Temporairement</strong></em> pour une période de <span class="field" style="width:560px;">${esc(line2Temporaire)}</span></div>
      <div class="line under">En attendant les résultats des examens complémentaires</div>
      <div class="line"><span class="field full"></span></div>
      <div class="line">3) peut reprendre son travail à dater du <span class="field" style="width:600px;">${esc(line3Reprise)}</span></div>
      <div class="line"><span class="field full"></span></div>
    </div>

    <div class="sign-row">
      <div>
        <div class="note"><span class="label">NOTE :</span> Ce certificat devrait être délivré à l'employeur.</div>
      </div>
      <div class="sign-right">
        <div class="sign-date">
          <span class="label">${esc(ville)} le :</span>
          <span class="dots"></span>
          <span class="date">${esc(fmtDate(dateVisite))}</span>
        </div>
        <div class="sign-text">Le Médecin du Travail du Groupement</div>
      </div>
    </div>

    <div class="footer-line">
      <div class="footer">
        <div>
          <img class="footer-cert-img" src="${SOUSSE_CERT_LOGO}" alt="Certification ISO 9001" />
        </div>
        <div class="footer-text">
          Groupement de Médecine du travail du Gouvernorat de Sousse<br/>
          Rue Cap Vert Sahloul 1 Sousse 4054<br/>
          <span class="small">Tél.: 73 820 195 / 73 820 196 / 73 820 197. Fax: 73 820 194</span><br/>
          <span class="small">Email : gmts.sousse@topnet.tn</span>
        </div>
      </div>
    </div>
  </div>
</body></html>`;
}

export default function PrintCertificatAptitudeSousse({ fiche, form, label, title, siteConfig }) {
  const btnLabel = label || "Imprimer certificat d'aptitude";
  const btnTitle = title || btnLabel;

  function handlePrint() {
    printHTML(buildCertificatAptitudeSousseHTML(fiche, form, siteConfig));
  }

  return (
    <button
      onClick={handlePrint}
      title={btnTitle}
      style={primaryActionButtonStyle()}
      onMouseEnter={primaryActionBtnEnter}
      onMouseLeave={primaryActionBtnLeave}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      {btnLabel}
    </button>
  );
}