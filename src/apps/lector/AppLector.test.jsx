/* Notícies del Poble · l'app dins de la plataforma de veres (RutaApps →
   AppLector → l'espai de treball per a /noticies i ClosaAplicacio per a
   /fonts, sobre AppGridShell), amb la llavor sintètica, un «ara» fix i el
   magatzem sobre el navegador fals de P2. Ample (1400 px) i mitjana (800 px).
   Totes les dades són inventades.
   Bloc 0 del Gauntlet (ordre del Mestre, 261016, prompt 261016_0015) · Les
   notícies ja no són columnes pròpies de UniversalCard: són l'espai de treball
   del Bloc de notes. Les proves de l'arbre, de la llista, de la selecció per
   URL, de «Marca-ho tot com a llegit», dels estats del port i de l'estret
   viuen a espaiNoticies.test.jsx. Ací queden, adaptades a posta (s'obri des de
   la fila de la llista, no des de la targeta), les de la lectura immersiva, la
   gestió de fonts i l'instant de la vista. Les que fixaven la graella, les
   targetes de notícia, la Revista i les Targetes, els obridors de columna i
   «Torna» queden derogades: eixes peces ja no hi són.
   261024 (Lector) · Ordre del Mestre de les 15:05: la gestió de fonts deixa de
   ser una pàgina (ClosaAplicacio de /fonts) i passa a l'arbre (el diàleg
   «Gestiona les fonts»); les proves de la gestió s'hi adapten a posta. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { validaManifestApp } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import { ARA, munta, prepara, tancats } from './__fixtures__/muntaLector.jsx';
import AppLector from './AppLector.jsx';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { NOM_BASE, STORE } from './magatzem.js';
import manifestLector from './manifest.js';
import { FINESTRA_HUI, ICONES_CATEGORIA, esDeHui, msDeData, senseFinal } from './nucli/index.js';
import { esCarpeta, esFont } from './rutes.js';
import { NOMS_ICONES_CATEGORIA, iconaDeCategoria } from './vistes/icones.js';

const CORREFOC = 'El correfoc de les festes passarà pel barranc';
const ASSAIG = 'Assaig obert de tabals per a qui vulga provar';

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const columna = (id) => within(document.getElementById(id));
const mig = () => columna('app-grid-list');
const detall = () => columna('app-grid-main');
const closca = () => document.querySelector('.app-grid-shell');
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
/* Bloc 0 (261016) · La fila de la llista: la fitxa per defecte de l'espai (DefaultItemCard). */
const fitxes = () => [...document.getElementById('app-grid-list').querySelectorAll('button.sdp-gestor-fitxa')];
const fitxa = (titol) => fitxes().find((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent === titol);
const subtitolDe = (titol) => fitxa(titol).querySelector('.sdp-gestor-fitxa__subtitol').textContent;
const idDeLaUrl = () => new URLSearchParams(window.location.search).get('article');
/* Una fila de l'arbre pel seu nom, i el que s'hi veu: el nom i la xifra del recompte. */
const filaDeLArbre = (nom) => within(document.querySelector('#app-grid-sidebar nav.sdp-workspace-column__body'))
  .getByRole('button', { name: new RegExp(`^${nom}(?: \\d+ sense llegir)?$`) });
const recompteDe = (nom) => filaDeLArbre(nom).querySelector('.sdp-insignia [aria-hidden="true"]')?.textContent ?? null;
/* El detall és la Pàgina Universal: l'H1 (dins del detall) i l'article de la pàgina (el cos). */
async function titolDelLector(titol) {
  const h1 = await screen.findByRole('heading', { level: 1, name: titol });
  expect(document.getElementById('app-grid-main').contains(h1)).toBe(true);
  return h1;
}
const cosDelLector = () => document.getElementById('app-grid-main').querySelector('article.content-wrapper');
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];
/* Obri una notícia des de la seua fila i n'espera l'H1. */
async function obri(titol) {
  fireEvent.click(fitxa(titol));
  return titolDelLector(titol);
}

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
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
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
  /* Bloc 0 (261016) · Actualitzada a posta: la taula de ClosaAplicacio ja només porta la gestió
     de fonts; les notícies tenen la seua (RUTES_NOTICIES, sense columnes) i la cobertura de les
     entrades del manifest es comprova amb les dues (espaiNoticies.test.jsx).
     Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, «adeu a la pàgina inflada
     de /app/lector/fonts»: el manifest porta una sola entrada, les notícies, i l'app ja no porta
     cap taula de ClosaAplicacio. Les rutes de notícies cobrixen l'entrada (espaiNoticies.test.jsx). */
  test('el manifest és vàlid, amb una sola entrada: les notícies', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestLector);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(manifest.entrades.map((entrada) => entrada.slug)).toEqual(['noticies']);
    expect(manifest.entradaPerDefecte).toBe('noticies');
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

