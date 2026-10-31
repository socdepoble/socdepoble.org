// @vitest-environment node
/* Gauntlet Loop c2 (261030, àrea e2ee) · Les troballes C1, C2 i G4 de les
   auditories de tancament (Codex 0256, Gemini 0255) sobre el pipeline real, amb
   un doble de servidor en memòria i un decorador per persona (com a
   xifratXat.pipeline.seguretat.test.js):
     · C1: una rotació remota d'època després de construir el context s'obri
       amb UNA resincronització (cadena validada, guarda d'àmbit a cada espera);
       una època amb la firma falsa continua tancada; i ni el context ni cap text
       desxifrat d'un àmbit vell entren a la RAM del nou.
     · G4: la FK d'un adjunt que no s'arriba a publicar queda a zero; dues peces
       que demanen alhora el mateix adjunt compartixen una sola descàrrega.
     · C2: l'oblit i el canvi d'àmbit posen a zero les FK que la RAM guardava.
     · Cicle 4 (tancament): cada id de l'índex d'adjunts és de la seua fila, del
       seu fil i del seu emissor; un membre no pot tancar la foto d'un altre.
   Bandera real apagada: ací el decorador s'activa per paràmetre. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
import { creaMotorXifrat, serialitzaEpoca, serialitzaXifrat } from './xifratXatPipeline.js';
import { CAPACITATS, CONTRACTE_NUCLI } from './contracte.js';
import { aplicaEpoca, creaEpoca, creaIdentitat, xifraMissatge } from './xifratXatProtocol.js';
import { MOTIU_EPOCA, ROL_EPOCA } from './xifratXatFormats.js';
import { creaMagatzemXat } from './xifratXatMagatzem.js';
import { aBase64url, deBase64url } from './xifratXatCripto.js';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';

const cripto = globalThis.crypto;
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const C = 'cccccccc-3333-4333-8333-333333333333';
const ORG = '99999999-9999-4999-8999-999999999999';
const FIL = 'dddddddd-3333-4333-8333-333333333333';
const FIL_C = 'eeeeeeee-4444-4444-8444-444444444444';
const ORIGEN = 'https://socdepoble.org';
const T0 = Date.UTC(2026, 9, 30, 3);
const ci = (u) => JSON.stringify(['supabase', 'https://backend.example.test', u]);
const ambit = (u) => JSON.stringify(['backend-sintetic', u, `persona::${u}`]);
const ambitEntitat = (u) => JSON.stringify(['backend-sintetic', u, `entitat::${ORG}`]);
const FIL_AB = Object.freeze({ id: FIL, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] });
const totZero = (bytes) => bytes.every((x) => x === 0);
const uuid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const foto = () => new Blob([cripto.getRandomValues(new Uint8Array(3000))], { type: 'image/jpeg' });

afterEach(() => vi.restoreAllMocks());

/* El servidor: claus públiques, cadena d'èpoques per fil, missatges amb sobre i blobs. Mai text en clar. */
function creaServidor() {
  const claus = new Map();
  const epoques = new Map();
  const missatges = new Map();
  const adjunts = new Map();
  let seq = 0;
  const filsDe = {
    [A]: [{ id: FIL, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] }, { id: FIL_C, tipus: 'directe', altres: [{ id: C, tipus: 'persona' }] }],
    [B]: [{ id: FIL, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] }],
    [C]: [{ id: FIL_C, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] }]
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
  const publica = (jo, identitat) => claus.set(jo, { usuariId: jo, kid: aBase64url(identitat.kid), sigPub: aBase64url(identitat.sigPub), dhPub: aBase64url(identitat.dhPub) });
  const adaptadorDe = (jo) => ({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((n) => [n, vi.fn()])),
    ...Object.fromEntries([...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat, ...CAPACITATS.xatMultimedia].map((n) => [n, vi.fn(async () => { throw new Error(`no simulat: ${n}`); })])),
    loadFils: vi.fn(async () => filsDe[jo].map((f) => ({ ...f }))),
    loadMissatges: vi.fn(async (fil) => de(fil).map((r) => ({ ...r }))),
    enviaMissatge: vi.fn(async () => { throw new Error('text en clar al transport!'); }),
    clausDeXat: vi.fn(async (usuaris) => usuaris.map((u) => claus.get(u)).filter(Boolean)),
    epoquesDelFilXat: vi.fn(async (fil, desDe) => (epoques.get(fil) ?? []).filter((e) => e.epoca > desDe).map(({ epoca, declaracio, firma }) => ({ epoca, declaracio, firma }))),
    sobresMeusXat: vi.fn(async (fil, llista) => (epoques.get(fil) ?? []).filter((e) => llista.includes(e.epoca))
      .flatMap((e) => e.sobres.filter((s) => s.receptor === jo).map((s) => ({ epoca: e.epoca, ...s })))),
    enviaXifratXat: vi.fn(async (fil, paquet) => desaFila(jo, fil, paquet)),
    publicaAdjuntXifratXat: vi.fn(async (fil, entrada) => {
      adjunts.set(entrada.id, Uint8Array.from(entrada.blob));
      return desaFila(jo, fil, { id: entrada.id, xifrat: entrada.xifrat, respostaA: entrada.respostaA, epocaNova: entrada.epocaNova });
    }),
    bytesAdjuntXat: vi.fn(async (id) => Uint8Array.from(adjunts.get(id))),
    urlAdjuntXat: vi.fn(async (id) => `https://signada.example/${id}`)
  });
  return { claus, epoques, missatges, adjunts, publica, adaptadorDe };
}

