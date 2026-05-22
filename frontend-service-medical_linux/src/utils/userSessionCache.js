function shouldRemoveKey(key) {
  if (!key) return false;
  return (
    key.startsWith('infirmier_embauche_last_count') ||
    key.startsWith('infirmier_vp_last_count') ||
    key.startsWith('vp_liste_seq_') ||
    key.startsWith('cache:listes:embauche:') ||
    key.startsWith('cache:listes:vp:')
  );
}

export function getUserCacheIdentity(userLike = {}) {
  return String(
    userLike?.user_id ?? userLike?.id ?? userLike?.username ?? 'anonymous',
  );
}

export function buildUserScopedStorageKey(baseKey, userLike = {}) {
  return `${baseKey}:${getUserCacheIdentity(userLike)}`;
}

export function clearFrontendSessionStorage({ preserveAuth = false } = {}) {
  const keys = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key) keys.push(key);
  }

  keys.forEach((key) => {
    if (shouldRemoveKey(key)) {
      window.localStorage.removeItem(key);
    }
  });

  window.sessionStorage.clear();

  if (!preserveAuth) {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('refresh');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('userSiteId');
    window.localStorage.removeItem('userSiteName');
  }
}