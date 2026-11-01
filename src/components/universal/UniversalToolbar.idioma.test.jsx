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
  toggleSubheading: () => {}, toggleH4: () => {}, toggleH5: () => {}, toggleH6: () => {}, toggleHeading: () => {},
  toggleBold: () => {}, toggleItalic: () => {}, toggleStrike: () => {}, toggleList: () => {}, toggleOrderedList: () => {},
  toggleCitacio: () => {}, insertDivisor: () => {}
};
/* Gauntlet 261101 · X-C-notes (C-03) · Els noms valencians de la barra
   d'ara (el desplegable d'encapçalaments, «⋯» i les eines de la segona
   fila): en anglés no n'ha d'eixir cap. */
const VALENCIA = [
  'Eines de l\'editor', 'Tornar a la llista', 'Format del text', 'Opcions de format del text',
  'Encapçalament (H): Paràgraf', 'Encapçalament', 'Més eines', 'Títol de secció', 'Ratllat', 'Citació', 'Divisor'
];
const nomsDe = (arrel) => [...arrel.querySelectorAll('[aria-label], [title]')].flatMap((n) => [n.getAttribute('aria-label'), n.getAttribute('title')]);

/* IDEA-59 / P1-72 (ordre del Mestre, 261101, punt 2) · Els botons solts H3 i
   H2 són ara el desplegable d'encapçalaments: en anglés, el botó, el menú i
   les seues opcions també passen pel traductor (claus section.notes.format.*
   dels cinc diccionaris). */
test('en anglés: el grup, la tornada, «⋯» (Format del text), les opcions i el desplegable d’encapçalaments', () => {
  amplada(320);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} onDelete={() => {}} t={createTranslator('en')} />);
  const barra = within(container).getByRole('group', { name: 'Editor tools' });
  expect(within(barra).getByRole('button', { name: 'Back to the list' }).getAttribute('title')).toBe('Back to the list');
  fireEvent.click(within(barra).getByRole('button', { name: 'Text format' }));
  const opcions = within(barra).getByRole('group', { name: 'Text format options' });
  expect(within(opcions).getByRole('button', { name: 'Bold' })).toBeTruthy();
  for (const nom of ['Strike', 'Quote', 'Divider']) expect(within(opcions).getByRole('button', { name: nom }), nom).toBeTruthy();
  expect(within(opcions).queryByRole('button', { name: 'Toggle subheading (H3)' })).toBeNull();
  expect(within(opcions).queryByRole('button', { name: 'Toggle heading (H2)' })).toBeNull();
  const encapcalament = within(opcions).getByRole('button', { name: 'Heading (H): Paragraph' });
  fireEvent.click(encapcalament);
  const menu = within(barra).getByRole('menu', { name: 'Heading' });
  expect(within(menu).getAllByRole('menuitemradio').map((o) => o.textContent)).toEqual([
    'H3 Section title', 'H4 Section subtitle', 'H5 Section', 'H6 Subsection', 'H2 Large heading'
  ]);
  expect(nomsDe(container).filter((nom) => VALENCIA.includes(nom))).toEqual([]);
});

test('en anglés i en ample: «⋯» és «More tools» i la segona fila porta Strike, Quote i Divider', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} onDelete={() => {}} t={createTranslator('en')} />);
  const barra = within(container).getByRole('group', { name: 'Editor tools' });
  const mes = within(barra).getByRole('button', { name: 'More tools' });
  fireEvent.click(mes);
  const segona = within(barra).getByRole('group', { name: 'More tools' });
  expect(within(segona).getAllByRole('button').map((boto) => boto.getAttribute('aria-label'))).toEqual(['Strike', 'Quote', 'Divider']);
  expect(within(barra).getByRole('button', { name: 'Heading (H): Paragraph' })).toBeTruthy();
  expect(nomsDe(container).filter((nom) => VALENCIA.includes(nom))).toEqual([]);
});

test('sense traductor, els noms de sempre; el Borrar, només sdp-bloc-action', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} onDelete={() => {}} />);
  const barra = within(container).getByRole('group', { name: 'Eines de l\'editor' });
  expect(within(barra).getByRole('button', { name: 'Tornar a la llista' })).toBeTruthy();
  expect(within(barra).getByRole('group', { name: 'Opcions de format del text' })).toBeTruthy();
  expect(within(barra).getByRole('button', { name: 'Borrar' }).className).toBe('sdp-bloc-action');
});

/* Gauntlet 2 · 261101 · Y-Notes (G2-N-08, WCAG 2.5.3) · El nom del
   desplegable d'encapçalaments ix d'una plantilla de cada llengua
   (section.notes.format.nomNivell i nomParagraf): l'ordre i la puntuació són
   seus, i el text visible del botó («H4»; «H» en un paràgraf) hi és sempre. */
const NOMS_DEL_DESPLEGABLE = {
  ca: ['Encapçalament: H4', 'Encapçalament (H): Paràgraf'],
  es: ['Encabezado: H4', 'Encabezado (H): Párrafo'],
  en: ['Heading: H4', 'Heading (H): Paragraph'],
  eu: ['Goiburua: H4', 'Goiburua (H): Paragrafoa'],
  gl: ['Encabezamento: H4', 'Encabezamento (H): Parágrafo']
};

test.each(Object.keys(NOMS_DEL_DESPLEGABLE))('%s: el nom del desplegable d’encapçalaments ve de la plantilla i conté el text visible', (codi) => {
  amplada(900);
  const [ambNivell, enParagraf] = NOMS_DEL_DESPLEGABLE[codi];
  const t = createTranslator(codi);
  const { container, rerender } = render(<UniversalToolbar formatActions={ACCIONS} formatState={{ isH4: true }} t={t} />);
  const boto = () => container.querySelector('.sdp-editor-tools__nivell');
  const visible = () => boto().querySelector('.sdp-editor-tools__nivell-actiu').textContent;
  expect([boto().getAttribute('aria-label'), boto().getAttribute('title')]).toEqual([ambNivell, ambNivell]);
  expect(visible()).toBe('H4');
  expect(boto().getAttribute('aria-label')).toContain(visible());
  rerender(<UniversalToolbar formatActions={ACCIONS} formatState={{}} t={t} />);
  expect(boto().getAttribute('aria-label')).toBe(enParagraf);
  expect(visible()).toBe('H');
  expect(boto().getAttribute('aria-label')).toContain(`(${visible()})`);
});
