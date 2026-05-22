// src/api/medicalWorkApi.js
import axiosInstance from './axios';
import { VP_ALERT_HORIZON_JOURS_DEFAULT } from '../constants/vpAlertsRh';
import { getUserSiteId, resolveSiteIdForApiParams } from '../utils/siteAccessControl';
import { filterVpCollaborateurAlertsPayload, shouldHideSansVisitePeriodiqueRow } from '../utils/vpAlertsRhFilter';

function cleanParams(params) {
  const src = params || {};
  const out = {};
  Object.keys(src).forEach((k) => {
    const v = src[k];
    if (v === null || v === undefined || v === '') return;
    out[k] = v;
  });
  return out;
}

function withSiteId(params = {}) {
  const out = cleanParams(params);
  const resolved = resolveSiteIdForApiParams(out);
  if (resolved !== null && resolved !== undefined && String(resolved).trim() !== '') {
    out.site_id = resolved;
  }
  return out;
}

/* ─────────────────────────────────────────
   COLLABORATEURS (employees)
   Base : /api/employees/collaborateurs/
───────────────────────────────────────── */

export const searchCollaborateurs = async (search = '', filters = {}) => {
  const r = await axiosInstance.get('/employees/collaborateurs/', {
    params: withSiteId({ search: search.trim(), ...(filters || {}) }),
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

export const getCollaborateur = async (id) => {
  const r = await axiosInstance.get(`/employees/collaborateurs/${id}/`);
  return r.data;
};

export const getCollaborateursStats = async () => {
  const r = await axiosInstance.get('/employees/collaborateurs/stats/');
  return r.data;
};

/* ─────────────────────────────────────────
   FICHES D'APTITUDE
   Base : /api/medical-work/fiches-aptitude/
───────────────────────────────────────── */

export const getFichesAptitude = async (filters = {}) => {
  const { page: _dropPage, ...rest } = filters || {};
  const requestedPs = rest.page_size != null && rest.page_size !== '' ? Number(rest.page_size) : NaN;
  const pageSize = Number.isFinite(requestedPs)
    ? Math.min(Math.max(requestedPs, 50), 500)
    : 200;
  const baseParams = withSiteId({ ...rest, page_size: pageSize });
  const all = [];
  let page = 1;
  for (;;) {
    const r = await axiosInstance.get('/medical-work/fiches-aptitude/', {
      params: { ...baseParams, page },
    });
    const body = r.data;
    const chunk = Array.isArray(body) ? body : (body?.results ?? []);
    all.push(...chunk);
    const hasNext = Boolean(!Array.isArray(body) && body && typeof body === 'object' && body.next);
    if (!hasNext || chunk.length === 0) break;
    page += 1;
    if (page > 100) break;
  }
  return all;
};

export const getFicheAptitude = async (id) => {
  const r = await axiosInstance.get(`/medical-work/fiches-aptitude/${id}/`);
  return r.data;
};

// Créer une fiche d'aptitude (consultation normale OU embauche)
// Pour embauche : collaborateur = null, la fiche sera rattachée au candidat
export const creerFicheAptitude = async (data) => {
  const r = await axiosInstance.post('/medical-work/fiches-aptitude/', data);
  return r.data;
};

export const modifierFicheAptitude = async (id, data) => {
  const r = await axiosInstance.put(`/medical-work/fiches-aptitude/${id}/`, data);
  return r.data;
};

/** Mise à jour partielle (ex. observations complémentaires) — PATCH DRF */
export const patchFicheAptitude = async (id, data) => {
  const r = await axiosInstance.patch(`/medical-work/fiches-aptitude/${id}/`, data);
  return r.data;
};

export const supprimerFicheAptitude = async (id) => {
  await axiosInstance.delete(`/medical-work/fiches-aptitude/${id}/`);
};

export const getFichesParCollaborateur = async (collaborateurId) => {
  const r = await axiosInstance.get('/medical-work/fiches-aptitude/by_collaborateur/', {
    params: { collaborateur_id: collaborateurId },
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

export const getFichesParMatricule = async (matricule) => {
  const r = await axiosInstance.get('/medical-work/fiches-aptitude/by_matricule/', {
    params: { matricule },
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

// Liste réservée infirmier : uniquement fiches avec collaborateur réel (non embauche en cours)
export const getFichesAptitudeInfirmier = async () => {
  const r = await axiosInstance.get('/medical-work/fiches-aptitude/infirmier_list/', {
    params: withSiteId(),
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

// Sauvegarder remarque + ré-évaluation infirmier en base de données
// PATCH /api/medical-work/fiches-aptitude/{id}/sauvegarder_remarque/
export const sauvegarderRemarqueInfirmier = async (ficheId, { remarque, reevaluation }) => {
  const r = await axiosInstance.patch(
    `/medical-work/fiches-aptitude/${ficheId}/sauvegarder_remarque/`,
    { remarque, reevaluation }
  );
  return r.data;
};

/* ─────────────────────────────────────────
   DEMANDES DE BILAN
   Base : /api/medical-work/demandes-bilan/
───────────────────────────────────────── */

export const creerDemandeBilan = async (data) => {
  const r = await axiosInstance.post('/medical-work/demandes-bilan/', data);
  return r.data;
};
export const creerDemandeBilanDepuisEmbauche = async (payload) => {
  const r = await axiosInstance.post('/medical-work/demandes-bilan/depuis_embauche/', payload);
  return r.data;
};

export const modifierDemandeBilan = async (id, data) => {
  const r = await axiosInstance.put(`/medical-work/demandes-bilan/${id}/`, data);
  return r.data;
};

export const supprimerDemandeBilan = async (id) => {
  await axiosInstance.delete(`/medical-work/demandes-bilan/${id}/`);
};

export const getBilansParFiche = async (ficheId) => {
  const r = await axiosInstance.get('/medical-work/demandes-bilan/by_fiche/', {
    params: { fiche_id: ficheId },
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

export const getDemandeBilan = async (id) => {
  const r = await axiosInstance.get(`/medical-work/demandes-bilan/${id}/`);
  return r.data;
};

/* ─────────────────────────────────────────
   DEMANDES D'EXAMEN
   Base : /api/medical-work/demandes-examen/
───────────────────────────────────────── */

export const creerDemandeExamen = async (data) => {
  const r = await axiosInstance.post('/medical-work/demandes-examen/', data);
  return r.data;
};
export const creerDemandeExamenDepuisEmbauche = async (payload) => {
  const r = await axiosInstance.post('/medical-work/demandes-examen/depuis_embauche/', payload);
  return r.data;
};

export const modifierDemandeExamen = async (id, data) => {
  const r = await axiosInstance.put(`/medical-work/demandes-examen/${id}/`, data);
  return r.data;
};

export const supprimerDemandeExamen = async (id) => {
  await axiosInstance.delete(`/medical-work/demandes-examen/${id}/`);
};

export const getExamensParFiche = async (ficheId) => {
  const r = await axiosInstance.get('/medical-work/demandes-examen/by_fiche/', {
    params: { fiche_id: ficheId },
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

export const getDemandeExamen = async (id) => {
  const r = await axiosInstance.get(`/medical-work/demandes-examen/${id}/`);
  return r.data;
};

/* ─────────────────────────────────────────
   ORDONNANCES
   Base : /api/medical-work/ordonnances/
───────────────────────────────────────── */

export const creerOrdonnance = async (data) => {
  const r = await axiosInstance.post('/medical-work/ordonnances/', data);
  return r.data;
};

export const modifierOrdonnance = async (id, data) => {
  const r = await axiosInstance.put(`/medical-work/ordonnances/${id}/`, data);
  return r.data;
};

export const getOrdonnancesParFiche = async (ficheId) => {
  const r = await axiosInstance.get('/medical-work/ordonnances/by_fiche/', {
    params: { fiche_id: ficheId },
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

export const supprimerOrdonnance = async (id) => {
  await axiosInstance.delete(`/medical-work/ordonnances/${id}/`);
};

/* ─────────────────────────────────────────
   FICHES DE LIAISON
   Base : /api/medical-work/fiches-liaison/
───────────────────────────────────────── */

export const creerFicheLiaison = async (data) => {
  const r = await axiosInstance.post('/medical-work/fiches-liaison/', data);
  return r.data;
};

export const modifierFicheLiaison = async (id, data) => {
  const r = await axiosInstance.put(`/medical-work/fiches-liaison/${id}/`, data);
  return r.data;
};

export const getFichesLiaisonParFiche = async (ficheId) => {
  const r = await axiosInstance.get('/medical-work/fiches-liaison/by_fiche/', {
    params: { fiche_id: ficheId },
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

export const supprimerFicheLiaison = async (id) => {
  await axiosInstance.delete(`/medical-work/fiches-liaison/${id}/`);
};

/* ─────────────────────────────────────────
   CERTIFICATS D'APTITUDE
   Base : /api/medical-work/certificats/
───────────────────────────────────────── */

export const creerCertificat = async (data) => {
  const r = await axiosInstance.post('/medical-work/certificats/', data);
  return r.data;
};

export const modifierCertificat = async (id, data) => {
  const r = await axiosInstance.put(`/medical-work/certificats/${id}/`, data);
  return r.data;
};

export const getCertificatParFiche = async (ficheId) => {
  const r = await axiosInstance.get('/medical-work/certificats/by_fiche/', {
    params: { fiche_id: ficheId },
  });
  return Array.isArray(r.data) ? r.data : (r.data.results || []);
};

/* ─────────────────────────────────────────
   VISITES D'EMBAUCHE (médecin du travail)
   Endpoints embauche utilisés par le médecin
───────────────────────────────────────── */

// Listes d'embauche assignées au médecin connecté
// GET /api/embauche/listes/soumises/
export const getListesEmbaucheAssignees = async () => {
  const attempts = [
    () => axiosInstance.get('/embauche/listes/soumises/', { params: withSiteId() }),
    () => axiosInstance.get('/embauche/listes/soumises/', { params: withSiteId({ pour_medecin: true }) }),
    () => axiosInstance.get('/embauche/listes/', { params: withSiteId({ pour_medecin: true }) }),
  ];

  let lastError;
  for (const run of attempts) {
    try {
      const r = await run();
      return Array.isArray(r.data) ? r.data : (r.data.results ?? []);
    } catch (e) {
      lastError = e;
      const status = e?.response?.status;
      if (status === 404 || status === 405) continue;
      throw e;
    }
  }

  if (lastError) throw lastError;
  return [];
};

// Tous les candidats d'une liste spécifique
// GET /api/embauche/candidats/?liste={id}
export const getCandidatsEmbauche = async (listeId) => {
  const r = await axiosInstance.get('/embauche/candidats/', {
    params: { liste: listeId },
  });
  return Array.isArray(r.data) ? r.data : (r.data.results ?? []);
};

// Candidats présents sans fiche d'aptitude (à examiner)
// GET /api/embauche/candidats/a_examiner/
export const getCandidatsAExaminer = async (filters = {}) => {
  const r = await axiosInstance.get('/embauche/candidats/a_examiner/', {
    params: withSiteId(filters),
  });
  return Array.isArray(r.data) ? r.data : (r.data.results ?? []);
};

// Chercher un dossier médical existant par matricule
// Le backend by_matricule gère les sources: dossier / im_db / embauche
export const getDossierByMatricule = async (matricule) => {
  const m = String(matricule || '').trim();
  if (!m) return null;
  try {
    const r = await axiosInstance.get('/medical-records/dossiers/by_matricule/', {
      params: { matricule: m },
    });
    return r?.data ?? null;
  } catch {
    return null;
  }
};

export const getFichesFeedbackRh = async (listeId) => {
  const r = await axiosInstance.get('/medical-work/fiches-aptitude/feedback_rh/', {
    params: withSiteId({ liste_id: listeId }),
  });
  return r.data;
};
export const getExamensFeedbackRh = async (listeId) => {
  const r = await axiosInstance.get('/medical-work/demandes-examen/feedback_rh/', {
    params: withSiteId({ liste_id: listeId }),
  });
  return r.data;
};
export const getBilansFeedbackRh = async (listeId) => {
  const r = await axiosInstance.get('/medical-work/demandes-bilan/feedback_rh/', {
    params: withSiteId({ liste_id: listeId }),
  });
  return r.data;
};

// Créer un dossier médical pour un candidat embauche
// POST /api/medical-records/dossiers/
// Note : collaborateur = null au moment de l'embauche
export const creerDossierMedical = async (payload) => {
  const r = await axiosInstance.post('/medical-records/dossiers/', payload);
  return r.data;
};

// Mettre à jour un dossier médical existant
// PATCH /api/medical-records/dossiers/{id}/
export const modifierDossierMedical = async (id, payload) => {
  const r = await axiosInstance.patch(`/medical-records/dossiers/${id}/`, payload);
  return r.data;
};

// Rattacher la fiche d'aptitude au candidat embauche
// PATCH /api/embauche/candidats/{id}/rattacher_fiche/
export const rattacherFicheAuCandidat = async (candidatId, ficheId) => {
  const r = await axiosInstance.patch(
    `/embauche/candidats/${candidatId}/rattacher_fiche/`,
    { fiche_aptitude: ficheId }
  );
  return r.data;
};

// Ajouter des observations médecin sur un candidat
// PATCH /api/embauche/candidats/{id}/observations/
export const ajouterObservationsCandidat = async (candidatId, observations) => {
  const r = await axiosInstance.patch(
    `/embauche/candidats/${candidatId}/observations/`,
    { observations_medecin: observations }
  );
  return r.data;
};

// ─── ALERTE VISITES PÉRIODIQUES ─────────────────────────────
/** @param {{ horizon_jours?: number }} [opts] — même logique que les alertes RH (défaut 30 j.). */
export const getCollaborateursSansVisitePeriodique = async (opts = {}) => {
  const hz = opts.horizon_jours ?? VP_ALERT_HORIZON_JOURS_DEFAULT;
  const r = await axiosInstance.get('/medical-work/fiches-aptitude/sans_visite_periodique/', {
    params: withSiteId({ horizon_jours: hz }),
  });
  const raw = Array.isArray(r.data) ? r.data : [];
  return raw.filter((row) => !shouldHideSansVisitePeriodiqueRow(row));
};

// ─── ALERTES RH collaborateurs (VP à planifier, horizon glissant) ───────────
// GET /medical-work/fiches-aptitude/alertes-visite-periodique-rh/?horizon_jours=…
function coercePositiveInt(v, fallback) {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return fallback;
}

function coerceHorizonJours(d) {
  if (!d || typeof d !== 'object') return undefined;
  const raw = d.horizon_jours ?? d.horizonJours;
  const n = coercePositiveInt(raw, NaN);
  return Number.isFinite(n) ? n : undefined;
}

/** Anticipation réelle sur l’échéance (ex. plafonnée à 90 j. côté calcul VP). */
function coerceAnticipationEcheanceUtiliseeJours(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = [
    'anticipation_echeance_utilisee_jours',
    'anticipationEcheanceUtiliseeJours',
    'anticipation_echeance_jours',
  ];
  for (const k of keys) {
    if (!(k in obj)) continue;
    const n = coercePositiveInt(/** @type {unknown} */ (obj[k]), NaN);
    if (Number.isFinite(n)) return Math.min(n, 3660);
  }
  return undefined;
}

/** Tableau de lignes « alerte » plausible : objets avec au moins un signal métier. */
function looksLikeVpAlertRow(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  const x = /** @type {Record<string, unknown>} */ (o);
  if (x.collaborateur_id != null || x.collaborateur != null || x.fiche != null || x.fiche_aptitude != null) return true;
  if (x.matricule != null || x.collaborateur_matricule != null) return true;
  if (x.collaborateur_nom != null || x.collaborateur_prenom != null || (x.nom != null && x.prenom != null)) return true;
  if (x.echeance != null || x.date_echeance != null || x.jours_avant_echeance != null) return true;
  return false;
}

/**
 * Si le JSON imbrique les lignes sous une forme non standard, prendre le plus grand tableau d’objets « ligne ».
 */
function harvestVpAlertRowsDeep(root, maxDepth = 5) {
  /** @type {unknown[][]} */
  const candidates = [];
  const walk = (node, depth) => {
    if (depth > maxDepth || node == null) return;
    if (Array.isArray(node)) {
      if (!node.length) return;
      if (!node.every((x) => typeof x === 'object' && x !== null && !Array.isArray(x))) return;
      const hits = node.filter(looksLikeVpAlertRow);
      if (hits.length > 0) candidates.push(hits.length === node.length ? node : hits);
      return;
    }
    if (typeof node !== 'object') return;
    for (const k of Object.keys(node)) {
      walk(/** @type {Record<string, unknown>} */ (node)[k], depth + 1);
    }
  };
  walk(root, 0);
  if (!candidates.length) return [];
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

/** @param {unknown} data — corps JSON : { count, results, horizon_jours, anticipation_echeance_utilisee_jours } (+ variantes) */
function normalizeVpAlertsCollaborateursPayload(data) {
  if (data == null) {
    return { count: 0, results: [], horizon_jours: undefined, anticipation_echeance_utilisee_jours: undefined };
  }
  if (Array.isArray(data)) {
    return { count: data.length, results: data, horizon_jours: undefined, anticipation_echeance_utilisee_jours: undefined };
  }
  if (typeof data !== 'object') {
    return { count: 0, results: [], horizon_jours: undefined, anticipation_echeance_utilisee_jours: undefined };
  }

  let obj = /** @type {Record<string, unknown>} */ (data);
  // { data: [ {...}, ... ] } — tableau directement sous `data`
  if (Array.isArray(obj.data) && obj.data.length > 0) {
    const hzEarly = coerceHorizonJours(obj) ?? coerceHorizonJours(data);
    const antEarly = coerceAnticipationEcheanceUtiliseeJours(obj) ?? coerceAnticipationEcheanceUtiliseeJours(data);
    return {
      count: obj.data.length,
      results: obj.data,
      horizon_jours: hzEarly,
      anticipation_echeance_utilisee_jours: antEarly,
    };
  }

  // Une réponse peut envelopper : { data: { results: [...] } }
  const inner = obj.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const nested = /** @type {Record<string, unknown>} */ (inner);
    if (Array.isArray(nested.results) || nested.count != null || nested.total != null) {
      obj = nested;
    }
  }

  const hz = coerceHorizonJours(obj) ?? coerceHorizonJours(data);
  const anticipation =
    coerceAnticipationEcheanceUtiliseeJours(obj) ?? coerceAnticipationEcheanceUtiliseeJours(data);

  const arrayKeys = [
    'results',
    'result',
    'data',
    'alerts',
    'items',
    'collaborateurs',
    'collaborateurs_en_alerte',
    'collaborateurs_a_planifier',
    'lignes',
    'rows',
    'fiches',
    'fiche_aptitude',
    'alertes',
    'payload',
    'values',
  ];
  let results = [];
  const firstNonEmptyArray = () => {
    for (const k of arrayKeys) {
      const v = obj[k];
      if (Array.isArray(v) && v.length > 0) return v;
    }
    return null;
  };
  /** Ne pas s’arrêter au premier tableau vide (`data: []` avant `collaborateurs: [...]`). */
  const firstArrayPreferNonEmpty = () => {
    let emptyFallback = null;
    for (const k of arrayKeys) {
      const v = obj[k];
      if (!Array.isArray(v)) continue;
      if (v.length > 0) return v;
      if (emptyFallback === null) emptyFallback = v;
    }
    return emptyFallback ?? [];
  };
  results = firstNonEmptyArray() || firstArrayPreferNonEmpty();
  // Objet dict id → ligne (certains serializers)
  if (results.length === 0 && obj.results && typeof obj.results === 'object' && !Array.isArray(obj.results)) {
    results = Object.values(obj.results);
  }

  if (results.length === 0) {
    const harvested = harvestVpAlertRowsDeep(data);
    if (harvested.length > 0) results = harvested;
  }

  const apiCountRaw =
    obj.count !== undefined && obj.count !== null
      ? obj.count
      : obj.total !== undefined && obj.total !== null
        ? obj.total
        : undefined;
  let count = coercePositiveInt(apiCountRaw, results.length);
  // Évite count: 0 du backend alors que results est rempli (pagination / bug JSON)
  if (results.length > 0) {
    count = Math.max(count, results.length);
  }

  const plafondRaw =
    obj.anticipation_echeance_plafond_jours ??
    obj.anticipationEcheancePlafondJours ??
    data?.anticipation_echeance_plafond_jours;
  const plafond =
    plafondRaw != null && String(plafondRaw).trim() !== ''
      ? coercePositiveInt(plafondRaw, NaN)
      : undefined;

  const fenetreDescription =
    typeof obj.fenetre_description === 'string' && obj.fenetre_description.trim()
      ? obj.fenetre_description.trim()
      : typeof obj.fenetreDescription === 'string' && obj.fenetreDescription.trim()
        ? obj.fenetreDescription.trim()
        : typeof data?.fenetre_description === 'string'
          ? data.fenetre_description.trim()
          : undefined;

  const perimetreRh =
    typeof obj.perimetre_rh === 'string' && obj.perimetre_rh.trim()
      ? obj.perimetre_rh.trim()
      : typeof obj.perimetreRh === 'string' && obj.perimetreRh.trim()
        ? obj.perimetreRh.trim()
        : typeof data?.perimetre_rh === 'string'
          ? data.perimetre_rh.trim()
          : undefined;

  const rawSegments = obj.segments ?? obj.segment_codes ?? obj.segmentCodes;
  const segments = Array.isArray(rawSegments)
    ? rawSegments.map((x) => String(x ?? '').trim()).filter((s) => s.length > 0)
    : [];

  return {
    count,
    results,
    horizon_jours: hz,
    anticipation_echeance_utilisee_jours: anticipation,
    ...(Number.isFinite(plafond) ? { anticipation_echeance_plafond_jours: plafond } : {}),
    ...(fenetreDescription ? { fenetre_description: fenetreDescription } : {}),
    ...(perimetreRh ? { perimetre_rh: perimetreRh } : {}),
    ...(segments.length > 0 ? { segments } : {}),
  };
}

/**
 * Alertes collaborateurs VP à planifier (RH).
 * @param {{ horizon_jours?: number, page_size?: number }} [opts] — `horizon_jours` obligatoire pour la plupart des backends (fenêtre glissante).
 */
export const fetchVpAlertsRh = async (opts = {}) => {
  const hzRequested =
    opts.horizon_jours != null && opts.horizon_jours !== ''
      ? coercePositiveInt(opts.horizon_jours, VP_ALERT_HORIZON_JOURS_DEFAULT)
      : VP_ALERT_HORIZON_JOURS_DEFAULT;
  const horizon_jours =
    Number.isFinite(hzRequested) && hzRequested > 0 ? hzRequested : VP_ALERT_HORIZON_JOURS_DEFAULT;

  const psRequested =
    opts.page_size != null && opts.page_size !== ''
      ? coercePositiveInt(opts.page_size, 500)
      : 500;
  const page_size = Number.isFinite(psRequested) && psRequested > 0 ? psRequested : 500;

  const basePath = '/medical-work/fiches-aptitude/alertes-visite-periodique-rh/';
  const paramsFirst = withSiteId({ horizon_jours, page_size });

  /** Agrège les pages DRF (`next`) si le backend pagine les alertes. */
  let accumulatedResults = [];
  /** Dernière page normalisée (méta) ; les lignes viennent toujours de `accumulatedResults`. */
  let lastNorm = null;
  let firstRawBody = null;
  let nextUrl = null;
  let guard = 0;
  while (guard < 80) {
    guard += 1;
    const r = nextUrl
      ? await axiosInstance.get(nextUrl)
      : await axiosInstance.get(basePath, { params: paramsFirst });
    const body = r?.data;
    if (firstRawBody == null) firstRawBody = body;
    const norm = normalizeVpAlertsCollaborateursPayload(body);
    lastNorm = norm;
    const chunk = Array.isArray(norm.results) ? norm.results : [];
    accumulatedResults = accumulatedResults.concat(chunk);

    const rawNext = body && typeof body === 'object' ? body.next : null;
    if (!rawNext || typeof rawNext !== 'string' || String(rawNext).trim() === '') break;
    nextUrl = String(rawNext).trim();
    if (!chunk.length && accumulatedResults.length === 0 && guard > 1) break;
  }

  const normalized = {
    ...(lastNorm ?? normalizeVpAlertsCollaborateursPayload(null)),
    results: accumulatedResults,
    count: Math.max(
      coercePositiveInt(lastNorm?.count, accumulatedResults.length),
      accumulatedResults.length,
    ),
  };

  const normalizedHorizon = {
    ...normalized,
    horizon_jours: normalized.horizon_jours ?? horizon_jours,
  };
  const filtered = filterVpCollaborateurAlertsPayload(normalizedHorizon);
  if (import.meta.env.DEV) {
    const sid = getUserSiteId();
    const dbg = {
      site_id: sid ?? '(aucun)',
      horizon_jours,
      brut_api: normalized.count,
      apres_filtre_client: filtered.count,
    };
    if (!normalized.count && !filtered.count) {
      const raw = firstRawBody;
      dbg.response_keys =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? Object.keys(raw)
          : typeof raw;
      dbg.response_preview =
        raw && typeof raw === 'object' ? JSON.stringify(raw).slice(0, 320) : String(raw ?? '').slice(0, 120);
    }
    console.info('[VP Alertes RH] GET /medical-work/fiches-aptitude/alertes-visite-periodique-rh/', dbg);
  }
  return filtered;
};