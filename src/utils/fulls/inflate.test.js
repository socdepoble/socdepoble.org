// @vitest-environment node
/* utils/fulls · inflate: el motor DEFLATE cru en JS pur contrastat amb
   node:zlib (blocs guardats, de Huffman fix i dinàmic), fluxos fets a mà
   per als casos que zlib no escriu, truncats, malmesos i el límit d'eixida
   (bombes de descompressió). Totes les dades són sintètiques. */
import { constants, deflateRawSync, inflateRawSync } from 'node:zlib';
import { describe, expect, test } from 'vitest';
import { ErrorInflate, inflateRawPur } from './inflate.js';

const text = (b) => Buffer.from(b).toString('latin1');
const igual = (a, b) => a.length === b.length && Buffer.from(a.buffer, a.byteOffset, a.length).equals(Buffer.from(b.buffer, b.byteOffset, b.length));
const esPrefix = (prefix, sencer) => prefix.length <= sencer.length && igual(prefix, sencer.subarray(0, prefix.length));
const MIB = 1024 * 1024;

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

/* XML de full inventat, de peces triades a l'atzar amb llavor: s'assembla al que hi ha dins d'un XLSX. */
function xmlSintetic(n, llavor) {
  const peces = ['<row r="3">', '<c r="B3" s="4">', '<v>250</v>', '</c>', '<c r="A3" s="7" t="s">', '<v>12</v>', '<f>SUM(B3:E3)</f>',
    '</row>', '<c r="G3"/>', 'Aigua', 'Cafè', 'MICCIÓ', '0.29166666666666669', '\n', '<mergeCell ref="G3:H3"/>'];
  const seguent = generador(llavor);
  const parts = [];
  let mida = 0;
  while (mida < n) {
    const p = peces[seguent() % peces.length];
    parts.push(p);
    mida += p.length;
  }
  return new Uint8Array(Buffer.from(parts.join(''), 'utf8').subarray(0, n));
}

const ENTRADES = [
  ['buida', new Uint8Array(0)],
  ['un byte', new Uint8Array([0x42])],
  ['XML curt', new Uint8Array(Buffer.from('<sst><si><t>Aigua</t></si></sst>'))],
  ['XML sintètic de 200 KB', xmlSintetic(200000, 11)],
  ['bytes aleatoris (com un PNG)', aleatoris(60000, 5)],
  ['zeros', new Uint8Array(200000)],
  ['els 256 bytes repetits', new Uint8Array(256 * 400).map((_, i) => i & 0xff)],
  ['bloc aleatori repetit lluny (finestra quasi plena)', (() => {
    const b = aleatoris(32000, 9);
    const r = new Uint8Array(96000);
    r.set(b, 0);
    r.set(b, 32000);
    r.set(b, 64000);
    return r;
  })()]
];

const ESTRATEGIES = [
  ['nivell 0 (blocs guardats)', { level: 0 }],
  ['nivell 1', { level: 1 }],
  ['nivell 6', { level: 6 }],
  ['nivell 9', { level: 9 }],
  ['Z_FIXED (Huffman fix)', { strategy: constants.Z_FIXED }],
  ['Z_HUFFMAN_ONLY', { strategy: constants.Z_HUFFMAN_ONLY }],
  ['Z_RLE', { strategy: constants.Z_RLE }],
  ['finestra de 512 bytes i memLevel 1 (blocs curts)', { windowBits: 9, memLevel: 1 }]
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

/* Bloc dinàmic final amb les longituds donades. `cos` escriu les dades amb
   els codis resultants; `simbols` substituïx la codificació de les longituds. */
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

/* ── El mateix resultat que node:zlib ─────────────────────────────────── */

describe('inflateRawPur: el mateix resultat que node:zlib', () => {
  test.each(ESTRATEGIES)('deflateRawSync %s', (_, opcions) => {
    for (const [nom, original] of ENTRADES) {
      const comprimit = new Uint8Array(deflateRawSync(original, opcions));
      const eixida = inflateRawPur(comprimit);
      expect(eixida).toBeInstanceOf(Uint8Array);
      expect(igual(eixida, original), nom).toBe(true);
    }
  });

  test('accepta ArrayBuffer i altres vistes, i ignora el que hi ha darrere del bloc final', () => {
    const original = xmlSintetic(30000, 3);
    const comprimit = new Uint8Array(deflateRawSync(original));
    expect(igual(inflateRawPur(comprimit.slice().buffer), original)).toBe(true);
    expect(igual(inflateRawPur(new DataView(comprimit.buffer)), original)).toBe(true);
    const ambBrossa = new Uint8Array(Buffer.concat([Buffer.from(comprimit), Buffer.from('PK brossa')]));
    expect(igual(inflateRawPur(ambBrossa), original)).toBe(true);
  });

  test('entrada no binària o límit invàlid: TypeError i RangeError', () => {
    expect(() => inflateRawPur('text')).toThrow(TypeError);
    expect(() => inflateRawPur(null)).toThrow(TypeError);
    const buit = new Uint8Array(deflateRawSync(Buffer.alloc(0)));
    for (const maxEixida of [-1, Number.NaN, '10', null]) {
      expect(() => inflateRawPur(buit, { maxEixida })).toThrow(RangeError);
    }
  });
});

describe('inflateRawPur: fluxos fets a mà', () => {
  test('bloc guardat (STORE) i després un de Huffman fix', () => {
    const e = escriptorBits();
    guardat(e, Buffer.from('Aigua '), 0);
    e.bits(1, 1);
    e.bits(1, 2);
    for (const c of 'Cafè') fix(e, c.charCodeAt(0));
    fix(e, 256);
    expect(text(comparaAmbNode(e.fi()))).toBe('Aigua Cafè');
  });

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
    const eixida = comparaAmbNode(e.fi());
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
  ])('bloc dinàmic invàlid: %s', (_, definicio) => {
    const e = escriptorBits();
    dinamic(e, { ...definicio, cos: ({ lit }) => lit(65) });
    expect(comparaAmbNode(e.fi()).codi).toBe('corrupte');
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
  ])('flux malmés: %s', (_, escriu) => {
    const e = escriptorBits();
    escriu(e);
    const error = comparaAmbNode(e.fi());
    expect(error.codi).toBe('corrupte');
    expect(error.name).toBe('ErrorInflate');
    expect(error.message).toMatch(/^inflate: /);
  });

  test('l’error porta el que ja s’havia descomprimit', () => {
    const e = escriptorBits();
    e.bits(1, 1);
    e.bits(1, 2);
    for (const c of 'Resum') fix(e, c.charCodeAt(0));
    fix(e, 287);
    const error = errorDe(() => inflateRawPur(e.fi()));
    expect(error.codi).toBe('corrupte');
    expect(text(error.parcial)).toBe('Resum');
  });
});

