import { afterEach, describe, expect, test, vi } from 'vitest';

/* jsdom no codifica: fotoDinsDelPressupost rep un compressImage simulat. */
const dobles = vi.hoisted(() => ({ compressImage: vi.fn() }));
vi.mock('./imageUtils.js', () => ({ compressImage: dobles.compressImage }));

import {
  AVISOS_DE_LA_FOTO, ERROR_EXIF_NO_CONSERVABLE, ERROR_EXIF_NO_CONSERVABLE_CAMERA, ERROR_PRESSUPOST, ERROR_PRESSUPOST_EXIF,
  ERROR_PRESSUPOST_EXIF_CAMERA, MAX_CODIFICACIONS, MIDA_AVATAR, MIDA_CAPCALERA, MIDA_LOGOTIP, PRESSUPOST_PUJADA,
  QUALITATS_DE_LA_CERCA, QUALITAT_MAXIMA, QUALITAT_MINIMA,
  bytesDeDataUrl, esAvisDeLaFoto, fitxerDeDataUrl, fotoDinsDelPressupost, tipusReal,
} from './pujadaImatge.js';
import {
  APP0_JFIF, IMATGE, SOI, TIPUS, concatena, dataOriginal, gpsTorre, jpegAmbExif, tiff,
} from '../components/universal/enquadrament/jpegProva.js';
import {
  ETIQUETA_CONSERVA_CAMERA, ETIQUETA_CONSERVA_EXIF, ambExifDeLoriginal, exifPublicable, extreuTiff, preparaTiff,
} from '../components/universal/enquadrament/exifIncrustat.js';

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La font única de les mides i
   el fitxer que ix de la compressió, amb el tipus REAL. jsdom no codifica:
   els bytes de cada format són les seues firmes, que és el que llig
   formatImatge (netejaMetadades.js). */

const PNG = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52);
const WEBP = Uint8Array.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ', (c) => c.charCodeAt(0));
const JPEG = concatena(SOI, APP0_JFIF, IMATGE);
const dataUrl = (tipus, bytes) => `data:${tipus};base64,${btoa(String.fromCharCode(...bytes))}`;

/* Un fetch que torna els bytes de veres del data URL, amb el tipus de la seua capçalera. */
function fetchDeVeres() {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const coma = url.indexOf(',');
    const tipus = /^data:([^;,]*)/.exec(url)?.[1] || '';
    const bytes = Uint8Array.from(atob(url.slice(coma + 1)), (c) => c.charCodeAt(0));
    return { blob: async () => new Blob([bytes], { type: tipus }) };
  }));
}
const bytesDe = (blob) => new Promise((resol, rebutja) => {
  const lector = new FileReader();
  lector.onload = () => resol(new Uint8Array(lector.result));
  lector.onerror = () => rebutja(lector.error);
  lector.readAsArrayBuffer(blob);
});

afterEach(() => {
  dobles.compressImage.mockReset();
  vi.unstubAllGlobals();
});

describe('les mides de la Llei del Quadrat', () => {
  /* Gauntlet 261016 (Bloc 1) · Abans esta prova fixava 81.920 bytes (80 KiB).
     L'ordre diu «<80 KB» i l'auditoria (Codex, 01:31) ho llig en decimal:
     80.000 bytes, i la comparació és estricta. */
  test('avatar 400, logotip 600 (dos constants, ja no una), capçalera i targeta 1.200, pressupost de 80.000 bytes', () => {
    expect([MIDA_AVATAR, MIDA_LOGOTIP, MIDA_CAPCALERA, PRESSUPOST_PUJADA]).toEqual([400, 600, 1200, 80000]);
    expect(MIDA_AVATAR).not.toBe(MIDA_LOGOTIP);
  });

  /* Gauntlet 261016 (P1 de l'auditoria adversarial) · Abans esta prova fixava
     l'escala QUALITATS_PRESSUPOST (0,8 → 0,4, en este ordre), que amb els
     codificadors de veres deixava fora la meitat de les fotos del poble. Ara
     la qualitat es busca en una reixa: els múltiples de 0,04 de 0,04 al
     sostre de sempre, 0,8, amb totes les qualitats d'abans dins. */
  test('la reixa de la cerca: de 0,04 a 0,8 de 0,04 en 0,04, amb l’escala d’abans dins, i no es pot tocar', () => {
    expect([QUALITAT_MINIMA, QUALITAT_MAXIMA, MAX_CODIFICACIONS]).toEqual([0.04, 0.8, 7]);
    expect(QUALITATS_DE_LA_CERCA).toEqual([
      0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.76, 0.8,
    ]);
    expect([QUALITATS_DE_LA_CERCA[0], QUALITATS_DE_LA_CERCA.at(-1)]).toEqual([QUALITAT_MINIMA, QUALITAT_MAXIMA]);
    for (const abans of [0.8, 0.72, 0.64, 0.56, 0.48, 0.4]) expect(QUALITATS_DE_LA_CERCA).toContain(abans);
    expect(Object.isFrozen(QUALITATS_DE_LA_CERCA)).toBe(true);
  });
});

