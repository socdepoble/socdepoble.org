/**
 * concilia.js — conciliació dels moviments del banc amb les factures i els rebuts.
 *
 * Proposa parelles entre els moviments de l'extracte (els de llegeixC43,
 * fusionats o no amb el CSV del banc) i les factures del model (les de
 * crearFactura, com les de la proposta del tractor), i entre rebuts i
 * factures. No modifica res del que rep, tampoc la proposta del tractor:
 * torna parelles, el que queda sense parella i incidències perquè ho revise
 * la persona.
 *
 * REGLES, en l'ordre en què s'apliquen. Cada moviment i cada factura entren,
 * com a molt, en una parella amb moviments, i un moviment només es compara
 * amb una factura si el signe quadra (una despesa, càrrec; un ingrés,
 * abonament; una rectificativa, al revés).
 *   R7 un moviment de concepte comú 98 (anul·lació) anul·la el càrrec anterior
 *      del mateix import i signe contrari amb la mateixa data valor o, si no
 *      n'hi ha cap, amb una data valor de fins a 3 dies abans de la de
 *      l'anul·lació (mai posterior). Els dos fan parella sense factura.
 *   R1 el número d'una factura apareix al text del moviment (conceptes 23,
 *      referències i comerç) com a seqüència de paraules senceres: «Q27 0815»
 *      cita la Q270815, però «XQ270815» no; i un número que comença o acaba
 *      en xifra no pot ser un tros d'un grup de xifres enganxades per guions,
 *      barres o punts («PERIODE 2099-07-15» no cita la 2099-07). Alta si
 *      l'import quadra (diferència 0; en una factura en una altra moneda, el
 *      24 porta el seu import exacte); si no, es deixa per a després de R3
 *      (vegeu baix). Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I ·
 *      motors; auditoria de Codex 261013_1510, GES-A6): un import que no es
 *      pot comparar (factura sense total, o en una altra moneda sense el 24)
 *      NO quadra: «desconegut» no és «diferència zero».
 *   R4 n'hi apareixen diverses: el subconjunt de fins a 4 que suma l'import
 *      exacte, si és únic (la transferència que paga dues quotes). Alta. Si
 *      cap no quadra, també es deixa per a després de R3.
 *   R2 rebut SEPA: el NIF de l'identificador de creditor és el de la factura,
 *      l'import és exacte i el rebut arriba entre 5 dies abans i 40 després de
 *      la factura. Si n'hi ha diverses, la més pròxima de les ja emeses el dia
 *      del rebut, i una de posterior només si no n'hi ha cap: amb quotes
 *      iguals, la del mes següent no es menja la d'este. Alta.
 *   R5 factura en una altra moneda: el registre 24 porta el mateix import en
 *      eixa moneda i el càrrec és entre 3 dies abans i 10 després de la
 *      factura (les factures, de la més antiga a la més nova). Alta.
 *   R3 import exacte, moviment entre 3 dies abans i 10 després de la factura,
 *      i la contrapart del moviment (comerç, creditor o primer concepte)
 *      contra el registre de proveïdors: alta si és la de la factura,
 *      mitjana si no se sap i és l'única candidata, res si és una altra.
 *   R1 i R4 sense l'import exacte: el moviment que cita factures que no paga
 *      exactes no entra a R2, R5 ni R3, però les seues factures sí, perquè un
 *      pagament exacte d'un altre moviment passe davant. Les citades que
 *      queden lliures fan parella amb ell: mitjana, amb incidència
 *      (IMPORT_DIFERENT o, si l'import no es pot comparar, IMPORT_DESCONEGUT).
 *   R5 sense 24: l'únic càrrec de la mateixa finestra que és del proveïdor de
 *      la factura (mitjana) o que porta comissió de compra a l'estranger (baixa).
 *   R4 per proveïdor: un càrrec del mateix creditor o proveïdor que paga
 *      entre 2 i 4 factures seues dels 100 dies anteriors. Mitjana.
 *   R6 un rebut (text, número o nom de fitxer) cita el número d'una factura.
 *      No hi entra cap moviment: un rebut no diu des de quin compte s'ha
 *      pagat, i la factura seguix sense pagament al banc. Alta només amb la
 *      diferència 0; un rebut sense import (o una factura sense total), mitjana
 *      (GES-A6).
 * La comissió de canvi (concepte comú 17, el mateix dia) s'afig a la parella
 * R5 si comparteix referència amb el càrrec: la referència 1 o el document
 * (si porten xifres), o una referència de 8 caràcters o més amb xifres als
 * conceptes (el número d'operació de la targeta). El tipus de canvi derivat
 * són euros per unitat de la moneda de la factura.
 *
 * Parella: { moviments, factures, regla, confianca, diferencia, rebuts?,
 * tipusCanvi?, comissio? }. diferencia = suma dels moviments − import esperat
 * de les factures, en cèntims (null si alguna no és en euros o no té total);
 * en R5, i en R1 amb una factura en una altra moneda, la diferència en la
 * moneda de la factura (0 amb el 24, null sense); en R6, |rebut| − |factura|.
 * Una parella de confiança alta té SEMPRE diferencia === 0 (GES-A6).
 * JS pur: sense DOM ni APIs de Node.
 */