describe('inflateRawPur: fluxos truncats', () => {
  test.each([
    ['Huffman dinàmic', { level: 6 }],
    ['Huffman fix', { strategy: constants.Z_FIXED }],
    ['blocs guardats', { level: 0 }]
  ])('qualsevol tall (%s): truncat, amb un prefix del contingut', (_, opcions) => {
    const original = xmlSintetic(3000, 17);
    const comprimit = new Uint8Array(deflateRawSync(original, opcions));
    let ambDades = 0;
    for (let tall = 0; tall < comprimit.length; tall += 1) {
      const error = errorDe(() => inflateRawPur(comprimit.subarray(0, tall)));
      expect(error.codi, `tall ${tall}`).toBe('truncat');
      expect(esPrefix(error.parcial, original), `tall ${tall}`).toBe(true);
      if (error.parcial.length > 0) ambDades += 1;
    }
    expect(ambDades).toBeGreaterThan(comprimit.length / 2);
  });
});

describe('inflateRawPur: límit d’eixida (bombes)', () => {
  test('per defecte, 64 MiB: llança «limit» amb els primers 64 MiB', () => {
    const bomba = new Uint8Array(deflateRawSync(Buffer.alloc(65 * MIB), { level: 1 }));
    expect(bomba.length).toBeLessThan(MIB);
    const error = errorDe(() => inflateRawPur(bomba));
    expect(error.codi).toBe('limit');
    expect(error.parcial.length).toBe(64 * MIB);
  });

  test('límit a mida: exacte, d’un byte de menys i zero', () => {
    const original = xmlSintetic(100000, 5);
    for (const opcions of [{ level: 6 }, { level: 0 }]) {
      const comprimit = new Uint8Array(deflateRawSync(original, opcions));
      expect(igual(inflateRawPur(comprimit, { maxEixida: original.length }), original)).toBe(true);
      const error = errorDe(() => inflateRawPur(comprimit, { maxEixida: original.length - 1 }));
      expect(error.codi).toBe('limit');
      expect(igual(error.parcial, original.subarray(0, original.length - 1))).toBe(true);
    }
    expect(inflateRawPur(new Uint8Array(deflateRawSync(Buffer.alloc(0))), { maxEixida: 0 }).length).toBe(0);
    expect(errorDe(() => inflateRawPur(new Uint8Array(deflateRawSync(Buffer.from('x'))), { maxEixida: 0 })).codi).toBe('limit');
  });
});

describe('inflateRawPur: corrupció aleatòria, sempre d’acord amb zlib', () => {
  test('bytes canviats: o el mateix resultat que zlib o un ErrorInflate', () => {
    const seguent = generador(2026);
    const fonts = [
      new Uint8Array(deflateRawSync(xmlSintetic(6000, 1))),
      new Uint8Array(deflateRawSync(xmlSintetic(6000, 2), { strategy: constants.Z_FIXED })),
      new Uint8Array(deflateRawSync(xmlSintetic(8000, 4), { level: 9 }))
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
  });

  test('bytes aleatoris: mai una excepció que no siga ErrorInflate', () => {
    let errors = 0;
    for (let llavor = 1; llavor <= 300; llavor += 1) {
      if (comparaAmbNode(aleatoris(64 + llavor, llavor)) instanceof ErrorInflate) errors += 1;
    }
    expect(errors).toBeGreaterThan(250);
  });
});
