/* T7 (ordre del Mestre, prompt 261004_0515) · DocumentEditor amb la clau
   opcional `targetes`: les extensions la reben, el selector i l'avís es
   munten tancats i germans de la closca, el magatzem de l'editor obri el
   selector i la tria s'insereix. Sense la clau, el DOM de sempre. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, onTestFinished, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ editor: null, extensions: null }));
vi.mock('./richText', async () => {
  const { useTargetesIncrustades } = await import('./richText/extensions/targetes/TargetesIncrustadesContext.js');
  return {
    useUniversalRichText: () => mocks.editor,
    useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
    UniversalRichTextToolbar: () => <div className="sdp-editor-tools" />,
    /* El cos llig el context de les targetes com ho fa el NodeView. */
    UniversalRichTextContent: function Cos() {
      const context = useTargetesIncrustades();
      return (
        <div data-testid="cos">
          {context ? <button type="button" onClick={() => context.avisa()}>Acció de la targeta</button> : null}
        </div>
      );
    }
  };
});
vi.mock('./richText/extensions', () => {
  mocks.extensions = vi.fn(() => []);
  return { extensionsRiques: mocks.extensions };
});
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';
import { NOM_EXTENSIO_TARGETES } from './richText/extensions/targetes/TargetesIncrustadesContext.js';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.editor = null;
});

const DOC = { id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '', formattedDate: '01/01/26', formattedTime: '10:00' };
const ENTRADA = Object.freeze({ clau: 'publicacions:1', tipus: 'publicacions', id: '1', titol: 'La festa', extracte: 'Música', href: '/mur/1' });
const editor = (adapter = {}) => render(<DocumentEditor adapter={{ document: DOC, labels: [{ text: 'Sistema' }], ...adapter }} />);
/* Un diàleg pel seu títol, obert o tancat (tancat, jsdom no en calcula el nom). */
const dialegDe = (titol) => screen.queryByRole('heading', { name: titol, hidden: true })?.closest('dialog') ?? null;
/* Els id de useId canvien d'un muntatge a l'altre: no són part del DOM que es compara. */
const senseIds = (html) => html.replace(/:r[0-9a-z]+:/g, ':id:');

function editorFals() {
  const cadena = { focus: vi.fn(), inserirTargeta: vi.fn(), run: vi.fn(() => true) };
  cadena.focus.mockReturnValue(cadena);
  cadena.inserirTargeta.mockReturnValue(cadena);
  return { isDestroyed: false, storage: { [NOM_EXTENSIO_TARGETES]: { obreSelector: null } }, chain: vi.fn(() => cadena), cadena };
}

test('sense la clau, les extensions de sempre i cap diàleg de targetes: el DOM no canvia', () => {
  /* Rellotge fix: la data d'ara de la barra no pot canviar entre els dos muntatges. */
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 4, 6, 30));
  onTestFinished(() => vi.useRealTimers());
  const sense = editor();
  const html = senseIds(sense.container.innerHTML);
  /* Ordre del Mestre (261007, ordre E) · Les extensions reben també el canal
     d'avisos de l'ordre «/» Imatge (onToast, estable): DocumentEditor.logotip.test.jsx. */
  expect(mocks.extensions).toHaveBeenLastCalledWith({ onImageUpload: undefined, ambTargetes: false, onToast: expect.any(Function) });
  expect(dialegDe('Inserir una targeta')).toBeNull();
  expect(dialegDe('Esta targeta és una previsualització')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Acció de la targeta' })).toBeNull();
  expect(sense.container.querySelectorAll('dialog')).toHaveLength(1);
  sense.unmount();
  const ambNull = editor({ targetes: null });
  expect(senseIds(ambNull.container.innerHTML)).toBe(html);
});

test('amb targetes, les extensions les reben i el selector i l’avís es munten tancats, darrere de la closca', () => {
  const { container } = editor({ targetes: { cerca: () => [] } });
  expect(mocks.extensions).toHaveBeenLastCalledWith({ onImageUpload: undefined, ambTargetes: true, onToast: expect.any(Function) });
  const selector = dialegDe('Inserir una targeta');
  const avis = dialegDe('Esta targeta és una previsualització');
  expect(container.querySelectorAll('dialog')).toHaveLength(3);
  expect(selector.open).toBe(false);
  expect(avis.open).toBe(false);
  // Germans de la closca: mai dins del cos editable.
  expect(container.querySelector('.sdp-editor-shell-atomic').contains(selector)).toBe(false);
  expect(container.querySelector('.sdp-editor-shell-atomic').contains(avis)).toBe(false);
});

test('l’ordre de l’editor obri el selector pel magatzem, i la tria s’insereix al cos', () => {
  mocks.editor = editorFals();
  const cerca = vi.fn(() => [ENTRADA]);
  const { unmount } = editor({ targetes: { cerca } });
  const magatzem = mocks.editor.storage[NOM_EXTENSIO_TARGETES];
  expect(typeof magatzem.obreSelector).toBe('function');
  act(() => magatzem.obreSelector());
  const selector = screen.getByRole('dialog', { name: 'Inserir una targeta' });
  expect(selector.open).toBe(true);
  fireEvent.change(within(selector).getByRole('searchbox', { name: 'Busca' }), { target: { value: 'festa' } });
  fireEvent.click(within(selector).getByRole('radio'));
  fireEvent.click(within(selector).getByRole('button', { name: 'Inserir' }));
  expect(mocks.editor.cadena.inserirTargeta).toHaveBeenCalledWith(expect.objectContaining({ clau: 'publicacio:1', ruta: '/mur/1', titol: 'La festa' }));
  expect(mocks.editor.cadena.run).toHaveBeenCalled();
  expect(dialegDe('Inserir una targeta').open).toBe(false);
  // En desmuntar-se, el magatzem es queda sense selector (l'ordre ix apagada).
  unmount();
  expect(magatzem.obreSelector).toBeNull();
});

test('una acció de la targeta en edició obri l’avís únic de previsualització', () => {
  editor({ targetes: { cerca: () => [] } });
  fireEvent.click(screen.getByRole('button', { name: 'Acció de la targeta' }));
  const avis = screen.getByRole('dialog', { name: 'Esta targeta és una previsualització' });
  expect(avis.open).toBe(true);
  fireEvent.click(within(avis).getByRole('button', { name: 'Entesos' }));
  expect(dialegDe('Esta targeta és una previsualització').open).toBe(false);
});
