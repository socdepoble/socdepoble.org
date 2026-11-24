// @vitest-environment jsdom
import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaOpcionsMotorAccions } from '../xat/creaOpcionsMotorAccions.js';
import { publicaAdjuntXat } from './xatMultimedia.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { extreuTiff, imatgeSenseUbicacio } from '../../components/universal/enquadrament/exifIncrustat.js';
import { llegixExif } from '../../components/universal/enquadrament/exif.js';
import { JPEG_NET } from '../../../tests/helpers/mitjansPublicsNets.js';
import { app1Exif, concatena, dataOriginal, gpsTorre, tiff, TIPUS } from '../../../tests/helpers/jpegProva.js';

/* The real forwarding factory, shared preparation, strict provider and custom
   HTTP RPC client are exercised. Canvas and server are synthetic; no network. */
const m = vi.hoisted(() => ({ codec: vi.fn(), url: vi.fn() }));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: (...args) => m.codec(...args) }));
vi.mock('../backendPort.js', () => ({ urlAdjuntXat: (...args) => m.url(...args) }));
const CONFIG = Object.freeze({ supabaseUrl: 'https://fixture.invalid', supabaseAnonKey: 'sb_publishable_fixture', dataMode: 'remote' });
const USER = '00000000-0000-4000-8000-000000000001';
const FIL = '00000000-0000-4000-8000-000000000003';
const ID = '00000000-0000-4000-8000-000000000005';
const original = new NodeBlob([concatena(JPEG_NET.subarray(0, 2), app1Exif(tiff({
  ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'PRIVATE-AUTHOR-CAMERA' }],
  exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre(),
})), JPEG_NET.subarray(2))], { type: 'image/jpeg' });
const dataUrl = bytes => `data:image/jpeg;base64,${Buffer.from(bytes).toString('base64')}`;
const bytes = async blob => new Uint8Array(await blob.arrayBuffer());
let calls, uploads, send, motor;
beforeEach(() => {
  vi.stubGlobal('Blob', NodeBlob);
  vi.clearAllMocks(); calls = []; uploads = [];
  configuraBackendSessio(CONFIG);
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const access_token = `${b64({ alg: 'none' })}.${b64({ sub: USER, exp: Math.floor(Date.now() / 1000) + 3600 })}.synthetic`;
  expect(desaSessio({ access_token, refresh_token: 'synthetic-refresh', user: { id: USER } })).toBe(true);
  m.codec.mockResolvedValue(dataUrl(JPEG_NET)); m.url.mockResolvedValue('https://fixture.invalid/authorized-original');
  vi.stubGlobal('fetch', vi.fn(async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin !== CONFIG.supabaseUrl) throw new Error('Synthetic server refuses external origin');
    if (url.pathname === '/authorized-original') return new Response(original, { status: 200 });
    if (url.pathname.startsWith('/storage/v1/object/xat_adjunts/')) {
      uploads.push(await bytes(options.body)); return new Response('', { status: 200 });
    }
    if (!url.pathname.startsWith('/rest/v1/rpc/')) throw new Error('Unexpected synthetic route');
    const body = JSON.parse(options.body); calls.push({ name: url.pathname.split('/').at(-1), body });
    const result = url.pathname.endsWith('/xat_reserva_adjunt') ? { ruta: body.p_id, pujat: false }
      : { id: body.p_id, fil_id: FIL, seq: 7, tipus: 'imatge', metadades: {}, cos: null };
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
  send = vi.fn((fil, adjunt, options) => publicaAdjuntXat(fil.id, adjunt, { ...CONFIG, ...options }));
  motor = creaOpcionsMotorAccions({ entornAccions: { current: { config: CONFIG, sendChatMedia: send } } });
});
afterEach(() => { esborraSessio({ abast: 'tot' }); vi.unstubAllGlobals(); });
const download = () => motor.lligBlob({ tipus: 'imatge', metadades: { adjunt: { id: 'original', mime: 'image/jpeg' } } }, {});

test('forwarding prepares a final opt-out copy and publishes once through real RPC with no EXIF/GPS', async () => {
  const before = await bytes(original); expect(llegixExif(before).gps).not.toBeNull();
  const legacy = imatgeSenseUbicacio(before); expect(extreuTiff(legacy.bytes)).not.toBeNull();
  const copy = await download(); expect(extreuTiff(await bytes(copy))).toBeNull();
  const ack = await motor.enviaAdjunt({ id: FIL }, { id: ID, tipus: 'imatge', fitxer: copy }, {});
  expect(ack).toMatchObject({ id: ID, seq: 7, metadades: {} });
  expect(send).toHaveBeenCalledTimes(1); expect(send.mock.calls[0][1].conservaUbicacio).toBe(false);
  expect(calls.map(c => c.name)).toEqual(['xat_reserva_adjunt', 'xat_publica_adjunt']);
  expect(calls[1].body).not.toHaveProperty('p_ubicacio'); expect(uploads).toHaveLength(1);
  expect(extreuTiff(uploads[0])).toBeNull(); expect(llegixExif(uploads[0]).gps).toBeNull();
  expect(new TextDecoder().decode(uploads[0])).not.toContain('PRIVATE-AUTHOR-CAMERA');
  expect(await bytes(original)).toEqual(before); expect(llegixExif(await bytes(original)).gps).not.toBeNull();
});

test('a failed encoder prevents any reserve, upload or publication and preserves the original', async () => {
  const before = await bytes(original); m.codec.mockRejectedValue(new Error('synthetic encoder failure'));
  await expect(download()).rejects.toMatchObject({ code: 'foto-codificacio' });
  expect(send).not.toHaveBeenCalled(); expect(calls).toEqual([]); expect(uploads).toEqual([]);
  expect(await bytes(original)).toEqual(before);
});

test('an encoder returning metadata cannot mark its result as a clean opt-out copy', async () => {
  const before = await bytes(original); m.codec.mockResolvedValue(dataUrl(before));
  await expect(download()).rejects.toMatchObject({ code: 'foto-codificacio' });
  expect(send).not.toHaveBeenCalled(); expect(calls).toEqual([]); expect(uploads).toEqual([]);
  expect(await bytes(original)).toEqual(before);
});
