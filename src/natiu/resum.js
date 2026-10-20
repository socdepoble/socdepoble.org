/* Fase D (261020, tasca 1) · El nonce de l'entrada nativa i el seu resum SHA-256.
   El proveïdor (Apple, Google) rep el SHA-256 en hexadecimal del nonce CRU i el
   posa dins del testimoni; GoTrue torna a fer el resum del cru i el compara amb
   %x (minúscules). Per això l'eixida és sempre hex en minúscules.
   Sense dependències i sense tocar cap emmagatzematge. No es reutilitza
   src/sections/tractors/nucli/canonic.js: llança sense crypto.subtle i seria una
   dependència d'una altra secció. */
import { CODI_ENTRADA_NATIVA } from '../config/entradaNativa.js';

const LLARGARIA_NONCE = 32;   // bytes: 64 caràcters hex
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Un nonce nou de 32 bytes aleatoris, en 64 caràcters hex en minúscules. Mai
 * Math.random: sense getRandomValues, llança amb FALLIDA i no hi ha entrada.
 */
export function nonceNou(cripto = globalThis.crypto) {
  if (typeof cripto?.getRandomValues !== 'function') {
    throw Object.assign(new Error('Este dispositiu no pot generar un nonce segur.'), { code: CODI_ENTRADA_NATIVA.FALLIDA });
  }
  return hex(cripto.getRandomValues(new Uint8Array(LLARGARIA_NONCE)));
}

/**
 * El SHA-256 de `text` (UTF-8) en hex en minúscules. Amb crypto.subtle si n'hi ha
 * (un context segur); si falta o falla, la versió pura de baix, que dona el mateix.
 */
export async function sha256Hex(text, subtle = globalThis.crypto?.subtle) {
  try {
    if (typeof subtle?.digest === 'function') {
      return hex(new Uint8Array(await subtle.digest('SHA-256', new TextEncoder().encode(String(text)))));
    }
  } catch { /* cau a la versió pura */ }
  return sha256HexPur(text);
}

/* FIPS 180-4, §4.2.2: les 64 constants K, literals. */
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
/* §5.3.3: el valor inicial del resum. */
const H0 = Object.freeze([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
const rotr = (x, n) => (x >>> n) | (x << (32 - n));

/** SHA-256 pur (FIPS 180-4) de `text` en UTF-8, en hex en minúscules. */
export function sha256HexPur(text) {
  const dades = new TextEncoder().encode(String(text));
  /* §5.1.1: 0x80, zeros i la llargària en bits, 64 bits big-endian, fins a un múltiple de 64 bytes. */
  const llargaria = Math.ceil((dades.length + 9) / 64) * 64;
  const missatge = new Uint8Array(llargaria);
  missatge.set(dades);
  missatge[dades.length] = 0x80;
  const vista = new DataView(missatge.buffer);
  const bits = dades.length * 8;
  vista.setUint32(llargaria - 8, Math.floor(bits / 0x100000000));
  vista.setUint32(llargaria - 4, bits >>> 0);

  const estat = new Uint32Array(H0);
  const w = new Uint32Array(64);
  for (let bloc = 0; bloc < llargaria; bloc += 64) {
    for (let t = 0; t < 16; t += 1) w[t] = vista.getUint32(bloc + t * 4);
    for (let t = 16; t < 64; t += 1) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = estat;
    for (let t = 0; t < 64; t += 1) {
      const sigma1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const tria = (e & f) ^ (~e & g);
      const t1 = (h + sigma1 + tria + K[t] + w[t]) >>> 0;
      const sigma0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const majoria = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (sigma0 + majoria) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    /* Uint32Array: cada suma es reduïx mòdul 2^32 en desar-la. */
    estat[0] += a; estat[1] += b; estat[2] += c; estat[3] += d;
    estat[4] += e; estat[5] += f; estat[6] += g; estat[7] += h;
  }
  return Array.from(estat, (paraula) => paraula.toString(16).padStart(8, '0')).join('');
}
