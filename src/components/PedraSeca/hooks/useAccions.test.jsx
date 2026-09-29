/**
 * Connectar i la telemetria: primer es compta, després es fa el de sempre, i
 * si el comptador peta el clic continua. El mòdul de telemetria és el real
 * (embolcallat per poder-lo fer petar); `window.umami` fa d'amfitrió perquè
 * cap prova depenga del backend ni toque la xarxa.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));

vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../../data/telemetria.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, registraEsdeveniment: vi.fn(real.registraEsdeveniment) };
});

import { CLAU_APAGADA, ESDEVENIMENT_DOM, registraEsdeveniment } from '../../../data/telemetria.js';
import {
  AVIS_SENSE_XAT, registraConnectar, rutaActual, rutaXatPerDefecte, urlPerCompartir, useAccions
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

/* T43a-1 · PENDENT, i esta prova ho fixa: rutaActual() llig window.location,
   no el router. Amb un basename d'incrustació la ruta el porta (i navigate()
   l'hi tornaria a posar), mentre que el mainHref d'una targeta no; amb
   MemoryRouter és la de la pàgina amfitriona. I urlPerCompartir compon
   origin + ruta sense basename. Llegir-la de RouterContext trencaria les
   proves que el simulen només amb useNavigate (UniversalEditorShell,
   DocumentEditor, PageFrame, UniversalCard…). Si canvia, canvia açò. */
test('T43a-1 · (comportament actual) la ruta per defecte és la de la barra d’adreces, basename inclòs', () => {
  window.history.replaceState(null, '', '/app/mur?item=3');
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
