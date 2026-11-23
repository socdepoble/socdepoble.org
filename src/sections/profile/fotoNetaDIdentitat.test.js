// @vitest-environment node
/* v1.2.23 · L2-01 (Gauntlet R1) · La guarda de les imatges d'identitat de «Multimèdia» (fotoNetaDIdentitat.js) i els
   seus avisos en cinc llengües (i18nFotoNetaIdentitat.js), sobre bytes de veres: les fixtures sintètiques netes de
   tests/helpers/mitjansPublicsNets.js amb un bloc de metadades afegit. Cap xarxa: el port i el fetch s'injecten.
   v1.2.23 · L2-01 (Gauntlet R2) · I els bytes EXACTES que fa ImageIO, el codificador del canvas de WebKit (Safari i
   l'app d'iOS): un JPEG amb un APP1 «Exif» de dimensions i un APP13 amb l'IPTC buit, i un PNG amb un eXIf de
   dimensions (CGImageDestination amb només la qualitat, com WebKit; 64×48, un rectangle verd amb un quadrat roig). No
   diuen res de la persona: la guarda els ha de deixar posar. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ESTAT_FOTO_IDENTITAT, MAX_BYTES_FOTO_IDENTITAT, esCampDIdentitat, portaDadesDeLaFoto, revisaFotoDIdentitat,
} from './fotoNetaDIdentitat.js';
import { TEXTOS_FOTO_NETA_IDENTITAT, quinaImatgeDIdentitat, textosFotoNetaIdentitat } from './i18nFotoNetaIdentitat.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { JPEG_NET, PNG_NET, WEBP_NET, unix } from '../../../tests/helpers/mitjansPublicsNets.js';
import { TIPUS, dataOriginal, gpsTorre, tiff } from '../../../tests/helpers/jpegProva.js';

permetOrigenMitjans('https://fitxers.test');

const ascii = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const TIFF_GPS = Uint8Array.of(73, 73, 42, 0, 8, 0, 0, 0, 1, 0, 37, 136, 4, 0, 1, 0, 0, 0, 26, 0, 0, 0, 0, 0, 0, 0,
  1, 0, 1, 0, 2, 0, 2, 0, 0, 0, 78, 0, 0, 0, 0, 0, 0, 0);
const app = (marca, cos) => unix(Uint8Array.of(0xff, marca, (cos.length + 2) >>> 8, (cos.length + 2) & 255), cos);
const jpegAmb = (...segments) => unix(JPEG_NET.subarray(0, 2), ...segments, JPEG_NET.subarray(2));
function webpAmb(nom, cos) {
  const cap = new Uint8Array(8);
  cap.set(ascii(nom));
  new DataView(cap.buffer).setUint32(4, cos.length, true);
  const bytes = unix(WEBP_NET, cap, cos, new Uint8Array(cos.length & 1));
  new DataView(bytes.buffer).setUint32(4, bytes.length - 8, true);
  return bytes;
}
function crc(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
function pngAmb(nom, cos) {
  const tros = unix(ascii(nom), cos);
  const cap = new Uint8Array(4);
  const cua = new Uint8Array(4);
  new DataView(cap.buffer).setUint32(0, cos.length);
  new DataView(cua.buffer).setUint32(0, crc(tros));
  return unix(PNG_NET.subarray(0, 33), cap, tros, cua, PNG_NET.subarray(33));
}
/* v1.2.23 · L2-01 (Gauntlet R2) · ImageIO (webkit.jpg i webkit.png del verificador, sha256 95a9447a… i ef02c88e…). */
const deBase64 = (b64) => Uint8Array.from(Buffer.from(b64, 'base64'));
const JPEG_IMAGEIO = deBase64(
  '/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAQK' +
  'ADAAQAAAABAAAAMAAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgAMABA' +
  'AwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicR' +
  'QygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SV' +
  'lpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAA' +
  'ABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJico' +
  'KSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8' +
  'jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgICAwICAwQDAwMEBQQEBAQFBwUFBQUFBwgHBwcHBwcICAgICAgICAoKCgoK' +
  'CgsLCwsLDQ0NDQ0NDQ0NDf/bAEMBAgICAwMDBgMDBg0JBwkNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ' +
  '0NDf/dAAQABP/aAAwDAQACEQMRAD8A8Looor4s/ncKKKKACiiigAooooA//9DwusS8u7iK4dI3woxgYHoPatuubv8A/j7k/D+Qr8vz+rOnh4yp' +
  'yad+mnRn1f0OOHMpzrjTFYXOcLTr01hpyUakIzipKrRSklJNXs2r72bXUPt93/z0/Qf4VZs7u4luESR8qc5GB6H2rKq5Yf8AH3H+P8jXzeCxuI' +
  'liKcZVHa66vuf3d4p+FnBeE4LzfFYXKMNCpDDV5RlGhSUoyVKbUotRummrprVPVHSUUUV+gH+LwUUUUAf/0fC6xLy0uJbh3jTKnGDkeg9626K/' +
  'P8bgoYqCp1G7XvofCeFXirm3h/m1TOcmp051J03TaqKTjyuUJNpRnB3vBdbWvp25v7Bd/wDPP9R/jVmztLiK4R5Ewozk5HofetuivPpZBh6c41' +
  'It3TvuunyP2biP6Y/GmdZTismxWFwyp16c6cnGFVSUZxcW4t1mr2el01fdMKKKK9w/kwKKKKAP/9k=');
