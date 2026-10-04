/**
 * serie.js — numeració correlativa de les factures emeses, per sèrie i any.
 *
 * Una sèrie és un prefix de lletres («A» per a les completes, «T» per als
 * tiquets, «R» per a les rectificatives, que el Reglament de facturació vol
 * en sèrie pròpia) i recomença cada any. El número que veu Hisenda és
 * «PREFIXAAAA-NNNN»: «A2026-0001». Sense forats: el següent és sempre
 * l'últim més u, i un número anul·lat no es torna a fer servir (el registre
 * d'anul·lació queda al llibre i explica el salt).
 *
 * forats() aplica la regla estricta a una sèrie pròpia. És la germana de la
 * comprovació FORAT_NUMERACIO de nucli/auditoria.js, que és heurística (una
 * sèrie ha de ser densa per a dir-hi res) perquè llig factures de carpetes
 * alienes; ací la sèrie la porta este programa i tot salt és una incidència.
 *
 * La sèrie de l'eina externa (decisió del Mestre del 261004). Les factures
 * emeses abans del pas a Veri*Factu porten «F»+AA+NNNN, contínua des de 2023 i
 * pintada «F26 0001», «F260001» o amb un coixinet davant. Queda com a LLEGAT
 * TANCAT: el programa obri una sèrie NOVA el dia del pas (la seua, per defecte
 * «A2027-0001»), no en continua cap del llegat i comprovaEmissio refusa emetre
 * en una sèrie que s'hi puga confondre (mateix prefix i any) o abans de la
 * data de pas, que és configuració (configEmpresa.js), mai codi. Les formes
 * del llegat es reconeixen, compactes (sense espais ni coixinet), només per a
 * l'auditoria de forats (llegat.js). Qui aplica esta política a cada alta és
 * el cas d'ús d'emissió (emissio.js); el registre fiscal no la coneix.
 * JS pur: sense DOM, React ni xarxa.
 */
import { errorAmbCodi, esDataIso } from './comu.js';

const PREFIX = /^[A-Z]{1,10}$/;
const NUM_SERIE = /^([A-Z]{1,10})(\d{4})-(\d{4,9})$/;
/* La sèrie de l'eina externa, compacta: prefix, l'any amb dues xifres i el número, sense guionet. */
const NUM_SERIE_LLEGAT = /^([A-Z]{1,10})(\d{2})(\d{4,9})$/;
const AMPLADA = 4;
const MAX_NUMERO = 999999999;
export const MAX_ABSENTS_LLISTATS = 1000;

/* El prefix que recomanem per a cada tipus de factura: la UI el proposa i la persona el pot canviar. */
export const PREFIX_RECOMANAT = Object.freeze({
  F1: 'A', F3: 'A', F2: 'T', R1: 'R', R2: 'R', R3: 'R', R4: 'R', R5: 'RT'
});

/* El prefix ha de ser un text: RegExp.test() convertiria una llista ['F'] o un
   new String('F') en «F», i després la comparació estricta amb els números ja
   usats no en trobaria cap (seguentNumSerie proposaria un número repetit). */
function comprovaSerie({ prefix, any }) {
  if (typeof prefix !== 'string' || !PREFIX.test(prefix)) throw errorAmbCodi('SERIE_INVALIDA', 'El prefix de la sèrie són d\'1 a 10 lletres majúscules (A-Z).');
  if (!Number.isInteger(any) || any < 2000 || any > 9999) throw errorAmbCodi('SERIE_INVALIDA', 'L\'any de la sèrie ha de tindre quatre xifres.');
}

/* Una entrada de la llista de sèries del llegat: { prefix, any }, amb un
   prefix de lletres majúscules i l'any sencer (2026, no 26), com les que
   torna sembraLlegat. Un número pintat («F26 0001») no ho és: primer es
   passa per sembraLlegat. */
const esSerieDelLlegat = (s) => s !== null && typeof s === 'object' && typeof s.prefix === 'string' && PREFIX.test(s.prefix)
  && Number.isInteger(s.any) && s.any >= 2000 && s.any <= 9999;

/**
 * El número de sèrie d'una factura: numSerie({ prefix: 'A', any: 2026, numero: 1 }) → 'A2026-0001'.
 * @param {{ prefix: string, any: number, numero: number }} p
 * @returns {string}
 */
