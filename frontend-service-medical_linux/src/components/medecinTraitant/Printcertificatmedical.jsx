import { useAuth } from '../../context/AuthContext';
import { printHTML } from '../../utils/printHelper';
import { getSitePrintConfig } from '../../utils/siteConfig';

function cleanNameValue(value) {
  return String(value || '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlaceholderName(value) {
  var v = cleanNameValue(value).toLowerCase();
  return !v || v === 'medecin' || v === 'médecin' || v === 'doctor' || v === 'docteur';
}

function resolveFrenchName(source) {
  var s = source || {};
  var first = cleanNameValue(s.first_name);
  var last = cleanNameValue(s.last_name);
  var full = cleanNameValue(s.full_name);
  var nom = cleanNameValue(s.nom);
  var username = cleanNameValue(s.username);

  if (first && last) return first + ' ' + last;
  if (!isPlaceholderName(full)) return full;
  if (!isPlaceholderName(nom)) return nom;
  if (!isPlaceholderName(username)) return username;
  return 'Médecin';
}

function buildCertificatMedicalHTML(medecin, data, siteConfigInput) {
  var siteConfig = getSitePrintConfig(siteConfigInput, data);
  var d          = data || {};
  var med        = medecin || {};
  // Prioritize first_name + last_name over username
  var nom        = resolveFrenchName(med);
  var nomAr      = (med.nom_ar || med.last_name_ar || med.lastname_ar || med.lastNameAr || '').trim();
  var prenomAr   = (med.prenom_ar || med.first_name_ar || med.firstname_ar || med.firstNameAr || '').trim();
  var nomArFull  = (med.full_name_ar || med.fullNameAr || '').trim() || (prenomAr + ' ' + nomAr).trim() || med.nom_arabe || 'الطبيب';
    var specMed    = med.specialite || 'Médecine Générale';
    var specMedAr  = med.specialite_ar || 'طب عام';
    var villeMed   = siteConfig.siteVille || 'Menzel Hayet';
  var footerLeft = siteConfig.footerCompanySite || 'Leoni Menzel Hayet';
  var footerRight= siteConfig.medicalServiceName || 'Service Médical';
  var patientNom = d.patientNom || '';
  var jours      = d.jours ? String(d.jours) : '';
  var dateDebut  = d.dateDebut || '';

  var fmt = function(dt) {
    if (!dt) return '';
    var date = new Date(dt);
    return isNaN(date.getTime()) ? String(dt) : date.toLocaleDateString('fr-FR');
  };

  var today   = fmt(new Date());
  var dateDeb = fmt(dateDebut) || today;

  var dotLine = '-----------------------------------------------------------------------';

  return (
    '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>' +
    '<title>Certificat Médical</title>' +
    '<style>' +
    '@page{size:A4 portrait;margin:18mm 20mm 18mm 20mm;}' +
    '*{box-sizing:border-box;margin:0;padding:0;}' +
    'body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;background:white;}' +

    '.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8mm;}' +
    '.hdr-left{font-size:10pt;line-height:1.7;}' +
    '.hdr-left .titre{font-style:italic;}' +
    '.hdr-left .nom{font-weight:bold;font-size:10.5pt;}' +
    '.hdr-left .spec{font-style:italic;}' +
    '.hdr-right{text-align:right;direction:rtl;font-size:10pt;line-height:1.7;}' +
    '.hdr-right .titre-ar{font-style:italic;}' +
    '.hdr-right .nom-ar{font-weight:bold;}' +
    '.hdr-right .spec-ar{font-style:italic;}' +

    '.date-line{font-size:10pt;margin-bottom:10mm;}' +

    '.title{text-align:center;font-size:11pt;font-weight:bold;' +
           'text-decoration:underline;margin-bottom:10mm;}' +

    '.body{font-size:10pt;line-height:1.8;margin-bottom:6mm;}' +
    '.body p{margin-bottom:6mm;text-align:justify;}' +
    '.bold{font-weight:bold;}' +

    /* Cachet et footer fixés en bas */
    '.sign{position:fixed;bottom:28mm;right:20mm;font-size:10pt;text-align:right;}' +
    '.footer{position:fixed;bottom:18mm;left:20mm;right:20mm;' +
            'border-top:1px solid #000;padding-top:5px;' +
            'display:flex;justify-content:space-between;font-size:9pt;}' +

    'print-color-adjust:exact;-webkit-print-color-adjust:exact;' +
    '</style></head><body>' +

    '<div class="hdr">' +
      '<div class="hdr-left">' +
        '<div class="titre">Docteur</div>' +
        '<div class="nom">' + nom + '</div>' +
          '<div class="spec">' + specMed + '</div>' +
      '</div>' +
      '<div class="hdr-right">' +
        '<div class="titre-ar">الدكتور</div>' +
        '<div class="nom-ar">' + nomArFull + '</div>' +
          '<div class="spec-ar">' + specMedAr + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="date-line">' +
      villeMed + ', le ' + today + ' ' + dotLine +
    '</div>' +

    '<div class="title">Certificat Médical</div>' +

    '<div class="body">' +
      '<p>' +
        'Je soussigné, Docteur ' + nom + ', Médecin Traitant, certifie avoir examiné ce jour M. / Mme ' +
        '<span class="bold">' + patientNom + '</span>' +
        ' et lui prescris un arrêt de travail de ' +
        '<span class="bold">' + jours + ' jours</span>' +
        ', à compter du ' +
        '<span class="bold">' + dateDeb + '</span>.' +
      '</p>' +
      '<p>' +
        'Ce certificat est établi à la demande de l\'intéressé(e) pour valoir ce que de droit.' +
      '</p>' +
    '</div>' +

    '<div class="sign">Cachet et signature du médecin</div>' +

    '<div class="footer">' +
      '<div>' + footerLeft + '</div>' +
      '<div>' + footerRight + '</div>' +
    '</div>' +

    '</body></html>'
  );
}

export default function PrintCertificatMedical({ data, siteConfig, medecin }) {
  const { user } = useAuth();
  const prenomAr =
    user?.prenom_ar ||
    user?.first_name_ar ||
    user?.firstname_ar ||
    user?.firstNameAr ||
    user?.prenomAr ||
    '';

  const nomAr =
    user?.nom_ar ||
    user?.last_name_ar ||
    user?.lastname_ar ||
    user?.lastNameAr ||
    user?.nomAr ||
    '';

  const nomArabeComplet =
    user?.full_name_ar ||
    user?.fullNameAr ||
    user?.nom_arabe ||
    `${prenomAr} ${nomAr}`.trim();

  const mergedMedecin = {
    first_name: medecin?.first_name || user?.first_name || '',
    last_name: medecin?.last_name || user?.last_name || '',
    full_name: medecin?.full_name || user?.full_name || '',
    nom: medecin?.nom || user?.nom || '',
    username: medecin?.username || user?.username || '',
    specialite: medecin?.specialite || user?.specialite || 'Médecine Générale',
    specialite_ar: medecin?.specialite_ar || user?.specialite_ar || 'طب عام',
    nom_ar: medecin?.nom_ar || nomAr,
    prenom_ar: medecin?.prenom_ar || prenomAr,
    nom_arabe: medecin?.nom_arabe || nomArabeComplet,
    full_name_ar: medecin?.full_name_ar || user?.full_name_ar || user?.fullNameAr || '',
  };

  const resolvedMedecin = {
    ...mergedMedecin,
    nom: resolveFrenchName(mergedMedecin),
    full_name: resolveFrenchName(mergedMedecin),
  };

  function handlePrint() {
    var html = buildCertificatMedicalHTML(resolvedMedecin, data, siteConfig || user);
    printHTML(html);
  }

  return (
    <button
      onClick={handlePrint}
      title="Imprimer le certificat médical"
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '11px 22px',
        background: 'linear-gradient(135deg,#0369a1,#0ea5e9)', color: 'white',
        border: 'none', borderRadius: 10,
        cursor: 'pointer', fontSize: 14, fontWeight: 700,
        fontFamily: 'inherit',
        boxShadow: '0 4px 14px rgba(2,132,199,.3)',
        transition: 'all .2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform='none'}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Imprimer le certificat
    </button>
  );
}