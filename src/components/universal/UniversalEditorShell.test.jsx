import React from 'react';
import { act, render, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
// La closca sencera pinta una UniversalPage: fora el router, els avisos i el
// resolutor d'assets.
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { EditableField, UniversalEditorShell } from './UniversalEditorShell.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { FORASTER } from './UniversalUtils.js';

afterEach(cleanup);

const EINES = <div className="sdp-editor-tools" role="group" aria-label="Eines de l'editor" />;
const closca = (props) => render(
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}>
    <div data-testid="cos" />
  </UniversalEditorShell>
);
const classesDe = (el) => [...el.children].map((e) => e.className || e.dataset.testid);

test('D13 · per defecte («dalt») les eines són la primera fila de la closca, fora del document', () => {
  const { container } = closca({ topBar: EINES });
  expect(classesDe(container.querySelector('.sdp-editor-shell-atomic'))).toEqual(['sdp-editor-tools', 'sdp-editor-document']);
  expect(container.querySelector('.sdp-editor-eines')).toBeNull();
});

test('D13 · «davall-entradilla»: les eines entren a l’article, entre l’entradilla i el cos', () => {
  const { container } = closca({ topBar: EINES, posicioEines: 'davall-entradilla' });
  expect(classesDe(container.querySelector('.sdp-editor-shell-atomic'))).toEqual(['sdp-editor-document']);
  expect(container.querySelector('.sdp-universal-page-container').firstElementChild.className).toBe('bar-blue');
  expect(classesDe(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'sdp-editor-eines', 'cos']);
  expect(container.querySelectorAll('.sdp-editor-tools')).toHaveLength(1);
});

test('D13 · sense barra d’eines, «davall-entradilla» no pinta cap embolcall buit', () => {
  const { container } = closca({ posicioEines: 'davall-entradilla' });
  expect(container.querySelector('.sdp-editor-eines')).toBeNull();
  expect(classesDe(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'cos']);
});

test('barra taronja: una cadena buida explícita no s’omple amb el poble del Foraster; sense la prop, sí', () => {
  const ambBuit = closca({ barAuthorLocation: '' });
  expect(ambBuit.container.textContent).not.toContain(FORASTER.location);
  cleanup();
  const senseProp = closca({});
  expect(senseProp.container.textContent).toContain(FORASTER.location);
  cleanup();
  expect(closca({ barAuthorLocation: 'La Torre' }).container.textContent).toContain('La Torre');
});

/* T22 · el nom i el poble del Foraster van junts: sense props ni config, la
   barra taronja pinta els dos literals de FORASTER, no un de cada casa. */
test('T22 · sense sessió, la barra taronja diu «Foraster» i «Poble de la persona forastera» alhora', () => {
  const { container } = closca({});
  expect(container.querySelector('.sp-card-author-name').textContent).toBe(FORASTER.name);
  expect(container.querySelector('.sp-card-author-location').textContent).toBe(FORASTER.location);
  expect(FORASTER.location).toBe('Poble de la persona forastera');
});

test('T35 · sense onHeroEdit, el botó de la capçalera diu «Editar capçalera» i l’ajuda de sempre', () => {
  const { getByRole, container } = closca({});
  expect(getByRole('button', { name: 'Editar capçalera' })).toBeTruthy();
  expect(container.querySelector('.hero-image .sdp-camp__ajuda').textContent).toBe("Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.");
});

test('T35 · amb onHeroEdit, el botó porta l’etiqueta del pare i li passa «acaba», que torna a la imatge', () => {
  const onHeroEdit = vi.fn();
  const { container, getByRole } = closca({ heroImage: '/assets/h.webp', heroEditLabel: 'Editar capçalera i avatar', heroEditHelp: 'Ajuda', onHeroEdit });
  fireEvent.click(container.querySelector('img.sdp-hero__imatge'));
  fireEvent.click(getByRole('button', { name: 'Editar capçalera i avatar' }));
  expect(container.querySelector('.hero-image .sdp-camp__ajuda').textContent).toBe('Ajuda');
  expect(onHeroEdit).toHaveBeenCalledWith({ acaba: expect.any(Function) });
  act(() => onHeroEdit.mock.calls[0][0].acaba());
  expect(container.querySelector('img.sdp-hero__imatge')).not.toBeNull();
});

/* Simula una tecla: el navegador ja ha escrit al DOM quan arriba l'«input».
   Passa pel sanejador per complir la porta tractor-innerhtml (també als tests). */
function tecleja(camp, html) {
  camp.innerHTML = sanitizeHtml(html);
  fireEvent.input(camp);
}

test('A2 · amb el focus al camp, el valor que torna del pare no reescriu el DOM', () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);

  tecleja(camp, 'H');
  const nodeTeclejat = camp.firstChild;
  expect(onChange).toHaveBeenLastCalledWith('H');
  // El pare desa el valor i el torna com a prop: el node de text ha de ser el
  // mateix, perquè reescriure'l torna el cursor a l'inici («Hola» → «aloH»).
  rerender(<EditableField html="H" onChange={onChange} className="camp" />);
  expect(camp.firstChild).toBe(nodeTeclejat);

  tecleja(camp, 'Hola');
  // Un valor endarrerit (desat asíncron) tampoc no trepitja el que s'escriu.
  rerender(<EditableField html="Hol" onChange={onChange} className="camp" />);
  expect(camp.textContent).toBe('Hola');
});

