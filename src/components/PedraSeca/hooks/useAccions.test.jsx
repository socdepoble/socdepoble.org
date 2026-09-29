/**
 * Connectar i la telemetria: primer es compta, després es fa el de sempre, i
 * si el comptador peta el clic continua. El mòdul de telemetria és el real
 * (embolcallat per poder-lo fer petar); `window.umami` fa d'amfitrió perquè
 * cap prova depenga del backend ni toque la xarxa.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));

/* Els routers són els de veres (T43a-1: la ruta ve del router); només la
   navegació es simula, per a llegir on porta cada clic. Sense router al
   voltant, el useRouter de veres es queixa i useUbicacioApp torna null. El cas
   d'una prova que simula el mòdul només amb useNavigate (l'exportació falta)
   el cobrixen UniversalCard, PageFrame.connectar, BarraBlava… */
vi.mock('../../../app/contexts/RouterContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate
}));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../../data/telemetria.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, registraEsdeveniment: vi.fn(real.registraEsdeveniment) };
});

import { BrowserRouter, MemoryRouter } from '../../../app/contexts/RouterContext';
import { CLAU_APAGADA, ESDEVENIMENT_DOM, registraEsdeveniment } from '../../../data/telemetria.js';
import {
  AVIS_SENSE_XAT, registraConnectar, rutaActual, rutaXatPerDefecte, urlPerCompartir, useAccions, useUbicacioApp
} from './useAccions.js';

const fetchOriginal = window.fetch;
let vistos;
const escolta = (event) => vistos.push(event.detail);

beforeEach(() => {
  vi.clearAllMocks();
  vistos = [];
  window.localStorage.removeItem(CLAU_APAGADA);
  window.umami = { track: vi.fn() };
  window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  window.history.replaceState(null, '', '/notes');
  window.addEventListener(ESDEVENIMENT_DOM, escolta);
});
afterEach(() => {
  window.removeEventListener(ESDEVENIMENT_DOM, escolta);
  delete window.umami;
  window.fetch = fetchOriginal;
  vi.unstubAllEnvs();
});

const connectars = () => vistos.filter((intent) => intent.nom === 'connectar');

test('primer es compta i després s’executa el handler propi, en el mateix clic', () => {
  const ordre = [];
  window.umami.track.mockImplementation(() => ordre.push('umami'));
  const onConnect = vi.fn(() => ordre.push('handler'));
  const { result } = renderHook(() => useAccions({ title: 'Nota secreta', onConnect }));

  result.current.handleConnect('esdeveniment');

  expect(ordre).toEqual(['umami', 'handler']); // síncron: el clic no espera ningú
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(onConnect).toHaveBeenCalledWith('esdeveniment');
  expect(window.umami.track).toHaveBeenCalledWith('connectar', { seccio: 'notes', origen: 'targeta' });
  expect(window.fetch).not.toHaveBeenCalled();
  expect(connectars()).toHaveLength(1);
});

/* T43 (ordre del Mestre, 260928, D7) · el Connectar per defecte ja no porta
   només el títol: porta un descriptor tipat ('pagina') amb la ruta del detall
   o, si no n'hi ha, la d'on està la persona. Abans esperava
   '/connectar?item_id=Nota%20secreta', l'URL que perdia d'on venia. */
const parametres = (ruta) => Object.fromEntries(new URL(ruta, 'http://localhost').searchParams);

test('sense handler propi compta i navega amb un descriptor de pàgina, sense el títol a la telemetria', () => {
  const { result } = renderHook(() => useAccions({ title: 'Nota secreta' }));
  result.current.handleConnect();
  const [ruta] = mocks.navigate.mock.calls[0];
  expect(ruta.startsWith('/connectar?')).toBe(true);
  expect(parametres(ruta)).toEqual({ item_id: 'Nota secreta', title: 'Nota secreta', objecte: 'pagina', ruta: '/notes' });
  expect(connectars()).toHaveLength(1);
  expect(JSON.stringify(connectars()[0])).not.toContain('secreta');
});

test('T43 · amb detall intern (mainHref), la clau i la ruta són les del detall; un detall extern no viatja', () => {
  const { result } = renderHook(() => useAccions({ title: 'Fira', mainHref: '/events/fira' }));
  result.current.handleConnect();
  expect(parametres(mocks.navigate.mock.calls[0][0])).toEqual({ item_id: '/events/fira', title: 'Fira', objecte: 'pagina', ruta: '/events/fira' });
  const extern = renderHook(() => useAccions({ title: 'Fira', mainHref: 'https://ca.wikipedia.org/wiki/Sella' }));
  extern.result.current.handleConnect();
  expect(parametres(mocks.navigate.mock.calls[1][0])).toEqual({ item_id: 'Fira', title: 'Fira', objecte: 'pagina', ruta: '/notes' });
});