export function numSerie({ prefix, any, numero }) {
  comprovaSerie({ prefix, any });
  if (!Number.isInteger(numero) || numero < 1 || numero > MAX_NUMERO) {
    throw errorAmbCodi('SERIE_INVALIDA', `El número de la factura és un enter entre 1 i ${MAX_NUMERO}.`);
  }
  return `${prefix}${any}-${String(numero).padStart(AMPLADA, '0')}`;
}

/**
 * Les parts d'un número de sèrie d'este programa, o null si no ho és.
 * Només admet la forma canònica: 'A2026-1' o 'A2026-00001' no ho són.
 * @param {string} text
 * @returns {{ prefix: string, any: number, numero: number }|null}
 */
export function llegixNumSerie(text) {
  const r = typeof text === 'string' ? NUM_SERIE.exec(text) : null;
  if (!r) return null;
  const parts = { prefix: r[1], any: Number(r[2]), numero: Number(r[3]) };
  /* Un any d'abans de 2000 no és d'esta sèrie: es descarta abans que numSerie() llance. */
  return parts.numero >= 1 && parts.any >= 2000 && numSerie(parts) === text ? parts : null;
}

/* Un número de factura sense espais ni coixinet, en majúscules: la forma en què
   es comparen els del llegat («F26 0001» i «F260001» són el mateix número). */
