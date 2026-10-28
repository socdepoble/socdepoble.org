/**
 * P1-64 (pla 261028_1526 §3.7.1; decisions 1 i 9 del Mestre, 261028) · La
 * pestanya «Mapa» del Mur munta el Mapa Fotogràfic en diferit: el mòdul no es
 * demana fins que s'obri la pestanya, rep les publicacions que es veuen i les
 * fitxes dels pobles, i si falla la barrera torna al mapa de sempre (el
 * d'OpenStreetMap incrustat), que tampoc no es carrega sense prémer «Vore
 * mapa». A l'app nativa, eixe botó no hi és.
 */
import React from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setSearchParams: vi.fn(), params: new URLSearchParams(), t: (_, alternativa) => alternativa,
  core: {}, mur: {}, nativa: false, importat: 0, falla: false, props: null
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [mocks.params, mocks.setSearchParams],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../config/origenPublic.js', async (original) => ({ ...(await original()), esAppNativa: () => mocks.nativa }));
/* El mapa de veres (Leaflet) té les seues proves: ací, un doble que compta quan es demana. */
vi.mock('./MapaFotografic.jsx', async () => {
  const { createElement } = await import('react');
  mocks.importat += 1;
  return {
    default: (props) => {
      mocks.props = props;
      if (mocks.falla) throw new Error('Leaflet no arrenca');
      return createElement('p', null, 'Mapa fotogràfic de prova');
    }
  };
});
import MurSection from './MurSection.jsx';
import { buildMapEmbedUrl } from './mapConfig.js';

const TOWNS = [{ id: 'penaguila', title: 'Penàguila', lat: 38.6315, lng: -0.3892 }];
const PUBLICACIO = { id: 'p', type: 'feed', title: 'Les fonts', created_at: '2026-09-01T10:00:00.000Z', poble_id: 'penaguila', image_url: '/assets/uploads/gent/v/p.webp' };
const filtre = (nom) => act(() => within(screen.getByRole('group', { name: 'Filtres del mur' })).getByRole('button', { name: nom }).click());

/* React avisa per consola de cada error que recull una barrera i, en
   desenvolupament, el torna a llançar dins d'un esdeveniment de jsdom: es dona
   per atés (el patró de detailSectionMeta.pobleDiferit.test.jsx). */
const atesa = (event) => event.preventDefault();
let avisos;
let errors;
beforeEach(() => {
  window.addEventListener('error', atesa);
  mocks.params = new URLSearchParams();
  mocks.nativa = false;
  mocks.falla = false;
  mocks.props = null;
  mocks.core = { status: 'ready', error: null, pageCopy: {}, towns: TOWNS };
  mocks.mur = { status: 'ready', error: null, sortedEvents: [], sortedMarketItems: [], sortedFeedPosts: [PUBLICACIO] };
  // Sense PAGE_COPY, el Mur avisa de cada pàgina de sistema; i React escriu l'error que la barrera recull.
  avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  window.removeEventListener('error', atesa);
  avisos.mockRestore();
  errors.mockRestore();
});

test('el mapa es demana només en obrir la pestanya, amb les publicacions que es veuen i els pobles', async () => {
  render(<MurSection />);
  expect(mocks.importat).toBe(0);
  filtre('Mapa');
  expect(await screen.findByText('Mapa fotogràfic de prova')).toBeTruthy();
  expect(mocks.importat).toBe(1);
  expect(mocks.props.items.map((item) => item.id)).toContain('p');
  expect(mocks.props.pobles).toBe(TOWNS);
  // El mapa de sempre ja no es carrega de sèrie.
  expect(document.querySelector('iframe')).toBeNull();
  // Tornar a prémer «Mapa» el tanca, com sempre.
  filtre('Mapa');
  expect(screen.queryByText('Mapa fotogràfic de prova')).toBeNull();
});

test('si el mapa falla, la barrera torna al mapa de sempre, i només després de «Vore mapa»', async () => {
  mocks.falla = true;
  render(<MurSection />);
  filtre('Mapa');
  expect(await screen.findByText("El mapa fotogràfic no s'ha pogut carregar. Pots vore el mapa de sempre del territori.")).toBeTruthy();
  expect(document.querySelector('iframe')).toBeNull();
  act(() => screen.getByRole('button', { name: 'Vore mapa' }).click());
  const marc = screen.getByTitle('Mapa del territori');
  expect(marc.getAttribute('src')).toBe(buildMapEmbedUrl());
  expect(marc.className).toBe('sdp-mapa-embed');
  // A OSM només li arriba l'origen: mai la ruta (a WordPress, ?sdp= porta la de l'app).
  expect(marc.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
  // La graella de les publicacions continua al seu lloc.
  expect(document.querySelector('.sdp-card-grid')).not.toBeNull();
});

test('a l’app nativa, la barrera no ofereix el mapa de sempre', async () => {
  mocks.falla = true;
  mocks.nativa = true;
  render(<MurSection />);
  filtre('Mapa');
  expect(await screen.findByText("El mapa fotogràfic no s'ha pogut carregar.")).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Vore mapa' })).toBeNull();
  expect(document.querySelector('iframe')).toBeNull();
});
