/**
 * Lector de proves independent: mode byte UTF-8, correcció M, versions 1 a 40.
 * Origen: src/sections/gestoria/facturacio/qrDibuix.test.js, commit
 * 62ded5ad9cb55ac4bf1ab33e05d0f4939cbd95f3.
 * SHA-256 de la font: a7f1ab2050ab4ba59d30c25b090804f437385cf057aa88d43cd735c7f8056633.
 * Conserva les taules pròpies i els càlculs GF(256), BCH i Reed-Solomon
 * del lector original; no importa cap peça del codificador de producció.
 * La taula CODIS_TOTALS, usada només pels vectors de la prova d'origen,
 * queda fora d'aquest helper. La resta del lector només canvia el nom exportat.
 */

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
/* Bits sobrants de cada versió (taula 1 de la norma). */
const SOBRANTS = (v) => (v === 1 ? 0 : v <= 6 ? 7 : v <= 13 ? 0 : v <= 20 ? 3 : v <= 27 ? 4 : v <= 34 ? 3 : 0);
const MASCARA = [
  (i, j) => (i + j) % 2 === 0, (i) => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0, (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0
];

export function lligQrIndependent(moduls) {
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
