/* T6 (ordre del Mestre, 260930) · Dels actes del Mur al model d'esdeveniment. */
import { describe, expect, test } from 'vitest';
import { acteAEsdeveniment, acteOcorreElDia, cursorDeClau, mesDeLActeMesProper } from './agendaMur.js';
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

  test('T5 · la publicació no fa de dia de l’acte: sense date, created_at ni publish_date no el salven', () => {
    expect(acteAEsdeveniment(acte({ date: undefined, created_at: '2026-09-30T10:00:00Z', publish_date: '2026-09-30T10:00:00Z' }))).toBeNull();
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

  /* calendari-3 · La primera OCURRÈNCIA a partir de hui (ocorreElDia), no el
     primer dia d'inici: un acte en curs o un de repetit compten el dia que
     ocorren. */
  test('una fira en curs (començada abans de hui) obri el mes de hui', () => {
    const fira = acteAEsdeveniment(acte({ id: 'fira', inici: { data: '2026-09-28' }, fi: { data: '2026-10-04' } }));
    expect(mesDeLActeMesProper([fira, esd('2026-12-05')], AVUI)).toEqual({ any: 2026, mes: 8 });
  });

  test('un mercat setmanal obri el mes del pròxim dissabte, no el d’un acte posterior', () => {
    const mercat = acteAEsdeveniment(acte({ id: 'mercat', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY'] }));
    expect(mesDeLActeMesProper([mercat, esd('2027-03-01')], AVUI)).toEqual({ any: 2026, mes: 9 });
  });

  test('un acte d’un mes passat que ja ha acabat no guanya a un de futur', () => {
    expect(mesDeLActeMesProper([esd('2026-09-02'), esd('2026-11-14')], AVUI)).toEqual({ any: 2026, mes: 10 });
  });

  test('més enllà de dos anys, el criteri d’abans: el que comença més prompte a partir de hui', () => {
    expect(mesDeLActeMesProper([esd('2023-01-29'), esd('2030-05-01'), esd('2029-01-10')], AVUI)).toEqual({ any: 2029, mes: 0 });
  });

  /* Sense la guarda, un acte repetit vigent i un hui invàlid fan un bucle
     infinit: el límit és NaN i la comparació no el tanca mai. */
  test('amb un hui invàlid no es penja: el criteri d’abans', () => {
    const mercat = acteAEsdeveniment(acte({ id: 'mercat', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY'] }));
    expect(mesDeLActeMesProper([mercat, esd('2024-06-01')], new Date(Number.NaN))).toEqual({ any: 2026, mes: 0 });
  });

  test('cursorDeClau llig el ?date= del Mur', () => {
    expect(cursorDeClau('2026-11-14')).toEqual({ any: 2026, mes: 10 });
    expect(cursorDeClau('2026-13-01')).toBeNull();
    expect(cursorDeClau(null)).toBeNull();
  });

  /* calendari-5 · Date llig els anys de 0 a 99 com 1900-1999 i clauDia els
     escriu sense zeros: el calendari diria «1926» i escriuria una clau que ell
     mateix rebutja. */
  test('cursorDeClau exigix un any de quatre xifres significatives', () => {
    expect(cursorDeClau('0026-05-10')).toBeNull();
    expect(cursorDeClau('0999-12-31')).toBeNull();
    expect(cursorDeClau('1000-01-01')).toEqual({ any: 1000, mes: 0 });
  });
});

/* T5 i calendari-2 · El filtre ?date= del Mur troba un acte els mateixos dies
   que el pinta l'Agenda. */
describe('acteOcorreElDia', () => {
  test('un acte de tot el dia, amb hora o de diversos dies: els dies que el pinta el calendari', () => {
    expect(acteOcorreElDia(acte({ date: '2026-11-14' }), '2026-11-14')).toBe(true);
    expect(acteOcorreElDia(acte({ date: '2026-11-14' }), '2026-11-15')).toBe(false);
    expect(acteOcorreElDia(acte({ date: '2026-08-14', time: '00:30' }), '2026-08-14')).toBe(true);
    const festes = acte({ date: '2026-10-01', fi: { data: '2026-10-04' } });
    expect(['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((clau) => acteOcorreElDia(festes, clau)))
      .toEqual([false, true, true, true, false]);
  });

  test('l’inici del payload mana sobre date, com al calendari', () => {
    const aplec = acte({ date: '2026-10-01', inici: '2026-10-03T18:00' });
    expect(acteOcorreElDia(aplec, '2026-10-03')).toBe(true);
    expect(acteOcorreElDia(aplec, '2026-10-01')).toBe(false);
  });

  test('un acte repetit, cada dia que es repetix', () => {
    const mercat = acte({ date: '2026-10-03', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3'] });
    expect(['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24'].map((clau) => acteOcorreElDia(mercat, clau)))
      .toEqual([true, true, true, false]);
  });

  test('una repetició que el calendari no sap pintar es troba el dia que comença (el de la seua pastilla)', () => {
    const festes = acte({ date: '2026-12-05', recurrencia: ['RRULE:FREQ=YEARLY'] });
    expect(acteOcorreElDia(festes, '2026-12-05')).toBe(true);
    expect(acteOcorreElDia(festes, '2027-12-05')).toBe(false);
  });

  /* El model només compta l'inici si la regla el genera (esdeveniment.js),
     però la pastilla i la insígnia diuen el dia d'inici: clicar-les no pot fer
     desaparéixer la targeta. */
  test('el dia de la seua pastilla el troba sempre, encara que la regla no el genere', () => {
    // L'1-10-2026 és dijous; el mercat es repetix els dissabtes.
    const mercat = acte({ id: 'mercat', title: 'Mercat', date: '2026-10-01', recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] });
    expect(ocorreElDia(acteAEsdeveniment(mercat), 2026, 9, 1)).toBe(false);
    expect(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10'].map((clau) => acteOcorreElDia(mercat, clau)))
      .toEqual([true, false, true, true]);
    // Una EXDATE sobre l'inici tampoc no el lleva del dia de la seua pastilla.
    const ambExclusio = acte({ date: '2026-10-03', recurrencia: ['RRULE:FREQ=WEEKLY', 'EXDATE;VALUE=DATE:20261003'] });
    expect(ocorreElDia(acteAEsdeveniment(ambExclusio), 2026, 9, 3)).toBe(false);
    expect(['2026-10-03', '2026-10-10'].map((clau) => acteOcorreElDia(ambExclusio, clau))).toEqual([true, true]);
  });

  test('qui ja té el model el pot passar: no se’n fa cap altre', () => {
    const item = acte({ date: '2026-11-14' });
    const esd = acteAEsdeveniment(item);
    expect(acteOcorreElDia(item, '2026-11-14', esd)).toBe(true);
    expect(acteOcorreElDia({ ...item, date: '2027-01-01' }, '2026-11-14', esd)).toBe(true);
    expect(acteOcorreElDia(item, '2026-11-14', null)).toBeNull();
  });

  test('D5 · una clau que no existix no troba cap acte (el 30 de febrer no és el 2 de març)', () => {
    expect(acteOcorreElDia(acte({ date: '2026-03-02' }), '2026-02-30')).toBe(false);
    expect(acteOcorreElDia(acte({ date: '2026-03-02' }), '0026-03-02')).toBe(false);
    expect(acteOcorreElDia(acte({ date: '2026-03-02' }), 'demà')).toBe(false);
  });

  test('sense acte al model, null: qui filtra fa servir la pastilla', () => {
    expect(acteOcorreElDia(acte({ date: undefined, created_at: '2026-09-20T08:15:00+00:00' }), '2026-09-20')).toBeNull();
  });
});

/* calendari-7 · Les proves corren amb una zona fixada (vite.config.js). Amb la
   de per defecte, la del poble, el canvi d'hora d'octubre hi és de veres: les
   proves que diuen cobrir-lo no poden quedar verdes sense recórrer-lo, com
   passava a la CI en UTC. Un TZ explícit de qui les executa es respecta. */
test('les proves corren amb una zona fixada; per defecte, la del poble i el seu canvi d’hora', () => {
  expect(process.env.TZ).toBeTruthy();
  if (process.env.TZ !== 'Europe/Madrid') return;
  expect(new Date(2026, 9, 24).getTimezoneOffset()).toBe(-120);
  expect(new Date(2026, 9, 26).getTimezoneOffset()).toBe(-60);
});
