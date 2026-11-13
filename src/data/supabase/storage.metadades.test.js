// @vitest-environment node
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { JPEG_NET, WEBP_NET, unix } from '../../../tests/helpers/mitjansPublicsNets.js';
import { netejaImatgePublica } from '../mitjansPublicsNets.js';

const m = vi.hoisted(() => ({ baixa: vi.fn(), puja: vi.fn(), entrada: 0 }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: config => config }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => null,
  capturaSessio: () => { const entrada=m.entrada; return () => { if (entrada!==m.entrada) throw new DOMException('Sessió canviada.','AbortError'); }; } }));
vi.mock('./config.js', () => {
  const storage = { from: bucket => ({ download: (...args) => m.baixa(bucket,...args), upload: (...args) => m.puja(bucket,...args) }) };
  return { getClient: async () => ({ storage }) };
});
import { promoteToPublic } from './storage.js';

const DIR = '11000000-0000-4000-8000-000000000001/33000000-0000-4000-8000-000000000001/notes/';
const REF = `sdp-media://mitjans_privats/${DIR}original.jpg`;
const GPS = new TextEncoder().encode('Exif\0\0 GPSLatitude=38.1 GPSLongitude=-0.2 propietari@prova.invalid');
const BRUT = unix(JPEG_NET.subarray(0,2),Uint8Array.of(255,225,0,GPS.length+2),GPS,JPEG_NET.subarray(2));
const NET = netejaImatgePublica(BRUT,'image/jpeg').bytes;
const PATH = `${DIR}sdp-net-v1-${createHash('sha256').update(NET).digest('hex')}.jpg`;
const PUBLICA = `sdp-media://mitjans/${PATH}`;
let privat, publics;
beforeEach(() => {
  m.entrada++; m.baixa.mockReset(); m.puja.mockReset();
  privat = new Blob([BRUT],{type:'image/jpeg'}); publics = new Map();
  m.baixa.mockImplementation(async (bucket,path) => ({ data: bucket==='mitjans_privats' ? privat : publics.get(path), error:null }));
  m.puja.mockImplementation(async (_bucket,path,blob) => {
    if (publics.has(path)) return { data:null,error:{status:409} };
    publics.set(path,blob); return {data:{path},error:null};
  });
});
afterEach(() => vi.restoreAllMocks());

test('la promoció lleva EXIF/GPS abans de la primera escriptura i republicar verifica el duplicat real', async () => {
  expect(await promoteToPublic(REF)).toBe(PUBLICA);
  const publicat = new Uint8Array(await publics.get(PATH).arrayBuffer());
  expect(publicat).toEqual(NET);
  expect(new TextDecoder().decode(publicat)).not.toContain('GPS');
  expect(new Uint8Array(await privat.arrayBuffer())).toEqual(BRUT);
  expect(await promoteToPublic(REF)).toBe(PUBLICA);
  expect(m.baixa.mock.calls.some(([bucket,path])=>bucket==='mitjans'&&path===PATH)).toBe(true);
  expect(m.puja).toHaveBeenCalledTimes(2);
});

test('un objecte anterior amb EXIF o amb bytes distints mai passa pel simple fet de donar 409', async () => {
  for (const blob of [privat,new Blob([new Uint8Array(NET.length)],{type:'image/jpeg'})]) {
    publics.set(PATH,blob);
    expect(await promoteToPublic(REF)).toBe(REF);
    expect(publics.get(PATH)).toBe(blob);
  }
});

test('un duplicat que no es pot verificar queda privat', async () => {
  publics.set(PATH,new Blob([NET],{type:'image/jpeg'}));
  m.baixa.mockImplementation(async bucket => bucket==='mitjans_privats' ? {data:privat,error:null} : {data:null,error:{status:403}});
  expect(await promoteToPublic(REF)).toBe(REF);
});

test('PDF, AVIF, bytes falsos, MIME creuat i més de 5MiB no originen cap pujada pública', async () => {
  for (const blob of [new Blob(['GPS'],{type:'application/pdf'}),new Blob(['GPS'],{type:'image/avif'}),
    new Blob(['GPS'],{type:'image/jpeg'}),new Blob([WEBP_NET],{type:'image/jpeg'}),new Blob([new Uint8Array(5_242_881)],{type:'image/webp'})]) {
    privat=blob;
    expect(await promoteToPublic(REF)).toBe(REF);
  }
  expect(m.puja).not.toHaveBeenCalled();
});

test('les referències públiques legítimes continuen intactes i el marc passa al nou derivat', async () => {
  for (const ref of [`sdp-media://mitjans/${DIR}antic.webp`,'https://media.example.test/foto.webp']) expect(await promoteToPublic(ref)).toBe(ref);
  expect(m.baixa).not.toHaveBeenCalled();
  const marc='#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6';
  expect(await promoteToPublic(`${REF}${marc}`)).toBe(`${PUBLICA}${marc}`);
});

