// @vitest-environment node
/* v1.2.23 · L4-04 (Gauntlet R1) · La correcció R32.45 d'obriMissatge, també per als adjunts xifrats: només el GCM que
   no autentica (XIFRAT_MANIPULAT, l'OperationError de WebCrypto) és «adjunt-manipulat». Una fallada operativa del motor
   (TypeError, InvalidAccessError, UnknownError) és obertura-no-disponible, fora de la família d'integritat, i una
   cancel·lació (AbortError) passa intacta. WebCrypto real; només el decrypt injectat prova el transport del motiu. */
import { expect, test } from 'vitest';
import * as P from './xifratXatProtocol.js';
import { CODI_ADJUNT, desxifraAdjuntXat } from './xatMultimediaXifrat.js';
import { CODIS_INTEGRITAT_E2EE } from '../sections/xat/missatgeXifratHonest.js';

const cripto = globalThis.crypto;
const FIL = 'dddddddd-3333-4333-8333-333333333333';
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const ADJ = 'eeeeeeee-4444-4444-8444-444444444444';
const ambSubtle = (metode, fn) => ({
  subtle: new Proxy(cripto.subtle, { get: (objectiu, nom) => nom === metode ? fn : typeof objectiu[nom] === 'function' ? objectiu[nom].bind(objectiu) : objectiu[nom] }),
  getRandomValues: (bytes) => cripto.getRandomValues(bytes)
});
const adjunt = () => P.xifraAdjunt(cripto, { fil: FIL, adjunt: ADJ, emissor: A, bytes: Uint8Array.from({ length: 900 }, (_, i) => i % 251), mime: 'image/jpeg' });
const errorDe = (promesa) => promesa.then(() => null, (error) => error);

const OPERATIUS = Object.freeze([
  ['TypeError', () => new TypeError('motor sintètic')],
  ['InvalidAccessError', () => new DOMException('ús invàlid', 'InvalidAccessError')],
  ['UnknownError', () => new DOMException('motor no disponible', 'UnknownError')]
]);

test.each(OPERATIUS)('obriAdjunt: un %s del decrypt és obertura-no-disponible, amb la causa, mai adjunt-manipulat', async (_nom, crea) => {
  const { blob, a } = await adjunt();
  const causa = crea();
  const error = await errorDe(P.obriAdjunt(ambSubtle('decrypt', () => Promise.reject(causa)), { fil: FIL, emissor: A, a, blob }));
  expect(error?.codi).toBe(P.CODI.oberturaNoDisponible);
  expect(error.cause).toBe(causa);
  expect(CODIS_INTEGRITAT_E2EE).not.toContain(error.codi);
});

test.each(OPERATIUS)('desxifraAdjuntXat: un %s del decrypt arriba com a adjunt-invalid, fora de la família d’integritat', async (_nom, crea) => {
  const { blob, a } = await adjunt();
  const error = await errorDe(desxifraAdjuntXat({ cripto: ambSubtle('decrypt', () => Promise.reject(crea())), fil: FIL, emissor: A, a, blob }));
  expect(error).toMatchObject({ code: 'obrir', codi: CODI_ADJUNT.invalid });
  expect(error.codi).not.toBe(CODI_ADJUNT.manipulat);
  expect(CODIS_INTEGRITAT_E2EE).not.toContain(error.codi);
});

test('una cancel·lació (AbortError) del decrypt o de l’àmbit passa intacta, no es classifica', async () => {
  const { blob, a } = await adjunt();
  const avort = new DOMException('cancel·lat', 'AbortError');
  await expect(P.obriAdjunt(ambSubtle('decrypt', () => Promise.reject(avort)), { fil: FIL, emissor: A, a, blob })).rejects.toBe(avort);
  await expect(desxifraAdjuntXat({ cripto: ambSubtle('decrypt', () => Promise.reject(avort)), fil: FIL, emissor: A, a, blob })).rejects.toBe(avort);
  // El quart pas és el del decrypt (hash, HKDF, derivació, decrypt): l'àmbit que es cancel·la just després tampoc no és manipulació.
  let passos = 0;
  const vigent = () => { if (++passos === 4) throw avort; };
  await expect(P.obriAdjunt(cripto, { fil: FIL, emissor: A, a, blob, vigent })).rejects.toBe(avort);
  expect(passos).toBe(4);
});

test('control: el GCM que no autentica continua sent adjunt-manipulat (injectat i de veres)', async () => {
  const { blob, a } = await adjunt();
  const injectat = await errorDe(P.obriAdjunt(ambSubtle('decrypt', () => Promise.reject(new DOMException('etiqueta', 'OperationError'))), { fil: FIL, emissor: A, a, blob }));
  expect(injectat?.codi).toBe(P.CODI.adjuntManipulat);
  expect(injectat.cause).toMatchObject({ codi: 'XIFRAT_MANIPULAT' });
  const k = Uint8Array.from(a.k); k[0] ^= 1;
  expect((await errorDe(P.obriAdjunt(cripto, { fil: FIL, emissor: A, a: { ...a, k }, blob })))?.codi).toBe(P.CODI.adjuntManipulat);
  expect((await errorDe(desxifraAdjuntXat({ cripto, fil: FIL, emissor: A, a: { ...a, k }, blob })))?.codi).toBe(CODI_ADJUNT.manipulat);
  expect(await P.obriAdjunt(cripto, { fil: FIL, emissor: A, a, blob })).toMatchObject({ mime: 'image/jpeg' });
});
