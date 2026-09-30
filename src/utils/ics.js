/**
 * ics.js — l'exportació iCalendar (RFC 5545), pura.
 *
 * T8 (ordre del Mestre, 260930) · Del model d'esdeveniment (esdeveniment.js)
 * a un text .ics que qualsevol calendari (Google, Apple, Thunderbird) pot
 * importar. Cap interfície el crida encara: quan el Mestre ho decidisca, una
 * «Descarrega .ics» només haurà de fer un Blob d'este text.
 *
 * Què es complix de l'RFC:
 *   · VCALENDAR amb VERSION:2.0, PRODID i CALSCALE:GREGORIAN; un VEVENT per
 *     esdeveniment, amb UID i DTSTAMP (UTC).
 *   · Tot el dia: DTSTART;VALUE=DATE i DTEND;VALUE=DATE (fi exclusiva).
 *   · Hora de paret: DTSTART;TZID=zona, i el VTIMEZONE de la zona. La taula
 *     només porta Europe/Madrid (la del poble); una altra zona va amb el TZID
 *     sol, que Google, Apple i Outlook resolen pel nom IANA (l'RFC demana el
 *     VTIMEZONE, §3.2.19: límit conegut). Un instant amb desfasament, en UTC.
 *   · Sense fi, la de fiEfectiva: tot el dia o una hora.
 *   · TEXT escapat (\\ \; \, \n) i línies plegades a 75 octets d'UTF-8, sense
 *     partir cap caràcter, amb CRLF.
 */
import { fiEfectiva, llegixDataHora } from './esdeveniment.js';
import { dosDigits } from './calendari.js';

export const PRODID_SDP = '-//Sóc de Poble//Calendari//CA';

const ESTAT_ICS = Object.freeze({ confirmat: 'CONFIRMED', provisional: 'TENTATIVE', cancellat: 'CANCELLED' });

/* Les regles d'estiu de la UE des de 1996: l'últim diumenge de març i
   d'octubre, a la 01:00 UTC. */
const VTIMEZONE = Object.freeze({
  'Europe/Madrid': Object.freeze([
    'BEGIN:VTIMEZONE', 'TZID:Europe/Madrid',
    'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST',
    'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
    'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET',
    'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
    'END:VTIMEZONE'
  ])
});

/** TEXT de l'RFC 5545 (§3.3.11): barra, punt i coma, coma i salts de línia. */
const escapa = (text) => String(text)
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');

const octets = (codi) => (codi < 0x80 ? 1 : codi < 0x800 ? 2 : codi < 0x10000 ? 3 : 4);

/** Plega una línia a 75 octets (§3.1): la continuació comença amb un espai. */
function plega(linia) {
  const trossos = [];
  let tros = '';
  let mida = 0;
  let limit = 75;
  for (const caracter of linia) { // per punts de codi: mai no parteix un caràcter UTF-8
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

/** 'AAAAMMDDThhmmssZ' d'un instant. */
function momentUtc(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${dosDigits(d.getUTCMonth() + 1)}${dosDigits(d.getUTCDate())}T${dosDigits(d.getUTCHours())}${dosDigits(d.getUTCMinutes())}${dosDigits(d.getUTCSeconds())}Z`;
}

const esHoraDeParet = (moment) => 'dataHora' in moment && !llegixDataHora(moment.dataHora).ambDesfas;

function propietatMoment(nom, moment) {
  if ('data' in moment) return `${nom};VALUE=DATE:${moment.data.replace(/-/g, '')}`;
  const p = llegixDataHora(moment.dataHora);
  if (p.ambDesfas) return `${nom}:${momentUtc(p.instant)}`;
  return `${nom};TZID=${moment.zona}:${p.any}${dosDigits(p.mes + 1)}${dosDigits(p.dia)}T${dosDigits(p.hora)}${dosDigits(p.minut)}${dosDigits(p.segon)}`;
}

/** URL absoluta de l'enllaç: tal qual si és http(s); una ruta pròpia, amb l'origen. */
function urlAbsoluta(enllac, origen) {
  if (!enllac) return null;
  if (/^https?:\/\//i.test(enllac)) return enllac;
  return origen ? `${origen.replace(/\/+$/, '')}${enllac}` : null;
}

function vevent(esd, segell, origen) {
  const linies = [
    'BEGIN:VEVENT',
    `UID:${escapa(esd.uid)}`,
    `DTSTAMP:${segell}`,
    propietatMoment('DTSTART', esd.inici),
    propietatMoment('DTEND', fiEfectiva(esd)),
    `SUMMARY:${escapa(esd.titol)}`
  ];
  if (esd.descripcio) linies.push(`DESCRIPTION:${escapa(esd.descripcio)}`);
  if (esd.lloc) linies.push(`LOCATION:${escapa(esd.lloc)}`);
  linies.push(`STATUS:${ESTAT_ICS[esd.estat]}`);
  for (const linia of esd.recurrencia ?? []) linies.push(/^FREQ=/i.test(linia) ? `RRULE:${linia}` : linia);
  const url = urlAbsoluta(esd.enllac, origen);
  if (url) linies.push(`URL:${url}`);
  if (esd.actualitzat) linies.push(`LAST-MODIFIED:${momentUtc(Date.parse(esd.actualitzat))}`);
  if (esd.font) {
    linies.push(`X-SDP-FONT:${escapa(esd.font.tipus)}`);
    if (esd.font.id) linies.push(`X-SDP-ID:${escapa(esd.font.id)}`);
    if (esd.font.ruta) linies.push(`X-SDP-RUTA:${escapa(esd.font.ruta)}`);
  }
  linies.push('END:VEVENT');
  return linies;
}

/**
 * Els esdeveniments (creaEsdeveniment) en un text .ics. Opcions: `prodid`,
 * `ara` (el DTSTAMP; per defecte, ara) i `origen` ('https://socdepoble.org')
 * per a fer absolutes les rutes pròpies de l'enllaç (URL no admet rutes).
 */
export function aIcs(esdeveniments, { prodid = PRODID_SDP, ara = new Date(), origen = null } = {}) {
  const actes = (esdeveniments ?? []).filter(Boolean);
  const segell = momentUtc(ara.getTime());
  const zones = new Set(actes.flatMap((esd) => [esd.inici, fiEfectiva(esd)]).filter(esHoraDeParet).map((m) => m.zona));
  const linies = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${prodid}`, 'CALSCALE:GREGORIAN'];
  for (const zona of zones) if (VTIMEZONE[zona]) linies.push(...VTIMEZONE[zona]);
  for (const esd of actes) linies.push(...vevent(esd, segell, origen));
  linies.push('END:VCALENDAR');
  return `${linies.map(plega).join('\r\n')}\r\n`;
}
