// @vitest-environment node
/* L'alta silenciosa F2a dels xats privats (P1-12 / IDEA-19; disseny final
   §4.3 i §5.1-§5.4; especificació B2d de la marató 261101_2143). WebCrypto de
   veres (el de Node) i l'IndexedDB fals que clona amb structuredClone. Es mira:
     · la frontera: només primitives i formats, la llista amb import(), la
       bandera apagada i la porta DM-2 (cap frase sense la llista revisada);
     · la frase: els índexs uniformes (χ² amb un control que veu un biaix), la
       màscara, l'entrada SDPR byte a byte amb un empaquetador propi de la
       prova, i el text tolerant (accents, majúscules, tres grafies de l'ela
       geminada);
     · la KDF: una sola derivació a 600.000 i el sòl de 1.000 de les proves;
       tot el que està fora de rang ix abans de cap derivació;
     · l'alta: la forma exacta de xat_publica_identitat, el kid recalculat com
       el servidor, la declaració que el protocol accepta (i la continuïtat
       suau), la identitat no extraïble que el magatzem desa i rellig;
     · la restauració en un aparell nou (també des del text de la frase), la
       frase errònia, el servidor que canvia la sal, les iteracions, el kid o
       la còpia, la còpia d'una altra persona o d'un altre kid, la RK errònia,
       la privada que no és de la pública i la fila del servidor mal formada;
     · els AAD SDPW i SDPB de la publicació, fixats fora del motor: WebCrypto
       cru amb els AAD de §5.1 empaquetats a mà en els dos sentits, i un vector
       de regressió congelat (§21.9 pas 5) que ha de continuar obrint-se;
     · la frase nova sense canviar d'identitat (D-07 a);
     · cap secret viu en acabar, també quan l'alta o la frase nova fallen a
       mitges (millor esforç).
   Les iteracions de proves són 1.000 (com el cofre). Dades sintètiques. */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../config/xifratXat.js';
import * as A from './xifratXatAlta.js';
import {
  ITERACIONS_KDF, aBase64url, deBase64url, exportaPublica, generaParellaDh, generaParellaSignatura, infoHkdf, obriBase, segellaBase,
  signa, verificaSignatura
} from './xifratXatCripto.js';
import { construeixAadEmbolcallRk, kidDe } from './xifratXatFormats.js';
import { clauIdentitat, creaMagatzemXat } from './xifratXatMagatzem.js';
import { REVISADA_PEL_MESTRE } from './xifratXatParaules.js';
import { CANVI_CLAU, verificaDeclaracioClau } from './xifratXatProtocol.js';

const cripto = globalThis.crypto;
const JO = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const ALTRA = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';
const T0 = Date.UTC(2026, 10, 2, 0, 30);
const MIN = 1000;
const OPC = Object.freeze({ iteracions: MIN, minIteracions: MIN, permetLlistaPendent: true });
const CI = clauIdentitat({ backendId: 'supabase', endpoint: 'https://exemple.supabase.co', joId: JO });
const FONT = readFileSync(new URL('./xifratXatAlta.js', import.meta.url), 'utf8');

const ambCodi = (codi, extra = {}) => expect.objectContaining({ codi, ...extra });
const ascii = (text) => new TextEncoder().encode(text);
const deHex = (hex) => Uint8Array.from(hex.match(/../g) ?? [], (parell) => Number.parseInt(parell, 16));
const u16 = (uuid) => deHex(uuid.replaceAll('-', ''));
const aleatoris = (n) => cripto.getRandomValues(new Uint8Array(n));
const ajunta = (...trossos) => {
  const eixida = new Uint8Array(trossos.reduce((total, tros) => total + tros.length, 0));
  let i = 0;
  for (const tros of trossos) { eixida.set(tros, i); i += tros.length; }
  return eixida;
};
const sha256 = async (bytes) => new Uint8Array(await cripto.subtle.digest('SHA-256', bytes));
/* Una còpia d'uns bytes en base64url amb el byte `i` canviat. */
const giraByte = (text, i = 0) => {
  const bytes = deBase64url(text);
  bytes[i] ^= 0x01;
  return aBase64url(bytes);
};

const alta = (usuari = JO, extra = {}) => A.creaAlta(cripto, { usuari, creatMs: T0, ...OPC, ...extra });
/* La fila de xat_la_meua_identitat com la mapeja el transport (src/data/supabase/xatXifrat.js, mapejaClau). */
const registreDe = ({ identitat, publicacio }, extra = {}) => ({
  usuariId: null, kid: aBase64url(identitat.kid), sigPub: aBase64url(identitat.sigPub), dhPub: aBase64url(identitat.dhPub),
  declaracio: publicacio.declaracio, autofirma: publicacio.autofirma, kidAnterior: publicacio.kidAnterior,
  firmaContinuitat: publicacio.firmaContinuitat, creatAl: '2026-11-02T00:30:00Z', retiradaAl: null,
  copia: { ...publicacio.copia, kdf: 'PBKDF2-HMAC-SHA256', al: '2026-11-02T00:30:00Z' }, ...extra
});
const restaura = (registre, indexs, usuari = JO, minIteracions = MIN) => A.restauraAmbFrase(cripto, { usuari, registre, indexs, minIteracions });

/* Una parella P-256 nova en trossos de 32 B (d, x, y) i la seua pública, per a construir còpies a mà. */
async function trossosNous(nom) {
  const parella = nom === 'ECDSA' ? await generaParellaSignatura(cripto, { extraible: true }) : await generaParellaDh(cripto, { extraible: true });
  const jwk = await cripto.subtle.exportKey('jwk', parella.privateKey);
  return { d: deBase64url(jwk.d, 32), x: deBase64url(jwk.x, 32), y: deBase64url(jwk.y, 32), publica: await exportaPublica(cripto, parella.publicKey) };
}

/* Un WebCrypto de veres que apunta els bytes secrets que passen pel motor (el que entra a encrypt i a
   importKey('raw') d'AES-GCM o PBKDF2, el que ix de decrypt i dels deriveBits d'ECDH), compta les derivacions i
   les generacions de claus, i pot fer de motor defectuós: fallar la importació de PBKDF2, exportar una JWK privada
   (de l'algorisme `jwkIntrusa`) amb la «d» d'una altra clau o canviar un byte del xifrat de l'encriptació que tria `corromp(mida, n)`. */
