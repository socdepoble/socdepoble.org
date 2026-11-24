// @vitest-environment node
/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · D-V1223-GEOLOC-PER-DEFECTE, deroga el bloqueig per defecte de
   L4-04. Contracte de la preparació i del transport dels adjunts del xat, amb el netejador, l'inspector, el
   constructor del GPS i el transport reals; només la xarxa (RPC, Storage) i el canvas són simulats:
     (a) per defecte la foto i el vídeo amb so conserven el GPS dins del fitxer que es puja;
     (b) la recompressió no perd { lat, lng, altitud }, també quan l'original no porta un EXIF que es puga conservar
         (el lloc rescatat abans de comprimir), i l'orientació que es torna a posar és 1;
     (c) amb «Amaga el lloc» no queda cap GPS ni cap EXIF, ni DTO;
     (d) un vídeo amb so que el navegador no pot netejar i «Amaga el lloc»: no s'envia (cap RPC ni pujada);
     i el reenviament: qui reenvia no és l'autor, la còpia ix sense GPS. (e), a ControlsAdjunt.geolocPerDefecte. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { amagaUbicacioAdjunt, preparaAdjunt } from '../../sections/xat/adjuntLocal.js';
import { publicaAdjuntXat } from './xatMultimedia.js';
import { creaOpcionsMotorAccions } from '../xat/creaOpcionsMotorAccions.js';
import { extreuTiff, imatgeSenseUbicacio } from '../../components/universal/enquadrament/exifIncrustat.js';
import { imatgeAmbUbicacio, tiffDeCoordenades } from '../../components/universal/enquadrament/exifAmbUbicacio.js';
import { llegixExif } from '../../components/universal/enquadrament/exif.js';
import { inspeccionaUbicacioMitja, senseUbicacioVideo } from '../../utils/ubicacioMitjans.js';
import { ascii, box, join, webm } from '../../../tests/helpers/contenidorsMedia.js';
import { caixesPrimerNivell, mp4Fragmentat, offsetsTfra } from '../../../tests/helpers/mp4Fragmentat.js';
import { JPEG_NET, WEBP_NET } from '../../../tests/helpers/mitjansPublicsNets.js';
import { APP0_JFIF, SOI, TIPUS, app1Exif, concatena, dataOriginal, gpsTorre, orientacio, tiff } from '../../../tests/helpers/jpegProva.js';

const m = vi.hoisted(() => ({ rpc: vi.fn(), request: vi.fn(), urlAdjuntXat: vi.fn(), comprimeix: vi.fn(), user: { id: '00000000-0000-4000-8000-000000000001' } }));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: (...args) => m.comprimeix(...args) }));
vi.mock('./runtime.js', () => ({ rpc: m.rpc, request: m.request, getResolvedConfig: () => ({ runtimeDataMode: 'remote', supabaseUrl: 'https://node.test', supabaseAnonKey: 'publica' }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.user, jwtPerBackend: () => 'sessio-test', entradaSessio: () => 1, capturaSessio: () => () => {} }));
vi.mock('../backendPort.js', () => ({ urlAdjuntXat: m.urlAdjuntXat }));

const FIL = '00000000-0000-4000-8000-000000000003';
// La Torre de les Maçanes (gpsTorre): 38° 35' 30,84" N, 0° 25' 6,24" W, i l'altitud a 456,7 m.
const LLOC = { lat: 38.5919, lng: -0.4184, altitud: 456.7 };
const LLOC_APROXIMAT = { lat: 38.59, lng: -0.42 };
const fotoGps = (ifd0 = []) => new Blob([concatena(SOI, APP0_JFIF, app1Exif(tiff({
  ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'CAMERA-SINTETICA' }, ...ifd0],
  exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre(),
})), JPEG_NET.subarray(2))], { type: 'image/jpeg' });
const bytes = async blob => new Uint8Array(await blob.arrayBuffer());
const exifDe = async (blob, opcions) => {
  const t = extreuTiff(await bytes(blob));
  return t ? llegixExif(concatena(SOI, app1Exif(t)), opcions) : null;
};
const dataUrl = (mime, b) => `data:${mime};base64,${Buffer.from(b).toString('base64')}`;
/* El canvas no porta cap EXIF: torna sempre el raster net del format demanat (WebKit, sense WebP: PNG → JPEG). */
const canvas = (mime) => vi.fn(async (_fitxer, opcions) => {
  if (opcions.format === 'image/webp' && mime === 'image/jpeg') return dataUrl('image/png', [1]);
  return dataUrl(mime, mime === 'image/jpeg' ? JPEG_NET : WEBP_NET);
});

