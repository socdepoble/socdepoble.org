import { useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';

const FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const JO = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const mock = vi.hoisted(() => ({
  session: {}, entrada: 1, actorKey: 'persona', actor: null,
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), publicaAdjuntXat: vi.fn(),
  marcaLlegit: vi.fn(), creaFilDirecte: vi.fn(), carregaMembres: vi.fn(),
  subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(), obriFilDePagina: vi.fn(), teCapacitat: vi.fn(),
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, actor: mock.actor }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/xat' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, fallback) => fallback }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../data/identitat.js', async (original) => ({
  ...(await original()),
  capturaSessio: () => {
    const entrada = mock.entrada;
    return () => { if (entrada !== mock.entrada) throw new DOMException('La sessió ha canviat.', 'AbortError'); };
  },
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const CONFIG = { dataMode: 'remote', backendUrl: 'https://test.invalid', tenantId: null };
const adjunt = () => ({ id: ID, fitxer: new Blob(['foto'], { type: 'image/webp' }), tipus: 'imatge', text: 'Peu' });
const ack = (extra = {}) => ({ id: ID, filId: FIL, usuariId: JO, tipus: 'imatge', text: 'Peu', seq: 1, ...extra });
const diferida = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { resolve, promise }; };
let value;
function Sonda() { const actual = useXat(); useLayoutEffect(() => { value = actual; }); return null; }
const arbre = (config = CONFIG) => <XatProvider config={config}><Sonda /></XatProvider>;
async function munta() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  return vista;
}
beforeEach(() => {
  vi.resetAllMocks();
  mock.session = { currentUser: { id: JO }, generacio: 1 };
  mock.entrada = 1; mock.actorKey = 'persona'; mock.actor = null;
  mock.loadFils.mockResolvedValue([{ id: FIL, tipus: 'directe', titol: 'Conversa', ultimSeq: 0, altres: [] }]);
  mock.loadMissatges.mockResolvedValue([]);
  mock.teCapacitat.mockImplementation((nom) => nom === 'xatMultimedia');
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.publicaAdjuntXat.mockResolvedValue(ack());
});
afterEach(cleanup);

test.each([
  undefined, {}, ack({ encuat: true }), ack({ id: FIL }), ack({ filId: ID }),
  ack({ seq: null }), ack({ seq: 0 }), ack({ seq: 1.5 }), ack({ seq: true }), ack({ seq: [1] }), ack({ tipus: 'text' }),
])('R32.6 · cap ACK incomplet ni encolat confirma una foto: %j', async (resposta) => {
  await munta(); mock.publicaAdjuntXat.mockResolvedValueOnce(resposta);
  await act(async () => { await expect(value.sendChatMedia({ id: FIL }, adjunt())).rejects.toMatchObject({ code: 'sense-confirmacio' }); });
  expect(value.getThreadMessages(FIL)).toEqual([]);
  expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce();
});

test('R32.6 · l’ACK manté el text autoritatiu del primer enviament idempotent', async () => {
  await munta(); mock.publicaAdjuntXat.mockResolvedValueOnce(ack({ text: 'Peu antic' }));
  await act(async () => {
    expect(await value.sendChatMedia({ id: FIL }, adjunt())).toEqual([expect.objectContaining({ id: ID, text: 'Peu antic', seq: 1 })]);
  });
});

test('R32.6 · renovacions i config equivalent conserven el transport únic i el seu ACK', async () => {
  const vista = await munta(); const pendent = diferida();
  mock.publicaAdjuntXat.mockReturnValueOnce(pendent.promise);
  let resposta;
  act(() => { resposta = value.sendChatMedia({ id: FIL }, adjunt()); });
  await waitFor(() => expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce());
  const senyal = mock.publicaAdjuntXat.mock.calls[0][2].signal;
  for (const generacio of [2, 3]) {
    mock.session = { ...mock.session, generacio };
    await act(async () => { vista.rerender(arbre({ ...CONFIG })); });
    expect(senyal.aborted).toBe(false);
  }
  await act(async () => { pendent.resolve(ack()); expect(await resposta).toHaveLength(1); });
  expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce();
  expect(value.getThreadMessages(FIL)).toEqual([expect.objectContaining({ id: ID, seq: 1 })]);
});

test('R32.6 · un canvi d’actor liquida el port que ignora abort i rebutja l’ACK tardà', async () => {
  const vista = await munta(); const pendent = diferida();
  mock.publicaAdjuntXat.mockReturnValueOnce(pendent.promise);
  let resposta;
  act(() => { resposta = value.sendChatMedia({ id: FIL }, adjunt()).catch((error) => error); });
  await waitFor(() => expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce());
  const senyal = mock.publicaAdjuntXat.mock.calls[0][2].signal;
  mock.actor = { id: 'org', tipus: 'entitat' }; mock.actorKey = 'entitat';
  act(() => { vista.rerender(arbre()); });
  await act(async () => { expect(await resposta).toMatchObject({ name: 'AbortError' }); });
  expect(senyal.aborted).toBe(true);
  await act(async () => { pendent.resolve(ack()); });
  expect(value.getThreadMessages(FIL)).toEqual([]);
  expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce();
});

test('R32.6 · logout-login del mateix UUID talla sense esperar un render sense sessió', async () => {
  await munta(); const pendent = diferida(); mock.publicaAdjuntXat.mockReturnValueOnce(pendent.promise);
  let resposta;
  act(() => { resposta = value.sendChatMedia({ id: FIL }, adjunt()).catch((error) => error); });
  await waitFor(() => expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce());
  await act(async () => { mock.entrada += 2; window.dispatchEvent(new Event('sdp:auth-change')); expect(await resposta).toMatchObject({ name: 'AbortError' }); });
  await act(async () => { pendent.resolve(ack()); });
  expect(value.getThreadMessages(FIL)).toEqual([]);
});

test.each(['cancel·lar', 'desmuntar'])('R32.6 · %s liquida l’enviament i no accepta el resultat tardà', async (accio) => {
  const vista = await munta(); const pendent = diferida(); const control = new AbortController();
  mock.publicaAdjuntXat.mockReturnValueOnce(pendent.promise);
  let resposta;
  act(() => { resposta = value.sendChatMedia({ id: FIL }, adjunt(), { signal: control.signal }).catch((error) => error); });
  await waitFor(() => expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce());
  await act(async () => { if (accio === 'desmuntar') vista.unmount(); else control.abort(); expect(await resposta).toMatchObject({ name: 'AbortError' }); });
  await act(async () => { pendent.resolve(ack()); });
  expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce();
});

test('R32.6 · un 401 no reintenta sol; el reintent manual conserva l’ID', async () => {
  await munta(); mock.publicaAdjuntXat.mockRejectedValueOnce(Object.assign(new Error('Cal tornar a iniciar sessió.'), { code: 'sessio-caducada', status: 401 }));
  const entrada = adjunt();
  await act(async () => { await expect(value.sendChatMedia({ id: FIL }, entrada)).rejects.toMatchObject({ code: 'sessio-caducada' }); });
  expect(mock.publicaAdjuntXat).toHaveBeenCalledOnce();
  await act(async () => { expect(await value.sendChatMedia({ id: FIL }, entrada)).toHaveLength(1); });
  expect(mock.publicaAdjuntXat.mock.calls.map(([, dades]) => dades.id)).toEqual([ID, ID]);
});
