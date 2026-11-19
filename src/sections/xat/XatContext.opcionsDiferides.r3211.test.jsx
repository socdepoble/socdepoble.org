import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';

const JO = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', ALTRE = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const mock = vi.hoisted(() => ({ session: {}, entrada: 1, creaOpcions: vi.fn(), creaMotor: vi.fn(),
  sincronitza: vi.fn(), activa: vi.fn(), tanca: vi.fn(), alternaDestacat: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), marcaLlegit: vi.fn(), creaFilDirecte: vi.fn(),
  carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn() }));
const tros = vi.hoisted(() => {
  let deixa, avisa;
  return { arribat: new Promise(r => { deixa = r; }), demanat: new Promise(r => { avisa = r; }),
    deixa: () => deixa(), avisa: () => avisa() };
});
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: 'persona', actor: null }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/mur' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, f) => f }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../data/identitat.js', async original => ({ ...(await original()),
  capturaSessio: () => { const entrada = mock.entrada; return () => {
    if (entrada !== mock.entrada) throw new DOMException('Sessió canviada.', 'AbortError');
  }; } }));
vi.mock('../../data/xat/creaOpcionsMotorAccions.js', () => ({ creaOpcionsMotorAccions: mock.creaOpcions }));
vi.mock('../../data/xat/accionsMissatge.js', async () => {
  tros.avisa(); await tros.arribat;
  return { creaAccionsMissatge: mock.creaMotor };
});
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
const CONFIG = { dataMode: 'remote', backendUrl: 'https://test.invalid' };
let value;
function Sonda() { const xat = useXat(); useLayoutEffect(() => { value = xat; }); return null; }
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const munta = async () => { const vista = render(arbre()); await waitFor(() => expect(value.status).toBe('ready')); return vista; };
beforeEach(() => {
  vi.resetAllMocks(); mock.session = { currentUser: { id: JO }, generacio: 1 }; mock.entrada = 1;
  mock.loadFils.mockResolvedValue([]); mock.loadMissatges.mockResolvedValue([]); mock.teCapacitat.mockReturnValue(false);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.creaOpcions.mockImplementation(pont => ({ pont,
    obteContext: () => ({ ...pont.entornAccions.current, clau: String(mock.entrada), actiu: !pont.desmuntat.current }),
    obteMissatge: () => null, port: {} }));
  mock.creaMotor.mockImplementation(() => ({ sincronitza: mock.sincronitza, activa: mock.activa, tanca: mock.tanca,
    alternaDestacat: mock.alternaDestacat }));
  mock.alternaDestacat.mockResolvedValue({ estat: 'confirmat' });
});
afterEach(() => { cleanup(); });

test('una acció esperant el tros no travessa canvi de sessió ni desmuntatge', async () => {
  const vista = await munta();
  expect(mock.creaOpcions).not.toHaveBeenCalled(); expect(mock.creaMotor).not.toHaveBeenCalled();
  const primera = value.alternaDestacat('id', true).catch(e => e);
  await tros.demanat;
  const altraVista = await munta();
  const segona = value.alternaDestacat('id', true).catch(e => e);
  altraVista.unmount();
  mock.session = { currentUser: { id: ALTRE }, generacio: 2 }; mock.entrada += 1;
  vista.rerender(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  let resultats;
  await act(async () => { tros.deixa(); resultats = await Promise.all([primera, segona]); });
  expect(resultats).toMatchObject([{ name: 'AbortError' }, { name: 'AbortError' }]);
  expect(mock.alternaDestacat).not.toHaveBeenCalled();
});

test('la factoria fallida es pot reintentar i el motor continua únic en StrictMode', async () => {
  tros.deixa();
  const vista = await munta();
  const error = new TypeError('Tros no disponible');
  mock.creaOpcions.mockImplementationOnce(() => { throw error; });
  await act(async () => { await expect(value.alternaDestacat('id', true)).rejects.toBe(error); });
  expect(mock.creaMotor).not.toHaveBeenCalled();
  await act(async () => { expect(await value.alternaDestacat('id', true)).toEqual({ estat: 'confirmat' }); });
  await act(async () => { await value.alternaDestacat('id', false); });
  expect(mock.creaOpcions).toHaveBeenCalledTimes(2); expect(mock.creaMotor).toHaveBeenCalledTimes(1);
  expect(mock.sincronitza).toHaveBeenCalled(); expect(mock.activa).toHaveBeenCalledTimes(1);
  expect(mock.alternaDestacat.mock.calls).toEqual([['id', true], ['id', false]]);
  vista.unmount(); expect(mock.tanca).toHaveBeenCalledTimes(1);
});
