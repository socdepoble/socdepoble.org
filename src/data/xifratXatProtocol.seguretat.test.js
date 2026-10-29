// @vitest-environment node
/* La màquina d'estats del protocol `sdp-xat-v1` (P1-12 / IDEA-19, pas 7 de §16
   del disseny final: §4.3-§4.10 i §8.6; esmenes 261029 §3, §4, §6, §7, QA-S05 i
   QA-S06). WebCrypto de veres (el de Node) i cap doble de les primitives: el
   que es prova és la lògica de damunt. Es mira: la identitat i la continuïtat
   (suau, fort, manipulació, bifurcació); la cadena d'èpoques en directe, grup
   i entitat (ordre, prevHash, autoritzacions, kids fixats, IS-12, ckCommit);
   que un membre tret no pot derivar la CK nova; la recepció d'un missatge en
   l'ordre de §4.6.4 amb tot el que es pot manipular (capçalera, xifrat, AAD,
   franqueig, farciment, càrrega, firma), la repetició i la clau antiga; els
   adjunts; l'equip signat; el SAS amb compromís; la guarda d'àmbit (QA-E07);
   els panys (QA-S05); el sanejament (QA-S06); els sostres i els codis. Dades
   sintètiques; les claus es generen a cada execució. */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import DOMPurify from 'dompurify';
import {
  derivaClauAesHkdf, hmacSha256, obriBaseAClauHkdf, signa, uuid16, xifraAesGcm, derivaBitsHkdf, importaClauHkdf, segellaBase
} from './xifratXatCripto.js';
import * as F from './xifratXatFormats.js';
import * as P from './xifratXatProtocol.js';

const cripto = globalThis.crypto;
const { CODI, TIPUS_FIL, MOTIU_EPOCA, ROL_EPOCA, ROL_EQUIP } = P;
const T0 = Date.UTC(2026, 9, 29, 9);
const A = '0a0a0a0a-0000-4000-8000-00000000000a';
const B = '0b0b0b0b-0000-4000-8000-00000000000b';
const C = '0c0c0c0c-0000-4000-8000-00000000000c';
const X = '0d0d0d0d-0000-4000-8000-00000000000d';
const ORG = '0e0e0e0e-0000-4000-8000-00000000000e';
const FIL = 'f11f11f1-0000-4000-8000-000000000f11';
const FIL_G = 'f33f33f3-0000-4000-8000-000000000f33';
const FIL_E = 'f22f22f2-0000-4000-8000-000000000f22';
const ADJ = 'adadadad-0000-4000-8000-0000000000ad';

