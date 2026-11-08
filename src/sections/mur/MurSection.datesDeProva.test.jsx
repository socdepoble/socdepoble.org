/**
 * Tasca 5 (ordre del Mestre, 261001) · Amb les dates de prova, l'ordre per
 * defecte del Mur deixa les importants dalt de tot: primer les deu d'esta
 * setmana (nou fins al 261026_2126), cadascuna amb la seua hora a la pastilla; després les molt
 * tècniques (del 2 al 15 de setembre) i, al final, el 2n Aplec (2023).
 * Ordre del Mestre (261007) · «Drets d'autor» no és cap de les importants:
 * amb la seua data real (2026-01-30, 00:00 hora local) cau avall, entre les
 * tècniques i l'Aplec.
 * Onada 8 (261009; requeriments 261009_1300, punt 2) · Disseny, el Cervell i
 * la Consola porten la data que els ha donat el Mestre (10, 9 i 8 de
 * setembre, PAGE_COPY), sense data de prova: van just darrere de les
 * importants i davant de les Versions, l'única tècnica que queda. Abans,
 * Disseny era una tècnica del 14 de setembre.
 * Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1) · Les
 * importants ja són deu: «Descàrregues i Aplicacions» n'és la primera, com El
 * Xat (IMPORTANTS_DEL_MUR, datesDeProvaMur.js).
 * P0-49 / IDEA-180 (decisió del Mestre i MarIA, 261107) · Les importants ja
 * són tretze, i les dues primeres són les publicacions estrella: «Noves
 * tecnologies aplicades a la cultura rural» i «Anatomia rural». Les altres
 * quatre pàgines de patrimoni (herbari, banc de llavors, rutes i arbres) no
 * són importants: porten la seua data real (PAGE_COPY, 06-11-2026) i van on
 * les posa. Abans no hi eren a la prova, i per això fallava des que el Mur
 * les publica (9c1e6e333). Els tres `ara` fixos passen a la setmana del 9 al
 * 15 de novembre de 2026, amb els mateixos dies i hores: un `ara` anterior al
 * 6 de novembre posava eixes pàgines en el futur, dalt de tot.
 *
 * El Mur de veres (MurSection) amb la llavor tal com la servix el mode seed:
 * les importants no es reordenen a la prova; només s'hi intercalen, per la
 * seua data, les quatre pàgines de patrimoni. Es comprova amb diversos `ara`
 * perquè no depenga del dia de la setmana en què s'executa.
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
import { IMPORTANTS_DEL_MUR, IMPORTANTS_HISTORIQUES_DEL_MUR, TECNIQUES_DEL_MUR, llavorAmbDatesDeProva } from './datesDeProvaMur.js';

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
/* Onada 8 · [id, títol, data] de les tres pàgines de la maquinària, de la
   més nova a la més vella: les dates literals de l'ordre del Mestre. */
const MAQUINARIA = Object.freeze([
  ['disseny', 'Disseny Pedra Seca', '2026-09-10T00:00:00+02:00'],
  ['cervell', 'El Cervell', '2026-09-09T00:00:00+02:00'],
  ['consola', 'Consola Termodinàmica', '2026-09-08T00:00:00+02:00']
]);
/* P0-49 / IDEA-180 (261107) · Les quatre pàgines de patrimoni que no són importants: porten la seua
   data real (PAGE_COPY). En l'ordre en què les barreja el Mur (targetesMur.js), que és el dels empats. */
const PATRIMONI_AMB_DATA_REAL = Object.freeze(['herbari', 'banc-de-llavors', 'rutes-de-poble', 'arbres-monumentals']);
const momentDe = (llavor, [coleccio, id]) => {
  const element = llavor[coleccio].find((e) => e.id === id);
  return Date.parse(coleccio === 'pages' ? element.date : element.created_at);
};
const targetes = () => [...document.querySelectorAll('.sdp-card-grid > *')];
const titols = () => targetes().map((targeta) => targeta.querySelector('.sp-card-title')?.textContent);
const pastilla = (targeta) => [...targeta.querySelectorAll('.sp-card-header .btn-date-time span')].map((span) => span.textContent);

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

