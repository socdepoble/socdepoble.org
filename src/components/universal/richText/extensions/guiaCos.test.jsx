/* IDEA-59 / P1-72 (ordre del Mestre, 261101 02:03 i 02:55, punt 1) · El
   cartell guia reversible del cos (guiaCos.js), amb TipTap de veres i el hook
   de veres (useUniversalRichText) i la guia de veres del Bloc (GUIA_NOTA):
     · amb el cos a 0 caràcters es veu la plantilla (H3, paràgraf, H4,
       paràgraf, llista amb pics i numerada), muda per al lector de pantalla
       i amb l'aria-placeholder al cos;
     · el focus (clic o teclat) l'amaga; eixir sense escriure la torna;
     · si s'hi escriu UN caràcter, ja no torna, encara que s'esborre tot; la
       memòria és de la nota i sobreviu al remuntatge de l'editor;
     · mai no és contingut: ni getHTML, ni JSON, ni cap desat.
   Les transaccions de focus i de pèrdua de focus són les de TipTap
   (FocusEvents), disparades amb l'esdeveniment DOM sobre el cos. */
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { CLAU_GUIA_COS, GuiaCos, blocsDeGuia, cosEscrit, esCosSenseText, oblidaCossosEscrits, teText, traduixGuia } from './guiaCos.js';
import { extensionsRiques } from './index.js';
import { oblidaLlavorsConsumides, useUniversalRichText } from '../useUniversalRichText.js';
import { GUIA_NOTA, LLAVOR_NOTA, LLAVORS_NOTA } from '../../../../sections/notes/llavorNota.js';
import '../../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../../config/i18n.js';
import CA from '../../../../config/idiomes/ca.js';

const editors = [];
function editor({ content = '', editable = true, guia = GUIA_NOTA } = {}) {
  const e = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, GuiaCos.configure(guia)],
    content,
    editable
  });
  editors.push(e);
  return e;
}
afterEach(() => {
  while (editors.length) editors.pop().destroy();
  cleanup();
  oblidaCossosEscrits();
  oblidaLlavorsConsumides();
});

const guia = (e) => e.view.dom.querySelector('.sdp-guia-cos');
const entra = (e) => act(() => { fireEvent.focus(e.view.dom); });
const ix = (e) => act(() => { fireEvent.blur(e.view.dom); });
/* Gauntlet 261101 · X-C-notes (C-09) · Els textos de GUIA_NOTA són parells
   [clau, reserva]: sense traductor, la reserva en valencià. */
const GUIA_VALENCIANA = traduixGuia(GUIA_NOTA);
const TEXTOS_GUIA = GUIA_VALENCIANA.blocs.flatMap((bloc) => bloc.items || [bloc.text]);

describe('la guia amb el cos buit', () => {
  test('pinta la plantilla de format (H3, paràgraf, H4, paràgraf, llista amb pics i numerada), muda i no editable', () => {
    const e = editor();
    const g = guia(e);
    expect(g).not.toBeNull();
    expect([...g.children].map((fill) => fill.localName)).toEqual(['h3', 'p', 'h4', 'p', 'ul', 'ol']);
    expect(g.querySelector('h3').textContent).toBe('Títol de secció (H3)');
    expect(g.querySelector('h4').textContent).toBe('Subtítol de secció (H4)');
    expect([...g.querySelectorAll('ul > li > p')].map((p) => p.textContent)).toEqual(['Una llista amb pics', 'Un altre punt de la llista']);
    expect([...g.querySelectorAll('ol > li > p')].map((p) => p.textContent)).toEqual(['Una llista numerada', 'El segon pas de la llista']);
    expect(g.getAttribute('aria-hidden')).toBe('true');
    expect(g.getAttribute('contenteditable')).toBe('false');
  });

  test('el cos és un camp de text amb nom, i mentre es veu la guia porta el seu aria-placeholder', () => {
    const e = editor();
    expect(e.view.dom.getAttribute('role')).toBe('textbox');
    expect(e.view.dom.getAttribute('aria-multiline')).toBe('true');
    expect(e.view.dom.getAttribute('aria-label')).toBe('Cos de la nota');
    expect(e.view.dom.getAttribute('aria-placeholder')).toBe(GUIA_VALENCIANA.resum);
    entra(e);
    expect(e.view.dom.hasAttribute('aria-placeholder')).toBe(false);
  });

  test('no és contingut: ni l’HTML, ni el JSON, ni el text del document', () => {
    const e = editor();
    expect(e.getHTML()).toBe('<p></p>');
    const json = JSON.stringify(e.getJSON());
    for (const text of TEXTOS_GUIA) {
      expect(e.getHTML(), text).not.toContain(text);
      expect(json, text).not.toContain(text);
    }
    expect(e.state.doc.textContent).toBe('');
  });

  test('un cos amb text, en lectura o sense blocs: cap guia', () => {
    expect(guia(editor({ content: '<p>Hort de maig</p>' }))).toBeNull();
    expect(guia(editor({ editable: false }))).toBeNull();
    expect(guia(editor({ guia: { blocs: [] } }))).toBeNull();
    expect(guia(editor({ guia: { blocs: [{ tipus: 'script', text: 'x' }, { tipus: 'p', text: '  ' }] } }))).toBeNull();
  });
});

