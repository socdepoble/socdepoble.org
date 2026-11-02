// @vitest-environment node
/* G2-A-seg-02 (Gauntlet 2, marató 261101_2143; disseny §2.4 i §4.4; IDEA-48) · El recompte
   de «Persones de confiança» no diu al servidor quins contactes has verificat. La marca de
   verificat és d'este aparell (IndexedDB): el transport veu sempre la mateixa petició, amb
   0, 1 o N verificats, en marcar i en desmarcar, també en lots de 256. Els verificats es
   filtren a l'aparell. Tampoc no ho diuen el desenllaç d'una fallada que provoca el
   servidor (ARB-01: sempre rebuig) ni el treball de l'aparell abans de la petició (ARB-03:
   temporitzadors, WebCrypto i torns de l'IndexedDB). WebCrypto de veres, magatzem
   IndexedDB fals i un doble de servidor en memòria (el de
   xifratXat.numeroSeguretat.seguretat.test.js). Bandera real apagada: ací el decorador
   s'activa per paràmetre. */
import { describe, expect, test, vi } from 'vitest';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
import { CAPACITATS, CONTRACTE_NUCLI } from './contracte.js';
import { creaIdentitat } from './xifratXatProtocol.js';
import { creaMagatzemXat } from './xifratXatMagatzem.js';
import { aBase64url } from './xifratXatCripto.js';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';

const cripto = globalThis.crypto;
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const C = 'cccccccc-3333-4333-8333-333333333333';
const D = 'dddddddd-4444-4444-8444-444444444444';
const FIL_B = 'f0000000-0000-4000-8000-000000000001';
const FIL_C = 'f0000000-0000-4000-8000-000000000002';
const FIL_D = 'f0000000-0000-4000-8000-000000000007';
const ORIGEN = 'https://socdepoble.org';
const T0 = Date.UTC(2026, 10, 1, 12);
const ci = (u) => JSON.stringify(['supabase', 'https://backend.example.test', u]);
const ambit = (u) => JSON.stringify(['backend-sintetic', u, `persona::${u}`]);

function creaServidor() {
  const claus = new Map();
  const filsDe = {
    [A]: [
      { id: FIL_B, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] },
      { id: FIL_C, tipus: 'directe', altres: [{ id: C, tipus: 'persona' }] },
      { id: FIL_D, tipus: 'directe', altres: [{ id: D, tipus: 'persona' }] }
    ]
  };
  const publica = (jo, identitat) => claus.set(jo, { usuariId: jo, kid: aBase64url(identitat.kid), sigPub: aBase64url(identitat.sigPub), dhPub: aBase64url(identitat.dhPub) });
  const adaptadorDe = (jo) => ({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((n) => [n, vi.fn()])),
    ...Object.fromEntries([...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat, ...CAPACITATS.xatMultimedia].map((n) => [n, vi.fn(async () => { throw new Error(`no simulat: ${n}`); })])),
    loadFils: vi.fn(async () => (filsDe[jo] ?? []).map((f) => ({ ...f }))),
    loadMissatges: vi.fn(async () => []),
    enviaMissatge: vi.fn(async () => { throw new Error('text en clar al transport!'); }),
    clausDeXat: vi.fn(async (usuaris) => usuaris.map((u) => claus.get(u)).filter(Boolean)),
    epoquesDelFilXat: vi.fn(async () => []),
    sobresMeusXat: vi.fn(async () => []),
    estatXifratXat: vi.fn(async () => [])
  });
  return { publica, adaptadorDe };
}

async function creaPart(servidor, jo) {
  const fals = creaIdbFalsEstructurat();
  const magatzem = creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T0 });
  const identitat = await creaIdentitat(cripto, { usuari: jo, creatMs: T0 });
  await magatzem.desaIdentitat(ci(jo), identitat);
  servidor.publica(jo, identitat);
  const impl = servidor.adaptadorDe(jo);
  const d = ambXifratXat(impl, { actiu: true, isSecureContext: true, origen: ORIGEN, cripto, indexedDB: fals, magatzem, ara: () => T0 });
  const servei = serveiXifratXat(d);
  servei.fixaAmbit(ambit(jo), ci(jo));
  return { impl, magatzem, servei };
}

