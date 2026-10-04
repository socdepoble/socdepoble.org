/* T7 (ordre del Mestre, prompt 261004_0515) · Les targetes incrustades amb
   un TipTap de veres (sense React: el NodeView cau al span de reserva i
   l'HTML el fa renderHTML). Fixa les regles 1/2/3+, l'HTML desat i el seu
   viatge pel sanejador, el normalitzador, les comandes i la neteja en
   parsejar. */
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { NodeSelection } from '@tiptap/pm/state';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { sanitizeHtml } from '../../../../../utils/sanitize.js';
import { TargetesIncrustades, esDeLaTargeta, teclesDeLaPlataforma } from './targetesIncrustades.js';
import { NOM_EXTENSIO_TARGETES } from './TargetesIncrustadesContext.js';

const T = (id, extra = {}) => ({ clau: `publicacio:${id}`, ruta: `/mur/${id}`, titol: `Targeta ${id}`, entradilla: 'Una entradilla', ...extra });

let editor = null;
function creaEditor(content = '<p></p>') {
  const element = document.createElement('div');
  document.body.appendChild(element);
  editor = new Editor({
    element,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] } }), TargetesIncrustades],
    content
  });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.replaceChildren();
});

const grups = (doc) => doc.querySelectorAll('div[data-sdp-targetes]');
const desat = () => new DOMParser().parseFromString(editor.getHTML(), 'text/html').body;

