/**
 * Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de
 * llistar elements de la categoria per a l'avatar actiu ha d'estar disponible
 * per tot el sistema») · El que l'actor actiu ja té publicat en una secció:
 *  · la funció pura (publicacionsDeLaSeccio): de l'actor, sense l'element
 *    obert, amb les publicacions del Mur nascudes d'una nota (sense D2) i en
 *    l'ordre del Mur;
 *  · el hook (usePublicacionsDeLActor): les dades del Mur pel port, els àlies
 *    amb el mode de dades normalitzat i la identitat dels objectes entre
 *    pintades.
 */
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  identitat: null,
  /* null: fora de l'App (useUIState llança, com sense UIProvider). */
  ui: null,
  mur: null,
  /* null: sense CoreContentProvider (la reserva de veres, un objecte nou a cada crida). */
  core: null
}));
/* Un Error fa de fora del proveïdor: useIdentitat llança, com la de veres. */
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => {
    if (mocks.identitat instanceof Error) throw mocks.identitat;
    return mocks.identitat;
  }
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => {
    if (!mocks.ui) throw new Error('fora de l’app');
    return mocks.ui;
  }
}));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
/* Grup E (261008) · Sense proveïdor, useCoreContent torna una reserva nova a
   cada crida, en 'loading' i sense `refresh` (CoreContentContext.jsx). */
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => mocks.core ?? { status: 'loading', towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [] }
}));

import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { EVENTS } from './eventsContent.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { aliesDeLActor, ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import {
  esActorAmbHistoric, potVeureHistoric, publicacionsDeLaSeccio, SECCIONS_AMB_HISTORIC, teHistoric, textosDeLHistoric,
  titolDeLHistoric, usePaginesDelSistema, usePublicacionsDeLActor, useTargetesDeSistema, useVeuHistoric
} from './usePublicacionsDeLActor.js';
import { momentDeLaTargeta, perMomentDescendent, targetesDeSistema } from './targetesMur.js';

const SOC_DE_POBLE = Object.freeze({ tipus: 'entitat', id: ENTITAT_PILOT_ID });
/* El Foraster de veres: sense sessió, IdentitatContext hi posa la persona
   convidada, amb l'id de convidat (mai buit) i rol 'convidat'. */
const FORASTER = Object.freeze({ tipus: 'persona', id: '00000000-0000-4000-8000-0000000c0f1d', rol: 'convidat' });
const ALIES_SDP = aliesDeLActor(SOC_DE_POBLE, { dataMode: 'seed' });
const ids = (elements) => elements.map((element) => element.id);

/* Tres publicacions del Mur de l'entitat (una nascuda d'una nota, amb
   l'id de la seua submission), una d'una veïna, una pàgina de sistema i una
   sense data. */
const POSTS = [
  { id: 'vell', type: 'post', title: 'Vell', author_org_id: ENTITAT_PILOT_ID, created_at: '2026-09-01T10:00:00Z' },
  { id: 'sub-de-nota', type: 'post', title: 'De la nota', author_org_id: ENTITAT_PILOT_ID, created_at: '2026-10-05T10:00:00Z' },
  { id: 'veina', type: 'post', title: 'De la veïna', author_id: 'pepa', created_at: '2026-10-06T10:00:00Z' },
  { id: 'legal', type: 'sistema', isSystem: true, title: 'Legal', author_org_id: ENTITAT_PILOT_ID, created_at: '2026-10-07T10:00:00Z' },
  { id: 'sense-data', type: 'post', title: 'Sense data', author_org_id: ENTITAT_PILOT_ID },
  { id: 'nou', type: 'post', title: 'Nou', author_org_id: ENTITAT_PILOT_ID, created_at: '2026-10-06T12:00:00Z' }
];

beforeEach(() => {
  mocks.identitat = { actor: SOC_DE_POBLE };
  mocks.ui = null;
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), sortedFeedPosts: POSTS, sortedMarketItems: MARKET_ITEMS, sortedEvents: EVENTS };
  mocks.core = null;
});
afterEach(cleanup);

