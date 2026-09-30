/* T8 (ordre del Mestre, 260930) · El model d'esdeveniment. Cap prova depén del
   fus horari del sistema: les hores de paret es lligen en hora local, i els
   instants amb desfasament es construïxen amb new Date(any, mes, dia, h, m). */
import { describe, expect, test } from 'vitest';
import {
  DIES_RRULE, ZONA_PER_DEFECTE, aGoogleCalendar, clauDia, creaEsdeveniment, deGoogleCalendar, fiEfectiva,
  indexaMes, llegixDataHora, ocorreElDia, recurrenciaSuportada
} from './esdeveniment.js';

const dia = (data, altres = {}) => creaEsdeveniment({ id: 'a', titol: 'Aplec', inici: { data }, ...altres });
const ambHora = (dataHora, altres = {}) => creaEsdeveniment({ id: 'h', titol: 'Concert', inici: { dataHora }, ...altres });
const repetit = (inici, ...linies) => creaEsdeveniment({ id: 'r', titol: 'Repetit', inici, recurrencia: linies });
/** Els dies (1–31) d'un mes en què ocorre. Mes de 0 a 11. */
const diesDe = (esd, any, mes) => [...indexaMes([esd], any, mes).keys()];

describe('creaEsdeveniment', () => {
  test('un acte de tot el dia, congelat, amb els valors per defecte', () => {
    const esd = dia('2023-01-29', { font: { tipus: 'mur', id: 'aplec-2023', ruta: '/events/aplec-2023' } });
    expect(Object.isFrozen(esd)).toBe(true);
    expect(Object.isFrozen(esd.inici)).toBe(true);
    expect(esd).toMatchObject({
      uid: 'mur:a@socdepoble.org', id: 'a', titol: 'Aplec', descripcio: null, lloc: null,
      inici: { data: '2023-01-29' }, fi: null, totElDia: true, estat: 'confirmat', recurrencia: null,
      font: { tipus: 'mur', id: 'aplec-2023', ruta: '/events/aplec-2023' }, enllac: null, actualitzat: null
    });
    expect(dia('2023-01-29').uid).toBe('a@socdepoble.org');
  });

  test('amb hora: la zona per defecte és la del poble, i l’actualització es normalitza a ISO UTC', () => {
    const esd = ambHora('2026-10-01T18:30', { actualitzat: '2026-09-30T12:00:00+02:00', uid: 'x@y' });
    expect(esd.inici).toEqual({ dataHora: '2026-10-01T18:30', zona: ZONA_PER_DEFECTE });
    expect(esd.totElDia).toBe(false);
    expect(esd.actualitzat).toBe('2026-09-30T10:00:00.000Z');
    expect(esd.uid).toBe('x@y');
  });

  test.each([
    ['sense títol', { id: 'a', titol: '  ', inici: { data: '2026-10-01' } }],
    ['sense id', { titol: 'x', inici: { data: '2026-10-01' } }],
    ['un dia que no existix', { id: 'a', titol: 'x', inici: { data: '2026-02-30' } }],
    ['una hora impossible', { id: 'a', titol: 'x', inici: { dataHora: '2026-10-01T24:00' } }],
    ['la fi abans de l’inici', { id: 'a', titol: 'x', inici: { data: '2026-10-02' }, fi: { data: '2026-10-02' } }],
    ['la fi d’un altre tipus', { id: 'a', titol: 'x', inici: { data: '2026-10-02' }, fi: { dataHora: '2026-10-03T10:00' } }],
    ['un estat desconegut', { id: 'a', titol: 'x', inici: { data: '2026-10-01' }, estat: 'ajornat' }],
    ['una zona que no existix', { id: 'a', titol: 'x', inici: { dataHora: '2026-10-01T10:00', zona: 'Mart/Olimp' } }],
    ['un enllaç que no és cap URL', { id: 'a', titol: 'x', inici: { data: '2026-10-01' }, enllac: '//fora.example' }],
    ['una actualització que no és cap data', { id: 'a', titol: 'x', inici: { data: '2026-10-01' }, actualitzat: 'demà' }],
    ['una recurrència que no és una llista', { id: 'a', titol: 'x', inici: { data: '2026-10-01' }, recurrencia: 'RRULE:FREQ=DAILY' }],
    ['una línia de recurrència amb salt', { id: 'a', titol: 'x', inici: { data: '2026-10-01' }, recurrencia: ['RRULE:FREQ=DAILY\r\nX:1'] }],
    ['una font sense tipus', { id: 'a', titol: 'x', inici: { data: '2026-10-01' }, font: { id: 'a' } }]
  ])('fail-closed: %s → null', (_, parcial) => {
    expect(creaEsdeveniment(parcial)).toBeNull();
  });
});

