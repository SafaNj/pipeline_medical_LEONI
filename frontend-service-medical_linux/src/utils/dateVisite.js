/**
 * Filtre « fiches / visites du jour » : éviter le piège de `new Date('YYYY-MM-DD')`
 * (interprété en UTC → jour civil faux dans certains fuseaux).
 */

/**
 * @param {unknown} dateInput — ISO date, datetime, ou chaîne YYYY-MM-DD
 * @returns {Date | null} minuit local pour ce jour civil
 */
function parseLocalCalendarDateFromVisite(dateInput) {
  if (dateInput == null || dateInput === '') return null;
  const s = String(dateInput).trim();
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]) - 1;
    const d = Number(ymd[3]);
    const dt = new Date(y, m, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
    return dt;
  }
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/**
 * La date de visite (ou created_at) tombe dans les N derniers jours civils inclus (fuseau local).
 * @param {unknown} dateInput
 * @param {number} [days=FICHES_MEDECIN_LISTE_CALENDAR_DAYS]
 */
export function isDateVisiteWithinLastCalendarDays(dateInput, days = 1) {
  const d = parseLocalCalendarDateFromVisite(dateInput);
  if (!d) return false;
  const n = Number(days);
  const span = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - (span - 1));
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

/**
 * @param {unknown} dateInput — ISO date, datetime, ou chaîne YYYY-MM-DD
 */
export function isDateVisiteToday(dateInput) {
  return isDateVisiteWithinLastCalendarDays(dateInput, 1);
}

/**
 * Date utilisée pour le filtre « aujourd'hui » (priorité date de visite métier).
 * @param {Record<string, unknown>} f
 */
export function getDateVisitePourFiltreJour(f) {
  if (!f || typeof f !== 'object') return null;
  const v = f.date_visite ?? f.date;
  if (v != null && v !== '') return v;
  if (f.created_at) return String(f.created_at).slice(0, 10);
  return null;
}

/**
 * Identifiant de ligne VP rattachée à la fiche (GET liste / détail).
 * @param {Record<string, unknown>} f
 * @returns {string | number | null}
 */
export function getLigneVisitePeriodiqueId(f) {
  if (!f || typeof f !== 'object') return null;
  const raw = f.ligne_visite_periodique_id ?? f.ligne_visite_periodique;
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') {
    const id = raw.id ?? raw.pk;
    if (id == null || id === '') return null;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : String(id).trim() || null;
  }
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return n;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const nn = Number(s);
    return nn > 0 ? nn : null;
  }
  const urlTail = s.match(/\/(\d+)\/?$/);
  if (urlTail) {
    const nn = Number(urlTail[1]);
    return nn > 0 ? nn : null;
  }
  /* Hyperlien DRF / UUID réel de ligne VP — la fiche reste « liste VP », à exclure du jour */
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) return s;
  if (s.startsWith('http') || s.includes('/medical-work/') || s.includes('/employees/')) return s;
  return null;
}

/**
 * Fiche d'aptitude liée au module surveillance SMS (ligne ou liste) — même logique que la ligne VP :
 * à traiter sous « Surveillance SMS », pas sous « Fiches du jour ».
 * @param {Record<string, unknown>} f
 */
export function ficheALienSurveillanceSpeciale(f) {
  if (!f || typeof f !== 'object') return false;
  const idKeys = [
    'ligne_surveillance_speciale_id',
    'liste_surveillance_speciale_id',
    'ligne_surveillance_id',
    'liste_surveillance_id',
    'ligne_sms_id',
    'liste_sms_id',
    'surveillance_ligne_id',
    'surveillance_liste_id',
  ];
  for (const k of idKeys) {
    const raw = f[k];
    if (raw == null || raw === '') continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return true;
    if (String(raw).trim()) return true;
  }
  const objKeys = [
    f.ligne_surveillance_speciale,
    f.liste_surveillance_speciale,
    f.ligne_surveillance,
    f.liste_surveillance,
  ];
  for (const raw of objKeys) {
    if (!raw || typeof raw !== 'object') continue;
    const id = raw.id ?? raw.pk;
    if (id != null && id !== '') return true;
  }
  return false;
}

