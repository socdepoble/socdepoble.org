/* Sanejament R15 (B2 · P1-01, R15-REG-05, Q-06) · Capacitats sense backend, sense banderes (el build de producció d'R15).
   L'adaptador Supabase real al port i la xarxa interceptada a fetch: tests/helpers/capacitatsServidorR15.jsx. */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_XAT_RITME', ''); vi.stubEnv('VITE_SDP_IAIA_SERVIDOR', ''); });
vi.mock('../identitat.js', async (original) => ({ ...(await original()), usuariDeSessio: () => ({ id: '10000000-0000-4000-8000-000000000001' }), versioSessio: 1 }));
vi.mock('./config.js', async (original) => {
  const { clientDeFunctions } = await import('../../../tests/helpers/clientFunctionsR15.js');
  return { ...(await original()), getClient: async () => clientDeFunctions() };
});
vi.mock('../iaiaLocal.js', async (original) => ({ ...(await original()), respostaDeLaIAIA: () => 'Ajuda local de la IAIA' }));
import { escenariCapacitatsServidor } from '../../../tests/helpers/capacitatsServidorR15.jsx';

escenariCapacitatsServidor({ amb: false });
