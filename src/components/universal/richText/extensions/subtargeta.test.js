/* O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · La primitiva «Subtargeta» a
   l'Editor Universal (subtargeta.js): el node llig i escriu la mateixa
   primitiva que les pàgines, byte a byte i estable davant del sanejador (sense,
   el bucle de sincronia mouria el cursor); l'ordre inserirSubtargeta (la
   barra i l'ordre «/») posa la caixa de mostra al nivell de dalt, amb el títol
   triat; dins de can() no toca res; i les dues tecles pròpies (Retrocés a
   l'inici del títol i Retorn al final) no desfan mai la caixa. */
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, test } from 'vitest';
import { sanitizeHtml } from '../../../../utils/sanitize.js';
import { creaOrdres, extensionsRiques } from './index.js';
import { executa, llegeixEstat } from '../tiptapToolbarAdapter.js';
import { NIVELL_TITOL_SUBTARGETA, NOM_SUBTARGETA, ORDRE_SUBTARGETA, TEXTOS_SUBTARGETA, nivellDeContext, textosDeLOrdre, textosDeMostra } from './subtargeta.js';
import CA from '../../../../config/idiomes/ca.js';

const PRIMITIVA = '<div class="sdp-subtargeta" data-sdp-subtargeta=""><h4>1 · Arquitectura</h4><p>160 h · 8.000 €</p><h5>Fet hui</h5><ul><li><p>Un port neutral.</p></li></ul><p>Un <a target="_blank" rel="noopener noreferrer nofollow" href="/pobles">enllaç</a>.</p></div>';

let editor = null;
function creaEditor(content, opcions = {}) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  editor = new Editor({
    element,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] }, underline: false }), ...extensionsRiques(opcions)],
    content
  });
  return editor;
}
const textDe = (ed) => ed.state.doc.textBetween(ed.state.selection.from, ed.state.selection.to);
const tipusDeDalt = (ed) => { const tipus = []; ed.state.doc.forEach((node) => tipus.push(node.type.name)); return tipus; };
/* La tecla com l'envia el navegador (handleKeyDown de la vista): l'ordre
   keyboardShortcut de TipTap torna a mapar els passos capturats i en perd
   un quan la tecla en fa dos (esborrar i inserir). */
const prem = (tecla) => editor.view.someProp('handleKeyDown', (f) => f(editor.view, new KeyboardEvent('keydown', { key: tecla, bubbles: true, cancelable: true })));

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.replaceChildren();
});

describe('el node: la primitiva de les pàgines, byte a byte', () => {
  test('llig i torna a escriure la primitiva sencera (títol, metadada i cos ric), estable davant del sanejador', () => {
    creaEditor(PRIMITIVA);
    expect(tipusDeDalt(editor)).toEqual([NOM_SUBTARGETA]);
    const html = editor.getHTML();
    expect(html).toBe(PRIMITIVA);
    expect(sanitizeHtml(html)).toBe(html);
  });

  test('el node és a totes les extensions riques, sense cap opció; el primer nivell és sempre un títol', () => {
    expect(extensionsRiques().map((e) => e.name)).toContain(NOM_SUBTARGETA);
    creaEditor('<div class="sdp-subtargeta" data-sdp-subtargeta=""><h3>Títol</h3></div>');
    const caixa = editor.state.doc.firstChild;
    expect([caixa.type.name, caixa.firstChild.type.name, caixa.firstChild.attrs.level]).toEqual([NOM_SUBTARGETA, 'heading', 3]);
    expect(sanitizeHtml(editor.getHTML())).toBe(editor.getHTML());
  });

  test('un div sense la marca no és cap subtargeta (el sanejador i TipTap el lligen com sempre)', () => {
    creaEditor('<div class="sdp-subtargeta"><h4>Títol</h4><p>cos</p></div>');
    expect(tipusDeDalt(editor)).toEqual(['heading', 'paragraph']);
  });
});

