/**
 * plantilla.js — el format del full trimestral per a la gestoria, com a dades.
 *
 * Una plantilla descriu el full sense codi: el nom de la fulla i dels fitxers,
 * la font, les columnes, els estils amb nom i la disposició ordenada de peces.
 * El motor (maquetaFull, a fullModel.js) la comprova, hi aboca les factures i
 * en trau un full maquetat que el CSV i l'XLSX escriuen igual. Canviar de
 * format és canviar (o afegir) una plantilla, no tocar el motor.
 *
 * CONTRACTE
 *   nomFulla, nomFitxer i tots els textos admeten marcadors: {titular},
 *     {slug} (el titular per a noms de fitxer), {any}, {n} (el trimestre),
 *     {inici} i {fi} (dd/mm/aaaa).
 *   font: { nom, mida } per defecte del llibre. altFila: alçada per defecte de
 *     les files, en punts.
 *   formats: data i import, codis de format d'Excel; dataText, com s'escriu la
 *     data al CSV ('dd/mm/aa', 'dd/mm/aaaa' o 'aaaa-mm-dd').
 *   ordre: 'asc' o 'desc', per data i, el mateix dia, per número.
 *   columnes: [{ clau, titol, amplada, tipus, ajust?, alineacio?, estil?, ampladaMaxima? }]
 *     clau: el camp de la factura (data, num, contrapart, nif, descripcio,
 *       subtotal, iva o total); tipus: 'data', 'text' o 'import', el del camp.
 *     titol: un text, o { ingres, despesa } si canvia d'un bloc a l'altre.
 *     amplada: en caràcters. ampladaMaxima: si hi és, la columna creix amb el
 *       text més llarg de les dades fins a eixe límit.
 *     estil: l'estil base de les dades (per defecte 'dadaImport' per als imports
 *       i 'dada' per a la resta); alineacio i ajust en retoquen la columna.
 *   estils: { nom: { negreta?, colorLletra?, fons?, alineacio?, vertical?, ajust?, numFmt?, vora? } }
 *     colorLletra i fons: ARGB, 8 xifres hexadecimals en majúscules i sense
 *     coixinet. alineacio: 'esquerra', 'centre' o 'dreta'; vertical: 'dalt',
 *     'centre' o 'baix'; ajust: text ajustat a la cel·la; vora: 'fina' (les
 *     quatre vores); numFmt: codi d'Excel (si falta, el del tipus de la cel·la).
 *   totals: { etiqueta, columna, estilEtiqueta, estil }: l'etiqueta va a la
 *     columna indicada i cada columna d'import porta la seua suma.
 *   disposicio: les peces del full en ordre; cadascuna fa una o més files.
 *     { tipus: 'titol', text, estil?, combina? }   el text a la primera columna;
 *       combina: la fila sencera combinada (estil per defecte: 'titol').
 *     { tipus: 'fila', celles: [{ columna, text, estil? }] }   textos solts per clau de columna.
 *     { tipus: 'buida' }
 *     { tipus: 'bloc', bloc: 'ingressos'|'despeses', barra?, estilBarra?, combinaBarra?, estilCapcalera? }
 *       la barra (si n'hi ha; per defecte estil 'barra' i combinada), la
 *       capçalera de columnes (estil 'capcalera'), una fila per factura i la
 *       fila de totals, just després de l'última factura o de la capçalera.
 *   Cada bloc ha d'eixir exactament una vegada: cap plantilla pot deixar
 *   factures fora del full ni repetir-les.
 *
 * Dades pures i congelades: res de DOM, React ni xarxa.
 */

/* Congela un objecte i tot el que penja d'ell. */
function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
}

const BLANC = 'FFFFFFFF';
const NEGRE = 'FF000000';
const GRIS = 'FF666666';
const VERD = 'FF0B6B2E';
const NOM_FITXER = '{any}-FACTURACIO-{slug}_-_{n}T';
const FORMATS = { data: 'dd/mm/yy', dataText: 'dd/mm/aa', import: '#,##0.00 "€"' };
const TITOL_CONTRAPART = { ingres: 'Client', despesa: 'Proveïdor' };

/**
 * El full de sempre de la gestoria: una fulla «<n>T», el títol combinat en una
 * línia, barres negres INGRESSOS i GASTOS, capçaleres grises, dades alineades
 * a dalt i totals amb SUM. Arial 10.
 */
