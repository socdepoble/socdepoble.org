/* IDEA-57 L4b (P1-22, «la barra d'accions en valencià»; Gauntlet 261029,
   cicle 1, àrea i18n-a11y) · Els noms accessibles de la barra d'eines de
   l'editor passen pel traductor que rep la barra (`t`): en anglés, cap nom
   en valencià. Sense `t`, la reserva de sempre (les proves en valencià de
   UniversalToolbar.*.test.jsx no canvien). I el Borrar és la peça de sempre,
   `sdp-bloc-action`, sense el modificador mort (IDEA-57 D-L3). */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';
import UniversalToolbar from './UniversalToolbar.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const amplada = (px) => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: px } }]); }
  disconnect() {}
});
const ACCIONS = {
  toggleSubheading: () => {}, toggleHeading: () => {}, toggleBold: () => {}, toggleItalic: () => {},
  toggleStrike: () => {}, toggleList: () => {}, toggleOrderedList: () => {}
};
const VALENCIA = ['Eines de l\'editor', 'Tornar a la llista', 'Format del text', 'Opcions de format del text', 'Alternar subtítol (H3)', 'Alternar títol (H2)'];

test('en anglés: el grup, la tornada, «Aa», les opcions i els encapçalaments', () => {
  amplada(320);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} onDelete={() => {}} t={createTranslator('en')} />);
  const barra = within(container).getByRole('group', { name: 'Editor tools' });
  expect(within(barra).getByRole('button', { name: 'Back to the list' }).getAttribute('title')).toBe('Back to the list');
  fireEvent.click(within(barra).getByRole('button', { name: 'Text format' }));
  const opcions = within(barra).getByRole('group', { name: 'Text format options' });
  expect(within(opcions).getByRole('button', { name: 'Toggle subheading (H3)' })).toBeTruthy();
  expect(within(opcions).getByRole('button', { name: 'Toggle heading (H2)' })).toBeTruthy();
  const noms = [...container.querySelectorAll('[aria-label], [title]')].flatMap((n) => [n.getAttribute('aria-label'), n.getAttribute('title')]);
  expect(noms.filter((nom) => VALENCIA.includes(nom))).toEqual([]);
});

test('sense traductor, els noms de sempre; el Borrar, només sdp-bloc-action', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} onDelete={() => {}} />);
  const barra = within(container).getByRole('group', { name: 'Eines de l\'editor' });
  expect(within(barra).getByRole('button', { name: 'Tornar a la llista' })).toBeTruthy();
  expect(within(barra).getByRole('group', { name: 'Opcions de format del text' })).toBeTruthy();
  expect(within(barra).getByRole('button', { name: 'Borrar' }).className).toBe('sdp-bloc-action');
});
