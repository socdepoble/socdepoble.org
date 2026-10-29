// @vitest-environment node
/* La recuperació social dels xats privats (IDEA-48; P1-12 / IDEA-19, disseny
   final §5.6 i pas 5 de §16; esmenes_qa_261029.md §4, §6, §8, §9 i §13.1).
   WebCrypto de veres: el de Node (globalThis.crypto). Es mira:
     · GF(2⁸) contra els vectors publicats de FIPS-197 que copien les esmenes §9.2
       (V-GF1..V-GF3 i S({53}) = {ed}), contra una multiplicació de referència
       lenta en els 65.536 parells i amb els 255 inversos; el vector manual
       V-SH1 de §9.3 i la seua variant corrompuda;
     · les propietats de Shamir (tota terna d'un repartiment dona la mateixa RK;
       un byte canviat el delata el hF; un fragment inconsistent atura) i
       l'equivalència de la comprovació lineal de §8.3 amb enumerar totes les
       ternes, per a n de 3 a 8;
     · els formats de §6 byte a byte, amb les mides de §6.2, i els rebuigs;
     · l'aval i l'alliberament d'anada i tornada amb claus noves
       (generaParellaDh), el SAS amb compromís de §4 i la reconstrucció
       autenticada de §5.6.6, amb els camins negatius i el seu codi exacte.
   Els vectors viuen a xifratXatRecuperacio.vectors.json, copiats literalment de
   les esmenes; els que les esmenes deixen pendents (§9.4) s'ometen amb el motiu.
   Dades sintètiques; les claus són de prova. */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import * as R from './xifratXatRecuperacio.js';
import * as F from './xifratXatFormats.js';
import {
  ajunta, exportaPublica, generaParellaDh, generaParellaSignatura, hkdfExpand, hkdfExtract, signa
} from './xifratXatCripto.js';
import VECTORS from './xifratXatRecuperacio.vectors.json';

const cripto = globalThis.crypto;
const A = '0a0a0a0a-0000-4000-8000-00000000000a';
const B = '0b0b0b0b-0000-4000-8000-00000000000b';
const PET = 'fefefefe-0000-4000-8000-0000000000fe';
const REP = '5a5a5a5a-0000-4000-8000-00000000005a';
const REP0 = '5a5a5a5a-0000-4000-8000-000000000050';
const T0 = 1793318400000;
const DUES_HORES = 7200000;
const KID_P = new Uint8Array(16).fill(0x11);
const KID_AMIC = new Uint8Array(16).fill(0x22);
const H32 = (byte) => new Uint8Array(32).fill(byte);

