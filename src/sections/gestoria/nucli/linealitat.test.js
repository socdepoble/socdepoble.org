// @vitest-environment node
/* Onada R30 · A6 (auditoria de les micro-apps Genealogia i Gestoria) · Set
   lectures de la Gestoria tenien temps QUADRÀTIC: una tira llarga de blancs,
   de xifres, d'asteriscs o d'equis (o una cadena oberta d'un PDF) es tornava a
   recórrer des de cada caràcter o des de cada objecte. Un CSV del banc, un
   concepte o un PDF de factura amb una cel·la o un mot de desenes de milers de
   caràcters penjava la pestanya segons o minuts, al fil principal (A6-RX1 a
   A6-RX8):
     · RX1 dates.js, l'hora del final de parseData (40.000 espais: de 2 a 9 s);
     · RX2 diners.js, la moneda del final i el filtre de xifres de parseImport;
     · RX3 extracteCsv.js, el número de targeta emmascarat del concepte;
     · RX4 despeses/nucli/categories.js, els patrons de dues paraules;
     · RX5 concilia.js, les fitxes del text (citaNumero);
     · RX6 pdfText.js, el número d'un mot, la cerca d'objectes «N G obj» i el
       primer «endobj» de cada objecte;
     · RX7 pdfText.js, mirar endavant «N G R» llegint sencera una cadena oberta;
     · RX8 pdfText.js, mirar endavant «N G R» saltant els comentaris de darrere
       del G, amb «N G obj» escrits dins.
   Ara són lineals, sense mirar arrere (la Gestoria es queda dins del Baseline,
   qualitat.test.js), i decidixen EXACTAMENT el mateix: cada funció del mòdul
   (parseData, parseImport, el concepte de llegeixExtracteCsv, els patrons del
   catàleg, citaNumero i la primera passada del lector de PDF) es confronta amb
   la seua versió d'abans, copiada ací sencera com a oracle, en milers de
   textos aleatoris deterministes. Els textos són sintètics: cap dada de cap
   persona. */
import { describe, expect, test } from 'vitest';
import { esDataValida, parseData } from './dates.js';
import { parseImport } from './diners.js';
import { llegeixExtracteCsv } from './extracteCsv.js';
import { citaNumero } from './concilia.js';
import { _intern, extreuTextPdf } from './pdfText.js';
import { PROVEIDORS, classificaMoviment } from '../despeses/nucli/categories.js';

/* El temps màxim d'una entrada adversària (abans, d'1 a 65 s cadascuna). */
const SOSTRE_MS = 500;
const N = 40000;
/* Blancs que no són l'espai: cap caràcter invisible literal al codi font. */
const BLANCS_ESTRANYS = [0xa0, 0x2009, 0x202f, 0x2028, 0xfeff].map((codi) => String.fromCharCode(codi));

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

/* `quantitat` textos aleatoris d'1 a `llargaria` trossos. */
function textos(trossos, quantitat, llargaria, llavor) {
  const atzar = generador(llavor);
  const tots = [];
  for (let k = 0; k < quantitat; k += 1) {
    let text = '';
    for (let i = 1 + atzar(llargaria); i > 0; i -= 1) text += trossos[atzar(trossos.length)];
    tots.push(text);
  }
  return tots;
}

function enTemps(funcio) {
  const inici = performance.now();
  funcio();
  return performance.now() - inici;
}

/* ---------- RX1 · L'oracle: parseData tal com era abans de l'Onada R30 ---------- */
const MESOS_ABANS = (() => {
  const noms = [
    ['gener', 'enero', 'january', 'gen', 'ene', 'jan'], ['febrer', 'febrero', 'february', 'febr', 'feb'], ['març', 'marzo', 'march', 'mar'],
    ['abril', 'abril', 'april', 'abr', 'apr'], ['maig', 'mayo', 'may'], ['juny', 'junio', 'june', 'jun'], ['juliol', 'julio', 'july', 'jul'],
    ['agost', 'agosto', 'august', 'ag', 'ago', 'aug'], ['setembre', 'septiembre', 'september', 'set', 'sep', 'sept', 'setiembre'],
    ['octubre', 'octubre', 'october', 'oct'], ['novembre', 'noviembre', 'november', 'nov'], ['desembre', 'diciembre', 'december', 'des', 'dic', 'dec']
  ];
  const mapa = new Map();
  noms.forEach((formes, i) => formes.forEach((nom) => mapa.set(nom.normalize('NFD').replace(/[̀-ͯ]/g, ''), i + 1)));
  return mapa;
})();
const BUIDES_ABANS = new Set(['de', 'del', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge', 'dl', 'dt', 'dc',
  'dj', 'dv', 'ds', 'dg', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'sunday', 'mon', 'tue', 'tues', 'wed', 'thu', 'thur', 'thurs', 'fri', 'sat', 'sun']);
