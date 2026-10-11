// @vitest-environment node
/* La Nevera de Casa · els ingredients i el receptari de llavor (dades pures).
   Onada 12 (261011; ordres 261011_0130, punt 6). La taula de formes és menuda
   i és l'única cosa que diu que dos noms són el mateix ingredient: ací es
   vigila que no es contradiga, que el receptari només nomene ingredients de la
   taula i que afegir «el que falta» pose l'article de sempre del catàleg. */
import { describe, expect, test } from 'vitest';
import { ARTICLES_BASE, ARTICLES_PRODUCTES, RECEPTES, clauDeNom, ingredientDArticle, ingredientPerId, nomEnFrase, receptaPerId } from './index.js';
/* Correcció del refutador (261011, R5) · El que només miren les proves s'importa del fitxer, no de la façana. */
import { INGREDIENTS, PRODUCTES_INGREDIENT, ingredientDe } from './ingredients.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('la taula d’ingredients', () => {
  test('ids únics i en slug, noms nets, i cada forma ja és una clau de nom', () => {
    expect(INGREDIENTS.length).toBeGreaterThan(20);
    expect(new Set(INGREDIENTS.map((i) => i.id)).size).toBe(INGREDIENTS.length);
    for (const ingredient of INGREDIENTS) {
      expect(ingredient.id, ingredient.id).toMatch(SLUG);
      expect(ingredient.nom.trim(), ingredient.id).toBe(ingredient.nom);
      expect(typeof ingredient.fresc, ingredient.id).toBe('boolean');
      expect(ingredient.formes.length, ingredient.id).toBeGreaterThan(1);
      for (const forma of ingredient.formes) expect(clauDeNom(forma), `${ingredient.id}: ${forma}`).toBe(forma);
      expect(Object.isFrozen(ingredient) && Object.isFrozen(ingredient.formes), ingredient.id).toBe(true);
    }
  });

  test('cap forma és de dos ingredients: un nom només pot voler dir una cosa', () => {
    const vistes = new Map();
    const repetides = [];
    for (const ingredient of INGREDIENTS) {
      for (const forma of ingredient.formes) {
        if (vistes.has(forma)) repetides.push(`${forma}: ${vistes.get(forma)} i ${ingredient.id}`);
        vistes.set(forma, ingredient.id);
      }
    }
    expect(repetides).toEqual([]);
  });

  test('accents, majúscules, espais, plurals i sinònims valencians i castellans', () => {
    const casos = {
      tomaca: ['Tomaques', 'tomaca', ' TOMATA ', 'tomates', 'Tomàquets', 'tomate'],
      creilla: ['Creïlles', 'creilla', 'Patates', 'patatas', 'patata'],
      safanoria: ['Safanòries', 'safanoria', 'Carlota', 'carlotes', 'pastanagues', 'zanahorias'],
      bajoca: ['Bajoques', 'bajoca', 'Mongeta tendra', 'mongetes tendres', 'judías verdes'],
      fesol: ['Fesols', 'fesol', 'mongeta', 'Mongetes', 'alubias'],
      pebrot: ['Pebrots', 'pebrera', 'Pebrot roig', 'pimientos'],
      all: ['Alls', 'all', 'ajo'],
      oli: ['Oli d’oliva', 'oli d\'oliva', 'OLI', 'Oli d’oliva verge extra', 'aceite de oliva'],
      arros: ['Arròs', 'arros', 'Arròs bomba', 'arroz'],
      pinyo: ['Pinyons', 'pinyó', 'piñones']
    };
    for (const [id, noms] of Object.entries(casos)) {
      for (const nom of noms) expect(ingredientDe(nom)?.id, nom).toBe(id);
    }
  });

  test('si el dubte és entre casar malament i no casar, no es casa', () => {
    for (const nom of [
      'Tomaca fregida', 'Creïlles de bossa', 'Suc de taronja', 'Salsa de tomate', 'All tendre', 'Pa de motle', 'Pebre',
      'Carabassa', 'Paper de cuina', 'Formatge fresc', 'Tom', '', '   ', null, undefined, 42
    ]) expect(ingredientDe(nom), String(nom)).toBeNull();
  });

  test('ingredientPerId i el nom dins d’una frase', () => {
    expect(ingredientPerId('tomaca').nom).toBe('Tomaques');
    expect(ingredientPerId('no-hi-es')).toBeNull();
    expect(nomEnFrase(ingredientPerId('oli'))).toBe('oli d’oliva');
    expect(nomEnFrase(null)).toBe('');
  });

  test('el nom d’un ingredient que el catàleg de base ja té és EL DEL CATÀLEG: afegir el que falta no en crea cap de propi', () => {
    const deBase = new Map(ARTICLES_BASE.map((article) => [clauDeNom(article.nom), article]));
    const ambArticle = INGREDIENTS.filter((ingredient) => deBase.has(clauDeNom(ingredient.nom)));
    /* Els de sempre del súper hi són; els de mas (penques, naps, bledes…) es crearan com a propis. */
    expect(ambArticle.map((i) => i.id)).toEqual(expect.arrayContaining([
      'tomaca', 'creilla', 'ceba', 'all', 'pebrot', 'carabasso', 'safanoria', 'arros', 'cigro', 'fesol', 'llentilla', 'ou', 'oli',
      'sal', 'farina', 'llevat', 'pa', 'safra'
    ]));
    for (const ingredient of ambArticle) expect(deBase.get(clauDeNom(ingredient.nom)).nom, ingredient.id).toBe(ingredient.nom);
    /* I cada article de base que es diu com una forma és eixe ingredient i cap altre. */
    for (const article of ARTICLES_BASE) {
      const ingredient = ingredientDe(article.nom);
      if (ingredient) expect(ingredient.formes, article.id).toContain(clauDeNom(article.nom));
    }
  });
});