describe('la lectura immersiva', () => {
  test('obrir una fila: l’article ocupa el detall, l’arbre i la llista es queden, el focus va al títol i queda llegida', async () => {
    const { idb } = munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const titol = await obri(CORREFOC);
    const id = idDeLaUrl();
    expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${id}`);
    expect(document.activeElement).toBe(titol);
    expect(document.getElementById('app-grid-sidebar').hasAttribute('inert')).toBe(false);
    expect(document.getElementById('app-grid-list').hasAttribute('inert')).toBe(false);
    expect(recompteDe('Hui')).toBe('5');
    /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515; D-A) · El títol propi (h2 i
       p.lead dins de .sdp-centre) ja no hi és: la Pàgina Universal de les apps (PaginaApp), amb la
       doble barra, l'H1 dins de header.page-title i el cos a l'article de la pàgina. */
    const pagina = titol.closest('.sdp-universal-page-container');
    expect([...pagina.children].map((e) => e.className)).toEqual(['bar-blue', 'bar-orange', 'page-title', 'content-wrapper']);
    expect(titol.parentElement.matches('header.page-title')).toBe(true);
    expect(detall().getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.querySelector('.sdp-centre, p.lead')).toBeNull();
    /* La boina: la font (porta a les seues notícies), l'autor de l'article i la data en text. */
    const boina = pagina.querySelector('section.bar-orange');
    expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Colla de Dimonis de la Font Vella');
    expect(boina.querySelector('.sp-card-author-location').textContent).toBe('La colla');
    expect(boina.querySelector('a.sp-card-author').getAttribute('href')).toBe('/app/lector/noticies/festes/colla-dimonis');
    const data = boina.querySelector('time.btn-date-time');
    expect(data.getAttribute('datetime')).toBe('2026-10-03T09:30:00.000Z');
    expect([...data.children].map((e) => e.textContent)).toEqual(['11:30', '03/10/26']);
    /* La barra blava de sempre: Tornar tanca l'article; Traduir, sense traductor. */
    expect([...pagina.querySelectorAll('header.bar-blue button')].map((b) => b.getAttribute('aria-label')))
      .toEqual(['Tornar arrere', 'Índex de secció', 'Traduir', 'Comentar', 'Compartir', 'Connectar']);
    const lectura = cosDelLector();
    expect(within(lectura).getByRole('heading', { level: 3, name: 'Recomanacions' })).toBeTruthy();
    expect(within(lectura).getAllByRole('listitem')).toHaveLength(3);
    await waitFor(() => expect(desat(idb)?.llegits).toEqual([id]));
  });

  /* Ordre del Mestre (261007) · «COMENTARIS = XAT» · Bloc 0 (261016): actualitzada a posta, la
     notícia ja no té targeta a la llista; Comentar i Connectar són els de la barra blava de la
     lectura. Una notícia no té xat públic, i el Connectar no compta a la telemetria. */
  test('a la lectura, Comentar obri el menú sense xat públic i el Connectar no compta a la telemetria', async () => {
    const vistos = [];
    const escolta = (event) => vistos.push(event.detail);
    window.addEventListener('sdp:telemetria', escolta);
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      munta('/app/lector/noticies/hui');
      await screen.findByRole('region', { name: 'Hui' });
      await obri(CORREFOC);
      const barra = document.getElementById('app-grid-main').querySelector('header.bar-blue');
      const comentar = within(barra).getByRole('button', { name: 'Comentar' });
      expect(comentar.getAttribute('aria-haspopup')).toBe('menu');
      fireEvent.click(comentar);
      const publica = within(screen.getByRole('menu')).getByRole('menuitem', { name: 'En públic' });
      expect(publica.getAttribute('aria-disabled')).toBe('true');
      const avisosAbans = avis.mock.calls.length;
      const abans = ubicacio();
      fireEvent.click(publica);
      expect(avis.mock.calls.slice(avisosAbans)).toEqual([]);
      expect(ubicacio()).toBe(abans);
      fireEvent.click(within(barra).getByRole('button', { name: 'Connectar' }));
      expect(ubicacio()).toMatch(/^\/connectar\?/);
      expect(vistos.filter((intent) => intent?.nom === 'connectar')).toEqual([]);
    } finally {
      window.removeEventListener('sdp:telemetria', escolta);
    }
  });

  test('«Tornar arrere» de la barra blava tanca l’article com l’aspa, i el focus torna a la fila', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await obri(CORREFOC);
    fireEvent.click(detall().getByRole('button', { name: 'Tornar arrere' }));
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    await waitFor(() => expect(document.activeElement).toBe(fitxa(CORREFOC)));
  });

  test('l’aspa tanca: el focus a la fila i «Nou» ja no hi és', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    expect(subtitolDe(CORREFOC)).toMatch(/ · Nou$/);
    await obri(CORREFOC);
    const aspa = detall().getByRole('button', { name: 'Tanca l’article' });
    /* Com a Feedly: l'aspa a l'esquerra de la barra, davant del nom de la font. */
    const nomFont = detall().getByText('Colla de Dimonis de la Font Vella', { selector: '.app-grid-col-header__titol' });
    expect(aspa.compareDocumentPosition(nomFont) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(aspa);
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    await waitFor(() => expect(document.activeElement).toBe(fitxa(CORREFOC)));
    expect(subtitolDe(CORREFOC)).toBe('Colla de Dimonis de la Font Vella · 11:30 03/10/26');
  });

  test('Esc també tanca, i arrere del navegador torna a la mateixa llista', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    const titol = await obri(ASSAIG);
    fireEvent.keyDown(titol, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(document.activeElement).toBe(fitxa(ASSAIG)));
    await obri(ASSAIG);
    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/festes'));
    await waitFor(() => expect(document.activeElement).toBe(fitxa(ASSAIG)));
  });

  /* Bloc 0 (261016) · Actualitzada a posta: «Marca-ho tot com a llegit» ja no és al mig amb la
     notícia oberta (és del detall sense notícia). Esc tanca igual des de l'arbre i la llista. */
  test('Esc tanca des de l’arbre, des de la llista i amb el focus perdut; no des d’un camp de text', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await obri(CORREFOC);
    /* Un camp de text dins de la closca: Esc és seu. */
    const camp = document.createElement('input');
    document.getElementById('app-grid-list').append(camp);
    fireEvent.keyDown(camp, { key: 'Escape' });
    camp.remove();
    expect(ubicacio()).toMatch(/[?&]article=/);
    /* Des d'una fila de l'arbre. */
    const esports = filaDeLArbre('Esports');
    esports.focus();
    fireEvent.keyDown(esports, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    /* Des d'una altra fila de la llista. */
    await obri(CORREFOC);
    const altra = fitxes().find((boto) => boto !== fitxa(CORREFOC));
    altra.focus();
    fireEvent.keyDown(altra, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    /* Amb el focus perdut (un clic on no s'enfoca res). */
    await obri(CORREFOC);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
  });

  /* Ordre del Mestre, 261004 (auditoria 0605, «Esc amb l'Índex de secció obert tanca el calaix i
     també l'article») · L'Índex és un diàleg modal pintat amb un portal fora de la closca, i el
     focus es queda al botó que l'ha obert (o al body, a Safari). Esc tanca només el que està obert
     més amunt: l'Índex. El següent Esc, ja sense diàleg, tanca l'article. */
  test('Esc amb l’Índex de secció obert tanca només l’Índex; el següent Esc, l’article', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await obri(CORREFOC);
    const index = detall().getByRole('button', { name: 'Índex de secció' });
    index.focus();
    fireEvent.click(index);
    expect(screen.getByRole('dialog', { name: 'Taula de continguts' })).toBeTruthy();
    fireEvent.keyDown(index, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
    expect(ubicacio()).toMatch(/[?&]article=/);
    /* Amb el focus perdut (el body), tampoc. */
    fireEvent.click(index);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
    expect(ubicacio()).toMatch(/[?&]article=/);
    /* Sense cap diàleg obert, Esc tanca l'article com sempre. */
    fireEvent.keyDown(index, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
  });

  /* Verificació «lector-nevera», D2 · Encastat a WordPress, el document és de l'amfitrió. Un modal
     seu (un bàner de galetes amagat però present, un <dialog> obert sense ser modal, un modal fora
     de la closca) no és l'Índex i no pot bloquejar Esc per sempre. Un diàleg modal propi, dins de
     la closca, sí que el bloqueja; amagat, no. */
  test('Esc: un diàleg de l’amfitrió, fora de la closca, no el bloqueja; un de propi i visible, sí', async () => {
    /* Un element amb atributs, sense HTML cru (qualitat de la plataforma). */
    const element = (etiqueta, atributs = {}, ...fills) => {
      const node = document.createElement(etiqueta);
      for (const [nom, valor] of Object.entries(atributs)) node.setAttribute(nom, valor);
      node.append(...fills);
      return node;
    };
    const MODAL = { role: 'dialog', 'aria-modal': 'true' };
    const amfitrio = element('div', {},
      element('div', { hidden: '' }, element('div', MODAL, 'Galetes')),
      element('dialog', { open: '' }, 'Avís de l’amfitrió'),
      element('div', MODAL, 'Modal de l’amfitrió'));
    const propi = element('div', MODAL);
    try {
      munta('/app/lector/noticies/hui');
      await screen.findByRole('region', { name: 'Hui' });
      await obri(CORREFOC);
      /* Un diàleg modal propi, dins de la closca: Esc és seu, també amb el focus perdut. */
      document.getElementById('app-grid-list').append(propi);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(ubicacio()).toMatch(/[?&]article=/);
      /* El mateix diàleg, amagat: ja no compta. */
      propi.hidden = true;
      document.body.append(amfitrio);
      fireEvent.keyDown(await titolDelLector(CORREFOC), { key: 'Escape' });
      expect(ubicacio()).toBe('/app/lector/noticies/hui');
      /* Amb els diàlegs de l'amfitrió al document i el focus perdut, Esc també tanca. */
      await obri(CORREFOC);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(ubicacio()).toBe('/app/lector/noticies/hui');
    } finally {
      amfitrio.remove();
      propi.remove();
    }
  });

  /* Ordre del Mestre, 261004 (auditoria 0605, «?seccio= de l'Índex sobreviu al tancament de
     l'article») · La secció que hi escriu l'Índex és de l'article: tancar-lo l'esborra, i la notícia
     següent no l'hereta (ni per a compartir-la ni en recarregar). jsdom no fa scroll: es registra. */
  test('la secció de l’Índex (?seccio=) és de l’article: tancar-lo l’esborra i la notícia següent no l’hereta', async () => {
    const scrollAbans = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView() {};
    try {
      munta('/app/lector/noticies/hui');
      await screen.findByRole('region', { name: 'Hui' });
      await obri(CORREFOC);
      const id = idDeLaUrl();
      fireEvent.click(detall().getByRole('button', { name: 'Índex de secció' }));
      const dialeg = screen.getByRole('dialog', { name: 'Taula de continguts' });
      fireEvent.click(within(dialeg).getByRole('button', { name: 'Recomanacions' }));
      expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${id}&seccio=recomanacions`);
      fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
      expect(ubicacio()).toBe('/app/lector/noticies/hui');
      const altra = fitxes().find((boto) => boto !== fitxa(CORREFOC));
      fireEvent.click(altra);
      expect(ubicacio()).toMatch(/^\/app\/lector\/noticies\/hui\?article=[^&]+$/);
      expect(idDeLaUrl()).not.toBe(id);
    } finally {
      Element.prototype.scrollIntoView = scrollAbans;
    }
  });

  /* Derogat pel Bloc 0 (ordre del Mestre, 261016) · La graella ja no comparteix el panell amb el
     lector: la llista és la seua columna de l'espai i obrir o tancar una notícia no la torna a
     pintar ni la desplaça. Abans es restaurava el scroll a mà; ara no se n'escriu cap. P2 de Codex
     (261016) · Només una altra carpeta o una altra font la torna a dalt (espaiNoticies.test.jsx):
     ací la llista és a 240 i, en obrir i tancar dins de «Hui», no s'hi escriu res. */
  test('obrir i tancar una notícia no mou el scroll de cap columna', async () => {
    const posa = vi.spyOn(Element.prototype, 'scrollTop', 'set');
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const llista = document.querySelector('#app-grid-list .sdp-workspace-column__body');
    llista.scrollTop = 240;
    posa.mockClear();
    await obri(CORREFOC);
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    await waitFor(() => expect(document.activeElement).toBe(fitxa(CORREFOC)));
    expect(posa).not.toHaveBeenCalled();
    expect(llista.scrollTop).toBe(240);
  });

  test('«Visita el lloc web» és un enllaç de veres a una pestanya nova, sense referent ni opener', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await obri(CORREFOC);
    const enllac = detall().getByRole('link', { name: 'Visita el lloc web (s’obri en una pestanya nova)' });
    expect(enllac.getAttribute('href')).toBe('https://example.org/colla-dimonis/correfoc-barranc');
    expect(enllac.getAttribute('target')).toBe('_blank');
    expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
    /* Tot enllaç del cos de la notícia ix a una pestanya nova, sense referent ni opener. */
    const delCos = within(cosDelLector()).getAllByRole('link');
    expect(delCos).toContain(enllac);
    for (const a of delCos) {
      expect(a.getAttribute('rel'), a.textContent).toBe('noopener noreferrer');
      expect(a.getAttribute('target'), a.textContent).toBe('_blank');
    }
    /* Fora del cos, l'únic enllaç és l'autoria de la boina (Pàgina Universal, ordre del Mestre del
       261004): una ruta de l'app, a les notícies de la font, mai una adreça de fora. */
    const fora = detall().getAllByRole('link').filter((a) => !delCos.includes(a));
    expect(fora.map((a) => a.getAttribute('href'))).toEqual(['/app/lector/noticies/festes/colla-dimonis']);
  });

  /* Bloc 0 (261016) · Actualitzada a posta: es revisen l'arbre, la llista i el detall (el que pinta
     el Lector dins de l'espai), no la graella que ja no hi és. Les classes de l'espai són de
     modules.css. El diàleg de la roda dentada és de l'espai i no del Lector: fora de l'abast. */
  test('Pedra Seca pura: cap style=, cap imatge de fora i cap classe que no existisca, a l’arbre, la llista i el lector', async () => {
    const conegudes = classesConegudes();
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const revisa = (arrel) => {
      expect(arrel.querySelectorAll('[style]')).toHaveLength(0);
      for (const img of arrel.querySelectorAll('img')) expect(img.getAttribute('src')).not.toMatch(/^(?:https?:)?\/\//);
      const classes = [...arrel.querySelectorAll('[class]')].flatMap((el) => [...el.classList]);
      expect(classes.length).toBeGreaterThan(5);
      expect(classes.filter((classe) => !conegudes.has(classe) && !classe.startsWith('lucide'))).toEqual([]);
    };
    const parts = () => [
      document.querySelector('#app-grid-sidebar nav.sdp-workspace-column__body'),
      document.getElementById('app-grid-list'),
      document.getElementById('app-grid-main')
    ];
    for (const part of parts()) revisa(part);
    await obri(CORREFOC);
    for (const part of parts()) revisa(part);
  });

  test('un article amb vídeos: l’avís de privacitat; i «Marca com a no llegit»', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await obri(ASSAIG);
    expect(detall().getByText('Imatges i vídeos a part')).toBeTruthy();
    expect(detall().getByText('Al final hi haurà coca i mistela.')).toBeTruthy();
    await waitFor(() => expect(recompteDe('Cultura i festes')).toBe('2'));
    fireEvent.click(detall().getByRole('button', { name: 'Marca com a no llegit' }));
    expect(recompteDe('Cultura i festes')).toBe('3');
  });

  /* Bloc 0 (261016) · Actualitzada a posta: el recompte de «Per a després» és el de les desades
     sense llegir (espaiNoticies.test.jsx); ací, que es desa al disc i s'hi llig. */
  test('«Desa per a després»: es desa al disc i la carpeta la porta', async () => {
    const { idb } = munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await obri(CORREFOC);
    const id = idDeLaUrl();
    const desa = detall().getByRole('button', { name: 'Desa per a després' });
    expect(desa.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(desa);
    expect(detall().getByRole('button', { name: 'Desa per a després' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(desat(idb)?.despres.map((d) => d.id)).toEqual([id]));
    fireEvent.click(filaDeLArbre('Per a després'));
    await screen.findByRole('region', { name: 'Per a després' });
    expect(fitxes().map((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent)).toEqual([CORREFOC]);
  });

  test('una notícia que la font ja no servix sencera es llig del resum, i ho diu', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    munta('/app/lector/noticies/festes', prepara({ adaptador: { ...llavor, article: async () => null } }));
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await obri(CORREFOC);
    expect(detall().getByText('Només el resum')).toBeTruthy();
    expect(detall().getByText(/^Enguany el correfoc eixirà de la Font Vella/)).toBeTruthy();
  });

  /* Verificació «lector-nevera», D3 (REGLA D'OR 1) · Una notícia desada d'una font que el port ja
     no servix: el lector no en coneix la font, però l'article sí que té autor. La boina el diu,
     sense enllaç, i mai «Sóc de Poble», que no l'ha escrita. L'autor és inventat. Bloc 0 (261016):
     actualitzada a posta, es comprova a la lectura (la fila, a espaiNoticies.test.jsx). */
  test('una notícia desada d’una font que ja no hi és: la boina diu l’autor de l’article, sense enllaç', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [primer] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    const adaptador = {
      ...llavor,
      llistaFonts: async () => {
        const { categories, fonts } = await llavor.llistaFonts();
        return { categories, fonts: fonts.filter((font) => font.id !== 'colla-dimonis') };
      },
      llistaArticles: async (opcions) => (await llavor.llistaArticles(opcions)).filter((article) => article.fontId !== 'colla-dimonis'),
      article: async () => null
    };
    const entorn = prepara({ adaptador });
    await entorn.magatzem.desa({ llegits: [], despres: [{ ...primer, autor: 'Redacció de la Colla' }], noSeguides: [] });
    munta('/app/lector/noticies/despres', entorn);
    await screen.findByRole('region', { name: 'Per a després' });
    await waitFor(() => expect(fitxa(CORREFOC)).toBeTruthy());
    const titol = await obri(CORREFOC);
    const boina = titol.closest('.sdp-universal-page-container').querySelector('section.bar-orange');
    expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Redacció de la Colla');
    expect(within(boina).queryByRole('link')).toBeNull();
    expect(boina.textContent).not.toMatch(/Sóc de Poble/);
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
    expect(await titolDelLector(CORREFOC)).toBeTruthy();
  });
});

