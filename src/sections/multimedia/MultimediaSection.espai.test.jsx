/* IDEA-55 + P1-71 (Onada 261029_1605, Bloc E) · /multimedia com a
   UniversalWorkspace de tres columnes, amb el router en memòria de veres,
   l'espai de treball de veres, el Gestor d'arxius locals de veres i el doble
   únic de carpeta local (tests/helpers/carpetaLocalFalsa.js). La Pàgina
   Universal es substituïx per una que pinta header.page-title > h1 i el cos,
   i en registra les props (la barra blava de les pàgines locals).
     · les tres columnes i les cinc arrels; galeries, fitxa i visor;
     · l'arbre local: ids opacs a la URL (cap nom ni ruta), la Columna 2 amb
       miniatures blob: i les icones, la fitxa local sense Traduir, Comentar,
       Compartir ni Connectar;
     · QA-A04: el text sense desar es queda (editor congelat) i es pregunta;
       beforeunload només amb text brut;
     · QA-A01b: en eixir de veres de la sessió (l'avís de l'oblit), el gestor
       s'invalida (cap blob: viu); l'ordre real, a
       MultimediaSection.eixida.seguretat.test.jsx;
     · el permís 'prompt' amb un enllaç local, la reserva sense selector i la
       biblioteca per defecte sense IndexedDB.
   Gauntlet 261029 (cicle 1) · La Pàgina Universal de prova passa `refTitol`
   a l'H1 (com PageFrame); el focus després de navegar des del detall, la
   composició de producció (bloqueig, Bloc de Notes, reanomenar, eliminar,
   crear), ?seccio= i l'Escape del visor. */
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext.jsx';
import { arbreMultimedia, bytesPngFals, creaBibliotecaFalsa, nodeFals } from '../../../tests/helpers/carpetaLocalFalsa.js';
import { agrupaPerMes } from './cronologia.js';
import { delEfimer, getEfimer } from '../../config/storage.js';
import { oblidaTotesLesCarpetesLocals } from './bibliotecaCarpetesLocals.js';

const CLAU_MESTRE_DETALL = 'mestre-detall:multimedia';

const mocks = vi.hoisted(() => ({ multimedia: null, cens: null, sessio: null, pagines: [], notes: null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    mocks.pagines.push(props);
    return (
      <article data-pagina="">
        <header className="page-title"><h1 ref={props.refTitol} tabIndex={props.refTitol ? -1 : undefined}>{props.title}</h1></header>
        {props.subtitle ? <h2>{props.subtitle}</h2> : null}
        {props.children}
      </article>
    );
  }
}));
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => mocks.cens }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../app/contexts/SessionContext', async (original) => ({ ...(await original()), useSessioOpcional: () => mocks.sessio }));
/* El Bloc de Notes: el de veres sense proveïdor (cap sessió) llevat que la prova en pose un. */
vi.mock('../notes/NotesDataContext', async (original) => {
  const real = await original();
  return { ...real, useNotesData: () => mocks.notes ?? real.useNotesData() };
});
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
/* La càrrega del cens que falla (per a useCensImatges de veres, al final). */
vi.mock('./censImatges.js', () => {
  throw new Error('sense cens');
});
import MultimediaSection from './MultimediaSection.jsx';

