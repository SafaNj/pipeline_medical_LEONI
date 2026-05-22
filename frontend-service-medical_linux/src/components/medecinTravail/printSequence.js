const DEFAULT_PAD = 4;

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase();
}

export function getNextPrintSequence(options) {
  const opts = options || {};
  const formCode = normalizeKey(opts.formCode || 'FORM');
  const templateKey = normalizeKey(opts.templateKey || 'MONASTIR');
  const siteId = String(opts.siteId || 'global').trim();
  const year = String(new Date().getFullYear());
  const pad = Number.isFinite(opts.pad) ? opts.pad : DEFAULT_PAD;
  const prefix = String(opts.prefix || formCode).trim();
  const storageKey = ['print-seq', templateKey, formCode, siteId, year].join(':');

  if (typeof window === 'undefined') {
    return `${prefix}-${year}-0001`;
  }

  const raw = window.localStorage.getItem(storageKey);
  const current = Number.parseInt(raw || '0', 10);
  const next = Number.isFinite(current) && current > 0 ? current + 1 : 1;
  window.localStorage.setItem(storageKey, String(next));

  return `${prefix}-${year}-${String(next).padStart(pad, '0')}`;
}
