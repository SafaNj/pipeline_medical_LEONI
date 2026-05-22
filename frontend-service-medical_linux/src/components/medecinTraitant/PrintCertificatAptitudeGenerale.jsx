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
  const nomMedecin = c.nom_prenom_medecin || (m.first_name && m.last_name ? m.first_name + ' ' + m.last_name : '') || m.full_name || m.nom || 'Médecin';
  const nomArabe = `${m.prenom_ar || ''} ${m.nom_ar || ''}`.trim() || m.nom_arabe || m.nom_ar || 'الطبيب';
    const specialite = m.specialite || 'Médecine Générale';
    const specialite_ar = m.specialite_ar || 'طب عام';
  const patient = c.nom_prenom_patient || c.nom_prenom || c.nom_patient || '—';
  const lieuRaw = c.lieu_signature || m.ville || '';
  const lieu = String(lieuRaw).replace(/kalaa\s*kebira/ig, '').trim();
  const dateNaissance = fmt(c.date_naissance);
  const dotted = (value, fallback) => (value && value !== '—' ? value : fallback);

  const line = (label, ok) => {
    const check = ok ? '☑' : '☐';
    return `${check} ${label} ;`;
  };

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Certificat Médical d'Aptitude</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; background: white; }
    .page { width: 210mm; min-height: 297mm; padding: 16mm 18mm 16mm; }
    .hdr { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom: 10mm; }
    .hdr-left { font-size:10pt; line-height:1.7; }
    .hdr-left .titre { font-style:italic; }
    .hdr-left .nom { font-weight:bold; font-size:10.5pt; }
    .hdr-left .spec { font-style:italic; }
    .hdr-right { text-align:right; direction:rtl; font-size:10pt; line-height:1.7; }
    .top { font-size: 14px; font-weight: 700; margin-bottom: 14mm; }
    .title { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 16mm; }
    .body { font-size: 13px; line-height: 1.55; }
    .line-fill { display: inline-block; border-bottom: 1px dotted #111; min-width: 110px; padding: 0 4px 1px; line-height: 1; }
    .paragraph { margin-bottom: 6mm; page-break-inside: avoid; }
    .signature { margin-top: 16mm; text-align: right; font-size: 13px; font-style: italic; font-weight: 700; }
  </style>
</head>
<body>
  <div class="page">
    <div class="top">${siteConfig.medicalServiceName || 'Service Medical'} - ${siteConfig.footerCompanySite || 'Leoni Menzel Hayet'}${lieu ? `<br/>${lieu} le` : ''}</div>

    <div class="title">Certificat Médical D’aptitude</div>

    <div class="body">
      <div class="paragraph">
        Je soussigné, Docteur ${nomMedecin}, certifie avoir reçu et examiné aujourd’hui<br/>
        Mr/Mme : <span class="line-fill">${dotted(patient, '..............................')}</span> né le <span class="line-fill">${dotted(dateNaissance, '.... / .... / ............')}</span> ,
      </div>

      <div class="paragraph">qu’il est :</div>

      <div class="paragraph">${line('En bonne santé clinique', !!c.est_bonne_sante)}</div>
      <div class="paragraph">${line('Qu’il Est Indemne De Toute Pathologie Contagieuse', !!c.indemne_pathologie_contagieuse)}</div>
      <div class="paragraph">${line('Apte Pour Pratiquer Le Sport', !!c.apte_sport)}</div>
      <div class="paragraph">${line('Apte à être en collectivité', !!c.apte_collectivite)}</div>

      <div class="paragraph">Certificat délivré à l’intéressé(e) pour servir et valoir ce que de droit .</div>
    </div>

    <div class="signature">Signature</div>
  </div>
</body>
</html>`;
}

export default function PrintCertificatAptitudeGenerale({ certificat, medecin, siteConfig }) {
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
