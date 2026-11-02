/* O2-T5 · Paritat DOM fora de Tot i sense fixats. La política rep només
   candidates que la llista pot mostrar; la selecció manual conserva prioritat. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: ref => ref,
  useResolvedAssetState: ref => ({ url: ref, status: 'ready', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(cleanup);
const items = Object.freeze([
  { id: 'vell', title: 'Zona', categoryIds: ['poble'], updatedAt: '2026-01-01' },
  { id: 'alfa', title: 'Almàssera', categoryIds: ['poble'], updatedAt: '2026-05-01' },
  { id: 'nou', title: 'Bancal', categoryIds: ['poble'], updatedAt: '2026-10-01' }
]);
const model = { status: 'ready', itemsComplete: true, items, categories: [] , navigationGroups: [{ id: 'folders', options: [{ id: 'poble', label: 'Poble' }] }] };
const files = () => [...document.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')];
const titol = fila => fila.querySelector('.sdp-gestor-fitxa__titol').textContent;
const ultima = espia => espia.mock.calls.at(-1)?.[0];
const perNom = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Ordenar per data o nom' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nom (A-Z)' }));
};
test.each(['poble', '__all__'])('inicial data en %s: selecció i primera fila són la més nova', categoryId => {
  const onSelectionChange = vi.fn();
  render(<UniversalWorkspace sortable model={model} initialSelection={{ categoryId }} onSelectionChange={onSelectionChange} />);
  expect(titol(files()[0])).toBe('Bancal');
  expect(files()[0].getAttribute('aria-current')).toBe('true');
  expect(ultima(onSelectionChange)).toEqual({ categoryId, itemId: 'nou' });
});
test('canviar carpeta amb nom: no mana l’ordre d’entrada', () => {
  const onSelectionChange = vi.fn();
  render(<UniversalWorkspace sortable model={model} initialSelection={{ categoryId: '__all__', itemId: 'nou' }} onSelectionChange={onSelectionChange} />);
  perNom();
  fireEvent.click(screen.getByRole('button', { name: 'Poble', exact: true }));
  expect(titol(files()[0])).toBe('Almàssera');
  expect(files()[0].getAttribute('aria-current')).toBe('true');
  expect(ultima(onSelectionChange)).toEqual({ categoryId: 'poble', itemId: 'alfa' });
});
test('reconciliar ID inexistent respecta consulta: el primer triable també és visible', () => {
  const onSelectionChange = vi.fn();
  const canAutoSelect = vi.fn(() => true);
  render(<UniversalWorkspace sortable model={{ ...model, canAutoSelect }} initialSelection={{ categoryId: 'poble', itemId: 'esborrat', query: 'Almàssera' }} onSelectionChange={onSelectionChange} />);
  expect(files()).toHaveLength(1);
  expect(titol(files()[0])).toBe('Almàssera');
  expect(files()[0].getAttribute('aria-current')).toBe('true');
  expect(ultima(onSelectionChange)).toEqual({ categoryId: 'poble', itemId: 'alfa' });
  expect(canAutoSelect.mock.calls.every(([context]) => context.candidates.length === 1 && context.candidates[0].id === 'alfa')).toBe(true);
});

function SondaDeFiltres() {
  const { state, filteredItems, clearFilters, setQuery, selectCategory, selectItem } = useWorkspace();
  return <>
    <output data-testid="tria">{state.activeItemId ?? 'cap'}</output>
    <output data-testid="files">{filteredItems.length}</output>
    <button onClick={clearFilters}>Netejar filtres</button>
    <button onClick={() => { setQuery('sensecoincidencies'); }}>Cerca buida</button>
    <button onClick={() => selectCategory('poble')}>Obrir poble</button>
    <button onClick={() => selectItem(null)}>Cap tria explícita</button>
  </>;
}
function muntaSonda(initialSelection, props = {}) {
  return render(<WorkspaceProvider categories={[{ id: 'poble' }, { id: 'altra' }]} items={items}
    itemsComplete initialSelection={initialSelection} ordreInicial={{ sortable: true }} {...props}>
    <SondaDeFiltres />
  </WorkspaceProvider>);
}
test.each([{ query: 'sensecoincidencies' }, { tagIds: ['inexistent'] }])('AUD-01: netejar %o reprén la demanda inicial ajornada', filtre => {
  muntaSonda({ categoryId: 'poble', ...filtre });
  expect(screen.getByTestId('files').textContent).toBe('0');
  expect(screen.getByTestId('tria').textContent).toBe('cap');
  fireEvent.click(screen.getByRole('button', { name: 'Netejar filtres' }));
  expect(screen.getByTestId('files').textContent).toBe('3');
  expect(screen.getByTestId('tria').textContent).toBe('nou');
});
test('AUD-01: una carpeta triada amb cerca sense resultats reprén la reserva en netejar', () => {
  muntaSonda({ categoryId: 'altra', itemId: null });
  fireEvent.click(screen.getByRole('button', { name: 'Cerca buida' }));
  fireEvent.click(screen.getByRole('button', { name: 'Obrir poble' }));
  expect(screen.getByTestId('tria').textContent).toBe('cap');
  fireEvent.click(screen.getByRole('button', { name: 'Netejar filtres' }));
  expect(screen.getByTestId('tria').textContent).toBe('nou');
});
test.each([
  ['nul inicial explícit', { itemId: null }, {}],
  ['categoriaSenseElement', {}, { categoriaSenseElement: true }],
  ['política que veta qualsevol autotria', {}, { canAutoSelect: () => false }]
])('netejar filtres no inventa una selecció amb %s', (_nom, seleccio, props) => {
  muntaSonda({ categoryId: 'poble', query: 'sensecoincidencies', ...seleccio }, props);
  fireEvent.click(screen.getByRole('button', { name: 'Netejar filtres' }));
  expect(screen.getByTestId('files').textContent).toBe('3');
  expect(screen.getByTestId('tria').textContent).toBe('cap');
});
test('una selecció nul·la explícita cancella la demanda ajornada abans de netejar', () => {
  muntaSonda({ categoryId: 'poble', query: 'sensecoincidencies' });
  fireEvent.click(screen.getByRole('button', { name: 'Cap tria explícita' }));
  fireEvent.click(screen.getByRole('button', { name: 'Netejar filtres' }));
  expect(screen.getByTestId('tria').textContent).toBe('cap');
});
test('filtraPerConsulta false no ajorna una reserva per la consulta externa', () => {
  muntaSonda({ categoryId: 'poble', query: 'sensecoincidencies' }, { filtraPerConsulta: false });
  expect(screen.getByTestId('files').textContent).toBe('3');
  expect(screen.getByTestId('tria').textContent).toBe('nou');
});