const deHex = (hex) => Uint8Array.from(hex.match(/../g) ?? [], (parell) => Number.parseInt(parell, 16));
const aHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const ascii = (text) => new TextEncoder().encode(text);
const u16 = (uuid) => deHex(uuid.replaceAll('-', ''));
const be = (n, mida) => { const b = new Uint8Array(mida); let resta = n; for (let i = mida - 1; i >= 0; i -= 1) { b[i] = resta % 256; resta = Math.floor(resta / 256); } return b; };
const ambCodi = (codi) => expect.objectContaining({ codi });
const invalid = (motiu, extra = {}) => expect.objectContaining({ codi: 'FORMAT_INVALID', motiu, ...extra });
const aleatoris = (n) => cripto.getRandomValues(new Uint8Array(n));
const uuidN = (n) => `${n.toString(16).padStart(8, '0')}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
/* Una còpia amb uns bytes canviats a partir de `desde`. */
function muta(bytes, desde, nous) {
  const copia = Uint8Array.from(bytes);
  copia.set(Uint8Array.from(nous), desde);
  return copia;
}
/* Un fragment de 33 B amb el mateix y en els 32 bytes (els vectors d'un sol byte). */
const fragmentDe = (x, y) => { const f = new Uint8Array(R.BYTES_FRAGMENT); f[0] = x; f.fill(y, 1); return f; };
/* Totes les ternes d'índexs de 0..n−1. */
function ternes(n) {
  const eixida = [];
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) for (let k = j + 1; k < n; k += 1) eixida.push([i, j, k]);
  return eixida;
}
/* La transformació afí de la caixa S (FIPS-197 §5.1.1): b ⊕ rotl¹ ⊕ rotl² ⊕ rotl³ ⊕ rotl⁴ ⊕ {63}. */
const rotl = (b, k) => ((b << k) | (b >>> (8 - k))) & 0xff;
const afi = (b) => b ^ rotl(b, 1) ^ rotl(b, 2) ^ rotl(b, 3) ^ rotl(b, 4) ^ 0x63;
/* Una multiplicació de referència independent: producte de polinomis bit a bit i reducció per 0x11B. */
function mulReferencia(a, b) {
  let r = 0;
  for (let i = 0; i < 8; i += 1) if ((b >> i) & 1) r ^= a << i;
  for (let i = 14; i >= 8; i -= 1) if ((r >> i) & 1) r ^= 0x11b << (i - 8);
  return r;
}
const sha256 = async (bytes) => new Uint8Array(await cripto.subtle.digest('SHA-256', bytes));
/* El cripto de l'entorn amb un generador que apunta cada Uint8Array que ompli. */
const criptoAmbGenerador = (captura) => ({
  subtle: cripto.subtle,
  getRandomValues: (bytes) => { cripto.getRandomValues(bytes); captura.push(bytes); return bytes; }
});
/* Un subtle de l'entorn que passa cada crida acabada per `vigila(nom, args, eixida)`. */
function criptoVigilat(vigila) {
  const subtle = new Proxy(cripto.subtle, {
    get(objectiu, nom) {
      const metode = objectiu[nom];
      if (typeof metode !== 'function') return metode;
      return async (...args) => {
        const eixida = await metode.apply(objectiu, args);
        vigila(nom, args, eixida);
        return eixida;
      };
    }
  });
  return { subtle, getRandomValues: (bytes) => cripto.getRandomValues(bytes) };
}
const VALORS_T = Object.freeze({ usuari: A, kid: KID_P, repartiment: REP, peticio: PET, amic: B, kidAmic: KID_AMIC, x: 2, caducaMs: T0 + DUES_HORES });

describe('l’entorn, la injecció i la puresa del mòdul', () => {
  test('el mòdul és pur: només importa xifratXatCripto.js, cap Math.random, cap global, cap paraula vetada', () => {
    const font = readFileSync(new URL('./xifratXatRecuperacio.js', import.meta.url), 'utf8');
    expect(font.match(/^import[\s\S]*?from\s+'([^']+)';/gm).map((linia) => linia.match(/from\s+'([^']+)'/)[1])).toEqual(['./xifratXatCripto.js']);
    expect(font).not.toMatch(/Math\.random|globalThis|window\.|indexedDB|localStorage|fetch\(/);
    // La paraula vetada per a anomenar la plataforma (la plataforma és el Mas), muntada a trossos perquè esta prova no la continga.
    const vetada = new RegExp(['ma', 'sia'].join(''), 'i');
    expect(font).not.toMatch(vetada);
    for (const fitxer of ['./xifratXatRecuperacio.seguretat.test.js', './xifratXatRecuperacio.vectors.json']) {
      expect(readFileSync(new URL(fitxer, import.meta.url), 'utf8')).not.toMatch(vetada);
    }
  });

  test('les constants són congelades i casen amb els formats que ja existixen (k = 3, màgies SDPH i SDPV)', () => {
    for (const objecte of [R.MAGIES_RECUPERACIO, R.ETIQUETES_SAS, R.MIDES_RECUPERACIO]) expect(Object.isFrozen(objecte)).toBe(true);
    expect(R.LLINDAR).toBe(F.MIN_LLINDAR_SOCIAL);
    expect(R.LLINDAR).toBe(3);
    expect(R.MAGIES_RECUPERACIO.infoAval).toBe(F.MAGIES.fragmentSocial);
    expect(R.MAGIES_RECUPERACIO.verificacio).toBe(F.MAGIES.codiCurt);
    expect([R.MIN_AMICS, R.MAX_AMICS, R.MAX_ALLIBERAMENTS_VALIDS, R.MAX_ALLIBERAMENTS_PROCESSATS]).toEqual([3, 255, 8, 16]);
    expect(R.POLINOMI_GF.toString(16)).toBe(VECTORS.polinomi);
  });

  test('sense WebCrypto complet, falla tancat (SENSE_CRIPTO) abans de repartir, comprometre o derivar res', async () => {
    const trampa = { subtle: { digest: cripto.subtle.digest.bind(cripto.subtle) }, getRandomValues: (b) => b.fill(7) };
    expect(() => R.reparteixRk(trampa, aleatoris(32), 5)).toThrow(ambCodi('SENSE_CRIPTO'));
    expect(() => R.reparteixRk(undefined, aleatoris(32), 5)).toThrow(ambCodi('SENSE_CRIPTO'));
    await expect(R.compromisFragment(trampa, VALORS_T_INFO(), fragmentDe(2, 9))).rejects.toEqual(ambCodi('SENSE_CRIPTO'));
    await expect(R.codiSas(trampa, { hT: H32(1), nD: H32(2), nA: H32(3) })).rejects.toEqual(ambCodi('SENSE_CRIPTO'));
    await expect(R.reparteix(trampa, { rk: aleatoris(32), usuari: A, kid: KID_P, amics: [] })).rejects.toEqual(ambCodi('SENSE_CRIPTO'));
    await expect(R.recuperaRk({}, { usuari: A, kid: KID_P, repartiment: REP, alliberats: [] })).rejects.toEqual(ambCodi('SENSE_CRIPTO'));
  });

  test('l’atzar ve només del cripto injectat: 64 B de coeficients en una crida, i 16 B més per al repartiment', async () => {
    const crides = [];
    const fragments = R.reparteixRk(criptoAmbGenerador(crides), aleatoris(32), 4);
    expect(crides.map((b) => b.length)).toEqual([64]);
    expect(fragments).toHaveLength(4);
    const altres = [];
    const amics = [1, 2, 3].map((n) => ({ amic: uuidN(n), kidAmic: new Uint8Array(16).fill(n) }));
    await R.reparteix(criptoAmbGenerador(altres), { rk: aleatoris(32), usuari: A, kid: KID_P, amics });
    expect(altres.map((b) => b.length)).toEqual([16, 64]);
  });
});

function VALORS_T_INFO() {
  return { usuari: A, kid: KID_P, repartiment: REP, x: 2, amic: B, kidAmic: KID_AMIC };
}

describe('GF(2⁸): els vectors publicats de FIPS-197 (bloquejants, esmenes §9.2)', () => {
  test('el JSON cita les esmenes i el polinomi 0x11B', () => {
    expect(VECTORS.font.document).toBe('_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/esmenes_qa_261029.md');
    expect(VECTORS.polinomi).toBe('11b');
    expect(R.POLINOMI_GF).toBe(0x11b);
  });

  test.each(['V-GF1', 'V-GF2', 'V-GF3'])('%s: els productes de FIPS-197 §4.2 i §4.2.1', (nom) => {
    const { casos } = VECTORS.gf_fips197[nom];
    expect(casos.length).toBeGreaterThan(0);
    for (const { a, b, producte } of casos) {
      expect(aHex([R.gfMul(deHex(a)[0], deHex(b)[0])]), `${a}·${b}`).toBe(producte);
      expect(aHex([R.gfMul(deHex(b)[0], deHex(a)[0])]), `${b}·${a}`).toBe(producte);
    }
  });

  test('V-INV: S({53}) = afí({53}⁻¹) = {ed} (caixa S, FIPS-197 §5.1.1), i {53}·{53}⁻¹ = 1', () => {
    for (const { a, s } of VECTORS.gf_fips197['V-INV'].casos) {
      const invers = R.gfInv(deHex(a)[0]);
      expect(aHex([afi(invers)])).toBe(s);
      expect(R.gfMul(deHex(a)[0], invers)).toBe(1);
    }
  });

  test.skip('V-INV sencera: els 255 inversos contra la caixa S transcrita de FIPS-197 fig. 7 (pendent: les esmenes només porten S({53}); cal transcriure-la amb la font a mà)', () => {});

  test('la caixa S sencera queda marcada pendent al JSON, amb el motiu', () => {
    expect(VECTORS.gf_fips197['V-INV'].pendent.caixaSSencera).toMatch(/FIPS-197 fig\. 7/);
  });

  test('0 no té invers: 0⁻¹ dona 0 sense llançar res i cap producte amb 0 val 1; els altres 255 tenen invers únic', () => {
    expect(R.gfInv(0)).toBe(0);
    for (let a = 0; a < 256; a += 1) expect(R.gfMul(0, a)).toBe(0);
    const inversos = new Set();
    for (let a = 1; a < 256; a += 1) {
      const invers = R.gfInv(a);
      expect(R.gfMul(a, invers), `a = ${a}`).toBe(1);
      expect(invers).not.toBe(0);
      inversos.add(invers);
    }
    expect(inversos.size).toBe(255);
    expect(R.gfInv(1)).toBe(1);
  });

  test('el producte per màscares casa amb la referència lenta en els 65.536 parells, i no llança per a cap parell', () => {
    let diferencies = 0;
    for (let a = 0; a < 256; a += 1) for (let b = 0; b < 256; b += 1) if (R.gfMul(a, b) !== mulReferencia(a, b)) diferencies += 1;
    expect(diferencies).toBe(0);
  });

  test('àlgebra: la suma és XOR, el producte és commutatiu, associatiu i distributiu (mostra aleatòria)', () => {
    expect(R.gfSuma(0x57, 0x83)).toBe(0x57 ^ 0x83);
    expect(R.gfSuma(0xff, 0xff)).toBe(0);
    for (let i = 0; i < 2000; i += 1) {
      const [a, b, c] = aleatoris(3);
      expect(R.gfMul(a, b)).toBe(R.gfMul(b, a));
      expect(R.gfMul(R.gfMul(a, b), c)).toBe(R.gfMul(a, R.gfMul(b, c)));
      expect(R.gfMul(a, R.gfSuma(b, c))).toBe(R.gfSuma(R.gfMul(a, b), R.gfMul(a, c)));
      expect(R.gfMul(a, 1)).toBe(a);
    }
  });

  test('el domini són enters de 0 a 255: fora d’ell, TypeError (una comprovació de tipus, no de valor secret)', () => {
    for (const dolent of [256, -1, 1.5, '57', null, undefined, 0x100n]) {
      expect(() => R.gfMul(dolent, 1)).toThrow(TypeError);
      expect(() => R.gfMul(1, dolent)).toThrow(TypeError);
      expect(() => R.gfSuma(dolent, 1)).toThrow(TypeError);
      expect(() => R.gfInv(dolent)).toThrow(TypeError);
    }
  });
});

describe('V-SH1: el vector manual de les esmenes §9.3', () => {
  const V = VECTORS.shamir_manual['V-SH1'];
  const { s, a1, a2 } = Object.fromEntries(Object.entries(V.polinomi).map(([k, v]) => [k, deHex(v)[0]]));
  const punts = V.punts.map((p) => fragmentDe(deHex(p.x)[0], deHex(p.y)[0]));

  test('cada fila: {57}·x, x² (amb X⁸ = {1b}) i y = {83} ⊕ {57}·x ⊕ x²', () => {
    expect([s, a1, a2]).toEqual([0x83, 0x57, 0x01]);
    for (const fila of V.punts) {
      const x = deHex(fila.x)[0];
      expect(aHex([R.gfMul(a1, x)]), `57·${fila.x}`).toBe(fila['57x']);
      expect(aHex([R.gfMul(x, x)]), `${fila.x}²`).toBe(fila.x2);
      expect(aHex([s ^ R.gfMul(a1, x) ^ R.gfMul(a2, R.gfMul(x, x))]), `y(${fila.x})`).toBe(fila.y);
    }
    expect(R.gfMul(0x10, 0x10)).toBe(0x1b);
  });

  test('qualsevol terna dels cinc punts dona s = {83} i la comprovació de consistència passa', () => {
    expect(ternes(5)).toHaveLength(10);
    for (const [i, j, k] of ternes(5)) {
      const rk = R.recomponRk([punts[i], punts[j], punts[k]]);
      expect(aHex(rk), `terna ${i},${j},${k}`).toBe(V.esperat.secret.repeat(32));
    }
    expect(R.comprovaConsistencia(punts)).toBe(V.esperat.consistencia);
    expect(R.comprovaConsistencia([...punts].reverse())).toBe(true);
  });

  test('corromput: ({08}, {4d}) → ({08}, {4c}) fa fallar la consistència, siga on siga el punt', () => {
    const corromput = punts.map((p) => Uint8Array.from(p));
    const k = V.punts.findIndex((p) => p.x === V.corromput.x);
    corromput[k].fill(deHex(V.corromput.y)[0], 1);
    expect(R.comprovaConsistencia(corromput)).toBe(V.corromput.consistencia);
    // El punt corromput entre els tres primers també es detecta (pas 3 de la demostració de §8.3).
    expect(R.comprovaConsistencia([corromput[k], ...corromput.filter((_, i) => i !== k)])).toBe(false);
    // Un sol byte corromput d'un fragment de 32 B també.
    const unByte = punts.map((p) => Uint8Array.from(p));
    unByte[2][17] ^= 0x01;
    expect(R.comprovaConsistencia(unByte)).toBe(false);
  });
});

describe('Shamir: propietats de reparteixRk, recomponRk i comprovaConsistencia (§5.6.1, esmenes §8)', () => {
  test('per a n de 3 a 12, tota terna recompon la mateixa RK, x = 1..n i els fragments fan 33 B', () => {
    for (let n = 3; n <= 12; n += 1) {
      const rk = aleatoris(32);
      const fragments = R.reparteixRk(cripto, rk, n);
      expect(fragments).toHaveLength(n);
      fragments.forEach((f, i) => { expect(f.length).toBe(33); expect(f[0]).toBe(i + 1); });
      for (const [i, j, k] of ternes(n)) expect(aHex(R.recomponRk([fragments[i], fragments[j], fragments[k]])), `n=${n} ${i},${j},${k}`).toBe(aHex(rk));
      expect(R.comprovaConsistencia(fragments)).toBe(true);
    }
  });

  test('els coeficients són nous a cada repartiment i es posen a zero en acabar; dos fragments no diuen res de la RK', () => {
    const rk = aleatoris(32);
    const captura = [];
    const un = R.reparteixRk(criptoAmbGenerador(captura), rk, 3);
    const altre = R.reparteixRk(criptoAmbGenerador(captura), rk, 3);
    expect(captura).toHaveLength(2);
    for (const coeficients of captura) expect(coeficients.every((byte) => byte === 0)).toBe(true);
    expect(aHex(un[0])).not.toBe(aHex(altre[0]));
    // Dos de vells i un de nou no donen la RK (etiquetes a part, l'aritmètica no els casa): resultat documentat, no un error ací.
    expect(aHex(R.recomponRk([un[0], un[1], altre[2]]))).not.toBe(aHex(rk));
  });

  test('rebuigs: n = 2 o 256, RK que no fa 32 B, k ≠ 3, x = 0, x repetit, fragment que no fa 33 B', () => {
    const rk = aleatoris(32);
    for (const n of [2, 256, 0, -1, 3.5, '5', null]) expect(() => R.reparteixRk(cripto, rk, n), `n = ${n}`).toThrow(ambCodi('AMICS_FORA_DE_RANG'));
    for (const dolenta of [aleatoris(31), aleatoris(33), new Uint8Array(0), [...rk], 'rk', null]) {
      expect(() => R.reparteixRk(cripto, dolenta, 5)).toThrow(ambCodi('RK_INVALIDA'));
    }
    const fragments = R.reparteixRk(cripto, rk, 5);
    expect(() => R.recomponRk(fragments.slice(0, 2))).toThrow(ambCodi('LLINDAR_INCORRECTE'));
    expect(() => R.recomponRk(fragments.slice(0, 4))).toThrow(ambCodi('LLINDAR_INCORRECTE'));
    expect(() => R.recomponRk(fragments[0])).toThrow(ambCodi('LLINDAR_INCORRECTE'));
    const zero = Uint8Array.from(fragments[0]);
    zero[0] = 0;
    expect(() => R.recomponRk([zero, fragments[1], fragments[2]])).toThrow(ambCodi('INDEX_INVALID'));
    expect(() => R.llegixFragment(zero)).toThrow(ambCodi('INDEX_INVALID'));
    expect(() => R.comprovaConsistencia([fragments[1], fragments[2], fragments[3], zero])).toThrow(ambCodi('INDEX_INVALID'));
    expect(() => R.recomponRk([fragments[0], fragments[1], Uint8Array.from(fragments[1])])).toThrow(ambCodi('INDEX_REPETIT'));
    expect(() => R.comprovaConsistencia([...fragments, Uint8Array.from(fragments[2])])).toThrow(ambCodi('INDEX_REPETIT'));
    for (const dolent of [fragments[0].subarray(0, 32), ajunta(fragments[0], Uint8Array.of(1)), new Uint8Array(0), [...fragments[0]], null, 'x']) {
      expect(() => R.recomponRk([dolent, fragments[1], fragments[2]])).toThrow(ambCodi('FRAGMENT_INVALID'));
    }
    expect(() => R.comprovaConsistencia(fragments.slice(0, 2))).toThrow(ambCodi('FRAGMENTS_INSUFICIENTS'));
    expect(() => R.comprovaConsistencia(Array.from({ length: 256 }, () => fragments[0]))).toThrow(ambCodi('MASSA_FRAGMENTS'));
    expect(() => R.comprovaConsistencia('fragments')).toThrow(TypeError);
    expect(() => R.comprovaConsistencia(fragments.slice(0, 3))).not.toThrow();
    expect(R.comprovaConsistencia(fragments.slice(0, 3))).toBe(true);
  });

  test('llegixFragment torna x i una vista de y (cap còpia secreta més)', () => {
    const fragment = R.reparteixRk(cripto, aleatoris(32), 3)[1];
    const { x, y } = R.llegixFragment(fragment);
    expect(x).toBe(2);
    expect(y.length).toBe(32);
    expect(y.buffer).toBe(fragment.buffer);
    fragment.fill(0);
    expect(y.every((byte) => byte === 0)).toBe(true);
  });

  test('un byte canviat de qualsevol punt (n = 5) trenca la consistència; l’equivalència amb totes les ternes, n = 3..8, 2.400 casos', () => {
    const rk = aleatoris(32);
    const fragments = R.reparteixRk(cripto, rk, 5);
    for (let k = 0; k < 5; k += 1) {
      const copia = fragments.map((f) => Uint8Array.from(f));
      copia[k][1 + (k * 7) % 32] ^= 0x40;
      expect(R.comprovaConsistencia(copia), `punt ${k}`).toBe(false);
    }
    let casos = 0;
    let falsos = 0;
    for (let n = 3; n <= 8; n += 1) {
      for (let cas = 0; cas < 400; cas += 1) {
        const secret = aleatoris(32);
        const punts = R.reparteixRk(cripto, secret, n);
        const tipus = cas % 4;
        if (tipus === 1) {
          // Un byte d'un punt a l'atzar, canviat.
          const [quin, on, mascara] = aleatoris(3);
          punts[quin % n][1 + (on % 32)] ^= (mascara | 1);
        } else if (tipus === 2 && n >= 4) {
          // Dos punts d'un altre polinomi de la mateixa RK (nivell 2 de §5.6.5): cap terna barrejada no ha de casar.
          const altres = R.reparteixRk(cripto, secret, n);
          punts[n - 1] = altres[n - 1];
          punts[n - 2] = altres[n - 2];
        }
        const lineal = R.comprovaConsistencia(punts);
        const primera = aHex(R.recomponRk([punts[0], punts[1], punts[2]]));
        const totes = ternes(n).every(([i, j, k]) => aHex(R.recomponRk([punts[i], punts[j], punts[k]])) === primera);
        expect(lineal, `n=${n} cas=${cas} tipus=${tipus}`).toBe(totes);
        if (tipus === 0 || tipus === 3) expect(lineal).toBe(true);
        casos += 1;
        if (!lineal) falsos += 1;
      }
    }
    expect(casos).toBe(2400);
    expect(falsos).toBeGreaterThan(500);
  });
});

describe('els formats de les esmenes §6: ordre dels camps i mides exactes', () => {
  let epk;
  beforeAll(async () => {
    epk = await exportaPublica(cripto, (await generaParellaDh(cripto)).publicKey);
  });
  const infoAval = () => ({ usuari: A, kid: KID_P, repartiment: REP, x: 2, amic: B, kidAmic: KID_AMIC });
  const valorsT = () => ({ ...VALORS_T, epk });
  const aprovacio = () => ({ hT: H32(0xa1), cD: H32(0xa2), nD: H32(0xa3), nA: H32(0xa4) });
  const entradaAmic = (k) => ({ amic: uuidN(k), kidAmic: new Uint8Array(16).fill(k), x: k, envHash: H32(0xe0 + (k % 16)), hF: H32(0xf0 + (k % 16)) });
  const declaracio = (n = 3) => ({ usuari: A, kid: KID_P, repartiment: REP, repartimentAnterior: REP0, versio: 2, creatMs: T0, amics: Array.from({ length: n }, (_, k) => entradaAmic(k + 1)) });

  test('les mides de §6.2, les del mòdul i les del JSON són les mateixes', () => {
    const M = VECTORS.mides_esmenes_6_2;
    expect(R.MIDES_RECUPERACIO).toMatchObject({
      infoAval: M.info_H_SDPH, verificacio: M.T_SDPV, infoAlliberament: M.info_L_SDPL, aprovacio: M.aprovacio_SDPO, noSocJo: M.no_soc_jo_SDPN,
      fragment: M.fragment, ctAval: M.aval_ct, carregaAlliberament: M.carrega_alliberament, ctAlliberament: M.alliberament_ct,
      capcaleraDeclaracio: 83, entradaDeclaracio: 97, compromis: 69
    });
    expect([R.midaDeclaracio(3), R.midaDeclaracio(255)]).toEqual([M.declaracio_SDPC_n3, M.declaracio_SDPC_n255]);
    expect(() => R.midaDeclaracio(2)).toThrow(ambCodi('AMICS_FORA_DE_RANG'));
    expect([R.BYTES_CT_AVAL, R.BYTES_CT_ALLIBERAMENT]).toEqual([R.BYTES_FRAGMENT + 16, R.BYTES_CARREGA_ALLIBERAMENT + 16]);
  });

  test('SDPH: "SDPH" ‖ 01 ‖ usuari16 ‖ kidP16 ‖ repartiment16 ‖ u8 x ‖ u8 k ‖ amic16 ‖ kidAmic16 (87 B, sense N)', () => {
    const bytes = R.construeixInfoAval(infoAval());
    expect(aHex(bytes)).toBe(aHex(ajunta(ascii('SDPH'), Uint8Array.of(1), u16(A), KID_P, u16(REP), Uint8Array.of(2), Uint8Array.of(3), u16(B), KID_AMIC)));
    expect(bytes.length).toBe(87);
    expect(R.llegixInfoAval(bytes)).toEqual({ ...infoAval(), llindar: 3 });
    // El que es llig es torna a construir tal qual (k = 3 inclòs); cap altre k no val.
    expect(aHex(R.construeixInfoAval(R.llegixInfoAval(bytes)))).toBe(aHex(bytes));
    expect(() => R.construeixInfoAval({ ...infoAval(), llindar: 2 })).toThrow(invalid('rang', { format: 'SDPH', camp: 'llindar' }));
    expect(() => R.llegixInfoAval(muta(bytes, 54, [4]))).toThrow(invalid('rang', { format: 'SDPH', camp: 'llindar' }));
  });

  test('SDPV i SDPL: els mateixos 175 B en el mateix ordre, amb la màgia com a única diferència', () => {
    const t = R.construeixVerificacio(valorsT());
    const infoL = R.construeixInfoAlliberament(valorsT());
    const cos = ajunta(Uint8Array.of(1), u16(A), KID_P, u16(REP), u16(PET), epk, u16(B), KID_AMIC, Uint8Array.of(2), be(T0 + DUES_HORES, 8));
    expect(aHex(t)).toBe(aHex(ajunta(ascii('SDPV'), cos)));
    expect(aHex(infoL)).toBe(aHex(ajunta(ascii('SDPL'), cos)));
    expect([t.length, infoL.length]).toEqual([175, 175]);
    expect(R.llegixVerificacio(t)).toEqual(valorsT());
    expect(R.llegixInfoAlliberament(infoL)).toEqual(valorsT());
    expect(() => R.llegixVerificacio(infoL)).toThrow(invalid('magia', { format: 'SDPV' }));
    expect(() => R.llegixInfoAlliberament(t)).toThrow(invalid('magia', { format: 'SDPL' }));
  });

  test('SDPP i SDPO: "SDPP" ‖ 01 ‖ hT ‖ nD (69 B) i "SDPO" ‖ 01 ‖ hT ‖ cD ‖ nD ‖ nA (133 B)', () => {
    const p = R.construeixCompromis({ hT: H32(0xa1), nD: H32(0xa3) });
    expect(aHex(p)).toBe(aHex(ajunta(ascii('SDPP'), Uint8Array.of(1), H32(0xa1), H32(0xa3))));
    expect(R.llegixCompromis(p)).toEqual({ hT: H32(0xa1), nD: H32(0xa3) });
    const o = R.construeixAprovacio(aprovacio());
    expect(aHex(o)).toBe(aHex(ajunta(ascii('SDPO'), Uint8Array.of(1), H32(0xa1), H32(0xa2), H32(0xa3), H32(0xa4))));
    expect(o.length).toBe(133);
    expect(R.llegixAprovacio(o)).toEqual(aprovacio());
    // hT i cD són hash: tot zeros no val; nD i nA són nonces i poden valdre qualsevol cosa.
    expect(() => R.construeixAprovacio({ ...aprovacio(), hT: new Uint8Array(32) })).toThrow(invalid('no-canonic', { format: 'SDPO', camp: 'hT' }));
    expect(() => R.construeixAprovacio({ ...aprovacio(), nA: new Uint8Array(32) })).not.toThrow();
    expect(() => R.construeixCompromis({ hT: H32(1), nD: H32(2).subarray(1) })).toThrow(invalid('mida', { format: 'SDPP', camp: 'nD' }));
  });

  test('SDPC: capçalera de 83 B ‖ n × (amic16 ‖ kidAmic16 ‖ u8 x ‖ envHash32 ‖ hF32); 374 B amb 3 i 24.818 amb 255', () => {
    const d = declaracio();
    const bytes = R.construeixDeclaracio(d);
    const capcalera = ajunta(ascii('SDPC'), Uint8Array.of(1), u16(A), KID_P, u16(REP), u16(REP0), be(2, 4), Uint8Array.of(3), Uint8Array.of(3), be(T0, 8));
    const entrades = d.amics.map((e) => ajunta(u16(e.amic), e.kidAmic, Uint8Array.of(e.x), e.envHash, e.hF));
    expect(aHex(bytes)).toBe(aHex(ajunta(capcalera, ...entrades)));
    expect(bytes.length).toBe(374);
    expect(R.llegixDeclaracio(bytes)).toEqual({ ...d, llindar: 3, total: 3 });
    expect(aHex(R.construeixDeclaracio(R.llegixDeclaracio(bytes)))).toBe(aHex(bytes));
    const gran = R.construeixDeclaracio(declaracio(255));
    expect(gran.length).toBe(24818);
    expect(R.llegixDeclaracio(gran).amics).toHaveLength(255);
    // repartimentAnterior absent → 16 zeros → null.
    const sense = R.construeixDeclaracio({ ...d, repartimentAnterior: null });
    expect(aHex(sense.subarray(53, 69))).toBe('00'.repeat(16));
    expect(R.llegixDeclaracio(sense).repartimentAnterior).toBeNull();
    expect(aHex(R.construeixDeclaracio({ ...declaracio(), repartimentAnterior: undefined }))).toBe(aHex(sense));
  });

  test('SDPC rebutja: x no creixent, amic repetit, menys de 3, forats, total fals, versió 0, truncat dins de les entrades i «total» com a entrada', () => {
    const d = declaracio();
    const desordenats = { ...d, amics: [d.amics[0], d.amics[2], d.amics[1]] };
    expect(() => R.construeixDeclaracio(desordenats)).toThrow(invalid('desordenat', { format: 'SDPC', camp: 'amics[2]' }));
    const iguals = { ...d, amics: [d.amics[0], { ...d.amics[1], x: 2 }, { ...d.amics[2], x: 2 }] };
    expect(() => R.construeixDeclaracio(iguals)).toThrow(invalid('desordenat', { camp: 'amics[2]' }));
    const repetit = { ...d, amics: [d.amics[0], d.amics[1], { ...d.amics[2], amic: d.amics[0].amic }] };
    expect(() => R.construeixDeclaracio(repetit)).toThrow(invalid('duplicat', { format: 'SDPC', camp: 'amics[2]' }));
    expect(() => R.construeixDeclaracio({ ...d, amics: d.amics.slice(0, 2) })).toThrow(invalid('rang', { camp: 'amics' }));
    expect(() => R.construeixDeclaracio({ ...d, amics: 'amics' })).toThrow(invalid('tipus', { camp: 'amics' }));
    const ambForat = [...d.amics];
    ambForat[1] = undefined;
    expect(() => R.construeixDeclaracio({ ...d, amics: ambForat })).toThrow(invalid('tipus', { camp: 'amics[1]' }));
    // El camp més intern guanya, com a xifratXatFormats.js.
    expect(() => R.construeixDeclaracio({ ...d, amics: [d.amics[0], d.amics[1], { ...d.amics[2], extra: 1 }] })).toThrow(invalid('desconegut', { format: 'SDPC', camp: 'extra' }));
    expect(() => R.construeixDeclaracio({ ...d, amics: [d.amics[0], d.amics[1], { amic: d.amics[2].amic }] })).toThrow(invalid('falta', { format: 'SDPC', camp: 'kidAmic' }));
    expect(() => R.construeixDeclaracio({ ...d, versio: 0 })).toThrow(invalid('rang', { format: 'SDPC', camp: 'versio' }));
    expect(() => R.construeixDeclaracio({ ...d, total: 3 })).not.toThrow();
    expect(() => R.construeixDeclaracio({ ...d, total: 4 })).toThrow(invalid('incoherent', { format: 'SDPC', camp: 'total' }));
    expect(() => R.construeixDeclaracio({ ...d, llindar: 2 })).toThrow(invalid('rang', { format: 'SDPC', camp: 'llindar' }));
    const bytes = R.construeixDeclaracio(d);
    expect(() => R.llegixDeclaracio(bytes.subarray(0, bytes.length - 1))).toThrow(invalid('truncat', { format: 'SDPC', camp: 'amics' }));
    expect(() => R.llegixDeclaracio(ajunta(bytes, Uint8Array.of(0)))).toThrow(invalid('sobrants', { camp: 'amics' }));
    expect(() => R.llegixDeclaracio(bytes.subarray(0, 60))).toThrow(invalid('truncat'));
    expect(() => R.llegixDeclaracio(muta(bytes, 74, [2]))).toThrow(invalid('rang', { camp: 'total' }));
    expect(() => R.llegixDeclaracio(muta(bytes, 73, [2]))).toThrow(invalid('rang', { camp: 'llindar' }));
    expect(() => R.llegixDeclaracio(muta(bytes, 83 + 32, [0]))).toThrow(invalid('rang', { camp: 'amics[0].x' }));
  });

  test('SDPN: "SDPN" ‖ 01 ‖ usuari16 ‖ kidP16 ‖ peticio16 ‖ u64be(ms) (61 B)', () => {
    const bytes = R.construeixNoSocJo({ usuari: A, kid: KID_P, peticio: PET, ms: T0 });
    expect(aHex(bytes)).toBe(aHex(ajunta(ascii('SDPN'), Uint8Array.of(1), u16(A), KID_P, u16(PET), be(T0, 8))));
    expect(bytes.length).toBe(61);
    expect(R.llegixNoSocJo(bytes)).toEqual({ usuari: A, kid: KID_P, peticio: PET, ms: T0 });
    expect(() => R.construeixNoSocJo({ usuari: A, kid: KID_P, peticio: PET, ms: 0 })).toThrow(invalid('rang', { format: 'SDPN', camp: 'ms' }));
  });

  const FORMATS = [
    ['SDPH', () => R.construeixInfoAval(infoAval()), R.llegixInfoAval, R.construeixInfoAval, infoAval],
    ['SDPV', () => R.construeixVerificacio(valorsT()), R.llegixVerificacio, R.construeixVerificacio, valorsT],
    ['SDPL', () => R.construeixInfoAlliberament(valorsT()), R.llegixInfoAlliberament, R.construeixInfoAlliberament, valorsT],
    ['SDPO', () => R.construeixAprovacio(aprovacio()), R.llegixAprovacio, R.construeixAprovacio, aprovacio],
    ['SDPN', () => R.construeixNoSocJo({ usuari: A, kid: KID_P, peticio: PET, ms: T0 }), R.llegixNoSocJo, R.construeixNoSocJo, () => ({ usuari: A, kid: KID_P, peticio: PET, ms: T0 })],
    ['SDPC', () => R.construeixDeclaracio(declaracio()), R.llegixDeclaracio, R.construeixDeclaracio, declaracio]
  ];

  test.each(FORMATS)('%s: l’analitzador rebutja la màgia i la versió errònies, els bytes sobrers i tallats, i el que no són bytes', (nom, fes, llig) => {
    const bytes = fes();
    for (let k = 0; k < 4; k += 1) expect(() => llig(muta(bytes, k, [bytes[k] ^ 0x20])), `màgia[${k}]`).toThrow(invalid('magia', { format: nom }));
    for (const versio of [0, 2, 255]) expect(() => llig(muta(bytes, 4, [versio]))).toThrow(invalid('versio', { format: nom }));
    expect(() => llig(ajunta(bytes, Uint8Array.of(0)))).toThrow(invalid('sobrants', { format: nom }));
    for (const n of [0, 3, 5, bytes.length - 1]) expect(() => llig(bytes.subarray(0, n)), `tallat a ${n}`).toThrow(invalid('truncat', { format: nom }));
    for (const dolent of [null, undefined, 'bytes', [...bytes], bytes.buffer, new Uint16Array(bytes.length)]) expect(() => llig(dolent)).toThrow(invalid('tipus', { format: nom }));
    expect(llig(fes())).toEqual(llig(bytes));
  });

  test.each(FORMATS)('%s: el constructor rebutja camps desconeguts, absents, heretats i valors que no són un objecte pla', (nom, fes, llig, construeix, valors) => {
    const v = valors();
    expect(() => construeix({ ...v, sobrant: 1 })).toThrow(invalid('desconegut', { format: nom, camp: 'sobrant' }));
    const [primer] = Object.keys(v);
    const sense = { ...v };
    delete sense[primer];
    expect(() => construeix(sense)).toThrow(invalid('falta', { format: nom, camp: primer }));
    for (const dolent of [null, undefined, [], 'valors', 7, Object.create(v), new Map(Object.entries(v))]) expect(() => construeix(dolent)).toThrow(invalid('tipus', { format: nom }));
    // Una propietat heretada no és cap entrada.
    const heretat = Object.create(Object.prototype, Object.getOwnPropertyDescriptors(sense));
    Object.setPrototypeOf(heretat, { [primer]: v[primer] });
    expect(() => construeix(heretat)).toThrow(invalid('tipus', { format: nom }));
  });

  test('camps: uuid no canònic o nul, kid a zeros, EPK fora de la corba o comprimida, x fora d’1..255, caducaMs fora de rang', () => {
    const v = valorsT();
    for (const uuid of [A.toUpperCase(), A.replaceAll('-', ''), '00000000-0000-0000-0000-000000000000', 'a', 7, null]) {
      expect(() => R.construeixVerificacio({ ...v, usuari: uuid }), String(uuid)).toThrow(invalid('no-canonic', { format: 'SDPV', camp: 'usuari' }));
    }
    expect(() => R.construeixVerificacio({ ...v, kid: new Uint8Array(16) })).toThrow(invalid('no-canonic', { camp: 'kid' }));
    expect(() => R.construeixVerificacio({ ...v, kidAmic: new Uint8Array(15).fill(1) })).toThrow(invalid('mida', { camp: 'kidAmic' }));
    expect(() => R.construeixVerificacio({ ...v, epk: muta(epk, 64, [epk[64] ^ 1]) })).toThrow(invalid('no-canonic', { camp: 'epk' }));
    expect(() => R.construeixVerificacio({ ...v, epk: muta(epk, 0, [0x02]) })).toThrow(invalid('no-canonic', { camp: 'epk' }));
    expect(() => R.construeixVerificacio({ ...v, epk: epk.subarray(0, 33) })).toThrow(invalid('mida', { camp: 'epk' }));
    for (const x of [0, 256, -1, 1.5, '2']) expect(() => R.construeixVerificacio({ ...v, x })).toThrow(invalid('rang', { camp: 'x' }));
    for (const caducaMs of [0, -1, 2 ** 53, 1.5]) expect(() => R.construeixVerificacio({ ...v, caducaMs })).toThrow(invalid('rang', { camp: 'caducaMs' }));
    // Un u64 que no cap en un enter segur es rebutja en llegir.
    const bytes = R.construeixVerificacio(v);
    expect(() => R.llegixVerificacio(muta(bytes, 167, [0x00, 0x20, 0, 0, 0, 0, 0, 0]))).toThrow(invalid('rang', { camp: 'caducaMs' }));
    expect(() => R.llegixVerificacio(muta(bytes, 166, [0]))).toThrow(invalid('rang', { camp: 'x' }));
    expect(() => R.llegixVerificacio(muta(bytes, 21, new Uint8Array(16)))).toThrow(invalid('no-canonic', { camp: 'kid' }));
  });

  test('la càrrega de l’alliberament: fragment33 ‖ σA64 (97 B), estricta en les dues direccions', () => {
    const fragment = fragmentDe(7, 0x5c);
    const firma = aleatoris(64);
    const carrega = R.construeixCarregaAlliberament({ fragment, firma });
    expect(aHex(carrega)).toBe(aHex(ajunta(fragment, firma)));
    expect(carrega.length).toBe(97);
    const llegida = R.llegixCarregaAlliberament(carrega);
    expect([aHex(llegida.fragment), aHex(llegida.firma)]).toEqual([aHex(fragment), aHex(firma)]);
    expect(llegida.fragment.buffer).not.toBe(carrega.buffer);
    expect(() => R.construeixCarregaAlliberament({ fragment, firma: firma.subarray(1) })).toThrow(invalid('mida', { camp: 'firma' }));
    expect(() => R.construeixCarregaAlliberament({ fragment: fragmentDe(0, 1), firma })).toThrow(ambCodi('INDEX_INVALID'));
    expect(() => R.construeixCarregaAlliberament({ fragment: fragment.subarray(1), firma })).toThrow(ambCodi('FRAGMENT_INVALID'));
    expect(() => R.llegixCarregaAlliberament(carrega.subarray(1))).toThrow(invalid('mida', { format: 'carregaAlliberament' }));
    expect(() => R.llegixCarregaAlliberament(muta(carrega, 0, [0]))).toThrow(ambCodi('INDEX_INVALID'));
  });
});

/* Un cercle de prova sencer: la persona P (usuari A), n amics amb claus DH i de signatura noves,
   el repartiment, els avals segellats i l'aparell nou D amb la seua EPK i la petició. */
async function muntaCercle(n) {
  const usuari = A;
  const kid = KID_P;
  const amics = [];
  for (let i = 0; i < n; i += 1) {
    const dh = await generaParellaDh(cripto);
    const sig = await generaParellaSignatura(cripto);
    amics.push({
      amic: uuidN(i + 1), kidAmic: new Uint8Array(16).fill(0x20 + i), dh, sig,
      dhPub: await exportaPublica(cripto, dh.publicKey), sigPub: await exportaPublica(cripto, sig.publicKey)
    });
  }
  const rk = aleatoris(32);
  const { repartiment, fragments } = await R.reparteix(cripto, { rk, usuari, kid, amics: amics.map(({ amic, kidAmic }) => ({ amic, kidAmic })) });
  for (const [i, amic] of amics.entries()) {
    const { x, infoAval, hF, fragment } = fragments[i];
    const { enc, ct } = await R.segellaAval(cripto, { pkR: amic.dhPub, infoAval, fragment });
    Object.assign(amic, { x, infoAval, hF, enc, ct, envHash: await R.hashAval(cripto, enc, ct) });
  }
  // La prova és omniscient i guarda els fragments; l'aparell de la persona els oblida (R2).
  const fragmentsOriginals = fragments.map((f) => Uint8Array.from(f.fragment));
  R.esborraFragments(fragments);
  const epkParella = await generaParellaDh(cripto);
  return {
    usuari, kid, rk, repartiment, amics, fragmentsOriginals, fragmentsRepartits: fragments, epkParella,
    epk: await exportaPublica(cripto, epkParella.publicKey), peticio: PET, caducaMs: T0 + DUES_HORES
  };
}

/* La T d'un amic tal com la veuen D i A (iguals si el servidor no ha canviat res). */
const valorsTDe = (c, amic) => ({
  usuari: c.usuari, kid: c.kid, repartiment: c.repartiment, peticio: c.peticio, epk: c.epk, amic: amic.amic, kidAmic: amic.kidAmic, x: amic.x, caducaMs: c.caducaMs
});

/* El SAS i l'alliberament de l'amic i-é, honestos: torna tot el que les dues bandes han vist. */
async function allibera(c, i, { signaAmb } = {}) {
  const amic = c.amics[i];
  const t = valorsTDe(c, amic);
  const hT = await R.hashVerificacio(cripto, t);
  const nD = aleatoris(32);
  const cD = await R.compromisSas(cripto, { hT, nD });
  const nA = aleatoris(32);
  expect(await R.comprovaCompromisSas(cripto, { hT, nD, cD })).toBe(true);
  const codiD = await R.codiSas(cripto, { hT, nD, nA });
  const codiA = await R.codiSas(cripto, { hT, nD, nA });
  expect(codiA).toBe(codiD);
  const aprovacio = R.construeixAprovacio({ hT, cD, nD, nA });
  const firma = await signa(cripto, (signaAmb ?? amic).sig.privateKey, aprovacio);
  // L'amic obri el seu aval només ací, en memòria, i el torna a segellar per a l'EPK.
  const fragment = await R.obriAval(cripto, { skR: amic.dh.privateKey, pkR: amic.dhPub, enc: amic.enc, ct: amic.ct, infoAval: amic.infoAval });
  const sobre = await R.segellaAlliberament(cripto, { pkR: c.epk, infoAlliberament: t, aprovacio, fragment, firma });
  const tornada = await R.codiTornada(cripto, { hT, nD, nA });
  fragment.fill(0);
  return { ...sobre, aprovacio, firma, t, hT, nD, cD, nA, codi: codiD, tornada };
}

/* D obri l'alliberament de l'amic i-é amb els seus propis valors (o els que la prova canvia). */
const obri = (c, i, a, canvis = {}) => R.obriAlliberament(cripto, {
  skR: c.epkParella.privateKey, pkR: c.epk, enc: a.enc, ct: a.ct, infoAlliberament: a.t, aprovacio: a.aprovacio, tornada: a.tornada,
  sigPubAmic: c.amics[i].sigPub, ...canvis
});

/* El registre que D passa a recuperaRk per a l'amic i-é: el que diu la declaració més el fragment obert. */
const registre = (c, i, fragment) => ({
  repartiment: c.repartiment, amic: c.amics[i].amic, kidAmic: c.amics[i].kidAmic, x: c.amics[i].x, hF: c.amics[i].hF, fragment
});

describe('l’aval, el compromís hF i el repartiment sencer (§5.6.1, §5.6.3)', () => {
  let c;
  beforeAll(async () => { c = await muntaCercle(5); });

  test('reparteix: repartiment uuid v4 nou, x = 1..n en l’ordre dels amics, info SDPH de 87 B i hF = SHA-256(SDPH ‖ fragment)', async () => {
    expect(c.repartiment).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(c.fragmentsRepartits).toHaveLength(5);
    for (const [i, f] of c.fragmentsRepartits.entries()) {
      expect(f.x).toBe(i + 1);
      expect(f.amic).toBe(c.amics[i].amic);
      expect(f.infoAval.length).toBe(87);
      expect(R.llegixInfoAval(f.infoAval)).toEqual({ usuari: A, kid: KID_P, repartiment: c.repartiment, x: i + 1, llindar: 3, amic: c.amics[i].amic, kidAmic: c.amics[i].kidAmic });
      expect(aHex(f.hF)).toBe(aHex(await sha256(ajunta(f.infoAval, c.fragmentsOriginals[i]))));
      expect(aHex(await R.compromisFragment(cripto, R.llegixInfoAval(f.infoAval), c.fragmentsOriginals[i]))).toBe(aHex(f.hF));
      // esborraFragments els ha posat a zero; l'aparell no els guarda.
      expect(f.fragment.every((byte) => byte === 0)).toBe(true);
    }
    expect(aHex(R.recomponRk(c.fragmentsOriginals.slice(1, 4)))).toBe(aHex(c.rk));
    // Un altre repartiment de la mateixa RK: id nou i fragments nous.
    const altre = await R.reparteix(cripto, { rk: c.rk, usuari: A, kid: KID_P, amics: c.amics.map(({ amic, kidAmic }) => ({ amic, kidAmic })) });
    expect(altre.repartiment).not.toBe(c.repartiment);
    expect(aHex(altre.fragments[0].fragment)).not.toBe(aHex(c.fragmentsOriginals[0]));
  });

  test('l’aval fa 49 B, envHash = SHA-256(enc ‖ ct), i només l’amic l’obri amb la seua info exacta', async () => {
    const amic = c.amics[2];
    expect([amic.enc.length, amic.ct.length]).toEqual([65, 49]);
    expect(aHex(amic.envHash)).toBe(aHex(await sha256(ajunta(amic.enc, amic.ct))));
    const fragment = await R.obriAval(cripto, { skR: amic.dh.privateKey, pkR: amic.dhPub, enc: amic.enc, ct: amic.ct, infoAval: amic.infoAval });
    expect(aHex(fragment)).toBe(aHex(c.fragmentsOriginals[2]));
    const valors = R.llegixInfoAval(amic.infoAval);
    expect(aHex(await R.obriAval(cripto, { skR: amic.dh.privateKey, pkR: amic.dhPub, enc: amic.enc, ct: amic.ct, infoAval: valors }))).toBe(aHex(fragment));
    const altre = c.amics[3];
    await expect(R.obriAval(cripto, { skR: altre.dh.privateKey, pkR: altre.dhPub, enc: amic.enc, ct: amic.ct, infoAval: amic.infoAval })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    // L'amic 2 té x = 3 i kidAmic 0x22: els canvis han de ser de veres.
    for (const canvi of [{ x: 4 }, { amic: B }, { kidAmic: new Uint8Array(16).fill(0x77) }, { repartiment: REP }, { kid: new Uint8Array(16).fill(9) }, { usuari: B }]) {
      expect(R.construeixInfoAval({ ...valors, ...canvi })).not.toEqual(amic.infoAval);
      await expect(R.obriAval(cripto, { skR: amic.dh.privateKey, pkR: amic.dhPub, enc: amic.enc, ct: amic.ct, infoAval: { ...valors, ...canvi } }), JSON.stringify(Object.keys(canvi)))
        .rejects.toEqual(ambCodi('SOBRE_INVALID'));
    }
    await expect(R.obriAval(cripto, { skR: amic.dh.privateKey, pkR: amic.dhPub, enc: amic.enc, ct: amic.ct.subarray(0, 48), infoAval: amic.infoAval })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    await expect(R.obriAval(cripto, { skR: amic.dh.privateKey, pkR: amic.dhPub, enc: amic.enc, ct: muta(amic.ct, 10, [amic.ct[10] ^ 1]), infoAval: amic.infoAval })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    await expect(R.obriAval(cripto, { skR: amic.dh.privateKey, pkR: amic.dhPub, enc: muta(amic.enc, 64, [amic.enc[64] ^ 1]), ct: amic.ct, infoAval: amic.infoAval })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    // L'info amb un x que no és el del fragment no se segella (INDEX_INCOHERENT), ni es compromet.
    await expect(R.segellaAval(cripto, { pkR: amic.dhPub, infoAval: { ...valors, x: 4 }, fragment })).rejects.toEqual(ambCodi('INDEX_INCOHERENT'));
    await expect(R.compromisFragment(cripto, { ...valors, x: 4 }, fragment)).rejects.toEqual(ambCodi('INDEX_INCOHERENT'));
    await expect(R.hashAval(cripto, amic.enc, amic.ct.subarray(1))).rejects.toEqual(invalid('mida', { camp: 'ct' }));
  });

  test('un byte canviat del fragment canvia el hF (el compromís el delata abans de combinar)', async () => {
    const amic = c.amics[0];
    for (let k = 1; k < 33; k += 1) {
      const manipulat = muta(c.fragmentsOriginals[0], k, [c.fragmentsOriginals[0][k] ^ 0x80]);
      expect(aHex(await R.compromisFragment(cripto, amic.infoAval, manipulat)), `byte ${k}`).not.toBe(aHex(amic.hF));
    }
  });

  test('reparteix rebutja: menys de 3 o més de 255 amics, un amic repetit, un uuid o un kid mal formats, una RK que no fa 32 B, i no deixa cap fragment viu', async () => {
    const amics = (n) => Array.from({ length: n }, (_, k) => ({ amic: uuidN(k + 1), kidAmic: new Uint8Array(16).fill(k + 1) }));
    const rk = aleatoris(32);
    for (const n of [0, 2, 256]) await expect(R.reparteix(cripto, { rk, usuari: A, kid: KID_P, amics: amics(n) }), `n = ${n}`).rejects.toEqual(ambCodi('AMICS_FORA_DE_RANG'));
    const crides = [];
    const repetits = [...amics(3), { amic: uuidN(2), kidAmic: new Uint8Array(16).fill(9) }];
    await expect(R.reparteix(criptoAmbGenerador(crides), { rk, usuari: A, kid: KID_P, amics: repetits })).rejects.toEqual(ambCodi('AMIC_REPETIT'));
    expect(crides.map((b) => b.length)).toEqual([]);
    await expect(R.reparteix(cripto, { rk, usuari: A, kid: KID_P, amics: [...amics(2), { amic: 'x', kidAmic: KID_AMIC }] })).rejects.toEqual(invalid('no-canonic', { camp: 'amics[2].amic' }));
    await expect(R.reparteix(cripto, { rk, usuari: A, kid: KID_P, amics: [...amics(2), { amic: uuidN(9), kidAmic: new Uint8Array(16) }] })).rejects.toEqual(invalid('no-canonic', { format: 'SDPH', camp: 'kidAmic' }));
    await expect(R.reparteix(cripto, { rk, usuari: A, kid: KID_P, amics: [...amics(2), { amic: uuidN(9) }] })).rejects.toEqual(invalid('falta', { format: 'SDPH', camp: 'kidAmic' }));
    await expect(R.reparteix(cripto, { rk, usuari: A, kid: KID_P, amics: [...amics(2), { amic: uuidN(9), kidAmic: KID_AMIC, x: 3 }] })).rejects.toEqual(invalid('desconegut', { camp: 'x' }));
    await expect(R.reparteix(cripto, { rk: aleatoris(16), usuari: A, kid: KID_P, amics: amics(3) })).rejects.toEqual(ambCodi('RK_INVALIDA'));
    await expect(R.reparteix(cripto, { rk, usuari: 'A', kid: KID_P, amics: amics(3) })).rejects.toEqual(invalid('no-canonic', { format: 'SDPH', camp: 'usuari' }));
    expect(crides).toHaveLength(0);
  });
});

describe('la verificació SAS amb compromís (esmenes §4, disseny §5.6.2)', () => {
  let epk;
  let t;
  let hT;
  const nD = H32(0xd0);
  const nA = H32(0xa0);
  beforeAll(async () => {
    epk = await exportaPublica(cripto, (await generaParellaDh(cripto)).publicKey);
    t = { ...VALORS_T, epk };
    hT = await R.hashVerificacio(cripto, t);
  });

  test('hT = SHA-256(T) i cD = SHA-256("SDPP" ‖ 01 ‖ hT ‖ nD); l’amic el comprova abans de calcular res', async () => {
    expect(aHex(hT)).toBe(aHex(await sha256(R.construeixVerificacio(t))));
    expect(aHex(await R.hashVerificacio(cripto, R.construeixVerificacio(t)))).toBe(aHex(hT));
    const cD = await R.compromisSas(cripto, { hT, nD });
    expect(aHex(cD)).toBe(aHex(await sha256(ajunta(ascii('SDPP'), Uint8Array.of(1), hT, nD))));
    expect(await R.comprovaCompromisSas(cripto, { hT, nD, cD })).toBe(true);
    expect(await R.comprovaCompromisSas(cripto, { hT, nD: H32(0xd1), cD })).toBe(false);
    expect(await R.comprovaCompromisSas(cripto, { hT: H32(1), nD, cD })).toBe(false);
    expect(await R.comprovaCompromisSas(cripto, { hT, nD, cD: muta(cD, 0, [cD[0] ^ 1]) })).toBe(false);
    await expect(R.comprovaCompromisSas(cripto, { hT, nD, cD: cD.subarray(1) })).rejects.toEqual(invalid('mida', { format: 'SAS', camp: 'cD' }));
    await expect(R.compromisSas(cripto, { hT, nD: nD.subarray(1) })).rejects.toEqual(invalid('mida', { format: 'SDPP', camp: 'nD' }));
  });

  test('codi i tornada: u64be(HKDF-SHA256(nD ‖ nA, sal = hT, info = etiqueta ‖ 0x00, 8)) mod 10⁶, 6 xifres, recalculats a mà', async () => {
    const aMa = async (etiqueta) => {
      const prk = await hkdfExtract(cripto, hT, ajunta(nD, nA));
      const okm = await hkdfExpand(cripto, prk, ajunta(ascii(etiqueta), Uint8Array.of(0)), 8);
      let n = 0n;
      for (const byte of okm) n = (n << 8n) | BigInt(byte);
      return String(n % 1000000n).padStart(6, '0');
    };
    const codi = await R.codiSas(cripto, { hT, nD, nA });
    const tornada = await R.codiTornada(cripto, { hT, nD, nA });
    expect(codi).toMatch(/^\d{6}$/);
    expect(tornada).toMatch(/^\d{6}$/);
    expect(codi).toBe(await aMa(VECTORS.sas_5_6_2.etiqueta_codi));
    expect(tornada).toBe(await aMa(VECTORS.sas_5_6_2.etiqueta_tornada));
    expect(`sdp-xat-v1/${R.ETIQUETES_SAS.codi}`).toBe(VECTORS.sas_5_6_2.etiqueta_codi);
    expect(`sdp-xat-v1/${R.ETIQUETES_SAS.tornada}`).toBe(VECTORS.sas_5_6_2.etiqueta_tornada);
    expect(codi).not.toBe(tornada);
    expect(await R.codiSas(cripto, { hT, nD, nA })).toBe(codi);
    for (const camp of ['hT', 'nD', 'nA']) {
      await expect(R.codiSas(cripto, { hT, nD, nA, [camp]: H32(1).subarray(1) })).rejects.toEqual(invalid('mida', { format: 'SAS', camp }));
    }
  });

  test('cada camp de T canvia el codi i la tornada (el servidor no pot substituir-ne cap sense que els codis divergisquen)', async () => {
    const altraEpk = await exportaPublica(cripto, (await generaParellaDh(cripto)).publicKey);
    const codi = await R.codiSas(cripto, { hT, nD, nA });
    const tornada = await R.codiTornada(cripto, { hT, nD, nA });
    const canvis = { usuari: B, kid: new Uint8Array(16).fill(0x12), repartiment: REP0, peticio: A, epk: altraEpk, amic: A, kidAmic: new Uint8Array(16).fill(0x23), x: 3, caducaMs: T0 + DUES_HORES - 1 };
    for (const [camp, valor] of Object.entries(canvis)) {
      const hT2 = await R.hashVerificacio(cripto, { ...t, [camp]: valor });
      expect(aHex(hT2), camp).not.toBe(aHex(hT));
      expect(await R.codiSas(cripto, { hT: hT2, nD, nA }), camp).not.toBe(codi);
      expect(await R.codiTornada(cripto, { hT: hT2, nD, nA }), camp).not.toBe(tornada);
    }
    // nD i nA també: un servidor que en canvia un en una banda trenca la coincidència.
    expect(await R.codiSas(cripto, { hT, nD: H32(0xd1), nA })).not.toBe(codi);
    expect(await R.codiSas(cripto, { hT, nD, nA: H32(0xa1) })).not.toBe(codi);
  });

  test('codisIguals: només dos textos de 6 xifres iguals; res més', () => {
    expect(R.codisIguals('482913', '482913')).toBe(true);
    expect(R.codisIguals('482913', '482914')).toBe(false);
    expect(R.codisIguals('48291', '482913')).toBe(false);
    expect(R.codisIguals('482913 ', '482913')).toBe(false);
    expect(R.codisIguals(482913, '482913')).toBe(false);
    expect(R.codisIguals('482913', '48291')).toBe(false);
    expect(R.codisIguals(undefined, undefined)).toBe(false);
  });
});

describe('l’alliberament d’anada i tornada amb claus noves, i la reconstrucció autenticada (§5.6.3, §5.6.6)', () => {
  let c;
  let alliberaments;
  let oberts;
  beforeAll(async () => {
    c = await muntaCercle(9);
    alliberaments = [];
    oberts = [];
    for (let i = 0; i < 9; i += 1) {
      const a = await allibera(c, i);
      alliberaments.push(a);
      oberts.push(await obri(c, i, a));
    }
  });

  test('el sobre fa 113 B (+ enc de 65), i D recupera el fragment i la σA de cada amic amb la tornada correcta', () => {
    for (const [i, a] of alliberaments.entries()) {
      expect([a.enc.length, a.ct.length, a.aprovacio.length]).toEqual([65, 113, 133]);
      expect(aHex(oberts[i].fragment)).toBe(aHex(c.fragmentsOriginals[i]));
      expect(aHex(oberts[i].firma)).toBe(aHex(a.firma));
      expect(a.tornada).toMatch(/^\d{6}$/);
      expect(a.codi).not.toBe(a.tornada);
    }
  });

  test('recuperaRk: amb 3 alliberaments dona la RK; amb 5 i amb 8 (els «5 o 8» de DM-7), també, comprovant la consistència', async () => {
    const registres = oberts.map((o, i) => registre(c, i, o.fragment));
    for (const tria of [[0, 1, 2], [8, 4, 6], [2, 7, 1]]) {
      const rk = await R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: tria.map((i) => registres[i]) });
      expect(aHex(rk), tria.join(',')).toBe(aHex(c.rk));
      rk.fill(0);
    }
    expect(aHex(await R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: registres.slice(0, 5) }))).toBe(aHex(c.rk));
    expect(aHex(await R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: registres.slice(1, 9) }))).toBe(aHex(c.rk));
    await expect(R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: registres })).rejects.toEqual(ambCodi('MASSA_FRAGMENTS'));
    await expect(R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: registres.slice(0, 2) })).rejects.toEqual(ambCodi('FRAGMENTS_INSUFICIENTS'));
    await expect(R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: 'registres' })).rejects.toThrow(TypeError);
  });

  test('sense la tornada correcta no s’obri res (R7): TORNADA_INCORRECTA abans de cap desxifrat', async () => {
    const a = alliberaments[0];
    const desxifrats = [];
    const vigilat = criptoVigilat((nom) => { if (nom === 'decrypt') desxifrats.push(nom); });
    const altra = a.tornada === '000000' ? '000001' : '000000';
    await expect(R.obriAlliberament(vigilat, {
      skR: c.epkParella.privateKey, pkR: c.epk, enc: a.enc, ct: a.ct, infoAlliberament: a.t, aprovacio: a.aprovacio, tornada: altra, sigPubAmic: c.amics[0].sigPub
    })).rejects.toEqual(ambCodi('TORNADA_INCORRECTA'));
    await expect(obri(c, 0, a, { tornada: a.codi })).rejects.toEqual(ambCodi('TORNADA_INCORRECTA'));
    await expect(obri(c, 0, a, { tornada: `${a.tornada} ` })).rejects.toEqual(ambCodi('TORNADA_INCORRECTA'));
    await expect(obri(c, 0, a, { tornada: alliberaments[1].tornada })).rejects.toEqual(ambCodi('TORNADA_INCORRECTA'));
    await expect(obri(c, 0, a, { tornada: Number(a.tornada) })).rejects.toThrow(TypeError);
    await expect(obri(c, 0, a, { tornada: undefined })).rejects.toThrow(TypeError);
    expect(desxifrats).toHaveLength(0);
  });

  test('manipular qualsevol camp d’info_L a la banda de D fa fallar l’obertura (SOBRE_INVALID)', async () => {
    const a = alliberaments[1];
    const altraEpk = await exportaPublica(cripto, (await generaParellaDh(cripto)).publicKey);
    const canvis = { usuari: B, kid: new Uint8Array(16).fill(0x12), repartiment: REP0, peticio: A, epk: altraEpk, amic: c.amics[2].amic, kidAmic: c.amics[2].kidAmic, x: 3, caducaMs: c.caducaMs - 1 };
    for (const [camp, valor] of Object.entries(canvis)) {
      await expect(obri(c, 1, a, { infoAlliberament: { ...a.t, [camp]: valor } }), camp).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    }
    // Els bytes de SDPL també valen com a info; una info d'un altre format, no.
    expect(aHex((await obri(c, 1, a, { infoAlliberament: R.construeixInfoAlliberament(a.t) })).fragment)).toBe(aHex(c.fragmentsOriginals[1]));
    await expect(obri(c, 1, a, { infoAlliberament: R.construeixVerificacio(a.t) })).rejects.toEqual(invalid('magia', { format: 'SDPL' }));
  });

  test('manipular qualsevol component de l’AAD (hT, cD, nD, nA) fa fallar l’obertura, encara que la tornada es recalcule', async () => {
    const a = alliberaments[2];
    for (const camp of ['hT', 'cD', 'nD', 'nA']) {
      const valors = R.llegixAprovacio(a.aprovacio);
      const manipulada = R.construeixAprovacio({ ...valors, [camp]: muta(valors[camp], 5, [valors[camp][5] ^ 1]) });
      const { hT, nD, nA } = R.llegixAprovacio(manipulada);
      const tornada = await R.codiTornada(cripto, { hT, nD, nA });
      if (camp !== 'cD') expect(tornada, camp).not.toBe(a.tornada);
      await expect(obri(c, 2, a, { aprovacio: manipulada, tornada }), camp).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    }
    await expect(obri(c, 2, a, { aprovacio: a.aprovacio.subarray(1) })).rejects.toEqual(invalid('magia', { format: 'SDPO' }));
  });

  test('el xifrat, l’enc o l’EPK manipulats: SOBRE_INVALID; mides que no són 113 B, també', async () => {
    const a = alliberaments[3];
    await expect(obri(c, 3, a, { ct: muta(a.ct, 40, [a.ct[40] ^ 1]) })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    await expect(obri(c, 3, a, { ct: a.ct.subarray(0, 112) })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    await expect(obri(c, 3, a, { ct: ajunta(a.ct, Uint8Array.of(0)) })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    await expect(obri(c, 3, a, { enc: muta(a.enc, 64, [a.enc[64] ^ 1]) })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    await expect(obri(c, 3, a, { enc: alliberaments[4].enc })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    const altra = await generaParellaDh(cripto);
    await expect(obri(c, 3, a, { skR: altra.privateKey })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
    await expect(obri(c, 3, a, { pkR: await exportaPublica(cripto, altra.publicKey) })).rejects.toEqual(ambCodi('SOBRE_INVALID'));
  });

  test('σA d’un altre amic, o verificada amb la clau d’un altre: SIGNATURA_INVALIDA, i el text en clar obert es posa a zero', async () => {
    const suplantat = await allibera(c, 4, { signaAmb: c.amics[5] });
    const oberts = [];
    const vigilat = criptoVigilat((nom, args, eixida) => { if (nom === 'decrypt') oberts.push(eixida); });
    await expect(R.obriAlliberament(vigilat, {
      skR: c.epkParella.privateKey, pkR: c.epk, enc: suplantat.enc, ct: suplantat.ct, infoAlliberament: suplantat.t, aprovacio: suplantat.aprovacio,
      tornada: suplantat.tornada, sigPubAmic: c.amics[4].sigPub
    })).rejects.toEqual(ambCodi('SIGNATURA_INVALIDA'));
    expect(oberts).toHaveLength(1);
    expect(new Uint8Array(oberts[0]).every((byte) => byte === 0)).toBe(true);
    await expect(obri(c, 4, alliberaments[4], { sigPubAmic: c.amics[5].sigPub })).rejects.toEqual(ambCodi('SIGNATURA_INVALIDA'));
    await expect(obri(c, 4, alliberaments[4], { sigPubAmic: muta(c.amics[4].sigPub, 64, [c.amics[4].sigPub[64] ^ 1]) })).rejects.toEqual(ambCodi('PUNT_INVALID'));
    // Amb la pública bona de qui ha signat, el fragment és el de l'amic 4 encara que l'haja signat el 5: la frontera és la declaració (hF, amic).
    expect(aHex((await obri(c, 4, suplantat, { sigPubAmic: c.amics[5].sigPub })).fragment)).toBe(aHex(c.fragmentsOriginals[4]));
  });

  test('un alliberament fabricat pel servidor per a l’EPK: sense la clau de l’amic no passa σA; amb una A i una σA reutilitzades, no passa hF', async () => {
    const a = alliberaments[5];
    const servidor = await generaParellaSignatura(cripto);
    const inventat = fragmentDe(c.amics[5].x, 0x99);
    const firmaServidor = await signa(cripto, servidor.privateKey, a.aprovacio);
    const falsA = await R.segellaAlliberament(cripto, { pkR: c.epk, infoAlliberament: a.t, aprovacio: a.aprovacio, fragment: inventat, firma: firmaServidor });
    await expect(obri(c, 5, { ...a, ...falsA })).rejects.toEqual(ambCodi('SIGNATURA_INVALIDA'));
    const falsB = await R.segellaAlliberament(cripto, { pkR: c.epk, infoAlliberament: a.t, aprovacio: a.aprovacio, fragment: inventat, firma: a.firma });
    const obert = await obri(c, 5, { ...a, ...falsB });
    expect(aHex(obert.fragment)).toBe(aHex(inventat));
    const registres = [registre(c, 0, oberts[0].fragment), registre(c, 1, oberts[1].fragment), registre(c, 5, obert.fragment)];
    await expect(R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: registres })).rejects.toEqual(ambCodi('COMPROMIS_INVALID'));
    // Un sol byte canviat d'un fragment honest, també.
    const tocat = muta(oberts[2].fragment, 9, [oberts[2].fragment[9] ^ 1]);
    await expect(R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: [registres[0], registres[1], registre(c, 2, tocat)] })).rejects.toEqual(ambCodi('COMPROMIS_INVALID'));
  });

  test('segellaAlliberament rebutja un fragment amb un x que no és el de l’info, una EPK que no és la de l’info i una σA que no fa 64 B', async () => {
    const a = alliberaments[6];
    const fragment = Uint8Array.from(c.fragmentsOriginals[6]);
    await expect(R.segellaAlliberament(cripto, { pkR: c.epk, infoAlliberament: a.t, aprovacio: a.aprovacio, fragment: c.fragmentsOriginals[7], firma: a.firma })).rejects.toEqual(ambCodi('INDEX_INCOHERENT'));
    const altra = await exportaPublica(cripto, (await generaParellaDh(cripto)).publicKey);
    await expect(R.segellaAlliberament(cripto, { pkR: altra, infoAlliberament: a.t, aprovacio: a.aprovacio, fragment, firma: a.firma })).rejects.toEqual(invalid('incoherent', { format: 'SDPL', camp: 'epk' }));
    await expect(R.segellaAlliberament(cripto, { pkR: c.epk, infoAlliberament: a.t, aprovacio: a.aprovacio, fragment, firma: a.firma.subarray(1) })).rejects.toEqual(invalid('mida', { camp: 'firma' }));
    await expect(R.segellaAlliberament(cripto, { pkR: c.epk, infoAlliberament: a.t, aprovacio: a.aprovacio.subarray(0, 132), fragment, firma: a.firma })).rejects.toEqual(invalid('truncat', { format: 'SDPO' }));
  });

  test('recuperaRk rebutja: repartiment barrejat, amic repetit, x repetit, x que no és el declarat, fragment mal format, entrades mal formades', async () => {
    const registres = oberts.map((o, i) => registre(c, i, o.fragment));
    const base = { usuari: A, kid: KID_P, repartiment: c.repartiment };
    const altre = await R.reparteix(cripto, { rk: c.rk, usuari: A, kid: KID_P, amics: c.amics.slice(0, 3).map(({ amic, kidAmic }) => ({ amic, kidAmic })) });
    const dUnAltre = { ...registre(c, 2, altre.fragments[2].fragment), repartiment: altre.repartiment, hF: altre.fragments[2].hF };
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], dUnAltre] })).rejects.toEqual(ambCodi('REPARTIMENT_BARREJAT'));
    await expect(R.recuperaRk(cripto, { ...base, repartiment: altre.repartiment, alliberats: registres.slice(0, 3) })).rejects.toEqual(ambCodi('REPARTIMENT_BARREJAT'));
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], registres[0]] })).rejects.toEqual(ambCodi('AMIC_REPETIT'));
    // Un x repetit amb un amic distint només passa hF si la declaració és falsa: la prova la fabrica.
    const falsa = { ...registre(c, 3, oberts[0].fragment), x: 1 };
    falsa.hF = await R.compromisFragment(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, x: 1, amic: falsa.amic, kidAmic: falsa.kidAmic }, falsa.fragment);
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], falsa] })).rejects.toEqual(ambCodi('INDEX_REPETIT'));
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], { ...registres[2], x: 4 }] })).rejects.toEqual(ambCodi('INDEX_INCOHERENT'));
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], { ...registres[2], fragment: registres[2].fragment.subarray(1) }] })).rejects.toEqual(ambCodi('FRAGMENT_INVALID'));
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], { ...registres[2], fragment: muta(registres[2].fragment, 0, [0]) }] })).rejects.toEqual(ambCodi('INDEX_INVALID'));
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], { ...registres[2], hF: registres[2].hF.subarray(1) }] })).rejects.toEqual(ambCodi('COMPROMIS_INVALID'));
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], { ...registres[2], sobrant: 1 }] })).rejects.toEqual(invalid('desconegut', { format: 'alliberament', camp: 'sobrant' }));
    const senseHf = { ...registres[2] };
    delete senseHf.hF;
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], senseHf] })).rejects.toEqual(invalid('falta', { format: 'alliberament', camp: 'hF' }));
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], null] })).rejects.toEqual(invalid('tipus', { camp: 'alliberats[2]' }));
    await expect(R.recuperaRk(cripto, { ...base, alliberats: [registres[0], registres[1], { ...registres[2], repartiment: 'rep' }] })).rejects.toEqual(invalid('no-canonic', { camp: 'alliberats[2].repartiment' }));
    await expect(R.recuperaRk(cripto, { ...base, kid: new Uint8Array(16).fill(0x12), alliberats: registres.slice(0, 3) })).rejects.toEqual(ambCodi('COMPROMIS_INVALID'));
    await expect(R.recuperaRk(cripto, { ...base, usuari: B, alliberats: registres.slice(0, 3) })).rejects.toEqual(ambCodi('COMPROMIS_INVALID'));
  });

  test('un fragment inconsistent que passa hF (declaració falsa) atura la reconstrucció: FRAGMENTS_INCONSISTENTS, siga on siga', async () => {
    const registres = oberts.map((o, i) => registre(c, i, o.fragment));
    const inventat = Uint8Array.from(c.fragmentsOriginals[4]);
    inventat.set(aleatoris(32), 1);
    const fals = { ...registre(c, 4, inventat) };
    fals.hF = await R.compromisFragment(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, x: fals.x, amic: fals.amic, kidAmic: fals.kidAmic }, inventat);
    await expect(R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: [registres[0], registres[1], registres[2], fals] })).rejects.toEqual(ambCodi('FRAGMENTS_INCONSISTENTS'));
    await expect(R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: [fals, registres[0], registres[1], registres[2]] })).rejects.toEqual(ambCodi('FRAGMENTS_INCONSISTENTS'));
    await expect(R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: [registres[0], fals, ...registres.slice(5, 9)] })).rejects.toEqual(ambCodi('FRAGMENTS_INCONSISTENTS'));
    // Amb només tres, un fragment fals que passa hF no es pot detectar per consistència: la RK no obri la còpia (§5.6.6, de qui crida).
    const rk = await R.recuperaRk(cripto, { usuari: A, kid: KID_P, repartiment: c.repartiment, alliberats: [registres[0], registres[1], fals] });
    expect(aHex(rk)).not.toBe(aHex(c.rk));
    rk.fill(0);
  });

  test('higiene: esborraBytes i esborraFragments posen a zero els Uint8Array i ignoren la resta', () => {
    const a = aleatoris(8);
    const b = aleatoris(3);
    R.esborraBytes(a, null, 'text', undefined, b, 7);
    expect([...a, ...b].every((byte) => byte === 0)).toBe(true);
    const fragments = R.reparteixRk(cripto, aleatoris(32), 3);
    R.esborraFragments([fragments[0], { fragment: fragments[1] }, { x: 3 }, null]);
    expect(fragments[0].every((byte) => byte === 0)).toBe(true);
    expect(fragments[1].every((byte) => byte === 0)).toBe(true);
    expect(fragments[2].some((byte) => byte !== 0)).toBe(true);
    R.esborraFragments(undefined);
  });
});

describe('vectors pendents (esmenes §9.4)', () => {
  test.skip('Shamir en els dos sentits contra una implementació independent fixada per versió i commit (pendent: cal baixar l’eina amb el permís del Mestre; vectors_shamir_independents_v1.json no existix)', () => {});

  test('el JSON els marca pendents amb el motiu i el procediment de §9.4', () => {
    expect(VECTORS.shamir_independents.estat).toBe('pendent');
    expect(VECTORS.shamir_independents.motiu).toMatch(/permís del Mestre/);
    expect(VECTORS.shamir_independents.procediment).toHaveLength(4);
  });
});
