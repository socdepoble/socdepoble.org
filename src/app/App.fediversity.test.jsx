/**
 * Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity, expedient
 * 2026-08-1a6) · /fediversity, l'adreça curta de la candidatura, porta a
 * /page/fediversity. Es prova amb l'app de veres (PedraSecaEmbed), com
 * App.descarregues.test.jsx: la redirecció viu a ActorRoutes, d'App.jsx, i el
 * seu Routes es queda amb el primer fill que casa; només muntant App es veu
 * que cap ruta d'abans no se la queda. De pas, la pàgina de veres: un sol H1,
 * l'H2 i l'entradilla, tres H3 al cos, cap taula (ordre definitiva del Mestre,
 * ~01:00), les quatre partides en H4 i els enllaços de fora amb target i rel.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { APARADOR_R20_TEXTS } from '../sections/text/pageContent.fediversityR20.js';
import { PAGES_SEED } from '../data/appSeed.js';

/* Com a App.test.jsx: l'amfitrió ja és llest i Notes no té esborranys. */
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* Cada espera caduca abans que la prova: si falla, falla amb la seua asserció. */
const ESPERA = { timeout: 8000 };

/* Backend fals sense sessió ni xarxa, com muntaSenseSessio d'App.descarregues.test.jsx. */
async function muntaSenseSessio(ruta, cos, { pages = [] } = {}) {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (String(url).startsWith('/__iaia/')) return { status: 404, ok: false, statusText: 'Not Found' };
    throw new Error('Xarxa inesperada: ' + url);
  }));
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages, agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => []
  });
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

