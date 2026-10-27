/* Ordre del Mestre (261026_2126, prompt Tasca 3 i pla 261026_1615 §6) · Les
   icones de la barra d'eines de l'editor (format, encapçalaments i llistes):
   una sola mida de glif, 24px (abans 20), la de les capçaleres de columna,
   dins de la cel·la tàctil de 48px de --sdp-bloc-control. Cap funció es
   perd: els set formats, la tornada, el «Aa» compacte, Borrar i Publicar. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import UniversalToolbar from './UniversalToolbar.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const amplada = (px) => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: px } }]); }
  disconnect() {}
});
const FORMATS = ['Alternar subtítol (H3)', 'Alternar títol (H2)', 'Negreta', 'Cursiva', 'Ratllat', 'Llista', 'Llista numerada'];
const ACCIONS = {
  toggleSubheading: () => {}, toggleHeading: () => {}, toggleBold: () => {}, toggleItalic: () => {},
  toggleStrike: () => {}, toggleList: () => {}, toggleOrderedList: () => {}
};

test('§6 · cada glif de la barra fa 24px i viu en un botó .sdp-bloc-icon; els set formats hi són', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} onDelete={() => {}} />);
  const barra = within(container).getByRole('group', { name: 'Eines de l\'editor' });
  for (const nom of FORMATS) {
    const boto = within(barra).getByRole('button', { name: nom });
    expect(boto.className).toBe('sdp-bloc-icon');
    expect([boto.querySelector('svg').getAttribute('width'), boto.querySelector('svg').getAttribute('height')], nom).toEqual(['24', '24']);
  }
  expect(new Set([...barra.querySelectorAll('svg')].map((svg) => svg.getAttribute('width')))).toEqual(new Set(['24']));
  expect(within(barra).getByRole('button', { name: 'Tornar a la llista' }).querySelector('svg').getAttribute('width')).toBe('24');
  expect(within(barra).getByRole('button', { name: 'Borrar' })).toBeTruthy();
  expect(within(barra).getByRole('button', { name: 'Publicar' })).toBeTruthy();
});

test('§6 · compacta, el «Aa» també és una cel·la .sdp-bloc-icon i els formats continuen dins', () => {
  amplada(320);
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} />);
  const aa = within(container).getByRole('button', { name: 'Format del text' });
  expect(aa.className).toBe('sdp-bloc-icon');
  const opcions = [...container.querySelectorAll('[id]')].find((el) => el.id === aa.getAttribute('aria-controls'));
  expect(opcions.querySelectorAll('button.sdp-bloc-icon')).toHaveLength(FORMATS.length);
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
