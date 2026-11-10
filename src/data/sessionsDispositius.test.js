import { expect, test } from 'vitest';
import { capturaFiltreSessions, validaSessionsDispositius } from './sessionsDispositius.js';
const fila = { clau: 'a'.repeat(32), nom: 'Veïna', correu_mascarat: 'v***@example.test', cami: 'app_ios', sessions: 2, activitat: '2026-11-09T14:00:00Z' };
const resposta = (files, total = files.length) => ({ files, total, consultat_a: fila.activitat });
test('validació exposa només persona i dispositiu, amb el correu emmascarat i cap identificador', () => {
  const v = validaSessionsDispositius(resposta([fila]));
  expect(v.files[0]).toEqual({ clau: fila.clau, nom: fila.nom, correuMascarat: fila.correu_mascarat, cami: fila.cami, sessions: 2, activitat: fila.activitat });
  expect(validaSessionsDispositius(resposta([{ ...fila, correu_mascarat: null }])).files[0].correuMascarat).toBeNull();
});
test('SEG-R15b-01: un correu sencer, un identificador de sessió o de persona o qualsevol camp de més es rebutgen', () => {
  for (const dolenta of [
    { ...fila, correu_mascarat: 'veina@example.test' },
    { ...fila, correu_mascarat: 've***@example.test' },
    { ...fila, sessio_id: '11111111-1111-4111-8111-111111111111' },
    { ...fila, usuari_id: '22222222-2222-4222-8222-222222222222' },
    { ...fila, correu: 'veina@example.test' },
    { ...fila, access_token: 'secret', ip: 'test' },
    { ...fila, clau: '11111111-1111-4111-8111-111111111111' },
    { ...fila, sessions: 0 }
  ]) expect(() => validaSessionsDispositius(resposta([dolenta]))).toThrow(TypeError);
  expect(() => validaSessionsDispositius({ ...resposta([fila]), usuaris: [] })).toThrow(TypeError);
});
test('rebutja duplicats, canals invàlids, totals incoherents i filtres no limitats', () => { expect(() => validaSessionsDispositius(resposta([fila,fila]))).toThrow(); expect(() => validaSessionsDispositius(resposta([{...fila,cami:'inventat'}]))).toThrow(); expect(() => validaSessionsDispositius(resposta([fila],0))).toThrow(); expect(() => capturaFiltreSessions({cerca:'a'.repeat(121)})).toThrow(); expect(() => capturaFiltreSessions({cami:'inventat'})).toThrow(); });
