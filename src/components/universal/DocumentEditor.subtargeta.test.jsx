/* O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · El cablejat de DocumentEditor
   per a les dues eines noves de la barra:
     · els textos de mostra de la Subtargeta passen pel traductor (t, amb la
       reserva de ca.js) i arriben al magatzem de l'extensió, no a la crida
       d'extensionsRiques (que no canvia: les extensions no es refan amb
       l'idioma); se'n van en desmuntar-se;
     · amb targetes, quan el selector ja és al magatzem, una transacció buida
       (sense historial ni desat) fa que la barra torne a llegir l'estat i
       pinte «Targeta incrustada» sense esperar el primer focus del cos.
   Patró de mocks de DocumentEditor.targetes.test.jsx. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ editor: null, extensions: null, t: null }));
vi.mock('./richText', () => ({
  useUniversalRichText: () => mocks.editor,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div className="sdp-editor-tools" />,
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('./richText/extensions', () => {
  mocks.extensions = vi.fn(() => []);
  return { extensionsRiques: mocks.extensions };
});
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';
import { NOM_EXTENSIO_TARGETES } from './richText/extensions/targetes/TargetesIncrustadesContext.js';
import { NOM_SUBTARGETA, ORDRE_SUBTARGETA, TEXTOS_SUBTARGETA } from './richText/extensions/subtargeta.js';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.editor = null;
});

const DOC = { id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '', formattedDate: '01/01/26', formattedTime: '10:00' };
const editor = (adapter = {}) => render(<DocumentEditor adapter={{ document: DOC, labels: [{ text: 'Sistema' }], ...adapter }} />);

function editorFals() {
  const tr = { metes: {}, setMeta(clau, valor) { this.metes[clau] = valor; return this; } };
  return {
    isDestroyed: false,
    storage: { [NOM_EXTENSIO_TARGETES]: { obreSelector: null }, [NOM_SUBTARGETA]: { textos: null, ordre: null } },
    state: { get tr() { return tr; } },
    view: { dispatch: vi.fn() },
    tr
  };
}

test('els textos de mostra, pel traductor, al magatzem de la subtargeta; la crida a les extensions no canvia', () => {
  mocks.t = (_clau, reserva) => reserva;
  mocks.editor = editorFals();
  const { unmount } = editor();
  expect(mocks.editor.storage[NOM_SUBTARGETA].textos).toEqual(TEXTOS_SUBTARGETA);
  // C2-07 (àrbitre) · I el títol i l'ajuda de l'ordre «/», que el menú llig en pintar-se.
  expect(mocks.editor.storage[NOM_SUBTARGETA].ordre).toEqual(ORDRE_SUBTARGETA);
  for (const crida of mocks.extensions.mock.calls) expect(Object.keys(crida[0])).not.toContain('textosSubtargeta');
  unmount();
  expect(mocks.editor.storage[NOM_SUBTARGETA].textos).toBeNull();
  expect(mocks.editor.storage[NOM_SUBTARGETA].ordre).toBeNull();
});

test('en una altra llengua, els textos traduïts (cada clau amb la reserva de ca.js)', () => {
  const vistes = [];
  mocks.t = (clau, reserva) => { vistes.push([clau, reserva]); return `EN:${clau.split('.').pop()}`; };
  mocks.editor = editorFals();
  editor();
  expect(mocks.editor.storage[NOM_SUBTARGETA].textos).toEqual({ titol: 'EN:subtargetaTitol', meta: 'EN:subtargetaMeta', cos: 'EN:subtargetaCos' });
  expect(mocks.editor.storage[NOM_SUBTARGETA].ordre).toEqual({ titol: 'EN:subtargeta', ajuda: 'EN:subtargetaAjuda' });
  expect(vistes).toEqual(expect.arrayContaining([
    ['section.notes.format.subtargetaTitol', TEXTOS_SUBTARGETA.titol],
    ['section.notes.format.subtargetaMeta', TEXTOS_SUBTARGETA.meta],
    ['section.notes.format.subtargetaCos', TEXTOS_SUBTARGETA.cos],
    ['section.notes.format.subtargeta', ORDRE_SUBTARGETA.titol],
    ['section.notes.format.subtargetaAjuda', ORDRE_SUBTARGETA.ajuda]
  ]));
});

test('amb targetes: el selector al magatzem i una transacció buida, sense historial ni desat, perquè la barra el veja', () => {
  mocks.t = (_clau, reserva) => reserva;
  mocks.editor = editorFals();
  editor({ targetes: { cerca: () => [] } });
  expect(typeof mocks.editor.storage[NOM_EXTENSIO_TARGETES].obreSelector).toBe('function');
  expect(mocks.editor.view.dispatch).toHaveBeenCalledTimes(1);
  expect(mocks.editor.view.dispatch.mock.calls[0][0].metes).toEqual({ addToHistory: false, preventUpdate: true });
});

test('sense targetes, cap transacció de més; sense vista muntada, cap error', () => {
  mocks.t = (_clau, reserva) => reserva;
  mocks.editor = editorFals();
  editor();
  expect(mocks.editor.view.dispatch).not.toHaveBeenCalled();
  cleanup();
  mocks.editor = { ...editorFals(), view: undefined };
  expect(() => editor({ targetes: { cerca: () => [] } })).not.toThrow();
});