test.each([
  ['dilluns de matinada', new Date(2026, 10, 9, 3, 0)],
  ['dijous, a l’hora de l’ordre', new Date(2026, 10, 12, 1, 15)],
  ['diumenge de nit', new Date(2026, 10, 15, 23, 30)],
  ['hui', new Date()]
])('%s: les importants dalt, amb hora; les tècniques després; l’Aplec al final', (_, ara) => {
  const llavor = preparaMur(ara);
  render(<MurSection />);
  const importants = IMPORTANTS_DEL_MUR.map((fila) => titolDe(llavor, fila));
  /* Les importants, en el seu ordre, amb les pàgines de patrimoni de data real intercalades per data:
     només la setmana del 2 al 8 de novembre de 2026 cauen entre les importants; després, darrere. */
  const ambData = (fila) => ({ titol: titolDe(llavor, fila), moment: momentDe(llavor, fila) });
  const patrimoni = PATRIMONI_AMB_DATA_REAL.map((id) => ambData(['pages', id])).sort((a, b) => b.moment - a.moment);
  const dalt = [];
  for (const important of IMPORTANTS_DEL_MUR.map(ambData)) {
    while (patrimoni.length && patrimoni[0].moment > important.moment) dalt.push(patrimoni.shift().titol);
    dalt.push(important.titol);
  }
  dalt.push(...patrimoni.map(({ titol }) => titol));
  const maquinaria = MAQUINARIA.map(([id]) => titolDe(llavor, ['pages', id]));
  const tecniques = TECNIQUES_DEL_MUR.map((fila) => titolDe(llavor, fila));
  const avall = [titolDe(llavor, ['pages', 'drets-autor']), ...IMPORTANTS_HISTORIQUES_DEL_MUR.map(fila => titolDe(llavor, fila)), '2n Aplec pel Territori'];
  expect(titols()).toEqual([...dalt, ...maquinaria, ...tecniques, ...avall]);
  // Les dues publicacions estrella, dalt de tot del Mur: l'article del Pou de Neu i Anatomia rural.
  expect(IMPORTANTS_DEL_MUR.slice(0, 2)).toEqual([['feedPosts', 'noves-tecnologies-aplicades-a-la-cultura-rural'], ['pages', 'anatomia-rural']]);
  expect(titols().slice(0, 2)).toEqual([importants[0], 'Anatomia rural']);
  // Cada targeta amb data de prova pinta l'hora i el dia (la pastilla sencera).
  for (const targeta of targetes().slice(0, dalt.length + maquinaria.length + tecniques.length)) {
    const [hora, dia] = pastilla(targeta);
    expect(hora).toMatch(/^\d{2}:\d{2}$/);
    expect(dia).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
  }
  const manifest = targetes().find(targeta => targeta.querySelector('.sp-card-title')?.textContent === 'Manifest de Poble');
  expect(pastilla(manifest)).toEqual(['23:50', '17/11/22']);
});

/* Onada 8 (261009) · Abans, «les dues molt tècniques»: Disseny (14-09) i les
   Versions. Ara Disseny porta la data del Mestre, com el Cervell i la
   Consola, i la tècnica que queda conserva la de la llavor. */
test('la maquinària porta la data del Mestre a les 00:00, i la tècnica, el dia de fa dues setmanes de la llavor', () => {
  preparaMur(new Date(2026, 9, 1, 1, 15));
  render(<MurSection />);
  const perTitol = new Map(targetes().map((targeta) => [targeta.querySelector('.sp-card-title')?.textContent, targeta]));
  const dia = (iso) => new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  for (const [, titol, data] of MAQUINARIA) expect([titol, pastilla(perTitol.get(titol))]).toEqual([titol, ['00:00', dia(data)]]);
  expect(pastilla(perTitol.get('Versions del Sistema'))[1]).toBe(dia('2026-09-03T11:50:00+02:00'));
});
