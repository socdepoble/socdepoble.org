/**
 * Lector de notícies · les notícies germanes (IDEA-30; B6-C de la marató 261101_2143). Nucli pur.
 *
 * Altres veus sobre el mateix fet: notícies d'una ALTRA font, dins d'una finestra de 30 dies, que
 * compartixen almenys 2 termes significatius al títol. És una relació orientativa i local (cap
 * xarxa, cap model de llengua): no afirma que dues peces conten els mateixos fets.
 *
 *   indexGermanes(resums)                 prepara una vegada els termes de cada resum (memoritzable
 *                                         per llista) → { docs, df, ubics }
 *   germanesDe(article, index, opcions)   → [{ resum, puntuacio, termes }], com a molt `maxim`
 *     opcions.maxim   enter de 1 a 20 (per defecte, 5)
 *     opcions.fonts   les fonts admeses (Set o llista d'ids); null, totes
 *
 * Termes: sense accents ni majúscules, la ela geminada junta («al·legacions» → «allegacions»),
 * trossos de [a-z0-9] de 4 caràcters o més que no són mots buits (ca, es, en) ni només xifres (un
 * any comú no és cap prova); com a molt 30 del títol i 60 del títol més el resum.
 * Ubiqüitat: un terme present en més del 20 % dels resums de l'índex (si n'hi ha 10 o més) no
 * compta. Sense esta regla, un catàleg d'un sol tema faria germanes de tot amb tot.
 * Regla: mai el mateix id, la mateixa font ni el mateix enllaç (la mateixa peça servida per dues
 * fonts no és una altra veu); si les dues dates són vàlides, |Δ| ≤ 30 dies; ≥ 2 termes comuns als
 * dos títols. puntuacio = 2 × comuns del títol + comuns del títol i el resum. Ordre: puntuació, data
 * (la més nova primer) i id. Un enllaç repetit entre les germanes només hi és una vegada.
 * Mai llança: una entrada invàlida torna [] (o l'índex buit).
 */
import { msDeData } from './dates.js';

export const LIMITS_GERMANES = Object.freeze({
  maxim: 5, sostre: 20, candidats: 500, minimTitol: 2, finestraDies: 30, ubiquitat: 0.2, minimUbiquitat: 10,
  termesTitol: 30, termesTot: 60, text: 2000
});

const DIA = 86400000;

/* La llista tancada de mots buits de 4 caràcters o més (els més curts ja no compten), plegats.
   Cada llengua en una sola cadena: un mot buit entre cometes seguit d'una altra cometa (el «from»
   anglés) la guarda Model B de src/apps/plataforma/fronteres.test.js el llig com un import. */
const BUIDES = new Set([
  ...('aixo aquell aquella aquelles aquells aquest aquesta aquestes aquests abans altra altre altres cada contra dels despres '
    + 'dins durant encara entre esta este estes estos fins fora mateix mateixa molt molta moltes molts nostra nostre nous nova '
    + 'noves pels pero perque poca pocs poques quan segons sempre sens sense seua seues seus sobre tambe tota totes tots').split(' '),
  ...'como cuando desde donde ella ellos esto hasta para porque segun todo todos tras unos unas'.split(' '),
  ...'about after been from have into over that their there they this were what when will with your'.split(' ')
]);

const INDEX_BUIT = Object.freeze({ docs: Object.freeze([]), df: new Map(), ubics: new Set() });

const esText = (valor) => typeof valor === 'string' && valor !== '';
const esResum = (resum) => resum !== null && typeof resum === 'object' && esText(resum.id) && esText(resum.fontId) && esText(resum.titol);

/* Sense marques combinants, en minúscules i amb la ela geminada junta (ŀ, l·l, l.l). */
function plegat(text) {
  return text.slice(0, LIMITS_GERMANES.text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\u0140/g, 'l').replace(/l[.\u00b7\u2027\u2219\u22c5]l/g, 'll');
}

function termesDe(text, maxim) {
  const termes = new Set();
  if (!esText(text)) return termes;
  for (const tros of plegat(text).split(/[^a-z0-9]+/)) {
    if (tros.length < 4 || BUIDES.has(tros) || /^[0-9]+$/.test(tros)) continue;
    termes.add(tros);
    if (termes.size >= maxim) break;
  }
  return termes;
}

const msDe = (data) => {
  const ms = msDeData(data);
  return Number.isFinite(ms) ? ms : null;
};

/* Els paràmetres de seguiment, que no canvien la peça (idea del kit de Codex). */
const SEGUIMENT = /^(?:utm_[a-z0-9_]*|fbclid|gclid)$/i;

/* L'enllaç sense el fragment ni els paràmetres de seguiment: la mateixa peça encara que l'àncora
   o l'etiqueta de campanya canvien. La consulta es torna a escriure sempre (també sense cap
   paràmetre de seguiment), perquè les dues bandes es comparen escrites igual. Un enllaç que no
   és una adreça absoluta es compara tal qual, sense el fragment. */
