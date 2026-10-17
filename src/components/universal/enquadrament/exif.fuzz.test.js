import { describe, expect, test } from 'vitest';
import { MAX_BYTES_EXIF, llegixExif, llegixMetadadesImatge, teExif } from './exif.js';
import { IMATGE, SOI, TIPUS, app1Exif, concatena, dataOriginal, gpsTorre, jpegAmbExif, orientacio, segment, tiff } from './jpegProva.js';

/* Onada 4 · revisió adversarial (K5) · Fuzz DETERMINISTA del lector d'EXIF.
   Milers de JPEG mutats a partir de dos mostres vàlides (II i MM) amb un
   generador amb llavor fixa: el mateix número de cas reproduïx sempre el
   mateix buffer. La llei de exif.js: no llança mai, acaba de seguida i només
   torna valors dins de rang. */

/* mulberry32: 32 bits d'estat, prou per a no repetir-se en uns milers de casos. */
function generador(llavor) {
  let a = llavor >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOSTRES = Object.freeze([
  jpegAmbExif({
    ordre: 'II', ifd0: [orientacio(6)], exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre(),
  }),
  jpegAmbExif({
    ordre: 'MM', ifd0: [orientacio(3)], exif: dataOriginal('2020:01:02 03:04:05'),
    gps: gpsTorre({ latRef: 'S', lngRef: 'E', altRef: 1 }),
  }),
]);

/* Valors «d'abisme» per a camps de 16 i 32 bits: zeros, uns, màxims, el
   desplaçament de l'IFD0 i la mida del buffer (punters que toquen la vora). */
const EXTREMS = Object.freeze([0, 1, 2, 7, 8, 12, 42, 0x7f, 0x80, 0xff, 0x100, 0x7fff, 0xffff, 0x10000, 0x7fffffff, 0xffffffff]);

function muta(original, aleatori, donant) {
  let b = Uint8Array.from(original);
  const posicio = () => Math.floor(aleatori() * Math.max(1, b.length));
  const tria = (llista) => llista[Math.floor(aleatori() * llista.length)];
  const passos = 1 + Math.floor(aleatori() * 6);
  for (let i = 0; i < passos && b.length > 0; i += 1) {
    const operacio = Math.floor(aleatori() * 8);
    const p = posicio();
    if (operacio === 0) {
      b[p] ^= 1 + Math.floor(aleatori() * 255);
    } else if (operacio === 1) {
      b[p] = tria([0x00, 0xff, 0x01, 0x7f, 0x80, Math.floor(aleatori() * 256)]);
    } else if (operacio === 2 && p + 2 <= b.length) {
      new DataView(b.buffer).setUint16(p, tria(EXTREMS) & 0xffff, aleatori() < 0.5);
    } else if (operacio === 3 && p + 4 <= b.length) {
      const valor = aleatori() < 0.2 ? b.length + Math.floor(aleatori() * 8) - 4 : tria(EXTREMS);
      new DataView(b.buffer).setUint32(p, valor >>> 0, aleatori() < 0.5);
    } else if (operacio === 4) {
      b = b.slice(0, p);
    } else if (operacio === 5) {
      const n = 1 + Math.floor(aleatori() * 16);
      const nous = Uint8Array.from({ length: n }, () => Math.floor(aleatori() * 256));
      b = concatena(b.slice(0, p), nous, b.slice(p));
    } else if (operacio === 6) {
      const fi = Math.min(b.length, p + 1 + Math.floor(aleatori() * 32));
      b = concatena(b.slice(0, fi), b.slice(p, fi), b.slice(fi));
    } else {
      // Un tros de l'altra mostra (l'altre ordre de bytes) empeltat ací.
      const q = Math.floor(aleatori() * donant.length);
      const tros = donant.slice(q, q + 1 + Math.floor(aleatori() * 24));
      b = concatena(b.slice(0, p), tros, b.slice(p + tros.length));
    }
  }
  return b;
}

const DATA_ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d([+-](0\d|1[0-4]):[0-5]\d)?$/;
/** El dia existix en eixe mes (cap 31 de febrer). */
const diaDelCalendari = (text) => {
  const [a, m, d] = text.slice(0, 10).split('-').map(Number);
  const data = new Date(Date.UTC(2000, m - 1, d));
  data.setUTCFullYear(a);
  return data.getUTCMonth() === m - 1 && data.getUTCDate() === d;
};

/** Torna el motiu pel qual el resultat no és vàlid, o null. */
function motiuInvalid(r) {
  if (!r || typeof r !== 'object') return 'no és un objecte';
  const claus = Object.keys(r).sort().join(',');
  if (claus !== 'dataCaptura,gps,orientacio') return `claus ${claus}`;
  if (r.orientacio !== null && !(Number.isInteger(r.orientacio) && r.orientacio >= 1 && r.orientacio <= 8)) {
    return `orientació ${r.orientacio}`;
  }
  if (r.gps !== null) {
    const { lat, lng, altitud } = r.gps;
    if (Object.keys(r.gps).sort().join(',') !== 'altitud,lat,lng') return 'forma del GPS';
    if (!Number.isFinite(lat) || Math.abs(lat) > 90) return `latitud ${lat}`;
    if (!Number.isFinite(lng) || Math.abs(lng) > 180) return `longitud ${lng}`;
    if (lat === 0 && lng === 0) return 'GPS 0/0';
    if (altitud !== null && !Number.isFinite(altitud)) return `altitud ${altitud}`;
  }
  if (r.dataCaptura !== null
    && !(typeof r.dataCaptura === 'string' && DATA_ISO.test(r.dataCaptura) && diaDelCalendari(r.dataCaptura))) {
    return `data ${r.dataCaptura}`;
  }
  return null;
}

describe('K5 · fuzz determinista de llegixExif', () => {
  test('les dues mostres de partida són vàlides i completes', () => {
    for (const mostra of MOSTRES) {
      const r = llegixExif(mostra);
      expect(motiuInvalid(r)).toBeNull();
      expect(r.gps).not.toBeNull();
      expect(r.dataCaptura).not.toBeNull();
    }
  });

  test('6.000 buffers mutats (II i MM): cap excepció, cap valor fora de rang i cap crida lenta', () => {
    const CASOS = 6000;
    const aleatori = generador(0x5dc0de);
    const fallades = [];
    const recompte = { gps: 0, data: 0, orientacio: 0, buit: 0 };
    let pitjor = 0;
    const inici = performance.now();
    for (let cas = 0; cas < CASOS; cas += 1) {
      const mostra = MOSTRES[cas % 2];
      const bytes = muta(mostra, aleatori, MOSTRES[(cas + 1) % 2]);
      const t0 = performance.now();
      let r;
      let teLaMarca;
      try {
        r = llegixExif(cas % 3 === 0 ? bytes.buffer : bytes);
        teLaMarca = teExif(bytes);
      } catch (err) {
        fallades.push({ cas, motiu: `ha llançat: ${err?.message}` });
        continue;
      }
      pitjor = Math.max(pitjor, performance.now() - t0);
      const motiu = motiuInvalid(r) || (typeof teLaMarca === 'boolean' ? null : 'teExif no torna booleà');
      if (motiu) fallades.push({ cas, motiu });
      if (r.gps) recompte.gps += 1;
      if (r.dataCaptura) recompte.data += 1;
      if (r.orientacio) recompte.orientacio += 1;
      if (!r.gps && !r.dataCaptura && !r.orientacio) recompte.buit += 1;
    }
    const total = performance.now() - inici;
    expect(fallades.slice(0, 5)).toEqual([]);
    // El fuzz no és trivial: una part dels mutants encara es llig sencera i una altra no.
    expect(recompte.gps).toBeGreaterThan(CASOS * 0.05);
    expect(recompte.data).toBeGreaterThan(CASOS * 0.05);
    expect(recompte.buit).toBeGreaterThan(CASOS * 0.05);
    /* Acaba de seguida: cada crida és fitada (64 segments, 512 entrades, 64
       caràcters). Llindars amples a propòsit: una pausa del recol·lector en una
       màquina carregada no ha de fer roja la prova; un bucle sense fi, sí. */
    expect(pitjor).toBeLessThan(250);
    expect(total).toBeLessThan(5000);
  });

  test('pitjors casos construïts: farciment infinit, 200 segments abans de l’APP1, IFD de 512 entrades i un buffer de 30 MB', () => {
    const t0 = performance.now();
    // 300.000 bytes de farciment 0xFF: la cerca para als 64 passos o als 256 KB.
    const farciment = concatena(SOI, new Uint8Array(300000).fill(0xff), app1Exif(tiff({ gps: gpsTorre() })), IMATGE);
    expect(llegixExif(farciment).gps).toBeNull();
    // 200 APP2 abans de l'APP1: més enllà dels 64 segments, «sense dades».
    const app2 = segment(0xe2, new Uint8Array(8));
    const molts = concatena(SOI, ...Array.from({ length: 200 }, () => app2), app1Exif(tiff({ gps: gpsTorre() })), IMATGE);
    expect(llegixExif(molts)).toEqual({ orientacio: null, gps: null, dataCaptura: null });
    // Un IFD0 amb 512 entrades ASCII de 64 caràcters: es recorre una vegada i prou.
    const entrades = Array.from({ length: 511 }, (_, i) => ({ tag: 0x1000 + i, tipus: TIPUS.ASCII, valors: 'x'.repeat(63) }));
    const ple = jpegAmbExif({ ifd0: [orientacio(8), ...entrades] });
    expect(llegixExif(ple).orientacio).toBe(8);
    // 30 MB: només es miren els primers MAX_BYTES_EXIF.
    const enorme = new Uint8Array(30 * 1024 * 1024);
    enorme.set(SOI, 0);
    enorme.fill(0xff, 2, MAX_BYTES_EXIF + 1024);
    expect(llegixExif(enorme)).toEqual({ orientacio: null, gps: null, dataCaptura: null });
    expect(performance.now() - t0).toBeLessThan(3000);
  });

  test('vores trobades per la revisió: un GPS de mil·lèsimes de micra no es torna en 0/0 i una data impossible no és cap data', () => {
    // 1e-9 graus: diferent de 0/0 abans d'arrodonir, exactament 0/0 després.
    const quasiZero = [[1, 1000000000], [0, 1], [0, 1]];
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre({ lat: quasiZero, lng: quasiZero }) })).gps).toBeNull();
    // Un sol eix a prop de 0 sí que és un lloc (l'equador o el meridià).
    const meridia = llegixExif(jpegAmbExif({ gps: gpsTorre({ lng: quasiZero }) })).gps;
    expect(meridia.lat).toBe(38.5919);
    expect(Math.abs(meridia.lng)).toBe(0);
    for (const data of ['2017:02:31 10:22:33', '2017:02:29 10:22:33', '2017:04:31 10:22:33', '1900:02:29 00:00:00']) {
      expect(llegixExif(jpegAmbExif({ exif: dataOriginal(data) })).dataCaptura).toBeNull();
    }
    expect(llegixExif(jpegAmbExif({ exif: dataOriginal('2020:02:29 23:59:59') })).dataCaptura).toBe('2020-02-29T23:59:59');
    expect(llegixExif(jpegAmbExif({ exif: dataOriginal('2000:02:29 00:00:00') })).dataCaptura).toBe('2000-02-29T00:00:00');
  });

  test('llegixMetadadesImatge amb Blobs mutats: mai rebutja i torna la mateixa forma', async () => {
    const aleatori = generador(0xb10b);
    for (let cas = 0; cas < 200; cas += 1) {
      const bytes = muta(MOSTRES[cas % 2], aleatori, MOSTRES[(cas + 1) % 2]);
      const r = await llegixMetadadesImatge(new Blob([bytes], { type: 'image/jpeg' }));
      expect(motiuInvalid(r)).toBeNull();
    }
  });
});

