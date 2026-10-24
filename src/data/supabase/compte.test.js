import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ gen: 0, user: { id: 'A' }, jwt: 'jwt.A', hasConfig: true, ordre: [], rpc: vi.fn(), logout: vi.fn(), request: vi.fn(),
  jwtPerBackend: vi.fn() }));
/* capturaSessio sintètic: qualsevol salt de generació (logout, B, reentrada d'A) invalida la captura.
   Actualitzada a posta (261024 correccions): compte.js llig el testimoni de la sessió capturada amb
   jwtPerBackend (Codex D-01 / Gemini G2-04); el doble torna el JWT viu de la persona sintètica. */
vi.mock('../identitat.js', () => ({ capturaSessio: () => { const g = m.gen;
  return () => { if (g !== m.gen) throw new DOMException('La sessió ha canviat.', 'AbortError'); }; },
  jwtPerBackend: m.jwtPerBackend }));
/* Actualitzada a posta (261024 T1): compte.js també crida request() (la funció compte-apple) i getCurrentUser(). */
vi.mock('./runtime.js', () => ({ getResolvedConfig: () => ({ hasSupabaseConfig: m.hasConfig }), rpc: m.rpc, request: m.request,
  getCurrentUser: () => m.user }));
vi.mock('./auth.js', () => ({ asseguraUsuari: async (_config, current) => { current(); return m.user; }, logout: m.logout }));
import { cancelaBaixa, demanaBaixa, estatBaixa, estatConsentiment, exportaLesMeuesDades, revocaConsentiment } from './compte.js';

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
/* La sessió canvia quan la petició JA és a la xarxa: és la resposta la que arriba tard. */
const quanSiguaEnviada = () => vi.waitFor(() => expect(m.rpc).toHaveBeenCalledTimes(1));
const EXPORTACIO = { format: 'socdepoble.exportacio.v1', perfil: { id: 'A' } };
beforeEach(() => {
  m.gen = 0; m.user = { id: 'A' }; m.jwt = 'jwt.A'; m.hasConfig = true; m.ordre = [];
  m.jwtPerBackend.mockReset(); m.jwtPerBackend.mockImplementation(() => m.jwt);
  m.rpc.mockReset(); m.rpc.mockImplementation(async (nom) => { m.ordre.push(`rpc ${nom}`); return null; });
  m.logout.mockReset(); m.logout.mockImplementation(async () => { m.ordre.push('logout'); });
  m.request.mockReset(); m.request.mockImplementation(async (ruta) => { m.ordre.push(`request ${ruta}`); return { ok: true, resultat: 'revocat' }; });
});

const TOTS = [
  ['exportaLesMeuesDades', () => exportaLesMeuesDades()],
  ['estatBaixa', () => estatBaixa()],
  ['demanaBaixa', () => demanaBaixa({ motiu: 'x' })],
  ['cancelaBaixa', () => cancelaBaixa()],
  ['estatConsentiment', () => estatConsentiment()],
  ['revocaConsentiment', () => revocaConsentiment('analitica')]
];
for (const [nom, crida] of TOTS) {
  test(`${nom} sense sessió rebutja sense cridar cap RPC`, async () => {
    m.user = null;
    await expect(crida()).rejects.toThrow('Cal iniciar sessió');
    expect(m.rpc).not.toHaveBeenCalled(); expect(m.logout).not.toHaveBeenCalled(); expect(m.request).not.toHaveBeenCalled();
  });
  test(`${nom} sense servidor configurat rebutja sense cridar cap RPC`, async () => {
    m.hasConfig = false; m.user = { id: 'A', app_metadata: { providers: ['apple'] } };
    await expect(crida()).rejects.toThrow('connexió amb el servidor');
    expect(m.rpc).not.toHaveBeenCalled(); expect(m.request).not.toHaveBeenCalled();
  });
}

