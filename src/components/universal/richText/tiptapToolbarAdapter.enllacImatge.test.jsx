/* B3-2 (Onada R6 · Bloc 3) · El botó «Enllaç de la imatge» de la barra: la
   fila de l'adaptador (enllacImatge → l'ordre enllacaImatge de
   extensions/index.js) i la ranura de UniversalToolbar (setImageLink), amb un
   TipTap de veres. */
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SenseSubratllat } from './extensions/senseSubratllat.js';
import { extensionsRiques } from './extensions/index.js';
import { FORMATS, SCHEMA_VISIBLE } from './toolbarContract.js';
import { executa, llegeixEstat } from './tiptapToolbarAdapter.js';
import { UniversalRichTextToolbar } from './UniversalRichTextToolbar.jsx';

const editors = [];
afterEach(() => {
  cleanup();
  while (editors.length) editors.pop().destroy();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* jsdom no té maquetació: una barra ampla (900 px), com a UniversalToolbar.segonaFila.test.jsx. */
const ample = () => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: 900 } }]); }
  disconnect() {}
});

function creaEditor() {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit.configure({ underline: false }), SenseSubratllat, ...extensionsRiques()],
    content: '<p>Abans</p><img src="/assets/a.png" alt="u" width="10" height="10">'
  });
  editors.push(editor);
  return editor;
}

/* La posició de la imatge (el segon bloc). */
const posImatge = (editor) => {
  let pos = -1;
  editor.state.doc.descendants((node, p) => { if (pos < 0 && node.type.name === 'image') pos = p; });
  return pos;
};
const hrefDe = (editor) => editor.state.doc.nodeAt(posImatge(editor))?.attrs?.href ?? null;

test('el contracte declara la fila amb valor a la segona fila', () => {
  const fila = SCHEMA_VISIBLE.find((boto) => boto.id === FORMATS.ENLLAC_IMATGE);
  expect(fila).toMatchObject({ id: 'enllacImatge', clauI18n: 'section.notes.format.enllacImatge', fila: 'segona', ambValor: true, slot: { estat: 'isEnllacImatge', accio: 'setImageLink' } });
});

test('només es pot amb una imatge triada; actiu quan ja té enllaç', () => {
  const editor = creaEditor();
  editor.commands.setTextSelection(2);
  expect(llegeixEstat(editor).pot.enllacImatge).toBe(false);
  expect(executa(editor, 'enllacImatge', { href: 'https://zona14.org' })).toBe(false);
  expect(hrefDe(editor)).toBeNull();

  editor.commands.setNodeSelection(posImatge(editor));
  expect(llegeixEstat(editor)).toMatchObject({ pot: { enllacImatge: true }, actiu: { enllacImatge: false } });
});

test('amb una adreça la posa, una insegura o un clic no canvien res, i buida la lleva', () => {
  const editor = creaEditor();
  editor.commands.setNodeSelection(posImatge(editor));
  expect(executa(editor, 'enllacImatge', { href: 'javascript:alert(1)' })).toBe(false);
  expect(executa(editor, 'enllacImatge', { type: 'click' })).toBe(false);
  expect(hrefDe(editor)).toBeNull();

  expect(executa(editor, 'enllacImatge', { href: 'https://zona14.org' })).toBe(true);
  expect(hrefDe(editor)).toBe('https://zona14.org');
  editor.commands.setNodeSelection(posImatge(editor));
  expect(llegeixEstat(editor).actiu.enllacImatge).toBe(true);

  expect(executa(editor, 'enllacImatge', { href: '' })).toBe(true);
  expect(hrefDe(editor)).toBeNull();
});

/* D-B4-2 (Onada R6, Bloc 4) · La ranura també llig, sense cap ordre: el
   diàleg arriba ple amb l'adreça actual. */
test('{ llig } dona l’enllaç de la imatge triada sense cap transacció; sense imatge, null', () => {
  const editor = creaEditor();
  editor.commands.setNodeSelection(posImatge(editor));
  executa(editor, 'enllacImatge', { href: 'https://zona14.org', target: '_blank' });
  editor.commands.setNodeSelection(posImatge(editor));
  const abans = editor.state;
  const llegit = vi.fn();
  expect(executa(editor, 'enllacImatge', { llig: llegit })).toBe(true);
  expect(llegit).toHaveBeenCalledWith({ href: 'https://zona14.org', target: '_blank' });
  expect(editor.state).toBe(abans);
  editor.commands.setTextSelection(2);
  expect(executa(editor, 'enllacImatge', { llig: llegit })).toBe(true);
  expect(llegit).toHaveBeenLastCalledWith(null);
  // Una fila sense `llig` no respon.
  expect(executa(editor, 'negreta', { llig: llegit })).toBe(false);
  expect(llegit).toHaveBeenCalledTimes(2);
});

