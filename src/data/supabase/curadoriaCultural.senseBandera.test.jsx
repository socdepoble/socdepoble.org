/* PRODNM-07 (revisió R15b) · Build de producció sense VITE_SDP_CURADORIA_CULTURAL: l'adaptador
   Supabase real no anuncia 'curadoriaCultural' i /page/nodrir-la-iaia no fa cap petició (cap 404
   de PostgREST a la consola mentre la migració 2611091500 no siga aplicada). */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_CURADORIA_CULTURAL', ''); });
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => ({ currentUser: { id: '10000000-0000-4000-8000-000000000001' } }) }));
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import * as port from '../backendPort.js';
import * as supabase from './index.js';
import NodrirLaIaiaSection from '../../sections/patrimoni/NodrirLaIaiaSection.jsx';

let fetchFals;
beforeEach(() => { fetchFals = vi.fn(async () => new Response('{}', { status: 404 })); vi.stubGlobal('fetch', fetchFals); port.setBackendImplementation({ ...supabase }); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('sense bandera, les quatre funcions de curadoria valen undefined i el port tracta la capacitat com a absent', () => {
  expect(import.meta.env.VITE_SDP_CURADORIA_CULTURAL).toBe('');
  for (const nom of ['estatCuradoriaCultural', 'llistaAportacionsCulturals', 'enviaAportacioCultural', 'revisaAportacioCultural']) expect(supabase[nom]).toBeUndefined();
  expect(port.teCapacitat('curadoriaCultural')).toBe(false);
});
test('amb sessió, la pàgina diu que no recull res i no envia cap petició al servidor', async () => {
  render(<NodrirLaIaiaSection />);
  expect(screen.getByText(/Esta pàgina no recull cap aportació/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Envia a revisió' })).toBeNull();
  await new Promise(r => setTimeout(r, 0));
  expect(fetchFals.mock.calls.map(([url]) => String(url)).filter(u => /curadoria|aportaci/.test(u))).toEqual([]);
});
