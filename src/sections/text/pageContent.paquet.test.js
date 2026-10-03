/**
 * Onada 3 (P2, incidència de producció del Mestre) · Tota imatge pròpia que
 * pinta una pàgina de text viatja dins del paquet. Les infografies de
 * /projecte vivien a <arrel>/assets/img/, fora de public/: el servidor de
 * desenvolupament les servix des de l'arrel del repo, però cap build les
 * empaqueta, i a WordPress feien 404 encara que la ruta ja es resolia cap a
 * la carpeta del connector.
 *
 * Es comprova contra public/, com MercatSection.autoria.test.jsx: el paquet
 * copia public/ sencer llevat dels fitxers propis del lloc (vite.standalone
 * .config.js · PROPIS_DEL_LLOC), i wordpress-plugin/dist no es versiona.
 *
 * És un criteri d'acceptació, no una porta: ni build:wp ni l'empaquetador
 * (wordpress-plugin/eines/empaqueta.mjs) executen vitest. S'ha de versionar
 * en el mateix commit que mou les infografies a public/assets/img/; abans,
 * qualsevol `vitest run` ample (la CI de wiki-integrity inclosa) ix en roig.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { propsDePaginaDeText } from './paginaDeText.js';

/* La mateixa forma que reescriu resolRecursosDeHtml en pintar. */
const RE_SRC_PROPI = /\ssrc\s*=\s*(["'])(\/assets\/[^"'<>\s]*)\1/gi;

function recursosPropis(pagina) {
  const propis = [];
  if (typeof pagina?.image === 'string' && pagina.image.startsWith('/assets/')) propis.push(pagina.image);
  if (typeof pagina?.html === 'string') {
    for (const [, , ruta] of pagina.html.matchAll(RE_SRC_PROPI)) propis.push(ruta);
  }
  return propis;
}

const absentsDePublic = (rutes) => [...new Set(rutes)]
  .filter((ruta) => !existsSync(join(process.cwd(), 'public', ruta.split(/[?#]/)[0])));

test('la capçalera de reserva de les pàgines de text és dins de public/', () => {
  const reserva = propsDePaginaDeText({ title: 'Sense imatge' }, 'x').heroImage;
  expect(reserva.startsWith('/assets/')).toBe(true);
  expect(absentsDePublic([reserva])).toEqual([]);
});

test('cada imatge pròpia de PAGE_COPY (capçalera i cos) és dins de public/, i per tant del paquet', () => {
  const rutes = Object.values(PAGE_COPY).flatMap(recursosPropis);
  // /projecte porta quatre infografies al cos: si la regla deixa de trobar-les, la prova no prova res.
  expect(rutes.filter((ruta) => ruta.includes('que-es-socdepoble-'))).toHaveLength(4);
  expect(absentsDePublic(rutes)).toEqual([]);
});
