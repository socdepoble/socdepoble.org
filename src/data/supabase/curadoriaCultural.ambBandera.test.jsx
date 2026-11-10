/* PRODNM-07 (revisió R15b) · Build amb VITE_SDP_CURADORIA_CULTURAL=1 (després d'aplicar la
   migració 2611091500): l'adaptador Supabase real anuncia les quatre funcions de curadoria. */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_CURADORIA_CULTURAL', '1'); });
import { expect, test } from 'vitest';
import * as port from '../backendPort.js';
import * as supabase from './index.js';
import * as curadoria from './curadoriaCultural.js';

test('amb bandera, l’adaptador exporta les funcions reals i el port té la capacitat sencera', () => {
  for (const nom of ['estatCuradoriaCultural', 'llistaAportacionsCulturals', 'enviaAportacioCultural', 'revisaAportacioCultural']) expect(supabase[nom]).toBe(curadoria[nom]);
  port.setBackendImplementation({ ...supabase });
  expect(port.teCapacitat('curadoriaCultural')).toBe(true);
});
