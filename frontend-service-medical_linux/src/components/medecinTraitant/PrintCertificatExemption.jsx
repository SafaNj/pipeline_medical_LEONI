import { printHTML } from '../../utils/printHelper';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { useAuth } from '../../context/AuthContext';

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function resolveFrenchName(med = {}) {
  const first = cleanText(med.first_name);
  const last = cleanText(med.last_name);
  const full = cleanText(med.full_name);
  const nom = cleanText(med.nom);
  const username = cleanText(med.username).replace(/[_\-.]+/g, ' ').trim();
  return (first && last ? `${first} ${last}` : '') || full || nom || username || 'Médecin';
}

function resolveArabicName(med = {}) {
  const prenomAr = cleanText(med.prenom_ar || med.first_name_ar || med.firstname_ar || med.firstNameAr);
  const nomAr = cleanText(med.nom_ar || med.last_name_ar || med.lastname_ar || med.lastNameAr);
  const fullAr = cleanText(med.full_name_ar || med.fullNameAr || med.nom_arabe);
  return fullAr || `${prenomAr} ${nomAr}`.trim() || 'الطبيب';
}

function buildHTML(certificat, medecin, siteConfigInput) {
  const c = certificat || {};
  const m = medecin || {};
  const siteConfig = getSitePrintConfig(siteConfigInput, c, m);

  const nomMedecin = resolveFrenchName(m);
  const nomArabe = resolveArabicName(m);
  const patient = c.nom_patient || c.nom_prenom || '—';
  const duree = c.duree_exemption || '—';
  const dateEmission = new Date(c.date_emission || new Date());
  const jour = dateEmission.getDate();
  const mois = dateEmission.toLocaleDateString('fr-FR', { month: 'long' });
  const annee = dateEmission.getFullYear();
  const lieu = siteConfig.siteVille || c.lieu_emission || m.ville || 'Menzel Hayet';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>CERTIFICAT MÉDICAL D’EXEMPTION</title>
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
      align-items: center;
      gap: 20px;
      margin-bottom: 18mm;
      font-size: 13.5pt;
      color: #000;
      font-weight: 700;
    }
    .doctor-section {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .doctor-prefix {
      font-style: normal;
      font-weight: 700;
      color: #000;
    }
    .doctor-name {
      font-style: normal;
      color: #000;
      font-weight: 700;
      font-size: 13.5pt;
    }
    .arabic {
      direction: rtl;
      text-align: right;
      font-size: 13.5pt;
      font-weight: 700;
      color: #000;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .ar-name {
      font-weight: 700;
      color: #000;
    }
    .place-row {
      text-align: center;
      margin: 2mm 0 18mm;
      font-style: normal;
      font-size: 12.5pt;
      font-weight: 700;
    }
    .place-value {
      display: inline-block;
      min-width: 72mm;
      text-align: center;
      padding: 0 6px;
      font-weight: 700;
    }
    .title {
      text-align: center;
      font-size: 18pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 14mm;
      letter-spacing: 0.2px;
    }
    .content {
      font-size: 15.5pt;
      line-height: 1.85;
      text-align: justify;
      text-justify: inter-word;
      max-width: 100%;
    }
    .inline-value {
      display: inline-block;
      min-width: 34mm;
      line-height: 1;
      padding: 0 5px;
      text-align: left;
      font-weight: 700;
    }
    .inline-value.short {
      min-width: 26mm;
    }
    .content-block {
      margin-bottom: 6mm;
    }
    .sign {
      margin-top: 26mm;
      text-align: right;
      font-size: 13.5pt;
      padding-right: 14mm;
      font-weight: 700;
      color: #000;
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
      font-size: 12pt;
      color: #000;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="doctor-section">
        <span class="doctor-prefix">Docteur</span>
        <span class="doctor-name">${nomMedecin}</span>
      </div>
      <div class="arabic">
        <span class="doctor-prefix">الدّكتورة</span>
        <span class="ar-name">${nomArabe}</span>
      </div>
    </div>

    <div class="place-row">${lieu} le <span class="place-value">${jour} / ${mois} / ${annee}</span></div>

    <div class="title">CERTIFICAT MÉDICAL D’EXEMPTION</div>

    <div class="content">
      <div class="content-block">
        Je soussigné, Docteur <span class="inline-value">${nomMedecin}</span>, certifie avoir reçu et examiné aujourd’hui M
        <span class="inline-value">${patient}</span> et que son état de santé nécessite une exemption du port de chaussure fermé pendant
        <span class="inline-value short">${duree}</span>.
      </div>
      <div class="content-block">
        Certificat délivré à l’intéressé(e) pour servir et valoir ce que de droit.
      </div>
    </div>

    <div class="sign">Signature</div>

    <div class="footer-line"></div>
    <div class="footer">
      <div>${siteConfig.footerCompanySite || 'Leoni Menzel Hayet'}</div>
      <div>${siteConfig.medicalServiceName || 'Service Medical'}</div>
    </div>
  </div>
</body>
</html>`;
}

export default function PrintCertificatExemption({ certificat, medecin, siteConfig }) {
  const { user } = useAuth();
  const disabled = !certificat;

  const mergedMedecin = {
    ...user,
    ...medecin,
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
