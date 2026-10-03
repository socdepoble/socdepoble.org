// @vitest-environment node
/* Una sola llista d'orígens (origensSollutia.js, A6 · P2-b). Fixa la unió de
   hui i cada ús, i comprova que runtimePolicy.js (que encara té les seues
   llistes literals) es comporta exactament com diu este fitxer. En node:
   sense window, runtimePolicy no hi afig els orígens locals. La paritat amb
   PedraSecaEmbed.jsx és a PedraSecaEmbed.config.test.jsx. */
import { describe, expect, test } from 'vitest';
import {
  ORIGENS_BACKEND, ORIGENS_CALLBACK, ORIGENS_CONEGUTS, ORIGENS_PARE, ORIGENS_SOCDEPOBLE, ORIGENS_SOLLUTIA
} from './origensSollutia.js';
import { esOrigenCallbackPermes, esOrigenParePermes } from './runtimePolicy.js';

describe('la llista única', () => {
  test('la unió de hui, fixada: cap origen entra ni ix sense que ho diga esta prova', () => {
    expect([...ORIGENS_CONEGUTS].sort()).toEqual([
      'https://auth.socdepoble.org',
      'https://socdepoble.org',
      'https://socdepoble.sollutia.cat',
      'https://socdepoble.sollutia.com',
      'https://sollutia.cat',
      'https://v2.sollutia.com'
    ]);
    expect(new Set(ORIGENS_CONEGUTS).size).toBe(ORIGENS_CONEGUTS.length);
    expect([...ORIGENS_SOCDEPOBLE, ...ORIGENS_SOLLUTIA].sort()).toEqual([...ORIGENS_CONEGUTS].sort());
  });

  test('cada ús és un subconjunt de la unió, congelat, d’orígens exactes https', () => {
    for (const [nom, llista] of Object.entries({ ORIGENS_PARE, ORIGENS_CALLBACK, ORIGENS_BACKEND, ORIGENS_CONEGUTS })) {
      expect(Object.isFrozen(llista), nom).toBe(true);
      for (const origen of llista) {
        expect(ORIGENS_CONEGUTS, `${nom}: ${origen}`).toContain(origen);
        expect(new URL(origen).origin, `${nom}: ${origen}`).toBe(origen);
        expect(origen.startsWith('https://'), `${nom}: ${origen}`).toBe(true);
      }
    }
  });

  test('els usos de hui, literals (comportament idèntic al d’abans de la fusió)', () => {
    expect(ORIGENS_PARE).toEqual(['https://socdepoble.org', 'https://sollutia.cat', 'https://socdepoble.sollutia.com']);
    expect(ORIGENS_CALLBACK).toEqual([...ORIGENS_PARE, 'https://auth.socdepoble.org', 'https://v2.sollutia.com']);
    expect(ORIGENS_BACKEND).toEqual(['https://auth.socdepoble.org', 'https://socdepoble.sollutia.com', 'https://socdepoble.sollutia.cat']);
  });
});

describe('runtimePolicy.js es comporta com la llista única', () => {
  const candidats = [...ORIGENS_CONEGUTS, 'https://evil.test', 'http://socdepoble.org', 'https://socdepoble.org:444'];

  test.each(candidats)('pare: %s', (origen) => {
    expect(esOrigenParePermes(origen)).toBe(ORIGENS_PARE.includes(origen));
  });

  test.each(candidats)('callback d’OAuth: %s', (origen) => {
    expect(esOrigenCallbackPermes(origen)).toBe(ORIGENS_CALLBACK.includes(origen));
  });
});
