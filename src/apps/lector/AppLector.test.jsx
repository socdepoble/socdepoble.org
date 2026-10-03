/* Notícies del Poble · l'app dins de la plataforma de veres (RutaApps →
   AppLector → ClosaAplicacio → AppGridShell), amb la llavor sintètica, un
   «ara» fix i el magatzem sobre el navegador fals de P2. Ample (1400 px) i
   estret (375 px). Totes les dades són inventades. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { validaTaulaDeClosa } from '../plataforma/index.js';
import { validaManifestApp } from '../plataforma/manifestApp.js';
import { ARA, munta, prepara, tancats } from './__fixtures__/muntaLector.jsx';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { NOM_BASE, STORE } from './magatzem.js';
import manifestLector from './manifest.js';
import { ICONES_CATEGORIA } from './nucli/index.js';
import { RUTES, esCarpeta, esFont } from './rutes.js';
import { NOMS_ICONES_CATEGORIA, iconaDeCategoria } from './vistes/icones.js';

const CORREFOC = 'El correfoc de les festes passarà pel barranc';
const ASSAIG = 'Assaig obert de tabals per a qui vulga provar';

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const columna = (id) => within(document.getElementById(id));
const esquerra = () => columna('app-grid-sidebar');
const mig = () => columna('app-grid-list');
const detall = () => columna('app-grid-main');
const closca = () => document.querySelector('.app-grid-shell');
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const files = () => [...document.getElementById('app-grid-main').querySelectorAll('button[data-article]')];
/* La fila d'una notícia pel nom accessible (el marcador d'inicials és decoració, aria-hidden). */
const fila = (titol) => detall().getByRole('button', { name: new RegExp(`^${titol}`) });
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];

