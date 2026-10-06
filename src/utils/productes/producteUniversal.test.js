// @vitest-environment node
/* Productes · utils/productes/producteUniversal.js — el contracte comú dels
   productes de casa i de bar (ordre del Mestre, 261006). Cada funció amb
   casos bons i dolents, sobre un producte de la llavor genèrica del Bar i
   articles de la Nevera COPIATS ací en sintètic: la prova no importa cap app
   (la frontera de src/utils ho veta). Al final, la qualitat de la carpeta:
   ESLint amb zero missatges, JS pur i Baseline 2022. Els patrons vetats es
   componen a trossos perquè les portes que llegixen src/ no els troben ací
   (patró de src/utils/temporada/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import {
  ABREVIATURES_ALERGENS, ALERGENS, CANALS, DOMINIS, ESTATS_IMATGE, NOMS_ALERGENS, UNITATS, canalsDe, esDelCanal, esIdOpac, ordenaAlergens,
  producteDeBar, producteDeCasa, validaAlergens, validaCanals, validaProducteUniversal
} from './producteUniversal.js';

const t = (...trossos) => trossos.join('');
const car = (codi) => String.fromCodePoint(codi);

/* Una fila de la llavor genèrica del Bar (nucli/llavor.js), copiada i desplegada. */
const cafeLlet = () => ({
  id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafeteria',
  variants: [{ id: 'tassa', nom: 'Tassa', preuCents: 150 }, { id: 'got', nom: 'Got', preuCents: 170 }],
  grupsModificadors: ['llet'], alergens: ['llet'], imatge: { slug: 'cafeteria-cafe-llet', estat: 'marcador' },
  reposaNevera: false, desti: 'barra', preuObert: false, actiu: true, ordre: 3, exemple: true
});

/* Un producte sintètic com els que importa nucli/loyverse.js: `handle`, `ref`, ml i cost. */
const cervesaBarril = () => ({
  id: 'cervesa-barril', nom: 'Cervesa de barril', categoriaId: 'cerveseria', handle: 'cervesa-barril',
  variants: [{ id: 'canya', nom: 'Canya', preuCents: 180, ml: 200, costCents: 60, ref: 'c1' }, { id: 'gerra', nom: 'Gerra', preuCents: 300, ml: 500 }],
  grupsModificadors: [], alergens: ['gluten'], imatge: { slug: 'cerveseria-cervesa-barril', estat: 'marcador' },
  reposaNevera: false, desti: 'barra', preuObert: false, actiu: true, ordre: 23, exemple: true,
  canals: { cartaDigital: true, perEmportar: false }
});

/* Una fila compacta de la Nevera (nevera/nucli/productes.js), copiada tal qual:
   [id, nom, seccioId, marca, envas, quantitat, unitat, preuCentims]. */
const FILA_NEVERA = Object.freeze(['mer-cerveza-rubia-clasica', 'Cerveza rubia clásica', 'begudes', 'Calatrava', '12 latas de 33 cl', 3.96, 'l', 372]);
/* El mateix producte de botiga en objecte, com ARTICLES_PRODUCTES de nevera/nucli/cataleg.js. */
const ketchup = () => ({
  id: 'mer-ketchup', nom: 'Ketchup', categoriaId: 'ingredients-especies', font: 'mer', marca: 'Hacendado', envas: 'Bote',
  quantitat: 600, unitat: 'g', preuCentims: 130
});

