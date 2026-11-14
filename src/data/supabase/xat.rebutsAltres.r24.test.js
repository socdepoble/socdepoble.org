/* R24 · xat_entrega (IDEA-260 b, P0-1) · L'adaptador de Supabase porta el
   rebut d'entrega dels altres (xat_fils_meus.rebut_pels_altres_fins_seq, de
   20261114061000) fins a la interfície, i un servidor vell sense la columna no
   el falseja: la propietat queda absent i la llista diu que no ho sap. La
   cadena adaptador → missatges.mapejaFil → estatDeLUltim dona ✓✓ gris
   («lliurat») amb el rebut i ✓✓ blau («llegit») amb la lectura. */
import { beforeEach, expect, it, vi } from 'vitest';
import { loadFils } from './xat.js';
import { reiniciaLocalXat } from '../localXat.js';
import { estatDeLUltim, mapejaFil as mapejaPerLaVista } from '../../sections/xat/missatges.js';

const mock = vi.hoisted(() => ({ getClient: vi.fn(), user: { id: 'A' } }));
vi.mock('./config.js', () => ({ getClient: mock.getClient }));
vi.mock('../identitat.js', () => ({ versioSessio: 0, usuariDeSessio: () => mock.user, jwtPerBackend: () => null, getDefaultUserId: () => mock.user?.id || 'convidat-seed' }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: config => ({ ...config, runtimeDataMode: config.dataMode || 'remote' }),
  generateUUID: () => 'uuid-generat'
}));
vi.mock('./utils.js', () => ({ handleError: error => error }));

const REMOT = { tenantId: '00000000-0000-4000-8000-000000000000' };
const FIL = '24000000-0000-4000-8000-0000000000f1';
const fila = (extra = {}) => ({
  id: FIL, tipus: 'directe', titol: null, altres_noms: ['Bernat'], ultim_text: 'Hola', ultim_al: '2026-11-14T05:00:00Z',
  ultim_autor_id: 'A', ultim_seq: 7, llegit_fins_seq: 7, rebut_fins_seq: 7, llegit_pels_altres_fins_seq: 0, no_llegits: 0,
  participants: 2, altres: [{ id: 'B', nom: 'Bernat', tipus: 'persona' }], ...extra
});
let query;
beforeEach(() => {
  vi.clearAllMocks(); reiniciaLocalXat(); mock.user = { id: 'A' };
  query = { data: [], error: null, abortSignal: vi.fn().mockReturnThis() };
  mock.getClient.mockResolvedValue({ rpc: vi.fn().mockReturnValue(query), from: vi.fn().mockReturnValue(query) });
});
const remot = async (extra) => { query.data = [fila(extra)]; return (await loadFils(REMOT)).find(f => f.id === FIL); };

it('mapeja rebut_pels_altres_fins_seq a rebutPelsAltresFinsSeq (ara no hi arribava mai)', async () => {
  const fil = await remot({ rebut_pels_altres_fins_seq: 7 });
  expect(fil.rebutPelsAltresFinsSeq).toBe(7);
  expect(fil.rebutFinsSeq).toBe(7);
  expect((await remot({ rebut_pels_altres_fins_seq: '3' })).rebutPelsAltresFinsSeq).toBe(3);
});

it('un servidor sense la columna no inventa cap 0: la propietat no existix', async () => {
  const fil = await remot();
  expect(Object.hasOwn(fil, 'rebutPelsAltresFinsSeq')).toBe(false);
  const vista = mapejaPerLaVista(fil);
  expect(vista.rebutsConeguts).toBe(false);
  expect(estatDeLUltim(vista, 'A')).toBe('enviat');
});

it('cadena sencera: rebut ⇒ ✓✓ gris (lliurat), lectura ⇒ ✓✓ blau (llegit), i el rebut propi es conserva', async () => {
  const lliurat = mapejaPerLaVista(await remot({ rebut_pels_altres_fins_seq: 7, llegit_pels_altres_fins_seq: 0, rebut_fins_seq: 5 }));
  expect(lliurat).toMatchObject({ rebutsConeguts: true, rebutPelsAltresFinsSeq: 7, rebutFinsSeq: 5 });
  expect(estatDeLUltim(lliurat, 'A')).toBe('lliurat');
  const llegit = mapejaPerLaVista(await remot({ rebut_pels_altres_fins_seq: 7, llegit_pels_altres_fins_seq: 7 }));
  expect(estatDeLUltim(llegit, 'A')).toBe('llegit');
  const pendent = mapejaPerLaVista(await remot({ rebut_pels_altres_fins_seq: 6 }));
  expect(estatDeLUltim(pendent, 'A')).toBe('enviat');
});
