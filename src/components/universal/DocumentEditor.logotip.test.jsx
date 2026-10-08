import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Ordre del Mestre (261007, ordre E) · Dues peces de DocumentEditor:
     · l'estat buit (lectura) pinta damunt de l'H1 el mateix que la fitxa
       pública, amb les claus de PageFrame que porta l'emptyDocument;
     · l'ordre «/» Imatge rep el canal d'avisos de la capçalera (onToast)
       sense que les extensions canvien d'identitat (TipTap no es remunta). */
const m = vi.hoisted(() => ({ extensionsRiques: vi.fn(() => []) }));
vi.mock('./richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div data-testid="eines" />,
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('./richText/extensions', () => ({ extensionsRiques: m.extensionsRiques }));
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>Llavor</p>' }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver.js', () => ({ resolveAsset: (ref) => ref, resolRecursPropi: (ref) => ref }));
import { DocumentEditor } from './DocumentEditor.jsx';

const DOC = { id: 'd1', title: 'Document propi', subtitle: '', lead: '', content: '', heroImage: '' };
const lectura = (emptyDocument) => ({ document: null, emptyDocument, barAuthorName: 'Forn', barAuthorHref: '/empresa/O' });
const capcalera = (container) => container.querySelector('header.page-title');

beforeEach(() => { m.extensionsRiques.mockClear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('ordre E · en lectura, logoEntitat de l’emptyDocument pinta el logotip de l’entitat damunt de l’H1', () => {
  const { container } = render(<DocumentEditor adapter={lectura({ title: 'Forn', logoEntitat: { clar: '/assets/forn.webp', alt: 'Logotip de Forn' } })} />);
  const logo = capcalera(container).firstElementChild;
  expect(logo.tagName).toBe('IMG');
  expect(logo.className).toBe('page-title-logo page-title-logo--entitat');
  expect(logo.getAttribute('src')).toBe('/assets/forn.webp');
  expect(logo.getAttribute('alt')).toBe('Logotip de Forn');
  expect(logo.nextElementSibling.tagName).toBe('H1');
});

test('ordre E · en lectura, avatarAutor pinta l’avatar redó, mai el botó: onCanvia no passa', () => {
  const onCanvia = vi.fn();
  const { container } = render(<DocumentEditor adapter={lectura({ title: 'Pep', avatarAutor: { src: '/assets/a.webp', alt: 'Avatar de Pep', onCanvia } })} />);
  const avatar = capcalera(container).firstElementChild;
  expect(avatar.tagName).toBe('DIV');
  expect(avatar.className).toBe('page-title-avatar');
  expect(avatar.querySelector('img').getAttribute('alt')).toBe('Avatar de Pep');
  expect(container.querySelector('.page-title-avatar--canvia')).toBeNull();
  expect(capcalera(container).querySelector('button')).toBeNull();
});

test('ordre E · en lectura i sense les claus, cap imatge damunt de l’H1: el DOM de sempre', () => {
  const amb = render(<DocumentEditor adapter={lectura({ title: 'Forn' })} />);
  const html = capcalera(amb.container).outerHTML;
  expect(capcalera(amb.container).firstElementChild.tagName).toBe('H1');
  cleanup();
  const ambClausBuides = render(<DocumentEditor adapter={lectura({ title: 'Forn', logoEntitat: null, avatarAutor: null })} />);
  expect(capcalera(ambClausBuides.container).outerHTML).toBe(html);
});

test('ordre E · l’ordre «/» rep un onToast estable que porta al de l’adaptador d’ara', () => {
  const primer = vi.fn();
  const segon = vi.fn();
  const port = { document: DOC, updateLocal: vi.fn(), saveRemote: vi.fn(), uploadMedia: vi.fn() };
  const vista = render(<DocumentEditor adapter={port} onToast={primer} />);
  expect(m.extensionsRiques).toHaveBeenCalledTimes(1);
  const { onToast, onImageUpload } = m.extensionsRiques.mock.calls[0][0];
  expect(onImageUpload).toBe(port.uploadMedia);
  onToast('Només imatges, de moment.', 'error');
  expect(primer).toHaveBeenCalledWith('Només imatges, de moment.', 'error');
  // Un onToast nou (el pare torna a pintar) no refà les extensions: TipTap no es remunta.
  vista.rerender(<DocumentEditor adapter={port} onToast={segon} />);
  expect(m.extensionsRiques).toHaveBeenCalledTimes(1);
  onToast('El servidor no admet la pujada.', 'error');
  expect(segon).toHaveBeenCalledWith('El servidor no admet la pujada.', 'error');
  expect(primer).toHaveBeenCalledTimes(1);
});

test('ordre E · sense onToast, un console.warn amb el mateix missatge de l’avís de l’ordre «/» (també per a un fitxer que no és una imatge)', () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<DocumentEditor adapter={{ document: DOC, updateLocal: vi.fn(), saveRemote: vi.fn() }} />);
  m.extensionsRiques.mock.calls[0][0].onToast('No s’ha pogut processar la imatge.', 'error');
  expect(avis).toHaveBeenCalledWith('[slash] No s’ha pogut processar la imatge.');
});