describe('les fonts que se seguixen', () => {
  /* Bloc 0 (261016) · Actualitzada a posta la segona meitat: «Hui» és la llista de l'espai, i la
     categoria sense cap font seguida no porta recompte a l'arbre (ni la font, que ja no hi és).
     Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, la gestió de fonts és el
     diàleg de l'arbre («Gestiona les fonts»), amb un interruptor per font, i no el catàleg en
     targetes de /fonts. Apagar-ne una es desa i «Hui» ja no en porta, com abans; ara la font
     continua a l'arbre, marcada («· apagada»), per a tornar-la a encendre. */
  test('la gestió de l’arbre: totes seguides; apagar-ne una es desa, «Hui» ja no en porta i l’arbre la marca', async () => {
    const { idb } = munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(fitxes()).toHaveLength(6));
    fireEvent.click(screen.getByRole('button', { name: 'Gestiona les fonts' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Gestiona les fonts' });
    const interruptors = within(dialeg).getAllByRole('switch');
    expect(interruptors.length).toBe(5);
    expect(interruptors.every((interruptor) => interruptor.getAttribute('aria-checked') === 'true')).toBe(true);
    /* Cap targeta ni boina: els interruptors de Pedra Seca, per carpetes. */
    expect(dialeg.querySelectorAll('.sp-card, .sp-card-header, .sdp-card-llista')).toHaveLength(0);
    expect(within(dialeg).getByRole('group', { name: 'Camp i temps' })).toBeTruthy();
    fireEvent.click(within(dialeg).getByRole('switch', { name: 'Cooperativa de l’Horta Vella' }));
    expect(within(dialeg).getByRole('switch', { name: 'Cooperativa de l’Horta Vella' }).getAttribute('aria-checked')).toBe('false');
    await waitFor(() => expect(desat(idb)?.noSeguides).toEqual(['cooperativa']));
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' }));
    await waitFor(() => expect(fitxes()).toHaveLength(5));
    expect(recompteDe('Camp i temps')).toBeNull();
    fireEvent.click(filaDeLArbre('Camp i temps'));
    await screen.findByRole('region', { name: 'Camp i temps' });
    const apagada = filaDeLArbre('Cooperativa de l’Horta Vella · apagada');
    expect(apagada.querySelector('svg').getAttribute('class')).toMatch(/lucide-eye-off/);
    /* Triar-la a l'arbre diu que no se seguix i la torna a encendre des del detall. */
    fireEvent.click(apagada);
    await screen.findByRole('region', { name: 'Cooperativa de l’Horta Vella' });
    expect(detall().getByText('No seguixes esta font')).toBeTruthy();
    expect(mig().getByText('No seguixes esta font.')).toBeTruthy();
    fireEvent.click(detall().getByRole('button', { name: 'Torna a seguir-la' }));
    await waitFor(() => expect(desat(idb)?.noSeguides).toEqual([]));
    await waitFor(() => expect(fitxes().length).toBeGreaterThan(0));
    expect(filaDeLArbre('Cooperativa de l’Horta Vella')).toBeTruthy();
    /* I seguida, el detall l'apaga a les eines. */
    expect(detall().getByRole('button', { name: 'Deixa de seguir-la' })).toBeTruthy();
  });
});

/* REGLA D'OR 1 (ordre del Mestre, 261004) · Cada targeta del catàleg de fonts portava la boina.
   Derogada a posta (261024 Lector): ordre del Mestre de les 15:05, «adeu a la pàgina inflada de
   /app/lector/fonts», i Gemini G2-01 (dotze .sp-card amb boina taronja). El catàleg en targetes ja
   no hi és; ací es prova el que en queda: l'enllaç vell porta a les notícies, sense cap pas
   d'historial, i no hi ha cap targeta ni cap boina enlloc. */
describe('l’enllaç vell de la gestió de fonts', () => {
  test.each(['/app/lector/fonts', '/app/lector/fonts/colleccio'])('%s porta a /app/lector/noticies (replace), sense cap targeta', async (vell) => {
    munta(vell);
    const abans = window.history.length;
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies'));
    expect(window.history.length).toBe(abans);
    await screen.findByRole('region', { name: 'Hui' });
    expect(document.querySelectorAll('.sp-card, .sp-card-header, .sdp-card-llista, .sdp-card-grid')).toHaveLength(0);
  });

  test('un camí de notícies que no casa: el text de la pàgina inexistent i el camí a les notícies', async () => {
    munta('/app/lector/noticies/hui/veu-placa/sobrant');
    expect(await screen.findByText('Esta pàgina de l’app no existix')).toBeTruthy();
    expect(screen.getByText('Pot ser que l’enllaç siga antic o estiga mal copiat.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ves a les notícies' }).getAttribute('href')).toBe('/app/lector/noticies');
  });
});

/* Bloc 0 (261016) · Derogades les tres proves de l'obridor «Carpetes» i de «Torna» (les
   columnes del 261004): en mitjana la navegació és el rail de l'espai, que en desplega el panell
   (espaiNoticies.test.jsx). La regla d'Esc amb un panell obert per damunt continua. */
describe('en mitjana (800 px): la navegació en rail i la llista al costat', () => {
  beforeEach(() => { ambAmplada(800); });

  test('amb el panell de la navegació obert, Esc no tanca l’article que queda davall', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    await obri(CORREFOC);
    const expandir = document.querySelector('#app-grid-sidebar button[aria-controls="app-grid-sidebar"]');
    fireEvent.click(expandir);
    await waitFor(() => expect(closca().dataset.panell).toBe('left'));
    fireEvent.keyDown(filaDeLArbre('Esports'), { key: 'Escape' });
    expect(ubicacio()).toMatch(/[?&]article=/);
  });
});

