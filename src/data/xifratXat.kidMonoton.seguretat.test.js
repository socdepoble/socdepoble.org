// @vitest-environment node
/* G2-A-seg-01 (marató 261101_2143, carril E1-MOTOR-KID; disseny §4.4 i §4.5.3.4) ·
   Kid monòton per membre al llarg de la cadena d'èpoques. Defecte que es
   corregix: després d'acceptar el canvi fort de B (K1 → K2), la clau vella K1
   (substituïda, a `anteriors`, que la història conserva per a obrir el passat)
   continuava signant èpoques NOVES. Amb K1 (el mòbil perdut) i un servidor
   maliciós, una època falsificada entrava sense cap avís: en un directe el seu
   missatge es mostrava autèntic i actual; en un grup, si B era propietària, hi
   afegia X i el pròxim enviament d'A es xifrava també per a X. Ara: (1) cap
   època no pot tornar a portar una persona (autora o membre) amb un kid més vell
   que el de l'última època vàlida on hi era; (2) una clau substituïda per un
   canvi fort no signa cap època posterior al cap que l'aparell tenia ancorat
   abans de l'acceptació (els altres fils amb la persona s'ancoren abans de
   fixar la clau nova). Les sondes del Gauntlet 2 (directe i grup), girades en
   regressió: l'època falsificada ix saltada, el missatge tancat i X no entra.
   WebCrypto de veres, decorador i magatzem IndexedDB fals; bandera real apagada. */
import { describe, expect, test, vi } from 'vitest';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
import { CAPACITATS, CONTRACTE_NUCLI } from './contracte.js';
import { aplicaEpoca, creaEpoca, creaIdentitat, estatFilNou, MOTIU_EPOCA, TIPUS_FIL, xifraMissatge } from './xifratXatProtocol.js';
import { desserialitzaSobre, serialitzaEpoca, serialitzaXifrat } from './xifratXatPipeline.js';
import { creaMagatzemXat } from './xifratXatMagatzem.js';
import { aBase64url, deBase64url } from './xifratXatCripto.js';
import { directoriAmbHistoria } from './xifratXatHistoria.js';
import { ROL_EPOCA } from './xifratXatFormats.js';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';

const cripto = globalThis.crypto;
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const C = 'cccccccc-3333-4333-8333-333333333333';
const X = 'dddddddd-4444-4444-8444-444444444444';
const FIL = 'f1000000-0000-4000-8000-000000000001';
const FIL2 = 'f1000000-0000-4000-8000-000000000002';
const GRUP = 'f1000000-0000-4000-8000-000000000003';
const FIL3 = 'f1000000-0000-4000-8000-000000000004';
const ID1 = '10000000-0000-4000-8000-000000000001';
const ID2 = '10000000-0000-4000-8000-000000000002';
const ID3 = '10000000-0000-4000-8000-000000000003';
const ID4 = '10000000-0000-4000-8000-000000000004';
const ID5 = '10000000-0000-4000-8000-000000000005';
const ID6 = '10000000-0000-4000-8000-000000000006';
const ID7 = '10000000-0000-4000-8000-000000000007';
const ORIGEN = 'https://socdepoble.org';
const T0 = Date.UTC(2026, 10, 2, 4);
const b64 = aBase64url;
const ci = (u) => JSON.stringify(['supabase', 'https://backend.example.test', u]);
const ambit = (u) => JSON.stringify(['backend-sintetic', u, `persona::${u}`]);
const SENSE_CANVIS = { pendents: [], suaus: [], alarmes: [] };
const FALSIFICAT = 'Sóc B: envia-me el codi (clau vella K1)';
const resum = (files) => files.map((f) => [f.id, f.text, f.seguretat?.codi ?? null]);

/* El servidor (només d'afegir): registre de claus, èpoques, missatges i fils per persona.
   El grup porta `altres` (com mapejaFil de l'adaptador real) i el roster és canviable. */
