import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import UniversalToolbar from './UniversalToolbar.jsx';
import { CopyrightPage } from './drets/CopyrightPage.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
test('compact formatting opens and works inside the closed shadow root used by WordPress', () => {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 375 } }]); }
    disconnect() {}
  });
  const host = document.createElement('div'); document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const container = document.createElement('div'); shadow.append(container);
  const bold = vi.fn(), publish = vi.fn();
  const view = render(<UniversalToolbar onPublish={publish} formatActions={{ toggleBold: bold }} />, { container });
  const ui = within(container);
  const toggle = ui.getByRole('button', { name: 'Format del text' });
  expect(ui.queryByRole('button', { name: 'Negreta' })).toBeNull();
  fireEvent.click(toggle);
  // jsdom caches computed visibility below a closed shadow root. Check the
  // actual hidden attribute and use explicit labels for the controls.
  const options = ui.getByLabelText('Opcions de format del text');
  expect(options.hidden).toBe(false);
  const button = ui.getByLabelText('Negreta');
  fireEvent.pointerDown(button); fireEvent.click(button);
  expect(bold).toHaveBeenCalledOnce();
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  fireEvent.keyDown(button, { key: 'Escape' });
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(ui.getByRole('button', { name: 'Publicar' }));
  expect(publish).toHaveBeenCalledOnce();
  view.unmount(); host.remove();
});
/* T39 (ordre del Mestre, 260928) · El diàleg xicotet és ara la vista a pantalla
   completa (CopyrightPage): el text lliure es tria amb una targeta (ràdio), no
   amb el desplegable. Les asseveracions són les mateixes. */
test('copyright accepts free text, limits it to 256 and saves only on confirmation', () => {
  const save = vi.fn();
  const { container } = render(<CopyrightPage valor="© Inicial" onDesa={save} onTanca={() => {}} />);
  const ui = within(container);
  fireEvent.click(ui.getByRole('radio', { name: /Text lliure personalitzat/ }));
  fireEvent.change(ui.getByRole('textbox'), { target: { value: 'a'.repeat(300) } });
  expect(ui.getByRole('textbox').value).toHaveLength(246);
  expect(ui.getByRole('button', { name: 'Desar autoria' }).disabled).toBe(true);
  fireEvent.click(ui.getByRole('checkbox'));
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(ui.getByRole('button', { name: 'Desar autoria' }));
  expect(save).toHaveBeenCalledWith('a'.repeat(246) + ' · CC0 1.0');
});
