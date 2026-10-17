/* Gauntlet 261016 · diürn 1530 (Bloc 3.4; revisió adversarial del carril D,
   problema 2) · En producció, la carpeta «Maquinària de la IAIA» i la Consola
   incrustada només ixen per a qui és superadmin (maquinaria.js). El rol arriba
   tard: la sessió arrenca en 'comprovant' (sessionService.js) i el rol es
   consulta de manera asíncrona. Si en eixe interval la Wiki es donava per
   llesta, el workspace no trobava l'ítem, el marcava 'not-found', queia a la
   portada i reescrivia la URL sense ?item=: un superadmin que obria en fred
   /wikidepoble?categoria=maquinaria_cat&item=consola_termodinamica (recàrrega,
   enllaç compartit o adreça d'interés) perdia l'enllaç i ja no arribava mai a
   la Consola. Ara, mentre la sessió es comprova i la URL demana la
   Maquinària, la Wiki espera (estat 'loading'): ni reconcilia ni toca la URL.
   I a cada renovació del JWT, que torna a comprovar el rol del mateix compte,
   la Consola es queda on és (hooks/useSuperadminEstable.js).
   Es prova amb el UniversalWorkspace de veres (el de WikiDePobleSection
   .produccio.test.jsx és un doble i no reconcilia). */
import React from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, afterEach, beforeEach, expect, test, vi } from 'vitest';

const fixture = vi.hoisted(() => {
  vi.stubEnv('DEV', false);
  vi.stubEnv('PROD', true);
  return { sessio: null, inicial: '' };
});
vi.mock('../../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSessioOpcional: () => fixture.sessio,
}));
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:ser', label: 'SER' }],
    items: [{ id: 'identitat', title: 'Identitat', categoryId: 'folder:ser', tags: [], content: '# Identitat' }]
  }
}));
/* Dins de RouterTest mana el doble: la URL d'entrada és la de la fixture i
   s'hi escriu el que navega la Wiki, tal qual. */
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => {
  const deVeres = await importOriginal();
  const React = await import('react');
  const Context = React.createContext(null);
  return {
    ...deVeres,
    RouterTest: ({ children }) => {
      const [search, setSearch] = React.useState(fixture.inicial);
      return <Context.Provider value={{ search, navigate: setSearch }}>{children}<output aria-label="URL">{search}</output></Context.Provider>;
    },
    useNavigate: () => React.useContext(Context)?.navigate ?? deVeres.useNavigate(),
    useLocation: () => {
      const doble = React.useContext(Context);
      return doble ? { pathname: '/wikidepoble', search: doble.search } : deVeres.useLocation();
    },
    Link: 'a'
  };
});
/* El doble pinta el títol com la UniversalPage de veres (l'H1 dins de la
   capçalera) i el cos, perquè es veja si la Consola arriba. */
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: ({ title, children }) => <><header className="page-title"><h1>{title}</h1></header>{children}</>
}));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => <p>Doble de la Consola</p> }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAssetState: () => ({ url: null, status: 'idle', isLoading: false })
}));

import { RouterTest } from '../../app/contexts/RouterContext';
import WikiDePobleSection from './WikiDePobleSection.jsx';
import { PAGE_COPY } from '../text/pageContent';

const ENLLAC = '?categoria=maquinaria_cat&item=consola_termodinamica';
const JAVI = Object.freeze({ id: 'u-1' });
/* Els estats que publica SessionContext: en fred, 'comprovant' sense usuari i
   després amb l'usuari i el rol 'desconegut' (també 'comprovant'). */
const COMPROVANT = Object.freeze({ estat: 'comprovant', currentUser: null, rol: null, esSuperadmin: false });
const SUPERADMIN = Object.freeze({ estat: 'dins', currentUser: JAVI, rol: 'superadmin', esSuperadmin: true });
const RENOVANT = Object.freeze({ estat: 'comprovant', currentUser: JAVI, rol: 'desconegut', esSuperadmin: false });

const arbre = () => <RouterTest><WikiDePobleSection /></RouterTest>;
const url = () => screen.getByLabelText('URL').textContent;
const titol = () => document.querySelector('header.page-title h1')?.textContent ?? null;
/* Els efectes del workspace (sincronia i reconciliació) i el lazy de la Consola. */
const deixaCorrer = () => act(async () => { await new Promise((resolre) => setTimeout(resolre, 0)); });

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fixture.sessio = null;
  fixture.inicial = '';
});
afterAll(() => vi.unstubAllEnvs());

test('l’entorn de la prova és el de producció', () => {
  expect(import.meta.env.DEV).toBe(false);
});

