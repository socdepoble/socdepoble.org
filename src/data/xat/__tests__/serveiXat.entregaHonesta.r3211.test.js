import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaServeiXat } from '../serveiXat.js';
const port = vi.hoisted(() => ({ loadFils: vi.fn(), enviaMissatge: vi.fn(), refrescaSessio: vi.fn() }));
vi.mock('../../backendPort.js', () => port);
const ID = '11111111-1111-4111-8111-111111111111', FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONFIG = { dataMode: 'remote', backendUrl: 'https://test.invalid' };
let context, envia, carregaFils, servei;
const creades = [];
beforeEach(() => {
  vi.clearAllMocks();
  context = { backend: 'backend-prova', tenantId: 'torre', usuariId: 'persona-a', actorOrgId: null, generacioLogin: 1, autenticat: true };
  envia = vi.fn(async (filId, p) => ({ id: p.id, filId, seq: 7, text: p.text }));
  carregaFils = vi.fn(async () => [{ id: FIL, rebutPelsAltresFinsSeq: 0, llegitPelsAltresFinsSeq: 0 }]);
  servei = creaServeiXat({ enviaMissatge: envia, carregaFils, obteContextSessio: () => context,
    generaUuid: () => ID, escoltaCanvisSessio: null }); creades.push(servei);
});
afterEach(() => { creades.splice(0).forEach(s => s.tanca()); });
const enviaUn = (options = CONFIG) => servei.enviaMissatge(FIL, { id: ID, text: 'Text privat' }, options);
const consulta = (options = CONFIG) => servei.consultaEstatEntrega(FIL, ID, options);

test('l’ACK del servidor només acredita enviat, encara que anuncie marques optimistes', async () => {
  envia.mockImplementation(async (filId, p) => ({ id: p.id, filId, seq: 7, entregat: true, llegit: true,
    rebutPelsAltresFinsSeq: 99, llegitPelsAltresFinsSeq: 99, estatEntrega: { estat: 'llegit_confirmat' } }));
  const r = await enviaUn();
  expect(r).toMatchObject({ id: ID, client_msg_id: ID, seq: 7, estatEntrega: { estat: 'enviat_servidor', rebutConfirmat: false, lecturaConfirmada: false } });
  expect(carregaFils).not.toHaveBeenCalled();
});

test.each([{ id: ID, filId: FIL, encuat: true }, { id: ID, filId: FIL, seq: 0 },
  { id: ID, filId: 'altre', seq: 7 }, { id: 'altre', filId: FIL, seq: 7 }, { id: ID, seq: 7 }])('l’ACK incomplet o encolat conserva la forma antiga i queda en cua_local: %j', async resposta => {
  envia.mockResolvedValue(resposta);
  expect(await enviaUn()).toMatchObject({ ...resposta, estatEntrega: { estat: 'cua_local', confirmatServidor: false } });
  expect((await consulta()).estat).toBe('cua_local');
  expect(carregaFils).not.toHaveBeenCalled();
});

test('consulta explícita usa el port autenticat, els cursors aliens i manté monotonia', async () => {
  await enviaUn();
  carregaFils.mockResolvedValueOnce([{ id: FIL, rebutPelsAltresFinsSeq: 7, llegitPelsAltresFinsSeq: 0 }]);
  expect(await consulta()).toMatchObject({ estat: 'rebut_destinatari', seq: 7, rebutConfirmat: true, lecturaConfirmada: false });
  carregaFils.mockResolvedValueOnce([{ id: FIL, rebutPelsAltresFinsSeq: 7, llegitPelsAltresFinsSeq: 7 }]);
  expect(await consulta()).toMatchObject({ estat: 'llegit_confirmat', lecturaConfirmada: true });
  carregaFils.mockResolvedValueOnce([{ id: FIL, rebutPelsAltresFinsSeq: 1, llegitPelsAltresFinsSeq: 1 }]);
  expect((await consulta()).estat).toBe('llegit_confirmat');
  expect(carregaFils).toHaveBeenCalledTimes(3);
  expect(carregaFils).toHaveBeenLastCalledWith(expect.objectContaining({ ...CONFIG, signal: expect.any(AbortSignal) }));
});