test('l’exportació torna l’objecte tal qual i amplia el temps d’espera', async () => {
  m.rpc.mockResolvedValueOnce(EXPORTACIO);
  const controller = new AbortController();
  expect(await exportaLesMeuesDades({ signal: controller.signal })).toEqual(EXPORTACIO);
  const [nom, cos, , opcions] = m.rpc.mock.calls[0];
  expect(nom).toBe('exporta_les_meues_dades'); expect(cos).toEqual({});
  expect(opcions.timeoutMs).toBeGreaterThan(12000); expect(opcions.signal).toBe(controller.signal);
});
for (const dolenta of [null, [], 'text', { format: 'altre.v9' }]) {
  test(`l’exportació rebutja una resposta amb forma ${JSON.stringify(dolenta)}`, async () => {
    m.rpc.mockResolvedValueOnce(dolenta);
    await expect(exportaLesMeuesDades()).rejects.toThrow('format inesperat');
  });
}
test('una exportació tardana no arriba a la sessió que ha vingut després', async () => {
  const resposta = deferred(); m.rpc.mockReturnValueOnce(resposta.promise);
  const feina = exportaLesMeuesDades(); const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
  await quanSiguaEnviada(); m.gen++; resposta.resolve(EXPORTACIO);
  await assercio;
});

