/**
 * Gauntlet 261022 · 10.000 fluxos lògics simultanis al mateix procés.
 * Port, adaptador, serialització HTTP i política de rutes reals; únicament
 * fetch és una frontera simulada. No són navegadors ni sessions autenticades
 * independents i no és una prova de capacitat del servidor de producció.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { CONTRACTE_NUCLI } from '../contracte.js';
import { loadPerfilPublic as pelPort, setBackendImplementation } from '../backendPort.js';
import { loadPerfilPublic } from './perfils.js';
import * as runtime from './runtime.js';
import { resolRuta, treuBase, triaRouter } from '../../app/contexts/politicaRouter.js';

const CONFIG = Object.freeze({
  dataMode: 'remote', supabaseUrl: 'https://gauntlet.invalid',
  supabaseAnonKey: 'sb_publishable_fixture_gauntlet', tenantId: '33333333-3333-4333-8333-333333333333'
});
const resposta = (files, status = 200) => ({
  ok: status === 200, status, json: async () => files, text: async () => 'fallada simulada', headers: { get: () => null }
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('10.000 perfils concurrents: encaminament, aïllament, errors finits i zero xarxa externa', async () => {
  const TOTAL = 10_000;
  const impl = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => { throw new Error(`Fora d’àmbit: ${nom}`); }]));
  setBackendImplementation({ ...impl, loadPerfilPublic });
  const pendents = [], durades = [];
  let acceptats = 0, actius = 0, pic = 0, avortats = 0, inesperats = 0;
  let resolTots;
  const totsEnVol = new Promise((resolve) => { resolTots = resolve; });
  vi.stubGlobal('fetch', (adreca, options) => {
    const url = new URL(adreca);
    if (url.origin !== CONFIG.supabaseUrl || url.pathname !== '/rest/v1/organization_directory') {
      inesperats++;
      return Promise.reject(new Error('Xarxa fora de la fixture prohibida'));
    }
    expect(options.method).toBe('GET');
    expect(options.redirect).toBe('error');
    expect(url.searchParams.get('tenant_id')).toBe(`eq.${CONFIG.tenantId}`);
    const slug = url.searchParams.get('slug').slice(3);
    const i = Number(slug.slice(4));
    expect(slug).toBe(`veu-${i}`);
    expect(options.signal.aborted).toBe(false);
    acceptats++; actius++; pic = Math.max(pic, actius);
    return new Promise((resolve, reject) => {
      let acabat = false;
      const acaba = (valor, error = false) => {
        if (acabat) return;
        acabat = true; actius--;
        options.signal.removeEventListener('abort', avorta);
        if (error) reject(valor); else resolve(valor);
      };
      const avorta = () => { avortats++; acaba(new DOMException('Cancel·lada', 'AbortError'), true); };
      options.signal.addEventListener('abort', avorta, { once: true });
      pendents.push(() => acaba(i % 100 === 0
        ? resposta([], 503)
        : resposta([{ id: `org-${i}`, slug, name: `Veu ${i}`, kind: 'company', town_name: `Poble ${i}` }])));
      if (acceptats === TOTAL) resolTots();
    });
  });
  const inici = performance.now();
  const feina = Promise.all(Array.from({ length: TOTAL }, async (_, i) => {
    const comenca = performance.now();
    const router = triaRouter({ basename: '/comunitat' });
    const ruta = resolRuta(`../empresa/veu-${i}`, '/gent/javillinares');
    expect(treuBase(`${router.basename}${ruta}`, router.basename)).toBe(`/empresa/veu-${i}`);
    expect(treuBase(`/comunitats/empresa/veu-${i}`, router.basename)).toBeNull();
    const clau = decodeURIComponent(ruta.split('/').at(-1));
    const perfil = await pelPort(clau, CONFIG);
    if (i % 100 === 0) expect(perfil).toBeNull();
    else expect(perfil).toMatchObject({ id: `org-${i}`, slug: `veu-${i}`, nom: `Veu ${i}`, poble: `Poble ${i}`, propietari: false });
    durades.push(performance.now() - comenca);
    return perfil;
  }));
  // La barrera impedix que una promesa acabada faça passar seqüencialitat per concurrència.
  await totsEnVol;
  expect(actius).toBe(TOTAL);
  pendents.reverse().forEach((resol) => resol()); // Arribada en ordre contrari al de la ruta.
  const perfils = await feina;
  expect(perfils.filter(Boolean)).toHaveLength(9900);
  expect(new Set(perfils.filter(Boolean).map(({ id }) => id)).size).toBe(9900);
  expect({ acceptats, pic, actius, avortats, inesperats }).toEqual({ acceptats: TOTAL, pic: TOTAL, actius: 0, avortats: 0, inesperats: 0 });
  durades.sort((a, b) => a - b);
  const rutaInforme = '/tmp/sdp-gauntlet-perfils-10000.json';
  const fonts = ['perfils.js', 'runtime.js', '../backendPort.js', '../../app/contexts/politicaRouter.js'];
  writeFileSync(rutaInforme, `${JSON.stringify({
    data: new Date().toISOString(), abast: 'Fluxos lògics locals; transport simulat; no navegadors, sessions independents ni càrrega de producció',
    fluxos: TOTAL, respostes: 9900, errors503Simulats: 100,
    peticionsSimulades: acceptats, picEnVol: pic, pendentsFinals: actius, intentsForaDeFixture: inesperats,
    duradaMs: performance.now() - inici, p50Ms: durades[4999], p95Ms: durades[9499], p99Ms: durades[9899],
    sha256: Object.fromEntries(fonts.map((ruta) => [ruta, createHash('sha256').update(readFileSync(new URL(ruta, import.meta.url))).digest('hex')]))
  }, null, 2)}\n`);
  console.log(`GAUNTLET_REPORT ${rutaInforme}`);
}, 30_000);

test('l’adaptador de perfil acaba als 3 s encara que un transport ignore l’avortament', async () => {
  vi.useFakeTimers();
  let senyal, acabat = false, resultat;
  vi.stubGlobal('fetch', (_url, { signal }) => {
    senyal = signal;
    return new Promise(() => {});
  });
  const feina = loadPerfilPublic('pendent', CONFIG).then(
    (valor) => { acabat = true; resultat = valor; },
    (error) => { acabat = true; resultat = error; }
  );
  await vi.advanceTimersByTimeAsync(2999);
  expect(acabat).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(acabat).toBe(true);
  expect(senyal.aborted).toBe(true);
  await feina;
  expect(resultat).toMatchObject({ name: 'TimeoutError' }); // Temps esgotat ≠ perfil absent.
});

test('el pressupost de 3 s és compartit per directori i RPC de persona, no es reinicia', async () => {
  vi.useFakeTimers();
  const id = '44444444-4444-4444-8444-444444444444';
  vi.spyOn(runtime, 'getCurrentUser').mockReturnValue({ id: '55555555-5555-4555-8555-555555555555' });
  let acabat = false, signalRpc, errorFinal;
  const rutes = [];
  vi.stubGlobal('fetch', (url, { signal }) => {
    rutes.push(new URL(url).pathname);
    if (rutes.length === 1) return new Promise((resolve) => setTimeout(() => resolve(resposta([])), 2500));
    signalRpc = signal;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Cancel·lada', 'AbortError')), { once: true }));
  });
  const feina = loadPerfilPublic(id, CONFIG).then(() => { acabat = true; }, (error) => { acabat = true; errorFinal = error; });
  await vi.advanceTimersByTimeAsync(2999);
  expect(rutes).toEqual(['/rest/v1/organization_directory', '/rest/v1/rpc/perfil_public']);
  expect(acabat).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(acabat).toBe(true);
  expect(signalRpc.aborted).toBe(true);
  await feina;
  expect(errorFinal).toMatchObject({ name: 'TimeoutError' });
});
