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
/* Dins de RouterTest mana el doble (la URL que escriu la Wiki, tal qual);
   fora d'ell, el router de veres: el MemoryRouter de l'enxufe. */
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => {
  const deVeres = await importOriginal();
  const React = await import('react');
  const Context = React.createContext(null);
  return {
    ...deVeres,
    RouterTest: ({ children }) => {
      const [search, setSearch] = React.useState('');
      return <Context.Provider value={{ search, navigate: setSearch }}>{children}<output aria-label="URL">{search}</output></Context.Provider>;
    },
    useNavigate: () => React.useContext(Context)?.navigate ?? deVeres.useNavigate(),
    useLocation: () => {
      const doble = React.useContext(Context);
      return doble ? { search: doble.search } : deVeres.useLocation();
    },
    Link: 'a'
  };
});
/* El doble pinta el títol com la UniversalPage de veres: l'H1 dins de la
   capçalera de pàgina (Regla de les Capçaleres, també als dobles). */
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: ({ title }) => <header className="page-title"><h1>{title}</h1></header>
}));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAssetState: () => ({ url: null, status: 'idle', isLoading: false })
}));

import { MemoryRouter, RouterTest, useLocation } from '../../app/contexts/RouterContext';
import WikiDePobleSection from './WikiDePobleSection.jsx';

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('entrada amb la portada triada, «Tot» ple, carpeta explícita i retorn a Tot mantenen els documents visibles', () => {
  render(<RouterTest><WikiDePobleSection /></RouterTest>);
  const list = () => document.querySelector('#app-grid-list');
  const nav = () => screen.getByRole('navigation', { name: 'WIKI DE POBLE' });
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wiki de Poble');
  // T26.2 · en entrar, la primera carpeta («Wiki de Poble») és la triada, com a
  // Disseny i al Xat, i la llista ensenya la portada; l'índex no és cap carpeta.
  expect(within(nav()).getByRole('button', { name: 'Wiki de Poble' }).getAttribute('aria-current')).toBe('page');
  expect(within(list()).getByRole('button', { name: /Wiki de Poble/ })).toBeTruthy();
  expect(within(list()).queryByRole('button', { name: /Identitat/ })).toBeNull();
  expect(within(nav()).queryByRole('button', { name: 'Índex' })).toBeNull();

  // «Tot» ensenya tots els documents i es guarda a la URL, com qualsevol carpeta.
  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  expect(screen.getByLabelText('URL').textContent).toBe('?categoria=__all__');
  expect(within(list()).getByRole('button', { name: /Identitat/ })).toBeTruthy();
  expect(within(list()).getByRole('button', { name: /Coneixement/ })).toBeTruthy();
  expect(within(list()).getByRole('button', { name: /Índex/ })).toBeTruthy();

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

/* La ruta de l'app segons el router de veres (camí i consulta). */
function RutaDeLApp() {
  const { pathname, search } = useLocation();
  return <output aria-label="Ruta">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

/* SPEC G · Wiki dins d'un amfitrió sense base: el router és en memòria. La
   Wiki navega amb '?…' i la consulta es resol sobre la ruta DE L'APP
   (politicaRouter.resolRuta): el document triat viu a /wikidepoble?item=…, i
   la URL i l'historial de l'amfitrió no es toquen mai. */
test('enxufe en memòria: triar un document deixa /wikidepoble?item=<id>, pinta eixe document i no toca la URL ni l’historial', () => {
  const pushState = vi.spyOn(window.history, 'pushState');
  const replaceState = vi.spyOn(window.history, 'replaceState');
  const urlAbans = window.location.href;
  const estatAbans = window.history.state;
  const llargariaAbans = window.history.length;

  render(<MemoryRouter rutaInicial="/wikidepoble"><WikiDePobleSection /><RutaDeLApp /></MemoryRouter>);
  const ruta = () => screen.getByLabelText('Ruta').textContent;
  const list = () => document.querySelector('#app-grid-list');
  const titol = () => screen.getByRole('heading', { level: 1 }).textContent;
  expect(ruta()).toBe('/wikidepoble');
  expect(titol()).toBe('Wiki de Poble');

  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  expect(ruta()).toBe('/wikidepoble?categoria=__all__');

  fireEvent.click(within(list()).getByRole('button', { name: /Coneixement/ }));
  expect(ruta()).toBe('/wikidepoble?item=coneixement');
  expect(titol()).toBe('Coneixement');

  // Un altre document substituïx la consulta; el camí de l'app no es mou.
  fireEvent.click(within(list()).getByRole('button', { name: /Identitat/ }));
  expect(ruta()).toBe('/wikidepoble?item=identitat');
  expect(titol()).toBe('Identitat');

  expect(pushState).not.toHaveBeenCalled();
  expect(replaceState).not.toHaveBeenCalled();
  expect(window.location.href).toBe(urlAbans);
  expect(window.history.state).toBe(estatAbans);
  expect(window.history.length).toBe(llargariaAbans);
});

/* Pla 261028_1526 (P1-61, Fase 2) · WikiDetail registra el seu <head> amb
   useSEO, que necessita UIProvider. Els contractes visuals d'esta suite són
   independents del head: el real té la seua suite (WikiDePobleSection.seo.test.jsx). */
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
