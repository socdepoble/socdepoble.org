/**
 * Codificador i descodificador ISO/IEC 18004 (Mode Byte UTF-8, Nivell de correcció M,
 * Versió 3 per defecte · 29x29 mòduls) sense dependències externes ni xarxa
 * (IDEA-124 · Protocol d'Emergències Offline / DANA).
 *
 * Totalment compatible amb càmeres i lectors estàndard ISO/IEC 18004 (incloent-hi
 * `tests/helpers/lectorQrIndependent.js`):
 *   - 3 Finder Patterns 7x7 + separadors clars + Timing Patterns + Alignment Pattern (22, 22)
 *   - Informació de format BCH (15, 5) amb màscara 0x5412 i selecció òptima N1–N4
 *   - Correcció d'errors Reed-Solomon sobre GF(256) (polinomi 0x11d)
 */
export const MIDA_MATRIU_QR_VEINAL = 29;
export const MAX_BYTES_QR_VEINAL = 42;
export const MARGE_SILENCI_QR_VEINAL = 4;

const VERSIO_MINIMA_VEINAL = 3;
const VERSIO_MAXIMA = 40;

const CORRECCIO_PER_BLOC = Object.freeze([
  0,
  10, 16, 26, 18, 24, 16, 18, 22, 22, 26,
  30, 22, 22, 24, 24, 28, 28, 26, 26, 26,
  26, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
]);
const BLOCS = Object.freeze([
  0,
  1, 1, 1, 2, 2, 4, 4, 4, 5, 5,
  5, 8, 9, 9, 10, 10, 11, 13, 14, 16,
  17, 17, 18, 20, 21, 23, 25, 26, 28, 29,
  31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
]);

const BITS_NIVELL_M = 0b00;
const MASCARA_FORMAT = 0x5412;
const GENERADOR_FORMAT = 0x537;
const GENERADOR_VERSIO = 0x1f25;
const MODE_BYTE = 0b0100;
const FARCITS = Object.freeze([0xec, 0x11]);

const N1 = 3;
const N2 = 3;
const N3 = 40;
const N4 = 10;

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
}

const multiplicaGF = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function potenciaGF(base, exponent) {
  let r = 1;
  for (let i = 0; i < exponent; i += 1) r = multiplicaGF(r, base);
  return r;
}

function esParaulaReedSolomon(bloc, nCorreccio) {
  for (let i = 0; i < nCorreccio; i += 1) {
    const x = potenciaGF(2, i);
    let s = 0;
    for (const c of bloc) s = multiplicaGF(s, x) ^ c;
    if (s !== 0) return false;
  }
  return true;
}

function generadorRS(n) {
  let g = [1];
  for (let i = 0; i < n; i += 1) {
    const seguent = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j += 1) {
      seguent[j] ^= g[j];
      seguent[j + 1] ^= multiplicaGF(g[j], EXP[i]);
    }
    g = seguent;
  }
  return g.slice(1);
}

function codisDeCorreccioRS(dades, n) {
  const g = generadorRS(n);
  const residu = new Array(n).fill(0);
  for (const byte of dades) {
    const factor = byte ^ residu.shift();
    residu.push(0);
    for (let i = 0; i < n; i += 1) residu[i] ^= multiplicaGF(g[i], factor);
  }
  return residu;
}

