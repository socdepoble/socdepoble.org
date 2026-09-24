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

vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: null })
}));
vi.mock('../../../app/contexts/CoreContentContext.jsx', () => ({
  useCoreContent: () => ({ agents: [] })
}));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: null, estat: 'fora' })
}));
vi.mock('../../../app/contexts/RouterContext.jsx', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/' } }),
  useNavigate: () => vi.fn()
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
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
  expect(within(nav).getByRole('button', { name: 'Mur' })).toBeTruthy();

  fireEvent.click(carpetes);
  expect(carpetes.getAttribute('aria-expanded')).toBe('false');
  expect(within(nav).queryByRole('button', { name: 'Mur' })).toBeNull();
  // Els altres grups no es veuen afectats
  expect(within(nav).getByRole('button', { name: 'Sistema' })).toBeTruthy();

  const etiquetes = screen.getByRole('button', { name: 'ETIQUETES' });
  expect(etiquetes.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(etiquetes);
  expect(etiquetes.getAttribute('aria-expanded')).toBe('false');
  expect(within(nav).queryByRole('button', { name: 'Tutorial' })).toBeNull();
  expect(within(nav).getByRole('button', { name: 'Sistema' })).toBeTruthy();
});

test('la targeta de nota mostra miniatura, títol, data i entradeta', () => {
  const { container } = renderWorkspace();
  const card = container.querySelector('.sdp-bloc-list--notes .sdp-nota-fitxa') || container.querySelector('.sdp-bloc-list--notes .sdp-nota-fitxa-viva');
  expect(card).toBeTruthy();
  
  const isViva = card.classList.contains('sdp-nota-fitxa-viva');
  if (isViva) {
    expect(card.querySelector('img.sp-card-media')?.getAttribute('src')).toBe('/assets/portada.webp');
    expect(card.querySelector('.sp-card-title')?.textContent).toBe('Bloc de notes');
    expect(card.querySelector('.sp-card-text')?.textContent).toBe("El teu estudi d'escriptura privat");
  } else {
    expect(card.querySelector('img.sdp-gestor-fitxa__imatge')?.getAttribute('src')).toBe('/assets/portada.webp');
    expect(card.querySelector('.sdp-nota-fitxa__titol')?.textContent).toBe('Bloc de notes');
    expect(card.querySelector('time.sdp-nota-fitxa__data')?.textContent).toBe('25/04/26');
    expect(card.querySelector('.sdp-nota-fitxa__entradeta')?.textContent).toBe("El teu estudi d'escriptura privat");
  }
  expect(container.querySelector('.app-grid-page')?.classList.contains('sdp-bloc')).toBe(true);
});

test('carpetes niuades: desplegar no selecciona, seleccionar filtra i una URL revela avantpassats', () => {
  const nested = {
    status: 'ready', itemsComplete: true,
    navigationGroups: [{ id: 'folders', options: [
      { id: 1, label: 'Wiki' },
      { id: 2, parentId: 1, label: 'Saber' },
      { id: 3, parentId: 2, label: 'Protocols' }
    ] }],
    items: [{ id: 'doc', title: 'Protocol viu', categoryIds: [3] }]
  };
  const onSelectionChange = vi.fn();
  const { rerender } = render(<UniversalWorkspace model={nested} initialSelection={{ categoryId: '__all__', itemId: null }} onSelectionChange={onSelectionChange} />);
  expect(screen.queryByRole('button', { name: 'Saber' })).toBeNull();
  onSelectionChange.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Desplegar Wiki' }));
  expect(onSelectionChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Desplegar Saber' }));
  fireEvent.click(screen.getByRole('button', { name: 'Protocols' }));
  expect(screen.getByRole('button', { name: 'Protocols' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('button', { name: 'Protocol viu' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Plegar Wiki' }));
  expect(screen.queryByRole('button', { name: 'Protocols' })).toBeNull();
  rerender(<UniversalWorkspace model={nested} selection={{ categoryId: '1', itemId: null }} />);
  rerender(<UniversalWorkspace model={nested} selection={{ categoryId: '3', itemId: 'doc' }} />);
  expect(screen.getByRole('button', { name: 'Protocols' })).toBeTruthy();
});


test('navegació fixa sense controls d’edició i ordenació per nom', () => {
  const { container } = render(<UniversalWorkspace collapsibleNavigation={false} sortable
    labels={{ categories: 'WIKI DE POBLE' }}
    model={{ status: 'ready', items: [{ id: 'b', title: 'B', updatedAt: '2026-09-23' }, { id: 'a', title: 'A', updatedAt: '2026-09-22' }] }} />);
  expect(screen.queryByTitle('Plegar o desplegar WIKI DE POBLE')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Configurar categories' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Ordenar per data o nom' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Ordenar per' }), { target: { value: 'name' } });
  expect([...container.querySelectorAll('.sdp-gestor-fitxa__titol')].map(el => el.textContent)).toEqual(['A', 'B']);
});

test('revalidació buida no es presenta com absència i crear queda desactivat', () => {
  render(<UniversalWorkspace model={{ status: 'revalidating', items: [] }} onCreate={() => {}} />);
  expect(screen.queryByText('No hi ha elements.')).toBeNull();
  expect(screen.getByRole('button', { name: 'CREAR' }).disabled).toBe(true);
});

test('la roda de CARPETES apareix amb onManageCategories i continua visible amb la columna replegada', () => {
  const onManage = vi.fn();
  render(
    <UniversalWorkspace
      model={model}
      className="sdp-bloc"
      labels={{ categories: 'CARPETES', items: 'NOTES' }}
      onManageCategories={onManage}
      renderDetail={() => null}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Configurar categories' }));
  expect(onManage).toHaveBeenCalledTimes(1);
  // sdp-app-grid-shell §3: replegada la columna, la roda continua al costat de l'icona d'obrir.
  fireEvent.click(screen.getByRole('button', { name: 'Replegar CARPETES' }));
  expect(screen.getByRole('button', { name: 'Expandir CARPETES' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Configurar categories' })).toBeTruthy();
});

test('A11Y: el títol plegable de la columna no es declara pàgina actual', () => {
  renderWorkspace();
  const carpetes = screen.getByRole('button', { name: 'CARPETES' });
  expect(carpetes.hasAttribute('aria-current')).toBe(false);
  expect(carpetes.getAttribute('aria-expanded')).toBe('true');
});
