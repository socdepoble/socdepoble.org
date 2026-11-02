/* B3 · P1-22 (marató 261101_2143, B3-I18N §3.B) · La closca del Bloc de Notes
   i el Snippet Curador, en la llengua de la interfície.
    · El Bloc passa a l'espai de treball les etiquetes (CARPETES, NOTES, CREAR
      NOTA, la cerca i la llista buida), els grups CATEGORIES i ETIQUETES i el
      nom de les carpetes de sèrie traduïts; una carpeta reanomenada o pròpia
      es pinta tal com es va desar, i la Safata d’Entrada és un nom propi (D-1).
    · El detall mentre la carpeta d'entrada espera la seua font (Carregant…,
      l'error i Reintentar), amb les claus de l'espai de treball.
    · El Snippet Curador (/notes?mode=desa): títol, subtítol, destinació,
      classificació, el botó, el peu, el toast de desat i l'error de desar,
      l'avís d'esquema (text de PostgREST o codi neutral del port) i els dos
      rètols d'espera (el Lector arribant i el Bloc encara sense poder crear).
      La carpeta que es desa és l'id: la traducció no arriba mai a les dades.
    · Sense traductor (fora de l'app) i en valencià, el de sempre, lletra per
      lletra (Llei del Píxel).
   L'espai de treball és fals (en llig les props i, si cal, pinta el detall);
   el router en memòria, el snippet i la Pàgina Universal són de veres. Dades
   sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const m = vi.hoisted(() => ({
  t: null,
  props: null,
  pintaDetall: false,
  notes: [],
  noteFolders: [],
  config: { dataMode: 'seed' },
  teSessio: true,
  canCreate: true,
  usuari: { id: 'usuari-sintetic' },
  mur: { status: 'ready', error: null, refresh: () => {} },
  creaNota: null,
  destinacio: null,
  toast: () => {},
  buit: []
}));

vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...await importOriginal(),
  /* La plataforma llig la configuració de l'amfitrió (cap, ací). */
  useUIState: () => ({ externalConfig: {} }),
  /* El traductor de la interfície: el que llig useTraductorOpcional. */
  useUIActionsOpcional: () => (m.t ? { t: m.t } : null)
}));
vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: m.notes, noteFolders: m.noteFolders, status: 'ready', canCreate: m.canCreate, teSessio: m.teSessio, notesComplete: true,
    config: m.config, obriConfiguracioNotes: () => {}, informaError: () => {}, setLocalNoteField: () => {},
    creaNota: (...args) => m.creaNota(...args)
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: m.config }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] })
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.usuari }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: (...args) => m.toast(...args) }) }));
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({ sortedFeedPosts: m.buit, sortedEvents: m.buit, sortedMarketItems: m.buit, ...m.mur })
}));
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({
  UniversalWorkspace: (props) => {
    m.props = props;
    return m.pintaDetall ? (props.renderDetail?.({ item: null }) ?? null) : null;
  }
}));
vi.mock('./NotesDetail.jsx', () => ({ default: () => <p data-testid="detall">editor</p> }));
vi.mock('./NotaFitxa.jsx', () => ({ NotaFitxa: () => null }));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
/* La destinació del Lector, decidida per la prova (la plataforma i el Lector
   tenen les seues proves; NotesSection.lector.test.jsx les munta de veres). */
vi.mock('../../apps/plataforma/destinacions.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, useDestinacioEnllac: () => m.destinacio ?? { estat: real.ESTATS_DESTINACIO.cap, destinacio: null } };
});

import NotesSection from './NotesSection.jsx';
import { ESTATS_DESTINACIO } from '../../apps/plataforma/destinacions.js';
import { CODI_ESQUEMA_ABSENT } from '../../data/errorsBackend.js';