/* T43a-1 (C3) · RESOLT, i esta prova ha canviat a posta. Abans fixava que la
   ruta per defecte era SEMPRE la de la barra d'adreces: amb una base
   d'incrustació la portava (i navigate() l'hi tornava a posar) i amb
   MemoryRouter era la de la pàgina amfitriona. Ara ve del router
   (useUbicacioApp; vegeu les proves «T43a-1 · MEMÒRIA/NAVEGADOR» de sota).
   Només sense router llegible (un arbre sense RouterProvider, o una prova que
   el simula només amb useNavigate) es llig la barra d'adreces tal qual, com
   abans, i urlPerCompartir compon origen + ruta com sempre. */
test('T43a-1 · sense router llegible, la ruta per defecte és la barra d’adreces tal qual, com abans', () => {
  window.history.replaceState(null, '', '/app/mur?item=3');
  expect(renderHook(() => useUbicacioApp()).result.current).toBeNull();
  expect(rutaActual()).toBe('/app/mur?item=3');
  const { result } = renderHook(() => useAccions({ title: 'Mur' }));
  result.current.handleConnect();
  expect(parametres(mocks.navigate.mock.calls[0][0]).ruta).toBe('/app/mur?item=3');
  expect(urlPerCompartir('/mur/3')).toBe(`${window.location.origin}/mur/3`);
});

test('la prop telemetria porta origen i mode fins a Umami', () => {
  const { result } = renderHook(() => useAccions({
    onConnect: () => {}, telemetria: { origen: 'pagina', mode: 'previsualitzacio' }
  }));
  result.current.handleConnect();
  expect(connectars()[0].dades).toEqual({ seccio: 'notes', origen: 'pagina', mode: 'previsualitzacio' });
});

test('només valors tancats: un text lliure no entra per origen ni per mode', () => {
  registraConnectar({ origen: 'Fira secreta', mode: 'Nota secreta' });
  expect(registraEsdeveniment).toHaveBeenCalledWith('connectar', { seccio: 'notes', origen: 'targeta' });
});

/* ── T63.2 (doctrina del Mestre, 260928) · Comentar obri el Xat comú de la
   Pàgina Universal. Abans el valor per defecte era navigate('/xat'), sense
   cap destí. */
const xat = (ruta) => {
  const url = new URL(ruta, 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};

test('T63.2 · rutaXatPerDefecte: la pàgina del detall (mainHref); sense detall, només la barra d’una pàgina pren la ruta d’on està', () => {
  window.history.replaceState(null, '', '/mur');
  expect(xat(rutaXatPerDefecte('Constitució', '/constitucio'))).toEqual({ cami: '/xat', sobre: 'pagina:/constitucio', titol: 'Constitució', ruta: '/constitucio' });
  // Una targeta sense detall no és la llista: abans totes anaven a pagina:/mur, cadascuna amb el seu títol.
  expect(rutaXatPerDefecte('Pepa')).toBeNull();
  expect(rutaXatPerDefecte('Fira', 'https://ca.wikipedia.org/wiki/Sella')).toBeNull();
  // Un detall d'element no és cap 'pagina': el seu xat el porta el seu objecte tipat.
  expect(rutaXatPerDefecte('Fira', '/events/fira')).toBeNull();
  // La barra d'una pàgina sí: la ruta d'on està, amb el títol de la pàgina.
  expect(xat(rutaXatPerDefecte('Mur', undefined, { pagina: true }))).toEqual({ cami: '/xat', sobre: 'pagina:/mur', titol: 'Mur', ruta: '/mur' });
  // Un títol que no és text no es cola a la ruta.
  expect(xat(rutaXatPerDefecte({ node: true }, '/mercat'))).toEqual({ cami: '/xat', sobre: 'pagina:/mercat', ruta: '/mercat' });
  // Una ruta que el contracte no admet (consulta, arrel, fora de la llista) o privada: cap xat, tampoc per a la barra.
  for (const ruta of ['/wikidepoble?item=genoma', '/', '/notes', '/el-meu-perfil', '/gent/u-1']) {
    window.history.replaceState(null, '', ruta);
    expect(rutaXatPerDefecte('P', undefined, { pagina: true })).toBeNull();
  }
});

test('T63.2 · la barra d’una pàgina, sense handler ni objecte: el xat comú de la pàgina (llegida en el clic), no /xat sense destí', () => {
  window.history.replaceState(null, '', '/mur');
  const { result } = renderHook(() => useAccions({ title: 'Mur', hasFooter: true, telemetria: { origen: 'pagina' } }));
  expect(result.current.comentarVisible).toBe(true);
  expect(result.current.comentarXat).toBe('comu');
  result.current.handleComment();
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).not.toHaveBeenCalledWith('/xat');
  expect(xat(mocks.navigate.mock.calls[0][0])).toEqual({ cami: '/xat', sobre: 'pagina:/mur', titol: 'Mur', ruta: '/mur' });
  expect(mocks.toast).not.toHaveBeenCalled();
  // Comentar no compta mai com a Connectar.
  expect(connectars()).toHaveLength(0);
});

