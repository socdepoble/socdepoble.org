// @vitest-environment node
/* Gestoria · nucli · inflate: DecompressionStream amb fluxos sencers,
   truncats i amb brossa; el motor DEFLATE en JS pur contrastat amb
   node:zlib; inflateDisponible() amb i sense DecompressionStream; i la
   detecció de la capçalera %PDF-. Totes les dades són sintètiques. */
import { constants, deflateRawSync, deflateSync, inflateRawSync, inflateSync } from 'node:zlib';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ErrorInflate, aBytes, esPdf, inflateDisponible, inflateNavegador, inflatePur, inflateRawPur } from './inflate.js';
import { extreuTextPdf } from './pdfText.js';

const bytes = (text) => new Uint8Array(Buffer.from(text, 'latin1'));
const text = (b) => Buffer.from(b).toString('latin1');
const igual = (a, b) => a.length === b.length && Buffer.from(a.buffer, a.byteOffset, a.length).equals(Buffer.from(b.buffer, b.byteOffset, b.length));
const esPrefix = (prefix, sencer) => prefix.length <= sencer.length && igual(prefix, sencer.subarray(0, prefix.length));
/* Text llarg i poc repetitiu perquè el flux comprimit ocupe diversos trossos. */
const LLARG = Array.from({ length: 4000 }, (_, i) => `BT /F1 10 Tf 72 ${800 - (i % 700)} Td (Linia ${i * 7919 % 10007}) Tj ET`).join('\n');
const MIB = 1024 * 1024;
/* Bomba de descompressió: 65 MiB de zeros en uns 64 KB. Es comprimix una sola volta. */
let bombaFeta = null;
const bomba = () => {
  bombaFeta ??= new Uint8Array(deflateSync(Buffer.alloc(65 * MIB), { level: 1 }));
  return bombaFeta;
};

/* Generador congruencial: sempre els mateixos bytes per a la mateixa llavor. */
function generador(llavor) {
  let x = llavor >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x >>> 16;
  };
}

function aleatoris(n, llavor) {
  const seguent = generador(llavor);
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) b[i] = seguent() & 0xff;
  return b;
}

/* Text de factures inventat, de paraules triades a l'atzar amb llavor. */
function textSintetic(n, llavor) {
  const paraules = ['Factura', 'base', 'imponible', 'quota', 'IVA', 'total', 'Exemple', 'Cooperativa', 'SCCL', 'trimestre',
    'proveidor', '21%', '121,00', 'pagina', 'BT', 'Tj', 'ET', '\n', 'Ribera', 'Serveis', 'example.org', '0,00', 'TOTAL'];
  const seguent = generador(llavor);
  const parts = [];
  let mida = 0;
  while (mida < n) {
    const p = paraules[seguent() % paraules.length];
    parts.push(p);
    mida += p.length + 1;
  }
  return new Uint8Array(Buffer.from(parts.join(' '), 'latin1').subarray(0, n));
}

const ENTRADES = [
  ['buida', new Uint8Array(0)],
  ['un byte', new Uint8Array([0x42])],
  ['text curt', bytes('BT (Hola) Tj ET')],
  ['text llarg (més de 64 KiB)', bytes(LLARG)],
  ['text sintètic de 300 KB', textSintetic(300000, 11)],
  ['bytes aleatoris', aleatoris(100000, 5)],
  ['zeros', new Uint8Array(300000)],
  ['un caràcter repetit', bytes('a'.repeat(200000))],
  ['els 256 bytes repetits', new Uint8Array(256 * 600).map((_, i) => i & 0xff)],
  ['bloc aleatori repetit lluny (finestra quasi plena)', (() => {
    const b = aleatoris(32000, 9);
    const r = new Uint8Array(96000);
    r.set(b, 0);
    r.set(b, 32000);
    r.set(b, 64000);
    return r;
  })()],
  ['barreja de text, aleatoris i repeticions', new Uint8Array(Buffer.concat([
    Buffer.from(textSintetic(40000, 3)), Buffer.from(aleatoris(30000, 4)), Buffer.alloc(20000, 0x20), Buffer.from(bytes(LLARG.slice(0, 50000)))
  ]))]
];

const ZLIB = [
  ['nivell 0 (blocs guardats)', { level: 0 }],
  ['nivell 1', { level: 1 }],
  ['nivell 6', { level: 6 }],
  ['nivell 9', { level: 9 }],
  ['Z_FIXED (Huffman fix)', { strategy: constants.Z_FIXED }],
  ['Z_HUFFMAN_ONLY', { strategy: constants.Z_HUFFMAN_ONLY }],
  ['Z_RLE', { strategy: constants.Z_RLE }],
  ['finestra de 512 bytes i memLevel 1 (blocs curts)', { windowBits: 9, memLevel: 1 }]
];

