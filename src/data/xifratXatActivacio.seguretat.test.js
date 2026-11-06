// @vitest-environment node
import { beforeAll, expect, test, vi } from 'vitest';
import { creaActivacioXat, restauraIdentitatSocial } from './xifratXatActivacio.js';
import { creaAlta, restauraAmbRk } from './xifratXatAlta.js';
import { clauIdentitat, creaMagatzemXat } from './xifratXatMagatzem.js';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';
import { aBase64url, ajunta, aleatori, desxifraAesGcm, exportaPublica, generaParellaDh, infoHkdf, signa, uuid16 } from './xifratXatCripto.js';
import { llegixDeclaracioClau } from './xifratXatFormats.js';
import { deBase64url } from './xifratXatCripto.js';
import {
  codiTornada, compromisSas, construeixAprovacio, construeixDeclaracio, construeixInfoAlliberament,
  construeixVerificacio, esborraFragments, hashVerificacio, reparteix, segellaAlliberament
} from './xifratXatRecuperacio.js';

const cripto = globalThis.crypto;
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const C = 'cccccccc-3333-4333-8333-333333333333';
const D = 'dddddddd-4444-4444-8444-444444444444';
const FIL = 'eeeeeeee-5555-4555-8555-555555555555';
const PET = 'ffffffff-6666-4666-8666-666666666666';
const ID = '10000000-0000-4000-8000-000000000001';
const T = 1793920000000;
const opcionsAlta = { iteracions: 1000, minIteracions: 1000, permetLlistaPendent: true };

const registreDe = (alta, usuari) => ({
  usuariId: usuari, kid: aBase64url(alta.identitat.kid), sigPub: aBase64url(alta.identitat.sigPub), dhPub: aBase64url(alta.identitat.dhPub),
  declaracio: alta.publicacio.declaracio, autofirma: alta.publicacio.autofirma, kidAnterior: null, firmaContinuitat: null,
  retiradaAl: null, copia: alta.publicacio.copia
});
function servidorNou() {
  const claus = new Map(), missatges = [], epoques = [];
  const impl = (usuari) => ({
    laMevaIdentitatXat: vi.fn(async () => claus.has(usuari) ? [claus.get(usuari)] : []),
    publicaIdentitatXat: vi.fn(async (publicacio) => {
      if (claus.has(usuari)) throw new Error('SDP-XAT-041');
      const v = llegixDeclaracioClau(deBase64url(publicacio.declaracio));
      const { kidDe } = await import('./xifratXatFormats.js');
      const kid = aBase64url(await kidDe(cripto, { usuari, sigPub: v.sigPub, dhPub: v.dhPub }));
      claus.set(usuari, { usuariId: usuari, kid, sigPub: aBase64url(v.sigPub), dhPub: aBase64url(v.dhPub), ...publicacio, retiradaAl: null });
      return kid;
    }),
    loadFils: vi.fn(async () => [{ id: FIL, tipus: 'directe', altres: [{ id: usuari === A ? B : A, tipus: 'persona' }] }]),
    loadMissatges: vi.fn(async () => missatges.map((m) => ({ ...m }))),
    enviaMissatge: vi.fn(async () => { throw new Error('fuga en clar'); }),
    clausDeXat: vi.fn(async (ids) => ids.map((id) => claus.get(id)).filter(Boolean)),
    epoquesDelFilXat: vi.fn(async (_fil, desDe) => epoques.filter((e) => e.epoca > desDe)),
    sobresMeusXat: vi.fn(async (_fil, ids) => epoques.filter((e) => ids.includes(e.epoca)).flatMap((e) => e.sobres.filter((s) => s.receptor === usuari).map((s) => ({ ...s, epoca: e.epoca })))),
    enviaXifratXat: vi.fn(async (fil, paquet) => {
      if (paquet.epocaNova) epoques.push(paquet.epocaNova);
      const fila = { id: paquet.id, filId: fil, usuariId: usuari, seq: missatges.length + 1, text: null, xifrat: paquet.xifrat, comOrgId: null, respostaA: paquet.respostaA ?? null };
      missatges.push(fila); return fila;
    })
  });
  return { claus, missatges, epoques, impl };
}
function part(servidor, usuari, extra = {}) {
  const idb = creaIdbFalsEstructurat();
  const magatzem = creaMagatzemXat({ idb, rangs: idb.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T });
  const config = Object.freeze({ backendId: 'supabase', backendUrl: 'https://example.test', dataMode: 'remote' });
  const context = Object.freeze({ usuari, backendId: 'supabase', endpoint: 'https://example.test', ambitEstable: JSON.stringify(['prova', usuari, `persona::${usuari}`]), config });
  let actual = context;
  const impl = servidor.impl(usuari);
  const control = creaActivacioXat({ impl, entorn: { cripto, indexedDB: idb, isSecureContext: true, origen: 'https://socdepoble.org' }, magatzem, capturaContext: () => actual, ara: () => T, opcionsAlta, ...extra });
  return { control, impl, magatzem, ci: clauIdentitat({ backendId: 'supabase', endpoint: 'https://example.test', joId: usuari }), canvia: () => { actual = Object.freeze({ ...context }); } };
}

