import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { CopyrightPage, avisHerencia } from './CopyrightPage.jsx';
import { LLICENCIA_PER_DEFECTE, LLICENCIES, MAXIM_COPYRIGHT } from './llicencies.js';

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

/* D15 (ordre del Mestre, 260930) · «Tots els drets reservats» es diu ara
   «Copyright (C)» i el seu text de sèrie és «© autor». */
test('«Copyright (C)» desa «© autor» de sèrie', () => {
  const { ui, onDesa } = pinta({ valor: 'CC BY 4.0' });
  fireEvent.click(ui.getByRole('radio', { name: /Copyright \(C\)/ }));
  expect(ui.getByRole('textbox').value).toBe('© Pep');
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
  expect(vista.ui.getByRole('radio', { name: /Copyright \(C\)/ }).checked).toBe(true);
  expect(vista.ui.getByRole('textbox').value).toBe('© Pep');
  expect(vista.ui.queryByRole('radio', { name: /Mantindre/ })).toBeNull();
});

/* D15 · «© Sóc de Poble» ja no és un valor desconegut (és Copyright amb el
   seu text); «Mantindre» es prova amb un valor que no és de cap opció. */
test('un valor desconegut es pot «Mantindre» intacte', () => {
  const { ui, onDesa } = pinta({ valor: 'Drets de l’Ajuntament' });
  const mantindre = ui.getByRole('radio', { name: /Mantindre els drets actuals/ });
  expect(mantindre.checked).toBe(true);
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenCalledWith('Drets de l’Ajuntament');
});

/* ── D15 (ordre del Mestre, 260930) · CC per defecte i «Copyright (C)» ── */

test('D15 · la CC de sèrie és la primera opció i «Copyright (C)» l’última', () => {
  const { ui } = pinta({ valor: 'CC BY 4.0' });
  const radios = ui.getAllByRole('radio');
  const nom = (radio) => radio.getAttribute('aria-labelledby').split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
  expect(nom(radios[0])).toMatch(new RegExp(`^${LLICENCIA_PER_DEFECTE.replace(/[.]/g, '\\.')}`));
  expect(nom(radios.at(-1))).toMatch(/Copyright \(C\)$/);
  expect(nom(radios.at(-2))).toMatch(/Text lliure personalitzat \(CC0\)$/);
});

test('D15 · sense valor, es preselecciona la Creative Commons de sèrie', () => {
  const { ui } = pinta({ valor: '' });
  expect(ui.getByRole('radio', { name: /^CC BY-NC-SA 4\.0/ }).checked).toBe(true);
  expect(ui.queryByRole('textbox')).toBeNull();
});

test('D15 · «Copyright (C)» porta un camp de text de 256 amb comptador i desa el text amb «©»', () => {
  const { container, ui, onDesa } = pinta({ valor: 'CC BY 4.0' });
  fireEvent.click(ui.getByRole('radio', { name: /Copyright \(C\)/ }));
  const camp = ui.getByRole('textbox');
  expect(camp.maxLength).toBe(MAXIM_COPYRIGHT);
  expect(container.querySelector('.sdp-drets__comptador').textContent).toBe('5 / 256');
  fireEvent.change(camp, { target: { value: 'Pepa Soler i fills' } });
  // El comptador conta el total que es desarà: «© » s'hi afig sol.
  expect(ui.getByText('20 / 256')).toBeTruthy();
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenLastCalledWith('© Pepa Soler i fills');
});

test('D15 · «Copyright (C)» no passa mai de 256 caràcters en total', () => {
  const { ui, onDesa } = pinta({ valor: 'CC BY 4.0' });
  fireEvent.click(ui.getByRole('radio', { name: /Copyright \(C\)/ }));
  fireEvent.change(ui.getByRole('textbox'), { target: { value: 'x'.repeat(300) } });
  // F4 (revisió adversarial T1–T4, 260930) · Abans esta línia esperava 256 al
  // camp, i es desaven només «© » + 254: fixava el tall silenciós. Ara el camp
  // es queda en 254 (sense «©», la marca n'ocupa 2) i el desat és exactament
  // «© » + el que es veu. L'aserció és més forta, no més fluixa.
  expect(ui.getByRole('textbox').value).toHaveLength(254);
  expect(ui.getByText('256 / 256')).toBeTruthy();
  fireEvent.click(desar(ui));
  const [desat] = onDesa.mock.lastCall;
  expect(desat).toHaveLength(256);
  expect(desat.startsWith('©')).toBe(true);
  expect(desat).toBe(`© ${ui.getByRole('textbox').value}`);
});

