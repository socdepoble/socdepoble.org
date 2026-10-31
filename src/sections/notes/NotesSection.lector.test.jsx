/* SN (ordre del Mestre, 261003) · El Snippet Curador tria la destinació de
   l'enllaç: el Bloc de notes (per defecte, el d'abans) o el Lector de
   notícies. De punta a punta, amb el router en memòria de veres, el Workspace
   compacte de veres, la plataforma de veres (UIProvider, ProveidorPlataforma,
   RutaApps) i el Lector de veres sobre el navegador fals de P2: la font
   s'afig des del snippet i apareix a la gestió de fonts del Lector. Dades
   sintètiques; adreces d'exemple.
   Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, la
   gestió de fonts ja no és cap pàgina (/app/lector/fonts/colleccio): el snippet
   porta a la font nova, a l'arbre de les notícies, i el seu detall diu que és
   pendent. I els contextos simulats porten també les dues lectures opcionals
   que la plataforma fa servir des de T47 (useSessioOpcional, useIdentitatOpcional:
   fontSessio.js), amb la mateixa persona sintètica. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext.jsx';

const dades = vi.hoisted(() => ({
  notes: [],
  noteFolders: [
    { id: 'f-mur', name: 'Mur' },
    { id: 'f-connectats', name: 'Safata d’Entrada' },
    { id: 'f-tic', name: 'TIC' }
  ],
  usuari: { id: 'usuari-sintetic' },
  config: { dataMode: 'seed' },
  creades: [],
  toast: () => {},
  noop: () => {},
  buit: []
}));

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
vi.mock('../../app/contexts/IdentitatContext.jsx', () => {
  const identitat = () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] });
  return { useIdentitat: identitat, useIdentitatOpcional: identitat, ROLS_QUE_SIGNEN: Object.freeze(['owner', 'admin']) };
});
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: dades.usuari }),
  useSessioOpcional: () => ({ currentUser: dades.usuari })
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
import { bookmarkletDesa } from './modeDesa.js';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
import RutaApps from '../../apps/plataforma/RutaApps.jsx';
import { creaRegistre } from '../../apps/plataforma/registreApps.js';
import { ENTORN_OBERT, preparaNavegador } from '../../apps/plataforma/__fixtures__/munta.jsx';
import AppLector from '../../apps/lector/AppLector.jsx';
import manifestLector from '../../apps/lector/manifest.js';
import { creaFontNoticies } from '../../apps/lector/fontNoticies.js';
import { creaFontsPersonals, destinacioDe } from '../../apps/lector/fontsPersonals.js';
import { idFontPersonal } from '../../apps/lector/nucli/index.js';
import { creaAdaptadorLlavor } from '../../apps/lector/llavor/fontLlavor.js';
import { creaMagatzemLector } from '../../apps/lector/magatzem.js';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';

const URL_PROVA = 'https://www.exemple.org/article';
const DESA = `/notes?mode=desa&url=${encodeURIComponent(URL_PROVA)}&titol=Un+article`;
const LECTOR = `${DESA}&desti=lector`;
const ARA = Date.UTC(2026, 9, 3, 10, 30);
/* Un node en desenvolupament: el Lector hi és encés. En producció, apagat (entorn). */
const DESENVOLUPAMENT = Object.freeze({ ...ENTORN_OBERT, produccio: false });

/* Els magatzems oberts, per a tancar-los després de cada prova. */
const oberts = [];

/* El Lector de veres sobre un navegador fals: la seua API (la del snippet), el
   registre amb el manifest (la destinació ix del mòdul de `carrega`, com en
   producció) i l'app, que llig el mateix magatzem. `ambDestinacio: false`:
   el mòdul exporta `destinacioEnllac = null`, com AppLector en producció
   sense port. `fallaCarrega`: el mòdul no arriba. `senseDisc`: el navegador
   no deixa obrir IndexedDB (navegació privada). `discLent`: l'app no acaba
   de llegir el seu magatzem fins que la prova crida `obriDisc()` (una màquina
   carregada: «Obrint el lector…» dura el que la prova vol). */
