// @vitest-environment node
/* P1-12 Fase 4 (pla 261029_1305, Bloc C, E1.1–E1.3) · El pipeline extrem a
   extrem amb un doble de servidor en memòria compartit per dos (i tres)
   persones, cadascuna amb el seu decorador, el seu magatzem IndexedDB fals i la
   seua identitat: el servidor només veu sobres; la receptora llig el text; la
   cua F7 encua amb les claus bloquejades i drena en ordre en desbloquejar-les;
   els adjunts viatgen xifrats i es servixen desxifrats; l'oblit (D-09) és
   explícit. Bandera real apagada: ací el decorador s'activa per paràmetre. */
import { beforeAll, describe, expect, test, vi } from 'vitest';
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
const ORG = '99999999-9999-4999-8999-999999999999';
const FIL = 'dddddddd-3333-4333-8333-333333333333';
const FIL2 = 'eeeeeeee-4444-4444-8444-444444444444';
const FIL_ENTITAT = 'ffffffff-5555-4555-8555-555555555555';
const ID1 = '10000000-0000-4000-8000-000000000001';
const ID2 = '10000000-0000-4000-8000-000000000002';
const ADJ = '10000000-0000-4000-8000-000000000003';
const ALTRE = '10000000-0000-4000-8000-000000000004';
const Q1 = '20000000-0000-4000-8000-000000000001';
const Q2 = '20000000-0000-4000-8000-000000000002';
const ORIGEN = 'https://socdepoble.org';
const T0 = Date.UTC(2026, 9, 29, 12);
const ci = (u) => JSON.stringify(['supabase', 'https://backend.example.test', u]);
const ambit = (u) => JSON.stringify(['backend-sintetic', u, `persona::${u}`]);
const actor = (u) => `persona::${u}`;
const muta = (d, i = 0) => { const c = Uint8Array.from(d); c[i] ^= 0x5a; return c; };

/* El servidor: claus públiques, cadena d'èpoques per fil, missatges amb sobre, blobs. Mai text en clar. */
function creaServidor() {
  const claus = new Map();
  const epoques = new Map();
  const missatges = new Map();
  const adjunts = new Map();
  let seq = 0;
  const filsDe = {
    [A]: [
      { id: FIL, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] },
      { id: FIL2, tipus: 'directe', altres: [{ id: C, tipus: 'persona' }] },
      { id: FIL_ENTITAT, tipus: 'directe', altres: [{ id: ORG, tipus: 'entitat' }] }
    ],
    [B]: [{ id: FIL, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] }],
    [C]: [{ id: FIL2, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] }]
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
    loadFils: vi.fn(async () => filsDe[jo].map((f) => {
      const ultim = de(f.id).at(-1);
      return ultim ? { ...f, ultimXifrat: { id: ultim.id, usuariId: ultim.usuariId, xifrat: ultim.xifrat } } : f;
    })),
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

async function creaPart(servidor, jo, { ambIdentitat = true } = {}) {
  const fals = creaIdbFalsEstructurat();
  const magatzem = creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T0 });
  const identitat = await creaIdentitat(cripto, { usuari: jo, creatMs: T0 });
  if (ambIdentitat) {
    await magatzem.desaIdentitat(ci(jo), identitat);
    servidor.publica(jo, identitat);
  }
  const impl = servidor.adaptadorDe(jo);
  const blobs = [];
  const d = ambXifratXat(impl, {
    actiu: true, isSecureContext: true, origen: ORIGEN, cripto, indexedDB: fals, magatzem, ara: () => T0,
    creaBlob: (parts, opcions) => new Blob(parts, opcions),
    creaUrl: (blob) => { blobs.push(blob); return `blob:sintetic/${blobs.length}`; }
  });
  const servei = serveiXifratXat(d);
  servei.fixaAmbit(ambit(jo), ci(jo));
  return { d, impl, magatzem, identitat, servei, blobs };
}

function creaMagatzemWeb(inicial = {}) {
  const dades = new Map(Object.entries(inicial));
  return {
    get length() { return dades.size; },
    key: (i) => [...dades.keys()][i] ?? null,
    getItem: (k) => dades.get(k) ?? null,
    setItem: (k, v) => dades.set(k, String(v)),
    removeItem: (k) => dades.delete(k)
  };
}