/* La barra de veres, amb el diàleg de la casa (cap window.prompt ni window.alert). */
function barraAmbImatge({ href = null } = {}) {
  ample();
  const editor = creaEditor();
  editor.commands.setNodeSelection(posImatge(editor));
  if (href) {
    executa(editor, 'enllacImatge', { href });
    editor.commands.setNodeSelection(posImatge(editor));
  }
  const barraDe = () => <UniversalRichTextToolbar state={llegeixEstat(editor)} exec={(id, valor) => executa(editor, id, valor)} onPublish={() => {}} />;
  const vista = render(barraDe());
  const obri = () => {
    const boto = vista.container.querySelector('[data-eina="enllacImatge"]');
    boto.focus();
    fireEvent.click(boto);
    return boto;
  };
  return { editor, vista, obri, repinta: () => vista.rerender(barraDe()) };
}

test('la barra de veres: el botó només hi és amb la imatge triada i obri el diàleg (cap prompt)', () => {
  ample();
  const editor = creaEditor();
  const barraDe = () => <UniversalRichTextToolbar state={llegeixEstat(editor)} exec={(id, valor) => executa(editor, id, valor)} onPublish={() => {}} />;
  editor.commands.setTextSelection(2);
  const vista = render(barraDe());
  expect(vista.container.querySelector('[data-eina="enllacImatge"]')).toBeNull();

  editor.commands.setNodeSelection(posImatge(editor));
  vista.rerender(barraDe());
  const boto = vista.container.querySelector('[data-eina="enllacImatge"]');
  expect(boto.getAttribute('aria-pressed')).toBe('false');
  expect(boto.getAttribute('aria-label')).toBe('Enllaç de la imatge');
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');

  const prompt = vi.spyOn(window, 'prompt');
  const alerta = vi.spyOn(window, 'alert');
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: 'Enllaç de la imatge' });
  const camp = within(dialeg).getByRole('textbox', { name: 'Adreça de l’enllaç' });
  expect(camp.value).toBe('');
  expect(camp.getAttribute('aria-describedby')).toBeTruthy();
  expect(prompt).not.toHaveBeenCalled();
  expect(alerta).not.toHaveBeenCalled();
});

test('arriba ple amb l’adreça actual; desar la canvia, tanca i torna el focus al botó', () => {
  const { editor, obri } = barraAmbImatge({ href: 'https://zona14.org' });
  const boto = obri();
  const dialeg = screen.getByRole('dialog', { name: 'Enllaç de la imatge' });
  const camp = within(dialeg).getByRole('textbox', { name: 'Adreça de l’enllaç' });
  expect(camp.value).toBe('https://zona14.org');
  fireEvent.change(camp, { target: { value: ' /events/aplec-2023 ' } });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar' }));
  expect(hrefDe(editor)).toBe('/events/aplec-2023');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(boto);
});

test('buidar el camp i desar lleva l’enllaç', () => {
  const { editor, obri } = barraAmbImatge({ href: 'https://zona14.org' });
  obri();
  const dialeg = screen.getByRole('dialog', { name: 'Enllaç de la imatge' });
  fireEvent.change(within(dialeg).getByRole('textbox'), { target: { value: '   ' } });
  fireEvent.submit(dialeg.querySelector('form'));
  expect(hrefDe(editor)).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('una adreça insegura es diu dins del diàleg, que es queda obert, i la imatge no canvia', () => {
  const { editor, obri } = barraAmbImatge({ href: 'https://zona14.org' });
  obri();
  const dialeg = screen.getByRole('dialog', { name: 'Enllaç de la imatge' });
  const camp = within(dialeg).getByRole('textbox');
  for (const dolenta of ['javascript:alert(1)', 'https://usuari:clau@exemple.cat', 'data:text/html,<b>x</b>']) {
    fireEvent.change(camp, { target: { value: dolenta } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar' }));
    expect(within(dialeg).getByText('Esta adreça no és segura: la imatge es queda com estava.')).toBeTruthy();
    expect(camp.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Enllaç de la imatge' })).toBe(dialeg);
  }
  expect(hrefDe(editor)).toBe('https://zona14.org');
  // Escriure de nou esborra l'error.
  fireEvent.change(camp, { target: { value: 'https://' } });
  expect(within(dialeg).queryByText('Esta adreça no és segura: la imatge es queda com estava.')).toBeNull();
});

test('Escape (el `cancel` del <dialog>) tanca sense canviar res; es pot tornar a obrir, ple de nou', () => {
  const { editor, obri } = barraAmbImatge({ href: 'https://zona14.org' });
  const boto = obri();
  let dialeg = screen.getByRole('dialog', { name: 'Enllaç de la imatge' });
  fireEvent.change(within(dialeg).getByRole('textbox'), { target: { value: 'https://altra.cat' } });
  act(() => { dialeg.dispatchEvent(new Event('cancel', { cancelable: true })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(hrefDe(editor)).toBe('https://zona14.org');
  expect(document.activeElement).toBe(boto);
  obri();
  dialeg = screen.getByRole('dialog', { name: 'Enllaç de la imatge' });
  expect(within(dialeg).getByRole('textbox').value).toBe('https://zona14.org');
});
