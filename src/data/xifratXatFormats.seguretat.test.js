// @vitest-environment node
/* Els formats binaris de `sdp-xat-v1` (P1-12 / IDEA-19, pas 3 del disseny final,
   disseny_final_e2ee.md §4 i §5). WebCrypto de veres només per als SHA-256 que
   el format definix. Es mira: els vectors congelats (construïts per un generador
   independent que concatena els camps literalment, i ancorats a la sonda SDPX v1
   de revisio_cripto.md §6.1), les mides del disseny, els desplaçaments que llig
   l'esborrany SQL, i que l'analitzador rebutja la màgia o la versió errònies, els
   bytes sobrers, els camps tallats, els rangs, les codificacions no canòniques,
   els membres repetits o desordenats i tot `cos` que no siga la forma canònica.
   Dades sintètiques; les claus són de prova. */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import * as F from './xifratXatFormats.js';
import VECTORS from './xifratXatFormats.vectors.json';

const cripto = globalThis.crypto;
const { A, B, C, D: DD, FIL, FIL_E, ADJ } = VECTORS.entrades;
const IAIA = '11111111-1a1a-0000-0000-000000000000';
const P256_P = 'ffffffff00000001000000000000000000000000ffffffffffffffffffffffff';
const P256_N = 'ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551';

const deHex = (hex) => new Uint8Array(Buffer.from(hex, 'hex'));
const aHex = (bytes) => Buffer.from(bytes).toString('hex');
const utf8 = (text) => new TextEncoder().encode(text);
/* El JSON dels vectors porta els bytes com {hex}: es tornen Uint8Array. */
const viu = (valor) => {
  if (Array.isArray(valor)) return valor.map(viu);
  if (valor && typeof valor === 'object') {
    const claus = Object.keys(valor);
    if (claus.length === 1 && claus[0] === 'hex') return deHex(valor.hex);
    return Object.fromEntries(Object.entries(valor).map(([clau, v]) => [clau, viu(v)]));
  }
  return valor;
};
const vec = (nom) => ({ valors: viu(VECTORS.formats[nom].valors), bytes: deHex(VECTORS.formats[nom].bytes.hex) });
const H = Object.fromEntries(Object.entries(VECTORS.hashos).map(([clau, v]) => [clau, typeof v === 'string' ? v : v.hex]));
const K = viu(VECTORS.claus);
/* Una còpia amb uns bytes canviats a partir de `desde`. */
function muta(bytes, desde, nous) {
  const copia = Uint8Array.from(bytes);
  copia.set(nous instanceof Uint8Array ? nous : Uint8Array.from(nous), desde);
  return copia;
}
const invalid = (motiu, extra = {}) => expect.objectContaining({ codi: 'FORMAT_INVALID', motiu, ...extra });
/* L'error que torna `fn` (falla la prova si no en llança cap). */
function errorDe(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('No ha llançat cap error.');
}
/* Contamina Object.prototype només mentre corre `fn` (síncrona), i sempre ho desfà. */
function ambPrototipContaminat(propietats, fn) {
  for (const [clau, valor] of Object.entries(propietats)) Object.defineProperty(Object.prototype, clau, { value: valor, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    for (const clau of Object.keys(propietats)) delete Object.prototype[clau];
  }
}

/* Cada vector amb el seu parell construïx/llig. */
const PARELLS = Object.freeze({
  entradaKid: 'EntradaKid', declaracioClau: 'DeclaracioClau', declaracioClauContinuitat: 'DeclaracioClau',
  epocaDirecte: 'Epoca', epocaEntitatGenesi: 'Epoca', epocaEntitat: 'Epoca', infoSobre: 'InfoSobre', capcaleraDirecte: 'Capcalera',
  capcaleraEntitat: 'Capcalera', entradaFranqueig: 'EntradaFranqueig', entradaFirmaMissatge: 'EntradaFirmaMissatge',
  aadAdjunt: 'AadAdjunt', aadMetaGrup: 'AadMetaGrup', equipV1: 'Equip', equipV2: 'Equip', entradaFrase: 'EntradaFrase',
  aadEmbolcallRk: 'AadEmbolcallRk', aadCopia: 'AadCopia', copia: 'Copia', aadLlibreta: 'AadLlibreta',
  entradaFirmaLlibreta: 'EntradaFirmaLlibreta', infoFragment: 'InfoFragment', entradaCodiCurt: 'EntradaCodiCurt',
  entradaCodiCurtZero: 'EntradaCodiCurt'
});
const construeix = (nom, valors) => F[`construeix${PARELLS[nom]}`](valors);
const llegix = (nom, bytes) => F[`llegix${PARELLS[nom]}`](bytes);

describe('l’entorn i la frontera', () => {
  test('hi ha WebCrypto (globalThis.crypto.subtle.digest)', () => {
    expect(typeof cripto?.subtle?.digest).toBe('function');
  });

  test('el mòdul no pren cap global i només importa el contracte neutral dels adjunts', () => {
    const font = readFileSync(new URL('./xifratXatFormats.js', import.meta.url), 'utf8');
    expect(font).not.toMatch(/globalThis|window\.|Math\.random/);
    expect([...font.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1])).toEqual(['./xatMultimedia.js']);
  });
});

