// @vitest-environment node
/* El dibuix del QR (Onada 6, 261009). Tres menes de prova:
     · vectors coneguts: els codis Reed-Solomon de «HELLO WORLD» 1-M (el
       tutorial de Thonky) i de l'exemple «01234567» 1-M de l'annex I de la
       norma; els bits de format del nivell M i els de versió de la taula de
       la norma; les posicions d'alineament i les capacitats de la taula;
     · un LECTOR escrit ací des de zero, sense importar res del codificador:
       comprova els patrons de cerca, els separadors, el temps, el mòdul fosc
       i els patrons d'alineament (posicions de la taula de la norma), llig
       les dues còpies del format i les valida amb un BCH calculat per divisió
       llarga, desfà la màscara, recorre el zig-zag, desentrellaça els blocs,
       exigix que cada bloc siga una paraula Reed-Solomon (síndromes nul·les,
       amb una multiplicació de GF(256) per desplaçaments, no per taules) i
       torna a traure el text;
     · la tria de la màscara: la de menys penalització, amb un cas fet a mà.
   La lectura amb un lector real (BarcodeDetector del navegador) va a part, a
   la verificació visual de la pantalla. */
import { describe, expect, test } from 'vitest';
import {
  VERSIO_MAXIMA, bitsDeFormat, bitsDeVersio, blocsDe, camiSvgQR, capacitatBytes, codificaQR, codisDeCorreccio,
  codisDeDades, codisTotals, penalitzacio, posicionsAlineament
} from './qrDibuix.js';
import { textQR } from './registre/qr.js';

/* ── El lector de la prova ── */

/* GF(256) amb x^8 + x^4 + x^3 + x^2 + 1, per desplaçaments. */
function mulGF(a, b) {
  let p = 0;
  let x = a;
  let y = b;
  while (y) {
    if (y & 1) p ^= x;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
    y >>= 1;
  }
  return p;
}
function potGF(base, exponent) {
  let r = 1;
  for (let i = 0; i < exponent; i++) r = mulGF(r, base);
  return r;
}
/* Una paraula Reed-Solomon de n codis de correcció s'anul·la a α^0 … α^(n-1). */
function esParaulaRS(bloc, n) {
  for (let i = 0; i < n; i++) {
    const x = potGF(2, i);
    let s = 0;
    for (const c of bloc) s = mulGF(s, x) ^ c;
    if (s !== 0) return false;
  }
  return true;
}

/* Els 32 formats vàlids, per divisió llarga entre x^10 + x^8 + x^5 + x^4 + x^2 + x + 1. */
function formatPerDivisio(nivell, mascara) {
  const dades = (nivell << 3) | mascara;
  let r = dades << 10;
  for (let i = 14; i >= 10; i--) if ((r >> i) & 1) r ^= 0x537 << (i - 10);
  return ((dades << 10) | r) ^ 0x5412;
}
function versioPerDivisio(v) {
  let r = v << 12;
  for (let i = 17; i >= 12; i--) if ((r >> i) & 1) r ^= 0x1f25 << (i - 12);
  return (v << 12) | r;
}

/* Taules de la norma, escrites ací per al lector (no venen del codificador). Les 40 versions (correcció
   de la revisió, 261009: abans, de l'11 a la 39 només n'hi havia unes quantes i no tenien prova de límit). */