const bytes = (n) => cripto.getRandomValues(new Uint8Array(n));
const uuid = () => cripto.randomUUID();
const ambCodi = (codi) => expect.objectContaining({ codi });
const codiDe = (promesa) => promesa.then(() => 'ok', (error) => error.codi ?? error.name);
/* Una còpia amb el byte `i` capgirat. */
const muta = (dades, i = 0) => {
  const copia = Uint8Array.from(dades);
  copia[i] ^= 0x5a;
  return copia;
};
/* Un WebP mínim vàlid per a la miniatura (RIFF ‖ mida ‖ WEBP ‖ farciment). */
const webp = (n = 24) => {
  const w = new Uint8Array(n);
  w.set([0x52, 0x49, 0x46, 0x46, n - 8, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  return w;
};

const persona = (usuari, anterior = null) => P.creaIdentitat(cripto, { usuari, creatMs: T0, anterior });
async function directoriDe(...identitats) {
  const directori = P.creaDirectori(cripto);
  for (const identitat of identitats) await directori.fixa(P.publiquesDe(identitat));
  return directori;
}
const membres = (...llista) => llista.map(([usuari, rol = ROL_EPOCA.membre]) => ({ usuari, rol }));

/* Un directe entre a i b: a fa la gènesi i tots dos l'apliquen. */
async function muntaDirecte(a, b) {
  const directori = await directoriDe(a, b);
  const estats = { [a.usuari]: P.estatFilNou({ fil: FIL, tipusFil: TIPUS_FIL.directe }), [b.usuari]: P.estatFilNou({ fil: FIL, tipusFil: TIPUS_FIL.directe }) };
  const genesi = await P.creaEpoca(cripto, { estat: estats[a.usuari], jo: a, membres: membres([a.usuari], [b.usuari]), creatMs: T0, directori });
  for (const jo of [a, b]) await P.aplicaEpoca(cripto, { estat: estats[jo.usuari], jo, ...genesi, directori });
  return { directori, estats, genesi };
}

/* Un grup amb `admin` com a administradora i la resta com a membres, aplicat per tothom. */
async function muntaGrup(admin, ...resta) {
  const tots = [admin, ...resta];
  const directori = await directoriDe(...tots);
  const estats = Object.fromEntries(tots.map((jo) => [jo.usuari, P.estatFilNou({ fil: FIL_G, tipusFil: TIPUS_FIL.grup })]));
  const genesi = await P.creaEpoca(cripto, {
    estat: estats[admin.usuari], jo: admin, creatMs: T0, directori,
    membres: membres([admin.usuari, ROL_EPOCA.administradora], ...resta.map((jo) => [jo.usuari]))
  });
  for (const jo of tots) await P.aplicaEpoca(cripto, { estat: estats[jo.usuari], jo, ...genesi, directori });
  return { directori, estats, genesi, tots };
}

/* Un xat amb una entitat: O propietària, G gestora, V veí; l'equip v1 fixat per tots i la gènesi feta per O. */
async function muntaEntitat() {
  const [O, G, V] = await Promise.all([persona(A), persona(B), persona(C)]);
  const directori = await directoriDe(O, G, V);
  const equips = Object.fromEntries([O, G, V].map((jo) => [jo.usuari, P.estatEquipNou({ org: ORG })]));
  const v1 = await P.creaEquip(cripto, {
    estat: equips[O.usuari], jo: O, creatMs: T0, directori, membres: [{ usuari: O.usuari, rol: ROL_EQUIP.propietaria }, { usuari: G.usuari, rol: ROL_EQUIP.administradora }]
  });
  for (const jo of [O, G, V]) await P.aplicaEquip(cripto, { estat: equips[jo.usuari], ...v1, directori });
  const estats = Object.fromEntries([O, G, V].map((jo) => [jo.usuari, P.estatFilNou({ fil: FIL_E, tipusFil: TIPUS_FIL.entitat, interlocutor: V.usuari, equip: equips[jo.usuari] })]));
  const genesi = await P.creaEpoca(cripto, {
    estat: estats[O.usuari], jo: O, creatMs: T0, directori, refEquip: v1.hash, membres: membres([V.usuari], [O.usuari], [G.usuari])
  });
  for (const jo of [O, G, V]) await P.aplicaEpoca(cripto, { estat: estats[jo.usuari], jo, ...genesi, directori });
  return { O, G, V, directori, equips, estats, v1, genesi };
}

/* Un emissor deshonest: la mateixa construcció de §4.6.3 amb la CK de l'estat, però amb el que se li diga. */
async function xifraManual({ estat, jo, id, cos, firma = null, nfDelFranqueig = null, farcit = null }) {
  const cap = estat.cap;
  const nf = bytes(32);
  const carrega = F.construeixCarrega({ cos, nf, firma });
  const base = { fil: estat.fil, id, emissor: jo.usuari, kidEmissor: jo.kid, comOrg: null, epoca: cap.epoca, respostaA: null };
  const tf = await hmacSha256(cripto, nfDelFranqueig ?? nf, F.construeixEntradaFranqueig({ fil: estat.fil, id, emissor: jo.usuari, epoca: cap.epoca, carrega }));
  const capcalera = F.construeixCapcalera({ ...base, hashEpoca: cap.hash, tf });
  const mk = await derivaClauAesHkdf(cripto, cap.ck, uuid16(id), F.infoClauMissatge(await F.hashCapcalera(cripto, capcalera)), ['encrypt']);
  const { iv, xifrat } = await xifraAesGcm(cripto, mk, { dades: farcit ?? F.farceixCarrega(carrega), aad: capcalera });
  return { fil: estat.fil, id, emissor: jo.usuari, kid: jo.kid, comOrg: null, epoca: cap.epoca, respostaA: null, tf, iv, ct: xifrat };
}

/* Un autor deshonest: una època e = última + 1 signada de veres però amb el ckCommit que se li diga. */
async function creaEpocaManual({ estat, jo, llista, directori, ckCommit = null, motiu = MOTIU_EPOCA.rotacio }) {
  const epoca = (estat.ultima?.epoca ?? 0) + 1;
  const ck = bytes(32);
  const clauCk = await importaClauHkdf(cripto, ck);
  const compromis = ckCommit ?? await derivaBitsHkdf(cripto, clauCk, uuid16(estat.fil), F.infoCompromisEpoca(epoca), 32);
  const sobres = [];
  const entrades = [];
  for (const { usuari, rol } of llista) {
    const fixada = directori.de(usuari);
    const info = F.construeixInfoSobre({ fil: estat.fil, epoca, receptor: usuari, kidReceptor: fixada.kid, autor: jo.usuari, kidAutor: jo.kid });
    const { enc, ct } = await segellaBase(cripto, { pkR: fixada.dhPub, info, pt: ck });
    sobres.push({ receptor: usuari, kidReceptor: fixada.kid, enc, ct });
    entrades.push({ usuari, kid: fixada.kid, rol, envHash: await F.hashSobre(cripto, enc, ct) });
  }
  const declaracio = F.construeixEpoca({
    fil: estat.fil, epoca, tipusFil: estat.tipusFil, prevHash: estat.ultima?.hash ?? null, autor: jo.usuari, kidAutor: jo.kid, sigPubAutor: jo.sigPub,
    dhPubAutor: jo.dhPub, motiu, creatMs: T0, ckCommit: compromis, refEquip: null, membres: entrades
  });
  return { epoca, declaracio, firma: await signa(cripto, jo.sigPriv, declaracio), hash: await F.hashEpoca(cripto, declaracio), sobres };
}

/* El cripto de l'entorn amb un ganxo abans de cada mètode de subtle (per a canviar l'actor a mig vol). */
function criptoAmbGanxo(ganxo) {
  const s = cripto.subtle;
  const metodes = ['digest', 'importKey', 'exportKey', 'generateKey', 'deriveBits', 'deriveKey', 'encrypt', 'decrypt', 'sign', 'verify', 'unwrapKey'];
  const subtle = Object.fromEntries(metodes.map((metode) => [metode, (...args) => { ganxo(metode); return s[metode](...args); }]));
  return { subtle, getRandomValues: (dades) => cripto.getRandomValues(dades) };
}

/* Un navigator.locks de mentida: una cua per nom, i el registre de les peticions en l'ordre d'arribada. */
function locksFals() {
  const cues = new Map();
  const registre = [];
  return {
    registre,
    request(nom, cb) {
      registre.push(nom);
      const anterior = cues.get(nom) ?? Promise.resolve();
      const propi = anterior.then(() => cb({ name: nom, mode: 'exclusive' }));
      cues.set(nom, propi.catch(() => undefined));
      return propi;
    }
  };
}

const esperaTorns = async (n = 5) => {
  for (let i = 0; i < n; i += 1) await new Promise((resol) => setImmediate(resol));
};

describe('l’entorn i la frontera', () => {
  test('hi ha WebCrypto complet', () => {
    expect(typeof cripto?.subtle?.unwrapKey).toBe('function');
  });

  test('el mòdul no pren cap global, només importa cripto, formats i el contracte dels adjunts, i cita el disseny i les esmenes', () => {
    const font = readFileSync(new URL('./xifratXatProtocol.js', import.meta.url), 'utf8');
    expect(font).not.toMatch(/globalThis|window\.|Math\.random/);
    expect([...font.matchAll(/^import .*?from '([^']+)';$/gms)].map((m) => m[1]).sort()).toEqual(['./xatMultimedia.js', './xifratXatCripto.js', './xifratXatFormats.js']);
    for (const cita of ['§4', '§8.6', 'esmenes', 'QA-E07', 'QA-S01', 'QA-S03', 'QA-S04', 'QA-S05', 'QA-S06']) expect(font).toContain(cita);
    const prova = readFileSync(new URL(import.meta.url), 'utf8');
    for (const text of [font, prova]) expect(text.toLowerCase()).not.toContain(`mas${'ia'}`);
  });

  test('els codis són estables, únics i en minúscules amb guions; errorProtocol només n’accepta un de CODI', () => {
    const valors = Object.values(CODI);
    expect(new Set(valors).size).toBe(valors.length);
    for (const valor of valors) expect(valor).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
    expect(CODI.ambitCanviat).toBe('ambit-canviat');
    expect(Object.isFrozen(CODI)).toBe(true);
    const error = P.errorProtocol(CODI.repeticio, 'x', new Error('causa'));
    expect(error.codi).toBe('repeticio');
    expect(error.cause.message).toBe('causa');
    expect(P.esErrorProtocol(error)).toBe(true);
    expect(P.esErrorProtocol(new Error('x'))).toBe(false);
    expect(() => P.errorProtocol('INVENTAT', 'x')).toThrow(TypeError);
  });
});

describe('identitat i continuïtat (§4.3, §4.4)', () => {
  test('una identitat nova: kid de les claus, SDPK autofirmada, públiques fixables', async () => {
    const a = await persona(A);
    expect(a.kid.length).toBe(16);
    expect(await F.kidQuadra(cripto, { usuari: A, kid: a.kid, sigPub: a.sigPub, dhPub: a.dhPub })).toBe(true);
    expect(a.sigPriv.extractable).toBe(false);
    expect(a.dhPriv.extractable).toBe(false);
    const v = await P.verificaDeclaracioClau(cripto, { declaracio: a.declaracio, autofirma: a.autofirma, kidServit: a.kid });
    expect(v.canvi).toBe(P.CANVI_CLAU.nova);
    expect(v.valors.kidAnterior).toBeNull();
    expect(await codiDe(P.verificaDeclaracioClau(cripto, { declaracio: a.declaracio, autofirma: muta(a.autofirma) }))).toBe(CODI.firmaInvalida);
    expect(await codiDe(P.verificaDeclaracioClau(cripto, { declaracio: a.declaracio, autofirma: a.autofirma, kidServit: muta(a.kid) }))).toBe(CODI.kidNoQuadra);
    expect(await codiDe(P.verificaDeclaracioClau(cripto, { declaracio: muta(a.declaracio, 2), autofirma: a.autofirma }))).toBe(CODI.declaracioInvalida);
  });

  test('canvi de clau: igual, suau amb continuïtat de la fixada, fort sense, fort si verificat o dins dels 7 dies', async () => {
    const vella = await persona(A);
    const nova = await persona(A, vella);
    const fixada = { ...P.publiquesDe(vella), verificat: false };
    expect((await P.verificaDeclaracioClau(cripto, { declaracio: vella.declaracio, autofirma: vella.autofirma, fixada })).canvi).toBe('igual');
    const suau = await P.verificaDeclaracioClau(cripto, { declaracio: nova.declaracio, autofirma: nova.autofirma, firmaContinuitat: nova.firmaContinuitat, fixada });
    expect(suau).toMatchObject({ canvi: 'suau', continuitat: true });
    expect((await P.verificaDeclaracioClau(cripto, { declaracio: nova.declaracio, autofirma: nova.autofirma, fixada })).canvi).toBe('fort');
    const altra = await persona(A);
    expect((await P.verificaDeclaracioClau(cripto, {
      declaracio: nova.declaracio, autofirma: nova.autofirma, firmaContinuitat: nova.firmaContinuitat, fixada: { ...P.publiquesDe(altra), verificat: false }
    })).canvi).toBe('fort');
    expect((await P.verificaDeclaracioClau(cripto, {
      declaracio: nova.declaracio, autofirma: nova.autofirma, firmaContinuitat: nova.firmaContinuitat, fixada: { ...fixada, verificat: true }
    })).canvi).toBe('fort');
    const dins = { ara: T0, alertaRecuperacioMs: T0 - P.FINESTRA_RECUPERACIO_MS + 1000 };
    const fora = { ara: T0, alertaRecuperacioMs: T0 - P.FINESTRA_RECUPERACIO_MS };
    expect((await P.verificaDeclaracioClau(cripto, { declaracio: nova.declaracio, autofirma: nova.autofirma, firmaContinuitat: nova.firmaContinuitat, fixada, ...dins })).canvi).toBe('fort');
    expect((await P.verificaDeclaracioClau(cripto, { declaracio: nova.declaracio, autofirma: nova.autofirma, firmaContinuitat: nova.firmaContinuitat, fixada, ...fora })).canvi).toBe('suau');
    await expect(persona(B, vella)).rejects.toThrow(TypeError);
  });

  test('bifurcació: dos SDPK diferents amb el mateix kidAnterior no nul; dos reinicis sense continuïtat no ho són', async () => {
    const vella = await persona(A);
    const [n1, n2, r1, r2] = await Promise.all([persona(A, vella), persona(A, vella), persona(A), persona(A)]);
    expect(P.exigixSenseBifurcacio([vella.declaracio, n1.declaracio, n1.declaracio, r1.declaracio, r2.declaracio])).toBe(5);
    expect(() => P.exigixSenseBifurcacio([n1.declaracio, n2.declaracio])).toThrow(ambCodi(CODI.bifurcacio));
    expect(() => P.exigixSenseBifurcacio([muta(n1.declaracio)])).toThrow(ambCodi(CODI.declaracioInvalida));
  });

  test('el directori fixa amb el kid recalculat i no deixa canviar de clau sense acceptar-ho', async () => {
    const [a, a2] = await Promise.all([persona(A), persona(A)]);
    const directori = P.creaDirectori(cripto);
    await directori.fixa(P.publiquesDe(a));
    expect(directori.de(A).kid).toEqual(a.kid);
    await expect(directori.fixa({ ...P.publiquesDe(a), kid: muta(a.kid) })).rejects.toThrow(ambCodi(CODI.kidNoQuadra));
    await expect(directori.fixa(P.publiquesDe(a2))).rejects.toThrow(ambCodi(CODI.kidNoFixat));
    await directori.fixa(P.publiquesDe(a2), { substituix: true });
    expect(directori.de(A).kid).toEqual(a2.kid);
    expect(directori.de(B)).toBeNull();
  });
});

describe('èpoques i missatges en un directe (§4.5, §4.6)', () => {
  test('gènesi aplicada pels dos, anada i tornada, i la fila va sense text', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const { directori, estats, genesi } = await muntaDirecte(a, b);
    expect(genesi.epoca).toBe(1);
    expect(genesi.sobres.map((s) => s.receptor).sort()).toEqual([A, B]);
    expect(estats[A].cap.ck).not.toBeNull();
    expect(estats[B].cap.hash).toEqual(genesi.hash);
    const id = uuid();
    const fila = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id, contingut: { t: 'Bon dia, veïna' } });
    expect(fila).not.toHaveProperty('text');
    expect(F.esMidaXifratMissatge(fila.ct.length)).toBe(true);
    const obert = await P.obriMissatge(cripto, { estat: estats[B], fila, directori });
    expect(obert).toMatchObject({ id, emissor: A, epoca: 1, firmada: false, clauAntiga: false, contingut: { t: 'Bon dia, veïna', a: null, mini: null } });
    const resposta = await P.xifraMissatge(cripto, { estat: estats[B], jo: b, id: uuid(), contingut: { t: 'Bon dia!' }, respostaA: id });
    expect((await P.obriMissatge(cripto, { estat: estats[A], fila: resposta, directori })).contingut.t).toBe('Bon dia!');
    expect(await codiDe(P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'x' }, comOrg: ORG }))).toBe(CODI.filaInvalida);
    expect(await codiDe(P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: '' } }))).toBe(CODI.contingutInvalid);
  });

  test('el que es manipula es rebutja amb el seu codi, i l’id no es marca com a vist', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const { directori, estats } = await muntaDirecte(a, b);
    const fila = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'secret' } });
    const obri = (canvis) => codiDe(P.obriMissatge(cripto, { estat: estats[B], fila: { ...fila, ...canvis }, directori }));
    expect(await obri({ ct: muta(fila.ct, 40) })).toBe(CODI.xifratManipulat);
    expect(await obri({ iv: muta(fila.iv) })).toBe(CODI.xifratManipulat);
    expect(await obri({ tf: muta(fila.tf) })).toBe(CODI.xifratManipulat);
    expect(await obri({ respostaA: uuid() })).toBe(CODI.xifratManipulat);
    expect(await obri({ id: uuid() })).toBe(CODI.xifratManipulat);
    expect(await obri({ emissor: B, kid: b.kid })).toBe(CODI.xifratManipulat);
    expect(await obri({ kid: muta(fila.kid) })).toBe(CODI.kidNoQuadra);
    expect(await obri({ epoca: 2 })).toBe(CODI.epocaDesconeguda);
    expect(await obri({ fil: FIL_G })).toBe(CODI.filaInvalida);
    expect(await obri({ ct: fila.ct.subarray(1) })).toBe(CODI.filaInvalida);
    expect(await obri({ comOrg: ORG })).toBe(CODI.filaInvalida);
    expect(estats[B].vistos.size).toBe(0);
    expect(await obri({})).toBe('ok');
    expect(await obri({})).toBe(CODI.repeticio);
  });

  test('un emissor deshonest: franqueig que no casa, farciment no canònic, càrrega trencada', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const { directori, estats } = await muntaDirecte(a, b);
    const cos = F.construeixCos({ t: 'hola' });
    const obri = (fila) => codiDe(P.obriMissatge(cripto, { estat: estats[B], fila, directori }));
    expect(await obri(await xifraManual({ estat: estats[A], jo: a, id: uuid(), cos }))).toBe('ok');
    expect(await obri(await xifraManual({ estat: estats[A], jo: a, id: uuid(), cos, nfDelFranqueig: bytes(32) }))).toBe(CODI.franqueigInvalid);
    const carrega = F.construeixCarrega({ cos, nf: bytes(32) });
    const senseMarcador = new Uint8Array(256);
    senseMarcador.set(carrega);
    senseMarcador[carrega.length] = 0x7f;
    expect(await obri(await xifraManual({ estat: estats[A], jo: a, id: uuid(), cos, farcit: senseMarcador }))).toBe(CODI.farcimentInvalid);
    const trencada = Uint8Array.from(carrega);
    trencada[0] = 0x02;
    const farcitTrencat = new Uint8Array(256);
    farcitTrencat.set(trencada);
    farcitTrencat[trencada.length] = 0x80;
    expect(await obri(await xifraManual({ estat: estats[A], jo: a, id: uuid(), cos, farcit: farcitTrencat }))).toBe(CODI.carregaInvalida);
  });

  test('rotació en un directe: els dos membres no canvien; la clau antiga es marca; l’ordre de la cadena és estricte', async () => {
    const [a, b, c] = await Promise.all([persona(A), persona(B), persona(C)]);
    const { directori, estats } = await muntaDirecte(a, b);
    await directori.fixa(P.publiquesDe(c));
    const vella = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'd’abans' } });
    // Un directe sempre té dos membres (ho fixa el format): canviar B per C és el que la cadena no deixa fer.
    const ambC = await P.creaEpoca(cripto, { estat: estats[A], jo: a, motiu: MOTIU_EPOCA.alta, membres: membres([A], [C]), creatMs: T0, directori });
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[B], jo: b, ...ambC, directori }))).toBe(CODI.membresImmutables);
    // Marcada com a saltada (IS-12): la següent l'ha de superar.
    expect(estats[B].ultima).toMatchObject({ epoca: 2, saltada: true });
    expect(estats[B].cap.epoca).toBe(1);
    await expect(P.aplicaEpoca(cripto, { estat: estats[A], jo: a, ...ambC, directori })).rejects.toThrow(ambCodi(CODI.membresImmutables));
    const e3 = await P.creaEpoca(cripto, { estat: estats[A], jo: a, motiu: MOTIU_EPOCA.rotacio, membres: membres([A], [B]), creatMs: T0, directori });
    expect(e3.epoca).toBe(3);
    expect(e3.hash).not.toEqual(ambC.hash);
    await P.aplicaEpoca(cripto, { estat: estats[A], jo: a, ...e3, directori });
    const e4 = await P.creaEpoca(cripto, { estat: estats[A], jo: a, motiu: MOTIU_EPOCA.rotacio, membres: membres([A], [B]), creatMs: T0, directori });
    await P.aplicaEpoca(cripto, { estat: estats[A], jo: a, ...e4, directori });
    // B: la 4 abans de la 3 és fora d'ordre i no marca res; després, 3 i 4 entren.
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[B], jo: b, ...e4, directori }))).toBe(CODI.epocaForaDOrdre);
    expect(estats[B].ultima.epoca).toBe(2);
    await P.aplicaEpoca(cripto, { estat: estats[B], jo: b, ...e3, directori });
    await P.aplicaEpoca(cripto, { estat: estats[B], jo: b, ...e4, directori });
    expect(estats[B].cap.epoca).toBe(4);
    expect(estats[B].cap.valors.prevHash).toEqual(e3.hash);
    const nova = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'd’ara' } });
    expect((await P.obriMissatge(cripto, { estat: estats[B], fila: nova, directori })).clauAntiga).toBe(false);
    expect((await P.obriMissatge(cripto, { estat: estats[B], fila: vella, directori })).clauAntiga).toBe(true);
    // Una gènesi repetida al mateix fil o un fil altre no encadenen.
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[B], jo: b, ...e3, directori }))).toBe(CODI.epocaForaDOrdre);
    const altre = P.estatFilNou({ fil: FIL_G, tipusFil: TIPUS_FIL.directe });
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: altre, jo: b, ...e3, directori }))).toBe(CODI.declaracioInvalida);
  });

  test('el sobre: absent, manipulat, d’una altra persona; el ckCommit que no casa (CS-25)', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const { directori, estats } = await muntaDirecte(a, b);
    const e2 = await P.creaEpoca(cripto, { estat: estats[A], jo: a, motiu: MOTIU_EPOCA.rotacio, membres: membres([A], [B]), creatMs: T0, directori });
    const fresc = () => {
      const estat = P.estatFilNou({ fil: FIL, tipusFil: TIPUS_FIL.directe });
      Object.assign(estat, { cap: estats[B].cap, ultima: estats[B].ultima, epoques: new Map(estats[B].epoques) });
      return estat;
    };
    const aplica = (sobres) => codiDe(P.aplicaEpoca(cripto, { estat: fresc(), jo: b, ...e2, sobres, directori }));
    const meu = e2.sobres.find((s) => s.receptor === B);
    const seu = e2.sobres.find((s) => s.receptor === A);
    expect(await aplica(e2.sobres.filter((s) => s.receptor !== B))).toBe(CODI.sobreAbsent);
    expect(await aplica([{ ...meu, ct: muta(meu.ct) }])).toBe(CODI.sobreInvalid);
    expect(await aplica([{ ...seu, receptor: B }])).toBe(CODI.sobreInvalid);
    expect(await aplica(undefined)).toBe(CODI.sobreAbsent);
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: fresc(), jo: b, ...e2, firma: muta(e2.firma), directori }))).toBe(CODI.firmaInvalida);
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: fresc(), jo: b, ...e2, declaracio: muta(e2.declaracio, 2), directori }))).toBe(CODI.declaracioInvalida);
    expect(await aplica(e2.sobres)).toBe('ok');
    const dolenta = await creaEpocaManual({ estat: estats[A], jo: a, llista: membres([A], [B]), directori, ckCommit: bytes(32) });
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: fresc(), jo: b, ...dolenta, directori }))).toBe(CODI.compromisInvalid);
    // Un sobre d'A no s'obri amb la clau de B, ni al nivell de la primitiva.
    const info = F.construeixInfoSobre({ fil: FIL, epoca: 2, receptor: A, kidReceptor: a.kid, autor: A, kidAutor: a.kid });
    await expect(obriBaseAClauHkdf(cripto, { skR: b.dhPriv, pkR: b.dhPub, enc: seu.enc, info, ct: seu.ct })).rejects.toThrow(ambCodi('SOBRE_INVALID'));
  });
});

