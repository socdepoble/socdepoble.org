/**
 * fontMoviments.js — el port dels moviments del banc: una sola frontera per a
 * qualsevol origen (un fitxer hui, una connexió bancària demà).
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6: una Gestoria «enxufable»,
 * preparada per a futures connexions bancàries). La decisió i el perquè són a
 * fitxes/gestoria_port_bancari.md.
 *
 * EL CONTRACTE (sdp.gestoria.font-moviments.v1). Una font de moviments és:
 *   { esquema, id, tipus, nom, local, avisos, llegixMoviments({ des, fins }) }
 *   · llegixMoviments({ des, fins }) torna els moviments amb la data
 *     d'operació dins del rang, amb els dos extrems inclosos; un extrem absent
 *     deixa el rang obert. Ordenats per data i, el mateix dia, en l'ordre de
 *     l'origen. Cada crida torna els mateixos moviments amb els mateixos id.
 *   · Un moviment: { id, data, dataValor, concepte, import, saldo, moneda,
 *     compte, origen: { font, tipus, posicio }, detall }.
 *       id        estable: el mateix moviment té el mateix id en dos extractes
 *                 que se solapen i en dues lectures del mateix fitxer.
 *       data      la d'operació, { a, m, d }; dataValor, igual.
 *       import    cèntims enters amb signe: una eixida és negativa.
 *       saldo     cèntims després del moviment, o null si l'origen no el diu.
 *       moneda    ISO 4217 ('EUR' quasi sempre; 'XXX' si no se sap).
 *       compte    «entitat-quatre últims dígits», o null. Mai el número sencer.
 *       detall    el moviment tal com l'entén la conciliació (concilia.js).
 *   · local: true vol dir que respon de seguida, sense xarxa. Una font de
 *     xarxa (un agregador PSD2) tornarà una promesa i dirà local: false; qui
 *     consumix el port ha de fer sempre `await`.
 *
 * ELS ADAPTADORS D'ARA: fontDeC43 (la Norma 43, c43.js) i fontDeCsv (el CSV
 * del compte o de la targeta, extracteCsv.js). Un tercer adaptador no ha de
 * tocar res d'ací: fa una font amb creaFont i passa comprovaFont, el kit de
 * conformitat que ja passen estos dos.
 *
 * L'IDENTIFICADOR. Una empremta FNV-1a (hashFnv1a, model.js) del compte (en
 * un CSV, que no el diu, la identitat del fitxer), les dates, l'import, el
 * concepte normalitzat i l'ordinal dels iguals dins del mateix origen: dos
 * cafés del mateix dia al mateix bar són dos moviments, i el mateix café en
 * dos extractes solapats del MATEIX COMPTE CONEGUT és un de sol
 * (uneixMoviments). Sense compte conegut, davant del dubte es conserven tots.
 *
 * Cap xarxa, cap credencial, cap emmagatzematge. JS pur: sense DOM ni APIs de
 * Node. Res del que rep es modifica.
 */
import { llegeixC43, textDelsConceptes } from './c43.js';
import { comparaDates, dinsDeRang, esDataValida, formatData } from './dates.js';
import { llegeixExtracteCsv } from './extracteCsv.js';
import { hashFnv1a } from './model.js';

/** El nom del contracte: si canvia el que promet una font, canvia el nom. */
export const ESQUEMA_FONT_MOVIMENTS = 'sdp.gestoria.font-moviments.v1';
/** Els adaptadors que existixen hui. Un agregador bancari en serà un tercer. */
export const TIPUS_FONT_MOVIMENTS = Object.freeze(['c43', 'csv']);
/** Els camps d'un moviment del port, en ordre. */
export const CAMPS_MOVIMENT = Object.freeze(['id', 'data', 'dataValor', 'concepte', 'import', 'saldo', 'moneda', 'compte', 'origen', 'detall']);
const MONEDA_PER_DEFECTE = 'EUR';
const MONEDA_DESCONEGUDA = 'XXX';

const textNormal = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const iso = (d) => formatData(d, 'aaaa-mm-dd');
const copiaData = (d) => ({ a: d.a, m: d.m, d: d.d });

/* L'id de cada moviment d'un origen: l'empremta de la seua clau i l'ordinal dels iguals. */
function creaIds() {
  const vistos = new Map();
  return ({ compte, data, dataValor, centims, concepte }) => {
    const clau = [compte ?? '', iso(data), iso(dataValor), centims, textNormal(concepte)].join('|');
    const n = (vistos.get(clau) ?? 0) + 1;
    vistos.set(clau, n);
    return `mv_${hashFnv1a(`${clau}|${n}`)}`;
  };
}

