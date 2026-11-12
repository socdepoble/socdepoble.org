import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import CatalegWorkspace from './CatalegWorkspace.jsx';
const ui = vi.hoisted(() => ({ language: 'ca' }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(), useUIActionsOpcional: () => ui }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }); vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); ui.language = 'ca'; });
const model = { status: 'ready', canAutoSelect: () => false, categories: [{ id: 'a', label: 'Carpeta A' }],
  items: [{ id: '1', title: 'Nom literal', categoryIds: ['a'], glyph: '🌿' }] };
function Path() { return <output data-testid="path">{useLocation().pathname}</output>; }
function mount() { return render(<MemoryRouter rutaInicial="/page/herbari"><CatalegWorkspace id="prova-cataleg" ruta="/page/herbari" model={model}
  renderDetail={({ item }) => <header className="page-title"><h1>{item ? `Fitxa ${item.title}` : 'Introducció canònica'}</h1></header>} /><Path /></MemoryRouter>); }
test('list/tile state, selection, inline page and return home', () => {
  mount();
  expect(screen.getByRole('button', { name: 'Canònica', exact: true }).getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector('.sdp-gestor-fitxa[data-element="1"]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Gran', exact: true }));
  expect(document.querySelector('article.sp-card')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Gran', exact: true }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Quadrícula 2×2', exact: true }));
  expect(screen.getByRole('button', { name: 'Quadrícula 2×2', exact: true }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Obri fitxa: Nom literal' }));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Fitxa Nom literal');
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Pàgina principal' }));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Introducció canònica');
});
test('destination selection requires explicit navigation', () => {
  mount();
  fireEvent.change(screen.getByLabelText('Pàgina de destinació'), { target: { value: '/page/receptes' } });
  expect(screen.getByTestId('path').textContent).toBe('/page/herbari');
  fireEvent.click(screen.getByRole('button', { name: 'Obri la pàgina' }));
  expect(screen.getByTestId('path').textContent).toBe('/page/receptes');
});
test.each([['es','Cuadrícula 2×2'],['en','2×2 grid'],['eu','2×2 sareta'],['gl','Grade 2×2']])('common controls follow %s; literal items preserved', (language, label) => {
  ui.language = language; mount();
  expect(screen.getByRole('button', { name: label, exact: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Nom literal', exact: true })).toBeTruthy();
});


test('P116 · els tres renderers reals tenen selecció interior sobre el seu mitjà i cap sangrat esquerre', () => {
  const css = postcss.parse(readFileSync('src/css/modules.css', 'utf8'));
  mount();
  for (const nom of ['Canònica', 'Gran', 'Quadrícula 2×2']) {
    fireEvent.click(screen.getByRole('button', { name: nom, exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Nom literal', exact: true }));
    const actiu = document.querySelector('#app-grid-list [aria-current="true"]');
    const fila = actiu.matches('.sdp-gestor-fitxa') ? actiu : actiu.closest('article.sp-card');
    const mitja = fila.querySelector('.sdp-gestor-fitxa__media, .sp-card-media-container, .sp-card-calendar-badge');
    expect(mitja).toBeTruthy();
    let esquerra = null, overlay = null;
    css.walkRules(regla => {
      if (regla.selector.split(',').some(selector => {
        try { return fila.matches(selector.trim()); } catch { return false; }
      })) regla.walkDecls('border-left', decl => { esquerra = decl.value; });
      if (regla.selector.split(',').some(selector => {
        if (!selector.trim().endsWith('::after')) return false;
        try { return mitja.matches(selector.trim().replace(/::after$/, '')); } catch { return false; }
      })) overlay = Object.fromEntries(regla.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
    });
    expect(esquerra).toBe('0');
    expect(overlay.inset).toBe('0');
    expect(overlay['pointer-events']).toBe('none');
    expect(overlay['box-shadow']).toBe('var(--sdp-cataleg-filet)');
  }
  const tokens = postcss.parse(readFileSync('src/css/tokens.css', 'utf8'));
  const definitions = new Map();
  const filets = [];
  tokens.walkDecls(decl => {
    definitions.set(decl.prop, decl.value);
    if (decl.prop === '--sdp-cataleg-filet') filets.push(decl);
  });
  expect(filets).toHaveLength(2);
  expect(filets[0].parent.selector).not.toContain('[data-theme="dark"]');
  expect(filets[1].parent.selector).toContain('[data-theme="dark"]');
  const rgb = token => {
    const hex = definitions.get(token).replace('#', '');
    return [0, 2, 4].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
  };
  const colors = filets.map(decl => {
    expect(decl.value.match(/inset 0 0 0 [34]px/g)).toEqual(['inset 0 0 0 3px', 'inset 0 0 0 4px']);
    expect(decl.value).toContain('92%, transparent');
    return [...decl.value.matchAll(/var\(([^)]+)\)/g)].map(([, token]) => rgb(token));
  });
  expect(colors).toEqual([
    [[0, 0, 0], [255, 255, 255]],
    [[255, 255, 255], [0, 0, 0]]
  ]);
});
