/**
 * c43.js — lectura de l'extracte bancari en Norma 43 (AEB/CSB 43).
 *
 * El fitxer és text de longitud fixa: registres de 80 caràcters, un per
 * línia, en ISO-8859-1. Les posicions que es lligen (base 1):
 *   11 capçalera de compte: entitat 3-6, oficina 7-10, compte 11-20, data
 *      inicial 21-26 i final 27-32 (aammdd), D/H 33 (1 deutor, 2 creditor),
 *      saldo inicial 34-47, divisa 48-50 (ISO 4217 numèric), modalitat 51 i
 *      nom 52-77.
 *   22 moviment: oficina d'origen 7-10, data d'operació 11-16, data valor
 *      17-22, concepte comú 23-24, concepte propi 25-27, D/H 28 (1 deure,
 *      2 haver), import 29-42, document 43-52, referència 1 53-64 i
 *      referència 2 65-80.
 *   23 concepte complementari: codi 3-4 (01-05) i dos camps de 38, 5-42 i 43-80.
 *   24 equivalència de divisa: divisa d'origen 5-7 i import 8-21.
 *   33 peu de compte: les claus de compte de l'11 (3-20), apunts al deure
 *      21-25, total deure 26-39, apunts a l'haver 40-44, total haver 45-58,
 *      D/H 59, saldo final 60-73 i divisa 74-76.
 *   88 fi de fitxer: nombre de registres 21-26, sense comptar el mateix 88.
 * Tots els imports porten dos decimals implícits i es tornen en cèntims
 * enters amb signe: el deure i el saldo deutor, negatius.
 *
 * Un fitxer mal format no llança mai: el que no quadra torna com a avís
 * { codi, severitat, missatge, linia? } i la lectura seguix. Es comproven la
 * llargària, l'ordre dels registres, els apunts i les sumes del 33 contra els
 * 22, l'equació del saldo, el recompte del 88 i la modalitat (els bancs
 * n'envien de fora de la 1-3 que documenta la norma: avís informatiu).
 *
 * Els rebuts SEPA porten al 2301 l'esquema (CORE o B2B) i el creditor, i al
 * 2302 l'identificador de creditor (amb el NIF dins) i el mandat: el moviment
 * en du un camp `sepa`. El número de compte no es guarda mai sencer: només
 * els 4 últims dígits. JS pur, sense DOM ni APIs de Node: es pot importar
 * des del navegador i des de Node.
 */
import { decodificaTextDetallat } from './csv.js';
import { dinsDeRang, esDataValida, rangTrimestre } from './dates.js';
import { formatImport } from './diners.js';
import { normalitzaNif } from './nif.js';

export const LLARGARIA_REGISTRE = 80;
/* Cada registre 23 porta dos camps de concepte d'esta llargària. */
export const LLARGARIA_CONCEPTE = 38;
const MODALITATS_DOCUMENTADES = new Set(['1', '2', '3']);
/* Avisos d'un mateix codi, un per un; a partir d'ací, un de sol amb el compte. */
const MAX_AVISOS_PER_CODI = 20;
const BOM = String.fromCharCode(0xfeff);
const TIPUS_REGISTRE = Object.freeze(['11', '22', '23', '24', '33', '88']);
/* Els registres que compta el de fi: tots menys ell mateix. */
const COMPTATS_PEL_FI = Object.freeze(['11', '22', '23', '24', '33']);
/* Identificador de creditor SEPA: país, dígits de control, sufix comercial de 3 i l'identificador nacional. */
const ID_CREDITOR = /^([A-Z]{2})(\d{2})([A-Z0-9]{3})([A-Z0-9]{1,28})$/;
const LLARGARIA_ID_CREDITOR = 35;
const ESQUEMA_SEPA = /^(CORE|B2B)/;

