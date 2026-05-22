/**
 * 📍 SITE ACCESS CONTROL UTILITIES
 * Centralized functions for managing site-based access control
 */

import { formatAxiosError } from '../api/apiErrorUtils';

/**
 * ✅ Get the current user's site_id from localStorage
 * @returns {number|null} - The site_id or null if not found
 */
export function getUserSiteId() {
  try {
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    const fromUser = parsedUser?.site_id ?? parsedUser?.site?.id ?? parsedUser?.siteId;
    if (fromUser !== null && fromUser !== undefined && String(fromUser).trim() !== '') {
      const n = Number(fromUser);
      return Number.isFinite(n) ? n : fromUser;
    }

    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeJwtPayload(token);
      const fromToken = payload?.site_id ?? payload?.site?.id ?? payload?.siteId;
      if (fromToken !== null && fromToken !== undefined && String(fromToken).trim() !== '') {
        const n = Number(fromToken);
        return Number.isFinite(n) ? n : fromToken;
      }
    }

    const fromLegacy = localStorage.getItem('userSiteId');
    if (fromLegacy !== null && fromLegacy !== undefined && String(fromLegacy).trim() !== '') {
      const n = Number(fromLegacy);
      return Number.isFinite(n) ? n : fromLegacy;
    }

    return null;
  } catch (error) {
    console.error('❌ Error reading userSiteId from localStorage:', error);
    return null;
  }
}

/**
 * Priorité au `site_id` déjà présent dans les params de requête (ex. `user.site_id` depuis React) ;
 * sinon même valeur que {@link getUserSiteId}.
 * @param {Record<string, unknown>} [params]
 * @returns {number|string|null}
 */
export function resolveSiteIdForApiParams(params = {}) {
  const explicit = params?.site_id;
  if (explicit !== null && explicit !== undefined && String(explicit).trim() !== '') {
    const n = Number(explicit);
    return Number.isFinite(n) ? n : explicit;
  }
  return getUserSiteId();
}

/**
 * ✅ Get the current user's site name from localStorage
 * @returns {string|null} - The site name or null if not found
 */
export function getUserSiteName() {
  try {
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    const fromUser = parsedUser?.site_nom ?? parsedUser?.site?.nom ?? parsedUser?.site_name ?? parsedUser?.siteName;
    if (fromUser !== null && fromUser !== undefined && String(fromUser).trim() !== '') {
      return String(fromUser);
    }

    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeJwtPayload(token);
      const fromToken = payload?.site_nom ?? payload?.site?.nom ?? payload?.site_name ?? payload?.siteName;
      if (fromToken !== null && fromToken !== undefined && String(fromToken).trim() !== '') {
        return String(fromToken);
      }
    }

    const fromLegacy = localStorage.getItem('userSiteName');
    if (fromLegacy !== null && fromLegacy !== undefined && String(fromLegacy).trim() !== '') {
      return String(fromLegacy);
    }

    return null;
  } catch (error) {
    console.error('❌ Error reading userSiteName from localStorage:', error);
    return null;
  }
}

/**
 * ✅ Get the current user's site template key from localStorage/JWT
 * @returns {string|null} - The template key or null if not found
 */
/**
 * Code établissement aligné sur `Site.code` / IM (ex. MENZEL_HAYET, MASSADINE, MATEUR).
 * @returns {string|null}
 */
export function getUserSiteCode() {
  try {
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    const fromUser =
      parsedUser?.site_code ??
      parsedUser?.siteCode ??
      parsedUser?.site?.code;
    if (fromUser !== null && fromUser !== undefined && String(fromUser).trim() !== '') {
      return String(fromUser).trim();
    }

    const legacy = localStorage.getItem('userSiteCode');
    if (legacy !== null && legacy !== undefined && String(legacy).trim() !== '') {
      return String(legacy).trim();
    }

    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeJwtPayload(token);
      const fromToken = payload?.site_code ?? payload?.siteCode ?? payload?.site?.code;
      if (fromToken !== null && fromToken !== undefined && String(fromToken).trim() !== '') {
        return String(fromToken).trim();
      }
    }

    return null;
  } catch (error) {
    console.error('Error reading userSiteCode:', error);
    return null;
  }
}

