/**
 * plaNeteja.js — què es podria fer amb cada document, i què passaria si es fera.
 *
 * El pla d'autoneteja (MAPA de l'empresa i de la llar, §3.1 i §3.4). PROPOSA
 * i SIMULA; no mou ni esborra mai res: no toca cap fitxer, només torna dades.
 * Principis:
 *   · Res s'esborra sol. El que ja no val es TRASLLADA a la paperera comuna de
 *     tot «Som de Poble» (_paperera_de_poble/AAMMDD/<carpeta mestra>/<ruta>),
 *     amb el camí d'origen per a poder tornar-ho.
 *   · La quarantena no caduca: el rellotge no fa mai cap esborrat. Passat el
 *     termini, el pla PROPOSA l'esborrat definitiu i espera una persona.
 *   · Fail-closed: un document dubtós o desconegut va a «revisa'l», mai a la
 *     paperera; si falta una data per a calcular el termini, també.
 *   · Cap proposta abans de la data mínima. I, mentre la gestoria no valide la
 *     taula de terminis (pregunta C3), tampoc després: es mostra la data
 *     «a verificar» i no es proposa res que depenga d'un termini.
 *   · Un tipus protegit 'sempre' mai és candidat: com a molt, es pot arxivar.
 *     Esborrar qualsevol tipus protegit demana confirmació escrita.
 *   · Cap còpia que llig el repositori, cap document amb un expedient obert
 *     (ajuda en control, inspecció, recurs) i cap original d'un duplicat. Un
 *     fet que no se sap val com a «sí»: cap trasllat a la paperera fins que
 *     la persona diga expressament que no.
 *   · Un duplicat ho és quan el seu sha256 és el de l'original del pla:
 *     l'etiqueta sola no basta, i si no quadra va a «revisa'l».
 * Les dates són { a, m, d } (nucli/dates.js), sense Date ni zones horàries.
 * JS pur: sense DOM ni React; cap xarxa.
 */
import { comparaDates, esBixest, formatData, parseData } from '../nucli/dates.js';
import {
  AVIS_TERMINI, DATES_BASE, ETIQUETES_DATA, ETIQUETES_FET, TIPUS_DESCONEGUT, esTipus, fitxaTipus, tipusDocument
} from './catalegTipus.js';

/** La paperera comuna (pregunta C1: comuna; si el Mestre la vol per carpeta mestra, és esta dada). */
export const PAPERERA = '_paperera_de_poble';
/** L'arxiu de cada carpeta mestra. */
export const CARPETA_ARXIU = '90_arxiu';

export const ACCIONS = Object.freeze(['conserva', 'revisa', 'arxiva', 'quarantena', 'proposa-esborrat']);
export const ESTATS = Object.freeze(['viu', 'arxivat', 'quarantena']);
export const CONFIRMACIONS = Object.freeze(['dos-passos', 'escrita']);

const HEX64 = /^[0-9a-f]{64}$/;
const REGLES_FIXES = new Set(['mai', 'persona', 'arxiu']);

/* N anys després; el 29 de febrer d'un any que no és bixest passa a l'1 de març (mai abans). */
function sumaAnys(d, anys) {
  const a = d.a + anys;
  if (d.m === 2 && d.d === 29 && !esBixest(a)) return { a, m: 3, d: 1 };
  return { a, m: d.m, d: d.d };
}

/* La data base d'un termini, o null si el document no la porta. */
function dataBase(des, dates) {
  const valor = parseData(dates?.[DATES_BASE[des].camp] ?? null);
  if (!valor) return null;
  return des === 'exercici' ? { a: valor.a + 1, m: 12, d: 31 } : valor;
}

const unics = (llista) => [...new Set(llista)];