test.each([
  [{ id: FIL, rebutFinsSeq: 100, llegitFinsSeq: 100 }],
  [{ id: FIL, esPropi: true, rebutPelsAltresFinsSeq: 100, llegitPelsAltresFinsSeq: 100 }],
  [{ id: FIL, perDefecte: true, rebutPelsAltresFinsSeq: 100, llegitPelsAltresFinsSeq: 100 }],
  [{ id: FIL, rebutPelsAltresFinsSeq: '100', llegitPelsAltresFinsSeq: {} }],
  [{ id: FIL, rebutPelsAltresFinsSeq: 100 }, { id: FIL, rebutPelsAltresFinsSeq: 100 }],
  { data: [{ id: FIL, rebutPelsAltresFinsSeq: 100 }], complete: false },
])('cap cursor propi, local, ambigu o sense resposta completa acredita entrega: %j', async files => {
  await enviaUn(); carregaFils.mockResolvedValue(files);
  expect(await consulta()).toMatchObject({ estat: 'enviat_servidor', rebutConfirmat: false, lecturaConfirmada: false });
});

test('una resposta sense fila o amb error de xarxa manté el darrer ACK i declara consulta desconeguda', async () => {
  await enviaUn(); carregaFils.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Sense xarxa'));
  expect(await consulta()).toMatchObject({ estat: 'enviat_servidor', rebutsConeguts: false });
  expect(await consulta()).toMatchObject({ estat: 'enviat_servidor', rebutsConeguts: false });
});

test('cursors amb accessors o llistes fora del límit es rebutgen sense executar getters', async () => {
  await enviaUn(); let calls = 0;
  const fila = { id: FIL }; Object.defineProperty(fila, 'rebutPelsAltresFinsSeq', { enumerable: true, get() { calls++; return 99; } });
  carregaFils.mockResolvedValueOnce([fila]).mockResolvedValueOnce(new Array(5001));
  expect((await consulta()).estat).toBe('enviat_servidor'); expect((await consulta()).estat).toBe('enviat_servidor');
  expect(calls).toBe(0);
});

test.each(['usuariId', 'tenantId', 'backend', 'actorOrgId', 'generacioLogin'])('canviar %s durant lectura talla el cursor antic i no el reutilitza', async field => {
  await enviaUn(); let resol;
  carregaFils.mockImplementationOnce(() => new Promise(r => { resol = r; }));
  const lectura = consulta().catch(e => e);
  await vi.waitFor(() => expect(resol).toEqual(expect.any(Function)));
  context = { ...context, [field]: field === 'generacioLogin' ? 2 : 'nou' };
  servei.revalidaEnVol();
  expect(await lectura).toMatchObject({ codi: 'SESSIO_CANVIADA' });
  resol([{ id: FIL, llegitPelsAltresFinsSeq: 100 }]);
  await Promise.resolve();
  expect(await consulta()).toBeNull();
});

test('logout, cancel·lació i tancament liquiden lectures encara que el transport ignore signal', async () => {
  await enviaUn(); let entra;
  const entered = new Promise(r => { entra = r; });
  carregaFils.mockImplementation(() => { entra(); return new Promise(() => {}); });
  const control = new AbortController();
  const lectura = consulta({ ...CONFIG, signal: control.signal }).catch(e => e);
  await entered; control.abort(new DOMException('Cancel·lat', 'AbortError'));
  expect(await lectura).toMatchObject({ name: 'AbortError' });
  const altra = consulta().catch(e => e); await Promise.resolve(); servei.tanca();
  expect(await altra).toMatchObject({ codi: 'SERVEI_TANCAT' });
});

