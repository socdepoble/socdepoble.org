import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
// El motor TipTap no entra en joc: es prova l'estructura de l'editor.
vi.mock('./richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div className="sdp-editor-tools" data-testid="eines" />,
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '' }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';

afterEach(cleanup);

const DOC = { id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '', formattedDate: '01/01/26', formattedTime: '10:00' };
const editor = (adapter) => render(<DocumentEditor adapter={{ document: DOC, labels: [{ text: 'Sistema' }], ...adapter }} />);

test('E1 · no hi ha barra grisa: la fila d’eines va seguida del document (barra blava a la fila 2)', () => {
  const { container } = editor({});
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  expect([...shell.children].map((e) => e.className)).toEqual(['sdp-editor-tools', 'sdp-editor-document']);
  expect(shell.querySelector('.sdp-editor-document').firstElementChild.firstElementChild.className).toBe('bar-blue');
  expect(container.querySelector('.sdp-editor-meta')).toBeNull();
  expect(container.querySelector('select.sdp-copyright-selector')).toBeNull();
});

test('cap botó EDITAR dins de l’editor, ni amb document ni a l’estat buit', () => {
  const ambDocument = editor({});
  expect(ambDocument.container.textContent).not.toMatch(/EDITAR/);
  ambDocument.unmount();
  const buit = render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Benvinguda' } }} />);
  expect(buit.container.textContent).not.toMatch(/EDITAR/);
});

test('punt 7 · la botonera de classificació va davall del títol, i la llicència davall de la botonera', () => {
  const { container } = editor({
    classificacio: <div data-testid="botonera">Botonera</div>,
    llicencia: <button type="button">Llicència</button>
  });
  const capcalera = container.querySelector('header.page-title');
  const ranura = capcalera.querySelector('.page-title-classificacio');
  expect(ranura.previousElementSibling.tagName).toBe('H1');
  expect(ranura.children).toHaveLength(2);
  expect(ranura.firstElementChild.dataset.testid).toBe('botonera');
  expect(ranura.lastElementChild.querySelector('button')?.textContent).toBe('Llicència');
  expect(capcalera.querySelector('.page-title-labels')).toBeNull();
});

test('sense botonera, l’editor conserva les píndoles de sempre', () => {
  const { container } = editor({});
  expect(container.querySelector('header.page-title .page-title-labels')).not.toBeNull();
  expect(container.querySelector('.page-title-classificacio')).toBeNull();
});
