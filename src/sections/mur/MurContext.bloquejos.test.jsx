/* Fase D (261020, tasca 2; pla 261020_1300) · El que has bloquejat no es
   veu enlloc on es llig useMur: MurContext ho filtra UNA vegada, al valor,
   amb esElementBloquejat de ProveidorModeracio (ací, un valor de prova). Sense
   proveïdor, o sense cap bloqueig, les MATEIXES llistes; les pàgines i el
   cursor de «Carregar-ne més» no es toquen. */
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
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
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { clauDeBloqueig, elementBloquejat } from '../../config/moderacio.js';

const config = { tenantId: '00000000-0000-0000-0000-000000000000' };
const DE_PEPA = { id: 'p1', title: 'De Pepa', ownerUserId: 'pepa' };
const DEL_FORN = { id: 'p2', title: 'Del Forn', author_org_id: 'forn', ownerUserId: 'pepa' };
const DE_JOAN = { id: 'p3', title: 'De Joan', ownerUserId: 'joan' };
const MERCAT = { id: 'm1', name: 'Mel', ownerUserId: 'pepa' };
const ACTE = { id: 'e1', title: 'Fira', ownerUserId: 'pepa' };
const ambBloquejos = (...claus) => {
  const conjunt = new Set(claus);
  return { esElementBloquejat: (item) => elementBloquejat(item, conjunt) };
};
const embolcall = (moderacio) => function Embolcall({ children }) {
  const mur = <MurProvider config={config}>{children}</MurProvider>;
  return moderacio === undefined ? mur : <ModeracioContext.Provider value={moderacio}>{mur}</ModeracioContext.Provider>;
};
async function llig(moderacio) {
  const vista = renderHook(useMur, { wrapper: embolcall(moderacio) });
  await waitFor(() => expect(vista.result.current.status).toBe('ready'));
  return vista.result.current;
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  m.load.mockResolvedValue({ feedPosts: [DE_PEPA, DEL_FORN, DE_JOAN], marketItems: [MERCAT], events: [ACTE], paginacio: { mur: 'cursor-1' } });
});

test('Mur, Mercat i Agenda (i les seues llistes ordenades) amaguen el de la persona bloquejada, no el de la seua entitat', async () => {
  const mur = await llig(ambBloquejos(clauDeBloqueig('persona', 'pepa')));
  expect(mur.feedPosts.map((p) => p.id)).toEqual(['p2', 'p3']);
  expect(mur.sortedFeedPosts.map((p) => p.id)).toEqual(expect.arrayContaining(['p2', 'p3']));
  expect(mur.sortedFeedPosts).toHaveLength(2);
  expect(mur.marketItems).toEqual([]);
  expect(mur.sortedMarketItems).toEqual([]);
  expect(mur.events).toEqual([]);
  expect(mur.sortedEvents).toEqual([]);
});

test('bloquejar l’entitat amaga el de l’entitat', async () => {
  const mur = await llig(ambBloquejos(clauDeBloqueig('entitat', 'forn')));
  expect(mur.feedPosts.map((p) => p.id)).toEqual(['p1', 'p3']);
});

test('sense proveïdor, o sense cap bloqueig, les MATEIXES llistes; el cursor del Mur no canvia', async () => {
  const sense = await llig(undefined);
  const buit = await llig(ambBloquejos());
  const nul = await llig(null);
  for (const mur of [sense, buit, nul]) {
    expect(mur.feedPosts.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(mur.hiHaMes('mur')).toBe(true);
  }
  const amb = await llig(ambBloquejos(clauDeBloqueig('persona', 'pepa')));
  expect(amb.hiHaMes('mur')).toBe(true);
});

test('la MATEIXA referència de la llista quan el filtre no en lleva cap', async () => {
  const vista = renderHook(useMur, { wrapper: embolcall(ambBloquejos(clauDeBloqueig('persona', 'ningu'))) });
  await waitFor(() => expect(vista.result.current.status).toBe('ready'));
  const { feedPosts } = vista.result.current;
  vista.rerender();
  expect(vista.result.current.feedPosts).toBe(feedPosts);
});