describe('vectors congelats', () => {
  test.each(Object.keys(PARELLS))('%s: construït byte a byte i llegit de tornada', (nom) => {
    const { valors, bytes } = vec(nom);
    expect(aHex(construeix(nom, valors))).toBe(aHex(bytes));
    expect(llegix(nom, bytes)).toEqual(valors);
  });

  test('cos i P: els vectors i el farciment', () => {
    for (const nom of Object.keys(VECTORS.cos)) {
      const { valors, bytes } = VECTORS.cos[nom];
      expect(aHex(F.construeixCos(viu(valors)))).toBe(bytes.hex);
      expect(F.llegixCos(deHex(bytes.hex))).toEqual({ a: null, mini: null, t: null, ...viu(valors) });
    }
    const { senseFirma, ambFirma } = VECTORS.carrega;
    expect(aHex(F.construeixCarrega(viu(senseFirma.valors)))).toBe(senseFirma.bytes.hex);
    expect(aHex(F.construeixCarrega(viu(ambFirma.valors)))).toBe(ambFirma.bytes.hex);
    expect(aHex(F.farceixCarrega(deHex(senseFirma.bytes.hex)))).toBe(senseFirma.farcida.hex);
    expect(aHex(F.desfarceixCarrega(deHex(senseFirma.farcida.hex)))).toBe(senseFirma.bytes.hex);
    const p = F.llegixCarrega(deHex(ambFirma.bytes.hex));
    expect(p).toMatchObject({ signada: true, nf: viu(ambFirma.valors.nf), firma: viu(ambFirma.valors.firma) });
    expect(p.contingut.a).toMatchObject({ c: 2, m: 'image/webp', d: null });
  });

  test('ancoratge extern: kid d’A i de B, SDPK, info SDPS i envHash són els de la sonda SDPX v1', async () => {
    // revisio_cripto.md §6.1 (vectors_sdpx_v1.json): el mateix SDPI, SDPK i SDPS que el disseny final.
    expect(H.kidA).toBe('d2e3a146e39ac55fc40b0bdd74712f3f');
    expect(H.kidB).toBe('6299bedf5313fc00e55af8880650303a');
    expect(aHex(await F.kidDe(cripto, { usuari: A, sigPub: K.A_sig, dhPub: K.A_dh }))).toBe(H.kidA);
    expect(aHex(await F.kidDe(cripto, { usuari: B, sigPub: K.B_sig, dhPub: K.B_dh }))).toBe(H.kidB);
    expect(aHex(await F.hashSobre(cripto, viu(VECTORS.sobre.enc), viu(VECTORS.sobre.ct)))).toBe(H.envB);
    expect(H.envB).toBe('5874aaa2696cf3628d53727d8130c4a7f3a3916317fdec496e12ef4723f840b7');
  });

  test('els hash del format: hash_e, equip (refEquip), capçalera, cos, etiquetes i codi curt', async () => {
    const directe = vec('epocaDirecte');
    const genesi = vec('epocaEntitatGenesi');
    const entitat = vec('epocaEntitat');
    expect(aHex(await F.hashEpoca(cripto, directe.bytes))).toBe(H.hashE1);
    expect(aHex(await F.hashEpoca(cripto, genesi.bytes))).toBe(H.hashEntitat1);
    expect(aHex(entitat.valors.prevHash)).toBe(H.hashEntitat1);
    expect(aHex(await F.hashEpoca(cripto, entitat.bytes))).toBe(H.hashEntitat2);
    expect(aHex(await F.hashEquip(cripto, vec('equipV1').bytes))).toBe(H.hashQ1);
    expect(aHex(genesi.valors.refEquip)).toBe(H.hashQ1);
    expect(aHex(await F.hashEquip(cripto, vec('equipV2').bytes))).toBe(H.hashQ2);
    expect(aHex(entitat.valors.refEquip)).toBe(H.hashQ2);
    expect(aHex(vec('equipV2').valors.prevHash)).toBe(H.hashQ1);
    expect(aHex(await F.hashCapcalera(cripto, vec('capcaleraDirecte').bytes))).toBe(H.hashH1);
    expect(aHex(await F.hashCos(cripto, deHex(VECTORS.cos.foto.bytes.hex)))).toBe(H.hashCosFoto);
    expect(await F.codiCurtSocial(cripto, vec('entradaCodiCurt').valors)).toBe(H.codiCurt);
    // Un codi per davall de 100.000 conserva els zeros del davant (el generador el cerca a part).
    expect(H.codiCurtZero).toMatch(/^00\d{4}$/);
    expect(await F.codiCurtSocial(cripto, vec('entradaCodiCurtZero').valors)).toBe(H.codiCurtZero);
    expect(aHex(F.infoCompromisEpoca(1))).toBe(VECTORS.etiquetes.compromisEpoca1.hex);
    expect(aHex(F.infoClauMissatge(deHex(H.hashH1)))).toBe(VECTORS.etiquetes.missatgeH1.hex);
    expect(aHex(F.infoClauAdjunt(FIL))).toBe(VECTORS.etiquetes.adjuntFil.hex);
    expect(aHex(F.infoMetaGrup(3))).toBe(VECTORS.etiquetes.metaGrup3.hex);
    expect(aHex(F.construeixEntradaHashSobre(viu(VECTORS.sobre.enc), viu(VECTORS.sobre.ct)))).toBe(VECTORS.sobre.entrada.hex);
  });

  test('kidQuadra: el kid de les claus de veres sí; el d’una altra persona o d’altres claus, no', async () => {
    const kidA = deHex(H.kidA);
    await expect(F.kidQuadra(cripto, { usuari: A, kid: kidA, sigPub: K.A_sig, dhPub: K.A_dh })).resolves.toBe(true);
    await expect(F.kidQuadra(cripto, { usuari: B, kid: kidA, sigPub: K.A_sig, dhPub: K.A_dh })).resolves.toBe(false);
    await expect(F.kidQuadra(cripto, { usuari: A, kid: kidA, sigPub: K.A_dh, dhPub: K.A_sig })).resolves.toBe(false);
    await expect(F.kidQuadra(cripto, { usuari: A, kid: new Uint8Array(8), sigPub: K.A_sig, dhPub: K.A_dh }))
      .rejects.toMatchObject({ codi: 'FORMAT_INVALID', motiu: 'mida' });
  });

  test('les dues cadenes dels vectors són coherents (el pas 7 les pot usar de fixtures vàlides)', async () => {
    // Directe FIL: e = 1, A i B; el sobre, el franqueig i la capçalera són d'eixa època.
    const directe = vec('epocaDirecte').valors;
    expect(vec('infoSobre').valors).toMatchObject({ fil: FIL, epoca: 1, autor: directe.autor });
    expect(vec('entradaFranqueig').valors).toMatchObject({ fil: FIL, epoca: 1 });
    expect(vec('capcaleraDirecte').valors).toMatchObject({ fil: FIL, epoca: 1 });
    // Entitat FIL_E: un fil propi; e = 1 amb l'equip v1, e = 2 amb el v2.
    const genesi = vec('epocaEntitatGenesi').valors;
    const entitat = vec('epocaEntitat').valors;
    for (const [epoca, equip] of [[genesi, vec('equipV1').valors], [entitat, vec('equipV2').valors]]) {
      expect(epoca).toMatchObject({ fil: FIL_E, tipusFil: F.TIPUS_FIL.entitat });
      // L'interlocutor D no és de l'equip; la resta, sí, i amb el kid que l'equip signa.
      const deFora = epoca.membres.filter((m) => !equip.membres.some((q) => q.usuari === m.usuari));
      expect(deFora.map((m) => m.usuari)).toEqual([DD]);
      for (const m of epoca.membres.filter((x) => x.usuari !== DD)) {
        expect(aHex(m.kid)).toBe(aHex(equip.membres.find((q) => q.usuari === m.usuari).kid));
      }
    }
    expect(genesi).toMatchObject({ epoca: 1, motiu: F.MOTIU_EPOCA.genesi, autor: DD });
    expect(entitat).toMatchObject({ epoca: 2, motiu: F.MOTIU_EPOCA.equip });
    expect(vec('capcaleraEntitat').valors).toMatchObject({ fil: FIL_E, epoca: 2, hashEpoca: deHex(H.hashEntitat2) });
    expect(vec('entradaFirmaMissatge').valors).toMatchObject({ fil: FIL_E, epoca: 2 });
    expect(aHex(await F.kidDe(cripto, { usuari: DD, sigPub: K.D_sig, dhPub: K.D_dh }))).toBe(H.kidD);
  });
});

describe('mides i desplaçaments', () => {
  test('les mides del disseny (la de SDPS és 89 B: els seus camps no en sumen 88)', () => {
    expect(F.MIDES).toMatchObject({
      entradaKid: 151, declaracioClau: 175, infoSobre: 89, capcalera: 169, entradaFirmaMissatge: 137, aadAdjunt: 53,
      aadMetaGrup: 25, entradaFrase: 15, aadEmbolcallRk: 57, aadCopia: 37, copia: 225, aadLlibreta: 29,
      entradaFirmaLlibreta: 61, infoFragment: 87, entradaCodiCurt: 175, capcaleraFranqueig: 57, entradaHashSobre: 113
    });
    expect([F.midaEpoca(1), F.midaEpoca(2), F.midaEpoca(256)]).toEqual([360, 425, 16935]);
    expect([F.midaEquip(1), F.midaEquip(64)]).toEqual([262, 2341]);
    expect(vec('epocaDirecte').bytes).toHaveLength(425);
    expect(vec('epocaEntitatGenesi').bytes).toHaveLength(F.midaEpoca(3));
    expect(vec('epocaEntitat').bytes).toHaveLength(F.midaEpoca(4));
  });

  test('SDPE i SDPK als desplaçaments que llig l’esborrany SQL (base 1 al comentari, base 0 a get_byte)', () => {
    const { bytes, valors } = vec('epocaEntitat');
    const tros = (desde, mida) => aHex(bytes.subarray(desde - 1, desde - 1 + mida));
    expect(tros(1, 5)).toBe(aHex(utf8('SDPE\u0001')));
    expect(tros(6, 16)).toBe(aHex(F.bytesUuid(FIL_E)));
    expect(bytes[25]).toBe(valors.tipusFil);
    expect(tros(27, 32)).toBe(aHex(valors.prevHash));
    expect(tros(59, 16)).toBe(aHex(F.bytesUuid(B)));
    expect(tros(75, 16)).toBe(aHex(valors.kidAutor));
    expect(tros(91, 65)).toBe(aHex(valors.sigPubAutor));
    expect(tros(156, 65)).toBe(aHex(valors.dhPubAutor));
    expect(bytes[220]).toBe(valors.motiu);
    expect(tros(262, 32)).toBe(aHex(valors.refEquip));
    expect(bytes[293] * 256 + bytes[294]).toBe(4);
    // Cada membre: usuari a 295 + 65·i (base 0), kid a +16, rol a +32, envHash a +33.
    const segon = 295 + 65;
    expect(aHex(bytes.subarray(segon, segon + 16))).toBe(aHex(F.bytesUuid(B)));
    expect(bytes[segon + 32]).toBe(valors.membres[1].rol);
    expect(aHex(bytes.subarray(segon + 33, segon + 65))).toBe(aHex(valors.membres[1].envHash));
    const sdpk = vec('declaracioClauContinuitat');
    expect(aHex(sdpk.bytes.subarray(21, 86))).toBe(aHex(sdpk.valors.sigPub));
    expect(aHex(sdpk.bytes.subarray(86, 151))).toBe(aHex(sdpk.valors.dhPub));
    expect(aHex(sdpk.bytes.subarray(151, 167))).toBe(aHex(sdpk.valors.kidAnterior));
  });

  test('P: nf als bytes 3-34 (base 1), la clau de l’HMAC que pren el SQL; H de 169 B camp a camp', () => {
    const p = deHex(VECTORS.carrega.senseFirma.bytes.hex);
    expect(aHex(p.subarray(2, 34))).toBe(VECTORS.carrega.senseFirma.valors.nf.hex);
    const { bytes, valors } = vec('capcaleraEntitat');
    const trams = [['fil', 5, 16], ['id', 21, 16], ['emissor', 37, 16], ['kidEmissor', 53, 16], ['comOrg', 69, 16],
      ['epoca', 85, 4], ['hashEpoca', 89, 32], ['respostaA', 121, 16], ['tf', 137, 32]];
    expect(trams.at(-1)[1] + trams.at(-1)[2]).toBe(169);
    for (const [camp, desde, mida] of trams) {
      // Girar l'últim bit del tram canvia exactament eixe camp (H lliga cada camp per separat).
      const girat = muta(bytes, desde + mida - 1, [bytes[desde + mida - 1] ^ 0x01]);
      const llegit = F.llegixCapcalera(girat);
      for (const [altre] of trams) {
        if (altre === camp) expect(llegit[altre], camp).not.toEqual(valors[altre]);
        else expect(llegit[altre], `${camp}→${altre}`).toEqual(valors[altre]);
      }
    }
  });
});

