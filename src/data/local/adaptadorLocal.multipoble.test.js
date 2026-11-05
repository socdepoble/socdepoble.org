/* FEDI-16 · Autoritat exclusivament local, captures abans d'esperar i tenants separats. */
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { CAPACITATS } from '../contracte.js';
import { CASOS, contextDeConformitat, executaCas } from '../conformitat/kit.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { creaAdaptadorLocal } from './adaptadorLocal.js';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const ANNA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const BERTA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const pobles = () => [{ id: A, slug: 'sella', nom: 'Sella' }, { id: B, slug: 'xixona', nom: 'Xixona' }];
const instancies = [];
const xarxa = vi.fn(() => { throw new Error('FEDI16_XARXA_PROHIBIDA'); });
beforeAll(() => vi.stubGlobal('fetch', xarxa));
afterEach(async () => { esborraSessio({ abast: 'tot' }); await Promise.all(instancies.splice(0).map(a => a.destroy())); });
afterAll(() => { expect(xarxa).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
function crea(opcions = {}) {
  const a = creaAdaptadorLocal({ mode: 'local', tenantId: A, administracioLocal: { pobles: pobles(), autoritza: async ({ personaId }) => personaId === ANNA }, ...opcions });
  instancies.push(a); return a;
}
function entra(a, id = ANNA) {
  configuraBackendSessio(a.configuracio);
  expect(desaSessio({ access_token: 'fedi16-opac-local', user: { id, user_metadata: { role: 'superadmin', aal: 'aal2' } } })).toBe(true);
}
const dades = (text = 'A', versio = null) => ({ clau: 'taxonomia', payload: { categories: [text] }, versio });
function pendent() { let resol; const promesa = new Promise(r => { resol = r; }); return { promesa, resol }; }
function autoritatPendent() {
  const inici = pendent(), fi = pendent();
  return { inici, fi, autoritza: vi.fn(async () => { inici.resol(); return fi.promesa; }) };
}

test('el local conserva les 39 capacitats, deixa absents els dos serveis de correu i preserva els casos històrics', async () => {
  const a = crea();
  expect(Object.keys(CAPACITATS)).toHaveLength(43);
  expect(Object.values(CAPACITATS).flat().filter(m => typeof a[m] !== 'function')).toEqual(['confirmaCorreu','reenviaVerificacioCorreu','demanaRestablimentCorreu','restablixContrasenyaAmbCorreu']);
  expect(CASOS).toHaveLength(184);
  for (const plataforma of ['ios', 'android', 'web', '', null, {}]) expect(await a.versioMinimaClient(plataforma, { dataMode: 'remote', supabaseUrl: 'https://fora.invalid' })).toBeNull();
});

test('els sis casos neutrals nous executen les dues capacitats locals', async () => {
  const a = crea(); entra(a);
  const ctx = contextDeConformitat({ config: { tenantId: A }, adminMultipobleAutoritzat: true, tenantAdministrat: B });
  const casos = CASOS.filter(c => ['versioClient', 'administracioMultipoble'].includes(c.capacitat));
  expect(casos).toHaveLength(6);
  for (const c of casos) expect(await executaCas(c, a, ctx), c.titol).toEqual({ estat: 'ok', falles: [], motiu: null });
  expect(ctx.config).toEqual({ tenantId: A });
});

test('sense autoritat explícita cap rol client fabrica administració multipoble', async () => {
  const a = crea({ administracioLocal: null }); entra(a);
  await expect(a.adminLlistaPobles()).rejects.toMatchObject({ code: 'no-disponible' });
  await expect(a.adminLligPersonalitzacio({ tenantId: B, role: 'superadmin', aal: 'aal2' })).rejects.toMatchObject({ code: 'no-disponible' });
});

test('sense sessió no consulta l’autoritzador; el convidat no és cap actor', async () => {
  const autoritza = vi.fn(async () => true), a = crea({ administracioLocal: { pobles: pobles(), autoritza } });
  await expect(a.adminLlistaPobles()).rejects.toMatchObject({ code: 'sense-sessio' });
  await expect(a.adminLligPersonalitzacio({ tenantId: B })).rejects.toMatchObject({ code: 'sense-sessio' });
  expect(autoritza).not.toHaveBeenCalled();
});

test('selectors malformats, contradictoris, desconeguts i absents no cauen en el tenant propi', async () => {
  const autoritza = vi.fn(async () => true), a = crea({ administracioLocal: { pobles: pobles(), autoritza } }); entra(a);
  for (const config of [{ tenantId: 'malformat' }, { tenantId: null }, { tenantId: A, tenant_id: B }, { tenantId: {} }]) {
    await expect(a.adminLlistaPobles(config)).rejects.toMatchObject({ code: 'abast-invalid' });
    await expect(a.adminLligPersonalitzacio(config)).rejects.toMatchObject({ code: 'abast-invalid' });
  }
  for (const config of [{}, { tenantId: null }, { tenantId: A, tenant_id: B }]) {
    await expect(a.adminDesaPersonalitzacio(dades(), config)).rejects.toMatchObject({ code: 'abast-invalid' });
    await expect(a.adminHistorialPersonalitzacio('taxonomia', config)).rejects.toMatchObject({ code: 'abast-invalid' });
    await expect(a.adminLligPersonalitzacio(config)).rejects.toMatchObject({ code: 'abast-invalid' });
  }
  await expect(a.adminLligPersonalitzacio({ tenantId: C })).rejects.toMatchObject({ code: 'sense-permis' });
  expect(autoritza).not.toHaveBeenCalled();
});

for (const resultat of [false, 1, 'true', {}, []]) test(`autoritat només accepta true explícit (${JSON.stringify(resultat)})`, async () => {
  const a = crea({ personalitzacioOberta: true, administracioLocal: { pobles: pobles(), autoritza: async () => resultat } }); entra(a);
  await expect(a.adminLlistaPobles()).rejects.toMatchObject({ code: 'sense-permis' });
  await expect(a.adminLligPersonalitzacio({ tenantId: B })).rejects.toMatchObject({ code: 'sense-permis' });
  await expect(a.adminDesaPersonalitzacio(dades(), { tenantId: B })).rejects.toMatchObject({ code: 'sense-permis' });
  await expect(a.adminHistorialPersonalitzacio('taxonomia', { tenantId: B })).rejects.toMatchObject({ code: 'sense-permis' });
});

test('versions/historial de dos tenants separats, lectura pública pròpia i autoritat mínima immutable', async () => {
  const autoritza = vi.fn(async () => true), catalog = pobles();
  const a = crea({ administracioLocal: { pobles: catalog, autoritza } }); entra(a);
  catalog[0].nom = 'Canvi extern'; catalog.push({ id: C, slug: 'fora', nom: 'Fora' });
  const llista = await a.adminLlistaPobles(); expect(llista).toEqual(pobles()); llista[0].nom = 'Manipulat';
  await a.adminDesaPersonalitzacio(dades('A'), { tenantId: A });
  await a.adminDesaPersonalitzacio(dades('B'), { tenant_id: B.toUpperCase() });
  await a.adminDesaPersonalitzacio(dades('B2', 1), { tenantId: B });
  const b = await a.adminLligPersonalitzacio({ tenantId: B });
  expect(b).toEqual({ taxonomia: { payload: { categories: ['B2'] }, versio: 2 }, estil: null });
  b.taxonomia.payload.categories[0] = 'Alterat';
  expect((await a.adminLligPersonalitzacio({ tenantId: B })).taxonomia.payload.categories).toEqual(['B2']);
  expect((await a.loadCoreContent(ANNA, { tenantId: B })).personalitzacio.taxonomia.payload.categories).toEqual(['A']);
  expect((await a.adminHistorialPersonalitzacio('taxonomia', { tenantId: B })).map(v => [v.versio, v.payload.categories[0], v.autor])).toEqual([[2, 'B2', ANNA], [1, 'B', ANNA]]);
  expect((await a.adminHistorialPersonalitzacio('taxonomia', { tenantId: A })).map(v => v.versio)).toEqual([1]);
  expect(a.configuracio).toEqual({ backendId: 'sdp-local', tenantId: A, dataMode: 'local' });
  for (const [peticio] of autoritza.mock.calls) { expect(Object.isFrozen(peticio)).toBe(true); expect(Object.keys(peticio).sort()).toEqual(['operacio', 'personaId', 'tenantId']); expect(peticio.personaId).toBe(ANNA); }
});

test('null i zero són la versió inicial, mai un bypass d’una versió existent', async () => {
  const a = crea(); entra(a); await a.adminDesaPersonalitzacio(dades(), { tenantId: B });
  for (const versio of [null, 0, 2]) await expect(a.adminDesaPersonalitzacio(dades('obsoleta', versio), { tenantId: B })).rejects.toMatchObject({ code: 'conflicte-versio' });
});

test('les entrades es capturen abans de la microtasca i abans d’esperar autoritat', async () => {
  const p = autoritatPendent(), a = crea({ administracioLocal: { pobles: pobles(), autoritza: p.autoritza } }); entra(a);
  const config = { tenantId: B }, entrada = dades('Original');
  const resultat = a.adminDesaPersonalitzacio(entrada, config);
  config.tenantId = A; entrada.payload.categories[0] = 'Tòxic'; entrada.clau = 'estil'; entrada.versio = 50;
  await p.inici.promesa; p.fi.resol(true);
  expect(await resultat).toEqual({ clau: 'taxonomia', payload: { categories: ['Original'] }, versio: 1 });
  expect((await a.adminLligPersonalitzacio({ tenantId: A })).taxonomia).toBeNull();
  expect((await a.adminLligPersonalitzacio({ tenantId: B })).taxonomia.payload.categories).toEqual(['Original']);
});

for (const metode of ['adminLlistaPobles', 'adminLligPersonalitzacio', 'adminDesaPersonalitzacio', 'adminHistorialPersonalitzacio']) {
  for (const moment of ['mateix-tic', 'pendent']) test(`${metode}: canvi de sessió ${moment} no lliura ni muta`, async () => {
    const p = autoritatPendent(), a = crea({ administracioLocal: { pobles: pobles(), autoritza: p.autoritza } }); entra(a);
    const crida = () => metode === 'adminLlistaPobles' ? a[metode]() : metode === 'adminDesaPersonalitzacio' ? a[metode](dades(), { tenantId: B }) : metode === 'adminHistorialPersonalitzacio' ? a[metode]('taxonomia', { tenantId: B }) : a[metode]({ tenantId: B });
    const resultat = crida(); const rebuig = expect(resultat).rejects.toMatchObject({ name: 'AbortError' });
    if (moment === 'pendent') await p.inici.promesa;
    entra(a, BERTA); p.fi.resol(true); await rebuig;
    if (metode === 'adminDesaPersonalitzacio') { entra(a); expect((await a.adminLligPersonalitzacio({ tenantId: B })).taxonomia).toBeNull(); }
  });
}

for (const accio of ['avorta', 'destroy']) test(`autoritat pendent seguida de ${accio} no escriu`, async () => {
  const p = autoritatPendent(), a = crea({ administracioLocal: { pobles: pobles(), autoritza: p.autoritza } }); entra(a);
  const control = new AbortController(); const resultat = a.adminDesaPersonalitzacio(dades(), { tenantId: B, signal: control.signal });
  const rebuig = accio === 'avorta' ? expect(resultat).rejects.toMatchObject({ name: 'AbortError' }) : expect(resultat).rejects.toThrow('Adaptador tancat');
  await p.inici.promesa; if (accio === 'avorta') control.abort(); else await a.destroy(); p.fi.resol(true); await rebuig;
  if (accio === 'avorta') expect((await a.adminLligPersonalitzacio({ tenantId: B })).taxonomia).toBeNull();
});

test('l’autoritzador no pot canviar la petició congelada ni obtindre payload privat', async () => {
  const autoritza = vi.fn(async peticio => { expect(() => { peticio.tenantId = A; }).toThrow(TypeError); expect(peticio.payload).toBeUndefined(); return true; });
  const a = crea({ administracioLocal: { pobles: pobles(), autoritza } }); entra(a);
  await a.adminDesaPersonalitzacio(dades('B'), { tenantId: B });
  expect((await a.adminLligPersonalitzacio({ tenantId: B })).taxonomia.payload.categories).toEqual(['B']);
});

test('payload JSON acotat a 64KiB, sense cicles, getters ni prototips especials', async () => {
  const autoritza = vi.fn(async () => true), a = crea({ administracioLocal: { pobles: pobles(), autoritza } }); entra(a);
  const circular = {}; circular.cercle = circular; const getter = vi.fn(() => 'Executat'); const accessor = {}; Object.defineProperty(accessor, 'x', { enumerable: true, get: getter });
  for (const payload of [{ text: 'é'.repeat(32768) }, circular, accessor, new Date(), { x: undefined }, { x: Infinity }, { x: 1n }, { x: '\u0000' }]) {
    await expect(a.adminDesaPersonalitzacio({ clau: 'taxonomia', payload, versio: null }, { tenantId: B })).rejects.toMatchObject({ code: 'desconegut' });
  }
  expect(getter).not.toHaveBeenCalled(); expect(autoritza).not.toHaveBeenCalled();
  await expect(a.adminDesaPersonalitzacio({ clau: 'taxonomia', payload: { text: 'a'.repeat(64000) }, versio: 0 }, { tenantId: B })).resolves.toMatchObject({ versio: 1 });
});

test('la construcció valida el catàleg d’autoritat, no l’inferix del directori públic', () => {
  for (const administracioLocal of [{}, { pobles: pobles(), autoritza: true }, { pobles: [{ id: 'slug', slug: 'a', nom: 'A' }], autoritza: () => true }, { pobles: [pobles()[0], pobles()[0]], autoritza: () => true }]) expect(() => crea({ administracioLocal })).toThrow(TypeError);
});

test('destroy té prioritat sobre la captura o validació d’inputs administratius', async () => {
  const a = crea(); entra(a); await a.destroy();
  const getter = vi.fn(() => 'no executar'), payload = {};
  Object.defineProperty(payload, 'camp', { enumerable: true, get: getter });
  await expect(a.adminDesaPersonalitzacio({ clau: 'taxonomia', payload }, {})).rejects.toThrow('[adaptadorLocal] Adaptador tancat.');
  expect(getter).not.toHaveBeenCalled();
});

test('dues autoritzacions concurrents no sobreescriuen la mateixa versió', async () => {
  const a = crea(); entra(a);
  const resultats = await Promise.allSettled([a.adminDesaPersonalitzacio(dades('Primera'), { tenantId: B }), a.adminDesaPersonalitzacio(dades('Segona'), { tenantId: B })]);
  expect(resultats.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(resultats.find(r => r.status === 'rejected').reason).toMatchObject({ code: 'conflicte-versio' });
  expect(await a.adminHistorialPersonalitzacio('taxonomia', { tenantId: B })).toHaveLength(1);
});

for (const metode of ['adminLlistaPobles', 'adminLligPersonalitzacio', 'adminDesaPersonalitzacio', 'adminHistorialPersonalitzacio']) test(`${metode}: no executa getters de config abans de capturar l’actor`, async () => {
  const a = crea(); entra(a); const getter = vi.fn(() => { entra(a, BERTA); return undefined; });
  const config = { tenantId: B }; Object.defineProperty(config, 'signal', { enumerable: true, get: getter });
  const resultat = metode === 'adminLlistaPobles' || metode === 'adminLligPersonalitzacio' ? a[metode](config) : metode === 'adminDesaPersonalitzacio' ? a[metode](dades(), config) : a[metode]('taxonomia', config);
  await expect(resultat).rejects.toMatchObject({ code: 'abast-invalid' });
  expect(getter).not.toHaveBeenCalled(); expect(a.getCurrentUser()?.id).toBe(ANNA);
});

test('signal extra de l’entrada write s’ignora sense executar-lo ni canviar qui autoritza', async () => {
  const autoritza = vi.fn(async () => true), a = crea({ administracioLocal: { pobles: pobles(), autoritza } }); entra(a);
  const entrada = dades(), getter = vi.fn(() => { entra(a, BERTA); return undefined; });
  Object.defineProperty(entrada, 'signal', { enumerable: true, get: getter });
  await expect(a.adminDesaPersonalitzacio(entrada, { tenantId: B })).resolves.toMatchObject({ versio: 1 });
  expect(getter).not.toHaveBeenCalled(); expect(autoritza.mock.calls[0][0].personaId).toBe(ANNA);
  expect((await a.adminHistorialPersonalitzacio('taxonomia', { tenantId: B }))[0].autor).toBe(ANNA);
});

test('clau d’historial malformada no executa cap getter de signal', async () => {
  const a = crea(); entra(a); const getter = vi.fn(() => undefined), clau = {};
  Object.defineProperty(clau, 'signal', { enumerable: true, get: getter });
  await expect(a.adminHistorialPersonalitzacio(clau, { tenantId: B })).rejects.toMatchObject({ code: 'clau-invalida' });
  expect(getter).not.toHaveBeenCalled();
});

test('un fals senyal amb getter aborted no executa codi i un senyal genuí usa la lectura intrínseca', async () => {
  const a = crea(); entra(a); const getter = vi.fn(() => false), signal = {};
  Object.defineProperty(signal, 'aborted', { get: getter });
  await expect(a.adminLligPersonalitzacio({ tenantId: B, signal })).rejects.toMatchObject({ code: 'abast-invalid' });
  expect(getter).not.toHaveBeenCalled();
  const control = new AbortController(), propi = vi.fn(() => { entra(a, BERTA); return false; });
  Object.defineProperty(control.signal, 'aborted', { get: propi });
  await expect(a.adminLligPersonalitzacio({ tenantId: B, signal: control.signal })).resolves.toEqual({ taxonomia: null, estil: null });
  expect(propi).not.toHaveBeenCalled(); expect(a.getCurrentUser()?.id).toBe(ANNA);
});