describe('bytesDeDataUrl · el pes d’un data URL sense descodificar-lo', () => {
  test.each([
    ['sense farciment', dataUrl('image/png', PNG.slice(0, 15)), 15],
    ['amb un = de farciment', dataUrl('image/png', PNG.slice(0, 14)), 14],
    ['amb == de farciment', dataUrl('image/png', PNG.slice(0, 13)), 13],
    ['un JPEG', dataUrl('image/jpeg', JPEG), JPEG.length],
  ])('%s', (_cas, url, bytes) => {
    expect(bytesDeDataUrl(url)).toBe(bytes);
  });

  test('el que no es pot mesurar no cap enlloc: Infinity', () => {
    for (const url of [null, undefined, 42, '', 'sense coma', 'data:image/png,xyz']) {
      expect(bytesDeDataUrl(url), String(url)).toBe(Number.POSITIVE_INFINITY);
    }
  });
});

/* ── Gauntlet 261016 (Bloc 1, Llei del Quadrat) · fotoDinsDelPressupost ──
   Un codificador simulat torna els bytes de cada format (la firma) fins al pes
   que se li diu per a cada qualitat: així es llig el tipus real i el pes que
   pujaria.
   Gauntlet 261016 (P1 de l'auditoria adversarial) · El pes és una funció de
   la qualitat (abans, una taula amb 1.000 B per a la resta): la cerca prova
   qualitats de tota la reixa, cap amunt i cap avall, i el pes ha de baixar amb
   la qualitat, com en un codificador de veres. Les proves que fixaven l'escala
   d'abans (0,8, 0,72, 0,64…, sis intents) ara fixen la cerca. */
const ambPes = (bytes, pes) => {
  const tot = new Uint8Array(pes);
  tot.set(bytes.slice(0, pes));
  return tot;
};
const urlDe = (tipus, bytes) => `data:${tipus};base64,${btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))}`;
/** Un codificador: `pes(qualitat)` diu quants bytes fa; `sapWebp` false fa de Safari 16 (PNG en lloc de WebP). */
function codificador(pes, { sapWebp = true } = {}) {
  return async (_fitxer, { format, quality }) => {
    const bytes = pes(quality);
    if (format === 'image/jpeg') return urlDe('image/jpeg', ambPes(JPEG, bytes));
    return sapWebp ? urlDe('image/webp', ambPes(WEBP, bytes)) : urlDe('image/png', ambPes(PNG, bytes * 6));
  };
}
/** Un pes que no depén de la qualitat. */
const sempre = (bytes) => () => bytes;
/** Un pes que creix en línia recta amb la qualitat: `aUn` bytes a qualitat 1. */
const lineal = (aUn) => (q) => Math.round(aUn * q);
const crides = () => dobles.compressImage.mock.calls.map(([, o]) => [o.maxSize, o.format, o.quality]);
const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