function lectorDeProva({ ambDestinacio = true, fallaCarrega = false, senseDisc = false, discLent = false } = {}) {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const obri = () => {
    const magatzem = creaMagatzemLector({ idb: senseDisc ? null : idb.idb, navegador: { locks }, Canal: canal.Canal });
    oberts.push(magatzem);
    return magatzem;
  };
  const font = creaFontNoticies(creaAdaptadorLlavor({ ara: ARA }));
  const api = creaFontsPersonals({ obriMagatzem: obri, font: () => font });
  let obriDisc = () => {};
  const disc = new Promise((resol) => { obriDisc = resol; });
  function App() {
    const [magatzem] = React.useState(() => {
      const delDisc = obri();
      /* El magatzem és congelat: el lent n'hereta tot i només retarda `llegix`. */
      return discLent ? Object.create(delDisc, { llegix: { value: () => disc.then(() => delDisc.llegix()) } }) : delDisc;
    });
    return <AppLector magatzem={magatzem} font={font} ara={() => ARA} />;
  }
  const modul = { default: App, destinacioEnllac: ambDestinacio ? destinacioDe(api) : null };
  const carrega = vi.fn(() => (fallaCarrega ? Promise.reject(new Error('El paquet no ha arribat.')) : Promise.resolve(modul)));
  const registre = creaRegistre({ internes: [{ ...manifestLector, carrega }] });
  return { api, registre, carrega, obriDisc };
}

/* Espera que el mòdul del Lector s'haja resolt (bé o malament) i que React ho haja pintat. */
async function modulResolt(carrega) {
  await waitFor(() => expect(carrega).toHaveBeenCalled());
  await act(async () => {
    await carrega.mock.results[0].value.catch(() => null);
  });
}

/* La URL de l'entrada actual del router i un Arrere. */
function Sonda() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>Arrere de prova</button>
    </>
  );
}

function munta(ruta, { lector = lectorDeProva(), entorn = DESENVOLUPAMENT } = {}) {
  preparaNavegador();
  render(
    <UIProvider externalConfig={{}}>
      <MemoryRouter rutaInicial={ruta}>
        <ProveidorPlataforma registre={lector.registre} entorn={entorn}>
          <Routes>
            <Route path="/notes" element={<NotesSection />} />
            <Route path="/app/*" element={<RutaApps />} />
          </Routes>
          <Sonda />
        </ProveidorPlataforma>
      </MemoryRouter>
    </UIProvider>
  );
  return lector;
}

const url = () => screen.getByTestId('url').textContent;
const consulta = () => new URLSearchParams(url().split('?')[1] || '');
const tria = () => screen.getByRole('group', { name: 'Per a què és este enllaç?' });
const senseTria = () => screen.queryByRole('group', { name: 'Per a què és este enllaç?' });
/* La tria apareix quan la destinació del Lector s'ha resolt (correcció SN-R1). */
const triaLlesta = () => screen.findByRole('group', { name: 'Per a què és este enllaç?' });
const opcio = (nom) => within(tria()).getByRole('radio', { name: nom });
const nomFont = () => screen.findByRole('textbox', { name: /^Nom de la font/ });
const categoria = () => screen.getByRole('combobox', { name: /^Categoria al Lector/ });
/* L'arbre obert del Lector (CARPETES a #app-grid-sidebar, no el rail). L'app
   llig el seu magatzem en muntar («Obrint el lector…»): l'arbre arriba quan
   l'app l'ha llegit, no quan la prova ha llegit el seu (dos magatzems, dues
   cadenes asíncrones). */
const arbreDelLector = async () => within(await waitFor(() => {
  const nav = document.querySelector('#app-grid-sidebar nav.sdp-workspace-column__body');
  expect(nav).not.toBeNull();
  return nav;
}));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  dades.notes = [];
  dades.usuari = { id: 'usuari-sintetic' };
  dades.config = { dataMode: 'seed' };
  dades.creades = [];
  dades.toast = vi.fn();
});