function creaServidor() {
  const claus = [];
  const epoques = new Map();
  const missatges = new Map();
  let seq = 0;
  const grup = { membres: [{ usuari: A, rol: ROL_EPOCA.propietaria }, { usuari: B, rol: ROL_EPOCA.membre }, { usuari: C, rol: ROL_EPOCA.membre }] };
  const persona = (id) => ({ id, tipus: 'persona' });
  const filsDe = {
    [A]: [{ id: FIL, tipus: 'directe', altres: [persona(B)] }, { id: FIL2, tipus: 'directe', altres: [persona(B)] }, { id: GRUP, tipus: 'grup', altres: [persona(B), persona(C)] }],
    [B]: [{ id: FIL, tipus: 'directe', altres: [persona(A)] }, { id: FIL2, tipus: 'directe', altres: [persona(A)] }, { id: GRUP, tipus: 'grup', altres: [persona(A), persona(C)] }],
    [C]: [{ id: GRUP, tipus: 'grup', altres: [persona(A), persona(B)] }]
  };
  const de = (fil) => missatges.get(fil) ?? [];
  const desaFila = (jo, fil, paquet) => {
    if (paquet.epocaNova) epoques.set(fil, [...(epoques.get(fil) ?? []), paquet.epocaNova]);
    seq += 1;
    const fila = {
      id: paquet.id, filId: fil, seq, usuariId: jo, autorNom: null, text: null, tipus: 'text', respostaA: paquet.respostaA ?? null,
      editatAl: null, esborratAl: null, metadades: {}, esIA: false, comOrgId: null, creatAl: new Date(T0 + seq * 1000).toISOString(), xifrat: paquet.xifrat
    };
    missatges.set(fil, [...de(fil), fila]);
    return { ...fila };
  };
  const publica = (jo, identitat) => {
    for (const fila of claus) if (fila.usuariId === jo && !fila.retiradaAl) fila.retiradaAl = new Date(T0).toISOString();
    claus.push({
      usuariId: jo, kid: b64(identitat.kid), sigPub: b64(identitat.sigPub), dhPub: b64(identitat.dhPub),
      declaracio: b64(identitat.declaracio), autofirma: b64(identitat.autofirma),
      firmaContinuitat: identitat.firmaContinuitat ? b64(identitat.firmaContinuitat) : null, retiradaAl: null
    });
  };
  const adaptadorDe = (jo) => ({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((n) => [n, vi.fn()])),
    ...Object.fromEntries([...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat, ...CAPACITATS.xatMultimedia].map((n) => [n, vi.fn(async () => { throw new Error(`no simulat: ${n}`); })])),
    loadFils: vi.fn(async () => (filsDe[jo] ?? []).map((f) => ({ ...f }))),
    loadMissatges: vi.fn(async (fil) => de(fil).map((r) => ({ ...r }))),
    enviaMissatge: vi.fn(async () => { throw new Error('text en clar al transport!'); }),
    clausDeXat: vi.fn(async (usuaris) => claus.filter((f) => usuaris.includes(f.usuariId)).map((f) => ({ ...f }))),
    epoquesDelFilXat: vi.fn(async (fil, desDe) => (epoques.get(fil) ?? []).filter((e) => e.epoca > desDe).map(({ epoca, declaracio, firma }) => ({ epoca, declaracio, firma }))),
    sobresMeusXat: vi.fn(async (fil, llista) => (epoques.get(fil) ?? []).filter((e) => llista.includes(e.epoca))
      .flatMap((e) => e.sobres.filter((s) => s.receptor === jo).map((s) => ({ epoca: e.epoca, ...s })))),
    estatXifratXat: vi.fn(async (fils) => (fils.includes(GRUP) ? [{ filId: GRUP, membres: grup.membres.map((m) => ({ ...m })) }] : [])),
    enviaXifratXat: vi.fn(async (fil, paquet) => desaFila(jo, fil, paquet))
  });
  const afigFil = (jo, fil) => { filsDe[jo] = [...(filsDe[jo] ?? []), fil]; };
  return { claus, epoques, missatges, publica, adaptadorDe, grup, afigFil, desaFila };
}

async function creaPart(servidor, jo, { identitat = null, fals = null, publica = true, embolcallaMagatzem = null } = {}) {
  const idb = fals ?? creaIdbFalsEstructurat();
  const real = creaMagatzemXat({ idb, rangs: idb.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T0 });
  const magatzem = embolcallaMagatzem ? embolcallaMagatzem(real) : real;
  const propia = identitat ?? await creaIdentitat(cripto, { usuari: jo, creatMs: T0 });
  if (!fals) {
    await real.desaIdentitat(ci(jo), propia);
    if (publica) servidor.publica(jo, propia);
  }
  const impl = servidor.adaptadorDe(jo);
  const d = ambXifratXat(impl, { actiu: true, isSecureContext: true, origen: ORIGEN, cripto, indexedDB: idb, magatzem, ara: () => T0 });
  const servei = serveiXifratXat(d);
  servei.fixaAmbit(ambit(jo), ci(jo));
  return { d, impl, magatzem: real, identitat: propia, servei, fals: idb };
}

const recarrega = (servidor, part, extres = {}) => creaPart(servidor, part.jo ?? A, { identitat: part.identitat, fals: part.fals, ...extres });

/* L'atacant (o un client d'una altra persona) amb un directori propi: els kids que vol, per usuari. */
const directoriDe = (identitats) => {
  const actiu = new Map(identitats.map((i) => [i.usuari, i]));
  const hist = new Map(identitats.map((i) => [`${i.usuari}:${b64(i.kid)}`, i]));
  return { de: (u) => actiu.get(u) ?? null, historica: (u, k) => hist.get(`${u}:${b64(k)}`) ?? null, usuaris: () => [...actiu.keys()] };
};

