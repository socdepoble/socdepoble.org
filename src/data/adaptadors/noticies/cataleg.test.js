// @vitest-environment node
/* T5 (P1-07, 261024) · El catàleg de les fonts del sistema (cataleg.js): les formes que el port
   del Lector accepta, només adreces https netes i la llista exacta de hosts. Un host nou posa
   açò en roig fins que el Mestre l'aprova (un per un).
   Actualitzada a posta (261024 T5b): ordre del Mestre per al Lector, les fonts del sistema són
   EXACTAMENT els referents de coneixement obert del §23 del text legal (sis fonts, dos categories,
   totes en castellà). Les deu territorials ixen del catàleg actiu (queden al README.md com a
   candidates verificades). La regla «cap consulta» s'afluixa NOMÉS per al feed de vídeos de
   www.youtube.com (/feeds/videos.xml amb un sol channel_id d'un canal); per a la resta, igual. */
import { describe, expect, test } from 'vitest';
import { ICONES_CATEGORIA, LIMITS_MODEL, PATRO_ID, PREFIX_PERSONAL, RESERVATS } from '../../../apps/lector/nucli/index.js';
import { CATEGORIES_TERRITORIALS, FONTS_TERRITORIALS, fontDelCataleg, fontsPerAlLector } from './cataleg.js';

/* Els hosts que el Mestre ha d'aprovar un per un (els referents del §23, 261024). */
const HOSTS_DEL_CATALEG = Object.freeze(['ayudawp.com', 'emowe.com', 'iaenaccion.com', 'www.jonhernandez.education', 'www.youtube.com']);
/* Les deu fonts territorials del T5, verificades el 261024 i fora del catàleg actiu (decisió del Mestre). */
const HOSTS_TERRITORIALS_NO_ACTIUS = Object.freeze([
  'lamarina.eldiario.es', 'mallata.com', 'pego.org', 'valenciafruits.com', 'www.aemet.es', 'www.agullent.es', 'www.apuntmedia.es',
  'www.dival.es', 'www.morella.net', 'www.ontinyent.es'
]);
const CANAL_DE_VIDEOS = /^UC[A-Za-z0-9_-]{22}$/;

/* L'única consulta admesa: el feed Atom dels vídeos d'un canal, amb un sol channel_id. */
const esFeedDeVideos = (url) => url.hostname === 'www.youtube.com' && url.pathname === '/feeds/videos.xml'
  && [...url.searchParams.keys()].join(',') === 'channel_id' && CANAL_DE_VIDEOS.test(url.searchParams.get('channel_id'));

const esAdrecaNeta = (valor, { consulta = false } = {}) => {
  const url = new URL(valor);
  const consultaBona = !url.search || (consulta && esFeedDeVideos(url));
  return url.protocol === 'https:' && !url.username && !url.password && consultaBona && !url.hash && !url.port;
};