/* Sense xat on anar, el botó es queda (Llei del Píxel) amb el nom neutre i el
   clic ho diu: no navega enlloc ni s'inventa cap xat. */
const esperaAvisSenseXat = (result) => {
  expect(result.current.comentarVisible).toBe(true);
  expect(result.current.comentarXat).toBeNull();
  result.current.handleComment();
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalledWith(AVIS_SENSE_XAT);
  vi.clearAllMocks();
};

test('T63.2 · una targeta sense objecte ni detall no pren el xat de la llista: el clic avisa', () => {
  window.history.replaceState(null, '', '/perfil');
  esperaAvisSenseXat(renderHook(() => useAccions({ title: 'Pepa', hasFooter: true })).result);
  expect(AVIS_SENSE_XAT).toBe('Ací no hi ha cap xat comú on comentar.');
});

test('T63.2 · objecte null (carregant, no trobat, contingut de fora): cap xat, tampoc el de la ruta', () => {
  window.history.replaceState(null, '', '/gent/u-1');
  esperaAvisSenseXat(renderHook(() => useAccions({ title: 'Carregant…', objecte: null, hasFooter: true, telemetria: { origen: 'pagina' } })).result);
});

test('T63.2 · una ruta o un descriptor que el contracte no admet: el botó es queda i avisa, no promet «xat comú»', () => {
  window.history.replaceState(null, '', '/wikidepoble?item=genoma');
  esperaAvisSenseXat(renderHook(() => useAccions({ title: 'Genoma', hasFooter: true, telemetria: { origen: 'pagina' } })).result);
  window.history.replaceState(null, '', '/notes');
  esperaAvisSenseXat(renderHook(() => useAccions({ title: 'Bloc', hasFooter: true, telemetria: { origen: 'pagina' } })).result);
  esperaAvisSenseXat(renderHook(() => useAccions({ objecte: { tipus: 'publicacio', id: '' }, hasFooter: true })).result);
  esperaAvisSenseXat(renderHook(() => useAccions({ objecte: { tipus: 'pagina', id: 'Genoma', ruta: '/wikidepoble?item=genoma' }, hasFooter: true })).result);
});

test('T63.2 · amb objecte tipat, Comentar porta al seu xat: tipus i id, no una «pagina» genèrica', () => {
  const objecte = { tipus: 'producte', id: 'samarreta', titol: 'Samarreta', ruta: '/mercat/samarreta' };
  const { result } = renderHook(() => useAccions({ title: 'Samarreta', mainHref: '/mercat/samarreta', objecte, hasFooter: true }));
  result.current.handleComment();
  expect(xat(mocks.navigate.mock.calls[0][0]).sobre).toBe('producte:samarreta');
  expect(result.current.comentarXat).toBe('comu');
});

test('T63.2 · una persona o una IA: el missatge directe de sempre', () => {
  const { result } = renderHook(() => useAccions({ objecte: { tipus: 'ia', id: 'iaia' }, hasFooter: true }));
  result.current.handleComment();
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=iaia');
  expect(result.current.comentarXat).toBe('directe');
});

