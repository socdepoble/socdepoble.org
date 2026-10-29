// @vitest-environment node
/* Les primitives del xifratge d'extrem a extrem dels xats (P1-12 / IDEA-19,
   disseny final §4.1, §4.2, §4.4, §4.6 i §15.1; pas 2 de §16). WebCrypto de
   veres: el de Node (globalThis.crypto). Els vectors de resposta coneguda són
   BLOQUEJANTS: si un no passa, res que en depenga no es pica. Viuen a
   xifratXatCripto.vectors.json, copiats mecànicament de les fonts el 261029
   (cap valor escrit a mà); FONTS, ací baix, en fixa la URL i el SHA-256 del
   fitxer baixat, i la primera prova comprova que el JSON cita exactament eixes:
     · HPKE: RFC 9180 A.3.1 (AES-128-GCM, l'AEAD canviat a 0x0001) i el
       test-vectors.json del CFRG que cita l'RFC (també AES-256-GCM, 0x0002, la
       suite exacta del protocol);
     · HKDF: RFC 5869 A.1 i A.3 (la sal buida = 32 zeros);
     · PBKDF2-HMAC-SHA256: RFC 7914 §11;
     · AES-256-GCM: NIST CAVP gcmtestvectors.zip (els casos 13 i 14 de McGrew i
       Viega de §15.1 no s'han pogut baixar de cap font oficial: la URL del NIST
       torna 404; CAVP és el vector oficial del NIST);
     · ECDH P-256: RFC 5903 §8.1; corba: RFC 5903 §3.1;
     · ECDSA P-256: RFC 6979 A.2.5 (verificació);
     · base64: RFC 4648 §10;
     · número de seguretat: el vector fingerprint_test_v1 de libsignal.
   Les iteracions de PBKDF2 tenen el sòl del cofre (MIN_ITERACIONS_PROVES) i
   una sola prova va a 600.000. Dades sintètiques. */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import vectors from './xifratXatCripto.vectors.json';
import {
  BLOC_MISSATGE, BYTES_IV, BYTES_SAL, CORBA_P256, ETIQUETES_HPKE, HPKE, ITERACIONS_KDF, ITERACIONS_NUMERO, MAX_ITERACIONS, MAX_MISSATGE_FARCIT,
  MIN_ITERACIONS_PROVES, aBase64url, ajunta, aleatori, bytesIguals, creaCriptoXat, deBase64url, derivaBitsHkdf, derivaClauAesHkdf,
  desxifraAesGcm, empremtaNumerica, esPuntP256, exigixCripto, exportaPublica, farcixMissatge, farcixPadme, generaParellaDh,
  generaParellaSignatura, hkdfExpand, hkdfExtract, hmacSha256, horariBase, importaClauAesGcm, importaClauHkdf, importaPublicaDh,
  infoHkdf, jwkDePublica, kekPbkdf2, labeledExpand, labeledExtract, llevaFarcimentMissatge, llevaFarcimentPadme, midaPadme,
  numeroDelParell, numeroSeguretatParell, numeroSeguretatPersona, obriBase, obriBaseAClauHkdf, pbkdf2Sha256, publicaDeJwk,
  secretCompartitDhkem, secretDh, segellaBase, sha256, signa, suiteIdHpke, suiteIdKem, uuid16, verificaSignatura, xifraAesGcm,
  xifresEmpremta
} from './xifratXatCripto.js';

const cripto = globalThis.crypto;
const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
const BUIT = new Uint8Array(0);

/* Les fonts dels vectors: URL i SHA-256 del fitxer baixat (261029). */
const FONTS = Object.freeze({
  base64_rfc4648: ['https://www.rfc-editor.org/rfc/rfc4648.txt', '84e14418f795d503be5f34bf23ce4ebaa119e9ec7c9f667d8caeb111385b178f'],
  hkdf_rfc5869: ['https://www.rfc-editor.org/rfc/rfc5869.txt', '7a40eb3835b35fc947eb12a2ed614db079d43b26e50dbc537c31fba16397089c'],
  pbkdf2_rfc7914: ['https://www.rfc-editor.org/rfc/rfc7914.txt', 'df55932f8b6a5d271f36a634d91a25903724e189ba6c120bf7257cd47f10b197'],
  aes256gcm_cavp: ['https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip',
    'f9fc479e134cde2980b3bb7cddbcb567b2cd96fd753835243ed067699f26a023'],
  ecdh_rfc5903: ['https://www.rfc-editor.org/rfc/rfc5903.txt', '939fab548a6e6bb49a5b3c4dd24a3c5df54a46645447b2d6f4df4fd88ff2d69f'],
  ecdsa_rfc6979: ['https://www.rfc-editor.org/rfc/rfc6979.txt', '456e8f17558fdbd206f968b96fc6f1b4a71ea331ab30ad17f711ab3adaa7d701'],
  hpke_rfc9180_a31: ['https://www.rfc-editor.org/rfc/rfc9180.txt', 'f45a8b7c30231b26d668b1e8168074e5ab514b174d656b67e859895117f1f8f6'],
  hpke_cfrg: ['https://raw.githubusercontent.com/cfrg/draft-irtf-cfrg-hpke/5f503c564da00b0687b3de75f1dfbdfc4079ad31/test-vectors.json',
    '61fc662f01996cd06d713dacf5e133167bd309a1f329442d53f1e21a47b3ede6'],
  empremta_libsignal: ['https://raw.githubusercontent.com/signalapp/libsignal/ff71b2a00080c1c2fec08c11c292372797f101f6/rust/protocol/src/fingerprint.rs',
    '65341e810bd7736e26467d8b0479934484d04d78c19d02675057650310d07302']
});

const hex = (text) => Uint8Array.from(text.match(/../g) ?? [], (parell) => Number.parseInt(parell, 16));
const aHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const ascii = (text) => new TextEncoder().encode(text);
const ambCodi = (codi) => expect.objectContaining({ codi });
const ALFABET_B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/* Una privada ECDH d'un vector (l'escalar i la seua pública en brut), no extraïble. */
function privadaEcdh(escalar, publica) {
  const punt = hex(publica);
  const jwk = { kty: 'EC', crv: 'P-256', d: aBase64url(hex(escalar)), x: aBase64url(punt.subarray(1, 33)), y: aBase64url(punt.subarray(33)) };
  return cripto.subtle.importKey('jwk', jwk, ECDH, false, ['deriveBits']);
}

/* El cripto de l'entorn amb un generateKey espiat; amb `parella`, torna eixa parella (l'efímera d'un vector). */
function criptoEspiat(parella) {
  const crides = [];
  const s = cripto.subtle;
  const subtle = Object.fromEntries(['digest', 'importKey', 'exportKey', 'deriveBits', 'deriveKey', 'encrypt', 'decrypt', 'sign', 'verify', 'unwrapKey']
    .map((metode) => [metode, (...args) => s[metode](...args)]));
  subtle.generateKey = async (algorisme, extraible, usos) => {
    crides.push({ algorisme, extraible, usos });
    return parella ?? s.generateKey(algorisme, extraible, usos);
  };
  return { crides, cripto: { subtle, getRandomValues: (bytes) => cripto.getRandomValues(bytes) } };
}

/* DeriveKeyPair de DHKEM(P-256) (RFC 9180 §7.1.3): només l'escalar, per a provar els etiquetats del KEM. */
async function escalarDeIkm(ikm) {
  const suite = suiteIdKem();
  const dkpPrk = await labeledExtract(cripto, suite, BUIT, 'dkp_prk', ikm);
  for (let comptador = 0; comptador < 256; comptador += 1) {
    const candidat = await labeledExpand(cripto, suite, dkpPrk, 'candidate', Uint8Array.of(comptador), 32);
    const escalar = BigInt(`0x${aHex(candidat)}`);
    if (escalar !== 0n && escalar < CORBA_P256.n) return candidat;
  }
  throw new Error('DeriveKeyPair sense candidat');
}

/* El nonce de la seqüència: base_nonce XOR I2OSP(seq, 12). */
function nonceDe(baseNonce, seq) {
  const nonce = Uint8Array.from(baseNonce);
  for (let i = nonce.length - 1, resta = seq; resta > 0; i -= 1, resta = Math.floor(resta / 256)) nonce[i] ^= resta % 256;
  return nonce;
}

async function puntAleatori() {
  const parella = await generaParellaDh(cripto);
  return { parella, raw: await exportaPublica(cripto, parella.publicKey) };
}

/* Una clau HKDF d'un vector, de qualsevol mida: importaClauHkdf només admet les 32 B del protocol. */
const clauHkdfDeVector = (bytes) => cripto.subtle.importKey('raw', bytes, 'HKDF', false, ['deriveBits', 'deriveKey']);

/* El cripto de l'entorn amb un generador que torna `iv`: l'única manera de fixar l'IV de GCM (els vectors). */
const criptoAmbIv = (iv) => ({ subtle: cripto.subtle, getRandomValues: (bytes) => { bytes.set(iv); return bytes; } });