function criptoEspia({ fallaPbkdf2 = false, jwkIntrusa = null, corromp = null } = {}) {
  const s = cripto.subtle;
  const secrets = [];
  const aleatoritzats = [];
  const compte = { pbkdf2: 0, generateKey: 0, aleatoris: 0 };
  const xifrats = new Map();
  const vista = (b) => (b instanceof ArrayBuffer ? new Uint8Array(b) : new Uint8Array(b.buffer, b.byteOffset, b.byteLength));
  const nomDe = (alg) => (typeof alg === 'string' ? alg : alg?.name);
  const subtle = {
    digest: (...a) => s.digest(...a),
    exportKey: async (format, clau) => {
      const eixida = await s.exportKey(format, clau);
      const nom = clau.algorithm?.name;
      if (format !== 'jwk' || clau.type !== 'private' || nom !== jwkIntrusa) return eixida;
      const intrusa = await s.generateKey({ name: nom, namedCurve: 'P-256' }, true, nom === 'ECDSA' ? ['sign', 'verify'] : ['deriveBits']);
      return { ...eixida, d: (await s.exportKey('jwk', intrusa.privateKey)).d };
    },
    sign: (...a) => s.sign(...a),
    verify: (...a) => s.verify(...a),
    deriveKey: (...a) => s.deriveKey(...a),
    unwrapKey: (...a) => s.unwrapKey(...a),
    wrapKey: (...a) => s.wrapKey(...a),
    generateKey: (...a) => { compte.generateKey += 1; return s.generateKey(...a); },
    importKey: (format, dades, alg, ...resta) => {
      const nom = nomDe(alg);
      if (nom === 'PBKDF2') {
        compte.pbkdf2 += 1;
        if (fallaPbkdf2) return Promise.reject(new Error('sonda'));
      }
      if (format === 'raw' && (nom === 'AES-GCM' || nom === 'PBKDF2')) secrets.push(vista(dades));
      return s.importKey(format, dades, alg, ...resta);
    },
    encrypt: async (alg, clau, dades) => {
      secrets.push(vista(dades));
      const eixida = await s.encrypt(alg, clau, dades);
      const n = (xifrats.get(dades.byteLength) ?? 0) + 1;
      xifrats.set(dades.byteLength, n);
      if (corromp?.(dades.byteLength, n)) new Uint8Array(eixida)[0] ^= 0x01;
      return eixida;
    },
    decrypt: async (...a) => { const eixida = await s.decrypt(...a); secrets.push(vista(eixida)); return eixida; },
    deriveBits: async (alg, ...resta) => {
      const eixida = await s.deriveBits(alg, ...resta);
      if (nomDe(alg) === 'ECDH') secrets.push(vista(eixida));
      return eixida;
    }
  };
  return {
    cripto: { subtle, getRandomValues: (a) => { compte.aleatoris += 1; aleatoritzats.push(a); return cripto.getRandomValues(a); } },
    compte, aleatoritzats,
    vius: () => secrets.filter((bytes) => bytes.some((byte) => byte !== 0)),
    nombreSecrets: () => secrets.length
  };
}

/* χ² de Pearson sobre 2.048 caselles i el llindar de p ≈ 10⁻⁶ amb 2.047 graus de llibertat (Wilson-Hilferty:
   2.047 · (1 − 2/(9·2.047) + 4,753 · √(2/(9·2.047)))³ ≈ 2.366). */
const LLINDAR_CHI2 = 2366;
function chi2(indexs) {
  const caselles = new Float64Array(2048);
  for (const index of indexs) caselles[index] += 1;
  const esperat = indexs.length / 2048;
  return caselles.reduce((suma, observat) => suma + ((observat - esperat) ** 2) / esperat, 0);
}

/* Un empaquetador propi de la prova: els índexs d'11 bits en una cadena de bits, big-endian, farcida amb zeros. */
function empaqueta(indexs) {
  const bits = indexs.map((index) => index.toString(2).padStart(11, '0')).join('').padEnd(72, '0');
  return Uint8Array.from(bits.match(/.{8}/g), (octet) => Number.parseInt(octet, 2));
}

/* Els formats de §5.1 empaquetats a mà, sense xifratXatFormats.js: si una refacció canviara l'AAD a les dues
   bandes del motor, les proves de dins no ho veurien i les còpies ja publicades deixarien d'obrir-se. */
const u32be = (n) => Uint8Array.of(n >>> 24, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
const aadSdpw = (usuari, kid, iteracions, sal) => ajunta(ascii('SDPW'), Uint8Array.of(0x01), u16(usuari), kid, u32be(iteracions), sal);
const aadSdpb = (usuari, kid) => ajunta(ascii('SDPB'), Uint8Array.of(0x01), u16(usuari), kid);
async function kekAMa(indexs, sal, iteracions, llistaVersio = 1) {
  const entrada = ajunta(ascii('SDPR'), Uint8Array.of(0x01, llistaVersio), empaqueta(Array.from(indexs)));
  const base = await cripto.subtle.importKey('raw', entrada, 'PBKDF2', false, ['deriveKey']);
  return cripto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracions }, base, { name: 'AES-GCM', length: 256 }, false,
    ['encrypt', 'decrypt']);
}
const obriCru = async (clau, iv, ct, aad) => new Uint8Array(await cripto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad }, clau, ct));
const xifraCru = async (clau, iv, pt, aad) => new Uint8Array(await cripto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, clau, pt));
const clauAesCrua = (bytes, usos) => cripto.subtle.importKey('raw', bytes, 'AES-GCM', false, usos);

/* Obri una còpia publicada ({ct, iv, rk_ct, rk_iv, sal, iteracions, llista}, base64url) amb WebCrypto cru: { rk, copia }. */
async function obriAMa({ usuari, kid, copia: c, indexs }) {
  const sal = deBase64url(c.sal, 16);
  const kek = await kekAMa(indexs, sal, c.iteracions, c.llista);
  const rk = await obriCru(kek, deBase64url(c.rk_iv, 12), deBase64url(c.rk_ct, 48), aadSdpw(usuari, kid, c.iteracions, sal));
  return { rk, copia: await obriCru(await clauAesCrua(rk, ['decrypt']), deBase64url(c.iv, 12), deBase64url(c.ct, 241), aadSdpb(usuari, kid)) };
}

/* Els trossos de la còpia en clar (§5.1): 0x01 ‖ d‖x‖y d'IK_sig ‖ d‖x‖y d'IK_dh ‖ K_ll, 225 B. */
const trossosCopia = (c) => ({
  versio: c[0], sigD: c.subarray(1, 33), sigX: c.subarray(33, 65), sigY: c.subarray(65, 97),
  dhD: c.subarray(97, 129), dhX: c.subarray(129, 161), dhY: c.subarray(161, 193), kll: c.subarray(193, 225)
});

/* Vector de regressió (§21.9 pas 5, només regressió): una publicació de creaAlta del 261102 amb 1.000
   iteracions, de la persona sintètica JO, oberta a part amb WebCrypto cru i els AAD de §5.1. Si deixa
   d'obrir-se, les còpies ja publicades tampoc no s'obririen: el format no es canvia sense versió nova. */
