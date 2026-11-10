import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import { creaMagatzemNevera } from './magatzem.js';
import manifest from './manifest.js';
import AppNevera from './AppNevera.jsx';
import { ARTICLES_BASE, ARTICLES_PRODUCTES, estatInicial } from './nucli/index.js';
import { ContextNevera } from './vistes/context.js';
import { RebostWorkspace } from './vistes/RebostWorkspace.jsx';
import { modelRebostWorkspace } from './vistes/modelRebostWorkspace.js';

const magatzems = [];
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
});
afterEach(() => {
  cleanup(); magatzems.splice(0).forEach(magatzem => magatzem.tanca());
  vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/');
});

describe('P0-69 · Rebost sobre el Workspace canònic', () => {
  it('el model conté el catàleg sencer i conserva els objectes d’origen', () => {
    const estat = estatInicial();
    const model = modelRebostWorkspace(estat);
    expect(model.items).toHaveLength(ARTICLES_BASE.length + ARTICLES_PRODUCTES.length);
    expect(ARTICLES_PRODUCTES).toHaveLength(592);
    expect(model.items.find(item => item.id === ARTICLES_PRODUCTES[0].id).dades).toBe(ARTICLES_PRODUCTES[0]);
    expect(model.canAutoSelect).toBe(false);
  });

  it('l’entrada principal obri el Rebost i selecciona inline sense diàleg', async () => {
    const magatzem = creaMagatzemNevera({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    const App = () => <AppNevera magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/nevera', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });
    await screen.findByRole('heading', { name: 'Rebost', level: 1 });
    expect(screen.getByTestId('ubicacio').textContent).toBe('/app/nevera/rebost');
    fireEvent.click(screen.getAllByRole('button', { name: 'Tomaques', exact: true }).at(-1));
    const detail = within(document.getElementById('app-grid-main'));
    expect(await detail.findByRole('heading', { name: 'Tomaques', level: 1 })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(detail.getByRole('button', { name: 'N’hi ha' }));
    await waitFor(async () => expect((await magatzem.llegix()).casa).toContainEqual({ articleId: 'tomaques', estat: 'hi-ha' }));
    fireEvent.click(detail.getByRole('button', { name: 'Afig a «Casa»' }));
    await waitFor(async () => expect((await magatzem.llegix()).llistes[0].linies.some(linia => linia.articleId === 'tomaques')).toBe(true));
    expect(detail.getByRole('link', { name: 'Obri la compra · Casa' }).getAttribute('href')).toBe('/app/nevera/llista/casa');
  });
});

it('la vista lectora no executa cap acció del rebost ni de compra', async () => {
  const estat = estatInicial();
  const accions = { marcaACasa: vi.fn(), afig: vi.fn() };
  const valor = { estat, accions, llegit: true, mode: 'lectora', persistent: false,
    llistaVigent: () => estat.llistes[0], ruta: (...trams) => `/app/nevera/${trams.join('/')}` };
  const App = () => <ContextNevera.Provider value={valor}><RebostWorkspace /></ContextNevera.Provider>;
  const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });
  muntaPlataforma('/app/nevera/rebost', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });
  await screen.findByRole('heading', { name: 'Rebost', level: 1 });
  fireEvent.click(screen.getAllByRole('button', { name: 'Tomaques', exact: true }).at(-1));
  const detail = within(document.getElementById('app-grid-main'));
  const stock = await detail.findByRole('button', { name: 'N’hi ha' });
  const compra = detail.getByRole('button', { name: 'Afig a «Casa»' });
  expect(stock.disabled).toBe(true); expect(compra.disabled).toBe(true);
  fireEvent.click(stock); fireEvent.click(compra);
  expect(accions.marcaACasa).not.toHaveBeenCalled(); expect(accions.afig).not.toHaveBeenCalled();
});