describe('rebuig genèric de tots els formats binaris', () => {
  test.each(Object.keys(PARELLS))('%s: màgia, versió, bytes sobrers, cada tall i tipus d’entrada', (nom) => {
    const { bytes } = vec(nom);
    const ambMagia = nom !== 'copia';
    // Tot rebuig diu de quin format és (SDPF pot dir «P»: la càrrega del darrere té el seu analitzador).
    const amb = (motiu) => invalid(motiu, { format: expect.any(String) });
    // Cada lletra de la màgia: totes comencen per «SDP» i només la quarta distingix el format.
    for (let k = 0; ambMagia && k < 4; k += 1) {
      expect(() => llegix(nom, muta(bytes, k, [bytes[k] ^ 0x20])), `${nom} màgia[${k}]`).toThrow(amb('magia'));
    }
    for (const versio of [0x00, 0x02, 0xff]) {
      expect(() => llegix(nom, muta(bytes, ambMagia ? 4 : 0, [versio])), `${nom} versió ${versio}`).toThrow(amb('versio'));
    }
    expect(() => llegix(nom, Uint8Array.from([...bytes, 0]))).toThrow(amb('sobrants'));
    for (let n = 0; n < bytes.length; n += 1) {
      expect(() => llegix(nom, bytes.subarray(0, n)), `${nom} tallat a ${n}`).toThrow(amb('truncat'));
    }
    for (const dolent of [bytes.buffer, [...bytes], aHex(bytes), null, undefined]) {
      expect(() => llegix(nom, dolent)).toThrow(amb('tipus'));
    }
  });

  test.each(Object.keys(PARELLS))('%s: el constructor no admet camps desconeguts ni li’n falta cap', (nom) => {
    const { valors } = vec(nom);
    const format = expect.any(String);
    expect(() => construeix(nom, { ...valors, sobrant: 1 })).toThrow(invalid('desconegut', { format, camp: 'sobrant' }));
    const primer = Object.keys(valors)[0];
    const sense = { ...valors };
    delete sense[primer];
    expect(() => construeix(nom, sense)).toThrow(invalid('falta', { format, camp: primer }));
    for (const dolent of [null, [], 'valors', 7]) expect(() => construeix(nom, dolent)).toThrow(invalid('tipus', { format }));
  });

  test('un Buffer de Node s’accepta i el resultat no comparteix memòria amb l’entrada', () => {
    const { bytes, valors } = vec('epocaDirecte');
    const buffer = Buffer.from(bytes);
    const llegit = F.llegixEpoca(buffer);
    buffer.fill(0);
    expect(llegit).toEqual(valors);
    expect(Object.isFrozen(llegit) && Object.isFrozen(llegit.membres) && Object.isFrozen(llegit.membres[0])).toBe(true);
  });

  test('només objectes plans: un prototip amb els camps o una instància de classe no són valors', () => {
    const { valors } = vec('aadCopia');
    for (const dolent of [Object.create(valors), Object.create({ t: 'x' }), new Map(Object.entries(valors)), new Date()]) {
      expect(() => F.construeixAadCopia(dolent)).toThrow(invalid('tipus', { format: 'SDPB' }));
    }
    expect(() => F.construeixCos(Object.create({ t: 'x' }))).toThrow(invalid('tipus', { format: 'cos' }));
    expect(aHex(F.construeixAadCopia(Object.assign(Object.create(null), valors)))).toBe(aHex(vec('aadCopia').bytes));
  });

  test('cap valor heretat d’un Object.prototype contaminat entra en uns bytes', async () => {
    const E = vec('epocaEntitat');
    const { refEquip, ...senseRef } = E.valors;
    const W = vec('aadEmbolcallRk').valors;
    const foto = viu(VECTORS.cos.foto.valors);
    const kidHeretat = ambPrototipContaminat({ refEquip, minIteracions: 1000, a: foto.a, firma: new Uint8Array(64).fill(7), kid: deHex(H.kidA), rol: 0 }, () => {
      // Un camp requerit que només hi és per herència falta; un opcional heretat és absent.
      expect(() => F.construeixAadCopia({ usuari: A })).toThrow(invalid('falta', { camp: 'kid' }));
      expect(() => F.construeixEpoca(senseRef)).toThrow(invalid('incoherent', { camp: 'refEquip' }));
      const { rol, ...senseRol } = E.valors.membres[0];
      expect(rol).toBe(2);
      expect(() => F.construeixEpoca({ ...E.valors, membres: [senseRol, ...E.valors.membres.slice(1)] })).toThrow(invalid('falta', { camp: 'rol' }));
      // Les opcions tampoc: el sòl de les iteracions no baixa.
      expect(() => F.construeixAadEmbolcallRk({ ...W, iteracions: 1000 }, {})).toThrow(invalid('rang', { camp: 'iteracions' }));
      // `cos` sense adjunt i P sense firma, encara que el prototip en porte.
      expect(new TextDecoder().decode(F.construeixCos({ t: 'hola' }))).toBe('{"t":"hola"}');
      const p = F.construeixCarrega({ nf: new Uint8Array(32), cos: utf8('{"t":"hola"}') });
      expect(F.llegixCarrega(p)).toMatchObject({ signada: false, firma: null });
      // kidQuadra llig el kid abans del primer await: un kid heretat no quadra amb res, falta.
      return F.kidQuadra(cripto, { usuari: A, sigPub: K.A_sig, dhPub: K.A_dh });
    });
    await expect(kidHeretat).rejects.toMatchObject({ codi: 'FORMAT_INVALID', motiu: 'falta', camp: 'kid' });
    expect(Object.prototype.refEquip).toBeUndefined();
    expect(aHex(F.construeixEpoca({ ...senseRef, refEquip }))).toBe(aHex(E.bytes));
  });

  test('una llista amb forats falla com a FORMAT_INVALID, mai amb un TypeError ni un 0 inventat', () => {
    const { valors } = vec('epocaDirecte');
    const ambForat = new Array(3);
    [ambForat[0], ambForat[2]] = valors.membres;
    expect(() => F.construeixEpoca({ ...valors, tipusFil: 3, membres: ambForat })).toThrow(invalid('tipus', { format: 'SDPE', camp: 'membres[1]' }));
    const casella = [5, 6, 7, 8, 9, 10];
    delete casella[2];
    for (const indexs of [casella, new Array(6)]) {
      expect(() => F.construeixEntradaFrase({ llistaVersio: 1, indexs })).toThrow(invalid('rang', { camp: 'indexs' }));
    }
  });

  test('la còpia en clar: cap còpia interna dels secrets queda viva, ni en construir ni en una lectura que falla', () => {
    const { bytes, valors } = vec('copia');
    // Es registren totes les Uint8Array que el mòdul crea mentre treballa (busca el constructor al global).
    const Original = globalThis.Uint8Array;
    const creades = [];
    const espia = (fn) => {
      globalThis.Uint8Array = new Proxy(Original, { construct: (desti, args) => { const nou = Reflect.construct(desti, args); creades.push(nou); return nou; } });
      try {
        return fn();
      } finally {
        globalThis.Uint8Array = Original;
      }
    };
    const eixida = espia(() => F.construeixCopia(valors));
    expect(aHex(eixida)).toBe(aHex(bytes));
    const internes = creades.filter((b) => b !== eixida);
    expect(internes.filter((b) => b.length === 32).length).toBeGreaterThanOrEqual(7);
    expect(internes.every((b) => b.every((x) => x === 0))).toBe(true);
    // sigY ≥ p: la lectura falla després d'haver copiat sigD i sigX, que es posen a zero.
    creades.length = 0;
    const dolenta = muta(bytes, 65, deHex(P256_P));
    expect(() => espia(() => F.llegixCopia(dolenta))).toThrow(invalid('no-canonic', { camp: 'sigY' }));
    expect(creades.filter((b) => b.length === 32)).toHaveLength(2);
    expect(creades.every((b) => b.every((x) => x === 0))).toBe(true);
    // Una lectura bona sí que torna els valors (esborrar-los és de qui crida).
    expect(F.llegixCopia(bytes)).toEqual(valors);
  });
});

