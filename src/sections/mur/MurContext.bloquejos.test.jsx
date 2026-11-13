/* Fase D (261020, tasca 2; pla 261020_1300) · El que has bloquejat no es
   veu enlloc on es llig useMur: MurContext ho filtra UNA vegada, al valor,
   amb esElementBloquejat de ProveidorModeracio (ací, un valor de prova). Sense
   proveïdor, o sense cap bloqueig, les MATEIXES llistes; les pàgines i el
   cursor de «Carregar-ne més» no es toquen. */
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

/* Gauntlet R22 (notes-04) · versioBloquejos és frescor, no identitat: un bloqueig nou no torna el Mur a «Carregant»,
   no avorta cap publicació en vol i revalida en segon pla, descartant les pàgines extres. */
test('un bloqueig nou revalida en segon pla: el Mur no passa per «loading» i l’«Actualitzar al Mur» en vol no s’avorta', async () => {
  const { appendSectionSubmissionNetworkOnly, loadSeccioPage } = await import('../../data/backendPort.js');
  let moderacio = { ...ambBloquejos(), versioBloquejos: 0 };
  const Embolcall = ({ children }) => (
    <ModeracioContext.Provider value={moderacio}><MurProvider config={config}>{children}</MurProvider></ModeracioContext.Provider>
  );
  const estats = [];
  const vista = renderHook(() => { const mur = useMur(); estats.push(mur.status); return mur; }, { wrapper: Embolcall });
  await waitFor(() => expect(vista.result.current.status).toBe('ready'));
  // Una pàgina de «Mostra més» ja carregada.
  loadSeccioPage.mockResolvedValueOnce({ elements: [{ id: 'p9', title: 'Extra', ownerUserId: 'pepa' }], complete: true, nextCursor: null });
  await vista.result.current.carregaMes('mur');
  await waitFor(() => expect(vista.result.current.feedPosts.map((p) => p.id)).toContain('p9'));
  // Una publicació en vol que el servidor confirma després del bloqueig.
  let confirma;
  appendSectionSubmissionNetworkOnly.mockImplementationOnce(() => new Promise((resolve) => { confirma = resolve; }));
  const enVol = vista.result.current.sendSectionSubmission({ id: 'nova', sectionId: 'mur', payload: {} });
  const carreguesAbans = m.load.mock.calls.length;
  estats.length = 0;
  moderacio = { ...ambBloquejos(clauDeBloqueig('persona', 'joan')), versioBloquejos: 1 };
  vista.rerender();
  await waitFor(() => expect(m.load.mock.calls.length).toBeGreaterThan(carreguesAbans));
  expect(estats).not.toContain('loading');
  await waitFor(() => expect(vista.result.current.feedPosts.map((p) => p.id)).toEqual(['p1', 'p2']));
  confirma({ id: 'nova' });
  await expect(enVol).resolves.toEqual({ id: 'nova' });
});

/* Gauntlet R22 (ronda 3, notes-04) · Un «Mostra més» clicat mentre arriba la revalidació d'un bloqueig per UUID no
   desa la primera pàgina VELLA a les extres: quan la revalidació mou la cua, extresVigents la tornaria a afegir, i
   amb ella les altres publicacions de qui s'ha bloquejat (el client només en coneix la bloquejada). */
test('«Mostra més» durant la revalidació d’un bloqueig: la primera pàgina vella no torna a eixir quan arriba la nova', async () => {
  const { loadSeccioPage } = await import('../../data/backendPort.js');
  const ALTRA_DE_PEPA = { id: 'p4', title: 'Una altra de Pepa', ownerUserId: 'pepa' };
  const DE_ROSA = { id: 'p5', title: 'De Rosa', ownerUserId: 'rosa' };
  m.load.mockResolvedValue({ feedPosts: [DE_PEPA, ALTRA_DE_PEPA, DE_JOAN], marketItems: [], events: [], paginacio: { mur: 'cursor-vell' } });
  let moderacio = { esElementBloquejat: () => false, versioBloquejos: 0 };
  const Embolcall = ({ children }) => (
    <ModeracioContext.Provider value={moderacio}><MurProvider config={config}>{children}</MurProvider></ModeracioContext.Provider>
  );
  const vista = renderHook(useMur, { wrapper: Embolcall });
  await waitFor(() => expect(vista.result.current.status).toBe('ready'));
  // Bloqueig opac de p1 (per UUID): el client només amaga p1; el servidor ja no torna res de Pepa.
  let revalida;
  m.load.mockImplementationOnce(() => new Promise((resol) => { revalida = resol; }));
  moderacio = { esElementBloquejat: (item) => item?.id === 'p1', versioBloquejos: 1 };
  vista.rerender();
  await waitFor(() => expect(revalida).toBeTypeOf('function'));
  expect(vista.result.current.status).toBe('ready');
  // Abans que arribe la revalidació, «Mostra més» (amb el cursor vell).
  loadSeccioPage.mockResolvedValueOnce({ elements: [DE_ROSA], complete: true, nextCursor: null });
  await act(async () => { await vista.result.current.carregaMes('mur'); });
  // Arriba la revalidació: sense res de Pepa i amb una cua nova.
  await act(async () => { revalida({ feedPosts: [DE_JOAN], marketItems: [], events: [], paginacio: { mur: 'cursor-nou' } }); });
  await waitFor(() => expect(vista.result.current.feedPosts.map((p) => p.id)).toContain('p5'));
  expect(vista.result.current.feedPosts.map((p) => p.id)).toEqual(['p3', 'p5']);
});
