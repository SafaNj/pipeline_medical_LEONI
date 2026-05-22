// src/api/consultationsApi.js
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

// ─── LISTES DU JOUR ───────────────────────────────────────────────
export const getMesListesDuJour = async () => {
  const res = await axiosInstance.get('/consultations/consultations/mes_listes_du_jour/', {
    params: withSiteId(),
  });
  return res.data;
};

// ─── CONSULTATIONS ────────────────────────────────────────────────
export const creerConsultation = async (payload) => {
  const res = await axiosInstance.post('/consultations/consultations/', payload);
  return res.data;
};

export const updateConsultation = async (id, payload) => {
  const res = await axiosInstance.patch(`/consultations/consultations/${id}/`, payload);
  return res.data;
};

export const getMesConsultations = async () => {
  const res = await axiosInstance.get('/consultations/consultations/mes_consultations/', {
    params: withSiteId(),
  });
  return res.data;
};

export const getConsultationsByCollaborateur = async (collaborateurId) => {
  const res = await axiosInstance.get('/consultations/consultations/by_collaborateur/', {
    params: { collaborateur_id: collaborateurId },
  });
  return res.data;
};

// ─── ORDONNANCES ──────────────────────────────────────────────────
export const creerOrdonnance = async (payload) => {
  const res = await axiosInstance.post('/consultations/ordonnances/', payload);
  return res.data;
};

export const updateOrdonnance = async (id, payload) => {
  const res = await axiosInstance.patch(`/consultations/ordonnances/${id}/`, payload);
  return res.data;
};

// ─── MÉDICAMENTS — autocomplete catalogue stock ────────────────────
// GET /stock/medicaments/?search=<q>  (+ site_id comme getMedicaments dans stockApi)
export const suggestMedicaments = async (q) => {
  const search = String(q || '').trim();
  if (!search) return [];
  const res = await axiosInstance.get('/stock/medicaments/', {
    params: withSiteId({ search }),
  });
  const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
  // Normalise vers { medicament_id, texte, nom, dosage, unite, stock_info }
  return list.map((m) => ({
    medicament_id: m.id ?? m.pk,
    texte: [m.nom, m.dosage].filter(Boolean).join(' '),
    nom: m.nom,
    dosage: m.dosage || '',
    unite: m.stock_info?.unite || m.unite || '',
    stock_info: m.stock_info || null,
  }));
};

// ─── POSOLOGIES — suggestions dynamiques ──────────────────────────
/**
 * GET /consultations/posologies/suggest/?medicament_id=<id>&q=<texte>
 * Paramètres optionnels (opts) : { collaborateur_id } — filtre historique patient si le backend le supporte.
 *
 * Retourne (fusionné) :
 *   1. Historique du médecin connecté pour ce médicament (triées par fréquence)
 *   2. Posologies standard si historique < 5 résultats
 *
 * Chaque item : { texte, source: "historique"|"standard", count }
 */
const POSOLOGIE_FALLBACK = [
  '1 comprimé matin, midi et soir pendant 7 jours',
  '1 comprimé 3 fois par jour après les repas',
  '1 comprimé matin et soir pendant 14 jours',
  '1 comprimé le matin à jeun',
  '1 comprimé au coucher',
  '2 comprimés par jour',
  'Au besoin, maximum 3 par jour',
  '1 sachet matin et soir',
  'Appliquer en couche fine 2 fois par jour',
];

function normalizePosologieRow(row) {
  const texte = String(row?.texte ?? row?.posologie ?? row?.label ?? '').trim();
  if (!texte) return null;
  const source = row?.source === 'historique' ? 'historique' : 'standard';
  const count = row?.count ?? row?.nb ?? undefined;
  return { texte, posologie: texte, source, count };
}

function filterPosologieFallback(q) {
  const needle = String(q || '').trim().toLowerCase();
  const list = needle
    ? POSOLOGIE_FALLBACK.filter((t) => t.toLowerCase().includes(needle))
    : POSOLOGIE_FALLBACK;
  return list.map((texte) => ({
    texte,
    posologie: texte,
    source: 'standard',
  }));
}

export const suggestPosologies = async (medicamentId, q = '', opts = {}) => {
  const mid =
    medicamentId != null && medicamentId !== ''
      ? Number(medicamentId)
      : NaN;
  if (!Number.isFinite(mid)) return filterPosologieFallback(q);

  const qTrim = String(q || '').trim();
  const params = withSiteId({ medicament_id: mid, q: qTrim });
  if (opts.collaborateur_id != null && opts.collaborateur_id !== '') {
    params.collaborateur_id = opts.collaborateur_id;
  }
  try {
    const res = await axiosInstance.get('/consultations/posologies/suggest/', {
      params,
    });
    const raw = Array.isArray(res.data)
      ? res.data
      : res.data?.results ?? res.data?.suggestions ?? [];
    const mapped = raw.map(normalizePosologieRow).filter(Boolean);
    if (mapped.length > 0) return mapped;
  } catch {
    /* endpoint absent ou erreur serveur : suggestions locales */
  }
  return filterPosologieFallback(q);
};