test('estatBaixa normalitza a camelCase, en objecte o en array', async () => {
  const fila = { demanada: true, demanada_al: '2026-09-26T10:00:00Z', purga_prevista_al: '2026-10-26T10:00:00Z' };
  const esperat = { demanada: true, demanadaAl: fila.demanada_al, purgaPrevistaAl: fila.purga_prevista_al };
  m.rpc.mockResolvedValueOnce(fila); expect(await estatBaixa()).toEqual(esperat);
  m.rpc.mockResolvedValueOnce([fila]); expect(await estatBaixa()).toEqual(esperat);
  expect(m.rpc.mock.calls[0][0]).toBe('estat_baixa');
});
test('estatBaixa sense baixa torna l’estat buit sencer', async () => {
  m.rpc.mockResolvedValueOnce({ demanada: false, demanada_al: null, purga_prevista_al: null });
  expect(await estatBaixa()).toEqual({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
});
test('estatBaixa amb una resposta sense forma llança en lloc de dir «sense baixa»', async () => {
  m.rpc.mockResolvedValueOnce(null);
  await expect(estatBaixa()).rejects.toThrow('format inesperat');
});

test('una baixa confirmada crida l’RPC i després el logout global, en eixe ordre', async () => {
  const config = { tenantId: '00000000-0000-4000-8000-000000000000' };
  m.rpc.mockImplementationOnce(async (nom) => { m.ordre.push(`rpc ${nom}`);
    return { demanada_al: '2026-09-26T10:00:00Z', purga_prevista_al: '2026-10-26T10:00:00Z', ja_demanada: false }; });
  expect(await demanaBaixa({ motiu: '  Me’n vaig  ' }, config)).toEqual(
    { demanada: true, demanadaAl: '2026-09-26T10:00:00Z', purgaPrevistaAl: '2026-10-26T10:00:00Z' });
  expect(m.ordre).toEqual(['rpc demana_baixa', 'logout']);
  expect(m.rpc.mock.calls[0][1]).toEqual({ p_motiu: 'Me’n vaig' });
  expect(m.logout).toHaveBeenCalledWith(expect.objectContaining({ tenantId: '00000000-0000-4000-8000-000000000000' }), { scope: 'global' });
  /* T1 (261024) · Sense Apple a la sessió, cap crida a la funció compte-apple. */
  expect(m.request).not.toHaveBeenCalled();
});

/* ── T1 (261024; P0-04, App Store 5.1.1(v)) · La revocació d'Apple abans de la baixa ── */
const BAIXA = { demanada_al: '2026-10-24T10:00:00Z', purga_prevista_al: '2026-11-23T10:00:00Z', ja_demanada: false };
const ambApple = (meta = { providers: ['email', 'apple'] }) => { m.user = { id: 'A', app_metadata: meta }; };
const respostaDeBaixa = () => m.rpc.mockImplementationOnce(async (nom) => { m.ordre.push(`rpc ${nom}`); return BAIXA; });
const FUNCIO = 'request /functions/v1/compte-apple';

test('amb Apple: la funció compte-apple revoca ABANS de demana_baixa (que esborra les sessions) i després el logout', async () => {
  ambApple(); respostaDeBaixa();
  const controller = new AbortController();
  await expect(demanaBaixa({}, { signal: controller.signal })).resolves.toMatchObject({ demanada: true });
  expect(m.ordre).toEqual([FUNCIO, 'rpc demana_baixa', 'logout']);
  const [ruta, , opcions] = m.request.mock.calls[0];
  expect(ruta).toBe('/functions/v1/compte-apple');
  expect(opcions).toMatchObject({ method: 'POST', body: { accio: 'revoca' }, timeoutMs: 10000, signal: controller.signal });
});
test('amb Apple segons app_metadata.provider també revoca; amb un altre proveïdor, no', async () => {
  ambApple({ provider: 'apple' }); respostaDeBaixa();
  await demanaBaixa();
  expect(m.ordre[0]).toBe(FUNCIO);
  m.ordre = []; m.request.mockClear();
  ambApple({ provider: 'google', providers: ['google'] }); respostaDeBaixa();
  await demanaBaixa();
  expect(m.request).not.toHaveBeenCalled();
  expect(m.ordre).toEqual(['rpc demana_baixa', 'logout']);
});
for (const [cas, error] of [
  ['la funció falla (502)', Object.assign(new Error('Supabase 502: {"ok":false,"error":"apple"}'), { status: 502 })],
  ['la funció no està desplegada (404)', Object.assign(new Error('Supabase 404'), { status: 404 })],
  ['el temps s’esgota', Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' })],
  ['no hi ha xarxa', new TypeError('Failed to fetch')]
]) {
  test(`amb Apple, si ${cas}: la baixa continua i ho diu un avís`, async () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ambApple(); respostaDeBaixa();
    m.request.mockImplementationOnce(async (ruta) => { m.ordre.push(`request ${ruta}`); throw error; });
    await expect(demanaBaixa()).resolves.toMatchObject({ demanada: true });
    expect(m.ordre).toEqual([FUNCIO, 'rpc demana_baixa', 'logout']);
    expect(avis).toHaveBeenCalled(); avis.mockRestore();
  });
}
test('amb Apple, un canvi de sessió mentre la funció revoca: AbortError, sense demana_baixa ni logout', async () => {
  ambApple();
  const resposta = deferred(); m.request.mockReturnValueOnce(resposta.promise);
  const feina = demanaBaixa(); const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(1));
  m.gen++; m.user = { id: 'B' };
  resposta.resolve({ ok: true, resultat: 'revocat' });
  await assercio;
  expect(m.rpc).not.toHaveBeenCalled(); expect(m.logout).not.toHaveBeenCalled();
});
test('amb Apple, una cancel·lació (AbortError de la petició) para la baixa sense demana_baixa', async () => {
  ambApple();
  m.request.mockRejectedValueOnce(new DOMException('Abortat', 'AbortError'));
  await expect(demanaBaixa()).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.rpc).not.toHaveBeenCalled(); expect(m.logout).not.toHaveBeenCalled();
});

/* ── Codex D-01 / Gemini G2-04 (261024 correccions) · La microtasca entre sessioDelCompte i el primer efecte ──
   La sessió d'A passa a B just després que sessioDelCompte l'haja comprovada: abans, la revocació llegia B
   (teAppleVinculat i el JWT viu de request()) i revocava l'Apple de B abans que la comprovació posterior parara
   la baixa. Reproducció de /tmp/261024_compte_race_regressio_codex.test.js amb l'expectativa correcta. */