test('canviar de sessió durant la baixada o avortar abans de publicar impedix la pujada', async () => {
  m.baixa.mockImplementationOnce(async () => {m.entrada++;return {data:privat,error:null};});
  await expect(promoteToPublic(REF)).rejects.toMatchObject({name:'AbortError'});
  const control=new AbortController();control.abort();
  await expect(promoteToPublic(REF,{signal:control.signal})).rejects.toMatchObject({name:'AbortError'});
  expect(m.puja).not.toHaveBeenCalled();
});

/* Gauntlet R22 (dades-06, honestedat-06) · La casella «Conserva la ubicació i la data de la foto» i la política 2.5
   servida diuen que el que es conserva va dins del fitxer publicat. La còpia pública conserva el bloc EXIF preparat
   que porta el fitxer privat (la tria de la persona) i lleva tota la resta de metadades. */
test('el bloc EXIF triat (GPS i data) passa a la còpia pública; XMP i comentaris, no', async () => {
  const { tiff, gpsTorre, dataOriginal, app1Exif, segment } = await import('../../../tests/helpers/jpegProva.js');
  const { preparaTiff } = await import('../../components/universal/enquadrament/exifIncrustat.js');
  const { llegixExif } = await import('../../components/universal/enquadrament/exif.js');
  const triat = preparaTiff(tiff({ gps: gpsTorre(), exif: dataOriginal('2026:10:16 10:00:00') }));
  expect(triat).not.toBeNull();
  const xmp = segment(0xe1, new TextEncoder().encode('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>propietari@prova.invalid</x:xmpmeta>'));
  const com = segment(0xfe, new TextEncoder().encode('comentari privat'));
  privat = new Blob([unix(JPEG_NET.subarray(0, 2), app1Exif(triat), xmp, com, JPEG_NET.subarray(2))], { type: 'image/jpeg' });
  const ref = await promoteToPublic(REF);
  expect(ref).toMatch(/^sdp-media:\/\/mitjans\/.+\/sdp-net-v1-[0-9a-f]{64}\.jpg$/);
  const publicat = new Uint8Array(await publics.get(ref.replace('sdp-media://mitjans/', '')).arrayBuffer());
  const llegit = llegixExif(publicat);
  expect(llegit.gps).toMatchObject({ lat: expect.closeTo(38.5919, 3), lng: expect.closeTo(-0.4184, 3) });
  expect(llegit.dataCaptura).toBe('2026-10-16T10:00:00');
  const text = new TextDecoder('latin1').decode(publicat);
  expect(text).not.toContain('xmpmeta');
  expect(text).not.toContain('comentari privat');
  expect(text).not.toContain('propietari@prova.invalid');
  // La resta del fitxer és la còpia neta: sense el bloc triat, els mateixos bytes que netejaImatgePublica.
  expect(netejaImatgePublica(publicat, 'image/jpeg').bytes).toEqual(netejaImatgePublica(new Uint8Array(await privat.arrayBuffer()), 'image/jpeg').bytes);
});

test('en WebP, el bloc triat també passa (tros EXIF i bit E de VP8X)', async () => {
  const { tiff, gpsTorre } = await import('../../../tests/helpers/jpegProva.js');
  const { preparaTiff, incrustaEnWebp } = await import('../../components/universal/enquadrament/exifIncrustat.js');
  const { llegixExif } = await import('../../components/universal/enquadrament/exif.js');
  const ambExif = incrustaEnWebp(WEBP_NET, preparaTiff(tiff({ gps: gpsTorre() })));
  privat = new Blob([ambExif], { type: 'image/webp' });
  const ref = await promoteToPublic(`sdp-media://mitjans_privats/${DIR}original.webp`);
  const publicat = new Uint8Array(await publics.get(ref.replace('sdp-media://mitjans/', '')).arrayBuffer());
  expect(llegixExif(publicat).gps).not.toBeNull();
});

test('si la persona ha desmarcat la casella (cap bloc al fitxer privat), la còpia pública ix sense ubicació ni data', async () => {
  const { llegixExif } = await import('../../components/universal/enquadrament/exif.js');
  privat = new Blob([WEBP_NET], { type: 'image/webp' });
  const ref = await promoteToPublic(`sdp-media://mitjans_privats/${DIR}original.webp`);
  const publicat = new Uint8Array(await publics.get(ref.replace('sdp-media://mitjans/', '')).arrayBuffer());
  expect(publicat).toEqual(netejaImatgePublica(WEBP_NET, 'image/webp').bytes);
  expect(llegixExif(publicat)).toMatchObject({ gps: null, dataCaptura: null });
});

/* Gauntlet R22 (ronda 3, privadesa) · El fitxer privat porta el bloc que preparaTiff ha deixat sencer (la
   descripció, el programari, l'autoria, els drets, un comentari, el MakerNote, els números de sèrie, el nom de qui
   té la càmera i les dades de la càmera). La còpia pública només en porta el que diu la casella. */
