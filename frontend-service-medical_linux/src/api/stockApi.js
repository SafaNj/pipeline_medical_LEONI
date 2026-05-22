// src/api/stockApi.js
import axiosInstance from './axios';
import { getUserSiteId } from '../utils/siteAccessControl';

export const getMedicaments = async (search = '') => {
  const params = search.trim() ? { search: search.trim() } : {};
  const siteId = getUserSiteId();
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    params.site_id = siteId;
  }
  const res = await axiosInstance.get('/stock/medicaments/', { params });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const getStocks = async () => {
  const siteId = getUserSiteId();
  const res = await axiosInstance.get('/stock/stocks/', {
    params: siteId !== null ? { site_id: siteId } : undefined,
  });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const getAlertes = async () => {
  const siteId = getUserSiteId();
  const res = await axiosInstance.get('/stock/stocks/alertes/', {
    params: siteId !== null ? { site_id: siteId } : undefined,
  });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const creerMedicament = async (data) => {
  const siteId = getUserSiteId();
  const payload = { ...data };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    payload.site_id = siteId;
  }
  const res = await axiosInstance.post('/stock/medicaments/', payload);
  return res.data;
};

export const modifierMedicament = async (id, data) => {
  const res = await axiosInstance.patch(`/stock/medicaments/${id}/`, data);
  return res.data;
};

export const creerStock = async (data) => {
  const res = await axiosInstance.post('/stock/stocks/', data);
  return res.data;
};

export const modifierStock = async (id, data) => {
  const res = await axiosInstance.patch(`/stock/stocks/${id}/`, data);
  return res.data;
};

/**
 * Entrée de stock — envoie le nombre de CONDITIONNEMENTS reçus.
 * Le backend multiplie automatiquement par qte_par_conditionnement.
 *
 * data = {
 *   stock_id            : <int>
 *   nb_conditionnements : <int>   ← nombre de boîtes/flacons reçus
 *   motif?              : <str>
 *   date_expiration?    : <str>   "YYYY-MM-DD"
 * }
 */
export const entreeStock = async (data) => {
  const res = await axiosInstance.post('/stock/stocks/entree/', data);
  return res.data;
};

// Donner médicament directement (dispensation libre)
export const creerActe = async (data) => {
  const siteId = getUserSiteId();
  const payload = { ...data };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    payload.site_id = siteId;
  }
  const res = await axiosInstance.post('/stock/actes/', payload);
  return res.data;
};

// Historique actes d'un collaborateur
export const getActesByCollaborateur = async (collaborateurId) => {
  const siteId = getUserSiteId();
  const params = { collaborateur_id: collaborateurId };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    params.site_id = siteId;
  }
  const res = await axiosInstance.get('/stock/actes/by_collaborateur/', { params });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

// Consommation courante — sortie étagère sans collaborateur (motif optionnel)
export const consommationCourante = async ({ medicament, quantite, motif }) => {
  const siteId = getUserSiteId();
  const payload = { medicament, quantite };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    payload.site_id = siteId;
  }
  if (motif && motif.trim()) payload.motif = motif.trim();
  const response = await axiosInstance.post('/stock/consommation-courante/', payload);
  return response.data;
};

// Export Excel du stock des médicaments
export const exportStockMedicaments = async () => {
  const siteId = getUserSiteId();
  const params = {};
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    params.site_id = siteId;
  }
  const res = await axiosInstance.get('/stock/export-stock/', {
    params,
    responseType: 'blob',
  });
  return res.data;
};