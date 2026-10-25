/* PN-02 (auditoria Port Neutral 261025) · CoreContentProvider viu per damunt
   de la barrera de ruta (App.jsx): una llista mal formada d'un adaptador (un
   objecte on toca una llista, un null o un número dins) el feia petar en
   pintar (byId, pages.map) i tombava el Mas sencer. Només hi entren llistes, i
   dins, només objectes; una llista neta es torna igual que abans. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('./IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'A', actorKey: 'A' }) }));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'A' } }) }));
vi.mock('../../data/backendPort.js', () => ({ loadCoreContent: m.load }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('./UIContext.jsx', () => ({ useUIActions: () => ({ setGlobalStatus: vi.fn() }) }));
import { CoreContentProvider, useCoreContent } from './CoreContentContext.jsx';

const POBLE = '00000000-0000-4000-8000-00000000000a';

async function pinta(payload) {
  m.load.mockResolvedValueOnce(payload);
  const wrapper = ({ children }) => <CoreContentProvider config={{ tenantId: POBLE }}>{children}</CoreContentProvider>;
  const pintat = renderHook(useCoreContent, { wrapper });
  await waitFor(() => expect(pintat.result.current.status).toBe('ready'));
  return pintat.result.current;
}
afterEach(() => { cleanup(); m.load.mockReset(); });

test.each([
  ['towns és un objecte', { towns: { id: 't1' }, pages: [], agents: [] }],
  ['pages és un número i agents un text', { towns: [], pages: 7, agents: 'x' }],
  ['les llistes porten forats', { towns: [null, 7], pages: [null, 'x'], agents: [null] }]
])('PN-02 · %s: el contingut es pinta buit i el proveïdor no peta', async (_cas, payload) => {
  const value = await pinta(payload);
  expect(value).toMatchObject({ towns: [], sortedTowns: [], featuredTowns: [], pages: [], pageCopy: {}, agents: [] });
});

test('PN-02 · dels forats només es queden els objectes; una llista neta és la mateixa llista', async () => {
  const pagines = [{ id: 'consola', title: 'Consola' }];
  const value = await pinta({ towns: [null, { id: 't1', is_featured: true }, 'x'], pages: pagines, agents: [{ id: 'maria' }, 3] });
  expect(value.towns).toEqual([{ id: 't1', is_featured: true }]);
  expect(value.featuredTowns.map((poble) => poble.id)).toEqual(['t1']);
  expect(value.pages).toBe(pagines);
  expect(value.pageCopy.consola.title).toBe('Consola');
  expect(value.agents).toEqual([{ id: 'maria' }]);
});