/* Un subtle de l'entorn que passa cada crida per `vigila(nom, args, eixida)`. */
function subtleVigilat(vigila) {
  return new Proxy(cripto.subtle, {
    get(objectiu, nom) {
      const metode = objectiu[nom];
      if (typeof metode !== 'function') return metode;
      return async (...args) => vigila(nom, args, await metode.apply(objectiu, args));
    }
  });
}

/* Un motor laxe (§15.18): importKey accepta les públiques `dolentes` i en torna una de vàlida, i
   apunta cada una que li arriba. Si el mòdul les valida abans, no n'arriba cap. */
async function criptoLax(dolentes) {
  const bona = await exportaPublica(cripto, (await generaParellaDh(cripto)).publicKey);
  const marques = new Set(dolentes.map(aHex));
  const colades = [];
  const subtle = new Proxy(cripto.subtle, {
    get(objectiu, nom) {
      const metode = objectiu[nom];
      if (nom !== 'importKey') return typeof metode === 'function' ? metode.bind(objectiu) : metode;
      return (format, dades, ...resta) => {
        if (format === 'raw' && marques.has(aHex(new Uint8Array(dades)))) {
          colades.push(resta[0]?.name);
          return objectiu.importKey(format, bona, ...resta);
        }
        return objectiu.importKey(format, dades, ...resta);
      };
    }
  });
  return { colades, cripto: { subtle, getRandomValues: (bytes) => cripto.getRandomValues(bytes) } };
}

/* Els secrets en brut que passen per JavaScript, per tipus: les eixides d'ECDH, les claus en brut
   d'HMAC i AES, els nonces de GCM i les entrades i eixides d'HMAC. `vius` diu quins no s'han posat
   a zero. */
function criptoVigilat() {
  const vistos = { dh: [], clau: [], nonce: [], entrada: [], eixida: [] };
  const subtle = subtleVigilat((nom, args, eixida) => {
    if (nom === 'deriveBits' && args[0]?.name === 'ECDH') vistos.dh.push(new Uint8Array(eixida));
    if (nom === 'importKey' && args[0] === 'raw' && ['HMAC', 'AES-GCM'].includes(args[2]?.name)) vistos.clau.push(args[1]);
    if (nom === 'encrypt' || nom === 'decrypt') vistos.nonce.push(args[0].iv);
    if (nom === 'unwrapKey') vistos.nonce.push(args[3].iv);
    if (nom === 'sign' && args[0] === 'HMAC') {
      vistos.entrada.push(args[2]);
      vistos.eixida.push(new Uint8Array(eixida));
    }
    return eixida;
  });
  const vius = (...tipus) => tipus.flatMap((nomTipus) => vistos[nomTipus].filter((bytes) => bytes.some((byte) => byte !== 0)).map(() => nomTipus));
  return { vistos, vius, cripto: { subtle, getRandomValues: (bytes) => cripto.getRandomValues(bytes) } };
}

const potMod = (base, exponent, modul) => {
  let resultat = 1n;
  for (let b = base % modul, e = exponent; e > 0n; e >>= 1n, b = (b * b) % modul) if (e & 1n) resultat = (resultat * b) % modul;
  return resultat;
};
const deBig = (n) => hex(n.toString(16).padStart(64, '0'));

/* Un punt de P-256 amb una y xicoteta, perquè y + p càpia en 32 B (la codificació no canònica de la
   y). La x és l'única arrel de f = x³ − 3x + b − y² (mod p) quan mcd(f, x^p − x) en F_p[x] és de
   grau 1; amb 0 o 3 arrels es prova la y següent. */
function puntAmbYXicoteta() {
  const { p, b } = CORBA_P256;
  const md = (v) => ((v % p) + p) % p;
  const inv = (v) => potMod(v, p - 2n, p);
  const grau = (q) => q.findLastIndex((coeficient) => coeficient !== 0n);
  const residu = (a, d) => {
    const r = [...a];
    const gd = grau(d);
    for (let gr = grau(r); gr >= gd; gr = grau(r)) {
      const factor = md(r[gr] * inv(d[gd]));
      for (let i = 0; i <= gd; i += 1) r[gr - gd + i] = md(r[gr - gd + i] - factor * d[i]);
    }
    return r;
  };
  for (let y = 1n; y < 64n; y += 1n) {
    const c = md(b - y * y);
    // Producte mòdul f, amb x³ = 3x − c i x⁴ = 3x² − cx.
    const producte = ([a0, a1, a2], [b0, b1, b2]) => {
      const [d0, d1, d2, d3, d4] = [a0 * b0, a0 * b1 + a1 * b0, a0 * b2 + a1 * b1 + a2 * b0, a1 * b2 + a2 * b1, a2 * b2];
      return [md(d0 - c * d3), md(d1 + 3n * d3 - c * d4), md(d2 + 3n * d4)];
    };
    let xp = [1n, 0n, 0n];
    for (let e = p, base = [0n, 1n, 0n]; e > 0n; e >>= 1n, base = producte(base, base)) if (e & 1n) xp = producte(xp, base);
    let [u, v] = [[c, md(-3n), 0n, 1n], [xp[0], md(xp[1] - 1n), xp[2]]];
    while (grau(v) >= 0) [u, v] = [v, residu(u, v)];
    if (grau(u) === 1) return { x: md(-u[0] * inv(u[1])), y };
  }
  throw new Error('Cap punt amb y < 64');
}