/* Els codis que pot tornar llegeixC43 als avisos. */
export const CODIS_AVIS_C43 = Object.freeze([
  'LINIA_BUIDA', 'SENSE_SALTS', 'LONGITUD', 'TIPUS_DESCONEGUT', 'ORDRE', 'CAMP_INVALID', 'MODALITAT',
  'COMPTE_DIFERENT', 'DIVISA_DIFERENT', 'RECOMPTE', 'SUMA', 'SALDO', 'SENSE_PEU', 'RECOMPTE_FI', 'SENSE_FI'
]);

/* ISO 4217: del codi numèric de la norma a l'alfabètic de les factures (les monedes més habituals). */
export const MONEDES_ISO = Object.freeze({
  '036': 'AUD', '124': 'CAD', '156': 'CNY', '203': 'CZK', '208': 'DKK', '348': 'HUF', '392': 'JPY', '484': 'MXN',
  '578': 'NOK', '752': 'SEK', '756': 'CHF', '826': 'GBP', '840': 'USD', '946': 'RON', '978': 'EUR', '985': 'PLN'
});

/** La moneda (codi alfabètic) d'un codi numèric ISO 4217, o null si no és de la llista. */
export const monedaDeCodi = (codi) => MONEDES_ISO[codi] ?? null;

const espaisNets = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
const ambSigne = (signe, valor) => (signe === null || valor === null ? null : valor === 0 ? 0 : signe * valor);

/* Recull d'avisos amb sostre per codi: un fitxer amb totes les línies curtes no en dona 800. */
function creaAvisos() {
  const llista = [];
  const comptes = new Map();
  const afig = (codi, severitat, missatge, linia) => {
    const n = (comptes.get(codi) ?? 0) + 1;
    comptes.set(codi, n);
    if (n <= MAX_AVISOS_PER_CODI) llista.push({ codi, severitat, missatge, ...(linia ? { linia } : {}) });
  };
  const tanca = () => {
    for (const [codi, n] of comptes) {
      if (n <= MAX_AVISOS_PER_CODI) continue;
      const { severitat } = llista.find((a) => a.codi === codi);
      llista.push({ codi, severitat, missatge: `I ${n - MAX_AVISOS_PER_CODI} avisos més del mateix tipus.` });
    }
    return llista;
  };
  return { afig, tanca };
}

/* Les línies del fitxer. Alguns bancs ho envien tot seguit, sense salts: es talla cada 80 caràcters. */
function registresDe(text, afig) {
  const net = text.startsWith(BOM) ? text.slice(1) : text;
  const linies = net.split(/\r\n|\n|\r/);
  if (linies.length > 0 && linies[linies.length - 1] === '') linies.pop();
  const [unica] = linies;
  if (linies.length === 1 && unica.length > LLARGARIA_REGISTRE && unica.length % LLARGARIA_REGISTRE === 0) {
    afig('SENSE_SALTS', 'info', `El fitxer no porta salts de línia: s’ha tallat cada ${LLARGARIA_REGISTRE} caràcters.`);
    return Array.from({ length: unica.length / LLARGARIA_REGISTRE }, (_, k) => unica.slice(k * LLARGARIA_REGISTRE, (k + 1) * LLARGARIA_REGISTRE));
  }
  return linies;
}

/* Lector de camps d'un registre per posicions de base 1. Un camp que no es pot llegir és null, amb avís. */
function lectorDe(registre, linia, afig) {
  const camp = (inici, fi) => registre.slice(inici - 1, fi);
  const invalid = (inici, fi, nom) => afig('CAMP_INVALID', 'alta', `${nom} (posicions ${inici}-${fi}) no es pot llegir.`, linia);
  return {
    linia,
    afig,
    camp,
    xifres(inici, fi, nom) {
      if (/^\d+$/.test(camp(inici, fi))) return Number(camp(inici, fi));
      invalid(inici, fi, nom);
      return null;
    },
    data(inici, nom) {
      const r = /^(\d{2})(\d{2})(\d{2})$/.exec(camp(inici, inici + 5));
      const d = r ? { a: 2000 + Number(r[1]), m: Number(r[2]), d: Number(r[3]) } : null;
      if (esDataValida(d)) return d;
      invalid(inici, inici + 5, nom);
      return null;
    },
    signe(posicio, nom) {
      const c = camp(posicio, posicio);
      if (c === '1') return -1;
      if (c === '2') return 1;
      invalid(posicio, posicio, nom);
      return null;
    }
  };
}