import { textDelsConceptes } from './c43.js';
import { nifsDelProveidor } from './cataleg.js';
import { comparaDates, diesEntre, dinsDeRang, esDataValida, formatData } from './dates.js';
import { formatImport } from './diners.js';
import { normalitzaNom } from './model.js';
import { normalitzaNif } from './nif.js';
import { aprenProveidors, identificaProveidor } from './proveidors.js';

export const REGLES_CONCILIACIO = Object.freeze(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']);
/* Els codis que pot tornar concilia a les incidències. */
export const CODIS_CONCILIACIO = Object.freeze([
  'AMBIGUITAT', 'IMPORT_DIFERENT', 'ANULLACIO_SENSE_CARREC', 'MOVIMENT_ILLEGIBLE', 'IMPORT_DESCONEGUT'
]);
/* Dies del moviment respecte de la data de la factura: abans (fins a −abans) i després (fins a +despres). */
export const FINESTRES = Object.freeze({
  compra: Object.freeze({ abans: 3, despres: 10 }),
  rebut: Object.freeze({ abans: 5, despres: 40 }),
  agrupada: Object.freeze({ abans: 3, despres: 100 })
});
const MAX_FACTURES_PER_MOVIMENT = 4;
/* Les factures més pròximes que entren a la cerca de subconjunts: 12 donen 793 combinacions de fins a 4. */
const MAX_CANDIDATS_SUBCONJUNT = 12;
/* Un número citable: 4 caràcters o més, o 6 si només són xifres (un 2026 o un 0003 casen amb qualsevol cosa). */
const LLARGARIA_MINIMA_NUMERO = 4;
const LLARGARIA_MINIMA_NUMERO_XIFRES = 6;
const LLARGARIA_MINIMA_REFERENCIA = 8;
const LLARGARIA_MINIMA_PARAULA = 4;
/* R7 sense la mateixa data valor: la del càrrec anul·lat pot ser fins a estos dies anterior a la de l'anul·lació. */
const MARGE_ANULLACIO = 3;
const CONCEPTE_TARGETA = '12';
const CONCEPTE_COMISSIONS = '17';
const CONCEPTE_ANULLACIO = '98';
/* Paraules (ja normalitzades) dels conceptes del banc i dels noms d'empresa que no diuen qui és la contrapart. */
const PARAULES_BUIDES = new Set([
  'compra', 'comercio', 'pago', 'pagament', 'factura', 'facturas', 'recibo', 'rebut', 'transferencia', 'transf', 'enviado',
  'enviada', 'recibida', 'bizum', 'tarjeta', 'targeta', 'cuota', 'quota', 'servicios', 'serveis', 'servei', 'servicio',
  'online', 'spain', 'espana', 'europe', 'group', 'grupo', 'store', 'tienda'
]);

const senseAccents = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '');
const fitxesDe = (text) => senseAccents(text).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
const clauDeNumero = (num) => fitxesDe(num).join('');
const esCitable = (clau) => clau.length >= (/^\d+$/.test(clau) ? LLARGARIA_MINIMA_NUMERO_XIFRES : LLARGARIA_MINIMA_NUMERO);
const nomesXifres = (fitxa) => /^\d+$/.test(fitxa);

/* Les fitxes del text i, per a cada una, si va enganxada a l'anterior per un signe (guió, barra o punt)
   sense cap espai: en «2099-07-15» el 15 hi va; en «Q27 0815 15/07», no. */