/* Una persona amb el seu decorador; `identitat` reaprofita la publicada (els sobres ja són seus). */
async function creaPart(servidor, jo, { identitat = null, publica = true } = {}) {
  const fals = creaIdbFalsEstructurat();
  const magatzem = creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T0 });
  const id = identitat ?? await creaIdentitat(cripto, { usuari: jo, creatMs: T0 });
  if (publica) {
    await magatzem.desaIdentitat(ci(jo), id);
    if (identitat === null) servidor.publica(jo, id);
  }
  const impl = servidor.adaptadorDe(jo);
  const blobs = [];
  const d = ambXifratXat(impl, {
    actiu: true, isSecureContext: true, origen: ORIGEN, cripto, indexedDB: fals, magatzem, ara: () => T0,
    creaBlob: (parts, opcions) => new Blob(parts, opcions),
    creaUrl: (blob) => { blobs.push(blob); return `blob:sintetic/${jo.slice(0, 4)}/${blobs.length}`; }
  });
  const servei = serveiXifratXat(d);
  servei.fixaAmbit(ambit(jo), ci(jo));
  return { d, impl, magatzem, identitat: id, servei, blobs };
}

/* Una rotació d'època feta per A (des de B, remota): creaEpoca + aplicaEpoca sobre el context d'A i al servidor. */
async function rota(servidor, a, { falsifica = false } = {}) {
  const ctx = a.servei.estatFilDesat(FIL);
  const epoca = await creaEpoca(cripto, {
    estat: ctx.estat, jo: ctx.jo, membres: ctx.membres.map((usuari) => ({ usuari, rol: ROL_EPOCA.membre })),
    motiu: MOTIU_EPOCA.rotacio, creatMs: T0 + 1000, directori: ctx.directori
  });
  await aplicaEpoca(cripto, { estat: ctx.estat, jo: ctx.jo, declaracio: epoca.declaracio, firma: epoca.firma, sobres: epoca.sobres, directori: ctx.directori });
  const serialitzada = serialitzaEpoca(epoca);
  const alServidor = falsifica ? { ...serialitzada, firma: aBase64url(Uint8Array.from(deBase64url(serialitzada.firma), (x, i) => (i === 3 ? x ^ 0x5a : x))) } : serialitzada;
  servidor.epoques.set(FIL, [...servidor.epoques.get(FIL), alServidor]);
  return epoca.epoca;
}

/* Un cripto que compta les operacions de WebCrypto, i una guarda d'àmbit que canvia l'àmbit
   just després de l'última operació d'una crida mesurada abans (en una microtasca, abans que
   l'operació torne): així es prova la guarda que hi ha entre el càlcul i la memòria cau. */
function criptoComptat() {
  const estat = { ops: 0 };
  const subtle = new Proxy(cripto.subtle, {
    get(objectiu, nom) {
      const valor = Reflect.get(objectiu, nom, objectiu);
      return typeof valor === 'function' ? (...args) => { estat.ops += 1; return valor.apply(objectiu, args); } : valor;
    }
  });
  return { estat, cripto: { subtle, getRandomValues: (v) => cripto.getRandomValues(v), randomUUID: () => cripto.randomUUID() } };
}

function guardaAmbTrampa(servei, comptat, opsFinals, canvi) {
  const token = servei.captura('ambit');
  let programat = false;
  return () => {
    servei.exigix(token);
    if (!programat && opsFinals !== null && comptat.estat.ops === opsFinals) {
      programat = true;
      queueMicrotask(canvi);
    }
  };
}

