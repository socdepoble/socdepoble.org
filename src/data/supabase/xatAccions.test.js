import { beforeEach, expect, test, vi } from 'vitest';
import { alternaDestacat, alternaFixat, alternaReaccio, carregaAccionsMissatges, eliminaPerAMi } from './xatAccions.js';
const m = vi.hoisted(() => ({ rpc: vi.fn(), user: { id: 'me' }, entry: 1, jwt: 'live' }));
vi.mock('./runtime.js', () => ({ rpc: m.rpc }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.user, jwtPerBackend: () => m.jwt,
  capturaSessio: () => { const entry = m.entry; return () => { if (entry !== m.entry) throw new DOMException('changed', 'AbortError'); }; } }));
const FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', OTHER = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const estat = extra => ({ missatgeId: ID, filId: FIL, reaccions: [], destacat: false, fixat: false, amagat: false, ...extra });
const batch = extra => ({ missatges: [estat()], teMes: false, seguentId: null, ...extra });
beforeEach(() => { m.rpc.mockReset(); m.user = { id: 'me' }; m.entry = 1; m.jwt = 'live'; });
test.each([
  ['PGRST202', 'missing'], ['PGRST205', 'missing'],
  ['42883', 'function public.xat_alterna_destacat(uuid, uuid, boolean) does not exist'],
  ['42P01', 'relation "public.xat_reaccions" does not exist']
])('absència estructurada %s de l’objecte propi es marca sense fingir èxit', async (code, message) => {
  m.rpc.mockRejectedValue(Object.assign(new Error(message), code.startsWith('PGRST') ? { postgrestCode: code, status: 404 } : { sqlstate: code }));
  await expect(alternaDestacat({ filId: FIL, missatgeId: ID, actiu: true })).rejects.toMatchObject({ code: 'XAT_ACCIONS_SQL_ABSENT' });
});
test.each([
  ['42883', 'function unrelated_helper(uuid) does not exist'],
  ['42P01', 'relation "unrelated_table" does not exist'],
  ['42883', 'function public.xat_alterna_fixat(uuid, uuid, boolean) does not exist'],
  ['42P01', 'relation "other_schema.xat_reaccions" does not exist'],
  ['42P01', 'relation "public.xat_reaccions_backup" does not exist'],
  ['42883', 'missing'], ['42P01', 'missing']
])('una fallada interna aliena %s (%s) no es degrada a local pel context de l’RPC', async (sqlstate, message) => {
  const cause = Object.assign(new Error(message), { sqlstate, details: 'PL/pgSQL function public.xat_alterna_destacat(uuid,uuid,boolean) line 8 at SQL statement; INSERT INTO public.xat_reaccions' });
  m.rpc.mockRejectedValueOnce(cause);
  await expect(alternaDestacat({ filId: FIL, missatgeId: ID, actiu: true })).rejects.toBe(cause);
});
test.each(['xat_reaccions', 'xat_missatges_destacats', 'xat_missatges_fixats', 'xat_missatges_amagats'])('relació pròpia absent identificada als details: %s', async taula => {
  const cause = Object.assign(new Error('SQL error'), { sqlstate: '42P01', details: `relation "public"."${taula}" does not exist` });
  m.rpc.mockRejectedValueOnce(cause);
  await expect(alternaDestacat({ filId: FIL, missatgeId: ID, actiu: true })).rejects.toMatchObject({ code: 'XAT_ACCIONS_SQL_ABSENT', cause });
});
test.each([
  ['42883', 'function "public"."xat_alterna_destacat"(uuid, uuid, boolean) does not exist', true],
  ['42P01', 'relation "public.xat_reaccions" does not exist', true],
  ['42883', 'function unrelated_helper(uuid) does not exist', false],
  ['42P01', 'relation "unrelated_table" does not exist', false]
])('la forma ErrorSupabase conserva la distinció %s: %s', async (sqlstate, message, esAbsencia) => {
  const cause = Object.assign(new Error(`Supabase 400: ${JSON.stringify({ code: sqlstate, message, details: 'PL/pgSQL function public.xat_alterna_destacat(uuid,uuid,boolean) line 8' })}`), { status: 400, sqlstate });
  m.rpc.mockRejectedValueOnce(cause);
  const p = alternaDestacat({ filId: FIL, missatgeId: ID, actiu: true });
  if (esAbsencia) await expect(p).rejects.toMatchObject({ code: 'XAT_ACCIONS_SQL_ABSENT', cause });
  else await expect(p).rejects.toBe(cause);
});
test.each([401, 403, 404, 500])('HTTP%s genèric conserva l’error, sense fallback', async status => {
  const cause = Object.assign(new Error('failure'), { status }); m.rpc.mockRejectedValue(cause);
  await expect(eliminaPerAMi({ filId: FIL, missatgeId: ID })).rejects.toBe(cause);
});
test('403 mai no es transforma en SQL absent, encara que porte eixe codi', async () => {
  const cause = Object.assign(new Error('denied'), { status: 403, postgrestCode: 'PGRST202' }); m.rpc.mockRejectedValue(cause);
  await expect(eliminaPerAMi({ filId: FIL, missatgeId: ID })).rejects.toBe(cause);
});
test('mutació envia només auth del servidor i estat desitjat; elimina identitats inesperades de la resposta', async () => {
  m.rpc.mockResolvedValue(estat({ fixat: true, fixat_per: 'hidden', usuari_id: 'hidden' }));
  const r = await alternaFixat({ filId: FIL, missatgeId: ID, actiu: true, usuariId: 'spoof' });
  expect(m.rpc.mock.calls[0].slice(0, 2)).toEqual(['xat_alterna_fixat', { p_fil_id: FIL, p_missatge_id: ID, p_actiu: true }]);
  expect(r).not.toHaveProperty('fixat_per'); expect(r).not.toHaveProperty('usuari_id');
});
test.each([estat({ filId: OTHER }), estat({ missatgeId: OTHER }), null])('ACK mutació fora de context es rebutja %j', async resultat => {
  m.rpc.mockResolvedValue(resultat);
  await expect(eliminaPerAMi({ filId: FIL, missatgeId: ID })).rejects.toMatchObject({ code: 'XAT_ACCIO_INVALIDA' });
});
test.each([
  batch({ missatges: [estat({ filId: OTHER })] }), batch({ missatges: [estat({ missatgeId: OTHER })] }),
  batch({ missatges: [estat(), estat()] }), batch({ teMes: true, seguentId: OTHER })
])('batch vàlid de forma però alié al fil/IDs/cursor es rebutja', async resultat => {
  m.rpc.mockResolvedValue(resultat);
  await expect(carregaAccionsMissatges({ filId: FIL, missatgeIds: [ID] })).rejects.toMatchObject({ code: 'XAT_ACCIO_INVALIDA' });
});
test('una pàgina de destacats no admet files no destacades', async () => {
  m.rpc.mockResolvedValue(batch());
  await expect(carregaAccionsMissatges({ nomesDestacats: true })).rejects.toMatchObject({ code: 'XAT_ACCIO_INVALIDA' });
});
test('reaccions no exposen IDs d’operadors i un resultat agrupat es conserva', async () => {
  m.rpc.mockResolvedValue(batch({ missatges: [estat({ reaccions: [{ emoji: '😂', total: 2, meua: true, usuaris: ['hidden'] }] })] }));
  const r = await carregaAccionsMissatges({ filId: FIL, missatgeIds: [ID] });
  expect(r.missatges[0].reaccions).toEqual([{ emoji: '😂', total: 2, meua: true }]);
});
test('logout/login mateix UUID i abort durant RPC no entreguen ACK tardà', async () => {
  m.rpc.mockImplementationOnce(async () => { m.entry += 2; return estat(); });
  await expect(eliminaPerAMi({ filId: FIL, missatgeId: ID })).rejects.toMatchObject({ name: 'AbortError' });
  const controller = new AbortController(); m.rpc.mockImplementationOnce(async () => { controller.abort(); return estat(); });
  await expect(eliminaPerAMi({ filId: FIL, missatgeId: ID }, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
});
test('una renovació conserva l’entrada; perdre JWT dona sessió caducada', async () => {
  m.rpc.mockImplementationOnce(async () => { m.jwt = 'renewed'; return estat(); });
  await expect(eliminaPerAMi({ filId: FIL, missatgeId: ID })).resolves.toMatchObject({ missatgeId: ID });
  m.rpc.mockImplementationOnce(async () => { m.jwt = null; return estat(); });
  await expect(eliminaPerAMi({ filId: FIL, missatgeId: ID })).rejects.toMatchObject({ code: 'sessio-caducada' });
});
test.each([undefined, null, '', 1])('reacció sense estat desitjat booleà %j es rebutja abans de RPC', async activa => {
  await expect(alternaReaccio({ filId: FIL, missatgeId: ID, emoji: '😂', activa })).rejects.toMatchObject({ code: 'XAT_ACCIO_INVALIDA' });
  expect(m.rpc).not.toHaveBeenCalled();
});