const CRU = [
  ['nivell 0', { level: 0 }],
  ['nivell 6', { level: 6 }],
  ['nivell 9', { level: 9 }],
  ['Z_FIXED', { strategy: constants.Z_FIXED }],
  ['Z_HUFFMAN_ONLY', { strategy: constants.Z_HUFFMAN_ONLY }]
];

/* Executa `f` i torna l'ErrorInflate que llança (falla si no en llança cap). */
function errorDe(f) {
  try {
    f();
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorInflate);
    return e;
  }
  throw new Error('esperava un ErrorInflate');
}

/* ── Fluxos DEFLATE fets a mà ─────────────────────────────────────────── */

/* Escriptor de bits de DEFLATE (§3.1.1): el primer bit, el menys significatiu. */
function escriptorBits() {
  const eixida = [];
  let acumulat = 0;
  let n = 0;
  const bits = (valor, k) => {
    for (let i = 0; i < k; i += 1) {
      acumulat |= ((valor >> i) & 1) << n;
      n += 1;
      if (n === 8) {
        eixida.push(acumulat);
        acumulat = 0;
        n = 0;
      }
    }
  };
  /* Els codis de Huffman s'emeten pel bit més significatiu. */
  const huffman = (codi, k) => {
    for (let i = k - 1; i >= 0; i -= 1) bits((codi >> i) & 1, 1);
  };
  const alinea = () => {
    if (n > 0) bits(0, 8 - n);
  };
  const fi = () => {
    alinea();
    return new Uint8Array(eixida);
  };
  return { bits, huffman, alinea, fi };
}

/* Símbol de literal/longitud amb el codi fix (§3.2.6). */
function fix(e, s) {
  if (s < 144) e.huffman(0x30 + s, 8);
  else if (s < 256) e.huffman(0x190 + s - 144, 9);
  else if (s < 280) e.huffman(s - 256, 7);
  else e.huffman(0xc0 + s - 280, 8);
}

function guardat(e, dades, final) {
  e.bits(final, 1);
  e.bits(0, 2);
  e.alinea();
  e.bits(dades.length, 16);
  e.bits(~dades.length & 0xffff, 16);
  for (const b of dades) e.bits(b, 8);
}

/* Codis canònics (§3.2.2) a partir de les longituds; -1 si no n'hi ha. */
function canonics(longituds) {
  const max = Math.max(0, ...longituds);
  const compte = new Array(max + 1).fill(0);
  for (const l of longituds) if (l > 0) compte[l] += 1;
  const seguent = [];
  let codi = 0;
  for (let l = 1; l <= max; l += 1) {
    codi = (codi + compte[l - 1]) << 1;
    seguent[l] = codi;
  }
  return longituds.map((l) => (l > 0 ? seguent[l]++ : -1));
}

const ORDRE = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
/* Codi complet per als 19 símbols de longitud: 13 de 4 bits i 6 de 5. */
const LONG_CODIS = new Array(19).fill(0);
ORDRE.forEach((s, i) => {
  LONG_CODIS[s] = i < 13 ? 4 : 5;
});

/* Bloc dinàmic amb les longituds donades. `cos` escriu les dades amb els
   codis resultants; `simbols` substituïx la codificació de les longituds. */
function dinamic(e, { literals, distancies, cos, simbols }) {
  e.bits(1, 1);
  e.bits(2, 2);
  e.bits(literals.length - 257, 5);
  e.bits(distancies.length - 1, 5);
  e.bits(19 - 4, 4);
  for (const s of ORDRE) e.bits(LONG_CODIS[s], 3);
  const codisLongituds = canonics(LONG_CODIS);
  const emet = (s) => e.huffman(codisLongituds[s], LONG_CODIS[s]);
  if (simbols) {
    for (const [s, valor, k] of simbols) {
      emet(s);
      if (k) e.bits(valor, k);
    }
  } else {
    const totes = [...literals, ...distancies];
    let i = 0;
    while (i < totes.length) {
      let zeros = 0;
      while (totes[i + zeros] === 0 && zeros < 138) zeros += 1;
      if (zeros >= 11) {
        emet(18);
        e.bits(zeros - 11, 7);
        i += zeros;
      } else {
        emet(totes[i]);
        i += 1;
      }
    }
  }
  const cl = canonics(literals);
  const cd = canonics(distancies);
  cos?.({ lit: (s) => e.huffman(cl[s], literals[s]), dist: (s) => e.huffman(cd[s], distancies[s]) });
}

