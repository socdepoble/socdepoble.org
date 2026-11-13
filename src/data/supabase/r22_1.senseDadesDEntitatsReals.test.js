// @vitest-environment node
/* R22.1 · Gauntlet r221-dades-01, -02, -04, -05, r221-text-01, -02, -03 i -08
   (decisió de l'integrador, Carril 1) · La infraestructura genèrica del vídeo
   principal es queda, però el client NO inventa ni hidrata dades d'una
   entitat o d'un negoci real: ni el producte «Collita Limitada» a 12.00€, ni
   la menció regulada «primera premsada en fred», ni la portada i l'spot d'Oli
   de La Torre posats per autoria a les fitxes del Mercat, al perfil o al
   directori. El contingut real el posa un SQL revisat pel Mestre. Esta prova
   llig la llavor i el codi de producció de src/ (cap fitxer de prova). */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import * as IDENTITATS from '../identitatsSeed.js';
import { APP_CONTENT_ROWS, APP_SEED } from '../appSeed.js';
import { MARKET_ITEMS } from '../sectionContent.js';
import { perfilDOrganitzacio } from './perfils.js';

const ARREL = process.cwd();
const OLI_ID = '3073b933-69fc-4c3e-80dc-b0df9c6b8391';
const OLI_SLUG = 'olidelatorre';
/* La fila declarada d'abans del kit (Teler 2026-11-03): identitat, cap mitjà ni text inventat. */
const CLAUS_DE_L_ENTITAT = ['alies', 'id', 'kind', 'logo_url', 'membres', 'name', 'slug', 'town_name', 'visibility'];

/* Literals que només una llavor o una hidratació inventades portarien. Es componen
   a trossos perquè esta mateixa prova no se'ls trobe. */
const LITERALS_PROHIBITS = [
  ['oli-de-la-torre-', 'spot'],
  ['oli-de-la-torre-', 'portada'],
  ['oli-de-la-torre-', '500ml\''],
  ['premsada ', 'en fred'],
  ['Collita ', 'Limitada'],
  ['hidrataOrganitzacio', 'Destacada'],
  ['hidrataMitjans', 'BaseMercat'],
  ['esProducteOli', 'DeLaTorre'],
].map((trossos) => trossos.join(''));

function fitxersDeProduccio(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const relatiu = path.posix.join(directori, entrada.name);
    if (entrada.isDirectory()) fitxers.push(...fitxersDeProduccio(relatiu));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name) && !/\.test\.|\.spec\./.test(entrada.name)) fitxers.push(relatiu);
  }
  return fitxers;
}

const delNegoci = (item) => [item?.author_org_id, item?.authorOrgId, item?.author_id, item?.author_entity_id]
  .some((valor) => String(valor ?? '').trim().toLowerCase() === OLI_ID || String(valor ?? '').trim().toLowerCase() === OLI_SLUG)
  || [item?.seller, item?.author_name, item?.author].some((valor) => /oli de la torre/i.test(String(valor ?? '')));

describe('cap dada inventada d’Oli de La Torre a la llavor', () => {
  test('l’entitat és la identitat declarada i res més: cap lema, descripció, portada ni vídeo', () => {
    const oli = IDENTITATS.ENTITATS_SEED.find((entitat) => entitat.id === OLI_ID);
    expect(oli).toBeTruthy();
    expect(Object.keys(oli).sort()).toEqual(CLAUS_DE_L_ENTITAT);
    expect(oli.slug).toBe(OLI_SLUG);
    expect(Object.keys(IDENTITATS).filter((nom) => /OLI|hidrataOrganitzacio/i.test(nom))).toEqual([]);
  });

  test('el Mercat de la llavor no porta cap producte signat pel negoci ni cap vídeo', () => {
    const fonts = {
      MARKET_ITEMS,
      'APP_SEED.marketItems': APP_SEED.marketItems,
      'APP_CONTENT_ROWS.marketItems': APP_CONTENT_ROWS.find((fila) => fila.key === 'marketItems')?.payload ?? [],
    };
    for (const [nom, llista] of Object.entries(fonts)) {
      expect(Array.isArray(llista), nom).toBe(true);
      expect(llista.length, nom).toBeGreaterThan(0);
      expect(llista.filter(delNegoci).map((item) => item.id), nom).toEqual([]);
      expect(llista.filter((item) => Object.hasOwn(item, 'video_url')).map((item) => item.id), nom).toEqual([]);
    }
  });

  test('cap fitxer de producció de src/ porta la llavor, la menció regulada ni la hidratació', () => {
    const trobats = [];
    for (const fitxer of fitxersDeProduccio('src')) {
      const codi = readFileSync(path.join(ARREL, fitxer), 'utf8');
      for (const literal of LITERALS_PROHIBITS) if (codi.includes(literal)) trobats.push(`${fitxer} · ${literal}`);
    }
    expect(trobats).toEqual([]);
  });

  test('sonda: la cerca de literals mossega (el literal compost hi és i una còpia el trobaria)', () => {
    expect(LITERALS_PROHIBITS).toContain(['oli-de-la-torre-', 'spot'].join(''));
    expect(`const v = '${LITERALS_PROHIBITS[0]}-15s.mp4';`.includes(LITERALS_PROHIBITS[0])).toBe(true);
    expect(fitxersDeProduccio('src')).toEqual(expect.arrayContaining(['src/data/identitatsSeed.js', 'src/data/supabase/content.js']));
  });
});

describe('la fitxa pública d’una organització només mostra el vídeo de la seua fila', () => {
  /* L'id i el slug són els de l'entitat de la llavor (el que es prova és que cap
     codi els case per hidratar-hi mitjans); la resta de la fila, sintètica. */
  const FILA_OLI = Object.freeze({ id: OLI_ID, slug: OLI_SLUG, name: 'Entitat de la llavor', kind: 'company', hero_url: '', logo_url: '/assets/logo-sintetic.webp' });

  test('sense la columna (vista d’abans de 20261113060000) i sense portada: cap portada ni vídeo de llavor', () => {
    const fitxa = perfilDOrganitzacio(FILA_OLI);
    expect(fitxa.hero).toBe('');
    expect(Object.hasOwn(fitxa, 'heroVideo')).toBe(false);
  });

  test('amb la columna i el vídeo llevat (null), cap vídeo torna; amb un vídeo propi, el seu', () => {
    expect(Object.hasOwn(perfilDOrganitzacio({ ...FILA_OLI, hero_video_url: null }), 'heroVideo')).toBe(false);
    const propi = 'https://socdepoble.org/media/video-propi-de-l-entitat.mp4';
    const fitxa = perfilDOrganitzacio({ ...FILA_OLI, hero_url: '/media/portada-propia.webp', hero_video_url: propi });
    expect(fitxa).toMatchObject({ hero: '/media/portada-propia.webp', heroVideo: propi });
  });
});