test('un superadmin que obri en fred l’enllaç de la Consola hi arriba quan el rol es resol, i la URL no el perd', async () => {
  fixture.inicial = ENLLAC;
  fixture.sessio = COMPROVANT;
  const vista = render(arbre());
  await deixaCorrer();
  // Mentre es comprova la sessió, la Wiki espera: ni portada, ni Consola, ni URL reescrita.
  expect(url()).toBe(ENLLAC);
  expect(screen.queryByText('Doble de la Consola')).toBeNull();
  expect(titol()).toBeNull();
  expect(screen.getAllByRole('status').map((estat) => estat.textContent)).toContain('Carregant…');

  fixture.sessio = SUPERADMIN;
  vista.rerender(arbre());
  expect(await screen.findByText('Doble de la Consola')).toBeTruthy();
  expect(titol()).toBe(PAGE_COPY.consola.title);
  expect(new URLSearchParams(url()).get('item')).toBe('consola_termodinamica');
  // L'arbre ja porta la carpeta, i és la triada.
  const nav = screen.getByRole('navigation', { name: 'WIKI DE POBLE' });
  expect(within(nav).getByRole('button', { name: 'Maquinària de la IAIA' }).getAttribute('aria-current')).toBe('page');
});

test('en fred, amb l’usuari ja conegut i el rol encara en vol, també espera', async () => {
  fixture.inicial = ENLLAC;
  fixture.sessio = RENOVANT;
  const vista = render(arbre());
  await deixaCorrer();
  expect(url()).toBe(ENLLAC);
  expect(screen.queryByText('Doble de la Consola')).toBeNull();
  fixture.sessio = SUPERADMIN;
  vista.rerender(arbre());
  expect(await screen.findByText('Doble de la Consola')).toBeTruthy();
  expect(new URLSearchParams(url()).get('item')).toBe('consola_termodinamica');
});

test('la renovació del JWT d’un superadmin que és a la Consola: no desapareix, no torna a carregar i la URL es queda', async () => {
  fixture.inicial = ENLLAC;
  fixture.sessio = SUPERADMIN;
  const vista = render(arbre());
  const consola = await screen.findByText('Doble de la Consola');
  fixture.sessio = RENOVANT;
  vista.rerender(arbre());
  await deixaCorrer();
  // El mateix node: ni s'ha desmuntat ni ha passat per «Carregant…».
  expect(screen.getByText('Doble de la Consola')).toBe(consola);
  expect(screen.queryByText('Carregant…')).toBeNull();
  expect(new URLSearchParams(url()).get('item')).toBe('consola_termodinamica');
  fixture.sessio = SUPERADMIN;
  vista.rerender(arbre());
  await deixaCorrer();
  expect(screen.getByText('Doble de la Consola')).toBe(consola);
});

test('el mateix enllaç amb ?item= sol (sense carpeta) també espera el rol', async () => {
  fixture.inicial = '?item=consola_termodinamica';
  fixture.sessio = COMPROVANT;
  const vista = render(arbre());
  await deixaCorrer();
  expect(url()).toBe('?item=consola_termodinamica');
  fixture.sessio = SUPERADMIN;
  vista.rerender(arbre());
  expect(await screen.findByText('Doble de la Consola')).toBeTruthy();
  expect(new URLSearchParams(url()).get('item')).toBe('consola_termodinamica');
});

test.each([
  ['una sessió de veí', { estat: 'dins', rol: 'usuari', esSuperadmin: false }],
  ['sense sessió', { estat: 'fora', rol: null, esSuperadmin: false }]
])('quan el rol es resol i és %s, la portada com fins ara: la Consola no es pinta mai', async (_, resolta) => {
  fixture.inicial = ENLLAC;
  fixture.sessio = COMPROVANT;
  const vista = render(arbre());
  await deixaCorrer();
  fixture.sessio = resolta;
  vista.rerender(arbre());
  await waitFor(() => expect(titol()).toBe(PAGE_COPY.wikidepoble.title));
  await deixaCorrer();
  expect(screen.queryByText('Doble de la Consola')).toBeNull();
  expect(new URLSearchParams(url()).get('item')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Maquinària de la IAIA' })).toBeNull();
});

test('Llei del Píxel · mentre es comprova la sessió, una URL que no demana la Maquinària s’obri de seguida', async () => {
  fixture.inicial = '?item=identitat';
  fixture.sessio = COMPROVANT;
  render(arbre());
  expect(titol()).toBe('Identitat');
  await deixaCorrer();
  expect(url()).toBe('?item=identitat');
  expect(screen.queryByText('Carregant…')).toBeNull();
  cleanup();
  // I la portada, sense res a la URL.
  fixture.inicial = '';
  render(arbre());
  expect(titol()).toBe(PAGE_COPY.wikidepoble.title);
  expect(screen.queryByText('Carregant…')).toBeNull();
});

test('sense proveïdor de sessió (una peça muntada sola), ningú no espera ningú: la portada', async () => {
  fixture.inicial = ENLLAC;
  fixture.sessio = null;
  render(arbre());
  await deixaCorrer();
  expect(titol()).toBe(PAGE_COPY.wikidepoble.title);
  expect(screen.queryByText('Doble de la Consola')).toBeNull();
});
