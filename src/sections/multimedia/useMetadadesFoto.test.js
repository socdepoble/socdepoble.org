/* Gauntlet 261017 (C03 de Codex) · L'EXIF d'un WebP més gran que el prefix del
   visor, amb un servidor simulat que respecta Range (o no):
     · el tros EXIF darrere dels píxels es troba amb peticions de 8 bytes i
       el tros, i es llig amb el parser estricte (la càmera «Canon EOS 5D»);
     · si el servidor ignora Range, el flux es talla als 256 KB i prou;
     · un Content-Range, un estat, una ETag o una redirecció que no quadren,
       massa trossos o massa temps: el prefix de sempre, sense la càmera;
     · avortar enmig del recorregut no deixa cap petició viva ni cap estat;
     · JPEG i WebP menuts, com abans: una sola petició;
     · la reproducció de Codex: dos WebP reals del repositori amb l'EXIF
       incrustat en memòria (els fitxers no es toquen). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MAX_BYTES_EXIF, llegixExif } from '../../components/universal/enquadrament/exif.js';
import { extreuTiff, incrustaEnWebp } from '../../components/universal/enquadrament/exifIncrustat.js';
import { TIPUS, concatena, jpegAmbExif, tiff } from '../../components/universal/enquadrament/jpegProva.js';
import { MAX_PETICIONS_WEBP, llegixExifRemot, oblidaMetadades, useMetadadesFoto } from './useMetadadesFoto.js';

const ascii = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));
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
const VP8X = tros('VP8X', Uint8Array.of(0x08, 0, 0, 0, 0xaf, 0x04, 0, 0x1f, 0x03, 0)); // hi ha EXIF; 1200 × 800
const ifdCanon = [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS 5D' }];
const DADES_EXIF = concatena(ascii('Exif\0\0'), tiff({ ifd0: ifdCanon })); // senar: el tros porta farciment
const EXIF = tros('EXIF', DADES_EXIF);
const XMP = tros('XMP ', ascii('<x:xmpmeta/>'));
const CANON = { marca: 'Canon', model: 'EOS 5D' };
/** Com la fixture de Codex: més de 400 KB, l'EXIF darrere de la imatge i l'XMP al final. */
const GRAN = riff(VP8X, tros('VP8 ', new Uint8Array(414000)), EXIF, XMP);
const MENUT = riff(VP8X, tros('VP8 ', new Uint8Array(70000)), EXIF);
const URL_FOTO = '/assets/towns/tibi/gran.webp';
const OPCIONS = { ambCamera: true, ambGps: false };

/* Un flux que només dona trossos de 64 KB quan se'ls demana, i apunta quants
   bytes n'han eixit i si s'ha cancel·lat: el servidor que ignora Range. */
function fluxComptat(bytes, comptador) {
  let pos = 0;
  comptador.fluxos = (comptador.fluxos || 0) + 1;
  return new ReadableStream({
    pull(c) {
      if (pos >= bytes.length) return c.close();
      const part = bytes.slice(pos, pos + 65536);
      pos += part.length;
      comptador.bytes += part.length;
      c.enqueue(part);
      return undefined;
    },
    cancel() {
      comptador.cancel = true;
    }
  }, { highWaterMark: 0 });
}

/* Un servidor que respecta Range. `altera(n, resposta)` pot canviar la
   resposta n-èsima (0 és la del prefix). Apunta els bytes que envia. */
function servidor(bytes, { altera, etag } = {}) {
  const comptador = { bytes: 0, cancel: false };
  let n = 0;
  const peticio = vi.fn(async (_url, opcions = {}) => {
    if (opcions.signal?.aborted) throw new DOMException('avortat', 'AbortError');
    const m = /^bytes=(\d+)-(\d+)$/.exec(opcions.headers?.Range || '');
    let resposta;
    if (!m) {
      resposta = { estat: 200, cos: fluxComptat(bytes, comptador), capcaleres: {} };
    } else {
      const inici = Number(m[1]);
      const fi = Math.min(Number(m[2]), bytes.length - 1);
      resposta = { estat: 206, cos: bytes.slice(inici, fi + 1), capcaleres: { 'Content-Range': `bytes ${inici}-${fi}/${bytes.length}`, ...(etag ? { ETag: etag } : {}) } };
    }
    resposta = altera?.(n, resposta, bytes, comptador) || resposta;
    n += 1;
    if (resposta.cos instanceof Uint8Array) comptador.bytes += resposta.cos.length;
    const r = new Response(resposta.cos, { status: resposta.estat, headers: resposta.capcaleres });
    if (resposta.redirigida) {
      Object.defineProperty(r, 'redirected', { value: true });
      Object.defineProperty(r, 'url', { value: resposta.redirigida });
    }
    return r;
  });
  return { peticio, comptador };
}

