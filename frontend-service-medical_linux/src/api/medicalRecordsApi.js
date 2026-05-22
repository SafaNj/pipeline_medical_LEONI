// src/api/medicalRecordsApi.js
import axiosInstance from './axios';
import { getUserSiteId } from '../utils/siteAccessControl';

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
  const siteId = getUserSiteId();
  const out = cleanParams(params);
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    out.site_id = siteId;
  }
  return out;
}

// ─── GET /api/medical-records/dossiers/ ──────────────────────────
export const getDossiers = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/medical-records/dossiers/', {
      params: withSiteId(filters),
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    if (error?.response?.status === 500) {
      return [];
    }
    throw error;
  }
};

// ─── GET /api/medical-records/dossiers/<id>/ ─────────────────────
export const getDossier = async (id) => {
  const response = await axiosInstance.get(`/medical-records/dossiers/${id}/`);
  return response.data;
};

// ─── GET /api/medical-records/dossiers/by_collaborateur/?collaborateur_id=X
function extractList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return data ? [data] : [];
}

function hasMedicalShape(dossier) {
  if (!dossier || typeof dossier !== 'object') return false;
  const keys = [
    'date_naissance',
    'lieu_naissance',
    'adresse',
    'antecedents_medicaux',
    'antecedents_chirurgicaux',
    'antecedents_gyneco',
    'antecedents_familiaux',
    'vaccin_tuberculose',
    'vaccin_tetanos',
    'vaccin_hepatite',
    'autres_vaccins',
    'allergies',
    'tabac',
    'alcool',
    'automedication',
  ];
  return keys.some((k) => Object.prototype.hasOwnProperty.call(dossier, k));
}

async function hydrateDossierDetails(dossier) {
  if (!dossier || typeof dossier !== 'object') return dossier;
  const idsToTry = [dossier.dossier_id, dossier.medical_record_id, dossier.id]
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '');

  for (const id of idsToTry) {
    try {
      const detailed = await getDossier(id);
      if (detailed && typeof detailed === 'object') {
        return { ...dossier, ...detailed };
      }
    } catch {
      // ignore and try next candidate id
    }
  }
  return dossier;
}

function matchesCollaborateur(dossier, collaborateurId, matricule) {
  const targetId = String(collaborateurId || '').trim();
  const targetMatricule = String(matricule || '').trim();

  const ids = [
    dossier?.id,
    dossier?.collaborateur,
    dossier?.collaborateur_id,
    dossier?.collaborateur?.id,
    dossier?.dossier_id,
    dossier?.collaborateur_pk,
  ].filter((v) => v !== null && v !== undefined);

  const matricules = [
    dossier?.matricule,
    dossier?.collaborateur_matricule,
    dossier?.collaborateur?.matricule,
    dossier?.collaborateur_detail?.matricule,
  ].filter((v) => v !== null && v !== undefined);

  const idMatch = targetId && ids.some((v) => String(v) === targetId);
  const matriculeMatch = targetMatricule && matricules.some((v) => String(v) === targetMatricule);

  return idMatch || matriculeMatch;
}

function notFoundError() {
  const error = new Error('Dossier introuvable');
  error.response = { status: 404 };
  return error;
}

/**
 * Extrait listes + type d'allergie depuis le corps JSON (dossier médical ou endpoint dédié).
 * Réponses attendues : data.allergies, data.type_allergie (ou typeAllergie).
 * Si la réponse indique explicitement id === null sans contenu → état « aucune enregistrée » (pas une erreur).
 */