const MITJANS = [
  { id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', created_at: '2026-08-16T08:00:00.000Z' },
  { id: 'nano-mur', title: 'Mur', src: '/assets/nano_cards/mur_nano_card.jpg', tag: 'Arxiu', origen: 'ia', created_at: '2023-01-01T00:00:00Z' },
  { id: 'foto-fira', title: 'Fira', src: '/assets/fotos/fira.jpg', tag: 'Arxiu', created_at: '2026-07-01T10:00:00Z' }
];

let ubicacio = null;
let navega = null;
function Sonda() {
  ubicacio = useLocation();
  navega = useNavigate();
  return null;
}

let creades = [];
let revocades = [];
/* Les blob: revocades mentre un <img> encara les pintava (Chrome ho escriu a la consola). */
let revocadesPintades = [];
let errors = null;
let avisos = null;
beforeEach(() => {
  mocks.multimedia = { status: 'ready', mediaItems: MITJANS, mediaTimelineGroups: agrupaPerMes(MITJANS) };
  mocks.cens = { mitjans: [], cens: new Map(), llest: true };
  mocks.sessio = null;
  mocks.pagines = [];
  mocks.notes = null;
  creades = [];
  revocades = [];
  revocadesPintades = [];
  /* La memòria del mestre-detall (capa efímera): cada prova, com una pestanya nova. */
  delEfimer(CLAU_MESTRE_DETALL);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
    const url = `blob:prova/${creades.length + 1}`;
    creades.push(url);
    return url;
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
    revocades.push(url);
    if ([...document.querySelectorAll('img')].some((img) => img.getAttribute('src') === url)) revocadesPintades.push(url);
  });
  errors = vi.spyOn(console, 'error');
  avisos = vi.spyOn(console, 'warn');
});
afterEach(() => {
  cleanup();
  /* En totes les proves: cap URL es revoca mentre es pinta. */
  expect(revocadesPintades).toEqual([]);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const munta = (ruta = '/multimedia', props = {}) => render(
  <MemoryRouter rutaInicial={ruta}>
    <MultimediaSection {...props} />
    <Sonda />
  </MemoryRouter>
);
const params = () => new URLSearchParams(ubicacio.search);
const columna = (id) => document.querySelector(`#${id}`);
const arbre = () => within(columna('app-grid-sidebar'));
const llista = () => within(columna('app-grid-list'));
const detall = () => within(columna('app-grid-main'));
const fitxa = (nom) => llista().getByRole('button', { name: (n) => n.startsWith(nom) });
const ambVolum = (opcions = {}, extres = {}) => {
  const dir = arbreMultimedia(opcions, extres);
  return { dir, bib: creaBibliotecaFalsa([{ id: 'v1', handle: dir }]) };
};
const entorn = () => ({ showDirectoryPicker: vi.fn(), addEventListener: window.addEventListener.bind(window), removeEventListener: window.removeEventListener.bind(window) });
const blobsVius = () => [...document.querySelectorAll('img')].map((img) => img.getAttribute('src')).filter((src) => src?.startsWith('blob:'));

/* Fins a la carpeta 00_inbox d'un volum obert (Carpeta local → 00_inbox). */
async function aInbox() {
  fireEvent.click(await arbre().findByRole('button', { name: 'Carpeta local · Volums muntats' }));
  fireEvent.click(await arbre().findByRole('button', { name: '00_inbox' }));
  await waitFor(() => expect(fitxa('nota.md')).toBeTruthy());
}

describe('les tres columnes', () => {
  test('/multimedia: navegació, llista i detall; les cinc arrels en ordre; l’H1 «Arxiu visual»; cap pastilla de mode', async () => {
    munta();
    expect(columna('app-grid-sidebar')).not.toBeNull();
    expect(columna('app-grid-list')).not.toBeNull();
    expect(columna('app-grid-main')).not.toBeNull();
    const arrels = [...columna('app-grid-sidebar').querySelectorAll('.sdp-workspace-nav-item__label')].map((n) => n.textContent);
    expect(arrels).toEqual([
      'Arxiu Visual i Gestor d’Arxius', 'Galeria publicada · Tots', 'Creacions IAIA / Nano Banana', 'Cronologia per mesos',
      'Carpeta local · Volums muntats'
    ]);
    expect(detall().getByRole('heading', { level: 1, name: 'Arxiu visual' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Mode de vista' })).toBeNull();
    /* La portada porta l'Accés ràpid, la Barra de volums i la Fototeca publicada (sense volum obert). */
    expect(detall().getByRole('heading', { name: 'Accés ràpid' })).toBeTruthy();
    expect(detall().getByRole('button', { name: 'Vincular carpeta local' })).toBeTruthy();
    expect(columna('app-grid-main').querySelectorAll('.photo-grid > .photo-grid__boto')).toHaveLength(MITJANS.length);
    expect(mocks.pagines.at(-1).traduccio).toBe(false);
    expect(ubicacio.search).toBe('');
    await waitFor(() => expect(screen.getAllByTestId('input-carpeta-multimedia-local')).toHaveLength(1));
  });

  test('la galeria: la URL, la vista primera a la Columna 2 i una cel·la que obri la fitxa (push, aria-current)', async () => {
    munta();
    fireEvent.click(arbre().getByRole('button', { name: 'Galeria publicada · Tots' }));
    expect(params().toString()).toBe('categoria=galeria_tots');
    const fitxes = columna('app-grid-list').querySelectorAll('.sdp-gestor-fitxa');
    expect(fitxes[0].textContent).toMatch(/^Fototeca de «Galeria publicada · Tots»/);
    expect(fitxes[0].getAttribute('aria-current')).toBe('true');
    const celles = columna('app-grid-main').querySelectorAll('.photo-grid > .photo-grid__boto');
    expect(celles).toHaveLength(MITJANS.length);
    expect([...celles].some((c) => c.hasAttribute('aria-haspopup'))).toBe(false);
    act(() => within(columna('app-grid-main')).getByRole('button', { name: 'Mur' }).click());
    expect(params().toString()).toBe('categoria=galeria_tots&item=nano-mur');
    expect(fitxa('Mur').getAttribute('aria-current')).toBe('true');
    expect(detall().getByRole('heading', { level: 1, name: 'Mur' })).toBeTruthy();
    /* Push: Arrere torna a la galeria. */
    act(() => navega(-1));
    expect(params().toString()).toBe('categoria=galeria_tots');
  });

  test('la fitxa web obri el visor amb la marca; tancar-lo torna a la fitxa', async () => {
    munta('/multimedia?categoria=galeria_tots&item=town-tibi');
    act(() => detall().getByRole('button', { name: 'Veure la imatge a pantalla completa' }).click());
    expect(params().get('foto')).toBe('town-tibi');
    expect(ubicacio.state).toEqual({ sdpVisor: true });
    const visor = document.querySelector('dialog.sdp-visor');
    expect(visor.hasAttribute('open')).toBe(true);
    act(() => within(visor).getByRole('button', { name: 'Tancar el visor' }).click());
    expect(params().toString()).toBe('categoria=galeria_tots&item=town-tibi');
    expect(detall().getByRole('heading', { level: 1, name: 'Tibi' })).toBeTruthy();
  });

  test('un enllaç directe ?foto= obri el visor damunt de la fitxa; en tancar, es queda a la fitxa', () => {
    munta('/multimedia?foto=town-tibi&x=1');
    expect(document.querySelector('dialog.sdp-visor').hasAttribute('open')).toBe(true);
    act(() => within(document.querySelector('dialog.sdp-visor')).getByRole('button', { name: 'Tancar el visor' }).click());
    expect(params().toString()).toBe('x=1&categoria=galeria_tots&item=town-tibi');
    expect(document.querySelector('dialog.sdp-visor').hasAttribute('open')).toBe(false);
  });

  test('la Cronologia té els mesos com a fills i la vista amb un h3 per mes; IAIA, només les d’IA', () => {
    munta('/multimedia?categoria=galeria_cronologia');
    fireEvent.click(arbre().getByRole('button', { name: 'Desplegar Cronologia per mesos' }));
    expect(arbre().getByRole('button', { name: /^Agost de?l? 2026$/ })).toBeTruthy();
    const mesos = [...columna('app-grid-main').querySelectorAll('.stack-grid h3')].map((h) => h.textContent);
    expect(mesos).toHaveLength(3);
    cleanup();
    munta('/multimedia?categoria=galeria_iaia');
    const celles = [...columna('app-grid-main').querySelectorAll('.photo-grid img')].map((img) => img.getAttribute('alt'));
    expect(celles).toEqual(['Mur']);
  });
});

describe('l’arbre local', () => {
  test('les carpetes del volum (sense ocults) i cap nom ni ruta local a la URL ni al títol', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    const noms = [...columna('app-grid-sidebar').querySelectorAll('.sdp-workspace-nav-item__label')].map((n) => n.textContent);
    expect(noms).toEqual(expect.arrayContaining(['00_inbox', 'documents_i_pdfs', 'originals_raster_public']));
    expect(columna('app-grid-sidebar').textContent).not.toContain('.DS_Store');
    act(() => fitxa('nota.md').click());
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'nota.md' })).toBeTruthy());
    const cerca = decodeURIComponent(ubicacio.search);
    for (const tros of ['00_inbox', 'nota', '.md', '_multimedia_de_poble']) expect(cerca).not.toContain(tros);
    expect(params().get('categoria')).toMatch(/^__lc_[0-9a-z]+$/);
    expect(params().get('item')).toMatch(/^__lf_[0-9a-z]+$/);
    expect(document.title).not.toMatch(/nota|00_inbox/);
    /* La capa efímera del mestre-detall tampoc guarda cap nom. */
    expect(JSON.stringify(getEfimer(CLAU_MESTRE_DETALL, null))).not.toMatch(/nota|00_inbox/);
  });

  test('la Columna 2 de 00_inbox: la vista i els 3 fitxers; el png amb la miniatura blob:, el md amb la icona', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    const fitxes = [...columna('app-grid-list').querySelectorAll('.sdp-gestor-fitxa')];
    expect(fitxes).toHaveLength(4);
    expect(fitxes[0].textContent).toMatch(/^Fototeca de «00_inbox»/);
    await waitFor(() => expect(fitxa('nano_vinyeta.png').querySelector('img')?.getAttribute('src')).toMatch(/^blob:prova\//));
    expect(fitxa('nota.md').querySelector('img')).toBeNull();
    expect(fitxa('nota.md').querySelector('svg')).not.toBeNull();
    expect(fitxa('nota.md').textContent).toContain('00_inbox · 1 KB · DOCUMENT');
  });

  test('la fitxa local: l’H1 és el nom, l’editor hi és i la barra blava no envia res fora (ni Traduir)', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    act(() => fitxa('nota.md').click());
    await waitFor(() => expect(columna('app-grid-main').querySelector('textarea')).not.toBeNull());
    const pagina = mocks.pagines.filter((p) => p.title === 'nota.md').at(-1);
    expect([pagina.onConnect, pagina.onComment, pagina.showShare, pagina.traduccio]).toEqual([false, false, false, false]);
    expect(detall().getByRole('heading', { level: 3, name: 'Dades de l’arxiu' })).toBeTruthy();
    /* Incrustat: sense «Tancar» del detall autònom. */
    expect(detall().queryByRole('button', { name: 'Tancar' })).toBeNull();
    const vista = mocks.pagines.filter((p) => p.title === '00_inbox').at(-1);
    expect([vista.onConnect, vista.onComment, vista.showShare, vista.traduccio]).toEqual([false, false, false, false]);
  });

  test('una tessel·la de la Fototeca local porta a la fitxa de l’arxiu', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    act(() => fitxa('Fototeca de «00_inbox»').click());
    const tessela = await detall().findByRole('button', { name: /^esbos_festa_tibi\.png/ });
    act(() => tessela.click());
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'esbos_festa_tibi.png' })).toBeTruthy());
  });
});