function parseDataAbans(text) {
  if (esDataValida(text)) return { a: text.a, m: text.m, d: text.d };
  if (typeof text !== 'string') return null;
  const crea = (a, m, d) => (esDataValida({ a, m, d }) ? { a, m, d } : null);
  const anyDe = (t) => (t.length === 2 ? 2000 + Number(t) : Number(t));
  const s = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\S\n\r\t ]/g, ' ').trim()
    .replace(/(?:t|\s+)\d{1,2}:\d{2}(?::\d{2}(?:[.,]\d+)?)?\s*(?:z|[-+]\d{2}:?\d{2}|h)?$/, '').trim();
  if (s === '') return null;
  let r = /^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})$/.exec(s);
  if (r) return crea(Number(r[1]), Number(r[3]), Number(r[4]));
  r = /^(\d{1,2})([-/.])(\d{1,2})\2(\d{2}|\d{4})$/.exec(s);
  if (r) return crea(anyDe(r[4]), Number(r[3]), Number(r[1]));
  const fitxes = s.replace(/\bd['’]/g, ' ').replace(/(\d)(?:st|nd|rd|th)\b/g, '$1').replace(/[,.]/g, ' ').split(/[\s/-]+/)
    .filter((fitxa) => fitxa !== '' && !BUIDES_ABANS.has(fitxa));
  if (fitxes.length !== 3) return null;
  const tipus = fitxes.map((fitxa) => (/^\d+$/.test(fitxa) ? 'n' : MESOS_ABANS.has(fitxa) ? 'm' : null));
  if (tipus.includes(null)) return null;
  const [x, y, z] = fitxes;
  const forma = tipus.join('');
  const esDia = (t) => t.length <= 2;
  const esAny = (t) => t.length === 2 || t.length === 4;
  if (forma === 'nmn' && esDia(x) && esAny(z)) return crea(anyDe(z), MESOS_ABANS.get(y), Number(x));
  if (forma === 'nmn' && x.length === 4 && esDia(z)) return crea(Number(x), MESOS_ABANS.get(y), Number(z));
  if (forma === 'mnn' && esDia(y) && esAny(z)) return crea(anyDe(z), MESOS_ABANS.get(x), Number(y));
  return null;
}

describe('A6-RX1 · dates.js: l’hora del final de parseData', () => {
  test(`tires de ${N} blancs: menys de ${SOSTRE_MS} ms i el mateix resultat`, () => {
    const ms = enTemps(() => {
      expect(parseData(`1${' '.repeat(N)}1`)).toBeNull();
      expect(parseData(`15 jul 2026${'\t'.repeat(N)}x`)).toBeNull();
      expect(parseData(`30/04/2026${' '.repeat(N)}10:22`)).toEqual({ a: 2026, m: 4, d: 30 });
    });
    expect(ms).toBeLessThan(SOSTRE_MS);
  });

  test('llig les mateixes dates que el parseData d’abans en milers de textos', () => {
    /* Trossos sencers (dates, blancs, hores) i solts, perquè molts textos siguen dates de veres. */
    const trossos = ['30/04/2026', '2026-04-30', '1/2/26', '31/02/2026', '15 jul 2026', 'Jul 15th, 2026', '15 de juliol de 2026',
      "15 d'abril del 2026", 'dilluns 3 març 2025', '10:22', '9:05h', '10:22:33,5', '+02:00', 'z', 'T10:00', ' ', ' ', ' ', '  ', '\t', '\n',
      ...BLANCS_ESTRANYS, '1', '12', ':', '/', '-', '.', ',', 'de', 'x'];
    const valors = textos(trossos, 40000, 5, 20261116);
    const diferents = valors.filter((s) => JSON.stringify(parseData(s)) !== JSON.stringify(parseDataAbans(s)));
    expect(diferents).toEqual([]);
    expect(valors.filter((s) => parseData(s) !== null).length).toBeGreaterThan(2000);
  });

  test('les dates amb hora de les proves de sempre', () => {
    expect(parseData('2026-04-30T10:00:00Z')).toEqual({ a: 2026, m: 4, d: 30 });
    expect(parseData('30/04/2026 10:22')).toEqual({ a: 2026, m: 4, d: 30 });
    expect(parseData('30/04/2026   10:22:33,5 +02:00')).toEqual({ a: 2026, m: 4, d: 30 });
    expect(parseData('15 de juliol de 2026 9:05h')).toEqual({ a: 2026, m: 7, d: 15 });
    expect(parseData(`15${BLANCS_ESTRANYS[0]}d’abril${BLANCS_ESTRANYS[2]}del 2026`)).toEqual({ a: 2026, m: 4, d: 15 });
  });
});

/* ---------- RX2 · L'oracle: parseImport tal com era abans de l'Onada R30 ---------- */
const MILERS_ABANS = { '.': /^\d{1,3}(?:\.\d{3})+$/, ',': /^\d{1,3}(?:,\d{3})+$/ };
const SIGNE_ABANS = /^([-+−])\s*/;
function separaPartsAbans(s) {
  const punt = s.lastIndexOf('.');
  const coma = s.lastIndexOf(',');
  if (punt >= 0 && coma >= 0) {
    const dec = punt > coma ? '.' : ',';
    const mil = dec === '.' ? ',' : '.';
    const i = s.lastIndexOf(dec);
    if (s.indexOf(dec) !== i) return null;
    const enter = s.slice(0, i);
    if (!MILERS_ABANS[mil].test(enter)) return null;
    return { enter: enter.split(mil).join(''), decimals: s.slice(i + 1), ambSeparador: true };
  }
  if (punt < 0 && coma < 0) return { enter: s, decimals: '', ambSeparador: false };
  const sep = punt >= 0 ? '.' : ',';
  const parts = s.split(sep);
  if (parts.length > 2) return MILERS_ABANS[sep].test(s) ? { enter: parts.join(''), decimals: '', ambSeparador: false } : null;
  if (parts[1].length === 3 && /^[1-9]\d{0,2}$/.test(parts[0])) return { enter: parts.join(''), decimals: '', ambSeparador: false };
  return { enter: parts[0], decimals: parts[1], ambSeparador: true };
}
function parseImportAbans(text) {
  if (typeof text !== 'string') return null;
  let s = text.replace(/[^\S\n\r\t ]/g, ' ').trim();
  let negatiu = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    negatiu = true;
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/\s*(?:€|eur)$/i, '');
  let signe = SIGNE_ABANS.exec(s);
  if (signe) s = s.slice(signe[0].length);
  s = s.replace(/^(?:€|eur)\s*/i, '');
  if (!signe) {
    signe = SIGNE_ABANS.exec(s);
    if (signe) s = s.slice(signe[0].length);
  }
  if (signe && signe[1] !== '+') negatiu = true;
  if (s.includes(' ')) {
    if (!/^\d{1,3}(?: \d{3})+(?:[.,]\d+)?$/.test(s)) return null;
    s = s.split(' ').join('');
  }
  if (!/^[\d.,]*\d[\d.,]*$/.test(s)) return null;
  const parts = separaPartsAbans(s);
  if (!parts) return null;
  const { enter, decimals, ambSeparador } = parts;
  if (!/^\d*$/.test(enter) || !/^\d*$/.test(decimals)) return null;
  if (ambSeparador && decimals === '') return null;
  if (enter.replace(/^0+/, '').length > 15) return null;
  let cents = Number(enter || '0') * 100 + Number(`${decimals}00`.slice(0, 2));
  if (decimals.length > 2 && decimals[2] >= '5') cents += 1;
  if (!Number.isSafeInteger(cents)) return null;
  return negatiu && cents !== 0 ? -cents : cents;
}