export function calculaCrc8Qr(bytes) {
  let crc = 0xff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i] & 0xff;
    for (let b = 0; b < 8; b += 1) {
      crc = (crc & 0x80) !== 0 ? ((crc << 1) ^ 0x31) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

const midaDeVersio = (v) => 17 + 4 * v;

const ALINEAMENT_PER_VERSIO = Object.freeze({
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46],
  10: [6, 28, 50], 11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66], 15: [6, 26, 48, 70],
  16: [6, 26, 50, 74], 17: [6, 30, 54, 78], 18: [6, 30, 56, 82], 19: [6, 30, 58, 86], 20: [6, 34, 62, 90],
  21: [6, 28, 50, 72, 94], 22: [6, 26, 50, 74, 98], 23: [6, 30, 54, 78, 102], 24: [6, 28, 54, 80, 106],
  25: [6, 32, 58, 84, 110], 26: [6, 30, 58, 86, 114], 27: [6, 34, 62, 90, 118], 28: [6, 26, 50, 74, 98, 122],
  29: [6, 30, 54, 78, 102, 126], 30: [6, 26, 52, 78, 104, 130], 31: [6, 30, 56, 82, 108, 134], 32: [6, 34, 60, 86, 112, 138],
  33: [6, 30, 58, 86, 114, 142], 34: [6, 34, 62, 90, 118, 146], 35: [6, 30, 54, 78, 102, 126, 150],
  36: [6, 24, 50, 76, 102, 128, 154], 37: [6, 28, 54, 80, 106, 132, 158], 38: [6, 32, 58, 84, 110, 136, 162],
  39: [6, 26, 54, 82, 110, 138, 166], 40: [6, 30, 58, 86, 114, 142, 170],
});

function posicionsAlineament(v) {
  return ALINEAMENT_PER_VERSIO[v] || [];
}

function modulsDeDades(v) {
  let moduls = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const quants = Math.floor(v / 7) + 2;
    moduls -= (25 * quants - 10) * quants - 55;
    if (v >= 7) moduls -= 36;
  }
  return moduls;
}

function codisTotals(v) {
  return Math.floor(modulsDeDades(v) / 8);
}

function blocsDe(v) {
  const totals = codisTotals(v);
  const blocs = BLOCS[v];
  const correccio = CORRECCIO_PER_BLOC[v];
  const curts = blocs - (totals % blocs);
  return { blocs, correccio, curts, dadesCurt: Math.floor(totals / blocs) - correccio };
}

function codisDeDades(v) {
  const { blocs, correccio } = blocsDe(v);
  return codisTotals(v) - blocs * correccio;
}

const bitsComptador = (v) => (v <= 9 ? 8 : 16);

function capacitatBytes(v) {
  return Math.floor((codisDeDades(v) * 8 - 4 - bitsComptador(v)) / 8);
}

function bitsDeFormat(mascara) {
  const dades = (BITS_NIVELL_M << 3) | mascara;
  let residu = dades;
  for (let i = 0; i < 10; i += 1) {
    residu = (residu << 1) ^ ((residu >>> 9) * GENERADOR_FORMAT);
  }
  return ((dades << 10) | residu) ^ MASCARA_FORMAT;
}

function bitsDeVersio(v) {
  let residu = v;
  for (let i = 0; i < 12; i += 1) {
    residu = (residu << 1) ^ ((residu >>> 11) * GENERADOR_VERSIO);
  }
  return (v << 12) | residu;
}

const bit = (valor, i) => ((valor >>> i) & 1) === 1;

function matriuBuida(v) {
  const mida = midaDeVersio(v);
  return {
    v,
    mida,
    moduls: new Uint8Array(mida * mida),
    funcio: new Uint8Array(mida * mida),
  };
}

function posaFuncio(m, fila, columna, fosc) {
  const i = fila * m.mida + columna;
  m.moduls[i] = fosc ? 1 : 0;
  m.funcio[i] = 1;
}

function patroDeCerca(m, fila, columna) {
  for (let df = -4; df <= 4; df += 1) {
    for (let dc = -4; dc <= 4; dc += 1) {
      const f = fila + df;
      const c = columna + dc;
      if (f < 0 || f >= m.mida || c < 0 || c >= m.mida) continue;
      const distancia = Math.max(Math.abs(df), Math.abs(dc));
      posaFuncio(m, f, c, distancia !== 2 && distancia !== 4);
    }
  }
}

function patroAlineament(m, fila, columna) {
  for (let df = -2; df <= 2; df += 1) {
    for (let dc = -2; dc <= 2; dc += 1) {
      posaFuncio(m, fila + df, columna + dc, Math.max(Math.abs(df), Math.abs(dc)) !== 1);
    }
  }
}

