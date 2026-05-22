/**
 * Alignement avec le backend : im_db.resource.site et Site.code
 * (MENZEL_HAYET, MASSADINE, MATEUR). Alias MESSADINE → MASSADINE côté serveur.
 */

export const IM_SITE_CODE_VALUES = ['MENZEL_HAYET', 'MASSADINE', 'MATEUR'];

/** @param {string|null|undefined} code */
export function normalizeImSiteCode(code) {
  if (code == null || code === '') return '';
  const u = String(code).trim().toUpperCase().replace(/\s+/g, '_');
  if (u === 'MESSADINE' || u === 'MASSEDINE') return 'MASSADINE';
  return IM_SITE_CODE_VALUES.includes(u) ? u : '';
}

/**
 * Rôles pour lesquels le backend applique un périmètre IM strict (lecture collaborateurs / RH).
 */
export function roleUsesStrictImSite(user = {}) {
  const role = String(user.role || '').toLowerCase();
  const medType = String(user.med_type || '').toLowerCase();
  if (role === 'infirmier' || role === 'infirmiere') return true;
  if (role === 'rh') return true;
  if (role === 'hsee' || role === 'hsse') return true;
  if (role === 'medecin' && medType === 'travail') return true;
  return false;
}

/**
 * @param {object} user — typiquement useAuth().user
 * @returns {string|null} message court pour bannière UI, ou null si OK / non concerné
 */
export function getImSiteMisconfiguredMessage(user = {}) {
  if (!roleUsesStrictImSite(user)) return null;
  const raw = user.site_code ?? user.site?.code;
  if (normalizeImSiteCode(raw)) return null;
  if (user.site_id == null || user.site_id === '') return null;
  return (
    "Votre établissement n'a pas de code site RH reconnu (MENZEL_HAYET, MASSADINE, MATEUR). "
    + 'Les listes collaborateurs et la recherche IM peuvent rester vides : contactez un administrateur.'
  );
}
