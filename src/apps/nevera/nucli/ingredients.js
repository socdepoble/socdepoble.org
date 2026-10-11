/**
 * La Nevera de Casa · els INGREDIENTS de cuina (dada pura) i la normalització
 * del seu nom.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6: «que l'estructura del Rebost
 * siga capaç de fer recomanacions de receptes basades en els ingredients
 * existents») · Un article del Rebost («Tomaques», un propi «Tomata», un
 * «Tomàquets») i l'ingredient d'una recepta són la mateixa cosa només si algú
 * ho diu. Ho diu ESTA TAULA, i res més: cap arrel calculada, cap semblança.
 *
 *   ingredient { id, nom, fresc, plural, formes }
 *     id      slug fix (viu a les receptes; no canvia mai)
 *     nom     com es diu a la llista de la compra. Si el catàleg de base ja té
 *             l'article, és el SEU nom («Tomaques», «Oli d’oliva»): afegir el
 *             que falta posa l'article de sempre, no un de propi repetit
 *     fresc   true si és gènere fresc (verdura tendra, carn): el recomanador
 *             el fa passar davant quan no hi ha cap data. No diu res de salut
 *             ni de conservació: només ordena
 *     plural  true si el NOM és plural («Tomaques»): fa la concordança de
 *             «Falta/Falten» i «Se n'acaba/Se n'acaben» (recomanador.js)
 *     formes  les claus de nom (clauDeNom) que valen per l'ingredient: el
 *             singular i el plural, els sinònims valencians (tomaca i tomata,
 *             creïlla i patata, safanòria i carlota, bajoca i mongeta tendra)
 *             i la forma castellana que porta un envàs
 *
 * EL CASAMENT D'UN ARTICLE (ingredientDArticle): un producte de botiga, només
 * per la taula d'ids de baix (PRODUCTES_INGREDIENT); un article de base o un
 * de propi, pel nom (ingredientDe).
 * EL CASAMENT D'UN NOM (ingredientDe): el nom SENCER, passat per clauDeNom (majúscules,
 * accents i apòstrofs fora), ha de ser una forma de la taula. «Tomaca fregida»,
 * «Creïlles de bossa» o «Suc de taronja» no són cap ingredient: un nom amb més
 * paraules només casa si és a la taula tal qual («Oli d’oliva verge extra»).
 * Si el dubte és entre casar malament i no casar, no es casa (el mateix criteri
 * que el calendari de temporada, src/utils/temporada).
 * «Mongeta» a soles és el fesol (la seca); la tendra és la bajoca.
 *
 * Sense al·lèrgens: la Nevera no en porta cap taxonomia i ací no se n'inventa
 * cap. Pur: cap React, cap rellotge, cap disc.
 */
import { clauDeNom } from './nevera.js';

/* El nombre del NOM de l'ingredient («Tomaques» és plural; «Arròs» i «Carabassó», singular):
   el diu la taula, no la «s» final (correcció del refutador, 261011, R2). */
const PL = true;
const SG = false;

