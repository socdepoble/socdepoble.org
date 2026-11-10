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
  expect(screen.getByRole('button', { name: 'Llista', exact: true }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Rajola quadrada', exact: true }));
  expect(screen.getByRole('button', { name: 'Rajola quadrada', exact: true }).getAttribute('aria-pressed')).toBe('true');
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
test.each([['es','Baldosa cuadrada'],['en','Square tiles'],['eu','Lauza karratuak'],['gl','Baldosa cadrada']])('common controls follow %s; literal items preserved', (language, label) => {
  ui.language = language; mount();
  expect(screen.getByRole('button', { name: label, exact: true })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Nom literal' })).toBeTruthy();
});
