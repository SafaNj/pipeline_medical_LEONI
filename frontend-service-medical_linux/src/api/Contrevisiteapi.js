// src/api/Contrevisiteapi.js
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

// ─── LISTES DU JOUR (type CONTRE_VISITE) ─────────────────────────
export const getMesListesContreVisite = async () => {
  const res = await axiosInstance.get('/control-visits/contre-visites/mes_listes_du_jour/', {
    params: withSiteId(),
  });
  return res.data;
};

// ─── CONTRE-VISITES ───────────────────────────────────────────────
export const creerContreVisite = async (payload) => {
  const res = await axiosInstance.post('/control-visits/contre-visites/', payload);
  return res.data;
};

export const getContreVisites = async () => {
  const res = await axiosInstance.get('/control-visits/contre-visites/', {
    params: withSiteId(),
  });
  const data = res.data;
  return Array.isArray(data) ? data : (data.results || []);
};

/** Normalise la réponse (liste brute, paginée DRF { results }, ou erreur vide). */
const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

export const getContreVisitesByMatricule = async (matricule) => {
  const res = await axiosInstance.get('/control-visits/contre-visites/by_collaborateur/', {
    params: withSiteId({ matricule }),
  });
  return asList(res.data);
};

export const updateContreVisite = async (id, payload) => {
  const res = await axiosInstance.patch(`/control-visits/contre-visites/${id}/`, payload);
  return res.data;
};

export const supprimerContreVisite = async (id) => {
  await axiosInstance.delete(`/control-visits/contre-visites/${id}/`);
};

export const supprimerControleMedical = async (id) => {
  await axiosInstance.delete(`/control-visits/controles-medicaux/${id}/`);
};

// ─── CONTROLES MEDICAUX ───────────────────────────────────────────
export const creerControleMedical = async (payload) => {
  const res = await axiosInstance.post('/control-visits/controles-medicaux/', payload);
  return res.data;
};

export const getControleMedicalByContreVisite = async (contreVisiteId) => {
  const res = await axiosInstance.get('/control-visits/controles-medicaux/by_contre_visite/', {
    params: withSiteId({ contre_visite_id: contreVisiteId }),
  });
  return res.data;
};

export const updateControleMedical = async (id, payload) => {
  const res = await axiosInstance.patch(`/control-visits/controles-medicaux/${id}/`, payload);
  return res.data;
};

// ─── DEMANDES D'EXPERTISE ─────────────────────────────────────────
export const creerDemandeExpertise = async (payload) => {
  const res = await axiosInstance.post('/control-visits/demandes-expertise/', payload);
  return res.data;
};

export const getDemandesExpertise = async () => {
  const res = await axiosInstance.get('/control-visits/demandes-expertise/', {
    params: withSiteId(),
  });
  return asList(res.data);
};

export const getDemandesByContreVisite = async (contreVisiteId) => {
  const res = await axiosInstance.get('/control-visits/demandes-expertise/by_contre_visite/', {
    params: withSiteId({ contre_visite_id: contreVisiteId }),
  });
  return asList(res.data);
};

export const updateDemandeExpertise = async (id, payload) => {
  const res = await axiosInstance.patch(`/control-visits/demandes-expertise/${id}/`, payload);
  return res.data;
};

export const supprimerDemandeExpertise = async (id) => {
  await axiosInstance.delete(`/control-visits/demandes-expertise/${id}/`);
};
// ─── RECHERCHE COLLABORATEUR PAR MATRICULE ────────────────────
export const getCollaborateurByMatricule = async (matricule) => {
  const res = await axiosInstance.get('/collaborateurs/search/', {
    params: withSiteId({ matricule }),
  });
  return res.data;
};
// ─── RECHERCHE COLLABORATEURS ─────────────────────────────────────
export const searchCollaborateurs = async (search = '') => {
  const params = withSiteId({});
  if (search.trim()) params.search = search.trim();
  const res = await axiosInstance.get('/employees/collaborateurs/', { params });
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
};

// GET /api/control-visits/contre-visites/ — lecture RH / Infirmier (liste complète)
export const getContreVisitesPourConsultation = async () => {
  const r = await axiosInstance.get('/control-visits/contre-visites/', {
    params: withSiteId(),
  });
  return Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
};

// ═══════════════════════════════════════════════════════════════════════════
// NOUVELLES ROUTES — LISTES DE CONTRE-VISITES (ListeContreVisite)
// Base URL axios : VITE_API_BASE_URL || '/api' → ex. /api/control-visits/...
// Champs JSON optionnels (post-migrate) : liste.sms_veille_envoye, ligne.sms_jour_j_envoye
// (SMS déclenchés côté serveur ; voir utils/contreVisiteSms.js pour lecture côté front)
// ═══════════════════════════════════════════════════════════════════════════

