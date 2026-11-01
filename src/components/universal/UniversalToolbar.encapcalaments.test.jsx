/* IDEA-59 / P1-72 (ordre del Mestre, 261101 02:03 i 02:55, punt 2) · Els
   botons solts H3 i H2 de la barra d'eines són ara un desplegable
   d'encapçalaments amb l'ordre exacte H3, H4, H5, H6 i, al final, H2:
     · el botó diu el nivell actiu (i «Paràgraf» quan no n'hi ha cap);
     · teclat complet: Enter, fletxa avall o amunt l'obrin; dins, les
       fletxes (en roda), Inici i Fi es mouen, Enter tria i Escape tanca i
       torna el focus al botó;
     · amb l'editor de veres (TipTap, l'adaptador i la barra muda), triar un
       nivell el posa al cos i el botó el diu; triar el mateix nivell el torna
       a paràgraf. Cap H1 al cos. */
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import UniversalToolbar from './UniversalToolbar.jsx';
import { UniversalRichTextToolbar, useTipTapToolbarAdapter } from './richText';
import { useUniversalRichText } from './richText/useUniversalRichText.js';
import { ORDRE_ENCAPCALAMENTS } from './richText/toolbarContract.js';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 900 } }]); }
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const accions = () => ({
  toggleSubheading: vi.fn(), toggleH4: vi.fn(), toggleH5: vi.fn(), toggleH6: vi.fn(), toggleHeading: vi.fn()
});
/* Gauntlet 261101 · X-C-notes (C-10) · El nom conté el text visible: en un
   paràgraf, «Encapçalament (H): Paràgraf». */
const boto = () => screen.getByRole('button', { name: /^Encapçalament/ });
const menu = () => screen.getByRole('menu', { name: 'Encapçalament' });
const opcions = () => within(menu()).getAllByRole('menuitemradio');
const tecla = (element, key) => act(() => { fireEvent.keyDown(element, { key }); });

