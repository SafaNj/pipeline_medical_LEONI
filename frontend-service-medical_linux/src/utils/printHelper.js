/**
 * printHTML — imprime du HTML sans bloquer l'application React.
 *
 * Problème : sur Chrome/Edge, même avec un iframe caché,
 * l'appel à iframe.contentWindow.print() peut voler le focus
 * et onafterprint ne se déclenche pas si l'utilisateur annule.
 *
 * Solution :
 *  1. Iframe invisible — pas de nouvelle fenêtre popup
 *  2. Écoute matchMedia('print') pour détecter fin d'impression
 *  3. Timeout de sécurité (3s) pour forcer le nettoyage
 *  4. try/catch pour éviter tout crash silencieux
 *
 * @param {string} html - Le contenu HTML complet à imprimer
 */
export function printHTML(html) {
  // Supprimer un éventuel iframe précédent (impression précédente non nettoyée)
  const old = document.getElementById('__print_iframe__');
  if (old) {
    try { document.body.removeChild(old); } catch (_) {}
  }

  const iframe = document.createElement('iframe');
  iframe.id = '__print_iframe__';
  iframe.style.cssText = [
    'position:fixed',
    'top:-9999px',
    'left:-9999px',
    'width:1px',      // 1px au lieu de 0 — évite bug Chrome avec taille 0
    'height:1px',
    'border:0',
    'opacity:0',
    'pointer-events:none',
  ].join(';');

  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    } catch (_) {}
    clearTimeout(safetyTimer);
  };

  // Timeout de sécurité : nettoyage garanti même si annulation ou bug navigateur
  const safetyTimer = setTimeout(cleanup, 30000);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Double mécanisme de détection fin d'impression
  // 1. onafterprint (standard)
  iframe.contentWindow.onafterprint = cleanup;

  // 2. matchMedia fallback (Chrome parfois ne déclenche pas onafterprint)
  try {
    const mq = iframe.contentWindow.matchMedia('print');
    const mqHandler = (e) => {
      if (!e.matches) {
        mq.removeEventListener('change', mqHandler);
        // Petit délai pour laisser le navigateur finir
        setTimeout(cleanup, 500);
      }
    };
    mq.addEventListener('change', mqHandler);
  } catch (_) {}

  const win = iframe.contentWindow;

  // Attendre ressources (images + fonts) pour éviter PDF vide.
  const waitForResources = async () => {
    try {
      const images = Array.from(doc.images || []);
      await Promise.all(images.map((img) => new Promise((resolve) => {
        if (img.complete) return resolve();
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      })));
    } catch (_) {}
    try {
      if (doc.fonts && doc.fonts.ready) await doc.fonts.ready;
    } catch (_) {}
  };

  let printed = false;
  const triggerPrint = async () => {
    if (printed) return;
    printed = true;
    await waitForResources();
    setTimeout(() => {
      try {
        // focus() améliore la fiabilité d'impression (Edge/Chrome) sans popup
        try { win.focus(); } catch (_) {}
        win.print();
      } catch (e) {
        console.error('[printHTML] Erreur impression:', e);
        cleanup();
      }
    }, 150);
  };

  // 1) Sur la plupart des navigateurs, onload garantit que le DOM est prêt
  iframe.onload = () => { triggerPrint(); };
  // 2) Fallback si onload ne se déclenche pas (certains cas)
  setTimeout(() => { triggerPrint(); }, 600);
}