function clauEnllac(enllac) {
  if (!esText(enllac)) return null;
  const senseFragment = enllac.split('#')[0];
  try {
    const url = new URL(senseFragment);
    url.search = new URLSearchParams([...url.searchParams].filter(([clau]) => !SEGUIMENT.test(clau))).toString();
    return url.href;
  } catch {
    return senseFragment;
  }
}

const perId = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));

/* De la més nova a la més vella (sense data, al final) i, en empat, per id. */
function perData(a, b) {
  if (a.ms !== b.ms) {
    if (a.ms === null) return 1;
    if (b.ms === null) return -1;
    return b.ms - a.ms;
  }
  return perId(a.resum.id, b.resum.id);
}

function docDe(resum, ms) {
  const resumText = esText(resum.resum) ? resum.resum : '';
  return Object.freeze({
    resum,
    ms,
    enllac: clauEnllac(resum.enllac),
    titol: termesDe(resum.titol, LIMITS_GERMANES.termesTitol),
    tot: termesDe(`${resum.titol} ${resumText}`, LIMITS_GERMANES.termesTot)
  });
}

/** Prepara una vegada els termes de cada resum: els 500 més nous, sense ids repetits. */
export function indexGermanes(resums) {
  try {
    if (!Array.isArray(resums)) return INDEX_BUIT;
    const vistos = new Set();
    const valids = [];
    for (const resum of resums) {
      if (!esResum(resum) || vistos.has(resum.id)) continue;
      vistos.add(resum.id);
      valids.push({ resum, ms: msDe(resum.data) });
    }
    const docs = valids.sort(perData).slice(0, LIMITS_GERMANES.candidats).map(({ resum, ms }) => docDe(resum, ms));
    const df = new Map();
    for (const doc of docs) for (const terme of doc.tot) df.set(terme, (df.get(terme) || 0) + 1);
    const ubics = new Set();
    if (docs.length >= LIMITS_GERMANES.minimUbiquitat) {
      for (const [terme, n] of df) if (n / docs.length > LIMITS_GERMANES.ubiquitat) ubics.add(terme);
    }
    return Object.freeze({ docs: Object.freeze(docs), df, ubics });
  } catch {
    return INDEX_BUIT;
  }
}

/* Les fonts admeses: null (totes), un Set o una llista; qualsevol altra cosa no n'admet cap. */
function fontsAdmeses(fonts) {
  if (fonts == null) return null;
  if (fonts instanceof Set) return fonts;
  return new Set(Array.isArray(fonts) ? fonts : []);
}

function perPuntuacio(a, b) {
  return b.puntuacio - a.puntuacio || perData(a, b);
}

/** Les germanes d'un article: d'una ALTRA font, dins de la finestra i amb ≥ 2 termes comuns als títols. */
export function germanesDe(article, index, opcions = {}) {
  try {
    if (!esResum(article) || !index || !Array.isArray(index.docs)) return [];
    const maxim = Number.isSafeInteger(opcions?.maxim) && opcions.maxim > 0
      ? Math.min(opcions.maxim, LIMITS_GERMANES.sostre)
      : LIMITS_GERMANES.maxim;
    const admeses = fontsAdmeses(opcions?.fonts);
    const ubics = index.ubics instanceof Set ? index.ubics : new Set();
    const propi = docDe(article, msDe(article.data));
    const delTitol = [...propi.titol].filter((terme) => !ubics.has(terme));
    if (delTitol.length < LIMITS_GERMANES.minimTitol) return [];
    const finestra = LIMITS_GERMANES.finestraDies * DIA;
    const candidates = [];
    for (const doc of index.docs) {
      const { resum } = doc;
      if (resum.id === article.id || resum.fontId === article.fontId) continue;
      if (admeses && !admeses.has(resum.fontId)) continue;
      if (propi.enllac && doc.enllac === propi.enllac) continue;
      if (propi.ms !== null && doc.ms !== null && Math.abs(propi.ms - doc.ms) > finestra) continue;
      const termes = delTitol.filter((terme) => doc.titol.has(terme));
      if (termes.length < LIMITS_GERMANES.minimTitol) continue;
      let comuns = 0;
      for (const terme of propi.tot) if (!ubics.has(terme) && doc.tot.has(terme)) comuns += 1;
      candidates.push({ resum, ms: doc.ms, enllac: doc.enllac, termes, puntuacio: 2 * termes.length + comuns });
    }
    candidates.sort(perPuntuacio);
    const enllacos = new Set();
    const germanes = [];
    for (const candidata of candidates) {
      if (candidata.enllac) {
        if (enllacos.has(candidata.enllac)) continue;
        enllacos.add(candidata.enllac);
      }
      germanes.push(Object.freeze({ resum: candidata.resum, puntuacio: candidata.puntuacio, termes: Object.freeze(candidata.termes) }));
      if (germanes.length >= maxim) break;
    }
    return germanes;
  } catch {
    return [];
  }
}
