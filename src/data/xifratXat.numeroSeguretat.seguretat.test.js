// @vitest-environment node
/* P1-12 pas 17 (pla 261101_1246, T7 · S5; disseny §4.4) · El número de seguretat
   d'un directe i «Marca com a verificat», amb WebCrypto de veres, dos (i tres)
   persones, cadascuna amb el seu decorador, el seu magatzem IndexedDB fals i la
   seua identitat, sobre un doble de servidor en memòria (el de
   xifratXat.pipeline.seguretat.test.js). Comprova: el mateix número als dos
   aparells; la marca només per al kid mostrat (TOCTOU) i mai substituint una
   fixació diferent; cap número fora d'un directe entre dues persones, i sense
   tocar el transport de claus; un canvi d'àmbit a mig càlcul ho descarta tot;
   sense motor, un rebuig explícit. Bandera real apagada: ací el decorador
   s'activa per paràmetre. */
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
import { CAPACITATS, CONTRACTE_NUCLI } from './contracte.js';
import { creaIdentitat } from './xifratXatProtocol.js';
import { creaMagatzemXat } from './xifratXatMagatzem.js';
import { aBase64url } from './xifratXatCripto.js';
import { IAIA_UUID } from '../config/xifratXat.js';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';

const cripto = globalThis.crypto;
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const C = 'cccccccc-3333-4333-8333-333333333333';
const D = 'dddddddd-4444-4444-8444-444444444444';
const ORG = '99999999-9999-4999-8999-999999999999';
const FIL = 'f0000000-0000-4000-8000-000000000001';
const FIL_C = 'f0000000-0000-4000-8000-000000000002';
const FIL_ENTITAT = 'f0000000-0000-4000-8000-000000000003';
const FIL_GRUP = 'f0000000-0000-4000-8000-000000000004';
const FIL_CANAL = 'f0000000-0000-4000-8000-000000000005';
const FIL_IAIA = 'f0000000-0000-4000-8000-000000000006';
const FIL_D = 'f0000000-0000-4000-8000-000000000007';
const FIL_INCOMPLET = 'f0000000-0000-4000-8000-000000000008';
const ORIGEN = 'https://socdepoble.org';
const T0 = Date.UTC(2026, 10, 1, 12);
const FORMA_NUMERO = /^(\d{5} ){11}\d{5}$/;
const ci = (u) => JSON.stringify(['supabase', 'https://backend.example.test', u]);
const ambit = (u) => JSON.stringify(['backend-sintetic', u, `persona::${u}`]);

/* El servidor: claus públiques i els fils de cada persona. Cap missatge fa falta per al número. */
function creaServidor() {
  const claus = new Map();
  const filsDe = {
    [A]: [
      { id: FIL, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] },
      { id: FIL_C, tipus: 'directe', altres: [{ id: C, tipus: 'persona' }] },
      { id: FIL_ENTITAT, tipus: 'directe', org_id: ORG, altres: [{ id: ORG, tipus: 'entitat' }] },
      { id: FIL_INCOMPLET, tipus: 'directe', altres: [{ id: ORG, tipus: 'entitat' }] },
      { id: FIL_GRUP, tipus: 'grup', altres: [{ id: B, tipus: 'persona' }, { id: C, tipus: 'persona' }] },
      { id: FIL_CANAL, tipus: 'canal' },
      { id: FIL_IAIA, tipus: 'directe', altres: [{ id: IAIA_UUID, tipus: 'persona' }] },
      { id: FIL_D, tipus: 'directe', altres: [{ id: D, tipus: 'persona' }] }
    ],
    [B]: [{ id: FIL, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] }],
    [D]: [{ id: FIL_D, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] }]
  };
  const publica = (jo, identitat) => claus.set(jo, { usuariId: jo, kid: aBase64url(identitat.kid), sigPub: aBase64url(identitat.sigPub), dhPub: aBase64url(identitat.dhPub) });
  /* B2a · Amb la declaració SDPK autofirmada (la que donarà xat_publica_identitat): la candidata d'un canvi fort. */
  const publicaDeclarada = (jo, identitat) => claus.set(jo, {
    usuariId: jo, kid: aBase64url(identitat.kid), sigPub: aBase64url(identitat.sigPub), dhPub: aBase64url(identitat.dhPub),
    declaracio: aBase64url(identitat.declaracio), autofirma: aBase64url(identitat.autofirma), firmaContinuitat: null
  });
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
  return { claus, publica, publicaDeclarada, adaptadorDe };
}

