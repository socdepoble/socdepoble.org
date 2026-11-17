import { afterEach, expect, test, vi } from 'vitest';
import * as port from './backendPort.js';
import { CONTRACTE_NUCLI } from './contracte.js';
import { estatPort } from './backendPortEstat.js';
const nucli = methods => ({ ...Object.fromEntries(CONTRACTE_NUCLI.map(n => [n, () => null])), ...methods });
afterEach(() => { port.destroy(); vi.useRealTimers(); });
test('PN-01: un retorn malformat es rebutja sense tocar les seues dades', async () => {
  const dades = { feedPosts: [{ id: 'a' }], events: 'no-llista', marketItems: [] };
  port.setBackendImplementation(nucli({ loadMur: () => dades }));
  await expect(port.loadMur('u')).rejects.toMatchObject({ codi: 'BACKEND_RESPOSTA_INVALIDA' });
  expect(dades.events).toBe('no-llista');
});
/* R2-COR-01 (revisió de la Ronda 2) · PN-02 pel port real: un forat dins d'una llista no rebutja la lectura; només cau el forat. */
test('PN-02: un null dins de towns només lleva el forat; la resta de pobles arriba i l’entrada no es muta', async () => {
  const towns = [{ id: 'la-torre-de-les-macanes' }, null, 7, { id: 'sella' }];
  const pages = [{ id: 'consola' }];
  const dades = { towns, pages, agents: [] };
  port.setBackendImplementation(nucli({ loadCoreContent: () => dades }));
  const llegit = await port.loadCoreContent({});
  expect(llegit.towns).toEqual([{ id: 'la-torre-de-les-macanes' }, { id: 'sella' }]);
  expect(llegit.pages).toBe(pages);
  expect(dades.towns).toBe(towns); expect(towns).toHaveLength(4);
  // Una llista neta torna el mateix objecte; una clau que no és llista continua rebutjant la lectura.
  const net = { towns: [{ id: 'sella' }], pages: [], agents: [] };
  port.setBackendImplementation(nucli({ loadCoreContent: () => net }));
  await expect(port.loadCoreContent({})).resolves.toBe(net);
  port.setBackendImplementation(nucli({ loadCoreContent: () => ({ towns: { id: 'x' }, pages: [], agents: [] }) }));
  await expect(port.loadCoreContent({})).rejects.toMatchObject({ codi: 'BACKEND_RESPOSTA_INVALIDA' });
});
test('PN-01: cancel·lació i canvi de backend descarten el resultat tardà', async () => {
  let resol;
  port.setBackendImplementation(nucli({ loadMur: () => new Promise(r => { resol = r; }) }));
  const lectura = port.loadMur('u'); await Promise.resolve();
  port.setBackendImplementation(nucli({ loadMur: () => ({ feedPosts: [], events: [], marketItems: [] }) }));
  await expect(lectura).rejects.toMatchObject({ name: 'AbortError' });
  resol({ feedPosts: [], events: [], marketItems: [] });
  await expect(port.loadMur('u')).resolves.toMatchObject({ events: [] });
});
test('PN-01: el termini talla el senyal del transport i la promesa', async () => {
  vi.useFakeTimers(); let signal;
  port.setBackendImplementation(nucli({ loadMur: (_u,c) => { signal=c.signal; return new Promise(() => {}); } }));
  const lectura = port.loadMur('u'); const rebut = expect(lectura).rejects.toMatchObject({ name: 'TimeoutError' });
  await vi.advanceTimersByTimeAsync(15000); await rebut;
  expect(signal.aborted).toBe(true); expect(vi.getTimerCount()).toBe(0);
});
/* ARBITRATGE de l'Elefant (R32, Ronda 2 · Peixos 3 i 4 sobre backendPort.js) ·
   lligAmbGuardes no invoca mai l'adaptador amb un senyal que ja és avortat:
   ni crida, ni lectura en vol, ni rellotge de 15 s. Val per al senyal de la
   configuració (loadMur, loadNotes…) i per al de la consulta (loadNotesPage). */
test('ARBITRATGE R2: un AbortSignal ja avortat rebutja la lectura abans d’invocar backend[nom]()', async () => {
  vi.useFakeTimers();
  const loadMur = vi.fn(() => ({ feedPosts: [], events: [], marketItems: [] }));
  const loadNotesPage = vi.fn(() => ({ notes: [] }));
  port.setBackendImplementation(nucli({ loadMur, loadNotesPage }));
  const control = new AbortController();
  control.abort();
  const lectura = port.loadMur('u', { signal: control.signal });
  const pagina = port.loadNotesPage({ signal: control.signal });
  /* Una promesa rebutjada, mai un throw síncron. */
  expect(lectura).toBeInstanceOf(Promise);
  expect(pagina).toBeInstanceOf(Promise);
  expect(estatPort.lecturesEnVol.size).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
  await expect(lectura).rejects.toMatchObject({ name: 'AbortError' });
  await expect(pagina).rejects.toMatchObject({ name: 'AbortError' });
  expect(loadMur).not.toHaveBeenCalled();
  expect(loadNotesPage).not.toHaveBeenCalled();
});
/* El mateix si el senyal s'avorta en el mateix torn, abans que córrega la
   microtasca que invocaria l'adaptador: la crida no arriba a eixir. */
test('ARBITRATGE R2: un senyal avortat abans de la microtasca tampoc no arriba a l’adaptador', async () => {
  vi.useFakeTimers();
  const loadMur = vi.fn(() => ({ feedPosts: [], events: [], marketItems: [] }));
  port.setBackendImplementation(nucli({ loadMur }));
  const control = new AbortController();
  const lectura = port.loadMur('u', { signal: control.signal });
  control.abort();
  await expect(lectura).rejects.toMatchObject({ name: 'AbortError' });
  expect(loadMur).not.toHaveBeenCalled();
  expect(estatPort.lecturesEnVol.size).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
});
/* Un nom que el backend actual no implementa (una capacitat opcional absent,
   paginacioNotes) mai arriba a lligAmbGuardes: el port llança un Error amb el
   nom del mètode, el mateix cada vegada, i no un TypeError mut
   («backend[nom] is not a function» o «Cannot read properties of undefined»). */
test('ARBITRATGE R2: una lectura que el backend no implementa llança un error determinista, mai un TypeError mut', () => {
  port.setBackendImplementation(nucli({}));
  const llanca = () => { try { port.loadNotesPage({ signal: new AbortController().signal }); } catch (error) { return error; } return null; };
  const primer = llanca();
  const segon = llanca();
  expect(primer).toBeInstanceOf(Error);
  expect(primer).not.toBeInstanceOf(TypeError);
  expect(primer.message).toBe('[backendPort] El mètode "loadNotesPage" no està implementat al backend actual.');
  expect(segon.message).toBe(primer.message);
  expect(estatPort.lecturesEnVol.size).toBe(0);
});
