/**
 * Champs optionnels renvoyés par l’API (contre-visites, visites périodiques, listes d’embauche).
 * Même noms : liste.sms_veille_envoye, ligne/candidat.sms_jour_j_envoye.
 * Les SMS automatiques passent côté serveur ; le front ne fait que lecture des flags + POST manuels prévus.
 *
 * @typedef {object} ListeContreVisiteSms
 * @property {boolean} [sms_veille_envoye] Rappel J−1 (veille) envoyé
 *
 * @typedef {object} LigneContreVisiteSms
 * @property {boolean} [sms_jour_j_envoye] SMS « jour J » pour cette ligne (file, N+2…)
 */

function truthyFlag(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

/** Liste : rappel SMS veille (J−1) marqué envoyé par le backend. */
export function isSmsVeilleEnvoye(liste) {
  if (!liste || typeof liste !== 'object') return false;
  const v = liste.sms_veille_envoye ?? liste.smsVeilleEnvoye;
  return truthyFlag(v);
}

/** Ligne : SMS jour J / file traité côté serveur pour cette ligne. */
export function isSmsJourJEnvoye(ligne) {
  if (!ligne || typeof ligne !== 'object') return false;
  const v = ligne.sms_jour_j_envoye ?? ligne.smsJourJEnvoye;
  return truthyFlag(v);
}