test('una còpia mutable de la config no mou el transport ni la identitat de la consulta', async () => {
  await enviaUn(); const config = { ...CONFIG };
  let release;
  carregaFils.mockImplementationOnce(async captured => {
    expect(captured.backendUrl).toBe(CONFIG.backendUrl);
    await new Promise(r => { release = r; });
    expect(captured.backendUrl).toBe(CONFIG.backendUrl);
    return [{ id: FIL, rebutPelsAltresFinsSeq: 7 }];
  });
  const lectura = consulta(config); config.backendUrl = 'https://altre.invalid';
  await vi.waitFor(() => expect(release).toEqual(expect.any(Function))); release();
  expect((await lectura).estat).toBe('rebut_destinatari');
});

test('el consumidor per defecte consulta loadFils del port, sense afegir cap crida en enviar', async () => {
  const real = creaServeiXat({ enviaMissatge: envia, obteContextSessio: () => context, escoltaCanvisSessio: null });
  creades.push(real); port.loadFils.mockResolvedValue([{ id: FIL, llegitPelsAltresFinsSeq: 7 }]);
  await real.enviaMissatge(FIL, { id: ID, text: 'Text' }, CONFIG);
  expect(port.loadFils).not.toHaveBeenCalled();
  expect(await real.consultaEstatEntrega(FIL, ID, CONFIG)).toMatchObject({ estat: 'llegit_confirmat' });
  expect(port.loadFils).toHaveBeenCalledTimes(1);
});

test('cap ACK de mode seed/local ni actor declarat alié es presenta com entrega remota', async () => {
  for (const dataMode of ['seed', 'local']) {
    expect(await enviaUn({ ...CONFIG, dataMode })).toMatchObject({ estatEntrega: { estat: 'cua_local' } });
  }
  await expect(consulta({ ...CONFIG, actorOrgId: 'entitat-aliena' })).rejects.toMatchObject({ codi: 'SESSIO_CANVIADA' });
  expect(carregaFils).not.toHaveBeenCalled();
});

test('la config real del transport també separa ACKs encara que un consumidor injecte context constant', async () => {
  await enviaUn();
  expect(await consulta({ ...CONFIG, backendUrl: 'https://altre.invalid' })).toBeNull();
  expect(await consulta({ ...CONFIG, dataMode: 'local' })).toBeNull();
  expect(carregaFils).not.toHaveBeenCalled();
});

test('una lectura penjada té termini de 15 s; el cursor tardà no confirma entrega i no deixa timers', async () => {
  await enviaUn(); let release, signal, outcome;
  carregaFils.mockImplementationOnce(options => {
    signal = options.signal; return new Promise(r => { release = r; });
  });
  vi.useFakeTimers();
  try {
    consulta().then(value => { outcome = { value }; }, error => { outcome = { error }; });
    await vi.advanceTimersByTimeAsync(14999); expect(outcome).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(outcome?.error).toMatchObject({ codi: 'ENTREGA_CONSULTA_TIMEOUT', retriable: true });
    expect(signal.aborted).toBe(true); expect(servei.comptaEnVol()).toBe(0); expect(vi.getTimerCount()).toBe(0);
    release([{ id: FIL, llegitPelsAltresFinsSeq: 100 }]);
    await vi.advanceTimersByTimeAsync(0);
    expect(await consulta()).toMatchObject({ estat: 'enviat_servidor', lecturaConfirmada: false });
    expect(vi.getTimerCount()).toBe(0);
    carregaFils.mockImplementationOnce(() => new Promise(() => {}));
    const nova = consulta().catch(e => e); servei.tanca();
    expect(await nova).toMatchObject({ codi: 'SERVEI_TANCAT' });
    expect(servei.comptaEnVol()).toBe(0); expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});

test('logout durant consulta pendent retira el termini i la subscripció sense esperar el port', async () => {
  await enviaUn(); carregaFils.mockImplementationOnce(() => new Promise(() => {}));
  vi.useFakeTimers();
  try {
    const lectura = consulta().catch(e => e);
    expect(servei.comptaEnVol()).toBe(1);
    context = { ...context, autenticat: false, usuariId: null };
    servei.revalidaEnVol();
    expect(await lectura).toMatchObject({ codi: 'SESSIO_CANVIADA' });
    expect(servei.comptaEnVol()).toBe(0); expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});