describe('SDPE · declaració d’època', () => {
  const D = vec('epocaDirecte');
  const E = vec('epocaEntitat');

  test('els membres s’ordenen sols i es lligen ordenats; la llista de 256 cap i la de 257 no', () => {
    const girats = { ...E.valors, membres: [...E.valors.membres].reverse() };
    expect(aHex(F.construeixEpoca(girats))).toBe(aHex(E.bytes));
    const membres = Array.from({ length: 256 }, (_, i) => ({
      usuari: `${i.toString(16).padStart(8, '0')}-0000-4000-8000-0000000000aa`, kid: Uint8Array.from({ length: 16 }, () => (i % 255) + 1), rol: 0, envHash: deHex(H.envA)
    }));
    membres[3] = { usuari: A, kid: D.valors.kidAutor, rol: 1, envHash: deHex(H.envA) };
    const grup = { ...D.valors, tipusFil: 3, membres };
    const bytes = F.construeixEpoca(grup);
    expect(bytes).toHaveLength(16935);
    expect(F.llegixEpoca(bytes).membres.map((m) => m.usuari)).toEqual([...membres.map((m) => m.usuari)].sort());
    const massa = [...membres, { usuari: 'ffffffff-0000-4000-8000-0000000000aa', kid: deHex(H.kidC), rol: 0, envHash: deHex(H.envC) }];
    expect(() => F.construeixEpoca({ ...grup, membres: massa })).toThrow(invalid('rang', { camp: 'membres' }));
    expect(() => F.construeixEpoca({ ...grup, membres: [] })).toThrow(invalid('rang', { camp: 'membres' }));
  });

  test('rangs: època 0 i 2³¹, tipus de fil, motiu, rol, data fora d’un enter segur', () => {
    const casos = [
      [21, [0, 0, 0, 0], 'epoca'], [21, [0x80, 0, 0, 0], 'epoca'], [25, [0], 'tipusFil'], [25, [4], 'tipusFil'],
      [220, [0], 'motiu'], [220, [10], 'motiu'], [221, [0x01], 'creatMs'], [221, [0x00, 0x20], 'creatMs'], [295 + 32, [3], 'membres[0].rol']
    ];
    for (const [desde, nous, camp] of casos) {
      expect(() => F.llegixEpoca(muta(D.bytes, desde, nous)), camp).toThrow(invalid('rang', { format: 'SDPE', camp }));
    }
    // 2⁵³ − 1 és l'últim enter segur; 0 ms és una data vàlida del format.
    expect(F.llegixEpoca(muta(D.bytes, 221, [0x00, 0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])).creatMs).toBe(Number.MAX_SAFE_INTEGER);
    expect(F.llegixEpoca(F.construeixEpoca({ ...D.valors, creatMs: 0 })).creatMs).toBe(0);
    expect(F.llegixEpoca(F.construeixEpoca({ ...E.valors, epoca: F.MAX_EPOCA })).epoca).toBe(2147483647);
    expect(() => F.construeixEpoca({ ...D.valors, epoca: 1.5 })).toThrow(invalid('rang', { camp: 'epoca' }));
    expect(() => F.construeixEpoca({ ...D.valors, motiu: '1' })).toThrow(invalid('rang', { camp: 'motiu' }));
    // El constructor no deixa que un enter massa gran done la volta (257 → 1 en un byte, 2³² + e → e en quatre).
    expect(() => F.construeixEpoca({ ...D.valors, tipusFil: 257 })).toThrow(invalid('rang', { camp: 'tipusFil' }));
    expect(() => F.construeixEpoca({ ...E.valors, epoca: 2 ** 32 + 2 })).toThrow(invalid('rang', { camp: 'epoca' }));
    const W = vec('aadEmbolcallRk').valors;
    expect(() => F.construeixAadEmbolcallRk({ ...W, iteracions: 2 ** 32 + 600000 })).toThrow(invalid('rang', { camp: 'iteracions' }));
  });

  test('n de la llista: 0, 257 i un n que no quadra amb la mida', () => {
    expect(() => F.llegixEpoca(muta(D.bytes, 293, [0, 0]))).toThrow(invalid('rang', { camp: 'membres' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 293, [1, 1]))).toThrow(invalid('rang', { camp: 'membres' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 293, [0, 3]))).toThrow(invalid('truncat'));
    expect(() => F.llegixEpoca(muta(E.bytes, 293, [0, 2]))).toThrow(invalid('sobrants'));
  });

  test('prevHash a zeros si i només si e = 1; refEquip només (i sempre) amb una entitat', () => {
    const e2 = muta(D.bytes, 21, [0, 0, 0, 2]);
    expect(() => F.llegixEpoca(e2)).toThrow(invalid('incoherent', { camp: 'prevHash' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 26, deHex(H.hashEntitat2)))).toThrow(invalid('incoherent', { camp: 'prevHash' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 261, deHex(H.hashQ2)))).toThrow(invalid('incoherent', { camp: 'refEquip' }));
    expect(() => F.llegixEpoca(muta(E.bytes, 261, new Uint8Array(32)))).toThrow(invalid('incoherent', { camp: 'refEquip' }));
    expect(() => F.construeixEpoca({ ...D.valors, prevHash: new Uint8Array(32) })).toThrow(invalid('no-canonic', { camp: 'prevHash' }));
    expect(() => F.construeixEpoca({ ...E.valors, prevHash: null })).toThrow(invalid('incoherent', { camp: 'prevHash' }));
    expect(() => F.construeixEpoca({ ...E.valors, tipusFil: 3 })).toThrow(invalid('incoherent', { camp: 'refEquip' }));
  });

  test('membres desordenats o repetits a la lectura', () => {
    const primer = D.bytes.subarray(295, 360);
    const segon = D.bytes.subarray(360, 425);
    const girats = Uint8Array.from([...D.bytes.subarray(0, 295), ...segon, ...primer]);
    expect(() => F.llegixEpoca(girats)).toThrow(invalid('desordenat', { camp: 'membres[1]' }));
    const repetits = Uint8Array.from([...D.bytes.subarray(0, 295), ...primer, ...primer]);
    expect(() => F.llegixEpoca(repetits)).toThrow(invalid('duplicat', { camp: 'membres[1]' }));
    const doble = { ...E.valors, membres: [...E.valors.membres, E.valors.membres[0]] };
    expect(() => F.construeixEpoca(doble)).toThrow(invalid('duplicat'));
    // Repetir és repetir usuari, encara que el kid canvie: dues entrades ordenades per kid tampoc valen.
    const [ambKidA, ambKidB] = [deHex(H.kidA), deHex(H.kidB)].sort((x, y) => Buffer.compare(x, y))
      .map((kid) => Uint8Array.from([...primer.subarray(0, 16), ...kid, ...primer.subarray(32)]));
    expect(() => F.llegixEpoca(Uint8Array.from([...D.bytes.subarray(0, 295), ...ambKidA, ...ambKidB]))).toThrow(invalid('duplicat', { camp: 'membres[1]' }));
    const dosKids = [D.valors.membres[0], { ...D.valors.membres[0], kid: deHex(H.kidB) }, D.valors.membres[1]];
    expect(() => F.construeixEpoca({ ...D.valors, tipusFil: 3, membres: dosKids })).toThrow(invalid('duplicat', { format: 'SDPE', camp: 'membres[1]' }));
  });

  test('la gènesi és e = 1 i només e = 1, en els dos sentits i també a la lectura', () => {
    expect(() => F.construeixEpoca({ ...E.valors, epoca: 5, motiu: F.MOTIU_EPOCA.genesi })).toThrow(invalid('incoherent', { camp: 'motiu' }));
    for (const motiu of [F.MOTIU_EPOCA.rotacio, F.MOTIU_EPOCA.baixa, F.MOTIU_EPOCA.equip]) {
      expect(() => F.construeixEpoca({ ...D.valors, motiu }), String(motiu)).toThrow(invalid('incoherent', { camp: 'motiu' }));
    }
    expect(() => F.llegixEpoca(muta(D.bytes, 220, [F.MOTIU_EPOCA.rotacio]))).toThrow(invalid('incoherent', { format: 'SDPE', camp: 'motiu' }));
    expect(() => F.llegixEpoca(muta(E.bytes, 220, [F.MOTIU_EPOCA.genesi]))).toThrow(invalid('incoherent', { camp: 'motiu' }));
    expect(F.llegixEpoca(F.construeixEpoca({ ...E.valors, motiu: F.MOTIU_EPOCA.rotacio })).motiu).toBe(7);
  });

  test('amb una entitat, l’interlocutor i almenys una persona de l’equip; la gènesi d’un grup, una administradora', () => {
    const G = vec('epocaEntitatGenesi').valors;
    const autor = G.membres.find((m) => m.usuari === G.autor);
    expect(() => F.construeixEpoca({ ...G, membres: [autor] })).toThrow(invalid('incoherent', { camp: 'membres' }));
    expect(F.llegixEpoca(F.construeixEpoca({ ...G, membres: [autor, G.membres[0]] })).membres).toHaveLength(2);
    // Un grup: d'una sola persona, sí; la seua gènesi la signa una administradora o una propietària, mai una membre.
    const grup = { ...D.valors, tipusFil: 3, membres: [D.valors.membres[0]] };
    expect(() => F.construeixEpoca(grup)).toThrow(invalid('incoherent', { camp: 'membres' }));
    for (const rol of [F.ROL_EPOCA.administradora, F.ROL_EPOCA.propietaria]) {
      expect(F.llegixEpoca(F.construeixEpoca({ ...grup, membres: [{ ...D.valors.membres[0], rol }] })).membres[0].rol).toBe(rol);
    }
    // A partir de e = 2 l'autor d'un grup pot ser membre (una depuració, §4.5.3.3).
    const grup2 = { ...E.valors, tipusFil: 3, refEquip: null, motiu: F.MOTIU_EPOCA.depuracio };
    expect(F.llegixEpoca(F.construeixEpoca({ ...grup2, membres: grup2.membres.map((m) => ({ ...m, rol: 0 })) })).motiu).toBe(4);
  });

  test('un directe té exactament dos membres; l’autor hi és amb el seu kid', () => {
    const tercer = { usuari: C, kid: deHex(H.kidC), rol: 0, envHash: deHex(H.envC) };
    expect(() => F.construeixEpoca({ ...D.valors, membres: [...D.valors.membres, tercer] })).toThrow(invalid('incoherent', { camp: 'membres' }));
    expect(() => F.construeixEpoca({ ...D.valors, membres: [D.valors.membres[1], tercer] })).toThrow(invalid('incoherent', { camp: 'membres' }));
    const kidCanviat = [{ ...D.valors.membres[0], kid: deHex(H.kidB) }, D.valors.membres[1]];
    expect(() => F.construeixEpoca({ ...D.valors, membres: kidCanviat })).toThrow(invalid('incoherent', { camp: 'membres' }));
    // El format no sap qui és la IAIA: rebutjar-la és del protocol (§4.5.3.1).
    const ambIaia = [...E.valors.membres, { ...tercer, usuari: IAIA }];
    expect(F.llegixEpoca(F.construeixEpoca({ ...E.valors, membres: ambIaia })).membres).toHaveLength(ambIaia.length);
  });

  test('codificacions no canòniques: públiques, uuid, kid i envHash', () => {
    expect(() => F.llegixEpoca(muta(D.bytes, 90, [0x02]))).toThrow(invalid('no-canonic', { camp: 'sigPubAutor' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 156, deHex(P256_P)))).toThrow(invalid('no-canonic', { camp: 'dhPubAutor' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 90 + 33, deHex(P256_P)))).toThrow(invalid('no-canonic', { camp: 'sigPubAutor' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 5, new Uint8Array(16)))).toThrow(invalid('no-canonic', { camp: 'fil' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 74, new Uint8Array(16)))).toThrow(invalid('no-canonic', { camp: 'kidAutor' }));
    expect(() => F.llegixEpoca(muta(D.bytes, 295 + 33, new Uint8Array(32)))).toThrow(invalid('no-canonic', { camp: 'membres[0].envHash' }));
    expect(() => F.construeixEpoca({ ...D.valors, fil: FIL.toUpperCase() })).toThrow(invalid('no-canonic', { camp: 'fil' }));
    expect(() => F.construeixEpoca({ ...D.valors, kidAutor: D.valors.kidAutor.subarray(0, 15) })).toThrow(invalid('mida', { camp: 'kidAutor' }));
    expect(() => F.construeixEpoca({ ...D.valors, sigPubAutor: [...D.valors.sigPubAutor] })).toThrow(invalid('tipus', { camp: 'sigPubAutor' }));
  });
});

