/* P1-71 (marató nocturna 261101, T5.1) · MultimediaProvider muntat FORA
   d'IdentitatProvider (el que deixa un remuntatge o una recàrrega en calent
   amb un context vell) no tomba /multimedia: carrega l'Arxiu com un visitant
   anònim (actorId null) i arriba a 'ready'. Desmuntar-lo i tornar-lo a muntar
   no el deixa penjat en 'loading'. Dins del proveïdor, res no canvia. Sense
   ErrorBoundary: si tornara a llançar, la prova cauria. Mateix patró que
   src/app/contexts/CoreContentContext.senseIdentitat.test.jsx. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const m = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: null }) }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIActions: () => ({ setGlobalStatus: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => ({
  loadMultimedia: m.load,
  getDefaultUserId: () => 'veina-de-prova',
  getProfile: vi.fn(async () => null),
  listMyOrganizations: vi.fn(async () => [])
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../mur/MurContext.jsx', () => ({ useMur: () => ({ feedPosts: [], marketItems: [], events: [] }) }));
/* G2-10 · La reserva anònima és la real de CoreContentContext.jsx (una sola font): només es falseja el contingut. */
vi.mock('../../app/contexts/CoreContentContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useCoreContent: () => ({ towns: [] })
}));
vi.mock('../../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));
import { MultimediaProvider, useMultimedia } from './MultimediaContext.jsx';
import { IdentitatProvider } from '../../app/contexts/IdentitatContext.jsx';

const POBLE = '00000000-0000-4000-8000-00000000000a';
const FOTO = { id: 'f1', title: 'Fira', src: '/assets/fira.jpg', created_at: '2026-09-02T10:00:00.000Z' };
const fora = ({ children }) => <MultimediaProvider config={{ tenantId: POBLE }}>{children}</MultimediaProvider>;
const dins = ({ children }) => (
  <IdentitatProvider config={{}}><MultimediaProvider config={{ tenantId: POBLE }}>{children}</MultimediaProvider></IdentitatProvider>
);

afterEach(() => { cleanup(); m.load.mockReset(); vi.restoreAllMocks(); });

test('fora d’IdentitatProvider no llança, no escriu cap error i carrega com a anònim (actorId null)', async () => {
  const errors = vi.spyOn(console, 'error');
  m.load.mockResolvedValue({ mediaItems: [FOTO] });
  const { result } = renderHook(useMultimedia, { wrapper: fora });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(m.load).toHaveBeenCalledTimes(1);
  expect(m.load.mock.calls[0][0]).toBeNull();
  expect(result.current.mediaItems).toEqual([FOTO]);
  expect(errors).not.toHaveBeenCalled();
});

test('desmuntar i tornar a muntar (fora i dins del proveïdor) torna a arribar a ready, sense quedar penjat ni cap error', async () => {
  const errors = vi.spyOn(console, 'error');
  m.load.mockResolvedValue({ mediaItems: [FOTO] });
  for (const wrapper of [fora, dins, fora]) {
    const primer = renderHook(useMultimedia, { wrapper });
    await waitFor(() => expect(primer.result.current.status).toBe('ready'));
    primer.unmount();
    const segon = renderHook(useMultimedia, { wrapper });
    await waitFor(() => expect(segon.result.current.status).toBe('ready'));
    expect(segon.result.current.mediaItems).toEqual([FOTO]);
    segon.unmount();
  }
  expect(errors).not.toHaveBeenCalled();
});

test('dins d’IdentitatProvider, l’actor és el del proveïdor (cap canvi de comportament)', async () => {
  const errors = vi.spyOn(console, 'error');
  m.load.mockResolvedValue({ mediaItems: [] });
  const { result } = renderHook(useMultimedia, { wrapper: dins });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(m.load).toHaveBeenCalled();
  expect(m.load.mock.calls.every(([actorId]) => actorId === 'veina-de-prova')).toBe(true);
  expect(errors).not.toHaveBeenCalled();
});
