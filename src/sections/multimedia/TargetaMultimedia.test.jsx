/* P1-71 (Onada R21) · La vista d'àlbum de /multimedia, neta i sobre la
   graella universal:
     · TargetaMultimedia (la tessel·la de la Graella d'àlbum): un sol control
       natiu amb nom, cap acció social ni de moderació, cap enllaç ni botó
       niat; la miniatura que no es pot pintar torna a la icona del tipus,
       sense cap estil en línia;
     · les dues graelles d'àlbum (GraellaAlbumLocal i la Fototeca publicada,
       amb Cella): cap botó d'acció social, cap botó sense nom accessible i
       una sola parada de teclat per cel·la, també amb una foto trencada o
       sense títol;
     · la graella és la universal de l'espai de treball (navegacioTeclat.js:
       [data-graella-teclat] + gestionaTeclaGraella), la que
       UniversalWorkspace troba en entrar al detall (entradaDelDetall), i les
       cel·les són TargetaMultimedia, no la UniversalCard de les publicacions
       (GraellaTargetes): eixa portaria la boina i el peu social. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FileText } from 'lucide-react';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';

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
import { Cella } from './PaginesEspaiMultimedia.jsx';
import { TargetaMultimedia } from './TargetaMultimedia.jsx';
import { agrupaPerMes } from './cronologia.js';
import { entradaDelDetall } from '../../components/universal/workspace/navegacioTeclat.js';

const DIR = path.join(process.cwd(), 'src/sections/multimedia');
const llig = (nom) => readFileSync(path.join(DIR, nom), 'utf8');

/* El que portaria la targeta d'una publicació (UniversalCard i la barra blava): cap ha d'eixir en un recurs d'àlbum. */
const ACCIO_SOCIAL = /connectar|comentar|compartir|traduir|m[’']agrada|més opcions|ancorar|denunciar|bloquejar/i;
const CROM_DE_PUBLICACIO = '.sp-card, .sp-card-header, .sp-card-footer, .sp-card-actions, .sp-card-link-overlay, .btn-connectar, [aria-haspopup], a';
const ENFOCABLE = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]:not([contenteditable="false"]), [role="button"]';

