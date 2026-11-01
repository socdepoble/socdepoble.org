/* IDEA-59 / P1-72 (ordre del Mestre, 261101, punt 3: «no s'usa subratllat a
   Sóc de Poble») · Amb el hook de veres (useUniversalRichText) i la barra de
   veres: cap camí deixa un subratllat al cos.
     · l'esquema no porta la marca: un <u> carregat o enganxat entra com a
       text normal, i el que es desa ja no el porta;
     · Cmd/Ctrl+U no fa res (ni ProseMirror ni el navegador);
     · l'ordre «Subratllat» del menú de format del sistema (beforeinput
       'formatUnderline') es consumix;
     · la barra no té cap botó de subratllat; el ratllat (la «S» travessada)
       es conserva, perquè no és el subratllat. */
import { act, cleanup, fireEvent, render, renderHook, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useUniversalRichText } from './useUniversalRichText.js';
import UniversalToolbar from '../UniversalToolbar.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const extensions = [];
const munta = (content = '') => renderHook(() => useUniversalRichText({ id: 'nota-u', content, extensions })).result.current;

test('l’esquema de l’editor no porta cap marca de subratllat; negreta, cursiva i ratllat, sí', () => {
  const editor = munta();
  expect(editor.schema.marks.underline).toBeUndefined();
  expect(Object.keys(editor.schema.marks)).toEqual(expect.arrayContaining(['bold', 'italic', 'strike']));
  expect(editor.extensionManager.extensions.map((e) => e.name)).not.toContain('underline');
});

test('un <u> d’una nota vella entra com a text normal i el que es desa ja no el porta', () => {
  const editor = munta('<p>Hort <u>de maig</u> i <span style="text-decoration: underline">reg</span></p>');
  expect(editor.getHTML()).toBe('<p>Hort de maig i reg</p>');
  act(() => { editor.commands.setContent('<p><u><strong>Fira</strong></u></p>'); });
  expect(editor.getHTML()).toBe('<p><strong>Fira</strong></p>');
});

test('enganxar HTML amb <u> deixa el text, sense subratllat', () => {
  // jsdom no porta ClipboardEvent: el de ProseMirror (pasteHTML) en crea un.
  vi.stubGlobal('ClipboardEvent', class extends Event { constructor(tipus, opcions) { super(tipus, opcions); this.clipboardData = null; } });
  const editor = munta();
  act(() => { editor.commands.focus(); });
  expect(typeof editor.view.pasteHTML).toBe('function');
  act(() => { editor.view.pasteHTML('<p>Bon <u>dia</u></p>'); });
  expect(editor.getHTML()).toBe('<p>Bon dia</p>');
});

/* «Mod» és Cmd al Mac i Ctrl a la resta (la plataforma de jsdom no és Mac). */
test('Cmd/Ctrl+U no fa res: la drecera es consumix', () => {
  const editor = munta('<p>Text</p>');
  act(() => { editor.commands.selectAll(); });
  const abans = editor.getHTML();
  for (const tecla of [{ key: 'u', ctrlKey: true }, { key: 'U', ctrlKey: true, shiftKey: true }]) {
    const continua = fireEvent.keyDown(editor.view.dom, tecla);
    expect(continua, JSON.stringify(tecla)).toBe(false);
  }
  expect(editor.getHTML()).toBe(abans);
});

test('l’ordre «Subratllat» del menú de format del sistema es consumix; un altre beforeinput passa', () => {
  const editor = munta('<p>Text</p>');
  const subratlla = new Event('beforeinput', { bubbles: true, cancelable: true });
  Object.defineProperty(subratlla, 'inputType', { value: 'formatUnderline' });
  editor.view.dom.dispatchEvent(subratlla);
  expect(subratlla.defaultPrevented).toBe(true);
  const escriu = new Event('beforeinput', { bubbles: true, cancelable: true });
  Object.defineProperty(escriu, 'inputType', { value: 'insertText' });
  editor.view.dom.dispatchEvent(escriu);
  expect(escriu.defaultPrevented).toBe(false);
});

test('la barra no té cap botó de subratllat; el ratllat es conserva (a «⋯»)', () => {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 900 } }]); }
    disconnect() {}
  });
  const { container } = render(<UniversalToolbar formatActions={{ toggleBold: () => {}, toggleItalic: () => {}, toggleStrike: () => {} }} />);
  const barra = within(container).getByRole('group', { name: 'Eines de l\'editor' });
  fireEvent.click(within(barra).getByRole('button', { name: 'Més eines' }));
  expect(within(barra).queryByRole('button', { name: /subratll|underline/i })).toBeNull();
  expect(within(barra).getByRole('button', { name: 'Negreta' })).toBeTruthy();
  expect(within(barra).getByRole('button', { name: 'Cursiva' })).toBeTruthy();
  expect(within(barra).getByRole('button', { name: 'Ratllat' })).toBeTruthy();
  expect(barra.querySelector('u')).toBeNull();
});
