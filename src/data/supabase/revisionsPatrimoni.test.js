import { beforeEach, expect, test, vi } from 'vitest';

const simulacio = vi.hoisted(() => ({ request: vi.fn(), getResolvedConfig: vi.fn(), getCurrentUser: vi.fn(), captura: vi.fn() }));
vi.mock('./runtime.js', () => ({ request: simulacio.request, getResolvedConfig: simulacio.getResolvedConfig, getCurrentUser: simulacio.getCurrentUser }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => simulacio.captura }));
import { desaRevisioPatrimoni, esborraRevisioPatrimoni, llistaRevisionsPatrimoni } from './revisionsPatrimoni.js';

const POBLE = 'a1111111-1111-4111-8111-111111111111';
const ALTRE_POBLE = 'a2222222-2222-4222-8222-222222222222';
const PECA = { entitatTipus: 'recepta', entitatSlug: 'olleta' };
const ID = 'ab222222-2222-4222-8222-222222222222';
const ALTA = { ...PECA, campanyaAny: 2026, versio: 0, estatConservacio: 'Vigent', mesures: { racions: 4 }, observacions: '' };
const CAMPANYA = { ...PECA, id: ID, campanyaAny: 2026, versio: 1 };
const EDICIO = { ...ALTA, ...CAMPANYA };
const FILA = { id: ID, tenant_id: POBLE, entitat_tipus: 'recepta', entitat_slug: 'olleta', campanya_any: 2026,
  estat_conservacio: 'Vigent', mesures_jsonb: { racions: 4 }, observacions: '', versio: 1 };
const CONFIG = { tenantId: POBLE, signal: new AbortController().signal };
const parametres = () => new URL(simulacio.request.mock.lastCall[0], 'https://prova.invalid').searchParams;

beforeEach(() => {
  vi.resetAllMocks();
  simulacio.getResolvedConfig.mockImplementation(config => ({
    runtimeDataMode: config.dataMode ?? 'remote', hasSupabaseConfig: true, tenantId: config.tenantId
  }));
  simulacio.getCurrentUser.mockReturnValue({ id: 'actor' });
  simulacio.request.mockResolvedValue([FILA]);
});

test('lectura anònima, acotada i ordenada sense exposar l’UUID d’autoria', async () => {
  simulacio.request.mockResolvedValue([{ ...FILA, creat_per: 'uuid-privat' }]);
  await expect(llistaRevisionsPatrimoni({ ...PECA, abansAny: 2027, limit: 20 }, CONFIG)).resolves.toEqual([EDICIO]);
  expect(parametres().get('tenant_id')).toBe(`eq.${POBLE}`);
  expect(parametres().get('select')).not.toContain('creat_per');
  expect(parametres().get('campanya_any')).toBe('lt.2027');
  expect(parametres().get('order')).toBe('campanya_any.desc');
  expect(parametres().get('limit')).toBe('20');
  expect(simulacio.request.mock.lastCall[2]).toEqual({ signal: CONFIG.signal, anonim: true });

  for (const resposta of [[{ ...FILA, tenant_id: ALTRE_POBLE }], [FILA, FILA], [{ ...FILA, mesures_jsonb: { racions: [] } }]]) {
    simulacio.request.mockResolvedValue(resposta);
    await expect(llistaRevisionsPatrimoni(PECA, CONFIG)).rejects.toMatchObject({ code: 'resposta-invalida' });
  }
});