/* Una petició que no acaba mai, fins que s'avorta. */
const penjada = (opcions) => new Promise((_resol, rebutja) => {
  opcions.signal.addEventListener('abort', () => rebutja(new DOMException('avortat', 'AbortError')));
});

const rangs = (peticio) => peticio.mock.calls.map(([, opcions]) => opcions.headers.Range);

beforeEach(() => {
  oblidaMetadades();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('un WebP de més de 256 KB amb l’EXIF darrere dels píxels', () => {
  test('el control: el parser estricte no el troba en el prefix', () => {
    expect(GRAN.length).toBeGreaterThan(MAX_BYTES_EXIF + 150000);
    expect(llegixExif(GRAN, OPCIONS).camera).toEqual(CANON);
    expect(llegixExif(GRAN.subarray(0, MAX_BYTES_EXIF), OPCIONS).camera).toBeNull();
  });

  test('amb Range: el prefix, una capçalera de 8 bytes i el tros EXIF; la càmera hi és', async () => {
    const { peticio, comptador } = servidor(GRAN);
    vi.stubGlobal('fetch', peticio);
    const exif = await llegixExifRemot(URL_FOTO, OPCIONS);
    expect(exif.camera).toEqual(CANON);
    const capcalera = 12 + 18 + 8 + 414000;
    const midaExif = DADES_EXIF.length; // sense el farciment
    expect(rangs(peticio)).toEqual(['bytes=0-262143', `bytes=${capcalera}-${capcalera + 7}`, `bytes=${capcalera + 8}-${capcalera + 7 + midaExif}`]);
    expect(peticio.mock.calls.every(([url]) => url === URL_FOTO)).toBe(true);
    expect(peticio.mock.calls.slice(1).every(([, o]) => o.redirect === 'error' && o.credentials === 'same-origin')).toBe(true);
    expect(comptador.bytes).toBe(MAX_BYTES_EXIF + 8 + midaExif);
  });

  test('el hook: «llest» amb la càmera, i una sola lectura per sessió', async () => {
    const { peticio } = servidor(GRAN);
    vi.stubGlobal('fetch', peticio);
    const primer = renderHook(() => useMetadadesFoto(URL_FOTO));
    expect(primer.result.current.estat).toBe('llegint');
    await waitFor(() => expect(primer.result.current.estat).toBe('llest'));
    expect(primer.result.current.exif.camera).toEqual(CANON);
    primer.unmount();
    const segon = renderHook(() => useMetadadesFoto(URL_FOTO));
    expect(segon.result.current).toEqual({ estat: 'llest', exif: expect.objectContaining({ camera: CANON }) });
    expect(peticio).toHaveBeenCalledTimes(3);
  });

  test('si l’EXIF ja és dins del prefix (davant dels píxels), no cal cap petició més', async () => {
    const { peticio } = servidor(riff(VP8X, EXIF, tros('VP8 ', new Uint8Array(414000))));
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toEqual(CANON);
    expect(peticio).toHaveBeenCalledTimes(1);
  });

  test('d’una redirecció dins del mateix origen, les peces es demanen on ha acabat', async () => {
    const desti = `${location.origin}/assets/nou/gran.webp`;
    const { peticio } = servidor(GRAN, { altera: (n, r) => (n === 0 ? { ...r, redirigida: desti } : null) });
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toEqual(CANON);
    expect(peticio.mock.calls.map(([url]) => url)).toEqual([URL_FOTO, desti, desti]);
  });
});

describe('quan alguna cosa no quadra, el prefix de sempre: mai l’original sencer', () => {
  test('el servidor ignora Range: una petició, el flux tallat als 256 KB i sense càmera', async () => {
    const { peticio, comptador } = servidor(GRAN, { altera: (n, r) => ({ ...r, estat: 200, cos: fluxComptat(GRAN, comptador), capcaleres: {} }) });
    vi.stubGlobal('fetch', peticio);
    const exif = await llegixExifRemot(URL_FOTO, OPCIONS);
    expect(exif).toEqual(expect.objectContaining({ camera: null, autor: null }));
    expect(peticio).toHaveBeenCalledTimes(1);
    expect(comptador.bytes).toBeLessThanOrEqual(MAX_BYTES_EXIF);
    expect(comptador.cancel).toBe(true);
  });

  test('un Content-Range del prefix que no quadra (sense total, un altre inici, un total menut, cap): cap recorregut', async () => {
    const dolents = [`bytes 0-${MAX_BYTES_EXIF - 1}/*`, `bytes 1-${MAX_BYTES_EXIF}/${GRAN.length}`, `bytes 0-${MAX_BYTES_EXIF - 1}/${GRAN.length - 100}`, null];
    for (const valor of dolents) {
      oblidaMetadades();
      const { peticio } = servidor(GRAN, { altera: (n, r) => (n === 0 ? { ...r, capcaleres: valor ? { 'Content-Range': valor } : {} } : null) });
      vi.stubGlobal('fetch', peticio);
      expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toBeNull();
      expect(peticio).toHaveBeenCalledTimes(1);
    }
  });

  test('un prefix més curt del que diu el Content-Range: cap recorregut', async () => {
    const { peticio } = servidor(GRAN, { altera: (n, r) => (n === 0 ? { ...r, cos: r.cos.slice(0, 1000) } : null) });
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toBeNull();
    expect(peticio).toHaveBeenCalledTimes(1);
  });

  test('una peça amb un rang desplaçat, un altre total, un 200 o una altra ETag: el cos es cancel·la i prou', async () => {
    const capcalera = 12 + 18 + 8 + 414000;
    const variants = [
      (r) => ({ ...r, capcaleres: { 'Content-Range': `bytes ${capcalera - 1}-${capcalera + 7}/${GRAN.length}` } }),
      (r) => ({ ...r, capcaleres: { 'Content-Range': `bytes ${capcalera}-${capcalera + 8}/${GRAN.length}` } }),
      (r) => ({ ...r, capcaleres: { 'Content-Range': `bytes ${capcalera}-${capcalera + 7}/${GRAN.length + 1}` } }),
      (r) => ({ ...r, capcaleres: {} }),
      (r, comptador) => ({ ...r, estat: 200, cos: fluxComptat(GRAN, comptador) }), // un 200 amb un Content-Range que sí que quadra
      (r) => ({ ...r, capcaleres: { ...r.capcaleres, ETag: '"altra"' } })
    ];
    for (const variant of variants) {
      oblidaMetadades();
      const { peticio, comptador } = servidor(GRAN, { etag: '"v1"', altera: (n, r, _b, c) => (n === 1 ? variant(r, c) : null) });
      vi.stubGlobal('fetch', peticio);
      expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toBeNull();
      expect(peticio).toHaveBeenCalledTimes(2);
      expect(comptador.bytes).toBeLessThanOrEqual(MAX_BYTES_EXIF + 8);
      if (comptador.fluxos) expect(comptador.cancel).toBe(true); // el 200: cancel·lat sense llegir-ne res
    }
  });

  test('la mateixa ETag a totes les peces, o cap: es llig', async () => {
    for (const etag of ['"v1"', undefined]) {
      oblidaMetadades();
      const { peticio } = servidor(GRAN, { etag });
      vi.stubGlobal('fetch', peticio);
      expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toEqual(CANON);
    }
  });

  test('una redirecció a un altre origen: cap recorregut', async () => {
    const { peticio } = servidor(GRAN, { altera: (n, r) => (n === 0 ? { ...r, redirigida: 'https://altre.example/gran.webp' } : null) });
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toBeNull();
    expect(peticio).toHaveBeenCalledTimes(1);
  });

  test(`massa trossos darrere de la imatge: com a molt ${MAX_PETICIONS_WEBP} peticions més`, async () => {
    const farcits = Array.from({ length: 10 }, () => tros('JUNK', new Uint8Array(16)));
    const { peticio } = servidor(riff(VP8X, tros('VP8 ', new Uint8Array(414000)), ...farcits, EXIF));
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toBeNull();
    expect(peticio).toHaveBeenCalledTimes(1 + MAX_PETICIONS_WEBP);
  });

  test('un tros EXIF que declara més de 256 KB no es demana', async () => {
    const bytes = riff(VP8X, tros('VP8 ', new Uint8Array(300000)), tros('EXIF', new Uint8Array(MAX_BYTES_EXIF + 2)));
    const { peticio } = servidor(bytes);
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toBeNull();
    expect(peticio).toHaveBeenCalledTimes(2);
  });

  test('el temps total s’esgota: la peça en vol s’avorta i la lectura falla (no queda a la memòria)', async () => {
    const { peticio } = servidor(GRAN);
    const servix = peticio.getMockImplementation();
    peticio.mockImplementation((url, opcions) => (opcions.headers.Range === 'bytes=0-262143' ? servix(url, opcions) : penjada(opcions)));
    vi.stubGlobal('fetch', peticio);
    await expect(llegixExifRemot(URL_FOTO, { ...OPCIONS, temps: 20 })).rejects.toThrow('avortat');
    expect(peticio).toHaveBeenCalledTimes(2);
    expect(peticio.mock.calls[1][1].signal.aborted).toBe(true);
  });

  /* Revisió del Gauntlet 261017 (C03, «temps total») · El prefix també té
     sostre: una resposta que no acaba mai ja no deixa el panell en «Llegint…». */
  test('el prefix penjat també s’avorta en esgotar el seu temps (no queda a la memòria)', async () => {
    const peticio = vi.fn((_url, opcions) => penjada(opcions));
    vi.stubGlobal('fetch', peticio);
    await expect(llegixExifRemot(URL_FOTO, { ...OPCIONS, tempsPrefix: 20 })).rejects.toThrow('avortat');
    expect(peticio).toHaveBeenCalledTimes(1);
    expect(peticio.mock.calls[0][1].signal.aborted).toBe(true);
  });

  test('un cos que calla a mitges també s’avorta: capçaleres sí, bytes mai', async () => {
    const peticio = vi.fn((_url, opcions) => Promise.resolve(new Response(new ReadableStream({
      start(control) {
        control.enqueue(new Uint8Array(1024));
        opcions.signal.addEventListener('abort', () => control.error(new DOMException('avortat', 'AbortError')));
      }
    }), { status: 206, headers: { 'Content-Range': `bytes 0-${MAX_BYTES_EXIF - 1}/414560` } })));
    vi.stubGlobal('fetch', peticio);
    await expect(llegixExifRemot(URL_FOTO, { ...OPCIONS, tempsPrefix: 20 })).rejects.toThrow('avortat');
    expect(peticio.mock.calls[0][1].signal.aborted).toBe(true);
  });
});

describe('avortar enmig del recorregut', () => {
  test('la funció: la peça en vol s’avorta i no se’n demana cap altra', async () => {
    const { peticio } = servidor(GRAN);
    const servix = peticio.getMockImplementation();
    peticio.mockImplementation((url, opcions) => (opcions.headers.Range === 'bytes=0-262143' ? servix(url, opcions) : penjada(opcions)));
    vi.stubGlobal('fetch', peticio);
    const control = new AbortController();
    const lectura = llegixExifRemot(URL_FOTO, { ...OPCIONS, signal: control.signal });
    await waitFor(() => expect(peticio).toHaveBeenCalledTimes(2));
    control.abort();
    await expect(lectura).rejects.toThrow('avortat');
    expect(peticio.mock.calls[1][1].signal.aborted).toBe(true);
    expect(peticio).toHaveBeenCalledTimes(2);
  });

  test('el hook: canviar de foto avorta el recorregut, sense estat ni memòria de l’anterior', async () => {
    const jpeg = jpegAmbExif({ ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Nikon' }] });
    const { peticio } = servidor(GRAN);
    const servix = peticio.getMockImplementation();
    peticio.mockImplementation((url, opcions) => {
      if (url.endsWith('.jpg')) return Promise.resolve(new Response(jpeg, { status: 206 }));
      return opcions.headers.Range === 'bytes=0-262143' ? servix(url, opcions) : penjada(opcions);
    });
    vi.stubGlobal('fetch', peticio);
    const { result, rerender } = renderHook(({ src }) => useMetadadesFoto(src), { initialProps: { src: URL_FOTO } });
    await waitFor(() => expect(peticio).toHaveBeenCalledTimes(2));
    const peca = peticio.mock.calls[1][1].signal;
    rerender({ src: '/assets/towns/tibi/1.jpg' });
    expect(peca.aborted).toBe(true);
    await waitFor(() => expect(result.current.estat).toBe('llest'));
    expect(result.current.exif.camera).toEqual({ marca: 'Nikon', model: null });
    await act(async () => {});
    expect(peticio).toHaveBeenCalledTimes(3);
    rerender({ src: URL_FOTO });
    expect(result.current).toEqual({ estat: 'llegint', exif: null });
    await waitFor(() => expect(peticio).toHaveBeenCalledTimes(5));
  });
});

describe('JPEG i WebP menuts, com abans', () => {
  test('un JPEG: una sola petició de 256 KB i la càmera', async () => {
    const { peticio } = servidor(jpegAmbExif({ ifd0: ifdCanon }));
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot('/assets/towns/tibi/1.jpg', OPCIONS)).camera).toEqual(CANON);
    expect(rangs(peticio)).toEqual(['bytes=0-262143']);
  });

  test('un WebP de menys de 256 KB amb l’EXIF al final: una sola petició', async () => {
    expect(MENUT.length).toBeLessThan(MAX_BYTES_EXIF);
    const { peticio } = servidor(MENUT);
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toEqual(CANON);
    expect(peticio).toHaveBeenCalledTimes(1);
  });

  test('sense resposta bona del servidor: null; sense xarxa: rebutja (el hook ho deixa en «sense»)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 404 })));
    expect(await llegixExifRemot(URL_FOTO, OPCIONS)).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('sense xarxa'); }));
    await expect(llegixExifRemot(URL_FOTO, OPCIONS)).rejects.toThrow('sense xarxa');
    const { result } = renderHook(() => useMetadadesFoto(URL_FOTO));
    await waitFor(() => expect(result.current).toEqual({ estat: 'sense', exif: null }));
  });
});