describe('fotoDinsDelPressupost · la mida fixa, la qualitat més alta que hi cap i menys de 80.000 bytes', () => {
  test('el sostre, si hi cap: un sol intent, el de sempre (0,8)', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(sempre(79000)));
    const { fitxer } = await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage' });
    expect(crides()).toEqual([[1200, 'image/webp', 0.8]]);
    expect([fitxer.name, fitxer.type, fitxer.size]).toEqual(['heroImage.webp', 'image/webp', 79000]);
  });

  test('si no, la qualitat MÉS ALTA que hi cap, a la MATEIXA mida, i el File del tipus real: el millor intent, sense tornar a codificar', async () => {
    fetchDeVeres();
    // 115.200 B a qualitat 1: hi cap per davall de 0,694; la més alta de la reixa és 0,68 (78.336 B).
    dobles.compressImage.mockImplementation(codificador(lineal(115200)));
    const { dataUrl, fitxer } = await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage' });
    expect(crides()).toEqual([0.8, 0.4, 0.6, 0.68, 0.72].map((q) => [1200, 'image/webp', q]));
    expect([fitxer.name, fitxer.type, fitxer.size]).toEqual(['heroImage.webp', 'image/webp', 78336]);
    expect(dataUrl).toBe(await dobles.compressImage.mock.results[3].value);
  });

  test('estricte: 80.000 bytes exactes no hi caben; 79.999 sí', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador((q) => (q === QUALITAT_MAXIMA ? 80000 : 79999)));
    const { fitxer } = await fotoDinsDelPressupost(foto(), { mida: 400, nom: 'avatar' });
    expect(crides()).toEqual([0.8, 0.4, 0.6, 0.68, 0.72, 0.76].map((q) => [400, 'image/webp', q]));
    expect(fitxer.size).toBe(79999);
  });

  test('si ni la qualitat mínima hi cap: ERROR_PRESSUPOST, després de la cerca a la mateixa mida, que acaba a QUALITAT_MINIMA', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(sempre(90000)));
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage' })).rejects.toThrow(ERROR_PRESSUPOST);
    expect(crides()).toEqual([0.8, 0.4, 0.2, 0.08, 0.04].map((q) => [1200, 'image/webp', q]));
    expect(crides().at(-1)[2]).toBe(QUALITAT_MINIMA);
    expect(ERROR_PRESSUPOST).toBe('La imatge pesa massa fins i tot comprimida; prova amb una altra foto.');
  });

  test('Safari 16 (sense WebP en canvas): es torna a demanar JPEG, i des d’eixe intent ja no es demana WebP', async () => {
    fetchDeVeres();
    // 100.000 B a qualitat 1: el JPEG de 0,8 en fa 80.000 (no hi cap) i el de 0,76, 76.000. És el pitjor cas: set codificacions.
    dobles.compressImage.mockImplementation(codificador(lineal(100000), { sapWebp: false }));
    const { fitxer } = await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage' });
    expect(crides()).toEqual([
      [1200, 'image/webp', 0.8], ...[0.8, 0.4, 0.6, 0.68, 0.72, 0.76].map((q) => [1200, 'image/jpeg', q]),
    ]);
    expect(crides()).toHaveLength(MAX_CODIFICACIONS);
    expect([fitxer.name, fitxer.type, fitxer.size]).toEqual(['heroImage.jpg', 'image/jpeg', 76000]);
  });

  test('sense fitxer (per a desar el data URL): es mesura el data URL i no es fa cap fetch', async () => {
    vi.stubGlobal('fetch', vi.fn());
    dobles.compressImage.mockImplementation(codificador((q) => (q === QUALITAT_MAXIMA ? 120000 : 60000)));
    const { dataUrl, fitxer } = await fotoDinsDelPressupost(foto(), { mida: 1200, ambFitxer: false });
    expect(fitxer).toBeNull();
    expect(bytesDeDataUrl(dataUrl)).toBe(60000);
    expect(crides()).toEqual([0.8, 0.4, 0.6, 0.68, 0.72, 0.76].map((q) => [1200, 'image/webp', q]));
    expect(fetch).not.toHaveBeenCalled();
  });
});

/* ── Gauntlet 261016 (P1 de l'auditoria adversarial) · La cerca de la qualitat
   amb les corbes dels codificadors de veres ──
   Abans la qualitat baixava per una escala fixa, de 0,8 a 0,4, i les proves
   només tenien codificadors que tornaven el pes que se'ls demanava. Les corbes
   d'ací són les mesures de Claude (Gauntlet 261016) amb el codificador de
   Chromium (canvas.toDataURL) sobre fotos del repo retallades al centre a
   1.200 × 1.200, en bytes per qualitat. Entre dues mesures, la recta; per
   davall de 0,15 (sense mesura), el pes de 0,15, el cas pitjor; per damunt de
   la darrera, el pendent del darrer tram (una cota baixa: la corba de veres
   puja més de pressa). Amb l'escala d'abans, DSC00410 i P_20161028 no hi
   cabien ni en WebP, i en JPEG (tot Apple: WebKit no codifica WebP al canvas)
   només DSC00320, a 0,4. */