/* Una època nova al cap de la cadena servida, signada per `autor` (i un missatge seu, si cal), desada al servidor. */
async function falsifica(servidor, { fil, tipusFil, autor, directori, membres, id = null, text = null }) {
  const estat = estatFilNou({ fil, tipusFil });
  for (const e of servidor.epoques.get(fil) ?? []) {
    try {
      await aplicaEpoca(cripto, { estat, jo: autor, declaracio: deBase64url(e.declaracio), firma: deBase64url(e.firma), directori,
        sobres: e.sobres.filter((s) => s.receptor === autor.usuari).map(desserialitzaSobre) });
    } catch { /* saltada: prou per a l'encadenament (prevHash) */ }
  }
  const epoca = await creaEpoca(cripto, { estat, jo: autor, membres, creatMs: T0 + 9000, directori, motiu: estat.ultima ? MOTIU_EPOCA.rotacio : null });
  if (id === null) {
    servidor.epoques.set(fil, [...(servidor.epoques.get(fil) ?? []), serialitzaEpoca(epoca)]);
    return epoca.epoca;
  }
  await aplicaEpoca(cripto, { estat, jo: autor, declaracio: epoca.declaracio, firma: epoca.firma, sobres: epoca.sobres, directori });
  const fila = await xifraMissatge(cripto, { estat, jo: autor, id, contingut: { t: text } });
  servidor.desaFila(autor.usuari, fil, { id, xifrat: serialitzaXifrat(fila), respostaA: null, epocaNova: serialitzaEpoca(epoca) });
  return epoca.epoca;
}

const DIRECTE = [{ usuari: A, rol: ROL_EPOCA.membre }, { usuari: B, rol: ROL_EPOCA.membre }];

/* A i B parlen per FIL (A fixa B per TOFU). */
async function conversaInicial() {
  const servidor = creaServidor();
  const a = await creaPart(servidor, A);
  const b = await creaPart(servidor, B);
  await a.d.enviaMissatge(FIL, { id: ID1, text: 'Bon dia, veïna' });
  await b.d.enviaMissatge(FIL, { id: ID2, text: 'Bon dia!', respostaA: ID1 });
  return { servidor, a, b, k1: b.identitat };
}

describe('G2-A-seg-01 · directe: la clau substituïda per un canvi fort no signa cap època nova', () => {
  test('acceptada K2 i escrita l’època 2 (B:K2), l’època 3 falsificada amb K1 ix saltada i el missatge tancat; la història d’abans s’obri i A no xifra res damunt', async () => {
    const { servidor, a, k1 } = await conversaInicial();
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, k2);
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) });
    await a.d.enviaMissatge(FIL, { id: ID3, text: 'Rebut, B (K2)' });
    expect(servidor.epoques.get(FIL).map((e) => e.epoca)).toEqual([1, 2]);
    expect(await falsifica(servidor, { fil: FIL, tipusFil: TIPUS_FIL.directe, autor: k1, directori: directoriDe([a.identitat, k1]), membres: DIRECTE, id: ID6, text: FALSIFICAT })).toBe(3);

    /* Calenta (el context de l'enviament, resincronització per epoca-desconeguda) i recarregada. */
    for (const part of [a, await recarrega(servidor, a)]) {
      const files = await part.d.loadMissatges(FIL);
      expect(resum(files)).toEqual([[ID1, 'Bon dia, veïna', null], [ID2, 'Bon dia!', null], [ID3, 'Rebut, B (K2)', null], [ID6, null, 'epoca-desconeguda']]);
      expect(JSON.stringify(files)).not.toContain('envia-me el codi');
    }
    const fresc = await recarrega(servidor, a);
    expect(await fresc.servei.canvisDeClau(FIL)).toEqual(SENSE_CANVIS);
    /* L'última època no verifica: cap enviament damunt (cap època 4, res al servidor). */
    await expect(fresc.d.enviaMissatge(FIL, { id: ID7, text: 'Secret' })).rejects.toMatchObject({ codi: 'epoca-saltada' });
    expect(servidor.epoques.get(FIL).map((e) => e.epoca)).toEqual([1, 2, 3]);
    expect(servidor.missatges.get(FIL).some((m) => m.id === ID7)).toBe(false);
  });

  test('sense cap època nova (A accepta K2 i no escriu): l’època 2 falsificada amb K1 ix saltada, perquè K1 només signa fins al cap ancorat abans d’acceptar', async () => {
    const { servidor, a, k1 } = await conversaInicial();
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, k2);
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) });
    expect(await falsifica(servidor, { fil: FIL, tipusFil: TIPUS_FIL.directe, autor: k1, directori: directoriDe([a.identitat, k1]), membres: DIRECTE, id: ID6, text: FALSIFICAT })).toBe(2);
    const fresc = await recarrega(servidor, a);
    expect(resum(await fresc.d.loadMissatges(FIL))).toEqual([[ID1, 'Bon dia, veïna', null], [ID2, 'Bon dia!', null], [ID6, null, 'epoca-desconeguda']]);
    expect(await fresc.servei.canvisDeClau(FIL)).toEqual(SENSE_CANVIS);
  });

  test('control: abans d’acceptar (K1 encara és la fixada) una època de K1 s’accepta, com diu el disseny', async () => {
    const { servidor, a, k1 } = await conversaInicial();
    servidor.publica(B, await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 }));
    await falsifica(servidor, { fil: FIL, tipusFil: TIPUS_FIL.directe, autor: k1, directori: directoriDe([a.identitat, k1]), membres: DIRECTE, id: ID6, text: 'K1 abans d’acceptar' });
    const fresc = await recarrega(servidor, a);
    expect(resum(await fresc.d.loadMissatges(FIL)).at(-1)).toEqual([ID6, 'K1 abans d’acceptar', null]);
    expect((await fresc.servei.canvisDeClau(FIL)).pendents).toHaveLength(1);
  });

  test('cas anàleg de la cadena suau: B passa en suau a K2 i A escriu l’època 2 (B:K2); l’època 3 de K1 ix saltada (kid monòton)', async () => {
    const { servidor, a, k1 } = await conversaInicial();
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: k1 });
    servidor.publica(B, k2);
    await a.d.enviaMissatge(FIL, { id: ID3, text: 'Clau nova, tot bé' });
    expect(servidor.epoques.get(FIL)[1].sobres.find((s) => s.receptor === B).kidReceptor).toBe(b64(k2.kid));
    await falsifica(servidor, { fil: FIL, tipusFil: TIPUS_FIL.directe, autor: k1, directori: directoriDe([a.identitat, k1]), membres: DIRECTE, id: ID6, text: FALSIFICAT });
    const fresc = await recarrega(servidor, a);
    expect(resum(await fresc.d.loadMissatges(FIL))).toEqual([[ID1, 'Bon dia, veïna', null], [ID2, 'Bon dia!', null], [ID3, 'Clau nova, tot bé', null], [ID6, null, 'epoca-desconeguda']]);
  });
});