describe('ocorreElDia sense recurrència', () => {
  test('tot el dia: pel número de dia, amb la fi exclusiva', () => {
    const un = dia('2026-10-01');
    expect(ocorreElDia(un, 2026, 9, 1)).toBe(true);
    expect(ocorreElDia(un, 2026, 9, 2)).toBe(false);
    expect(ocorreElDia(un, 2026, 8, 30)).toBe(false);
    const tres = dia('2026-09-30', { fi: { data: '2026-10-03' } });
    expect(diesDe(tres, 2026, 9)).toEqual([1, 2]);
    expect(diesDe(tres, 2026, 8)).toEqual([30]);
  });

  test('amb hora: el dia local de l’instant, també amb desfasament', () => {
    expect(diesDe(ambHora('2026-10-01T23:30'), 2026, 9)).toEqual([1]);
    const instant = new Date(2026, 9, 1, 23, 30).toISOString();
    expect(diesDe(ambHora(instant), 2026, 9)).toEqual([1]);
  });

  test('amb hora i fi: cobrix els dies que toca, i la mitjanit de la fi no compta', () => {
    expect(diesDe(ambHora('2026-10-01T22:00', { fi: { dataHora: '2026-10-02T02:00' } }), 2026, 9)).toEqual([1, 2]);
    expect(diesDe(ambHora('2026-10-01T22:00', { fi: { dataHora: '2026-10-02T00:00' } }), 2026, 9)).toEqual([1]);
  });

  test('un acte cancel·lat no ocorre', () => {
    expect(ocorreElDia(dia('2026-10-01', { estat: 'cancellat' }), 2026, 9, 1)).toBe(false);
  });

  test('null i objectes que no són del model, mai', () => {
    expect(ocorreElDia(null, 2026, 9, 1)).toBe(false);
    expect(ocorreElDia({}, 2026, 9, 1)).toBe(false);
  });
});