/**
 * Quan es pot esborrar un document del tipus donat, segons la seua regla del
 * catàleg i les dates i els fets que en sabem. No mira el rellotge.
 * @param {string} tipusId
 * @param {{ dates?: object, fets?: object }} [document]
 * @returns {{ regla: 'mai'|'persona'|'arxiu'|'calculada', data: {a:number,m:number,d:number}|null,
 *   ambTermini: boolean, falten: string[], vigent: string[], condicions: Array<{ fet: string, valor: boolean, complida: boolean }> }}
 */
export function dataMinimaEsborrat(tipusId, { dates = {}, fets = {} } = {}) {
  const regles = tipusDocument(tipusId).conservacio;
  const fixa = regles.find((r) => REGLES_FIXES.has(r.regla));
  if (fixa) return { regla: fixa.regla, data: null, ambTermini: false, falten: [], vigent: [], condicions: [] };
  // Un termini condicionat s'aplica si cap dels seus fets és expressament fals.
  const terminis = regles.filter((r) => r.regla === 'termini' && (r.si ?? []).every((fet) => fets?.[fet] !== false));
  let data = null;
  const falten = [];
  const vigent = [];
  for (const r of terminis) {
    const base = dataBase(r.des, dates);
    if (!base) {
      (DATES_BASE[r.des].siFalta === 'revisa' ? falten : vigent).push(DATES_BASE[r.des].camp);
      continue;
    }
    const minima = sumaAnys(base, r.anys);
    if (!data || comparaDates(minima, data) > 0) data = minima;
  }
  const condicions = regles.filter((r) => r.regla === 'condicio')
    .map((r) => ({ fet: r.fet, valor: r.valor, complida: fets?.[r.fet] === r.valor }));
  return { regla: 'calculada', data, ambTermini: terminis.length > 0, falten: unics(falten), vigent: unics(vigent), condicions };
}

/** La confirmació que demana l'esborrat definitiu: escrita per a tot tipus protegit. */
export function confirmacioNecessaria(tipusId) {
  return tipusDocument(tipusId).protegit === 'no' ? 'dos-passos' : 'escrita';
}

/**
 * El codi que la persona ha d'escriure per a confirmar l'esborrat d'un tipus
 * protegit: les huit primeres xifres del sha256 del document, «ABCD-1234».
 * @param {string} sha256
 * @returns {string|null}
 */
export function codiConfirmacio(sha256) {
  const h = String(sha256 ?? '').toLowerCase();
  return HEX64.test(h) ? `${h.slice(0, 4)}-${h.slice(4, 8)}`.toUpperCase() : null;
}

/* Insensible a majúscules, espais i guions (també els tipogràfics), com l'aprovació dels tractors. */
const netCodi = (text) => String(text).replace(/[\s‐-―−-]/g, '').toUpperCase();

/**
 * La confirmació d'una persona per a esborrar del tot un document. Un tipus
 * que no s'esborra mai des de l'app no s'accepta amb cap confirmació. Per als
 * protegits, només val el codi escrit; per als altres, els dos passos o el codi.
 * @param {string} tipusId
 * @param {string} sha256
 * @param {{ passos?: number, text?: string }} confirmacio
 * @returns {'dos-passos'|'escrita'|null} el tipus de confirmació que val, o null
 */
export function confirmacioValida(tipusId, sha256, confirmacio) {
  if (!esTipus(tipusId) || tipusDocument(tipusId).conservacio.some((r) => r.regla === 'mai')) return null;
  const codi = codiConfirmacio(sha256);
  if (!codi) return null;
  const escrita = typeof confirmacio?.text === 'string' && netCodi(confirmacio.text) === netCodi(codi);
  if (escrita) return 'escrita';
  if (confirmacioNecessaria(tipusId) === 'dos-passos' && confirmacio?.passos === 2) return 'dos-passos';
  return null;
}

/* Una ruta relativa neta («a/b.pdf»), o null si puja de carpeta, és absoluta o porta trossos buits. */
function rutaNeta(ruta) {
  if (typeof ruta !== 'string' || ruta === '' || /^[\\/]/.test(ruta) || /^[a-z]:/i.test(ruta)) return null;
  const parts = ruta.split(/[\\/]/);
  return parts.some((p) => p === '' || p === '.' || p === '..') ? null : parts.join('/');
}