test('escriu exclusivament camps explícits amb creació i compare-and-swap', async () => {
  await expect(desaRevisioPatrimoni(ALTA, CONFIG)).resolves.toEqual(EDICIO);
  expect(simulacio.request.mock.lastCall[2]).toMatchObject({
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: { tenant_id: POBLE, entitat_tipus: 'recepta', entitat_slug: 'olleta', campanya_any: 2026,
      estat_conservacio: 'Vigent', mesures_jsonb: { racions: 4 }, observacions: '' }
  });
  expect(Object.keys(simulacio.request.mock.lastCall[2].body)).not.toContain('creat_per');

  simulacio.request.mockResolvedValue([{ ...FILA, versio: 2 }]);
  await expect(desaRevisioPatrimoni(EDICIO, CONFIG)).resolves.toMatchObject({ versio: 2 });
  expect(simulacio.request.mock.lastCall[2]).toMatchObject({ method: 'PATCH', body: {
    estat_conservacio: 'Vigent', mesures_jsonb: { racions: 4 }, observacions: ''
  } });
  expect(parametres().get('versio')).toBe('eq.1');
  expect(parametres().get('id')).toBe(`eq.${ID}`);
  expect(parametres().get('campanya_any')).toBe('eq.2026');
  simulacio.request.mockResolvedValue([]);
  await expect(desaRevisioPatrimoni(EDICIO, CONFIG)).rejects.toMatchObject({ code: 'revisio-no-vigent' });
  simulacio.request.mockResolvedValue([FILA]);
  await expect(esborraRevisioPatrimoni(CAMPANYA, CONFIG)).resolves.toBe(true);
  expect(simulacio.request.mock.lastCall[2]).toMatchObject({ method: 'DELETE' });
  expect(parametres().get('versio')).toBe('eq.1');
  expect(parametres().get('id')).toBe(`eq.${ID}`);
});

test('auth, avortament i migració absent fallen tancats, sense escriure en un node local', async () => {
  simulacio.getCurrentUser.mockReturnValue(null);
  await expect(desaRevisioPatrimoni(EDICIO, CONFIG)).rejects.toMatchObject({ code: 'sense-sessio' });
  expect(simulacio.request).not.toHaveBeenCalled();
  const avortat = new AbortController();
  avortat.abort();
  await expect(llistaRevisionsPatrimoni(PECA, { ...CONFIG, signal: avortat.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(simulacio.request).not.toHaveBeenCalled();
  simulacio.request.mockRejectedValue({ status: 404 });
  await expect(llistaRevisionsPatrimoni(PECA, CONFIG)).rejects.toMatchObject({ code: 'no-disponible' });
});

test('el mode local explícit té revisions pròpies per poble i cap xarxa', async () => {
  const local = { ...CONFIG, dataMode: 'local' };
  const creada = await desaRevisioPatrimoni(ALTA, local);
  expect(creada).toEqual({ ...EDICIO, id: expect.any(String) });
  expect(await llistaRevisionsPatrimoni(PECA, local)).toEqual([creada]);
  expect(await llistaRevisionsPatrimoni(PECA, { ...local, tenantId: ALTRE_POBLE })).toEqual([]);
  expect(simulacio.request).not.toHaveBeenCalled();
});

test('arbitratge R17.2B · el mode seed no promet cap desament ni baixa en memòria', async () => {
  const seed = { ...CONFIG, dataMode: 'seed' };
  await expect(desaRevisioPatrimoni(ALTA, seed)).rejects.toMatchObject({ code: 'no-disponible' });
  await expect(esborraRevisioPatrimoni(CAMPANYA, seed)).rejects.toMatchObject({ code: 'no-disponible' });
  expect(await llistaRevisionsPatrimoni(PECA, seed)).toEqual([]);
  expect(simulacio.request).not.toHaveBeenCalled();
});

test('arbitratge R17.2B · les normes pendents (SDP-MOD-428) no es confonen amb una falta de permís', async () => {
  simulacio.request.mockRejectedValue({ status: 403, message: 'Supabase 403: {"code":"42501","message":"SDP-MOD-428: cal acceptar les normes"}' });
  await expect(desaRevisioPatrimoni(ALTA, CONFIG)).rejects.toMatchObject({ code: 'normes-pendents' });
  simulacio.request.mockRejectedValue({ status: 403, message: 'Supabase 403: permission denied' });
  await expect(desaRevisioPatrimoni(ALTA, CONFIG)).rejects.toMatchObject({ code: 'sense-permis' });
});
