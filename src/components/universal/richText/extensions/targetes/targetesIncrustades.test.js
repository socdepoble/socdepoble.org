/* T7 (ordre del Mestre, prompt 261004_0515) · Les targetes incrustades amb
   un TipTap de veres (sense React: el NodeView cau al span de reserva i
   l'HTML el fa renderHTML). Fixa les regles 1/2/3+, l'HTML desat i el seu
   viatge pel sanejador, el normalitzador, les comandes i la neteja en
   parsejar. */
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { AllSelection, NodeSelection, TextSelection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { sanitizeHtml } from '../../../../../utils/sanitize.js';
import { TargetesIncrustades, clauDeRutaInterna, esDeLaTargeta, rutaDeClau, teclesDeLaPlataforma } from './targetesIncrustades.js';
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
/* T2.6 · La posició del primer node que compleix `prova`, o null; la d'una
   targeta (per clau); i el cursor dos caràcters dins del text que conté `text`. */
const posDe = (prova) => {
  let trobada = null;
  editor.state.doc.descendants((node, p) => {
    if (trobada === null && prova(node)) trobada = p;
  });
  return trobada;
};
const posTargeta = (clau = null) => posDe((node) => node.type.name === 'sdpTargeta' && (!clau || node.attrs.clau === clau));
const cursorA = (text) => editor.commands.setTextSelection(posDe((node) => node.isText && node.text.includes(text)) + 2);
const triaTargeta = (clau) => editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, posTargeta(clau))));

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

  test('alineaTargetes: dreta, centre i esquerra, només dins d’un grup', () => {
    creaEditor('<p>Hola</p>');
    expect(editor.commands.alineaTargetes('dreta')).toBe(false);
    editor.commands.inserirTargeta(T(1));
    let posTargeta = null;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === 'sdpTargeta') posTargeta = p;
    });
    expect(editor.commands.alineaTargetes('dreta', posTargeta)).toBe(true);
    expect(grups(desat())[0].getAttribute('data-alineacio')).toBe('dreta');
    expect(editor.commands.alineaTargetes('centre', posTargeta)).toBe(true);
    expect(grups(desat())[0].getAttribute('data-alineacio')).toBe('centre');
    expect(editor.commands.alineaTargetes('invalida', posTargeta)).toBe(false);
  });

  test('clauDeRutaInterna i rutaDeClau resolen les rutes internes de Sóc de Poble i rebutgen les externes', () => {
    expect(clauDeRutaInterna('/mur/1')).toBe('publicacio:1');
    expect(clauDeRutaInterna('/events/7')).toBe('esdeveniment:7');
    expect(clauDeRutaInterna('/agenda/7')).toBe('esdeveniment:7');
    expect(clauDeRutaInterna('/mercat/9')).toBe('producte:9');
    expect(clauDeRutaInterna('/pobles/la-torre')).toBe('poble:la-torre');
    expect(clauDeRutaInterna('/page/drets-autor')).toBe('pagina:drets-autor');
    expect(clauDeRutaInterna('/projecte')).toBe('pagina:projecte');
    expect(clauDeRutaInterna('/anima')).toBe('pagina:anima');
    /* T26-06 (Gauntlet O7) · Prova posada al dia a propòsit: /iaia és la
       fitxa pública de la IAIA MarIA (RUTA_FITXA_IAIA), un perfil, que no
       s'incrusta; només /ia porta al manifest. /page/iaia és el slug «iaia»,
       com a paginaDeText.clauDeRuta. */
    expect(clauDeRutaInterna('/iaia')).toBe('');
    expect(clauDeRutaInterna('/ia')).toBe('pagina:anima');
    expect(clauDeRutaInterna('/page/iaia')).toBe('pagina:iaia');
    expect(clauDeRutaInterna('/fedivers')).toBe('pagina:fedivers');
    expect(clauDeRutaInterna('/page/fediversity')).toBe('pagina:fediversity');
    expect(clauDeRutaInterna('/consola')).toBe('pagina:consola');
    expect(clauDeRutaInterna('/page/cervell')).toBe('pagina:cervell');
    expect(clauDeRutaInterna('/wikidepoble')).toBe('pagina:wikidepoble');
    expect(clauDeRutaInterna('/disseny')).toBe('pagina:disseny');
    expect(clauDeRutaInterna('https://fora.example/mur/1')).toBe('');
    expect(clauDeRutaInterna('/notes?nota=n1')).toBe('');
    expect(rutaDeClau('publicacio:1')).toBe('/mur/1');
    expect(rutaDeClau('pagina:projecte')).toBe('/projecte');
    expect(rutaDeClau('pagina:fediversity')).toBe('/page/fediversity');
  });

  /* T26-03 (Gauntlet O7) · Prova posada al dia a propòsit: abans només
     comprovava la clau, la ruta i el títol, i la Card tornava sense
     instantània ni autor (la boina signava «Sóc de Poble») i a la dreta.
     Ara l'anada i tornada és exacta: el mateix HTML. */
  test('commutador bidireccional «Enllaç ↔ Card»: Card → Enllaç → Card torna la Card sencera (instantània, autor i alineació)', () => {
    creaEditor('<p>Abans</p>');
    expect(editor.commands.inserirTargeta(T(1, { subtitol: 'Sub', autor: 'Pepa', autorRuta: '/gent/pepa', poble: 'La Torre' }))).toBe(true);
    const abans = editor.getHTML();
    expect(grups(desat())[0].getAttribute('data-alineacio')).toBe('esquerra');
    expect(editor.commands.convertirTargetaEnEnllac(posTargeta())).toBe(true);
    expect(grups(desat())).toHaveLength(0);
    const enllac = desat().querySelector('p a[href="/mur/1"]');
    expect(enllac).not.toBeNull();
    expect(enllac.textContent).toBe('Targeta 1');
    expect(sanitizeHtml(editor.getHTML())).toBe(editor.getHTML());

    /* Ara el cursor és a l'enllaç: commutar-lo torna la mateixa Card. */
    cursorA('Targeta 1');
    expect(editor.can().commutarEnllacTargeta()).toBe(true);
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    expect(editor.getHTML()).toBe(abans);
    const targeta = desat().querySelector('div[data-sdp-targeta="publicacio:1"]');
    expect([targeta.getAttribute('data-entradilla'), targeta.getAttribute('data-autor'), targeta.getAttribute('data-autor-ruta'), targeta.getAttribute('data-poble')])
      .toEqual(['Una entradilla', 'Pepa', '/gent/pepa', 'La Torre']);
  });

  test('T26-03 · en un grup de tres, Card → Enllaç → Card torna la targeta al seu lloc del grup', () => {
    creaEditor();
    for (const id of [1, 2, 3]) editor.commands.inserirTargeta(T(id));
    const abans = editor.getHTML();
    expect(editor.commands.convertirTargetaEnEnllac(posTargeta('publicacio:2'))).toBe(true);
    expect(grups(desat())[0].getAttribute('data-forma')).toBe('parella');
    cursorA('Targeta 2');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    expect(editor.getHTML()).toBe(abans);
    expect([...grups(desat())[0].children].map((fill) => fill.getAttribute('data-sdp-targeta'))).toEqual(['publicacio:1', 'publicacio:2', 'publicacio:3']);
  });

  test('T26-03 · Desfer no buida la memòria: l’enllaç que torna encara es fa la mateixa Card', () => {
    creaEditor('<p>Abans</p>');
    editor.commands.inserirTargeta(T(1, { autor: 'Pepa', autorRuta: '/gent/pepa' }));
    editor.commands.convertirTargetaEnEnllac(posTargeta());
    editor.view.dispatch(closeHistory(editor.state.tr));
    const enllac = editor.getHTML();
    cursorA('Targeta 1');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getHTML()).toBe(enllac);
    cursorA('Targeta 1');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    expect(desat().querySelector('div[data-sdp-targeta="publicacio:1"]').getAttribute('data-autor')).toBe('Pepa');
  });

  test('T26-03 · Desfer en un grup de tres: l’enllaç que torna encara va al seu lloc del grup', () => {
    creaEditor();
    for (const id of [1, 2, 3]) editor.commands.inserirTargeta(T(id));
    const abans = editor.getHTML();
    editor.commands.convertirTargetaEnEnllac(posTargeta('publicacio:2'));
    editor.view.dispatch(closeHistory(editor.state.tr));
    const enllac = editor.getHTML();
    cursorA('Targeta 2');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getHTML()).toBe(enllac);
    cursorA('Targeta 2');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    expect(editor.getHTML()).toBe(abans);
  });

  /* Verificador A4 (ronda 2) · La memòria va lligada al node concret que
     ha escrit cada commutació, no a la ruta. ADV-1: una altra Card de la
     mateixa pàgina (la del selector) torna amb el seu títol, sense les
     marques ni el text de l'enllaç d'una altra; la que venia de l'enllaç
     torna el seu bloc, també després de canviar-li l'alineació. */
  test('ADV-1 · una altra Card de la mateixa ruta no hereta el bloc d’un altre enllaç', () => {
    creaEditor('<p><a href="/anima"><strong>Text privat de la nota</strong></a></p><p>Mig</p>');
    cursorA('privat');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(editor.commands.inserirTargeta({ clau: 'pagina:anima', ruta: '/anima', titol: 'L’Ànima de la IAIA' })).toBe(true);
    let ultima = null;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === 'sdpTargeta') ultima = p;
    });
    expect(editor.commands.convertirTargetaEnEnllac(ultima)).toBe(true);
    expect([...desat().querySelectorAll('p a[href="/anima"]')].map((a) => a.innerHTML)).toEqual(['L’Ànima de la IAIA']);
    expect(editor.commands.alineaTargetes('esquerra', posTargeta())).toBe(true);
    expect(editor.commands.convertirTargetaEnEnllac(posTargeta())).toBe(true);
    expect([...desat().querySelectorAll('p a[href="/anima"]')].map((a) => a.innerHTML))
      .toEqual(['<strong>Text privat de la nota</strong>', 'L’Ànima de la IAIA']);
  });

  /* Verificador A4 (ronda 2, P3) · Un altre enllaç a la mateixa ruta, just
     darrere d'un altre grup, és un enllaç nou: ni el lloc recordat (l'índex)
     ni la instantània de la Card d'un altre. L'enllaç concret sí que torna
     al seu lloc, amb la seua instantània. */
  test('ADV · un altre enllaç a la mateixa ruta, darrere d’un altre grup, no hereta el lloc ni la instantània', () => {
    const targeta = (clau, titol, extra = '') => `<div data-sdp-targeta="${clau}" data-titol="${titol}"${extra}></div>`;
    creaEditor(`<div data-sdp-targetes="" data-alineacio="esquerra">${targeta('pagina:projecte', 'El projecte')}`
      + `${targeta('pagina:anima', 'L’Ànima de la IAIA', ' data-ruta="/anima" data-subtitol="Sub"')}${targeta('pagina:consola', 'La Consola')}</div>`
      + `<p>Mig</p><div data-sdp-targetes="" data-alineacio="esquerra">${targeta('pagina:disseny', 'Disseny')}${targeta('pagina:fedivers', 'Fedivers')}</div>`
      + '<p><a href="/anima">Una altra Ànima</a></p>');
    expect(editor.commands.convertirTargetaEnEnllac(posTargeta('pagina:anima'))).toBe(true);
    cursorA('altra');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    const fills = (grup) => [...grup.children].map((fill) => [fill.getAttribute('data-sdp-targeta'), fill.getAttribute('data-titol'), fill.getAttribute('data-subtitol')]);
    expect(fills(grups(desat())[1])).toEqual([['pagina:disseny', 'Disseny', null], ['pagina:fedivers', 'Fedivers', null], ['pagina:anima', 'Una altra Ànima', null]]);
    cursorA('IAIA');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    expect(fills(grups(desat())[0])).toEqual([['pagina:projecte', 'El projecte', null], ['pagina:anima', 'L’Ànima de la IAIA', 'Sub'], ['pagina:consola', 'La Consola', null]]);
  });

  test('ADV · un paràgraf idèntic a l’enllaç commutat, però que no n’és, no recupera la Card; el concret, sí', () => {
    creaEditor('<p>Abans</p>');
    editor.commands.inserirTargeta({ clau: 'pagina:anima', ruta: '/anima', titol: 'L’Ànima de la IAIA', subtitol: 'Sub' });
    expect(editor.commands.convertirTargetaEnEnllac(posTargeta())).toBe(true);
    const concret = editor.state.doc.nodeAt(posDe((node) => node.type.name === 'paragraph' && node.textContent === 'L’Ànima de la IAIA'));
    const copia = editor.schema.nodeFromJSON(concret.toJSON());
    expect([copia === concret, copia.eq(concret)]).toEqual([false, true]);
    editor.view.dispatch(editor.state.tr.insert(0, copia));
    cursorA('IAIA');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    const alCos = () => [...grups(desat())].map((grup) => [grup.getAttribute('data-alineacio'), grup.firstElementChild.getAttribute('data-subtitol')]);
    expect(alCos()).toEqual([['dreta', null]]);
    cursorA('IAIA');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    expect(alCos()).toEqual([['dreta', null], ['esquerra', 'Sub']]);
  });

  /* Un arrossegament amb còpia posa el mateix node dues voltes: cap de les
     dues Cards no és «la» que va eixir de l'enllaç, i cap no en torna el
     bloc. La que queda, ja única, sí. */
  test('ADV · una Card que hi és dues voltes (arrossegada amb còpia) no torna el bloc de l’enllaç', () => {
    creaEditor('<p><a href="/anima"><strong>Text privat de la nota</strong></a></p><p>Mig</p>');
    cursorA('privat');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    const grup = editor.state.doc.nodeAt(posDe((node) => node.type.name === 'sdpTargetes'));
    editor.view.dispatch(editor.state.tr.insert(editor.state.doc.content.size, grup.type.create({ alineacio: 'esquerra' }, grup.firstChild)));
    expect(grups(desat())).toHaveLength(2);
    let ultima = null;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === 'sdpTargeta') ultima = p;
    });
    expect(editor.commands.convertirTargetaEnEnllac(ultima)).toBe(true);
    expect(desat().querySelector('strong')).toBeNull();
    expect(desat().querySelector('p a[href="/anima"]').textContent).toBe('Text privat de la nota');
    expect(editor.commands.convertirTargetaEnEnllac(posTargeta())).toBe(true);
    expect([...desat().querySelectorAll('p a[href="/anima"]')].map((a) => a.innerHTML))
      .toEqual(['<strong>Text privat de la nota</strong>', 'Text privat de la nota']);
  });

  /* L'índex recordat és el del grup d'on va eixir: l'enllaç concret, mogut
     (arrossegat) darrere d'un altre grup, torna Card amb la seua instantània,
     però al final d'eixe grup, com una Card nova (el normalitzador). */
  test('ADV · l’enllaç concret mogut darrere d’un altre grup no s’hi encaixa a l’índex recordat', () => {
    const targeta = (clau, titol) => `<div data-sdp-targeta="${clau}" data-titol="${titol}"></div>`;
    creaEditor(`<div data-sdp-targetes="" data-alineacio="esquerra">${targeta('pagina:projecte', 'El projecte')}${targeta('pagina:anima', 'L’Ànima')}${targeta('pagina:consola', 'La Consola')}</div>`
      + `<p>Mig</p><div data-sdp-targetes="" data-alineacio="esquerra">${targeta('pagina:disseny', 'Disseny')}${targeta('pagina:fedivers', 'Fedivers')}</div><p>Fi</p>`);
    expect(editor.commands.convertirTargetaEnEnllac(posTargeta('pagina:anima'))).toBe(true);
    const posEnllac = posDe((node) => node.type.name === 'paragraph' && node.textContent === 'L’Ànima');
    const enllac = editor.state.doc.nodeAt(posEnllac);
    const tr = editor.state.tr.delete(posEnllac, posEnllac + enllac.nodeSize);
    let posFi = null;
    tr.doc.descendants((node, p) => {
      if (posFi === null && node.type.name === 'paragraph' && node.textContent === 'Fi') posFi = p;
    });
    editor.view.dispatch(tr.insert(posFi, enllac));
    cursorA('L’Ànima');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    const claus = (grup) => [...grup.children].map((fill) => fill.getAttribute('data-sdp-targeta'));
    expect(grups(desat())).toHaveLength(2);
    expect(claus(grups(desat())[0])).toEqual(['pagina:projecte', 'pagina:consola']);
    expect(claus(grups(desat())[1])).toEqual(['pagina:disseny', 'pagina:fedivers', 'pagina:anima']);
  });

  test('T26-04 · Enllaç → Card → Enllaç torna el paràgraf tal com era: marques, target i text', () => {
    creaEditor('<p>Abans</p><p><a href="/anima" target="_blank"><strong>L’Ànima</strong> de la IAIA</a></p><p>Després</p>');
    const abans = editor.getHTML();
    cursorA('de la IAIA');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    const grup = grups(desat())[0];
    expect(grup.getAttribute('data-alineacio')).toBe('dreta');
    expect(grup.querySelector('div[data-sdp-targeta="pagina:anima"]').getAttribute('data-titol')).toBe('L’Ànima de la IAIA');
    expect(editor.commands.commutarEnllacTargeta(posTargeta())).toBe(true);
    expect(editor.getHTML()).toBe(abans);
  });

  test('T26-04 · no commuta a Card el que no podria tornar: un títol, un enllaç enmig del text o dins d’una llista', () => {
    for (const html of ['<h2><a href="/anima">L’Ànima</a></h2>', '<p>Llegiu <a href="/anima">l’Ànima</a> ara</p>', '<ul><li><p><a href="/anima">L’Ànima</a></p></li></ul>']) {
      editor?.destroy();
      creaEditor(html);
      cursorA('Ànima');
      const abans = editor.getHTML();
      expect([html, editor.can().commutarEnllacTargeta()]).toEqual([html, false]);
      expect(editor.commands.commutarEnllacTargeta()).toBe(false);
      expect(editor.getHTML()).toBe(abans);
    }
  });

  test('T26-03 · Regla d’or 1: un enllaç nu a una publicació no es fa Card sense la seua instantània; amb els atributs de la cerca, sí', () => {
    creaEditor('<p><a href="/mur/42">La festa</a></p>');
    cursorA('La festa');
    const abans = editor.getHTML();
    expect(editor.can().convertirEnllacEnTargeta()).toBe(false);
    expect(editor.commands.commutarEnllacTargeta()).toBe(false);
    expect(editor.getHTML()).toBe(abans);
    expect(editor.commands.commutarEnllacTargeta(T(42, { titol: 'La festa', autor: 'Pepa', autorRuta: '/gent/pepa' }))).toBe(true);
    const targeta = desat().querySelector('div[data-sdp-targeta="publicacio:42"]');
    expect([targeta.getAttribute('data-autor'), targeta.getAttribute('data-entradilla')]).toEqual(['Pepa', 'Una entradilla']);
  });

  /* Límit (T26-03 / T26-04): la memòria de la commutació és de l'editor obert
     i no es desa. Un enllaç desat és un hiperenllaç de text normal, sense
     instantània: en tornar a obrir el document, el d'una pàgina es fa Card
     amb el text de l'enllaç i a la dreta (T2.6), i el d'una publicació no
     (Regla d'or 1). */
  test('límit · en tornar a obrir el document, l’enllaç ja no recorda la Card', () => {
    creaEditor('<p>Abans</p>');
    editor.commands.inserirTargeta(T(7, { autor: 'Pepa', autorRuta: '/gent/pepa' }));
    editor.commands.convertirTargetaEnEnllac(posTargeta());
    editor.commands.setTextSelection(1);
    editor.commands.inserirTargeta({ clau: 'pagina:anima', ruta: '/anima', titol: 'L’Ànima de la IAIA' });
    editor.commands.convertirTargetaEnEnllac(posTargeta());
    const desatHtml = editor.getHTML();
    editor.destroy();
    creaEditor(desatHtml);
    cursorA('Targeta 7');
    expect(editor.commands.commutarEnllacTargeta()).toBe(false);
    cursorA('Ànima');
    expect(editor.commands.commutarEnllacTargeta()).toBe(true);
    const grup = grups(desat())[0];
    expect(grup.getAttribute('data-alineacio')).toBe('dreta');
    expect(grup.querySelector('div[data-sdp-targeta="pagina:anima"]').getAttribute('data-titol')).toBe('L’Ànima de la IAIA');
  });

  test('T26-06 · un enllaç a /iaia (la fitxa de la IAIA MarIA) no es fa Card de la pàgina «anima»', () => {
    creaEditor('<p><a href="/iaia">La IAIA MarIA</a></p>');
    cursorA('IAIA');
    const abans = editor.getHTML();
    expect(editor.commands.commutarEnllacTargeta()).toBe(false);
    expect(editor.getHTML()).toBe(abans);
  });

  test('en un grup de dues targetes, commutar-ne una a enllaç deixa l’altra al grup i escriu l’enllaç darrere', () => {
    creaEditor();
    editor.commands.inserirTargeta(T(1));
    editor.commands.inserirTargeta(T(2));
    let posSegona = null;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === 'sdpTargeta' && node.attrs.clau === 'publicacio:2') posSegona = p;
    });
    expect(editor.commands.convertirTargetaEnEnllac(posSegona)).toBe(true);
    const cos = desat();
    expect(grups(cos)).toHaveLength(1);
    expect(grups(cos)[0].getAttribute('data-forma')).toBe('sola');
    expect(cos.querySelector('div[data-sdp-targeta="publicacio:1"]')).not.toBeNull();
    expect(cos.querySelector('p a[href="/mur/2"]').textContent).toBe('Targeta 2');
  });

  /* T26-04 (Gauntlet O7) · Prova posada al dia a propòsit: enmig del text la
     Card s'afegia darrere del bloc i l'enllaç es quedava, i en tornar n'hi
     havia dos. Ara enmig del text no es commuta. */
  test('inserirEnllacDeTargeta escriu l’enllaç intern al cursor; enmig del text, convertirEnllacEnTargeta no hi fa res', () => {
    creaEditor('<p>Llegiu més:</p>');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(editor.commands.inserirEnllacDeTargeta({ clau: 'pagina:anima', ruta: '/anima', titol: 'L’Ànima de la IAIA' })).toBe(true);
    expect(desat().querySelector('p a[href="/anima"]').textContent).toBe('L’Ànima de la IAIA');
    const abans = editor.getHTML();
    expect(editor.commands.convertirEnllacEnTargeta()).toBe(false);
    expect(editor.getHTML()).toBe(abans);
    expect(desat().querySelector('div[data-sdp-targeta]')).toBeNull();
  });

  test('T26-05 · «Inserir com a enllaç» amb una Card triada la conserva i escriu l’enllaç darrere del grup', () => {
    creaEditor('<p>Intro</p><p>Final</p>');
    editor.commands.setTextSelection(6);
    editor.commands.inserirTargeta(T(1));
    triaTargeta('publicacio:1');
    expect(editor.isActive('sdpTargeta')).toBe(true);
    expect(editor.commands.inserirEnllacDeTargeta({ clau: 'pagina:anima', ruta: '/anima', titol: 'L’Ànima' })).toBe(true);
    let cos = desat();
    expect(grups(cos)).toHaveLength(1);
    expect(cos.querySelector('div[data-sdp-targeta="publicacio:1"]')).not.toBeNull();
    expect(cos.querySelector('div[data-sdp-targetes] + p a[href="/anima"]').textContent).toBe('L’Ànima');
    // En una parella, la Card triada tampoc ix del grup.
    triaTargeta('publicacio:1');
    editor.commands.inserirTargeta(T(2));
    triaTargeta('publicacio:2');
    expect(editor.commands.inserirEnllacDeTargeta({ clau: 'pagina:projecte', ruta: '/projecte', titol: 'El projecte' })).toBe(true);
    cos = desat();
    expect(grups(cos)[0].getAttribute('data-forma')).toBe('parella');
    expect(cos.querySelector('div[data-sdp-targetes] + p a[href="/projecte"]').textContent).toBe('El projecte');
    expect(cos.textContent).toContain('Intro');
    expect(cos.textContent).toContain('Final');
  });

  test('T26-05 · amb text triat, el text de la persona es conserva i es fa l’enllaç; una tria de més d’un bloc no s’esborra', () => {
    creaEditor('<p>Vegeu aquí la festa</p>');
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 7, 11)));
    expect(editor.commands.inserirEnllacDeTargeta({ clau: 'publicacio:9', ruta: '/mur/9', titol: 'La festa' })).toBe(true);
    expect(desat().querySelector('p').textContent).toBe('Vegeu aquí la festa');
    expect(desat().querySelector('p a[href="/mur/9"]').textContent).toBe('aquí');
    editor.commands.setContent('<p>Un</p><p>Dos</p>');
    editor.view.dispatch(editor.state.tr.setSelection(new AllSelection(editor.state.doc)));
    expect(editor.commands.inserirEnllacDeTargeta({ clau: 'pagina:anima', ruta: '/anima', titol: 'L’Ànima' })).toBe(true);
    const paragrafs = [...desat().querySelectorAll('p')].map((p) => p.textContent);
    expect(paragrafs).toEqual(['Un', 'DosL’Ànima']);
  });
});