/* Els 76 caràcters d'un registre 23 (posicions 5-80), amb els dos camps tornats a ajuntar. */
const cosDe = (concepte) => `${concepte.camps[0].padEnd(LLARGARIA_CONCEPTE, ' ')}${concepte.camps[1]}`;

/* El rebut SEPA d'un moviment, si el 2301 en diu l'esquema i el 2302 porta un identificador de
   creditor. Els conceptes SEPA no seguixen els dos camps de 38: el 2301 és l'esquema (5-8) i el nom
   del creditor (9-78), i el 2302, l'identificador de creditor (5-39, 35 caràcters) i el mandat (40-80). */
function sepaDe(conceptes) {
  const primer = conceptes.find((c) => c.codi === '01');
  const segon = conceptes.find((c) => c.codi === '02');
  const esquema = primer ? ESQUEMA_SEPA.exec(primer.camps[0]) : null;
  const cos = segon ? cosDe(segon) : '';
  const idCreditor = cos.slice(0, LLARGARIA_ID_CREDITOR).trim();
  const id = ID_CREDITOR.exec(idCreditor);
  if (!esquema || !id) return null;
  return {
    esquema: esquema[1],
    creditor: espaisNets(cosDe(primer).slice(esquema[1].length)),
    idCreditor,
    cif: normalitzaNif(id[4]),
    mandat: cos.slice(LLARGARIA_ID_CREDITOR).trim()
  };
}

/* Tanca el compte obert que no ha arribat al seu peu (33). */
function senseConcloure(estat, on, l) {
  l.afig('SENSE_PEU', 'alta', `El compte acabat en ${estat.obert.compte.capcalera.compte4} no té peu (33) ${on}.`, l.linia);
  estat.obert = null;
  estat.darrer = null;
}

function llegeix11(estat, l) {
  if (estat.obert) senseConcloure(estat, 'abans de la capçalera següent', l);
  const codiDivisa = l.camp(48, 50);
  const modalitat = l.camp(51, 51);
  if (!MODALITATS_DOCUMENTADES.has(modalitat)) {
    l.afig('MODALITAT', 'info', `Modalitat «${modalitat}»: la norma només en documenta la 1, la 2 i la 3. Es llig igual.`, l.linia);
  }
  const capcalera = {
    entitat: l.camp(3, 6),
    oficina: l.camp(7, 10),
    compte4: l.camp(11, 20).trim().slice(-4),
    dataInicial: l.data(21, 'La data inicial'),
    dataFinal: l.data(27, 'La data final'),
    saldoInicial: ambSigne(l.signe(33, 'El signe del saldo inicial'), l.xifres(34, 47, 'El saldo inicial')),
    divisa: monedaDeCodi(codiDivisa),
    codiDivisa,
    modalitat,
    nom: l.camp(52, 77).trim()
  };
  const compte = { capcalera, moviments: [], peu: null };
  estat.comptes.push(compte);
  /* La clau sencera (entitat, oficina i compte) només viu ací, per a comprovar el 33: no ix mai. */
  estat.obert = { compte, clau: l.camp(3, 20), deure: 0, haver: 0, sumaDeure: 0, sumaHaver: 0, incomplet: false };
  estat.darrer = null;
}