const PNG_IMAGEIO = deBase64(
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAYAAAChS3wfAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6AB' +
  'AAMAAAABAAEAAKACAAQAAAABAAAAQKADAAQAAAABAAAAMAAAAAC/g6J/AAAAv0lEQVRoBe2YwQ3DMAwDnaIbZY6s0TkyR9fIHJkpBTqBHiJAgee3' +
  'QNDU0Q9v+3k8K/i8gu/+vzoBQEB4AlQgHIAFARAQngAVCAeAR5AKUIHwBKhAOADrXQ3g+t7V0dLc8dlLc+ohKqBO2F0fAtw3pPYHAeqE3fUhwH1D' +
  'an8QoE7YXR8C3Dek9gcB6oTd9SHAfUNqfxCgTthdP56A8p+gyx9eN1HxBBBAN1LT9CBg2sa6/UJAd6LT9CBg2sa6/f4AMqgGSS/iFGwAAAAASUVO' +
  'RK5CYII=');
/* Un TIFF «II» com el d'ImageIO (només ColorSpace, PixelXDimension i PixelYDimension a l'Exif IFD) i els que diuen
   alguna cosa de la persona, fets amb tests/helpers/jpegProva.js. */
const DIMENSIONS = [
  { tag: 0xa001, tipus: TIPUS.SHORT, valors: [1] },
  { tag: 0xa002, tipus: TIPUS.LONG, valors: [64] },
  { tag: 0xa003, tipus: TIPUS.LONG, valors: [48] },
];
const tiffII = (opcions) => tiff({ ordre: 'II', ...opcions });
const TIFF_NET = tiffII({ exif: DIMENSIONS });
const ascii0 = (tag, valor) => ({ tag, tipus: TIPUS.ASCII, valors: valor });
/* El mateix TIFF amb un IFD1 encadenat (la miniatura JPEG de l'original sense retallar) al final. */
function ambIfd1(t) {
  const ifd1 = t.length;
  const miniatura = ifd1 + 2 + 2 * 12 + 4;
  const b = new Uint8Array(miniatura + 4);
  b.set(t);
  const v = new DataView(b.buffer);
  v.setUint32(8 + 2 + v.getUint16(8, true) * 12, ifd1, true);
  v.setUint16(ifd1, 2, true);
  [[0x0201, miniatura], [0x0202, 4]].forEach(([tag, valor], i) => {
    const p = ifd1 + 2 + i * 12;
    v.setUint16(p, tag, true);
    v.setUint16(p + 2, TIPUS.LONG, true);
    v.setUint32(p + 4, 1, true);
    v.setUint32(p + 8, valor, true);
  });
  b.set([0xff, 0xd8, 0xff, 0xd9], miniatura);
  return b;
}
const app1Exif = (t) => app(0xe1, unix(ascii('Exif\0\0'), t));
/* Un recurs 8BIM de Photoshop amb el nom buit, i l'APP13 que els porta. */
function recurs8bim(id, cos) {
  const cap = new Uint8Array(12);
  cap.set(ascii('8BIM'));
  new DataView(cap.buffer).setUint16(4, id);
  new DataView(cap.buffer).setUint32(8, cos.length);
  return unix(cap, cos, new Uint8Array(cos.length & 1));
}
const app13 = (...recursos) => app(0xed, unix(ascii('Photoshop 3.0\0'), ...recursos));
const RESUM_IPTC_BUIT = Uint8Array.from(Buffer.from('d41d8cd98f00b204e9800998ecf8427e', 'hex'));
const IPTC_AUTOR = unix(Uint8Array.of(0x1c, 2, 80, 0, 4), ascii('Joan')); // 2:80, By-line
const dataUrl = (bytes, tipus) => `data:${tipus};base64,${Buffer.from(bytes).toString('base64')}`;
const resposta = (bytes, { ok = true, longitud = null } = {}) => ({
  ok, headers: { get: (nom) => (nom === 'Content-Length' && longitud != null ? String(longitud) : null) },
  arrayBuffer: async () => bytes.slice().buffer,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('portaDadesDeLaFoto · el contenidor, no els píxels', () => {
  test('les tres fixtures netes no porten res', () => {
    for (const net of [JPEG_NET, WEBP_NET, PNG_NET]) expect(portaDadesDeLaFoto(net)).toBe(false);
  });

  /* v1.2.23 · L2-01 (Gauntlet R2) · REAPUNTADA A POSTA: «un APP1 «Exif»… → true» no mirava què portava, i les fotos de
     WebKit en porten un de buit de sèrie. L'invariant viu: un APP1 «Exif» que diu alguna cosa de la persona, l'XMP
     (sense mirar dins) i un APP13 amb un IPTC que té contingut, abans de l'escaneig, compten. */
  test('JPEG: un APP1 «Exif» que diu alguna cosa, l’XMP, o un APP13 amb IPTC, abans de l’escaneig', () => {
    expect(portaDadesDeLaFoto(jpegAmb(app1Exif(TIFF_GPS)))).toBe(true);
    expect(portaDadesDeLaFoto(jpegAmb(app1Exif(tiffII({ gps: gpsTorre(), exif: DIMENSIONS }))))).toBe(true);
    expect(portaDadesDeLaFoto(jpegAmb(app(0xe1, ascii('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>'))))).toBe(true);
    expect(portaDadesDeLaFoto(jpegAmb(app13(recurs8bim(0x0404, IPTC_AUTOR), recurs8bim(0x0425, RESUM_IPTC_BUIT))))).toBe(true);
  });

  test('v1.2.23 · L2-01 (Gauntlet R2) · les fotos d’ImageIO (WebKit) són netes: el bloc de dimensions i l’IPTC buit no diuen res', () => {
    expect(portaDadesDeLaFoto(JPEG_IMAGEIO)).toBe(false);
    expect(portaDadesDeLaFoto(PNG_IMAGEIO)).toBe(false);
    // Els mateixos blocs, sols, a cada contenidor (en WebP i PNG, amb «Exif\0\0» davant o sense).
    expect(portaDadesDeLaFoto(jpegAmb(app1Exif(TIFF_NET)))).toBe(false);
    expect(portaDadesDeLaFoto(jpegAmb(app13(recurs8bim(0x0404, new Uint8Array(0)), recurs8bim(0x0425, RESUM_IPTC_BUIT))))).toBe(false);
    expect(portaDadesDeLaFoto(webpAmb('EXIF', TIFF_NET))).toBe(false);
    expect(portaDadesDeLaFoto(webpAmb('EXIF', unix(ascii('Exif\0\0'), TIFF_NET)))).toBe(false);
    expect(portaDadesDeLaFoto(pngAmb('eXIf', TIFF_NET))).toBe(false);
  });

  test('v1.2.23 · L2-01 (Gauntlet R2) · un EXIF compta si diu la ubicació, la data, la càmera, l’autor, els drets o porta la miniatura', () => {
    const casos = {
      gps: tiffII({ gps: gpsTorre(), exif: DIMENSIONS }),
      gpsSenseCoordenades: TIFF_GPS, // un GPS IFD amb una entrada que no és la versió: la casella de la pujada el compta
      dataCaptura: tiffII({ exif: [...dataOriginal('2026:11:23 10:00:00'), ...DIMENSIONS] }),
      dataDelFitxer: tiffII({ ifd0: [ascii0(0x0132, '2026:11:23 10:00:00')], exif: DIMENSIONS }),
      camera: tiffII({ ifd0: [ascii0(0x010f, 'Apple'), ascii0(0x0110, 'iPhone 16')], exif: DIMENSIONS }),
      serie: tiffII({ exif: [...DIMENSIONS, ascii0(0xa431, 'F17X12345')] }),
      autor: tiffII({ ifd0: [ascii0(0x013b, 'Joan')], exif: DIMENSIONS }),
      copyright: tiffII({ ifd0: [ascii0(0x8298, '© Joan')], exif: DIMENSIONS }),
      miniatura: ambIfd1(TIFF_NET),
    };
    for (const [cas, t] of Object.entries(casos)) {
      expect(portaDadesDeLaFoto(jpegAmb(app1Exif(t))), `JPEG · ${cas}`).toBe(true);
      expect(portaDadesDeLaFoto(webpAmb('EXIF', t)), `WebP · ${cas}`).toBe(true);
      expect(portaDadesDeLaFoto(pngAmb('eXIf', t)), `PNG · ${cas}`).toBe(true);
    }
    // Un Copyright de només espais no diu res.
    expect(portaDadesDeLaFoto(jpegAmb(app1Exif(tiffII({ ifd0: [ascii0(0x8298, '    ')], exif: DIMENSIONS }))))).toBe(false);
  });

  test('v1.2.23 · L2-01 (Gauntlet R2) · es lligen TOTS els blocs: un primer EXIF buit no tapa un segon amb el GPS', () => {
    expect(portaDadesDeLaFoto(jpegAmb(app1Exif(TIFF_NET), app1Exif(tiffII({ gps: gpsTorre() }))))).toBe(true);
    expect(portaDadesDeLaFoto(jpegAmb(app13(recurs8bim(0x0404, new Uint8Array(0))), app1Exif(TIFF_GPS)))).toBe(true);
  });

  test('v1.2.23 · L2-01 (Gauntlet R2) · un APP13 que no és el d’ImageIO compta: un altre recurs o una estructura que no s’entén', () => {
    expect(portaDadesDeLaFoto(jpegAmb(app13(recurs8bim(0x040c, Uint8Array.of(0xff, 0xd8, 0xff, 0xd9)))))).toBe(true); // la miniatura
    expect(portaDadesDeLaFoto(jpegAmb(app13(recurs8bim(0x0424, ascii('<x:xmpmeta/>')))))).toBe(true); // l'XMP
    expect(portaDadesDeLaFoto(jpegAmb(app(0xed, ascii('Adobe_Photoshop2.5:\0'))))).toBe(true);
    expect(portaDadesDeLaFoto(jpegAmb(app(0xed, unix(ascii('Photoshop 3.0\0'), ascii('8BIM\u0004\u0004')))))).toBe(true);
  });

  test('v1.2.23 · L2-01 (Gauntlet R2) · un EXIF que no s’entén (ni II ni MM) és null: no es pot comprovar', () => {
    expect(portaDadesDeLaFoto(jpegAmb(app1Exif(ascii('XX*\0\u0008\0\0\0\0\0\0\0'))))).toBeNull();
    expect(portaDadesDeLaFoto(pngAmb('eXIf', ascii('brossa que no és cap TIFF')))).toBeNull();
  });

  test('WebP: un tros EXIF (al final, on el posa la pujada) o XMP', () => {
    expect(portaDadesDeLaFoto(webpAmb('EXIF', TIFF_GPS))).toBe(true);
    expect(portaDadesDeLaFoto(webpAmb('XMP ', ascii('<x:xmpmeta/>')))).toBe(true);
  });

  test('PNG: un tros eXIf o de text', () => {
    for (const nom of ['eXIf', 'tEXt', 'iTXt', 'zTXt']) expect(portaDadesDeLaFoto(pngAmb(nom, TIFF_GPS)), nom).toBe(true);
  });

  test('un format o una estructura que no s’entén és null (qui crida no el posa)', () => {
    const webpTallat = WEBP_NET.slice(0, WEBP_NET.length - 4);
    for (const dubtos of [
      ascii('GIF89a\u0001\u0000\u0001\u0000\u0000\u0000'), new Uint8Array(0), null, 'text', Uint8Array.of(0xff, 0xd8, 0x00, 0x00, 0, 0, 0, 0, 0, 0, 0, 0),
      webpTallat, PNG_NET.slice(0, 20),
    ]) {
      expect(portaDadesDeLaFoto(dubtos)).toBeNull();
    }
  });
});

describe('revisaFotoDIdentitat · llig la foto sencera i mai rebutja', () => {
  const resol = vi.fn(async (ref) => `https://fitxers.test/${ref.replace('sdp-media://', '')}`);

  test('una referència opaca: la resol el port i es llig l’adreça (sense el marc); neta, amb dades', async () => {
    const fetch = vi.fn(async () => resposta(WEBP_NET));
    vi.stubGlobal('fetch', fetch);
    expect(await revisaFotoDIdentitat('sdp-media://mitjans/t/u/avatars/a.webp#sdp-crop=0,0,1,1', { resol })).toBe(ESTAT_FOTO_IDENTITAT.NETA);
    expect(resol).toHaveBeenLastCalledWith('sdp-media://mitjans/t/u/avatars/a.webp', expect.any(Object));
    expect(fetch).toHaveBeenLastCalledWith('https://fitxers.test/mitjans/t/u/avatars/a.webp', expect.objectContaining({ credentials: 'same-origin' }));
    fetch.mockImplementation(async () => resposta(webpAmb('EXIF', TIFF_GPS)));
    expect(await revisaFotoDIdentitat('sdp-media://mitjans/t/u/avatars/a.webp', { resol })).toBe(ESTAT_FOTO_IDENTITAT.AMB_DADES);
  });

  test('una adreça pròpia (el servidor de fitxers o /assets) es llig directament', async () => {
    const fetch = vi.fn(async () => resposta(jpegAmb(app(0xe1, unix(ascii('Exif\0\0'), TIFF_GPS)))));
    vi.stubGlobal('fetch', fetch);
    expect(await revisaFotoDIdentitat('https://fitxers.test/mitjans/t/u/notes/x.jpg', { resol })).toBe(ESTAT_FOTO_IDENTITAT.AMB_DADES);
    fetch.mockImplementation(async () => resposta(JPEG_NET));
    expect(await revisaFotoDIdentitat('/assets/forn/logo.jpg', { resol })).toBe(ESTAT_FOTO_IDENTITAT.NETA);
    expect(fetch).toHaveBeenLastCalledWith('/assets/forn/logo.jpg', expect.any(Object));
    expect(resol).not.toHaveBeenCalledWith('/assets/forn/logo.jpg', expect.anything());
  });

  test('un data URL (la llavor) es descodifica sense xarxa', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await revisaFotoDIdentitat(dataUrl(PNG_NET, 'image/png'))).toBe(ESTAT_FOTO_IDENTITAT.NETA);
    expect(await revisaFotoDIdentitat(dataUrl(pngAmb('eXIf', TIFF_GPS), 'image/png'))).toBe(ESTAT_FOTO_IDENTITAT.AMB_DADES);
    expect(await revisaFotoDIdentitat(dataUrl(JPEG_IMAGEIO, 'image/jpeg'))).toBe(ESTAT_FOTO_IDENTITAT.NETA);
    // v1.2.23 · L2-01 (Gauntlet R2) · Un data URL que no es descodifica no es podrà comprovar mai.
    expect(await revisaFotoDIdentitat('data:image/png;base64,%%%')).toBe(ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('una foto de fora (la de Google) no es demana: DE_FORA', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await revisaFotoDIdentitat('https://lh3.googleusercontent.com/a/foto=s96-c', { resol })).toBe(ESTAT_FOTO_IDENTITAT.DE_FORA);
    expect(fetch).not.toHaveBeenCalled();
  });

  /* v1.2.23 · L2-01 (Gauntlet R2) · REAPUNTADA A POSTA: tots continuen sense posar-se (fail-closed), però ara se
     separa el que tornar-ho a provar pot arreglar (NO_LLEGIBLE: la xarxa, el temps, una resposta no 2xx, el port que
     no ha resolt) del que no es podrà comprovar mai (NO_COMPROVABLE: massa gran, una adreça de fora, un format que no
     s'entén, una font buida). */
  test('fail-closed, el que es pot tornar a provar: xarxa, resposta no 2xx, temps, port que no resol', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
    expect(await revisaFotoDIdentitat('/assets/a.webp', { resol })).toBe(ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE);
    vi.stubGlobal('fetch', vi.fn(async () => resposta(WEBP_NET, { ok: false })));
    expect(await revisaFotoDIdentitat('/assets/a.webp', { resol })).toBe(ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE);
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    expect(await revisaFotoDIdentitat('/assets/a.webp', { resol, temps: 5 })).toBe(ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE);
    vi.stubGlobal('fetch', vi.fn(async () => resposta(WEBP_NET)));
    expect(await revisaFotoDIdentitat('sdp-media://mitjans/t/u/a.webp', { resol: async (ref) => ref })).toBe(ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE);
    expect(await revisaFotoDIdentitat('sdp-media://mitjans/t/u/a.webp', { resol: async () => '' })).toBe(ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE);
    expect(await revisaFotoDIdentitat('sdp-media://mitjans/t/u/a.webp', { resol: async () => { throw new Error('port'); } })).toBe(ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE);
  });

  test('fail-closed, el que no es podrà comprovar mai: massa gran, adreça de fora, format desconegut, font buida', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(WEBP_NET, { longitud: MAX_BYTES_FOTO_IDENTITAT + 1 })));
    expect(await revisaFotoDIdentitat('/assets/a.webp', { resol })).toBe(ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE);
    vi.stubGlobal('fetch', vi.fn(async () => resposta(WEBP_NET)));
    expect(await revisaFotoDIdentitat('sdp-media://mitjans/t/u/a.webp', { resol: async () => 'https://fora.example/a.webp' })).toBe(ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE);
    vi.stubGlobal('fetch', vi.fn(async () => resposta(ascii('GIF89a\u0001\u0000\u0001\u0000\u0000\u0000'))));
    expect(await revisaFotoDIdentitat('/assets/a.gif', { resol })).toBe(ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE);
    for (const buida of ['', '   ', null, undefined, 42]) expect(await revisaFotoDIdentitat(buida, { resol })).toBe(ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE);
  });

  test('v1.2.23 · L2-01 (Gauntlet R2) · una foto d’ImageIO llegida del servidor és NETA', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => resposta(url.endsWith('.png') ? PNG_IMAGEIO : JPEG_IMAGEIO)));
    expect(await revisaFotoDIdentitat('sdp-media://mitjans/t/u/avatars/safari.jpg', { resol })).toBe(ESTAT_FOTO_IDENTITAT.NETA);
    expect(await revisaFotoDIdentitat('https://fitxers.test/mitjans/t/u/avatars/safari.png', { resol })).toBe(ESTAT_FOTO_IDENTITAT.NETA);
  });
});

