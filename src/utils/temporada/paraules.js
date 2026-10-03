/**
 * Temporada · les paraules d'un nom de producte (JS pur, sense dependències).
 *
 * normalitza(text) deixa un nom en minúscules, sense diacrítics ni signes:
 *   «Meló d'Alger» → 'melon d alger' · «Brussel·les» → 'brusselles'.
 * arrel(paraula) reduïx una paraula ja normalitzada a una arrel que no
 * distingix singular i plural ni masculí i femení, en valencià i en castellà:
 *   tomaca, tomaques → tomac · tomate, tomates → tomat
 *   taronja, taronges → taronj · figa, figues → fij
 *   meló, melons, melón, melones → melon
 * L'arrel no és cap lema de diccionari: només ha de ser la mateixa per a les
 * formes d'una paraula i diferent per a les paraules diferents de les dades
 * (ho vigila dades.test.js). Les col·lisions amb paraules de fora del
 * calendari («pimienta» fa l'arrel de «pimiento») les para ALIENES (dades.js).
 */

/* La ela geminada, amb punt volat o amb el punt de partició: «l·l» val «ll». */
const ELA_GEMINADA = /l[·‧]l/g;
/* La -ó i la -à tòniques finals fan el plural en -ons i -ans (meló, melons;
   paraguaià, paraguaians): s'escriuen -on i -an perquè l'arrel coincidisca.
   Lookahead, no lookbehind: el Baseline 2022 no té lookbehind a Safari 16. */
const O_TONICA_FINAL = /ó(?![\p{L}\p{N}])/gu;
const A_TONICA_FINAL = /à(?![\p{L}\p{N}])/gu;
const DIACRITICS = /\p{M}/gu;
const NO_ALFANUMERICS = /[^a-z0-9]+/g;
const VOCAL_DE_GENERE = /[aeo]$/;

/** Minúscules sense diacrítics, i cada tros que no és lletra ni xifra, un espai. '' si no és text. */
export function normalitza(text) {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFC')
    .toLocaleLowerCase('ca')
    .replace(ELA_GEMINADA, 'll')
    .replace(O_TONICA_FINAL, 'on')
    .replace(A_TONICA_FINAL, 'an')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(NO_ALFANUMERICS, ' ')
    .trim();
}

/** Les paraules normalitzades d'un text, en ordre: «Tomaques de penjar» → ['tomaques', 'de', 'penjar']. */
export function paraules(text) {
  const net = normalitza(text);
  return net ? net.split(' ') : [];
}

/**
 * L'arrel d'una paraula normalitzada:
 *   1. lleva la -s del plural (si la paraula té més de tres lletres: «alls» sí,
 *      «gas» no);
 *   2. lleva la vocal de gènere -a, -e o -o (si en queden almenys dues);
 *   3. iguala les grafies que canvien amb el plural: -qu → -c i -gu → -g
 *      només si la vocal llevada era una -e (tomaques, figues; «agua» no
 *      ha de fer l'arrel d'«ajo»), i -g → -j sempre (taronges, figa → fij).
 */
export function arrel(paraula) {
  let p = typeof paraula === 'string' ? paraula : '';
  if (p.length > 3 && p.endsWith('s')) p = p.slice(0, -1);
  const vocal = p.length > 2 && VOCAL_DE_GENERE.test(p) ? p.slice(-1) : '';
  if (vocal) p = p.slice(0, -1);
  if (vocal === 'e' && p.endsWith('qu')) p = `${p.slice(0, -2)}c`;
  else if (vocal === 'e' && p.endsWith('gu')) p = p.slice(0, -1);
  if (p.endsWith('g')) p = `${p.slice(0, -1)}j`;
  return p;
}
