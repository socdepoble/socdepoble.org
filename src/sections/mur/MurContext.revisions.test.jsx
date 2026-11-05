/* P0-25 (Onada R6, Bloc 2) · Les revisions editorials de la llavor i dels
   actes desades des de /notes (revisionsEditorials.js): useMur les posa a
   feedPosts i events a l'instant, sense recarregar, també quan les desa una
   altra pestanya; trobaElement (el detall /mur/:id i /events/:id, Connectar i
   el lector del MAS) torna l'element revisat. */
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../data/backendPort.js', () => ({
  loadMur: (...args) => m.load(...args), appendSectionSubmissionNetworkOnly: vi.fn(), loadSeccioPage: vi.fn(),
  teCapacitat: (cap) => cap === 'paginacioSeccions'
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'A' }, generacio: 1 }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'A', actorKey: 'A' }) }));
vi.mock('../../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));
import { MurProvider, useMur } from './MurContext';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { _reiniciaRevisionsEditorialsPerAProves, desaRevisioEditorial } from '../../data/revisionsEditorials.js';
import { trobaElement } from '../detail/elementDeSeccio.js';

const config = { tenantId: '00000000-0000-0000-0000-000000000000' };
const MANIFEST = { id: 'manifest-de-poble', slug: 'manifest-de-poble', title: 'Manifest de Poble', entradilla: 'Resum', content: 'Text pla vell' };
const ALTRE = { id: 'p2', title: 'Altre' };
const APLEC = { id: 'aplec-2023', title: '2n Aplec pel Territori', content: '<p>Vell</p>' };
const embolcall = ({ children }) => <MurProvider config={config}>{children}</MurProvider>;

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  _reiniciaRevisionsEditorialsPerAProves();
  m.load.mockResolvedValue({ feedPosts: [MANIFEST, ALTRE], marketItems: [], events: [APLEC], paginacio: {} });
});

test('sense revisions, les MATEIXES files; desar-ne una la pinta al Mur i a l’agenda sense recarregar', async () => {
  const vista = renderHook(useMur, { wrapper: embolcall });
  await waitFor(() => expect(vista.result.current.status).toBe('ready'));
  expect(vista.result.current.feedPosts[0]).toBe(MANIFEST);
  act(() => { desaRevisioEditorial('mur', 'manifest-de-poble', { content: '<p>Manifest revisat.</p>', title: 'Manifest (rev.)' }); });
  expect(vista.result.current.feedPosts[0]).toMatchObject({ id: 'manifest-de-poble', content: '<p>Manifest revisat.</p>', title: 'Manifest (rev.)' });
  expect(vista.result.current.feedPosts[1]).toBe(ALTRE);
  expect(vista.result.current.sortedFeedPosts.find((p) => p.id === 'manifest-de-poble').content).toBe('<p>Manifest revisat.</p>');
  act(() => { desaRevisioEditorial('events', 'aplec-2023', { content: '<p>Crònica revisada.</p>' }); });
  expect(vista.result.current.events[0].content).toBe('<p>Crònica revisada.</p>');
  expect(m.load).toHaveBeenCalledTimes(1);
});

test('el detall: trobaElement torna l’element revisat (per id, per slug i per l’àlies de l’Aplec), i el mateix objecte si ja la porta', async () => {
  const vista = renderHook(useMur, { wrapper: embolcall });
  await waitFor(() => expect(vista.result.current.status).toBe('ready'));
  act(() => { desaRevisioEditorial('mur', 'manifest-de-poble', { content: '<p>Revisat.</p>' }); });
  act(() => { desaRevisioEditorial('events', 'aplec-2023', { content: '<p>Aplec revisat.</p>' }); });
  const mur = { listPath: '/mur', items: vista.result.current.feedPosts };
  expect(trobaElement(mur, 'manifest-de-poble')).toBe(vista.result.current.feedPosts[0]);
  expect(trobaElement({ listPath: '/mur', items: [MANIFEST] }, 'manifest-de-poble').content).toBe('<p>Revisat.</p>');
  expect(trobaElement({ listPath: '/calendari', items: [APLEC] }, 'aplec-pel-territori-2023').content).toBe('<p>Aplec revisat.</p>');
  expect(trobaElement({ listPath: '/mercat', items: [MANIFEST] }, 'manifest-de-poble')).toBe(MANIFEST);
});

test('una revisió desada en una altra pestanya arriba per l’esdeveniment `storage`', async () => {
  const vista = renderHook(useMur, { wrapper: embolcall });
  await waitFor(() => expect(vista.result.current.status).toBe('ready'));
  const clau = `${STORAGE_PREFIX}publicacions.revisions.v1`;
  window.localStorage.setItem(clau, JSON.stringify({ 'mur:manifest-de-poble': { camps: { content: '<p>D’una altra pestanya.</p>' } } }));
  act(() => { window.dispatchEvent(new StorageEvent('storage', { key: clau })); });
  expect(vista.result.current.feedPosts[0].content).toBe('<p>D’una altra pestanya.</p>');
});