export function parseAllergiesApiPayload(data) {
  if (data == null || typeof data !== 'object') {
    return {
      lignes: [],
      typeAllergie: '',
      id: undefined,
      afficherAucuneEnregistree: false,
    };
  }

  const typeAllergie = data.type_allergie ?? data.typeAllergie ?? '';
  const taTrim = String(typeAllergie || '').trim();

  const splitAllergiesField = (raw) => {
    if (raw == null || raw === '') return [];
    if (Array.isArray(raw)) {
      return raw.map((x) => String(x).trim()).filter(Boolean);
    }
    if (typeof raw === 'string') {
      return raw
        .split(/\r?\n|,|;/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof raw === 'object') {
      if (Array.isArray(raw.items)) return splitAllergiesField(raw.items);
      if (Array.isArray(raw.results)) return splitAllergiesField(raw.results);
      if (Array.isArray(raw.allergies)) return splitAllergiesField(raw.allergies);
    }
    return [String(raw).trim()].filter(Boolean);
  };

  let lignes = splitAllergiesField(data.allergies);
  if (taTrim && !lignes.includes(taTrim)) lignes = [...lignes, taTrim];

  const id =
    Object.prototype.hasOwnProperty.call(data, 'id') ? data.id : (data.allergie_id ?? data.allergie_pk ?? undefined);

  const hasContent = lignes.length > 0;
  const explicitNullId = Object.prototype.hasOwnProperty.call(data, 'id') && data.id === null;
  const afficherAucuneEnregistree = explicitNullId && !hasContent;

  return {
    lignes,
    typeAllergie: taTrim,
    id: id !== undefined ? id : null,
    afficherAucuneEnregistree,
  };
}

/**
 * Axios : succès HTTP = status dans [200, 299]. Ensuite parser data (allergies / type_allergie).
 */
export function allergiesDepuisReponseAxiosOk(response) {
  if (!response || typeof response !== 'object') return parseAllergiesApiPayload(null);
  const st = response.status;
  if (typeof st === 'number' && (st < 200 || st >= 300)) {
    return parseAllergiesApiPayload(null);
  }
  return parseAllergiesApiPayload(response.data);
}

/**
 * Après `fetch` : `response.ok` puis corps JSON (data). Équivalent contrôle status 2xx.
 */
export function allergiesDepuisFetchReussie(response, data) {
  if (!response || typeof response !== 'object') return parseAllergiesApiPayload(null);
  if (response.ok === false) return parseAllergiesApiPayload(null);
  if (typeof response.status === 'number' && (response.status < 200 || response.status >= 300)) {
    return parseAllergiesApiPayload(null);
  }
  return parseAllergiesApiPayload(data);
}

export const getDossierByCollaborateur = async (collaborateurId, matricule) => {
  const searchTerm = String(matricule || '').trim();
  const fallbackResponse = await axiosInstance.get('/medical-records/dossiers/', {
    params: withSiteId(searchTerm ? { search: searchTerm } : {}),
  });
  const fallbackList = extractList(fallbackResponse.data);
  const found = fallbackList.find((d) => matchesCollaborateur(d, collaborateurId, matricule));
  if (found) return await hydrateDossierDetails(found);

  // Dernier recours: tentative sur l'endpoint dédié si le backend l'expose.
  try {
    const response = await axiosInstance.get('/medical-records/dossiers/by_collaborateur/', {
      params: cleanParams({ collaborateur_id: collaborateurId, matricule }),
    });
    const primaryList = extractList(response.data);
    const primaryFound = primaryList.find((d) => matchesCollaborateur(d, collaborateurId, matricule));
    if (primaryFound) return await hydrateDossierDetails(primaryFound);
    if (primaryList.length === 1) return await hydrateDossierDetails(primaryList[0]);
  } catch (error) {
    if (error?.response?.status && error.response.status !== 404) throw error;
  }

  throw notFoundError();
};

// ─── GET /api/medical-records/dossiers/by_matricule/?matricule=<MATRICULE> ──
export const getDossierByMatricule = async (matricule) => {
  const m = String(matricule || '').trim();
  if (!m) {
    const e = new Error('Matricule requis');
    e.response = { status: 400 };
    throw e;
  }
  const r = await axiosInstance.get('/medical-records/dossiers/by_matricule/', {
    params: { matricule: m },
  });
  return r.data;
};

// ─── POST /api/medical-records/dossiers/ { matricule_ref } ─────────────────
export const creerDossierDepuisMatricule = async (matricule) => {
  const m = String(matricule || '').trim();
  if (!m) {
    const e = new Error('Matricule requis');
    e.response = { status: 400 };
    throw e;
  }
  const r = await axiosInstance.post('/medical-records/dossiers/', {
    matricule_ref: m,
    // Certains backends utilisent "matricule" au lieu de "matricule_ref"
    matricule: m,
  });
  return r.data;
};

// ─── PATCH /api/medical-records/dossiers/<id>/ ───────────────────
// Note: POST (création) est bloqué par le backend (405).
// Le dossier est auto-créé par signal Django à la création du collaborateur.
// Seul PATCH/PUT est autorisé pour le compléter.
export const patchDossier = async (id, data) => {
  const response = await axiosInstance.patch(`/medical-records/dossiers/${id}/`, data);
  return response.data;
};

// ─── PUT /api/medical-records/dossiers/<id>/ ─────────────────────
export const modifierDossier = async (id, data) => {
  const response = await axiosInstance.put(`/medical-records/dossiers/${id}/`, data);
  return response.data;
};

// ─── GET /api/medical-records/dossiers/?search=xxx ───────────────
// search_fields : nom, prenom, collaborateur__matricule
export const searchDossiers = async (search = '', filters = {}) => {
  try {
    const response = await axiosInstance.get('/medical-records/dossiers/', {
      params: withSiteId({ search: search.trim(), ...(filters || {}) }),
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    if (error?.response?.status === 500) {
      return [];
    }
    throw error;
  }
};