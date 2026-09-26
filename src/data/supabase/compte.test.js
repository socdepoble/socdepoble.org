import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ gen: 0, user: { id: 'A' }, hasConfig: true, ordre: [], rpc: vi.fn(), logout: vi.fn() }));
/* capturaSessio sintètic: qualsevol salt de generació (logout, B, reentrada d'A) invalida la captura. */
vi.mock('../identitat.js', () => ({ capturaSessio: () => { const g = m.gen;
  return () => { if (g !== m.gen) throw new DOMException('La sessió ha canviat.', 'AbortError'); }; } }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: () => ({ hasSupabaseConfig: m.hasConfig }), rpc: m.rpc }));
vi.mock('./auth.js', () => ({ asseguraUsuari: async (_config, current) => { current(); return m.user; }, logout: m.logout }));
import { cancelaBaixa, demanaBaixa, estatBaixa, estatConsentiment, exportaLesMeuesDades, revocaConsentiment } from './compte.js';

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
/* La sessió canvia quan la petició JA és a la xarxa: és la resposta la que arriba tard. */
const quanSiguaEnviada = () => vi.waitFor(() => expect(m.rpc).toHaveBeenCalledTimes(1));
const EXPORTACIO = { format: 'socdepoble.exportacio.v1', perfil: { id: 'A' } };
beforeEach(() => {
  m.gen = 0; m.user = { id: 'A' }; m.hasConfig = true; m.ordre = [];
  m.rpc.mockReset(); m.rpc.mockImplementation(async (nom) => { m.ordre.push(`rpc ${nom}`); return null; });
  m.logout.mockReset(); m.logout.mockImplementation(async () => { m.ordre.push('logout'); });
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
    expect(m.rpc).not.toHaveBeenCalled(); expect(m.logout).not.toHaveBeenCalled();
  });
  test(`${nom} sense servidor configurat rebutja sense cridar cap RPC`, async () => {
    m.hasConfig = false;
    await expect(crida()).rejects.toThrow('connexió amb el servidor');
    expect(m.rpc).not.toHaveBeenCalled();
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
  const config = { tenantId: 'T' };
  m.rpc.mockImplementationOnce(async (nom) => { m.ordre.push(`rpc ${nom}`);
    return { demanada_al: '2026-09-26T10:00:00Z', purga_prevista_al: '2026-10-26T10:00:00Z', ja_demanada: false }; });
  expect(await demanaBaixa({ motiu: '  Me’n vaig  ' }, config)).toEqual(
    { demanada: true, demanadaAl: '2026-09-26T10:00:00Z', purgaPrevistaAl: '2026-10-26T10:00:00Z' });
  expect(m.ordre).toEqual(['rpc demana_baixa', 'logout']);
  expect(m.rpc.mock.calls[0][1]).toEqual({ p_motiu: 'Me’n vaig' });
  expect(m.logout).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'T' }), { scope: 'global' });
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
