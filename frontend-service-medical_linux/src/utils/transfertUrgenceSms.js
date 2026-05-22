/**
 * Champ optionnel renvoyé par l’API après envoi TunisieSMS au chauffeur.
 * @param {object} transfert
 * @returns {boolean}
 */
export function isSmsChauffeurEnvoye(transfert) {
  if (!transfert || typeof transfert !== 'object') return false;
  const v = transfert.sms_chauffeur_envoye ?? transfert.smsChauffeurEnvoye;
  return v === true || v === 'true' || v === 1 || v === '1';
}