describe('SDPQ · equip d’una entitat', () => {
  const Q1 = vec('equipV1');
  const Q2 = vec('equipV2');

  test('rols 1 i 2, de 1 a 64 membres ordenats i sense repetir; prevHash només a partir de v = 2', () => {
    const rol = 229 + 32;
    expect(() => F.llegixEquip(muta(Q1.bytes, rol, [0]))).toThrow(invalid('rang', { camp: 'membres[0].rol' }));
    expect(() => F.llegixEquip(muta(Q1.bytes, rol, [3]))).toThrow(invalid('rang', { camp: 'membres[0].rol' }));
    expect(() => F.llegixEquip(muta(Q1.bytes, 21, [0, 0, 0, 2]))).toThrow(invalid('incoherent', { camp: 'prevHash' }));
    expect(() => F.llegixEquip(muta(Q2.bytes, 25, new Uint8Array(32)))).toThrow(invalid('incoherent', { camp: 'prevHash' }));
    const primer = Q1.bytes.subarray(229, 262);
    expect(() => F.llegixEquip(Uint8Array.from([...Q1.bytes.subarray(0, 229), ...Q1.bytes.subarray(262), ...primer]))).toThrow(invalid('desordenat'));
    expect(() => F.llegixEquip(Uint8Array.from([...Q1.bytes.subarray(0, 229), ...primer, ...primer]))).toThrow(invalid('duplicat'));
    const molts = Array.from({ length: 65 }, (_, i) => ({ usuari: `${(i + 1).toString(16).padStart(8, '0')}-0000-4000-8000-0000000000bb`, kid: deHex(H.kidA), rol: 2 }));
    expect(() => F.construeixEquip({ ...Q1.valors, membres: molts })).toThrow(invalid('rang', { camp: 'membres' }));
    const signant = Q1.valors.membres.find((m) => m.usuari === Q1.valors.autor);
    expect(F.construeixEquip({ ...Q1.valors, membres: [signant, ...molts.slice(0, 63)] })).toHaveLength(F.midaEquip(64));
    expect(aHex(F.construeixEquip({ ...Q2.valors, membres: [...Q2.valors.membres].reverse() }))).toBe(aHex(Q2.bytes));
    // El mateix usuari amb dos kid és un membre repetit (també a SDPQ).
    const dosKids = [signant, { ...signant, kid: deHex(H.kidB) }, Q1.valors.membres[1]];
    expect(() => F.construeixEquip({ ...Q1.valors, membres: dosKids })).toThrow(invalid('duplicat', { format: 'SDPQ', camp: 'membres[1]' }));
  });

  test('sempre almenys una propietària; la v = 1 la signa una propietària de la llista, amb el seu kid', () => {
    const [signant, altra] = Q1.valors.membres;
    expect(signant).toMatchObject({ usuari: Q1.valors.autor, rol: F.ROL_EQUIP.propietaria });
    const dolents = [
      [altra], [{ ...signant, rol: F.ROL_EQUIP.administradora }, altra], [{ ...signant, kid: deHex(H.kidB) }, altra],
      [{ ...altra, rol: F.ROL_EQUIP.propietaria }],
      // Hi ha propietària, però la que signa la v = 1 s'hi llista com a administradora.
      [{ ...signant, rol: F.ROL_EQUIP.administradora }, { ...altra, rol: F.ROL_EQUIP.propietaria }]
    ];
    for (const membres of dolents) {
      expect(() => F.construeixEquip({ ...Q1.valors, membres })).toThrow(invalid('incoherent', { format: 'SDPQ', camp: 'membres' }));
    }
    // A la lectura: la propietària de Q1 degradada a administradora (rol a 229 + 32).
    expect(() => F.llegixEquip(muta(Q1.bytes, 229 + 32, [F.ROL_EQUIP.administradora]))).toThrow(invalid('incoherent', { camp: 'membres' }));
    // v ≥ 2: qui signa no ha de ser a la llista (era propietària de l'anterior, cosa del protocol), però n'hi ha d'haver una.
    expect(F.llegixEquip(F.construeixEquip({ ...Q2.valors, membres: [{ ...altra, rol: F.ROL_EQUIP.propietaria }] })).membres).toHaveLength(1);
    expect(() => F.construeixEquip({ ...Q2.valors, membres: [altra] })).toThrow(invalid('incoherent', { camp: 'membres' }));
  });
});

