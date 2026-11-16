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

/* Onada R30 · P1-79 (àrbitre) · Producció no té 20261115230000 fins que el Mestre l'aplique:
   el client ha de continuar desant com hui (signatura de sempre) i només en eixe cas. */
const absent = () => Object.assign(new Error('L’esquema requerit no està aplicat.'), { status: 404, postgrestCode: 'PGRST202' });
test('sense la RPC CAS (PGRST202) desa amb la signatura de sempre, sense el token, i torna la fila', async () => {
 m.rpc.mockRejectedValueOnce(absent());
 await expect(desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat', nota: 'n', actualitzatEsperat: '2026-11-15T22:00:00.000001Z' })).resolves.toMatchObject({ wpId: 1, actualitzatA: row.actualitzat_a });
 expect(m.rpc.mock.calls.map(c => c[0])).toEqual(['desa_revisio_editorial_wp_cas', 'desa_revisio_editorial_wp']);
 expect(m.rpc.mock.calls[1][1]).toEqual({ p_wp_id: 1, p_estat: 'aprovat', p_nota: 'n', p_autoria: 'Sóc de Poble', p_desti: 'mur' });
});
test('cap altre error (permís, 404 genèric, xarxa, conflicte) no recorre a la signatura de sempre', async () => {
 for (const error of [Object.assign(new Error('SDP-WP-REV-403'), { status: 403 }), Object.assign(new Error('404'), { status: 404 }), new TypeError('Failed to fetch')]) {
  m.rpc.mockReset().mockRejectedValueOnce(error);
  await expect(desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat' })).rejects.toBe(error);
  expect(m.rpc).toHaveBeenCalledTimes(1);
 }
 m.rpc.mockReset().mockRejectedValueOnce(Object.assign(new Error('Supabase 500: {"code":"40001"}'), { status: 500, sqlstate: '40001' }));
 await expect(desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat' })).rejects.toMatchObject({ code: 'conflicte-versio' });
 expect(m.rpc).toHaveBeenCalledTimes(1);
});
test('si la signatura de sempre ja és només de creació, el seu 409 també és un conflicte de versió', async () => {
 m.rpc.mockRejectedValueOnce(absent()).mockRejectedValueOnce(Object.assign(new Error('Supabase 409: SDP-WP-REV-409: la revisió ha canviat.'), { status: 409, sqlstate: '40001' }));
 await expect(desaRevisioEditorialWp({ wpId: 1, estat: 'aprovat' })).rejects.toMatchObject({ code: 'conflicte-versio' });
 expect(m.rpc).toHaveBeenCalledTimes(2);
});