/**
 * Una font de moviments a partir d'una llista ja normalitzada. És la peça que
 * fa servir cada adaptador (i la que farà servir un de nou).
 * @param {object} p
 * @param {string} p.tipus el de l'adaptador ('c43', 'csv' o el d'un de nou)
 * @param {string} [p.nom] el nom que veu la persona (el del fitxer)
 * @param {object[]} p.moviments els moviments del port, sense `origen.font`
 * @param {object[]} [p.avisos] els avisos de la lectura
 * @param {boolean} [p.local] per defecte true
 * @returns {Readonly<object>} la font (vegeu EL CONTRACTE)
 */
export function creaFont({ tipus, nom = '', moviments = [], avisos = [], local = true } = {}) {
  const ordenats = moviments.map((m, i) => ({ m, i }))
    .sort((x, y) => comparaDates(x.m.data, y.m.data) || x.i - y.i)
    .map(({ m }) => m);
  const id = `font_${hashFnv1a([tipus, ...ordenats.map((m) => m.id)].join('|'))}`;
  const propis = Object.freeze(ordenats.map((m) => Object.freeze({ ...m, origen: Object.freeze({ ...m.origen, font: id, tipus }) })));
  const dates = propis.map((m) => m.data);
  return Object.freeze({
    esquema: ESQUEMA_FONT_MOVIMENTS,
    id,
    tipus,
    nom: String(nom ?? ''),
    local: local === true,
    avisos: Object.freeze([...avisos]),
    cobertura: Object.freeze(dates.length ? { des: dates[0], fins: dates[dates.length - 1] } : { des: null, fins: null }),
    llegixMoviments({ des = null, fins = null } = {}) {
      if (des == null && fins == null) return propis;
      return Object.freeze(propis.filter((m) => dinsDeRang(m.data, { inici: des, fi: fins })));
    }
  });
}

/**
 * La font d'un extracte en Norma 43.
 * @param {Uint8Array|ArrayBuffer|string} entrada els bytes o el text del fitxer
 * @param {{ nom?: string }} [opcions]
 * @returns {Readonly<object>} la font; `avisos` són els de llegeixC43
 */
export function fontDeC43(entrada, { nom = '' } = {}) {
  const lectura = llegeixC43(entrada);
  const moviments = [];
  for (const compte of lectura.comptes) {
    const cap = compte.capcalera;
    const clauCompte = `${cap.entitat}-${cap.compte4}`;
    const idDe = creaIds();
    for (const m of compte.moviments) {
      if (!esDataValida(m.dataOperacio) || !Number.isSafeInteger(m.centims)) continue;
      const dataValor = esDataValida(m.dataValor) ? m.dataValor : m.dataOperacio;
      const concepte = textDelsConceptes(m);
      moviments.push({
        id: idDe({ compte: clauCompte, data: m.dataOperacio, dataValor, centims: m.centims, concepte }),
        data: copiaData(m.dataOperacio),
        dataValor: copiaData(dataValor),
        concepte,
        import: m.centims,
        saldo: null,
        moneda: cap.divisa ?? MONEDA_DESCONEGUDA,
        compte: clauCompte,
        origen: { posicio: m.linia },
        detall: m
      });
    }
  }
  return creaFont({ tipus: 'c43', nom, moviments, avisos: lectura.avisos });
}

/* Una fila del CSV amb la forma mínima que entén la conciliació (la d'un moviment de la Norma 43). */
const detallDeFila = (fila) => ({
  linia: fila.fila,
  dataOperacio: fila.dataOperacio,
  dataValor: fila.dataValor,
  centims: fila.centims,
  conceptes: [{ codi: '01', camps: [fila.concepte ?? '', ''] }],
  ...(fila.comerc ? { comerc: fila.comerc } : {}),
  /* Correcció 261011 (refutador, punt 7): la moneda viatja amb el moviment; qui el concilia no l'ha de prendre per euros. */
  ...(fila.moneda ? { moneda: fila.moneda } : {})
});

/**
 * La font d'un extracte en CSV: el compte del banc o la targeta de crèdit.
 *
 * Correcció 261011 (refutador, punt 2). Un CSV no diu de quin compte o de
 * quina targeta és. Perquè dos extractes de dues targetes amb la mateixa
 * subscripció el mateix dia no donen el mateix id, l'id porta la identitat del
 * fitxer: una empremta del seu nom i de les seues columnes (no de les dates).
 * I encara així, uneixMoviments no lleva mai en silenci un moviment d'una font
 * sense compte conegut: dos extractes de la mateixa targeta que se solapen
 * conserven els moviments repetits i s'avisa (`dubtosos`). És el preu de no
 * perdre diners quan no se sap de qui és cada fitxer.
 * @param {string} text el text del fitxer, ja decodificat
 * @param {{ nom?: string }} [opcions] `nom`: el del fitxer; fa també de pista per a saber si és d'una targeta
 * @returns {Readonly<object>} la font, amb `format` (el que ha detectat el lector) i `targeta`
 */