describe('operacions al disc des de la fitxa', () => {
  test('«Moure» a una altra carpeta: la URL (ids opacs) i el model nou arriben junts; la fitxa seguix l’arxiu', async () => {
    const { dir, bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    act(() => fitxa('nota.md').click());
    await waitFor(() => expect(columna('app-grid-main').querySelector('textarea')?.value).toContain('Hola'));
    const abans = params().toString();
    const desti = await detall().findByLabelText('Carpeta destí');
    fireEvent.change(desti, { target: { value: 'documents_i_pdfs' } });
    fireEvent.click(detall().getByRole('button', { name: 'Moure' }));
    expect(await detall().findByText(/^S’ha mogut a «documents_i_pdfs\/nota\.md»/)).toBeTruthy();
    expect(nodeFals(dir, '00_inbox/nota.md')).toBeNull();
    expect(params().toString()).not.toBe(abans);
    expect(decodeURIComponent(ubicacio.search)).not.toMatch(/nota|documents/);
    expect(detall().getByRole('heading', { level: 1, name: 'nota.md' })).toBeTruthy();
    expect(arbre().getByRole('button', { name: 'documents_i_pdfs' }).getAttribute('aria-current')).toBe('page');
    expect(fitxa('nota.md').getAttribute('aria-current')).toBe('true');
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('QA-A04 · text sense desar', () => {
  test('canviar de fitxer amb text brut: l’editor es queda i es pregunta; Cancel·lar torna la URL, Descartar canvia', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    act(() => fitxa('nota.md').click());
    const area = await waitFor(() => {
      const node = columna('app-grid-main').querySelector('textarea');
      expect(node?.value).toContain('Hola, poble.');
      return node;
    });
    const itemNota = params().get('item');
    fireEvent.change(area, { target: { value: 'Text nou sense desar' } });
    act(() => fitxa('nano_vinyeta.png').click());
    expect(params().get('item')).not.toBe(itemNota);
    let dialeg = await screen.findByRole('dialog', { name: 'Vols descartar els canvis sense desar?' });
    expect(columna('app-grid-main').querySelector('textarea').value).toBe('Text nou sense desar');
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    await waitFor(() => expect(params().get('item')).toBe(itemNota));
    expect(screen.queryByRole('dialog', { name: 'Vols descartar els canvis sense desar?' })).toBeNull();
    expect(columna('app-grid-main').querySelector('textarea').value).toBe('Text nou sense desar');
    /* Arrere amb el text brut: també es pregunta. Ara, descartar. */
    act(() => fitxa('nano_vinyeta.png').click());
    dialeg = await screen.findByRole('dialog', { name: 'Vols descartar els canvis sense desar?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Descartar els canvis' }));
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'nano_vinyeta.png' })).toBeTruthy());
    expect(columna('app-grid-main').querySelector('textarea')).toBeNull();
  });

  test('beforeunload només mentre hi ha text brut; en desmuntar, cap escolta ni error', async () => {
    const { bib } = ambVolum();
    const finestra = new EventTarget();
    const { unmount } = munta('/multimedia', {
      magatzemCarpetes: bib,
      entorn: { showDirectoryPicker: vi.fn(), addEventListener: finestra.addEventListener.bind(finestra), removeEventListener: finestra.removeEventListener.bind(finestra) }
    });
    const tanca = () => {
      const event = new Event('beforeunload', { cancelable: true });
      finestra.dispatchEvent(event);
      return event.defaultPrevented;
    };
    await aInbox();
    act(() => fitxa('nota.md').click());
    const area = await waitFor(() => {
      const node = columna('app-grid-main').querySelector('textarea');
      expect(node?.value).toContain('Hola');
      return node;
    });
    expect(tanca()).toBe(false);
    fireEvent.change(area, { target: { value: 'brut' } });
    await waitFor(() => expect(tanca()).toBe(true));
    fireEvent.change(area, { target: { value: '# Nota\n\nHola, poble.\n' } });
    await waitFor(() => expect(tanca()).toBe(false));
    fireEvent.change(area, { target: { value: 'brut de nou' } });
    await waitFor(() => expect(tanca()).toBe(true));
    unmount();
    expect(tanca()).toBe(false);
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('QA-A01b · eixida de la sessió', () => {
  test('amb la font muntada i miniatures vives, en l’eixida de veres (null i l’avís de l’oblit): cap carpeta local, totes les blob: revocades i cap viva', async () => {
    mocks.sessio = { currentUser: { id: 'u-1' } };
    const { bib } = ambVolum();
    const vista = munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    await waitFor(() => expect(blobsVius().length).toBeGreaterThan(0));
    act(() => fitxa('esbos_festa_tibi.png').click());
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'esbos_festa_tibi.png' })).toBeTruthy());
    await waitFor(() => expect(creades.length).toBeGreaterThan(2));
    mocks.sessio = { currentUser: null };
    vista.rerender(
      <MemoryRouter rutaInicial="/multimedia">
        <MultimediaSection magatzemCarpetes={bib} entorn={entorn()} />
        <Sonda />
      </MemoryRouter>
    );
    /* Gauntlet 261029 (cicle 1) · El null tot sol no és l'eixida (una renovació
       fallida també el dona): DESPRES_DE_TANCAR oblida i avisa. Sense IndexedDB,
       l'avís arriba igual. */
    await act(async () => { await oblidaTotesLesCarpetesLocals({ idb: null }); });
    await waitFor(() => expect(blobsVius()).toEqual([]));
    await waitFor(() => expect(new Set(revocades)).toEqual(new Set(creades)));
    expect(ubicacio.search).toBe('');
    expect(detall().getByRole('heading', { level: 1, name: 'Arxiu visual' })).toBeTruthy();
    expect(arbre().queryByRole('button', { name: '00_inbox' })).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  test('una renovació (el mateix id) no toca res', async () => {
    mocks.sessio = { currentUser: { id: 'u-1' } };
    const { bib } = ambVolum();
    const vista = munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    const abans = ubicacio.search;
    mocks.sessio = { currentUser: { id: 'u-1', renovat: true } };
    vista.rerender(
      <MemoryRouter rutaInicial="/multimedia">
        <MultimediaSection magatzemCarpetes={bib} entorn={entorn()} />
        <Sonda />
      </MemoryRouter>
    );
    expect(ubicacio.search).toBe(abans);
    expect(fitxa('nota.md')).toBeTruthy();
  });
});

describe('miniatures de la Columna 2', () => {
  test('en canviar de carpeta, cap <img> pinta una blob: ja revocada', async () => {
    const { bib } = ambVolum({}, { altres: { 'c.png': bytesPngFals(40, 5), 'd.png': bytesPngFals(40, 6) } });
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    await waitFor(() => expect(blobsVius().length).toBeGreaterThan(0));
    const observa = new MutationObserver(() => {
      const revocadesAra = new Set(revocades);
      for (const src of blobsVius()) expect(revocadesAra.has(src), src).toBe(false);
    });
    observa.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    fireEvent.click(arbre().getByRole('button', { name: 'altres' }));
    await waitFor(() => expect(fitxa('c.png').querySelector('img')?.getAttribute('src')).toMatch(/^blob:/));
    fireEvent.click(arbre().getByRole('button', { name: '00_inbox' }));
    await waitFor(() => expect(fitxa('nano_vinyeta.png').querySelector('img')?.getAttribute('src')).toMatch(/^blob:/));
    observa.disconnect();
    const revocadesAra = new Set(revocades);
    expect(blobsVius().filter((src) => revocadesAra.has(src))).toEqual([]);
    expect(revocadesPintades).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
  });

  test('«Tornar a llegir» després d’un canvi de fora: la miniatura que es queda no es revoca mai mentre es pinta', async () => {
    const { dir, bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    await waitFor(() => expect(fitxa('esbos_festa_tibi.png').querySelector('img')?.getAttribute('src')).toMatch(/^blob:/));
    await waitFor(() => expect(columna('app-grid-main').querySelectorAll('.sdp-arxiu-local__miniatura')).toHaveLength(2));
    const abans = fitxa('esbos_festa_tibi.png').querySelector('img').getAttribute('src');
    nodeFals(dir, '00_inbox/nano_vinyeta.png').modificaDesDeFora(bytesPngFals(96, 4));
    fireEvent.click(detall().getByRole('button', { name: 'Tornar a llegir' }));
    await waitFor(() => expect(revocades).toContain(abans));
    await waitFor(() => expect(fitxa('esbos_festa_tibi.png').querySelector('img')?.getAttribute('src')).toMatch(/^blob:/));
    expect(fitxa('esbos_festa_tibi.png').querySelector('img').getAttribute('src')).not.toBe(abans);
    expect(revocadesPintades).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('volums i navegadors', () => {
  test('permís «prompt» amb un enllaç local: l’arrel amb «Reconnectar amb 1 clic» i la URL intacta; després, l’arxiu', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    act(() => fitxa('nota.md').click());
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'nota.md' })).toBeTruthy());
    const enllac = `/multimedia${ubicacio.search ? `?${ubicacio.search}` : ''}`;
    cleanup();
    const dir = arbreMultimedia({ permisos: { read: 'prompt', readwrite: 'prompt' } });
    munta(enllac, { magatzemCarpetes: creaBibliotecaFalsa([{ id: 'v1', handle: dir }]), entorn: entorn() });
    const reconnecta = await detall().findByRole('button', { name: 'Reconnectar amb 1 clic' });
    expect(`/multimedia?${ubicacio.search}`).toBe(enllac);
    fireEvent.click(reconnecta);
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'nota.md' })).toBeTruthy());
    expect(`/multimedia?${ubicacio.search}`).toBe(enllac);
  });

  test('sense IndexedDB (la biblioteca per defecte): cap error i un sol input de carpeta', async () => {
    vi.stubGlobal('indexedDB', undefined);
    munta('/multimedia?categoria=local_root');
    expect(await detall().findByRole('button', { name: 'Vincular carpeta local' })).toBeTruthy();
    await act(async () => { await new Promise((resol) => setTimeout(resol, 20)); });
    expect(screen.getAllByTestId('input-carpeta-multimedia-local')).toHaveLength(1);
    expect(errors).not.toHaveBeenCalled();
    expect(avisos).not.toHaveBeenCalled();
  });

  test('sense selector: els fitxers d’un webkitdirectory fan l’arbre, «Només lectura» i cap operació; ids amb sal aleatòria', async () => {
    const fitxers = () => {
      const f = new File([bytesPngFals(64, 1)], 'nano.png', { type: 'image/png' });
      Object.defineProperty(f, 'webkitRelativePath', { value: '_multimedia_de_poble/00_inbox/nano.png' });
      const g = new File(['# Nota\n'], 'nota.md', { type: 'text/markdown' });
      Object.defineProperty(g, 'webkitRelativePath', { value: '_multimedia_de_poble/00_inbox/nota.md' });
      return [f, g];
    };
    const ids = [];
    for (let vegada = 0; vegada < 2; vegada += 1) {
      munta('/multimedia?categoria=local_root', { magatzemCarpetes: creaBibliotecaFalsa([]), entorn: {} });
      fireEvent.change(screen.getByTestId('input-carpeta-multimedia-local'), { target: { files: fitxers() } });
      expect(await detall().findByText('Només lectura')).toBeTruthy();
      /* Gauntlet 261029 (cicle 1, IDEA-57) · local_root ja és l'activa: en obrir-se
         el volum, es desplega sola (expandOnSelect), sense prémer el chevron. */
      await waitFor(() => expect(arbre().getByRole('button', { name: 'Carpeta local · Volums muntats' }).getAttribute('aria-expanded')).toBe('true'));
      fireEvent.click(await arbre().findByRole('button', { name: '00_inbox' }));
      await waitFor(() => expect(fitxa('nota.md')).toBeTruthy());
      ids.push(params().get('categoria'));
      act(() => fitxa('nota.md').click());
      await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'nota.md' })).toBeTruthy());
      expect(detall().queryByRole('button', { name: 'Moure' })).toBeNull();
      expect(detall().queryByRole('button', { name: 'Eliminar del disc' })).toBeNull();
      cleanup();
    }
    expect(ids[0]).toMatch(/^__lc_/);
    expect(ids[1]).not.toBe(ids[0]);
  });
});