/* Tot el que el transport veu d'un recompte: cada mètode cridat, amb els seus arguments, en ordre. */
async function tracaDelRecompte(part, config) {
  for (const f of Object.values(part.impl)) f.mockClear?.();
  const n = config === undefined ? await part.servei.contactesVerificats() : await part.servei.contactesVerificats(config);
  /* Una còpia, no la llista viva del simulacre (que les crides següents tornarien a omplir). */
  const crides = structuredClone(Object.entries(part.impl).filter(([, f]) => f.mock?.calls.length).map(([nom, f]) => [nom, f.mock.calls]));
  return { n, crides };
}

/* El desenllaç d'un recompte quan el servidor fa fallar la crida (`falla` és la resposta d'una
   sola crida), i les crides que ha vist. L'àmbit d'A es restablix després. */
async function desenllacAmbFallada(part, ...falles) {
  part.impl.clausDeXat.mockClear();
  for (const falla of falles) part.impl.clausDeXat.mockImplementationOnce(falla);
  const desenllac = await part.servei.contactesVerificats().then((n) => ['xifra', n], (e) => ['rebuig', e?.code ?? e?.message]);
  part.servei.fixaAmbit(ambit(A), ci(A));
  return { desenllac, crides: structuredClone(part.impl.clausDeXat.mock.calls) };
}

/* ARB-03 · Tot el que fa l'aparell des que comença un recompte fins que ix la primera petició:
   temporitzadors (amb el termini), operacions de WebCrypto i torns de l'IndexedDB fals
   (setImmediate), en ordre d'invocació. Si depenguera de la marca, el temps de resposta la diria. */
const METODES_SUBTLE = Object.getOwnPropertyNames(Object.getPrototypeOf(cripto.subtle)).filter((n) => n !== 'constructor' && typeof cripto.subtle[n] === 'function');
async function treballAbansDeLaPeticio(part) {
  for (const f of Object.values(part.impl)) f.mockClear?.();
  const espies = [
    ...['setTimeout', 'setInterval'].map((nom) => [nom, vi.spyOn(globalThis, nom), (args) => `${nom}:${args[1] ?? 0}`]),
    ['setImmediate', vi.spyOn(globalThis, 'setImmediate'), () => 'torn'],
    ...METODES_SUBTLE.map((nom) => [nom, vi.spyOn(cripto.subtle, nom), () => `subtle.${nom}`])
  ];
  try {
    const n = await part.servei.contactesVerificats();
    const [peticio] = part.impl.clausDeXat.mock.invocationCallOrder;
    const fets = espies.flatMap(([, espia, etiqueta]) => espia.mock.invocationCallOrder.map((ordre, i) => [ordre, etiqueta(espia.mock.calls[i])]));
    const abans = fets.filter(([ordre]) => ordre < peticio).sort((x, y) => x[0] - y[0]).map(([, fet]) => fet);
    const subtleDespres = fets.filter(([ordre, fet]) => ordre > peticio && fet.startsWith('subtle.')).length;
    return { n, peticio: peticio !== undefined, abans, subtleDespres };
  } finally {
    for (const [, espia] of espies) espia.mockRestore();
  }
}

/* A amb B, C i D fixats (ha obert el número dels tres directes), cap verificat. */
async function tresFixats() {
  const servidor = creaServidor();
  const a = await creaPart(servidor, A);
  for (const u of [B, C, D]) await creaPart(servidor, u);
  const kids = {};
  for (const [u, fil] of [[B, FIL_B], [C, FIL_C], [D, FIL_D]]) kids[u] = (await a.servei.numeroSeguretat(fil)).kid;
  const marca = (u, verificat) => a.servei.marcaVerificat({ [B]: FIL_B, [C]: FIL_C, [D]: FIL_D }[u], { kid: kids[u], verificat });
  return { a, marca };
}