describe('A6-RX2 · diners.js: la moneda del final i el filtre de xifres de parseImport', () => {
  test(`tires de ${N} blancs, xifres o punts: menys de ${SOSTRE_MS} ms i el mateix resultat`, () => {
    const ms = enTemps(() => {
      expect(parseImport(`1${' '.repeat(N)}1`)).toBeNull();
      expect(parseImport(`${'1'.repeat(N)}x`)).toBeNull();
      expect(parseImport(`${'1.'.repeat(N / 2)}x`)).toBeNull();
      expect(parseImport(`12,50${' '.repeat(N)}€`)).toBe(1250);
    });
    expect(ms).toBeLessThan(SOSTRE_MS);
  });

  test('llig els mateixos imports que el parseImport d’abans en milers de textos', () => {
    /* Xifres i grups sencers (perquè molts textos siguen imports de veres), monedes, signes i blancs. */
    const trossos = ['1', '23', '456', '0', '1.234', '12,50', ',5', '.', ',', ' ', '  ', '\t', '\n', ...BLANCS_ESTRANYS, '€', 'eur', 'EUR',
      'Eu', 'r', '-', '+', '−', '(', ')', 'x'];
    const valors = textos(trossos, 40000, 6, 20261117);
    const diferents = valors.filter((s) => parseImport(s) !== parseImportAbans(s));
    expect(diferents).toEqual([]);
    const llegits = valors.filter((s) => parseImportAbans(s) !== null);
    expect(llegits.length).toBeGreaterThan(4000);
    /* Que la moneda del final i els blancs de davant s'hi han provat de veres. */
    expect(llegits.filter((s) => /\s(?:€|eur)$/i.test(s)).length).toBeGreaterThan(100);
  });

  test('els imports de les proves de sempre', () => {
    expect(parseImport('1.234,56 €')).toBe(123456);
    expect(parseImport('-12,00 EUR')).toBe(-1200);
    expect(parseImport('(12,00 €)')).toBe(-1200);
    expect(parseImport('.5')).toBe(50);
    expect(parseImport('12 eur')).toBe(1200);
    expect(parseImport('12€eur')).toBeNull();
    expect(parseImport('1,2,3x')).toBeNull();
    expect(parseImport('...')).toBeNull();
  });
});