/* Longituds d'un alfabet de `n` símbols amb només els donats. */
function longituds(n, parells) {
  const l = new Array(n).fill(0);
  for (const [s, k] of parells) l[s] = k;
  return l;
}

/* Node és la referència: o els dos fallen, o els dos donen el mateix. */
function comparaAmbNode(cru) {
  let esperat = null;
  try {
    esperat = new Uint8Array(inflateRawSync(cru));
  } catch {
    /* zlib el rebutja */
  }
  if (esperat) {
    const obtingut = inflateRawPur(cru);
    expect(igual(obtingut, esperat)).toBe(true);
    return obtingut;
  }
  return errorDe(() => inflateRawPur(cru));
}

/* ── esPdf i aBytes ───────────────────────────────────────────────────── */

describe('esPdf', () => {
  test('reconeix la capçalera al principi i amb brossa davant', () => {
    expect(esPdf(bytes('%PDF-1.7\n%âãÏÓ\n'))).toBe(true);
    expect(esPdf(bytes(`${' '.repeat(100)}%PDF-1.4`))).toBe(true);
    expect(esPdf(new Uint8Array(Buffer.from('%PDF-2.0')).buffer)).toBe(true);
  });

  test('rebutja el que no és PDF', () => {
    expect(esPdf(bytes('Hola, món'))).toBe(false);
    expect(esPdf(bytes('%PDF'))).toBe(false);
    expect(esPdf(bytes(`${'x'.repeat(1100)}%PDF-1.4`))).toBe(false);
    expect(esPdf(new Uint8Array(0))).toBe(false);
    expect(esPdf(null)).toBe(false);
    expect(esPdf('%PDF-1.4')).toBe(false);
  });
});

describe('aBytes', () => {
  test('converteix vistes i buffers', () => {
    const u = new Uint8Array([1, 2, 3, 4]);
    expect(aBytes(u)).toBe(u);
    expect([...aBytes(u.buffer)]).toEqual([1, 2, 3, 4]);
    expect([...aBytes(new DataView(u.buffer, 1, 2))]).toEqual([2, 3]);
    expect(aBytes('text')).toBeNull();
    expect(aBytes(null)).toBeNull();
  });
});

/* ── inflateNavegador (DecompressionStream) ───────────────────────────── */

describe('inflateNavegador', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('sense DecompressionStream torna null', () => {
    vi.stubGlobal('DecompressionStream', undefined);
    expect(inflateNavegador()).toBeNull();
  });

  test('descomprimix un flux zlib curt i un de llarg', async () => {
    const inflate = inflateNavegador();
    expect(typeof inflate).toBe('function');
    expect(text(await inflate(new Uint8Array(deflateSync(Buffer.from('BT (Hola) Tj ET')))))).toBe('BT (Hola) Tj ET');
    const comprimit = new Uint8Array(deflateSync(Buffer.from(LLARG)));
    expect(comprimit.length).toBeGreaterThan(8192);
    expect(text(await inflate(comprimit))).toBe(LLARG);
  });

  test('flux buit', async () => {
    const inflate = inflateNavegador();
    expect((await inflate(new Uint8Array(deflateSync(Buffer.alloc(0))))).length).toBe(0);
  });

  test('brossa darrere del flux: torna el contingut sencer', async () => {
    const inflate = inflateNavegador();
    const net = deflateSync(Buffer.from(LLARG));
    const ambBrossa = new Uint8Array(Buffer.concat([net, Buffer.from('\r\n\n  brossa final')]));
    expect(text(await inflate(ambBrossa))).toBe(LLARG);
  });

  test('flux truncat: torna un prefix no buit del contingut', async () => {
    const inflate = inflateNavegador();
    const net = deflateSync(Buffer.from(LLARG));
    const truncat = new Uint8Array(net.subarray(0, Math.floor(net.length * 0.6)));
    const eixida = text(await inflate(truncat));
    expect(eixida.length).toBeGreaterThan(LLARG.length * 0.3);
    expect(LLARG.startsWith(eixida)).toBe(true);
  });

  test('deflate cru sense capçalera zlib', async () => {
    const inflate = inflateNavegador();
    const cru = new Uint8Array(deflateRawSync(Buffer.from('BT (Cru) Tj ET')));
    expect(text(await inflate(cru))).toBe('BT (Cru) Tj ET');
  });

  test('brossa pura: llança', async () => {
    const inflate = inflateNavegador();
    await expect(inflate(bytes('aixo no es zlib de cap manera'))).rejects.toThrow();
    await expect(inflate('text')).rejects.toThrow(TypeError);
  });
});