function dibuixaFormat(m, mascara) {
  const bits = bitsDeFormat(mascara);
  const n = m.mida;
  for (let i = 0; i <= 5; i += 1) posaFuncio(m, i, 8, bit(bits, i));
  posaFuncio(m, 7, 8, bit(bits, 6));
  posaFuncio(m, 8, 8, bit(bits, 7));
  posaFuncio(m, 8, 7, bit(bits, 8));
  for (let i = 9; i < 15; i += 1) posaFuncio(m, 8, 14 - i, bit(bits, i));
  for (let i = 0; i < 8; i += 1) posaFuncio(m, 8, n - 1 - i, bit(bits, i));
  for (let i = 8; i < 15; i += 1) posaFuncio(m, n - 15 + i, 8, bit(bits, i));
  posaFuncio(m, n - 8, 8, true);
}

function dibuixaVersio(m) {
  if (m.v < 7) return;
  const bits = bitsDeVersio(m.v);
  for (let i = 0; i < 18; i += 1) {
    const a = m.mida - 11 + (i % 3);
    const b = Math.floor(i / 3);
    posaFuncio(m, b, a, bit(bits, i));
    posaFuncio(m, a, b, bit(bits, i));
  }
}

function patronsDeFuncio(v) {
  const m = matriuBuida(v);
  for (let i = 0; i < m.mida; i += 1) {
    posaFuncio(m, 6, i, i % 2 === 0);
    posaFuncio(m, i, 6, i % 2 === 0);
  }
  patroDeCerca(m, 3, 3);
  patroDeCerca(m, 3, m.mida - 4);
  patroDeCerca(m, m.mida - 4, 3);
  const alineament = posicionsAlineament(v);
  const ultim = alineament.length - 1;
  alineament.forEach((fila, i) => alineament.forEach((columna, j) => {
    const solapa = (i === 0 && j === 0) || (i === 0 && j === ultim) || (i === ultim && j === 0);
    if (!solapa) patroAlineament(m, fila, columna);
  }));
  dibuixaFormat(m, 0);
  dibuixaVersio(m);
  return m;
}

function bitsDeDades(bytes, v) {
  const bits = [];
  const afig = (valor, quants) => {
    for (let i = quants - 1; i >= 0; i -= 1) bits.push((valor >>> i) & 1);
  };
  afig(MODE_BYTE, 4);
  afig(bytes.length, bitsComptador(v));
  for (const byte of bytes) afig(byte, 8);
  const capacitat = codisDeDades(v) * 8;
  afig(0, Math.min(4, capacitat - bits.length));
  afig(0, (8 - (bits.length % 8)) % 8);
  const codis = [];
  for (let i = 0; i < bits.length; i += 8) {
    codis.push(bits.slice(i, i + 8).reduce((byte, b) => (byte << 1) | b, 0));
  }
  for (let i = 0; codis.length < codisDeDades(v); i += 1) {
    codis.push(FARCITS[i % 2]);
  }
  return codis;
}

function entrellaca(dades, v) {
  const { blocs, correccio, curts, dadesCurt } = blocsDe(v);
  const delsBlocs = [];
  let posicio = 0;
  for (let b = 0; b < blocs; b += 1) {
    const llargaria = dadesCurt + (b < curts ? 0 : 1);
    const bloc = dades.slice(posicio, posicio + llargaria);
    posicio += llargaria;
    delsBlocs.push({ dades: bloc, correccio: codisDeCorreccioRS(bloc, correccio) });
  }
  const resultat = [];
  for (let i = 0; i <= dadesCurt; i += 1) {
    for (const bloc of delsBlocs) if (i < bloc.dades.length) resultat.push(bloc.dades[i]);
  }
  for (let i = 0; i < correccio; i += 1) {
    for (const bloc of delsBlocs) resultat.push(bloc.correccio[i]);
  }
  return resultat;
}