/* F4 (revisió adversarial T1–T4, 260930) · El camp mai mostra més del que es
   desa, i es conta i es talla per punts de codi (el CHECK és char_length). */
const SURROGATE_ORFE = /[\uD800-\uDFFF]/u;

test('F4 · 256 caràcters sense «©»: el camp no admet més del que es desa', () => {
  const { ui, onDesa } = pinta({ valor: 'CC BY 4.0' });
  fireEvent.click(ui.getByRole('radio', { name: /Copyright \(C\)/ }));
  const camp = ui.getByRole('textbox');
  fireEvent.change(camp, { target: { value: 'x'.repeat(256) } });
  expect(camp.maxLength).toBe(MAXIM_COPYRIGHT - 2);
  expect(camp.value).toBe('x'.repeat(254));
  expect(ui.getByText('256 / 256')).toBeTruthy();
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenLastCalledWith(`© ${'x'.repeat(254)}`);
  // Amb la «©» al davant, el camp torna a admetre 256.
  fireEvent.change(camp, { target: { value: `© ${'x'.repeat(300)}` } });
  expect(camp.maxLength).toBe(MAXIM_COPYRIGHT);
  expect(camp.value).toBe(`© ${'x'.repeat(254)}`);
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenLastCalledWith(camp.value);
});

test('F4 · llevar la «©» d’un text ple el talla al camp mateix; l’espai del davant no ocupa lloc', () => {
  let vista = pinta({ valor: `©${'y'.repeat(255)}` });
  let camp = vista.ui.getByRole('textbox');
  expect(camp.maxLength).toBe(MAXIM_COPYRIGHT);
  fireEvent.change(camp, { target: { value: 'y'.repeat(255) } });
  expect(camp.maxLength).toBe(MAXIM_COPYRIGHT - 2);
  expect(camp.value).toBe('y'.repeat(254));
  fireEvent.click(desar(vista.ui));
  expect(vista.onDesa).toHaveBeenLastCalledWith(`© ${'y'.repeat(254)}`);
  cleanup();
  // «© yyy…» sense la «©» deixa « yyy…»: l'espai no es desa i no resta cap lletra.
  vista = pinta({ valor: `© ${'y'.repeat(254)}` });
  camp = vista.ui.getByRole('textbox');
  fireEvent.change(camp, { target: { value: ` ${'y'.repeat(254)}` } });
  expect(camp.value).toBe(` ${'y'.repeat(254)}`);
  expect(vista.ui.getByText('256 / 256')).toBeTruthy();
  fireEvent.click(desar(vista.ui));
  expect(vista.onDesa).toHaveBeenLastCalledWith(`© ${'y'.repeat(254)}`);
});

test('F4 · un emoji a la frontera del camp no queda partit (ni al camp ni al desat)', () => {
  const { ui, onDesa } = pinta({ valor: 'CC BY 4.0' });
  fireEvent.click(ui.getByRole('radio', { name: /Copyright \(C\)/ }));
  const camp = ui.getByRole('textbox');
  fireEvent.change(camp, { target: { value: `${'a'.repeat(253)}😀😀` } });
  expect(camp.value).toBe(`${'a'.repeat(253)}😀`);
  expect(camp.value).not.toMatch(SURROGATE_ORFE);
  // 253 + 1 emoji + «© » = 256 caràcters de veres.
  expect(ui.getByText('256 / 256')).toBeTruthy();
  fireEvent.click(desar(ui));
  const [desat] = onDesa.mock.lastCall;
  expect(desat).toBe(`© ${'a'.repeat(253)}😀`);
  expect(desat).not.toMatch(SURROGATE_ORFE);
});