async function creaPart(servidor, jo, { ambIdentitat = true, origen = ORIGEN, embolcallaMagatzem = null } = {}) {
  const fals = creaIdbFalsEstructurat();
  const real = creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T0 });
  const magatzem = embolcallaMagatzem ? embolcallaMagatzem(real) : real;
  const identitat = await creaIdentitat(cripto, { usuari: jo, creatMs: T0 });
  if (ambIdentitat) {
    await real.desaIdentitat(ci(jo), identitat);
    servidor.publica(jo, identitat);
  }
  const impl = servidor.adaptadorDe(jo);
  const d = ambXifratXat(impl, { actiu: true, isSecureContext: true, origen, cripto, indexedDB: fals, magatzem, ara: () => T0 });
  const servei = serveiXifratXat(d);
  servei.fixaAmbit(ambit(jo), ci(jo));
  return { d, impl, magatzem: real, identitat, servei };
}

describe('número de seguretat d’un directe (dos aparells, WebCrypto de veres)', () => {
  let servidor;
  let a;
  let b;
  beforeAll(async () => {
    servidor = creaServidor();
    a = await creaPart(servidor, A);
    b = await creaPart(servidor, B);
  });

  test('el mateix número de 60 xifres als dos aparells, amb el kid de l’altra persona i sense verificar', async () => {
    const perA = await a.servei.numeroSeguretat(FIL);
    const perB = await b.servei.numeroSeguretat(FIL);
    expect(perA.numero).toMatch(FORMA_NUMERO);
    expect(perA.numero).toBe(perB.numero);
    expect(perA).toMatchObject({ usuari: B, kid: aBase64url(b.identitat.kid), verificat: false, pendent: false });
    expect(perB).toMatchObject({ usuari: A, kid: aBase64url(a.identitat.kid), verificat: false, pendent: false });
    expect(Object.isFrozen(perA)).toBe(true);
    /* El número no viatja: cap crida d'escriptura al transport. */
    expect(a.impl.enviaMissatge).not.toHaveBeenCalled();
    expect(a.impl.enviaXifratXat).not.toHaveBeenCalled();
  });

  test('«Marca com a verificat» desa la marca a la fixació d’este aparell; el recompte la veu; llevar-la la torna a false', async () => {
    const { kid } = await a.servei.numeroSeguretat(FIL);
    const marcat = await a.servei.marcaVerificat(FIL, { kid, verificat: true });
    expect(marcat).toMatchObject({ usuari: B, kid, verificat: true });
    expect((await a.magatzem.fixacio(ci(A), B)).verificat).toBe(true);
    expect((await a.servei.numeroSeguretat(FIL)).verificat).toBe(true);
    expect(await a.servei.contactesVerificats()).toBe(1);
    /* La marca és d'este aparell: l'altra persona no en sap res. */
    expect(await b.servei.contactesVerificats()).toBe(0);
    expect((await b.servei.numeroSeguretat(FIL)).verificat).toBe(false);

    const desmarcat = await a.servei.marcaVerificat(FIL, { kid, verificat: false });
    expect(desmarcat.verificat).toBe(false);
    expect((await a.magatzem.fixacio(ci(A), B)).verificat).toBe(false);
    expect(await a.servei.contactesVerificats()).toBe(0);
  });

  test('TOCTOU: amb un kid que no és el de la clau d’ara, kid-canviat i cap escriptura', async () => {
    const vell = aBase64url(cripto.getRandomValues(new Uint8Array(16)));
    await expect(a.servei.marcaVerificat(FIL, { kid: vell, verificat: true })).rejects.toMatchObject({ codi: 'kid-canviat', reintentable: false });
    await expect(a.servei.marcaVerificat(FIL, { verificat: true })).rejects.toMatchObject({ codi: 'kid-canviat' });
    expect((await a.magatzem.fixacio(ci(A), B)).verificat).toBe(false);
    expect(await a.servei.contactesVerificats()).toBe(0);
  });

  /* B2a (marató 261101_2143) · Girada: abans fixava el defecte (el directori llançava
     kid-no-fixat i el fil queia). Ara el canvi fort queda pendent: el número és el de la clau
     nova, amb `pendent`, i «Marca com a verificat» l'accepta i la verifica (§4.4). */
  test('una clau nova sense continuïtat (canvi fort): el número de la clau nova amb pendent; la marca l’accepta i la verifica', async () => {
    const servidor2 = creaServidor();
    const a2 = await creaPart(servidor2, A);
    const d2 = await creaPart(servidor2, D);
    const { kid, numero: numeroVell } = await a2.servei.numeroSeguretat(FIL_D);
    expect(kid).toBe(aBase64url(d2.identitat.kid));
    /* D publica una identitat nova sense firma de continuïtat (amb la declaració autofirmada). */
    const nova = await creaIdentitat(cripto, { usuari: D, creatMs: T0 + 1 });
    servidor2.publicaDeclarada(D, nova);
    const pendent = await a2.servei.numeroSeguretat(FIL_D);
    expect(pendent).toMatchObject({ usuari: D, kid: aBase64url(nova.kid), verificat: false, pendent: true });
    expect(pendent.numero).toMatch(FORMA_NUMERO);
    expect(pendent.numero).not.toBe(numeroVell);
    expect(aBase64url((await a2.magatzem.fixacio(ci(A), D)).kid)).toBe(kid);
    /* El kid vell no passa el TOCTOU, i llevar la marca d'una clau no acceptada no es pot. */
    await expect(a2.servei.marcaVerificat(FIL_D, { kid, verificat: true })).rejects.toMatchObject({ codi: 'kid-canviat' });
    await expect(a2.servei.marcaVerificat(FIL_D, { kid: pendent.kid, verificat: false })).rejects.toMatchObject({ codi: 'clau-canviada-forta' });
    expect((await a2.magatzem.fixacio(ci(A), D)).verificat).toBe(false);
    expect(aBase64url((await a2.magatzem.fixacio(ci(A), D)).kid)).toBe(kid);
    const marcat = await a2.servei.marcaVerificat(FIL_D, { kid: pendent.kid, verificat: true });
    expect(marcat).toMatchObject({ usuari: D, kid: pendent.kid, numero: pendent.numero, verificat: true, pendent: false });
    const fixacio = await a2.magatzem.fixacio(ci(A), D);
    expect(fixacio.verificat).toBe(true);
    expect(aBase64url(fixacio.kid)).toBe(pendent.kid);
    expect(fixacio.anteriors.map(aBase64url)).toEqual([kid]);
    expect(await a2.servei.numeroSeguretat(FIL_D)).toMatchObject({ kid: pendent.kid, verificat: true, pendent: false });
    expect(await a2.servei.contactesVerificats()).toBe(1);
  });

  test('B2a · una clau nova sense declaració autofirmada: cap candidata, sense-clau-altre, i res es fixa', async () => {
    const servidor8 = creaServidor();
    const a8 = await creaPart(servidor8, A);
    const d8 = await creaPart(servidor8, D);
    const { kid } = await a8.servei.numeroSeguretat(FIL_D);
    servidor8.publica(D, await creaIdentitat(cripto, { usuari: D, creatMs: T0 + 1 }));
    await expect(a8.servei.numeroSeguretat(FIL_D)).rejects.toMatchObject({ codi: 'sense-clau-altre' });
    await expect(a8.servei.marcaVerificat(FIL_D, { kid, verificat: true })).rejects.toMatchObject({ codi: 'sense-clau-altre' });
    expect(aBase64url((await a8.magatzem.fixacio(ci(A), D)).kid)).toBe(aBase64url(d8.identitat.kid));
    expect((await a8.magatzem.fixacio(ci(A), D)).verificat).toBe(false);
  });

  test('dins de la transacció: si la fixació d’IndexedDB és d’una altra clau, kid-canviat (mai la substituïx)', async () => {
    const servidor3 = creaServidor();
    const a3 = await creaPart(servidor3, A, {
      embolcallaMagatzem: (real) => Object.freeze({
        ...real,
        fixa: async (ciArg, fila, opcions) => {
          if (fila?.verificat === true) throw Object.assign(new Error('Este contacte té fixada una altra clau.'), { codi: 'FIXACIO_DIFERENT' });
          return real.fixa(ciArg, fila, opcions);
        }
      })
    });
    await creaPart(servidor3, B);
    const { kid } = await a3.servei.numeroSeguretat(FIL);
    await expect(a3.servei.marcaVerificat(FIL, { kid, verificat: true })).rejects.toMatchObject({ codi: 'kid-canviat', reintentable: false });
    expect((await a3.magatzem.fixacio(ci(A), B)).verificat).toBe(false);
  });

  /* Gauntlet T7b-G04 · La primera guarda (el kid mostrat comparat en memòria) té prova
     pròpia: sense ella, el TOCTOU d'abans continuava en verd perquè la fixació TOFU
     ja el rebutjava dins de la transacció. Ací cap kid vell arriba a magatzem.fixa. */
  test('TOCTOU en memòria: un kid que no és el d’ara no arriba mai a magatzem.fixa', async () => {
    const servidor6 = creaServidor();
    const escrits = [];
    const a6 = await creaPart(servidor6, A, {
      embolcallaMagatzem: (real) => Object.freeze({
        ...real,
        fixa: async (ciArg, fila, opcions) => {
          escrits.push(aBase64url(fila.kid));
          return real.fixa(ciArg, fila, opcions);
        }
      })
    });
    await creaPart(servidor6, B);
    const { kid } = await a6.servei.numeroSeguretat(FIL);
    const vell = aBase64url(cripto.getRandomValues(new Uint8Array(16)));
    await expect(a6.servei.marcaVerificat(FIL, { kid: vell, verificat: true })).rejects.toMatchObject({ codi: 'kid-canviat', reintentable: false });
    expect(escrits.length).toBeGreaterThan(0);
    expect(escrits).not.toContain(vell);
    expect(escrits.every((k) => k === kid)).toBe(true);
    expect((await a6.magatzem.fixacio(ci(A), B)).verificat).toBe(false);
  });

  /* Gauntlet T7b-G04 · «Verificat» exigix que la fixació verificada siga de la clau
     d'ara: una fixació verificada d'una altra clau (una pestanya, una còpia vella)
     no fa dir «Verificat» a una clau que no s'ha comparat mai. */
  test('una fixació verificada d’una altra clau no fa «Verificat» la clau d’ara', async () => {
    const servidor7 = creaServidor();
    let forja = null;
    const a7 = await creaPart(servidor7, A, {
      embolcallaMagatzem: (real) => Object.freeze({
        ...real,
        /* La fixació TOFU del context (confirma) arma la forja: la lectura següent és la del número. */
        fixa: async (ciArg, fila, opcions) => {
          const desada = await real.fixa(ciArg, fila, opcions);
          if (forja) forja.armada = true;
          return desada;
        },
        fixacio: async (ciArg, usuari) => (forja?.armada && usuari === forja.pin.usuari ? forja.pin : real.fixacio(ciArg, usuari))
      })
    });
    await creaPart(servidor7, B);
    forja = { armada: false, pin: Object.freeze({ usuari: B, kid: cripto.getRandomValues(new Uint8Array(16)), verificat: true, vistAl: T0 }) };
    const resultat = await a7.servei.numeroSeguretat(FIL);
    expect(forja.armada).toBe(true);
    expect(resultat.kid).toBe(servidor7.claus.get(B).kid);
    expect(resultat.verificat).toBe(false);
  });

  test('sense claus de l’altra persona: sense-clau-altre (reintentable)', async () => {
    await expect(a.servei.numeroSeguretat(FIL_C)).rejects.toMatchObject({ codi: 'sense-clau-altre', reintentable: true });
  });

  test('sense claus pròpies en este aparell: claus-bloquejades, sense cap número', async () => {
    const servidor4 = creaServidor();
    const senseClaus = await creaPart(servidor4, A, { ambIdentitat: false });
    await creaPart(servidor4, B);
    await expect(senseClaus.servei.numeroSeguretat(FIL)).rejects.toMatchObject({ codi: 'claus-bloquejades' });
  });

  test('només en un directe entre dues persones: entitat, grup, canal públic i IAIA, sense tocar el transport de claus', async () => {
    const abans = a.impl.clausDeXat.mock.calls.length;
    await expect(a.servei.numeroSeguretat(FIL_ENTITAT)).rejects.toMatchObject({ codi: 'numero-no-directe', reintentable: false });
    await expect(a.servei.numeroSeguretat(FIL_GRUP)).rejects.toMatchObject({ codi: 'numero-no-directe' });
    await expect(a.servei.numeroSeguretat(FIL_CANAL)).rejects.toMatchObject({ codi: 'public', reintentable: false });
    await expect(a.servei.numeroSeguretat(FIL_IAIA)).rejects.toMatchObject({ codi: 'iaia' });
    /* Un directe que l'abast bloqueja (contrapart que no és cap persona, sense org_id): cap número. */
    await expect(a.servei.numeroSeguretat(FIL_INCOMPLET)).rejects.toMatchObject({ codi: 'fil-incomplet', reintentable: false });
    await expect(a.servei.marcaVerificat(FIL_GRUP, { kid: 'x', verificat: true })).rejects.toMatchObject({ codi: 'numero-no-directe' });
    await expect(a.servei.numeroSeguretat('f0000000-0000-4000-8000-0000000000ff')).rejects.toMatchObject({ codi: 'fil-desconegut' });
    expect(a.impl.clausDeXat.mock.calls.length).toBe(abans);
  });

  test('un canvi d’àmbit a mig càlcul: AbortError AMBIT_CANVIAT i cap marca desada', async () => {
    const servidor5 = creaServidor();
    const a5 = await creaPart(servidor5, A);
    await creaPart(servidor5, B);
    const { kid } = await a5.servei.numeroSeguretat(FIL);
    const original = a5.impl.clausDeXat.getMockImplementation();
    a5.impl.clausDeXat.mockImplementationOnce(async (usuaris, config) => {
      a5.servei.fixaAmbit(ambit(C), ci(C));
      return original(usuaris, config);
    });
    await expect(a5.servei.marcaVerificat(FIL, { kid, verificat: true })).rejects.toMatchObject({ name: 'AbortError', code: 'AMBIT_CANVIAT' });
    expect((await a5.magatzem.fixacio(ci(A), B)).verificat).toBe(false);
    a5.servei.fixaAmbit(ambit(A), ci(A));
    expect(await a5.servei.contactesVerificats()).toBe(0);
  });

  test('l’abast del registre propi mana: un fil conegut com a directe no passa a públic perquè el servidor ho diga', async () => {
    await a.d.loadFils();
    expect(a.servei.abastDelFil({ id: FIL, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] })).toMatchObject({ xifrat: true, motiu: 'directe-persona', tipusFil: 'directe' });
    expect(a.servei.abastDelFil({ id: FIL, tipus: 'canal' })).toMatchObject({ motiu: 'directe-persona' });
    expect(a.servei.abastDelFil({ id: 'fake-1', tipus: 'directe' })).toMatchObject({ xifrat: false, motiu: 'fil-sintetic' });
    expect(a.servei.abastDelFil(null)).toBeNull();
    expect(a.servei.entornSegur()).toBe(true);
  });
});