const VECTOR_PUBLICAT = Object.freeze({
  indexs: [1778, 1789, 427, 1340, 428, 544],
  kid: '0Lxe-tw0WGLsN6WEQuEuyA',
  sigPub: 'BDwt9ji7A3R_D85hskb2KUMAWQT2fFNv2eSCX0OZy1jAVOOh9zZR08FVJsXmNr5cn3hUDe437gaxPQgaHtXFnag',
  dhPub: 'BA2iAhpzfdCFY1lMYQxR46HGukV8pEnKNQNzevgiLStVW4tU8dm8NIuy8S2ZnNS1Tnj89Xnm8Cp4_iWpaH-_tOs',
  declaracio: 'U0RQSwFvHCo7TV5PYIp7nA0eLzpLBDwt9ji7A3R_D85hskb2KUMAWQT2fFNv2eSCX0OZy1jAVOOh9zZR08FVJsXmNr5cn3hUDe437gaxPQgaHtXFnag'
    + 'EDaICGnN90IVjWUxhDFHjoca6RXykSco1A3N6-CItK1Vbi1Tx2bw0i7LxLZmc1LVOePz1eebwKnj-Jalof7-06wAAAAAAAAAAAAAAAAAAAAAAAAGhmam7QA',
  autofirma: 'nKs7n9bkY19ny26vLAKL-ERwoKmJEkdMB6bJy9OeZl9kMRa3LKue8XFKQqnaIygCH_gaz_CMQT1WYmxEdtuwJQ',
  copia: Object.freeze({
    ct: 'TiMmOL6XCd3MwRvNAK_QAt4-NPHhewZV28cubbITvuHtQsoLCsNW5bBtzbQ-OAq-wYzNQRtBqO8q7ywglLyegRSeiH9GK9cF35wX1dZdkZBi8XmU4ujWnjVKYzFIaHum6Lvssg5YTc'
      + 'PUX9UDtjkkXfWXlR-nXfuO6PNx7uQ7CnTer57hBqGM-EyM5ipzA5tNcrbiU51V7quPvWeeDthfJxAVeM7dwIvxFxrL_OwySxuOcrJowrgQIoAUfSQnZRpwpxVmEokHcRCnz9PSMfe9DQ'
      + '9t9UP5T7PLJTmZILsozkMiuJFFHYJVFvihzhqzUP8xBw',
    iv: 'yu29fG4INTRAjs4D',
    rk_ct: 'CCIZ1TV9A90oHB3yqGPLpR7H658kAzKhWKF7QE0LKdso7tZzKfw0hGRhrX36oSFD',
    rk_iv: 'ICJlz7FTwK_l3GVR',
    sal: 'nLMDSLfoy7TTy8ymNDYmzw',
    iteracions: 1000,
    llista: 1
  })
});

