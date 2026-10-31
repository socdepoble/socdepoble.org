/* IDEA-58 (ordre del Mestre, 29-10-2026 23:22 CET) · Les fletxes del teclat
   a les tres columnes de l'UniversalWorkspace, com al Finder:
     · Columna 2 (la llista): ↑ ↓ trien l'element i enfoquen la fitxa nova
       (onSelectionChange: la primera fletxa amb la raó del clic, 'user', i
       les següents del mateix recorregut amb 'teclat', Gauntlet 261030),
       Inici i Fi, ← a l'opció activa de la Columna 1 i → a l'entrada del
       detall;
     · Columna 1 (l'arbre): ↑ ↓ entre files (el chevron no és cap parada),
       → desplega o salta a la fitxa activa, ← plega o puja a la fila pare;
     · Escape dins del detall torna a la fitxa activa;
     · cap acció amb modificadors ni des d'un camp (la cerca, un camp del
       detall) ni des d'un diàleg.
   Les funcions de davall són a navegacioTeclat.test.js. Dades sintètiques
   (els pobles de l'ordre del Mestre). jsdom no fa layout: l'amplària de la
   closca (clientWidth) es posa a mà. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  /* «ample»: les tres columnes a la vista. */
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [{ id: 'folders', options: [
    { id: 1, label: 'Wiki' },
    { id: 2, parentId: 1, label: 'Saber' },
    { id: 3, parentId: 2, label: 'Protocols' },
    { id: 4, label: 'Pobles' }
  ] }],
  items: [
    { id: 'torre', title: 'La Torre de les Maçanes', categoryIds: [4] },
    { id: 'xixona', title: 'Xixona', categoryIds: [4] },
    { id: 'tibi', title: 'Tibi', categoryIds: [4] },
    { id: 'alcoleja', title: 'Alcoleja', categoryIds: [4] },
    { id: 'portada', title: 'Portada de la Wiki', categoryIds: [1] }
  ]
});

/* El detall: un títol (tabIndex=-1, fora del tabulador), un botó, un camp i un diàleg. */
const detallComu = ({ item }) => (item ? (
  <section>
    <header className="page-title"><h1 tabIndex={-1}>{item.title}</h1></header>
    <button type="button">Editar {item.title}</button>
    <input aria-label="Nom del poble" defaultValue={item.title} />
    <div role="dialog" aria-label="Diàleg"><button type="button">Dins del diàleg</button></div>
  </section>
) : null);

function munta({ seleccio = { categoryId: '4', itemId: 'torre' }, ...props } = {}) {
  const onSelectionChange = vi.fn();
  const utils = render(
    <UniversalWorkspace
      model={MODEL}
      initialSelection={seleccio}
      onSelectionChange={onSelectionChange}
      renderDetail={detallComu}
      {...props}
    />
  );
  return { ...utils, onSelectionChange };
}

const columna = (id) => document.querySelector(`#${id}`);
const fitxa = (titol) => within(columna('app-grid-list')).getByRole('button', { name: titol });
const fila = (nom) => within(columna('app-grid-sidebar')).getByRole('button', { name: nom });
const detall = () => within(columna('app-grid-main'));
/* Prem una tecla on hi ha el focus. Torna si el manejador ha cridat preventDefault. */
const prem = (key, extres = {}) => !fireEvent.keyDown(document.activeElement, { key, ...extres });
const enfoca = (element) => act(() => element.focus());

