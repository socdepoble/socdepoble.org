/**
 * Tasca 5 (ordre del Mestre, 261001) · Les dates de prova del Mur arriben pel
 * carregador del mode seed, i només per ell.
 *
 * El Mur (loadMur) i les pàgines de sistema (loadCoreContent) es demanen per
 * separat: han de dir les MATEIXES dates, les de l'arrencada. En mode local i
 * en remot, el copy de les pàgines conserva la seua data de creació: cap data
 * de prova arriba a producció.
 *
 * El rellotge es fixa abans d'importar (l'arrencada és la càrrega del mòdul);
 * la prova no depén del dia en què s'executa.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const xarxa = vi.hoisted(() => ({ request: null }));
vi.mock('./runtime.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, request: (...args) => xarxa.request(...args) };
});

const ARA = new Date(2026, 8, 30, 16, 20);
const NODE = { supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'sb_publishable_proves', tenantId: '11111111-2222-3333-4444-555555555555' };

let content;
let prova;
let APP_SEED;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(ARA);
  vi.resetModules();
  xarxa.request = vi.fn(async () => []);
  content = await import('./content.js');
  prova = await import('../../sections/mur/datesDeProvaMur.js');
  ({ APP_SEED } = await import('../appSeed.js'));
});
afterEach(() => { vi.useRealTimers(); });

const perId = (llista, id) => llista.find((element) => element.id === id);

test('en mode seed, el Mur i les pàgines porten les dates de prova de l’arrencada, sense cap petició', async () => {
  const esperada = prova.llavorAmbDatesDeProva(APP_SEED, ARA);
  const mur = await content.loadMur('A', { dataMode: 'seed' });
  const core = await content.loadCoreContent('A', { dataMode: 'seed' });
  expect(mur.marketItems).toEqual(esperada.marketItems);
  expect(mur.feedPosts).toEqual(esperada.feedPosts);
  expect(mur.events).toBe(APP_SEED.events);
  expect(core.pages).toEqual(esperada.pages);
  expect(xarxa.request).not.toHaveBeenCalled();

  // Les dues càrregues, repartides en l'ordre de les importants.
  const moments = prova.IMPORTANTS_DEL_MUR.map(([coleccio, id]) => (coleccio === 'pages'
    ? perId(core.pages, id).date
    : perId(mur[coleccio], id).created_at)).map((data) => new Date(data).getTime());
  moments.slice(1).forEach((moment, i) => expect(moment).toBeLessThan(moments[i]));
  expect(moments[0]).toBeLessThan(ARA.getTime());
  expect(Math.min(...moments)).toBeGreaterThanOrEqual(prova.dillunsDe(ARA).getTime());
  /* Onada 8 (261009) · Disseny ja no porta data de prova: la seua és la del
     copy, la que li ha donat el Mestre. Abans, 2026-09-14T18:25:00+02:00. */
  expect(perId(core.pages, 'disseny').date).toBe('2026-09-10T00:00:00+02:00');
  expect(perId(core.pages, 'versions').date).toBe('2026-09-03T11:50:00+02:00');
});

/* Auditoria 261007 (B) · Esta prova passava per loadAppData, codi mort
   retirat (ningú no la cridava). El que vigilava (cap carregador del mode
   seed no diu una data diferent de l'arrencada) ara ho comprova amb els que
   s'usen: una segona càrrega del Mur, la Multimèdia i les pàgines. */
test('en mode seed, una segona càrrega i la Multimèdia diuen les mateixes dates que el Mur', async () => {
  const esperada = prova.llavorAmbDatesDeProva(APP_SEED, ARA);
  const primera = await content.loadMur('A', { dataMode: 'seed' });
  const segona = await content.loadMur('A', { dataMode: 'seed' });
  const multimedia = await content.loadMultimedia('A', { dataMode: 'seed' });
  const core = await content.loadCoreContent('A', { dataMode: 'seed' });
  expect(segona.marketItems).toEqual(primera.marketItems);
  expect(segona.feedPosts).toEqual(primera.feedPosts);
  expect(segona.marketItems).toEqual(esperada.marketItems);
  expect(multimedia.mediaItems).toEqual(esperada.mediaItems || []);
  expect(core.pages).toEqual(esperada.pages);
  expect(xarxa.request).not.toHaveBeenCalled();
});

test('en mode local, les pàgines conserven la data de creació del copy', async () => {
  const core = await content.loadCoreContent('A', { dataMode: 'local' });
  expect(core.pages).toEqual(APP_SEED.pages);
  expect(perId(core.pages, 'projecte').date).toBe('2026-08-20T00:00:00.000Z');
});

test('en mode remot, les pàgines conserven la data de creació del copy', async () => {
  const core = await content.loadCoreContent('A', { ...NODE, dataMode: 'remote' });
  expect(xarxa.request).toHaveBeenCalledTimes(1);
  expect(core.pages).toEqual(APP_SEED.pages);
  // T4 del prompt 1140: l'hora real de publicació (HEAD:265, 57ec5684, 13:37:58 +0200).
  expect(perId(core.pages, 'wikidepoble').date).toBe('2026-09-24T13:37:58+02:00');
});
