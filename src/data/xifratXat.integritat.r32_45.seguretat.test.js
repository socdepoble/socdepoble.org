// @vitest-environment node
/* R32.45 · WebCrypto real per a l'oracle GCM; les excepcions injectades només
   proven el transport del motiu, mai l'autenticació criptogràfica. */
import { beforeAll, expect, test, vi } from 'vitest';
import vectors from './xifratXatCripto.vectors.json';
import { desxifraAesGcm, importaClauAesGcm } from './xifratXatCripto.js';
import * as P from './xifratXatProtocol.js';
import { creaMotorXifrat, serialitzaXifrat } from './xifratXatPipeline.js';
import { causaMissatgeXifratTancat, textMissatgeXifratTancat } from '../sections/xat/missatgeXifratHonest.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../config/xifratXat.js';
import ca from '../config/idiomes/ca.js';
import es from '../config/idiomes/es.js';
import en from '../config/idiomes/en.js';
import eu from '../config/idiomes/eu.js';
import gl from '../config/idiomes/gl.js';

const cripto = globalThis.crypto;
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const FIL = 'dddddddd-3333-4333-8333-333333333333';
const ID = '10000000-0000-4000-8000-000000000001';
const hex = text => Uint8Array.from(text.match(/../g) ?? [], parell => Number.parseInt(parell, 16));
const muta = bytes => { const copia = Uint8Array.from(bytes); copia[0] ^= 1; return copia; };
const filaTancada = codi => ({ text: null, seguretat: { xifrat: true, verificat: false, codi } });
const neutre = msg => {
  for (const dic of [ca, es, en, eu, gl]) {
    expect(textMissatgeXifratTancat(msg, clau => dic[clau])).toBe(dic['section.xat.xifratge.noObert']);
    expect(textMissatgeXifratTancat(msg, clau => dic[clau])).not.toBe(dic['section.xat.xifratge.tancat']);
  }
};
const ambSubtle = (metode, fn) => ({
  subtle: new Proxy(cripto.subtle, { get: (objectiu, nom) => nom === metode ? fn : typeof objectiu[nom] === 'function' ? objectiu[nom].bind(objectiu) : objectiu[nom] }),
  getRandomValues: bytes => cripto.getRandomValues(bytes)
});
let a, b, directori, estatA, estatB, fila;
beforeAll(async () => {
  a = await P.creaIdentitat(cripto, { usuari: A, creatMs: 1 });
  b = await P.creaIdentitat(cripto, { usuari: B, creatMs: 1 });
  directori = P.creaDirectori(cripto);
  await directori.fixa(P.publiquesDe(a)); await directori.fixa(P.publiquesDe(b));
  estatA = P.estatFilNou({ fil: FIL, tipusFil: P.TIPUS_FIL.directe });
  estatB = P.estatFilNou({ fil: FIL, tipusFil: P.TIPUS_FIL.directe });
  const genesi = await P.creaEpoca(cripto, { estat: estatA, jo: a, membres: [A, B].map(usuari => ({ usuari, rol: P.ROL_EPOCA.membre })), creatMs: 1, directori });
  for (const [jo, estat] of [[a, estatA], [b, estatB]]) await P.aplicaEpoca(cripto, { estat, jo, ...genesi, directori });
  fila = await P.xifraMissatge(cripto, { estat: estatA, jo: a, id: ID, contingut: { t: 'Canari sintètic verificat' } });
});
const copiaEstat = () => ({ ...estatB, epoques: new Map(estatB.epoques), vistos: new Set() });
const preparaMotor = ({ crypto = cripto, estat = copiaEstat(), context = true, identitat = async () => b, impl = {} } = {}) => {
  const cau = new Map();
  const ctx = { estat, directori, jo: b, fil: { id: FIL, altres: [{ id: A }] }, tipusFil: 'directe', membres: [A, B], canvis: { pendents: new Map() } };
  const servei = {
    estatAmbit: () => ({ clauIdentitat: 'sintetic', ambitEstable: JSON.stringify(['node0', B, 'personal']) }),
    estatFilDesat: () => context ? ctx : null,
    desaEstatFil: vi.fn(), textDesxifrat: (_, id) => cau.get(id),
    desaTextDesxifrat: vi.fn((_, id, valor) => cau.set(id, valor)), desaAdjunt: vi.fn()
  };
  const motor = creaMotorXifrat({ cripto: crypto, impl, servei, magatzem: { identitat } });
  const obri = (f = fila) => motor.obri({ fil: { id: FIL, altres: [{ id: A }] }, tipusFil: 'directe', files: [{ id: f.id, usuariId: A, text: 'clar no fiable', xifrat: serialitzaXifrat(f) }], config: {}, exigix: () => {} });
  return { obri, servei, estat };
};

test('bandera real apagada i vector NIST conegut amb text exacte', async () => {
  expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  const v = vectors.aes256gcm_cavp.desxifrat[0];
  const clau = await importaClauAesGcm(cripto, hex(v.key));
  expect(await desxifraAesGcm(cripto, clau, { iv: hex(v.iv), aad: hex(v.aad), xifrat: hex(v.ct + v.tag) })).toEqual(hex(v.pt));
  const [msg] = await preparaMotor().obri();
  expect(msg.text).toBe('Canari sintètic verificat');
  expect(msg.seguretat.verificat).toBe(true);
  expect(causaMissatgeXifratTancat(msg)).toBeNull();
});

