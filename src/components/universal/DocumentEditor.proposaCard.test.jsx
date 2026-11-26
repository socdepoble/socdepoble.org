/* IDEA-41 / IDEA-359 (v1.2.26 · Pedra Seca 2.0 · IAIA Maquetadora Editorial
   100 % no-destructiva) · DocumentEditor amb `proposaCard` sobre TipTap real:
     · sense la clau (o sense updateLocal), la barra no rep cap clau nova;
     · el botó va apagat quan no hi ha res a proposar;
     · un clic omple H1, H2 i Entradeta sense tocar NI UN BYTE del cos original
       (Esmena Sagrada de No-Destrucció);
     · «Desfés la maquetació» restaura només els camps no editats a mà i deixa
       el cos intacte;
     · també conserva compatibilitat d'historial amb motors que muten el cos. */
import React, { useCallback, useMemo, useState } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ editor: null, barra: null, doc: null, updateLocal: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
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

test('IDEA-359 (Esmena Sagrada de No-Destrucció): un clic omple H1/H2/Entradeta i deixa el cos 100 % INTACTE', () => {
  const { saveRemote, toast } = munta();
  proposa();
  expect(camps()).toEqual({ title: 'La festa del poble', subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' });
  expect(saveRemote.mock.calls.filter(([, camp]) => camp !== 'content')).toEqual([
    ['d1', 'title', 'La festa del poble'], ['d1', 'subtitle', 'Tres dies de música'], ['d1', 'lead', 'Enguany al carrer Major.']
  ]);
  expect(saveRemote.mock.calls.filter(([, camp]) => camp === 'content')).toEqual([]);
  expect(m.editor.getHTML()).toBe(COS);
  expect(m.doc.content).toBe(COS);
  expect(toast).toHaveBeenCalledTimes(1);
  expect([m.barra.proposaCardDisabled, m.barra.proposaCardDesfer]).toEqual([false, true]);
});

test('«Desfés la maquetació» torna els camps d’abans sense tocar el cos, i el botó torna a maquetar', () => {
  munta();
  proposa();
  proposa();
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
  expect([m.barra.proposaCardDisabled, m.barra.proposaCardDesfer]).toEqual([false, false]);
});

/* Gauntlet G26 (Lent 1 punt 19) · La conducta nova, fixada: la maquetació
   no és cap pas de l'historial del cos (Esmena Sagrada, Llibre Mestre
   l. 3721: el cos no es toca), i Cmd/Ctrl+Z i Cmd/Ctrl+Maj+Z desfan i refan
   només el que la persona ha escrit, sense tornar arrere cap camp. */
test('IDEA-359 · Cmd/Ctrl+Z després de maquetar no toca ni els camps ni el cos', () => {
  munta();
  proposa();
  const maquetats = camps();
  expect(maquetats).toEqual({ title: 'La festa del poble', subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' });
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual(maquetats);
  act(() => { m.editor.commands.redo(); });
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual(maquetats);
  expect(m.barra.proposaCardDesfer).toBe(true);
});

test('IDEA-359 · desfer i refer el que s’havia escrit abans, o escriure i esborrar després, tampoc no torna cap camp', () => {
  munta();
  escriuAlFinal(' Fi');
  const escrit = m.editor.getHTML();
  pausa();
  proposa();
  const maquetats = camps();
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual(maquetats);
  act(() => { m.editor.commands.redo(); });
  expect(m.editor.getHTML()).toBe(escrit);
  expect(camps()).toEqual(maquetats);
  escriuAlFinal(' x');
  pausa();
  const fi = m.editor.state.doc.content.size - 1;
  act(() => { m.editor.commands.deleteRange({ from: fi - 2, to: fi }); });
  expect(m.editor.getHTML()).toBe(escrit);
  expect(camps()).toEqual(maquetats);
});

test('IDEA-359 · «Desfés la maquetació» torna els tres camps exactes d’abans (també els buits amb <br> o &nbsp;) i el cos no es mou', () => {
  const abans = { title: '', subtitle: '<br>', lead: '&nbsp;' };
  const { saveRemote } = munta({ inicial: { ...DOC, ...abans } });
  proposa();
  expect(camps()).toEqual({ title: 'La festa del poble', subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' });
  proposa();
  expect(camps()).toEqual(abans);
  expect(m.editor.getHTML()).toBe(COS);
  expect(saveRemote.mock.calls.filter(([, camp]) => camp === 'content')).toEqual([]);
  expect([m.barra.proposaCardDisabled, m.barra.proposaCardDesfer]).toEqual([false, false]);
});

/* Gauntlet G26 (Lent 1 punt 19) · «Desfés la maquetació» caduca: viu mentre algun camp diu encara el que s'hi
   va pujar. Reescrits (A) o buidats (F) tots, el botó torna a «Maqueta la targeta» i el clic no desfà res. */
test('A · reescrits a mà tots els camps pujats, «Desfés» caduca i el clic no torna cap camp ni toca el cos', () => {
  munta();
  proposa();
  const pujats = Object.keys(camps()).filter((camp) => m.doc[camp]);
  expect(pujats.length).toBeGreaterThan(0);
  expect(m.barra.proposaCardDesfer).toBe(true);
  for (const camp of pujats) act(() => { m.updateLocal('d1', camp, `Escrit a mà (${camp})`); });
  expect(m.barra.proposaCardDesfer).toBe(false);
  const reescrits = camps();
  proposa();
  expect(camps()).toEqual(reescrits);
  expect(m.editor.getHTML()).toBe(COS);
});

test('F · buidats a mà tots els camps pujats, «Desfés» caduca i el clic torna a maquetar amb el cos idèntic', () => {
  munta();
  proposa();
  const primera = camps();
  for (const camp of Object.keys(primera).filter((clau) => primera[clau])) act(() => { m.updateLocal('d1', camp, ''); });
  expect(m.barra.proposaCardDesfer).toBe(false);
  proposa();
  expect(camps()).toEqual(primera);
  expect(m.editor.getHTML()).toBe(COS);
  expect(m.barra.proposaCardDesfer).toBe(true);
});

test('un camp que la persona canvia després de la maquetació no es torna arrere en desfer-la', () => {
  munta();
  proposa();
  act(() => { m.updateLocal('d1', 'title', 'Festes de la Torre'); });
  proposa();
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual({ title: 'Festes de la Torre', subtitle: '', lead: '' });
});

/* Gauntlet G26 (Lent 1 punt 11) · IDEA-359.2 (Llibre Mestre l. 3701): el
   títol deduït no es talla a mitja frase. Sense cap «,» ni «:» abans de 88
   caràcters, cap títol (ni subtítol); amb un tall bo, H1, H2 i Entradeta. */
test('IDEA-359: text enganxat «a saco» (> 120 chars amb **negretes**) proposa la targeta neta preservant el cos intacte, sense cap títol tallat a mitja frase', () => {
  const cosLlarg = '<p>La **Fira de Tardor de la Torre** obri dissabte a les 10 hores a la plaça Major amb productes de proximitat, música en directe i parades d’artesania local per a totes les famílies. Hi participen més de trenta productores de la comarca.</p><p>Diumenge hi haurà contacontes i ruta pel poble.</p>';
  const { unmount } = munta({ inicial: { ...DOC, content: cosLlarg } });
  proposa();
  expect(m.editor.getHTML()).toBe(cosLlarg);
  expect([m.doc.title, m.doc.subtitle]).toEqual(['', '']);
  expect(m.doc.lead.length).toBeGreaterThan(20);
  expect(m.doc.lead).not.toContain('**');
  unmount();
  const ambTall = '<p>La **Fira de Tardor**, a la Torre: dissabte a les 10 hores obri a la plaça Major amb productes de proximitat i música en directe. Hi participen més de trenta productores de la comarca.</p><p>Diumenge hi haurà contacontes i ruta pel poble.</p>';
  munta({ inicial: { ...DOC, content: ambTall } });
  proposa();
  expect(m.editor.getHTML()).toBe(ambTall);
  /* Pendent del Mestre (pendents_mestre de P3; Gauntlet G26, Lent 2 punt 4): l'entradeta pot començar amb les paraules del títol deduït. */
  expect(camps()).toEqual({
    title: 'La Fira de Tardor',
    subtitle: 'Hi participen més de trenta productores de la comarca',
    lead: 'La Fira de Tardor, a la Torre: dissabte a les 10 hores obri a la plaça Major amb productes de proximitat i música en directe.'
  });
});

test('el que no es pot proposar en el moment del clic avisa i no toca res', () => {
  const { toast, saveRemote } = munta({ motor: () => ({ motiu: 'res', camps: {}, cos: COS }) });
  proposa();
  expect(m.editor.getHTML()).toBe(COS);
  expect(saveRemote).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledTimes(1);
});

test('compatibilitat amb motor de repartiment (conservaCos: false): Cmd/Ctrl+Z desfà cos i camps en un sol pas', () => {
  const motorRepartiment = (contingut, opcions) => proposaCard(contingut, { ...opcions, conservaCos: false });
  const { toast } = munta({ motor: motorRepartiment });
  proposa();
  expect(m.editor.getHTML()).toBe('<p>La resta del text.</p>');
  /* Llei 0 · Un motor que reescriu el cos no diu «sense tocar el cos». */
  expect(toast).not.toHaveBeenCalledWith('Targeta maquetada sense tocar el cos.');
  expect(camps()).toEqual({ title: 'La festa del poble', subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' });
  act(() => { m.editor.commands.undo(); });
  expect(m.editor.getHTML()).toBe(COS);
  expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
  act(() => { m.editor.commands.redo(); });
  expect(m.editor.getHTML()).toBe('<p>La resta del text.</p>');
  expect(camps()).toEqual({ title: 'La festa del poble', subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' });
});

test('un cos desat que TipTap normalitza (text pla, <div>, <section>): el botó va encés abans de la primera tecla, com el clic', () => {
  for (const content of ['La festa del poble', '<div><p>La festa del poble</p><p>Tres dies</p></div>', '<section><h2>La festa</h2><p>Tres dies</p></section>']) {
    const { unmount } = munta({ inicial: { ...DOC, content } });
    expect(m.barra.proposaCardDisabled, content).toBe(false);
    proposa();
    expect(m.doc.title, content).toMatch(/^La festa/);
    unmount();
  }
  munta({ inicial: { ...DOC, content: '<div><ul><li><p>U</p></li></ul><p>Text</p></div>' } });
  expect(m.barra.proposaCardDisabled).toBe(true);
});

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
