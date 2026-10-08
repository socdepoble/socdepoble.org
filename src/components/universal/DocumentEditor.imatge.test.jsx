import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const frontera = vi.hoisted(() => ({ comprimeix: vi.fn(), carrega: vi.fn(), retalla: vi.fn() }));
vi.mock('./richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div data-testid="eines" />,
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>Llavor</p>' }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver.js', () => ({ resolveAsset: (ref) => ref, resolRecursPropi: (ref) => ref }));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: frontera.comprimeix }));
vi.mock('./enquadrament/imatgeCanvas.js', () => ({ carregaImatge: frontera.carrega, dibuixaVisor: () => true, exportaRetall: frontera.retalla }));
import { DocumentEditor } from './DocumentEditor.jsx';

const DOC = { id: 'd1', title: 'Document propi', subtitle: '', lead: '', content: '', heroImage: '' };
const URL_PUJADA = 'sdp-media://mitjans/t/u/portades/prova.webp';
const DESAR = 'Desar l’enquadrament';
const inputHero = (vista) => vista.container.querySelector('.hero-image input[type="file"]');
const foto = () => new File(['foto'], 'logotip-apaisat.jpg', { type: 'image/jpeg' });
const adapter = (props = {}) => ({ document: DOC, updateLocal: vi.fn(), saveRemote: vi.fn(), uploadMedia: vi.fn().mockResolvedValue(URL_PUJADA), ...props });
const pinta = (port) => render(<DocumentEditor adapter={port} />);
const triaFoto = async (vista) => {
  await act(async () => { fireEvent.change(inputHero(vista), { target: { files: [foto()] } }); });
  expect(vista.getByRole('dialog', { name: 'Enquadrar la imatge' })).toBeTruthy();
};
const desaFoto = async (vista) => {
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
};

