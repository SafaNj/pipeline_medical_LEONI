// src/api/embaucheApi.js
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

// ─── LISTES ──────────────────────────────────────────────────────────────────
/** @param {{ archived?: boolean }} [opts] — archived=true : listes archivées (statut ARCHIVEE) côté backend */
export const getListes = async (opts = {}) => {
  const params = withSiteId();
  if (opts.archived) params.archived = true;
  const r = await axiosInstance.get('/embauche/listes/', { params });
  return Array.isArray(r.data) ? r.data : (r.data.results ?? []);
};

/** RH : archiver une liste clôturée → statut ARCHIVEE */
export const archiverListe = async (id) => {
  const r = await axiosInstance.patch(`/embauche/listes/${id}/archiver/`);
  return r.data;
};
export const getListeDetail = async (id) => {
  const r = await axiosInstance.get(`/embauche/listes/${id}/`);
  return r.data;
};
// Documents/feedback médecin destinés à la RH (fiche aptitude + examens + bilans)
export const getDocumentsMedecin = async (listeId) => {
  try {
    const r = await axiosInstance.get('/embauche/candidats/documents_medecin/', {
      params: withSiteId({ liste_id: listeId }),
    });
    return r.data;
  } catch (e) {
    if (e?.response?.status !== 404) throw e;
    const r2 = await axiosInstance.get(`/embauche/listes/${listeId}/feedback_rh/`);
    return r2.data;
  }
};
export const creerListe = async (payload) => {
  const r = await axiosInstance.post('/embauche/listes/', payload);
  return r.data;
};
export const deleteListe = async (id) => {
  await axiosInstance.delete(`/embauche/listes/${id}/`);
};
export const soumettreListe = async (id) => {
  const r = await axiosInstance.patch(`/embauche/listes/${id}/soumettre/`);
  return r.data;
};
export const exportListe = async (id) => {
  const r = await axiosInstance.get(`/embauche/listes/${id}/export/`, { responseType: 'blob' });
  return r;
};

// ─── UPLOAD EXCEL ────────────────────────────────────────────────────────────
//
// IMPORTANT — comportement backend :
//   POST /embauche/listes/upload/          → crée une ListeEmbauche en BD, retourne liste_id
//   POST /embauche/listes/upload/confirmer/ → EFFACE TOUS les candidats existants puis recrée
//
// Ne jamais appeler uploadExcelConfirmer pour un ajout unitaire !
//

export const uploadExcelPreview = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const r = await axiosInstance.post('/embauche/listes/upload/', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return r.data; // { liste_id, apercu, erreurs, date_visite }
};

// Utilisé UNIQUEMENT pour confirmer un import Excel complet (liste déjà créée)
export const uploadExcelConfirmer = async (listeId, apercu) => {
  const r = await axiosInstance.post('/embauche/listes/upload/confirmer/', {
    liste_id: listeId,
    apercu,
  });
  return r.data;
};

export const updateDateVisite = async (listeId, dateVisite) => {
  const r = await axiosInstance.patch(`/embauche/listes/${listeId}/`, { date_visite: dateVisite });
  return r.data;
};

// Saisie manuelle : créer liste VIDE puis ajouter candidats un par un
export const creerListeManuelle = async (dateVisite, candidats) => {
  let liste = null;
  try {
    liste = await creerListe({ date_visite: dateVisite });
    // Ajouter chaque candidat individuellement via POST /candidats/
    for (const c of candidats) {
      await ajouterCandidatAPI({ ...c, liste_id: liste.id });
    }
    return liste;
  } catch (err) {
    if (liste?.id) {
      try { await deleteListe(liste.id); } catch { /* silent */ }
    }
    throw err;
  }
};

// ─── CANDIDATS ───────────────────────────────────────────────────────────────

export const getCandidats = async (listeId) => {
  const r = await axiosInstance.get('/embauche/candidats/', { params: withSiteId({ liste: listeId }) });
  return Array.isArray(r.data) ? r.data : (r.data.results ?? []);
};

// Ajouter UN candidat sans toucher aux autres
// Utilise POST /embauche/candidats/ avec liste_id dans le body
export const ajouterCandidatAPI = async (payload) => {
  // payload doit contenir liste_id, nom, prenom, matricule, ...
  const r = await axiosInstance.post('/embauche/candidats/', payload);
  return r.data;
};

