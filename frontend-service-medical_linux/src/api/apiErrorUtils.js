/** Extrait un message lisible depuis une erreur Axios (DRF : detail, champ, non_field_errors). */
export function formatAxiosError(error) {
  const d = error?.response?.data;
  const status = error?.response?.status;
  if (!d) {
    return status ? `Erreur réseau (${status}).` : 'Erreur réseau.';
  }
  if (typeof d === 'string') return d;
  if (d.error) return String(d.error);

  const parts = [];
  if (d.non_field_errors) {
    parts.push(...(Array.isArray(d.non_field_errors) ? d.non_field_errors : [d.non_field_errors]).map(String));
  }
  for (const [k, v] of Object.entries(d)) {
    if (k === 'detail' || k === 'non_field_errors') continue;
    const msg = Array.isArray(v) ? v.join(', ') : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
    parts.push(`${k}: ${msg}`);
  }
  if (d.detail != null && d.detail !== '') {
    const det = typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail);
    if (parts.length) parts.push(`detail: ${det}`);
    else parts.push(det);
  }
  if (parts.length) return parts.join(' · ');
  try {
    return JSON.stringify(d);
  } catch {
    return 'Erreur serveur.';
  }
}
