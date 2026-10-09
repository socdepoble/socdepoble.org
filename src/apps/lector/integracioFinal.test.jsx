/* Notícies del Poble · la integració final de la nit del 261004 (front «lector-nevera»).
   Cada prova fallaria sense el seu arreglo:
     F05  Compartir des de la targeta envia el detall (?article=<id>), amb la base del router de
          navegador i amb el router de memòria; des del detall, el mateix article. Una sola
          navegació en obrir.
     F04  La targeta de notícia porta subtítol real; sense font ni autor, cap boina buida.
     Esc  Un diàleg nostre obert fora de la closca (dins de .sdp-root) el bloqueja; un de
          l'amfitrió (fora de .sdp-root), no.
     Focus  El de l'amfitrió no es furta; des de l'entrada de l'app, l'H1 el rep en obrir i la
          targeta d'origen, en tornar.
     A6   Les columnes de navegació són UniversalCard amb boina, títol, subtítol i entradeta.
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
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';

const CORREFOC = 'El correfoc de les festes passarà pel barranc';
const detall = () => within(document.getElementById('app-grid-main'));
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const fila = (titol) => detall().getByRole('link', { name: titol });
const targetaDe = (titol) => fila(titol).closest('article.sp-card');
const titolDelLector = (titol) => detall().findByRole('heading', { level: 1, name: titol });

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
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
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

describe('F05 · Compartir una notícia compartix el seu detall, no la llista', () => {
  test('router de navegador amb base: la targeta enllaça el detall i Compartir envia ?article=<id> amb la base; el detall, el mateix', async () => {
    muntaAmb(BrowserRouter, { basename: '/sdp' }, '/sdp/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.element;
    /* L'element principal és un enllaç de veres al detall, amb la base (pestanya nova inclosa). */
    expect(fila(CORREFOC).getAttribute('href')).toBe(`/sdp/app/lector/noticies/hui?article=${id}`);
    await act(async () => {
      fireEvent.click(within(targetaDe(CORREFOC)).getByRole('button', { name: `Compartir ${CORREFOC}` }));
    });
    expect(comparticions).toHaveLength(1);
    const url = new URL(comparticions[0].url);
    expect(url.pathname).toBe('/sdp/app/lector/noticies/hui');
    expect(url.searchParams.get('article')).toBe(id);
    /* Obrir: una sola navegació (cap canonització ni doble push). */
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    expect(push).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.search).toBe(`/sdp/app/lector/noticies/hui?article=${id}`);
    /* Des del detall, Compartir de la barra blava envia el mateix article. */
    await act(async () => {
      fireEvent.click(detall().getByRole('button', { name: 'Compartir' }));
    });
    expect(comparticions).toHaveLength(2);
    expect(new URL(comparticions[1].url).searchParams.get('article')).toBe(id);
    expect(new URL(comparticions[1].url).pathname).toBe('/sdp/app/lector/noticies/hui');
  });

  test('router de memòria (l’encastat): Compartir envia la ruta de l’app amb ?article=<id>, mai la de l’amfitrió', async () => {
    muntaAmb(MemoryRouter, { rutaInicial: '/app/lector/noticies/festes' }, '/pagina-de-l-amfitrio');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    const id = fila(CORREFOC).dataset.element;
    await act(async () => {
      fireEvent.click(within(targetaDe(CORREFOC)).getByRole('button', { name: `Compartir ${CORREFOC}` }));
    });
    const url = new URL(comparticions[0].url);
    expect(url.pathname).toBe('/app/lector/noticies/festes');
    expect(url.searchParams.get('article')).toBe(id);
    expect(comparticions[0].url).not.toMatch(/pagina-de-l-amfitrio/);
    /* El clic obri el detall dins del router de memòria; la barra d'adreces de l'amfitrió no es mou. */
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    expect(ubicacio()).toBe(`/app/lector/noticies/festes?article=${id}`);
    expect(window.location.pathname).toBe('/pagina-de-l-amfitrio');
    await act(async () => {
      fireEvent.click(detall().getByRole('button', { name: 'Compartir' }));
    });
    expect(new URL(comparticions[1].url).searchParams.get('article')).toBe(id);
    expect(new URL(comparticions[1].url).pathname).toBe('/app/lector/noticies/festes');
  });

  test('des de l’entrada de l’app (/noticies), la targeta porta a la ruta canònica de «Hui»', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.element;
    expect(fila(CORREFOC).getAttribute('href')).toBe(`/app/lector/noticies/hui?article=${id}`);
  });
});