// Modifier un candidat existant
export const modifierCandidatAPI = async (candidatId, payload) => {
  const r = await axiosInstance.patch(`/embauche/candidats/${candidatId}/`, payload);
  return r.data;
};

// Supprimer un candidat (liste doit être BROUILLON)
export const supprimerCandidatAPI = async (candidatId) => {
  await axiosInstance.delete(`/embauche/candidats/${candidatId}/`);

};

// Mettre à jour la présence d'un candidat (PRESENT ou ABSENT)
export const setPresenceCandidatAPI = async (candidatId, presence) => {
  const r = await axiosInstance.patch(`/embauche/candidats/${candidatId}/presence/`, { presence });
  return r.data;
};

export const creerCollaborateur = async (candidatId) => {
  const r = await axiosInstance.post(`/embauche/candidats/${candidatId}/creer_collaborateur/`);
  return r.data;
};
export const changerStatutIntegration = async (candidatId, statut) => {
  const r = await axiosInstance.patch(
    `/embauche/candidats/${candidatId}/changer_statut_integration/`,
    { statut_integration: statut }
  );
  return r.data;
};
export const syncDepuisIM = async (candidatId) => {
  const r = await axiosInstance.post(`/embauche/candidats/${candidatId}/sync_depuis_im/`);
  return r.data;
};

// ─── RECHERCHE IM (nouveau) ───────────────────────────────────────────────────
// GET /embauche/candidats/recherche_im/?matricule=XXX (puis fallback employees/collaborateurs)
// Le backend filtre im_db.resource par le site du compte (403 sans site, 404 si hors périmètre).
// Retourne { data: {...}, warning: string|null }
const pickFirst = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
};

const toIsoDate = (value) => {
  if (!value) return '';
  const s = String(value).trim();
  // already ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
};

const normalizeImData = (raw) => {
  const d = raw || {};
  return {
    ...d,
    nom: pickFirst(d, ['nom', 'lastname', 'last_name']),
    prenom: pickFirst(d, ['prenom', 'firstname', 'first_name']),
    cin: pickFirst(d, ['cin', 'num_cin']),
    date_naissance: toIsoDate(pickFirst(d, ['date_naissance', 'date_naiss', 'dn', 'birth_date'])),
    genre: pickFirst(d, ['genre', 'sexe', 'gender']),
    sexe: pickFirst(d, ['sexe', 'genre', 'gender']),
    telephone: pickFirst(d, ['telephone', 'tel', 'phone']),
    gouvernorat: pickFirst(d, ['gouvernorat', 'gouvernerat', 'adr_gouv']),
    poste: pickFirst(d, ['poste', 'fonction', 'job_title']),
    department: pickFirst(d, ['department', 'departement', 'service']),
    projet: pickFirst(d, ['projet', 'project']),
    date_embauche: toIsoDate(pickFirst(d, ['date_embauche', 'date_recrutement', 'hiring_date'])),
    centre_cout: pickFirst(d, ['centre_cout', 'cost_center']),
    niveau: pickFirst(d, ['niveau', 'level']),
    formation: pickFirst(d, ['formation', 'education']),
    num_demande: pickFirst(d, ['num_demande', 'numero_demande', 'request_number']),
    cnss: pickFirst(d, ['cnss', 'numero_cnss', 'num_cnss', 'n_cnss', 'no_cnss']),
    ps: pickFirst(d, ['ps']),
    source_information: pickFirst(d, ['source_information', 'source']),
    site: pickFirst(d, ['site']),
  };
};

export const rechercheIM = async (matricule) => {
  const params = { matricule };
  const normalize = (payload) => ({
    data: normalizeImData(payload?.data ?? payload ?? {}),
    warning: payload?.warning ?? null,
  });
  try {
    const r = await axiosInstance.get('/embauche/candidats/recherche_im/', { params });
    return normalize(r.data);
  } catch (e) {
    const st = e?.response?.status;
    // Pas de fallback : compte sans site ou refus explicite
    if (st === 403 || st === 401) throw e;
    if (st !== 404) throw e;
    try {
      const r2 = await axiosInstance.get('/employees/collaborateurs/recherche_im/', { params });
      return normalize(r2.data);
    } catch (e2) {
      throw e2;
    }
  }
};