describe('mestre-detall a 375 px', () => {
  test('primer la navegació; un enllaç amb ?item= obri el detall', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    const obertes = () => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
      .filter((id) => document.querySelector(id).getAttribute('aria-hidden') !== 'true');
    munta();
    expect(obertes()).toEqual(['#app-grid-sidebar']);
    cleanup();
    munta('/multimedia?categoria=galeria_tots&item=town-tibi');
    expect(obertes()).toEqual(['#app-grid-main']);
  });
});

/* ── Gauntlet 261029 (cicle 1) · multimedia-ui ─────────────────────────── */

const textarea = () => columna('app-grid-main').querySelector('textarea');
async function aLaNota() {
  await aInbox();
  act(() => fitxa('nota.md').click());
  return waitFor(() => {
    expect(textarea()?.value).toContain('Hola, poble.');
    return textarea();
  });
}

describe('operació tardana (la persona ja és en una altra vista)', () => {
  test('«Moure» acaba quan la persona ja mira la Galeria: la URL no salta al fitxer i Arrere torna on era', async () => {
    const { dir, bib } = ambVolum();
    const fitxer = nodeFals(dir, '00_inbox/esbos_festa_tibi.png');
    const proto = Object.getPrototypeOf(fitxer);
    const original = proto.createWritable;
    let obri;
    const porta = new Promise((resol) => { obri = resol; });
    proto.createWritable = async function retingut(...args) {
      await porta;
      return original.apply(this, args);
    };
    try {
      munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
      await aInbox();
      act(() => fitxa('esbos_festa_tibi.png').click());
      fireEvent.click(await detall().findByRole('button', { name: 'Moure' }));
      fireEvent.click(arbre().getByRole('button', { name: 'Galeria publicada · Tots' }));
      await waitFor(() => expect(params().get('categoria')).toBe('galeria_tots'));
      const ara = ubicacio.search;
      obri();
      await waitFor(() => expect(nodeFals(dir, '00_inbox/esbos_festa_tibi.png')).toBeNull());
      await act(async () => { await new Promise((resol) => setTimeout(resol, 40)); });
      expect(ubicacio.search).toBe(ara);
      expect(detall().getByRole('heading', { level: 1, name: 'Galeria publicada · Tots' })).toBeTruthy();
      /* L'entrada de la galeria no s'ha substituït: Arrere torna al fitxer d'on venia. */
      act(() => navega(-1));
      expect(params().get('categoria')).not.toBe('galeria_tots');
    } finally {
      proto.createWritable = original;
    }
  });

  test('«Moure» ràpid, però la relectura del volum és llarga: si la persona se’n va mentrestant, la URL tampoc no salta', async () => {
    const { dir, bib } = ambVolum();
    const entries = dir.entries.bind(dir);
    let porta = null;
    let obri;
    dir.entries = function (...args) {
      const iterador = entries(...args);
      if (!porta) return iterador;
      const espera = porta;
      return (async function* retingut() {
        await espera;
        yield* iterador;
      })();
    };
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    act(() => fitxa('esbos_festa_tibi.png').click());
    const moure = await detall().findByRole('button', { name: 'Moure' });
    porta = new Promise((resol) => { obri = resol; });
    fireEvent.click(moure);
    expect(await detall().findByText(/^S’ha mogut a /)).toBeTruthy();
    fireEvent.click(arbre().getByRole('button', { name: 'Galeria publicada · Tots' }));
    await waitFor(() => expect(params().get('categoria')).toBe('galeria_tots'));
    const ara = ubicacio.search;
    porta = null;
    obri();
    await act(async () => { await new Promise((resol) => setTimeout(resol, 40)); });
    expect(ubicacio.search).toBe(ara);
  });
});

