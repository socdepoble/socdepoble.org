/* Notícies del Poble · la integració final de la nit del 261004 (front «lector-nevera»), i la seua
   adaptació al Bloc 0 del Gauntlet (ordre del Mestre, 261016): les notícies són l'espai de treball
   del Bloc de notes i la notícia s'obri des de la seua fila de la llista, no des d'una targeta.
   Cada prova fallaria sense el seu arreglo:
     F05  Compartir envia el detall (?article=<id>), amb la base del router de navegador i amb el
          router de memòria. Una sola navegació (push) en obrir, també des de l'entrada de l'app.
     F04  Sense font ni autor, la fila no s'inventa cap autoria: la data, i prou.
     Esc  Un diàleg nostre obert fora de la closca (dins de .sdp-root) el bloqueja; un de
          l'amfitrió (fora de .sdp-root), no.
     Focus  El de l'amfitrió no es furta; des de l'entrada de l'app, l'H1 el rep en obrir i la
          fila d'origen, en tornar.
     B0   /noticies no porta cap UniversalCard ni la vora de la carpeta oberta de l'arreglo 6.
          261024 (Lector) · «Les que seguixes» en UniversalCard amb boina se'n va amb la pàgina de
          fonts (ordre del Mestre de les 15:05): la gestió és el diàleg de l'arbre, sense targetes.
   Totes les dades són inventades (la llavor sintètica). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BrowserRouter, MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext.jsx';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { Ubicacio, preparaNavegador } from '../plataforma/__fixtures__/munta.jsx';
import { ProveidorPlataforma } from '../plataforma/PlataformaContext.jsx';
import RutaApps from '../plataforma/RutaApps.jsx';
import { ARA, ENTORN, munta, prepara, tancats } from './__fixtures__/muntaLector.jsx';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { focusLliure } from './vistes/Lector.jsx';

const CORREFOC = 'El correfoc de les festes passarà pel barranc';
const detall = () => within(document.getElementById('app-grid-main'));
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const fitxes = () => [...document.getElementById('app-grid-list').querySelectorAll('button.sdp-gestor-fitxa')];
const fitxa = (titol) => fitxes().find((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent === titol);
async function titolDelLector(titol) {
  const h1 = await screen.findByRole('heading', { level: 1, name: titol });
  expect(document.getElementById('app-grid-main').contains(h1)).toBe(true);
  return h1;
}
const barraBlava = () => within(document.getElementById('app-grid-main').querySelector('header.bar-blue'));

/* L'app dins d'un router triat: el de navegador amb base o el de memòria (l'encastat). */
function muntaAmb(Router, propietats, url) {
  const entorn = prepara();
  preparaNavegador();
  window.history.replaceState(null, '', url);
  render(
    <UIProvider externalConfig={{}}>
      <Router {...propietats}>
        <ProveidorPlataforma registre={entorn.registre} entorn={ENTORN}>
          <Routes>
            <Route path="/app/*" element={<RutaApps />} />
          </Routes>
          <Ubicacio />
        </ProveidorPlataforma>
      </Router>
    </UIProvider>
  );
  return entorn;
}