/* Onada 0.3 (Gauntlet 261016) · L'opció ambCamera (Make, Model, Artist i
   Copyright) sota el mateix fuzz: mai llança, la forma és la de les sis claus
   i cada text és ASCII imprimible, net i fitat. Sense l'opció, els mateixos
   mutants continuen tornant les tres claus de sempre. */
const ascii = (tag, valors) => ({ tag, tipus: TIPUS.ASCII, valors });
const MOSTRES_CAMERA = Object.freeze([
  jpegAmbExif({
    ordre: 'II', ifd0: [orientacio(6), ascii(0x010f, 'Canon'), ascii(0x0110, 'Canon EOS 5D'), ascii(0x013b, 'Pepa'), ascii(0x8298, '(c) Pepa')],
    exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre(),
  }),
  jpegAmbExif({
    ordre: 'MM', ifd0: [orientacio(3), ascii(0x010f, 'SONY  '), ascii(0x0110, 'DSC-RX100'), ascii(0x8298, 'Sóc de Poble\0IAIA')],
    exif: dataOriginal('2020:01:02 03:04:05'), gps: gpsTorre({ latRef: 'S', lngRef: 'E', altRef: 1 }),
  }),
]);

const textValid = (s) => s === null || (typeof s === 'string' && s.length > 0 && s.length <= 256 && s === s.trim() && /^[\x20-\x7e]+$/.test(s));