test('F2a dues persones → opt-in fil → pipeline real → receptor, servidor només ciphertext', async () => {
  const servidor = servidorNou(), a = part(servidor, A), b = part(servidor, B);
  const frases = [];
  await a.control.alta(async (indexs) => { frases.push(indexs); return true; });
  await b.control.alta(async () => true);
  expect(frases[0].every((n) => n === 0)).toBe(true);
  await expect(a.control.backend.enviaMissatge(FIL, { id: ID, text: 'privat' })).rejects.toMatchObject({ codi: 'opt-in-pendent' });
  await a.control.activaFil(FIL); await b.control.activaFil(FIL);
  await a.control.backend.enviaMissatge(FIL, { id: ID, text: 'Memòria del poble' });
  const files = await b.control.backend.loadMissatges(FIL);
  expect(files[0].text).toBe('Memòria del poble');
  expect(files[0].seguretat.xifrat).toBe(true);
  expect(servidor.missatges[0].text).toBeNull();
  expect(JSON.stringify(servidor.missatges)).not.toContain('Memòria');
  expect(a.impl.enviaMissatge).not.toHaveBeenCalled();
});

test('F2a no recrea identitat si existeix al servidor i IndexedDB és buit', async () => {
  const servidor = servidorNou(); const a = part(servidor, A);
  await a.control.alta(async () => true);
  const nou = part(servidor, A);
  await expect(nou.control.alta(async () => true)).rejects.toMatchObject({ codi: 'identitat-ja-existent' });
  expect(nou.impl.publicaIdentitatXat).not.toHaveBeenCalled();
  expect(await nou.magatzem.identitat(nou.ci)).toBeNull();
});

test('cerimònia cancel·lada no publica ni desa i esborra la frase', async () => {
  const servidor = servidorNou(), a = part(servidor, A); let frase;
  await expect(a.control.alta(async (p) => { frase = p; return false; })).rejects.toMatchObject({ codi: 'cerimonia-cancellada' });
  expect(frase.every((n) => n === 0)).toBe(true);
  expect(a.impl.publicaIdentitatXat).not.toHaveBeenCalled();
  expect(await a.magatzem.identitat(a.ci)).toBeNull();
});

test('canvi A→B durant cerimònia invalida publicació, conversa i operacions següents', async () => {
  const servidor = servidorNou(), a = part(servidor, A);
  await expect(a.control.alta(async () => { a.canvia(); return true; })).rejects.toMatchObject({ codi: 'ambit-canviat' });
  expect(a.impl.publicaIdentitatXat).not.toHaveBeenCalled();
  await expect(a.control.activaFil(FIL)).rejects.toMatchObject({ codi: 'ambit-canviat' });
});

test('publicació fallida o ACK divergent no desa claus locals', async () => {
  for (const resultat of ['error', 'kid-equivocat']) {
    const servidor = servidorNou(), a = part(servidor, A);
    a.impl.publicaIdentitatXat.mockImplementation(async () => { if (resultat === 'error') throw new Error('xarxa'); return 'kid-equivocat'; });
    await expect(a.control.alta(async () => true)).rejects.toBeDefined();
    expect(await a.magatzem.identitat(a.ci)).toBeNull();
  }
});

test('cerimònies concurrents fallen abans de crear dues identitats', async () => {
  const servidor = servidorNou(), a = part(servidor, A);
  let deixa;
  const aturat = new Promise((resolve) => { deixa = resolve; });
  let dins;
  const entrada = new Promise((resolve) => { dins = resolve; });
  const primera = a.control.alta(async () => { dins(); await aturat; return true; });
  await entrada;
  await expect(a.control.alta(async () => true)).rejects.toMatchObject({ codi: 'cerimonia-en-curs' });
  deixa(); await primera;
  expect(a.impl.publicaIdentitatXat).toHaveBeenCalledOnce();
});

