/* MD (ordre del Mestre, 261003; revisió) · La Wiki en mòbil, amb l'espai de
   treball de veres i el router en memòria de veres:
     · /wikidepoble a 375 px: primer l'arbre (WIKI DE POBLE);
     · /wikidepoble?item=… (un enllaç) obri el document;
     · triar una carpeta escriu sola la primera fitxa a la URL: eixir i
       tornar amb l'Arrere torna a la llista on era la persona, no a un
       document que no ha obert;
     · el nom de la carpeta activa amb filles (SABER) porta a la seua llista.
   La línia d'activació llig ?item= cru (no itemEfectiu, que val '__intro').
   Dades sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [
      { id: 'folder:ser', label: 'SER', parentId: null },
      { id: 'folder:saber', label: 'SABER', parentId: null },
      { id: 'folder:saber/arq', label: 'ARQUITECTURA', parentId: 'folder:saber' }
    ],
    items: [
      { id: 'identitat', title: 'Identitat', categoryId: 'folder:ser', tags: [], content: '# Identitat' },
      { id: 'coneixement', title: 'Coneixement', categoryId: 'folder:saber', tags: [], content: '# Coneixement' },
      { id: 'pedra', title: 'Pedra seca', categoryId: 'folder:saber/arq', tags: [], content: '# Pedra seca' }
    ]
  }
}));
/* El doble pinta el títol com la UniversalPage de veres: l'H1 dins de la
   capçalera de pàgina. */
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: ({ title }) => <header className="page-title"><h1>{title}</h1></header>
}));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: () => ({ url: null, status: 'idle', isLoading: false })
}));

import { MemoryRouter, Route, Routes, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import WikiDePobleSection from './WikiDePobleSection.jsx';

/* La memòria del nivell viu a la capa efímera: cada prova, una pestanya nova. */
beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function Sonda() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>;
}
function Navegacio() {
  const navigate = useNavigate();
  return (
    <nav aria-label="App">
      <button type="button" onClick={() => navigate('/mur')}>Ves al Mur</button>
      <button type="button" onClick={() => navigate(-1)}>Arrere</button>
    </nav>
  );
}
const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/wikidepoble" element={<WikiDePobleSection />} />
      <Route path="/mur" element={<p>Mur</p>} />
    </Routes>
    <Navegacio />
    <Sonda />
  </MemoryRouter>
);

const url = () => screen.getByTestId('url').textContent;
const panell = (c) => c.querySelector('.app-grid-shell').dataset.panell;
const obertes = (c) => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
  .filter((id) => c.querySelector(id).getAttribute('aria-hidden') !== 'true');
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const llista = (c) => c.querySelector('#app-grid-list');
const carpeta = (c, nom) => within(navegacio(c)).getByRole('button', { name: nom });
const app = (nom) => within(screen.getByRole('navigation', { name: 'App' })).getByRole('button', { name: nom });

test('MD · /wikidepoble a 375 px: primer l’arbre, sola', () => {
  const { container } = munta('/wikidepoble');
  expect([container.querySelector('.app-grid-shell').dataset.layout, panell(container)]).toEqual(['estret', 'left']);
  expect(obertes(container)).toEqual(['#app-grid-sidebar']);
});

test('MD · un enllaç amb document (/wikidepoble?item=…) l’obri directament', () => {
  const { container } = munta('/wikidepoble?item=identitat');
  expect(panell(container)).toBe('');
  expect(obertes(container)).toEqual(['#app-grid-main']);
  expect(within(container.querySelector('#app-grid-main')).getByRole('heading', { level: 1 }).textContent).toBe('Identitat');
});

test('MD · triar SABER escriu la primera fitxa a la URL; eixir i tornar amb l’Arrere torna a la llista, no al document', () => {
  const { container } = munta('/wikidepoble');
  fireEvent.click(carpeta(container, 'SABER'));
  expect(panell(container)).toBe('middle');
  const enLaLlista = url();
  expect(enLaLlista).toContain('item=coneixement');

  fireEvent.click(app('Ves al Mur'));
  expect(url()).toBe('/mur');
  fireEvent.click(app('Arrere'));
  expect(url()).toBe(enLaLlista);
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
});

test('MD · el nom de SABER, carpeta activa amb filles, porta a la seua llista; abans era un carreró', () => {
  const { container } = munta('/wikidepoble');
  fireEvent.click(carpeta(container, 'SABER'));
  expect(panell(container)).toBe('middle');
  fireEvent.click(within(llista(container)).getByRole('button', { name: 'WIKI DE POBLE' }));
  expect(panell(container)).toBe('left');
  expect(carpeta(container, 'SABER').getAttribute('aria-current')).toBe('page');

  fireEvent.click(carpeta(container, 'SABER'));
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
  expect(within(llista(container)).getByRole('button', { name: /Coneixement/ })).toBeTruthy();
});
