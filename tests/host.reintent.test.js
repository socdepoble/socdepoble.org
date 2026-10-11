/* Onada 12 (261011; ordres 261011_0130, punt 7) · El reintent de l'arrencada
   fallida. Abans, si arrenca() fallava (el tros de l'adaptador que no baixa),
   la fase tornava a «configurable» i el quanLlest() d'un «Torna-ho a provar»
   registrava una espera que ningú no resolia: cap entrada torna a cridar
   arrenca(). Ara la primera espera després de la fallada torna a arrencar,
   una vegada per fallada.
   Fitxer a banda de host.test.js: allí l'estat del mòdul viatja de prova en
   prova fins al segellat; ací cada prova avalua host.js de nou. */
import { beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ defineix: vi.fn(), carregues: 0 }));
vi.mock('../src/PedraSecaEmbed.jsx', () => ({ defineCustomElement: (...args) => m.defineix(...args) }));
vi.mock('../src/config/runtimePolicy.js', () => ({ setRuntimePolicy: vi.fn(), getRuntimePolicy: () => ({}), esOrigenParePermes: () => false }));
vi.mock('../src/data/identitat.js', () => ({ adoptaSessioExterna: vi.fn(() => true), esborraSessio: vi.fn(), configuraBackendSessio: vi.fn() }));
vi.mock('../src/utils/sanitize.js', () => ({ sanitizeHtml: x => x }));
vi.mock('../src/apps/plataforma/registreApps.js', () => ({ registraAppExterna: vi.fn(), registraModul: vi.fn() }));
/* El tros de l'adaptador (import('./data/supabase/index.js') de host.js): un
   adaptador sintètic complet, o un import que no baixa. Amb vi.doMock i no
   vi.mock: vitest guarda el resultat d'una fàbrica entre vi.resetModules(), i
   cada prova (i cada reintent) ha de tornar a demanar el tros. */
function tros({ caigut = false } = {}) {
  vi.doMock('../src/data/supabase/index.js', async () => {
    m.carregues += 1;
    if (caigut) throw new TypeError('Failed to fetch dynamically imported module');
    const { CONTRACTE_NUCLI } = await vi.importActual('../src/data/contracte.js');
    return Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => undefined]));
  });
}

const FALLADA = new Error('arrencada trencada');
const falla = () => { throw FALLADA; };
const PENDENT = Symbol('pendent');
const estatDe = async (promesa) => {
  const resultat = await Promise.race([promesa.then(() => 'resolta', () => 'rebutjada'), new Promise((resolve) => setTimeout(() => resolve(PENDENT), 20))]);
  return resultat;
};
async function hostNou({ caigut = false } = {}) {
  vi.resetModules();
  tros({ caigut });
  return { host: await import('../src/host.js'), autocuracio: await import('../src/utils/autocuracio.js') };
}

beforeEach(() => { m.defineix.mockReset(); m.carregues = 0; });