const CORBES_MESURADES = Object.freeze({
  'DSC00320.JPG': {
    'image/jpeg': [[0.15, 30786], [0.2, 39150], [0.3, 54468], [0.4, 68808], [0.6, 100203], [0.8, 168753]],
    'image/webp': [[0.15, 23052], [0.2, 26256], [0.3, 31920], [0.4, 39237], [0.6, 56196], [0.8, 95145]],
  },
  'DSC00410.JPG': {
    'image/jpeg': [[0.15, 49887], [0.2, 63159], [0.3, 87270], [0.4, 106995], [0.6, 146376], [0.8, 231942]],
    'image/webp': [[0.15, 45672], [0.2, 54345], [0.3, 71073], [0.4, 90315], [0.6, 123663], [0.8, 186027]],
  },
  'DSC01197.JPG': {
    'image/jpeg': [[0.15, 67233], [0.2, 80649], [0.3, 103536], [0.4, 122097]],
    'image/webp': [[0.15, 51588], [0.2, 56688], [0.3, 67314], [0.4, 77457]],
  },
  'P_20161028_150735.jpg': {
    'image/jpeg': [[0.15, 54624], [0.2, 67743], [0.3, 91848], [0.4, 112419]],
    'image/webp': [[0.15, 52959], [0.2, 60951], [0.3, 75357], [0.4, 91236]],
  },
});
/** El pes d'una corba mesurada (`punts`, de la qualitat més baixa a la més alta) a la qualitat `q`. */
function pesDeCorba(punts, q) {
  if (q <= punts[0][0]) return punts[0][1];
  const i = punts.findIndex(([qp]) => qp >= q);
  const [[q0, p0], [q1, p1]] = i < 0 ? punts.slice(-2) : [punts[i - 1], punts[i]];
  return Math.round(p0 + ((q - q0) * (p1 - p0)) / (q1 - q0));
}
/** El codificador amb les corbes de veres; `sapWebp` false fa de WebKit (un PNG, que no ha de pujar mai, en lloc de WebP). */
function codificadorMesurat(corbes, { sapWebp = true } = {}) {
  return async (_fitxer, { format, quality }) => {
    if (format === 'image/jpeg') return urlDe('image/jpeg', ambPes(JPEG, pesDeCorba(corbes['image/jpeg'], quality)));
    return sapWebp ? urlDe('image/webp', ambPes(WEBP, pesDeCorba(corbes['image/webp'], quality))) : urlDe('image/png', PNG);
  };
}
/** L'oracle, sense cerca: la qualitat més alta de la reixa que hi cap, mirant-les totes. */
const mesAltaQueHiCap = (pes) => [...QUALITATS_DE_LA_CERCA].reverse().find((q) => pes(q) < PRESSUPOST_PUJADA);
/** La qualitat de la crida que va fer el data URL que torna (l'última, si n'hi ha de bessones). */
async function qualitatDelResultat(dataUrl) {
  const fets = await Promise.all(dobles.compressImage.mock.results.map((r) => r.value));
  return dobles.compressImage.mock.calls[fets.lastIndexOf(dataUrl)][1].quality;
}