/* Cap botó d'acció social, cap botó sense nom i una sola parada per cel·la (fill directe de la graella). */
function esperaGraellaNeta(graella) {
  const botons = within(graella).getAllByRole('button');
  expect(botons.length).toBeGreaterThan(0);
  const ambNom = within(graella).getAllByRole('button', { name: /\S/ });
  expect(ambNom).toHaveLength(botons.length);
  expect(ambNom.every((boto, i) => boto === botons[i])).toBe(true);
  expect(within(graella).queryAllByRole('button', { name: ACCIO_SOCIAL })).toEqual([]);
  expect(within(graella).queryAllByRole('link')).toEqual([]);
  expect(graella.querySelectorAll(CROM_DE_PUBLICACIO)).toHaveLength(0);
  expect(graella.querySelectorAll('[style]')).toHaveLength(0);
  for (const cella of graella.children) {
    const parades = [cella, ...cella.querySelectorAll(ENFOCABLE)].filter((element) => element.matches(ENFOCABLE));
    expect(parades, cella.outerHTML).toHaveLength(1);
  }
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('TargetaMultimedia: la targeta d’un recurs d’àlbum', () => {
  const pinta = (props = {}) => render(
    <TargetaMultimedia nom="acta.pdf" meta="docs · 2 KB" icona={FileText} extensio="pdf" arxiu onTria={vi.fn()} {...props}>
      <span className="sdp-arxiu-local__insignies"><span className="sdp-insignia sdp-insignia--avis">Inèdita</span></span>
    </TargetaMultimedia>
  );

  test('un sol botó natiu amb nom (nom, carpeta · mida i insígnies), sense res social ni niat', () => {
    const onTria = vi.fn();
    const { container, getByRole } = pinta({ onTria });
    const boto = getByRole('button', { name: /^acta\.pdf/ });
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.className).toBe('sdp-arxiu-local__tessela sdp-arxiu-local__tessela--arxiu');
    expect(within(boto).getByText('docs · 2 KB')).toBeTruthy();
    expect(within(boto).getByText('Inèdita')).toBeTruthy();
    expect(boto.querySelector('.sdp-arxiu-local__icona').getAttribute('aria-hidden')).toBe('true');
    expect(boto.querySelector('.sdp-arxiu-local__ext').textContent).toBe('.pdf');
    expect(boto.querySelectorAll(ENFOCABLE)).toHaveLength(0);
    expect(container.querySelectorAll(CROM_DE_PUBLICACIO)).toHaveLength(0);
    act(() => boto.click());
    expect(onTria).toHaveBeenCalledTimes(1);
  });

  test('aria-pressed només amb `premuda` booleà (el Gestor autònom); a l’espai, cap atribut', () => {
    expect(pinta({ premuda: true }).getByRole('button').getAttribute('aria-pressed')).toBe('true');
    cleanup();
    expect(pinta({ premuda: false }).getByRole('button').getAttribute('aria-pressed')).toBe('false');
    cleanup();
    expect(pinta().getByRole('button').hasAttribute('aria-pressed')).toBe(false);
  });

  test('una imatge: miniatura decorativa (alt buit) i la pell de la imatge, sense la d’arxiu', () => {
    const { getByRole } = pinta({ nom: 'foto.png', arxiu: false, miniatura: 'blob:prova/1', extensio: 'png' });
    const boto = getByRole('button', { name: /^foto\.png/ });
    expect(boto.className).toBe('sdp-arxiu-local__tessela');
    const img = boto.querySelector('img.sdp-arxiu-local__miniatura');
    expect(img.getAttribute('src')).toBe('blob:prova/1');
    expect(img.getAttribute('alt')).toBe('');
    expect(boto.querySelector('.sdp-arxiu-local__icona')).toBeNull();
  });

  test('una miniatura que no es pot pintar torna a la icona del tipus (cap quadrat buit, cap estil en línia); una de nova es torna a provar', () => {
    const { container, getByRole, rerender } = pinta({ nom: 'trencada.png', arxiu: false, miniatura: 'blob:prova/2', extensio: 'png' });
    act(() => { fireEvent.error(container.querySelector('img')); });
    const boto = getByRole('button', { name: /^trencada\.png/ });
    expect(boto.querySelector('img')).toBeNull();
    expect(boto.querySelector('.sdp-arxiu-local__icona .sdp-arxiu-local__ext').textContent).toBe('.png');
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
    rerender(<TargetaMultimedia nom="trencada.png" meta="docs · 2 KB" icona={FileText} extensio="png" miniatura="blob:prova/3" onTria={vi.fn()} />);
    expect(container.querySelector('img.sdp-arxiu-local__miniatura').getAttribute('src')).toBe('blob:prova/3');
  });

  test('sense icona, la d’un fitxer genèric: mai un botó buit', () => {
    const { getByRole } = render(<TargetaMultimedia nom="x.bin" meta="/ · 1 KB" arxiu onTria={vi.fn()} />);
    const boto = getByRole('button', { name: /^x\.bin/ });
    expect(boto.querySelector('.sdp-arxiu-local__icona svg')).not.toBeNull();
    expect(boto.querySelector('.sdp-arxiu-local__ext')).toBeNull();
  });
});