describe('les regles del Mestre: 1 sola, 2 parella, 3 o més graella', () => {
  test('una targeta: un grup «sola», alineat a l’esquerra, amb l’enllaç de reserva', () => {
    creaEditor();
    expect(editor.commands.inserirTargeta(T(1))).toBe(true);
    const cos = desat();
    const [grup] = grups(cos);
    expect(grup.getAttribute('data-forma')).toBe('sola');
    expect(grup.getAttribute('data-alineacio')).toBe('esquerra');
    expect(grup.className).toBe('sdp-targetes');
    const targeta = grup.querySelector('div[data-sdp-targeta]');
    expect(targeta.getAttribute('data-sdp-targeta')).toBe('publicacio:1');
    expect(targeta.getAttribute('data-titol')).toBe('Targeta 1');
    const enllac = targeta.querySelector('a');
    expect(enllac.getAttribute('href')).toBe('/mur/1');
    expect(enllac.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    expect(enllac.textContent).toBe('Targeta 1');
  });

  test('dues seguides: el mateix grup, «parella»; tres: «graella»', () => {
    creaEditor();
    editor.commands.inserirTargeta(T(1));
    editor.commands.inserirTargeta(T(2));
    expect(grups(desat())).toHaveLength(1);
    expect(grups(desat())[0].getAttribute('data-forma')).toBe('parella');
    editor.commands.inserirTargeta(T(3));
    const [grup] = grups(desat());
    expect(grup.getAttribute('data-forma')).toBe('graella');
    expect([...grup.children].map((fill) => fill.getAttribute('data-sdp-targeta'))).toEqual(['publicacio:1', 'publicacio:2', 'publicacio:3']);
  });

  test('a l’editor, la forma viva la porta la decoració: el DOM passa de «sola» a «parella»', () => {
    creaEditor();
    editor.commands.inserirTargeta(T(1));
    const dom = () => editor.view.dom.querySelector('div[data-sdp-targetes]');
    expect(dom().getAttribute('data-forma')).toBe('sola');
    editor.commands.inserirTargeta(T(2));
    expect(dom().getAttribute('data-forma')).toBe('parella');
  });

  test('l’arrel de l’editor porta la classe del cos amb targetes només mentre n’hi ha', () => {
    creaEditor('<p>Hola</p>');
    expect(editor.view.dom.classList.contains('sdp-amb-targetes')).toBe(false);
    editor.commands.inserirTargeta(T(1));
    expect(editor.view.dom.classList.contains('sdp-amb-targetes')).toBe(true);
  });
});

describe('l’HTML desat', () => {
  test('torna igual: setContent(getHTML()) no canvia res', () => {
    creaEditor('<p>Abans</p>');
    editor.commands.inserirTargeta(T(1, { imatge: '/assets/mur/1.webp', autor: 'Pep', poble: 'La Torre', subtitol: 'Sub' }));
    editor.commands.inserirTargeta(T(2));
    const html = editor.getHTML();
    editor.commands.setContent(html, { emitUpdate: false });
    expect(editor.getHTML()).toBe(html);
  });

  test('el sanejador el deixa byte a byte igual (cap salt de cursor en desar)', () => {
    creaEditor('<p>Abans</p>');
    editor.commands.inserirTargeta(T(1, { imatge: '/assets/mur/1.webp', autor: 'Pep & Maria', poble: 'La Torre', subtitol: 'Sub "cometes"' }));
    editor.commands.inserirTargeta(T(2, { ruta: '' }));
    const html = editor.getHTML();
    expect(sanitizeHtml(html)).toBe(html);
  });

  test('una ruta javascript: o «//», i una imatge d’un origen no admès pel sanejador, es descarten en parsejar', () => {
    creaEditor(`<div data-sdp-targetes="" data-alineacio="dreta"><div data-sdp-targeta="producte:9" data-ruta="javascript:alert(1)" data-titol="Mel" data-imatge="https://tracker.example/p.gif" titol="&lt;img&gt;"></div><div data-sdp-targeta="producte:10" data-ruta="//evil.example" data-titol="Oli"></div></div>`);
    const cos = desat();
    const [primera, segona] = cos.querySelectorAll('div[data-sdp-targeta]');
    expect(primera.hasAttribute('data-ruta')).toBe(false);
    expect(primera.hasAttribute('data-imatge')).toBe(false);
    expect(primera.getAttribute('data-titol')).toBe('Mel');
    expect(primera.querySelector('a')).toBeNull();
    expect(segona.hasAttribute('data-ruta')).toBe(false);
    expect(grups(cos)[0].getAttribute('data-alineacio')).toBe('dreta');
  });
});

describe('el normalitzador', () => {
  test('esborrar l’única targeta se’n du el grup: cap targeta buida', () => {
    creaEditor('<p>Abans</p>');
    editor.commands.inserirTargeta(T(1));
    const pos = editor.state.doc.content.size;
    let posTargeta = null;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === 'sdpTargeta') posTargeta = p;
    });
    expect(posTargeta).not.toBeNull();
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, posTargeta)));
    editor.commands.deleteSelection();
    expect(editor.getHTML()).not.toContain('data-sdp-targeta');
    expect(editor.getHTML()).not.toContain('data-sdp-targetes');
    expect(editor.state.doc.content.size).toBeLessThan(pos);
  });

  test('dos grups seguits es fusionen; mana l’alineació del primer', () => {
    creaEditor('<p>Hola</p>');
    const una = (id, alineacio) => `<div data-sdp-targetes="" data-alineacio="${alineacio}"><div data-sdp-targeta="poble:${id}" data-titol="Poble ${id}"></div></div>`;
    editor.commands.setContent(`<p>Hola</p>${una(1, 'dreta')}${una(2, 'esquerra')}<p>Adeu</p>`, { emitUpdate: false });
    const cos = desat();
    expect(grups(cos)).toHaveLength(1);
    expect(grups(cos)[0].getAttribute('data-forma')).toBe('parella');
    expect(grups(cos)[0].getAttribute('data-alineacio')).toBe('dreta');
  });

  test('una targeta sense clau vàlida i un grup que es queda buit desapareixen', () => {
    creaEditor();
    editor.commands.setContent('<p>Hola</p><div data-sdp-targetes=""><div data-sdp-targeta="nota:n1" data-titol="Privada"></div></div><div data-sdp-targetes=""><div data-sdp-targeta="" data-titol="Buida"></div></div><p>Adeu</p>', { emitUpdate: false });
    expect(editor.getHTML()).toBe('<p>Hola</p><p>Adeu</p>');
  });
});

/* Revisió del front «editor» (261004) · Retrocés i Supr al costat d'un grup
   fan el que fan amb una imatge de bloc: el grup és aïllat i no es pot
   triar, i ProseMirror (joinBackward, selectNodeBackward) no hi feia res. */