const ALINEAMENT = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46],
  10: [6, 28, 50], 11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66], 15: [6, 26, 48, 70],
  16: [6, 26, 50, 74], 17: [6, 30, 54, 78], 18: [6, 30, 56, 82], 19: [6, 30, 58, 86], 20: [6, 34, 62, 90],
  21: [6, 28, 50, 72, 94], 22: [6, 26, 50, 74, 98], 23: [6, 30, 54, 78, 102], 24: [6, 28, 54, 80, 106],
  25: [6, 32, 58, 84, 110], 26: [6, 30, 58, 86, 114], 27: [6, 34, 62, 90, 118], 28: [6, 26, 50, 74, 98, 122],
  29: [6, 30, 54, 78, 102, 126], 30: [6, 26, 52, 78, 104, 130], 31: [6, 30, 56, 82, 108, 134], 32: [6, 34, 60, 86, 112, 138],
  33: [6, 30, 58, 86, 114, 142], 34: [6, 34, 62, 90, 118, 146], 35: [6, 30, 54, 78, 102, 126, 150],
  36: [6, 24, 50, 76, 102, 128, 154], 37: [6, 28, 54, 80, 106, 132, 158], 38: [6, 32, 58, 84, 110, 136, 162],
  39: [6, 26, 54, 82, 110, 138, 166], 40: [6, 30, 58, 86, 114, 142, 170]
};
/* Nivell M: [nombre de blocs, codis del bloc, codis de dades del bloc]. */
const BLOCS_M = {
  1: [[1, 26, 16]], 2: [[1, 44, 28]], 3: [[1, 70, 44]], 4: [[2, 50, 32]], 5: [[2, 67, 43]], 6: [[4, 43, 27]],
  7: [[4, 49, 31]], 8: [[2, 60, 38], [2, 61, 39]], 9: [[3, 58, 36], [2, 59, 37]], 10: [[4, 69, 43], [1, 70, 44]],
  11: [[1, 80, 50], [4, 81, 51]], 12: [[6, 58, 36], [2, 59, 37]], 13: [[8, 59, 37], [1, 60, 38]],
  14: [[4, 64, 40], [5, 65, 41]], 15: [[5, 65, 41], [5, 66, 42]], 16: [[7, 73, 45], [3, 74, 46]],
  17: [[10, 74, 46], [1, 75, 47]], 18: [[9, 69, 43], [4, 70, 44]], 19: [[3, 70, 44], [11, 71, 45]],
  20: [[3, 67, 41], [13, 68, 42]], 21: [[17, 68, 42]], 22: [[17, 74, 46]], 23: [[4, 75, 47], [14, 76, 48]],
  24: [[6, 73, 45], [14, 74, 46]], 25: [[8, 75, 47], [13, 76, 48]], 26: [[19, 74, 46], [4, 75, 47]],
  27: [[22, 73, 45], [3, 74, 46]], 28: [[3, 73, 45], [23, 74, 46]], 29: [[21, 73, 45], [7, 74, 46]],
  30: [[19, 75, 47], [10, 76, 48]], 31: [[2, 74, 46], [29, 75, 47]], 32: [[10, 74, 46], [23, 75, 47]],
  33: [[14, 74, 46], [21, 75, 47]], 34: [[14, 74, 46], [23, 75, 47]], 35: [[12, 75, 47], [26, 76, 48]],
  36: [[6, 75, 47], [34, 76, 48]], 37: [[29, 74, 46], [14, 75, 47]], 38: [[13, 74, 46], [32, 75, 47]],
  39: [[40, 75, 47], [7, 76, 48]], 40: [[18, 75, 47], [31, 76, 48]]
};
/* Codis totals de cada versió (taula 1 de la norma), per a comprovar la taula de blocs de dalt. */
const CODIS_TOTALS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085,
  1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706];
