/* PRODNM-01 (R15b) · Una projecció del catàleg i la seua marca de retirada
   («Publicació retirada») són files de la secció 'mur', però no són cap
   publicació del Mur: no arriben a cap llista de MurContext i, per tant, ni
   a /calendari, ni a la Cerca, ni al perfil, ni al detall /mur/:id. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ load: vi.fn(), pagina: vi.fn() }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../data/backendPort.js', () => ({
  loadMur: (...args) => m.load(...args), appendSectionSubmissionNetworkOnly: async () => ({ id: 'new' }),
  loadSeccioPage: (...args) => m.pagina(...args), teCapacitat: (cap) => cap === 'paginacioSeccions'
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'A' }, generacio: 1 }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'A', actorKey: 'A' }) }));
vi.mock('../../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));
import { MurProvider, useMur } from './MurContext';
import { entradesDelCalendari } from '../calendari/calendariGlobal.js';

const config = { tenantId: '00000000-0000-0000-0000-000000000000' };
const wrapper = ({ children }) => <MurProvider config={config}>{children}</MurProvider>;
const OWNER = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const projeccio = (id, destins, title = 'Romer') => ({ id, ownerUserId: OWNER, sectionId: 'mur', title, created_at: '2026-11-10T09:00:00Z',
  projeccioCataleg: { v: 1, font: 'herbari', id: 'herbari-103-romer-reptant', destins, audiencia: 'publica' } });
const ids = (llista) => llista.map((element) => element.id);

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); m.pagina.mockReset(); });

test('les projeccions i les retirades no entren a cap llista del Mur', async () => {
  m.load.mockResolvedValue({
    feedPosts: [{ id: 'p1', title: 'Publicació de veritat', created_at: '2026-11-10T08:00:00Z' }, projeccio('pj-1', ['herbari']), projeccio('pj-2', [], 'Publicació retirada')],
    events: [projeccio('pj-3', ['mur'])], marketItems: [{ id: 'm1' }, projeccio('pj-4', ['mercat'])]
  });
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(ids(result.current.feedPosts)).toEqual(['p1']);
  expect(ids(result.current.sortedFeedPosts)).toEqual(['p1']);
  expect(ids(result.current.events)).toEqual([]);
  expect(ids(result.current.marketItems)).toEqual(['m1']);
  const calendari = entradesDelCalendari(result.current.sortedEvents, result.current.sortedFeedPosts, result.current.sortedMarketItems);
  expect(JSON.stringify(calendari)).not.toMatch(/Romer|Publicació retirada/);
});

test('una pàgina carregada després tampoc no hi porta cap projecció', async () => {
  m.load.mockResolvedValue({ feedPosts: [{ id: 'p1' }], events: [], marketItems: [], paginacio: { mur: 'c1' } });
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  m.pagina.mockResolvedValueOnce({ elements: [projeccio('pj-5', ['mur']), { id: 'p2' }], complete: true, nextCursor: null });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
});

test('sense cap projecció, la llista és la mateixa (cap còpia ni repintat de més)', async () => {
  const feedPosts = [{ id: 'p1' }, { id: 'p2' }];
  m.load.mockResolvedValue({ feedPosts, events: [], marketItems: [] });
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
});
