// src/api/planningApi.js
import axiosInstance from './axios';

const isFallbackStatus = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405;
};

async function with404Fallback(requests) {
  let lastError;
  for (let i = 0; i < requests.length; i += 1) {
    try {
      return await requests[i]();
    } catch (error) {
      lastError = error;
      if (!isFallbackStatus(error) || i === requests.length - 1) {
        throw error;
      }
    }
  }
  throw lastError;
}

// PATCH /api/planning/items/{id}/effectuer/
// EN_ATTENTE → EFFECTUEE
export const effectuerItem = async (itemId) => {
  const response = await with404Fallback([
    () => axiosInstance.patch(`/planning/items/${itemId}/effectuer/`),
    () => axiosInstance.patch(`/act-infirmier/items/${itemId}/effectuer/`),
    () => axiosInstance.patch(`/act-infirmier/item-passage/${itemId}/effectuer/`),
  ]);
  return response.data;
};

// PATCH /api/act-infirmier/items/{id}/annuler/
// EN_ATTENTE → ANNULEE
export const annulerItem = async (itemId) => {
  const response = await with404Fallback([
    () => axiosInstance.patch(`/act-infirmier/items/${itemId}/annuler/`),
    () => axiosInstance.patch(`/planning/items/${itemId}/annuler/`),
  ]);
  return response.data;
};

// DELETE /api/act-infirmier/items/{id}/supprimer/
export const supprimerItem = async (itemId) => {
  await with404Fallback([
    () => axiosInstance.patch(`/act-infirmier/items/${itemId}/supprimer/`),
    () => axiosInstance.patch(`/planning/items/${itemId}/supprimer/`),
    () => axiosInstance.delete(`/act-infirmier/items/${itemId}/supprimer/`),
    () => axiosInstance.delete(`/planning/items/${itemId}/supprimer/`),
    () => axiosInstance.delete(`/act-infirmier/items/${itemId}/`),
    () => axiosInstance.delete(`/planning/items/${itemId}/`),
  ]);
};

// GET /api/employees/collaborateurs/?search=xxx
// search_fields : matricule, nom, prenom, department, poste
// Retourne : { id, matricule, nom, prenom, poste, department, ... }
export const searchCollaborateurs = async (search = '') => {
  const params = {};
  if (search.trim()) params.search = search.trim();
  const response = await axiosInstance.get('/employees/collaborateurs/', { params });
  // Gère liste directe [] ou paginé { results: [] }
  return Array.isArray(response.data) ? response.data : response.data.results ?? [];
};