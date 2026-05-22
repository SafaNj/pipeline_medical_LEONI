import axiosInstance from './axios';
import { storeUserSite } from '../utils/siteAccessControl';
import { buildNormalizedAuthUser, syncLegacySiteStorage } from '../utils/authSiteContext';
import { clearFrontendSessionStorage } from '../utils/userSessionCache';
import {
  applyRefreshClaims,
  clearSession,
  setStoredUser,
  setTokens,
} from '../utils/authSessionStore';
import { clearUserSite } from '../utils/siteAccessControl';

// 1 — login(username, password)
export const login = async (username, password) => {
  const response = await axiosInstance.post('/account/login/', {
    username,
    password,
  });

  const {
    access,
    refresh,
    role,
    med_type,
    must_change_password,
    username: returnedUsername,
    user_id,
  } = response.data;

  setTokens({ access, refresh });

  // Stocker user dans localStorage ('user')
  const user = buildNormalizedAuthUser({
    username: returnedUsername,
    role,
    med_type,
    must_change_password,
    user_id,
    nom_ar:
      response.data.nom_ar ??
      response.data.last_name_ar ??
      response.data.user?.nom_ar ??
      response.data.user?.last_name_ar ??
      null,
    prenom_ar:
      response.data.prenom_ar ??
      response.data.first_name_ar ??
      response.data.user?.prenom_ar ??
      response.data.user?.first_name_ar ??
      null,
    full_name_ar:
      response.data.full_name_ar ??
      response.data.nom_arabe ??
      response.data.user?.full_name_ar ??
      response.data.user?.nom_arabe ??
      null,
    site_id: response.data.site_id ?? response.data.site?.id ?? null,
    site_nom: response.data.site_nom ?? response.data.site_name ?? response.data.site?.nom ?? null,
    site_template_key: response.data.site_template_key ?? response.data.site?.template_key ?? response.data.site?.templateKey ?? null,
    site_code: response.data.site_code ?? response.data.site?.code ?? null,
  }, access);
  setStoredUser(user);
  syncLegacySiteStorage(user);
  clearFrontendSessionStorage({ preserveAuth: true });

  // 📍 Stocker site_id et site_nom (1️⃣ Checklist item 1)
  if (user.site_id && user.site_nom) {
    storeUserSite(user.site_id, user.site_nom);
  }

  // Retourner les données
  return response.data;
};

// 2 — logout()
export const logout = async () => {
  // Nettoyage immédiat côté front pour garantir un retour à /login même si l'API refuse.
  clearSession();
  clearFrontendSessionStorage({ preserveAuth: false });
  clearUserSite();
};

// 3 — changePassword(oldPassword, newPassword, newPassword2)
export const changePassword = async (oldPassword, newPassword, newPassword2) => {
  const response = await axiosInstance.post('/account/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
    new_password2: newPassword2,
  });

  const { access, refresh } = response.data;
  setTokens({ access, refresh });
  applyRefreshClaims(response.data);

  // Retourner les données
  return response.data;
};

// 4 — refreshToken()
export const refreshToken = async () => {
  // Lire refresh depuis localStorage
  const refresh = getRefreshToken();

  // Appel POST /account/refresh/
  const response = await axiosInstance.post('/account/refresh/', {
    refresh,
  });

  const { access } = response.data;
  setTokens({ access, refresh: response.data?.refresh || refresh });
  applyRefreshClaims(response.data);
  return access;
};