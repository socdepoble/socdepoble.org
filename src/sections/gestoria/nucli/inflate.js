/**
 * inflate.js — descompressió zlib/DEFLATE i reconeixement de PDF.
 *
 * Els fluxos /FlateDecode d'un PDF són zlib (RFC 1950) amb dades DEFLATE
 * (RFC 1951). Hi ha dos motors:
 *  - DecompressionStream, natiu i ràpid. Safari no el porta fins a la 16.4:
 *    inflateNavegador() el torna quan existix i null quan no.
 *  - inflatePur() i inflateRawPur(): descompressor en JS pur, sense
 *    dependències, per a la base Safari 16.0–16.3. Són estrictes: qualsevol
 *    problema llança un ErrorInflate amb el codi i el que s'haja descomprimit.
 * inflateDisponible() tria el motor i torna sempre una funció async amb la
 * mateixa tolerància: els PDF reals duen sovint fluxos truncats o amb brossa
 * al final, i en eixos casos es torna el que s'ha pogut descomprimir.
 * JS pur: sense DOM ni React.
 */

/* L'entrada s'escriu a trossos i s'espera cada escriptura: la contrapressió
   del flux fa que, quan arriba un error, la sortida dels trossos anteriors ja
   s'haja llegit, i l'error només s'emporta la del tros que falla. */
const TROS = 4096;
/* Sostre de la sortida d'un flux, contra les bombes de descompressió. */
const LIMIT_EIXIDA = 64 * 1024 * 1024;

/**
 * Bytes d'una entrada binària: Uint8Array tal qual, qualsevol altra vista o
 * un ArrayBuffer com a Uint8Array; null si no és binària.
 * @param {unknown} x
 * @returns {Uint8Array|null}
 */
export function aBytes(x) {
  if (x instanceof Uint8Array) return x;
  if (ArrayBuffer.isView(x)) return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
  if (x instanceof ArrayBuffer || Object.prototype.toString.call(x) === '[object ArrayBuffer]') return new Uint8Array(x);
  return null;
}

/**
 * Cert si els bytes porten la capçalera «%PDF-». Com fan els lectors
 * habituals, es tolera brossa davant dins dels primers 1024 bytes.
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
export function esPdf(bytes) {
  const b = aBytes(bytes);
  if (!b) return false;
  const fins = Math.min(b.length - 5, 1024);
  for (let i = 0; i <= fins; i += 1) {
    if (b[i] === 0x25 && b[i + 1] === 0x50 && b[i + 2] === 0x44 && b[i + 3] === 0x46 && b[i + 4] === 0x2d) return true;
  }
  return false;
}

/* Capçalera zlib vàlida: mètode 8 i control múltiple de 31. */
const ambCapcaleraZlib = (b) => b.length >= 2 && (b[0] & 0x0f) === 8 && ((b[0] << 8) | b[1]) % 31 === 0;

/* ── DEFLATE en JS pur (RFC 1950 i RFC 1951) ──────────────────────────── */

/**
 * Error del descompressor pur. `codi` diu què ha passat:
 *  - 'capcalera': capçalera zlib invàlida (CM diferent de 8, finestra de més
 *    de 32 KiB o FCHECK que no quadra).
 *  - 'diccionari': el flux demana un diccionari predefinit (FDICT), que no
 *    se suporta.
 *  - 'truncat': l'entrada s'acaba abans del final del flux.
 *  - 'corrupte': dades DEFLATE impossibles (bloc de tipus 3, codi de Huffman
 *    invàlid o mal construït, LEN/NLEN que no quadren, distància més enrere
 *    que l'inici de les dades…).
 *  - 'adler': la suma Adler-32 del final no quadra amb les dades.
 *  - 'limit': l'eixida passaria de `maxEixida`.
 * `parcial` porta el que s'havia descomprimit abans del problema; amb 'limit'
 * són exactament els primers `maxEixida` bytes.
 */
