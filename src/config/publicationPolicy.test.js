/* Arbitratge R11 (R37-L2-01) · La còpia del navegador (publicationPolicy.js)
   i la font de veritat dels exportadors (tooling) diuen el mateix.
   · publicMetadata: paritat de comportament amb la de
     tooling/wiki/lib/publication-policy.mjs (el patró d'iaiaLocal.consulta.test.js),
     per a cada combinació de visibility i status i per a entrades no-objecte.
   · esPublicada: tooling/seo/projeccio-publica.mjs importa
     build-social-manifest.mjs, que porta shebang i Vite no el pot transformar
     dins de Vitest; la paritat es fixa sobre el text: el mateix conjunt
     d'estats publicats i el mateix cos de funció, damunt de la mateixa
     publicMetadata. */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { esPublicada, publicMetadata, pobleAllowsIndex, tramsDeRuta } from './publicationPolicy.js';
import { publicMetadata as publicMetadataTooling, publicSeoRoute, pobleAllowsIndex as pobleAllowsIndexTooling,
  tramsDeRuta as tramsDeRutaTooling } from '../../tooling/wiki/lib/publication-policy.mjs';

const VISIBILITATS = [undefined, 'public', 'private', 'interna', '', null];
const ESTATS = [undefined, 'published', 'publicat', 'publicada', 'Published', 'draft', 'esborrany', 'pendent',
  'retirada', 'arxivat', 'quarantena', 'canonic', '', null];

const casos = [
  undefined, null, 'x', 42, true, [], ['public'], {},
  ...VISIBILITATS.flatMap((visibility) => ESTATS.map((status) => ({
    ...(visibility === undefined ? {} : { visibility }),
    ...(status === undefined ? {} : { status })
  }))),
  { visibility: undefined }, { status: undefined }, { visibility: 'public', status: undefined }
];
// v1.2.18 · Gauntlet R1 (L3-01) · Àlies que el router obri com a /pobles/sella o /poblacio/sella.
const RUTES_CODIFICADES = ['/pob%6Ces/sella', '/%70obles/sella', '/poblaci%6F/sella', '/%70%6F%62%6C%65%73/sella?lang=ca'];

test('R32.27 · el navegador i el productor compartixen la mateixa matriu anti-doorway', () => {
  const rutes = ['/pobles', '/poblacio', '/pobles/sella', 'poblacio/sella', '/pobles/sella/', '/pobles/sella?lang=ca', '/pobles/sella#seccio', '/mercat/oli',
    // v1.2.18 · Gauntlet R1 (L3-01) · Els àlies codificats i les seqüències invàlides també entren a la matriu de paritat.
    ...RUTES_CODIFICADES, '/pobles%2Fsella', '/pob%E0%A4%A/sella', '/pobles/%'];
  const metadades = [undefined, null, {}, [], 'text',
    ...[undefined, true, false, 'true', 1].flatMap(contingut_local_verificat =>
      [undefined, null, '', ' ', '<p> </p>', 'Crònica local', '<p>Memòria del poble</p>'].map(content => ({ contingut_local_verificat, content })))];
  const decisions = [];
  for (const ruta of rutes) for (const metadata of metadades) {
    const actual = pobleAllowsIndex(ruta, metadata);
    expect(actual, `${ruta}: ${JSON.stringify(metadata)}`).toBe(pobleAllowsIndexTooling(ruta, metadata));
    decisions.push(actual);
  }
  expect(decisions).toContain(true);
  expect(decisions).toContain(false);
});

test('R32.27 · la política SEO de pobles falla tancada sense contingut local verificat', () => {
  for (const route of ['/pobles/sella', 'poblacio/sella', '/pobles/sella?lang=ca']) {
    for (const meta of [{}, { content: 'Plantilla' }, { content: 'Crònica', contingut_local_verificat: 'true' }, { content: ' ', contingut_local_verificat: true }]) {
      expect(publicSeoRoute(route, meta)).toBe(false);
    }
    expect(publicSeoRoute(route, { content: 'Crònica local', contingut_local_verificat: true })).toBe(true);
    expect(publicSeoRoute(route, { content: 'Crònica local', contingut_local_verificat: true, visibility: 'private' })).toBe(false);
  }
  expect(publicSeoRoute('/pobles')).toBe(true);
  expect(publicSeoRoute('/mercat/oli')).toBe(true);
});

