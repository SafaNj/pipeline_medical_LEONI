/**
 * Listes de visites périodiques — flux INDÉPENDANT des listes d'embauche.
 *
 * ─── Contrat backend attendu (Django REST) ─────────────────────────────────
 * Préfixe : /api/medical-work/listes-visites-periodiques/
 *
 * GET    /                           Liste (RH : toutes ou filtrées ; query ?statut=)
 * POST   /                           Créer { date_visite, collaborateur_ids: number[], reference?: string, soumettre?: boolean }
 *                                      — 201 nouvelle liste ; 200 même brouillon (anti-doublon) : les deux sont succès.
 * PATCH  /{id}/                     Mise à jour brouillon (date, lignes) — ne pas refaire POST si id déjà connu.
 * GET    /{id}/                      Détail (+ lignes incluses ou clé "lignes")
 * PATCH  /{id}/soumettre/            RH : passage BROUILLON → SOUMISE (infirmier notifié)
 * PATCH  /{id}/assigner_medecin/     { medecin: number } — même logique qu'embauche
 * PATCH  /{id}/cloturer/             Infirmier : clôture
 * PATCH  /{id}/archiver/             RH : liste clôturée → ARCHIVEE (masquée infirmier / médecin)
 * GET    /soumises/                  File infirmier (équivalent embauche/listes/soumises/)
 * GET    /?pour_medecin=true         Listes assignées au médecin (le client n’appelle pas …/pour_medecin/ si 404).
 *          Serializer VP : flux = "VP", type_liste = "VISITE_PERIODIQUE" (ne pas se fier à type_visite seul).
 *
 * Lignes — le backend peut exposer l’une des formes suivantes (le client essaie dans l’ordre) :
 *   • GET /listes-visites-periodiques/{id}/  avec clé JSON "lignes" | "ligne_set" | "collaborateurs"
 *   • GET /listes-visites-periodiques/{id}/lignes/
 *   • GET /lignes-visites-periodiques/?liste= | ?liste_id= | ?liste_visite_periodique=
 * PATCH  présence / rattacher fiche : souvent sur la même base LIGNES ou nested (adapter côté backend).
 *
 * Modèle suggéré : ListeVisitePeriodique (référence VP-YYYY-NNN, ex. VP-2026-001 — même lisibilité qu'EMB-2026-024),
 * LigneVisitePeriodique (FK liste, FK collaborateur, présence, lien fiche aptitude).
 * Ne pas réutiliser ListeEmbauche / CandidatEmbauche.
 * ───────────────────────────────────────────────────────────────────────────
 */
import axiosInstance from './axios';
import { VP_ALERT_HORIZON_JOURS_DEFAULT } from '../constants/vpAlertsRh';
import { getUserSiteId } from '../utils/siteAccessControl';
import { filterLignesVpPourAffichageMedecin } from '../utils/ligneVisitePeriodique';

const BASE = '/medical-work/listes-visites-periodiques';
const LIGNES = '/medical-work/lignes-visites-periodiques';

const arr = (r) => (Array.isArray(r.data) ? r.data : (r.data?.results ?? []));

/**
 * File infirmier / médecin : ne pas afficher les listes clôturées (RH notifié) ni archivées.
 */
function excludeClotureEtArchivePourPersonnelVp(listes) {
  if (!Array.isArray(listes)) return [];
  return listes.filter((l) => {
    const s = l?.statut;
    return s !== 'ARCHIVEE' && s !== 'CLOTUREE';
  });
}

/**
 * Le GET VP avec `pour_medecin` peut renvoyer des listes « surveillance SMS » (même table polymorphe,
 * référence atypique, ou doublon d’id côté serveur). Elles ont le module `/surveillance-speciale/`.
 * Exportée pour filtrage défensif côté UI (liste du jour médecin ≠ module SMS).
 */