describe('G2-A-seg-01 · els altres fils amb la persona', () => {
  test('cadena suau: un fil que A no havia obert, amb una època de K1 d’abans del canvi suau, continua obrint-se (la cadena suau no porta límit)', async () => {
    const { servidor, a, b, k1 } = await conversaInicial();
    await b.d.enviaMissatge(FIL2, { id: ID4, text: 'Escrit amb K1' });
    servidor.publica(B, await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: k1 }));
    expect((await a.servei.canvisDeClau(FIL)).suaus).toHaveLength(1);
    expect(await a.magatzem.filXifrat(ci(A), FIL2)).toBeNull();
    expect(resum(await (await recarrega(servidor, a)).d.loadMissatges(FIL2))).toEqual([[ID4, 'Escrit amb K1', null]]);
  });

  test('un fil amb una època de K1 escrita abans del canvi i que A no havia obert s’ancora en acceptar i continua obrint-se; un fil nou que K1 crea després, no', async () => {
    const { servidor, a, b, k1 } = await conversaInicial();
    await b.d.enviaMissatge(FIL2, { id: ID4, text: 'Escrit amb K1 abans de perdre el mòbil' });
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, k2);
    expect(await a.magatzem.filXifrat(ci(A), FIL2)).toBeNull();
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) });
    expect((await a.magatzem.filXifrat(ci(A), FIL2))?.epoca).toBe(1);
    expect(resum(await a.d.loadMissatges(FIL2))).toEqual([[ID4, 'Escrit amb K1 abans de perdre el mòbil', null]]);
    /* K1 i el servidor obrin un fil nou després de l'acceptació. */
    servidor.afigFil(A, { id: FIL3, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] });
    await falsifica(servidor, { fil: FIL3, tipusFil: TIPUS_FIL.directe, autor: k1, directori: directoriDe([a.identitat, k1]), membres: DIRECTE, id: ID6, text: FALSIFICAT });
    const fresc = await recarrega(servidor, a);
    expect(resum(await fresc.d.loadMissatges(FIL2))).toEqual([[ID4, 'Escrit amb K1 abans de perdre el mòbil', null]]);
    expect(resum(await fresc.d.loadMissatges(FIL3))).toEqual([[ID6, null, 'epoca-desconeguda']]);
  });

  test('«Marca com a verificat» sobre el pendent també ancora els altres fils abans de fixar la clau nova', async () => {
    const { servidor, a, b } = await conversaInicial();
    await b.d.enviaMissatge(FIL2, { id: ID4, text: 'Escrit amb K1' });
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, k2);
    const numero = await a.servei.numeroSeguretat(FIL);
    expect(numero).toMatchObject({ kid: b64(k2.kid), pendent: true });
    await a.servei.marcaVerificat(FIL, { kid: numero.kid, verificat: true });
    expect(resum(await (await recarrega(servidor, a)).d.loadMissatges(FIL2))).toEqual([[ID4, 'Escrit amb K1', null]]);
  });

  test('si un altre fil no es pot ancorar (xarxa), l’acceptació continua i eixe fil queda amb el cap d’abans', async () => {
    const { servidor, a, b } = await conversaInicial();
    await b.d.enviaMissatge(FIL2, { id: ID4, text: 'Escrit amb K1' });
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, k2);
    const original = a.impl.epoquesDelFilXat.getMockImplementation();
    a.impl.epoquesDelFilXat.mockImplementation(async (fil, ...resta) => {
      if (fil === FIL2) throw new TypeError('Failed to fetch');
      return original(fil, ...resta);
    });
    expect(await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) })).toEqual(SENSE_CANVIS);
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(k2.kid));
    expect(await a.magatzem.filXifrat(ci(A), FIL2)).toBeNull();
    a.impl.epoquesDelFilXat.mockImplementation(original);
    /* Conservador: la història de K1 que l'aparell no havia vist en eixe fil queda tancada. */
    expect(resum(await a.d.loadMissatges(FIL2))).toEqual([[ID4, null, 'epoca-desconeguda']]);
  });
});

