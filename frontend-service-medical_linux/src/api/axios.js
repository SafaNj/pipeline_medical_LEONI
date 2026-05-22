import axios from 'axios';
import { clearFrontendSessionStorage } from '../utils/userSessionCache';
import {
  applyRefreshClaims,
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../utils/authSessionStore';

// Base API : en dev avec Vite, '/api' passe par le proxy (vite.config → Django :8000).
// Sinon : VITE_API_BASE_URL ou VITE_API_URL = URL absolue incluant le préfixe /api Django
// (ex. http://127.0.0.1:8000/api), pas seulement l’origine sans chemin.
const apiBase =
  import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_URL
  || '/api';

const instance = axios.create({
  baseURL: apiBase,
});

const isAuthUrl = (url = '') => (
  url.includes('/account/login/') ||
  url.includes('/account/refresh/') ||
  url.includes('/account/logout/')
);

let isRefreshing = false;
let pendingQueue = [];

function emitSessionChanged(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:session-changed', { detail }));
}

function emitSessionExpired(message = 'Session expirée, reconnectez-vous.') {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem('auth_expired_message', message);
  window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { message } }));
}

function flushQueue(error, token = '') {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(token);
  });
  pendingQueue = [];
}

function safeRedirectToLogin() {
  if (typeof window === 'undefined') return;

  try {
    // Évite les redirections depuis un iframe/fenêtre d'erreur navigateur.
    if (window.self !== window.top) return;

    const protocol = String(window.location?.protocol || '');
    if (protocol !== 'http:' && protocol !== 'https:') return;

    window.location.assign('/login');
  } catch {
    // noop: on laisse simplement l'erreur remonter sans casser l'app.
  }
}

// 2 — Intercepteur de requête (Request Interceptor)
instance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    
    // Si token existe → ajouter dans le header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Retourner la config
    return config;
  },
  (error) => {
    // Si erreur lors de la requête
    return Promise.reject(error);
  }
);

// 3 — Intercepteur de réponse (Response Interceptor)
instance.interceptors.response.use(
  (response) => {
    // Si la réponse est ok → retourner la réponse
    return response;
  },
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;

    if (status === 401 && !originalRequest._retry && !isAuthUrl(originalRequest.url)) {
      const refresh = getRefreshToken();
      if (!refresh) {
        clearSession();
        clearFrontendSessionStorage({ preserveAuth: false });
        emitSessionExpired();
        safeRedirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newAccess) => {
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return instance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${instance.defaults.baseURL}/account/refresh/`,
          { refresh }
        );

        const newAccess = refreshResponse?.data?.access;
        if (!newAccess) throw new Error('No access token returned');

        const nextRefresh = refreshResponse?.data?.refresh || refresh;
        setTokens({ access: newAccess, refresh: nextRefresh });

        const refreshClaims = applyRefreshClaims(refreshResponse?.data || {});
        if (refreshClaims?.identityChanged) {
          clearFrontendSessionStorage({ preserveAuth: true });
        }

        emitSessionChanged({
          reason: 'refresh-success',
          identityChanged: !!refreshClaims?.identityChanged,
        });

        flushQueue(null, newAccess);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return instance(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError);
        clearSession();
        clearFrontendSessionStorage({ preserveAuth: false });
        emitSessionExpired();
        safeRedirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 📍 Gestionnaire global pour 403 (Accès refusé - isolation par site)
    // (4️⃣ Checklist item 4)
    if (status === 403) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        "❌ Accès refusé: Vous n'avez pas les droits d'accéder à cette ressource";

      console.error('🔴 403 Access Denied:', {
        url: originalRequest.url,
        message,
        method: originalRequest.method,
        userSiteId: localStorage.getItem('userSiteId'),
      });

      // Attacher le message au error pour les composants qui peuvent le consulter
      error.isSiteAccessDenied = true;
      error.accessDeniedMessage = message;
    }

    // Si réponse = 403 (interdit) ou autres erreurs
    // Laisser passer l'erreur pour que le composant la gère
    return Promise.reject(error);
  }
);

// 5 — Exporter l'instance
export default instance;
