// @vitest-environment node
import { expect, test } from 'vitest';
import { extreuTiff, imatgeSenseUbicacio, incrustaEnJpeg, incrustaEnWebp, preparaTiffSenseUbicacio } from './exifIncrustat.js';
import { llegixExif } from './exif.js';
import { JPEG_NET, WEBP_NET } from '../../../../tests/helpers/mitjansPublicsNets.js';
import { SOI, TIPUS, app1Exif, concatena, dataOriginal, gpsTorre, tiff } from '../../../../tests/helpers/jpegProva.js';
const MARCA = 'GPS-ORFE-MAKERNOTE-NO-PUBLICAR';
const bloc = () => tiff({ ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'CAMERA-SINTETICA' }],
  exif: [...dataOriginal('2017:05:14 10:22:33', '+02:00'), { tag: 0x927c, tipus: TIPUS.BYTE, valors: Array.from(MARCA, c => c.charCodeAt(0)) }],
  gps: [...gpsTorre(), { tag: 20, tipus: TIPUS.RATIONAL, valors: [[38, 1], [35, 1], [3084, 100]] }] });
const llegix = bytes => llegixExif(concatena(SOI, app1Exif(bytes)), { ambCamera: true });

test('TIFF blanc reconstrueix data/càmera, sense GPS normal/destí ni bytes de MakerNote', () => {
  const abans = bloc();
  expect(llegix(abans).gps).toMatchObject({ lat: 38.5919, lng: -0.4184 });
  const net = preparaTiffSenseUbicacio(abans);
  expect(llegix(net)).toMatchObject({ gps: null, dataCaptura: '2017-05-14T10:22:33+02:00', camera: { marca: 'CAMERA-SINTETICA' } });
  expect(new TextDecoder().decode(net)).not.toContain(MARCA);
  const v = new DataView(net.buffer, net.byteOffset, net.byteLength), le = v.getUint16(0) === 0x4949, p = v.getUint32(4, le);
  const tags = Array.from({ length: v.getUint16(p, le) }, (_, i) => v.getUint16(p + 2 + i * 12, le));
  expect(tags).not.toContain(0x8825);
  expect(preparaTiffSenseUbicacio(net)).toEqual(net);
});

test.each([['JPEG', JPEG_NET, incrustaEnJpeg], ['WebP', WEBP_NET, incrustaEnWebp]])('%s: sanejament per bytes sense GPS, estable al reintent i sense modificar l’entrada', (_format, raster, incrusta) => {
  const brut = incrusta(raster, bloc()), copia = brut.slice();
  const net = imatgeSenseUbicacio(brut);
  expect(llegix(extreuTiff(net.bytes))).toMatchObject({ gps: null, dataCaptura: '2017-05-14T10:22:33+02:00' });
  expect(new TextDecoder().decode(net.bytes)).not.toContain(MARCA);
  expect(imatgeSenseUbicacio(net.bytes).bytes).toEqual(net.bytes);
  expect(brut).toEqual(copia);
});

test('GPS sense cap data/càmera desapareix sencer; TIFF invàlid no s’hi reinserix', () => {
  expect(preparaTiffSenseUbicacio(tiff({ gps: gpsTorre() }))).toBeNull();
  expect(preparaTiffSenseUbicacio(tiff({ gps: gpsTorre(), punterGps: 0xffff }))).toBeNull();
  expect(imatgeSenseUbicacio(new Uint8Array(5 * 1024 * 1024 + 1))).toBeNull();
  expect(imatgeSenseUbicacio(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
});
