/* Gauntlet 261017 (Gauntlet Extrem, F46/F47; auditoria Codex 261017_1526,
   C01 i C02) · Regressions permanents sobre el TipTap DE VERES (el hook, el
   DocumentEditor i les extensions de veres), amb la reproducció de Codex:
     · C01: una nota desada amb l'H3 passat a H2, o amb la llista numerada
       començant en 10, no és la plantilla verge: focus i blur no l'esborren
       ni desen res;
     · C02: la plantilla amb una fotografia o un enllaç propis no és la llavor
       per a la publicació;
     · consum únic: només es buida la càrrega verge, i una sola vegada;
     · desfer (Cmd/Ctrl+Z) no torna mai la plantilla;
     · deixar anar text sobre el cos verge l'inserix al cos buit, sense cap
       RangeError. */
import React from 'react';
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDocument } from '@tiptap/core';

const m = vi.hoisted(() => ({ editor: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* El motor TipTap és el de veres: només es captura la instància i fora la barra. */
vi.mock('../../components/universal/richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: {}, exec: {} }; },
  UniversalRichTextToolbar: () => null
}));
import { DocumentEditor } from '../../components/universal/DocumentEditor.jsx';
import { esLlavorVerge, oblidaLlavorsConsumides, useUniversalRichText } from '../../components/universal/richText/useUniversalRichText.js';
import { executa } from '../../components/universal/richText/tiptapToolbarAdapter.js';
import { LLAVOR_NOTA, LLAVORS_NOTA, esLlavorDeNota } from './llavorNota.js';

/* Ordre del Mestre (261021, pla 261021_0015 §13, P1-02) · El document que ja
   ha consumit la llavor es recorda pel seu id durant la pàgina; cada prova
   munta el seu 'd1' com una nota nova. */
afterEach(() => {
  cleanup();
  m.editor = null;
  oblidaLlavorsConsumides();
});

const compacta = (html) => html.replace(/>\s+</g, '><');
const senseFinalBuit = (html) => html.replace(/(?:<p><\/p>)+$/, '');
const ambH2 = (html) => html.replace('<h3>', '<h2>').replace('</h3>', '</h2>');
const ambInici10 = (html) => html.replace('<ol>', '<ol start="10">');

const adaptador = (content, claus = {}) => ({
  document: { id: 'd1', title: 'Títol', subtitle: '', lead: '', content, formattedDate: '01/01/26', formattedTime: '10:00' },
  labels: [], seedContent: LLAVORS_NOTA, updateLocal: vi.fn(), saveRemote: vi.fn(), ...claus
});
const pinta = (content, claus = {}) => {
  const adapter = adaptador(content, claus);
  const vista = render(<DocumentEditor adapter={adapter} />);
  return { adapter, vista };
};
const enfoca = () => act(() => { fireEvent.focus(m.editor.view.dom); });
const desenfoca = () => act(() => { fireEvent.blur(m.editor.view.dom); });
const desatsDelCos = (fn) => fn.mock.calls.filter(([, camp]) => camp === 'content');

/* ── C01 i C02: la reproducció de Codex, ara verda ─────────────────────── */
describe('reproducció de Codex (261017_1526): el hook de veres, focus i blur', () => {
  const extensions = [];
  const munta = (content) => {
    const desats = [];
    const { result } = renderHook(() => useUniversalRichText({
      id: 'stored-note', content, seedContent: LLAVORS_NOTA, extensions, onSave: (...args) => desats.push(args)
    }));
    return { editor: result.current, desats };
  };

  test.each([
    ['l’H3 passat a H2', ambH2(LLAVOR_NOTA)],
    ['la llista numerada començant en 10', ambInici10(LLAVOR_NOTA)],
    ['un text propi (control)', '<p>El meu contingut guardat</p>']
  ])('una nota desada amb %s es conserva: focus i blur no l’esborren ni desen res', async (_cas, content) => {
    const { editor, desats } = munta(content);
    const abans = editor.getHTML();
    expect(abans).not.toBe('<p></p>');
    await act(async () => {
      editor.emit('focus', { editor, event: new FocusEvent('focus') });
      editor.emit('blur', { editor, event: new FocusEvent('blur') });
    });
    expect(editor.getHTML()).toBe(abans);
    expect(desats).toEqual([]);
  });

  test.each([
    ['una fotografia pròpia', `${LLAVOR_NOTA}<p><img src="/assets/fotos/javi-llinares-perfil-1200px.jpg" alt="La meua foto"></p>`, false],
    ['un enllaç propi', LLAVOR_NOTA.replace('Una llista amb pics', '<a href="https://example.org/personal">Una llista amb pics</a>'), false],
    ['un text propi (control)', `${LLAVOR_NOTA}<p>Text meu</p>`, false],
    ['res (control: la plantilla verge)', LLAVOR_NOTA, true]
  ])('la plantilla amb %s: la publicació hi veu la llavor només si és verge', (_cas, content, llavor) => {
    expect(esLlavorDeNota(content)).toBe(llavor);
  });
});

/* ── C01 sobre el DocumentEditor: atributs, normalització i autodesament ── */
describe('C01 · una nota desada amb un atribut canviat no és la plantilla', () => {
  test.each([
    ['H3 passat a H2, escrita', ambH2(LLAVOR_NOTA)],
    ['H3 passat a H2, tal com la desa l’editor', ambH2(compacta(LLAVOR_NOTA))],
    ['llista començant en 10, escrita', ambInici10(LLAVOR_NOTA)],
    ['llista començant en 10, tal com la desa l’editor', ambInici10(compacta(LLAVOR_NOTA))]
  ])('%s: focus, blur i desmuntar no l’esborren ni desen res', (_cas, content) => {
    const { adapter, vista } = pinta(content);
    const abans = m.editor.getHTML();
    expect(esLlavorVerge(m.editor, LLAVORS_NOTA)).toBe(false);
    enfoca();
    desenfoca();
    expect(m.editor.getHTML()).toBe(abans);
    vista.unmount();
    // Ni el cos buit ni el paràgraf final del motor: cap escriptura sense una tecla.
    expect(desatsDelCos(adapter.updateLocal)).toEqual([]);
    expect(desatsDelCos(adapter.saveRemote)).toEqual([]);
  });

  test('la plantilla verge de veres, en canvi, s’esvaeix al primer focus i el cos buit es desa una vegada en desmuntar', () => {
    const { adapter, vista } = pinta(LLAVOR_NOTA);
    enfoca();
    expect(m.editor.isEmpty).toBe(true);
    expect(adapter.updateLocal).toHaveBeenLastCalledWith('d1', 'content', '<p></p>');
    vista.unmount();
    expect(desatsDelCos(adapter.saveRemote)).toEqual([['d1', 'content', '<p></p>']]);
  });
});

/* ── Desfer: la plantilla no és cap pas de l'historial ─────────────────── */
describe('D1 · desfer no torna mai la plantilla', () => {
  test.each([
    ['la plantilla nova (escrita)', LLAVOR_NOTA],
    ['la plantilla desada per l’editor', compacta(LLAVOR_NOTA)]
  ])('%s: després de l’esvaïment no hi ha res a desfer', (_cas, content) => {
    pinta(content);
    enfoca();
    expect(m.editor.isEmpty).toBe(true);
    expect(m.editor.can().undo()).toBe(false);
    act(() => { m.editor.commands.undo(); });
    expect(m.editor.getHTML()).toBe('<p></p>');
    expect(esLlavorVerge(m.editor, LLAVORS_NOTA)).toBe(false);
  });

  test.each(['titol', 'llista', 'citacio'])('el botó «%s» de la barra sobre la plantilla, i desfer: el cos buit, mai la plantilla', (id) => {
    pinta(LLAVOR_NOTA);
    act(() => { executa(m.editor, id); });
    act(() => { m.editor.commands.undo(); });
    expect(m.editor.getHTML()).toBe('<p></p>');
    expect(m.editor.can().undo()).toBe(false);
  });

  test('un contingut que arriba de fora (la sincronització) tampoc no és un pas de desfer', () => {
    const extensions = [];
    const { result, rerender } = renderHook(({ content }) => useUniversalRichText({ id: 'n1', content, extensions }), {
      initialProps: { content: '<p>Primera versió</p>' }
    });
    rerender({ content: '<p>Segona versió, del servidor</p>' });
    expect(result.current.getHTML()).toBe('<p>Segona versió, del servidor</p>');
    expect(result.current.can().undo()).toBe(false);
  });
});

/* ── Consum únic de la condició de verge ───────────────────────────────── */
describe('consum únic · només es buida la càrrega verge, una vegada', () => {
  test('el cos que la persona torna a deixar igual que la plantilla no s’esborra en un segon focus', () => {
    const { adapter } = pinta(LLAVOR_NOTA);
    enfoca();
    expect(m.editor.isEmpty).toBe(true);
    // La persona hi torna a escriure la plantilla, tal qual.
    act(() => { m.editor.commands.setContent(LLAVOR_NOTA); });
    expect(esLlavorVerge(m.editor, LLAVORS_NOTA)).toBe(true);
    desenfoca();
    const escrit = m.editor.getHTML();
    enfoca();
    expect(m.editor.getHTML()).toBe(escrit);
    expect(adapter.updateLocal).toHaveBeenLastCalledWith('d1', 'content', escrit);
  });

  test('una ordre de la barra després del primer focus no buida res', () => {
    pinta(LLAVOR_NOTA);
    enfoca();
    act(() => { m.editor.commands.setContent(LLAVOR_NOTA); });
    act(() => { executa(m.editor, 'negreta'); });
    expect(m.editor.getHTML()).toContain('Títol de secció (H3)');
  });

  test('la llavor que torna per la sincronització després del primer gest no es torna a posar (la nota preparada ja creada)', () => {
    const { vista } = pinta(LLAVOR_NOTA);
    enfoca();
    desenfoca();
    expect(m.editor.isEmpty).toBe(true);
    // L'aplicació hi posa el cos buit i, després, el servidor torna la llavor.
    vista.rerender(<DocumentEditor adapter={adaptador('<p></p>')} />);
    vista.rerender(<DocumentEditor adapter={adaptador(compacta(LLAVOR_NOTA))} />);
    expect(m.editor.getHTML()).toBe('<p></p>');
    // Un contingut de veres del servidor sí que arriba, i no és cap pas de desfer.
    vista.rerender(<DocumentEditor adapter={adaptador('<p>Del servidor</p>')} />);
    expect(m.editor.getHTML()).toBe('<p>Del servidor</p>');
    expect(m.editor.can().undo()).toBe(false);
  });

  test('un altre document (un altre id) en el mateix editor és una càrrega nova: la seua plantilla verge s’esvaeix', () => {
    const { vista } = pinta(LLAVOR_NOTA);
    enfoca();
    desenfoca();
    const segona = adaptador(LLAVOR_NOTA);
    segona.document = { ...segona.document, id: 'd2' };
    vista.rerender(<DocumentEditor adapter={segona} />);
    expect(esLlavorVerge(m.editor, LLAVORS_NOTA)).toBe(true);
    enfoca();
    expect(m.editor.isEmpty).toBe(true);
    expect(segona.updateLocal).toHaveBeenLastCalledWith('d2', 'content', '<p></p>');
  });
});

/* ── Deixar anar text sobre la plantilla verge ─────────────────────────── */
describe('D3 · deixar anar sobre el cos verge (sense focus)', () => {
  /* ProseMirror crida handleDrop amb el tros ja llegit (input.ts · handleDrop);
     jsdom no té posAtCoords ni DataTransfer: es crida la mateixa propietat. */
  const deixaAnar = (html, { mogut = false, obert = true } = {}) => {
    const doc = createDocument(html, m.editor.schema);
    const tros = obert ? doc.slice(1, doc.content.size - 1) : doc.slice(0, doc.content.size);
    let fet;
    act(() => { fet = m.editor.view.someProp('handleDrop', (f) => f(m.editor.view, new Event('drop'), tros, mogut)); });
    return fet;
  };

  test('un text arrossegat d’una altra finestra queda sol al cos buit, sense cap error, i es desa', () => {
    const { adapter } = pinta(LLAVOR_NOTA);
    expect(m.editor.isFocused).toBe(false);
    let fet;
    expect(() => { fet = deixaAnar('<p>Text arrossegat</p>'); }).not.toThrow();
    expect(fet).toBe(true);
    expect(senseFinalBuit(m.editor.getHTML())).toBe('<p>Text arrossegat</p>');
    expect(adapter.updateLocal).toHaveBeenLastCalledWith('d1', 'content', m.editor.getHTML());
    // El focus que arriba després ja no esborra res, i desfer lleva el text, no torna la plantilla.
    enfoca();
    expect(senseFinalBuit(m.editor.getHTML())).toBe('<p>Text arrossegat</p>');
    act(() => { m.editor.commands.undo(); });
    expect(esLlavorVerge(m.editor, LLAVORS_NOTA)).toBe(false);
    expect(m.editor.getHTML()).not.toContain('Títol de secció');
  });

  /* El camí de veres de ProseMirror (editHandlers.drop), amb un esdeveniment
     «drop». jsdom no té elementFromPoint ni getClientRects: es posen els
     mínims perquè posAtCoords trobe el primer paràgraf, i es tornen a llevar.
     Abans, l'oient petava amb un RangeError («Applying a mismatched
     transaction») i el cos quedava buit, sense el text. */
  test('un «drop» de veres sobre la plantilla: cap RangeError, i el text queda sol al cos', () => {
    pinta(LLAVOR_NOTA);
    const dom = m.editor.view.dom;
    const caixa = () => ({ left: 0, right: 10, top: 0, bottom: 10, width: 10, height: 10, x: 0, y: 0 });
    const posa = (objecte, nom, valor) => {
      const abans = Object.getOwnPropertyDescriptor(objecte, nom);
      Object.defineProperty(objecte, nom, { configurable: true, writable: true, value: valor });
      return () => (abans ? Object.defineProperty(objecte, nom, abans) : delete objecte[nom]);
    };
    const restaura = [
      posa(document, 'elementFromPoint', () => dom.querySelector('p')),
      posa(Range.prototype, 'getClientRects', () => [caixa()]),
      posa(Range.prototype, 'getBoundingClientRect', caixa),
      posa(Element.prototype, 'getClientRects', () => [caixa()])
    ];
    const errors = [];
    const recull = (event) => errors.push(String(event.error));
    window.addEventListener('error', recull);
    try {
      const drop = Object.assign(new Event('drop', { bubbles: true, cancelable: true }), {
        clientX: 5,
        clientY: 5,
        dataTransfer: { getData: (tipus) => (tipus === 'text/plain' ? 'Text arrossegat' : ''), types: ['text/plain'], files: [] }
      });
      act(() => { dom.dispatchEvent(drop); });
      expect(errors).toEqual([]);
      expect(drop.defaultPrevented).toBe(true);
      expect(senseFinalBuit(m.editor.getHTML())).toBe('<p>Text arrossegat</p>');
    } finally {
      window.removeEventListener('error', recull);
      restaura.forEach((torna) => torna());
    }
  });

  test('uns blocs sencers (un títol i un paràgraf) també entren sols al cos buit', () => {
    pinta(LLAVOR_NOTA);
    expect(deixaAnar('<h2>Collita de maig</h2><p>Tomaques i bajoques</p>', { obert: false })).toBe(true);
    expect(senseFinalBuit(m.editor.getHTML())).toBe('<h2>Collita de maig</h2><p>Tomaques i bajoques</p>');
  });

  test.each([
    ['un cos amb text propi', '<p>Hola, poble</p>', {}],
    ['un moviment intern', LLAVOR_NOTA, { mogut: true }]
  ])('%s: segueix el camí de sempre (handleDrop no el pren)', (_cas, content, opcions) => {
    pinta(content);
    const abans = m.editor.getHTML();
    expect(deixaAnar('<p>Text arrossegat</p>', opcions)).toBeFalsy();
    expect(m.editor.getHTML()).toBe(abans);
  });

  test('un arrossegament sense contingut no consumix la plantilla: el primer focus encara l’esvaeix', () => {
    pinta(LLAVOR_NOTA);
    let fet;
    act(() => { fet = m.editor.view.someProp('handleDrop', (f) => f(m.editor.view, new Event('drop'), m.editor.state.doc.slice(0, 0), false)); });
    expect(fet).toBeFalsy();
    expect(esLlavorVerge(m.editor, LLAVORS_NOTA)).toBe(true);
    enfoca();
    expect(m.editor.isEmpty).toBe(true);
  });
});