describe('l’entorn, la injecció i la puresa del mòdul', () => {
  test('hi ha WebCrypto, i creaCriptoXat el pren de l’entorn per defecte', async () => {
    expect(exigixCripto(cripto)).toBe(cripto);
    const xat = creaCriptoXat();
    expect(Object.isFrozen(xat)).toBe(true);
    expect(aHex(await xat.sha256(ascii('abc')))).toBe(aHex(await sha256(cripto, ascii('abc'))));
    expect(xat.aBase64url(Uint8Array.of(255))).toBe('_w');
  });

  test('sense WebCrypto complet falla tancat: SENSE_CRIPTO', async () => {
    for (const dolent of [null, undefined, {}, { subtle: {} }, { subtle: cripto.subtle }, { getRandomValues: () => null, subtle: { digest: () => null } }]) {
      expect(() => exigixCripto(dolent)).toThrow(ambCodi('SENSE_CRIPTO'));
    }
    expect(() => creaCriptoXat(null)).toThrow(ambCodi('SENSE_CRIPTO'));
    await expect(sha256(null, BUIT)).rejects.toEqual(ambCodi('SENSE_CRIPTO'));
    await expect(segellaBase({}, { pkR: new Uint8Array(65), info: BUIT, pt: BUIT })).rejects.toEqual(ambCodi('SENSE_CRIPTO'));
    expect(() => aleatori({ subtle: cripto.subtle }, 4)).toThrow(ambCodi('SENSE_CRIPTO'));
  });

  test('el mòdul és pur: cap import, cap Math.random, cap emmagatzematge ni xarxa, un sol global (el defecte de creaCriptoXat)', () => {
    const font = readFileSync(new URL('./xifratXatCripto.js', import.meta.url), 'utf8');
    expect(font).not.toMatch(/^\s*import\s/m);
    expect(font).not.toMatch(/Math\.random|localStorage|indexedDB|fetch\(|XMLHttpRequest|document\./);
    expect(font.match(/globalThis/g)).toHaveLength(2);
    expect(font).toMatch(/export function creaCriptoXat\(cripto = globalThis\.crypto\)/);
  });

  test('la porta no dona els secrets d’HPKE en brut ni deixa fixar l’IV de GCM', async () => {
    const xat = creaCriptoXat();
    for (const nom of ['secretDh', 'secretCompartitDhkem', 'horariBase']) expect(xat[nom], nom).toBeUndefined();
    expect(typeof xat.segellaBase).toBe('function');
    const clau = await xat.importaClauAesGcm(xat.aleatori(32));
    const zeros = new Uint8Array(BYTES_IV);
    // Una opció ivFix (la dels vectors d'abans) no fa res: l'IV és sempre del generador.
    const [a, b] = [await xat.xifraAesGcm(clau, { dades: BUIT, ivFix: zeros }), await xat.xifraAesGcm(clau, { dades: BUIT, ivFix: zeros })];
    expect(aHex(a.iv)).not.toBe(aHex(b.iv));
    expect(aHex(a.iv)).not.toBe(aHex(zeros));
  });

  test('el motor no rep el que el mòdul ja rebutja: cada motor no rebutja igual (§15.18)', async () => {
    const crides = [];
    const subtle = new Proxy(cripto.subtle, {
      get(objectiu, nom) {
        const metode = objectiu[nom];
        return typeof metode === 'function' ? (...args) => { crides.push(nom); return metode.apply(objectiu, args); } : metode;
      }
    });
    const comptat = { subtle, getRandomValues: (bytes) => cripto.getRandomValues(bytes) };
    const clau = await importaClauAesGcm(cripto, aleatori(cripto, 32));
    const manipulat = ambCodi('XIFRAT_MANIPULAT');
    await expect(desxifraAesGcm(comptat, clau, { xifrat: new Uint8Array(32), iv: new Uint8Array(16) })).rejects.toEqual(manipulat);
    await expect(desxifraAesGcm(comptat, clau, { xifrat: new Uint8Array(15), iv: new Uint8Array(BYTES_IV) })).rejects.toEqual(manipulat);
    const firmant = await generaParellaSignatura(cripto);
    expect(await verificaSignatura(comptat, firmant.publicKey, new Uint8Array(63), ascii('SDPK'))).toBe(false);
    const receptor = await puntAleatori();
    const sobre = await segellaBase(cripto, { pkR: receptor.raw, info: BUIT, pt: aleatori(cripto, 32) });
    const entrada = { skR: receptor.parella.privateKey, pkR: receptor.raw, enc: sobre.enc, info: BUIT, ct: sobre.ct.subarray(0, 47) };
    await expect(obriBaseAClauHkdf(comptat, entrada)).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    await expect(segellaBase(comptat, { pkR: receptor.raw, info: BUIT, pt: BUIT, aead: 0x0003 })).rejects.toEqual(ambCodi('SUITE_DESCONEGUDA'));
    expect(crides).toEqual([]);
    // L'atzar: el límit és el del mòdul (RangeError), no el del motor (QuotaExceededError a Node).
    expect(() => aleatori(cripto, 65537)).toThrow(RangeError);
  });
});

describe('vectors de resposta coneguda (bloquejants)', () => {
  test('cada grup de vectors cita la seua font: URL i SHA-256 del fitxer baixat', () => {
    for (const [grup, [url, hash]] of Object.entries(FONTS)) {
      expect(vectors[grup]?.font, grup).toMatchObject({ url, sha256: hash });
    }
    expect(Object.keys(vectors).filter((clau) => clau !== 'descripcio').sort()).toEqual(Object.keys(FONTS).sort());
  });

  test('base64url: RFC 4648 §10 amb l’alfabet url i sense «=»', () => {
    expect(vectors.base64_rfc4648.casos).toHaveLength(7);
    for (const [text, base64] of vectors.base64_rfc4648.casos) {
      const url = base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
      expect(aBase64url(ascii(text)), text).toBe(url);
      expect(new TextDecoder().decode(deBase64url(url)), text).toBe(text);
    }
  });

  test('HKDF-SHA256: RFC 5869 A.1 i A.3 amb l’Extract i l’Expand fets a mà i amb l’HKDF natiu', async () => {
    const [a1, a3] = vectors.hkdf_rfc5869.casos;
    expect(a3.salt).toBe('');
    for (const cas of [a1, a3]) {
      const prk = await hkdfExtract(cripto, hex(cas.salt), hex(cas.ikm));
      expect(aHex(prk), cas.nom).toBe(cas.prk);
      expect(aHex(await hkdfExpand(cripto, prk, hex(cas.info), cas.L)), cas.nom).toBe(cas.okm);
      const clau = await clauHkdfDeVector(hex(cas.ikm));
      expect(aHex(await derivaBitsHkdf(cripto, clau, hex(cas.salt), hex(cas.info), cas.L)), cas.nom).toBe(cas.okm);
    }
    // A.3: la sal buida és 32 zeros (WebCrypto no admet una clau HMAC buida).
    expect(aHex(await hkdfExtract(cripto, new Uint8Array(32), hex(a3.ikm)))).toBe(a3.prk);
  });

  test('PBKDF2-HMAC-SHA256: RFC 7914 §11 (c = 80.000) per damunt del sòl; c = 1 no passa el sòl', async () => {
    const [c1, c80000] = vectors.pbkdf2_rfc7914.casos;
    expect(c80000.c).toBe(80000);
    const dk = await pbkdf2Sha256(cripto, ascii(c80000.P), ascii(c80000.S), { iteracions: c80000.c, minIteracions: MIN_ITERACIONS_PROVES, bytes: c80000.dkLen });
    expect(aHex(dk)).toBe(c80000.dk);
    expect(c1.c).toBe(1);
    await expect(pbkdf2Sha256(cripto, ascii(c1.P), ascii(c1.S), { iteracions: c1.c, minIteracions: 1, bytes: c1.dkLen }))
      .rejects.toEqual(ambCodi('ITERACIONS_FORA_DE_RANG'));
  });

  test('AES-256-GCM: NIST CAVP (IV de 96 bits, etiqueta de 128) en les dues direccions, i el cas FAIL', async () => {
    const { xifrat, desxifrat } = vectors.aes256gcm_cavp;
    expect(xifrat).toHaveLength(5);
    for (const cas of xifrat) {
      const clau = await importaClauAesGcm(cripto, hex(cas.key));
      const { iv, xifrat: eixida } = await xifraAesGcm(criptoAmbIv(hex(cas.iv)), clau, { dades: hex(cas.pt), aad: hex(cas.aad) });
      expect(aHex(iv)).toBe(cas.iv);
      expect(aHex(eixida), `línia ${cas.linia}`).toBe(cas.ct + cas.tag);
      expect(aHex(await desxifraAesGcm(cripto, clau, { xifrat: eixida, aad: hex(cas.aad), iv }))).toBe(cas.pt);
    }
    const [bo, dolent] = desxifrat;
    expect([bo.falla, dolent.falla]).toEqual([false, true]);
    const clauBona = await importaClauAesGcm(cripto, hex(bo.key));
    expect(aHex(await desxifraAesGcm(cripto, clauBona, { xifrat: hex(bo.ct + bo.tag), aad: hex(bo.aad), iv: hex(bo.iv) }))).toBe(bo.pt);
    const clauDolenta = await importaClauAesGcm(cripto, hex(dolent.key));
    await expect(desxifraAesGcm(cripto, clauDolenta, { xifrat: hex(dolent.ct + dolent.tag), aad: hex(dolent.aad), iv: hex(dolent.iv) }))
      .rejects.toEqual(ambCodi('XIFRAT_MANIPULAT'));
  });

  test('ECDH P-256: RFC 5903 §8.1, en els dos sentits, amb els punts validats', async () => {
    const v = vectors.ecdh_rfc5903;
    const gi = hex(`04${v.gix}${v.giy}`);
    const gr = hex(`04${v.grx}${v.gry}`);
    for (const punt of [gi, gr, hex(`04${v.girx}${v.giry}`)]) expect(esPuntP256(punt)).toBe(true);
    expect(aHex(await secretDh(cripto, await privadaEcdh(v.i, aHex(gi)), gr))).toBe(v.girx);
    expect(aHex(await secretDh(cripto, await privadaEcdh(v.r, aHex(gr)), gi))).toBe(v.girx);
  });

  test('la corba del mòdul és la de l’RFC 5903 §3.1, i el generador hi és', () => {
    const { corba } = vectors.ecdh_rfc5903;
    expect(CORBA_P256.p.toString(16).padStart(64, '0')).toBe(corba.p);
    expect(CORBA_P256.b.toString(16).padStart(64, '0')).toBe(corba.b);
    expect(CORBA_P256.n.toString(16).padStart(64, '0')).toBe(corba.n);
    expect(corba.n).toBe(vectors.ecdsa_rfc6979.q);
    expect(esPuntP256(hex(`04${corba.gx}${corba.gy}`))).toBe(true);
  });

  test('ECDSA P-256/SHA-256: verifica les signatures de l’RFC 6979 A.2.5, i cap manipulació', async () => {
    const v = vectors.ecdsa_rfc6979;
    const publica = hex(`04${v.ux}${v.uy}`);
    for (const { missatge, r, s } of v.firmes) {
      const firma = hex(r + s);
      expect(await verificaSignatura(cripto, publica, firma, ascii(missatge)), missatge).toBe(true);
      expect(await verificaSignatura(cripto, publica, firma, ascii(`${missatge}!`))).toBe(false);
      const girada = Uint8Array.from(firma);
      girada[63] ^= 1;
      expect(await verificaSignatura(cripto, publica, girada, ascii(missatge))).toBe(false);
      // Mal·leable: (r, n − s) també verifica. Per això una signatura mai no és un identificador (§4.1).
      const sMalleable = (CORBA_P256.n - BigInt(`0x${s}`)).toString(16).padStart(64, '0');
      expect(await verificaSignatura(cripto, publica, hex(r + sMalleable), ascii(missatge))).toBe(true);
    }
  });

  test('HPKE: RFC 9180 A.3.1 i l’entrada AES-128-GCM del CFRG són el mateix vector', () => {
    const rfc = vectors.hpke_rfc9180_a31;
    const cfrg = vectors.hpke_cfrg.suites.find((suite) => suite.aead_id === HPKE.AEAD_AES_128_GCM);
    for (const camp of ['mode', 'kem_id', 'kdf_id', 'aead_id', 'info', 'ikmE', 'pkEm', 'skEm', 'ikmR', 'pkRm', 'skRm', 'enc', 'shared_secret',
      'key_schedule_context', 'secret', 'key', 'base_nonce', 'exporter_secret']) {
      expect(rfc[camp], camp).toBe(cfrg[camp]);
    }
    expect(rfc.encryptions).toEqual(cfrg.encryptions);
  });

  test('número de seguretat: l’empremta de libsignal (fingerprint_test_v1, 5.200 iteracions)', async () => {
    const v = vectors.empremta_libsignal;
    expect(v.iteracions).toBe(ITERACIONS_NUMERO);
    const alice = await empremtaNumerica(cripto, hex(v.alice.clau), ascii(v.alice.id), v.iteracions);
    const bob = await empremtaNumerica(cripto, hex(v.bob.clau), ascii(v.bob.id), v.iteracions);
    expect(aHex(alice.subarray(0, 32))).toBe(v.alice.primers32);
    expect(aHex(bob.subarray(0, 32))).toBe(v.bob.primers32);
    const [xa, xb] = [xifresEmpremta(alice), xifresEmpremta(bob)];
    expect(xa < xb ? xa + xb : xb + xa).toBe(v.mostra);
    // La primera volta porta la clau dues vegades: la fórmula de §4.4 amb una sola no casa amb libsignal.
    const clau = hex(v.alice.clau);
    let h = new Uint8Array(await cripto.subtle.digest('SHA-512', ajunta(Uint8Array.of(0, 0), clau, ascii(v.alice.id))));
    for (let i = 1; i < v.iteracions; i += 1) h = new Uint8Array(await cripto.subtle.digest('SHA-512', ajunta(h, clau)));
    expect(aHex(h.subarray(0, 32))).not.toBe(v.alice.primers32);
  });
});

const SUITES_HPKE = [
  ['RFC 9180 A.3.1, AES-128-GCM', vectors.hpke_rfc9180_a31],
  ['CFRG, AES-128-GCM', vectors.hpke_cfrg.suites[0]],
  ['CFRG, AES-256-GCM (la suite del protocol)', vectors.hpke_cfrg.suites[1]]
];

describe.each(SUITES_HPKE)('HPKE base, DHKEM(P-256, HKDF-SHA256), HKDF-SHA256: %s', (_nom, v) => {
  const opcions = { aead: v.aead_id };
  const [primer] = v.encryptions;

  test('la suite és la de l’RFC (mode 0, KEM 0x0010, KDF 0x0001) i els suite_id quadren', () => {
    expect([v.mode, v.kem_id, v.kdf_id]).toEqual([HPKE.MODE_BASE, HPKE.KEM_P256_HKDF_SHA256, HPKE.KDF_HKDF_SHA256]);
    expect(aHex(suiteIdKem())).toBe(aHex(ascii('KEM\u0000\u0010')));
    expect(aHex(suiteIdHpke(v.aead_id))).toBe(aHex(ajunta(ascii('HPKE\u0000\u0010\u0000\u0001\u0000'), Uint8Array.of(v.aead_id))));
    expect(primer.seq).toBe(0);
  });

  test('DeriveKeyPair: LabeledExtract("dkp_prk") i LabeledExpand("candidate") donen skEm i skRm', async () => {
    expect(aHex(await escalarDeIkm(hex(v.ikmE)))).toBe(v.skEm);
    expect(aHex(await escalarDeIkm(hex(v.ikmR)))).toBe(v.skRm);
  });

  test('Decap: el DH (en els dos sentits) i el shared_secret', async () => {
    const dh = await secretDh(cripto, await privadaEcdh(v.skRm, v.pkRm), hex(v.pkEm));
    expect(aHex(await secretDh(cripto, await privadaEcdh(v.skEm, v.pkEm), hex(v.pkRm)))).toBe(aHex(dh));
    expect(aHex(await secretCompartitDhkem(cripto, dh, hex(v.enc), hex(v.pkRm)))).toBe(v.shared_secret);
  });

  test('l’horari de claus: key_schedule_context, secret, key, base_nonce (i exporter_secret per «exp»)', async () => {
    const horari = await horariBase(cripto, hex(v.shared_secret), hex(v.info), opcions);
    expect(aHex(horari.context)).toBe(v.key_schedule_context);
    expect(aHex(horari.secret)).toBe(v.secret);
    expect(aHex(horari.key)).toBe(v.key);
    expect(aHex(horari.baseNonce)).toBe(v.base_nonce);
    expect(aHex(await labeledExpand(cripto, suiteIdHpke(v.aead_id), horari.secret, 'exp', horari.context, 32))).toBe(v.exporter_secret);
    expect(Object.values(ETIQUETES_HPKE)).toEqual(['eae_prk', 'shared_secret', 'psk_id_hash', 'info_hash', 'secret', 'key', 'base_nonce']);
  });

  test('SealBase amb l’efímera del vector dona l’enc i el ct de la seqüència 0', async () => {
    const parella = { privateKey: await privadaEcdh(v.skEm, v.pkEm), publicKey: await cripto.subtle.importKey('raw', hex(v.pkEm), ECDH, true, []) };
    const espia = criptoEspiat(parella);
    const { enc, ct } = await segellaBase(espia.cripto, { pkR: hex(v.pkRm), info: hex(v.info), aad: hex(primer.aad), pt: hex(primer.pt), ...opcions });
    expect(aHex(enc)).toBe(v.enc);
    expect(aHex(ct)).toBe(primer.ct);
    expect(espia.crides).toEqual([{ algorisme: ECDH, extraible: false, usos: ['deriveBits'] }]);
  });

  test('OpenBase dona el pt de la seqüència 0, i la key i el base_nonce donen tots els xifrats del vector', async () => {
    const skR = await privadaEcdh(v.skRm, v.pkRm);
    const pt = await obriBase(cripto, { skR, pkR: hex(v.pkRm), enc: hex(v.enc), info: hex(v.info), aad: hex(primer.aad), ct: hex(primer.ct), ...opcions });
    expect(aHex(pt)).toBe(primer.pt);
    const clau = await cripto.subtle.importKey('raw', hex(v.key), 'AES-GCM', false, ['encrypt']);
    expect(v.encryptions.map((xifrat) => xifrat.seq)).toEqual([0, 1, 2, 4, 255, 256]);
    for (const xifrat of v.encryptions) {
      const nonce = nonceDe(hex(v.base_nonce), xifrat.seq);
      expect(aHex(nonce), `seq ${xifrat.seq}`).toBe(xifrat.nonce);
      const eixida = await cripto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: hex(xifrat.aad), tagLength: 128 }, clau, hex(xifrat.pt));
      expect(aHex(new Uint8Array(eixida)), `seq ${xifrat.seq}`).toBe(xifrat.ct);
    }
  });

  test('l’obertura per unwrapKey cap a HKDF dona una clau no extraïble amb el pt del vector dins', async () => {
    const skR = await privadaEcdh(v.skRm, v.pkRm);
    const clau = await obriBaseAClauHkdf(cripto, {
      skR, pkR: hex(v.pkRm), enc: hex(v.enc), info: hex(v.info), aad: hex(primer.aad), ct: hex(primer.ct), bytesClau: hex(primer.pt).length, ...opcions
    });
    expect(clau.extractable).toBe(false);
    expect(clau.algorithm.name).toBe('HKDF');
    expect([...clau.usages].sort()).toEqual(['deriveBits', 'deriveKey']);
    const sal = ascii('sal');
    const info = infoHkdf('prova');
    const esperat = await derivaBitsHkdf(cripto, await clauHkdfDeVector(hex(primer.pt)), sal, info, 32);
    expect(aHex(await derivaBitsHkdf(cripto, clau, sal, info, 32))).toBe(aHex(esperat));
  });
});

