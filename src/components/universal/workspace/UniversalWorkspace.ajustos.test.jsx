/* Llei de la Roda Dentada (ordre del Mestre, 261007) · «Les carpetes de
   sistema (Mur, Mercat, Pobles…) usen icones de Lucide i no es poden esborrar
   mai, però l'usuari ha de poder triar si les vol tindre a la vista.» La roda
   dentada de la navegació de tots els UniversalWorkspace obri «Amplada de les
   columnes» (amb «Restablir l'amplada de les columnes») i «Carpetes a la
   vista»: un interruptor per cada carpeta o categoria de primer nivell.
   Amagar-la la lleva de l'arbre i del rail, mai l'esborra: els documents
   continuen a «Tot» i a la cerca. La preferència és de l'espai
   (carpetesVisibles.js). jsdom no fa layout: l'amplària, a mà. Dades
   sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { FileText, Folder, Newspaper, Store } from 'lucide-react';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../../config/i18n.js';
import fontI18n from '../../../config/i18n.js?raw';
import fontWorkspace from './UniversalWorkspace.jsx?raw';
import { CLAU_CARPETES_VISIBLES, _reiniciaCarpetesVisibles } from './carpetesVisibles.js';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

/* Cada prova munta l'espai sencer i obri el diàleg: amb la màquina carregada
   (arbre compartit, altres suites alhora) passaven dels 5 s per defecte. */
vi.setConfig({ testTimeout: 30000 });

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  delVal(CLAU_CARPETES_VISIBLES);
  delVal('sdp-grid-widths');
  _reiniciaCarpetesVisibles();
});
afterEach(() => {
  cleanup();
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
});

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    { id: 'folders', label: null, options: [
      { id: 'f-mur', label: 'Mur', icon: Newspaper },
      { id: 'f-mercat', label: 'Mercat', icon: Store },
      { id: 'f-sub', label: 'Submur', parentId: 'f-mur' }
    ] },
    { id: 'categories', label: 'CATEGORIES', options: [{ id: 'cat_Sistema', label: 'Sistema' }] },
    { id: 'tags', label: 'ETIQUETES', options: [{ id: 'tag_Tutorial', label: 'Tutorial' }] }
  ],
  items: [
    { id: 'n1', title: 'Crònica del Mur', categoryIds: ['f-mur'] },
    { id: 'n2', title: 'Nota de la subcarpeta', categoryIds: ['f-sub'] },
    { id: 'n3', title: 'Tomaques', categoryIds: ['f-mercat'] }
  ]
});

const espaiDeTreball = (props = {}) => (
  <UniversalWorkspace
    model={MODEL}
    labels={{ categories: 'CARPETES', items: 'NOTES' }}
    icons={{ categories: Folder, items: FileText }}
    tagFilter={false}
    initialSelection={{ categoryId: 'f-mercat' }}
    mestreDetall={{ clau: 'notes', element: null }}
    renderDetail={() => null}
    {...props}
  />
);
const munta = (props = {}) => render(espaiDeTreball(props));

const RODA = 'Configuració de l’espai de treball';
const roda = () => screen.getByRole('button', { name: RODA });
const obriRoda = () => {
  const boto = roda();
  boto.focus();
  fireEvent.click(boto);
  return within(screen.getByRole('dialog', { name: RODA }));
};
const navegacio = () => screen.getByRole('navigation', { name: 'CARPETES' });
const enNavegacio = (nom) => within(navegacio()).queryByRole('button', { name: nom });
const interruptor = (dialeg, carpeta) => dialeg.getByRole('switch', { name: `Vull vore ${carpeta}` });
const amagades = (espai) => getVal(CLAU_CARPETES_VISIBLES, null)?.espais?.[espai] ?? null;

