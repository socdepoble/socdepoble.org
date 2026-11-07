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
import { esPublicada, publicMetadata } from './publicationPolicy.js';
import { publicMetadata as publicMetadataTooling } from '../../tooling/wiki/lib/publication-policy.mjs';

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