describe('C1 · èpoques remotes noves', () => {
  test('una rotació remota després de construir el context: una sola resincronització des de l’última vista, i el missatge nou s’obri i es respon amb l’època nova', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.enviaMissatge(FIL, { id: uuid(1), text: 'època u' });
    expect((await b.d.loadMissatges(FIL)).map((f) => f.text)).toEqual(['època u']);

    expect(await rota(servidor, a)).toBe(2);
    await a.d.enviaMissatge(FIL, { id: uuid(2), text: 'època dos, primer' });
    await a.d.enviaMissatge(FIL, { id: uuid(3), text: 'època dos, segon' });
    expect(servidor.missatges.get(FIL).map((f) => f.xifrat.epoca)).toEqual([1, 2, 2]);

    const epoquesAbans = b.impl.epoquesDelFilXat.mock.calls.length;
    const perB = await b.d.loadMissatges(FIL);
    expect(perB.map((f) => f.text)).toEqual(['època u', 'època dos, primer', 'època dos, segon']);
    expect(perB[1].seguretat).toMatchObject({ xifrat: true, verificat: true });
    expect(b.impl.epoquesDelFilXat.mock.calls.length - epoquesAbans).toBe(1);
    expect(b.impl.epoquesDelFilXat.mock.calls.at(-1).slice(0, 2)).toEqual([FIL, 1]);
    expect(b.impl.sobresMeusXat.mock.calls.at(-1).slice(0, 2)).toEqual([FIL, [2]]);

    // B ja escriu amb la cap nova, i A la llig.
    await b.d.enviaMissatge(FIL, { id: uuid(4), text: 'rebut' });
    expect(b.impl.enviaXifratXat.mock.calls.at(-1)[1]).toMatchObject({ xifrat: { epoca: 2 }, epocaNova: null });
    expect((await a.d.loadMissatges(FIL)).at(-1).text).toBe('rebut');

    // Dues lectures alhora d'una altra rotació compartixen la mateixa resincronització.
    expect(await rota(servidor, a)).toBe(3);
    await a.d.enviaMissatge(FIL, { id: uuid(5), text: 'època tres' });
    const alhoraAbans = b.impl.epoquesDelFilXat.mock.calls.length;
    const [u, dos] = await Promise.all([b.d.loadMissatges(FIL), b.d.loadMissatges(FIL)]);
    expect(u.at(-1).text).toBe('època tres');
    expect(dos.at(-1).text).toBe('època tres');
    expect(b.impl.epoquesDelFilXat.mock.calls.length - alhoraAbans).toBe(1);
    // Ja al dia: cap més viatge al servidor.
    await b.d.loadMissatges(FIL);
    expect(b.impl.epoquesDelFilXat.mock.calls.length - alhoraAbans).toBe(1);
  });

  test('una època amb la firma falsa continua tancada (saltada, sense més viatges); la següent, bona, encadena i s’obri', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.enviaMissatge(FIL, { id: uuid(1), text: 'u' });
    await b.d.loadMissatges(FIL);

    await rota(servidor, a, { falsifica: true });
    await a.d.enviaMissatge(FIL, { id: uuid(2), text: 'amb una època falsa' });
    const tancada = (await b.d.loadMissatges(FIL)).at(-1);
    expect(tancada.text).toBeNull();
    expect(tancada.seguretat).toMatchObject({ xifrat: true, verificat: false, codi: 'epoca-desconeguda' });
    const despres = b.impl.epoquesDelFilXat.mock.calls.length;
    expect((await b.d.loadMissatges(FIL)).at(-1).text).toBeNull();
    expect(b.impl.epoquesDelFilXat.mock.calls.length).toBe(despres);

    await rota(servidor, a);
    await a.d.enviaMissatge(FIL, { id: uuid(3), text: 'època bona' });
    const files = await b.d.loadMissatges(FIL);
    expect(files.map((f) => f.text)).toEqual(['u', null, 'època bona']);
  });

  test('si el transport falla, una sola petició per lectura (encara que hi haja moltes files de l’època nova) i el pròxim sondeig ho torna a provar', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.enviaMissatge(FIL, { id: uuid(1), text: 'u' });
    await b.d.loadMissatges(FIL);
    await rota(servidor, a);
    await a.d.enviaMissatge(FIL, { id: uuid(2), text: 'dos' });
    await a.d.enviaMissatge(FIL, { id: uuid(3), text: 'tres' });

    const abans = b.impl.epoquesDelFilXat.mock.calls.length;
    b.impl.epoquesDelFilXat.mockRejectedValueOnce(new Error('xarxa'));
    const files = await b.d.loadMissatges(FIL);
    expect(files.map((f) => f.text)).toEqual(['u', null, null]);
    expect(files[2].seguretat).toMatchObject({ verificat: false, codi: 'epoca-desconeguda' });
    expect(b.impl.epoquesDelFilXat.mock.calls.length - abans).toBe(1);

    expect((await b.d.loadMissatges(FIL)).map((f) => f.text)).toEqual(['u', 'dos', 'tres']);
    expect(b.impl.epoquesDelFilXat.mock.calls.length - abans).toBe(2);
  });

  test('un canvi d’àmbit durant la resincronització l’avorta, i res de l’àmbit vell queda a la RAM del nou', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.enviaMissatge(FIL, { id: uuid(1), text: 'u' });
    await b.d.loadMissatges(FIL);
    await rota(servidor, a);
    await a.d.enviaMissatge(FIL, { id: uuid(2), text: 'dos' });

    const original = b.impl.epoquesDelFilXat.getMockImplementation();
    b.impl.epoquesDelFilXat.mockImplementationOnce(async (...args) => {
      const resultat = await original(...args);
      b.servei.fixaAmbit(ambitEntitat(B), ci(B));
      return resultat;
    });
    const sobresAbans = b.impl.sobresMeusXat.mock.calls.length;
    await expect(b.d.loadMissatges(FIL)).rejects.toMatchObject({ name: 'AbortError' });
    // Cap petició més amb les dades de l'àmbit vell.
    expect(b.impl.sobresMeusXat.mock.calls.length).toBe(sobresAbans);
    expect(b.servei.estatFilDesat(FIL)).toBeNull();
    expect(b.servei.textDesxifrat(FIL, uuid(1))).toBeNull();
    expect(b.servei.textDesxifrat(FIL, uuid(2))).toBeNull();

    b.servei.fixaAmbit(ambit(B), ci(B));
    expect((await b.d.loadMissatges(FIL)).map((f) => f.text)).toEqual(['u', 'dos']);
  });

  test('el context i els textos d’un àmbit que ha canviat just després de l’última operació no entren a la RAM del nou', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const primer = await creaPart(servidor, B);
    await a.d.enviaMissatge(FIL, { id: uuid(1), text: 'u' });
    await primer.d.loadMissatges(FIL);
    await rota(servidor, a);
    await a.d.enviaMissatge(FIL, { id: uuid(2), text: 'dos' });

    // El context: es mesura una vegada, s'oblida i es torna a construir amb la trampa.
    const b = await creaPart(servidor, B, { identitat: primer.identitat });
    const comptat = criptoComptat();
    const motor = creaMotorXifrat({ cripto: comptat.cripto, impl: b.impl, servei: b.servei, magatzem: b.magatzem, ara: () => T0 });
    const peticio = (exigix) => motor.contextDelFil({ fil: FIL_AB, tipusFil: 'directe', config: {}, exigix });
    await peticio(guardaAmbTrampa(b.servei, comptat, null, null));
    const opsContext = comptat.estat.ops;
    expect(opsContext).toBeGreaterThan(0);
    b.servei.desaEstatFil(FIL, null);
    comptat.estat.ops = 0;
    await expect(peticio(guardaAmbTrampa(b.servei, comptat, opsContext, () => b.servei.fixaAmbit(ambitEntitat(B), ci(B)))))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(b.servei.estatFilDesat(FIL)).toBeNull();

    // Un text: el context ja és a la RAM; es mesura amb un missatge i es prova amb un altre de la mateixa forma.
    b.servei.fixaAmbit(ambit(B), ci(B));
    await b.d.loadMissatges(FIL);
    await a.d.enviaMissatge(FIL, { id: uuid(3), text: 'tres' });
    await a.d.enviaMissatge(FIL, { id: uuid(4), text: 'quat' });
    const [, , fila3, fila4] = servidor.missatges.get(FIL);
    const obri = (fila, exigix) => motor.obri({ fil: FIL_AB, tipusFil: 'directe', files: [fila], config: {}, exigix });
    comptat.estat.ops = 0;
    expect((await obri(fila3, guardaAmbTrampa(b.servei, comptat, null, null)))[0].text).toBe('tres');
    const opsText = comptat.estat.ops;
    comptat.estat.ops = 0;
    await expect(obri(fila4, guardaAmbTrampa(b.servei, comptat, opsText, () => b.servei.fixaAmbit(ambitEntitat(B), ci(B)))))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(b.servei.textDesxifrat(FIL, uuid(4))).toBeNull();
  });
});