/* Bits sobrants de cada versió (taula 1 de la norma). */
const SOBRANTS = (v) => (v === 1 ? 0 : v <= 6 ? 7 : v <= 13 ? 0 : v <= 20 ? 3 : v <= 27 ? 4 : v <= 34 ? 3 : 0);
const MASCARA = [
  (i, j) => (i + j) % 2 === 0, (i) => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0, (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0
];

function llig(moduls) {
  const n = moduls.length;
  const v = (n - 17) / 4;
  if (!Number.isInteger(v) || v < 1 || v > 40) throw new Error(`mida ${n}`);
  const m = (f, c) => (moduls[f][c] ? 1 : 0);
  for (const fila of moduls) if (fila.length !== n) throw new Error('no és quadrada');

  // Patrons de cerca amb el separador clar.
  for (const [f0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    for (let df = -1; df <= 7; df++) {
      for (let dc = -1; dc <= 7; dc++) {
        const f = f0 + df;
        const c = c0 + dc;
        if (f < 0 || f >= n || c < 0 || c >= n) continue;
        const dins = df >= 0 && df <= 6 && dc >= 0 && dc <= 6;
        const anell = Math.max(Math.abs(df - 3), Math.abs(dc - 3));
        const esperat = dins && anell !== 2 ? 1 : 0;
        if (m(f, c) !== esperat) throw new Error(`patró de cerca a (${f},${c})`);
      }
    }
  }
  // Temps, entre els patrons de cerca.
  for (let k = 8; k < n - 8; k++) {
    if (m(6, k) !== (k % 2 === 0 ? 1 : 0) || m(k, 6) !== (k % 2 === 0 ? 1 : 0)) throw new Error(`temps a ${k}`);
  }
  if (m(n - 8, 8) !== 1) throw new Error('mòdul fosc');

  // Les caselles de funció, des de la norma.
  const funcio = Array.from({ length: n }, () => new Array(n).fill(false));
  const marca = (f, c) => { funcio[f][c] = true; };
  for (let k = 0; k < n; k++) { marca(6, k); marca(k, 6); }
  for (let f = 0; f < 9; f++) for (let c = 0; c < 9; c++) marca(f, c);
  for (let f = 0; f < 9; f++) for (let c = n - 8; c < n; c++) marca(f, c);
  for (let f = n - 8; f < n; f++) for (let c = 0; c < 9; c++) marca(f, c);
  const alineament = ALINEAMENT[v];
  if (!alineament) throw new Error(`el lector no té la taula d'alineament de la versió ${v}`);
  for (const f of alineament) {
    for (const c of alineament) {
      if ((f < 9 && c < 9) || (f < 9 && c > n - 9) || (f > n - 9 && c < 9)) continue;
      for (let df = -2; df <= 2; df++) {
        for (let dc = -2; dc <= 2; dc++) {
          marca(f + df, c + dc);
          const esperat = Math.max(Math.abs(df), Math.abs(dc)) === 1 ? 0 : 1;
          if (m(f + df, c + dc) !== esperat) throw new Error(`alineament a (${f},${c})`);
        }
      }
    }
  }
  if (v >= 7) {
    let dalt = 0;
    let baix = 0;
    for (let i = 17; i >= 0; i--) {
      const fila = Math.floor(i / 3);
      const columna = n - 11 + (i % 3);
      dalt = (dalt << 1) | m(fila, columna);
      baix = (baix << 1) | m(columna, fila);
      marca(fila, columna);
      marca(columna, fila);
    }
    if (dalt !== versioPerDivisio(v) || baix !== dalt) throw new Error('bits de versió');
  }

  // Les dues còpies del format, per les coordenades de la figura de la norma (bit 14 primer).
  const copia1 = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  const copia2 = [[n - 1, 8], [n - 2, 8], [n - 3, 8], [n - 4, 8], [n - 5, 8], [n - 6, 8], [n - 7, 8],
    [8, n - 8], [8, n - 7], [8, n - 6], [8, n - 5], [8, n - 4], [8, n - 3], [8, n - 2], [8, n - 1]];
  const llegix15 = (coords) => coords.reduce((acc, [f, c]) => (acc << 1) | m(f, c), 0);
  const format = llegix15(copia1);
  if (llegix15(copia2) !== format) throw new Error('les dues còpies del format no coincidixen');
  let nivell = null;
  let mascara = null;
  for (let nv = 0; nv < 4; nv++) for (let mk = 0; mk < 8; mk++) if (formatPerDivisio(nv, mk) === format) [nivell, mascara] = [nv, mk];
  if (nivell === null) throw new Error('format invàlid');
  if (nivell !== 0b00) throw new Error('el nivell no és M');

  // El zig-zag sobre les caselles lliures, amb la màscara desfeta.
  const bits = [];
  let amunt = true;
  for (let dreta = n - 1; dreta >= 1; dreta -= 2) {
    if (dreta === 6) dreta = 5;
    for (let k = 0; k < n; k++) {
      const f = amunt ? n - 1 - k : k;
      for (const c of [dreta, dreta - 1]) if (!funcio[f][c]) bits.push(m(f, c) ^ (MASCARA[mascara](f, c) ? 1 : 0));
    }
    amunt = !amunt;
  }
  const grups = BLOCS_M[v];
  if (!grups) throw new Error(`el lector no té la taula de blocs de la versió ${v}`);
  const totals = grups.reduce((s, [q, c]) => s + q * c, 0);
  if (bits.length !== totals * 8 + SOBRANTS(v)) throw new Error(`caselles lliures: ${bits.length}`);
  const codis = [];
  for (let i = 0; i < totals * 8; i += 8) codis.push(bits.slice(i, i + 8).reduce((b, x) => (b << 1) | x, 0));

  // Desentrellaçar: dades columna a columna, després la correcció.
  const blocs = grups.flatMap(([q, c, k]) => Array.from({ length: q }, () => ({ c, k, dades: [], correccio: [] })));
  let p = 0;
  const maxDades = Math.max(...blocs.map((b) => b.k));
  for (let i = 0; i < maxDades; i++) for (const b of blocs) if (i < b.k) b.dades.push(codis[p++]);
  const nCorreccio = blocs[0].c - blocs[0].k;
  for (let i = 0; i < nCorreccio; i++) for (const b of blocs) b.correccio.push(codis[p++]);
  blocs.forEach((b, i) => {
    if (b.c - b.k !== nCorreccio) throw new Error('blocs desiguals');
    if (!esParaulaRS([...b.dades, ...b.correccio], nCorreccio)) throw new Error(`el bloc ${i} no és una paraula Reed-Solomon`);
  });

  // Les dades: mode byte, comptador, bytes, terminador i farcit.
  const dades = blocs.flatMap((b) => b.dades);
  const flux = dades.flatMap((b) => [7, 6, 5, 4, 3, 2, 1, 0].map((i) => (b >> i) & 1));
  let q = 0;
  const llegeixBits = (k) => {
    let r = 0;
    for (let i = 0; i < k; i++) r = (r << 1) | flux[q++];
    return r;
  };
  if (llegeixBits(4) !== 0b0100) throw new Error('no és mode byte');
  const llargaria = llegeixBits(v <= 9 ? 8 : 16);
  const bytes = Array.from({ length: llargaria }, () => llegeixBits(8));
  const terminador = Math.min(4, flux.length - q);
  if (llegeixBits(terminador) !== 0) throw new Error('terminador');
  while (q % 8) if (llegeixBits(1) !== 0) throw new Error('farcit de bits');
  for (let i = 0; q < flux.length; i++) if (llegeixBits(8) !== [0xec, 0x11][i % 2]) throw new Error('farcit de bytes');
  return { versio: v, mascara, text: new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes)) };
}

