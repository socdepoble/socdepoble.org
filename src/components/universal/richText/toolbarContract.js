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
  LLISTA: 'llista',
  NEGRETA: 'negreta',
  CURSIVA: 'cursiva',
  RATLLAT: 'ratllat',
  CITACIO: 'citacio',
  DIVISOR: 'divisor'
});

/**
 * L'esquema. `slot` és el pont temporal cap a UniversalToolbar, que encara
 * demana cinc propietats amb nom propi en compte d'una llista. Les files
 * sense `slot` ja viuen al contracte i esperen la Fase 5: existixen a
 * l'adaptador, però encara no tenen on pintar-se.
 */
export const TOOLBAR_SCHEMA = Object.freeze([
  { id: FORMATS.TITOL,    clauI18n: 'editor.format.titol',    etiqueta: 'Títol',    commutable: true,  slot: { estat: 'isHeading', accio: 'toggleHeading' } },
  { id: FORMATS.LLISTA,   clauI18n: 'editor.format.llista',   etiqueta: 'Llista',   commutable: true,  slot: { estat: 'isList',    accio: 'toggleList' } },
  { id: FORMATS.NEGRETA,  clauI18n: 'editor.format.negreta',  etiqueta: 'Negreta',  commutable: true,  slot: { estat: 'isBold',    accio: 'toggleBold' } },
  { id: FORMATS.CURSIVA,  clauI18n: 'editor.format.cursiva',  etiqueta: 'Cursiva',  commutable: true,  slot: { estat: 'isItalic',  accio: 'toggleItalic' } },
  { id: FORMATS.RATLLAT,  clauI18n: 'editor.format.ratllat',  etiqueta: 'Ratllat',  commutable: true,  slot: { estat: 'isStrike',  accio: 'toggleStrike' } },
  { id: FORMATS.SUBTITOL, clauI18n: 'editor.format.subtitol', etiqueta: 'Subtítol', commutable: true,  slot: { estat: 'isSubheading', accio: 'toggleSubheading' } },
  { id: FORMATS.CITACIO,  clauI18n: 'editor.format.citacio',  etiqueta: 'Citació',  commutable: true,  slot: null },
  { id: FORMATS.DIVISOR,  clauI18n: 'editor.format.divisor',  etiqueta: 'Divisor',  commutable: false, slot: null }
]);

/** Els botons que UniversalToolbar sap pintar hui. */
export const SCHEMA_VISIBLE = Object.freeze(TOOLBAR_SCHEMA.filter((b) => b.slot));

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
