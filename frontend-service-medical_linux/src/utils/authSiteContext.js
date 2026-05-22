import { resolveSiteTemplate } from './siteTemplateResolver';

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

function pickFirst(values, fallback = null) {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === 0) return value;
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value;
    }
  }
  return fallback;
}

function normalizeSiteId(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}

function extractFromPayload(payload = {}) {
  return {
    site_id: normalizeSiteId(pickFirst([payload.site_id, payload.site?.id, payload.siteId], null)),
    site_nom: pickFirst([payload.site_nom, payload.site_name, payload.siteName, payload.site?.nom, payload.site?.name], null),
    site_template_key: pickFirst([
      payload.site_template_key,
      payload.siteTemplateKey,
      payload.site?.template_key,
      payload.site?.templateKey,
    ], null),
    site_code: pickFirst([payload.site_code, payload.siteCode, payload.site?.code], null),
    nom_ar: pickFirst([
      payload.nom_ar,
      payload.last_name_ar,
      payload.lastname_ar,
      payload.lastNameAr,
      payload.user?.nom_ar,
      payload.user?.last_name_ar,
      payload.user?.lastname_ar,
      payload.user?.lastNameAr,
    ], null),
    prenom_ar: pickFirst([
      payload.prenom_ar,
      payload.first_name_ar,
      payload.firstname_ar,
      payload.firstNameAr,
      payload.user?.prenom_ar,
      payload.user?.first_name_ar,
      payload.user?.firstname_ar,
      payload.user?.firstNameAr,
    ], null),
    full_name_ar: pickFirst([
      payload.full_name_ar,
      payload.fullNameAr,
      payload.nom_arabe,
      payload.user?.full_name_ar,
      payload.user?.fullNameAr,
      payload.user?.nom_arabe,
    ], null),
  };
}

export function buildNormalizedAuthUser(userData = {}, token) {
  const payload = decodeJwtPayload(token || localStorage.getItem('token') || '') || {};
  const fromApi = extractFromPayload(userData);
  const fromToken = extractFromPayload(payload);
  const storedUser = safeParseJson(localStorage.getItem('user') || 'null') || {};
  const fromStored = extractFromPayload(storedUser);

  const site_id = normalizeSiteId(pickFirst([fromApi.site_id, fromStored.site_id, fromToken.site_id], null));
  const site_nom = pickFirst([fromApi.site_nom, fromStored.site_nom, fromToken.site_nom], null);
  const rawTemplateKey = pickFirst([
    fromApi.site_template_key,
    fromStored.site_template_key,
    fromToken.site_template_key,
  ], null);
  const site_code = pickFirst([fromApi.site_code, fromStored.site_code, fromToken.site_code], null);

  const site_template_branch = resolveSiteTemplate(rawTemplateKey, site_code, site_nom);
  const site_template_key = rawTemplateKey || site_template_branch;
  const nom_ar = pickFirst([fromApi.nom_ar, fromStored.nom_ar, fromToken.nom_ar], null);
  const prenom_ar = pickFirst([fromApi.prenom_ar, fromStored.prenom_ar, fromToken.prenom_ar], null);
  const full_name_ar = pickFirst([fromApi.full_name_ar, fromStored.full_name_ar, fromToken.full_name_ar], null);
  const nom_arabe = full_name_ar || `${prenom_ar || ''} ${nom_ar || ''}`.trim() || null;

  return {
    ...storedUser,
    ...userData,
    site_id,
    site_nom,
    site_template_key,
    site_template_branch,
    site_code,
    nom_ar,
    prenom_ar,
    full_name_ar,
    nom_arabe,
  };
}

export function syncLegacySiteStorage(userData = {}) {
  const siteId = userData?.site_id;
  const siteName = userData?.site_nom;
  const siteCode = userData?.site_code;
  if (siteCode !== null && siteCode !== undefined && String(siteCode).trim() !== '') {
    localStorage.setItem('userSiteCode', String(siteCode).trim());
  } else {
    localStorage.removeItem('userSiteCode');
  }
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '' && siteName) {
    localStorage.setItem('userSiteId', String(siteId));
    localStorage.setItem('userSiteName', String(siteName));
    return;
  }
  localStorage.removeItem('userSiteId');
  localStorage.removeItem('userSiteName');
}

export function updateStoredUserFromToken(token) {
  if (!token) return;
  const storedUser = safeParseJson(localStorage.getItem('user') || 'null') || {};
  const normalized = buildNormalizedAuthUser(storedUser, token);
  localStorage.setItem('user', JSON.stringify(normalized));
  syncLegacySiteStorage(normalized);
}
