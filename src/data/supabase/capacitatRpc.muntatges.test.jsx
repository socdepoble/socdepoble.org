import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../config/publicCredentials.js', () => ({ validatePublicCredentials: () => {} }));
vi.mock('../../utils/sanitize.js', () => ({ permetOrigenMitjans: () => {} }));
vi.mock('../appSeed.js', () => ({ APP_SEED: {}, APP_SEED_VERSION: 'synthetic', getDefaultUserId: () => 'A' }));
vi.mock('../../config/storage.js', () => ({ getEfimer: (_key, fallback = null) => fallback }));
vi.mock('../identitat.js', () => ({ CLAU_USUARI: 'user', versioSessio: 0,
  usuariDeSessio: () => null, jwtPerBackend: () => null, capturaSessio: () => () => {} }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIStateOpcional: () => null }));
vi.mock('../backendPort.js', async () => ({ teCapacitat: () => true,
  lligPublicadorsRegistrats: (await import('./copublicacio.js')).lligPublicadorsRegistrats }));

import { usePublicadorsRegistrats } from '../../hooks/usePublicadorsRegistrats.js';
import { reiniciaCapacitatsRpc } from './capacitatRpc.js';

const CONFIG = Object.freeze({ supabaseUrl: 'https://sentinel.example.test', supabaseAnonKey: 'sb_publishable_synthetic',
  tenantId: '11000000-0000-4000-8000-000000000001', dataMode: 'remote' });
const IDS = ['fediversity', 'receptes', 'herbari', 'patrimoni'];

function Consulta({ id }) {
  const estat = usePublicadorsRegistrats({ recursTipus: 'pagina', recursId: id }, CONFIG);
  return <output data-testid={id}>{estat.fase}|{estat.dadesBarra?.authorName ?? 'sense-registre'}|{estat.publicadorsRegistrats.length}</output>;
}
function QuatreMuntatges() { return <>{IDS.map(id => <Consulta key={id} id={id} />)}</>; }

beforeEach(() => { reiniciaCapacitatsRpc(); });
afterEach(() => { cleanup(); reiniciaCapacitatsRpc(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

test.each(['', '1'])('quatre muntatges de la cadena de pàgina degraden honestament amb bandera «%s»', async bandera => {
  vi.stubEnv('VITE_SDP_COPUBLICACIO', bandera);
  const peticions = [];
  const fetch = vi.fn(async (url, options) => {
    peticions.push({ rpc: new URL(url).pathname, params: Object.keys(JSON.parse(options.body)).sort() });
    return { ok: false, status: 404,
      text: async () => JSON.stringify({ code: 'PGRST202', message: 'Funció absent de prova.' }) };
  });
  vi.stubGlobal('fetch', fetch);
  const errors = vi.spyOn(console, 'error');
  render(<QuatreMuntatges />);
  await waitFor(() => {
    for (const id of IDS) expect(screen.getByTestId(id).textContent).toBe('no-disponible|sense-registre|0');
  });
  // No hi ha maquillatge de console.error ni un resultat llest inventat.
  expect(errors).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(bandera === '1' ? 1 : 0);
  expect(peticions).toEqual(bandera === '1' ? [{ rpc: '/rest/v1/rpc/llig_publicadors_registrats',
    params: ['p_recurs_id', 'p_tenant_id', 'p_tipus'] }] : []);
});
