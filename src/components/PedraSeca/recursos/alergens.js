/**
 * recursos/alergens.js — les icones dels 14 al·lèrgens per a IconesAlergens
 * (ordre del Mestre, 261006: «deixa previst en el component de la targeta de
 * producte l'espai i el codi per a renderitzar aquestes xicotetes icones
 * d'al·lèrgens de forma visual. Això és vital per a la Carta Digital i el
 * TPV»; i «utilitza directament eixos SVGs»).
 *
 * PROCEDÈNCIA. Els dibuixos són els del Mestre, a
 * _wiki_de_poble/04_escriptori/01_produccio/alergens_svg/ (zona humana: es
 * llig, mai s'hi escriu). Els fitxers src/assets/alergens/<id>.svg en són
 * còpies netes: el mateix dibuix i els mateixos colors, sense la declaració
 * XML, el DOCTYPE (que nomenava una adreça externa), xmlns:xlink, xmlns:serif,
 * els atributs serif:* ni xml:space. L'única normalització del dibuix és el
 * marc: tres originals no són quadrats de dibuix (SOJA i CACAHUETES fan 16×17,
 * amb una franja buida a baix; ALTRAMUCES, 17×17, amb el disc desplaçat), i
 * la còpia retalla el viewBox al disc de 16×16 sense tocar cap camí, perquè
 * el disc ompliga la caixa 1:1 com els altres onze.
 * La numeració del Mestre intercanvia 03 i 04 respecte de l'annex II
 * (03-PESCADO, 04-HUEVOS): les còpies es casen PEL NOM, mai pel número.
 *   GLUTEN → gluten         CRUSTÁCEOS → crustacis     PESCADO → peix
 *   HUEVOS → ous            CACAHUETES → cacauets      SOJA → soja
 *   LÁCTEOS → llet          FRUTOS DE CÁSCARA → fruits-closca
 *   APIO → api              MOSTAZA → mostassa         SÉSAMO → sesam
 *   SULFITOS → sulfits      ALTRAMUCES → tramussos     MOLUSCOS → molluscs
 * 1-0-PORCION, 1-2-PORCION, CASTELLANO i INGLES no hi entren.
 * qualitat.alergens.test.js comprova la fidelitat de cada còpia i el color
 * de cada al·lergen (el que delataria un intercanvi de fitxers).
 *
 * SENSE XARXA (ordre del Mestre, 261006: capacitat offline prioritària). Els
 * SVG entren com a TEXT dins del paquet JS (import.meta.glob amb ?raw i
 * eager): viatgen dins del .js amb empremta, que el service worker sí que
 * guarda (public/sw.js no guarda cap SVG solt). Cada icona se servix com a
 * URI data:image/svg+xml;charset=utf-8 amb el text codificat
 * (encodeURIComponent): cap petició ni cap ruta. La CSP ho admet: img-src
 * porta data: a index.html i a vercel.json.
 *
 * ELS IDS són els de la llista canònica, utils/productes/producteUniversal.js
 * (ALERGENS, en l'ordre de l'annex II), i els noms, els seus (NOMS_ALERGENS),
 * en minúscula per a dir-los dins d'una frase («Al·lèrgens: gluten, llet»);
 * les abreviatures, també les seues (ABREVIATURES_ALERGENS): ací no
 * s'escriu cap id a mà.
 * Un SVG d'un id que no és a la llista no s'usa; un id de la llista sense
 * SVG no té icona, i IconesAlergens hi pinta l'abreviatura.
 *
 * JS pur: cap React, cap xarxa, cap emmagatzematge, cap global.
 */
import { ABREVIATURES_ALERGENS, ALERGENS, NOMS_ALERGENS, ordenaAlergens } from '../../../utils/productes/producteUniversal.js';

/* El text de cada SVG, per ruta: '../../../assets/alergens/gluten.svg' → '<svg …'. */
const FITXERS = import.meta.glob('../../../assets/alergens/*.svg', { query: '?raw', import: 'default', eager: true });

const idDeLaRuta = (ruta) => ruta.slice(ruta.lastIndexOf('/') + 1).replace(/\.svg$/, '');
const TEXTOS = new Map(Object.entries(FITXERS).map(([ruta, text]) => [idDeLaRuta(ruta), text]));
const esSvg = (text) => typeof text === 'string' && text.trim().startsWith('<svg');

/* Els blancs entre etiquetes no es pinten (cap SVG d'estos porta text): fora,
   i la URI és més curta. Res més no canvia. */
export const PREFIX_URI = 'data:image/svg+xml;charset=utf-8,';
const uriDe = (svg) => `${PREFIX_URI}${encodeURIComponent(svg.replace(/>\s+</g, '><').trim())}`;

/** Els ids dels 14 al·lèrgens, en l'ordre de l'annex II. */
export const IDS_ALERGENS = ALERGENS;

/** id → la URI data: de la seua icona. Només hi són els ids amb un SVG. */
export const ICONES_ALERGENS = Object.freeze(Object.fromEntries(
  ALERGENS.filter((id) => esSvg(TEXTOS.get(id))).map((id) => [id, uriDe(TEXTOS.get(id))])
));

/** id → el nom, en minúscula, per a dir-lo dins d'una frase («fruits de closca»). */
export const NOMS = Object.freeze(Object.fromEntries(ALERGENS.map((id) => [id, NOMS_ALERGENS[id].toLocaleLowerCase('ca')])));

/** id → l'abreviatura de la pastilla que ocupa el lloc d'una icona que falta (les de la llista canònica). */
export const ABREVIATURES = ABREVIATURES_ALERGENS;

/** Els ids coneguts d'una llista, sense repetits i en l'ordre de l'annex II. Sempre una llista nova. */
export const alergensConeguts = (llista) => ordenaAlergens(llista);

/** «gluten, llet»: els noms dels ids coneguts d'una llista, separats per comes. */
export const textAlergens = (llista) => alergensConeguts(llista).map((id) => NOMS[id]).join(', ');