// ─── LIGNES ORDONNANCE ────────────────────────────────────────────
export const creerLigneOrdonnance = async (data) => {
  const res = await axiosInstance.post('/consultations/lignes/', data);
  return res.data;
};

export const updateLigneOrdonnance = async (id, payload) => {
  const res = await axiosInstance.patch(`/consultations/lignes/${id}/`, payload);
  return res.data;
};

export const supprimerLigneOrdonnance_byId = async (id) => {
  await axiosInstance.delete(`/consultations/lignes/${id}/`);
};

// GET /consultations/lignes/?statut=EN_ATTENTE
// Toutes les lignes en attente (vue infirmière)
export const getLignesEnAttente = async () => {
  try {
    const res = await axiosInstance.get('/consultations/lignes/', {
      params: { statut: 'EN_ATTENTE' },
    });
    const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
    return list;
  } catch (error) {
    // Sur certains backends, le filtre `statut=EN_ATTENTE` renvoie 500.
    // Fallback: charger toutes les lignes puis filtrer côté frontend.
    const status = error?.response?.status;
    if (status !== 500) throw error;

    const res = await axiosInstance.get('/consultations/lignes/');
    const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
    return list.filter((line) => String(line?.statut || '').toUpperCase() === 'EN_ATTENTE');
  }
};

// POST /consultations/lignes/<id>/donner/
// Dispenser un médicament (décrément stock)
export const donnerLigneOrdonnance = async (ligneId, quantite) => {
  const res = await axiosInstance.post(`/consultations/lignes/${ligneId}/donner/`, { quantite });
  return res.data;
};

// POST /consultations/lignes/<id>/ignorer/
// Ignorer une ligne (médicament absent du stock)
export const ignorerLigneOrdonnance = async (ligneId) => {
  const res = await axiosInstance.post(`/consultations/lignes/${ligneId}/ignorer/`);
  return res.data;
};

export const supprimerOrdonnance = async (id) => {
  await axiosInstance.delete(`/consultations/ordonnances/${id}/`);
};

// ─── CERTIFICATS ──────────────────────────────────────────────────
export const creerCertificat = async (payload) => {
  const res = await axiosInstance.post('/consultations/certificats/', payload);
  return res.data;
};

export const updateCertificat = async (id, payload) => {
  const res = await axiosInstance.patch(`/consultations/certificats/${id}/`, payload);
  return res.data;
};

export const supprimerCertificat = async (id) => {
  await axiosInstance.delete(`/consultations/certificats/${id}/`);
};

// ─── CERTIFICAT BONNE SANTE ──────────────────────────────────────
export const creerCertificatBonneSante = async (payload) => {
  const res = await axiosInstance.post('/consultations/certificats-bonne-sante/', payload);
  return res.data;
};

export const updateCertificatBonneSante = async (id, payload) => {
  const res = await axiosInstance.patch(`/consultations/certificats-bonne-sante/${id}/`, payload);
  return res.data;
};

export const getCertificatsBonneSanteByConsultation = async (consultationId) => {
  const res = await axiosInstance.get('/consultations/certificats-bonne-sante/by_consultation/', {
    params: { consultation_id: consultationId },
  });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const supprimerCertificatBonneSante = async (id) => {
  await axiosInstance.delete(`/consultations/certificats-bonne-sante/${id}/`);
};

// ─── CERTIFICAT EXEMPTION ────────────────────────────────────────
export const creerCertificatExemption = async (payload) => {
  const res = await axiosInstance.post('/consultations/certificats-exemption/', payload);
  return res.data;
};

export const updateCertificatExemption = async (id, payload) => {
  const res = await axiosInstance.patch(`/consultations/certificats-exemption/${id}/`, payload);
  return res.data;
};

export const getCertificatsExemptionByConsultation = async (consultationId) => {
  const res = await axiosInstance.get('/consultations/certificats-exemption/by_consultation/', {
    params: { consultation_id: consultationId },
  });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const supprimerCertificatExemption = async (id) => {
  await axiosInstance.delete(`/consultations/certificats-exemption/${id}/`);
};

// ─── CERTIFICAT PERMIS ───────────────────────────────────────────
export const creerCertificatPermis = async (payload) => {
  const res = await axiosInstance.post('/consultations/certificats-permis/', payload);
  return res.data;
};

export const updateCertificatPermis = async (id, payload) => {
  const res = await axiosInstance.patch(`/consultations/certificats-permis/${id}/`, payload);
  return res.data;
};

export const getCertificatsPermisByConsultation = async (consultationId) => {
  const res = await axiosInstance.get('/consultations/certificats-permis/by_consultation/', {
    params: { consultation_id: consultationId },
  });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const supprimerCertificatPermis = async (id) => {
  await axiosInstance.delete(`/consultations/certificats-permis/${id}/`);
};

// ─── CERTIFICAT PRENUPTIAL ───────────────────────────────────────
const extractErrorKeys = (error) => {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  return Object.keys(data);
};

const toAdressePayload = (payload) => {
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'numero_adresse_medecin')) return payload;
  const next = {
    ...payload,
    adresse_medecin: payload.numero_adresse_medecin,
  };
  delete next.numero_adresse_medecin;
  return next;
};

const toNumeroAdressePayload = (payload) => {
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'adresse_medecin')) return payload;
  const next = {
    ...payload,
    numero_adresse_medecin: payload.adresse_medecin,
  };
  delete next.adresse_medecin;
  return next;
};

