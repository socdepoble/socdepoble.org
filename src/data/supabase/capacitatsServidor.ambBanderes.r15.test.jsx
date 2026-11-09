/* Sanejament R15 (B2 · P1-01, R15-REG-05, Q-06) · Capacitats sense backend, amb les banderes VITE_SDP_XAT_RITME=1 i VITE_SDP_IAIA_SERVIDOR=1 (build futur, quan el Mestre aplique les migracions i desplegue les funcions).
   L'adaptador Supabase real al port i la xarxa interceptada a fetch: tests/helpers/capacitatsServidorR15.jsx. */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_XAT_RITME', '1'); vi.stubEnv('VITE_SDP_IAIA_SERVIDOR', '1'); });
vi.mock('../identitat.js', async (original) => ({ ...(await original()), usuariDeSessio: () => ({ id: '10000000-0000-4000-8000-000000000001' }), versioSessio: 1 }));
vi.mock('./config.js', async (original) => {
  const { clientDeFunctions } = await import('../../../tests/helpers/clientFunctionsR15.js');
  return { ...(await original()), getClient: async () => clientDeFunctions() };
});
vi.mock('../iaiaLocal.js', async (original) => ({ ...(await original()), respostaDeLaIAIA: () => 'Ajuda local de la IAIA' }));
import { escenariCapacitatsServidor } from '../../../tests/helpers/capacitatsServidorR15.jsx';

escenariCapacitatsServidor({ amb: true });
