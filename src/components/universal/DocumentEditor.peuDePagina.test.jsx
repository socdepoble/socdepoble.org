/* Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007) · La clau
   d'adaptador `peuDePagina` de DocumentEditor: passa per ...rest a
   UniversalEditorShell i a la UniversalPage, i PageFrame la pinta després de
   l'article, dins del contenidor que fa scroll. Aparéixer, canviar o
   desaparéixer no remunta el cos (TipTap); cap atribut arriba al DOM; l'estat
   buit no la rep. TipTap no entra en joc (DocumentEditor.test.jsx). */
import React, { useEffect } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ muntatges: 0 }));
vi.mock('./richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div className="sdp-editor-tools" />,
  /* El cos compta les vegades que es munta: un remuntatge és un TipTap nou. */
  UniversalRichTextContent: function Cos() {
    useEffect(() => { mocks.muntatges += 1; }, []);
    return <div data-testid="cos" />;
  }
}));
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<h3>Llavor</h3>' }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';

const DOC = { id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '', formattedDate: '01/01/26', formattedTime: '10:00' };
const PEU = <><h2>Ja publicat al Mercat</h2><p>Samarreta</p></>;
const editor = (adapter) => <DocumentEditor adapter={{ document: DOC, labels: [], posicioEines: 'davall-entradilla', ...adapter }} />;
const fills = (arrel) => [...arrel.querySelector('.sdp-universal-page-container').children].map((e) => `${e.tagName}.${e.className}`);

beforeEach(() => { mocks.muntatges = 0; });
afterEach(cleanup);

test('sense la clau: el DOM de sempre (l’article és l’últim fill de la pàgina)', () => {
  const { container } = render(editor({}));
  expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
  expect(fills(container).at(-1)).toBe('ARTICLE.content-wrapper');
});

test('amb la clau: el section amb nom, després de l’article i fora d’ell, sense cap atribut nou al DOM', () => {
  const { container, getByRole } = render(editor({ peuDePagina: PEU, etiquetaPeuDePagina: 'Ja publicat al Mercat' }));
  expect(fills(container).slice(-2)).toEqual(['ARTICLE.content-wrapper', 'SECTION.sdp-pagina-peu']);
  const peu = getByRole('region', { name: 'Ja publicat al Mercat' });
  expect(peu.closest('article')).toBeNull();
  expect(container.querySelector('article.content-wrapper [data-testid="cos"]')).not.toBeNull();
  expect(container.querySelector('[peudepagina], [peuDePagina], [etiquetapeudepagina], [etiquetaPeuDePagina]')).toBeNull();
});

test('aparéixer, canviar i desaparéixer el peu no remunta el cos (TipTap)', () => {
  const vista = render(editor({}));
  expect(mocks.muntatges).toBe(1);
  vista.rerender(editor({ peuDePagina: PEU, etiquetaPeuDePagina: 'Ja publicat al Mercat' }));
  vista.rerender(editor({ peuDePagina: <p>Un altre peu</p>, etiquetaPeuDePagina: 'Ja publicat al Mur' }));
  vista.rerender(editor({}));
  expect(mocks.muntatges).toBe(1);
  expect(vista.container.querySelector('.sdp-pagina-peu')).toBeNull();
});

test('l’estat buit (sense document) no la rep', () => {
  const { container } = render(<DocumentEditor adapter={{ document: null, peuDePagina: PEU, etiquetaPeuDePagina: 'Ja publicat al Mercat' }} />);
  expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
});
