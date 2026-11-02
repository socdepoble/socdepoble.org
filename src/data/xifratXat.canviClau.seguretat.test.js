// @vitest-environment node
/* B2a (marató 261101_2143; disseny §4.4, CS-01, D-05 a; P1-12) · Els canvis de
   clau d'un contacte al motor del xat xifrat, amb WebCrypto de veres, dos (i un
   aparell nou) persones amb el seu decorador i el seu magatzem IndexedDB fals,
   damunt d'un doble de servidor amb el registre de claus NOMÉS D'AFEGIR (la
   clau vella queda servida amb `retiradaAl`, com farà xat_claus_de). Defecte
   que es corregix: un canvi fort feia llançar el directori i tot el fil queia,
   també els missatges antics, sense cap camí per a eixir-ne. Ara: el canvi
   suau avança sol; el fort queda pendent, bloqueja l'enviament (mai a la
   safata, cap època nova), deixa llegir la història d'abans i tanca els de la
   clau nova fins a «He parlat amb {nom}: continua» (TOCTOU); la història
   sobreviu a l'acceptació i a una recàrrega (`anteriors`); la manipulació
   continua llançant; l'alarma de la clau pròpia bloqueja l'enviament; el
   recompte de verificats només compta claus actives verificades. Bandera real
   apagada: ací el decorador s'activa per paràmetre. */
import { describe, expect, test, vi } from 'vitest';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
import { CAPACITATS, CONTRACTE_NUCLI } from './contracte.js';
import { creaIdentitat } from './xifratXatProtocol.js';
import { creaMagatzemXat } from './xifratXatMagatzem.js';
import { aBase64url, signa } from './xifratXatCripto.js';
import { directoriAmbHistoria } from './xifratXatHistoria.js';
import { ROL_EPOCA } from './xifratXatFormats.js';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';

const cripto = globalThis.crypto;
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const C = 'cccccccc-3333-4333-8333-333333333333';
const FIL = 'f1000000-0000-4000-8000-000000000001';
const FIL2 = 'f1000000-0000-4000-8000-000000000002';
const GRUP = 'f1000000-0000-4000-8000-000000000003';
const ID1 = '10000000-0000-4000-8000-000000000001';
const ID2 = '10000000-0000-4000-8000-000000000002';
const ID3 = '10000000-0000-4000-8000-000000000003';
const ID4 = '10000000-0000-4000-8000-000000000004';
const ID5 = '10000000-0000-4000-8000-000000000005';
const ADJ = '10000000-0000-4000-8000-000000000006';
const ORIGEN = 'https://socdepoble.org';
const T0 = Date.UTC(2026, 10, 1, 23);
const DIA = 24 * 60 * 60 * 1000;
const b64 = aBase64url;
const ci = (u) => JSON.stringify(['supabase', 'https://backend.example.test', u]);
const ambit = (u) => JSON.stringify(['backend-sintetic', u, `persona::${u}`]);
const actor = (u) => `persona::${u}`;
const textos = (files) => files.map((f) => f.text);

/* El servidor: registre de claus només d'afegir, cadena d'èpoques per fil i missatges amb sobre. Mai text en clar.
   `ambGrup`: a més, un grup privat (A propietària, B i C membres) amb el roster canviable (`grup.membres`). */
function creaServidor({ ambGrup = false } = {}) {
  const claus = [];
  const epoques = new Map();
  const missatges = new Map();
  const adjunts = new Map();
  let seq = 0;
  const filGrup = ambGrup ? [{ id: GRUP, tipus: 'grup' }] : [];
  const grup = { membres: [{ usuari: A, rol: ROL_EPOCA.propietaria }, { usuari: B, rol: ROL_EPOCA.membre }, { usuari: C, rol: ROL_EPOCA.membre }] };
  const filsDe = {
    [A]: [{ id: FIL, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] }, { id: FIL2, tipus: 'directe', altres: [{ id: B, tipus: 'persona' }] }, ...filGrup],
    [B]: [{ id: FIL, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] }, { id: FIL2, tipus: 'directe', altres: [{ id: A, tipus: 'persona' }] }, ...filGrup],
    [C]: [...filGrup]
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
  /* Publicar una identitat retira l'activa d'eixe compte (mai la substituïx al registre). */
  const publica = (jo, identitat, extres = {}) => {
    for (const fila of claus) if (fila.usuariId === jo && !fila.retiradaAl) fila.retiradaAl = new Date(T0).toISOString();
    claus.push({
      usuariId: jo, kid: b64(identitat.kid), sigPub: b64(identitat.sigPub), dhPub: b64(identitat.dhPub),
      declaracio: b64(identitat.declaracio), autofirma: b64(identitat.autofirma),
      firmaContinuitat: identitat.firmaContinuitat ? b64(identitat.firmaContinuitat) : null, retiradaAl: null, ...extres
    });
  };
  const adaptadorDe = (jo) => ({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((n) => [n, vi.fn()])),
    ...Object.fromEntries([...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat, ...CAPACITATS.xatMultimedia].map((n) => [n, vi.fn(async () => { throw new Error(`no simulat: ${n}`); })])),
    loadFils: vi.fn(async () => filsDe[jo].map((f) => {
      const ultim = de(f.id).at(-1);
      return ultim ? { ...f, ultimXifrat: { id: ultim.id, usuariId: ultim.usuariId, xifrat: ultim.xifrat } } : { ...f };
    })),
    loadMissatges: vi.fn(async (fil) => de(fil).map((r) => ({ ...r }))),
    enviaMissatge: vi.fn(async () => { throw new Error('text en clar al transport!'); }),
    clausDeXat: vi.fn(async (usuaris) => claus.filter((f) => usuaris.includes(f.usuariId)).map((f) => ({ ...f }))),
    epoquesDelFilXat: vi.fn(async (fil, desDe) => (epoques.get(fil) ?? []).filter((e) => e.epoca > desDe).map(({ epoca, declaracio, firma }) => ({ epoca, declaracio, firma }))),
    sobresMeusXat: vi.fn(async (fil, llista) => (epoques.get(fil) ?? []).filter((e) => llista.includes(e.epoca))
      .flatMap((e) => e.sobres.filter((s) => s.receptor === jo).map((s) => ({ epoca: e.epoca, ...s })))),
    estatXifratXat: vi.fn(async (fils) => (ambGrup && fils.includes(GRUP) ? [{ filId: GRUP, membres: grup.membres.map((m) => ({ ...m })) }] : [])),
    enviaXifratXat: vi.fn(async (fil, paquet) => desaFila(jo, fil, paquet)),
    publicaAdjuntXifratXat: vi.fn(async (fil, entrada) => {
      adjunts.set(entrada.id, Uint8Array.from(entrada.blob));
      return desaFila(jo, fil, { id: entrada.id, xifrat: entrada.xifrat, respostaA: entrada.respostaA, epocaNova: entrada.epocaNova });
    })
  });
  return { claus, epoques, missatges, publica, adaptadorDe, grup };
}

/* Una persona en un aparell. `fals` i `identitat` d'una altra part: el mateix aparell recarregat. */
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

