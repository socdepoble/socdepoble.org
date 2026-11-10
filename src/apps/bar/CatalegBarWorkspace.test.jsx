import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import { creaMagatzemBar } from './magatzem.js';
import manifest from './manifest.js';
import AppBar from './AppBar.jsx';
import { llavorCarta, ESTABLIMENT_EXEMPLE } from './nucli/llavor.js';
import { modelCartaWorkspace } from './vistes/modelCartaWorkspace.js';

const magatzems = [];
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
});
afterEach(() => {
  cleanup(); magatzems.splice(0).forEach(magatzem => magatzem.base.tanca());
  vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/');
});

describe('P0-69 · catàleg del Bar sobre el Workspace canònic', () => {
  it('la consulta històrica conserva els 327 productes i els 564 REF', async () => {
    const { llavorLaParroquiaR14 } = await import('./llavors/laParroquia.js');
    const font = await llavorLaParroquiaR14();
    expect(font.carta.productes).toHaveLength(327);
    expect(font.carta.productes.flatMap(producte => producte.variants)).toHaveLength(564);
  }, 15000);
  it('la forma comuna preserva productes i variants de la carta', () => {
    const carta = llavorCarta();
    const model = modelCartaWorkspace(carta, ESTABLIMENT_EXEMPLE);
    expect(model.items).toHaveLength(carta.productes.length);
    expect(model.items[0].dades).toBe(carta.productes[0]);
    expect(model.items[0].categoryIds).toEqual([carta.productes[0].categoriaId]);
  });

  it('obri el catàleg, conserva TPV/caixa i consulta La Parròquia sense substituir la carta', async () => {
    const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    const original = await magatzem.carrega();
    const App = () => <AppBar magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/bar', { registre, entorn: { ...ENTORN_OBERT, produccio: false,
      sessio: { estat: 'fora', enLinia: true, modeProves: false } } });
    /* R15b · El detall carrega trossos diferits (el lèxic d'al·lèrgens en fa 13,8 KB gzip): en una bateria carregada
       passa del segon per defecte de findBy*. Les mateixes asserts, amb l'espera de la resta del fitxer. */
    expect(await screen.findByRole('heading', { name: 'Catàleg del Bar', level: 1 }, { timeout: 10000 })).toBeTruthy();
    expect(screen.getByTestId('ubicacio').textContent).toBe('/app/bar/cataleg');
    const detail = () => within(document.getElementById('app-grid-main'));
    expect(detail().getByRole('link', { name: 'Obri el TPV' }).getAttribute('href')).toBe('/app/bar/tpv');
    expect(detail().getByRole('link', { name: 'Obri la caixa' }).getAttribute('href')).toBe('/app/bar/caixa');
    fireEvent.click(screen.getAllByRole('button', { name: 'Cafè sol', exact: true }).at(-1));
    expect(await detail().findByRole('heading', { name: 'Cafè sol', level: 1 }, { timeout: 10000 })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Consulta La Parròquia · font històrica' }));
    const bombo = await screen.findAllByRole('button', { name: 'Bombó', exact: true }, { timeout: 10000 });
    fireEvent.click(bombo.at(-1));
    expect(await detail().findByRole('heading', { name: 'Bombó', level: 1 }, { timeout: 10000 })).toBeTruthy();
    expect(detail().getByRole('heading', { name: 'Proposta assistida · Pendent de validació humana' })).toBeTruthy(); // R15b (RV-02): l'etiqueta obligatòria és el títol
    expect(detail().getByText(/Esta vista no ha canviat la carta del dispositiu/)).toBeTruthy();
    expect((await magatzem.carrega()).carta).toEqual(original.carta);
  }, 15000);

  it('an historical publication link resolves the same product without replacing the device menu', async () => {
    const { llavorLaParroquiaR14 } = await import('./llavors/laParroquia.js');
    const source = await llavorLaParroquiaR14();
    const product = source.carta.productes.find(item => item.nom === 'Bombó');
    const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    const original = await magatzem.carrega();
    const App = () => <AppBar magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/bar/cataleg?fitxa=' + encodeURIComponent('historica:' + product.id),
      { registre, entorn: { ...ENTORN_OBERT, produccio: false, sessio: { estat: 'fora', enLinia: true, modeProves: false } } });
    expect(await screen.findByRole('heading', { name: 'Bombó', level: 1 }, { timeout: 10000 })).toBeTruthy();
    expect(within(document.getElementById('app-grid-main')).getByRole('heading', { name: 'Bombó', level: 1 })).toBeTruthy();
    expect((await magatzem.carrega()).carta).toEqual(original.carta);
  }, 15000);

});
