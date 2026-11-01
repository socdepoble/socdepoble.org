/* IDEA-59 / P1-72 (ordre del Mestre, 261101 02:03 i 02:55, punt 4) · La barra
   d'eines de l'editor, més compacta i amb iconografia pròpia:
     · un botó discret «⋯» («Més eines») mostra o plega la segona fila, just
       a sota de la primera (aria-expanded i aria-controls);
     · les eines principals que no caben a la primera fila hi passen, en el
       seu ordre, i tornen quan hi ha lloc (es mesura la fila: ací, amb les
       amplàries simulades, perquè jsdom no té maquetació);
     · en compacte (< 500 px), «⋯» ocupa el lloc i el nom de l'«Aa» i obri
       totes les eines; Escape el tanca i torna el focus;
     · els glifs de format són els propis (richText/iconesBarra.jsx), de 24 px
       i de currentColor (la barra els vist en clar i en fosc amb els tokens). */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import UniversalToolbar from './UniversalToolbar.jsx';

const ACCIONS = {
  toggleSubheading: () => {}, toggleH4: () => {}, toggleH5: () => {}, toggleH6: () => {}, toggleHeading: () => {},
  toggleBold: () => {}, toggleItalic: () => {}, toggleStrike: () => {}, toggleList: () => {}, toggleOrderedList: () => {},
  toggleCitacio: () => {}, insertDivisor: () => {}
};

let observadors = [];
const amplada = (px) => {
  observadors = [];
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; observadors.push(this); }
    observe() { this.callback([{ contentRect: { width: px } }]); }
    disconnect() {}
  });
};
const redimensiona = (px) => act(() => { for (const o of observadors) o.callback([{ contentRect: { width: px } }]); });

const restauracions = [];
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  while (restauracions.length) restauracions.pop()();
});

/* Una maquetació de mentida: l'amplada útil de la fila i la de cada peça. */
function maquetacio({ fila, publicacio = 200 }) {
  const estat = { fila };
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() { return this.classList.contains('sdp-editor-tools__formats') ? estat.fila : 0; }
  });
  const rectAbans = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function rect() {
    let width = 0;
    if (this.dataset.eina === 'encapcalament') width = 60;
    else if (this.dataset.eina) width = 48;
    else if (this.classList.contains('sdp-editor-tools__amplia')) width = 48;
    else if (this.classList.contains('sdp-editor-tools__group--publicacio')) width = publicacio;
    return { width, height: width ? 48 : 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON() {} };
  };
  restauracions.push(() => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    HTMLElement.prototype.getBoundingClientRect = rectAbans;
  });
  return estat;
}

const barra = () => screen.getByRole('group', { name: 'Eines de l\'editor' });
const primera = () => barra().querySelector(':scope > .sdp-editor-tools__formats');
const segona = () => barra().querySelector(':scope > .sdp-editor-tools__segona-fila');
const einesDe = (fila) => [...fila.querySelectorAll('[data-eina]')].map((el) => el.dataset.eina);

test('ampla: «⋯» («Més eines») mostra i plega la segona fila, just a sota de la primera, amb aria-expanded i aria-controls', () => {
  amplada(900);
  render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  const mes = within(barra()).getByRole('button', { name: 'Més eines' });
  expect(mes.getAttribute('aria-expanded')).toBe('false');
  expect(mes.getAttribute('aria-controls')).toBe(segona().id);
  expect(primera().nextElementSibling).toBe(segona());
  expect(segona().hidden).toBe(true);
  expect(segona().getAttribute('role')).toBe('group');
  expect(segona().getAttribute('aria-label')).toBe('Més eines');
  fireEvent.click(mes);
  expect(mes.getAttribute('aria-expanded')).toBe('true');
  expect(segona().hidden).toBe(false);
  expect(einesDe(segona())).toEqual(['ratllat', 'citacio', 'divisor']);
  fireEvent.click(mes);
  expect(segona().hidden).toBe(true);
});

/* Gauntlet 261101 · X-C-notes (C-11, patró «disclosure», WCAG 2.4.3) · En
   ample la segona fila és al DOM darrere del grup de publicació: en obrir-la,
   el focus passa a la primera eina activa que mostra (abans el Tab des de
   «⋯» passava per Proposa Card, Borrar i Publicar). Plegar-la no el mou. En
   compacte les opcions ja són just darrere de «⋯» i el focus no es mou. */
test('ampla: en obrir «⋯», el focus passa a la primera eina de la segona fila; en compacte, no', () => {
  amplada(900);
  const { unmount } = render(<UniversalToolbar formatActions={{ ...ACCIONS, toggleStrike: undefined }} onPublish={() => {}} onDelete={() => {}} />);
  const mes = within(barra()).getByRole('button', { name: 'Més eines' });
  mes.focus();
  fireEvent.click(mes);
  // Ratllat ix desactivat (sense acció): la primera activa és la Citació.
  expect(document.activeElement).toBe(within(segona()).getByRole('button', { name: 'Citació' }));
  mes.focus();
  fireEvent.click(mes);
  expect(segona().hidden).toBe(true);
  expect(document.activeElement).toBe(mes);
  unmount();
  amplada(320);
  render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  const format = within(barra()).getByRole('button', { name: 'Format del text' });
  format.focus();
  fireEvent.click(format);
  expect(document.activeElement).toBe(format);
});