export const PLANTILLA_GESTORIA = congela({
  id: 'gestoria',
  nomFulla: '{n}T',
  nomFitxer: NOM_FITXER,
  font: { nom: 'Arial', mida: 10 },
  altFila: 12.75,
  formats: FORMATS,
  ordre: 'asc',
  columnes: [
    { clau: 'data', titol: 'Data', amplada: 10, tipus: 'data' },
    { clau: 'num', titol: 'Núm', amplada: 17, tipus: 'text' },
    { clau: 'contrapart', titol: TITOL_CONTRAPART, amplada: 32, tipus: 'text', ajust: true },
    { clau: 'nif', titol: 'NIF - CIF', amplada: 13, tipus: 'text' },
    { clau: 'descripcio', titol: 'Descripció', amplada: 46, tipus: 'text', ajust: true },
    { clau: 'subtotal', titol: 'Subtotal', amplada: 12, tipus: 'import' },
    { clau: 'iva', titol: 'IVA', amplada: 10, tipus: 'import' },
    { clau: 'total', titol: 'Total', amplada: 12, tipus: 'import' }
  ],
  estils: {
    titol: { negreta: true, alineacio: 'centre' },
    barra: { negreta: true, colorLletra: BLANC, fons: NEGRE, alineacio: 'centre' },
    capcalera: { negreta: true, colorLletra: BLANC, fons: GRIS, alineacio: 'centre' },
    dada: { alineacio: 'esquerra', vertical: 'dalt' },
    dadaImport: { alineacio: 'dreta', vertical: 'dalt' },
    etiquetaTotal: { negreta: true, alineacio: 'dreta', vertical: 'dalt' },
    total: { negreta: true, alineacio: 'dreta', vertical: 'dalt' }
  },
  totals: { etiqueta: 'Totals', columna: 'descripcio', estilEtiqueta: 'etiquetaTotal', estil: 'total' },
  disposicio: [
    { tipus: 'titol', text: '{titular} - {inici} - {fi} - {n}T', combina: true },
    { tipus: 'buida' },
    { tipus: 'buida' },
    { tipus: 'bloc', bloc: 'ingressos', barra: 'INGRESSOS' },
    { tipus: 'buida' },
    { tipus: 'buida' },
    { tipus: 'bloc', bloc: 'despeses', barra: 'GASTOS' }
  ]
});

/**
 * La primera versió del full (la verda), que la gestoria no fa servir: es
 * conserva per a demostrar que el motor canvia de format sense canviar codi.
 * Títol «<any>-FACTURACIO-<slug>» amb «<n>T» a l'última columna, període
 * combinat a la tercera fila, seccions en negreta, capçaleres verdes amb
 * vores i columnes de text que creixen fins a 60 caràcters. Calibri 11.
 */
export const PLANTILLA_VERDA_ANTIGA = congela({
  id: 'verda-antiga',
  nomFulla: '{n}T',
  nomFitxer: NOM_FITXER,
  font: { nom: 'Calibri', mida: 11 },
  altFila: 15,
  formats: FORMATS,
  ordre: 'asc',
  columnes: [
    { clau: 'data', titol: 'Data', amplada: 10, tipus: 'data' },
    { clau: 'num', titol: 'Núm', amplada: 12, ampladaMaxima: 60, tipus: 'text' },
    { clau: 'contrapart', titol: TITOL_CONTRAPART, amplada: 30, ampladaMaxima: 60, tipus: 'text' },
    { clau: 'nif', titol: 'NIF - CIF', amplada: 13, ampladaMaxima: 60, tipus: 'text' },
    { clau: 'descripcio', titol: 'Descripció', amplada: 36, ampladaMaxima: 60, tipus: 'text' },
    { clau: 'subtotal', titol: 'Subtotal', amplada: 14, tipus: 'import' },
    { clau: 'iva', titol: 'IVA', amplada: 12, tipus: 'import' },
    { clau: 'total', titol: 'Total', amplada: 14, tipus: 'import' }
  ],
  estils: {
    titol: { negreta: true },
    periode: { negreta: true, alineacio: 'centre' },
    seccio: { negreta: true },
    capcalera: { negreta: true, colorLletra: BLANC, fons: VERD, vora: 'fina' },
    dada: {},
    dadaImport: {},
    etiquetaTotal: { negreta: true, colorLletra: BLANC, fons: VERD, vora: 'fina', alineacio: 'dreta' },
    total: { negreta: true }
  },
  totals: { etiqueta: 'Totals', columna: 'descripcio', estilEtiqueta: 'etiquetaTotal', estil: 'total' },
  disposicio: [
    {
      tipus: 'fila',
      celles: [
        { columna: 'data', text: '{any}-FACTURACIO-{slug}', estil: 'titol' },
        { columna: 'total', text: '{n}T', estil: 'titol' }
      ]
    },
    { tipus: 'buida' },
    { tipus: 'titol', text: '{titular} - {inici} - {fi}', estil: 'periode', combina: true },
    { tipus: 'buida' },
    { tipus: 'bloc', bloc: 'ingressos', barra: 'INGRESSOS', estilBarra: 'seccio', combinaBarra: false },
    { tipus: 'buida' },
    { tipus: 'bloc', bloc: 'despeses', barra: 'GASTOS', estilBarra: 'seccio', combinaBarra: false }
  ]
});