// ─── LISTES ───────────────────────────────────────────────────────────────
/** @param {{ archived?: boolean }} [opts] — archived=true : listes archivées (statut ARCHIVEE) côté backend */
export const getListes = async (opts = {}) => {
  const params = withSiteId();
  if (opts.archived) params.archived = true;
  const res = await axiosInstance.get('/control-visits/listes-contre-visites/', { params });
  return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
};

/** RH : archiver une liste de contre-visites clôturée → statut ARCHIVEE */
export const archiverListeContreVisite = async (id) => {
  const res = await axiosInstance.patch(
    `/control-visits/listes-contre-visites/${id}/archiver/`,
    {},
    { params: withSiteId() },
  );
  return res.data;
};

export const getListeDetail = async (id) => {
  const res = await axiosInstance.get(`/control-visits/listes-contre-visites/${id}/`);
  return res.data;
};

export const creerListe = async (payload) => {
  const res = await axiosInstance.post('/control-visits/listes-contre-visites/', {
    ...payload,
    site_id: getUserSiteId(),
  });
  return res.data;
};

export const updateListe = async (id, payload) => {
  const res = await axiosInstance.patch(`/control-visits/listes-contre-visites/${id}/`, payload);
  return res.data;
};

export const deleteListe = async (id) => {
  await axiosInstance.delete(`/control-visits/listes-contre-visites/${id}/`);
};

export const soumettreListe = async (id) => {
  const res = await axiosInstance.patch(`/control-visits/listes-contre-visites/${id}/soumettre/`);
  return res.data;
};

export const assignerMedecin = async (id, medecinControleurId) => {
  const res = await axiosInstance.patch(
    `/control-visits/listes-contre-visites/${id}/assigner_medecin/`,
    { medecin_controleur_id: medecinControleurId }
  );
  return res.data;
};

export const cloturerListe = async (id) => {
  const res = await axiosInstance.patch(`/control-visits/listes-contre-visites/${id}/cloturer/`);
  return res.data;
};

/**
 * Réponse type : { sent?: boolean, detail?: string, sms_count?: number }
 */
function assertSmsVeilleOk(data) {
  if (data == null || typeof data !== 'object') return data;
  if (data.sent === false) {
    const d = data.detail != null ? String(data.detail) : 'Envoi SMS veille refusé.';
    throw new Error(d);
  }
  return data;
}

/**
 * SMS veille (J−1) — contre-visites.
 * POST /control-visits/listes-contre-visites/{id}/notifier_veille/ (secours: sms_veille, send_sms_veille, rappel_veille).
 */
export async function notifierSmsVeilleListeContreVisite(listeId) {
  const id = listeId;
  if (id == null || id === '') throw new Error('Identifiant de liste manquant.');

  const base = `/control-visits/listes-contre-visites/${id}`;
  const attempts = [
    () => axiosInstance.post(`${base}/notifier_veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${base}/notifier-veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${base}/sms_veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${base}/send_sms_veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${base}/rappel_veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${base}/notifier_sms_veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${base}/smsVeille/`, {}, { params: withSiteId() }),
    () => axiosInstance.patch(`${base}/notifier_veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.patch(`${base}/notifier-veille/`, {}, { params: withSiteId() }),
  ];

  let lastErr;
  for (const run of attempts) {
    try {
      const r = await run();
      const data = r?.data ?? r;
      return assertSmsVeilleOk(data);
    } catch (e) {
      if (e instanceof Error && e.message && !e.response) throw e;
      lastErr = e;
      const st = e?.response?.status;
      if (st === 404 || st === 405) continue;
      throw e;
    }
  }
  throw lastErr ?? new Error('Aucune route SMS veille pour cette liste (vérifiez le backend).');
}

export const getMedecinsControleurs = async () => {
  const res = await axiosInstance.get('/control-visits/listes-contre-visites/medecins_controleurs/');
  return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
};

// ─── LIGNES DE CONTRE-VISITES ────────────────────────────────────────────
/** @param {{ liste: number, collaborateur: number, ordre?: number }} payload — `ordre` = position en file (dernier = max+1) */
export const ajouterLigne = async (payload) => {
  const res = await axiosInstance.post('/control-visits/lignes-contre-visites/', payload);
  return res.data;
};

export const supprimerLigne = async (id) => {
  await axiosInstance.delete(`/control-visits/lignes-contre-visites/${id}/`);
};

export const setPresenceLigne = async (id, presence, raisonReport = null) => {
  const body = { presence };
  if (raisonReport) body.raison_report = raisonReport;
  const res = await axiosInstance.patch(
    `/control-visits/lignes-contre-visites/${id}/presence/`,
    body
  );
  return res.data;
};

export const saisirVerdict = async (id, payload) => {
  const res = await axiosInstance.patch(
    `/control-visits/lignes-contre-visites/${id}/saisir_verdict/`,
    payload
  );
  return res.data;
};