describe('grups (§4.9): rotació, autoritzacions i IS-12', () => {
  test('anada i tornada signada; baixa de C: C no deriva la CK nova ni llig l’època nova', async () => {
    const [a, b, c] = await Promise.all([persona(A), persona(B), persona(C)]);
    const { directori, estats } = await muntaGrup(a, b, c);
    const fila = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'per a tots' } });
    for (const jo of [b, c]) expect(await P.obriMissatge(cripto, { estat: estats[jo.usuari], fila, directori })).toMatchObject({ firmada: true, contingut: { t: 'per a tots' } });
    const senseC = await P.creaEpoca(cripto, { estat: estats[A], jo: a, motiu: MOTIU_EPOCA.baixa, membres: membres([A, ROL_EPOCA.administradora], [B]), creatMs: T0, directori });
    expect(senseC.sobres.some((s) => s.receptor === C)).toBe(false);
    for (const jo of [a, b]) expect(await P.aplicaEpoca(cripto, { estat: estats[jo.usuari], jo, ...senseC, directori })).toMatchObject({ epoca: 2, membre: true });
    expect(await P.aplicaEpoca(cripto, { estat: estats[C], jo: c, ...senseC, directori })).toMatchObject({ epoca: 2, membre: false });
    expect(estats[C].cap.ck).toBeNull();
    expect(estats[C].epoques.get(1).ck).not.toBeNull();
    const nova = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'ja sense C' } });
    expect((await P.obriMissatge(cripto, { estat: estats[B], fila: nova, directori })).contingut.t).toBe('ja sense C');
    expect(await codiDe(P.obriMissatge(cripto, { estat: estats[C], fila: nova, directori }))).toBe(CODI.epocaDesconeguda);
    expect(await codiDe(P.xifraMissatge(cripto, { estat: estats[C], jo: c, id: uuid(), contingut: { t: 'encara hi sóc?' } }))).toBe(CODI.senseEpoca);
    // Un sobre d'un altre membre, reetiquetat per a C, no s'obri amb la clau de C.
    const info = F.construeixInfoSobre({ fil: FIL_G, epoca: 2, receptor: C, kidReceptor: c.kid, autor: A, kidAutor: a.kid });
    const deB = senseC.sobres.find((s) => s.receptor === B);
    await expect(obriBaseAClauHkdf(cripto, { skR: c.dhPriv, pkR: c.dhPub, enc: deB.enc, info, ct: deB.ct })).rejects.toThrow(ambCodi('SOBRE_INVALID'));
  });

  test('qui pot què: un membre no dona altes ni canvia administradores, però sí que depura; firma d’un altre o absent', async () => {
    const [a, b, c, x] = await Promise.all([persona(A), persona(B), persona(C), persona(X)]);
    const { directori, estats } = await muntaGrup(a, b, c);
    await directori.fixa(P.publiquesDe(x));
    const altaPerB = await P.creaEpoca(cripto, { estat: estats[B], jo: b, motiu: MOTIU_EPOCA.alta, membres: membres([A, ROL_EPOCA.administradora], [B], [C], [X]), creatMs: T0, directori });
    // Tampoc el mateix B pot aplicar-se-la: la 2 queda saltada a A i a B (IS-12), i la següent de B és la 3.
    for (const jo of [a, b]) expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[jo.usuari], jo, ...altaPerB, directori }))).toBe(CODI.autorNoAutoritzat);
    const ascensPerB = await P.creaEpoca(cripto, { estat: estats[B], jo: b, motiu: MOTIU_EPOCA.administradores, membres: membres([A, ROL_EPOCA.administradora], [B, ROL_EPOCA.administradora], [C]), creatMs: T0, directori });
    expect(ascensPerB.epoca).toBe(3);
    // A C, que no ha vist la 2, la 3 és fora d'ordre i no marca res.
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[C], jo: c, ...ascensPerB, directori }))).toBe(CODI.epocaForaDOrdre);
    expect(estats[C].ultima.epoca).toBe(1);
    for (const jo of [a, b]) expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[jo.usuari], jo, ...ascensPerB, directori }))).toBe(CODI.autorNoAutoritzat);
    const depuracioPerB = await P.creaEpoca(cripto, { estat: estats[B], jo: b, motiu: MOTIU_EPOCA.depuracio, membres: membres([A, ROL_EPOCA.administradora], [B]), creatMs: T0, directori });
    for (const jo of [a, b]) expect(await P.aplicaEpoca(cripto, { estat: estats[jo.usuari], jo, ...depuracioPerB, directori })).toMatchObject({ epoca: 4, membre: true });
    // Un no membre no pot obrir cap època (ni l'autor que no era de l'última vàlida).
    const estatX = P.estatFilNou({ fil: FIL_G, tipusFil: TIPUS_FIL.grup });
    const perX = await P.creaEpoca(cripto, { estat: estatX, jo: x, membres: membres([X, ROL_EPOCA.administradora], [A]), creatMs: T0, directori });
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: P.estatFilNou({ fil: FIL_G, tipusFil: TIPUS_FIL.grup }), jo: a, ...perX, directori }))).toBe('ok');
    await P.aplicaEpoca(cripto, { estat: estatX, jo: x, ...perX, directori });
    // Firmes de missatge: amb una clau que no és la fixada, o cap firma en un grup.
    const impostor = await persona(B);
    const malSignat = await P.xifraMissatge(cripto, { estat: estats[B], jo: { ...b, sigPriv: impostor.sigPriv }, id: uuid(), contingut: { t: 'sóc B' } });
    expect(await codiDe(P.obriMissatge(cripto, { estat: estats[C], fila: { ...malSignat, epoca: 1 }, directori }))).toBe(CODI.xifratManipulat);
    expect(estats[C].cap.epoca).toBe(1);
    const malSignatE1 = await P.xifraMissatge(cripto, { estat: estats[C], jo: { ...c, sigPriv: impostor.sigPriv }, id: uuid(), contingut: { t: 'sóc C' } });
    expect(await codiDe(P.obriMissatge(cripto, { estat: estats[A], fila: malSignatE1, directori }))).toBe(CODI.firmaInvalida);
    const senseFirma = await xifraManual({ estat: estats[C], jo: c, id: uuid(), cos: F.construeixCos({ t: 'sense firma' }) });
    expect(await codiDe(P.obriMissatge(cripto, { estat: estats[A], fila: senseFirma, directori }))).toBe(CODI.firmaInvalida);
    expect(estats[A].vistos.size).toBe(0);
  });

  test('IS-12: una època amb la firma trencada es salta i la següent la supera; un kid no fixat també es rebutja', async () => {
    const [a, b, c] = await Promise.all([persona(A), persona(B), persona(C)]);
    const { directori, estats } = await muntaGrup(a, b, c);
    const e2 = await P.creaEpoca(cripto, { estat: estats[A], jo: a, motiu: MOTIU_EPOCA.rotacio, membres: membres([A, ROL_EPOCA.administradora], [B], [C]), creatMs: T0, directori });
    await P.aplicaEpoca(cripto, { estat: estats[A], jo: a, ...e2, directori });
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[B], jo: b, ...e2, firma: muta(e2.firma), directori }))).toBe(CODI.firmaInvalida);
    expect(estats[B].ultima).toEqual({ epoca: 2, hash: e2.hash, saltada: true });
    expect(estats[B].epoques.has(2)).toBe(false);
    const e3 = await P.creaEpoca(cripto, { estat: estats[A], jo: a, motiu: MOTIU_EPOCA.rotacio, membres: membres([A, ROL_EPOCA.administradora], [B], [C]), creatMs: T0, directori });
    expect(e3.epoca).toBe(3);
    await P.aplicaEpoca(cripto, { estat: estats[A], jo: a, ...e3, directori });
    expect(await P.aplicaEpoca(cripto, { estat: estats[B], jo: b, ...e3, directori })).toMatchObject({ epoca: 3, membre: true });
    const fila = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'a la 3' } });
    expect((await P.obriMissatge(cripto, { estat: estats[B], fila, directori })).contingut.t).toBe('a la 3');
    // C ha fixat una altra clau per a B: l'època que llista el kid de B no val per a C (§4.5.3.4).
    const directoriC = await directoriDe(a, c, await persona(B));
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[C], jo: c, ...e2, directori: directoriC }))).toBe(CODI.kidNoFixat);
    expect(estats[C].ultima.saltada).toBe(true);
  });

  test('sostres: més de 256 membres d’època o 64 d’equip es rebutgen abans de cap criptografia; membres repetits també', async () => {
    const a = await persona(A);
    const directori = await directoriDe(a);
    const estat = P.estatFilNou({ fil: FIL_G, tipusFil: TIPUS_FIL.grup });
    const molts = Array.from({ length: P.MAX_MEMBRES_EPOCA + 1 }, () => ({ usuari: uuid(), rol: ROL_EPOCA.membre }));
    await expect(P.creaEpoca(cripto, { estat, jo: a, membres: molts, creatMs: T0, directori })).rejects.toThrow(ambCodi(CODI.massaMembres));
    await expect(P.creaEpoca(cripto, { estat, jo: a, membres: membres([A, 1], [A, 1]), creatMs: T0, directori })).rejects.toThrow(ambCodi(CODI.membresInvalids));
    await expect(P.creaEpoca(cripto, { estat, jo: a, membres: membres([B, 1]), creatMs: T0, directori })).rejects.toThrow(ambCodi(CODI.kidNoFixat));
    const equip = P.estatEquipNou({ org: ORG });
    const massa = Array.from({ length: P.MAX_MEMBRES_EQUIP + 1 }, () => ({ usuari: uuid(), rol: ROL_EQUIP.administradora }));
    await expect(P.creaEquip(cripto, { estat: equip, jo: a, membres: massa, creatMs: T0, directori })).rejects.toThrow(ambCodi(CODI.massaMembres));
    expect(P.MAX_MEMBRES_EPOCA).toBe(256);
    expect(P.MAX_MEMBRES_EQUIP).toBe(64);
  });
});