/* Un MOV de telèfon amb vídeo i so (i, si cal, una pista de metadades opaca, com la mebx de l'iPhone) i el lloc
   gravat al ©xyz d'udta, amb altitud. */
// Les capçaleres mínimes que validaFitxerMedia exigix (mvhd, tkhd amb ID únic, mdhd, hdlr i minf), com contenidorsMedia.js.
const ambValor = (n, valor, pos) => { const d = new Uint8Array(n); new DataView(d.buffer).setUint32(pos, valor); return d; };
const hdlr = (handler) => { const d = new Uint8Array(24); d.set(ascii(handler), 8); return box('hdlr', d); };
const trak = (handler, id) => box('trak', join(box('tkhd', ambValor(84, id, 12)),
  box('mdia', join(box('mdhd', ambValor(24, 1000, 12)), hdlr(handler), box('minf', box('stbl', new Uint8Array(0)))))));
const ISO = '+38.5919-000.4184+456.7/';
const movAmbSo = ({ opac = false } = {}) => new Blob([box('ftyp', join(ascii('qt  '), new Uint8Array(4), ascii('qt  '))),
  box('moov', join(box('mvhd', ambValor(100, 1000, 12)), trak('vide', 1), trak('soun', 2), ...(opac ? [trak('meta', 3)] : []),
    box('udta', box('©xyz', ascii(ISO))))),
  box('mdat', ascii('MOSTRES-AMB-SO'))], { type: 'video/quicktime' });
const fallbackIphone = { lligDurada: async () => 5000,
  comprimeixVideo: async (fitxer) => ({ fitxer, comprimit: false, motiuFallback: 'video-audio-no-capturable' }) };
const text = async (blob) => new TextDecoder('latin1').decode(await bytes(blob));