/* Correccions del refutador (261011). */
describe('R2 · el nombre de cada ingredient el diu la taula', () => {
  test('cada ingredient porta `plural`, i és el del seu nom (no s’endevina per la «s» final)', () => {
    for (const ingredient of INGREDIENTS) expect(typeof ingredient.plural, ingredient.id).toBe('boolean');
    const plurals = INGREDIENTS.filter((i) => i.plural).map((i) => i.id);
    expect(plurals).toEqual(['tomaca', 'creilla', 'ceba', 'all', 'pebrot', 'alberginia', 'bajoca', 'nap', 'penca', 'bleda', 'safanoria',
      'cigro', 'fesol', 'llentilla', 'ou', 'botifarra', 'pinyo']);
    /* «Arròs» acaba en s i és singular; «Carabassó» no hi acaba i també ho és. */
    expect(ingredientPerId('arros').plural).toBe(false);
    expect(ingredientPerId('carabasso').plural).toBe(false);
  });
});

describe('R4 · la tonyina de la coca és de llanda, no la fresca del catàleg', () => {
  test('l’ingredient es diu «Tonyina en conserva», i l’article de base «Tonyina» (Carn i peix) no hi casa', () => {
    expect(ingredientPerId('tonyina').nom).toBe('Tonyina en conserva');
    const fresca = ARTICLES_BASE.find((article) => article.id === 'tonyina');
    expect(fresca).toMatchObject({ nom: 'Tonyina', categoriaId: 'carn-peix' });
    expect(ingredientDArticle(fresca)).toBeNull();
    for (const nom of ['Tonyina', 'tonyina', 'Atún']) expect(ingredientDe(nom), nom).toBeNull();
    for (const nom of ['Tonyina en conserva', 'tonyina de llanda', 'Tonyina en oli', 'Atún en conserva']) expect(ingredientDe(nom)?.id, nom).toBe('tonyina');
  });
});

describe('R1 · els productes de botiga casen per una taula explícita d’ids, mai pel nom', () => {
  const perId = new Map(ARTICLES_PRODUCTES.map((producte) => [producte.id, producte]));
  const casats = ARTICLES_PRODUCTES.filter((producte) => ingredientDArticle(producte));

  test('cada id de la taula és un producte del catàleg real, d’un ingredient de la taula, i cap és congelat ni preparat', () => {
    const entrades = Object.entries(PRODUCTES_INGREDIENT);
    expect(entrades.length).toBeGreaterThan(40);
    for (const [producteId, ingredientId] of entrades) {
      expect(perId.has(producteId), producteId).toBe(true);
      expect(ingredientPerId(ingredientId), `${producteId}: ${ingredientId}`).not.toBeNull();
      expect(perId.get(producteId).categoriaId, producteId).not.toBe('congelats');
      expect(perId.get(producteId).nom, producteId).not.toMatch(/a la |con |frit|cocid[ao] y|adobad|ensalada de|triturad|ultracongel/i);
    }
  });

  test('sobre el catàleg real: en casen exactament els de la taula (abans, 5 pel nom, i un era un plat preparat)', () => {
    expect(ARTICLES_PRODUCTES).toHaveLength(592);
    expect(casats.map((p) => p.id).sort()).toEqual(Object.keys(PRODUCTES_INGREDIENT).sort());
    expect(casats).toHaveLength(42);
    expect(casats.filter((p) => p.categoriaId === 'congelats')).toEqual([]);
  });

  test('els frescos i bàsics que no casaven, ara sí', () => {
    const esperat = {
      'mer-patatas-5-kg': 'creilla', 'mer-cebollas-2-kg': 'ceba', 'mer-ajos-morados': 'all', 'mer-pimiento-rojo': 'pebrot',
      'mer-calabacin-verde': 'carabasso', 'mer-zanahorias-1-kg': 'safanoria', 'mer-huevos-grandes-l': 'ou',
      'mer-harina-de-trigo-hacendado': 'farina', 'mer-arroz-redondo-categoria-i': 'arros', 'mer-tomate-pera': 'tomaca',
      'mer-garbanzo-cocido': 'cigro', 'mer-atun-en-aceite-de-oliva': 'tonyina', 'mer-berenjena': 'alberginia', 'mer-acelgas': 'bleda',
      'mer-judia-verde-redonda': 'bajoca', 'mer-lenteja-pardina-categoria-extra': 'llentilla'
    };
    for (const [producteId, ingredientId] of Object.entries(esperat)) expect(ingredientDArticle(perId.get(producteId))?.id, producteId).toBe(ingredientId);
  });

  test('el fals positiu fora: «Lentejas» (un bol preparat de la secció de congelats) no és llentilla crua, ni cap altre preparat', () => {
    expect(perId.get('mer-lentejas')).toMatchObject({ nom: 'Lentejas', categoriaId: 'congelats', envas: 'Bol' });
    for (const id of [
      'mer-lentejas', 'mer-lentejas-a-la-riojana', 'mer-garbanzos-a-la-jardinera', 'mer-arroz-tres-delicias-ultracongelado',
      'mer-arroz-cocido-redondo-sabroz', 'mer-tomate-frito-560-g', 'mer-zanahoria-en-tiras', 'mer-patatas-con-allioli',
      'mer-costilla-de-cerdo-iberico-adobada', 'mer-arroz-con-leche', 'mer-pimientos-del-piquillo-enteros-extra'
    ]) {
      expect(perId.has(id), id).toBe(true);
      expect(ingredientDArticle(perId.get(id)), id).toBeNull();
    }
  });

  test('un producte de botiga mai casa pel nom; un article de base o propi, sí', () => {
    /* Un producte inventat que es diu com una forma: sense ser a la taula, no casa. */
    expect(ingredientDArticle({ id: 'mer-inventat', nom: 'Tomates', categoriaId: 'congelats', font: 'mer' })).toBeNull();
    expect(ingredientDArticle({ id: 'tomaques', nom: 'Tomaques', categoriaId: 'fruita-verdura' })?.id).toBe('tomaca');
    expect(ingredientDArticle({ id: 'p-1', nom: 'Patates', categoriaId: 'propis', propi: true })?.id).toBe('creilla');
    expect(ingredientDArticle(null)).toBeNull();
  });
});

