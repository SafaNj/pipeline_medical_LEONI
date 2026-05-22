import axiosInstance from './axios';

export const getSites = async () => {
  const res = await axiosInstance.get('/account/sites/');
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

// Récupérer les données d'un site par ID
export const getSite = async (id) => {
  const response = await axiosInstance.get(`/account/sites/${id}/`);
  return response.data;
};

// Modifier les données d'un site
export const modifierSite = async (id, data) => {
  const response = await axiosInstance.patch(`/account/sites/${id}/`, data);
  return response.data;
};