test('el contracte i la barra porten l’ordre exacte: H3, H4, H5, H6 i H2 al final; cap botó solt d’H3 ni d’H2', () => {
  expect(ORDRE_ENCAPCALAMENTS).toEqual([3, 4, 5, 6, 2]);
  const formatActions = accions();
  render(<UniversalToolbar formatActions={formatActions} />);
  expect(screen.queryByRole('button', { name: 'Alternar subtítol (H3)' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Alternar títol (H2)' })).toBeNull();
  fireEvent.click(boto());
  expect(opcions().map((o) => o.textContent)).toEqual([
    'H3 Títol de secció', 'H4 Subtítol de secció', 'H5 Apartat', 'H6 Subapartat', 'H2 Encapçalament gran'
  ]);
  expect(opcions().some((o) => /H1/.test(o.textContent))).toBe(false);
});

test('el botó diu el nivell actiu: «Paràgraf» (H) sense cap, «H4» amb l’H4; és un botó de menú', () => {
  const formatActions = accions();
  const { rerender } = render(<UniversalToolbar formatActions={formatActions} />);
  expect(boto().getAttribute('aria-label')).toBe('Encapçalament (H): Paràgraf');
  expect(boto().textContent).toBe('H');
  expect(boto().getAttribute('aria-label')).toContain(boto().textContent);
  expect(boto().hasAttribute('data-actiu')).toBe(false);
  expect(boto().getAttribute('aria-haspopup')).toBe('menu');
  expect(boto().getAttribute('aria-expanded')).toBe('false');
  expect(document.getElementById(boto().getAttribute('aria-controls'))).not.toBeNull();
  rerender(<UniversalToolbar formatActions={formatActions} formatState={{ isH4: true }} />);
  expect(boto().getAttribute('aria-label')).toBe('Encapçalament: H4');
  expect(boto().textContent).toBe('H4');
  expect(boto().dataset.actiu).toBe('true');
  rerender(<UniversalToolbar formatActions={formatActions} formatState={{ isHeading: true }} />);
  expect(boto().getAttribute('aria-label')).toBe('Encapçalament: H2');
});

test('ratolí: obrir, triar (crida el nivell i tanca); el nivell actiu és el marcat i el que rep el focus', () => {
  const formatActions = accions();
  render(<UniversalToolbar formatActions={formatActions} formatState={{ isH5: true }} />);
  fireEvent.click(boto());
  expect(boto().getAttribute('aria-expanded')).toBe('true');
  expect(opcions().map((o) => o.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true', 'false', 'false']);
  expect(document.activeElement).toBe(opcions()[2]);
  fireEvent.click(opcions()[1]);
  expect(formatActions.toggleH4).toHaveBeenCalledTimes(1);
  expect(boto().getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('menuitemradio')).toBeNull();
});

test('teclat: fletxa avall obri amb H3; avall, Fi, Inici i amunt (en roda); Enter tria; Escape tanca i torna al botó', () => {
  const formatActions = accions();
  render(<UniversalToolbar formatActions={formatActions} />);
  tecla(boto(), 'ArrowDown');
  expect(document.activeElement).toBe(opcions()[0]);
  tecla(document.activeElement, 'ArrowDown');
  expect(document.activeElement.textContent).toBe('H4 Subtítol de secció');
  tecla(document.activeElement, 'End');
  expect(document.activeElement.textContent).toBe('H2 Encapçalament gran');
  tecla(document.activeElement, 'ArrowDown');
  expect(document.activeElement.textContent).toBe('H3 Títol de secció');
  tecla(document.activeElement, 'ArrowUp');
  expect(document.activeElement.textContent).toBe('H2 Encapçalament gran');
  tecla(document.activeElement, 'Home');
  expect(document.activeElement.textContent).toBe('H3 Títol de secció');
  tecla(document.activeElement, 'Escape');
  expect(screen.queryByRole('menuitemradio')).toBeNull();
  expect(document.activeElement).toBe(boto());
  expect(Object.values(formatActions).every((f) => f.mock.calls.length === 0)).toBe(true);

  tecla(boto(), 'Enter');
  tecla(document.activeElement, 'ArrowDown');
  tecla(document.activeElement, 'ArrowDown');
  tecla(document.activeElement, 'Enter');
  expect(formatActions.toggleH5).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menuitemradio')).toBeNull();

  tecla(boto(), 'ArrowUp');
  expect(document.activeElement.textContent).toBe('H2 Encapçalament gran');
});

test('Escape dins del menú no tanca res més; un clic fora el tanca', () => {
  render(<><UniversalToolbar formatActions={accions()} /><p>fora</p></>);
  fireEvent.click(boto());
  expect(screen.getAllByRole('menuitemradio')).toHaveLength(5);
  fireEvent.pointerDown(screen.getByText('fora'));
  expect(screen.queryByRole('menuitemradio')).toBeNull();
});

test('un nivell sense acció ix desactivat; sense cap acció, el botó també', () => {
  const { rerender } = render(<UniversalToolbar formatActions={{ toggleSubheading: vi.fn(), toggleHeading: vi.fn() }} />);
  fireEvent.click(boto());
  expect(opcions().map((o) => o.disabled)).toEqual([false, true, true, true, false]);
  tecla(document.activeElement, 'ArrowDown');
  expect(document.activeElement.textContent).toBe('H2 Encapçalament gran');
  rerender(<UniversalToolbar formatActions={{}} />);
  expect(boto().disabled).toBe(true);
});

/* La barra de veres sobre un editor de veres: el contracte, l'adaptador de
   TipTap i la barra muda. */
function BarraIEditor({ content }) {
  const editor = useUniversalRichText({ id: 'doc-enc', content, extensions: [] });
  const { state, exec } = useTipTapToolbarAdapter(editor);
  BarraIEditor.editor = editor;
  return <UniversalRichTextToolbar state={state} exec={exec} />;
}

/* El paràgraf final buit que hi afig TipTap darrere d'un títol (TrailingNode) no compta. */
const cos = (editor) => editor.getHTML().replace(/(?:<p><\/p>)+$/, '');

test('amb l’editor de veres: triar H4 el posa al cos i el botó diu «H4»; tornar a triar-lo el torna a paràgraf; H6 i H2 també', () => {
  render(<BarraIEditor content="<p>Les eres</p>" />);
  const editor = { getHTML: () => cos(BarraIEditor.editor) };
  fireEvent.click(boto());
  fireEvent.click(within(menu()).getByRole('menuitemradio', { name: 'H4 Subtítol de secció' }));
  expect(editor.getHTML()).toBe('<h4>Les eres</h4>');
  expect(boto().getAttribute('aria-label')).toBe('Encapçalament: H4');
  fireEvent.click(boto());
  expect(within(menu()).getByRole('menuitemradio', { name: 'H4 Subtítol de secció' }).getAttribute('aria-checked')).toBe('true');
  fireEvent.click(within(menu()).getByRole('menuitemradio', { name: 'H4 Subtítol de secció' }));
  expect(editor.getHTML()).toBe('<p>Les eres</p>');
  expect(boto().getAttribute('aria-label')).toBe('Encapçalament (H): Paràgraf');
  for (const [nom, html] of [['H6 Subapartat', '<h6>Les eres</h6>'], ['H2 Encapçalament gran', '<h2>Les eres</h2>'], ['H3 Títol de secció', '<h3>Les eres</h3>']]) {
    fireEvent.click(boto());
    fireEvent.click(within(menu()).getByRole('menuitemradio', { name: nom }));
    expect(editor.getHTML(), nom).toBe(html);
  }
});

test('el hook de l’editor no admet H1 al cos: els nivells són del 2 al 6 (l’H1 és el títol del document)', () => {
  const { result } = renderHook(() => useUniversalRichText({ id: 'sense-h1', content: '<p>Títol</p>', extensions: [] }));
  const encapcalament = result.current.extensionManager.extensions.find((e) => e.name === 'heading');
  expect(encapcalament.options.levels).toEqual([2, 3, 4, 5, 6]);
  expect(result.current.can().toggleHeading({ level: 1 })).toBe(false);
});