describe('l’ordre inserirSubtargeta', () => {
  test('en un paràgraf buit en pren el lloc: títol (H3 en un cos sense encapçalaments), metadada i cos de mostra, amb el títol triat', () => {
    creaEditor('<p>Abans</p><p></p>');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(editor.commands.inserirSubtargeta()).toBe(true);
    expect(tipusDeDalt(editor).slice(0, 2)).toEqual(['paragraph', NOM_SUBTARGETA]);
    expect(editor.getHTML()).toContain(`<div class="sdp-subtargeta" data-sdp-subtargeta=""><h3>${TEXTOS_SUBTARGETA.titol}</h3><p>${TEXTOS_SUBTARGETA.meta}</p><p>${TEXTOS_SUBTARGETA.cos}</p></div>`);
    expect(textDe(editor)).toBe(TEXTOS_SUBTARGETA.titol);
    // La primera tecla substituïx el títol de mostra.
    editor.commands.insertContent('El meu títol');
    expect(editor.state.doc.child(1).firstChild.textContent).toBe('El meu títol');
    expect(sanitizeHtml(editor.getHTML())).toBe(editor.getHTML());
  });

  test('en un paràgraf amb text, darrere d’ell; dins d’una altra subtargeta, darrere de la de dalt (mai una dins d’una altra)', () => {
    creaEditor('<p>Text</p><p>Final</p>');
    editor.commands.setTextSelection(2);
    editor.commands.inserirSubtargeta();
    expect(tipusDeDalt(editor)).toEqual(['paragraph', NOM_SUBTARGETA, 'paragraph']);
    // El cursor és al títol de la nova: una altra va darrere, al primer nivell.
    editor.commands.inserirSubtargeta({ titol: 'Segona' });
    expect(tipusDeDalt(editor)).toEqual(['paragraph', NOM_SUBTARGETA, NOM_SUBTARGETA, 'paragraph']);
    expect(editor.state.doc.child(2).firstChild.textContent).toBe('Segona');
    let niades = 0;
    editor.state.doc.descendants((node, _pos, pare) => { if (node.type.name === NOM_SUBTARGETA && pare.type.name !== 'doc') niades += 1; });
    expect(niades).toBe(0);
  });

  test('els textos: l’argument, després els del magatzem (els traduïts de DocumentEditor) i, per a cada buit, la reserva', () => {
    creaEditor('<p></p>');
    editor.storage[NOM_SUBTARGETA].textos = { titol: 'Card title', meta: 'Context', cos: '' };
    editor.commands.inserirSubtargeta({ titol: 'Mine' });
    const caixa = editor.state.doc.firstChild;
    expect([caixa.child(0).textContent, caixa.child(1).textContent, caixa.child(2).textContent]).toEqual(['Mine', 'Context', TEXTOS_SUBTARGETA.cos]);
    expect(textosDeMostra({ titol: '  ' })).toEqual(TEXTOS_SUBTARGETA);
  });

  test('les reserves són les de ca.js (section.notes.format.subtargeta*)', () => {
    expect(TEXTOS_SUBTARGETA).toEqual({
      titol: CA['section.notes.format.subtargetaTitol'],
      meta: CA['section.notes.format.subtargetaMeta'],
      cos: CA['section.notes.format.subtargetaCos']
    });
  });

  test('dins de can() no toca res: la barra la pot provar a cada transacció', () => {
    creaEditor('<p>Hola</p>');
    const abans = editor.getHTML();
    for (let i = 0; i < 3; i += 1) expect(editor.can().inserirSubtargeta()).toBe(true);
    expect(editor.getHTML()).toBe(abans);
  });
});

/* D5-a11y-pedra-seca-04 · El títol d'una caixa nova pren el nivell del
   context: cap salt d'H2 (el subtítol de la nota) a H4 per a l'Índex ni per al
   lector de pantalla. */
