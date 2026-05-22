/**
 * N° CNSS affiché / enrichissement fiche embauche.
 * Ordre : fiche persistée → champs candidat RH → im_data (jamais le champ « ps » qui n’est pas le CNSS).
 */
export function pickCnssCollaborateur(candidat, ficheOpt) {
  const f = ficheOpt || {};
  const c = candidat || {};
  const im = c.im_data || c.candidat?.im_data || {};
  const v =
    f.collaborateur_cnss ||
    c.cnss ||
    c.numero_cnss ||
    c.matricule_cnss ||
    im.cnss ||
    im.numero_cnss ||
    im.matricule_cnss ||
    '';
  return String(v).trim();
}