const canviaABEnLaMicrotasca = () => queueMicrotask(() => {
  m.gen++; m.user = { id: 'B', app_metadata: { providers: ['apple'] } }; m.jwt = 'jwt.B';
});
test('[REGRESSIO D-01] un canvi A→B a la microtasca no revoca l’Apple de ningú ni envia el JWT de B', async () => {
  const revocades = [];
  ambApple();
  m.request.mockImplementation(async (_ruta, _config, opcions) => { revocades.push([m.user.id, opcions?.headers?.Authorization]); return { ok: true }; });
  const feina = demanaBaixa();
  const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
  canviaABEnLaMicrotasca();
  await assercio;
  expect(revocades).toEqual([]);
  expect(m.request).not.toHaveBeenCalled();
  expect(m.rpc).not.toHaveBeenCalled(); expect(m.logout).not.toHaveBeenCalled();
});
for (const [nom, crida] of TOTS) {
  test(`[REGRESSIO D-01] ${nom}: un canvi A→B a la microtasca para abans de cap RPC o petició`, async () => {
    ambApple();
    const feina = crida();
    const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
    canviaABEnLaMicrotasca();
    await assercio;
    expect(m.rpc).not.toHaveBeenCalled(); expect(m.request).not.toHaveBeenCalled(); expect(m.logout).not.toHaveBeenCalled();
  });
}
test('amb Apple, la revocació porta explícit el testimoni capturat d’A, llegit una sola vegada abans de la petició', async () => {
  ambApple(); respostaDeBaixa();
  await expect(demanaBaixa()).resolves.toMatchObject({ demanada: true });
  const [, , opcions] = m.request.mock.calls[0];
  expect(opcions.headers).toEqual({ Authorization: 'Bearer jwt.A' });
  expect(m.jwtPerBackend).toHaveBeenCalledTimes(1);
  expect(m.jwtPerBackend.mock.invocationCallOrder[0]).toBeLessThan(m.request.mock.invocationCallOrder[0]);
});
test('amb Apple però sense cap testimoni enviable (sessió pilot), cap petició a compte-apple i la baixa continua', async () => {
  ambApple(); respostaDeBaixa(); m.jwt = null;
  await expect(demanaBaixa()).resolves.toMatchObject({ demanada: true });
  expect(m.request).not.toHaveBeenCalled();
  expect(m.ordre).toEqual(['rpc demana_baixa', 'logout']);
});
test('teAppleVinculat decidix per la persona capturada, no per la sessió viva', async () => {
  /* asseguraUsuari torna la persona sense Apple; després la sessió viva diria Apple, sense canviar de generació. */
  m.user = { id: 'A', app_metadata: { providers: ['email'] } }; respostaDeBaixa();
  const feina = demanaBaixa();
  queueMicrotask(() => { m.user = { id: 'A', app_metadata: { providers: ['email', 'apple'] } }; });
  await expect(feina).resolves.toMatchObject({ demanada: true });
  expect(m.request).not.toHaveBeenCalled();
});
test('cancelaBaixa, estatBaixa i l’exportació no criden mai la funció compte-apple', async () => {
  ambApple();
  m.rpc.mockResolvedValueOnce({ cancelada: true }); await cancelaBaixa();
  m.rpc.mockResolvedValueOnce({ demanada: false }); await estatBaixa();
  m.rpc.mockResolvedValueOnce(EXPORTACIO); await exportaLesMeuesDades();
  expect(m.request).not.toHaveBeenCalled();
});
test('sense motiu s’envia null, no una cadena buida', async () => {
  m.rpc.mockResolvedValueOnce({ demanada_al: '2026-09-26T10:00:00Z', purga_prevista_al: null });
  await demanaBaixa();
  expect(m.rpc.mock.calls[0][1]).toEqual({ p_motiu: null });
});
test('una baixa no confirmada o un RPC fallit no tanca la sessió', async () => {
  m.rpc.mockResolvedValueOnce({ ja_demanada: false });
  await expect(demanaBaixa()).rejects.toThrow('no ha confirmat la baixa');
  m.rpc.mockRejectedValueOnce(new Error('Supabase 500'));
  await expect(demanaBaixa()).rejects.toThrow('Supabase 500');
  expect(m.logout).not.toHaveBeenCalled();
});
test('una baixa tardana després d’un canvi de sessió rebutja amb AbortError i no fa logout', async () => {
  const resposta = deferred(); m.rpc.mockReturnValueOnce(resposta.promise);
  const feina = demanaBaixa(); const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
  await quanSiguaEnviada(); m.gen++; m.user = { id: 'B' };
  resposta.resolve({ demanada_al: '2026-09-26T10:00:00Z', purga_prevista_al: '2026-10-26T10:00:00Z' });
  await assercio; expect(m.logout).not.toHaveBeenCalled();
});
test('si el logout falla després de confirmar, la baixa es dona igualment per feta', async () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  m.rpc.mockResolvedValueOnce({ demanada_al: '2026-09-26T10:00:00Z', purga_prevista_al: '2026-10-26T10:00:00Z' });
  m.logout.mockRejectedValueOnce(new Error('realtime'));
  await expect(demanaBaixa()).resolves.toMatchObject({ demanada: true });
  expect(avis).toHaveBeenCalled(); avis.mockRestore();
});