export class ErrorInflate extends Error {
  /**
   * @param {'capcalera'|'diccionari'|'truncat'|'corrupte'|'adler'|'limit'} codi
   * @param {string} missatge
   * @param {Uint8Array} [parcial]
   */
  constructor(codi, missatge, parcial = new Uint8Array(0)) {
    super(`inflate: ${missatge}`);
    this.name = 'ErrorInflate';
    this.codi = codi;
    this.parcial = parcial;
  }
}

/* RFC 1951 §3.2.5. Símbols de longitud 257–285: longitud base i bits extra. */
const LONGITUD_BASE = Uint16Array.of(
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258
);
const LONGITUD_EXTRA = Uint8Array.of(
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
  3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0
);
/* Codis de distància 0–29: distància base i bits extra. El més llunyà,
   24577 + 8191, arriba just a la finestra de 32 KiB. */
const DISTANCIA_BASE = Uint16Array.of(
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577
);
const DISTANCIA_EXTRA = Uint8Array.of(
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
  7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13
);
/* §3.2.7: ordre en què arriben les longituds del codi de longituds. */
const ORDRE_LONGITUDS = Uint8Array.of(16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);
/* Un codi de Huffman de DEFLATE té com a molt 15 bits. */
const MAX_BITS = 15;
/* Com a molt 286 símbols de literal/longitud i 30 de distància (§3.2.7). */
const MAX_LITERALS = 286;
const MAX_DISTANCIES = 30;

/**
 * Taula de descodificació directa d'un codi de Huffman canònic (§3.2.2).
 * L'entrada de `taula` indexada pels `bits` bits següents del flux, tal com
 * arriben (el primer, el menys significatiu), val (símbol << 4) | longitud
 * del codi; 0 vol dir «cap codi». Torna `bits`, la longitud més llarga (0 si
 * el codi és buit, i aleshores qualsevol consulta dona 0).
 * Com zlib, rebutja els codis sobresubscrits i els incomplets, tret d'un sol
 * codi d'un bit quan `potSerIncomplet`.
 */
function taulaHuffman(longituds, n, taula, potSerIncomplet) {
  const compte = new Uint16Array(MAX_BITS + 1);
  for (let s = 0; s < n; s += 1) compte[longituds[s]] += 1;
  compte[0] = 0;
  let bits = MAX_BITS;
  while (bits > 0 && compte[bits] === 0) bits -= 1;
  if (bits === 0) {
    taula[0] = 0;
    return 0;
  }
  /* Desigualtat de Kraft: cada longitud dobla els codis possibles. */
  let queden = 1;
  for (let l = 1; l <= MAX_BITS; l += 1) {
    queden = queden * 2 - compte[l];
    if (queden < 0) throw new ErrorInflate('corrupte', 'codi de Huffman sobresubscrit');
  }
  if (queden > 0 && !(potSerIncomplet && bits === 1)) throw new ErrorInflate('corrupte', 'codi de Huffman incomplet');
  /* Primer codi de cada longitud (§3.2.2, pas 2). */
  const seguent = new Uint16Array(MAX_BITS + 1);
  let codi = 0;
  for (let l = 1; l <= MAX_BITS; l += 1) {
    codi = (codi + compte[l - 1]) << 1;
    seguent[l] = codi;
  }
  const mida = 1 << bits;
  taula.fill(0, 0, mida);
  for (let s = 0; s < n; s += 1) {
    const l = longituds[s];
    if (l === 0) continue;
    /* El codi s'escriu pel bit més significatiu i el flux es llig pel menys:
       s'inverteix, i l'entrada es repetix per a tots els bits que sobren. */
    let c = seguent[l];
    seguent[l] += 1;
    let invers = 0;
    for (let k = 0; k < l; k += 1) {
      invers = (invers << 1) | (c & 1);
      c >>= 1;
    }
    const entrada = (s << 4) | l;
    for (let j = invers; j < mida; j += 1 << l) taula[j] = entrada;
  }
  return bits;
}