describe('G4 · la FK d’un adjunt que no es publica, i les descàrregues en vol', () => {
  /* La FK és la primera clau de 32 B aleatoris de xifraAdjunt (abans de cap altra de 32 B). */
  const capturaFk = () => {
    const generats = [];
    const original = cripto.getRandomValues;
    vi.spyOn(cripto, 'getRandomValues').mockImplementation(function capturant(v) {
      const r = original.call(cripto, v);
      if (v instanceof Uint8Array && v.length === 32) generats.push(v);
      return r;
    });
    return generats;
  };

  test('publicada, la FK és la de la RAM; si preparar, publicar o la guarda d’àmbit fallen, queda a zero', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    await creaPart(servidor, B);

    let generats = capturaFk();
    await a.d.publicaAdjuntXat(FIL, { id: uuid(10), fitxer: foto(), tipus: 'foto' });
    vi.restoreAllMocks();
    expect(generats[0]).toBe(a.servei.adjuntDesat(uuid(10)).a.k);
    expect(totZero(generats[0])).toBe(false);

    // Publicar falla.
    generats = capturaFk();
    a.impl.publicaAdjuntXifratXat.mockRejectedValueOnce(Object.assign(new Error('xarxa'), { reintentable: true }));
    await expect(a.d.publicaAdjuntXat(FIL, { id: uuid(11), fitxer: foto(), tipus: 'foto' })).rejects.toThrow('xarxa');
    vi.restoreAllMocks();
    expect(generats[0]).toHaveLength(32);
    expect(totZero(generats[0])).toBe(true);
    expect(a.servei.adjuntDesat(uuid(11))).toBeNull();

    // Preparar falla: C encara no té claus, i la gènesi del fil no es pot fer.
    generats = capturaFk();
    await expect(a.d.publicaAdjuntXat(FIL_C, { id: uuid(12), fitxer: foto(), tipus: 'foto' })).rejects.toMatchObject({ codi: 'clau-absent-del-contacte' });
    vi.restoreAllMocks();
    expect(generats[0]).toHaveLength(32);
    expect(totZero(generats[0])).toBe(true);
    expect(a.impl.publicaAdjuntXifratXat).toHaveBeenCalledTimes(2);

    // L'àmbit canvia mentre es publica: la guarda talla abans de desar-la, i la FK no queda viva.
    generats = capturaFk();
    const original = a.impl.publicaAdjuntXifratXat.getMockImplementation();
    a.impl.publicaAdjuntXifratXat.mockImplementationOnce(async (...args) => {
      const resultat = await original(...args);
      a.servei.fixaAmbit(ambitEntitat(A), ci(A));
      return resultat;
    });
    await expect(a.d.publicaAdjuntXat(FIL, { id: uuid(13), fitxer: foto(), tipus: 'foto' })).rejects.toMatchObject({ name: 'AbortError' });
    vi.restoreAllMocks();
    expect(totZero(generats[0])).toBe(true);

    // El servidor torna una altra cosa (l'eco no quadra): res a la RAM i la FK a zero.
    a.servei.fixaAmbit(ambit(A), ci(A));
    generats = capturaFk();
    a.impl.publicaAdjuntXifratXat.mockImplementationOnce(async (...args) => {
      const fila = await original(...args);
      return { ...fila, xifrat: { ...fila.xifrat, tf: aBase64url(new Uint8Array(32)) } };
    });
    await expect(a.d.publicaAdjuntXat(FIL, { id: uuid(14), fitxer: foto(), tipus: 'foto' })).rejects.toMatchObject({ codi: 'eco-no-quadra' });
    vi.restoreAllMocks();
    expect(totZero(generats[0])).toBe(true);
    expect(a.servei.adjuntDesat(uuid(14))).toBeNull();
    expect(a.servei.textDesxifrat(FIL, uuid(14))).toBeNull();
  });

  test('dues peces demanen alhora el mateix adjunt: una descàrrega, un desxifrat, un blob: i una retenció per a cada una; un error es compartix igual', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.publicaAdjuntXat(FIL, { id: uuid(20), fitxer: foto(), tipus: 'foto' });
    await a.d.publicaAdjuntXat(FIL, { id: uuid(21), fitxer: foto(), tipus: 'foto' });
    await b.d.loadMissatges(FIL);

    const alliberes = [];
    const reten = (allibera) => { alliberes.push(allibera); };
    const [u1, u2] = await Promise.all([b.d.urlAdjuntXat(uuid(20), {}, { reten }), b.d.urlAdjuntXat(uuid(20), {}, { reten })]);
    expect(u1).toMatch(/^blob:/);
    expect(u2).toBe(u1);
    expect(b.impl.bytesAdjuntXat).toHaveBeenCalledTimes(1);
    expect(b.blobs).toHaveLength(1);
    expect(alliberes).toHaveLength(2);
    expect(b.servei.estatAmbit()).toMatchObject({ midaBlobs: 1, bytesBlobs: 3000 });
    for (const allibera of alliberes) allibera();

    servidor.adjunts.set(uuid(21), Uint8Array.from(servidor.adjunts.get(uuid(21)), (x, i) => (i === 20 ? x ^ 0x5a : x)));
    const resultats = await Promise.allSettled([b.d.urlAdjuntXat(uuid(21)), b.d.urlAdjuntXat(uuid(21))]);
    expect(resultats.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(resultats.map((r) => r.reason?.codi)).toEqual(['adjunt-manipulat', 'adjunt-manipulat']);
    expect(b.impl.bytesAdjuntXat).toHaveBeenCalledTimes(2);
    expect(b.blobs).toHaveLength(1);
  });

  test('una descàrrega en vol d’un àmbit vell no la compartix mai la del nou (encara que torne a ser el mateix àmbit)', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.publicaAdjuntXat(FIL, { id: uuid(22), fitxer: foto(), tipus: 'foto' });
    await b.d.loadMissatges(FIL);

    let deixa;
    const retinguda = new Promise((resol) => { deixa = resol; });
    const original = b.impl.bytesAdjuntXat.getMockImplementation();
    b.impl.bytesAdjuntXat.mockImplementationOnce(async (...args) => { await retinguda; return original(...args); });
    const vella = b.d.urlAdjuntXat(uuid(22));
    await vi.waitFor(() => expect(b.impl.bytesAdjuntXat).toHaveBeenCalledTimes(1));

    // A → entitat → A: la mateixa clau d'àmbit, una generació nova, i l'adjunt rebut de nou.
    b.servei.fixaAmbit(ambitEntitat(B), ci(B));
    b.servei.fixaAmbit(ambit(B), ci(B));
    await b.d.loadMissatges(FIL);
    const nova = b.d.urlAdjuntXat(uuid(22));
    const fi = Date.now() + 500;
    while (b.impl.bytesAdjuntXat.mock.calls.length < 2 && Date.now() < fi) await new Promise((resol) => { setTimeout(resol, 5); });
    deixa();
    await expect(vella).rejects.toMatchObject({ name: 'AbortError' });
    await expect(nova).resolves.toMatch(/^blob:/);
    expect(b.impl.bytesAdjuntXat).toHaveBeenCalledTimes(2);
  });
});