test('cancelaBaixa exigix la confirmació del servidor', async () => {
  m.rpc.mockResolvedValueOnce({ cancelada: true });
  expect(await cancelaBaixa()).toEqual({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
  expect(m.rpc.mock.calls[0][0]).toBe('cancela_baixa');
  m.rpc.mockResolvedValueOnce({});
  await expect(cancelaBaixa()).rejects.toThrow('no ha confirmat la cancel·lació');
  expect(m.logout).not.toHaveBeenCalled();
});

test('estatConsentiment normalitza la resposta al contracte', async () => {
  m.rpc.mockResolvedValueOnce({ versio_vigent: 'v2', url: '/legal', text_sha256: 'a'.repeat(64), cal_reconsentir: false,
    consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v2', al: '2026-09-26T10:00:00Z' }, 'brossa'] });
  expect(await estatConsentiment()).toEqual({ versioVigent: 'v2', url: '/legal', textSha256: 'a'.repeat(64),
    consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v2', al: '2026-09-26T10:00:00Z' }], calReconsentir: false });
  expect(m.rpc.mock.calls[0][0]).toBe('estat_consentiment');
});
test('estatConsentiment: sense política ni actes, i davant del dubte cal re-consentir', async () => {
  m.rpc.mockResolvedValueOnce({ versio_vigent: null, url: null, text_sha256: null, consentiments: null });
  expect(await estatConsentiment()).toEqual({ versioVigent: null, url: null, textSha256: null, consentiments: [], calReconsentir: true });
  m.rpc.mockResolvedValueOnce([]);
  await expect(estatConsentiment()).rejects.toThrow('format inesperat');
});
test('estatConsentiment tardà no arriba a la sessió següent', async () => {
  const resposta = deferred(); m.rpc.mockReturnValueOnce(resposta.promise);
  const feina = estatConsentiment(); const assercio = expect(feina).rejects.toMatchObject({ name: 'AbortError' });
  await quanSiguaEnviada(); m.gen++; resposta.resolve({ versio_vigent: 'v1', cal_reconsentir: false, consentiments: [] });
  await assercio;
});

test('revocaConsentiment envia el tipus i no torna res', async () => {
  expect(await revocaConsentiment(' analitica ')).toBeUndefined();
  expect(m.rpc).toHaveBeenCalledWith('revoca_consentiment', { p_tipus: 'analitica' }, expect.any(Object));
});
test('revocaConsentiment sense tipus rebutja sense cridar cap RPC', async () => {
  await expect(revocaConsentiment('  ')).rejects.toThrow('quin consentiment');
  await expect(revocaConsentiment()).rejects.toThrow('quin consentiment');
  expect(m.rpc).not.toHaveBeenCalled();
});
