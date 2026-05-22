/**
 * Gestion de la file contre-visite : champ `ordre` sur chaque ligne.
 * Le dernier collaborateur ajouté doit être en dernière position (ordre max + 1).
 */

/**
 * @param {Array<{ ordre?: number, id?: number }>} lignes
 * @returns {Array}
 */
export function sortLignesByOrdre(lignes) {
  if (!Array.isArray(lignes)) return [];
  return lignes.slice().sort((a, b) => {
    const oa = Number(a?.ordre);
    const ob = Number(b?.ordre);
    const na = Number.isFinite(oa) ? oa : 0;
    const nb = Number.isFinite(ob) ? ob : 0;
    if (na !== nb) return na - nb;
    return (Number(a?.id) || 0) - (Number(b?.id) || 0);
  });
}

/**
 * Prochain `ordre` à envoyer lors du POST d'une nouvelle ligne.
 * @param {Array<{ ordre?: number, id?: number }>} lignes
 * @returns {number}
 */
export function nextOrdrePourNouvelleLigne(lignes) {
  const sorted = sortLignesByOrdre(lignes);
  if (sorted.length === 0) return 1;
  const last = sorted[sorted.length - 1];
  const o = Number(last?.ordre);
  if (Number.isFinite(o) && o >= 1) return o + 1;
  return sorted.length + 1;
}

/**
 * Items du médecin (`getMesListesContreVisite`) : aplatit `listes[].items` en
 * respectant l'ordre de la file au sein de chaque liste.
 * @param {Array<{ items?: Array }>} listes
 */
export function flatMapListesContreVisiteItemsOrdered(listes) {
  if (!Array.isArray(listes)) return [];
  return listes.flatMap((l) => {
    const raw = l.items || [];
    const sorted = sortLignesByOrdre(raw);
    return sorted.map((i) => ({ ...i, _liste: l }));
  });
}
