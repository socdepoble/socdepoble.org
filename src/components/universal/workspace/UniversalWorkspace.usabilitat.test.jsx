/* Ordre d'usabilitat transversal del Mestre (30-10-2026 ~13:20) · Les
   columnes 1 i 2 de l'UniversalWorkspace (/notes, /disseny, /wikidepoble,
   /multimedia, /perfil, /lector):
     1. Clicar la icona de l'esquerra fa exactament el que fa el [|<]: plega
        la columna en el rail, el botó de dalt del rail porta la mateixa icona
        al mateix lloc i la torna a desplegar. El focus no es perd: plegada, al
        botó de dalt del rail; desplegada, a la icona (l'equivalent).
     2. L'acordió (CARPETES del Bloc i del Lector, PERFIL) plega la llista i no
        la columna; sense acordió (collapsibleNavigation false: Disseny, Wiki,
        Multimèdia) el títol és text fix. Corrector del Gauntlet f4
        (30-10-2026) · replegaTotaCapcalera ja no la passa cap pàgina: l'espai
        no la llig.
   En «estret» (mòbil) no canvia res: la navegació no porta [|<] visible i la
   capçalera de la llista porta l'obridor davant, així que cap icona no és
   botó. jsdom no fa layout: l'amplària i els fotogrames, a mà, com a
   UniversalWorkspace.columnesFixes.test.jsx. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { Component, Folder, LayoutGrid, NotebookPen } from 'lucide-react';

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => null,
  Link: 'a'
}));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
/* El traductor de la interfície: null (la reserva valenciana) llevat de la
   prova de la llengua. */
const ui = vi.hoisted(() => ({ t: null }));
vi.mock('../../../app/contexts/UIContext', async (original) => ({
  ...(await original()),
  useUIActionsOpcional: () => (ui.t ? { t: ui.t } : null)
}));

import { UniversalWorkspace } from './UniversalWorkspace.jsx';
import { _reiniciaCarpetesVisibles } from './carpetesVisibles.js';

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] }
  ],
  items: [
    { id: 'n1', title: 'Primera', categoryIds: ['f-mur'] },
    { id: 'n2', title: 'Tomaques', categoryIds: ['f-mercat'] }
  ]
});
const detall = ({ item }) => <p data-testid="detall">{item ? item.title : 'cap'}</p>;

/* Les dues formes de capçalera de les sis pàgines. */
const BLOC = Object.freeze({
  nom: 'Bloc (acordió: /notes, /lector, /perfil)',
  labels: { categories: 'CARPETES', items: 'NOTES' },
  icons: { categories: Folder, items: NotebookPen },
  glifs: { left: 'lucide-folder', middle: 'lucide-notebook-pen' },
  props: {}
});
const DISSENY = Object.freeze({
  nom: 'Disseny (títol fix: /disseny, /wikidepoble, /multimedia)',
  labels: { categories: 'DISSENY', items: 'COMPONENTS' },
  icons: { categories: LayoutGrid, items: Component },
  glifs: { left: 'lucide-layout-grid', middle: 'lucide-component' },
  props: { collapsibleNavigation: false }
});

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); _reiniciaCarpetesVisibles(); });
afterEach(() => cleanup());

function entorn(amplada, prova) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const observadorAbans = globalThis.ResizeObserver;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  const buida = () => act(() => { while (cua.length) cua.shift()(0); });
  try {
    prova({ buida });
  } finally {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.requestAnimationFrame = rafAbans;
    globalThis.ResizeObserver = observadorAbans;
  }
}

const munta = (forma, props = {}) => render(
  <UniversalWorkspace
    model={MODEL}
    labels={forma.labels}
    icons={forma.icons}
    tagFilter={false}
    renderDetail={detall}
    initialSelection={{ categoryId: 'f-mur', itemId: 'n1' }}
    {...forma.props}
    {...props}
  />
);

const COLUMNES = Object.freeze({ left: ['#app-grid-sidebar', 'categories', 'has-left-collapsed'], middle: ['#app-grid-list', 'items', 'has-middle-collapsed'] });
const glif = (boto) => [...(boto?.querySelector('svg')?.classList ?? [])].find((c) => c.startsWith('lucide-')) ?? null;
const railTop = (columna) => columna.querySelector('.app-grid-col-header--collapsed > .app-grid-col-header__rail-top');
const capcalera = (columna) => columna.querySelector('.app-grid-col-header');

