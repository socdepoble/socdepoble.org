import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { publicaAdjuntXat, quotaXat, urlAdjuntXat } from './xatMultimedia.js';
import { ERRORS_ADJUNT_XAT, MISSATGE_QUOTA_XAT, tempsLimitPujada } from '../xatMultimedia.js';
const m = vi.hoisted(() => ({ rpc: vi.fn(), request: vi.fn(), user: null }));
vi.mock('./runtime.js', () => ({ rpc: m.rpc, request: m.request, getResolvedConfig: (c) => ({ runtimeDataMode: c.dataMode || 'remote', supabaseUrl: 'https://node.test', supabaseAnonKey: 'publica' }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.user, jwtPerBackend: () => m.user ? 'sessio-test' : null }));
const JO = '00000000-0000-4000-8000-000000000001';
const ID = '00000000-0000-4000-8000-000000000002';
const FIL = '00000000-0000-4000-8000-000000000003';
const RUTA = ID;
// La memòria de signatures és per mòdul: cada prova d'URL usa el seu id.
let seguent = 0x100;
const idNou = () => `00000000-0000-4000-8000-${(seguent++).toString(16).padStart(12, '0')}`;
const entrada = () => ({ id: ID, fitxer: new Blob(['foto'], { type: 'image/webp' }), tipus: 'imatge' });
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { resolve, promise }; };
const signada = (id, token = 'temporal') => ({ signedURL: `/object/sign/xat_adjunts/${id}?token=${token}` });
beforeEach(() => {
  vi.clearAllMocks(); m.user = { id: JO };
  m.rpc.mockImplementation(async (nom, params) => {
    if (nom === 'xat_reserva_adjunt') return { ruta: RUTA, pujat: false };
    if (nom === 'xat_publica_adjunt') return { id: ID, seq: 1, tipus: 'imatge', usuari_id: JO, cos: 'Foto' };
    if (nom === 'xat_quota') return { usats: 4, limit: 20_000_000 };
    if (nom === 'xat_llegix_adjunt') return { ruta: params.p_id };
    return true;
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
test('no simula adjunts privats en mode seed ni local', async () => {
  await expect(publicaAdjuntXat(FIL, entrada(), { dataMode: 'seed' })).rejects.toMatchObject({ code: 'sense-capacitat' });
  expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});
test('reserva abans de pujar i només confirma després de validar en el servidor', async () => {
  await expect(publicaAdjuntXat(FIL, entrada())).resolves.toMatchObject({ id: ID, seq: 1, tipus: 'imatge' });
  expect(m.rpc.mock.calls.map(([n]) => n)).toEqual(['xat_reserva_adjunt', 'xat_publica_adjunt']);
  // MEDIA-5 · Sense peu, text null: cap etiqueta en valencià desada al servidor.
  expect(m.rpc.mock.calls[1][1]).toEqual({ p_id: ID, p_text: null, p_resposta_a: null });
  expect(fetch).toHaveBeenCalledWith(`https://node.test/storage/v1/object/xat_adjunts/${RUTA}`, expect.objectContaining({ method: 'POST', redirect: 'error', body: expect.any(Blob), signal: expect.any(AbortSignal) }));
});
test('la quota del servidor talla la pujada encara que la UI tinga un valor vell', async () => {
  m.rpc.mockRejectedValueOnce(new Error('SDP-XAT-020: quota'));
  await expect(publicaAdjuntXat(FIL, entrada())).rejects.toThrow(MISSATGE_QUOTA_XAT);
  expect(fetch).not.toHaveBeenCalled();
});
test('un upload fallit allibera la reserva però no confirma missatge', async () => {
  fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(publicaAdjuntXat(FIL, entrada())).rejects.toMatchObject({ code: 'xarxa', message: ERRORS_ADJUNT_XAT.xarxa });
  expect(m.rpc.mock.calls.map(([n]) => n)).toEqual(['xat_reserva_adjunt', 'xat_cancella_reserva']);
});
test('un reintent de reserva ja pujada no duplica bytes', async () => {
  m.rpc.mockResolvedValueOnce({ ruta: RUTA, pujat: true });
  await publicaAdjuntXat(FIL, entrada()); expect(fetch).not.toHaveBeenCalled();
});
test('una resposta perduda amb objecte duplicat passa a la validació final', async () => {
  fetch.mockResolvedValueOnce({ ok: false, status: 409 });
  await expect(publicaAdjuntXat(FIL, entrada())).resolves.toMatchObject({ id: ID });
});
test('canviar sessió durant la reserva no inicia upload ni publica amb la nova identitat', async () => {
  const tard = deferred(); m.rpc.mockReturnValueOnce(tard.promise);
  const resultat = publicaAdjuntXat(FIL, entrada());
  m.user = { id: FIL }; tard.resolve({ ruta: RUTA, pujat: false });
  await expect(resultat).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled(); expect(m.rpc).toHaveBeenCalledOnce();
});
test('cancel·lar upload aborta transport i no publica', async () => {
  const controller = new AbortController();
  fetch.mockImplementationOnce((_url, { signal }) => new Promise((_resolve, reject) => { signal.addEventListener('abort', () => reject(new DOMException('cancel·lat', 'AbortError'))); }));
  const resultat = publicaAdjuntXat(FIL, entrada(), { signal: controller.signal });
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce()); controller.abort();
  await expect(resultat).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.rpc.mock.calls.map(([n]) => n)).not.toContain('xat_publica_adjunt');
});
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-9) · El temps límit creix amb la mida. */
test('el temps límit de la pujada és proporcional a la mida i allibera la reserva buida', async () => {
  expect(tempsLimitPujada(4)).toBe(31_000);
  expect(tempsLimitPujada(20_000_000)).toBe(430_000);
  vi.useFakeTimers();
  const gran = { id: ID, fitxer: new Blob([new Uint8Array(5_000_000)], { type: 'video/mp4' }), tipus: 'video', duradaMs: 9_000 };
  fetch.mockImplementationOnce((_url, { signal }) => new Promise((_resolve, reject) => { signal.addEventListener('abort', () => reject(new DOMException('cancel·lat', 'AbortError'))); }));
  let acabat = null;
  const resultat = publicaAdjuntXat(FIL, gran).catch((e) => { acabat = e; return e; });
  await vi.advanceTimersByTimeAsync(30_000);
  expect(acabat).toBeNull();
  await vi.advanceTimersByTimeAsync(tempsLimitPujada(5_000_000) - 30_000);
  expect(await resultat).toMatchObject({ name: 'TimeoutError', code: 'temps-esgotat', message: ERRORS_ADJUNT_XAT['temps-esgotat'] });
  expect(m.rpc.mock.calls.map(([n]) => n)).toContain('xat_cancella_reserva');
});
test.each([{ usats: -1, limit: 20_000_000 }, { usats: 0, limit: 20971520 }])('quota invàlida no habilita controls: %s', async (quota) => {
  m.rpc.mockResolvedValueOnce(quota); await expect(quotaXat()).rejects.toMatchObject({ code: 'sense-capacitat' });
});
test('esquema absent dona estat honest sense capacitat', async () => {
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('no RPC'), { status: 404 }));
  await expect(quotaXat()).rejects.toMatchObject({ code: 'sense-capacitat' });
});
/* MEDIA-5 · Cap JSON del servidor arriba a la persona: cada fallada porta un codi traduïble. */
test('els errors SDP del servidor arriben amb el seu codi i el text humà', async () => {
  m.rpc.mockRejectedValueOnce(new Error('Supabase 403: {"code":"42501","message":"SDP-XAT-006: no eres membre del fil."}'));
  await expect(publicaAdjuntXat(FIL, entrada())).rejects.toMatchObject({ code: 'SDP-XAT-006', message: ERRORS_ADJUNT_XAT['SDP-XAT-006'] });
});
/* ADV-MEDIA-8 · Massa pendents (022) no és el límit de freqüència (429): esperar no ho resol. */
test('massa fitxers pendents arriba amb el seu codi, no com a «massa missatges»', async () => {
  m.rpc.mockRejectedValueOnce(new Error('Supabase 429: {"code":"42900","message":"SDP-XAT-022: tens massa fitxers pendents d’enviar."}'));
  await expect(publicaAdjuntXat(FIL, entrada())).rejects.toMatchObject({ code: 'SDP-XAT-022', message: ERRORS_ADJUNT_XAT['SDP-XAT-022'] });
  expect(fetch).not.toHaveBeenCalled();
});
test('un rebuig de Storage sense codi conegut no mostra el cos cru', async () => {
  fetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => '{"statusCode":"400","error":"InvalidRequest"}' });
  const error = await publicaAdjuntXat(FIL, entrada()).catch((e) => e);
  expect(error).toMatchObject({ code: 'servidor', status: 400 });
  expect(error.message).not.toMatch(/[{}]/);
});
test('el disparador de Storage (SDP-XAT-021) ix amb el seu codi', async () => {
  fetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => '{"message":"SDP-XAT-021: el fitxer no coincidix amb la reserva."}' });
  await expect(publicaAdjuntXat(FIL, entrada())).rejects.toMatchObject({ code: 'SDP-XAT-021' });
});
test('URL signada només per objecte autoritzat i origen de backend', async () => {
  m.request.mockResolvedValueOnce(signada(RUTA));
  await expect(urlAdjuntXat(ID)).resolves.toBe(`https://node.test/storage/v1/object/sign/xat_adjunts/${RUTA}?token=temporal`);
  expect(m.request).toHaveBeenCalledWith(expect.any(String), {}, expect.objectContaining({ body: { expiresIn: 60 } }));
});
test('una URL de signatura externa no es mostra en la bombolla', async () => {
  m.request.mockResolvedValueOnce({ signedURL: 'https://forani.test/fitxer' });
  await expect(urlAdjuntXat(idNou())).rejects.toMatchObject({ code: 'obrir' });
});
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-8, STRESS-2 i STRESS-7). */
test('tornar a muntar dins de la finestra reutilitza la URL sense cap petició', async () => {
  const id = idNou();
  m.request.mockResolvedValueOnce(signada(id));
  const primera = await urlAdjuntXat(id);
  await expect(urlAdjuntXat(id)).resolves.toBe(primera);
  expect(m.rpc).toHaveBeenCalledOnce(); expect(m.request).toHaveBeenCalledOnce();
});
test('passat el marge, una sola petició: la signatura (la ruta ja és coneguda)', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const id = idNou();
  m.request.mockResolvedValueOnce(signada(id, 'a')).mockResolvedValueOnce(signada(id, 'b'));
  await urlAdjuntXat(id);
  vi.setSystemTime(Date.now() + 46_000);
  await expect(urlAdjuntXat(id)).resolves.toMatch(/token=b$/);
  expect(m.rpc).toHaveBeenCalledOnce(); expect(m.request).toHaveBeenCalledTimes(2);
});
test('renova força una signatura nova després d’un error de càrrega', async () => {
  const id = idNou();
  m.request.mockResolvedValueOnce(signada(id, 'a')).mockResolvedValueOnce(signada(id, 'b'));
  await urlAdjuntXat(id);
  await expect(urlAdjuntXat(id, {}, { renova: true })).resolves.toMatch(/token=b$/);
  expect(m.rpc).toHaveBeenCalledOnce();
});
test('una altra sessió no hereta cap URL ni cap ruta', async () => {
  const id = idNou();
  m.request.mockResolvedValueOnce(signada(id, 'a')).mockResolvedValueOnce(signada(id, 'b'));
  await urlAdjuntXat(id);
  m.user = { id: FIL };
  await expect(urlAdjuntXat(id)).resolves.toMatch(/token=b$/);
  expect(m.rpc).toHaveBeenCalledTimes(2);
});
test('si Storage ja no signa, la ruta s’oblida i el pròxim intent torna a preguntar al servidor', async () => {
  const id = idNou();
  m.request.mockResolvedValueOnce(signada(id, 'a'))
    .mockRejectedValueOnce(Object.assign(new Error('Supabase 400: {"error":"not_found"}'), { status: 400 }))
    .mockResolvedValueOnce(signada(id, 'c'));
  await urlAdjuntXat(id);
  await expect(urlAdjuntXat(id, {}, { renova: true })).rejects.toMatchObject({ code: 'servidor' });
  await urlAdjuntXat(id);
  expect(m.rpc).toHaveBeenCalledTimes(2);
});

test('descartar marca abans d’esborrar bytes i allibera reserva després', async () => {
  const { descartaAdjuntXat } = await import('./xatMultimedia.js');
  m.rpc.mockResolvedValueOnce({ ruta: ID });
  m.request.mockResolvedValueOnce([]);
  await expect(descartaAdjuntXat(ID)).resolves.toBe(true);
  expect(m.rpc.mock.calls.map(([n]) => n)).toEqual(['xat_prepara_descart','xat_cancella_reserva']);
  expect(m.request).toHaveBeenCalledWith('/storage/v1/object/xat_adjunts', {}, expect.objectContaining({ method: 'DELETE', body: { prefixes: [ID] } }));
});
test('si Storage no confirma el descart, la quota no s’allibera', async () => {
  const { descartaAdjuntXat } = await import('./xatMultimedia.js');
  m.rpc.mockResolvedValueOnce({ ruta: ID });
  m.request.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(descartaAdjuntXat(ID)).rejects.toMatchObject({ code: 'xarxa' });
  expect(m.rpc.mock.calls.map(([n]) => n)).toEqual(['xat_prepara_descart']);
});
