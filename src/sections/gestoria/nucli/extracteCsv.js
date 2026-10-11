/**
 * extracteCsv.js — lector tolerant d'extractes en CSV: el compte del banc i
 * la targeta de crèdit, vinguen com vinguen.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6: «categoritzar targetes de
 * crèdit» i una Gestoria «enxufable»). movimentsBanc.js llig UN format (el CSV
 * que ix de convertir el full de moviments del banc: capçalera fixa, dates ISO
 * i punt decimal) i no es toca: és font dels tractors signats. Este lector és
 * a part i llig els altres: el que descarrega cada banc i cada targeta.
 *
 * QUÈ DETECTA, i ho diu a `format` perquè es puga explicar:
 *   · El separador (punt i coma, tabulador o coma): el que dona més files amb
 *     una data i un import llegibles. Comptar caràcters no val: un CSV de punt
 *     i coma amb coma decimal té més comes que punts i coma.
 *   · La capçalera, encara que hi haja línies de preàmbul davant (el nom del
 *     compte, el període): la primera fila amb una columna de data i una
 *     d'import, pels noms en valencià, castellà i anglés (COLUMNES).
 *   · Sense capçalera, les columnes pel contingut: la de dates, la d'imports,
 *     la de saldo (la que quadra amb el saldo anterior més l'import) i la de
 *     text més llarg. Ho avisa (COLUMNES_INFERIDES): cal mirar-ho.
 *   · El separador decimal, per tota la columna i no cel·la a cel·la: si la
 *     columna porta «12,50», un «1.234» són mil dos-cents trenta-quatre euros;
 *     si porta «12.50», un «1.234» no es pot llegir sense dubte i queda sense
 *     import, amb avís (IMPORT_AMBIGU). Mai un import endevinat.
 *   · El signe. Amb columnes separades de càrrec i abonament, l'abonament
 *     suma i el càrrec resta. Amb saldo, mana l'aritmètica del saldo. Sense
 *     saldo, un extracte de targeta que escriu les compres en positiu es gira
 *     (SIGNE_INVERTIT): a tot arreu de la Gestoria una eixida és negativa i
 *     una devolució, positiva.
 *   · Les dates amb parseData (dd/mm/aa, dd/mm/aaaa, ISO, amb mes escrit),
 *     sempre el dia abans que el mes.
 *   · La moneda: una columna de moneda o un codi o símbol a l'import. Un
 *     moviment que no és en euros porta `moneda` i ho avisa (ALTRA_MONEDA).
 *
 * El número de targeta emmascarat que alguns bancs escriuen al concepte es
 * lleva: no fa falta per a res. Res del que rep es modifica i res es desa.
 * JS pur: sense DOM ni APIs de Node.
 */
import { detectaDelimitador, parseCsv } from './csv.js';
import { esDataValida, parseData } from './dates.js';
import { parseImport } from './diners.js';
import { comercDelConcepte } from './movimentsBanc.js';

/** Els codis que pot tornar llegeixExtracteCsv als avisos. */
export const CODIS_AVIS_EXTRACTE = Object.freeze([
  'CSV_BUIT', 'SENSE_COLUMNES', 'COLUMNES_INFERIDES', 'DATES_MES_DIA', 'FILA_INVALIDA', 'FILES_IGNORADES', 'IMPORT_AMBIGU',
  'SIGNE_INVERTIT', 'SIGNE_DUBTOS', 'ALTRA_MONEDA'
]);
/** Com s'ha decidit el signe dels imports. */
export const MOTIUS_SIGNE = Object.freeze(['COLUMNES_SEPARADES', 'SALDO', 'TARGETA', 'PER_DEFECTE']);
/* Correcció 261011 (refutador, punt 3): sense saldo ni cap senyal de targeta, si quasi tots els imports són
   positius el signe és dubtós (una targeta que escriu les compres en positiu?): s'avisa i no es dona per bo. */
const PART_SIGNE_DUBTOS = 0.8;
/** La moneda dels imports mentre no es diga una altra cosa. */
export const MONEDA_EXTRACTE = 'EUR';

