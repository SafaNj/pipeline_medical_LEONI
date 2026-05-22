import { printHTML } from '../../utils/printHelper';
import { getSitePrintConfig } from '../../utils/siteConfig';
// PrintOrdonnance.jsx
// Pattern identique à PrintBilan.jsx du médecin du travail :
//   buildHTML() → iframe invisible → iframe.print() (sans voler le focus)
//
// Props :
//   medecin  : { nom, titre, specialite, ville }
//   data     : { patientNom, patientCin, lignes: [{ texte }] }

function buildOrdonnanceHTML(medecin, data, siteConfigInput) {
  var siteConfig = getSitePrintConfig(siteConfigInput, data, medecin);
  var med  = medecin || {};
  var d    = data    || {};
  // Prioritize first_name + last_name over username (nom)
  var nomMed  = (med.first_name && med.last_name ? med.first_name + ' ' + med.last_name : '') || med.full_name || med.nom || '';
  var nomAr    = (med.nom_ar || med.last_name_ar || med.lastname_ar || med.lastNameAr || '').trim();
  var prenomAr = (med.prenom_ar || med.first_name_ar || med.firstname_ar || med.firstNameAr || '').trim();
  var nomMedAr = (prenomAr && nomAr ? prenomAr + ' ' + nomAr : '') || (med.full_name_ar || med.fullNameAr || '').trim() || med.nom_arabe || '';
  if (!nomMedAr) nomMedAr = nomMed; // Fallback to French name if Arabic not available
  var titreMed= med.titre      || 'Docteur';
  var specMed = med.specialite || 'Médecine Générale';
  var specMedAr = med.specialite_ar || 'طب عام';
  var villeMed= med.ville      || siteConfig.siteVille || '';
  var villeMedAr = med.ville_ar || 'منزل حياة';

  var patientNom = d.patientNom || '';
  var patientCin = d.patientCin || '';
  var lignes     = Array.isArray(d.lignes) ? d.lignes : [];

  var fmt = function(dt){ return dt ? new Date(dt).toLocaleDateString('fr-FR') : ''; };
  var today = fmt(new Date());

  var col  = '#1e3a5f';
  var col2 = '#2563eb';

  // ── Lignes médicaments ───────────────────────────────────────────────
  var lignesHTML = lignes.map(function(l, i) {
    return (
      '<div style="display:flex;gap:12px;margin-bottom:10px;padding:8px 10px;' +
      'border-left:4px solid ' + col2 + ';background:#f0f6ff;border-radius:0 6px 6px 0;">' +
        '<span style="font-weight:900;color:' + col2 + ';min-width:20px;">' + (i + 1) + '.</span>' +
        '<span style="flex:1;font-size:11pt;line-height:1.6;white-space:pre-wrap;">' + (l.texte || '') + '</span>' +
      '</div>'
    );
  }).join('');

  if (!lignesHTML) {
    lignesHTML = '<div style="color:#94a3b8;font-style:italic;margin:20px 0;">Aucun médicament prescrit.</div>';
  }

  return (
    '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>' +
    '<title>Ordonnance</title>' +
    '<style>' +
    '@page{size:A4 portrait;margin:14mm 18mm 14mm 18mm;}' +
    '*{box-sizing:border-box;margin:0;padding:0;}' +
    'body{font-family:Arial,sans-serif;font-size:10.5pt;color:' + col + ';' +
         'background:white;display:flex;flex-direction:column;min-height:calc(297mm - 28mm);}' +
    /* ── En-tête ── */
    '.header{display:flex;justify-content:space-between;align-items:flex-start;' +
            'border-bottom:3px solid ' + col + ';padding-bottom:12px;margin-bottom:14px;}' +
    '.hdr-left{flex:1;}' +
    '.hdr-right{text-align:right;flex:0 0 auto;}' +
    '.medecin-nom{font-size:15pt;font-weight:900;color:' + col + ';}' +
    '.medecin-spec{font-size:10.5pt;font-weight:700;color:' + col2 + ';margin-top:2px;}' +
    '.medecin-ville{font-size:9.5pt;margin-top:4px;}' +
    '.ref-box{border:2px solid ' + col + ';padding:3px 10px;font-size:9pt;font-weight:900;display:inline-block;}' +
    /* ── Titre centre ── */
    '.title{text-align:center;font-size:15pt;font-weight:900;text-transform:uppercase;' +
           'letter-spacing:1px;color:' + col + ';margin:0 0 14px;}' +
    '.underline{width:80px;height:3px;background:' + col2 + ';margin:4px auto 14px;}' +
    /* ── Patient ── */
    '.patient-row{background:#f0f6ff;border-radius:8px;padding:8px 14px;' +
                 'display:flex;gap:20px;margin-bottom:18px;font-size:10pt;}' +
    '.patient-field{display:flex;gap:6px;align-items:center;}' +
    '.pf-label{font-weight:800;color:' + col + ';}' +
    /* ── Date ── */
    '.date-right{text-align:right;font-size:9.5pt;font-weight:700;margin-bottom:10px;}' +
    /* ── Footer ── */
    '.footer{margin-top:auto;border-top:1.5px solid ' + col + ';padding-top:8px;' +
            'display:flex;align-items:center;justify-content:space-between;font-size:9pt;}' +
    '.sign-area{text-align:right;font-size:9.5pt;font-weight:700;margin-top:30px;}' +
    'print-color-adjust:exact;-webkit-print-color-adjust:exact;' +
    '</style></head><body>' +

    /* ── EN-TÊTE ── */
    '<div class="header">' +
      '<div class="hdr-left">' +
        '<div class="medecin-nom">' + titreMed + ' ' + nomMed + '</div>' +
        '<div class="medecin-spec">' + specMed + '</div>' +
        '<div class="medecin-ville">' + villeMed + '</div>' +
      '</div>' +
      '<div class="hdr-right">' +
        '<div style="direction:rtl;font-size:9.5pt;font-weight:bold;line-height:1.8;">' +
          'د. ' + nomMedAr + '<br/>' + specMedAr + '<br/>' + villeMedAr +
        '</div>' +
      '</div>' +
    '</div>' +

    /* ── TITRE ── */
    '<div class="title">Ordonnance Médicale</div>' +
    '<div class="underline"></div>' +

    /* ── DATE + PATIENT ── */
    '<div class="date-right">Date : ' + today + '</div>' +
    '<div class="patient-row">' +
      '<div class="patient-field"><span class="pf-label">Patient :</span><span>' + patientNom + '</span></div>' +
      (patientCin ? '<div class="patient-field"><span class="pf-label">CIN :</span><span>' + patientCin + '</span></div>' : '') +
    '</div>' +

    /* ── MÉDICAMENTS ── */
    '<div style="font-size:10pt;font-weight:800;color:' + col + ';margin-bottom:10px;' +
         'text-transform:uppercase;letter-spacing:.6px;">Prescription :</div>' +
    lignesHTML +

    /* ── SIGNATURE ── */
    '<div class="sign-area">Cachet et signature du médecin</div>' +

    /* ── FOOTER ── */
    '<div class="footer">' +
      '<div>' + (siteConfig.medicalServiceName || 'Service Médical') + ' — ' + (siteConfig.footerCompanySite || 'Leoni Menzel Hayet') + '</div>' +
      '<div style="direction:rtl;">الخدمة الطبية — ليوني منزل حياة</div>' +
    '</div>' +

    '</body></html>'
  );
}

export default function PrintOrdonnance({ medecin, data, siteConfig }) {
  function handlePrint() {
    var html = buildOrdonnanceHTML(medecin, data, siteConfig);
    printHTML(html);
  }

  return (
    <button
      onClick={handlePrint}
      title="Imprimer l'ordonnance"
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 16px',
        background: '#1e3a5f', color: 'white',
        border: 'none', borderRadius: 7,
        cursor: 'pointer', fontSize: '12.5pt', fontWeight: 700,
      }}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Imprimer l'ordonnance
    </button>
  );
}