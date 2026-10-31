/* IDEA-57 L4a (P1-22; Gauntlet 261029, cicle 1, àrea i18n-a11y, WCAG 3.1.2) ·
   Els noms accessibles de la closca (l'enllaç de salt, la navegació
   principal, «Seccions» i «Sistema», el botó de la marca, el del Panell de
   control i el de plegar la barra) eren literals en valencià: un lector en
   anglés els llegia en valencià. Ara passen pel traductor; en valencià no
   canvia res. Shell real (PedraSecaEmbed, App i proveïdors) amb un backend
   fals sense xarxa, com App.arrelContrast.test.jsx. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import '../../tests/helpers/diccionaris.js';
import PedraSecaEmbed, { activeElements } from '../PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { carregaDiccionari } from '../config/i18n.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const consulta = (media) => ({
  matches: false, media, onchange: null, addEventListener: () => {}, removeEventListener: () => {},
  addListener: () => {}, removeListener: () => {}, dispatchEvent: () => true
});

let anterior = null;
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(consulta));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Xarxa inesperada'); }));
  vi.stubGlobal('innerWidth', 1440);
  anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => []
  });
});
afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  if (Object.keys(anterior).length) setBackendImplementation(anterior);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function munta(language) {
  render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false, language }} />);
  await screen.findByRole('main');
  await act(async () => { await carregaDiccionari(language); });
}

describe('els noms de la closca', () => {
  test('en anglés: salt, navegació, grups i botons de la barra lateral', async () => {
    await munta('en');
    const barra = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeTruthy();
    expect(within(barra).getByRole('group', { name: 'Sections' })).toBeTruthy();
    expect(barra.querySelector('#app-sidebar-sistema').getAttribute('aria-label')).toBe('System');
    expect(within(barra).getByRole('button', { name: 'Open or close the Sóc de Poble menu' })).toBeTruthy();
    expect(within(barra).getByRole('button', { name: 'Control panel' })).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^(Collapse|Expand) the sidebar$/ })).toBeTruthy();
    /* El desplegable «Sistema» també es veu en la llengua. */
    expect(barra.querySelector('.nav-item--desplegable .nav-item__text').textContent).toBe('System');
    /* La caixa del grup ja no porta la classe forastera morta (IDEA-57 D-L3). */
    expect(barra.querySelector('#app-sidebar-sistema').hasAttribute('class')).toBe(false);
  });

  test('en valencià: els noms de sempre', async () => {
    await munta('ca');
    const barra = screen.getByRole('navigation', { name: 'Navegació principal' });
    expect(screen.getByRole('link', { name: 'Salta al contingut principal' })).toBeTruthy();
    expect(within(barra).getByRole('group', { name: 'Seccions' })).toBeTruthy();
    expect(within(barra).getByRole('button', { name: 'Panell de control' })).toBeTruthy();
    expect(within(barra).getByRole('button', { name: 'Obrir o tancar menú Sóc de Poble' })).toBeTruthy();
  });
});
