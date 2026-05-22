// src/api/surveillanceSpecialeApi.js — Surveillance médicale spéciale (listes SMS)
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

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

const BASE = '/surveillance-speciale';
const LISTES = `${BASE}/listes-surveillance-speciale/`;
const LIGNES = `${BASE}/lignes-surveillance-speciale/`;

/** GET …/listes-surveillance-speciale/ */
export async function getListesSurveillanceSpeciale(params = {}) {
  const r = await axiosInstance.get(LISTES, { params: withSiteId(params) });
  return unwrapList(r.data);
}

/** GET …/listes-surveillance-speciale/{id}/ */
export async function getListeSurveillanceSpecialeDetail(id) {
  const r = await axiosInstance.get(`${LISTES}${id}/`, { params: withSiteId() });
  return r.data;
}

/**
 * GET …/listes-surveillance-speciale/existe/?id=… — réponse 200 (pas de 404 pour « tester » le type).
 * @returns {Promise<{ id?: number|string, existe?: boolean, type_liste?: string|null, flux?: string|null }>}
 */
export async function getListeSurveillanceSpecialeExiste(id) {
  const r = await axiosInstance.get(`${LISTES}existe/`, { params: withSiteId({ id }) });
  return r?.data ?? {};
}

/** POST …/listes-surveillance-speciale/ — body: { date_visite, titre? } */
export async function createListeSurveillanceSpeciale(payload) {
  const r = await axiosInstance.post(LISTES, payload, { params: withSiteId() });
  return r.data;
}

/** PATCH …/listes-surveillance-speciale/{id}/ — ex. { date_visite }, { titre } */
export async function patchListeSurveillanceSpeciale(id, payload) {
  const r = await axiosInstance.patch(`${LISTES}${id}/`, payload, { params: withSiteId() });
  return r.data;
}

/** DELETE …/listes-surveillance-speciale/{id}/ — typiquement réservé au statut brouillon (RH). */
export async function deleteListeSurveillanceSpeciale(id) {
  await axiosInstance.delete(`${LISTES}${id}/`, { params: withSiteId() });
}

/** PATCH …/listes-surveillance-speciale/{id}/soumettre/ */
export async function soumettreListeSurveillanceSpeciale(id) {
  const r = await axiosInstance.patch(`${LISTES}${id}/soumettre/`, {}, { params: withSiteId() });
  return r.data;
}

/** PATCH …/listes-surveillance-speciale/{id}/assigner_medecin/ — body { medecin } */
export async function assignerMedecinListeSurveillanceSpeciale(id, medecinId) {
  const r = await axiosInstance.patch(
    `${LISTES}${id}/assigner_medecin/`,
    { medecin: medecinId },
    { params: withSiteId() },
  );
  return r.data;
}

/** PATCH …/listes-surveillance-speciale/{id}/cloturer/ */
export async function cloturerListeSurveillanceSpeciale(id) {
  const r = await axiosInstance.patch(`${LISTES}${id}/cloturer/`, {}, { params: withSiteId() });
  return r.data;
}

/** PATCH …/listes-surveillance-speciale/{id}/archiver/ — liste clôturée → statut Archivée (RH). */
export async function archiverListeSurveillanceSpeciale(id) {
  const r = await axiosInstance.patch(`${LISTES}${id}/archiver/`, {}, { params: withSiteId() });
  return r.data;
}

/**
 * Référence de la liste « reportée » (brouillon) : GET détail liste clôturée ou champs renvoyés au même format.
 * Aligné sur les clés utilisées pour l’embauche (`nouvelle_liste_reportee_*`, `liste_reportee_*`, etc.).
 * @param {object|null|undefined} d — Objet JSON (liste ou réponse clôture).
 * @returns {{ id: string|number, ref: string }|null}
 */
function idFromMaybeObject(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'object') return v.id != null ? v.id : null;
  return v;
}