describe('frontera, bandera i porta de la llista', () => {
  test('importa només les primitives i els formats; la llista, només amb import(); cap global ni bandera encesa', () => {
    const estatics = [...FONT.matchAll(/^import[\s\S]*?from\s+'([^']+)';/gm)].map((m) => m[1]);
    expect(estatics).toEqual(['./xifratXatCripto.js', './xifratXatFormats.js']);
    expect([...FONT.matchAll(/import\(\s*'([^']+)'\s*\)/g)].map((m) => m[1])).toEqual(['./xifratXatParaules.js']);
    expect(FONT).not.toMatch(/globalThis|Math\.random|window\.|localStorage|fetch\(/);
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  });

  test.runIf(!REVISADA_PEL_MESTRE)('DM-2: amb la llista pendent, ni l’alta ni la frase nova generen res', async () => {
    const espia = criptoEspia();
    await expect(A.creaAlta(espia.cripto, { usuari: JO, creatMs: T0, iteracions: MIN, minIteracions: MIN })).rejects.toThrow(ambCodi('LLISTA_PENDENT'));
    const { identitat } = await alta();
    await expect(A.fraseNova(espia.cripto, { rkLocal: identitat.recuperacio, usuari: JO, kid: identitat.kid, iteracions: MIN, minIteracions: MIN }))
      .rejects.toThrow(ambCodi('LLISTA_PENDENT'));
    expect(espia.compte).toEqual({ pbkdf2: 0, generateKey: 0, aleatoris: 0 });
  });
});

describe('la frase: índexs i entrada SDPR (§5.1-§5.2)', () => {
  test('sis índexs d’un sol getRandomValues injectat, amb la màscara de 11 bits', () => {
    const crides = [];
    const fals = { subtle: cripto.subtle, getRandomValues: (a) => { crides.push(a); a.set([0xffff, 0x0800, 0xf801, 0x07ff, 0x1234, 0x8000]); return a; } };
    const indexs = A.generaIndexsFrase(fals);
    expect(crides).toHaveLength(1);
    expect(crides[0]).toBeInstanceOf(Uint16Array);
    expect(indexs).toBe(crides[0]);
    expect([...indexs]).toEqual([2047, 0, 1, 2047, 0x234, 0]);
  });

  test('uniformes: χ² de 120.000 índexs per davall del llindar, i un generador amb biaix el supera', () => {
    const tots = [];
    for (let i = 0; i < 20000; i += 1) tots.push(...A.generaIndexsFrase(cripto));
    expect(chi2(tots)).toBeLessThan(LLINDAR_CHI2);
    const parell = { subtle: cripto.subtle, getRandomValues: (a) => { cripto.getRandomValues(a); for (let i = 0; i < a.length; i += 1) a[i] &= 0xfffe; return a; } };
    const enviciats = [];
    for (let i = 0; i < 20000; i += 1) enviciats.push(...A.generaIndexsFrase(parell));
    expect(chi2(enviciats)).toBeGreaterThan(LLINDAR_CHI2);
  });

  test('l’entrada SDPR byte a byte, igual des d’un Array o d’un Uint16Array; els índexs fora de forma no hi entren', () => {
    const indexs = [0, 2047, 1, 1024, 5, 2000];
    const entrada = A.entradaFrase({ indexs });
    expect(entrada).toEqual(ajunta(ascii('SDPR'), Uint8Array.of(0x01, 0x01), empaqueta(indexs)));
    expect(entrada).toHaveLength(15);
    expect(A.entradaFrase({ indexs: Uint16Array.from(indexs) })).toEqual(entrada);
    expect(A.entradaFrase({ indexs, llistaVersio: 2 })[5]).toBe(2);
    for (const dolents of [[1, 2, 3, 4, 5], [0, 0, 0, 0, 0, 2048], [0, 0, 0, 0, 0, -1], [0, 0, 0, 0, 0, 1.5]]) {
      expect(() => A.entradaFrase({ indexs: dolents })).toThrow(ambCodi('FORMAT_INVALID'));
    }
    expect(() => A.entradaFrase({ indexs: 'abella tonell' })).toThrow(ambCodi('INDEXS_INVALIDS'));
    expect(() => A.entradaFrase({ indexs, llistaVersio: 0 })).toThrow(ambCodi('FORMAT_INVALID'));
  });

  test('la mateixa entrada amb o sense accents, en majúscules i amb les tres grafies de l’ela geminada', async () => {
    const formes = [
      'abella tonell àbac xiquet vellut síndria',
      'ABELLA, Tonell; ABAC xiquet VELLUT sindria',
      'abel·la tonel·l àbac xiquet vel·lut síndria',
      'abeŀla toneŀl àbac xiquet veŀlut síndria',
      'abel.la tonel.l abac xiquet vel.lut sindria'
    ];
    const entrades = [];
    for (const forma of formes) entrades.push(A.entradaFrase({ indexs: await A.indexsDeText(forma) }));
    for (const entrada of entrades) expect(entrada).toEqual(entrades[0]);
    const indexs = await A.indexsDeText(formes[0]);
    expect(indexs).toBeInstanceOf(Uint16Array);
    expect(await A.paraulesDeFrase(indexs)).toEqual(['abella', 'tonell', 'àbac', 'xiquet', 'vellut', 'síndria']);
    await expect(A.indexsDeText('abella tonell àbac xiquet vellut')).rejects.toThrow(ambCodi('FRASE_LLARGARIA'));
    await expect(A.indexsDeText('abella tonell àbac xiquet vellut zzzz')).rejects.toThrow(ambCodi('PARAULA_DESCONEGUDA', { posicio: 5 }));
  });
});

describe('la KDF i les iteracions', () => {
  test('una sola derivació a 600.000 iteracions: el sòl per defecte és el de producció i les iteracions van a l’AAD', async () => {
    expect(ITERACIONS_KDF).toBe(600000);
    const entrada = A.entradaFrase({ indexs: [3, 1, 4, 1, 5, 9] });
    const sal = aleatoris(16);
    const rk = aleatoris(32);
    const kek = await A.kekDeFrase(cripto, { entrada, sal });
    expect(kek).toMatchObject({ extractable: false, algorithm: { name: 'AES-GCM', length: 256 } });
    const { iv, ct } = await A.embolcallaRk(cripto, { kek, rk, usuari: JO, kid: new Uint8Array(16).fill(7), sal });
    expect(ct).toHaveLength(48);
    expect(await A.obriRk(cripto, { kek, iv, ct, usuari: JO, kid: new Uint8Array(16).fill(7), sal })).toEqual(rk);
    // Amb la mateixa KEK (cap derivació nova), unes altres iteracions o una altra sal ja no quadren amb l'AAD.
    await expect(A.obriRk(cripto, { kek, iv, ct, usuari: JO, kid: new Uint8Array(16).fill(7), sal, iteracions: 600001 })).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    await expect(A.obriRk(cripto, { kek, iv, ct, usuari: JO, kid: new Uint8Array(16).fill(7), sal: aleatoris(16) })).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    expect(construeixAadEmbolcallRk({ usuari: JO, kid: new Uint8Array(16).fill(7), iteracions: 600000, sal }).subarray(37, 41))
      .toEqual(Uint8Array.of(0x00, 0x09, 0x27, 0xc0));
  });

  test('fora de rang abans de cap derivació: per davall del sòl, per damunt de 10.000.000, i mai per davall de 1.000', async () => {
    const espia = criptoEspia();
    const entrada = A.entradaFrase({ indexs: [1, 2, 3, 4, 5, 6] });
    const sal = aleatoris(16);
    const casos = [
      { iteracions: MIN }, { iteracions: 599999 }, { iteracions: 10000001 }, { iteracions: 999, minIteracions: 999 },
      { iteracions: 999, minIteracions: 1 }, { iteracions: '600000' }
    ];
    for (const cas of casos) await expect(A.kekDeFrase(espia.cripto, { entrada, sal, ...cas })).rejects.toThrow(ambCodi('ITERACIONS_FORA_DE_RANG'));
    await expect(A.creaAlta(espia.cripto, { usuari: JO, creatMs: T0, iteracions: MIN, permetLlistaPendent: true })).rejects.toThrow(ambCodi('ITERACIONS_FORA_DE_RANG'));
    const a = await alta();
    await expect(A.restauraAmbFrase(espia.cripto, { usuari: JO, registre: registreDe(a), indexs: a.indexs }))
      .rejects.toThrow(ambCodi('ITERACIONS_FORA_DE_RANG'));
    await expect(A.fraseNova(espia.cripto, { rkLocal: a.rkLocal, usuari: JO, kid: a.identitat.kid, iteracions: MIN, permetLlistaPendent: true }))
      .rejects.toThrow(ambCodi('ITERACIONS_FORA_DE_RANG'));
    expect(espia.compte.pbkdf2).toBe(0);
    expect(espia.compte.generateKey).toBe(0);
  });

  test('la KDF només deriva una entrada SDPR, mai el text de la frase; la sal fa 16 B', async () => {
    const sal = aleatoris(16);
    await expect(A.kekDeFrase(cripto, { entrada: ascii('abella tonell àb'), sal, ...OPC })).rejects.toThrow(ambCodi('ENTRADA_INVALIDA'));
    const quasi = A.entradaFrase({ indexs: [1, 2, 3, 4, 5, 6] });
    quasi[3] = 0x57;
    await expect(A.kekDeFrase(cripto, { entrada: quasi, sal, iteracions: MIN, minIteracions: MIN })).rejects.toThrow(ambCodi('ENTRADA_INVALIDA'));
    await expect(A.kekDeFrase(cripto, { entrada: A.entradaFrase({ indexs: [1, 2, 3, 4, 5, 6] }), sal: aleatoris(15), iteracions: MIN, minIteracions: MIN }))
      .rejects.toThrow(ambCodi('SAL_INVALIDA'));
  });
});

describe('l’alta (§5.4, primera fila)', () => {
  test('la publicació té la forma exacta de xat_publica_identitat i el kid és el que recalcula el servidor', async () => {
    const { identitat, publicacio, indexs } = await alta();
    expect(Object.keys(publicacio)).toEqual(['kidAnterior', 'declaracio', 'autofirma', 'firmaContinuitat', 'copia']);
    expect(Object.keys(publicacio.copia).sort()).toEqual(['ct', 'iteracions', 'iv', 'llista', 'rk_ct', 'rk_iv', 'sal']);
    const mides = { ct: 241, iv: 12, rk_ct: 48, rk_iv: 12, sal: 16 };
    for (const [camp, mida] of Object.entries(mides)) expect(deBase64url(publicacio.copia[camp], mida)).toHaveLength(mida);
    expect(publicacio.copia).toMatchObject({ iteracions: MIN, llista: 1 });
    expect(publicacio.kidAnterior).toBeNull();
    expect(publicacio.firmaContinuitat).toBeNull();
    // Els talls del SQL (2610290400): màgia 1-5, usuari 6-21, sigPub 22-86, dhPub 87-151, kidAnterior 152-167.
    const d = deBase64url(publicacio.declaracio, 175);
    expect(d.subarray(0, 5)).toEqual(ajunta(ascii('SDPK'), Uint8Array.of(1)));
    expect(d.subarray(5, 21)).toEqual(u16(JO));
    expect(d.subarray(21, 86)).toEqual(identitat.sigPub);
    expect(d.subarray(86, 151)).toEqual(identitat.dhPub);
    expect(d.subarray(151, 167)).toEqual(new Uint8Array(16));
    const kidServidor = (await sha256(ajunta(ascii('SDPI'), Uint8Array.of(1), u16(JO), identitat.sigPub, identitat.dhPub))).subarray(0, 16);
    expect(identitat.kid).toEqual(kidServidor);
    const v = await verificaDeclaracioClau(cripto, { declaracio: d, autofirma: deBase64url(publicacio.autofirma, 64), kidServit: kidServidor });
    expect(v.canvi).toBe(CANVI_CLAU.nova);
    expect(v.valors.creatMs).toBe(T0);
    expect(indexs).toBeInstanceOf(Uint16Array);
    expect(indexs).toHaveLength(6);
  });

  test('la identitat no és extraïble, el magatzem la desa i, després de recarregar, signa, deriva i dona una frase nova', async () => {
    const a = await alta();
    const { identitat } = a;
    expect(identitat.sigPriv).toMatchObject({ extractable: false, type: 'private', usages: ['sign'], algorithm: { name: 'ECDSA' } });
    expect(identitat.dhPriv).toMatchObject({ extractable: false, type: 'private', usages: ['deriveBits'], algorithm: { name: 'ECDH' } });
    expect(identitat.clauLlibreta).toMatchObject({ extractable: false, algorithm: { name: 'AES-GCM', length: 256 } });
    expect(identitat.recuperacio).toBe(a.rkLocal);
    expect(a.rkLocal.dk).toMatchObject({ extractable: false, algorithm: { name: 'AES-GCM', length: 256 } });
    await expect(cripto.subtle.exportKey('jwk', identitat.sigPriv)).rejects.toThrow();
    await expect(cripto.subtle.exportKey('jwk', identitat.dhPriv)).rejects.toThrow();

    const fals = creaIdbFalsEstructurat();
    const obri = () => creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T0 });
    expect(await obri().desaIdentitat(CI, identitat)).toBe(true);
    const llegida = await obri().identitat(CI);
    expect(llegida).toMatchObject({ usuari: JO, kid: identitat.kid, sigPub: identitat.sigPub, dhPub: identitat.dhPub, creatMs: T0 });
    const repte = aleatoris(32);
    expect(await verificaSignatura(cripto, identitat.sigPub, await signa(cripto, llegida.sigPriv, repte), repte)).toBe(true);
    const nova = await A.fraseNova(cripto, { rkLocal: llegida.recuperacio, usuari: JO, kid: identitat.kid, ...OPC });
    const r = await restaura(registreDe(a, { copia: { ...registreDe(a).copia, ...nova.frase } }), nova.indexs);
    expect(r.kid).toEqual(identitat.kid);
  });

  test('amb la identitat anterior, la continuïtat la signa la clau vella i el protocol la classifica com a canvi suau', async () => {
    const vella = (await alta()).identitat;
    const { identitat, publicacio } = await alta(JO, { anterior: vella, creatMs: T0 + 1 });
    expect(publicacio.kidAnterior).toBe(aBase64url(vella.kid));
    expect(deBase64url(publicacio.declaracio, 175).subarray(151, 167)).toEqual(vella.kid);
    const v = await verificaDeclaracioClau(cripto, {
      declaracio: deBase64url(publicacio.declaracio, 175), autofirma: deBase64url(publicacio.autofirma, 64),
      firmaContinuitat: deBase64url(publicacio.firmaContinuitat, 64), kidServit: identitat.kid,
      fixada: { usuari: JO, kid: vella.kid, sigPub: vella.sigPub, verificat: false }
    });
    expect(v.canvi).toBe(CANVI_CLAU.suau);
    await expect(alta(ALTRA, { anterior: vella })).rejects.toThrow(TypeError);
    const altra = (await alta()).identitat;
    await expect(alta(JO, { anterior: { ...vella, sigPriv: altra.sigPriv } })).rejects.toThrow(TypeError);
  });

  test('una persona o un creatMs que no són vàlids ixen abans de generar cap clau ni cap aleatori', async () => {
    const espia = criptoEspia();
    const crea = (extra) => A.creaAlta(espia.cripto, { usuari: JO, creatMs: T0, ...OPC, ...extra });
    for (const creatMs of [-1, 1.5, '0', undefined]) await expect(crea({ creatMs })).rejects.toThrow(TypeError);
    await expect(crea({ usuari: 'no-és-un-uuid' })).rejects.toThrow();
    expect(espia.compte).toEqual({ pbkdf2: 0, generateKey: 0, aleatoris: 0 });
  });

  test('si l’alta falla a mitges, els índexs i la RK ja generats es posen a zero', async () => {
    const espia = criptoEspia({ fallaPbkdf2: true });
    await expect(A.creaAlta(espia.cripto, { usuari: JO, creatMs: T0, ...OPC })).rejects.toThrow('sonda');
    const indexs = espia.aleatoritzats.filter((a) => a instanceof Uint16Array);
    expect(indexs).toHaveLength(1);
    expect([...indexs[0]]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(espia.nombreSecrets()).toBeGreaterThan(3);
    expect(espia.vius()).toEqual([]);
  });

  test('un motor defectuós falla tancat: cap publicació amb una privada que no és la seua, una còpia o un embolcall que no obririen', async () => {
    const amb = (opcions) => A.creaAlta(criptoEspia(opcions).cripto, { usuari: JO, creatMs: T0, ...OPC });
    // Node rebutja en importar una «d» d'ECDSA que no és de x, y, però accepta la d'ECDH: la comprova l'ECDH en els dos sentits.
    await expect(amb({ jwkIntrusa: 'ECDSA' })).rejects.toThrow(ambCodi('PARELLA_INVALIDA'));
    await expect(amb({ jwkIntrusa: 'ECDH' })).rejects.toThrow(ambCodi('PARELLA_INVALIDA'));
    // La còpia en clar fa 225 B; la primera RK de 32 B que es xifra és la de la frase (la de la DK va després).
    await expect(amb({ corromp: (mida) => mida === 225 })).rejects.toThrow(ambCodi('COPIA_INVALIDA'));
    await expect(amb({ corromp: (mida, n) => mida === 32 && n === 1 })).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    await expect(amb({ corromp: () => false })).resolves.toMatchObject({ identitat: { usuari: JO } });
  });
});

describe('la restauració en un aparell nou (§5.4, segona fila)', () => {
  test('mateixa identitat: obri el sobre que li havien segellat, signa per a la pública i la llibreta continua', async () => {
    const a = await alta();
    const r = await restaura(registreDe(a), a.indexs);
    expect(r).toMatchObject({ usuari: JO, kid: a.identitat.kid, sigPub: a.identitat.sigPub, dhPub: a.identitat.dhPub, creatMs: T0 });
    expect(r.sigPriv.extractable).toBe(false);
    expect(r.dhPriv.extractable).toBe(false);
    const info = infoHkdf('prova', aleatoris(8));
    const pt = aleatoris(32);
    const sobre = await segellaBase(cripto, { pkR: a.identitat.dhPub, info, pt });
    expect(await obriBase(cripto, { skR: r.dhPriv, pkR: r.dhPub, info, ...sobre })).toEqual(pt);
    const repte = aleatoris(16);
    expect(await verificaSignatura(cripto, a.identitat.sigPub, await signa(cripto, r.sigPriv, repte), repte)).toBe(true);
    const iv = aleatoris(12);
    const xifrat = await cripto.subtle.encrypt({ name: 'AES-GCM', iv }, a.identitat.clauLlibreta, pt);
    expect(new Uint8Array(await cripto.subtle.decrypt({ name: 'AES-GCM', iv }, r.clauLlibreta, xifrat))).toEqual(pt);
    // Una DK nova d'este aparell, que dona una frase nova sobre la mateixa RK.
    expect(r.recuperacio.dk).not.toBe(a.rkLocal.dk);
    const nova = await A.fraseNova(cripto, { rkLocal: r.recuperacio, usuari: JO, kid: r.kid, ...OPC });
    expect((await restaura(registreDe(a, { copia: { ...registreDe(a).copia, ...nova.frase } }), nova.indexs)).kid).toEqual(a.identitat.kid);
    const fals = creaIdbFalsEstructurat();
    const m = creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T0 });
    expect(await m.desaIdentitat(CI, r)).toBe(true);
  });

  test('des del text de la frase escrit sense accents i en majúscules', async () => {
    const a = await alta();
    const text = (await A.paraulesDeFrase(a.indexs)).join('  ').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
    expect((await restaura(registreDe(a), await A.indexsDeText(text))).kid).toEqual(a.identitat.kid);
  });

  test('una paraula errònia, o una altra versió de la llista, dona FRASE_ERRONIA i cap identitat', async () => {
    const a = await alta();
    for (let posicio = 0; posicio < 6; posicio += 1) {
      const indexs = Uint16Array.from(a.indexs);
      indexs[posicio] ^= 0x001;
      await expect(restaura(registreDe(a), indexs)).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    }
    const versio2 = registreDe(a, { copia: { ...registreDe(a).copia, llista: 2 } });
    await expect(restaura(versio2, a.indexs)).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
  });

  test('el servidor no pot canviar la sal, les iteracions, l’embolcall, la còpia ni el kid sense que es note', async () => {
    const a = await alta();
    const b = await alta();
    const base = registreDe(a);
    const ambCopia = (canvis) => ({ ...base, copia: { ...base.copia, ...canvis } });
    await expect(restaura(ambCopia({ sal: aBase64url(aleatoris(16)) }), a.indexs)).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    await expect(restaura(ambCopia({ iteracions: MIN + 1 }), a.indexs)).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    await expect(restaura(ambCopia({ rk_ct: giraByte(base.copia.rk_ct, 40) }), a.indexs)).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    await expect(restaura(ambCopia({ ct: giraByte(base.copia.ct, 100) }), a.indexs)).rejects.toThrow(ambCodi('COPIA_INVALIDA'));
    // La còpia d'una altra identitat del mateix compte, amb l'embolcall d'esta.
    await expect(restaura(ambCopia({ ct: b.publicacio.copia.ct, iv: b.publicacio.copia.iv }), a.indexs)).rejects.toThrow(ambCodi('COPIA_INVALIDA'));
    // La còpia i l'embolcall d'una altra identitat sota la declaració d'esta: l'AAD porta el kid, i ni la frase de l'altra obri res.
    const desB = { ...base, copia: { ...registreDe(b).copia } };
    await expect(restaura(desB, b.indexs)).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    await expect(restaura(desB, a.indexs)).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
  });

  test('la fila del servidor: la persona, l’autofirma, el kid i la forma, tot abans de cap derivació', async () => {
    const a = await alta();
    const altra = await alta(ALTRA);
    const base = registreDe(a);
    const espia = criptoEspia();
    const prova = (registre, motiu, opcions = { minIteracions: MIN }) => expect(A.restauraAmbFrase(espia.cripto, { usuari: JO, registre, indexs: a.indexs, ...opcions }))
      .rejects.toThrow(motiu === null ? ambCodi('ITERACIONS_FORA_DE_RANG') : ambCodi('REGISTRE_INVALID', { motiu }));
    await prova({ ...base, retiradaAl: '2026-11-02T00:31:00Z' }, 'retirada');
    await prova({ ...base, usuariId: ALTRA }, 'usuari');
    await prova(registreDe(altra), 'usuari');
    await prova({ ...base, autofirma: giraByte(base.autofirma, 10) }, 'autofirma');
    await prova({ ...base, kid: aBase64url(altra.identitat.kid) }, 'kid-no-quadra');
    await prova({ ...base, sigPub: aBase64url(altra.identitat.sigPub) }, 'kid-no-quadra');
    await prova({ ...base, dhPub: aBase64url(altra.identitat.dhPub) }, 'kid-no-quadra');
    await prova({ ...base, declaracio: `${base.declaracio}=` }, 'declaracio');
    await prova({ ...base, copia: { ...base.copia, sobrer: 1 } }, 'copia');
    const senseIv = { ...base.copia };
    delete senseIv.rk_iv;
    await prova({ ...base, copia: senseIv }, 'copia');
    await prova({ ...base, copia: { ...base.copia, ct: base.copia.ct.slice(0, -2) } }, 'copia');
    await prova({ ...base, copia: { ...base.copia, kdf: 'argon2id' } }, 'kdf');
    await prova({ ...base, copia: { ...base.copia, llista: 0 } }, 'llista');
    await prova({ ...base, copia: { ...base.copia, llista: 256 } }, 'llista');
    await prova({ ...base, copia: { ...base.copia, iteracions: '1000' } }, 'iteracions');
    await prova([base], 'forma');
    await prova(base, null, {});
    await prova({ ...base, copia: { ...base.copia, iteracions: 10000001 } }, null);
    expect(espia.compte.pbkdf2).toBe(0);
  });

  test('registreActiu tria la fila sense retirada_al, i només si n’hi ha just una', async () => {
    const a = await alta();
    const activa = registreDe(a);
    const retirada = { ...registreDe(a), retiradaAl: '2026-11-01T00:00:00Z', copia: null };
    expect(A.registreActiu([retirada, activa])).toBe(activa);
    // Una fila que no és un objecte pla no compta com a activa.
    expect(A.registreActiu([null, 'fila', [], activa])).toBe(activa);
    expect(() => A.registreActiu([retirada])).toThrow(ambCodi('REGISTRE_INVALID', { motiu: 'sense-activa' }));
    expect(() => A.registreActiu([activa, { ...activa }])).toThrow(ambCodi('REGISTRE_INVALID', { motiu: 'mes-d-una-activa' }));
    expect(() => A.registreActiu(null)).toThrow(ambCodi('REGISTRE_INVALID', { motiu: 'forma' }));
  });
});

