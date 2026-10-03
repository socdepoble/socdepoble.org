// @vitest-environment node
/* La Nevera de Casa · els productes de botiga (nucli/productes.js): la forma
   de les dades, la privacitat del fitxer, els ids publicats i la deriva
   respecte del full de la zona humana. Si el full no hi és (la CI), la prova
   de deriva se salta; la resta mira sempre. Els patrons vetats es componen a trossos perquè les
   portes que llegixen src/ no els troben ací. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { importaProductes } from '../importador.js';
import { ARTICLES_BASE, ARTICLES_PRODUCTES, CATEGORIES, FONT, ID_PROPIS, LIMITS, clauDeNom, esIdNevera, netejaText } from './index.js';
import { PRODUCTES } from './productes.js';

const ARREL = process.cwd();
const FULL = '_wiki_de_poble/04_escriptori/01_produccio/mercadona/Llista de la compra - Mercadona.csv';
const HI_HA_FULL = existsSync(path.join(ARREL, FULL));
const SECCIONS = new Set(CATEGORIES.map((categoria) => categoria.id));

describe('la font i la forma de les files', () => {
  test('FONT: id, nom i data de tall', () => {
    expect(FONT).toEqual({ id: 'mer', nom: 'Mercadona', tall: '2026-10-03' });
    expect(Object.isFrozen(FONT)).toBe(true);
  });

  test('592 productes (la nota del full no hi és), en files congelades de 8 camps', () => {
    expect(PRODUCTES).toHaveLength(592);
    expect(Object.isFrozen(PRODUCTES)).toBe(true);
    for (const fila of PRODUCTES) {
      expect(Object.isFrozen(fila), fila[0]).toBe(true);
      expect(fila, fila[0]).toHaveLength(8);
      const [id, nom, seccio, marca, envas, quantitat, unitat, preu] = fila;
      for (const text of [id, nom, seccio, marca, envas, unitat]) expect(typeof text, id).toBe('string');
      expect(Number.isFinite(quantitat) && quantitat > 0, id).toBe(true);
      expect(['g', 'kg', 'ml', 'l', 'u'], id).toContain(unitat);
      expect(Number.isSafeInteger(preu) && preu > 0, id).toBe(true);
      expect(netejaText(nom, LIMITS.nom), id).toBe(nom);
      expect(nom.toLowerCase().includes('precio medio'), id).toBe(false);
    }
  });

  test('cada producte va a una secció que ja existix (cap de nova, cap a «Articles propis»)', () => {
    for (const [id, , seccio] of PRODUCTES) {
      expect(SECCIONS.has(seccio), id).toBe(true);
      expect(seccio, id).not.toBe(ID_PROPIS);
    }
    const perSeccio = {};
    for (const [, , seccio] of PRODUCTES) perSeccio[seccio] = (perSeccio[seccio] || 0) + 1;
    expect(perSeccio).toEqual({
      'llet-formatge': 128, 'fruita-verdura': 106, congelats: 123, 'carn-peix': 72, 'ingredients-especies': 65, begudes: 33,
      'higiene-salut': 25, llar: 24, 'picar-dolcos': 10, 'cereals-pasta': 5, mascotes: 1
    });
  });

  test('ids opacs per a la URL, amb el prefix de la font, únics i que no xafen cap article de base', () => {
    const ids = PRODUCTES.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    const deBase = new Set(ARTICLES_BASE.map((article) => article.id));
    for (const id of ids) {
      expect(id, id).toMatch(/^mer-[a-z0-9][a-z0-9_-]{0,59}$/);
      expect(id.length, id).toBeLessThanOrEqual(64);
      expect(esIdNevera(id), id).toBe(true);
      expect(deBase.has(id), id).toBe(false);
    }
  });

  test('cap nom repetit en tot l’univers: base i productes tenen claus úniques', () => {
    const claus = [...ARTICLES_BASE, ...ARTICLES_PRODUCTES].map((article) => clauDeNom(article.nom));
    expect(new Set(claus).size).toBe(claus.length);
  });

  test('ARTICLES_PRODUCTES: els mateixos productes com a articles congelats amb la font', () => {
    expect(ARTICLES_PRODUCTES).toHaveLength(PRODUCTES.length);
    expect(ARTICLES_PRODUCTES[0]).toEqual({
      id: PRODUCTES[0][0], nom: PRODUCTES[0][1], categoriaId: PRODUCTES[0][2], font: 'mer',
      marca: PRODUCTES[0][3], envas: PRODUCTES[0][4], quantitat: PRODUCTES[0][5], unitat: PRODUCTES[0][6], preuCentims: PRODUCTES[0][7]
    });
    expect(ARTICLES_PRODUCTES.every((article) => Object.isFrozen(article) && article.font === FONT.id)).toBe(true);
  });
});

describe('privacitat i sobirania del fitxer de dades', () => {
  test('cap enllaç, cap ruta de disc, cap imatge ni cap columna fora de la llista blanca', () => {
    const text = readFileSync(path.join(ARREL, 'src/apps/nevera/nucli/productes.js'), 'utf8');
    const vetats = [['ht', 'tp'].join(''), ['/Us', 'ers/'].join(''), ['img', 'ix'].join(''), ['img', '-maqueta'].join(''), '.png', '.jpg', 'www.'];
    for (const vetat of vetats) expect(text.includes(vetat), vetat).toBe(false);
  });
});

/* Els ids publicats viuen a les llistes de cada casa: cap tall pot llevar-ne
   ni reanomenar-ne cap (normalitzaEstat descartaria les línies). Cada tall en
   deixa l'empremta (FNV-1a de 32 bits dels ids, en ordre) i els talls nous
   només hi afigen files al final (importaProductes amb `publicats`). */