describe('Retrocés i Supr al costat d’un grup, com amb una imatge', () => {
  const grup = (...ids) => `<div data-sdp-targetes="">${ids.map((id) => `<div data-sdp-targeta="poble:${id}" data-titol="Poble ${id}"></div>`).join('')}</div>`;
  /* La posició de l'inici (o del final) del primer bloc de text amb `text`. */
  const posDe = (text, alFinal = false) => {
    let pos = null;
    editor.state.doc.descendants((node, p) => {
      if (pos === null && node.isTextblock && node.textContent === text) pos = alFinal ? p + 1 + node.content.size : p + 1;
    });
    return pos;
  };
  const triada = () => editor.state.selection.node?.attrs.clau ?? null;
  const claus = () => [...desat().querySelectorAll('div[data-sdp-targeta]')].map((t) => t.getAttribute('data-sdp-targeta'));
  /* La tecla pel camí de veres de la vista (handleKeyDown de cada keymap,
     en l'ordre dels connectors). Torna si algú l'ha gestionada; si ningú,
     el navegador faria la seua (en jsdom, res). La comanda keyboardShortcut
     de TipTap no servix: torna sempre true i no s'endú la selecció. */
  const prem = (key, modificadors = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modificadors });
    return Boolean(editor.view.someProp('handleKeyDown', (gestor) => gestor(editor.view, event)));
  };

  test('Retrocés a l’inici d’un bloc amb text esborra la targeta d’abans; el cursor no es mou del bloc', () => {
    creaEditor(`<p>Intro</p>${grup(1)}<p>Text</p>`);
    editor.commands.setTextSelection(posDe('Text'));
    expect(prem('Backspace')).toBe(true);
    expect(editor.getHTML()).toBe('<p>Intro</p><p>Text</p>');
    expect(editor.state.selection.$from.parent.textContent).toBe('Text');
    expect(editor.state.selection.$from.parentOffset).toBe(0);
  });

  test('en un grup de dues, Retrocés se’n du l’última i Supr la primera', () => {
    creaEditor(`<p>Intro</p>${grup(1, 2)}<p>Text</p>`);
    editor.commands.setTextSelection(posDe('Text'));
    expect(prem('Backspace')).toBe(true);
    expect(claus()).toEqual(['poble:1']);
    editor.destroy();
    creaEditor(`<p>Intro</p>${grup(1, 2)}<p>Text</p>`);
    editor.commands.setTextSelection(posDe('Intro', true));
    expect(prem('Delete')).toBe(true);
    expect(claus()).toEqual(['poble:2']);
    expect(editor.state.selection.$from.parent.textContent).toBe('Intro');
  });

  test('Retrocés en el paràgraf buit de darrere el lleva i tria l’última targeta; un altre Retrocés l’esborra', () => {
    creaEditor(`<p>Intro</p>${grup(1, 2)}<p></p><p>Text</p>`);
    editor.commands.setTextSelection(posDe('Text') - 2);
    expect(editor.state.selection.$from.parent.content.size).toBe(0);
    expect(prem('Backspace')).toBe(true);
    expect(triada()).toBe('poble:2');
    expect(editor.getHTML()).toMatch(/<\/div><\/div><p>Text<\/p>$/);
    expect(prem('Backspace')).toBe(true);
    expect(claus()).toEqual(['poble:1']);
  });

  test('al final del document, el paràgraf de cua el torna a posar l’StarterKit, i la targeta queda triada', () => {
    creaEditor(`<p>Intro</p>${grup(1, 2)}<p></p>`);
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(prem('Backspace')).toBe(true);
    expect(triada()).toBe('poble:2');
  });

  test('lluny de la vora d’un grup, Retrocés i Supr no els agafa ningú: el navegador fa la seua', () => {
    creaEditor(`<p>Intro</p>${grup(1)}<p>Text</p>`);
    const abans = editor.getHTML();
    editor.commands.setTextSelection(posDe('Text') + 2);
    expect(prem('Backspace')).toBe(false);
    editor.commands.setTextSelection(posDe('Intro'));
    expect(prem('Delete')).toBe(false);
    expect(editor.getHTML()).toBe(abans);
  });

  test('al costat d’un bloc que no és cap grup, el de sempre: Retrocés ajunta els dos paràgrafs', () => {
    creaEditor(`<p>Intro</p><p>Text</p>${grup(1)}`);
    editor.commands.setTextSelection(posDe('Text'));
    expect(prem('Backspace')).toBe(true);
    expect(editor.getHTML()).toMatch(/^<p>IntroText<\/p><div data-sdp-targetes/);
  });

  /* Revisió del front «editor» (261004) · A Mac i iOS, el keymap de TipTap
     (@tiptap/core, extensions/keymap.ts) lliga al Retrocés i al Supr també
     les variants d'Emacs i d'Opció. Les targetes les seguixen, separades per
     plataforma com ell: fora de Mac no s'hi afig cap. */
  test('les combinacions, per plataforma com el keymap de TipTap', () => {
    expect(teclesDeLaPlataforma(false)).toEqual({
      enrere: ['Backspace', 'Mod-Backspace', 'Shift-Backspace'],
      avant: ['Delete', 'Mod-Delete']
    });
    expect(teclesDeLaPlataforma(true)).toEqual({
      enrere: ['Backspace', 'Mod-Backspace', 'Shift-Backspace', 'Ctrl-h', 'Alt-Backspace'],
      avant: ['Delete', 'Mod-Delete', 'Ctrl-d', 'Ctrl-Alt-Backspace', 'Alt-Delete', 'Alt-d']
    });
  });

  test('fora de Mac, Opció+Retrocés no és de les targetes: el grup no es toca', () => {
    creaEditor(`<p>Intro</p>${grup(1)}<p>Text</p>`);
    const abans = editor.getHTML();
    editor.commands.setTextSelection(posDe('Text'));
    expect(prem('Backspace', { altKey: true })).toBe(false);
    expect(editor.getHTML()).toBe(abans);
  });

  describe('a Mac i iOS', () => {
    /* La plataforma la llig TipTap en muntar l'editor (isMacOS): una
       propietat pròpia la tapa i en llevar-la torna la de jsdom. */
    beforeEach(() => {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
    });
    afterEach(() => {
      delete navigator.platform;
    });

    test('Opció+Retrocés i Ctrl-h a l’inici d’un bloc esborren la targeta d’abans', () => {
      creaEditor(`<p>Intro</p>${grup(1, 2)}<p>Text</p>`);
      editor.commands.setTextSelection(posDe('Text'));
      expect(prem('Backspace', { altKey: true })).toBe(true);
      expect(claus()).toEqual(['poble:1']);
      expect(prem('h', { ctrlKey: true })).toBe(true);
      expect(editor.getHTML()).toBe('<p>Intro</p><p>Text</p>');
    });

    test('Ctrl-d, Ctrl-Opció+Retrocés, Opció+Supr i Opció+d al final d’un bloc esborren la targeta de després', () => {
      for (const [key, modificadors] of [['d', { ctrlKey: true }], ['Backspace', { ctrlKey: true, altKey: true }], ['Delete', { altKey: true }], ['d', { altKey: true }]]) {
        const nom = `${Object.keys(modificadors).join('+')}+${key}`;
        editor?.destroy();
        creaEditor(`<p>Intro</p>${grup(1, 2)}<p>Text</p>`);
        editor.commands.setTextSelection(posDe('Intro', true));
        expect(prem(key, modificadors), nom).toBe(true);
        expect(claus(), nom).toEqual(['poble:2']);
        expect(editor.state.selection.$from.parent.textContent, nom).toBe('Intro');
      }
    });
  });
});

