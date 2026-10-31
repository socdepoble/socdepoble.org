import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

/*
 * Gauntlet 261029 (cicle 1) · Dues opcions noves del model i de les
 * etiquetes, opt-in (Disseny i la Wiki no les passen i no canvien):
 *   · `expandOnSelect` en una categoria: activa, es desplega sola, també
 *     quan els fills li arriben després (el volum de /multimedia s'obri
 *     més tard que el clic); plegada amb el chevron, un model nou no la torna
 *     a obrir;
 *   · `labels.noResults`: la llista buida per culpa de la cerca no diu que
 *     la carpeta és buida.
 */

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const modelAmb = (fills, { expandOnSelect = true } = {}) => ({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [{ id: 'folders', options: [
    { id: 'arrel', label: 'Carpeta local', ...(expandOnSelect ? { expandOnSelect: true } : {}) },
    ...fills.map((nom) => ({ id: nom, parentId: 'arrel', label: nom })),
    { id: 'altra', label: 'Altra' }
  ] }],
  items: [
    { id: 'a', title: 'Arxiu de l’arrel', categoryIds: ['arrel'] },
    { id: 'b', title: 'Arxiu d’altra', categoryIds: ['altra'] }
  ]
});
const carpeta = (nom) => screen.getByRole('button', { name: nom });
const munta = (model, props = {}) => {
  const utils = render(
    <UniversalWorkspace model={model} initialSelection={{ categoryId: 'arrel', itemId: null }} onSelectionChange={vi.fn()} {...props} />
  );
  return {
    ...utils,
    nouModel: (nou) => utils.rerender(
      <UniversalWorkspace model={nou} initialSelection={{ categoryId: 'arrel', itemId: null }} onSelectionChange={vi.fn()} {...props} />
    )
  };
};

test('expandOnSelect: activa i amb els fills que arriben després, es desplega sola', () => {
  const { nouModel } = munta(modelAmb([]));
  expect(screen.queryByRole('button', { name: '00_inbox' })).toBeNull();
  nouModel(modelAmb(['00_inbox', 'documents']));
  expect(carpeta('Carpeta local').getAttribute('aria-expanded')).toBe('true');
  expect(carpeta('00_inbox')).toBeTruthy();
});

test('expandOnSelect: plegada amb el chevron, un model nou (la mateixa activa) no la torna a obrir', () => {
  const { nouModel } = munta(modelAmb(['00_inbox']));
  expect(carpeta('Carpeta local').getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Plegar Carpeta local' }));
  expect(screen.queryByRole('button', { name: '00_inbox' })).toBeNull();
  nouModel(modelAmb(['00_inbox']));
  expect(screen.queryByRole('button', { name: '00_inbox' })).toBeNull();
});

test('sense expandOnSelect (Disseny, la Wiki…), l’activa no es desplega sola', () => {
  const { nouModel } = munta(modelAmb([], { expandOnSelect: false }));
  nouModel(modelAmb(['00_inbox'], { expandOnSelect: false }));
  expect(carpeta('Carpeta local').getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('button', { name: '00_inbox' })).toBeNull();
});

test('labels.noResults: una cerca sense coincidències no diu que la carpeta és buida; sense l’etiqueta, empty com sempre', () => {
  const cerca = (container, text) => {
    const llista = container.querySelector('#app-grid-list');
    fireEvent.click(within(llista).getByRole('button', { name: 'Cercar elements' }));
    fireEvent.change(within(llista).getByRole('searchbox'), { target: { value: text } });
    return within(llista);
  };
  const ambEtiqueta = munta(modelAmb([]), { labels: { empty: 'Carpeta buida.', noResults: 'Cap coincidència.' } });
  let llista = cerca(ambEtiqueta.container, 'zzz');
  expect(llista.getByText('Cap coincidència.')).toBeTruthy();
  expect(llista.queryByText('Carpeta buida.')).toBeNull();
  cleanup();
  const senseEtiqueta = munta(modelAmb([]), { labels: { empty: 'Carpeta buida.' } });
  llista = cerca(senseEtiqueta.container, 'zzz');
  expect(llista.getByText('Carpeta buida.')).toBeTruthy();
});
