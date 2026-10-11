/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor (TOTP) del
   superadmin sobre l'API MFA de GoTrue, amb un doble del transport (request)
   com auth.test.js: identitat.js es falseja perquè auth.js i segonFactor.js
   l'importen (triaRefresc, rotaRegistre, desaSessio, capturaSessio…). */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  user: { id: 'A' }, exp: null, epoch: 0, refreshes: 0, saveOk: true, nivell: 'aal2',
  tria: { rt: 'rt-vell', mode: 'efimer', sub: 'A' },
  request: vi.fn(), saved: vi.fn(), rota: vi.fn(() => true), clear: vi.fn(), changed: vi.fn(), realtime: vi.fn(async () => {})
}));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => 'rt-vell' }));
vi.mock('../recuperacioPendent.js', () => ({
  ESTAT_ENLLAC: Object.freeze({ PENDENT: 'pendent', PERDUT: 'perdut' }),
  marcaRecuperacioPendent: vi.fn(), oblidaRecuperacioPendent: vi.fn(),
  anunciaEnllacDeRecuperacio: vi.fn(), oblidaEnllacDeRecuperacio: vi.fn(),
  estatEnllacDeRecuperacio: () => null, escoltaRecuperacioPendent: () => () => {}
}));
vi.mock('../identitat.js', () => ({
  configuraBackendSessio: vi.fn(), esBackendDeSessio: () => true, jwtPerBackend: () => 'jwt-vell',
  CLAU_REFRESC: 'refresh', CLAU_JWT: 'jwt', CLAU_ORIGEN: 'origen', get versioSessio() { return m.epoch; },
  triaRefresc: () => m.tria, rotaRegistre: (...args) => m.rota(...args), oblidaRegistre: vi.fn(),
  desaSessio: (value, options) => { m.epoch++; if (options?.renovacio) m.refreshes++; m.saved(value, options); return m.saveOk; },
  capturaSessio: () => { const generation = m.epoch - m.refreshes; return () => { if (generation !== m.epoch - m.refreshes) throw new DOMException('La sessió ha canviat.', 'AbortError'); }; },
  esborraSessio: () => { m.epoch++; m.clear(); },
  usuariDeSessio: () => m.user, actualitzaUsuariSessio: m.changed,
  caducitatJwt: () => m.exp, MARGE_RENOVACIO_MS: 60_000,
  nivellDAsseguranca: () => m.nivell
}));
vi.mock('../oauthRelay.js', () => ({ entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn(), exigeixSenseMarcAlie: vi.fn(),
  urlDeTornadaAlta: vi.fn(() => 'https://amfitrio.example.test/pagina?sdp_auth=alta'),
  urlDeTornadaRecuperacio: vi.fn(() => 'https://amfitrio.example.test/pagina?sdp_auth=recuperacio'),
  recullMarcaDeRecuperacio: vi.fn(() => null) }));
vi.mock('./runtime.js', () => ({ configuraRefrescSessio: vi.fn(), getCurrentUser: () => m.user,
  getResolvedConfig: (config) => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'public', runtimeDataMode: config.dataMode || 'remote', ...config }),
  request: m.request, rpc: vi.fn() }));