/* En cas d'empat, el punt i coma (el dels bancs d'ací) passa davant de la coma. */
const DELIMITADORS = Object.freeze([';', '\t', ',']);
const NOM_DELIMITADOR = Object.freeze({ ';': 'punt i coma', '\t': 'tabulador', ',': 'coma' });
/* Files que es miren per a triar el separador, la capçalera i les columnes. */
const MOSTRA = 40;
const MAX_PREAMBUL = 30;
/* Sense capçalera: la part de les cel·les d'una columna que ha de ser una data (o un import). */
const LLINDAR_COLUMNA = 0.8;

/* Noms de columna (sense accents i només lletres) → camp del moviment. */
const COLUMNES = new Map(Object.entries({
  data: ['fecha', 'data', 'fechaoperacion', 'fechadeoperacion', 'fechadelaoperacion', 'dataoperacio', 'datadoperacio', 'foperacion',
    'fechaoper', 'fechamovimiento', 'datamoviment', 'fechacompra', 'datacompra', 'fechatransaccion', 'date', 'transactiondate',
    'bookingdate', 'dia'],
  dataValor: ['fvalor', 'fechavalor', 'fechadevalor', 'datavalor', 'valuedate'],
  concepte: ['concepto', 'concepte', 'descripcion', 'descripcio', 'detalle', 'detall', 'movimiento', 'moviment', 'description',
    'observaciones', 'observacions', 'comercio', 'comerc', 'establecimiento', 'establiment', 'merchant'],
  import: ['importe', 'import', 'cantidad', 'quantitat', 'amount', 'importeeur', 'importeeuros', 'importeur', 'importeneuros',
    'importeoperacion'],
  carrec: ['cargo', 'cargos', 'carrec', 'carrecs', 'debe', 'deure', 'debit', 'pagos', 'gastos'],
  abonament: ['abono', 'abonos', 'abonament', 'abonaments', 'haber', 'haver', 'credit', 'ingresos', 'ingressos'],
  saldo: ['saldo', 'balance', 'saldoeur'],
  moneda: ['moneda', 'divisa', 'currency']
}).flatMap(([camp, noms]) => noms.map((nom) => [nom, camp])));
/* Els noms de la columna de concepte que diuen que és el comerç d'una targeta. */
const COLUMNES_DE_COMERC = new Set(['comercio', 'comerc', 'establecimiento', 'establiment', 'merchant']);
/* Paraules del preàmbul o de la capçalera que diuen que l'extracte és d'una targeta. */
const DIU_TARGETA = /TARJETA|TARGETA|CREDIT CARD|MASTERCARD|\bVISA\b/;
/* El número de targeta emmascarat, amb les formes que escriuen els bancs: «432112******9876», «****9876»,
   «XXXX-XXXX-XXXX-1234» i «4532 **** **** 1234» (el principi també identifica el banc: se'n va sencer). */
const GRUP_OCULT = '(?:[*•]{4}|[xX]{4})';
const NUMERO_TARGETA = new RegExp([
  '\\d{4,6}[*xX•]{2,}[\\s-]?\\d{2,4}',
  `\\d{4}(?:[\\s-]?${GRUP_OCULT}){2,3}[\\s-]?\\d{2,4}`,
  `${GRUP_OCULT}(?:[\\s-]?${GRUP_OCULT}){1,3}[\\s-]?\\d{2,4}`,
  '[*•]{4,}[\\s-]?\\d{2,4}',
  '[xX]{6,}[\\s-]?\\d{2,4}'
].join('|'), 'g');
/* Un número de targeta sencer: de 13 a 19 xifres, amb espais o guions o sense. Només es tapa si passa Luhn. */
const NUMERO_LLARG = /(?:\d[ -]?){12,18}\d/g;
/* Un compte en format IBAN: dues lletres, dos dígits de control i de 10 a 30 caràcters més, en grups o seguits. */
const COMPTE_IBAN = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g;
/* Perquè una frase en majúscules no es prenga per un compte: quinze caràcters o més, i quasi tot xifres. */
const esCompte = (junt) => junt.length >= 15 && junt.replace(/\D/g, '').length >= junt.length * 0.6;
const TAPAT = '****';
/* Una data escrita amb xifres: tres números amb el mateix separador. */
const DATA_NUMERICA = /^(\d{1,2})([-/.])(\d{1,2})\2(?:\d{2}|\d{4})(?:\s|$)/;
/* La primera paraula d'una fila de peu: un total o un saldo, no un moviment. */
const PEU = /^(?:total|totals|totales|suma|saldofinal|saldoinicial|saldoanterior)/;
const SIMBOLS_MONEDA = Object.freeze({ $: 'USD', '£': 'GBP', '¥': 'JPY' });
const CODI_MONEDA = /(?:^|[^A-Za-z])([A-Z]{3})(?![A-Za-z])/;
/* Un sol separador amb tres xifres darrere i fins a tres davant: «1.234», «-12,345». */
const TRES_XIFRES = /^[-+−(]?\s*[1-9]\d{0,2}([.,])\d{3}\)?$/;
/* El signe escrit darrere de l'import, com fan alguns bancs: «12,50-». */
const SIGNE_DARRERE = /^(.*\d)\s*([-−])$/;