export function isListeSurveillanceSmsDansReponseVp(l) {
  if (!l || typeof l !== 'object') return false;
  const ref = String(l.reference ?? l.ref ?? '').trim();
  const refU = ref.toUpperCase();
  const titreRaw = String(l.titre ?? l.title ?? l.intitule ?? '');
  const titreU = titreRaw.toUpperCase();

  if (/^SMS[-\s_]?/i.test(ref) || /^SMS_/i.test(ref)) return true;
  if (/^SS[-\s_]/i.test(ref) || /^SSM[-\s_]/i.test(ref)) return true;
  if (refU.includes('SURVEILLANCE') && (refU.includes('SPEC') || refU.includes('SPECIAL') || refU.includes('SMS'))) {
    return true;
  }
  if (/\bSMS\b/i.test(ref) || /\bSMS\b/i.test(titreRaw)) return true;

  if (
    titreU.includes('SURVEILLANCE')
    && (titreU.includes('SPEC') || titreU.includes('SPECIALE') || titreU.includes('MÉDICALE') || titreU.includes('MEDICALE'))
  ) return true;
  if (titreU.includes('SURVEILLANCE') && titreU.includes('SMS')) return true;
  if (titreU.includes('SURVEILLANCE') && titreU.includes('MÉDICALE')) return true;

  const tv = String(l.type_visite ?? l.type_visite_liste ?? l.type_liste_visite ?? '').toUpperCase();
  if (tv.includes('SURVEILLANCE')) return true;

  const flags = [
    l.est_surveillance_speciale,
    l.surveillance_speciale,
    l.surveillance_medicale_speciale,
    l.est_liste_sms,
    l.liste_sms,
    l.est_sms,
    l.is_surveillance_speciale,
  ];
  if (flags.some((x) => x === true || x === 'true' || x === 1)) return true;

  const kind = String(l.type_liste ?? l.flux ?? l.origine ?? l.categorie ?? l.canal ?? '').toUpperCase();
  if (kind.includes('SURVEILLANCE') || kind.includes('SMS_SPEC') || kind === 'SMS' || kind.includes('SMS_')) {
    return true;
  }
  const tlListe = String(l.type_liste ?? '').toUpperCase();
  if (
    tlListe.includes('SURVEILLANCE')
    && (tlListe.includes('SPEC') || tlListe.includes('SPECIAL') || tlListe.includes('MEDICALE') || tlListe.includes('MÉDICALE'))
  ) {
    return true;
  }

  if (
    l.liste_surveillance_speciale != null
    || l.liste_surveillance_id != null
    || l.surveillance_liste_id != null
    || l.liste_sms_id != null
  ) {
    return true;
  }

  const model = String(l.__model ?? l.resource_type ?? l.model ?? l.polymorphic_ctype ?? '').toLowerCase();
  if (model.includes('surveillance') && model.includes('spec')) return true;

  return false;
}

/**
 * Liste du jour médecin : ne garder que les vraies listes VP.
 * Backend — chaque liste VP (list + détail) : `flux === "VP"` et `type_liste === "VISITE_PERIODIQUE"`.
 * `type_visite` peut rester « périodique » sur d’autres flux : ne pas l’utiliser comme filtre principal.
 *
 * Rétrocompat : si `flux` et `type_liste` sont absents, on retombe sur l’exclusion heuristique SMS.
 */
export function keepListeVpPourMedecin(l) {
  if (!l || typeof l !== 'object') return false;
  const flux = String(l.flux ?? '').trim().toUpperCase();
  const tl = String(l.type_liste ?? '').trim().toUpperCase();

  if (flux === 'VP' || tl === 'VISITE_PERIODIQUE') {
    return !isListeSurveillanceSmsDansReponseVp(l);
  }
  if (flux && flux !== 'VP') return false;
  if (tl && tl !== 'VISITE_PERIODIQUE') return false;
  return !isListeSurveillanceSmsDansReponseVp(l);
}

/**
 * Si au moins une liste a `flux` ou `type_liste` renseignés, on exige explicitement VP
 * (sinon les entrées SMS sans discriminateur passaient encore le filtre « legacy »).
 */