/* ── inflatePur i inflateRawPur contra node:zlib ──────────────────────── */

describe('inflatePur: el mateix resultat que node:zlib', () => {
  test.each(ZLIB)('zlib %s', (_, opcions) => {
    for (const [nom, original] of ENTRADES) {
      const comprimit = new Uint8Array(deflateSync(original, opcions));
      const eixida = inflatePur(comprimit);
      expect(eixida).toBeInstanceOf(Uint8Array);
      expect(igual(eixida, original), nom).toBe(true);
    }
  });

  test.each(CRU)('DEFLATE cru %s', (_, opcions) => {
    for (const [nom, original] of ENTRADES) {
      const comprimit = new Uint8Array(deflateRawSync(original, opcions));
      expect(igual(inflateRawPur(comprimit), original), nom).toBe(true);
    }
  });

  test('accepta ArrayBuffer i altres vistes, i ignora el que hi ha darrere del flux', () => {
    const original = bytes(LLARG);
    const comprimit = new Uint8Array(deflateSync(original));
    expect(igual(inflatePur(comprimit.slice().buffer), original)).toBe(true);
    expect(igual(inflatePur(new DataView(comprimit.buffer)), original)).toBe(true);
    const ambBrossa = new Uint8Array(Buffer.concat([Buffer.from(comprimit), Buffer.from('\r\nendstream')]));
    expect(igual(inflatePur(ambBrossa), original)).toBe(true);
    const cru = new Uint8Array(Buffer.concat([deflateRawSync(original), Buffer.from('brossa')]));
    expect(igual(inflateRawPur(cru), original)).toBe(true);
  });

  test('entrada no binària o límit invàlid: TypeError i RangeError', () => {
    expect(() => inflatePur('text')).toThrow(TypeError);
    expect(() => inflateRawPur(null)).toThrow(TypeError);
    const buit = new Uint8Array(deflateSync(Buffer.alloc(0)));
    for (const maxEixida of [-1, Number.NaN, '10', null]) {
      expect(() => inflatePur(buit, { maxEixida })).toThrow(RangeError);
    }
  });
});

