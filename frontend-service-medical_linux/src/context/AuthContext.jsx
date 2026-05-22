/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/authApi';
import { buildNormalizedAuthUser, syncLegacySiteStorage } from '../utils/authSiteContext';
import { getAccessToken, getStoredUser } from '../utils/authSessionStore';

const AuthContext = createContext();

const SITE_ASSIGNMENT_REQUIRED_MESSAGE = "Votre compte n'est pas encore assigné à un site. Contactez l'administrateur pour activer l'accès aux modules concernés.";

function requiresAssignedSite(userData = {}) {
  const role = String(userData?.role || '').toLowerCase();
  const medType = String(userData?.med_type || '').toLowerCase();
  return role === 'infirmier' || role === 'rh' || role === 'hsse' || (role === 'medecin' && medType === 'travail');
}

function hasAssignedSite(userData = {}) {
  const siteId = userData?.site_id;
  return siteId !== null && siteId !== undefined && String(siteId).trim() !== '';
}

function blockSiteAccess() {
  window.sessionStorage.setItem('auth_expired_message', SITE_ASSIGNMENT_REQUIRED_MESSAGE);
  void authApi.logout();
}

function normalizeUserSite(userData = {}) {
  return buildNormalizedAuthUser(userData, localStorage.getItem('token') || '');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getAccessToken();

    if (storedUser && token) {
      try {
        const normalized = buildNormalizedAuthUser(storedUser, token);
        if (requiresAssignedSite(normalized) && !hasAssignedSite(normalized)) {
          blockSiteAccess();
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        localStorage.setItem('user', JSON.stringify(normalized));
        syncLegacySiteStorage(normalized);
        setUser(normalized);
        setIsAuthenticated(true);
      } catch (error) {
        void error;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    function syncFromSessionStorage() {
      const token = getAccessToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const normalized = buildNormalizedAuthUser(storedUser, token);
      if (requiresAssignedSite(normalized) && !hasAssignedSite(normalized)) {
        blockSiteAccess();
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      localStorage.setItem('user', JSON.stringify(normalized));
      syncLegacySiteStorage(normalized);
      setUser(normalized);
      setIsAuthenticated(true);
    }

    window.addEventListener('auth:session-changed', syncFromSessionStorage);
    window.addEventListener('auth:session-expired', syncFromSessionStorage);

    return () => {
      window.removeEventListener('auth:session-changed', syncFromSessionStorage);
      window.removeEventListener('auth:session-expired', syncFromSessionStorage);
    };
  }, []);

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    const normalized = buildNormalizedAuthUser({
      username: data.username,
      role: data.role,
      med_type: data.med_type,
      must_change_password: data.must_change_password,
      user_id: data.user_id,
      nom_ar:
        data.nom_ar ??
        data.last_name_ar ??
        data.user?.nom_ar ??
        data.user?.last_name_ar ??
        null,
      prenom_ar:
        data.prenom_ar ??
        data.first_name_ar ??
        data.user?.prenom_ar ??
        data.user?.first_name_ar ??
        null,
      full_name_ar:
        data.full_name_ar ??
        data.nom_arabe ??
        data.user?.full_name_ar ??
        data.user?.nom_arabe ??
        null,
      site_id: data.site_id ?? data.site?.id ?? null,
      site_nom: data.site_nom ?? data.site_name ?? data.site?.nom ?? null,
      site_template_key: data.site_template_key ?? data.site?.template_key ?? data.site?.templateKey ?? null,
      site_code: data.site_code ?? data.site?.code ?? null,
    }, localStorage.getItem('token') || '');

    if (requiresAssignedSite(normalized) && !hasAssignedSite(normalized)) {
      blockSiteAccess();
      setUser(null);
      setIsAuthenticated(false);
      const error = new Error(SITE_ASSIGNMENT_REQUIRED_MESSAGE);
      error.code = 'SITE_ASSIGNMENT_REQUIRED';
      throw error;
    }

    localStorage.setItem('user', JSON.stringify(normalized));
    syncLegacySiteStorage(normalized);
    setUser(normalized);
    setIsAuthenticated(true);

    return data;
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    try {
      await authApi.logout();
    } catch {
      // logout is best-effort: frontend state is already cleared
    }
  };

  const updateUser = (newUserData) => {
    setUser((prevUser) => {
      const updatedUser = normalizeUserSite({ ...prevUser, ...newUserData });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      syncLegacySiteStorage(updatedUser);
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);