/**
 * plantillaSintetica.js — un diari miccional SINTÈTIC amb la forma de la
 * plantilla real (Numbers), per a provar l'importador sense cap dada de ningú.
 *
 * Imita l'estructura que en va traure tests/salut-diari-miccional-estructura.test.mjs:
 *   · fulles «<Full> - <Taula>»: «Resumen de exportación», «<prefix> - Tabla 1»
 *     (el resum del dia) i «<prefix> - DIARI MICCION» (la graella, amb el nom
 *     tallat a 31 caràcters com fa Numbers);
 *   · sistema de dates de 1904, formats h:mm (20) i dd/mm/yy (59 propi);
 *   · la graella: fila 1 amb els grups (HORA, LÍQUID INGERIT B1:E1, MICCIÓ,
 *     PÈRDUA I1:L1, URGÈNCIA M1:Q1, MUDA R1:U1, QUÈ FEIA? V1:Z1) i les dos
 *     fórmules COUNTIF; fila 2 amb les begudes, «ml» i les escales (0…3, 0…4);
 *     24 franges amb la clau horària (una data de 2017 i l'hora, com Numbers),
 *     la suma de cada fila (F) i MICCIÓ combinada G:H; fila 27 «TOTALS» amb
 *     SUM i COUNTA. Les fórmules porten el valor en memòria cau;
 *   · el resum: PACIENT (amb un àlies inventat, per a comprovar que no
 *     s'importa mai), Data, Alçar-se del llit, Anar a dormir i els totals.
 * Els valors són inventats. El paquet es fa a partir d'un llibre de creaXlsx
 * (relacions i espais de noms) amb les fulles, els estils i les cadenes propis.
 *
 *   plantillaSintetica({ franges: { '07': { aigua: 200, miccio: 250, urgencia: 2 } },
 *     resum: { data: '2026-03-10', alcar: '07:15', dormir: '22:30' } }) → Uint8Array (.xlsx)
 *   plantillaSinteticaCsv({ franges }) → text (la graella com l'exporta Numbers en CSV)
 */
import { creaXlsx, creaZip, llegeixZip } from '../../../../utils/fulls/index.js';

export const ALIES_SINTETIC = 'Iaio Inventat de Prova';
export const PREFIX_PER_DEFECTE = 'Diari Miccional';

const DECLARACIO = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';
const MS_DIA = 86400000;
/* El dia de la plantilla que Numbers posa a les claus horàries (2017). */
const DIA_PLANTILLA = '2017-04-10';
const ORIGEN_1904 = Date.UTC(1904, 0, 1);
const XF = Object.freeze({ general: 0, hora: 1, data: 2 });

/* Les columnes de la graella: grup, sub-capçalera i, per a les escales, el nivell. */
const BEGUDES = Object.freeze([['aigua', 'B', 'Aigua'], ['cafe', 'C', 'Cafè'], ['alcohol', 'D', 'Alcohol'], ['menjar', 'E', 'Menjar']]);
const ESCALES = Object.freeze([
  { clau: 'perdua', etiqueta: 'PÈRDUA', columnes: ['I', 'J', 'K', 'L'] },
  { clau: 'urgencia', etiqueta: 'URGÈNCIA', columnes: ['M', 'N', 'O', 'P', 'Q'] },
  { clau: 'muda', etiqueta: 'MUDA', columnes: ['R', 'S', 'T', 'U'] },
  { clau: 'queFeia', etiqueta: 'QUÈ FEIA?', columnes: ['V', 'W', 'X', 'Y', 'Z'] }
]);
const PRIMERA_FRANJA = 3;
const FILA_TOTALS = 27;

const dosXifres = (n) => String(n).padStart(2, '0');
const escapa = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const serialData = (data) => {
  const [any, mes, dia] = data.split('-').map(Number);
  return (Date.UTC(any, mes - 1, dia) - ORIGEN_1904) / MS_DIA;
};
const serialHora = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return (h * 60 + m) / 1440;
};
const nivells = (valor) => (valor === undefined || valor === null ? [] : [].concat(valor));