describe('ocorreElDia amb RRULE (setembre de 2026 comença en dimarts)', () => {
  test('DAILY amb INTERVAL, i res abans de l’inici', () => {
    const esd = repetit({ data: '2026-09-01' }, 'RRULE:FREQ=DAILY;INTERVAL=2');
    expect(diesDe(esd, 2026, 8).slice(0, 4)).toEqual([1, 3, 5, 7]);
    expect(diesDe(esd, 2026, 7)).toEqual([]);
    expect(recurrenciaSuportada(esd)).toBe(true);
  });

  test('WEEKLY amb BYDAY, INTERVAL i WKST (també sense el prefix RRULE:)', () => {
    expect(diesDe(repetit({ data: '2026-09-01' }, 'FREQ=WEEKLY;BYDAY=MO,TH'), 2026, 8)).toEqual([3, 7, 10, 14, 17, 21, 24, 28]);
    // Setmanes de dilluns: la de l'inici (31-8), la del 14 i la del 28.
    const quinzena = repetit({ data: '2026-09-01' }, 'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH;WKST=MO');
    expect(diesDe(quinzena, 2026, 8)).toEqual([3, 14, 17, 28]);
    expect(diesDe(quinzena, 2026, 9)).toEqual([1, 12, 15, 26, 29]);
    // Sense BYDAY, el dia de la setmana de l'inici.
    expect(diesDe(repetit({ data: '2026-09-01' }, 'RRULE:FREQ=WEEKLY'), 2026, 8)).toEqual([1, 8, 15, 22, 29]);
  });

  test('MONTHLY: el dia de l’inici, BYMONTHDAY (també negatiu) i BYDAY amb ordinal', () => {
    const trentaU = repetit({ data: '2026-01-31' }, 'RRULE:FREQ=MONTHLY');
    expect([1, 2, 3, 4].map((mes) => diesDe(trentaU, 2026, mes))).toEqual([[], [31], [], [31]]);
    expect(diesDe(repetit({ data: '2026-01-01' }, 'RRULE:FREQ=MONTHLY;BYMONTHDAY=-1'), 2026, 1)).toEqual([28]);
    // Últim divendres i primer dilluns de setembre de 2026.
    expect(diesDe(repetit({ data: '2026-01-01' }, 'RRULE:FREQ=MONTHLY;BYDAY=-1FR'), 2026, 8)).toEqual([25]);
    expect(diesDe(repetit({ data: '2026-01-01' }, 'RRULE:FREQ=MONTHLY;BYDAY=1MO'), 2026, 8)).toEqual([7]);
    expect(diesDe(repetit({ data: '2026-01-01' }, 'RRULE:FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=15'), 2026, 8)).toEqual([15]);
    expect(diesDe(repetit({ data: '2026-01-01' }, 'RRULE:FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=15'), 2026, 9)).toEqual([]);
  });

  test('UNTIL i COUNT tallen; les EXDATE no descompten COUNT', () => {
    expect(diesDe(repetit({ data: '2026-09-01' }, 'RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260915'), 2026, 8)).toEqual([7, 14]);
    expect(diesDe(repetit({ data: '2026-09-01' }, 'RRULE:FREQ=DAILY;COUNT=3'), 2026, 8)).toEqual([1, 2, 3]);
    expect(diesDe(repetit({ data: '2026-09-01' }, 'RRULE:FREQ=DAILY;COUNT=3', 'EXDATE;VALUE=DATE:20260902'), 2026, 8)).toEqual([1, 3]);
    // UNTIL amb hora: el 14 a les 10:00 ja ha passat del límit de les 09:00.
    const until = new Date(2026, 8, 14, 9, 0).toISOString().replace(/\.\d{3}/, '').replace(/[-:]/g, '');
    expect(diesDe(repetit({ dataHora: '2026-09-01T10:00' }, `RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=${until}`), 2026, 8)).toEqual([7]);
  });

  test('BYHOUR: el dia de l’inici només compten les ocurrències que no el precedixen', () => {
    expect(diesDe(repetit({ dataHora: '2026-09-01T10:00' }, 'RRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=0'), 2026, 8)[0]).toBe(2);
    expect(diesDe(repetit({ dataHora: '2026-09-01T10:00' }, 'RRULE:FREQ=DAILY;BYHOUR=8,12;BYMINUTE=0'), 2026, 8)[0]).toBe(1);
  });

  test('una ocurrència de dos dies cobrix el segon', () => {
    const capDeSetmana = creaEsdeveniment({
      id: 'f', titol: 'Fira', inici: { data: '2026-09-05' }, fi: { data: '2026-09-07' }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA']
    });
    expect(diesDe(capDeSetmana, 2026, 8)).toEqual([5, 6, 12, 13, 19, 20, 26, 27]);
  });

  test('HOURLY, MINUTELY i SECONDLY: la xarxa de passos des de l’inici', () => {
    expect(diesDe(repetit({ dataHora: '2026-09-01T10:00' }, 'RRULE:FREQ=HOURLY'), 2026, 8)).toHaveLength(30);
    expect(diesDe(repetit({ dataHora: '2026-09-01T10:00' }, 'RRULE:FREQ=HOURLY'), 2026, 7)).toEqual([]);
    expect(diesDe(repetit({ dataHora: '2026-09-01T10:00' }, 'RRULE:FREQ=HOURLY;INTERVAL=48'), 2026, 8).slice(0, 3)).toEqual([1, 3, 5]);
    // 20 hores des de les 10:00: l'última, el 2 a les 05:00.
    expect(diesDe(repetit({ dataHora: '2026-09-01T10:00' }, 'RRULE:FREQ=HOURLY;COUNT=20'), 2026, 8)).toEqual([1, 2]);
    // Octubre de 2026 porta el canvi d'hora (el 25) i té 31 dies.
    expect(diesDe(repetit({ dataHora: '2026-09-01T00:00' }, 'RRULE:FREQ=MINUTELY;INTERVAL=30'), 2026, 9)).toHaveLength(31);
    expect(diesDe(repetit({ dataHora: '2026-09-01T00:00' }, 'RRULE:FREQ=SECONDLY;INTERVAL=90'), 2026, 9)).toHaveLength(31);
  });

  test.each([
    ['YEARLY, fora del subconjunt', { data: '2026-01-01' }, ['RRULE:FREQ=YEARLY']],
    ['una part desconeguda (BYSETPOS)', { data: '2026-01-01' }, ['RRULE:FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1']],
    ['dos RRULE', { data: '2026-01-01' }, ['RRULE:FREQ=DAILY', 'RRULE:FREQ=WEEKLY']],
    ['RDATE', { data: '2026-01-01' }, ['RRULE:FREQ=DAILY', 'RDATE;VALUE=DATE:20260105']],
    ['cap RRULE', { data: '2026-01-01' }, ['EXDATE;VALUE=DATE:20260105']],
    ['COUNT i UNTIL alhora', { data: '2026-01-01' }, ['RRULE:FREQ=DAILY;COUNT=2;UNTIL=20260110']],
    ['ordinal en WEEKLY', { data: '2026-01-01' }, ['RRULE:FREQ=WEEKLY;BYDAY=1MO']],
    ['BYMONTHDAY en WEEKLY', { data: '2026-01-01' }, ['RRULE:FREQ=WEEKLY;BYMONTHDAY=3']],
    ['hores en un acte de tot el dia', { data: '2026-01-01' }, ['RRULE:FREQ=DAILY;BYHOUR=8']],
    ['HOURLY amb BY*', { dataHora: '2026-01-01T10:00' }, ['RRULE:FREQ=HOURLY;BYDAY=MO']],
    ['COUNT amb dos ocurrències per dia', { dataHora: '2026-01-01T10:00' }, ['RRULE:FREQ=DAILY;BYHOUR=10,12;COUNT=4']],
    ['un INTERVAL zero', { data: '2026-01-01' }, ['RRULE:FREQ=DAILY;INTERVAL=0']]
  ])('fail-closed: %s es crea però no es pinta', (_, inici, linies) => {
    const esd = repetit(inici, ...linies);
    expect(esd).not.toBeNull();
    expect(recurrenciaSuportada(esd)).toBe(false);
    expect(diesDe(esd, 2026, 0)).toEqual([]);
  });
});