function llegeix22(estat, l) {
  const { obert } = estat;
  if (!obert) {
    l.afig('ORDRE', 'alta', 'Moviment (22) sense capçalera de compte (11) davant: no s’ha llegit.', l.linia);
    estat.darrer = null;
    return;
  }
  const signe = l.signe(28, 'El signe del moviment');
  const valor = l.xifres(29, 42, 'L’import del moviment');
  const moviment = {
    linia: l.linia,
    oficina: l.camp(7, 10),
    dataOperacio: l.data(11, 'La data d’operació'),
    dataValor: l.data(17, 'La data valor'),
    conceptComu: l.camp(23, 24),
    conceptPropi: l.camp(25, 27),
    centims: ambSigne(signe, valor),
    document: l.camp(43, 52).trim(),
    ref1: l.camp(53, 64).trim(),
    ref2: l.camp(65, 80).trim(),
    conceptes: []
  };
  obert.compte.moviments.push(moviment);
  estat.darrer = moviment;
  if (signe === -1) obert.deure += 1;
  else if (signe === 1) obert.haver += 1;
  if (signe === null || valor === null) obert.incomplet = true;
  else if (signe === -1) obert.sumaDeure += valor;
  else obert.sumaHaver += valor;
}

function llegeix23(estat, l) {
  const { darrer } = estat;
  if (!darrer) {
    l.afig('ORDRE', 'alta', 'Concepte (23) sense moviment (22) davant: no s’ha llegit.', l.linia);
    return;
  }
  const codi = l.camp(3, 4);
  if (!/^0[1-5]$/.test(codi)) l.afig('CAMP_INVALID', 'baixa', `Codi de concepte «${codi}»: la norma en documenta del 01 al 05.`, l.linia);
  const anterior = darrer.conceptes[darrer.conceptes.length - 1];
  if (anterior && codi <= anterior.codi) l.afig('ORDRE', 'baixa', `El concepte ${codi} arriba després del ${anterior.codi}.`, l.linia);
  darrer.conceptes.push({ codi, camps: [l.camp(5, 42).trimEnd(), l.camp(43, 80).trimEnd()] });
  if (codi === '02') {
    const sepa = sepaDe(darrer.conceptes);
    if (sepa) darrer.sepa = sepa;
  }
}

/* L'import en divisa porta el signe del moviment. */
function llegeix24(estat, l) {
  const { darrer } = estat;
  if (!darrer) {
    l.afig('ORDRE', 'alta', 'Equivalència de divisa (24) sense moviment (22) davant: no s’ha llegit.', l.linia);
    return;
  }
  const codi = l.camp(5, 7);
  darrer.divisa = { codi, moneda: monedaDeCodi(codi), centims: ambSigne(darrer.centims < 0 ? -1 : 1, l.xifres(8, 21, 'L’import en divisa')) };
}

