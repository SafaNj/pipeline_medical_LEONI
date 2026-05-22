// src/api/actInfirmierApi.js
import axiosInstance from './axios';
import { getUserSiteId } from '../utils/siteAccessControl';

const isFallbackStatus = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405;
};

async function with404Fallback(requests) {
  let lastError;
  for (let i = 0; i < requests.length; i += 1) {
    try {
      return await requests[i]();
    } catch (error) {
      lastError = error;
      if (!isFallbackStatus(error) || i === requests.length - 1) {
        throw error;
      }
    }
  }
  throw lastError;
}

// GET /api/act-infirmier/listes/
// Le backend filtre automatiquement date=today
export const getListesDuJour = async () => {
  const siteId = getUserSiteId();
  const response = await axiosInstance.get('/act-infirmier/listes/', {
    params: siteId !== null ? { site_id: siteId } : undefined,
  });
  return response.data;
};

// POST /api/act-infirmier/listes/
// payload : { date, session, type_liste }
export const creerListe = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/listes/', payload);
  return response.data;
};

// GET /api/act-infirmier/listes/{id}/
// Retourne la liste + items[] (ListePassageDetailSerializer)
export const getListeDetail = async (id) => {
  const response = await axiosInstance.get(`/act-infirmier/listes/${id}/`);
  return response.data;
};

// PATCH /api/act-infirmier/listes/{id}/activer/
// EN_PREPARATION → ACTIVE
export const activerListe = async (id) => {
  const response = await axiosInstance.patch(`/act-infirmier/listes/${id}/activer/`);
  return response.data;
};

// POST /api/act-infirmier/items/{id}/notifier/
export const notifierItem = async (id) => {
  const response = await with404Fallback([
    () => axiosInstance.post(`/act-infirmier/items/${id}/notifier/`),
    () => axiosInstance.post(`/planning/items/${id}/notifier/`),
  ]);
  return response.data;
};

// PATCH /api/act-infirmier/listes/{id}/terminer/
// ACTIVE → TERMINEE
export const terminerListe = async (id) => {
  const response = await axiosInstance.patch(`/act-infirmier/listes/${id}/terminer/`);
  return response.data;
};

// POST /api/act-infirmier/listes/{id}/ajouter_item/
// payload : { collaborateur: <id>, motif: <string|null> }
// Le backend injecte liste=id et calcule ordre automatiquement
export const ajouterItem = async (listeId, payload) => {
  const response = await axiosInstance.post(
    `/act-infirmier/listes/${listeId}/ajouter_item/`,
    payload
  );
  return response.data;
};

// GET /api/act-infirmier/listes/dashboard/
// Retourne : { total_listes, total_items_en_attente, total_effectues, total_annules }
export const getDashboardStats = async () => {
  const siteId = getUserSiteId();
  const response = await axiosInstance.get('/act-infirmier/listes/dashboard/', {
    params: siteId !== null ? { site_id: siteId } : undefined,
  });
  return response.data;
};

// GET /api/act-infirmier/listes/medecins_disponibles/?type_liste=CONSULTATION|CONTRE_VISITE
// Retourne : [{ id, nom_complet, username, specialite, med_type }]
export const getMedecinsDisponibles = async (typeListe, siteId) => {
  const resolvedSiteId = siteId ?? getUserSiteId();
  const params = { type_liste: typeListe };
  if (resolvedSiteId !== null && resolvedSiteId !== undefined && String(resolvedSiteId).trim() !== '') {
    params.site_id = resolvedSiteId;
  }

  const response = await axiosInstance.get('/act-infirmier/listes/medecins_disponibles/', {
    params,
  });
  return response.data;
};

// GET /api/planning/listes/archives/?mois=3&annee=2026
// Retourne toutes les listes d'un mois donné avec leurs items
export const getArchivesVisites = async (mois, annee) => {
  const siteId = getUserSiteId();
  const response = await axiosInstance.get('/planning/listes/archives/', {
    params: {
      mois,
      annee,
      ...(siteId !== null ? { site_id: siteId } : {}),
    },
  });
  return Array.isArray(response.data) ? response.data : (response.data.results || []);
};


// ─── ACCIDENT DE TRAVAIL ──────────────────────────────────────────────────────