/* Les franges d'un dia: [{ fila, hora: 'HH', valors }], de l'hora `inici` en avant. */
function frangesDe({ franges = {}, inici = 0 }) {
  return Array.from({ length: 24 }, (_, i) => {
    const hora = dosXifres((inici + i) % 24);
    return { fila: PRIMERA_FRANJA + i, hora, valors: franges[hora] || {} };
  });
}

/* Una taula de cadenes compartides, com la del full real. */
function cadenes() {
  const indexs = new Map();
  return {
    index(text) {
      if (!indexs.has(text)) indexs.set(text, indexs.size);
      return indexs.get(text);
    },
    xml(obertura) {
      const elements = [...indexs.keys()].map((text) => `<si><t>${escapa(text)}</t></si>`).join('');
      return `${DECLARACIO}${obertura.replace(/\s(?:count|uniqueCount)="\d+"/g, '')}${elements}</sst>`;
    }
  };
}

/* Una fulla: les cel·les per fila (cada una ja en XML) i les combinacions. */
function fulla() {
  const files = new Map();
  const combinacions = [];
  const posa = (ref, xml) => {
    const fila = Number(/\d+$/.exec(ref)[0]);
    if (!files.has(fila)) files.set(fila, []);
    files.get(fila).push({ ref, xml });
  };
  return {
    combina: (rang) => combinacions.push(rang),
    buida: (ref, xf = XF.general) => posa(ref, `<c r="${ref}" s="${xf}"/>`),
    text: (ref, text, taula) => posa(ref, `<c r="${ref}" t="s"><v>${taula.index(text)}</v></c>`),
    nombre: (ref, n, xf = XF.general) => posa(ref, `<c r="${ref}" s="${xf}"><v>${n}</v></c>`),
    formula: (ref, f, valor) => posa(ref, `<c r="${ref}"><f>${escapa(f)}</f>${valor === null ? '' : `<v>${valor}</v>`}</c>`),
    xml(obertura) {
      const ordre = (ref) => ref.replace(/\d+$/, '').padStart(3, ' ');
      const cos = [...files.keys()].sort((a, b) => a - b).map((fila) => {
        const celles = files.get(fila).sort((x, y) => (ordre(x.ref) < ordre(y.ref) ? -1 : 1)).map((c) => c.xml).join('');
        return `<row r="${fila}">${celles}</row>`;
      }).join('');
      const merges = combinacions.length ? `<mergeCells count="${combinacions.length}">${combinacions.map((r) => `<mergeCell ref="${r}"/>`).join('')}</mergeCells>` : '';
      return `${DECLARACIO}${obertura}<sheetData>${cos}</sheetData>${merges}</worksheet>`;
    }
  };
}

/* El valor d'una cel·la per omplir: un nombre, un text tal qual (una «x», «250 ml») o una
   fórmula escrita a mà ({ formula: '100+50', valor: 150 }), que el full calcula i guarda. */
function valor(full, ref, v, taula) {
  if (v === undefined || v === null) full.buida(ref);
  else if (typeof v === 'number') full.nombre(ref, v);
  else if (typeof v === 'object') full.formula(ref, v.formula, v.valor);
  else full.text(ref, String(v), taula);
}

