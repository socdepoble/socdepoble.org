/* IDEA-41 (Llibre Mestre; Mestre 261028, Bloc H) · DocumentEditor amb la clau
   opcional `proposaCard` (el motor pur del Bloc, sections/notes/proposaCard.js),
   sobre el TipTap de veres:
     · sense la clau (o sense updateLocal), la barra no rep cap clau nova;
     · el botó va apagat quan no hi ha res a proposar;
     · un clic omple els camps buits pel camí de sempre (updateLocal i
       saveRemote) i lleva del cos les línies pujades, en un sol pas de
       l'historial: Cmd/Ctrl+Z (o «Desfés la proposta») el desfà sencer, amb
       els camps, i no s'enduu el que s'havia escrit just abans;
     · un camp que la persona ha tocat després no es torna arrere. */
import React, { useCallback, useMemo, useState } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ editor: null, barra: null, doc: null, updateLocal: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* El motor TipTap és el de veres: es captura la instància i les props de la barra. */
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: {}, exec: {} }; },
  UniversalRichTextToolbar: (props) => { m.barra = props; return null; }
}));
import { closeHistory } from '@tiptap/pm/history';
import { DocumentEditor } from './DocumentEditor.jsx';
import { proposaCard } from '../../sections/notes/proposaCard.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  m.editor = null;
  m.barra = null;
  m.doc = null;
});

const COS = '<p>La festa del poble</p><p>Tres dies de música.</p><p>Enguany al carrer Major.</p><p>La resta del text.</p>';
const DOC = Object.freeze({ id: 'd1', title: '', subtitle: '', lead: '', content: COS, formattedDate: '01/01/26', formattedTime: '10:00' });

/* Un Bloc de mentira: updateLocal escriu al document, com NotesContext. */
function Banc({ inicial = DOC, saveRemote, toast, motor = proposaCard, ambUpdateLocal = true }) {
  const [doc, setDoc] = useState(inicial);
  const updateLocal = useCallback((id, camp, valor) => setDoc((d) => (d.id === id ? { ...d, [camp]: valor } : d)), []);
  const adapter = useMemo(() => ({
    document: doc, labels: [], seedContent: null, saveRemote, proposaCard: motor,
    ...(ambUpdateLocal ? { updateLocal } : null)
  }), [doc, updateLocal, saveRemote, motor, ambUpdateLocal]);
  m.doc = doc;
  m.updateLocal = updateLocal;
  return <DocumentEditor adapter={adapter} onToast={toast} />;
}
const munta = (props = {}) => {
  const saveRemote = vi.fn();
  const toast = vi.fn();
  return { saveRemote, toast, ...render(<Banc saveRemote={saveRemote} toast={toast} {...props} />) };
};
const camps = () => ({ title: m.doc.title, subtitle: m.doc.subtitle, lead: m.doc.lead });
const proposa = () => act(() => { m.barra.onProposaCard(); });
/* Una pausa de la persona: el pas següent de l'historial ja no s'ajunta amb l'anterior. */
const pausa = () => act(() => { m.editor.chain().command(({ tr }) => { closeHistory(tr); return true; }).run(); });
const escriuAlFinal = (text) => act(() => { m.editor.commands.insertContentAt(m.editor.state.doc.content.size - 1, text); });

test('sense la clau, o sense updateLocal: la barra no rep cap clau nova', () => {
  const adapter = { document: DOC, labels: [], seedContent: null, updateLocal: vi.fn(), saveRemote: vi.fn() };
  const { container, unmount } = render(<DocumentEditor adapter={adapter} />);
  expect(Object.keys(m.barra).filter((clau) => /proposa/i.test(clau))).toEqual([]);
  expect(container.querySelector('[proposacard]')).toBeNull();
  unmount();
  munta({ ambUpdateLocal: false });
  expect(Object.keys(m.barra).filter((clau) => /proposa/i.test(clau))).toEqual([]);
});

