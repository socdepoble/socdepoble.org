import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFils, loadMissatges, marcaLlegit, creaFilDirecte, carregaMembres, enviaMissatge, subscribeToXat, unsubscribeFromXat } from './xat.js';
const mock = vi.hoisted(() => ({ getClient: vi.fn(), user: { id: 'A' } }));
vi.mock('./config.js', () => ({ getClient: mock.getClient }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => mock.user }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: config => config }));
vi.mock('./utils.js', () => ({ handleError: error => error }));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
let query, client;
beforeEach(() => {
  vi.clearAllMocks(); mock.user = { id: 'A' };
  query = { data: [], error: null, abortSignal: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockReturnThis() };
  client = { rpc: vi.fn().mockReturnValue(query), from: vi.fn().mockReturnValue(query), channel: vi.fn(), removeChannel: vi.fn().mockResolvedValue(null) };
  mock.getClient.mockResolvedValue(client);
});
const calls = [
  ['llista', config => loadFils(config)],
  ['missatges', config => loadMissatges('fil', config)],
  ['llegit', config => marcaLlegit('fil', config)],
  ['creacio', config => creaFilDirecte('B', null, config)],
  ['membres', config => carregaMembres(null, config)],
  ['enviament', config => enviaMissatge('fil', 'text', config)]
];
describe('transport cancel·lable del Xat', () => {
  it.each(calls)('propaga AbortSignal a %s', async (_name, call) => {
    query.data = _name === 'enviament' ? { id: 'm', fil_id: 'fil', usuari_id: 'A' } : [];
    const signal = new AbortController().signal;
    await call({ tenantId: 'poble', signal });
    expect(query.abortSignal).toHaveBeenCalledWith(signal);
  });
  it.each(calls)('no despatxa %s si canvia el scope durant getClient', async (_name, call) => {
    const pending = deferred(); mock.getClient.mockReturnValueOnce(pending.promise);
    const controller = new AbortController();
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = call({ tenantId: 'poble', signal: controller.signal }).catch(error => error);
    controller.abort(); pending.resolve(client); await result;
    expect(client.rpc).not.toHaveBeenCalled(); expect(client.from).not.toHaveBeenCalled();
    errorLog.mockRestore();
  });
  it('no converteix un intent d’A en un insert de B durant getClient', async () => {
    const pending = deferred(); mock.getClient.mockReturnValueOnce(pending.promise);
    const result = enviaMissatge('fil-A', 'privat A').catch(error => error);
    mock.user = { id: 'B' }; pending.resolve(client);
    expect((await result).message).toBe('La sessió ha canviat.');
    expect(client.from).not.toHaveBeenCalled();
  });
  it('ignora events abortats i allibera el canal amb el client que el va crear', async () => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    const controller = new AbortController(), callback = vi.fn();
    const { subscription } = await subscribeToXat('fil', callback, { signal: controller.signal });
    const incoming = channel.on.mock.calls[0][2];
    incoming({ new: { id: 1 } }); expect(callback).toHaveBeenCalledTimes(1);
    controller.abort(); incoming({ new: { id: 2 } }); expect(callback).toHaveBeenCalledTimes(1);
    mock.getClient.mockResolvedValue({ removeChannel: vi.fn() });
    await unsubscribeFromXat(subscription);
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
    expect(mock.getClient).toHaveBeenCalledTimes(1);
  });
});
