/**
 * fullModel.js — el full trimestral per a la gestoria: maquetació, CSV i lectura.
 *
 * maquetaFull aplica una plantilla (plantilla.js) a les factures del trimestre
 * i en trau un full maquetat: les files amb les cel·les (valor, tipus i nom
 * d'estil), les combinacions, les amplades i els estils que fa servir. El CSV
 * (fullACsv) i l'XLSX (xlsx.js) escriuen eixe mateix full fila per fila, i per
 * això ixen iguals. El format viu a la plantilla: el motor no sap de colors,
 * de títols ni de l'ordre de les peces. llegeixModelCsv llig un full ja fet:
 * el d'ara, el verd anterior i els models antics amb punt i coma o amb la fila
 * de totals de 9 camps. JS pur: sense DOM ni React.
 *
 * El full conté exactament les factures que rep, en l'ordre de la plantilla:
 * ni filtra per data ni canvia cap factura de bloc. Una factura fora del
 * trimestre és cosa de la capa que valida (FORA_TRIMESTRE), no d'ací.
 *
 * FULL MAQUETAT
 *   { nomFulla, font: { nom, mida }, altFila, formats: { data, dataText, import },
 *     columnes: [{ amplada }] (en caràcters),
 *     files: [{ rol, bloc?, facturaId?, celles }] (la fila r del full és files[r - 1]),
 *     combinacions: ['A1:H1', ...],
 *     estils: { nom: { negreta?, colorLletra?, fons?, alineacio?, vertical?, ajust?, numFmt?, vora? } } }
 *   rol: 'titol', 'fila', 'buida', 'barra', 'capcalera', 'dada' o 'totals'.
 *   celles: una per columna; null on no hi ha cel·la. Si no és null:
 *     { tipus: 'text', valor: text|null, estil }
 *     { tipus: 'data', valor: {a,m,d}|null, estil }
 *     { tipus: 'import', valor: cèntims|null, formula?: 'SUM(F6:F7)', estil }
 *   valor null és una cel·la buida amb estil (la resta d'una combinació, un
 *   import desconegut). Amb formula, valor és el resultat ja calculat. estil
 *   és una clau d'estils, o null per a l'estil per defecte del llibre. Els
 *   estils de les dades porten el nom de la base i dels retocs de la columna:
 *   «dada+data» (format de data), «dada+ajust», «dadaImport+import».
 *
 * Protecció de fórmules al CSV: un text que comença per = + - @, tabulador o
 * retorn porta una cometa simple davant. Si ja començava per cometes simples
 * seguides d'un d'eixos caràcters, se n'hi afig una més, i el lector en lleva
 * sempre una: el viatge d'anada i tornada no perd res.
 */
import { decodificaText, parseCsv, protegeixFormula, serialitzaCsv } from './csv.js';
import { esDataValida, formatData, parseData, rangTrimestre, trimestreDe } from './dates.js';
import { formatImport, parseImport } from './diners.js';
import { crearFactura, ordenaFactures, totals } from './model.js';
import { PLANTILLA_GESTORIA } from './plantilla.js';

const CAMPS_IMPORT = ['subtotal', 'iva', 'total'];
const ETIQUETES_IMPORT = { subtotal: 'subtotal', iva: 'IVA', total: 'total' };
const JA_PROTEGIT = /^'+[-=+@\t\r]/;

/* Plantilla: el tipus de cada camp de la factura que pot fer de columna. */
const TIPUS_CAMP = Object.freeze({
  data: 'data', num: 'text', contrapart: 'text', nif: 'text', descripcio: 'text', subtotal: 'import', iva: 'import', total: 'import'
});
/* Blocs de la disposició i el tipus de factura que en tria el títol de columna. */
const BLOCS = Object.freeze({ ingressos: 'ingres', despeses: 'despesa' });
const MARCADORS = Object.freeze(['titular', 'slug', 'any', 'n', 'inici', 'fi']);
const PROPIETATS_ESTIL = Object.freeze(['negreta', 'colorLletra', 'fons', 'alineacio', 'vertical', 'ajust', 'numFmt', 'vora']);
const ALINEACIONS = Object.freeze(['esquerra', 'centre', 'dreta']);
const VERTICALS = Object.freeze(['dalt', 'centre', 'baix']);
const FORMATS_DATA_TEXT = Object.freeze(['dd/mm/aa', 'dd/mm/aaaa', 'aaaa-mm-dd']);
const ARGB = /^[0-9A-F]{8}$/;
const NOM_ESTIL = /^[A-Za-z][A-Za-z0-9_-]*$/;
/* Només amb replace i matchAll: la bandera g no deixa estat entre crides. */
const MARCADOR = /\{([^{}]*)\}/g;
const MAX_COLUMNES = 16384;
const MAX_AMPLADA = 255;