/* ---------- RX3 · L'oracle: el concepte net tal com era abans de l'Onada R30 ---------- */
const GRUP_OCULT = '(?:[*•]{4}|[xX]{4})';
const TARGETA_ABANS = new RegExp([
  '\\d{4,6}[*xX•]{2,}[\\s-]?\\d{2,4}',
  `\\d{4}(?:[\\s-]?${GRUP_OCULT}){2,3}[\\s-]?\\d{2,4}`,
  `${GRUP_OCULT}(?:[\\s-]?${GRUP_OCULT}){1,3}[\\s-]?\\d{2,4}`,
  '[*•]{4,}[\\s-]?\\d{2,4}',
  '[xX]{6,}[\\s-]?\\d{2,4}'
].join('|'), 'g');
function passaLuhnAbans(xifres) {
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
const concepteNetAbans = (text) => String(text ?? '')
  .replace(TARGETA_ABANS, ' ')
  .replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g, (tot) => {
    const junt = tot.replace(/ /g, '');
    return junt.length >= 15 && junt.replace(/\D/g, '').length >= junt.length * 0.6 ? `****${junt.slice(-4)}` : tot;
  })
  .replace(/(?:\d[ -]?){12,18}\d/g, (tot) => {
    const xifres = tot.replace(/[ -]/g, '');
    return passaLuhnAbans(xifres) ? `****${xifres.slice(-4)}` : tot;
  })
  .replace(/\s+/g, ' ')
  .trim();

describe('A6-RX3 · extracteCsv.js: el número de targeta emmascarat del concepte', () => {
  const concepteDe = (text) => llegeixExtracteCsv(`Fecha;Concepto;Importe\n01/02/2026;"${text}";-12,50\n`).moviments[0]?.concepte;

  test(`un concepte de ${N} asteriscs, equis o blancs: menys de ${SOSTRE_MS * 2} ms`, () => {
    const ms = enTemps(() => {
      expect(concepteDe(`BAR ${'*'.repeat(N)}`)).toBe(`BAR ${'*'.repeat(N)}`);
      expect(concepteDe(`BAR ${'x'.repeat(N)}`)).toBe(`BAR ${'x'.repeat(N)}`);
      expect(concepteDe(`BAR${' '.repeat(N)}FORN`)).toBe('BAR FORN');
    });
    expect(ms).toBeLessThan(SOSTRE_MS * 2);
  });

  test('deixa el mateix concepte que la lectura d’abans en milers de conceptes', () => {
    /* Amb lletres, blancs i guions entre mig: les posicions que ara se salten d'una vegada. */
    const trossos = ['*', '**', '****', '•', 'x', 'X', 'xxxx', 'XX', '1', '12', '1234', '4111', ' ', '-', 'ES', 'a', 'B', 'COMPRA ', '\t'];
    const valors = textos(trossos, 15000, 14, 20261118);
    const diferents = valors.filter((s) => concepteDe(s) !== concepteNetAbans(s));
    expect(diferents).toEqual([]);
    expect(valors.filter((s) => concepteNetAbans(s) !== s.replace(/\s+/g, ' ').trim()).length).toBeGreaterThan(1000);
  });

  test('les formes dels bancs es continuen tapant', () => {
    expect(concepteDe('COMPRA 432112******9876 FORN')).toBe('COMPRA FORN');
    expect(concepteDe('COMPRA ****9876 FORN')).toBe('COMPRA FORN');
    expect(concepteDe('COMPRA XXXX-XXXX-XXXX-1234 FORN')).toBe('COMPRA FORN');
    expect(concepteDe('COMPRA 4532 **** **** 1234 FORN')).toBe('COMPRA FORN');
    expect(concepteDe('COMPRA XXXXXX1234 FORN')).toBe('COMPRA FORN');
    expect(concepteDe('BAR *****-****-12 FORN')).toBe('BAR * FORN');
  });
});