for (const forma of [BLOC, DISSENY]) {
  for (const costat of ['left', 'middle']) {
    test(`${forma.nom} · ${costat} a 1180: la icona plega com el [|<], el rail porta la mateixa icona dalt i el focus va i torna al botó equivalent`, () => {
      entorn(1180, ({ buida }) => {
        const { container } = munta(forma);
        const [id, clau, plegada] = COLUMNES[costat];
        const titol = forma.labels[clau];
        const columna = container.querySelector(id);
        expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('ample');

        for (const des of ['icona', '[|<]']) {
          const icona = within(columna).getByRole('button', { name: `Plegar la columna ${titol}` });
          const replega = within(columna).getByRole('button', { name: `Replegar ${titol}` });
          /* La icona és la primera cosa de la fila 1, amb el glif de la secció. */
          expect(capcalera(columna).querySelector('.app-grid-col-header__plec').firstElementChild).toBe(icona);
          expect(glif(icona)).toBe(forma.glifs[costat]);
          const boto = des === 'icona' ? icona : replega;
          boto.focus();
          fireEvent.click(boto);
          buida();
          expect([des, container.querySelector(`.${plegada}`) !== null]).toEqual([des, true]);
          const expandir = railTop(columna);
          expect(expandir.getAttribute('aria-label')).toBe(`Expandir ${titol}`);
          /* La mateixa icona, dalt del rail. */
          expect(glif(expandir)).toBe(forma.glifs[costat]);
          expect(document.activeElement).toBe(expandir);

          fireEvent.click(expandir);
          buida();
          expect([des, container.querySelector(`.${plegada}`)]).toEqual([des, null]);
          /* Desplegada, el focus va a la icona: l'equivalent del de dalt del rail. */
          expect(document.activeElement).toBe(within(columna).getByRole('button', { name: `Plegar la columna ${titol}` }));
        }
      });
    });
  }
}

test('Bloc · l’acordió de CARPETES plega la llista de carpetes i no la columna; porta només la paraula i el chevron', () => {
  entorn(1180, ({ buida }) => {
    const { container } = munta(BLOC);
    const navegacio = container.querySelector('#app-grid-sidebar');
    const acordio = navegacio.querySelector('.app-grid-col-header__plegable');
    expect(acordio.getAttribute('aria-expanded')).toBe('true');
    expect(acordio.textContent).toBe('CARPETES');
    expect(acordio.querySelectorAll('svg')).toHaveLength(1);
    expect(glif(acordio.querySelector('.app-grid-col-header__chevron'))).toBe('lucide-chevron-down');
    fireEvent.click(acordio);
    buida();
    expect(acordio.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.has-left-collapsed')).toBeNull();
    expect(within(navegacio).getByRole('button', { name: 'Plegar la columna CARPETES' })).toBeTruthy();
  });
});

test('Disseny · sense acordió (collapsibleNavigation false) el títol és text fix: cap fila sencera és un botó i clicar-lo no plega res', () => {
  entorn(1180, ({ buida }) => {
    const { container } = munta(DISSENY);
    expect(container.querySelector('.app-grid-col-header--replegable')).toBeNull();
    for (const [id, nom] of [['#app-grid-sidebar', 'DISSENY'], ['#app-grid-list', 'COMPONENTS']]) {
      const columna = container.querySelector(id);
      const titol = within(columna).getByText(nom, { selector: '.app-grid-col-header__titol' });
      expect(titol.closest('button')).toBeNull();
      fireEvent.click(titol);
      buida();
      expect(columna.querySelector('.app-grid-col-header--collapsed')).toBeNull();
    }
  });
});

test('El nom de la icona es tradueix a la llengua de la interfície (nav.plegaColumna, amb el títol)', () => {
  ui.t = (clau, reserva) => (clau === 'nav.plegaColumna' ? 'Collapse the {nom} column' : reserva);
  try {
    entorn(1180, () => {
      const { container } = munta(DISSENY);
      expect(within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: 'Collapse the DISSENY column' })).toBeTruthy();
      expect(within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'Collapse the COMPONENTS column' })).toBeTruthy();
    });
  } finally {
    ui.t = null;
  }
});

/* Corrector del Gauntlet (30-10-2026) · Tota la capçalera en la llengua de
   la interfície: abans, en anglés, la icona deia «Collapse the NOTES
   column» i el [|<] del costat «Replegar NOTES», i el rail «Expandir
   CARPETES». */
