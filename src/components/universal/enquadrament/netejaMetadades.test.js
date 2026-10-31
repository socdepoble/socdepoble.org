import { describe, expect, test } from 'vitest';
import {
  MAX_BYTES_NETEJA, MAX_LONGITUD_DATA_URL, formatImatge, netejaFontImatge, netejaJpeg, netejaMetadades,
  netejaPng, netejaWebp,
} from './netejaMetadades.js';
import { llegixExif, teExif } from './exif.js';
import { segmentOrientacio } from './orientacio.js';
import {
  APP0_JFIF, IMATGE, SOI, app1Exif, concatena, dataOriginal, gpsTorre, jpegAmbExif, orientacio, segment, tiff,
} from '../../../../tests/helpers/jpegProva.js';

/* RICH-EXIF (Onada 4, ADR multimèdia D4) · Fitxers sintètics: cap foto real al
   repositori. Cada prova diu què ix i què NO ix. */

const ascii = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));

function conte(bytes, text) {
  const cerca = ascii(text);
  for (let i = 0; i + cerca.length <= bytes.length; i += 1) {
    let iguals = true;
    for (let k = 0; k < cerca.length && iguals; k += 1) iguals = bytes[i + k] === cerca[k];
    if (iguals) return true;
  }
  return false;
}

function aBase64(bytes) {
  let binari = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binari += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binari);
}
const dataUrl = (tipus, bytes) => `data:${tipus};base64,${aBase64(bytes)}`;
function deDataUrl(url) {
  const binari = atob(url.slice(url.indexOf(',') + 1));
  return Uint8Array.from(binari, (c) => c.charCodeAt(0));
}

/* ─── JPEG ─── */

const EOI = Uint8Array.of(0xff, 0xd9);
const DQT = segment(0xdb, Uint8Array.of(0x00, ...new Array(64).fill(1)));
const SOF0 = segment(0xc0, Uint8Array.of(8, 0, 1, 0, 1, 1, 1, 0x11, 0));
const SOF2 = segment(0xc2, Uint8Array.of(8, 0, 1, 0, 1, 1, 1, 0x11, 0));
const DHT = segment(0xc4, Uint8Array.of(0x00, ...new Array(16).fill(0)));
const APP2_ICC = segment(0xe2, concatena(ascii('ICC_PROFILE\0'), Uint8Array.of(1, 1, 0xaa, 0xbb)));
const APP14_ADOBE = segment(0xee, concatena(ascii('Adobe'), Uint8Array.of(0, 100, 0, 0, 0, 0, 1)));
const APP1_XMP = segment(0xe1, concatena(ascii('http://ns.adobe.com/xap/1.0/\0'), ascii('<x:xmpmeta>GPS 38.59 -0.42</x:xmpmeta>')));
const APP13_IPTC = segment(0xed, concatena(ascii('Photoshop 3.0\0'), ascii('8BIM Carrer Major')));
const APP2_MPF = segment(0xe2, concatena(ascii('MPF\0'), Uint8Array.of(1, 2, 3, 4)));
const APP0_JFXX = segment(0xe0, concatena(ascii('JFXX\0'), Uint8Array.of(0x10, 1, 2, 3)));
const APP12_DUCKY = segment(0xec, concatena(ascii('Ducky'), Uint8Array.of(1)));
const COMENTARI = segment(0xfe, ascii('Casa del Mestre'));
const SOS_CAP = Uint8Array.of(0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00);

const FOTO_GPS = jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() });

/* La imatge: des del primer SOS fins al final, recorrent els segments com un lector. */
function desDeSos(bytes) {
  let pos = 2;
  while (bytes[pos + 1] !== 0xda) pos += 2 + ((bytes[pos + 2] << 8) | bytes[pos + 3]);
  return bytes.subarray(pos);
}

function esperaSenseRastre(bytes) {
  expect(teExif(bytes)).toBe(false);
  expect(conte(bytes, 'Exif')).toBe(false);
  expect(llegixExif(bytes)).toEqual({ orientacio: null, gps: null, dataCaptura: null });
}

