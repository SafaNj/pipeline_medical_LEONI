import { pickDepartementCollaborateur } from './ficheCollaborateur';
import { ficheALienSurveillanceSpeciale } from './dateVisite';

/** Clés API courantes pour le poste / fonction (ligne VP ou fiche collaborateur RH). */
export const POSTE_RH_KEYS = [
  'poste',
  'fonction',
  'collaborateur_poste',
  'job_title',
  'intitule_poste',
  'job',
  'role',
  'position',
];

/**
 * Poste depuis une réponse `/employees/collaborateurs/<id>/` ou objet imbriqué.
 */
export function pickPosteDepuisPayloadCollaborateur(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const nested =
    raw.collaborateur_detail ||
    (raw.collaborateur && typeof raw.collaborateur === 'object' ? raw.collaborateur : null);
  const fromRoot = pickStr(raw, POSTE_RH_KEYS);
  if (fromRoot) return fromRoot;
  return nested ? pickStr(nested, POSTE_RH_KEYS) : '';
}

/**
 * Normalise une ligne API (visite périodique) pour affichage / flux médecin.
 * Le backend peut renvoyer nom/prénom à plat, nested collaborateur, ou nom_complet seul.
 */
export function normalizeLigneVisitePeriodique(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      nom: '',
      prenom: '',
      matricule: '',
      poste: '',
      collaborateurPk: null,
    };
  }
  const nested =
    raw.collaborateur_detail ||
    raw.collaborateur ||
    raw.employee ||
    raw.collab ||
    (typeof raw.collaborateur === 'object' ? raw.collaborateur : null) ||
    {};

  let nom =
    pickStr(raw, ['nom']) ||
    pickStr(nested, ['nom']) ||
    '';
  let prenom =
    pickStr(raw, ['prenom']) ||
    pickStr(nested, ['prenom']) ||
    '';

  const nc = pickStr(raw, ['nom_complet', 'nom_prenom', 'collaborateur_nom']) || pickStr(nested, ['nom_complet']);
  if (nc && !nom && !prenom) {
    const parts = nc.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      nom = parts[0];
      prenom = parts.slice(1).join(' ');
    } else {
      nom = nc;
    }
  }

  const matricule =
    pickStr(raw, ['matricule', 'collaborateur_matricule']) ||
    pickStr(nested, ['matricule']) ||
    '';

  const poste = pickStr(raw, POSTE_RH_KEYS) || pickStr(nested, POSTE_RH_KEYS) || '';

  const collaborateurPk =
    raw.collaborateur_id ??
    raw.collaborateur_pk ??
    (typeof raw.collaborateur === 'number' ? raw.collaborateur : nested.id) ??
    null;

  return {
    nom,
    prenom,
    matricule,
    poste,
    collaborateurPk: collaborateurPk != null ? Number(collaborateurPk) : null,
  };
}