describe('el nivell del títol d’una caixa nova, pel context', () => {
  const nivellNou = (html) => {
    creaEditor(html);
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.inserirSubtargeta();
    const nivells = [];
    editor.state.doc.forEach((node) => { if (node.type.name === NOM_SUBTARGETA) nivells.push(node.firstChild.attrs.level); });
    return nivells.at(-1);
  };
  test.each([
    ['un cos sense encapçalaments', '<p>Cos</p><p></p>', 3],
    ['un cos sota un H3', '<h3>Secció</h3><p>Cos</p><p></p>', 4],
    ['un cos sota un H4', '<h3>Secció</h3><h4>Apartat</h4><p>Cos</p><p></p>', 5],
    ['un cos sota un H2', '<h2>Part</h2><p>Cos</p><p></p>', 3],
    ['un cos sota un H6', '<h6>Detall</h6><p>Cos</p><p></p>', 6]
  ])('%s: h%s', (_cas, html, esperat) => {
    expect(nivellNou(html)).toBe(esperat);
    expect(editor.getHTML()).toContain(`<div class="sdp-subtargeta" data-sdp-subtargeta=""><h${esperat}>${TEXTOS_SUBTARGETA.titol}</h${esperat}>`);
  });

  test('darrere d’una subtargeta amb títol h4, la nova és germana: h4 (mai una cascada h4, h5, h6)', () => {
    expect(nivellNou('<h3>Secció</h3><div class="sdp-subtargeta" data-sdp-subtargeta=""><h4>A</h4><p>a</p></div><p></p>')).toBe(4);
    // El cursor és al títol de la nova: una tercera també és germana.
    editor.commands.inserirSubtargeta();
    const nivells = [];
    editor.state.doc.forEach((node) => { if (node.type.name === NOM_SUBTARGETA) nivells.push(node.firstChild.attrs.level); });
    expect(nivells).toEqual([4, 4, 4]);
  });

  test('els encapçalaments de darrere del lloc no hi compten; fora dels nivells admesos, la reserva', () => {
    creaEditor('<p></p><h5>Després</h5>');
    editor.commands.setTextSelection(1);
    editor.commands.inserirSubtargeta();
    expect(tipusDeDalt(editor).slice(0, 2)).toEqual([NOM_SUBTARGETA, 'heading']);
    expect(editor.state.doc.firstChild.firstChild.attrs.level).toBe(3);
    editor.destroy();
    editor = null;
    creaEditor('<h3>S</h3><p></p>');
    expect(nivellDeContext(editor.state.doc, editor.state.doc.content.size, [2, 3])).toBe(NIVELL_TITOL_SUBTARGETA);
    expect(nivellDeContext(editor.state.doc, editor.state.doc.content.size)).toBe(4);
  });
});

describe('la barra i l’ordre «/»', () => {
  test('la barra: llegir l’estat no inserix res; executar «subtargeta», sí', () => {
    creaEditor('<p>Hola</p>');
    const estat = llegeixEstat(editor);
    expect([estat.pot.subtargeta, estat.actiu.subtargeta]).toEqual([true, false]);
    expect(tipusDeDalt(editor)).toEqual(['paragraph']);
    expect(executa(editor, 'subtargeta')).toBe(true);
    expect(tipusDeDalt(editor)).toEqual(['paragraph', NOM_SUBTARGETA, 'paragraph']);
    expect(llegeixEstat(editor).actiu.subtargeta).toBe(true);
  });

  test('l’ordre «/» Subtargeta, darrere del Divisor: lleva la «/» i inserix la caixa amb els textos del magatzem', () => {
    const ids = creaOrdres().map((ordre) => ordre.id);
    expect(ids.slice(ids.indexOf('divisor'), ids.indexOf('divisor') + 3)).toEqual(['divisor', 'subtargeta', 'imatge']);
    const ordre = creaOrdres().find((o) => o.id === 'subtargeta');
    expect(ordre).toMatchObject({ titol: 'Subtargeta' });
    creaEditor('<p>/sub</p>');
    editor.storage[NOM_SUBTARGETA].textos = { titol: 'T' };
    ordre.executa({ editor, range: { from: 1, to: 5 } });
    expect(tipusDeDalt(editor)[0]).toBe(NOM_SUBTARGETA);
    expect(editor.state.doc.firstChild.firstChild.textContent).toBe('T');
    expect(editor.getHTML()).not.toContain('/sub');
  });

  /* C2-07 (àrbitre) · El títol i l'ajuda de l'ordre «/», pel traductor: les reserves són les de
     ca.js, i els traduïts arriben pel magatzem (els hi posa DocumentEditor). */
  test('l’ordre «/» porta el títol i l’ajuda traduïts del magatzem; sense, les reserves de ca.js', () => {
    expect(ORDRE_SUBTARGETA).toEqual({ titol: CA['section.notes.format.subtargeta'], ajuda: CA['section.notes.format.subtargetaAjuda'] });
    const ordre = creaOrdres().find((o) => o.id === 'subtargeta');
    expect([ordre.titol, ordre.ajuda, ordre.tradueix]).toEqual([ORDRE_SUBTARGETA.titol, ORDRE_SUBTARGETA.ajuda, textosDeLOrdre]);
    creaEditor('<p></p>');
    expect(textosDeLOrdre(editor)).toEqual(ORDRE_SUBTARGETA);
    editor.storage[NOM_SUBTARGETA].ordre = { titol: 'Sub-card', ajuda: '  ' };
    expect(textosDeLOrdre(editor)).toEqual({ titol: 'Sub-card', ajuda: ORDRE_SUBTARGETA.ajuda });
    expect(textosDeLOrdre(null)).toEqual(ORDRE_SUBTARGETA);
  });

  test('sense el node (un editor de fora d’extensionsRiques), l’ordre «/» no peta', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({ element, extensions: [StarterKit], content: '<p>/sub</p>' });
    const ordre = creaOrdres().find((o) => o.id === 'subtargeta');
    expect(() => ordre.executa({ editor, range: { from: 1, to: 5 } })).not.toThrow();
    expect(editor.getHTML()).toBe('<p></p>');
  });
});