describe('netejaJpeg · fora EXIF, XMP, IPTC i la resta; la imatge, byte a byte', () => {
  test('una foto amb GPS i data: ix sense cap EXIF i la imatge (SOS en avant) és idèntica', () => {
    expect(teExif(FOTO_GPS)).toBe(true);
    expect(llegixExif(FOTO_GPS).gps).not.toBeNull();
    const net = netejaJpeg(FOTO_GPS);
    esperaSenseRastre(net);
    expect([...desDeSos(net)]).toEqual([...desDeSos(FOTO_GPS)]);
    expect([...net]).toEqual([...concatena(SOI, APP0_JFIF, IMATGE)]);
  });

  test('es queden APP0 JFIF, APP2 ICC, APP14 Adobe i les taules, en el mateix ordre i sense tocar', () => {
    const brut = concatena(
      SOI, APP0_JFIF, app1Exif(tiff({ gps: gpsTorre() })), APP2_ICC, APP1_XMP, APP13_IPTC, APP2_MPF,
      APP0_JFXX, APP12_DUCKY, COMENTARI, APP14_ADOBE, DQT, SOF0, DHT, IMATGE,
    );
    const net = netejaJpeg(brut);
    expect([...net]).toEqual([...concatena(SOI, APP0_JFIF, APP2_ICC, APP14_ADOBE, DQT, SOF0, DHT, IMATGE)]);
    for (const rastre of ['Exif', 'xap', 'Photoshop', 'MPF', 'JFXX', 'Ducky', 'Casa']) expect(conte(net, rastre)).toBe(false);
  });

  test('orientació 6: el GPS se’n va i l’orientació torna en un APP1 nou i mínim, després del JFIF', () => {
    const brut = jpegAmbExif({ ifd0: [orientacio(6)], exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() });
    const net = netejaJpeg(brut);
    expect([...net]).toEqual([...concatena(SOI, APP0_JFIF, segmentOrientacio(6), IMATGE)]);
    expect(llegixExif(net)).toEqual({ orientacio: 6, gps: null, dataCaptura: null });
    // Ja net, no es torna a escriure: la mateixa referència.
    expect(netejaJpeg(net)).toBe(net);
  });

  test('orientació sense APP0: l’APP1 mínim va just després de SOI; l’orientació 1 no escriu res', () => {
    const sense = concatena(SOI, app1Exif(tiff({ ifd0: [orientacio(3)], gps: gpsTorre() })), DQT, IMATGE);
    expect([...netejaJpeg(sense)]).toEqual([...concatena(SOI, segmentOrientacio(3), DQT, IMATGE)]);
    const dreta = jpegAmbExif({ ifd0: [orientacio(1)], gps: gpsTorre() });
    esperaSenseRastre(netejaJpeg(dreta));
  });

  test('progressiu: les dades amb FF00, RSTn i farciment es copien tal qual; l’APP1 i el COM entre passades se’n van', () => {
    const ENTROPIA_1 = Uint8Array.of(0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56, 0xff, 0xd1, 0x78);
    const ENTROPIA_2 = Uint8Array.of(0x9a, 0xff, 0x00, 0xbc, 0xff, 0xff); // dos bytes de farciment abans d'EOI
    const brut = concatena(SOI, APP0_JFIF, DQT, SOF2, DHT, SOS_CAP, ENTROPIA_1, APP1_XMP, DHT, SOS_CAP, ENTROPIA_2, COMENTARI, EOI);
    const net = netejaJpeg(brut);
    expect([...net]).toEqual([...concatena(SOI, APP0_JFIF, DQT, SOF2, DHT, SOS_CAP, ENTROPIA_1, DHT, SOS_CAP, ENTROPIA_2, EOI)]);
  });

  test('el que va darrere d’EOI (foto en moviment, imatge annexa amb el seu EXIF) es queda fora', () => {
    const brut = concatena(SOI, APP0_JFIF, IMATGE, FOTO_GPS, ascii('ftypmp42 GPS'));
    const net = netejaJpeg(brut);
    expect([...net]).toEqual([...concatena(SOI, APP0_JFIF, IMATGE)]);
    expect(conte(net, 'Exif')).toBe(false);
  });

  test('una foto ja neta torna la mateixa referència (res a tornar a escriure)', () => {
    const neta = concatena(SOI, APP0_JFIF, APP2_ICC, APP14_ADOBE, DQT, SOF0, DHT, IMATGE);
    expect(netejaJpeg(neta)).toBe(neta);
  });

  test.each([
    ['truncada (sense EOI)', FOTO_GPS.subarray(0, FOTO_GPS.length - 2)],
    ['un segment més llarg que el fitxer', concatena(SOI, Uint8Array.of(0xff, 0xe1, 0xff, 0xff, 1, 2), IMATGE)],
    ['una longitud menor que 2', concatena(SOI, Uint8Array.of(0xff, 0xdb, 0x00, 0x01), IMATGE)],
    ['sense SOS', concatena(SOI, APP0_JFIF, EOI)],
    ['un marcador reservat', concatena(SOI, segment(0x50, Uint8Array.of(1)), IMATGE)],
    ['bytes solts entre segments', concatena(SOI, APP0_JFIF, Uint8Array.of(0x00), IMATGE)],
    ['un segon SOI', concatena(SOI, SOI, IMATGE)],
    ['un FF a l’últim byte de les dades', concatena(SOI, SOS_CAP, Uint8Array.of(0x11, 0xff))],
  ])('mal formada → null (qui crida la lleva): %s', (_cas, bytes) => {
    expect(netejaJpeg(bytes)).toBeNull();
  });

  test('entrades que no són bytes → null, sense llançar', () => {
    for (const entrada of [null, undefined, 'FFD8', 42, {}, new Uint8Array(0)]) expect(netejaJpeg(entrada)).toBeNull();
  });

  test('límit dur: fins a MAX_BYTES_NETEJA sí; un byte més, no', () => {
    const fixa = SOI.length + APP0_JFIF.length + SOS_CAP.length + EOI.length;
    const justa = concatena(SOI, APP0_JFIF, SOS_CAP, new Uint8Array(MAX_BYTES_NETEJA - fixa), EOI);
    expect(justa.length).toBe(MAX_BYTES_NETEJA);
    expect(netejaJpeg(justa)).toBe(justa);
    const massa = concatena(SOI, APP0_JFIF, SOS_CAP, new Uint8Array(MAX_BYTES_NETEJA - fixa + 1), EOI);
    expect(netejaJpeg(massa)).toBeNull();
  });
});

