/* IDEA-59 / P1-72 (ordre del Mestre, 261101, punt 1) · La clau `guiaCos` de
   l'adaptador arriba a les extensions de TipTap (extensionsRiques) i el cos
   buit pinta el cartell guia dins del llenç (.sdp-editor-full-canvas
   .sdp-guia-cos). Un cos amb text no en porta; sense la clau, la crida de
   sempre (el Perfil, el catàleg). TipTap i les extensions són els de veres;
   només es captura la crida a extensionsRiques, com a
   DocumentEditor.placeholderCos.test.jsx. */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { GUIA_NOTA } from '../../sections/notes/llavorNota.js';
import { oblidaCossosEscrits, traduixGuia } from './richText/extensions/guiaCos.js';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

/* Gauntlet 261101 · X-C-notes (C-09) · `m.idioma`: sense, el traductor de
   reserva (la reserva valenciana); amb, el de veres. Cada pintat en fa un
   de nou, com un context que no el memoritza. */
const m = vi.hoisted(() => ({ extensions: null, idioma: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: m.idioma ? createTranslator(m.idioma) : (_clau, text) => text })
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
}));
vi.mock('./richText/extensions', async (importOriginal) => {
  const real = await importOriginal();
  m.extensions = vi.fn(real.extensionsRiques);
  return { ...real, extensionsRiques: (...args) => m.extensions(...args) };
});
import { DocumentEditor } from './DocumentEditor.jsx';

afterEach(() => {
  cleanup();
  m.extensions.mockClear();
  m.idioma = null;
  oblidaCossosEscrits();
});

const doc = (content, id = 'nota-guia') => ({ id, title: '', subtitle: '', lead: '', content, formattedDate: '01/01/26', formattedTime: '10:00' });
const adaptador = (content, extra = {}) => ({ document: doc(content), labels: [], seedContent: null, updateLocal: vi.fn(), saveRemote: vi.fn(), ...extra });
const guia = () => document.querySelector('.sdp-editor-full-canvas .sdp-guia-cos');
const cos = () => document.querySelector('.sdp-editor-full-canvas .ProseMirror');
const pinta = async (content, extra) => {
  const adapter = adaptador(content, extra);
  render(<DocumentEditor adapter={adapter} />);
  await act(async () => { await Promise.resolve(); });
  return adapter;
};

test('amb guiaCos i el cos buit: el llenç porta la guia, muda; el focus l’amaga i eixir sense escriure la torna', async () => {
  const adapter = await pinta('', { guiaCos: GUIA_NOTA });
  expect(m.extensions.mock.calls.at(-1)[0]).toMatchObject({ guiaCos: traduixGuia(GUIA_NOTA) });
  expect(guia()).not.toBeNull();
  expect(guia().getAttribute('aria-hidden')).toBe('true');
  expect(cos().getAttribute('aria-label')).toBe('Cos de la nota');
  expect(cos().getAttribute('aria-placeholder')).toBe(GUIA_NOTA.resum[1]);
  act(() => { fireEvent.focus(cos()); });
  expect(guia()).toBeNull();
  act(() => { fireEvent.blur(cos()); });
  expect(guia()).not.toBeNull();
  // Res no s'ha escrit ni desat: la guia no és contingut.
  expect(adapter.updateLocal).not.toHaveBeenCalled();
  expect(adapter.saveRemote).not.toHaveBeenCalled();
});

test('amb guiaCos i un cos escrit: cap guia', async () => {
  await pinta('<p>Hort de maig</p>', { guiaCos: GUIA_NOTA });
  expect(guia()).toBeNull();
});

test('sense la clau: la crida de sempre a les extensions i cap guia', async () => {
  await pinta('');
  const [opcions] = m.extensions.mock.calls.at(-1);
  expect(opcions).toEqual({ onImageUpload: undefined, ambTargetes: false, onToast: expect.any(Function) });
  expect(guia()).toBeNull();
  expect(cos().hasAttribute('aria-placeholder')).toBe(false);
});

/* Gauntlet 261101 · X-C-notes (C-09) · En anglés, la guia, el seu resum i el
   nom del cos ixen traduïts; i un traductor nou a cada pintat no refà les
   extensions (TipTap es reconstruiria a cada tecla): la memòria és la firma
   del text traduït. */
test('en anglés: la guia, el resum i el nom del cos, traduïts; les extensions no es refan a cada pintat', async () => {
  m.idioma = 'en';
  const adapter = adaptador('', { guiaCos: GUIA_NOTA });
  const { rerender } = render(<DocumentEditor adapter={adapter} />);
  await act(async () => { await Promise.resolve(); });
  expect(guia().querySelector('h3').textContent).toBe('Section title (H3)');
  expect(cos().getAttribute('aria-label')).toBe('Note body');
  expect(cos().getAttribute('aria-placeholder')).toMatch(/^Write your note here\./);
  const crides = m.extensions.mock.calls.length;
  rerender(<DocumentEditor adapter={{ ...adapter }} />);
  rerender(<DocumentEditor adapter={{ ...adapter }} />);
  expect(m.extensions.mock.calls.length).toBe(crides);
});