export function parseRapportListeSmsSurveillance(d) {
  if (!d || typeof d !== 'object') return null;
  const rid =
    d.nouvelle_liste_reportee_id ??
    d.nouvelle_liste_id ??
    d.liste_reportee_id ??
    idFromMaybeObject(d.liste_reportee) ??
    d.reportee_liste_id ??
    idFromMaybeObject(d.nouvelle_liste) ??
    idFromMaybeObject(d.liste_suivante) ??
    idFromMaybeObject(d.suite_liste) ??
    d.liste_suivante_id ??
    d.suite_liste_id;
  if (rid == null || rid === '') return null;
  const nestedRef = (o) => (o && typeof o === 'object' ? o.reference ?? o.ref : null);
  const ref =
    d.nouvelle_liste_reportee_reference ??
    d.nouvelle_liste_reference ??
    d.liste_reportee_reference ??
    d.reportee_liste_reference ??
    nestedRef(d.liste_reportee) ??
    nestedRef(d.nouvelle_liste) ??
    nestedRef(d.liste_suivante) ??
    d.suite_liste_reference;
  return { id: rid, ref: ref ? String(ref) : String(rid) };
}

/**
 * Fusionne la réponse PATCH `cloturer` et le GET détail liste (souvent le serializer GET
 * expose `nouvelle_liste_reportee_*` alors que le PATCH ne renvoie qu’un sous-ensemble).
 */
export function mergeReponsesClotureSurveillanceSpeciale(patchData, detailListe) {
  if (!patchData || typeof patchData !== 'object') return detailListe && typeof detailListe === 'object' ? detailListe : patchData;
  if (!detailListe || typeof detailListe !== 'object') return patchData;
  return { ...patchData, ...detailListe };
}

/**
 * Normalise la réponse PATCH `…/cloturer/` (éventuellement fusionnée avec GET détail) — aligné embauche.
 * @param {object|null|undefined} res
 * @returns {{ nombreReportes: number, nouvelleListeId: string|number|null, nouvelleListeRef: string, rhNotifiesCount: number|null }}
 */
export function parseResultatClotureSurveillanceSpeciale(res) {
  if (!res || typeof res !== 'object') {
    return { nombreReportes: 0, nouvelleListeId: null, nouvelleListeRef: '', rhNotifiesCount: null };
  }
  const nested = res.resultat_cloture ?? res.cloture ?? res.rapport;
  const base = nested && typeof nested === 'object' ? { ...res, ...nested } : res;
  const rawN =
    base.nombre_reportes ??
    base.nombre_non_traites ??
    base.nb_reportes ??
    base.non_traites_count ??
    base.nb_non_traites ??
    base.nombre_lignes_reportees ??
    base.nb_lignes_reportees ??
    base.lignes_reportees_count;
  const n = Number(rawN);
  const nombreReportes = Number.isFinite(n) && n >= 0 ? n : 0;
  const rapport = parseRapportListeSmsSurveillance(base);
  const rhRaw = base.rh_notifies_count ?? base.rh_notifications_count ?? base.rh_notified_count ?? null;
  const rhN = Number(rhRaw);
  const rhNotifiesCount = rhRaw != null && Number.isFinite(rhN) ? rhN : null;
  return {
    nombreReportes,
    nouvelleListeId: rapport?.id ?? null,
    nouvelleListeRef: rapport?.ref ?? '',
    rhNotifiesCount,
  };
}

/** GET …/listes-surveillance-speciale/medecins_travail/ */
export async function getMedecinsTravailSurveillanceSpeciale() {
  const r = await axiosInstance.get(`${LISTES}medecins_travail/`, { params: withSiteId() });
  return Array.isArray(r.data) ? r.data : unwrapList(r.data);
}

/** GET …/lignes-surveillance-speciale/?liste=<id> */
export async function getLignesSurveillanceSpeciale(listeId) {
  const r = await axiosInstance.get(LIGNES, { params: withSiteId({ liste: listeId }) });
  return unwrapList(r.data);
}

/** GET …/lignes-surveillance-speciale/{id}/ — détail (souvent plus complet que la liste : fiche liée, etc.) */
export async function getLigneSurveillanceSpecialeById(ligneId) {
  const r = await axiosInstance.get(`${LIGNES}${ligneId}/`, { params: withSiteId() });
  return r.data;
}

/**
 * Tant que le serializer DRF exige `ordre` en entrée, on l’envoie toujours.
 * Si `body.ordre` est fourni (≥ 1), on le garde ; sinon GET lignes puis max(ordre)+1.
 */
async function resolveOrdreForPost(listeId, explicitOrdre) {
  if (explicitOrdre != null && explicitOrdre !== '') {
    const n = Number(explicitOrdre);
    if (Number.isFinite(n) && n >= 1) return n;
  }
  const lignes = await getLignesSurveillanceSpeciale(listeId);
  let max = 0;
  for (const l of lignes) {
    const o = Number(l?.ordre);
    if (Number.isFinite(o) && o > max) max = o;
  }
  return max + 1;
}