describe('Amplada de les columnes', () => {
  test('la secció diu el seu nom, porta els valors predefinits i «Restablir l’amplada de les columnes» torna al per defecte', () => {
    const { container } = munta();
    const dialeg = obriRoda();
    expect(dialeg.getByRole('heading', { level: 3, name: 'Amplada de les columnes' })).toBeTruthy();
    const grup = dialeg.getByRole('group', { name: 'Amplada de les columnes' });
    expect(within(grup).getAllByRole('button').map((b) => b.textContent)).toEqual(['Compacta', 'Per defecte', 'Ampla']);
    const pagina = container.querySelector('.app-grid-page');
    fireEvent.click(within(grup).getByRole('button', { name: 'Ampla' }));
    expect(pagina.style.getPropertyValue('--app-grid-col-sidebar')).toBe('300px');
    fireEvent.click(dialeg.getByRole('button', { name: 'Restablir l’amplada de les columnes' }));
    expect([pagina.style.getPropertyValue('--app-grid-col-sidebar'), pagina.style.getPropertyValue('--app-grid-col-list')]).toEqual(['260px', '280px']);
    expect(getVal('sdp-grid-widths', null)).toEqual({ left: 260, middle: 280 });
    expect(dialeg.getByText('Ara: navegació 260px · llistat 280px')).toBeTruthy();
  });
});

