import { expect, test } from 'vitest';
import { ETIQUETA_RESERVA_ARA, dataHoraAra, dataHoraEdicio } from './dataHoraBarra.js';
import { dataHoraDeBarra, diaCurt } from '../editorial.js';

/* T51 (decisió del Mestre, 260928) · Cap document sense data. En EDICIÓ, la
   data de publicació triada al calendari (T40) o, si no n'hi ha, la d'ara:
   mai la de l'última edició del document. */
const ARA = new Date(2026, 8, 5, 7, 3);

test('dataHoraAra: hora i data curtes i un dateTime local vàlid per a <time>', () => {
  expect(dataHoraAra(ARA)).toEqual({ time: '07:03', date: '05/09/26', dateTime: '2026-09-05T07:03' });
});

test('una sola implementació del format: el dia i l’hora són els de la lectura (editorial.js)', () => {
  const instant = new Date(2026, 11, 31, 23, 59, 30);
  const lectura = dataHoraDeBarra({ creat: instant });
  expect([dataHoraAra(instant).time, dataHoraAra(instant).date]).toEqual([lectura.time, lectura.date]);
  expect(dataHoraAra(instant).date).toBe(diaCurt(instant));
});

test('dataHoraEdicio: amb la data de publicació triada (T40), eixa tria en hora local', () => {
  const triada = new Date(2026, 9, 3, 18, 30);
  expect(dataHoraEdicio({ publicat: triada.toISOString() }, ARA))
    .toEqual({ time: '18:30', date: '03/10/26', dateTime: '2026-10-03T18:30', esAra: false });
  // Un Date també és una tria.
  expect(dataHoraEdicio({ publicat: triada }, ARA)).toMatchObject({ time: '18:30', date: '03/10/26', esAra: false });
});

test('dataHoraEdicio: una tria a les 02:00 d’estiu (mitjanit UTC exacta) conserva la seua hora', () => {
  const triada = new Date(2026, 8, 20, 2, 0);
  expect(dataHoraEdicio({ publicat: triada.toISOString() }, ARA)).toMatchObject({ time: '02:00', date: '20/09/26', esAra: false });
});

test('dataHoraEdicio: MAI la data de l’última edició; sense tria, la d’ara', () => {
  // Una nota vella oberta a Notes: la seua data d'edició no és la de la pastilla.
  expect(dataHoraEdicio({ time: '09:37', date: '02/01/26' }, ARA))
    .toEqual({ time: '07:03', date: '05/09/26', dateTime: '2026-09-05T07:03', esAra: true });
  for (const doc of [undefined, null, {}, { publicat: null }, { publicat: '' }]) {
    expect(dataHoraEdicio(doc, ARA)).toEqual({ time: '07:03', date: '05/09/26', dateTime: '2026-09-05T07:03', esAra: true });
  }
});

test('dataHoraEdicio: una tria que no és data no s’inventa res: la d’ara', () => {
  for (const publicat of ['demà', '2026-02-30T10:00:00Z', 20261003, {}]) {
    expect(dataHoraEdicio({ publicat }, ARA)).toMatchObject({ time: '07:03', date: '05/09/26', esAra: true });
  }
});

test('dataHoraEdicio: una tria de dia sol (no ve del calendari de T40, que guarda hora) dona el dia i cap hora inventada', () => {
  expect(dataHoraEdicio({ publicat: '2026-10-05' }, ARA)).toEqual({ time: '', date: '05/10/26', dateTime: '2026-10-05', esAra: false });
});

test('la reserva d’ara té nom propi per al lector', () => {
  expect(ETIQUETA_RESERVA_ARA).toBe('la data i l’hora d’ara');
});
