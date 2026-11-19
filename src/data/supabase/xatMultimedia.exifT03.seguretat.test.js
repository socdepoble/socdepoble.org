// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { preparaAdjunt } from '../../sections/xat/adjuntLocal.js';
import { publicaAdjuntXat } from './xatMultimedia.js';
import { ambExifDeLoriginal, extreuTiff } from '../../components/universal/enquadrament/exifIncrustat.js';
import { llegixExif } from '../../components/universal/enquadrament/exif.js';
import { mp4 } from '../../../tests/helpers/contenidorsMedia.js';
import { JPEG_NET, WEBP_NET } from '../../../tests/helpers/mitjansPublicsNets.js';
import { APP0_JFIF, IMATGE, SOI, TIPUS, app1Exif, concatena, dataOriginal, gpsTorre, tiff } from '../../../tests/helpers/jpegProva.js';
const m = vi.hoisted(() => ({ rpc: vi.fn(), request: vi.fn(), user: { id: '00000000-0000-4000-8000-000000000001' } }));
vi.mock('./runtime.js', () => ({ rpc: m.rpc, request: m.request, getResolvedConfig: () => ({ runtimeDataMode: 'remote', supabaseUrl: 'https://node.test', supabaseAnonKey: 'publica' }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.user, jwtPerBackend: () => 'sessio-test', entradaSessio: () => 1, capturaSessio: () => () => {} }));
const FIL = '00000000-0000-4000-8000-000000000003';
const ID = '00000000-0000-4000-8000-000000000002';
const LLOC = { lat: 38.5919, lng: -0.4184 };
const fotoGps = (extra = {}, raster = JPEG_NET.subarray(2)) => new Blob([concatena(SOI, APP0_JFIF, app1Exif(tiff({
  ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'CAMERA-SINTETICA' }],
  exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre(), ...extra
})), raster)], { type: 'image/jpeg' });
const bytes = async blob => new Uint8Array(await blob.arrayBuffer());
const gps = async blob => llegixExif(concatena(SOI, app1Exif(extreuTiff(await bytes(blob)) ?? new Uint8Array()))).gps;
const sha = async blob => createHash('sha256').update(await bytes(blob)).digest('hex');
const dataUrl = (mime, b) => `data:${mime};base64,${Buffer.from(b).toString('base64')}`;
function compressorRaster(original, mime) {
  const raster = dataUrl(mime, mime === 'image/jpeg' ? JPEG_NET : WEBP_NET);
  return vi.fn(async (_fitxer, opcions) => {
    if (opcions.format === 'image/webp' && mime === 'image/jpeg') return dataUrl('image/png', [1]);
    return opcions.conservaExif ? ambExifDeLoriginal(raster, original) : raster;
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  m.rpc.mockImplementation(async (nom, p) => nom === 'xat_reserva_adjunt' ? { ruta: p.p_id, pujat: false }
    : { id: p.p_id, fil_id: FIL, seq: 1, tipus: 'imatge', metadades: p.p_ubicacio ? { ubicacio: p.p_ubicacio } : {} });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
});

afterEach(() => vi.unstubAllGlobals());

test.each(['image/jpeg', 'image/webp'])('EXIF_T03: %s puja bytes sense GPS abans del fallback RPC3 i conserva ubicació JSON consentida', async mime => {
  const original = fotoGps(), hashOriginal = await sha(original);
  expect(await gps(original)).toMatchObject(LLOC);
  const adjunt = await preparaAdjunt(original, { comprimeix: compressorRaster(original, mime) });
  expect(adjunt.ubicacio).toEqual(LLOC);
  m.rpc.mockImplementation(async (nom, p) => {
    if (nom === 'xat_reserva_adjunt') return { ruta: p.p_id, pujat: false };
    if (p.p_ubicacio) throw Object.assign(new Error('PGRST202'), { status: 404 });
    return { id: p.p_id, fil_id: FIL, seq: 1, tipus: 'imatge', metadades: {} };
  });
  const resultat = await publicaAdjuntXat(FIL, adjunt);
  expect(resultat.ubicacioNoAdmesa).toBe(true);
  expect(fetch).toHaveBeenCalledOnce();
  const pujat = fetch.mock.calls[0][1].body;
  expect(await gps(pujat)).toBeNull();
  expect(await gps(adjunt.fitxer)).toBeNull();
  const exif = llegixExif(concatena(SOI, app1Exif(extreuTiff(await bytes(pujat)))), { ambCamera: true });
  expect(exif.dataCaptura).toBe('2017-05-14T10:22:33+02:00');
  expect(exif.camera.marca).toBe('CAMERA-SINTETICA');
  expect(m.rpc.mock.calls.filter(([nom]) => nom === 'xat_publica_adjunt').map(([, p]) => p.p_ubicacio ?? null)).toEqual([LLOC, null]);
  expect(await sha(original)).toBe(hashOriginal);
});

test('EXIF_T03: un GPS legacy no arriba a cap reserva encara que declare senseUbicacio:true', async () => {
  const fitxer = fotoGps();
  const entrada = { id: ID, fitxer, tipus: 'imatge', ubicacio: LLOC, senseUbicacio: true };
  await expect(publicaAdjuntXat(FIL, entrada)).rejects.toMatchObject({ code: 'SDP-XAT-008' });
  expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  expect(entrada.fitxer).toBe(fitxer); expect(await gps(fitxer)).toMatchObject(LLOC);
});

test.each([
  new Blob(['JPEG il·legible'], { type: 'image/jpeg' }),
  new Blob(['RIFF GPS opac'], { type: 'image/webp' }),
  new Blob([concatena(SOI, app1Exif(tiff({ gps: gpsTorre(), punterGps: 0xffff })), IMATGE)], { type: 'image/jpeg' }),
])('EXIF_T03: contenidor o TIFF il·legible es rebutja sense xarxa', async fitxer => {
  await expect(publicaAdjuntXat(FIL, { id: ID, fitxer, tipus: 'imatge' })).rejects.toMatchObject({ code: expect.stringMatching(/foto-codificacio|SDP-XAT-008/) });
  expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});

test('EXIF_T03: cancel·lació abans de sanejar no toca bytes ni reserva', async () => {
  const c = new AbortController(); c.abort();
  await expect(publicaAdjuntXat(FIL, { id: ID, fitxer: fotoGps(), tipus: 'imatge' }, { signal: c.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});

test('EXIF_T03: un ACK antic amb lloc després del fallback no activa l’avís sense ubicació', async () => {
  const original = fotoGps();
  const adjunt = await preparaAdjunt(original, { comprimeix: compressorRaster(original, 'image/webp') });
  fetch.mockImplementation(async (_url, p) => p.method === 'GET' ? new Response(adjunt.fitxer, { headers: { 'Content-Type': adjunt.fitxer.type } }) : { ok: true, status: 200 });
  m.rpc.mockImplementation(async (nom, p) => {
    if (nom === 'xat_reserva_adjunt') return { ruta: p.p_id, pujat: true };
    if (p.p_ubicacio) throw Object.assign(new Error('PGRST202'), { status: 404 });
    return { id: p.p_id, fil_id: FIL, seq: 1, tipus: 'imatge', metadades: { ubicacio: LLOC } };
  });
  await expect(publicaAdjuntXat(FIL, adjunt)).rejects.toMatchObject({ code: 'sense-confirmacio' });
  expect(fetch).toHaveBeenCalledOnce();
});

test('EXIF_T03: resposta perduda després de pujar permet reintentar el mateix binari net i ID sense duplicar bytes', async () => {
  const original = fotoGps();
  const adjunt = await preparaAdjunt(original, { comprimeix: compressorRaster(original, 'image/webp') });
  fetch.mockImplementation(async (_url, p) => p.method === 'GET' ? new Response(adjunt.fitxer, { headers: { 'Content-Type': adjunt.fitxer.type } }) : { ok: true, status: 200 });
  let pujat = false, publicacions = 0;
  m.rpc.mockImplementation(async (nom, p) => {
    if (nom === 'xat_reserva_adjunt') { const abans = pujat; pujat = true; return { ruta: p.p_id, pujat: abans }; }
    if (++publicacions === 1) throw new TypeError('resposta perduda');
    return { id: p.p_id, fil_id: FIL, seq: 1, tipus: 'imatge', metadades: { ubicacio: p.p_ubicacio } };
  });
  await expect(publicaAdjuntXat(FIL, adjunt)).rejects.toMatchObject({ code: 'xarxa' });
  await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toMatchObject({ id: adjunt.id, metadades: { ubicacio: LLOC } });
  expect(fetch.mock.calls.filter(([, p]) => p.method === 'POST')).toHaveLength(1); expect(await gps(fetch.mock.calls[0][1].body)).toBeNull();
});

test('EXIF_T03: avortar una lectura binària pendent rebutja immediatament i ignora la lectura tardana', async () => {
  let resol;
  const fitxer = new Blob([JPEG_NET], { type: 'image/jpeg' });
  const llegint = vi.fn(() => new Promise(r => { resol = r; }));
  fitxer.arrayBuffer = llegint;
  const c = new AbortController();
  const resultat = publicaAdjuntXat(FIL, { id: ID, fitxer, tipus: 'imatge' }, { signal: c.signal });
  await vi.waitFor(() => expect(llegint).toHaveBeenCalledOnce()); c.abort();
  await expect(resultat).rejects.toMatchObject({ name: 'AbortError' });
  resol(JPEG_NET.buffer); await Promise.resolve();
  expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});

test.each([
  [new Blob([JPEG_NET], { type: 'image/webp' }), 'imatge', 'foto-codificacio'],
  [new Blob([JPEG_NET], { type: 'image/png' }), 'imatge', 'format'],
  [new Blob([new Uint8Array(2_000_001)], { type: 'image/jpeg' }), 'imatge', 'SDP-XAT-020'],
])('EXIF_T03: MIME fals, no admés o límit binari no fan cap reserva', async (fitxer, tipus, code) => {
  await expect(publicaAdjuntXat(FIL, { id: ID, fitxer, tipus })).rejects.toMatchObject({ code });
  expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});

const caixa = (tipus, ...fills) => {
  const cos = fills.map(f => typeof f === 'string' ? new TextEncoder().encode(f) : f);
  const b = new Uint8Array(8 + cos.reduce((n, f) => n + f.length, 0));
  new DataView(b.buffer).setUint32(0, b.length); b.set(new TextEncoder().encode(tipus), 4);
  let p = 8; for (const f of cos) { b.set(f, p); p += f.length; } return b;
};
const COORD_VIDEO = '+38.5919-000.4184/';
function videoGps() {
  const xyz = caixa('xxxx', COORD_VIDEO); xyz.set([0xa9, 0x78, 0x79, 0x7a], 4);
  const base = mp4(false), view = new DataView(base.buffer);
  const start = view.getUint32(0), end = start + view.getUint32(start);
  return new Blob([base.subarray(0, start), caixa('moov', base.subarray(start + 8, end), caixa('udta', xyz)), caixa('mdat', 'MOSTRES-SINTETIQUES')], { type: 'video/mp4' });
}

test('EXIF_T03 vídeo: MP4 conegut es saneja abans de pujar, manté mostres/mida i GPS consentit al DTO', async () => {
  const original = videoGps(); const hashOriginal = await sha(original);
  const adjunt = await preparaAdjunt(original, { lligDurada: async () => 4000, comprimeixVideo: async fitxer => ({ fitxer, comprimit: false }) });
  expect(adjunt).toMatchObject({ ubicacio: LLOC, senseUbicacio: true });
  expect(adjunt.fitxer.size).toBe(original.size);
  m.rpc.mockImplementation(async (nom, p) => {
    if (nom === 'xat_reserva_adjunt') return { ruta: p.p_id, pujat: false };
    if (p.p_ubicacio) throw Object.assign(new Error('PGRST202'), { status: 404 });
    return { id: p.p_id, fil_id: FIL, seq: 1, tipus: 'video', metadades: {} };
  });
  await expect(publicaAdjuntXat(FIL, adjunt)).resolves.toMatchObject({ ubicacioNoAdmesa: true });
  const pujat = new TextDecoder().decode(await bytes(fetch.mock.calls[0][1].body));
  expect(pujat).not.toContain(COORD_VIDEO); expect(pujat).toContain('MOSTRES-SINTETIQUES');
  expect(await sha(original)).toBe(hashOriginal);
});

test('EXIF_T03 vídeo: legacy GPS amb bandera falsa no publica via RPC3 ni afirma sense ubicació', async () => {
  const fitxer = videoGps(); fetch.mockImplementation(async () => new Response(fitxer, { headers: { 'Content-Type': fitxer.type } }));
  m.rpc.mockImplementation(async (nom, p) => {
    if (nom === 'xat_reserva_adjunt') return { ruta: p.p_id, pujat: true };
    throw Object.assign(new Error('PGRST202'), { status: 404 });
  });
  await expect(publicaAdjuntXat(FIL, { id: ID, fitxer, tipus: 'video', duradaMs: 4000, ubicacio: LLOC, senseUbicacio: true }))
    .rejects.toMatchObject({ code: 'ubicacio-no-eliminable' });
  expect(m.rpc.mock.calls.filter(([nom]) => nom === 'xat_publica_adjunt')).toHaveLength(1);
  expect(fetch).toHaveBeenCalledOnce();
});

test.each(['reserva-pujada', '409', 'XHR409'])('EXIF_T03 delta: %s amb GPS remot antic i Blob local net del mateix ID no es publica', async via => {
  // Objecte remot legacy deliberadament incomplet; no passa per la pujada.
  const original = fotoGps({}, IMATGE);
  const net = await preparaAdjunt(original, { comprimeix: compressorRaster(original, 'image/jpeg') });
  const antic = await bytes(original);
  const remot = new Blob([antic.subarray(0, antic.length - 2), new Uint8Array(net.fitxer.size - original.size), antic.subarray(antic.length - 2)], { type: original.type });
  expect(remot.size).toBe(net.fitxer.size); expect(await gps(remot)).toMatchObject(LLOC); expect(await gps(net.fitxer)).toBeNull();
  m.rpc.mockImplementation(async (nom, p) => nom === 'xat_reserva_adjunt' ? { ruta: p.p_id, pujat: via === 'reserva-pujada' }
    : { id: p.p_id, fil_id: FIL, seq: 1, tipus: 'imatge', metadades: { ubicacio: p.p_ubicacio } });
  fetch.mockImplementation(async (_url, p) => p.method === 'GET' ? new Response(remot, { status: 200, headers: { 'Content-Type': remot.type } }) : { ok: false, status: 409 });
  if (via === 'XHR409') vi.stubGlobal('XMLHttpRequest', class {
    constructor() { this.upload = {}; }
    open(_method, url) { this.responseURL = url; }
    setRequestHeader() {}
    send() { this.status = 409; this.responseText = '{}'; this.onload(); }
    abort() {}
  });
  await expect(publicaAdjuntXat(FIL, net, via === 'XHR409' ? { onProgres: vi.fn() } : {})).rejects.toMatchObject({ code: 'SDP-XAT-008' });
  expect(m.rpc.mock.calls.filter(([nom]) => nom === 'xat_publica_adjunt')).toHaveLength(0);
  expect(fetch.mock.calls.filter(([, p]) => p.method === 'GET')).toHaveLength(1);
});

test.each([
  ['MIME diferent', () => new Response(JPEG_NET, { headers: { 'Content-Type': 'image/webp' } })],
  ['longitud declarada falsa', () => new Response(JPEG_NET, { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '1' } })],
  ['cos curt', () => new Response(JPEG_NET.subarray(1), { headers: { 'Content-Type': 'image/jpeg' } })],
  ['cos massa gran sense llargària', () => new Response(concatena(JPEG_NET, new Uint8Array(50_000)), { headers: { 'Content-Type': 'image/jpeg' } })],
  ['lectura prohibida', () => new Response(null, { status: 403 })],
  ['quota HTTP429', () => new Response(null, { status: 429 })],
])('EXIF_T03 delta: %s no acredita objecte ni publica', async (_cas, resposta) => {
  m.rpc.mockImplementation(async (_nom, p) => ({ ruta: p.p_id, pujat: true }));
  fetch.mockImplementation(async () => resposta());
  await expect(publicaAdjuntXat(FIL, { id: ID, fitxer: new Blob([JPEG_NET], { type: 'image/jpeg' }), tipus: 'imatge' })).rejects.toMatchObject({ code: 'SDP-XAT-008' });
  expect(m.rpc).toHaveBeenCalledOnce();
});

test('EXIF_T03 delta: objecte remot exactament igual permet RPC3 i GET usa només JWT al backend', async () => {
  const fitxer = new Blob([JPEG_NET], { type: 'image/jpeg' });
  m.rpc.mockImplementation(async (nom, p) => nom === 'xat_reserva_adjunt' ? { ruta: p.p_id, pujat: true } : { id: p.p_id, fil_id: FIL, seq: 1, tipus: 'imatge', metadades: {} });
  fetch.mockImplementation(async () => new Response(fitxer, { headers: { 'Content-Type': fitxer.type, 'Content-Length': String(fitxer.size) } }));
  await expect(publicaAdjuntXat(FIL, { id: ID, fitxer, tipus: 'imatge' })).resolves.toMatchObject({ id: ID });
  expect(fetch).toHaveBeenCalledWith(`https://node.test/storage/v1/object/authenticated/xat_adjunts/${ID}`, expect.objectContaining({ method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store', headers: { apikey: 'publica', Authorization: 'Bearer sessio-test' } }));
});

test('EXIF_T03 delta: cancel·lar un stream remot pendent retorna sense esperar-lo i no publica', async () => {
  const fitxer = new Blob([JPEG_NET], { type: 'image/jpeg' }), c = new AbortController();
  let començat = false, cancel = false;
  m.rpc.mockImplementation(async (_nom, p) => ({ ruta: p.p_id, pujat: true }));
  fetch.mockImplementation(async () => ({ ok: true, headers: new Headers({ 'Content-Type': fitxer.type }), body: { getReader: () => ({ read: () => { començat = true; return new Promise(() => {}); }, cancel: async () => { cancel = true; } }) } }));
  const resultat = publicaAdjuntXat(FIL, { id: ID, fitxer, tipus: 'imatge' }, { signal: c.signal });
  await vi.waitFor(() => expect(començat).toBe(true)); c.abort();
  await expect(resultat).rejects.toMatchObject({ name: 'AbortError' }); expect(cancel).toBe(true);
  expect(m.rpc).toHaveBeenCalledOnce();
});
