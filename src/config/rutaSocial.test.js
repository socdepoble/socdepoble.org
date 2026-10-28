// @vitest-environment node
/* Pla 261028_1526 (P1-61, Fase 2) · La clau social d'una ruta (rutaSocial.js):
   la de useSEO i seoHead al client, i la mateixa normalització que routeKey
   del port del servidor (tooling/seo/social-edge.mjs). */
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { camiDeDocumentWiki, clauSocialDeRuta, idDeDocumentWiki } from './rutaSocial.js';

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
