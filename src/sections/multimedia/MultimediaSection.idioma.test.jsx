/* Gauntlet 261029 (cicle 1, àrea i18n-a11y; troballa
   etiquetes-workspace-multimedia-en-catala, WCAG 3.1.2) · /multimedia en
   anglés: cap nom accessible de les tres columnes no és la reserva valenciana
   de l'UniversalWorkspace («Tot», la roda, el chevron de les carpetes, el menú
   d'ordenar…). El «Replegar …» i l'«Expandir …» de la capçalera són
   d'AppGridColumn, la peça compartida de tota l'app: fora d'esta prova.
   I la Cronologia: la píndola d'un mes amb una sola foto, en singular. */
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { createTranslator } from '../../config/i18n.js';
import { agrupaPerMes } from './cronologia.js';

const mocks = vi.hoisted(() => ({ multimedia: null, t: null, locale: 'en-GB' }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => (
    <article data-pagina="">
      <header className="page-title"><h1>{props.title}</h1></header>
      {props.subtitle ? <h2>{props.subtitle}</h2> : null}
      {props.children}
    </article>
  )
}));
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIActionsOpcional: () => ({ t: mocks.t }),
  useUIStateOpcional: () => ({ locale: mocks.locale })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => ({ mitjans: [], cens: new Map(), llest: true }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../app/contexts/SessionContext', async (original) => ({ ...(await original()), useSessioOpcional: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
vi.mock('./censImatges.js', () => {
  throw new Error('sense cens');
});
import MultimediaSection from './MultimediaSection.jsx';
import { Cella } from './PaginesEspaiMultimedia.jsx';

/* Les reserves valencianes de l'UniversalWorkspace que /multimedia pintava en qualsevol llengua. */
const RESERVES = new Set([
  'Tot', 'Configuració de l’espai de treball', 'Ordenar per data o nom', 'Ordenar notes per', 'Data d\'actualització',
  'Nom (A-Z)', 'Tornar arrere', 'Carregant…', 'No s’han pogut carregar les dades.', 'Reintentar', 'Tancar', 'Netejar',
  'Filtrar per etiquetes'
]);
const esReserva = (text) => RESERVES.has(text) || /^(Desplegar|Plegar) /.test(text);

const MITJANS = [
  { id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', created_at: '2026-08-16T08:00:00.000Z' },
  { id: 'foto-fira', title: 'Fira', src: '/assets/fotos/fira.jpg', tag: 'Arxiu', created_at: '2026-07-01T10:00:00Z' },
  { id: 'foto-mercat', title: 'Mercat', src: '/assets/fotos/mercat.jpg', tag: 'Arxiu', created_at: '2026-07-03T10:00:00Z' }
];

beforeEach(() => {
  mocks.multimedia = { status: 'ready', mediaItems: MITJANS, mediaTimelineGroups: agrupaPerMes(MITJANS) };
  mocks.t = createTranslator('en');
  mocks.locale = 'en-GB';
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const munta = (ruta) => render(<MemoryRouter rutaInicial={ruta}><MultimediaSection /></MemoryRouter>);
const columna = (id) => document.querySelector(`#${id}`);

/* Els noms que llig un lector: aria-label, title i el text de cada botó. */
function nomsDe(arrel) {
  const noms = [];
  for (const node of arrel.querySelectorAll('[aria-label], [title], button')) {
    for (const valor of [node.getAttribute('aria-label'), node.getAttribute('title')]) if (valor) noms.push(valor.trim());
    if (node.tagName === 'BUTTON') noms.push(node.textContent.trim());
  }
  return noms.filter(Boolean);
}

describe('/multimedia en anglés: les etiquetes de l’espai de treball', () => {
  test('cap nom de la navegació ni de la llista és una reserva valenciana; «All», la roda i el chevron, en anglés', async () => {
    munta('/multimedia?categoria=galeria_tots');
    const arbre = columna('app-grid-sidebar');
    const llista = columna('app-grid-list');
    const noms = [...nomsDe(arbre), ...nomsDe(llista)];
    expect(noms.filter(esReserva)).toEqual([]);
    expect(within(arbre).getByRole('button', { name: 'All' })).toBeTruthy();
    expect(within(arbre).getAllByRole('button', { name: 'Workspace settings' }).length).toBeGreaterThan(0);
    expect(within(arbre).getByRole('button', { name: /^Expand Timeline by month$/ })).toBeTruthy();
    expect(within(llista).getByRole('button', { name: 'Sort by date or name' })).toBeTruthy();
  });

  test('el menú d’ordenar parla d’arxius i en anglés', async () => {
    munta('/multimedia?categoria=galeria_tots');
    const llista = columna('app-grid-list');
    act(() => fireEvent.click(within(llista).getByRole('button', { name: 'Sort by date or name' })));
    const menu = document.querySelector('.sdp-workspace-sort-menu');
    expect(menu).not.toBeNull();
    expect(menu.querySelector('.sdp-workspace-sort-menu__title').textContent).toBe('Sort files by');
    expect([...menu.querySelectorAll('button')].map((b) => b.textContent.trim())).toEqual(['Last updated', 'Name (A–Z)']);
  });

  test('la Cronologia: un mes amb una sola foto diu «1 item», i un de dues, «2 items»', async () => {
    munta('/multimedia?categoria=galeria_cronologia');
    await act(async () => {});
    const pindoles = [...columna('app-grid-main').querySelectorAll('.notes-list-header .pill')].map((p) => p.textContent);
    expect(pindoles).toEqual(['1 item', '2 items']);
  });

  test('la cel·la d’una imatge sense src ni títol: el nom per al lector, en anglés (abans «Sense imatge»)', () => {
    const { container } = render(<Cella item={{ id: 'buida' }} onObri={() => {}} t={mocks.t} />);
    expect(container.querySelector('.media-frame__buit .sdp-sr-only').textContent).toBe('No image');
  });
});