/* A i B parlen per FIL (A fixa B per TOFU): ID1 d'A i ID2 de B. */
async function conversaInicial() {
  const servidor = creaServidor();
  const a = await creaPart(servidor, A);
  const b = await creaPart(servidor, B);
  await a.d.enviaMissatge(FIL, { id: ID1, text: 'Bon dia, veïna' });
  await b.d.enviaMissatge(FIL, { id: ID2, text: 'Bon dia!', respostaA: ID1 });
  expect(textos(await a.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
  expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(b.identitat.kid));
  return { servidor, a, b };
}

const SENSE_CANVIS = { pendents: [], suaus: [], alarmes: [] };

describe('canvi suau d’un contacte', () => {
  test('s’accepta sol: canvisDeClau el porta a suaus, la fixació avança amb l’anterior i la conversa continua amb la clau nova', async () => {
    const { servidor, a, b } = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: b.identitat });
    servidor.publica(B, nova);
    const canvis = await a.servei.canvisDeClau(FIL);
    expect(canvis).toEqual({ pendents: [], suaus: [{ usuari: B, kidAnterior: b64(b.identitat.kid), kidNou: b64(nova.kid) }], alarmes: [] });
    expect(Object.isFrozen(canvis) && Object.isFrozen(canvis.suaus) && Object.isFrozen(canvis.suaus[0])).toBe(true);
    const fixacio = await a.magatzem.fixacio(ci(A), B);
    expect(b64(fixacio.kid)).toBe(b64(nova.kid));
    expect(fixacio.anteriors.map(b64)).toEqual([b64(b.identitat.kid)]);
    /* Ja confirmat: la pròxima lectura no hi torna. */
    expect(await a.servei.canvisDeClau(FIL)).toEqual(SENSE_CANVIS);
    /* A escriu: època nova (rotació) per a la clau nova; el B de l'aparell nou ho llig. */
    await a.d.enviaMissatge(FIL, { id: ID3, text: 'Clau nova, tot bé' });
    expect(servidor.epoques.get(FIL).map((e) => e.epoca)).toEqual([1, 2]);
    expect(servidor.epoques.get(FIL)[1].sobres.find((s) => s.receptor === B).kidReceptor).toBe(b64(nova.kid));
    const b2 = await creaPart(servidor, B, { identitat: nova, publica: false });
    expect((await b2.d.loadMissatges(FIL)).find((f) => f.id === ID3).text).toBe('Clau nova, tot bé');
    expect(textos(await a.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!', 'Clau nova, tot bé']);
  });
});

/* G2-A-integ-01 (Gauntlet 2) · L'avís del canvi suau el gastava qui construïa el context primer
   (la llista, la conversa, un altre fil amb la mateixa persona o un enviament), perquè eixa
   construcció avança la fixació: canvisDeClau ja no el trobava i la interfície no el pintava
   mai. Ara el servei de l'àmbit el guarda fins que canvisDeClau el lliura, una sola vegada. */
describe('canvi suau: l’avís dura fins que la interfície el llig (G2-A-integ-01)', () => {
  const ambSuau = async () => {
    const parts = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: parts.b.identitat });
    parts.servidor.publica(B, nova);
    const recarregat = await creaPart(parts.servidor, A, { identitat: parts.a.identitat, fals: parts.a.fals });
    const suau = { pendents: [], suaus: [{ usuari: B, kidAnterior: b64(parts.b.identitat.kid), kidNou: b64(nova.kid) }], alarmes: [] };
    return { ...parts, nova, recarregat, suau };
  };

  test('recàrrega i loadMissatges primer: la fixació ja ha avançat, però canvisDeClau encara dona el suau (i només una vegada)', async () => {
    const { recarregat, nova, suau } = await ambSuau();
    expect(textos(await recarregat.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
    expect(b64((await recarregat.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(nova.kid));
    expect(await recarregat.servei.canvisDeClau(FIL)).toEqual(suau);
    expect(await recarregat.servei.canvisDeClau(FIL)).toEqual(SENSE_CANVIS);
  });

  test('la llista primer (el resum de l’últim missatge construïx el context): el suau continua', async () => {
    const { recarregat, suau } = await ambSuau();
    await recarregat.d.loadFils();
    expect(await recarregat.servei.canvisDeClau(FIL)).toEqual(suau);
  });

  test('un altre fil amb la mateixa persona construït primer no el gasta per al fil que s’obri', async () => {
    const { servidor, nova, recarregat, suau } = await ambSuau();
    const b2 = await creaPart(servidor, B, { identitat: nova, publica: false });
    await b2.d.enviaMissatge(FIL2, { id: ID4, text: 'Des de la clau nova' });
    expect(textos(await recarregat.d.loadMissatges(FIL2))).toEqual(['Des de la clau nova']);
    expect(await recarregat.servei.canvisDeClau(FIL)).toEqual(suau);
    /* Un sol avís per persona: el fil que l'ha llegit primer se l'ha emportat. */
    expect(await recarregat.servei.canvisDeClau(FIL2)).toEqual(SENSE_CANVIS);
  });

  test('enviar abans que la interfície llija (prepara refà el context) tampoc no el gasta', async () => {
    const { recarregat, suau } = await ambSuau();
    await recarregat.d.enviaMissatge(FIL, { id: ID3, text: 'Escric abans de mirar' });
    expect(await recarregat.servei.canvisDeClau(FIL)).toEqual(suau);
  });

  test('l’avís és de la RAM de l’àmbit: un canvi de persona el buida', async () => {
    const { recarregat } = await ambSuau();
    await recarregat.d.loadMissatges(FIL);
    recarregat.servei.fixaAmbit(ambit(B), ci(B));
    recarregat.servei.fixaAmbit(ambit(A), ci(A));
    expect(await recarregat.servei.canvisDeClau(FIL)).toEqual(SENSE_CANVIS);
  });

  /* E1 · H-2 (àrbitre) · Si la interfície descarta la resposta (eixir i tornar a la conversa, o
     StrictMode), l'avís lliurat una sola vegada es perdia. Amb `conservaSuaus` (opcional) es torna
     a dir fins que la interfície el tanca amb tancaAvisSuau; sense l'opció, res no canvia. */
  test('H-2 · amb conservaSuaus l’avís es torna a dir fins que la interfície el tanca (tancaAvisSuau)', async () => {
    const { recarregat, nova, b, suau } = await ambSuau();
    await recarregat.d.loadMissatges(FIL);
    const opcions = { conservaSuaus: true };
    expect(await recarregat.servei.canvisDeClau(FIL, {}, opcions)).toEqual(suau);
    /* La resposta s'ha descartat: la lectura següent el torna a donar. */
    expect(await recarregat.servei.canvisDeClau(FIL, {}, opcions)).toEqual(suau);
    /* Un kid que no és el de l'avís (o una persona sense avís) no el tanca. */
    expect(recarregat.servei.tancaAvisSuau(B, b64(b.identitat.kid))).toBe(false);
    expect(recarregat.servei.tancaAvisSuau(C, b64(nova.kid))).toBe(false);
    expect(await recarregat.servei.canvisDeClau(FIL, {}, opcions)).toEqual(suau);
    expect(recarregat.servei.tancaAvisSuau(B, b64(nova.kid))).toBe(true);
    expect(await recarregat.servei.canvisDeClau(FIL, {}, opcions)).toEqual(SENSE_CANVIS);
    expect(recarregat.servei.tancaAvisSuau(B, b64(nova.kid))).toBe(false);
  });

  test('H-2 · control: sense l’opció (el hook d’ara) l’avís es lliura una sola vegada, com abans', async () => {
    const { recarregat, suau } = await ambSuau();
    await recarregat.d.loadMissatges(FIL);
    expect(await recarregat.servei.canvisDeClau(FIL, {}, {})).toEqual(suau);
    expect(await recarregat.servei.canvisDeClau(FIL)).toEqual(SENSE_CANVIS);
  });

  /* Una altra construcció (la conversa) avança la fixació i deixa l'avís al servei sense lliurar-lo; després, B canvia en fort a K3. */
  const suauIFort = async () => {
    const parts = await ambSuau();
    await parts.recarregat.d.enviaMissatge(FIL, { id: ID3, text: 'Amb K2' });
    const k3 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 2 });
    parts.servidor.publica(B, k3);
    const pendent = [{ usuari: B, motiu: 'sense-continuitat', kidFixat: b64(parts.nova.kid), kidNou: b64(k3.kid) }];
    return { ...parts, k3, pendent };
  };

  test('MA6 · un avís suau guardat i després un canvi fort de la mateixa persona: canvisDeClau dona el pendent i cap suau', async () => {
    const { recarregat, pendent } = await suauIFort();
    expect(await recarregat.servei.canvisDeClau(FIL)).toEqual({ pendents: pendent, suaus: [], alarmes: [] });
  });

  test('MA6 amb conservaSuaus · el pendent i cap suau, i l’avís vell no torna després d’acceptar la clau nova', async () => {
    const { recarregat, k3, pendent } = await suauIFort();
    const opcions = { conservaSuaus: true };
    expect(await recarregat.servei.canvisDeClau(FIL, {}, opcions)).toEqual({ pendents: pendent, suaus: [], alarmes: [] });
    expect(await recarregat.servei.canvisDeClau(FIL, {}, opcions)).toEqual({ pendents: pendent, suaus: [], alarmes: [] });
    expect(await recarregat.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k3.kid), conservaSuaus: true })).toEqual(SENSE_CANVIS);
    expect(await recarregat.servei.canvisDeClau(FIL, {}, opcions)).toEqual(SENSE_CANVIS);
  });
});