// GET /api/act-infirmier/accidents/
export const getAccidents = async () => {
  const siteId = getUserSiteId();
  const response = await axiosInstance.get('/act-infirmier/accidents/', {
    params: siteId !== null ? { site_id: siteId } : undefined,
  });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// GET /api/act-infirmier/accidents/by_collaborateur/?collaborateur_id=<id>
export const getAccidentsByCollaborateur = async (collaborateurId) => {
  const siteId = getUserSiteId();
  const params = { collaborateur_id: collaborateurId };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    params.site_id = siteId;
  }
  const response = await axiosInstance.get('/act-infirmier/accidents/by_collaborateur/', {
    params,
  });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/accidents/
export const creerAccident = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/accidents/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/accidents/<id>/
export const modifierAccident = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/accidents/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/accidents/<id>/
export const supprimerAccident = async (id) => {
  await axiosInstance.delete(`/act-infirmier/accidents/${id}/`);
};

// GET /api/act-infirmier/accidents/stats/?annee=2026
export const getStatsAccidents = async (annee) => {
  const siteId = getUserSiteId();
  const response = await axiosInstance.get('/act-infirmier/accidents/stats/', {
    params: {
      annee,
      ...(siteId !== null ? { site_id: siteId } : {}),
    },
  });
  return response.data;
};


// ─── MALADIE PROFESSIONNELLE ──────────────────────────────────────────────────

// GET /api/act-infirmier/maladies-professionnelles/
export const getMaladies = async () => {
  const siteId = getUserSiteId();
  const response = await axiosInstance.get('/act-infirmier/maladies-professionnelles/', {
    params: siteId !== null ? { site_id: siteId } : undefined,
  });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// GET /api/act-infirmier/maladies-professionnelles/by_collaborateur/?collaborateur_id=<id>
export const getMaladiesByCollaborateur = async (collaborateurId) => {
  const siteId = getUserSiteId();
  const params = { collaborateur_id: collaborateurId };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    params.site_id = siteId;
  }
  const response = await axiosInstance.get('/act-infirmier/maladies-professionnelles/by_collaborateur/', {
    params,
  });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/maladies-professionnelles/
export const creerMaladie = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/maladies-professionnelles/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/maladies-professionnelles/<id>/
export const modifierMaladie = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/maladies-professionnelles/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/maladies-professionnelles/<id>/
export const supprimerMaladie = async (id) => {
  await axiosInstance.delete(`/act-infirmier/maladies-professionnelles/${id}/`);
};

// GET /api/act-infirmier/maladies-professionnelles/stats/?annee=2026
export const getStatsMaladies = async (annee) => {
  const siteId = getUserSiteId();
  const response = await axiosInstance.get('/act-infirmier/maladies-professionnelles/stats/', {
    params: {
      annee,
      ...(siteId !== null ? { site_id: siteId } : {}),
    },
  });
  return response.data;
};


// ─── COLLABORATEURS (recherche autocomplete) ──────────────────────────────────

// GET /api/employees/collaborateurs/?search=<q>
export const searchCollaborateurs = async (q) => {
  const response = await axiosInstance.get('/employees/collaborateurs/', {
    params: q ? { search: q } : {},
  });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// GET /api/employees/collaborateurs/<id>/
export const getCollaborateurById = async (id) => {
  const response = await axiosInstance.get(`/employees/collaborateurs/${id}/`);
  return response.data;
};

// ─── INCIDENTS SANS BON ───────────────────────────────────────────────────────

// GET /api/act-infirmier/incidents-sans-bon/
export const getIncidentsSansBon = async () => {
  const response = await axiosInstance.get('/act-infirmier/incidents-sans-bon/');
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/incidents-sans-bon/
export const creerIncidentSansBon = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/incidents-sans-bon/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/incidents-sans-bon/<id>/
export const modifierIncidentSansBon = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/incidents-sans-bon/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/incidents-sans-bon/<id>/
export const supprimerIncidentSansBon = async (id) => {
  await axiosInstance.delete(`/act-infirmier/incidents-sans-bon/${id}/`);
};

// GET /api/act-infirmier/incidents-sans-bon/stats/?annee=2026
export const getStatsIncidentsSansBon = async (annee) => {
  const response = await axiosInstance.get('/act-infirmier/incidents-sans-bon/stats/', {
    params: { annee },
  });
  return response.data;
};


// ─── INCIDENTS AVEC BON ───────────────────────────────────────────────────────

// GET /api/act-infirmier/incidents-avec-bon/
export const getIncidentsAvecBon = async () => {
  const response = await axiosInstance.get('/act-infirmier/incidents-avec-bon/');
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/incidents-avec-bon/
export const creerIncidentAvecBon = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/incidents-avec-bon/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/incidents-avec-bon/<id>/
export const modifierIncidentAvecBon = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/incidents-avec-bon/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/incidents-avec-bon/<id>/
export const supprimerIncidentAvecBon = async (id) => {
  await axiosInstance.delete(`/act-infirmier/incidents-avec-bon/${id}/`);
};

// GET /api/act-infirmier/incidents-avec-bon/stats/?annee=2026
export const getStatsIncidentsAvecBon = async (annee) => {
  const response = await axiosInstance.get('/act-infirmier/incidents-avec-bon/stats/', {
    params: { annee },
  });
  return response.data;
};





// ─── DECLARATIONS CNAM ───────────────────────────────────────────────────────

// GET /api/act-infirmier/declarations-cnam/
export const getDeclarationsCNAM = async () => {
  const response = await axiosInstance.get('/act-infirmier/declarations-cnam/');
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/declarations-cnam/
export const creerDeclarationCNAM = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/declarations-cnam/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/declarations-cnam/<id>/
export const modifierDeclarationCNAM = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/declarations-cnam/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/declarations-cnam/<id>/
export const supprimerDeclarationCNAM = async (id) => {
  await axiosInstance.delete(`/act-infirmier/declarations-cnam/${id}/`);
};

// GET /api/act-infirmier/declarations-cnam/stats/?annee=2026
export const getStatsDeclarationsCNAM = async (annee) => {
  const response = await axiosInstance.get('/act-infirmier/declarations-cnam/stats/', {
    params: { annee },
  });
  return response.data;
};

// GET /api/act-infirmier/declarations-cnam/en_retard/
export const getDeclarationsEnRetard = async () => {
  const response = await axiosInstance.get('/act-infirmier/declarations-cnam/en_retard/');
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};



// ─── MÉDECINS (liste pour dropdown) ──────────────────────────────────────────

// GET /api/account/medecins/
export const getMedecins = async () => {
const response = await axiosInstance.get('/act-infirmier/pointages-medecins/medecins_liste/');
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};


// ─── POINTAGES MÉDECINS ───────────────────────────────────────────────────────

// GET /api/act-infirmier/pointages-medecins/
export const getPointagesMedecins = async () => {
  const response = await axiosInstance.get('/act-infirmier/pointages-medecins/');
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// GET /api/act-infirmier/pointages-medecins/by_mois/?mois=1&annee=2026
// medecinId est optionnel
export const getPointagesByMois = async (mois, annee, medecinId = null) => {
  const params = { mois, annee };
  if (medecinId) params.medecin_id = medecinId;
  const response = await axiosInstance.get('/act-infirmier/pointages-medecins/by_mois/', { params });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// GET /api/act-infirmier/pointages-medecins/resume_mensuel/?mois=1&annee=2026
// Retourne { mois, annee, medecins: [ { medecin_id, medecin_nom, total_heures, jours_presence[], jours_absence[] } ] }
export const getResumeMensuel = async (mois, annee) => {
  const response = await axiosInstance.get('/act-infirmier/pointages-medecins/resume_mensuel/', {
    params: { mois, annee },
  });
  return response.data;
};

// POST /api/act-infirmier/pointages-medecins/
export const creerPointage = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/pointages-medecins/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/pointages-medecins/<id>/
export const modifierPointage = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/pointages-medecins/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/pointages-medecins/<id>/
export const supprimerPointage = async (id) => {
  await axiosInstance.delete(`/act-infirmier/pointages-medecins/${id}/`);
};


// ─── ABSENCES MÉDECINS ────────────────────────────────────────────────────────

// GET /api/act-infirmier/absences-medecins/by_mois/?mois=1&annee=2026
// medecinId est optionnel
export const getAbsencesByMois = async (mois, annee, medecinId = null) => {
  const params = { mois, annee };
  if (medecinId) params.medecin_id = medecinId;
  const response = await axiosInstance.get('/act-infirmier/absences-medecins/by_mois/', { params });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/absences-medecins/
export const creerAbsence = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/absences-medecins/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/absences-medecins/<id>/
export const modifierAbsence = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/absences-medecins/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/absences-medecins/<id>/
export const supprimerAbsence = async (id) => {
  await axiosInstance.delete(`/act-infirmier/absences-medecins/${id}/`);
};
// ─── TRANSFERT URGENCE ────────────────────────────────────────
// telephone_chauffeur sur le transfert ; sms_chauffeur_envoye renvoyé après traitement serveur.
// Envoi SMS chauffeur : typiquement après POST ordres-transport (lié au transfert), ou PATCH transfert si numéro ajouté tard.
// Ne pas confondre `telephone` (patient) et `telephone_chauffeur`.

export const getTransfertsUrgence = async () => {
  const response = await axiosInstance.get('/act-infirmier/transferts-urgence/');
  return response.data?.results ?? response.data ?? [];
};

export const creerTransfertUrgence = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/transferts-urgence/', payload);
  return response.data;
};

export const modifierTransfertUrgence = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/transferts-urgence/${id}/`, payload);
  return response.data;
};

export const supprimerTransfertUrgence = async (id) => {
  await axiosInstance.delete(`/act-infirmier/transferts-urgence/${id}/`);
};

export const getStatsTransfertsUrgence = async (annee) => {
  const response = await axiosInstance.get('/act-infirmier/transferts-urgence/stats/', {
    params: { annee }
  });
  return response.data;
};

// ─── ORDRE TRANSPORT ─────────────────────────────────────────

export const getOrdresTransport = async () => {
  const response = await axiosInstance.get('/act-infirmier/ordres-transport/');
  return response.data?.results ?? response.data ?? [];
};

export const creerOrdreTransport = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/ordres-transport/', payload);
  return response.data;
};

export const modifierOrdreTransport = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/ordres-transport/${id}/`, payload);
  return response.data;
};

export const supprimerOrdreTransport = async (id) => {
  await axiosInstance.delete(`/act-infirmier/ordres-transport/${id}/`);
};

// ─── ENQUÊTE ACCIDENT ────────────────────────────────────────
// Payload : telephone_victime, appartenance, horaire_travail, circonstances, lieu_transport, temoins (JSON)

export const getEnquete = async (accidentId) => {
  const response = await axiosInstance.get(`/act-infirmier/accidents/${accidentId}/enquete/`);
  return response.data;
};

// Export Excel des pointages médecins
export const exportPointageMedecins = async (mois, annee) => {
  const params = {};
  if (mois) params.mois = mois;
  if (annee) params.annee = annee;
  const response = await axiosInstance.get('/act-infirmier/pointages-medecins/export/', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const creerEnquete = async (accidentId, payload) => {
  const response = await axiosInstance.post(
    `/act-infirmier/accidents/${accidentId}/enquete/`,
    payload
  );
  return response.data;
};

export const modifierEnquete = async (accidentId, payload) => {
  const response = await axiosInstance.patch(
    `/act-infirmier/accidents/${accidentId}/enquete/`,
    payload
  );
  return response.data;
};
// ─────────────────────────────────────────────────────────────────────────────
// AJOUTS À COLLER À LA FIN DE src/api/actInfirmierApi.js
// ─────────────────────────────────────────────────────────────────────────────


// ─── MALADIES CHRONIQUES ──────────────────────────────────────────────────────

// GET /api/act-infirmier/maladies-chroniques/
export const getMaladiesChroniques = async (filters = {}) => {
  const response = await axiosInstance.get('/act-infirmier/maladies-chroniques/', {
    params: filters,
  });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/maladies-chroniques/
// payload : { collaborateur, date_declaration, type_maladie, type_maladie_autre?, commentaire? }
export const creerMaladieChronique = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/maladies-chroniques/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/maladies-chroniques/<id>/
export const modifierMaladieChronique = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/maladies-chroniques/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/maladies-chroniques/<id>/
export const supprimerMaladieChronique = async (id) => {
  await axiosInstance.delete(`/act-infirmier/maladies-chroniques/${id}/`);
};


// ─── RDV PSYCHOLOGUE ──────────────────────────────────────────────────────────

// GET /api/act-infirmier/rdv-psychologue/
export const getRdvPsychologue = async (filters = {}) => {
  const response = await axiosInstance.get('/act-infirmier/rdv-psychologue/', {
    params: filters,
  });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/rdv-psychologue/
// payload : { collaborateur, date_rdv }
// Les autres champs (segment, service, position, site, superieur_hierarchique, num_tel)
// sont auto-remplis par le backend depuis le collaborateur.
export const creerRdvPsychologue = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/rdv-psychologue/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/rdv-psychologue/<id>/
export const modifierRdvPsychologue = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/rdv-psychologue/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/rdv-psychologue/<id>/
export const supprimerRdvPsychologue = async (id) => {
  await axiosInstance.delete(`/act-infirmier/rdv-psychologue/${id}/`);
};


// ─── RDV SAGE-FEMME ───────────────────────────────────────────────────────────

// GET /api/act-infirmier/rdv-sagefemme/
export const getRdvSagefemme = async (filters = {}) => {
  const response = await axiosInstance.get('/act-infirmier/rdv-sagefemme/', {
    params: filters,
  });
  return Array.isArray(response.data) ? response.data : (response.data.results ?? []);
};

// POST /api/act-infirmier/rdv-sagefemme/
// payload : { collaborateur, date_rdv, commentaire? }
export const creerRdvSagefemme = async (payload) => {
  const response = await axiosInstance.post('/act-infirmier/rdv-sagefemme/', payload);
  return response.data;
};

// PATCH /api/act-infirmier/rdv-sagefemme/<id>/
export const modifierRdvSagefemme = async (id, payload) => {
  const response = await axiosInstance.patch(`/act-infirmier/rdv-sagefemme/${id}/`, payload);
  return response.data;
};

// DELETE /api/act-infirmier/rdv-sagefemme/<id>/
export const supprimerRdvSagefemme = async (id) => {
  await axiosInstance.delete(`/act-infirmier/rdv-sagefemme/${id}/`);
};