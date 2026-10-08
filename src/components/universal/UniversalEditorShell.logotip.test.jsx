import React, { useState } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
/* Ordre del Mestre (261007, ordre E) i esmena 1 del pla 261007_1645 · La
   ranura del logotip damunt de l'H1 és el mateix control que la capçalera
   (ImageUploaderUI), amb el mirall d'onHeroEdit: `onLogoEdit` i
   `logoEditLabel`. La closca sencera pinta una UniversalPage: fora el router,
   els avisos i el resolutor d'assets. */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
import { NOM_OPCIONS_LOGOTIP, UniversalEditorShell } from './UniversalEditorShell.jsx';

afterEach(cleanup);

const closca = (props = {}) => render(
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}>
    <div data-testid="cos" />
  </UniversalEditorShell>
);
const ranura = (container) => container.querySelector('header.page-title .page-title-logo-personalitzat');

test('ordre E · sense onLogoEdit, la ranura de sempre: «Editar logotip» obri el selector de fitxers', () => {
  const { container, getByRole } = closca();
  const boto = getByRole('button', { name: 'Editar logotip' });
  expect(ranura(container).contains(boto)).toBe(true);
  const obri = vi.spyOn(ranura(container).querySelector('input[type="file"]'), 'click');
  fireEvent.click(boto);
  expect(obri).toHaveBeenCalledOnce();
});

test('ordre E · en repòs, la ranura del logotip pinta el DOM de sempre', () => {
  const { container } = closca();
  const fills = [...ranura(container).firstElementChild.children].map((e) => `${e.tagName}.${e.className}`);
  expect(fills).toEqual(['INPUT.sdp-nomes-lector', 'BUTTON.sdp-boto sdp-boto--secundari', 'P.sdp-camp__ajuda']);
  const boto = ranura(container).querySelector('button');
  expect(boto.hasAttribute('disabled')).toBe(false);
  expect(ranura(container).querySelector('.sdp-camp__ajuda').textContent).toBe("Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.");
  expect(ranura(container).querySelector('input').getAttribute('accept')).toBe('image/*,video/*,audio/*,.pdf,.doc,.docx');
});

test('ordre E · amb onLogoEdit, el botó porta l’etiqueta del pare i li passa «acaba», sense obrir cap selector', () => {
  const onLogoEdit = vi.fn();
  const { container, getByRole } = closca({ onLogoEdit, logoEditLabel: 'Canvia la teua imatge' });
  expect(container.querySelector('header.page-title').textContent).not.toContain('Editar logotip');
  const obri = vi.spyOn(ranura(container).querySelector('input[type="file"]'), 'click');
  fireEvent.click(getByRole('button', { name: 'Canvia la teua imatge' }));
  expect(onLogoEdit).toHaveBeenCalledWith({ acaba: expect.any(Function) });
  expect(obri).not.toHaveBeenCalled();
});

test('ordre E · amb logotip i onLogoEdit, el panell d’edició crida el pare i «acaba» torna a la imatge', () => {
  const onLogoEdit = vi.fn();
  const { container, getByRole } = closca({ logoImage: '/assets/l.webp', onLogoEdit, logoEditLabel: 'Canvia la teua imatge' });
  fireEvent.click(container.querySelector('img.sdp-logo-personalitzat'));
  fireEvent.click(getByRole('button', { name: 'Canvia la teua imatge' }));
  expect(onLogoEdit).toHaveBeenCalledTimes(1);
  act(() => onLogoEdit.mock.calls[0][0].acaba());
  expect(container.querySelector('img.sdp-logo-personalitzat')).not.toBeNull();
});

/* Pla 261008_1201 (un sol clic) · Amb onLogoEdit i una imatge desada, el
   botó de davall de la imatge crida el pare al primer clic; abans només
   obria el panell i calia un segon clic. Clicar la imatge continua obrint
   el panell. Sense onLogoEdit, el botó obri el panell, com sempre. */
test('un sol clic · amb logotip i onLogoEdit, el botó en repòs crida el pare sense obrir el panell', () => {
  const onLogoEdit = vi.fn();
  const { container, getByRole, queryByRole } = closca({ logoImage: '/assets/l.webp', onLogoEdit, logoEditLabel: 'Canvia la teua imatge' });
  const obri = vi.spyOn(HTMLInputElement.prototype, 'click');
  fireEvent.click(getByRole('button', { name: 'Canvia la teua imatge' }));
  expect(onLogoEdit).toHaveBeenCalledTimes(1);
  expect(onLogoEdit).toHaveBeenCalledWith({ acaba: expect.any(Function) });
  expect(obri).not.toHaveBeenCalled();
  obri.mockRestore();
  // Cap panell: la imatge continua a la vista i no hi ha ni Enrere ni Esborrar.
  expect(container.querySelector('img.sdp-logo-personalitzat')).not.toBeNull();
  expect(queryByRole('button', { name: 'Enrere' })).toBeNull();
  expect(queryByRole('button', { name: 'Esborrar' })).toBeNull();
  // «acaba» en repòs no trenca res: la imatge es queda.
  act(() => onLogoEdit.mock.calls[0][0].acaba());
  expect(container.querySelector('img.sdp-logo-personalitzat')).not.toBeNull();
});