export function fontDeCsv(text, { nom = '' } = {}) {
  const lectura = llegeixExtracteCsv(text, { pista: nom });
  const idDe = creaIds();
  const identitat = `csv:${hashFnv1a(`${textNormal(nom)}|${JSON.stringify(Object.entries(lectura.format?.columnes ?? {}).sort())}`)}`;
  const moviments = lectura.moviments.map((fila) => ({
    id: idDe({ compte: identitat, data: fila.dataOperacio, dataValor: fila.dataValor, centims: fila.centims, concepte: fila.concepte }),
    data: copiaData(fila.dataOperacio),
    dataValor: copiaData(fila.dataValor),
    concepte: fila.concepte,
    import: fila.centims,
    saldo: Number.isSafeInteger(fila.saldo) ? fila.saldo : null,
    moneda: fila.moneda ?? MONEDA_PER_DEFECTE,
    compte: null,
    origen: { posicio: fila.fila },
    detall: detallDeFila(fila)
  }));
  const font = creaFont({ tipus: 'csv', nom, moviments, avisos: lectura.avisos });
  return Object.freeze({ ...font, format: lectura.format, targeta: lectura.format?.targeta === true });
}

/**
 * Unix diverses llistes de moviments del port en una de sola. Ordenada per
 * data; el mateix dia, en l'ordre d'arribada.
 *
 * Un moviment repetit (el mateix id) només es lleva si se sap que és el
 * mateix: és d'un compte conegut (dos extractes del mateix compte que se
 * solapen) o ve de la mateixa font (el mateix fitxer triat dos colps).
 * Correcció 261011 (refutador, punt 2): entre fonts SENSE compte conegut no es
 * lleva mai res en silenci. Si dos moviments de dues fonts així coincidixen
 * en dia, import i concepte (dues targetes amb la mateixa subscripció, o el
 * mateix extracte baixat dues vegades amb un altre nom), es conserven tots dos
 * i `dubtosos` diu quants en són: qui ho consumix ha d'avisar.
 * @param {Array<object[]>} llistes
 * @returns {{ moviments: object[], repetits: number, dubtosos: number }}
 */
export function uneixMoviments(llistes) {
  const vistos = new Map();
  const perClau = new Map();
  const tots = [];
  let repetits = 0;
  for (const llista of Array.isArray(llistes) ? llistes : []) {
    for (const m of Array.isArray(llista) ? llista : []) {
      if (!m || typeof m.id !== 'string') continue;
      const primer = vistos.get(m.id);
      if (primer && (m.compte != null || (m.origen?.font != null && m.origen.font === primer.origen?.font))) {
        repetits += 1;
        continue;
      }
      if (!primer) vistos.set(m.id, m);
      tots.push(m);
      if (m.compte == null) {
        const clau = [iso(m.data), m.import, textNormal(m.concepte)].join('|');
        if (!perClau.has(clau)) perClau.set(clau, new Map());
        const perFont = perClau.get(clau);
        perFont.set(m.origen?.font ?? '', (perFont.get(m.origen?.font ?? '') ?? 0) + 1);
      }
    }
  }
  /* De cada grup d'iguals, els que sobren de la font que en té més: els que podrien ser el mateix moviment. */
  let dubtosos = 0;
  for (const perFont of perClau.values()) {
    if (perFont.size < 2) continue;
    const comptes = [...perFont.values()];
    dubtosos += comptes.reduce((total, n) => total + n, 0) - Math.max(...comptes);
  }
  const moviments = tots.map((m, i) => ({ m, i })).sort((x, y) => comparaDates(x.m.data, y.m.data) || x.i - y.i).map(({ m }) => m);
  return { moviments, repetits, dubtosos };
}

/**
 * Llig unes quantes fonts LOCALS i n'unix els moviments. Una font de xarxa
 * (local: false) no entra ací: qui la consumisca farà `await` de cada
 * llegixMoviments i cridarà uneixMoviments.
 * @param {object[]} fonts
 * @param {{ des?: object|null, fins?: object|null }} [rang]
 * @returns {{ moviments: object[], repetits: number, dubtosos: number, avisos: Array<object & { font: string }> }}
 * @throws {TypeError} si alguna font no és local
 */
