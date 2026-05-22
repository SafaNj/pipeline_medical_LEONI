/**
 * Libellé affichage collaborateur sur une fiche d'aptitude (API parfois sans collaborateur_nom).
 */
export function getFicheCollaborateurNomComplet(fiche) {
  if (!fiche) return '';
  const t = (s) => (s == null || s === '' ? '' : String(s).trim());
  if (t(fiche.collaborateur_nom)) return t(fiche.collaborateur_nom);
  const c = fiche.collaborateur;
  if (c && typeof c === 'object') {
    const n = [c.nom, c.prenom].filter(Boolean).join(' ').trim();
    if (n) return n;
    if (t(c.nom_complet)) return t(c.nom_complet);
  }
  const fromRoot = [fiche.nom, fiche.prenom].filter(Boolean).join(' ').trim();
  if (fromRoot) return fromRoot;
  const m = t(fiche.collaborateur_matricule);
  if (m) return `Collaborateur (matricule ${m})`;
  const id = fiche.collaborateur;
  if (id != null && id !== '') return `Collaborateur #${id}`;
  return 'Collaborateur';
}

/** Visites hors embauche RH (spontanée, périodique, reprise) — à afficher dans « Fiches du jour » */
export function estVisiteHorsEmbaucheListeMedecin(fiche) {
  return fiche && fiche.type_visite !== 'EMBAUCHE';
}

function nestedLabel(obj) {
  if (!obj || typeof obj !== 'object') return '';
  return String(obj.nom || obj.libelle || obj.name || obj.label || '').trim();
}

/**
 * Département / service (RH im_db : champ principal `departement`, pas « segment »).
 * Ordre : département im_db → department → autres libellés → segment (ancien nom / legacy).
 */
export function pickDepartementCollaborateur(c) {
  if (!c) return '';
  const im = c.im_data || {};
  const fromNested =
    nestedLabel(c.departement) ||
    nestedLabel(c.department) ||
    nestedLabel(c.service_ref) ||
    '';
  if (fromNested) return fromNested;
  const v =
    c.departement ||
    c.department ||
    c.collaborateur_departement ||
    c.departement_collaborateur ||
    c.department_name ||
    c.service_nom ||
    c.departement_nom ||
    c.nom_departement ||
    c.libelle_departement ||
    c.service ||
    c.unite ||
    c.direction ||
    c.site ||
    c.plant_section ||
    im.departement ||
    im.department ||
    im.service ||
    c.segment ||
    im.segment ||
    '';
  return String(v).trim();
}

/** Alias explicite : même logique — à utiliser lorsque la source est la base RH (im_db). */
export const pickDepartementDepuisImDb = pickDepartementCollaborateur;

/** Affichage contrôle médical : le backend peut exposer `departement` ou l’ancien `segment`. */
export function displayDepartementControleMedical(cm) {
  if (!cm || typeof cm !== 'object') return '';
  const v = cm.departement ?? cm.segment;
  return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

/** Lieu de naissance — champs racine, fiche/API médicale, im_data */
export function pickLieuNaissanceCollaborateur(c) {
  if (!c) return '';
  const im = c.im_data || {};
  const v =
    c.lieu_naissance ||
    c.lieu_de_naissance ||
    c.collaborateur_lieu_naissance ||
    c.ville_naissance ||
    c.birth_place ||
    im.lieu_naissance ||
    im.lieu_de_naissance ||
    im.lieuNaissance ||
    im.ville_naissance ||
    '';
  return String(v).trim();
}
