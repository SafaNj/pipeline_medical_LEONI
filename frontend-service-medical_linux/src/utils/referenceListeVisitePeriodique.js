/**
 * Références listes de visites périodiques — même lisibilité que l'embauche (EMB-2026-024) :
 * **VP-2026-024** (préfixe VP, année, numéro sur 3 chiffres).
 *
 * Le compteur est synchronisé avec les listes déjà présentes côté API (regex VP-YYYY-NNN) et avec localStorage
 * pour rester cohérent entre onglets / rechargements.
 *
 * Si l'API renvoie encore l'ancien format (VP-AAAA-MM-JJ-suffixe), l'affichage est normalisé via
 * `afficherReferenceListeVisitePeriodique`.
 */
import { getListesVisitesPeriodiques } from '../api/visitesPeriodiquesApi';

const REF_PATTERN = /^VP-(\d{4})-(\d{3})$/;

/** Ancien format (date + suffixe alphanum.) */
const REF_LEGACY = /^VP-(\d{4})-\d{2}-\d{2}-.+$/;

/**
 * Référence lisible partout (tableaux RH / infirmier), alignée EMB.
 * @param {{ reference?: string, id?: number|string }} liste
 */
export function afficherReferenceListeVisitePeriodique(liste) {
  if (!liste || liste.reference == null || liste.reference === '') return '—';
  const ref = String(liste.reference).trim();
  if (!ref) return '—';
  if (REF_PATTERN.test(ref)) return ref;
  if (REF_LEGACY.test(ref) && liste.id != null && liste.id !== '') {
    const year = ref.match(REF_LEGACY)?.[1];
    if (!year) return ref;
    const id = Number(liste.id);
    const n = Number.isFinite(id) ? id : 0;
    const seq = String(n).padStart(3, '0').slice(-3);
    return `VP-${year}-${seq}`;
  }
  return ref;
}

function storageKey(year) {
  return `vp_liste_seq_${year}`;
}

function maxSeqFromReferences(listes, year) {
  let max = 0;
  for (const l of listes || []) {
    const ref = l?.reference;
    if (ref == null || typeof ref !== 'string') continue;
    const trimmed = ref.trim();
    const m = trimmed.match(REF_PATTERN);
    if (m) {
      if (parseInt(m[1], 10) !== year) continue;
      const seq = parseInt(m[2], 10);
      if (!Number.isNaN(seq) && seq > max) max = seq;
      continue;
    }
    /* Anciennes listes : éviter collision en tenant compte de l’id normalisé affiché VP-YYYY-NNN */
    if (REF_LEGACY.test(trimmed) && l?.id != null) {
      const y = trimmed.match(REF_LEGACY)?.[1];
      if (parseInt(y, 10) === year) {
        const id = Number(l.id);
        if (Number.isFinite(id)) {
          const pseudo = parseInt(String(id).padStart(3, '0').slice(-3), 10);
          if (pseudo > max) max = pseudo;
        }
      }
    }
  }
  return max;
}

/**
 * @returns {Promise<string>} ex. "VP-2026-001"
 */
export async function prochaineReferenceListeVisitePeriodiqueAsync() {
  const year = new Date().getFullYear();
  const key = storageKey(year);

  let max = 0;
  try {
    const listes = await getListesVisitesPeriodiques();
    max = Math.max(max, maxSeqFromReferences(listes, year));
  } catch {
    /* réseau indisponible : on s'appuie sur localStorage */
  }

  const stored = parseInt(localStorage.getItem(key) || '0', 10);
  max = Math.max(max, stored);
  max += 1;
  localStorage.setItem(key, String(max));

  return `VP-${year}-${String(max).padStart(3, '0')}`;
}
