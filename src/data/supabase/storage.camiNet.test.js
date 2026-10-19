// @vitest-environment node
/* Auditoria de seguretat 261019 (F5) · resolveAsset i promoteToPublic només
   passen a Storage un bucket i un camí que no poden moure la URL. storage-js
   ajunta el camí sense codificar a /object/sign/<bucket>/<camí> i hi fa un
   POST amb el token de qui mira: un avatar_url d'un altre veí amb segments de
   punts desviava eixe POST a un altre punt de l'origen de Supabase. Els
   orígens són sintètics. */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { StorageClient } from '@supabase/storage-js';

const m = vi.hoisted(() => ({ client: null }));
vi.mock('./config.js', () => ({ getClient: async () => m.client }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: (config = {}) => ({ ...config }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => null }));

import { promoteToPublic, resolveAsset } from './storage.js';

const ORIGEN = 'https://projecte.supabase.test';
const UID = '11111111-1a1a-4000-8000-000000000001';
const POBLE = '22222222-2b2b-4000-8000-000000000002';
const RUTA = `${POBLE}/${UID}/avatars/33333333-3c3c-4000-8000-000000000003.webp`;

/* El client de storage-js de veres, amb un fetch que anota on va cada petició. */
let peticions;
function clientDeVeres() {
  peticions = [];
  const fetch = vi.fn(async (url, opcions = {}) => {
    peticions.push({ url: String(url), metode: opcions.method || 'GET', autoritzacio: new Headers(opcions.headers).get('authorization') });
    return new Response(JSON.stringify({ signedURL: `/object/sign/x?token=t`, Id: 'id', Key: 'k' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  });
  return new StorageClient(`${ORIGEN}/storage/v1`, { Authorization: 'Bearer token-de-qui-mira' }, fetch);
}
const desti = (peticio) => new URL(peticio.url).pathname;

beforeEach(() => {
  m.client = { storage: clientDeVeres() };
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const CAMINS_QUE_MOUEN = [
  `sdp-media://mitjans_privats/${POBLE}/../../../../rest/v1/rpc/qualsevol`,
  `sdp-media://mitjans_privats/${POBLE}/%2e%2e/%2E%2E/rest/v1/rpc/qualsevol`,
  `sdp-media://mitjans_privats/${POBLE}/.\t./.\n./rest/v1/rpc/qualsevol`,
  `sdp-media://mitjans_privats/./${RUTA}`,
  `sdp-media://mitjans_privats/${POBLE}//${UID}/a.webp`,
  `sdp-media://mitjans_privats/${RUTA}?x=1`,
  `sdp-media://mitjans_privats/${RUTA}#x`,
  `sdp-media://mitjans_privats/${POBLE}\\..\\..\\rest/v1/rpc/qualsevol`,
  `sdp-media://../rest/v1/rpc/qualsevol`,
  'sdp-media://mitjans/../mitjans_privats/a.webp',
  /* L'analitzador d'URL lleva els espais del final: '.. ' hi arriba com '..'. */
  'sdp-media://mitjans_privats/.. ',
  'sdp-media://mitjans_privats/a/..  '
];

describe('resolveAsset · cap camí que moga la URL arriba a Storage', () => {
  test('[DEFECTE d’abans] el client de veres, amb un camí de punts, fa el POST fora de /object/sign/', async () => {
    await m.client.storage.from('mitjans_privats').createSignedUrl(`${POBLE}/../../../../../../rest/v1/rpc/qualsevol`, 3600);
    expect(peticions).toHaveLength(1);
    expect(peticions[0]).toMatchObject({ metode: 'POST', autoritzacio: 'Bearer token-de-qui-mira' });
    expect(desti(peticions[0])).toBe('/rest/v1/rpc/qualsevol');
  });

  test.each(CAMINS_QUE_MOUEN)('%s: es torna tal qual i no hi ha cap petició', async (ref) => {
    expect(await resolveAsset(ref, {})).toBe(ref);
    expect(peticions).toEqual([]);
  });

  test('control · una pujada privada es firma dins de /object/sign/ del seu bucket', async () => {
    const url = await resolveAsset(`sdp-media://mitjans_privats/${RUTA}`, {});
    expect(typeof url).toBe('string');
    expect(peticions).toHaveLength(1);
    expect(desti(peticions[0])).toBe(`/storage/v1/object/sign/mitjans_privats/${RUTA}`);
  });

  test('control · el bucket públic i els noms antics (espais, accents, punts dins del nom) es resolen igual', async () => {
    expect(await resolveAsset(`sdp-media://mitjans/${RUTA}`, {}))
      .toBe(`${ORIGEN}/storage/v1/object/public/mitjans/${RUTA}`);
    expect(await resolveAsset('sdp-media://mitjans/x.webp', {})).toBe(`${ORIGEN}/storage/v1/object/public/mitjans/x.webp`);
    expect(await resolveAsset('sdp-media://mitjans/u/foto de la plaça.v2.jpg', {}))
      .toBe(`${ORIGEN}/storage/v1/object/public/mitjans/u/foto%20de%20la%20pla%C3%A7a.v2.jpg`);
    expect(await resolveAsset('sdp-media://abc', {})).toBe('sdp-media://abc');
    expect(await resolveAsset('/assets/a.png', {})).toBe('/assets/a.png');
    expect(peticions).toEqual([]);
  });
});

describe('promoteToPublic · ni baixa ni puja un camí que moga la URL', () => {
  test.each(CAMINS_QUE_MOUEN.filter((ref) => ref.startsWith('sdp-media://mitjans_privats/')))('%s', async (ref) => {
    expect(await promoteToPublic(ref, {})).toBe(ref);
    expect(peticions).toEqual([]);
  });

  test('control · una pujada privada neta es promou', async () => {
    expect(await promoteToPublic(`sdp-media://mitjans_privats/${RUTA}`, {})).toBe(`sdp-media://mitjans/${RUTA}`);
    expect(peticions.map(desti)).toEqual([
      `/storage/v1/object/mitjans_privats/${RUTA}`,
      `/storage/v1/object/mitjans/${RUTA}`
    ]);
  });
});