export function filterListesPourMedecinJour(listes) {
  const arr = Array.isArray(listes) ? listes : [];
  const hasDiscriminator = arr.some(
    (l) => String(l?.flux ?? '').trim() !== '' || String(l?.type_liste ?? '').trim() !== '',
  );
  if (hasDiscriminator) {
    return arr.filter((l) => {
      const flux = String(l?.flux ?? '').trim().toUpperCase();
      const tl = String(l?.type_liste ?? '').trim().toUpperCase();
      const okVp = flux === 'VP' || tl === 'VISITE_PERIODIQUE';
      return okVp && !isListeSurveillanceSmsDansReponseVp(l);
    });
  }
  return arr.filter(keepListeVpPourMedecin);
}

const SMS_LISTES_BASE = '/surveillance-speciale/listes-surveillance-speciale';

function normRefKey(v) {
  if (v == null || v === '') return '';
  return String(v).trim().toUpperCase();
}

/** Si le backend expose les mêmes listes SMS sur les deux endpoints, retirer par id et par référence (ids souvent distincts entre tables). */
async function excludeListesSmsParIdsEndpointDedie(vpListes) {
  if (!Array.isArray(vpListes) || vpListes.length === 0) return vpListes;
  try {
    const { getListesSurveillanceSpeciale } = await import('./surveillanceSpecialeApi');
    const merged = [];
    const paramVariants = [{ page_size: 500 }, { page_size: 500, pour_medecin: true }, {}];
    for (const params of paramVariants) {
      try {
        const sms = await getListesSurveillanceSpeciale(params);
        if (Array.isArray(sms)) merged.push(...sms);
      } catch {
        /* variante query non supportée par le back : ignorer */
      }
    }
    try {
      const r = await axiosInstance.get(`${SMS_LISTES_BASE}/pour_medecin/`, {
        params: withSiteId(),
        validateStatus: (s) => s === 200 || s === 404 || s === 403 || s === 405,
      });
      if (r.status === 200 && r.data != null) {
        const sms = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        if (Array.isArray(sms)) merged.push(...sms);
      }
    } catch {
      /* route optionnelle */
    }
    const ids = new Set();
    const refs = new Set();
    for (const s of merged) {
      if (s == null || typeof s !== 'object') continue;
      const id = s.id;
      if (id != null && id !== '') {
        ids.add(Number(id));
        ids.add(String(id));
      }
      const rk = normRefKey(s.reference ?? s.ref);
      if (rk) refs.add(rk);
    }
    if (ids.size === 0 && refs.size === 0) return vpListes;
    return vpListes.filter((l) => {
      const id = l?.id;
      if (id != null && id !== '' && (ids.has(Number(id)) || ids.has(String(id)))) {
        return false;
      }
      const rk = normRefKey(l?.reference ?? l?.ref);
      if (rk && refs.has(rk)) return false;
      return true;
    });
  } catch {
    return vpListes;
  }
}

/**
 * Retire les entrées qui sont en réalité des listes SMS (API VP polluée), via
 * GET …/listes-surveillance-speciale/existe/?id= (200 + { existe }) — pas de GET détail ni 404 console.
 * Si `flux` / `type_liste` indiquent déjà une liste VP, on n’appelle pas `existe`.
 */
async function excludeListesDontIdEstListeSurveillanceSpeciale(vpListes) {
  if (!Array.isArray(vpListes) || vpListes.length === 0) return vpListes;
  const { getListeSurveillanceSpecialeExiste } = await import('./surveillanceSpecialeApi');
  const CONCURRENCY = 5;
  const kept = [];
  for (let i = 0; i < vpListes.length; i += CONCURRENCY) {
    const slice = vpListes.slice(i, i + CONCURRENCY);
    const rows = await Promise.all(
      slice.map(async (l) => {
        const id = l?.id;
        if (id == null || id === '') return { l, drop: false };
        if (isListeSurveillanceSmsDansReponseVp(l)) return { l, drop: true };
        const flux = String(l.flux ?? '').trim().toUpperCase();
        const tl = String(l.type_liste ?? '').trim().toUpperCase();
        if (flux === 'VP' || tl === 'VISITE_PERIODIQUE') return { l, drop: false };
        try {
          const data = await getListeSurveillanceSpecialeExiste(id);
          if (data?.existe === true) return { l, drop: true };
        } catch {
          /* route absente ou erreur réseau : ne pas masquer la liste VP */
        }
        return { l, drop: false };
      }),
    );
    for (const { l, drop } of rows) {
      if (!drop) kept.push(l);
    }
  }
  return kept;
}