/* [id, nom, fresc, plural, formes]. Les formes s'escriuen com es diuen; la clau la fa clauDeNom. */
const TAULA = Object.freeze([
  ['tomaca', 'Tomaques', true, PL, ['tomaca', 'tomata', 'tomates', 'tomàquet', 'tomàquets', 'tomàtiga', 'tomàtigues', 'tomate']],
  ['creilla', 'Creïlles', false, PL, ['creïlla', 'patata', 'patates', 'patatas', 'queradilla', 'queradilles']],
  ['ceba', 'Cebes', false, PL, ['ceba', 'cebolla', 'cebollas']],
  ['all', 'Alls', false, PL, ['all', 'ajo', 'ajos', 'cabeça d’alls', 'cabeces d’alls']],
  ['pebrot', 'Pebrots', true, PL, ['pebrot', 'pebrera', 'pebreres', 'pebrot roig', 'pebrots rojos', 'pebrot verd', 'pebrots verds', 'pimiento', 'pimientos']],
  ['alberginia', 'Albergínies', true, PL, ['albergínia', 'albergina', 'albergines', 'berenjena', 'berenjenas']],
  ['carabasso', 'Carabassó', true, SG, ['carabassons', 'carabasseta', 'carabassetes', 'calabacín', 'calabacines']],
  ['bajoca', 'Bajoques', true, PL, ['bajoca', 'bajoqueta', 'bajoquetes', 'mongeta tendra', 'mongetes tendres', 'judía verde', 'judías verdes']],
  ['nap', 'Naps', false, PL, ['nap', 'nabo', 'nabos']],
  ['penca', 'Penques', true, PL, ['penca', 'card', 'cards', 'cardo', 'cardos']],
  ['bleda', 'Bledes', true, PL, ['bleda', 'acelga', 'acelgas']],
  ['safanoria', 'Safanòries', false, PL, ['safanòria', 'carlota', 'carlotes', 'pastanaga', 'pastanagues', 'zanahoria', 'zanahorias']],
  ['arros', 'Arròs', false, SG, ['arròs redó', 'arròs bomba', 'arroz']],
  ['cigro', 'Cigrons', false, PL, ['cigró', 'cigrons cuits', 'garbanzo', 'garbanzos']],
  ['fesol', 'Fesols', false, PL, ['fesol', 'mongeta', 'mongetes', 'mongeta seca', 'mongetes seques', 'alubia', 'alubias']],
  ['llentilla', 'Llentilles', false, PL, ['llentilla', 'llentia', 'llenties', 'lenteja', 'lentejas']],
  ['ou', 'Ous', false, PL, ['ou', 'huevo', 'huevos']],
  ['oli', 'Oli d’oliva', false, SG, ['oli', 'oli d’oliva verge', 'oli d’oliva verge extra', 'aceite de oliva']],
  ['sal', 'Sal', false, SG, ['sal fina', 'sal grossa']],
  ['farina', 'Farina', false, SG, ['farina de blat', 'farina de força', 'harina']],
  ['llevat', 'Llevat', false, SG, ['llevat fresc', 'llevat de forner', 'levadura']],
  ['pa', 'Pa', false, SG, ['pa de poble', 'pa de pagès', 'barra de pa', 'pan']],
  /* Correcció del refutador (261011, R4) · La de les coques és de llanda. «Tonyina» a soles és
     l'article de base de «Carn i peix» (la fresca), que és una altra cosa: no hi casa. */
  ['tonyina', 'Tonyina en conserva', false, SG, ['tonyina de llanda', 'tonyina en oli', 'tonyina en oli d’oliva', 'atún en conserva', 'atún en aceite']],
  ['bacalla', 'Bacallà', false, SG, ['bacallà salat', 'bacallà dessalat', 'abadejo', 'bacalao']],
  ['costella', 'Costella de porc', true, SG, ['costella', 'costelles', 'costelles de porc', 'costilla de cerdo', 'costillas de cerdo']],
  ['botifarra', 'Botifarres', true, PL, ['botifarra', 'botifarra de ceba', 'botifarres de ceba', 'morcilla', 'morcillas']],
  ['cansalada', 'Cansalada', true, SG, ['cansalada viada', 'panceta']],
  ['pebre-roig', 'Pebre roig', false, SG, ['pebre roig dolç', 'pimentón', 'pimentón dulce']],
  ['safra', 'Safrà', false, SG, ['azafrán']],
  ['pinyo', 'Pinyons', false, PL, ['pinyó', 'piñones']]
]);

/** Els ingredients, congelats i en l'ordre de la taula: { id, nom, fresc, plural, formes }. */
export const INGREDIENTS = Object.freeze(TAULA.map(([id, nom, fresc, plural, formes]) => Object.freeze({
  id,
  nom,
  fresc,
  plural,
  /* El nom de la llista (el plural del catàleg) també és una forma. */
  formes: Object.freeze([...new Set([nom, ...formes].map(clauDeNom))])
})));

/**
 * Correcció del refutador (261011, R1) · ELS PRODUCTES DE BOTIGA no casen mai
 * pel nom: la denominació comercial enganya («Lentejas» és un bol preparat de
 * la secció de congelats; «Patatas · 5 kg» porta l'envàs al nom). Casen per
 * esta taula explícita `id de producte → id d'ingredient`, feta a mà sobre el
 * catàleg (productes.js): només el gènere fresc i el bàsic que DE VERES és
 * l'ingredient. Fora, expressament: els preparats i els congelats, el tomàquet
 * fregit o triturat, la verdura en conserva, la carn adobada o curada i el
 * bacallà fresc (les receptes volen el salat). Un producte nou del catàleg no
 * casa fins que algú l'afig ací (la prova ho contrasta amb el catàleg real).
 */
