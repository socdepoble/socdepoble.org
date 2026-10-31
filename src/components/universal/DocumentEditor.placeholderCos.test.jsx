/* P1-59 (a) (Llibre Mestre, Fita 23; guàrdia nocturna 261030, Fase 3) · La
   clau `placeholderCos` de l'adaptador arriba a les extensions de TipTap
   (extensionsRiques) i el cos buit pinta el text fantasma dins del llenç
   (.sdp-editor-full-canvas p[data-placeholder]). Sense la clau, la crida de
   sempre i cap atribut. TipTap i les extensions són els de veres; només es
   captura la crida a extensionsRiques, com a DocumentEditor.exif.test.jsx. */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ extensions: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
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
});

const TEXT = 'Este és el teu perfil personal. Crea l’empresa amb NOVA ORG.';
const doc = (content) => ({ id: 'd1', title: 'Pep', subtitle: '', lead: '', content, formattedDate: '01/01/26', formattedTime: '10:00' });
const adaptador = (content, extra = {}) => ({ document: doc(content), labels: [], seedContent: null, updateLocal: vi.fn(), saveRemote: vi.fn(), ...extra });
const fantasma = () => document.querySelector('.sdp-editor-full-canvas p[data-placeholder]');
const pinta = async (content, extra) => {
  render(<DocumentEditor adapter={adaptador(content, extra)} />);
  await act(async () => { await Promise.resolve(); });
};

test('amb placeholderCos i el cos buit: el primer paràgraf del llenç porta el text fantasma', async () => {
  await pinta('', { placeholderCos: TEXT });
  expect(m.extensions.mock.calls.at(-1)[0]).toMatchObject({ placeholderCos: TEXT });
  expect(fantasma()?.getAttribute('data-placeholder')).toBe(TEXT);
});

test('amb placeholderCos i un cos escrit: cap fantasma', async () => {
  await pinta('<p>Hola, sóc el Pep</p>', { placeholderCos: TEXT });
  expect(fantasma()).toBeNull();
});

test.each([['sense la clau', {}], ['un text buit', { placeholderCos: '   ' }], ['un valor que no és text', { placeholderCos: 7 }]])(
  '%s: la crida de sempre a les extensions i cap atribut',
  async (_cas, extra) => {
    await pinta('', extra);
    const [opcions] = m.extensions.mock.calls.at(-1);
    expect(opcions).toEqual({ onImageUpload: undefined, ambTargetes: false, onToast: expect.any(Function) });
    expect(document.querySelector('[data-placeholder].ProseMirror, .ProseMirror [data-placeholder]')).toBeNull();
  },
);
