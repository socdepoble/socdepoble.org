import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
// Router, avisos i assets fora: es prova la barra blava de l'editor tal com la pinta PageFrame.
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { UniversalEditorShell, AVIS_ACCIONS_EDICIO } from './UniversalEditorShell.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { PageFrame } from './PageFrame.jsx';

const INOPERATIUS = ['Comentar (Xat Privat)', 'Compartir', 'Connectar'];
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
afterEach(cleanup);

test('T36 · a l’editor, Comentar, Compartir i Connectar es pinten desactivats; Índex, Traduir i les fletxes no', () => {
  const { container } = editor();
  for (const nom of INOPERATIUS) expect(boto(container, nom).disabled).toBe(true);
  for (const nom of VIUS) expect(boto(container, nom).disabled).toBe(false);
});

test('T36 · un clic als desactivats no navega ni copia; Traduir i Índex continuen fent la seua faena', () => {
  const { container } = editor();
  for (const nom of INOPERATIUS) fireEvent.click(boto(container, nom));
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(writeText).not.toHaveBeenCalled();
  fireEvent.click(boto(container, 'Traduir'));
  expect(mocks.navigate).toHaveBeenCalledWith('/traduccions?item_id=page');
  fireEvent.click(boto(container, 'Índex de secció'));
  expect(screen.getByRole('dialog', { name: 'Taula de continguts' })).toBeTruthy();
});

test('T36 · l’avís és en línia (no efímer), just davall de la barra blava i fora de l’article, amb el text del Mestre', () => {
  const { container } = editor({ posicioEines: 'davall-entradilla' });
  const avis = barra(container).nextElementSibling;
  expect(avis.classList.contains('sdp-avis-edicio')).toBe(true);
  expect(avis.getAttribute('role')).toBe('status');
  expect(avis.textContent).toBe(AVIS_ACCIONS_EDICIO);
  expect(container.querySelector('article.content-wrapper .sdp-avis-edicio')).toBeNull();
  expect(AVIS_ACCIONS_EDICIO).toBe('Aquestos botons no estan operatius mentre edites. Quan es publique, es vorà igual però els botons estaran plenament operatius.');
});

test('T36 · un adaptador no pot tornar a encendre els botons: les ranures van darrere de ...rest', () => {
  const { container } = editor({ accionsInoperatives: false, avisAccions: null });
  for (const nom of INOPERATIUS) expect(boto(container, nom).disabled).toBe(true);
  expect(container.querySelector('.sdp-avis-edicio')).not.toBeNull();
});

test('T36 · la lectura pública (UniversalPage sense editor) no canvia: cap avís i tots els botons actius', () => {
  const { container } = render(<UniversalPage chrome="context" title="Pàgina" />);
  for (const nom of [...INOPERATIUS, ...VIUS]) expect(boto(container, nom).disabled).toBe(false);
  expect(container.querySelector('.sdp-avis-edicio')).toBeNull();
  expect(barra(container).nextElementSibling.className).toBe('bar-orange');
});

/* T37 · la graella de components.css col·loca per classe: els tres fills
   directes de la barra han de dur-les, i en este ordre. */
test('T37 · la barra blava té tres fills directes amb les classes que col·loca la graella', () => {
  const { container } = render(<PageFrame chrome="context" title="Pàgina" onConnect={() => {}} />);
  const fills = [...barra(container).children].map((e) => e.className);
  expect(fills).toEqual(['bar-blue-left', 'sp-card-actions', 'btn-connectar sp-card-connect']);
});
