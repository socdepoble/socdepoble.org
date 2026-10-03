/* T7C (P1) · El Snippet Curador de punta a punta, amb el router en memòria
   de veres (MemoryRouter), l'espai de treball de veres en mode compacte i la
   Pàgina Universal de veres: obrir /notes?mode=desa amb url i títol, triar una
   carpeta niada, categories i etiquetes, desar, i la URL que ho reflectix tot.
   Un enllaç copiat obri el mateix estat. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { RUTA_DESPRES_D_ENTRAR } from '../../config/rutaEntrada.js';

const dades = vi.hoisted(() => ({
  notes: [],
  noteFolders: [
    { id: 'f-mur', name: 'Mur' },
    { id: 'f-connectats', name: 'Safata d’Entrada' },
    { id: 'f-tic', name: 'TIC' },
    { id: 'f-foto', name: 'Foto', parentId: 'f-tic' },
    { id: 'f-antigravity', name: 'Antigravity', parentId: 'f-foto' },
    { id: 'f-notes', name: 'Notes' }
  ],
  usuari: { id: 'usuari-sintetic' },
  config: { dataMode: 'seed' },
  creades: [],
  toast: () => {},
  noop: () => {},
  buit: []
}));

const NOTES_INICIALS = Object.freeze([
  Object.freeze({ id: 'n1', title: 'Primera', folderId: 'f-mur', categories: ['Sistema'], tags: ['Reg'], updatedAt: '2026-01-03T09:00:00Z' }),
  Object.freeze({ id: 'r1', title: 'Retrat', folderId: 'f-foto', updatedAt: '2026-01-02T09:00:00Z' })
]);

/* creaNota de prova: la nota nova entra a la llista, com fa NotesDataContext. */
const creaNota = vi.hoisted(() => async (entrada) => {
  dades.creades.push(entrada);
  dades.notes = [{ id: 'nova', title: entrada.title, folderId: entrada.folderId, updatedAt: '2026-01-04T09:00:00Z' }, ...dades.notes];
  return { id: 'nova' };
});

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.noteFolders, status: 'ready', canCreate: true, notesComplete: true,
    config: dades.config, obriConfiguracioNotes: dades.noop, creaNota
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: dades.config }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: dades.usuari }) }));
/* SN · La tria de destinació pregunta a la plataforma si el Lector és
   disponible (useDestinacioEnllac), i la plataforma llig la configuració de
   l'amfitrió de UIContext: ací, cap amfitrió. Amb el registre del document
   i en desenvolupament, el Lector hi és: estes proves del Bloc passen AMB la
   tria a la pàgina, i el Bloc continua sent el de per defecte. */
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...await importOriginal(),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: dades.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('./NotesDetail.jsx', () => ({ default: ({ activeNote }) => <p data-testid="detall">{activeNote?.id ?? 'cap'}</p> }));
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

const URL_PROVA = 'https://exemple.org/article';
const DESA = `/notes?mode=desa&url=${encodeURIComponent(URL_PROVA)}&titol=Un+article`;

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  dades.notes = [...NOTES_INICIALS];
  dades.usuari = { id: 'usuari-sintetic' };
  dades.config = { dataMode: 'seed' };
  dades.creades = [];
  dades.toast = vi.fn();
});
afterEach(() => cleanup());

/* La URL de l'entrada actual del router, un Arrere i un Avant. */
function Sonda() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>Arrere de prova</button>
      <button type="button" onClick={() => navigate(1)}>Avant de prova</button>
    </>
  );
}

/* L'aterratge d'una entrada correcta, com OnboardingSection: sempre a la
   pròpia identitat, amb replace (ordre del Mestre, 261002). */
function EntradaDeProva() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(RUTA_DESPRES_D_ENTRAR, { replace: true })}>Entra (prova)</button>;
}

const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
    <Sonda />
  </MemoryRouter>
);
const url = () => screen.getByTestId('url').textContent;
const consulta = () => new URLSearchParams(url().split('?')[1] || '');
const railCarpetes = () => screen.getByRole('navigation', { name: 'CARPETES' });
const carpetaActiva = () => within(railCarpetes()).getAllByRole('button')
  .map((boto) => [boto.getAttribute('aria-label'), boto.getAttribute('aria-current')])
  .filter(([, actual]) => actual);