function tallaText(text) {
  const net = senseAccents(text).toUpperCase();
  const fitxes = [];
  const enganxades = [];
  for (const [, separador, fitxa] of net.matchAll(/([^A-Z0-9]*)([A-Z0-9]+)/g)) {
    enganxades.push(fitxes.length > 0 && !/\s/.test(separador));
    fitxes.push(fitxa);
  }
  return { fitxes, enganxades };
}

/* Cert si la clau és la unió d'unes quantes fitxes seguides del text. Una clau que comença (o acaba) en
   xifra no compta si la fitxa d'abans (o la de després) és de xifres i hi va enganxada: seria un tros d'un
   número més llarg o d'una data. */
function citaClau({ fitxes, enganxades }, clau) {
  const comencaEnXifra = /^\d/.test(clau);
  const acabaEnXifra = /\d$/.test(clau);
  for (let i = 0; i < fitxes.length; i += 1) {
    if (comencaEnXifra && enganxades[i] && nomesXifres(fitxes[i - 1])) continue;
    let acumulat = '';
    for (let j = i; j < fitxes.length; j += 1) {
      acumulat += fitxes[j];
      if (acumulat === clau) {
        if (!(acabaEnXifra && enganxades[j + 1] && nomesXifres(fitxes[j + 1]))) return true;
        break;
      }
      if (!clau.startsWith(acumulat)) break;
    }
  }
  return false;
}

/**
 * Cert si un text cita un número de factura: les seues lletres i xifres, en
 * paraules senceres i seguides del text, sense comptar espais, guions ni
 * barres. Un número massa curt (vegeu dalt) no es cita mai, i un tros d'un
 * grup de xifres enganxades (una data, un número més llarg) tampoc.
 * @param {string} text
 * @param {string} num
 * @returns {boolean}
 */
export function citaNumero(text, num) {
  const clau = clauDeNumero(num);
  return esCitable(clau) && citaClau(tallaText(text), clau);
}

const textCitable = (m) => [textDelsConceptes(m), m.ref1, m.ref2, m.comerc].filter((t) => typeof t === 'string' && t !== '').join(' ');
const enEuros = (f) => f.moneda == null || f.moneda === 'EUR';
/* L'import que ha de tindre el moviment que paga la factura: una despesa resta, un ingrés suma. */
const importEsperat = (f) => (Number.isSafeInteger(f.total) ? (f.tipus === 'ingres' ? f.total : -f.total) : null);
const signeEsperat = (f) => (f.tipus === 'ingres' ? 1 : -1) * (Number.isSafeInteger(f.total) && f.total < 0 ? -1 : 1);
const signeCompatible = (m, f) => m.centims !== 0 && Math.sign(m.centims) === signeEsperat(f);
const suma = (llista) => llista.reduce((s, x) => s + x, 0);
const mateixDia = (x, y) => esDataValida(x) && esDataValida(y) && comparaDates(x, y) === 0;
const diesDe = (m, f) => diesEntre(f.data, m.dataOperacio);
const arrodonix = (x) => Math.round(x * 1e6) / 1e6;
const perData = (factures) => [...factures].sort((x, y) => comparaDates(x.data, y.data));

function dinsFinestra(m, f, { abans, despres }) {
  const d = diesDe(m, f);
  return d !== null && d >= -abans && d <= despres;
}

function diferenciaDe(moviments, factures) {
  const esperats = factures.map((f) => (enEuros(f) ? importEsperat(f) : null));
  if (esperats.includes(null)) return null;
  return suma(moviments.map((m) => m.centims)) - suma(esperats);
}

/* GES-A6: una factura en una altra moneda només quadra si el 24 del moviment porta el seu import exacte. */
const exacteEnDivisa = (m, f) => !enEuros(f) && f.moneda !== 'XXX' && Number.isSafeInteger(f.total) && f.total !== 0
  && m.divisa?.moneda === f.moneda && Math.abs(m.divisa.centims ?? Number.NaN) === Math.abs(f.total);