describe('constants', () => {
  test('els dos dominis, els dos canals, les unitats i els estats de la imatge, congelats', () => {
    expect(DOMINIS).toEqual(['casa', 'bar']);
    expect(CANALS).toEqual(['carta-digital', 'emportar']);
    expect(UNITATS).toEqual(['u', 'g', 'kg', 'ml', 'l']);
    expect(ESTATS_IMATGE).toEqual(['marcador', 'definitiva']);
    for (const llista of [DOMINIS, CANALS, UNITATS, ESTATS_IMATGE]) expect(Object.isFrozen(llista)).toBe(true);
  });

  test('els 14 al·lèrgens del Reglament (UE) 1169/2011, annex II, en el seu ordre, congelats', () => {
    expect(ALERGENS).toEqual([
      'gluten', 'crustacis', 'ous', 'peix', 'cacauets', 'soja', 'llet',
      'fruits-closca', 'api', 'mostassa', 'sesam', 'sulfits', 'tramussos', 'molluscs'
    ]);
    expect(new Set(ALERGENS).size).toBe(14);
    expect(ALERGENS.every(esIdOpac)).toBe(true);
    expect(Object.isFrozen(ALERGENS)).toBe(true);
  });

  test('el nom en valencià de cada al·lergen: un per id, en el mateix ordre, congelats', () => {
    expect(Object.keys(NOMS_ALERGENS)).toEqual([...ALERGENS]);
    expect(NOMS_ALERGENS).toEqual({
      gluten: 'Gluten', crustacis: 'Crustacis', ous: 'Ous', peix: 'Peix', cacauets: 'Cacauets', soja: 'Soja',
      llet: 'Llet', 'fruits-closca': 'Fruits de closca', api: 'Api', mostassa: 'Mostassa', sesam: 'Sèsam',
      sulfits: 'Diòxid de sofre i sulfits', tramussos: 'Tramussos', molluscs: 'Mol·luscs'
    });
    expect(Object.isFrozen(NOMS_ALERGENS)).toBe(true);
  });

  test('l’abreviatura de cada al·lergen: una per id, en el mateix ordre, dos majúscules i totes diferents, congelades', () => {
    expect(Object.keys(ABREVIATURES_ALERGENS)).toEqual([...ALERGENS]);
    expect(ABREVIATURES_ALERGENS).toEqual({
      gluten: 'GL', crustacis: 'CR', ous: 'OU', peix: 'PE', cacauets: 'CA', soja: 'SO', llet: 'LL',
      'fruits-closca': 'FC', api: 'AP', mostassa: 'MS', sesam: 'SE', sulfits: 'SU', tramussos: 'TR', molluscs: 'ML'
    });
    const valors = Object.values(ABREVIATURES_ALERGENS);
    expect(new Set(valors).size).toBe(14);
    for (const valor of valors) expect(valor).toMatch(/^[A-Z]{2}$/);
    expect(Object.isFrozen(ABREVIATURES_ALERGENS)).toBe(true);
  });
});

describe('validaAlergens', () => {
  const NO_LLISTA = 'alergens: ha de ser una llista dels 14 al·lèrgens del Reglament';

  test('una llista buida, els 14 o uns quants en qualsevol ordre, és vàlida', () => {
    expect(validaAlergens([])).toEqual([]);
    expect(validaAlergens([...ALERGENS])).toEqual([]);
    expect(validaAlergens([...ALERGENS].reverse())).toEqual([]);
    expect(validaAlergens(['llet', 'gluten', 'fruits-closca'])).toEqual([]);
  });

  test('el que no és una llista, no (si cal o no, ho diu qui la crida)', () => {
    for (const dolent of [undefined, null, 'llet', 7, { 0: 'llet', length: 1 }, new Set(['llet'])]) {
      expect(validaAlergens(dolent), String(dolent)).toEqual([NO_LLISTA]);
    }
  });

  test('cada element, un id dels 14: res d’inventat, de majúscules, d’accents ni que no siga text', () => {
    expect(validaAlergens(['gluten', 'xocolata', 'Llet', 'sèsam', 'fruits_closca', 12, null, ['llet']])).toEqual([
      'alergens[1]: no és cap dels 14 al·lèrgens del Reglament',
      'alergens[2]: no és cap dels 14 al·lèrgens del Reglament',
      'alergens[3]: no és cap dels 14 al·lèrgens del Reglament',
      'alergens[4]: no és cap dels 14 al·lèrgens del Reglament',
      'alergens[5]: no és cap dels 14 al·lèrgens del Reglament',
      'alergens[6]: no és cap dels 14 al·lèrgens del Reglament',
      'alergens[7]: no és cap dels 14 al·lèrgens del Reglament'
    ]);
  });

  test('cap repetit: cada repetició, al seu lloc', () => {
    expect(validaAlergens(['llet', 'ous', 'llet', 'llet'])).toEqual(['alergens[2]: «llet» repetit', 'alergens[3]: «llet» repetit']);
    expect(validaAlergens(['xocolata', 'xocolata'])).toEqual([
      'alergens[0]: no és cap dels 14 al·lèrgens del Reglament', 'alergens[1]: no és cap dels 14 al·lèrgens del Reglament'
    ]);
  });

  test('no toca la llista que rep', () => {
    const llista = ['llet', 'gluten', 'llet'];
    validaAlergens(llista);
    expect(llista).toEqual(['llet', 'gluten', 'llet']);
  });
});

