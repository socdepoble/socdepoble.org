import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), showToast: vi.fn() }));
// Router, avisos i assets fora: es prova la barra blava de l'editor tal com la pinta PageFrame.
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
import { UniversalEditorShell, AVISOS_ACCIONS_EDICIO, DURADA_AVIS_ACCIONS } from './UniversalEditorShell.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { PageFrame } from './PageFrame.jsx';

/* T63.2 · A l'editor Comentar és inoperatiu (T36) i no porta a cap xat: el seu
   nom és només «Comentar». A la lectura pública, el xat comú de la pàgina.
   Ordre del Mestre (261007) · «COMENTARIS = XAT» · A la lectura pública,
   Comentar també es diu «Comentar», però obri el menú de dues vies
   (aria-haspopup). A l'editor no obri cap menú. */
const INOPERATIUS = ['Comentar', 'Compartir', 'Connectar'];
const PUBLICS = ['Comentar', 'Compartir', 'Connectar'];
const VIUS = ['Tornar arrere', 'Índex de secció', 'Tornar endavant', 'Traduir'];
const CLAUS = { Comentar: 'comentar', Compartir: 'compartir', Connectar: 'connectar' };
const barra = (container) => container.querySelector('header.bar-blue');
const boto = (container, nom) => barra(container).querySelector(`button[aria-label="${nom}"]`);
const editor = (props = {}) => render(
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}><div /></UniversalEditorShell>
);
const missatges = () => mocks.showToast.mock.calls.map(([missatge]) => missatge);

let writeText;
beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.showToast.mockReset();
  writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* T36 (reconciliació T51, 260928) · Els tres botons inoperatius es pinten
   igual i continuen clicables, però el clic s'intercepta (onClickInoperatiu).
   T7 (P7) · Porten aria-disabled="true" (no `disabled`: es poden enfocar i
   llegir), i cap avís en línia empeny el contingut. */
