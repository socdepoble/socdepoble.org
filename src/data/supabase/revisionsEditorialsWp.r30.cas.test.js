import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: () => ({ hasSupabaseConfig: true }), rpc: (...a) => m.rpc(...a) }));
import { desaRevisioEditorialWp } from './revisionsEditorialsWp.js';
const row = { wp_id: 1, estat: 'aprovat', nota: '', autoria: 'Autora', desti: 'mur', actualitzat_a: '2026-11-15T22:00:00.000002Z' };
beforeEach(() => { m.rpc.mockReset().mockResolvedValue(row); });
test('el port real transmet token opac complet a la RPC CAS', async () => {
 await desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat', actualitzatEsperat: '2026-11-15T22:00:00.000001Z' });
 expect(m.rpc.mock.calls[0][0]).toBe('desa_revisio_editorial_wp_cas');
 expect(m.rpc.mock.calls[0][1].p_actualitzat_esperat).toBe('2026-11-15T22:00:00.000001Z');
});
test('un token absent significa crear i un error de conflicte no es degrada a upsert', async () => {
 await desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat' });
 expect(m.rpc.mock.calls[0][1].p_actualitzat_esperat).toBeNull();
 m.rpc.mockRejectedValueOnce(Object.assign(new Error('SDP-WP-REV-409'), { postgrestCode: '40001' }));
 await expect(desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat' })).rejects.toMatchObject({ code: 'conflicte-versio' });
 expect(m.rpc).toHaveBeenCalledTimes(2);
});

/* R32.10 · D-R32-PUB-1 / P1-79 · Sense la migració CAS no hi ha cap escriptura
   equivalent segura: la signatura antiga podria fer un upsert sense guarda. */
const absent = () => Object.assign(new Error('L’esquema requerit no està aplicat.'), { status: 404, postgrestCode: 'PGRST202' });
test.each(['2026-11-15T22:00:00.000001Z', null])('sense RPC CAS (PGRST202 exacte) rebutja %s sense l’upsert antic', async actualitzatEsperat => {
 m.rpc.mockRejectedValueOnce(absent());
 const entrada = Object.freeze({ wpId: 1, estat: 'aprovat', nota: 'n', actualitzatEsperat });
 await expect(desaRevisioEditorialWp(entrada)).rejects.toMatchObject({ code: 'no-disponible', codi: 'no-disponible', status: 404 });
 expect(m.rpc.mock.calls.map(c => c[0])).toEqual(['desa_revisio_editorial_wp_cas']);
 expect(m.rpc.mock.calls[0][1].p_actualitzat_esperat).toBe(actualitzatEsperat);
 expect(entrada.nota).toBe('n');
});
test('cap altre error (permís, taula absent, 404 genèric, text, estat incorrecte o xarxa) no es classifica com RPC absent', async () => {
 for (const error of [
  Object.assign(new Error('SDP-WP-REV-403'), { status: 403 }),
  Object.assign(new Error('404'), { status: 404 }),
  Object.assign(new Error('taula absent'), { status: 404, postgrestCode: 'PGRST205' }),
  Object.assign(new Error('PGRST202'), { status: 404 }),
  Object.assign(new Error('PGRST202'), { status: 500, postgrestCode: 'PGRST202' }),
  Object.assign(new Error('PGRST202'), { postgrestCode: 'PGRST202' }),
  new TypeError('Failed to fetch')
 ]) {
  m.rpc.mockReset().mockRejectedValueOnce(error);
  await expect(desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat' })).rejects.toBe(error);
  expect(m.rpc).toHaveBeenCalledTimes(1);
 }
 m.rpc.mockReset().mockRejectedValueOnce(Object.assign(new Error('Supabase 500: {"code":"40001"}'), { status: 500, sqlstate: '40001' }));
 await expect(desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat' })).rejects.toMatchObject({ code: 'conflicte-versio' });
 expect(m.rpc).toHaveBeenCalledTimes(1);
});
test('la degradació no divulga el text del proveïdor ni confirma una fila no desada', async () => {
 m.rpc.mockRejectedValueOnce(Object.assign(absent(), { message: 'detall privat del proveïdor' }));
 const error = await desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat' }).catch(e => e);
 expect(error).toBeInstanceOf(Error);
 expect(error.message).toBe('El servidor encara no té l’edició segura de revisions: no s’ha desat cap canvi al servidor.');
 expect(error).not.toHaveProperty('cause');
 expect(error).not.toHaveProperty('actualitzatA');
 expect(m.rpc).toHaveBeenCalledTimes(1);
});