/* G2-A-integ-03 (Gauntlet 2) · acceptaCanviDelFil fixava la clau i després refeia el context: si
   eixe refresc fallava, l'acceptació es deia fallida («Torna-ho a provar») i el compositor
   continuava bloquejat amb la clau ja fixada. Ara la confirmació no depén del refresc final. */
describe('acceptar: la confirmació no depén del refresc final (G2-A-integ-03)', () => {
  const ambPendent = async () => {
    const { servidor, a } = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, nova);
    const estat = { fixada: false };
    const a2 = await creaPart(servidor, A, {
      identitat: a.identitat, fals: a.fals,
      embolcallaMagatzem: (real) => Object.freeze({ ...real, fixa: async (c, fila, opcions) => {
        const resultat = await real.fixa(c, fila, opcions);
        if (fila.usuari === B && b64(fila.kid) === b64(nova.kid)) estat.fixada = true;
        return resultat;
      } })
    });
    return { servidor, a2, nova, estat };
  };

  test('si el refresc cau després de fixar, no rebutja: torna els canvis sense el pendent acceptat i refrescat: false', async () => {
    const { a2, nova, estat } = await ambPendent();
    const original = a2.impl.epoquesDelFilXat.getMockImplementation();
    a2.impl.epoquesDelFilXat.mockImplementation(async (...args) => {
      if (estat.fixada) throw new TypeError('Failed to fetch');
      return original(...args);
    });
    expect(await a2.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(nova.kid) })).toEqual({ ...SENSE_CANVIS, refrescat: false });
    expect(b64((await a2.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(nova.kid));
    a2.impl.epoquesDelFilXat.mockImplementation(original);
    expect(await a2.servei.canvisDeClau(FIL)).toEqual(SENSE_CANVIS);
    await a2.d.enviaMissatge(FIL, { id: ID3, text: 'Rebut, B' });
  });

  test('contrast: si la xarxa cau abans de fixar, rebutja i no fixa res', async () => {
    const { a2, nova } = await ambPendent();
    a2.impl.epoquesDelFilXat.mockImplementationOnce(async () => { throw new TypeError('Failed to fetch'); });
    await expect(a2.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(nova.kid) })).rejects.toThrow('Failed to fetch');
    expect(b64((await a2.magatzem.fixacio(ci(A), B)).kid)).not.toBe(b64(nova.kid));
  });

  test('una manipulació al refresc final sí que es diu (historia-incoherent), encara que la clau ja siga fixada', async () => {
    const { a2, nova, estat } = await ambPendent();
    const intrusa = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 2 });
    const original = a2.impl.clausDeXat.getMockImplementation();
    a2.impl.clausDeXat.mockImplementation(async (...args) => {
      const files = await original(...args);
      if (!estat.fixada) return files;
      /* Dues claus actives de B: el servidor manipula el registre. */
      return [...files, { usuariId: B, kid: b64(intrusa.kid), sigPub: b64(intrusa.sigPub), dhPub: b64(intrusa.dhPub), declaracio: b64(intrusa.declaracio), autofirma: b64(intrusa.autofirma), firmaContinuitat: null, retiradaAl: null }];
    });
    await expect(a2.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(nova.kid) })).rejects.toMatchObject({ codi: 'historia-incoherent' });
    expect(b64((await a2.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(nova.kid));
  });
});