function withSiteId(params = {}) {
  const siteId = getUserSiteId();
  const out = { ...(params || {}) };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    out.site_id = siteId;
  }
  return out;
}

/** Extrait un tableau de lignes depuis la réponse détail d’une liste. */
function pickLignesFromDetail(data) {
  if (!data || typeof data !== 'object') return null;
  const keys = [
    'lignes',
    'ligne_set',
    'lignes_visite_periodique',
    'lignes_visites',
    'collaborateurs',
    'patients',
    'items',
  ];
  for (const k of keys) {
    const v = data[k];
    if (Array.isArray(v)) return v;
  }
  return null;
}

/** @param {{ statut?: string, archived?: boolean, page_size?: number }} [params] — archived=true : listes archivées uniquement (RH). */
export const getListesVisitesPeriodiques = async (params = {}) => {
  const merged = { page_size: 500, ...params };
  const r = await axiosInstance.get(`${BASE}/`, { params: withSiteId(merged) });
  return arr(r);
};

export const getListeVisitePeriodique = async (id) => {
  const r = await axiosInstance.get(`${BASE}/${id}/`);
  return r.data;
};

/**
 * @param {{ date_visite: string, collaborateur_ids: number[], reference?: string, soumettre?: boolean }} payload
 *        Ne pas envoyer `reference` si inutile : le serveur génère VP-AAAA-NNN. Réponses POST 200 ou 201 = succès.
 */
export const creerListeVisitePeriodique = async (payload) => {
  const ids = (payload.collaborateur_ids || [])
    .map((x) => (typeof x === 'string' ? parseInt(x, 10) : Number(x)))
    .filter((n) => !Number.isNaN(n));
  const body = {
    date_visite: payload.date_visite,
    collaborateur_ids: ids,
  };
  if (payload.reference != null && String(payload.reference).trim() !== '') {
    body.reference = String(payload.reference).trim();
  }
  if (payload.soumettre === true) body.soumettre = true;
  const r = await axiosInstance.post(`${BASE}/`, body, {
    validateStatus: (status) => status === 200 || status === 201,
  });
  if (r.status !== 200 && r.status !== 201) {
    const err = new Error(`Création liste VP : statut HTTP ${r.status}`);
    err.response = r;
    throw err;
  }
  return r.data;
};

/**
 * Mise à jour d’une liste VP existante (brouillon) — évite un second POST création.
 * @param {number|string} id
 * @param {{ date_visite?: string, collaborateur_ids?: number[] }} payload
 */
export const patchListeVisitePeriodique = async (id, payload = {}) => {
  const body = {};
  if (payload.date_visite != null && String(payload.date_visite).trim() !== '') {
    body.date_visite = String(payload.date_visite).trim();
  }
  if (payload.collaborateur_ids != null) {
    body.collaborateur_ids = (payload.collaborateur_ids || [])
      .map((x) => (typeof x === 'string' ? parseInt(x, 10) : Number(x)))
      .filter((n) => !Number.isNaN(n));
  }
  if (Object.keys(body).length === 0) {
    return getListeVisitePeriodique(id);
  }
  const r = await axiosInstance.patch(`${BASE}/${id}/`, body);
  return r.data;
};

/**
 * Crée (POST) ou met à jour (PATCH) puis soumet à l’infirmier uniquement via PATCH …/soumettre/ (pas de second POST collection).
 * @param {{ date_visite: string, collaborateur_ids: number[], reference?: string, listeIdExisting?: number|string }} p
 */