const tipusDe = new Map();
beforeEach(() => {
  vi.clearAllMocks(); tipusDe.clear();
  m.comprimeix.mockImplementation(canvas('image/jpeg'));
  m.rpc.mockImplementation(async (nom, p) => {
    if (nom === 'xat_reserva_adjunt') { tipusDe.set(p.p_id, /^video\//.test(p.p_mime) ? 'video' : 'imatge'); return { ruta: p.p_id, pujat: false }; }
    return { id: p.p_id, fil_id: FIL, seq: 1, tipus: tipusDe.get(p.p_id), metadades: p.p_ubicacio ? { ubicacio: p.p_ubicacio } : {} };
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
});
afterEach(() => vi.unstubAllGlobals());
const rpcPublica = () => m.rpc.mock.calls.find(([nom]) => nom === 'xat_publica_adjunt')?.[1];
const pujat = () => fetch.mock.calls[0][1].body;

describe('IDEA-331 (a) · per defecte el contingut conserva el lloc dins del fitxer', () => {
  test.each(['image/jpeg', 'image/webp'])('foto %s: el fitxer pujat porta el GPS i el DTO arrodonit pinta el mapa', async (mime) => {
    const adjunt = await preparaAdjunt(fotoGps(), { comprimeix: canvas(mime) });
    expect(adjunt).toMatchObject({ conservaUbicacio: true, ubicacio: LLOC_APROXIMAT });
    // El que es puja és el punt fix del netejador amb lloc: una passada més no canvia cap byte.
    const preparats = await bytes(adjunt.fitxer);
    expect(imatgeAmbUbicacio(preparats)).toMatchObject({ format: mime, bytes: preparats });
    await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toMatchObject({ metadades: { ubicacio: LLOC_APROXIMAT } });
    expect(pujat().type).toBe(mime);
    expect((await exifDe(pujat())).gps).toEqual(LLOC);
    expect(rpcPublica().p_ubicacio).toEqual(LLOC_APROXIMAT);
  });

  test('vídeo MOV amb so que el navegador no pot recomprimir (iPhone): ix tal com és, amb el lloc', async () => {
    const original = movAmbSo({ opac: true });
    expect((await senseUbicacioVideo(original)).net).toBe(false);
    const adjunt = await preparaAdjunt(original, fallbackIphone);
    expect(adjunt).toMatchObject({ fitxer: original, tipus: 'video', senseUbicacio: false, conservaUbicacio: true, ubicacio: LLOC_APROXIMAT });
    await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toMatchObject({ tipus: 'video', metadades: { ubicacio: LLOC_APROXIMAT } });
    expect(await text(pujat())).toContain(ISO);
    expect(rpcPublica().p_ubicacio).toEqual(LLOC_APROXIMAT);
  });
});

describe('IDEA-331 (b) · la recompressió no perd { lat, lng, altitud }', () => {
  test.each(['image/jpeg', 'image/webp'])('%s: el GPS de l’original arriba sencer, amb la data i la càmera i l’orientació a 1', async (mime) => {
    const original = fotoGps([orientacio(6)]);
    const inspeccio = await inspeccionaUbicacioMitja(original);
    expect(inspeccio.coordenades).toEqual(LLOC);
    const adjunt = await preparaAdjunt(original, { comprimeix: canvas(mime) });
    const exif = await exifDe(adjunt.fitxer, { ambCamera: true });
    expect(exif.gps).toEqual(LLOC);
    expect(exif.orientacio).toBe(1);
    expect(exif.dataCaptura).toBe('2017-05-14T10:22:33+02:00');
    expect(exif.camera.marca).toBe('CAMERA-SINTETICA');
  });

  test('una HEIC que el navegador descodifica: el lloc rescatat abans de comprimir es torna a posar al fitxer', async () => {
    const heic = new Blob([new Uint8Array(64)], { type: 'image/heic' });
    const rescatat = { lat: 39.4699075, lng: -0.3762881, altitud: -3.25 };
    const adjunt = await preparaAdjunt(heic, { comprimeix: canvas('image/jpeg'),
      inspecciona: async () => ({ coordenades: rescatat, completa: true, format: 'heic' }) });
    expect((await exifDe(adjunt.fitxer)).gps).toEqual(rescatat);
    expect(adjunt.ubicacio).toEqual({ lat: 39.47, lng: -0.38 });
    // El transport accepta el mateix punt fix (imatgeAmbUbicacio) i el puja amb el lloc.
    await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toBeTruthy();
    expect((await exifDe(pujat())).gps).toEqual(rescatat);
  });

  test('tiffDeCoordenades: graus, minuts, segons i altitud fan el viatge d’anada i tornada sense pèrdua', () => {
    for (const lloc of [LLOC, { lat: -33.8688197, lng: 151.2092955, altitud: 58 }, { lat: 0.0000001, lng: -179.9999999, altitud: null }]) {
      const bloc = tiffDeCoordenades(lloc);
      expect(llegixExif(concatena(SOI, app1Exif(bloc))).gps).toEqual(lloc);
    }
    expect(tiffDeCoordenades({ lat: 91, lng: 0 })).toBeNull();
    expect(tiffDeCoordenades(null)).toBeNull();
  });
});

describe('IDEA-331 (c) · amb «Amaga el lloc» no queda cap GPS ni cap EXIF', () => {
  test.each(['image/jpeg', 'image/webp'])('%s preparada sense lloc: ni GPS ni EXIF als bytes, ni DTO', async (mime) => {
    const adjunt = await preparaAdjunt(fotoGps([orientacio(6)]), { comprimeix: canvas(mime), conservaUbicacio: false });
    expect(adjunt).not.toHaveProperty('ubicacio');
    expect(extreuTiff(await bytes(adjunt.fitxer))).toBeNull();
    await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toBeTruthy();
    expect(extreuTiff(await bytes(pujat()))).toBeNull();
    expect(rpcPublica()).not.toHaveProperty('p_ubicacio');
  });

  test('amagar-la després de preparar-la (l’interruptor): un altre binari i ID, sense GPS ni EXIF', async () => {
    const conservat = await preparaAdjunt(fotoGps(), { comprimeix: canvas('image/jpeg') });
    expect((await exifDe(conservat.fitxer)).gps).toEqual(LLOC);
    const amagat = await amagaUbicacioAdjunt(conservat, { comprimeix: canvas('image/jpeg') });
    expect(amagat).toMatchObject({ conservaUbicacio: false, senseUbicacio: true });
    expect(amagat.id).not.toBe(conservat.id);
    expect(amagat).not.toHaveProperty('ubicacio');
    expect(extreuTiff(await bytes(amagat.fitxer))).toBeNull();
    await expect(publicaAdjuntXat(FIL, amagat)).resolves.toBeTruthy();
    expect(extreuTiff(await bytes(pujat()))).toBeNull();
  });

  test('el transport no accepta una foto amb GPS quan l’entrada diu que l’amaga', async () => {
    const conservat = await preparaAdjunt(fotoGps(), { comprimeix: canvas('image/jpeg') });
    const sense = { ...conservat }; delete sense.ubicacio;
    await expect(publicaAdjuntXat(FIL, { ...sense, conservaUbicacio: false })).rejects.toMatchObject({ code: 'foto-codificacio' });
    expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });

  test('vídeo MOV amb so que es pot netejar: sense el ©xyz i amb les mateixes mostres', async () => {
    const original = movAmbSo();
    const adjunt = await preparaAdjunt(original, { ...fallbackIphone, conservaUbicacio: false });
    expect(adjunt).toMatchObject({ senseUbicacio: true, conservaUbicacio: false });
    expect(adjunt.fitxer.size).toBe(original.size);
    const contingut = await text(adjunt.fitxer);
    expect(contingut).not.toContain(ISO); expect(contingut).toContain('MOSTRES-AMB-SO');
  });
});

describe('IDEA-331 (d) · vídeo amb so impossible de netejar i «Amaga el lloc»: no s’envia, amb l’avís', () => {
  test('preparat amb l’opt-out: rebutja amb l’avís del navegador i no toca la xarxa', async () => {
    const error = await preparaAdjunt(movAmbSo({ opac: true }), { ...fallbackIphone, conservaUbicacio: false }).catch((e) => e);
    expect(error).toMatchObject({ code: 'video-no-acreditable-navegador', motiuFallback: 'video-audio-no-capturable' });
    expect(error.message).toMatch(/no l’enviem/);
    expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });

  test('amagat després de preparar-lo: rebutja, no torna cap fitxer brut i el preparat continua amb el lloc', async () => {
    const conservat = await preparaAdjunt(movAmbSo({ opac: true }), fallbackIphone);
    await expect(amagaUbicacioAdjunt(conservat)).rejects.toMatchObject({ code: 'video-no-acreditable-navegador' });
    expect(conservat).toMatchObject({ conservaUbicacio: true, ubicacio: LLOC_APROXIMAT });
  });

  test('el transport tampoc no el reserva si l’entrada diu sense lloc', async () => {
    const fitxer = movAmbSo({ opac: true });
    await expect(publicaAdjuntXat(FIL, { id: '00000000-0000-4000-8000-000000000004', fitxer, tipus: 'video', duradaMs: 5000, conservaUbicacio: false }))
      .rejects.toMatchObject({ code: 'video-no-acreditable' });
    expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
});

describe('IDEA-331 · reenviar: qui reenvia no és l’autor', () => {
  test('la foto desada amb el GPS de l’autor es reenvia neta i marcada sense lloc', async () => {
    const desada = (await preparaAdjunt(fotoGps(), { comprimeix: canvas('image/jpeg') })).fitxer;
    expect((await exifDe(desada)).gps).toEqual(LLOC);
    m.urlAdjuntXat.mockResolvedValue('https://node.test/autoritzat');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => desada })));
    const sendChatMedia = vi.fn(async () => []);
    const motor = creaOpcionsMotorAccions({ entornAccions: { current: { config: {}, sendChatMedia } } });
    const copia = await motor.lligBlob({ tipus: 'imatge', metadades: { adjunt: { id: 'antiga', mime: 'image/jpeg' } } }, {});
    expect((await exifDe(copia))?.gps ?? null).toBeNull();
    // El helper legacy continua conservant data/càmera; la còpia FINAL opt-out ja no en porta cap.
    const legacy = new Blob([imatgeSenseUbicacio(await bytes(desada)).bytes], { type: 'image/jpeg' });
    expect(await exifDe(legacy, { ambCamera: true })).toMatchObject({ dataCaptura: '2017-05-14T10:22:33+02:00', camera: { marca: 'CAMERA-SINTETICA' } });
    expect(extreuTiff(await bytes(copia))).toBeNull();
    expect((await bytes(desada)).length).toBeGreaterThan(0);
    await motor.enviaAdjunt({ id: FIL }, { id: 'nou', tipus: 'imatge', fitxer: copia }, { signal: undefined });
    expect(sendChatMedia).toHaveBeenCalledWith({ id: FIL }, { id: 'nou', tipus: 'imatge', fitxer: copia, conservaUbicacio: false }, { signal: undefined });
    // I el transport l'acredita com a punt fix d'imatgeSenseUbicacio: es reserva, es puja tal com és i es publica sense lloc.
    await expect(publicaAdjuntXat(FIL, { id: '00000000-0000-4000-8000-000000000005', fitxer: copia, tipus: 'imatge', conservaUbicacio: false }))
      .resolves.toMatchObject({ tipus: 'imatge', metadades: {} });
    expect(rpcPublica()).not.toHaveProperty('p_ubicacio');
    expect(await bytes(fetch.mock.calls.at(-1)[1].body)).toEqual(await bytes(copia));
  });
});

/* Gauntlet R1 del carril A (P1) · Un GPS IFD que l'inspector no llig (sense referències, en minúscula, segons = 60)
   no pot eixir dins del fitxer en silenci: sense coordenades llegides no hi ha avís ni interruptor, i el fitxer va
   sense GPS (la data i la càmera es conserven). */
const tagsGps = (t) => {
  if (!t) return null;
  const v = new DataView(t.buffer, t.byteOffset, t.byteLength), le = v.getUint16(0) === 0x4949, ifd0 = v.getUint32(4, le);
  for (let i = 0; i < v.getUint16(ifd0, le); i += 1) {
    const e = ifd0 + 2 + i * 12;
    if (v.getUint16(e, le) !== 0x8825) continue;
    const gps = v.getUint32(e + 8, le);
    return Array.from({ length: v.getUint16(gps, le) }, (_, k) => v.getUint16(gps + 2 + k * 12, le));
  }
  return null;
};
const fotoAmbGps = (gps) => new Blob([concatena(SOI, APP0_JFIF, app1Exif(tiff({
  ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'CAMERA-SINTETICA' }], gps,
})), JPEG_NET.subarray(2))], { type: 'image/jpeg' });
const GPS_ILLEGIBLES = Object.freeze({
  'sense referències N/S/E/W': gpsTorre().filter((e) => e.tag !== 1 && e.tag !== 3),
  'referències en minúscula': gpsTorre({ latRef: 'n', lngRef: 'w' }),
  'segons = 60': gpsTorre({ lat: [[38, 1], [35, 1], [60, 1]] }),
});