describe('canvi fort d’un contacte (sense continuïtat): el fil no cau', () => {
  test('pendent; enviar llança clau-canviada-forta sense tocar el transport ni la safata ni crear cap època; la història d’abans s’obri', async () => {
    const { servidor, a } = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, nova);
    expect(await a.servei.canvisDeClau(FIL)).toEqual({
      pendents: [{ usuari: B, motiu: 'sense-continuitat', kidFixat: b64((await a.magatzem.fixacio(ci(A), B)).kid), kidNou: b64(nova.kid) }],
      suaus: [], alarmes: []
    });
    const enviats = a.impl.enviaXifratXat.mock.calls.length;
    await expect(a.d.enviaMissatge(FIL, { id: ID3, text: 'hola?' })).rejects.toMatchObject({
      codi: 'clau-canviada-forta', reintentable: false, encuable: false, usuari: B, motiu: 'sense-continuitat', kidNou: b64(nova.kid)
    });
    expect(a.impl.enviaXifratXat.mock.calls.length).toBe(enviats);
    expect(a.impl.enviaMissatge).not.toHaveBeenCalled();
    expect(await a.magatzem.safata(ci(A), actor(A))).toEqual([]);
    expect(servidor.epoques.get(FIL).map((e) => e.epoca)).toEqual([1]);
    /* Un adjunt tampoc: ni es xifra ni es puja. */
    await expect(a.d.publicaAdjuntXat(FIL, { id: ADJ, fitxer: new Blob([new Uint8Array(64)], { type: 'image/jpeg' }), tipus: 'foto' }))
      .rejects.toMatchObject({ codi: 'clau-canviada-forta' });
    expect(a.impl.publicaAdjuntXifratXat).not.toHaveBeenCalled();
    /* La safata (drena) no té res a enviar. */
    expect((await a.servei.drenaSafata()).enviats).toEqual([]);
    /* El defecte: abans tot el fil queia. Ara la història d'abans s'obri, també en un aparell recarregat. */
    expect(textos(await a.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
    const recarregat = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    expect(textos(await recarregat.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
    /* La fixació no s'ha mogut. */
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).not.toBe(b64(nova.kid));
  });

  test('els missatges de la clau nova ixen tancats amb clau-nova-sense-confirmar; acceptar-la en un fil els obri en tots, també després de recarregar', async () => {
    const { servidor, a, b } = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, nova);
    /* B, en l'aparell nou, obri FIL2 (gènesi amb la clau nova) i escriu. */
    const b2 = await creaPart(servidor, B, { identitat: nova, publica: false });
    await b2.d.enviaMissatge(FIL2, { id: ID4, text: 'Sóc B, amb mòbil nou' });
    const tancats = await a.d.loadMissatges(FIL2);
    expect(tancats).toHaveLength(1);
    expect(tancats[0]).toMatchObject({ id: ID4, text: null, seguretat: { xifrat: true, verificat: false, codi: 'clau-nova-sense-confirmar' } });
    expect(JSON.stringify(tancats)).not.toContain('mòbil nou');
    /* El resum de la llista tampoc el dona. */
    expect((await a.d.loadFils()).find((f) => f.id === FIL2).ultimTextDesxifrat).toBeUndefined();

    /* «He parlat amb B: continua», des de FIL: la fixació és per persona. */
    const despres = await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(nova.kid) });
    expect(despres).toEqual(SENSE_CANVIS);
    const fixacio = await a.magatzem.fixacio(ci(A), B);
    expect(fixacio).toMatchObject({ verificat: false });
    expect(b64(fixacio.kid)).toBe(b64(nova.kid));
    expect(fixacio.anteriors.map(b64)).toEqual([b64(b.identitat.kid)]);
    expect(await a.servei.canvisDeClau(FIL2)).toEqual(SENSE_CANVIS);
    expect(textos(await a.d.loadMissatges(FIL2))).toEqual(['Sóc B, amb mòbil nou']);
    expect(textos(await a.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);

    /* Recàrrega (cap memòria cau): la història d'abans encara s'obri gràcies a les anteriors. */
    const recarregat = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    expect(textos(await recarregat.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
    /* Enviar crea l'època 2 amb la clau nova; B (mòbil nou) l'obri. */
    await recarregat.d.enviaMissatge(FIL, { id: ID5, text: 'Rebut, B' });
    const epoques = servidor.epoques.get(FIL);
    expect(epoques.map((e) => e.epoca)).toEqual([1, 2]);
    expect(epoques[1].sobres.find((s) => s.receptor === B).kidReceptor).toBe(b64(nova.kid));
    expect((await b2.d.loadMissatges(FIL)).find((f) => f.id === ID5).text).toBe('Rebut, B');
  });

  test('prova que mossega: sense les anteriors, després d’acceptar i recarregar, la història d’abans es tancaria', async () => {
    const { servidor, a } = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, nova);
    await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(nova.kid) });
    expect((await a.magatzem.fixacio(ci(A), B)).anteriors).toHaveLength(1);
    const lectures = [];
    const senseAnteriors = await creaPart(servidor, A, {
      identitat: a.identitat, fals: a.fals,
      embolcallaMagatzem: (real) => Object.freeze({
        ...real,
        fixacio: async (c, u) => {
          const fila = await real.fixacio(c, u);
          if (!fila) return fila;
          const { anteriors, ...resta } = fila;
          lectures.push(anteriors?.length ?? 0);
          return resta;
        }
      })
    });
    const files = await senseAnteriors.d.loadMissatges(FIL);
    expect(lectures.length).toBeGreaterThan(0);
    expect(lectures.every((n) => n === 1)).toBe(true);
    expect(textos(files)).toEqual([null, null]);
    /* I amb les anteriors (el mateix aparell, sense l'embolcall), s'obri. */
    const amb = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    expect(textos(await amb.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
  });

  test('TOCTOU: acceptar un kid que no és el pendent (o una persona sense pendent) dona kid-canviat i no escriu res', async () => {
    const servidor = creaServidor();
    const escrits = [];
    const a = await creaPart(servidor, A, {
      embolcallaMagatzem: (real) => Object.freeze({ ...real, fixa: async (c, fila, opcions) => { escrits.push({ ...fila, kid: b64(fila.kid) }); return real.fixa(c, fila, opcions); } })
    });
    const b = await creaPart(servidor, B);
    await a.d.enviaMissatge(FIL, { id: ID1, text: 'Hola' });
    expect(escrits.map((e) => e.kid)).toEqual([b64(b.identitat.kid)]);
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, nova);
    for (const opcions of [
      { usuari: B, kid: b64(b.identitat.kid) },
      { usuari: B, kid: b64(cripto.getRandomValues(new Uint8Array(16))) },
      { usuari: B },
      { usuari: A, kid: b64(nova.kid) },
      { kid: b64(nova.kid) }
    ]) {
      await expect(a.servei.acceptaCanviClau(FIL, opcions)).rejects.toMatchObject({ codi: 'kid-canviat', reintentable: false });
    }
    expect(escrits).toHaveLength(1);
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(b.identitat.kid));
    /* Dins de la transacció: si la fixació d'IndexedDB ja no és la del pendent, kid-canviat i res substituït. */
    await a.magatzem.fixa(ci(A), { usuari: B, kid: cripto.getRandomValues(new Uint8Array(16)) }, { anterior: b.identitat.kid });
    const forjada = await a.magatzem.fixacio(ci(A), B);
    const a2 = await creaPart(servidor, A, {
      identitat: a.identitat, fals: a.fals,
      embolcallaMagatzem: (real) => Object.freeze({ ...real, fixacio: async (c, u) => (u === B ? { ...forjada, kid: b.identitat.kid } : real.fixacio(c, u)) })
    });
    await expect(a2.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(nova.kid) })).rejects.toMatchObject({ codi: 'kid-canviat' });
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(forjada.kid));
  });

  test('un canvi d’àmbit a mig acceptaCanviClau: AbortError AMBIT_CANVIAT i cap fixació escrita', async () => {
    const { servidor, a, b } = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, nova);
    const original = a.impl.clausDeXat.getMockImplementation();
    a.impl.clausDeXat.mockImplementationOnce(async (usuaris, config) => {
      a.servei.fixaAmbit(ambit(B), ci(B));
      return original(usuaris, config);
    });
    await expect(a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(nova.kid) })).rejects.toMatchObject({ name: 'AbortError', code: 'AMBIT_CANVIAT' });
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(b.identitat.kid));
    a.servei.fixaAmbit(ambit(A), ci(A));
    expect((await a.servei.canvisDeClau(FIL)).pendents).toHaveLength(1);
  });

  /* G2-A-integ-02 (girada) · Abans el pendent sense candidata portava kidNou i la interfície oferia
     «He parlat amb {nom}: continua», un botó que sempre fallava. Ara kidNou és null (no es pot
     acceptar), també a l'error de l'enviament, i el pendent continua bloquejant. */
  test('una clau nova sense declaració autofirmada: pendent amb kidNou null (cap acceptació possible), el número dona sense-clau-altre i res es fixa', async () => {
    const { servidor, a } = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.publica(B, nova, { declaracio: null, autofirma: null, firmaContinuitat: null });
    expect((await a.servei.canvisDeClau(FIL)).pendents).toEqual([{ usuari: B, motiu: 'sense-continuitat', kidFixat: b64((await a.magatzem.fixacio(ci(A), B)).kid), kidNou: null }]);
    await expect(a.d.enviaMissatge(FIL, { id: ID3, text: 'hola?' })).rejects.toMatchObject({ codi: 'clau-canviada-forta', usuari: B, kidNou: null });
    await expect(a.servei.numeroSeguretat(FIL)).rejects.toMatchObject({ codi: 'sense-clau-altre' });
    await expect(a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(nova.kid) })).rejects.toMatchObject({ codi: 'kid-canviat' });
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).not.toBe(b64(nova.kid));
  });

  test('un adjunt amb un pendent ja conegut (el fil ha llegit els canvis): el fitxer ni es llig (cap arrayBuffer) ni es xifra ni es puja', async () => {
    const { servidor, a } = await conversaInicial();
    servidor.publica(B, await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 }));
    /* Com la interfície en obrir el fil: el context en RAM ja porta el pendent. (Amb un context
       vell, prepara el refà i no puja res: ho prova el cas de dalt.) */
    expect((await a.servei.canvisDeClau(FIL)).pendents).toHaveLength(1);
    const fitxer = { type: 'image/jpeg', size: 64, arrayBuffer: vi.fn(async () => new ArrayBuffer(64)) };
    await expect(a.d.publicaAdjuntXat(FIL, { id: ADJ, fitxer, tipus: 'foto' })).rejects.toMatchObject({ codi: 'clau-canviada-forta', encuable: false, usuari: B });
    expect(fitxer.arrayBuffer).not.toHaveBeenCalled();
    expect(a.impl.publicaAdjuntXifratXat).not.toHaveBeenCalled();
  });

  test('la fila d’un autor pendent signada amb una clau de la seua història que falla per una altra causa conserva el seu codi', async () => {
    const { servidor, a } = await conversaInicial();
    servidor.publica(B, await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 }));
    /* Una fila de B amb la clau fixada (història) que apunta a una època que no existix. */
    const vella = servidor.missatges.get(FIL).find((f) => f.id === ID2);
    servidor.missatges.set(FIL, [...servidor.missatges.get(FIL), { ...vella, id: ID5, seq: 99, xifrat: { ...vella.xifrat, epoca: 99 } }]);
    const recarregat = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    expect((await recarregat.servei.canvisDeClau(FIL)).pendents).toHaveLength(1);
    expect((await recarregat.d.loadMissatges(FIL)).map((f) => [f.text, f.seguretat?.codi ?? null])).toEqual([
      ['Bon dia, veïna', null], ['Bon dia!', null], [null, 'epoca-desconeguda']
    ]);
  });
});