describe('indexaMes i clauDia', () => {
  test('una passada pel mes, en l’ordre d’entrada; les nul·les no compten', () => {
    const a = dia('2026-09-03');
    const b = dia('2026-09-01', { fi: { data: '2026-09-04' } });
    const index = indexaMes([a, null, b], 2026, 8);
    expect([...index.keys()]).toEqual([3, 1, 2]);
    expect(index.get(3)).toEqual([a, b]);
    expect(indexaMes(undefined, 2026, 8).size).toBe(0);
  });

  test('clauDia escriu el dia de ?date= (mes de 0 a 11)', () => {
    expect(clauDia(2023, 0, 9)).toBe('2023-01-09');
    expect(DIES_RRULE[new Date(2026, 8, 24).getDay()]).toBe('TH');
  });
});

describe('fiEfectiva: sense fi, tot el dia o una hora', () => {
  test('de data: el dia següent (i creua l’any)', () => {
    expect(fiEfectiva(dia('2026-12-31'))).toEqual({ data: '2027-01-01' });
  });

  test('amb hora: una hora més, en el mateix format', () => {
    expect(fiEfectiva(ambHora('2026-10-01T23:30'))).toEqual({ dataHora: '2026-10-02T00:30:00', zona: ZONA_PER_DEFECTE });
    expect(fiEfectiva(ambHora('2026-10-01T10:00:00+02:00')).dataHora).toBe('2026-10-01T11:00:00+02:00');
    const fi = { dataHora: '2026-10-01T12:00', zona: ZONA_PER_DEFECTE };
    expect(fiEfectiva(ambHora('2026-10-01T10:00', { fi }))).toEqual(fi);
  });

  test('llegixDataHora dona les xifres i l’instant', () => {
    expect(llegixDataHora('2026-10-01T10:00:00Z')).toMatchObject({ hora: 10, ambDesfas: true, instant: Date.UTC(2026, 9, 1, 10) });
    expect(llegixDataHora('2026-10-01T10:00').instant).toBe(new Date(2026, 9, 1, 10).getTime());
    expect(llegixDataHora('2026-10-01')).toBeNull();
  });
});