describe('focus després de navegar des de la columna del detall', () => {
  test('una cel·la, l’Accés ràpid i una tessel·la local porten el focus a l’H1 de la pàgina nova (mai a <body>)', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    const acces = detall().getByRole('button', { name: /^Galeria publicada · Tots \(/ });
    acces.focus();
    act(() => acces.click());
    expect(document.activeElement).toBe(detall().getByRole('heading', { level: 1 }));
    const cella = within(columna('app-grid-main')).getByRole('button', { name: 'Mur' });
    cella.focus();
    act(() => cella.click());
    expect(document.activeElement).toBe(detall().getByRole('heading', { level: 1, name: 'Mur' }));
    await aInbox();
    act(() => fitxa('Fototeca de «00_inbox»').click());
    const tessela = await detall().findByRole('button', { name: /^esbos_festa_tibi\.png/ });
    tessela.focus();
    act(() => tessela.click());
    await waitFor(() => expect(document.activeElement).toBe(detall().getByRole('heading', { level: 1, name: 'esbos_festa_tibi.png' })));
    /* Un clic a la Columna 2 no li lleva el focus. */
    const deLaLlista = fitxa('nota.md');
    deLaLlista.focus();
    act(() => deLaLlista.click());
    expect(document.activeElement).toBe(deLaLlista);
  });
});