afterEach(() => {
  cleanup();
  while (oberts.length) oberts.pop().tanca();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('la tria es pinta', () => {
  test('dues targetes, «Bloc de notes» per defecte: davall, el snippet d’abans', async () => {
    munta(DESA);
    /* Mentre el mòdul del Lector arriba, el snippet d'abans: cap tria encara. */
    expect(senseTria()).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    await triaLlesta();
    expect(screen.getByRole('heading', { level: 3, name: 'Destinació' })).toBeTruthy();
    expect(opcio('Bloc de notes').checked).toBe(true);
    expect(opcio('Lector de notícies').checked).toBe(false);
    expect(within(tria()).getByText('Una font de notícies (RSS) per a seguir-la al Lector.')).toBeTruthy();
    /* El Bloc, com abans: títol, classificació, botó i nota. */
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Classificació del document' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: /^Nom de la font/ })).toBeNull();
    expect(url()).toBe(DESA);
  });

  test('triar el Lector: replace a la URL, el panell amb el nom proposat i les categories del poble; cap classificació del Bloc', async () => {
    munta(DESA);
    await triaLlesta();
    fireEvent.click(opcio('Lector de notícies'));
    expect(consulta().get('desti')).toBe('lector');
    expect(consulta().get('url')).toBe(URL_PROVA);
    expect(screen.getByRole('heading', { level: 1, name: 'Afegir al Lector' })).toBeTruthy();
    expect(screen.getByText(/L’app no baixa res per ella mateixa: la font queda pendent del connector/)).toBeTruthy();
    expect((await nomFont()).value).toBe('Un article');
    expect(within(categoria()).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Sense categoria', 'Ajuntament i serveis', 'Cultura i festes', 'Camp i temps', 'Esports'
    ]);
    expect(categoria().value).toBe('');
    expect(screen.queryByRole('group', { name: 'Classificació del document' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Afegir al Lector' }).disabled).toBe(false);
    expect(screen.getByText('Arriba al Lector com una font teua, només en este dispositiu.')).toBeTruthy();
    /* Una sola entrada d'historial: Arrere no torna al snippet sense la tria. */
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
    expect(consulta().get('desti')).toBe('lector');
  });

  test('sense títol, el nom proposat és el domini sense «www.»', async () => {
    munta(`/notes?mode=desa&url=${encodeURIComponent(URL_PROVA)}&desti=lector`);
    expect((await nomFont()).value).toBe('exemple.org');
  });

  test('sense Lector disponible (producció: l’app és de desenvolupament), cap tria ni cap càrrega; un ?desti=lector és el Bloc', () => {
    const { carrega } = munta(LECTOR, { entorn: ENTORN_OBERT });
    expect(senseTria()).toBeNull();
    expect(screen.queryByRole('heading', { level: 3, name: 'Destinació' })).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' })).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
  });

  test('correcció SN-R1 · el Lector encés sense port (el mòdul exporta destinacioEnllac = null): cap tria, el Bloc d’abans', async () => {
    const { carrega } = munta(DESA, { lector: lectorDeProva({ ambDestinacio: false }) });
    await modulResolt(carrega);
    expect(senseTria()).toBeNull();
    expect(screen.queryByRole('heading', { level: 3, name: 'Destinació' })).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' }).disabled).toBe(false);
    expect(screen.queryByText(/No s’ha pogut obrir el Lector/)).toBeNull();
  });

  test('correcció SN-R1 · sense port i amb un ?desti=lector a la URL: el Bloc d’abans, sense cap error ni botó mort', async () => {
    const { carrega } = munta(LECTOR, { lector: lectorDeProva({ ambDestinacio: false }) });
    await modulResolt(carrega);
    expect(senseTria()).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Classificació del document' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Afegir al Lector' })).toBeNull();
    expect(screen.queryByText(/No s’ha pogut obrir el Lector/)).toBeNull();
  });

  test('el mòdul del Lector no arriba (xarxa): al Bloc, cap tria; amb ?desti=lector, l’error de pas, i el Bloc a l’abast', async () => {
    const alBloc = munta(DESA, { lector: lectorDeProva({ fallaCarrega: true }) });
    await modulResolt(alBloc.carrega);
    expect(senseTria()).toBeNull();
    cleanup();
    munta(LECTOR, { lector: lectorDeProva({ fallaCarrega: true }) });
    expect(await screen.findByText('No s’ha pogut obrir el Lector ara mateix. Pots desar l’enllaç al Bloc de notes o tornar-ho a provar més tard.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Afegir al Lector' }).disabled).toBe(true);
    fireEvent.click(opcio('Bloc de notes'));
    expect(consulta().has('desti')).toBe(false);
    expect(senseTria()).toBeNull();
    expect(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' }).disabled).toBe(false);
  });
});

describe('afegir al Lector', () => {
  test('una adreça vàlida es desa com a font personal pendent i apareix a l’arbre del Lector, triada', async () => {
    const { api } = munta(LECTOR);
    const desti = `/app/lector/noticies/festes/${idFontPersonal(URL_PROVA)}`;
    fireEvent.change(await nomFont(), { target: { value: 'La Veu del Barri' } });
    fireEvent.change(categoria(), { target: { value: 'festes' } });
    expect(consulta().get('categoria-font')).toBe('festes');
    fireEvent.click(screen.getByRole('button', { name: 'Afegir al Lector' }));
    await waitFor(() => expect(url()).toBe(desti));
    expect(dades.toast).toHaveBeenCalledWith('Afegida al Lector: «La Veu del Barri». Queda pendent del connector.', 'success');
    expect(await api.llistaFontsPersonals()).toEqual([
      expect.objectContaining({ url: URL_PROVA, nom: 'La Veu del Barri', categoriaId: 'festes' })
    ]);
    /* Cap nota al Bloc. */
    expect(dades.creades).toEqual([]);
    /* El Lector, a l'arbre: la font, triada dins de la seua carpeta i pendent, amb el seu detall. */
    const arbre = await arbreDelLector();
    const fila = await arbre.findByRole('button', { name: 'La Veu del Barri · pendent' });
    expect(fila.getAttribute('aria-current')).toBe('page');
    expect(await screen.findByRole('region', { name: 'La Veu del Barri' })).toBeTruthy();
    expect(screen.getByText('Esta font encara no es llig')).toBeTruthy();
    expect(screen.getByText(/^Queda guardada en este dispositiu\./)).toBeTruthy();
    /* La gestió de fonts de l'arbre la porta amb el domini i la carpeta. */
    fireEvent.click(screen.getByRole('button', { name: 'Gestiona les fonts' }));
    const llista = within(await screen.findByRole('dialog', { name: 'Gestiona les fonts' })).getByRole('list', { name: 'Les teues fonts' });
    expect(within(llista).getByText('La Veu del Barri')).toBeTruthy();
    expect(within(llista).getByText('Pendent · exemple.org · Cultura i festes')).toBeTruthy();
    /* replace: Arrere no torna al snippet ja consumit. */
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
    expect(url()).toBe(desti);
  });

  test('el Lector llig el seu disc tard (màquina carregada): «Obrint el lector…» i, quan l’ha llegit, l’arbre amb la font triada', async () => {
    const lector = munta(LECTOR, { lector: lectorDeProva({ discLent: true }) });
    fireEvent.change(await nomFont(), { target: { value: 'La Veu del Barri' } });
    fireEvent.change(categoria(), { target: { value: 'festes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Afegir al Lector' }));
    await waitFor(() => expect(url()).toBe(`/app/lector/noticies/festes/${idFontPersonal(URL_PROVA)}`));
    expect(await screen.findByText('Obrint el lector…')).toBeTruthy();
    expect(document.querySelector('#app-grid-sidebar')).toBeNull();
    lector.obriDisc();
    const fila = await (await arbreDelLector()).findByRole('button', { name: 'La Veu del Barri · pendent' });
    expect(fila.getAttribute('aria-current')).toBe('page');
    expect(screen.queryByText('Obrint el lector…')).toBeNull();
  });

  test('sense nom: l’error al camp, amb el focus (correcció SN-R7), i res desat', async () => {
    const { api } = munta(LECTOR);
    fireEvent.change(await nomFont(), { target: { value: '   ' } });
    const boto = screen.getByRole('button', { name: 'Afegir al Lector' });
    boto.focus();
    fireEvent.click(boto);
    expect(await screen.findByText('Cal un nom per a la font.')).toBeTruthy();
    expect((await nomFont()).getAttribute('aria-invalid')).toBe('true');
    /* El focus va al control que porta l'error: es llegix amb el lector de pantalla. */
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /^Nom de la font/ })));
    expect(await api.llistaFontsPersonals()).toEqual([]);
    expect(url()).toBe(LECTOR);
    /* En tornar a escriure, l'error se'n va. */
    fireEvent.change(await nomFont(), { target: { value: 'La Veu' } });
    expect(screen.queryByText('Cal un nom per a la font.')).toBeNull();
  });

  test('una font que ja hi és: el motiu del Lector al peu, i la URL no canvia', async () => {
    const lector = lectorDeProva();
    await lector.api.afigFontPersonal({ url: URL_PROVA, nom: 'Ja hi era' });
    munta(LECTOR, { lector });
    await nomFont();
    fireEvent.click(screen.getByRole('button', { name: 'Afegir al Lector' }));
    expect(await screen.findByText('Esta font ja és al teu Lector.')).toBeTruthy();
    expect(screen.getByText('L’enllaç no s’ha afegit')).toBeTruthy();
    expect((await lector.api.llistaFontsPersonals()).map((f) => f.nom)).toEqual(['Ja hi era']);
    expect(url()).toBe(LECTOR);
  });

  test('una adreça que no és web (o un esquema no permés): error clar i cap botó', () => {
    munta('/notes?mode=desa&desti=lector&url=javascript%3Aalert(1)&titol=X');
    expect(screen.getByText('Este enllaç no es pot afegir.')).toBeTruthy();
    expect(screen.getByText(/Només es poden connectar adreces web \(http o https\)/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Afegir al Lector' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: /^Nom de la font/ })).toBeNull();
  });

  test('una categoria de la URL que no és del poble no compta', async () => {
    munta(`${LECTOR}&categoria-font=inventada`);
    await nomFont();
    expect(categoria().value).toBe('');
  });

  test('sense sessió en remot: el Bloc demana entrar, el Lector no (viu en este dispositiu)', async () => {
    dades.usuari = null;
    dades.config = { dataMode: 'remote' };
    munta(DESA);
    expect(screen.getByRole('button', { name: 'Entra per a desar' })).toBeTruthy();
    await triaLlesta();
    fireEvent.click(opcio('Lector de notícies'));
    await nomFont();
    expect(screen.getByText('Sense sessió, l’enllaç es queda només en este dispositiu.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Afegir al Lector' }).disabled).toBe(false);
  });

  test('correcció SN-R2 · el navegador no deixa guardar (navegació privada): el motiu al peu, cap «afegida» i la URL no canvia', async () => {
    const { api } = munta(LECTOR, { lector: lectorDeProva({ senseDisc: true }) });
    await nomFont();
    fireEvent.click(screen.getByRole('button', { name: 'Afegir al Lector' }));
    expect(await screen.findByText(/^Este navegador no deixa guardar dades en este dispositiu/)).toBeTruthy();
    expect(screen.getByText('L’enllaç no s’ha afegit')).toBeTruthy();
    expect(dades.toast).not.toHaveBeenCalled();
    expect(url()).toBe(LECTOR);
    expect(await api.llistaFontsPersonals()).toEqual([]);
  });
});