describe('G2-A-seg-01 · grup', () => {
  /* El cas del refutador: B propietària passa de K1 a K2 per un canvi fort i A (membre) ho accepta. */
  const grupAmbBPropietaria = async () => {
    const servidor = creaServidor();
    servidor.grup.membres = [{ usuari: A, rol: ROL_EPOCA.membre }, { usuari: B, rol: ROL_EPOCA.propietaria }, { usuari: C, rol: ROL_EPOCA.membre }];
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    const c = await creaPart(servidor, C);
    const x = await creaIdentitat(cripto, { usuari: X, creatMs: T0 });
    servidor.publica(X, x);
    await b.d.enviaMissatge(GRUP, { id: ID1, text: 'Benvingudes (B, K1)' });
    expect(resum(await a.d.loadMissatges(GRUP))).toEqual([[ID1, 'Benvingudes (B, K1)', null]]);
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, k2);
    await a.servei.acceptaCanviClau(GRUP, { usuari: B, kid: b64(k2.kid) });
    await a.d.enviaMissatge(GRUP, { id: ID2, text: 'Rebut, B (K2)' });
    expect(servidor.epoques.get(GRUP).map((e) => e.epoca)).toEqual([1, 2]);
    return { servidor, a, c, x, k1: b.identitat, k2 };
  };
  const ambX = [{ usuari: A, rol: ROL_EPOCA.membre }, { usuari: B, rol: ROL_EPOCA.propietaria }, { usuari: C, rol: ROL_EPOCA.membre }, { usuari: X, rol: ROL_EPOCA.membre }];

  test('control: si el servidor només afig X al roster, A (membre) no el pot afegir (autor-no-autoritzat)', async () => {
    const { servidor, a } = await grupAmbBPropietaria();
    servidor.grup.membres = ambX.map((m) => ({ ...m }));
    await expect(a.d.enviaMissatge(GRUP, { id: ID5, text: 'control' })).rejects.toMatchObject({ codi: 'autor-no-autoritzat' });
    expect(servidor.epoques.get(GRUP).map((e) => e.epoca)).toEqual([1, 2]);
  });

  test('l’època 3 signada amb K1 que afig X ix saltada: cap avís fals, A no hi xifra res i X no entra al roster de cap època d’A', async () => {
    const { servidor, a, c, x, k1 } = await grupAmbBPropietaria();
    servidor.grup.membres = ambX.map((m) => ({ ...m }));
    expect(await falsifica(servidor, { fil: GRUP, tipusFil: TIPUS_FIL.grup, autor: k1, directori: directoriDe([a.identitat, c.identitat, k1, x]), membres: ambX })).toBe(3);
    const fresc = await recarrega(servidor, a);
    expect(resum(await fresc.d.loadMissatges(GRUP))).toEqual([[ID1, 'Benvingudes (B, K1)', null], [ID2, 'Rebut, B (K2)', null]]);
    expect(await fresc.servei.canvisDeClau(GRUP)).toEqual(SENSE_CANVIS);
    await expect(fresc.d.enviaMissatge(GRUP, { id: ID3, text: 'Secret del grup' })).rejects.toMatchObject({ codi: 'epoca-saltada' });
    const epoques = servidor.epoques.get(GRUP);
    expect(epoques.map((e) => e.epoca)).toEqual([1, 2, 3]);
    expect(servidor.missatges.get(GRUP).some((m) => m.id === ID3)).toBe(false);
    /* Cap època que no siga la falsificada porta X. */
    expect(epoques.filter((e) => e.sobres.some((s) => s.receptor === X)).map((e) => e.epoca)).toEqual([3]);
  });

  test('kid monòton també per als membres: una època d’una altra persona que torna a portar B amb K1 després d’una època amb B:K2 ix saltada', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    const c = await creaPart(servidor, C);
    await a.d.enviaMissatge(GRUP, { id: ID1, text: 'Hola, grup' });
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: b.identitat });
    servidor.publica(B, k2);
    await a.d.enviaMissatge(GRUP, { id: ID2, text: 'Amb la clau nova de B' });
    expect(servidor.epoques.get(GRUP).map((e) => e.epoca)).toEqual([1, 2]);
    /* C (autora legítima, cap alta) rota amb un directori on B encara és K1 (servidor que li amaga K2). */
    await falsifica(servidor, { fil: GRUP, tipusFil: TIPUS_FIL.grup, autor: c.identitat, directori: directoriDe([a.identitat, b.identitat, c.identitat]),
      membres: servidor.grup.membres.map((m) => ({ ...m })), id: ID3, text: 'C amb B:K1' });
    const fresc = await recarrega(servidor, a);
    expect(resum(await fresc.d.loadMissatges(GRUP))).toEqual([[ID1, 'Hola, grup', null], [ID2, 'Amb la clau nova de B', null], [ID3, null, 'epoca-desconeguda']]);
  });
});