describe('HPKE: anada i tornada amb claus noves i manipulació', () => {
  async function escenari() {
    const receptor = await puntAleatori();
    const ck = aleatori(cripto, 32);
    const info = ajunta(ascii('SDPS'), Uint8Array.of(1), aleatori(cripto, 82));
    const sobre = await segellaBase(cripto, { pkR: receptor.raw, info, pt: ck });
    const entrada = { skR: receptor.parella.privateKey, pkR: receptor.raw, enc: sobre.enc, info, ct: sobre.ct };
    return { receptor, ck, info, sobre, entrada };
  }

  test('la CK de 32 B: ct de 48 B, enc de 65 B, i s’obri en bytes i directa a HKDF', async () => {
    const { ck, sobre, entrada } = await escenari();
    expect(sobre.ct).toHaveLength(48);
    expect(sobre.enc).toHaveLength(65);
    expect(esPuntP256(sobre.enc)).toBe(true);
    expect(aHex(await obriBase(cripto, entrada))).toBe(aHex(ck));
    const clau = await obriBaseAClauHkdf(cripto, entrada);
    await expect(cripto.subtle.exportKey('raw', clau)).rejects.toThrow();
    const info = infoHkdf('compromis-epoca', Uint8Array.of(0, 0, 0, 1));
    const sal = aleatori(cripto, 16);
    expect(aHex(await derivaBitsHkdf(cripto, clau, sal, info, 32))).toBe(aHex(await derivaBitsHkdf(cripto, await importaClauHkdf(cripto, ck), sal, info, 32)));
  });

  test('cada sobre porta una efímera nova i no extraïble; el mateix text no dona el mateix sobre', async () => {
    const receptor = await puntAleatori();
    const espia = criptoEspiat();
    const pt = aleatori(cripto, 32);
    const a = await segellaBase(espia.cripto, { pkR: receptor.raw, info: BUIT, pt });
    const b = await segellaBase(espia.cripto, { pkR: receptor.raw, info: BUIT, pt });
    expect(espia.crides).toHaveLength(2);
    for (const crida of espia.crides) expect(crida).toEqual({ algorisme: ECDH, extraible: false, usos: ['deriveBits'] });
    expect(aHex(a.enc)).not.toBe(aHex(b.enc));
    expect(aHex(a.ct)).not.toBe(aHex(b.ct));
  });

  test('manipular l’enc, la info, l’AAD, el ct, la clau o el receptor: SOBRE_INVALID', async () => {
    const { info, entrada } = await escenari();
    const altre = await puntAleatori();
    const invalid = ambCodi('SOBRE_INVALID');
    const giraBit = (bytes, posicio) => {
      const copia = Uint8Array.from(bytes);
      copia[posicio] ^= 1;
      return copia;
    };
    const casos = [
      { ...entrada, enc: giraBit(entrada.enc, 64) }, // fora de la corba
      { ...entrada, enc: altre.raw }, // un altre punt vàlid
      { ...entrada, info: giraBit(info, 10) },
      { ...entrada, aad: Uint8Array.of(1) },
      { ...entrada, ct: giraBit(entrada.ct, 0) },
      { ...entrada, ct: giraBit(entrada.ct, 47) },
      { ...entrada, skR: altre.parella.privateKey },
      { ...entrada, pkR: altre.raw } // kem_context d'un altre receptor
    ];
    for (const [i, cas] of casos.entries()) {
      await expect(obriBase(cripto, cas), `cas ${i}`).rejects.toEqual(invalid);
      await expect(obriBaseAClauHkdf(cripto, cas), `cas ${i}`).rejects.toEqual(invalid);
    }
    await expect(obriBaseAClauHkdf(cripto, { ...entrada, ct: entrada.ct.subarray(0, 47) })).rejects.toEqual(invalid);
    await expect(obriBase(cripto, { ...entrada, aead: HPKE.AEAD_AES_128_GCM })).rejects.toEqual(invalid);
  });

  test('amb un motor laxe, cap pública fora de la corba ni no canònica arriba a importKey (corba invàlida, §15.18)', async () => {
    const { entrada } = await escenari();
    const { p, b } = CORBA_P256;
    const fora = Uint8Array.from(entrada.enc);
    fora[64] ^= 1;
    const noCanonic = ajunta(Uint8Array.of(4), deBig(p), deBig(potMod(b, (p + 1n) / 4n, p)));
    const lax = await criptoLax([fora, noCanonic]);
    // El motor laxe de veres s'empassa els punts dolents: si el mòdul no validara, es veuria ací.
    await lax.cripto.subtle.importKey('raw', fora, ECDH, true, []);
    expect(lax.colades).toEqual(['ECDH']);
    lax.colades.length = 0;
    const { privateKey } = await generaParellaDh(cripto);
    const firmant = await generaParellaSignatura(cripto);
    const firma = await signa(cripto, firmant.privateKey, ascii('SDPK'));
    for (const dolent of [fora, noCanonic]) {
      await expect(obriBase(lax.cripto, { ...entrada, enc: dolent })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
      await expect(obriBaseAClauHkdf(lax.cripto, { ...entrada, enc: dolent })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
      await expect(segellaBase(lax.cripto, { pkR: dolent, info: BUIT, pt: BUIT })).rejects.toEqual(ambCodi('PUNT_INVALID'));
      await expect(secretDh(lax.cripto, privateKey, dolent)).rejects.toEqual(ambCodi('PUNT_INVALID'));
      await expect(verificaSignatura(lax.cripto, dolent, firma, ascii('SDPK'))).rejects.toEqual(ambCodi('PUNT_INVALID'));
    }
    expect(lax.colades).toEqual([]);
  });

  test('els secrets en brut de JavaScript (DH, claus d’HMAC i AES, entrades d’HMAC) queden a zero en segellar i obrir', async () => {
    const receptor = await puntAleatori();
    const info = ajunta(ascii('SDPS'), Uint8Array.of(1), aleatori(cripto, 82));
    const ck = aleatori(cripto, 32);
    const segella = criptoVigilat();
    const sobre = await segellaBase(segella.cripto, { pkR: receptor.raw, info, pt: ck });
    expect(segella.vistos.dh).toHaveLength(1);
    expect(segella.vistos.clau.length).toBeGreaterThan(4);
    expect(segella.vistos.entrada.length).toBeGreaterThan(6);
    expect(segella.vistos.nonce).toHaveLength(1);
    expect(segella.vius('dh', 'clau', 'nonce', 'entrada')).toEqual([]);
    // Els bytes de qui crida no es toquen.
    expect(ck.some((byte) => byte !== 0)).toBe(true);
    const entrada = { skR: receptor.parella.privateKey, pkR: receptor.raw, enc: sobre.enc, info, ct: sobre.ct };
    for (const obri of [obriBase, obriBaseAClauHkdf]) {
      const vigilat = criptoVigilat();
      await obri(vigilat.cripto, entrada);
      expect([vigilat.vistos.dh.length, vigilat.vistos.nonce.length], obri.name).toEqual([1, 1]);
      expect(vigilat.vius('dh', 'clau', 'nonce', 'entrada'), obri.name).toEqual([]);
    }
    // HKDF-Expand de 3 blocs: cada bloc porta T(i − 1) i cada T(i) és OKM.
    const expand = criptoVigilat();
    expect(await hkdfExpand(expand.cripto, aleatori(cripto, 32), ascii('info'), 80)).toHaveLength(80);
    expect(expand.vistos.entrada).toHaveLength(3);
    expect(expand.vius('entrada', 'eixida')).toEqual([]);
  });

  test('segellar per a un punt invàlid: PUNT_INVALID; un AEAD que no és del protocol: SUITE_DESCONEGUDA', async () => {
    const { raw } = await puntAleatori();
    const fora = Uint8Array.from(raw);
    fora[64] ^= 1;
    await expect(segellaBase(cripto, { pkR: fora, info: BUIT, pt: BUIT })).rejects.toEqual(ambCodi('PUNT_INVALID'));
    await expect(segellaBase(cripto, { pkR: raw.subarray(0, 33), info: BUIT, pt: BUIT })).rejects.toEqual(ambCodi('PUNT_INVALID'));
    for (const aead of [0x0003, 0xffff, 0]) {
      await expect(segellaBase(cripto, { pkR: raw, info: BUIT, pt: BUIT, aead })).rejects.toEqual(ambCodi('SUITE_DESCONEGUDA'));
    }
    expect(() => suiteIdHpke(0x0003)).toThrow(ambCodi('SUITE_DESCONEGUDA'));
  });
});

describe('base64url canònic', () => {
  test('anada i tornada de totes les mides xicotetes, sense «=» ni «+/»', () => {
    for (let n = 0; n < 40; n += 1) {
      const bytes = aleatori(cripto, n);
      const text = aBase64url(bytes);
      expect(text).toMatch(/^[A-Za-z0-9_-]*$/);
      expect(aHex(deBase64url(text))).toBe(aHex(bytes));
    }
    expect(aBase64url(Uint8Array.of(0xfb, 0xff))).toBe('-_8');
  });

  test('el no canònic es rebutja: farciment, alfabet estàndard, llargària impossible i bits sobrers', () => {
    expect(aHex(deBase64url('AA'))).toBe('00');
    expect(aHex(deBase64url('AAA'))).toBe('0000');
    // «AB» i «AAB» dirien els mateixos bytes que «AA» i «AAA» (G-13).
    for (const dolent of ['AB', 'AP', 'AAB', 'AAD', '_x', 'AA==', 'Zg==', 'a+b/', 'A', 'AAAAA', ' AAA', 'AA\n', 42, null]) {
      expect(() => deBase64url(dolent), String(dolent)).toThrow(ambCodi('BASE64URL_INVALID'));
    }
    expect(deBase64url(aBase64url(new Uint8Array(32)), 32)).toHaveLength(32);
    expect(() => deBase64url(aBase64url(new Uint8Array(31)), 32)).toThrow(ambCodi('BASE64URL_INVALID'));
  });
});

describe('uuid16, punts P-256 i JWK pública estricta', () => {
  test('uuid16: només el canònic en minúscules', () => {
    expect(aHex(uuid16('0a0a0a0a-0000-4000-8000-00000000000a'))).toBe('0a0a0a0a000040008000' + '00000000000a');
    for (const dolent of ['0A0A0A0A-0000-4000-8000-00000000000A', '0a0a0a0a00004000800000000000000a', '{0a0a0a0a-0000-4000-8000-00000000000a}', '', null]) {
      expect(() => uuid16(dolent), String(dolent)).toThrow(ambCodi('UUID_INVALID'));
    }
  });

  test('es rebutgen els punts fora de la corba, comprimits, de mida errònia o amb coordenades ≥ p', async () => {
    const { raw } = await puntAleatori();
    expect(esPuntP256(raw)).toBe(true);
    const p = hex(CORBA_P256.p.toString(16));
    const casos = {
      'y alterada': (() => { const c = Uint8Array.from(raw); c[64] ^= 1; return c; })(),
      comprimit02: ajunta(Uint8Array.of(2), raw.subarray(1, 33)),
      comprimit03: ajunta(Uint8Array.of(3), raw.subarray(1, 33)),
      'prefix 0x06': ajunta(Uint8Array.of(6), raw.subarray(1)),
      '64 B': raw.subarray(1),
      '66 B': ajunta(raw, Uint8Array.of(0)),
      zeros: ajunta(Uint8Array.of(4), new Uint8Array(64)),
      'x = p, fora de la corba': ajunta(Uint8Array.of(4), p, raw.subarray(33)),
      'y = p, fora de la corba': ajunta(raw.subarray(0, 33), p)
    };
    for (const [nom, punt] of Object.entries(casos)) {
      expect(esPuntP256(punt), nom).toBe(false);
      await expect(importaPublicaDh(cripto, punt), nom).rejects.toEqual(ambCodi('PUNT_INVALID'));
    }
    // El motor també rebutja el de fora de la corba (es prova a cada motor: §15.18).
    await expect(cripto.subtle.importKey('raw', casos['y alterada'], ECDH, true, [])).rejects.toThrow();
    expect(esPuntP256([...raw])).toBe(false);
  });

  test('coordenades menors que p: la mateixa x o y més p, que la corba mòdul p acceptaria, es rebutja', async () => {
    const { p, b } = CORBA_P256;
    // (0, √b) és de la corba (p ≡ 3 mod 4: √b = b^((p+1)/4)); 04 ‖ p ‖ √b n'és la x no canònica.
    const y0 = potMod(b, (p + 1n) / 4n, p);
    expect((y0 * y0) % p).toBe(b);
    // Un punt de y xicoteta: 04 ‖ x ‖ y + p n'és la y no canònica.
    const { x, y } = puntAmbYXicoteta();
    expect(y + p < 2n ** 256n).toBe(true);
    expect(esPuntP256(ajunta(Uint8Array.of(4), new Uint8Array(32), deBig(y0)))).toBe(true);
    expect(esPuntP256(ajunta(Uint8Array.of(4), deBig(x), deBig(y)))).toBe(true);
    const noCanonics = { 'x + p': [deBig(p), deBig(y0)], 'y + p': [deBig(x), deBig(y + p)] };
    for (const [nom, [bx, by]] of Object.entries(noCanonics)) {
      const punt = ajunta(Uint8Array.of(4), bx, by);
      expect(esPuntP256(punt), nom).toBe(false);
      await expect(importaPublicaDh(cripto, punt), nom).rejects.toEqual(ambCodi('PUNT_INVALID'));
      expect(() => publicaDeJwk({ kty: 'EC', crv: 'P-256', x: aBase64url(bx), y: aBase64url(by) }), nom).toThrow(ambCodi('PUNT_INVALID'));
    }
  });

  test('les parelles es generen no extraïbles si no es demana extraible: true, literal', async () => {
    for (const genera of [generaParellaDh, generaParellaSignatura]) {
      expect((await genera(cripto)).privateKey.extractable, genera.name).toBe(false);
      for (const extraible of ['sí', 1, 'true', {}]) expect((await genera(cripto, { extraible })).privateKey.extractable, String(extraible)).toBe(false);
      expect((await genera(cripto, { extraible: true })).privateKey.extractable).toBe(true);
    }
  });

  test('la JWK pública: exactament {kty, crv, x, y}, anada i tornada', async () => {
    const { raw } = await puntAleatori();
    const jwk = jwkDePublica(raw);
    expect(Object.keys(jwk).sort()).toEqual(['crv', 'kty', 'x', 'y']);
    expect(jwk).toMatchObject({ kty: 'EC', crv: 'P-256' });
    expect(aHex(publicaDeJwk(jwk))).toBe(aHex(raw));
    expect(aHex(publicaDeJwk(JSON.parse(JSON.stringify(jwk))))).toBe(aHex(raw));
  });

  test('la JWK amb «d» es rebutja sempre (JWK_AMB_PRIVADA), també la que exporta el motor', async () => {
    const parella = await generaParellaDh(cripto, { extraible: true });
    const privada = await cripto.subtle.exportKey('jwk', parella.privateKey);
    expect(privada.d).toBeTruthy();
    expect(() => publicaDeJwk(privada)).toThrow(ambCodi('JWK_AMB_PRIVADA'));
    const neta = jwkDePublica(await exportaPublica(cripto, parella.publicKey));
    expect(() => publicaDeJwk({ ...neta, d: privada.d })).toThrow(ambCodi('JWK_AMB_PRIVADA'));
    expect(() => publicaDeJwk({ ...neta, d: undefined })).toThrow(ambCodi('JWK_AMB_PRIVADA'));
  });

  test('qualsevol altra forma: JWK_INVALID; fora de la corba: PUNT_INVALID', async () => {
    const parella = await generaParellaDh(cripto, { extraible: true });
    const neta = jwkDePublica(await exportaPublica(cripto, parella.publicKey));
    const motor = await cripto.subtle.exportKey('jwk', parella.publicKey);
    const x = deBase64url(neta.x);
    // El mateix x amb el bit sobrer de l'últim caràcter a 1: WebCrypto l'accepta, ací no (G-13).
    const xNoCanonic = `${neta.x.slice(0, -1)}${ALFABET_B64URL[ALFABET_B64URL.indexOf(neta.x.at(-1)) ^ 1]}`;
    const dolentes = [
      motor, // porta ext i key_ops
      { ...neta, kid: '1' }, { ...neta, use: 'enc' }, { kty: 'EC', crv: 'P-256', x: neta.x },
      { ...neta, kty: 'RSA' }, { ...neta, crv: 'P-384' }, { ...neta, x: aBase64url(x.subarray(1)) }, { ...neta, x: `${neta.x}=` },
      { ...neta, x: xNoCanonic }, { ...neta, x: x }, Object.assign(Object.create({ heretat: 1 }), neta), [neta], 'jwk', null
    ];
    for (const [i, dolent] of dolentes.entries()) expect(() => publicaDeJwk(dolent), `cas ${i}`).toThrow(ambCodi('JWK_INVALID'));
    const y = deBase64url(neta.y);
    y[31] ^= 1;
    expect(() => publicaDeJwk({ ...neta, y: aBase64url(y) })).toThrow(ambCodi('PUNT_INVALID'));
  });
});

describe('AES-256-GCM, HKDF natiu i etiquetes', () => {
  test('IV aleatori de 12 B, únic en 2.000 xifrats, i l’AAD, l’IV o el xifrat manipulats: XIFRAT_MANIPULAT', async () => {
    const clau = await importaClauAesGcm(cripto, aleatori(cripto, 32));
    expect(clau.extractable).toBe(false);
    const ivs = new Set();
    for (let i = 0; i < 2000; i += 1) ivs.add(aHex((await xifraAesGcm(cripto, clau, { dades: Uint8Array.of(i % 256) })).iv));
    expect(ivs.size).toBe(2000);
    const aad = ascii('SDPM');
    const { iv, xifrat } = await xifraAesGcm(cripto, clau, { dades: ascii('Bon dia, veïna'), aad });
    expect(iv).toHaveLength(BYTES_IV);
    expect(new TextDecoder().decode(await desxifraAesGcm(cripto, clau, { xifrat, aad, iv }))).toBe('Bon dia, veïna');
    const manipulat = ambCodi('XIFRAT_MANIPULAT');
    const girat = Uint8Array.from(xifrat);
    girat[0] ^= 1;
    await expect(desxifraAesGcm(cripto, clau, { xifrat: girat, aad, iv })).rejects.toEqual(manipulat);
    await expect(desxifraAesGcm(cripto, clau, { xifrat, aad: ascii('SDPN'), iv })).rejects.toEqual(manipulat);
    await expect(desxifraAesGcm(cripto, clau, { xifrat, iv })).rejects.toEqual(manipulat);
    await expect(desxifraAesGcm(cripto, clau, { xifrat, aad, iv: new Uint8Array(16) })).rejects.toEqual(manipulat);
    await expect(desxifraAesGcm(cripto, clau, { xifrat: xifrat.subarray(0, 15), aad, iv })).rejects.toEqual(manipulat);
    await expect(desxifraAesGcm(cripto, await importaClauAesGcm(cripto, aleatori(cripto, 32)), { xifrat, aad, iv })).rejects.toEqual(manipulat);
  });

  test('només AES-256: una clau de 16 B o una AES-128 es rebutgen (CLAU_INVALIDA)', async () => {
    await expect(importaClauAesGcm(cripto, aleatori(cripto, 16))).rejects.toEqual(ambCodi('CLAU_INVALIDA'));
    const aes128 = await cripto.subtle.importKey('raw', aleatori(cripto, 16), 'AES-GCM', false, ['encrypt', 'decrypt']);
    await expect(xifraAesGcm(cripto, aes128, { dades: BUIT })).rejects.toEqual(ambCodi('CLAU_INVALIDA'));
  });

  test('importaClauHkdf: només 32 B (la CK i la FK); una buida o tallada es rebutja (CLAU_INVALIDA)', async () => {
    const clau = await importaClauHkdf(cripto, aleatori(cripto, 32));
    expect(clau.extractable).toBe(false);
    expect(clau.algorithm.name).toBe('HKDF');
    for (const mida of [0, 1, 16, 31, 33, 64]) {
      await expect(importaClauHkdf(cripto, new Uint8Array(mida)), String(mida)).rejects.toEqual(ambCodi('CLAU_INVALIDA'));
    }
    await expect(importaClauHkdf(cripto, [...new Uint8Array(32)])).rejects.toThrow(TypeError);
  });

  test('derivaClauAesHkdf: AES-256-GCM no extraïble, determinista per (ikm, sal, info) i diferent si canvia res', async () => {
    const ikm = await importaClauHkdf(cripto, aleatori(cripto, 32));
    const id = aleatori(cripto, 16);
    const info = infoHkdf('missatge', aleatori(cripto, 32));
    const mk = await derivaClauAesHkdf(cripto, ikm, id, info);
    expect(mk.extractable).toBe(false);
    expect(mk.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    const ambIvZero = criptoAmbIv(new Uint8Array(BYTES_IV));
    const xifra = async (clau) => aHex((await xifraAesGcm(ambIvZero, clau, { dades: ascii('hola') })).xifrat);
    expect(await xifra(await derivaClauAesHkdf(cripto, ikm, id, info))).toBe(await xifra(mk));
    expect(await xifra(await derivaClauAesHkdf(cripto, ikm, aleatori(cripto, 16), info))).not.toBe(await xifra(mk));
    expect(await xifra(await derivaClauAesHkdf(cripto, ikm, id, infoHkdf('adjunt')))).not.toBe(await xifra(mk));
  });

  test('infoHkdf: «sdp-xat-v1/<nom>» ‖ 0x00 ‖ context, amb noms ASCII en minúscules', () => {
    expect(aHex(infoHkdf('compromis-epoca', Uint8Array.of(0, 0, 0, 7)))).toBe(aHex(ajunta(ascii('sdp-xat-v1/compromis-epoca'), Uint8Array.of(0, 0, 0, 0, 7))));
    for (const dolent of ['', 'Missatge', 'missatge/x', 'missatge ', 'cõmpromis', '-x', 7]) expect(() => infoHkdf(dolent), String(dolent)).toThrow(TypeError);
  });

  test('HMAC amb clau buida = HMAC amb 32 zeros; HKDF-Expand fa com a molt 255 blocs', async () => {
    const dades = ascii('franqueig');
    expect(aHex(await hmacSha256(cripto, BUIT, dades))).toBe(aHex(await hmacSha256(cripto, new Uint8Array(32), dades)));
    const prk = aleatori(cripto, 32);
    expect(await hkdfExpand(cripto, prk, BUIT, 255 * 32)).toHaveLength(8160);
    await expect(hkdfExpand(cripto, prk, BUIT, 255 * 32 + 1)).rejects.toThrow(RangeError);
    await expect(hkdfExpand(cripto, prk.subarray(0, 31), BUIT, 32)).rejects.toThrow(RangeError);
    expect(bytesIguals(Uint8Array.of(1, 2), Uint8Array.of(1, 2))).toBe(true);
    expect(bytesIguals(Uint8Array.of(1, 2), Uint8Array.of(1, 3))).toBe(false);
    expect(bytesIguals(Uint8Array.of(1), Uint8Array.of(1, 0))).toBe(false);
    // Només bytes: 'a' ^ 'b' és NaN ^ NaN = 0, i dos textos de la mateixa llargària «serien iguals».
    for (const [a, b] of [['kidA', 'kidB'], [[1, 2], [3, 4]], [Uint8Array.of(1, 2), [1, 2]], [null, null], [undefined, undefined]]) {
      expect(bytesIguals(a, b), String(a)).toBe(false);
    }
  });
});

describe('ECDSA P-256', () => {
  test('signa i verifica (64 B, IEEE P1363); un altre text, una altra clau o una mida errònia no verifiquen', async () => {
    const parella = await generaParellaSignatura(cripto);
    expect(parella.privateKey.extractable).toBe(false);
    const publica = await exportaPublica(cripto, parella.publicKey);
    const dades = ascii('SDPK');
    const firma = await signa(cripto, parella.privateKey, dades);
    expect(firma).toHaveLength(64);
    expect(await verificaSignatura(cripto, publica, firma, dades)).toBe(true);
    expect(await verificaSignatura(cripto, parella.publicKey, firma, dades)).toBe(true);
    expect(await verificaSignatura(cripto, publica, firma, ascii('SDPE'))).toBe(false);
    const altra = await exportaPublica(cripto, (await generaParellaSignatura(cripto)).publicKey);
    expect(await verificaSignatura(cripto, altra, firma, dades)).toBe(false);
    for (const dolenta of [firma.subarray(0, 63), ajunta(firma, Uint8Array.of(0)), new Uint8Array(64), [...firma]]) {
      expect(await verificaSignatura(cripto, publica, dolenta, dades)).toBe(false);
    }
    // Una clau ECDH no verifica: fals, no una excepció.
    expect(await verificaSignatura(cripto, (await generaParellaDh(cripto)).publicKey, firma, dades)).toBe(false);
    const fora = Uint8Array.from(publica);
    fora[64] ^= 1;
    await expect(verificaSignatura(cripto, fora, firma, dades)).rejects.toEqual(ambCodi('PUNT_INVALID'));
  });
});

describe('PBKDF2-HMAC-SHA256', () => {
  test('per defecte, 600.000 iteracions: la mateixa derivació que WebCrypto i una KEK AES-256-GCM no extraïble', async () => {
    expect(ITERACIONS_KDF).toBe(600000);
    const secret = ajunta(ascii('SDPR'), Uint8Array.of(1, 1), aleatori(cripto, 9));
    const sal = aleatori(cripto, 16);
    const base = await cripto.subtle.importKey('raw', secret, 'PBKDF2', false, ['deriveBits']);
    const directe = new Uint8Array(await cripto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: 600000 }, base, 256));
    expect(aHex(await pbkdf2Sha256(cripto, secret, sal))).toBe(aHex(directe));
    const kek = await kekPbkdf2(cripto, secret, sal);
    expect(kek.extractable).toBe(false);
    expect(kek.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    const { iv, xifrat } = await xifraAesGcm(cripto, kek, { dades: ascii('RK') });
    expect(new TextDecoder().decode(await desxifraAesGcm(cripto, await importaClauAesGcm(cripto, directe), { xifrat, iv }))).toBe('RK');
  });

  test('el sòl: per defecte cap per davall de 600.000; les proves mai per davall de MIN_ITERACIONS_PROVES; cap per damunt del màxim', async () => {
    const secret = aleatori(cripto, 11);
    const sal = aleatori(cripto, 16);
    const fora = ambCodi('ITERACIONS_FORA_DE_RANG');
    await expect(pbkdf2Sha256(cripto, secret, sal, { iteracions: 599999 })).rejects.toEqual(fora);
    await expect(kekPbkdf2(cripto, secret, sal, { iteracions: MIN_ITERACIONS_PROVES })).rejects.toEqual(fora);
    await expect(pbkdf2Sha256(cripto, secret, sal, { iteracions: MIN_ITERACIONS_PROVES - 1, minIteracions: 1 })).rejects.toEqual(fora);
    for (const iteracions of [MAX_ITERACIONS + 1, 1000.5, '600000', Number.NaN]) {
      await expect(pbkdf2Sha256(cripto, secret, sal, { iteracions, minIteracions: MIN_ITERACIONS_PROVES }), String(iteracions)).rejects.toEqual(fora);
    }
    expect(await pbkdf2Sha256(cripto, secret, sal, { iteracions: MIN_ITERACIONS_PROVES, minIteracions: MIN_ITERACIONS_PROVES })).toHaveLength(32);
    // Un sòl estrany de qui crida no l'abaixa: s'aplica el de producció.
    await expect(pbkdf2Sha256(cripto, secret, sal, { iteracions: MIN_ITERACIONS_PROVES, minIteracions: '1' })).rejects.toEqual(fora);
  });

  test('un secret buit (SECRET_BUIT) o una sal buida (SAL_INVALIDA) no deriven res; la KEK de la frase vol 16 B de sal', async () => {
    const proves = { iteracions: MIN_ITERACIONS_PROVES, minIteracions: MIN_ITERACIONS_PROVES };
    const secret = aleatori(cripto, 11);
    const sal = aleatori(cripto, BYTES_SAL);
    for (const deriva of [pbkdf2Sha256, kekPbkdf2]) {
      await expect(deriva(cripto, BUIT, sal, proves), deriva.name).rejects.toEqual(ambCodi('SECRET_BUIT'));
      await expect(deriva(cripto, secret, BUIT, proves), deriva.name).rejects.toEqual(ambCodi('SAL_INVALIDA'));
      // Encara que les iteracions siguen les de producció.
      await expect(deriva(cripto, BUIT, BUIT), deriva.name).rejects.toEqual(expect.objectContaining({ codi: expect.stringMatching(/^(SECRET_BUIT|SAL_INVALIDA)$/) }));
    }
    for (const mida of [4, 15, 17, 32]) {
      await expect(kekPbkdf2(cripto, secret, aleatori(cripto, mida), proves), String(mida)).rejects.toEqual(ambCodi('SAL_INVALIDA'));
    }
    expect((await kekPbkdf2(cripto, secret, sal, proves)).algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    // Una sal curta, com la dels vectors («NaCl»), només per a la derivació en bytes.
    expect(await pbkdf2Sha256(cripto, secret, ascii('NaCl'), proves)).toHaveLength(32);
  });
});

describe('farciment', () => {
  test('missatges: P ‖ 0x80 ‖ zeros fins al múltiple de 256 (de 256 a 16.384 B)', () => {
    for (const [longitud, mida] of [[0, 256], [1, 256], [255, 256], [256, 512], [511, 512], [16249, 16384], [16383, 16384]]) {
      const bytes = aleatori(cripto, Math.min(longitud, 65536)).map((byte) => byte || 1);
      const farcit = farcixMissatge(bytes);
      expect(farcit.length, String(longitud)).toBe(mida);
      expect(farcit[longitud]).toBe(0x80);
      expect(aHex(llevaFarcimentMissatge(farcit))).toBe(aHex(bytes));
    }
    expect(() => farcixMissatge(new Uint8Array(MAX_MISSATGE_FARCIT))).toThrow(ambCodi('MASSA_GRAN'));
    // Un P que acaba en zeros es recupera sencer: el marcador és l'últim byte no nul.
    expect(aHex(llevaFarcimentMissatge(farcixMissatge(new Uint8Array(3))))).toBe('000000');
  });

  test('missatges: el farciment estricte rebutja la falta de 0x80, la brossa i les mides no canòniques', () => {
    const invalid = ambCodi('FARCIMENT_INVALID');
    const bo = farcixMissatge(ascii('hola'));
    const sense80 = Uint8Array.from(bo);
    sense80[4] = 0;
    const brossa = Uint8Array.from(bo);
    brossa[200] = 1;
    const marcador = Uint8Array.from(bo);
    marcador[4] = 0x81;
    const mesLlarg = new Uint8Array(512);
    mesLlarg.set(bo);
    // 16.640 B amb el 0x80 a 16.384: la mida seria canònica per a 16.384 B de càrrega, però passa del màxim.
    const massaGran = new Uint8Array(MAX_MISSATGE_FARCIT + BLOC_MISSATGE);
    massaGran[MAX_MISSATGE_FARCIT] = 0x80;
    for (const dolent of [sense80, brossa, marcador, mesLlarg, new Uint8Array(256), bo.subarray(0, 255), new Uint8Array(MAX_MISSATGE_FARCIT + BLOC_MISSATGE), massaGran]) {
      expect(() => llevaFarcimentMissatge(dolent)).toThrow(invalid);
    }
  });

  test('Padmé: les mides de §4.7 (foto, veu, frontera del vídeo) i de la revisió (1.000 B)', () => {
    // blob = IV (12) + Padmé(fitxer + 0x80) + etiqueta (16).
    const blob = (bytes) => midaPadme(bytes + 1) + 12 + 16;
    expect(midaPadme(1001)).toBe(1024);
    expect(blob(1000)).toBe(1052);
    expect(blob(2000000)).toBe(2031644);
    expect(blob(3000000)).toBe(3014684);
    expect(blob(19922943)).toBe(19922972);
    expect(blob(19922944)).toBe(20447260);
    expect(blob(19922943) <= 20000000 && blob(19922944) > 20000000).toBe(true);
    expect([1, 2, 3, 4, 5, 8, 9].map(midaPadme)).toEqual([1, 2, 3, 4, 5, 8, 10]);
  });

  test('Padmé: sobrecost ≤ 12 %, mai més curt, i anada i tornada estricta', () => {
    for (let longitud = 1; longitud < 300000; longitud += 997) {
      const mida = midaPadme(longitud);
      expect(mida).toBeGreaterThanOrEqual(longitud);
      expect((mida - longitud) / longitud).toBeLessThanOrEqual(0.12);
    }
    expect(() => midaPadme(0)).toThrow(RangeError);
    const fitxer = new Uint8Array(1000).fill(7);
    const farcit = farcixPadme(fitxer);
    expect(farcit).toHaveLength(1024);
    expect(aHex(llevaFarcimentPadme(farcit))).toBe(aHex(fitxer));
    const invalid = ambCodi('FARCIMENT_INVALID');
    const mesLlarg = new Uint8Array(1056);
    mesLlarg.set(farcit);
    const sense80 = Uint8Array.from(farcit);
    sense80[1000] = 0;
    for (const dolent of [mesLlarg, sense80, farcit.subarray(0, 1001), new Uint8Array(1024)]) expect(() => llevaFarcimentPadme(dolent)).toThrow(invalid);
  });
});

describe('número de seguretat', () => {
  const A = '0a0a0a0a-0000-4000-8000-00000000000a';
  const B = '0b0b0b0b-0000-4000-8000-00000000000b';

  async function persona(usuari) {
    const sig = await generaParellaSignatura(cripto);
    const dh = await generaParellaDh(cripto);
    return { usuari, sigPub: await exportaPublica(cripto, sig.publicKey), dhPub: await exportaPublica(cripto, dh.publicKey) };
  }

  test('la meitat d’una persona: 30 xifres de l’empremta de sigPub ‖ dhPub amb l’uuid16', async () => {
    const a = await persona(A);
    const meitat = await numeroSeguretatPersona(cripto, a);
    expect(meitat).toMatch(/^\d{30}$/);
    expect(meitat).toBe(xifresEmpremta(await empremtaNumerica(cripto, ajunta(a.sigPub, a.dhPub), uuid16(A))));
    expect(await numeroSeguretatPersona(cripto, a)).toBe(meitat);
    // Les mateixes claus amb un altre uuid donen un altre número.
    expect(await numeroSeguretatPersona(cripto, { ...a, usuari: B })).not.toBe(meitat);
  });

  test('el parell: 60 xifres en 12 grups de 5, igual als dos aparells, i diferent si se substituïx una clau', async () => {
    const [a, b] = await Promise.all([persona(A), persona(B)]);
    const numero = await numeroSeguretatParell(cripto, a, b);
    expect(numero).toMatch(/^\d{5}(?: \d{5}){11}$/);
    expect(await numeroSeguretatParell(cripto, b, a)).toBe(numero);
    // L'ordre és el dels bytes de l'uuid: A (0a…) va primer.
    expect(numero.replaceAll(' ', '').slice(0, 30)).toBe(await numeroSeguretatPersona(cripto, a));
    const substituta = await persona(B);
    expect(await numeroSeguretatParell(cripto, a, { ...b, dhPub: substituta.dhPub })).not.toBe(numero);
    expect(await numeroSeguretatParell(cripto, a, { ...b, sigPub: substituta.sigPub })).not.toBe(numero);
  });

  test('entrades dolentes: la mateixa persona, un uuid no canònic, una meitat que no és de 30 xifres, una clau fora de la corba', async () => {
    const a = await persona(A);
    const meitat = await numeroSeguretatPersona(cripto, a);
    expect(() => numeroDelParell({ usuari: A, numero: meitat }, { usuari: A, numero: meitat })).toThrow(ambCodi('PARELL_INVALID'));
    expect(() => numeroDelParell({ usuari: A.toUpperCase(), numero: meitat }, { usuari: B, numero: meitat })).toThrow(ambCodi('UUID_INVALID'));
    expect(() => numeroDelParell({ usuari: A, numero: meitat.slice(1) }, { usuari: B, numero: meitat })).toThrow(TypeError);
    for (const camp of ['dhPub', 'sigPub']) {
      const fora = Uint8Array.from(a[camp]);
      fora[64] ^= 1;
      await expect(numeroSeguretatPersona(cripto, { ...a, [camp]: fora }), camp).rejects.toEqual(ambCodi('PUNT_INVALID'));
    }
    await expect(empremtaNumerica(cripto, BUIT, BUIT, 1)).rejects.toThrow(RangeError);
  });
});