describe('la composició de producció de la fitxa local', () => {
  test('amb text sense desar: Moure, Reanomenar, Eliminar i les Accions de carpeta queden bloquejats', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    const area = await aLaNota();
    expect(detall().getByRole('button', { name: 'Moure' }).disabled).toBe(false);
    fireEvent.change(area, { target: { value: 'brut' } });
    await waitFor(() => expect(detall().getByRole('button', { name: 'Moure' }).disabled).toBe(true));
    expect(detall().getByRole('button', { name: 'Reanomenar' }).disabled).toBe(true);
    expect(detall().getByRole('button', { name: 'Eliminar del disc' }).disabled).toBe(true);
    const accions = within(detall().getByRole('region', { name: 'Accions de carpeta' }));
    expect(accions.getByRole('button', { name: 'Nova carpeta' }).disabled).toBe(true);
    expect(accions.getByRole('button', { name: 'Nou fitxer .md' }).disabled).toBe(true);
  });

  test('«Enviar al Bloc de Notes» sense sessió no va; amb sessió crea la nota i obri /notes', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aLaNota();
    expect(detall().getByRole('button', { name: 'Enviar al Bloc de Notes' }).disabled).toBe(true);
    expect(detall().getByText('Per a enviar-lo al Bloc de Notes cal entrar al compte.')).toBeTruthy();
    cleanup();
    const creaNota = vi.fn(async () => ({ id: 'n-7' }));
    mocks.notes = { canCreate: true, creaNota };
    munta('/multimedia', { magatzemCarpetes: ambVolum().bib, entorn: entorn() });
    await aLaNota();
    const envia = detall().getByRole('button', { name: 'Enviar al Bloc de Notes' });
    expect(envia.disabled).toBe(false);
    fireEvent.click(envia);
    await waitFor(() => expect(ubicacio.pathname).toBe('/notes'));
    expect(creaNota).toHaveBeenCalledTimes(1);
    expect(creaNota.mock.calls[0][0]).toEqual(expect.objectContaining({ title: 'Nota', folderId: 'f-notes' }));
    expect(params().get('nota')).toBe('n-7');
  });

  test('Reanomenar i Eliminar: la URL porta ids opacs nous (cap nom) i la fitxa seguix el fitxer', async () => {
    const { dir, bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aLaNota();
    const itemAbans = params().get('item');
    const nom = detall().getByLabelText('Nom nou');
    fireEvent.change(nom, { target: { value: 'acta_veinal.md' } });
    fireEvent.click(detall().getByRole('button', { name: 'Reanomenar' }));
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'acta_veinal.md' })).toBeTruthy());
    expect(nodeFals(dir, '00_inbox/acta_veinal.md')).not.toBeNull();
    expect(params().get('item')).toMatch(/^__lf_[0-9a-z]+$/);
    expect(params().get('item')).not.toBe(itemAbans);
    expect(decodeURIComponent(ubicacio.search)).not.toMatch(/acta|nota|00_inbox/);
    fireEvent.click(detall().getByRole('button', { name: 'Eliminar del disc' }));
    const dialeg = await screen.findByRole('dialog');
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Eliminar definitivament' }));
    await waitFor(() => expect(nodeFals(dir, '00_inbox/acta_veinal.md')).toBeNull());
    await waitFor(() => expect(params().get('item')).toBeNull());
    expect(params().get('categoria')).toMatch(/^__lc_[0-9a-z]+$/);
    expect(errors).not.toHaveBeenCalled();
  });

  test('Nova carpeta i Nou fitxer .md des de la vista de carpeta: ids opacs i la selecció hi va', async () => {
    const { dir, bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    const carpetaAbans = params().get('categoria');
    fireEvent.click(detall().getByRole('button', { name: 'Nova carpeta' }));
    fireEvent.change(detall().getByLabelText('Nom de la carpeta nova'), { target: { value: 'actes_2026' } });
    fireEvent.click(detall().getByRole('button', { name: 'Crear la carpeta' }));
    await waitFor(() => expect(params().get('categoria')).not.toBe(carpetaAbans));
    expect(params().get('categoria')).toMatch(/^__lc_[0-9a-z]+$/);
    expect(decodeURIComponent(ubicacio.search)).not.toMatch(/actes/);
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'actes_2026' })).toBeTruthy());
    fireEvent.click(detall().getByRole('button', { name: 'Nou fitxer .md' }));
    fireEvent.change(detall().getByLabelText('Nom del fitxer nou'), { target: { value: 'ordre del dia' } });
    fireEvent.click(detall().getByRole('button', { name: 'Crear el fitxer' }));
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'ordre del dia.md' })).toBeTruthy());
    expect(nodeFals(dir, '00_inbox/actes_2026/ordre del dia.md')).not.toBeNull();
    expect(params().get('item')).toMatch(/^__lf_[0-9a-z]+$/);
  });
});