function nestedListeFluxHorsVp(f) {
  if (!f || typeof f !== 'object') return false;
  /* Ne pas utiliser la clé générique « liste » : le backend y met souvent la liste du site / autre flux
     et toutes les fiches « consultation » disparaissaient des Fiches du jour. */
  const nestKeys = ['liste_visite_periodique', 'liste_surveillance_speciale', 'liste_surveillance'];
  for (const key of nestKeys) {
    const nested = f[key];
    if (!nested || typeof nested !== 'object') continue;
    const flux = String(nested.flux ?? '').trim().toUpperCase();
    const tl = String(nested.type_liste ?? '').trim().toUpperCase();
    // Exclure uniquement les fiches réellement rattachées à une liste VP/SMS.
    // Certains backends mettent un "flux" métier/site (ex: MATEUR) même pour une consultation normale.
    if (flux === 'VP') return true;
    if (tl === 'VISITE_PERIODIQUE') return true;
  }
  return false;
}

/**
 * Fiches affichées dans « Fiches du jour » (Médecin) :
 * — hors embauche (écran dédié)
 * — hors fiches issues d'une liste « visites périodiques » (lien ligne VP)
 * — hors fiches / contextes surveillance SMS (module dédié)
 * — une visite périodique « hors liste » (sans ligne VP ni lien SMS) reste affichée.
 * @param {Record<string, unknown>} f
 */
export function isFicheMedecinFichesDuJour(f) {
  if (!f || typeof f !== 'object') return false;
  const tv = String(f.type_visite || '').trim().toUpperCase();
  if (tv === 'EMBAUCHE') {
    // Exclure les vraies fiches "embauche" (candidats RH) qui ont leur section dédiée.
    // Mais inclure les fiches de consultation créées depuis "Nouvelle fiche" qui ont été
    // (historiquement) enregistrées avec type_visite=EMBAUCHE par défaut.
    const hasCandidat =
      f.candidat != null
      || f.candidat_id != null
      || f.candidat_details != null
      || f.candidat_rh != null
      || f.candidat_rh_id != null;
    // Backend embauche : souvent `collaborateur=null` + `matricule` (snapshot embauche),
    // sans forcément exposer `candidat*` sur le serializer.
    const hasEmbaucheSnapshotMatricule =
      (f.collaborateur == null || f.collaborateur === '')
      && String(f.matricule ?? '').trim() !== '';
    if (hasCandidat || hasEmbaucheSnapshotMatricule) return false;
  }
  if (tv === 'SURVEILLANCE_SPECIALE') return false;
  if (tv.includes('SURVEILLANCE') && (tv.includes('SPEC') || tv.includes('SPECIAL') || tv.includes('SMS'))) {
    return false;
  }
  if (getLigneVisitePeriodiqueId(f) != null) return false;
  if (ficheALienSurveillanceSpeciale(f)) return false;

  /* Ancien filtre flux/type_liste à la racine : trop strict (ex. flux métier « MESSADINE », site, etc.)
     masquait les nouvelles consultations. L’exclusion VP repose sur ligne_visite_periodique + nested VP. */
  if (nestedListeFluxHorsVp(f)) return false;

  return true;
}

/** Tri « dernier consulté en premier » pour la liste médecin (timestamps API si présents). */
export function getFicheDerniereActiviteMs(f) {
  if (!f || typeof f !== 'object') return 0;
  const keys = ['updated_at', 'modified_at', 'date_modification', 'created_at', 'date_creation', 'date_visite'];
  for (const k of keys) {
    const v = f[k];
    if (v == null || v === '') continue;
    const t = new Date(v).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

export function sortFichesDuJourMedecin(list) {
  return [...(list || [])].sort((a, b) => {
    const d = getFicheDerniereActiviteMs(b) - getFicheDerniereActiviteMs(a);
    if (d !== 0) return d;
    const ida = Number(a.id);
    const idb = Number(b.id);
    if (Number.isFinite(ida) && Number.isFinite(idb) && ida !== idb) return idb - ida;
    return String(b.id).localeCompare(String(a.id));
  });
}
