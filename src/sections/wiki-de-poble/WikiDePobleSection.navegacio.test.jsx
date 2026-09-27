import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [
      { id: 'folder:ser', label: 'SER' },
      { id: 'folder:saber', label: 'SABER' }
    ],
    items: [
      { id: '00_index', title: '00_index', categoryId: null, tags: [], content: '# Índex' },
      { id: 'identitat', title: 'Identitat', categoryId: 'folder:ser', tags: [], content: '# Identitat' },
      { id: 'coneixement', title: 'Coneixement', categoryId: 'folder:saber', tags: [], content: '# Coneixement' }
    ]
  }
}));
vi.mock('../../app/contexts/RouterContext', async () => {
  const React = await import('react');
  const Context = React.createContext();
  return {
    RouterTest: ({ children }) => {
      const [search, setSearch] = React.useState('');
      return <Context.Provider value={{ search, navigate: setSearch }}>{children}<output aria-label="URL">{search}</output></Context.Provider>;
    },
    useNavigate: () => React.useContext(Context).navigate,
    useLocation: () => ({ search: React.useContext(Context).search }),
    Link: 'a'
  };
});
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: ({ title }) => <h1>{title}</h1> }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAssetState: () => ({ url: null, status: 'idle', isLoading: false })
}));

import { RouterTest } from '../../app/contexts/RouterContext';
import WikiDePobleSection from './WikiDePobleSection.jsx';

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('entrada plena, carpeta explícita i retorn a Tot mantenen els documents visibles', () => {
  render(<RouterTest><WikiDePobleSection /></RouterTest>);
  const list = () => document.querySelector('#app-grid-list');
  const nav = () => screen.getByRole('navigation', { name: 'WIKI DE POBLE' });
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wiki de Poble');
  expect(within(list()).getByRole('button', { name: /Identitat/ })).toBeTruthy();
  expect(within(list()).getByRole('button', { name: /Coneixement/ })).toBeTruthy();
  expect(within(list()).getByRole('button', { name: /Índex/ })).toBeTruthy();
  expect(within(nav()).queryByRole('button', { name: 'Índex' })).toBeNull();

  fireEvent.click(within(nav()).getByRole('button', { name: 'SABER' }));
  expect(within(list()).queryByRole('button', { name: /Identitat/ })).toBeNull();
  expect(within(list()).getByRole('button', { name: /Coneixement/ })).toBeTruthy();
  expect(screen.getByLabelText('URL').textContent).toContain('categoria=folder%3Asaber');

  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  expect(within(list()).getByRole('button', { name: /Identitat/ })).toBeTruthy();
  fireEvent.click(within(list()).getByRole('button', { name: /Coneixement/ }));
  expect(screen.getByLabelText('URL').textContent).toBe('?item=coneixement');
  expect(within(list()).getByRole('button', { name: /Identitat/ })).toBeTruthy();

  fireEvent.click(within(list()).getByRole('button', { name: /Consola Termodinàmica/ }));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Consola Termodinàmica');
  expect(within(list()).getByRole('button', { name: /Identitat/ })).toBeTruthy();
  expect(within(list()).getByRole('button', { name: /Coneixement/ })).toBeTruthy();
});