/* La carpeta mestra: un sol tros, o '' si no se'n diu cap; null si no és vàlida. */
function carpetaNeta(carpeta) {
  if (carpeta == null || carpeta === '') return '';
  return typeof carpeta === 'string' && !/[\\/]/.test(carpeta) && carpeta !== '.' && carpeta !== '..' ? carpeta : null;
}

const uneix = (...trossos) => trossos.filter(Boolean).join('/');
const aammdd = (d) => (d ? formatData(d, 'aaaa-mm-dd').slice(2).replace(/-/g, '') : '');
const iso = (d) => (d ? formatData(d, 'aaaa-mm-dd') : null);

/* On és ara el document, segons el seu estat. */
function ubicacio(estat, carpeta, ruta, dataQuarantena) {
  if (estat === 'arxivat') return uneix(carpeta, CARPETA_ARXIU, ruta);
  if (estat === 'quarantena') return uneix(PAPERERA, aammdd(parseData(dataQuarantena ?? null)), carpeta, ruta);
  return uneix(carpeta, ruta);
}

/* Els fets que han de ser expressament falsos abans de traslladar res: un que no se sap val com a «sí». */
function fetsSenseConfirmar(doc) {
  const falta = [];
  if (doc?.expedientObert !== false) falta.push('cal dir que no hi ha cap expedient obert');
  if (doc?.llegitPelRepositori !== false) falta.push('cal dir que cap prova del repositori la llig');
  return falta;
}

/* Decidix què es proposa per a un document. `fets` ja porta els calculats pel pla (l'original d'un
   duplicat); `empremtaQuadra` és fals quan un duplicat no té el sha256 del seu original. */