describe('fotoDinsDelPressupost · la qualitat MÉS ALTA que hi cap, amb les corbes dels codificadors de veres', () => {
  const casos = Object.keys(CORBES_MESURADES).flatMap((nomFoto) => [
    [nomFoto, 'WebP (Chromium)', true],
    [nomFoto, 'JPEG (WebKit: iPhone i Safari)', false],
  ]);
  test.each(casos)('%s en %s: hi cap, a 1.200 × 1.200, amb la qualitat més alta de la reixa', async (nomFoto, _motor, sapWebp) => {
    fetchDeVeres();
    const corbes = CORBES_MESURADES[nomFoto];
    dobles.compressImage.mockImplementation(codificadorMesurat(corbes, { sapWebp }));
    const { dataUrl, fitxer } = await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage' });
    const format = sapWebp ? 'image/webp' : 'image/jpeg';
    const esperada = mesAltaQueHiCap((q) => pesDeCorba(corbes[format], q));
    expect(esperada).toBeGreaterThanOrEqual(QUALITAT_MINIMA);
    expect(await qualitatDelResultat(dataUrl)).toBe(esperada);
    expect([fitxer.type, fitxer.size]).toEqual([format, pesDeCorba(corbes[format], esperada)]);
    expect(fitxer.size).toBeLessThan(PRESSUPOST_PUJADA);
    expect(crides().length).toBeLessThanOrEqual(MAX_CODIFICACIONS);
    expect(crides().every(([m]) => m === 1200)).toBe(true);
  });

  test('DSC00410 en JPEG (un iPhone): abans, ERROR_PRESSUPOST a 0,4; ara puja a 0,24 (72.803 B), en sis codificacions', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificadorMesurat(CORBES_MESURADES['DSC00410.JPG'], { sapWebp: false }));
    const { fitxer } = await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage' });
    expect(crides()).toEqual([
      [1200, 'image/webp', 0.8], [1200, 'image/jpeg', 0.8], [1200, 'image/jpeg', 0.4],
      [1200, 'image/jpeg', 0.2], [1200, 'image/jpeg', 0.28], [1200, 'image/jpeg', 0.24],
    ]);
    expect([fitxer.name, fitxer.type, fitxer.size]).toEqual(['heroImage.jpg', 'image/jpeg', 72803]);
  });

  /* Cada llindar possible de la reixa, de cap qualitat que hi cap a totes: el
     pes porta la marca de la qualitat (1.000 B més les centèsimes) si hi cap, i
     80.000 B exactes (estricte: no hi caben) si no. */
  test.each([
    ['WebP', true, 6],
    ['WebKit, amb la reserva JPEG', false, 7],
  ])('tots els llindars en %s: la més alta que hi cap o l’error a la mínima, sempre a 1.200 i mai més de MAX_CODIFICACIONS', async (_motor, sapWebp, pitjor) => {
    let maxim = 0;
    for (let llindar = 0; llindar <= QUALITATS_DE_LA_CERCA.length; llindar += 1) {
      dobles.compressImage.mockReset();
      const pes = (q) => (QUALITATS_DE_LA_CERCA.indexOf(q) < llindar ? 1000 + Math.round(q * 100) : PRESSUPOST_PUJADA);
      dobles.compressImage.mockImplementation(async (_f, { format, quality }) => {
        if (format === 'image/jpeg') return urlDe('image/jpeg', ambPes(JPEG, pes(quality)));
        return sapWebp ? urlDe('image/webp', ambPes(WEBP, pes(quality))) : urlDe('image/png', PNG);
      });
      const intent = fotoDinsDelPressupost(foto(), { mida: 1200, ambFitxer: false });
      if (llindar === 0) {
        await expect(intent).rejects.toThrow(ERROR_PRESSUPOST);
        expect(crides().at(-1)[2]).toBe(QUALITAT_MINIMA);
      } else {
        const { dataUrl } = await intent;
        expect(bytesDeDataUrl(dataUrl) - 1000, `llindar ${llindar}`).toBe(Math.round(QUALITATS_DE_LA_CERCA[llindar - 1] * 100));
      }
      expect(crides().length, `llindar ${llindar}`).toBeLessThanOrEqual(MAX_CODIFICACIONS);
      expect(crides().every(([m]) => m === 1200)).toBe(true);
      maxim = Math.max(maxim, crides().length);
    }
    // La cota és justa: el pitjor cas en WebKit gasta les set.
    expect(maxim).toBe(pitjor);
  });
});

/* ── Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) ──
   La tria de la casella del diàleg viatja a cada intent de compressImage (el
   simulat no hi posa cap EXIF: ací es prova el viatge i el pressupost). */
