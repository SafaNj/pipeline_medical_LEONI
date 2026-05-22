import {
  normalizeLigneVisitePeriodique,
  resolveEtatAptitudeVisitePeriodique,
} from './ligneVisitePeriodique';

/**
 * Normalise une ligne surveillance spéciale pour ListeCandidats + PanneauExamen (même forme que VP).
 */
export function enrichLigneSurveillancePourMedecin(ligne, listeId, dateVisiteListe) {
  const n = normalizeLigneVisitePeriodique(ligne);
  const etat =
    ligne.traitement_termine === true || ligne.traitement_fini === true
      ? 'APTE'
      : resolveEtatAptitudeVisitePeriodique(ligne);

  return {
    ...ligne,
    nom: n.nom || ligne.nom || '',
    prenom: n.prenom || ligne.prenom || '',
    matricule: n.matricule || ligne.matricule || '',
    poste: n.poste || ligne.poste || '',
    collaborateurPk: n.collaborateurPk,
    collaborateur_id: n.collaborateurPk,
    liste_id: listeId != null ? Number(listeId) : null,
    date_visite_liste: dateVisiteListe ?? ligne.date_visite_liste ?? null,
    etat_embauche: etat,
    id: ligne.id,
  };
}