export function getUserSiteTemplateKey() {
  try {
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    const fromUser =
      parsedUser?.site_template_key ??
      parsedUser?.siteTemplateKey ??
      parsedUser?.site?.template_key ??
      parsedUser?.site?.templateKey;
    if (fromUser !== null && fromUser !== undefined && String(fromUser).trim() !== '') {
      return String(fromUser);
    }

    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeJwtPayload(token);
      const fromToken =
        payload?.site_template_key ??
        payload?.siteTemplateKey ??
        payload?.site?.template_key ??
        payload?.site?.templateKey;
      if (fromToken !== null && fromToken !== undefined && String(fromToken).trim() !== '') {
        return String(fromToken);
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error reading site template key from localStorage:', error);
    return null;
  }
}

/**
 * ✅ Detect whether the current site behaves like Messadine/Sousse
 * @param {Object|number|string} source - User/site object, id or label
 * @returns {boolean}
 */
export function isMessadineSite(source = {}) {
  try {
    const raw = typeof source === 'object' && source !== null ? source : { site_id: source };
    const siteId = Number(
      raw?.site_id ?? raw?.siteId ?? raw?.id ?? getUserSiteId()
    );
    if (Number.isFinite(siteId) && siteId === 2) {
      return true;
    }

    const siteName = String(
      raw?.site_nom ?? raw?.siteName ?? raw?.site_name ?? raw?.site?.nom ?? getUserSiteName() ?? ''
    ).trim().toUpperCase();

    return siteName.includes('MESSAD') || siteName.includes('MASSAD');
  } catch {
    return false;
  }
}

/**
 * ✅ Store user site_id in localStorage (called after login)
 * @param {number|string} siteId - The site ID to store
 * @param {string} siteName - The site name to store
 */
export function storeUserSite(siteId, siteName) {
  try {
    localStorage.setItem('userSiteId', String(siteId));
    localStorage.setItem('userSiteName', String(siteName));
    console.log(`📍 Site stored: ${siteName} (ID: ${siteId})`);
  } catch (error) {
    console.error('❌ Error storing user site:', error);
  }
}

/**
 * ✅ Clear site information from localStorage (called on logout)
 */
export function clearUserSite() {
  try {
    localStorage.removeItem('userSiteId');
    localStorage.removeItem('userSiteName');
    localStorage.removeItem('userSiteCode');
    console.log('🧹 Site information cleared');
  } catch (error) {
    console.error('❌ Error clearing user site:', error);
  }
}

/**
 * ✅ Handle 403 Forbidden errors
 * Shows user-friendly error message and logs the incident
 * @param {Error} error - The axios error object
 * @param {Function} onError - Callback function to handle the error (e.g., show modal)
 * @returns {boolean} - true if error was 403, false otherwise
 */
export function handle403Error(error, onError = null) {
  const status = error?.response?.status;

  if (status === 403) {
    let message =
      error?.response?.data?.detail ||
      error?.response?.data?.error ||
      '';
    if (!message) {
      message = formatAxiosError(error);
    }

    console.error('🔴 Access Denied (403):', message);
    console.error('📍 URL:', error?.config?.url);
    console.error('📍 User Site ID:', getUserSiteId());

    // Call the error handler if provided
    if (typeof onError === 'function') {
      onError(message);
    } else {
      // Default: show alert (SweetAlert if available)
      try {
        // Lazy import to avoid forcing SweetAlert in non-UI contexts
        // eslint-disable-next-line global-require
        const { uiAlert } = require('./uiAlert');
        uiAlert({ icon: 'error', title: 'Accès refusé', text: String(message) });
      } catch {
        alert(message);
      }
    }

    return true;
  }

  return false;
}

/**
 * ✅ Build a query string with site_id filter
 * Used to automatically append site_id to API requests
 * @param {Object} filters - Additional filter parameters
 * @returns {Object} - Filter object with site_id included
 */
export function buildSiteFilter(filters = {}) {
  const siteId = getUserSiteId();
  const out = { ...(filters || {}) };

  // Ne jamais écraser site_id avec null/undefined venant des appels.
  if (out.site_id === null || out.site_id === undefined || out.site_id === '') {
    delete out.site_id;
  }

  if (siteId === null) return out;

  return {
    ...out,
    site_id: siteId,
  };
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

/**
 * ✅ Validate that a resource belongs to the user's site
 * Simple client-side check (backend validation is authoritative)
 * @param {Object} resource - The resource object to validate
 * @returns {boolean} - true if resource is in user's site, false otherwise
 */
export function isResourceInUserSite(resource = {}) {
  if (!resource) return false;

  const userSiteId = getUserSiteId();
  if (userSiteId === null) {
    console.warn('⚠️ Cannot validate: User site_id is null');
    return false;
  }

  // Check various possible fields where site_id might be stored
  const resourceSiteId =
    resource.site_id ||
    resource.site?.id ||
    resource.collaborateur?.site?.id ||
    resource.collaborateur?.site_id;

  return Number(resourceSiteId) === Number(userSiteId);
}

/**
 * ✅ Log navigation to a new page (for audit purposes)
 * @param {string} pageName - Name of the page being navigated to
 */
export function logNavigation(pageName) {
  const siteId = getUserSiteId();
  const siteName = getUserSiteName();
  console.log(`📍 Navigation → ${pageName} | Site: ${siteName} (ID: ${siteId})`);
}

/**
 * ✅ Check if user is locked to a specific site (no multi-site switching)
 * @returns {boolean} - true if site_id exists (user is locked to one site)
 */
export function isUserLockedToSite() {
  return getUserSiteId() !== null;
}
