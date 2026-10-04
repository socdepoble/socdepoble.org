/* T7 (ordre del Mestre, prompt 261004_0515) · La lectura d'un cos amb
   targetes incrustades: sense grups, el camí de sempre byte a byte (Llei
   del Píxel); amb un grup, cada targeta és la del Mur dins del mateix
   article, i el text del voltant passa pel sanejador. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { renderRichText } from './detailRichText.jsx';
import { sanitizeHtml } from '../../utils/sanitize';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const targeta = (id, titol, extra = '') => `<div data-sdp-targeta="publicacio:${id}" class="sdp-targeta" data-ruta="/mur/${id}" data-titol="${titol}" data-autor="Pep" data-autor-ruta="/perfil/persona/pep"${extra}><a href="/mur/${id}" rel="noopener noreferrer nofollow">${titol}</a></div>`;
const grup = (alineacio, ...fills) => `<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="${alineacio}">${fills.join('')}</div>`;

test('sense targetes: exactament el camí de sempre (un article amb l’HTML sanejat)', () => {
  const html = '<h3>Títol</h3><p>Un <a href="/x">enllaç</a> i <script>alert(1)</script>text.</p>';
  const { container } = render(renderRichText(html));
  const article = container.firstElementChild;
  expect(container.children).toHaveLength(1);
  expect(article.tagName).toBe('ARTICLE');
  expect(article.className).toBe('detail-content');
  expect(article.innerHTML).toBe(sanitizeHtml(html));
});

test('un text que només esmenta la marca, sense cap grup, també va pel camí de sempre', () => {
  const html = '<p>data-sdp-targetes és el nom de la marca</p>';
  const { container } = render(renderRichText(html));
  expect(container.firstElementChild.className).toBe('detail-content');
  expect(container.firstElementChild.innerHTML).toBe(sanitizeHtml(html));
});

test('amb un grup de dues: dues targetes del Mur dins de .sdp-targetes «parella», al mateix article', () => {
  const html = `<p>Abans</p>${grup('dreta', targeta(1, 'La festa'), targeta(2, 'El mercat'))}<p>Després</p>`;
  const { container } = render(renderRichText(html));
  const article = container.firstElementChild;
  expect(article.className).toBe('detail-content sdp-amb-targetes');
  expect([...article.children].map((fill) => fill.className)).toEqual(['sdp-cos-tros', 'sdp-targetes', 'sdp-cos-tros']);
  const grupDom = article.querySelector('.sdp-targetes');
  expect(grupDom.getAttribute('data-forma')).toBe('parella');
  expect(grupDom.getAttribute('data-alineacio')).toBe('dreta');
  const cartes = grupDom.querySelectorAll(':scope > .sdp-targeta > article.sp-card');
  expect(cartes).toHaveLength(2);
  expect(cartes[0].querySelector('.sp-card-title').textContent).toBe('La festa');
  // La targeta sencera porta al detall i l'autor, a la seua pàgina.
  expect(cartes[0].querySelector('a.sp-card-link-overlay').getAttribute('to')).toBe('/mur/1');
  expect(cartes[0].querySelector('a.sp-card-author-link').getAttribute('to')).toBe('/perfil/persona/pep');
  expect(article.querySelector('.sdp-cos-tros').innerHTML).toBe('<p>Abans</p>');
});

test('Connectar porta l’objecte tipat de la targeta, no una pàgina genèrica', () => {
  const { container } = render(renderRichText(grup('esquerra', targeta(7, 'La festa'))));
  fireEvent.click(within(container.querySelector('.sdp-targeta')).getByRole('button', { name: /Connectar amb La festa/ }));
  expect(mocks.navigate).toHaveBeenCalledWith(expect.stringContaining('objecte=publicacio'));
  expect(mocks.navigate).toHaveBeenCalledWith(expect.stringContaining('item_id=7'));
});

/* Revisió del front «editor» (261004) · La imatge de la instantània es
   demana sense referent, com la del cos: un origen de mitjans admès (p. ex.
   Google Fotos) no rep l'origen de Sóc de Poble a cada lectura. */
test('la imatge de la targeta es demana sense referent (referrerpolicy no-referrer)', () => {
  const html = grup('esquerra', targeta(8, 'La festa', ' data-imatge="https://lh3.googleusercontent.com/abc.jpg"'));
  const { container } = render(renderRichText(html));
  const imatge = container.querySelector('.sdp-targeta img.sp-card-media');
  expect(imatge.getAttribute('src')).toBe('https://lh3.googleusercontent.com/abc.jpg');
  expect(imatge.getAttribute('referrerpolicy')).toBe('no-referrer');
});

/* Regla d'or 1 del Mestre (261004) · Sense autor a la instantània, la boina
   la signa l'entitat Sóc de Poble i porta a la pàgina del projecte. */
test('una targeta sense autor porta la boina de Sóc de Poble enllaçada a /projecte', () => {
  const poble = '<div data-sdp-targeta="poble:7" data-ruta="/pobles/7" data-titol="La Torre de les Maçanes"></div>';
  const { container } = render(renderRichText(grup('esquerra', poble)));
  const boina = container.querySelector('.sdp-targeta .sp-card-header a.sp-card-author-link');
  expect(boina.getAttribute('to')).toBe('/projecte');
  expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
});

test('els trossos de text tornen a passar pel sanejador, i una targeta sense clau vàlida no es pinta', () => {
  const html = `<p onclick="alert(1)">Hola</p>${grup('esquerra', targeta(3, 'Bona'), '<div data-sdp-targeta="nota:n1" data-titol="Privada"></div>')}`;
  const { container } = render(renderRichText(html));
  expect(container.querySelector('[onclick]')).toBeNull();
  expect(container.querySelectorAll('.sdp-targeta')).toHaveLength(1);
  expect(screen.queryByText('Privada')).toBeNull();
  expect(container.querySelector('.sdp-targetes').getAttribute('data-forma')).toBe('sola');
});