describe('R22 (ronda 3) · la còpia pública porta les etiquetes triades, no el bloc EXIF sencer', () => {
  const SECRETS = ['SECRET-DESCRIPCIO-PRIVADA', 'PROGRAMARI-SECRET', 'AUTORA-SECRETA', 'DRETS-SECRETS', 'COMENTARI-SECRET',
    'MAKERNOTE-SECRET', 'PROPIETARIA-SECRETA', 'SN-COS-123456', 'SN-OBJECTIU-999', 'CARRER-SECRET-3'];
  async function exifPle({ ubicacio = true } = {}) {
    const { tiff, gpsTorre, dataOriginal, TIPUS } = await import('../../../tests/helpers/jpegProva.js');
    const text = (tag, valors) => ({ tag, tipus: TIPUS.ASCII, valors });
    const bytes = (tag, valor) => ({ tag, tipus: TIPUS.BYTE, valors: [...new TextEncoder().encode(valor)] });
    return tiff({
      ifd0: [text(0x010e, 'SECRET-DESCRIPCIO-PRIVADA'), text(0x010f, 'MARCA-CAMERA'), text(0x0110, 'MODEL-CAMERA'),
        text(0x0131, 'PROGRAMARI-SECRET'), ...(ubicacio ? [text(0x0132, '2026:10:16 10:00:00')] : []), text(0x013b, 'AUTORA-SECRETA'),
        text(0x8298, 'DRETS-SECRETS')],
      exif: [...(ubicacio ? dataOriginal('2026:10:16 10:00:00') : []), bytes(0x9286, 'ASCII\0\0\0COMENTARI-SECRET'),
        bytes(0x927c, 'MAKERNOTE-SECRET-0123456789'), text(0xa430, 'PROPIETARIA-SECRETA'), text(0xa431, 'SN-COS-123456'),
        text(0xa434, 'MODEL-OBJECTIU'), text(0xa435, 'SN-OBJECTIU-999')],
      gps: ubicacio ? [...gpsTorre(), bytes(28, 'ASCII\0\0\0CARRER-SECRET-3')] : null,
    });
  }
  async function publica(bloc, format) {
    const { app1Exif } = await import('../../../tests/helpers/jpegProva.js');
    const { preparaTiff, incrustaEnWebp } = await import('../../components/universal/enquadrament/exifIncrustat.js');
    const privatPle = preparaTiff(bloc);
    // L'abans: el fitxer privat (i la còpia pública d'abans) porta el bloc sencer.
    for (const secret of ['SECRET-DESCRIPCIO-PRIVADA', 'MAKERNOTE-SECRET', 'PROPIETARIA-SECRETA', 'SN-COS-123456']) {
      expect(new TextDecoder('latin1').decode(privatPle), secret).toContain(secret);
    }
    privat = format === 'jpeg'
      ? new Blob([unix(JPEG_NET.subarray(0, 2), app1Exif(privatPle), JPEG_NET.subarray(2))], { type: 'image/jpeg' })
      : new Blob([incrustaEnWebp(WEBP_NET, privatPle)], { type: 'image/webp' });
    const ref = await promoteToPublic(`sdp-media://mitjans_privats/${DIR}original.${format === 'jpeg' ? 'jpg' : 'webp'}`);
    return new Uint8Array(await publics.get(ref.replace('sdp-media://mitjans/', '')).arrayBuffer());
  }

  test.each(['jpeg', 'webp'])('%s · «Conserva la ubicació i la data»: la còpia porta el GPS i la data, i res més', async (format) => {
    const { llegixExif } = await import('../../components/universal/enquadrament/exif.js');
    const publicat = await publica(await exifPle(), format);
    const text = new TextDecoder('latin1').decode(publicat);
    for (const dada of [...SECRETS, 'MARCA-CAMERA', 'MODEL-CAMERA', 'MODEL-OBJECTIU']) expect(text, dada).not.toContain(dada);
    const llegit = llegixExif(publicat);
    expect(llegit.gps).toMatchObject({ lat: expect.closeTo(38.5919, 3), lng: expect.closeTo(-0.4184, 3) });
    expect(llegit.dataCaptura).toBe('2026-10-16T10:00:00');
  });

  test('«Conserva les dades de la càmera»: la marca i el model, mai els números de sèrie ni el nom de qui la té', async () => {
    const publicat = await publica(await exifPle({ ubicacio: false }), 'jpeg');
    const text = new TextDecoder('latin1').decode(publicat);
    for (const secret of SECRETS) expect(text, secret).not.toContain(secret);
    for (const dada of ['MARCA-CAMERA', 'MODEL-CAMERA', 'MODEL-OBJECTIU']) expect(text, dada).toContain(dada);
  });
});