describe('la còpia (§5.1) i la parella (CS-18)', () => {
  async function copiaDeProva(usuari = JO) {
    const sig = await trossosNous('ECDSA');
    const dh = await trossosNous('ECDH');
    const kid = await kidDe(cripto, { usuari, sigPub: sig.publica, dhPub: dh.publica });
    return { sig, dh, kid, rk: aleatoris(32), kll: aleatoris(32) };
  }

  test('la còpia d’una altra persona o d’un altre kid cau al desxifrat (l’AAD), abans del kid recalculat, i amb una RK errònia no s’obri', async () => {
    // La causa ha de ser el GCM (XIFRAT_MANIPULAT): si caiguera pel kid recalculat, l'AAD no protegiria res.
    const perAad = ambCodi('COPIA_INVALIDA', { cause: expect.objectContaining({ codi: 'XIFRAT_MANIPULAT' }) });
    const { sig, dh, kid, rk, kll } = await copiaDeProva();
    const { iv, ct } = await A.xifraCopia(cripto, { rk, usuari: JO, kid, sig, dh, kll });
    expect(ct).toHaveLength(241);
    const claus = await A.obriCopia(cripto, { rk, iv, ct, usuari: JO, kid });
    expect(claus.sigPub).toEqual(sig.publica);
    expect(claus.dhPub).toEqual(dh.publica);
    const llibreta = await cripto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(12) }, await cripto.subtle.importKey('raw', kll, 'AES-GCM', false, ['encrypt']), rk);
    expect(new Uint8Array(await cripto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(12) }, claus.clauLlibreta, llibreta))).toEqual(rk);
    await expect(A.obriCopia(cripto, { rk, iv, ct, usuari: ALTRA, kid })).rejects.toThrow(perAad);
    const altreKid = Uint8Array.from(kid);
    altreKid[15] ^= 1;
    await expect(A.obriCopia(cripto, { rk, iv, ct, usuari: JO, kid: altreKid })).rejects.toThrow(perAad);
    await expect(A.obriCopia(cripto, { rk: aleatoris(32), iv, ct, usuari: JO, kid })).rejects.toThrow(ambCodi('COPIA_INVALIDA'));
    await expect(A.obriCopia(cripto, { rk, iv, ct: ct.subarray(1), usuari: JO, kid })).rejects.toThrow(ambCodi('COPIA_INVALIDA'));
  });

  test('una còpia ben xifrada però amb les públiques d’un altre kid no es dona per bona', async () => {
    const { sig, dh, rk, kll } = await copiaDeProva();
    const altra = await copiaDeProva();
    // L'AAD diu el kid de l'altra, i les públiques de dins són les d'esta: el kid recalculat no quadra.
    const { iv, ct } = await A.xifraCopia(cripto, { rk, usuari: JO, kid: altra.kid, sig, dh, kll });
    await expect(A.obriCopia(cripto, { rk, iv, ct, usuari: JO, kid: altra.kid })).rejects.toThrow(ambCodi('COPIA_INVALIDA'));
  });

  test('una privada que no és de la seua pública: PARELLA_INVALIDA, a la còpia i comprovada directament', async () => {
    const { sig, dh, kid, rk, kll } = await copiaDeProva();
    const intrusa = await trossosNous('ECDSA');
    const intrusaDh = await trossosNous('ECDH');
    for (const [s, d] of [[{ ...sig, d: intrusa.d }, dh], [sig, { ...dh, d: intrusaDh.d }]]) {
      const { iv, ct } = await A.xifraCopia(cripto, { rk, usuari: JO, kid, sig: s, dh: d, kll });
      await expect(A.obriCopia(cripto, { rk, iv, ct, usuari: JO, kid })).rejects.toThrow(ambCodi('PARELLA_INVALIDA'));
    }
    const bona = await A.obriCopia(cripto, { rk, ...(await A.xifraCopia(cripto, { rk, usuari: JO, kid, sig, dh, kll })), usuari: JO, kid });
    const altra = await generaParellaDh(cripto);
    const altraSig = await generaParellaSignatura(cripto);
    expect(await A.comprovaParella(cripto, bona)).toBe(true);
    await expect(A.comprovaParella(cripto, { ...bona, dhPriv: altra.privateKey })).rejects.toThrow(ambCodi('PARELLA_INVALIDA'));
    await expect(A.comprovaParella(cripto, { ...bona, sigPriv: altraSig.privateKey })).rejects.toThrow(ambCodi('PARELLA_INVALIDA'));
    await expect(A.comprovaParella(cripto, { ...bona, sigPriv: bona.dhPriv })).rejects.toThrow(ambCodi('PARELLA_INVALIDA'));
  });
});