describe('Carpetes a la vista', () => {
  test('un interruptor per carpeta o categoria de primer nivell, amb la icona i l’estat en text; «Tot» no hi és', () => {
    munta();
    const dialeg = obriRoda();
    expect(dialeg.getByRole('heading', { level: 3, name: 'Carpetes a la vista' })).toBeTruthy();
    const interruptors = dialeg.getAllByRole('switch');
    expect(interruptors.map((i) => i.getAttribute('aria-checked'))).toEqual(['true', 'true', 'true', 'true']);
    expect(interruptors.map((i) => i.textContent)).toEqual(['Sí', 'Sí', 'Sí', 'Sí']);
    for (const nom of ['Mur', 'Mercat', 'Sistema', 'Tutorial']) expect(interruptor(dialeg, nom)).toBeTruthy();
    /* Només el primer nivell: Submur viu dins de Mur. «Tot» no s'amaga mai. */
    expect(dialeg.queryByRole('switch', { name: /Submur/ })).toBeNull();
    expect(dialeg.queryByRole('switch', { name: /Tot/ })).toBeNull();
    /* La icona de la carpeta (Lucide) i el nom a la vista; el nom accessible, «Vull vore …». */
    const fila = interruptor(dialeg, 'Mur').closest('.sdp-interruptor');
    expect(fila.classList.contains('sdp-workspace-settings__carpeta')).toBe(true);
    expect(fila.querySelector('.sdp-workspace-settings__glif svg.lucide-newspaper')).toBeTruthy();
    expect(fila.querySelector('.sdp-interruptor__etiqueta').textContent).toBe('Vull vore MurMur');
    /* Amb més d'un grup, cada llista porta el nom del seu grup. */
    expect(dialeg.getAllByRole('list').map((llista) => llista.getAttribute('aria-label'))).toEqual(['CARPETES', 'CATEGORIES', 'ETIQUETES']);
    expect(dialeg.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['CARPETES', 'CATEGORIES', 'ETIQUETES']);
    expect(dialeg.getByText('Amagar una carpeta la lleva de la navegació, però no l’esborra: els seus documents continuen a «Tot» i a la cerca.')).toBeTruthy();
  });

  test('amagar Mur la lleva de l’arbre (amb les seues filles) i no l’esborra: els documents continuen a «Tot» i a la cerca', () => {
    const onSelectionChange = vi.fn();
    munta({ onSelectionChange });
    expect(enNavegacio('Mur')).toBeTruthy();
    const dialeg = obriRoda();
    onSelectionChange.mockClear();
    fireEvent.click(interruptor(dialeg, 'Mur'));
    expect(interruptor(dialeg, 'Mur').getAttribute('aria-checked')).toBe('false');
    expect(interruptor(dialeg, 'Mur').textContent).toBe('No');
    /* La carpeta activa era Mercat: la selecció no es toca. */
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(enNavegacio('Mur')).toBeNull();
    expect(enNavegacio('Desplegar Mur')).toBeNull();
    expect(enNavegacio('Mercat').getAttribute('aria-current')).toBe('page');
    expect(amagades('notes')).toEqual({ 'f-mur': false });

    fireEvent.click(dialeg.getByRole('button', { name: 'Fet' }));
    /* «Tot» continua i hi són tots els documents, també els de Mur i Submur. */
    fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
    const llista = document.querySelector('#app-grid-list');
    for (const titol of [/Crònica del Mur/, /Nota de la subcarpeta/, /Tomaques/]) {
      expect(within(llista).getByRole('button', { name: titol })).toBeTruthy();
    }
    fireEvent.click(within(llista).getByRole('button', { name: 'Cercar elements' }));
    fireEvent.change(within(llista).getByRole('searchbox'), { target: { value: 'Crònica' } });
    expect(within(llista).getByRole('button', { name: /Crònica del Mur/ })).toBeTruthy();
    expect(within(llista).queryByRole('button', { name: /Tomaques/ })).toBeNull();

    /* Tornar-la a la vista: torna a l'arbre i la preferència s'esborra. */
    const dialeg2 = obriRoda();
    fireEvent.click(interruptor(dialeg2, 'Mur'));
    expect(enNavegacio('Mur')).toBeTruthy();
    expect(amagades('notes')).toBeNull();
  });

  test('amagada, tampoc no és al rail de la navegació plegada', () => {
    munta();
    fireEvent.click(screen.getByRole('button', { name: 'Replegar CARPETES' }));
    const rail = () => screen.getByRole('navigation', { name: 'CARPETES' });
    expect(within(rail()).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Mur', 'Mercat', 'Sistema', 'Tutorial']);
    /* La roda és també al rail, al costat de l'Expandir. */
    const dialeg = obriRoda();
    fireEvent.click(interruptor(dialeg, 'Mur'));
    fireEvent.click(interruptor(dialeg, 'Sistema'));
    expect(within(rail()).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Mercat', 'Tutorial']);
  });

  /* Tornar a «Tot» és el mateix que el botó «Tot» (selectCategory): obri el
     document que «Tot» recorda o el primer. */
  test('si s’amaga la carpeta activa, es torna a «Tot»', () => {
    const onSelectionChange = vi.fn();
    munta({ onSelectionChange, initialSelection: { categoryId: 'f-mur', itemId: 'n1' } });
    const dialeg = obriRoda();
    onSelectionChange.mockClear();
    fireEvent.click(interruptor(dialeg, 'Mur'));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(expect.objectContaining({ categoryId: '__all__' }), { reason: 'user' });
    expect(screen.getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(document.querySelector('#app-grid-list')).getByRole('button', { name: /Tomaques/ })).toBeTruthy();
  });

  test('també si l’activa és una subcarpeta de la que s’amaga', () => {
    const onSelectionChange = vi.fn();
    munta({ onSelectionChange, initialSelection: { categoryId: 'f-sub', itemId: 'n2' } });
    expect(enNavegacio('Submur').getAttribute('aria-current')).toBe('page');
    const dialeg = obriRoda();
    onSelectionChange.mockClear();
    fireEvent.click(interruptor(dialeg, 'Mur'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: '__all__' }), { reason: 'user' });
    expect(enNavegacio('Submur')).toBeNull();
    expect(screen.getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed')).toBe('true');
  });

  test('un grup amb totes les arrels amagades no deixa cap capçalera buida; amb una a la vista, es queda', () => {
    munta();
    expect(enNavegacio('ETIQUETES')).toBeTruthy();
    const dialeg = obriRoda();
    fireEvent.click(interruptor(dialeg, 'Tutorial'));
    expect(enNavegacio('ETIQUETES')).toBeNull();
    expect(enNavegacio('CATEGORIES')).toBeTruthy();
    /* Amb «Tot», totes es poden amagar: «Tot» sempre hi és. */
    for (const nom of ['Mur', 'Mercat', 'Sistema']) fireEvent.click(interruptor(dialeg, nom));
    expect(dialeg.getAllByRole('switch').every((i) => !i.disabled)).toBe(true);
    expect(within(navegacio()).queryAllByRole('button', { name: /Mur|Mercat|Sistema|Tutorial/ })).toEqual([]);
    expect(screen.getByRole('button', { name: 'Tot' })).toBeTruthy();
  });

  test('accessibilitat: en tancar el diàleg el focus torna a la roda', () => {
    munta();
    const dialeg = obriRoda();
    fireEvent.click(interruptor(dialeg, 'Mercat'));
    fireEvent.click(dialeg.getByRole('button', { name: 'Fet' }));
    expect(document.querySelector('dialog').open).toBe(false);
    expect(document.activeElement).toBe(roda());
  });
});

describe('la preferència és de cada espai de treball', () => {
  test('es llig en muntar: la carpeta amagada no es pinta', () => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { 'f-mercat': false } } });
    _reiniciaCarpetesVisibles();
    munta({ initialSelection: { categoryId: 'f-mur' } });
    expect(enNavegacio('Mercat')).toBeNull();
    expect(enNavegacio('Mur')).toBeTruthy();
    expect(interruptor(obriRoda(), 'Mercat').getAttribute('aria-checked')).toBe('false');
  });

  test('idEspai mana; sense, la clau del mestre-detall; sense cap de les dues, l’espai comú', () => {
    const { unmount } = munta({ idEspai: 'gestoria' });
    fireEvent.click(interruptor(obriRoda(), 'Mur'));
    expect(amagades('gestoria')).toEqual({ 'f-mur': false });
    expect(amagades('notes')).toBeNull();
    unmount();

    /* Un altre espai (la clau del mestre-detall, 'notes') no l'hereta. */
    munta();
    expect(enNavegacio('Mur')).toBeTruthy();
    cleanup();

    munta({ mestreDetall: false });
    fireEvent.click(interruptor(obriRoda(), 'Mercat'));
    expect(amagades('comu')).toEqual({ 'f-mercat': false });
    cleanup();

    /* Un idEspai que no és vàlid cau en la reserva. */
    munta({ idEspai: 'Wiki de Poble' });
    expect(enNavegacio('Mur')).toBeTruthy();
    fireEvent.click(interruptor(obriRoda(), 'Mur'));
    expect(amagades('notes')).toEqual({ 'f-mur': false });
  });

  test('dos espais muntats alhora amb la mateixa clau es veuen el canvi l’un a l’altre', () => {
    const { container } = render(
      <>
        <UniversalWorkspace model={MODEL} labels={{ categories: 'A' }} idEspai="notes" renderDetail={() => null} />
        <UniversalWorkspace model={MODEL} labels={{ categories: 'B' }} idEspai="notes" renderDetail={() => null} />
      </>
    );
    const [rodaA] = within(container).getAllByRole('button', { name: RODA });
    fireEvent.click(rodaA);
    fireEvent.click(within(container.querySelector('dialog')).getByRole('switch', { name: 'Vull vore Mercat' }));
    expect(within(screen.getByRole('navigation', { name: 'A' })).queryByRole('button', { name: 'Mercat' })).toBeNull();
    expect(within(screen.getByRole('navigation', { name: 'B' })).queryByRole('button', { name: 'Mercat' })).toBeNull();
  });
});

