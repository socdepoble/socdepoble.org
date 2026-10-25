import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RealtimeClient } from '@supabase/realtime-js';
import { subscribeToXat, unsubscribeFromXat } from './xat.js';

const mock = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock('./config.js', () => ({ getClient: mock.getClient }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: config => ({ ...config, runtimeDataMode: 'remote' }),
  generateUUID: () => 'uuid-sintetic'
}));
vi.mock('./utils.js', () => ({ handleError: error => error }));

const REMOT = { tenantId: '00000000-0000-4000-8000-000000000000' };
const diferit = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};
const microtasques = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };
let recursos;

/* CUR-06 · SDK instal·lat real, sense servidor. Phoenix Push.trigger i
   Channel.trigger són els punts locals comprovats al seu codi font; la
   prova no obri cap socket ni fa fetch. Només se simulen els ACK del servidor. */
function clientSenseXarxa() {
  const transport = vi.fn(function XarxaProhibida() { throw new Error('Socket prohibit'); });
  const fetchProhibit = vi.fn(() => { throw new Error('HTTP prohibit'); });
  const realtime = new RealtimeClient('ws://realtime-prova.invalid/socket', {
    transport,
    fetch: fetchProhibit,
    params: { apikey: 'clau-sintetica-sense-xarxa' },
    disconnectOnEmptyChannelsAfterMs: 0
  });
  vi.spyOn(realtime, 'connect').mockImplementation(() => {});
  vi.spyOn(realtime, 'disconnect').mockResolvedValue();
  vi.spyOn(realtime, 'setAuth').mockResolvedValue();
  const canals = new Set();
  const client = {
    channel: vi.fn((...args) => {
      const canal = realtime.channel(...args);
      canals.add(canal);
      return canal;
    }),
    removeChannel: vi.fn(canal => realtime.removeChannel(canal))
  };
  const recurs = { client, realtime, transport, fetchProhibit, canals };
  recursos.push(recurs);
  mock.getClient.mockResolvedValue(client);
  return recurs;
}
const confirma = canal => canal.joinPush.trigger('ok', {});
const avisa = (canal, seq) => canal.channelAdapter.getChannel().trigger('broadcast', { event: 'nous', payload: { seq } });
const falla = canal => canal.channelAdapter.getChannel().trigger('phx_error', new Error('fallada local sintètica'));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  recursos = [];
});
afterEach(async () => {
  for (const { realtime, transport, fetchProhibit, canals } of recursos) {
    expect(transport).not.toHaveBeenCalled();
    expect(fetchProhibit).not.toHaveBeenCalled();
    /* Neteja només del banc de proves, encara que una asserció roja s'ature
       abans de la baixa. El producte mai usa removeAllChannels. */
    for (const canal of canals) canal.teardown();
    await realtime.removeAllChannels();
  }
  expect(vi.getTimerCount()).toBe(0);
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CUR-06 · consumidors independents d’un canal privat compartit', () => {
  it('dona handles opacs diferents i registra un sol fanout físic per client i fil', async () => {
    const { client, realtime } = clientSenseXarxa();
    const a = vi.fn(), b = vi.fn();
    const primer = await subscribeToXat('fil', a, REMOT);
    const canal = realtime.getChannels()[0];
    confirma(canal);
    const segon = await subscribeToXat('fil', b, REMOT);
    expect(primer.error).toBeNull();
    expect(segon.error).toBeNull();
    expect(primer.subscription).not.toBe(segon.subscription);
    expect(primer.subscription).not.toBe(canal);
    expect(Object.isFrozen(primer.subscription)).toBe(true);
    expect(Object.keys(primer.subscription)).toEqual([]);
    expect(client.channel).toHaveBeenCalledTimes(1);
    expect(realtime.getChannels()).toHaveLength(1);
    avisa(canal, 1);
    expect(a).toHaveBeenCalledWith(null, { tipus: 'nous', filId: 'fil', seq: 1 });
    expect(b).toHaveBeenCalledWith(null, { tipus: 'nous', filId: 'fil', seq: 1 });
    await unsubscribeFromXat(primer.subscription);
    await unsubscribeFromXat(segon.subscription);
  });

  it('la baixa repetida d’A no tanca B, que rep també errors i recuperació CUR-03', async () => {
    const { client, realtime } = clientSenseXarxa();
    const a = vi.fn(), b = vi.fn();
    const primer = await subscribeToXat('fil', a, REMOT);
    const canal = realtime.getChannels()[0];
    confirma(canal);
    const segon = await subscribeToXat('fil', b, REMOT);
    avisa(canal, 1);
    await unsubscribeFromXat(primer.subscription);
    await unsubscribeFromXat(primer.subscription);
    expect(client.removeChannel).not.toHaveBeenCalled();
    expect(realtime.getChannels()).toHaveLength(1);
    avisa(canal, 2);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenLastCalledWith(null, { tipus: 'nous', filId: 'fil', seq: 2 });
    falla(canal);
    expect(b).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'XAT', cause: expect.any(Error) }), null);
    /* Sense socket, iniciem el rejoin Phoenix comprovat al seu source i
       n'acusem l'ACK en local; no es simula cap recuperació de xarxa real. */
    canal.channelAdapter.getChannel().rejoin();
    confirma(canal);
    expect(b).toHaveBeenLastCalledWith(null, { tipus: 'nous', filId: 'fil', seq: null });
    expect(a).toHaveBeenCalledTimes(1);
    await unsubscribeFromXat(segon.subscription);
    expect(client.removeChannel).toHaveBeenCalledOnce();
    expect(client.removeChannel).toHaveBeenCalledWith(canal);
    expect(realtime.getChannels()).toHaveLength(0);
    avisa(canal, 3);
    expect(b).toHaveBeenCalledTimes(4);
  });

  it('una alta mentre l’última baixa és pendent espera i obri un canal fresc', async () => {
    const { client, realtime } = clientSenseXarxa();
    const a = vi.fn(), b = vi.fn(), pendent = diferit();
    const primer = await subscribeToXat('fil', a, REMOT);
    const vell = realtime.getChannels()[0];
    confirma(vell);
    client.removeChannel.mockImplementationOnce(async canal => { await pendent.promise; return realtime.removeChannel(canal); });
    const baixa = unsubscribeFromXat(primer.subscription);
    await microtasques();
    let nou;
    const alta = subscribeToXat('fil', b, REMOT).then(valor => { nou = valor; return valor; });
    await microtasques();
    expect(nou).toBeUndefined();
    expect(client.channel).toHaveBeenCalledTimes(1);
    avisa(vell, 9);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
    pendent.resolve();
    await baixa;
    const segon = await alta;
    const fresc = realtime.getChannels()[0];
    expect(fresc).not.toBe(vell);
    expect(segon.error).toBeNull();
    expect(client.channel).toHaveBeenCalledTimes(2);
    confirma(fresc);
    avisa(fresc, 10);
    expect(b).toHaveBeenCalledWith(null, { tipus: 'nous', filId: 'fil', seq: 10 });
    await unsubscribeFromXat(segon.subscription);
  });

  it('l’alta espera també el segon intent acotat i no reutilitza un canal fallit', async () => {
    const { client, realtime } = clientSenseXarxa();
    const primer = await subscribeToXat('fil', vi.fn(), REMOT);
    const vell = realtime.getChannels()[0];
    confirma(vell);
    const pendent = diferit();
    client.removeChannel.mockResolvedValueOnce('error').mockImplementationOnce(async canal => {
      await pendent.promise;
      return realtime.removeChannel(canal);
    });
    const baixa = unsubscribeFromXat(primer.subscription).catch(error => error);
    let nou;
    const alta = subscribeToXat('fil', vi.fn(), REMOT).then(valor => { nou = valor; return valor; });
    await microtasques();
    expect((await baixa).code).toBe('CANAL_NO_TANCAT');
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    expect(nou).toBeUndefined();
    expect(client.channel).toHaveBeenCalledTimes(1);
    pendent.resolve();
    const segon = await alta;
    expect(segon.error).toBeNull();
    expect(realtime.getChannels()[0]).not.toBe(vell);
    await unsubscribeFromXat(segon.subscription);
  });

  it('dues fallades tanquen el cicle: alta amb error i cap bucle de reintents', async () => {
    const { client, realtime } = clientSenseXarxa();
    const primer = await subscribeToXat('fil', vi.fn(), REMOT);
    confirma(realtime.getChannels()[0]);
    client.removeChannel.mockResolvedValue('error');
    const baixa = unsubscribeFromXat(primer.subscription).catch(error => error);
    const callback = vi.fn();
    const segon = await subscribeToXat('fil', callback, REMOT);
    expect((await baixa).code).toBe('CANAL_NO_TANCAT');
    expect(segon.subscription).toBeNull();
    expect(segon.error).toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    expect(callback).toHaveBeenCalledWith(segon.error, null);
    await microtasques();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    expect(client.channel).toHaveBeenCalledTimes(1);
    client.removeChannel.mockImplementation(canal => realtime.removeChannel(canal));
    await unsubscribeFromXat(primer.subscription);
    expect(client.removeChannel).toHaveBeenCalledTimes(3);
    expect(realtime.getChannels()).toHaveLength(0);
  });

  it('dos waiters revaliden també el canal nou si la seua obertura falla i entra en baixa', async () => {
    const { client, realtime } = clientSenseXarxa();
    const removeReal = client.removeChannel.getMockImplementation();
    const primera = diferit(), segona = diferit();
    const primer = await subscribeToXat('fil', vi.fn(), REMOT);
    const vell = realtime.getChannels()[0];
    confirma(vell);
    client.removeChannel.mockImplementationOnce(() => primera.promise).mockImplementationOnce(() => segona.promise);
    const baixa = unsubscribeFromXat(primer.subscription);
    await vi.advanceTimersByTimeAsync(0);
    const altaB = subscribeToXat('fil', vi.fn(), REMOT);
    let tercer;
    const altaC = subscribeToXat('fil', vi.fn(), REMOT).then(valor => { tercer = valor; return valor; });
    try {
      await vi.advanceTimersByTimeAsync(0);
      /* El SDK real arriba a connect() en crear el nou físic i esta fallada
         síncrona fa que el cleanup entre en una segona baixa diferida. */
      realtime.connect.mockImplementationOnce(() => { throw new Error('transport sintètic no disponible'); });
      await removeReal(vell);
      primera.resolve('ok');
      await vi.advanceTimersByTimeAsync(0);
      expect((await altaB).error).toBeInstanceOf(Error);
      expect(client.removeChannel).toHaveBeenCalledTimes(2);
      expect(tercer).toBeUndefined();
      const fallit = realtime.getChannels()[0];
      await removeReal(fallit);
      segona.resolve('ok');
      const resultat = await altaC;
      expect(resultat.error).toBeNull();
      expect(realtime.getChannels()).toHaveLength(1);
      confirma(realtime.getChannels()[0]);
    } finally {
      primera.resolve('ok');
      segona.resolve('ok');
      await baixa.catch(() => {});
      await altaB;
      const resultat = await altaC;
      await unsubscribeFromXat(resultat.subscription).catch(() => {});
    }
  });

  it('avorta només el waiter immediatament i lleva el listener sense tocar la baixa compartida', async () => {
    const { client, realtime } = clientSenseXarxa();
    const primer = await subscribeToXat('fil', vi.fn(), REMOT);
    confirma(realtime.getChannels()[0]);
    const pendent = diferit();
    client.removeChannel.mockImplementationOnce(async canal => { await pendent.promise; return realtime.removeChannel(canal); });
    const baixa = unsubscribeFromXat(primer.subscription);
    const controller = new AbortController(), callback = vi.fn();
    const afig = vi.spyOn(controller.signal, 'addEventListener');
    const lleva = vi.spyOn(controller.signal, 'removeEventListener');
    let cancelat;
    const altaB = subscribeToXat('fil', callback, { ...REMOT, signal: controller.signal }).then(valor => { cancelat = valor; return valor; });
    const altaC = subscribeToXat('fil', vi.fn(), REMOT);
    try {
      await microtasques();
      controller.abort();
      await microtasques();
      expect(cancelat).toMatchObject({ subscription: null, error: { name: 'AbortError', retriable: true } });
      expect(callback).not.toHaveBeenCalled();
      expect(client.removeChannel).toHaveBeenCalledOnce();
      expect(client.channel).toHaveBeenCalledOnce();
      expect(afig).toHaveBeenCalledOnce();
      expect(lleva).toHaveBeenCalledWith('abort', afig.mock.calls[0][1]);
    } finally {
      pendent.resolve();
      await baixa;
      await altaB;
      const tercer = await altaC;
      await unsubscribeFromXat(tercer.subscription);
    }
  });

  it('una alta explícita pot netejar un orfe sense handle, amb dos intents màxim per demanda', async () => {
    const { client, realtime } = clientSenseXarxa();
    realtime.connect.mockImplementationOnce(() => { throw new Error('transport sintètic no disponible'); });
    client.removeChannel.mockResolvedValue('error');
    const primer = await subscribeToXat('fil', vi.fn(), REMOT);
    expect(primer.subscription).toBeNull();
    await vi.advanceTimersByTimeAsync(0);
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    const segon = await subscribeToXat('fil', vi.fn(), REMOT);
    expect(segon.error).toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    await microtasques();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(client.removeChannel).toHaveBeenCalledTimes(4);
    client.removeChannel.mockImplementation(canal => realtime.removeChannel(canal));
    const tercer = await subscribeToXat('fil', vi.fn(), REMOT);
    expect(tercer.error).toBeNull();
    expect(client.removeChannel).toHaveBeenCalledTimes(5);
    expect(realtime.getChannels()).toHaveLength(1);
    confirma(realtime.getChannels()[0]);
    await unsubscribeFromXat(tercer.subscription);
  });

  it('CLOSED inesperat avisa, invalida el pool i deixa que una alta nova cree físic fresc', async () => {
    const { client, realtime } = clientSenseXarxa();
    const a = vi.fn(), b = vi.fn();
    const primer = await subscribeToXat('fil', a, REMOT);
    const vell = realtime.getChannels()[0];
    confirma(vell);
    const segon = await subscribeToXat('fil', b, REMOT);
    vell.channelAdapter.getChannel().trigger('phx_close', {});
    expect(realtime.getChannels()).toHaveLength(0);
    expect(a).toHaveBeenCalledWith(expect.objectContaining({ retriable: true }), null);
    expect(b).toHaveBeenCalledWith(expect.objectContaining({ retriable: true }), null);
    const tercer = await subscribeToXat('fil', vi.fn(), REMOT);
    expect(tercer.error).toBeNull();
    expect(realtime.getChannels()).toHaveLength(1);
    expect(realtime.getChannels()[0]).not.toBe(vell);
    expect(client.channel).toHaveBeenCalledTimes(2);
    confirma(realtime.getChannels()[0]);
    await unsubscribeFromXat(primer.subscription);
    await unsubscribeFromXat(segon.subscription);
    expect(client.removeChannel).not.toHaveBeenCalled();
    await unsubscribeFromXat(tercer.subscription);
    expect(client.removeChannel).toHaveBeenCalledOnce();
  });

  it('A ja tancat no reintenta la baixa fallida que només B ha iniciat', async () => {
    const { client, realtime } = clientSenseXarxa();
    const primer = await subscribeToXat('fil', vi.fn(), REMOT);
    confirma(realtime.getChannels()[0]);
    const segon = await subscribeToXat('fil', vi.fn(), REMOT);
    await unsubscribeFromXat(primer.subscription);
    client.removeChannel.mockResolvedValue('error');
    await unsubscribeFromXat(segon.subscription).catch(() => {});
    await microtasques();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    await expect(unsubscribeFromXat(primer.subscription)).resolves.toBeUndefined();
    await microtasques();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    client.removeChannel.mockImplementation(canal => realtime.removeChannel(canal));
    await unsubscribeFromXat(segon.subscription);
    expect(client.removeChannel).toHaveBeenCalledTimes(3);
  });

  it('aïlla el mateix fil en dos clients, els fils diferents i els callbacks ja tancats', async () => {
    const primerClient = clientSenseXarxa();
    const a = vi.fn(), altreFil = vi.fn();
    const primer = await subscribeToXat('fil', a, REMOT);
    const filDos = await subscribeToXat('altre', altreFil, REMOT);
    primerClient.realtime.getChannels().forEach(confirma);
    const segonClient = clientSenseXarxa();
    const b = vi.fn();
    const segon = await subscribeToXat('fil', b, REMOT);
    const canalB = segonClient.realtime.getChannels()[0];
    confirma(canalB);
    await unsubscribeFromXat(primer.subscription);
    expect(primerClient.realtime.getChannels()).toHaveLength(1);
    expect(segonClient.client.removeChannel).not.toHaveBeenCalled();
    avisa(canalB, 7);
    expect(b).toHaveBeenCalledWith(null, { tipus: 'nous', filId: 'fil', seq: 7 });
    expect(a).not.toHaveBeenCalled();
    expect(altreFil).not.toHaveBeenCalled();
    await unsubscribeFromXat(filDos.subscription);
    await unsubscribeFromXat(segon.subscription);
  });
});