const senseAccents = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '');
const clauColumna = (nom) => senseAccents(nom).toLowerCase().replace(/[^a-z]/g, '');
const avis = (codi, severitat, missatge, extra = {}) => ({ codi, severitat, missatge, ...extra });
const esBuida = (fila) => fila.every((cel) => cel.trim() === '');
const plural = (n, una, moltes) => (n === 1 ? una : `${n} ${moltes}`);

/* L'import d'una cel·la i la moneda que hi diu, sense mirar encara el separador decimal de la columna. */
function importCru(text) {
  let net = String(text ?? '').trim();
  if (net === '') return { buit: true };
  let moneda = null;
  for (const [simbol, codi] of Object.entries(SIMBOLS_MONEDA)) {
    if (net.includes(simbol)) {
      moneda = codi;
      net = net.split(simbol).join('').trim();
    }
  }
  const codi = CODI_MONEDA.exec(net);
  if (codi) {
    if (codi[1] !== MONEDA_EXTRACTE) moneda = codi[1];
    net = net.replace(codi[1], '').trim();
  }
  /* L'euro escrit se'n va ací: amb «12,50 €» la columna ha de saber igualment que el decimal és la coma. */
  net = net.split('€').join('').trim();
  const darrere = SIGNE_DARRERE.exec(net);
  if (darrere) net = `-${darrere[1]}`;
  return { buit: false, net, moneda };
}

/* Cert si una cel·la és un import que es pot llegir (amb qualsevol decimal). */
const esImport = (text) => {
  const cru = importCru(text);
  return !cru.buit && parseImport(cru.net) !== null;
};
const esData = (text) => esDataValida(parseData(String(text ?? '').trim()));

/* El separador que dona més files amb una data i un import. Cap fila així: el de sempre (detectaDelimitador). */
function triaDelimitador(text) {
  let millor = null;
  for (const delimitador of DELIMITADORS) {
    const files = parseCsv(text, { delimitador });
    const bones = files.filter((fila) => !esBuida(fila)).slice(0, MOSTRA + MAX_PREAMBUL)
      .filter((fila) => fila.length > 1 && fila.some(esData) && fila.some((cel) => !esData(cel) && esImport(cel))).length;
    if (!millor || bones > millor.bones) millor = { delimitador, files, bones };
  }
  if (millor.bones > 0) return millor;
  const delimitador = detectaDelimitador(text);
  return { delimitador, files: parseCsv(text, { delimitador }), bones: 0 };
}

/* Les columnes que diu una fila de capçalera: { camp: índex }; el primer nom de cada camp mana. */
function columnesDe(fila) {
  const columnes = {};
  fila.forEach((nom, k) => {
    const camp = COLUMNES.get(clauColumna(nom));
    if (camp && !(camp in columnes)) columnes[camp] = k;
  });
  return columnes;
}

const teDataIImport = (columnes) => 'data' in columnes && ('import' in columnes || 'carrec' in columnes || 'abonament' in columnes);

