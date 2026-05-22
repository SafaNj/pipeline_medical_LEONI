/** Grille Mateur : l’UI affiche 9 lignes ; l’état doit toujours les contenir pour les formulaires contrôlés. */

export const MATEUR_EXAM_ROWS_COUNT = 9;

export function emptyMateurExamRow() {
  return { p: false, r: false, s: false, date_nature: '', conclusion: '', medecin: '' };
}

export function padMateurExamRows(rows) {
  const src = Array.isArray(rows) ? rows : [];
  const out = [];
  for (let i = 0; i < MATEUR_EXAM_ROWS_COUNT; i += 1) {
    const r = src[i];
    out.push(
      r && typeof r === 'object'
        ? {
            p: Boolean(r.p),
            r: Boolean(r.r),
            s: Boolean(r.s),
            date_nature: String(r.date_nature ?? ''),
            conclusion: String(r.conclusion ?? ''),
            medecin: String(r.medecin ?? ''),
          }
        : emptyMateurExamRow(),
    );
  }
  return out;
}