/* ─── PNG ─── */

const TAULA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = TAULA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function tros(tipus, dades = new Uint8Array(0)) {
  const t = ascii(tipus);
  const eixida = new Uint8Array(12 + dades.length);
  const v = new DataView(eixida.buffer);
  v.setUint32(0, dades.length);
  eixida.set(t, 4);
  eixida.set(dades, 8);
  v.setUint32(8 + dades.length, crc32(concatena(t, dades)));
  return eixida;
}
/* Cada tros de l'eixida: el tipus i si el CRC encara quadra. */
function trossosPng(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const llista = [];
  for (let pos = 8; pos < bytes.length;) {
    const n = v.getUint32(pos);
    const tipus = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8));
    llista.push({ tipus, crcBo: crc32(bytes.subarray(pos + 4, pos + 8 + n)) === v.getUint32(pos + 8 + n) });
    pos += 12 + n;
  }
  return llista;
}

const FIRMA_PNG = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const IHDR = tros('IHDR', Uint8Array.of(0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0));
const ICCP = tros('iCCP', concatena(ascii('sRGB\0'), Uint8Array.of(0, 0x78, 0x9c)));
const SRGB = tros('sRGB', Uint8Array.of(0));
const GAMA = tros('gAMA', Uint8Array.of(0, 0, 0xb1, 0x8f));
const PHYS = tros('pHYs', Uint8Array.of(0, 0, 0x0b, 0x13, 0, 0, 0x0b, 0x13, 1));
const IDAT = tros('IDAT', Uint8Array.of(0x78, 0x9c, 0x63, 0x60, 0, 0, 0, 2, 0, 1));
const IEND = tros('IEND');
const EXIF_PNG = tros('eXIf', tiff({ gps: gpsTorre() }));
const TEXT = tros('tEXt', ascii('Comment\0Casa del Mestre'));
const ITXT = tros('iTXt', ascii('XML:com.adobe.xmp\0\0\0\0\0<x:xmpmeta>GPS</x:xmpmeta>'));
const ZTXT = tros('zTXt', ascii('Author\0\0xx'));
const TIME = tros('tIME', Uint8Array.of(0x07, 0xe1, 5, 14, 10, 22, 33));
const CABX = tros('caBX', ascii('jumb c2pa'));

