import axiosInstance from './axios';
import { getUserSiteId } from '../utils/siteAccessControl';

function withSiteId(params = {}) {
  const siteId = getUserSiteId();
  const out = { ...(params || {}) };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    out.site_id = siteId;
  }
  return out;
}

// GET /api/hsee/notifications/
export async function getNotificationsHSSE() {
  const response = await axiosInstance.get('/hsee/notifications/', {
    params: withSiteId(),
  });
  return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
}

// GET /api/hsee/notifications/compte/
export async function getNombreNonLues() {
  const response = await axiosInstance.get('/hsee/notifications/compte/', {
    params: withSiteId(),
  });
  const data = response.data;

  if (typeof data === 'number') return data;
  if (typeof data?.count === 'number') return data.count;
  if (typeof data?.nombre_non_lues === 'number') return data.nombre_non_lues;
  if (typeof data?.non_lues === 'number') return data.non_lues;

  return 0;
}

// PATCH /api/hsee/notifications/{id}/marquer-lu/
export async function marquerCommeLue(id) {
  const response = await axiosInstance.patch(`/hsee/notifications/${id}/marquer-lu/`);
  return response.data;
}

// Endpoint lecture enquête
// GET /api/act-infirmier/accidents/{accidentId}/enquete/
export async function getEnqueteHSSE(accidentId) {
  const response = await axiosInstance.get(`/act-infirmier/accidents/${accidentId}/enquete/`);
  return response.data;
}