/**
 * POST …/lignes-surveillance-speciale/
 * Envoie { liste, matricule, ordre } — `ordre` calculé côté client si absent (compat. back actuel).
 */
export async function createLigneSurveillanceSpeciale(body) {
  const rawListe = body.liste ?? body.liste_id;
  const listeId = Number(rawListe);
  if (!Number.isFinite(listeId)) {
    throw new Error('Identifiant de liste invalide.');
  }
  const m = String(body.matricule ?? '').trim();
  if (!m) {
    throw new Error('Matricule requis.');
  }
  const ordre = await resolveOrdreForPost(listeId, body.ordre);
  const r = await axiosInstance.post(
    LIGNES,
    { liste: listeId, matricule: String(m), ordre },
    { params: withSiteId() },
  );
  return r.data;
}

/** DELETE …/lignes-surveillance-speciale/{id}/ */
export async function deleteLigneSurveillanceSpeciale(id) {
  await axiosInstance.delete(`${LIGNES}${id}/`, { params: withSiteId() });
}

/** PATCH …/lignes-surveillance-speciale/{id}/presence/ — { presence, raison_report? } */
export async function patchPresenceLigneSurveillanceSpeciale(id, payload) {
  const r = await axiosInstance.patch(`${LIGNES}${id}/presence/`, payload, { params: withSiteId() });
  return r.data;
}

/** PATCH …/lignes-surveillance-speciale/{id}/terminer-traitement/ (ou terminer_traitement) */
export async function terminerTraitementLigneSurveillanceSpeciale(id, body = {}) {
  const attempts = [
    () => axiosInstance.patch(`${LIGNES}${id}/terminer-traitement/`, body, { params: withSiteId() }),
    () => axiosInstance.patch(`${LIGNES}${id}/terminer_traitement/`, body, { params: withSiteId() }),
  ];
  let lastErr;
  for (const run of attempts) {
    try {
      const r = await run();
      return r.data;
    } catch (e) {
      lastErr = e;
      const st = e?.response?.status;
      if (st === 404 || st === 405) continue;
      throw e;
    }
  }
  throw lastErr ?? new Error('Route terminer traitement introuvable.');
}

function assertSmsVeilleOk(data) {
  if (data == null || typeof data !== 'object') return data;
  if (data.sent === false) {
    throw new Error(data.detail != null ? String(data.detail) : 'Envoi SMS veille refusé.');
  }
  return data;
}

/** POST veille (alias backend) */
export async function notifierVeilleListeSurveillanceSpeciale(listeId) {
  const id = listeId;
  const attempts = [
    () => axiosInstance.post(`${LISTES}${id}/notifier_veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${LISTES}${id}/sms_veille/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${LISTES}${id}/send_sms_veille/`, {}, { params: withSiteId() }),
  ];
  let lastErr;
  for (const run of attempts) {
    try {
      const r = await run();
      return assertSmsVeilleOk(r?.data ?? r);
    } catch (e) {
      if (e instanceof Error && e.message && !e.response) throw e;
      lastErr = e;
      const st = e?.response?.status;
      if (st === 404 || st === 405) continue;
      throw e;
    }
  }
  throw lastErr ?? new Error('SMS veille : aucune route valide.');
}

/** POST …/lignes-surveillance-speciale/{id}/notifier-jour-j/ */
export async function notifierJourJLigneSurveillanceSpeciale(ligneId) {
  const id = ligneId;
  const attempts = [
    () => axiosInstance.post(`${LIGNES}${id}/notifier-jour-j/`, {}, { params: withSiteId() }),
    () => axiosInstance.post(`${LIGNES}${id}/notifier_jour_j/`, {}, { params: withSiteId() }),
  ];
  let lastErr;
  for (const run of attempts) {
    try {
      const r = await run();
      const data = r?.data ?? r;
      if (data && typeof data === 'object' && data.sent === false) {
        throw new Error(data.detail != null ? String(data.detail) : 'SMS jour J refusé.');
      }
      return data;
    } catch (e) {
      if (e instanceof Error && e.message && !e.response) throw e;
      lastErr = e;
      const st = e?.response?.status;
      if (st === 404 || st === 405) continue;
      throw e;
    }
  }
  throw lastErr ?? new Error('SMS jour J : route introuvable.');
}
