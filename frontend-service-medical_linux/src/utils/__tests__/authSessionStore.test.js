import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyRefreshClaims,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setTokens,
} from '../authSessionStore';

function makeJwt(payload) {
  const header = { alg: 'none', typ: 'JWT' };
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode(header)}.${encode(payload)}.`;
}

function createStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: vi.fn((k) => (k in store ? store[k] : null)),
    setItem: vi.fn((k, v) => {
      store[k] = String(v);
    }),
    removeItem: vi.fn((k) => {
      delete store[k];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    key: vi.fn((i) => Object.keys(store)[i] || null),
    get length() {
      return Object.keys(store).length;
    },
    _store: store,
  };
}

describe('authSessionStore', () => {
  beforeEach(() => {
    const local = createStorage();
    const session = createStorage();

    Object.defineProperty(globalThis, 'localStorage', {
      value: local,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'sessionStorage', {
      value: session,
      configurable: true,
      writable: true,
    });

    if (!globalThis.atob) {
      Object.defineProperty(globalThis, 'atob', {
        value: (value) => Buffer.from(value, 'base64').toString('binary'),
        configurable: true,
      });
    }
  });

  it('centralise access/refresh via helpers', () => {
    setTokens({ access: 'a1', refresh: 'r1' });

    expect(getAccessToken()).toBe('a1');
    expect(getRefreshToken()).toBe('r1');

    // Rotation refresh supported.
    setTokens({ access: 'a2', refresh: 'r2' });
    expect(getAccessToken()).toBe('a2');
    expect(getRefreshToken()).toBe('r2');
  });

  it('met a jour les claims user apres refresh', () => {
    const initialUser = {
      username: 'nadia',
      user_id: 10,
      role: 'medecin',
      site_id: 1,
      site_nom: 'Menzel Hayet',
      site_template_key: 'MONASTIR',
    };

    localStorage.setItem('user', JSON.stringify(initialUser));

    const access = makeJwt({
      user_id: 10,
      site_id: 2,
      site_nom: 'Leoni Massadine',
      site_template_key: 'SOUSSE',
    });

    setTokens({ access, refresh: 'r1' });

    const out = applyRefreshClaims({
      access,
      role: 'medecin',
      med_type: 'travail',
      must_change_password: false,
      user_id: 10,
      site_id: 2,
      site_nom: 'Leoni Massadine',
      site_template_key: 'SOUSSE',
      username: 'nadia',
    });

    expect(out.identityChanged).toBe(false);

    const persisted = getStoredUser();
    expect(persisted.site_id).toBe(2);
    expect(persisted.site_template_key).toBe('SOUSSE');
    expect(persisted.med_type).toBe('travail');
  });

  it('detecte changement identite apres refresh', () => {
    const access = makeJwt({ user_id: 11, site_id: 2, site_nom: 'Leoni Massadine', site_template_key: 'SOUSSE' });
    localStorage.setItem('user', JSON.stringify({ user_id: 10, username: 'nadia' }));
    setTokens({ access, refresh: 'r1' });

    const out = applyRefreshClaims({ access, user_id: 11, username: 'sallem' });
    expect(out.identityChanged).toBe(true);
  });

  it('nettoie la session au logout', () => {
    setTokens({ access: 'a1', refresh: 'r1' });
    localStorage.setItem('user', JSON.stringify({ user_id: 10 }));
    localStorage.setItem('userSiteId', '2');
    localStorage.setItem('userSiteName', 'Leoni Massadine');

    clearSession();

    expect(getAccessToken()).toBe('');
    expect(getRefreshToken()).toBe('');
    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem('userSiteId')).toBeNull();
  });
});
