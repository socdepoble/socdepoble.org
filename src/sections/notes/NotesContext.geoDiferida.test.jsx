/* P1-20 · D15 (Assalt 10/10, T4a, 261101) · geoDeLesFotos.js (i l'EXIF que
   arrossega) ja no és al tros d'entrada: publishNote el demana amb import()
   només quan publica una nota pròpia. Si el tros no baixa, o no arriba en
   4 s, la publicació ix igual, sense cap clau de geo (la mateixa regla que
   una lectura fallida o lenta: publicar no s'atura mai per la geo).
   El camí bo (el tros baixa i hi ha geo) és a NotesContext.geoDeLesFotos.test.jsx. */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn(), promou: vi.fn(), resol: vi.fn(), capacitats: new Set(), demanat: 0, penja: false }));
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
  resolveAsset: (...args) => mocks.resol(...args),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat)
}));
/* Cada intent d'importar el tros passa per ací (Vitest torna a cridar la
   fàbrica si l'anterior ha fallat): `demanat` compta qui l'ha demanat. Un
   import estàtic a NotesContext.jsx faria caure tot el fitxer. Amb `penja`,
   el tros no arriba mai (una xarxa encallada). */
vi.mock('./geoDeLesFotos.js', () => {
  mocks.demanat += 1;
  if (mocks.penja) return new Promise(() => {});
  throw new Error('El tros de la geo no ha baixat.');
});
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes } from './NotesContext';

const COS = '<p>La font</p><img src="/assets/uploads/notes/font.webp" alt="Font" data-lat="38.592" data-lng="-0.418" data-precisio="100m" data-captura="2017-05-14T10:22:33">';

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.capacitats = new Set();
  mocks.promou.mockReset().mockImplementation(async (ref) => ref.replace('mitjans_privats/', 'mitjans/'));
  mocks.resol.mockReset();
  mocks.send.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
});
afterEach(cleanup);

test('si el tros de la geo no baixa, la nota es publica igual i sense fotos_geo, geolocalitzacio ni dataCaptura', async () => {
  const abans = mocks.demanat;
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.publishNote({ id: 'font', title: 'La font', content: COS, revision: 1, coverImage: 'data:image/jpeg;base64,AAAA' })).toBe(true); });
  expect(mocks.demanat - abans).toBe(1);
  expect(mocks.send).toHaveBeenCalledTimes(1);
  const payload = mocks.send.mock.calls[0][0].payload;
  expect(payload.content).toContain('font.webp');
  for (const clau of ['fotos_geo', 'geolocalitzacio', 'dataCaptura']) expect(payload).not.toHaveProperty(clau);
  expect(mocks.toast).toHaveBeenCalledWith('Nota publicada correctament al mur!', 'success');
});

test('compartir no demana mai el tros de la geo', async () => {
  const abans = mocks.demanat;
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.compartirNota({ id: 'altri', title: 'Altri', content: COS, revision: 1 })).toBe(true); });
  expect(mocks.demanat - abans).toBe(0);
  expect(mocks.send).toHaveBeenCalledTimes(1);
  expect(mocks.send.mock.calls[0][0].payload).not.toHaveProperty('fotos_geo');
});

/* L'últim del fitxer: una fàbrica que no torna mai deixa el mòdul penjat per
   a qualsevol import posterior. Només es fingixen setTimeout i clearTimeout:
   les promeses i la resta del rellotge corren de veres. */
test('si el tros de la geo no arriba mai, la publicació no l’espera més de 4 s: ix igual, sense cap clau de geo', async () => {
  mocks.penja = true;
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try {
    const abans = mocks.demanat;
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let publicada = false;
    let resultat;
    act(() => {
      resultat = result.current.publishNote({ id: 'lenta', title: 'La font', content: COS, revision: 1, coverImage: 'data:image/jpeg;base64,AAAA' })
        .then((valor) => { publicada = true; return valor; });
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(3999); });
    // Ha demanat el tros i encara l'espera: no hi ha cap termini més curt.
    expect(mocks.demanat - abans).toBe(1);
    expect(publicada).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(await resultat).toBe(true);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    const payload = mocks.send.mock.calls[0][0].payload;
    expect(payload.content).toContain('font.webp');
    for (const clau of ['fotos_geo', 'geolocalitzacio', 'dataCaptura']) expect(payload).not.toHaveProperty(clau);
    expect(mocks.toast).toHaveBeenCalledWith('Nota publicada correctament al mur!', 'success');
  } finally {
    vi.useRealTimers();
  }
});