/* Sense capçalera: les columnes pel contingut de les primeres files. null si no hi ha ni dates ni imports. */
function infereixColumnes(files) {
  const mostra = files.filter((fila) => !esBuida(fila)).slice(0, MOSTRA);
  if (!mostra.length) return null;
  const amplada = Math.max(...mostra.map((fila) => fila.length));
  const part = (k, prova) => mostra.filter((fila) => prova(fila[k] ?? '')).length / mostra.length;
  const deDates = [];
  const deImports = [];
  for (let k = 0; k < amplada; k += 1) {
    if (part(k, esData) >= LLINDAR_COLUMNA) deDates.push(k);
    else if (part(k, esImport) >= LLINDAR_COLUMNA) deImports.push(k);
  }
  if (!deDates.length || !deImports.length) return null;
  const columnes = { data: deDates[0] };
  if (deDates.length > 1) columnes.dataValor = deDates[1];
  /* Amb dues columnes d'imports, el saldo és la que quadra amb el saldo anterior més (o menys) l'altra. */
  const valor = (fila, k) => {
    const cru = importCru(fila[k] ?? '');
    return cru.buit ? null : parseImport(cru.net);
  };
  let [importK, saldoK] = [deImports[0], null];
  for (const [x, y] of deImports.length > 1 ? [[deImports[0], deImports[1]], [deImports[1], deImports[0]]] : []) {
    let quadren = 0;
    for (let i = 1; i < mostra.length; i += 1) {
      const [abans, ara] = [valor(mostra[i - 1], y), valor(mostra[i], y)];
      if (!Number.isSafeInteger(abans) || !Number.isSafeInteger(ara)) continue;
      /* El salt de saldo és l'import d'esta fila (el més antic primer) o el de l'anterior (el més nou primer). */
      const salt = Math.abs(ara - abans);
      const moguts = [valor(mostra[i], x), valor(mostra[i - 1], x)].filter(Number.isSafeInteger);
      if (moguts.some((mogut) => Math.abs(mogut) === salt)) quadren += 1;
    }
    if (quadren > 0 && quadren >= (mostra.length - 1) / 2) {
      [importK, saldoK] = [x, y];
      break;
    }
  }
  columnes.import = importK;
  if (saldoK !== null) columnes.saldo = saldoK;
  /* El concepte: la columna de text més llarg que no és cap de les altres. */
  const ocupades = new Set([...deDates, ...deImports]);
  let millor = { k: null, llargaria: 0 };
  for (let k = 0; k < amplada; k += 1) {
    if (ocupades.has(k)) continue;
    const llargaria = mostra.reduce((total, fila) => total + String(fila[k] ?? '').trim().length, 0);
    if (llargaria > millor.llargaria) millor = { k, llargaria };
  }
  if (millor.k !== null) columnes.concepte = millor.k;
  return columnes;
}

/* El separador decimal de les columnes d'imports: el que porta una o dues xifres darrere més vegades. */
function decimalDe(files, indexs) {
  let coma = 0;
  let punt = 0;
  for (const fila of files) {
    for (const k of indexs) {
      const cru = importCru(fila[k] ?? '');
      if (cru.buit) continue;
      if (/,\d{1,2}\)?$/.test(cru.net)) coma += 1;
      else if (/\.\d{1,2}\)?$/.test(cru.net)) punt += 1;
    }
  }
  if (coma === punt) return null;
  return coma > punt ? ',' : '.';
}

/* L'import d'una cel·la amb el decimal de la columna: { centims, moneda, ambigu }. */
function importDe(text, decimal) {
  const cru = importCru(text);
  if (cru.buit) return { centims: null, moneda: null, ambigu: false, buit: true };
  const tres = TRES_XIFRES.exec(cru.net);
  /* «1.234» amb el punt de decimal (o sense saber quin és el decimal): mil euros o un euro amb tres decimals? */
  if (tres && (decimal === tres[1] || (decimal === null && tres[1] === '.'))) {
    return { centims: null, moneda: cru.moneda, ambigu: true, buit: false };
  }
  return { centims: parseImport(cru.net), moneda: cru.moneda, ambigu: false, buit: false };
}