/* La graella d'un dia: les cel·les i, per a la fila TOTALS, els valors que hi calcularia el full. */
function graella(dia, taula) {
  const full = fulla();
  const franges = frangesDe(dia);
  const sumes = Object.fromEntries(['B', 'C', 'D', 'E', 'F', 'G'].map((col) => [col, 0]));
  const marques = Object.fromEntries(ESCALES.flatMap((e) => e.columnes).map((col) => [col, 0]));
  let ambIngesta = 0;
  let ambMiccio = 0;
  /* El que sumaria el full: els nombres i el resultat de les fórmules; els textos, no. */
  const numero = (v) => (typeof v === 'number' ? v : typeof v?.valor === 'number' ? v.valor : 0);

  full.text('A1', 'HORA', taula);
  full.text('B1', 'LÍQUID INGERIT', taula);
  ['C1', 'D1', 'E1'].forEach((ref) => full.buida(ref));
  full.combina('B1:E1');
  full.text('G1', 'MICCIÓ', taula);
  for (const escala of ESCALES) {
    full.text(`${escala.columnes[0]}1`, escala.etiqueta, taula);
    escala.columnes.slice(1).forEach((col) => full.buida(`${col}1`));
    full.combina(`${escala.columnes[0]}1:${escala.columnes[escala.columnes.length - 1]}1`);
  }
  full.text('A2', 'hh:mm', taula);
  for (const [, col, nom] of BEGUDES) full.text(`${col}2`, (dia.subcapcaleres || {})[col] || nom, taula);
  full.text('F2', 'ml', taula);
  full.text('G2', 'ml', taula);
  full.buida('H2');
  full.combina('G2:H2');
  for (const escala of ESCALES) escala.columnes.forEach((col, n) => full.nombre(`${col}2`, n));

  for (const { fila, hora, valors } of franges) {
    full.nombre(`A${fila}`, serialData(DIA_PLANTILLA) + serialHora(`${hora}:00`), XF.hora);
    let sumaFila = 0;
    for (const [clau, col] of BEGUDES) {
      valor(full, `${col}${fila}`, valors[clau], taula);
      sumes[col] += numero(valors[clau]);
      sumaFila += numero(valors[clau]);
    }
    full.formula(`F${fila}`, `SUM(B${fila}:E${fila})`, sumaFila);
    sumes.F += sumaFila;
    if (sumaFila > 0) ambIngesta += 1;
    valor(full, `G${fila}`, valors.miccio, taula);
    full.buida(`H${fila}`);
    full.combina(`G${fila}:H${fila}`);
    sumes.G += numero(valors.miccio);
    if (numero(valors.miccio) > 0) ambMiccio += 1;
    for (const escala of ESCALES) {
      /* Una marca és el nivell (s'hi escriu una «x») o { nivell, escrit } (s'hi escriu `escrit`: un 1, un 3…). */
      const marcats = nivells(valors[escala.clau]);
      escala.columnes.forEach((col, n) => {
        const marca = marcats.find((m) => (typeof m === 'object' ? m.nivell : m) === n);
        if (marca !== undefined) {
          valor(full, `${col}${fila}`, typeof marca === 'object' ? marca.escrit : 'x', taula);
          marques[col] += 1;
        } else full.buida(`${col}${fila}`);
      });
    }
  }
  full.formula('F1', 'COUNTIF(F2:F26,">0")', ambIngesta);
  full.formula('H1', 'COUNTIF(G2:H26,">0")', ambMiccio);

  const forcats = dia.totals || {};
  const total = (ref, calculat) => (Object.prototype.hasOwnProperty.call(forcats, ref) ? forcats[ref] : calculat);
  full.text(`A${FILA_TOTALS}`, 'TOTALS', taula);
  for (const col of ['B', 'C', 'D', 'E', 'F', 'G']) {
    full.formula(`${col}${FILA_TOTALS}`, `SUM(${col}${PRIMERA_FRANJA}:${col}26)`, total(`${col}${FILA_TOTALS}`, sumes[col]));
  }
  for (const col of Object.keys(marques)) {
    full.formula(`${col}${FILA_TOTALS}`, `COUNTA(${col}${PRIMERA_FRANJA}:${col}26)`, total(`${col}${FILA_TOTALS}`, marques[col]));
  }
  return { full, sumes, marques, ambIngesta, ambMiccio };
}