/* E1 · ARB-1 (àrbitre del carril, regressió de la primera correcció) · Un grup que A no havia
   ancorat abans d'acceptar K2: totes les èpoques de K1 ixen saltades i no en queda cap de vàlida.
   Abans de la correcció ARB-1, l'època següent entrava com a gènesi sense cap autoritat i un
   compte qualsevol (X, SENSE K1) que el servidor hi posava rebia el pròxim missatge d'A. */
describe('E1 · ARB-1 · grup no ancorat abans d’acceptar: cap gènesi després d’una època saltada per una clau substituïda', () => {
  const BASE = () => [{ usuari: A, rol: ROL_EPOCA.membre }, { usuari: B, rol: ROL_EPOCA.propietaria }, { usuari: C, rol: ROL_EPOCA.membre }];
  const ambXPropietaria = () => [...BASE(), { usuari: X, rol: ROL_EPOCA.propietaria }];

  /* B (propietària, K1) crea el grup i hi escriu; A no l'ha obert en este aparell; B passa a K2 per un canvi fort. */
  const grupNoAncorat = async () => {
    const servidor = creaServidor();
    servidor.grup.membres = BASE();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    const c = await creaPart(servidor, C);
    const x = await creaIdentitat(cripto, { usuari: X, creatMs: T0 });
    servidor.publica(X, x);
    await a.d.enviaMissatge(FIL, { id: ID1, text: 'Hola, B' });
    await b.d.enviaMissatge(FIL, { id: ID2, text: 'Hola, A' });
    await b.d.enviaMissatge(GRUP, { id: ID3, text: 'Benvingudes (B, K1)' });
    expect(await a.magatzem.filXifrat(ci(A), GRUP)).toBeNull();
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, k2);
    return { servidor, a, c, x, k2 };
  };

  /* X signa l'època 2 com a propietària i hi escriu; després A (recarregat) mira el grup i hi vol escriure. */
  const xEntraIAEscriu = async ({ servidor, a, c, x, k2 }) => {
    servidor.grup.membres = ambXPropietaria();
    await falsifica(servidor, { fil: GRUP, tipusFil: TIPUS_FIL.grup, autor: x, directori: directoriDe([a.identitat, k2, c.identitat, x]),
      membres: ambXPropietaria(), id: ID4, text: 'Sóc la nova administradora (X)' });
    const fresc = await recarrega(servidor, a);
    const vist = resum(await fresc.d.loadMissatges(GRUP));
    const canvis = await fresc.servei.canvisDeClau(GRUP);
    const enviament = await fresc.d.enviaMissatge(GRUP, { id: ID5, text: 'Secret del grup (A)' }).then(() => 'ok', (error) => error?.codi ?? String(error));
    return { vist, canvis, enviament };
  };

  const exigixXFora = (servidor, { vist, canvis, enviament }) => {
    expect(vist).toEqual([[ID3, null, 'epoca-desconeguda'], [ID4, null, 'epoca-desconeguda']]);
    expect(canvis).toEqual(SENSE_CANVIS);
    expect(enviament).toBe('epoca-saltada');
    expect(servidor.epoques.get(GRUP).map((e) => e.epoca)).toEqual([1, 2]);
    expect(servidor.missatges.get(GRUP).some((m) => m.id === ID5)).toBe(false);
    /* L'únic sobre per a X és el de l'època que X mateix ha signat. */
    expect(servidor.epoques.get(GRUP).filter((e) => e.sobres.some((s) => s.receptor === X)).map((e) => e.epoca)).toEqual([2]);
  };

  test('ARB-1 · el servidor fa fallar l’ancoratge del grup en acceptar: l’època de X no entra com a gènesi i A no li xifra res', async () => {
    const part = await grupNoAncorat();
    const { a, k2 } = part;
    const original = a.impl.epoquesDelFilXat.getMockImplementation();
    a.impl.epoquesDelFilXat.mockImplementation(async (fil, ...resta) => {
      if (fil === GRUP) throw new TypeError('Failed to fetch');
      return original(fil, ...resta);
    });
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) });
    a.impl.epoquesDelFilXat.mockImplementation(original);
    expect(await a.magatzem.filXifrat(ci(A), GRUP)).toBeNull();
    exigixXFora(part.servidor, await xEntraIAEscriu(part));
  });

  test('ARB-1b · el servidor deixa B fora d’`altres` del grup (A no l’ancora): el mateix resultat', async () => {
    const part = await grupNoAncorat();
    const { a, k2 } = part;
    const llista = a.impl.loadFils.getMockImplementation();
    a.impl.loadFils.mockImplementation(async (...r) => (await llista(...r)).map((f) => (f.id === GRUP ? { ...f, altres: [{ id: C, tipus: 'persona' }] } : f)));
    await a.d.loadFils();
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) });
    a.impl.loadFils.mockImplementation(llista);
    expect(await a.magatzem.filXifrat(ci(A), GRUP)).toBeNull();
    exigixXFora(part.servidor, await xEntraIAEscriu(part));
  });

  test('preu conservador (decisió D-E1-4): en eixe grup, tampoc no entra l’època honesta que C signa després amb B:K2; el grup queda tancat en este aparell', async () => {
    const part = await grupNoAncorat();
    const { servidor, a, c, k2 } = part;
    /* L'ancoratge previ del grup falla per la xarxa (o el grup passa del sostre de 64, o A hi entra després). */
    const original = a.impl.epoquesDelFilXat.getMockImplementation();
    a.impl.epoquesDelFilXat.mockImplementation(async (fil, ...resta) => {
      if (fil === GRUP) throw new TypeError('Failed to fetch');
      return original(fil, ...resta);
    });
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) });
    a.impl.epoquesDelFilXat.mockImplementation(original);
    expect(await a.magatzem.filXifrat(ci(A), GRUP)).toBeNull();
    await falsifica(servidor, { fil: GRUP, tipusFil: TIPUS_FIL.grup, autor: c.identitat, directori: directoriDe([a.identitat, k2, c.identitat]),
      membres: BASE(), id: ID4, text: 'Hola, soc C (B ja amb K2)' });
    const fresc = await recarrega(servidor, a);
    expect(resum(await fresc.d.loadMissatges(GRUP))).toEqual([[ID3, null, 'epoca-desconeguda'], [ID4, null, 'epoca-desconeguda']]);
    await expect(fresc.d.enviaMissatge(GRUP, { id: ID5, text: 'A escriu' })).rejects.toMatchObject({ codi: 'epoca-saltada' });
  });

  test('control: amb una època vàlida d’abans (grup ancorat), l’època de X es jutja contra eixa època i tampoc entra', async () => {
    const part = await grupNoAncorat();
    const { a, k2 } = part;
    expect(resum(await a.d.loadMissatges(GRUP))).toEqual([[ID3, 'Benvingudes (B, K1)', null]]);
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) });
    expect((await a.magatzem.filXifrat(ci(A), GRUP))?.epoca).toBe(1);
    const { vist, enviament } = await xEntraIAEscriu(part);
    expect(vist).toEqual([[ID3, 'Benvingudes (B, K1)', null], [ID4, null, 'epoca-desconeguda']]);
    expect(enviament).toBe('epoca-saltada');
    expect(part.servidor.missatges.get(GRUP).some((m) => m.id === ID5)).toBe(false);
  });
});

