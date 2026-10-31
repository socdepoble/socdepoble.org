/* R2-COR-01 (revisió de la Ronda 2) · PN-02 pel port de veres, sense simular
   backendPort.js: amb un null dins de towns, el proveïdor arriba a «ready» i
   pinta els altres pobles. CoreContentContext.forma.test.jsx simula el port i
   no podia veure que el port rebutjava la lectura sencera. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
vi.mock('./IdentitatContext.jsx', () => ({ useIdentitatOpcional: () => ({ actorId: 'A', actorKey: 'A' }) }));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'A' } }) }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('./UIContext.jsx', () => ({ useUIActions: () => ({ setGlobalStatus: vi.fn() }) }));
import * as port from '../../data/backendPort.js';
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { CoreContentProvider, useCoreContent } from './CoreContentContext.jsx';

const POBLE = '00000000-0000-4000-8000-00000000000a';
afterEach(() => { cleanup(); port.destroy(); });

test('PN-02 pel port real: un null dins de towns no buida el directori', async () => {
  port.setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => null])),
    loadCoreContent: async () => ({ towns: [{ id: 'la-torre-de-les-macanes', is_featured: true }, null, { id: 'sella' }], pages: [], agents: [] })
  });
  const wrapper = ({ children }) => <CoreContentProvider config={{ tenantId: POBLE }}>{children}</CoreContentProvider>;
  const pintat = renderHook(useCoreContent, { wrapper });
  await waitFor(() => expect(pintat.result.current.status).toBe('ready'));
  expect(pintat.result.current.towns.map((poble) => poble.id)).toEqual(['la-torre-de-les-macanes', 'sella']);
});
