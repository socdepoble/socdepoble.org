/* T6 (ordre del Mestre, 260930) · Dels actes del Mur al model d'esdeveniment. */
import { describe, expect, test } from 'vitest';
import { acteAEsdeveniment, cursorDeClau, mesDeLActeMesProper } from './agendaMur.js';
import { CALENDAR_EVENTS } from './eventsSeed.js';
import { ocorreElDia } from '../../utils/esdeveniment.js';

const acte = (camps) => ({ id: 'a', type: 'event', title: 'Aplec', ...camps });

describe('acteAEsdeveniment', () => {
  test('l’acte de la llavor: amb hora, l’entradilla en text pla i la ruta de l’acte; el poble de l’autor no és el lloc', () => {
    const esd = acteAEsdeveniment(CALENDAR_EVENTS[0]);
    expect(esd).toMatchObject({
      uid: 'mur:aplec-2023@socdepoble.org', id: 'aplec-2023', titol: '2n Aplec pel Territori',
      inici: { dataHora: '2023-01-29T10:00', zona: 'Europe/Madrid' }, fi: null, totElDia: false, lloc: null,
      font: { tipus: 'mur', id: 'aplec-2023', ruta: '/events/aplec-2023' }, recurrencia: null
    });
    expect(esd.descripcio).toBe(CALENDAR_EVENTS[0].entradilla);
    expect(ocorreElDia(esd, 2023, 0, 29)).toBe(true);
  });

  test('sense hora, de tot el dia; la descripció HTML passa a text pla', () => {
    const esd = acteAEsdeveniment(acte({ date: '2026-10-12', description: '<p>Ball <strong>de plaça</strong></p>', location: 'Benillup' }));
    expect(esd).toMatchObject({ inici: { data: '2026-10-12' }, totElDia: true, descripcio: 'Ball de plaça', lloc: 'Benillup' });
  });

  test('els camps futurs del payload (inici, fi, zona, uid, recurrencia) es lligen tal qual', () => {
    const esd = acteAEsdeveniment(acte({
      date: '2026-10-01', inici: '2026-10-03T18:00', fi: { dataHora: '2026-10-03T20:00' }, zona: 'Atlantic/Canary',
      uid: 'fira@poble.example', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3']
    }));
    expect(esd).toMatchObject({
      uid: 'fira@poble.example', inici: { dataHora: '2026-10-03T18:00', zona: 'Atlantic/Canary' },
      fi: { dataHora: '2026-10-03T20:00', zona: 'Europe/Madrid' }, recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3']
    });
    expect(acteAEsdeveniment(acte({ inici: { data: '2026-10-05' }, fi: { data: '2026-10-07' } })).fi).toEqual({ data: '2026-10-07' });
  });

  test('l’actualització només si és una data ISO; si no, null (no tomba l’acte)', () => {
    expect(acteAEsdeveniment(acte({ date: '2026-10-12', updated_at: '2026-09-30T08:00:00Z' })).actualitzat).toBe('2026-09-30T08:00:00.000Z');
    expect(acteAEsdeveniment(acte({ date: '2026-10-12', updated_at: '2026-09-30 08:00:00+00' })).actualitzat).toBeNull();
  });

  test('fail-closed: sense títol, sense dia o amb un dia que no existix', () => {
    expect(acteAEsdeveniment(acte({ title: '', date: '2026-10-12' }))).toBeNull();
    expect(acteAEsdeveniment(acte({ date: undefined }))).toBeNull();
    expect(acteAEsdeveniment(acte({ date: '2026-02-30' }))).toBeNull();
    expect(acteAEsdeveniment(acte({ date: '2026-10-12', zona: 'Mart/Olimp', time: '10:00' }))).toBeNull();
    expect(acteAEsdeveniment(null)).toBeNull();
  });
});

describe('el mes on s’obri l’Agenda', () => {
  const AVUI = new Date(2026, 8, 30, 12, 0);
  const esd = (date, time) => acteAEsdeveniment(acte({ id: date, date, time }));

  test('el de l’acte que ve més prompte (hui compta com a futur)', () => {
    expect(mesDeLActeMesProper([esd('2023-01-29'), esd('2027-03-01'), esd('2026-11-14', '19:00')], AVUI)).toEqual({ any: 2026, mes: 10 });
    expect(mesDeLActeMesProper([esd('2023-01-29'), esd('2026-09-30')], AVUI)).toEqual({ any: 2026, mes: 8 });
  });

  test('si cap no ha de vindre, el del més recent; sense actes, null', () => {
    expect(mesDeLActeMesProper([esd('2023-01-29'), null, esd('2024-06-01')], AVUI)).toEqual({ any: 2024, mes: 5 });
    expect(mesDeLActeMesProper([], AVUI)).toBeNull();
  });

  test('cursorDeClau llig el ?date= del Mur', () => {
    expect(cursorDeClau('2026-11-14')).toEqual({ any: 2026, mes: 10 });
    expect(cursorDeClau('2026-13-01')).toBeNull();
    expect(cursorDeClau(null)).toBeNull();
  });
});