function pickStr(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/**
 * Badge aptitude listes VP (infirmier / RH) : APTE | INAPTE | EN_ATTENTE.
 * Le backend laisse parfois etat_visite à EN_ATTENTE alors qu'une fiche d'aptitude existe déjà.
 */
export function resolveEtatAptitudeVisitePeriodique(ligne) {
  if (!ligne || typeof ligne !== 'object') return 'EN_ATTENTE';

  const candidatsEtat = [ligne.etat_visite, ligne.etat_embauche, ligne.etat_periodique];
  for (const raw of candidatsEtat) {
    const s = raw == null ? '' : String(raw).trim();
    if (!s) continue;
    const up = s.toUpperCase();
    if (up === 'APTE') return 'APTE';
    if (up === 'INAPTE') return 'INAPTE';
    if (up.startsWith('INAPTE')) return 'INAPTE';
    if (up.startsWith('APTE')) return 'APTE';
  }

  const ficheRaw = ligne.fiche_aptitude;
  const ficheId =
    ligne.fiche_aptitude_id ??
    (typeof ficheRaw === 'object' && ficheRaw ? ficheRaw.id ?? ficheRaw.pk : null) ??
    (typeof ficheRaw === 'number' ? ficheRaw : null);

  if (!ficheId && (ficheRaw == null || ficheRaw === '')) return 'EN_ATTENTE';

  if (typeof ficheRaw === 'object' && ficheRaw) {
    const apt = String(ficheRaw.aptitude || '').trim();
    if (apt) {
      const up = apt.toUpperCase();
      if (up.startsWith('INAPTE')) return 'INAPTE';
      if (up.startsWith('APTE')) return 'APTE';
    }
  }

  /* Fiche liée : visite traitée par le médecin même si etat_visite n'est pas encore propagé */
  return 'APTE';
}

/** Fusionne détails RH imbriqués avec la ligne API pour résoudre département / poste. */
function flatMergeCollaborateurSources(ligne) {
  if (!ligne || typeof ligne !== 'object') return ligne;
  const nested =
    ligne.collaborateur_detail ||
    (ligne.collaborateur && typeof ligne.collaborateur === 'object' ? ligne.collaborateur : null) ||
    ligne.employee ||
    ligne.collab ||
    {};
  const sub = nested && typeof nested === 'object' ? nested : {};
  return { ...sub, ...ligne };
}

/**
 * Ordre d’affichage file / cohérence SMS (même logique que contre-visite : champ `ordre`).
 * @param {object[]} lignes
 */
/**
 * Ligne renvoyée sous l’API visites périodiques mais liée au module surveillance SMS.
 */
export function isLigneSurveillanceSmsDansFluxVp(ligne) {
  if (!ligne || typeof ligne !== 'object') return false;
  if (
    ligne.liste_surveillance_speciale != null
    || ligne.liste_surveillance != null
    || ligne.liste_surveillance_speciale_id != null
    || ligne.liste_surveillance_id != null
    || ligne.ligne_surveillance_speciale != null
    || ligne.ligne_surveillance_speciale_id != null
    || ligne.ligne_surveillance != null
    || ligne.ligne_surveillance_id != null
  ) {
    return true;
  }
  const liste =
    ligne.liste_visite_periodique
    ?? ligne.liste
    ?? ligne.listeVisitePeriodique;
  if (liste && typeof liste === 'object') {
    const flux = String(liste.flux ?? '').trim().toUpperCase();
    const tl = String(liste.type_liste ?? '').trim().toUpperCase();
    if (flux && flux !== 'VP') return true;
    if (tl && tl !== 'VISITE_PERIODIQUE') return true;
  }
  const fic = ligne.fiche_aptitude;
  if (fic && typeof fic === 'object' && ficheALienSurveillanceSpeciale(fic)) return true;
  return false;
}

/** Retire les lignes SMS d’un tableau issu d’un endpoint VP (défense en profondeur). */
export function filterLignesVpPourAffichageMedecin(lignes) {
  if (!Array.isArray(lignes)) return [];
  return lignes.filter((l) => !isLigneSurveillanceSmsDansFluxVp(l));
}

export function sortLignesVisitePeriodique(lignes) {
  if (!Array.isArray(lignes)) return [];
  return [...lignes].sort((a, b) => {
    const oa = Number(a?.ordre ?? a?.order ?? a?.position ?? 0);
    const ob = Number(b?.ordre ?? b?.order ?? b?.position ?? 0);
    if (oa !== ob) return oa - ob;
    const ida = Number(a?.id ?? 0);
    const idb = Number(b?.id ?? 0);
    return ida - idb;
  });
}

/** Fusionne la ligne API avec les champs d'affichage pour l'UI. */
export function enrichLigneVisitePeriodique(ligne) {
  const n = normalizeLigneVisitePeriodique(ligne);
  const pk = n.collaborateurPk;
  const listeRaw =
    ligne.liste_visite_periodique ??
    ligne.liste ??
    ligne.liste_id ??
    ligne.listeVisitePeriodiqueId;
  const listeId =
    typeof listeRaw === 'object' && listeRaw !== null ? listeRaw.id ?? listeRaw.pk : listeRaw;

  const mergedForDept = flatMergeCollaborateurSources(ligne);
  const departement =
    pickDepartementCollaborateur(mergedForDept) ||
    pickStr(ligne, ['collaborateur_departement', 'department_name', 'service_nom', 'site_nom']);

  return {
    ...ligne,
    nom: n.nom || ligne.nom || '',
    prenom: n.prenom || ligne.prenom || '',
    matricule: n.matricule || ligne.matricule || '',
    poste: n.poste || ligne.poste || '',
    departement,
    collaborateurPk: pk,
    collaborateur_id: pk,
    liste_id: listeId != null ? Number(listeId) : null,
    etat_embauche: resolveEtatAptitudeVisitePeriodique(ligne),
  };
}