describe('codificacions: uuid, base64url, punts i JWK', () => {
  test('uuid: canònic en minúscules d’anada i tornada, també el de la IAIA; mai el nul', () => {
    for (const uuid of [A, FIL, IAIA]) expect(F.uuidDeBytes(F.bytesUuid(uuid))).toBe(uuid);
    for (const dolent of [A.toUpperCase(), A.replace(/-/g, ''), `{${A}}`, ` ${A}`, `${A}0`, `${A}\n`, '00000000-0000-0000-0000-000000000000', 42, null]) {
      expect(() => F.bytesUuid(dolent), String(dolent)).toThrow(invalid('no-canonic', { format: 'uuid' }));
    }
    expect(() => F.uuidDeBytes(new Uint8Array(16))).toThrow(invalid('no-canonic'));
    expect(() => F.uuidDeBytes(new Uint8Array(15))).toThrow(invalid('mida'));
  });

  test('base64url: anada i tornada com el de Node, i rebuig del farciment, l’alfabet estàndard i els bits sobrers', () => {
    for (let n = 0; n < 50; n += 1) {
      const bytes = cripto.getRandomValues(new Uint8Array(n));
      const text = F.aBase64Url(bytes);
      expect(text).toBe(Buffer.from(bytes).toString('base64url'));
      expect(aHex(F.deBase64Url(text))).toBe(aHex(bytes));
    }
    expect(aHex(F.deBase64Url('AA'))).toBe('00');
    for (const dolent of ['AA==', 'AB', 'AAB', 'A', 'AAAAA', 'a+b/', 'ab c', 'abç']) {
      expect(() => F.deBase64Url(dolent), dolent).toThrow(invalid('no-canonic', { format: 'base64url' }));
    }
    expect(() => F.deBase64Url('AAAA', 2)).toThrow(invalid('mida'));
    expect(() => F.deBase64Url(null)).toThrow(invalid('tipus'));
  });

  test('base64url amb mida fixa: un text massa llarg es rebutja per la llargària, abans de llegir-ne cap caràcter', () => {
    // Si es llegira, el «!» del final donaria no-canonic; la mida ix primer i no es reserva res.
    expect(() => F.deBase64Url(`${'A'.repeat(400000)}!!!!`, 32)).toThrow(invalid('mida', { format: 'base64url' }));
    expect(() => F.deBase64Url(`${'A'.repeat(41)}!!`, 32)).toThrow(invalid('no-canonic'));
    expect(F.deBase64Url(F.aBase64Url(new Uint8Array(32).fill(9)), 32)).toEqual(new Uint8Array(32).fill(9));
  });

  test('JWK de la pública efímera: exactament kty, crv, x i y; mai d', () => {
    const jwk = F.jwkDelPunt(K.E1);
    expect(jwk).toEqual(VECTORS.jwkE1);
    expect(Object.keys(jwk)).toEqual(['crv', 'kty', 'x', 'y']);
    expect(aHex(F.puntDelJwk(jwk))).toBe(aHex(K.E1));
    expect(() => F.puntDelJwk({ ...jwk, d: jwk.x })).toThrow(invalid('desconegut', { format: 'jwk', camp: null }));
    expect(() => F.puntDelJwk({ ...jwk, ext: true })).toThrow(invalid('desconegut'));
    // El JWK ve del servidor: el nom d'una clau desconeguda no arriba mai a l'error (ni al missatge ni al camp).
    const avis = 'Sóc de Poble: la teua clau ha caducat. Torna a escriure la frase';
    const error = errorDe(() => F.puntDelJwk({ ...jwk, [avis]: 1 }));
    expect(error).toMatchObject({ codi: 'FORMAT_INVALID', motiu: 'desconegut', format: 'jwk', camp: null });
    expect(error.message).not.toContain('caducat');
    expect(() => F.puntDelJwk({ ...jwk, crv: 'P-384' })).toThrow(invalid('rang'));
    expect(() => F.puntDelJwk({ ...jwk, x: F.aBase64Url(new Uint8Array(31)) })).toThrow(invalid('mida', { camp: 'x' }));
    expect(() => F.puntDelJwk({ ...jwk, y: `${jwk.y.slice(0, 42)}B` })).toThrow(invalid('no-canonic', { camp: 'y' }));
    expect(() => F.puntDelJwk({ ...jwk, x: F.aBase64Url(deHex(P256_P)) })).toThrow(invalid('no-canonic'));
    expect(() => F.puntDelJwk({ kty: 'EC', crv: 'P-256', x: jwk.x })).toThrow(invalid('falta', { camp: 'y' }));
    expect(() => F.jwkDelPunt(muta(K.E1, 0, [0x03]))).toThrow(invalid('no-canonic'));
  });
});

describe('cos · JSON canònic', () => {
  const foto = viu(VECTORS.cos.foto.valors);
  const ambText = (text) => F.construeixCos({ t: text });

  test('el constructor accepta null o l’absència; la lectura sempre torna les tres claus', () => {
    expect(aHex(F.construeixCos({ t: 'Demà a les 8 al bancal', a: null, mini: undefined }))).toBe(VECTORS.cos.text.bytes.hex);
    expect(F.llegixCos(ambText('hola'))).toEqual({ a: null, mini: null, t: 'hola' });
    expect(new TextDecoder().decode(ambText('a\tb\nc "d" \\ é'))).toBe('{"t":"a\\tb\\nc \\"d\\" \\\\ é"}');
  });

  test('cap forma alternativa: espais, ordre, claus repetides, escapaments i números', () => {
    const fotoText = new TextDecoder().decode(deHex(VECTORS.cos.foto.bytes.hex));
    const dolents = [
      '{ "t":"hola"}', '{"t":"hola"} ', '{"t":"a","t":"b"}', '{"t":"\\u0061"}', '{"t":"a\\/b"}', '{"t":"\\u00e9"}',
      fotoText.replace('"b":184320,"c":2', '"c":2,"b":184320'), fotoText.replace('184320', '184320.0'),
      fotoText.replace('184320', '1.8432e5'), fotoText.replace('"mini"', '"t":"x","mini"').replace(',"t":"Mira quina collita"', '')
    ];
    for (const dolent of dolents) expect(() => F.llegixCos(utf8(dolent)), dolent).toThrow(invalid('no-canonic', { format: 'cos' }));
  });

  test('receptor estricte: UTF-8 invàlid, BOM, \\u0000, suplents sols i controls C0', () => {
    for (const bytes of [[0x7b, 0x22, 0x74, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d], [0x7b, 0x22, 0x74, 0x22, 0x3a, 0x22, 0xc0, 0xaf, 0x22, 0x7d],
      [0x7b, 0x22, 0x74, 0x22, 0x3a, 0x22, 0xed, 0xa0, 0x80, 0x22, 0x7d], [0xef, 0xbb, 0xbf, ...utf8('{"t":"x"}')]]) {
      expect(() => F.llegixCos(Uint8Array.from(bytes))).toThrow(invalid('no-canonic'));
    }
    for (const [json, camp] of [['{"t":"a\\u0000"}', 't'], ['{"t":"\\ud800"}', 't'], ['{"t":"\\udc00x"}', 't'], ['{"t":"a\\rb"}', 't']]) {
      expect(() => F.llegixCos(utf8(json)), json).toThrow(invalid('no-canonic', { camp }));
    }
    for (const text of ['a\u0000', '\ud800', 'x\udfff', 'a\u001bb', 'a\rb']) expect(() => ambText(text)).toThrow(invalid('no-canonic', { camp: 't' }));
    expect(F.llegixCos(utf8('{"t":"😀   \u007f"}')).t).toBe('😀   \u007f');
  });

  test('esquema: claus desconegudes, buit, tipus i absències que no són absències', () => {
    expect(() => F.llegixCos(utf8('{"t":"x","u":1}'))).toThrow(invalid('desconegut', { camp: null }));
    expect(() => F.llegixCos(utf8('{"__proto__":{},"t":"x"}'))).toThrow(invalid('desconegut', { camp: null }));
    // `cos` és d'un altre: cap nom de clau desconeguda (ni de dins de l'adjunt) entra a l'error.
    const fotoText = new TextDecoder().decode(deHex(VECTORS.cos.foto.bytes.hex));
    const casos = [['{"t":"x","la contrasenya és 1234":1}', null], [`{"${'x'.repeat(16000)}":1,"t":"a"}`, null],
      [fotoText.replace('"b":', '"secret de la veïna":1,"b":'), 'a']];
    for (const [json, camp] of casos) {
      // El camp, si n'hi ha, és el camí propi (`a`), mai la clau de l'altre.
      const error = errorDe(() => F.llegixCos(utf8(json)));
      expect(error).toMatchObject({ codi: 'FORMAT_INVALID', motiu: 'desconegut', format: 'cos', camp });
      expect(error.message.length).toBeLessThan(60);
      expect(error.message).not.toMatch(/contrasenya|veïna|xxx/);
    }
    // Al constructor el nom sí que hi és: l'objecte és del codi propi.
    expect(() => F.construeixCos({ t: 'x', u: 1 })).toThrow(invalid('desconegut', { camp: 'u' }));
    expect(() => F.construeixCos({ a: { ...viu(VECTORS.cos.foto.valors).a, w: 1 } })).toThrow(invalid('desconegut', { camp: 'w' }));
    expect(() => F.llegixCos(utf8('{}'))).toThrow(invalid('falta'));
    for (const json of ['[]', '"x"', 'null', '7']) expect(() => F.llegixCos(utf8(json)), json).toThrow(invalid('tipus'));
    expect(() => F.llegixCos(utf8('{"t":null}'))).toThrow(invalid('tipus', { camp: 't' }));
    expect(() => F.llegixCos(utf8('{"t":""}'))).toThrow(invalid('rang', { camp: 't' }));
    expect(() => F.llegixCos(new Uint8Array(0))).toThrow(invalid('rang'));
    expect(() => F.construeixCos({ t: 7 })).toThrow(invalid('tipus', { camp: 't' }));
  });

  test('l’adjunt: classe, MIME de la seua classe, sostres en clar, durada, FK i h', () => {
    const a = foto.a;
    const veu = { ...a, c: 3, m: 'audio/webm', b: 3_000_000, d: 45000 };
    const video = { ...a, c: 4, m: 'video/quicktime', b: 19_922_943, d: 10_000 };
    for (const bo of [veu, video]) expect(F.llegixCos(F.construeixCos({ a: bo })).a).toEqual(bo);
    const dolents = [
      [{ ...a, c: 1 }, 'a.c'], [{ ...a, c: '2' }, 'a.c'], [{ ...a, m: 'image/svg+xml' }, 'a.m'], [{ ...a, m: 'text/html' }, 'a.m'],
      [{ ...a, m: 'video/mp4' }, 'a.m'], [{ ...a, b: 2_000_001 }, 'a.b'], [{ ...a, b: 0 }, 'a.b'], [{ ...video, b: 19_922_944 }, 'a.b'],
      [{ ...a, d: 0 }, 'a.d'], [{ ...veu, d: null }, 'a.d'], [{ ...video, d: 10_001 }, 'a.d'], [{ ...veu, d: 1.5 }, 'a.d'],
      [{ ...veu, b: 3_000_001 }, 'a.b']
    ];
    for (const [dolent, camp] of dolents) expect(() => F.construeixCos({ a: dolent }), camp).toThrow(invalid('rang', { format: 'cos', camp }));
    expect(() => F.construeixCos({ a: { ...a, k: a.k.subarray(1) } })).toThrow(invalid('mida', { camp: 'a.k' }));
    expect(() => F.construeixCos({ a: { ...a, h: new Uint8Array(32) } })).toThrow(invalid('no-canonic', { camp: 'a.h' }));
    expect(() => F.construeixCos({ a: { ...a, id: ADJ.toUpperCase() } })).toThrow(invalid('no-canonic', { camp: 'a.id' }));
    const senseD = { ...a };
    delete senseD.d;
    expect(() => F.construeixCos({ a: senseD })).toThrow(invalid('falta', { camp: 'd' }));
    const fotoText = new TextDecoder().decode(deHex(VECTORS.cos.foto.bytes.hex));
    const k = F.aBase64Url(a.k);
    expect(() => F.llegixCos(utf8(fotoText.replace(k, `${k}=`)))).toThrow(invalid('no-canonic', { camp: 'a.k' }));
  });

  test('la miniatura: un WebP sencer de fins a 8 KB, només amb una foto o un vídeo', () => {
    const webp = (n) => {
      const bytes = new Uint8Array(n);
      bytes.set(utf8('RIFF'), 0);
      bytes.set([(n - 8) & 255, ((n - 8) >> 8) & 255, 0, 0], 4);
      bytes.set(utf8('WEBP'), 8);
      return bytes;
    };
    expect(F.llegixCos(F.construeixCos({ ...foto, mini: webp(8192) })).mini).toHaveLength(8192);
    for (const n of [8193, 8194]) expect(() => F.construeixCos({ ...foto, mini: webp(n) }), String(n)).toThrow(invalid('rang', { camp: 'mini' }));
    expect(() => F.construeixCos({ t: 'x', mini: webp(20) })).toThrow(invalid('incoherent', { camp: 'mini' }));
    expect(() => F.construeixCos({ a: { ...foto.a, c: 3, m: 'audio/ogg', d: 3000 }, mini: webp(20) })).toThrow(invalid('incoherent'));
    expect(() => F.construeixCos({ ...foto, mini: muta(webp(20), 8, utf8('WAVE')) })).toThrow(invalid('no-canonic', { camp: 'mini' }));
    expect(() => F.construeixCos({ ...foto, mini: muta(webp(20), 4, [13]) })).toThrow(invalid('no-canonic', { camp: 'mini' }));
    expect(() => F.construeixCos({ ...foto, mini: [...webp(20)] })).toThrow(invalid('tipus', { camp: 'mini' }));
  });

  test('fronteres de mida: 4.096 caràcters ASCII, accentuats i CJK hi caben; 4.096 emojis o 4.097 caràcters, no', () => {
    for (const c of ['a', 'à', '界']) {
      const cos = ambText(c.repeat(F.TEXT_MAXIM));
      const p = F.construeixCarrega({ nf: new Uint8Array(32), cos, firma: new Uint8Array(64) });
      expect(F.farceixCarrega(p).length).toBeLessThanOrEqual(F.MAX_CARREGA_FARCIDA);
    }
    expect(() => ambText('😀'.repeat(4096))).toThrow(invalid('rang', { camp: 't' }));
    expect(() => ambText('a'.repeat(4097))).toThrow(invalid('rang', { camp: 't' }));
    expect(ambText('😀'.repeat(2048))).toHaveLength(8192 + 8);
    // Peu llarg i miniatura grossa no caben junts: el protocol torna a provar sense la miniatura.
    const mini = new Uint8Array(8192);
    mini.set(utf8('RIFF'), 0);
    mini.set([0xf8, 0x1f, 0, 0], 4);
    mini.set(utf8('WEBP'), 8);
    expect(() => F.construeixCos({ ...foto, t: '界'.repeat(F.TEXT_MAXIM), mini })).toThrow(invalid('rang', { format: 'cos' }));
  });
});