describe('C2 · l’oblit posa a zero les FK de la RAM', () => {
  test('qui envia (oblidaTotXat) i qui rep (canvi d’actor): la mateixa referència a `a.k`, després tota a zero', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.publicaAdjuntXat(FIL, { id: uuid(30), fitxer: foto(), tipus: 'foto', text: 'la foto' });
    await b.d.loadMissatges(FIL);
    expect(await b.d.urlAdjuntXat(uuid(30))).toMatch(/^blob:/);

    const fkA = a.servei.adjuntDesat(uuid(30)).a.k;
    const fkB = b.servei.adjuntDesat(uuid(30)).a.k;
    expect(b.servei.textDesxifrat(FIL, uuid(30)).a.k).toBe(fkB);
    expect(totZero(fkA)).toBe(false);
    expect(totZero(fkB)).toBe(false);

    const estat = await a.servei.oblidaTotXat({ sessio: null, preferencies: null });
    expect(estat).toMatchObject({ estat: 'oblidat' });
    expect(a.servei.adjuntDesat(uuid(30))).toBeNull();
    expect(fkA).toHaveLength(32);
    expect(totZero(fkA)).toBe(true);

    b.servei.fixaAmbit(ambitEntitat(B), ci(B));
    expect(b.servei.adjuntDesat(uuid(30))).toBeNull();
    expect(totZero(fkB)).toBe(true);
  });
});