/* B2a-ARB-01 (àrbitre adversarial) · K1 → K2 per un canvi suau que este aparell no ha vist i
   després K2 → K3 sense continuïtat. El tram suau s'accepta sol (§2.1.1): si l'acceptació de K3
   el perdia, la història escrita amb K2 es tancava per sempre i el fil on A ja havia ancorat
   el cap queia amb cap-retrocedix (enviar, llegir i canvisDeClau), també després de recarregar. */
describe('canvi suau no vist i després un de fort (B2a-ARB-01)', () => {
  const suauIFort = async () => {
    const parts = await conversaInicial();
    const k2 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: parts.b.identitat });
    parts.servidor.publica(B, k2);
    const k3 = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 2 });
    return { ...parts, k1: parts.b.identitat, k2, k3, publicaK3: () => parts.servidor.publica(B, k3) };
  };
  const cadenaDe = async (a) => {
    const f = await a.magatzem.fixacio(ci(A), B);
    return [f.kid, ...(f.anteriors ?? [])].map(b64);
  };

  test('acceptar des del fil escrit amb K2 (cap ja ancorat): cap cap-retrocedix, K2 queda a anteriors i el fil continua viu després de recarregar', async () => {
    const { servidor, a, k1, k2, k3, publicaK3 } = await suauIFort();
    const b2 = await creaPart(servidor, B, { identitat: k2, publica: false });
    await b2.d.enviaMissatge(FIL2, { id: ID4, text: 'escrit amb K2' });
    publicaK3();
    const canvis = await a.servei.canvisDeClau(FIL2);
    expect(canvis).toEqual({ pendents: [{ usuari: B, motiu: 'sense-continuitat', kidFixat: b64(k2.kid), kidNou: b64(k3.kid) }], suaus: [], alarmes: [] });
    expect(textos(await a.d.loadMissatges(FIL2))).toEqual(['escrit amb K2']);
    /* El tram suau ja és al magatzem (confirma); la clau nova, no. */
    expect(await cadenaDe(a)).toEqual([b64(k2.kid), b64(k1.kid)]);
    expect(await a.servei.acceptaCanviClau(FIL2, { usuari: B, kid: b64(k3.kid) })).toEqual(SENSE_CANVIS);
    expect(await cadenaDe(a)).toEqual([b64(k3.kid), b64(k2.kid), b64(k1.kid)]);
    expect(textos(await a.d.loadMissatges(FIL2))).toEqual(['escrit amb K2']);
    expect(textos(await a.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
    const recarregat = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    expect(await recarregat.servei.canvisDeClau(FIL2)).toEqual(SENSE_CANVIS);
    expect(textos(await recarregat.d.loadMissatges(FIL2))).toEqual(['escrit amb K2']);
    expect(textos(await recarregat.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
    await recarregat.d.enviaMissatge(FIL2, { id: ID5, text: 'Rebut, B' });
    const b3 = await creaPart(servidor, B, { identitat: k3, publica: false });
    expect((await b3.d.loadMissatges(FIL2)).find((f) => f.id === ID5).text).toBe('Rebut, B');
  });

  test('acceptar des d’un altre fil sense haver obert el de K2: el missatge de K2 s’obri després (cap epoca-desconeguda)', async () => {
    const { servidor, a, k1, k2, k3, publicaK3 } = await suauIFort();
    const b2 = await creaPart(servidor, B, { identitat: k2, publica: false });
    await b2.d.enviaMissatge(FIL2, { id: ID4, text: 'escrit amb K2' });
    publicaK3();
    expect(await a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(k3.kid) })).toEqual(SENSE_CANVIS);
    expect(await cadenaDe(a)).toEqual([b64(k3.kid), b64(k2.kid), b64(k1.kid)]);
    expect((await a.d.loadMissatges(FIL2)).map((f) => [f.text, f.seguretat?.codi ?? null])).toEqual([['escrit amb K2', null]]);
  });

  test('aparell fred, des d’un fil on només hi ha l’època de K3 (confirma no ha corregut): l’acceptació encadena les dues fixacions, cap kid-canviat', async () => {
    const { servidor, a, k1, k2, k3, publicaK3 } = await suauIFort();
    publicaK3();
    const b3 = await creaPart(servidor, B, { identitat: k3, publica: false });
    await b3.d.enviaMissatge(FIL2, { id: ID4, text: 'escrit amb K3' });
    /* Una pestanya mira els canvis: el pendent parteix de K2, però el magatzem encara té K1
       (el fil no té cap època que este aparell puga verificar i confirma no corre). */
    const mira = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    expect((await mira.servei.canvisDeClau(FIL2)).pendents).toEqual([{ usuari: B, motiu: 'sense-continuitat', kidFixat: b64(k2.kid), kidNou: b64(k3.kid) }]);
    expect(await cadenaDe(mira)).toEqual([b64(k1.kid)]);
    /* Una altra, en fred (RAM buida), accepta com a primera operació. */
    const fred = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    expect(await fred.servei.acceptaCanviClau(FIL2, { usuari: B, kid: b64(k3.kid) })).toEqual(SENSE_CANVIS);
    expect(await cadenaDe(fred)).toEqual([b64(k3.kid), b64(k2.kid), b64(k1.kid)]);
    expect(textos(await fred.d.loadMissatges(FIL2))).toEqual(['escrit amb K3']);
    expect(textos(await fred.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
  });

  test('«Marca com a verificat» sobre el pendent també guarda el tram suau, i la clau nova queda verificada', async () => {
    const { servidor, a, k1, k2, k3, publicaK3 } = await suauIFort();
    const b2 = await creaPart(servidor, B, { identitat: k2, publica: false });
    await b2.d.enviaMissatge(FIL2, { id: ID4, text: 'escrit amb K2' });
    publicaK3();
    const fred = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    const numero = await fred.servei.numeroSeguretat(FIL);
    expect(numero).toMatchObject({ kid: b64(k3.kid), pendent: true, verificat: false });
    expect(await fred.servei.marcaVerificat(FIL, { kid: numero.kid, verificat: true })).toMatchObject({ kid: b64(k3.kid), verificat: true, pendent: false });
    expect(await cadenaDe(fred)).toEqual([b64(k3.kid), b64(k2.kid), b64(k1.kid)]);
    expect((await fred.magatzem.fixacio(ci(A), B)).verificat).toBe(true);
    expect(textos(await fred.d.loadMissatges(FIL2))).toEqual(['escrit amb K2']);
  });

  test('si una altra pestanya ha mogut la fixació, l’avanç del tram suau fa comparar-i-canviar: kid-canviat i ni K2 ni K3 s’escriuen', async () => {
    const { servidor, a, k2, k3, publicaK3 } = await suauIFort();
    publicaK3();
    const b3 = await creaPart(servidor, B, { identitat: k3, publica: false });
    await b3.d.enviaMissatge(FIL2, { id: ID4, text: 'escrit amb K3' });
    /* Esta pestanya llig K1; entretant, IndexedDB passa a una clau que no és cap de les del tram. */
    const llegida = await a.magatzem.fixacio(ci(A), B);
    const intrusa = cripto.getRandomValues(new Uint8Array(16));
    await a.magatzem.fixa(ci(A), { usuari: B, kid: intrusa }, { anterior: llegida.kid });
    const intents = [];
    const pestanya = await creaPart(servidor, A, {
      identitat: a.identitat, fals: a.fals,
      embolcallaMagatzem: (real) => Object.freeze({
        ...real,
        fixacio: async (c, u) => (u === B ? llegida : real.fixacio(c, u)),
        fixa: async (c, fila, opcions) => { intents.push(b64(fila.kid)); return real.fixa(c, fila, opcions); }
      })
    });
    await expect(pestanya.servei.acceptaCanviClau(FIL2, { usuari: B, kid: b64(k3.kid) })).rejects.toMatchObject({ codi: 'kid-canviat' });
    expect(intents).toEqual([b64(k2.kid)]);
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(intrusa));
  });
});

describe('contacte verificat i finestra de recuperació', () => {
  test('verificat + canvi suau → pendent «verificat»; marcaVerificat(true) accepta i verifica; (false) sobre el pendent no es pot', async () => {
    const { servidor, a, b } = await conversaInicial();
    const { kid } = await a.servei.numeroSeguretat(FIL);
    await a.servei.marcaVerificat(FIL, { kid, verificat: true });
    expect(await a.servei.contactesVerificats()).toBe(1);
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: b.identitat });
    servidor.publica(B, nova);
    expect((await a.servei.canvisDeClau(FIL)).pendents).toEqual([{ usuari: B, motiu: 'verificat', kidFixat: kid, kidNou: b64(nova.kid) }]);
    await expect(a.d.enviaMissatge(FIL, { id: ID3, text: 'x' })).rejects.toMatchObject({ codi: 'clau-canviada-forta', motiu: 'verificat' });
    /* El recompte ja no la compta: la clau activa no és la verificada. */
    expect(await a.servei.contactesVerificats()).toBe(0);
    const numero = await a.servei.numeroSeguretat(FIL);
    expect(numero).toMatchObject({ usuari: B, kid: b64(nova.kid), verificat: false, pendent: true });
    await expect(a.servei.marcaVerificat(FIL, { kid: b64(nova.kid), verificat: false })).rejects.toMatchObject({ codi: 'clau-canviada-forta' });
    expect((await a.magatzem.fixacio(ci(A), B)).verificat).toBe(true);
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(kid);
    const marcat = await a.servei.marcaVerificat(FIL, { kid: b64(nova.kid), verificat: true });
    expect(marcat).toMatchObject({ usuari: B, kid: b64(nova.kid), numero: numero.numero, verificat: true, pendent: false });
    const fixacio = await a.magatzem.fixacio(ci(A), B);
    expect(fixacio.verificat).toBe(true);
    expect(fixacio.anteriors.map(b64)).toEqual([kid]);
    expect(await a.servei.canvisDeClau(FIL)).toEqual(SENSE_CANVIS);
    expect(await a.servei.numeroSeguretat(FIL)).toMatchObject({ kid: b64(nova.kid), verificat: true, pendent: false });
    expect(await a.servei.contactesVerificats()).toBe(1);
  });

  test('finestra de 7 dies: una alerta de recuperació recent fa fort un canvi amb continuïtat; passada la finestra, suau', async () => {
    const dins = await conversaInicial();
    const novaDins = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: dins.b.identitat });
    dins.servidor.publica(B, novaDins, { alertaRecuperacioMs: T0 - 6 * DIA });
    expect((await dins.a.servei.canvisDeClau(FIL)).pendents).toEqual([expect.objectContaining({ usuari: B, motiu: 'finestra-recuperacio', kidNou: b64(novaDins.kid) })]);

    const fora = await conversaInicial();
    const novaFora = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: fora.b.identitat });
    fora.servidor.publica(B, novaFora, { alertaRecuperacioMs: T0 - 8 * DIA });
    expect(await fora.a.servei.canvisDeClau(FIL)).toEqual({ pendents: [], suaus: [{ usuari: B, kidAnterior: b64(fora.b.identitat.kid), kidNou: b64(novaFora.kid) }], alarmes: [] });

    /* Un valor que no és un enter segur no obri cap finestra. */
    const brut = await conversaInicial();
    const novaBruta = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: brut.b.identitat });
    brut.servidor.publica(B, novaBruta, { alertaRecuperacioMs: String(T0) });
    expect((await brut.a.servei.canvisDeClau(FIL)).suaus).toHaveLength(1);
  });
});

