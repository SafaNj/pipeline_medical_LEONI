import { getCollaborateur } from '../api/Medicalworkapi';

/**
 * Complète collaborateur_nom sur les fiches quand l’API ne le renvoie pas mais fournit collaborateur (id).
 */
export async function enrichFichesAvecNomsCollaborateurs(fiches) {
  if (!Array.isArray(fiches) || fiches.length === 0) return fiches;
  const need = fiches.filter(
    (f) =>
      f.collaborateur != null &&
      f.collaborateur !== '' &&
      !String(f.collaborateur_nom || '').trim(),
  );
  if (need.length === 0) return fiches;

  const uniqueIds = [...new Set(need.map((f) => f.collaborateur))];
  const settled = await Promise.allSettled(uniqueIds.map((id) => getCollaborateur(id)));
  const idToNom = {};
  uniqueIds.forEach((id, i) => {
    const r = settled[i];
    if (r.status !== 'fulfilled' || !r.value) return;
    const c = r.value;
    const nom =
      [c.nom, c.prenom].filter(Boolean).join(' ').trim() ||
      (c.nom_complet && String(c.nom_complet).trim()) ||
      '';
    if (nom) idToNom[id] = nom;
  });

  return fiches.map((f) => {
    const n = idToNom[f.collaborateur];
    return n ? { ...f, collaborateur_nom: f.collaborateur_nom || n } : f;
  });
}