describe('el receptari de llavor', () => {
  test('ids únics i en slug (van a la URL), nom, resum i racions', () => {
    expect(RECEPTES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(RECEPTES.map((r) => r.id)).size).toBe(RECEPTES.length);
    for (const recepta of RECEPTES) {
      expect(recepta.id, recepta.id).toMatch(SLUG);
      expect(recepta.nom.trim().length, recepta.id).toBeGreaterThan(2);
      expect(recepta.resum.trim().length, recepta.id).toBeGreaterThan(10);
      expect(recepta.resum.length, recepta.id).toBeLessThanOrEqual(80);
      /* És el subtítol de la targeta: sense punt final. */
      expect(recepta.resum.endsWith('.'), recepta.id).toBe(false);
      expect(Number.isSafeInteger(recepta.racions) && recepta.racions > 0, recepta.id).toBe(true);
      expect(receptaPerId(recepta.id)).toBe(recepta);
    }
    expect(receptaPerId('no-hi-es')).toBeNull();
  });

  test('cada ingredient és de la taula, amb quantitat, sense repetits, i cada recepta en té almenys dos d’obligatoris', () => {
    for (const recepta of RECEPTES) {
      const ids = recepta.ingredients.flatMap((entrada) => [entrada.id, ...entrada.o]);
      expect(new Set(ids).size, recepta.id).toBe(ids.length);
      for (const id of ids) expect(ingredientPerId(id), `${recepta.id}: ${id}`).not.toBeNull();
      for (const entrada of recepta.ingredients) {
        expect(typeof entrada.opcional, `${recepta.id}: ${entrada.id}`).toBe('boolean');
        expect(entrada.quantitat.trim().length, `${recepta.id}: ${entrada.id}`).toBeGreaterThan(0);
      }
      expect(recepta.ingredients.filter((entrada) => !entrada.opcional).length, recepta.id).toBeGreaterThanOrEqual(2);
    }
  });

  test('cap ingredient de la taula sobra: tots ixen en alguna recepta', () => {
    const usats = new Set(RECEPTES.flatMap((recepta) => recepta.ingredients.flatMap((entrada) => [entrada.id, ...entrada.o])));
    expect(INGREDIENTS.filter((ingredient) => !usats.has(ingredient.id)).map((i) => i.id)).toEqual([]);
  });

  test('cap afirmació de salut ni d’al·lèrgens als textos del receptari', () => {
    const vetat = /salut|saludable|sa\b|sana\b|al·l[eè]rg|alerg|gluten|lactosa|diet|calori|vitamin|cur[ae]\b|apte|intoler|celíac|colesterol|light/i;
    const textos = RECEPTES.flatMap((recepta) => [recepta.nom, recepta.resum, ...recepta.ingredients.map((entrada) => entrada.quantitat)]);
    expect(textos.filter((text) => vetat.test(text))).toEqual([]);
    for (const recepta of RECEPTES) expect(Object.keys(recepta).sort(), recepta.id).toEqual(['id', 'ingredients', 'nom', 'racions', 'resum']);
  });
});
