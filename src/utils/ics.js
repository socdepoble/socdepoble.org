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
 *     VTIMEZONE, §3.2.19: límit conegut). Un instant amb desfasament, en UTC;
 *     el d'un acte repetit, en hora de paret de la seua zona si en tenim el
 *     VTIMEZONE: la RRULE s'expandix en la zona de DTSTART (§3.3.10).
 *   · Sense fi, la de fiEfectiva: tot el dia o una hora. Una fi igual a
 *     l'inici no s'escriu: DTEND ha de ser posterior (§3.8.2.2).
 *   · TEXT escapat (\\ \; \, \n) i sense caràcters de control, i línies
 *     plegades a 75 octets d'UTF-8, sense partir cap caràcter, amb CRLF.
 */
import { fiEfectiva, instantEnLaZona, llegixDataHora, xifresEnZona } from './esdeveniment.js';
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

/**
 * TEXT de l'RFC 5545 (§3.3.11): barra, punt i coma, coma i salts de línia.
 * Els altres caràcters de control, que TEXT no admet (llevat de la
 * tabulació), s'eliminen.
 */
const escapa = (text) => String(text)
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

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

/* L'any, sempre amb quatre xifres (date-fullyear, §3.3.4): el model admet
   l'1-1-1000, i amb un desfasament positiu el seu instant cau en el 999. */
const quatreXifres = (any) => String(any).padStart(4, '0');

/** 'AAAAMMDDThhmmssZ' d'un instant. */
function momentUtc(ms) {
  const d = new Date(ms);
  return `${quatreXifres(d.getUTCFullYear())}${dosDigits(d.getUTCMonth() + 1)}${dosDigits(d.getUTCDate())}T${dosDigits(d.getUTCHours())}${dosDigits(d.getUTCMinutes())}${dosDigits(d.getUTCSeconds())}Z`;
}

/**
 * La zona del TZID amb què s'escriu un moment, o null (de data, o en UTC).
 * Una hora de paret, la seua. Un instant, en UTC, llevat del d'un acte repetit
 * si tenim el VTIMEZONE de la zona: en UTC, la RRULE es repetiria a la mateixa
 * hora UTC, l'acte es desplaçaria una hora en passar el canvi d'hora i el
 * BYDAY podria caure l'endemà.
 */
function zonaTzid(moment, repetit) {
  const p = llegixDataHora(moment.dataHora);
  if (!p) return null;
  if (!p.ambDesfas) return moment.zona;
  return repetit && VTIMEZONE[moment.zona] ? moment.zona : null;
}

/** 'AAAAMMDDThhmmss' d'unes xifres (mes de 0 a 11). */
const xifres = (x) => `${quatreXifres(x.any)}${dosDigits(x.mes + 1)}${dosDigits(x.dia)}T${dosDigits(x.hora)}${dosDigits(x.minut)}${dosDigits(x.segon)}`;

function propietatMoment(nom, moment, repetit) {
  if ('data' in moment) return `${nom};VALUE=DATE:${moment.data.replace(/-/g, '')}`;
  const p = llegixDataHora(moment.dataHora);
  const zona = zonaTzid(moment, repetit);
  if (!zona) return `${nom}:${momentUtc(p.instant)}`;
  return `${nom};TZID=${zona}:${xifres(p.ambDesfas ? xifresEnZona(p.instant, zona) : p)}`;
}

/* Els moments que s'escriuen: DTSTART i, si dura, DTEND. Una fi igual a
   l'inici no s'escriu (DTEND ha de ser posterior, §3.8.2.2): sense DTEND,
   l'acte acaba on comença (§3.6.1). */
function momentsDe(esd) {
  const fi = fiEfectiva(esd);
  const senseDurada = Boolean(esd.fi) && 'dataHora' in esd.fi && instantEnLaZona(esd.fi) === instantEnLaZona(esd.inici);
  return senseDurada ? [esd.inici] : [esd.inici, fi];
}

/** URL absoluta de l'enllaç: tal qual si és http(s); una ruta pròpia, amb l'origen. */
function urlAbsoluta(enllac, origen) {
  if (!enllac) return null;
  if (/^https?:\/\//i.test(enllac)) return enllac;
  return origen ? `${origen.replace(/\/+$/, '')}${enllac}` : null;
}

function vevent(esd, segell, origen) {
  const [inici, fi] = momentsDe(esd);
  const repetit = Boolean(esd.recurrencia);
  const linies = ['BEGIN:VEVENT', `UID:${escapa(esd.uid)}`, `DTSTAMP:${segell}`, propietatMoment('DTSTART', inici, repetit)];
  if (fi) linies.push(propietatMoment('DTEND', fi, repetit));
  linies.push(`SUMMARY:${escapa(esd.titol)}`);
  if (esd.descripcio) linies.push(`DESCRIPTION:${escapa(esd.descripcio)}`);
  if (esd.lloc) linies.push(`LOCATION:${escapa(esd.lloc)}`);
  linies.push(`STATUS:${ESTAT_ICS[esd.estat]}`);
  // El model ja les guarda en la forma de l'RFC, i només les de recurrència.
  linies.push(...(esd.recurrencia ?? []));
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
  const zones = new Set(actes.flatMap((esd) => momentsDe(esd).map((m) => zonaTzid(m, Boolean(esd.recurrencia)))).filter(Boolean));
  const linies = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${prodid}`, 'CALSCALE:GREGORIAN'];
  for (const zona of zones) if (VTIMEZONE[zona]) linies.push(...VTIMEZONE[zona]);
  for (const esd of actes) linies.push(...vevent(esd, segell, origen));
  linies.push('END:VCALENDAR');
  return `${linies.map(plega).join('\r\n')}\r\n`;
}
