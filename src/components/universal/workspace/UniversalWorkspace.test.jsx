import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { NotebookPen } from 'lucide-react';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';
import { NotaFitxa } from '../../../sections/notes/NotaFitxa.jsx';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i amagaria (inert) la columna esquerra.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const model = {
  status: 'ready',
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] },
    { id: 'categories', label: 'CATEGORIES', options: [{ id: 'cat_Sistema', label: 'Sistema' }] },
    { id: 'tags', label: 'ETIQUETES', options: [{ id: 'tag_Tutorial', label: 'Tutorial' }] }
  ],
  items: [{
    id: 'n1',
    categoryIds: ['f-mur'],
    title: 'Bloc de notes',
    subtitle: '25/04/26',
    excerpt: "El teu estudi d'escriptura privat",
    image: '/assets/portada.webp',
    updatedAt: '2026-04-25T09:00:00Z'
  }]
};

function renderWorkspace() {
  return render(
    <UniversalWorkspace
      model={model}
      className="sdp-bloc"
      listClassName="sdp-bloc-list--notes"
      labels={{ categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA' }}
      icons={{ items: NotebookPen }}
      tagFilter={false}
      renderItem={(ctx) => <NotaFitxa {...ctx} />}
      renderDetail={() => null}
    />
  );
}

test('el nucli és genèric: sense renderItem pinta la targeta per defecte i el filtre d’etiquetes', () => {
  const { container } = render(
    <UniversalWorkspace
      model={{ status: 'ready', categories: [{ id: 'fonaments', label: 'Fonaments' }], items: model.items.map(i => ({ ...i, categoryIds: ['fonaments'], tags: ['organisme'] })) }}
      labels={{ categories: 'ÀREES', items: 'COMPONENTS' }}
      renderDetail={({ item }) => <p>{item ? `Detall de ${item.title}` : 'res'}</p>}
    />
  );
  expect(container.querySelector('.sdp-nota-fitxa')).toBeNull();
  expect(container.querySelector('.sdp-gestor-fitxa .sdp-gestor-fitxa__titol')?.textContent).toBe('Bloc de notes');
  // Les píndoles d'etiquetes estan amagades fins que s'obri la cerca amb la lupa.
  expect(screen.queryByRole('button', { name: 'organisme' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Cercar elements' }));
  expect(screen.getByRole('button', { name: 'organisme' })).toBeTruthy();
  // Tancar la cerca amaga les píndoles i neteja qualsevol etiqueta activa.
  fireEvent.click(screen.getByRole('button', { name: 'organisme' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(screen.queryByRole('button', { name: 'organisme' })).toBeNull();
  expect(container.querySelector('.sdp-gestor-fitxa .sdp-gestor-fitxa__titol')?.textContent).toBe('Bloc de notes');
  // Sense selecció inicial d’element, el primer de la categoria s’obri sol.
  expect(screen.getByText('Detall de Bloc de notes')).toBeTruthy();
});

test('la selecció controlada sense itemId no deixa el detall buit', () => {
  render(
    <UniversalWorkspace
      model={{ status: 'ready', categories: [{ id: 'fonaments', label: 'Fonaments' }], items: model.items.map(i => ({ ...i, categoryIds: ['fonaments'] })) }}
      initialSelection={{ categoryId: 'fonaments', itemId: undefined }}
      selection={{ categoryId: 'fonaments', itemId: undefined }}
      renderDetail={({ item }) => <p>{item ? `Detall de ${item.title}` : 'res'}</p>}
    />
  );
  expect(screen.getByText('Detall de Bloc de notes')).toBeTruthy();
});

test('les pestanyes NOTES i CARPETES duen icona i el títol NOTES també', () => {
  const { container } = renderWorkspace();
  const notes = container.querySelector('.app-grid-column--middle .app-grid-col-header__plec--fix');
  expect(notes?.querySelector('svg')).toBeTruthy();
  expect(notes?.textContent).toBe('NOTES');
});

test('la capçalera CARPETES plega el grup sense etiqueta i els altres grups són acordions', () => {
  renderWorkspace();
  const nav = screen.getByRole('navigation', { name: 'CARPETES' });

  const carpetes = screen.getByRole('button', { name: 'CARPETES' });
  expect(carpetes.getAttribute('aria-expanded')).toBe('true');
  expect(within(nav).getByRole('menuitem', { name: 'Mur' })).toBeTruthy();

  fireEvent.click(carpetes);
  expect(carpetes.getAttribute('aria-expanded')).toBe('false');
  expect(within(nav).queryByRole('menuitem', { name: 'Mur' })).toBeNull();
  // Els altres grups no es veuen afectats
  expect(within(nav).getByRole('menuitem', { name: 'Sistema' })).toBeTruthy();

  const etiquetes = screen.getByRole('button', { name: 'ETIQUETES' });
  expect(etiquetes.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(etiquetes);
  expect(etiquetes.getAttribute('aria-expanded')).toBe('false');
  expect(within(nav).queryByRole('menuitem', { name: 'Tutorial' })).toBeNull();
  expect(within(nav).getByRole('menuitem', { name: 'Sistema' })).toBeTruthy();
});

test('la targeta de nota mostra miniatura, títol, data i entradeta', () => {
  const { container } = renderWorkspace();
  const card = container.querySelector('.sdp-bloc-list--notes .sdp-nota-fitxa');
  expect(card).toBeTruthy();
  expect(card.querySelector('img.sdp-gestor-fitxa__imatge')?.getAttribute('src')).toBe('/assets/portada.webp');
  expect(card.querySelector('.sdp-nota-fitxa__titol')?.textContent).toBe('Bloc de notes');
  expect(card.querySelector('time.sdp-nota-fitxa__data')?.textContent).toBe('25/04/26');
  expect(card.querySelector('.sdp-nota-fitxa__entradeta')?.textContent).toBe("El teu estudi d'escriptura privat");
  expect(container.querySelector('.app-grid-page')?.classList.contains('sdp-bloc')).toBe(true);
});
