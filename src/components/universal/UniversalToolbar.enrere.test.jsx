/* P0-24b (T2b, prompt 261102_1532) · Les opcions compactes del botó «⋯»
   («Format del text», per davall de 500 px; useTancaFora) són a la pila de
   l'Arrere d'Android (config/pilaEnrere.js) amb el MATEIX camí que el seu
   Escape (tancaAmpliadaITorna: es pleguen i el focus torna a «⋯»). En ample,
   la segona fila és part de la barra: cap capa. El desplegable
   d'encapçalaments (useMenuEmergent, ja apuntat) damunt de les opcions es
   tanca primer. Patró: PedraSeca/organismes/Dialeg.enrere.test.jsx. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import UniversalToolbar from './UniversalToolbar.jsx';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../config/pilaEnrere.js';

const ACCIONS = {
  toggleSubheading: () => {}, toggleH4: () => {}, toggleH5: () => {}, toggleH6: () => {}, toggleHeading: () => {},
  toggleBold: () => {}, toggleItalic: () => {}, toggleStrike: () => {}, toggleList: () => {}, toggleOrderedList: () => {},
  toggleCitacio: () => {}, insertDivisor: () => {}
};

/* L'amplada mesurada de la barra: 320 px és compacta, 1024 px és ampla. */
const amplada = (px) => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: px } }]); }
  disconnect() {}
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); _reiniciaPilaEnrere(); });

/* Cada Arrere, un segon més tard: fora de la finestra d'absorció. */
let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };

const barra = () => screen.getByRole('group', { name: 'Eines de l\'editor' });
const format = () => within(barra()).getByRole('button', { name: 'Format del text' });
const opcions = () => document.getElementById(format().getAttribute('aria-controls'));

test('compacta: les opcions obertes són a la pila; l’Arrere fa el camí de l’Escape (les plega i torna el focus a «⋯»); plegades o desmuntades, cap capa', () => {
  amplada(320);
  const { unmount } = render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  expect(capesEnrereObertes()).toBe(0);
  fireEvent.click(format());
  expect(opcions().hidden).toBe(false);
  expect(capesEnrereObertes()).toBe(1);
  // L'Escape des d'una opció: plega (consumit) i torna el focus a «⋯».
  const negreta = within(opcions()).getByRole('button', { name: 'Negreta' });
  negreta.focus();
  expect(fireEvent.keyDown(negreta, { key: 'Escape' })).toBe(false);
  expect(opcions().hidden).toBe(true);
  expect(document.activeElement).toBe(format());
  expect(capesEnrereObertes()).toBe(0);
  // L'Arrere: el mateix.
  fireEvent.click(format());
  negreta.focus();
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(opcions().hidden).toBe(true);
  expect(format().getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(format());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  fireEvent.click(format());
  expect(capesEnrereObertes()).toBe(1);
  unmount();
  expect(capesEnrereObertes()).toBe(0);
});

test('ampla: la segona fila de «Més eines» és part de la barra, no cap capa: la pila queda buida i l’Arrere no consumix', () => {
  amplada(1024);
  render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  const mesEines = within(barra()).getByRole('button', { name: 'Més eines' });
  fireEvent.click(mesEines);
  expect(mesEines.getAttribute('aria-expanded')).toBe('true');
  expect(document.getElementById(mesEines.getAttribute('aria-controls')).hidden).toBe(false);
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  expect(mesEines.getAttribute('aria-expanded')).toBe('true');
});

test('dues capes: el desplegable d’encapçalaments damunt de les opcions compactes es tanca primer (focus al seu botó) i el segon Arrere plega les opcions', () => {
  amplada(320);
  render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  fireEvent.click(format());
  const encapcalament = within(opcions()).getByRole('button', { name: 'Encapçalament (H): Paràgraf' });
  fireEvent.click(encapcalament);
  expect(screen.getAllByRole('menuitemradio')).toHaveLength(5);
  expect(capesEnrereObertes()).toBe(2);
  expect(arrere()).toBe(true);
  expect(screen.queryByRole('menuitemradio')).toBeNull();
  expect(document.activeElement).toBe(encapcalament);
  expect(opcions().hidden).toBe(false);
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(opcions().hidden).toBe(true);
  expect(document.activeElement).toBe(format());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});