describe('netejaPng · fora eXIf, tEXt, iTXt, zTXt, tIME i desconeguts; els CRC dels que es queden, intactes', () => {
  test('un PNG amb GPS i textos ix només amb el que pinta', () => {
    const brut = concatena(FIRMA_PNG, IHDR, ICCP, EXIF_PNG, SRGB, TEXT, GAMA, ITXT, PHYS, ZTXT, TIME, CABX, IDAT, IEND);
    const net = netejaPng(brut);
    expect([...net]).toEqual([...concatena(FIRMA_PNG, IHDR, ICCP, SRGB, GAMA, PHYS, IDAT, IEND)]);
    expect(trossosPng(net)).toEqual(['IHDR', 'iCCP', 'sRGB', 'gAMA', 'pHYs', 'IDAT', 'IEND'].map((tipus) => ({ tipus, crcBo: true })));
    for (const rastre of ['eXIf', 'Casa', 'xmpmeta', 'Author', 'tIME', 'c2pa']) expect(conte(net, rastre)).toBe(false);
  });

  test('l’animació (APNG) i diversos IDAT es queden; el que va darrere d’IEND, no', () => {
    const ACTL = tros('acTL', Uint8Array.of(0, 0, 0, 2, 0, 0, 0, 0));
    const FCTL = tros('fcTL', new Uint8Array(26));
    const FDAT = tros('fdAT', Uint8Array.of(0, 0, 0, 1, 0x78, 0x9c));
    const brut = concatena(FIRMA_PNG, IHDR, ACTL, FCTL, IDAT, IDAT, FCTL, FDAT, IEND, EXIF_PNG);
    expect([...netejaPng(brut)]).toEqual([...concatena(FIRMA_PNG, IHDR, ACTL, FCTL, IDAT, IDAT, FCTL, FDAT, IEND)]);
  });

  test('un PNG ja net torna la mateixa referència', () => {
    const net = concatena(FIRMA_PNG, IHDR, SRGB, IDAT, IEND);
    expect(netejaPng(net)).toBe(net);
  });

  test.each([
    ['sense IHDR al principi', concatena(FIRMA_PNG, SRGB, IHDR, IDAT, IEND)],
    ['un tros truncat', concatena(FIRMA_PNG, IHDR, IDAT, IEND).subarray(0, 8 + IHDR.length + 10)],
    ['sense IEND', concatena(FIRMA_PNG, IHDR, IDAT)],
    ['sense IDAT', concatena(FIRMA_PNG, IHDR, IEND)],
    ['un tros crític desconegut', concatena(FIRMA_PNG, IHDR, tros('ABCD', Uint8Array.of(1)), IDAT, IEND)],
    ['un tipus que no són lletres', concatena(FIRMA_PNG, IHDR, tros('a1b2', Uint8Array.of(1)), IDAT, IEND)],
    ['firma trencada', concatena(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0), IHDR, IDAT, IEND)],
  ])('mal format → null: %s', (_cas, bytes) => {
    expect(netejaPng(bytes)).toBeNull();
  });
});

/* ─── WebP ─── */

