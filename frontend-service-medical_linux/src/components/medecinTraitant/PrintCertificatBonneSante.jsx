import { printHTML } from '../../utils/printHelper';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { useAuth } from '../../context/AuthContext';

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function resolveMedecinNameFr(med = {}) {
  const first = cleanText(med.first_name);
  const last = cleanText(med.last_name);
  const full = cleanText(med.full_name);
  const nom = cleanText(med.nom);
  const username = cleanText(med.username).replace(/[_\-.]+/g, ' ').trim();
  return (first && last ? `${first} ${last}` : '') || full || nom || username || 'Médecin';
}

function resolveMedecinNameAr(med = {}) {
  const prenomAr = cleanText(med.prenom_ar || med.first_name_ar || med.firstname_ar || med.firstNameAr);
  const nomAr = cleanText(med.nom_ar || med.last_name_ar || med.lastname_ar || med.lastNameAr);
  const fullAr = cleanText(med.full_name_ar || med.fullNameAr || med.nom_arabe);
  return fullAr || `${prenomAr} ${nomAr}`.trim() || 'الطبيب';
}

function buildHTML(certificat, medecin, siteConfigInput) {
  const c = certificat || {};
  const m = medecin || {};
  const siteConfig = getSitePrintConfig(siteConfigInput, c, m);
  const fmt = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('fr-FR');
  };

  const nomMedecin = resolveMedecinNameFr(m);
  const nomArabe = resolveMedecinNameAr(m);
  const codeConventionne = m.code_conventionne || m.codeConventionne || '1-761-82';
  const enfant = c.nom_prenom_enfant || c.nom_prenom || c.nom_patient || '—';
  const dateNaissance = fmt(c.date_naissance);
  const dateEmission = new Date(c.date_emission || new Date());
  const jour = dateEmission.getDate();
  const mois = dateEmission.toLocaleDateString('fr-FR', { month: 'long' });
  const annee = dateEmission.getFullYear();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>CERTIFICAT MÉDICAL DE BONNE SANTÉ</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Times New Roman", Times, serif;
      color: #111;
      background: white;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 14mm 14mm 12mm;
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 18mm;
      font-size: 12pt;
      color: #7a7a7a;
    }
    .header .col {
      min-width: 28%;
    }
    .header .center {
      text-align: center;
      min-width: 36%;
    }
    .label {
      font-style: italic;
      font-weight: 700;
      color: #111;
      margin-bottom: 6px;
      display: block;
    }
    .doctor-name {
      font-style: normal;
      color: #000;
      font-weight: 700;
      font-size: 12.5pt;
      white-space: nowrap;
    }
    .code-box {
      text-align: center;
      font-style: italic;
      font-weight: 700;
      color: #6b6b6b;
      line-height: 1.35;
      font-size: 11.5pt;
      margin-top: 3px;
    }
    .arabic {
      direction: rtl;
      text-align: right;
      font-size: 12.5pt;
      font-weight: 700;
      color: #111;
      line-height: 1.2;
    }
    .arabic .ar-label {
      display: block;
      font-style: italic;
      margin-bottom: 4px;
    }
    .arabic .ar-name {
      display: block;
      font-weight: 700;
      color: #000;
    }
    .date-row {
      text-align: center;
      margin: 2mm 0 14mm;
      font-style: italic;
      font-size: 12.5pt;
    }
    .date-value {
      display: inline-block;
      min-width: 70mm;
      text-align: center;
      padding: 0 6px 2px;
      font-weight: 700;
    }
    .title {
      text-align: center;
      font-size: 19pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 12mm;
      letter-spacing: 0.2px;
    }
    .content {
      font-size: 15.5pt;
      line-height: 1.8;
      text-align: justify;
      text-justify: inter-word;
      max-width: 100%;
    }
    .inline-value {
      display: inline-block;
      min-width: 34mm;
      line-height: 1.1;
      padding: 0 5px 1px;
      text-align: left;
      font-weight: 700;
    }
    .inline-value.short {
      min-width: 26mm;
    }
    .content-block {
      margin-bottom: 4mm;
    }
    .sign {
      margin-top: 24mm;
      text-align: right;
      font-size: 13.5pt;
      padding-right: 14mm;
    }
    .footer-line {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 24mm;
      height: 2px;
      background: #111;
    }
    .footer {
      position: absolute;
      left: 14mm;
      right: 14mm;
      bottom: 9mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11.5pt;
      font-weight: 700;
      color: #000;
    }
    .footer .center {
      text-align: center;
      font-style: normal;
      color: #000;
      font-weight: 700;
      font-size: 11.5pt;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="col">
        <span class="label">Docteur</span>
        <div class="doctor-name">${nomMedecin}</div>
      </div>
      <div class="col center">
        <span class="label">Code Conventionne</span>
        <div class="code-box">${codeConventionne}</div>
      </div>
      <div class="col arabic">
        <span class="ar-label">الدكتور</span>
        <span class="ar-name">${nomArabe}</span>
      </div>
    </div>

    <div class="date-row">Le <span class="date-value">${jour} / ${mois} / ${annee}</span></div>

    <div class="title">CERTIFICAT MÉDICAL DE BONNE SANTÉ</div>

    <div class="content">
      <div class="content-block">
        Je soussigné, Dr <span class="inline-value">${nomMedecin}</span>, certifie avoir reçu et examiné aujourd’hui l’enfant
        <span class="inline-value">${enfant}</span> né (e) le <span class="inline-value short">${dateNaissance}</span> et déclare qu’il (elle) est correctement vacciné(e), indemne de toutes maladies contagieuses et que son état de santé lui permet de vivre en collectivités.
      </div>
      <div class="content-block">
        Certificat délivré pour servir et valoir ce que de droit.
      </div>
    </div>

    <div class="sign">Signature</div>

    <div class="footer-line"></div>
    <div class="footer">
      <div>${siteConfig.footerCompanySite || 'Leoni Menzel Hayet'}</div>
      <div class="center">Dr ${nomMedecin}</div>
      <div>${siteConfig.medicalServiceName || 'Service Medical'}</div>
    </div>
  </div>
</body>
</html>`;
}

export default function PrintCertificatBonneSante({ certificat, medecin, siteConfig }) {
  const { user } = useAuth();
  const disabled = !certificat;

  const mergedMedecin = {
    ...user,
    ...medecin,
    // Preserve provided medecin fields when present, fallback to auth user for Arabic identity.
    prenom_ar: medecin?.prenom_ar || user?.prenom_ar || user?.first_name_ar || user?.firstname_ar || user?.firstNameAr || '',
    nom_ar: medecin?.nom_ar || user?.nom_ar || user?.last_name_ar || user?.lastname_ar || user?.lastNameAr || '',
    nom_arabe: medecin?.nom_arabe || user?.nom_arabe || user?.full_name_ar || user?.fullNameAr || '',
    full_name_ar: medecin?.full_name_ar || user?.full_name_ar || user?.fullNameAr || '',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => printHTML(buildHTML(certificat, mergedMedecin, siteConfig || user))}
      style={{
        padding: '9px 14px',
        border: '1px solid #7dd3fc',
        borderRadius: 8,
        background: disabled ? '#e2e8f0' : '#f0f9ff',
        color: disabled ? '#94a3b8' : '#0369a1',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Imprimer
    </button>
  );
}
