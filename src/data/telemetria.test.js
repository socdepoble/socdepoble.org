import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  CLAU_APAGADA, ESDEVENIMENT_DOM, configTelemetria, darrersEnviaments, declaraEncastada, estableixTelemetriaApagada,
  registraEsdeveniment, registraVisita, seccioActual, telemetriaApagada, _reiniciaTelemetria
} from './telemetria.js';

const ID = '0f8d6c1e-7a2b-4c3d-9e8f-1a2b3c4d5e6f';
const cfg = configTelemetria({ VITE_UMAMI_WEBSITE_ID: ID, VITE_UMAMI_HOST: 'https://compta.socdepoble.org/' });
const cos = (crida) => JSON.parse(crida[1].body);

beforeEach(() => {
  _reiniciaTelemetria();
  window.localStorage.removeItem(CLAU_APAGADA);
  window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  delete window.umami;
  window.history.replaceState(null, '', '/notes?item_id=Nota%20secreta#x');
});
afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window.navigator, 'doNotTrack', { value: null, configurable: true });
  delete window.__SDP_EMBEDDED__;
});

test('sense id i host vàlids la configuració queda inactiva', () => {
  expect(configTelemetria({}).actiu).toBe(false);
  expect(configTelemetria({ VITE_UMAMI_WEBSITE_ID: 'no-es-uuid', VITE_UMAMI_HOST: 'https://a.b' }).actiu).toBe(false);
  expect(configTelemetria({ VITE_UMAMI_WEBSITE_ID: ID, VITE_UMAMI_HOST: 'http://compta.example' }).actiu).toBe(false);
  expect(configTelemetria({ VITE_UMAMI_WEBSITE_ID: ID, VITE_UMAMI_HOST: 'http://localhost:3000' }).actiu).toBe(true);
  expect(cfg.host).toBe('https://compta.socdepoble.org');
});

test('sense configurar no crida la xarxa però deixa rastre visible', () => {
  const vist = vi.fn();
  window.addEventListener(ESDEVENIMENT_DOM, vist);
  const r = registraEsdeveniment('connectar', { seccio: 'notes' }, { cfg: configTelemetria({}) });
  window.removeEventListener(ESDEVENIMENT_DOM, vist);
  expect(r).toMatchObject({ enviat: false, motiu: 'sense-configurar', nom: 'connectar' });
  expect(window.fetch).not.toHaveBeenCalled();
  expect(vist).toHaveBeenCalledTimes(1);
  expect(darrersEnviaments()[0].nom).toBe('connectar');
});

test('un esdeveniment envia el format d’Umami sense query, hash ni dades complexes', () => {
  registraEsdeveniment('connectar', { seccio: 'notes', persona: { id: 'A' }, mode: 'x'.repeat(500) }, { cfg });
  const [url, opcions] = window.fetch.mock.calls[0];
  expect(url).toBe('https://compta.socdepoble.org/api/send');
  expect(opcions).toMatchObject({ method: 'POST', credentials: 'omit', keepalive: true });
  const { type, payload } = cos(window.fetch.mock.calls[0]);
  expect(type).toBe('event');
  expect(payload).toMatchObject({ website: ID, name: 'connectar', url: '/notes' });
  expect(payload.data).toEqual({ seccio: 'notes', mode: 'x'.repeat(120) });
  expect(JSON.stringify(payload)).not.toContain('secreta');
});

test('una visita no porta nom i dues seguides a la mateixa ruta compten una', () => {
  registraVisita(undefined, { cfg });
  registraVisita('/notes', { cfg });
  expect(window.fetch).toHaveBeenCalledTimes(1);
  expect(cos(window.fetch.mock.calls[0]).payload.name).toBeUndefined();
  registraVisita('/mur', { cfg });
  expect(window.fetch).toHaveBeenCalledTimes(2);
});

test('la persona la pot apagar i tornar a encendre', () => {
  expect(estableixTelemetriaApagada(true)).toBe(true);
  expect(telemetriaApagada()).toBe(true);
  expect(registraEsdeveniment('connectar', null, { cfg })).toMatchObject({ enviat: false, motiu: 'apagada' });
  estableixTelemetriaApagada(false);
  expect(registraEsdeveniment('connectar', null, { cfg }).enviat).toBe(true);
});

