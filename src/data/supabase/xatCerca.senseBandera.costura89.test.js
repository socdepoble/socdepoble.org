/* v1.2.25 · Costures 8 i 9 (Claude) · Build sense VITE_SDP_XAT_CERCA (el de producció mentre 20261125010000 no estiga
   aplicada): l'adaptador Supabase no anuncia 'xatCerca', el port la tracta com a absent (cap 404 de PostgREST) i
   l'adaptador local, que la declara, rebutja sempre amb 'sense-capacitat'. */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_XAT_CERCA', ''); });
import { afterEach, expect, test } from 'vitest';
import * as port from '../backendPort.js';
import * as supabase from './index.js';
import { CAPACITATS } from '../contracte.js';
import { creaAdaptadorLocal } from '../local/adaptadorLocal.js';

afterEach(() => { port.destroy(); });

test('sense bandera, les tres funcions valen undefined i el port tracta la capacitat com a absent', () => {
  expect(import.meta.env.VITE_SDP_XAT_CERCA).toBe('');
  port.setBackendImplementation({ ...supabase });
  for (const nom of CAPACITATS.xatCerca) {
    expect(supabase[nom], nom).toBeUndefined();
    expect(port.getBackendImplementation()[nom], nom).toBeUndefined();
  }
  expect(port.teCapacitat('xatCerca')).toBe(false);
  expect(() => port.cercaMissatgesFil('x', 'y', {})).toThrow('no està implementat');
});

test('l’adaptador local declara la capacitat sencera i la rebutja amb sense-capacitat, mai amb resultats inventats', async () => {
  const local = creaAdaptadorLocal();
  port.setBackendImplementation(local);
  expect(port.teCapacitat('xatCerca')).toBe(true);
  await expect(port.cercaMissatgesFil('fil', 'pa', {})).rejects.toMatchObject({ code: 'sense-capacitat' });
  await expect(port.cercaMissatgesFilPaginada('fil', 'pa', {})).rejects.toMatchObject({ code: 'sense-capacitat' });
  await expect(port.carregaMissatgeFilPerId('fil', 'id', {})).rejects.toMatchObject({ code: 'sense-capacitat' });
});