/* El candidat més pròxim en dies; en un empat, el que va després de la factura. */
function mesProper(candidats, diesDelCandidat) {
  const pes = (c) => {
    const d = diesDelCandidat(c);
    return d === null ? [Infinity, 1] : [Math.abs(d), d < 0 ? 1 : 0];
  };
  return candidats.reduce((millor, c) => {
    if (!millor) return c;
    const [x, y] = [pes(c), pes(millor)];
    return x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]) ? c : millor;
  }, null);
}

/* Els subconjunts (d'entre `minim` i 4 elements) que sumen exactament l'objectiu. */
function subconjuntsQueSumen(llista, valorDe, objectiu, minim = 1) {
  const trobats = [];
  const triats = [];
  const tria = (inici, acumulat) => {
    if (triats.length >= minim && acumulat === objectiu) {
      trobats.push([...triats]);
      return;
    }
    if (triats.length === MAX_FACTURES_PER_MOVIMENT) return;
    for (let k = inici; k < llista.length; k += 1) {
      triats.push(llista[k]);
      tria(k + 1, acumulat + valorDe(llista[k]));
      triats.pop();
    }
  };
  tria(0, 0);
  return trobats;
}

const paraulesDe = (nom) => new Set(normalitzaNom(nom).split(' ').filter((p) => p.length >= LLARGARIA_MINIMA_PARAULA && !PARAULES_BUIDES.has(p)));
const dominiDe = (text) => (/[a-z0-9-]+(?:\.[a-z0-9-]+)+/i.exec(String(text ?? ''))?.[0] ?? '').toLowerCase();

/* Qui hi ha a l'altra banda d'un moviment: el comerç, el creditor SEPA o el primer concepte (una
   compra amb targeta sense comerç només diu «compra comercio»). */
function contrapartDe(m) {
  if (m.comerc) return m.comerc;
  if (m.sepa?.creditor) return m.sepa.creditor;
  if (m.conceptComu === CONCEPTE_TARGETA) return '';
  return m.conceptes?.[0]?.camps?.[0] ?? '';
}

/* La identitat de moviments i factures contra el registre de proveïdors, calculada una vegada. */
function creaIdentitats(registre) {
  const memoria = new Map();
  const recorda = (objecte, calcula) => {
    if (!memoria.has(objecte)) memoria.set(objecte, calcula());
    return memoria.get(objecte);
  };
  const deMoviment = (m) => recorda(m, () => {
    const nom = contrapartDe(m);
    const cif = m.sepa?.cif ?? '';
    const r = nom || cif ? identificaProveidor({ nif: cif, nom, domini: dominiDe(nom) }, registre) : null;
    return { cif, clau: r?.proveidor?.clau ?? null, paraules: paraulesDe(nom) };
  });
  const deFactura = (f) => recorda(f, () => {
    const r = identificaProveidor({ nif: f.nif, nom: f.contrapart, nomFitxer: f.origen?.fitxer ?? '' }, registre);
    return { cif: normalitzaNif(f.nif), clau: r?.proveidor?.clau ?? null, paraules: paraulesDe(f.contrapart) };
  });
  /* G3T-12: dos NIF són del mateix proveïdor si són iguals o si una entrada del registre els té tots dos (el
     principal i un d'alternatiu, d'una altra societat del grup). Un proveïdor sense NIF no n'aparella cap. */
  const grupDelNif = new Map();
  for (const p of registre ?? []) {
    for (const nif of p ? nifsDelProveidor(p) : []) if (!grupDelNif.has(nif)) grupDelNif.set(nif, p.clau);
  }
  const mateixNif = (im, jf) => {
    if (im.cif === jf.cif) return true;
    const grup = grupDelNif.get(normalitzaNif(im.cif));
    return Boolean(grup) && grup === grupDelNif.get(jf.cif);
  };
  /* 'igual', 'diferent' o 'desconegut'. Dos NIF manen; després, el proveïdor del registre i les paraules del nom. */
  const acord = (m, f) => {
    const im = deMoviment(m);
    const jf = deFactura(f);
    if (im.cif && jf.cif) return mateixNif(im, jf) ? 'igual' : 'diferent';
    if (im.clau && im.clau === jf.clau) return 'igual';
    if ([...im.paraules].some((p) => jf.paraules.has(p))) return 'igual';
    return im.clau && jf.clau ? 'diferent' : 'desconegut';
  };
  /* El mateix proveïdor per a R4: el NIF si els dos el porten; si no, la clau del registre. */
  const mateixProveidor = (m, f) => {
    const im = deMoviment(m);
    const jf = deFactura(f);
    if (im.cif && jf.cif) return mateixNif(im, jf);
    return Boolean(im.clau) && im.clau === jf.clau;
  };
  /* R2: el NIF del creditor SEPA és el de la factura o el d'una altra societat del mateix proveïdor. */
  const creditorDeLaFactura = (m, f) => {
    const im = deMoviment(m);
    const jf = deFactura(f);
    return Boolean(im.cif) && Boolean(jf.cif) && mateixNif(im, jf);
  };
  return { deMoviment, acord, mateixProveidor, creditorDeLaFactura };
}