function colocaCodis(m, codis) {
  const n = m.mida;
  let i = 0;
  let amunt = true;
  for (let dreta = n - 1; dreta >= 1; dreta -= 2) {
    if (dreta === 6) dreta = 5;
    for (let k = 0; k < n; k += 1) {
      const fila = amunt ? n - 1 - k : k;
      for (const columna of [dreta, dreta - 1]) {
        const casella = fila * n + columna;
        if (m.funcio[casella]) continue;
        m.moduls[casella] = i < codis.length * 8 && bit(codis[i >>> 3], 7 - (i & 7)) ? 1 : 0;
        i += 1;
      }
    }
    amunt = !amunt;
  }
}

const MASCARES = Object.freeze([
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
]);

function ambMascara(base, mascara) {
  const m = { ...base, moduls: base.moduls.slice(), funcio: base.funcio.slice() };
  const formula = MASCARES[mascara];
  for (let i = 0; i < m.mida; i += 1) {
    for (let j = 0; j < m.mida; j += 1) {
      const casella = i * m.mida + j;
      if (!m.funcio[casella] && formula(i, j)) m.moduls[casella] ^= 1;
    }
  }
  dibuixaFormat(m, mascara);
  return m;
}

const SEMBLANT_CERCA = Object.freeze([
  Object.freeze([0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]),
  Object.freeze([1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]),
]);

function penalitzacioDeTira(tira) {
  let punts = 0;
  let longitud = 1;
  for (let i = 1; i <= tira.length; i += 1) {
    if (i < tira.length && tira[i] === tira[i - 1]) {
      longitud += 1;
      continue;
    }
    if (longitud >= 5) punts += N1 + (longitud - 5);
    longitud = 1;
  }
  const ambMarge = [0, 0, 0, 0, ...tira, 0, 0, 0, 0];
  for (let i = 0; i + 11 <= ambMarge.length; i += 1) {
    for (const patro of SEMBLANT_CERCA) {
      if (patro.every((valor, k) => ambMarge[i + k] === valor)) punts += N3;
    }
  }
  return punts;
}

function penalitzacio(files) {
  const n = files.length;
  const valor = (i, j) => (files[i][j] ? 1 : 0);
  let punts = 0;
  let foscos = 0;
  for (let i = 0; i < n; i += 1) {
    const fila = [];
    const columna = [];
    for (let j = 0; j < n; j += 1) {
      fila.push(valor(i, j));
      columna.push(valor(j, i));
      foscos += valor(i, j);
    }
    punts += penalitzacioDeTira(fila) + penalitzacioDeTira(columna);
  }
  for (let i = 0; i + 1 < n; i += 1) {
    for (let j = 0; j + 1 < n; j += 1) {
      const v = valor(i, j);
      if (v === valor(i, j + 1) && v === valor(i + 1, j) && v === valor(i + 1, j + 1)) punts += N2;
    }
  }
  const total = n * n;
  const k = Math.ceil(Math.abs(foscos * 20 - total * 10) / total) - 1;
  return punts + Math.max(0, k) * N4;
}

function filesDeNumeriques(m) {
  const files = [];
  for (let i = 0; i < m.mida; i += 1) {
    files.push(Array.from(m.moduls.subarray(i * m.mida, (i + 1) * m.mida), (x) => (x ? 1 : 0)));
  }
  return files;
}

function versioPer(quantsBytes) {
  for (let v = VERSIO_MINIMA_VEINAL; v <= VERSIO_MAXIMA; v += 1) {
    if (quantsBytes <= capacitatBytes(v)) return v;
  }
  throw new RangeError(`QR_MASSA_LLARG: ${quantsBytes} bytes supera el màxim de ${capacitatBytes(VERSIO_MAXIMA)} bytes.`);
}

/**
 * Codifica un text en una matriu quadrada de 0 i 1 seguint ISO/IEC 18004 Level M
 * (29x29 mòduls per a versió 3).
 */