describe('inflatePur: fluxos fets a mà', () => {
  test('distància de 32 768 bytes, la més llunyana de la finestra', () => {
    const primer = aleatoris(32768, 3);
    const e = escriptorBits();
    guardat(e, primer, 0);
    e.bits(1, 1);
    e.bits(1, 2);
    fix(e, 285); /* longitud 258 */
    e.huffman(29, 5);
    e.bits(32768 - 24577, 13);
    fix(e, 256);
    const cru = e.fi();
    const eixida = comparaAmbNode(cru);
    expect(eixida.length).toBe(32768 + 258);
    expect(igual(eixida.subarray(32768), primer.subarray(0, 258))).toBe(true);
  });

  test('còpia solapada (distància 1) i totes les longituds del codi fix', () => {
    const e = escriptorBits();
    e.bits(1, 1);
    e.bits(1, 2);
    fix(e, 0x41);
    let esperat = 'A';
    const extres = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
    const bases = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
    for (let i = 0; i < 29; i += 1) {
      const extra = extres[i] ? (1 << extres[i]) - 1 : 0;
      fix(e, 257 + i);
      e.bits(extra, extres[i]);
      e.huffman(0, 5);
      esperat += 'A'.repeat(bases[i] + extra);
    }
    fix(e, 256);
    expect(text(comparaAmbNode(e.fi()))).toBe(esperat);
  });

  test('bloc dinàmic amb codi de distàncies buit (només literals)', () => {
    const e = escriptorBits();
    dinamic(e, {
      literals: longituds(257, [[65, 1], [256, 1]]),
      distancies: [0],
      cos: ({ lit }) => {
        lit(65);
        lit(65);
        lit(65);
        lit(256);
      }
    });
    expect(text(comparaAmbNode(e.fi()))).toBe('AAA');
  });

  test("bloc dinàmic amb un sol codi de distància d'un bit (incomplet però permés)", () => {
    const e = escriptorBits();
    dinamic(e, {
      literals: longituds(258, [[65, 2], [256, 2], [257, 1]]),
      distancies: [1],
      cos: ({ lit, dist }) => {
        lit(65);
        lit(257);
        dist(0);
        lit(256);
      }
    });
    expect(text(comparaAmbNode(e.fi()))).toBe('AAAA');
  });

  test.each([
    ['falta el codi de final de bloc', { literals: longituds(257, [[65, 1], [66, 1]]), distancies: [0] }],
    ['codi de literals sobresubscrit', { literals: longituds(257, [[65, 1], [66, 1], [256, 1]]), distancies: [0] }],
    ['codi de literals incomplet', { literals: longituds(257, [[65, 2], [256, 2]]), distancies: [0] }],
    ['codi de distàncies incomplet de més d’un bit', { literals: longituds(258, [[65, 1], [256, 2], [257, 2]]), distancies: [2, 0] }],
    ['massa símbols de literal (287)', { literals: longituds(287, [[65, 1], [256, 1]]), distancies: [0] }],
    ['massa símbols de distància (31)', { literals: longituds(257, [[65, 1], [256, 1]]), distancies: new Array(31).fill(0) }],
    ['repetició (16) sense longitud anterior', { literals: longituds(257, [[65, 1], [256, 1]]), distancies: [0], simbols: [[16, 0, 2]] }],
    ['repetició de zeros que passa del final', { literals: longituds(257, [[65, 1], [256, 1]]), distancies: [0], simbols: [[18, 127, 7], [18, 127, 7], [18, 127, 7]] }]
  ])('bloc dinàmic invàlid: %s', (_, bloc) => {
    const e = escriptorBits();
    dinamic(e, { ...bloc, cos: ({ lit }) => lit(65) });
    const error = comparaAmbNode(e.fi());
    expect(error.codi).toBe('corrupte');
  });

  test.each([
    ['bloc de tipus 3', (e) => {
      e.bits(1, 1);
      e.bits(3, 2);
    }],
    ['LEN i NLEN que no quadren', (e) => {
      e.bits(1, 1);
      e.bits(0, 2);
      e.alinea();
      e.bits(5, 16);
      e.bits(5, 16);
      e.bits(0, 40);
    }],
    ['distància més enrere que l’inici', (e) => {
      e.bits(1, 1);
      e.bits(1, 2);
      fix(e, 0x41);
      fix(e, 257);
      e.huffman(1, 5); /* distància 2 amb un sol byte escrit */
      fix(e, 256);
    }],
    ['símbol de longitud 286 al codi fix', (e) => {
      e.bits(1, 1);
      e.bits(1, 2);
      fix(e, 0x41);
      fix(e, 286);
      fix(e, 256);
    }],
    ['codi de distància 30 al codi fix', (e) => {
      e.bits(1, 1);
      e.bits(1, 2);
      fix(e, 0x41);
      fix(e, 257);
      e.huffman(30, 5);
      fix(e, 256);
    }]
  ])('flux invàlid: %s', (_, escriu) => {
    const e = escriptorBits();
    escriu(e);
    const error = comparaAmbNode(e.fi());
    expect(error.codi).toBe('corrupte');
    expect(error.message).toMatch(/^inflate: /);
  });

  test('l’error porta el que ja s’havia descomprimit', () => {
    const e = escriptorBits();
    e.bits(1, 1);
    e.bits(1, 2);
    for (const c of 'Factura') fix(e, c.charCodeAt(0));
    fix(e, 287);
    const error = errorDe(() => inflateRawPur(e.fi()));
    expect(error.codi).toBe('corrupte');
    expect(text(error.parcial)).toBe('Factura');
  });
});

describe('inflatePur: capçalera zlib i Adler-32', () => {
  test('capçaleres invàlides i diccionari predefinit', () => {
    const net = new Uint8Array(deflateSync(Buffer.from('BT (Hola) Tj ET')));
    const amb = (cmf, flg) => {
      const b = net.slice();
      b[0] = cmf;
      b[1] = flg;
      return b;
    };
    expect(errorDe(() => inflatePur(amb(0x79, 0x9c - 0x1f))).codi).toBe('capcalera'); /* CM = 9 */
    expect(errorDe(() => inflatePur(amb(0x88, 0x1c))).codi).toBe('capcalera'); /* finestra de 64 KiB */
    expect(errorDe(() => inflatePur(amb(0x78, 0x9d))).codi).toBe('capcalera'); /* FCHECK */
    expect(errorDe(() => inflatePur(new Uint8Array([0x78]))).codi).toBe('truncat');
    expect(errorDe(() => inflatePur(new Uint8Array(0))).codi).toBe('truncat');
    const ambDiccionari = new Uint8Array(deflateSync(Buffer.from('BT (Hola) Tj ET'), { dictionary: Buffer.from('BT Tj ET') }));
    expect(ambDiccionari[1] & 0x20).toBe(0x20);
    expect(errorDe(() => inflatePur(ambDiccionari)).codi).toBe('diccionari');
  });

  test('totes les finestres, de 512 bytes a 32 KiB', () => {
    const original = textSintetic(20000, 21);
    for (let windowBits = 9; windowBits <= 15; windowBits += 1) {
      expect(igual(inflatePur(new Uint8Array(deflateSync(original, { windowBits }))), original)).toBe(true);
    }
  });

  test('Adler-32 incorrecta: error tipat, o avís si es demana', () => {
    const original = bytes(LLARG);
    const comprimit = new Uint8Array(deflateSync(original));
    comprimit[comprimit.length - 1] ^= 0x01;
    expect(() => inflateSync(comprimit)).toThrow();
    const error = errorDe(() => inflatePur(comprimit));
    expect(error.codi).toBe('adler');
    expect(igual(error.parcial, original)).toBe(true);
    const avisos = [];
    const eixida = inflatePur(comprimit, { avisa: (a) => avisos.push(a) });
    expect(igual(eixida, original)).toBe(true);
    expect(avisos.map((a) => a.codi)).toEqual(['adler']);
  });

  test('sense la suma Adler-32: truncat, o avís si es demana', () => {
    const original = bytes('BT (Sense cua) Tj ET');
    const comprimit = new Uint8Array(deflateSync(original));
    const senseCua = comprimit.subarray(0, comprimit.length - 4);
    expect(errorDe(() => inflatePur(senseCua)).codi).toBe('truncat');
    const avisos = [];
    expect(text(inflatePur(senseCua, { avisa: (a) => avisos.push(a.codi) }))).toBe('BT (Sense cua) Tj ET');
    expect(avisos).toEqual(['truncat']);
  });
});