export const creerListeVisitePeriodiqueEtSoumettre = async ({
  date_visite,
  collaborateur_ids,
  reference,
  listeIdExisting,
}) => {
  let listeId;
  if (listeIdExisting != null && listeIdExisting !== '') {
    listeId = listeIdExisting;
    const patchBody = { date_visite };
    if (collaborateur_ids && collaborateur_ids.length > 0) {
      patchBody.collaborateur_ids = collaborateur_ids;
    }
    await patchListeVisitePeriodique(listeId, patchBody);
  } else {
    const liste = await creerListeVisitePeriodique({ date_visite, collaborateur_ids, reference });
    listeId = liste?.id ?? liste?.pk;
    if (listeId == null || listeId === '') {
      throw new Error('Réponse création liste VP sans identifiant.');
    }
  }
  try {
    await soumettreListeVisitePeriodique(listeId, { date_visite });
  } catch (e) {
    const st = e?.response?.status;
    if (st === 400 || st === 409) {
      return getListeVisitePeriodique(listeId);
    }
    throw e;
  }
  return getListeVisitePeriodique(listeId);
};

/** RH : passage brouillon → soumise. Corps optionnel `{ date_visite }` si la date est mise à jour à la soumission. */
export const soumettreListeVisitePeriodique = async (id, opts = {}) => {
  const body = {};
  if (opts?.date_visite != null && String(opts.date_visite).trim() !== '') {
    body.date_visite = String(opts.date_visite).trim();
  }
  const r = await axiosInstance.patch(
    `${BASE}/${id}/soumettre/`,
    Object.keys(body).length ? body : {},
  );
  return r.data;
};

export const getListesVisitesPeriodiquesSoumises = async () => {
  const r = await axiosInstance.get(`${BASE}/soumises/`, { params: withSiteId() });
  const list = excludeClotureEtArchivePourPersonnelVp(arr(r));
  /* Sécurité : le backend ne doit pas renvoyer ARCHIVEE ; on filtre quand même côté client. */
  return list.filter((l) => String(l?.statut || '').toUpperCase() !== 'ARCHIVEE');
};

/** Listes assignées au médecin connecté (liste du jour / file d'examen). */
export const getListesVisitesPeriodiquesPourMedecin = async () => {
  /* Ne pas appeler GET …/pour_medecin/ : souvent non exposé par Django (404 bruyant dans la console). */
  try {
    const r = await axiosInstance.get(`${BASE}/`, { params: withSiteId({ pour_medecin: true }) });
    const vp = excludeClotureEtArchivePourPersonnelVp(arr(r));
    const pourMedecinVp = filterListesPourMedecinJour(vp);
    const sansIdsSms = await excludeListesSmsParIdsEndpointDedie(pourMedecinVp);
    return await excludeListesDontIdEstListeSurveillanceSpeciale(sansIdsSms);
  } catch (e) {
    const status = e?.response?.status;
    if (status === 403 || status === 404 || status === 405) return [];
    throw e;
  }
};

const FICHES_APT = '/medical-work/fiches-aptitude';

const bodyFiche = (ficheId) => ({
  fiche_aptitude: ficheId,
  fiche_aptitude_id: ficheId,
});

/**
 * Après création de la fiche — associe la ligne VP à la fiche.
 * Souvent le ViewSet « lignes » est en lecture seule : la FK est sur FicheAptitude (`ligne_visite_periodique`)
 * ou une action sous la liste. On essaie la fiche en premier, puis les routes ligne / liste.
 *
 * @param {number|string} ligneId
 * @param {number|string} ficheId
 * @param {{ listeId?: number|string }} [opts] — si la ligne appartient à une liste (nested router)
 */
