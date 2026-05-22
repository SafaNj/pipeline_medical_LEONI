function toStr(v) {
  return String(v || '').trim();
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeName(v) {
  return toStr(v).toLowerCase();
}

function pickFirst(values) {
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v !== null && v !== undefined && toStr(v) !== '') return v;
  }
  return null;
}

function extractSiteId(entity) {
  if (!entity || typeof entity !== 'object') return null;
  return toNum(pickFirst([
    entity.site_id,
    entity.site?.id,
    entity.site,
    entity.collaborateur_site_id,
    entity.collaborateur?.site_id,
    entity.collaborateur?.site?.id,
    entity.candidat?.site_id,
    entity.candidat?.site?.id,
  ]));
}

function extractSiteName(entity) {
  if (!entity || typeof entity !== 'object') return '';
  return normalizeName(pickFirst([
    entity.site_nom,
    entity.site_name,
    entity.site?.nom,
    entity.site?.name,
    entity.collaborateur_site_nom,
    entity.collaborateur?.site_nom,
    entity.collaborateur?.site?.nom,
    entity.candidat?.site_nom,
    entity.candidat?.site?.nom,
  ]));
}

function extractMedecinUserId(entity) {
  if (!entity || typeof entity !== 'object') return null;
  return toNum(pickFirst([
    entity.medecin_user_id,
    entity.medecin_id,
    entity.medecin,
    entity.assigned_medecin_id,
    entity.assigne_medecin_id,
    entity.created_by,
    entity.owner_id,
    entity.user_id,
  ]));
}

export function isRecordInMedecinScope(entity, user, options = {}) {
  const strictSite = options.strictSite !== false;
  const strictMedecin = options.strictMedecin || false;

  const userSiteId = toNum(user?.site_id);
  const userSiteName = normalizeName(user?.site_nom);
  const userId = toNum(user?.user_id);

  const siteId = extractSiteId(entity);
  const siteName = extractSiteName(entity);
  const medecinUserId = extractMedecinUserId(entity);

  const hasSiteSignal = siteId !== null || siteName !== '';
  const hasMedSignal = medecinUserId !== null;

  if (userSiteId !== null) {
    if (siteId !== null && siteId !== userSiteId) return false;
    if (strictSite && siteId === null && siteName === '') return false;
  }

  if (userSiteName) {
    if (siteName && siteName !== userSiteName) return false;
    if (strictSite && !hasSiteSignal) return false;
  }

  if (userId !== null && hasMedSignal && medecinUserId !== userId) return false;
  if (userId !== null && strictMedecin && !hasMedSignal) return false;

  return true;
}
