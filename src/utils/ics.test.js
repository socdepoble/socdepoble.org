/* T8 (ordre del Mestre, 260930) · L'exportació .ics segons l'RFC 5545. */
import { describe, expect, test } from 'vitest';
import { PRODID_SDP, aIcs } from './ics.js';
import { creaEsdeveniment, deGoogleCalendar } from './esdeveniment.js';

const ARA = new Date(Date.UTC(2026, 8, 30, 10, 0, 0));
const aplec = creaEsdeveniment({
  id: 'aplec-2023', titol: '2n Aplec pel Territori', inici: { data: '2023-01-29' },
  font: { tipus: 'mur', id: 'aplec-2023', ruta: '/events/aplec-2023' }, enllac: '/events/aplec-2023'
});
/** Les línies lògiques (desplegades) del text. */
const logiques = (ics) => ics.replace(/\r\n /g, '').split('\r\n');

describe('aIcs', () => {
  test('VCALENDAR 2.0 amb PRODID, un VEVENT amb UID i DTSTAMP, CRLF i tot el dia en VALUE=DATE', () => {
    const ics = aIcs([aplec], { ara: ARA, origen: 'https://socdepoble.org/' });
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    expect(logiques(ics)).toEqual([
      'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${PRODID_SDP}`, 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:mur:aplec-2023@socdepoble.org',
      'DTSTAMP:20260930T100000Z',
      'DTSTART;VALUE=DATE:20230129',
      'DTEND;VALUE=DATE:20230130',
      'SUMMARY:2n Aplec pel Territori',
      'STATUS:CONFIRMED',
      'URL:https://socdepoble.org/events/aplec-2023',
      'X-SDP-FONT:mur', 'X-SDP-ID:aplec-2023', 'X-SDP-RUTA:/events/aplec-2023',
      'END:VEVENT', 'END:VCALENDAR', ''
    ]);
    expect(aIcs([aplec], { ara: ARA })).not.toContain('URL:');
  });

  test('hora de paret: TZID i el VTIMEZONE del poble (una sola vegada); un instant, en UTC; sense fi, una hora', () => {
    const concert = creaEsdeveniment({ id: 'c', titol: 'Concert', inici: { dataHora: '2026-10-01T18:30' }, recurrencia: ['FREQ=WEEKLY;BYDAY=TH'] });
    const reunio = creaEsdeveniment({
      id: 'r', titol: 'Reunió', inici: { dataHora: '2026-10-02T10:00:00+02:00' }, fi: { dataHora: '2026-10-02T12:00:00+02:00' },
      estat: 'provisional', actualitzat: '2026-09-29T08:00:00.000Z'
    });
    const linies = logiques(aIcs([concert, reunio, concert], { ara: ARA }));
    expect(linies.filter((l) => l === 'BEGIN:VTIMEZONE')).toHaveLength(1);
    expect(linies).toContain('TZID:Europe/Madrid');
    expect(linies).toContain('DTSTART;TZID=Europe/Madrid:20261001T183000');
    expect(linies).toContain('DTEND;TZID=Europe/Madrid:20261001T193000');
    expect(linies).toContain('RRULE:FREQ=WEEKLY;BYDAY=TH');
    expect(linies).toContain('DTSTART:20261002T080000Z');
    expect(linies).toContain('DTEND:20261002T100000Z');
    expect(linies).toContain('STATUS:TENTATIVE');
    expect(linies).toContain('LAST-MODIFIED:20260929T080000Z');
    // Només instants: cap VTIMEZONE.
    expect(aIcs([reunio], { ara: ARA })).not.toContain('VTIMEZONE');
  });

  test('un acte repetit amb desfasament va en hora de paret de la seua zona, amb el VTIMEZONE', () => {
    // El recurs tal com arriba de Google: després del 25-10 ha de continuar a les 10:00 de Madrid.
    const setmanal = deGoogleCalendar({
      id: '5l3jdo2k8b', iCalUID: '5l3jdo2k8b@google.com', start: { dateTime: '2026-10-01T10:00:00+02:00', timeZone: 'Europe/Madrid' },
      end: { dateTime: '2026-10-01T12:00:00+02:00' }, recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TH']
    });
    const linies = logiques(aIcs([setmanal], { ara: ARA }));
    expect(linies).toContain('TZID:Europe/Madrid');
    expect(linies).toContain('DTSTART;TZID=Europe/Madrid:20261001T100000');
    expect(linies).toContain('DTEND;TZID=Europe/Madrid:20261001T120000');
    const repetit = (dataHora, zona) => creaEsdeveniment({ id: 'n', titol: 'Nit', inici: { dataHora, zona }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=TH'] });
    // La 01:00 del dijous és dimecres en UTC; en la zona, el BYDAY no canvia de dia.
    expect(logiques(aIcs([repetit('2026-10-01T01:00:00+02:00')], { ara: ARA }))).toContain('DTSTART;TZID=Europe/Madrid:20261001T010000');
    // L'hora de paret és la de l'instant en la zona, no la de les xifres.
    expect(logiques(aIcs([repetit('2026-10-01T08:00:00Z')], { ara: ARA }))).toContain('DTSTART;TZID=Europe/Madrid:20261001T100000');
    // Sense el VTIMEZONE de la zona, en UTC, com un acte que no es repetix.
    const nova = logiques(aIcs([repetit('2026-10-01T10:00:00-04:00', 'America/New_York')], { ara: ARA }));
    expect(nova).toContain('DTSTART:20261001T140000Z');
    expect(nova).not.toContain('BEGIN:VTIMEZONE');
  });

  test('una fi igual a l’inici no escriu DTEND, que ha de ser posterior (§3.8.2.2)', () => {
    const toc = creaEsdeveniment({ id: 't', titol: 'Toc', inici: { dataHora: '2026-10-01T10:00' }, fi: { dataHora: '2026-10-01T10:00' } });
    const instant = creaEsdeveniment({ id: 'i', titol: 'Toc', inici: { dataHora: '2026-10-01T10:00:00+02:00' }, fi: { dataHora: '2026-10-01T08:00:00Z' } });
    const linies = logiques(aIcs([toc, instant], { ara: ARA }));
    expect(linies).toContain('DTSTART;TZID=Europe/Madrid:20261001T100000');
    expect(linies).toContain('DTSTART:20261001T080000Z');
    expect(linies.some((l) => l.startsWith('DTEND'))).toBe(false);
  });

  test('l’any 9998 a les 23:30: la fi, en el 9999, s’escriu sense petar', () => {
    const darrer = creaEsdeveniment({ id: 'd', titol: 'Cap d’any', inici: { dataHora: '9998-12-31T23:30' } });
    expect(logiques(aIcs([darrer], { ara: ARA }))).toContain('DTEND;TZID=Europe/Madrid:99990101T003000');
  });

  test('l’1-1-1000 amb desfasament positiu cau en el 999: l’any, amb quatre xifres (date-fullyear, §3.3.4)', () => {
    const primer = creaEsdeveniment({ id: 'p', titol: 'Cap d’any', inici: { dataHora: '1000-01-01T00:30+01:00' } });
    const linies = logiques(aIcs([primer], { ara: ARA }));
    expect(linies).toContain('DTSTART:09991231T233000Z');
    expect(linies).toContain('DTEND:10000101T003000Z');
    // Repetit, en hora de paret de Madrid: siga quin siga el desfasament de la zona en el 999, cau el 31-12.
    const repetit = creaEsdeveniment({ id: 'q', titol: 'Cap d’any', inici: { dataHora: '1000-01-01T00:30+05:00' }, recurrencia: ['RRULE:FREQ=WEEKLY'] });
    expect(logiques(aIcs([repetit], { ara: ARA }))).toContainEqual(expect.stringMatching(/^DTSTART;TZID=Europe\/Madrid:09991231T\d{6}$/));
  });

  test('TEXT escapat i línies plegades a 75 octets sense partir cap caràcter', () => {
    const llarg = creaEsdeveniment({
      id: 'l', titol: 'Aplec; ball, i sopar\\final', inici: { data: '2026-10-01' },
      descripcio: `Primera línia\nSegona: ${'àèòíú€'.repeat(20)}`, lloc: 'Plaça Major, Benillup'
    });
    const ics = aIcs([llarg], { ara: ARA });
    const fisiques = ics.split('\r\n').slice(0, -1);
    const bytes = (text) => new TextEncoder().encode(text).length;
    expect(fisiques.every((l) => bytes(l) <= 75)).toBe(true);
    expect(fisiques.some((l) => l.startsWith(' '))).toBe(true);
    // Almenys un plec cau just abans d'un caràcter de dos o tres octets.
    expect(fisiques.some((l) => bytes(l) < 75 && bytes(l) > 72)).toBe(true);
    const linies = logiques(ics);
    expect(linies).toContain('SUMMARY:Aplec\\; ball\\, i sopar\\\\final');
    expect(linies).toContain(`DESCRIPTION:Primera línia\\nSegona: ${'àèòíú€'.repeat(20)}`);
    expect(linies).toContain('LOCATION:Plaça Major\\, Benillup');
  });

  test('TEXT sense caràcters de control, llevat de la tabulació (§3.3.11)', () => {
    const brut = creaEsdeveniment({ id: 'b', titol: 'Ball\u000Bde\u0000 nit', inici: { data: '2026-10-01' }, descripcio: 'Música\tviva\u001B\u007F' });
    const linies = logiques(aIcs([brut], { ara: ARA }));
    expect(linies).toContain('SUMMARY:Ballde nit');
    expect(linies).toContain('DESCRIPTION:Música\tviva');
  });

  test('una llista buida o amb nul·les dona un calendari buit i vàlid', () => {
    expect(logiques(aIcs([null], { ara: ARA, prodid: '-//Prova//CA' }))).toEqual([
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Prova//CA', 'CALSCALE:GREGORIAN', 'END:VCALENDAR', ''
    ]);
  });
});
