/* Ordre del Mestre (261026_2126, prompt Tasca 3 i pla 261026_1615 §6) · Les
   icones de la barra d'eines de l'editor (format, encapçalaments i llistes):
   una sola mida de glif, 24px (abans 20), la de les capçaleres de columna,
   dins de la cel·la tàctil de 48px de --sdp-bloc-control. Cap funció es
   perd: els set formats, la tornada, el «Aa» compacte, Borrar i Publicar. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import UniversalToolbar from './UniversalToolbar.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const amplada = (px) => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: px } }]); }
  disconnect() {}
});
/* IDEA-59 / P1-72 (ordre del Mestre, 261101, punts 2 i 4) · Els botons solts
   «Alternar subtítol (H3)» i «Alternar títol (H2)» ja no hi són: el
   desplegable d'encapçalaments (un botó de menú que diu el nivell) els
   substituïx. La fila principal porta l'encapçalament, la negreta, la
   cursiva i les dues llistes; el ratllat, la citació i el divisor van a la
   segona fila del botó «⋯» («Més eines»). En compacte, «⋯» ocupa el lloc
   de l'«Aa» (el mateix nom, «Format del text») i obri totes les eines. */
const PRINCIPALS = ['Negreta', 'Cursiva', 'Llista', 'Llista numerada'];
const SECUNDARIES = ['Ratllat', 'Citació', 'Divisor'];
const ACCIONS = {
  toggleSubheading: () => {}, toggleH4: () => {}, toggleH5: () => {}, toggleH6: () => {}, toggleHeading: () => {},
  toggleBold: () => {}, toggleItalic: () => {}, toggleStrike: () => {}, toggleList: () => {}, toggleOrderedList: () => {},
  toggleCitacio: () => {}, insertDivisor: () => {}
};
const midaDelGlif = (boto) => [boto.querySelector('svg').getAttribute('width'), boto.querySelector('svg').getAttribute('height')];

test('§6 · cada glif de la barra fa 24px i viu en un botó .sdp-bloc-icon; les eines de format hi són, a la fila principal o darrere de «⋯»', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} onDelete={() => {}} />);
  const barra = within(container).getByRole('group', { name: 'Eines de l\'editor' });
  const encapcalament = within(barra).getByRole('button', { name: 'Encapçalament (H): Paràgraf' });
  expect(encapcalament.classList.contains('sdp-bloc-icon')).toBe(true);
  expect(midaDelGlif(encapcalament)).toEqual(['24', '24']);
  for (const nom of PRINCIPALS) {
    const boto = within(barra).getByRole('button', { name: nom });
    expect(boto.className).toBe('sdp-bloc-icon');
    expect(midaDelGlif(boto), nom).toEqual(['24', '24']);
  }
  for (const nom of SECUNDARIES) expect(within(barra).queryByRole('button', { name: nom }), nom).toBeNull();
  const mes = within(barra).getByRole('button', { name: 'Més eines' });
  expect(mes.classList.contains('sdp-bloc-icon')).toBe(true);
  fireEvent.click(mes);
  for (const nom of SECUNDARIES) {
    const boto = within(barra).getByRole('button', { name: nom });
    expect(boto.className).toBe('sdp-bloc-icon');
    expect(midaDelGlif(boto), nom).toEqual(['24', '24']);
  }
  expect(new Set([...barra.querySelectorAll('svg')].map((svg) => svg.getAttribute('width')))).toEqual(new Set(['24']));
  expect(within(barra).getByRole('button', { name: 'Tornar a la llista' }).querySelector('svg').getAttribute('width')).toBe('24');
  expect(within(barra).getByRole('button', { name: 'Borrar' })).toBeTruthy();
  expect(within(barra).getByRole('button', { name: 'Publicar' })).toBeTruthy();
});

test('§6 · compacta, «⋯» («Format del text») també és una cel·la .sdp-bloc-icon i totes les eines de format continuen dins', () => {
  amplada(320);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} />);
  const mes = within(container).getByRole('button', { name: 'Format del text' });
  expect(mes.classList.contains('sdp-bloc-icon')).toBe(true);
  const opcions = [...container.querySelectorAll('[id]')].find((el) => el.id === mes.getAttribute('aria-controls'));
  // L'encapçalament i les set eines de format (cap botó solt d'H3 ni d'H2).
  expect(opcions.querySelectorAll('button.sdp-bloc-icon')).toHaveLength(1 + PRINCIPALS.length + SECUNDARIES.length);
});

/* Guarda de regressió: la cel·la i els tokens ja eren així abans de l'ordre
   (passa també sense el canvi del glif). Fixa que els 24px caben en el sòl
   tàctil de 48px i que ningú no l'abaixa.
   Verificació (261027) · Els tokens es lligen amb un analitzador de
   declaracions (el de FilaConversa.test.jsx), no amb el text «nom: valor»:
   eixe text en un fitxer de prova és una declaració més per a
   tooling/gates/tractor-tokens.mjs (T3 · Font única). */
test('§6 · guarda de regressió: la cel·la de .sdp-bloc-icon és el sòl tàctil, --sdp-bloc-control, que no baixa de --sdp-touch (48px)', () => {
  const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const moduls = net('src/css/modules.css');
  expect(moduls).toContain('.sdp-bloc-icon { width: var(--sdp-bloc-control); padding: 0; }');
  expect(moduls).toMatch(/\.sdp-bloc-icon, \.sdp-bloc-action \{[^}]*min-width: var\(--sdp-bloc-control\); min-height: var\(--sdp-bloc-control\);/);
  const tokens = net('src/css/tokens.css');
  const declaracions = (nom) => [...tokens.matchAll(new RegExp(`${nom}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
  expect(declaracions('--sdp-bloc-control')).toEqual(['max(var(--sdp-touch), var(--sdp-touch-comode))']);
  expect(declaracions('--sdp-touch')).toEqual(['48px']);
});