describe('ordenaAlergens', () => {
  test('l’ordre del Reglament, sense repetits ni desconeguts, en una llista nova', () => {
    const llista = ['sulfits', 'llet', 'gluten', 'llet', 'xocolata', 'molluscs'];
    const ordenats = ordenaAlergens(llista);
    expect(ordenats).toEqual(['gluten', 'llet', 'sulfits', 'molluscs']);
    expect(llista).toEqual(['sulfits', 'llet', 'gluten', 'llet', 'xocolata', 'molluscs']);
    const tots = [...ALERGENS];
    expect(ordenaAlergens(tots)).toEqual(tots);
    expect(ordenaAlergens(tots)).not.toBe(tots);
    expect(ordenaAlergens([...ALERGENS].reverse())).toEqual([...ALERGENS]);
    expect(ordenaAlergens(ALERGENS)).not.toBe(ALERGENS);
  });

  test('sense llista, o sense cap dels 14, una llista buida', () => {
    for (const buit of [undefined, null, 'llet', {}, [], ['Llet', 'xocolata']]) expect(ordenaAlergens(buit), String(buit)).toEqual([]);
  });
});

describe('esIdOpac', () => {
  test('els ids del Bar, de la Nevera i dels propis ho són', () => {
    for (const id of ['cafe-llet', 't5', 'mer-ketchup', 'p-12', 'llet', 'a_b', 'a'.repeat(64)]) expect(esIdOpac(id), id).toBe(true);
  });

  test('majúscules, accents, espais, un guió davant, massa llarg o no-text, no', () => {
    for (const id of ['', 'Cafe', 'cafè', 'cafe llet', '-cafe', '_cafe', 'a'.repeat(65), 12, null, undefined, ['cafe']]) {
      expect(esIdOpac(id), String(id)).toBe(false);
    }
  });
});

describe('canalsDe i esDelCanal', () => {
  test('sense canals, tots dos a cert (la carta d’ara no canvia)', () => {
    expect(canalsDe(cafeLlet())).toEqual({ cartaDigital: true, perEmportar: true });
    expect(canalsDe({})).toEqual({ cartaDigital: true, perEmportar: true });
    expect(canalsDe(null)).toEqual({ cartaDigital: true, perEmportar: true });
    expect(canalsDe(undefined)).toEqual({ cartaDigital: true, perEmportar: true });
  });

  test('amb canals, els seus, en una còpia nova', () => {
    const producte = cervesaBarril();
    const canals = canalsDe(producte);
    expect(canals).toEqual({ cartaDigital: true, perEmportar: false });
    expect(canals).not.toBe(producte.canals);
    canals.perEmportar = true;
    expect(producte.canals.perEmportar).toBe(false);
    expect(canalsDe({ canals: { cartaDigital: false, perEmportar: false } })).toEqual({ cartaDigital: false, perEmportar: false });
  });

  test('un valor mal format no es llegix: la clau que no és booleana compta com a cert', () => {
    expect(canalsDe({ canals: { cartaDigital: false } })).toEqual({ cartaDigital: false, perEmportar: true });
    expect(canalsDe({ canals: { cartaDigital: 'no', perEmportar: 0 } })).toEqual({ cartaDigital: true, perEmportar: true });
    expect(canalsDe({ canals: 'cap' })).toEqual({ cartaDigital: true, perEmportar: true });
    expect(canalsDe({ canals: [false, false] })).toEqual({ cartaDigital: true, perEmportar: true });
  });

  test('esDelCanal: cada canal llig la seua clau; un canal desconegut, mai', () => {
    const producte = cervesaBarril();
    expect(esDelCanal(producte, 'carta-digital')).toBe(true);
    expect(esDelCanal(producte, 'emportar')).toBe(false);
    expect(esDelCanal(cafeLlet(), 'carta-digital')).toBe(true);
    expect(esDelCanal(cafeLlet(), 'emportar')).toBe(true);
    for (const canal of ['cartaDigital', 'perEmportar', 'a-domicili', 'toString', '', undefined, null]) {
      expect(esDelCanal(cafeLlet(), canal), String(canal)).toBe(false);
    }
  });
});