/* ── Proves ── */

describe('vectors coneguts', () => {
  test('Reed-Solomon: «HELLO WORLD» 1-M i «01234567» 1-M de la norma', () => {
    expect(codisDeCorreccio([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17], 10))
      .toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
    expect(codisDeCorreccio([16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17], 10))
      .toEqual([165, 36, 212, 193, 237, 54, 199, 135, 44, 85]);
  });

  test('els bits de format del nivell M, els de la taula de la norma', () => {
    const taula = ['101010000010010', '101000100100101', '101111001111100', '101101101001011',
      '100010111111001', '100000011001110', '100111110010111', '100101010100000'];
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((mk) => bitsDeFormat(mk).toString(2).padStart(15, '0'))).toEqual(taula);
    // I els de la divisió llarga del lector, per a les huit màscares.
    for (let mk = 0; mk < 8; mk++) expect(bitsDeFormat(mk)).toBe(formatPerDivisio(0, mk));
    expect(() => bitsDeFormat(8)).toThrow(expect.objectContaining({ codi: 'QR_INVALID' }));
  });

  test('els bits de versió de la taula de la norma', () => {
    expect([7, 8, 9, 10, 40].map(bitsDeVersio)).toEqual([0x07c94, 0x085bc, 0x09a99, 0x0a4d3, 0x28c69]);
    for (let v = 7; v <= 40; v++) expect(bitsDeVersio(v), `versió ${v}`).toBe(versioPerDivisio(v));
    expect(() => bitsDeVersio(6)).toThrow(expect.objectContaining({ codi: 'QR_INVALID' }));
  });

  test('les posicions dels patrons d’alineament de la taula', () => {
    expect(Object.keys(ALINEAMENT)).toHaveLength(40);
    for (const [v, posicions] of Object.entries(ALINEAMENT)) expect(posicionsAlineament(Number(v)), `versió ${v}`).toEqual(posicions);
  });

  test('les taules del lector quadren amb elles mateixes: 40 versions, els codis totals i la correcció igual a cada bloc', () => {
    expect(Object.keys(BLOCS_M)).toHaveLength(40);
    for (let v = 1; v <= 40; v++) {
      const grups = BLOCS_M[v];
      expect(grups.reduce((s, [q, c]) => s + q * c, 0), `versió ${v}`).toBe(CODIS_TOTALS[v - 1]);
      expect(new Set(grups.map(([, c, k]) => c - k)).size, `versió ${v}`).toBe(1);
      // La darrera posició d'alineament és a 7 mòduls de la vora.
      if (v > 1) expect(ALINEAMENT[v].at(-1), `versió ${v}`).toBe(4 * v + 10);
    }
  });

  test('capacitats en mode byte al nivell M i blocs de la taula', () => {
    const conegudes = { 1: 14, 2: 26, 3: 42, 4: 62, 5: 84, 6: 106, 7: 122, 8: 152, 9: 180, 10: 213, 11: 251, 12: 287, 13: 331, 20: 666, 40: 2331 };
    for (const [v, bytes] of Object.entries(conegudes)) expect(capacitatBytes(Number(v)), `versió ${v}`).toBe(bytes);
    for (const [v, grups] of Object.entries(BLOCS_M)) {
      const { blocs, correccio, curts, dadesCurt } = blocsDe(Number(v));
      expect({ blocs, correccio, curts, dadesCurt }, `versió ${v}`).toEqual({
        blocs: grups.reduce((s, [q]) => s + q, 0), correccio: grups[0][1] - grups[0][2], curts: grups[0][0], dadesCurt: grups[0][2]
      });
      expect(codisTotals(Number(v))).toBe(grups.reduce((s, [q, c]) => s + q * c, 0));
    }
    // Per a totes les versions: els blocs reparteixen exactament els codis, i cada bloc porta més dades que correcció/2.
    for (let v = 1; v <= VERSIO_MAXIMA; v++) {
      const { blocs, correccio, curts, dadesCurt } = blocsDe(v);
      expect(curts * (dadesCurt + correccio) + (blocs - curts) * (dadesCurt + 1 + correccio)).toBe(codisTotals(v));
      expect(codisDeDades(v)).toBe(curts * dadesCurt + (blocs - curts) * (dadesCurt + 1));
      expect(capacitatBytes(v)).toBeGreaterThan(v === 1 ? 0 : capacitatBytes(v - 1));
    }
  });
});