describe('inflatePur: fluxos truncats', () => {
  test.each([
    ['Huffman dinàmic', { level: 6 }],
    ['Huffman fix', { strategy: constants.Z_FIXED }],
    ['blocs guardats', { level: 0 }]
  ])('qualsevol tall (%s): truncat, amb un prefix del contingut', (_, opcions) => {
    const original = textSintetic(3000, 17);
    const comprimit = new Uint8Array(deflateSync(original, opcions));
    let ambDades = 0;
    for (let tall = 0; tall < comprimit.length; tall += 1) {
      const error = errorDe(() => inflatePur(comprimit.subarray(0, tall)));
      expect(error.codi, `tall ${tall}`).toBe('truncat');
      expect(esPrefix(error.parcial, original), `tall ${tall}`).toBe(true);
      if (error.parcial.length > 0) ambDades += 1;
    }
    expect(ambDades).toBeGreaterThan(comprimit.length / 2);
  });

  test('cru truncat, i fluxos llargs tallats a trossos', () => {
    const original = bytes(LLARG);
    const cru = new Uint8Array(deflateRawSync(original));
    for (const fraccio of [0.1, 0.5, 0.9, 0.999]) {
      const error = errorDe(() => inflateRawPur(cru.subarray(0, Math.floor(cru.length * fraccio))));
      expect(error.codi).toBe('truncat');
      expect(error.parcial.length).toBeGreaterThan(0);
      expect(esPrefix(error.parcial, original)).toBe(true);
    }
  });
});

describe('inflatePur: límit d’eixida (bombes)', () => {
  test('per defecte, 64 MiB: llança «limit» amb els primers 64 MiB', () => {
    expect(bomba().length).toBeLessThan(MIB);
    const error = errorDe(() => inflatePur(bomba()));
    expect(error.codi).toBe('limit');
    expect(error.parcial.length).toBe(64 * MIB);
  });

  test('límit a mida: exacte, d’un byte de menys i zero', () => {
    const original = textSintetic(100000, 5);
    for (const opcions of [{ level: 6 }, { level: 0 }]) {
      const comprimit = new Uint8Array(deflateSync(original, opcions));
      expect(igual(inflatePur(comprimit, { maxEixida: original.length }), original)).toBe(true);
      const error = errorDe(() => inflatePur(comprimit, { maxEixida: original.length - 1 }));
      expect(error.codi).toBe('limit');
      expect(igual(error.parcial, original.subarray(0, original.length - 1))).toBe(true);
      expect(errorDe(() => inflateRawPur(deflateRawSync(original, opcions), { maxEixida: 1000 })).parcial.length).toBe(1000);
    }
    expect(inflatePur(new Uint8Array(deflateSync(Buffer.alloc(0))), { maxEixida: 0 }).length).toBe(0);
    expect(errorDe(() => inflatePur(new Uint8Array(deflateSync(Buffer.from('x'))), { maxEixida: 0 })).codi).toBe('limit');
  });
});