describe('reversible: focus i eixida', () => {
  test('el focus l’amaga; eixir sense escriure res la torna; i així tantes vegades com calga', () => {
    const e = editor();
    for (let volta = 0; volta < 3; volta += 1) {
      entra(e);
      expect(guia(e), `focus ${volta}`).toBeNull();
      ix(e);
      expect(guia(e), `eixida ${volta}`).not.toBeNull();
    }
  });

  test('punxar damunt de la guia porta el focus al cos (sense deixar el cursor en un element no editable)', () => {
    const e = editor();
    const focus = vi.spyOn(e.view, 'focus');
    const continua = fireEvent.mouseDown(guia(e).querySelector('h3'));
    expect(continua).toBe(false);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  test('amb un sol caràcter escrit ja no torna, encara que s’esborre tot', () => {
    const e = editor();
    entra(e);
    act(() => { e.commands.insertContent('a'); });
    ix(e);
    expect(guia(e)).toBeNull();
    entra(e);
    act(() => { e.commands.clearContent(true); });
    expect(e.state.doc.textContent).toBe('');
    ix(e);
    expect(guia(e)).toBeNull();
  });

  test('un espai també és un caràcter', () => {
    const e = editor();
    entra(e);
    act(() => { e.commands.insertContent(' '); });
    act(() => { e.commands.clearContent(true); });
    ix(e);
    expect(guia(e)).toBeNull();
  });

  test('canviar el format del paràgraf buit (sense escriure) no és escriure', () => {
    const e = editor();
    entra(e);
    act(() => { e.chain().focus().toggleHeading({ level: 3 }).run(); });
    act(() => { e.chain().focus().toggleHeading({ level: 3 }).run(); });
    ix(e);
    expect(guia(e)).not.toBeNull();
  });
});

describe('pur', () => {
  test('blocsDeGuia només deixa passar text, títols, paràgrafs i llistes amb algun element', () => {
    expect(blocsDeGuia(GUIA_NOTA.blocs)).toHaveLength(6);
    expect(blocsDeGuia([{ tipus: 'ul', items: [] }, { tipus: 'h1', text: 'H1' }, null, { tipus: 'p', text: 'Sí' }])).toEqual([{ tipus: 'p', text: 'Sí' }]);
    expect(blocsDeGuia('no')).toEqual([]);
  });

  test('teText compta caràcters, no nodes', () => {
    const e = editor({ content: '<ul><li><p></p></li></ul>' });
    expect(teText(e.state.doc)).toBe(false);
    e.commands.setContent('<p>x</p>');
    expect(teText(e.state.doc)).toBe(true);
  });

  test('esCosSenseText: 0 caràcters i cap peça (una imatge o un divisor no són un cos buit)', () => {
    const e = editor();
    for (const [content, buit] of [['<p></p>', true], ['<h3></h3><p></p>', true], ['<ul><li><p></p></li></ul>', true], ['<hr>', false], ['<p>x</p>', false]]) {
      e.commands.setContent(content);
      expect(esCosSenseText(e.state.doc), content).toBe(buit);
    }
  });

  /* Gauntlet 261101 · X-C-notes (C-09) · La guia, el resum i el nom del cos
     passen pel traductor; la reserva de cada parell és la de ca.js. */
  test('traduixGuia: amb el traductor, la llengua de la interfície; sense, la reserva valenciana, idèntica a ca.js', () => {
    const parells = [GUIA_NOTA.etiqueta, GUIA_NOTA.resum, ...GUIA_NOTA.blocs.flatMap((bloc) => bloc.items || [bloc.text])];
    expect(parells).toHaveLength(10);
    for (const [clau, reserva] of parells) expect([clau, CA[clau]]).toEqual([clau, reserva]);
    expect(GUIA_VALENCIANA.etiqueta).toBe('Cos de la nota');
    expect(GUIA_VALENCIANA.blocs[0]).toEqual({ tipus: 'h3', text: 'Títol de secció (H3)' });
    const en = traduixGuia(GUIA_NOTA, createTranslator('en'));
    expect(en.etiqueta).toBe('Note body');
    expect(en.resum).toMatch(/^Write your note here\./);
    expect(en.blocs.map((bloc) => bloc.text ?? bloc.items)).toEqual([
      'Section title (H3)', expect.stringMatching(/^This is the Sóc de Poble formatting template/), 'Section subtitle (H4)',
      'A sample paragraph under an H4 subtitle.', ['A bulleted list', 'Another point on the list'], ['A numbered list', 'The second step on the list']
    ]);
    // Una cadena passa tal qual; sense guia, res.
    expect(traduixGuia({ etiqueta: 'Cos', blocs: [{ tipus: 'p', text: 'Hola' }] }, createTranslator('en'))).toEqual({ etiqueta: 'Cos', resum: undefined, blocs: [{ tipus: 'p', text: 'Hola' }] });
    expect(traduixGuia(null)).toBeNull();
  });

  test('un editor amb la guia traduïda (anglés) en pinta els textos i el nom del cos', () => {
    const e = editor({ guia: traduixGuia(GUIA_NOTA, createTranslator('en')) });
    expect(guia(e).querySelector('h3').textContent).toBe('Section title (H3)');
    expect(e.view.dom.getAttribute('aria-label')).toBe('Note body');
    expect(e.view.dom.getAttribute('aria-placeholder')).toMatch(/^Write your note here\./);
  });

  test('extensionsRiques: amb guiaCos, la guia; sense blocs, les extensions de sempre', () => {
    expect(extensionsRiques({ guiaCos: GUIA_NOTA }).map((x) => x.name)).toContain('guiaCos');
    expect(extensionsRiques().map((x) => x.name)).not.toContain('guiaCos');
    expect(extensionsRiques({ guiaCos: { blocs: [] } }).map((x) => x.name)).not.toContain('guiaCos');
  });
});

/* Amb el hook de veres: la memòria és de la nota (el seu id), com la de la
   llavor consumida, i els desats no porten mai la guia. */
describe('amb useUniversalRichText', () => {
  const EXTENSIONS = extensionsRiques({ guiaCos: GUIA_NOTA });
  const munta = (props) => {
    const desats = [];
    const canvis = [];
    const vista = renderHook((p) => useUniversalRichText({
      seedContent: LLAVORS_NOTA, extensions: EXTENSIONS, debounceMs: 0,
      onSave: (...args) => desats.push(args), onChange: (...args) => canvis.push(args), ...p
    }), { initialProps: props });
    return { ...vista, desats, canvis, editor: () => vista.result.current };
  };

  test('una nota nova (cos buit): guia; entrar i eixir no desa res ni canvia res', () => {
    const nota = munta({ id: 'nova', content: '' });
    expect(guia(nota.editor())).not.toBeNull();
    entra(nota.editor());
    ix(nota.editor());
    expect(guia(nota.editor())).not.toBeNull();
    expect(nota.desats).toEqual([]);
    expect(nota.canvis).toEqual([]);
  });

  test('s’hi escriu una lletra i s’esborra: tornar a muntar la mateixa nota buida no torna la guia; una altra nota, sí', () => {
    const nota = munta({ id: 'escrita', content: '' });
    entra(nota.editor());
    act(() => { nota.editor().commands.insertContent('a'); });
    act(() => { nota.editor().commands.clearContent(true); });
    ix(nota.editor());
    expect(cosEscrit('escrita')).toBe(true);
    for (const [html] of [...nota.desats, ...nota.canvis]) for (const text of TEXTOS_GUIA) expect(html).not.toContain(text);
    nota.unmount();

    const tornada = munta({ id: 'escrita', content: '<p></p>' });
    expect(guia(tornada.editor())).toBeNull();
    const altra = munta({ id: 'altra', content: '' });
    expect(guia(altra.editor())).not.toBeNull();
  });

  test('una nota que es carrega amb text propi ja és escrita: si es buida, la guia no torna', () => {
    const nota = munta({ id: 'amb-text', content: '<p>Llista de la compra</p>' });
    expect(CLAU_GUIA_COS.getState(nota.editor().state)).toMatchObject({ id: 'amb-text', escrit: true });
    entra(nota.editor());
    act(() => { nota.editor().commands.clearContent(true); });
    ix(nota.editor());
    expect(guia(nota.editor())).toBeNull();
  });

  test('una nota vella amb la llavor desada: el primer focus la buida, com sempre, i en eixir sense escriure hi torna la guia', () => {
    const nota = munta({ id: 'vella', content: LLAVOR_NOTA });
    expect(guia(nota.editor())).toBeNull();
    expect(nota.editor().getHTML()).toContain('Títol de secció (H3)');
    entra(nota.editor());
    expect(nota.editor().isEmpty).toBe(true);
    ix(nota.editor());
    expect(guia(nota.editor())).not.toBeNull();
    expect(cosEscrit('vella')).toBe(false);
  });
});
