/* IDEA-58 (ordre del Mestre, 29-10-2026 23:22 CET) · Les fletxes 2D a les
   graelles de /multimedia, com al Finder:
     · la Fototeca publicada (.photo-grid de GaleriaWeb, a
       PaginesEspaiMultimedia.jsx), amb l'espai de treball de veres: → des de
       la fitxa activa de la Columna 2 entra a la graella, → ← ±1, ↓ ↑ la
       fila (3 columnes per geometria simulada), Inici, Fi, i ← des de la
       primera columna torna a la fitxa activa; cap fletxa canvia la URL;
     · la Cronologia: una graella per mes, independents;
     · la Graella d'àlbum (GraellaAlbumLocal.jsx, ul.sdp-arxiu-local__graella):
       al Gestor autònom ← des de la primera columna és −1, i dins d'un espai
       de treball torna a la fitxa activa; cap fletxa tria cap tessel·la;
     · l'Explorador d'arxius en taula (TaulaArxiusLocals.jsx, Gemini 261030
       G6): el <tbody> és una graella d'una columna (una fila per cel·la).
   jsdom no fa layout: les caixes de les cel·les (getBoundingClientRect)
   són d'una graella de 3 columnes de 100 px. */
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext.jsx';

const mocks = vi.hoisted(() => ({ multimedia: null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>
}));
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => ({ mitjans: [], cens: new Map() }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
import MultimediaSection from './MultimediaSection.jsx';
import { GraellaAlbumLocal } from './GraellaAlbumLocal.jsx';
import { TaulaArxiusLocals } from './TaulaArxiusLocals.jsx';
import { entradaDelDetall } from '../../components/universal/workspace/navegacioTeclat.js';
import { agrupaPerMes } from './cronologia.js';

/* Set fotos: 0 1 2 / 3 4 5 / 6 (tres columnes). Quatre d'agost i tres de juliol. */
const MITJANS = Array.from({ length: 7 }, (_, i) => ({
  id: `foto-${i}`,
  title: `Foto ${i}`,
  src: `/assets/fotos/foto-${i}.jpg`,
  tag: 'Arxiu',
  created_at: i < 4 ? `2026-08-0${i + 1}T10:00:00.000Z` : `2026-07-0${i + 1}T10:00:00.000Z`
}));
const COLUMNES = 3;
const CEL_LES = '.photo-grid > *, .sdp-arxiu-local__graella > li';

let ubicacio = null;
function Sonda() {
  ubicacio = useLocation();
  return null;
}

beforeEach(() => {
  mocks.multimedia = { status: 'ready', mediaItems: MITJANS, mediaTimelineGroups: agrupaPerMes(MITJANS) };
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  /* Cada cel·la, en una graella de 3 columnes de 100 px; la resta, sense caixa. */
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function caixa() {
    if (!this.matches(CEL_LES)) return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    const i = [...this.parentElement.children].indexOf(this);
    const top = Math.floor(i / COLUMNES) * 100;
    const left = (i % COLUMNES) * 100;
    return { top, left, right: left + 90, bottom: top + 90, width: 90, height: 90 };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const pinta = (ruta) => render(<MemoryRouter rutaInicial={ruta}><MultimediaSection /><Sonda /></MemoryRouter>);
const llista = () => document.querySelector('#app-grid-list');
const detall = () => document.querySelector('#app-grid-main');
const fitxaActiva = () => llista().querySelector('.sdp-gestor-llista [aria-current="true"]');
/* Prem una tecla on hi ha el focus. Torna si el manejador ha cridat preventDefault. */
const prem = (key, extres = {}) => !fireEvent.keyDown(document.activeElement, { key, ...extres });
const enfoca = (element) => act(() => element.focus());

describe('la Fototeca publicada (.photo-grid)', () => {
  test('→ des de la fitxa activa entra a la graella; → ← ↓ ↑ Inici Fi; ← des de la primera columna torna a la fitxa; cap URL nova', () => {
    pinta('/multimedia?categoria=galeria_tots');
    const graella = detall().querySelector('.photo-grid[data-graella-teclat]');
    const celles = [...graella.children];
    expect(celles).toHaveLength(7);
    const cella = (i) => celles[i];
    const activa = fitxaActiva();
    expect(activa.textContent).toMatch(/^Fototeca de «Galeria publicada · Tots»/);
    const url = ubicacio.search;

    enfoca(activa);
    expect(prem('ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(cella(0));
    prem('ArrowRight');
    expect(document.activeElement).toBe(cella(1));
    prem('ArrowDown');
    expect(document.activeElement).toBe(cella(4));
    /* Davall de la 4 no hi ha cel·la (la 7 no existix): no es mou, ni la pàgina. */
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(cella(4));
    prem('ArrowUp');
    expect(document.activeElement).toBe(cella(1));
    prem('End');
    expect(document.activeElement).toBe(cella(6));
    prem('Home');
    expect(document.activeElement).toBe(cella(0));
    prem('ArrowDown');
    expect(document.activeElement).toBe(cella(3));
    expect(prem('ArrowLeft')).toBe(true);
    expect(document.activeElement).toBe(fitxaActiva());
    expect(ubicacio.search).toBe(url);
  });

  test('cap fletxa amb modificadors; Enter continua obrint la fitxa amb el clic de sempre', () => {
    pinta('/multimedia?categoria=galeria_tots');
    const celles = [...detall().querySelectorAll('.photo-grid > .photo-grid__boto')];
    enfoca(celles[1]);
    expect(prem('ArrowRight', { shiftKey: true })).toBe(false);
    expect(prem('ArrowDown', { ctrlKey: true })).toBe(false);
    expect(document.activeElement).toBe(celles[1]);
    act(() => celles[1].click());
    expect(new URLSearchParams(ubicacio.search).get('item')).toBe('foto-1');
  });
});

describe('la Cronologia: una graella per mes', () => {
  test('cada mes és una graella independent: ↓ i → no salten al mes següent', () => {
    pinta('/multimedia?categoria=galeria_cronologia');
    const graelles = [...detall().querySelectorAll('.photo-grid[data-graella-teclat]')];
    expect(graelles).toHaveLength(2);
    const [primera, segona] = graelles.map((g) => [...g.children]);
    expect(primera).toHaveLength(4);
    expect(segona).toHaveLength(3);
    enfoca(primera[3]);
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(primera[3]);
    expect(prem('ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(primera[3]);
    prem('ArrowUp');
    expect(document.activeElement).toBe(primera[0]);
    enfoca(segona[0]);
    prem('End');
    expect(document.activeElement).toBe(segona[2]);
  });
});

describe('la Graella d’àlbum (GraellaAlbumLocal)', () => {
  const ELEMENTS = Array.from({ length: 7 }, (_, i) => ({
    ruta: `docs/arxiu_${i}.txt`, nom: `arxiu_${i}.txt`, carpeta: 'docs', mida: 1024 * (i + 1), tipus: 'text', vista: 'text', ext: 'txt'
  }));
  const tessela = (container, i) => container.querySelectorAll('.sdp-arxiu-local__graella > li > button')[i];

  test('al Gestor autònom: → ← ↓ ↑ Inici Fi, i ← des de la primera columna és −1; cap fletxa tria cap tessel·la', () => {
    const onSelecciona = vi.fn();
    const { container } = render(<GraellaAlbumLocal t={null} font={null} elements={ELEMENTS} seleccionat="docs/arxiu_4.txt" onSelecciona={onSelecciona} />);
    expect(container.querySelector('ul.sdp-arxiu-local__graella').hasAttribute('data-graella-teclat')).toBe(true);
    enfoca(tessela(container, 0));
    prem('ArrowRight');
    expect(document.activeElement).toBe(tessela(container, 1));
    prem('ArrowDown');
    expect(document.activeElement).toBe(tessela(container, 4));
    prem('ArrowLeft');
    expect(document.activeElement).toBe(tessela(container, 3));
    prem('ArrowLeft');
    expect(document.activeElement).toBe(tessela(container, 2));
    prem('ArrowUp');
    expect(document.activeElement).toBe(tessela(container, 2));
    prem('End');
    expect(document.activeElement).toBe(tessela(container, 6));
    prem('Home');
    expect(document.activeElement).toBe(tessela(container, 0));
    expect(prem('ArrowLeft')).toBe(true);
    expect(document.activeElement).toBe(tessela(container, 0));
    expect(onSelecciona).not.toHaveBeenCalled();
    /* La tessel·la triada continua sent la mateixa (aria-pressed). */
    expect(tessela(container, 4).getAttribute('aria-pressed')).toBe('true');
  });

  test('dins d’un espai de treball, ← des de la primera columna torna a la fitxa activa de la llista', () => {
    const { container } = render(
      <div className="sdp-workspace">
        <ul className="sdp-gestor-llista">
          <li><button type="button" className="sdp-gestor-fitxa">Carpeta docs</button></li>
          <li><button type="button" className="sdp-gestor-fitxa" aria-current="true">Àlbum de docs</button></li>
        </ul>
        <div className="sdp-workspace-detail">
          <GraellaAlbumLocal t={null} font={null} elements={ELEMENTS} ambEstat={false} onSelecciona={vi.fn()} />
        </div>
      </div>
    );
    enfoca(tessela(container, 3));
    expect(prem('ArrowLeft')).toBe(true);
    expect(document.activeElement.textContent).toBe('Àlbum de docs');
    enfoca(tessela(container, 5));
    prem('ArrowLeft');
    expect(document.activeElement).toBe(tessela(container, 4));
  });
});

describe('l’Explorador d’arxius en taula (TaulaArxiusLocals, Gemini 261030 G6)', () => {
  const ELEMENTS = Array.from({ length: 7 }, (_, i) => ({
    ruta: `docs/arxiu_${i}.txt`, nom: `arxiu_${i}.txt`, carpeta: 'docs', mida: 1024 * (i + 1), tipus: 'text', vista: 'text', ext: 'txt'
  }));
  const fila = (container, i) => container.querySelectorAll('.sdp-taula tbody > tr > td:first-child > button')[i];

  beforeEach(() => {
    /* Cada fila, davall de l'anterior: una sola columna, com a la pantalla. */
    Element.prototype.getBoundingClientRect.mockImplementation(function caixa() {
      if (!this.matches('.sdp-taula tbody > tr')) return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
      const top = [...this.parentElement.children].indexOf(this) * 40;
      return { top, left: 0, right: 600, bottom: top + 36, width: 600, height: 36 };
    });
  });

  test('al Gestor autònom: ↓ ↑ Inici Fi, → i ← en l’ordre de lectura; als extrems no es mou; cap fletxa tria cap fila', () => {
    const onSelecciona = vi.fn();
    const { container } = render(<TaulaArxiusLocals t={null} elements={ELEMENTS} seleccionat="docs/arxiu_4.txt" onSelecciona={onSelecciona} />);
    expect(container.querySelector('.sdp-taula tbody').hasAttribute('data-graella-teclat')).toBe(true);
    enfoca(fila(container, 0));
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(fila(container, 1));
    prem('ArrowDown');
    expect(document.activeElement).toBe(fila(container, 2));
    prem('ArrowUp');
    expect(document.activeElement).toBe(fila(container, 1));
    prem('ArrowRight');
    expect(document.activeElement).toBe(fila(container, 2));
    prem('ArrowLeft');
    expect(document.activeElement).toBe(fila(container, 1));
    prem('End');
    expect(document.activeElement).toBe(fila(container, 6));
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(fila(container, 6));
    prem('Home');
    expect(document.activeElement).toBe(fila(container, 0));
    expect(prem('ArrowUp')).toBe(true);
    expect(document.activeElement).toBe(fila(container, 0));
    expect(prem('ArrowDown', { shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(fila(container, 0));
    expect(onSelecciona).not.toHaveBeenCalled();
    expect(fila(container, 4).getAttribute('aria-pressed')).toBe('true');
  });

  test('la regió de la taula conserva les seues fletxes (el desplaçament horitzontal)', () => {
    const { container } = render(<TaulaArxiusLocals t={null} elements={ELEMENTS} onSelecciona={vi.fn()} />);
    const regio = container.querySelector('.sdp-taula[role="region"]');
    enfoca(regio);
    expect(prem('ArrowRight')).toBe(false);
    expect(prem('ArrowDown')).toBe(false);
    expect(document.activeElement).toBe(regio);
  });

  test('dins d’un espai de treball: → des de la llista entra a la primera fila i ← des de qualsevol fila torna a la fitxa activa', () => {
    const { container } = render(
      <div className="sdp-workspace">
        <ul className="sdp-gestor-llista">
          <li><button type="button" className="sdp-gestor-fitxa">Carpeta docs</button></li>
          <li><button type="button" className="sdp-gestor-fitxa" aria-current="true">Fitxers de docs</button></li>
        </ul>
        <div className="sdp-workspace-detail" id="detall-taula" tabIndex={-1}>
          <button type="button">Abans de la taula</button>
          <TaulaArxiusLocals t={null} elements={ELEMENTS} ambEstat={false} onSelecciona={vi.fn()} />
        </div>
      </div>
    );
    expect(entradaDelDetall(container.querySelector('#detall-taula'))).toBe(fila(container, 0));
    enfoca(fila(container, 3));
    expect(prem('ArrowLeft')).toBe(true);
    expect(document.activeElement.textContent).toBe('Fitxers de docs');
    enfoca(fila(container, 5));
    prem('ArrowUp');
    expect(document.activeElement).toBe(fila(container, 4));
  });
});