/* Correcció R1 del verificador · «Si la carpeta activa s'amaga, es torna a
   Tot» val també quan s'hi arriba sense l'interruptor: en muntar amb la
   carpeta per defecte (o la d'un enllaç) ja amagada, o si l'interruptor es
   prem mentre les dades revaliden. Una selecció de la secció dins d'una
   carpeta amagada es mostra des de «Tot» amb el MATEIX document, sense
   tocar la selecció de la secció (ni la seua URL). */
describe('la carpeta activa mai queda amagada (correcció R1)', () => {
  const amaga = (espais) => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais });
    _reiniciaCarpetesVisibles();
  };
  const ambDetall = (props) => ({
    renderDetail: ({ item }) => <p className="sdp-prova-detall">{item ? item.title : 'cap'}</p>,
    ...props
  });
  const documentObert = () => document.querySelector('.sdp-prova-detall')?.textContent;
  const totPremut = () => screen.getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed');
  const marcades = () => within(navegacio()).queryAllByRole('button')
    .filter((boto) => boto.hasAttribute('aria-current'))
    .map((boto) => boto.textContent);
  const titolsDeLaLlista = [/Crònica del Mur/, /Nota de la subcarpeta/, /Tomaques/];
  const llista = () => within(document.querySelector('#app-grid-list'));

  test('en muntar amb la carpeta per defecte amagada, s’obri des de «Tot» amb el mateix document i sense avisar la secció', () => {
    amaga({ notes: { 'f-mur': false } });
    const onSelectionChange = vi.fn();
    munta(ambDetall({ onSelectionChange, initialSelection: { categoryId: 'f-mur', itemId: 'n1' } }));
    expect(totPremut()).toBe('true');
    expect(enNavegacio('Mur')).toBeNull();
    expect(marcades()).toEqual([]);
    expect(documentObert()).toBe('Crònica del Mur');
    /* La llista és la de «Tot», no la d'una carpeta que no es veu. */
    for (const titol of titolsDeLaLlista) expect(llista().getByRole('button', { name: titol })).toBeTruthy();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  test('també amb una subcarpeta de la carpeta amagada', () => {
    amaga({ notes: { 'f-mur': false } });
    munta(ambDetall({ initialSelection: { categoryId: 'f-sub', itemId: 'n2' } }));
    expect(totPremut()).toBe('true');
    expect(enNavegacio('Submur')).toBeNull();
    expect(documentObert()).toBe('Nota de la subcarpeta');
  });

  test('una selecció controlada (un enllaç) dins d’una carpeta amagada: «Tot» i el mateix document; la de la secció mana quan torna a la vista', () => {
    amaga({ notes: { 'f-mur': false } });
    const onSelectionChange = vi.fn();
    const props = ambDetall({ onSelectionChange, initialSelection: { categoryId: 'f-mercat', itemId: 'n3' }, selection: { categoryId: 'f-mercat', itemId: 'n3' } });
    const { rerender } = munta(props);
    expect(enNavegacio('Mercat').getAttribute('aria-current')).toBe('page');
    /* La secció canvia la selecció (la URL) a un document de Submur, dins de Mur. */
    rerender(espaiDeTreball({ ...props, selection: { categoryId: 'f-sub', itemId: 'n2' } }));
    expect(totPremut()).toBe('true');
    expect(marcades()).toEqual([]);
    expect(documentObert()).toBe('Nota de la subcarpeta');
    expect(onSelectionChange).not.toHaveBeenCalled();
    /* Tornar Mur a la vista: la selecció de la secció, que no ha canviat, torna a manar. */
    fireEvent.click(interruptor(obriRoda(), 'Mur'));
    fireEvent.click(screen.getByRole('button', { name: 'Fet' }));
    expect(enNavegacio('Submur').getAttribute('aria-current')).toBe('page');
    expect(totPremut()).toBe('false');
    expect(documentObert()).toBe('Nota de la subcarpeta');
  });

  test('si l’interruptor es prem mentre revalida, es torna a «Tot» quan les dades són a punt', () => {
    const onSelectionChange = vi.fn();
    const props = ambDetall({ onSelectionChange, initialSelection: { categoryId: 'f-mur', itemId: 'n1' } });
    const { rerender } = munta(props);
    rerender(espaiDeTreball({ ...props, model: { ...MODEL, status: 'revalidating' } }));
    const dialeg = obriRoda();
    onSelectionChange.mockClear();
    fireEvent.click(interruptor(dialeg, 'Mur'));
    /* Mentre revalida, selectCategory no fa res: la preferència sí que es desa. */
    expect(amagades('notes')).toEqual({ 'f-mur': false });
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(totPremut()).toBe('false');
    rerender(espaiDeTreball({ ...props, model: MODEL }));
    expect(totPremut()).toBe('true');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(expect.objectContaining({ categoryId: '__all__' }), { reason: 'user' });
  });

  test('amb «Tot» triat, una carpeta amagada no canvia res', () => {
    amaga({ notes: { 'f-mur': false } });
    const onSelectionChange = vi.fn();
    munta(ambDetall({ onSelectionChange, initialSelection: { categoryId: '__all__', itemId: 'n3' } }));
    expect(totPremut()).toBe('true');
    expect(documentObert()).toBe('Tomaques');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});

describe('el mode compacte (sense «Tot»)', () => {
  const COMPACTE = Object.freeze({
    status: 'ready',
    navigationGroups: [{ id: 'folders', label: null, options: [
      { id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }, { id: 'f-pobles', label: 'Pobles' }
    ] }],
    items: []
  });
  const muntaCompacte = (props = {}) => munta({ model: COMPACTE, compacte: true, initialSelection: { categoryId: 'f-mur' }, ...props });

  test('amagar l’activa porta a la primera que queda a la vista, i l’última no es pot amagar', () => {
    const onSelectionChange = vi.fn();
    muntaCompacte({ onSelectionChange });
    const dialeg = obriRoda();
    expect(dialeg.queryByText(/Sempre n’hi ha d’haver almenys una a la vista\./)).toBeTruthy();
    onSelectionChange.mockClear();
    fireEvent.click(interruptor(dialeg, 'Mur'));
    expect(onSelectionChange).toHaveBeenCalledWith({ categoryId: 'f-mercat', itemId: null }, { reason: 'user' });
    fireEvent.click(interruptor(dialeg, 'Pobles'));
    expect(interruptor(dialeg, 'Mercat').disabled).toBe(true);
    expect(interruptor(dialeg, 'Mercat').getAttribute('aria-checked')).toBe('true');
    expect([interruptor(dialeg, 'Mur').disabled, interruptor(dialeg, 'Pobles').disabled]).toEqual([false, false]);
    fireEvent.click(interruptor(dialeg, 'Mur'));
    expect(interruptor(dialeg, 'Mercat').disabled).toBe(false);
  });

  test('si la preferència les amagava totes (amagades amb «Tot» en un altre muntatge), la primera es queda a la vista', () => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { 'f-mur': false, 'f-mercat': false, 'f-pobles': false } } });
    _reiniciaCarpetesVisibles();
    muntaCompacte();
    const rail = screen.getByRole('navigation', { name: 'CARPETES' });
    expect(within(rail).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Mur']);
    const dialeg = obriRoda();
    expect([interruptor(dialeg, 'Mur').getAttribute('aria-checked'), interruptor(dialeg, 'Mur').disabled]).toEqual(['true', true]);
  });

  /* Correcció R1 · En compacte la carpeta triada és on arriba l'enllaç (el
     Snippet Curador): la secció ho ha de saber. La columna hi torna amb
     selectCategory, que l'avisa, com fa l'interruptor. */
  const railActiva = () => within(screen.getByRole('navigation', { name: 'CARPETES' })).getAllByRole('button')
    .filter((b) => b.getAttribute('aria-current') === 'page')
    .map((b) => b.getAttribute('aria-label'));

  test('en muntar amb la carpeta triada amagada, es va a la primera a la vista i la secció ho sap', () => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { 'f-mur': false } } });
    _reiniciaCarpetesVisibles();
    const onSelectionChange = vi.fn();
    muntaCompacte({ onSelectionChange });
    /* La reconciliació inicial (sense element) avisa com sempre; la tornada, una vegada. */
    expect(onSelectionChange.mock.calls.filter(([, meta]) => meta.reason === 'user'))
      .toEqual([[{ categoryId: 'f-mercat', itemId: null }, { reason: 'user' }]]);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: 'f-mercat', itemId: null }, { reason: 'user' });
    expect(railActiva()).toEqual(['Mercat']);
  });

  test('amb la selecció controlada de la secció (el Snippet), la secció la segueix i la carpeta triada és la primera a la vista', () => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { 'f-mur': false } } });
    _reiniciaCarpetesVisibles();
    const avisos = vi.fn();
    function Snippet() {
      const [seleccio, setSeleccio] = React.useState({ categoryId: 'f-mur', itemId: null });
      return espaiDeTreball({
        model: COMPACTE,
        compacte: true,
        initialSelection: seleccio,
        selection: seleccio,
        onSelectionChange: (nova, meta) => {
          avisos(nova, meta);
          setSeleccio({ categoryId: nova.categoryId, itemId: null });
        }
      });
    }
    render(<Snippet />);
    expect(avisos).toHaveBeenCalledWith({ categoryId: 'f-mercat', itemId: null }, { reason: 'user' });
    expect(railActiva()).toEqual(['Mercat']);
  });

  test('una secció que la torna a imposar no fa cap bucle: com a molt dos intents', () => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { 'f-mur': false } } });
    _reiniciaCarpetesVisibles();
    const avisos = vi.fn();
    /* A cada avís, la secció torna a demanar Mur (amb una selecció nova). */
    function Tossuda() {
      const [seleccio, setSeleccio] = React.useState({ categoryId: 'f-mur', itemId: null });
      return espaiDeTreball({
        model: COMPACTE,
        compacte: true,
        initialSelection: seleccio,
        selection: seleccio,
        onSelectionChange: (nova, meta) => {
          avisos(nova, meta);
          setSeleccio((actual) => ({ categoryId: 'f-mur', itemId: actual.itemId === null ? undefined : null }));
        }
      });
    }
    render(<Tossuda />);
    expect(avisos.mock.calls.filter(([, meta]) => meta.reason === 'user')).toHaveLength(2);
  });
});