describe('fotoDinsDelPressupost · la tria de l’EXIF compta dins del pressupost', () => {
  const original = () => new File([jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() })], 'arbre.jpg', { type: 'image/jpeg' });
  const opcions = () => dobles.compressImage.mock.calls.map(([, o]) => o);

  test('conservaExif i l’original passen a cada intent (també a la reserva JPEG); sense `original`, el mateix fitxer', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador((q) => (q === QUALITAT_MAXIMA ? 90000 : 70000), { sapWebp: false }));
    const triada = original();
    const retall = foto();
    await fotoDinsDelPressupost(retall, { mida: 1200, nom: 'heroImage', conservaExif: true, original: triada });
    // Gauntlet 261016 (P1) · Els intents són els de la cerca (abans, 0,8 i 0,72).
    expect(opcions()).toEqual([
      ['image/webp', 0.8], ...[0.8, 0.4, 0.6, 0.68, 0.72, 0.76].map((q) => ['image/jpeg', q]),
    ].map(([format, quality]) => ({ maxSize: 1200, format, quality, conservaExif: true, original: triada })));
    dobles.compressImage.mockClear();
    await fotoDinsDelPressupost(retall, { mida: 400, nom: 'avatar', conservaExif: true });
    expect(opcions()[0].original).toBe(retall);
  });

  test('sense la tria, o desmarcada: cap clau nova a compressImage (com abans)', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(sempre(1000)));
    await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage' });
    await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage', conservaExif: false, original: original() });
    expect(opcions().map((o) => Object.keys(o))).toEqual([['maxSize', 'format', 'quality'], ['maxSize', 'format', 'quality']]);
  });

  test('si amb l’EXIF no hi cap però sense sí que hi cabria: ERROR_PRESSUPOST_EXIF, que diu com eixir-ne, i res no puja', async () => {
    fetchDeVeres();
    const { tiff } = await exifPublicable(original());
    expect(tiff.length).toBeGreaterThan(50);
    const triada = original();
    dobles.compressImage.mockImplementation(codificador(sempre(PRESSUPOST_PUJADA + 10)));
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, conservaExif: true, original: triada })).rejects.toThrow(ERROR_PRESSUPOST_EXIF);
    // La cerca sencera, fins a la qualitat mínima (abans, els sis intents de l'escala).
    expect(crides().map(([, , q]) => q)).toEqual([0.8, 0.4, 0.2, 0.08, 0.04]);
    expect(ERROR_PRESSUPOST_EXIF).toContain(`«${ETIQUETA_CONSERVA_EXIF}»`);
  });

  test('si tampoc no hi cabria sense l’EXIF, o la casella era desmarcada: ERROR_PRESSUPOST, el de sempre', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(sempre(90000)));
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, conservaExif: true, original: original() })).rejects.toThrow(ERROR_PRESSUPOST);
    dobles.compressImage.mockImplementation(codificador(sempre(PRESSUPOST_PUJADA + 10)));
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, conservaExif: false, original: original() })).rejects.toThrow(ERROR_PRESSUPOST);
    // Una foto sense EXIF publicable: el de sempre, encara que es triara conservar.
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, conservaExif: true })).rejects.toThrow(ERROR_PRESSUPOST);
  });
});

/* ── Gauntlet 261016 (Codex, relleu 02:26) · El sostre de l'EXIF és el del
   format que ix, i el que no es pot conservar es diu ──
   Ací el codificador simulat fa el que fa compressImage (imageUtils.js) amb
   la tria: torna a posar l'EXIF de l'original amb ambExifDeLoriginal, el de
   veres, dins d'un WebP o d'un JPEG mínims però vàlids. */
