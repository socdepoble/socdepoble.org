/* P1-59 (a) (Llibre Mestre, Fita 23; guàrdia nocturna 261030, Fase 3) · El
   text fantasma del cos (placeholderCos.js) amb un editor TipTap de veres:
   és una decoració (data-placeholder al primer paràgraf) que hi és mentre el
   cos és buit i editable, desapareix en escriure i torna en buidar-lo, i
   mai no entra al document ni al que es desa (getHTML). */
import { afterEach, describe, expect, test } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { PlaceholderCos, esCosBuit } from './placeholderCos.js';
import { extensionsRiques } from './index.js';

const TEXT = 'Este és el teu perfil personal. Crea l’empresa amb NOVA ORG.';
const editors = [];
function editor({ text = TEXT, content = '', editable = true } = {}) {
  const e = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, PlaceholderCos.configure({ text })],
    content,
    editable
  });
  editors.push(e);
  return e;
}
const fantasma = (e) => e.view.dom.querySelector('p[data-placeholder]');
afterEach(() => { while (editors.length) editors.pop().destroy(); });

describe('PlaceholderCos', () => {
  test('cos buit i editable: el primer paràgraf porta el text a data-placeholder', () => {
    const e = editor();
    expect(fantasma(e)?.getAttribute('data-placeholder')).toBe(TEXT);
    expect(e.view.dom.querySelectorAll('[data-placeholder]')).toHaveLength(1);
  });

  test('desapareix en escriure i torna en buidar el cos; mai no és al document ni al desat', () => {
    const e = editor();
    e.commands.insertContent('Hola');
    expect(fantasma(e)).toBeNull();
    expect(e.getHTML()).toBe('<p>Hola</p>');
    e.commands.clearContent(true);
    expect(fantasma(e)?.getAttribute('data-placeholder')).toBe(TEXT);
    expect(e.getHTML()).not.toContain('data-placeholder');
    expect(JSON.stringify(e.getJSON())).not.toContain(TEXT);
  });

  test('un cos amb contingut, una llista o un títol buits, o dos paràgrafs: cap fantasma', () => {
    for (const content of ['<p>Text</p>', '<ul><li><p></p></li></ul>', '<h2></h2>', '<p></p><p></p>']) {
      expect(fantasma(editor({ content })), content).toBeNull();
    }
  });

  test('en lectura (no editable), res; en tornar-lo editable, el fantasma', () => {
    const e = editor({ editable: false });
    expect(fantasma(e)).toBeNull();
    e.setEditable(true);
    expect(fantasma(e)?.getAttribute('data-placeholder')).toBe(TEXT);
  });

  test('sense text (o només espais), cap plugin ni atribut', () => {
    for (const text of ['', '   ', null]) expect(fantasma(editor({ text })), String(text)).toBeNull();
  });
});

describe('esCosBuit', () => {
  test('només un paràgraf sense contingut és buit', () => {
    expect(esCosBuit(editor().state.doc)).toBe(true);
    expect(esCosBuit(editor({ content: '<p>x</p>' }).state.doc)).toBe(false);
    expect(esCosBuit(editor({ content: '<h2></h2>' }).state.doc)).toBe(false);
    expect(esCosBuit(null)).toBe(false);
    expect(esCosBuit(undefined)).toBe(false);
  });
});

describe('extensionsRiques', () => {
  test('amb un text no buit afig l’extensió; sense, les extensions de sempre', () => {
    const noms = (opcions) => extensionsRiques(opcions).map((x) => x.name);
    expect(noms({})).not.toContain('placeholderCos');
    expect(noms({ placeholderCos: '  ' })).not.toContain('placeholderCos');
    expect(noms({ placeholderCos: TEXT })).toEqual([...noms({}), 'placeholderCos']);
    const ext = extensionsRiques({ placeholderCos: TEXT }).find((x) => x.name === 'placeholderCos');
    expect(ext.options.text).toBe(TEXT);
  });
});