describe('F04 · l’anatomia de la targeta de notícia, amb dades reals', () => {
  test('sense font ni autor: cap boina buida (excepció de dades externes absents) i la data, al subtítol', async () => {
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
    const targeta = (await detall().findByRole('link', { name: CORREFOC })).closest('article.sp-card');
    /* Ni el nom en blanc ni «Sóc de Poble»: la capçalera taronja no es pinta. */
    expect(targeta.querySelector('header.sp-card-header')).toBeNull();
    expect(targeta.textContent).not.toMatch(/Sóc de Poble/);
    /* La data de l'article (real) passa al subtítol: no es perd. */
    expect(targeta.querySelector('.sp-card-subtitle').textContent).toBe('3 d’octubre de 2026, 11:30');
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
    fireEvent.click(fila(CORREFOC));
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

  test('des de l’entrada de l’app (el focus al contenidor de la closca): en obrir, l’H1; en tornar, la targeta d’origen', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    /* El destí del focus del canvi de ruta (main#main-content a l'App): un avantpassat de la closca. */
    const contenidor = document.querySelector('.app-grid-page').parentElement;
    contenidor.tabIndex = -1;
    contenidor.focus();
    expect(document.activeElement).toBe(contenidor);
    const id = fila(CORREFOC).dataset.element;
    /* Un clic de ratolí de Safari: no enfoca l'enllaç. */
    fireEvent.click(fila(CORREFOC));
    const titol = await titolDelLector(CORREFOC);
    await waitFor(() => expect(document.activeElement).toBe(titol));
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    await waitFor(() => expect(document.activeElement?.dataset.element).toBe(id));
  });
});

/* Arreglo 6 i arreglo del verificador (ordre del Mestre, 261004, «front roig i verificació
   emmascarada») · Les columnes de navegació (Carpetes, Fonts i «Les que seguixes») són
   UniversalCard: boina, títol, subtítol i entradeta, amb dades reals de la llavor. L'element
   principal es diu exactament com el títol (cap inicial de reserva colada al nom) i el comptador
   n'és la descripció. Cap llista ni classe del Workspace. */
describe('Arreglo 6 · les columnes de navegació són UniversalCard', () => {
  const columna = (id) => within(document.getElementById(id));
  const descripcio = (enllac) => document.getElementById(enllac.getAttribute('aria-describedby'))?.textContent ?? null;
  const text = (targeta, classe) => targeta.querySelector(classe)?.textContent ?? null;

  test('Carpetes: la boina de l’app, el nom, el comptador i què és la carpeta', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    const hui = await columna('app-grid-sidebar').findByRole('link', { name: 'Hui' });
    expect(hui.getAttribute('aria-current')).toBe('true');
    expect(hui.getAttribute('href')).toBe('/app/lector/noticies/hui');
    expect(descripcio(hui)).toBe('6 sense llegir');
    const targeta = hui.closest('article.sp-card');
    /* La targeta de sempre (amb el seu fons): la columna de les carpetes és fosca i la plana, sense
       fons, no s'hi llegia (comprovat al navegador). */
    expect(targeta.className).toBe('sp-card');
    expect([...targeta.children].map((e) => e.className)).toEqual(['sp-card-header', 'sp-card-link-overlay', 'sp-card-body', 'sp-card-footer']);
    /* La boina: les carpetes són de l'app, que signa Sóc de Poble (Onada 8: porta al seu perfil). */
    const boina = within(targeta.querySelector('header.sp-card-header'));
    expect(boina.getByRole('link', { name: /^Sóc de Poble/ }).getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
    expect(text(targeta, '.sp-card-title')).toBe('Hui');
    expect(text(targeta, '.sp-card-subtitle')).toBe('6 sense llegir');
    expect(text(targeta, '.sp-card-text')).toBe('Les notícies de les últimes 24 hores de les fonts que seguixes');
    const festes = columna('app-grid-sidebar').getByRole('link', { name: 'Cultura i festes' }).closest('article.sp-card');
    expect(text(festes, '.sp-card-text')).toBe('1 font que seguixes');
    /* La graella de Pedra Seca en columna; res de la llista del Workspace. */
    expect(columna('app-grid-sidebar').getByRole('group', { name: 'Carpetes' }).className).toBe('sdp-card-llista');
    expect(document.querySelector('.sdp-gestor-llista, .sdp-gestor-fitxa')).toBeNull();
    /* La carpeta oberta es veu (la vora del bloc del front a modules.css) i el selector casa amb ella. */
    const MODULES = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
    const inici = MODULES.indexOf('Front «lector-nevera».');
    const bloc = MODULES.slice(MODULES.indexOf('@layer components {', inici), MODULES.indexOf('\n}\n', inici) + 2);
    const ACTIVA = '[data-sdp-app="lector"] .sdp-card-llista > .sp-card > .sp-card-link-overlay[aria-current="true"]';
    expect(bloc).toContain(`${ACTIVA}:not(:focus-visible) {\n    box-shadow: 0 0 0 var(--sdp-space-1) var(--sdp-accio) inset;`);
    expect([...document.getElementById('app-grid-sidebar').querySelectorAll(ACTIVA)]).toEqual([hui]);
  });

  test('Fonts i «Les que seguixes»: la font signa la seua targeta (sense enllaç: la targeta ja hi porta) i la descriu', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    const totes = (await columna('app-grid-list').findByRole('link', { name: 'Totes les fonts' })).closest('article.sp-card');
    expect(text(totes, '.sp-card-author-name')).toBe('Sóc de Poble');
    expect(text(totes, '.sp-card-text')).toBe('5 fonts que seguixes');
    const colla = columna('app-grid-list').getByRole('link', { name: 'Colla de Dimonis de la Font Vella' });
    expect(colla.getAttribute('href')).toBe('/app/lector/noticies/hui/colla-dimonis');
    const targeta = colla.closest('article.sp-card');
    const boina = targeta.querySelector('header.sp-card-header');
    expect(text(boina, '.sp-card-author-name')).toBe('Colla de Dimonis de la Font Vella');
    expect(within(boina).queryByRole('link')).toBeNull();
    expect(text(targeta, '.sp-card-text')).toBe('Foc, tabals i festa.');
    cleanup();
    munta('/app/lector/fonts');
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const seguida = (await columna('app-grid-list').findByRole('link', { name: 'Cooperativa de l’Horta Vella' })).closest('article.sp-card');
    expect(text(seguida, '.sp-card-author-name')).toBe('Cooperativa de l’Horta Vella');
    expect(text(seguida, '.sp-card-text')).toBe('La collita, els preus i el temps.');
    expect(columna('app-grid-list').getByRole('group', { name: 'Les que seguixes' }).className).toBe('sdp-card-llista');
  });
});
