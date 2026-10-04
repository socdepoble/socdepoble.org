/**
 * icsTerminis.js — el generador .ics PROPI de Burocràcia (RFC 5545).
 *
 * La persona descarrega este text i l'importa a mà al seu calendari
 * personal; el calendari públic no mostra mai cap termini. La Gestoria no
 * importa src/utils/ics.js (la frontera de privacitat.test.js li ho veta), i
 * este generador és més estret a propòsit:
 *   · Només llig `id`, `venciment` i `categoria` de cada element. Qualsevol
 *     altre camp (noms, imports, organisme, model, notes) s'ignora: no hi ha
 *     cap camí perquè isca de l'ordinador dins del calendari.
 *   · Títols GENÈRICS d'una llista tancada per categoria («Termini fiscal»).
 *   · UID opac i estable: una empremta FNV-1a NOMÉS de l'id de l'ocurrència
 *     (mai del venciment), perquè tornar a importar després d'un canvi de
 *     data (un festiu carregat que la corre) actualitze l'acte en lloc de
 *     duplicar-lo. Si la llista porta dues vegades el mateix id, queda la
 *     data més primerenca: mai la posterior.
 *   · Acte de tot el dia, privat (CLASS:PRIVATE) i que no ocupa l'agenda
 *     (TRANSP:TRANSPARENT), amb un avís (VALARM) a 15, 7 i 2 dies.
 *   · TEXT escapat i línies plegades a 75 octets d'UTF-8, amb CRLF.
 * JS pur: sense DOM, React ni xarxa.
 */
import { errorAmbCodi, esDataIso } from '../../identitat/nucli/guardes.js';
import { LLINDARS } from './avisos.js';
import { sumaDies } from './terminis.js';

export const PRODID_TERMINIS = '-//Sóc de Poble//Gestoria · terminis//CA';
export const TITOL_GENERIC = 'Termini';
export const DESCRIPCIO_GENERICA = 'Obri Sóc de Poble per a vore el detall.';
export const TITOLS = Object.freeze({
  fiscal: 'Termini fiscal',
  cotitzacio: 'Termini de cotització',
  'tributs-locals': 'Termini de tributs locals',
  'propietat-industrial': 'Termini de propietat industrial',
  expedient: 'Termini d’expedient',
  administratiu: 'Termini administratiu'
});

/* TEXT de l'RFC 5545 (§3.3.11): barra, punt i coma, coma i salts de línia;
   la resta de caràcters de control, fora. */
const escapa = (text) => String(text)
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

const octets = (codi) => (codi < 0x80 ? 1 : codi < 0x800 ? 2 : codi < 0x10000 ? 3 : 4);

/* Plega una línia a 75 octets (§3.1), per punts de codi: mai no parteix un caràcter. */
function plega(linia) {
  const trossos = [];
  let tros = '';
  let mida = 0;
  let limit = 75;
  for (const caracter of linia) {
    const n = octets(caracter.codePointAt(0));
    if (mida + n > limit) {
      trossos.push(tros);
      tros = '';
      mida = 0;
      limit = 74;
    }
    tros += caracter;
    mida += n;
  }
  trossos.push(tros);
  return trossos.join('\r\n ');
}

/* FNV-1a de 32 bits sobre els punts de codi del text, en hexadecimal. */
function fnv1a(text, llavor) {
  let h = llavor >>> 0;
  for (const caracter of text) {
    h ^= caracter.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** L'UID d'un termini: opac, estable i sense res de l'id llegible. Només depén de l'id. */
export function uidDeTermini(id) {
  const clau = String(id);
  return `${fnv1a(clau, 2166136261)}${fnv1a(clau, 16777619)}-termini@socdepoble`;
}

const dosXifres = (n) => String(n).padStart(2, '0');
const dataIcs = (iso) => iso.replace(/-/g, '');

function segellUtc(ara) {
  if (!(ara instanceof Date) || Number.isNaN(ara.getTime())) throw new TypeError('`ara` ha de ser una data vàlida.');
  return `${String(ara.getUTCFullYear()).padStart(4, '0')}${dosXifres(ara.getUTCMonth() + 1)}${dosXifres(ara.getUTCDate())}T${dosXifres(ara.getUTCHours())}${dosXifres(ara.getUTCMinutes())}${dosXifres(ara.getUTCSeconds())}Z`;
}

function vevent({ uid, venciment, titol }, segell, llindars) {
  const linies = [
    'BEGIN:VEVENT', `UID:${escapa(uid)}`, `DTSTAMP:${segell}`,
    `DTSTART;VALUE=DATE:${dataIcs(venciment)}`, `DTEND;VALUE=DATE:${dataIcs(sumaDies(venciment, 1))}`,
    `SUMMARY:${escapa(titol)}`, `DESCRIPTION:${escapa(DESCRIPCIO_GENERICA)}`, 'CLASS:PRIVATE', 'TRANSP:TRANSPARENT'
  ];
  for (const dies of llindars) linies.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapa(titol)}`, `TRIGGER:-P${dies}D`, 'END:VALARM');
  linies.push('END:VEVENT');
  return linies;
}

/**
 * Els terminis en un text .ics. Se salten els que no tenen venciment
 * (pendents) i els complits; un venciment que no és una data és un error.
 * @param {Array<{ id: string, venciment: string|null, categoria?: string, complit?: boolean }>} elements
 * @param {{ ara?: Date, llindars?: number[] }} opcions `ara` és el DTSTAMP
 * @returns {string}
 */
export function icsDeTerminis(elements, { ara = new Date(), llindars = LLINDARS } = {}) {
  if (!Array.isArray(elements)) throw new TypeError('Cal la llista de terminis.');
  if (!Array.isArray(llindars) || !llindars.every((n) => Number.isInteger(n) && n > 0 && n <= 366)) {
    throw new RangeError('Els llindars són enters entre 1 i 366.');
  }
  const segell = segellUtc(ara);
  const actes = new Map();
  for (const element of elements) {
    if (!element || element.complit === true || element.venciment == null) continue;
    if (!esDataIso(element.venciment)) throw errorAmbCodi('VENCIMENT_INVALID', 'Un termini porta un venciment que no és una data «aaaa-mm-dd».');
    if (typeof element.id !== 'string' || element.id === '') throw errorAmbCodi('ID_INVALID', 'Cada termini porta un id.');
    const uid = uidDeTermini(element.id);
    const previ = actes.get(uid);
    if (previ && previ.venciment <= element.venciment) continue;
    const titol = Object.hasOwn(TITOLS, element.categoria ?? '') ? TITOLS[element.categoria] : TITOL_GENERIC;
    actes.set(uid, { uid, venciment: element.venciment, titol });
  }
  const ordenats = [...actes.values()].sort((x, y) => (x.venciment < y.venciment ? -1 : x.venciment > y.venciment ? 1 : x.uid < y.uid ? -1 : 1));
  const alarmes = [...new Set(llindars)].sort((a, b) => b - a);
  const linies = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${PRODID_TERMINIS}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const acte of ordenats) linies.push(...vevent(acte, segell, alarmes));
  linies.push('END:VCALENDAR');
  return `${linies.map(plega).join('\r\n')}\r\n`;
}