test('un sol clic · amb onLogoEdit, clicar la imatge continua obrint el panell (Enrere, Esborrar)', () => {
  const onLogoEdit = vi.fn();
  const { container, getByRole } = closca({ logoImage: '/assets/l.webp', onLogoEdit, logoEditLabel: 'Canvia la teua imatge' });
  fireEvent.click(container.querySelector('img.sdp-logo-personalitzat'));
  expect(onLogoEdit).not.toHaveBeenCalled();
  expect(getByRole('button', { name: 'Enrere' })).toBeTruthy();
  expect(getByRole('button', { name: 'Esborrar' })).toBeTruthy();
});

/* Correcció de la revisió (261008) · Al Perfil d'una organització, el botó
   es diu «Logotip» (logoEditLabel) i la imatge, pel seu alt, també. Amb
   onLogoEdit la imatge diu que obri les opcions; sense, cap atribut nou. */
test('un sol clic · amb onLogoEdit, la imatge i el botó «Logotip» no es diuen igual', () => {
  const { container, getAllByRole, getByRole } = closca({ logoImage: '/assets/l.webp', onLogoEdit: vi.fn(), logoEditLabel: 'Logotip' });
  expect(getAllByRole('button', { name: 'Logotip' })).toHaveLength(1);
  expect(getByRole('button', { name: NOM_OPCIONS_LOGOTIP })).toBe(container.querySelector('img.sdp-logo-personalitzat'));
  expect(NOM_OPCIONS_LOGOTIP).toBe('Opcions del logotip');
  cleanup();
  const notes = closca({ logoImage: '/assets/l.webp' });
  expect(notes.container.querySelector('img.sdp-logo-personalitzat').hasAttribute('aria-label')).toBe(false);
});

test('un sol clic · sense onLogoEdit (Notes), el botó en repòs obri el panell, com sempre, i el DOM no canvia', () => {
  const { container, getByRole } = closca({ logoImage: '/assets/l.webp' });
  const repos = [...ranura(container).children].map((e) => e.outerHTML);
  expect(repos).toHaveLength(2);
  fireEvent.click(getByRole('button', { name: 'Editar logotip' }));
  expect(container.querySelector('img.sdp-logo-personalitzat')).toBeNull();
  expect(getByRole('button', { name: 'Enrere' })).toBeTruthy();
  act(() => { fireEvent.click(getByRole('button', { name: 'Enrere' })); });
  expect([...ranura(container).children].map((e) => e.outerHTML)).toEqual(repos);
});

test('ordre E · onLogoEdit no toca la capçalera: «Editar capçalera» continua obrint el seu selector', () => {
  const onLogoEdit = vi.fn();
  const { container, getByRole } = closca({ onLogoEdit });
  const obri = vi.spyOn(container.querySelector('.hero-image input[type="file"]'), 'click');
  fireEvent.click(getByRole('button', { name: 'Editar capçalera' }));
  expect(obri).toHaveBeenCalledOnce();
  expect(onLogoEdit).not.toHaveBeenCalled();
});

test('ordre E · sense ranura (showLogoUpload false), avatarAutor arriba a PageFrame: l’avatar redó damunt de l’H1, amb el botó', () => {
  const onCanvia = vi.fn();
  const { container } = closca({ showLogoUpload: false, avatarAutor: { src: '/assets/a.webp', alt: 'Avatar de Pep', onCanvia } });
  expect(ranura(container)).toBeNull();
  const avatar = container.querySelector('header.page-title button.page-title-avatar--canvia');
  expect(avatar).not.toBeNull();
  expect(avatar.compareDocumentPosition(container.querySelector('h1')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(avatar);
  expect(onCanvia).toHaveBeenCalledTimes(1);
});

/* Poliment T47 · Després d'una acció d'avís de l'avatar (logoImage), el focus
   va al botó de l'avatar redó quan no hi ha ranura, no al títol. */
function AmbAvisAvatar(props) {
  const [avisos, setAvisos] = useState({
    logoImage: { error: { missatge: 'No s’ha pogut desar.', accions: [{ text: 'Tornar al que hi ha desat', onClick: () => setAvisos(null) }] } },
  });
  return (
    <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" avisosCamps={avisos} {...props}>
      <div data-testid="cos" />
    </UniversalEditorShell>
  );
}

test('ordre E · l’acció d’avís de l’avatar torna el focus a l’avatar redó', () => {
  const { container } = render(<AmbAvisAvatar showLogoUpload={false} avatarAutor={{ src: '/assets/a.webp', alt: 'Avatar', onCanvia: vi.fn() }} />);
  const boto = container.querySelector('.sdp-avisos-camps button');
  boto.focus();
  act(() => { fireEvent.click(boto); });
  expect(document.activeElement).toBe(container.querySelector('.page-title-avatar--canvia'));
});
