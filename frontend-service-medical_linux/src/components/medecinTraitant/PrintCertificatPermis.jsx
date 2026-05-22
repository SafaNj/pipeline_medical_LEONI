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
  
    const specialite = m.specialite || 'Médecine Générale';
    const specialite_ar = m.specialite_ar || 'طب عام';
  const field = (value, width = '120px') => `<span class="line" style="min-width:${width}">${value || ''}</span>`;
  const check = (v) => (v ? 'x' : '');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Certificat médical permis</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; }
    .page { width: 210mm; min-height: 297mm; padding: 14mm 14mm 10mm; }
    .title { text-align: center; font-size: 20px; font-weight: 700; margin: 6mm 0 10mm; line-height: 1.3; }
    .text { font-size: 13.2px; line-height: 1.55; }
    .line { display: inline-block; border-bottom: 1px dotted #111; padding: 0 3px 1px; line-height: 1.1; }
    .cb { display:inline-block; width:11px; height:11px; border:1px solid #111; text-align:center; line-height:10px; font-size:9px; margin:0 5px 0 0; vertical-align:middle; }
    .section { margin-top: 4mm; }
    .footnotes { margin-top: 10mm; font-size: 10.5px; line-height: 1.45; }
    .signature { margin-top: 8mm; display:flex; justify-content:space-between; font-size:14px; font-weight:700; }
  </style>
</head>
<body>
  <div class="page">
    <div style="text-align:center;font-size:11px;color:#444;margin-bottom:8px;font-weight:700;">${siteConfig.medicalServiceName || 'Service Medical'} - ${siteConfig.footerCompanySite || 'Leoni Menzel Hayet'}</div>
    <div class="title">Certificat médical pour l’obtention d’un permis de conduire<br/>ou son renouvellement (1)</div>

    <div class="text">
      Je soussigné(e), Docteur ${field(nomMedecin, '230px')}
      inscrit (e) au Conseil National de l’Ordre des Médecins sous le numéro : ${field(c.numero_ordre_medecin || '', '120px')}
      et exerçant à ${field(c.lieu_exercice_medecin || '', '160px')}<br/>
      atteste avoir examiné Monsieur (Madame) ${field(c.nom_prenom || '', '220px')} né (e) le ${field(fmt(c.date_naissance), '120px')}<br/>
      détenteur (rice) de la CIN N° ${field(c.cin || '', '120px')} délivrée à ${field(c.cin_delivree_a || '', '120px')}
      le ${field(fmt(c.cin_date), '110px')}<br/>
      et après avoir pris connaissance des résultats des examens et des analyses complémentaires (le cas échéant)
      et la déclaration du candidat concernant son état de santé et conformément aux dispositions de l’annexe 1
      de l’arrêté conjoint des Ministres du Transport et de la Santé Publique du 16 Août 2002 (2)
    </div>

    <div class="text section">
      Déclare que l’intéressé (e) :<br/>
      <span class="cb">${check(c.groupe_permis === 'LES_DEUX')}</span>est apte à la conduite des véhicules correspondant au groupe 1 et 2<br/>
      <span class="cb">${check(c.groupe_permis === 'GROUPE_1')}</span>groupe 1 (les catégories « A1 », « A », « B » et « H »)<br/>
      <span class="cb">${check(c.groupe_permis === 'GROUPE_2')}</span>groupe 2 (les catégories « C », « C+E », « D », « D1 » et « D1+E »)<br/>
      <span class="cb">${check(!c.inapte_conduite)}</span>est apte à la conduite des véhicules du groupe ${field(c.groupe_permis || '', '90px')}
      conformément aux dispositions du sous paragraphe ${field(c.sous_paragraphe || '', '95px')} du paragraphe ${field(c.paragraphe || '', '95px')}
      de la classe ${field(c.classe || '', '70px')} de l’annexe 1 de l’arrêté précité<br/>
      <span class="cb">${check(!!c.examine_par_specialiste)}</span>doit être examiné par un spécialiste en ${field(c.examine_par_specialiste_type || '', '130px')} (3)<br/>
      <span class="cb">${check(!!c.certificat_delivre_par_specialiste)}</span>est tenu de se présenter devant la commission spécialisée muni d’un certificat délivré par un spécialiste en ${field(c.certificat_delivre_par_specialiste_type || '', '130px')} (3)<br/>
      <span class="cb">${check(!!c.inapte_conduite)}</span>est inapte à la conduite des véhicules ${c.inapte_conduite_raison ? `: ${field(c.inapte_conduite_raison, '220px')}` : ''}
    </div>

    <div class="signature">
      <div>Date : ${field(fmt(c.date_emission || new Date()), '140px')}</div>
      <div>Signature du médecin</div>
    </div>

    <div class="footnotes">
      (1) Ce certificat doit être délivré depuis moins de trois mois et ce lors du dépôt de la demande d’obtention de permis de conduire ou de son renouvellement.<br/>
      (2) Arrêté conjoint des Ministres du Transport et de la Santé Publique du 16 Août 2002 fixant la liste des handicaps physiques et des maladies qui nécessitent un aménagement spécial des véhicules et/ou le port d’auxiliaires par le conducteur d’appareils et de prothèses ainsi que les autres cas spéciaux de handicaps et maladies qui requièrent l’avis de la commission spécialisée indiquée à l’article 12 du décret 2000-142 du 24 janvier 2000.<br/>
      (3) Le dossier d’obtention du permis de conduire doit être accompagné d’un certificat médical circonstancié établi et délivré par un médecin spécialiste.
    </div>
  </div>
</body>
</html>`;
}

export default function PrintCertificatPermis({ certificat, medecin, siteConfig }) {
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