describe('P i el seu farciment', () => {
  const p1 = deHex(VECTORS.carrega.senseFirma.bytes.hex);
  const p2 = deHex(VECTORS.carrega.ambFirma.bytes.hex);
  const carregaDe = (k) => F.construeixCarrega({ nf: new Uint8Array(32), cos: utf8(`{"t":"${'x'.repeat(k)}"}`) });

  test('flags desconeguts, firma anunciada que no hi és o que sobra, longitud de cos fora de rang', () => {
    expect(() => F.llegixCarrega(muta(p1, 1, [0x02]))).toThrow(invalid('no-canonic', { format: 'P', camp: 'flags' }));
    expect(() => F.llegixCarrega(muta(p1, 1, [0x03]))).toThrow(invalid('no-canonic', { camp: 'flags' }));
    expect(() => F.llegixCarrega(muta(p1, 1, [0x01]))).toThrow(invalid('truncat'));
    expect(() => F.llegixCarrega(muta(p2, 1, [0x00]))).toThrow(invalid('sobrants'));
    expect(() => F.llegixCarrega(muta(p1, 34, [0, 0, 0, 0]))).toThrow(invalid('rang', { camp: 'cos' }));
    expect(() => F.llegixCarrega(muta(p1, 34, [0, 0, 0x3f, 0x7a]))).toThrow(invalid('rang', { camp: 'cos' }));
    const llargaria = p1[37];
    expect(() => F.llegixCarrega(muta(p1, 37, [llargaria + 1]))).toThrow(invalid('truncat'));
    expect(() => F.llegixCarrega(muta(p1, 37, [llargaria - 1]))).toThrow(invalid('sobrants'));
    expect(() => F.llegixCarrega(muta(p1, 38, utf8(' ')))).toThrow(invalid('no-canonic', { format: 'cos' }));
    expect(() => F.construeixCarrega({ nf: new Uint8Array(31), cos: utf8('{"t":"x"}') })).toThrow(invalid('mida', { camp: 'nf' }));
    expect(() => F.construeixCarrega({ nf: new Uint8Array(32), cos: utf8('{"t":"x"}'), firma: new Uint8Array(63) })).toThrow(invalid('mida', { camp: 'firma' }));
  });

  test('Pf: el múltiple de 256 següent, també quan P + 0x80 hi cau just', () => {
    expect(carregaDe(209)).toHaveLength(255);
    expect(F.farceixCarrega(carregaDe(209))).toHaveLength(256);
    expect(F.farceixCarrega(carregaDe(210))).toHaveLength(512);
    for (const k of [1, 209, 210, 465, 4000]) {
      const p = carregaDe(k);
      expect(aHex(F.desfarceixCarrega(F.farceixCarrega(p)))).toBe(aHex(p));
    }
  });

  test('Pf estricte: sense 0x80, un marcador que no és 0x80, un bloc de zeros de més i mides que no són de bloc', () => {
    const pf = deHex(VECTORS.carrega.senseFirma.farcida.hex);
    expect(() => F.desfarceixCarrega(muta(pf, p1.length, [0]))).toThrow(invalid('no-canonic', { format: 'Pf' }));
    expect(() => F.desfarceixCarrega(muta(pf, p1.length, [0x81]))).toThrow(invalid('no-canonic'));
    const llarg = new Uint8Array(512);
    llarg.set(pf);
    expect(() => F.desfarceixCarrega(llarg)).toThrow(invalid('no-canonic', { format: 'Pf' }));
    for (const n of [0, 255, 257, 16640]) expect(() => F.desfarceixCarrega(new Uint8Array(n)), String(n)).toThrow(invalid('mida'));
    expect(() => F.desfarceixCarrega(new Uint8Array(256))).toThrow(invalid('no-canonic'));
    const brut = Uint8Array.from(pf);
    brut[0] = 2;
    expect(() => F.desfarceixCarrega(brut)).toThrow(invalid('versio', { format: 'P' }));
    expect(() => F.farceixCarrega(muta(p1, 1, [0x02]))).toThrow(invalid('no-canonic', { format: 'P' }));
  });

  test('la mida que pot tindre el xifrat d’un missatge: |Pf| + 16', () => {
    for (const bona of [272, 528, 16400]) expect(F.esMidaXifratMissatge(bona), String(bona)).toBe(true);
    for (const dolenta of [0, 256, 271, 273, 16401, 16656, 272.5, '272']) expect(F.esMidaXifratMissatge(dolenta), String(dolenta)).toBe(false);
  });

  test('SDPF: la capçalera de 57 B i una P estricta al darrere', () => {
    const { bytes, valors } = vec('entradaFranqueig');
    expect(aHex(bytes.subarray(57))).toBe(aHex(valors.carrega));
    expect(() => F.llegixEntradaFranqueig(muta(bytes, 58, [0x04]))).toThrow(invalid('no-canonic', { format: 'P', camp: 'flags' }));
    expect(() => F.construeixEntradaFranqueig({ ...valors, carrega: valors.carrega.subarray(1) })).toThrow(invalid('versio', { format: 'P' }));
  });
});