describe('fotoDinsDelPressupost · el sostre per format i l’avís honest', () => {
  const ascii = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
  function tros(tipus, dades) {
    const t = new Uint8Array(8 + dades.length + (dades.length & 1));
    t.set(ascii(tipus), 0);
    new DataView(t.buffer).setUint32(4, dades.length, true);
    t.set(dades, 8);
    return t;
  }
  function riff(...trossos) {
    const cos = concatena(ascii('WEBP'), ...trossos);
    const r = new Uint8Array(8 + cos.length);
    r.set(ascii('RIFF'), 0);
    new DataView(r.buffer).setUint32(4, cos.length, true);
    r.set(cos, 8);
    return r;
  }
  /* Un VP8 de 1.200 × 1.200 (fotograma clau): el WebP simple del canvas de Chrome. */
  const WEBP_CANVAS = riff(tros('VP8 ', Uint8Array.of(0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, 0xb0, 0x04, 0xb0, 0x04, 0x11, 0x22, 0x33)));
  /* El TIFF de 70.462 B de Codex: un valor opac gran a l'IFD0 i, darrere (més
     enllà dels primers 64 KB), la data i el GPS de la Torre. */
  const TIFF_GRAN = tiff({
    ifd0: [{ tag: 0xc7b0, tipus: TIPUS.BYTE, valors: new Array(70221).fill(7) }],
    exif: dataOriginal('2017:05:14 10:22:33', '+02:00'),
    gps: gpsTorre(),
  });
  const webpAmb = (bloc) => new File([riff(tros('VP8 ', Uint8Array.of(0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, 0x10, 0x00, 0x10, 0x00)), tros('EXIF', bloc))], 'arbre.webp', { type: 'image/webp' });
  const MARCA_MODEL = [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS R6' }];
  const jpegDe = (opcions) => new File([jpegAmbExif(opcions)], 'foto.jpg', { type: 'image/jpeg' });
  /* Un Exif que apunta fora del bloc: el GPS es llig, però no es pot conservar. */
  const trencat = (opcions) => jpegDe({ ...opcions, punterExif: 0x7fffffff });
  /** `pes` (opcional) allarga la foto ja amb l'EXIF fins a eixos bytes, a totes les qualitats. */
  function codificadorAmbExif({ sapWebp = true, pes = 0 } = {}) {
    return async (_fitxer, { format, conservaExif, original }) => {
      const canvas = format === 'image/jpeg' ? urlDe('image/jpeg', JPEG)
        : (sapWebp ? urlDe('image/webp', WEBP_CANVAS) : urlDe('image/png', PNG));
      const amb = conservaExif ? await ambExifDeLoriginal(canvas, original) : canvas;
      return pes ? urlDe(tipusReal(amb), ambPes(Uint8Array.from(atob(amb.slice(amb.indexOf(',') + 1)), (c) => c.charCodeAt(0)), pes)) : amb;
    };
  }

  test('un TIFF de 70.462 B en eixida WebP: es conserva sencer, perquè hi cap en el pressupost', async () => {
    expect(TIFF_GRAN.length).toBe(70462);
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificadorAmbExif());
    const triada = webpAmb(TIFF_GRAN);
    const { fitxer } = await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage', conservaExif: true, original: triada });
    expect(fitxer.type).toBe('image/webp');
    expect(fitxer.size).toBeLessThan(PRESSUPOST_PUJADA);
    const pujat = extreuTiff(await bytesDe(fitxer));
    expect(pujat.length).toBe(70462);
    expect([...pujat]).toEqual([...preparaTiff(TIFF_GRAN)]);
    expect(await exifPublicable(triada)).toMatchObject({ gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
  });

  test('el mateix en eixida JPEG (Safari 16): no hi cap en un APP1, i es diu (ERROR_EXIF_NO_CONSERVABLE), no una foto neta', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificadorAmbExif({ sapWebp: false }));
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage', conservaExif: true, original: webpAmb(TIFF_GRAN) }))
      .rejects.toThrow(ERROR_EXIF_NO_CONSERVABLE);
    expect(crides()).toEqual([[1200, 'image/webp', 0.8], [1200, 'image/jpeg', 0.8]]);
    expect(fetch).not.toHaveBeenCalled(); // no s'ha preparat res per a pujar
    expect(ERROR_EXIF_NO_CONSERVABLE).toContain(`«${ETIQUETA_CONSERVA_EXIF}»`);
    // Desmarcada, la mateixa foto puja neta, com sempre.
    dobles.compressImage.mockClear();
    const { fitxer } = await fotoDinsDelPressupost(foto(), { mida: 1200, nom: 'heroImage', conservaExif: false, original: webpAmb(TIFF_GRAN) });
    expect(fitxer.type).toBe('image/jpeg');
  });

  test('un EXIF que no es pot conservar (un punter fora del bloc): l’avís abans de comprimir res', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificadorAmbExif());
    const original = trencat({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() });
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, conservaExif: true, original })).rejects.toThrow(ERROR_EXIF_NO_CONSERVABLE);
    expect(dobles.compressImage).not.toHaveBeenCalled();
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, conservaExif: false, original })).resolves.toMatchObject({ fitxer: expect.any(File) });
  });

  test('una càmera sense GPS ni data: els avisos parlen de la càmera, amb l’etiqueta que es veu', async () => {
    fetchDeVeres();
    const camera = jpegDe({ ifd0: MARCA_MODEL });
    expect(await exifPublicable(camera)).toMatchObject({ gps: null, dataCaptura: null, tiff: expect.any(Uint8Array) });
    dobles.compressImage.mockImplementation(codificadorAmbExif({ pes: PRESSUPOST_PUJADA + 10 }));
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, conservaExif: true, original: camera })).rejects.toThrow(ERROR_PRESSUPOST_EXIF_CAMERA);
    await expect(fotoDinsDelPressupost(foto(), { mida: 1200, conservaExif: true, original: trencat({ ifd0: MARCA_MODEL, exif: [{ tag: 0x9286, tipus: TIPUS.BYTE, valors: [1, 2, 3, 4, 5] }] }) }))
      .rejects.toThrow(ERROR_EXIF_NO_CONSERVABLE_CAMERA);
    expect(ERROR_PRESSUPOST_EXIF_CAMERA).toContain(`«${ETIQUETA_CONSERVA_CAMERA}»`);
    expect(ERROR_EXIF_NO_CONSERVABLE_CAMERA).toContain(`«${ETIQUETA_CONSERVA_CAMERA}»`);
  });

  test('esAvisDeLaFoto: els cinc avisos de la foto (els que qui puja ha de mostrar tal qual), i res més', () => {
    expect(AVISOS_DE_LA_FOTO).toEqual([
      ERROR_PRESSUPOST, ERROR_PRESSUPOST_EXIF, ERROR_PRESSUPOST_EXIF_CAMERA, ERROR_EXIF_NO_CONSERVABLE, ERROR_EXIF_NO_CONSERVABLE_CAMERA,
    ]);
    expect(Object.isFrozen(AVISOS_DE_LA_FOTO)).toBe(true);
    AVISOS_DE_LA_FOTO.forEach((avis) => expect(esAvisDeLaFoto(avis)).toBe(true));
    for (const altre of ['Sense xarxa.', '', null, undefined]) expect(esAvisDeLaFoto(altre)).toBe(false);
  });
});

