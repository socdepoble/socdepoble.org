/* Ordre del Mestre, 261004 (pla 2045, Marató 2230, F3) · Els glifs de la Wiki
   amb el UniversalWorkspace de veres. Regla: una categoria que agrupa
   documents porta carpeta (Tractors, SER, SABER); una entrada directa a una
   sola pàgina, document (Wiki de Poble, Consola); un document final, el seu
   glif. Llei del Píxel: només canvia el glif de la categoria «Tractors»; la
   resta es fixa ací com a guarda. Vitest corre amb import.meta.env.DEV cert,
   de manera que la categoria dels Tractors hi és (al build, no:
   WikiDePobleSection.produccio.test.jsx). Bastida de navegacio.test.jsx. Les
   classes són les que emet lucide-react (lucide-folder, lucide-file-text); la
   identitat del component la prova einesLocals.test.jsx. */
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
      { id: 'identitat', title: 'Identitat', categoryId: 'folder:ser', tags: [], content: '# Identitat' },
      { id: 'coneixement', title: 'Coneixement', categoryId: 'folder:saber', tags: [], content: '# Coneixement' }
    ]
  }
}));
/* La URL que escriu la Wiki, en un doble: triar una carpeta la canvia i la
   Wiki la torna a llegir, com a navegacio.test.jsx. */
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => {
  const deVeres = await importOriginal();
  const React = await import('react');
  const Context = React.createContext(null);
  return {
    ...deVeres,
    RouterTest: ({ children }) => {
      const [search, setSearch] = React.useState('');
      return <Context.Provider value={{ search, navigate: setSearch }}>{children}</Context.Provider>;
    },
    useNavigate: () => React.useContext(Context)?.navigate ?? deVeres.useNavigate(),
    useLocation: () => {
      const doble = React.useContext(Context);
      return doble ? { search: doble.search } : deVeres.useLocation();
    },
    Link: 'a'
  };
});
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: ({ title }) => <header className="page-title"><h1>{title}</h1></header>
}));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../tractors/PanellTractors.jsx', () => ({ default: () => <p>Doble dels Tractors</p> }));
vi.mock('../tractors/PanellSentinelles.jsx', () => ({ default: () => <p>Doble dels Sentinelles</p> }));
/* Sense imatge resolta: la fitxa pinta el glif (ItemMedia). */
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

const nav = () => screen.getByRole('navigation', { name: 'WIKI DE POBLE' });
const llista = () => document.querySelector('#app-grid-list');
/* Les classes de glif (lucide-…) que porta un botó, sense la genèrica «lucide». */
const glifs = (boto) => [...boto.querySelectorAll('svg')]
  .flatMap((svg) => [...svg.classList].filter((classe) => classe.startsWith('lucide-')));

test('arbre: Tractors porta carpeta; Wiki de Poble i Consola, document; SER i SABER, carpeta', () => {
  render(<RouterTest><WikiDePobleSection /></RouterTest>);
  const arbre = within(nav());
  expect(glifs(arbre.getByRole('button', { name: 'Tractors' }))).toEqual(['lucide-folder']);
  expect(glifs(arbre.getByRole('button', { name: 'Wiki de Poble' }))).toEqual(['lucide-file-text']);
  expect(glifs(arbre.getByRole('button', { name: 'Consola Termodinàmica' }))).toEqual(['lucide-file-text']);
  expect(glifs(arbre.getByRole('button', { name: 'SER' }))).toEqual(['lucide-folder']);
  expect(glifs(arbre.getByRole('button', { name: 'SABER' }))).toEqual(['lucide-folder']);
});

test('fitxes: les eines de Tractors conserven el document a «Tot» i dins de la seua carpeta; els documents del manifest, la carpeta heretada', () => {
  render(<RouterTest><WikiDePobleSection /></RouterTest>);

  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  expect(glifs(within(llista()).getByRole('button', { name: /Aprovació de tractors/ }))).toEqual(['lucide-file-text']);
  expect(glifs(within(llista()).getByRole('button', { name: /Sentinelles/ }))).toEqual(['lucide-file-text']);
  // Estat actual dels documents del manifest (decisió del Mestre pendent): hereten la carpeta.
  expect(glifs(within(llista()).getByRole('button', { name: /Identitat/ }))).toEqual(['lucide-folder']);

  // Amb Tractors activa, glifDeCategoria prova primer eixa carpeta: el glif propi guanya.
  fireEvent.click(within(nav()).getByRole('button', { name: 'Tractors' }));
  expect(within(nav()).getByRole('button', { name: 'Tractors' }).getAttribute('aria-current')).toBe('page');
  expect(within(llista()).queryByRole('button', { name: /Identitat/ })).toBeNull();
  expect(glifs(within(llista()).getByRole('button', { name: /Aprovació de tractors/ }))).toEqual(['lucide-file-text']);
  expect(glifs(within(llista()).getByRole('button', { name: /Sentinelles/ }))).toEqual(['lucide-file-text']);
});
