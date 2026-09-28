import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { CopyrightPage, avisHerencia } from './CopyrightPage.jsx';
import { LLICENCIES } from './llicencies.js';

/* T39 (ordre del Mestre, 260928) · «Drets d'autor» a pantalla completa. */
afterEach(cleanup);

const pinta = (props = {}) => {
  const onDesa = vi.fn();
  const onTanca = vi.fn();
  const vista = render(<CopyrightPage valor="© Sóc de Poble" autor="Pep" onDesa={onDesa} onTanca={onTanca} {...props} />);
  return { ...vista, ui: within(vista.container), onDesa, onTanca };
};
const desar = (ui) => ui.getByRole('button', { name: 'Desar autoria' });

test('és una secció amb nom (h2, no h1) i el focus va al títol en obrir', () => {
  const { container, ui } = pinta();
  const seccio = container.querySelector('section.sdp-drets');
  const titol = ui.getByRole('heading', { level: 2, name: 'Drets d’autor' });
  expect(seccio.getAttribute('aria-labelledby')).toBe(titol.id);
  expect(document.activeElement).toBe(titol);
  expect(container.querySelector('h1')).toBeNull();
});

test('CC BY-SA desa el codi sense cap casella', () => {
  const { ui, onDesa } = pinta();
  fireEvent.click(ui.getByRole('radio', { name: /CC BY-SA 4\.0/ }));
  expect(ui.queryByRole('checkbox')).toBeNull();
  expect(desar(ui).disabled).toBe(false);
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenCalledWith('CC BY-SA 4.0');
});

test('CC0 demana l’acceptació irrevocable abans de desar', () => {
  const { ui, onDesa } = pinta();
  fireEvent.click(ui.getByRole('radio', { name: /Domini públic/ }));
  expect(ui.getByText(/Esta renúncia és irrevocable en la mesura permesa per la llei/)).toBeTruthy();
  expect(desar(ui).disabled).toBe(true);
  fireEvent.click(desar(ui));
  expect(onDesa).not.toHaveBeenCalled();
  fireEvent.click(ui.getByRole('checkbox', { name: /accepte dedicar esta obra a CC0/ }));
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenCalledWith('CC0 1.0');
});

test('canviar de llicència torna a demanar l’acceptació', () => {
  const { ui } = pinta();
  fireEvent.click(ui.getByRole('radio', { name: /Domini públic/ }));
  fireEvent.click(ui.getByRole('checkbox'));
  expect(desar(ui).disabled).toBe(false);
  fireEvent.click(ui.getByRole('radio', { name: /Text lliure personalitzat/ }));
  fireEvent.change(ui.getByRole('textbox'), { target: { value: 'Fotos del Mas' } });
  expect(ui.getByRole('checkbox').checked).toBe(false);
  expect(desar(ui).disabled).toBe(true);
});

test('el text lliure buit no es pot desar; el comptador suma la marca', () => {
  const { ui, onDesa } = pinta();
  fireEvent.click(ui.getByRole('radio', { name: /Text lliure personalitzat/ }));
  fireEvent.click(ui.getByRole('checkbox'));
  expect(desar(ui).disabled).toBe(true);
  fireEvent.change(ui.getByRole('textbox'), { target: { value: 'Fotos del Mas' } });
  expect(ui.getByText('23 / 256')).toBeTruthy();
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenCalledWith('Fotos del Mas · CC0 1.0');
});

test('«Tots els drets reservats» desa «© autor»', () => {
  const { ui, onDesa } = pinta({ valor: 'CC BY 4.0' });
  fireEvent.click(ui.getByRole('radio', { name: /Tots els drets reservats/ }));
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenCalledWith('© Pep');
});

test('preselecció segons el valor d’ara', () => {
  let vista = pinta({ valor: 'CC BY-NC 4.0' });
  expect(vista.ui.getByRole('radio', { name: /CC BY-NC 4\.0/ }).checked).toBe(true);
  cleanup();
  vista = pinta({ valor: 'Fotos de la Iaia · CC0 1.0' });
  expect(vista.ui.getByRole('radio', { name: /Text lliure personalitzat/ }).checked).toBe(true);
  expect(vista.ui.getByRole('textbox').value).toBe('Fotos de la Iaia');
  cleanup();
  vista = pinta({ valor: '© Pep' });
  expect(vista.ui.getByRole('radio', { name: /Tots els drets reservats/ }).checked).toBe(true);
  expect(vista.ui.queryByRole('radio', { name: /Mantindre/ })).toBeNull();
});

test('un valor desconegut es pot «Mantindre» intacte', () => {
  const { ui, onDesa } = pinta({ valor: '© Sóc de Poble' });
  const mantindre = ui.getByRole('radio', { name: /Mantindre els drets actuals/ });
  expect(mantindre.checked).toBe(true);
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenCalledWith('© Sóc de Poble');
});

