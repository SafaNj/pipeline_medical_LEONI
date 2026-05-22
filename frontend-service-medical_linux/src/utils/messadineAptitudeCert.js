/**
 * Détermine quel bloc du FOR-AMT-10 Messadine est actif (même logique que le PDF).
 * Cas VP/SMS « Reprise MO-AT » : type_visite peut rester PERIODIQUE — si precision_aptitude === date_reprise, c’est la reprise.
 *
 * @returns {'APTITUDE'|'REPRISE_MO_AT'|'APTITUDE_TEMPORAIRE'}
 */
export function deriveMessadineCertificatChoice(fiche) {
  const fi = fiche || {};
  const apt = String(fi.aptitude || '').toUpperCase();
  const t = String(fi.type_visite || '').toUpperCase();
  if (apt === 'INAPTE_TEMPORAIRE') return 'APTITUDE_TEMPORAIRE';
  if (t === 'REPRISE') return 'REPRISE_MO_AT';
  const p = String(fi.precision_aptitude || '').trim();
  const d = fi.date_reprise != null ? String(fi.date_reprise).trim() : '';
  if ((apt === 'APTE_AU_POSTE' || apt === 'APTE_AMENAGEMENT_POSTE') && p && d && p === d) return 'REPRISE_MO_AT';
  return 'APTITUDE';
}

/**
 * Django DateField sur `date_reprise` : uniquement YYYY-MM-DD (strict).
 * Texte libre (reprise MO-AT) → null : le texte reste dans `precision_aptitude`.
 * @param {unknown} value
 * @returns {string|null}
 */
export function normalizeDateRepriseForApi(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(5, 7));
  const day = Number(s.slice(8, 10));
  if (m < 1 || m > 12 || day < 1 || day > 31) return null;
  const dt = new Date(y, m - 1, day);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== day) return null;
  return s;
}