describe('entorn i motor', () => {
  test('un origen que no és de confiança: entornSegur false i cap número', async () => {
    const servidor = creaServidor();
    const fora = await creaPart(servidor, A, { origen: 'https://socdepoble.example' });
    await creaPart(servidor, B);
    expect(fora.servei.entornSegur()).toBe(false);
    await expect(fora.servei.numeroSeguretat(FIL)).rejects.toMatchObject({ codi: 'origen-no-confiat' });
    expect(fora.impl.clausDeXat).not.toHaveBeenCalled();
  });

  test('sense motor (sense magatzem de claus): rebuig explícit sense-motor-xifrat, entornSegur false', async () => {
    const impl = creaServidor().adaptadorDe(A);
    const d = ambXifratXat(impl, { actiu: true, isSecureContext: true, origen: ORIGEN, cripto, indexedDB: creaIdbFalsEstructurat() });
    const servei = serveiXifratXat(d);
    servei.fixaAmbit(ambit(A), ci(A));
    expect(servei.entornSegur()).toBe(false);
    expect(servei.abastDelFil({ id: FIL, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] })).toMatchObject({ motiu: 'directe-persona' });
    await expect(servei.numeroSeguretat(FIL)).rejects.toMatchObject({ codi: 'sense-motor-xifrat' });
    await expect(servei.marcaVerificat(FIL, { kid: 'x', verificat: true })).rejects.toMatchObject({ codi: 'sense-motor-xifrat' });
    await expect(servei.contactesVerificats()).rejects.toMatchObject({ codi: 'sense-motor-xifrat' });
    expect(impl.loadFils).not.toHaveBeenCalled();
  });

  test('bandera apagada: el decorador torna la mateixa instància i no hi ha cap servei', () => {
    const impl = creaServidor().adaptadorDe(A);
    expect(ambXifratXat(impl, { actiu: false })).toBe(impl);
    expect(serveiXifratXat(impl)).toBeNull();
  });
});