describe('publicacionsDeLaSeccio (pura)', () => {
  test('llavor: l’entitat Sóc de Poble rep la Samarreta al Mercat i l’Aplec a Esdeveniments, amb l’element cru', () => {
    const mercat = publicacionsDeLaSeccio(MARKET_ITEMS, 'mercat', ALIES_SDP);
    const actes = publicacionsDeLaSeccio(EVENTS, 'events', ALIES_SDP);
    expect(ids(mercat)).toEqual(['mercat:samarreta-socdepoble']);
    expect(mercat[0].item).toBe(MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble'));
    expect(mercat[0].esdeveniment).toBeNull();
    expect(ids(actes)).toEqual(['events:aplec-2023']);
    expect(actes[0].item).toBe(EVENTS.find((item) => item.id === 'aplec-2023'));
    expect(actes[0].esdeveniment).toMatchObject({ titol: '2n Aplec pel Territori' });
  });

  test('una persona remota que no ha publicat res: cap element (no hereta cap àlies del pilot)', () => {
    const alies = aliesDeLActor({ tipus: 'persona', id: 'U' }, { dataMode: 'remote' });
    expect(publicacionsDeLaSeccio(MARKET_ITEMS, 'mercat', alies)).toEqual([]);
  });

  /* Grup E (261008; decisió del Mestre: el «Sóc de Poble loguejat» és
     l'entitat socdepoble) · S'invertix l'expectativa antiga («les pàgines de
     sistema no són de ningú»): són de l'entitat pilot, i de ningú més. */
  test('Mur: les nascudes d’una nota sí que ixen (sense D2); la pàgina de sistema, per a l’entitat pilot; cap d’altri; de més nova a més vella i les sense data al final', () => {
    expect(ids(publicacionsDeLaSeccio(POSTS, 'mur', ALIES_SDP))).toEqual(['mur:legal', 'mur:nou', 'mur:sub-de-nota', 'mur:vell', 'mur:sense-data']);
  });

  test('Grup E · la pàgina de sistema no és de cap persona ni de cap altra entitat', () => {
    const persones = [
      aliesDeLActor({ tipus: 'persona', id: 'U', rol: 'persona' }),
      aliesDeLActor({ tipus: 'persona', id: 'U', rol: 'persona' }, { dataMode: 'seed' }),
      aliesDeLActor({ tipus: 'persona', id: 'U', rol: 'persona', slug: ENTITAT_PILOT_SLUG })
    ];
    for (const alies of persones) expect(ids(publicacionsDeLaSeccio([POSTS[3]], 'mur', alies))).toEqual([]);
    const forn = aliesDeLActor({ tipus: 'entitat', id: 'uuid-forn', slug: 'forn-de-la-torre' });
    expect(publicacionsDeLaSeccio([POSTS[3]], 'mur', forn)).toEqual([]);
  });

  test('l’element obert s’exclou (per id, siga text o número)', () => {
    expect(ids(publicacionsDeLaSeccio(POSTS, 'mur', ALIES_SDP, { exclouId: 'sub-de-nota' }))).toEqual(['mur:legal', 'mur:nou', 'mur:vell', 'mur:sense-data']);
    expect(publicacionsDeLaSeccio(MARKET_ITEMS, 'mercat', ALIES_SDP, { exclouId: 'samarreta-socdepoble' })).toEqual([]);
    const numerics = [{ id: 7, type: 'post', author_org_id: ENTITAT_PILOT_ID }, { id: 8, type: 'post', author_org_id: ENTITAT_PILOT_ID }];
    expect(ids(publicacionsDeLaSeccio(numerics, 'mur', ALIES_SDP, { exclouId: '7' }))).toEqual(['mur:8']);
  });

  test('Multimèdia i qualsevol altra secció no tenen històric', () => {
    expect(SECCIONS_AMB_HISTORIC).toEqual(['mur', 'mercat', 'events']);
    expect(['multimedia', 'pobles', null, undefined].map(teHistoric)).toEqual([false, false, false, false]);
    expect(publicacionsDeLaSeccio([{ id: 'foto', src: '/a.jpg', author_org_id: ENTITAT_PILOT_ID }], 'multimedia', ALIES_SDP)).toEqual([]);
    expect(textosDeLHistoric('multimedia')).toBeNull();
    expect(titolDeLHistoric('multimedia')).toBe('');
  });

  test('els textos porten la reserva en valencià i passen pel traductor', () => {
    expect(textosDeLHistoric('mercat')).toEqual({
      titol: 'Ja publicat al Mercat',
      buit: 'Amb esta identitat encara no hi ha res publicat al Mercat.',
      carregant: 'Carregant les publicacions…',
      error: 'No s’han pogut carregar les publicacions'
    });
    expect(titolDeLHistoric('mur', (clau) => `[${clau}]`)).toBe('[section.notes.historic.mur.titol]');
  });
});

describe('usePublicacionsDeLActor', () => {
  test('les dades del Mur, filtrades per l’actor actiu, i l’estat, l’error i el Reintentar del Mur', () => {
    const { result } = renderHook(() => usePublicacionsDeLActor('mercat'));
    expect(ids(result.current.elements)).toEqual(['mercat:samarreta-socdepoble']);
    expect(result.current).toMatchObject({ estat: 'ready', error: null, refresh: mocks.mur.refresh, ambActor: true });
  });

  test('sense l’element obert', () => {
    const { result } = renderHook(() => usePublicacionsDeLActor('events', { exclouId: 'aplec-2023' }));
    expect(result.current.elements).toEqual([]);
  });

  test('mentre el Mur carrega o si falla: les llistes buides i el seu estat', () => {
    const error = new Error('caigut');
    mocks.mur = { status: 'error', error, refresh: vi.fn(), sortedFeedPosts: [], sortedMarketItems: [], sortedEvents: [] };
    const { result } = renderHook(() => usePublicacionsDeLActor('mur'));
    expect(result.current).toMatchObject({ elements: [], estat: 'error', error });
    mocks.mur = { status: 'loading' };
    const carregant = renderHook(() => usePublicacionsDeLActor('mur'));
    expect(carregant.result.current).toMatchObject({ elements: [], estat: 'loading' });
  });

  test('una secció sense històric: cap element i llesta, siga quin siga l’estat del Mur', () => {
    mocks.mur = { status: 'loading' };
    const { result } = renderHook(() => usePublicacionsDeLActor('multimedia'));
    expect(result.current).toMatchObject({ elements: [], estat: 'ready', error: null });
  });

  test('els objectes conserven la identitat entre pintades encara que el Mur torne un objecte nou', () => {
    const { result, rerender } = renderHook(() => usePublicacionsDeLActor('mur'));
    const abans = result.current;
    mocks.mur = { ...mocks.mur };
    rerender();
    expect(result.current.elements).toBe(abans.elements);
    expect(result.current).toBe(abans);
  });

  test('mode de dades normalitzat: la persona pilot només hereta els seus àlies en llavor dins de l’App', () => {
    mocks.identitat = { actor: { tipus: 'persona', id: 'U', rol: 'membre' } };
    const fora = renderHook(() => usePublicacionsDeLActor('mercat'));
    expect(fora.result.current.elements).toEqual([]);
    mocks.ui = { externalConfig: { dataMode: 'seed' } };
    const llavor = renderHook(() => usePublicacionsDeLActor('mercat'));
    expect(ids(llavor.result.current.elements)).toEqual(['mercat:mac-mini-m4']);
    mocks.ui = { externalConfig: { dataMode: 'remote' } };
    const remot = renderHook(() => usePublicacionsDeLActor('mercat'));
    expect(remot.result.current.elements).toEqual([]);
  });

  test('sense actor: cap element i ambActor fals', () => {
    mocks.identitat = { actor: null };
    expect(renderHook(() => usePublicacionsDeLActor('mercat')).result.current).toMatchObject({ elements: [], ambActor: false });
  });

  /* Revisió adversarial del 261007 · La branca catch de useIdentitatSiNHiHa:
     fora del proveïdor useIdentitat llança, i el hook no peta. */
  test('fora del proveïdor (useIdentitat llança): cap element i ambActor fals', () => {
    mocks.identitat = new Error('useIdentitat ha de ser usat dins de IdentitatProvider');
    expect(renderHook(() => usePublicacionsDeLActor('mercat')).result.current).toMatchObject({ elements: [], ambActor: false });
    expect(renderHook(() => useVeuHistoric('mercat')).result.current).toBe(false);
  });

  /* Decisió per defecte del Mestre (261007) · el Foraster no veu cap
     històric. El Foraster de veres porta id (el del convidat): abans
     `Boolean(actor?.id)` el deixava passar, i ací veuria el que signa el
     convidat al Mur. */
  test('el Foraster (la persona convidada, amb id): cap element i ambActor fals', () => {
    mocks.identitat = { actor: FORASTER };
    mocks.mur = { ...mocks.mur, sortedFeedPosts: [{ id: 'del-convidat', type: 'post', title: 'Del convidat', author_id: FORASTER.id, created_at: '2026-10-06T10:00:00Z' }] };
    mocks.ui = { externalConfig: { dataMode: 'seed' } };
    expect(renderHook(() => usePublicacionsDeLActor('mur')).result.current).toMatchObject({ elements: [], ambActor: false });
    expect(renderHook(() => useVeuHistoric('mur')).result.current).toBe(false);
  });
});

/* Grup E de l'Onada 4 (prompt 261008_1201, tasca 2; decisió del Mestre del
   261008: el «Sóc de Poble loguejat» és l'entitat socdepoble) · Les pàgines
   del sistema que el Mur signa com a «Sóc de Poble» (targetesDeSistema, del
   contingut core) entren al Mur de l'entitat pilot. */
describe('Grup E · les pàgines del sistema al Mur de l’actor', () => {
  const NUCLI = Object.freeze({ status: 'ready', pageCopy: PAGE_COPY, refresh: () => {} });
  const SENSE_PAGINES = POSTS.filter((post) => !post.isSystem);
  const CLAUS = SYSTEM_PAGES.map((pagina) => `mur:${pagina.key}`);

  test('sense proveïdor: cap targeta, la mateixa constant congelada entre pintades, i cap espera', () => {
    const { result, rerender } = renderHook(() => usePaginesDelSistema());
    const abans = result.current.targetes;
    expect(abans).toEqual([]);
    expect(Object.isFrozen(abans)).toBe(true);
    rerender();
    expect(result.current.targetes).toBe(abans);
    expect(result.current.carregant).toBe(false);
  });

  /* Onada 8 (261009) · Dotze: la Consola i el Cervell hi entren com a pàgines
     del sistema. Abans, deu.
     Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1) · Tretze: hi
     entra «Descàrregues i Aplicacions». Abans, dotze. */
  test('amb el contingut core: les tretze pàgines del Mur, memoritzades sobre pageCopy', () => {
    mocks.core = NUCLI;
    const { result, rerender } = renderHook(() => useTargetesDeSistema());
    expect(SYSTEM_PAGES).toHaveLength(13);
    expect(result.current.map((targeta) => targeta.id)).toEqual(SYSTEM_PAGES.map((pagina) => pagina.key));
    expect(result.current.every((targeta) => targeta.isSystem && targeta.type === 'sistema')).toBe(true);
    // Les mateixes targetes que MurSection (targetesDeSistema), sense cap forma pròpia.
    expect(result.current).toEqual(targetesDeSistema(PAGE_COPY));
    const abans = result.current;
    // Un valor nou del proveïdor amb el mateix pageCopy: les mateixes targetes.
    mocks.core = { ...NUCLI };
    rerender();
    expect(result.current).toBe(abans);
  });

  test('carregant, només amb el proveïdor (refresh) i en loading', () => {
    mocks.core = { status: 'loading', pageCopy: {}, refresh: () => {} };
    expect(renderHook(() => usePaginesDelSistema()).result.current.carregant).toBe(true);
    mocks.core = { status: 'error', pageCopy: {}, refresh: () => {} };
    expect(renderHook(() => usePaginesDelSistema()).result.current.carregant).toBe(false);
    // Una reserva sense refresh (sense proveïdor) no espera mai.
    mocks.core = { status: 'loading', pageCopy: {} };
    expect(renderHook(() => usePaginesDelSistema()).result.current.carregant).toBe(false);
  });

  test('el Mur de l’entitat pilot (llavor i remot) porta les deu pàgines amb les seues publicacions, en l’ordre del Mur', () => {
    mocks.core = NUCLI;
    mocks.mur = { ...mocks.mur, sortedFeedPosts: SENSE_PAGINES };
    const llavor = renderHook(() => usePublicacionsDeLActor('mur')).result.current.elements;
    mocks.identitat = { actor: { tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG, rol: 'owner' } };
    mocks.ui = { externalConfig: { dataMode: 'remote' } };
    const remot = renderHook(() => usePublicacionsDeLActor('mur')).result.current.elements;
    for (const elements of [llavor, remot]) {
      expect(ids(elements)).toEqual(expect.arrayContaining([...CLAUS, 'mur:nou', 'mur:vell']));
      expect(elements).toHaveLength(CLAUS.length + 4);
      const moments = elements.map(({ item, esdeveniment }) => ({ moment: momentDeLaTargeta(item, esdeveniment) }));
      moments.slice(1).forEach((moment, posicio) => expect(perMomentDescendent(moments[posicio], moment)).toBeLessThanOrEqual(0));
    }
    // Cada targeta és l'element cru que pinta TargetaDelMur.
    expect(llavor.find((element) => element.id === 'mur:xat').item).toMatchObject({ isSystem: true, mainHref: '/page/xat' });
  });

  test('la persona i una altra entitat: cap pàgina del sistema; al Mercat no n’entra cap', () => {
    mocks.core = NUCLI;
    mocks.mur = { ...mocks.mur, sortedFeedPosts: SENSE_PAGINES };
    mocks.identitat = { actor: { tipus: 'persona', id: 'U', rol: 'persona' } };
    expect(renderHook(() => usePublicacionsDeLActor('mur')).result.current.elements).toEqual([]);
    mocks.identitat = { actor: { tipus: 'entitat', id: 'uuid-forn', slug: 'forn-de-la-torre', rol: 'owner' } };
    expect(renderHook(() => usePublicacionsDeLActor('mur')).result.current.elements).toEqual([]);
    mocks.identitat = { actor: SOC_DE_POBLE };
    expect(ids(renderHook(() => usePublicacionsDeLActor('mercat')).result.current.elements)).toEqual(['mercat:samarreta-socdepoble']);
  });

  test('l’estat: amb el Mur llest i el core carregant, loading; un error del Mur mana; sense proveïdor, llest', () => {
    mocks.core = { status: 'loading', pageCopy: {}, refresh: () => {} };
    expect(renderHook(() => usePublicacionsDeLActor('mur')).result.current.estat).toBe('loading');
    // El Mercat no espera el core.
    expect(renderHook(() => usePublicacionsDeLActor('mercat')).result.current.estat).toBe('ready');
    const error = new Error('caigut');
    mocks.mur = { status: 'error', error, refresh: vi.fn(), sortedFeedPosts: [], sortedMarketItems: [], sortedEvents: [] };
    expect(renderHook(() => usePublicacionsDeLActor('mur')).result.current).toMatchObject({ estat: 'error', error });
    mocks.core = null;
    mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), sortedFeedPosts: POSTS, sortedMarketItems: [], sortedEvents: [] };
    expect(renderHook(() => usePublicacionsDeLActor('mur')).result.current.estat).toBe('ready');
  });

  /* Revisió del grup E (troballa 1) · Una sola regla amb el Bloc
     (NotesSection · feedDelMas): les pàgines són del Mur i, com les seues
     publicacions, no hi entren mentre el Mur carrega o falla. Amb el core llest
     abans que el Mur, el peu pintava les pàgines soles i, en arribar el Mur,
     les publicacions s'hi intercalaven. */
  test('amb el core llest i el Mur carregant o caigut: cap pàgina del sistema; amb el Mur llest, hi tornen', () => {
    mocks.core = NUCLI;
    mocks.mur = { status: 'loading', refresh: vi.fn() };
    expect(renderHook(() => usePublicacionsDeLActor('mur')).result.current).toMatchObject({ elements: [], estat: 'loading' });
    const error = new Error('caigut');
    mocks.mur = { status: 'error', error, refresh: vi.fn(), sortedFeedPosts: [], sortedMarketItems: [], sortedEvents: [] };
    expect(renderHook(() => usePublicacionsDeLActor('mur')).result.current).toMatchObject({ elements: [], estat: 'error', error });
    mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), sortedFeedPosts: [], sortedMarketItems: [], sortedEvents: [] };
    expect(ids(renderHook(() => usePublicacionsDeLActor('mur')).result.current.elements)).toEqual(expect.arrayContaining(CLAUS));
  });

  test('amb les pàgines, els objectes conserven la identitat entre pintades', () => {
    mocks.core = NUCLI;
    const { result, rerender } = renderHook(() => usePublicacionsDeLActor('mur'));
    const abans = result.current;
    mocks.mur = { ...mocks.mur };
    mocks.core = { ...NUCLI };
    rerender();
    expect(result.current).toBe(abans);
  });
});

describe('la regla única de qui veu l’històric (potVeureHistoric)', () => {
  test('una secció amb històric i un actor que no és el Foraster', () => {
    expect(esActorAmbHistoric(SOC_DE_POBLE)).toBe(true);
    expect(esActorAmbHistoric({ tipus: 'persona', id: 'U', rol: 'persona' })).toBe(true);
    expect([null, undefined, {}, { id: '' }, FORASTER].map(esActorAmbHistoric)).toEqual([false, false, false, false, false]);
    expect(SECCIONS_AMB_HISTORIC.map((seccio) => potVeureHistoric(SOC_DE_POBLE, seccio))).toEqual([true, true, true]);
    expect(SECCIONS_AMB_HISTORIC.map((seccio) => potVeureHistoric(FORASTER, seccio))).toEqual([false, false, false]);
    expect(potVeureHistoric(SOC_DE_POBLE, 'multimedia')).toBe(false);
  });

  test('useVeuHistoric llig l’actor de la identitat', () => {
    expect(renderHook(() => useVeuHistoric('mercat')).result.current).toBe(true);
    expect(renderHook(() => useVeuHistoric('multimedia')).result.current).toBe(false);
  });
});