test('v1.2.18 · Gauntlet R1 (L3-01) · un tram codificat no salta la regla anti-doorway ni la llista privada', () => {
  const plantilla = { content: 'Plantilla genèrica del poble' };
  const contrastat = { content: 'Crònica local', contingut_local_verificat: true };
  for (const ruta of RUTES_CODIFICADES) {
    expect(pobleAllowsIndex(ruta, plantilla), ruta).toBe(false);
    expect(pobleAllowsIndexTooling(ruta, plantilla), ruta).toBe(false);
    expect(publicSeoRoute(ruta, plantilla), ruta).toBe(false);
    expect(pobleAllowsIndex(ruta, contrastat), ruta).toBe(true);
    expect(publicSeoRoute(ruta, contrastat), ruta).toBe(true);
  }
  // La llista privada del productor també decidix amb el tram descodificat.
  for (const ruta of ['/%6Eotes', '/x%61t/1', '/gestori%61?x=1']) expect(publicSeoRoute(ruta), ruta).toBe(false);
  // Una capa, com el router: %2F no obri cap tram, un doble codificat no és /pobles, i una seqüència invàlida es queda crua sense llançar.
  const rutes = [...RUTES_CODIFICADES, '/pobles%2Fsella', '/pob%256Ces/sella', '/pob%E0%A4%A/sella', '/pobles/%', '//pobles/sella#a', '', 'pobles'];
  for (const ruta of rutes) expect(tramsDeRuta(ruta), ruta).toEqual(tramsDeRutaTooling(ruta));
  expect(tramsDeRuta('/pob%6Ces/sella')).toEqual(['pobles', 'sella']);
  expect(tramsDeRuta('/pobles%2Fsella')).toEqual(['pobles/sella']);
  expect(tramsDeRuta('/pob%256Ces/sella')).toEqual(['pob%6Ces', 'sella']);
  expect(tramsDeRuta('/pob%E0%A4%A/sella')).toEqual(['pob%E0%A4%A', 'sella']);
  expect(pobleAllowsIndex('/pobles%2Fsella', plantilla)).toBe(true);
  expect(pobleAllowsIndex('/pobles/%', plantilla)).toBe(false);
});

const llig = (relatiu) => readFileSync(new URL(relatiu, import.meta.url), 'utf8');
const ESTATS_SRC = /const ESTATS_PUBLICATS = new Set\(\[[^\]]*\]\);/;
const FUNCIO_SRC = /export function esPublicada\(item\) \{[\s\S]*?\n\}/;

test('publicMetadata del navegador coincidix amb la de tooling/wiki/lib/publication-policy.mjs', () => {
  for (const cas of casos) expect([cas, publicMetadata(cas)]).toEqual([cas, publicMetadataTooling(cas)]);
});

test('esPublicada del navegador és la de tooling/seo/projeccio-publica.mjs (mateix text, mateixa publicMetadata)', () => {
  const navegador = llig('./publicationPolicy.js');
  const exportador = llig('../../tooling/seo/projeccio-publica.mjs');
  expect(exportador).toMatch(/import \{publicMetadata\} from '\.\.\/wiki\/lib\/publication-policy\.mjs';/);
  for (const patro of [ESTATS_SRC, FUNCIO_SRC]) {
    const deTooling = exportador.match(patro)?.[0];
    expect(deTooling, String(patro)).toBeTruthy();
    expect(navegador.match(patro)?.[0]).toBe(deTooling);
  }
  // La matriu no és trivial: hi ha casos públics i casos vetats.
  expect(casos.filter((cas) => esPublicada(cas)).length).toBeGreaterThan(0);
  expect(casos.filter((cas) => !esPublicada(cas)).length).toBeGreaterThan(0);
});