describe('les tecles: la caixa no es desfà mai sola', () => {
  test('Retrocés a l’inici d’un títol amb contingut: res no canvia', () => {
    creaEditor(`<p>Abans</p>${PRIMITIVA}`);
    editor.commands.setTextSelection(editor.state.doc.firstChild.nodeSize + 2);
    // El paràgraf final de StarterKit (TrailingNode) ja hi és: el document acabava en la caixa.
    const abans = editor.getHTML();
    expect(abans).toBe(`<p>Abans</p>${PRIMITIVA}<p></p>`);
    expect(prem('Backspace')).toBe(true);
    expect(editor.getHTML()).toBe(abans);
  });

  test('Retrocés a l’inici del títol d’una caixa del tot buida: se’n va i hi queda un paràgraf', () => {
    creaEditor('<p>Abans</p><div class="sdp-subtargeta" data-sdp-subtargeta=""><h4></h4><p></p></div><p>Després</p>');
    editor.commands.setTextSelection(editor.state.doc.firstChild.nodeSize + 2);
    prem('Backspace');
    expect(tipusDeDalt(editor)).toEqual(['paragraph', 'paragraph', 'paragraph']);
    expect(editor.getHTML()).toBe('<p>Abans</p><p></p><p>Després</p>');
  });

  /* O4-CLAUDE-2 · C2-05 (àrbitre) · Retorn a l'inici d'un títol amb text, el gest de fer lloc
     davant de la caixa: de sèrie (splitBlock) deixava un títol buit i el de veres passava al cos
     com un H4 qualsevol. */
  test('Retorn a l’inici d’un títol amb text: un paràgraf buit davant de la caixa, que no canvia', () => {
    creaEditor(`<p>Abans</p>${PRIMITIVA}`);
    const abansCaixa = editor.state.doc.firstChild.nodeSize;
    editor.commands.setTextSelection(abansCaixa + 2);
    expect(prem('Enter')).toBe(true);
    expect(editor.getHTML()).toBe(`<p>Abans</p><p></p>${PRIMITIVA}<p></p>`);
    expect([editor.state.selection.$from.parent.type.name, editor.state.selection.$from.depth, editor.state.selection.from]).toEqual(['paragraph', 1, abansCaixa + 1]);
    // La caixa al principi del document: també hi fa lloc, davant.
    editor.commands.setContent(PRIMITIVA);
    editor.commands.setTextSelection(2);
    prem('Enter');
    expect(editor.getHTML()).toBe(`<p></p>${PRIMITIVA}<p></p>`);
    // Al mig o al final del títol, el Retorn de sempre (al final, un paràgraf de cos).
    editor.commands.setContent(PRIMITIVA);
    editor.commands.setTextSelection(2 + editor.state.doc.firstChild.firstChild.content.size);
    prem('Enter');
    expect(editor.state.doc.firstChild.child(1).type.name).toBe('paragraph');
  });

  test('Retorn en el paràgraf buit de l’últim lloc: ix de la caixa a un paràgraf nou', () => {
    creaEditor('<div class="sdp-subtargeta" data-sdp-subtargeta=""><h4>Títol</h4><p>Cos</p><p></p></div><p>Després</p>');
    const caixa = editor.state.doc.firstChild;
    editor.commands.setTextSelection(caixa.nodeSize - 2);
    prem('Enter');
    expect(tipusDeDalt(editor)).toEqual([NOM_SUBTARGETA, 'paragraph', 'paragraph']);
    expect(editor.state.doc.firstChild.childCount).toBe(2);
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph');
    expect(editor.state.selection.$from.depth).toBe(1);
    // Un Retorn al mig del cos fa el paràgraf de sempre, dins de la caixa.
    editor.commands.setTextSelection(editor.state.doc.firstChild.nodeSize - 2);
    prem('Enter');
    expect(editor.state.doc.firstChild.childCount).toBe(3);
  });
});