describe('el lector torna a traure el text de cada matriu', () => {
  test('«HELLO WORLD» i un text amb accents en UTF-8', () => {
    for (const text of ['HELLO WORLD', 'Sóc de Poble · factura nº 1 — €', '']) {
      const qr = codificaQR(text);
      expect(llig(qr.moduls)).toMatchObject({ text, versio: qr.versio, mascara: qr.mascara });
    }
  });

  test('l’URL de cotejo d’una factura: versió 8 i llegible', () => {
    const url = textQR({ idEmisor: 'B12345674', numSerie: 'A2026-0001', dataExpedicio: '2026-10-07', importTotal: 520 });
    expect(url).toBe('https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=B12345674&numserie=A2026-0001&fecha=07-10-2026&importe=5.20');
    const qr = codificaQR(url);
    expect([qr.versio, qr.mida, qr.nivell]).toEqual([8, 49, 'M']);
    expect(llig(qr.moduls).text).toBe(url);
  });

  test('al límit de cada versió de l’1 a la 10, i un byte més passa a la següent', () => {
    for (let v = 1; v <= 10; v++) {
      const ple = 'x'.repeat(capacitatBytes(v));
      const qr = codificaQR(ple);
      expect(qr.versio, `versió ${v}`).toBe(v);
      expect(llig(qr.moduls).text).toBe(ple);
      if (v < 10) expect(codificaQR(`${ple}y`).versio).toBe(v + 1);
    }
  });

  /* Correcció de la revisió (261009): les versions 11 a 39 no tenien cap prova de regressió dins del repo. */
  test('al límit de cada versió de l’11 a la 40, amb bytes de tot el rang, i un byte més passa a la següent', () => {
    for (let v = 11; v <= 40; v++) {
      const ple = Array.from({ length: capacitatBytes(v) }, (_, i) => String.fromCharCode(32 + ((i * 7 + v) % 95))).join('');
      const qr = codificaQR(ple);
      expect(qr.versio, `versió ${v}`).toBe(v);
      expect(llig(qr.moduls), `versió ${v}`).toMatchObject({ versio: v, text: ple });
      if (v < 40) expect(codificaQR(`${ple}y`).versio, `versió ${v} + 1 byte`).toBe(v + 1);
    }
  }, 60000);

  test('la versió 40 plena es llig; un byte més no cap', () => {
    const ple = Array.from({ length: capacitatBytes(40) }, (_, i) => String.fromCharCode(33 + (i % 90))).join('');
    const qr = codificaQR(ple);
    expect([qr.versio, qr.mida]).toEqual([40, 177]);
    expect(llig(qr.moduls).text).toBe(ple);
    expect(() => codificaQR(`${ple}!`)).toThrow(expect.objectContaining({ codi: 'QR_MASSA_LLARG' }));
  });

  test('cada una de les huit màscares es llig', () => {
    const text = textQR({ idEmisor: 'B12345674', numSerie: 'R2026-0012', dataExpedicio: '2026-10-09', importTotal: -12345 });
    for (let mk = 0; mk < 8; mk++) {
      const qr = codificaQR(text, { mascara: mk });
      expect(qr.mascara).toBe(mk);
      expect(llig(qr.moduls)).toMatchObject({ text, mascara: mk });
    }
  });

  test('el lector no s’ho empassa tot: un mòdul canviat al format o a un bloc el fa caure', () => {
    const qr = codificaQR('HELLO WORLD');
    const copia = qr.moduls.map((fila) => [...fila]);
    copia[8][2] = !copia[8][2];
    expect(() => llig(copia)).toThrow(/format/);
    const bloc = qr.moduls.map((fila) => [...fila]);
    bloc[20][20] = !bloc[20][20];
    expect(() => llig(bloc)).toThrow(/Reed-Solomon/);
  });

  test('entrades que no són un text o una màscara bona: QR_INVALID', () => {
    expect(() => codificaQR(null)).toThrow(expect.objectContaining({ codi: 'QR_INVALID' }));
    expect(() => codificaQR('a', { mascara: 8 })).toThrow(expect.objectContaining({ codi: 'QR_INVALID' }));
  });
});

