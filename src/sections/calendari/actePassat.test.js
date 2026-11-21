/* P0-ANDROID-PUSH (v1.2.16) · B10b i B10c (decisió del Mestre D-12) · esActePassat, amb el
   rellotge sempre fix: cap prova depén del dia en què es passa. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { esActePassat } from './actePassat.js';
import { entradaDeLAgenda, entradaDeLaTargeta } from './calendariGlobal.js';
import { acteAEsdeveniment } from '../mur/agendaMur.js';
import { CALENDAR_EVENTS, CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../mur/eventsSeed.js';
import { creaEsdeveniment } from '../../utils/esdeveniment.js';

const HUI = new Date(2026, 10, 20, 12, 0);
const acte = (camps) => ({ id: 'a', type: 'event', title: 'Aplec', ...camps });
const APLEC_2023 = CALENDAR_EVENTS.find((item) => item.id === 'aplec-2023');

describe('esActePassat', () => {
  test('un acte acabat és passat; un de demà, no; un en curs, tampoc', () => {
    expect(APLEC_2023).toBeTruthy();
    expect(esActePassat(APLEC_2023, HUI)).toBe(true);
    expect(esActePassat(acte({ date: '2026-11-21' }), HUI)).toBe(false);
    expect(esActePassat(acte({ inici: '2026-11-19', fi: '2026-11-22' }), HUI)).toBe(false);
    // Els cursos (del 23-10 al 14-11; la fi és exclusiva) eren futurs l'1-10 i són passats el 20-11.
    expect(esActePassat(CURSOS_PEDRA_EN_SEC_2026_EVENT, new Date(2026, 9, 1, 12, 0))).toBe(false);
    expect(esActePassat(CURSOS_PEDRA_EN_SEC_2026_EVENT, HUI)).toBe(true);
  });

  test('tot el dia, fins a la mitjanit que obri l’endemà del seu últim dia', () => {
    const totElDia = acte({ date: '2026-11-20' });
    expect(esActePassat(totElDia, HUI)).toBe(false);
    expect(esActePassat(totElDia, new Date(2026, 10, 20, 23, 59))).toBe(false);
    expect(esActePassat(totElDia, new Date(2026, 10, 21, 0, 0))).toBe(true);
    // També en ms.
    expect(esActePassat(totElDia, new Date(2026, 10, 21, 0, 0).getTime())).toBe(true);
  });

  /* Gauntlet R1 de la v1.2.16 (L2-01) · Abans, «Este acte ja s’ha fet.» una hora després de començar
     (la fi d'exportació de fiEfectiva) en tots els actes del Mur amb hora, que no porten fi. */
  test('[L2-01] amb hora i sense fi, no és passat fins a la mitjanit que tanca el seu dia', () => {
    const ambHora = acte({ date: '2026-11-20', time: '10:00' });
    expect(esActePassat(ambHora, new Date(2026, 10, 20, 9, 59))).toBe(false);
    expect(esActePassat(ambHora, new Date(2026, 10, 20, 11, 5))).toBe(false);
    expect(esActePassat(ambHora, new Date(2026, 10, 20, 23, 59))).toBe(false);
    expect(esActePassat(ambHora, new Date(2026, 10, 21, 0, 0))).toBe(true);
    // Si comença a última hora, mai abans de l'hora que li dona fiEfectiva.
    const tard = acte({ date: '2026-11-20', time: '23:30' });
    expect(esActePassat(tard, new Date(2026, 10, 21, 0, 5))).toBe(false);
    expect(esActePassat(tard, new Date(2026, 10, 21, 0, 30))).toBe(true);
  });

  test('[L2-01] amb una fi declarada, és passat quan passa la fi', () => {
    const concert = acte({ inici: '2026-11-20T18:00', fi: '2026-11-20T20:00' });
    expect(esActePassat(concert, new Date(2026, 10, 20, 19, 59))).toBe(false);
    expect(esActePassat(concert, new Date(2026, 10, 20, 20, 0))).toBe(true);
  });

  test('[L2-01] una revetla de 23:00 a 03:00 sense data_fi acaba l’endemà a les 03:00', () => {
    const revetla = { id: 'revetla', ambit: 'calendari', title: 'Revetla', dades: { data_inici: '2026-11-21', hora_inici: '23:00', hora_fi: '03:00' } };
    expect(acteAEsdeveniment(revetla).fi).toEqual({ dataHora: '2026-11-22T03:00', zona: 'Europe/Madrid' });
    expect(esActePassat(revetla, new Date(2026, 10, 21, 23, 30))).toBe(false);
    expect(esActePassat(revetla, new Date(2026, 10, 22, 0, 5))).toBe(false);
    expect(esActePassat(revetla, new Date(2026, 10, 22, 2, 59))).toBe(false);
    expect(esActePassat(revetla, new Date(2026, 10, 22, 3, 0))).toBe(true);
    // Amb la fi en hora posterior, el mateix dia, com abans.
    const ball = { ...revetla, dades: { data_inici: '2026-11-21', hora_inici: '20:00', hora_fi: '22:00' } };
    expect(acteAEsdeveniment(ball).fi).toEqual({ dataHora: '2026-11-21T22:00', zona: 'Europe/Madrid' });
  });

  test('[MESTRE-261121] un acte que es repetix sense fi no és passat encara que la primera data ho siga', () => {
    const mercat = acte({ id: 'mercat', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY'] });
    expect(esActePassat(mercat, HUI)).toBe(false);
    expect(esActePassat(acte({ id: 'mercat-h', date: '2026-01-10', time: '09:00', recurrencia: ['RRULE:FREQ=WEEKLY'] }), HUI)).toBe(false);
  });

  /* Gauntlet R1 de la v1.2.16 (L2-04) · Abans, qualsevol repetició preguntava «Assistiràs?», també la
     d'un mercat amb UNTIL o COUNT ja acabat que el calendari ja no obri (mesDeLActeMesProper → null). */
  test('[L2-04] un acte repetit amb UNTIL o COUNT ja acabat és passat; amb ocurrències a partir de hui, no', () => {
    const mercat = (regla, camps = {}) => acte({ id: 'mercat', date: '2026-01-10', recurrencia: [regla], ...camps });
    expect(esActePassat(mercat('RRULE:FREQ=WEEKLY;UNTIL=20260301'), HUI)).toBe(true);
    expect(esActePassat(mercat('RRULE:FREQ=WEEKLY;COUNT=3'), HUI)).toBe(true);
    expect(esActePassat(mercat('RRULE:FREQ=WEEKLY;UNTIL=20260301T000000Z', { time: '09:00' }), HUI)).toBe(true);
    // Un UNTIL que el calendari no sap pintar (amb hora en un acte de tot el dia): cap ocurrència no comença després.
    expect(esActePassat(mercat('RRULE:FREQ=WEEKLY;UNTIL=20260301T000000Z'), HUI)).toBe(true);
    // Una EXDATE sobre l'última no descompta COUNT: la regla també s'ha esgotat.
    expect(esActePassat(acte({ id: 'm', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3', 'EXDATE;VALUE=DATE:20260124'] }), HUI)).toBe(true);
    // Encara en vénen.
    expect(esActePassat(mercat('RRULE:FREQ=WEEKLY;UNTIL=20261231'), HUI)).toBe(false);
    expect(esActePassat(mercat('RRULE:FREQ=WEEKLY;COUNT=60'), HUI)).toBe(false);
    expect(esActePassat(mercat('RRULE:FREQ=WEEKLY;COUNT=3'), new Date(2026, 0, 20, 12, 0))).toBe(false);
    // L'última ocurrència és hui (divendres 20-11): no és passat fins a la mitjanit.
    const divendres = acte({ id: 'd', date: '2026-11-06', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3'] });
    expect(esActePassat(divendres, HUI)).toBe(false);
    expect(esActePassat(divendres, new Date(2026, 10, 21, 0, 0))).toBe(true);
    // Una regla que el calendari no sap pintar, amb COUNT: no se sap si s'ha acabat, i no s'amaga res.
    expect(esActePassat(mercat('RRULE:FREQ=YEARLY;COUNT=10'), HUI)).toBe(false);
  });

  /* Gauntlet R2 de la v1.2.16 (L2R2-03) · Una RDATE afig dates que l'UNTIL no limita (RFC 5545). Abans,
     la drecera de l'UNTIL passat no la veia i deia «Este acte ja s'ha fet.» d'un acte amb una data el 5-12. */
  test('[L2R2-03] amb una RDATE o una EXRULE, un UNTIL passat no dona l’acte per fet (no s’amaga res)', () => {
    const ambRdate = acte({ id: 'r', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY;UNTIL=20260301', 'RDATE;VALUE=DATE:20261205'] });
    expect(acteAEsdeveniment(ambRdate).recurrencia).toHaveLength(2);
    expect(esActePassat(ambRdate, HUI)).toBe(false);
    const ambExrule = acte({ id: 'x', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY;UNTIL=20260301', 'EXRULE:FREQ=MONTHLY'] });
    expect(acteAEsdeveniment(ambExrule).recurrencia).toHaveLength(2);
    expect(esActePassat(ambExrule, HUI)).toBe(false);
    // Amb només RRULE i EXDATE, la drecera continua.
    expect(esActePassat(acte({ id: 'e', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY;UNTIL=20260301', 'EXDATE;VALUE=DATE:20260117'] }), HUI)).toBe(true);
  });

  /* Gauntlet R2 de la v1.2.16 (L2R2-04) · La gràcia de l'acte simple que comença a última hora
     ([L2-01], 23:30 → 00:30) val també a cada ocurrència d'una repetició. Abans, l'última «ja s'havia
     fet» a les 00:00, mitja hora després de començar (o cinc minuts, a les 23:55). */
  test('[L2R2-04] una repetició que comença a última hora dura com l’acte simple: 23:30 → 00:30', () => {
    const simple = acte({ id: 's', date: '2026-11-20', time: '23:30' });
    const ambCount = acte({ id: 'c', date: '2026-11-06', time: '23:30', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3'] });
    const ambUntil = acte({ id: 'u', date: '2026-11-06', time: '23:30', recurrencia: ['RRULE:FREQ=WEEKLY;UNTIL=20261120T223000Z'] });
    for (const unActe of [simple, ambCount, ambUntil]) {
      expect(esActePassat(unActe, new Date(2026, 10, 21, 0, 10))).toBe(false);
      expect(esActePassat(unActe, new Date(2026, 10, 21, 0, 29))).toBe(false);
      expect(esActePassat(unActe, new Date(2026, 10, 21, 0, 30))).toBe(true);
    }
    // A les 23:55, fins a les 00:55.
    const tardana = acte({ id: 't', date: '2026-11-06', time: '23:55', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3'] });
    expect(esActePassat(tardana, new Date(2026, 10, 21, 0, 54))).toBe(false);
    expect(esActePassat(tardana, new Date(2026, 10, 21, 0, 55))).toBe(true);
    // Abans de les 23:00 no hi ha gràcia: a la mitjanit, com abans.
    const vesprada = acte({ id: 'v', date: '2026-11-06', time: '19:00', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3'] });
    expect(esActePassat(vesprada, new Date(2026, 10, 20, 23, 59))).toBe(false);
    expect(esActePassat(vesprada, new Date(2026, 10, 21, 0, 0))).toBe(true);
    // Diverses ocurrències per dia (BYHOUR, HOURLY): l'última del dia és a les 23:30, i té tota l'hora.
    const perHores = acte({ id: 'b', date: '2026-11-06', time: '10:00', recurrencia: ['RRULE:FREQ=WEEKLY;UNTIL=20261120T225900Z;BYHOUR=10,23;BYMINUTE=30'] });
    const cadaHora = acte({ id: 'h', inici: '2026-11-20T22:30', recurrencia: ['RRULE:FREQ=HOURLY;COUNT=2'] });
    for (const unActe of [perHores, cadaHora]) {
      expect(esActePassat(unActe, new Date(2026, 10, 21, 0, 29))).toBe(false);
      expect(esActePassat(unActe, new Date(2026, 10, 21, 1, 0))).toBe(true);
    }
  });

  test('sense data real, cancel·lat, una publicació o un rellotge trencat: no és passat (no s’amaga res)', () => {
    expect(esActePassat(acte({ date: undefined, created_at: '2023-01-01T10:00:00Z' }), HUI)).toBe(false);
    // Un acte cancel·lat no té interval (intervalRsvpDe torna null): no es diu «ja s'ha fet».
    const cancellat = creaEsdeveniment({ id: 'c1', titol: 'Ball suspés', inici: { data: '2023-01-29' }, estat: 'cancellat' });
    expect(cancellat?.estat).toBe('cancellat');
    expect(esActePassat({ item: null, acte: cancellat }, HUI)).toBe(false);
    expect(esActePassat({ id: 'p1', type: 'feed', title: 'Crònica', created_at: '2023-01-01T10:00:00Z' }, HUI)).toBe(false);
    expect(esActePassat(APLEC_2023, new Date(Number.NaN))).toBe(false);
    expect(esActePassat(APLEC_2023, 'ahir')).toBe(false);
    expect(esActePassat(null, HUI)).toBe(false);
    expect(esActePassat(undefined, HUI)).toBe(false);
  });

  test('rep també les entrades del calendari: les de les targetes i les de l’agenda de Sollutia', () => {
    expect(esActePassat(entradaDeLaTargeta(APLEC_2023), HUI)).toBe(true);
    expect(esActePassat(entradaDeLaTargeta(acte({ date: '2026-12-05' })), HUI)).toBe(false);
    // Una publicació al calendari porta l'esdeveniment de la seua pastilla, però no és cap acte.
    expect(esActePassat(entradaDeLaTargeta({ id: 'p1', type: 'feed', title: 'Crònica', created_at: '2023-01-01T10:00:00Z' }), HUI)).toBe(false);
    const agenda = entradaDeLAgenda({ id: 's1', titol: 'Concert a la plaça', inici: '2026-10-10T17:00:00.000Z' });
    expect(esActePassat(agenda, HUI)).toBe(true);
    expect(esActePassat(agenda, new Date(2026, 9, 1, 12, 0))).toBe(false);
  });
});

/* Gauntlet R1 de la v1.2.16 (L2-02) · L'hora de l'acte és de paret a la seua zona (Europe/Madrid per
   defecte), no a la de qui mira. Abans, a Tòquio, el concert de les 20:00 «ja s'havia fet» a les 12:30
   UTC, sis hores i mitja abans de començar. La tècnica de la zona és la d'EventCard.test.jsx:
   vi.stubEnv('TZ'), amb una guarda que falla si el canvi no arriba al worker.
   Gauntlet R2 de la v1.2.16 (L2R2-02) · També a l'oest de Madrid (Canàries, Lisboa), on el motor de
   repeticions tallava l'UNTIL en UTC abans d'hora. */
describe.each([
  ['Asia/Tokyo', -540],
  ['Europe/Athens', -120],
  ['America/Los_Angeles', 480],
  ['Atlantic/Canary', 0],
  ['Europe/Lisbon', 0]
])('[L2-02] en un navegador a %s', (zona, desfasGener) => {
  afterEach(() => { vi.unstubAllEnvs(); });

  test('guarda: la zona s’aplica de veres al worker', () => {
    vi.stubEnv('TZ', zona);
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(desfasGener);
  });

  test('el concert de les 20:00 de Madrid no és passat fins a la mitjanit de Madrid', () => {
    vi.stubEnv('TZ', zona);
    const concert = acte({ id: 'concert', date: '2026-11-21', time: '20:00' });
    expect(esActePassat(concert, Date.UTC(2026, 10, 21, 12, 30))).toBe(false);
    expect(esActePassat(concert, Date.UTC(2026, 10, 21, 19, 0))).toBe(false);
    expect(esActePassat(concert, Date.UTC(2026, 10, 21, 22, 59))).toBe(false);
    expect(esActePassat(concert, Date.UTC(2026, 10, 21, 23, 0))).toBe(true);
  });

  test('un acte de tot el dia i un amb fi declarada, també en l’hora de Madrid', () => {
    vi.stubEnv('TZ', zona);
    const fira = acte({ id: 'fira', date: '2026-11-21' });
    expect(esActePassat(fira, Date.UTC(2026, 10, 21, 22, 59))).toBe(false);
    expect(esActePassat(fira, Date.UTC(2026, 10, 21, 23, 0))).toBe(true);
    const ball = acte({ id: 'ball', inici: '2026-11-21T18:00', fi: '2026-11-21T20:00' });
    expect(esActePassat(ball, Date.UTC(2026, 10, 21, 18, 59))).toBe(false);
    expect(esActePassat(ball, Date.UTC(2026, 10, 21, 19, 0))).toBe(true);
    // Un instant amb desplaçament (l'agenda de Sollutia) és el mateix a tot arreu.
    const agenda = entradaDeLAgenda({ id: 's1', titol: 'Concert a la plaça', inici: '2026-11-21T17:00:00.000Z', fi: '2026-11-21T19:00:00.000Z' });
    expect(esActePassat(agenda, Date.UTC(2026, 10, 21, 18, 59))).toBe(false);
    expect(esActePassat(agenda, Date.UTC(2026, 10, 21, 19, 0))).toBe(true);
  });

  test('una repetició amb COUNT es compta pels dies de Madrid', () => {
    vi.stubEnv('TZ', zona);
    // Divendres 6, 13 i 20 de novembre, a les 19:00 de Madrid.
    const mercat = acte({ id: 'mercat', date: '2026-11-06', time: '19:00', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3'] });
    expect(esActePassat(mercat, Date.UTC(2026, 10, 20, 22, 59))).toBe(false);
    expect(esActePassat(mercat, Date.UTC(2026, 10, 20, 23, 0))).toBe(true);
  });

  test('[L2R2-02] una repetició amb UNTIL en UTC no «s’ha fet» abans de la seua última ocurrència', () => {
    vi.stubEnv('TZ', zona);
    // Divendres 6, 13 i 20 de novembre a les 19:00 de Madrid: l'UNTIL és l'últim inici (18:00Z), inclusiu.
    const mercat = acte({ id: 'mercat', date: '2026-11-06', time: '19:00', recurrencia: ['RRULE:FREQ=WEEKLY;UNTIL=20261120T180000Z'] });
    expect(esActePassat(mercat, Date.UTC(2026, 10, 16, 12))).toBe(false);
    expect(esActePassat(mercat, Date.UTC(2026, 10, 20, 17))).toBe(false);
    expect(esActePassat(mercat, Date.UTC(2026, 10, 20, 22, 59))).toBe(false);
    // Passats el dia de l'UNTIL i el que dura l'acte, s'ha fet a tot arreu.
    expect(esActePassat(mercat, Date.UTC(2026, 11, 1, 12))).toBe(true);
  });

  test('[L2R2-04] la gràcia de les 23:30 → 00:30 d’una repetició es compta en l’hora de Madrid', () => {
    vi.stubEnv('TZ', zona);
    const tardana = acte({ id: 'tardana', date: '2026-11-06', time: '23:30', recurrencia: ['RRULE:FREQ=WEEKLY;COUNT=3'] });
    expect(esActePassat(tardana, Date.UTC(2026, 10, 20, 23, 10))).toBe(false);
    expect(esActePassat(tardana, Date.UTC(2026, 10, 20, 23, 29))).toBe(false);
    expect(esActePassat(tardana, Date.UTC(2026, 10, 20, 23, 30))).toBe(true);
  });
});

/* Gauntlet R2 de la v1.2.16 (L2R2-02) · Quan el fus de qui mira casa amb el de l'acte, el motor fa bé
   el tall de l'UNTIL i es conserva la precisió: l'acte s'ha fet a la mitjanit de la seua última
   ocurrència, no dies després. */
describe('[L2R2-02] en un navegador a Europe/Madrid', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  test('una repetició amb UNTIL en UTC s’acaba a la mitjanit de la seua última ocurrència', () => {
    vi.stubEnv('TZ', 'Europe/Madrid');
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-60);
    const mercat = acte({ id: 'mercat', date: '2026-11-06', time: '19:00', recurrencia: ['RRULE:FREQ=WEEKLY;UNTIL=20261120T180000Z'] });
    expect(esActePassat(mercat, Date.UTC(2026, 10, 16, 12))).toBe(false);
    expect(esActePassat(mercat, Date.UTC(2026, 10, 20, 22, 59))).toBe(false);
    expect(esActePassat(mercat, Date.UTC(2026, 10, 20, 23, 0))).toBe(true);
  });
});