describe('inflatePur: corrupció aleatòria, sempre d’acord amb zlib', () => {
  test('bytes canviats en fluxos crus: o el mateix resultat que zlib o ErrorInflate', () => {
    const seguent = generador(2026);
    const fonts = [
      new Uint8Array(deflateRawSync(textSintetic(6000, 1))),
      new Uint8Array(deflateRawSync(textSintetic(6000, 2), { strategy: constants.Z_FIXED })),
      new Uint8Array(deflateRawSync(bytes(LLARG.slice(0, 8000)), { level: 9 }))
    ];
    let errors = 0;
    for (let volta = 0; volta < 600; volta += 1) {
      const font = fonts[volta % fonts.length];
      const b = font.slice();
      const canvis = 1 + (seguent() % 3);
      for (let k = 0; k < canvis; k += 1) b[seguent() % b.length] ^= 1 << (seguent() % 8);
      if (comparaAmbNode(b) instanceof ErrorInflate) errors += 1;
    }
    expect(errors).toBeGreaterThan(100);
    expect(errors).toBeLessThan(500);
  });

  test('bytes canviats en fluxos zlib: o el mateix resultat que inflateSync o ErrorInflate', () => {
    const seguent = generador(1950);
    const font = new Uint8Array(deflateSync(textSintetic(5000, 3)));
    for (let volta = 0; volta < 300; volta += 1) {
      const b = font.slice();
      b[seguent() % b.length] ^= 1 << (seguent() % 8);
      let esperat = null;
      try {
        esperat = new Uint8Array(inflateSync(b));
      } catch {
        /* zlib el rebutja */
      }
      if (esperat) expect(igual(inflatePur(b), esperat)).toBe(true);
      else errorDe(() => inflatePur(b));
    }
  });

  test('bytes aleatoris com a DEFLATE cru: mai una excepció que no siga ErrorInflate', () => {
    let errors = 0;
    for (let llavor = 1; llavor <= 300; llavor += 1) {
      if (comparaAmbNode(aleatoris(64 + llavor, llavor)) instanceof ErrorInflate) errors += 1;
    }
    expect(errors).toBeGreaterThan(250);
  });
});

describe('inflatePur: rendiment', () => {
  test.each([
    ['nivell 6', { level: 6 }],
    ['només Huffman: cada byte és un literal', { strategy: constants.Z_HUFFMAN_ONLY }]
  ])('5 MB de text comprimit (%s) en menys de 2 s', (_, opcions) => {
    const original = textSintetic(5 * 1000 * 1000, 99);
    const comprimit = new Uint8Array(deflateSync(original, opcions));
    const inici = performance.now();
    const eixida = inflatePur(comprimit);
    const durada = performance.now() - inici;
    expect(igual(eixida, original)).toBe(true);
    expect(durada).toBeLessThan(2000);
  });
});

/* ── inflateDisponible ────────────────────────────────────────────────── */

describe('inflateDisponible: tria del motor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('amb DecompressionStream a l’entorn, l’usa', async () => {
    let usos = 0;
    class Espia extends globalThis.DecompressionStream {
      constructor(format) {
        super(format);
        usos += 1;
      }
    }
    const inflate = inflateDisponible({ DecompressionStream: Espia });
    expect(text(await inflate(new Uint8Array(deflateSync(Buffer.from('BT (Natiu) Tj ET')))))).toBe('BT (Natiu) Tj ET');
    expect(usos).toBeGreaterThan(0);
  });

  test('sense DecompressionStream, el motor pur; mai null', async () => {
    vi.stubGlobal('DecompressionStream', undefined);
    expect(inflateNavegador()).toBeNull();
    for (const inflate of [inflateDisponible(), inflateDisponible({}), inflateDisponible(null)]) {
      expect(typeof inflate).toBe('function');
      expect(text(await inflate(new Uint8Array(deflateSync(Buffer.from('BT (Pur) Tj ET')))))).toBe('BT (Pur) Tj ET');
    }
  });

  test('el motor pur no toca DecompressionStream encara que n’hi haja', async () => {
    vi.stubGlobal('DecompressionStream', class {
      constructor() {
        throw new Error('no s’havia de construir');
      }
    });
    const inflate = inflateDisponible({});
    expect(text(await inflate(new Uint8Array(deflateSync(Buffer.from(LLARG)))))).toBe(LLARG);
  });
});

