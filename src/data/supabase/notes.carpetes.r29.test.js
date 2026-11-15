/* Onada R29 · PF-01 · creaCarpetaNotes per la xarxa de veres: el request() real de
   runtime.js i un fetch fals que llig el cos com PostgREST. Un objecte JSON porta els
   arguments de la RPC; una cadena JSON (la doble codificació d'abans) no en porta cap,
   i crea_carpeta_notes(text, uuid) respon 404 PGRST202. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { creaCarpetaNotes } from './notes.js';

const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const POBLE = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const CARPETA = 'f-0f0e0d0c-0b0a-4908-8706-050403020100';
const CONFIG = Object.freeze({ dataMode: 'remote', supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'sb_publishable_proves', tenantId: POBLE });

const vistos = [];
const postgrestFals = vi.fn(async (url, init) => {
  const cos = JSON.parse(init.body);
  vistos.push({ url: String(url), metode: init.method, tipus: init.headers?.['Content-Type'], cos });
  const parametres = cos && typeof cos === 'object' && !Array.isArray(cos) ? cos : {};
  if (typeof parametres.p_nom !== 'string' || parametres.p_tenant_id !== POBLE) {
    return new Response(JSON.stringify({ code: 'PGRST202', message: 'Could not find the function public.crea_carpeta_notes without parameters' }),
      { status: 404, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({ id: CARPETA, nom: parametres.p_nom }), { status: 200, headers: { 'content-type': 'application/json' } });
});

beforeEach(() => {
  vistos.length = 0;
  postgrestFals.mockClear();
  vi.stubGlobal('fetch', postgrestFals);
  configuraBackendSessio(CONFIG);
  expect(desaSessio({ access_token: 'jwt-opac-de-carpetes', user: { id: PERSONA, email: 'carpetes@poble.invalid' } })).toBe(true);
});
afterEach(() => {
  esborraSessio({ abast: 'tot' });
  vi.unstubAllGlobals();
});

test('el cos que arriba a PostgREST és un objecte amb p_nom i p_tenant_id, i la carpeta naix al servidor', async () => {
  await expect(creaCarpetaNotes({ nom: '  Festes ' }, CONFIG)).resolves.toEqual({ id: CARPETA, nom: 'Festes', parentId: null });
  expect(vistos).toHaveLength(1);
  expect(vistos[0].url).toBe('http://localhost:54321/rest/v1/rpc/crea_carpeta_notes');
  /* Kit R29 lot 01 (Codex): PostgREST només llig els arguments com a JSON si la crida és un POST
     amb Content-Type application/json. */
  expect(vistos[0].metode).toBe('POST');
  expect(vistos[0].tipus).toBe('application/json');
  expect(vistos[0].cos).toEqual({ p_nom: 'Festes', p_tenant_id: POBLE });
});