/* Revisió del front «editor» (261004) · El stopEvent del NodeView: React es
   queda el clic i la tecla dels controls de la targeta (botons, enllaços,
   camps), però arrossegar i deixar anar són de ProseMirror també des d'un
   enllaç. Si no, agafar la targeta per la boina de l'autor arrossegava
   l'enllaç solt i la targeta no es movia. */
describe('stopEvent de la targeta', () => {
  test('els clics dels controls, per a React; l’arrossegament, per a ProseMirror', () => {
    const targeta = document.createElement('div');
    const [enllac, boto, camp, cos] = ['a', 'button', 'input', 'span'].map((etiqueta) => targeta.appendChild(document.createElement(etiqueta)));
    const event = (type, target) => ({ type, target });
    for (const control of [enllac, boto, camp]) {
      for (const type of ['click', 'mousedown', 'keydown']) expect(esDeLaTargeta(event(type, control)), `${type} ${control.tagName}`).toBe(true);
      for (const type of ['dragstart', 'drag', 'dragenter', 'dragover', 'dragleave', 'dragend', 'drop']) {
        expect(esDeLaTargeta(event(type, control)), `${type} ${control.tagName}`).toBe(false);
      }
    }
    expect(esDeLaTargeta(event('mousedown', cos))).toBe(false);
    expect(esDeLaTargeta(event('dragstart', cos))).toBe(false);
    expect(esDeLaTargeta(null)).toBe(false);
  });
});