export const PRODUCTES_INGREDIENT = Object.freeze({
  'mer-arroz-redondo-categoria-i': 'arros',
  'mer-lenteja-pardina-categoria-extra': 'llentilla',
  'mer-garbanzo-cocido': 'cigro',
  'mer-costillas-de-cerdo-carnosas-a-tacos': 'costella',
  'mer-panceta': 'cansalada',
  'mer-patatas-5-kg': 'creilla',
  'mer-patatas-3-kg': 'creilla',
  'mer-patatas-rojas': 'creilla',
  'mer-patatas-especial-para-freir': 'creilla',
  'mer-cebollas-2-kg': 'ceba',
  'mer-cebollas-1-kg': 'ceba',
  'mer-cebollas-dulces-sabor-suave': 'ceba',
  'mer-cebollas-rojas': 'ceba',
  'mer-ajos-morados': 'all',
  'mer-tomate-ensalada': 'tomaca',
  'mer-tomate-canario': 'tomaca',
  'mer-tomate-pera': 'tomaca',
  'mer-tomate-kumato-negro': 'tomaca',
  'mer-tomates-cherry-pera-kumato': 'tomaca',
  'mer-tomates-cherry': 'tomaca',
  'mer-tomates-pera': 'tomaca',
  'mer-tomates-kumato-negro': 'tomaca',
  'mer-tomates': 'tomaca',
  'mer-rama-de-tomates': 'tomaca',
  'mer-zanahorias-1-kg': 'safanoria',
  'mer-zanahorias-500-g': 'safanoria',
  'mer-pimiento-rojo': 'pebrot',
  'mer-pimiento-verde-freir': 'pebrot',
  'mer-pimiento-verde': 'pebrot',
  'mer-pimientos-tricolor-rojo-amarillo-y-verde': 'pebrot',
  'mer-calabacin-verde': 'carabasso',
  'mer-berenjena': 'alberginia',
  'mer-berenjena-rayada': 'alberginia',
  'mer-judia-verde-plana-750-g': 'bajoca',
  'mer-judia-verde-plana-350-g': 'bajoca',
  'mer-judia-verde-redonda': 'bajoca',
  'mer-acelgas-cortadas': 'bleda',
  'mer-acelgas': 'bleda',
  'mer-huevos-tamanos-diferentes': 'ou',
  'mer-huevos-grandes-l': 'ou',
  'mer-harina-de-trigo-hacendado': 'farina',
  'mer-atun-en-aceite-de-oliva': 'tonyina'
});

const PER_ID = new Map(INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));
/* La primera vegada que apareix una forma mana (la prova vigila que no n'hi haja cap de repetida). */
const PER_FORMA = new Map();
for (const ingredient of INGREDIENTS) {
  for (const forma of ingredient.formes) {
    if (!PER_FORMA.has(forma)) PER_FORMA.set(forma, ingredient);
  }
}

/** L'ingredient amb este id, o null. */
export function ingredientPerId(id) {
  return PER_ID.get(id) || null;
}

/**
 * L'ingredient que es diu així («Tomates», « creïlla », «PATATAS»), o null si
 * el nom sencer no és cap forma de la taula.
 */
export function ingredientDe(nom) {
  const clau = clauDeNom(nom);
  return clau ? PER_FORMA.get(clau) || null : null;
}

/**
 * L'ingredient que és un ARTICLE de la Nevera ({ id, nom, font? }), o null:
 *   · un producte de botiga (`font`), només per la taula d'ids
 *     (PRODUCTES_INGREDIENT), mai pel nom;
 *   · un article de base o un de propi, pel nom sencer (ingredientDe).
 */
export function ingredientDArticle(article) {
  if (!article) return null;
  if (article.font) return Object.hasOwn(PRODUCTES_INGREDIENT, article.id) ? ingredientPerId(PRODUCTES_INGREDIENT[article.id]) : null;
  return ingredientDe(article.nom);
}

/** El nom d'un ingredient dins d'una frase: «tomaques», «oli d’oliva». */
export function nomEnFrase(ingredient) {
  return typeof ingredient?.nom === 'string' ? ingredient.nom.toLocaleLowerCase('ca') : '';
}
