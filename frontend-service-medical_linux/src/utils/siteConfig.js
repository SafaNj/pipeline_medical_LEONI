import { resolveSiteTemplate, resolveSiteTemplateFromSources } from './siteTemplateResolver';

function firstNonEmpty(values, fallback = '') {
  for (const value of values) {
    if (value === 0) return value;
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value;
    }
  }
  return fallback;
}

function normalizeTemplateKey(value) {
  return resolveSiteTemplate(value, '', '');
}

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const chunks = token.split('.');
  if (chunks.length < 2) return null;
  const payload = chunks[1];
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    return safeParseJson(atob(padded));
  } catch {
    return null;
  }
}

function readTemplateFromStorage() {
  if (typeof window === 'undefined') return '';
  const user = safeParseJson(window.localStorage.getItem('user') || 'null') || {};
  const token = window.localStorage.getItem('token') || '';
  const payload = decodeJwtPayload(token) || {};
  const explicitTemplate = firstNonEmpty([
    user.site_template_key,
    user.siteTemplateKey,
    payload.site_template_key,
    payload.siteTemplateKey,
  ], '');

  if (explicitTemplate) return normalizeTemplateKey(explicitTemplate);

  const storedSiteName = firstNonEmpty([
    user.site_nom,
    user.siteName,
    user.site_name,
    payload.site_nom,
    payload.siteName,
    payload.site_name,
  ], '');

  return normalizeTemplateKey(storedSiteName);
}

function readSiteId(source) {
  if (!source || typeof source !== 'object') return null;
  return firstNonEmpty([
    source.site_id,
    source.siteId,
    source.site?.id,
    source.site_details?.id,
    source.site_details?.site_id,
    source.site_details?.siteId,
  ], null);
}

function readSiteNom(source) {
  if (!source || typeof source !== 'object') return '';
  return firstNonEmpty([
    source.site_nom,
    source.siteNom,
    source.site_name,
    source.siteName,
    source.site?.nom,
    source.site?.name,
    source.site_details?.nom,
    source.site_details?.name,
    source.site_details?.site_nom,
    source.site_details?.label,
  ], '');
}

function readSiteVille(source) {
  if (!source || typeof source !== 'object') return '';
  return firstNonEmpty([
    source.site_ville,
    source.siteVille,
    source.ville_site,
    source.site?.ville,
    source.site_details?.ville,
    source.site_details?.site_ville,
    source.ville,
  ], '');
}

function readCompanyName(source) {
  if (!source || typeof source !== 'object') return '';
  return firstNonEmpty([
    source.company_name,
    source.companyName,
    source.raison_sociale,
    source.entreprise,
  ], '');
}

function readMedicalServiceName(source) {
  if (!source || typeof source !== 'object') return '';
  return firstNonEmpty([
    source.service_medical_nom,
    source.serviceMedicalNom,
    source.medical_service_name,
    source.medicalServiceName,
    source.site_details?.service_medical_nom,
    source.site_details?.medical_service_name,
  ], '');
}

function readTemplateKey(source) {
  if (!source || typeof source !== 'object') return '';
  return firstNonEmpty([
    source.site_template_key,
    source.siteTemplateKey,
    source.template_key,
    source.templateKey,
    source.site?.template_key,
    source.site?.templateKey,
    source.site_details?.template_key,
    source.site_details?.templateKey,
  ], '');
}

function sourceHasConcreteSiteHint(source) {
  if (!source || typeof source !== 'object') return false;
  if (readSiteId(source) || readSiteNom(source) || readTemplateKey(source)) return true;
  const d = source.site_details;
  if (d && typeof d === 'object') {
    return !!firstNonEmpty(
      [d.nom, d.name, d.site_nom, d.label, d.code, d.site_code, d.template_key, d.templateKey],
      '',
    );
  }
  return false;
}

export function extractSiteInfo(...sources) {
  const siteId = firstNonEmpty(sources.map(readSiteId), null);
  const siteNom = firstNonEmpty(sources.map(readSiteNom), '');
  const siteVille = firstNonEmpty(sources.map(readSiteVille), siteNom || 'Menzel Hayet');
  const companyName = firstNonEmpty(sources.map(readCompanyName), 'Leoni');
  const medicalServiceName = firstNonEmpty(sources.map(readMedicalServiceName), 'Service Medical');
  const hasConcreteSiteHint = sources.some(sourceHasConcreteSiteHint);
  const templateKeySource =
    firstNonEmpty(sources.map(readTemplateKey), '') ||
    (!hasConcreteSiteHint ? readTemplateFromStorage() : '');
  const templateKey = resolveSiteTemplateFromSources(
    ...sources,
    { site_template_key: templateKeySource, site_nom: siteNom }
  );

  return {
    site_id: siteId,
    site_nom: siteNom,
    site_ville: siteVille,
    company_name: companyName,
    medical_service_name: medicalServiceName,
    template_key: templateKey,
    site_template_key: templateKey,
  };
}

export function buildSitePayload(...sources) {
  const site = extractSiteInfo(...sources);
  const payload = {};

  if (site.site_id !== null && site.site_id !== undefined && String(site.site_id).trim() !== '') {
    payload.site_id = site.site_id;
  }
  if (site.site_nom) {
    payload.site_nom = site.site_nom;
  }

  return payload;
}

export function getSitePrintConfig(...sources) {
  const site = extractSiteInfo(...sources);
  const siteNom = site.site_nom || 'Menzel Hayet';
  const siteVille = site.site_ville || siteNom;
  const companyName = site.company_name || 'Leoni';
  const medicalServiceName = site.medical_service_name || 'Service Medical';
  const templateKey = resolveSiteTemplate(site.site_template_key || site.template_key, site.site_code, siteNom);
  const siteNomNormalized = String(siteNom).trim().toLowerCase();
  const companyNormalized = String(companyName).trim().toLowerCase();
  const hasCompanyPrefix = companyNormalized && siteNomNormalized.startsWith(`${companyNormalized} `);
  const footerCompanySite = hasCompanyPrefix ? siteNom : `${companyName} ${siteNom}`.trim();

  return {
    ...site,
    siteNom,
    siteVille,
    companyName,
    medicalServiceName,
    medicalInfirmierLabel: `${medicalServiceName} - Infirmerie d'Entreprise`,
    footerCompanySite,
    footerServiceCompany: `${medicalServiceName} - ${footerCompanySite}`,
    templateKey,
    site_template_key: templateKey,
  };
}