const botonera = () => screen.getByRole('group', { name: 'Classificació del document' });
const pindola = (grup) => within(botonera()).getByRole('button', { name: new RegExp(`^${grup}`) });
const dialeg = (nom) => screen.getByRole('dialog', { name: nom });

describe('obrir el snippet', () => {
  test('/notes?mode=desa amb url i títol: el Workspace compacte amb el snippet, i la URL no canvia', () => {
    const { container } = munta(DESA);
    expect(container.querySelector('.app-grid-page.sdp-workspace--compacte.sdp-bloc')).not.toBeNull();
    expect(container.querySelector('.app-grid-content.has-left-collapsed.has-middle-collapsed')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    /* La previsualització: la UniversalCard del contingut de fora. */
    const objecte = container.querySelector('.sdp-connectar__previsualitzacio .sp-card');
    expect(objecte.textContent).toContain('Un article');
    expect(screen.getByText('De exemple.org')).toBeTruthy();
    expect(screen.getByText(URL_PROVA)).toBeTruthy();
    /* On arriba per defecte: la Safata d’Entrada, al rail i a la botonera. */
    expect(carpetaActiva()).toEqual([['Safata d’Entrada', 'page']]);
    expect(pindola('Carpetes').getAttribute('aria-label')).toBe('Carpetes: Safata d’Entrada');
    expect(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' })).toBeTruthy();
    /* Cap nota oberta, cap «Tot», cap «CREAR NOTA»; la URL tal com ha entrat. */
    expect(screen.queryByTestId('detall')).toBeNull();
    expect(screen.queryByRole('button', { name: 'CREAR NOTA' })).toBeNull();
    expect(url()).toBe(DESA);
  });

  test('sense cap adreça, el snippet ho diu i no hi ha botó de desar', () => {
    munta('/notes?mode=desa');
    expect(screen.getByText('No ha arribat cap enllaç per a desar.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Desar a/ })).toBeNull();
    expect(url()).toBe('/notes?mode=desa');
  });

  test('una adreça que no és web no es desa i se’n diu el motiu', () => {
    munta('/notes?mode=desa&url=javascript%3Aalert(1)&titol=X');
    expect(screen.getByText('Este enllaç no es pot desar.')).toBeTruthy();
    expect(screen.getByText(/Només es poden connectar adreces web/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Desar a/ })).toBeNull();
  });

  test('sense url, la primera adreça del paràmetre text (Web Share Target)', () => {
    munta(`/notes?mode=desa&text=${encodeURIComponent(`Mira açò ${URL_PROVA}.`)}`);
    expect(screen.getByText(URL_PROVA)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' })).toBeTruthy();
  });
});

describe('triar: la URL reflectix l’estat', () => {
  test('una carpeta niada al DialegCarpeta, categories, etiquetes i emoticona', () => {
    munta(DESA);

    fireEvent.click(pindola('Carpetes'));
    const carpetes = dialeg('Carpeta del document');
    fireEvent.click(within(carpetes).getByRole('radio', { name: 'TIC › Foto › Antigravity' }));
    fireEvent.click(within(carpetes).getByRole('button', { name: 'Desar' }));
    expect(consulta().get('carpeta')).toBe('f-antigravity');
    expect(pindola('Carpetes').getAttribute('aria-label')).toBe('Carpetes: Antigravity');
    /* Al rail plegat, l'arrel que conté la carpeta triada. */
    expect(carpetaActiva()).toEqual([['TIC', 'true']]);

    fireEvent.click(pindola('Categories'));
    const categories = dialeg('Categories de l’enllaç');
    fireEvent.click(within(categories).getByRole('checkbox', { name: 'Sistema' }));
    fireEvent.click(within(categories).getByRole('button', { name: 'Desar' }));
    expect(consulta().getAll('categoria')).toEqual(['Sistema']);
    expect(pindola('Categories').getAttribute('aria-label')).toBe('Categories: Sistema');

    fireEvent.click(pindola('Etiquetes'));
    const etiquetes = dialeg('Etiquetes de l’enllaç');
    fireEvent.change(within(etiquetes).getByRole('textbox', { name: /Nova etiqueta/ }), { target: { value: 'Hort' } });
    fireEvent.click(within(etiquetes).getByRole('button', { name: 'Afegir' }));
    fireEvent.click(within(etiquetes).getByRole('checkbox', { name: 'Reg' }));
    fireEvent.click(within(etiquetes).getByRole('button', { name: 'Desar' }));
    expect(consulta().getAll('etiqueta')).toEqual(['Hort', 'Reg']);

    fireEvent.click(pindola('Emoticona'));
    const emoticona = dialeg('Emoticona del document');
    fireEvent.change(within(emoticona).getByRole('textbox', { name: /Emoticona/ }), { target: { value: '🍅' } });
    fireEvent.click(within(emoticona).getByRole('button', { name: 'Desar' }));
    expect(consulta().get('emoticona')).toBe('🍅');

    /* El contingut de fora es conserva; cap diàleg queda obert. */
    expect(consulta().get('mode')).toBe('desa');
    expect(consulta().get('url')).toBe(URL_PROVA);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Desar a «Antigravity»' })).toBeTruthy();
  });

  /* Correcció T7C-R2 · El que hi ha hui, dit tal com és: DialegValors no té
     cap opció per a no pintar el llapis i la paperera d'un valor propi, i el
     snippet els deixa desactivats per sempre, que és la forma de «control
     desactivat sense funció» que P8 mana llevar. Pendent fora del T7C
     (classificació): quan DialegValors tinga l'opció, el snippet la passarà
     i esta prova esperarà que els dos botons no hi siguen. */
  test('el catàleg no es reanomena ni s’esborra des del snippet: el llapis i la paperera encara es pinten, desactivats (P8 pendent)', () => {
    munta(DESA);
    fireEvent.click(pindola('Etiquetes'));
    const etiquetes = dialeg('Etiquetes de l’enllaç');
    expect(within(etiquetes).getByRole('button', { name: 'Reanomenar «Reg»' }).disabled).toBe(true);
    expect(within(etiquetes).getByRole('button', { name: 'Esborrar «Reg»' }).disabled).toBe(true);
    expect(within(etiquetes).getByText(/es fan des d’una nota del Bloc/)).toBeTruthy();
  });

  test('una carpeta triada al rail és on arriba: replace, sense obrir cap nota', () => {
    munta(DESA);
    fireEvent.click(within(railCarpetes()).getByRole('button', { name: 'Mur' }));
    expect(consulta().get('carpeta')).toBe('f-mur');
    expect(carpetaActiva()).toEqual([['Mur', 'page']]);
    expect(pindola('Carpetes').getAttribute('aria-label')).toBe('Carpetes: Mur');
    expect(screen.queryByTestId('detall')).toBeNull();
    /* Una sola entrada d'historial: Arrere no torna al snippet sense carpeta. */
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
    expect(consulta().get('carpeta')).toBe('f-mur');
  });

  test('una nota del rail de la llista ix del snippet amb push; Arrere hi torna amb tota la tria', () => {
    const ruta = `${DESA}&carpeta=f-mur&categoria=Sistema`;
    munta(ruta);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'NOTES' })).getByRole('button', { name: 'Primera' }));
    expect(url()).toBe('/notes?carpeta=f-mur&nota=n1');
    expect(screen.getByTestId('detall').textContent).toBe('n1');
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
    expect(url()).toBe(ruta);
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    expect(pindola('Categories').getAttribute('aria-label')).toBe('Categories: Sistema');
    expect(carpetaActiva()).toEqual([['Mur', 'page']]);
  });

  test('una carpeta que no és del Bloc no compta: arriba a la Safata d’Entrada', () => {
    munta(`${DESA}&carpeta=f-inventada`);
    expect(carpetaActiva()).toEqual([['Safata d’Entrada', 'page']]);
    expect(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' })).toBeTruthy();
  });
});

describe('desar', () => {
  test('crea la nota amb notaDeContingutExtern i la carpeta triada, i la URL passa a la nota', async () => {
    munta(`${DESA}&carpeta=f-antigravity&categoria=Sistema&etiqueta=Hort&emoticona=${encodeURIComponent('🍅')}`);
    fireEvent.click(screen.getByRole('button', { name: 'Desar a «Antigravity»' }));
    await waitFor(() => expect(url()).toBe('/notes?carpeta=f-antigravity&nota=nova'));
    expect(dades.creades).toHaveLength(1);
    expect(dades.creades[0]).toMatchObject({
      title: 'Un article',
      folderId: 'f-antigravity',
      categories: ['Sistema'],
      tags: ['Hort'],
      icon: '🍅',
      origen: { tipus: 'extern', url: URL_PROVA, titol: 'Un article' }
    });
    expect(dades.creades[0].content).toContain(`href="${URL_PROVA}"`);
    expect(dades.toast).toHaveBeenCalledWith('Desat a «Antigravity». És una nota teua: la pots editar.', 'success');
    /* El Bloc de sempre, amb la nota nova oberta a la seua carpeta. */
    expect(screen.getByTestId('detall').textContent).toBe('nova');
    expect(screen.queryByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeNull();
    /* replace: Arrere no torna al snippet ja desat (no hi ha res abans). */
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
    expect(url()).toBe('/notes?carpeta=f-antigravity&nota=nova');
  });

  /* Correcció T7C-R1 · El que passa de veres: el ?tornar es construïx, però
     cap porta l'obeïx (rutaEntrada.js, ordre del Mestre 261002). «Entra per
     a desar» porta a /registre amb push; l'entrada aterra al perfil amb
     replace; el snippet queda just abans a l'historial i només Arrere hi
     torna, amb tota la tria. L'avís ho diu abans d'entrar. */
  test('sense sessió en remot: avisa on s’aterra; l’entrada porta al perfil i Arrere torna al snippet amb la tria', () => {
    dades.usuari = null;
    dades.config = { dataMode: 'remote' };
    const ruta = `${DESA}&carpeta=f-tic&categoria=Sistema`;
    render(
      <MemoryRouter rutaInicial={ruta}>
        <Routes>
          <Route path="/notes" element={<NotesSection />} />
          <Route path="/registre" element={<EntradaDeProva />} />
          <Route path={RUTA_DESPRES_D_ENTRAR} element={<p>Perfil de prova</p>} />
        </Routes>
        <Sonda />
      </MemoryRouter>
    );
    expect(screen.getByText('Per a desar cal entrar al teu compte. Després d’entrar aniràs al teu perfil: per a desar este enllaç, torna arrere o obri’l de nou.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Entra per a desar' }));
    const desti = new URL(url(), 'http://sdp.test');
    expect([desti.pathname, desti.searchParams.get('mode'), desti.searchParams.get('tornar')]).toEqual(['/registre', 'entrar', ruta]);

    /* L'entrada no torna al snippet: aterra al perfil. */
    fireEvent.click(screen.getByRole('button', { name: 'Entra (prova)' }));
    expect(url()).toBe(RUTA_DESPRES_D_ENTRAR);
    expect(screen.queryByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeNull();

    /* Arrere: el snippet, amb la carpeta i la categoria de la URL. */
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
    expect(url()).toBe(ruta);
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    expect(pindola('Carpetes').getAttribute('aria-label')).toBe('Carpetes: TIC');
    expect(pindola('Categories').getAttribute('aria-label')).toBe('Categories: Sistema');
    expect(dades.creades).toEqual([]);
  });

  test('sense sessió en seed es desa al dispositiu, i es diu', async () => {
    dades.usuari = null;
    munta(DESA);
    expect(screen.getByText('Sense sessió, l’enllaç es queda només en este dispositiu.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' }));
    await waitFor(() => expect(url()).toBe('/notes?carpeta=f-connectats&nota=nova'));
    expect(dades.creades[0].folderId).toBe('f-connectats');
  });
});

describe('Clàusula dels Slugs', () => {
  test('un enllaç copiat obri el mateix estat, i no es reescriu', () => {
    munta(DESA);
    fireEvent.click(within(railCarpetes()).getByRole('button', { name: 'TIC' }));
    fireEvent.click(pindola('Categories'));
    fireEvent.click(within(dialeg('Categories de l’enllaç')).getByRole('checkbox', { name: 'Sistema' }));
    fireEvent.click(within(dialeg('Categories de l’enllaç')).getByRole('button', { name: 'Desar' }));
    const copiada = url();
    expect(consulta().get('carpeta')).toBe('f-tic');
    cleanup();

    munta(copiada);
    expect(url()).toBe(copiada);
    expect(carpetaActiva()).toEqual([['TIC', 'page']]);
    expect(pindola('Carpetes').getAttribute('aria-label')).toBe('Carpetes: TIC');
    expect(pindola('Categories').getAttribute('aria-label')).toBe('Categories: Sistema');
    expect(screen.getByRole('button', { name: 'Desar a «TIC»' })).toBeTruthy();
  });
});