/* Les comprovacions del peu (33) contra la capçalera (11) i els moviments (22) del compte. */
function comprovaPeu(obert, peu, l) {
  const { compte, clau, deure, haver, sumaDeure, sumaHaver, incomplet } = obert;
  const { capcalera } = compte;
  const delCompte = `del compte acabat en ${capcalera.compte4}`;
  const avisa = (codi, severitat, missatge) => l.afig(codi, severitat, missatge, l.linia);
  if (l.camp(3, 20) !== clau) avisa('COMPTE_DIFERENT', 'alta', `El peu (33) no és ${delCompte}: les claus de compte no coincidixen.`);
  if (peu.codiDivisa !== capcalera.codiDivisa) {
    avisa('DIVISA_DIFERENT', 'mitjana', `La divisa del peu (${peu.codiDivisa}) no és la de la capçalera (${capcalera.codiDivisa}).`);
  }
  if (peu.apuntsDeure !== null && peu.apuntsDeure !== deure) {
    avisa('RECOMPTE', 'alta', `El peu ${delCompte} diu ${peu.apuntsDeure} apunts al deure i n’hi ha ${deure}.`);
  }
  if (peu.apuntsHaver !== null && peu.apuntsHaver !== haver) {
    avisa('RECOMPTE', 'alta', `El peu ${delCompte} diu ${peu.apuntsHaver} apunts a l’haver i n’hi ha ${haver}.`);
  }
  /* Amb algun import illegible, les sumes no són les de tots els moviments: no es comparen. */
  if (incomplet) return;
  if (peu.totalDeure !== null && peu.totalDeure !== sumaDeure) {
    avisa('SUMA', 'alta', `El total al deure del peu ${delCompte} (${formatImport(peu.totalDeure)}) no és la suma dels moviments (${formatImport(sumaDeure)}).`);
  }
  if (peu.totalHaver !== null && peu.totalHaver !== sumaHaver) {
    avisa('SUMA', 'alta', `El total a l’haver del peu ${delCompte} (${formatImport(peu.totalHaver)}) no és la suma dels moviments (${formatImport(sumaHaver)}).`);
  }
  if (capcalera.saldoInicial !== null && peu.saldoFinal !== null) {
    const calculat = capcalera.saldoInicial + sumaHaver - sumaDeure;
    if (calculat !== peu.saldoFinal) {
      avisa('SALDO', 'alta', `El saldo ${delCompte} no quadra: l’inicial més l’haver menys el deure dona ${formatImport(calculat)} i el peu diu ${formatImport(peu.saldoFinal)}.`);
    }
  }
}

function llegeix33(estat, l) {
  if (!estat.obert) {
    l.afig('ORDRE', 'alta', 'Peu de compte (33) sense capçalera (11) davant: no s’ha llegit.', l.linia);
    return;
  }
  const codiDivisa = l.camp(74, 76);
  const peu = {
    apuntsDeure: l.xifres(21, 25, 'Els apunts al deure'),
    totalDeure: l.xifres(26, 39, 'El total al deure'),
    apuntsHaver: l.xifres(40, 44, 'Els apunts a l’haver'),
    totalHaver: l.xifres(45, 58, 'El total a l’haver'),
    saldoFinal: ambSigne(l.signe(59, 'El signe del saldo final'), l.xifres(60, 73, 'El saldo final')),
    divisa: monedaDeCodi(codiDivisa),
    codiDivisa
  };
  estat.obert.compte.peu = peu;
  comprovaPeu(estat.obert, peu, l);
  estat.obert = null;
  estat.darrer = null;
}

function llegeix88(estat, l) {
  if (estat.obert) senseConcloure(estat, 'abans del final', l);
  const comptats = COMPTATS_PEL_FI.reduce((n, tipus) => n + estat.recompte[tipus], 0);
  const declarats = l.xifres(21, 26, 'El nombre de registres');
  if (!estat.fi) estat.fi = { registres: declarats };
  if (declarats !== null && declarats !== comptats) {
    l.afig('RECOMPTE_FI', 'mitjana', `El registre de fi diu ${declarats} registres i n’hi ha ${comptats} (sense comptar el 88).`, l.linia);
  }
}

const LECTORS = Object.freeze({ 11: llegeix11, 22: llegeix22, 23: llegeix23, 24: llegeix24, 33: llegeix33, 88: llegeix88 });

/**
 * Llig un extracte en Norma 43.
 * @param {Uint8Array|ArrayBuffer|string} entrada els bytes del fitxer (es
 *   decodifiquen amb decodificaTextDetallat) o el text ja decodificat
 * @returns {{
 *   comptes: Array<{ capcalera: { entitat: string, oficina: string, compte4: string, dataInicial: object|null,
 *     dataFinal: object|null, saldoInicial: number|null, divisa: string|null, codiDivisa: string, modalitat: string,
 *     nom: string }, moviments: object[], peu: object|null }>,
 *   fi: { registres: number|null }|null, registres: number, recompte: Record<string, number>,
 *   codificacio: string|null, avisos: Array<{ codi: string, severitat: string, missatge: string, linia?: number }>
 * }}
 *   Cada moviment: { linia, oficina, dataOperacio, dataValor, conceptComu, conceptPropi, centims, document, ref1,
 *   ref2, conceptes: [{ codi, camps: [text, text] }], sepa?: { esquema, creditor, idCreditor, cif, mandat },
 *   divisa?: { codi, moneda, centims } }. Les dates són { a, m, d } i els imports, cèntims amb signe.
 *   `registres` compta les línies amb registre; `recompte`, les de cada tipus.
 * @throws {TypeError} si l'entrada no és ni text ni bytes
 */