describe('entitats: equip signat (§4.8) i fil amb interlocutor', () => {
  test('anada i tornada amb comOrg; l’equip fixat per TOFU; només una propietària avança la versió', async () => {
    const { O, G, V, directori, equips, estats, v1 } = await muntaEntitat();
    expect(v1.versio).toBe(1);
    expect(equips[V.usuari].cap.membres.get(G.usuari).rol).toBe(ROL_EQUIP.administradora);
    const deO = await P.xifraMissatge(cripto, { estat: estats[O.usuari], jo: O, id: uuid(), contingut: { t: 'Hola, en nom de l’entitat' }, comOrg: ORG });
    expect(await P.obriMissatge(cripto, { estat: estats[V.usuari], fila: deO, directori })).toMatchObject({ comOrg: ORG, firmada: true });
    const deV = await P.xifraMissatge(cripto, { estat: estats[V.usuari], jo: V, id: uuid(), contingut: { t: 'Hola!' } });
    for (const jo of [O, G]) expect((await P.obriMissatge(cripto, { estat: estats[jo.usuari], fila: deV, directori })).contingut.t).toBe('Hola!');
    expect(await codiDe(P.xifraMissatge(cripto, { estat: estats[G.usuari], jo: G, id: uuid(), contingut: { t: 'x' } }))).toBe(CODI.filaInvalida);
    expect(await codiDe(P.xifraMissatge(cripto, { estat: estats[V.usuari], jo: V, id: uuid(), contingut: { t: 'x' }, comOrg: ORG }))).toBe(CODI.filaInvalida);
    expect(await codiDe(P.obriMissatge(cripto, { estat: estats[V.usuari], fila: { ...deO, comOrg: null }, directori }))).toBe(CODI.filaInvalida);
    // Versió 2 signada per la gestora: no és propietària de la v1.
    const x = await persona(X);
    await directori.fixa(P.publiquesDe(x));
    const v2PerG = await P.creaEquip(cripto, {
      estat: equips[G.usuari], jo: G, creatMs: T0, directori,
      membres: [{ usuari: O.usuari, rol: ROL_EQUIP.propietaria }, { usuari: G.usuari, rol: ROL_EQUIP.administradora }, { usuari: X, rol: ROL_EQUIP.administradora }]
    });
    expect(await codiDe(P.aplicaEquip(cripto, { estat: equips[V.usuari], ...v2PerG, directori }))).toBe(CODI.autorNoAutoritzat);
    const v2 = await P.creaEquip(cripto, {
      estat: equips[O.usuari], jo: O, creatMs: T0, directori,
      membres: [{ usuari: O.usuari, rol: ROL_EQUIP.propietaria }, { usuari: G.usuari, rol: ROL_EQUIP.administradora }, { usuari: X, rol: ROL_EQUIP.administradora }]
    });
    expect(v2.versio).toBe(2);
    expect(await codiDe(P.aplicaEquip(cripto, { estat: equips[V.usuari], ...v2, firma: muta(v2.firma), directori }))).toBe(CODI.firmaInvalida);
    expect(await codiDe(P.aplicaEquip(cripto, { estat: equips[V.usuari], ...v1, directori }))).toBe(CODI.versioForaDOrdre);
    for (const jo of [O, G, V]) await P.aplicaEquip(cripto, { estat: equips[jo.usuari], ...v2, directori });
    expect(equips[V.usuari].cap.versio).toBe(2);
    expect(equips[V.usuari].cap.valors.prevHash).toEqual(v1.hash);
    // L'època que cita la v2 i inclou X entra; la que cita la v1 ja no.
    const ambX = await P.creaEpoca(cripto, { estat: estats[O.usuari], jo: O, motiu: MOTIU_EPOCA.equip, refEquip: v2.hash, membres: membres([V.usuari], [O.usuari], [G.usuari], [X]), creatMs: T0, directori });
    expect(await P.aplicaEpoca(cripto, { estat: estats[V.usuari], jo: V, ...ambX, directori })).toMatchObject({ epoca: 2, membre: true });
    const estatX = P.estatFilNou({ fil: FIL_E, tipusFil: TIPUS_FIL.entitat, interlocutor: V.usuari, equip: equips[V.usuari] });
    // X no té la 1: fora d'ordre fins que no la tinga (i la 1 no li dona cap CK).
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estatX, jo: x, ...ambX, directori }))).toBe(CODI.epocaForaDOrdre);
  });

  test('membres fora de l’equip signat o un refEquip que no és el vigent es rebutgen; l’estat del fil exigix interlocutor i equip', async () => {
    const { O, V, directori, estats } = await muntaEntitat();
    const x = await persona(X);
    await directori.fixa(P.publiquesDe(x));
    const fantasma = await P.creaEpoca(cripto, { estat: estats[O.usuari], jo: O, motiu: MOTIU_EPOCA.alta, refEquip: estats[O.usuari].equip.cap.hash, membres: membres([V.usuari], [O.usuari], [X]), creatMs: T0, directori });
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[V.usuari], jo: V, ...fantasma, directori }))).toBe(CODI.membreForaDEquip);
    await P.aplicaEpoca(cripto, { estat: estats[O.usuari], jo: O, ...fantasma, directori }).catch(() => undefined);
    const refDolent = await P.creaEpoca(cripto, { estat: estats[O.usuari], jo: O, motiu: MOTIU_EPOCA.rotacio, refEquip: bytes(32), membres: membres([V.usuari], [O.usuari]), creatMs: T0, directori });
    expect(await codiDe(P.aplicaEpoca(cripto, { estat: estats[V.usuari], jo: V, ...refDolent, directori }))).toBe(CODI.equipNoVigent);
    expect(() => P.estatFilNou({ fil: FIL_E, tipusFil: TIPUS_FIL.entitat })).toThrow(TypeError);
    expect(() => P.estatFilNou({ fil: FIL, tipusFil: TIPUS_FIL.directe, interlocutor: V.usuari })).toThrow(TypeError);
    expect(() => P.estatFilNou({ fil: FIL, tipusFil: 7 })).toThrow(TypeError);
  });
});

