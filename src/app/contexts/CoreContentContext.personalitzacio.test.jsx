/* Onada 11 (261010; prompt 261010_1730, tasca 2) · CoreContentProvider i la
   personalització del poble: amb `personalitzacio` null el value és idèntic
   al d'abans (Llei del Píxel); amb una taxonomia vàlida només canvien les
   labels de les pàgines nomenades, i el camp sencer s'exposa. */
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
const PAGES = [
  { id: 'consola', key: 'consola', title: 'Consola Termodinàmica', labels: [{ text: 'Sistema', className: 'sdp-badge-category' }, { text: 'Manteniment', className: 'sdp-badge-tag' }] },
  { id: 'cervell', key: 'cervell', title: 'El Cervell', labels: [{ text: 'Sistema', className: 'sdp-badge-category' }] }
];
const TOWNS = [{ id: 't1', name: 'La Torre', is_featured: true }];
const AGENTS = [{ id: 'maria' }];

/* El value que construïa el proveïdor abans de l'Onada 11, amb els mateixos càlculs. */
const valueDAbans = (payload, { status, error, errorRevalidacio, refresh }) => ({
  status, error, errorRevalidacio,
  towns: payload.towns, sortedTowns: expect.any(Array), featuredTowns: expect.any(Array),
  pages: payload.pages,
  pageCopy: Object.fromEntries(payload.pages.map((page) => [page.id, { ...page }])),
  agents: payload.agents, ownerUserId: payload.ownerUserId, refresh
});

async function pinta(payload) {
  m.load.mockResolvedValueOnce(payload);
  const wrapper = ({ children }) => <CoreContentProvider config={{ tenantId: POBLE }}>{children}</CoreContentProvider>;
  const pintat = renderHook(useCoreContent, { wrapper });
  await waitFor(() => expect(pintat.result.current.status).toBe('ready'));
  return pintat.result.current;
}
afterEach(() => { cleanup(); m.load.mockReset(); });

test('sense personalització (null o absent), el value és el d’abans més el camp `personalitzacio: null`', async () => {
  for (const extra of [{}, { personalitzacio: null }, { personalitzacio: { taxonomia: null, estil: null } }]) {
    const payload = { towns: TOWNS, pages: PAGES, pageCopy: {}, agents: AGENTS, ownerUserId: 'A', ...extra };
    const value = await pinta(payload);
    const { personalitzacio, ...resta } = value;
    expect(resta).toEqual(valueDAbans(payload, value));
    expect(personalitzacio).toEqual(extra.personalitzacio ?? null);
    expect(value.pageCopy.consola.labels).toEqual(PAGES[0].labels);
    cleanup();
  }
});

test('amb una taxonomia vàlida només canvien les labels de les pàgines que nomena, i `personalitzacio` porta el camp sencer', async () => {
  const personalitzacio = {
    taxonomia: { payload: { v: 1, pagines: { consola: { labels: [{ text: 'Maquinària', className: 'sdp-badge-system' }] } }, categories: ['Festes'] }, versio: 3 },
    estil: null
  };
  const value = await pinta({ towns: TOWNS, pages: PAGES, pageCopy: {}, agents: AGENTS, ownerUserId: 'A', personalitzacio });
  expect(value.pageCopy.consola.labels).toEqual([{ text: 'Maquinària', className: 'sdp-badge-system' }]);
  expect(value.pageCopy.consola.title).toBe('Consola Termodinàmica');
  expect(value.pageCopy.cervell).toEqual({ ...PAGES[1] });
  expect(value.personalitzacio).toBe(personalitzacio);
  expect(value.towns).toBe(TOWNS);
  expect(value.agents).toBe(AGENTS);
});

test('una taxonomia que no té la forma no toca el pageCopy', async () => {
  const value = await pinta({ towns: [], pages: PAGES, pageCopy: {}, agents: [], ownerUserId: 'A', personalitzacio: { taxonomia: { payload: { v: 2, pagines: { consola: { labels: [] } } }, versio: 1 }, estil: null } });
  expect(value.pageCopy.consola.labels).toEqual(PAGES[0].labels);
});

test('sense proveïdor, useCoreContent porta `personalitzacio: null`', () => {
  const { result } = renderHook(useCoreContent);
  expect(result.current).toEqual({ status: 'loading', towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [], personalitzacio: null });
});