export function llegixFonts(fonts, rang = {}) {
  const llista = (Array.isArray(fonts) ? fonts : []).filter(Boolean);
  const noLocal = llista.find((font) => font.local !== true);
  if (noLocal) throw new TypeError(`La font «${noLocal.nom || noLocal.id}» no és local: cal esperar-la amb await i unir-ne els moviments amb uneixMoviments.`);
  const { moviments, repetits, dubtosos } = uneixMoviments(llista.map((font) => font.llegixMoviments(rang)));
  const avisos = llista.flatMap((font) => font.avisos.map((a) => ({ ...a, font: font.nom || font.id })));
  return { moviments, repetits, dubtosos, avisos };
}

/**
 * El kit de conformitat del port: els errors d'una font local contra el
 * contracte ([] si el complix). Un adaptador nou ha de passar-lo abans
 * d'endollar-se.
 * @param {object} font
 * @returns {string[]}
 */
export function comprovaFont(font) {
  const errors = [];
  if (!font || typeof font !== 'object') return ['Una font és un objecte.'];
  if (font.esquema !== ESQUEMA_FONT_MOVIMENTS) errors.push(`esquema ha de ser «${ESQUEMA_FONT_MOVIMENTS}».`);
  for (const camp of ['id', 'tipus']) if (typeof font[camp] !== 'string' || font[camp] === '') errors.push(`${camp} ha de ser un text.`);
  if (typeof font.nom !== 'string') errors.push('nom ha de ser un text.');
  if (typeof font.local !== 'boolean') errors.push('local ha de dir si la font respon sense xarxa.');
  if (!Array.isArray(font.avisos)) errors.push('avisos ha de ser una llista.');
  if (typeof font.llegixMoviments !== 'function') return [...errors, 'llegixMoviments ha de ser una funció.'];
  if (font.local !== true) return errors;
  const tots = font.llegixMoviments();
  if (!Array.isArray(tots)) return [...errors, 'llegixMoviments ha de tornar una llista.'];
  tots.forEach((m, i) => {
    const on = `moviments[${i}]`;
    if (!m || typeof m !== 'object') {
      errors.push(`${on} ha de ser un objecte.`);
      return;
    }
    for (const camp of CAMPS_MOVIMENT) if (!(camp in m)) errors.push(`${on}: falta ${camp}.`);
    if (typeof m.id !== 'string' || m.id === '') errors.push(`${on}.id ha de ser un text.`);
    if (!esDataValida(m.data) || !esDataValida(m.dataValor)) errors.push(`${on}: data i dataValor han de ser dates { a, m, d }.`);
    if (typeof m.concepte !== 'string') errors.push(`${on}.concepte ha de ser un text.`);
    if (!Number.isSafeInteger(m.import)) errors.push(`${on}.import ha de ser en cèntims enters.`);
    if (m.saldo !== null && !Number.isSafeInteger(m.saldo)) errors.push(`${on}.saldo ha de ser en cèntims enters o null.`);
    if (typeof m.moneda !== 'string' || !/^[A-Z]{3}$/.test(m.moneda)) errors.push(`${on}.moneda ha de ser un codi ISO 4217.`);
    if (m.compte !== null && typeof m.compte !== 'string') errors.push(`${on}.compte ha de ser un text o null.`);
    if (m.origen?.font !== font.id) errors.push(`${on}.origen.font ha de ser l’id de la font.`);
  });
  if (new Set(tots.map((m) => m?.id)).size !== tots.length) errors.push('Dos moviments porten el mateix id.');
  if (tots.some((m, i) => i > 0 && comparaDates(tots[i - 1]?.data, m?.data) > 0)) errors.push('Els moviments han d’anar ordenats per data.');
  /* Estable: una segona lectura dona els mateixos id en el mateix ordre. */
  const segona = font.llegixMoviments();
  if (segona.length !== tots.length || segona.some((m, i) => m?.id !== tots[i]?.id)) errors.push('Dues lectures no donen els mateixos id.');
  /* El rang: tots dos extrems inclosos, i res de fora. */
  const dates = tots.map((m) => m?.data).filter(esDataValida);
  if (dates.length) {
    const [des, fins] = [dates[0], dates[dates.length - 1]];
    if (font.llegixMoviments({ des, fins }).length !== tots.length) errors.push('El rang no inclou els dos extrems.');
    const delPrimerDia = tots.filter((m) => comparaDates(m.data, des) === 0).length;
    if (font.llegixMoviments({ des, fins: des }).length !== delPrimerDia) errors.push('El rang d’un sol dia no torna els moviments d’eixe dia.');
    if (font.llegixMoviments({ fins: { a: des.a - 1, m: 12, d: 31 } }).length !== 0) errors.push('El rang torna moviments de fora.');
  }
  return errors;
}