test('el botó va encés si hi ha res a proposar i apagat si no (els camps plens, o el cos sense text)', () => {
  const { unmount } = munta();
  expect([m.barra.proposaCardDisabled, m.barra.proposaCardDesfer]).toEqual([false, false]);
  unmount();
  const plens = munta({ inicial: { ...DOC, title: 'T', subtitle: 'S', lead: 'E' } });
  expect(m.barra.proposaCardDisabled).toBe(true);
  plens.unmount();
  munta({ inicial: { ...DOC, content: '<p></p>' } });
  expect(m.barra.proposaCardDisabled).toBe(true);
});

test('un clic: els camps buits s’omplin per updateLocal i saveRemote, i el cos perd exactament les línies pujades', () => {
  const { saveRemote, toast } = munta();
  proposa();
  expect(camps()).toEqual({ title: 'La festa del poble', subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' });
  expect(saveRemote.mock.calls.filter(([, camp]) => camp !== 'content')).toEqual([
    ['d1', 'title', 'La festa del poble'], ['d1', 'subtitle', 'Tres dies de música'], ['d1', 'lead', 'Enguany al carrer Major.']
  ]);
  expect(m.editor.getHTML()).toBe('<p>La resta del text.</p>');
  expect(m.doc.content).toBe('<p>La resta del text.</p>');
  expect(toast).toHaveBeenCalledTimes(1);
  // Ara el mateix botó desfà la proposta.
  expect([m.barra.proposaCardDisabled, m.barra.proposaCardDesfer]).toEqual([false, true]);
});

test('«Desfés la proposta» torna el cos i els camps d’abans; el botó torna a proposar', () => {
  munta();
  proposa();
  proposa();
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
  expect([m.barra.proposaCardDisabled, m.barra.proposaCardDesfer]).toEqual([false, false]);
});

test('Cmd/Ctrl+Z desfà la proposta sencera en un pas (també els camps), i Cmd/Ctrl+Maj+Z la refà', () => {
  munta();
  proposa();
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
  act(() => { m.editor.commands.redo(); });
  expect(m.editor.getHTML()).toBe('<p>La resta del text.</p>');
  expect(camps()).toEqual({ title: 'La festa del poble', subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' });
});

test('un sol pas: el que s’ha escrit just abans no se’n va amb la proposta', () => {
  munta();
  act(() => { m.editor.commands.insertContentAt(m.editor.state.doc.content.size - 1, ' Fi'); });
  const escrit = m.editor.getHTML();
  expect(escrit).toContain('La resta del text. Fi');
  proposa();
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(escrit);
});

test('un camp que la persona canvia després de la proposta no es torna arrere en desfer-la', () => {
  munta();
  proposa();
  // La persona reescriu el títol pel canal de sempre (updateLocal).
  act(() => { m.updateLocal('d1', 'title', 'Festes de la Torre'); });
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual({ title: 'Festes de la Torre', subtitle: '', lead: '' });
});

test('el que no es pot proposar en el moment del clic avisa i no toca res', () => {
  const { toast, saveRemote } = munta({ motor: () => ({ motiu: 'res', camps: {}, cos: COS }) });
  proposa();
  expect(m.editor.getHTML()).toBe(COS);
  expect(saveRemote).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledTimes(1);
});

/* Revisió adversarial 261028 · Els dos defectes de desfer que van trobar les
   revisions, les dues pauses de l'historial que cap prova no matava i la
   previsió d'un cos desat que TipTap normalitza. */
test('«Desfés la proposta» desfà la proposta encara que damunt hi haja passos que tornen al mateix cos (escriure i esborrar)', () => {
  munta();
  proposa();
  const despres = m.editor.getHTML();
  escriuAlFinal(' x');
  pausa();
  const fi = m.editor.state.doc.content.size - 1;
  act(() => { m.editor.commands.deleteRange({ from: fi - 2, to: fi }); });
  expect(m.editor.getHTML()).toBe(despres);
  expect(m.barra.proposaCardDesfer).toBe(true);
  proposa();
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
  // El desfer és un pas propi: Cmd/Ctrl+Z torna a aplicar la proposta, amb els camps.
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(despres);
  expect(camps()).toEqual({ title: 'La festa del poble', subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' });
});

test('el que s’escriu just després de «Desfés la proposta» és un pas a banda: Cmd/Ctrl+Z no torna a aplicar la proposta', () => {
  munta();
  proposa();
  proposa();
  expect(m.editor.getHTML()).toBe(COS);
  escriuAlFinal(' fi');
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
});

test('el que s’escriu just després de la proposta és un pas a banda: Cmd/Ctrl+Z no se l’enduu amb la proposta', () => {
  munta();
  proposa();
  const despres = m.editor.getHTML();
  escriuAlFinal(' fi');
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(despres);
  expect(camps().title).toBe('La festa del poble');
});

test('dues propostes i Cmd/Ctrl+Z fins al principi: també es buiden els camps de la primera (cap línia al cos i al camp alhora)', () => {
  const llarga = 'Una primera línia molt llarga que passa dels cent vint caràcters del títol i que per això el motor la puja a l’entradilla sencera.';
  expect(llarga.length).toBeGreaterThan(120);
  const cos = `<p>${llarga}</p><p>Segon</p><p>Tercer</p>`;
  munta({ inicial: { ...DOC, content: cos } });
  proposa();
  expect(camps()).toEqual({ title: '', subtitle: '', lead: llarga });
  escriuAlFinal(' fi');
  expect([m.barra.proposaCardDisabled, m.barra.proposaCardDesfer]).toEqual([false, false]);
  proposa();
  expect(camps()).toEqual({ title: 'Segon', subtitle: 'Tercer fi', lead: llarga });
  act(() => { m.editor.commands.undo(); });
  expect(camps()).toEqual({ title: '', subtitle: '', lead: llarga });
  act(() => { m.editor.commands.undo(); });
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(cos);
  expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
  // I tot es refà en el mateix ordre.
  act(() => { m.editor.commands.redo(); });
  expect(camps()).toEqual({ title: '', subtitle: '', lead: llarga });
  act(() => { m.editor.commands.redo(); });
  act(() => { m.editor.commands.redo(); });
  expect(camps()).toEqual({ title: 'Segon', subtitle: 'Tercer fi', lead: llarga });
});

test('un cos desat que TipTap normalitza (text pla, <div>, <section>): el botó va encés abans de la primera tecla, com el clic', () => {
  for (const content of ['La festa del poble', '<div><p>La festa del poble</p><p>Tres dies</p></div>', '<section><h2>La festa</h2><p>Tres dies</p></section>']) {
    const { unmount } = munta({ inicial: { ...DOC, content } });
    expect(m.barra.proposaCardDisabled, content).toBe(false);
    proposa();
    expect(m.doc.title, content).toMatch(/^La festa/);
    unmount();
  }
  // El que tampoc no té res a proposar normalitzat continua apagat.
  munta({ inicial: { ...DOC, content: '<div><ul><li><p>U</p></li></ul><p>Text</p></div>' } });
  expect(m.barra.proposaCardDisabled).toBe(true);
});

/* Revisió de rendiment 261028 · Un cos llarg que comença per una llista (el
   motor diu «res») i porta una imatge en data: es normalitza una sola vegada
   per cos: teclejar al títol no el torna a passar sencer per cap parser. */
test('teclejar als camps amb un cos llarg no torna a llegir el cos sencer', async () => {
  const gros = `<ul><li>una llista primer</li></ul><p><img src="data:image/png;base64,${'A'.repeat(300_000)}"></p><p>Text</p>`;
  munta({ inicial: { ...DOC, content: gros } });
  const mides = [];
  const original = window.DOMParser.prototype.parseFromString;
  vi.spyOn(window.DOMParser.prototype, 'parseFromString').mockImplementation(function (text, tipus) {
    mides.push(text.length);
    return original.call(this, text, tipus);
  });
  for (const titol of ['a', 'ab', 'abc']) {
    await act(async () => { m.updateLocal('d1', 'title', titol); });
  }
  expect(mides.length).toBeGreaterThan(0);
  expect(mides.filter((mida) => mida > 100_000)).toEqual([]);
});