const withLieuSignatureFallback = (payload) => {
  if (!payload) return payload;
  if (payload.lieu_signature) return payload;
  if (!payload.ville_medecin) return payload;
  return {
    ...payload,
    lieu_signature: payload.ville_medecin,
  };
};

const stripAutoReadonlyFields = (payload) => {
  if (!payload) return payload;
  const next = { ...payload };
  delete next.nom_prenom;
  delete next.nom_prenom_medecin;
  delete next.date_naissance;
  delete next.lieu_naissance;
  delete next.cin;
  delete next.adresse_patient;
  delete next.date_emission;
  return next;
};

const postOrPatchPrenuptial = async (method, url, payload) => {
  const send = (body) => (method === 'post'
    ? axiosInstance.post(url, body)
    : axiosInstance.patch(url, body));

  try {
    const res = await send(payload);
    return res.data;
  } catch (error1) {
    if (error1?.response?.status !== 400) throw error1;

    const keys1 = extractErrorKeys(error1);
    let retryPayload = payload;

    if (keys1.includes('adresse_medecin')) {
      retryPayload = toAdressePayload(payload);
    } else if (keys1.includes('numero_adresse_medecin')) {
      retryPayload = toNumeroAdressePayload(payload);
    } else if (Object.prototype.hasOwnProperty.call(payload || {}, 'numero_adresse_medecin')) {
      retryPayload = toAdressePayload(payload);
    }

    retryPayload = withLieuSignatureFallback(retryPayload);

    try {
      const res2 = await send(retryPayload);
      return res2.data;
    } catch (error2) {
      if (error2?.response?.status !== 400) throw error2;

      const keys2 = extractErrorKeys(error2);
      let finalPayload = retryPayload;

      if (keys2.includes('adresse_medecin')) {
        finalPayload = toAdressePayload(retryPayload);
      } else if (keys2.includes('numero_adresse_medecin')) {
        finalPayload = toNumeroAdressePayload(retryPayload);
      }

      finalPayload = withLieuSignatureFallback(finalPayload);
      finalPayload = stripAutoReadonlyFields(finalPayload);

      const res3 = await send(finalPayload);
      return res3.data;
    }
  }
};

export const creerCertificatPrenuptial = async (payload) => {
  const res = await axiosInstance.post('/consultations/certificats-prenuptial/', payload);
  return res.data;
};

export const updateCertificatPrenuptial = async (id, payload) => {
  return postOrPatchPrenuptial('patch', `/consultations/certificats-prenuptial/${id}/`, payload);
};

export const getCertificatsPrenuptialByConsultation = async (consultationId) => {
  const res = await axiosInstance.get('/consultations/certificats-prenuptial/by_consultation/', {
    params: { consultation_id: consultationId },
  });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const supprimerCertificatPrenuptial = async (id) => {
  await axiosInstance.delete(`/consultations/certificats-prenuptial/${id}/`);
};

// ─── CERTIFICAT APTITUDE GENERALE ───────────────────────────────
export const creerCertificatAptitudeGenerale = async (payload) => {
  const res = await axiosInstance.post('/consultations/certificats-aptitude-generale/', payload);
  return res.data;
};

export const updateCertificatAptitudeGenerale = async (id, payload) => {
  const res = await axiosInstance.patch(`/consultations/certificats-aptitude-generale/${id}/`, payload);
  return res.data;
};

export const getCertificatsAptitudeGeneraleByConsultation = async (consultationId) => {
  const res = await axiosInstance.get('/consultations/certificats-aptitude-generale/by_consultation/', {
    params: { consultation_id: consultationId },
  });
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const supprimerCertificatAptitudeGenerale = async (id) => {
  await axiosInstance.delete(`/consultations/certificats-aptitude-generale/${id}/`);
};

// ─── RECHERCHE COLLABORATEURS ─────────────────────────────────────
export const searchCollaborateurs = async (search = '') => {
  const params = {};
  if (search.trim()) params.search = search.trim();
  const res = await axiosInstance.get('/employees/collaborateurs/', { params });
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
};