/* navigator.share simulat: cap compartició ix de la prova. */
let comparticions = [];
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  comparticions = [];
  Object.defineProperty(window.navigator, 'share', {
    configurable: true,
    value: vi.fn(async (dades) => { comparticions.push(dades); })
  });
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  delete window.navigator.share;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* Bloc 0 (261016) · Actualitzada a posta: la notícia ja no té targeta amb peu a la llista (la fila
   de l'espai no porta Compartir). Compartir és el de la barra blava de la lectura, i envia el
   detall: el mateix article, amb la base del router. */
describe('F05 · Compartir una notícia compartix el seu detall, no la llista', () => {
  test('router de navegador amb base: una sola navegació en obrir i Compartir envia ?article=<id> amb la base', async () => {
    muntaAmb(BrowserRouter, { basename: '/sdp' }, '/sdp/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    expect(push).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
    const id = new URLSearchParams(window.location.search).get('article');
    expect(window.location.pathname + window.location.search).toBe(`/sdp/app/lector/noticies/hui?article=${id}`);
    await act(async () => {
      fireEvent.click(barraBlava().getByRole('button', { name: 'Compartir' }));
    });
    expect(comparticions).toHaveLength(1);
    const url = new URL(comparticions[0].url);
    expect(url.pathname).toBe('/sdp/app/lector/noticies/hui');
    expect(url.searchParams.get('article')).toBe(id);
  });

  test('router de memòria (l’encastat): Compartir envia la ruta de l’app amb ?article=<id>, mai la de l’amfitrió', async () => {
    muntaAmb(MemoryRouter, { rutaInicial: '/app/lector/noticies/festes' }, '/pagina-de-l-amfitrio');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    /* El clic obri el detall dins del router de memòria; la barra d'adreces de l'amfitrió no es mou. */
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    const id = new URLSearchParams(ubicacio().split('?')[1]).get('article');
    expect(ubicacio()).toBe(`/app/lector/noticies/festes?article=${id}`);
    expect(window.location.pathname).toBe('/pagina-de-l-amfitrio');
    await act(async () => {
      fireEvent.click(barraBlava().getByRole('button', { name: 'Compartir' }));
    });
    const url = new URL(comparticions[0].url);
    expect(url.pathname).toBe('/app/lector/noticies/festes');
    expect(url.searchParams.get('article')).toBe(id);
    expect(comparticions[0].url).not.toMatch(/pagina-de-l-amfitrio/);
  });

  test('des de l’entrada de l’app (/noticies), la fila porta a la ruta canònica de «Hui», amb un sol pas', async () => {
    muntaAmb(BrowserRouter, {}, '/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    const id = new URLSearchParams(window.location.search).get('article');
    expect(window.location.pathname + window.location.search).toBe(`/app/lector/noticies/hui?article=${id}`);
    expect(push).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('F04 · cap autoria inventada a la fila', () => {
  test('sense font ni autor: la fila diu la data (i «Nou»), mai «Sóc de Poble»', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [primer] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    const adaptador = {
      ...llavor,
      llistaFonts: async () => {
        const { categories, fonts } = await llavor.llistaFonts();
        return { categories, fonts: fonts.filter((font) => font.id !== 'colla-dimonis') };
      },
      llistaArticles: async (opcions) => (await llavor.llistaArticles(opcions)).filter((article) => article.fontId !== 'colla-dimonis')
    };
    const entorn = prepara({ adaptador });
    await entorn.magatzem.desa({ llegits: [], despres: [{ ...primer, autor: null }], noSeguides: [] });
    munta('/app/lector/noticies/despres', entorn);
    await screen.findByRole('region', { name: 'Per a després' });
    await waitFor(() => expect(fitxa(CORREFOC)).toBeTruthy());
    expect(fitxa(CORREFOC).querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('11:30 03/10/26 · Nou');
    expect(document.getElementById('app-grid-list').textContent).not.toMatch(/Sóc de Poble/);
  });
});

describe('Esc · els modals propis es busquen a l’arrel de l’app (.sdp-root)', () => {
  test('un diàleg nostre obert fora de la closca bloqueja Esc; un de l’amfitrió, fora de .sdp-root, no', async () => {
    const entorn = prepara();
    preparaNavegador();
    window.history.replaceState(null, '', '/app/lector/noticies/hui');
    render(
      <UIProvider externalConfig={{}}>
        <BrowserRouter>
          <ProveidorPlataforma registre={entorn.registre} entorn={ENTORN}>
            <div className="sdp-root">
              <Routes>
                <Route path="/app/*" element={<RutaApps />} />
              </Routes>
            </div>
            <Ubicacio />
          </ProveidorPlataforma>
        </BrowserRouter>
      </UIProvider>
    );
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    /* El calaix del menú o el CalaixIdentitats: un <dialog> obert amb showModal, dins de
       .sdp-root però fora de la closca. */
    const calaix = document.createElement('dialog');
    calaix.setAttribute('open', '');
    document.querySelector('.sdp-root').append(calaix);
    const delAmfitrio = document.createElement('dialog');
    delAmfitrio.setAttribute('open', '');
    try {
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(ubicacio()).toMatch(/[?&]article=/);
      /* Tancat el nostre, un diàleg de l'amfitrió (fora de .sdp-root) no el bloqueja. */
      calaix.remove();
      document.body.append(delAmfitrio);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(ubicacio()).toBe('/app/lector/noticies/hui');
    } finally {
      calaix.remove();
      delAmfitrio.remove();
    }
  });
});

describe('Focus', () => {
  test('dins d’una ombra, el focus d’un camp de l’amfitrió no es furta; perdut dins de l’ombra, sí que es pot moure', () => {
    const host = document.createElement('div');
    const campAmfitrio = document.createElement('input');
    document.body.append(host, campAmfitrio);
    const ombra = host.attachShadow({ mode: 'open' });
    const columna = document.createElement('section');
    const titol = document.createElement('h1');
    titol.tabIndex = -1;
    const fora = document.createElement('button');
    columna.append(titol);
    ombra.append(columna, fora);
    try {
      /* El focus és a la pàgina amfitriona: l'arrel ombra diu null, però no és perdut. */
      campAmfitrio.focus();
      expect(ombra.activeElement).toBeNull();
      expect(focusLliure(titol, columna)).toBe(false);
      /* Perdut (cap element enfocat: el body): lliure. */
      campAmfitrio.blur();
      expect(focusLliure(titol, columna)).toBe(true);
      /* Dins de l'ombra: dins de la columna, lliure; fora, no. */
      titol.focus();
      expect(focusLliure(titol, columna)).toBe(true);
      fora.focus();
      expect(focusLliure(titol, columna)).toBe(false);
    } finally {
      host.remove();
      campAmfitrio.remove();
    }
  });

  test('des de l’entrada de l’app (el focus al contenidor de la closca): en obrir, l’H1; en tornar, la fila d’origen', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    /* El destí del focus del canvi de ruta (main#main-content a l'App): un avantpassat de la closca. */
    const contenidor = document.querySelector('.app-grid-page').parentElement;
    contenidor.tabIndex = -1;
    contenidor.focus();
    expect(document.activeElement).toBe(contenidor);
    /* Un clic de ratolí de Safari: no enfoca el botó de la fila. */
    fireEvent.click(fitxa(CORREFOC));
    const titol = await titolDelLector(CORREFOC);
    await waitFor(() => expect(document.activeElement).toBe(titol));
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    await waitFor(() => expect(document.activeElement).toBe(fitxa(CORREFOC)));
  });

  test('un focus de l’amfitrió no es furta en tancar: la fila no el reclama', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    const campAmfitrio = document.createElement('input');
    document.body.append(campAmfitrio);
    try {
      campAmfitrio.focus();
      /* L'amfitrió tanca l'article per la URL (l'arrere del navegador), amb el focus al seu camp. */
      await act(async () => { window.history.back(); });
      await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/hui'));
      expect(document.activeElement).toBe(campAmfitrio);
    } finally {
      campAmfitrio.remove();
    }
  });
});

/* Bloc 0 (261016) · Deroga l'arreglo 6 (les columnes de navegació de les notícies en
   UniversalCard): les carpetes i les fonts són l'arbre de l'espai, i la vora de la carpeta oberta
   de modules.css se'n va amb elles. «Les que seguixes», a la gestió de fonts, continua.
   Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05 i Gemini G2-01. «Les que
   seguixes» (UniversalCard amb boina taronja a la pàgina /fonts) se'n va amb la pàgina: la gestió de
   fonts és el diàleg de l'arbre, amb interruptors de Pedra Seca i cap targeta. */
describe('B0 · les notícies són l’espai de treball; la gestió de fonts, sense cap targeta', () => {
  test('cap UniversalCard a /noticies, ni la vora de la carpeta oberta de l’arreglo 6 al full', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    expect(document.querySelectorAll('.sp-card, .sdp-card-llista, .sdp-card-grid')).toHaveLength(0);
    expect(document.querySelectorAll('.sdp-gestor-llista')).toHaveLength(1);
    const MODULES = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(MODULES).not.toContain('[data-sdp-app="lector"]');
  });

  test('la gestió de fonts: un diàleg de l’arbre, cap targeta ni boina taronja, i les fonts per carpetes', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(screen.getByRole('button', { name: 'Gestiona les fonts' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Gestiona les fonts' });
    expect(dialeg.querySelectorAll('.sp-card, .sp-card-header, .sdp-card-llista, .sdp-card-grid, img')).toHaveLength(0);
    expect(within(dialeg).getAllByRole('group').map((grup) => grup.querySelector('legend')?.textContent))
      .toEqual(['Ajuntament i serveis', 'Cultura i festes', 'Camp i temps', 'Esports', 'Afig una font']);
    expect(within(within(dialeg).getByRole('group', { name: 'Camp i temps' })).getByRole('switch', { name: 'Cooperativa de l’Horta Vella' })).toBeTruthy();
  });
});
