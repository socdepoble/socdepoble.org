/* v1.2.25 · Costures 8 i 9 (Claude) · Build amb VITE_SDP_XAT_CERCA=1 (després d'aplicar 20261125010000): l'adaptador
   Supabase real reexporta les tres funcions de C1 (src/data/supabase/xatCerca.js) i el port té 'xatCerca' sencera,
   amb les mateixes firmes. Sense sessió ni mode 'remote', rebutja amb 'sense-capacitat' abans de cap petició. */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_XAT_CERCA', '1'); });
import { afterEach, expect, test } from 'vitest';
import * as port from '../backendPort.js';
import * as supabase from './index.js';
import * as xatCerca from './xatCerca.js';
import { CAPACITATS, CONTRACTE_BACKEND } from '../contracte.js';

const FIL = '0b5c1a6e-1f7a-4d0e-9a4b-2f1d8c3b7e10';
const MISSATGE = '6a1e2d3c-4b5a-4f6e-8d7c-9b0a1c2d3e4f';
afterEach(() => { port.destroy(); vi.unstubAllGlobals(); });

test('el contracte declara xatCerca amb les tres firmes de C1, al final de l’ABI', () => {
  expect(CAPACITATS.xatCerca).toEqual(['cercaMissatgesFil', 'cercaMissatgesFilPaginada', 'carregaMissatgeFilPerId']);
  expect(CONTRACTE_BACKEND.slice(187,190)).toEqual(CAPACITATS.xatCerca);
});

test('amb bandera, l’adaptador exporta les funcions reals i el port té la capacitat sencera', () => {
  for (const nom of CAPACITATS.xatCerca) expect(supabase[nom], nom).toBe(xatCerca[nom]);
  port.setBackendImplementation({ ...supabase });
  expect(port.teCapacitat('xatCerca')).toBe(true);
});

test('fora del mode remot, el port rebutja amb sense-capacitat i no fa cap petició', async () => {
  const fetchFals = vi.fn(async () => new Response('[]', { status: 200 }));
  vi.stubGlobal('fetch', fetchFals);
  port.setBackendImplementation({ ...supabase });
  const config = { dataMode: 'seed' };
  await expect(port.cercaMissatgesFil(FIL, 'pa', config)).rejects.toMatchObject({ code: 'sense-capacitat' });
  await expect(port.cercaMissatgesFilPaginada(FIL, 'pa', config)).rejects.toMatchObject({ code: 'sense-capacitat' });
  await expect(port.carregaMissatgeFilPerId(FIL, MISSATGE, config)).rejects.toMatchObject({ code: 'sense-capacitat' });
  expect(fetchFals).not.toHaveBeenCalled();
});

test('un fil o un id que no són UUID es refusen abans del transport', async () => {
  port.setBackendImplementation({ ...supabase });
  await expect(port.cercaMissatgesFil('no-uuid', 'pa', { dataMode: 'remote' })).rejects.toBeInstanceOf(TypeError);
  await expect(port.carregaMissatgeFilPerId(FIL, 'no-uuid', { dataMode: 'remote' })).rejects.toBeInstanceOf(TypeError);
});