/* Ordre del Mestre, 261016 (prompt 261016_0015, Bloc 0: «L'usuari ha de poder capturar contingut i
   decidir fàcilment si el destí és el Bloc de notes o el Lector RSS») · El bookmarklet amb
   `desti: 'lector'` (modeDesa.js) obri el snippet amb el Lector ja triat; sense desti, el Bloc de
   sempre; i sense Lector disponible, el Curador continua decidint: el Bloc (correcció SN-R1). */
describe('el bookmarklet amb la destinació', () => {
  /* La finestra que obri el bookmarklet, executat com ho faria el navegador en una web de fora.
     E1 del Gauntlet (261016) · Actualitzada a posta: el bookmarklet llig els meta d'OpenGraph amb
     document.querySelector, i la pàgina de fora és un document de veres (jsdom) amb el seu títol
     i el seu og:title i og:description, no un objecte amb només `title`. */
  function rutaDelBookmarklet(opcions) {
    const codi = bookmarkletDesa('https://poble.exemple.test', opcions);
    const pagina = document.implementation.createHTMLDocument('Un article | El diari del poble');
    for (const [nom, contingut] of [['og:title', 'Un article'], ['og:description', 'El resum de l’article.']]) {
      const meta = pagina.createElement('meta');
      meta.setAttribute('property', nom);
      meta.setAttribute('content', contingut);
      pagina.head.append(meta);
    }
    let obert = null;
    const bookmarklet = new Function('location', 'document', 'getSelection', 'open', codi.slice('javascript:'.length));
    bookmarklet({ href: URL_PROVA }, pagina, () => null, (adreca) => { obert = new URL(adreca); });
    expect(obert.origin).toBe('https://poble.exemple.test');
    return `${obert.pathname}${obert.search}`;
  }

  test('amb «lector»: el Curador arriba amb el Lector triat, el nom proposat i «Afegir al Lector»', async () => {
    munta(rutaDelBookmarklet({ desti: 'lector' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Afegir al Lector' })).toBeTruthy();
    /* El nom proposat és l'og:title, no el títol de la pàgina amb el nom del diari. */
    expect((await nomFont()).value).toBe('Un article');
    expect(opcio('Lector de notícies').checked).toBe(true);
    expect(consulta().get('desti')).toBe('lector');
    expect(consulta().get('url')).toBe(URL_PROVA);
    expect(consulta().get('subtitol')).toBe('El resum de l’article.');
    expect(screen.getByRole('button', { name: 'Afegir al Lector' }).disabled).toBe(false);
  });

  test('sense desti: el Bloc de sempre, amb la tria a l’abast', async () => {
    munta(rutaDelBookmarklet());
    await triaLlesta();
    expect(opcio('Bloc de notes').checked).toBe(true);
    expect(consulta().has('desti')).toBe(false);
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
  });

  test('amb «lector» i el Lector no disponible (producció): el Bloc, sense cap tria ni càrrega', () => {
    const { carrega } = munta(rutaDelBookmarklet({ desti: 'lector' }), { entorn: ENTORN_OBERT });
    expect(senseTria()).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Desar al Bloc' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' })).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
  });
});

describe('tornar al Bloc', () => {
  test('des del Lector, «Bloc de notes» torna al flux de desar d’ara', async () => {
    munta(LECTOR);
    await nomFont();
    fireEvent.click(opcio('Bloc de notes'));
    expect(consulta().has('desti')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Desar a «Safata d’Entrada»' }));
    await waitFor(() => expect(url()).toBe('/notes?carpeta=f-connectats&nota=nova'));
    expect(dades.creades).toHaveLength(1);
    expect(dades.creades[0]).toMatchObject({ title: 'Un article', folderId: 'f-connectats', origen: { tipus: 'extern', url: URL_PROVA } });
  });
});