describe('la Graella d’àlbum (GraellaAlbumLocal) sobre la graella universal', () => {
  const ELEMENTS = [
    { ruta: 'fotos/foto.png', nom: 'foto.png', carpeta: 'fotos', mida: 2048, tipus: 'imatge', vista: 'imatge', ext: 'png' },
    { ruta: 'fotos/logo.svg', nom: 'logo.svg', carpeta: 'fotos', mida: 512, tipus: 'imatge', vista: 'svg', ext: 'svg' },
    { ruta: 'docs/acta.pdf', nom: 'acta.pdf', carpeta: 'docs', mida: 4096, tipus: 'document', vista: 'pdf', ext: 'pdf' },
    { ruta: 'docs/nota.txt', nom: 'nota.txt', carpeta: 'docs', mida: 10, tipus: 'text', vista: 'text', ext: 'txt' },
    { ruta: 'so/tros.mp3', nom: 'tros.mp3', carpeta: 'so', mida: 9000, tipus: 'audio', vista: 'audio', ext: 'mp3' },
    { ruta: 'raro.xyz', nom: 'raro.xyz', carpeta: '', mida: 1, tipus: 'desconegut', vista: 'cap', ext: '' }
  ];

  test('cada cel·la és una TargetaMultimedia neta: cap botó social, cap botó sense nom, una sola parada', () => {
    const { container } = render(<GraellaAlbumLocal t={null} font={null} elements={ELEMENTS} seleccionat="docs/acta.pdf" onSelecciona={vi.fn()} />);
    const graella = container.querySelector('ul.sdp-arxiu-local__graella');
    expect([...graella.children].map((li) => li.tagName)).toEqual(ELEMENTS.map(() => 'LI'));
    expect([...graella.children].every((li) => li.children.length === 1 && li.firstElementChild.matches('button.sdp-arxiu-local__tessela'))).toBe(true);
    esperaGraellaNeta(graella);
    /* Les imatges, amb la pell d'imatge; la resta, amb la d'arxiu. */
    const pells = [...graella.querySelectorAll('button')].map((b) => b.classList.contains('sdp-arxiu-local__tessela--arxiu'));
    expect(pells).toEqual([false, false, true, true, true, true]);
  });

  test('a l’espai de /multimedia (sense estat), tampoc: cap aria-pressed i la mateixa neteja', () => {
    const { container } = render(<GraellaAlbumLocal t={null} font={null} elements={ELEMENTS} ambEstat={false} onSelecciona={vi.fn()} />);
    const graella = container.querySelector('ul.sdp-arxiu-local__graella');
    expect(graella.querySelectorAll('[aria-pressed]')).toHaveLength(0);
    esperaGraellaNeta(graella);
  });

  test('la graella és la universal de l’espai de treball: [data-graella-teclat], fletxes i l’entrada del detall a la triada', () => {
    const onSelecciona = vi.fn();
    const { container } = render(
      <div id="detall" tabIndex={-1}>
        <GraellaAlbumLocal t={null} font={null} elements={ELEMENTS} seleccionat="docs/nota.txt" onSelecciona={onSelecciona} />
      </div>
    );
    const graella = container.querySelector('ul.sdp-arxiu-local__graella');
    expect(graella.hasAttribute('data-graella-teclat')).toBe(true);
    const targetes = [...graella.querySelectorAll(':scope > li > button')];
    /* UniversalWorkspace entra al detall per la cel·la triada (aria-pressed), la del contracte universal. */
    expect(entradaDelDetall(container.querySelector('#detall'))).toBe(targetes[3]);
    act(() => targetes[0].focus());
    expect(fireEvent.keyDown(targetes[0], { key: 'ArrowRight' })).toBe(false);
    expect(document.activeElement).toBe(targetes[1]);
    fireEvent.keyDown(targetes[1], { key: 'End' });
    expect(document.activeElement).toBe(targetes[5]);
    expect(onSelecciona).not.toHaveBeenCalled();
    act(() => targetes[2].click());
    expect(onSelecciona).toHaveBeenCalledWith(ELEMENTS[2]);
  });

  test('el codi: graella universal i TargetaMultimedia, mai la UniversalCard de les publicacions ni el seu peu social', () => {
    const graella = llig('GraellaAlbumLocal.jsx');
    const targeta = llig('TargetaMultimedia.jsx');
    expect(graella).toMatch(/import \{ gestionaTeclaGraella \} from '\.\.\/\.\.\/components\/universal\/workspace\/navegacioTeclat\.js';/);
    expect(graella).toMatch(/import \{ TargetaMultimedia \} from '\.\/TargetaMultimedia\.jsx';/);
    expect(graella).toMatch(/<TargetaMultimedia\b/);
    const vetats = /\b(?:UniversalCard|Targeta|GraellaTargetes|BotoComentar|BotoModeracio|useAccions)\b|\bstyle=/;
    for (const [nom, font] of [['GraellaAlbumLocal.jsx', graella], ['TargetaMultimedia.jsx', targeta]]) {
      const codi = font.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(vetats.test(codi), nom).toBe(false);
    }
  });
});