describe('recompte de «Persones de confiança» sense delatar els verificats (G2-A-seg-02)', () => {
  test('la petició al transport és idèntica amb 0, 1, 2 o 3 verificats i en desmarcar; la xifra es calcula a l’aparell', async () => {
    const { a, marca } = await tresFixats();
    const base = await tracaDelRecompte(a);
    expect(base.n).toBe(0);
    /* Una sola crida, amb totes les persones fixades en ordre d'usuari, i res més (cap estat, època ni fil). */
    expect(base.crides).toEqual([['clausDeXat', [[[B, C, D].sort(), {}]]]]);

    const passos = [
      [() => marca(B, true), 1],
      [() => marca(D, true), 2],
      [() => marca(C, true), 3],
      [() => marca(D, false), 2],
      [() => marca(B, false), 1],
      [() => marca(C, false), 0]
    ];
    for (const [fes, esperat] of passos) {
      await fes();
      const t = await tracaDelRecompte(a);
      expect(t.n).toBe(esperat);
      expect(t.crides).toEqual(base.crides);
    }
  });

  test('la configuració del transport (tenant) passa igual i la petició continua sense dependre de la marca', async () => {
    const { a, marca } = await tresFixats();
    const config = { tenantId: 't-1' };
    const zero = await tracaDelRecompte(a, config);
    await marca(C, true);
    const un = await tracaDelRecompte(a, config);
    expect([zero.n, un.n]).toEqual([0, 1]);
    expect(zero.crides).toEqual([['clausDeXat', [[[B, C, D].sort(), config]]]]);
    expect(un.crides).toEqual(zero.crides);
  });

  test('amb més de 256 persones fixades, els mateixos lots en el mateix ordre, siga qui siga el verificat', async () => {
    const { a, marca } = await tresFixats();
    /* 300 fixacions més (llibreta d'un altre aparell, fils vells): el servidor no en té cap fila activa. */
    const sintetics = Array.from({ length: 300 }, () => cripto.randomUUID());
    for (const usuari of sintetics) await a.magatzem.fixa(ci(A), { usuari, kid: cripto.getRandomValues(new Uint8Array(16)), verificat: false, vistAl: T0 });
    const tots = [B, C, D, ...sintetics].sort();
    const lots = [[tots.slice(0, 256), {}], [tots.slice(256), {}]];

    const zero = await tracaDelRecompte(a);
    expect(zero.n).toBe(0);
    expect(zero.crides).toEqual([['clausDeXat', lots]]);
    /* El servidor fa fallar el segon lot: les mateixes crides i el mateix rebuig, amb 0 o amb verificats (ARB-01). */
    const original = a.impl.clausDeXat.getMockImplementation();
    const segonLot = async () => { throw new Error('lot 2'); };
    const zeroFalla = await desenllacAmbFallada(a, original, segonLot);
    expect(zeroFalla).toEqual({ desenllac: ['rebuig', 'lot 2'], crides: lots });

    await marca(D, true);
    const ambD = await tracaDelRecompte(a);
    expect(ambD.n).toBe(1);
    expect(ambD.crides).toEqual(zero.crides);
    expect(await desenllacAmbFallada(a, original, segonLot)).toEqual(zeroFalla);

    /* Un verificat sense cap fila activa al servidor no compta, i tampoc canvia la petició. */
    const fila = await a.magatzem.fixacio(ci(A), sintetics[299]);
    await a.magatzem.fixa(ci(A), { usuari: sintetics[299], kid: fila.kid, verificat: true, vistAl: T0 });
    const ambSintetic = await tracaDelRecompte(a);
    expect(ambSintetic.n).toBe(1);
    expect(ambSintetic.crides).toEqual(zero.crides);
  });

  test('una petició que falla rebutja sempre, amb 0 o amb N verificats i amb les mateixes crides (ARB-01); un canvi d’àmbit sempre és AMBIT_CANVIAT', async () => {
    const { a, marca } = await tresFixats();
    const original = a.impl.clausDeXat.getMockImplementation();
    const xarxa = async () => { throw new Error('xarxa'); };
    const ambitEnFallar = async () => { a.servei.fixaAmbit(ambit(B), ci(B)); throw new Error('xarxa'); };
    const ambitEnRespondre = async (...args) => { a.servei.fixaAmbit(ambit(B), ci(B)); return original(...args); };
    const provoca = async () => ({
      xarxa: await desenllacAmbFallada(a, xarxa),
      ambitEnFallar: await desenllacAmbFallada(a, ambitEnFallar),
      ambitEnRespondre: await desenllacAmbFallada(a, ambitEnRespondre)
    });

    const zero = await provoca();
    expect(zero.xarxa).toEqual({ desenllac: ['rebuig', 'xarxa'], crides: [[[B, C, D].sort(), {}]] });
    expect(zero.ambitEnFallar.desenllac).toEqual(['rebuig', 'AMBIT_CANVIAT']);
    expect(zero.ambitEnRespondre.desenllac).toEqual(['rebuig', 'AMBIT_CANVIAT']);
    /* Passada la fallada, la xifra torna (mai una de vella). */
    expect(await a.servei.contactesVerificats()).toBe(0);

    await marca(B, true);
    expect(await provoca()).toEqual(zero);
    expect(await a.servei.contactesVerificats()).toBe(1);
    await marca(D, true);
    expect(await provoca()).toEqual(zero);
    expect(await a.servei.contactesVerificats()).toBe(2);
  });

  test('sense cap persona fixada no hi ha cap petició; sense transport, 0 verificats és 0 i amb verificats sense-capacitat-e2ee', async () => {
    const servidor = creaServidor();
    const sola = await creaPart(servidor, A);
    expect(await sola.servei.contactesVerificats()).toBe(0);
    expect(sola.impl.clausDeXat).not.toHaveBeenCalled();

    const { a, marca } = await tresFixats();
    await marca(C, true);
    const clausDeXat = a.impl.clausDeXat;
    delete a.impl.clausDeXat;
    await expect(a.servei.contactesVerificats()).rejects.toMatchObject({ codi: 'sense-capacitat-e2ee' });
    a.impl.clausDeXat = clausDeXat;
    await marca(C, false);
    delete a.impl.clausDeXat;
    expect(await a.servei.contactesVerificats()).toBe(0);
    a.impl.clausDeXat = clausDeXat;
  });

  test('abans de la petició, l’aparell fa el mateix treball amb 0, 1, 2 o 3 verificats i en desmarcar (ARB-03): cap temporitzador, operació de WebCrypto ni lectura que depenga de la marca', async () => {
    const { a, marca } = await tresFixats();
    const base = await treballAbansDeLaPeticio(a);
    expect(base).toMatchObject({ n: 0, peticio: true });

    const passos = [
      [() => marca(B, true), 1],
      [() => marca(D, true), 2],
      [() => marca(C, true), 3],
      [() => marca(B, false), 2],
      [() => marca(D, false), 1],
      [() => marca(C, false), 0]
    ];
    for (const [fes, esperat] of passos) {
      await fes();
      const t = await treballAbansDeLaPeticio(a);
      expect(t.n).toBe(esperat);
      expect(t.abans).toEqual(base.abans);
      /* Control de l'espia: amb verificats, la comprovació de la clau (WebCrypto) es fa, però després de la petició. */
      if (esperat > 0) expect(t.subtleDespres).toBeGreaterThan(0);
    }
  });
});