function trosRiff(tipus, dades) {
  const eixida = new Uint8Array(8 + dades.length + (dades.length & 1));
  eixida.set(ascii(tipus));
  new DataView(eixida.buffer).setUint32(4, dades.length, true);
  eixida.set(dades, 8);
  return eixida;
}
function webp(...trossos) {
  const cos = concatena(ascii('WEBP'), ...trossos);
  const capcalera = ascii('RIFF\0\0\0\0');
  new DataView(capcalera.buffer).setUint32(4, cos.length, true);
  return concatena(capcalera, cos);
}
const VP8X = (banderes) => trosRiff('VP8X', Uint8Array.of(banderes, 0, 0, 0, 0, 0, 0, 0, 0, 0));
const ICCP_WEBP = trosRiff('ICCP', Uint8Array.of(1, 2, 3, 4));
const ALPH = trosRiff('ALPH', Uint8Array.of(0, 9, 9));
const VP8 = trosRiff('VP8 ', Uint8Array.of(1, 2, 3, 4, 5)); // senar: porta farciment
const VP8L = trosRiff('VP8L', Uint8Array.of(0x2f, 0, 0, 0, 0));
const EXIF_WEBP = trosRiff('EXIF', tiff({ gps: gpsTorre() }));
const XMP_WEBP = trosRiff('XMP ', ascii('<x:xmpmeta>Casa</x:xmpmeta>'));
const [I, L, E, X] = [0x20, 0x10, 0x08, 0x04];

describe('netejaWebp · fora EXIF i XMP; mida RIFF i banderes de VP8X corregides', () => {
  test('un WebP ampliat amb EXIF i XMP ix amb ICCP, ALPH i VP8, i sense les banderes E i X', () => {
    const brut = webp(VP8X(I | L | E | X), ICCP_WEBP, ALPH, VP8, EXIF_WEBP, XMP_WEBP);
    const net = netejaWebp(brut);
    expect([...net]).toEqual([...webp(VP8X(I | L), ICCP_WEBP, ALPH, VP8)]);
    expect(new DataView(net.buffer).getUint32(4, true)).toBe(net.length - 8);
    for (const rastre of ['EXIF', 'XMP ', 'Casa']) expect(conte(net, rastre)).toBe(false);
  });

  test('banderes E/X posades sense cap tros: es netegen igualment; un tros desconegut se’n va', () => {
    expect([...netejaWebp(webp(VP8X(E | X), VP8L))]).toEqual([...webp(VP8X(0), VP8L)]);
    expect([...netejaWebp(webp(VP8X(0), trosRiff('ABCD', Uint8Array.of(1, 2)), VP8L))]).toEqual([...webp(VP8X(0), VP8L)]);
  });

  test('el que va darrere del RIFF es queda fora; un WebP simple i net torna la mateixa referència', () => {
    expect([...netejaWebp(concatena(webp(VP8L), EXIF_WEBP))]).toEqual([...webp(VP8L)]);
    const simple = webp(VP8);
    expect(netejaWebp(simple)).toBe(simple);
  });

  test.each([
    ['mida RIFF més gran que el fitxer', webp(VP8L).subarray(0, 20)],
    // RIFF de 16 bytes, sencer; el VP8L diu 255 i només en porta 4.
    ['un tros que ix del RIFF', concatena(ascii('RIFF'), Uint8Array.of(16, 0, 0, 0), ascii('WEBP'), ascii('VP8L'), Uint8Array.of(0xff, 0, 0, 0), new Uint8Array(4))],
    ['el primer tros no és d’imatge', webp(EXIF_WEBP, VP8L)],
    ['VP8X fora del principi', webp(VP8L, VP8X(0))],
    ['sense cap tros d’imatge', webp(VP8X(0), ICCP_WEBP)],
    ['un VP8X massa curt', webp(trosRiff('VP8X', Uint8Array.of(0, 0)), VP8L)],
  ])('mal format → null: %s', (_cas, bytes) => {
    expect(netejaWebp(bytes)).toBeNull();
  });
});