function motiuInvalidAmbCamera(r) {
  if (!r || typeof r !== 'object') return 'no és un objecte';
  const claus = Object.keys(r).sort().join(',');
  if (claus !== 'autor,camera,copyright,dataCaptura,gps,orientacio') return `claus ${claus}`;
  const { camera, autor, copyright, ...resta } = r;
  const base = motiuInvalid(resta);
  if (base) return base;
  if (camera !== null) {
    if (Object.keys(camera).sort().join(',') !== 'marca,model') return 'forma de la càmera';
    if (!textValid(camera.marca) || !textValid(camera.model)) return `càmera ${JSON.stringify(camera)}`;
    if (camera.marca === null && camera.model === null) return 'càmera buida';
  }
  if (!textValid(autor)) return `autor ${autor}`;
  if (!textValid(copyright)) return `drets ${copyright}`;
  return null;
}

describe('Onada 0.3 · fuzz determinista de llegixExif amb ambCamera', () => {
  test('les mostres de partida es lligen senceres', () => {
    expect(llegixExif(MOSTRES_CAMERA[0], { ambCamera: true })).toMatchObject({
      camera: { marca: 'Canon', model: 'Canon EOS 5D' }, autor: 'Pepa', copyright: '(c) Pepa'
    });
    /* El Copyright amb un caràcter que no és ASCII (la «ó») no es torna: mai s'inventa. */
    expect(llegixExif(MOSTRES_CAMERA[1], { ambCamera: true })).toMatchObject({
      camera: { marca: 'SONY', model: 'DSC-RX100' }, autor: null, copyright: null
    });
  });

  test('3.000 buffers mutats: cap excepció, la forma de les sis claus, i sense l’opció, la de sempre', () => {
    const CASOS = 3000;
    const aleatori = generador(0xca3e7a);
    const fallades = [];
    let ambCamera = 0;
    const inici = performance.now();
    for (let cas = 0; cas < CASOS; cas += 1) {
      const bytes = muta(MOSTRES_CAMERA[cas % 2], aleatori, MOSTRES_CAMERA[(cas + 1) % 2]);
      let r;
      let perDefecte;
      try {
        r = llegixExif(cas % 3 === 0 ? bytes.buffer : bytes, { ambCamera: true });
        perDefecte = llegixExif(bytes);
      } catch (err) {
        fallades.push({ cas, motiu: `ha llançat: ${err?.message}` });
        continue;
      }
      const motiu = motiuInvalidAmbCamera(r) || motiuInvalid(perDefecte);
      if (motiu) fallades.push({ cas, motiu });
      if (r.camera) ambCamera += 1;
    }
    expect(fallades.slice(0, 5)).toEqual([]);
    // No és trivial: una part dels mutants encara porta la càmera.
    expect(ambCamera).toBeGreaterThan(CASOS * 0.05);
    expect(performance.now() - inici).toBeLessThan(5000);
  });
});