describe.each([
  ['DecompressionStream', () => inflateDisponible()],
  ['el motor pur', () => inflateDisponible({})]
])('inflateDisponible amb %s: la mateixa tolerància', (_, crea) => {
  test('fluxos sencers: curt, llarg, buit i aleatori', async () => {
    const inflate = crea();
    expect(text(await inflate(new Uint8Array(deflateSync(Buffer.from('BT (Hola) Tj ET')))))).toBe('BT (Hola) Tj ET');
    expect(text(await inflate(new Uint8Array(deflateSync(Buffer.from(LLARG)))))).toBe(LLARG);
    expect((await inflate(new Uint8Array(deflateSync(Buffer.alloc(0))))).length).toBe(0);
    const aleatori = aleatoris(50000, 8);
    expect(igual(await inflate(new Uint8Array(deflateSync(aleatori))), aleatori)).toBe(true);
  });

  test('brossa darrere del flux: el contingut sencer', async () => {
    const inflate = crea();
    const ambBrossa = new Uint8Array(Buffer.concat([deflateSync(Buffer.from(LLARG)), Buffer.from('\r\n\n  brossa final')]));
    expect(text(await inflate(ambBrossa))).toBe(LLARG);
  });

  test('truncat: un prefix no buit', async () => {
    const inflate = crea();
    const net = deflateSync(Buffer.from(LLARG));
    const eixida = text(await inflate(new Uint8Array(net.subarray(0, Math.floor(net.length * 0.6)))));
    expect(eixida.length).toBeGreaterThan(LLARG.length * 0.3);
    expect(LLARG.startsWith(eixida)).toBe(true);
  });

  test('Adler-32 incorrecta: el contingut', async () => {
    const inflate = crea();
    const comprimit = new Uint8Array(deflateSync(Buffer.from(LLARG)));
    comprimit[comprimit.length - 2] ^= 0x10;
    const eixida = text(await inflate(comprimit));
    expect(eixida.length).toBeGreaterThan(0);
    expect(LLARG.startsWith(eixida)).toBe(true);
  });

  test('deflate cru sense capçalera zlib', async () => {
    const inflate = crea();
    expect(text(await inflate(new Uint8Array(deflateRawSync(Buffer.from('BT (Cru) Tj ET')))))).toBe('BT (Cru) Tj ET');
  });

  test('més de 64 MiB: els primers 64 MiB', async () => {
    const inflate = crea();
    const eixida = await inflate(bomba());
    expect(eixida.length).toBe(64 * MIB);
  });

  test('brossa pura: llança; entrada no binària: TypeError', async () => {
    const inflate = crea();
    await expect(inflate(bytes('aixo no es zlib de cap manera'))).rejects.toThrow('inflate: el flux comprimit no es pot llegir.');
    await expect(inflate(new Uint8Array(deflateSync(Buffer.from(LLARG))).subarray(0, 2))).rejects.toThrow();
    await expect(inflate('text')).rejects.toThrow(TypeError);
  });
});

/* ── extreuTextPdf sense DecompressionStream (Safari 16.0–16.3) ───────── */

function pdfAmbFlate(continguts) {
  const latin1 = (s) => Buffer.from(s, 'latin1');
  const kids = continguts.map((_, i) => `${10 + i * 2} 0 R`).join(' ');
  const parts = [
    latin1('%PDF-1.7\n'),
    latin1('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    latin1(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${continguts.length} >>\nendobj\n`),
    latin1('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n')
  ];
  continguts.forEach((contingut, i) => {
    const pagina = 10 + i * 2;
    const dades = deflateSync(latin1(contingut));
    parts.push(latin1(`${pagina} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pagina + 1} 0 R >>\nendobj\n`));
    parts.push(latin1(`${pagina + 1} 0 obj\n<< /Filter /FlateDecode /Length ${dades.length} >>\nstream\n`), dades, latin1('\nendstream\nendobj\n'));
  });
  parts.push(latin1('trailer\n<< /Size 20 /Root 1 0 R >>\n%%EOF\n'));
  return new Uint8Array(Buffer.concat(parts));
}

describe('extreuTextPdf amb inflateDisponible i sense DecompressionStream', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('llig els fluxos /FlateDecode amb el motor pur', async () => {
    vi.stubGlobal('DecompressionStream', undefined);
    expect(inflateNavegador()).toBeNull();
    const linies = Array.from({ length: 60 }, (_, i) => `BT /F1 10 Tf 72 ${780 - i * 12} Td (Concepte ${i}: 1${i},00) Tj ET`).join('\n');
    const doc = pdfAmbFlate(['BT /F1 12 Tf 72 780 Td (Exemple Energia SCCL) Tj 0 -16 Td (Total 121,00 \\200) Tj ET', linies]);
    const r = await extreuTextPdf(doc, { inflate: inflateDisponible() });
    expect(r.avisos).toEqual([]);
    expect(r.pagines[0]).toBe('Exemple Energia SCCL\nTotal 121,00 €');
    expect(r.pagines[1].split('\n')).toHaveLength(60);
    expect(r.pagines[1].startsWith('Concepte 0: 10,00\nConcepte 1: 11,00')).toBe(true);
  });
});