// ─── MÉDECINS DU TRAVAIL ─────────────────────────────────────────────────────
export const getMedecinsTravail = async () => {
  const r = await axiosInstance.get('/embauche/listes/medecins_travail/', {
    params: withSiteId(),
  });
  return Array.isArray(r.data) ? r.data : [];
};

// Assigner médecin — par l'INFIRMIER uniquement
export const assignerMedecin = async (listeId, medecinId) => {
  const r = await axiosInstance.patch(`/embauche/listes/${listeId}/assigner_medecin/`, {
    medecin: medecinId,
  });
  return r.data;
};

/**
 * Le backend exige souvent EN_TRAITEMENT avant PATCH …/cloturer/.
 * Essaie plusieurs conventions DRF courantes ; 404/405 → route suivante.
 * Si aucune route ne répond, relance la dernière erreur (ex. 403).
 */
export async function tryPasserListeEmbaucheEnTraitement(listeId) {
  const id = listeId;
  if (id == null || id === '') throw new Error('Identifiant de liste manquant.');

  const attempts = [
    () => axiosInstance.post(`/embauche/listes/${id}/demarrer_traitement/`, {}),
    () => axiosInstance.patch(`/embauche/listes/${id}/demarrer_traitement/`, {}),
    () => axiosInstance.post(`/embauche/listes/${id}/en_traitement/`, {}),
    () => axiosInstance.patch(`/embauche/listes/${id}/passer_en_traitement/`, {}),
    () => axiosInstance.patch(`/embauche/listes/${id}/`, { statut: 'EN_TRAITEMENT' }),
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
  if (lastErr) throw lastErr;
  return null;
}

// ─── SMS EMBAUCHE (veille liste, jour J candidat) — aligné sur visites périodiques ─────────────

/** @param {object} data Réponse JSON typique { sent, detail?, sms_count? } */
function assertSmsVeilleEmbaucheOk(data) {
  if (data == null || typeof data !== 'object') return data;
  if (data.sent === false) {
    const d = data.detail != null ? String(data.detail) : 'Envoi SMS veille refusé.';
    throw new Error(d);
  }
  return data;
}

/**
 * POST /embauche/listes/{id}/notifier_veille/ (ou variantes sms_veille, send_sms_veille).
 * @returns {Promise<{ sent?: boolean, detail?: string, sms_count?: number }>}
 */
export async function notifierSmsVeilleListeEmbauche(listeId) {
  const id = listeId;
  if (id == null || id === '') throw new Error('Identifiant de liste manquant.');

  const attempts = [
    () => axiosInstance.post(`/embauche/listes/${id}/notifier_veille/`, {}),
    () => axiosInstance.post(`/embauche/listes/${id}/sms_veille/`, {}),
    () => axiosInstance.post(`/embauche/listes/${id}/send_sms_veille/`, {}),
    () => axiosInstance.post(`/embauche/listes/${id}/rappel_veille/`, {}),
    () => axiosInstance.patch(`/embauche/listes/${id}/notifier_veille/`, {}),
  ];

  let lastErr;
  for (const run of attempts) {
    try {
      const r = await run();
      return assertSmsVeilleEmbaucheOk(r?.data ?? r);
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

/**
 * POST /embauche/candidats/{id}/notifier-jour-j/ — renvoi manuel SMS jour J (file).
 * @returns {Promise<object>}
 */
export async function notifierSmsJourJCandidatEmbauche(candidatId) {
  const id = candidatId;
  if (id == null || id === '') throw new Error('Identifiant candidat manquant.');

  const attempts = [
    () => axiosInstance.post(`/embauche/candidats/${id}/notifier-jour-j/`, {}),
    () => axiosInstance.post(`/embauche/candidats/${id}/notifier_jour_j/`, {}),
  ];

  let lastErr;
  for (const run of attempts) {
    try {
      const r = await run();
      const data = r?.data ?? r;
      if (data && typeof data === 'object' && data.sent === false) {
        throw new Error(data.detail != null ? String(data.detail) : 'Envoi SMS jour J refusé.');
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
  throw lastErr ?? new Error('Route SMS jour J embauche introuvable.');
}