describe('les comandes', () => {
  test('obreSelectorDeTargeta: dins de can() no obri mai res; executada, sí', () => {
    creaEditor();
    const obre = vi.fn();
    editor.storage[NOM_EXTENSIO_TARGETES].obreSelector = obre;
    expect(editor.can().obreSelectorDeTargeta()).toBe(true);
    expect(editor.can().chain().focus().obreSelectorDeTargeta().run()).toBe(true);
    expect(obre).not.toHaveBeenCalled();
    editor.commands.obreSelectorDeTargeta();
    expect(obre).toHaveBeenCalledTimes(1);
  });

  test('sense selector del consumidor, l’ordre ix apagada', () => {
    creaEditor();
    expect(editor.can().obreSelectorDeTargeta()).toBe(false);
  });

  test('inserirTargeta: una entrada sense clau vàlida o sense títol no entra', () => {
    creaEditor('<p>Hola</p>');
    expect(editor.commands.inserirTargeta({ clau: 'nota:1', titol: 'Privada' })).toBe(false);
    expect(editor.commands.inserirTargeta({ clau: 'publicacio:1', titol: '' })).toBe(false);
    expect(editor.getHTML()).toBe('<p>Hola</p>');
  });

  /* Revisió del front «editor» (261004) · Regla d'or 1: cap boina buida. */
  test('inserirTargeta: una ruta d’autor sense el seu nom no entra; la del projecte, sí (signa Sóc de Poble)', () => {
    creaEditor('<p>Hola</p>');
    expect(editor.can().inserirTargeta(T(1, { autorRuta: '/perfil/persona/pep' }))).toBe(false);
    expect(editor.commands.inserirTargeta(T(1, { autorRuta: '/perfil/persona/pep' }))).toBe(false);
    expect(editor.getHTML()).toBe('<p>Hola</p>');
    expect(editor.commands.inserirTargeta(T(2, { autorRuta: '/projecte' }))).toBe(true);
    expect(desat().querySelector('div[data-sdp-targeta]').getAttribute('data-autor-ruta')).toBe('/projecte');
  });

  test('en un paràgraf amb text, el grup va darrere del bloc de primer nivell, i el cursor continua darrere', () => {
    creaEditor('<p>Primer</p><ul><li><p>Dins d’una llista</p></li></ul><p>Últim</p>');
    let posLlista = null;
    editor.state.doc.descendants((node, p) => {
      if (posLlista === null && node.isText && node.text === 'Dins d’una llista') posLlista = p + 3;
    });
    editor.commands.setTextSelection(posLlista);
    editor.commands.inserirTargeta(T(5));
    const cos = desat();
    expect([...cos.children].map((fill) => fill.tagName.toLowerCase())).toEqual(['p', 'ul', 'div', 'p']);
    expect(editor.state.selection.$from.parent.textContent).toBe('Últim');
  });

  test('en un paràgraf buit (el que deixa l’ordre «/»), el grup ocupa el seu lloc i deixa on continuar escrivint', () => {
    creaEditor('<p>Hola</p><p></p>');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.inserirTargeta(T(6));
    const cos = desat();
    expect([...cos.children].map((fill) => fill.tagName.toLowerCase())).toEqual(['p', 'div', 'p']);
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph');
  });

  test('amb una targeta triada, la nova va darrere d’ella, al mateix grup', () => {
    creaEditor();
    editor.commands.inserirTargeta(T(1));
    editor.commands.inserirTargeta(T(3));
    let posPrimera = null;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === 'sdpTargeta' && node.attrs.clau === 'publicacio:1') posPrimera = p;
    });
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, posPrimera)));
    editor.commands.inserirTargeta(T(2));
    const [grup] = grups(desat());
    expect([...grup.children].map((fill) => fill.getAttribute('data-sdp-targeta'))).toEqual(['publicacio:1', 'publicacio:2', 'publicacio:3']);
  });

  test('alineaTargetes: dreta i esquerra, només dins d’un grup', () => {
    creaEditor('<p>Hola</p>');
    expect(editor.commands.alineaTargetes('dreta')).toBe(false);
    editor.commands.inserirTargeta(T(1));
    let posTargeta = null;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === 'sdpTargeta') posTargeta = p;
    });
    expect(editor.commands.alineaTargetes('dreta', posTargeta)).toBe(true);
    expect(grups(desat())[0].getAttribute('data-alineacio')).toBe('dreta');
    expect(editor.commands.alineaTargetes('centre', posTargeta)).toBe(false);
  });
});
