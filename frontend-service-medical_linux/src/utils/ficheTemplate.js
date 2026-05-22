import { SITE_TEMPLATE_BRANCH } from './siteTemplateResolver';

function trimString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function buildFichePayloadByTemplate({
  templateBranch,
  date_visite,
  type_visite,
  aptitude,
  precision_aptitude,
  numero_cnss,
  collaborateur,
  matricule,
  raison_sociale,
  nature_activite,
  adresse_entreprise,
  numero_cnss_entreprise,
  qualifications,
  examens_ulterieurs,
}) {
  const payload = {
    date_visite,
    type_visite,
    aptitude,
    precision_aptitude,
    numero_cnss: trimString(numero_cnss),
    collaborateur,
    matricule: trimString(matricule),
  };

  // MATEUR utilise les mêmes champs entreprise que MENZEL.
  if (templateBranch === SITE_TEMPLATE_BRANCH.MENZEL || templateBranch === SITE_TEMPLATE_BRANCH.MATEUR) {
    payload.raison_sociale = trimString(raison_sociale);
    payload.nature_activite = trimString(nature_activite);
    payload.adresse_entreprise = trimString(adresse_entreprise);
    payload.numero_cnss_entreprise = trimString(numero_cnss_entreprise);
    payload.qualifications = trimString(qualifications);
  }

  if (templateBranch === SITE_TEMPLATE_BRANCH.MATEUR) {
    payload.examens_ulterieurs = Array.isArray(examens_ulterieurs) ? examens_ulterieurs : [];
  }

  return payload;
}

export function validateFicheByTemplate({ templateBranch, collab, typeVisite, aptitude }) {
  if (!collab) {
    return 'Selectionnez un collaborateur ou un candidat (embauche).';
  }
  if (!typeVisite) {
    return 'Choisissez un type de visite.';
  }
  if (!aptitude) {
    return "Choisissez un resultat d'aptitude.";
  }

  if (templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE) {
    return null;
  }

  return null;
}
