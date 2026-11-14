/* Onada R26 (Bloc A) · Verificació del carril de Claude sobre el kit de
   Gemini: en ample (no compacte), «Publicar al Mur» / «Actualitzar al Mur»
   només es pinta si el grup de publicació hi cap sencer al costat de «⋯» (i
   de la tornada, en mòbil); si no, «Publicar», com en compacte. Mesurat en
   Chrome amb els fulls reals (vista «estret», amb la tornada i «🎴»): de 500
   a 542 px, «Actualizar en el Mercado», «Actualitzar al Mercat» o
   «Eguneratu Merkatuan» passaven el botó a una segona línia i la barra a dues
   files (de 57 a 109 px), el que la R2 (geometria360) ja havia tancat.
   jsdom no té maquetació: ací, amplàries simulades, com a segonaFila. */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import UniversalToolbar from './UniversalToolbar.jsx';

let observadors = [];
const amplada = (px) => {
  observadors = [];
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; observadors.push(this); }
    observe() { this.callback([{ contentRect: { width: px } }]); }
    disconnect() {}
  });
};
const redimensiona = (px) => act(() => { for (const o of observadors) o.callback([{ contentRect: { width: px } }]); });

const restauracions = [];
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  while (restauracions.length) restauracions.pop()();
});

/* L'amplària útil de la fila i la de cada peça: el botó de publicar fa
   segons el text que pinta (la pastilla és flex: none). */
const AMPLES_PUBLICAR = { 'Publicar al Mur': 180, 'Actualitzar al Mur': 205, Publicar: 115, Publicat: 113 };
function maquetacio({ fila }) {
  const estat = { fila };
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() { return this.classList.contains('sdp-editor-tools__formats') ? estat.fila : 0; }
  });
  const rectAbans = HTMLElement.prototype.getBoundingClientRect;
  const ampleDe = (el) => {
    if (el.dataset.eina === 'encapcalament') return 60;
    if (el.dataset.eina) return 48;
    if (el.classList.contains('sdp-editor-tools__amplia')) return 48;
    if (el.classList.contains('sdp-bloc-action--publicar') || el.classList.contains('sdp-bloc-action--publicat')) {
      return AMPLES_PUBLICAR[el.textContent] ?? 0;
    }
    if (el.classList.contains('sdp-bloc-action')) return 100;
    if (el.classList.contains('sdp-editor-tools__group--publicacio')) {
      return [...el.children].reduce((suma, fill) => suma + ampleDe(fill), 0);
    }
    return 0;
  };
  HTMLElement.prototype.getBoundingClientRect = function rect() {
    const width = ampleDe(this);
    return { width, height: width ? 48 : 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON() {} };
  };
  restauracions.push(() => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    HTMLElement.prototype.getBoundingClientRect = rectAbans;
  });
  return estat;
}

const botoPublicar = () => document.querySelector('.sdp-editor-tools__group--publicacio .sdp-bloc-action--publicar, .sdp-editor-tools__group--publicacio .sdp-bloc-action--publicat');

test('en ample, l’etiqueta llarga només si el grup de publicació hi cap; si no, «Publicar», sense anar i tornar', () => {
  // «⋯» (48) + Borrar (100) + «Publicar al Mur» (180) = 328 px.
  const lloc = maquetacio({ fila: 600 });
  amplada(600);
  const props = { onPublish: () => {}, onDelete: () => {}, publishLabel: null, publishLabelWide: 'Publicar al Mur', publishState: 'pendent' };
  const { rerender } = render(<UniversalToolbar {...props} />);
  expect(botoPublicar().textContent).toBe('Publicar al Mur');

  // 300 px útils (encara no és compacte: l'amplària pròpia continua sent de 600).
  lloc.fila = 300;
  redimensiona(601);
  expect(screen.getByRole('group', { name: 'Eines de l\'editor' }).getAttribute('data-compact')).toBe('false');
  expect(botoPublicar().textContent).toBe('Publicar');
  // Estable: un altre pintat amb «Publicar» no la torna a allargar.
  redimensiona(602);
  expect(botoPublicar().textContent).toBe('Publicar');

  // Una etiqueta llarga nova que encara no s'ha mesurat: es mesura i, si no hi cap, «Publicar».
  rerender(<UniversalToolbar {...props} publishLabelWide="Actualitzar al Mur" />);
  expect(botoPublicar().textContent).toBe('Publicar');

  // Torna el lloc: torna l'etiqueta llarga.
  lloc.fila = 600;
  redimensiona(603);
  expect(botoPublicar().textContent).toBe('Actualitzar al Mur');

  // publishLabel continua manant (una nota que es compartix).
  rerender(<UniversalToolbar {...props} publishLabel="Compartir" publishState={null} />);
  expect(document.querySelector('.sdp-editor-tools__group--publicacio .sdp-bloc-action:last-child').textContent).toBe('Compartir');
});

test('sense etiqueta llarga, cap canvi: «Publicar» o «Publicat» com sempre', () => {
  maquetacio({ fila: 300 });
  amplada(600);
  const { rerender } = render(<UniversalToolbar onPublish={() => {}} publishState="pendent" />);
  expect(botoPublicar().textContent).toBe('Publicar');
  rerender(<UniversalToolbar onPublish={() => {}} publishState="publicat" />);
  expect(botoPublicar().textContent).toBe('Publicat');
});