/* Mur i Multimèdia de sèrie, un Mercat reanomenat, la Safata i una carpeta pròpia. */
const CARPETES = Object.freeze([
  Object.freeze({ id: 'f-mur', name: 'Mur' }),
  Object.freeze({ id: 'f-mercat', name: 'El meu mercat' }),
  Object.freeze({ id: 'f-media', name: 'Multimèdia' }),
  Object.freeze({ id: 'f-connectats', name: 'Safata d’Entrada' }),
  Object.freeze({ id: 'f-tic', name: 'TIC' })
]);
const URL_PROVA = 'https://exemple.org/article';
const DESA = `/notes?mode=desa&url=${encodeURIComponent(URL_PROVA)}&titol=Un+article`;

const munta = (ruta = '/notes') => render(
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
  </MemoryRouter>
);
const etiquetes = () => ({ ...m.props.labels });
const grups = () => m.props.model.navigationGroups.map((grup) => grup.label);
const carpetes = () => m.props.model.navigationGroups[0].options.map((opcio) => [opcio.id, opcio.label]);
/* Les notes de la llista amb les seues entrades (la preparada porta un id nou a cada muntatge: fora). */
const notesDeLaLlista = () => m.props.model.items.filter((i) => i.kind === 'note' && i.id === 'a1').map((i) => [i.id, i.categoryIds]);
/* El que el Bloc passa a l'espai de treball, pla, per a comparar-ho entre llengües. */
const vista = () => ({ etiquetes: etiquetes(), grups: grups(), carpetes: carpetes(), notes: notesDeLaLlista() });