describe('tipusReal · els bytes manen; després, el blob; si res no se sap, WebP', () => {
  test.each([
    ['un PNG que diu PNG (Safari 16 sense codificador WebP)', dataUrl('image/png', PNG), 'image/png', 'image/png'],
    ['un PNG amb la capçalera de WebP: manen els bytes', dataUrl('image/webp', PNG), 'image/webp', 'image/png'],
    ['un JPEG', dataUrl('image/jpeg', JPEG), 'image/jpeg', 'image/jpeg'],
    ['un WebP de veres', dataUrl('image/webp', WEBP), 'image/webp', 'image/webp'],
    ['bytes massa curts: el tipus del blob', 'data:image/png;base64,AAAA', 'image/png', 'image/png'],
    ['bytes i blob sense res conegut: WebP, el de sempre', 'data:image/webp;base64,AAAA', '', 'image/webp'],
    ['un data URL sense base64: el tipus del blob', 'data:image/png,xyz', 'image/png', 'image/png'],
    ['un base64 trencat no llança: el tipus del blob', 'data:image/png;base64,@@@@', 'image/jpeg', 'image/jpeg'],
    ['un blob que no és d’imatge: WebP', 'data:text/plain;base64,AAAA', 'text/plain', 'image/webp'],
    ['un tipus de blob que és una clau heretada: WebP', 'data:image/png;base64,AAAA', 'constructor', 'image/webp'],
    ['sense data URL: el tipus del blob', null, 'image/png', 'image/png'],
  ])('%s', (_cas, url, tipusBlob, esperat) => {
    expect(tipusReal(url, { type: tipusBlob })).toBe(esperat);
  });
});

describe('fitxerDeDataUrl · el nom porta l’extensió del tipus real i els bytes no es toquen', () => {
  test.each([
    ['PNG', 'image/png', PNG, 'avatar', 'avatar.png', 'image/png'],
    ['PNG etiquetat com a WebP', 'image/webp', PNG, 'heroImage', 'heroImage.png', 'image/png'],
    ['JPEG', 'image/jpeg', JPEG, 'heroImage', 'heroImage.jpg', 'image/jpeg'],
    ['WebP', 'image/webp', WEBP, 'logoImage', 'logoImage.webp', 'image/webp'],
  ])('%s', async (_cas, capcalera, bytes, nomBase, nom, tipus) => {
    fetchDeVeres();
    const fitxer = await fitxerDeDataUrl(dataUrl(capcalera, bytes), nomBase);
    expect(fitxer).toBeInstanceOf(File);
    expect([fitxer.name, fitxer.type]).toEqual([nom, tipus]);
    expect([...await bytesDe(fitxer)]).toEqual([...bytes]);
  });
});