describe('quins camps i quins avisos', () => {
  test('esCampDIdentitat: l’avatar o el logotip de qualsevol mena i la capçalera d’una persona', () => {
    for (const mena of ['persona', 'organitzacio', 'agent']) expect(esCampDIdentitat('logoImage', mena), mena).toBe(true);
    expect(esCampDIdentitat('heroImage', 'persona')).toBe(true);
    expect(esCampDIdentitat('heroImage', 'organitzacio')).toBe(false);
    expect(esCampDIdentitat('heroImage', 'agent')).toBe(false);
    expect(quinaImatgeDIdentitat('logoImage', 'organitzacio')).toBe('logotip');
    expect(quinaImatgeDIdentitat('logoImage', 'agent')).toBe('avatar');
    expect(quinaImatgeDIdentitat('logoImage', 'persona')).toBe('avatar');
    expect(quinaImatgeDIdentitat('heroImage', 'persona')).toBe('capcalera');
  });

  /* v1.2.23 · L2-01 (Gauntlet R2) · Cinc avisos: el que no es podrà comprovar mai (noComprovable) no promet que
     tornar-ho a provar servisca, i el que sí (noComprovada) no diu que es puge des de la fitxa. */
  test('cinc llengües, els cinc avisos a cada una, cap de buit; castellà i anglés no copien el valencià; desconeguda → valencià', () => {
    const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
    const CLAUS = ['avatar', 'logotip', 'capcalera', 'noComprovada', 'noComprovable'];
    expect(Object.keys(TEXTOS_FOTO_NETA_IDENTITAT).sort()).toEqual([...LLENGUES].sort());
    for (const llengua of LLENGUES) {
      expect(Object.keys(TEXTOS_FOTO_NETA_IDENTITAT[llengua]).sort(), llengua).toEqual([...CLAUS].sort());
      for (const clau of CLAUS) {
        expect(TEXTOS_FOTO_NETA_IDENTITAT[llengua][clau].trim().length, `${llengua}.${clau}`).toBeGreaterThan(30);
        if (llengua === 'es' || llengua === 'en') expect(TEXTOS_FOTO_NETA_IDENTITAT[llengua][clau]).not.toBe(TEXTOS_FOTO_NETA_IDENTITAT.ca[clau]);
      }
    }
    expect(TEXTOS_FOTO_NETA_IDENTITAT.ca.noComprovada).toMatch(/Torna-ho a provar/);
    expect(TEXTOS_FOTO_NETA_IDENTITAT.ca.noComprovable).not.toMatch(/Torna-ho a provar/);
    expect(TEXTOS_FOTO_NETA_IDENTITAT.ca.noComprovable).toMatch(/des de la fitxa/);
    expect(TEXTOS_FOTO_NETA_IDENTITAT.ca.noComprovada).not.toMatch(/des de la fitxa/);
    expect(textosFotoNetaIdentitat('fr')).toBe(TEXTOS_FOTO_NETA_IDENTITAT.ca);
    expect(textosFotoNetaIdentitat(undefined)).toBe(TEXTOS_FOTO_NETA_IDENTITAT.ca);
    expect(textosFotoNetaIdentitat('gl')).toBe(TEXTOS_FOTO_NETA_IDENTITAT.gl);
  });
});