export const compacta = (text) => (typeof text === 'string' ? text.replace(/[\s#]+/g, '').toUpperCase() : '');

/**
 * Les parts d'un número de la sèrie de l'eina externa («F»+AA+NNNN), o null si no ho és.
 * Admet les formes pintades: amb espais, amb un coixinet davant o compacta.
 * Un número d'este programa no ho és mai: «A2026-0001» porta guionet.
 * @param {string} text
 * @returns {{ prefix: string, any: number, numero: number }|null}
 */
export function llegixNumSerieLlegat(text) {
  const r = NUM_SERIE_LLEGAT.exec(compacta(text));
  if (!r) return null;
  const numero = Number(r[3]);
  return numero >= 1 && numero <= MAX_NUMERO ? { prefix: r[1], any: 2000 + Number(r[2]), numero } : null;
}

/**
 * La llista de sèries tancades d'un llegat (la de sembraLlegat o una llista de
 * { prefix, any }), comprovada sencera. Llança TypeError si el llegat no és una
 * llista o alguna entrada no és una sèrie ben formada: una entrada mal formada
 * no s'ignora, perquè deixaria passar la sèrie confusa sense cap avís.
 * @param {{ series: object[] }|object[]} llegat
 * @returns {ReadonlyArray<{ prefix: string, any: number }>}
 */
export function seriesDelLlegat(llegat) {
  const series = Array.isArray(llegat) ? llegat : llegat?.series;
  if (!Array.isArray(series)) throw new TypeError('El llegat és la llista de sèries de l\'eina externa o el resultat de sembraLlegat.');
  const malFormada = series.findIndex((s) => !esSerieDelLlegat(s));
  if (malFormada !== -1) {
    throw new TypeError(`L'entrada ${malFormada + 1} del llegat no és una sèrie { prefix, any }: un prefix de lletres majúscules i l'any de quatre xifres (passa els números per sembraLlegat).`);
  }
  return series;
}

/**
 * Comprova que el programa pot emetre en esta sèrie. Llança:
 *   · SERIE_CONFUSA, si el llegat té una sèrie amb el mateix prefix i el mateix
 *     any: el programa i l'eina externa no comparteixen mai una sèrie, i la
 *     del llegat queda tancada;
 *   · ABANS_DEL_PAS, si hi ha data de pas i la factura és d'abans: fins
 *     aleshores factura l'eina externa, i dos programes no emeten alhora;
 *   · TypeError, si el llegat no és una llista o alguna entrada no és una
 *     sèrie { prefix, any } ben formada (el llegat no es llig a mitges).
 * @param {{ prefix: string, any: number }} serie
 * @param {object} [opcions]
 * @param {{ series: { prefix: string, any: number }[] }|{ prefix: string, any: number }[]} [opcions.llegat]
 *   el de sembraLlegat (llegat.js) o la llista de sèries de l'eina externa
 * @param {string|null} [opcions.dataPas] la de la configuració de l'empresa, si ja està decidida
 * @param {string} [opcions.dataExpedicio] la de la factura que es vol emetre
 */
export function comprovaEmissio(serie, { llegat = [], dataPas = null, dataExpedicio } = {}) {
  comprovaSerie(serie ?? {});
  const series = seriesDelLlegat(llegat);
  if (series.some((s) => s.prefix === serie.prefix && s.any === serie.any)) {
    throw errorAmbCodi('SERIE_CONFUSA', `La sèrie ${serie.prefix}${serie.any} es confondria amb la ${serie.prefix}${String(serie.any).slice(2)} `
      + 'de l\'eina externa, que queda tancada: tria un altre prefix per a les factures del programa.');
  }
  if (dataPas === null || dataPas === undefined) return;
  if (!esDataIso(dataPas)) throw errorAmbCodi('SERIE_INVALIDA', 'La data de pas a Veri*Factu és una data «aaaa-mm-dd».');
  if (!esDataIso(dataExpedicio)) throw errorAmbCodi('SERIE_INVALIDA', 'Amb data de pas, cal la data d\'expedició per a saber qui emet la factura.');
  if (dataExpedicio < dataPas) {
    throw errorAmbCodi('ABANS_DEL_PAS', `Fins al ${dataPas} factura l'eina externa: el programa no emet cap factura d'abans del pas.`);
  }
}

/* Els números d'una sèrie (prefix i any) que apareixen en una llista de números de sèrie. */
function numerosDe(usats, { prefix, any }) {
  if (!Array.isArray(usats)) throw new TypeError('Cal la llista dels números de sèrie ja registrats.');
  return usats.map(llegixNumSerie).filter((p) => p && p.prefix === prefix && p.any === any).map((p) => p.numero);
}

/**
 * El número següent d'una sèrie: l'últim registrat (alta o anul·lada) més u.
 * Si la sèrie té forats o repetits no en proposa cap: primer s'ha d'explicar el salt.
 * Abans, comprovaEmissio: amb el llegat i la data de pas, mai una sèrie que es
 * confonga amb la de l'eina externa ni una factura d'abans del pas.
 * @param {string[]} usats números de sèrie de TOTS els registres d'alta del llibre
 * @param {{ prefix: string, any: number }} serie
 * @param {{ llegat?: object, dataPas?: string|null, dataExpedicio?: string }} [opcions] les de comprovaEmissio
 * @returns {string}
 */
export function seguentNumSerie(usats, serie, opcions) {
  comprovaEmissio(serie, opcions);
  const { absents, nombreAbsents, repetits, ultim } = forats(usats, serie);
  if (nombreAbsents || repetits.length) {
    throw errorAmbCodi('SERIE_AMB_FORATS', `La sèrie ${serie.prefix}${serie.any} no és correlativa: revisa-la abans d'emetre'n cap més.`, { absents, nombreAbsents, repetits });
  }
  return numSerie({ ...serie, numero: ultim + 1 });
}

/**
 * Els números absents (de l'1 a l'últim) i els repetits d'una sèrie pròpia.
 * La llista d'absents es talla als primers MAX_ABSENTS_LLISTATS; el compte és sencer.
 * @param {string[]} usats
 * @param {{ prefix: string, any: number }} serie
 * @returns {{ absents: number[], nombreAbsents: number, repetits: number[], ultim: number }}
 */
export function forats(usats, serie) {
  comprovaSerie(serie);
  return foratsDeNumeros(numerosDe(usats, serie));
}

/**
 * Els absents (de l'1 a l'últim) i els repetits d'una llista de números d'una
 * mateixa sèrie, ja llegits: la fan servir forats() i l'auditoria del llegat.
 * @param {number[]} numeros enters positius
 * @returns {{ absents: number[], nombreAbsents: number, repetits: number[], ultim: number }}
 */
export function foratsDeNumeros(numeros) {
  const vistos = new Set();
  const repetits = new Set();
  for (const n of numeros) {
    if (vistos.has(n)) repetits.add(n);
    vistos.add(n);
  }
  /* Es recorren els salts entre números consecutius, no tot el rang: un número altíssim no penja res. */
  const absents = [];
  let nombreAbsents = 0;
  let anterior = 0;
  for (const n of [...vistos].sort((a, b) => a - b)) {
    for (let k = anterior + 1; k < n && absents.length < MAX_ABSENTS_LLISTATS; k += 1) absents.push(k);
    nombreAbsents += n - anterior - 1;
    anterior = n;
  }
  return { absents, nombreAbsents, repetits: [...repetits].sort((a, b) => a - b), ultim: anterior };
}