describe('validaCanals', () => {
  test('absent, o un objecte amb les dues claus booleanes, és vàlid', () => {
    expect(validaCanals(undefined)).toEqual([]);
    for (const cartaDigital of [true, false]) {
      for (const perEmportar of [true, false]) expect(validaCanals({ cartaDigital, perEmportar })).toEqual([]);
    }
  });

  test('null, un text, una llista, claus que falten, valors que no són booleans o claus de més, no', () => {
    const objecte = 'canals: ha de ser un objecte { cartaDigital, perEmportar }';
    expect(validaCanals(null)).toEqual([objecte]);
    expect(validaCanals('tots')).toEqual([objecte]);
    expect(validaCanals([true, true])).toEqual([objecte]);
    expect(validaCanals({})).toEqual(['canals.cartaDigital: ha de ser booleà', 'canals.perEmportar: ha de ser booleà']);
    expect(validaCanals({ cartaDigital: 1, perEmportar: true })).toEqual(['canals.cartaDigital: ha de ser booleà']);
    expect(validaCanals({ cartaDigital: true, perEmportar: true, aDomicili: true })).toEqual(['canals: clau no permesa «aDomicili»']);
  });
});

/* La marca de l'ORGANITZACIÓ té un sol contracte, marcaNeta del pont de sessió
   (src/apps/plataforma/sessioApp.js, amb les seues proves): este mòdul no en
   fa un segon que el contradiga (slug obligatori, un id d'organització). */
describe('la marca de l’organització no és d’este mòdul', () => {
  test('cap validaMarca ni cap id d’organització: el contracte és marcaNeta', async () => {
    const modul = await import('./producteUniversal.js');
    expect(Object.keys(modul)).not.toContain('validaMarca');
    const codi = readFileSync(path.join(process.cwd(), 'src/utils/productes/producteUniversal.js'), 'utf8');
    expect(codi).not.toMatch(/organitzacioId|CLAUS_MARCA/);
    expect(codi).toContain('marcaNeta');
  });
});