vi.mock('./realtime.js', () => ({ tancaRealtime: m.realtime }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { inscriuFactor, llistaFactors, reptaFactor, retiraFactor, verificaFactor } from './segonFactor.js';
import { resetClient } from './config.js';
import { CODI_SEGON_FACTOR, MISSATGE_SEGON_FACTOR } from '../errorsBackend.js';

const errorGoTrue = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${JSON.stringify(cos)}`), { status });
const crides = () => m.request.mock.calls.map(([ruta, , opcions]) => `${opcions?.method ?? 'GET'} ${ruta}`);
const SESSIO_NOVA = Object.freeze({ access_token: 'jwt-aal2', refresh_token: 'rt-nou', expires_in: 3600, user: { id: 'A', email: 'ana@poble.test' } });
async function ambAvisos(cos) {
  const avisos = [];
  const escolta = (e) => avisos.push(e.detail?.user?.id ?? null);
  window.addEventListener('sdp:auth-change', escolta);
  try { await cos(); } finally { window.removeEventListener('sdp:auth-change', escolta); }
  return avisos;
}

beforeEach(() => {
  m.request.mockReset(); m.saved.mockReset(); m.rota.mockReset().mockImplementation(() => true); resetClient.mockClear();
  m.user = { id: 'A' }; m.exp = null; m.saveOk = true; m.nivell = 'aal2';
  m.tria = { rt: 'rt-vell', mode: 'efimer', sub: 'A' };
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204 })));
});
afterEach(() => { vi.unstubAllGlobals(); });

/* ── Mode seed o local: no hi ha GoTrue ── */
test.each(['seed', 'local'])('en mode %s, llistaFactors torna [] i la resta rebutja amb no-disponible sense cap petició', async (dataMode) => {
  const config = { dataMode };
  expect(await llistaFactors(config)).toEqual([]);
  for (const crida of [() => inscriuFactor('Mòbil', config), () => reptaFactor('f1', config),
    () => verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123456' }, config), () => retiraFactor('f1', config)]) {
    await expect(crida()).rejects.toMatchObject({ code: 'no-disponible', message: MISSATGE_SEGON_FACTOR['no-disponible'] });
  }
  expect(m.request).not.toHaveBeenCalled();
});

/* ── Sense sessió ── */
test('sense sessió, llistaFactors torna [] i la resta rebutja amb sense-sessio, sense cap petició', async () => {
  m.user = null;
  expect(await llistaFactors({})).toEqual([]);
  await expect(inscriuFactor('Mòbil', {})).rejects.toMatchObject({ code: CODI_SEGON_FACTOR.SENSE_SESSIO });
  await expect(reptaFactor('f1', {})).rejects.toMatchObject({ code: CODI_SEGON_FACTOR.SENSE_SESSIO });
  await expect(verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123456' }, {})).rejects.toMatchObject({ code: CODI_SEGON_FACTOR.SENSE_SESSIO });
  await expect(retiraFactor('f1', {})).rejects.toMatchObject({ code: CODI_SEGON_FACTOR.SENSE_SESSIO });
  expect(m.request).not.toHaveBeenCalled();
});

/* ── La llista ── */
test('llistaFactors llig GET /auth/v1/user i tradueix els factors TOTP a la forma del contracte', async () => {
  m.request.mockResolvedValueOnce({ id: 'A', factors: [
    { id: 'f1', friendly_name: 'Mòbil', factor_type: 'totp', status: 'verified' },
    { id: 'f2', friendly_name: 'Tauleta', factor_type: 'totp', status: 'unverified' },
    { id: 'f3', friendly_name: 'Telèfon', factor_type: 'phone', status: 'verified' },
    null
  ] });
  expect(await llistaFactors({})).toEqual([
    { id: 'f1', nom: 'Mòbil', tipus: 'totp', estat: 'verificat' },
    { id: 'f2', nom: 'Tauleta', tipus: 'totp', estat: 'pendent' }
  ]);
  expect(crides()).toEqual(['GET /auth/v1/user']);
  m.request.mockResolvedValueOnce({ id: 'A' });
  expect(await llistaFactors({})).toEqual([]);
});

/* ── La inscripció ── */
const SVG_QR = '<svg xmlns="http://www.w3.org/2000/svg"/>';
const QR_DATA_URI = `data:image/svg+xml;utf-8,${encodeURIComponent(SVG_QR)}`;
test('inscriuFactor fa POST /auth/v1/factors amb el nom i torna id, qr (l’SVG cru de GoTrue com a data URI), secret i uri', async () => {
  m.request.mockResolvedValueOnce({ id: 'f-nou', type: 'totp', friendly_name: 'Mòbil',
    totp: { qr_code: SVG_QR, secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/Sóc%20de%20Poble:ana?secret=JBSWY3DPEHPK3PXP' } });
  expect(await inscriuFactor('  Mòbil  ', {})).toEqual({
    id: 'f-nou', qr: QR_DATA_URI, secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/Sóc%20de%20Poble:ana?secret=JBSWY3DPEHPK3PXP'
  });
  expect(crides()).toEqual(['POST /auth/v1/factors']);
  expect(m.request.mock.calls[0][2].body).toEqual({ factor_type: 'totp', friendly_name: 'Mòbil', issuer: 'Sóc de Poble' });
  /* Sense nom: un per defecte, mai una cadena buida. */
  m.request.mockResolvedValueOnce({ id: 'f2', totp: {} });
  expect(await inscriuFactor('', {})).toEqual({ id: 'f2', qr: '', secret: '', uri: '' });
  expect(m.request.mock.calls[1][2].body.friendly_name).toBe('Sóc de Poble');
});

test('inscriuFactor no duplica el prefix quan el QR ja arriba com a data URI (client oficial)', async () => {
  m.request.mockResolvedValueOnce({ id: 'f3', totp: { qr_code: QR_DATA_URI, secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/x' } });
  expect((await inscriuFactor('Mòbil', {})).qr).toBe(QR_DATA_URI);
  /* Un QR en blanc o que no és text no inventa cap data URI. */
  m.request.mockResolvedValueOnce({ id: 'f4', totp: { qr_code: '   ' } });
  expect((await inscriuFactor('Mòbil', {})).qr).toBe('');
  m.request.mockResolvedValueOnce({ id: 'f5', totp: { qr_code: 42 } });
  expect((await inscriuFactor('Mòbil', {})).qr).toBe('');
});

test.each([
  [422, 'mfa_factor_name_conflict', 'nom-repetit'],
  [422, 'too_many_enrolled_mfa_factors', 'massa-factors'],
  [422, 'mfa_totp_enroll_not_enabled', 'no-habilitat'],
  [401, 'bad_jwt', 'sense-sessio'],
  [400, 'validation_failed', 'desconegut']
])('inscriuFactor tradueix el %s %s de GoTrue a %s, amb la frase en valencià i la resposta a cause', async (status, error_code, code) => {
  const cru = errorGoTrue(status, { code: status, error_code, msg: 'text en anglés' });
  m.request.mockRejectedValueOnce(cru);
  const error = await inscriuFactor('Mòbil', {}).catch((e) => e);
  expect(error).toMatchObject({ code, message: MISSATGE_SEGON_FACTOR[code], status, cause: cru });
  expect(error.message).not.toMatch(/anglés|error_code/);
});

/* ── El repte ── */
test('reptaFactor fa POST /auth/v1/factors/{id}/challenge i torna repteId i caduca (ISO)', async () => {
  m.request.mockResolvedValueOnce({ id: 'r1', type: 'totp', expires_at: 1760000000 });
  expect(await reptaFactor('f1', {})).toEqual({ repteId: 'r1', caduca: new Date(1760000000 * 1000).toISOString() });
  expect(crides()).toEqual(['POST /auth/v1/factors/f1/challenge']);
  m.request.mockResolvedValueOnce({ id: 'r2' });
  expect(await reptaFactor('f1', {})).toEqual({ repteId: 'r2', caduca: null });
});

test('reptaFactor i retiraFactor d’un factor que no existix (404 mfa_factor_not_found) rebutgen amb factor-no-trobat; un id brut no viatja', async () => {
  m.request.mockRejectedValueOnce(errorGoTrue(404, { code: 404, error_code: 'mfa_factor_not_found', msg: 'Factor not found' }));
  await expect(reptaFactor('f-absent', {})).rejects.toMatchObject({ code: 'factor-no-trobat', status: 404 });
  m.request.mockRejectedValueOnce(errorGoTrue(404, { code: 404, error_code: 'mfa_factor_not_found', msg: 'Factor not found' }));
  await expect(retiraFactor('f-absent', {})).rejects.toMatchObject({ code: 'factor-no-trobat' });
  expect(crides()).toEqual(['POST /auth/v1/factors/f-absent/challenge', 'DELETE /auth/v1/factors/f-absent']);
  m.request.mockClear();
  await expect(reptaFactor('../user', {})).rejects.toMatchObject({ code: 'factor-no-trobat' });
  await expect(retiraFactor('', {})).rejects.toMatchObject({ code: 'factor-no-trobat' });
  await expect(verificaFactor({ factorId: 'f1?x=1', repteId: 'r1', codi: '123456' }, {})).rejects.toMatchObject({ code: 'factor-no-trobat' });
  expect(m.request).not.toHaveBeenCalled();
});

/* ── La retirada ── */
test('retiraFactor fa DELETE /auth/v1/factors/{id} i torna { id }, també amb una resposta buida (204)', async () => {
  m.request.mockResolvedValueOnce({ id: 'f1' });
  expect(await retiraFactor('f1', {})).toEqual({ id: 'f1' });
  m.request.mockResolvedValueOnce(null);
  expect(await retiraFactor('f2', {})).toEqual({ id: 'f2' });
  expect(crides()).toEqual(['DELETE /auth/v1/factors/f1', 'DELETE /auth/v1/factors/f2']);
});

/* ── La verificació: la sessió nova substituïx la vella ── */
test('verificaFactor fa POST verify i desa la sessió nova com a renovació, reinicia el client i avisa amb sdp:auth-change', async () => {
  m.request.mockResolvedValueOnce({ ...SESSIO_NOVA });
  const avisos = await ambAvisos(async () => {
    expect(await verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123 456' }, {})).toEqual({ nivell: 'aal2' });
  });
  expect(crides()).toEqual(['POST /auth/v1/factors/f1/verify']);
  expect(m.request.mock.calls[0][2].body).toEqual({ challenge_id: 'r1', code: '123456' });
  expect(m.saved).toHaveBeenCalledWith(expect.objectContaining({ access_token: 'jwt-aal2', refresh_token: 'rt-nou' }), { renovacio: true });
  expect(resetClient).toHaveBeenCalledTimes(1);
  expect(avisos).toEqual(['A']);
  /* Pestanya amb el seu propi refresh token (efímer): el registre no es toca. */
  expect(m.rota).not.toHaveBeenCalled();
});

test('verificaFactor amb la pestanya que viu del registre persistent rota el registre ABANS de desar, dins del pany', async () => {
  m.tria = { rt: 'rt-registre', mode: 'renovacio', sub: 'A' };
  const ordre = [];
  m.rota.mockImplementation((...args) => { ordre.push(['rota', ...args]); return true; });
  m.saved.mockImplementation(() => { ordre.push(['desa']); });
  m.request.mockResolvedValueOnce({ ...SESSIO_NOVA });
  await verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123456' }, {});
  expect(ordre).toEqual([['rota', 'rt-registre', 'rt-nou', 'A'], ['desa']]);
});

test('verificaFactor torna el nivell del JWT nou i, si no és llegible, aal2', async () => {
  m.nivell = 'aal1';
  m.request.mockResolvedValueOnce({ ...SESSIO_NOVA });
  expect(await verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123456' }, {})).toEqual({ nivell: 'aal1' });
  m.nivell = null;
  m.request.mockResolvedValueOnce({ ...SESSIO_NOVA });
  expect(await verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123456' }, {})).toEqual({ nivell: 'aal2' });
});

test.each([
  [422, 'mfa_verification_failed', 'codi-invalid'],
  [422, 'mfa_verification_rejected', 'codi-invalid'],
  [422, 'mfa_challenge_expired', 'repte-caducat'],
  [404, 'mfa_factor_not_found', 'factor-no-trobat'],
  [422, 'mfa_totp_verify_not_enabled', 'no-habilitat'],
  [500, 'unexpected_failure', 'desconegut']
])('verificaFactor tradueix el %s %s a %s i no toca la sessió', async (status, error_code, code) => {
  m.request.mockRejectedValueOnce(errorGoTrue(status, { code: status, error_code, msg: 'text en anglés' }));
  const avisos = await ambAvisos(async () => {
    await expect(verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '000000' }, {})).rejects.toMatchObject({ code, message: MISSATGE_SEGON_FACTOR[code], status });
  });
  expect(m.saved).not.toHaveBeenCalled();
  expect(resetClient).not.toHaveBeenCalled();
  expect(avisos).toEqual([]);
});

test('verificaFactor rebutja un codi que no és numèric o un repte brut sense cap petició', async () => {
  await expect(verificaFactor({ factorId: 'f1', repteId: 'r1', codi: 'abc' }, {})).rejects.toMatchObject({ code: 'codi-invalid' });
  await expect(verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '' }, {})).rejects.toMatchObject({ code: 'codi-invalid' });
  await expect(verificaFactor({ factorId: 'f1', repteId: 'r/1', codi: '123456' }, {})).rejects.toMatchObject({ code: 'repte-caducat' });
  await expect(verificaFactor(undefined, {})).rejects.toMatchObject({ code: 'factor-no-trobat' });
  expect(m.request).not.toHaveBeenCalled();
});

test('verificaFactor amb una resposta sense sessió o que el navegador no pot desar rebutja amb un code i no avisa d’una sessió que no hi és', async () => {
  m.request.mockResolvedValueOnce({ ok: true });
  await expect(verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123456' }, {})).rejects.toMatchObject({ code: 'desconegut' });
  expect(m.saved).not.toHaveBeenCalled();
  m.saveOk = false;
  m.request.mockResolvedValueOnce({ ...SESSIO_NOVA });
  const avisos = await ambAvisos(async () => {
    await expect(verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123456' }, {})).rejects.toMatchObject({ code: 'desconegut', message: /no ha pogut desar la sessió nova/ });
  });
  expect(avisos).toEqual([]);
  expect(resetClient).not.toHaveBeenCalled();
});

test('verificaFactor amb la sessió canviada mentre el servidor responia avorta i no desa res damunt', async () => {
  let respon;
  m.request.mockReturnValueOnce(new Promise((resolve) => { respon = resolve; }));
  const treball = verificaFactor({ factorId: 'f1', repteId: 'r1', codi: '123456' }, {});
  const resultat = expect(treball).rejects.toMatchObject({ name: 'AbortError' });
  /* Una altra entrada en esta pestanya (no una renovació) canvia la generació. */
  m.epoch++; m.user = { id: 'B' };
  respon({ ...SESSIO_NOVA, user: { id: 'B' } });
  await resultat;
  expect(m.saved).not.toHaveBeenCalled();
});