export function llegeixC43(entrada) {
  let text;
  let codificacio = null;
  if (typeof entrada === 'string') text = entrada;
  else ({ text, codificacio } = decodificaTextDetallat(entrada));
  const avisos = creaAvisos();
  const estat = {
    comptes: [], obert: null, darrer: null, fi: null,
    recompte: Object.fromEntries(TIPUS_REGISTRE.map((tipus) => [tipus, 0]))
  };
  let registres = 0;
  for (const [i, brut] of registresDe(text, avisos.afig).entries()) {
    const linia = i + 1;
    if (brut.trim() === '') {
      avisos.afig('LINIA_BUIDA', 'baixa', 'Línia buida: no és cap registre.', linia);
      continue;
    }
    registres += 1;
    if (brut.length !== LLARGARIA_REGISTRE) {
      avisos.afig('LONGITUD', 'mitjana', `El registre fa ${brut.length} caràcters i n’ha de fer ${LLARGARIA_REGISTRE}.`, linia);
    }
    const registre = brut.padEnd(LLARGARIA_REGISTRE, ' ');
    const tipus = registre.slice(0, 2);
    if (!TIPUS_REGISTRE.includes(tipus)) {
      avisos.afig('TIPUS_DESCONEGUT', 'mitjana', `Tipus de registre «${tipus}» desconegut: no s’ha llegit.`, linia);
      continue;
    }
    if (estat.fi) avisos.afig('ORDRE', 'alta', 'Hi ha registres després del de fi de fitxer (88).', linia);
    estat.recompte[tipus] += 1;
    LECTORS[tipus](estat, lectorDe(registre, linia, avisos.afig));
  }
  if (estat.obert) senseConcloure(estat, 'al final del fitxer', { afig: avisos.afig, linia: null });
  if (!estat.fi) avisos.afig('SENSE_FI', 'mitjana', 'El fitxer no acaba amb el registre de fi (88): pot estar tallat.');
  return { comptes: estat.comptes, fi: estat.fi, registres, recompte: estat.recompte, codificacio, avisos: avisos.tanca() };
}

/**
 * El text dels conceptes (23) d'un moviment tal com el va escriure el banc:
 * els camps de 38 es tornen a ajuntar (una paraula pot passar d'un camp al
 * següent) i els espais repetits queden en un.
 * @param {{ conceptes?: Array<{ camps: string[] }> }} moviment
 * @returns {string}
 */
export function textDelsConceptes(moviment) {
  const camps = (moviment?.conceptes ?? []).flatMap((c) => c?.camps ?? []);
  return espaisNets(camps.map((camp) => String(camp ?? '').padEnd(LLARGARIA_CONCEPTE, ' ')).join(''));
}

/** Tots els moviments d'una lectura, compte per compte i en l'ordre del fitxer. */
export const totsElsMoviments = (lectura) => (lectura?.comptes ?? []).flatMap((c) => c.moviments);

/**
 * Els moviments amb la data d'operació dins d'un trimestre natural.
 * @param {object[]} moviments
 * @param {number} any
 * @param {number} t trimestre (1-4)
 * @returns {object[]} [] si el trimestre no és vàlid
 */
export function filtraTrimestre(moviments, any, t) {
  const rang = rangTrimestre(any, t);
  if (!rang) return [];
  return (moviments ?? []).filter((m) => dinsDeRang(m?.dataOperacio, rang));
}