describe('desar (⌘S) i Descarregar', () => {
  test('després de desar, «Descarregar» apunta al contingut nou (cap instantània vella que Chrome ja no llig)', async () => {
    const dir = arbreMultimedia({ lecturaEstricta: true });
    const bib = creaBibliotecaFalsa([{ id: 'v1', handle: dir }]);
    const blobs = new Map();
    URL.createObjectURL.mockImplementation((blob) => {
      const url = `blob:prova/${creades.length + 1}`;
      creades.push(url);
      blobs.set(url, blob);
      return url;
    });
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    const area = await aLaNota();
    const enllac = () => detall().getByRole('link', { name: 'Descarregar' });
    await waitFor(() => expect(enllac()).toBeTruthy());
    expect(await blobs.get(enllac().getAttribute('href')).text()).toContain('Hola, poble.');
    fireEvent.change(area, { target: { value: '# Nota\n\nVersió nova.\n' } });
    fireEvent.keyDown(area, { key: 's', metaKey: true });
    expect(await detall().findByText('Canvis desats a «00_inbox/nota.md».')).toBeTruthy();
    await waitFor(async () => expect(await blobs.get(enllac().getAttribute('href')).text()).toBe('# Nota\n\nVersió nova.\n'));
  });

  test('desar no torna a recórrer el volum ni esborra els duplicats exactes ja calculats', async () => {
    const { dir, bib } = ambVolum({}, { altres: { 'copia.png': bytesPngFals(64, 2) } });
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    const area = await aLaNota();
    act(() => fitxa('Fototeca de «00_inbox»').click());
    fireEvent.click(await detall().findByRole('button', { name: 'Verificar duplicats exactes (SHA-256)' }));
    expect(await detall().findByText('Grups de fitxers idèntics byte a byte: 1')).toBeTruthy();
    act(() => fitxa('nota.md').click());
    await waitFor(() => expect(textarea()?.value).toContain('Hola'));
    const llegitsAbans = dir.registre.filter(([op]) => op === 'entries').length;
    fireEvent.change(textarea(), { target: { value: '# Nota\n\nDesat ràpid.\n' } });
    fireEvent.keyDown(textarea(), { key: 's', ctrlKey: true });
    expect(await detall().findByText('Canvis desats a «00_inbox/nota.md».')).toBeTruthy();
    await act(async () => { await new Promise((resol) => setTimeout(resol, 30)); });
    expect(dir.registre.filter(([op]) => op === 'entries').length).toBe(llegitsAbans);
    act(() => fitxa('Fototeca de «00_inbox»').click());
    expect(await detall().findByText('Grups de fitxers idèntics byte a byte: 1')).toBeTruthy();
    expect(area).toBeTruthy();
  });

  test('desar mentre la verificació SHA-256 encara calcula no l’atura: el resultat arriba igual', async () => {
    let obri;
    const porta = new Promise((resol) => { obri = resol; });
    const cripto = {
      randomUUID: () => globalThis.crypto.randomUUID(),
      getRandomValues: (bytes) => globalThis.crypto.getRandomValues(bytes),
      subtle: { digest: async (...args) => { await porta; return globalThis.crypto.subtle.digest(...args); } }
    };
    const { bib } = ambVolum({}, { altres: { 'copia.png': bytesPngFals(64, 2) } });
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn(), cripto });
    await aLaNota();
    act(() => fitxa('Fototeca de «00_inbox»').click());
    fireEvent.click(await detall().findByRole('button', { name: 'Verificar duplicats exactes (SHA-256)' }));
    expect(await detall().findByRole('button', { name: 'Aturar la verificació' })).toBeTruthy();
    act(() => fitxa('nota.md').click());
    await waitFor(() => expect(textarea()?.value).toContain('Hola'));
    fireEvent.change(textarea(), { target: { value: '# Nota\n\nDesat a mig càlcul.\n' } });
    fireEvent.keyDown(textarea(), { key: 's', metaKey: true });
    expect(await detall().findByText('Canvis desats a «00_inbox/nota.md».')).toBeTruthy();
    obri();
    act(() => fitxa('Fototeca de «00_inbox»').click());
    expect(await detall().findByText('Grups de fitxers idèntics byte a byte: 1')).toBeTruthy();
    expect(detall().queryByText('Verificació aturada: el resultat és parcial.')).toBeNull();
  });
});

describe('privadesa: ?seccio= i noms', () => {
  test('les pàgines locals (i la portada amb un volum obert) no escriuen ?seccio=; navegar en lleva la d’abans', async () => {
    const { bib } = ambVolum();
    munta('/multimedia?seccio=acces-rapid', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    const vista = mocks.pagines.filter((p) => p.title === '00_inbox').at(-1);
    expect(vista.seccioALaUrl).toBe(false);
    expect(params().get('seccio')).toBeNull();
    act(() => fitxa('nota.md').click());
    await waitFor(() => expect(mocks.pagines.filter((p) => p.title === 'nota.md').at(-1)?.seccioALaUrl).toBe(false));
    act(() => navega('/multimedia'));
    await waitFor(() => expect(mocks.pagines.at(-1).title).toBe('Arxiu visual'));
    expect(mocks.pagines.at(-1).seccioALaUrl).toBe(false);
    cleanup();
    munta('/multimedia', { magatzemCarpetes: creaBibliotecaFalsa([]), entorn: entorn() });
    expect(mocks.pagines.at(-1).seccioALaUrl).toBe(true);
  });

  test('un nom amb U+202E es pinta amb «�» a la Columna 2 i a l’H1 (cap extensió falsejada)', async () => {
    const { bib } = ambVolum({}, { 'RTL_‮gnp.md': '# Truc\n' });
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    fireEvent.click(await arbre().findByRole('button', { name: 'Carpeta local · Volums muntats' }));
    const fila = await waitFor(() => llista().getByRole('button', { name: (n) => n.startsWith('RTL_�gnp.md') }));
    expect(fila.textContent).not.toContain('‮');
    act(() => fila.click());
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'RTL_�gnp.md' })).toBeTruthy());
    expect(columna('app-grid-main').textContent).not.toContain('‮');
    /* Es pot llegir, però el Mas no el mou, ni el reanomena ni l'esborra: cap operació. */
    expect(detall().queryByRole('button', { name: 'Moure' })).toBeNull();
    expect(detall().queryByRole('button', { name: 'Eliminar del disc' })).toBeNull();
  });

  test('una carpeta amb un caràcter invisible al nom es pot obrir, però sense «Accions de carpeta»', async () => {
    const { bib } = ambVolum({}, { 'noms‮rars': { 'a.md': '# A\n' } });
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    fireEvent.click(await arbre().findByRole('button', { name: 'Carpeta local · Volums muntats' }));
    fireEvent.click(await arbre().findByRole('button', { name: 'noms�rars' }));
    await waitFor(() => expect(detall().getByRole('heading', { level: 1, name: 'noms�rars' })).toBeTruthy());
    await detall().findByRole('button', { name: /^a\.md/ });
    expect(detall().queryByRole('region', { name: 'Accions de carpeta' })).toBeNull();
    act(() => fitxa('Fototeca de «noms�rars»').click());
    expect(detall().queryByRole('region', { name: 'Accions de carpeta' })).toBeNull();
  });
});