/* G1-N02 (Gauntlet de l'arbre R9) · La llengua de l'original (l'atribut estàndard `lang` de la targeta) fa el
   viatge sencer per l'editor: es llig, es desa igual i passa pel sanejador; una llengua mal formada no
   entra; i una targeta sense llengua es desa com sempre, sense cap lang. */
describe('G1-N02 · la llengua de la targeta', () => {
  const AMB_LLENGUA = '<p>Abans</p><div data-sdp-targetes="" data-alineacio="dreta"><div data-sdp-targeta="publicacio:1" data-ruta="/mur/1" lang="ca" data-titol="La festa"></div></div><p>Després</p>';

  test('es llig, es desa igual i el sanejador la deixa', () => {
    creaEditor(AMB_LLENGUA);
    const html = editor.getHTML();
    expect(desat().querySelector('div[data-sdp-targeta]').getAttribute('lang')).toBe('ca');
    expect(sanitizeHtml(html)).toBe(html);
    editor.commands.setContent(html, { emitUpdate: false });
    expect(editor.getHTML()).toBe(html);
  });

  test('una llengua mal formada no entra, i sense llengua la targeta de sempre', () => {
    creaEditor(AMB_LLENGUA.replace('lang="ca"', 'lang="ca-ES x"'));
    expect(desat().querySelector('div[data-sdp-targeta]').hasAttribute('lang')).toBe(false);
    editor.commands.setContent('<p></p>');
    editor.commands.inserirTargeta(T(2));
    expect(desat().querySelector('[lang]')).toBeNull();
  });
});