test('lectura d’A pendent rebutjada després del canvi de sessió, i backend tancat no opera', async () => {
  const servidor = servidorNou(), a = part(servidor, A); let deixa;
  a.impl.loadFils.mockImplementation(() => new Promise((resolve) => { deixa = resolve; }));
  const lectura = a.control.backend.loadFils();
  a.canvia(); deixa([]);
  await expect(lectura).rejects.toMatchObject({ codi: 'ambit-canviat' });
  a.control.tanca();
  expect(() => a.control.backend.loadFils()).toThrow('ambit-canviat');
});

test('origen incrustat o desconegut no inicia ni la cerimònia', () => {
  for (const entorn of [{ isSecureContext: true, origen: 'https://intrus.test' }, { isSecureContext: true, origen: 'https://socdepoble.org', enMarc: true }]) {
    expect(() => creaActivacioXat({ entorn, capturaContext: () => null })).toThrow('origen-no-confiat');
  }
});

test('frase restaura mateixa identitat en magatzem nou i torna a llegir conversa anterior', async () => {
  const servidor = servidorNou(), a = part(servidor, A), b = part(servidor, B); let frase;
  await a.control.alta(async (p) => { frase = Uint16Array.from(p); return true; });
  await b.control.alta(async () => true);
  await b.control.activaFil(FIL); await a.control.activaFil(FIL);
  await b.control.backend.enviaMissatge(FIL, { id: ID, text: 'història anterior' });
  const nou = part(servidor, A);
  await nou.control.restauraFrase(frase); frase.fill(0);
  await nou.control.activaFil(FIL);
  expect((await nou.control.backend.loadMissatges(FIL))[0].text).toBe('història anterior');
  const identitat = await nou.magatzem.identitat(nou.ci);
  expect(aBase64url(identitat.kid)).toBe(servidor.claus.get(A).kid);
  expect(identitat.sigPriv.extractable).toBe(false);
});

let social;
beforeAll(async () => {
  const alta = await creaAlta(cripto, { usuari: A, creatMs: T, ...opcionsAlta });
  const amics = await Promise.all([B, C, D].map((usuari) => creaAlta(cripto, { usuari, creatMs: T, ...opcionsAlta })));
  const rkLocal = alta.identitat.recuperacio;
  const rk = await desxifraAesGcm(cripto, rkLocal.dk, { xifrat: rkLocal.rk, iv: rkLocal.iv, aad: ajunta(infoHkdf('rk-local'), uuid16(A), alta.identitat.kid) });
  const r = await reparteix(cripto, { rk, usuari: A, kid: alta.identitat.kid, amics: amics.map((a) => ({ amic: a.identitat.usuari, kidAmic: a.identitat.kid })) });
  rk.fill(0);
  const declaracio = construeixDeclaracio({ usuari: A, kid: alta.identitat.kid, repartiment: r.repartiment, repartimentAnterior: null, versio: 1, creatMs: T,
    amics: r.fragments.map((f) => ({ amic: f.amic, kidAmic: f.kidAmic, x: f.x, envHash: aleatori(cripto, 32), hF: f.hF })) });
  const firma = await signa(cripto, alta.identitat.sigPriv, declaracio);
  const efimera = await generaParellaDh(cripto), epk = await exportaPublica(cripto, efimera.publicKey), caducaMs = T + 60000;
  const alliberaments = [];
  for (let k = 0; k < 3; k += 1) {
    const f = r.fragments[k], amic = amics[k].identitat;
    const info = { usuari: A, kid: alta.identitat.kid, repartiment: r.repartiment, peticio: PET, epk, amic: f.amic, kidAmic: f.kidAmic, x: f.x, caducaMs };
    const hT = await hashVerificacio(cripto, construeixVerificacio(info));
    const nD = aleatori(cripto, 32), nA = aleatori(cripto, 32), cD = await compromisSas(cripto, { hT, nD });
    const aprovacio = construeixAprovacio({ hT, nD, nA, cD }), infoAlliberament = construeixInfoAlliberament(info);
    const firmaAmic = await signa(cripto, amic.sigPriv, aprovacio);
    const sobre = await segellaAlliberament(cripto, { pkR: epk, infoAlliberament, aprovacio, fragment: f.fragment, firma: firmaAmic });
    alliberaments.push({ ...sobre, infoAlliberament, aprovacio, tornada: await codiTornada(cripto, { hT, nD, nA }), sigPubAmic: amic.sigPub, dhPubAmic: amic.dhPub });
  }
  esborraFragments(r.fragments); alta.indexs.fill(0); amics.forEach((a) => a.indexs.fill(0));
  social = { usuari: A, registre: registreDe(alta, A), declaracioVigent: declaracio, declaracio, firma, peticio: PET, epk, skR: efimera.privateKey, caducaMs, alliberaments, ara: () => T };
});