describe('Google Calendar v3, sense API', () => {
  const acte = creaEsdeveniment({
    id: 'aplec-2023', titol: '2n Aplec pel Territori', descripcio: 'A Benillup', lloc: 'Benillup',
    inici: { dataHora: '2023-01-29T10:00' }, estat: 'provisional', recurrencia: ['RRULE:FREQ=YEARLY'],
    font: { tipus: 'mur', id: 'aplec-2023', ruta: '/events/aplec-2023' }, enllac: 'https://socdepoble.org/events/aplec-2023'
  });

  test('aGoogleCalendar: iCalUID, start/end amb zona, estat, font i enllaç', () => {
    expect(aGoogleCalendar(acte)).toEqual({
      iCalUID: 'mur:aplec-2023@socdepoble.org',
      summary: '2n Aplec pel Territori',
      description: 'A Benillup',
      location: 'Benillup',
      start: { dateTime: '2023-01-29T10:00:00', timeZone: 'Europe/Madrid' },
      end: { dateTime: '2023-01-29T11:00:00', timeZone: 'Europe/Madrid' },
      status: 'tentative',
      recurrence: ['RRULE:FREQ=YEARLY'],
      source: { title: '2n Aplec pel Territori', url: 'https://socdepoble.org/events/aplec-2023' },
      extendedProperties: { private: { sdpFont: 'mur', sdpId: 'aplec-2023', sdpRuta: '/events/aplec-2023' } }
    });
    expect(aGoogleCalendar(dia('2026-10-01')).end).toEqual({ date: '2026-10-02' });
    expect(aGoogleCalendar(dia('2026-10-01', { enllac: '/events/a' })).source).toBeUndefined();
    expect(aGoogleCalendar(null)).toBeNull();
  });

  test('anada i tornada: deGoogleCalendar(aGoogleCalendar(e)) és el mateix esdeveniment amb la fi explícita', () => {
    const tornada = deGoogleCalendar(aGoogleCalendar(acte));
    expect(tornada).toEqual({ ...acte, inici: { dataHora: '2023-01-29T10:00:00', zona: 'Europe/Madrid' }, fi: { dataHora: '2023-01-29T11:00:00', zona: 'Europe/Madrid' } });
  });

  test('deGoogleCalendar: un recurs de Google tal com arriba', () => {
    const esd = deGoogleCalendar({
      id: '5l3jdo2k8b', iCalUID: '5l3jdo2k8b@google.com', status: 'confirmed', htmlLink: 'https://www.google.com/calendar/event?eid=x',
      updated: '2026-09-30T08:00:00.000Z', start: { dateTime: '2026-10-01T10:00:00+02:00', timeZone: 'Europe/Madrid' },
      end: { dateTime: '2026-10-01T12:00:00+02:00' }, recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TH']
    });
    expect(esd).toMatchObject({
      id: '5l3jdo2k8b', uid: '5l3jdo2k8b@google.com', titol: '(sense títol)', estat: 'confirmat',
      font: { tipus: 'gcal', id: '5l3jdo2k8b', ruta: null }, enllac: 'https://www.google.com/calendar/event?eid=x',
      actualitzat: '2026-09-30T08:00:00.000Z', recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=TH']
    });
    expect(deGoogleCalendar({ id: 'x', summary: 's', start: { date: '2026-10-01' }, status: 'desconegut' })).toBeNull();
    expect(deGoogleCalendar(null)).toBeNull();
  });
});
