/* Ordre del Mestre (261021, pla 261021_0015 §13, P1-03) · L'origen públic dels
   enllaços: a la web, el de sempre (la barra d'adreces, byte a byte); dins de
   l'app nativa (capacitor://localhost a iOS, https://localhost a Android),
   socdepoble.org; i el canònic del build, si el porta, mana sobre tots dos. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ORIGEN_PUBLIC_PER_DEFECTE, esAppNativa, origenDeLaPagina, origenPublic, urlDeLaPagina
} from './origenPublic.js';

const ambPont = (isNativePlatform) => { window.Capacitor = { isNativePlatform }; };

beforeEach(() => {
  vi.stubEnv('VITE_CANONICAL_URL', '');
  window.history.replaceState(null, '', '/wikidepoble?item=a%20b#ancora');
});
afterEach(() => {
  delete window.Capacitor;
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('la web (el navegador, la PWA i el connector)', () => {
  test('sense canònic: l’origen de la pàgina, i la pàgina és la barra d’adreces byte a byte', () => {
    expect(esAppNativa()).toBe(false);
    expect(origenPublic()).toBe(window.location.origin);
    expect(origenDeLaPagina()).toBe(window.location.origin);
    expect(urlDeLaPagina()).toBe(window.location.href);
    expect(urlDeLaPagina()).toContain('?item=a%20b#ancora');
  });

  test('amb canònic: l’origen públic és el canònic, sense barra final; compartir la pàgina no canvia', () => {
    vi.stubEnv('VITE_CANONICAL_URL', 'https://socdepoble.org/');
    expect(origenPublic()).toBe('https://socdepoble.org');
    expect(origenDeLaPagina()).toBe(window.location.origin);
    expect(urlDeLaPagina()).toBe(window.location.href);
  });

  test.each([
    ['el pont de la web de @capacitor/core (isNativePlatform fals)', () => ambPont(() => false)],
    ['un pont trencat (isNativePlatform llança)', () => ambPont(() => { throw new Error('pont'); })],
    ['un pont sense la funció', () => { window.Capacitor = {}; }]
  ])('%s no és l’app nativa', (_cas, posa) => {
    posa();
    expect(esAppNativa()).toBe(false);
    expect(origenPublic()).toBe(window.location.origin);
    expect(urlDeLaPagina()).toBe(window.location.href);
  });
});

describe('l’app nativa', () => {
  test('pel pont de Capacitor: socdepoble.org, amb el mateix camí, consulta i fragment', () => {
    ambPont(() => true);
    expect(esAppNativa()).toBe(true);
    expect(origenPublic()).toBe(ORIGEN_PUBLIC_PER_DEFECTE);
    expect(ORIGEN_PUBLIC_PER_DEFECTE).toBe('https://socdepoble.org');
    expect(origenDeLaPagina()).toBe('https://socdepoble.org');
    expect(urlDeLaPagina()).toBe('https://socdepoble.org/wikidepoble?item=a%20b#ancora');
  });

  test('el canònic del build mana també dins de l’app', () => {
    ambPont(() => true);
    vi.stubEnv('VITE_CANONICAL_URL', 'https://proves.socdepoble.org/');
    expect(origenPublic()).toBe('https://proves.socdepoble.org');
    expect(origenDeLaPagina()).toBe('https://proves.socdepoble.org');
    expect(urlDeLaPagina()).toBe('https://proves.socdepoble.org/wikidepoble?item=a%20b#ancora');
  });

  test('per l’entrada nativa registrada (src/natiu/entrada.jsx), encara que no hi haja pont', async () => {
    vi.resetModules();
    const { registraEntradaNativa } = await import('./entradaNativa.js');
    registraEntradaNativa({ plataforma: 'android', proveidors: [], demana: () => Promise.resolve({}) });
    const fresc = await import('./origenPublic.js');
    expect(fresc.esAppNativa()).toBe(true);
    expect(fresc.origenPublic()).toBe('https://socdepoble.org');
    expect(fresc.urlDeLaPagina()).toBe('https://socdepoble.org/wikidepoble?item=a%20b#ancora');
  });
});