describe('accessibilitat del panell local i de la Columna 2', () => {
  test('a l’espai, les tessel·les i les files naveguen: cap aria-pressed', async () => {
    const { bib } = ambVolum();
    munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
    await aInbox();
    act(() => fitxa('Fototeca de «00_inbox»').click());
    await detall().findByRole('button', { name: /^nota\.md/ });
    expect(columna('app-grid-main').querySelectorAll('.sdp-arxiu-local__tessela[aria-pressed]')).toHaveLength(0);
    fireEvent.click(detall().getByRole('button', { name: 'Explorador d’arxius (taula)' }));
    await detall().findByRole('table');
    expect(columna('app-grid-main').querySelectorAll('table button[aria-pressed]')).toHaveLength(0);
  });

  test('la cerca del panell diu el recompte en una regió d’estat; la de la Columna 2, «cap coincidència»', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { bib } = ambVolum();
      munta('/multimedia', { magatzemCarpetes: bib, entorn: entorn() });
      await aInbox();
      act(() => fitxa('Fototeca de «00_inbox»').click());
      const cerca = await detall().findByRole('searchbox');
      const estat = () => [...columna('app-grid-main').querySelectorAll('[role=status].sdp-nomes-lector')].map((n) => n.textContent);
      expect(estat()).toEqual(['']);
      fireEvent.change(cerca, { target: { value: 'zzz' } });
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(estat()).toEqual(['Cap fitxer coincidix amb els filtres.']);
      fireEvent.change(cerca, { target: { value: 'nota' } });
      await act(async () => { vi.advanceTimersByTime(600); });
      expect(estat()).toEqual(['Fitxers a la vista (1)']);
    } finally {
      vi.useRealTimers();
    }
    fireEvent.click(columna('app-grid-list').querySelector('.sdp-workspace-search-toggle, [aria-label="Cercar arxius"]'));
    const lupa = await llista().findByRole('searchbox');
    fireEvent.change(lupa, { target: { value: 'zzzz' } });
    expect(await llista().findByText('Cap arxiu coincidix amb la cerca.')).toBeTruthy();
    expect(llista().queryByText('Esta carpeta no té cap arxiu.')).toBeNull();
  });

  test('«Carpeta local» sense volum: H1 → h2 (només per al lector) → h3', () => {
    munta('/multimedia?categoria=local_root', { magatzemCarpetes: creaBibliotecaFalsa([]), entorn: entorn() });
    const nivells = [...columna('app-grid-main').querySelectorAll('h1, h2, h3, h4')].map((h) => Number(h.tagName[1]));
    for (let i = 1; i < nivells.length; i += 1) expect(nivells[i] - nivells[i - 1]).toBeLessThanOrEqual(1);
    expect(columna('app-grid-main').querySelector('h2.sr-only')?.textContent).toBe('Gestor d’arxius locals');
  });
});

describe('el visor: Escape sense activació', () => {
  test('un cancel no cancel·lable seguit del close recula UNA sola entrada (no ix de l’Arxiu)', async () => {
    munta('/versions');
    act(() => navega('/multimedia?categoria=galeria_tots&item=town-tibi'));
    act(() => detall().getByRole('button', { name: 'Veure la imatge a pantalla completa' }).click());
    const visor = document.querySelector('dialog.sdp-visor');
    expect(visor.hasAttribute('open')).toBe(true);
    /* Com el navegador: el `cancel` no es pot cancel·lar i el <dialog> es tanca igualment. */
    act(() => {
      visor.dispatchEvent(new Event('cancel', { cancelable: false }));
      visor.removeAttribute('open');
      visor.dispatchEvent(new Event('close'));
    });
    await act(async () => { await new Promise((resol) => setTimeout(resol, 20)); });
    expect(ubicacio.pathname).toBe('/multimedia');
    expect(params().toString()).toBe('categoria=galeria_tots&item=town-tibi');
  });

  test('dos avisos de tancar abans que la ubicació canvie reculen una sola vegada', async () => {
    munta('/versions');
    act(() => navega('/multimedia?categoria=galeria_tots&item=town-tibi'));
    act(() => detall().getByRole('button', { name: 'Veure la imatge a pantalla completa' }).click());
    const tanca = within(document.querySelector('dialog.sdp-visor')).getByRole('button', { name: 'Tancar el visor' });
    act(() => {
      tanca.click();
      tanca.click();
    });
    await act(async () => { await new Promise((resol) => setTimeout(resol, 20)); });
    expect(ubicacio.pathname).toBe('/multimedia');
    expect(params().toString()).toBe('categoria=galeria_tots&item=town-tibi');
  });
});

describe('useCensImatges', () => {
  test('si la càrrega del cens falla, llest és cert i el cens és buit', async () => {
    const { useCensImatges } = await vi.importActual('./useCensImatges.js');
    const { result } = renderHook(() => useCensImatges());
    expect(result.current.llest).toBe(false);
    await waitFor(() => expect(result.current.llest).toBe(true));
    expect(result.current.mitjans).toEqual([]);
  });
});