/* La comprovació de Luhn d'unes xifres: la que complixen els números de targeta. */
function passaLuhn(xifres) {
  let total = 0;
  for (let i = 0; i < xifres.length; i += 1) {
    let n = Number(xifres[xifres.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    total += n;
  }
  return total % 10 === 0;
}

/* El concepte en una línia, sense números de targeta ni de compte: l'emmascarat se'n va, i d'un número de
   targeta sencer (si passa Luhn) o d'un IBAN només en queden les quatre últimes xifres. */
function concepteNet(text) {
  return String(text ?? '')
    .replace(NUMERO_TARGETA, ' ')
    .replace(COMPTE_IBAN, (tot) => {
      const junt = tot.replace(/ /g, '');
      return esCompte(junt) ? `${TAPAT}${junt.slice(-4)}` : tot;
    })
    .replace(NUMERO_LLARG, (tot) => {
      const xifres = tot.replace(/[ -]/g, '');
      return passaLuhn(xifres) ? `${TAPAT}${xifres.slice(-4)}` : tot;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/* Quantes parelles de files seguides quadren amb cada signe: el saldo d'una és el de l'anterior més (o menys)
   l'import, llegint el fitxer cap avall (més antic primer) o cap amunt (més nou primer). */
function signePelSaldo(files) {
  let igual = 0;
  let girat = 0;
  for (let i = 1; i < files.length; i += 1) {
    const [x, y] = [files[i - 1], files[i]];
    if (![x.saldo, y.saldo, x.cru, y.cru].every(Number.isSafeInteger) || (x.cru === 0 && y.cru === 0)) continue;
    const avall = y.saldo - x.saldo;
    const amunt = x.saldo - y.saldo;
    if (avall === y.cru || amunt === x.cru) igual += 1;
    else if (avall === -y.cru || amunt === -x.cru) girat += 1;
  }
  return { igual, girat };
}

/**
 * Llig un extracte en CSV (vegeu la capçalera).
 * @param {string} text el text del fitxer, ja decodificat (csv.js, decodificaText)
 * @param {{ pista?: string }} [opcions] `pista`: el nom del fitxer; si diu «tarjeta», «targeta» o «visa», l'extracte
 *   és d'una targeta encara que dins no ho diga
 * @returns {{ moviments: Array<{ fila: number, dataOperacio: object, dataValor: object, concepte: string,
 *   centims: number, saldo: number|null, comerc?: string, moneda?: string }>, avisos: object[],
 *   format: { delimitador: string, decimal: ','|'.'|null, capcalera: number|null, columnes: Record<string, number>,
 *   signe: 'compte'|'girat'|'columnes', motiuSigne: string, signeDubtos: boolean, targeta: boolean }|null }}
 *   `fila` és la fila del CSV (la primera és la 1). Només torna els moviments amb data i import; la resta, als avisos.
 *   Amb `signeDubtos`, els imports NO s'han de donar per bons fins que la persona confirme el signe. Si les dates
 *   pareixen escrites amb el mes davant (DATES_MES_DIA), no torna cap moviment: no gira res a cegues.
 */
export function llegeixExtracteCsv(text, { pista = '' } = {}) {
  const font = typeof text === 'string' ? text : '';
  const { delimitador, files } = triaDelimitador(font);
  const primera = files.findIndex((fila) => !esBuida(fila));
  if (primera < 0) return { moviments: [], avisos: [avis('CSV_BUIT', 'alta', 'El CSV no té cap fila.')], format: null };

  const avisos = [];
  let capcalera = null;
  let columnes = null;
  for (let k = primera; k < files.length && k < primera + MAX_PREAMBUL; k += 1) {
    const candidates = columnesDe(files[k]);
    if (teDataIImport(candidates)) {
      capcalera = k;
      columnes = candidates;
      break;
    }
  }
  if (!columnes) {
    columnes = infereixColumnes(files.slice(primera));
    if (!columnes) {
      return {
        moviments: [],
        avisos: [avis('SENSE_COLUMNES', 'alta', 'No s’hi ha trobat cap columna de data ni d’import: no és un extracte de moviments.')],
        format: null
      };
    }
    avisos.push(avis('COLUMNES_INFERIDES', 'mitjana',
      'El CSV no porta capçalera: les columnes de data, import i concepte s’han deduït del contingut. Comprova-ho amb l’extracte.'));
  }

  const cos = files.slice(capcalera === null ? primera : capcalera + 1);
  const primeraDelCos = (capcalera === null ? primera : capcalera + 1) + 1;
  const deImports = ['import', 'carrec', 'abonament', 'saldo'].filter((camp) => camp in columnes).map((camp) => columnes[camp]);
  const decimal = decimalDe(cos, deImports);
  const separades = 'carrec' in columnes || 'abonament' in columnes;
  const preambul = files.slice(primera, capcalera === null ? primera : capcalera + 1).flat().join(' ');
  const nomConcepte = capcalera !== null && 'concepte' in columnes ? clauColumna(files[capcalera][columnes.concepte]) : '';
  const targeta = COLUMNES_DE_COMERC.has(nomConcepte) || DIU_TARGETA.test(senseAccents(`${preambul} ${String(pista ?? '').replace(/[_.-]+/g, ' ')}`).toUpperCase());

  /* Correcció 261011 (refutador, punt 10): parseData llig sempre el dia abans que el mes. Si alguna data només
     existix amb el mes davant («07/25/2099»), el fitxer és d'eixa mena i les de dia fins a 12 es llegirien
     girades sense que ningú ho veja: no es llig cap moviment. */
  const mesDavant = cos.filter((fila) => {
    const r = 'data' in columnes ? DATA_NUMERICA.exec(String(fila[columnes.data] ?? '').trim()) : null;
    return r !== null && Number(r[1]) <= 12 && Number(r[3]) > 12 && Number(r[3]) <= 31;
  }).length;
  if (mesDavant > 0) {
    return {
      moviments: [],
      avisos: [...avisos, avis('DATES_MES_DIA', 'alta',
        `${plural(mesDavant, 'Una data només existix', 'dates només existixen')} amb el mes davant del dia (mm/dd): l’extracte pareix escrit així, i ací es llig sempre el dia primer. No s’ha llegit cap moviment per a no girar dates a cegues: torna a baixar l’extracte amb les dates dd/mm.`)],
      format: { delimitador: NOM_DELIMITADOR[delimitador] ?? delimitador, decimal, capcalera: capcalera === null ? null : capcalera + 1, columnes, signe: 'compte', motiuSigne: 'PER_DEFECTE', signeDubtos: false, targeta }
    };
  }

  /* Primera passada: cada fila amb el que s'hi ha pogut llegir, encara sense decidir el signe. */
  const llegides = [];
  let ignorades = 0;
  cos.forEach((fila, i) => {
    if (esBuida(fila)) return;
    const n = primeraDelCos + i;
    const cel = (camp) => (camp in columnes ? String(fila[columnes[camp]] ?? '') : '');
    const data = parseData(cel('data').trim());
    const dataValor = 'dataValor' in columnes ? parseData(cel('dataValor').trim()) : null;
    const lectures = Object.fromEntries(['import', 'carrec', 'abonament', 'saldo'].map((camp) => [camp, importDe(cel(camp), decimal)]));
    for (const camp of ['import', 'carrec', 'abonament', 'saldo']) {
      if (lectures[camp].ambigu) {
        avisos.push(avis('IMPORT_AMBIGU', 'mitjana',
          `Fila ${n}: «${cel(camp).trim()}» pot ser un import amb punt de milers o amb tres decimals, i no es pot llegir sense dubte.`, { fila: n }));
      }
    }
    let cru;
    if (separades) {
      const [carrec, abonament] = [lectures.carrec.centims, lectures.abonament.centims];
      cru = carrec === null && abonament === null ? null : (abonament ?? 0) - Math.abs(carrec ?? 0);
      /* Una sola columna d'import al costat d'una de càrrec o d'abonament: la que falta. */
      if (cru === null && Number.isSafeInteger(lectures.import.centims)) cru = lectures.import.centims;
    } else {
      cru = lectures.import.centims;
    }
    const teData = esDataValida(data);
    if (!teData && (cru === null || fila.some((c) => PEU.test(clauColumna(c))))) {
      /* Ni data ni import, o un total sense data: un peu o una línia de text. No és un moviment. */
      ignorades += 1;
      return;
    }
    if (!teData || cru === null) {
      const ambigu = ['import', 'carrec', 'abonament'].some((camp) => lectures[camp].ambigu);
      if (!ambigu) avisos.push(avis('FILA_INVALIDA', 'mitjana', `Fila ${n}: falta la data o l’import; no s’ha llegit com a moviment.`, { fila: n }));
      return;
    }
    const delaMoneda = cel('moneda').trim().toUpperCase();
    const moneda = /^[A-Z]{3}$/.test(delaMoneda) ? delaMoneda
      : (lectures.import.moneda ?? lectures.carrec.moneda ?? lectures.abonament.moneda ?? MONEDA_EXTRACTE);
    llegides.push({ fila: n, data, dataValor: esDataValida(dataValor) ? dataValor : data, text: cel('concepte'), cru, saldo: lectures.saldo.centims, moneda });
  });
  if (ignorades > 0) {
    avisos.push(avis('FILES_IGNORADES', 'info',
      `${plural(ignorades, 'Una fila no té', 'files no tenen')} ni data ni import (peus, totals o text) i no s’han llegit.`));
  }

  /* El signe: columnes separades, el que es demana, l'aritmètica del saldo, la targeta o res. */
  let gira = false;
  let motiuSigne = 'PER_DEFECTE';
  if (separades) motiuSigne = 'COLUMNES_SEPARADES';
  else {
    const { igual, girat } = signePelSaldo(llegides);
    if (igual > 0 || girat > 0) {
      gira = girat > igual;
      motiuSigne = 'SALDO';
    } else if (targeta && llegides.filter((m) => m.cru > 0).length > llegides.filter((m) => m.cru < 0).length) {
      gira = true;
      motiuSigne = 'TARGETA';
    }
  }
  if (gira) {
    avisos.push(avis('SIGNE_INVERTIT', 'info', motiuSigne === 'SALDO'
      ? 'L’extracte escriu les eixides en positiu (ho diu el saldo): s’han girat, i ací una eixida és negativa.'
      : 'L’extracte de la targeta escriu les compres en positiu: s’han girat, i ací una compra és negativa i una devolució, positiva.'));
  }
  /* Res ha dit el signe (ni saldo, ni columnes, ni targeta) i quasi tot és positiu: pot ser una targeta que
     escriu les compres en positiu. No es gira a cegues, però tampoc es dona per bo. */
  const ambImport = llegides.filter((m) => m.cru !== 0);
  const signeDubtos = motiuSigne === 'PER_DEFECTE' && ambImport.length > 0
    && ambImport.filter((m) => m.cru > 0).length >= ambImport.length * PART_SIGNE_DUBTOS;
  if (signeDubtos) {
    avisos.push(avis('SIGNE_DUBTOS', 'mitjana',
      'Quasi tots els imports són positius i l’extracte no porta saldo ni diu que és d’una targeta: no se sap si són entrades de veres o compres escrites en positiu. No s’han girat, i no s’han de donar per ingressos fins que ho confirmes amb l’extracte.'));
  }

  const moviments = llegides.map((m) => {
    const comercDelBanc = comercDelConcepte(m.text);
    const concepte = concepteNet(m.text);
    const moviment = { fila: m.fila, dataOperacio: m.data, dataValor: m.dataValor, concepte, centims: gira && m.cru !== 0 ? -m.cru : m.cru, saldo: m.saldo };
    const comerc = comercDelBanc ?? (targeta ? concepte : '');
    if (comerc) moviment.comerc = comerc;
    if (m.moneda !== MONEDA_EXTRACTE) moviment.moneda = m.moneda;
    return moviment;
  });
  const altres = moviments.filter((m) => m.moneda).length;
  if (altres > 0) {
    avisos.push(avis('ALTRA_MONEDA', 'mitjana',
      `${plural(altres, 'Un moviment no és', 'moviments no són')} en euros: porten la seua moneda i no s’han de sumar amb la resta.`));
  }

  return {
    moviments,
    avisos,
    format: {
      delimitador: NOM_DELIMITADOR[delimitador] ?? delimitador,
      decimal,
      capcalera: capcalera === null ? null : capcalera + 1,
      columnes,
      signe: separades ? 'columnes' : gira ? 'girat' : 'compte',
      motiuSigne,
      signeDubtos,
      targeta
    }
  };
}