/* E1 · ARB-5 · L'ancoratge previ dels altres fils corre amb una concurrència curta (no un darrere
   de l'altre) i continua ancorant-los tots (fins al sostre de 64). */
describe('E1 · ARB-5 · ancoratge previ concurrent', () => {
  test('acceptar amb deu fils més amb B: com a molt quatre construccions alhora (més d’una), i cada fil amb història de K1 queda ancorat i s’obri', async () => {
    const { servidor, a, b } = await conversaInicial();
    const extra = Array.from({ length: 10 }, (_, i) => `f2000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
    for (const id of extra) {
      servidor.afigFil(A, { id, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] });
      servidor.afigFil(B, { id, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] });
    }
    await b.d.loadFils();
    for (const [n, id] of extra.slice(0, 3).entries()) await b.d.enviaMissatge(id, { id: `30000000-0000-4000-8000-00000000000${n}`, text: `K1 ${n}` });
    await a.d.loadFils();
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, k2);
    await a.servei.canvisDeClau(FIL);
    const original = a.impl.epoquesDelFilXat.getMockImplementation();
    let enCurs = 0;
    let maxim = 0;
    a.impl.epoquesDelFilXat.mockImplementation(async (...args) => {
      enCurs += 1;
      maxim = Math.max(maxim, enCurs);
      try {
        await new Promise((resol) => { setTimeout(resol, 5); });
        return await original(...args);
      } finally { enCurs -= 1; }
    });
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k2.kid) });
    a.impl.epoquesDelFilXat.mockImplementation(original);
    expect(maxim).toBeGreaterThan(1);
    expect(maxim).toBeLessThanOrEqual(4);
    for (const [n, id] of extra.slice(0, 3).entries()) {
      expect((await a.magatzem.filXifrat(ci(A), id))?.epoca).toBe(1);
      expect(resum(await a.d.loadMissatges(id))).toEqual([[`30000000-0000-4000-8000-00000000000${n}`, `K1 ${n}`, null]]);
    }
  });
});

/* El directori sol: l'ordre dels kids i el límit de les claus substituïdes per un canvi fort. */
describe('directoriAmbHistoria · ordreKid (G2-A-seg-01)', () => {
  const fila = (identitat, extres = {}) => ({
    usuariId: identitat.usuari, kid: b64(identitat.kid), sigPub: b64(identitat.sigPub), dhPub: b64(identitat.dhPub),
    declaracio: b64(identitat.declaracio), autofirma: b64(identitat.autofirma),
    firmaContinuitat: identitat.firmaContinuitat ? b64(identitat.firmaContinuitat) : null, retiradaAl: null, ...extres
  });
  const retirada = { retiradaAl: new Date(T0).toISOString() };
  const directori = (jo, registres, pin, capAncorat) => directoriAmbHistoria({
    cripto, jo, registres, usuaris: [A, B], magatzem: { fixacio: async (c, u) => (u === B ? pin : null), fixa: async (c, f) => f }, ci: ci(A), ara: () => T0, exigix: () => {}, capAncorat
  });

  test('després d’un canvi fort acceptat: l’activa és la 0 sense límit; la substituïda, la 1 amb el cap ancorat com a límit; la cadena suau no en porta', async () => {
    const jo = await creaIdentitat(cripto, { usuari: A, creatMs: T0 });
    const k0 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 });
    const k1 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: k0 });
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 2 });
    const k3 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 3, anterior: k2 });
    /* K0 → K1 suau, K1 → K2 fort (acceptat), K2 → K3 suau (activa). */
    const d = await directori(jo, [fila(jo), fila(k0, retirada), fila(k1, retirada), fila(k2, retirada), fila(k3)],
      { usuari: B, kid: k2.kid, verificat: false, vistAl: T0, anteriors: [k1.kid, k0.kid] }, 7);
    expect(d.ordreKid(B, k3.kid)).toEqual({ rang: 0, finsEpoca: null });
    expect(d.ordreKid(B, k2.kid)).toEqual({ rang: 1, finsEpoca: null });
    expect(d.ordreKid(B, k1.kid)).toEqual({ rang: 2, finsEpoca: 7 });
    expect(d.ordreKid(B, k0.kid)).toEqual({ rang: 3, finsEpoca: 7 });
    expect(d.ordreKid(B, cripto.getRandomValues(new Uint8Array(16)))).toBeNull();
    expect(d.ordreKid(A, jo.kid)).toEqual({ rang: 0, finsEpoca: null });
  });

  test('pendent: la fixada és la 0 (sense límit), la clau nova no hi és; sense cap ancorat el límit de les substituïdes és 0', async () => {
    const jo = await creaIdentitat(cripto, { usuari: A, creatMs: T0 });
    const k1 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 });
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    const k3 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 2 });
    const d = await directori(jo, [fila(jo), fila(k1, retirada), fila(k2, retirada), fila(k3)],
      { usuari: B, kid: k2.kid, verificat: false, vistAl: T0, anteriors: [k1.kid] }, undefined);
    expect(d.canvis.pendents.has(B)).toBe(true);
    expect(d.ordreKid(B, k2.kid)).toEqual({ rang: 0, finsEpoca: null });
    expect(d.ordreKid(B, k1.kid)).toEqual({ rang: 1, finsEpoca: 0 });
    expect(d.ordreKid(B, k3.kid)).toBeNull();
  });
});