/* Peça C (ordre del Mestre, 261007, prompt 261007_1628) · «Ara» es llig una
   vegada per ruta (camí i consulta), no a cada pintada: abans el rellotge es
   cridava a cada render i el context de les vistes era sempre nou. Un canvi
   d'estat sense navegar no el torna a llegir; canviar de ruta, sí. És el
   canvi acceptat de la diagnosi: «Hui» no avança fins a una navegació. */
describe('l’instant de la vista', () => {
  test('el rellotge es llig en arribar a una ruta i no a cada pintada', async () => {
    const { magatzem, font } = prepara();
    const rellotge = vi.fn(() => ARA);
    const App = () => <AppLector magatzem={magatzem} font={font} ara={rellotge} />;
    munta('/app/lector/noticies/hui', { registre: creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] }) });
    await screen.findByRole('region', { name: 'Hui' });
    expect(rellotge).toHaveBeenCalledTimes(1);
    /* Un canvi d'estat sense navegar: tornar a pintar no torna a llegir el rellotge. Bloc 0
       (261016): «Marca-ho tot com a llegit» és al detall sense notícia, no al mig. */
    fireEvent.click(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }));
    expect(recompteDe('Hui')).toBeNull();
    expect(rellotge).toHaveBeenCalledTimes(1);
    /* Una ruta nova, un instant nou. */
    fireEvent.click(filaDeLArbre('Cultura i festes'));
    await screen.findByRole('region', { name: 'Cultura i festes' });
    expect(rellotge).toHaveBeenCalledTimes(2);
    /* Encàrrec F del Gauntlet (261016) · Obrir i tancar una notícia no és una llista nova. */
    await obri(CORREFOC);
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    expect(rellotge).toHaveBeenCalledTimes(2);
  });

  /* Encàrrec F del Gauntlet (261016, P3) · L'instant es renovava també amb la consulta: obrir una
     notícia (?article=) tornava a llegir el rellotge. Amb la pestanya oberta prou temps, la que
     tocava la persona ja passava de les 24 h, perdia «Hui» i l'espai, reconciliant, la portava a
     la seua categoria (replace), mentre «Hui» s'encongia davall d'ella. Ara l'instant és el de la
     llista (el camí): la notícia s'obri a «Hui» i la llista no es mou. */
  test('obrir la notícia més vella de «Hui» quan ja passa de les 24 h: es queda a «Hui», i la llista també', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const deHui = (await llavor.llistaArticles()).filter((article) => esDeHui(article, ARA));
    expect(deHui).toHaveLength(6);
    const mesVella = deHui.reduce((a, b) => (msDeData(a.data) <= msDeData(b.data) ? a : b));
    /* L'instant següent deixa la més vella un minut fora de la finestra de «Hui». */
    const mesTard = msDeData(mesVella.data) + FINESTRA_HUI + 60 * 1000;
    expect(esDeHui(mesVella, mesTard)).toBe(false);
    const { magatzem, font } = prepara();
    const rellotge = vi.fn().mockReturnValueOnce(ARA).mockReturnValue(mesTard);
    const App = () => <AppLector magatzem={magatzem} font={font} ara={rellotge} />;
    munta('/app/lector/noticies/hui', { registre: creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] }) });
    await screen.findByRole('region', { name: 'Hui' });
    expect(fitxes()).toHaveLength(6);
    const titol = senseFinal(mesVella.titol);
    await obri(titol);
    await act(async () => {});
    expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${mesVella.id}`);
    expect(filaDeLArbre('Hui').getAttribute('aria-current')).toBe('page');
    expect(fitxes()).toHaveLength(6);
    expect(rellotge).toHaveBeenCalledTimes(1);
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    expect(fitxes()).toHaveLength(6);
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

  /* Ordre del Mestre, 261016 (prompt 261016_0015, Bloc 0, «Purga de Mocks») · Abans el servidor de
     desenvolupament encenia la llavor tot sol i /app/lector/noticies ensenyava titulars inventats.
     Ara, sense el literal EXACTE, el Lector de desenvolupament és el de producció: l'estat buit
     honest, cap closca i cap titular de la llavor. Un valor que no és '1' no l'encén. */
  test.each([[''], ['0'], ['true'], ['1 ']])('Purga de Mocks · en desenvolupament amb VITE_SDP_LECTOR_LLAVOR=%j: cap notícia fictícia', async (valor) => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_SDP_LECTOR_LLAVOR', valor);
    vi.resetModules();
    try {
      const { default: AppDeDesenvolupament, destinacioEnllac } = await import('./AppLector.jsx');
      render(<AppDeDesenvolupament />);
      expect(screen.getByText('Encara no hi ha cap font connectada')).toBeTruthy();
      expect(screen.getByText('Quan el poble connecte les seues fonts de notícies, les llegiràs ací.')).toBeTruthy();
      expect(document.querySelector('.app-grid-shell')).toBeNull();
      for (const inventat of ['El ple aprova la reforma del llavador vell', CORREFOC, ASSAIG, 'La Veu de la Plaça', 'Cultura i festes']) {
        expect(document.body.textContent, inventat).not.toContain(inventat);
      }
      /* Sense port, cap destinació per al Snippet Curador (correcció SN-R1). */
      expect(destinacioEnllac).toBeNull();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
