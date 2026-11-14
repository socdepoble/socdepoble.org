/* R24 · xat_entrega (IDEA-260 b, P1-4) · Qui entra pel Mur sap que té
   missatges: a la closca real (PedraSecaEmbed, App i proveïdors, backend fals
   sense xarxa, com App.nomsAccessibles.test.jsx), l'entrada «Xat» de la barra
   lateral porta la pastilla i el nom accessible amb el total de no llegits
   (sense les converses silenciades ni les arxivades); sense no llegits, el nom
   de sempre. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import '../../tests/helpers/diccionaris.js';
import PedraSecaEmbed, { activeElements } from '../PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const consulta = (media) => ({
  matches: false, media, onchange: null, addEventListener: () => {}, removeEventListener: () => {},
  addListener: () => {}, removeListener: () => {}, dispatchEvent: () => true
});
const ara = new Date().toISOString();
const fil = (id, noLlegits, extra = {}) => ({ id, tipus: 'directe', titol: `Fil ${id}`, altresNoms: ['Pep'], ultimSeq: noLlegits + 1,
  llegitFinsSeq: 1, rebutFinsSeq: 1, noLlegits, ultimAutorId: 'pep-r24', ultimAl: ara, ultimText: 'Hola', ...extra });

let anterior = null;
let fils = [];
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
    loadFils: async () => fils.map((f) => ({ ...f }))
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

async function munta() {
  render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false, language: 'ca', dataMode: 'local', rutaInicial: '/mur' }} />);
  await screen.findByRole('main');
  return screen.getByRole('navigation', { name: 'Navegació principal' });
}

describe('el comptador global a l’entrada «Xat»', () => {
  test('fora del Xat, el nom accessible i la pastilla diuen els missatges sense llegir', async () => {
    fils = [fil('f-r24-1', 2), fil('f-r24-2', 1), fil('f-r24-3', 9, { silenciatFinsAl: '2999-01-01T00:00:00Z' }), fil('f-r24-4', 4, { arxivatAl: ara })];
    const barra = await munta();
    const enllac = await waitFor(() => within(barra).getByRole('link', { name: 'Xat, 3 missatges no llegits' }));
    const insignia = enllac.querySelector('.nav-item__insignia');
    expect(insignia.getAttribute('aria-hidden')).toBe('true');
    expect(insignia.textContent).toContain('3');
  });

  test('sense no llegits, el nom de sempre i cap pastilla', async () => {
    fils = [fil('f-r24-5', 0)];
    const barra = await munta();
    const enllac = within(barra).getByRole('link', { name: 'Xat' });
    expect(enllac.querySelector('.nav-item__insignia')).toBeNull();
  });
});
