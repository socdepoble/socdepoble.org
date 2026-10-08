/* Ordre E del Mestre (261007, prompt 261007_1628: «no es pot posar el logotip
   damunt de l'H1») · El logotip que la persona puja amb «Editar logotip»
   (logoImage) viatja al Mur dins del payload com a logo_image, net pel
   sanejador del canal i, si és un mitjà privat, promogut al públic com la
   capçalera. Sense logotip no s'envia la clau (com l'emoticona). Fitxer
   propi: el gestor de desament (bgSaveManager) és d'àmbit de mòdul. */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn(), promou: vi.fn(), capacitats: new Set() }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: [], noteFolders: [], scopeKey: 'tenant-user', workspaceKey: 'session', config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, mouNota: vi.fn(), esborraNota: vi.fn()
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: null }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null }) }));
vi.mock('../../data/backendPort.js', () => ({
  promoteToPublic: (...args) => mocks.promou(...args),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat)
}));
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes } from './NotesContext';

const PRIVAT = 'sdp-media://mitjans_privats/tenant/U/logo.webp';
const PUBLIC = 'sdp-media://mitjans/tenant/U/logo.webp';

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.capacitats = new Set();
  mocks.promou.mockReset().mockImplementation(async (ref) => ref.replace('mitjans_privats/', 'mitjans/'));
  mocks.send.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
});
afterEach(cleanup);

const payloadEnviat = (index = 0) => mocks.send.mock.calls[index][0].payload;
const publica = async (nota) => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.publishNote(nota)).toBe(true); });
};

test('publishNote envia al Mur el logotip de la nota com a logo_image', async () => {
  await publica({ id: 'forn', title: 'Forn', content: '', revision: 1, logoImage: ' /assets/uploads/forn/logo.png ' });
  expect(payloadEnviat().logo_image).toBe('/assets/uploads/forn/logo.png');
});

test('un mitjà privat es promou al públic abans d’eixir, com la capçalera', async () => {
  mocks.capacitats = new Set(['mitjans']);
  await publica({ id: 'privat', title: 'Forn', content: '', revision: 1, logoImage: PRIVAT });
  expect(mocks.promou).toHaveBeenCalledWith(PRIVAT, expect.anything());
  expect(payloadEnviat().logo_image).toBe(PUBLIC);
});

test('un mitjà que ja és públic no es torna a promoure', async () => {
  mocks.capacitats = new Set(['mitjans']);
  await publica({ id: 'public', title: 'Forn', content: '', revision: 1, logoImage: PUBLIC });
  expect(mocks.promou).not.toHaveBeenCalled();
  expect(payloadEnviat().logo_image).toBe(PUBLIC);
});

test('sense logotip, o amb una font que no és segura, el payload no porta la clau', async () => {
  await publica({ id: 'sense', title: 'T', content: '', revision: 1 });
  expect(payloadEnviat()).not.toHaveProperty('logo_image');
  cleanup();
  mocks.send.mockClear();
  await publica({ id: 'brossa', title: 'T', content: '', revision: 1, logoImage: 'javascript:alert(1)' });
  expect(payloadEnviat()).not.toHaveProperty('logo_image');
});