describe('la Fototeca publicada (Cella): cap botó fantasma', () => {
  test('una foto sense títol ni etiqueta es diu «Imatge sense títol», no res', () => {
    const { getByRole } = render(<Cella item={{ id: 'anonima', src: '/assets/fotos/anonima.jpg' }} onObri={vi.fn()} t={null} />);
    const boto = getByRole('button', { name: 'Imatge sense títol' });
    expect(boto.querySelector('img').getAttribute('alt')).toBe('Imatge sense títol');
  });

  test('una foto que no carrega: el quadre «Sense imatge» amb el nom per al lector, cap estil en línia', () => {
    const onObri = vi.fn();
    const item = { id: 'trencada', title: 'La plaça', src: '/assets/fotos/no-existix.jpg' };
    const { container, getByRole } = render(<Cella item={item} onObri={onObri} t={null} />);
    act(() => { fireEvent.error(container.querySelector('img')); });
    const boto = getByRole('button', { name: 'La plaça' });
    expect(boto.querySelector('img')).toBeNull();
    expect(boto.querySelector('.photo-grid__item > .media-frame__buit > .sdp-sr-only').textContent).toBe('La plaça');
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
    act(() => boto.click());
    expect(onObri).toHaveBeenCalledWith(item);
  });

  test('trencada i sense títol: el lector diu «Sense imatge», mai un botó mut', () => {
    const { container, getByRole } = render(<Cella item={{ id: 'muda', src: '/assets/fotos/muda.jpg' }} onObri={vi.fn()} t={null} />);
    act(() => { fireEvent.error(container.querySelector('img')); });
    expect(getByRole('button', { name: 'Sense imatge' })).toBeTruthy();
  });
});

describe('les galeries publicades de /multimedia, senceres', () => {
  const MITJANS = [
    { id: 'foto-0', title: 'Foto 0', src: '/assets/fotos/foto-0.jpg', tag: 'Arxiu', created_at: '2026-08-01T10:00:00.000Z' },
    { id: 'foto-1', title: '', tag: '', src: '/assets/fotos/foto-1.jpg', created_at: '2026-08-02T10:00:00.000Z' },
    { id: 'foto-2', title: 'Foto 2', src: '/assets/fotos/foto-2.jpg', created_at: '2026-07-03T10:00:00.000Z' },
    { id: 'foto-3', title: 'Sense fitxer', created_at: '2026-07-04T10:00:00.000Z' }
  ];

  beforeEach(() => {
    mocks.multimedia = { status: 'ready', mediaItems: MITJANS, mediaTimelineGroups: agrupaPerMes(MITJANS) };
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  });

  const pinta = (ruta) => render(<MemoryRouter rutaInicial={ruta}><MultimediaSection /></MemoryRouter>);
  const detall = () => document.querySelector('#app-grid-main');

  test('«Tots»: cada cel·la, un botó amb nom; cap acció social ni enllaç, tampoc amb una foto trencada', () => {
    pinta('/multimedia?categoria=galeria_tots');
    const graella = detall().querySelector('.photo-grid[data-graella-teclat]');
    expect(graella.children).toHaveLength(MITJANS.length);
    esperaGraellaNeta(graella);
    act(() => { fireEvent.error(graella.querySelector('img[alt="Foto 2"]')); });
    esperaGraellaNeta(graella);
    expect(within(graella).getByRole('button', { name: 'Foto 2' }).querySelector('img')).toBeNull();
  });

  test('la Cronologia: cada mes, una graella igual de neta', () => {
    pinta('/multimedia?categoria=galeria_cronologia');
    const graelles = [...detall().querySelectorAll('.photo-grid[data-graella-teclat]')];
    expect(graelles).toHaveLength(2);
    graelles.forEach(esperaGraellaNeta);
  });
});