test('F7 complet: 3 alliberaments HPKE + SAS + firma + hF reconstrueixen la mateixa identitat F2a', async () => {
  const identitat = await restauraIdentitatSocial(cripto, social);
  expect(aBase64url(identitat.kid)).toBe(social.registre.kid);
  expect(identitat.dhPriv.extractable).toBe(false);
});
test('F7 → consumidor → magatzem nou → envia, restaura altre aparell i llig conversa històrica', async () => {
  const servidor = servidorNou(); servidor.claus.set(A, social.registre);
  const material = Object.freeze({ revisio: 1, declaracio: social.declaracio, exigixVigent: () => {} });
  const extra = { llegixMaterialSocial: async () => material };
  const a = part(servidor, A, extra), b = part(servidor, B);
  await b.control.alta(async () => true);
  await a.control.restauraSocial(social);
  await a.control.activaFil(FIL); await b.control.activaFil(FIL);
  await b.control.backend.enviaMissatge(FIL, { id: ID, text: 'recuperació del fil' });
  const nou = part(servidor, A, extra);
  await nou.control.restauraSocial(social);
  await nou.control.activaFil(FIL);
  expect((await nou.control.backend.loadMissatges(FIL))[0].text).toBe('recuperació del fil');
  expect(nou.impl.publicaIdentitatXat).not.toHaveBeenCalled();
});
test('F7 revalida material vigent abans de desar; revocació no desa identitat', async () => {
  const servidor = servidorNou(); servidor.claus.set(A, social.registre); let lectures = 0;
  const material = { revisio: 1, declaracio: social.declaracio, exigixVigent: () => {} };
  const a = part(servidor, A, { llegixMaterialSocial: async () => ({ ...material, revisio: ++lectures }) });
  await expect(a.control.restauraSocial(social)).rejects.toMatchObject({ codi: 'material-social-canviat' });
  expect(await a.magatzem.identitat(a.ci)).toBeNull();
});
test('F7 rebutja menys de 3, SDPC antiga, amic substituït, petició incorrecta, SAS erroni i caducitat', async () => {
  await expect(restauraIdentitatSocial(cripto, { ...social, alliberaments: social.alliberaments.slice(0, 2) })).rejects.toMatchObject({ codi: 'llindar-social-invalid' });
  await expect(restauraIdentitatSocial(cripto, { ...social, declaracioVigent: new Uint8Array(social.declaracio.length) })).rejects.toMatchObject({ codi: 'declaracio-social-invalida' });
  await expect(restauraIdentitatSocial(cripto, { ...social, peticio: FIL })).rejects.toMatchObject({ codi: 'alliberament-no-vinculat' });
  await expect(restauraIdentitatSocial(cripto, { ...social, alliberaments: social.alliberaments.map((a, i) => i === 0 ? { ...a, sigPubAmic: social.alliberaments[1].sigPubAmic } : a) })).rejects.toMatchObject({ codi: 'alliberament-no-vinculat' });
  await expect(restauraIdentitatSocial(cripto, { ...social, alliberaments: social.alliberaments.map((a) => ({ ...a, tornada: 'xxxxxx' })) })).rejects.toMatchObject({ codi: 'TORNADA_INCORRECTA' });
  await expect(restauraIdentitatSocial(cripto, { ...social, ara: () => T + 60000 })).rejects.toMatchObject({ codi: 'recuperacio-caducada' });
});
test('F7 RK incorrecta no restaura i sempre esborra bytes de qui crida', async () => {
  const rk = aleatori(cripto, 32);
  await expect(restauraAmbRk(cripto, { usuari: A, registre: social.registre, rk })).rejects.toBeDefined();
  expect(rk.every((n) => n === 0)).toBe(true);
});
