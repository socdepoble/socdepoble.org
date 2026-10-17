/* Bloc 3.8 del Gauntlet (261016) · DocumentEditor amb les claus opcionals
   `registraInsercio` i `obreEmojis`, sobre el TipTap de veres i les
   extensions de veres:
     · registraInsercio rep inserix(text) i { pot }: inserix escriu un node de
       text al cursor del cos (i passa per updateLocal); tots dos diuen que no
       si no hi ha document, el cos no és editable, és dins d'un [inert] o la
       vista de drets és oberta; en desmuntar-se, es desregistra;
     · obreEmojis afig l'ordre «/» Emoji: lleva la «/» i l'obri, per una ref;
     · sense les claus, la crida de sempre a les extensions i cap clau al DOM. */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ editor: null, extensions: null }));
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>Llavor</p>' }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* El motor TipTap és el de veres: només es captura la instància i fora la barra. */
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: {}, exec: {} }; },
  UniversalRichTextToolbar: () => null
}));
/* Les extensions de veres, amb un espia de la crida. */
vi.mock('./richText/extensions', async (importOriginal) => {
  const real = await importOriginal();
  m.extensions = vi.fn(real.extensionsRiques);
  return { ...real, extensionsRiques: (...args) => m.extensions(...args) };
});
import { DocumentEditor } from './DocumentEditor.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  m.extensions.mockClear();
  m.editor = null;
});

const DOC = Object.freeze({ id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '<p>Hola</p>', formattedDate: '01/01/26', formattedTime: '10:00' });
const adaptador = (claus = {}) => ({ document: DOC, labels: [], seedContent: null, updateLocal: vi.fn(), saveRemote: vi.fn(), ...claus });
const pinta = (claus, opcions) => {
  const adapter = adaptador(claus);
  return { adapter, ...render(<DocumentEditor adapter={adapter} />, opcions) };
};
const ordres = () => m.editor.extensionManager.extensions.find((e) => e.name === 'sdpSlashMenu').options.ordres;
const registrat = (registra) => {
  const [inserix, { pot }] = registra.mock.calls.at(-1);
  return { inserix, pot };
};

test('sense les claus: la crida de sempre a les extensions, cap ordre «Emoji» i cap clau nova al DOM', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = pinta();
  expect(m.extensions).toHaveBeenLastCalledWith({ onImageUpload: undefined, ambTargetes: false, onToast: expect.any(Function) });
  expect(ordres().map((o) => o.id)).not.toContain('emoji');
  expect(container.querySelector('[registrainsercio], [obreemojis]')).toBeNull();
  expect(errors.mock.calls.map((c) => c.map(String).join(' ')).filter((t) => /registraInsercio|obreEmojis/.test(t))).toEqual([]);
});

test('registraInsercio: inserix escriu un node de text al cursor del cos, passa per updateLocal i torna true', () => {
  const desregistra = vi.fn();
  const registra = vi.fn(() => desregistra);
  const { adapter, unmount } = pinta({ registraInsercio: registra });
  expect(registra).toHaveBeenCalledWith(expect.any(Function), { pot: expect.any(Function) });
  const { inserix, pot } = registrat(registra);
  act(() => { m.editor.commands.setTextSelection(5); });
  expect(pot()).toBe(true);
  let fet;
  act(() => { fet = inserix('🍅'); });
  expect(fet).toBe(true);
  expect(m.editor.getHTML()).toBe('<p>Hola🍅</p>');
  expect(adapter.updateLocal).toHaveBeenLastCalledWith('d1', 'content', '<p>Hola🍅</p>');
  // Text, mai HTML: el que arriba s'escriu tal qual.
  act(() => { inserix('<b>x</b>'); });
  expect(m.editor.getHTML()).toBe('<p>Hola🍅&lt;b&gt;x&lt;/b&gt;</p>');
  // Un text buit no escriu res.
  expect(inserix('')).toBe(false);
  // En desmuntar-se, es desregistra.
  expect(desregistra).not.toHaveBeenCalled();
  unmount();
  expect(desregistra).toHaveBeenCalledTimes(1);
});

test('fora de la vista (dins d’un [inert], com el detall tapat del mestre-detall): cap inserció', () => {
  const tapat = document.body.appendChild(document.createElement('div'));
  tapat.setAttribute('inert', '');
  const registra = vi.fn();
  pinta({ registraInsercio: registra }, { container: tapat });
  const { inserix, pot } = registrat(registra);
  expect(pot()).toBe(false);
  expect(inserix('🍅')).toBe(false);
  expect(m.editor.getHTML()).toBe('<p>Hola</p>');
});

test('un cos que no és editable, la vista de drets oberta o l’estat buit: cap inserció', () => {
  const registra = vi.fn();
  const { container, unmount } = pinta({ registraInsercio: registra });
  const { inserix, pot } = registrat(registra);
  act(() => { m.editor.setEditable(false); });
  expect(pot()).toBe(false);
  expect(inserix('🍅')).toBe(false);
  act(() => { m.editor.setEditable(true); });
  expect(pot()).toBe(true);
  act(() => { fireEvent.click(container.querySelector('[data-sdp-drets]')); });
  expect(container.querySelector('section.sdp-drets')).not.toBeNull();
  expect(pot()).toBe(false);
  expect(inserix('🍅')).toBe(false);
  unmount();
  // Sense document: la benvinguda de lectura, i res a escriure.
  const buit = vi.fn();
  render(<DocumentEditor adapter={adaptador({ document: null, registraInsercio: buit })} />);
  expect(registrat(buit).pot()).toBe(false);
  expect(registrat(buit).inserix('🍅')).toBe(false);
});

test('obreEmojis: l’ordre «/» Emoji lleva la «/» i obri la graella; una funció nova no refà les extensions', () => {
  const obri = vi.fn();
  const { adapter, rerender } = pinta({ obreEmojis: obri });
  expect(m.extensions).toHaveBeenLastCalledWith({ onImageUpload: undefined, ambTargetes: false, onToast: expect.any(Function), obreEmojis: expect.any(Function) });
  expect(ordres().map((o) => o.id).slice(-1)).toEqual(['emoji']);
  const emoji = ordres().find((o) => o.id === 'emoji');
  expect(emoji).toMatchObject({ titol: 'Emoji' });
  act(() => { m.editor.commands.setContent('<p>Hola /</p>'); });
  act(() => { emoji.executa({ editor: m.editor, range: { from: 6, to: 7 } }); });
  expect(m.editor.getHTML()).toBe('<p>Hola </p>');
  expect(obri).toHaveBeenCalledTimes(1);
  const crides = m.extensions.mock.calls.length;
  const nova = vi.fn();
  rerender(<DocumentEditor adapter={{ ...adapter, obreEmojis: nova }} />);
  expect(m.extensions.mock.calls.length).toBe(crides);
  act(() => { ordres().find((o) => o.id === 'emoji').executa({ editor: m.editor, range: { from: 6, to: 6 } }); });
  expect(nova).toHaveBeenCalledTimes(1);
  expect(obri).toHaveBeenCalledTimes(1);
});