describe('els AAD i els bytes de la publicació, fixats fora del motor (§5.1, §21.9 pas 5)', () => {
  test('la publicació de creaAlta s’obri amb WebCrypto cru i els AAD SDPW i SDPB empaquetats a mà, i la còpia en clar és la de §5.1', async () => {
    const { identitat, publicacio, indexs } = await alta();
    const { rk, copia } = await obriAMa({ usuari: JO, kid: identitat.kid, copia: publicacio.copia, indexs });
    expect(rk).toHaveLength(32);
    expect(copia).toHaveLength(225);
    const t = trossosCopia(copia);
    expect(t.versio).toBe(0x01);
    expect(ajunta(Uint8Array.of(0x04), t.sigX, t.sigY)).toEqual(identitat.sigPub);
    expect(ajunta(Uint8Array.of(0x04), t.dhX, t.dhY)).toEqual(identitat.dhPub);
    // Cada «d» és al seu lloc: la de firma signa per a sigPub i la de DH deriva el mateix secret que dhPub.
    const jwk = (d, x, y) => ({ kty: 'EC', crv: 'P-256', d: aBase64url(d), x: aBase64url(x), y: aBase64url(y) });
    const sigPriv = await cripto.subtle.importKey('jwk', jwk(t.sigD, t.sigX, t.sigY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const repte = aleatoris(32);
    expect(await verificaSignatura(cripto, identitat.sigPub, await signa(cripto, sigPriv, repte), repte)).toBe(true);
    const ecdh = { name: 'ECDH', namedCurve: 'P-256' };
    const dhPriv = await cripto.subtle.importKey('jwk', jwk(t.dhD, t.dhX, t.dhY), ecdh, false, ['deriveBits']);
    const efimera = await cripto.subtle.generateKey(ecdh, false, ['deriveBits']);
    const meu = await cripto.subtle.deriveBits({ name: 'ECDH', public: efimera.publicKey }, dhPriv, 256);
    const seu = await cripto.subtle.deriveBits({ name: 'ECDH', public: await cripto.subtle.importKey('raw', identitat.dhPub, ecdh, false, []) },
      efimera.privateKey, 256);
    expect(new Uint8Array(meu)).toEqual(new Uint8Array(seu));
    // K_ll és la clau de la llibreta d'este aparell.
    const iv = aleatoris(12);
    const xifrat = await cripto.subtle.encrypt({ name: 'AES-GCM', iv }, await clauAesCrua(t.kll, ['encrypt']), repte);
    expect(new Uint8Array(await cripto.subtle.decrypt({ name: 'AES-GCM', iv }, identitat.clauLlibreta, xifrat))).toEqual(repte);
  });

  test('un embolcall i una còpia fets a mà amb els AAD de §5.1 es restauren: el motor llig el format, no només el que ell escriu', async () => {
    const a = await alta();
    const { kid } = a.identitat;
    const { copia } = await obriAMa({ usuari: JO, kid, copia: a.publicacio.copia, indexs: a.indexs });
    const rk = aleatoris(32);
    const indexs = Uint16Array.of(5, 1000, 2047, 0, 42, 1234);
    const sal = aleatoris(16);
    const rkIv = aleatoris(12);
    const rkCt = await xifraCru(await kekAMa(indexs, sal, MIN), rkIv, rk, aadSdpw(JO, kid, MIN, sal));
    const iv = aleatoris(12);
    const ct = await xifraCru(await clauAesCrua(rk, ['encrypt']), iv, copia, aadSdpb(JO, kid));
    const aMa = { ct: aBase64url(ct), iv: aBase64url(iv), rk_ct: aBase64url(rkCt), rk_iv: aBase64url(rkIv), sal: aBase64url(sal), iteracions: MIN, llista: 1 };
    const r = await restaura(registreDe(a, { copia: { ...registreDe(a).copia, ...aMa } }), indexs);
    expect(r).toMatchObject({ usuari: JO, kid, sigPub: a.identitat.sigPub, dhPub: a.identitat.dhPub, creatMs: T0 });
    // I les dues obertures soltes, amb la KEK que deriva el motor.
    const kek = await A.kekDeFrase(cripto, { entrada: A.entradaFrase({ indexs }), sal, iteracions: MIN, minIteracions: MIN });
    expect(await A.obriRk(cripto, { kek, iv: rkIv, ct: rkCt, usuari: JO, kid, iteracions: MIN, sal, minIteracions: MIN })).toEqual(rk);
    expect((await A.obriCopia(cripto, { rk, iv, ct, usuari: JO, kid })).dhPub).toEqual(a.identitat.dhPub);
  });

  test('el vector congelat (una publicació del 261102) continua restaurant-se, amb el motor i amb WebCrypto cru', async () => {
    const V = VECTOR_PUBLICAT;
    const registre = {
      usuariId: null, kid: V.kid, sigPub: V.sigPub, dhPub: V.dhPub, declaracio: V.declaracio, autofirma: V.autofirma, kidAnterior: null,
      firmaContinuitat: null, creatAl: '2026-11-02T00:30:00Z', retiradaAl: null, copia: { ...V.copia, kdf: 'PBKDF2-HMAC-SHA256', al: '2026-11-02T00:30:00Z' }
    };
    const r = await restaura(registre, Uint16Array.from(V.indexs));
    expect(r).toMatchObject({ usuari: JO, creatMs: T0 });
    expect([aBase64url(r.kid), aBase64url(r.sigPub), aBase64url(r.dhPub)]).toEqual([V.kid, V.sigPub, V.dhPub]);
    const { rk, copia } = await obriAMa({ usuari: JO, kid: deBase64url(V.kid, 16), copia: V.copia, indexs: V.indexs });
    expect(rk).toHaveLength(32);
    const t = trossosCopia(copia);
    expect([t.versio, aBase64url(ajunta(Uint8Array.of(0x04), t.sigX, t.sigY)), aBase64url(ajunta(Uint8Array.of(0x04), t.dhX, t.dhY))])
      .toEqual([0x01, V.sigPub, V.dhPub]);
  });
});

describe('la frase nova sense canviar d’identitat (§5.4, D-07 a)', () => {
  test('mateixa identitat i mateixa còpia; la frase vella ja no obri l’embolcall nou', async () => {
    const a = await alta();
    const { frase, indexs } = await A.fraseNova(cripto, { rkLocal: a.rkLocal, usuari: JO, kid: a.identitat.kid, ...OPC });
    expect(Object.keys(frase).sort()).toEqual(['iteracions', 'llista', 'rk_ct', 'rk_iv', 'sal']);
    expect(frase.sal).not.toBe(a.publicacio.copia.sal);
    const registre = registreDe(a, { copia: { ...registreDe(a).copia, ...frase } });
    expect(registre.copia.ct).toBe(a.publicacio.copia.ct);
    expect((await restaura(registre, indexs)).kid).toEqual(a.identitat.kid);
    await expect(restaura(registre, a.indexs)).rejects.toThrow(ambCodi('FRASE_ERRONIA'));
  });

  test('la RK local d’una altra identitat o tocada no s’obri', async () => {
    const a = await alta();
    const b = await alta();
    const opc = { usuari: JO, kid: a.identitat.kid, ...OPC };
    await expect(A.fraseNova(cripto, { ...opc, rkLocal: b.rkLocal })).rejects.toThrow(ambCodi('RK_LOCAL_INVALIDA'));
    await expect(A.fraseNova(cripto, { ...opc, usuari: ALTRA, rkLocal: a.rkLocal })).rejects.toThrow(ambCodi('RK_LOCAL_INVALIDA'));
    const tocada = { ...a.rkLocal, rk: Uint8Array.from(a.rkLocal.rk, (byte, i) => (i === 0 ? byte ^ 1 : byte)) };
    await expect(A.fraseNova(cripto, { ...opc, rkLocal: tocada })).rejects.toThrow(ambCodi('RK_LOCAL_INVALIDA'));
    await expect(A.fraseNova(cripto, { ...opc, rkLocal: { dk: a.rkLocal.dk } })).rejects.toThrow(ambCodi('RK_LOCAL_INVALIDA'));
  });

  test('si la frase nova falla a mitges, els índexs ja generats i la RK d’este aparell es posen a zero', async () => {
    const a = await alta();
    const espia = criptoEspia({ fallaPbkdf2: true });
    await expect(A.fraseNova(espia.cripto, { rkLocal: a.rkLocal, usuari: JO, kid: a.identitat.kid, ...OPC })).rejects.toThrow('sonda');
    const indexs = espia.aleatoritzats.filter((x) => x instanceof Uint16Array);
    expect(indexs).toHaveLength(1);
    expect([...indexs[0]]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(espia.compte.pbkdf2).toBe(1);
    expect(espia.nombreSecrets()).toBeGreaterThan(0);
    expect(espia.vius()).toEqual([]);
  });
});

describe('cap secret viu en acabar (millor esforç, §4.3)', () => {
  test('l’alta, la restauració, la frase nova i una frase errònia deixen a zero la RK, K_ll, la còpia en clar, l’entrada i els secrets DH', async () => {
    const espiaAlta = criptoEspia();
    const a = await A.creaAlta(espiaAlta.cripto, { usuari: JO, creatMs: T0, ...OPC });
    expect(espiaAlta.nombreSecrets()).toBeGreaterThan(8);
    expect(espiaAlta.vius()).toEqual([]);

    const espiaRestaura = criptoEspia();
    await A.restauraAmbFrase(espiaRestaura.cripto, { usuari: JO, registre: registreDe(a), indexs: a.indexs, minIteracions: MIN });
    expect(espiaRestaura.nombreSecrets()).toBeGreaterThan(6);
    expect(espiaRestaura.vius()).toEqual([]);

    const espiaNova = criptoEspia();
    await A.fraseNova(espiaNova.cripto, { rkLocal: a.rkLocal, usuari: JO, kid: a.identitat.kid, ...OPC });
    expect(espiaNova.nombreSecrets()).toBeGreaterThan(3);
    expect(espiaNova.vius()).toEqual([]);

    const espiaErronia = criptoEspia();
    const indexs = Uint16Array.from(a.indexs, (index, i) => (i === 0 ? index ^ 1 : index));
    await expect(A.restauraAmbFrase(espiaErronia.cripto, { usuari: JO, registre: registreDe(a), indexs, minIteracions: MIN }))
      .rejects.toThrow(ambCodi('FRASE_ERRONIA'));
    expect(espiaErronia.nombreSecrets()).toBeGreaterThan(0);
    expect(espiaErronia.vius()).toEqual([]);
  });
});
