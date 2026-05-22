// src/api/hseeExportApi.js
import axiosInstance from './axios';
import { getUserSiteId } from '../utils/siteAccessControl';

/**
 * Export Excel activité médecins (HSEE) — **un fichier par type** (colonnes différentes côté backend).
 * Backend : GET /api/hsee/exports/medecins-activite/
 *
 * @param {{ date_debut: string, date_fin: string, type_medecin: 'traitant'|'travail'|'controleur', medecin_id?: string }} params
 *   - type_medecin : **obligatoire** — le backend génère le modèle Excel spécifique à ce type uniquement.
 *   - medecin_id : optionnel ; sinon tous les médecins de ce type sur la période.
 */
export async function exportMedecinsActivite(params) {
  const { date_debut, date_fin, type_medecin, medecin_id } = params;
  const siteId = getUserSiteId();

  const q = {
    date_debut,
    date_fin,
    type_medecin,
  };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    q.site_id = siteId;
  }
  const mid = medecin_id != null ? String(medecin_id).trim() : '';
  if (mid !== '') {
    q.medecin_id = mid;
  }

  return axiosInstance.get('/hsee/exports/medecins-activite/', {
    params: q,
    responseType: 'blob',
  });
}
