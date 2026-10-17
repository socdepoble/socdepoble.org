/* Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5) · DocumentEditor amb les claus
   opcionals `edicioAvancada` i `placeholderTitol`:
     · la ranura que compon (la botonera del consumidor, els drets i les
       vistes A4 / portada) va dins de l'«Edició avançada», plegada, i no
       davall del títol; la línia del copyright no es pinta entre l'H1 i el
       Subtítol (decisió de direcció);
     · el placeholder de l'H1 i el títol de reserva de la Vista A4 / PDF són el
       de l'adaptador («Nota sense títol» al Bloc);
     · sense les claus, el DOM de sempre i cap clau al DOM. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('./richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div className="sdp-editor-tools" data-testid="eines" />,
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>Llavor</p>' }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';
import { buildPrintDocument } from './DocumentPrintPreview.jsx';

afterEach(cleanup);

const DOC = { id: 'd1', title: '', subtitle: '', lead: '', content: '', copyright: 'CC BY-NC-SA 4.0', formattedDate: '01/01/26', formattedTime: '10:00' };
const pinta = (claus = {}) => render(
  <DocumentEditor adapter={{
    document: DOC, labels: [{ text: 'Sistema' }], updateLocal: vi.fn(), saveRemote: vi.fn(), posicioEines: 'davall-entradilla',
    classificacio: <div className="sdp-classificacio-botonera" data-testid="botonera" />, ...claus
  }} />
);

test('sense les claus: la ranura davall del títol, la línia del copyright i «Sense títol», com sempre', () => {
  const { container } = pinta();
  expect(container.querySelector('details')).toBeNull();
  const capcalera = container.querySelector('header.page-title');
  expect(capcalera.querySelector('.page-title-classificacio [data-testid="botonera"]')).not.toBeNull();
  expect(capcalera.querySelector('.page-title-classificacio .sdp-copyright-control')).not.toBeNull();
  expect(capcalera.querySelector('p.page-title-copyright')).not.toBeNull();
  expect(container.querySelector('.editor-title-input').dataset.placeholder).toBe('Sense títol');
});

test('amb edicioAvancada: la botonera, els drets i les vistes, dins del desplegable plegat; res entre l’H1 i el Subtítol', () => {
  // Una nota nova: cap categoria ni etiqueta assignada.
  const { container } = pinta({ edicioAvancada: true, placeholderTitol: 'Nota sense títol', labels: [] });
  const capcalera = container.querySelector('header.page-title');
  expect([...capcalera.children].map((e) => e.tagName)).toEqual(['H1']);
  const desplegable = container.querySelector('article.content-wrapper > details.sdp-edicio-avancada');
  expect(desplegable.open).toBe(false);
  const ranura = desplegable.querySelector('.page-title-classificacio');
  expect(ranura.querySelector('[data-testid="botonera"]')).not.toBeNull();
  const drets = ranura.querySelector('.sdp-copyright-control');
  expect(drets.querySelector('button[data-sdp-drets]')).not.toBeNull();
  expect([...drets.querySelectorAll('button')].map((b) => b.textContent)).toEqual(expect.arrayContaining(['Vista A4 / PDF', 'Crear portada']));
  expect(container.querySelector('p.page-title-copyright')).toBeNull();
  expect(container.querySelector('.editor-title-input').dataset.placeholder).toBe('Nota sense títol');
  // Cap clau nova al DOM.
  expect(container.querySelector('[edicioavancada], [placeholdertitol], [titolreserva]')).toBeNull();
});

/* Correcció de la revisió adversarial (261016; Bloc 3.9.3: «o assigna
   categories» → «al seu lloc visible real») · Amb categories assignades, les
   píndoles de lectura davall de l'H1; la botonera, dins del desplegable. */
test('amb edicioAvancada i categories assignades: les píndoles davall de l’H1, i la botonera continua plegada', () => {
  const { container } = pinta({ edicioAvancada: true });
  const capcalera = container.querySelector('header.page-title');
  expect([...capcalera.children].map((e) => e.tagName)).toEqual(['H1', 'UL']);
  expect(capcalera.querySelector('ul.page-title-labels').textContent).toBe('Sistema');
  expect(capcalera.querySelector('[data-testid="botonera"]')).toBeNull();
  expect(container.querySelector('details.sdp-edicio-avancada [data-testid="botonera"]')).not.toBeNull();
  expect(container.querySelector('p.page-title-copyright')).toBeNull();
});

test('la Vista A4 / PDF d’un document sense títol diu el títol de reserva de l’adaptador', () => {
  pinta({ edicioAvancada: true, placeholderTitol: 'Nota sense títol' });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Vista A4 / PDF' })); });
  const marc = document.querySelector('iframe.sdp-print-preview');
  expect(marc.getAttribute('srcdoc')).toContain('<h1>Nota sense títol</h1>');
  // Sense reserva, la de sempre.
  expect(buildPrintDocument({ title: '' })).toContain('<h1>Sense títol</h1>');
  expect(buildPrintDocument({ title: '' }, false, '', 'Nota sense títol')).toContain('<title>Nota sense títol</title>');
});