const esReferencia = (fitxa) => fitxa.length >= LLARGARIA_MINIMA_REFERENCIA && /\d/.test(fitxa);

/* Dos moviments del mateix dia que parlen de la mateixa operació (el càrrec i la seua comissió). */
function comparteixenReferencia(x, y) {
  if (x.ref1 && x.ref1 === y.ref1 && /\d/.test(x.ref1)) return true;
  if (x.document && x.document === y.document && /[1-9]/.test(x.document)) return true;
  const deX = new Set(fitxesDe(textDelsConceptes(x)).filter(esReferencia));
  return fitxesDe(textDelsConceptes(y)).some((fitxa) => deX.has(fitxa));
}

const quin = (m) => `del ${formatData(m.dataOperacio)} (${formatImport(m.centims)})`;
const nomFactura = (f) => (f.num ? `«${f.num}»` : 'sense número');
const nomRebut = (r) => (r.ruta ? `«${String(r.ruta).split(/[\\/]/).pop()}»` : r.num ? `«${r.num}»` : 'sense nom');
const refMoviment = (m) => (m.linia ? { linia: m.linia } : {});
const refFactura = (f) => ({ ...(f.id ? { facturaId: f.id } : {}), ...(f.origen?.fitxer ? { fitxer: f.origen.fitxer } : {}) });

/**
 * Concilia els moviments del banc amb les factures i els rebuts.
 * @param {object} entrada
 * @param {object[]} [entrada.moviments] els de llegeixC43 (o de fusionaMoviments)
 * @param {object[]} [entrada.factures] Factures del model (crearFactura)
 * @param {Array<{ ruta?: string, num?: string, text?: string, import?: number }>} [entrada.rebuts]
 *   rebuts de pagament: el nom del fitxer, el número, el text i l'import en cèntims, el que se'n sàpia
 * @param {{ inici: object, fi: object }|null} [entrada.rang] el període de què es vol saber què falta:
 *   els moviments i les factures de fora no ixen a les llistes «sense», però sí que poden fer parella
 * @param {object[]|null} [entrada.proveidors] el registre d'aprenProveidors; per defecte, només el catàleg
 * @returns {{ parelles: object[], movimentsSenseFactura: object[], facturesSensePagament: object[],
 *   incidencies: Array<{ codi: string, severitat: string, missatge: string, linia?: number, facturaId?: string,
 *   fitxer?: string }> }}
 */