describe('frase, còpia, llibreta i recuperació social', () => {
  test('SDPR: 6 índexs d’11 bits en 9 B (com la sonda) i els 6 bits sobrers a zero', () => {
    const { bytes } = vec('entradaFrase');
    expect(aHex(bytes.subarray(6))).toBe('000007ffc006137700');
    for (let i = 0; i < 200; i += 1) {
      const indexs = Array.from(cripto.getRandomValues(new Uint16Array(6)), (v) => v & 0x7ff);
      expect(F.llegixEntradaFrase(F.construeixEntradaFrase({ llistaVersio: 1, indexs })).indexs).toEqual(indexs);
    }
    for (let k = 0; k < 6; k += 1) {
      expect(() => F.llegixEntradaFrase(muta(bytes, 14, [bytes[14] | (1 << k)])), `bit ${k}`).toThrow(invalid('no-canonic', { camp: 'indexs' }));
    }
    expect(() => F.llegixEntradaFrase(muta(bytes, 5, [0]))).toThrow(invalid('rang', { camp: 'llistaVersio' }));
    for (const indexs of [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 2048], [0, 1, 2, 3, 4, -1], [0, 1, 2, 3, 4, 1.5], 'abcdef']) {
      expect(() => F.construeixEntradaFrase({ llistaVersio: 1, indexs })).toThrow(invalid('rang', { camp: 'indexs' }));
    }
  });

  test('SDPW: iteracions de 600.000 a 10.000.000; el sòl de proves només baixa a 1.000', () => {
    const { valors } = vec('aadEmbolcallRk');
    expect(() => F.construeixAadEmbolcallRk({ ...valors, iteracions: 599999 })).toThrow(invalid('rang', { camp: 'iteracions' }));
    expect(() => F.construeixAadEmbolcallRk({ ...valors, iteracions: 10000001 })).toThrow(invalid('rang', { camp: 'iteracions' }));
    const proves = F.construeixAadEmbolcallRk({ ...valors, iteracions: F.MIN_ITERACIONS_PROVES }, { minIteracions: F.MIN_ITERACIONS_PROVES });
    expect(() => F.llegixAadEmbolcallRk(proves)).toThrow(invalid('rang', { camp: 'iteracions' }));
    expect(F.llegixAadEmbolcallRk(proves, { minIteracions: 1000 }).iteracions).toBe(1000);
    expect(() => F.llegixAadEmbolcallRk(proves, { minIteracions: 999 })).toThrow(TypeError);
    expect(F.llegixAadEmbolcallRk(F.construeixAadEmbolcallRk({ ...valors, iteracions: F.MAX_ITERACIONS_FRASE })).iteracions).toBe(10000000);
  });

  test('la còpia: 225 B, escalars d’1 a n − 1 i coordenades menors que p', () => {
    const { bytes, valors } = vec('copia');
    expect(bytes[0]).toBe(1);
    expect(() => F.llegixCopia(muta(bytes, 1, new Uint8Array(32)))).toThrow(invalid('rang', { format: 'copia', camp: 'sigD' }));
    expect(() => F.llegixCopia(muta(bytes, 97, deHex(P256_N)))).toThrow(invalid('rang', { camp: 'dhD' }));
    expect(() => F.llegixCopia(muta(bytes, 33, deHex(P256_P)))).toThrow(invalid('no-canonic', { camp: 'sigX' }));
    for (const [desde, camp] of [[65, 'sigY'], [129, 'dhX'], [161, 'dhY']]) {
      expect(() => F.llegixCopia(muta(bytes, desde, deHex(P256_P))), camp).toThrow(invalid('no-canonic', { format: 'copia', camp }));
    }
    const nMenysU = deHex(P256_N);
    nMenysU[31] -= 1;
    expect(F.llegixCopia(F.construeixCopia({ ...valors, sigD: nMenysU })).sigD).toEqual(nMenysU);
  });

  test('SDPT: l’AAD (29 B) i el que se signa (61 B) no es confonen; el comptador comença en 1', () => {
    const aad = vec('aadLlibreta');
    const firma = vec('entradaFirmaLlibreta');
    expect(() => F.llegixEntradaFirmaLlibreta(aad.bytes)).toThrow(invalid('truncat'));
    expect(() => F.llegixAadLlibreta(firma.bytes)).toThrow(invalid('sobrants'));
    expect(() => F.construeixAadLlibreta({ ...aad.valors, comptador: 0 })).toThrow(invalid('rang', { camp: 'comptador' }));
    expect(() => F.construeixAadLlibreta({ ...aad.valors, comptador: 2 ** 53 })).toThrow(invalid('rang', { camp: 'comptador' }));
  });

  test('SDPH: k = 3 fix, sense N, x d’1 a 255; SDPV de 175 B unificat amb el disseny §21.2', async () => {
    const { valors } = vec('infoFragment');
    expect(() => F.construeixInfoFragment({ ...valors, llindar: 2 })).toThrow(invalid('rang', { camp: 'llindar' }));
    expect(() => F.construeixInfoFragment({ ...valors, llindar: 4 })).toThrow(invalid('rang', { camp: 'llindar' }));
    expect(() => F.construeixInfoFragment({ ...valors, total: 5 })).toThrow(invalid('desconegut', { camp: 'total' }));
    expect(() => F.construeixInfoFragment({ ...valors, x: 0 })).toThrow(invalid('rang', { camp: 'x' }));
    expect(F.llegixInfoFragment(F.construeixInfoFragment({ ...valors, x: 255 }))).toMatchObject({ x: 255, llindar: 3 });
    const codi = vec('entradaCodiCurt').valors;
    expect(F.construeixEntradaCodiCurt(codi)).toHaveLength(175);
    expect(() => F.llegixEntradaCodiCurt(vec('entradaCodiCurt').bytes.subarray(0, 102))).toThrow(invalid('truncat'));
    const un = await F.codiCurtSocial(cripto, codi);
    expect(un).toMatch(/^\d{6}$/);
    expect(await F.codiCurtSocial(cripto, { ...codi, epk: K.B_dh })).not.toBe(un);
  });
});

describe('fallar tancat', () => {
  test('sense WebCrypto injectat, cap hash: SENSE_CRIPTO', async () => {
    const { valors, bytes } = vec('epocaDirecte');
    for (const dolent of [undefined, null, {}, { subtle: {} }]) {
      await expect(F.kidDe(dolent, { usuari: A, sigPub: K.A_sig, dhPub: K.A_dh })).rejects.toMatchObject({ codi: 'SENSE_CRIPTO' });
      await expect(F.hashEpoca(dolent, bytes)).rejects.toMatchObject({ codi: 'SENSE_CRIPTO' });
    }
    // El format es comprova abans: una declaració mal formada no arriba mai al hash.
    await expect(F.hashEpoca(cripto, bytes.subarray(1))).rejects.toMatchObject({ codi: 'FORMAT_INVALID', motiu: 'magia' });
    await expect(F.hashEpoca(cripto, F.construeixEpoca(valors))).resolves.toHaveLength(32);
  });

  test('cada hash del format valida l’entrada abans de cridar digest (que ací falla si s’hi arriba)', async () => {
    const trampa = { subtle: { digest: () => { throw new Error('digest cridat amb una entrada mal formada'); } } };
    const cosFoto = deHex(VECTORS.cos.foto.bytes.hex);
    const casos = [
      ['hashCos', () => F.hashCos(trampa, muta(cosFoto, 1, utf8(' ')))],
      ['hashCapcalera', () => F.hashCapcalera(trampa, vec('capcaleraDirecte').bytes.subarray(1))],
      ['hashEquip', () => F.hashEquip(trampa, muta(vec('equipV1').bytes, 3, [0x45]))],
      ['hashEpoca', () => F.hashEpoca(trampa, vec('epocaEntitat').bytes.subarray(0, 300))],
      ['hashSobre', () => F.hashSobre(trampa, muta(viu(VECTORS.sobre.enc), 0, [0x02]), viu(VECTORS.sobre.ct))],
      ['kidDe', () => F.kidDe(trampa, { usuari: A.toUpperCase(), sigPub: K.A_sig, dhPub: K.A_dh })],
      ['kidQuadra', () => F.kidQuadra(trampa, { usuari: A, kid: deHex(H.kidA), sigPub: K.A_sig, dhPub: K.A_dh, sobrant: 1 })],
      ['codiCurtSocial', () => F.codiCurtSocial(trampa, { ...vec('entradaCodiCurt').valors, epk: K.A_sig.subarray(1) })]
    ];
    for (const [nom, crida] of casos) {
      await expect(crida(), nom).rejects.toMatchObject({ codi: 'FORMAT_INVALID' });
    }
    // Les mateixes entrades, ben formades, sí que arriben a digest.
    await expect(F.hashCos(trampa, cosFoto)).rejects.toThrow(/digest cridat/);
    await expect(F.kidQuadra(cripto, { usuari: A, kid: deHex(H.kidA), sigPub: K.A_sig, dhPub: K.A_dh })).resolves.toBe(true);
  });
});