describe('Cicle 4 · el clar d’un adjunt i la FK d’una fila rebuda, a zero si no arriben a la RAM de l’àmbit', () => {
  test('C8 (Codex 1224) · l’àmbit canvia mentre es llig el fitxer: AbortError, cap publicació i els bytes llegits a zero', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    await creaPart(servidor, B);
    const llegit = () => cripto.getRandomValues(new Uint8Array(3000)).buffer;

    // Control: publicat, el clar llegit també ix a zero.
    const bo = llegit();
    await a.d.publicaAdjuntXat(FIL, { id: uuid(40), fitxer: { type: 'image/jpeg', arrayBuffer: async () => bo }, tipus: 'foto' });
    expect(totZero(new Uint8Array(bo))).toBe(true);

    const clar = llegit();
    expect(totZero(new Uint8Array(clar))).toBe(false);
    const publicacions = a.impl.publicaAdjuntXifratXat.mock.calls.length;
    const fitxer = { type: 'image/jpeg', arrayBuffer: async () => { a.servei.fixaAmbit(ambitEntitat(A), ci(A)); return clar; } };
    await expect(a.d.publicaAdjuntXat(FIL, { id: uuid(41), fitxer, tipus: 'foto' })).rejects.toMatchObject({ name: 'AbortError' });
    expect(clar.byteLength).toBe(3000);
    expect(totZero(new Uint8Array(clar))).toBe(true);
    expect(a.impl.publicaAdjuntXifratXat.mock.calls.length).toBe(publicacions);
    expect(a.servei.adjuntDesat(uuid(41))).toBeNull();
  });

  test('MITJÀ-04 (Gemini 1217) · si el desat de la fila oberta falla, la FK rebuda queda a zero i el text fora de la cau; la fila queda tancada fins que l’àmbit es refà', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.publicaAdjuntXat(FIL, { id: uuid(42), fitxer: foto(), tipus: 'foto' });
    await a.d.publicaAdjuntXat(FIL, { id: uuid(43), fitxer: foto(), tipus: 'foto' });
    const [fila42, fila43] = servidor.missatges.get(FIL);
    const vistes = [];
    const ambFallada = (falla) => creaMotorXifrat({
      cripto, impl: b.impl, magatzem: b.magatzem, ara: () => T0,
      servei: {
        ...b.servei,
        desaAdjunt: (id, info) => {
          vistes.push(info.a.k);
          if (falla === 'adjunt') throw new Error('índex ple');
          return b.servei.desaAdjunt(id, info);
        },
        desaTextDesxifrat: (...args) => {
          if (falla === 'text') throw new Error('cau plena');
          return b.servei.desaTextDesxifrat(...args);
        }
      }
    });
    const token = b.servei.captura('ambit');
    const obri = (motor, fila) => motor.obri({ fil: FIL_AB, tipusFil: 'directe', files: [fila], config: {}, exigix: () => b.servei.exigix(token) });

    // L'índex d'adjunts no la pot desar: la FK no queda viva fora de la RAM de l'àmbit.
    await expect(obri(ambFallada('adjunt'), fila42)).rejects.toThrow('índex ple');
    expect(vistes).toHaveLength(1);
    expect(vistes[0]).toHaveLength(32);
    expect(totZero(vistes[0])).toBe(true);
    expect(b.servei.adjuntDesat(uuid(42))).toBeNull();

    // L'índex sí, la cau del text no: la FK desada queda a zero (adjunt tancat) i el text fora de la cau.
    await expect(obri(ambFallada('text'), fila43)).rejects.toThrow('cau plena');
    expect(totZero(vistes[1])).toBe(true);
    expect(b.servei.adjuntDesat(uuid(43)).a.k).toBe(vistes[1]);
    expect(b.servei.textDesxifrat(FIL, uuid(43))).toBeNull();

    // L'antirepetició (estat.vistos) no les torna a obrir en este context: tancades, i cap adjunt
    // es desxifra (sense índex, el camí de sempre torna la URL signada del blob xifrat; amb la FK
    // a zero, la integritat falla) ni deixa cap blob: en clar.
    const tancades = await b.d.loadMissatges(FIL);
    expect(tancades.map((f) => [f.id, f.text, f.seguretat?.codi])).toEqual([[uuid(42), null, 'repeticio'], [uuid(43), null, 'repeticio']]);
    expect(await b.d.urlAdjuntXat(uuid(42))).toBe(`https://signada.example/${uuid(42)}`);
    await expect(b.d.urlAdjuntXat(uuid(43))).rejects.toMatchObject({ codi: 'adjunt-manipulat' });
    expect(b.blobs).toHaveLength(0);

    // Amb l'àmbit refet (B → entitat → B) el context es torna a construir i les dues s'obrin amb una FK viva.
    b.servei.fixaAmbit(ambitEntitat(B), ci(B));
    b.servei.fixaAmbit(ambit(B), ci(B));
    expect((await b.d.loadMissatges(FIL)).map((f) => f.seguretat?.verificat)).toEqual([true, true]);
    expect(totZero(b.servei.adjuntDesat(uuid(43)).a.k)).toBe(false);
    expect(await b.d.urlAdjuntXat(uuid(42))).toMatch(/^blob:/);
    expect(await b.d.urlAdjuntXat(uuid(43))).toMatch(/^blob:/);
  });
});