describe('manipulació: continua llançant i res s’accepta', () => {
  const comprovaTancat = async ({ a, b }, codi) => {
    await expect(a.servei.canvisDeClau(FIL)).rejects.toMatchObject({ codi });
    await expect(a.d.enviaMissatge(FIL, { id: ID3, text: 'x' })).rejects.toMatchObject({ codi });
    await expect(a.servei.acceptaCanviClau(FIL, { usuari: B, kid: b64(b.identitat.kid) })).rejects.toMatchObject({ codi });
    /* Un aparell recarregat (sense memòria cau): tot el fil tancat amb el codi de la manipulació. */
    expect((await a.d.loadMissatges(FIL)).map((f) => [f.text, f.seguretat?.codi])).toEqual([[null, codi], [null, codi]]);
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(b64(b.identitat.kid));
  };

  test('bifurcació: dues successores de la mateixa clau', async () => {
    const parts = await conversaInicial();
    const x = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: parts.b.identitat });
    const y = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 2, anterior: parts.b.identitat });
    parts.servidor.publica(B, x);
    parts.servidor.publica(B, y);
    const recarregat = await creaPart(parts.servidor, A, { identitat: parts.a.identitat, fals: parts.a.fals });
    await comprovaTancat({ a: recarregat, b: parts.b }, 'bifurcacio');
  });

  test('kid-no-quadra: el kid servit no és el de les claus declarades', async () => {
    const parts = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    parts.servidor.publica(B, nova, { kid: b64(cripto.getRandomValues(new Uint8Array(16))) });
    const recarregat = await creaPart(parts.servidor, A, { identitat: parts.a.identitat, fals: parts.a.fals });
    await comprovaTancat({ a: recarregat, b: parts.b }, 'kid-no-quadra');
  });

  test('historia-incoherent: dues claus actives, o un kid repetit', async () => {
    const parts = await conversaInicial();
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    parts.servidor.claus.push({ ...parts.servidor.claus.find((f) => f.usuariId === B), kid: b64(nova.kid), sigPub: b64(nova.sigPub), dhPub: b64(nova.dhPub), declaracio: b64(nova.declaracio), autofirma: b64(nova.autofirma) });
    const recarregat = await creaPart(parts.servidor, A, { identitat: parts.a.identitat, fals: parts.a.fals });
    await comprovaTancat({ a: recarregat, b: parts.b }, 'historia-incoherent');

    const repetit = await conversaInicial();
    repetit.servidor.claus.push({ ...repetit.servidor.claus.find((f) => f.usuariId === B), retiradaAl: new Date(T0).toISOString() });
    const r = await creaPart(repetit.servidor, A, { identitat: repetit.a.identitat, fals: repetit.a.fals });
    await comprovaTancat({ a: r, b: repetit.b }, 'historia-incoherent');
  });
});