test('ampla: la primera fila porta l’encapçalament, la negreta, la cursiva i les llistes, i «⋯» darrere', () => {
  amplada(900);
  render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  const grup = within(barra()).getByRole('group', { name: 'Opcions de format del text' });
  expect(einesDe(grup)).toEqual(['encapcalament', 'negreta', 'cursiva', 'llista', 'llistaNumerada']);
  expect(grup.nextElementSibling.getAttribute('aria-label')).toBe('Més eines');
});

test('les eines principals que no caben passen a la segona fila (en ordre) i tornen quan hi ha lloc', () => {
  // ⋯ (48) + publicació (200): amb 420 px queden 172 px: l'encapçalament (60) i dues cel·les (48 + 48).
  const lloc = maquetacio({ fila: 420 });
  amplada(600);
  render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  const grup = within(barra()).getByRole('group', { name: 'Opcions de format del text' });
  expect(einesDe(grup)).toEqual(['encapcalament', 'negreta', 'cursiva']);
  fireEvent.click(within(barra()).getByRole('button', { name: 'Més eines' }));
  expect(einesDe(segona())).toEqual(['llista', 'llistaNumerada', 'ratllat', 'citacio', 'divisor']);
  expect(within(segona()).getByRole('button', { name: 'Llista' })).toBeTruthy();
  // Amb 500 px (252 px útils) hi caben les cinc.
  lloc.fila = 500;
  redimensiona(700);
  expect(einesDe(grup)).toEqual(['encapcalament', 'negreta', 'cursiva', 'llista', 'llistaNumerada']);
  expect(einesDe(segona())).toEqual(['ratllat', 'citacio', 'divisor']);
  // Molt estreta (però encara ampla): cap principal a la fila, totes a la segona, i el grup buit s'amaga.
  lloc.fila = 260;
  redimensiona(650);
  expect(grup.hidden).toBe(true);
  expect(einesDe(segona())).toEqual(['encapcalament', 'negreta', 'cursiva', 'llista', 'llistaNumerada', 'ratllat', 'citacio', 'divisor']);
});

test('compacta: «⋯» porta el nom de l’«Aa» («Format del text») i obri totes les eines; Escape tanca i torna el focus a «⋯»', () => {
  amplada(320);
  render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  const mes = within(barra()).getByRole('button', { name: 'Format del text' });
  expect(segona()).toBeNull();
  const opcions = document.getElementById(mes.getAttribute('aria-controls'));
  expect(opcions.hidden).toBe(true);
  fireEvent.click(mes);
  expect(opcions.hidden).toBe(false);
  expect(einesDe(opcions)).toEqual(['encapcalament', 'negreta', 'cursiva', 'llista', 'llistaNumerada', 'ratllat', 'citacio', 'divisor']);
  within(opcions).getByRole('button', { name: 'Negreta' }).focus();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(opcions.hidden).toBe(true);
  expect(document.activeElement).toBe(mes);
});

test('iconografia pròpia: cada glif de format és un SVG de 24 px de la barra (no de lucide), de traç currentColor, sense cap color propi', () => {
  amplada(900);
  render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} />);
  fireEvent.click(within(barra()).getByRole('button', { name: 'Més eines' }));
  for (const nom of ['Encapçalament (H): Paràgraf', 'Negreta', 'Cursiva', 'Llista', 'Llista numerada', 'Més eines', 'Ratllat', 'Citació', 'Divisor']) {
    const svg = within(barra()).getByRole('button', { name: nom }).querySelector('svg');
    /* Gauntlet 261101 · X-C-notes (C-04) · El glif propi es marca amb
       data-icona, sense cap classe sense regla CSS. */
    expect(svg.hasAttribute('data-icona'), nom).toBe(true);
    expect(svg.getAttribute('class'), nom).toBeNull();
    expect(svg.classList.contains('lucide'), nom).toBe(false);
    expect([svg.getAttribute('width'), svg.getAttribute('height'), svg.getAttribute('viewBox')], nom).toEqual(['24', '24', '0 0 24 24']);
    expect(svg.getAttribute('stroke'), nom).toBe('currentColor');
    expect(svg.getAttribute('aria-hidden'), nom).toBe('true');
    const colors = [...svg.querySelectorAll('[fill], [stroke]')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]).filter(Boolean);
    expect(colors.every((c) => c === 'currentColor' || c === 'none'), nom).toBe(true);
  }
});

test('el CSS: la segona fila, el desplegable i les opcions, només amb tokens; cada opció és una diana de 48 px', () => {
  const net = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const regla = (selector) => {
    const i = net.indexOf(`${selector} {`);
    return i < 0 ? null : net.slice(i, net.indexOf('}', i));
  };
  expect(regla('.sdp-editor-tools__segona-fila')).toMatch(/padding: var\(--sdp-space-1\) var\(--sdp-space-2\)/);
  expect(regla('.sdp-editor-tools__segona-fila[hidden]')).toContain('display: none');
  expect(regla('.sdp-editor-tools__menu')).toContain('box-shadow: var(--sdp-ombra-flotant)');
  expect(regla('.sdp-editor-tools__opcio')).toContain('min-height: var(--sdp-bloc-control)');
  for (const selector of ['.sdp-editor-tools__segona-fila', '.sdp-editor-tools__menu', '.sdp-editor-tools__opcio']) {
    expect(regla(selector), selector).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  }
});