describe('Cicle 4 (tancament) · l’índex d’adjunts: cada id és de la seua fila, del seu fil i del seu emissor', () => {
  /* Un client modificat: el protocol a mà sobre el context de qui envia, sense passar per prepara. */
  const enviaHostil = async (part, id, a) => {
    const ctx = part.servei.estatFilDesat(FIL);
    const fila = await xifraMissatge(cripto, { estat: ctx.estat, jo: ctx.jo, id, contingut: { t: 'mira', a } });
    return part.impl.enviaXifratXat(FIL, { id, text: null, tipus: 'text', respostaA: null, xifrat: serialitzaXifrat(fila), epocaNova: null });
  };
  const refesAmbit = (part, jo) => {
    part.servei.fixaAmbit(ambitEntitat(jo), ci(jo));
    part.servei.fixaAmbit(ambit(jo), ci(jo));
  };
  const codis = (files) => files.map((f) => [f.id, f.seguretat?.codi ?? null, f.metadades?.adjunt?.id ?? null]);

  test('un membre que apunta la seua fila a la foto d’una altra persona: la seua fila es tanca (adjunt-incoherent) i la foto continua obrint-se, siga quin siga l’ordre', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    const b = await creaPart(servidor, B);
    await a.d.publicaAdjuntXat(FIL, { id: uuid(50), fitxer: foto(), tipus: 'foto' });
    await b.d.loadMissatges(FIL);
    const legit = b.servei.adjuntDesat(uuid(50));
    expect(legit.emissor).toBe(A);
    const aFals = { ...legit.a, k: cripto.getRandomValues(new Uint8Array(32)), h: cripto.getRandomValues(new Uint8Array(32)) };

    // El client del Mas no l'envia: l'`a` no és del missatge que el porta.
    const enviaments = b.impl.enviaXifratXat.mock.calls.length;
    await expect(b.d.enviaMissatge(FIL, { id: uuid(51), text: 'mira', a: aFals })).rejects.toMatchObject({ codi: 'adjunt-incoherent' });
    expect(b.impl.enviaXifratXat.mock.calls.length).toBe(enviaments);

    // Un client modificat sí: amb una FK qualsevol, i amb una còpia exacta de l'`a` d'A.
    await enviaHostil(b, uuid(51), aFals);
    await enviaHostil(b, uuid(52), { ...legit.a, k: Uint8Array.from(legit.a.k), h: Uint8Array.from(legit.a.h) });

    const esperat = [[uuid(50), null, uuid(50)], [uuid(51), 'adjunt-incoherent', null], [uuid(52), 'adjunt-incoherent', null]];
    refesAmbit(a, A);
    const perA = await a.d.loadMissatges(FIL);
    expect(codis(perA)).toEqual(esperat);
    expect(perA[0].seguretat).toMatchObject({ xifrat: true, verificat: true });
    expect(perA[1]).toMatchObject({ text: null, seguretat: { xifrat: true, verificat: false } });
    expect(a.servei.adjuntDesat(uuid(50)).emissor).toBe(A);
    expect(await a.d.urlAdjuntXat(uuid(50))).toMatch(/^blob:/);
    // El tancament queda a la cau: la lectura següent torna el mateix codi, no `repeticio`.
    expect(codis(await a.d.loadMissatges(FIL))).toEqual(esperat);

    // Un servidor que servix primer les files de l'atacant: el mateix resultat.
    const [fila50, ...hostils] = servidor.missatges.get(FIL);
    servidor.missatges.set(FIL, [...hostils, fila50]);
    refesAmbit(a, A);
    expect(codis(await a.d.loadMissatges(FIL))).toEqual([esperat[1], esperat[2], esperat[0]]);
    expect(a.servei.adjuntDesat(uuid(50)).emissor).toBe(A);
    expect(await a.d.urlAdjuntXat(uuid(50))).toMatch(/^blob:/);
  });

  test('un id ja indexat no canvia de fil ni d’emissor: la fila que ho intenta es tanca amb la FK a zero; el mateix (fil, emissor) sí que el renova', async () => {
    const servidor = creaServidor();
    const a = await creaPart(servidor, A);
    await creaPart(servidor, B);
    const c = await creaPart(servidor, C);

    // L'índex del servei.
    const entrada = (fil, emissor) => Object.freeze({ fil, emissor, a: { k: cripto.getRandomValues(new Uint8Array(32)) } });
    const primera = entrada(FIL, A);
    expect(a.servei.desaAdjunt(uuid(80), primera)).toBe(true);
    expect(a.servei.desaAdjunt(uuid(80), entrada(FIL, B))).toBe(false);
    expect(a.servei.desaAdjunt(uuid(80), entrada(FIL_C, A))).toBe(false);
    expect(a.servei.adjuntDesat(uuid(80))).toBe(primera);
    const renovada = entrada(FIL, A);
    expect(a.servei.desaAdjunt(uuid(80), renovada)).toBe(true);
    expect(a.servei.adjuntDesat(uuid(80))).toBe(renovada);

    // Pel motor: el mateix id en dos fils (un servidor que no fa complir la clau primària). C publica
    // primer al fil amb A; després A publica al fil amb B, i el blob que queda al servidor és el d'A.
    await c.d.publicaAdjuntXat(FIL_C, { id: uuid(90), fitxer: foto(), tipus: 'foto' });
    await a.d.publicaAdjuntXat(FIL, { id: uuid(90), fitxer: foto(), tipus: 'foto' });
    const vistes = [];
    const motor = creaMotorXifrat({
      cripto, impl: a.impl, magatzem: a.magatzem, ara: () => T0,
      servei: { ...a.servei, desaAdjunt: (id, info) => { vistes.push(info.a.k); return a.servei.desaAdjunt(id, info); } }
    });
    const token = a.servei.captura('ambit');
    const [filaC] = servidor.missatges.get(FIL_C);
    const [oberta] = await motor.obri({
      fil: { id: FIL_C, tipus: 'directe', altres: [{ id: C, tipus: 'persona' }] }, tipusFil: 'directe', files: [filaC], config: {}, exigix: () => a.servei.exigix(token)
    });
    expect(oberta).toMatchObject({ id: uuid(90), text: null, seguretat: { xifrat: true, verificat: false, codi: 'adjunt-incoherent' } });
    expect(oberta.metadades?.adjunt).toBeUndefined();
    expect(vistes).toHaveLength(1);
    expect(vistes[0]).toHaveLength(32);
    expect(totZero(vistes[0])).toBe(true);
    expect(a.servei.adjuntDesat(uuid(90))).toMatchObject({ fil: FIL, emissor: A });
    expect(totZero(a.servei.adjuntDesat(uuid(90)).a.k)).toBe(false);
    expect(codis(await a.d.loadMissatges(FIL_C))).toEqual([[uuid(90), 'adjunt-incoherent', null]]);
    expect(await a.d.urlAdjuntXat(uuid(90))).toMatch(/^blob:/);
  });
});