describe('netejaMetadades · el format el diuen els bytes', () => {
  test('JPEG, PNG i WebP es reconeixen; GIF, AVIF i bytes qualssevol, no', () => {
    expect(formatImatge(FOTO_GPS)).toBe('image/jpeg');
    expect(formatImatge(concatena(FIRMA_PNG, IHDR, IDAT, IEND))).toBe('image/png');
    expect(formatImatge(webp(VP8L))).toBe('image/webp');
    expect(netejaMetadades(ascii('GIF89a\x01\0\x01\0\0\0\0;'))).toBeNull();
    expect(netejaMetadades(concatena(Uint8Array.of(0, 0, 0, 0x1c), ascii('ftypavif'), new Uint8Array(16)))).toBeNull();
    expect(netejaMetadades(new Uint8Array(64))).toBeNull();
  });

  test('torna { format, bytes, canviat }', () => {
    const r = netejaMetadades(FOTO_GPS);
    expect(r.format).toBe('image/jpeg');
    expect(r.canviat).toBe(true);
    esperaSenseRastre(r.bytes);
    const neta = concatena(FIRMA_PNG, IHDR, IDAT, IEND);
    expect(netejaMetadades(neta)).toEqual({ format: 'image/png', bytes: neta, canviat: false });
  });
});