describe('adjunts (§4.7)', () => {
  test('anada i tornada: FK per fitxer, Padmé, AAD amb fil, adjunt i emissor; `a` i la miniatura viatgen dins del xifrat', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const { directori, estats } = await muntaDirecte(a, b);
    const foto = bytes(3000);
    const { blob, a: meta } = await P.xifraAdjunt(cripto, { fil: FIL, adjunt: ADJ, emissor: A, bytes: foto, mime: 'image/webp' });
    expect(meta).toMatchObject({ id: ADJ, c: 2, m: 'image/webp', b: 3000, d: null });
    expect(blob.length).toBe(12 + 16 + 3072);
    const fila = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'una foto', a: meta, mini: webp() } });
    const obert = await P.obriMissatge(cripto, { estat: estats[B], fila, directori });
    expect(obert.contingut.a).toMatchObject({ id: ADJ, m: 'image/webp', b: 3000 });
    expect(obert.contingut.mini).toEqual(webp());
    const fitxer = await P.obriAdjunt(cripto, { fil: FIL, emissor: A, a: obert.contingut.a, blob });
    expect(fitxer).toMatchObject({ mime: 'image/webp', classe: 2, durada: null });
    expect(fitxer.bytes).toEqual(foto);
    const veu = await P.xifraAdjunt(cripto, { fil: FIL, adjunt: uuid(), emissor: A, bytes: bytes(500), mime: 'audio/ogg', durada: 1200 });
    expect(veu.a).toMatchObject({ c: 3, d: 1200 });
    expect(await codiDe(P.xifraAdjunt(cripto, { fil: FIL, adjunt: ADJ, emissor: A, bytes: foto, mime: 'text/html' }))).toBe(CODI.adjuntInvalid);
    expect(await codiDe(P.xifraAdjunt(cripto, { fil: FIL, adjunt: ADJ, emissor: A, bytes: new Uint8Array(0), mime: 'image/webp' }))).toBe(CODI.adjuntInvalid);
  });

  test('el hash es comprova abans de desxifrar; un altre fil, emissor o adjunt no obri; la mida i la classe han de ser les declarades', async () => {
    const foto = bytes(1000);
    const { blob, a } = await P.xifraAdjunt(cripto, { fil: FIL, adjunt: ADJ, emissor: A, bytes: foto, mime: 'image/jpeg' });
    const obri = (canvis, blobX = blob) => codiDe(P.obriAdjunt(cripto, { fil: FIL, emissor: A, a: { ...a, ...canvis }, blob: blobX }));
    expect(await obri({})).toBe('ok');
    expect(await obri({}, muta(blob, 20))).toBe(CODI.adjuntManipulat);
    expect(await obri({ h: muta(a.h) })).toBe(CODI.adjuntManipulat);
    expect(await obri({ k: muta(a.k) })).toBe(CODI.adjuntManipulat);
    expect(await obri({ id: uuid() })).toBe(CODI.adjuntManipulat);
    expect(await codiDe(P.obriAdjunt(cripto, { fil: FIL_G, emissor: A, a, blob }))).toBe(CODI.adjuntManipulat);
    expect(await codiDe(P.obriAdjunt(cripto, { fil: FIL, emissor: B, a, blob }))).toBe(CODI.adjuntManipulat);
    expect(await obri({ b: 999 })).toBe(CODI.adjuntIncoherent);
    expect(await obri({ m: 'audio/ogg' })).toBe(CODI.adjuntIncoherent);
    expect(await obri({ k: bytes(31) })).toBe(CODI.adjuntInvalid);
    // Un blob d'un altre fitxer amb el hash que li toca: l'AAD el para igualment.
    const altre = await P.xifraAdjunt(cripto, { fil: FIL, adjunt: uuid(), emissor: A, bytes: bytes(1000), mime: 'image/jpeg' });
    expect(await obri({ h: altre.a.h }, altre.blob)).toBe(CODI.adjuntManipulat);
  });
});