describe('la reproducció de Codex, amb WebP reals del repositori', () => {
  const ambCanon = (ruta) => incrustaEnWebp(readFileSync(path.join(process.cwd(), ruta)), extreuTiff(jpegAmbExif({ ifd0: ifdCanon })));

  test('el WebP de 414.560 bytes: el prefix sol no hi arriba; amb el recorregut, «Canon EOS 5D»', async () => {
    const webp = ambCanon('public/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp');
    expect(webp.length).toBe(414560);
    expect(llegixExif(webp.subarray(0, MAX_BYTES_EXIF), OPCIONS).camera).toBeNull();
    const { peticio, comptador } = servidor(webp);
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toEqual(CANON);
    expect(peticio).toHaveBeenCalledTimes(3);
    expect(comptador.bytes).toBeLessThan(MAX_BYTES_EXIF + 1024);
  });

  test('el control de 77.824 bytes: una sola petició, com abans', async () => {
    const webp = ambCanon('public/assets/ui/plugins/tpv_vinyeta.webp');
    expect(webp.length).toBe(77824);
    const { peticio } = servidor(webp);
    vi.stubGlobal('fetch', peticio);
    expect((await llegixExifRemot(URL_FOTO, OPCIONS)).camera).toEqual(CANON);
    expect(peticio).toHaveBeenCalledTimes(1);
  });
});


/* P1-64 (revisió adversarial 261028) · ambTiff: el bloc TIFF dels bytes
   llegits, per a la marca de la precisió (geoDeLesFotos · precisioDeGps). */
test('ambTiff: el TIFF del tros EXIF trobat; sense l’opció, cap clau tiff', async () => {
  const { peticio } = servidor(GRAN);
  vi.stubGlobal('fetch', peticio);
  const amb = await llegixExifRemot(URL_FOTO, { ...OPCIONS, ambTiff: true });
  expect(amb.camera).toEqual(CANON);
  expect([...amb.tiff]).toEqual([...extreuTiff(GRAN)]);
  oblidaMetadades();
  const { peticio: altra } = servidor(GRAN);
  vi.stubGlobal('fetch', altra);
  expect(await llegixExifRemot(URL_FOTO, OPCIONS)).not.toHaveProperty('tiff');
});
