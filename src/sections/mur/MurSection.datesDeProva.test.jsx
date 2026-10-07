/**
 * Tasca 5 (ordre del Mestre, 261001) · Amb les dates de prova, l'ordre per
 * defecte del Mur deixa les importants dalt de tot: primer les nou d'esta
 * setmana, cadascuna amb la seua hora a la pastilla; després les molt
 * tècniques (del 2 al 15 de setembre) i, al final, el 2n Aplec (2023).
 * Ordre del Mestre (261007) · «Drets d'autor» no és cap de les importants:
 * amb la seua data real (2026-01-30, 00:00 hora local) cau avall, entre les
 * tècniques i l'Aplec.
 *
 * El Mur de veres (MurSection) amb la llavor tal com la servix el mode seed:
 * cap ordre recalculat a la prova. Es comprova amb diversos `ara` perquè no
 * depenga del dia de la setmana en què s'executa.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {} }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
import MurSection from './MurSection.jsx';
import { APP_SEED } from '../../data/appSeed.js';
import { sortPinnedContent } from '../../config/contentHelpers.js';
import { IMPORTANTS_DEL_MUR, TECNIQUES_DEL_MUR, llavorAmbDatesDeProva } from './datesDeProvaMur.js';

/* La llavor com la reben els contextos: CoreContentContext fa pageCopy de les
   pàgines i MurContext ordena cada llista amb sortPinnedContent. */
function preparaMur(ara) {
  const llavor = llavorAmbDatesDeProva(APP_SEED, ara);
  mocks.core = { status: 'ready', error: null, pageCopy: Object.fromEntries(llavor.pages.map((pagina) => [pagina.id, { ...pagina }])) };
  mocks.mur = {
    status: 'ready', error: null,
    sortedEvents: sortPinnedContent(llavor.events),
    sortedFeedPosts: sortPinnedContent(llavor.feedPosts),
    sortedMarketItems: sortPinnedContent(llavor.marketItems)
  };
  return llavor;
}

const titolDe = (llavor, [coleccio, id]) => llavor[coleccio].find((element) => element.id === id).title;
const targetes = () => [...document.querySelectorAll('.sdp-card-grid > *')];
const titols = () => targetes().map((targeta) => targeta.querySelector('.sp-card-title')?.textContent);
const pastilla = (targeta) => [...targeta.querySelectorAll('.sp-card-header .btn-date-time span')].map((span) => span.textContent);

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

test.each([
  ['dilluns de matinada', new Date(2026, 8, 28, 3, 0)],
  ['dijous, a l’hora de l’ordre', new Date(2026, 9, 1, 1, 15)],
  ['diumenge de nit', new Date(2026, 9, 4, 23, 30)],
  ['hui', new Date()]
])('%s: les importants dalt, amb hora; les tècniques després; l’Aplec al final', (_, ara) => {
  const llavor = preparaMur(ara);
  render(<MurSection />);
  const importants = IMPORTANTS_DEL_MUR.map((fila) => titolDe(llavor, fila));
  const tecniques = TECNIQUES_DEL_MUR.map((fila) => titolDe(llavor, fila));
  const avall = [titolDe(llavor, ['pages', 'drets-autor']), '2n Aplec pel Territori'];
  expect(titols()).toEqual([...importants, ...tecniques, ...avall]);
  // Cada targeta amb data de prova pinta l'hora i el dia (la pastilla sencera).
  for (const targeta of targetes().slice(0, importants.length + tecniques.length)) {
    const [hora, dia] = pastilla(targeta);
    expect(hora).toMatch(/^\d{2}:\d{2}$/);
    expect(dia).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
  }
});

test('les dues molt tècniques porten el dia de fa dues setmanes que diu la llavor', () => {
  preparaMur(new Date(2026, 9, 1, 1, 15));
  render(<MurSection />);
  const perTitol = new Map(targetes().map((targeta) => [targeta.querySelector('.sp-card-title')?.textContent, targeta]));
  const dia = (iso) => new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  expect(pastilla(perTitol.get('Disseny Pedra Seca'))[1]).toBe(dia('2026-09-14T18:25:00+02:00'));
  expect(pastilla(perTitol.get('Versions del Sistema'))[1]).toBe(dia('2026-09-03T11:50:00+02:00'));
});