const TALLS_PUBLICATS = Object.freeze([{ tall: '2026-10-03', nombre: 592, empremta: '111b1e71' }]);

function empremta(ids) {
  let hash = 0x811c9dc5;
  for (const caracter of ids.join('\n')) hash = Math.imul(hash ^ caracter.codePointAt(0), 0x01000193) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

describe('els ids publicats', () => {
  test('cap tall lleva ni reanomena un id d’un tall anterior: els de cada tall continuen al principi, en el mateix ordre', () => {
    for (const { tall, nombre, empremta: esperada } of TALLS_PUBLICATS) {
      expect(PRODUCTES.length, tall).toBeGreaterThanOrEqual(nombre);
      expect(empremta(PRODUCTES.slice(0, nombre).map(([id]) => id)), tall).toBe(esperada);
    }
    /* L'últim tall anotat és el de FONT: un tall nou n'ha de deixar l'empremta. */
    expect(TALLS_PUBLICATS[TALLS_PUBLICATS.length - 1]).toMatchObject({ tall: FONT.tall, nombre: PRODUCTES.length });
  });

  test('sonda: l’empremta canvia si es lleva, es reanomena o es mou un id', () => {
    const ids = PRODUCTES.map(([id]) => id);
    const original = empremta(ids);
    expect(empremta(ids.slice(1))).not.toBe(original);
    expect(empremta([`${ids[0]}-2`, ...ids.slice(1)])).not.toBe(original);
    expect(empremta([ids[1], ids[0], ...ids.slice(2)])).not.toBe(original);
  });
});

describe('la deriva respecte del full', () => {
  test.skipIf(!HI_HA_FULL)('l’importador aplicat al full sobre el tall publicat dona EXACTAMENT PRODUCTES, i només avisa de la nota', () => {
    const { productes, avisos } = importaProductes(readFileSync(path.join(ARREL, FULL)), { publicats: PRODUCTES, delimitador: ',' });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatch(/és una nota, no un producte/);
    expect(productes).toEqual(PRODUCTES.map((fila) => [...fila]));
  });
});