test('T7 · a l’editor, Comentar, Compartir i Connectar porten aria-disabled i continuen enfocables; Índex, Traduir i les fletxes, vius', () => {
  const { container } = editor();
  for (const nom of [...INOPERATIUS, ...VIUS]) expect(boto(container, nom).disabled).toBe(false);
  for (const nom of INOPERATIUS) {
    expect(boto(container, nom).classList.contains('accio-inoperativa')).toBe(true);
    expect(boto(container, nom).getAttribute('aria-disabled')).toBe('true');
  }
  for (const nom of VIUS) {
    expect(boto(container, nom).classList.contains('accio-inoperativa')).toBe(false);
    expect(boto(container, nom).hasAttribute('aria-disabled')).toBe(false);
  }
  boto(container, 'Connectar').focus();
  expect(document.activeElement).toBe(boto(container, 'Connectar'));
  expect(mocks.showToast).not.toHaveBeenCalled();
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

test('T7 · cada botó mostra el seu missatge ràpid (info, DURADA_AVIS_ACCIONS) i el contingut no es mou', () => {
  const { container } = editor({ posicioEines: 'davall-entradilla' });
  const abans = container.innerHTML;
  for (const nom of INOPERATIUS) fireEvent.click(boto(container, nom));
  expect(mocks.showToast.mock.calls).toEqual(INOPERATIUS.map((nom) => [AVISOS_ACCIONS_EDICIO[CLAUS[nom]], 'info', DURADA_AVIS_ACCIONS]));
  // Cap avís en línia: el DOM de la closca és el mateix que abans dels clics.
  expect(container.innerHTML).toBe(abans);
  expect(barra(container).nextElementSibling.classList.contains('sdp-alerta')).toBe(false);
  expect(DURADA_AVIS_ACCIONS).toBe(5000);
});

test('T7 · els tres missatges són propis i diuen quin botó és; cap text genèric compartit', () => {
  expect(Object.keys(AVISOS_ACCIONS_EDICIO)).toEqual(['comentar', 'compartir', 'connectar']);
  const textos = Object.values(AVISOS_ACCIONS_EDICIO);
  expect(new Set(textos).size).toBe(3);
  expect(AVISOS_ACCIONS_EDICIO.comentar).toMatch(/^Comentar no està operatiu mentre edites\./);
  expect(AVISOS_ACCIONS_EDICIO.compartir).toMatch(/^Compartir no està operatiu mentre edites\./);
  expect(AVISOS_ACCIONS_EDICIO.connectar).toMatch(/^Connectar no està operatiu mentre edites\./);
  expect(Object.isFrozen(AVISOS_ACCIONS_EDICIO)).toBe(true);
});

test('T7 · la closca no arma cap temporitzador propi: el compte és del NotificationProvider', () => {
  vi.useFakeTimers();
  const { container, unmount } = editor();
  const abans = vi.getTimerCount();
  fireEvent.click(boto(container, 'Connectar'));
  fireEvent.click(boto(container, 'Comentar'));
  expect(vi.getTimerCount()).toBe(abans);
  unmount();
  expect(vi.getTimerCount()).toBeLessThanOrEqual(abans);
});

test('T36 · un adaptador no pot tornar a encendre els botons ni pintar un avís en línia: les ranures van darrere de ...rest', () => {
  const onClickInoperatiu = vi.fn();
  const { container } = editor({
    accionsInoperatives: false, avisAccions: <p className="avis-adaptador">Avís</p>, onClickInoperatiu
  });
  for (const nom of INOPERATIUS) {
    expect(boto(container, nom).classList.contains('accio-inoperativa')).toBe(true);
    expect(boto(container, nom).getAttribute('aria-disabled')).toBe('true');
  }
  fireEvent.click(boto(container, 'Comentar'));
  // El clic continua interceptat per la closca: cap navegació, cap handler de l'adaptador i el missatge propi.
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(onClickInoperatiu).not.toHaveBeenCalled();
  expect(missatges()).toEqual([AVISOS_ACCIONS_EDICIO.comentar]);
  expect(container.querySelector('.avis-adaptador')).toBeNull();
});

test('T36 · la lectura pública (UniversalPage sense editor) no canvia: cap aria-disabled, cap missatge i tots els botons actius', () => {
  window.history.replaceState(null, '', '/constitucio');
  const { container } = render(<UniversalPage chrome="context" title="Pàgina" />);
  for (const nom of [...PUBLICS, ...VIUS]) {
    expect(boto(container, nom).disabled).toBe(false);
    expect(boto(container, nom).hasAttribute('aria-disabled')).toBe(false);
  }
  for (const nom of PUBLICS) expect(boto(container, nom).classList.contains('accio-inoperativa')).toBe(false);
  // 261007 · A la lectura, Comentar obri el menú de dues vies.
  expect(boto(container, 'Comentar').getAttribute('aria-haspopup')).toBe('menu');
  expect(barra(container).nextElementSibling.className).toBe('bar-orange');
  fireEvent.click(boto(container, 'Connectar'));
  expect(mocks.showToast).not.toHaveBeenCalled();
});

/* T63.2 · El document que s'edita (una nota, una fitxa) encara no té cap xat:
   Comentar continua inoperatiu i el seu nom no n'anuncia cap. Ni un objecte
   tipat que arribe per ...rest el fa operatiu.
   Ordre del Mestre (261007, correcció C5) · Ni anuncia cap menú: cap
   aria-haspopup ni aria-expanded, i el clic no n'obri cap. */
test('T63.2 · a l’editor, Comentar no promet cap xat, no obri cap menú i no navega, ni amb un objecte tipat', () => {
  const { container } = editor({ objecte: { tipus: 'publicacio', id: 'p1', titol: 'P', ruta: '/mur/p1' } });
  const comentar = boto(container, 'Comentar');
  expect(comentar).not.toBeNull();
  expect(comentar.hasAttribute('aria-haspopup')).toBe(false);
  expect(comentar.hasAttribute('aria-expanded')).toBe(false);
  fireEvent.click(comentar);
  expect(barra(container).querySelector('[role="menu"]')).toBeNull();
  expect(comentar.hasAttribute('aria-expanded')).toBe(false);
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(missatges()).toEqual([AVISOS_ACCIONS_EDICIO.comentar]);
});

/* Revisió de T63.2 · El descriptor natural del document que s'edita és una
   nota, i una nota amaga Comentar a la lectura. A l'editor no hi compta: T36
   mana conservar el botó inoperatiu, ara amb el seu missatge (T7). */
test('T63.2 · a l’editor, un objecte «nota» no s’emporta Comentar: continua inoperatiu i avisa', () => {
  const { container } = editor({ objecte: { tipus: 'nota', id: 'n1', titol: 'Llista', ruta: '/notes?nota=n1' } });
  const comentar = boto(container, 'Comentar');
  expect(comentar).not.toBeNull();
  expect(comentar.classList.contains('accio-inoperativa')).toBe(true);
  expect(comentar.getAttribute('aria-disabled')).toBe('true');
  expect(barra(container).querySelector('.sp-card-actions').children).toHaveLength(3);
  fireEvent.click(comentar);
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(missatges()).toEqual([AVISOS_ACCIONS_EDICIO.comentar]);
});

/* T37 · la graella de components.css col·loca per classe: els tres fills
   directes de la barra han de dur-les, i en este ordre. */
test('T37 · la barra blava té tres fills directes amb les classes que col·loca la graella', () => {
  const { container } = render(<PageFrame chrome="context" title="Pàgina" onConnect={() => {}} />);
  const fills = [...barra(container).children].map((e) => e.className);
  expect(fills).toEqual(['bar-blue-left', 'sp-card-actions', 'btn-connectar sp-card-connect']);
});
