import { describe, expect, test } from 'vitest';
import { normalitzaOrigenRedireccio301, validaMapaRedireccions301, generaMapaRedireccions301 } from './mapaRedireccions301.js';

const WP = 'https://socdepoble.net/2022/11/17/manifest-de-poble/';
const BLOG = 'https://elrentonar.blogspot.com/2009/02/memoria.html';
const destinsDisponibles = ['/mur/manifest-de-poble', '/mur/memoria'];
const mapa = [{ source: WP, destination: destinsDisponibles[0], status: 301 }, { source: BLOG, destination: destinsDisponibles[1], status: 301 }];

describe('R32.5 · mapa SEO 301 determinista', () => {
  test('mateix mapa en qualsevol ordre i corpus exacte de dos dominis', () => {
    const opcions = { destinsDisponibles, origensEsperats: [BLOG, WP] };
    const resultat = validaMapaRedireccions301(mapa, opcions);
    expect(resultat.valid).toBe(true);
    expect(validaMapaRedireccions301([...mapa].reverse(), opcions)).toEqual(resultat);
    expect(generaMapaRedireccions301(mapa.map(regla => ({ linkOriginal: regla.source, rutaDestiCanonica: regla.destination })), opcions)).toEqual(resultat.redireccions);
    expect(mapa[0].source).toBe(WP);
  });

  test('els àlies HTTP/www/Blogger mòbil s’unifiquen i detecten conflictes', () => {
    expect(normalitzaOrigenRedireccio301(WP.replace('https://', 'http://www.'))).toBe(WP);
    expect(normalitzaOrigenRedireccio301(`${BLOG}?m=1`)).toBe(BLOG);
    expect(normalitzaOrigenRedireccio301(`${BLOG}?z=1&m=1&a=2`)).toBe(`${BLOG}?a=2&z=1`);
    for (const destination of destinsDisponibles) {
      const result = validaMapaRedireccions301([mapa[1], { source: `${BLOG}?m=1`, destination, status: 301 }], { destinsDisponibles });
      expect(result.valid).toBe(false);
      expect(result.errors.map(e => e.codi)).toContain(destination === destinsDisponibles[1] ? 'origen_duplicat' : 'origen_conflictiu');
    }
  });

  test('el slug històric UTF-8 de WP #92 és vàlid sense acceptar escapes de separadors', () => {
    const destination = '/mur/col%c2%b7labora-amb-greenpeace';
    expect(validaMapaRedireccions301([{ ...mapa[0], destination }], { destinsDisponibles: [destination] }).valid).toBe(true);
    for (const destination of ['/mur/a%2fb', '/mur/a%5cb', '/mur/a%00b', '/mur/a%252fb', '/mur/a%c0%af', '/mur/a%e2%80%aeb', '/mur/a%']) {
      expect(validaMapaRedireccions301([{ ...mapa[0], destination }], { destinsDisponibles: [destination] }).valid).toBe(false);
    }
  });

  test.each(['https://elrentonar.blogspot.com.evil.test/a', 'https://altre.blogspot.com/a', 'https://socdepoble.org/a', 'ftp://socdepoble.net/a', 'https://x@socdepoble.net/a', 'https://socdepoble.net:8443/a', 'https://socdepoble.net/a#fragment', '/2022/article/', ' https://socdepoble.net/a', 'https://socdepoble.net\\@evil.test/a'])(
    'origen aliè o ambigu rebutjat: %s', source => {
      expect(normalitzaOrigenRedireccio301(source)).toBeNull();
      expect(validaMapaRedireccions301([{ ...mapa[0], source }], { destinsDisponibles }).valid).toBe(false);
    },
  );

  test.each(['https://socdepoble.net/altre/', 'https://socdepoble.org/mur/a', '//evil.test/a', '/mur/../privat', '/mur/%2e%2e/privat', '/mur/a?x=1', '/mur/a#f', '/mur//a', '/mur/a\nb', '/mur\\a'])(
    'destí no canònic, cadena o bucle rebutjat: %s', destination => {
      expect(validaMapaRedireccions301([{ ...mapa[0], destination }], { destinsDisponibles: [destination] }).valid).toBe(false);
    },
  );

  test('no confon ruta sintàctica, pàgina present, codi 301 i cobertura del corpus', () => {
    expect(validaMapaRedireccions301(mapa).errors.map(e => e.codi)).toContain('inventari_destins_invalid');
    expect(validaMapaRedireccions301(mapa, { destinsDisponibles: [] }).errors.filter(e => e.codi === 'desti_absent')).toHaveLength(2);
    for (const status of [200, 302, 307, 308, '301', null]) {
      expect(validaMapaRedireccions301([{ ...mapa[0], status }], { destinsDisponibles }).errors.map(e => e.codi)).toContain('codi_no_301');
    }
    expect(validaMapaRedireccions301([mapa[0]], { destinsDisponibles, origensEsperats: [WP, BLOG] }).errors.map(e => e.codi)).toContain('origen_sense_regla');
    expect(validaMapaRedireccions301(mapa, { destinsDisponibles, origensEsperats: [WP] }).errors.map(e => e.codi)).toContain('origen_fora_corpus');
    expect(() => generaMapaRedireccions301([], {})).toThrow('inventari_destins_invalid');
    expect(validaMapaRedireccions301(null).valid).toBe(false);
  });
});
