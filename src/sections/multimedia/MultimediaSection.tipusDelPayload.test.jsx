/**
 * Auditoria de seguretat 261019 (F9) · Una aportació de Multimèdia d'un veí
 * amb un `title` (o un altre camp de text) de tipus objecte ja no tomba
 * /multimedia ni el visor: elementDeFilaPublicada (mapejadorSeccions.js) no
 * deixa viatjar l'objecte, i la graella i el visor de veres hi pinten la seua
 * reserva.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { elementDeFilaPublicada } from '../../data/mapejadorSeccions.js';

const mocks = vi.hoisted(() => ({ multimedia: null }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => ({ mitjans: [], cens: new Map() }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
import MultimediaSection from './MultimediaSection.jsx';

const hostil = () => JSON.parse('{"toString":0}');
const aportacio = (id, extra) => elementDeFilaPublicada({
  id, titol: 'Veí', createdAt: '2026-10-07T10:00:00Z', updatedAt: '2026-10-07T10:00:00Z', ownerUserId: 'U',
  payload: { sectionId: 'multimedia', title: hostil(), tag: hostil(), source: hostil(), autor: hostil(), copyright: hostil(),
    nomPoble: hostil(), poble: hostil(), dataCaptura: hostil(), geolocalitzacio: { lat: hostil(), lng: hostil() }, ...extra }
});

beforeEach(() => {
  mocks.multimedia = {
    status: 'ready',
    mediaItems: [aportacio('amb-foto', { src: '/assets/towns/tibi/1.jpg' }), aportacio('sense-foto', {})],
    mediaTimelineGroups: []
  };
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
  /* Bloc E (IDEA-55 + P1-71) · L'espai de treball de tres columnes, en ample. */
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('la graella es pinta amb les dues aportacions', () => {
  const { container } = render(<MemoryRouter rutaInicial="/multimedia?categoria=galeria_tots"><MultimediaSection /></MemoryRouter>);
  expect(container.querySelectorAll('.photo-grid__boto')).toHaveLength(2);
  /* La Columna 2 també les llista, amb text (mai un objecte). */
  const titols = [...container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa__titol')].map((n) => n.textContent);
  expect(titols.every((titol) => typeof titol === 'string' && !titol.includes('[object'))).toBe(true);
});

test('el visor obert per ?foto= es pinta', () => {
  render(<MemoryRouter rutaInicial="/multimedia?foto=amb-foto"><MultimediaSection /></MemoryRouter>);
  expect(document.querySelector('dialog.sdp-visor')).not.toBeNull();
  /* Bloc E · El visor, damunt de la fitxa de la foto (la graella és a la Fototeca). */
  expect(document.querySelectorAll('dialog.sdp-visor img').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Veure la imatge a pantalla completa' })).not.toBeNull();
});