test('una arrencada que falla rebutja, i el quanLlest() posterior torna a arrencar i resol', async () => {
  const { host, autocuracio } = await hostNou();
  m.defineix.mockImplementationOnce(falla);
  // Una vista que ja esperava rep el rebuig, com sempre.
  const esperaPrevia = expect(host.quanLlest()).rejects.toBe(FALLADA);
  await expect(host.arrenca()).rejects.toBe(FALLADA);
  await esperaPrevia;
  expect(host.estat()).toMatchObject({ fase: 'configurable', configurable: true });
  expect(m.defineix).toHaveBeenCalledTimes(1);
  // El «Torna-ho a provar» d'una vista: només demana quanLlest().
  await expect(host.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
  expect(m.defineix).toHaveBeenCalledTimes(2);
  expect(host.estat().fase).toBe('segellat');
  // Segellat: una sola direcció. Cap espera posterior torna a arrencar res.
  await expect(host.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
  await expect(host.arrenca()).resolves.toMatchObject({ fase: 'segellat' });
  expect(m.defineix).toHaveBeenCalledTimes(2);
  expect(autocuracio.incidents().map(({ tipus, on, accio }) => [tipus, on, accio])).toEqual([
    ['arrencada', 'host', 'reintent'], ['arrencada', 'host', 'fallada']
  ]);
});

test('el tros de l’adaptador que no baixa la primera vegada: el reintent el torna a demanar', async () => {
  const { host } = await hostNou({ caigut: true });
  await expect(host.arrenca()).rejects.toBeInstanceOf(Error);
  expect(m.carregues).toBe(1);
  expect(m.defineix).not.toHaveBeenCalled();
  expect(host.estat()).toMatchObject({ fase: 'configurable', implementat: [] });
  tros();
  await expect(host.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
  expect(m.carregues).toBe(2);
  expect(m.defineix).toHaveBeenCalledTimes(1);
});

test('sense cap arrencada prèvia, quanLlest() no arrenca: deferArrenca() i arrencada="manual" continuen manant', async () => {
  const { host, autocuracio } = await hostNou();
  expect(await estatDe(host.quanLlest())).toBe(PENDENT);
  host.deferArrenca();
  const espera = host.quanLlest();
  expect(await estatDe(espera)).toBe(PENDENT);
  expect(m.defineix).not.toHaveBeenCalled();
  expect(m.carregues).toBe(0);
  expect(host.estat().fase).toBe('configurable');
  expect(autocuracio.incidents()).toEqual([]);
  // L'arrencada manual de l'amfitrió resol les esperes, com sempre.
  await host.arrenca();
  await expect(espera).resolves.toMatchObject({ fase: 'segellat' });
});

test('si torna a fallar no hi ha cap bucle: un intent per cada quanLlest() explícit, i l’espera rep el rebuig', async () => {
  const { host } = await hostNou();
  m.defineix.mockImplementation(falla);
  await expect(host.arrenca()).rejects.toBe(FALLADA);
  expect(m.defineix).toHaveBeenCalledTimes(1);
  // Reintent que torna a fallar: l'espera no es queda penjada, rep el rebuig.
  await expect(host.quanLlest()).rejects.toBe(FALLADA);
  expect(m.defineix).toHaveBeenCalledTimes(2);
  // Ningú no ho torna a provar sol.
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(m.defineix).toHaveBeenCalledTimes(2);
  expect(host.estat().fase).toBe('configurable');
  await expect(host.quanLlest()).rejects.toBe(FALLADA);
  expect(m.defineix).toHaveBeenCalledTimes(3);
  // Quan la causa desapareix, el següent intent explícit segella.
  m.defineix.mockReset();
  await expect(host.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
  expect(m.defineix).toHaveBeenCalledTimes(1);
});

/* Refutació 261011 · Dos forats que la primera versió deixava. */
test('després d’una fallada, amb deferArrenca() mana l’amfitrió: quanLlest() no se li avança', async () => {
  const { host } = await hostNou();
  m.defineix.mockImplementationOnce(falla);
  await expect(host.arrenca()).rejects.toBe(FALLADA);
  host.deferArrenca();
  const espera = host.quanLlest();
  expect(await estatDe(espera)).toBe(PENDENT);
  expect(m.defineix).toHaveBeenCalledTimes(1);
  await host.arrenca();
  await expect(espera).resolves.toMatchObject({ fase: 'segellat' });
  expect(m.defineix).toHaveBeenCalledTimes(2);
});

test('un arrenca() de l’amfitrió després d’una fallada gasta la marca: el quanLlest() que arriba mentre és en vol no anota cap reintent', async () => {
  const { host, autocuracio } = await hostNou({ caigut: true });
  await expect(host.arrenca()).rejects.toBeInstanceOf(Error);
  tros();
  const manual = host.arrenca();
  const espera = host.quanLlest();
  await expect(manual).resolves.toMatchObject({ fase: 'segellat' });
  await expect(espera).resolves.toMatchObject({ fase: 'segellat' });
  expect(m.carregues).toBe(2);
  expect(autocuracio.incidents().map(({ accio }) => accio)).toEqual(['fallada']);
});

test('dues esperes després d’una fallada fan un sol reintent, i una espera avortada no gasta la marca', async () => {
  const { host } = await hostNou({ caigut: true });
  await expect(host.arrenca()).rejects.toBeInstanceOf(Error);
  tros();
  const avortada = new AbortController();
  avortada.abort();
  await expect(host.quanLlest({ signal: avortada.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.carregues).toBe(1);
  const [primera, segona] = [host.quanLlest(), host.quanLlest()];
  await expect(Promise.all([primera, segona])).resolves.toEqual([expect.objectContaining({ fase: 'segellat' }), expect.objectContaining({ fase: 'segellat' })]);
  expect(m.carregues).toBe(2);
  expect(m.defineix).toHaveBeenCalledTimes(1);
});