/* El resum del dia: les etiquetes, les cel·les de valor i les fórmules cap a la graella. */
function resum(dia, nomGraella, calculs, taula) {
  const full = fulla();
  const { pacient = ALIES_SINTETIC, data = null, alcar = null, dormir = null } = dia.resum || {};
  const g = (ref) => `'${nomGraella}'!${ref}`;
  full.text('A1', 'DIARI MICCIONAL', taula);
  full.buida('B1');
  full.combina('A1:B1');
  full.text('C1', 'PACIENT', taula);
  full.combina('C1:E1');
  valor(full, 'F1', pacient, taula);
  full.combina('F1:M1');
  full.text('N1', 'Data', taula);
  if (data) full.nombre('O1', serialData(data), XF.data);
  else full.buida('O1', XF.data);
  full.text('A2', 'Alçar-se del llit', taula);
  full.combina('A2:B2');
  if (alcar && /^\d{2}:\d{2}$/.test(alcar)) full.nombre('C2', serialHora(alcar), XF.hora);
  else valor(full, 'C2', alcar, taula);
  full.combina('C2:E2');
  full.text('F2', 'Anar a dormir', taula);
  full.combina('F2:G2');
  if (dormir && /^\d{2}:\d{2}$/.test(dormir)) full.nombre('H2', serialHora(dormir), XF.hora);
  else valor(full, 'H2', dormir, taula);

  const { sumes, marques, ambIngesta, ambMiccio } = calculs;
  full.text('A4', 'BEGUT', taula);
  full.formula('B4', g('F27'), sumes.F);
  full.text('C4', 'ml', taula);
  full.text('D4', 'en', taula);
  full.formula('E4', g('F1'), ambIngesta);
  full.text('F4', 'INGESTES', taula);
  full.text('H4', 'PÈRDUES', taula);
  full.formula('I4', `${g('J27')}+${g('K27')}+${g('L27')}`, marques.J + marques.K + marques.L);
  full.text('J4', 'URGENTS', taula);
  full.formula('K4', `${g('O27')}+${g('P27')}+${g('Q27')}`, marques.O + marques.P + marques.Q);
  full.text('A5', 'PIXAT', taula);
  full.formula('B5', g('G27'), sumes.G);
  full.text('C5', 'ml', taula);
  full.text('D5', 'en', taula);
  full.formula('E5', g('H1'), ambMiccio);
  full.text('F5', 'MICCIONS', taula);
  full.text('H5', 'MUDES', taula);
  full.formula('I5', `${g('S27')}+${g('T27')}+${g('U27')}`, marques.S + marques.T + marques.U);
  full.text('J5', 'FENT?', taula);
  full.formula('K5', `${g('W27')}+${g('X27')}+${g('Y27')}+${g('Z27')}`, marques.W + marques.X + marques.Y + marques.Z);
  full.text('A6', 'DIFERÈNCIA', taula);
  full.formula('B6', 'B4-B5', sumes.F - sumes.G);
  full.text('C6', 'ml', taula);
  return full;
}

const ESTILS = [
  '<numFmts count="1"><numFmt numFmtId="59" formatCode="dd/mm/yy"/></numFmts>',
  '<fonts count="1"><font><sz val="10"/><name val="Helvetica Neue"/></font></fonts>',
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>',
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
  '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
  '<xf numFmtId="20" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
  '<xf numFmtId="59" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>',
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
].join('');

/**
 * Un .xlsx sintètic amb la forma de la plantilla.
 * @param {object} [opcions]
 * @param {Record<string, object>} [opcions.franges] per hora 'HH': { aigua, cafe, alcohol, menjar, miccio,
 *   perdua, urgencia, muda, queFeia }. Les begudes i la micció, un nombre o un text; les escales, el
 *   nivell que es marca (o una llista de nivells, per a provar dos marques en un grup, o
 *   { nivell, escrit } per a escriure a la columna una altra cosa que una «x»).
 * @param {{ pacient?: string, data?: string, alcar?: string, dormir?: string }} [opcions.resum]
 * @param {Record<string, number>} [opcions.totals] força el valor en memòria cau d'una cel·la de TOTALS ('B27': 999)
 * @param {number} [opcions.inici] l'hora de la primera franja (0)
 * @param {Record<string, string>} [opcions.subcapcaleres] canvia la sub-capçalera d'una beguda ({ E: 'Llet' })
 * @param {object[]} [opcions.dies] diversos dies en el mateix llibre (cada un, amb les opcions d'adalt, un `prefix`
 *   i, per a dos taules en una mateixa fulla de Numbers, `taulaResum` i `taulaGraella`)
 * @returns {Uint8Array}
 */