test.each(['ct', 'iv', 'tf'])('GCM real: mutació %s → integritat neutra, sense marcar vist ni guardar text; original reintentable', async camp => {
  const m = preparaMotor();
  const [msg] = await m.obri({ ...fila, [camp]: muta(fila[camp]) });
  expect(msg).toMatchObject({ text: null, seguretat: { verificat: false, codi: 'xifrat-manipulat' } });
  expect(causaMissatgeXifratTancat(msg)).toBe('integritat'); neutre(msg);
  expect(m.estat.vistos.size).toBe(0);
  expect(m.servei.desaTextDesxifrat).not.toHaveBeenCalled(); expect(m.servei.desaAdjunt).not.toHaveBeenCalled();
  expect((await m.obri())[0].text).toBe('Canari sintètic verificat');
});

test('GCM real: etiqueta i AAD alterades o clau vàlida diferent fallen autenticació', async () => {
  const v = vectors.aes256gcm_cavp.desxifrat[0];
  const clau = await importaClauAesGcm(cripto, hex(v.key));
  const xifrat = hex(v.ct + v.tag), etiqueta = Uint8Array.from(xifrat); etiqueta[etiqueta.length - 1] ^= 1;
  const entrada = { iv: hex(v.iv), aad: hex(v.aad), xifrat };
  for (const [key, canvis] of [[clau, { xifrat: etiqueta }], [clau, { aad: Uint8Array.of(1) }], [await importaClauAesGcm(cripto, muta(hex(v.key))), {}]]) {
    await expect(desxifraAesGcm(cripto, key, { ...entrada, ...canvis })).rejects.toMatchObject({ codi: 'XIFRAT_MANIPULAT' });
  }
});

test('CK absent: zero decrypt, família de clau absent i text d’altre dispositiu', async () => {
  const decrypt = vi.fn();
  const estat = copiaEstat(); estat.epoques.set(1, { ...estat.epoques.get(1), ck: null });
  const [msg] = await preparaMotor({ estat, crypto: ambSubtle('decrypt', decrypt) }).obri();
  expect(decrypt).not.toHaveBeenCalled(); expect(msg.seguretat.codi).toBe('epoca-desconeguda');
  expect(causaMissatgeXifratTancat(msg)).toBe('clau-absent');
  for (const dic of [ca, es, en, eu, gl]) expect(textMissatgeXifratTancat(msg, clau => dic[clau])).toBe(dic['section.xat.xifratge.tancat']);
});

test('WebCrypto real InvalidAccessError per usos de clau: no és un error GCM', async () => {
  const clau = await importaClauAesGcm(cripto, new Uint8Array(32), ['encrypt']);
  await expect(desxifraAesGcm(cripto, clau, { iv: new Uint8Array(12), xifrat: new Uint8Array(16) })).rejects.toMatchObject({ name: 'InvalidAccessError' });
});

test.each([new TypeError('motor sintètic'), new DOMException('cancel·lat', 'AbortError'), new DOMException('ús invàlid', 'InvalidAccessError'), new DOMException('motor no disponible', 'UnknownError')])('errors operatius de decrypt conserven %s; no falsa autenticació', async error => {
  const crypto = ambSubtle('decrypt', () => Promise.reject(error));
  const clau = await importaClauAesGcm(cripto, new Uint8Array(32));
  await expect(desxifraAesGcm(crypto, clau, { iv: new Uint8Array(12), xifrat: new Uint8Array(16) })).rejects.toBe(error);
  const m = preparaMotor({ crypto });
  if (error.name === 'AbortError') await expect(m.obri()).rejects.toBe(error);
  else { const [msg] = await m.obri(); expect(causaMissatgeXifratTancat(msg)).toBe('no-disponible'); neutre(msg); }
  expect(m.estat.vistos.size).toBe(0); expect(m.servei.desaTextDesxifrat).not.toHaveBeenCalled();
});

test('cancel·lació després de decrypt vàlid passa intacta i no es guarda', async () => {
  const error = P.errorProtocol('ambit-canviat', 'àmbit canviat');
  let passos = 0;
  const estat = copiaEstat();
  await expect(P.obriMissatge(cripto, { estat, fila, directori, vigent: () => { if (++passos === 3) throw error; } })).rejects.toBe(error);
  expect(passos).toBe(3); expect(estat.vistos.size).toBe(0);
});

test('backend fallit en resincronitzar una època posterior: neutre i sense text en cau', async () => {
  const estat = copiaEstat(); estat.epoques.clear(); estat.ultima = null;
  const m = preparaMotor({ estat, impl: { epoquesDelFilXat: async () => { throw new Error('xarxa sintètica'); } } });
  const [msg] = await m.obri(); expect(causaMissatgeXifratTancat(msg)).toBe('no-disponible'); neutre(msg);
  expect(m.servei.desaTextDesxifrat).not.toHaveBeenCalled();
});

test.each(['idb', 'backend'])('fallada %s carregant context: neutra i sense certificar clau absent', async origen => {
  const error = new Error('indisponibilitat sintètica');
  const m = preparaMotor({ context: false, identitat: origen === 'idb' ? async () => { throw error; } : async () => b, impl: { epoquesDelFilXat: async () => { throw error; } } });
  const [msg] = await m.obri(); expect(causaMissatgeXifratTancat(msg)).toBe('no-disponible'); neutre(msg);
  expect(m.servei.desaTextDesxifrat).not.toHaveBeenCalled();
});

test('identitat realment absent conserva claus-bloquejades; desconeguts són neutres', async () => {
  const [msg] = await preparaMotor({ context: false, identitat: async () => null }).obri();
  expect(msg.seguretat.codi).toBe('claus-bloquejades'); expect(causaMissatgeXifratTancat(msg)).toBe('clau-absent');
  for (const codi of ['obertura-no-disponible', 'claus-no-disponibles', 'context-no-disponible', 'desconegut', undefined]) neutre(filaTancada(codi));
});
