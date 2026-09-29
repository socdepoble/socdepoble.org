import { act, render, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
// Router, avisos i assets fora: es prova la barra blava de l'editor tal com la pinta PageFrame.
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { UniversalEditorShell, AVIS_ACCIONS_EDICIO, DURADA_AVIS_ACCIONS } from './UniversalEditorShell.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { PageFrame } from './PageFrame.jsx';

/* T63.2 · A l'editor Comentar és inoperatiu (T36) i no porta a cap xat: el seu
   nom és només «Comentar». A la lectura pública, el xat comú de la pàgina. */
const INOPERATIUS = ['Comentar', 'Compartir', 'Connectar'];
const PUBLICS = ['Comentar al xat comú', 'Compartir', 'Connectar'];
const VIUS = ['Tornar arrere', 'Índex de secció', 'Tornar endavant', 'Traduir'];
const barra = (container) => container.querySelector('header.bar-blue');
const boto = (container, nom) => barra(container).querySelector(`button[aria-label="${nom}"]`);
const editor = (props = {}) => render(
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}><div /></UniversalEditorShell>
);

let writeText;
beforeEach(() => {
  mocks.navigate.mockReset();
  writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* T36 (reconciliació T51, 260928) · El comportament viu, deliberat: els tres
   botons inoperatius es pinten igual i continuen clicables, però el clic
   s'intercepta (onClickInoperatiu): no fan la seua acció i pinten l'avís en
   línia, que se'n va sol als DURADA_AVIS_ACCIONS ms. Abans estes proves
   esperaven botons `disabled` i un avís fix, i fallaven. */
test('T36 · a l’editor, Comentar, Compartir i Connectar es pinten igual i continuen clicables; Índex, Traduir i les fletxes, vius', () => {
  const { container } = editor();
  for (const nom of [...INOPERATIUS, ...VIUS]) expect(boto(container, nom).disabled).toBe(false);
  for (const nom of INOPERATIUS) expect(boto(container, nom).classList.contains('accio-inoperativa')).toBe(true);
  for (const nom of VIUS) expect(boto(container, nom).classList.contains('accio-inoperativa')).toBe(false);
  // Sense cap clic, cap avís.
  expect(container.querySelector('.sdp-avis-edicio')).toBeNull();
});

test('T36 · un clic als inoperatius no navega ni copia; Traduir i Índex continuen fent la seua faena', () => {
  const { container } = editor();
  for (const nom of INOPERATIUS) fireEvent.click(boto(container, nom));
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(writeText).not.toHaveBeenCalled();
  fireEvent.click(boto(container, 'Traduir'));
  expect(mocks.navigate).toHaveBeenCalledWith('/traduccions?item_id=page');
  fireEvent.click(boto(container, 'Índex de secció'));
  expect(screen.getByRole('dialog', { name: 'Taula de continguts' })).toBeTruthy();
});

test('T36 · el clic pinta l’avís en línia, just davall de la barra blava i fora de l’article, amb el text del Mestre; se’n va sol', () => {
  vi.useFakeTimers();
  const { container } = editor({ posicioEines: 'davall-entradilla' });
  fireEvent.click(boto(container, 'Compartir'));
  const avis = barra(container).nextElementSibling;
  expect(avis.classList.contains('sdp-avis-edicio')).toBe(true);
  expect(avis.getAttribute('role')).toBe('status');
  expect(avis.textContent).toBe(AVIS_ACCIONS_EDICIO);
  expect(container.querySelector('article.content-wrapper .sdp-avis-edicio')).toBeNull();
  expect(AVIS_ACCIONS_EDICIO).toBe('Aquestos botons no estan operatius mentre edites. Quan es publique, es vorà igual però els botons estaran plenament operatius.');
  expect(DURADA_AVIS_ACCIONS).toBe(5000);
  act(() => { vi.advanceTimersByTime(DURADA_AVIS_ACCIONS - 1); });
  expect(container.querySelector('.sdp-avis-edicio')).not.toBeNull();
  act(() => { vi.advanceTimersByTime(1); });
  expect(container.querySelector('.sdp-avis-edicio')).toBeNull();
});

test('T36 · un segon clic torna a començar el compte (un sol temporitzador viu)', () => {
  vi.useFakeTimers();
  const { container } = editor();
  fireEvent.click(boto(container, 'Comentar'));
  act(() => { vi.advanceTimersByTime(4000); });
  fireEvent.click(boto(container, 'Connectar'));
  act(() => { vi.advanceTimersByTime(4000); });
  expect(container.querySelector('.sdp-avis-edicio')).not.toBeNull();
  act(() => { vi.advanceTimersByTime(1000); });
  expect(container.querySelector('.sdp-avis-edicio')).toBeNull();
});

test('T36 · en desmuntar amb l’avís viu, el temporitzador es neteja', () => {
  vi.useFakeTimers();
  const { container, unmount } = editor();
  const abans = vi.getTimerCount();
  fireEvent.click(boto(container, 'Connectar'));
  expect(vi.getTimerCount()).toBe(abans + 1);
  unmount();
  expect(vi.getTimerCount()).toBe(abans);
});

test('T36 · un adaptador no pot tornar a encendre els botons: les ranures van darrere de ...rest', () => {
  const onClickInoperatiu = vi.fn();
  const { container } = editor({ accionsInoperatives: false, avisAccions: null, onClickInoperatiu });
  for (const nom of INOPERATIUS) expect(boto(container, nom).classList.contains('accio-inoperativa')).toBe(true);
  fireEvent.click(boto(container, 'Comentar'));
  // El clic continua interceptat per la closca: cap navegació, cap handler de l'adaptador i l'avís.
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(onClickInoperatiu).not.toHaveBeenCalled();
  expect(container.querySelector('.sdp-avis-edicio')).not.toBeNull();
});

test('T36 · la lectura pública (UniversalPage sense editor) no canvia: cap avís i tots els botons actius', () => {
  window.history.replaceState(null, '', '/constitucio');
  const { container } = render(<UniversalPage chrome="context" title="Pàgina" />);
  for (const nom of [...PUBLICS, ...VIUS]) expect(boto(container, nom).disabled).toBe(false);
  for (const nom of PUBLICS) expect(boto(container, nom).classList.contains('accio-inoperativa')).toBe(false);
  expect(container.querySelector('.sdp-avis-edicio')).toBeNull();
  expect(barra(container).nextElementSibling.className).toBe('bar-orange');
});

/* T63.2 · El document que s'edita (una nota, una fitxa) encara no té cap xat:
   Comentar continua inoperatiu i el seu nom no n'anuncia cap. Ni un objecte
   tipat que arribe per ...rest el fa operatiu. */
test('T63.2 · a l’editor, Comentar no promet cap xat i no navega, ni amb un objecte tipat', () => {
  const { container } = editor({ objecte: { tipus: 'publicacio', id: 'p1', titol: 'P', ruta: '/mur/p1' } });
  expect(boto(container, 'Comentar')).not.toBeNull();
  expect(barra(container).querySelector('[aria-label="Comentar al xat comú"]')).toBeNull();
  fireEvent.click(boto(container, 'Comentar'));
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(container.querySelector('.sdp-avis-edicio')).not.toBeNull();
});

/* Revisió de T63.2 · El descriptor natural del document que s'edita és una
   nota, i una nota amaga Comentar a la lectura. A l'editor no hi compta: T36
   mana conservar el botó inoperatiu amb l'avís. */
test('T63.2 · a l’editor, un objecte «nota» no s’emporta Comentar: continua inoperatiu i avisa', () => {
  const { container } = editor({ objecte: { tipus: 'nota', id: 'n1', titol: 'Llista', ruta: '/notes?nota=n1' } });
  const comentar = boto(container, 'Comentar');
  expect(comentar).not.toBeNull();
  expect(comentar.classList.contains('accio-inoperativa')).toBe(true);
  expect(barra(container).querySelector('.sp-card-actions').children).toHaveLength(3);
  fireEvent.click(comentar);
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(container.querySelector('.sdp-avis-edicio').textContent).toBe(AVIS_ACCIONS_EDICIO);
});

/* T37 · la graella de components.css col·loca per classe: els tres fills
   directes de la barra han de dur-les, i en este ordre. */
test('T37 · la barra blava té tres fills directes amb les classes que col·loca la graella', () => {
  const { container } = render(<PageFrame chrome="context" title="Pàgina" onConnect={() => {}} />);
  const fills = [...barra(container).children].map((e) => e.className);
  expect(fills).toEqual(['bar-blue-left', 'sp-card-actions', 'btn-connectar sp-card-connect']);
});
