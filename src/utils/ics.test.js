/* T8 (ordre del Mestre, 260930) · L'exportació .ics segons l'RFC 5545. */
import { describe, expect, test } from 'vitest';
import { PRODID_SDP, aIcs } from './ics.js';
import { creaEsdeveniment } from './esdeveniment.js';

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

  test('una llista buida o amb nul·les dona un calendari buit i vàlid', () => {
    expect(logiques(aIcs([null], { ara: ARA, prodid: '-//Prova//CA' }))).toEqual([
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Prova//CA', 'CALSCALE:GREGORIAN', 'END:VCALENDAR', ''
    ]);
  });
});
