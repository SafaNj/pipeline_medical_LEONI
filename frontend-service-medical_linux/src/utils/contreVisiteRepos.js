/**
 * Pour le body JSON (saisir_verdict, création CV, etc.) :
 * - champ vide → null
 * - 0 est valide (ne pas confondre avec « pas de valeur »)
 */
export function payloadReposInitial(raw) {
  if (raw === '' || raw === undefined || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Affichage table / fiche : 0 doit s’afficher, pas « — ». */
export function displayReposInitialValue(v) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

/**
 * Durée de repos (jours) pour l’API : toujours un entier ≥ 0.
 * parseInt vide ou invalide → NaN → JSON null → « This field may not be null ».
 */
export function payloadDureeRepos(raw) {
  if (raw === '' || raw === undefined || raw === null) return 0;
  const n = parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * « Repos initial » renvoyé par le backend sous plusieurs noms / emplacements selon les serializers.
 */
export function getReposInitial(cv) {
  if (!cv || typeof cv !== 'object') return null;

  const nested = [
    cv,
    cv.controle_medical,
    cv.contre_visite,
    cv.ligne,
    cv.ligne_contre_visite,
    cv.item,
    cv.contre_visite_ligne,
  ].filter((x) => x && typeof x === 'object');

  const keys = [
    'repos_initial',
    'reposInitial',
    'repos_initial_medecin_traitant',
    'reposInitialMedecinTraitant',
    'repos_initial_jours',
    'reposInitialJours',
    'jours_repos_initial',
    'jours_repos_initial_medecin_traitant',
    'jours_repos_initial_medecin',
    'repos_medecin_traitant_jours',
    'nb_jours_repos_initial',
    'repos_medecin_traitant',
  ];

  for (const obj of nested) {
    for (const k of keys) {
      const v = obj[k];
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s === '') continue;
      const n = Number(s);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}