function decidix(doc, { hui, validats, fets, empremtaQuadra }) {
  const t = tipusDocument(doc?.tipus);
  const fitxa = fitxaTipus(t.id);
  const ruta = rutaNeta(doc?.ruta);
  const carpeta = carpetaNeta(doc?.carpetaMestra);
  const estat = doc?.estat === undefined ? 'viu' : doc.estat;
  const entrada = {
    ruta: doc?.ruta ?? null,
    carpetaMestra: doc?.carpetaMestra ?? null,
    tipus: t.id,
    estat,
    accio: 'conserva',
    motius: [],
    esPotEsborrarDesDe: null,
    quanEsborrar: fitxa.quanEsborrar,
    confirmacio: null,
    codiConfirmacio: null,
    de: null,
    a: null
  };
  const amb = (accio, ...motius) => Object.assign(entrada, { accio, motius: [...entrada.motius, ...motius] });

  if (ruta === null || carpeta === null) return amb('revisa', "la ruta no és vàlida: revisa'l a mà");
  if (!ESTATS.includes(estat)) return amb('revisa', `estat desconegut («${String(estat)}»): revisa'l`);
  entrada.de = ubicacio(estat, carpeta, ruta, doc?.dataQuarantena);
  if (!esTipus(doc?.tipus) || t.id === TIPUS_DESCONEGUT) return amb('revisa', "no se sap què és: revisa'l");
  if (doc?.revisa === true) return amb('revisa', "el classificador dubta: revisa'l");
  if (empremtaQuadra === false) return amb('revisa', "diu que és un duplicat, però el seu sha256 no és el de l'original: revisa'l");
  if (doc?.llegitPelRepositori === true) return amb('conserva', 'una prova del repositori llig esta còpia: no es toca');
  if (doc?.expedientObert === true) return amb('conserva', 'hi ha un expedient obert (ajuda en control, inspecció o recurs)');

  const quan = dataMinimaEsborrat(t.id, { dates: doc?.dates, fets });
  entrada.esPotEsborrarDesDe = iso(quan.data);
  if (quan.regla === 'mai') return amb('conserva', "no s'esborra mai des de l'app");
  if (quan.regla === 'persona') return amb('conserva', "ho decidix la persona: l'app no ho proposa mai");
  if (quan.regla === 'arxiu') {
    if (estat !== 'viu') return amb('conserva', "ja és fora de l'ús diari");
    return Object.assign(amb('arxiva', "el seu lloc és l'arxiu de la carpeta mestra"), { a: uneix(carpeta, CARPETA_ARXIU, ruta) });
  }
  if (quan.falten.length) {
    return amb('revisa', ...quan.falten.map((camp) => `falta ${ETIQUETES_DATA[camp]} per a saber quan es pot esborrar`));
  }
  if (quan.vigent.length) return amb('conserva', ...quan.vigent.map((camp) => `encara és vigent: no hi ha ${ETIQUETES_DATA[camp]}`));
  const pendents = quan.condicions.filter((c) => !c.complida);
  if (pendents.length) {
    return amb('conserva', ...pendents.map((c) => `es podrà quan ${c.valor ? '' : 'no '}${ETIQUETES_FET[c.fet]}`));
  }
  if (quan.data && comparaDates(hui, quan.data) < 0) {
    return amb('conserva', `es pot esborrar a partir del ${formatData(quan.data)} (${AVIS_TERMINI})`);
  }
  if (quan.ambTermini && !validats) {
    return amb('conserva', `termini vençut, però ${AVIS_TERMINI}: no es proposa res fins que la gestoria valide la taula`);
  }
  if (t.protegit === 'sempre') {
    if (estat !== 'viu') return amb('conserva', 'tipus protegit: només s’esborra si ho demana la persona, amb confirmació escrita');
    return Object.assign(amb('arxiva', 'tipus protegit: com a molt, es pot arxivar'), { a: uneix(carpeta, CARPETA_ARXIU, ruta) });
  }
  if (estat !== 'quarantena') {
    // Un expedient obert o una prova del repositori que no se saben valen com a «sí».
    const senseConfirmar = fetsSenseConfirmar(doc);
    if (senseConfirmar.length) return amb('conserva', ...senseConfirmar);
    return Object.assign(amb('quarantena', 'ja no cal: es trasllada a la paperera comuna, que no caduca sola'), {
      a: uneix(PAPERERA, aammdd(hui), carpeta, ruta)
    });
  }
  // Dins de la quarantena: només es proposa l'esborrat definitiu amb tot comprovat.
  const falta = [];
  if (!HEX64.test(String(doc?.sha256 ?? '').toLowerCase())) falta.push("falta l'empremta sha256 per al rebut");
  if (doc?.copiaSeguretat !== true) falta.push('falta la còpia de seguretat (3-2-1)');
  falta.push(...fetsSenseConfirmar(doc));
  if (falta.length) return amb('conserva', ...falta);
  const confirmacio = confirmacioNecessaria(t.id);
  return Object.assign(amb('proposa-esborrat', `esborrat definitiu: cal la confirmació ${confirmacio === 'escrita' ? 'escrita' : 'en dos passos'} d'una persona`), {
    confirmacio,
    codiConfirmacio: confirmacio === 'escrita' ? codiConfirmacio(doc.sha256) : null
  });
}

const clau = (carpeta, ruta) => `${carpeta ?? ''}::${ruta ?? ''}`;
const esDuplicat = (doc) => doc?.tipus === 'duplicat-exacte';
const empremta = (doc) => {
  const h = String(doc?.sha256 ?? '').toLowerCase();
  return HEX64.test(h) ? h : null;
};