test('T63.2 · un objecte sense xat (una nota) no ofereix Comentar, encara que showComment el demane; cap navegació', () => {
  const { result } = renderHook(() => useAccions({ objecte: { tipus: 'nota', id: 'n1', ruta: '/notes?nota=n1' }, hasFooter: true, showComment: true }));
  expect(result.current.comentarVisible).toBe(false);
  expect(result.current.comentarXat).toBeNull();
  result.current.handleComment();
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('T63.2 · un handler propi mana: es pinta i es crida; sense objecte, cap xat anunciat', () => {
  const onComment = vi.fn();
  const { result } = renderHook(() => useAccions({ onComment, objecte: { tipus: 'nota', id: 'n1' } }));
  expect(result.current.comentarVisible).toBe(true);
  result.current.handleComment();
  expect(onComment).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
  const propi = renderHook(() => useAccions({ onComment }));
  expect(propi.result.current.comentarXat).toBeNull();
});

test('si la telemetria peta, el clic continua', () => {
  registraEsdeveniment.mockImplementationOnce(() => { throw new Error('comptador caigut'); });
  const onConnect = vi.fn();
  const { result } = renderHook(() => useAccions({ onConnect }));
  expect(() => result.current.handleConnect()).not.toThrow();
  expect(onConnect).toHaveBeenCalledTimes(1);
});

/* ── T43a-1 (C3) · amb router. `ambRouter` pinta el hook dins d'un router de
   veres i torna també el router que llig (el de useUbicacioApp). */
const ambRouter = (Router, props, usar) => renderHook(() => ({ accions: usar(), router: useUbicacioApp() }), {
  wrapper: ({ children }) => <Router {...props}>{children}</Router>
});
const navegatA = () => mocks.navigate.mock.calls.at(-1)[0];

test('T43a-1 · MEMÒRIA: Connectar porta la ruta de l’app, no la de la pàgina amfitriona', () => {
  window.history.replaceState(null, '', '/pagina-amfitrio?p=42');
  const { result } = ambRouter(MemoryRouter, { rutaInicial: '/mur?item=3' }, () => useAccions({ title: 'Mur' }));
  expect(result.current.router.memoria).toBe(true);
  expect(rutaActual(result.current.router)).toBe('/mur?item=3');
  result.current.accions.handleConnect();
  expect(parametres(navegatA())).toEqual({ item_id: 'Mur', title: 'Mur', objecte: 'pagina', ruta: '/mur?item=3' });
  // L'app no ha tocat la URL de l'amfitrió.
  expect(`${window.location.pathname}${window.location.search}`).toBe('/pagina-amfitrio?p=42');
});

test('T43a-1 · MEMÒRIA: el Comentar de la barra d’una pàgina obri el xat de la pàgina de l’app, no el de l’amfitrió', () => {
  // L'amfitrió és en una ruta sense xat (/notes); l'app, al Mur.
  window.history.replaceState(null, '', '/notes');
  const barra = { title: 'Mur', hasFooter: true, telemetria: { origen: 'pagina' } };
  const mur = ambRouter(MemoryRouter, { rutaInicial: '/mur' }, () => useAccions(barra));
  expect(mur.result.current.accions.comentarXat).toBe('comu');
  mur.result.current.accions.handleComment();
  expect(xat(navegatA())).toEqual({ cami: '/xat', sobre: 'pagina:/mur', titol: 'Mur', ruta: '/mur' });
  expect(mocks.toast).not.toHaveBeenCalled();
  // I al revés: l'amfitrió és al Mur i l'app en una ruta sense xat; el de l'amfitrió no s'hereta.
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/mur');
  const notes = ambRouter(MemoryRouter, { rutaInicial: '/notes' }, () => useAccions(barra)).result;
  esperaAvisSenseXat({ current: notes.current.accions });
});

test('T43a-1 · MEMÒRIA: la ruta és la de l’entrada actual; quan l’app navega, el clic següent ja porta la nova', () => {
  window.history.replaceState(null, '', '/mur');
  const barra = { title: 'Pàgina', hasFooter: true, telemetria: { origen: 'pagina' } };
  const { result } = ambRouter(MemoryRouter, { rutaInicial: '/notes' }, () => useAccions(barra));
  expect(result.current.accions.comentarXat).toBeNull();
  // El navigate de veres del router (el de useNavigate és simulat).
  act(() => { result.current.router.navigate('/constitucio'); });
  expect(result.current.accions.comentarXat).toBe('comu');
  result.current.accions.handleComment();
  expect(xat(navegatA())).toEqual({ cami: '/xat', sobre: 'pagina:/constitucio', titol: 'Pàgina', ruta: '/constitucio' });
  act(() => { result.current.router.navigate('/mur?date=2026-09-01'); });
  expect(rutaActual(result.current.router)).toBe('/mur?date=2026-09-01');
  result.current.accions.handleConnect();
  expect(parametres(navegatA()).ruta).toBe('/mur?date=2026-09-01');
  expect(rutaXatPerDefecte('P', undefined, { pagina: true, router: result.current.router })).toBeNull();
  expect(`${window.location.pathname}${window.location.search}`).toBe('/mur');
});

test('T43a-1 · MEMÒRIA: urlPerCompartir es compon amb la ruta de l’app (canònic del build o, si no, origen de la pàgina)', () => {
  window.history.replaceState(null, '', '/pagina-amfitrio?p=42#ancora');
  const { router } = ambRouter(MemoryRouter, { rutaInicial: '/mur?item=3' }, () => null).result.current;
  // Sense VITE_CANONICAL_URL: l'origen de la pàgina + la ruta de l'app (DECISIÓ PENDENT del Mestre).
  vi.stubEnv('VITE_CANONICAL_URL', '');
  expect(urlPerCompartir(undefined, router)).toBe(`${window.location.origin}/mur?item=3`);
  expect(urlPerCompartir('/mur/3', router)).toBe(`${window.location.origin}/mur/3`);
  // Una relativa es resol sobre la ruta de l'app, com ho fa navigate().
  expect(urlPerCompartir('fira', router)).toBe(`${window.location.origin}/fira`);
  // Un enllaç de fora de l'app es queda com és.
  expect(urlPerCompartir('https://ca.wikipedia.org/wiki/Sella', router)).toBe('https://ca.wikipedia.org/wiki/Sella');
  // Amb canònic: l'adreça pública de Sóc de Poble, sense barra doble.
  vi.stubEnv('VITE_CANONICAL_URL', 'https://socdepoble.org/');
  expect(urlPerCompartir(undefined, router)).toBe('https://socdepoble.org/mur?item=3');
  expect(urlPerCompartir('/mur/3', router)).toBe('https://socdepoble.org/mur/3');
});

test('T43a-1 · MEMÒRIA: Compartir de la barra comparteix l’enllaç de l’app', async () => {
  vi.stubEnv('VITE_CANONICAL_URL', '');
  window.history.replaceState(null, '', '/pagina-amfitrio');
  const share = vi.fn(() => Promise.resolve());
  Object.defineProperty(window.navigator, 'share', { value: share, configurable: true });
  try {
    const { result } = ambRouter(MemoryRouter, { rutaInicial: '/mercat' }, () => useAccions({ title: 'Mercat', hasFooter: true }));
    await result.current.accions.handleShare();
    expect(share).toHaveBeenCalledWith({ title: 'Mercat', url: `${window.location.origin}/mercat` });
  } finally {
    delete window.navigator.share;
  }
});

test('T43a-1 · NAVEGADOR sense base (socdepoble.org): exactament el d’abans, consulta crua inclosa', () => {
  // La consulta arriba tal com és a la barra (%20, no «+»): cap reserialització.
  window.history.replaceState(null, '', '/wikidepoble?item=a%20b');
  const { result } = ambRouter(BrowserRouter, {}, () => useAccions({ title: 'Wiki' }));
  const { router } = result.current;
  expect(router.memoria).toBe(false);
  expect(rutaActual(router)).toBe(rutaActual());
  expect(rutaActual(router)).toBe('/wikidepoble?item=a%20b');
  result.current.accions.handleConnect();
  expect(parametres(navegatA()).ruta).toBe('/wikidepoble?item=a%20b');
  for (const href of [undefined, '', '/mur/3', 'https://ca.wikipedia.org/wiki/Sella', '#ancora', 'fira', 'mailto:a@b.test', '//fora.example/x']) {
    expect(urlPerCompartir(href, router)).toBe(urlPerCompartir(href));
  }
  expect(urlPerCompartir('/mur/3', router)).toBe(`${window.location.origin}/mur/3`);
  expect(urlPerCompartir(undefined, router)).toBe(window.location.href);
});

test('T43a-1 · NAVEGADOR amb base: la ruta de l’app sense la base (navigate() ja la hi posa); els enllaços, amb', () => {
  window.history.replaceState(null, '', '/app/mur?item=3');
  const { result } = ambRouter(BrowserRouter, { basename: '/app' }, () => useAccions({ title: 'Mur' }));
  const { router } = result.current;
  expect(rutaActual(router)).toBe('/mur?item=3');
  result.current.accions.handleConnect();
  expect(parametres(navegatA()).ruta).toBe('/mur?item=3');
  expect(urlPerCompartir('/mur/3', router)).toBe(`${window.location.origin}/app/mur/3`);
  expect(urlPerCompartir(undefined, router)).toBe(`${window.location.origin}/app/mur?item=3`);
  expect(urlPerCompartir('https://ca.wikipedia.org/wiki/Sella', router)).toBe('https://ca.wikipedia.org/wiki/Sella');
  // Fora de la base la URL és de l'amfitrió: cap ruta de l'app.
  window.history.replaceState(null, '', '/altra-pagina');
  expect(rutaActual(router)).toBe('');
});
