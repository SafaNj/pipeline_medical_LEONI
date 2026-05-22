import { printHTML } from '../../utils/printHelper';
import { getSitePrintConfig } from '../../utils/siteConfig';

function buildHTML(certificat, medecin, siteConfigInput) {
  const c = certificat || {};
  const m = medecin || {};
  const siteConfig = getSitePrintConfig(siteConfigInput, c, m);
  const fmt = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('fr-FR');
  };

  // Prioritize first_name + last_name over username
  const nomMedecin = (m.first_name && m.last_name ? m.first_name + ' ' + m.last_name : '') || m.full_name || m.nom || m.username || 'Médecin';
  const specialite = m.specialite || m.specialite_medecin || c.specialite_medecin || '—';
    const specialite_ar = m.specialite_ar || 'طب عام';
  const inscription = m.numero_ordre || m.numero_ordre_medecin || c.numero_ordre_medecin || '—';
  const numeroAdresseMedecin = c.numero_adresse_medecin || c.adresse_medecin || m.numero_adresse_medecin || m.adresse_medecin || m.adresse || '—';
  const ville = m.ville || m.ville_medecin || c.ville_medecin || '—';
  const gouvernorat = m.gouvernorat || m.gouvernorat_medecin || c.gouvernorat_medecin || '—';
  const lieu = c.lieu_signature || c.lieu_emission || m.ville || '—';
  const dateEmission = fmt(c.date_emission || new Date());
  const patient = c.nom_prenom || c.nom_patient || '—';
  const cin = c.cin || '—';
  const cinDelivreeA = c.cin_delivree_a || '—';
  const dateCin = fmt(c.cin_date);

  const renderCheck = (checked) => `<span style="display:inline-block;width:11px;height:11px;border:1px solid #111;vertical-align:middle;margin-left:6px;">${checked ? 'x' : ''}</span>`;
  const field = (value, widthClass = 'medium') => `<span class="line-fill ${widthClass}">${value || ''}</span>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>CERTIFICAT MEDICAL PRENUPTIAL</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: white;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 13mm 8mm;
      position: relative;
    }
    .title {
      text-align: center;
      font-size: 14pt;
      font-weight: 700;
      margin: 2mm 0 8mm;
      letter-spacing: 0.2px;
    }
    .header-line {
      font-size: 9.5pt;
      line-height: 1.35;
      margin-bottom: 2mm;
    }
    .fields {
      font-size: 9.5pt;
      line-height: 1.28;
    }
    .line-fill {
      display: inline-block;
      border-bottom: 1px dotted #111;
      min-width: 40mm;
      height: 11px;
      vertical-align: baseline;
      line-height: 1;
      padding: 0 2px 1px;
      text-align: center;
    }
    .line-fill.short { min-width: 20mm; }
    .line-fill.medium { min-width: 30mm; }
    .line-fill.long { min-width: 48mm; }
    .center-line {
      text-align: center;
      margin: 4mm 0 5mm;
      font-size: 9.5pt;
    }
    .body-text {
      font-size: 9.4pt;
      line-height: 1.28;
      text-align: left;
    }
    .block {
      margin-bottom: 2mm;
    }
    .checks {
      margin: 2mm 0 3mm 0;
      padding-left: 0;
      font-size: 9.4pt;
      line-height: 1.28;
    }
    .checks .item {
      margin-left: 1mm;
    }
    .bullet {
      display: inline-block;
      width: 8px;
    }
    .footer-sign {
      margin-top: 7mm;
      text-align: center;
      font-size: 9.5pt;
    }
    .fait {
      margin-top: 6mm;
      text-align: center;
      font-size: 9.5pt;
    }
    .bottom-rule {
      position: absolute;
      left: 16mm;
      right: 16mm;
      bottom: 15mm;
      border-top: 1px solid #b5b5b5;
    }
    .observation {
      position: absolute;
      left: 16mm;
      right: 16mm;
      bottom: 3.5mm;
      font-size: 7.1pt;
      color: #444;
      line-height: 1.18;
    }
    .observation-title {
      font-weight: 700;
      margin-bottom: 1px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="title">CERTIFICAT MEDICAL PRENUPTIAL</div>

    <div class="header-line">Je soussigné,</div>
    <div class="fields">Nom et Prénom : ${field(nomMedecin, 'long')}</div>
    <div class="fields">Docteur en médecine, spécialité : ${field(specialite, 'long')}</div>
    <div class="fields">N° d'inscription au Conseil de l'Ordre des Médecins : ${field(inscription, 'long')}</div>
    <div class="fields">exerçant à : ${field(lieu, 'medium')}</div>
    <div class="fields">Adresse : N° ${field(numeroAdresseMedecin, 'short')} Rue / Av. ${field(ville, 'medium')}</div>
    <div class="fields">Ville / localité / gouvernorat : ${field(`${ville} / ${gouvernorat}`, 'long')}</div>

    <div class="fields" style="margin-top:3mm;">Certifie avoir examiné, en vue du mariage M. ${field(patient, 'medium')}</div>
    <div class="fields">Né(e) le ${field(c.date_naissance ? fmt(c.date_naissance) : '', 'medium')} à : ${field(c.lieu_naissance || '', 'medium')}</div>
    <div class="fields">demeurant à : ${field(c.adresse_patient || c.adresse || '', 'long')}</div>
    <div class="fields">C.I.N. N° ${field(cin, 'medium')} délivrée à ${field(cinDelivreeA, 'medium')} le ${field(dateCin, 'medium')}</div>

    <div class="body-text" style="margin-top:5mm;">
      Etabli le présent certificat après avoir procédé à un interrogatoire minutieux et à un examen clinique complet et pris connaissance des résultats des examens complémentaires suivants : (Mettre une croix dans la case correspondante)
    </div>

    <div class="checks">
      <div class="item"><span class="bullet">-</span> Groupe sanguin ${renderCheck(c.groupe_sanguin_fait)}</div>
      <div class="item"><span class="bullet">-</span> Hépatite Virale B ${renderCheck(c.hepatite_b_fait)}</div>
      <div class="item"><span class="bullet">-</span> Hépatite Virale C ${renderCheck(c.hepatite_c_fait)}</div>
      <div class="item"><span class="bullet">-</span> Radiographie du Thorax par Rayon x ${renderCheck(c.radio_thorax_fait)}</div>
      <div class="item"><span class="bullet">-</span> Autres ${field(c.autres_examens || '', 'medium')}</div>
    </div>

    <div class="body-text">
      Déclare en outre avoir :
    </div>

    <div class="body-text" style="margin-top:1mm;">
      - Informé l'intéressé(e) des résultats des examens cliniques et complémentaires et des actions de nature à prévenir ou à réduire le risque pour lui (elle), son conjoint et sa descendance.<br />
      - Attiré l'attention de la future épouse des risques d'une éventuelle Rubéole contractée au cours de la grossesse et l'avoir informé de l'existence d'un vaccin.<br />
      - Insisté sur les facteurs de risques propices pour quelques maladies (diabète, hypertension artérielle... etc).<br />
      - Conseillé l'intéressé(e) de se faire vacciner contre l'hépatite B.<br />
      - Avoir prodigué un conseil génétique y compris celui lié à la parenté entre les deux époux supposés et des conseils sur les méthodes de planification des naissances et insisté sur la nécessité de la surveillance de grossesse.
    </div>

    <div class="body-text" style="margin-top:3mm;">
      En foi de quoi, délivre le présent certificat à l'intéressé(e) en mains propres pour servir et valoir ce que de droit.
    </div>

    <div class="fait">Fait à ${field(lieu, 'medium')} le ${field(dateEmission, 'medium')}</div>
    <div class="footer-sign">Signature et cachet</div>

    <div class="bottom-rule"></div>
    <div class="observation">
      <div class="observation-title">Observation :</div>
      Toute personne, se sachant atteinte d'une maladie transmissible et qui par son comportement concourt délibérément à sa transmission à d'autres personnes, est passible d'un emprisonnement de 3 ans (Loi n° 92-71 du 27 juillet 1992, relative aux maladies transmissibles: Articles 11 et 18).
    </div>

    <div style="display:flex;justify-content:space-between;position:absolute;left:16mm;right:16mm;bottom:20mm;font-size:9.5pt;font-weight:700;">
      <div>${siteConfig.footerCompanySite || 'Leoni Menzel Hayet'}</div>
      <div>${siteConfig.medicalServiceName || 'Service Medical'}</div>
    </div>
  </div>
</body>
</html>`;
}

export default function PrintCertificatPrenuptial({ certificat, medecin, siteConfig }) {
  const disabled = !certificat;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => printHTML(buildHTML(certificat, medecin, siteConfig))}
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