describe('Gauntlet R1 (P1) · el fitxer només porta el GPS que l’avís ensenya', () => {
  test.each(Object.entries(GPS_ILLEGIBLES))('%s: cap GPS al fitxer ni al DTO, i la càmera es conserva', async (_cas, gps) => {
    const original = fotoAmbGps(gps);
    expect(await inspeccionaUbicacioMitja(original)).toMatchObject({ coordenades: null, motiu: 'gps-illegible' });
    const adjunt = await preparaAdjunt(original, { comprimeix: canvas('image/jpeg') });
    expect(adjunt.conservaUbicacio).toBe(true);
    expect(adjunt).not.toHaveProperty('ubicacio');
    expect(adjunt).not.toHaveProperty('llocDelFitxer');
    expect(tagsGps(extreuTiff(await bytes(adjunt.fitxer)))).toBeNull();
    expect((await exifDe(adjunt.fitxer, { ambCamera: true })).camera.marca).toBe('CAMERA-SINTETICA');
    await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toBeTruthy();
    expect(tagsGps(extreuTiff(await bytes(pujat())))).toBeNull();
    expect(rpcPublica()).not.toHaveProperty('p_ubicacio');
  });

  test('control: el GPS llegible sí que hi va, amb les seues etiquetes', async () => {
    const adjunt = await preparaAdjunt(fotoAmbGps(gpsTorre()), { comprimeix: canvas('image/jpeg') });
    expect(tagsGps(extreuTiff(await bytes(adjunt.fitxer)))).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('el transport no accepta uns bytes amb GPS sense el DTO que la persona ha vist', async () => {
    const senseDto = { ...(await preparaAdjunt(fotoGps(), { comprimeix: canvas('image/jpeg') })) }; delete senseDto.ubicacio;
    expect(senseDto.conservaUbicacio).toBe(true);
    await expect(publicaAdjuntXat(FIL, senseDto)).rejects.toMatchObject({ code: 'foto-codificacio' });
    expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
});

/* Gauntlet R1 del carril A (P2) · L'avís pinta el punt que porta el fitxer (llocDelFitxer), no el DTO arrodonit. */
describe('Gauntlet R1 (P2) · llocDelFitxer és el punt que el fitxer porta de veres', () => {
  test('foto: el GPS sencer del fitxer; el DTO continua arrodonit; «Amaga el lloc» el lleva', async () => {
    const adjunt = await preparaAdjunt(fotoGps(), { comprimeix: canvas('image/webp') });
    const gps = (await exifDe(adjunt.fitxer)).gps;
    expect(adjunt.llocDelFitxer).toEqual({ lat: gps.lat, lng: gps.lng });
    expect(adjunt.llocDelFitxer).toEqual({ lat: LLOC.lat, lng: LLOC.lng });
    expect(adjunt.ubicacio).toEqual(LLOC_APROXIMAT);
    expect(await amagaUbicacioAdjunt(adjunt, { comprimeix: canvas('image/webp') })).not.toHaveProperty('llocDelFitxer');
  });

  test('vídeo original que el navegador no recomprimix (iPhone): el ©xyz de l’original', async () => {
    const adjunt = await preparaAdjunt(movAmbSo({ opac: true }), fallbackIphone);
    expect(adjunt.llocDelFitxer).toEqual({ lat: LLOC.lat, lng: LLOC.lng });
  });
});

/* Gauntlet R1 del carril A (P2) · «rescatant { lat, lng, altitud } abans de comprimir» també per al vídeo: el que
   MediaRecorder recomprimix (Chrome, Android) torna a portar el lloc dins (moov/udta/©xyz, ubicacioMp4.js). */
describe('Gauntlet R1 (P2) · el vídeo recomprimit pel navegador torna a portar el lloc dins', () => {
  const recomprimit = (fitxer) => ({ lligDurada: async () => 5000, comprimeixVideo: async () => ({ fitxer, comprimit: true }) });

  test('MP4 de MediaRecorder: lat, lng i altitud al ©xyz, mfra corregit, el transport el puja i «Amaga el lloc» el lleva', async () => {
    const adjunt = await preparaAdjunt(movAmbSo(), recomprimit(mp4Fragmentat().blob));
    expect(adjunt).toMatchObject({ tipus: 'video', videoComprimit: true, senseUbicacio: false, conservaUbicacio: true,
      ubicacio: LLOC_APROXIMAT, llocDelFitxer: { lat: LLOC.lat, lng: LLOC.lng } });
    expect((await inspeccionaUbicacioMitja(adjunt.fitxer)).coordenades).toEqual(LLOC);
    const b = await bytes(adjunt.fitxer);
    expect(offsetsTfra(b)).toEqual(caixesPrimerNivell(b).filter((c) => c.tipus === 'moof').map((c) => c.inici));
    await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toMatchObject({ tipus: 'video', metadades: { ubicacio: LLOC_APROXIMAT } });
    expect(await text(pujat())).toContain(ISO);
    const amagat = await amagaUbicacioAdjunt(adjunt);
    expect(amagat).toMatchObject({ senseUbicacio: true, conservaUbicacio: false });
    expect(amagat).not.toHaveProperty('llocDelFitxer');
    expect(await text(amagat.fitxer)).not.toContain(ISO);
    expect((await inspeccionaUbicacioMitja(amagat.fitxer)).coordenades).toBeNull();
  });

  test('WebM (Firefox): cap lloc estàndard; el fitxer ix sense i només el DTO el situa al mapa', async () => {
    const adjunt = await preparaAdjunt(movAmbSo(), recomprimit(new Blob([webm()], { type: 'video/webm' })));
    expect(adjunt).toMatchObject({ senseUbicacio: true, conservaUbicacio: true, ubicacio: LLOC_APROXIMAT });
    expect(adjunt).not.toHaveProperty('llocDelFitxer');
  });

  /* v1.2.23 · L1-02 (Gauntlet R1) · Un servidor sense la RPC4 només perd el DTO. En el cas «només el mapa» el fitxer
     no porta cap lloc: el contingut queda sense lloc, i el resultat ho diu (ubicacioNoAdmesa → avís ubicacio-no-admesa). */
  test('WebM «només el mapa» amb un servidor sense la RPC4: cap lloc al fitxer ni al servidor, i el resultat ho diu', async () => {
    const adjunt = await preparaAdjunt(movAmbSo(), recomprimit(new Blob([webm()], { type: 'video/webm' })));
    m.rpc.mockImplementation(async (nom, p) => {
      if (nom === 'xat_reserva_adjunt') return { ruta: p.p_id, pujat: false };
      if (p.p_ubicacio) throw Object.assign(new Error('PGRST202'), { status: 404 });
      return { id: p.p_id, fil_id: FIL, seq: 1, tipus: 'video', metadades: {} };
    });
    await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toMatchObject({ tipus: 'video', metadades: {}, ubicacioNoAdmesa: true });
    expect(m.rpc.mock.calls.filter(([nom]) => nom === 'xat_publica_adjunt').map(([, p]) => p.p_ubicacio ?? null)).toEqual([LLOC_APROXIMAT, null]);
    expect(await bytes(pujat())).toEqual(await bytes(adjunt.fitxer));
    expect(await text(pujat())).not.toContain(ISO);
    expect((await inspeccionaUbicacioMitja(pujat())).coordenades).toBeNull();
  });

  test('amb l’opt-out no s’hi escriu cap lloc', async () => {
    const adjunt = await preparaAdjunt(movAmbSo(), { ...recomprimit(mp4Fragmentat().blob), conservaUbicacio: false });
    expect(adjunt).toMatchObject({ senseUbicacio: true, conservaUbicacio: false });
    expect(adjunt).not.toHaveProperty('llocDelFitxer');
    expect(await text(adjunt.fitxer)).not.toContain('xyz');
  });
});