/* Lectura: posicions per defecte i noms de columna coneguts (ja passats per clau()). */
const POSICIONS = Object.freeze({ data: 0, num: 1, contrapart: 2, nif: 3, descripcio: 4, subtotal: 5, iva: 6, total: 7 });
const ALIES_COLUMNES = new Map(Object.entries({
  data: ['data', 'fecha', 'datafactura', 'fechafactura'],
  num: ['num', 'numero', 'no', 'nfactura', 'numfactura', 'numerofactura', 'factura'],
  contrapart: ['client', 'cliente', 'proveidor', 'proveedor', 'clientproveidor', 'clienteproveedor'],
  nif: ['nifcif', 'cifnif', 'nif', 'cif', 'dni', 'nifdni'],
  descripcio: ['descripcio', 'descripcion', 'concepte', 'concepto'],
  subtotal: ['subtotal', 'base', 'baseimposable', 'baseimponible'],
  iva: ['iva', 'quotaiva', 'cuotaiva'],
  total: ['total']
}).flatMap(([camp, noms]) => noms.map((nom) => [nom, camp])));
const SECCIONS = new Map([['ingressos', 'ingres'], ['ingresos', 'ingres'], ['gastos', 'despesa'], ['despeses', 'despesa']]);
const CONTRAPART_INGRES = new Set(['client', 'cliente']);
const CONTRAPART_DESPESA = new Set(['proveidor', 'proveedor']);
const PARAULES_TOTALS = new Set(['totals', 'total', 'totales', 'suma']);
const TITOL = /^(\d{4})-FACTURACIO-(.*)$/i;
const ETIQUETA_TRIMESTRE = /^([1-4])\s*T$/i;
/* «Titular - dd/mm/aaaa - dd/mm/aaaa», amb « - <n>T» al final en el format d'ara. */
const CAPCALERA = /^(.*\S)\s+-\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+-\s+(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s+-\s+([1-4])\s*T)?$/i;

const textDe = (valor) => (valor == null ? '' : String(valor));
const esText = (valor) => typeof valor === 'string';
const teClau = (objecte, clau) => Object.prototype.hasOwnProperty.call(objecte, clau);
const importONull = (valor) => (Number.isSafeInteger(valor) ? valor : null);
const senseAccents = (text) => text.normalize('NFKD').replace(/[̀-ͯ]/g, '');
const clau = (text) => senseAccents(textDe(text)).toLowerCase().replace(/[^a-z0-9]/g, '');
const titularNet = (titular) => textDe(titular).replace(/\s+/g, ' ').trim();
const estilDeColumna = (columna) => columna.estil ?? (columna.tipus === 'import' ? 'dadaImport' : 'dada');
const esAmplada = (valor) => typeof valor === 'number' && valor > 0 && valor <= MAX_AMPLADA;

/* Protecció de fórmules reversible (vegeu la capçalera). */
const protegeix = (text) => (JA_PROTEGIT.test(text) ? `'${text}` : protegeixFormula(text));
const desprotegeix = (text) => (JA_PROTEGIT.test(text) ? text.slice(1) : text);

function comprovaPeriode(any, t) {
  const rang = rangTrimestre(any, t);
  if (!rang) throw new RangeError(`Any o trimestre no vàlids: ${any} ${t}`);
  return rang;
}

/**
 * El titular per a un nom de fitxer: sense diacrítics ni punts, i amb «_» en
 * lloc dels espais («Nom. Cognom Àlvarez» → «Nom_Cognom_Alvarez»).
 * @param {string} text
 * @returns {string}
 */