/**
 * El pla de neteja: una entrada per document, en el mateix ordre, amb
 * l'acció proposada, els motius en llenguatge pla, la data «a verificar» a
 * partir de la qual es podria esborrar, d'on és (`de`) i on aniria (`a`).
 * Pur i determinista: no muta l'entrada.
 * @param {Array<object>} documents { ruta, carpetaMestra?, tipus, revisa?, original?, sha256?, dates?, fets?,
 *   estat? ('viu'|'arxivat'|'quarantena'), dataQuarantena?, copiaSeguretat?, expedientObert?, llegitPelRepositori? }
 * @param {{ avui: object|string, terminisValidats?: boolean }} opcions sense la data d'avui no es proposa res
 * @returns {{ avui: string, terminisValidats: boolean, entrades: object[], resum: Record<string, number> }}
 */
export function planificaNeteja(documents, { avui, terminisValidats = false } = {}) {
  const hui = parseData(avui ?? null);
  if (!hui) throw new RangeError("planificaNeteja: cal la data d'avui; sense rellotge no es proposa res.");
  const validats = terminisValidats === true;
  const docs = Array.isArray(documents) ? documents : [];
  const entrades = new Array(docs.length);
  // Primera volta: tot el que no és un duplicat exacte.
  docs.forEach((doc, i) => {
    if (!esDuplicat(doc)) entrades[i] = decidix(doc, { hui, validats, fets: doc?.fets });
  });
  // L'original es queda si és al pla, no és a la paperera i no s'hi proposa traslladar-lo.
  const esQueden = new Set();
  const originals = new Map();
  docs.forEach((doc, i) => {
    if (esDuplicat(doc)) return;
    const k = clau(doc?.carpetaMestra, doc?.ruta);
    if (!originals.has(k)) originals.set(k, doc);
    const accio = entrades[i].accio;
    if (doc?.estat !== 'quarantena' && accio !== 'quarantena' && accio !== 'proposa-esborrat') esQueden.add(k);
  });
  // Segona volta: els duplicats, amb el fet calculat (mai el que diga el document) i l'empremta comparada.
  docs.forEach((doc, i) => {
    if (!esDuplicat(doc)) return;
    const k = typeof doc?.original === 'string' ? clau(doc?.carpetaMestra, doc.original) : null;
    const original = k === null ? undefined : originals.get(k);
    // Sense l'original al pla no hi ha res a comparar: la condició queda pendent. Amb l'original, el sha256 ha de quadrar.
    const empremtaQuadra = original === undefined ? null : empremta(doc) !== null && empremta(doc) === empremta(original);
    const originalConservat = empremtaQuadra === true && esQueden.has(k);
    entrades[i] = decidix(doc, { hui, validats, fets: { ...doc?.fets, originalConservat }, empremtaQuadra });
  });
  const resum = Object.fromEntries(ACCIONS.map((accio) => [accio, entrades.filter((e) => e.accio === accio).length]));
  return { avui: iso(hui), terminisValidats: validats, entrades, resum };
}

/**
 * Simula el pla: torna com quedarien els documents i els trasllats que caldria
 * fer (de → a), que són també el manifest per a tornar-los al seu lloc. No
 * n'esborra cap: l'esborrat definitiu només el fa una persona, amb el seu rebut.
 * Simular el resultat d'una simulació no proposa cap trasllat nou.
 * @param {Array<object>} documents
 * @param {{ avui: object|string, terminisValidats?: boolean }} opcions
 * @returns {{ pla: object, documents: object[], moviments: Array<{ accio: string, de: string, a: string }> }}
 */
export function simulaNeteja(documents, opcions = {}) {
  const pla = planificaNeteja(documents, opcions);
  const hui = parseData(opcions.avui);
  const moviments = [];
  const despres = (Array.isArray(documents) ? documents : []).map((doc, i) => {
    const { accio, de, a } = pla.entrades[i];
    if (accio === 'arxiva') {
      moviments.push({ accio, de, a });
      return { ...doc, estat: 'arxivat' };
    }
    if (accio === 'quarantena') {
      moviments.push({ accio, de, a });
      return { ...doc, estat: 'quarantena', dataQuarantena: { ...hui } };
    }
    return doc;
  });
  return { pla, documents: despres, moviments };
}