describe('les formes', () => {
  test('categories: ids lliures, noms i icones de la llista tancada, sense repetir', () => {
    const ids = CATEGORIES_TERRITORIALS.map((categoria) => categoria.id);
    expect(ids).toEqual(['coneixement', 'videos']);
    expect(new Set(ids).size).toBe(ids.length);
    for (const categoria of CATEGORIES_TERRITORIALS) {
      expect(categoria.id, categoria.id).toMatch(PATRO_ID);
      expect(RESERVATS).not.toContain(categoria.id);
      expect(ICONES_CATEGORIA).toContain(categoria.icona);
      expect(categoria.nom.length).toBeLessThanOrEqual(LIMITS_MODEL.nom);
      expect(Object.isFrozen(categoria)).toBe(true);
    }
    expect(CATEGORIES_TERRITORIALS.map((categoria) => categoria.icona)).toEqual(['BookOpen', 'Sprout']);
  });

  test('fonts: exactament els sis referents del §23, ids lliures i curts, una categoria que existix i textos dins dels límits', () => {
    const categories = new Set(CATEGORIES_TERRITORIALS.map((categoria) => categoria.id));
    const ids = FONTS_TERRITORIALS.map((font) => font.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['emowe', 'ayudawp', 'xavier-mitjana', 'jon-hernandez', 'migue-baena', 'ben-cord']);
    expect(FONTS_TERRITORIALS.map((font) => [font.id, font.nom, font.categoriaId])).toEqual([
      ['emowe', 'Emowe (Marcos)', 'coneixement'],
      ['ayudawp', 'Fernando Tellado · AyudaWP', 'coneixement'],
      ['xavier-mitjana', 'Xavier Mitjana · IA en Acción', 'coneixement'],
      ['jon-hernandez', 'Jon Hernández', 'coneixement'],
      ['migue-baena', 'Migue Baena', 'videos'],
      ['ben-cord', 'Ben Cord (Benjamín Cordero)', 'videos']
    ]);
    for (const font of FONTS_TERRITORIALS) {
      expect(Object.keys(font).sort(), font.id).toEqual(['categoriaId', 'descripcio', 'feed', 'id', 'llengua', 'lloc', 'nom']);
      expect(font.id, font.id).toMatch(PATRO_ID);
      expect(font.id.length, font.id).toBeLessThanOrEqual(40);
      expect(RESERVATS).not.toContain(font.id);
      /* Les fonts personals de la persona porten el seu prefix: cap font del sistema el fa servir. */
      expect(font.id.startsWith(`${PREFIX_PERSONAL}-`), font.id).toBe(false);
      expect(categories.has(font.categoriaId), font.id).toBe(true);
      expect(font.nom.length, font.id).toBeLessThanOrEqual(LIMITS_MODEL.nom);
      expect(font.descripcio.length, font.id).toBeLessThanOrEqual(LIMITS_MODEL.descripcio);
      expect(font.llengua, font.id).toBe('es');
      expect(Object.isFrozen(font)).toBe(true);
    }
    expect(Object.isFrozen(FONTS_TERRITORIALS)).toBe(true);
  });

  test('adreces: només https, sense credencials, port ni fragment; cap consulta fora del feed de vídeos d’un canal; el lloc i el feed, del mateix host', () => {
    for (const font of FONTS_TERRITORIALS) {
      expect(esAdrecaNeta(font.feed, { consulta: true }), font.feed).toBe(true);
      expect(esAdrecaNeta(font.lloc), font.lloc).toBe(true);
      expect(new URL(font.lloc).hostname, font.id).toBe(new URL(font.feed).hostname);
    }
    expect(FONTS_TERRITORIALS.filter((font) => new URL(font.feed).search).map((font) => font.id)).toEqual(['migue-baena', 'ben-cord']);
    expect(FONTS_TERRITORIALS.find((font) => font.id === 'emowe').feed).toBe('https://emowe.com/rss.xml');
  });

  /* R6 L-06 (261024, Lector final) · Jon Hernández: /feed/ respon 304 i cap byte a tot GET sense
     condicions (comprovat amb GET i l'agent honest, no amb HEAD, que diu 200); /feed/atom/ dona el
     feed Atom (200, sense redireccions). */
  test('Jon Hernández es llig pel feed Atom (/feed/atom/), no pel /feed/ que respon 304 sense cos', () => {
    expect(fontDelCataleg('jon-hernandez').feed).toBe('https://www.jonhernandez.education/feed/atom/');
    expect(FONTS_TERRITORIALS.map((font) => font.feed)).not.toContain('https://www.jonhernandez.education/feed/');
  });

  test('la consulta del feed de vídeos és estreta: un altre host, un altre camí, un paràmetre de més o un canal mal format no passen', () => {
    const bo = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A';
    expect(esAdrecaNeta(bo, { consulta: true })).toBe(true);
    expect(esAdrecaNeta(bo)).toBe(false);
    for (const dolent of [
      'https://youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A',
      'https://www.youtube.com/feeds/videos.xml?playlist_id=PLX_dT6nVtCIHRo_GFOsWK2A',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A&user=x',
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A&channel_id=UCpq8lHHliCS3oBt-gfL0bKQ',
      'https://www.youtube.com/feeds/videos.xml?channel_id=XYZ',
      'https://www.youtube.com/feeds/altres.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A',
      'https://ayudawp.com/feed/?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A',
      'https://emowe.com/rss.xml?x=1'
    ]) expect(esAdrecaNeta(dolent, { consulta: true }), dolent).toBe(false);
  });

  test('els hosts són exactament els que ha d’aprovar el Mestre, un per un; cap territorial és actiu', () => {
    const hosts = [...new Set(FONTS_TERRITORIALS.map((font) => new URL(font.feed).hostname))].sort();
    expect(hosts).toEqual([...HOSTS_DEL_CATALEG]);
    for (const vetat of [...HOSTS_TERRITORIALS_NO_ACTIUS, 'www.levante-emv.com', 'www.informacion.es']) expect(hosts).not.toContain(vetat);
  });
});

describe('el que veu el Lector', () => {
  test('fontsPerAlLector: sense feed ni llengua, congelades', () => {
    const fonts = fontsPerAlLector();
    expect(fonts.map((font) => font.id)).toEqual(FONTS_TERRITORIALS.map((font) => font.id));
    for (const font of fonts) {
      expect(Object.keys(font).sort()).toEqual(['categoriaId', 'descripcio', 'id', 'lloc', 'nom']);
      expect(Object.isFrozen(font)).toBe(true);
    }
    expect(JSON.stringify(fonts)).not.toMatch(/rss|feed|\.xml|channel_id/i);
  });

  test('fontDelCataleg: per id i prou, cap clau d’Object.prototype', () => {
    expect(fontDelCataleg('emowe')?.nom).toBe('Emowe (Marcos)');
    for (const dolent of ['constructor', '__proto__', 'toString', '', null, 42, 'apunt']) expect(fontDelCataleg(dolent)).toBeNull();
  });
});