export function codificaMatriuQrVeinal(text = 'SDP-OK-OFFLINE-QR') {
  const net = String(text ?? '');
  const bytes = new TextEncoder().encode(net);
  const v = versioPer(bytes.length);
  const base = patronsDeFuncio(v);
  colocaCodis(base, entrellaca(bitsDeDades(bytes, v), v));
  let millor = null;
  for (const candidata of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const m = ambMascara(base, candidata);
    const files = filesDeNumeriques(m);
    const punts = penalitzacio(files);
    if (!millor || punts < millor.punts) {
      millor = { mascara: candidata, files, punts };
    }
  }
  return millor.files;
}

/**
 * El camí SVG dels mòduls foscos (un rectangle per tira horitzontal), amb la zona de
 * silenci al voltant: el viewBox és «0 0 costat costat».
 */
export function camiSvgMatriuQrVeinal(matriu, marge = MARGE_SILENCI_QR_VEINAL) {
  const trossos = [];
  matriu.forEach((fila, y) => {
    let x = 0;
    while (x < fila.length) {
      if (!fila[x]) {
        x += 1;
        continue;
      }
      const inici = x;
      while (x < fila.length && fila[x]) x += 1;
      trossos.push(`M${inici + marge} ${y + marge}h${x - inici}v1h-${x - inici}z`);
    }
  });
  return { costat: matriu.length + 2 * marge, d: trossos.join('') };
}

/**
 * Descodificador ISO/IEC 18004 Level M amb verificació completa de Finder Patterns,
 * Timing, Alignment, Format BCH i blocs Reed-Solomon.
 */
