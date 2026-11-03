/**
 * CONTRACTE NEUTRE DE LA BARRA D'EINES
 *
 * Ací no hi ha ni una crida a cap motor d'edició. Només dades: quins
 * botons existixen, com es diuen i quina acció neutra disparen.
 *
 * Afegir un botó és afegir una fila. Canviar de motor és reescriure
 * l'adaptador i no tocar este fitxer.
 */

export const FORMATS = Object.freeze({
  TITOL: 'titol',
  SUBTITOL: 'subtitol',
  /* IDEA-59 / P1-72 (Mestre 261101, punt 2) · Els nivells del desplegable
     d'encapçalaments que no tenien fila: H4, H5 i H6. L'H3 continua sent
     'subtitol' i l'H2, 'titol' (els ids d'abans no canvien). */
  H4: 'h4',
  H5: 'h5',
  H6: 'h6',
  LLISTA: 'llista',
  LLISTA_NUMERADA: 'llistaNumerada',
  NEGRETA: 'negreta',
  CURSIVA: 'cursiva',
  RATLLAT: 'ratllat',
  CITACIO: 'citacio',
  DIVISOR: 'divisor',
  /* O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · La subtargeta: una targeta
     interna amb títol, línia de context i cos (extensions/subtargeta.js). */
  SUBTARGETA: 'subtargeta',
  TARGETA: 'targeta',
  /* T26-01 (Gauntlet O7 · T2.6, «Enllaç ↔ Card» d'1 clic) · El sentit
     Enllaç → Card: l'altre és el botó «Convertir en enllaç» de la targeta. */
  ENLLAC_A_TARGETA: 'enllacATargeta'
});

/**
 * L'esquema. `slot` és el pont temporal cap a UniversalToolbar, que encara
 * demana propietats amb nom propi en compte d'una llista. Les files sense
 * `slot` existixen a l'adaptador, però encara no tenen on pintar-se.
 *
 * T7 (ordre del Mestre, 261004) · `nivell: 'avancat'` marca les files de la
 * barra desplegada (skill sdp-universal-editor §3): «Targeta» (inserir una
 * targeta incrustada) hi és. Fins a O4-CLAUDE-2 UniversalToolbar no la
 * pintava i només hi arribava l'ordre «/» del cos (vegeu baix).
 *
 * IDEA-59 / P1-72 (Mestre 261101) ·
 *   · `encapcalament` és el nivell de les files que viuen al desplegable
 *     d'encapçalaments, en l'ordre exacte que mana el Mestre: H3, H4, H5, H6
 *     i, al final del tot, H2 (punt 2). Cap H1 al cos: és el títol.
 *   · `fila: 'segona'` marca les eines secundàries, les que la barra plega a
 *     la segona fila del botó «⋯» (punt 4): el ratllat (que es conserva: no
 *     és el subratllat, punt 3), la citació i el divisor, que fins ara
 *     esperaven lloc a la barra.
 *   · Cap fila de subratllat: Sóc de Poble no en fa servir (punt 3).
 *
 * O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · Dues eines d'INSERCIÓ a la
 * segona fila, darrere del divisor: la «Subtargeta» (inserirSubtargeta) i la
 * «Targeta» incrustada, que ja té ranura (obri el selector del consumidor;
 * abans només hi arribava l'ordre «/»). UniversalToolbar només les pinta si
 * el motor n'oferix l'acció (l'extensió hi és, i el selector, per a la
 * targeta): un editor sense targetes no mostra cap botó apagat de més.
 *
 * T26-01 (Gauntlet O7 · T2.6) · Darrere de la «Targeta», «Convertir en
 * targeta»: només hi és amb el cursor en un enllaç intern que es pot
 * commutar (convertirEnllacEnTargeta); en qualsevol altre punt, cap botó.
 */
