/* Pla 261029_1605 (Bloc G, P1-71) · CoreContentProvider muntat FORA
   d'IdentitatProvider (el que deixa una recàrrega en calent amb un context
   vell) no tomba el Mas: carrega el contingut core del poble com un visitant
   anònim. Dins del proveïdor, res no canvia. Sense ErrorBoundary: si
   tornara a llançar, la prova cauria. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: null }) }));
vi.mock('./UIContext.jsx', () => ({ useUIActions: () => ({ setGlobalStatus: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => ({
  loadCoreContent: m.load,
  getDefaultUserId: () => 'veina-de-prova',
  getProfile: vi.fn(async () => null),
  listMyOrganizations: vi.fn(async () => [])
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
import { CoreContentProvider, useCoreContent } from './CoreContentContext.jsx';
import { IdentitatProvider } from './IdentitatContext.jsx';

const POBLE = '00000000-0000-4000-8000-00000000000a';
afterEach(() => { cleanup(); m.load.mockReset(); vi.restoreAllMocks(); });

test('fora d’IdentitatProvider no llança, no escriu cap error i carrega com a anònim (actorId null)', async () => {
  const errors = vi.spyOn(console, 'error');
  m.load.mockResolvedValue({ towns: [{ id: 't1' }], pages: [], agents: [] });
  const wrapper = ({ children }) => <CoreContentProvider config={{ tenantId: POBLE }}>{children}</CoreContentProvider>;
  const { result } = renderHook(useCoreContent, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(m.load).toHaveBeenCalledTimes(1);
  expect(m.load.mock.calls[0][0]).toBeNull();
  expect(result.current.towns).toEqual([{ id: 't1' }]);
  expect(errors).not.toHaveBeenCalled();
});

test('dins d’IdentitatProvider, l’actor és el del proveïdor (cap canvi de comportament)', async () => {
  const errors = vi.spyOn(console, 'error');
  m.load.mockResolvedValue({ towns: [], pages: [], agents: [] });
  const wrapper = ({ children }) => (
    <IdentitatProvider config={{}}><CoreContentProvider config={{ tenantId: POBLE }}>{children}</CoreContentProvider></IdentitatProvider>
  );
  const { result } = renderHook(useCoreContent, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(m.load).toHaveBeenCalled();
  expect(m.load.mock.calls.every(([actorId]) => actorId === 'veina-de-prova')).toBe(true);
  expect(errors).not.toHaveBeenCalled();
});