export function plantillaSintetica(opcions = {}) {
  const dies = opcions.dies || [{ ...opcions, prefix: opcions.prefix || PREFIX_PER_DEFECTE }];
  const nomResum = (dia) => `${dia.prefix} - ${dia.taulaResum || 'Tabla 1'}`;
  const nomGraellaDe = (dia) => `${dia.prefix} - ${dia.taulaGraella || 'DIARI MICCIONAL'}`.slice(0, 31);
  const noms = ['Resumen de exportación', ...dies.flatMap((dia) => [nomResum(dia), nomGraellaDe(dia)])];
  /* Un llibre de creaXlsx amb les mateixes fulles dona les relacions i els espais de noms. */
  const base = creaXlsx({ fulles: noms.map((nom) => ({ nom, columnes: [{ titol: nom, tipus: 'text' }], files: [] })) });
  const descodificador = new TextDecoder();
  const parts = new Map(llegeixZip(base).map(({ nom, dades }) => [nom, descodificador.decode(dades)]));
  const obertura = (part, element) => new RegExp(`<${element}\\b[^>]*>`).exec(parts.get(part))[0];

  const taula = cadenes();
  const portada = fulla();
  portada.text('A3', 'Resumen de exportación', taula);
  portada.text('A5', 'Numbers ha exportat les taules a fulles.', taula);
  const fulles = [portada];
  for (const dia of dies) {
    const calculs = graella(dia, taula);
    fulles.push(resum(dia, nomGraellaDe(dia), calculs, taula), calculs.full);
  }
  const obreFulla = obertura('xl/worksheets/sheet1.xml', 'worksheet');
  parts.set('xl/workbook.xml', parts.get('xl/workbook.xml').replace('<bookViews>', '<workbookPr date1904="1"/><bookViews>'));
  parts.set('xl/styles.xml', `${DECLARACIO}${obertura('xl/styles.xml', 'styleSheet')}${ESTILS}</styleSheet>`);
  fulles.forEach((f, i) => parts.set(`xl/worksheets/sheet${i + 1}.xml`, f.xml(obreFulla)));
  parts.set('xl/sharedStrings.xml', taula.xml(obertura('xl/sharedStrings.xml', 'sst')));
  const codificador = new TextEncoder();
  return creaZip([...parts].map(([nom, xml]) => ({ nom, dades: codificador.encode(xml) })));
}

/**
 * La graella d'un dia com l'exporta Numbers en CSV (una taula per fitxer):
 * punt i coma, hores «H:MM», el valor de les fórmules i res del resum.
 * @param {{ franges?: Record<string, object>, inici?: number }} [opcions]
 * @returns {string}
 */
export function plantillaSinteticaCsv(opcions = {}) {
  const franges = frangesDe(opcions);
  const numero = (v) => (typeof v === 'number' ? v : 0);
  const text = (v) => (v === undefined || v === null ? '' : String(v));
  /* Les columnes del CSV: A (0) la clau, B–E (1–4) les begudes, F (5) la suma, G (6) la micció, H (7) buida, I–Z (8–25) les marques. */
  const files = franges.map(({ hora, valors }) => {
    const begudes = BEGUDES.map(([clau]) => valors[clau]);
    const suma = begudes.reduce((n, v) => n + numero(v), 0);
    const escales = ESCALES.flatMap((e) => e.columnes.map((_, n) => (nivells(valors[e.clau]).includes(n) ? 'x' : '')));
    return [`${Number(hora)}:00`, ...begudes.map(text), String(suma), text(valors.miccio), '', ...escales];
  });
  const totals = Array.from({ length: 26 }, (_, i) => files.reduce((n, fila) => {
    if (i >= 1 && i <= 6) return n + (Number(fila[i]) || 0);
    return i >= 8 && fila[i] !== '' ? n + 1 : n;
  }, 0));
  const ambIngesta = files.filter((f) => Number(f[5]) > 0).length;
  const ambMiccio = files.filter((f) => Number(f[6]) > 0).length;
  const grups = ['HORA', 'LÍQUID INGERIT', '', '', '', String(ambIngesta), 'MICCIÓ', String(ambMiccio),
    ...ESCALES.flatMap((e) => e.columnes.map((_, n) => (n === 0 ? e.etiqueta : '')))];
  const subs = ['hh:mm', ...BEGUDES.map(([, , nom]) => nom), 'ml', 'ml', '', ...ESCALES.flatMap((e) => e.columnes.map((_, n) => String(n)))];
  const filaTotals = ['TOTALS', ...totals.slice(1, 7).map(String), '', ...totals.slice(8).map(String)];
  return [grups, subs, ...files, filaTotals].map((fila) => fila.join(';')).join('\r\n');
}