describe('SAS del parell amb compromís (§4.4, esmenes §4)', () => {
  test('execució honesta: els dos tenen el mateix codi de 12 xifres en 4 grups de 3; la transcripció és simètrica', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const [jo, altre] = [P.publiquesDe(a), P.publiquesDe(b)];
    const va = P.creaVerificacioSas(cripto, { jo, altre, rol: P.ROL_SAS.compromet });
    const vb = P.creaVerificacioSas(cripto, { jo: altre, altre: jo, rol: P.ROL_SAS.respon });
    const m1 = await va.compromet();
    expect(m1.compromis.length).toBe(32);
    const m2 = await vb.respon(m1);
    const m3 = await va.revela(m2);
    const codiB = await vb.comprova(m3);
    expect(va.codi.xifres).toBe(codiB.xifres);
    expect(va.codi.text).toMatch(/^\d{3} \d{3} \d{3} \d{3}$/);
    expect(va.codi.text.replaceAll(' ', '')).toBe(va.codi.xifres);
    expect([va.fase, vb.fase]).toEqual(['acabat', 'acabat']);
    expect(await P.transcripcioSas(cripto, { a: jo, b: altre })).toEqual(await P.transcripcioSas(cripto, { a: altre, b: jo }));
    const c = P.publiquesDe(await persona(C));
    expect(await P.transcripcioSas(cripto, { a: jo, b: c })).not.toEqual(await P.transcripcioSas(cripto, { a: jo, b: altre }));
    await expect(P.transcripcioSas(cripto, { a: jo, b: jo })).rejects.toThrow(ambCodi(CODI.sasInvalid));
    // Amb els rols canviats, els dos continuen tenint el mateix codi.
    const va2 = P.creaVerificacioSas(cripto, { jo: altre, altre: jo, rol: P.ROL_SAS.compromet });
    const vb2 = P.creaVerificacioSas(cripto, { jo, altre, rol: P.ROL_SAS.respon });
    const n2 = await vb2.respon(await va2.compromet());
    expect((await vb2.comprova(await va2.revela(n2))).xifres).toBe(va2.codi.xifres);
  });

  test('determinisme i domini: el mateix hT i els mateixos nonces donen el mateix codi; canviar-ne un el canvia', async () => {
    const hT = bytes(32);
    const nC = bytes(32);
    const nR = bytes(32);
    const codi = await P.codiSas(cripto, { hT, nonceCompromis: nC, nonceResposta: nR });
    expect(codi.xifres).toMatch(/^\d{12}$/);
    expect((await P.codiSas(cripto, { hT, nonceCompromis: nC, nonceResposta: nR })).xifres).toBe(codi.xifres);
    expect((await P.codiSas(cripto, { hT, nonceCompromis: nR, nonceResposta: nC })).xifres).not.toBe(codi.xifres);
    expect((await P.codiSas(cripto, { hT: muta(hT), nonceCompromis: nC, nonceResposta: nR })).xifres).not.toBe(codi.xifres);
    expect(P.formatejaSas('000123456789')).toBe('000 123 456 789');
    expect(() => P.formatejaSas('12345')).toThrow(TypeError);
    expect(await P.compromisSas(cripto, hT, nC)).toEqual(await P.compromisSas(cripto, hT, nC));
    expect(await P.compromisSas(cripto, hT, nC)).not.toEqual(await P.compromisSas(cripto, hT, nR));
  });

  test('qui és al mig: un compromís substituït es rebutja; cada pas només val en la seua fase i una vegada', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const [jo, altre] = [P.publiquesDe(a), P.publiquesDe(b)];
    const va = P.creaVerificacioSas(cripto, { jo, altre, rol: P.ROL_SAS.compromet });
    const vb = P.creaVerificacioSas(cripto, { jo: altre, altre: jo, rol: P.ROL_SAS.respon });
    await expect(va.revela({ nonce: bytes(32) })).rejects.toThrow(ambCodi(CODI.sasOrdre));
    await expect(vb.comprova({ nonce: bytes(32) })).rejects.toThrow(ambCodi(CODI.sasOrdre));
    await expect(vb.compromet()).rejects.toThrow(ambCodi(CODI.sasOrdre));
    const m1 = await va.compromet();
    await expect(va.compromet()).rejects.toThrow(ambCodi(CODI.sasOrdre));
    const m2 = await vb.respon({ compromis: muta(m1.compromis) });
    await expect(vb.respon(m1)).rejects.toThrow(ambCodi(CODI.sasOrdre));
    const m3 = await va.revela(m2);
    await expect(vb.comprova(m3)).rejects.toThrow(ambCodi(CODI.sasCompromis));
    expect(vb.fase).toBe('rebutjat');
    expect(vb.codi).toBeNull();
    await expect(vb.comprova(m3)).rejects.toThrow(ambCodi(CODI.sasOrdre));
    await expect(va.revela(m2)).rejects.toThrow(ambCodi(CODI.sasOrdre));
    const vc = P.creaVerificacioSas(cripto, { jo: altre, altre: jo, rol: P.ROL_SAS.respon });
    await expect(vc.respon({ compromis: bytes(31) })).rejects.toThrow(ambCodi(CODI.sasInvalid));
    expect(() => P.creaVerificacioSas(cripto, { jo, altre, rol: 'mira' })).toThrow(TypeError);
  });
});