test('F4 · un esborrany de «Copyright (C)» massa llarg es recupera tallat al que es desarà', () => {
  const { ui, onDesa } = pinta({ valor: 'CC BY 4.0', esborrany: { valor: 'CC BY 4.0', tria: 'reservats', text: 'x'.repeat(256) } });
  expect(ui.getByRole('radio', { name: /Copyright \(C\)/ }).checked).toBe(true);
  expect(ui.getByRole('textbox').value).toBe('x'.repeat(254));
  fireEvent.click(desar(ui));
  expect(onDesa).toHaveBeenLastCalledWith(`© ${'x'.repeat(254)}`);
});

test('D15 · «Copyright (C)» amb el text buit (o només «©») no es pot desar', () => {
  const { ui, onDesa } = pinta({ valor: 'CC BY 4.0' });
  fireEvent.click(ui.getByRole('radio', { name: /Copyright \(C\)/ }));
  for (const buit of ['', '   ', '©', '© ']) {
    fireEvent.change(ui.getByRole('textbox'), { target: { value: buit } });
    expect(desar(ui).disabled, JSON.stringify(buit)).toBe(true);
    fireEvent.click(desar(ui));
  }
  expect(onDesa).not.toHaveBeenCalled();
  fireEvent.change(ui.getByRole('textbox'), { target: { value: '© Pepa' } });
  expect(desar(ui).disabled).toBe(false);
});

test('D15 · una nota vella «© Sóc de Poble» preselecciona «Copyright (C)» amb el seu text i es conserva igual', () => {
  const { ui, onDesa } = pinta({ valor: '© Sóc de Poble' });
  expect(ui.getByRole('radio', { name: /Copyright \(C\)/ }).checked).toBe(true);
  expect(ui.queryByRole('radio', { name: /Mantindre/ })).toBeNull();
  expect(ui.getByRole('textbox').value).toBe('© Sóc de Poble');
  fireEvent.click(desar(ui));
  // Res de retroactiu: desar sense tocar res torna el mateix valor.
  expect(onDesa).toHaveBeenCalledWith('© Sóc de Poble');
});

test('D15 · el text de «Copyright (C)» i el text lliure CC0 són independents i van a l’esborrany', () => {
  const onEsborrany = vi.fn();
  let vista = pinta({ valor: 'CC BY 4.0', onEsborrany });
  fireEvent.click(vista.ui.getByRole('radio', { name: /Copyright \(C\)/ }));
  expect(onEsborrany).toHaveBeenLastCalledWith({ valor: 'CC BY 4.0', tria: 'reservats', text: '© Pep' });
  fireEvent.change(vista.ui.getByRole('textbox'), { target: { value: '© Pepa Soler' } });
  expect(onEsborrany).toHaveBeenLastCalledWith({ valor: 'CC BY 4.0', tria: 'reservats', text: '© Pepa Soler' });
  fireEvent.click(vista.ui.getByRole('radio', { name: /Text lliure personalitzat/ }));
  expect(vista.ui.getByRole('textbox').value).toBe('');
  fireEvent.click(vista.ui.getByRole('radio', { name: /Copyright \(C\)/ }));
  expect(vista.ui.getByRole('textbox').value).toBe('© Pepa Soler');
  cleanup();
  vista = pinta({ valor: 'CC BY 4.0', esborrany: onEsborrany.mock.lastCall[0] });
  expect(vista.ui.getByRole('radio', { name: /Copyright \(C\)/ }).checked).toBe(true);
  expect(vista.ui.getByRole('textbox').value).toBe('© Pepa Soler');
  expect(vista.ui.getByRole('status').textContent).toContain('sense desar');
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
  // D15 · L'avís diu la llicència de sèrie real, no «© Sóc de Poble».
  expect(vista.ui.getByRole('status').textContent).toContain(`naixen amb «${LLICENCIA_PER_DEFECTE}»`);
  expect(vista.ui.getByRole('status').textContent).not.toContain('© Sóc de Poble');
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