describe('producteDeBar', () => {
  test('un producte de la llavor: les variants són presentacions, i sense canals, tots dos', () => {
    const universal = producteDeBar(cafeLlet());
    expect(universal).toEqual({
      id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafeteria', domini: 'bar',
      presentacions: [{ id: 'tassa', nom: 'Tassa', preuCents: 150 }, { id: 'got', nom: 'Got', preuCents: 170 }],
      imatge: { slug: 'cafeteria-cafe-llet', estat: 'marcador' },
      alergens: ['llet'],
      canals: { cartaDigital: true, perEmportar: true }
    });
    expect(validaProducteUniversal(universal)).toEqual([]);
  });

  test('els ml passen a quantitat; el cost, el handle, el ref i els camps de la caixa es queden al Bar; els canals, copiats', () => {
    const producte = cervesaBarril();
    const universal = producteDeBar(producte);
    expect(universal.presentacions).toEqual([
      { id: 'canya', nom: 'Canya', preuCents: 180, quantitat: 200, unitat: 'ml' },
      { id: 'gerra', nom: 'Gerra', preuCents: 300, quantitat: 500, unitat: 'ml' }
    ]);
    expect(Object.keys(universal).sort()).toEqual(['alergens', 'canals', 'categoriaId', 'domini', 'id', 'imatge', 'nom', 'presentacions']);
    expect(universal.canals).toEqual({ cartaDigital: true, perEmportar: false });
    expect(universal.canals).not.toBe(producte.canals);
    expect(validaProducteUniversal(universal)).toEqual([]);
  });

  test('no toca el producte d’entrada', () => {
    const producte = cafeLlet();
    const abans = JSON.stringify(producte);
    const universal = producteDeBar(producte);
    universal.alergens.push('ous');
    universal.imatge.estat = 'definitiva';
    expect(JSON.stringify(producte)).toBe(abans);
  });

  test('copia sense arreglar: el que no casa ho troba la validació', () => {
    const senseVariants = producteDeBar({ ...cafeLlet(), variants: undefined });
    expect(senseVariants.presentacions).toEqual([]);
    expect(validaProducteUniversal(senseVariants)).toEqual(['presentacions: cal almenys una presentació']);
    const canalsDolents = producteDeBar({ ...cafeLlet(), canals: { cartaDigital: 'si', perEmportar: true } });
    expect(validaProducteUniversal(canalsDolents)).toEqual(['canals.cartaDigital: ha de ser booleà']);
    const senseAlergens = producteDeBar({ ...cafeLlet(), alergens: 'llet' });
    expect(validaProducteUniversal(senseAlergens)).toEqual(['alergens: ha de ser una llista dels 14 al·lèrgens del Reglament']);
    /* L'ordre dels al·lèrgens es copia tal qual: validaAlergens no el mira. */
    const desordenats = producteDeBar({ ...cafeLlet(), alergens: ['llet', 'gluten'] });
    expect(desordenats.alergens).toEqual(['llet', 'gluten']);
    expect(validaProducteUniversal(desordenats)).toEqual([]);
    const sensePreu = producteDeBar({ ...cafeLlet(), variants: [{ id: 'tassa', nom: 'Tassa' }] });
    expect(validaProducteUniversal(sensePreu)).toEqual(['presentacions[0]: una presentació de bar porta preuCents']);
  });

  test('llança TypeError si no rep un objecte', () => {
    for (const dolent of [null, undefined, 'cafe-llet', [cafeLlet()]]) expect(() => producteDeBar(dolent), String(dolent)).toThrow(TypeError);
  });
});