test('Els dos botons de plegar, l’Expandir del rail i el títol de l’acordió es tradueixen (nav.*Columna)', () => {
  const EN = {
    'nav.plegaColumna': 'Collapse the {nom} column',
    'nav.replegaColumna': 'Collapse {nom}',
    'nav.expandeixColumna': 'Expand {nom}',
    'nav.acordioColumna': 'Collapse or expand {nom}'
  };
  ui.t = (clau, reserva) => EN[clau] ?? reserva;
  try {
    entorn(1180, ({ buida }) => {
      const { container } = munta(BLOC);
      const navegacio = container.querySelector('#app-grid-sidebar');
      expect(within(navegacio).getAllByRole('button', { name: /CARPETES/ }).map((b) => b.getAttribute('aria-label') ?? b.textContent))
        .toEqual(['Collapse the CARPETES column', 'CARPETES', 'Collapse CARPETES']);
      expect(navegacio.querySelector('.app-grid-col-header__plegable').getAttribute('title')).toBe('Collapse or expand CARPETES');
      expect(within(container).queryAllByRole('button', { name: /^(Replegar|Plegar|Expandir) / })).toEqual([]);
      fireEvent.click(within(navegacio).getByRole('button', { name: 'Collapse CARPETES' }));
      buida();
      expect(railTop(navegacio).getAttribute('aria-label')).toBe('Expand CARPETES');
      const llista = container.querySelector('#app-grid-list');
      fireEvent.click(within(llista).getByRole('button', { name: 'Collapse NOTES' }));
      buida();
      expect(railTop(llista).getAttribute('aria-label')).toBe('Expand NOTES');
    });
  } finally {
    ui.t = null;
  }
});

/* Corrector del Gauntlet f4 (30-10-2026, separadors-nom-sense-traduir) · Els
   dos separadors de les mateixes columnes i l'article de la closca, també en
   la llengua de la interfície: abans, en anglés, «Redimensionar DISSENY» i
   «Espai de treball de tres columnes» al costat de «Collapse DISSENY». Sense
   traductor, el valencià de sempre. */
test('Els separadors i la closca es tradueixen (nav.redimensionaColumna, nav.espaiDeTreball)', () => {
  const noms = (c) => [...c.querySelectorAll('[role="separator"]')].map((s) => s.getAttribute('aria-label'));
  const closca = (c) => c.querySelector('.app-grid-shell').getAttribute('aria-label');
  const EN = { 'nav.redimensionaColumna': 'Resize {nom}', 'nav.espaiDeTreball': 'Three-column workspace' };
  ui.t = (clau, reserva) => EN[clau] ?? reserva;
  try {
    entorn(1180, () => {
      const { container } = munta(DISSENY);
      expect(noms(container)).toEqual(['Resize DISSENY', 'Resize COMPONENTS']);
      expect(closca(container)).toBe('Three-column workspace');
    });
  } finally {
    ui.t = null;
  }
  cleanup();
  entorn(1180, () => {
    const { container } = munta(DISSENY);
    expect(noms(container)).toEqual(['Redimensionar DISSENY', 'Redimensionar COMPONENTS']);
    expect(closca(container)).toBe('Espai de treball de tres columnes');
  });
});

/* Corrector del Gauntlet (30-10-2026) · L'estat de la columna es declarava
   només amb replegaTotaCapcalera (Disseny, Wiki, Multimèdia): a /notes,
   /lector i /perfil, la icona, el [|<] i l'Expandir del rail no tenien
   aria-expanded ni aria-controls. Ara, a totes dues formes. */
for (const forma of [BLOC, DISSENY]) {
  test(`${forma.nom} · a 1180 la icona, el [|<] i l’Expandir del rail declaren la columna que pleguen`, () => {
    entorn(1180, ({ buida }) => {
      const { container } = munta(forma);
      for (const [costat, [id, clau]] of Object.entries(COLUMNES)) {
        const titol = forma.labels[clau];
        const columna = container.querySelector(id);
        for (const nom of [`Plegar la columna ${titol}`, `Replegar ${titol}`]) {
          const boto = within(columna).getByRole('button', { name: nom });
          expect([costat, nom, boto.getAttribute('aria-expanded'), boto.getAttribute('aria-controls')]).toEqual([costat, nom, 'true', id.slice(1)]);
        }
        fireEvent.click(within(columna).getByRole('button', { name: `Replegar ${titol}` }));
        buida();
        const expandir = railTop(columna);
        expect([costat, expandir.getAttribute('aria-expanded'), expandir.getAttribute('aria-controls'), expandir.hasAttribute('data-obri-columna')])
          .toEqual([costat, 'false', id.slice(1), false]);
        fireEvent.click(expandir);
        buida();
      }
    });
  });
}

test.each([[false], ['navegacio']])('Mòbil · a 375 (mestreDetall=%s) cap icona no és botó: la navegació no porta [|<] visible i la llista porta l’obridor davant', (mestreDetall) => {
  entorn(375, ({ buida }) => {
    const { container } = munta(BLOC, { mestreDetall });
    buida();
    expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('estret');
    expect(container.querySelector('.app-grid-col-header__icona')).toBeNull();
    expect(within(container).queryAllByRole('button', { name: /^Plegar la columna/ })).toEqual([]);
    /* La icona de la navegació hi és, de dibuix. */
    expect(container.querySelector('#app-grid-sidebar .app-grid-col-header__plec > svg.lucide-folder')).not.toBeNull();
  });
});