describe('A6-RX4 · categories.js: els patrons de dues paraules en qualsevol ordre', () => {
  const ABANS = {
    'github-copilot': /(?=.*\bGITHUB\b)(?=.*\bCOPILOT\b)/,
    'google-workspace': /(?=.*\bGOOGLE\b)(?=.*\bWORKSPACE\b)/
  };

  test(`un concepte de ${N} caràcters: menys de ${SOSTRE_MS * 2} ms`, () => {
    const ms = enTemps(() => {
      expect(classificaMoviment({ text: 'X'.repeat(N), centims: -100 }).motiu).toBe('EIXIDA_SENSE_PATRO');
      expect(classificaMoviment({ text: `GITHUB ${'A '.repeat(N / 2)}COPILOT`, centims: -100 }).proveidor).toBe('github-copilot');
    });
    expect(ms).toBeLessThan(SOSTRE_MS * 2);
  });

  test('els patrons del catàleg casen els mateixos textos que els d’abans, també amb salts de línia', () => {
    const trossos = ['GITHUB', 'COPILOT', 'GOOGLE', 'WORKSPACE', ' ', 'X', '_', '\n', '\r', String.fromCharCode(0x2028), '-', '1'];
    const valors = textos(trossos, 30000, 10, 20261119);
    for (const [clau, abans] of Object.entries(ABANS)) {
      const [ara] = PROVEIDORS.find((p) => p.clau === clau).patrons;
      expect([clau, ara.source.startsWith('^'), ara.flags]).toEqual([clau, true, 'm']);
      expect([clau, valors.filter((s) => ara.test(s) !== abans.test(s))]).toEqual([clau, []]);
    }
  });
});

/* ---------- RX5 · L'oracle: citaNumero tal com era abans de l'Onada R30 ---------- */
const senseAccentsAbans = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '');
const nomesXifresAbans = (fitxa) => /^\d+$/.test(fitxa);
function citaNumeroAbans(text, num) {
  const clau = senseAccentsAbans(num).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).join('');
  if (clau.length < (/^\d+$/.test(clau) ? 6 : 4)) return false;
  const fitxes = [];
  const enganxades = [];
  for (const [, separador, fitxa] of senseAccentsAbans(text).toUpperCase().matchAll(/([^A-Z0-9]*)([A-Z0-9]+)/g)) {
    enganxades.push(fitxes.length > 0 && !/\s/.test(separador));
    fitxes.push(fitxa);
  }
  const comencaEnXifra = /^\d/.test(clau);
  const acabaEnXifra = /\d$/.test(clau);
  for (let i = 0; i < fitxes.length; i += 1) {
    if (comencaEnXifra && enganxades[i] && nomesXifresAbans(fitxes[i - 1])) continue;
    let acumulat = '';
    for (let j = i; j < fitxes.length; j += 1) {
      acumulat += fitxes[j];
      if (acumulat === clau) {
        if (!(acabaEnXifra && enganxades[j + 1] && nomesXifresAbans(fitxes[j + 1]))) return true;
        break;
      }
      if (!clau.startsWith(acumulat)) break;
    }
  }
  return false;
}

describe('A6-RX5 · concilia.js: les fitxes del text de citaNumero', () => {
  test(`una cua de ${N} signes: menys de ${SOSTRE_MS} ms i el mateix resultat`, () => {
    const ms = enTemps(() => {
      expect(citaNumero(`FRA F-2026-0042 ${'*'.repeat(N)}`, 'F-2026-0042')).toBe(true);
      expect(citaNumero(`${'('.repeat(N)}`, 'F-2026-0042')).toBe(false);
    });
    expect(ms).toBeLessThan(SOSTRE_MS);
  });

  test('cita els mateixos números que el citaNumero d’abans en milers de textos', () => {
    const numeros = ['F-2026-0042', 'Q27 0815', '2099-07-15', 'A1B2', '123456', 'AB/12', 'ES-7'];
    /* Els números sencers (perquè se'n citen molts), els seus trossos, xifres enganxades i signes. */
    const trossos = [...numeros, ...numeros, 'F', '2026', '0042', 'Q27', '0815', '2099', '07', '15', 'A1', 'B2', 'B7', '123', '456', 'AB', '12',
      'ES', '7', 'é', 'ß', ' ', ' ', ' ', '  ', '-', '/', '.', '*', '(', 'a'];
    const valors = textos(trossos, 30000, 10, 20261120);
    const diferents = [];
    let citats = 0;
    for (const s of valors) {
      for (const num of numeros) {
        const abans = citaNumeroAbans(s, num);
        if (abans) citats += 1;
        if (citaNumero(s, num) !== abans) diferents.push([s, num]);
      }
    }
    expect(diferents).toEqual([]);
    expect(citats).toBeGreaterThan(2500);
  });
});