/* Les classes que existixen: els fulls canònics, els de Pedra Seca i el de la closca. */
function classesConegudes() {
  const fulls = [
    ...readdirSync(path.join(process.cwd(), 'src/css')).filter((f) => f.endsWith('.css')).map((f) => `src/css/${f}`),
    'src/components/PedraSeca/pecesApps.css', 'src/components/PedraSeca/catalegColleccio.css', 'src/components/layout/AppGridShell.css'
  ];
  const text = fulls.map((f) => readFileSync(path.join(process.cwd(), f), 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  return new Set([...text.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  ambAmplada(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('el contracte amb la plataforma', () => {
  test('el manifest és vàlid i la taula de rutes passa validaTaulaDeClosa', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestLector);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(validaTaulaDeClosa(RUTES, manifest)).toEqual({ ok: true, errors: [] });
    expect(new Set(RUTES.map((ruta) => ruta.path.split('/')[0]))).toEqual(new Set(manifest.entrades.map((e) => e.slug)));
  });

  test('les icones de categoria: la llista tancada del nucli i la de la UI són la mateixa', () => {
    expect([...NOMS_ICONES_CATEGORIA].sort()).toEqual([...ICONES_CATEGORIA].sort());
    expect(iconaDeCategoria('toString')).toBeUndefined();
    expect(iconaDeCategoria(null)).toBeUndefined();
  });

  test('la carpeta i la font del camí: ids opacs; cap tram literal', () => {
    for (const valor of ['hui', 'despres', 'festes', 'cat-1']) expect(esCarpeta(valor), valor).toBe(true);
    for (const valor of ['fonts', 'totes', 'colleccio', 'Festes', '..', '']) expect(esCarpeta(valor), valor).toBe(false);
    for (const valor of ['veu-placa', 'radio']) expect(esFont(valor), valor).toBe(true);
    for (const valor of ['fonts', 'totes', 'hui', 'despres', 'A']) expect(esFont(valor), valor).toBe(false);
  });
});

describe('en ample: carpetes, fonts i notícies de costat', () => {
  test('«Hui» per defecte: carpetes amb comptadors, fonts de totes les carpetes i les notícies per seccions', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    expect(closca().dataset.layout).toBe('ample');
    const hui = esquerra().getByRole('link', { name: /^Hui/ });
    expect(hui.getAttribute('aria-current')).toBe('true');
    expect(hui.getAttribute('href')).toBe('/app/lector/noticies/hui');
    expect(hui.textContent).toBe('Hui 6 sense llegir');
    expect(esquerra().getByRole('link', { name: /^Per a després/ }).textContent).toBe('Per a després 0 desades');
    expect(esquerra().getByRole('link', { name: /^Cultura i festes/ }).getAttribute('href')).toBe('/app/lector/noticies/festes');
    expect(mig().getByRole('link', { name: /^Totes les fonts/ }).getAttribute('aria-current')).toBe('true');
    expect(files()).toHaveLength(6);
    expect(detall().getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Ajuntament i serveis 3 notícies', 'Cultura i festes 1 notícia', 'Camp i temps 1 notícia', 'Esports 1 notícia'
    ]);
    /* En ample el mig es veu al costat: ni «Torna» a les carpetes ni les fonts i el ✓ repetits al detall. */
    expect(esquerra().queryByRole('button', { name: 'Torna' })).toBeNull();
    expect(detall().queryByRole('link', { name: 'Fonts' })).toBeNull();
    expect(detall().queryByRole('button', { name: 'Marca-ho tot com a llegit' })).toBeNull();
    expect(mig().getByRole('button', { name: 'Marca-ho tot com a llegit' }).disabled).toBe(false);
  });

  test('la targeta horitzontal: miniatura 16:9, títol, «font · fragment», hora relativa, «Nou» i cap imatge de fora', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const boto = detall().getByRole('button', {
      name: /^El correfoc de les festes passarà pel barranc Colla de Dimonis de la Font Vella · Enguany el correfoc eixirà .+ fa 1 h$/
    });
    expect(boto.querySelector('[aria-hidden="true"]').textContent).toBe('EC');
    const element = boto.closest('li');
    expect(within(element).getByText('Nou')).toBeTruthy();
    /* Les imatges de la llavor són d'example.org, que l'amfitrió no ha permés: el marcador de Pedra Seca,
       dins de la variant panoràmica (l'excepció 16:9 del Lector, DISSENY §7). */
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(boto.querySelector('.sdp-llista-articles__quadrat > .sdp-marca-article')).not.toBeNull();
    expect(boto.closest('.sdp-panoramica')).not.toBeNull();
    expect(files().every((targeta) => targeta.closest('.sdp-panoramica'))).toBe(true);
  });

  test('una categoria i una font: el camí, el títol del panell i les notícies', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(esquerra().getByRole('link', { name: /^Cultura i festes/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    expect(files()).toHaveLength(3);
    fireEvent.click(mig().getByRole('link', { name: /^Colla de Dimonis de la Font Vella/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes/colla-dimonis');
    await screen.findByRole('region', { name: 'Colla de Dimonis de la Font Vella' });
    expect(files()).toHaveLength(3);
  });

  test('la vista «Targetes»: rajoles amb la imatge 16:9 damunt del títol i ?vista=graella', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(detall().getByRole('button', { name: 'Targetes' }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes?vista=graella');
    expect(files().every((boto) => boto.classList.contains('sdp-rajola'))).toBe(true);
    expect(files()).toHaveLength(3);
    /* Sense origen permés, el marcador ocupa el marc 16:9 de la variant panoràmica. */
    expect(files().every((boto) => boto.closest('.sdp-panoramica') && boto.querySelector('.sdp-rajola__media > .sdp-marca-article'))).toBe(true);
  });

  test('una carpeta que no existix ho diu i porta a «Hui»', async () => {
    munta('/app/lector/noticies/inventada');
    expect(await screen.findByText('Esta carpeta no existix')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ves a Hui' }).getAttribute('href')).toBe('/app/lector/noticies/hui');
  });
});

describe('la lectura immersiva', () => {
  test('obrir una targeta: l’article ocupa el panell, les barres laterals es queden, el focus va al títol i queda llegida', async () => {
    const { idb } = munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.article;
    fireEvent.click(fila(CORREFOC));
    expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${id}`);
    const titol = await detall().findByRole('heading', { level: 2, name: CORREFOC });
    expect(document.activeElement).toBe(titol);
    expect(files()).toHaveLength(0);
    expect(document.getElementById('app-grid-sidebar').hasAttribute('inert')).toBe(false);
    expect(document.getElementById('app-grid-list').hasAttribute('inert')).toBe(false);
    expect(esquerra().getByRole('link', { name: /^Hui/ }).textContent).toBe('Hui 5 sense llegir');
    const lectura = titol.closest('article');
    expect(lectura.classList.contains('sdp-centre')).toBe(true);
    const meta = lectura.querySelector('p.lead');
    expect(meta.textContent).toMatch(/Colla de Dimonis de la Font Vella · La colla · 3 d’octubre de 2026, 11:30$/);
    expect(meta.querySelector('time').getAttribute('datetime')).toBe('2026-10-03T09:30:00.000Z');
    expect(within(lectura).getByRole('heading', { level: 3, name: 'Recomanacions' })).toBeTruthy();
    expect(within(lectura).getAllByRole('listitem')).toHaveLength(3);
    await waitFor(() => expect(desat(idb)?.llegits).toEqual([id]));
  });

  test('l’aspa tanca: torna la graella, el focus a la targeta i la insígnia «Nou» ja no hi és', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.article;
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    const aspa = detall().getByRole('button', { name: 'Tanca l’article' });
    /* Com a Feedly: l'aspa a l'esquerra de la barra, davant del nom de la font. */
    const nomFont = detall().getByText('Colla de Dimonis de la Font Vella', { selector: '.app-grid-col-header__titol' });
    expect(aspa.compareDocumentPosition(nomFont) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(aspa);
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    await waitFor(() => expect(document.activeElement?.dataset.article).toBe(id));
    expect(within(fila(CORREFOC).closest('li')).queryByText('Nou')).toBeNull();
  });

  test('Esc també tanca, i arrere del navegador torna a la mateixa graella', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    const id = fila(ASSAIG).dataset.article;
    fireEvent.click(fila(ASSAIG));
    const titol = await detall().findByRole('heading', { level: 2, name: ASSAIG });
    fireEvent.keyDown(titol, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(document.activeElement?.dataset.article).toBe(id));
    fireEvent.click(fila(ASSAIG));
    await detall().findByRole('heading', { level: 2, name: ASSAIG });
    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/festes'));
    await waitFor(() => expect(document.activeElement?.dataset.article).toBe(id));
  });

  test('Esc tanca des del mig i amb el focus perdut; no des d’un camp de text', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    /* Un camp de text dins de la closca: Esc és seu. */
    const camp = document.createElement('input');
    document.getElementById('app-grid-list').append(camp);
    fireEvent.keyDown(camp, { key: 'Escape' });
    camp.remove();
    expect(ubicacio()).toMatch(/[?&]article=/);
    /* Des de «Marca-ho tot com a llegit», al mig. */
    const marca = mig().getByRole('button', { name: 'Marca-ho tot com a llegit' });
    marca.focus();
    fireEvent.keyDown(marca, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    /* Amb el focus perdut (un clic on no s'enfoca res). */
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
  });

  test('tancar torna la graella on era; canviar de carpeta amb l’article obert comença de dalt', async () => {
    vi.spyOn(Element.prototype, 'scrollTop', 'get').mockReturnValue(240);
    const posa = vi.spyOn(Element.prototype, 'scrollTop', 'set');
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    await waitFor(() => expect(posa).toHaveBeenCalledWith(240));
    /* El cos de la graella (la regió amb nom de MarcColumna), no cap altre element. */
    expect(posa.mock.contexts.at(-1)).toBe(screen.getByRole('region', { name: 'Hui' }));
    posa.mockClear();
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    fireEvent.click(esquerra().getByRole('link', { name: /^Esports/ }));
    await screen.findByRole('region', { name: 'Esports' });
    expect(files()).toHaveLength(3);
    expect(posa).not.toHaveBeenCalled();
  });

  test('«Visita el lloc web» és un enllaç de veres a una pestanya nova, sense referent ni opener', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    const enllac = detall().getByRole('link', { name: 'Visita el lloc web (s’obri en una pestanya nova)' });
    expect(enllac.getAttribute('href')).toBe('https://example.org/colla-dimonis/correfoc-barranc');
    expect(enllac.getAttribute('target')).toBe('_blank');
    expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
    for (const a of detall().getAllByRole('link')) {
      expect(a.getAttribute('rel'), a.textContent).toBe('noopener noreferrer');
      expect(a.getAttribute('target'), a.textContent).toBe('_blank');
    }
  });

  test('Pedra Seca pura: cap style=, cap imatge de fora i cap classe que no existisca, al lector i a la graella', async () => {
    const conegudes = classesConegudes();
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const graella = document.getElementById('app-grid-main');
    const revisa = (arrel) => {
      expect(arrel.querySelectorAll('[style]')).toHaveLength(0);
      for (const img of arrel.querySelectorAll('img')) expect(img.getAttribute('src')).not.toMatch(/^(?:https?:)?\/\//);
      const classes = [...arrel.querySelectorAll('[class]')].flatMap((el) => [...el.classList]);
      expect(classes.length).toBeGreaterThan(5);
      expect(classes.filter((classe) => !conegudes.has(classe) && !classe.startsWith('lucide'))).toEqual([]);
    };
    revisa(graella);
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    revisa(graella);
  });

  test('un article amb vídeos: l’avís de privacitat; i «Marca com a no llegit»', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(fila(ASSAIG));
    await detall().findByRole('heading', { level: 2, name: ASSAIG });
    expect(detall().getByText('Imatges i vídeos a part')).toBeTruthy();
    expect(detall().getByText('Al final hi haurà coca i mistela.')).toBeTruthy();
    await waitFor(() => expect(esquerra().getByRole('link', { name: /^Cultura i festes/ }).textContent).toBe('Cultura i festes 2 sense llegir'));
    fireEvent.click(detall().getByRole('button', { name: 'Marca com a no llegit' }));
    expect(esquerra().getByRole('link', { name: /^Cultura i festes/ }).textContent).toBe('Cultura i festes 3 sense llegir');
  });

  test('«Desa per a després»: la carpeta el compta, es desa al disc i s’hi llig encara que la font ja no el servisca', async () => {
    const entorn = prepara();
    const { idb } = munta('/app/lector/noticies/hui', entorn);
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.article;
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    const desa = detall().getByRole('button', { name: 'Desa per a després' });
    expect(desa.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(desa);
    expect(detall().getByRole('button', { name: 'Desa per a després' }).getAttribute('aria-pressed')).toBe('true');
    expect(esquerra().getByRole('link', { name: /^Per a després/ }).textContent).toBe('Per a després 1 desada');
    await waitFor(() => expect(desat(idb)?.despres.map((d) => d.id)).toEqual([id]));
    fireEvent.click(esquerra().getByRole('link', { name: /^Per a després/ }));
    await screen.findByRole('region', { name: 'Per a després' });
    expect(within(fila(CORREFOC).closest('li')).getByText('Desat per a després')).toBeTruthy();
  });

  test('una notícia que la font ja no servix sencera es llig del resum, i ho diu', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    munta('/app/lector/noticies/festes', prepara({ adaptador: { ...llavor, article: async () => null } }));
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    expect(detall().getByText('Només el resum')).toBeTruthy();
    expect(detall().getByText(/^Enguany el correfoc eixirà de la Font Vella/)).toBeTruthy();
  });

  test('carregant i error de l’article; un enllaç a /noticies?article= es canonitza a «Hui»', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [primer] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    let falla = true;
    const adaptador = { ...llavor, article: (id) => (falla ? Promise.reject(new Error('caigut')) : llavor.article(id)) };
    munta(`/app/lector/noticies?article=${primer.id}`, prepara({ adaptador }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${primer.id}`));
    expect(await screen.findByText('No s’ha pogut obrir l’article')).toBeTruthy();
    falla = false;
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    expect(await detall().findByRole('heading', { level: 2, name: CORREFOC })).toBeTruthy();
  });
});

describe('els estats del port', () => {
  test('carregant: cada columna ho diu', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const adaptador = { ...llavor, llistaArticles: () => new Promise(() => {}) };
    munta('/app/lector/noticies/hui', prepara({ adaptador }));
    expect(await screen.findByText('Carregant les notícies…')).toBeTruthy();
    expect(detall().getByRole('status').textContent).toBe('Carregant les notícies…');
  });

  test('error: ho diu i «Torna-ho a provar» torna a demanar-ho', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    let falla = true;
    const adaptador = { ...llavor, llistaFonts: () => (falla ? Promise.reject(new Error('caigut')) : llavor.llistaFonts()) };
    munta('/app/lector/noticies/hui', prepara({ adaptador }));
    expect(await screen.findByText('No s’han pogut carregar les notícies')).toBeTruthy();
    falla = false;
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(files()).toHaveLength(6));
  });

  test('sense base local, l’avís de memòria a les carpetes', async () => {
    munta('/app/lector/noticies/hui', prepara({ sensebase: true }));
    await screen.findByRole('region', { name: 'Hui' });
    expect(esquerra().getByText('Només en la memòria')).toBeTruthy();
  });
});

describe('les fonts que se seguixen', () => {
  test('el catàleg: totes seguides; tocar-ne una la deixa de seguir, es desa i «Hui» ja no en porta', async () => {
    const { idb } = munta('/app/lector/fonts');
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const cooperativa = detall().getByRole('button', { name: /^Cooperativa de l’Horta Vella/ });
    expect(cooperativa.getAttribute('aria-pressed')).toBe('true');
    /* Els logos de les fonts són quadrats: l'excepció 16:9 és només per a les notícies. */
    expect(document.querySelector('.sdp-panoramica')).toBeNull();
    expect(mig().getByRole('link', { name: /^Cooperativa de l’Horta Vella/ }).getAttribute('href')).toBe('/app/lector/noticies/camp/cooperativa');
    fireEvent.click(cooperativa);
    expect(detall().getByRole('button', { name: /^Cooperativa de l’Horta Vella/ }).getAttribute('aria-pressed')).toBe('false');
    expect(mig().queryByRole('link', { name: /^Cooperativa de l’Horta Vella/ })).toBeNull();
    await waitFor(() => expect(desat(idb)?.noSeguides).toEqual(['cooperativa']));
    window.history.pushState(null, '', '/app/lector/noticies/hui');
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate')); });
    await screen.findByRole('region', { name: 'Hui' });
    expect(files()).toHaveLength(5);
    expect(esquerra().getByRole('link', { name: /^Camp i temps/ }).textContent).toBe('Camp i temps 0 tot llegit');
  });
});

describe('en mitjana (800 px): fonts i notícies de costat, les carpetes en panell', () => {
  beforeEach(() => { ambAmplada(800); });

  test('l’obridor «Carpetes» obri el panell; triar-ne una navega i el tanca; llegint, les fonts es queden', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    expect(document.getElementById('app-grid-sidebar').hasAttribute('inert')).toBe(true);
    const obridor = detall().getByRole('button', { name: 'Carpetes' });
    expect(obridor.dataset.obriColumna).toBe('esquerra');
    fireEvent.click(obridor);
    expect(closca().dataset.panell).toBe('left');
    fireEvent.click(esquerra().getByRole('link', { name: /^Cultura i festes/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    expect(document.getElementById('app-grid-list').hasAttribute('inert')).toBe(false);
  });

  test('«Torna» tanca el panell de les carpetes sense navegar i el focus torna a l’obridor', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    fireEvent.click(detall().getByRole('button', { name: 'Carpetes' }));
    expect(closca().dataset.panell).toBe('left');
    const torna = esquerra().getByRole('button', { name: 'Torna' });
    torna.focus();
    fireEvent.click(torna);
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    expect(document.activeElement?.dataset.obriColumna).toBe('esquerra');
  });

  test('amb el panell de les carpetes obert, Esc no tanca l’article que queda davall', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    fireEvent.click(fila(CORREFOC));
    await detall().findByRole('heading', { level: 2, name: CORREFOC });
    /* Llegint, l'obridor és el de les fonts, al mig (el lector no en porta). */
    fireEvent.click(mig().getByRole('button', { name: 'Carpetes' }));
    expect(closca().dataset.panell).toBe('left');
    fireEvent.keyDown(esquerra().getByRole('button', { name: 'Torna' }), { key: 'Escape' });
    expect(ubicacio()).toMatch(/[?&]article=/);
  });
});

describe('en estret (375 px): una columna, la que diu la ruta', () => {
  beforeEach(() => { ambAmplada(375); });

  test('/noticies: les carpetes; una categoria porta a les seues fonts; «Hui», a les notícies', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Carpetes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(closca().dataset.panell).toBe('left');
    expect(esquerra().getByRole('link', { name: /^Cultura i festes/ }).getAttribute('href')).toBe('/app/lector/noticies/festes/fonts');
    fireEvent.click(esquerra().getByRole('link', { name: /^Cultura i festes/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes/fonts');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    fireEvent.click(mig().getByRole('link', { name: /^Totes les fonts/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(detall().getByRole('button', { name: 'Carpetes' }).getAttribute('aria-controls')).toBe('app-grid-sidebar');
  });

  test('a /noticies les carpetes són la pàgina: sense «Torna»', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Carpetes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(esquerra().queryByRole('button', { name: 'Torna' })).toBeNull();
  });

  test('«Hui»: el detall porta «Marca-ho tot com a llegit» (el ✓ de Feedly) i l’enllaç a les fonts de la carpeta', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(closca().dataset.panell).toBe('');
    expect(detall().getAllByText('Nou')).toHaveLength(6);
    fireEvent.click(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }));
    expect(detall().queryAllByText('Nou')).toHaveLength(0);
    expect(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }).disabled).toBe(true);
    const fonts = detall().getByRole('link', { name: 'Fonts' });
    expect(fonts.getAttribute('href')).toBe('/app/lector/noticies/hui/fonts');
    fireEvent.click(fonts);
    expect(ubicacio()).toBe('/app/lector/noticies/hui/fonts');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    expect(mig().getByRole('link', { name: /^Totes les fonts/ }).textContent).toBe('Totes les fonts 0 tot llegit');
  });

  test('a les notícies d’una font, també: l’enllaç porta a les fonts de la carpeta', async () => {
    munta('/app/lector/noticies/festes/colla-dimonis');
    await screen.findByRole('region', { name: 'Colla de Dimonis de la Font Vella' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(detall().getByRole('link', { name: 'Fonts' }).getAttribute('href')).toBe('/app/lector/noticies/festes/fonts');
    expect(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }).disabled).toBe(false);
  });
});

describe('sense port i sense llavor (producció)', () => {
  test('cap notícia inventada: l’app ho diu i no munta la closca', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_SDP_LECTOR_LLAVOR', '0');
    vi.resetModules();
    try {
      const { default: AppSenseLlavor } = await import('./AppLector.jsx');
      render(<AppSenseLlavor />);
      expect(screen.getByText('Encara no hi ha cap font connectada')).toBeTruthy();
      expect(document.querySelector('.app-grid-shell')).toBeNull();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
