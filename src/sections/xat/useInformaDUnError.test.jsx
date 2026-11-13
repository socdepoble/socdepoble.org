import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import useInformaDUnError from './useInformaDUnError.js';
import { buidaEsborranys, llegixEsborrany } from './esborranys.js';
import { ID_FIL_BETA_TESTERS_LLAVOR } from '../../data/xatsPerDefecte.js';
import { mapejaFil } from './missatges.js';

const mocks = vi.hoisted(() => ({ threads: [], identitats: [], joId: 'jo', senseSessio: false,
  creaFil: vi.fn(), navigate: vi.fn(), toast: vi.fn(),
  direct: { href: '/xat?amb=7d1e5c2a-0000-4000-8000-0000000000aa', avis: null } }));
vi.mock('./XatContext.jsx', () => ({ useXat: () => ({ chatThreads: mocks.threads, creaFil: mocks.creaFil,
  ambitEstable: 'node::poble::jo', joId: mocks.joId, senseSessio: mocks.senseSessio }) }));
vi.mock('../../components/PedraSeca/hooks/xatSocDePoble.js', () => ({ useXatSocDePoble: () => mocks.direct }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitatOpcional: () => ({ identitats: mocks.identitats }) }));
const t = (_key, fallback) => fallback;
const mount = () => renderHook(() => useInformaDUnError({ t, navigate: mocks.navigate, showToast: mocks.toast, pathname: '/mur' }));
const canonical = () => ({ id: '7d1e5c2a-0000-4000-8000-0000000000bb', tipus: 'grup', titol: 'Nom canviat',
  canalClau: 'beta_testers', canalBetaTesters: true });

beforeEach(() => {
  vi.clearAllMocks(); buidaEsborranys(); mocks.threads = []; mocks.identitats = [];
  mocks.joId = 'jo'; mocks.senseSessio = false; mocks.creaFil.mockResolvedValue('directe-real');
  mocks.direct = { href: '/xat?amb=7d1e5c2a-0000-4000-8000-0000000000aa', avis: null };
});
afterEach(cleanup);

test('El report preferix el grup remot canònic reanomenat, també per a qui gestiona l’entitat', async () => {
  const beta = mapejaFil(canonical());
  mocks.threads = [{ id: ID_FIL_BETA_TESTERS_LLAVOR, tipus: 'grup' }, beta];
  mocks.identitats = [{ tipus: 'entitat', slug: 'socdepoble', rol: 'owner' }];
  const { result } = mount(); expect(result.current.disponible).toBe(true);
  let fil; await act(async () => { fil = await result.current.informa(); });
  expect(fil).toBe(beta.id); expect(mocks.creaFil).not.toHaveBeenCalled();
  expect(mocks.navigate).toHaveBeenCalledWith(`/xat/${beta.id}`);
  expect(llegixEsborrany(`node::poble::jo::${beta.id}`)).toContain('Què ha passat:');
});

test('Un grup homònim no captura el report; sense migració conserva el directe de reserva', async () => {
  mocks.threads = [{ id: 'impostor', tipus: 'grup', titol: 'Beta Testers', metadades: { canalBetaTesters: true } }];
  const { result } = mount();
  await act(async () => { await result.current.informa(); });
  expect(mocks.creaFil).toHaveBeenCalledWith('7d1e5c2a-0000-4000-8000-0000000000aa', null);
  expect(mocks.navigate).toHaveBeenCalledWith('/xat/directe-real');
  expect(llegixEsborrany('node::poble::jo::impostor')).toBe('');
});

test('Un doble clic no duplica o envia l’informe i la fallada conserva una còpia recuperable', async () => {
  let reject; mocks.creaFil.mockImplementation(() => new Promise((_ok, fail) => { reject = fail; }));
  const { result } = mount();
  let first; await act(async () => { first = result.current.informa(); await result.current.informa(); });
  expect(mocks.creaFil).toHaveBeenCalledTimes(1);
  await act(async () => { reject(new TypeError('Connexió interrompuda')); await first; });
  expect(result.current.reserva.informe).toContain('Què ha passat:');
  expect(mocks.navigate).not.toHaveBeenCalled(); expect(result.current.obrint).toBe(false);
});

test('Sense sessió mai obri un destinatari ni crea esborrany encara que hi haja un Beta en memòria', async () => {
  mocks.senseSessio = true; mocks.threads = [canonical()];
  const { result } = mount(); expect(result.current.disponible).toBe(false);
  expect(await result.current.informa()).toBeNull(); expect(mocks.navigate).not.toHaveBeenCalled();
});