export function slugTitular(text) {
  return senseAccents(textDe(text))
    .replace(/[.'’·]/g, '')
    .replace(/[^\p{L}\p{N}\s_-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, '_');
}

const marcadorsDe = (titular, any, t, rang) => ({
  titular, slug: slugTitular(titular), any: String(any), n: String(t), inici: formatData(rang.inici), fi: formatData(rang.fi)
});
const omple = (text, marcadors) => text.replace(MARCADOR, (tot, nom) => (teClau(marcadors, nom) ? marcadors[nom] : tot));

/**
 * Noms dels fitxers del trimestre segons el nomFitxer de la plantilla; amb la
 * de la gestoria, «<AAAA>-FACTURACIO-<slug>_-_<n>T».
 * @param {{ any: number, t: number, titular: string }} dades
 * @param {object} [plantilla] per defecte, PLANTILLA_GESTORIA.
 * @returns {{ csv: string, xlsx: string }}
 */
export function nomsFitxers({ any, t, titular } = {}, plantilla = PLANTILLA_GESTORIA) {
  const rang = comprovaPeriode(any, t);
  if (!esText(plantilla?.nomFitxer)) throw new TypeError('La plantilla no té nomFitxer.');
  const base = omple(plantilla.nomFitxer, marcadorsDe(titularNet(titular), any, t, rang))
    .replace(/[\u0000-\u001F<>:"/\\|?*]/g, '')
    .trim() || 'full';
  return { csv: `${base}.csv`, xlsx: `${base}.xlsx` };
}

/**
 * La lletra d'una columna del full a partir de la posició (0 → «A», 26 → «AA»).
 * @param {number} index
 * @returns {string}
 */
export function lletraColumna(index) {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_COLUMNES) throw new RangeError(`Columna fora del full: ${index}`);
  let n = index + 1;
  let lletres = '';
  while (n > 0) {
    const resta = (n - 1) % 26;
    lletres = String.fromCharCode(65 + resta) + lletres;
    n = (n - 1 - resta) / 26;
  }
  return lletres;
}

function comprovaEstil(nom, definicio, error) {
  const on = `estils.${nom}`;
  if (!NOM_ESTIL.test(nom)) error(`${on}: el nom comença per lletra i només porta lletres, xifres, «_» o «-».`);
  if (!definicio || typeof definicio !== 'object') {
    error(`${on}: cal un objecte.`);
    return;
  }
  for (const propietat of Object.keys(definicio)) {
    if (!PROPIETATS_ESTIL.includes(propietat)) error(`${on}: propietat desconeguda «${propietat}».`);
  }
  for (const propietat of ['colorLletra', 'fons']) {
    if (definicio[propietat] != null && !(esText(definicio[propietat]) && ARGB.test(definicio[propietat]))) {
      error(`${on}.${propietat}: cal un color ARGB de 8 xifres hexadecimals en majúscules, sense coixinet.`);
    }
  }
  for (const propietat of ['negreta', 'ajust']) {
    if (definicio[propietat] != null && typeof definicio[propietat] !== 'boolean') error(`${on}.${propietat}: cal un booleà.`);
  }
  if (definicio.alineacio != null && !ALINEACIONS.includes(definicio.alineacio)) error(`${on}.alineacio: ${ALINEACIONS.join(', ')}.`);
  if (definicio.vertical != null && !VERTICALS.includes(definicio.vertical)) error(`${on}.vertical: ${VERTICALS.join(', ')}.`);
  if (definicio.numFmt != null && !(esText(definicio.numFmt) && definicio.numFmt !== '')) error(`${on}.numFmt: cal un codi de format d'Excel.`);
  if (definicio.vora != null && definicio.vora !== 'fina') error(`${on}.vora: només 'fina'.`);
}

/**
 * Comprova una plantilla del full (vegeu el contracte a plantilla.js) i la
 * torna. Si hi ha errors, llança un TypeError que els diu tots.
 * @param {object} plantilla
 * @returns {object} la mateixa plantilla
 */
export function comprovaPlantilla(plantilla) {
  if (!plantilla || typeof plantilla !== 'object') throw new TypeError('Plantilla del full no vàlida: cal un objecte.');
  const p = plantilla;
  const errors = [];
  const error = (text) => errors.push(text);
  const textAmbMarcadors = (on, text) => {
    if (!esText(text)) {
      error(`${on}: cal un text.`);
      return;
    }
    for (const [, nom] of text.matchAll(MARCADOR)) {
      if (!MARCADORS.includes(nom)) error(`${on}: marcador desconegut {${nom}}.`);
    }
  };

  textAmbMarcadors('nomFulla', p.nomFulla);
  textAmbMarcadors('nomFitxer', p.nomFitxer);
  if (!p.font || !esText(p.font.nom) || p.font.nom.trim() === '' || !(typeof p.font.mida === 'number' && p.font.mida > 0)) {
    error('font: cal { nom, mida }.');
  }
  if (!(typeof p.altFila === 'number' && p.altFila > 0)) error('altFila: cal una alçada positiva, en punts.');
  const formats = p.formats && typeof p.formats === 'object' ? p.formats : {};
  for (const tipus of ['data', 'import']) {
    if (!esText(formats[tipus]) || formats[tipus] === '') error(`formats.${tipus}: cal un codi de format d'Excel.`);
  }
  if (!FORMATS_DATA_TEXT.includes(formats.dataText)) error(`formats.dataText: ${FORMATS_DATA_TEXT.join(', ')}.`);
  if (!['asc', 'desc'].includes(p.ordre)) error("ordre: 'asc' o 'desc'.");

  const estils = p.estils && typeof p.estils === 'object' ? p.estils : {};
  if (estils !== p.estils) error('estils: cal un objecte.');
  for (const [nom, definicio] of Object.entries(estils)) comprovaEstil(nom, definicio, error);
  const estilConegut = (on, nom) => {
    if (!esText(nom) || !teClau(estils, nom)) error(`${on}: l'estil «${nom}» no existix.`);
  };

  const columnes = Array.isArray(p.columnes) ? p.columnes : [];
  if (columnes.length === 0 || columnes.length > MAX_COLUMNES) error(`columnes: cal una llista d'entre 1 i ${MAX_COLUMNES}.`);
  const claus = new Set();
  columnes.forEach((columna, i) => {
    const on = `columnes[${i}]`;
    if (!columna || typeof columna !== 'object') {
      error(`${on}: cal un objecte.`);
      return;
    }
    if (!teClau(TIPUS_CAMP, columna.clau)) error(`${on}: clau desconeguda «${columna.clau}».`);
    else if (columna.tipus !== TIPUS_CAMP[columna.clau]) error(`${on}: ${columna.clau} és de tipus '${TIPUS_CAMP[columna.clau]}'.`);
    if (claus.has(columna.clau)) error(`${on}: la clau «${columna.clau}» està repetida.`);
    claus.add(columna.clau);
    const titols = esText(columna.titol) ? [columna.titol] : [columna.titol?.ingres, columna.titol?.despesa];
    titols.forEach((titol) => textAmbMarcadors(`${on}.titol`, titol));
    if (!esAmplada(columna.amplada)) error(`${on}.amplada: cal un nombre de caràcters fins a ${MAX_AMPLADA}.`);
    if (columna.ampladaMaxima != null && !(esAmplada(columna.ampladaMaxima) && columna.ampladaMaxima >= columna.amplada)) {
      error(`${on}.ampladaMaxima: cal un nombre de caràcters entre l'amplada i ${MAX_AMPLADA}.`);
    }
    if (columna.alineacio != null && !ALINEACIONS.includes(columna.alineacio)) error(`${on}.alineacio: ${ALINEACIONS.join(', ')}.`);
    if (columna.ajust != null && typeof columna.ajust !== 'boolean') error(`${on}.ajust: cal un booleà.`);
    estilConegut(`${on}.estil`, estilDeColumna(columna));
  });

  const totalsPlantilla = p.totals && typeof p.totals === 'object' ? p.totals : {};
  textAmbMarcadors('totals.etiqueta', totalsPlantilla.etiqueta);
  if (!claus.has(totalsPlantilla.columna) || TIPUS_CAMP[totalsPlantilla.columna] === 'import') {
    error("totals.columna: cal la clau d'una columna de la plantilla que no siga d'import.");
  }
  estilConegut('totals.estilEtiqueta', totalsPlantilla.estilEtiqueta);
  estilConegut('totals.estil', totalsPlantilla.estil);

  if (!Array.isArray(p.disposicio)) error('disposicio: cal una llista de peces.');
  const blocs = [];
  (Array.isArray(p.disposicio) ? p.disposicio : []).forEach((peca, i) => {
    const on = `disposicio[${i}]`;
    const tipus = peca?.tipus;
    if (tipus === 'buida') return;
    if (tipus === 'titol') {
      textAmbMarcadors(`${on}.text`, peca.text);
      estilConegut(`${on}.estil`, peca.estil ?? 'titol');
      if (peca.combina != null && typeof peca.combina !== 'boolean') error(`${on}.combina: cal un booleà.`);
    } else if (tipus === 'fila') {
      if (!Array.isArray(peca.celles) || peca.celles.length === 0) {
        error(`${on}.celles: cal una llista de cel·les.`);
        return;
      }
      peca.celles.forEach((cel, j) => {
        if (!claus.has(cel?.columna)) error(`${on}.celles[${j}]: la columna «${cel?.columna}» no és de la plantilla.`);
        textAmbMarcadors(`${on}.celles[${j}].text`, cel?.text);
        if (cel?.estil != null) estilConegut(`${on}.celles[${j}].estil`, cel.estil);
      });
    } else if (tipus === 'bloc') {
      if (!teClau(BLOCS, peca.bloc)) error(`${on}.bloc: 'ingressos' o 'despeses'.`);
      else blocs.push(peca.bloc);
      if (peca.barra != null) {
        textAmbMarcadors(`${on}.barra`, peca.barra);
        estilConegut(`${on}.estilBarra`, peca.estilBarra ?? 'barra');
      }
      if (peca.combinaBarra != null && typeof peca.combinaBarra !== 'boolean') error(`${on}.combinaBarra: cal un booleà.`);
      estilConegut(`${on}.estilCapcalera`, peca.estilCapcalera ?? 'capcalera');
    } else {
      error(`${on}: tipus de peça desconegut «${tipus}».`);
    }
  });
  for (const bloc of Object.keys(BLOCS)) {
    const vegades = blocs.filter((b) => b === bloc).length;
    if (vegades !== 1) error(`disposicio: el bloc ${bloc} hi ha d'eixir una vegada i n'hi ha ${vegades}; si no, se'n perden o se'n repetixen factures.`);
  }
  if (errors.length > 0) throw new TypeError(`Plantilla del full no vàlida: ${errors.join(' ')}`);
  return p;
}

/* Nom de fulla vàlid per a Excel: sense []:*?/\ ni controls, sense cometa simple als extrems, com a molt 31 caràcters. */
function nomFullaValid(text) {
  const nom = text.replace(/[\u0000-\u001F[\]:*?/\\]/g, '').trim().slice(0, 31).replace(/^'+|'+$/g, '').trim();
  return nom || 'Full';
}

const llargariaText = (text) => text.split('\n').reduce((maxim, linia) => Math.max(maxim, linia.length), 0);

function celDada(columna, factura, estil) {
  const valor = factura[columna.clau];
  if (columna.tipus === 'data') return { tipus: 'data', valor: esDataValida(valor) ? { a: valor.a, m: valor.m, d: valor.d } : null, estil };
  if (columna.tipus === 'import') return { tipus: 'import', valor: importONull(valor), estil };
  const text = textDe(valor);
  return { tipus: 'text', valor: text === '' ? null : text, estil };
}

/**
 * El full del trimestre maquetat amb una plantilla (vegeu FULL MAQUETAT a la
 * capçalera). Les factures de cada bloc s'ordenen segons la plantilla i cap
 * no es filtra ni canvia de bloc.
 * @param {object} plantilla PLANTILLA_GESTORIA o una altra amb el mateix contracte.
 * @param {{ titular: string, any: number, t: number, ingressos?: object[], despeses?: object[] }} dades
 * @returns {object} el full maquetat
 */
export function maquetaFull(plantilla, { titular, any, t, ingressos = [], despeses = [] } = {}) {
  const p = comprovaPlantilla(plantilla);
  const rang = comprovaPeriode(any, t);
  const marcadors = marcadorsDe(titularNet(titular), any, t, rang);
  const text = (plantillaText) => {
    const omplit = omple(plantillaText, marcadors);
    return omplit === '' ? null : omplit;
  };
  const n = p.columnes.length;
  const ultimaColumna = lletraColumna(n - 1);
  const posicio = new Map(p.columnes.map((columna, i) => [columna.clau, i]));
  const factures = { ingressos, despeses };
  const llargaries = p.columnes.map(() => 0);
  const files = [];
  const combinacions = [];
  const estils = {};

  /* Un estil de la plantilla amb els retocs de la cel·la; el nom diu quins s'hi han aplicat. */
  const estil = (base, { format, alineacio, ajust } = {}) => {
    const definicio = { ...p.estils[base] };
    const retocs = [];
    if ((format === 'data' || format === 'import') && definicio.numFmt == null) {
      definicio.numFmt = p.formats[format];
      retocs.push(format);
    }
    if (alineacio && alineacio !== definicio.alineacio) {
      definicio.alineacio = alineacio;
      retocs.push(alineacio);
    }
    if (ajust && !definicio.ajust) {
      definicio.ajust = true;
      retocs.push('ajust');
    }
    const nom = [base, ...retocs].join('+');
    if (!teClau(estils, nom)) estils[nom] = definicio;
    return nom;
  };
  const filaBuida = () => Array(n).fill(null);

  /* Una fila de textos; combinada, la primera cel·la s'estén per tota la fila i la resta en porta l'estil. */
  const filaDeTextos = (rol, textos, combina, extra = {}) => {
    const celles = filaBuida();
    for (const cel of textos) celles[cel.columna] = { tipus: 'text', valor: cel.valor, estil: cel.estil == null ? null : estil(cel.estil) };
    if (combina && n > 1) {
      for (let i = 1; i < n; i += 1) if (!celles[i]) celles[i] = { tipus: 'text', valor: null, estil: celles[0]?.estil ?? null };
      combinacions.push(`A${files.length + 1}:${ultimaColumna}${files.length + 1}`);
    }
    files.push({ rol, ...extra, celles });
  };

  const bloc = (peca) => {
    const tipusFactura = BLOCS[peca.bloc];
    if (peca.barra != null) {
      filaDeTextos('barra', [{ columna: 0, valor: text(peca.barra), estil: peca.estilBarra ?? 'barra' }], peca.combinaBarra !== false, { bloc: peca.bloc });
    }
    const estilCapcalera = estil(peca.estilCapcalera ?? 'capcalera');
    files.push({
      rol: 'capcalera',
      bloc: peca.bloc,
      celles: p.columnes.map((columna) => ({
        tipus: 'text', valor: text(esText(columna.titol) ? columna.titol : columna.titol[tipusFactura]), estil: estilCapcalera
      }))
    });
    const ordenades = ordenaFactures((factures[peca.bloc] ?? []).filter(Boolean), p.ordre);
    const estilsDades = p.columnes.map((columna) => estil(estilDeColumna(columna), { format: columna.tipus, alineacio: columna.alineacio, ajust: columna.ajust }));
    const primera = files.length + 1;
    for (const factura of ordenades) {
      const celles = p.columnes.map((columna, i) => {
        const cel = celDada(columna, factura, estilsDades[i]);
        if (cel.tipus === 'text' && cel.valor !== null) llargaries[i] = Math.max(llargaries[i], llargariaText(cel.valor));
        return cel;
      });
      files.push({ rol: 'dada', bloc: peca.bloc, facturaId: textDe(factura.id), celles });
    }
    const ultima = files.length;
    const sumes = totals(ordenades);
    const celles = filaBuida();
    celles[posicio.get(p.totals.columna)] = { tipus: 'text', valor: text(p.totals.etiqueta), estil: estil(p.totals.estilEtiqueta) };
    p.columnes.forEach((columna, i) => {
      if (columna.tipus !== 'import') return;
      const cel = { tipus: 'import', valor: sumes[columna.clau], estil: estil(p.totals.estil, { format: 'import' }) };
      if (ordenades.length > 0) cel.formula = `SUM(${lletraColumna(i)}${primera}:${lletraColumna(i)}${ultima})`;
      celles[i] = cel;
    });
    files.push({ rol: 'totals', bloc: peca.bloc, celles });
  };

  for (const peca of p.disposicio) {
    if (peca.tipus === 'buida') files.push({ rol: 'buida', celles: filaBuida() });
    else if (peca.tipus === 'titol') filaDeTextos('titol', [{ columna: 0, valor: text(peca.text), estil: peca.estil ?? 'titol' }], peca.combina === true);
    else if (peca.tipus === 'fila') {
      filaDeTextos('fila', peca.celles.map((cel) => ({ columna: posicio.get(cel.columna), valor: text(cel.text), estil: cel.estil ?? null })), false);
    } else bloc(peca);
  }

  return {
    nomFulla: nomFullaValid(omple(p.nomFulla, marcadors)),
    font: { nom: p.font.nom, mida: p.font.mida },
    altFila: p.altFila,
    formats: { data: p.formats.data, dataText: p.formats.dataText, import: p.formats.import },
    columnes: p.columnes.map((columna, i) => ({
      amplada: columna.ampladaMaxima == null
        ? columna.amplada
        : Math.max(columna.amplada, Math.min(llargaries[i] + 2, columna.ampladaMaxima))
    })),
    files,
    combinacions,
    estils
  };
}

function textCsv(cel, formats) {
  if (!cel || cel.valor == null) return '';
  if (cel.tipus === 'data') return formatData(cel.valor, formats.dataText);
  if (cel.tipus === 'import') return formatImport(cel.valor);
  return protegeix(textDe(cel.valor));
}

/**
 * El full maquetat en CSV, fila per fila i amb una columna per cel·la: coma,
 * cometes on cal, imports «1.234,56 €» i textos protegits contra fórmules.
 * Per defecte CRLF i BOM d'UTF-8.
 * @param {object} maquetat el de maquetaFull
 * @param {{ bom?: boolean, salt?: string }} [opcions]
 * @returns {string}
 */
export function fullACsv(maquetat, { bom = true, salt = '\r\n' } = {}) {
  if (!maquetat || !Array.isArray(maquetat.files) || !Array.isArray(maquetat.columnes)) {
    throw new TypeError('fullACsv espera un full maquetat (el de maquetaFull).');
  }
  const n = maquetat.columnes.length;
  const files = maquetat.files.map((fila) => Array.from({ length: n }, (_, i) => textCsv(fila.celles?.[i], maquetat.formats ?? {})));
  return serialitzaCsv(files, { delimitador: ',', salt, bom });
}

function mapaColumnes(fila) {
  const mapa = {};
  fila.forEach((cel, i) => {
    const camp = ALIES_COLUMNES.get(clau(cel));
    if (camp && mapa[camp] == null) mapa[camp] = i;
  });
  return mapa;
}

function tipusDeColumnes(fila, mapa) {
  const nom = clau(fila[mapa.contrapart]);
  if (CONTRAPART_INGRES.has(nom)) return 'ingres';
  return CONTRAPART_DESPESA.has(nom) ? 'despesa' : null;
}

function facturaDeFila(fila, bloc, n, avisa, fitxer) {
  const cel = (camp) => {
    const i = bloc.columnes[camp];
    return i == null ? '' : desprotegeix(fila[i] ?? '');
  };
  const textos = Object.fromEntries(Object.keys(POSICIONS).map((camp) => [camp, cel(camp)]));
  if (!['data', 'num', ...CAMPS_IMPORT].some((camp) => textos[camp] !== '')) {
    avisa('FILA_SENSE_DADES', 'baixa', `Fila ${n}: no té data, número ni imports; no s'ha llegit com a factura.`);
    return null;
  }
  const data = textos.data === '' ? null : parseData(textos.data);
  if (textos.data !== '' && !data) avisa('DATA_ILLEGIBLE', 'mitjana', `Fila ${n}: no s'entén la data «${textos.data}».`);
  const imports = {};
  for (const camp of CAMPS_IMPORT) {
    imports[camp] = textos[camp] === '' ? null : parseImport(textos[camp]);
    if (textos[camp] !== '' && imports[camp] === null) {
      avisa('IMPORT_ILLEGIBLE', 'mitjana', `Fila ${n}: no s'entén l'import del ${ETIQUETES_IMPORT[camp]} «${textos[camp]}».`);
    }
  }
  /* El que ja és al full ho va escriure una persona: confiança alta en el que s'ha pogut llegir. */
  const confianca = {};
  for (const camp of Object.keys(POSICIONS)) {
    const llegit = camp === 'data' ? data !== null : CAMPS_IMPORT.includes(camp) ? imports[camp] !== null : textos[camp] !== '';
    if (llegit) confianca[camp] = 'alta';
  }
  return crearFactura({
    tipus: bloc.tipus, data, num: textos.num, contrapart: textos.contrapart, nif: textos.nif, descripcio: textos.descripcio,
    ...imports, origen: { fitxer, metode: 'model' }, confianca
  });
}

function comprovaTotals(bloc, valors, n, avisa) {
  const calculats = totals(bloc.factures);
  if (calculats.incomplet) return;
  const diferencies = [];
  CAMPS_IMPORT.forEach((camp, k) => {
    const declarat = parseImport(valors[k] ?? '');
    if (declarat !== null && declarat !== calculats[camp]) {
      diferencies.push(`${ETIQUETES_IMPORT[camp]}: ${formatImport(declarat)} al full, ${formatImport(calculats[camp])} sumant les files`);
    }
  });
  if (diferencies.length > 0) {
    avisa('TOTALS_NO_QUADREN', 'mitjana', `Fila ${n}: els totals de ${bloc.nom} no quadren (${diferencies.join('; ')}).`);
  }
}

/**
 * Llig un full trimestral ja fet (CSV de coma o de punt i coma): el format
 * d'ara («Titular - inici - fi - <n>T» a la primera fila), el verd anterior
 * («<AAAA>-FACTURACIO-...» i el període a part) i els models antics. Les
 * seccions INGRESSOS i GASTOS (o DESPESES) es reconeixen sense distinció de
 * majúscules, la capçalera de columnes per la cel·la «Data» i les files de
 * totals (de 8 o 9 camps) no són factures: només se'n comproven les xifres.
 * @param {string|Uint8Array|ArrayBuffer} text
 * @param {{ fitxer?: string|null }} [opcions] fitxer: el nom que porten l'origen i els avisos.
 * @returns {{ any: number|null, t: number|null, titular: string, inici: object|null, fi: object|null, ingressos: object[], despeses: object[], avisos: object[] }}
 */
export function llegeixModelCsv(text, { fitxer = null } = {}) {
  const font = typeof text === 'string' ? text : text == null ? '' : decodificaText(text);
  const nomFitxer = typeof fitxer === 'string' && fitxer !== '' ? fitxer : null;
  const avisos = [];
  const avisa = (codi, severitat, missatge) => avisos.push({ codi, severitat, missatge, ...(nomFitxer ? { fitxer: nomFitxer } : {}) });
  const resultat = { any: null, t: null, titular: '', inici: null, fi: null, ingressos: [], despeses: [], avisos };
  let slug = '';
  let bloc = null;
  let ambColumnes = false;

  parseCsv(font).forEach((crua, i) => {
    const fila = crua.map((cel) => cel.trim());
    const n = i + 1;
    if (fila.every((cel) => cel === '')) return;
    if (!bloc) {
      const titol = resultat.any === null ? TITOL.exec(senseAccents(fila[0])) : null;
      if (titol) {
        resultat.any = Number(titol[1]);
        slug = titol[2];
        const etiqueta = fila.slice(1).map((cel) => ETIQUETA_TRIMESTRE.exec(cel)).find(Boolean);
        if (etiqueta) resultat.t = Number(etiqueta[1]);
        return;
      }
      const capcalera = resultat.inici === null ? fila.map((cel) => CAPCALERA.exec(desprotegeix(cel))).find(Boolean) : null;
      if (capcalera) {
        resultat.titular = capcalera[1].trim();
        resultat.inici = parseData(capcalera[2]);
        resultat.fi = parseData(capcalera[3]);
        if (capcalera[4] && resultat.t === null) resultat.t = Number(capcalera[4]);
        return;
      }
    }
    const seccio = SECCIONS.get(clau(fila[0]));
    if (seccio && fila.slice(1).every((cel) => cel === '')) {
      bloc = { nom: fila[0], tipus: seccio, columnes: POSICIONS, factures: [] };
      return;
    }
    if (clau(fila[0]) === 'data' || clau(fila[0]) === 'fecha') {
      const columnes = mapaColumnes(fila);
      /* Sense línia de secció, unes columnes noves després de factures són un altre bloc. */
      if (!bloc || bloc.factures.length > 0) {
        const tipus = tipusDeColumnes(fila, columnes);
        if (!tipus) avisa('SECCIO_DESCONEGUDA', 'mitjana', `Fila ${n}: columnes sense secció INGRESSOS o GASTOS; es lligen com a despeses.`);
        bloc = { nom: tipus === 'ingres' ? 'INGRESSOS' : 'GASTOS', tipus: tipus ?? 'despesa', columnes, factures: [] };
      }
      bloc.columnes = columnes;
      ambColumnes = true;
      return;
    }
    const iTotals = fila.findIndex((cel) => PARAULES_TOTALS.has(clau(cel)));
    if (iTotals >= 0 && fila.slice(0, iTotals).every((cel) => cel === '')) {
      if (bloc) comprovaTotals(bloc, fila.slice(iTotals + 1, iTotals + 4), n, avisa);
      return;
    }
    if (!bloc) {
      avisa('FILA_FORA_DE_BLOC', 'baixa', `Fila ${n}: fora de les seccions INGRESSOS i GASTOS; no s'ha llegit.`);
      return;
    }
    const factura = facturaDeFila(fila, bloc, n, avisa, nomFitxer);
    if (!factura) return;
    bloc.factures.push(factura);
    (factura.tipus === 'ingres' ? resultat.ingressos : resultat.despeses).push(factura);
  });

  if (!ambColumnes) {
    avisa('MODEL_SENSE_CAPCALERA', 'alta', "No s'ha trobat la fila de columnes (Data, Núm...): el fitxer no sembla un full de la gestoria.");
  }
  if (resultat.any === null && resultat.inici) resultat.any = resultat.inici.a;
  if (resultat.t === null && resultat.inici) resultat.t = trimestreDe(resultat.inici);
  if (resultat.titular === '' && slug !== '') resultat.titular = slug.replace(/_/g, ' ').trim();
  const rang = rangTrimestre(resultat.any, resultat.t);
  if (rang && resultat.inici && resultat.fi
    && (formatData(rang.inici) !== formatData(resultat.inici) || formatData(rang.fi) !== formatData(resultat.fi))) {
    avisa('PERIODE_INCOHERENT', 'baixa',
      `El període de la capçalera (${formatData(resultat.inici)} - ${formatData(resultat.fi)}) no és el del ${resultat.t}T de ${resultat.any}.`);
  }
  return resultat;
}