describe('A6-RX6 a A6-RX8 · pdfText.js: el número d’un mot, la cerca d’objectes i la primera passada', () => {
  const { NUMERO, ATURADES, MAX_PROFUNDITAT, MAX_NUM_OBJECTE, Flux, Lexer, LectorPdf, objecteDes } = _intern;
  const NUMERO_ABANS = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
  /* La cerca d'abans: el primer «N G obj» des de `des`, amb l'expressió global. */
  const objecteAbans = (s, des) => {
    const re = /(\d+)\s+(\d+)\s+obj\b/g;
    re.lastIndex = des;
    const m = re.exec(s);
    return m ? { num: Number(m[1]), pos: m.index, fi: re.lastIndex } : null;
  };

  /* ---------- L'oracle: la primera passada tal com era abans de l'Onada R30 (valor i el bucle) ---------- */
  class Ref {
    constructor(num, gen) {
      this.num = num;
      this.gen = gen;
    }
  }
  class Cadena {
    constructor(b) {
      this.b = b;
    }
  }
  function valorAbans(lx, tok, refs, profunditat = 0) {
    if (!tok) return null;
    switch (tok.t) {
      case 'num': {
        if (refs && Number.isInteger(tok.v) && tok.v >= 0) {
          const desa = lx.p;
          const gen = lx.seguent();
          if (gen?.t === 'num' && Number.isInteger(gen.v)) {
            const r = lx.seguent();
            if (r?.t === 'kw' && r.v === 'R') return new Ref(tok.v, gen.v);
          }
          lx.p = desa;
        }
        return tok.v;
      }
      case 'cad':
        return new Cadena(tok.v);
      case 'nom':
        return tok.v;
      case '[': {
        const llista = [];
        if (profunditat > MAX_PROFUNDITAT) return llista;
        for (;;) {
          const abans = lx.p;
          const t = lx.seguent();
          if (!t || t.t === ']') break;
          if (t.t === 'kw' && ATURADES.has(t.v)) {
            lx.p = abans;
            break;
          }
          llista.push(valorAbans(lx, t, refs, profunditat + 1));
        }
        return llista;
      }
      case '<<': {
        const dict = new Map();
        if (profunditat > MAX_PROFUNDITAT) return dict;
        for (;;) {
          const abans = lx.p;
          const clau = lx.seguent();
          if (!clau || clau.t === '>>') break;
          if (clau.t === 'kw' && ATURADES.has(clau.v)) {
            lx.p = abans;
            break;
          }
          if (clau.t !== 'nom') continue;
          const abansValor = lx.p;
          const t = lx.seguent();
          if (!t || t.t === '>>') break;
          if (t.t === 'kw' && ATURADES.has(t.v)) {
            lx.p = abansValor;
            break;
          }
          dict.set(clau.v, valorAbans(lx, t, refs, profunditat + 1));
        }
        return dict;
      }
      case 'kw':
        return tok.v === 'true' ? true : tok.v === 'false' ? false : null;
      default:
        return null;
    }
  }
  function primeraPassadaAbans(lector) {
    const { s } = lector;
    const reObj = /(\d+)\s+(\d+)\s+obj\b/g;
    let m;
    while ((m = reObj.exec(s)) !== null) {
      const num = Number(m[1]);
      const pos = m.index;
      const endobj = s.indexOf('endobj', reObj.lastIndex);
      const lx = new Lexer(s, reObj.lastIndex, endobj < 0 ? s.length : endobj);
      let v = valorAbans(lx, lx.seguent(), true);
      lx.saltaBlancs();
      let seguent = Math.max(lx.p, reObj.lastIndex);
      if (s.startsWith('stream', lx.p)) {
        v = lector.flux(v instanceof Map ? v : new Map(), lx.p + 6, pos);
        seguent = v.seguent;
      }
      if (num <= MAX_NUM_OBJECTE) lector.objectes.set(num, { pos, valor: v });
      if (v instanceof Flux && v.dict.get('Type') === 'XRef') lector.trailers.push({ pos, dict: v.dict });
      reObj.lastIndex = seguent;
    }
    const reTrailer = /trailer\s*<</g;
    while ((m = reTrailer.exec(s)) !== null) {
      const lx = new Lexer(s, m.index + 7);
      const d = valorAbans(lx, lx.seguent(), true);
      if (d instanceof Map) lector.trailers.push({ pos: m.index, dict: d });
      reTrailer.lastIndex = Math.max(lx.p, reTrailer.lastIndex);
    }
    lector.trailers.sort((a, b) => a.pos - b.pos);
  }
  /* Tot el que deixa una primera passada (objectes, valors, fluxos i tràilers), com a text comparable. */
  const forma = (v) => {
    if (v instanceof Map) return ['Map', [...v].map(([k, x]) => [k, forma(x)])];
    if (v instanceof Flux) return ['Flux', forma(v.dict), v.inici, v.pos, v.fi, v.fiCercat, v.seguent];
    if (Array.isArray(v)) return ['Array', v.map(forma)];
    if (v !== null && typeof v === 'object') return [v.constructor.name, JSON.stringify(v)];
    return [typeof v, v];
  };
  const passada = (bytes, recorre) => {
    const lector = new LectorPdf(bytes, null, () => {});
    try {
      recorre(lector);
    } catch (e) {
      return `error: ${e?.message}`;
    }
    return JSON.stringify([[...lector.objectes].map(([num, o]) => [num, o.pos, forma(o.valor)]), lector.trailers.map((t) => [t.pos, forma(t.dict)])]);
  };

  const pdf = (cos) => new TextEncoder().encode(`%PDF-1.4\n${cos}\n%%EOF`);
  const pdfAmbContingut = (contingut) => {
    const objectes = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      `<< /Length ${contingut.length} >>\nstream\n${contingut}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ];
    const cos = objectes.map((o, i) => `${i + 1} 0 obj\n${o}\nendobj`).join('\n');
    return pdf(`${cos}\ntrailer\n<< /Root 1 0 R /Size 6 >>`);
  };
  const extreuEnTemps = async (bytes) => {
    const inici = performance.now();
    const resultat = await extreuTextPdf(bytes);
    return { ms: performance.now() - inici, resultat };
  };

  test('una tira de 200.000 xifres i un mot de 40.000 xifres: menys d’1 s cada PDF', async () => {
    const xifres = await extreuEnTemps(pdf('1'.repeat(200000)));
    expect(xifres.ms).toBeLessThan(SOSTRE_MS * 2);
    expect(xifres.resultat.text).toBe('');
    const mot = await extreuEnTemps(pdfAmbContingut(`BT /F1 12 Tf 10 700 Td ${'1'.repeat(N)}x (Hola poble) Tj ET`));
    expect(mot.ms).toBeLessThan(SOSTRE_MS * 2);
    expect(mot.resultat.text).toBe('Hola poble');
  });

  test('80.000 objectes sense «endobj», o amb un de sol al final: menys d’1 s cada PDF', async () => {
    for (const cos of ['1 0 obj e '.repeat(80000), `${'1 0 obj e '.repeat(80000)}endobj`]) {
      const { ms, resultat } = await extreuEnTemps(pdf(cos));
      expect([cos.length, ms < SOSTRE_MS * 2]).toEqual([cos.length, true]);
      expect(resultat.text).toBe('');
    }
  });

  test('20.000 objectes amb un número i una cadena oberta darrere: menys d’1 s cada PDF', async () => {
    for (const tros of ['1 0 obj 5 (', '1 0 obj 5 <', '1 0 obj 5 6 (', '1 0 obj 5 ) (', '1 0 obj 5 > (']) {
      const { ms, resultat } = await extreuEnTemps(pdf(tros.repeat(20000)));
      expect([tros, ms < SOSTRE_MS * 2]).toEqual([tros, true]);
      expect(resultat.text).toBe('');
    }
  });

  /* Onada R30 · A6-RX8 · Darrere del G de «N G R» hi ha comentaris amb «N G obj» escrits dins: mirar
     endavant els salta, es desfà, i cada objecte de dins els tornava a saltar fins a la fi de la línia o
     del tram (sense la memòria de Lexer.saltaBlancs, «1 0 obj 5 6 %» × 20.000 tarda uns 16 s). */
  test('20.000 objectes dins de comentaris darrere d’un «N G»: menys d’1 s cada PDF', async () => {
    for (const tros of ['1 0 obj 5 6 %', '1 0 obj 5 ) %', '1 0 obj 5 6 ) %', '1 0 obj 5 6 \n%', '1 0 obj 5 6 %\n%']) {
      const { ms, resultat } = await extreuEnTemps(pdf(tros.repeat(20000)));
      expect([tros, ms < SOSTRE_MS * 2]).toEqual([tros, true]);
      expect(resultat.text).toBe('');
    }
  });

  test('NUMERO accepta els mateixos mots que l’expressió d’abans', () => {
    const valors = textos(['1', '23', '.', '+', '-', 'x', 'e', '0'], 40000, 9, 20261121);
    expect(valors.filter((s) => NUMERO.test(s) !== NUMERO_ABANS.test(s))).toEqual([]);
    expect(valors.filter((s) => NUMERO_ABANS.test(s)).length).toBeGreaterThan(2000);
  });

  test('objecteDes troba el mateix «N G obj» que l’expressió d’abans des de qualsevol posició, també a mitjan número', () => {
    const trossos = ['1 0 obj', '12 0 obj', '7 0 objx', '1', '12', '0', ' ', ' ', '\n', '\t', 'obj', 'endobj', 'R', '<<', '>>', 'a'];
    const valors = textos(trossos, 8000, 10, 20261122);
    const diferents = [];
    let trobats = 0;
    for (const s of valors) {
      for (let des = 0; des <= s.length + 1; des += 1) {
        const [abans, ara] = [objecteAbans(s, des), objecteDes(s, des)];
        if (abans) trobats += 1;
        if (JSON.stringify(abans) !== JSON.stringify(ara)) diferents.push([s, des]);
      }
    }
    expect(diferents).toEqual([]);
    expect(trobats).toBeGreaterThan(5000);
  });

  test('la primera passada deixa els mateixos objectes, valors, fluxos i tràilers que la d’abans', () => {
    const trossos = ['1 0 obj', '1 0 obj', '1 0 obj', '2 0 obj', '12 0 obj', '4 5 obj', '7 0 objx', '99999999999 0 obj', 'obj', 'endobj', ' ', ' ', '\n', '\r', '\t',
      '\f', '\0', '1', '12', '0', ' 5 6 R', ' 5 6 R', ' 1 0 R', 'R', 'x', '%c\n', '%', '<<', '>>', '>', '<', '<a1>', '(x)', '(', ')', '\\', '[', ']', '{',
      '/Length 5', '/Type /XRef', '/A', '<< /Length 3 >> stream\n', 'stream\n', 'stream\n', 'stream\r\n', 'endstream', 'trailer <<', 'trailer<< /Size 3 >>', '-1.5', '.5', '+3.',
      ' 5 (', ' 5 6 (', ' 5 <', 'true'];
    const valors = textos(trossos, 20000, 25, 20261123);
    const diferents = [];
    let ambObjectes = 0;
    let refs = 0;
    let fluxos = 0;
    for (const s of valors) {
      const bytes = new TextEncoder().encode(s);
      const [abans, ara] = [passada(bytes, primeraPassadaAbans), passada(bytes, (lector) => lector.primeraPassada())];
      if (abans.startsWith('[[[')) ambObjectes += 1;
      refs += abans.split('"Ref"').length - 1;
      fluxos += abans.split('"Flux"').length - 1;
      if (abans !== ara) diferents.push(s);
    }
    expect(diferents).toEqual([]);
    expect([ambObjectes > 5000, refs > 300, fluxos > 200]).toEqual([true, true, true]);
  });

  test('A6-RX8 · amb comentaris que porten objectes dins, la primera passada deixa el mateix que la d’abans', () => {
    /* Trams de comentaris darrere d'un «N G» (o d'un «)» solt) amb «N G obj» escrits dins, en una línia o en
       moltes, amb «endobj» o sense: on la memòria de Lexer.saltaBlancs fa drecera. */
    const trossos = ['1 0 obj', '2 0 obj', '1 0 obj 5 6 %', '1 0 obj 5 %', '1 0 obj 5 ) %', ' 5 6 %', '%', '%%', '%1 0 obj 5 6 ', '\n', '\r', '\r\n',
      '\n%', ' ', ' ', '5', '6', '0', 'R', ' R', ' 5 6 R', 'endobj', '(', ')', '(x)', '<', '>', '<<', '>>', '[', ']', '/A', '/Type /XRef',
      '<< /Length 3 >> stream\n', 'endstream', 'trailer <<', 'x'];
    const valors = textos(trossos, 20000, 30, 20261124);
    const diferents = [];
    let ambObjectes = 0;
    let refs = 0;
    for (const s of valors) {
      const bytes = new TextEncoder().encode(s);
      const [abans, ara] = [passada(bytes, primeraPassadaAbans), passada(bytes, (lector) => lector.primeraPassada())];
      if (abans.startsWith('[[[')) ambObjectes += 1;
      refs += abans.split('"Ref"').length - 1;
      if (abans !== ara) diferents.push(s);
    }
    expect(diferents).toEqual([]);
    expect([ambObjectes > 10000, refs > 300]).toEqual([true, true]);
  });
});