beforeEach(() => {
  frontera.carrega.mockReset().mockResolvedValue({ amplada: 800, alcada: 400, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  frontera.retalla.mockReset().mockResolvedValue(new File(['retall'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  frontera.comprimeix.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  // La compressió fa un File des del data URL; cap petició a un proveïdor.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob(['webp'], { type: 'image/webp' }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

test('la imatge ja existent conserva un botó visible d’edició abans del títol', () => {
  const vista = pinta(adapter({ document: { ...DOC, heroImage: '/assets/logotip-negre.webp' } }));
  const boto = vista.getByRole('button', { name: 'Editar capçalera' });
  expect(boto.closest('.hero-image')).not.toBeNull();
  expect(boto.compareDocumentPosition(vista.getByRole('heading', { level: 1, name: DOC.title })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(vista.container.querySelector('img.sdp-hero__imatge')).not.toBeNull();
  fireEvent.click(boto);
  const input = inputHero(vista);
  const obri = vi.spyOn(input, 'click');
  fireEvent.click(vista.getByRole('button', { name: 'Editar capçalera' }));
  expect(obri).toHaveBeenCalledOnce();
});

test('sense capçalera el botó ja és abans del títol i obri el selector natiu', () => {
  const vista = pinta(adapter());
  const boto = vista.getByRole('button', { name: 'Editar capçalera' });
  expect(boto.compareDocumentPosition(vista.getByRole('heading', { level: 1, name: DOC.title })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const obri = vi.spyOn(inputHero(vista), 'click');
  fireEvent.click(boto);
  expect(obri).toHaveBeenCalledOnce();
});

test('retallar la imatge passa pel port uploadMedia i desa només al document que l’ha oberta', async () => {
  const port = adapter();
  const vista = pinta(port);
  await triaFoto(vista);
  await desaFoto(vista);
  expect(port.uploadMedia).toHaveBeenCalledOnce();
  const fitxer = port.uploadMedia.mock.calls[0][0];
  expect(fitxer).toBeInstanceOf(File);
  expect(fitxer.type).toBe('image/webp');
  expect(port.saveRemote).toHaveBeenCalledOnce();
  expect(port.saveRemote).toHaveBeenCalledWith(DOC.id, 'heroImage', URL_PUJADA);
  expect(fetch.mock.calls.every(([url]) => String(url).startsWith('data:'))).toBe(true);
  expect(vista.queryByRole('dialog', { name: 'Enquadrar la imatge' })).toBeNull();
});

test('el rebuig de la pujada continua dins del diàleg i no desa una portada falsa', async () => {
  const port = adapter({ uploadMedia: vi.fn().mockRejectedValue(new Error('El servidor no admet la pujada.')) });
  const onToast = vi.fn();
  const vista = render(<DocumentEditor adapter={port} onToast={onToast} />);
  await triaFoto(vista);
  await desaFoto(vista);
  expect(vista.getByRole('dialog', { name: 'Enquadrar la imatge' })).toBeTruthy();
  expect(vista.getByRole('alert').textContent).toContain('El servidor no admet la pujada.');
  expect(onToast).toHaveBeenCalledWith('El servidor no admet la pujada.', 'error');
  expect(port.saveRemote).not.toHaveBeenCalled();
  expect(port.updateLocal).not.toHaveBeenCalled();
});

test('en lectura, sense document editable, la portada no oferix selector ni botó d’edició', () => {
  const port = adapter({ document: null, emptyDocument: { title: 'Lectura', heroImage: '/assets/logotip-negre.webp' } });
  const vista = pinta(port);
  expect(vista.getByRole('heading', { level: 1, name: 'Lectura' })).toBeTruthy();
  expect(vista.queryByRole('button', { name: /Editar capçalera|Editar logotip/ })).toBeNull();
  expect(vista.container.querySelector('input[type="file"]')).toBeNull();
  expect(port.uploadMedia).not.toHaveBeenCalled();
});

test('una pujada pendent del document anterior no s’aplica al nou id', async () => {
  let resol;
  const port = adapter({ uploadMedia: vi.fn().mockImplementation(() => new Promise((r) => { resol = r; })) });
  const vista = pinta(port);
  await triaFoto(vista);
  await desaFoto(vista);
  expect(port.uploadMedia).toHaveBeenCalledOnce();
  const nou = { ...DOC, id: 'd2', title: 'Altre document' };
  vista.rerender(<DocumentEditor adapter={{ ...port, document: nou }} />);
  await act(async () => { resol(URL_PUJADA); });
  expect(port.saveRemote).toHaveBeenCalledWith(DOC.id, 'heroImage', URL_PUJADA);
  expect(port.saveRemote.mock.calls.some(([id]) => id === nou.id)).toBe(false);
  expect(vista.getByRole('heading', { level: 1, name: nou.title })).toBeTruthy();
  expect(vista.container.querySelector('img.sdp-hero__imatge')).toBeNull();
});

test('el logotip existent conserva el botó visible i el selector abans del títol', () => {
  const vista = pinta(adapter({ document: { ...DOC, logoImage: '/assets/logotip-negre.webp' } }));
  const boto = vista.getByRole('button', { name: 'Editar logotip' });
  expect(boto.compareDocumentPosition(vista.getByRole('heading', { level: 1, name: DOC.title })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(vista.container.querySelector('img.sdp-logo-personalitzat')).not.toBeNull();
  fireEvent.click(boto);
  const input = vista.container.querySelector('.page-title input[type="file"]');
  const obri = vi.spyOn(input, 'click');
  fireEvent.click(vista.getByRole('button', { name: 'Editar logotip' }));
  expect(obri).toHaveBeenCalledOnce();
});

test('el logotip nou usa uploadMedia i desa logoImage en el mateix document', async () => {
  const port = adapter();
  const vista = pinta(port);
  const input = vista.container.querySelector('.page-title input[type="file"]');
  await act(async () => { fireEvent.change(input, { target: { files: [foto()] } }); });
  expect(port.uploadMedia).toHaveBeenCalledOnce();
  expect(port.uploadMedia.mock.calls[0][0]).toBeInstanceOf(File);
  expect(port.uploadMedia.mock.calls[0][0].type).toBe('image/webp');
  expect(frontera.comprimeix).toHaveBeenCalledWith(expect.any(File), { maxSize: 600, format: 'image/webp', quality: 0.8 });
  expect(port.saveRemote).toHaveBeenCalledOnce();
  expect(port.saveRemote).toHaveBeenCalledWith(DOC.id, 'logoImage', URL_PUJADA);
  expect(port.updateLocal).not.toHaveBeenCalled();
  expect(vista.queryByRole('dialog', { name: 'Enquadrar la imatge' })).toBeNull();
});

test('el port especial de capçalera i showLogoUpload=false mantenen les capacitats del pare', () => {
  const onHeroEdit = vi.fn();
  const port = adapter({ document: { ...DOC, heroImage: '/assets/logotip-negre.webp', logoImage: '/assets/logotip-negre.webp' }, onHeroEdit, heroEditLabel: 'Editar capçalera i avatar', showLogoUpload: false });
  const vista = pinta(port);
  expect(vista.queryByRole('button', { name: 'Editar logotip' })).toBeNull();
  /* Pla 261008_1201 (un sol clic) · Amb imatge desada, el primer clic ja
     crida el pare (abans calien dos: el primer només obria el panell). */
  fireEvent.click(vista.getByRole('button', { name: 'Editar capçalera i avatar' }));
  expect(onHeroEdit).toHaveBeenCalledTimes(1);
  expect(onHeroEdit).toHaveBeenCalledWith({ acaba: expect.any(Function) });
  expect(port.uploadMedia).not.toHaveBeenCalled();
  expect(vista.queryByRole('button', { name: 'Enquadrar' })).toBeNull();
  expect(vista.queryByRole('dialog', { name: 'Enquadrar la imatge' })).toBeNull();
});