test('/fediversity porta a /page/fediversity, amb l’anatomia de la UniversalPage i la taula accessible', async () => {
  await muntaSenseSessio('/fediversity', async () => {
    await waitFor(() => {
      expect(document.querySelector('header.page-title h1')?.textContent).toBe(PAGE_COPY.fediversity.title);
    }, ESPERA);
    expect(window.location.pathname).toBe('/page/fediversity');
    expect(window.location.search).toBe('');
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect([...document.querySelectorAll('h2')].map((h2) => h2.textContent)).toContain(PAGE_COPY.fediversity.subtitle);
    expect(document.querySelector('p.lead')?.textContent).toBe(PAGE_COPY.fediversity.lead);
    const cos = document.querySelector('article.cms-preview');
    /* Ordre 261103_0522, T2.6 (Gauntlet O7-9, ronda 3; LR-G01, LR-G04) · /page/fediversity porta la
       targeta de /fedivers: el cos va per CosAmbTargetes (trossos .sdp-cos-tros i un sol grup) i la
       targeta, la UniversalCard del Mur, porta el seu H3 i el seu H4. Els H3 del text es compten fora
       de .sdp-targetes, com a TextSection.subtargeta. Prova posada al dia a propòsit.
       IDEA-116 (Onada R9, carril C2; prova posada al dia a propòsit) · El cos comença per la
       targeta de la primera publicació del Mur (pageContent.targetaMur.js): tres grups, el
       primer sense cap tros davant. */
    expect(cos.className).toBe('cms-preview sdp-amb-targetes');
    expect([...cos.children].map((fill) => fill.className)).toEqual([
      'sdp-targetes', 'sdp-cos-tros', 'sdp-targetes', 'sdp-cos-tros', 'sdp-targetes', 'sdp-cos-tros'
    ]);
    const grups = [...cos.querySelectorAll(':scope > .sdp-targetes')];
    expect(grups).toHaveLength(3);
    for (const grup of grups) {
      expect([grup.dataset.forma, grup.dataset.alineacio, grup.querySelectorAll(':scope > .sdp-targeta').length]).toEqual(['sola', 'dreta', 1]);
      expect([...grup.querySelectorAll('h3, h4, h5')].map((titol) => titol.tagName)).toEqual(['H3', 'H4']);
    }
    expect(grups.map((grup) => grup.querySelector('a.sp-card-link-overlay')?.getAttribute('href'))).toEqual([
      '/mur/noves-tecnologies-aplicades-a-la-cultura-rural',
      '/page/node-zero',
      '/fedivers'
    ]);
    // El cos conserva els capítols de la font vigent, inclòs l'aparador R20.
    const font = new DOMParser().parseFromString(PAGE_COPY.fediversity.html, 'text/html');
    expect([...cos.querySelectorAll('h3')].filter(h3=>!h3.closest('.sdp-targetes')).map(h3=>h3.textContent))
      .toEqual([...font.querySelectorAll('h3')].filter(h3=>!h3.closest('[data-sdp-targetes]')).map(h3=>h3.textContent));
    const demostrador=await screen.findByRole('region',{name:APARADOR_R20_TEXTS.ca.compiler},ESPERA);
    expect(demostrador.getAttribute('data-sdp-privat')).toBe('true');
    // Ordre definitiva del Mestre (~01:00): cap taula; les quatre partides
    // pressupostàries en H4 i els seus H5 es comproven dins de les caixes.
    expect(cos.querySelectorAll('table')).toHaveLength(0);
    /* O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · Prova posada al dia a propòsit: cada partida és
       una Subtargeta (div.sdp-subtargeta, que el sanejador conserva), amb el seu H4 com a títol i els
       seus tres H5 dins. Els mateixos 3 H3, 4 partides i 12 H5 de dalt. Amb la targeta (T2.6), la
       caixa és filla d'un tros .sdp-cos-tros (display: contents), mai del grup de targetes. */
    expect(cos.querySelectorAll('.sdp-targetes .sdp-subtargeta')).toHaveLength(0);
    const caixes = [...cos.querySelectorAll(':scope > .sdp-cos-tros > div.sdp-subtargeta[data-sdp-subtargeta]')];
    expect(caixes.map((caixa) => [caixa.firstElementChild.tagName, /^\d · /.test(caixa.firstElementChild.textContent), caixa.querySelectorAll('h5').length]))
      .toEqual(Array(4).fill(['H4', true, 3]));
    // El sanejador conserva els recursos enllaçats per la font; no una xifra històrica fixa.
    const fonts = [...font.querySelectorAll('a[href^="/opendata/"]')];
    const enllacos = [...cos.querySelectorAll('a[href^="/opendata/"]')];
    expect(enllacos.map(a => a.getAttribute('href'))).toEqual(fonts.map(a => a.getAttribute('href')));
    expect(enllacos.length).toBeGreaterThan(0);
    for (const [index, a] of enllacos.entries()) {
      expect(a.getAttribute('target')).toBe(fonts[index].getAttribute('target'));
      expect(a.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    }
    expect(cos.querySelector('blockquote').textContent).toContain('Total sol·licitat: 1.000 hores · 50.000 €');
    // Després del sanejador, els enllaços de fora conserven target i rel (amb el nofollow de sempre).
    const logotip = cos.querySelector('a[href="https://nlnet.nl/fediversity/"] img[src*="ngi-fediversity-tag.svg"]');
    expect(logotip).not.toBeNull();
    for (const a of cos.querySelectorAll('a[href^="https://"]')) {
      expect([a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]).toEqual([a.getAttribute('href'), '_blank', 'noopener noreferrer nofollow']);
    }
    // La portada no es repetix dins del cos; la panoràmica, sí que hi és.
    expect(cos.querySelector('img[src*="fediversity-hero"]')).toBeNull();
    expect(cos.querySelector('img[src*="fediversity-maquinaria"]')).not.toBeNull();
    expect(screen.queryByText('Ací no hi ha res')).toBeNull();
  });
}, 20000);

/* Amb les pàgines de veres (PAGES_SEED), com en remot: el Mur en porta la targeta. */
test('el Mur porta la targeta de la candidatura', async () => {
  await muntaSenseSessio('/mur', async () => {
    await waitFor(() => expect(document.body.textContent).toContain(PAGE_COPY.fediversity.title), ESPERA);
    expect(window.location.pathname).toBe('/mur');
  }, { pages: PAGES_SEED });
}, 20000);