export function concilia({ moviments = [], factures = [], rebuts = [], rang = null, proveidors = null } = {}) {
  const { deMoviment, acord, mateixProveidor, creditorDeLaFactura } = creaIdentitats(Array.isArray(proveidors) ? proveidors : aprenProveidors([]));
  const incidencies = [];
  const incidencia = (codi, severitat, missatge, extra = {}) => incidencies.push({ codi, severitat, missatge, ...extra });

  const totsMoviments = Array.isArray(moviments) ? moviments : [];
  const valids = totsMoviments.filter((m) => m && Number.isSafeInteger(m.centims) && esDataValida(m.dataOperacio));
  const illegibles = totsMoviments.length - valids.length;
  if (illegibles > 0) {
    incidencia('MOVIMENT_ILLEGIBLE', 'baixa', illegibles === 1
      ? 'Un moviment no té data o import: no s’ha pogut conciliar.'
      : `${illegibles} moviments no tenen data o import: no s’han pogut conciliar.`);
  }
  const ordenats = valids.map((m, i) => ({ m, i }))
    .sort((x, y) => comparaDates(x.m.dataOperacio, y.m.dataOperacio) || x.i - y.i)
    .map(({ m }) => m);
  const llistaFactures = (Array.isArray(factures) ? factures : []).filter((f) => f && typeof f === 'object');
  const claus = new Map();
  for (const f of llistaFactures) {
    const clau = clauDeNumero(f.num);
    if (esCitable(clau)) claus.set(f, clau);
  }

  const lliuresM = new Set(ordenats);
  const lliuresF = new Set(llistaFactures);
  const movimentsLliures = () => ordenats.filter((m) => lliuresM.has(m));
  const facturesLliures = () => llistaFactures.filter((f) => lliuresF.has(f));
  const parelles = [];
  const aparella = (regla, confianca, ms, fs, extra = {}) => {
    for (const m of ms) lliuresM.delete(m);
    for (const f of fs) lliuresF.delete(f);
    const parella = { moviments: ms, factures: fs, regla, confianca, diferencia: diferenciaDe(ms, fs), ...extra };
    parelles.push(parella);
    return parella;
  };
  const avisaDiferencia = (parella, m) => {
    if (parella.diferencia === 0) return;
    const quines = parella.factures.length === 1 ? `la factura ${nomFactura(parella.factures[0])}` : `${parella.factures.length} factures`;
    /* GES-A6: sense un import que es puga comparar no hi ha «diferència 0», i també es diu. */
    if (parella.diferencia === null) {
      incidencia('IMPORT_DESCONEGUT', 'mitjana',
        `El moviment ${quin(m)} cita ${quines}, però l’import no es pot comparar (una altra moneda o sense total): revisa-ho a mà.`, refMoviment(m));
      return;
    }
    incidencia('IMPORT_DIFERENT', 'mitjana',
      `El moviment ${quin(m)} cita ${quines}, però l’import no quadra: hi ha ${formatImport(parella.diferencia)} de diferència.`, refMoviment(m));
  };

  /* R7 · anul·lacions: abans que res, perquè el càrrec anul·lat no pague cap factura. */
  ordenats.forEach((anullacio, k) => {
    if (anullacio.conceptComu !== CONCEPTE_ANULLACIO || !lliuresM.has(anullacio)) return;
    const anteriors = ordenats.slice(0, k).filter((c) => lliuresM.has(c) && c.conceptComu !== CONCEPTE_ANULLACIO && c.centims === -anullacio.centims);
    const aprop = (c) => {
      const d = diesEntre(c.dataValor, anullacio.dataValor);
      return d !== null && d >= 0 && d <= MARGE_ANULLACIO;
    };
    const triat = anteriors.filter((c) => mateixDia(c.dataValor, anullacio.dataValor)).pop() ?? anteriors.filter(aprop).pop();
    if (triat) aparella('R7', 'alta', [triat, anullacio], []);
    else {
      incidencia('ANULLACIO_SENSE_CARREC', 'baixa',
        `L’anul·lació ${quin(anullacio)} no troba a l’extracte el càrrec que anul·la: pot ser d’un període anterior.`, refMoviment(anullacio));
    }
  });

  /* R1 i R4 · el moviment cita números de factura. Si no en paga cap exacta, el moviment espera fins
     després de R3 i les factures queden lliures per a un pagament exacte. */
  const citacionsSenseImport = [];
  const esperaR3 = (m, citades) => {
    lliuresM.delete(m);
    citacionsSenseImport.push({ m, citades });
  };
  for (const m of ordenats) {
    if (!lliuresM.has(m)) continue;
    const tallat = tallaText(textCitable(m));
    const citades = facturesLliures().filter((f) => claus.has(f) && signeCompatible(m, f) && citaClau(tallat, claus.get(f)));
    if (citades.length === 0) continue;
    if (citades.length === 1) {
      /* GES-A6: alta només amb la diferència 0; null (import desconegut o una altra moneda) no quadra. */
      const [f] = citades;
      if (diferenciaDe([m], citades) === 0) aparella('R1', 'alta', [m], citades);
      else if (exacteEnDivisa(m, f)) aparella('R1', 'alta', [m], citades, { diferencia: 0, tipusCanvi: arrodonix(Math.abs(m.centims) / Math.abs(f.total)) });
      else esperaR3(m, citades);
      continue;
    }
    const sumables = citades.filter((f) => enEuros(f) && importEsperat(f) !== null).slice(0, MAX_CANDIDATS_SUBCONJUNT);
    const exactes = subconjuntsQueSumen(sumables, importEsperat, m.centims);
    if (exactes.length === 1) aparella(exactes[0].length === 1 ? 'R1' : 'R4', 'alta', [m], perData(exactes[0]));
    else if (exactes.length === 0 && citades.length <= MAX_FACTURES_PER_MOVIMENT) esperaR3(m, citades);
    else {
      incidencia('AMBIGUITAT', 'mitjana',
        `El moviment ${quin(m)} cita ${citades.length} factures i no se sap quines paga: tria-les a mà.`, refMoviment(m));
    }
  }

  /* R2 · rebuts SEPA: NIF del creditor (o d'una altra societat del grup, G3T-12) i import exacte. */
  for (const m of ordenats) {
    if (!lliuresM.has(m) || !m.sepa?.cif) continue;
    const candidates = facturesLliures().filter((f) => enEuros(f) && importEsperat(f) === m.centims
      && creditorDeLaFactura(m, f) && dinsFinestra(m, f, FINESTRES.rebut));
    if (candidates.length === 0) continue;
    /* Primer les ja emeses el dia del rebut: amb quotes iguals, la del mes següent no es menja la d'este. */
    const jaEmeses = candidates.filter((f) => diesDe(m, f) >= 0);
    aparella('R2', 'alta', [m], [mesProper(jaEmeses.length > 0 ? jaEmeses : candidates, (f) => diesDe(m, f))]);
  }

  /* R5 · factures en una altra moneda. La comissió de canvi s'enllaça al càrrec. */
  const comissioDe = (m) => movimentsLliures().find((c) => c !== m && c.conceptComu === CONCEPTE_COMISSIONS
    && mateixDia(c.dataOperacio, m.dataOperacio) && Math.sign(c.centims) === Math.sign(m.centims) && comparteixenReferencia(m, c)) ?? null;
  const enDivisa = (f) => lliuresF.has(f) && !enEuros(f) && f.moneda !== 'XXX' && Number.isSafeInteger(f.total) && f.total !== 0;
  const aparellaDivisa = (f, m, confianca, diferencia) => {
    const comissio = comissioDe(m);
    aparella('R5', confianca, comissio ? [m, comissio] : [m], [f], {
      diferencia,
      tipusCanvi: arrodonix(Math.abs(m.centims) / Math.abs(f.total)),
      ...(comissio ? { comissio: comissio.centims } : {})
    });
  };
  for (const f of perData(llistaFactures)) {
    if (!enDivisa(f)) continue;
    const amb24 = movimentsLliures().filter((m) => signeCompatible(m, f) && m.divisa?.moneda === f.moneda
      && Math.abs(m.divisa.centims ?? 0) === Math.abs(f.total) && dinsFinestra(m, f, FINESTRES.compra));
    if (amb24.length > 0) aparellaDivisa(f, mesProper(amb24, (m) => diesDe(m, f)), 'alta', 0);
  }

  /* R3 · import exacte dins de la finestra, amb la contrapart contra el registre de proveïdors. */
  for (const m of ordenats) {
    if (!lliuresM.has(m) || m.divisa) continue;
    const valides = facturesLliures()
      .filter((f) => enEuros(f) && importEsperat(f) === m.centims && dinsFinestra(m, f, FINESTRES.compra))
      .map((f) => ({ f, acord: acord(m, f) }))
      .filter(({ acord: a }) => a !== 'diferent');
    const iguals = valides.filter(({ acord: a }) => a === 'igual').map(({ f }) => f);
    if (iguals.length > 0) aparella('R3', 'alta', [m], [mesProper(iguals, (f) => diesDe(m, f))]);
    else if (valides.length === 1) aparella('R3', 'mitjana', [m], [valides[0].f]);
    else if (valides.length > 1) {
      incidencia('AMBIGUITAT', 'mitjana',
        `El moviment ${quin(m)} té el mateix import que ${valides.length} factures dels mateixos dies: tria-la a mà.`, refMoviment(m));
    }
  }

  /* R1 i R4 sense l'import exacte · el moviment torna a estar lliure i s'endú les citades que encara ho són. */
  for (const { m, citades } of citacionsSenseImport) {
    lliuresM.add(m);
    const lliures = citades.filter((f) => lliuresF.has(f));
    if (lliures.length > 0) avisaDiferencia(aparella(lliures.length === 1 ? 'R1' : 'R4', 'mitjana', [m], perData(lliures)), m);
  }

  /* R5 sense 24 · l'únic càrrec de la finestra del mateix proveïdor o amb comissió de compra a l'estranger. */
  for (const f of llistaFactures) {
    if (!enDivisa(f)) continue;
    const senyals = movimentsLliures()
      .filter((m) => !m.divisa && signeCompatible(m, f) && dinsFinestra(m, f, FINESTRES.compra))
      .map((m) => ({ m, delProveidor: acord(m, f) === 'igual', ambComissio: comissioDe(m) !== null }))
      .filter(({ delProveidor, ambComissio }) => delProveidor || ambComissio);
    if (senyals.length === 1) aparellaDivisa(f, senyals[0].m, senyals[0].delProveidor ? 'mitjana' : 'baixa', null);
    else if (senyals.length > 1) {
      incidencia('AMBIGUITAT', 'mitjana',
        `La factura ${nomFactura(f)} en ${f.moneda} pot ser ${senyals.length} càrrecs dels mateixos dies: tria’l a mà.`, refFactura(f));
    }
  }

  /* R4 per proveïdor · un càrrec que paga diverses factures del mateix creditor o proveïdor. */
  for (const m of ordenats) {
    if (!lliuresM.has(m) || m.divisa) continue;
    const identitat = deMoviment(m);
    if (!identitat.cif && !identitat.clau) continue;
    const delProveidor = facturesLliures().filter((f) => enEuros(f) && importEsperat(f) !== null && signeCompatible(m, f)
      && dinsFinestra(m, f, FINESTRES.agrupada) && mateixProveidor(m, f));
    if (delProveidor.length < 2) continue;
    const propers = [...delProveidor].sort((x, y) => Math.abs(diesDe(m, x)) - Math.abs(diesDe(m, y))).slice(0, MAX_CANDIDATS_SUBCONJUNT);
    const exactes = subconjuntsQueSumen(propers, importEsperat, m.centims, 2);
    if (exactes.length === 1) aparella('R4', 'mitjana', [m], perData(exactes[0]));
    else if (exactes.length > 1) {
      incidencia('AMBIGUITAT', 'mitjana',
        `El moviment ${quin(m)} pot pagar ${exactes.length} combinacions diferents de factures del mateix proveïdor: tria-les a mà.`, refMoviment(m));
    }
  }

  /* R6 · rebuts que citen el número d'una factura. */
  for (const r of Array.isArray(rebuts) ? rebuts : []) {
    if (!r || typeof r !== 'object') continue;
    const tallat = tallaText([r.text, r.num, r.ruta].filter((t) => typeof t === 'string').join(' '));
    const citades = llistaFactures.filter((f) => claus.has(f) && citaClau(tallat, claus.get(f)));
    if (citades.length > 1) {
      incidencia('AMBIGUITAT', 'baixa', `El rebut ${nomRebut(r)} cita ${citades.length} factures: revisa’l a mà.`, r.ruta ? { fitxer: r.ruta } : {});
      continue;
    }
    if (citades.length === 0) continue;
    const [f] = citades;
    const diferencia = Number.isSafeInteger(r.import) && Number.isSafeInteger(f.total) ? Math.abs(r.import) - Math.abs(f.total) : null;
    parelles.push({ moviments: [], factures: [f], rebuts: [r], regla: 'R6', confianca: diferencia === 0 ? 'alta' : 'mitjana', diferencia });
    if (diferencia) {
      incidencia('IMPORT_DIFERENT', 'baixa',
        `El rebut ${nomRebut(r)} cita la factura ${nomFactura(f)}, però els imports no quadren: hi ha ${formatImport(diferencia)} de diferència.`, refFactura(f));
    }
  }

  const dinsDelRang = (d) => !rang || dinsDeRang(d, rang);
  return {
    parelles,
    movimentsSenseFactura: ordenats.filter((m) => lliuresM.has(m) && dinsDelRang(m.dataOperacio)),
    facturesSensePagament: llistaFactures.filter((f) => lliuresF.has(f) && (!esDataValida(f.data) || dinsDelRang(f.data))),
    incidencies
  };
}