export function decodificaMatriuQrVeinal(matriu) {
  if (!Array.isArray(matriu) || matriu.length < 21) {
    return { valid: false, error: 'mida-invalida', text: '' };
  }
  const n = matriu.length;
  const v = (n - 17) / 4;
  if (!Number.isInteger(v) || v < 1 || v > VERSIO_MAXIMA) {
    return { valid: false, error: 'versio-invalida', text: '' };
  }
  for (const fila of matriu) {
    if (!Array.isArray(fila) || fila.length !== n) {
      return { valid: false, error: 'no-quadrada', text: '' };
    }
  }
  const m = (f, c) => (matriu[f][c] ? 1 : 0);

  for (const [f0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    for (let df = -1; df <= 7; df += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const f = f0 + df;
        const c = c0 + dc;
        if (f < 0 || f >= n || c < 0 || c >= n) continue;
        const dins = df >= 0 && df <= 6 && dc >= 0 && dc <= 6;
        const anell = Math.max(Math.abs(df - 3), Math.abs(dc - 3));
        const esperat = dins && anell !== 2 ? 1 : 0;
        if (m(f, c) !== esperat) {
          return { valid: false, error: 'finder-pattern-corrupte', text: '' };
        }
      }
    }
  }

  for (let k = 8; k < n - 8; k += 1) {
    const esperat = k % 2 === 0 ? 1 : 0;
    if (m(6, k) !== esperat || m(k, 6) !== esperat) {
      return { valid: false, error: 'timing-pattern-corrupte', text: '' };
    }
  }
  if (m(n - 8, 8) !== 1) {
    return { valid: false, error: 'modul-fosc-absent', text: '' };
  }

  const funcio = Array.from({ length: n }, () => new Array(n).fill(false));
  const marca = (f, c) => { funcio[f][c] = true; };
  for (let k = 0; k < n; k += 1) {
    marca(6, k);
    marca(k, 6);
  }
  for (let f = 0; f < 9; f += 1) for (let c = 0; c < 9; c += 1) marca(f, c);
  for (let f = 0; f < 9; f += 1) for (let c = n - 8; c < n; c += 1) marca(f, c);
  for (let f = n - 8; f < n; f += 1) for (let c = 0; c < 9; c += 1) marca(f, c);

  const alineament = posicionsAlineament(v);
  for (const f of alineament) {
    for (const c of alineament) {
      if ((f < 9 && c < 9) || (f < 9 && c > n - 9) || (f > n - 9 && c < 9)) continue;
      for (let df = -2; df <= 2; df += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          marca(f + df, c + dc);
          const esperat = Math.max(Math.abs(df), Math.abs(dc)) === 1 ? 0 : 1;
          if (m(f + df, c + dc) !== esperat) {
            return { valid: false, error: 'alineament-corrupte', text: '' };
          }
        }
      }
    }
  }

  if (v >= 7) {
    for (let i = 0; i < 18; i += 1) {
      const fila = Math.floor(i / 3);
      const columna = n - 11 + (i % 3);
      marca(fila, columna);
      marca(columna, fila);
    }
  }

  const copia1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  const copia2 = [
    [n - 1, 8], [n - 2, 8], [n - 3, 8], [n - 4, 8], [n - 5, 8], [n - 6, 8], [n - 7, 8],
    [8, n - 8], [8, n - 7], [8, n - 6], [8, n - 5], [8, n - 4], [8, n - 3], [8, n - 2], [8, n - 1],
  ];
  const llegix15 = (coords) => coords.reduce((acc, [f, c]) => (acc << 1) | m(f, c), 0);
  const format = llegix15(copia1);
  if (llegix15(copia2) !== format) {
    return { valid: false, error: 'format-discordant', text: '' };
  }

  let mascara = null;
  for (let mk = 0; mk < 8; mk += 1) {
    if (bitsDeFormat(mk) === format) mascara = mk;
  }
  if (mascara === null) {
    return { valid: false, error: 'format-invalid', text: '' };
  }

  const bits = [];
  let amunt = true;
  for (let dreta = n - 1; dreta >= 1; dreta -= 2) {
    if (dreta === 6) dreta = 5;
    for (let k = 0; k < n; k += 1) {
      const f = amunt ? n - 1 - k : k;
      for (const c of [dreta, dreta - 1]) {
        if (!funcio[f][c]) {
          bits.push(m(f, c) ^ (MASCARES[mascara](f, c) ? 1 : 0));
        }
      }
    }
    amunt = !amunt;
  }

  const totals = codisTotals(v);
  const { blocs: nBlocs, correccio: nCorreccio, curts, dadesCurt } = blocsDe(v);
  const codis = [];
  for (let i = 0; i < totals * 8; i += 8) {
    codis.push(bits.slice(i, i + 8).reduce((b, x) => (b << 1) | x, 0));
  }

  const blocs = Array.from({ length: nBlocs }, (_, idx) => ({
    k: dadesCurt + (idx < curts ? 0 : 1),
    dades: [],
    correccio: [],
  }));
  let p = 0;
  const maxDades = Math.max(...blocs.map((b) => b.k));
  for (let i = 0; i < maxDades; i += 1) {
    for (const b of blocs) {
      if (i < b.k) b.dades.push(codis[p++]);
    }
  }
  for (let i = 0; i < nCorreccio; i += 1) {
    for (const b of blocs) b.correccio.push(codis[p++]);
  }
  for (const b of blocs) {
    if (!esParaulaReedSolomon([...b.dades, ...b.correccio], nCorreccio)) {
      return { valid: false, error: 'reed-solomon-invalid', text: '' };
    }
  }

  const dades = blocs.flatMap((b) => b.dades);
  const flux = dades.flatMap((b) => [7, 6, 5, 4, 3, 2, 1, 0].map((i) => (b >> i) & 1));
  let q = 0;
  const llegeixBits = (k) => {
    let r = 0;
    for (let i = 0; i < k; i += 1) r = (r << 1) | (flux[q++] & 1);
    return r;
  };
  if (llegeixBits(4) !== MODE_BYTE) {
    return { valid: false, error: 'mode-invalid', text: '' };
  }
  const llargaria = llegeixBits(bitsComptador(v));
  if (llargaria < 0 || llargaria > capacitatBytes(v)) {
    return { valid: false, error: 'longitud-fora-de-rang', text: '' };
  }
  const bytesText = Array.from({ length: llargaria }, () => llegeixBits(8));
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytesText));
    return { valid: true, text, versio: v, mascara, crc8: calculaCrc8Qr(bytesText) };
  } catch {
    return { valid: false, error: 'utf8-invalid', text: '' };
  }
}