/* §3.2.6: el codi fix. Literals 0–143 de 8 bits, 144–255 de 9, 256–279 de 7
   i 280–287 de 8; les 32 distàncies, de 5 bits. Els símbols 286, 287, 30 i
   31 completen el codi però no són vàlids si apareixen. */
const FIXES = (() => {
  const literals = new Uint8Array(288);
  literals.fill(8, 0, 144);
  literals.fill(9, 144, 256);
  literals.fill(7, 256, 280);
  literals.fill(8, 280, 288);
  const taulaLiterals = new Uint16Array(1 << 9);
  const bitsLiterals = taulaHuffman(literals, 288, taulaLiterals, false);
  const taulaDistancies = new Uint16Array(1 << 5);
  const bitsDistancies = taulaHuffman(new Uint8Array(32).fill(5), 32, taulaDistancies, false);
  return { taulaLiterals, bitsLiterals, taulaDistancies, bitsDistancies };
})();

/**
 * Adler-32 (RFC 1950 §9). Es fa el mòdul cada 5552 bytes (el NMAX de zlib),
 * el tros més llarg en què les sumes no passen de 2^32.
 * @param {Uint8Array} dades
 * @returns {number}
 */
function adler32(dades) {
  let a = 1;
  let b = 0;
  let i = 0;
  while (i < dades.length) {
    const fi = Math.min(i + 5552, dades.length);
    for (; i < fi; i += 1) {
      a += dades[i];
      b += a;
    }
    a %= 65521;
    b %= 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/**
 * Descomprimix les dades DEFLATE d'`entrada` des del byte `inici`.
 * Torna { dades, fi }: `fi` és el primer byte després del bloc final (els
 * blocs acaben a mig byte; el que en queda es descarta, com diu §3.2.3).
 * Llança ErrorInflate amb el que s'haja descomprimit fins al problema.
 */
function inflaCru(entrada, inici, maxEixida) {
  const n = entrada.length;
  let pos = inici;
  /* Memòria de bits: els bits arriben pel menys significatiu de cada byte. */
  let bb = 0;
  let nb = 0;
  let eixida = new Uint8Array(Math.min(maxEixida, Math.max(1024, n * 4)));
  let op = 0;
  /* Taules dels blocs dinàmics: només es reserven si n'hi ha cap. */
  let dinamiques = null;

  const falla = (codi, missatge) => new ErrorInflate(codi, missatge, eixida.subarray(0, op));
  const truncat = () => falla('truncat', "l'entrada s'acaba abans del final del flux");
  const limit = () => falla('limit', `l'eixida passaria de ${maxEixida} bytes`);

  /* Carrega bytes fins a tindre `k` bits (k ≤ 16) o acabar l'entrada. */
  const omple = (k) => {
    while (nb < k && pos < n) {
      bb |= entrada[pos] << nb;
      pos += 1;
      nb += 8;
    }
  };

  /* Llig un enter de `k` bits (k ≤ 16), el primer bit el menys significatiu. */
  const llig = (k) => {
    omple(k);
    if (nb < k) throw truncat();
    const valor = bb & ((1 << k) - 1);
    bb >>>= k;
    nb -= k;
    return valor;
  };

  /* Llig un símbol amb una taula de taulaHuffman(). Al final de l'entrada,
     els bits que falten valen 0: si el codi trobat els necessitava, és truncat. */
  const simbol = (taula, bits) => {
    omple(bits);
    const entradaTaula = taula[bb & ((1 << bits) - 1)];
    const l = entradaTaula & 15;
    if (l === 0) throw falla('corrupte', 'codi de Huffman invàlid');
    if (l > nb) throw truncat();
    bb >>>= l;
    nb -= l;
    return entradaTaula >> 4;
  };

  /* Fa lloc per a `k` bytes més i torna quants en cap abans del límit. */
  const lloc = (k) => {
    const cap = Math.min(k, maxEixida - op);
    if (op + cap > eixida.length) {
      const nova = new Uint8Array(Math.min(maxEixida, Math.max(eixida.length * 2, op + cap)));
      nova.set(eixida.subarray(0, op));
      eixida = nova;
    }
    return cap;
  };

  /* §3.2.4: bloc guardat. Es salta al límit de byte; LEN i NLEN (el seu
     complement) van en little-endian i després LEN bytes tal qual. */
  const blocGuardat = () => {
    bb = 0;
    pos -= nb >> 3;
    nb = 0;
    if (pos + 4 > n) throw truncat();
    const len = entrada[pos] | (entrada[pos + 1] << 8);
    const nlen = entrada[pos + 2] | (entrada[pos + 3] << 8);
    pos += 4;
    if (len !== (~nlen & 0xffff)) throw falla('corrupte', "LEN i NLEN d'un bloc guardat no quadren");
    const disponibles = Math.min(len, n - pos);
    const k = lloc(disponibles);
    eixida.set(entrada.subarray(pos, pos + k), op);
    op += k;
    pos += k;
    if (k < disponibles) throw limit();
    if (disponibles < len) throw truncat();
  };

  /* §3.2.7: capçalera d'un bloc dinàmic. Torna les seues dues taules. */
  const taulesDinamiques = () => {
    if (!dinamiques) {
      dinamiques = {
        longituds: new Uint8Array(MAX_LITERALS + MAX_DISTANCIES),
        taulaCodis: new Uint16Array(1 << 7),
        taulaLiterals: new Uint16Array(1 << MAX_BITS),
        taulaDistancies: new Uint16Array(1 << MAX_BITS)
      };
    }
    const { longituds, taulaCodis, taulaLiterals, taulaDistancies } = dinamiques;
    const nLiterals = llig(5) + 257;
    const nDistancies = llig(5) + 1;
    const nCodis = llig(4) + 4;
    if (nLiterals > MAX_LITERALS || nDistancies > MAX_DISTANCIES) throw falla('corrupte', 'massa símbols de longitud o de distància');
    /* Primer, el codi de longituds: 3 bits per símbol, en ORDRE_LONGITUDS. */
    longituds.fill(0, 0, 19);
    for (let i = 0; i < nCodis; i += 1) longituds[ORDRE_LONGITUDS[i]] = llig(3);
    const bitsCodis = taulaHuffman(longituds, 19, taulaCodis, false);
    /* Després, les longituds dels dos alfabets seguides: 0–15 són longituds;
       16 repetix l'anterior 3–6 voltes, 17 posa 3–10 zeros i 18, 11–138. */
    const total = nLiterals + nDistancies;
    let i = 0;
    while (i < total) {
      const s = simbol(taulaCodis, bitsCodis);
      if (s < 16) {
        longituds[i] = s;
        i += 1;
        continue;
      }
      let valor = 0;
      let repeticions;
      if (s === 16) {
        if (i === 0) throw falla('corrupte', 'repetició de longitud sense cap longitud anterior');
        valor = longituds[i - 1];
        repeticions = 3 + llig(2);
      } else if (s === 17) {
        repeticions = 3 + llig(3);
      } else {
        repeticions = 11 + llig(7);
      }
      if (i + repeticions > total) throw falla('corrupte', 'la repetició de longituds passa del final');
      longituds.fill(valor, i, i + repeticions);
      i += repeticions;
    }
    if (longituds[256] === 0) throw falla('corrupte', 'falta el codi de final de bloc');
    const bitsLiterals = taulaHuffman(longituds, nLiterals, taulaLiterals, true);
    const bitsDistancies = taulaHuffman(longituds.subarray(nLiterals, total), nDistancies, taulaDistancies, true);
    return { taulaLiterals, bitsLiterals, taulaDistancies, bitsDistancies };
  };

  /* §3.2.5: bloc comprimit. Literals tal qual; 256 tanca el bloc; 257–285
     són una longitud, seguida d'una distància, que copia de l'eixida. */
  const blocHuffman = ({ taulaLiterals, bitsLiterals, taulaDistancies, bitsDistancies }) => {
    for (;;) {
      const s = simbol(taulaLiterals, bitsLiterals);
      if (s < 256) {
        if (op === eixida.length && lloc(1) === 0) throw limit();
        eixida[op] = s;
        op += 1;
        continue;
      }
      if (s === 256) return;
      const iLongitud = s - 257;
      if (iLongitud >= 29) throw falla('corrupte', 'símbol de longitud invàlid');
      const longitud = LONGITUD_BASE[iLongitud] + llig(LONGITUD_EXTRA[iLongitud]);
      const d = simbol(taulaDistancies, bitsDistancies);
      if (d >= 30) throw falla('corrupte', 'codi de distància invàlid');
      const distancia = DISTANCIA_BASE[d] + llig(DISTANCIA_EXTRA[d]);
      if (distancia > op) throw falla('corrupte', "distància més enrere que l'inici de les dades");
      const k = op + longitud <= eixida.length ? longitud : lloc(longitud);
      /* Byte a byte: la còpia pot solapar-se amb el que escriu (distància < longitud). */
      for (const fi = op + k; op < fi; op += 1) eixida[op] = eixida[op - distancia];
      if (k < longitud) throw limit();
    }
  };

  /* §3.2.3: cada bloc comença per BFINAL (1 bit) i BTYPE (2 bits). */
  let final = 0;
  while (!final) {
    final = llig(1);
    const tipus = llig(2);
    if (tipus === 0) blocGuardat();
    else if (tipus === 1) blocHuffman(FIXES);
    else if (tipus === 2) blocHuffman(taulesDinamiques());
    else throw falla('corrupte', 'bloc de tipus 3 (reservat)');
  }
  /* Els bits que queden del darrer byte es descarten; els bytes sencers
     carregats de més tornen a l'entrada. */
  return { dades: op === eixida.length ? eixida : eixida.slice(0, op), fi: pos - (nb >> 3) };
}

function limitEixida(maxEixida) {
  if (typeof maxEixida !== 'number' || !(maxEixida >= 0)) throw new RangeError('inflate: maxEixida ha de ser un nombre de bytes no negatiu.');
  return Math.floor(maxEixida);
}

/**
 * Descomprimix un flux zlib (RFC 1950) en JS pur. Estricte: capçalera,
 * dades DEFLATE i Adler-32 s'han de llegir senceres; qualsevol problema
 * llança ErrorInflate (amb `parcial`). Els bytes de després de la suma
 * Adler-32 s'ignoren.
 * @param {Uint8Array|ArrayBuffer|ArrayBufferView} bytes
 * @param {{ maxEixida?: number, avisa?: (error: ErrorInflate) => void }} [opcions]
 *   maxEixida: sostre de l'eixida en bytes (64 MiB per defecte).
 *   avisa: si hi és, els problemes de la cua (Adler-32 que no quadra, codi
 *   'adler', o que falta, codi 'truncat') no llancen: es passen ací i es
 *   tornen les dades, que ja són senceres.
 * @returns {Uint8Array}
 */
export function inflatePur(bytes, { maxEixida = LIMIT_EIXIDA, avisa } = {}) {
  const entrada = aBytes(bytes);
  if (!entrada) throw new TypeError('inflate: cal un Uint8Array.');
  const max = limitEixida(maxEixida);
  if (entrada.length < 2) throw new ErrorInflate('truncat', 'falta la capçalera zlib');
  const cmf = entrada[0];
  const flg = entrada[1];
  if ((cmf & 0x0f) !== 8) throw new ErrorInflate('capcalera', 'el mètode de compressió no és DEFLATE');
  if (cmf >> 4 > 7) throw new ErrorInflate('capcalera', 'la finestra passa de 32 KiB');
  if (((cmf << 8) | flg) % 31 !== 0) throw new ErrorInflate('capcalera', 'el control FCHECK no quadra');
  if (flg & 0x20) throw new ErrorInflate('diccionari', 'el flux demana un diccionari predefinit');
  const { dades, fi } = inflaCru(entrada, 2, max);
  let problema = null;
  if (fi + 4 > entrada.length) {
    problema = new ErrorInflate('truncat', 'falta la suma Adler-32 del final', dades);
  } else {
    const esperada = ((entrada[fi] << 24) | (entrada[fi + 1] << 16) | (entrada[fi + 2] << 8) | entrada[fi + 3]) >>> 0;
    if (adler32(dades) !== esperada) problema = new ErrorInflate('adler', 'la suma Adler-32 no quadra', dades);
  }
  if (problema) {
    if (typeof avisa !== 'function') throw problema;
    avisa(problema);
  }
  return dades;
}

/**
 * Descomprimix dades DEFLATE crues (RFC 1951, sense capçalera zlib) en JS
 * pur. Estricte com inflatePur(); els bytes de després del bloc final
 * s'ignoren.
 * @param {Uint8Array|ArrayBuffer|ArrayBufferView} bytes
 * @param {{ maxEixida?: number }} [opcions]
 * @returns {Uint8Array}
 */
export function inflateRawPur(bytes, { maxEixida = LIMIT_EIXIDA } = {}) {
  const entrada = aBytes(bytes);
  if (!entrada) throw new TypeError('inflate: cal un Uint8Array.');
  return inflaCru(entrada, 0, limitEixida(maxEixida)).dades;
}

/* Un intent del motor pur: les dades si ix bé; si falla, el que s'haja
   pogut descomprimir, o null si no n'ha eixit res. */
function intentPur(intent) {
  try {
    return intent();
  } catch (e) {
    if (!(e instanceof ErrorInflate)) throw e;
    return e.parcial.length > 0 ? e.parcial : null;
  }
}

/* El motor pur amb la tolerància de la variant de DecompressionStream. */
async function inflatePurTolerant(bytes) {
  const entrada = aBytes(bytes);
  if (!entrada) throw new TypeError('inflate: cal un Uint8Array.');
  const zlib = intentPur(() => inflatePur(entrada, { avisa: () => {} }));
  if (zlib) return zlib;
  if (!ambCapcaleraZlib(entrada)) {
    const crua = intentPur(() => inflateRawPur(entrada));
    if (crua && crua.length > 0) return crua;
  }
  throw new Error('inflate: el flux comprimit no es pot llegir.');
}

/* ── DecompressionStream ──────────────────────────────────────────────── */

function concatena(trossos, total) {
  const eixida = new Uint8Array(Math.min(total, LIMIT_EIXIDA));
  let p = 0;
  for (const tros of trossos) {
    if (p >= eixida.length) break;
    const part = tros.subarray(0, eixida.length - p);
    eixida.set(part, p);
    p += part.length;
  }
  return eixida;
}

/* Una passada de DecompressionStream. Des del byte `unAUn` s'escriu d'un en
   un, per a perdre com a molt la sortida del byte que falla. */
async function passada(Descompressor, format, bytes, unAUn) {
  const flux = new Descompressor(format);
  const escriptor = flux.writable.getWriter();
  const lector = flux.readable.getReader();
  const trossos = [];
  let total = 0;
  let limitat = false;
  const lectura = (async () => {
    try {
      for (;;) {
        const { value, done } = await lector.read();
        if (done) return;
        trossos.push(value);
        total += value.length;
        if (total > LIMIT_EIXIDA) {
          limitat = true;
          await lector.cancel();
          return;
        }
      }
    } catch {
      /* l'error el recull l'escriptor */
    }
  })();
  let fallada = -1;
  let i = 0;
  try {
    while (i < bytes.length) {
      const mida = i >= unAUn ? 1 : Math.min(TROS, unAUn - i);
      await escriptor.write(bytes.subarray(i, i + mida));
      i += mida;
    }
    /* Una escriptura buida espera que el lector haja buidat la cua: si el
       tancament falla (flux truncat), no es perd res del que ja ha eixit. */
    await escriptor.write(new Uint8Array(0));
    await escriptor.close();
  } catch {
    fallada = i;
  }
  await lectura;
  return { dades: concatena(trossos, total), fallada, limitat };
}

/* El descompressor tolerant sobre un constructor DecompressionStream. */
function inflateAmbFlux(Descompressor) {
  return async function inflate(bytes) {
    const entrada = aBytes(bytes);
    if (!entrada) throw new TypeError('inflate: cal un Uint8Array.');
    let r = await passada(Descompressor, 'deflate', entrada, Infinity);
    if (r.fallada < 0 || r.limitat) return r.dades;
    if (r.fallada < entrada.length) {
      const segona = await passada(Descompressor, 'deflate', entrada, r.fallada);
      if (segona.dades.length > r.dades.length) r = segona;
    }
    if (r.dades.length > 0) return r.dades;
    if (!ambCapcaleraZlib(entrada)) {
      /* Fluxos sense capçalera zlib: 'deflate-raw' no existix a Chrome 100 ni a Firefox 100. */
      try {
        const crua = await passada(Descompressor, 'deflate-raw', entrada, Infinity);
        if (crua.dades.length > 0) return crua.dades;
      } catch {
        /* format no suportat: es queda en l'error de baix */
      }
    }
    throw new Error('inflate: el flux comprimit no es pot llegir.');
  };
}

/**
 * Descompressor de fluxos zlib basat en DecompressionStream('deflate'), o
 * null si el navegador no el té. La funció tornada accepta un Uint8Array i
 * en torna un altre; si no en pot traure cap byte, llança un Error.
 * @returns {null|((bytes: Uint8Array) => Promise<Uint8Array>)}
 */
export function inflateNavegador() {
  if (typeof globalThis.DecompressionStream !== 'function') return null;
  return inflateAmbFlux(globalThis.DecompressionStream);
}

/**
 * El millor descompressor zlib de l'entorn; mai null. Amb DecompressionStream
 * torna la variant d'inflateNavegador(); sense (Safari 16.0–16.3), el motor
 * pur. Les dues tenen la mateixa tolerància:
 *  - flux sencer: el contingut; brossa darrere: el contingut sencer;
 *  - truncat, corrupte a mitges o Adler-32 que no quadra: el que s'haja
 *    pogut descomprimir, si és alguna cosa;
 *  - capçalera zlib invàlida: es prova com a DEFLATE cru;
 *  - més de 64 MiB: els primers 64 MiB;
 *  - res de res: llança un Error; entrada no binària: TypeError.
 * Diferències: el motor pur és més lent (JS, sense fils) però torna fins a
 * l'últim byte bo, mentre que DecompressionStream perd com a molt la sortida
 * del byte que falla; i el pur sempre llig DEFLATE cru, mentre que
 * 'deflate-raw' no existix a tots els navegadors que tenen DecompressionStream.
 * @param {{ DecompressionStream?: unknown }|null} [entorn] on es busca
 *   DecompressionStream; per defecte, globalThis.
 * @returns {(bytes: Uint8Array) => Promise<Uint8Array>}
 */
export function inflateDisponible(entorn = globalThis) {
  const Descompressor = entorn?.DecompressionStream;
  if (typeof Descompressor === 'function') return inflateAmbFlux(Descompressor);
  return inflatePurTolerant;
}
