/* R24 · CODEX-R24-03 · Build amb VITE_SDP_CONSENS_ISOGLOSSES=1 (després d'aplicar les
   migracions R23 de la capacitat): l'adaptador Supabase real anuncia les tres funcions i el
   port té la capacitat sencera. */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_CONSENS_ISOGLOSSES', '1'); });
import { expect, test } from 'vitest';
import * as port from '../backendPort.js';
import * as supabase from './index.js';
import * as consens from './consensIsoglosses.js';
import { CAPACITATS } from '../contracte.js';

test('amb bandera, l’adaptador exporta les funcions reals i el port té la capacitat sencera', () => {
  for (const nom of CAPACITATS.consensIsoglosses) expect(supabase[nom], nom).toBe(consens[nom]);
  port.setBackendImplementation({ ...supabase });
  expect(port.teCapacitat('consensIsoglosses')).toBe(true);
});