describe('producteDeCasa', () => {
  test('una fila compacta de la Nevera: una presentació amb l’envàs, la quantitat decimal i el preu en cèntims', () => {
    const universal = producteDeCasa(FILA_NEVERA);
    expect(universal).toEqual({
      id: 'mer-cerveza-rubia-clasica', nom: 'Cerveza rubia clásica', categoriaId: 'begudes', domini: 'casa',
      presentacions: [{ id: 'unitat', nom: '12 latas de 33 cl', preuCents: 372, quantitat: 3.96, unitat: 'l' }],
      marca: 'Calatrava'
    });
    expect(validaProducteUniversal(universal)).toEqual([]);
  });

  test('un producte de botiga en objecte porta la font', () => {
    const universal = producteDeCasa(ketchup());
    expect(universal).toEqual({
      id: 'mer-ketchup', nom: 'Ketchup', categoriaId: 'ingredients-especies', domini: 'casa',
      presentacions: [{ id: 'unitat', nom: 'Bote', preuCents: 130, quantitat: 600, unitat: 'g' }],
      marca: 'Hacendado', font: 'mer'
    });
    expect(validaProducteUniversal(universal)).toEqual([]);
  });

  test('un article de base i un de propi: «Unitat», sense marca, sense preu i sense el camp `propi`', () => {
    expect(producteDeCasa({ id: 'llet', nom: 'Llet', categoriaId: 'llet-formatge' })).toEqual({
      id: 'llet', nom: 'Llet', categoriaId: 'llet-formatge', domini: 'casa', presentacions: [{ id: 'unitat', nom: 'Unitat' }]
    });
    const propi = producteDeCasa({ id: 'p-3', nom: 'Fesols de la terra', categoriaId: 'propis', propi: true });
    expect(propi).not.toHaveProperty('propi');
    expect(validaProducteUniversal(propi)).toEqual([]);
  });

  test('un envàs o una marca buits no passen; la secció també es pot dir seccioId', () => {
    const universal = producteDeCasa({ ...ketchup(), envas: '  ', marca: '', unitat: '' });
    expect(universal.presentacions).toEqual([{ id: 'unitat', nom: 'Unitat', preuCents: 130, quantitat: 600 }]);
    expect(universal).not.toHaveProperty('marca');
    expect(producteDeCasa({ id: 'sal', nom: 'Sal', seccioId: 'ingredients-especies' }).categoriaId).toBe('ingredients-especies');
  });

  test('copia sense arreglar: el que no casa ho troba la validació', () => {
    const dolent = producteDeCasa({ ...ketchup(), id: 'Mer Ketchup', preuCentims: 1.3, unitat: 'litres' });
    expect(validaProducteUniversal(dolent)).toEqual([
      'id: ha de ser un id opac',
      'presentacions[0]: preuCents ha de ser un enter de 0 a 10000000',
      'presentacions[0]: unitat u | g | kg | ml | l'
    ]);
  });

  test('llança TypeError si no rep un objecte ni una fila', () => {
    for (const dolent of [null, undefined, 'llet', 42]) expect(() => producteDeCasa(dolent), String(dolent)).toThrow(TypeError);
  });
});