describe('pipeline extrem a extrem (dos parts, doble de servidor en memòria)', () => {
  let servidor;
  let a;
  let b;
  beforeAll(async () => {
    servidor = creaServidor();
    a = await creaPart(servidor, A);
    b = await creaPart(servidor, B);
  });

  test('A envia: gènesi dins de l’enviament, text null al transport, eco amb el text; B llig i respon; A llig el resum', async () => {
    const enviat = await a.d.enviaMissatge(FIL, { id: ID1, text: 'Bon dia, veïna' });
    expect(enviat).toMatchObject({ id: ID1, text: 'Bon dia, veïna', seguretat: { xifrat: true, verificat: true } });
    expect(a.impl.enviaMissatge).not.toHaveBeenCalled();
    const [filEnviat, paquet] = a.impl.enviaXifratXat.mock.calls[0];
    expect(filEnviat).toBe(FIL);
    expect(paquet.text).toBeNull();
    expect(paquet.xifrat).toMatchObject({ v: 1, epoca: 1 });
    expect(typeof paquet.xifrat.ct).toBe('string');
    expect(paquet.epocaNova).toMatchObject({ epoca: 1 });
    expect(paquet.epocaNova.sobres.map((s) => s.receptor).sort()).toEqual([A, B].sort());
    expect(JSON.stringify(servidor.missatges.get(FIL))).not.toContain('Bon dia');
    expect(JSON.stringify(servidor.epoques.get(FIL))).not.toContain('Bon dia');

    const rebuts = await b.d.loadMissatges(FIL);
    expect(rebuts.map((f) => f.text)).toEqual(['Bon dia, veïna']);
    expect(rebuts[0].seguretat).toMatchObject({ xifrat: true, verificat: true, clauAntiga: false });
    expect(typeof rebuts[0].seguretat.firmada).toBe('boolean');
    /* El sondeig torna les mateixes files: la memòria cau, no una «repetició». */
    expect((await b.d.loadMissatges(FIL))[0].text).toBe('Bon dia, veïna');

    const resposta = await b.d.enviaMissatge(FIL, { id: ID2, text: 'Bon dia!', respostaA: ID1 });
    expect(resposta.text).toBe('Bon dia!');
    expect(b.impl.enviaXifratXat.mock.calls[0][1].epocaNova).toBeNull();
    const perA = await a.d.loadMissatges(FIL);
    expect(perA.map((f) => f.text)).toEqual(['Bon dia, veïna', 'Bon dia!']);
    expect(perA[1].respostaA).toBe(ID1);
    const fils = await a.d.loadFils();
    expect(fils.find((f) => f.id === FIL).ultimTextDesxifrat).toBe('Bon dia!');
  });

  test('un fil amb una entitat no es xifra encara (equip signat pendent, o bloquejat per l’abast) i mai no ix en clar', async () => {
    await expect(a.d.enviaMissatge(FIL_ENTITAT, { text: 'hola' })).rejects.toMatchObject({ reintentable: false });
    expect(a.impl.enviaMissatge).not.toHaveBeenCalled();
    expect(a.impl.enviaXifratXat).toHaveBeenCalledTimes(1);
  });

  test('adjunts: xifrats abans de pujar; B els rep amb les metadades de sempre i els obri com a blob: desxifrat', async () => {
    const foto = cripto.getRandomValues(new Uint8Array(3000));
    const publicat = await a.d.publicaAdjuntXat(FIL, { id: ADJ, fitxer: new Blob([foto], { type: 'image/jpeg' }), tipus: 'foto', text: 'la foto' });
    expect(publicat).toMatchObject({ id: ADJ, text: 'la foto', tipus: 'foto', metadades: { adjunt: { id: ADJ, mime: 'image/jpeg', bytes: 3000 } } });
    expect(a.impl.publicaAdjuntXat).not.toHaveBeenCalled();
    const entrada = a.impl.publicaAdjuntXifratXat.mock.calls[0][1];
    expect(entrada.blob.length).toBe(entrada.mida);
    expect(Buffer.from(entrada.blob).includes(Buffer.from(foto.subarray(0, 32)))).toBe(false);
    expect(entrada.xifrat).toMatchObject({ v: 1 });
    expect(entrada).not.toHaveProperty('hash');

    const rebuts = await b.d.loadMissatges(FIL);
    const fila = rebuts.find((f) => f.id === ADJ);
    expect(fila).toMatchObject({ text: 'la foto', tipus: 'foto', metadades: { adjunt: { mime: 'image/jpeg', bytes: 3000 } } });
    const url = await b.d.urlAdjuntXat(ADJ);
    expect(url).toMatch(/^blob:/);
    expect(b.impl.urlAdjuntXat).not.toHaveBeenCalled();
    expect(b.blobs[0].type).toBe('image/jpeg');
    expect(new Uint8Array(await b.blobs[0].arrayBuffer())).toEqual(foto);
    expect(await b.d.urlAdjuntXat(ADJ)).toBe(url);
    expect(b.impl.bytesAdjuntXat).toHaveBeenCalledOnce();
    /* Un blob manipulat al servidor no es desxifra mai. */
    servidor.adjunts.set(ADJ, muta(servidor.adjunts.get(ADJ), 20));
    await expect(b.d.urlAdjuntXat(ADJ, {}, { renova: true })).rejects.toMatchObject({ codi: 'adjunt-manipulat' });
    /* Un id que no és d'un adjunt xifrat va pel camí de sempre. */
    await expect(b.d.urlAdjuntXat(ALTRE)).resolves.toBe(`https://signada.example/${ALTRE}`);
  });

  test('cua F7: amb les claus bloquejades s’encua amb el mateix id; en desbloquejar, drena en ordre, sense perdre res en fallar', async () => {
    const c = await creaPart(servidor, C, { ambIdentitat: false });
    await expect(c.d.enviaMissatge(FIL2, { id: Q1, text: 'primer' })).resolves.toMatchObject({ id: Q1, filId: FIL2, encuat: true, reintentable: true });
    await expect(c.d.enviaMissatge(FIL2, { id: Q2, text: 'segon' })).resolves.toMatchObject({ id: Q2, encuat: true });
    expect(c.impl.enviaXifratXat).not.toHaveBeenCalled();
    expect(c.impl.enviaMissatge).not.toHaveBeenCalled();
    expect((await c.magatzem.safata(ci(C), actor(C))).map((f) => f.id)).toEqual([Q1, Q2]);

    await c.magatzem.desaIdentitat(ci(C), c.identitat);
    servidor.publica(C, c.identitat);
    c.impl.enviaXifratXat.mockRejectedValueOnce(Object.assign(new Error('xarxa'), { reintentable: true }));
    const primer = await c.servei.drenaSafata();
    expect(primer.enviats).toEqual([]);
    expect(primer.pendents).toEqual([Q1, Q2]);
    expect(primer.error.message).toBe('xarxa');
    expect((await c.magatzem.safata(ci(C), actor(C))).map((f) => f.id)).toEqual([Q1, Q2]);

    const segon = await c.servei.drenaSafata();
    expect(segon).toMatchObject({ enviats: [Q1, Q2], pendents: [], error: null });
    expect(servidor.missatges.get(FIL2).map((r) => r.id)).toEqual([Q1, Q2]);
    expect(await c.magatzem.safata(ci(C), actor(C))).toEqual([]);
    expect(JSON.stringify(servidor.missatges.get(FIL2))).not.toContain('primer');
    expect((await a.d.loadMissatges(FIL2)).map((f) => f.text)).toEqual(['primer', 'segon']);
    expect(await c.servei.drenaSafata()).toMatchObject({ enviats: [], pendents: [], error: null });
  });

  test('oblit (D-09): RAM, IndexedDB, sessió i preferències; OBLIT_FALLIT explícit si el motor no pot esborrar', async () => {
    const sessio = creaMagatzemWeb({ sdp_xat_frase_vista: '1', altra_cosa: 'queda' });
    const preferencies = creaMagatzemWeb({ sdp_xat_recordatori: '1' });
    const estat = await a.servei.oblidaTotXat({ sessio, preferencies });
    expect(estat).toMatchObject({ estat: 'oblidat', pendents: [], causes: [] });
    expect(a.servei.estatOblit()).toBe(estat);
    expect(sessio.getItem('sdp_xat_frase_vista')).toBeNull();
    expect(sessio.getItem('altra_cosa')).toBe('queda');
    expect(preferencies.getItem('sdp_xat_recordatori')).toBeNull();
    expect(a.servei.estatAmbit()).toMatchObject({ ambitEstable: null, clauIdentitat: null, midaFils: 0, midaBlobs: 0 });
    expect(await a.magatzem.identitat(ci(A))).toBeFalsy();

    const trencat = {
      identitat: async () => null, desaASafata: async () => ({}), safata: async () => [], treuDeSafata: async () => true, tanca() {},
      oblidaEnTancar: async () => { throw Object.assign(new Error('El navegador ha bloquejat l’esborrat.'), { codi: 'OBLIT_FALLIT' }); }
    };
    const x = ambXifratXat(servidor.adaptadorDe(A), { actiu: true, isSecureContext: true, origen: ORIGEN, cripto, magatzem: trencat });
    serveiXifratXat(x).fixaAmbit(ambit(A), ci(A));
    const fallit = await serveiXifratXat(x).oblidaTotXat({ sessio: creaMagatzemWeb(), preferencies: creaMagatzemWeb() });
    expect(fallit).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'] });
    expect(fallit.causes[0].codi).toBe('OBLIT_FALLIT');
    expect(serveiXifratXat(x).estatOblit()).toBe(fallit);
  });

  test('sense motor (entorn sense magatzem) el decorador continua fallant tancat com a la Fase 3', async () => {
    const impl = servidor.adaptadorDe(A);
    const d = ambXifratXat(impl, { actiu: true, isSecureContext: true, origen: ORIGEN, cripto, indexedDB: { open() {} } });
    serveiXifratXat(d).fixaAmbit(ambit(A), ci(A));
    await expect(d.enviaMissatge(FIL, { text: 'en clar?' })).rejects.toMatchObject({ code: 'SDP-XAT-031' });
    expect(impl.enviaXifratXat).not.toHaveBeenCalled();
    const estat = await serveiXifratXat(d).oblidaTotXat();
    expect(estat).toMatchObject({ estat: 'oblidat', nomesRam: true });
  });
});
