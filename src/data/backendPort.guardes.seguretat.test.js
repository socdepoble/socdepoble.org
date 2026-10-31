import { afterEach, expect, test, vi } from 'vitest';
import * as port from './backendPort.js';
import { CONTRACTE_NUCLI } from './contracte.js';
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