/* O4-CLAUDE-2 · C2-02 (àrbitre) · Les ordres de sèrie que passen per clearNodes (setParagraph,
   toggleBulletList, toggleOrderedList, toggleHeading del nivell actiu: les dreceres Mod-Alt-0,
   Mod-Shift-8/7, Mod-Alt-4 i l'ordre «/» escrita dins del títol) tornen false, però TipTap
   despatxa igualment la transacció: el títol quedava amb el nivell 1 de reserva (<h2> a getHTML),
   el nivell triat es perdia i la nota desava un H2 enmig del cos. El node el torna al nivell que
   tenia. */
describe('el títol conserva el seu nivell davant de les ordres de sèrie', () => {
  const CAIXA = '<div class="sdp-subtargeta" data-sdp-subtargeta=""><h4>T</h4><p>cos</p></div>';
  const ordres = {
    'commands.setParagraph': (ed) => ed.commands.setParagraph(),
    'commands.toggleBulletList': (ed) => ed.commands.toggleBulletList(),
    'commands.toggleOrderedList': (ed) => ed.commands.toggleOrderedList(),
    'commands.toggleHeading del nivell actiu': (ed) => ed.commands.toggleHeading({ level: 4 }),
    'chain (camí de l’ordre «/»)': (ed) => ed.chain().focus().toggleBulletList().run(),
    'chain toggleHeading (camí de «/h4»)': (ed) => ed.chain().focus().toggleHeading({ level: 4 }).run()
  };
  test.each(Object.entries(ordres))('%s amb el cursor al títol: <h4>T</h4> intacte', (_nom, ordre) => {
    creaEditor(CAIXA);
    editor.commands.setTextSelection(3);
    ordre(editor);
    expect(editor.getHTML()).toBe(`${CAIXA}<p></p>`);
    expect(editor.state.doc.firstChild.firstChild.attrs.level).toBe(4);
  });

  test('cada caixa torna al seu nivell (h3, h5), i un desfer d’un sol pas', () => {
    creaEditor('<div class="sdp-subtargeta" data-sdp-subtargeta=""><h3>A</h3><p>a</p></div><div class="sdp-subtargeta" data-sdp-subtargeta=""><h5>B</h5><p>b</p></div>');
    editor.commands.selectAll();
    // El paràgraf final de StarterKit (TrailingNode) ja hi és després de la primera transacció.
    const abans = editor.getHTML();
    editor.commands.setParagraph();
    const caixes = [];
    editor.state.doc.forEach((node) => { if (node.type.name === NOM_SUBTARGETA) caixes.push(node.firstChild.attrs.level); });
    expect(caixes).toEqual([3, 5]);
    editor.commands.undo();
    expect(editor.getHTML()).toBe(abans);
  });

  test('un canvi de nivell de debò (toggleHeading a un altre nivell) es respecta', () => {
    creaEditor(CAIXA);
    editor.commands.setTextSelection(3);
    editor.commands.toggleHeading({ level: 3 });
    expect(editor.state.doc.firstChild.firstChild.attrs.level).toBe(3);
    expect(sanitizeHtml(editor.getHTML())).toBe(editor.getHTML());
  });
});