describe('alarma de la clau pròpia', () => {
  test('una clau nova del meu compte que no és d’este aparell: alarma, tot enviament llança i la lectura continua', async () => {
    const { servidor, a } = await conversaInicial();
    const intrusa = await creaIdentitat(cripto, { usuari: A, creatMs: T0 + 1 });
    servidor.publica(A, intrusa);
    expect(await a.servei.canvisDeClau(FIL)).toEqual({ pendents: [], suaus: [], alarmes: [{ tipus: 'clau-propia', kidActiu: b64(intrusa.kid) }] });
    const enviats = a.impl.enviaXifratXat.mock.calls.length;
    await expect(a.d.enviaMissatge(FIL, { id: ID3, text: 'x' })).rejects.toMatchObject({ codi: 'clau-propia-alarma', reintentable: false, encuable: false });
    await expect(a.d.enviaMissatge(FIL2, { id: ID4, text: 'y' })).rejects.toMatchObject({ codi: 'clau-propia-alarma' });
    expect(a.impl.enviaXifratXat.mock.calls.length).toBe(enviats);
    expect(await a.magatzem.safata(ci(A), actor(A))).toEqual([]);
    expect(textos(await a.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
    /* Abans el directori llançava i el fil queia sencer: ara, recarregat, la història s'obri. */
    const recarregat = await creaPart(servidor, A, { identitat: a.identitat, fals: a.fals });
    expect(textos(await recarregat.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
    expect((await recarregat.servei.canvisDeClau(FIL)).alarmes).toEqual([{ tipus: 'clau-propia', kidActiu: b64(intrusa.kid) }]);
  });

  test('la clau d’este aparell retirada al servidor i cap d’activa: també és alarma (kidActiu null) i no s’envia', async () => {
    const { servidor, a } = await conversaInicial();
    for (const f of servidor.claus) if (f.usuariId === A) f.retiradaAl = new Date(T0).toISOString();
    expect(await a.servei.canvisDeClau(FIL)).toEqual({ pendents: [], suaus: [], alarmes: [{ tipus: 'clau-propia', kidActiu: null }] });
    const enviats = a.impl.enviaXifratXat.mock.calls.length;
    await expect(a.d.enviaMissatge(FIL, { id: ID3, text: 'x' })).rejects.toMatchObject({ codi: 'clau-propia-alarma', encuable: false });
    expect(a.impl.enviaXifratXat.mock.calls.length).toBe(enviats);
    expect(textos(await a.d.loadMissatges(FIL))).toEqual(['Bon dia, veïna', 'Bon dia!']);
  });
});

/* §2.1.2 · La guarda mira els membres d'ara i els de qualsevol època vista: un grup on una
   persona que ja no hi és (C, membre de l'època 1) té un canvi fort pendent no s'escriu. */
describe('grup: pendent d’un membre d’una època antiga', () => {
  test('C ix del grup i canvia de clau sense continuïtat: A no hi pot escriure (clau-canviada-forta de C), cap època nova', async () => {
    const servidor = creaServidor({ ambGrup: true });
    const a = await creaPart(servidor, A);
    await creaPart(servidor, B);
    await creaPart(servidor, C);
    await a.d.enviaMissatge(GRUP, { id: ID1, text: 'Hola, grup' });
    expect(servidor.epoques.get(GRUP)[0].sobres.map((s) => s.receptor).sort()).toEqual([A, B, C].sort());
    servidor.grup.membres = servidor.grup.membres.filter((m) => m.usuari !== C);
    servidor.publica(C, await creaIdentitat(cripto, { usuari: C, creatMs: T0 + 1 }));
    const enviats = a.impl.enviaXifratXat.mock.calls.length;
    await expect(a.d.enviaMissatge(GRUP, { id: ID3, text: 'Ja sense C' })).rejects.toMatchObject({ codi: 'clau-canviada-forta', usuari: C, encuable: false });
    expect(a.impl.enviaXifratXat.mock.calls.length).toBe(enviats);
    expect(servidor.epoques.get(GRUP).map((e) => e.epoca)).toEqual([1]);
    expect(await a.magatzem.safata(ci(A), actor(A))).toEqual([]);
  });
});

describe('recompte de verificats (IDEA-48, risc obert del Llibre)', () => {
  test('només compta qui té activa exactament la clau verificada; deixa de comptar en publicar-ne una de nova, sense obrir cap fil', async () => {
    const { servidor, a, b } = await conversaInicial();
    const { kid } = await a.servei.numeroSeguretat(FIL);
    await a.servei.marcaVerificat(FIL, { kid, verificat: true });
    expect(await a.servei.contactesVerificats()).toBe(1);
    const clausAbans = a.impl.clausDeXat.mock.calls.length;
    servidor.publica(B, await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: b.identitat }));
    expect(await a.servei.contactesVerificats()).toBe(0);
    expect(a.impl.clausDeXat.mock.calls.length).toBe(clausAbans + 1);
    /* El recompte no escriu cap fixació. */
    expect(b64((await a.magatzem.fixacio(ci(A), B)).kid)).toBe(kid);
  });

  test('una fila activa amb el kid verificat però amb unes claus que no són les seues no compta', async () => {
    const { servidor, a } = await conversaInicial();
    const { kid } = await a.servei.numeroSeguretat(FIL);
    await a.servei.marcaVerificat(FIL, { kid, verificat: true });
    const altra = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    const fila = servidor.claus.find((f) => f.usuariId === B && !f.retiradaAl);
    fila.sigPub = b64(altra.sigPub);
    expect(await a.servei.contactesVerificats()).toBe(0);
  });

  test('dues files actives (la verificada i una altra sense retirar-la) no compten', async () => {
    const { servidor, a } = await conversaInicial();
    const { kid } = await a.servei.numeroSeguretat(FIL);
    await a.servei.marcaVerificat(FIL, { kid, verificat: true });
    expect(await a.servei.contactesVerificats()).toBe(1);
    const altra = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    servidor.claus.push({ usuariId: B, kid: b64(altra.kid), sigPub: b64(altra.sigPub), dhPub: b64(altra.dhPub), declaracio: b64(altra.declaracio), autofirma: b64(altra.autofirma), firmaContinuitat: null, retiradaAl: null });
    expect(await a.servei.contactesVerificats()).toBe(0);
  });

  /* Integrat del kit de Codex (b2_e2ee_shamir, codex-b2-claus.test.js, casos 2 i 3). */
  test('sense cap fila activa no compta; un transport que falla rebutja (mai una xifra vella); un canvi d’identitat a mig recompte ho descarta', async () => {
    const { servidor, a } = await conversaInicial();
    const { kid } = await a.servei.numeroSeguretat(FIL);
    await a.servei.marcaVerificat(FIL, { kid, verificat: true });
    expect(await a.servei.contactesVerificats({ tenantId: 't-1' })).toBe(1);
    expect(a.impl.clausDeXat.mock.calls.at(-1)).toEqual([[B], { tenantId: 't-1' }]);
    const original = a.impl.clausDeXat.getMockImplementation();
    a.impl.clausDeXat.mockImplementationOnce(async () => { throw new Error('xarxa'); });
    await expect(a.servei.contactesVerificats()).rejects.toThrow('xarxa');
    a.impl.clausDeXat.mockImplementationOnce(async (...args) => { a.servei.fixaAmbit(ambit(B), ci(B)); return original(...args); });
    await expect(a.servei.contactesVerificats()).rejects.toMatchObject({ name: 'AbortError', code: 'AMBIT_CANVIAT' });
    a.servei.fixaAmbit(ambit(A), ci(A));
    for (const f of servidor.claus) if (f.usuariId === B) f.retiradaAl = new Date(T0).toISOString();
    expect(await a.servei.contactesVerificats()).toBe(0);
  });
});

describe('servei sense motor', () => {
  test('sense magatzem de claus: canvisDeClau i acceptaCanviClau rebutgen amb sense-motor-xifrat i no toquen el transport', async () => {
    const impl = creaServidor().adaptadorDe(A);
    const d = ambXifratXat(impl, { actiu: true, isSecureContext: true, origen: ORIGEN, cripto, indexedDB: creaIdbFalsEstructurat() });
    const servei = serveiXifratXat(d);
    servei.fixaAmbit(ambit(A), ci(A));
    await expect(servei.canvisDeClau(FIL)).rejects.toMatchObject({ codi: 'sense-motor-xifrat' });
    await expect(servei.acceptaCanviClau(FIL, { usuari: B, kid: 'x' })).rejects.toMatchObject({ codi: 'sense-motor-xifrat' });
    expect(impl.loadFils).not.toHaveBeenCalled();
    expect(impl.clausDeXat).not.toHaveBeenCalled();
  });
});

/* El directori sol (sense pipeline): la primera línia de R1 i R2 és que ningú no pot segellar
   per a una clau pendent (`de` → null) i que `confirma` no la fixa mai; la guarda de prepara
   n'és la segona. */
describe('directoriAmbHistoria (B2a, §2.1.1)', () => {
  const fila = (identitat, extres = {}) => ({
    usuariId: identitat.usuari, kid: b64(identitat.kid), sigPub: b64(identitat.sigPub), dhPub: b64(identitat.dhPub),
    declaracio: b64(identitat.declaracio), autofirma: b64(identitat.autofirma),
    firmaContinuitat: identitat.firmaContinuitat ? b64(identitat.firmaContinuitat) : null, retiradaAl: null, ...extres
  });
  const retirada = { retiradaAl: new Date(T0).toISOString() };
  const magatzemAmb = (pin) => {
    const escrits = [];
    return { escrits, fixacio: async (c, u) => (u === pin?.usuari ? pin : null), fixa: async (c, f, o) => { escrits.push({ f, o }); return f; } };
  };
  const directori = async ({ jo, registres, usuaris, magatzem }) => directoriAmbHistoria({
    cripto, jo, registres, usuaris, magatzem, ci: ci(jo.usuari), ara: () => T0, exigix: () => {}
  });

  test('canvi fort: de(B) null, la història conserva la clau fixada amb les públiques, candidata = la nova, confirma no escriu res', async () => {
    const jo = await creaIdentitat(cripto, { usuari: A, creatMs: T0 });
    const vella = await creaIdentitat(cripto, { usuari: B, creatMs: T0 });
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    const magatzem = magatzemAmb({ usuari: B, kid: vella.kid, verificat: false, vistAl: T0 });
    const d = await directori({ jo, registres: [fila(jo), fila(vella, retirada), fila(nova)], usuaris: [A, B], magatzem });
    expect(d.de(B)).toBeNull();
    expect(b64(d.de(A).kid)).toBe(b64(jo.kid));
    expect(b64(d.historica(B, vella.kid).sigPub)).toBe(b64(vella.sigPub));
    expect(d.historica(B, nova.kid)).toBeNull();
    expect(b64(d.candidata(B).kid)).toBe(b64(nova.kid));
    expect(b64(d.candidata(B).dhPub)).toBe(b64(nova.dhPub));
    const p = d.canvis.pendents.get(B);
    expect(p).toMatchObject({ usuari: B, motiu: 'sense-continuitat', verificat: false });
    expect([b64(p.kidFixat), b64(p.kidNou)]).toEqual([b64(vella.kid), b64(nova.kid)]);
    expect(Object.isFrozen(p)).toBe(true);
    expect(typeof d.canvis.pendents.set).toBe('undefined');
    await d.confirma(new Set([A, B]));
    expect(magatzem.escrits).toEqual([]);
  });

  test('la fixada que el servidor ja no servix: fora-d-historia, i la història la pren d’una SDPE si n’hi ha', async () => {
    const jo = await creaIdentitat(cripto, { usuari: A, creatMs: T0 });
    const vella = await creaIdentitat(cripto, { usuari: B, creatMs: T0 });
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1 });
    const magatzem = magatzemAmb({ usuari: B, kid: vella.kid, verificat: true, vistAl: T0 });
    const declaracions = [{ autor: B, kidAutor: vella.kid, sigPubAutor: vella.sigPub, dhPubAutor: vella.dhPub, membres: [] }];
    const d = await directoriAmbHistoria({ cripto, jo, registres: [fila(jo), fila(nova)], usuaris: [A, B], magatzem, ci: ci(A), ara: () => T0, exigix: () => {}, declaracions });
    expect(d.de(B)).toBeNull();
    expect(d.canvis.pendents.get(B)).toMatchObject({ motiu: 'fora-d-historia', verificat: true });
    expect(b64(d.historica(B, vella.kid).sigPub)).toBe(b64(vella.sigPub));
  });

  test('canvi suau: de(B) és la clau nova, suaus el diu i confirma la fixa amb l’anterior', async () => {
    const jo = await creaIdentitat(cripto, { usuari: A, creatMs: T0 });
    const vella = await creaIdentitat(cripto, { usuari: B, creatMs: T0 });
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: vella });
    const magatzem = magatzemAmb({ usuari: B, kid: vella.kid, verificat: false, vistAl: T0 });
    const d = await directori({ jo, registres: [fila(jo), fila(vella, retirada), fila(nova)], usuaris: [A, B], magatzem });
    expect(b64(d.de(B).kid)).toBe(b64(nova.kid));
    expect(d.canvis.pendents.size).toBe(0);
    expect(d.canvis.suaus.map((x) => [x.usuari, b64(x.kidAnterior), b64(x.kidNou)])).toEqual([[B, b64(vella.kid), b64(nova.kid)]]);
    await d.confirma(new Set([B]));
    expect(magatzem.escrits.map(({ f, o }) => [b64(f.kid), b64(o.anterior)])).toEqual([[b64(nova.kid), b64(vella.kid)]]);
  });

  test('blindatge: una predecessora sense declaració amb unes públiques que no són del seu kid no entra mai a la història (kid-no-quadra)', async () => {
    const jo = await creaIdentitat(cripto, { usuari: A, creatMs: T0 });
    const vella = await creaIdentitat(cripto, { usuari: B, creatMs: T0 });
    const nova = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 1, anterior: vella });
    const falsa = await creaIdentitat(cripto, { usuari: B, creatMs: T0 + 2 });
    /* El servidor servix el kid vell amb les públiques d'una clau seua i signa la continuïtat amb ella. */
    const filaFalsa = { usuariId: B, kid: b64(vella.kid), sigPub: b64(falsa.sigPub), dhPub: b64(falsa.dhPub), declaracio: null, autofirma: null, firmaContinuitat: null, ...retirada };
    const firmaFalsa = await signa(cripto, falsa.sigPriv, nova.declaracio);
    const magatzem = magatzemAmb({ usuari: B, kid: nova.kid, verificat: false, vistAl: T0 });
    await expect(directori({ jo, registres: [fila(jo), filaFalsa, fila(nova, { firmaContinuitat: b64(firmaFalsa) })], usuaris: [A, B], magatzem }))
      .rejects.toMatchObject({ codi: 'kid-no-quadra' });
  });
});