describe('la tria de la màscara', () => {
  test('la penalització d’un cas fet a mà: 5×5 tot fosc', () => {
    // N1: 5 files i 5 columnes de 5 iguals (3 punts cada una) = 30; N2: 16 quadres 2×2 (3 cada un) = 48;
    // N3: cap; N4: 100 % de foscos, k = ceil(|500 - 250| / 25) - 1 = 9 → 90. Total, 168.
    expect(penalitzacio(Array.from({ length: 5 }, () => new Array(5).fill(true)))).toBe(168);
    // N3, aïllada: dos quadrats d'11 amb els mateixos foscos, tires i quadres 2×2, i una sola fila diferent.
    // «0000 1011101» porta el patró 1:1:3:1:1 amb quatre clars davant i, amb els clars de fora, també darrere:
    // dos coincidències (80 punts). «0000 1110101» no en porta cap.
    const quadrat = (fila) => Array.from({ length: 11 }, (_, i) => (i === 5 ? fila.map(Boolean) : new Array(11).fill(false)));
    expect(penalitzacio(quadrat([0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1])) - penalitzacio(quadrat([0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1]))).toBe(80);
  });

  test('es queda la màscara de menys penalització', () => {
    for (const text of ['HELLO WORLD', 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=B12345674']) {
      const triat = codificaQR(text);
      const totes = [0, 1, 2, 3, 4, 5, 6, 7].map((mk) => penalitzacio(codificaQR(text, { mascara: mk }).moduls));
      expect(triat.penalitzacio).toBe(Math.min(...totes));
      expect(totes[triat.mascara]).toBe(triat.penalitzacio);
    }
  });
});

describe('el camí SVG', () => {
  /* Torna a pintar el camí en una graella i el compara amb els mòduls foscos. */
  function pinta(d, costat) {
    const graella = Array.from({ length: costat }, () => new Array(costat).fill(false));
    for (const [, x, y, w] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\3z/g)) {
      for (let k = 0; k < Number(w); k++) graella[Number(y)][Number(x) + k] = true;
    }
    return graella;
  }

  test('un rectangle per tira, amb la zona de silenci de quatre mòduls', () => {
    const qr = codificaQR('HELLO WORLD');
    const { costat, d } = camiSvgQR(qr);
    expect(costat).toBe(qr.mida + 8);
    expect(d).toMatch(/^(?:M\d+ \d+h\d+v1h-\d+z)+$/);
    const graella = pinta(d, costat);
    for (let y = 0; y < costat; y++) {
      for (let x = 0; x < costat; x++) {
        const dins = y >= 4 && y < qr.mida + 4 && x >= 4 && x < qr.mida + 4;
        expect(graella[y][x], `(${x},${y})`).toBe(dins ? qr.moduls[y - 4][x - 4] : false);
      }
    }
    expect(camiSvgQR(qr, { marge: 0 }).costat).toBe(qr.mida);
    expect(() => camiSvgQR({ mida: 2, moduls: [] })).toThrow(expect.objectContaining({ codi: 'QR_INVALID' }));
  });
});
