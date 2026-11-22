// @vitest-environment node
/* Pla 261028_1526 (P1-61, Fase 2) · La clau social d'una ruta (rutaSocial.js):
   la de useSEO i seoHead al client, i la mateixa normalització que routeKey
   del port del servidor (tooling/seo/social-edge.mjs). */
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { camiDeDocumentWiki, canonitzaCami, clauSocialDeRuta, idDeDocumentWiki } from './rutaSocial.js';

test.each([
  ['/projecte', '', '/projecte'],
  ['/projecte/', '', '/projecte'],
  ['/projecte///', '?utm_source=x', '/projecte'],
  ['/', '', '/'],
  ['', '', '/'],
  ['/mercat/samarreta-socdepoble', '?item=llibre', '/mercat/samarreta-socdepoble'],
  ['/wikidepoble', '', '/wikidepoble'],
  ['/wikidepoble', '?item=03_llibre_d_or_memoria_episodica', '/wikidepoble?item=03_llibre_d_or_memoria_episodica'],
  ['/wikidepoble/', 'item=el_projecte', '/wikidepoble?item=el_projecte'],
  ['/wikidepoble', '?utm_source=whatsapp&categoria=folder%3A01_ser&item=el_projecte', '/wikidepoble?item=el_projecte'],
  ['/wikidepoble', '?item=a&item=b', '/wikidepoble'],
  ['/wikidepoble', '?item=', '/wikidepoble'],
  ['/wikidepoble', '?item=..%2Fsecret', '/wikidepoble'],
  ['/wikidepoble', '?item=amb%20espai', '/wikidepoble'],
  ['/wikidepoble', '?item=accent_%C3%A0', '/wikidepoble'],
  ['/wikidepoble', `?item=${'a'.repeat(181)}`, '/wikidepoble'],
  ['/wikidepoble', `?item=${'a'.repeat(180)}`, `/wikidepoble?item=${'a'.repeat(180)}`],
  // Decisió 2 del Mestre (261028) · La forma de camí és el mateix document.
  ['/wikidepoble/el_projecte', '', '/wikidepoble?item=el_projecte'],
  ['/wikidepoble/el_projecte/', '?item=altre', '/wikidepoble?item=el_projecte'],
  ['/wikidepoble/a.b', '', '/wikidepoble/a.b'],
  ['/wikidepoble/a/b', '', '/wikidepoble/a/b'],
  // Una altra ruta que comença igual no és la Wiki: ni el camí ni el ?item=.
  ['/wikidepoble-el_projecte', '', '/wikidepoble-el_projecte'],
  ['/wikidepoble2/el_projecte', '?item=el_projecte', '/wikidepoble2/el_projecte']
])('clauSocialDeRuta(%j, %j) = %j', (pathname, search, clau) => {
  expect(clauSocialDeRuta(pathname, search)).toBe(clau);
});

test('l’id d’un document i la seua forma de camí', () => {
  expect(idDeDocumentWiki('el_projecte')).toBe('el_projecte');
  for (const dolent of ['', '../x', 'a.b', 'amb espai', null, 7, 'a'.repeat(181)]) {
    expect(idDeDocumentWiki(dolent)).toBeNull();
    expect(camiDeDocumentWiki(dolent)).toBeNull();
  }
  expect(camiDeDocumentWiki('03_llibre_d_or_memoria_episodica')).toBe('/wikidepoble/03_llibre_d_or_memoria_episodica');
});

test('sense cap import: el lligen les eines del build tal qual', () => {
  const font = readFileSync(new URL('./rutaSocial.js', import.meta.url), 'utf8');
  expect(font).not.toMatch(/^\s*import\s/m);
});

/* v1.2.19 · Gauntlet R2 de la v1.2.18 (L2R2-03) · Un àlies codificat té la clau (i el canonical) de la ruta neta. */
test.each([
  ['/merc%61t/oli', '/mercat/oli'],
  ['/%6Dur/1', '/mur/1'],
  ['/pob%6ces/sella', '/pobles/sella'],
  ['/a%2fb', '/a%2Fb'],
  ['/a%20b', '/a%20b'],
  ['/mercat/%', '/mercat/%'],
  ['/mercat/%zz', '/mercat/%zz'],
  ['/p%C3%A0gina', '/p%C3%A0gina'],
])('canonitzaCami(%s) = %s', (cami, esperat) => {
  expect(canonitzaCami(cami)).toBe(esperat);
});

test('v1.2.19 · L2R2-03 · la clau social d\'un àlies codificat és la de la ruta neta, també a la Wiki', () => {
  expect(clauSocialDeRuta('/merc%61t/oli/')).toBe('/mercat/oli');
  expect(clauSocialDeRuta('/wikidepoble/%61bc')).toBe('/wikidepoble?item=abc');
  expect(clauSocialDeRuta('/wikidepobl%65', '?item=abc')).toBe('/wikidepoble?item=abc');
});
