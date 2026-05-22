/**
 * Style unique des boutons d’action principaux (comme « Modifier la fiche ») :
 * dégradé bleu vif, même padding, coins arrondis, ombre légère.
 */

export const PRIMARY_ACTION_GRADIENT = 'linear-gradient(135deg, #0ea5e9, #0369a1)';

export const PRIMARY_ACTION_SHADOW = '0 3px 12px rgba(14, 165, 233, 0.28)';

export function primaryActionButtonStyle(overrides = {}) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 'auto',
    minHeight: 36,
    padding: '7px 14px',
    background: PRIMARY_ACTION_GRADIENT,
    color: 'white',
    border: 'none',
    borderRadius: 9,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: PRIMARY_ACTION_SHADOW,
    transition: 'all .18s',
    ...overrides,
  };
}

export function primaryActionBtnEnter(e) {
  const t = e.currentTarget;
  if (t.disabled) return;
  t.style.background = '#0369a1';
  t.style.boxShadow = '0 4px 14px rgba(3, 105, 161, 0.32)';
  t.style.transform = 'translateY(-1px)';
}

export function primaryActionBtnLeave(e) {
  const t = e.currentTarget;
  if (t.disabled) return;
  t.style.background = PRIMARY_ACTION_GRADIENT;
  t.style.boxShadow = PRIMARY_ACTION_SHADOW;
  t.style.transform = 'none';
}