test('Escape, «Tornar al document» i «Cancel·lar» tornen sense desar', () => {
  const { container, ui, onDesa, onTanca } = pinta();
  fireEvent.keyDown(container.querySelector('section.sdp-drets'), { key: 'Escape' });
  fireEvent.click(ui.getByRole('button', { name: 'Tornar al document' }));
  fireEvent.click(ui.getByRole('button', { name: 'Cancel·lar' }));
  expect(onTanca.mock.calls.map(([motiu]) => motiu)).toEqual(['esc', 'tornar', 'boto']);
  expect(onDesa).not.toHaveBeenCalled();
});

/* Poliment T39 · T47 (ordre del Mestre, 260928) · L'esborrany de la vista. */
test('informa de cada canvi (onEsborrany) i recupera un esborrany del mateix valor, sense la casella de CC0', () => {
  const onEsborrany = vi.fn();
  let vista = pinta({ onEsborrany });
  fireEvent.click(vista.ui.getByRole('radio', { name: /Text lliure personalitzat/ }));
  fireEvent.change(vista.ui.getByRole('textbox'), { target: { value: 'Fotos del Mas' } });
  expect(onEsborrany).toHaveBeenLastCalledWith({ valor: '© Sóc de Poble', tria: 'lliure', text: 'Fotos del Mas' });
  cleanup();
  vista = pinta({ esborrany: onEsborrany.mock.lastCall[0] });
  expect(vista.ui.getByRole('radio', { name: /Text lliure personalitzat/ }).checked).toBe(true);
  expect(vista.ui.getByRole('textbox').value).toBe('Fotos del Mas');
  expect(vista.ui.getByRole('checkbox').checked).toBe(false);
  expect(desar(vista.ui).disabled).toBe(true);
  expect(vista.ui.getByRole('status').textContent).toContain('sense desar');
});

test('un esborrany d’un altre valor, o d’una opció que ja no hi és, no es recupera', () => {
  let vista = pinta({ valor: 'CC BY 4.0', esborrany: { valor: '© Sóc de Poble', tria: 'lliure', text: 'Vell' } });
  expect(vista.ui.getByRole('radio', { name: /^CC BY 4\.0/ }).checked).toBe(true);
  expect(vista.ui.queryByRole('status')).toBeNull();
  cleanup();
  vista = pinta({ valor: 'CC BY 4.0', esborrany: { valor: 'CC BY 4.0', tria: 'actual', text: '' } });
  expect(vista.ui.getByRole('radio', { name: /^CC BY 4\.0/ }).checked).toBe(true);
  expect(vista.ui.queryByRole('radio', { name: /Mantindre/ })).toBeNull();
});

test('cada llicència porta el seu exemple de poble i els permisos amb text', () => {
  const { container, ui } = pinta();
  expect(container.querySelectorAll('.sdp-drets__exemple')).toHaveLength(LLICENCIES.length);
  const ccBy = ui.getByRole('radio', { name: /^CC BY 4\.0/ });
  const descripcio = ccBy.getAttribute('aria-describedby').split(' ')
    .map((id) => container.querySelector(`[id="${id}"]`).textContent).join(' ');
  expect(descripcio).toContain('Exemple: La història de la font vella');
  expect(descripcio).toContain('Cal citar-te');
  expect(descripcio).toContain('Ús comercial');
});

test('avís d’herència per àmbit: perfil, publicació (amb i sense llicència de sèrie) i neutre', () => {
  let vista = pinta({ ambit: 'perfil' });
  expect(vista.ui.getByRole('status').textContent).toContain('Les teues notes noves ho heretaran');
  cleanup();
  vista = pinta({ ambit: 'publicacio', perDefecte: 'CC BY-SA 4.0' });
  expect(vista.ui.getByRole('status').textContent).toContain('«CC BY-SA 4.0»');
  expect(vista.ui.getByRole('status').textContent).toContain('només canvien per a esta nota');
  cleanup();
  vista = pinta({ ambit: 'publicacio', perDefecte: null });
  expect(vista.ui.getByRole('status').textContent).toContain('encara no hi ha drets de sèrie');
  cleanup();
  vista = pinta({ ambit: 'neutre' });
  expect(vista.ui.queryByRole('status')).toBeNull();
  expect(avisHerencia('neutre')).toBeNull();
});

test('els enllaços externs diuen que s’obrin en una pestanya nova', () => {
  const { ui } = pinta();
  const enllac = ui.getByRole('link', { name: /Consultar les llicències Creative Commons/ });
  expect(enllac.getAttribute('target')).toBe('_blank');
  expect(enllac.getAttribute('rel')).toBe('noreferrer');
  expect(enllac.textContent).toContain('pestanya nova');
});
