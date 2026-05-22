import axiosInstance from './axios';
import { getUserSiteId } from '../utils/siteAccessControl';

export const TYPE_FICHE_MEDICALE = 'FICHE_MEDICALE';
export const TYPE_DOSSIER_MEDICAL = 'DOSSIER_MEDICAL';

export const TYPE_DOCUMENT_LABELS = {
  [TYPE_FICHE_MEDICALE]: 'Fiche médicale',
  [TYPE_DOSSIER_MEDICAL]: 'Dossier médical',
};

const BASE = '/act-infirmier/documents-medicaux-scannes/';

/** Réponse liste DRF paginée ou tableau brut */
export function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return {
    results: data?.results ?? [],
    count: data?.count ?? (data?.results?.length ?? 0),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}

export function formatDocumentsApiError(error, fallback = 'Une erreur est survenue.') {
  const st = error?.response?.status;
  const d = error?.response?.data;
  if (st === 403) return "Vous n'avez pas le droit d'effectuer cette action sur les documents.";
  if (st === 413) return 'Fichier trop volumineux (max 10 Mo).';
  if (typeof d?.detail === 'string') return d.detail;
  if (Array.isArray(d?.detail)) return d.detail.join(' ');
  if (d && typeof d === 'object') {
    const parts = [];
    for (const [k, v] of Object.entries(d)) {
      if (k === 'detail') continue;
      if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
      else if (typeof v === 'string') parts.push(`${k}: ${v}`);
    }
    if (parts.length) return parts.join(' · ');
  }
  if (!error?.response) return 'Erreur de connexion. Vérifiez le réseau.';
  return fallback;
}

export async function listDocumentsMedicauxScannes(params = {}) {
  const siteId = getUserSiteId();
  const finalParams = { ...(params || {}) };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    finalParams.site_id = siteId;
  }
  const r = await axiosInstance.get(BASE, { params: finalParams });
  return normalizeListResponse(r.data);
}

export async function getDocumentMedicalScanne(id) {
  const r = await axiosInstance.get(`${BASE}${id}/`);
  return r.data;
}

/** POST multipart — champs : collaborateur (id|null), matricule_ref, type_document, fichier, titre, commentaire, date_document */
export async function createDocumentMedicalScanne(formData) {
  const r = await axiosInstance.post(BASE, formData);
  return r.data;
}

/** PATCH : JSON si pas de fichier, sinon FormData */
export async function updateDocumentMedicalScanne(id, payload, file) {
  if (file) {
    const fd = new FormData();
    if (payload.collaborateur != null) fd.append('collaborateur', String(payload.collaborateur));
    fd.append('matricule_ref', payload.matricule_ref ?? '');
    fd.append('type_document', payload.type_document);
    fd.append('titre', payload.titre ?? '');
    fd.append('commentaire', payload.commentaire ?? '');
    if (payload.date_document) fd.append('date_document', payload.date_document);
    fd.append('fichier', file);
    const r = await axiosInstance.patch(`${BASE}${id}/`, fd);
    return r.data;
  }
  const r = await axiosInstance.patch(`${BASE}${id}/`, payload);
  return r.data;
}

export async function deleteDocumentMedicalScanne(id) {
  await axiosInstance.delete(`${BASE}${id}/`);
}

export const MAX_SCAN_BYTES = 10 * 1024 * 1024;
export const ALLOWED_SCAN_EXT = ['pdf', 'jpg', 'jpeg', 'png'];

export function validateScanFile(file) {
  if (!file) return 'Aucun fichier sélectionné.';
  if (file.size > MAX_SCAN_BYTES) return 'Fichier trop volumineux (max 10 Mo).';
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_SCAN_EXT.includes(ext)) return 'Types acceptés : PDF, JPG, JPEG, PNG.';
  return null;
}