test('Do Not Track apaga l’enviament', () => {
  Object.defineProperty(window.navigator, 'doNotTrack', { value: '1', configurable: true });
  expect(registraEsdeveniment('connectar', null, { cfg }).motiu).toBe('apagada');
  expect(window.fetch).not.toHaveBeenCalled();
});

test('amb window.umami de l’amfitrió delega els esdeveniments i no duplica visites', () => {
  window.umami = { track: vi.fn() };
  expect(registraEsdeveniment('connectar', { seccio: 'mur' }, { cfg }).motiu).toBe('amfitrio');
  expect(window.umami.track).toHaveBeenCalledWith('connectar', { seccio: 'mur' });
  expect(registraVisita('/mur', { cfg }).motiu).toBe('amfitrio-compta-visites');
  expect(window.fetch).not.toHaveBeenCalled();
});

test('un fetch que peta no trenca la interfície', () => {
  window.fetch = vi.fn(() => { throw new Error('xarxa'); });
  expect(registraEsdeveniment('connectar', null, { cfg })).toMatchObject({ enviat: false, motiu: 'error-xarxa' });
});

test('el títol de la pestanya no viatja: una fitxa hi posa el títol de la nota', () => {
  document.title = 'Nota secreta | Sóc de Poble';
  registraEsdeveniment('connectar', null, { cfg });
  registraVisita('/mur', { cfg });
  for (const crida of window.fetch.mock.calls) {
    expect(cos(crida).payload.title).toBeUndefined();
    expect(JSON.stringify(cos(crida))).not.toContain('secreta');
  }
});

test('el que va després del primer tram es tapa, també en els esdeveniments', () => {
  registraEsdeveniment('connectar', null, { cfg, ruta: '/perfil/7f3c2a90-persona?x=1' });
  registraVisita('/xat/fil-42', { cfg });
  expect(cos(window.fetch.mock.calls[0]).payload.url).toBe('/perfil/*');
  expect(cos(window.fetch.mock.calls[1]).payload.url).toBe('/xat/*');
  expect(darrersEnviaments().map((i) => i.url)).toEqual(['/xat/*', '/perfil/*']);
});

test('dues fitxes diferents de la mateixa secció són dues visites', () => {
  registraVisita('/notes/n1', { cfg });
  registraVisita('/notes/n2', { cfg });
  registraVisita('/notes/n2?item_id=x', { cfg });
  expect(window.fetch).toHaveBeenCalledTimes(2);
});

test('encastada en una pàgina d’un altre no envia res al nostre comptador', () => {
  declaraEncastada(true);
  expect(registraEsdeveniment('connectar', null, { cfg })).toMatchObject({ enviat: false, motiu: 'encastada' });
  declaraEncastada(false);
  window.__SDP_EMBEDDED__ = true;
  expect(registraVisita('/mur', { cfg }).motiu).toBe('encastada');
  expect(window.fetch).not.toHaveBeenCalled();
  window.umami = { track: vi.fn() };
  expect(registraEsdeveniment('connectar', null, { cfg }).motiu).toBe('amfitrio');
});

test('la secció és el primer segment de la ruta', () => {
  expect(seccioActual('/notes/n1')).toBe('notes');
  expect(seccioActual('/')).toBe('inici');
});

/* Gauntlet 261016 (F28, P1 de Codex) · Una fitxa canònica de primer nivell
   porta el sobrenom al primer tram, que és el que viatjava sencer. */
test('les fitxes canòniques de primer nivell es tapen com qualsevol fitxa', () => {
  for (const ruta of ['/javillinares', '/socdepoble/', '/rentonar?x=1#y', '/JaviLlinares']) {
    _reiniciaTelemetria();
    window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    registraVisita(ruta, { cfg });
    registraEsdeveniment('connectar', { seccio: seccioActual(ruta) }, { cfg, ruta });
    for (const crida of window.fetch.mock.calls) {
      const text = JSON.stringify(cos(crida)).toLowerCase();
      expect(cos(crida).payload.url).toBe('/perfil/*');
      for (const sobrenom of ['javillinares', 'socdepoble', 'rentonar']) expect(text).not.toContain(sobrenom);
    }
    expect(seccioActual(ruta)).toBe('perfil');
  }
  // Una secció que només comença igual no és cap fitxa.
  expect(seccioActual('/socdepoble-noticies')).toBe('socdepoble-noticies');
});