test('A2 · en perdre el focus es pinta el valor desat', () => {
  const onBlur = vi.fn();
  const { container, rerender } = render(<EditableField html="Vell" onBlur={onBlur} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'Nou');
  fireEvent.blur(camp);
  expect(onBlur).toHaveBeenLastCalledWith('Nou');
  rerender(<EditableField html="Nou desat" onBlur={onBlur} className="camp" />);
  expect(camp.textContent).toBe('Nou desat');
});

test('A2 · els hooks no depenen del return null: el camp pot aparéixer després', () => {
  const { container, rerender } = render(<EditableField html={null} className="camp" />);
  expect(container.querySelector('.camp')).toBeNull();
  rerender(<EditableField html="Títol" className="camp" />);
  expect(container.querySelector('.camp').textContent).toBe('Títol');
  rerender(<EditableField html={null} className="camp" />);
  expect(container.querySelector('.camp')).toBeNull();
});

test('A3 · un camp buidat es desa com a cadena buida, no com a <br>, salts o espais', () => {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  const { container } = render(<EditableField html="Hola" onChange={onChange} onBlur={onBlur} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  for (const buit of ['<br>', '\n\n', ' ', '&nbsp;', '<div><br></div>', '<p><br></p>']) {
    tecleja(camp, buit);
    expect(onChange).toHaveBeenLastCalledWith('');
  }
  fireEvent.blur(camp);
  expect(onBlur).toHaveBeenLastCalledWith('');
});

test('A3 · un camp buidat queda realment buit en perdre el focus (placeholder sense :has())', () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'H');
  rerender(<EditableField html="H" onChange={onChange} className="camp" />);
  tecleja(camp, '<br>');
  rerender(<EditableField html="" onChange={onChange} className="camp" />);
  fireEvent.blur(camp);
  expect(camp.childNodes).toHaveLength(0);
});

/* ── T40–T41 (ordre del Mestre, 260928) · la barra taronja ─────────────── */
test('T40 · sense onPublishDateChange la data és el <time> de sempre; amb, un botó que obri el calendari', () => {
  const sense = closca({ formattedTime: '10:00', formattedDate: '01/01/26' });
  expect(sense.container.querySelector('.bar-orange .btn-date-time').tagName).toBe('TIME');
  cleanup();
  const onPublishDateChange = vi.fn();
  const { container, getByRole } = closca({ formattedTime: '10:00', formattedDate: '01/01/26', publishDate: null, onPublishDateChange });
  const pastilla = container.querySelector('.bar-orange .btn-date-time');
  expect(pastilla.tagName).toBe('BUTTON');
  expect(pastilla.getAttribute('aria-haspopup')).toBe('dialog');
  expect(pastilla.textContent).toBe('10:0001/01/26');
  act(() => { fireEvent.click(pastilla); });
  const dialeg = getByRole('dialog', { name: 'Data de publicació' });
  act(() => { fireEvent.click(dialeg.querySelector('.sdp-calendari__dia')); });
  expect(onPublishDateChange).toHaveBeenCalledTimes(1);
  expect(new Date(onPublishDateChange.mock.calls[0][0]).getDate()).toBe(1);
});

test('T40 · la barra taronja no pinta cap selector d’identitat (viu a la barra negra)', () => {
  const { container } = closca({ identityActions: <div className="perfil-selector">Qui</div>, onObriVisibilitat: vi.fn() });
  expect(container.querySelector('.bar-orange .perfil-selector')).toBeNull();
  expect(container.querySelector('.perfil-selector')).toBeNull();
});

test('T41 · la bola del món és un <button> real amb nom que obri el selector; sense Dropdown ni interactius niats', () => {
  const onObriVisibilitat = vi.fn();
  const { container } = closca({ isPublished: true, onObriVisibilitat, etiquetaVisibilitat: 'Publicada al Mur: canviar la visibilitat' });
  const bola = container.querySelector('.bar-orange button.btn-icon-orange');
  expect(bola.getAttribute('aria-haspopup')).toBe('dialog');
  expect(bola.getAttribute('aria-label')).toBe('Publicada al Mur: canviar la visibilitat');
  expect(bola.getAttribute('aria-expanded')).toBe('false');
  expect(bola.querySelector('svg.lucide-globe')).not.toBeNull();
  expect(container.querySelector('.sp-dropdown-wrapper')).toBeNull();
  expect(container.querySelector('[role="button"] button')).toBeNull();
  expect(container.querySelector('.published')).toBeNull();
  act(() => { fireEvent.click(bola); });
  expect(onObriVisibilitat).toHaveBeenCalledTimes(1);
  cleanup();
  const privada = closca({ isPublished: false, onObriVisibilitat, etiquetaVisibilitat: 'Privada' });
  expect(privada.container.querySelector('.bar-orange button.btn-icon-orange svg.lucide-lock')).not.toBeNull();
});

test('T41 · sense onObriVisibilitat, cap botó d’estat que no fa res', () => {
  const { container } = closca({});
  expect(container.querySelector('.btn-icon-orange')).toBeNull();
});

test('A3 · el text i les imatges pròpies es conserven', () => {
  const onChange = vi.fn();
  const { container } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'Hola <strong>món</strong>');
  expect(onChange).toHaveBeenLastCalledWith('Hola <strong>món</strong>');
  tecleja(camp, '<img src="/assets/a.png" alt="">');
  expect(onChange.mock.lastCall[0]).toMatch(/^<img\b/);
});