describe('QA-E07 · la guarda d’àmbit', () => {
  test('actorKey i ambitEstable amb la fórmula de l’esmena', () => {
    expect(P.actorKeyDe({ backendId: 'supabase', userId: A })).toBe(`supabase|${A}|personal`);
    expect(P.actorKeyDe({ backendId: 'supabase', userId: A, orgId: ORG })).toBe(`supabase|${A}|${ORG}`);
    expect(P.actorKeyDe({ backendId: 'supabase', userId: A, orgId: undefined })).toBe(`supabase|${A}|personal`);
    expect(() => P.actorKeyDe({ backendId: 'supa|base', userId: A })).toThrow(TypeError);
    expect(() => P.actorKeyDe({ backendId: 'supabase', userId: '' })).toThrow(TypeError);
    expect(P.ambitEstableDe({ backendScope: 'remote:supabase', joId: A, actorKey: 'k' })).toBe(JSON.stringify(['remote:supabase', A, 'k']));
    expect(() => P.ambitEstableDe({ backendScope: 'x', joId: 'no-uuid', actorKey: 'k' })).toThrow(TypeError);
  });

  test('captura, vigència i error tipat; sense àmbit fixat falla tancat', async () => {
    let vigent = { ambitEstable: 'a', actorKey: 'p', generacio: 1 };
    const guarda = P.creaGuardaAmbit(() => vigent);
    const c = guarda.captura();
    expect(guarda.esVigent(c)).toBe(true);
    vigent = { ...vigent, generacio: 2 };
    expect(guarda.esVigent(c)).toBe(false);
    expect(() => guarda.exigixVigent(c)).toThrow(ambCodi(CODI.ambitCanviat));
    vigent = { ambitEstable: 'a', actorKey: 'p', generacio: 1 };
    expect(guarda.esVigent(c)).toBe(true);
    vigent = { ...vigent, actorKey: 'org' };
    expect(() => guarda.exigixVigent(c)).toThrow(ambCodi(CODI.ambitCanviat));
    vigent = null;
    expect(() => guarda.captura()).toThrow(ambCodi(CODI.senseAmbit));
    expect(guarda.esVigent(c)).toBe(false);
    vigent = { ambitEstable: 'a', actorKey: 'p', generacio: 1 };
    await expect(guarda.ambAmbit(async (comprova) => {
      vigent = { ...vigent, actorKey: 'org' };
      comprova();
    })).rejects.toThrow(ambCodi(CODI.ambitCanviat));
    const lliure = P.creaGuardaAmbit(null);
    expect(lliure.captura()).toBeNull();
    expect(await lliure.ambAmbit(async (comprova) => comprova)).toBeNull();
  });

  test('un canvi d’actor a mig vol avorta l’operació sense tocar l’estat, i amb l’actor de tornada l’operació passa', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const { directori, estats, genesi } = await muntaDirecte(a, b);
    const ambit = { ambitEstable: 'x', actorKey: P.actorKeyDe({ backendId: 'supabase', userId: B }), generacio: 1 };
    let canviaEn = null;
    const criptoB = criptoAmbGanxo((metode) => {
      if (metode === canviaEn) ambit.actorKey = P.actorKeyDe({ backendId: 'supabase', userId: B, orgId: ORG });
    });
    const protocol = P.creaProtocolXat({ cripto: criptoB, rellotge: () => T0, ambit: () => ambit, directori });
    const estatB = protocol.estatFilNou({ fil: FIL, tipusFil: TIPUS_FIL.directe });
    canviaEn = 'verify';
    expect(await codiDe(protocol.aplicaEpoca({ estat: estatB, jo: b, ...genesi }))).toBe(CODI.ambitCanviat);
    expect(estatB.cap).toBeNull();
    expect(estatB.ultima).toBeNull();
    ambit.actorKey = P.actorKeyDe({ backendId: 'supabase', userId: B });
    canviaEn = null;
    await protocol.aplicaEpoca({ estat: estatB, jo: b, ...genesi });
    const fila = await P.xifraMissatge(cripto, { estat: estats[A], jo: a, id: uuid(), contingut: { t: 'per a B' } });
    canviaEn = 'decrypt';
    expect(await codiDe(protocol.obriMissatge({ estat: estatB, fila }))).toBe(CODI.ambitCanviat);
    expect(estatB.vistos.size).toBe(0);
    ambit.actorKey = P.actorKeyDe({ backendId: 'supabase', userId: B });
    canviaEn = null;
    expect((await protocol.obriMissatge({ estat: estatB, fila })).contingut.t).toBe('per a B');
    // Enviar: el canvi just abans de tornar la fila també avorta.
    canviaEn = 'encrypt';
    expect(await codiDe(protocol.xifraMissatge({ estat: estatB, jo: b, id: uuid(), contingut: { t: 'x' } }))).toBe(CODI.ambitCanviat);
    expect(() => P.creaProtocolXat({ cripto, rellotge: 'ara' })).toThrow(TypeError);
  });
});

