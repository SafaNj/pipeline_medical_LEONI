import { buildNormalizedAuthUser, syncLegacySiteStorage } from './authSiteContext';

const ACCESS_KEY_PRIMARY = 'access';
const ACCESS_KEY_LEGACY = 'token';
const REFRESH_KEY = 'refresh';
const USER_KEY = 'user';

function readJson(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function resolveIdentity(userLike = {}) {
  return String(userLike?.user_id ?? userLike?.id ?? userLike?.username ?? 'anonymous');
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY_PRIMARY) || localStorage.getItem(ACCESS_KEY_LEGACY) || '';
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || '';
}

export function getStoredUser() {
  return readJson(USER_KEY, null);
}

export function setStoredUser(userData = {}) {
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
  syncLegacySiteStorage(userData);
  return userData;
}

export function setTokens({ access, refresh } = {}) {
  if (access) {
    localStorage.setItem(ACCESS_KEY_PRIMARY, access);
    // Legacy key kept for backwards compatibility with existing code paths.
    localStorage.setItem(ACCESS_KEY_LEGACY, access);
  }

  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY_PRIMARY);
  localStorage.removeItem(ACCESS_KEY_LEGACY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('userSiteId');
  localStorage.removeItem('userSiteName');
  localStorage.removeItem('userSiteCode');
}

export function applyRefreshClaims(refreshPayload = {}) {
  const access = refreshPayload?.access || getAccessToken();
  if (!access) {
    return { identityChanged: false, user: null };
  }

  const previous = getStoredUser() || {};
  const previousIdentity = resolveIdentity(previous);

  const merged = {
    ...previous,
    role: refreshPayload?.role ?? previous?.role,
    med_type: refreshPayload?.med_type ?? previous?.med_type,
    must_change_password: refreshPayload?.must_change_password ?? previous?.must_change_password,
    nom_ar:
      refreshPayload?.nom_ar ??
      refreshPayload?.last_name_ar ??
      refreshPayload?.user?.nom_ar ??
      refreshPayload?.user?.last_name_ar ??
      previous?.nom_ar,
    prenom_ar:
      refreshPayload?.prenom_ar ??
      refreshPayload?.first_name_ar ??
      refreshPayload?.user?.prenom_ar ??
      refreshPayload?.user?.first_name_ar ??
      previous?.prenom_ar,
    full_name_ar:
      refreshPayload?.full_name_ar ??
      refreshPayload?.nom_arabe ??
      refreshPayload?.user?.full_name_ar ??
      refreshPayload?.user?.nom_arabe ??
      previous?.full_name_ar,
    site_id: refreshPayload?.site_id ?? refreshPayload?.site?.id ?? previous?.site_id,
    site_nom: refreshPayload?.site_nom ?? refreshPayload?.site_name ?? refreshPayload?.site?.nom ?? previous?.site_nom,
    site_template_key:
      refreshPayload?.site_template_key ??
      refreshPayload?.site?.template_key ??
      refreshPayload?.site?.templateKey ??
      previous?.site_template_key,
    site_code: refreshPayload?.site_code ?? refreshPayload?.site?.code ?? previous?.site_code,
    username: refreshPayload?.username ?? previous?.username,
    user_id: refreshPayload?.user_id ?? previous?.user_id,
  };

  const normalized = buildNormalizedAuthUser(merged, access);
  setStoredUser(normalized);

  const nextIdentity = resolveIdentity(normalized);
  return {
    identityChanged: previousIdentity !== nextIdentity,
    user: normalized,
  };
}