export const TOOLBAR_SCHEMA = Object.freeze([
  { id: FORMATS.SUBTITOL, clauI18n: 'editor.format.subtitol', etiqueta: 'Títol de secció (H3)', commutable: true, encapcalament: 3, slot: { estat: 'isSubheading', accio: 'toggleSubheading' } },
  { id: FORMATS.H4,       clauI18n: 'editor.format.h4',       etiqueta: 'Subtítol de secció (H4)', commutable: true, encapcalament: 4, slot: { estat: 'isH4', accio: 'toggleH4' } },
  { id: FORMATS.H5,       clauI18n: 'editor.format.h5',       etiqueta: 'Apartat (H5)',  commutable: true, encapcalament: 5, slot: { estat: 'isH5', accio: 'toggleH5' } },
  { id: FORMATS.H6,       clauI18n: 'editor.format.h6',       etiqueta: 'Subapartat (H6)', commutable: true, encapcalament: 6, slot: { estat: 'isH6', accio: 'toggleH6' } },
  { id: FORMATS.TITOL,    clauI18n: 'editor.format.titol',    etiqueta: 'Encapçalament gran (H2)', commutable: true, encapcalament: 2, slot: { estat: 'isHeading', accio: 'toggleHeading' } },
  { id: FORMATS.NEGRETA,  clauI18n: 'editor.format.negreta',  etiqueta: 'Negreta',  commutable: true, slot: { estat: 'isBold',    accio: 'toggleBold' } },
  { id: FORMATS.CURSIVA,  clauI18n: 'editor.format.cursiva',  etiqueta: 'Cursiva',  commutable: true, slot: { estat: 'isItalic',  accio: 'toggleItalic' } },
  { id: FORMATS.LLISTA,   clauI18n: 'editor.format.llista',   etiqueta: 'Llista amb vinyetes', commutable: true, slot: { estat: 'isList', accio: 'toggleList' } },
  { id: FORMATS.LLISTA_NUMERADA, clauI18n: 'editor.format.llistaNumerada', etiqueta: 'Llista numerada', commutable: true, slot: { estat: 'isOrderedList', accio: 'toggleOrderedList' } },
  { id: FORMATS.RATLLAT,  clauI18n: 'editor.format.ratllat',  etiqueta: 'Ratllat',  commutable: true, fila: 'segona', slot: { estat: 'isStrike',  accio: 'toggleStrike' } },
  { id: FORMATS.CITACIO,  clauI18n: 'editor.format.citacio',  etiqueta: 'Citació',  commutable: true, fila: 'segona', slot: { estat: 'isCitacio', accio: 'toggleCitacio' } },
  { id: FORMATS.DIVISOR,  clauI18n: 'editor.format.divisor',  etiqueta: 'Divisor',  commutable: false, fila: 'segona', slot: { estat: 'isDivisor', accio: 'insertDivisor' } },
  { id: FORMATS.SUBTARGETA, clauI18n: 'section.notes.format.subtargeta', etiqueta: 'Subtargeta', commutable: false, fila: 'segona', slot: { estat: 'isSubtargeta', accio: 'insertSubtargeta' } },
  { id: FORMATS.TARGETA,  clauI18n: 'editor.inserir.targeta', etiqueta: 'Targeta',  commutable: false, fila: 'segona', slot: { estat: 'isTargeta', accio: 'insertTargeta' }, nivell: 'avancat' },
  { id: FORMATS.ENLLAC_A_TARGETA, clauI18n: 'section.notes.format.enllacATargeta', etiqueta: 'Convertir en targeta', commutable: false, fila: 'segona', slot: { estat: 'isEnllacATargeta', accio: 'convertLinkToCard' }, nivell: 'avancat' }
]);

/** Els botons que UniversalToolbar sap pintar hui (O4-CLAUDE-2 · també la
 *  subtargeta i la targeta). */
export const SCHEMA_VISIBLE = Object.freeze(TOOLBAR_SCHEMA.filter((b) => b.slot));

/** IDEA-59 / P1-72 (punt 2) · Els nivells del desplegable, en el seu ordre:
 *  H3, H4, H5, H6 i H2 al final. */
export const ORDRE_ENCAPCALAMENTS = Object.freeze(
  TOOLBAR_SCHEMA.filter((b) => b.encapcalament).map((b) => b.encapcalament)
);

/**
 * Estat neutre. Dos mapes plans a posta: així la comparació és barata i
 * llegible, sense recórrer arbres.
 */
export const ESTAT_BUIT = Object.freeze({
  disponible: false,
  actiu: Object.freeze({}),
  pot: Object.freeze({})
});

/** Cap motor: l'exec no fa res i no peta. */
export const EXEC_BUIT = () => false;

export function mateixEstat(a, b) {
  if (a === b) return true;
  if (!a || !b || a.disponible !== b.disponible) return false;
  for (const mapa of ['actiu', 'pot']) {
    const x = a[mapa] || {};
    const y = b[mapa] || {};
    const claus = Object.keys(x);
    if (claus.length !== Object.keys(y).length) return false;
    for (const k of claus) if (x[k] !== y[k]) return false;
  }
  return true;
}