describe('validaProducteUniversal', () => {
  const deCasa = () => producteDeCasa(ketchup());
  const deBar = () => producteDeBar(cafeLlet());

  test('no és un objecte', () => {
    for (const dolent of [null, undefined, 'cafe-llet', [deBar()]]) {
      expect(validaProducteUniversal(dolent), String(dolent)).toEqual(['producte: ha de ser un objecte']);
    }
  });

  test('la llista blanca: cap camp desconegut, tampoc als fills', () => {
    expect(validaProducteUniversal({ ...deBar(), preuObert: true, actiu: true })).toEqual([
      'producte: clau no permesa «preuObert»', 'producte: clau no permesa «actiu»'
    ]);
    const producte = deBar();
    producte.presentacions[0].costCents = 20;
    producte.imatge.ruta = 'x';
    expect(validaProducteUniversal(producte)).toEqual([
      'presentacions[0]: clau no permesa «costCents»', 'imatge: clau no permesa «ruta»'
    ]);
  });

  test('id, nom, categoria i domini', () => {
    expect(validaProducteUniversal({ ...deCasa(), id: undefined, nom: 'x'.repeat(61), categoriaId: 'Begudes', domini: 'botiga' })).toEqual([
      'id: ha de ser un id opac', 'nom: cal un nom de fins a 60 caràcters', 'categoriaId: ha de ser un id opac', 'domini: casa | bar'
    ]);
    expect(validaProducteUniversal({ ...deCasa(), nom: t('Ketchup', car(0x2028)) })).toEqual(['nom: cal un nom de fins a 60 caràcters']);
    expect(validaProducteUniversal({ ...deCasa(), nom: 'x'.repeat(60) })).toEqual([]);
  });

  test('presentacions: almenys una, objectes, ids únics, nom, preu enter, quantitat positiva i unitat coneguda', () => {
    expect(validaProducteUniversal({ ...deCasa(), presentacions: [] })).toEqual(['presentacions: cal almenys una presentació']);
    expect(validaProducteUniversal({ ...deCasa(), presentacions: 'Bote' })).toEqual(['presentacions: cal almenys una presentació']);
    expect(validaProducteUniversal({ ...deCasa(), presentacions: ['Bote'] })).toEqual(['presentacions[0]: ha de ser un objecte']);
    const p = (canvis) => ({ ...deBar(), presentacions: [{ id: 'tassa', nom: 'Tassa', preuCents: 150, ...canvis }] });
    expect(validaProducteUniversal({ ...deBar(), presentacions: [{ id: 'tassa', nom: 'Tassa', preuCents: 150 }, { id: 'tassa', nom: 'Got', preuCents: 170 }] }))
      .toEqual(['presentacions[1]: id repetit «tassa»']);
    expect(validaProducteUniversal(p({ id: 'Tassa', nom: '' }))).toEqual([
      'presentacions[0]: l\'id ha de ser un id opac', 'presentacions[0]: cal un nom de fins a 60 caràcters'
    ]);
    for (const preuCents of [-1, 1.5, '150', 10000001]) {
      expect(validaProducteUniversal(p({ preuCents })), String(preuCents)).toEqual(['presentacions[0]: preuCents ha de ser un enter de 0 a 10000000']);
    }
    expect(validaProducteUniversal(p({ preuCents: 0 }))).toEqual([]);
    for (const quantitat of [0, -2, Number.NaN, Number.POSITIVE_INFINITY, '200', 1000001]) {
      expect(validaProducteUniversal(p({ quantitat, unitat: 'ml' })), String(quantitat)).toEqual(['presentacions[0]: quantitat ha de ser un nombre positiu']);
    }
    expect(validaProducteUniversal(p({ quantitat: 0.33, unitat: 'l' }))).toEqual([]);
    expect(validaProducteUniversal(p({ quantitat: 33, unitat: 'cl' }))).toEqual(['presentacions[0]: unitat u | g | kg | ml | l']);
  });

  test('a casa el preu és opcional; al bar, obligatori', () => {
    expect(validaProducteUniversal({ ...deCasa(), presentacions: [{ id: 'unitat', nom: 'Bote' }] })).toEqual([]);
    expect(validaProducteUniversal({ ...deBar(), presentacions: [{ id: 'tassa', nom: 'Tassa' }] }))
      .toEqual(['presentacions[0]: una presentació de bar porta preuCents']);
  });

  test('imatge: opcional; si n’hi ha, slug opac i estat conegut', () => {
    const senseImatge = deBar();
    delete senseImatge.imatge;
    expect(validaProducteUniversal(senseImatge)).toEqual([]);
    expect(validaProducteUniversal({ ...deBar(), imatge: 'cafe.png' })).toEqual(['imatge: ha de ser un objecte { slug, estat }']);
    expect(validaProducteUniversal({ ...deBar(), imatge: { slug: 'Cafe Llet', estat: 'esborrany' } })).toEqual([
      'imatge.slug: ha de ser un id opac', 'imatge.estat: marcador | definitiva'
    ]);
    expect(validaProducteUniversal({ ...deBar(), imatge: { slug: 'cafeteria-cafe-llet', estat: 'definitiva' } })).toEqual([]);
  });

  test('al·lèrgens: obligatoris al bar (encara que buits), opcionals a casa; ids dels 14 sense repetir', () => {
    const senseAlergens = deBar();
    delete senseAlergens.alergens;
    expect(validaProducteUniversal(senseAlergens)).toEqual(['alergens: un producte de bar porta la llista (encara que siga buida)']);
    expect(validaProducteUniversal({ ...deBar(), alergens: [] })).toEqual([]);
    expect(validaProducteUniversal({ ...deBar(), alergens: [...ALERGENS] })).toEqual([]);
    expect(validaProducteUniversal({ ...deBar(), alergens: ['llet', 'llet'] })).toEqual(['alergens[1]: «llet» repetit']);
    expect(validaProducteUniversal({ ...deBar(), alergens: ['Llet'] })).toEqual(['alergens[0]: no és cap dels 14 al·lèrgens del Reglament']);
    expect(validaProducteUniversal({ ...deBar(), alergens: null })).toEqual(['alergens: ha de ser una llista dels 14 al·lèrgens del Reglament']);
  });

  test('al·lèrgens a casa: sense la clau, vàlid; amb ella, la mateixa validació que al bar', () => {
    expect(deCasa()).not.toHaveProperty('alergens');
    expect(validaProducteUniversal(deCasa())).toEqual([]);
    expect(validaProducteUniversal({ ...deCasa(), alergens: [] })).toEqual([]);
    expect(validaProducteUniversal({ ...deCasa(), alergens: ['mostassa', 'gluten'] })).toEqual([]);
    expect(validaProducteUniversal({ ...deCasa(), alergens: ['tomaca', 'gluten', 'gluten'] })).toEqual([
      'alergens[0]: no és cap dels 14 al·lèrgens del Reglament', 'alergens[2]: «gluten» repetit'
    ]);
    expect(validaProducteUniversal({ ...deCasa(), alergens: 'gluten' })).toEqual(['alergens: ha de ser una llista dels 14 al·lèrgens del Reglament']);
  });

  test('canals: sempre al bar i mai a casa', () => {
    const senseCanals = deBar();
    delete senseCanals.canals;
    expect(validaProducteUniversal(senseCanals)).toEqual(['canals: un producte de bar porta sempre els seus canals']);
    expect(validaProducteUniversal({ ...deBar(), canals: { cartaDigital: false } })).toEqual(['canals.perEmportar: ha de ser booleà']);
    expect(validaProducteUniversal({ ...deCasa(), canals: { cartaDigital: true, perEmportar: true } }))
      .toEqual(['canals: només els productes de bar en tenen']);
  });

  test('la marca comercial i la font, opcionals però netes', () => {
    expect(validaProducteUniversal({ ...deCasa(), marca: '', font: 'Mercadona' })).toEqual([
      'marca: text de fins a 60 caràcters', 'font: ha de ser un id opac'
    ]);
    expect(validaProducteUniversal({ ...deBar(), marca: 'La casa' })).toEqual([]);
  });
});