describe('QA-S05 · panys entre pestanyes', () => {
  test('dos avanços d’època alhora: el primer guanya, el segon rep epoca-conflicte, l’estat avança una sola vegada', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const { directori, estats } = await muntaDirecte(a, b);
    const locks = locksFals();
    const protocol = P.creaProtocolXat({ cripto, rellotge: () => T0, locks, directori });
    const opcions = { estat: estats[A], jo: a, desDe: 1, motiu: MOTIU_EPOCA.rotacio, membres: membres([A], [B]) };
    const [primer, segon] = await Promise.allSettled([protocol.avancaEpoca(opcions), protocol.avancaEpoca(opcions)]);
    expect(primer.status).toBe('fulfilled');
    expect(primer.value.epoca).toBe(2);
    expect(segon.status).toBe('rejected');
    expect(segon.reason.codi).toBe(CODI.epocaConflicte);
    expect(estats[A].cap.epoca).toBe(2);
    expect(estats[A].cap.hash).toEqual(primer.value.hash);
    expect(locks.registre).toEqual([P.nomPanyFil(FIL), P.nomPanyFil(FIL)]);
    expect(protocol.panys.enMemoria).toBe(false);
    await P.aplicaEpoca(cripto, { estat: estats[B], jo: b, ...primer.value, directori });
    expect(estats[B].cap.epoca).toBe(2);
    await expect(protocol.avancaEpoca({ ...opcions, desDe: undefined })).rejects.toThrow(TypeError);
  });

  test('sense port, la cua en memòria serialitza per nom i deixa passar els altres noms', async () => {
    const panys = P.creaPanys();
    expect(panys.enMemoria).toBe(true);
    const ordre = [];
    let alliberaPrimer;
    const primer = panys.ambPany(P.nomPanyIdentitat('ci'), () => new Promise((resol) => {
      ordre.push('primer entra');
      alliberaPrimer = () => { ordre.push('primer ix'); resol('u'); };
    }));
    const segon = panys.ambPany(P.nomPanyIdentitat('ci'), async () => { ordre.push('segon entra'); return 'dos'; });
    const altre = panys.ambPany(P.nomPanyFil(FIL), async () => { ordre.push('altre entra'); return 'tres'; });
    await esperaTorns();
    expect(ordre).toEqual(['primer entra', 'altre entra']);
    alliberaPrimer();
    expect(await Promise.all([primer, segon, altre])).toEqual(['u', 'dos', 'tres']);
    expect(ordre).toEqual(['primer entra', 'altre entra', 'primer ix', 'segon entra']);
    // Un error no bloqueja la cua, i els noms són del protocol.
    await expect(panys.ambPany(P.nomPanyFil(FIL), () => { throw new Error('plof'); })).rejects.toThrow('plof');
    expect(await panys.ambPany(P.nomPanyFil(FIL), async () => 'després')).toBe('després');
    expect(() => panys.ambPany('qualsevol', async () => 1)).toThrow(TypeError);
    expect(() => P.nomPanyFil('no-uuid')).toThrow(TypeError);
    expect(() => P.creaPanys({ locks: {} })).toThrow(TypeError);
    const locks = locksFals();
    const ambLocks = P.creaPanys({ locks });
    expect(await ambLocks.ambPany(P.nomPanyIdentitat('ci'), async () => 'ok')).toBe('ok');
    expect(locks.registre).toEqual(['sdp-xat-v1/identitat/ci']);
  });
});

describe('QA-S06 · text pla després de desxifrar', () => {
  test('la guarda pura lleva etiquetes, atributs, comentaris, contingut de script i controls, i conserva el text', () => {
    expect(P.sanejaTextPla('Hola <b onclick="x()">món</b>!')).toBe('Hola món!');
    expect(P.sanejaTextPla('<img src=x onerror=alert(1)>pla')).toBe('pla');
    expect(P.sanejaTextPla('abans<script>alert(1)</script>després')).toBe('abansdesprés');
    expect(P.sanejaTextPla('<scr<script>ipt>alert(1)</script>')).toBe('');
    expect(P.sanejaTextPla('<<b>script>x</b>')).toBe('x');
    expect(P.sanejaTextPla('a <!-- cosa > b --> c')).toBe('a  c');
    expect(P.sanejaTextPla('1 < 2 i 3 > 2, <3')).toBe('1 < 2 i 3 > 2, <3');
    expect(P.sanejaTextPla('tall <b')).toBe('tall ');
    expect(P.sanejaTextPla('línia\nnova\ttab\u0000nul\u001bescap\u0085nel')).toBe('línia\nnova\ttabnulescapnel');
    expect(P.sanejaTextPla('<svg><script>x</script></svg>fora')).toBe('fora');
    expect(() => P.sanejaTextPla(null)).toThrow(TypeError);
  });

  test('el purificador injectat s’aplica després de la guarda, les seues entitats es desfan, i un de no suportat (DOMPurify sense DOM) s’ignora', () => {
    const crides = [];
    const purificador = { isSupported: true, sanitize: (text, opcions) => { crides.push({ text, opcions }); return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); } };
    expect(P.sanejaTextPla('a & b <i>c</i> < d', { purificador })).toBe('a & b c < d');
    expect(crides).toEqual([{ text: 'a & b c < d', opcions: { ALLOWED_TAGS: [], ALLOWED_ATTR: [], KEEP_CONTENT: true } }]);
    expect(P.sanejaTextPla('x&amp;y', { purificador })).toBe('x&amp;y');
    expect(DOMPurify.isSupported).toBe(false);
    expect(P.sanejaTextPla('<b>res</b>', { purificador: DOMPurify })).toBe('res');
    expect(() => P.sanejaTextPla('x', { purificador: { isSupported: true, sanitize: () => 7 } })).toThrow(TypeError);
  });

  test('en el protocol: el text ix sanejat en rebre i mai es toca abans de xifrar (el franqueig cobrix el text original)', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const { directori, estats } = await muntaDirecte(a, b);
    const crides = [];
    const purificador = { isSupported: true, sanitize: (text) => { crides.push(text); return text; } };
    const protocol = P.creaProtocolXat({ cripto, rellotge: () => T0, purificador, directori });
    const brut = 'Hola <img src=x onerror=alert(1)><b>veïna</b>';
    const fila = await protocol.xifraMissatge({ estat: estats[A], jo: a, id: uuid(), contingut: { t: brut } });
    expect(crides).toEqual([]);
    const obert = await protocol.obriMissatge({ estat: estats[B], fila });
    expect(obert.contingut.t).toBe('Hola veïna');
    expect(crides).toEqual(['Hola veïna']);
    // El franqueig de la fila és el del text brut: la càrrega original es reconstruïx i casa.
    const mk = await derivaClauAesHkdf(cripto, estats[B].epoques.get(1).ck, uuid16(fila.id), F.infoClauMissatge(await F.hashCapcalera(cripto, F.construeixCapcalera({
      fil: FIL, id: fila.id, emissor: A, kidEmissor: a.kid, comOrg: null, epoca: 1, hashEpoca: estats[B].cap.hash, respostaA: null, tf: fila.tf
    }))), ['decrypt']);
    const { desxifraAesGcm } = await import('./xifratXatCripto.js');
    const carrega = F.desfarceixCarrega(await desxifraAesGcm(cripto, mk, { xifrat: fila.ct, iv: fila.iv, aad: F.construeixCapcalera({
      fil: FIL, id: fila.id, emissor: A, kidEmissor: a.kid, comOrg: null, epoca: 1, hashEpoca: estats[B].cap.hash, respostaA: null, tf: fila.tf
    }) }));
    expect(F.llegixCarrega(carrega).contingut.t).toBe(brut);
    expect(protocol.sanejaTextPla('<i>x</i>')).toBe('x');
  });
});