/* CUR06_REOPEN · Un desmuntatge de la UI no conserva el handle fallit. */
describe('CUR06_REOPEN · una nova demanda explícita recupera la baixa normal fallida', () => {
  it('CUR06_REOPEN · reobri amb físic fresc després de perdre l’últim handle', async () => {
    const { client, realtime } = clientSenseXarxa();
    let primer = await subscribeToXat('fil', vi.fn(), REMOT);
    const vell = realtime.getChannels()[0]; confirma(vell);
    client.removeChannel.mockResolvedValueOnce('error').mockResolvedValueOnce('error');
    await unsubscribeFromXat(primer.subscription).catch(() => {});
    primer = null;
    await microtasques();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    expect(realtime.getChannels()).toEqual([vell]);
    const segon = await subscribeToXat('fil', vi.fn(), REMOT);
    expect(segon.error).toBeNull();
    expect(client.removeChannel).toHaveBeenCalledTimes(3);
    expect(client.channel).toHaveBeenCalledTimes(2);
    const fresc = realtime.getChannels()[0]; expect(fresc).not.toBe(vell); confirma(fresc);
    await unsubscribeFromXat(segon.subscription);
  });

  it('CUR06_REOPEN · cada nova demanda té dos intents màxim i els waiters fallits no tornen a intentar', async () => {
    const { client, realtime } = clientSenseXarxa();
    let primer = await subscribeToXat('fil', vi.fn(), REMOT);
    confirma(realtime.getChannels()[0]);
    client.removeChannel.mockResolvedValue('error');
    const baixa = unsubscribeFromXat(primer.subscription).catch(error => error);
    const espera = subscribeToXat('fil', vi.fn(), REMOT);
    expect((await baixa).code).toBe('CANAL_NO_TANCAT'); primer = null;
    expect((await espera).error).toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    const segon = await subscribeToXat('fil', vi.fn(), REMOT);
    expect(segon.error).toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    expect(client.removeChannel).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(client.removeChannel).toHaveBeenCalledTimes(4);
    client.removeChannel.mockImplementation(canal => realtime.removeChannel(canal));
    const tercer = await subscribeToXat('fil', vi.fn(), REMOT);
    expect(tercer.error).toBeNull(); expect(client.removeChannel).toHaveBeenCalledTimes(5);
    confirma(realtime.getChannels()[0]); await unsubscribeFromXat(tercer.subscription);
  });
});
