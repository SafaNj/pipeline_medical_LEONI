/**
 * Paramètre de requête `horizon_jours` (liste des collaborateurs à risquer dans la fenêtre).
 * Défaut **30** pour le libellé « bientôt / J-30 » ; le RH peut passer à 365 via le sélecteur.
 * L’anticipation métier sur la date d’échéance reste souvent plafonnée côté calcul VP (ex. 90 j.)
 * — le backend peut la renvoyer dans `anticipation_echeance_utilisee_jours`.
 *
 * GET …/fiches-aptitude/alertes-visite-periodique-rh/?horizon_jours=…
 */
export const VP_ALERT_HORIZON_JOURS_DEFAULT = 30;

/** Valeurs proposées dans l’UI RH (jours). */
export const VP_ALERT_HORIZON_OPTIONS = [30, 60, 90, 180, 365];

const LS_KEY = 'rh_vp_alert_horizon_jours';

export function getVpAlertHorizonJours() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw == null || raw === '') return VP_ALERT_HORIZON_JOURS_DEFAULT;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return VP_ALERT_HORIZON_JOURS_DEFAULT;
    return Math.min(n, 3660);
  } catch {
    return VP_ALERT_HORIZON_JOURS_DEFAULT;
  }
}

export function setVpAlertHorizonJours(days) {
  const n = typeof days === 'number' ? days : parseInt(String(days), 10);
  if (!Number.isFinite(n) || n < 1) return;
  try {
    localStorage.setItem(LS_KEY, String(Math.min(n, 3660)));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rh-vp-horizon-changed'));
  }
}
