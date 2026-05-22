/**
 * Filtre défensif des alertes VP RH : lorsque la visite périodique et la fiche sont
 * terminées côté médecin, certains endpoints peuvent encore renvoyer l’ancienne échéance.
 * On masque les lignes manifestement à jour pour éviter les doublons « comme si » la VP manquait.
 */

/** Émis après enregistrement fiche VP par le médecin — rafraîchir alertes RH / liste sans visite. */
export const RH_VP_EXAM_PERIODIQUE_TERMINE = 'rh-vp-examen-periodique-termine';

/** IDs collaborateurs examinés VP dans cette session (avant que l’API liste à jour ne réponde). */
const sessionVpExamDoneCollabIds = new Set();

/**
 * À appeler quand le médecin a terminé l’examen VP (fiche enregistrée).
 * @param {unknown} collaborateurId
 */
export function signalVpPeriodiqueExamenRh(collaborateurId) {
  const n = Number(collaborateurId);
  if (Number.isFinite(n)) sessionVpExamDoneCollabIds.add(n);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(RH_VP_EXAM_PERIODIQUE_TERMINE, { detail: { collaborateur_id: Number.isFinite(n) ? n : collaborateurId } }),
    );
  }
}

/** @param {Record<string, unknown>} r */
function pickCollaborateurPkFromVpRow(r) {
  if (!r || typeof r !== 'object') return null;
  const fromFiche =
    r.fiche && typeof r.fiche === 'object'
      ? (r.fiche.collaborateur_id ??
        (r.fiche.collaborateur && typeof r.fiche.collaborateur === 'object'
          ? (r.fiche.collaborateur.id ?? r.fiche.collaborateur.pk)
          : r.fiche.collaborateur))
      : null;
  const fromFa =
    r.fiche_aptitude && typeof r.fiche_aptitude === 'object'
      ? (r.fiche_aptitude.collaborateur_id ??
        (r.fiche_aptitude.collaborateur && typeof r.fiche_aptitude.collaborateur === 'object'
          ? (r.fiche_aptitude.collaborateur.id ?? r.fiche_aptitude.collaborateur.pk)
          : r.fiche_aptitude.collaborateur))
      : null;
  const nested = r.collaborateur && typeof r.collaborateur === 'object' ? (r.collaborateur.id ?? r.collaborateur.pk) : null;
  const v = r.collaborateur_id ?? fromFiche ?? fromFa ?? r.collaborateur ?? nested ?? null;
  if (v === null || v === undefined || v === '') return null;
  const num = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  return Number.isNaN(num) ? null : num;
}

function truthy(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

/** Fenêtre « VP récente » alignée sur la périodicité annuelle (~13 mois). */
const RECENT_PERIODIQUE_MS = 400 * 24 * 60 * 60 * 1000;

/**
 * Ne pas se baser sur un simple fiche_id : un collaborateur peut avoir une fiche d’embauche
 * ancienne et être pourtant en alerte VP. On ne masque que si l’API indique une VP PERIODIQUE
 * récente (objet imbriqué) ou des flags explicites.
 *
 * @param {Record<string, unknown>} row
 */
export function vpAlertRowShowsMedecinExamDone(row) {
  if (!row || typeof row !== 'object') return false;

  if (truthy(row.vp_examen_termine) || truthy(row.visite_periodique_effectuee) || truthy(row.visite_periodique_examen_termine)) {
    return true;
  }

  const now = Date.now();
  const nestedBlocks = [row.fiche, row.fiche_aptitude, row.derniere_fiche];
  for (const nested of nestedBlocks) {
    if (!nested || typeof nested !== 'object') continue;
    const tv = String(nested.type_visite ?? nested.typeVisite ?? '').toUpperCase();
    const dv = parseOptionalDate(nested.date_visite);
    if (tv !== 'PERIODIQUE' || !dv) continue;
    if (dv.getTime() > now - RECENT_PERIODIQUE_MS) return true;
  }

  return false;
}

/** @param {unknown} v */
export function parseOptionalDate(v) {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {Record<string, unknown>} row — ligne normalisée alertes-visite-periodique-rh
 * @returns {boolean} true → ne pas afficher cette ligne
 */
export function shouldHideVpCollaborateurAlertRow(row) {
  if (!row || typeof row !== 'object') return false;

  // Cacher seulement si explicitement marqué à jour
  if (truthy(row.visite_periodique_a_jour) || truthy(row.a_jour) ||
      truthy(row.est_a_jour) || truthy(row.vp_a_jour)) return true;
  if (row.exclure_alerte === true) return true;

  // Cacher si le médecin a déjà fait la visite dans cette session
  const pkRow = pickCollaborateurPkFromVpRow(row);
  if (pkRow != null && sessionVpExamDoneCollabIds.has(pkRow)) return true;

  // NE PLUS cacher selon les dates — le back-end gère déjà la logique
  return false;
}

/**
 * @param {{ count?: number, results?: unknown[], horizon_jours?: number }} normalized
 */
export function filterVpCollaborateurAlertsPayload(normalized) {
  const src = normalized && typeof normalized === 'object' ? normalized : {};
  const raw = Array.isArray(src.results) ? src.results : [];
  const results = raw.filter((row) => !shouldHideVpCollaborateurAlertRow(/** @type {Record<string, unknown>} */ (row)));
  const countApi = typeof src.count === 'number' ? src.count : undefined;
  return {
    ...src,
    results,
    /** Lignes réellement affichées après filtre défensif client */
    count: results.length,
    /** `count` brut renvoyé par l’API avant filtre (référence) */
    count_api: countApi != null ? countApi : results.length,
  };
}

/**
 * GET sans_visite_periodique : exclure si la dernière visite renvoyée est dans les ~13 derniers mois.
 * @param {Record<string, unknown>} c
 */
export function shouldHideSansVisitePeriodiqueRow(c) {
  if (!c || typeof c !== 'object') return false;

  const pk = pickCollaborateurPkFromVpRow(c) ?? (() => {
    const v = c.collaborateur_id ?? c.collaborateur ?? c.id;
    if (v == null || v === '') return null;
    const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
    return Number.isNaN(n) ? null : n;
  })();
  if (pk != null && sessionVpExamDoneCollabIds.has(pk)) return true;
  if (vpAlertRowShowsMedecinExamDone(c)) return true;

  const mois = Number(c.mois_depuis_derniere_visite);
  if (Number.isFinite(mois) && mois >= 0 && mois < 12) return true;

  /* Fenêtre 370 j : se baser sur la date de dernière visite renvoyée par l’API (`derniere_visite_date`). */
  const d = parseOptionalDate(
    c.derniere_visite_date ??
      c.derniereVisiteDate ??
      c.derniere_visite ??
      c.derniere_vp_date ??
      c.derniereVpDate ??
      c.date_derniere_visite_periodique,
  );
  if (!d) return false;

  const daysSince = (Date.now() - d.getTime()) / (24 * 60 * 60 * 1000);
  /* Dans la périodicité annuelle : ne doit pas figurer comme « sans visite +1 an » */
  if (daysSince >= 0 && daysSince < 370) return true;

  return false;
}
