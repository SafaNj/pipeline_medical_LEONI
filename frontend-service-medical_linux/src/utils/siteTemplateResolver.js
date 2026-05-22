export const SITE_TEMPLATE_BRANCH = Object.freeze({
  MENZEL: 'MENZEL',
  MESSADINE: 'MESSADINE',
  MATEUR: 'MATEUR',
});

function asText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeUpper(value) {
  return asText(value).toUpperCase();
}

function pickFirst(values) {
  for (let i = 0; i < values.length; i += 1) {
    const raw = asText(values[i]);
    if (raw) return raw;
  }
  return '';
}

function hasMessadineHint(value) {
  const v = normalizeUpper(value);
  return v.includes('MESSAD') || v.includes('MASSAD') || v.includes('SOUSSE') || v === 'MESSADINE';
}

function hasMaturHint(value) {
  const v = normalizeUpper(value);
  return v.includes('MATEUR') || v.includes('MATER') || v === 'MATEUR';
}

function hasMenzelHint(value) {
  const v = normalizeUpper(value);
  return v.includes('MENZEL') || v.includes('MONASTIR') || v === 'MENZEL';
}

export function resolveSiteTemplate(siteTemplateKey, siteCode, siteNom) {
  if (hasMessadineHint(siteTemplateKey) || hasMessadineHint(siteCode) || hasMessadineHint(siteNom)) {
    return SITE_TEMPLATE_BRANCH.MESSADINE;
  }
  if (hasMaturHint(siteTemplateKey) || hasMaturHint(siteCode) || hasMaturHint(siteNom)) {
    return SITE_TEMPLATE_BRANCH.MATEUR;
  }
  if (hasMenzelHint(siteTemplateKey) || hasMenzelHint(siteCode) || hasMenzelHint(siteNom)) {
    return SITE_TEMPLATE_BRANCH.MENZEL;
  }
  return SITE_TEMPLATE_BRANCH.MENZEL;
}

function readFromSource(source = {}) {
  if (!source || typeof source !== 'object') {
    return { siteTemplateKey: '', siteCode: '', siteNom: '' };
  }

  const siteTemplateKey = pickFirst([
    source.site_template_key,
    source.siteTemplateKey,
    source.template_key,
    source.templateKey,
    source.site?.template_key,
    source.site?.templateKey,
    source.site_details?.template_key,
    source.site_details?.templateKey,
  ]);

  const siteCode = pickFirst([
    source.site_code,
    source.siteCode,
    source.code_site,
    source.site?.code,
    source.site?.site_code,
    source.site_details?.code,
    source.site_details?.site_code,
  ]);

  const siteNom = pickFirst([
    source.site_nom,
    source.site_name,
    source.siteName,
    source.site?.nom,
    source.site?.name,
    source.site_details?.nom,
    source.site_details?.name,
    source.site_details?.site_nom,
  ]);

  return { siteTemplateKey, siteCode, siteNom };
}

export function resolveSiteTemplateFromSources(...sources) {
  const values = sources.map((source) => readFromSource(source));
  const siteTemplateKey = pickFirst(values.map((v) => v.siteTemplateKey));
  const siteCode = pickFirst(values.map((v) => v.siteCode));
  const siteNom = pickFirst(values.map((v) => v.siteNom));
  return resolveSiteTemplate(siteTemplateKey, siteCode, siteNom);
}

export function isMessadineTemplate(siteTemplateKey, siteCode, siteNom) {
  return resolveSiteTemplate(siteTemplateKey, siteCode, siteNom) === SITE_TEMPLATE_BRANCH.MESSADINE;
}
