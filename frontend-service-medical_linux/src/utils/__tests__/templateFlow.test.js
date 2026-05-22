import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveSiteTemplate, resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../siteTemplateResolver';
import { buildFichePayloadByTemplate } from '../ficheTemplate';
import { buildNormalizedAuthUser, updateStoredUserFromToken } from '../authSiteContext';
import { resolveFichePrintTemplate } from '../fichePrintTemplate';

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
    _store: store,
  };
}

describe('Template flow', () => {
  beforeEach(() => {
    const storage = createStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
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

  it('resout la branche formulaire depuis le site template key login', () => {
    const branch = resolveSiteTemplate('SOUSSE', '', 'Leoni Massadine');
    expect(branch).toBe(SITE_TEMPLATE_BRANCH.MESSADINE);

    const sourceBranch = resolveSiteTemplateFromSources({ site_template_key: 'MONASTIR', site_nom: 'Menzel Hayet' });
    expect(sourceBranch).toBe(SITE_TEMPLATE_BRANCH.MENZEL);
  });

  it('construit payload create selon template', () => {
    const common = {
      date_visite: '2026-04-14',
      type_visite: 'PERIODIQUE',
      aptitude: 'APTE_AU_POSTE',
      precision_aptitude: 'RAS',
      numero_cnss: '12345',
      collaborateur: 99,
      matricule: 'M001',
      raison_sociale: 'Leoni',
      nature_activite: 'Cablage',
      adresse_entreprise: 'Sousse',
      numero_cnss_entreprise: '9988',
      qualifications: 'Operateur',
    };

    const messadinePayload = buildFichePayloadByTemplate({
      templateBranch: SITE_TEMPLATE_BRANCH.MESSADINE,
      ...common,
    });
    expect(messadinePayload.raison_sociale).toBeUndefined();

    const menzelPayload = buildFichePayloadByTemplate({
      templateBranch: SITE_TEMPLATE_BRANCH.MENZEL,
      ...common,
    });
    expect(menzelPayload.raison_sociale).toBe('Leoni');
    expect(menzelPayload.qualifications).toBe('Operateur');
  });

  it('persiste site template apres refresh token', () => {
    const oldUser = {
      username: 'nadia',
      site_id: 2,
      site_nom: 'Leoni Massadine',
      site_template_key: 'SOUSSE',
    };
    localStorage.setItem('user', JSON.stringify(oldUser));

    const token = makeJwt({
      user_id: 10,
      site_id: 2,
      site_nom: 'Leoni Massadine',
      site_template_key: 'SOUSSE',
    });

    const normalized = buildNormalizedAuthUser(oldUser, token);
    expect(normalized.site_template_key).toBe('SOUSSE');
    expect(normalized.site_template_branch).toBe(SITE_TEMPLATE_BRANCH.MESSADINE);

    updateStoredUserFromToken(token);
    const persisted = JSON.parse(localStorage.getItem('user'));
    expect(persisted.site_template_branch).toBe(SITE_TEMPLATE_BRANCH.MESSADINE);
  });

  it('selectionne le bon template PDF', () => {
    const messadinePrint = resolveFichePrintTemplate({ site_template_key: 'SOUSSE', site_nom: 'Leoni Massadine' });
    expect(messadinePrint).toBe('MESSADINE');

    const menzelPrint = resolveFichePrintTemplate({ site_template_key: 'MONASTIR', site_nom: 'Menzel Hayet' });
    expect(menzelPrint).toBe('MENZEL');
  });
});