describe('Columna 2 · la llista', () => {
  test('↓ tria l’element següent amb la raó del clic i enfoca la seua fitxa; el detall canvia', () => {
    const { onSelectionChange } = munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    expect(prem('ArrowDown')).toBe(true);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'xixona' }, { reason: 'user' });
    expect(document.activeElement).toBe(fitxa('Xixona'));
    expect(fitxa('Xixona').getAttribute('aria-current')).toBe('true');
    expect(fitxa('La Torre de les Maçanes').hasAttribute('aria-current')).toBe(false);
    expect(detall().getByRole('heading', { level: 1 }).textContent).toBe('Xixona');
  });

  test('↓ ×3 recorre La Torre → Xixona → Tibi → Alcoleja, i ↑ torna enrere', () => {
    const { onSelectionChange } = munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    prem('ArrowDown');
    prem('ArrowDown');
    prem('ArrowDown');
    expect(onSelectionChange.mock.calls.map(([seleccio]) => seleccio.itemId)).toEqual(['xixona', 'tibi', 'alcoleja']);
    expect(document.activeElement).toBe(fitxa('Alcoleja'));
    expect(detall().getByRole('heading', { level: 1 }).textContent).toBe('Alcoleja');
    prem('ArrowUp');
    expect(document.activeElement).toBe(fitxa('Tibi'));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'tibi' }, { reason: 'teclat' });
  });

  test('↑ al primer i ↓ a l’últim no trien res ni mouen el focus, però la pàgina no es desplaça (preventDefault)', () => {
    const { onSelectionChange } = munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    expect(prem('ArrowUp')).toBe(true);
    expect(prem('Home')).toBe(true);
    expect(document.activeElement).toBe(fitxa('La Torre de les Maçanes'));
    enfoca(fitxa('Alcoleja'));
    expect(prem('ArrowDown')).toBe(true);
    expect(prem('End')).toBe(true);
    expect(document.activeElement).toBe(fitxa('Alcoleja'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('Fi tria l’últim i Inici el primer', () => {
    const { onSelectionChange } = munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    prem('End');
    expect(document.activeElement).toBe(fitxa('Alcoleja'));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'alcoleja' }, { reason: 'user' });
    prem('Home');
    expect(document.activeElement).toBe(fitxa('La Torre de les Maçanes'));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'torre' }, { reason: 'teclat' });
  });

  /* Gauntlet 261030 (cicle 2) · Un recorregut de fletxes és una sola entrada
     de l'historial, com al Finder: la primera fletxa porta la raó del clic
     ('user', les seccions fan push) i les següents, 'teclat' (replace). */
  test('un recorregut de fletxes: la primera amb la raó del clic i les següents amb «teclat»', () => {
    const { onSelectionChange } = munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    prem('ArrowDown');
    prem('ArrowDown');
    prem('ArrowDown');
    prem('Home');
    expect(onSelectionChange.mock.calls).toEqual([
      [{ categoryId: '4', itemId: 'xixona' }, { reason: 'user' }],
      [{ categoryId: '4', itemId: 'tibi' }, { reason: 'teclat' }],
      [{ categoryId: '4', itemId: 'alcoleja' }, { reason: 'teclat' }],
      [{ categoryId: '4', itemId: 'torre' }, { reason: 'teclat' }]
    ]);
  });

  test('un clic o l’Enter tanquen el recorregut, també sobre la fitxa activa: la fletxa següent torna a ser «user»', () => {
    const { onSelectionChange } = munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    prem('ArrowDown');
    prem('ArrowDown');
    /* L'Enter d'un botó és el seu clic: sobre la fitxa activa (Tibi). */
    fireEvent.click(fitxa('Tibi'));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'tibi' }, { reason: 'user' });
    prem('ArrowDown');
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'alcoleja' }, { reason: 'user' });
    prem('ArrowUp');
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'tibi' }, { reason: 'teclat' });
    /* Un clic en una altra fitxa. */
    fireEvent.click(fitxa('Xixona'));
    enfoca(fitxa('Xixona'));
    prem('ArrowDown');
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'tibi' }, { reason: 'user' });
  });

  test('una tria de fora (l’Arrere del navegador) tanca el recorregut i porta el focus a la fitxa activa', () => {
    const triat = vi.fn();
    let tornaA = null;
    function Controlat() {
      const [seleccio, setSeleccio] = React.useState({ categoryId: '4', itemId: 'torre' });
      tornaA = setSeleccio;
      return (
        <UniversalWorkspace
          model={MODEL}
          initialSelection={{ categoryId: '4', itemId: 'torre' }}
          selection={seleccio}
          onSelectionChange={(seleccioNova, meta) => { triat(seleccioNova, meta); setSeleccio(seleccioNova); }}
          renderDetail={detallComu}
        />
      );
    }
    render(<Controlat />);
    enfoca(fitxa('La Torre de les Maçanes'));
    prem('ArrowDown');
    prem('ArrowDown');
    prem('ArrowDown');
    expect(document.activeElement).toBe(fitxa('Alcoleja'));
    /* L'Arrere: la URL (la selecció controlada) torna on era la persona. */
    act(() => tornaA({ categoryId: '4', itemId: 'torre' }));
    expect(fitxa('La Torre de les Maçanes').getAttribute('aria-current')).toBe('true');
    expect(document.activeElement).toBe(fitxa('La Torre de les Maçanes'));
    triat.mockClear();
    prem('ArrowDown');
    expect(triat.mock.calls).toEqual([[{ categoryId: '4', itemId: 'xixona' }, { reason: 'user' }]]);
  });

  test('una tria de fora amb el focus fora de la llista no el mou', () => {
    let tornaA = null;
    function Controlat() {
      const [seleccio, setSeleccio] = React.useState({ categoryId: '4', itemId: 'torre' });
      tornaA = setSeleccio;
      return (
        <UniversalWorkspace
          model={MODEL}
          initialSelection={{ categoryId: '4', itemId: 'torre' }}
          selection={seleccio}
          onSelectionChange={setSeleccio}
          renderDetail={detallComu}
        />
      );
    }
    render(<Controlat />);
    const camp = detall().getByRole('textbox', { name: 'Nom del poble' });
    enfoca(camp);
    act(() => tornaA({ categoryId: '4', itemId: 'tibi' }));
    expect(fitxa('Tibi').getAttribute('aria-current')).toBe('true');
    expect(document.activeElement).not.toBe(fitxa('Tibi'));
  });

  test('← enfoca l’opció activa de la Columna 1; amb «Tot», la primera fila', () => {
    munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    expect(prem('ArrowLeft')).toBe(true);
    expect(document.activeElement).toBe(fila('Pobles'));
    expect(fila('Pobles').getAttribute('aria-current')).toBe('page');
    cleanup();
    munta({ seleccio: { categoryId: '__all__', itemId: 'torre' } });
    enfoca(fitxa('La Torre de les Maçanes'));
    prem('ArrowLeft');
    expect(document.activeElement).toBe(fila('Wiki'));
  });

  test('→ enfoca el primer control del detall (el títol de tabIndex −1 no compta), sense triar res', () => {
    const { onSelectionChange } = munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    expect(prem('ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(detall().getByRole('button', { name: 'Editar La Torre de les Maçanes' }));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('→ amb una graella de teclat al detall: la seua cel·la activa; sense cap control, l’arrel del detall', () => {
    munta({
      renderDetail: () => (
        <div>
          <button type="button">Barra</button>
          <ul data-graella-teclat="">
            <li><button type="button">Foto 1</button></li>
            <li><button type="button" aria-pressed="true">Foto 2</button></li>
          </ul>
        </div>
      )
    });
    enfoca(fitxa('La Torre de les Maçanes'));
    prem('ArrowRight');
    expect(document.activeElement).toBe(detall().getByRole('button', { name: 'Foto 2' }));
    cleanup();
    munta({ renderDetail: ({ item }) => <p>{item?.title}</p> });
    enfoca(fitxa('La Torre de les Maçanes'));
    prem('ArrowRight');
    expect(document.activeElement).toBe(columna('app-grid-main').querySelector('.sdp-workspace-detail'));
  });

  test('des d’un botó secundari de dins de la fila, les fletxes no fan res', () => {
    const { onSelectionChange } = munta({
      renderItem: ({ item, active, onSelect }) => (
        <div>
          <button type="button" className="sdp-gestor-fitxa" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
          <button type="button">Fixar {item.title}</button>
        </div>
      )
    });
    enfoca(within(columna('app-grid-list')).getByRole('button', { name: 'Fixar La Torre de les Maçanes' }));
    expect(prem('ArrowDown')).toBe(false);
    expect(prem('ArrowRight')).toBe(false);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('una fitxa activa pintada amb un altre element (com la TargetaViva): el focus arriba al seu control principal', () => {
    munta({
      renderItem: ({ item, active, onSelect }) => (active ? (
        <article>
          <header><button type="button">Data de {item.title}</button></header>
          <button type="button" className="sp-card-link-overlay" aria-label={item.title} aria-current="true" onClick={onSelect} />
        </article>
      ) : (
        <button type="button" className="sdp-gestor-fitxa" onClick={onSelect}>{item.title}</button>
      ))
    });
    enfoca(fitxa('La Torre de les Maçanes'));
    expect(document.activeElement.className).toBe('sp-card-link-overlay');
    prem('ArrowDown');
    const nova = fitxa('Xixona');
    expect(nova.className).toBe('sp-card-link-overlay');
    expect(document.activeElement).toBe(nova);
    prem('ArrowDown');
    expect(document.activeElement).toBe(fitxa('Tibi'));
  });

  test('cap acció amb modificadors ni des del camp de cerca', () => {
    const { onSelectionChange } = munta();
    enfoca(fitxa('La Torre de les Maçanes'));
    for (const modificador of ['shiftKey', 'altKey', 'ctrlKey', 'metaKey']) {
      expect(prem('ArrowDown', { [modificador]: true }), modificador).toBe(false);
    }
    expect(document.activeElement).toBe(fitxa('La Torre de les Maçanes'));
    fireEvent.click(within(columna('app-grid-list')).getByRole('button', { name: 'Cercar elements' }));
    const cerca = within(columna('app-grid-list')).getByRole('searchbox');
    enfoca(cerca);
    expect(prem('ArrowDown')).toBe(false);
    expect(prem('End')).toBe(false);
    expect(document.activeElement).toBe(cerca);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});

describe('Columna 1 · l’arbre', () => {
  test('↓ ↑ Inici Fi mouen el focus entre files, saltant el chevron, sense triar res', () => {
    const { onSelectionChange } = munta();
    enfoca(fila('Wiki'));
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(fila('Pobles'));
    prem('ArrowUp');
    expect(document.activeElement).toBe(fila('Wiki'));
    /* Des del chevron, compta la seua fila. */
    enfoca(fila('Desplegar Wiki'));
    prem('ArrowDown');
    expect(document.activeElement).toBe(fila('Pobles'));
    prem('Home');
    expect(document.activeElement).toBe(fila('Wiki'));
    prem('End');
    expect(document.activeElement).toBe(fila('Pobles'));
    /* A l'última, ↓ no es mou però tampoc desplaça la pàgina. */
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(fila('Pobles'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('→ desplega una carpeta plegada (el focus es queda) i, desplegada, salta a la fitxa activa de la llista', () => {
    const { onSelectionChange } = munta();
    enfoca(fila('Wiki'));
    expect(fila('Wiki').getAttribute('aria-expanded')).toBe('false');
    expect(prem('ArrowRight')).toBe(true);
    expect(fila('Wiki').getAttribute('aria-expanded')).toBe('true');
    expect(fila('Saber')).toBeTruthy();
    expect(document.activeElement).toBe(fila('Wiki'));
    prem('ArrowRight');
    expect(document.activeElement).toBe(fitxa('La Torre de les Maçanes'));
    /* Una fulla salta directament a la llista. */
    enfoca(fila('Pobles'));
    prem('ArrowRight');
    expect(document.activeElement).toBe(fitxa('La Torre de les Maçanes'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('← plega una carpeta desplegada i, plegada o fulla, puja a la fila pare', () => {
    munta();
    enfoca(fila('Wiki'));
    prem('ArrowRight');
    prem('ArrowDown');
    expect(document.activeElement).toBe(fila('Saber'));
    prem('ArrowRight');
    prem('ArrowDown');
    expect(document.activeElement).toBe(fila('Protocols'));
    prem('ArrowLeft');
    expect(document.activeElement).toBe(fila('Saber'));
    prem('ArrowLeft');
    expect(fila('Saber').getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Protocols' })).toBeNull();
    expect(document.activeElement).toBe(fila('Saber'));
    prem('ArrowLeft');
    expect(document.activeElement).toBe(fila('Wiki'));
    prem('ArrowLeft');
    expect(fila('Wiki').getAttribute('aria-expanded')).toBe('false');
    /* Una arrel del grup sense capçalera no té pare: no fa res ni crida preventDefault. */
    expect(prem('ArrowLeft')).toBe(false);
    expect(document.activeElement).toBe(fila('Wiki'));
  });

  test('→ i ← des del chevron despleguen i pleguen la seua carpeta', () => {
    munta();
    enfoca(fila('Desplegar Wiki'));
    prem('ArrowRight');
    expect(fila('Wiki').getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(fila('Plegar Wiki'));
    prem('ArrowLeft');
    expect(fila('Wiki').getAttribute('aria-expanded')).toBe('false');
  });

  test('les capçaleres de grup: ← plega el grup, → el desplega, i ← des d’una arrel puja a la capçalera', () => {
    munta({
      model: {
        ...MODEL,
        navigationGroups: [
          { id: 'folders', label: 'CARPETES', options: MODEL.navigationGroups[0].options },
          { id: 'tags', label: 'ETIQUETES', options: [{ id: 't1', label: 'Urgent' }] }
        ]
      }
    });
    enfoca(fila('Pobles'));
    prem('ArrowLeft');
    expect(document.activeElement).toBe(fila('CARPETES'));
    prem('ArrowLeft');
    expect(fila('CARPETES').getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Pobles' })).toBeNull();
    prem('ArrowDown');
    expect(document.activeElement).toBe(fila('ETIQUETES'));
    prem('ArrowUp');
    prem('ArrowRight');
    expect(fila('CARPETES').getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(fila('CARPETES'));
  });

  test('cap acció amb modificadors', () => {
    munta();
    enfoca(fila('Wiki'));
    expect(prem('ArrowDown', { altKey: true })).toBe(false);
    expect(prem('ArrowRight', { metaKey: true })).toBe(false);
    expect(document.activeElement).toBe(fila('Wiki'));
    expect(fila('Wiki').getAttribute('aria-expanded')).toBe('false');
  });
});

describe('Escape dins del detall', () => {
  test('torna el focus a la fitxa activa de la llista', () => {
    munta();
    enfoca(detall().getByRole('button', { name: 'Editar La Torre de les Maçanes' }));
    expect(prem('Escape')).toBe(true);
    expect(document.activeElement).toBe(fitxa('La Torre de les Maçanes'));
  });

  test('una secció amb el seu propi Escape a l’arrel del document (el Lector) mana: el detall no hi fa res', () => {
    munta();
    const propi = vi.fn((event) => { if (event.key === 'Escape') event.preventDefault(); });
    document.addEventListener('keydown', propi);
    try {
      const boto = detall().getByRole('button', { name: 'Editar La Torre de les Maçanes' });
      enfoca(boto);
      prem('Escape');
      expect(propi).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(boto);
    } finally {
      document.removeEventListener('keydown', propi);
    }
  });

  test('des d’un camp, d’un diàleg o amb modificadors no fa res', () => {
    munta();
    enfoca(detall().getByRole('textbox', { name: 'Nom del poble' }));
    expect(prem('Escape')).toBe(false);
    enfoca(detall().getByRole('button', { name: 'Dins del diàleg' }));
    expect(prem('Escape')).toBe(false);
    enfoca(detall().getByRole('button', { name: 'Editar La Torre de les Maçanes' }));
    expect(prem('Escape', { shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(detall().getByRole('button', { name: 'Editar La Torre de les Maçanes' }));
  });
});

describe('«estret» amb el mestre-detall', () => {
  test('↓ tria sense tancar el panell de la llista ni dur el focus al detall', () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const rafAbans = globalThis.requestAnimationFrame;
    const cua = [];
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 375 });
    globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
    try {
      const { container, onSelectionChange } = munta({ seleccio: undefined, mestreDetall: 'navegacio' });
      const closca = container.querySelector('.app-grid-shell');
      fireEvent.click(fila('Pobles'));
      act(() => { while (cua.length) cua.shift()(0); });
      expect(closca.dataset.panell).toBe('middle');
      enfoca(fitxa('La Torre de les Maçanes'));
      onSelectionChange.mockClear();
      prem('ArrowDown');
      act(() => { while (cua.length) cua.shift()(0); });
      expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'xixona' }, { reason: 'user' });
      expect(closca.dataset.panell).toBe('middle');
      expect(columna('app-grid-list').getAttribute('aria-hidden')).not.toBe('true');
      expect(document.activeElement).toBe(fitxa('Xixona'));
    } finally {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
      globalThis.requestAnimationFrame = rafAbans;
    }
  });
});

/* Corrector del Gauntlet f4 (30-10-2026, idea58-rails-sense-fletxes) · ← des
   de la llista i → des de l'arbre porten el focus al rail de la columna
   plegada, i dins del rail les fletxes s'hi mouen i en tornen
   (gestionaTeclaRail). L'ordre del Mestre del Bloc de Notes (30-10-2026)
   plega la navegació en arrencar entre 721 i 1023 px de finestra: a 800, el
   primer ← des de la llista ja cau al rail. Tab no canvia (cap tabIndex
   itinerant). */
describe('els rails de les columnes plegades', () => {
  function a800(prova) {
    const amplada = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const finestra = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 800 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 800 });
    try {
      prova();
    } finally {
      if (amplada) Object.defineProperty(HTMLElement.prototype, 'clientWidth', amplada);
      if (finestra) Object.defineProperty(window, 'innerWidth', finestra);
      else delete window.innerWidth;
    }
  }
  const railDeLaNavegacio = (nom) => within(columna('app-grid-sidebar').querySelector('.sdp-workspace-rail')).getByRole('button', { name: nom });
  const railDeDocuments = (nom) => within(columna('app-grid-list').querySelector('.sdp-workspace-rail--documents')).getByRole('button', { name: nom });

  test('a 800, amb la navegació plegada d’arrencada: ← porta al rail, ↑ ↓ Inici Fi s’hi mouen sense triar res i → torna a la fitxa activa', () => {
    a800(() => {
      const { onSelectionChange } = munta();
      expect(columna('app-grid-sidebar').querySelector('.sdp-workspace-groups')).toBeNull();
      enfoca(fitxa('La Torre de les Maçanes'));
      expect(prem('ArrowLeft')).toBe(true);
      expect(document.activeElement).toBe(railDeLaNavegacio('Pobles'));
      expect(prem('ArrowUp')).toBe(true);
      expect(document.activeElement).toBe(railDeLaNavegacio('Wiki'));
      expect(prem('End')).toBe(true);
      expect(document.activeElement).toBe(railDeLaNavegacio('Pobles'));
      expect(prem('ArrowDown')).toBe(true);
      expect(document.activeElement).toBe(railDeLaNavegacio('Pobles'));
      expect(prem('Home')).toBe(true);
      expect(document.activeElement).toBe(railDeLaNavegacio('Wiki'));
      expect(prem('ArrowLeft')).toBe(false);
      expect(prem('ArrowRight')).toBe(true);
      expect(document.activeElement).toBe(fitxa('La Torre de les Maçanes'));
      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  test('amb la llista plegada: → des de l’arbre porta al rail de documents, ↓ s’hi mou, ← torna a l’arbre i → va al detall', () => {
    const { onSelectionChange } = munta({ columnesInicials: { middle: true } });
    enfoca(fila('Pobles'));
    expect(prem('ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(railDeDocuments('La Torre de les Maçanes'));
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(railDeDocuments('Xixona'));
    expect(prem('ArrowLeft')).toBe(true);
    expect(document.activeElement).toBe(fila('Pobles'));
    enfoca(railDeDocuments('Tibi'));
    expect(prem('ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(detall().getByRole('button', { name: 'Editar La Torre de les Maçanes' }));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('a 800, amb les dues plegades: d’un rail a l’altre amb ← i →, i l’Escape del detall torna al rail de documents', () => {
    a800(() => {
      munta({ columnesInicials: { left: true, middle: true } });
      enfoca(railDeDocuments('La Torre de les Maçanes'));
      expect(prem('ArrowLeft')).toBe(true);
      expect(document.activeElement).toBe(railDeLaNavegacio('Pobles'));
      expect(prem('ArrowRight')).toBe(true);
      expect(document.activeElement).toBe(railDeDocuments('La Torre de les Maçanes'));
      enfoca(detall().getByRole('button', { name: 'Editar La Torre de les Maçanes' }));
      expect(prem('Escape')).toBe(true);
      expect(document.activeElement).toBe(railDeDocuments('La Torre de les Maçanes'));
    });
  });

  test('cap acció amb modificadors des del rail', () => {
    a800(() => {
      munta();
      enfoca(railDeLaNavegacio('Pobles'));
      expect(prem('ArrowUp', { shiftKey: true })).toBe(false);
      expect(prem('ArrowRight', { metaKey: true })).toBe(false);
      expect(document.activeElement).toBe(railDeLaNavegacio('Pobles'));
    });
  });
});
