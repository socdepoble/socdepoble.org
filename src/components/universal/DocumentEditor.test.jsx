import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ richText: null, llavorNota: '<h3>Llavor del Bloc</h3>' }));
// El motor TipTap no entra en joc: es prova l'estructura de l'editor. El hook
// és un vi.fn per a vore què rep (la llavor del cos).
vi.mock('./richText', () => {
  mocks.richText = vi.fn(() => null);
  return {
    useUniversalRichText: mocks.richText,
    useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
    UniversalRichTextToolbar: () => <div className="sdp-editor-tools" data-testid="eines" />,
    UniversalRichTextContent: () => <div data-testid="cos" />
  };
});
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
// Com a HEAD: la llavor per defecte ve del Bloc de Notes (deute previ conservat
// per ordre del Mestre). Un valor reconeixible per a vore que és la que arriba.
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: mocks.llavorNota }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const DOC = { id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '', formattedDate: '01/01/26', formattedTime: '10:00' };
const editor = (adapter) => render(<DocumentEditor adapter={{ document: DOC, labels: [{ text: 'Sistema' }], ...adapter }} />);
const classesDe = (el) => [...el.children].map((e) => e.className || e.dataset.testid);

test('E1 · no hi ha barra grisa: la fila d’eines va seguida del document (barra blava a la fila 2)', () => {
  const { container } = editor({});
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  expect([...shell.children].map((e) => e.className)).toEqual(['sdp-editor-tools', 'sdp-editor-document']);
  expect(shell.querySelector('.sdp-editor-document').firstElementChild.firstElementChild.className).toBe('bar-blue');
  expect(container.querySelector('.sdp-editor-meta')).toBeNull();
  expect(container.querySelector('select.sdp-copyright-selector')).toBeNull();
});

test('D13 · amb «davall-entradilla» la barra blava és la fila 1 i les eines baixen davall de l’entradilla', () => {
  const { container } = editor({ posicioEines: 'davall-entradilla' });
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  expect(classesDe(shell)).toEqual(['sdp-editor-document']);
  const contenidor = shell.querySelector('.sdp-editor-document').firstElementChild;
  expect(contenidor.firstElementChild.className).toBe('bar-blue');
  const article = contenidor.querySelector('article.content-wrapper');
  expect(classesDe(article)).toEqual(['page-intro', 'sdp-editor-eines', 'cos']);
  expect(container.querySelectorAll('.sdp-editor-tools')).toHaveLength(1);
  expect(article.querySelector('.sdp-editor-eines > .sdp-editor-tools')).not.toBeNull();
});

test('D13 · un valor desconegut de posicioEines es comporta com «dalt»', () => {
  const { container } = editor({ posicioEines: 'baix' });
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  expect(classesDe(shell)).toEqual(['sdp-editor-tools', 'sdp-editor-document']);
  expect(container.querySelector('.sdp-editor-eines')).toBeNull();
  expect(classesDe(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'cos']);
});

test('D13 · posicioEines i seedContent no arriben al DOM ni fan avisos de React', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = editor({ posicioEines: 'davall-entradilla', seedContent: '<p>Llavor</p>' });
  expect(container.querySelector('[posicioeines], [posicioEines], [seedcontent], [seedContent]')).toBeNull();
  const avisos = errors.mock.calls.map((crida) => crida.map(String).join(' '));
  expect(avisos.filter((text) => /posicioEines|seedContent/i.test(text))).toEqual([]);
});

test('llavor del cos: sense seedContent val LLAVOR_NOTA (el Bloc no la passa); un valor explícit mana, també null', () => {
  editor({});
  expect(mocks.richText).toHaveBeenLastCalledWith(expect.objectContaining({ seedContent: mocks.llavorNota }));
  cleanup();
  editor({ seedContent: undefined });
  expect(mocks.richText).toHaveBeenLastCalledWith(expect.objectContaining({ seedContent: mocks.llavorNota }));
  cleanup();
  editor({ seedContent: null });
  expect(mocks.richText).toHaveBeenLastCalledWith(expect.objectContaining({ seedContent: null }));
  cleanup();
  editor({ seedContent: '<p>Llavor</p>' });
  expect(mocks.richText).toHaveBeenLastCalledWith(expect.objectContaining({ seedContent: '<p>Llavor</p>' }));
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