const VALENCIA = Object.freeze({
  etiquetes: { categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA', search: 'Cercar notes', empty: 'No hi ha notes.' },
  grups: [null, 'CATEGORIES', 'ETIQUETES'],
  carpetes: [['f-mur', 'Mur'], ['f-mercat', 'El meu mercat'], ['f-media', 'Multimèdia'], ['f-connectats', 'Safata d’Entrada'], ['f-tic', 'TIC']]
});

beforeEach(() => {
  m.t = null;
  m.props = null;
  m.pintaDetall = false;
  m.notes = [Object.freeze({ id: 'a1', title: 'Primera', folderId: 'f-mur', categories: ['Sistema'], tags: ['Reg'], updatedAt: '2026-01-03T09:00:00Z' })];
  m.noteFolders = CARPETES;
  m.config = { dataMode: 'seed' };
  m.teSessio = true;
  m.canCreate = true;
  m.usuari = { id: 'usuari-sintetic' };
  m.mur = { status: 'ready', error: null, refresh: () => {} };
  m.creaNota = vi.fn(async () => ({ id: 'nova' }));
  m.destinacio = null;
  m.toast = vi.fn();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('la closca del Bloc', () => {
  test('anglés: les etiquetes, els grups de la navegació i el nom de les carpetes de sèrie', () => {
    m.t = createTranslator('en');
    munta();
    expect(etiquetes()).toEqual({ categories: 'FOLDERS', items: 'NOTES', create: 'CREATE NOTE', search: 'Search notes', empty: 'There are no notes.' });
    expect(grups()).toEqual([null, 'CATEGORIES', 'TAGS']);
    /* Només el nom de la llavor es tradueix: el Mercat reanomenat, la Safata (nom propi) i la pròpia, tal qual. */
    expect(carpetes()).toEqual([['f-mur', 'Wall'], ['f-mercat', 'El meu mercat'], ['f-media', 'Media'], ['f-connectats', 'Safata d’Entrada'], ['f-tic', 'TIC']]);
    /* Les etiquetes de l'espai que el Bloc no passa (Carregant, Tot…) són les de l'espai, traduïdes allí. */
    expect(Object.keys(etiquetes()).sort()).toEqual(['categories', 'create', 'empty', 'items', 'search']);
  });

  test('castellà i basc: cada llengua la seua', () => {
    m.t = createTranslator('es');
    munta();
    expect(etiquetes()).toEqual({ categories: 'CARPETAS', items: 'NOTAS', create: 'CREAR NOTA', search: 'Buscar notas', empty: 'No hay notas.' });
    expect(grups()).toEqual([null, 'CATEGORÍAS', 'ETIQUETAS']);
    expect(carpetes()[0]).toEqual(['f-mur', 'Muro']);
    cleanup();
    m.t = createTranslator('eu');
    munta();
    expect(etiquetes().categories).toBe('KARPETAK');
    expect(grups()).toEqual([null, 'KATEGORIAK', 'ETIKETAK']);
    expect(carpetes()[0]).toEqual(['f-mur', 'Horma']);
  });

  test('canviar de llengua amb el Bloc obert: les etiquetes, els grups i les carpetes la seguixen', () => {
    m.t = createTranslator('en');
    const { rerender } = munta();
    expect(etiquetes().categories).toBe('FOLDERS');
    m.t = createTranslator('gl');
    rerender(<MemoryRouter rutaInicial="/notes"><NotesSection /></MemoryRouter>);
    expect(etiquetes()).toEqual({ categories: 'CARPETAS', items: 'NOTAS', create: 'CREAR NOTA', search: 'Buscar notas', empty: 'Non hai notas.' });
    expect(grups()).toEqual([null, 'CATEGORÍAS', 'ETIQUETAS']);
    expect(carpetes()[0]).toEqual(['f-mur', 'Muro']);
  });

  test('sense sessió amb dades remotes: «Connecta…» en la llengua de la interfície', () => {
    m.config = { dataMode: 'remote' };
    m.teSessio = false;
    m.t = createTranslator('en');
    munta();
    expect(etiquetes().empty).toBe('Sign in to see your notes.');
    cleanup();
    m.t = null;
    munta();
    expect(etiquetes().empty).toBe('Connecta per veure les teues notes.');
  });

  test('la traducció només és de la vista: els ids, la selecció d’entrada i les notes no canvien', () => {
    munta();
    const senseTraductor = vista();
    const entrada = m.props.initialSelection;
    cleanup();
    m.t = createTranslator('en');
    munta();
    expect(vista().notes).toEqual(senseTraductor.notes);
    expect(senseTraductor.notes).toEqual([['a1', ['f-mur', 'cat_Sistema', 'tag_Reg']]]);
    expect(carpetes().map(([id]) => id)).toEqual(senseTraductor.carpetes.map(([id]) => id));
    expect(m.props.initialSelection).toEqual(entrada);
    /* La dada de les carpetes no s'ha tocat. */
    expect(m.noteFolders.map((c) => c.name)).toEqual(['Mur', 'El meu mercat', 'Multimèdia', 'Safata d’Entrada', 'TIC']);
  });

  test('sense traductor i en valencià: el de sempre, lletra per lletra', () => {
    munta();
    const { notes: notesSense, ...sense } = vista();
    expect(sense).toEqual(VALENCIA);
    cleanup();
    m.t = createTranslator('ca');
    munta();
    const { notes: notesCa, ...ca } = vista();
    expect(ca).toEqual(VALENCIA);
    expect(notesCa).toEqual(notesSense);
  });
});

describe('el detall mentre la carpeta d’entrada espera la seua font', () => {
  test('carregant: el text de l’espai de treball, traduït', () => {
    m.pintaDetall = true;
    m.mur = { status: 'loading', error: null, refresh: () => {} };
    m.t = createTranslator('en');
    munta('/notes?carpeta=f-mur');
    expect(screen.getByRole('status').textContent).toBe('Loading…');
    cleanup();
    m.t = null;
    munta('/notes?carpeta=f-mur');
    expect(screen.getByRole('status').textContent).toBe('Carregant…');
  });

  test('error: el missatge i Reintentar, traduïts, amb el marcatge de sempre; el botó recarrega la font', () => {
    const refresh = vi.fn();
    m.pintaDetall = true;
    m.mur = { status: 'error', error: new Error('caiguda'), refresh };
    m.t = createTranslator('en');
    munta('/notes?carpeta=f-mur');
    const alerta = screen.getByRole('alert');
    expect(alerta.textContent).toBe('The data could not be loaded. Try again');
    fireEvent.click(within(alerta).getByRole('button', { name: 'Try again' }));
    expect(refresh).toHaveBeenCalledTimes(1);
    cleanup();
    m.t = null;
    munta('/notes?carpeta=f-mur');
    const deSempre = screen.getByRole('alert');
    expect(deSempre.textContent).toBe('No s’han pogut carregar les dades. Reintentar');
    /* El node de text de l'espai, entre el missatge i el botó. */
    expect([...deSempre.childNodes].map((n) => n.nodeName)).toEqual(['#text', '#text', 'BUTTON']);
    expect(within(deSempre).getByRole('button').textContent).toBe('Reintentar');
  });
});

describe('el Snippet Curador', () => {
  const ambSnippet = (ruta) => {
    m.pintaDetall = true;
    return munta(ruta);
  };

  test('anglés: títol, subtítol, classificació, el botó i el peu, amb el nom de la carpeta traduït', () => {
    m.t = createTranslator('en');
    ambSnippet(`${DESA}&carpeta=f-mur`);
    expect(screen.getByRole('heading', { level: 1, name: 'Save to the Notebook' })).toBeTruthy();
    expect(screen.getByText('Where do you want to save it?')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Classification' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save to «Wall»' })).toBeTruthy();
    expect(screen.getByText('It arrives as a new note in «Wall», which you can edit. The image from the other website is not copied.')).toBeTruthy();
    /* Cap resta del valencià a la closca del snippet. */
    expect(screen.queryByText('Desar al Bloc')).toBeNull();
    expect(screen.queryByText('On el vols desar?')).toBeNull();
  });

  /* Una destinació del Lector sintètica: dues categories i `afig` espiat. */
  const lectorDeProva = (afig = vi.fn(async ({ nom }) => ({ id: 'font-1', nom, ruta: null }))) => {
    m.destinacio = Object.freeze({
      estat: ESTATS_DESTINACIO.llesta,
      destinacio: Object.freeze({ nomMaxim: 80, categories: async () => [{ id: 'cat-1', nom: 'Ciència' }], afig })
    });
    return afig;
  };

  test('anglés: la destinació, amb les dues targetes, quan el Lector és disponible', () => {
    m.t = createTranslator('en');
    lectorDeProva();
    ambSnippet(DESA);
    const grup = screen.getByRole('group', { name: 'What is this link for?' });
    expect(screen.getByRole('heading', { level: 3, name: 'Destination' })).toBeTruthy();
    expect(within(grup).getByRole('radio', { name: /^Notebook/ })).toBeTruthy();
    expect(within(grup).getByRole('radio', { name: /^News reader/ })).toBeTruthy();
    expect(grup.textContent).toContain('An annotation or a bookmark: it arrives as your own note, which you can edit.');
    expect(grup.textContent).toContain('A news source (RSS) to follow in the Reader.');
    expect(grup.textContent).toContain('Chosen');
  });

  test('canviar de llengua amb el snippet obert: la destinació i el botó la seguixen', () => {
    m.t = createTranslator('en');
    lectorDeProva();
    const ruta = `${DESA}&carpeta=f-mur`;
    const { rerender } = ambSnippet(ruta);
    expect(within(screen.getByRole('group', { name: 'What is this link for?' })).getByRole('radio', { name: /^Notebook/ })).toBeTruthy();
    m.t = createTranslator('es');
    rerender(<MemoryRouter rutaInicial={ruta}><NotesSection /></MemoryRouter>);
    const grup = screen.getByRole('group', { name: '¿Para qué es este enlace?' });
    expect(within(grup).getByRole('radio', { name: /^Bloc de notas/ })).toBeTruthy();
    expect(within(grup).getByRole('radio', { name: /^Lector de noticias/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar en «Muro»' })).toBeTruthy();
  });

  test('anglés: el Lector com a destinació, de la càrrega a «Afegir», i el toast', async () => {
    m.t = createTranslator('en');
    const afig = lectorDeProva();
    ambSnippet(`${DESA}&desti=lector`);
    expect(screen.getByRole('heading', { level: 1, name: 'Add to the Reader' })).toBeTruthy();
    expect(screen.getByText('A link from outside Sóc de Poble arrives in your Reader as a news source.')).toBeTruthy();
    expect(screen.getByText(/^The app does not download anything by itself/)).toBeTruthy();
    /* Les categories arriben: el nom de la font i la categoria, amb «Sense categoria» de primera opció. */
    expect(await screen.findByRole('textbox', { name: /^Source name/ })).toBeTruthy();
    const categoria = screen.getByRole('combobox', { name: /^Category in the Reader/ });
    expect([...categoria.options].map((o) => o.textContent)).toEqual(['No category', 'Ciència']);
    expect(screen.getByText('The categories of the News reader. You can leave it without one.')).toBeTruthy();
    expect(screen.getByText('It arrives in the Reader as your own source, only on this device.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add to the Reader' }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Added to the Reader: «Un article». It waits for the connector.', 'success'));
    expect(afig).toHaveBeenCalledTimes(1);
  });

  test('anglés: les fallades del Lector, traduïdes', async () => {
    m.t = createTranslator('en');
    lectorDeProva(vi.fn(async () => { throw new Error('motiu intern'); }));
    ambSnippet(`${DESA}&desti=lector`);
    await screen.findByRole('textbox', { name: /^Source name/ });
    fireEvent.click(screen.getByRole('button', { name: 'Add to the Reader' }));
    expect(await screen.findByText('Could not add it to the Reader. Please try again.')).toBeTruthy();
    cleanup();
    /* El mòdul del Lector no ha respost: l'avís de pas. */
    m.destinacio = Object.freeze({ estat: ESTATS_DESTINACIO.error, destinacio: null });
    ambSnippet(`${DESA}&desti=lector`);
    expect(screen.getByText(/^The Reader could not be opened right now\./)).toBeTruthy();
  });

  test('anglés: desar diu on en la llengua de la interfície, i la nota es desa a l’id de la carpeta', async () => {
    m.t = createTranslator('en');
    ambSnippet(`${DESA}&carpeta=f-mur`);
    fireEvent.click(screen.getByRole('button', { name: 'Save to «Wall»' }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Saved to «Wall». It is your own note: you can edit it.', 'success'));
    expect(m.creaNota).toHaveBeenCalledTimes(1);
    expect(m.creaNota.mock.calls[0][0].folderId).toBe('f-mur');
  });

  test('anglés: una fallada sense missatge diu l’error de desar traduït', async () => {
    m.t = createTranslator('en');
    m.creaNota = vi.fn(async () => { throw new Error(''); });
    ambSnippet(`${DESA}&carpeta=f-mur`);
    fireEvent.click(screen.getByRole('button', { name: 'Save to «Wall»' }));
    expect(await screen.findByText('Could not save. Please try again.')).toBeTruthy();
    expect(m.toast).not.toHaveBeenCalled();
  });

  /* Correcció P3-01 (àrbitre M08, 261102) · Al servidor li falta la migració
     de l'origen: l'avís d'esquema de /connectar, en la llengua de la
     interfície, pel text cru de PostgREST i pel codi neutral del port. */
  const ESQUEMA_EN = /^This town’s server does not accept connections yet: /;
  const ESQUEMA_CA = 'El servidor d’este poble encara no admet connexions: falta aplicar-hi la migració de l’origen de les notes. La connexió no s’ha fet.';

  test('anglés: el rebuig de PostgREST per la columna de l’origen diu l’avís d’esquema, traduït i sense el text cru', async () => {
    m.t = createTranslator('en');
    m.creaNota = vi.fn(async () => { throw new Error('PGRST204: Could not find the \'origen\' column of \'notes\' in the schema cache'); });
    ambSnippet(`${DESA}&carpeta=f-mur`);
    fireEvent.click(screen.getByRole('button', { name: 'Save to «Wall»' }));
    expect(await screen.findByText(ESQUEMA_EN)).toBeTruthy();
    expect(screen.queryByText(/PGRST204/)).toBeNull();
    expect(m.toast).not.toHaveBeenCalled();
  });

  test('el codi neutral d’esquema del port, sense missatge, també diu l’avís d’esquema (anglés i valencià)', async () => {
    m.t = createTranslator('en');
    m.creaNota = vi.fn(async () => { throw Object.assign(new Error(''), { codi: CODI_ESQUEMA_ABSENT }); });
    ambSnippet(`${DESA}&carpeta=f-mur`);
    fireEvent.click(screen.getByRole('button', { name: 'Save to «Wall»' }));
    expect(await screen.findByText(ESQUEMA_EN)).toBeTruthy();
    expect(screen.queryByText('Could not save. Please try again.')).toBeNull();
    cleanup();
    m.t = null;
    ambSnippet(`${DESA}&carpeta=f-mur`);
    fireEvent.click(screen.getByRole('button', { name: 'Desar a «Mur»' }));
    expect(await screen.findByText(ESQUEMA_CA)).toBeTruthy();
  });

  /* Correcció P3-02 (àrbitre M08, 261102) · Els dos rètols d'espera. */
  test('anglés: mentre arriba el mòdul del Lector, «Opening the Reader…» (i en valencià, el de sempre)', () => {
    m.t = createTranslator('en');
    m.destinacio = Object.freeze({ estat: ESTATS_DESTINACIO.carregant, destinacio: null });
    ambSnippet(`${DESA}&desti=lector`);
    expect(screen.getByText('Opening the Reader…').closest('[role="status"]')).toBeTruthy();
    expect(screen.queryByText('Opening your Notebook…')).toBeNull();
    cleanup();
    m.t = null;
    ambSnippet(`${DESA}&desti=lector`);
    expect(screen.getByText('Obrint el Lector…').closest('[role="status"]')).toBeTruthy();
  });

  test('anglés: amb sessió però sense poder crear encara, el botó diu «Opening your Notebook…» i no es pot prémer', () => {
    m.t = createTranslator('en');
    m.canCreate = false;
    ambSnippet(`${DESA}&carpeta=f-mur`);
    const boto = screen.getByRole('button', { name: 'Opening your Notebook…' });
    expect(boto.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Sign in to save' })).toBeNull();
    cleanup();
    m.t = null;
    ambSnippet(`${DESA}&carpeta=f-mur`);
    expect(screen.getByRole('button', { name: 'Obrint el teu Bloc…' }).disabled).toBe(true);
  });

  test('anglés: sense sessió amb dades remotes, el botó porta a entrar', () => {
    m.t = createTranslator('en');
    m.config = { dataMode: 'remote' };
    m.teSessio = false;
    m.usuari = null;
    ambSnippet(`${DESA}&carpeta=f-mur`);
    expect(screen.getByRole('button', { name: 'Sign in to save' })).toBeTruthy();
  });

  test('sense traductor i en valencià: el snippet de sempre, lletra per lletra', async () => {
    const textos = () => [
      screen.getByRole('heading', { level: 1 }).textContent,
      screen.getByText('On el vols desar?').textContent,
      screen.getByRole('heading', { level: 3, name: 'Classificació' }).textContent,
      screen.getByRole('button', { name: /^Desar a / }).textContent,
      screen.getByText(/^Arriba com una nota nova/).textContent
    ];
    const VALENCIA_SNIPPET = ['Desar al Bloc', 'On el vols desar?', 'Classificació', 'Desar a «Mur»',
      'Arriba com una nota nova a «Mur», que podràs editar. La imatge de l’altra web no es copia.'];
    ambSnippet(`${DESA}&carpeta=f-mur`);
    expect(textos()).toEqual(VALENCIA_SNIPPET);
    fireEvent.click(screen.getByRole('button', { name: 'Desar a «Mur»' }));
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Desat a «Mur». És una nota teua: la pots editar.', 'success'));
    cleanup();
    m.t = createTranslator('ca');
    ambSnippet(`${DESA}&carpeta=f-mur`);
    expect(textos()).toEqual(VALENCIA_SNIPPET);
  });
});