export const rattacherFicheLignePeriodique = async (ligneId, ficheId, opts = {}) => {
  const id = ligneId;
  const fid = ficheId;
  const b = { fiche_aptitude: fid };
  const listeId = opts.listeId;

  const lierSurFiche = [
    { ligne_visite_periodique: id },
    { ligne_visite_periodique_id: id },
    { ligne_vp: id },
    { ligne_visite_periodique: id, ligne_visite_periodique_id: id },
  ];

  const attempts = [
    ...lierSurFiche.map((body) => () => axiosInstance.patch(`${FICHES_APT}/${fid}/`, body)),
    () => axiosInstance.post(`${FICHES_APT}/${fid}/rattacher_ligne/`, { ligne: id, ligne_visite_periodique: id }),
    () => axiosInstance.patch(`${FICHES_APT}/${fid}/rattacher_ligne/`, { ligne: id, ligne_visite_periodique: id }),
  ];

  if (listeId != null && listeId !== '') {
    attempts.unshift(
      () => axiosInstance.patch(`${BASE}/${listeId}/lignes/${id}/`, bodyFiche(fid)),
      () => axiosInstance.post(`${BASE}/${listeId}/lignes/${id}/rattacher_fiche/`, b),
      () => axiosInstance.patch(`${BASE}/${listeId}/lignes/${id}/rattacher_fiche/`, b),
    );
  }

  attempts.push(
    () => axiosInstance.patch(`${LIGNES}/${id}/rattacher_fiche/`, b),
    () => axiosInstance.post(`${LIGNES}/${id}/rattacher_fiche/`, b),
    () => axiosInstance.patch(`${LIGNES}/${id}/rattacher-fiche/`, b),
    () => axiosInstance.post(`${LIGNES}/${id}/rattacher-fiche/`, b),
    () => axiosInstance.patch(`${LIGNES}/${id}/`, bodyFiche(fid)),
    () => axiosInstance.put(`${LIGNES}/${id}/`, bodyFiche(fid)),
  );

  let lastErr;
  for (const run of attempts) {
    try {
      const r = await run();
      return r.data;
    } catch (e) {
      lastErr = e;
      const st = e?.response?.status;
      if (st === 401 || st === 403) throw e;
      if (st === 404 || st === 405) continue;
      throw e;
    }
  }
  throw lastErr;
};

export const assignerMedecinListePeriodique = async (listeId, medecinId) => {
  const r = await axiosInstance.patch(`${BASE}/${listeId}/assigner_medecin/`, {
    medecin: medecinId,
  });
  return r.data;
};

export const cloturerListeVisitePeriodique = async (listeId) => {
  const r = await axiosInstance.patch(`${BASE}/${listeId}/cloturer/`);
  return r.data;
};

/** RH : archiver une liste clôturée → statut ARCHIVEE (retirée des vues infirmier / médecin). */
export const archiverListeVisitePeriodique = async (listeId) => {
  const r = await axiosInstance.patch(`${BASE}/${listeId}/archiver/`);
  return r.data;
};

/**
 * Réponse type : { sent: boolean, detail?: string, sms_count?: number }
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
 * POST /…/listes-visites-periodiques/{id}/notifier_veille/ (corps {} — secours sms_veille, send_sms_veille).
 */