describe('qualitat de src/utils/productes', () => {
  const ARREL = process.cwd();
  const CARPETA = 'src/utils/productes';
  const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
  const TOTS = readdirSync(path.join(ARREL, CARPETA)).filter((f) => /\.jsx?$/.test(f)).map((f) => `${CARPETA}/${f}`).sort();
  const PRODUCCIO = TOTS.filter((f) => !/\.test\.jsx?$/.test(f));
  const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  test('el cens: el mòdul i la seua prova', () => {
    expect(TOTS).toEqual([`${CARPETA}/producteUniversal.js`, `${CARPETA}/producteUniversal.test.js`]);
  });

  test('ESLint: zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    /* Sonda: la configuració del projecte és activa. */
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, CARPETA, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);

  test('JS pur: cap import, cap rellotge, atzar, DOM, React, xarxa ni emmagatzematge', () => {
    const impurs = new RegExp(t('\\b(?:Da', 'te|React|use[A-Z]\\w*|win', 'dow|docu', 'ment|navi', 'gator|global', 'This|set', 'Timeout|set',
      'Interval|fet', 'ch|XMLHttp', 'Request|local', 'Storage|session', 'Storage|indexed', 'DB)\\b|Math\\.ran', 'dom|cryp', 'to\\.'));
    expect(impurs.test(t('new Da', 'te()'))).toBe(true);
    for (const fitxer of PRODUCCIO) {
      const codi = senseComentaris(llig(fitxer));
      expect(codi.match(impurs), fitxer).toBeNull();
      expect(/\bimport\b|\brequire\s*\(/.test(codi), fitxer).toBe(false);
    }
  });

  test('Baseline 2022: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const fitxer of PRODUCCIO) expect(vetat.test(llig(fitxer)), fitxer).toBe(false);
  });

  test('cap caràcter de control, invisible, combinant ni bidi en cru (proves incloses)', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x00A0, 0x00A0], [0x0300, 0x036F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of TOTS) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});
