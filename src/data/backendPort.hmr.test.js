/* P0-16 (consola del Mestre, 261103) · Una segona instància de backendPort.js
   (el ?t= de Vite després d'editar un component) no pot nàixer sense backend.
   La consulta ?hmr=… fa que el carregador en cree una altra, com
   tests/host.hmr.test.js fa amb host.js. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));

let contracte;
const nucli = (metodes = {}) => ({
  ...Object.fromEntries(contracte.CONTRACTE_NUCLI.map(nom => [nom, () => null])),
  ...metodes
});
const MUR = Object.freeze({ feedPosts: [], events: [], marketItems: [] });

beforeEach(async () => {
  vi.resetModules();
  contracte = await import('./contracte.js');
});

test('la instància nova del port veu l’adaptador i el segell de la vella', async () => {
  const vell = await import('./backendPort.js');
  vell.setBackendImplementation(nucli({ loadMur: () => MUR, getCurrentUser: () => ({ id: 'u' }) }));
  vell.freezeImplementation();
  const nou = await import('./backendPort.js?hmr=despres');
  expect(nou).not.toBe(vell);
  expect(Object.keys(nou.getBackendImplementation())).toEqual(Object.keys(vell.getBackendImplementation()));
  await expect(nou.loadMur('u')).resolves.toBe(MUR);
  expect(nou.getCurrentUser()).toEqual({ id: 'u' });
  expect(() => nou.setBackendImplementation(nucli())).toThrow('Backend bloquejat');
});

test('canviar el backend des d’una instància talla la lectura en vol de l’altra', async () => {
  const vell = await import('./backendPort.js');
  let senyal;
  vell.setBackendImplementation(nucli({ loadMur: (_u, c) => { senyal = c.signal; return new Promise(() => {}); } }));
  const lectura = vell.loadMur('u');
  lectura.catch(() => {});
  const nou = await import('./backendPort.js?hmr=despres');
  nou.setBackendImplementation(nucli({ loadMur: () => MUR }));
  try {
    expect(senyal.aborted).toBe(true);
    await expect(lectura).rejects.toMatchObject({ name: 'AbortError' });
    await expect(vell.loadMur('u')).resolves.toBe(MUR);
  } finally { vell.destroy(); }
});

test('l’estat del port no importa res: cap edició no li pot posar ?t=', () => {
  const codi = readFileSync(resolve(process.cwd(), 'src/data/backendPortEstat.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  expect(codi).toMatch(/export const estatPort/);
  expect(codi).not.toMatch(/\bimport\b|\bfrom\s*['"]/);
});

test('un host reavaluat després d’arrencar diu el mateix backend que el port', async () => {
  const host = await import('../host.js?hmr=abans');
  host.injectaBackendDelPaquet(nucli());
  await host.arrenca();
  const port = await import('./backendPort.js?hmr=despres');
  const hostNou = await import('../host.js?hmr=despres');
  await expect(hostNou.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
  expect(hostNou.estat().implementat.length).toBeGreaterThan(0);
  expect(Object.keys(port.getBackendImplementation())).toEqual(hostNou.estat().implementat);
});
