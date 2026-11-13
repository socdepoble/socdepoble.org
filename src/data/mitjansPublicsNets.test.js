// @vitest-environment node
import { expect, test } from 'vitest';
import { netejaImatgePublica, portaBlocExif } from './mitjansPublicsNets.js';
import { JPEG_NET, PNG_NET, WEBP_NET, unix } from '../../tests/helpers/mitjansPublicsNets.js';

const ascii = s => new TextEncoder().encode(s);
const gps = ascii('GPSLatitude=38.1234 GPSLongitude=-0.5678 propietari@prova.invalid');
function crc(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(nom, bytes) {
  const cos = unix(ascii(nom), bytes), cap = new Uint8Array(4), cua = new Uint8Array(4);
  new DataView(cap.buffer).setUint32(0, bytes.length);
  new DataView(cua.buffer).setUint32(0, crc(cos));
  return unix(cap, cos, cua);
}
function webpChunk(nom, bytes) {
  const cap = new Uint8Array(8); cap.set(ascii(nom));
  new DataView(cap.buffer).setUint32(4, bytes.length, true);
  return unix(cap, bytes, new Uint8Array(bytes.length & 1));
}
function riff(...chunks) {
  const bytes = unix(ascii('RIFF'), new Uint8Array(4), ascii('WEBP'), ...chunks);
  new DataView(bytes.buffer).setUint32(4, bytes.length - 8, true);
  return bytes;
}
function segment(marca, bytes) {
  return unix(Uint8Array.of(0xff, marca, (bytes.length + 2) >>> 8, (bytes.length + 2) & 255), bytes);
}

test('les tres imatges sintètiques reals conserven el contenidor i els píxels, sense mutar l’entrada', () => {
  for (const [mime, original] of [['image/jpeg', JPEG_NET], ['image/png', PNG_NET], ['image/webp', WEBP_NET]]) {
    const abans = original.slice();
    const net = netejaImatgePublica(original, mime);
    expect(original).toEqual(abans);
    expect(netejaImatgePublica(net.bytes, mime).bytes).toEqual(net.bytes);
    expect(net.mime).toBe(mime);
    expect(net.bytes.length).toBeLessThanOrEqual(original.length);
  }
});

test('JPEG elimina EXIF amb IFD GPS, XMP, ICC i comentaris, també després d’un escaneig progressiu', () => {
  // TIFF II, IFD0 amb punter GPS i GPSLatitudeRef: metadades binàries reals.
  const tiff = Uint8Array.of(73,73,42,0,8,0,0,0,1,0,37,136,4,0,1,0,0,0,26,0,0,0,0,0,0,0,
    1,0,1,0,2,0,2,0,0,0,78,0,0,0,0,0,0,0);
  const brut = unix(JPEG_NET.subarray(0,2), segment(0xe1, unix(ascii('Exif\0\0'),tiff)),
    segment(0xe1, unix(ascii('http://ns.adobe.com/xap/1.0/\0'),gps)), segment(0xe2,unix(ascii('ICC_PROFILE\0'),gps)),
    segment(0xfe,gps), JPEG_NET.subarray(2,JPEG_NET.length-2), segment(0xfe,gps), JPEG_NET.subarray(-2));
  expect(netejaImatgePublica(brut,'image/jpeg').bytes).toEqual(netejaImatgePublica(JPEG_NET,'image/jpeg').bytes);
});

test('PNG elimina tots els blocs auxiliars de privacitat, amb CRC vàlid', () => {
  const brut = unix(PNG_NET.subarray(0,33), ...['eXIf','iTXt','tEXt','zTXt','iCCP','tIME','pHYs'].map(nom => pngChunk(nom,gps)), PNG_NET.subarray(33));
  expect(netejaImatgePublica(brut,'image/png').bytes).toEqual(netejaImatgePublica(PNG_NET,'image/png').bytes);
});

test('WebP elimina EXIF/XMP/ICC i chunks desconeguts i reescriu RIFF i els flags VP8X', () => {
  const cap = new Uint8Array(10); cap[0] = 0x2c;
  const brut = riff(webpChunk('VP8X',cap),webpChunk('ICCP',gps),WEBP_NET.subarray(12),webpChunk('EXIF',gps),webpChunk('XMP ',gps),webpChunk('PRIV',gps));
  const net = netejaImatgePublica(brut,'image/webp').bytes;
  expect(net[20]).toBe(0);
  expect(new DataView(net.buffer).getUint32(4,true)).toBe(net.length-8);
  expect(net.subarray(30)).toEqual(WEBP_NET.subarray(12));
  expect(new TextDecoder().decode(net)).not.toContain('GPS');
});

test('metadades o dades afegides després del final, chunks truncats i MIME fals es rebutgen', () => {
  for (const [mime, original] of [['image/jpeg',JPEG_NET],['image/png',PNG_NET],['image/webp',WEBP_NET]]) {
    expect(() => netejaImatgePublica(unix(original,gps),mime)).toThrow();
    expect(() => netejaImatgePublica(original.subarray(0,original.length-1),mime)).toThrow();
    const altre = mime==='image/png' ? 'image/jpeg':'image/png';
    expect(() => netejaImatgePublica(original,altre)).toThrow();
  }
});

test('CRC fals, APNG, WebP animat, JPEG CMYK i formats no admesos fallen de forma tancada', () => {
  const corrupte = PNG_NET.slice(); corrupte[29] ^= 1;
  expect(() => netejaImatgePublica(corrupte,'image/png')).toThrow();
  const apng = unix(PNG_NET.subarray(0,33),pngChunk('acTL',new Uint8Array(8)),PNG_NET.subarray(33));
  expect(() => netejaImatgePublica(apng,'image/png')).toThrow();
  expect(() => netejaImatgePublica(riff(webpChunk('ANIM',new Uint8Array(6)),WEBP_NET.subarray(12)),'image/webp')).toThrow();
  const cmyk = JPEG_NET.slice();
  for (let p=2;p<cmyk.length-8;p++) if(cmyk[p]===255&&cmyk[p+1]===192){cmyk[p+9]=4;break;}
  expect(() => netejaImatgePublica(cmyk,'image/jpeg')).toThrow();
  for (const mime of ['image/avif','image/gif','application/pdf','image/svg+xml','image/webp; charset=x','toString'])
    expect(() => netejaImatgePublica(WEBP_NET,mime)).toThrow();
  expect(() => netejaImatgePublica(new Uint8Array(5_242_881),'image/webp')).toThrow();
});

/* Gauntlet R22 (ronda 3, dades-06) · portaBlocExif decidix si cal demanar el mòdul de l'EXIF: una foto neta, no. */
test('portaBlocExif: un APP1 «Exif» abans de l’escaneig o un tros EXIF del WebP; una foto neta o un altre format, no', () => {
  const tiff = Uint8Array.of(0x4d, 0x4d, 0, 42, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0);
  const app1 = unix(Uint8Array.of(0xff, 0xe1, 0, 2 + 6 + tiff.length), ascii('Exif\0\0'), tiff);
  const ambExifJpeg = unix(JPEG_NET.subarray(0, 2), app1, JPEG_NET.subarray(2));
  const xmp = unix(Uint8Array.of(0xff, 0xe1, 0, 2 + 29), ascii('http://ns.adobe.com/xap/1.0/\0'));
  const tros = unix(ascii('EXIF'), Uint8Array.of(tiff.length, 0, 0, 0), tiff);
  const ambExifWebp = unix(WEBP_NET, tros);
  new DataView(ambExifWebp.buffer).setUint32(4, ambExifWebp.length - 8, true);
  expect(portaBlocExif(ambExifJpeg)).toBe(true);
  expect(portaBlocExif(ambExifWebp)).toBe(true);
  for (const net of [JPEG_NET, WEBP_NET, PNG_NET, unix(JPEG_NET.subarray(0, 2), xmp, JPEG_NET.subarray(2)), new Uint8Array(0), Uint8Array.of(0xff, 0xd8, 0x00), null]) {
    expect(portaBlocExif(net)).toBe(false);
  }
  // Un APP1 «Exif» darrere de l'escaneig no és el que llig el navegador.
  expect(portaBlocExif(unix(JPEG_NET, app1))).toBe(false);
});