test('sense cap carpeta a la navegació (Admin), la roda obri l’amplada i la secció de carpetes no es pinta', () => {
  munta({
    model: { status: 'ready', itemsComplete: true, navigationGroups: [], items: [{ id: 'u1', title: 'pep@exemple.test', categoryIds: [] }] },
    labels: { categories: 'FILTRES', items: 'Administració: Usuaris' },
    mestreDetall: 'navegacio',
    initialSelection: {}
  });
  const dialeg = obriRoda();
  expect(dialeg.getByRole('heading', { level: 3, name: 'Amplada de les columnes' })).toBeTruthy();
  expect(dialeg.queryByRole('heading', { name: 'Carpetes a la vista' })).toBeNull();
  expect(dialeg.queryAllByRole('switch')).toEqual([]);
});

/* Les claus noves de la roda, en les cinc llengües (la guarda de paritat de
   i18n.claus.test.js, per a este front). */
describe('i18n de la roda dentada', () => {
  const CLAUS = Object.freeze({
    'workspace.ajustos.descripcio': 'Personalitza este espai de treball. El tema clar o fosc es tria a la barra superior.',
    'workspace.ajustos.amplada': 'Amplada de les columnes',
    'workspace.ajustos.amplada.restableix': 'Restablir l’amplada de les columnes',
    'workspace.ajustos.carpetes': 'Carpetes a la vista',
    'workspace.ajustos.carpetes.ajuda': 'Amagar una carpeta la lleva de la navegació, però no l’esborra: els seus documents continuen a «{tot}» i a la cerca.',
    'workspace.ajustos.carpetes.vullVore': 'Vull vore {carpeta}',
    'workspace.ajustos.carpetes.ultima': 'Sempre n’hi ha d’haver almenys una a la vista.',
    /* Revisió del 261007 (M2-02, M2-09) · «Fet», la línia d'estat, el «Sí»/«No»
       dels interruptors i l'ajuda del mode compacte. */
    'workspace.ajustos.fet': 'Fet',
    'workspace.ajustos.ara': 'Ara: navegació {esquerra}px · llistat {mig}px',
    'workspace.ajustos.carpetes.ajudaCompacte': 'Amagar una carpeta la lleva de la navegació, però no l’esborra: els seus documents continuen a la cerca.',
    'workspace.ajustos.interruptor.si': 'Sí',
    'workspace.ajustos.interruptor.no': 'No'
  });
  /* Les llengües on la paraula correcta és la mateixa que en valencià (la
     falta d'entrada la detecta igualment el recompte d'aparicions). */
  const IGUALS_AL_VALENCIA = Object.freeze({
    'workspace.ajustos.interruptor.si': ['es'],
    'workspace.ajustos.interruptor.no': ['es', 'en']
  });
  const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);

  test('les cinc llengües del selector', () => {
    expect([...LLENGUES].sort()).toEqual(['ca', 'en', 'es', 'eu', 'gl']);
  });

  for (const [clau, valencia] of Object.entries(CLAUS)) {
    test(`${clau}: valor propi en cada llengua, una sola aparició per llengua i la reserva del codi és el valor valencià`, () => {
      expect(createTranslator('ca')(clau)).toBe(valencia);
      for (const codi of LLENGUES) {
        const valor = createTranslator(codi)(clau);
        expect([codi, valor === clau]).toEqual([codi, false]);
        if (codi !== 'ca' && !IGUALS_AL_VALENCIA[clau]?.includes(codi)) expect([codi, valor === valencia]).toEqual([codi, false]);
        for (const marca of ['{tot}', '{carpeta}', '{esquerra}', '{mig}']) {
          if (valencia.includes(marca)) expect([codi, valor.includes(marca)]).toEqual([codi, true]);
        }
      }
      expect([clau, fontI18n.split(`'${clau}':`).length - 1]).toEqual([clau, LLENGUES.length]);
      expect([clau, fontWorkspace.includes(`['${clau}', '${valencia}']`)]).toEqual([clau, true]);
    });
  }

  test('cap clau workspace.ajustos.* del codi queda fora de la taula', () => {
    const delCodi = [...new Set([...fontWorkspace.matchAll(/'(workspace\.ajustos\.[\w.]+)'/g)].map((m) => m[1]))].sort();
    expect(delCodi).toEqual(Object.keys(CLAUS).sort());
  });
});
