/* v1.2.26 · C26-3 · IDEA-375 · El port local de taxonomiaPagines, per l'adaptador local sencer (la guarda `guardat`
   i la captura de l'abast inclosos). Autoritat només de l'administració local injectada, CAS per versió i els
   mateixos codis que el port remot (supabase/taxonomiaPagines.js): 'sense-permis' i 'conflicte-versio'. */
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { creaAdaptadorLocal } from './adaptadorLocal.js';

const A = '11111111-1111-4111-8111-111111111111';
const ANNA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const BERTA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const instancies = [];
const xarxa = vi.fn(() => { throw new Error('TAXONOMIA_LOCAL_XARXA_PROHIBIDA'); });
beforeAll(() => vi.stubGlobal('fetch', xarxa));
afterEach(async () => { esborraSessio({ abast: 'tot' }); await Promise.all(instancies.splice(0).map(a => a.destroy())); });
afterAll(() => { expect(xarxa).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
function crea(autoritza = async ({ actorId }) => actorId === ANNA) {
  const a = creaAdaptadorLocal({ mode: 'local', tenantId: A, administracioLocal: { pobles: [{ id: A, slug: 'sella', nom: 'Sella' }], autoritza } });
  instancies.push(a); return a;
}
function entra(a, id = ANNA) {
  configuraBackendSessio(a.configuracio);
  expect(desaSessio({ access_token: 'taxonomia-local-opac', user: { id, user_metadata: { role: 'superadmin', aal: 'aal2' } } })).toBe(true);
}
const patch = (versio = 0) => ({ categoriesSistema: ['Mur'], etiquetes: [' Idees ', 'Idees'], geografia: { pobles: ['Sella'] }, versio });

test('sense sessió, sense autoritat o amb un rol del perfil, sense-permis; res no es desa', async () => {
  const a = crea();
  await expect(a.actualitzaTaxonomiaPagina('legal', patch())).rejects.toMatchObject({ code: 'sense-permis' });
  entra(a, BERTA);
  await expect(a.actualitzaTaxonomiaPagina('legal', patch())).rejects.toMatchObject({ code: 'sense-permis', message: 'Cal administració editorial de Sóc de Poble.' });
  await expect(a.lligTaxonomiaPagina('legal')).rejects.toMatchObject({ code: 'sense-permis' });
  const senseAutoritat = creaAdaptadorLocal({ mode: 'local', tenantId: A, administracioLocal: null }); instancies.push(senseAutoritat);
  entra(senseAutoritat);
  await expect(senseAutoritat.actualitzaTaxonomiaPagina('legal', patch())).rejects.toMatchObject({ code: 'sense-permis' });
  entra(a);
  expect(await a.lligTaxonomiaPagina('legal')).toBeNull();
});

test('CAS per versió: crea amb 0, refusa una versió vella amb conflicte-versio i lliura còpies netes', async () => {
  const autoritza = vi.fn(async ({ actorId }) => actorId === ANNA);
  const a = crea(autoritza); entra(a);
  const primera = await a.actualitzaTaxonomiaPagina('legal', patch(0));
  expect(primera).toEqual({ idPagina: 'legal', categoriesSistema: ['Mur'], categoriesTematiques: [], etiquetes: ['Idees'], geografia: { pobles: ['Sella'] }, mencions: [], versio: 1 });
  expect(autoritza).toHaveBeenCalledWith({ operacio: 'actualitzaTaxonomiaPagina', tenantId: A, actorId: ANNA, idPagina: 'legal' });
  await expect(a.actualitzaTaxonomiaPagina('legal', patch(0))).rejects.toMatchObject({ code: 'conflicte-versio', message: 'La pàgina ha canviat. Recarrega abans de desar.' });
  expect((await a.actualitzaTaxonomiaPagina('legal', patch(1))).versio).toBe(2);
  const llegida = await a.lligTaxonomiaPagina('legal');
  llegida.etiquetes.push('Intrusa');
  expect((await a.lligTaxonomiaPagina('legal')).etiquetes).toEqual(['Idees']);
  await expect(a.actualitzaTaxonomiaPagina('legal', { ...patch(2), etiquetes: [{}] })).rejects.toBeInstanceOf(TypeError);
  await expect(a.lligTaxonomiaPagina('../privat')).rejects.toBeInstanceOf(TypeError);
  expect((await a.lligTaxonomiaPagina('legal')).versio).toBe(2);
});

test('un canvi de sessió mentre l’autoritat respon no desa res', async () => {
  let deixa, comenca; const espera = new Promise(r => { deixa = r; }), dins = new Promise(r => { comenca = r; });
  const autoritza = vi.fn(async () => { comenca(); await espera; return true; });
  const a = crea(autoritza); entra(a);
  const pendent = a.actualitzaTaxonomiaPagina('legal', patch()).then(v => ({ v }), error => ({ error }));
  await dins; esborraSessio({ abast: 'tot' }); entra(a, BERTA); deixa();
  expect(await pendent).toMatchObject({ error: { name: 'AbortError' } });
  esborraSessio({ abast: 'tot' }); entra(a);
  expect(await a.lligTaxonomiaPagina('legal')).toBeNull();
});
