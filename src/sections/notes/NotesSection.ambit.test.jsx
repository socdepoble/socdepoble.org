/* IDEA-61 (T0, prompt 261102_1532) · L'entrada des d'una secció vertical al
   Bloc de Notes: /notes?ambit=<mercat|vehicle|treball|habitatge>, amb l'espai
   de treball de veres i el router en memòria de veres. Sense nota a la URL
   s'obri la «Nota sense títol» (la preparada) amb l'àmbit pendent al canal;
   amb nota, eixa nota. Consumir el canal (l'editor ja ha obert «On es
   publica?») neteja ?ambit= de la URL i conserva la selecció. ?ambit=mur o un
   valor estrany no fan res. El detall és una sonda que llig el canal; el
   diàleg de veres es prova a NotesEditor.ambit.test.jsx. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({
  notes: [], status: 'ready', teSessio: true, canCreate: true, config: { dataMode: 'remote' }, notesComplete: true,
  creaNota: null, setLocalNoteField: null, canal: null, buit: []
}));

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.buit, status: dades.status, canCreate: dades.canCreate, teSessio: dades.teSessio,
    notesComplete: dades.notesComplete, config: dades.config, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: (...args) => dades.creaNota(...args), setLocalNoteField: (...args) => dades.setLocalNoteField(...args)
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: dades.config }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
/* El detall diu quina nota té oberta, si és la preparada i què porta el canal de l'àmbit. */
vi.mock('./NotesDetail.jsx', async () => {
  const { useCanalAmbit } = await import('../../components/universal/ambits/canalAmbit.js');
  function DetallFals({ activeNote }) {
    const canal = useCanalAmbit();
    dades.canal = canal;
    return (
      <p data-testid="detall" data-preparada={activeNote?.preparada ? 'si' : 'no'} data-pendent={canal?.pendent ?? ''}>
        {activeNote?.id ?? 'cap'}
      </p>
    );
  }
  return { default: DetallFals };
});
vi.mock('./NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" className="fitxa-de-prova" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from './NotesSection.jsx';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const NOTA_A = Object.freeze({ id: 'a1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' });

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  Object.assign(dades, { notes: [NOTA_A], status: 'ready', teSessio: true, canCreate: true, config: { dataMode: 'remote' }, notesComplete: true, canal: null });
  dades.creaNota = vi.fn(async (entrada) => ({ ...entrada, revision: 1 }));
  dades.setLocalNoteField = vi.fn();
});
afterEach(() => cleanup());

/* La URL de l'entrada actual del router i una navegació de prova cap a un altre àmbit. */
function Sonda() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>
      <button type="button" onClick={() => navigate('/notes?nota=a1&ambit=habitatge')}>Habitatge de prova</button>
    </>
  );
}
const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
    <Sonda />
  </MemoryRouter>
);
const url = () => screen.getByTestId('url').textContent;
const detall = () => screen.getByTestId('detall');
const pendent = () => detall().dataset.pendent;
const columnaNotes = () => screen.getByRole('complementary', { name: 'NOTES' });
const consumix = () => act(() => { dades.canal.consumix(); });

test('?ambit=vehicle sense nota obri la «Nota sense títol» amb l’àmbit pendent al canal; consumir el deixa nul, neteja la URL i hi fixa la nota', () => {
  munta('/notes?ambit=vehicle');
  const id = detall().textContent;
  expect(id).toMatch(UUID_V4);
  expect(detall().dataset.preparada).toBe('si');
  expect(pendent()).toBe('vehicle');
  expect(within(columnaNotes()).getByRole('button', { name: 'Nota sense títol' }).getAttribute('aria-current')).toBe('true');
  expect(dades.creaNota).not.toHaveBeenCalled();
  consumix();
  expect(pendent()).toBe('');
  expect(url()).not.toContain('ambit=');
  expect(url()).toContain(`nota=${id}`);
  // La selecció no depén de l'àmbit: la preparada continua oberta i sense crear-se.
  expect(detall().textContent).toBe(id);
  expect(dades.creaNota).not.toHaveBeenCalled();
});

test('?ambit=treball amb una nota a la URL: s’obri eixa nota amb l’àmbit pendent; la URL es queda sense ?ambit= i amb la nota', () => {
  munta('/notes?nota=a1&ambit=treball');
  expect(detall().textContent).toBe('a1');
  expect(detall().dataset.preparada).toBe('no');
  expect(pendent()).toBe('treball');
  consumix();
  expect(pendent()).toBe('');
  expect(url()).toBe('/notes?nota=a1');
  expect(detall().textContent).toBe('a1');
});

test('?ambit=mur o un valor estrany no fan res: l’entrada de sempre (la Card tutorial) i cap àmbit pendent', () => {
  munta('/notes?ambit=mur');
  expect(detall().textContent).toBe('cap');
  expect(pendent()).toBe('');
  expect(screen.queryByRole('button', { name: 'Nota sense títol' })?.getAttribute('aria-current') ?? null).toBeNull();
  cleanup();
  munta('/notes?ambit=tramvia');
  expect(detall().textContent).toBe('cap');
  expect(pendent()).toBe('');
  cleanup();
  munta('/notes?nota=a1&ambit=MUR');
  expect(detall().textContent).toBe('a1');
  expect(pendent()).toBe('');
});

test('amb el Bloc ja obert, navegar a una URL amb ?ambit= el torna a demanar, i només una vegada per URL', () => {
  munta('/notes?nota=a1');
  expect(pendent()).toBe('');
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Habitatge de prova' })); });
  expect(detall().textContent).toBe('a1');
  expect(pendent()).toBe('habitatge');
  consumix();
  expect(pendent()).toBe('');
  expect(url()).toBe('/notes?nota=a1');
});

test('la selecció canviada a mà conserva ?ambit= fins que l’editor el consumix', () => {
  dades.notes = [NOTA_A, { id: 'a2', title: 'Segona', folderId: 'f-mur', updatedAt: '2026-01-02T09:00:00Z' }];
  munta('/notes?carpeta=f-mur&nota=a1&ambit=mercat');
  expect(pendent()).toBe('mercat');
  fireEvent.click(screen.getByRole('button', { name: 'Segona' }));
  expect(detall().textContent).toBe('a2');
  expect(new URL(url(), 'https://prova.invalid').searchParams.get('ambit')).toBe('mercat');
  expect(pendent()).toBe('mercat');
  consumix();
  expect(url()).toBe('/notes?carpeta=f-mur&nota=a2');
  expect(pendent()).toBe('');
});


test.each(['mercat', 'vehicle', 'treball', 'habitatge'])('sense sessió, l’àmbit %s sobreviu a la reconciliació i a un remuntatge abans de connectar', (ambit) => {
  Object.assign(dades, { notes: [], teSessio: false, canCreate: false });
  munta(`/notes?ambit=${ambit}`);
  expect(new URL(url(), 'https://prova.invalid').searchParams.get('ambit')).toBe(ambit);
  expect(dades.creaNota).not.toHaveBeenCalled();
  const retorn = url();
  cleanup();
  Object.assign(dades, { notes: [], teSessio: true, canCreate: true });
  munta(retorn);
  expect(pendent()).toBe(ambit);
  expect(detall().dataset.preparada).toBe('si');
  expect(detall().textContent).toMatch(UUID_V4);
  consumix();
  expect(url()).not.toContain('ambit=');
  expect(pendent()).toBe('');
  expect(dades.creaNota).not.toHaveBeenCalled();
});
