import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { desaSessio, esborraSessio, versioSessio } from '../identitat.js';
const m = vi.hoisted(() => ({ rpc: vi.fn(), configured: true }));
vi.mock('./runtime.js', () => ({ rpc: m.rpc, getResolvedConfig: () => ({ hasSupabaseConfig: m.configured }) }));
import { estatCuradoriaCultural, enviaAportacioCultural, revisaAportacioCultural, validaAportacionsCulturals } from './curadoriaCultural.js';
const id = '11111111-1111-4111-8111-111111111111';
const actor = '11111111-1111-4111-8111-111111111111';
const session = id => ({ access_token: 'synthetic-local-test-session', user: { id } });
beforeEach(() => { m.rpc.mockReset(); m.configured = true; esborraSessio(); desaSessio(session(actor)); });
afterEach(() => esborraSessio());
test('sense servidor no fabrica rol ni envia petició', async () => { m.configured = false; await expect(estatCuradoriaCultural()).rejects.toMatchObject({ code: 'no-disponible' }); expect(m.rpc).not.toHaveBeenCalled(); });
test('rebut de rol no pot afirmar ingestió desplegada', async () => { m.rpc.mockResolvedValue({ autenticat: true, pot_curar: true, ingestio_disponible: true }); await expect(estatCuradoriaCultural()).rejects.toThrow('Estat cultural invàlid'); });
test('permisos no premarcats ni inferits: aportació rebutjada abans de xarxa', async () => { await expect(enviaAportacioCultural({ titol: 'a', autoria: 'b', poble: 'c', contingut: 'd' })).rejects.toThrow(); expect(m.rpc).not.toHaveBeenCalled(); });
test('estat ingerit no admés en revisió ni resposta', async () => { await expect(revisaAportacioCultural({ id, estat: 'aprovat_node0', nota: '' })).rejects.toThrow(); expect(() => validaAportacionsCulturals([{ id, estat: 'aprovat_node0' }])).toThrow(); expect(m.rpc).not.toHaveBeenCalled(); });
test('refús SQL de rol es propaga sense fabricar èxit', async () => { m.rpc.mockRejectedValue(Object.assign(new Error('refusat'), { status: 403 })); await expect(revisaAportacioCultural({ id, estat: 'aprovat', nota: '' })).rejects.toMatchObject({ status: 403 }); });

const contribution = () => ({ id, titol: 'Memòria', autoria: 'Veïna', poble: 'La Torre', contingut: 'Text literal', nota: '', estat: 'pendent_revisio', creat_a: '2026-11-09T14:00:00Z' });
test('la renovació real del token conserva l’estat de curadoria i el rebut d’una aportació desada', async () => {
  const start = versioSessio;
  m.rpc.mockImplementation(async nom => {
    expect(desaSessio(session(actor), { renovacio: true })).toBe(true);
    return nom === 'estat_curadoria_cultural' ? { autenticat: true, pot_curar: false, ingestio_disponible: false } : contribution();
  });
  await expect(estatCuradoriaCultural()).resolves.toMatchObject({ autenticat: true, potCurar: false });
  await expect(enviaAportacioCultural({ titol: 'Memòria', autoria: 'Veïna', poble: 'La Torre', contingut: 'Text literal', permisos: true })).resolves.toMatchObject({ id, estat: 'pendent_revisio' });
  expect(versioSessio).toBe(start + 2);
});
test.each([
  ['logout', () => esborraSessio()],
  ['canvi de compte', () => desaSessio(session('22222222-2222-4222-8222-222222222222'))],
  ['reentrada del mateix compte', () => { esborraSessio(); desaSessio(session(actor)); }]
])('%s rebutja el rebut cultural antic sense mostrar dades', async (_name, change) => {
  m.rpc.mockImplementation(async () => { change(); return { autenticat: true, pot_curar: true, ingestio_disponible: false }; });
  await expect(estatCuradoriaCultural()).rejects.toMatchObject({ name: 'AbortError' });
});
test('cancel·lar la consulta descarta el rebut cultural', async () => {
  const controller = new AbortController();
  m.rpc.mockImplementation(async () => { controller.abort(); return { autenticat: true, pot_curar: true, ingestio_disponible: false }; });
  await expect(estatCuradoriaCultural({ signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
});