export async function notifierSmsVeilleListePeriodique(listeId) {
  const id = listeId;
  if (id == null || id === '') throw new Error('Identifiant de liste manquant.');

  const attempts = [
    () => axiosInstance.post(`${BASE}/${id}/notifier_veille/`, {}),
    () => axiosInstance.post(`${BASE}/${id}/sms_veille/`, {}),
    () => axiosInstance.post(`${BASE}/${id}/send_sms_veille/`, {}),
    () => axiosInstance.post(`${BASE}/${id}/rappel_veille/`, {}),
    () => axiosInstance.patch(`${BASE}/${id}/notifier_veille/`, {}),
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

/**
 * POST /…/lignes-visites-periodiques/{ligneId}/notifier-jour-j/ — renvoi manuel SMS jour J.
 * Réponse type : { sent, detail, … }
 */
export async function notifierLigneVisitePeriodiqueJourJ(ligneId) {
  const id = ligneId;
  if (id == null || id === '') throw new Error('Identifiant de ligne manquant.');

  const attempts = [
    () => axiosInstance.post(`${LIGNES}/${id}/notifier-jour-j/`, {}),
    () => axiosInstance.post(`${LIGNES}/${id}/notifier_jour_j/`, {}),
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
  throw lastErr ?? new Error('Route notifier-jour-j introuvable.');
}

/**
 * Récupère les lignes (patients) d’une liste VP. Compatible plusieurs conventions Django REST.
 */
export const getLignesListePeriodique = async (listeId) => {
  const id = listeId;
  if (id == null || id === '') return [];

  // 1) Détail liste — lignes souvent embarquées
  try {
    const detail = await getListeVisitePeriodique(id);
    const inline = pickLignesFromDetail(detail);
    if (inline) return filterLignesVpPourAffichageMedecin(inline);
  } catch {
    /* suite */
  }

  // 2) Sous-URL nested (très courant si pas de ViewSet séparé "lignes-visites-periodiques")
  const nestedUrls = [`${BASE}/${id}/lignes/`, `${BASE}/${id}/lignes_visites/`];
  for (const url of nestedUrls) {
    try {
      const r = await axiosInstance.get(url);
      const out = arr(r);
      if (Array.isArray(out)) return filterLignesVpPourAffichageMedecin(out);
    } catch {
      /* next */
    }
  }

  // 3) Liste filtrée — plusieurs noms de paramètre possibles
  const paramVariants = [
    { liste: id },
    { liste_id: id },
    { liste_visite_periodique: id },
    { list: id },
    { liste_visite_periodique_id: id },
  ];
  for (const params of paramVariants) {
    try {
      const r = await axiosInstance.get(`${LIGNES}/`, { params });
      const out = arr(r);
      if (Array.isArray(out)) return filterLignesVpPourAffichageMedecin(out);
    } catch {
      /* next */
    }
  }

  return [];
};

export const setPresenceLignePeriodique = async (ligneId, presence) => {
  const r = await axiosInstance.patch(`${LIGNES}/${ligneId}/presence/`, { presence });
  return r.data;
};

// Export Excel des visites périodiques
export const exportVisitesPeriodiques = async () => {
  const siteId = getUserSiteId();
  const params = {};
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    params.site_id = siteId;
  }
  const response = await axiosInstance.get(`${BASE}/export/`, {
    params,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Alertes « listes » VP pour le RH (listes planifiées dans l’horizon).
 * GET …/listes-visites-periodiques/alertes-rh/?horizon_jours=…
 * Réponse attendue : { count, results, horizon_jours }
 * @param {{ horizon_jours?: number }} [opts]
 */
function coerceInt(v, fallback) {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return fallback;
}

export const getAlertesVisitesPeriodiquesRH = async (opts = {}) => {
  const horizon = opts.horizon_jours ?? VP_ALERT_HORIZON_JOURS_DEFAULT;
  const siteId = getUserSiteId();
  const params = { horizon_jours: horizon, page_size: 500 };
  if (siteId !== null && siteId !== undefined && String(siteId).trim() !== '') {
    params.site_id = siteId;
  }
  const response = await axiosInstance.get(`${BASE}/alertes-rh/`, { params });
  let data = response?.data;
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const nested = data.data;
    if (Array.isArray(nested.results) || nested.count != null) data = nested;
  }
  let results = Array.isArray(data?.results) ? data.results : [];
  if (!results.length && data?.result && Array.isArray(data.result)) results = data.result;
  if (!results.length && Array.isArray(data)) results = data;
  const apiCount = data?.count !== undefined && data?.count !== null ? data.count : data?.total;
  let count = coerceInt(apiCount, results.length);
  if (results.length > 0) count = Math.max(count, results.length);
  const horizon_jours = coerceInt(data?.horizon_jours ?? data?.horizonJours, horizon);
  return { count, results, horizon_jours };
};
