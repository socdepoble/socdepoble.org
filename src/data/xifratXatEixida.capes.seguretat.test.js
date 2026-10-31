// @vitest-environment jsdom
/* P1-12 pas 17 (D-09) · L'oblit en eixir amb les capes web REALS de jsdom i el
   motor real del pipeline (magatzem de claus simulat): s'esborren només les
   claus sdp_xat_ de les dues capes, la marca d'OBLIT_FALLIT viu a la capa
   efímera (sdp_embed_…, que l'oblit no s'endú), sobreviu a una «recàrrega» i
   s'esborra en reeixir. */
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CLAU_OBLITS_PENDENTS, _reiniciaOblitXat, estatOblitXat, oblidaXatEnEixir, reintentaOblitXat } from './xifratXatEixida.js';
import { creaServeiAmbitXat } from './xifratXat.js';
import { registraServeiXifratXat } from './xifratXatServei.js';
import { creaMotorXifrat } from './xifratXatPipeline.js';
import { clauIdentitat } from './xifratXatMagatzem.js';
import { STORAGE_PREFIX } from '../config/storage.js';

const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://backend.example.test', dataMode: 'remote', tenantId: null });
const CI = clauIdentitat({ backendId: 'supabase', endpoint: CONFIG.supabaseUrl, joId: A });
const MARCA = `${STORAGE_PREFIX}${CLAU_OBLITS_PENDENTS}`;
const capes = () => ({ sessio: globalThis.window.sessionStorage, preferencies: globalThis.window.localStorage });

function creaPart(oblidaEnTancar) {
  const motorRef = {};
  const servei = creaServeiAmbitXat({ motorRef });
  const magatzem = { identitat: async () => null, oblidaEnTancar, tanca() {} };
  const motor = creaMotorXifrat({ cripto: webcrypto, impl: {}, servei, magatzem, ara: () => 1000 });
  motorRef.oblidaTot = (opcions) => motor.oblidaTot(opcions);
  const impl = {};
  registraServeiXifratXat(impl, servei);
  return { servei, port: () => impl };
}

beforeEach(() => {
  _reiniciaOblitXat();
  for (const web of Object.values(capes())) {
    web.clear();
    web.setItem('sdp_xat_frase_vista', '1');
    web.setItem('sdp_embed_tema', 'fosc');
    web.setItem('altra', 'queda');
  }
});
afterEach(() => { for (const web of Object.values(capes())) web.clear(); });

test('reeixit: IndexedDB amb la CI de qui ix i només les claus sdp_xat_ de les dues capes', async () => {
  const oblidaEnTancar = vi.fn(async () => 3);
  const p = creaPart(oblidaEnTancar);
  const estat = await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: p.port });
  expect(estat).toMatchObject({ estat: 'oblidat', pendents: [] });
  expect(oblidaEnTancar).toHaveBeenCalledWith(CI, { mantenSessio: false });
  for (const web of Object.values(capes())) {
    expect(web.getItem('sdp_xat_frase_vista')).toBeNull();
    expect(web.getItem('sdp_embed_tema')).toBe('fosc');
    expect(web.getItem('altra')).toBe('queda');
  }
  expect(capes().sessio.getItem(MARCA)).toBeNull();
});

test('OBLIT_FALLIT: la marca a la capa efímera sobreviu a la recàrrega, i el reintent reeixit l’esborra', async () => {
  const oblidaEnTancar = vi.fn()
    .mockRejectedValueOnce(Object.assign(new Error('bloquejat'), { codi: 'OBLIT_FALLIT' }))
    .mockResolvedValueOnce(1);
  const p = creaPart(oblidaEnTancar);
  const estat = await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: p.port });
  expect(estat).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'] });
  expect(JSON.parse(capes().sessio.getItem(MARCA))).toEqual([{ ci: CI, mantenSessio: false, pendents: ['indexeddb'], quanMs: 1000 }]);
  expect(capes().sessio.getItem('sdp_xat_frase_vista')).toBeNull();

  _reiniciaOblitXat({ conservaMarca: true });
  const recuperat = estatOblitXat({ actiu: true, port: p.port });
  expect(recuperat).toEqual({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'], quanMs: 1000, persones: 1, recuperat: true });
  expect(estatOblitXat({ actiu: true, port: p.port })).toBe(recuperat);

  const despres = await reintentaOblitXat({ actiu: true, port: p.port });
  expect(oblidaEnTancar).toHaveBeenLastCalledWith(CI, { mantenSessio: false });
  expect(despres).toMatchObject({ estat: 'oblidat' });
  expect(capes().sessio.getItem(MARCA)).toBeNull();
});

test('el reinici de proves esborra per defecte la marca real', async () => {
  const p = creaPart(vi.fn(async () => { throw new Error('bloquejat'); }));
  await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: p.port });
  expect(capes().sessio.getItem(MARCA)).not.toBeNull();
  _reiniciaOblitXat();
  expect(capes().sessio.getItem(MARCA)).toBeNull();
});
