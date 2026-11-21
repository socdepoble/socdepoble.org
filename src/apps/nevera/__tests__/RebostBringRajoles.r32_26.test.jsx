import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ENTORN_OBERT, muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../../plataforma/registreApps.js';
import AppNevera from '../AppNevera.jsx';
import { creaMagatzemNevera } from '../magatzem.js';
import manifest from '../manifest.js';
import { ARTICLES_BASE } from '../nucli/index.js';
import { pictogramaDe } from '../vistes/vestits.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const magatzems = [];

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  magatzems.splice(0).forEach((m) => m.tanca());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('Onada R32.26 · IDEA-303 · Rebost i Compra com Bring! (àlies /app/rebost, rajoles 3×3 i pictogrames)', () => {
  /* v1.2.17 · Gauntlet R1 (L3-07) · L'estil va acotat al modificador de la compra (estilCompra de
     Compra.jsx): la reixa de sempre (el Bar, Salut i /disseny) continua en 7rem i amb --sdp-accio. */
  test('la reixeta CSS d’articles empra minmax(6rem, 1fr) perquè càpien 3×3 rajoles quadrades en 360 px i marca l’estat binari', () => {
    const css = llig('src/css/diferit-cataleg-colleccio.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const net = css.replace(/\s+/g, ' ');
    expect(net).toContain('.sdp-graella-articles.sdp-graella-articles--compra { grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr)); }');
    expect(net).toContain('.sdp-graella-articles--compra .sdp-graella-articles__element > .sdp-rajola[aria-pressed="false"] {');
    expect(net).toContain('.sdp-graella-articles--compra .sdp-graella-articles__element--en-colleccio > .sdp-rajola .sdp-rajola__media {');
    expect(net).toContain('.sdp-graella-articles--compra .sdp-rajola__titol {');
    /* La base, com a la v1.2.16: cap regla de la compra sense el modificador. */
    expect(net).toMatch(/\.sdp-graella-articles \{ display: grid; grid-template-columns: repeat\(auto-fill, minmax\(7rem, 1fr\)\);/);
    expect(net).toContain('.sdp-graella-articles__element--en-colleccio > .sdp-rajola { border-color: var(--sdp-accio); background: var(--sdp-accio-subtil); }');
    const sensModificador = [...net.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .flatMap(([, selectors, cos]) => selectors.split(',').map((selector) => [selector.trim(), cos]))
      .filter(([selector, cos]) => selector.includes('sdp-graella-articles')
        && (/aria-pressed="false"|\.sdp-rajola__media|\.sdp-rajola__titol/.test(selector) || /var\(--sdp-accent/.test(cos)))
      .map(([selector]) => selector)
      .filter((selector) => !selector.includes('sdp-graella-articles--compra'));
    expect(sensModificador).toEqual([]);
    /* Compra.jsx és l'única que el demana, a les dues columnes. */
    const compra = llig('src/apps/nevera/vistes/Compra.jsx');
    expect(compra.match(/forma="rajoles"\s+estilCompra\b/g)).toHaveLength(2);
  });

  test('tots els articles de base del catàleg tenen pictograma propi diferent de la cistella genèrica i cobreixen múltiples famílies', () => {
    const pictogrames = ARTICLES_BASE.map((article) => pictogramaDe(article));
    expect(pictogrames).toHaveLength(ARTICLES_BASE.length);
    expect(new Set(pictogrames).size).toBeGreaterThanOrEqual(30);
    expect(pictogramaDe({ id: 'tomaques', categoriaId: 'fruita-verdura' })).toBe('🍅');
    expect(pictogramaDe({ id: 'llet', categoriaId: 'llet-formatge' })).toBe('🥛');
    expect(pictogramaDe({ id: 'ous', categoriaId: 'llet-formatge' })).toBe('🥚');
    expect(pictogramaDe({ id: 'pa', categoriaId: 'pa-pastissos' })).toBe('🥖');
    expect(pictogramaDe({ id: 'oli-oliva', categoriaId: 'ingredients-especies' })).toBe('🫒');
  });

  test('a 360 px, /app/rebost redirigix a /app/nevera/rebost i mostra directament la graella de rajoles sense calaix fosc obert', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(360);
    const magatzem = creaMagatzemNevera({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    const App = () => <AppNevera magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });

    muntaPlataforma('/app/rebost', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false }
    });

    await waitFor(() => expect(window.location.pathname).toBe('/app/nevera/rebost'));
    const botoTomaques = (await screen.findAllByRole('button', { name: 'Tomaques', exact: true })).at(-1);
    expect(botoTomaques).toBeTruthy();
    const shell = document.querySelector('.app-grid-shell');
    expect(shell?.dataset.layout).toBe('estret');
    expect(shell?.dataset.panell).toBe('middle');
    expect(document.getElementById('app-grid-sidebar')?.getAttribute('data-obert')).toBe('false');
    expect(document.querySelector('.sdp-cataleg-workspace__rajola')).not.toBeNull();
    expect(botoTomaques.closest('article.sp-card')?.textContent).toContain('🍅');

    /* El botó per obrir el calaix de categories continua accessible a 1 toc si la persona vol filtrar. */
    const obriCategories = screen.getByRole('button', { name: /Categories del rebost/i });
    fireEvent.click(obriCategories);
    expect(shell?.dataset.panell).toBe('left');
  });
});