describe('netejaFontImatge · la font d’una <img> enganxada', () => {
  test('el que no és un data URL d’imatge no es toca (ho decidix el sanejador)', () => {
    for (const src of ['https://socdepoble.org/a.jpg', 'sdp-media://mitjans/t/u/a.webp', '/assets/a.png',
      'data:text/html;base64,PHNjcmlwdD4=', 'data:,hola', 'data:;base64,AAAA', 'data:application/octet-stream;base64,/9j/']) {
      expect(netejaFontImatge(src)).toBe(src);
    }
    expect(netejaFontImatge(null)).toBeNull();
  });

  test('JPEG amb GPS: data URL nou, sense EXIF, i la imatge idèntica', () => {
    const net = netejaFontImatge(dataUrl('image/jpeg', FOTO_GPS));
    expect(net.startsWith('data:image/jpeg;base64,')).toBe(true);
    const bytes = deDataUrl(net);
    esperaSenseRastre(bytes);
    expect([...desDeSos(bytes)]).toEqual([...desDeSos(FOTO_GPS)]);
  });

  test('PNG amb eXIf i WebP amb EXIF també ixen nets', () => {
    const png = deDataUrl(netejaFontImatge(dataUrl('image/png', concatena(FIRMA_PNG, IHDR, EXIF_PNG, IDAT, IEND))));
    expect([...png]).toEqual([...concatena(FIRMA_PNG, IHDR, IDAT, IEND)]);
    const wp = deDataUrl(netejaFontImatge(dataUrl('image/webp', webp(VP8X(E), VP8L, EXIF_WEBP))));
    expect([...wp]).toEqual([...webp(VP8X(0), VP8L)]);
  });

  test('una imatge ja neta i canònica torna la MATEIXA cadena', () => {
    const src = dataUrl('image/webp', webp(VP8L));
    expect(netejaFontImatge(src)).toBe(src);
  });

  test('capçalera canònica: fora paràmetres com el nom del fitxer, i el tipus de veres', () => {
    const neta = concatena(SOI, APP0_JFIF, IMATGE);
    const ambNom = `data:image/jpeg;name=casa_38.59_-0.42.jpg;base64,${aBase64(neta)}`;
    expect(netejaFontImatge(ambNom)).toBe(`data:image/jpeg;base64,${aBase64(neta)}`);
    // Diu PNG però és un JPEG: es neteja com a JPEG i ho diu.
    expect(netejaFontImatge(dataUrl('image/png', FOTO_GPS)).startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(netejaFontImatge(`DATA:IMAGE/JPG;BASE64,${aBase64(neta)}`)).toBe(`data:image/jpeg;base64,${aBase64(neta)}`);
  });

  test('base64 tallat en línies (correus): s’accepta i ix sense espais', () => {
    const b64 = aBase64(FOTO_GPS).replace(/.{0,76}/g, '$&\r\n');
    const net = netejaFontImatge(`data:image/jpeg;base64,${b64}`);
    expect(/\s/.test(net)).toBe(false);
    esperaSenseRastre(deDataUrl(net));
  });

  test.each([
    ['GIF', `data:image/gif;base64,${aBase64(ascii('GIF89a\x01\0\x01\0\0\0\0;'))}`],
    ['SVG en text', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>'],
    ['JPEG sense base64', `data:image/jpeg,${encodeURIComponent(String.fromCharCode(...FOTO_GPS))}`],
    ['sense coma', 'data:image/jpeg;base64'],
    ['base64 invàlid', 'data:image/jpeg;base64,%%%'],
    ['JPEG mal format', dataUrl('image/jpeg', FOTO_GPS.subarray(0, 40))],
  ])('imatge que no es pot netejar → null (es lleva): %s', (_cas, src) => {
    expect(netejaFontImatge(src)).toBeNull();
  });

  test('límits durs: un data URL massa llarg es descarta sense descodificar-lo; una imatge massa pesada també', () => {
    expect(netejaFontImatge(`data:image/jpeg;base64,${'A'.repeat(MAX_LONGITUD_DATA_URL)}`)).toBeNull();
    const fixa = SOI.length + APP0_JFIF.length + SOS_CAP.length + EOI.length;
    const pesada = concatena(SOI, APP0_JFIF, SOS_CAP, new Uint8Array(MAX_BYTES_NETEJA - fixa + 1), EOI);
    const src = dataUrl('image/jpeg', pesada);
    expect(src.length).toBeLessThan(MAX_LONGITUD_DATA_URL);
    expect(netejaFontImatge(src)).toBeNull();
  });
});

/* ─── Revisió adversarial (Onada 4, tercera passada) ─── */

describe('revisió · la font es llig com la llig el navegador', () => {
  test.each([
    ['salt de línia dins de «data:»', (b64) => `data\n:image/jpeg;base64,${b64}`],
    ['tabulador dins de l’esquema', (b64) => `da\tta:image/jpeg;base64,${b64}`],
    ['control C0 davant', (b64) => `\u0001data:image/jpeg;base64,${b64}`],
    ['retorn de carro dins del tipus', (b64) => `data:image/jp\reg;base64,${b64}`],
  ])('%s: el navegador hi veu un data URL, i ix net', (_cas, fes) => {
    const src = fes(aBase64(FOTO_GPS));
    // El lector d'URL (WHATWG) lleva tabuladors i salts de línia, i els controls dels extrems.
    expect(new URL(src).protocol).toBe('data:');
    const net = netejaFontImatge(src);
    expect(net.startsWith('data:image/jpeg;base64,')).toBe(true);
    esperaSenseRastre(deDataUrl(net));
    expect([...desDeSos(deDataUrl(net))]).toEqual([...desDeSos(FOTO_GPS)]);
  });

  test('lineal: milions d’espais i tabuladors dins i als extrems no fan bucles quadràtics', () => {
    const blancs = ' '.repeat(3_000_000);
    expect(netejaFontImatge(`${blancs}data:image/jpeg;base64,${blancs}A${' \t'.repeat(1_000_000)}`)).toBeNull();
    const llarga = `https://socdepoble.org/${blancs}x${blancs}`;
    expect(netejaFontImatge(llarga)).toBe(llarga);
  });

  test('base64 URL-safe («-», «_»): ni el navegador ni atob el lligen → es lleva', () => {
    const urlSafe = aBase64(FOTO_GPS).replace(/\+/g, '-').replace(/\//g, '_');
    expect(urlSafe).toMatch(/[-_]/);
    expect(netejaFontImatge(`data:image/jpeg;base64,${urlSafe}`)).toBeNull();
  });
});

describe('revisió · JPEG: llista blanca de veres', () => {
  test.each([['C8', 0xc8], ['F0', 0xf0], ['F7', 0xf7], ['FD', 0xfd]])('marcador reservat FF%s amb càrrega (JPG, JPGn): fora de la llista → null', (_hex, m) => {
    const brut = concatena(SOI, APP0_JFIF, segment(m, ascii('GPS 38.59 -0.42')), DQT, SOF0, DHT, IMATGE);
    expect(netejaJpeg(brut)).toBeNull();
  });

  test('APP1 Exif darrere de DQT, farciment FF i dos APP1: fora tots; les taules, byte a byte', () => {
    const FARCIMENT = Uint8Array.of(0xff, 0xff);
    const brut = concatena(SOI, APP0_JFIF, DQT, FARCIMENT, app1Exif(tiff({ gps: gpsTorre() })), APP1_XMP, SOF0, DHT, IMATGE);
    expect([...netejaJpeg(brut)]).toEqual([...concatena(SOI, APP0_JFIF, DQT, FARCIMENT, SOF0, DHT, IMATGE)]);
  });

  test('orientació darrere de més de 256 KiB d’ICC: el navegador la llig, i la foto continua dreta', () => {
    const icc = segment(0xe2, concatena(ascii('ICC_PROFILE\0'), new Uint8Array(65000)));
    const brut = concatena(
      SOI, APP0_JFIF, icc, icc, icc, icc, icc, app1Exif(tiff({ ifd0: [orientacio(6)], gps: gpsTorre() })), DQT, IMATGE,
    );
    const net = netejaJpeg(brut);
    expect([...net]).toEqual([...concatena(SOI, APP0_JFIF, segmentOrientacio(6), icc, icc, icc, icc, icc, DQT, IMATGE)]);
    expect(llegixExif(net)).toEqual({ orientacio: 6, gps: null, dataCaptura: null });
  });

  test('pitjor cas lineal: 5 MiB de FF00 a les dades i de farciment entre segments', () => {
    const fixa = SOI.length + APP0_JFIF.length + SOS_CAP.length + EOI.length;
    const entropia = new Uint8Array(MAX_BYTES_NETEJA - fixa);
    for (let i = 0; i + 1 < entropia.length; i += 2) entropia[i] = 0xff;
    const plena = concatena(SOI, APP0_JFIF, SOS_CAP, entropia, EOI);
    expect(netejaJpeg(plena)).toBe(plena);
    const farcida = concatena(SOI, new Uint8Array(MAX_BYTES_NETEJA - fixa).fill(0xff), APP0_JFIF, SOS_CAP, EOI);
    expect(netejaJpeg(farcida)).toBe(farcida);
  });
});

describe('revisió · PNG i WebP: el lloc del tros no el salva', () => {
  test('PNG: eXIf i tEXt entre IDAT i darrere de l’últim IDAT se’n van; els IDAT, intactes', () => {
    const IDAT2 = tros('IDAT', Uint8Array.of(0x00, 0x01));
    const brut = concatena(FIRMA_PNG, IHDR, IDAT, EXIF_PNG, IDAT2, TEXT, EXIF_PNG, IEND);
    expect([...netejaPng(brut)]).toEqual([...concatena(FIRMA_PNG, IHDR, IDAT, IDAT2, IEND)]);
  });

  test('WebP animat: ANIM i cada ANMF byte a byte, fora EXIF i XMP; la bandera A es queda', () => {
    const A = 0x02;
    const ANIM = trosRiff('ANIM', new Uint8Array(6));
    const ANMF1 = trosRiff('ANMF', concatena(new Uint8Array(16), VP8L));
    const ANMF2 = trosRiff('ANMF', concatena(new Uint8Array(16), ALPH, VP8));
    const brut = webp(VP8X(A | L | E | X), ANIM, ANMF1, EXIF_WEBP, ANMF2, XMP_WEBP);
    expect([...netejaWebp(brut)]).toEqual([...webp(VP8X(A | L), ANIM, ANMF1, ANMF2)]);
  });

  test('WebP simple amb pèrdua i un EXIF sense VP8X: fora l’EXIF i la mida RIFF quadra', () => {
    const net = netejaWebp(webp(VP8, EXIF_WEBP));
    expect([...net]).toEqual([...webp(VP8)]);
  });
});
